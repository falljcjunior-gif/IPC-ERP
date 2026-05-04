/**
 * Tests unitaires — Rate Limiter (Vitest-natif, sans jest)
 * Logique répliquée inline pour éviter require() en ESM
 */
import { vi, describe, test, expect, beforeEach } from 'vitest';

// ── Réplication de la logique pure du rate limiter ────────────────────────
function createRateLimiter({ maxRequests = 30, windowMs = 60_000, message = 'Trop de requêtes.' } = {}) {
  const ipBuckets = new Map();

  return (req, res, next) => {
    const ip = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
    const now = Date.now();
    const bucket = ipBuckets.get(ip);

    if (!bucket || bucket.resetAt < now) {
      ipBuckets.set(ip, { count: 1, resetAt: now + windowMs });
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', String(maxRequests - 1));
      res.set('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
      return next();
    }

    bucket.count++;

    if (bucket.count > maxRequests) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
      return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED', message, retryAfterSeconds: retryAfterSec });
    }

    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(maxRequests - bucket.count));
    res.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    return next();
  };
}

function makeReqRes(ip = '1.2.3.4') {
  const headers = {};
  const req = { ip, headers: { 'x-forwarded-for': ip } };
  const res = {
    statusCode: 200,
    body: null,
    headers,
    set(key, val) { this.headers[key] = val; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  const next = vi.fn();
  return { req, res, next };
}

// ── TESTS ────────────────────────────────────────────────────────────────────
describe('Rate Limiter — Fonctionnement de base', () => {
  test('Première requête → passe (next appelé)', () => {
    const mw = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    const { req, res, next } = makeReqRes('10.0.0.1');
    mw(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  test('Sous la limite → passe toujours', () => {
    const mw = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    const { req, res, next } = makeReqRes('10.0.0.2');
    for (let i = 0; i < 5; i++) mw(req, res, next);
    expect(next).toHaveBeenCalledTimes(5);
  });

  test('Dépassement de limite → retourne 429', () => {
    const mw = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });
    const { req, res, next } = makeReqRes('10.0.0.3');
    for (let i = 0; i < 4; i++) mw(req, res, next);
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('RATE_LIMIT_EXCEEDED');
  });

  test('IPs différentes sont indépendantes', () => {
    const mw = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });
    const ip1 = makeReqRes('11.0.0.1');
    const ip2 = makeReqRes('11.0.0.2');

    mw(ip1.req, ip1.res, ip1.next);
    mw(ip1.req, ip1.res, ip1.next);
    mw(ip2.req, ip2.res, ip2.next);

    expect(ip1.next).toHaveBeenCalledTimes(2);
    expect(ip2.next).toHaveBeenCalledTimes(1);
    expect(ip2.res.statusCode).toBe(200);
  });

  test('Headers X-RateLimit-Remaining décroissent', () => {
    const mw = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });
    const { req, res, next } = makeReqRes('12.0.0.1');
    mw(req, res, next);
    expect(res.headers['X-RateLimit-Remaining']).toBe('9');
    mw(req, res, next);
    expect(res.headers['X-RateLimit-Remaining']).toBe('8');
  });

  test('Message personnalisé retourné sur 429', () => {
    const msg = 'Quota AI dépassé';
    const mw = createRateLimiter({ maxRequests: 1, windowMs: 60_000, message: msg });
    const { req, res, next } = makeReqRes('13.0.0.1');
    mw(req, res, next); // passe
    mw(req, res, next); // bloqué
    expect(res.body.message).toBe(msg);
  });
});
