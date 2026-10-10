# SkicaCAD (Beta 0.16)

Parametrické 3D CAD v prohlížeči – instalovatelná PWA (funguje i offline po první návštěvě online).
Aktuální verze je v souboru `version.js` (jediné místo, kde se verze mění).

## Struktura
- `index.html`, `css/style.css`, `js/{kernel,features,importers,app}.js` – aplikace (původně jeden soubor, Beta 0.13)
- `version.js` – název a verze (`SkicaCAD Beta 0.16`), používá aplikace i service worker
- `sw.js`, `manifest.webmanifest`, `icons/` – PWA
- Externí knihovny: three.js r128 (+ OrbitControls, TransformControls) z CDN a písma IBM Plex z Google Fonts; service worker je při první návštěvě uloží pro offline použití.
