/**
 * ══════════════════════════════════════════════════════════════════
 * SECRETS — Cloud Secret Manager (Firebase Functions v2)
 * ══════════════════════════════════════════════════════════════════
 *
 * AVANT : process.env.GEMINI_API_KEY, process.env.RESEND_API_KEY…
 *         → Secrets stockés en clair dans les env vars du runner CI
 *         → Visibles dans les logs Firebase Console
 *
 * APRÈS : defineSecret() — Google Cloud Secret Manager
 *         → Chiffrement AES-256 au repos
 *         → Accès IAM-contrôlé (seules les CF autorisées peuvent lire)
 *         → Rotation sans redéploiement
 *         → Audit trail complet dans Cloud Audit Logs
 *
 * SETUP (une fois) :
 *   gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
 *   echo -n "YOUR_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
 *   (répéter pour chaque secret)
 *
 * UTILISATION dans les modules :
 *   const { GEMINI_API_KEY } = require('./secrets');
 *   // Dans la fonction : GEMINI_API_KEY.value()
 *   exports.myFn = onCall({ secrets: [GEMINI_API_KEY] }, async (req) => {
 *     const key = GEMINI_API_KEY.value();
 *   });
 */

const { defineSecret } = require('firebase-functions/params');

// ── Secrets IA ────────────────────────────────────────────────────────────────
/** Gemini / Google AI API Key — utilisée par JARVIS, Commander, AI Forecasting */
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// ── Secrets Mail ──────────────────────────────────────────────────────────────
/** Resend.com API Key — envoi transactionnel */
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

/** Adresse expéditeur par défaut */
const MAIL_FROM = defineSecret('MAIL_FROM');

// ── Secrets Sécurité ──────────────────────────────────────────────────────────
/** reCAPTCHA Enterprise API Key */
const RECAPTCHA_API_KEY = defineSecret('RECAPTCHA_API_KEY');

/** Meta / Facebook Webhook Verify Token */
const META_WEBHOOK_VERIFY_TOKEN = defineSecret('META_WEBHOOK_VERIFY_TOKEN');

/** Meta App Secret (HMAC signature validation) */
const META_APP_SECRET = defineSecret('META_APP_SECRET');

// ── Secrets Monitoring ────────────────────────────────────────────────────────
/** Sentry DSN (Cloud Functions) — monitoring backend */
const SENTRY_DSN_BACKEND = defineSecret('SENTRY_DSN_BACKEND');

// ── Export groupé ─────────────────────────────────────────────────────────────
module.exports = {
  GEMINI_API_KEY,
  RESEND_API_KEY,
  MAIL_FROM,
  RECAPTCHA_API_KEY,
  META_WEBHOOK_VERIFY_TOKEN,
  META_APP_SECRET,
  SENTRY_DSN_BACKEND,

  /**
   * Helper — récupère la valeur d'un secret avec fallback env (dev local)
   * Permet au code fonctionner en émulateur sans Secret Manager configuré
   * @param {import('firebase-functions/params').SecretParam} secretParam
   * @param {string} envFallbackKey
   */
  safeGet(secretParam, envFallbackKey) {
    try {
      const val = secretParam.value();
      if (val) return val;
    } catch (_e) { /* secret non disponible (émulateur ou non configuré) */ }
    return process.env[envFallbackKey] || null;
  },
};
