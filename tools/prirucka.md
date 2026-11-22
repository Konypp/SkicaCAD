# SkicaCAD – uživatelská příručka

Oct 15, 2026 · @Petr

Příručka popisuje SkicaCAD Beta 2.73, parametrickou CAD aplikaci v prohlížeči pro modelování součástí ke 3D tisku. Model vzniká jako posloupnost kroků: nakreslíte skicu, vysunete ji do tělesa a dál ho upravujete; každý krok jde později změnit. Rozměry jsou v milimetrech, osa Z míří nahoru.

## 1. Úvod a rozhraní

SkicaCAD běží v prohlížeči na počítači i v telefonu a dá se nainstalovat jako aplikace (PWA); po první návštěvě funguje i offline.

| Část | Kde je | K čemu slouží |
| --- | --- | --- |
| Horní lišta | nahoře | název s označením Beta a číslem verze, menu Soubor, Zpět a Znovu, přepínač jazyka CZ/EN, přepínač světlého a tmavého vzhledu, název návrhu |
| Pás nástrojů | pod lištou | záložka TĚLESO se skupinami Vytvořit, Upravit, Výběr, Kontrola a Vložit; při kreslení přibude záložka SKICA |
| Prohlížeč | vlevo nahoře | seznam těles a skic, viditelnost, přejmenování |
| Kostka pohledů | vpravo nahoře | rychlé přepnutí pohledu; tlačítko domů vrací výchozí pohled |
| Dialog / paleta | vpravo (na telefonu dole) | parametry probíhajícího příkazu nebo prvky skici |
| Navigační lišta | dole uprostřed (na telefonu svisle vpravo) | přizpůsobení pohledu, projekce, styl zobrazení, mřížka, přichytávání |
| Časová osa | úplně dole | historie kroků modelu |

**Nápověda**: tlačítko s otazníkem v horní liště, Soubor › Nápověda nebo klávesa F1 otevře tuto příručku přímo v aplikaci (funguje i offline): vlevo kapitoly, nahoře hledání (Enter skočí na další výskyt). Otazník v záhlaví dialogu (nebo F1 při otevřeném dialogu) otevře příručku rovnou u popisu daného nástroje. Po najetí myší na nástroj v pásu se ukáže jeho krátký popis.

Název návrhu změníte klepnutím na pole v horní liště (výchozí je „Bez názvu“). Aplikace nepovolí dva návrhy se stejným názvem a případně přidá číslo.

### Úvodní obrazovka a Moje návrhy

Aplikace startuje prázdná a nabídne úvodní obrazovku:

- **Nový návrh** založí prázdný návrh.
- **Pokračovat** otevře naposledy upravovaný návrh.
- **Předchozí návrhy** je seznam uložených návrhů s náhledem, datem a počtem kroků; klepnutím návrh otevřete, ikonou koše a druhým klepnutím ho smažete.
- **Otevřít ze souboru…** otevře návrh ze souboru .json nebo .zip.
- **Ukázkový model** načte vzorový držák.

Návrhy se ukládají automaticky, ale jen v prohlížeči daného zařízení. Zálohu jednoho návrhu uděláte přes Soubor › Uložit návrh, celé knihovny přes Soubor › Zálohovat knihovnu (kapitola 9). Po přihlášení (tlačítko Přihlásit se Googlem v úvodní nabídce nebo Soubor › Přihlásit se Googlem, v nainstalované aplikaci a na webu, ne v náhledu na claude.ai) se knihovna návrhů s náhledy i nastavení synchronizují se všemi zařízeními, kde jste přihlášeni; když se stejný návrh změní na dvou zařízeních, novější zůstane pod svým názvem a starší se uloží jako kopie.

## 2. Ovládání pohledu

Myší otáčíte levým tlačítkem, posouváte prostředním nebo pravým a přibližujete kolečkem. Na dotykové obrazovce otáčíte jedním prstem, dvěma prsty posouváte a roztahováním přibližujete. Šipky na klávesnici bez vybraného tělesa posouvají pohled (Shift = větší krok).

Klepnutím na stěnu, hranu nebo roh kostky pohledů přepnete na odpovídající pohled; tlačítko domů vrátí výchozí izometrický pohled.

| Tlačítko navigační lišty | Funkce |
| --- | --- |
| Přizpůsobit (F6) | vycentruje a přiblíží celý model |
| Projekce | přepíná ortogonální a perspektivní pohled |
| Styl zobrazení | střídá stínování s hranami, stínování a drátový model |
| Mřížka | zapíná a vypíná mřížku |
| Přichytávání | přichytává body k mřížce (klepnutím vypnete) |
| Přichytávání k hranám | přichytává body k rohům, středům hran a kružnic a k hranám modelu v rovině skici (i když model neleží na mřížce); klepnutím vypnete |
| Krok přichytávání | 0,5 / 1 / 5 / 10 mm; podle něj se posouvá i šipkami |

Nastavení mřížky, přichytávání, stylu zobrazení, jazyka a vzhledu si aplikace pamatuje.

## 3. Rychlý start: první model

Z prázdného návrhu se k hotovému tělesu dostanete v šesti krocích.

1. Zvolte **Vytvořit skicu** (D) a klepněte na rovinu XY, XZ nebo YZ.
2. Nakreslete tvar, například obdélník (R) a kružnici (C). Přesné rozměry zadáte v kótách nebo v paletě skici.
3. Skicu dokončete tlačítkem **Dokončit skicu** nebo klávesou Enter.
4. Zvolte **Vysunutí** (E), vyberte uzavřený profil a zadejte vzdálenost. Víc profilů najednou (třeba všechny buňky importovaného SVG) vyberete tlačítkem Vybrat vše nebo Ctrl+A, případně rámečkem tažením se stisknutým Shift (doprava jen profily celé uvnitř, doleva všechny, kterých se rámeček dotkne); Zrušit výběr výběr vyprázdní. Operace **Nové těleso** vytvoří samostatné těleso, **Vyříznout** otvor.
5. Hrany zaoblíte příkazem **Zaoblení** (F): vyberte hrany, zadejte poloměr a potvrďte.
6. Pro tisk model exportujte přes Soubor › Exportovat 3MF nebo Exportovat STL.

Každý příkaz potvrdíte tlačítkem OK nebo klávesou Enter, zrušíte klávesou Esc.

## 4. Skicování

Skicu založíte na rovině počátku nebo na rovné ploše tělesa. Pole Odsazení roviny posune skicu kolmo od vybrané roviny o zadanou vzdálenost (tak vzniknou skici nad sebou, např. pro Přechod profilů). Po vstupu do skici přibude v pásu záložka SKICA a vpravo paleta skici; vysunout jde jen uzavřený profil.

