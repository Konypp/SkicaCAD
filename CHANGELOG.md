# Changelog

## Beta 1.10
- Pant krabičky (tisk vcelku, provedení na stěně): opravena příčina mezery u pantu. Při ose nad okrajem (Rezerva při zavření) sahala část pantu, která drží ve stěně, až do výšky osy, tedy nad okraj. Zavřené víko si na ni u pantu sedlo a zůstalo pootevřené. Teď tato část končí v rovině okraje.
- Rezerva při zavření má nově výchozí hodnotu **0,2 mm** (polovina vůle 0,4 mm). Víko při zavírání pořád dosedne nejdřív vpředu, ale ve vůli kloubů si pak sedne celé. Při 0,4 mm zůstane u pantu mezera asi 0,4 mm.
- Simulace: zavřené víko si sedne ve vůli kloubů (simulace najde, kam až může klesnout, než do něčeho narazí) a dialog napíše, jestli dosedne celé, nebo jak velká mezera u pantu zůstane.

## Beta 1.09
- Nový příkaz **Simulace** (skupina Kontrola): ukáže, jak se krabička otevírá a zavírá. Víko se otáčí na skutečné ose pantu krabičky (u osy nad okrajem se zavře o kousek přes 180°, až dosedne vpředu). Páčky a jazýčky západek na ose se nejdřív odklopí a pak jedou s víkem. Víko bez pantu se jen zvedne. Posuvník Průběh, tlačítka Otevřít, Zavřít a Dokola. Na pozadí se zkontrolují kolize v celém rozsahu (u zavřené polohy jemněji); tělesa, která do sebe narazí, zčervenají a dialog vypíše polohy. Zaskočení pružné západky těsně před zavřením se za kolizi nepočítá.
- Opraveno: západka přidaná **po pantu** krabičky brala za rovinu dělení vrchol kloubů pantu místo okraje krabičky, takže lišta a háček vyšly o pár milimetrů výš (na to přišla simulace). Teď se použije okraj krabičky uložený pantem.
- Více páček nebo jazýčků jedné západky (počet 2–3) jsou samostatná tělesa (Západka – jazýček 1, 2…), aby se v simulaci mohly otáčet každý na své ose.

## Beta 1.08
- Západka, nová provedení **Sklopná na ose na stěně** a **Sklopná na ose zapuštěná** (jako na kufru s nářadím): jazýček visí na ose ve dvou očkách víka, sklopí se shora dolů a jeho háček zajede pod lištu na krabičce. Spodní strana lišty je podříznutá (30°) a lišta leží tak nízko, že tah víka háček přitlačí ke stěně: západka se sama neotevře. Otevře se zatažením za spodní okraj jazýčku. Jazýček je samostatné těleso, tiskne se naležato na vnější ploše.
- Na stěně: osa ze šroubu M3 (samořezný do vzdálenějšího očka) nebo z kusu filamentu 1,75 mm natlačeného do oček. Zapuštěná: jazýček leží v kapse zarovnaný se stěnou, do jeho očka se vlepí kus filamentu a jazýček se zvenku zacvakne do zářezů na koncích kapsy; kde je stěna tenčí než kapsa, je zevnitř nálitek se zkosením 45°.

## Beta 1.07
- Západku jde přidat i **po pantu**: když je víko odklopené pantem krabičky (tisk vcelku), západka se spočítá na zavřené krabičce (víko se pro výpočet samo přiklopí) a víko zůstane odklopené.
- Západka, nová provedení **Otočná páčka na stěně** a **Otočná páčka zapuštěná**: páčka se otáčí na ose ve stěně víka (samořezný šroub M3 nebo kus filamentu 1,75 mm), visí dolů přes krabičku a výřezem na konci zachytí kolík na krabičce. Odklopením stranou o 90° se víko uvolní. Zapuštěná páčka leží v kapse zarovnaná se stěnou (stěna aspoň 2,7 mm). Páčka je samostatné těleso, tiskne se naležato; zevnitř víka je pod osou kuželový nálitek.
- Původní pružné západky se jmenují Pružná na stěně a Pružná zasunutá.

