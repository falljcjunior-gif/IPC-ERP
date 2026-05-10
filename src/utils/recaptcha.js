/**
 * ══════════════════════════════════════════════════════════════════
 * RECAPTCHA ENTERPRISE — UTILITAIRE CENTRALISÉ
 * ══════════════════════════════════════════════════════════════════
 *
 * WHY: Un point unique pour obtenir un token reCAPTCHA Enterprise.
 * Chaque action protégée (LOGIN, SIGNUP, RESET_PASSWORD, etc.)
 * appelle getRecaptchaToken(action) avant d'envoyer la requête.
 *
 * Le token retourné (valide 2 minutes) est envoyé au backend
 * pour vérification via l'API reCAPTCHA Enterprise.
 */

const RECAPTCHA_SITE_KEY = '6LfmFuMsAAAAAGASfSgEa4ypKfHbLIBldul9oMJQ';

/**
 * Obtient un token reCAPTCHA Enterprise pour une action donnée.
 *
 * @param {string} action — L'action à protéger (ex: 'LOGIN', 'SIGNUP', 'RESET_PASSWORD')
 * @returns {Promise<string|null>} Le token reCAPTCHA ou null si indisponible
 */
export async function getRecaptchaToken(action = 'LOGIN') {
  try {
    // Attend que l'API reCAPTCHA soit prête
    await new Promise((resolve) => {
      if (window.grecaptcha?.enterprise) {
        resolve();
      } else {
        window.grecaptcha?.enterprise?.ready?.(resolve) ||
          // Fallback si le script n'a pas encore chargé
          setTimeout(resolve, 2000);
      }
    });

    if (!window.grecaptcha?.enterprise) {
      console.warn('[reCAPTCHA] API non disponible — le script n\'a pas pu charger.');
      return null;
    }

    const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action });
    return token;
  } catch (err) {
    console.error('[reCAPTCHA] Erreur lors de l\'obtention du token:', err);
    return null;
  }
}

/**
 * Actions reCAPTCHA prédéfinies pour le projet IPC.
 */
export const RECAPTCHA_ACTIONS = {
  LOGIN: 'LOGIN',
  SIGNUP: 'SIGNUP',
  RESET_PASSWORD: 'RESET_PASSWORD',
  CHANGE_PASSWORD: 'CHANGE_PASSWORD',
  SOCIAL_CONNECT: 'SOCIAL_CONNECT',
  DELETE_ACCOUNT: 'DELETE_ACCOUNT',
};
