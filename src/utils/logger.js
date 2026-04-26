/**
 * ══════════════════════════════════════════════════════════════════
 * LOGGER DE PRODUCTION — Proxy sécurisé de console
 * ══════════════════════════════════════════════════════════════════
 *
 * WHY: En production, console.log() expose des données internes
 * (structures de données, tokens, états) aux yeux des utilisateurs
 * techniques via les DevTools. C'est une fuite d'information.
 *
 * PATTERN: Proxy Pattern — remplace console.* de manière transparente.
 * En DEV: affiche tout. En PROD: silencieux sauf erreurs critiques.
 *
 * UTILISATION: Remplacer console.log() par logger.log() partout.
 */

const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEV = import.meta.env.DEV;

/**
 * WHY: On garde les erreurs critiques même en prod
 * pour pouvoir les capturer via Sentry ou Firebase Crashlytics plus tard.
 */
const formatPrefix = (level) => `[IPC:${level.toUpperCase()}] ${new Date().toISOString().substring(11, 19)}`;

export const logger = {
  /**
   * Log de debug — silencieux en production.
   */
  log: (...args) => {
    if (IS_DEV) console.log(formatPrefix('log'), ...args);
  },

  /**
   * Log d'information — silencieux en production.
   */
  info: (...args) => {
    if (IS_DEV) console.info(formatPrefix('inf'), ...args);
  },

  /**
   * Avertissement — silencieux en production.
   */
  warn: (...args) => {
    if (IS_DEV) console.warn(formatPrefix('wrn'), ...args);
  },

  /**
   * Erreur critique — TOUJOURS affichée (dev et prod).
   * WHY: Les erreurs doivent être visibles pour le monitoring.
   * Ne pas exposer de données sensibles dans les messages d'erreur.
   */
  error: (message, ...context) => {
    if (IS_DEV) {
      console.error(formatPrefix('err'), message, ...context);
    } else {
      // En prod: message sans données sensibles (context ignoré)
      console.error(`[IPC] ${message}`);
    }
  },

  /**
   * Log d'action utilisateur — pour audit interne uniquement.
   * Ne produit aucune sortie en production.
   */
  action: (action, detail) => {
    if (IS_DEV) console.log(`%c[ACTION] ${action}`, 'color: #10b981; font-weight: bold;', detail);
  },

  /**
   * Log de performance — affiche le temps d'exécution.
   * Usage: const end = logger.time('fetchData'); ... end();
   */
  time: (label) => {
    if (!IS_DEV) return () => {};
    const start = performance.now();
    return () => {
      const ms = (performance.now() - start).toFixed(1);
      console.log(`%c[PERF] ${label}: ${ms}ms`, 'color: #6366f1;');
    };
  },
};

export default logger;
