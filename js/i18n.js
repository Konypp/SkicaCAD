/* SkicaCAD – language layer.
 * The app is written in Czech. In English mode every text that appears on the page (text, title, aria-label,
 * placeholder) is translated when it is shown: exact phrases first, then patterns with numbers, then parts
 * separated by " · ". Switching back restores the original Czech texts. */
(() => {
  const EXACT = {
    // app bar, file menu
    'Soubor': 'File', 'Zpět': 'Undo', 'Znovu': 'Redo', 'Zpět (Ctrl+Z)': 'Undo (Ctrl+Z)', 'Znovu (Ctrl+Y)': 'Redo (Ctrl+Y)',
    'Název návrhu': 'Design name', 'Bez názvu': 'Untitled', 'Testovací verze': 'Test version',
    'Nový návrh': 'New design', 'Moje návrhy…': 'My designs…', 'v prohlížeči': 'in browser', 'Otevřít ukázkový model': 'Open sample model',
    'Otevřít návrh…': 'Open design…', 'Uložit návrh': 'Save design', 'Importovat…': 'Import…', 'Exportovat STL + OBJ': 'Export STL + OBJ',
    'Nainstalovat aplikaci': 'Install app', 'Jak nainstalovat (iOS)': 'How to install (iOS)',
    'Pás nástrojů': 'Toolbar', 'Navigace': 'Navigation', 'Časová osa': 'Timeline', 'Kostka pohledů': 'View cube', 'Výchozí pohled': 'Home view',
    'PROHLÍŽEČ': 'BROWSER', 'Sbalit': 'Collapse', 'Sbalit prohlížeč': 'Collapse browser', 'Rozbalit': 'Expand',
    'Přizpůsobit (F6)': 'Fit (F6)', 'Přizpůsobit': 'Fit', 'Ortogonální / perspektivní pohled': 'Orthographic / perspective view', 'Projekce': 'Projection',
    'Styl zobrazení': 'Display style', 'Styl zobrazení:': 'Display style:', 'Mřížka': 'Grid', 'Přichytávání k mřížce': 'Snap to grid', 'Přichytávání': 'Snap',
    'Krok přichytávání': 'Snap step', 'Stínování s hranami': 'Shaded with edges', 'Stínování': 'Shaded', 'Drátový model': 'Wireframe',
    'Přepočítávám model…': 'Rebuilding model…', 'Načítám soubor…': 'Loading file…', 'Načítám síť…': 'Loading mesh…', 'Zjednodušuji síť…': 'Simplifying mesh…',
    'Časová osa je prázdná. Začněte příkazem Vytvořit skicu.': 'The timeline is empty. Start with Create sketch.',
    'Na začátek': 'To start', 'O krok zpět': 'Step back', 'O krok vpřed': 'Step forward', 'Na konec': 'To end', 'Značka historie': 'History marker',
    // ribbon
    'TĚLESO': 'SOLID', 'SKICA': 'SKETCH', 'Vytvořit': 'Create', 'Upravit': 'Modify', 'Výběr': 'Select', 'Kontrola': 'Inspect', 'Vložit': 'Insert', 'Dokončit': 'Finish',
    'Vytvořit skicu': 'Create sketch', 'Vysunutí': 'Extrude', 'Rotace': 'Revolve', 'Závit': 'Thread', 'Krychle': 'Cube', 'Válec': 'Cylinder', 'Koule': 'Sphere',
    'Kužel': 'Cone', 'Torus': 'Torus', 'Zaoblení': 'Fillet', 'Zkosení': 'Chamfer', 'Kombinovat': 'Combine', 'Přesunout': 'Move', 'Otočit': 'Rotate',
    'Měřítko': 'Scale', 'Vycentrovat': 'Center', 'Plochy': 'Faces', 'Zrcadlit': 'Mirror', 'Pole': 'Pattern', 'Odstranit': 'Delete', 'Vybrat vše': 'Select all',
    'Měřit': 'Measure', 'Horní průměr': 'Top diameter', 'Importovat': 'Import', 'Import': 'Import', 'Upravit plochu': 'Edit face', 'Čára': 'Line', 'Křivka': 'Spline', 'Obdélník': 'Rectangle',
    'Kružnice': 'Circle', 'Elipsa': 'Ellipse', 'Mnohoúhelník': 'Polygon', 'Drážka': 'Slot', 'Zaoblit rohy': 'Round corners', 'Smazat': 'Delete',
    'DXF / SVG': 'DXF / SVG', 'Dokončit skicu': 'Finish sketch', 'Skica': 'Sketch', 'Skici': 'Sketches', 'Tělesa': 'Bodies', 'Těleso': 'Body', 'Počátek': 'Origin',
    'Měřit od': 'Measure from', 'Odstranit těleso': 'Delete body', 'Upravit plochu ': 'Edit face',
    // browser / context menus
    'Skrýt': 'Hide', 'Zobrazit': 'Show', 'Dvojklikem přejmenujete': 'Double-click to rename', 'Klepnutím vyberete všechna tělesa': 'Click to select all bodies',
    'Klepnutím vyberete (např. pro Vysunutí), dvojklikem upravíte skicu': 'Click to select (e.g. for Extrude), double-click to edit the sketch',
    'Vybrat vše (Ctrl+A)': 'Select all (Ctrl+A)', 'Kopírovat (Ctrl+C)': 'Copy (Ctrl+C)', 'Duplikovat (Ctrl+D)': 'Duplicate (Ctrl+D)', 'Vložit kopii (Ctrl+V)': 'Paste copy (Ctrl+V)',
    'Přesunout…': 'Move…', 'Zaoblit hrany…': 'Fillet edges…', 'Přejmenovat': 'Rename', 'Upravit prvek': 'Edit feature', 'Upravit prvek, který těleso vytvořil': 'Edit the feature that created the body',
    'Potlačit prvek': 'Suppress feature', 'Obnovit prvek': 'Unsuppress feature', 'Přesunout značku sem': 'Move marker here', 'Odstranit prvek': 'Delete feature',
    '(potlačeno)': '(suppressed)', 'Dvojklikem upravíte, pravým tlačítkem další volby': 'Double-click to edit, right-click for more options',
    // dialogs: common
    'Zrušit': 'Cancel', 'OK': 'OK', 'Zavřít': 'Close', 'Operace': 'Operation', 'Nové těleso': 'New body', 'Spojit': 'Join', 'Šestihranná s drážkou (klíč i plochý šroubovák)': 'Hex with slot (wrench or flat screwdriver)', 'Šestihranná s křížem (klíč i křížový šroubovák)': 'Hex with cross (wrench or Phillips screwdriver)', 'Válcová s drážkou – plochý šroubovák (ISO 1207)': 'Slotted cheese head – flat screwdriver (ISO 1207)', 'Půlkulatá s křížem – křížový šroubovák (ISO 7045)': 'Phillips pan head – cross screwdriver (ISO 7045)', 'Zápich pod hlavou (hladký krček bez závitu)': 'Thread undercut below the head (plain neck)', 'Zkosená špička (snazší našroubování)': 'Chamfered tip (easier to start)', 'Zkosený náběh díry z obou stran': 'Countersunk hole on both faces', 'Exportovat STL': 'Export STL', 'Exportovat OBJ': 'Export OBJ', 'Exportovat vše (STL + OBJ + návrh)': 'Export all (STL + OBJ + design)', 'STL uloženo': 'STL saved', 'OBJ uloženo': 'OBJ saved', 'Exportovat 3MF': 'Export 3MF', '3MF uloženo': '3MF saved', 'Šroub': 'Bolt', 'Matice': 'Nut', 'Velikost závitu': 'Thread size', 'Délka dříku': 'Shank length', 'Hlava': 'Head',
    'Šestihranná (ISO 4017)': 'Hex (ISO 4017)', 'Válcová s imbusem (ISO 4762)': 'Socket cap (ISO 4762)', 'Modelovat závit': 'Model the thread', 'Délka závitu (0 = celý dřík)': 'Thread length (0 = whole shank)',
    'Vůle pro 3D tisk': '3D-print clearance', 'Vůle pro 3D tisk (zmenší průměr)': '3D-print clearance (reduces the diameter)', 'Vůle pro 3D tisk (zvětší díru)': '3D-print clearance (enlarges the hole)', 'Počítám…': 'Computing…',
    'Šroub stojí na hlavě. Klepnutím do pohledu ho umístíte, manipulátorem posunete.': 'The bolt stands on its head. Tap the view to place it, drag the gizmo to move it.',
    'Klepnutím do pohledu matici umístíte, manipulátorem posunete.': 'Tap the view to place the nut, drag the gizmo to move it.', 'Neznámá velikost závitu': 'Unknown thread size', 'Zálohovat knihovnu': 'Back up library', 'Obnovit ze zálohy…': 'Restore from backup…', 'Obnovit knihovnu ze zálohy…': 'Restore library from backup…',
    'Úložiště návrhů v tomto prohlížeči': 'Design storage in this browser', 'Knihovna je prázdná, není co zálohovat.': 'The library is empty, nothing to back up.',
    'Návrhy se ukládají automaticky jen v tomto prohlížeči. Záloha celé knihovny je jeden soubor .zip, který obnovíte i na jiném zařízení.': 'Designs are saved automatically, in this browser only. A backup of the whole library is a single .zip file you can restore on another device too.',
    'Úložiště prohlížeče je plné. Zálohujte knihovnu (Soubor › Zálohovat knihovnu) a smažte staré návrhy (Soubor › Moje návrhy).': 'Browser storage is full. Back up the library (File › Back up library) and delete old designs (File › My designs).',
    'Úložiště prohlížeče je plné, část zálohy se nevešla. Smažte staré návrhy a zkuste to znovu.': 'Browser storage is full, part of the backup did not fit. Delete old designs and try again.', 'Duplikováno na stejné místo. Kopii přesunete tažením.': 'Duplicated in place. Drag the copy to move it.', 'Pomocná': 'Construction', 'Pomocný prvek': 'Construction element',
    'Prvek je pomocný: kreslí se čárkovaně a netvoří profil.': 'The element is now construction geometry: drawn dashed, it never forms a profile.', 'Prvek už není pomocný.': 'The element is no longer construction geometry.',
    'Pomocné kreslení zapnuto: nové prvky budou pomocné (čárkovaně, netvoří profil).': 'Construction drawing on: new elements are construction geometry (dashed, no profile).', 'Pomocné kreslení vypnuto': 'Construction drawing off', 'Vyříznout': 'Cut', 'Průnik': 'Intersect',
    'Počítám náhled…': 'Computing preview…', 'Neplatná hodnota': 'Invalid value', 'Chyba': 'Error', 'Typ': 'Type', 'Směr': 'Direction', 'Osa': 'Axis', 'Rovina': 'Plane',
    'Profil': 'Profile', 'Vyberte profil': 'Select a profile', 'Jedna strana': 'One side', 'Symetricky': 'Symmetric', 'Vzdálenost': 'Distance', 'Úhel': 'Angle', 'Úhel (°)': 'Angle (°)',
    'Tělesa ': 'Bodies', 'Vyberte tělesa': 'Select bodies', 'Vyberte těleso': 'Select a body', 'Rychle': 'Quick', 'Celý model': 'Whole model', 'Plocha': 'Face',
    // sketch
    'PALETA SKICI': 'SKETCH PALETTE', 'Zrušit skicu': 'Cancel sketch', 'Zrušit změny': 'Discard changes', 'Smazat prvek': 'Delete element', 'Počet stran': 'Number of sides',
    'Poloměr rohů': 'Corner radius', 'Zobrazit kóty': 'Show dimensions', 'Uzavřená křivka': 'Closed curve',
    'uzavřený obrys': 'closed outline', 'otevřená čára (lze použít jako osu rotace)': 'open line (can be used as a revolve axis)', '(uzavírací)': '(closing)',
    'uzavřený profil': 'closed profile', 'uzavřené profily': 'closed profiles', 'uzavřených profilů': 'closed profiles',
    'Skica je prázdná. Nakreslete obdélník, kružnici nebo čáru.': 'The sketch is empty. Draw a rectangle, circle or line.',
    'Klepnutím vyberte prvek skici. Nástroje kreslení jsou v pásu nahoře.': 'Tap a sketch element to select it. Drawing tools are in the toolbar above.',
    'Čára: klepejte na body; klepnutím na první bod obrys uzavřete, Enter ukončí': 'Line: tap points; tap the first point to close the outline, Enter finishes',
    'Křivka: klepejte na body, kterými má křivka projít; klepnutím na první bod ji uzavřete, Enter ukončí. Body pak jde přetáhnout.': 'Spline: tap the points the curve should pass through; tap the first point to close it, Enter finishes. Points can be dragged afterwards.',
    'Obdélník: klepněte na první roh, pak na protější roh': 'Rectangle: tap the first corner, then the opposite corner',
    'Kružnice: klepněte na střed, pak určete poloměr': 'Circle: tap the centre, then set the radius',
    'Elipsa: klepněte na střed, pak na konec hlavní osy, třetím klepnutím určíte šířku': 'Ellipse: tap the centre, then the end of the major axis, a third tap sets the width',
    'Mnohoúhelník: klepněte na střed, pak na vrchol. Počet stran nastavíte v paletě.': 'Polygon: tap the centre, then a vertex. Set the number of sides in the palette.',
    'Drážka: klepněte na střed prvního oblouku, pak druhého, třetím klepnutím určíte šířku': 'Slot: tap the centre of the first arc, then the second, a third tap sets the width',
    'Zaoblení rohů: nastavte poloměr v paletě a klepněte na obdélník, mnohoúhelník nebo uzavřený obrys': 'Round corners: set the radius in the palette and tap a rectangle, polygon or closed outline',
    'Zaoblit lze rohy obdélníku, mnohoúhelníku nebo uzavřeného obrysu.': 'Only corners of a rectangle, polygon or closed outline can be rounded.',
    'Klepněte na jednu z rovin XY, XZ, YZ nebo na rovinnou plochu modelu.': 'Tap one of the XY, XZ, YZ planes or a flat face of the model.',
    'Vyberte rovinu počátku nebo rovinnou plochu tělesa': 'Select an origin plane or a flat face of a body', 'Skicu lze umístit jen na rovinnou plochu.': 'A sketch can only be placed on a flat face.',
    'XY (půdorys)': 'XY (top)', 'XZ (nárys)': 'XZ (front)', 'YZ (bokorys)': 'YZ (side)', 'Rovina skici': 'Sketch plane',
    'Nejprve vyberte prvek skici.': 'Select a sketch element first.', 'Vyberte prvek skici, který chcete kopírovat.': 'Select the sketch element to copy.',
    'Vyberte prvek skici, který chcete duplikovat.': 'Select the sketch element to duplicate.', 'Prvek skici zkopírován. Vložíte ho Ctrl+V.': 'Sketch element copied. Paste it with Ctrl+V.',
    'Schránka neobsahuje prvek skici. Zkopírujte ho Ctrl+C.': 'The clipboard has no sketch element. Copy one with Ctrl+C.', 'Neznámý prvek': 'Unknown element',
    'Úsečka': 'Segment',
    // extrude / revolve
    'Táhněte šipkou nebo zadejte vzdálenost. Klepnutím na profil výběr změníte.': 'Drag the arrow or enter a distance. Tap a profile to change the selection.',
    'Vyberte uzavřený profil skici': 'Select a closed sketch profile', 'Tato skica už je vysunutá.': 'This sketch has already been extruded.', '– vyberte –': '– select –',
    'Nejprve vytvořte skicu s uzavřeným profilem (S), nebo v režimu Plochy (G) vyberte stěnu a zvolte Vysunout.': 'Create a sketch with a closed profile first (S), or select a face in Faces mode (G) and choose Extrude.',
    'Všechny skici už jsou vysunuté. Nakreslete novou skicu (S), nebo v režimu Plochy (G) vyberte stěnu a zvolte Vysunout.': 'All sketches have been extruded. Draw a new sketch (S), or select a face in Faces mode (G) and choose Extrude.',
    'Nejprve vytvořte skicu s profilem a osou rotace (S).': 'Create a sketch with a profile and a revolve axis first (S).',
    'Zvolte osu a úhel rotace. Klepnutím na profil výběr změníte.': 'Choose the axis and angle. Tap a profile to change the selection.',
    'Osa X skici': 'Sketch X axis', 'Osa Y skici': 'Sketch Y axis', 'Osa X': 'X axis', 'Osa Y': 'Y axis', 'Osa Z': 'Z axis',
    'Profil protíná osu rotace.': 'The profile crosses the revolve axis.', 'Osa rotace má nulovou délku': 'The revolve axis has zero length', 'Osa rotace neexistuje': 'The revolve axis does not exist',
    'Nulový úhel': 'Zero angle', 'Nulová vzdálenost': 'Zero distance', 'Skica neexistuje': 'The sketch does not exist',
    'Nástroj nezasahuje do žádného tělesa': 'The tool does not touch any body',
    // primitives
    'Šířka (X)': 'Width (X)', 'Hloubka (Y)': 'Depth (Y)', 'Výška (Z)': 'Height (Z)', 'Šířka': 'Width', 'Hloubka': 'Depth', 'Výška': 'Height', 'Průměr': 'Diameter',
    'Poloměr': 'Radius', 'Poloměr trubice': 'Tube radius', 'Poloha základny': 'Base position',
    'Táhněte oranžovými šipkami pro změnu rozměrů, manipulátorem pro posun, nebo klepněte do pohledu': 'Drag the orange arrows to resize, the manipulator to move, or tap in the view',
    'Klepnutím do pohledu umístíte těleso, rozměry zadejte v dialogu': 'Tap in the view to place the body, enter the dimensions in the dialog',
    'Trubice musí být menší než hlavní poloměr': 'The tube must be smaller than the main radius',
    // fillet / chamfer
    'Hrany': 'Edges', 'Vyberte hrany': 'Select edges', 'Vyberte hrany tělesa': 'Select edges of a body', 'Klepnutím přidáte nebo odeberete hranu': 'Tap to add or remove an edge',
    'Tangentní řetěz': 'Tangent chain', 'Hrana je téměř rovná nebo příliš ostrá.': 'The edge is almost flat or too sharp.', 'Hrana nebyla nalezena': 'Edge not found',
    'Hranu nelze upravit.': 'This edge cannot be modified.', 'Tento typ hrany zatím nelze upravit.': 'This type of edge cannot be modified yet.', 'Poloměr je pro tuto hranu příliš velký.': 'The radius is too large for this edge.',
    // combine
    'Cílové těleso': 'Target body', 'Vyberte cílové těleso': 'Select the target body', 'Vyberte nástrojová tělesa': 'Select the tool bodies', 'Nástroje': 'Tools',
    'Ponechat nástrojová tělesa': 'Keep tool bodies', 'Kombinace potřebuje alespoň dvě tělesa.': 'Combine needs at least two bodies.', 'Cílové těleso neexistuje': 'The target body does not exist',
    // move / copy
    'Vložit kopii': 'Paste copy', 'Manipulátor': 'Manipulator', 'Posun': 'Move', 'Otočení': 'Rotate', 'Posun (mm)': 'Move (mm)', 'Otočení (°)': 'Rotation (°)',
    'Vytvořit kopie (originál zůstane)': 'Create copies (keep the original)', 'Počet kopií': 'Number of copies', 'Podle posunu výše': 'By the move above',
    'Podél osy X': 'Along X axis', 'Podél osy Y': 'Along Y axis', 'Podél osy Z': 'Along Z axis', 'Rozestup': 'Spacing', 'Vznikne 1 kopie.': '1 copy will be created.',
    'Každá další kopie se posune o stejný krok.': 'Each further copy moves by the same step.', 'Vyberte tělesa k přesunu': 'Select bodies to move',
    'Táhněte manipulátorem nebo zadejte hodnoty. Klepnutím na těleso výběr změníte.': 'Drag the manipulator or enter values. Tap a body to change the selection.',
    'Příliš mnoho kopií (víc než 300).': 'Too many copies (more than 300).', 'Duplikováno': 'Duplicated',
    'Duplikováno vedle originálu. Polohu upravíte dvojklikem na prvek v časové ose.': 'Duplicated next to the original. Adjust its position by double-clicking the feature in the timeline.',
    'Schránka je prázdná. Těleso zkopírujete Ctrl+C.': 'The clipboard is empty. Copy a body with Ctrl+C.', 'Zkopírovaná tělesa už v modelu nejsou.': 'The copied bodies are no longer in the model.',
    'Vyberte těleso, které chcete kopírovat.': 'Select the body to copy.', 'Vyberte těleso, které chcete duplikovat.': 'Select the body to duplicate.',
    'Vyberte těleso, které chcete odstranit.': 'Select the body to delete.', 'Vloženo': 'Pasted',
    // rotate
    'Otočit celý model': 'Rotate whole model', 'Střed otáčení': 'Rotation centre', 'Střed výběru': 'Selection centre', 'Položit na podložku (Z = 0)': 'Place on the bed (Z = 0)',
    'Plochou dolů': 'Face down', 'Vybrat plochu v modelu': 'Pick a face in the model', 'Vyberte tělesa k otočení': 'Select bodies to rotate',
    'Otáčejte manipulátorem, rychlými tlačítky nebo zadejte úhly': 'Rotate with the manipulator, the quick buttons or enter angles',
    'Klepněte na plochu, která má ležet na podložce': 'Tap the face that should lie on the bed', 'Klepněte na plochu…': 'Tap a face…',
    // scale
    'Zachovat poměr stran': 'Keep proportions', 'Měřítko (×)': 'Scale (×)', 'Rozměry (mm)': 'Dimensions (mm)', 'Střed změny': 'Scale centre',
    'Spodní plocha (zůstane na podložce)': 'Bottom face (stays on the bed)', 'palce → mm': 'inches → mm', 'Měřítko musí být kladné číslo': 'Scale must be a positive number',
    'Vyberte tělesa, jejichž velikost chcete změnit': 'Select the bodies to resize',
    'Táhněte kostičkami manipulátoru (střed = všechny osy) nebo zadejte měřítko či rozměry': 'Drag the manipulator cubes (centre = all axes) or enter a scale or dimensions',
    'Táhněte kostičkami manipulátoru (střed = všechny osy). Klepnutím na těleso výběr změníte.': 'Drag the manipulator cubes (centre = all axes). Tap a body to change the selection.',
    'Tvar a rozměry modelu zůstanou zachované.': 'The shape and size of the model are kept.',
    // center
    'Vycentrovat v ose X': 'Center in X', 'Vycentrovat v ose Y': 'Center in Y', 'Osa Z ': 'Z axis', 'Neměnit': 'Keep', 'Každé těleso zvlášť': 'Each body separately',
    'Model se posune tak, aby jeho střed ležel v počátku': 'The model moves so that its centre lies at the origin', 'Každé těleso se posune do počátku samostatně.': 'Each body moves to the origin separately.',
    'Vyberte tělesa k vycentrování': 'Select bodies to center', 'Vycentrovat na počátek': 'Center on origin', 'Vycentrovat na počátek (X, Y)': 'Center on origin (X, Y)',
    'Položit na rovinu XY': 'Place on the XY plane', 'Model neobsahuje žádná viditelná tělesa.': 'The model has no visible bodies.',
    // mirror / pattern
    'Rovina YZ (osa X)': 'YZ plane (X axis)', 'Rovina XZ (osa Y)': 'XZ plane (Y axis)', 'Rovina XY (osa Z)': 'XY plane (Z axis)', 'Spojit s originálem': 'Join with original',
    'Vyberte tělesa, která chcete zrcadlit': 'Select the bodies to mirror', 'Kruhové': 'Circular', 'Obdélníkové': 'Rectangular', 'Počet': 'Count', 'Celkový úhel': 'Total angle',
    'Počet v X': 'Count in X', 'Počet v Y': 'Count in Y', 'Rozteč X': 'Spacing X', 'Rozteč Y': 'Spacing Y', 'Vyberte tělesa pro pole': 'Select bodies for the pattern',
    'Kruhové pole kolem osy procházející počátkem': 'Circular pattern around an axis through the origin', 'Obdélníkové pole ve směrech X a Y': 'Rectangular pattern in X and Y',
    'Pole potřebuje alespoň dvě instance': 'A pattern needs at least two instances',
    // thread
    'Velikost': 'Size', 'Stoupání': 'Pitch', 'Pravý': 'Right', 'Levý': 'Left', 'Po celé délce plochy': 'Full length of the face', 'Spodní konec': 'Bottom end', 'Horní konec': 'Top end',
    'Začátek plochy': 'Start of face', 'Konec plochy': 'End of face', 'Odsazení': 'Offset', 'Délka závitu': 'Thread length', 'Klepněte na válcovou plochu': 'Tap a cylindrical face',
    'Klepněte na válcovou plochu tělesa': 'Tap a cylindrical face of a body', 'Vyberte vnější plochu čepu nebo vnitřní plochu díry.': 'Select the outer face of a pin or the inner face of a hole.',
    'Vnitřní závit (díra)': 'Internal thread (hole)', 'Vnější závit (čep)': 'External thread (pin)', 'Červeně je materiál, který závit odebere.': 'Red shows the material the thread removes.',
    'Oranžovými šipkami nastavíte začátek a konec závitu. Klepnutím na jinou válcovou plochu výběr změníte.': 'Use the orange arrows to set the start and end of the thread. Tap another cylindrical face to change the selection.',
    'Závit lze vytvořit jen na celé válcové ploše (čep nebo díra).': 'A thread can only be made on a whole cylindrical face (pin or hole).',
    'Závit je příliš krátký': 'The thread is too short', 'Neplatné parametry závitu': 'Invalid thread parameters', 'Díra je pro zvolenou velikost závitu příliš velká': 'The hole is too large for the chosen thread size',
    'Válec je pro zvolenou velikost závitu příliš tenký': 'The cylinder is too thin for the chosen thread size', 'Stoupání je pro tento průměr příliš velké': 'The pitch is too large for this diameter',
    'díra pro ni má mít': 'the hole should be', 'čep má mít': 'the pin should be',
    // faces
    'Vysunout': 'Extrude', 'Posunout plochu': 'Offset face', 'Skica z plochy': 'Sketch from face', 'Prázdná skica': 'Empty sketch', 'Změnit průměr': 'Change diameter',
    'Průměr otvoru': 'Hole diameter', 'Zrušit výběr plochy': 'Clear face selection', 'Vysunout (nové těleso, přidat nebo vyříznout)…': 'Extrude (new body, join or cut)…',
    'Posunout plochu (vysunout / zapustit)…': 'Offset face (push / pull)…', 'Skica z plochy (Ctrl+D)': 'Sketch from face (Ctrl+D)', 'Nová prázdná skica na ploše': 'New empty sketch on face',
    'Závit na této ploše…': 'Thread on this face…', 'Změnit průměr otvoru…': 'Change hole diameter…', 'Změnit průměr…': 'Change diameter…',
    'Výběr ploch: klepněte na stěnu tělesa, možnosti se ukážou v liště dole.': 'Face selection: tap a face of a body, the options appear in the bar below.', 'Výběr těles': 'Body selection',
    'Tuto plochu nelze vybrat samostatně (zakřivená plocha, která není válcem).': 'This face cannot be selected on its own (a curved face that is not a cylinder).',
    'Vyberte rovinnou plochu (třeba horní stěnu válce).': 'Select a flat face (for example the top of a cylinder).', 'Vysunout lze rovinnou plochu.': 'Only a flat face can be extruded.',
    'Obrys plochy se nepodařilo převést na skicu.': 'The face outline could not be converted to a sketch.', 'Obrys plochy se nepodařilo určit': 'The face outline could not be determined',
    'Obrys plochy je ve skice. Upravte rozměr v paletě, dokončete skicu a vysuňte ji (E), záporná vzdálenost vytvoří otvor.': 'The face outline is in the sketch. Adjust the size in the palette, finish the sketch and extrude it (E); a negative distance makes a hole.',
    'Rovinná plocha': 'Flat face', 'Vnitřní válcová plocha (otvor)': 'Inner cylindrical face (hole)', 'Vnější válcová plocha': 'Outer cylindrical face',
    'Klepněte na stěnu tělesa': 'Tap a face of a body', 'Klepnutím na jinou stěnu výběr změníte': 'Tap another face to change the selection', 'Posunutí': 'Offset',
    'Nový průměr': 'New diameter', 'Vyberte rovnou stěnu nebo válcovou plochu.': 'Select a flat face or a cylindrical face.', 'Vyberte vnitřní stěnu otvoru, válec nebo rovnou stěnu.': 'Select the inner face of a hole, a cylinder or a flat face.',
    'Kladné posunutí přidá materiál ve směru plochy, záporné ho odebere (zapustí plochu).': 'A positive offset adds material in the face direction, a negative one removes it (sinks the face).',
    'Otvor: zadejte nový průměr, otvor se zvětší nebo zmenší.': 'Hole: enter a new diameter, the hole grows or shrinks.', 'Válec: zadejte nový průměr.': 'Cylinder: enter a new diameter.',
    'Zadejte odsazení různé od nuly': 'Enter a non-zero offset', 'Průměr se nezměnil': 'The diameter did not change', 'Průměr musí být větší než 0,1 mm': 'The diameter must be larger than 0.1 mm',
    'Úprava plochy by odstranila celé těleso': 'The face edit would remove the whole body', 'Plocha nebyla nalezena': 'Face not found',
    // split face
    'Rozdělit plochu': 'Split face', 'Rozdělit plochu čarou…': 'Split face with a line…', 'Čára z bodu 1': 'Line from point 1', 'Vodorovně': 'Horizontal', 'Svisle': 'Vertical',
    'Klepněte na rovinnou plochu': 'Tap a flat face', 'Klepněte na plochu': 'Tap the face', 'Klepněte na rovinnou plochu, kterou chcete rozdělit': 'Tap the flat face you want to split',
    'Klepněte na první bod dělicí čáry': 'Tap the first point of the dividing line', 'Klepněte na druhý bod dělicí čáry': 'Tap the second point of the dividing line',
    'Klepněte na druhý bod, nebo veďte čáru vodorovně či svisle.': 'Tap the second point, or run the line horizontally or vertically.',
    'Body se přichytí k rohům, středům hran a hranám plochy, jinak k mřížce.': 'Points snap to corners, edge midpoints and edges of the face, otherwise to the grid.',
    'Vyberte rovinnou stěnu tělesa, kterou chcete rozdělit.': 'Select the flat face of a body you want to split.', 'Rozdělit lze jen rovinnou plochu.': 'Only a flat face can be split.',
    'Čára plochu nerozdělí, musí plochou procházet.': 'The line does not split the face, it has to run across it.', 'Čára plochu nerozdělí, musí plochou procházet': 'The line does not split the face, it has to run across it',
    'Body dělicí čáry splývají': 'The points of the dividing line coincide', 'Část plochy nebyla nalezena': 'The part of the face was not found',
    'Plocha je rozdělená. V režimu Plochy klepněte na její část a upravte ji.': 'The face is split. In Faces mode, tap one of its parts and edit it.',
    // bend face, split body
    'Ohnout plochu': 'Bend face', 'Ohnout': 'Bend', 'Ohnout plochu kolem hrany…': 'Bend face about an edge…', 'Osa ohybu': 'Bend axis', 'Poloměr ohybu': 'Bend radius',
    'Klepněte na hranu plochy': 'Tap an edge of the face', 'Klepněte na rovinnou plochu, kterou chcete ohnout': 'Tap the flat face you want to bend',
    'Klepnutím na jinou hranu plochy změníte osu ohybu': 'Tap another edge of the face to change the bend axis',
    'Klepněte na hranu plochy, kolem které se má plocha ohnout.': 'Tap the edge of the face to bend it about.', 'Vyberte rovinnou stěnu tělesa, třeba čelo hranolu.': 'Select a flat face of a body, for example the end of a bar.',
    'Plocha se otočí kolem oranžové hrany do prostoru před sebou. Koncovou plochu pak vysunete pod úhlem (režim Plochy › Vysunout).': 'The face turns about the orange edge into the space in front of it. Then extrude the end face at the angle (Faces mode › Extrude).',
    'Směr ohybu': 'Bend direction', 'Natočení směru': 'Direction angle', 'Směr ohybu zvolte tlačítky, posuvníkem nebo klepnutím na hranu plochy': 'Choose the bend direction with the buttons, the slider or by tapping an edge of the face',
    'Směr ohybu se nepodařilo určit.': 'The bend direction could not be determined.', 'Vyberte rovinnou stěnu tělesa, třeba čelo hranolu nebo podstavu válce.': 'Select a flat face of a body, for example the end of a bar or the base of a cylinder.',
    'Malý poloměr ohybu: u zaoblené plochy se ohyb na vnitřní straně zúží až do jednoho bodu (vypadá jako spoj). Pro plynulý ohyb zadejte alespoň 1 až 2 mm.': 'Small bend radius: on a rounded face the bend narrows down to a single point on the inner side (looks like a joint). For a smooth bend enter at least 1 to 2 mm.',
    'Plocha se ohne kolem oranžové osy směrem, který jste zvolili. Koncovou plochu pak vysunete pod úhlem (režim Plochy › Vysunout).': 'The face bends about the orange axis in the direction you chose. Then extrude the end face at the angle (Faces mode › Extrude).',
    'Ohnout lze jen rovinnou plochu.': 'Only a flat face can be bent.', 'Ohyb je hotový. Koncovou plochu vysunete v režimu Plochy: klepněte na ni a zvolte Vysunout.': 'The bend is done. Extrude the end face in Faces mode: tap it and choose Extrude.',
    'Úhel ohybu musí být 0,5° až 180°': 'The bend angle must be 0.5° to 180°', 'Osa ohybu není určená': 'The bend axis is not set', 'Osa ohybu musí ležet na okraji plochy, ne uvnitř': 'The bend axis must lie on the edge of the face, not inside it',
    'Ohyb se nepodařilo vytvořit': 'The bend could not be created',
    'Táhly posuňte, natočte nebo zmenšete řeznou plochu; klepnutím na tělesa změníte výběr': 'Move, tilt or shrink the cutting face with the handles; tap bodies to change the selection',
    'Táhly natočíte úhel a směr ohybu (přepínač Táhla: Poloměr), směr jde zvolit i tlačítky nebo klepnutím na hranu': 'Turn the bend angle and direction with the handles (switch Handles: Radius), the direction can also be chosen with the buttons or by tapping an edge',
    'Táhla': 'Handles', 'Natočení': 'Rotation', 'Poloměr': 'Radius',
    'Posun roviny': 'Plane offset', 'Velikost řezné plochy': 'Cutting face size', 'Řezná plocha žádné vybrané těleso neprotíná.': 'The cutting face does not cross any selected body.',
    'Červeně je část, která se odstraní. Zmenšená plocha odřízne jen část před sebou (ve směru šipky).': 'Red shows the part that is removed. A smaller face cuts off only the part in front of it (in the arrow direction).',
    'Rozříznout': 'Split body', 'Řezná rovina': 'Cutting plane', 'Rovina XY (vodorovně)': 'XY plane (horizontal)', 'Rovina XZ (zepředu)': 'XZ plane (front)', 'Rovina YZ (zboku)': 'YZ plane (side)',
    'Rovina plochy tělesa': 'Plane of a body face', 'Ponechat': 'Keep', 'Obě části': 'Both parts', 'Nad rovinou': 'Above the plane', 'Pod rovinou': 'Below the plane',
    'Klepněte na rovinnou plochu, jejíž rovina těleso rozřízne': 'Tap the flat face whose plane cuts the body', 'Klepnutím na tělesa vyberte, co rozříznout': 'Tap bodies to choose what to split',
    'Vyberte tělesa, která chcete rozříznout.': 'Select the bodies you want to split.', 'Vyberte plochu, podle které se má řezat.': 'Select the face to cut along.',
    'Rovina řezu žádné vybrané těleso neprotíná.': 'The cutting plane does not cross any selected body.', 'Rovina řezu žádné vybrané těleso neprotíná': 'The cutting plane does not cross any selected body',
    'Červeně je část, která se odstraní.': 'Red shows the part that is removed.', 'Vyberte rovinnou plochu.': 'Select a flat face.',
    // measure
    'Bod 1': 'Point 1', 'Bod 2': 'Point 2', 'Klepněte na model': 'Tap the model', 'Klepněte na první bod': 'Tap the first point', 'Klepněte na druhý bod': 'Tap the second point',
    'Klepnutím blízko vrcholu se bod přichytí k vrcholu.': 'Tapping near a vertex snaps to the vertex.',
    'Bod se přichytí k vrcholu, středu hrany, středu kružnice nebo k hraně. Klepnutím na hranu nebo rovnou plochu se měří kolmá vzdálenost.': 'The point snaps to a vertex, an edge midpoint, a circle centre or an edge. Tapping an edge or a flat face measures the perpendicular distance.',
    // files, import
    'Otevřít návrh': 'Open design', 'Otevřít archiv ZIP': 'Open ZIP archive', 'Vyberte, jak archiv otevřít': 'Choose how to open the archive', 'Vložit jako těleso': 'Insert as body',
    'Otevřít návrh obnoví celou časovou osu a nahradí aktuální návrh (vrátíte ho Ctrl+Z). Vložit jako těleso přidá síť do aktuálního návrhu.': 'Open design restores the whole timeline and replaces the current design (undo with Ctrl+Z). Insert as body adds the mesh to the current design.',
    'Import sítě': 'Mesh import', 'Jednotky souboru': 'File units', 'Nastavte jednotky a umístění importovaného modelu': 'Set the units and placement of the imported model',
    'Jednotky v souboru nejsou uvedené, zkontrolujte měřítko.': 'The file does not state its units, check the scale.', 'Síť': 'Mesh', 'Velký model': 'Large model',
    'Zvolte, jak podrobně model načíst': 'Choose how detailed the model should be', 'Zjednodušit na 150 000 (doporučeno)': 'Simplify to 150,000 (recommended)',
    'Zjednodušit na 300 000 (víc detailů)': 'Simplify to 300,000 (more detail)', 'Zjednodušit na 75 000 (nejrychlejší)': 'Simplify to 75,000 (fastest)', 'Ponechat plné rozlišení': 'Keep full resolution',
    'Načtení plného rozlišení chvíli potrvá.': 'Loading the full resolution takes a while.', 'Zkontrolujte velikost a umístění, pak potvrďte. Vznikne nová skica.': 'Check the size and placement, then confirm. A new sketch is created.',
    'Skica z importu je hotová. Profily vysunete příkazem Vysunutí (E).': 'The imported sketch is ready. Extrude its profiles with Extrude (E).',
    'Soubor uložen': 'File saved', 'Soubor se nepodařilo uložit.': 'The file could not be saved.', 'Soubor se nepodařilo načíst.': 'The file could not be loaded.',
    'Návrh otevřen': 'Design opened', 'Ukládání souborů není v tomto zobrazení dostupné': 'Saving files is not available in this view', 'Ukládání souborů není v tomto zobrazení dostupné.': 'Saving files is not available in this view.',
    'Uloženo. Archiv otevřete znovu ve SkicaCAD přetažením do okna nebo přes Soubor › Otevřít návrh.': 'Saved. Open the archive in SkicaCAD again by dropping it on the window or via File › Open design.',
    'Není co exportovat, model neobsahuje viditelná tělesa.': 'Nothing to export, the model has no visible bodies.',
    'Podporované formáty importu: STL, OBJ (tělesa), DXF a SVG (skica) a archiv ZIP ze SkicaCAD.': 'Supported import formats: STL, OBJ (bodies), DXF and SVG (sketch) and ZIP archives from SkicaCAD.',
    'Soubor je příliš velký (víc než 400 MB).': 'The file is too large (more than 400 MB).', 'Do skici lze vložit jen DXF nebo SVG. Model STL nebo OBJ importujte mimo skicu.': 'Only DXF or SVG can be inserted into a sketch. Import STL or OBJ models outside the sketch.',
    'Importovaný model je na úložiště prohlížeče příliš velký. Návrh si uložte do souboru (Soubor › Uložit návrh).': 'The imported model is too large for the browser storage. Save the design to a file (File › Save design).',
    'Soubor neobsahuje platný návrh SkicaCAD.': 'The file does not contain a valid SkicaCAD design.', 'Soubor neobsahuje použitelnou síť.': 'The file has no usable mesh.',
    'Soubor ZIP je poškozený nebo nemá platný formát.': 'The ZIP file is damaged or has an invalid format.', 'Tento prohlížeč neumí rozbalit komprimovaný ZIP.': 'This browser cannot unpack a compressed ZIP.',
    'Archiv ZIP neobsahuje návrh SkicaCAD ani soubor STL, OBJ, DXF nebo SVG.': 'The ZIP archive contains no SkicaCAD design and no STL, OBJ, DXF or SVG file.',
    'Archiv neobsahuje DXF ani SVG, které by šlo vložit do skici.': 'The archive contains no DXF or SVG to insert into a sketch.', 'Soubor STL nemá platný obsah.': 'The STL file has no valid content.',
    'Soubor OBJ neobsahuje žádné plochy.': 'The OBJ file contains no faces.', 'Soubor není platné SVG.': 'The file is not a valid SVG.', 'Neplatná data cesty SVG.': 'Invalid SVG path data.',
    'Neplatný oblouk v cestě SVG.': 'Invalid arc in SVG path.', 'Nepodporovaný příkaz cesty SVG:': 'Unsupported SVG path command:', 'Import SVG vyžaduje prohlížeč.': 'SVG import requires a browser.',
    'V souboru nebyla nalezena žádná podporovaná geometrie.': 'No supported geometry was found in the file.', 'Síť se nepodařilo zpracovat.': 'The mesh could not be processed.',
    'Data importu chybí': 'Import data is missing', 'Data tohoto importu už nejsou k dispozici. Importujte soubor znovu.': 'The data of this import is no longer available. Import the file again.',
    'Přeskočeno:': 'Skipped:', 'Těleso neexistuje': 'The body does not exist', ', jednotky nebyly v souboru uvedené': ', the file does not state its units',
    '!Načtení a práce s plným rozlišením bude pomalá a může zaplnit paměť prohlížeče.': '!Loading and working at full resolution will be slow and may fill the browser memory.',
    // general messages
    'Model zatím neobsahuje žádné těleso.': 'The model has no bodies yet.', 'Operace je pro tento model příliš složitá. Zkuste zjednodušit tělesa nebo operaci rozdělit.': 'The operation is too complex for this model. Try simplifying the bodies or splitting the operation.',
    'Tento prvek nemá parametry k úpravě.': 'This feature has no parameters to edit.', 'Tento prohlížeč nepodporuje WebGL, 3D pohled nelze zobrazit.': 'This browser does not support WebGL, the 3D view cannot be shown.',
    'Úložiště prohlížeče je plné. Smažte staré návrhy (Soubor › Moje návrhy) nebo návrh uložte do souboru.': 'The browser storage is full. Delete old designs (File › My designs) or save the design to a file.',
    'Je k dispozici nová verze aplikace.': 'A new version of the app is available.', 'Obnovit': 'Reload', 'Později': 'Later',
    'Ukázkový model načten': 'Sample model loaded', 'Držák s nábojem': 'Bracket with hub', 'Návrh se nepodařilo načíst.': 'The design could not be loaded.',
    // start screen
    'Moje návrhy': 'My designs', 'Předchozí návrhy': 'Previous designs', 'Otevřít ze souboru…': 'Open from file…', 'Ukázkový model': 'Sample model',
    'Zatím tu nejsou žádné uložené návrhy. Jakmile začnete modelovat, návrh se sám uloží a příště ho najdete tady.': 'There are no saved designs yet. Once you start modelling, the design is saved automatically and you will find it here next time.',
    'Návrhy se ukládají automaticky jen v tomto prohlížeči. Zálohu uděláte přes Soubor › Uložit návrh.': 'Designs are saved automatically, only in this browser. Make a backup via File › Save design.',
    'Smazat návrh': 'Delete design', 'Klepněte znovu na koš pro trvalé smazání návrhu.': 'Tap the bin again to delete the design permanently.', 'Klepněte znovu pro smazání': 'Tap again to delete',
    'Nový návrh ': 'New design',
    // view cube
    'PŘEDNÍ': 'FRONT', 'ZADNÍ': 'BACK', 'LEVÝ': 'LEFT', 'PRAVÝ': 'RIGHT', 'HORNÍ': 'TOP', 'DOLNÍ': 'BOTTOM',
    'Klepnutím na těleso výběr změníte': 'Tap a body to change the selection', 'Š': 'W', 'V': 'H',
    // align
    'Zarovnat': 'Align', 'Zarovnat k': 'Align to', 'Počátku': 'Origin', 'Tělesu': 'Body', 'Ploše': 'Face', 'Ke tělesu': 'To body',
    'Zarovnat začátky': 'Align starts', 'Na střed': 'Centre', 'Zarovnat konce': 'Align ends', 'Přiložit za konec': 'Place after the end', 'Přiložit před začátek': 'Place before the start',
    'Zarovnat spodky': 'Align bottoms', 'Zarovnat vršky': 'Align tops', 'Položit navrch': 'Place on top', 'Dát pod': 'Place below',
    'Plocha, která se přesune': 'Face to move', 'Cílová plocha': 'Target face', 'Vystředit na cílovou plochu': 'Centre on the target face', 'Otočit opačně': 'Reverse direction',
    'Mezera': 'Gap', 'Osa válcové plochy': 'Axis of cylindrical face', 'Klepněte na plochu': 'Tap a face', 'Modře je nová poloha tělesa.': 'Blue shows the new position of the body.',
    'Každé těleso se posune samostatně.': 'Each body moves separately.', 'Vztažné těleso nemůže být mezi zarovnávanými': 'The reference body cannot be one of the aligned bodies',
    '!Vztažné těleso nemůže být mezi zarovnávanými': '!The reference body cannot be one of the aligned bodies',
    'Cílová plocha musí patřit jinému tělesu.': 'The target face must belong to another body.', 'Zarovnat k…': 'Align to…', 'Zarovnat k jiné ploše…': 'Align to another face…',
    'Klepněte na těleso, ke kterému se zarovná': 'Tap the body to align to', 'Vyberte těleso, ke kterému se zarovná': 'Select the body to align to', 'Vyberte obě plochy': 'Select both faces',
    'Rovnou plochu lze zarovnat jen s rovnou plochou, válcovou jen s válcovou': 'A flat face can only be aligned with a flat face, a cylindrical one with a cylindrical one',
    'Klepněte na plochu tělesa, které se má přesunout (rovnou stěnu nebo válec)': 'Tap a face of the body that should move (a flat face or a cylinder)',
    'Klepněte na cílovou plochu (k rovné stěně rovnou, k válci válcovou)': 'Tap the target face (flat to flat, cylinder to cylinder)',
    // sketch: rectangle from centre, trim
    'Kreslit': 'Draw', 'Z rohu': 'From corner', 'Ze středu': 'From centre', 'Obdélník ze středu: klepněte na střed, pak na roh': 'Centre rectangle: tap the centre, then a corner',
    'Vystřihnout': 'Cut out', 'Pant': 'Hinge', 'Tištěný vcelku': 'Print-in-place', 'Na šroub': 'For a screw', 'Délka pantu': 'Hinge length', 'Šířka křídla': 'Leaf width', 'Tloušťka křídla': 'Leaf thickness', 'Počet kloubů': 'Knuckles', 'Průměr čepu': 'Pin diameter', 'Průměr šroubu v ose': 'Axis screw diameter', 'Otvory v křídle': 'Holes per leaf', 'Zápustné šrouby': 'Countersunk screws', 'Krabička s víkem': 'Box with lid', 'Víko je připojené pantem; západka se spočítala na zavřené krabičce a víko zůstalo odklopené.': 'The lid is joined by a hinge; the latch was worked out on the closed box and the lid stays open.', 'Pružná na stěně': 'Spring, on the wall', 'Pružná zasunutá': 'Spring, hidden', 'Otočná páčka na stěně': 'Swivel lever, on the wall', 'Otočná páčka zapuštěná': 'Swivel lever, flush', 'Délka páčky': 'Lever length', 'Osa páčky': 'Lever axle', 'Šroub M3': 'M3 screw', 'Šířka páčky': 'Lever width', 'Klepněte na stěnu krabičky, kde má být západka. Víko leží na krabičce, nebo je připojené pantem krabičky.': 'Tap the box wall where the latch goes. The lid lies on the box, or is joined to it by a box hinge.', 'Klepněte na víko.': 'Tap the lid.', 'Páčka se otáčí na ose ve stěně víka a visí dolů přes krabičku; výřezem na konci zachytí kolík na krabičce. Odklopením páčky stranou (o 90°) se víko uvolní.': 'The lever turns on an axle in the lid wall and hangs down over the box; the notch at its end catches a stud on the box. Swing the lever aside (90°) to free the lid.', 'Páčka se otáčí na ose ve stěně víka a visí dolů přes krabičku; výřezem na konci zachytí kolík na krabičce. Odklopením páčky stranou (o 90°) se víko uvolní. Páčka leží v kapse zarovnaná se stěnou.': 'The lever turns on an axle in the lid wall and hangs down over the box; the notch at its end catches a stud on the box. Swing the lever aside (90°) to free the lid. The lever sits in a pocket, level with the wall.', 'Víko musí ležet na krabičce (zavřená krabička)': 'The lid must lie on the box (closed box)', 'Víko musí ležet na krabičce, nebo být připojené pantem krabičky (tisk vcelku)': 'The lid must lie on the box, or be joined to it by a box hinge (print in one piece)', 'Víko je na páčku příliš nízké, zkraťte páčku': 'The lid is too low for the lever; shorten the lever', 'Páčka je příliš krátká': 'The lever is too short', 'Západka – páčka': 'Latch – lever',  'Rezerva při zavření (osa nad okrajem)': 'Closing allowance (axis above the rim)', 'Západka': 'Latch', 'Provedení': 'Type', 'Zasunutá': 'Hidden', 'Strana': 'Side', 'Šířka západky': 'Latch width', 'Počet': 'Count', 'Tloušťka stěny krabičky': 'Box wall thickness', 'Klepněte na stěnu krabičky, kde má být západka. Víko má ležet na krabičce (zavřená krabička).': 'Tap the box wall where the latch goes. The lid should lie on the box (closed box).', 'Z víka do krabičky zajede pružný jazýček, jeho výstupek zaskočí do drážky ve stěně krabičky. Zvenku není vidět.': 'A springy lip from the lid goes into the box; its bump snaps into a groove in the box wall. It is not visible from outside.', 'Z víka visí přes stěnu krabičky pružný jazýček, jeho zobáček zaskočí pod lištu na krabičce. Otevře se zatažením za jazýček.': 'A springy tab hangs from the lid over the box wall; its hook snaps under a ridge on the box. Pull the tab to open.', 'Všechny převisy jsou 45°, tiskne se bez podpěr. Západku přidejte dřív než pant navržený na zavřené krabičce.': 'All overhangs are 45°, it prints without supports. Add the latch before a hinge designed on the closed box.', 'Víko musí ležet na krabičce: západku přidejte na zavřenou krabičku (před pantem)': 'The lid must lie on the box: add the latch to the closed box (before the hinge)', 'Západka se nevejde podél hrany': 'The latch does not fit along the edge', 'Krabička je na západku příliš nízká': 'The box is too low for the latch', 'Posunutá západka by přesahovala hranu': 'The shifted latch would overhang the edge', 'Západka – díl krabičky': 'Latch – box part', 'Západka – díl víka': 'Latch – lid part',  'Posun podél hrany': 'Shift along the edge', 'Výsledek': 'Result', 'Přidat k tělesům': 'Add to the bodies', 'Nová tělesa': 'New bodies', 'Pant – díl krabičky': 'Hinge – box part', 'Pant – díl víka': 'Hinge – lid part', 'Posunutý pant by přesahoval hranu': 'The shifted hinge would overhang the edge', 'Počet kloubů musí být 2, 3, 5 nebo 7': 'The knuckle count must be 2, 3, 5 or 7', 'Klepněte na první bod (průměr: klepněte na válcovou plochu nebo kruhovou hranu)': 'Tap the first point (diameter: tap a cylindrical face or a circular edge)', 'Samostatný, tištěný vcelku': 'Standalone, print-in-place', 'Samostatný, na šroub': 'Standalone, for a screw', 'Krabička navržená zavřená': 'Box designed closed', 'Krabička a víko vedle sebe': 'Box and lid side by side', 'Spojení': 'Joint', 'Tisk vcelku': 'Print in one piece', 'Kolík / šroub': 'Pin / screw', 'Kolík': 'Pin', 'Filament 1,75': 'Filament 1.75', 'Šroub M2': 'M2 screw', 'Šroub M3': 'M3 screw', 'Strana pantu': 'Hinge side', 'Zadní (+Y)': 'Back (+Y)', 'Přední (−Y)': 'Front (−Y)', 'Pravá (+X)': 'Right (+X)', 'Levá (−X)': 'Left (−X)', 'Mezera mezi díly po rozložení': 'Gap between parts when unfolded', 'Klepněte na zadní stěnu krabičky, kde má být pant. Víko má ležet na krabičce (zavřená krabička).': 'Tap the back wall of the box where the hinge goes. The lid should lie on the box (closed box).', 'Klepněte na víko, které leží na krabičce.': 'Tap the lid lying on the box.', 'Krabička a víko se tisknou zvlášť (víko otočte otevřenou stranou nahoru). Pant je navržený pro zavřenou polohu, víko proto vždy dosedne.': 'The box and lid print separately (turn the lid open side up). The hinge is designed for the closed position, so the lid always closes.', 'Tiskne se vcelku bez podpěr. Pant je navržený pro zavřenou polohu, víko proto po překlopení přesně dosedne.': 'Prints in one piece without supports. The hinge is designed for the closed position, so the lid closes exactly when flipped.', 'Víko musí ležet na krabičce (navrhněte krabičku zavřenou)': 'The lid must lie on the box (design the box closed)', 'Zadní stěna víka musí lícovat se zadní stěnou krabičky': 'The lid’s back wall must be flush with the box’s back wall', 'Víko neleží nad krabičkou': 'The lid is not above the box', 'Pro tisk vcelku musí být víko stejně vysoké jako krabička; nižší víko připojte na kolík nebo šroub': 'To print in one piece the lid must be as tall as the box; join a lower lid with a pin or screw',  'Umístění': 'Placement', 'Zapuštěný': 'Flush', 'Na stěně': 'On the wall', 'Klouby jsou zapuštěné do horní hrany obou stěn, zevnitř je podél pantu žebro. Tiskne se vcelku bez podpěr; víko se po tisku překlopí o 180°.': 'The knuckles are sunk into the rim of both walls, with a rib along the hinge on the inside. Prints in one piece without supports; after printing, flip the lid 180°.', 'Krabička': 'Box', 'Víko': 'Lid', 'Počet pantů': 'Number of hinges', 'Klepněte na krabičku': 'Tap the box', 'Klepněte na víko': 'Tap the lid', 'Klepněte na krabičku. Krabička a víko mají stát vedle sebe otevřené nahoru, horní hrany ve stejné výšce.': 'Tap the box. The box and lid should stand side by side, open side up, with their rims at the same height.', 'Klepněte na víko, které stojí vedle krabičky.': 'Tap the lid standing next to the box.', 'Tiskne se vcelku bez podpěr; víko se po tisku překlopí o 180° na krabičku.': 'Prints in one piece without supports; after printing, flip the lid 180° onto the box.', 'Krabička a víko musí být dvě různá tělesa': 'The box and lid must be two different bodies', 'Krabička nebo víko chybí': 'The box or lid is missing', 'Krabička a víko musí mít horní hranu ve stejné výšce': 'The box and lid must have their rims at the same height', 'Krabička a víko se překrývají, postavte je vedle sebe s mezerou': 'The box and lid overlap; place them side by side with a gap', 'Krabička a víko jsou od sebe příliš daleko (nejvýš 30 mm)': 'The box and lid are too far apart (30 mm at most)', 'Celý pant': 'Whole hinge', 'Žádné': 'None', 'Křídlo A': 'Leaf A', 'Křídlo B': 'Leaf B', 'Osa pantu': 'Hinge axis', 'Podél X': 'Along X', 'Podél Y': 'Along Y', 'Poloha (střed osy)': 'Position (axis centre)', 'Pant leží naplocho v poloze pro tisk. Klepnutím do pohledu ho umístíte, manipulátorem posunete.': 'The hinge lies flat, ready to print. Tap the view to place it, drag the manipulator to move it.', 'Tiskne se vcelku bez podpěr; po tisku pant několikrát protočte, aby se uvolnil.': 'Prints in one piece without supports; after printing, swing the hinge a few times to free it.', 'Pro připojení ke dvěma tělesům vytvořte zvlášť křídlo A a křídlo B ve stejné poloze.': 'To attach it to two bodies, create leaf A and leaf B separately at the same position.', 'Délka pantu musí být 6 až 500 mm': 'The hinge length must be 6 to 500 mm', 'Průměr čepu musí být 1 až 20 mm': 'The pin diameter must be 1 to 20 mm', 'Počet kloubů musí být 3, 5 nebo 7': 'The knuckle count must be 3, 5 or 7', 'Tloušťka křídla musí být alespoň 0,8 mm': 'The leaf must be at least 0.8 mm thick', 'Klouby jsou příliš krátké, prodlužte pant nebo zvolte méně kloubů': 'The knuckles are too short; make the hinge longer or use fewer knuckles', 'Křídlo je na otvory pro šrouby příliš úzké': 'The leaf is too narrow for the screw holes', 'Díra': 'Hole', 'Skořepina': 'Shell', 'Odsadit': 'Offset', 'Text': 'Text', 'Místo': 'Location', 'Do středu plochy': 'Centre of the face', 'Střed díry': 'Hole centre', 'Průchozí pro šroub (ISO 273)': 'Clearance hole (ISO 273)', 'Zahloubení pro imbus (DIN 974)': 'Counterbore for socket head (DIN 974)', 'Zápustná 90° (ISO 15065)': 'Countersink 90° (ISO 15065)', 'Se závitem': 'Threaded', 'Skrz celé těleso': 'Through all', 'Hloubka zahloubení (0 = výška hlavy)': 'Counterbore depth (0 = head height)', 'Kapsa pro matici': 'Nut pocket', 'Bez kapsy': 'No pocket', 'Na straně šroubu': 'On the bolt side', 'Na druhé straně': 'On the far side', 'Boční vsuvka': 'Side slot', 'Nízká matice (ISO 4035)': 'Thin nut (ISO 4035)', 'Vůle kapsy': 'Pocket clearance', 'Hloubka matice (střed)': 'Nut depth (centre)', 'Směr vsuvky': 'Slot direction', 'Rovná stěna': 'Flat face', 'Klepněte na místo na rovné stěně': 'Tap a point on a flat face', 'Klepnutím na jiné místo díru přesunete. Přesnou polohu zadáte v dialogu.': 'Tap another point to move the hole. Enter the exact position in the dialog.', 'Klepněte na rovnou stěnu tělesa, kde má být díra': 'Tap the flat face of a body where the hole should go', 'Díru umístěte na rovnou stěnu.': 'Place the hole on a flat face.', 'Tloušťka stěny': 'Wall thickness', 'Otevřené plochy': 'Open faces', 'Zrušit otevřené plochy': 'Clear open faces', 'Žádná (uzavřená dutina)': 'None (closed cavity)', 'Klepnutím na rovnou stěnu ji otevřete (znovu klepnutím zavřete). Tloušťku stěny zadejte v dialogu.': 'Tap a flat face to open it (tap again to close it). Enter the wall thickness in the dialog.', 'Klepněte na těleso, ze kterého se má udělat skořepina': 'Tap the body to hollow out', 'Otevřít lze jen rovnou stěnu.': 'Only a flat face can be opened.', 'Klepněte na těleso': 'Tap a body', 'Ven': 'Outward', 'Dovnitř': 'Inward', 'Výška písmen': 'Letter height', 'Tučné písmo': 'Bold', 'Odsadit: nastavte vzdálenost a směr v paletě a klepněte na obrys, vedle vznikne odsazená kopie': 'Offset: set the distance and direction in the palette and tap an outline; an offset copy is added', 'Text: napište text a výšku písma v paletě, pak klepněte na místo, kde má text začínat (levý konec účaří)': 'Text: type the text and letter height in the palette, then tap where the text should start (left end of the baseline)', 'Klepněte na obrys, který chcete odsadit.': 'Tap the outline to offset.', 'Odsazení je větší než tvar.': 'The offset is larger than the shape.', 'Text nejde odsadit.': 'Text cannot be offset.', 'V výška velkých písmen · Mez. mezera mezi písmeny (mm)': 'V capital letter height · Mez. letter spacing (mm)', 'Tloušťka stěny musí být alespoň 0,1 mm': 'The wall must be at least 0.1 mm thick', 'Otevřená plocha nebyla nalezena': 'Open face not found', 'Stěna je na toto těleso příliš silná': 'The wall is too thick for this body', 'Skořepinu se nepodařilo vytvořit': 'The shell could not be made', 'Díra neprochází tělesem, klepněte na stěnu tělesa': 'The hole does not go into a body; tap a face of the body', 'Zadejte hloubku díry': 'Enter the hole depth', 'Normální (ISO 4032)': 'Regular (ISO 4032)', 'Nízká (ISO 4035)': 'Thin (ISO 4035)', 'Elipsa ze středu: klepněte na střed, pak na roh obdélníku, do kterého se elipsa vepíše. Natočení nastavíte v paletě.': 'Ellipse from centre: tap the centre, then a corner of the box the ellipse fits in. Set the rotation in the palette.', 'Oříznout': 'Trim', 'Odečíst: klepněte na uzavřený tvar, od kterého se má odečítat': 'Subtract: tap the closed shape to subtract from', 'Sjednotit: klepněte na první uzavřený tvar': 'Union: tap the first closed shape', 'Průnik: klepněte na první uzavřený tvar': 'Intersect: tap the first closed shape', 'Rozdělit: klepněte na uzavřený tvar, který se má rozdělit': 'Split: tap the closed shape to split', 'Teď klepněte na tvar, který se odečte (nebo na čáru, podél které se tvar rozdělí)': 'Now tap the shape to subtract (or a line to split the shape along)', 'Teď klepněte na druhý tvar, oba se spojí do jednoho obrysu': 'Now tap the second shape; both merge into one outline', 'Teď klepněte na druhý tvar, zůstane jen jejich společná část': 'Now tap the second shape; only their common part stays', 'Teď klepněte na čáru nebo křivku, podél které se tvar rozdělí': 'Now tap the line or curve to split the shape along', 'Část odstraněna.': 'Part removed.', 'Nejprve klepněte na uzavřený tvar.': 'First tap a closed shape.', 'Tvary se nepřekrývají, nic se nespojilo.': 'The shapes do not overlap, nothing was merged.', 'Spojeno do jednoho tvaru.': 'Merged into one shape.', 'Zůstala společná část.': 'The common part remains.', 'Tvary se nepřekrývají, nic nezůstalo.': 'The shapes do not overlap, nothing remains.', 'Odečteno.': 'Subtracted.', 'Tvar byl odečten celý.': 'The whole shape was subtracted.', 'Pro rozdělení klepněte na čáru nebo křivku.': 'To split, tap a line or curve.', 'Odečíst': 'Subtract', 'Sjednotit': 'Union', 'Rozdělit': 'Split', 'Oříznout: klepněte na úsek čáry mezi průsečíky, úsek se odstraní a navazující čáry se spojí do jednoho obrysu': 'Trim segment: tap a piece of a line between intersections; it is removed and the remaining lines join into one outline', 'Klepněte na čáru, kterou chcete oříznout.': 'Tap the line you want to trim.', 'Prvek nemá průsečík, odstraněn celý.': 'The element has no intersection, removed entirely.', 'Úsek odstraněn.': 'Segment removed.', 'Vystřihnout: klepněte na uzavřený tvar, ze kterého se má vystřihovat': 'Trim: tap the closed shape to cut from',
    'Teď klepněte na tvar, který se vystřihne, nebo na čáru, podél které se tvar rozdělí': 'Now tap the shape to cut out, or a line to split the shape along',
    'Nejprve klepněte na uzavřený tvar, ze kterého se má vystřihovat.': 'First tap the closed shape to cut from.', 'Vystřiženo.': 'Cut out.', 'Tvar byl vystřižen celý.': 'The whole shape was cut away.',
    'Klepněte na další tvar, ze kterého se má vystřihovat': 'Tap another shape to cut from', 'Čára tvar neprotíná, nic se nerozdělilo.': 'The line does not cross the shape, nothing was split.',
    'Tvar je rozdělený. Klepněte do části, kterou chcete odstranit (Esc nechá obě části)': 'The shape is split. Tap inside the part to remove (Esc keeps both parts)',
    'Klepněte dovnitř jedné z částí.': 'Tap inside one of the parts.', 'Část odstraněna. Klepněte na další tvar, ze kterého se má vystřihovat.': 'Part removed. Tap another shape to cut from.',
    'Kružnice z rohu: klepněte na roh čtverce, do kterého se kružnice vepíše, pak na protější roh': 'Circle from corner: tap a corner of the square the circle fits in, then the opposite corner',
    'Mnohoúhelník z rohu: klepněte na roh čtverce, do kterého se vepíše, pak na protější roh. Počet stran nastavíte v paletě.': 'Polygon from corner: tap a corner of the square it fits in, then the opposite corner. Set the number of sides in the palette.',
    'Drážka z rohu: klepněte na roh, pak na protější roh obdélníku, do kterého se drážka vejde': 'Slot from corner: tap a corner, then the opposite corner of the box the slot fits in',
    'Elipsa z rohu: klepněte na roh, pak na protější roh obdélníku, do kterého se elipsa vepíše': 'Ellipse from corner: tap a corner, then the opposite corner of the box the ellipse fits in',
    'X, Y střed · L celková délka · Š šířka · ∠ natočení': 'X, Y centre · L overall length · W width · ∠ angle',
    'X, Y střed · L celková délka · R rozteč středů zaoblení · Š šířka · ∠ natočení': 'X, Y centre · L overall length · R distance between arc centres · W width · ∠ angle',
    'Od konce ke konci': 'End to end', 'Spojit': 'Join', 'Duplikovat prvek': 'Duplicate element',
    'Spojit: klepněte na první otevřenou čáru nebo křivku, pak na druhou. Konce se propojí úsečkami a vznikne uzavřený obrys.': 'Join: tap the first open line or curve, then the second. The ends are connected with straight lines into a closed outline.',
    'Spojit: klepněte na druhou čáru nebo křivku. Klepnutím na stejnou ji uzavřete úsečkou.': 'Join: tap the second line or curve. Tap the same one again to close it with a straight line.',
    'Klepněte na otevřenou čáru nebo křivku.': 'Tap an open line or curve.', 'Spojeno do uzavřeného obrysu': 'Joined into a closed outline',
    'Z takových prvků uzavřený obrys nevznikne.': 'These elements cannot form a closed outline.', 'Duplikováno. Kopii přesunete tažením.': 'Duplicated. Drag the copy to move it.',
    'Klepnutím vyberte prvek skici, tažením ho přesunete. Nástroje kreslení jsou v pásu nahoře.': 'Tap a sketch element to select it, drag it to move it. Drawing tools are in the ribbon above.', 'Bod po bodu': 'Point by point', 'Od ruky': 'Freehand',
    'Čára: klepejte na body nebo táhněte úseky; klepnutím na první bod obrys uzavřete, dvojím klepnutím nebo Enter ukončíte': 'Line: tap points or drag segments; tap the first point to close the outline, double-tap or Enter finishes',
    'Křivka: klepejte nebo táhněte na body, kterými má křivka projít; klepnutím na první bod ji uzavřete, dvojím klepnutím nebo Enter ukončíte. Body pak jde přetáhnout.': 'Spline: tap or drag to the points the curve should pass through; tap the first point to close it, double-tap or Enter finishes. The points can be dragged afterwards.',
    'Křivka od ruky: táhněte prstem nebo myší, po puštění se tah převede na hladkou křivku. Když skončíte u začátku, křivka se uzavře.': 'Freehand spline: drag with a finger or the mouse; on release the stroke becomes a smooth curve. Ending near the start closes it.', 'Drážka: klepněte na jeden konec, pak na druhý konec drážky (celková délka), třetím klepnutím určíte šířku': 'Slot: tap one end, then the other end of the slot (overall length), a third tap sets the width',
    // keys
    'Akce': 'Action', 'Del': 'Del'
  };

  /* patterns for texts that contain numbers or names: [regular expression, English template] */
  const PATTERNS = [
    [/^Objem ([\d,]+) → ([\d,]+) cm³ \((\d+) %\)$/, 'Volume $1 → $2 cm³ ($3 %)'],
    [/^(\d+) (plocha|plochy|ploch)$/, (m, n) => `${n} face${n === '1' ? '' : 's'}`],
    [/^závit M([\d,]+) × ([\d,]+) mm(.*)$/, (m, a, b, c) => `thread M${a} × ${b} mm${tr(c)}`],
    [/^díra Ø ([\d,]+)(.*)$/, (m, a, c) => `hole Ø ${a}${c.replace('zahloubení', 'counterbore').replace('kužel', 'countersink').replace('kapsa klíč', 'pocket across flats')}`],
    [/^Návrh s tímto názvem už existuje, název změněn na „(.+)“\.$/, 'A design with this name already exists, renamed to “$1”.'],
    [/^Úložiště návrhů je zaplněné z (\d+) %\. Zálohujte knihovnu \(Soubor › Zálohovat knihovnu\) a smažte staré návrhy \(Soubor › Moje návrhy\)\.$/, 'Design storage is $1 % full. Back up the library (File › Back up library) and delete old designs (File › My designs).'],
    [/^Úložiště: (<?\d+) % \((.+) z ~(.+)\)$/, 'Storage: $1 % ($2 of ~$3)'],
    [/^Záloha knihovny uložena \((\d+) (návrh|návrhy|návrhů)\)$/, (m, n) => `Library backup saved (${n} design${n === '1' ? '' : 's'})`],
    [/^Obnoveno ze zálohy: (\d+) nových, (\d+) aktualizovaných, (\d+) beze změny(?:, (\d+) se nepodařilo načíst)?$/, (m, a, b, c, d) => `Restored from backup: ${a} new, ${b} updated, ${c} unchanged` + (d ? `, ${d} could not be read` : '')],
    [/^M([\d.,]+) × ([\d.,]+) · hlava Ø ([\d.,]+) × ([\d.,]+) mm, imbus ([\d.,]+)$/, 'M$1 × $2 · head Ø $3 × $4 mm, hex key $5'],
    [/^M([\d.,]+) × ([\d.,]+) · klíč ([\d.,]+), hlava ([\d.,]+) mm$/, 'M$1 × $2 · wrench $3, head $4 mm'],
    [/^M([\d.,]+) × ([\d.,]+) · klíč ([\d.,]+), výška ([\d.,]+) mm$/, 'M$1 × $2 · wrench $3, height $4 mm'],
    [/^Kloub Ø ([\d.,]+) mm, (\d) × ([\d.,]+) mm, mezera ([\d.,]+) mm$/, 'Knuckle Ø $1 mm, $2 × $3 mm, gap $4 mm'],
    [/^Osu dejte alespoň ([\d.,]+) mm za hranu tělesa, jinak se ho dotknou i klouby druhého křídla\.$/, 'Put the axis at least $1 mm beyond the body edge, otherwise the other leaf’s knuckles touch it too.'],
    [/^Mezera mezi krabičkou a víkem ([\d.,]+) mm \(nejméně ([\d.,]+) mm\)\.$/, 'Gap between box and lid $1 mm (at least $2 mm).'],
    [/^Mezera mezi krabičkou a víkem musí být alespoň ([\d.,]+) mm \(teď ([\d.,]+) mm\)$/, 'The gap between box and lid must be at least $1 mm (now $2 mm)'],
    [/^Panty se nevejdou podél hrany \(([\d.,]+) mm\)$/, 'The hinges do not fit along the edge ($1 mm)'],
    [/^Krabička je na pant příliš nízká, potřebuje výšku alespoň ([\d.,]+) mm$/, 'The box is too low for the hinge; it needs to be at least $1 mm tall'],
    [/^Mezera mezi krabičkou a víkem ([\d.,]+) mm \(nejvýš ([\d.,]+) mm\)\.$/, 'Gap between box and lid $1 mm (at most $2 mm).'],
    [/^Pro zapuštěný pant musí být krabička a víko blíž u sebe: mezera nejvýš ([\d.,]+) mm \(teď ([\d.,]+) mm\)$/, 'For a flush hinge the box and lid must be closer: gap at most $1 mm (now $2 mm)'],
    [/^Mezera mezi krabičkou a víkem musí být alespoň ([\d.,]+) mm$/, 'The gap between box and lid must be at least $1 mm'],
    [/^Kloub Ø ([\d.,]+) mm, (\d) × ([\d.,]+) mm, vůle ([\d.,]+) mm$/, 'Knuckle Ø $1 mm, $2 × $3 mm, clearance $4 mm'],
    [/^Do kloubů patří kus filamentu 1,75 mm dlouhý (\d+) mm; konce zatavte nebo zaklepněte\.$/, 'Use a piece of 1.75 mm filament $1 mm long as the pin; melt or peen its ends.'],
    [/^Do kloubů patří šroub (M\d) dlouhý (\d+) mm\.$/, 'Use an $1 screw $2 mm long as the pin.'],
    [/^Víko je odklopené o 180° vedle krabičky, mezera ([\d.,]+) mm\.$/, 'The lid is flipped 180° beside the box, gap $1 mm.'],
    [/^Průměr Ø ([\d.,]+) mm \(poloměr ([\d.,]+) mm\) · (.*)$/, (m, a, b, c) => 'Diameter Ø ' + a + ' mm (radius ' + b + ' mm) · ' + tr(c)],
    [/^Průměr změříte klepnutím na válcovou plochu nebo kruhovou hranu\. (.*)$/, (m, c) => 'Tap a cylindrical face or a circular edge to measure its diameter. ' + tr(c)],
    [/^Průměr Ø ([\d.,]+) mm · klepněte na druhý bod pro vzdálenost$/, 'Diameter Ø $1 mm · tap a second point for a distance'],
    [/^ · Ø ([\d.,]+) mm$/, ' · Ø $1 mm'],
    [/^Páčka je samostatné těleso, tiskněte ji naležato; osa: (kus filamentu 1,75 mm \(natlačit do díry ve víku\)|samořezný šroub M3 do díry ve víku)\.(?: (.*))?$/, (m, a, b) => 'The lever is a separate body, print it lying flat; axle: ' + (a.startsWith('kus') ? 'a piece of 1.75 mm filament (pressed into the hole in the lid)' : 'an M3 self-tapping screw into the hole in the lid') + '.' + (b ? ' ' + tr(b) : '')],
    [/^Všechny převisy jsou 45°, tiskne se bez podpěr\.(?: (.*))?$/, (m, a) => 'All overhangs are 45°, it prints without supports.' + (a ? ' ' + tr(a) : '')],
    [/^Pro zapuštěnou otočnou západku musí mít stěna alespoň ([\d.,]+) mm \(jinak zvolte otočnou na stěně\)$/, 'For a flush swivel latch the wall must be at least $1 mm thick (otherwise choose the one on the wall)'],
    [/^Do osy šroub M([\d.,]+) × (\d+) mm s maticí\.$/, 'Axis screw M$1 × $2 mm with a nut.'],
    [/^Křídlo je na tento čep příliš silné \(nejvýš ([\d.,]+) mm\), zvětšete průměr čepu$/, 'The leaf is too thick for this pin (max $1 mm); increase the pin diameter'],
    [/^Křídlo musí být široké alespoň ([\d.,]+) mm$/, 'The leaf must be at least $1 mm wide'],
    [/^Pant ([\d.,]+)×([\d.,]+)( – křídlo ([AB]))?$/, (m, a, b, c, d) => 'Hinge ' + a + '×' + b + (d ? ' – leaf ' + d : '')],
    [/^Délka šroubu musí být ([\d.,]+) až 500 mm$/, 'Bolt length must be $1 to 500 mm'], [/^Šroub (\d+)$/, 'Bolt $1'], [/^Matice (\d+)$/, 'Nut $1'], [/^Šroub M([\d,]+)×([\d,]+)$/, 'Bolt M$1×$2'], [/^Matice M([\d,]+)$/, 'Nut M$1'], [/^Matice M([\d,]+) nízká$/, 'Thin nut M$1'],
    [/^Tady nejde uložit soubor (\w+) přímo, je zabalený v ZIP\. Ve verzi na GitHub Pages se uloží přímo\.$/, 'The $1 file cannot be saved directly here, it is packed in a ZIP. The GitHub Pages version saves it directly.'],
    [/^Velikost ([\d,.]+) % · ([\d,.]+) × ([\d,.]+) mm$/, 'Size $1 % · $2 × $3 mm'],
    [/^hlava Ø ([\d,.]+) × ([\d,.]+) mm$/, 'head Ø $1 × $2 mm'],
    [/^Vítejte ve (.+)$/, 'Welcome to $1'], [/^Pokračovat: (.+)$/, 'Continue: $1'],
    [/^Otevřen návrh „(.+)“$/, 'Opened design “$1”'], [/^Smazat návrh (.+)$/, 'Delete design $1'],
    [/^(\d+) krok$/, '$1 step'], [/^(\d+) kroky$/, '$1 steps'], [/^(\d+) kroků$/, '$1 steps'], [/^otevřený$/, 'open'],
    [/^Skica (\d+) \(z plochy\)$/, 'Sketch $1 (from face)'], [/^Skica (\d+) \((.+)\)$/, 'Sketch $1 ($2)'], [/^Skica (\d+)$/, 'Sketch $1'],
    [/^Těleso (\d+)$/, 'Body $1'], [/^Import (\d+)$/, 'Import $1'],
    [/^Úsečka (\d+) \(uzavírací\)$/, 'Segment $1 (closing)'], [/^Úsečka (\d+)$/, 'Segment $1'],
    [/^(\d+) bodů$/, '$1 points'], [/^body přesunete tažením ve skice$/, 'drag the points in the sketch'],
    [/^Vybráno těles: (\d+)$/, 'Bodies selected: $1'], [/^Vybráno: (.+)$/, (m, a) => `Selected: ${tr(a)}`],
    [/^Zkopírováno: (.+)\. Vložíte Ctrl\+V\.$/, (m, a) => `Copied: ${tr(a)}. Paste with Ctrl+V.`],
    [/^(\d+) (těleso|tělesa|těles)$/, (m, n) => `${n} ${n === '1' ? 'body' : 'bodies'}`],
    [/^(\d+) (profil|profily|profilů)$/, (m, n) => `${n} ${n === '1' ? 'profile' : 'profiles'}`],
    [/^(\d+) (hrana|hrany|hran)$/, (m, n) => `${n} ${n === '1' ? 'edge' : 'edges'}`],
    [/^(\d+) (prvek|prvky|prvků)$/, (m, n) => `${n} ${n === '1' ? 'element' : 'elements'}`],
    [/^(\d+) (uzavřený profil|uzavřené profily|uzavřených profilů)$/, (m, n) => `${n} closed ${n === '1' ? 'profile' : 'profiles'}`],
    [/^Vzniknou (\d+) kopie\.$/, '$1 copies will be created.'], [/^Vznikne (\d+) kopií\.$/, '$1 copies will be created.'],
    [/^Otočí se (.+) najednou\.$/, '$1 will be rotated together.'],
    [/^Velikost (.+) %$/, 'Size $1 %'], [/^Odsazení (.+) mm$/, 'Offset $1 mm'], [/^délka (?!plochy)(.+) mm$/, 'length $1 mm'], [/^šířka (.+) mm$/, 'width $1 mm'],
    [/^délka plochy (.+) mm$/, 'face length $1 mm'], [/^vůle zvětší závit o (.+) mm$/, 'clearance enlarges the thread by $1 mm'], [/^vůle zmenší závit o (.+) mm$/, 'clearance shrinks the thread by $1 mm'], [/^normála (.+)$/, 'normal $1'], [/^Válcová plocha Ø(.+)$/, 'Cylindrical face Ø$1'],
    [/^Objem (.+) cm³$/, 'Volume $1 cm³'], [/^objem (.+) cm³$/, 'volume $1 cm³'], [/^povrch (.+) cm²$/, 'surface $1 cm²'],
    [/^Posun: X (.+)$/, 'Move: X $1'], [/^Původní rozměry (.+) mm$/, 'Original dimensions $1 mm'],
    [/^(Vrchol|Střed hrany|Střed kružnice|Hrana|Plocha): (.+)$/, (m, k, v) => ({ 'Vrchol': 'Vertex', 'Střed hrany': 'Edge midpoint', 'Střed kružnice': 'Circle centre', 'Hrana': 'Edge', 'Plocha': 'Face' })[k] + ': ' + v],
    [/^(Kolmá vzdálenost od hrany|Kolmá vzdálenost od plochy|Vzdálenost rovnoběžných hran|Nejkratší vzdálenost přímek hran|Vzdálenost rovnoběžných ploch|Vzdálenost hrany od plochy|Vzdálenost) (.+)$/, (m, k, v) => ({ 'Kolmá vzdálenost od hrany': 'Perpendicular distance from the edge', 'Kolmá vzdálenost od plochy': 'Perpendicular distance from the face', 'Vzdálenost rovnoběžných hran': 'Distance between parallel edges', 'Nejkratší vzdálenost přímek hran': 'Shortest distance between the edge lines', 'Vzdálenost rovnoběžných ploch': 'Distance between parallel faces', 'Vzdálenost hrany od plochy': 'Distance of the edge from the face', 'Vzdálenost': 'Distance' })[k] + ' ' + v.replace('Úhel', 'Angle')],
    [/^Úhel (.+) · vzdálenost bodů (.+)$/, 'Angle $1 · point distance $2'], [/^Úhel (.+)$/, 'Angle $1'],
    [/^Plocha se rozdělí na části (.+) mm² a (.+) mm²\. Každou pak vyberete a upravíte samostatně\.$/, 'The face splits into parts of $1 mm² and $2 mm². You can then select and edit each one separately.'],
    [/^Rozřízne se (\d+) (těleso|tělesa|těles), z každého vzniknou dvě \(modře a oranžově\)\.( Zmenšená plocha odřízne jen část před sebou \(ve směru šipky\)\.)?$/, (m, k, w, x) => `${k} ${k === '1' ? 'body is' : 'bodies are'} split, each into two (blue and orange).` + (x ? ' A smaller face cuts off only the part in front of it (in the arrow direction).' : '')],
    [/^Posun roviny (.+) mm$/, 'Plane offset $1 mm'], [/^Natočení (-?[\d,.−]+)°$/, 'Rotation $1°'], [/^Natočení (.+)° · (.+)°$/, 'Rotation $1° · $2°'], [/^Velikost (.+) mm$/, 'Size $1 mm'], [/^Posun plochy (.+) mm$/, 'Face shift $1 mm'],
    [/^Úhel ([\d,.]+)°$/, 'Angle $1°'], [/^Směr (.+) · (.+)°$/, 'Direction $1 · $2°'], [/^Poloměr ohybu (.+) mm$/, 'Bend radius $1 mm'],
    [/^Natočení kolem ([XYZ])$/, 'Rotation about $1'], [/^Posun plochy ([XYZ])$/, 'Face shift along $1'],
    [/^Hrana ([\d,.]+) mm$/, 'Edge $1 mm'], [/^Ohnout plochu (\d+)$/, 'Bend face $1'], [/^Rozříznout (\d+)$/, 'Split body $1'],
    [/^Zaoblená plocha s malým poloměrem ohybu: na vnitřní straně se ohyb zužuje až do jednoho bodu \(vypadá jako spoj\)\. Plynulý ohyb dá poloměr kolem (.+) mm \(polovina šířky plochy\)\.$/, 'Rounded face with a small bend radius: on the inner side the bend narrows down to a single point (looks like a joint). A radius of about $1 mm (half the face width) gives a smooth bend.'],
    [/^Kružnice · Ø (.+)$/, 'Circle · Ø $1'], [/^Oblouk · R (.+)$/, 'Arc · R $1'], [/^Hrana · délka (.+)$/, 'Edge · length $1'],
    [/^Vzdálenost (.+) mm$/, 'Distance $1 mm'], [/^Vzdálenost (.+)$/, 'Distance $1'],
    [/^Průměr plochy Ø(.+) neodpovídá velikosti (.+) \((díra pro ni má mít|čep má mít) Ø(.+)\)\.$/, (m, a, b, c, d) => `The face diameter Ø${a} does not match size ${b} (${c === 'čep má mít' ? 'the pin should be' : 'the hole should be'} Ø${d}).`],
    [/^Model má (.+) trojúhelníků, víc než zvládne prohlížeč \(6 milionů\)\. Zjednodušte ho prosím v jiném programu\.$/, 'The model has $1 triangles, more than the browser can handle (6 million). Please simplify it in another program.'],
    [/^(.+) má (.+) trojúhelníků\. Pro plynulou práci doporučuji síť zjednodušit, jemné detaily se tím mírně vyhladí\.$/, '$1 has $2 triangles. For smooth work I recommend simplifying the mesh; fine details will be slightly smoothed.'],
    [/^(.+) trojúhelníků \(zjednodušeno z (.+)\)$/, '$1 triangles (simplified from $2)'], [/^(.+) trojúhelníků$/, '$1 triangles'],
    [/^(.+) jednotek$/, '$1 units'],
    [/^Vloženo (.+) ze souboru (.+)\. Měřítko (.+) mm na jednotku(, jednotky nebyly v souboru uvedené)?\.$/, (m, a, b, c, d) => `Inserted ${tr(a)} from ${b}. Scale ${c} mm per unit${d ? ', the file does not state its units' : ''}.`],
    [/^(.+)\.zip obsahuje upravitelný návrh „(.+)“(.*) i síť (STL|OBJ)\.$/, '$1.zip contains the editable design “$2”$3 and a $4 mesh.'],
    [/^!Síť není uzavřená \((.+) otevřených hran\)\. Booleovské operace s ní nemusí fungovat\.$/, '!The mesh is not closed ($1 open edges). Boolean operations may not work with it.'],
    [/^Styl zobrazení: (.+)$/, (m, a) => `Display style: ${tr(a)}`],
    [/^Krychle (\d+)$/, 'Cube $1'], [/^Válec (\d+)$/, 'Cylinder $1'], [/^Koule (\d+)$/, 'Sphere $1'], [/^Kužel (\d+)$/, 'Cone $1'], [/^Torus (\d+)$/, 'Torus $1'],
    [/^Vysunutí (\d+)$/, 'Extrude $1'], [/^Rotace (\d+)$/, 'Revolve $1'], [/^Zaoblení (\d+)$/, 'Fillet $1'], [/^Zkosení (\d+)$/, 'Chamfer $1'],
    [/^Kombinovat (\d+)$/, 'Combine $1'], [/^Přesunout (\d+)$/, 'Move $1'], [/^Otočit (\d+)$/, 'Rotate $1'], [/^Vycentrovat (\d+)$/, 'Center $1'],
    [/^Upravit plochu (\d+)$/, 'Edit face $1'], [/^Rozdělit plochu (\d+)$/, 'Split face $1'], [/^Vystřižení se nepodařilo: (.+)$/, (m, a) => `Trimming failed: ${tr(a)}`], [/^Kombinace tvarů se nepodařila: (.+)$/, (m, a) => `Combining shapes failed: ${tr(a)}`], [/^Zarovnat (\d+)$/, 'Align $1'], [/^Závit (\d+)$/, 'Thread $1'], [/^Měřítko (\d+)$/, 'Scale $1'], [/^Zrcadlit (\d+)$/, 'Mirror $1'],
    [/^Pole (\d+)$/, 'Pattern $1'], [/^Odstranit těleso (\d+)$/, 'Delete body $1'], [/^Čára (\d+)$/, 'Line $1'], [/^Křivka (\d+)$/, 'Spline $1'],
    [/^Obdélník (\d+)$/, 'Rectangle $1'], [/^Kružnice (\d+)$/, 'Circle $1'], [/^Elipsa (\d+)$/, 'Ellipse $1'], [/^Mnohoúhelník (\d+)$/, 'Polygon $1'], [/^Drážka (\d+)$/, 'Slot $1'],
    [/^(.+) \(vytvořen v (.+)\)$/, '$1 (made in $2)'],
    [/^(.+): (.+)$/, (m, a, b) => (EXACT[a] ? `${EXACT[a]}: ${tr(b)}` : m)]
  ];

  const CZ = /[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/;
  function tr(text) {
    if (!text) return text;
    const lead = text.match(/^\s*/)[0], tail = text.match(/\s*$/)[0], core = text.trim();
    if (!core) return text;
    const done = x => lead + x + tail;
    if (Object.prototype.hasOwnProperty.call(EXACT, core)) return done(EXACT[core]);
    for (const [re, rep] of PATTERNS) { if (re.test(core)) { const out = core.replace(re, rep); if (out !== core) return done(out); } }
    /* parts separated by a middle dot, e.g. "Rovinná plocha · 900 mm² · normála 0; 0; 1" */
    if (core.includes(' · ')) { const parts = core.split(' · '), t = parts.map(p => tr(p)); if (t.some((x, i) => x !== parts[i])) return done(t.join(' · ')); }
    /* several lines (tooltips) */
    if (core.includes('\n')) { const ls = core.split('\n'), t = ls.map(l => tr(l)); if (t.some((x, i) => x !== ls[i])) return done(t.join('\n')); }
    /* label with a keyboard shortcut, e.g. "Čára (L)", "Dokončit skicu (Enter)" */
    let m = core.match(/^(.+) \(([A-Za-z0-9+]{1,12})\)$/);
    if (m) { const b = tr(m[1]); if (b !== m[1]) return done(`${b} (${m[2]})`); }
    /* field label with an axis, e.g. "Poloha základny X" */
    m = core.match(/^(.+) ([XYZ])$/);
    if (m) { const b = tr(m[1]); if (b !== m[1]) return done(`${b} ${m[2]}`); }
    return text;
  }

  let lang = 'cs';
  try { const st = JSON.parse(localStorage.getItem('kota-cad-settings') || '{}'); lang = st.lang || ((navigator.language || 'cs').toLowerCase().startsWith('cs') || (navigator.language || '').toLowerCase().startsWith('sk') ? 'cs' : 'en'); } catch (e) { /* default Czech */ }

  const ATTRS = ['title', 'aria-label', 'placeholder'];
  const origText = new WeakMap(), origAttr = new WeakMap();
  let busy = false;
  function doText(n) {
    const v = n.nodeValue; if (!v || !/[A-Za-zÀ-ž]/.test(v)) return;
    const t = tr(v); if (t !== v) { origText.set(n, v); n.nodeValue = t; }
  }
  function doEl(el) {
    for (const a of ATTRS) {
      const v = el.getAttribute && el.getAttribute(a); if (!v) continue;
      const t = tr(v); if (t !== v) { let m = origAttr.get(el); if (!m) origAttr.set(el, m = {}); m[a] = v; el.setAttribute(a, t); }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 || root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
    doEl(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeType === 1 && (n.tagName === 'SCRIPT' || n.tagName === 'STYLE') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    let n; while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doEl(n); }
  }
  const obs = new MutationObserver(list => {
    if (lang !== 'en' || busy) return;
    busy = true;
    try {
      for (const m of list) {
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doEl(m.target);
        else m.addedNodes.forEach(walk);
      }
    } finally { busy = false; }
  });
  function start() {
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    if (lang === 'en') walk(document.body);
    document.documentElement.lang = lang;
  }
  function restore(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) {
      if (n.nodeType === 3) { const o = origText.get(n); if (o !== undefined) { n.nodeValue = o; origText.delete(n); } }
      else { const m = origAttr.get(n); if (m) { for (const a in m) n.setAttribute(a, m[a]); origAttr.delete(n); } }
    }
  }
  const listeners = [];
  window.I18N = {
    get lang() { return lang; },
    t: s => (lang === 'en' ? tr(s) : s),
    set(l) {
      if (l === lang) return;
      lang = l; document.documentElement.lang = l;
      busy = true;
      try { if (l === 'en') walk(document.body); else restore(document.body); } finally { busy = false; }
      listeners.forEach(f => { try { f(l); } catch (e) { /* ignore */ } });
    },
    onChange: f => listeners.push(f),
    tr
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
