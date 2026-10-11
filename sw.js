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
// Externí knihovny (three.js r128, ovládací prvky, písma) – ukládají se na pozadí, ne při instalaci.
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/TransformControls.js',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap',
];
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

// Instalace nikdy nespadne kvůli jednomu souboru (každý se ukládá zvlášť).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(ASSETS.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('skicacad-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Stránka po aktivaci požádá o uložení knihoven z CDN pro offline použití.
self.addEventListener('message', (event) => {
  if (event.data !== 'cache-cdn') return;
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(CDN.map(async (u) => {
    if (await cache.match(u)) return;
    try { const r = await fetch(u, { mode: 'no-cors' }); await cache.put(u, r); } catch (e) {}
  }))));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Externí knihovny a písma: z cache, jinak ze sítě (a uložit).
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req.url);
      const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req.url, res.clone()); return res; });
      if (hit) { net.catch(() => {}); return hit; }
      return net.catch(() => Response.error());
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Stránka: nejdřív síť (aktuální verze), při výpadku uložená kopie.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); } return res; })
        .catch(() => caches.match('./index.html', { cacheName: CACHE }).then((r) => r || caches.match('./'))),
    );
    return;
  }

  // Vlastní soubory: síť s krátkým časovým limitem, jinak cache.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const net = fetch(req, { cache: 'no-cache' }).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; });
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000));
      return await Promise.race([net, timeout]);
    } catch (e) {
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;
      try { return await fetch(req); } catch (e2) { return Response.error(); }
    }
  })());
});
