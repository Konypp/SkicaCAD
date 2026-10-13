# Changelog

## Beta 0.51
- Mřížka skici: zrušeno zvýraznění průsečíků mřížky (z verze 0.50). Mřížka nad plochou tělesa a jemná mřížka po 1 mm při přiblížení zůstávají.

## Beta 0.50
- Skica na ploše tělesa: mřížka se kreslí vždy nad plochou, při přibližování už neproblikává ani nemizí.
- Mřížka skici: v místech, kde se čáry kříží, jsou lehce zvýrazněné body. Při větším přiblížení se doplní jemná mřížka po 1 mm.
- Ctrl+D (a tlačítko Duplikovat v paletě) vytvoří kopii na stejném místě jako originál, kopii pak přesunete tažením.
- Ctrl+C / Ctrl+V ve skice: kopie se vloží vedle originálu (o jeho šířku + 5 mm) – v ose X pro horní, přední a zadní pohled, v ose Y pro levý a pravý pohled. Další vložení pokračují stejným směrem.

## Beta 0.49
- Skica: pomocné prvky (konstrukční čáry). Kreslí se čárkovaně, netvoří profil k vysunutí, ale dají se k nim přichytávat body a fungují jako osa rotace. Tlačítko Pomocná (Q) v sekci Upravit: s vybraným nástrojem zapne pomocné kreslení (nové prvky budou pomocné), bez nástroje přepne vybraný prvek. V paletě má každý prvek volbu Pomocný prvek.

## Beta 0.48
- Mobil: nápověda nahoře na ploše už nepřekrývá pracovní plochu. Je přes celou šířku a nejvýš na dva řádky. Po prvním dotyku plochy se zmenší na malé „?“, klepnutím na něj se zobrazí celá. Při změně nápovědy (další krok, jiný nástroj) se znovu ukáže.

## Beta 0.47
- Skica: krok zpět a znovu během kreslení skici (tlačítka Zpět/Znovu v horní liště, Ctrl+Z / Ctrl+Y). Při rozkreslené čáře nebo křivce krok zpět odebere poslední bod, u rozkresleného tvaru ho zruší. Jinak vrací nakreslené prvky, přesuny, úpravy v paletě a v kótách, spojení, duplikace i mazání. Po dokončení skice se celá skica vrací jako jeden krok.

## Beta 0.46
- Skica: prvek (čáru, křivku i ostatní tvary) přesunete tažením – bez vybraného nástroje položte prst nebo myš na jeho obrys a táhněte. Posun se přichytává ke kroku mřížky. Druhý prst posun zruší.
- Paleta skici: u každého prvku tlačítko Duplikovat (kopie se vloží o 10 mm vedle, stejně jako Ctrl+D).
- Nový nástroj Spojit (J): klepněte na dvě otevřené čáry nebo křivky a jejich konce se propojí úsečkami do uzavřeného obrysu. Dvojí klepnutí na stejnou ji uzavře. Čáry zůstávají rovné a křivky zakřivené.
- Středy úseček: při kreslení se bod přichytí i ke středu čáry nebo strany obdélníku a střed se označí trojúhelníčkem. Bez nástroje se střed ukáže, když na něj najedete.

## Beta 0.45
- Skica: rozměr lze upravit přímo v kótě. Klepnutím na číslo kóty se otevře pole, Enter (nebo klepnutí jinam) změnu použije, Esc ji zruší. Funguje pro šířku a výšku obdélníku, průměr kružnice, poloměr i stranu mnohoúhelníku, osy elipsy, délku a šířku drážky a délky úseků čáry.
- Přichytávání k mřížce: poloměr kružnice, mnohoúhelníku a osy elipsy kreslené ze středu se zaokrouhlují na krok mřížky (dřív např. 9,899 mm při šikmém tahu). Bod přichycený k existujícímu bodu má přednost.
- Přichytávání k bodům má na dotykovém displeji větší dosah (16 px místo 10 px).
- Oprava: táhlo vysunutí přichytávalo ke kroku i při vypnutém přichytávání. Obdélník bez přichytávání se ukládal s chybou zaokrouhlení (23,499999…).

## Beta 0.44
- Skica: kreslení tažením. S vybraným nástrojem (obdélník, kružnice, elipsa, mnohoúhelník, drážka, čára, křivka) jeden prst nebo levé tlačítko myši kreslí: položení = první bod, puštění = druhý bod, tvar a kóty se průběžně překreslují. Klepání funguje dál. Dvěma prsty se pohled posouvá a přibližuje, druhý prst rozkreslený tvar zruší.
- Čára a křivka: každý tah přidá úsek, další tah navazuje na poslední bod. Dvojím klepnutím kreslení ukončíte (dosud jen Enter nebo pravé tlačítko).
- Křivka: v paletě volba Kreslit bod po bodu / od ruky. Od ruky se tah po puštění převede na hladkou křivku s několika body; když tah skončí u začátku, křivka se uzavře.