## Beta 1.06
- Pant krabičky (tisk vcelku): nová volba **Rezerva při zavření** (výchozí 0,4 mm). Osa pantu leží o tuto hodnotu nad okrajem krabičky, takže víko při zavírání nejdřív dosedne vpředu a u pantu má volno. Dřív ležela osa přesně v rovině okrajů: víko se pak opřelo o okraj u pantu a i nepatrná nepřesnost tisku ho nechala vpředu pootevřené (páka asi 10 : 1). U pantu na kolík/šroub se nepoužívá, tam stačí vůle díry.

## Beta 1.05
- Nový příkaz **Západka** (skupina Vytvořit) pro krabičku navrženou zavřenou: provedení **Na stěně** (pružný jazýček z víka se zobáčkem zaskočí pod lištu na krabičce) nebo **Zasunutá** (pružný jazýček zajede dovnitř krabičky a jeho výstupek zaskočí do drážky ve stěně, zvenku není vidět). Šířka, počet 1–3, posun podél hrany, vůle; výsledek přidat k tělesům nebo jako nová tělesa. Všechny převisy 45°, tiskne se bez podpěr. Západku přidejte dřív než pant navržený na zavřené krabičce.
- Pant: **2 klouby** (čep končí dvojitým kuželem zachyceným v kloubu, takže díly drží osově oběma směry), u pantu krabičky **posun podél hrany** a volba **Výsledek: nová tělesa** (díl krabičky a díl víka zůstanou samostatná tělesa; kapsy, žebra a díry pro čep se do krabičky a víka vyříznou).
- Zaoblení: kde se v jednom rohu potkají tři zaoblované hrany, roh je kulový (dřív tam zůstala špička).

## Beta 1.04
- Pant, nový typ **Krabička navržená zavřená**: krabičku a víko namodelujete zavřené (víko leží na krabičce, zadní stěny lícují), klepnete na zadní stěnu krabičky a pant se navrhne přímo pro zavřenou polohu, takže víko vždy dosedne.
  - **Tisk vcelku**: aplikace víko sama odklopí o 180° vedle krabičky (víko musí být stejně vysoké jako krabička).
  - **Kolík / šroub**: klouby mají průchozí díru pro kus filamentu 1,75 mm nebo šroub M2/M3; krabička a víko se tisknou zvlášť, víko může být nižší než krabička.
  - Umístění zapuštěné nebo na stěně, strana pantu ±X / ±Y.
- Výchozí vůle pantů je 0,4 mm.
- Zapuštěný pant: spodní hrana kloubu vychází šikmo 45° přímo z vlastní stěny, takže špička kloubu už nevisí v mezeře (tiskne se čistěji).
- Pravé tlačítko na PC už neotevírá i nabídku prohlížeče (týká se hlavně nabídky tělesa a časové osy).
- Shift při tažení zamkne směr: manipulátor posunu nechá jen převažující osu, ve skice se prvek nebo bod posune jen vodorovně nebo svisle.
- Ctrl při změně velikosti zachová poměr stran: rohy obdélníku a elipsa ve skice, obrysy ve skice a táhla měřítka manipulátoru.
- Měřit: klepnutí na válcovou plochu nebo kruhovou hranu hned ukáže průměr a poloměr.
- Rozříznout: po natočení řezné roviny táhly se posun drží natočené roviny a rovina se posune přesně o tažený kus.

## Beta 1.03
- Pant krabičky s víkem má nové umístění **Zapuštěný** (nově výchozí): klouby sedí na horní hraně a jsou zapuštěné do stěn krabičky i víka, takže za krabičkou nic netrčí a díly stojí těsně vedle sebe (mezera 0,4 mm až asi 4,8 mm pro čep Ø 3 mm).
  - Klouby mají tvar kapky (kruh se špičkou 45° dolů) a kapsy ve stěně druhého dílu stejný tvar s vůlí, takže se vše vytiskne vcelku bez podpěr.
  - Zevnitř zadních stěn přibude podél pantu žebro se šikmým spodkem, aby kapsa neprořízla tenkou stěnu.
  - Původní pant na stěně zůstává jako volba **Na stěně**.

## Beta 1.02
- Pant krabičky s víkem: kontrola výšky. Šikmá podpěra kloubu sahá pod horní hranu (u čepu Ø 3 mm asi 9 mm), u nižší krabičky by trčela pod podložku, proto dialog teď upozorní, jakou nejmenší výšku krabička potřebuje.

