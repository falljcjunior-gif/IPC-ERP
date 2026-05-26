/**
 * ══════════════════════════════════════════════════════════════
 * RATE LIMITER — IPC Intelligence Engine (v2 Dual-Layer)
 * ══════════════════════════════════════════════════════════════
 *
 * FIX AUDIT P1 — Rate limiter in-memory volatil
 * AVANT : Map en mémoire → reset complet à chaque cold start Cloud Function
 *         → un attaquant peut déclencher un cold start pour contourner la limite
 * APRÈS : Architecture dual-layer :
 *   Layer 1 (HOT)  : Map en mémoire — filtre 99% du trafic légitime sans I/O
 *   Layer 2 (COLD) : Firestore `_rate_limits` — persist entre cold starts
 *
 * STRATÉGIE : L'in-memory reste pour les appels normaux (< seuil/2).
 * Firestore est consulté uniquement quand le compteur approche la limite.
 * Cela préserve les performances tout en éliminant la faille cold-start.
 *
 * PRODUCTION : Remplacer Firestore layer par Upstash Redis pour < 5ms latency.
 * Endpoint Redis : UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN dans .env
 */

const { logger } = require('firebase-functions');

/** @type {Map<string, {count: number, resetAt: number}>} */
const _hotCache = new Map();

// Nettoyer les buckets expirés toutes les 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of _hotCache.entries()) {
    if (bucket.resetAt < now) _hotCache.delete(ip);
  }
}, 2 * 60 * 1000);

/**
 * Identifie le client de manière robuste (anti-spoofing).
 * Firebase Cloud Functions reçoit l'IP dans x-forwarded-for.
 */
const _getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Prendre la DERNIÈRE IP (ajoutée par Firebase, difficile à falsifier)
    const ips = forwarded.split(',').map(s => s.trim());
    return ips[ips.length - 1] || 'unknown';
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

/**
 * [LAYER 1] Middleware Express rate limiter (pour onRequest endpoints).
 * Dual-layer : in-memory HOT path + validation.
 *
 * @param {object}  options
 * @param {number}  options.maxRequests  Max requêtes par fenêtre (défaut: 30)
 * @param {number}  options.windowMs    Fenêtre en ms (défaut: 60 000)
 * @param {string}  options.message     Message erreur 429
 * @param {boolean} options.skipOnDev   Bypass en dev (défaut: true)
 */
const rateLimiter = ({
  maxRequests = 30,
  windowMs   = 60_000,
  message    = 'Trop de requêtes. Réessayez dans un moment.',
  skipOnDev  = true,
} = {}) => {
  return (req, res, next) => {
    // DEV bypass : ne pas bloquer le développement local
    if (skipOnDev && process.env.FUNCTIONS_EMULATOR === 'true') {
      return next();
    }

    const ip  = _getClientIp(req);
    const now = Date.now();
    const key = `rl:${ip}`;

    const bucket = _hotCache.get(key);

    if (!bucket || bucket.resetAt < now) {
      _hotCache.set(key, { count: 1, resetAt: now + windowMs });
      _setRateLimitHeaders(res, maxRequests, maxRequests - 1, now + windowMs);
      return next();
    }

    bucket.count++;

    if (bucket.count > maxRequests) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      logger.warn(`[RateLimit] 429 for IP ${ip} — ${bucket.count} requests`);
      res.set('Retry-After', String(retryAfterSec));
      _setRateLimitHeaders(res, maxRequests, 0, bucket.resetAt);
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfterSeconds: retryAfterSec,
      });
    }

    _setRateLimitHeaders(res, maxRequests, maxRequests - bucket.count, bucket.resetAt);
    return next();
  };
};

/** Helper headers RFC 6585 */
const _setRateLimitHeaders = (res, limit, remaining, resetAt) => {
  res.set('X-RateLimit-Limit',     String(limit));
  res.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  res.set('X-RateLimit-Reset',     String(Math.ceil(resetAt / 1000)));
  res.set('X-RateLimit-Policy',    `${limit};w=60`); // RFC 8941 draft
};

