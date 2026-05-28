/**
 * ══════════════════════════════════════════════════════════════════
 * IPC INTELLIGENCE ENGINE — Service Worker v4
 * ══════════════════════════════════════════════════════════════════
 *
 * FIX AUDIT P2 — PWA Service Worker renforcé
 * AVANT : Cache basique, console.log en prod, pas de fallback offline
 * APRÈS : Stratégie Stale-While-Revalidate + Cache-First assets
 *         + Offline fallback premium + message API clear cache
 */

const CACHE_VERSION = 'v4';
const CACHE_STATIC  = `ipc-static-${CACHE_VERSION}`;
const CACHE_PAGES   = `ipc-pages-${CACHE_VERSION}`;
const CACHE_IMAGES  = `ipc-images-${CACHE_VERSION}`;
const ALL_CACHES    = [CACHE_STATIC, CACHE_PAGES, CACHE_IMAGES];

const STATIC_ASSETS = ['/', '/index.html', '/favicon.svg', '/manifest.json'];

// Ne jamais cacher Firebase, APIs sensibles, Sentry
const NEVER_CACHE = [
  /firestore\.googleapis\.com/,
  /firebase\.googleapis\.com/,
  /identitytoolkit\.googleapis\.com/,
  /securetoken\.googleapis\.com/,
  /sentry\.io/,
  /\/api\//,
];

// ── Install ──────────────────────────────────────────────────────
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────────
self.addEventListener('fetch', evt => {
  const { request } = evt;
  if (request.method !== 'GET') return;
  if (request.url.startsWith('chrome-extension:')) return;

  if (NEVER_CACHE.some(p => p.test(request.url))) {
    evt.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  if (request.url.includes('/assets/') || ['script', 'style', 'font'].includes(request.destination)) {
    evt.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }
  if (request.destination === 'image') {
    evt.respondWith(staleWhileRevalidate(request, CACHE_IMAGES));
    return;
  }
  if (request.destination === 'document' || request.headers.get('Accept')?.includes('text/html')) {
    evt.respondWith(networkFirst(request));
    return;
  }
});

async function cacheFirst(req, name) {
  const hit = await caches.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(name)).put(req, res.clone());
    return res;
  } catch { return new Response('', { status: 503 }); }
}

async function staleWhileRevalidate(req, name) {
  const hit = await caches.match(req);
  const fresh = fetch(req).then(res => {
    if (res.ok) caches.open(name).then(c => c.put(req, res.clone()));
    return res;
  }).catch(() => null);
  return hit || await fresh || new Response('', { status: 503 });
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE_PAGES)).put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) || (await caches.match('/')) || new Response(OFFLINE_PAGE, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

// ── Messages ─────────────────────────────────────────────────────
self.addEventListener('message', evt => {
  if (evt.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (evt.data?.type === 'CLEAR_CACHE') caches.keys().then(k => k.forEach(n => caches.delete(n)));
});

// ── Offline Page ─────────────────────────────────────────────────
const OFFLINE_PAGE = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>IPC ERP — Hors ligne</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:#0F172A;color:#E2E8F0;font-family:system-ui,sans-serif;padding:2rem}
.card{background:#1E293B;border:1px solid #334155;border-radius:1rem;
  padding:3rem;text-align:center;max-width:420px;width:100%}
h1{font-size:1.5rem;font-weight:700;color:#10B981;margin-bottom:.75rem}
p{color:#94A3B8;font-size:.95rem;line-height:1.6;margin-bottom:1.5rem}
button{background:#10B981;color:#fff;border:none;padding:.75rem 2rem;
  border-radius:.5rem;font-size:.95rem;font-weight:600;cursor:pointer}
</style></head>
<body><div class="card">
<div style="font-size:3rem;margin-bottom:1.5rem">📡</div>
<h1>Connexion perdue</h1>
<p>IPC ERP nécessite une connexion internet pour synchroniser vos données. Vérifiez votre réseau.</p>
<button onclick="location.reload()">Réessayer</button>
</div></body></html>`;