| Nástroj | Zkratka | Postup |
| --- | --- | --- |
| Čára | L | klepáte body; klepnutím na první bod obrys uzavřete, Enter nebo dvojklik ukončí |
| Křivka | K | klepáte body, kterými má křivka projít; body jde potom přetáhnout |
| Obdélník | R | první roh, pak protiější roh |
| Kružnice | C | střed, pak poloměr |
| Elipsa | E | střed, pak roh obdélníku, do kterého se vepíše; natočení v paletě |
| Mnohoúhelník | P | střed, pak vrchol; počet stran v paletě |
| Drážka | D | střed prvního oblouku, střed druhého, třetím klepnutím šířka |
| Text | – | v liště skici už není – text se vytváří nástrojem Text (Základní tělesa → Text) rovnou jako těleso. Texty ze starších skic zůstávají a v paletním editoru jdou dál upravit: více řádků, zarovnání, výška, rozestup a šířka písmen, natočení, sklon, řádkování, oblouk, tučné písmo a zrcadlově |
| Zaoblit rohy | – | poloměr v paletě, pak klepnutí na obdélník, mnohoúhelník nebo uzavřený obrys |
| Odsadit | O | vzdálenost a směr (ven / dovnitř) v paletě, pak klepnutí na obrys; vznikne odsazená kopie |
| Zrcadlit | M | osa svislá nebo vodorovná (poloha, Osa na střed skici) nebo rovná čára skici; klepnutí na prvek přidá jeho zrcadlový obraz; Kreslit zrcadlově zrcadlí rovnou vše nově nakreslené |
| Kombinovat | X | v paletě zvolíte Odečíst, Sjednotit, Průnik nebo Rozdělit; klepnete na první tvar, pak na druhý (u Rozdělit na čáru a potom na část, která se odstraní) |
| Oříznout | T | klepnutí na úsek čáry mezi dvěma průsečíky ho odstraní a navazující čáry se spojí; prvek bez průsečíku zmizí celý |
| Spojit | J | spojí dvě otevřené čáry nebo křivky do uzavřeného obrysu |
| Pomocná | Q | nové prvky budou pomocné (čárkovaně, netvoří profil) |
| Smazat | Del | smaže vybraný prvek |
| DXF / SVG | – | vloží obrys ze souboru; v paletě pak hned nastavíte Šířku, Výšku nebo Měřítko, vycentrování a Posun X / Y (Hotovo panel zavře) |

**Kóty.** Při kreslení se délka a úhel čáry ukazují přímo v kótách; klepnutím na kótu hodnotu přepíšete. Volbou Zobrazit kóty v paletě je vypnete, pak se hodnoty ukazují u kurzoru. Když rovina skici prochází tělesem (třeba rovina XZ přes válec v počátku), tělesa se zobrazí průhledně, aby skicu nezakrývala, a mřížka skici se kreslí přes ně výrazněji; přepíná to volba Průhledná tělesa v paletě.

**Táhla.** Vybraný tvar má oranžová táhla pro změnu rozměrů: kružnice na obvodu, obdélník v rozích a středech stran, mnohoúhelník ve vrcholu, elipsa na koncích os, drážka na koncích a na boku. Tažením za samotný prvek ho přesunete, šipkami na klávesnici ho posunete o krok mřížky (Shift ×10). Víc prvků vyberete Ctrl (Cmd) + klepnutím, rámečkem tažením se Shift (doprava celé uvnitř, doleva dotčené) nebo všechny Ctrl+A; Esc výběr zruší. Vybrané prvky se společně přesouvají tažením i šipkami, mažou, kopírují (Ctrl+C / Ctrl+V), duplikují (Ctrl+D) a přepínají na pomocné.

**Paleta skici** vypisuje každý prvek a jeho přesné hodnoty (X, Y, rozměry, poloměr rohů) a počet uzavřených profilů. Otevřená čára může posloužit jako osa rotace. Ctrl+C a Ctrl+V prvek zkopíruje, Ctrl+D ho zduplikuje na stejné místo.

**Vazby** (Skica › Vazby) drží vztahy mezi prvky skici: Vodorovně a Svisle (úsečka), Rovnoběžně a Kolmo (dvě úsečky; druhá se otočí), Stejná délka (dvě úsečky nebo strany obdélníku, u kružnic stejný poloměr), Soustředně (dvě kružnice), Shodný bod (konec čáry nebo střed kružnice se přesune na první bod), Tečně (úsečka a kružnice nebo dvě kružnice) a Pevně (prvek se při řešení vazeb nehýbe). Odebrat vazbu odebere vazby prvku, na který klepnete. Vazby se ukládají ve skice a platí i při tažení a změně rozměrů: upravovaný prvek drží, ostatní se mu přizpůsobí. U prvků se zobrazují značky H, V, ∥, ⊥, =, ◎, ●, T a ⚓; Zpět a Znovu vazby zahrnují.

**Kombinovat, nebo Oříznout?** Kombinovat pracuje s celými plochami tvarů a jen jím rozdělíte tvar čarou. Oříznout odstraňuje jednotlivé úseky čar, když chcete pryč jen konkrétní kus obrysu.

## 5. Tělesa a úpravy

Většina příkazů otevře dialog s parametry a náhled v pohledu. Pole **Operace** určuje, co se s výsledkem stane: Nové těleso, Spojit, Vyříznout nebo Průnik.

### Vytvoření těles

| Příkaz | Zkratka | Parametry |
| --- | --- | --- |
| Vysunutí | E | skica a profil, směr (jedna strana / symetricky), vzdálenost, operace (vzdálenost začíná na 0, stejně jako posunutí u Upravit plochu); zbylý profil skici, ze které už něco vysunuté je, se nenabízí – vysunete ho po výběru skici na časové ose nebo v poli Skica |
| Rotace | – | profil, osa (osa X skici), úhel, operace |
| Závit | T | viz kapitola 7 |
| Textura | – | vzor na vnější válcové ploše (plášť válce, nádoby) nebo na rovné ploše (víčko, stěna krabičky); na rovné ploše vzor pokryje celou plochu a ořízne se jejím obrysem, vlastní motiv se rozmístí do sloupců a řad kolem středu plochy. Klepněte na plochu a zvolte Hotový vzor – Kamínky, Plástev, Kosočtverce (vroubkování), Trojúhelníky, Cihly, Čtverce, Puntíky nebo Žebrování; nastavíte velikost buňky, spáru, výšku, zaoblení, u kamínků nepravidelnost a Jiné rozložení, a rozsah Od–Do (třeba bez oblasti závitu). Nebo Vlastní: motiv ze skici (SVG či DXF lze do skici importovat; tlačítko Přizpůsobit šířku nastaví největší šířku, která se vejde) se šířkou, počtem dokola, počtem řad, mezerou a posunem řad, natočením a výškou středu. Volba U okraje: Vyplnit k okraji (výchozí) – řady se mírně protáhnou, aby přesně vyšly do rozsahu, a krajní řady jsou souměrně rozpůlené a sahají až k okraji (bez spáry), takže vzor na okraj navazuje; Jen celé buňky – celé buňky od kraje ke kraji. Odsazení od kraje určí, jak daleko od okraje plochy vzor začíná (na rovné ploše od obrysu i otvorů, na válci od obou konců). Provedení Vystouplý nebo Vyrytý; vzor se navine dokola bez švu, spáry stojí 0,06 mm nad plochou. |
| Krychle | – | šířka, hloubka a výška, poloha základny, volba Zachovat poměr stran (při tažení šipkou i při přepsání jednoho rozměru se ostatní změní ve stejném poměru) |
| Válec, Koužel | – | průměr, výška, poloha základny |
| Koule | – | průměr, poloha |
| Torus | – | poloměr, poloměr trubice, poloha |
| Text | – | text jako těleso (Základní tělesa → Text): více řádků; písmo z 10 nabídnutých (DejaVu Sans, DejaVu Serif, DejaVu Sans Mono, Inter, Poppins, Liberation Sans, Carlito, Lora, Caladea, Liberation Serif), ve výběru napsaných přímo daným písmem; umístění vodorovně (XY), svisle zepředu (XZ), svisle zboku (YZ) nebo klepnutím na rovnou plochu tělesa; výška písmen, výška textu nebo hloubka vyrytí, zarovnání, rozestup a šířka písmen, natočení, sklon, řádkování, oblouk, tučné, zrcadlově, poloha bodu ukotvení (na ploše tělesa se text postaví doprostřed plochy – volba Střed textu v bodě ukotvení); úprava kroku Text ukazuje text tam, kam ho přesunuly nebo otočily pozdější kroky, a po potvrzení tam zůstane; text vznikne vždy jako samostatné těleso (na ploše na ní přesně sedí), spojit nebo vyříznout ho jde pak přes Tvar → Kombinovat |
| Šroub, Matice, Pant | – | viz kapitola 6 |