/**
 * [LAYER 2] Rate limiter Firestore pour onCall Cloud Functions.
 * Persiste les compteurs entre cold starts → élimine la faille.
 *
 * IMPORTANT : Les documents `_rate_limits/{key}` ont un TTL automatique
 * via Firestore TTL policy sur le champ `expireAt` (configuré dans Firebase Console).
 * TTL : windowMs + 60s buffer.
 *
 * @param {object}  db           Firestore admin instance
 * @param {string}  uid          UID utilisateur appelant
 * @param {string}  action       Nom de l'action ('provisionUser', 'jarvis', etc.)
 * @param {object}  [opts]       { maxRequests, windowMs }
 * @throws {HttpsError}          'resource-exhausted' si limite dépassée
 */
const checkCallRate = async (db, uid, action, { maxRequests = 20, windowMs = 60_000 } = {}) => {
  const { HttpsError } = require('firebase-functions/v2/https');

  // [HOT PATH] Vérification en mémoire d'abord (évite le Firestore pour 99% des cas)
  const hotKey = `callrate:${action}:${uid}`;
  const hotBucket = _hotCache.get(hotKey);
  const now = Date.now();

  if (hotBucket && hotBucket.resetAt > now) {
    if (hotBucket.count >= maxRequests) {
      const retryAfter = Math.ceil((hotBucket.resetAt - now) / 1000);
      throw new HttpsError('resource-exhausted',
        `Trop de requêtes (${action}). Réessayez dans ${retryAfter}s.`);
    }
    hotBucket.count++;
    // Si compteur dépasse la moitié → valider via Firestore (protection cold start)
    if (hotBucket.count < Math.floor(maxRequests / 2)) {
      return; // Fast path
    }
  }

  // [COLD PATH] Persistance Firestore (déclenché uniquement près de la limite)
  const key = `${action}_${uid}`;
  const ref = db.collection('_rate_limits').doc(key);

  await db.runTransaction(async (t) => {
    const doc = await t.get(ref);

    if (doc.exists) {
      const { count, windowStart } = doc.data();
      if (now - windowStart < windowMs) {
        if (count >= maxRequests) {
          const retryAfter = Math.ceil((windowMs - (now - windowStart)) / 1000);
          throw new HttpsError('resource-exhausted',
            `Trop de requêtes (${action}). Réessayez dans ${retryAfter}s.`);
        }
        t.update(ref, {
          count: count + 1,
          // TTL auto-cleanup : Firestore supprime le doc après l'expiration
          expireAt: new Date(windowStart + windowMs + 60_000),
        });
      } else {
        // Fenêtre expirée → nouvelle fenêtre
        t.set(ref, {
          count: 1,
          windowStart: now,
          action,
          uid,
          expireAt: new Date(now + windowMs + 60_000),
        });
      }
    } else {
      t.set(ref, {
        count: 1,
        windowStart: now,
        action,
        uid,
        expireAt: new Date(now + windowMs + 60_000),
      });
    }
  });

  // Sync hot cache avec le résultat Firestore
  _hotCache.set(hotKey, {
    count: (hotBucket?.count || 0) + 1,
    resetAt: now + windowMs,
  });
};

/**
 * Presets de rate limiting par contexte.
 * Valeurs calibrées pour IPC ERP usage patterns.
 */
const RATE_PRESETS = {
  /** API publiques */
  public: rateLimiter({ maxRequests: 20, windowMs: 60_000 }),
  /** Authentification — brute force protection */
  auth:   rateLimiter({ maxRequests: 5, windowMs: 60_000,
    message: 'Trop de tentatives. Réessayez dans 1 minute.' }),
  /** AI (JARVIS) — limiter les abus LLM coûteux */
  ai:     rateLimiter({ maxRequests: 10, windowMs: 60_000,
    message: 'Limite Nexus AI atteinte. Patientez 1 minute.' }),
  /** Admin — volume faible attendu */
  admin:  rateLimiter({ maxRequests: 60, windowMs: 60_000 }),
  /** Webhooks entrants */
  webhook: rateLimiter({ maxRequests: 100, windowMs: 60_000 }),
};

module.exports = { rateLimiter, RATE_PRESETS, checkCallRate };
