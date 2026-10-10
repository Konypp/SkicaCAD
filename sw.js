// SkicaCAD – service worker (offline režim)
// Verze se čte z version.js, takže při změně verze se automaticky vytvoří nová cache.
importScripts('./version.js');

const CACHE = `skicacad-${self.SKICA.version}`;
const ASSETS = [
  './', './index.html', './version.js', './manifest.webmanifest',
  './css/style.css',
  './js/kernel.js', './js/features.js', './js/importers.js', './js/app.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png',
];
// Externí knihovny (three.js r128, ovládací prvky, písma). Při první návštěvě online se uloží do cache.
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/TransformControls.js',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap',
];
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    // CDN zvlášť – když některý zdroj není dostupný, instalace kvůli tomu nespadne.
    await Promise.all(CDN.map((u) => fetch(u, { mode: 'no-cors' }).then((r) => cache.put(u, r)).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('skicacad-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Externí zdroje: z cache, jinak ze sítě a uložit (písma: aktualizace na pozadí).
  if (CDN_HOSTS.includes(url.host)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req.url);
      const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req.url, res.clone()); return res; });
      if (hit) { if (url.host === 'fonts.googleapis.com') net.catch(() => {}); return hit; }
      try { return await net; } catch (e) { return Response.error(); }
    })());
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Vlastní soubory: síť má přednost (čerstvé verze), při výpadku nebo pomalé síti cache.
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