Základní tvary umístíte klepnutím do pohledu nebo manipulátorem, rozměry zadáte v dialogu.

### Úpravy těles

| Příkaz | Zkratka | Co dělá |
| --- | --- | --- |
| Zaoblení | F | zaoblí vybrané hrany; volba Tangentní řetěz vybere navazující hrany |
| Zkosení | – | zkosí vybrané hrany o zadanou vzdálenost; zaoblení a zkosení jde dělat postupně i kombinovat (např. zkosit spodní hrany a pak zaoblit svislé), nová úprava doběhne přes tu předchozí až do rohu a předchozí zkosení či zaoblení nový roh oběhne ve stejné šířce; pořadí hran tak na výsledek prakticky nemá vliv, u vnějších i vnitřních hran (např. dno kapsy a její svislé rohy) |
| Díra | H | viz kapitola 6 |
| Skořepina | – | z tělesa udělá duté se zadanou tloušťkou stěny; klepnutím na rovné stěny je otevřete (krabička) |
| Kombinovat | – | spojí, vyřízne nebo udělá průnik cílového tělesa a nástrojů; volba Výsledek jako nové těleso (původní tělesa zůstanou), volba Rozdělit výsledek na samostatné díly (např. dva články po vyříznutí nástrojem ohebného spoje) a volba Ponechat nástrojová tělesa |
| Rozříznout | – | rozřízne tělesa rovinou (natočení, posun) nebo rovinou plochy tělesa; ponecháte obě části nebo jen jednu. Po natočení (manipulátorem i posuvníky) posouvá Posun roviny rovinu podél její natočené normály |
| Rozříznout křivkou | – | rozřízne těleso podél křivky naklikané po bodech: Ve směru pohledu (body klepete do pohledu přes těleso, řez jde rovně ve směru pohledu jako vykrajovátko) nebo Po obvodu ke středu (body klepete na povrch dokola kolem osy X/Y/Z, řez jde ke středu a válec rozdělí na horní a spodní díl s tvarovanou spárou); Hladká křivka, Mezera mezi díly (výchozí 0,3 mm), Zpět o bod / Smazat body |
| Přesunout | M | posun nebo otočení manipulátorem či čísly; volba Vytvořit kopie (počet, směr, rozestup) |
| Otočit | R | úhly kolem X, Y, Z, rychlá tlačítka, střed otáčení, Položit na podložku, Plochou dolů |
| Měřítko | – | změna velikosti se zachováním poměru nebo po osách, měřítkem nebo rozměry v mm; střed změny spodní plocha, střed výběru nebo počátek |
| Zarovnat | – | zarovná tělesa k počátku, k jinému tělesu nebo plochou na plochu (s mezerou, vystředěním); osa Z položit na podložku, vycentrovat nebo neměnit |
| Plochy | G | režim práce se stěnami, viz kapitola 7 |
| Zrcadlit | – | zrcadlení přes rovinu YZ, XZ nebo XY, volitelně Spojit s originálem |
| Pole | – | kruhové (osa, počet, celkový úhel) nebo obdélníkové (počet a rozteč v X a Y) |
| Odstranit | Del | smaže vybraná tělesa |

### Výběr těles

Těleso vyberete klepnutím nebo v Prohlížeči, více těles s Ctrl nebo Shift, všechna Ctrl+A. Tažením levým tlačítkem se stisknutým Shift nakreslíte výběrový rámeček: tažením zleva doprava (plná čára) se vyberou tělesa celá uvnitř rámečku, zprava doleva (čárkovaně) všechna, kterých se rámeček dotkne; rámeček přidává k výběru. Pravým tlačítkem (na telefonu dlouhým stiskem) na tělese v pohledu i v Prohlížeči otevřete nabídku Kopírovat, Duplikovat, Přesunout, Vycentrovat na střed (střed výběru v osách X a Y do počátku, výška zůstane), Zaoblit hrany, Přejmenovat (také dvojklikem na název v Prohlížeči), Skrýt a Odstranit. Šipky na klávesnici vybraná tělesa posunou o krok mřížky, PageUp a PageDown ve směru Z. S Ctrl (na Macu Cmd) nebo Alt je posun jemný, o 0,1 mm; Ctrl+Shift+šipka nahoru/dolů posune jemně ve směru Z, Alt+Shift+šipky o 1 mm. Duplikovat (Ctrl+D) nechá kopii na stejném místě jako originál (kopie je vybraná a dá se hned posunout), Vložit (Ctrl+V) ji dá vedle. Tělesa skrytá v Prohlížeči se operace Vyříznout, Spojit a Průnik netýkají; prvek si je zapamatuje, a když chcete skryté těleso zahrnout, zobrazte ho a prvek upravte.

## 6. Šrouby, matice, díry a panty

Všechny spojovací prvky mají rozměry podle norem ISO pro velikosti M2 až M24 (M2, M2,5, M3, M4, M5, M6, M8, M10, M12, M16, M20, M24) a volbu **Vůle pro 3D tisk**. Výchozí vůle je 0,15 mm pro šroub, 0,35 mm pro matici a 0,35 mm pro pant a 0,3 mm pro západku.

### Šroub a matice

| Příkaz | Volby |
| --- | --- |
| Šroub | délka dříku; hlava šestihranná (ISO 4017), válcová s imbusem (ISO 4762), s drážkou (ISO 1207), půlkulatá s křížem (ISO 7045) nebo šestihranná s drážkou či křížem; modelovat závit, zkosená špička, zápich pod hlavou, délka závitu |
| Matice | výška normální (ISO 4032) nebo nízká (ISO 4035, asi poloviční); modelovat závit, zkosený náběh z obou stran |