## Beta 1.01
- Pant, nový typ **Krabička s víkem**: krabička a víko stojí na podložce vedle sebe otevřené nahoru (horní hrany ve stejné výšce, mezera mezi nimi alespoň 2 × (poloměr kloubu + vůle), pro čep Ø 3 mm asi 6,8 mm). Klepnete na krabičku a na víko a panty se samy umístí doprostřed mezery na horní hranu a připojí ke stěnám obou těles.
  - Klouby drží na stěně šikmou podpěrou 45°, takže se vše vytiskne vcelku bez podpěr; víko se po tisku překlopí o 180° a dosedne na krabičku.
  - Volíte délku pantu, počet pantů (1–3), počet kloubů, průměr čepu a vůli.

## Beta 1.00
- Nový příkaz **Pant** (skupina Vytvořit): generátor pantu pro 3D tisk.
  - Typ **Tištěný vcelku**: tiskne se jako jeden kus bez podpěr. Čep patří ke křídlu B a kuželovými konci drží v jamkách krajních kloubů křídla A; mezi díly je všude vůle (výchozí 0,35 mm). Křídlo se otočí asi o 170°.
  - Typ **Na šroub**: v ose je díra pro šroub s maticí, dialog doporučí délku šroubu.
  - Parametry: délka, šířka a tloušťka křídla, 3/5/7 kloubů, průměr čepu, vůle, 0–3 otvory pro zápustné šrouby M2–M4 v každém křídle, osa podél X nebo Y.
  - Lze vytvořit celý pant, nebo jen křídlo A či B. Při operaci Spojit se křídlo připojí jen k tělesu, kterého se opravdu dotýká, takže krabička a víko zůstanou samostatná.

## Beta 0.99
- Nový příkaz **Díra** (H): klepnete na místo na rovné stěně a vyberete velikost šroubu M2–M24.
  - Typy díry: průchozí (ISO 273), se zahloubením pro imbus (DIN 974), zápustná 90° (ISO 15065), se závitem.
  - Díra jde skrz stěnu, nebo do zadané hloubky. Polohu lze zadat i číslem a tlačítkem dát díru do středu plochy.
  - Kapsa pro matici: na straně šroubu, na druhé straně, nebo boční vsuvka ve zvolené hloubce a směru. Volitelně pro nízkou matici a s vůlí kapsy.
- Nový příkaz **Skořepina**: z plného tělesa udělá duté se zadanou tloušťkou stěny. Klepnutím na rovné stěny je otevřete, takže vznikne např. krabička.
- Skica, nový nástroj **Odsadit** (O): vzdálenost a směr (ven / dovnitř) nastavíte v paletě a klepnete na obrys. Kružnice, obdélník, mnohoúhelník a drážka zůstávají svým tvarem, ostatní obrysy se odsadí jako čára.
- Skica, nový nástroj **Text**: zadáte text, výšku písmen a tučné písmo a klepnete na začátek. Písmena jsou uzavřené profily pro vysunutí nebo vyříznutí, včetně české diakritiky (písmo DejaVu Sans). Text, polohu, výšku, natočení a mezery upravíte v paletě.
- Soubor › **Exportovat 3MF**: formát pro moderní slicery (PrusaSlicer, Bambu Studio, OrcaSlicer). Každé viditelné těleso je samostatný objekt, jednotky mm.

## Beta 0.98
- Matice: nová volba Výška – Normální (ISO 4032) nebo Nízká (ISO 4035, pojistná matice). Nízká má přibližně poloviční výšku, např. M3 1,8 mm, M6 3,2 mm, M10 5 mm, M12 6 mm. Šířka klíče zůstává stejná.
- Těleso se jmenuje „Matice M6 nízká“.

## Beta 0.97
- Moje návrhy: dva návrhy už nemohou mít stejný název. Když zadáte název, který už existuje, aplikace k němu přidá pořadí, např. „Držák (2)“, a oznámí to.
- Totéž platí pro nový návrh „Bez názvu“ a pro otevřený soubor se stejným názvem. Během psaní názvu se nic nepřejmenovává, kontrola proběhne až po potvrzení.

## Beta 0.96
- Gizmo posunu: tažením za středový bod se tělesa posouvají jen v rovině X a Y, výška (Z) se nemění. Pro Z je dál modrá šipka.
- Rozříznout a Ohnout ponechávají volný pohyb středového bodu.

