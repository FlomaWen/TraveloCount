// Service Worker — cache documents for offline access
const CACHE = 'travelocount-docs-v1';
const DOC_PATTERN = /\/api\/documents\/[^/?#]+(\?|$)/;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!DOC_PATTERN.test(request.url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(request);
        if (fresh.ok) {
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        return new Response('Document not available offline', { status: 503 });
      }
    })(),
  );
});