Šroub i matici umístíte klepnutím do pohledu, manipulátorem nebo zadáním polohy.

### Díra (H)

Klepnete na místo na rovné stěně (tlačítko Do středu plochy ji vystředí) a zvolíte velikost a typ:

- **Průchozí pro šroub** (ISO 273), **se zahloubením pro imbus** (DIN 974), **zápustná 90°** (ISO 15065) nebo **se závitem**.
- Skrz celé těleso, nebo do zadané hloubky.
- **Kapsa pro matici:** na straně šroubu, na druhé straně, nebo boční vsuvka v dané hloubce a směru; volba nízké matice a vůle kapsy (výchozí 0,3 mm).

### Pant

Pant má pět typů: samostatný tištěný vcelku, samostatný na šroub, krabička navržená zavřená, krabička a víko vedle sebe a ohebný půlkruh (tenký pásek, výchozí 0,4 mm, spojí krabičku a víko stojící vedle sebe otevřené nahoru s mezerou 3–25 mm, doporučeno 10–15 mm; leží naplocho kus pod horní hranou a po zavření se ohne do půlkruhu za zadní stěnou; dialog ukazuje poloměr a protažení pásku a volba Ukázat zavřenou zobrazí zavřenou krabičku; volitelný třecí lem drží víko zavřené, potřebuje stěnu krabičky silnější než stěnu víka; nejlépe PP nebo PETG). Všechny se tisknou bez podpěr a v dialogu nastavíte délku pantu, počet kloubů (2, 3, 5 nebo 7), průměr čepu a vůli.

| Typ | Použití | Další volby |
| --- | --- | --- |
| Tištěný vcelku | samostatný pant ležící naplocho; čep patří ke křídlu B, kuželové konce drží v jamkách křídla A | šířka a tloušťka křídla, 0–3 zápustné otvory M2–M4, celý pant nebo jen křídlo A či B, osa podél X nebo Y, poloha, operace |
| Na šroub | jako předchozí, ale v ose je díra pro šroub s maticí; dialog doporučí délku šroubu | stejné jako u tištěného |
| Krabička s víkem | krabička a víko s panty (navržená zavřená, nebo díly vedle sebe), vcelku nebo na kolík | jde přidat i po vytvoření lemu na krabičce nebo drážky ve víku (výška okraje se měří na stěně s pantem); umístění Zapuštěný, Skrytý (jen u krabičky navržené zavřené, osa z filamentu) nebo Na stěně, počet pantů 1–3 |

**Samostatný pant ke dvěma tělesům.** Vytvořte zvlášť Křídlo A a Křídlo B ve stejné poloze s operací Spojit. Křídlo se připojí jen k tělesu, kterého se opravdu dotýká. Osu dejte za hranu tělesa aspoň o poloměr kloubu a vůli (dialog vzdálenost vypíše).

**Krabička s víkem.** Postavte krabičku a víko vedle sebe otevřené nahoru (například dvě tělesa po Skořepině) s horními hranami ve stejné výšce. V dialogu klepněte na krabičku a pak na víko; panty se samy umístí doprostřed mezery na horní hranu. Po tisku víko překlopte o 180° a dosedne přesně na krabičku, zadní stěny jsou pak v jedné rovině.

| Umístění | Mezera mezi díly (čep Ø 3 mm) | Jak vypadá |
| --- | --- | --- |
| Zapuštěný (výchozí) | 0,4 až 4,8 mm, doporučeno 1–2 mm | klouby ve tvaru kapky jsou zapuštěné do horních hran obou stěn, za krabičkou nic netrčí; zevnitř zadních stěn přibude žebro |
| Na stěně | alespoň 6,8 mm | klouby jsou mezi stěnami na šikmé podpěře 45° |
| Skrytý (jen krabička navržená zavřená) | díly se tisknou zvlášť, osa je filament 1,75 mm | u zavřené krabičky nic nevyčnívá: osa je uvnitř zadní stěny, zadní hrany krabičky a víka jsou zkosené o 50°, víko se otevře o 100° a opře se; filament se zasune otvorem v boční stěně a projde celou zadní hranou |

Krabička musí být vysoká aspoň asi 8 mm (dialog vypíše přesnou hodnotu). Při tisku vypněte podpěry úplně a víko nejdřív opatrně rozhýbejte.

**Krabička navržená zavřená (doporučeno).** Krabičku a víko namodelujte zavřené: víko leží na krabičce a zadní stěny lícují. V dialogu Pant zvolte typ Krabička navržená zavřená, klepněte na zadní stěnu krabičky (tím se určí strana pantu) a pak na víko. Pant se navrhne přímo pro zavřenou polohu, takže víko vždy dosedne.

| Spojení | Jak se tiskne | Víko |
| --- | --- | --- |
| Tisk vcelku | aplikace víko sama odklopí o 180° vedle krabičky, vše se tiskne najednou bez podpěr | stejně vysoké jako krabička |
| Kolík / šroub | krabička a víko se tisknou zvlášť, klouby mají průchozí díru pro kus filamentu 1,75 mm nebo klasický (strojní) šroub M2/M3 s maticí; filament se natlačí do krajních kloubů s těsným otvorem 2,0 mm a nevypadne (volba Filament natlačit do krajních kloubů, ve výchozím stavu vypnutá; při sudém počtu kloubů je těsný jen první); u šroubu volba Zapustit hlavu šroubu a matici vytvoří v krajních kloubech válcové zahloubení pro hlavu a šestihrannou kapsu pro matici, klouby se přitom zvětší | může být nižší než krabička |

U všech pantů krabičky jde zvolit **2 klouby** (čep končí dvojitým kuželem, který drží díly osově oběma směry), **posun podél hrany** a **Výsledek: Nová tělesa** (díl krabičky a díl víka zůstanou samostatnými tělesy). Výchozí vůle pantů je 0,35 mm.

**Rezerva při zavření** (výchozí 0,15 mm u pantu na stěně i u zapuštěného, podle zkušebních tisků; jen u tisku vcelku) zvedne osu pantu nad okraj krabičky. Víko pak při zavírání dosedne nejdřív vpředu, takže ho drobná nepřesnost tisku u pantu nenechá pootevřené, a potom si ve vůli kloubů sedne i u pantu. Rezerva větší než polovina vůle nechá u pantu štěrbinu (při rezervě 0,4 mm a vůli 0,4 mm asi 0,4 mm); kolik to dělá, ukáže Simulace.

### Západka

Příkaz **Západka** přidá k zavřené krabičce zaklapávací uzávěr. Klepnete na stěnu krabičky, kde má být, a na víko; nastavíte šířku, počet (1–3), posun podél hrany a vůli.

