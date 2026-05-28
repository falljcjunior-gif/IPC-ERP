/**
 * ══════════════════════════════════════════════════════════════
 * useSLO — Service Level Objectives / Indicators (frontend)
 * ══════════════════════════════════════════════════════════════
 *
 * Instrumente les interactions clés pour mesurer :
 *   - LCP  (Largest Contentful Paint)
 *   - FID  (First Input Delay) via INP (Interaction to Next Paint)
 *   - CLS  (Cumulative Layout Shift)
 *   - TTFB (Time To First Byte)
 *   - API latency P50 / P95 / P99
 *   - Error rate par module
 *   - Firebase operation latency
 *
 * Les métriques sont envoyées à /slo_metrics/{session} dans Firestore
 * (si le consentement analytique est accordé)
 *
 * Usage :
 *   const { trace, recordError, getMetrics } = useSLO('CRM');
 *   const end = trace('loadContacts');
 *   await fetchContacts();
 *   end(); // enregistre la latence
 */

import { useRef, useEffect, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import logger from '../utils/logger';

// ── Session ID (persisté sur la durée de la session navigateur) ───────────────
const SESSION_ID = (() => {
  try {
    let id = sessionStorage.getItem('ipc_slo_session');
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('ipc_slo_session', id);
    }
    return id;
  } catch { return `session-${Math.random().toString(36).slice(2)}`; }
})();

// ── Vérifie le consentement analytique ───────────────────────────────────────
const hasAnalyticsConsent = () => {
  try {
    const stored = localStorage.getItem('ipc_consent_v1');
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return parsed?.analytics === true && parsed?.expiresAt > Date.now();
  } catch { return false; }
};

// ── Buffer local (flush toutes les 30s ou quand > 50 entrées) ─────────────────
const _buffer = [];
const FLUSH_INTERVAL = 30_000;
const FLUSH_THRESHOLD = 50;
let _flushTimer = null;

const flushBuffer = async () => {
  if (_buffer.length === 0 || !hasAnalyticsConsent()) return;

  const batch = _buffer.splice(0, FLUSH_THRESHOLD);
  try {
    await setDoc(
      doc(db, 'slo_metrics', SESSION_ID),
      {
        sessionId:  SESSION_ID,
        metrics:    batch,
        updatedAt:  serverTimestamp(),
        userAgent:  navigator.userAgent.slice(0, 150),
        connection: navigator?.connection?.effectiveType || 'unknown',
      },
      { merge: true }
    );
  } catch (err) {
    logger.warn('[SLO] flush failed:', err.message);
    // Remettre les métriques dans le buffer pour retry
    _buffer.unshift(...batch);
  }
};

const scheduleFlush = () => {
  if (_flushTimer) return;
  _flushTimer = setInterval(flushBuffer, FLUSH_INTERVAL);
};

// ── Mesures Web Vitals (one-time au boot) ─────────────────────────────────────
let _vitalsRecorded = false;
const recordWebVitals = () => {
  if (_vitalsRecorded || typeof PerformanceObserver === 'undefined') return;
  _vitalsRecorded = true;

  // LCP
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last    = entries[entries.length - 1];
      _buffer.push({ metric: 'LCP', value: Math.round(last.startTime), unit: 'ms', ts: Date.now() });
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (_e) { /* PerformanceObserver not supported */ }

  // CLS
  try {
    let cls = 0;
    new PerformanceObserver((list) => {
      list.getEntries().forEach(e => {
        if (!e.hadRecentInput) cls += e.value;
      });
      _buffer.push({ metric: 'CLS', value: Math.round(cls * 1000) / 1000, unit: 'score', ts: Date.now() });
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (_e) { /* PerformanceObserver not supported */ }

  // TTFB
  try {
    new PerformanceObserver((list) => {
      list.getEntries().forEach(e => {
        if (e.name === location.href) {
          _buffer.push({ metric: 'TTFB', value: Math.round(e.responseStart), unit: 'ms', ts: Date.now() });
        }
      });
    }).observe({ type: 'navigation', buffered: true });
  } catch (_e) { /* PerformanceObserver not supported */ }

  // INP (Interaction to Next Paint — remplace FID)
  try {
    let maxInp = 0;
    new PerformanceObserver((list) => {
      list.getEntries().forEach(e => {
        if (e.duration > maxInp) {
          maxInp = e.duration;
          _buffer.push({ metric: 'INP', value: Math.round(e.duration), unit: 'ms', ts: Date.now() });
        }
      });
    }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  } catch (_e) { /* PerformanceObserver not supported */ }
};

// ── Hook principal ────────────────────────────────────────────────────────────
const useSLO = (moduleName = 'unknown') => {
  const tracesRef = useRef({});

  useEffect(() => {
    scheduleFlush();
    recordWebVitals();
    return () => { /* ne pas stopper le timer global */ };
  }, []);

  /**
   * Démarre une trace de latence.
   * @returns {Function} endFn — appeler pour terminer la trace
   */
  const trace = useCallback((operationName) => {
    const key   = `${moduleName}:${operationName}`;
    const start = performance.now();
    tracesRef.current[key] = start;

    return (extraData = {}) => {
      const duration = Math.round(performance.now() - start);
      delete tracesRef.current[key];

      _buffer.push({
        metric: 'latency',
        module: moduleName,
        op:     operationName,
        value:  duration,
        unit:   'ms',
        ts:     Date.now(),
        ...extraData,
      });

      if (_buffer.length >= FLUSH_THRESHOLD) flushBuffer();

      // Log dev
      if (import.meta.env.DEV) {
        const color = duration < 200 ? '32' : duration < 1000 ? '33' : '31';
        logger.info(`[SLO] \x1b[${color}m${key}: ${duration}ms\x1b[0m`);
      }

      return duration;
    };
  }, [moduleName]);

  /**
   * Enregistre une erreur avec contexte module
   */
  const recordError = useCallback((errorCode, message = '') => {
    _buffer.push({
      metric: 'error',
      module: moduleName,
      code:   errorCode,
      msg:    message.slice(0, 200),
      ts:     Date.now(),
    });
    if (_buffer.length >= FLUSH_THRESHOLD) flushBuffer();
  }, [moduleName]);

  /**
   * Enregistre un événement de performance custom
   */
  const recordMetric = useCallback((name, value, unit = 'ms', extra = {}) => {
    _buffer.push({
      metric: name,
      module: moduleName,
      value,
      unit,
      ts: Date.now(),
      ...extra,
    });
  }, [moduleName]);

  /**
   * Retourne les métriques en buffer (dev/debug)
   */
  const getBufferedMetrics = useCallback(() => [..._buffer], []);

  return { trace, recordError, recordMetric, getBufferedMetrics };
};

export default useSLO;
