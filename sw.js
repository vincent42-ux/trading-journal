// Service worker — Trading Journal
// Stratégie "réseau d'abord, cache en secours" : toujours la dernière version
// quand il y a du réseau, et le site complet disponible hors-ligne sinon.
const CACHE = 'tj-cache-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Pages de navigation : on force le réseau SANS cache HTTP (cache: 'reload')
  // → l'app est TOUJOURS à jour dès qu'il y a du réseau. Hors-ligne : version en cache.
  const isNav = e.request.mode === 'navigate' || e.request.destination === 'document';
  const req = isNav ? new Request(e.request.url, { cache: 'reload' }) : e.request;
  e.respondWith(
    fetch(req)
      .then(resp => {
        if (resp && resp.ok && e.request.url.startsWith(self.location.origin)) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return resp;
      })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