| Provedení | Jak funguje |
| --- | --- |
| Na stěně | z víka visí přes stěnu krabičky pružný jazýček, jeho zobáček zaskočí pod lištu na krabičce; otevře se zatažením za jazýček |
| Zasunutá | pružný jazýček z víka zajede dovnitř krabičky a jeho výstupek zaskočí do drážky ve stěně; zvenku není vidět (zadejte tloušťku stěny krabičky) |

Všechny převisy jsou 45°, takže se západka tiskne bez podpěr. Pružné západky jsou v provedeních Pružná na stěně a Pružná zasunutá.

**Sklopná na ose** (na stěně nebo zapuštěná) funguje jako západka na kufru s nářadím. Jazýček visí na ose ve dvou očkách víka, sklopí se shora dolů a jeho háček zajede pod lištu na krabičce. Spodní strana lišty je podříznutá, takže když se víko táhne nahoru, háček se přitlačí ke stěně a západka se sama neotevře. Aby se lišta dala vytisknout, má na obou koncích opěry se spodní stranou pod 45° a podříznutá část se mezi nimi tiskne jako most; háček je proto užší než lišta. Otvory pro filament jsou u západek 2,15 mm tam, kde se natlačí, a 2,0 mm + vůle (2,3 mm) tam, kde se má otáčet; u pantů 2,0 mm natlačený a 1,8 mm + vůle (při 0,35 mm tedy 2,15 mm) tam, kde se má otáčet; volný otvor pro šroub je průměr + vůle − 0,1 mm (M3: 3,2 mm) a otvor v očkách pro samořezný šroub M3 má 2,8 mm. Otevře se zatažením za spodní okraj jazýčku: jeho vnitřní strana pod háčkem je zkosená pod 45° v jedné linii se spodní stranou háčku až ke konci jazýčku (i u tištěného vcelku), takže se za něj snadno dostane prst. Jazýček je samostatné těleso, tiskne se naležato na vnější ploše. Na stěně je osou samořezný šroub M3 dlouhý jako šířka západky (vyřízne si závit v obou očkách, matice není potřeba), kus filamentu 1,75 mm dlouhý jako šířka západky, nebo Tisk vcelku: jazýček se tiskne s víkem přiklopený nahoru ke stěně víka, stojí koncem na podložce a osu tvoří tištěné kuželové čepy; víko musí být vysoké asi aspoň 17,3 mm a jazýček je dlouhý podle výšky víka (háček zůstává dole u jeho konce, lišta na krabičce se posune níž). U zapuštěné verze leží jazýček v kapse zarovnané se stěnou a pod ním je výhrabek pro prst, kterým se jazýček vyklopí: do jeho očka se vlepí kus filamentu a jazýček se zvenku zacvakne do zářezů na koncích kapsy. Kde je stěna tenčí než kapsa, přidá se zevnitř nálitek se zkosením 45°.

Volba **Víko bez vůle (háček víko přitáhne)** je u nové západky zapnutá. Háček (u pružné zasunuté západky výstupek) se posune tak, že jeho horní plocha leží na spodní ploše lišty nebo drážky na krabičce, jen 0,05 mm od ní, a zavřené víko nejde nadzvednout. Boční vůle zůstává podle nastavení. Když volbu vypnete, zůstane mezi háčkem a lištou nastavená vůle.

Západku jde přidat i po pantu krabičky: když je víko odklopené (tisk vcelku), západka se spočítá na zavřené krabičce a víko zůstane odklopené.

## 7. Plochy a závity

Režim **Plochy** (G) pracuje přímo se stěnami hotového tělesa. Zapněte ho, klepněte na stěnu a dole se objeví lišta akcí; stejné volby nabídne pravé tlačítko. S klávesou Ctrl (na Macu Cmd) klepnutím přidáte další plochy do výběru (opětovné klepnutí plochu z výběru vyjme). U více rovných ploch jednoho tělesa nabídne lišta Posunout plochy (všechny o stejnou vzdálenost) a Skořepina s otevřenými plochami. Vybrat jde i zaoblený roh (část válce) a rovná stěna, která do zaoblení plynule přechází; Posunout plochu pak posune celý plynule navazující pás (stěny i zaoblené rohy) o stejnou vzdálenost, zaoblení si nechá střed. Hodí se pro vůli, např. lem zmenšený o 0,2 mm.

| Plocha | Akce |
| --- | --- |
| Rovná | Modelovat (E, I, G, R, S, L, kruhové menu Q / dlouhý stisk), Vysunout, Posunout plochu (vysunout / zapustit), Rozdělit plochu (čarou, křivkou nebo odsazením hrany dovnitř plochy), Ohnout plochu kolem hrany, Žebra nebo drážky (rovnoběžná pod úhlem; na válci podél osy i do spirály nebo jako prstence; i jako nové těleso k deformování před spojením), Zarovnat k…, Skica z plochy (Ctrl+D), Prázdná skica na ploše |
| Válcová | Změnit průměr (u otvoru Průměr otvoru), Zarovnat k…, Závit |

**Rozdělit plochu** a **Ohnout** mají táhla v barvách os jako manipulátor: šipka posouvá, oblouk otáčí, kostička mění velikost. Přepínačem Táhla zobrazíte jen jeden druh.

**Modelovat plochy** funguje podobně jako úpravy ploch v Blenderu. Vyberte rovinnou plochu (víc ploch: Shift nebo volba v dialogu) a zvolte nástroj: **Vytáhnout (E)**, **Vsadit (I)** – menší plocha s okrajem, **Posunout (G)**, **Otočit (R)**, **Velikost (S)** – po normále nebo po ose X, Y, Z, a **Řez smyčkou (L nebo Ctrl+R)** – řez dokola tělesem přes hranu pod ukazatelem (Počet řezů je rozdělí rovnoměrně). Hodnotu nastavíte tažením za úchyt na modelu (Shift = jemně) nebo ji napíšete z klávesnice, např. E 5 Enter. Kroky jdou za sebou bez potvrzování: další krok (jiný nástroj, jiná plocha, Enter) ten předchozí potvrdí, Esc zruší rozpracovaný krok, Shift+R zopakuje poslední krok na nově vybraných plochách. Vrátit krok a Rozšířit výběr jsou v dialogu, na telefonu je vše i v kruhovém menu (dlouhý stisk). OK uloží všechny kroky jako jednu položku časové osy. Přepínač Vybírat (Plochy / Hrany / Vrcholy) umožní posouvat, otáčet a měnit velikost i hran a vrcholů. Duplikovat plochu (D, nebo Vsadit se šířkou 0) vytvoří kopii plochy, se kterou pak jde hýbat bez změny okolních stěn. Modelovat je také v pásu Upravit. Tip: E a pak S udělá zkosený výstupek, I a pak E výstupek nebo kapsu s okrajem.

**Závit** (T) vytvoří závit na celé válcové ploše, tedy na čepu nebo v díře. Zvolíte velikost ze seznamu, případně upravíte stoupání, určíte pravý nebo levý směr, konec, od kterého se měří, odsazení a délku. Volba **Po celé délce plochy** délku převezme z válce. Na ploše, která není válcem, závit nejde.

