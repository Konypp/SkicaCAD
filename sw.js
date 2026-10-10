// SkicaCAD – service worker (offline režim)
// Verze se čte z version.js, takže při změně verze se automaticky vytvoří nová cache.
importScripts('./version.js');

const CACHE = `skicacad-${self.SKICA.version}`;
const ASSETS = [
  './', './index.html', './version.js', './manifest.webmanifest',
  './css/style.css',
  './js/app.js', './js/geometry.js', './js/gl3d.js', './js/sketch2d.js', './js/exporters.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('skicacad-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Síť má přednost (vždy čerstvé soubory), při výpadku nebo pomalé síti se použije cache.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const fromCache = () => cache.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? cache.match('./index.html') : undefined));
    try {
      const net = fetch(req, { cache: 'no-cache' }).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      });
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000));
      return await Promise.race([net, timeout]);
    } catch (e) {
      const cached = await fromCache();
      if (cached) return cached;
      try { return await fetch(req); } catch (e2) { return Response.error(); }
    }
  })());
});
