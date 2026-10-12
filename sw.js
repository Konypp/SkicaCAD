// SkicaCAD – service worker (offline režim)
// Verze se čte z version.js, takže při změně verze se automaticky vytvoří nová cache.
importScripts('./version.js');

const CACHE = `skicacad-${self.SKICA.version}`;
// Písma z Google Fonts mají vlastní trvalou cache, která se při aktualizaci aplikace nemaže.
const FONT_CACHE = 'skicacad-fonts';
// Vše, co aplikace potřebuje ke spuštění, je v repozitáři (včetně three.js ve vendor/three),
// takže se to uloží hned při instalaci a aplikace se spustí i bez internetu.
const ASSETS = [
  './', './index.html', './version.js', './manifest.webmanifest',
  './css/style.css',
  './vendor/three/three.min.js', './vendor/three/OrbitControls.js', './vendor/three/TransformControls.js',
  './js/i18n.js', './js/kernel.js', './js/features.js', './js/importers.js', './js/app.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png',
];
const FONTS_CSS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Instalace: soubory nutné ke spuštění se ukládají všechny; když se některý nepodaří stáhnout, instalace se opakuje
// při příští návštěvě (nová verze se tak neaktivuje s neúplnou cache a stará zůstane funkční).
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map(async (u) => {
      const res = await fetch(new Request(u, { cache: 'reload' }));
      if (!res.ok) throw new Error('Nelze stáhnout ' + u);
      await cache.put(u, res);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('skicacad-') && k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Stránka po aktivaci požádá o uložení písem (nepovinné, bez nich se použije systémové písmo).
self.addEventListener('message', (event) => {
  if (event.data !== 'cache-cdn') return;
  event.waitUntil(caches.open(FONT_CACHE).then(async (cache) => {
    if (await cache.match(FONTS_CSS)) return;
    try { const r = await fetch(FONTS_CSS, { mode: 'no-cors' }); await cache.put(FONTS_CSS, r); } catch (e) { /* offline */ }
  }));
});

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Písma: z cache, jinak ze sítě (a uložit).
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(caches.open(FONT_CACHE).then(async (cache) => {
      const hit = await cache.match(req.url);
      const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req.url, res.clone()); return res; });
      if (hit) { net.catch(() => {}); return hit; }
      return net.catch(() => new Response('', { status: 504 }));
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Stránka: nejdřív síť (aktuální verze), při výpadku uložená kopie.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await withTimeout(fetch(req), 4000);
        if (res && res.ok) { cache.put('./index.html', res.clone()); return res; }
        throw new Error('bad response');
      } catch (e) {
        return (await cache.match('./index.html')) || (await cache.match('./')) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Vlastní soubory: síť s krátkým časovým limitem, jinak cache.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const net = fetch(req, { cache: 'no-cache' }).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; });
      return await withTimeout(net, 4000);
    } catch (e) {
      const cached = (await cache.match(req, { ignoreSearch: true })) || (await caches.match(req, { ignoreSearch: true }));
      if (cached) return cached;
      try { return await fetch(req); } catch (e2) { return Response.error(); }
    }
  })());
});