## 8. Prohlížeč a časová osa

**Prohlížeč** vlevo nahoře ukazuje tělesa a skici. Ikona oka položku skryje nebo zobrazí, klepnutím těleso vyberete, dvojklikem ho přejmenujete; dvojklik na skicu otevře její úpravu. Šipkou v záhlaví prohlížeč sbalíte.

**Časová osa** dole zaznamenává každý krok modelu jako ikonu.

| Akce | Jak |
| --- | --- |
| Vybrat krok | klepnutí na ikonu; vybere se i těleso, které krok vytvořil |
| Upravit krok | dvojklik na ikonu otevře původní dialog nebo skicu |
| Další volby | pravé tlačítko: Upravit prvek, Potlačit / Obnovit prvek, Přesunout značku sem, Odstranit prvek |
| Procházet historii | tlačítka na začátek, o krok zpět, o krok vpřed, na konec |

Kroky za značkou historie jsou vypnuté a nový prvek se vloží na její místo. Potlačený prvek zůstane v ose, ale model ho nezohlední. Krok, který skončil chybou, se označí a důvod uvidíte v tipu.

## 9. Soubory

Všechny souborové příkazy jsou v menu **Soubor**. Názvy souborů mají tvar `nazev-navrhu_SkicaCAD-Beta-1.05`, takže z názvu poznáte verzi aplikace.

| Příkaz | Formát | Popis |
| --- | --- | --- |
| Nový návrh | – | prázdný návrh |
| Moje návrhy… | v prohlížeči | seznam automaticky uložených návrhů (až 60) |
| Otevřít ukázkový model | – | vzorový model |
| Otevřít návrh… | .json, .zip | uložený návrh nebo archiv exportovaný ze SkicaCAD |
| Uložit návrh | .json | celý návrh včetně historie kroků |
| Zálohovat knihovnu | .zip | všechny návrhy najednou, například pro přenos na jiné zařízení |
| Obnovit knihovnu ze zálohy… | .zip | vrátí návrhy ze zálohy |
| Importovat… | .stl, .obj, .dxf, .svg, .zip | těleso (STL, OBJ) nebo obrys jako nová skica (DXF, SVG) |
| Exportovat STL | .stl | síť pro tisk |
| Exportovat 3MF | .3mf | pro moderní slicery (PrusaSlicer, Bambu Studio, OrcaSlicer), každé těleso jako samostatný objekt |
| Exportovat 3MF – jeden objekt s díly | .3mf | všechna tělesa jako díly jednoho objektu: např. kloubový řemínek zůstane ve sliceru složený, články jsou jeho díly a každý může mít jiný filament; Rozmístit je nerozhází |
| Exportovat OBJ | .obj | síť pro jiné programy |
| Exportovat vše | .zip | STL, OBJ a soubor návrhu v jednom archivu |

Exportují se jen viditelná tělesa; co nechcete, skryjte okem v Prohlížeči. Jednotky jsou milimetry, osa Z míří nahoru.

**Import sítě (STL, OBJ).** Nastavíte jednotky, měřítko, vycentrování, položení na rovinu XY a operaci. Velmi podrobný model aplikace nabídne zjednodušit na zvolený počet trojúhelníků. Soubor nad 400 MB odmítne.

**Import obrysu (DXF, SVG).** Vznikne nová skica na zvolené rovině s nastaveným měřítkem; obrys pak vysunete. DXF a SVG jde vložit i přímo na záložce SKICA.

Soubor můžete také přetáhnout myší do pohledu.

## 10. Klávesové zkratky

Zkratky nefungují při psaní do pole; na Macu používejte Cmd místo Ctrl.

| Zkratka | Kde | Akce |
| --- | --- | --- |
| Ctrl+Z | všude: v modelu, ve skice i při otevřeném dialogu příkazu (vrátí poslední dokončenou změnu) | Zpět |
| Ctrl+Y, Ctrl+Shift+Z | všude: v modelu, ve skice i při otevřeném dialogu příkazu | Znovu |
| Ctrl+A | model | vybrat všechna tělesa |
| Ctrl+C / Ctrl+V | model, skica | kopírovat a vložit těleso nebo prvek skici |
| Ctrl+D | model, skica | duplikovat; v režimu Plochy skica z vybrané plochy |
| Enter | příkaz, skica | potvrdit příkaz, dokončit skicu nebo ukončit čáru |
| Esc | všude | zrušit příkaz, nástroj nebo výběr |
| Del / Backspace | všude | smazat vybrané těleso, prvek skici nebo krok časové osy |
| F6 | všude | přizpůsobit pohled |
| Šipky, PageUp / PageDown | model, skica | posun vybraného prvku nebo těles o krok mřížky (Shift ×10, s Ctrl nebo Alt jemně o 0,1 mm, Ctrl+Shift+↑/↓ o 0,1 mm v ose Z, Alt+Shift o 1 mm); bez výběru posun pohledu |
| S, E, F, H | model | Vytvořit skicu, Vysunutí, Zaoblení, Díra |
| M, R, T | model | Přesunout, Otočit, Závit |
| I, G | model | Měřit, režim Plochy |
| L, K, R, C, E, P, D | skica | Čára, Křivka, Obdélník, Kružnice, Elipsa, Mnohoúhelník, Drážka |
| O, X, T, J, Q | skica | Odsadit, Kombinovat, Oříznout, Spojit, Zrcadlit, Pomocná |

Při tažení myší: **Shift** zamkne směr (manipulátor posunu nechá jen převažující osu, ve skice se prvek nebo bod posune jen vodorovně nebo svisle), **Ctrl** zachová poměr stran (rohy obdélníku, elipsa a obrysy ve skice, táhla měřítka). Pravé tlačítko otevírá jen nabídky aplikace, ne nabídku prohlížeče; klepnutí bez tažení otevře nabídku, tažení posouvá pohled.

## 11. Měření, tipy a omezení

**Měřit** (I) ukáže vzdálenost dvou bodů na modelu a rozdíly ΔX, ΔY, ΔZ v milimetrech; klepnutí blízko vrcholu se k němu přichytí. Klepnutí na válcovou plochu nebo kruhovou hranu hned ukáže průměr a poloměr.

**Simulace** má dvě volby: Víko krabičky a Pohyb a kolize (model bez víka s pantem nebo západkou otevře rovnou Pohyb a kolize). Víko krabičky ukáže, jak se krabička otevírá a zavírá. Klepněte na víko (bez klepnutí se vybere víko s pantem nebo západkou). Víko se otáčí na skutečné ose pantu krabičky. Když je osa nad okrajem, víko se zavře o kousek přes 180°, až dosedne vpředu. Páčky a jazýčky západek na ose se nejdřív odklopí a pak jedou s víkem; víko bez pantu se jen zvedne. Polohu nastavíte posuvníkem Průběh, tlačítka Otevřít, Zavřít a Dokola pohyb přehrají. Na pozadí se zkontrolují kolize v celém rozsahu: tělesa, která do sebe narazí, zčervenají a dialog vypíše, ve kterých polohách. Zaskočení pružné západky těsně před zavřením se za kolizi nepočítá. Simulace model nemění.

