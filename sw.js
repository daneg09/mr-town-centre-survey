// Offline support: app files are fetched fresh when online and cached for when reception drops.
// Map tiles are cached as they are viewed.
const CACHE = 'tc-survey-v2';
const SHELL = ['./', 'index.html', 'app.enc',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isTile = /tile\.openstreetmap\.org|arcgisonline\.com/.test(e.request.url);
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request);
    if (isTile && hit) return hit; // tiles: cache first
    try {
      const res = await fetch(e.request);
      if (res.ok || res.type === 'opaque') c.put(e.request, res.clone());
      return res;
    } catch (err) {
      if (hit) return hit;
      throw err;
    }
  }));
});
