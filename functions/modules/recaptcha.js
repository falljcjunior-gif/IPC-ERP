/**
 * ══════════════════════════════════════════════════════════════════
 * RECAPTCHA ENTERPRISE — VÉRIFICATION BACKEND
 * ══════════════════════════════════════════════════════════════════
 *
 * Vérifie les tokens reCAPTCHA Enterprise côté serveur via l'API
 * Google Cloud reCAPTCHA Enterprise (createAssessment).
 *
 * Usage: Appelé par les autres modules (admin, rbac) avant
 * d'exécuter des actions sensibles.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const RECAPTCHA_SITE_KEY = '6LfmFuMsAAAAAGASfSgEa4ypKfHbLIBldul9oMJQ';

// Score seuil — en dessous, on considère que c'est un bot
const SCORE_THRESHOLD = 0.5;

/**
 * Vérifie un token reCAPTCHA Enterprise via l'API Google Cloud.
 * 
 * PREREQUIS:
 * - Activer l'API "reCAPTCHA Enterprise" dans la console GCP
 * - Le service account du projet doit avoir le rôle "reCAPTCHA Enterprise Agent"
 *
 * @param {string} token — Le token reCAPTCHA reçu du client
 * @param {string} expectedAction — L'action attendue (ex: 'LOGIN')
 * @returns {Promise<{valid: boolean, score: number, reason: string}>}
 */
async function verifyRecaptchaToken(token, expectedAction = 'LOGIN') {
  if (!token) {
    return { valid: false, score: 0, reason: 'Token manquant' };
  }

  try {
    const axios = require('axios');
    const projectId = admin.instanceId().app.options.projectId 
      || process.env.GCLOUD_PROJECT 
      || process.env.GCP_PROJECT
      || 'ipc-erp'; // Fallback to the known project ID
      
    // The API key must be provided in the environment variables
    const apiKey = process.env.RECAPTCHA_API_KEY; 

    if (!apiKey) {
      console.warn('[reCAPTCHA] RECAPTCHA_API_KEY manquante. Vérification ignorée (fail-open).');
      return { valid: true, score: 1, reason: 'API Key manquante' };
    }

    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
    
    const requestBody = {
      event: {
        token: token,
        expectedAction: expectedAction,
        siteKey: RECAPTCHA_SITE_KEY,
      }
    };

    const response = await axios.post(url, requestBody);
    const assessment = response.data;

    // Vérification de la validité du token
    if (!assessment.tokenProperties?.valid) {
      const reason = assessment.tokenProperties?.invalidReason || 'Token invalide';
      console.warn(`[reCAPTCHA] Token invalide: ${reason}`);
      return { valid: false, score: 0, reason };
    }

    // Vérification de l'action
    if (assessment.tokenProperties.action !== expectedAction) {
      console.warn(`[reCAPTCHA] Action mismatch: attendu=${expectedAction}, reçu=${assessment.tokenProperties.action}`);
      return { valid: false, score: 0, reason: 'Action mismatch' };
    }

    // Score de risque (0.0 = bot, 1.0 = humain légitime)
    const score = assessment.riskAnalysis?.score ?? 0;
    const valid = score >= SCORE_THRESHOLD;

    if (!valid) {
      console.warn(`[reCAPTCHA] Score trop bas: ${score} (seuil: ${SCORE_THRESHOLD})`);
    }

    return { valid, score, reason: valid ? 'OK' : `Score ${score} < ${SCORE_THRESHOLD}` };
  } catch (err) {
    console.error('[reCAPTCHA] Erreur vérification REST:', err.message);
    if (err.response) {
      console.error('[reCAPTCHA] Détails erreur API:', err.response.data);
    }
    // En cas d'erreur API, on laisse passer (fail-open) pour ne pas bloquer les utilisateurs
    // En production durcie, on peut passer en fail-close
    return { valid: true, score: -1, reason: `Erreur API: ${err.message}` };
  }
}

/**
 * Cloud Function callable — Vérifie un token reCAPTCHA Enterprise.
 * 
 * Peut être appelée par le frontend pour valider avant une action sensible,
 * ou utilisée en interne par d'autres modules.
 */
const verifyRecaptcha = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const { token, action } = request.data;

    if (!token) {
      throw new HttpsError('invalid-argument', 'Token reCAPTCHA requis.');
    }

    const result = await verifyRecaptchaToken(token, action || 'LOGIN');

    if (!result.valid) {
      throw new HttpsError('permission-denied', `Vérification reCAPTCHA échouée: ${result.reason}`);
    }

    return { success: true, score: result.score };
  }
);

module.exports = {
  verifyRecaptcha,
  verifyRecaptchaToken,  // Export pour usage interne par d'autres modules
  SCORE_THRESHOLD,
};