Když je víko pro tisk vcelku odklopené vedle krabičky, můžete zaškrtnout **Po zavření dialogu nechat krabičku zavřenou**. Na časovou osu se přidá krok **Zavřená krabička**: víko, jeho páčky a díly pantu se otočí do zavřené polohy podle simulace. Další kroky pak pracují se zavřenou krabičkou. Před tiskem krok smažte nebo posuňte značku časové osy před něj.

Obráceně, když je víko zavřené (pant na kolík nebo šroub, nebo po kroku Zavřená krabička), nabídne se **Po zavření dialogu nechat krabičku otevřenou** a přidá se krok **Otevřená krabička**. Kroky jdou za sebou kombinovat; západka přidaná po nich se vždy spočítá na zavřené krabičce.

- Návrhy se ukládají jen v prohlížeči daného zařízení. Důležité modely ukládejte do souboru nebo zálohujte knihovnu, data v prohlížeči se mohou ztratit.
- Zpět a Znovu fungují jen mimo rozdělaný příkaz a skicu.
- U složitějších modelů se po změně ukáže Přepočítávám model…; závit nebo díra se závitem se počítají několik sekund.
- Na telefonu je Prohlížeč sbalený, dialog je dole a navigační lišta svisle vpravo.
- Pro tisk spojovacích prvků a pantů platí výchozí vůle ověřené zkušebním tiskem (šroub 0,15 mm, matice 0,35 mm); pokud váš tisk vyjde jinak, upravte vůli v dialogu.
- Aplikace má označení Beta a číslo verze se zvyšuje s každou změnou; uvidíte ho vlevo nahoře i v názvech souborů.

## 12. Organické modelování (postavičky)

Záložka **ORGANICKÉ** (fialová, vedle TĚLESO) obsahuje nástroje pro měkké, oblé tvary – postavičky, zvířátka, figurky –, jak se modelují v Blenderu a podobných programech. Výsledky jsou běžná tělesa: dají se kombinovat, exportovat a každý krok jde v časové ose upravit.

| Nástroj | K čemu je | Hlavní nastavení |
| --- | --- | --- |
| Měkké spojení | Postavička z koulí, elipsoidů, kapslí, kvádrů a prstenců, které se v místě dotyku plynule slijí | tvary přidáte v dialogu, vyberete klepnutím, posunete/otočíte manipulátorem; Odebírá hmotu (oči, ústa); Měkkost spojení; Souměrně podle osy X; Šablona postavičky; Jemnost |
| Kostra | „Panáček z čárek“ s tloušťkou v každém bodě – ruce, nohy, ocasy | klepnutím do pohledu přidáte bod napojený na vybraný; Nová větev; tloušťka a poloha bodu; Šablona |
| Tažení po křivce | Kruh nebo profil ze skici podél otevřené čáry či křivky (hadice, ucha, vlasy) | Dráha, Průřez, Průměr kruhu, Zkroucení po délce, Velikost na konci |
| Přechod profilů | Plynulý tvar přes 2–5 uzavřených profilů ze skic (trup, váza) | profily v pořadí, Plynulý přechod |
| Deformace | Zkroutit, zúžit nebo ohnout celé těleso nebo jen část délky | osa, úhel / velikost na konci, Od–Do (% délky), směr ohybu |
| Mřížka | Těleso v kleci; tažením bodů klece se plynule deformuje | 2×2×2 až 4×4×4 body, výběr bodů (Ctrl), Posun vybraných, Vynulovat |
| Měkký posun | Místo na tělese táhne své okolí | Bod (klepnutím), Posun, Dosah, Průběh |
| Vyhladit dělením | Z hranatého tvaru oblý (Catmull–Clark) | 1–3 úrovně |
| Sochat | Štětce Nanést, Nafouknout, Vyhladit, Uchopit, Zploštit, Stáhnout | Velikost a Síla štětce, Obráceně, Souměrně podle X, Jemnost; každý tah jde vrátit tlačítkem Zpět |
| Přesíťovat | Převod na rovnoměrnou síť, volitelně vyhlazení | Jemnost sítě, Vyhlazení |
| Plochá podstava | Zarovná spodek, aby postavička stála a dobře se tiskla | Odříznout zespodu, Postavit na podložku |
| Konektory | Rozřízne těleso rovinou nebo nakreslenou čarou a díly spojí kolíkem, snap-fit západkou, rybinou, kulovým nebo čepovým kloubem | typ spoje, řez kolmo na osu (osa, poloha) nebo čarou přes model, počet 1–3, průměr / šířka, délka spoje, vůle, natočení, směr |
| Vydutit | Dutá postavička se stěnou dané tloušťky a otvorem pro vytečení | Tloušťka stěny, otvor (klepnutím na těleso), Jemnost sítě |
| Kontrola tisku | Červeně převisy, které potřebují podpěry, oranžově příliš tenké stěny; nic nemění | největší převis, nejtenčí stěna |