## Beta 0.95
- Skica: elipsa se kreslí na dvě klepnutí. Ze středu: střed, pak roh obdélníku, do kterého se vepíše. Z rohu: dva protější rohy. Natočení se nastavuje v paletě. Když je obdélník plochý, druhá osa dostane polovinu první, takže nevznikne „čára“.
- Šipky na klávesnici posouvají o krok mřížky, se Shiftem o 10 kroků:
  - ve skice vybraný prvek;
  - v příkazu Přesunout tělesa (PageUp / PageDown v ose Z);
  - u vybraných těles otevřou Přesunout s posunem.
- Když není nic vybráno, šipky posouvají pohled.

## Beta 0.94
- Výchozí vůle pro 3D tisk podle tiskového testu: šroub 0,15 mm, matice 0,35 mm.
- Příkaz Závit nastaví vůli podle vybrané plochy: čep 0,15 mm, díra 0,35 mm. Ručně zadaná hodnota se nepřepisuje a uložené prvky si vůli ponechávají.

## Beta 0.93
- Skica: u vybrané čáry se už nezobrazují rámečky s délkou a úhlem. Při zapnutých kótách jsou délky v kótách a u otevřené čáry je v kótě i úhel (oblouk od osy X). Při vypnutých kótách se rámečky ukazují dál.
- Při tažení za táhla tvaru se rámeček s rozměrem při zapnutých kótách neukazuje, kóty se mění přímo.

## Beta 0.92
- Skica: nástroj Vystřihnout je nahrazen nástrojem Kombinovat (X). V paletě zvolíte operaci: Odečíst, Sjednotit, Průnik nebo Rozdělit (čarou či křivkou). Klepnete na první tvar a pak na druhý tvar nebo čáru.
- Sjednotit spojí dva překrývající se tvary do jednoho obrysu jedním krokem. Oříznout (T) dál slouží k odstranění jednotlivých úseků čar.
- Výsledky Kombinovat a Oříznout ukazují kóty, táhla a řádky v paletě jen u rovných stran. Oblouky ani drobné zbytky u průsečíků se nevypisují.
- Anglicky: Kombinovat = Combine, Oříznout = Trim.

## Beta 0.91
- Skica: vybraný tvar má táhla pro změnu rozměrů jako kružnice. Obdélník: rohy a středy stran. Mnohoúhelník: vrchol (poloměr). Elipsa: konce obou os. Drážka: oba konce (délka) a bok (šířka). Popisky kót táhla nezakrývají.
- Skica: nový nástroj Oříznout (T). Klepnutím na úsek čáry mezi průsečíky se úsek odstraní a navazující čáry se spojí do jednoho obrysu (např. kružnice + obdélník → jeden tvar). Úsek, který se odstraní, se při najetí zvýrazní. Prvek bez průsečíku se odstraní celý.

## Beta 0.90
- Skica: při kreslení čáry a křivky se u kurzoru už nezobrazuje rámeček s délkou a úhlem. Délka i úhel (oblouk od osy X) jsou přímo v kótách. Když jsou kóty vypnuté, rámeček se ukazuje dál.

## Beta 0.89
- Otočit: volba Položit na podložku (Z = 0) je ve výchozím stavu znovu zapnutá. Otočit celý model zůstává vypnuté.

## Beta 0.88
- Otočit: u kruhů manipulátoru je stupnice úhlů v barvě osy – čárka po 5°, delší čárka po 15°. Po najetí na čárku se ukáže osa a úhel (např. „Z: −45°“), klepnutím se těleso kolem té osy natočí přesně na daný úhel. Barevná tečka na stupnici ukazuje aktuální úhel. Kde se stupnice dvou os kříží, vybere se ta, která je víc natočená k pohledu.

## Beta 0.87
- Jednotný název volby: „Šipkami měnit rovnoměrně všechny rozměry“ (základní tělesa) a „Tažením bodu měnit velikost rovnoměrně“ (paleta skici) se nově jmenují stejně jako u Měřítka: Zachovat poměr stran.

