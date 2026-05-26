// IPC ERP CORE BOOT - FORCED RELOAD HEARTBEAT: 2026-04-26 20:17
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'

// ── [FIX AUDIT P1+P4] Sentry Error Tracking avec respect du consentement RGPD ─
// AVANT : Sentry s'initialisait immédiatement sans vérifier le consentement utilisateur
// APRÈS : Sentry ne démarre que si l'utilisateur a accepté les cookies analytiques
//         (via ConsentBanner → event 'ipc:consent')
// Config : VITE_SENTRY_DSN dans .env.production
import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PROD    = import.meta.env.PROD;

let _sentryInitialized = false;

const initSentry = () => {
  if (_sentryInitialized || !SENTRY_DSN || !IS_PROD) return;
  _sentryInitialized = true;

  Sentry.init({
    dsn:         SENTRY_DSN,
    environment: import.meta.env.MODE || 'production',
    release:     `ipc-erp@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    // Capture 20% des transactions performance en prod (contrôle coûts)
    tracesSampleRate:          0.2,
    // Capture 100% des replays d'erreurs (sessions avec erreur uniquement)
    replaysOnErrorSampleRate:  1.0,
    replaysSessionSampleRate:  0.05,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText:  true,   // RGPD : masquer le texte dans les replays
        blockAllMedia: true,
      }),
    ],
    // Ne pas capturer les erreurs connues non-critiques
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection',
      'ChunkLoadError',
      'Loading chunk',
    ],
    // Avant envoi : anonymiser les données personnelles
    beforeSend(event) {
      if (event.user?.email) event.user.email = '[filtered]';
      return event;
    },
  });
};

// Écouter le consentement RGPD (émis par ConsentBanner après choix utilisateur)
if (typeof window !== 'undefined') {
  window.addEventListener('ipc:consent', (evt) => {
    if (evt.detail?.analytics === true) {
      initSentry();
    }
  });

  // Cas : consentement déjà stocké depuis une session précédente
  try {
    const stored = localStorage.getItem('ipc_consent_v1');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.analytics === true && parsed?.expiresAt > Date.now()) {
        initSentry();
      }
    }
  } catch { /* localStorage non disponible */ }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
