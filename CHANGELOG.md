# Changelog

## Beta 0.22
- Převzato z artefaktu SkicaCAD Beta 0.22: úvodní nabídka se zobrazí při každém spuštění, i když zatím nejsou žádné uložené návrhy (s textem, že se návrh uloží sám, jakmile začnete modelovat).
- PWA části (stahování souborů, instalace, service worker) zůstávají zachované.

## Beta 0.21
- Instalace jako aplikace v Androidu: service worker se registruje hned při otevření stránky (dřív až po načtení three.js), jeho instalace nespadne kvůli jednomu souboru a knihovny z CDN se ukládají až na pozadí. Manifest doplněn (display_override, dir) podle Filakalku.

## Beta 0.20
- Aplikace se vždy otevře s prázdnou plochou. Pokud jsou v prohlížeči uložené dřívější návrhy, zobrazí se úvodní nabídka: Nový návrh, Pokračovat v posledním návrhu a seznam předchozích návrhů (datum, počet kroků, mazání).
- Každý návrh se průběžně ukládá do knihovny v prohlížeči zvlášť (až 60 návrhů), prázdné návrhy se neukládají. Seznam je dostupný i přes Soubor › Moje návrhy.
- Dříve automaticky uložený návrh se při prvním spuštění přesune do knihovny.

## Beta 0.19
- Převzato z artefaktu SkicaCAD Beta 0.19, obsahuje:
  - Závit: začátek a konec závitu lze nastavit tažením šipek na válci (závit jen na části válce), volba „Měřit od“ spodního nebo horního konce.
  - Měřítko: oranžové šipky X, Y, Z pro změnu velikosti tažením (se zachováním poměru stran nebo jen v jedné ose).
  - Paleta skici: lze upravit všechny strany uzavřeného obrysu včetně uzavírací, změna délky tvar protáhne (obdélník zůstane obdélníkem).
  - Rovnoměrná změna velikosti tažením bodu obrysu nebo křivky a volba „Šipkami měnit rovnoměrně všechny rozměry“ u základních těles.
- PWA části (stahování souborů, instalace, service worker) zůstávají zachované.

## Beta 0.18
- Instalační tlačítko už nepotlačuje vlastní nabídku instalace v Chrome.

## Beta 0.17
- Tlačítko „Nainstalovat aplikaci“ v nabídce Soubor (u iOS návod).

## Beta 0.16
- Kvádr, válec, koule, kužel a anuloid: rozměry lze měnit tažením oranžových šipek přímo v pohledu (šířka, hloubka, výška, průměr, poloměry), během tažení se ukazuje aktuální rozměr.
- Polohu vkládaného tělesa lze posouvat manipulátorem stejně jako u Přesunout.

## Beta 0.15
- Po spuštění se už nenačítá ukázkový model, aplikace začíná prázdným návrhem. Ukázku lze načíst v nabídce Soubor.

## Beta 0.14
- Aplikace Beta 0.13 převedena na PWA: rozdělení do souborů, manifest, service worker (offline), ikony podle loga A.
- Ukládání projektu a exporty (STL, OBJ, ZIP) se stahují přímo v prohlížeči.
- Verze se bere z `version.js` (název, titulek, vytvářené soubory).