## Beta 0.86
- Rozříznout a Ohnout plochu používají přímo stejný manipulátor jako Přesunout, Otočit a Měřítko (šipky, kruhy a kostičky v barvách os, stejné ovládání i přichytávání).
  - Rozříznout: Posun = šipka ve směru normály (u zmenšené plochy i šipky v rovině), Natočení = dva kruhy kolem os v rovině, Velikost = kostičky měřítka v rovině plochy.
  - Ohnout: Natočení = kruh kolem osy ohybu (úhel) a kruh kolem normály plochy (směr ohybu), Poloměr = šipka od plochy.

## Beta 0.85
- Táhla u Rozříznout a Ohnout plochu mají tvar a barvy jako manipulátor Přesunout / Otočit / Měřítko: šipka posouvá, oblouk otáčí, kostička mění velikost; barva odpovídá ose (X červená, Y zelená, Z modrá, šikmo oranžová), táhlo pod kurzorem nebo při tažení zežloutne.
- V obou oknech přepínač Táhla ukáže jen táhla jednoho druhu (Rozříznout: Posun / Natočení / Velikost, Ohnout: Natočení / Poloměr), aby se nepletla.
- Ohnout plochu: nové táhlo pro směr ohybu (oblouk kolem normály plochy, přichytávání po 5°); úhel i směr jsou v režimu Natočení, který je výchozí.

## Beta 0.84
- Rozříznout: táhla přímo v modelu. Šipka ze středu posouvá rovinu, šipky na okrajích plochy ji natáčejí kolem obou os, táhlo v rohu mění velikost řezné plochy a u zmenšené plochy dvě šipky ve středu posouvají plochu v rovině. Hodnoty se při tažení zobrazují u kurzoru a zapisují do okna.
- Ohnout plochu: táhla v modelu pro úhel (táhlo na konci ohybu, otáčí se kolem osy ohybu, s přichytáváním po 5°) a pro poloměr ohybu (šipka na ose ohybu).
- Řezná plocha přes celé těleso se kreslí jen o něco větší než vybraná tělesa, aby táhla zůstala na obrazovce.

## Beta 0.83
- Rozříznout: řeznou rovinu lze posuvníky posunout (Posun roviny), natočit kolem obou os ležících v rovině (−90° až 90°) a zmenšit (Velikost řezné plochy). Zmenšená plocha odřízne jen část tělesa před sebou ve směru šipky a dá se posouvat v rovině. Šipka v náhledu ukazuje stranu „nad rovinou“. Rozsahy posuvníků se řídí velikostí vybraných těles a popisky ukazují skutečné osy.

## Beta 0.82
- Kužel: nové pole Horní průměr (výchozí 0 = špička). S nenulovou hodnotou vznikne komolý kužel, horní průměr může být i větší než spodní (obrácený kužel). Horní průměr má v náhledu vlastní táhlo a lze ho dodatečně upravit.

## Beta 0.81
- Drátový model kreslí hrany plošek, ze kterých se těleso skládá, místo všech trojúhelníků: krychle má jen 12 hran, válec svislé linky po obvodu a čisté podstavy, koule poledníky a rovnoběžky, rovné stěny jsou bez úhlopříček. Ostré hrany jsou výraznější, barvy odpovídají světlému i tmavému režimu. Tělesa jdou v drátovém modelu dál vybírat.

## Beta 0.80
- Skica na ploše tělesa (Vytvořit skicu, Skica z plochy, Prázdná skica, i na části rozdělené plochy): počátek skici a mřížky je uprostřed plochy, ne v průmětu počátku souřadnic (u těles mimo počátek ležel na kraji plochy nebo mimo ni). Souřadnice a přichytávání k mřížce se tak počítají od středu plochy.
- Kontrola modelů: krychle, válec, koule, kužel, torus, šroub i matice mají střed podstavy v počátku, uzavřenou síť a správný objem.
- Šroub: čistší síť. Závit končí 0,05 mm před hlavou (dřív končil přesně na ploše hlavy a vznikaly drobné vady sítě) a zkosení hrotu se vyřízne před závitem. U matic se závitem zůstává pár drobných vad sítě v zahloubení, slicery je opraví automaticky.

## Beta 0.79
- Plochy: oprava výběru válcové plochy vedle ohybu nebo jiné zakřivené plochy. Výběr „přetékal“ do sousední plochy (pruh v ohybu), takže nesouhlasila ani délka plochy. Teď se vybere jen samotný válec (stejná vzdálenost stěn od osy), délka i průměr odpovídají.