## Beta 0.43
- Horní lišta: nové tlačítko Vzhled přepíná automaticky (podle systému) → světlý → tmavý. Volba se pamatuje.
- Oprava: při kreslení čáry a křivky se rozkreslený tvar nezobrazoval, dokud se obrys neuzavřel (chyba od verze 0.35, nejvíc patrná na mobilu).

## Beta 0.42
- Skica: jemnější kóty – tenčí a průhlednější čáry, menší šipky a písmo, kóty blíž k tvaru.

## Beta 0.41
- Skica: kóty u všech prvků – obdélník (šířka a výška), kružnice (Ø), mnohoúhelník (R a délka strany), elipsa (obě osy), drážka (celková délka a šířka) a čáry (délka každého úseku). Kóty se ukazují i při kreslení. V paletě skici je lze vypnout volbou Zobrazit kóty.

## Beta 0.40
- Kostka pohledů: osy X, Y a Z vycházejí z rohu kostky a vyčnívají ven za její stěny, písmena jsou na jejich koncích. Kostka je o kus větší, aby se osy vešly.

## Beta 0.39
- Pracovní plocha: osy X (červená) a Y (zelená) vedou přes celou mřížku od kraje ke kraji, svislá osa Z se nekreslí. Počátek je malá kružnice místo kuličky.
- Kostka pohledů: osy jsou označené písmeny X, Y a Z v barvě osy.

## Beta 0.38
- Paleta skici, Drážka: nové pole R (rozteč středů zaoblení) vedle celkové délky L. Hodnoty jsou provázané (L = R + Š), změna jedné dopočítá druhou.

## Beta 0.37
- Skica, Drážka (režim Od konce ke konci, dřív Ze středu): první dvě klepnutí určují krajní body drážky, tedy celkovou délku, ne středy zaoblení. Třetí klepnutí určí šířku, zaoblení se vejde dovnitř.

## Beta 0.36
- Paleta skici, Drážka: místo středů obou oblouků (X1, Y1, X2, Y2) se zadává střed (X, Y), celková délka (L), šířka (Š) a natočení (∠). Při změně šířky zůstává celková délka zachovaná.

## Beta 0.35
- Skica: volba Kreslit z rohu / ze středu je u všech tvarů – obdélník, kružnice, elipsa, mnohoúhelník a drážka. Z rohu: tvar vyplní obdélník (u kružnice a mnohoúhelníku čtverec) mezi dvěma klepnutími. Ze středu: první klepnutí je střed. Volba se pamatuje pro každý nástroj zvlášť.

## Beta 0.34
- Skica, Obdélník: v paletě volba Kreslit z rohu / ze středu (první klepnutí určí střed, druhé roh).
- Skica, nový nástroj Vystřihnout (X): klepnete na uzavřený tvar a pak na
  - jiný uzavřený tvar (kružnici, obdélník, obrys naklikaný po bodech): ten se z tvaru vystřihne,
  - čáru (i lomenou přes více bodů): tvar se podél ní rozdělí a klepnutím zvolíte část, která se odstraní (Esc nechá obě).
  Výsledkem je obrys, jehož úsečky lze dál upravit v paletě.

## Beta 0.33
- Vycentrovat rozšířeno a přejmenováno na Zarovnat se třemi režimy:
  - Počátku: dosavadní vycentrování (X, Y, položení na podložku), beze změny.
  - Tělesu: pro každou osu zvolíte zarovnání začátků, středů nebo konců, případně přiložení za konec / před začátek (u osy Z položit navrch / dát pod), vybraná tělesa se zarovnají k vybranému tělesu.
  - Ploše: klepnete na plochu tělesa, které se má přesunout, a na cílovou plochu jiného tělesa; těleso se natočí a přisune tak, aby plochy dosedly (volitelně vystředit, otočit opačně, mezera). Dvě válcové plochy (válce, díry) se zarovnají do jedné osy.
- V režimu Plochy přibyla akce Zarovnat k… (lišta i nabídka), která rovnou předvybere zvolenou plochu.

