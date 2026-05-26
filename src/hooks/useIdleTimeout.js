/**
 * ══════════════════════════════════════════════════════════════════
 * IDLE TIMEOUT HOOK — Sécurité Session
 * ══════════════════════════════════════════════════════════════════
 *
 * FIX AUDIT P0 — Absence de session idle timeout
 * AVANT : Session ouverte indéfiniment → accès non révoqué
 * APRÈS : Auto-logout après IDLE_MINUTES d'inactivité complète
 *
 * Événements surveillés : mousemove, keydown, mousedown, touchstart, scroll
 * Chaque interaction reset le timer.
 * À T-60s : toast d'avertissement affiché
 * À T=0    : logout propre + redirect login
 */

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { useToastStore } from '../store/useToastStore';
import logger from '../utils/logger';

/** Durée d'inactivité avant logout (minutes) */
const IDLE_MINUTES = Number(import.meta.env.VITE_IDLE_TIMEOUT_MIN ?? 20);
const IDLE_MS      = IDLE_MINUTES * 60 * 1_000;
const WARN_BEFORE  = 60_000; // Avertissement 60s avant expiration

const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown',
  'touchstart', 'scroll', 'click', 'focus',
];

export function useIdleTimeout({ enabled = true } = {}) {
  const logout      = useStore(s => s.logout);
  const currentUser = useStore(s => s.currentUser);
  const addToast    = useToastStore(s => s.addToast);

  const logoutTimer  = useRef(null);
  const warnTimer    = useRef(null);
  const warnedRef    = useRef(false);

  const clearTimers = useCallback(() => {
    clearTimeout(logoutTimer.current);
    clearTimeout(warnTimer.current);
  }, []);

  const handleLogout = useCallback(async () => {
    logger.info('[IdleTimeout] Session expirée — déconnexion automatique');
    clearTimers();
    await logout();
    // Soft reload pour réinitialiser l'état React complet
    window.location.href = '/';
  }, [logout, clearTimers]);

  const resetTimer = useCallback(() => {
    if (!enabled || !currentUser?.id) return;
    clearTimers();
    warnedRef.current = false;

    // Avertissement T-60s
    warnTimer.current = setTimeout(() => {
      if (warnedRef.current) return;
      warnedRef.current = true;
      addToast(
        `⚠️ Inactivité détectée — déconnexion automatique dans 60 secondes.`,
        'warning',
        8000
      );
    }, IDLE_MS - WARN_BEFORE);

    // Logout à T=0
    logoutTimer.current = setTimeout(handleLogout, IDLE_MS);
  }, [enabled, currentUser?.id, clearTimers, handleLogout, addToast]);

  useEffect(() => {
    if (!enabled || !currentUser?.id) {
      clearTimers();
      return;
    }

    // Démarrer le timer initial
    resetTimer();

    // Attacher les écouteurs d'activité
    const handler = () => resetTimer();
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, handler, { passive: true }));

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, handler));
    };
  }, [enabled, currentUser?.id, resetTimer, clearTimers]);

  return { resetTimer };
}