## Beta 0.78
- Drátový model ukazuje celou síť tělesa (všechny trojúhelníky slabou čarou, ostré hrany výrazně), takže jsou vidět i zakřivené plochy, ne jen základní obrysy.

## Beta 0.77
- Ohnout plochu: místo hrany se volí směr ohybu. Tlačítka nesou názvy os (+X, +Y, −X, −Y, u svislých ploch +Z/−Z) a posuvník Natočení směru (0–360°) dovolí ohnout libovolným směrem. Osa ohybu leží na okraji plochy v tomto směru, takže se u válce ohyb už nenatáčí kolem osy Z podle náhodné plošky kružnice. Klepnutí na hranu plochy nastaví směr kolmo k ní.
- Ohnout plochu: úhel (1–180°) a poloměr ohybu (0–20 mm) mají posuvník, výchozí poloměr je 2 mm. U zaoblených ploch okno upozorní, když je poloměr menší než 1 mm (ohyb se pak na vnitřní straně zúží do bodu).
- Okna příkazů umí u číselného pole zobrazit posuvník.

## Beta 0.76
- Ohnout plochu: u zaoblených ploch (podstava válce, kruhová plocha) se poloměr ohybu nastaví sám na polovinu šířky plochy, takže vznikne plynulé koleno jako u ohnuté tyče. S poloměrem 0 se ohyb kruhové plochy na vnitřní straně geometricky zužuje do jediného bodu (vypadá jako spoj); okno na to upozorní a doporučí poloměr. Zadaný poloměr se nepřepisuje.
- Ohnout plochu: oprava chyby „Profil protíná osu rotace“, když osa ležela na zaokrouhlené hraně kruhové plochy.

## Beta 0.75
- Ohnout plochu: oprava. U zaoblených ploch (např. podstava válce) s poloměrem ohybu 0 vznikalo na okraji „slepené“ místo (hrany sdílené čtyřmi plochami), protože se ohyb dotýkal stěny tělesa jen tečně. Ohyb teď začíná nepatrně uvnitř tělesa, výsledek je čisté uzavřené těleso při jakémkoli poloměru i úhlu a koncová plocha leží přesně v zadaném úhlu.

## Beta 0.74
- Nový příkaz Rozříznout (Upravit): rozřízne vybraná tělesa rovinou XY, XZ, YZ nebo rovinou vybrané plochy, s odsazením (u hlavních rovin začíná uprostřed výběru). Ponechá obě části jako samostatná tělesa, nebo jen část nad či pod rovinou. Náhled ukazuje obě části barevně a řeznou rovinu.
- Plochy: nová akce Ohnout (i v kontextové nabídce). Rovinná plocha (i část rozdělené plochy) se otočí kolem zvolené hrany o zadaný úhel, volitelně s poloměrem ohybu. Vznikne zaoblený přechod a koncová plocha pod úhlem, kterou lze dál vysunout (Plochy › Vysunout). Výchozí osa je spodní hrana plochy, klepnutím na jinou hranu se změní.
- Potvrzení klávesou Enter přímo v poli funguje i u příkazů, jejichž náhled se počítá se zpožděním (Ohnout, Rozříznout).

## Beta 0.73
- Plochy: nová akce Rozdělit plochu (v liště vybrané rovinné plochy i v kontextové nabídce). Dvěma body (přichytí se k rohům, středům hran, hranám po krocích mřížky, jinak k mřížce) nebo jedním bodem a tlačítkem Vodorovně / Svisle se vede dělicí čára. Části plochy se pak vybírají samostatně a dají se posunout, vysunout nebo převést na skicu. Rozdělení je krok v časové ose (lze upravit), dělicí čára se zobrazuje jako hrana a přenáší se při přesunu, otočení, měřítku, zarovnání, zrcadlení i poli. Tvar tělesa a export se nemění.
- Otočit: oprava chyby, kvůli které se náhled otočení (rychlá tlačítka, zadané úhly, manipulátor) překresloval až s další událostí. Po OK tělesa zůstanou na novém místě, neodskakují na chvíli zpět. Úhly a pokládání už zbytečně nepřepočítávají výběr.
- Otočit: ve výchozím stavu je vypnuté Položit na podložku i Otočit celý model.
- Přesunout: po OK tělesa neodskakují zpět, dokud se model nepřepočítá.
- Plochy: zvýraznění plochy pod kurzorem nezůstává po úpravě modelu viset na staré poloze.

