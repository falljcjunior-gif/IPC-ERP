const CACHE_NAME = 'ipc-cache-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/favicon.svg'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  // For a generic PWA cache-first approach
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
