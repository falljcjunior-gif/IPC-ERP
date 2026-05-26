// IPC ERP CORE BOOT - FORCED RELOAD HEARTBEAT: 2026-04-26 20:17
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'

// ── [FIX AUDIT P1] Sentry Error Tracking ─────────────────────────────────
// AVANT : les erreurs production sont silencieuses — MTTR = 4-8h (détection manuelle)
// APRÈS : capture automatique → MTTR cible < 15 min (alerte immédiate)
// Config : VITE_SENTRY_DSN dans .env.production
import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PROD = import.meta.env.PROD;

if (SENTRY_DSN && IS_PROD) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE || 'production',
    release: `ipc-erp@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    // Capture 20% des transactions performance en prod (contrôle coûts)
    tracesSampleRate: 0.2,
    // Capture 100% des replays d'erreurs (sessions avec erreur uniquement)
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,
    // Intégrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,    // RGPD : masquer le texte dans les replays
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
      // Supprimer l'email utilisateur des breadcrumbs
      if (event.user?.email) {
        event.user.email = '[filtered]';
      }
      return event;
    },
  });
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