**Kloubový model** (Pro tisk) rozdělí těleso na články spojené klouby, které se tisknou vcelku: jeden článek končí kulatým kloubem, druhý má jazýček s kotoučem uvězněný ve štěrbině, kolem dokola je vůle (výchozí 0,4 mm, u Pantu 0,5 mm). Klouby se otáčejí kolem svislé osy – model leží na podložce a články se ohýbají do stran (had, drak, ještěrka). Po tisku klouby rozhýbejte. Typ kloubu: Kotouč (popsaný výše), Pant (tři klouby nad sebou jako u dveřního pantu, krajní drží svislý čep procházející prostředním) – tyto dva se otáčejí kolem svislé osy Z –, Flexi (z tělesa se vyřízne nástroj FlexiJoint Maker – tenký kotouč s miskou kolem koule; zůstanou dva články držené koulí v misce, natáčejí se do všech stran; kloub stojí na podložce a svislé očko vychází ze spodní stěny, na kulatém tělese se zvedne výš; velikost nástroje se řídí průřezem tělesa – zmenší i zvětší, nejvýš 4×) nebo Nahoru/dolů (jako tištěný řemínek hodinek: jazýček mezi dvěma rameny s kosočtverečnými čepy ve V drážkách, články se ohýbají kolem zápěstí; od Beta 1.78 kuželové čepy v kuželových důlcích, které se otáčejí hladce. Volba Tisknout po dílech a zacvaknout rozloží články vedle sebe, tisknou se zvlášť (třeba každý jinou barvou) a jazýček se pak zasune mezi ramena sousedního článku, až čepy zacvaknou). Natočení kloubu určuje, o kolik se články otočí; u Kotouče a Pantu se podle něj zkosí do klínu konec jednoho článku, druhý má rovné čelo. Zapínání na koncích udělá z modelu řemínek: Spona (na začátek samice, na konec samec boční rozepínací spony) nebo Spona sklápěcí pro tenké řemínky (samec leží naplocho na konci, samice se tiskne nastojato na začátku na patce v kloubu a po tisku se sklopí o 90° ven do roviny řemínku), nebo Kloub (na začátek dvě ramena s kuželovými důlky jako samice, na konec jazýček s kuželovými čepy jako samec, stejně jako kloub Nahoru/dolů tisknutý po dílech; po zacvaknutí se řemínek spojí do kruhu a jde zase rozepnout); díly zapnutí nahradí konce řemínku, takže jeho délka zůstane stejná, a spona má stejnou šířku i výšku jako řemínek (nejméně 9 × 3,6 mm; pod 14 mm úzká varianta bez prostředního jazyka; Délka jazýčků spony zkrátí nebo prodlouží samce i samici) (stejná spona je samostatně v TĚLESO › Součásti › Spona, i s průvlekem pro popruh; volba Vycentrovaná tam udělá jazýčky samce vysoké jako celý samec a samici vyšší o dno, strop a vůli, takže po zapnutí z ní samec vychází přesně uprostřed). Hotové kloubové díly lze vložit i přes TĚLESO › Součásti › Kloubové díly: Článek s háčkem, Dva spojené články, Háček (připojit ke svému modelu) a Kapsa – negativ (odečíst od svého modelu, čep zůstane); velikost v %, otočení a poloha. Každý typ kloubu je také samostatná součástka ve stejné nabídce (TĚLESO › Součásti › Kloubové díly, Druh: Kloubový spoj; hotové modely jsou pod Druh: Hotové díly): dva díly už spojené v kloubu (Kotouč, Pant, Nahoru/dolů nebo Flexi), tvar Hranol nebo Válec s volitelnou délkou, šířkou a výškou (průměrem), vůlí a natočením; tisknou se vcelku bez podpěr a každý díl připojíte k vlastnímu modelu přes Kombinovat › Sjednotit. Rozmístění kloubů: Rovnoměrně (podle počtu kloubů), nebo Řezy – stiskněte levé tlačítko, táhněte přes model a pusťte; každý řez určí jeden kloub, může být i šikmý (nejvýš 60°) a osa řetězu se nastaví podle prvního řezu. Pohled se přitom otáčí pravým tlačítkem. Nebo Podél křivky – klepáním naklikáte křivku podél zahnutého modelu (had do S) od začátku ke konci, klouby se rozmístí rovnoměrně po ní a každý stojí kolmo na křivku (křivka nesmí dělat smyčky). Zpět a Smazat vše odeberou poslední nebo všechny řezy či body.

**Konektory** (Pro tisk, dříve Díly s kolíky) rozříznou těleso a oba díly spojí zvoleným spojem; díly se tisknou zvlášť. Řez zadáte kolmo na osu (osa a poloha), nebo volbou Řez: stiskněte levé tlačítko, táhněte přes model a pusťte – rovina řezu půjde čarou ve směru pohledu, takže lze řezat i šikmo (pohled se přitom otáčí pravým tlačítkem), nebo volbou Křivkou: body klepáte do pohledu přes těleso a spoj (jen kolík nebo snap-fit) se postaví na nejdelší rovný úsek křivky. Typy spoje: **Kolík** (na spodním dílu, nebo samostatné kolíky do otvorů v obou dílech), **Snap-fit** (rozříznutý kolík se zobáčkem projde zúženým otvorem a zacvakne za osazení v dutině), **Rybina** (lichoběžníkový výstupek přes celý řez, horní díl se nasune z boku; Směr podél nebo napříč řezu), Kulový kloub (koule na krčku zacvakne do jamky s užším ústím; mezera a mírně kuželové plochy dovolí otáčení i náklon podle Natočení kloubu) a **Čepový kloub** (střídající se očka kolem osy v rovině řezu, čep se přidá jako samostatné těleso nebo použijte kus filamentu; V odlehčení dovolí ohyb o zadaný úhel). Náhled je rozložený, po potvrzení zůstanou díly na místě.

**Rozdělit na díly** (Pro tisk; v záložce Těleso v Nástrojích › Pro tisk) rozdělí model, který se nevejde na tiskárnu, na mřížku dílů. Volba Podle tiskové plochy spočítá počet dílů z rozměrů podložky a výšky tisku, volba Počet dílů ho zadá v osách X, Y a Z. Díly drží pohromadě Rybina (zámek), Kolík, Snap-fit, nebo jsou Bez spoje k slepení; kde se spoj do řezu nevejde, řez zůstane rovný a dialog to napíše. Díly se očíslují zdola, zepředu a zleva (Těleso – díl 1, 2, …) a v tomto pořadí se i skládají. Náhled je rozložený.

**Orientace pro tisk** vyzkouší položit těleso na jeho největší rovné plochy i ve směrech os a pro každé natočení odhadne podpěry (převisy strmější než 45° krát jejich výška nad podložkou), výšku a plochu na podložce. Natočení seřadí od nejlepšího, vybrané ukáže s převisy červeně a OK těleso otočí a položí na podložku (v časové ose jako Přesunout).

**Pohyb a kolize** (Simulace, volba Pohyb a kolize) ověří, jestli se díly při pohybu nesrazí. Vyberte pohyblivá tělesa a osu: rovnou hranu, kruhovou hranu čepu nebo otvoru (osa vede jejím středem) nebo X / Y / Z středem těles; zvolte Otáčení nebo Posun a rozsah Od–Do. Zkontrolovat kolize projde rozsah po krocích a vypíše, v jakých polohách a s kterými tělesy dochází k průniku; posuvník Poloha a Přehrát ukážou pohyb a průnik červeně. Model se nemění.

**Otevřít ve sliceru** (Soubor nebo Nástroje › Pro tisk) připraví 3MF pro Bambu Studio, PrusaSlicer, OrcaSlicer nebo Curu: díly položí na podložku vedle sebe (nebo nechá jak jsou v modelu) a vystředí je na podložku zadaného rozměru, jako samostatné objekty nebo jeden objekt z dílů. Náhled ukáže obrys podložky a varuje, když se díly nevejdou. Prohlížeč slicer spustit neumí, soubor se uloží a otevře se v sliceru; na telefonu jde Sdílet rovnou do aplikace sliceru.

**Přechod profilů – jak na něj:** nakreslete dva nebo víc uzavřených tvarů (kružnice, obdélník, křivka…) v různých skicách nad sebou – druhou skicu založte na stejné rovině s Odsazením roviny, např. 30 mm. Pak zvolte Přechod profilů, v dialogu vyberte profily v pořadí zdola nahoru a těleso plynule přejde z jednoho tvaru do druhého (váza, trup, noha stolu, rukojeť).

Tipy: postavičku začněte Šablonou v Měkkém spojení nebo v Kostře a upravujte; se zapnutou souměrností stačí modelovat jednu polovinu. Sochání a vydutění pracují na síti z voxelů – volba Jemnost určuje detail i rychlost (Hrubá je nejrychlejší). Než začnete sochat těleso vytvořené CAD nástroji (s ostrými hranami), je dobré ho nejdřív Přesíťovat.
