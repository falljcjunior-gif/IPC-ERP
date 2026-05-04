/**
 * ══════════════════════════════════════════════════════════════
 * RATE LIMITER — IPC Green Block
 * Middleware de limitation de débit pour les Cloud Functions HTTPS.
 * Utilise un bucket en mémoire (par IP) avec fenêtre glissante.
 * Pour la production, remplacer par Redis (Upstash) ou Firestore TTL.
 * ══════════════════════════════════════════════════════════════
 */

/** @type {Map<string, {count: number, resetAt: number}>} */
const ipBuckets = new Map();

// Nettoyer les buckets expirés toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of ipBuckets.entries()) {
    if (bucket.resetAt < now) ipBuckets.delete(ip);
  }
}, 5 * 60 * 1000);

/**
 * Middleware de rate limiting.
 * @param {object} options
 * @param {number} options.maxRequests - Nombre max de requêtes par fenêtre (défaut: 30)
 * @param {number} options.windowMs   - Taille de la fenêtre en ms (défaut: 60 000 = 1min)
 * @param {string} options.message    - Message d'erreur retourné
 * @returns {(req: any, res: any, next: () => void) => void}
 */
const rateLimiter = ({
  maxRequests = 30,
  windowMs   = 60_000,
  message    = 'Trop de requêtes. Réessayez dans un moment.',
} = {}) => {
  return (req, res, next) => {
    // Identifier le client : IP forwarded (proxy Firebase) ou socket
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';

    const now = Date.now();
    const bucket = ipBuckets.get(ip);

    if (!bucket || bucket.resetAt < now) {
      // Nouvelle fenêtre
      ipBuckets.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count++;

    if (bucket.count > maxRequests) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfterSeconds: retryAfterSec,
      });
    }

    // Headers informatifs
    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(maxRequests - bucket.count));
    res.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    return next();
  };
};

/**
 * Presets de rate limiting pour différents contextes métiers.
 */
const RATE_PRESETS = {
  /** API publiques — strict */
  public: rateLimiter({ maxRequests: 20, windowMs: 60_000 }),
  /** Endpoints d'authentification/onboarding — très strict */
  auth:   rateLimiter({ maxRequests: 10, windowMs: 60_000, message: 'Trop de tentatives de connexion. Réessayez dans 1 minute.' }),
  /** AI Chat (Nexus) — modéré pour éviter abus LLM */
  ai:     rateLimiter({ maxRequests: 15, windowMs: 60_000, message: 'Limite du Nexus AI atteinte. Patientez 1 minute.' }),
  /** Admin/RBAC — peu de volume attendu */
  admin:  rateLimiter({ maxRequests: 60, windowMs: 60_000 }),
};

module.exports = { rateLimiter, RATE_PRESETS };