## Beta 0.72
- Závit: nové pole Vůle pro 3D tisk (výchozí 0,2 mm, stejně jako u šroubu a matice). U čepu zmenší celý profil závitu, u díry ho zvětší, takže závit na čepu odpovídá šroubu a závit v díře matici se stejnou vůlí. Čep i díru stačí kreslit v jmenovitém rozměru (čep Ø = M, díra Ø = malý průměr matice, ten se nabídne sám). Dřívější závity si ponechají vůli 0.

## Beta 0.71
- Závity: kontrola rozměrů podle ISO 68-1 / 261 / 965 u nástroje Závit (čep i díra, M1,6–M30), u šroubů a matic (M2–M24). Stoupání, pravý směr, průměry a rozměry hlav a matic (ISO 4017, 4032, 4762, 1207, 7045) odpovídají.
- Oprava: vnější závit (šroub, závit na čepu) měl boky sklonu asi 56° místo 60°, takže střední průměr vycházel u větších velikostí pod tolerancí 6g (např. M10: 8,86 mm místo min. 8,86–8,99 mm, M24: 21,72 místo min. 21,80). Teď má profil 60° a střední průměr leží v toleranci 6g. Závit šroubu je proto nepatrně plnější (M6 o 0,08 mm na středním průměru), vůli dál určuje nastavení Vůle.

## Beta 0.70
- Měřit: měří se skutečná kolmá vzdálenost mezi objekty, ne jen mezi dvěma body. Hrana–hrana (rovnoběžné hrany: jejich vzdálenost, jinak nejkratší vzdálenost a úhel), bod–hrana, bod–plocha, hrana–plocha a plocha–plocha (rovnoběžné plochy: tloušťka, jinak úhel mezi plochami).
- Měřit: vybrané hrany a plochy zůstanou zvýrazněné, pomocné čárkované čáry ukazují, odkud se kolmice měří.

## Beta 0.69
- Měřit: přesnější přichytávání. Bod se přichytí k vrcholu, ke středu hrany, ke středu kružnice či oblouku (i otvoru) nebo k nejbližšímu bodu hrany, a to i když kurzor není přímo na tělese. Zakryté hrany a vrcholy se ignorují. Na dotykové obrazovce je dosah přichycení větší.
- Měřit: u kurzoru se ukazuje, k čemu se bod přichytí (Vrchol, Střed hrany, Hrana…), hrana pod kurzorem se zvýrazní a v okně se ukáže její délka nebo průměr kružnice.
- Měřit: po prvním bodu se vzdálenost ukazuje živě čárkovanou čarou a popiskem uprostřed čáry.

## Beta 0.68
- Šroub: další typy hlavy – šestihranná s drážkou a šestihranná s křížem (rozměr hlavy podle ISO 4017, jde utáhnout klíčem i šroubovákem).

## Beta 0.67
- Skica: kružnice má táhlo poloměru (oranžový bod vpravo na obvodu). Tažením se mění průměr, s přichytáváním po celých krocích mřížky. Ve skice z plochy (např. z podstavy válce) je táhlo vidět vždy, jinak u vybrané kružnice.

## Beta 0.66
- Šroub: nové typy hlavy – válcová s drážkou pro plochý šroubovák (rozměry podle ISO 1207) a půlkulatá s křížem pro křížový šroubovák (rozměry hlavy podle ISO 7045, křížová drážka zjednodušená na rovný kříž). Vůle pro 3D tisk rozšíří i drážku.

## Beta 0.65
- Šroub: zápich pod hlavou je ve výchozím stavu vypnutý, zapíná se zaškrtnutím v dialogu.

## Beta 0.64
- Šroub: volba Zápich pod hlavou (ve výchozím stavu zapnutá). Pod hlavou zůstane krátký hladký krček (2,5 × stoupání) o něco tenčí než dno závitu, takže matice dojede až k hlavě bez drhnutí v nejproblematičtějších vrstvách tisku. Závit pak končí nad zápichem.

