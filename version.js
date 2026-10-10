// Jediné místo, kde se mění verze aplikace.
// Při KAŽDÉ změně aplikace zvyš číslo verze (je v názvu aplikace, v souborech,
// které aplikace vytváří, i v názvu cache service workeru).
self.SKICA = {
  name: 'SkicaCAD',
  stage: 'Beta',
  version: '0.18',
};
self.SKICA.full = `${self.SKICA.name} ${self.SKICA.stage} ${self.SKICA.version}`;
self.SKICA.fileTag = `${self.SKICA.name}-${self.SKICA.stage}-${self.SKICA.version}`;
