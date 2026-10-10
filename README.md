# SkicaCAD

Zjednodušená CAD aplikace inspirovaná Fusion 360, která běží přímo v prohlížeči jako PWA (instalovatelná webová aplikace, funguje i offline).

**Stav: Beta.** Verze je vidět v záhlaví aplikace a je součástí všech souborů, které aplikace vytvoří.

## Co umí

- 2D náčrt na rovinách **XY**, **XZ** a **YZ**: čára, obdélník, kružnice.
- Přesné rozměry: během kreslení stačí psát čísla (např. délka `30`, <kbd>Tab</kbd>, úhel `90`, <kbd>Enter</kbd>).
- **Vytažení** uzavřeného profilu do 3D tělesa. Tvary uvnitř profilu se stanou otvory.
- Otáčení, posun a přiblížení 3D zobrazení myší i dotykem.
- Časová osa, zpět / znovu, automatické ukládání v prohlížeči.
- Uložení projektu (`.skica`) a export: **STL** (3D tisk), **SVG** a **DXF** (náčrt).

Zatím neumí booleovské operace (spojení a odečtení těles), kreslení na plochy těles ani kóty. Je to první beta.

## Spuštění lokálně

Aplikace nemá žádné závislosti ani build. Stačí statický server ve složce projektu:

```bash
python3 -m http.server 8000
# nebo: npx serve
```

Otevřete `http://localhost:8000`. (Service worker a instalace aplikace vyžadují `localhost` nebo HTTPS, soubor otevřený přes `file://` nestačí.)

## Publikace na GitHubu (GitHub Desktop + GitHub Pages)

1. V GitHub Desktop: **File → New repository…** (například `SkicaCAD`), vyberte místní složku.
2. Do složky repozitáře zkopírujte všechny soubory z tohoto projektu tak, aby `index.html` ležel přímo v kořeni repozitáře.
3. V GitHub Desktop napište commit (např. `SkicaCAD Beta 0.1.0`), dejte **Commit to main** a **Publish repository**.
4. Na github.com otevřete repozitář → **Settings → Pages** → *Build and deployment*: **Deploy from a branch**, větev `main`, složka `/ (root)` → **Save**.
5. Za minutu až dvě bude aplikace na adrese `https://<uživatel>.github.io/<repozitář>/`.

Všechny cesty v aplikaci jsou relativní, takže funguje i v podadresáři `github.io/<repozitář>/`.

### Instalace jako aplikace

- Chrome / Edge (počítač, Android): tlačítko **Instalovat** v záhlaví aplikace nebo ikona instalace v adresním řádku.
- iPhone / iPad (Safari): **Sdílet → Přidat na plochu**.

## Nová verze

Při každé změně aplikace zvyšte číslo verze v **`version.js`** (jediné místo). Verze se promítne do záhlaví, názvů i obsahu vytvářených souborů a do názvu offline cache. Změny zapisujte do `CHANGELOG.md`.

Service worker stahuje soubory přednostně ze sítě, takže se nová verze objeví po novém otevření aplikace. Offline se použije poslední stažená verze.

## Struktura

```
index.html            stránka aplikace
version.js            verze aplikace (jediné místo)
manifest.webmanifest  PWA manifest
sw.js                 service worker (offline)
css/style.css
js/app.js             stav projektu, UI, historie, soubory
js/geometry.js        geometrie: profily, díry, triangulace, vytažení
js/gl3d.js            vlastní 3D engine (WebGL)
js/sketch2d.js        2D editor náčrtu
js/exporters.js       STL, SVG, DXF
icons/                ikony aplikace
tests/                test geometrie (node tests/geometry.test.mjs)
```

## Formát projektu (`.skica`)

Čitelný JSON: seznam prvků (`sketch` s tvary a `extrude` odkazující na náčrt a profil). Jednotky jsou milimetry. Pole `app` obsahuje verzi aplikace, ve které byl soubor uložen.