## Beta 0.63
- Skica z plochy: rovnoměrná změna velikosti (tažením bodu se mění celý obrys) je zapnutá automaticky, i při pozdější úpravě takové skici.
- Rovnoměrná změna velikosti s přichytáváním: delší strana obrysu se mění po celých krocích mřížky (dřív např. 48,4 mm, teď 48 mm). U kurzoru se ukazuje i výsledný rozměr.
- Ověřeno přichytávání ve skice z plochy (horní i boční stěna, těleso mimo mřížku): k rohům obrysu, ke středům úseček, k mřížce i posun obrysu po celých krocích fungují.

## Beta 0.62
- Skica z plochy: původní obrys plochy zůstává ve skice jako šedý čárkovaný obrys. Když obrys přesunete, oranžová šipka ukazuje posun od původního místa i s hodnotou (např. Posun 9,43 mm (X 8 · Y 5)). Platí i při pozdější úpravě skici.

## Beta 0.61
- Manipulátor posunu: když se osa otočí na zápornou stranu (osa míří od pozorovatele), šipka teď míří ven do záporného směru. Dřív byla obrácená a mířila zpět do středu.

## Beta 0.60
- Vkládané objekty (krychle, válec, koule, kužel, torus, šroub, matice) se vždy vytvoří jako nové těleso, i když se překrývají s existujícím. Spojit / vyříznout / průnik jde dál zvolit v dialogu (Operace). Vysunutí a rotace skici volí operaci automaticky jako dosud.

## Beta 0.59
- Oprava: v náhledu v Claude nešel uložit samostatný soubor STL ani OBJ (náhled povoluje jen některé typy souborů). Soubor se tam teď uloží zabalený v ZIP. Ve verzi na GitHub Pages se ukládá přímo .stl / .obj.

## Beta 0.58
- Matice: zkosený náběh díry (zahloubení 90°) z obou stran, šroub snáz najde začátek závitu. Šroub: zkosená špička 45°. Obojí je ve výchozím stavu zapnuté a jde vypnout v dialogu.

## Beta 0.57
- Soubor: export rozdělen – Exportovat STL (.stl), Exportovat OBJ (.obj), nebo Exportovat vše (.zip se STL, OBJ a návrhem jako dosud).

## Beta 0.56
- Nové nástroje Šroub a Matice (sekce Vytvořit): metrické závity M2–M24 podle ISO. Šroub se šestihrannou hlavou (ISO 4017) nebo válcovou hlavou s imbusem (ISO 4762), volitelná délka dříku a délka závitu. Matice šestihranná (ISO 4032). Závit lze modelovat, nebo vynechat (hladký dřík / díra). Vůle pro 3D tisk (výchozí 0,2 mm) zmenší průměr šroubu, nebo zvětší díru matice. Klepnutím do pohledu se díl umístí, poloha jde měnit manipulátorem. Lze vytvořit jako nové těleso, připojit, nebo vyříznout (např. díra se závitem).

## Beta 0.55
- Knihovna návrhů: Zálohovat knihovnu (Soubor i Moje návrhy) uloží všechny návrhy včetně importovaných modelů a náhledů do jednoho souboru .zip. Obnovit ze zálohy ho načte zpět – i na jiném zařízení. Chybějící návrhy se doplní, existující se přepíšou jen novější verzí ze zálohy.
- Úložiště: v Moje návrhy je ukazatel zaplnění úložiště prohlížeče. Při 80 % a 95 % aplikace upozorní a doporučí zálohu.

## Beta 0.54
- Průsečíky mřížky: bod, který se při kreslení nebo posouvání přiblíží k průsečíku na pár pixelů, se na něj přesně přichytí (i bez přichytávání k mřížce). Zvýraznění se ukáže jen tehdy, když bod na průsečíku opravdu leží. Při přesunu celého prvku se přichytává jeho roh, střed nebo první bod.
- Zvýraznění průsečíku je menší.

## Beta 0.53
- Mřížka skici: průsečík mřížky se lehce modře zvýrazní (kroužek s tečkou) jen tehdy, když se k němu při kreslení nebo při posouvání bodu či prvku přiblížíte. Jinak se nic nezvýrazňuje. Při přiblížení s jemnou mřížkou platí pro průsečíky po 1 mm.

## Beta 0.52
- Oprava: obrys skici splýval s mřížkou (mřížka se od verze 0.50 kreslila přes čáry skici). Čáry, body a značky skici jsou teď zase nad mřížkou.

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
