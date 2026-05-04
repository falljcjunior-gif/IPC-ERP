/**
 * Tests unitaires — Rate Limiter
 * Cible : functions/modules/rate_limiter.js
 */

describe('Rate Limiter — Fonctionnement de base', () => {
  let rateLimiter;

  beforeEach(() => {
    // Reset le module pour réinitialiser les buckets entre chaque test
    jest.resetModules();
    const mod = require('../../functions/modules/rate_limiter');
    rateLimiter = mod.rateLimiter;
  });

  function makeReqRes(ip = '1.2.3.4') {
    const headers = { 'X-RateLimit-Limit': '', 'X-RateLimit-Remaining': '', 'X-RateLimit-Reset': '', 'Retry-After': '' };
    const req = { ip, headers: { 'x-forwarded-for': ip } };
    const res = {
      statusCode: 200,
      body: null,
      headers,
      set(key, val) { this.headers[key] = val; return this; },
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    const next = jest.fn();
    return { req, res, next };
  }

  test('Première requête → passe (next appelé)', () => {
    const mw = rateLimiter({ maxRequests: 5, windowMs: 60_000 });
    const { req, res, next } = makeReqRes();
    mw(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  test('Sous la limite → passe toujours', () => {
    const mw = rateLimiter({ maxRequests: 5, windowMs: 60_000 });
    const { req, res, next } = makeReqRes('5.5.5.5');
    for (let i = 0; i < 5; i++) mw(req, res, next);
    expect(next).toHaveBeenCalledTimes(5);
  });

  test('Dépassement de limite → retourne 429', () => {
    const mw = rateLimiter({ maxRequests: 3, windowMs: 60_000 });
    const { req, res, next } = makeReqRes('9.9.9.9');
    for (let i = 0; i < 4; i++) mw(req, res, next);
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('RATE_LIMIT_EXCEEDED');
  });

  test('IPs différentes sont indépendantes', () => {
    const mw = rateLimiter({ maxRequests: 2, windowMs: 60_000 });
    const ip1 = makeReqRes('1.1.1.1');
    const ip2 = makeReqRes('2.2.2.2');

    mw(ip1.req, ip1.res, ip1.next);
    mw(ip1.req, ip1.res, ip1.next);
    mw(ip2.req, ip2.res, ip2.next);

    expect(ip1.next).toHaveBeenCalledTimes(2);
    expect(ip2.next).toHaveBeenCalledTimes(1);
    expect(ip2.res.statusCode).toBe(200);
  });

  test('Headers X-RateLimit-Remaining décroissent correctement', () => {
    const mw = rateLimiter({ maxRequests: 10, windowMs: 60_000 });
    const { req, res, next } = makeReqRes('3.3.3.3');
    mw(req, res, next);
    expect(res.headers['X-RateLimit-Remaining']).toBe('9');
    mw(req, res, next);
    expect(res.headers['X-RateLimit-Remaining']).toBe('8');
  });

  test('Message personnalisé retourné sur 429', () => {
    const msg = 'Quota AI dépassé';
    const mw = rateLimiter({ maxRequests: 1, windowMs: 60_000, message: msg });
    const { req, res, next } = makeReqRes('4.4.4.4');
    mw(req, res, next); // passe
    mw(req, res, next); // bloqué
    expect(res.body.message).toBe(msg);
  });
});
