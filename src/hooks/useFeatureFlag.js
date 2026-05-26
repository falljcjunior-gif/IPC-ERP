/**
 * ══════════════════════════════════════════════════════════════
 * useFeatureFlag — Firebase Remote Config feature flags
 * ══════════════════════════════════════════════════════════════
 *
 * Usage :
 *   const isEnabled = useFeatureFlag('ai_forecasting');
 *   const { value, isLoading } = useFeatureFlag('beta_dashboard', { detailed: true });
 *
 * Flags configurés sur Firebase Remote Config console :
 *   ai_forecasting          → boolean
 *   beta_dashboard          → boolean
 *   max_export_rows         → number (défaut: 10000)
 *   maintenance_banner_msg  → string (vide = pas de bannière)
 *   slo_tracing_enabled     → boolean
 *   new_crm_ui              → boolean
 *   webrtc_stats_interval   → number (ms, défaut: 10000)
 */

import { useState, useEffect, useCallback } from 'react';
import { getRemoteConfig, fetchAndActivate, getValue, isSupported } from 'firebase/remote-config';
import { app } from '../firebase/config';
import logger from '../utils/logger';

// ── Valeurs par défaut (fallback si Remote Config indisponible) ──────────────
const DEFAULTS = {
  ai_forecasting:          false,
  beta_dashboard:          false,
  max_export_rows:         10000,
  maintenance_banner_msg:  '',
  slo_tracing_enabled:     false,
  new_crm_ui:              false,
  webrtc_stats_interval:   10000,
  virtual_list_threshold:  50,
  sentry_enabled:          true,
  api_rate_limit_burst:    20,
};

// ── Singleton Remote Config ──────────────────────────────────────────────────
let _rc        = null;
let _fetchedAt = 0;
let _pending   = null;      // Promise en cours

const TTL_MS   = 5 * 60 * 1000;   // 5 min min entre 2 fetches (quota RC)
const DEV_TTL  = 60 * 1000;       // 1 min en dev

const getRC = async () => {
  if (!(await isSupported())) return null;

  if (!_rc) {
    _rc = getRemoteConfig(app);
    _rc.defaultConfig = DEFAULTS;
    _rc.settings.minimumFetchIntervalMillis =
      import.meta.env.DEV ? DEV_TTL : TTL_MS;
  }

  const now  = Date.now();
  const ttl  = import.meta.env.DEV ? DEV_TTL : TTL_MS;

  if (now - _fetchedAt < ttl) return _rc;   // encore frais

  // Dédupliquer les fetches simultanés
  if (!_pending) {
    _pending = fetchAndActivate(_rc)
      .then(() => { _fetchedAt = Date.now(); })
      .catch(err => logger.warn('[RemoteConfig] fetch failed:', err.message))
      .finally(() => { _pending = null; });
  }

  await _pending;
  return _rc;
};

// ── parseValue : convertit la valeur RC selon le type du défaut ───────────────
const parseValue = (key, rawValue) => {
  const def = DEFAULTS[key];
  if (rawValue === undefined || rawValue === null) return def ?? null;

  const asString = String(rawValue);
  if (typeof def === 'boolean') return asString === 'true' || asString === '1';
  if (typeof def === 'number')  return Number(asString);
  return asString;
};

// ── useFeatureFlag (boolean / simple mode) ───────────────────────────────────
/**
 * @param {string}  key     - clé Remote Config
 * @param {object}  [opts]
 * @param {boolean} [opts.detailed=false] - true → retourne { value, isLoading, error, refresh }
 * @returns {boolean | { value, isLoading, error, refresh }}
 */
const useFeatureFlag = (key, opts = {}) => {
  const { detailed = false } = opts;

  const defaultVal = DEFAULTS[key] ?? false;
  const [value,     setValue]     = useState(defaultVal);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const rc = await getRC();
      if (!rc) {
        setValue(defaultVal);
        return;
      }
      const raw = getValue(rc, key);
      setValue(parseValue(key, raw?.asString?.() ?? raw));
    } catch (err) {
      logger.warn(`[FeatureFlag] failed to load "${key}":`, err.message);
      setError(err);
      setValue(defaultVal);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  useEffect(() => { load(); }, [load]);

  if (detailed) return { value, isLoading, error, refresh: load };
  return value;
};

// ── useFeatureFlags (multi-clés) ──────────────────────────────────────────────
/**
 * @param {string[]} keys
 * @returns {{ flags: Record<string, any>, isLoading: boolean }}
 */
export const useFeatureFlags = (keys) => {
  const [flags,     setFlags]     = useState(() =>
    Object.fromEntries(keys.map(k => [k, DEFAULTS[k] ?? false]))
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rc = await getRC();
        if (!rc || cancelled) return;
        const result = {};
        keys.forEach(k => {
          const raw = getValue(rc, k);
          result[k] = parseValue(k, raw?.asString?.() ?? raw);
        });
        if (!cancelled) setFlags(result);
      } catch (err) {
        logger.warn('[FeatureFlags] multi-load failed:', err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [keys.join(',')]); // eslint-disable-line

  return { flags, isLoading };
};

export default useFeatureFlag;
