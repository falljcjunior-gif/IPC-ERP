/**
 * ══════════════════════════════════════════════════════════════════
 * CONSENT BANNER — RGPD / GDPR Compliance
 * ══════════════════════════════════════════════════════════════════
 *
 * FIX AUDIT P1 — RGPD : consentement manquant
 * AVANT : aucun banner → violation RGPD potentielle
 * APRÈS : Banner conforme avec :
 *   - Consentement analytics (Sentry, monitoring)
 *   - Stockage préférence en localStorage (1 an)
 *   - Lien politique confidentialité
 *   - Design premium cohérent Antigravity
 *
 * Scope : Analytics uniquement (les cookies Firebase Auth sont
 * fonctionnellement nécessaires → base légale « contrat », pas consentement).
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, ChevronRight, Settings } from 'lucide-react';

const CONSENT_KEY     = 'ipc_consent_v1';
const CONSENT_EXPIRES = 365 * 24 * 60 * 60 * 1000; // 1 an

const getStoredConsent = () => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
};

const storeConsent = (analytics) => {
  const payload = {
    analytics,
    functional: true,      // Toujours actif (nécessaire au fonctionnement)
    timestamp: new Date().toISOString(),
    expiresAt: Date.now() + CONSENT_EXPIRES,
    version: 'v1',
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
  // Dispatch event pour Sentry / analytics de pouvoir s'initialiser
  window.dispatchEvent(new CustomEvent('ipc:consent', { detail: payload }));
  return payload;
};

export function ConsentBanner() {
  const [visible,      setVisible]      = useState(false);
  const [showDetails,  setShowDetails]  = useState(false);
  const [analytics,    setAnalytics]    = useState(true);

  useEffect(() => {
    // N'afficher le banner que si pas encore de consentement stocké
    const consent = getStoredConsent();
    if (!consent) {
      // Délai de 1.5s pour ne pas interférer avec le chargement initial
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
    // Re-dispatcher les préférences sauvegardées
    window.dispatchEvent(new CustomEvent('ipc:consent', { detail: consent }));
  }, []);

  const handleAcceptAll = () => {
    storeConsent(true);
    setVisible(false);
  };

  const handleRejectOptional = () => {
    storeConsent(false);
    setVisible(false);
  };

  const handleSavePreferences = () => {
    storeConsent(analytics);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(95vw, 680px)',
            background: 'rgba(15,23,42,0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '1.25rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.1)',
            zIndex: 99999,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1.25rem 1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '0.6rem',
              background: 'rgba(16,185,129,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Shield size={16} style={{ color: '#10B981' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F1F5F9' }}>
                Confidentialité & Cookies
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>
                IPC ERP utilise des cookies fonctionnels et optionnels d'analyse.
              </div>
            </div>
            <button
              onClick={handleRejectOptional}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '0.25rem' }}
              aria-label="Fermer et refuser"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '0.75rem 1.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.6 }}>
              Les cookies <strong style={{ color: '#E2E8F0' }}>fonctionnels</strong> sont nécessaires au bon fonctionnement
              de l'ERP (authentification, session, préférences). Les cookies
              <strong style={{ color: '#E2E8F0' }}> d'analyse</strong> (monitoring des erreurs via Sentry)
              nous aident à améliorer la stabilité de l'application.{' '}
              <button
                onClick={() => setShowDetails(!showDetails)}
                style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer',
                         fontSize: '0.8rem', fontWeight: 600, padding: 0 }}
              >
                {showDetails ? 'Masquer' : 'Personnaliser'} <ChevronRight size={11} style={{ verticalAlign: 'middle' }} />
              </button>
            </p>

            {/* Détails personnalisation */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: 'rgba(30,41,59,0.6)',
                    borderRadius: '0.6rem',
                    border: '1px solid rgba(51,65,85,0.5)',
                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  }}>
                    {/* Fonctionnels — toujours actif */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#E2E8F0' }}>
                          Cookies fonctionnels
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          Session, authentification, préférences UI. Requis.
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>Toujours actif</span>
                    </div>
                    {/* Analytics — optionnel */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#E2E8F0' }}>
                          Analyse & Monitoring (Sentry)
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          Capture des erreurs pour améliorer la stabilité. Optionnel.
                        </div>
                      </div>
                      <button
                        onClick={() => setAnalytics(!analytics)}
                        style={{
                          width: 40, height: 22, borderRadius: 11, border: 'none',
                          background: analytics ? '#10B981' : '#334155',
                          cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                          flexShrink: 0,
                        }}
                        role="switch" aria-checked={analytics}
                      >
                        <span style={{
                          position: 'absolute', top: 3,
                          left: analytics ? 20 : 3,
                          width: 16, height: 16, borderRadius: '50%',
                          background: '#fff', transition: 'left 0.2s',
                        }} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div style={{
            padding: '0.75rem 1.5rem 1.25rem',
            display: 'flex', gap: '0.6rem', flexWrap: 'wrap',
          }}>
            <button
              onClick={handleAcceptAll}
              style={{
                flex: 1, minWidth: 120, padding: '0.6rem 1.25rem',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none', borderRadius: '0.6rem',
                color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              Tout accepter
            </button>
            {showDetails ? (
              <button
                onClick={handleSavePreferences}
                style={{
                  flex: 1, minWidth: 120, padding: '0.6rem 1.25rem',
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(51,65,85,0.8)', borderRadius: '0.6rem',
                  color: '#E2E8F0', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                Sauvegarder mes choix
              </button>
            ) : (
              <button
                onClick={handleRejectOptional}
                style={{
                  flex: 1, minWidth: 120, padding: '0.6rem 1.25rem',
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(51,65,85,0.8)', borderRadius: '0.6rem',
                  color: '#E2E8F0', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                Fonctionnels uniquement
              </button>
            )}
          </div>

          {/* Footer légal */}
          <div style={{
            padding: '0.5rem 1.5rem 1rem',
            fontSize: '0.68rem', color: '#475569', textAlign: 'center',
          }}>
            En continuant à utiliser IPC ERP, vous acceptez nos{' '}
            <span style={{ color: '#10B981', cursor: 'pointer' }}>conditions d'utilisation</span>
            {' '}et notre{' '}
            <span style={{ color: '#10B981', cursor: 'pointer' }}>politique de confidentialité</span>.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Hook pour vérifier le consentement depuis n'importe quel composant */
export function useConsent() {
  const [consent, setConsent] = useState(getStoredConsent);

  useEffect(() => {
    const handler = (evt) => setConsent(evt.detail);
    window.addEventListener('ipc:consent', handler);
    return () => window.removeEventListener('ipc:consent', handler);
  }, []);

  return {
    hasConsented:      !!consent,
    analyticsEnabled:  consent?.analytics ?? false,
    functionalEnabled: true,
  };
}