## Beta 0.32
- Anglická verze: tlačítko CZ / EN v horní liště přepíná jazyk celé aplikace za běhu (pás nástrojů, dialogy, paleta skici, nabídky, hlášení, úvodní obrazovka, kostka pohledů). Volba se pamatuje; při prvním spuštění se jazyk řídí nastavením prohlížeče. V angličtině se čísla píší s desetinnou tečkou. Překlad je v souboru `js/i18n.js`.
- Šipky pro změnu rozměrů (základní tělesa, Vysunutí, Závit) mají stálou velikost na obrazovce a jsou menší (na dotykových zařízeních o něco větší, aby se daly chytit).
- Měřítko: manipulátor mění rozměr úměrně posunu ukazatele (v milimetrech) a stejně citlivě i při dalších taženích; dřív se změna s každým tažením násobila.

## Beta 0.31
- Samostatné tlačítko Upravit plochu odstraněno; vše s plochami je pod tlačítkem Plochy (G), které se přesunulo na jeho místo ve skupině Upravit. Po výběru stěny nabídne lišta Vysunout, Posunout plochu / Změnit průměr, Skicu z plochy, Prázdnou skicu a Závit. Dříve vytvořené úpravy ploch lze dál upravit dvojklikem na časové ose.

## Beta 0.30
- Vysunutí nabízí jen profily, které ještě nebyly vysunuté (už použitá skica se v nabídce neukáže; u skici s více profily zůstanou ty nepoužité). Když není co vysunout, aplikace poradí novou skicu nebo Vysunout z plochy.
- Režim Plochy: po výběru stěny se dole objeví lišta s akcemi (Vysunout, Posunout plochu / Změnit průměr, Skica z plochy, Prázdná skica, Závit), takže vše funguje i na mobilu bez pravého tlačítka.
- Nová akce Vysunout u rovinné plochy: obrys stěny se rovnou vysune (nové těleso, přidat nebo vyříznout) bez ruční práce se skicou. Při zrušení se pomocná skica zase smaže.
- Na dotykové obrazovce otevře podržení prstu na tělese nebo ploše stejnou nabídku jako pravé tlačítko.

## Beta 0.29
- Vysunutí: v dialogu je nové pole „Skica“, kterým vyberete libovolnou skicu, i takovou, která už byla použita a je skrytá. Skicu lze vybrat také klepnutím v Prohlížeči nebo na časové ose před spuštěním Vysunutí, případně klepnutím na její profil v pohledu.
- Bez výběru se nabídne nejnovější dosud nepoužitá skica (dřív vždy poslední vytvořená). Pokud má skica jediný uzavřený profil, vybere se rovnou.

## Beta 0.28
- Hrany těles se kreslí jemně (o odstín tmavší než těleso, poloprůhledně) místo téměř černé čáry. Výrazná barva zůstává jen u vybraného tělesa a pod kurzorem. Zaoblení se jako hrana nekreslí, čáry zůstávají jen na skutečných ostrých hranách.

## Beta 0.27
- Základní těleso Kvádr nahrazeno Krychlí: výchozí rozměry 30 × 30 × 30 mm a šipky ji ve výchozím stavu mění rovnoměrně, takže zůstane krychlí. Po vypnutí volby nebo ručním zadání rozměrů z ní lze dál udělat kvádr.

## Beta 0.26
- Měřítko: místo oranžových šipek stejný manipulátor jako u Přesunout a Otočit (v režimu měřítka). Kostičky na osách X, Y, Z mění velikost v dané ose, prostřední úchyt mění všechny osy najednou. Manipulátor stojí ve zvoleném středu změny, rozměry se přichytávají podle kroku mřížky a u kurzoru se ukazuje nový rozměr.

## Beta 0.25
- Oprava offline režimu: three.js (r128, licence MIT) je nově přímo v aplikaci ve složce `vendor/three` místo načítání z CDN. Service worker ho ukládá hned při instalaci, takže se aplikace spustí i bez internetu, také po aktualizaci (dřív se při každé nové verzi knihovna z mezipaměti smazala).
- Service worker: nová verze se aktivuje jen s úplnou mezipamětí (jinak zůstane funkční předchozí), stránka i soubory mají při pomalé síti časový limit 4 s a pak se použije uložená kopie. Písma mají vlastní trvalou mezipaměť.

## Beta 0.24
- Úvodní nabídka: u předchozích návrhů je náhled modelu (izometrický pohled). Náhled se vytvoří automaticky chvíli po každé změně návrhu; starší návrhy ho dostanou při prvním otevření.

## Beta 0.23
- Oznámení o nové verzi: když se za běhu stáhne aktualizace, objeví se lišta „Je k dispozici nová verze aplikace“ s tlačítky Obnovit / Později. Aplikace hledá aktualizace při návratu do popředí a každou půlhodinu.

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
