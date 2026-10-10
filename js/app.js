// SkicaCAD – hlavní logika aplikace (stav projektu, UI, historie, soubory, PWA)
import {
  PLANES, isClosedShape, shapePolygon, findHoles, pointInPolygon, describeShape,
  extrudeBody, shapeLines3D, profileFace,
} from './geometry.js';
import { Viewer } from './gl3d.js';
import { Sketch2D } from './sketch2d.js';
import { appLabel, fileName, buildSTL, buildSVG, buildDXF } from './exporters.js';

const APP = self.SKICA;
const LABEL = appLabel(APP);
const AUTOSAVE_KEY = 'skicacad.autosave.v1';
const BODY_COLORS = [[0.55, 0.66, 0.79], [0.80, 0.67, 0.47], [0.52, 0.73, 0.58], [0.76, 0.56, 0.70]];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(kid));
  return e;
}
const icon = (id, cls = 'ic') => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('class', cls);
  const u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  u.setAttribute('href', '#' + id);
  s.append(u);
  return s;
};
const fmtNum = (n) => (Math.round(n * 1000) / 1000).toString().replace('.', ',');
const parseNum = (s) => {
  const n = parseFloat(String(s).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

// ---------- stav ----------
function newDoc() {
  return { format: 1, app: LABEL, name: 'Bez názvu', nextId: 1, counters: { sketch: 0, extrude: 0 }, features: [] };
}
let doc = newDoc();
const ui = { mode: 'model', sketchId: null, sel: null, ex: null };
const hist = { stack: [], idx: -1 };
let viewer = null;
let lastItems = [];

const newId = () => doc.nextId++;
const getFeature = (id) => doc.features.find((f) => f.id === id) || null;
const sketches = () => doc.features.filter((f) => f.type === 'sketch');

// ---------- toast ----------
let toastTimer = 0;
function toast(msg, ms = 3200) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

// ---------- historie a automatické ukládání ----------
let autosaveTimer = 0;
function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ app: LABEL, savedAt: Date.now(), doc })); } catch (e) { /* plné úložiště apod. */ }
  }, 300);
}

function resetHistory() {
  hist.stack = [JSON.stringify(doc)];
  hist.idx = 0;
  updateUndoButtons();
}

function commit() {
  const s = JSON.stringify(doc);
  if (hist.stack[hist.idx] === s) return;
  hist.stack.length = hist.idx + 1;
  hist.stack.push(s);
  if (hist.stack.length > 200) hist.stack.shift();
  hist.idx = hist.stack.length - 1;
  updateUndoButtons();
  renderTimeline();
  updateEmpty();
  if (ui.mode !== 'sketch') renderScene();
  scheduleAutosave();
}

function updateUndoButtons() {
  $('#btnUndo').disabled = hist.idx <= 0;
  $('#btnRedo').disabled = hist.idx >= hist.stack.length - 1;
}

function restore(idx) {
  if (ui.mode === 'extrude') cancelExtrude();
  hist.idx = idx;
  doc = JSON.parse(hist.stack[idx]);
  $('#projName').value = doc.name;
  if (ui.mode === 'sketch') {
    const sk = getFeature(ui.sketchId);
    if (!sk) exitSketch();
    else {
      sketch2d.sketch = sk; sketch2d.selId = null; sketch2d.draft = null;
      sketch2d._updateDyn(); sketch2d.render(); renderSketchPanel();
    }
  }
  ui.sel = ui.sel && getFeature(ui.sel) ? ui.sel : null;
  updateUndoButtons(); renderTimeline(); updateEmpty(); renderScene(); scheduleAutosave();
}
const undo = () => { if (hist.idx > 0) restore(hist.idx - 1); };
const redo = () => { if (hist.idx < hist.stack.length - 1) restore(hist.idx + 1); };

// ---------- režimy ----------
const glCanvas = $('#gl'), cvCanvas = $('#cv2d'), hintEl = $('#hint'), props = $('#props');
props.addEventListener('click', (e) => { if (e.target.closest('h3')) props.classList.toggle('collapsed'); });

function setMode(m) {
  ui.mode = m;
  document.body.dataset.mode = m;
  glCanvas.hidden = m === 'sketch';
  cvCanvas.hidden = m !== 'sketch';
  if (m !== 'sketch') { hintEl.hidden = m !== 'extrude'; }
  if (m === 'extrude') hintEl.textContent = 'Klikněte na profil v zobrazení nebo ho vyberte v panelu a zadejte vzdálenost.';
  updateEmpty();
  if (viewer) viewer.resize();
  sketch2d.resize();
  renderProps();
  renderTimeline();
  renderScene();
}

function updateEmpty() {
  document.body.dataset.empty = String(doc.features.length === 0 && ui.mode === 'model');
}

// ---------- náčrt ----------
const sketch2d = new Sketch2D(cvCanvas, {
  commit: () => commit(),
  select: () => renderShapeProps(),
  hint: (t) => { hintEl.textContent = t; hintEl.hidden = !t; },
  dyn: (def, live) => updateDyn(def, live),
  status: (t, step) => { $('#stCoords').textContent = t; $('#stGrid').textContent = `Mřížka: ${fmtNum(step)} mm`; },
  newId: () => newId(),
  toolChanged: (t) => $$('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === t))),
});

function startSketch(planeKey) {
  const sk = { id: newId(), type: 'sketch', name: `Náčrt ${++doc.counters.sketch}`, plane: planeKey, visible: true, shapes: [] };
  doc.features.push(sk);
  commit();
  enterSketch(sk.id);
}

function enterSketch(id) {
  const sk = getFeature(id);
  if (!sk) return;
  ui.sketchId = id;
  ui.sel = id;
  setMode('sketch');
  sketch2d.attach(sk);
  renderSketchPanel();
  $('#stCoords').textContent = '';
  $('#stGrid').textContent = `Mřížka: ${fmtNum(sketch2d.gridStep())} mm`;
}

function exitSketch() {
  sketch2d.detach();
  ui.sketchId = null;
  hintEl.hidden = true;
  setMode('model');
  $('#stCoords').textContent = ''; $('#stGrid').textContent = '';
}

function finishSketch() {
  sketch2d.finishDraft(true);
  const sk = getFeature(ui.sketchId);
  const hadContent = doc.features.some((f) => f.type === 'extrude');
  if (sk && sk.shapes.length === 0) {
    doc.features = doc.features.filter((f) => f.id !== sk.id);
    commit();
    exitSketch();
    toast('Prázdný náčrt byl odstraněn.');
    return;
  }
  commit();
  exitSketch();
  if (!hadContent) { viewer && viewer.setView('iso'); fitScene(); }
}

// ---------- 3D scéna ----------
function sceneBounds(items) {
  let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const it of items) {
    if (it.id === 'preview' || String(it.id).startsWith('prof:')) continue;
    const p = it.pos;
    for (let i = 0; i < p.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[i + k]); max[k] = Math.max(max[k], p[i + k]); }
  }
  return min[0] === Infinity ? null : { min, max };
}
function fitScene() { if (viewer) viewer.fit(sceneBounds(lastItems)); }

function profilesOf(sk) {
  return sk.shapes.filter(isClosedShape);
}

function renderScene() {
  if (!viewer || ui.mode === 'sketch') return;
  const items = [];
  const byId = new Map(sketches().map((s) => [s.id, s]));
  const editing = ui.mode === 'extrude' && ui.ex ? ui.ex.editId : null;
  for (const f of doc.features) {
    if (f.type === 'extrude') {
      if (f.id === editing) continue;
      const b = extrudeBody(byId.get(f.sketchId), f);
      f.invalid = !b;
      if (b) items.push({ id: f.id, kind: 'mesh', pos: b.pos, nrm: b.nrm, edges: b.edges, color: BODY_COLORS[(f.color || 0) % BODY_COLORS.length] });
    } else if (f.visible && f.shapes.length) {
      const parts = f.shapes.map((s) => shapeLines3D(f.plane, s));
      const len = parts.reduce((a, p) => a + p.length, 0);
      const pos = new Float32Array(len);
      let o = 0;
      for (const p of parts) { pos.set(p, o); o += p.length; }
      items.push({ id: f.id, kind: 'lines', pos, color: [0.16, 0.45, 1.0], alpha: 1 });
    }
  }
  lastItems = items.slice();
  if (ui.mode === 'extrude' && ui.ex) {
    const ex = ui.ex;
    for (const sk of sketches()) for (const s of profilesOf(sk)) {
      const face = profileFace(sk, s);
      items.push({ id: `prof:${sk.id}:${s.id}`, kind: 'mesh', pos: face.pos, nrm: face.nrm, color: [0.2, 0.5, 1.0], alpha: 0.28 });
    }
    const sk = byId.get(ex.sketchId);
    const b = sk ? extrudeBody(sk, { shapeId: ex.shapeId, dist: ex.dist, sym: ex.sym }) : null;
    if (b) items.push({ id: 'preview', kind: 'mesh', pos: b.pos, nrm: b.nrm, color: [1.0, 0.62, 0.2], alpha: 0.62 });
    viewer.setHighlight(`prof:${ex.sketchId}:${ex.shapeId}`);
  } else {
    viewer.setHighlight(ui.sel);
  }
  viewer.setItems(items);
}

// ---------- časová osa ----------
function renderTimeline() {
  const ul = $('#timeline');
  ul.replaceChildren();
  $('#timelineEmpty').hidden = doc.features.length > 0;
  for (const f of doc.features) {
    const isSk = f.type === 'sketch';
    const li = h('li', { class: [ui.sel === f.id || ui.sketchId === f.id ? 'sel' : '', !isSk && f.invalid ? 'dim' : '', isSk && !f.visible ? 'dim' : ''].join(' ').trim() });
    li.append(isSk ? icon('i-sketchfeat', 'ic sm ico-sketch') : icon('i-cube', 'ic sm ico-body'));
    li.append(h('span', { class: 'name', text: f.name }));
    li.append(h('span', { class: 'meta', text: isSk ? `${PLANES[f.plane].axes.join('')}` : f.invalid ? '⚠ neplatný profil' : `${fmtNum(Math.abs(f.dist))} mm` }));
    if (isSk) {
      li.append(h('button', { class: 'mini', title: f.visible ? 'Skrýt náčrt' : 'Zobrazit náčrt', 'aria-label': 'Zobrazit / skrýt', onclick: (e) => { e.stopPropagation(); f.visible = !f.visible; commit(); } }, icon(f.visible ? 'i-eye' : 'i-eyeoff')));
    }
    li.append(h('button', { class: 'mini', title: 'Upravit', 'aria-label': 'Upravit', onclick: (e) => { e.stopPropagation(); editFeature(f.id); } }, icon('i-pencil')));
    li.append(h('button', { class: 'mini danger', title: 'Smazat', 'aria-label': 'Smazat', onclick: (e) => { e.stopPropagation(); deleteFeature(f.id); } }, icon('i-trash')));
    li.addEventListener('click', () => {
      if (ui.mode === 'sketch') return;
      ui.sel = f.id; renderTimeline(); if (viewer && ui.mode === 'model') viewer.setHighlight(f.id);
      document.body.classList.remove('browser-open');
    });
    li.addEventListener('dblclick', () => editFeature(f.id));
    ul.append(li);
  }
}

function editFeature(id) {
  if (ui.mode === 'sketch') return;
  if (ui.mode === 'extrude') cancelExtrude();
  const f = getFeature(id);
  if (!f) return;
  document.body.classList.remove('browser-open');
  if (f.type === 'sketch') enterSketch(id); else startExtrude(id);
}

function deleteFeature(id) {
  if (ui.mode === 'sketch') return;
  if (ui.mode === 'extrude') cancelExtrude();
  const f = getFeature(id);
  if (!f) return;
  let remove = [id];
  if (f.type === 'sketch') {
    const dep = doc.features.filter((x) => x.type === 'extrude' && x.sketchId === id);
    if (dep.length && !confirm(`Smazáním náčrtu „${f.name}“ se smaže i ${dep.length} navázané vytažení. Pokračovat?`)) return;
    remove = remove.concat(dep.map((x) => x.id));
  }
  doc.features = doc.features.filter((x) => !remove.includes(x.id));
  if (remove.includes(ui.sel)) ui.sel = null;
  commit();
  toast(`Smazáno: ${f.name}`);
}

// ---------- vytažení ----------
function startExtrude(editId = null) {
  const profs = [];
  for (const sk of sketches()) for (const s of profilesOf(sk)) profs.push({ sk, s });
  if (!profs.length) { toast('Nejdřív nakreslete uzavřený tvar: obdélník, kružnici nebo uzavřenou křivku.', 4500); return; }
  let ex;
  if (editId) {
    const f = getFeature(editId);
    ex = { editId, sketchId: f.sketchId, shapeId: f.shapeId, dist: f.dist, sym: !!f.sym };
  } else {
    const preferred = profs.filter((p) => p.sk.id === ui.sel);
    const pick = (preferred.length ? preferred : profs)[(preferred.length ? preferred : profs).length - 1];
    ex = { editId: null, sketchId: pick.sk.id, shapeId: pick.s.id, dist: 10, sym: false };
  }
  ui.ex = ex;
  setMode('extrude');
}

function cancelExtrude() {
  ui.ex = null;
  if (ui.mode === 'extrude') setMode('model');
}

function applyExtrude() {
  const ex = ui.ex;
  if (!ex || !(Math.abs(ex.dist) > 1e-6)) return;
  const sk = getFeature(ex.sketchId);
  if (!sk || !sk.shapes.find((s) => s.id === ex.shapeId)) return;
  const first = !doc.features.some((f) => f.type === 'extrude');
  if (ex.editId) {
    Object.assign(getFeature(ex.editId), { sketchId: ex.sketchId, shapeId: ex.shapeId, dist: ex.dist, sym: ex.sym });
  } else {
    const n = ++doc.counters.extrude;
    doc.features.push({ id: newId(), type: 'extrude', name: `Vytažení ${n}`, sketchId: ex.sketchId, shapeId: ex.shapeId, dist: ex.dist, sym: ex.sym, color: n - 1 });
    sk.visible = false;
  }
  ui.ex = null;
  commit();
  setMode('model');
  if (first) { viewer.setView('iso'); fitScene(); }
}

function profileLabel(sk, s) {
  let dim = '';
  if (s.t === 'rect') dim = `${fmtNum(Math.abs(s.x2 - s.x1))} × ${fmtNum(Math.abs(s.y2 - s.y1))}`;
  else if (s.t === 'circle') dim = `⌀ ${fmtNum(s.r * 2)}`;
  return { title: `${sk.name} · ${describeShape(s)}`, dim };
}

function pickProfileAt(clientX, clientY) {
  const { o, d } = viewer.ray(clientX, clientY);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  let best = null;
  for (const sk of sketches()) {
    const P = PLANES[sk.plane];
    const dn = dot(d, P.n);
    if (Math.abs(dn) < 1e-9) continue;
    const t = -dot(o, P.n) / dn;
    if (t <= 0) continue;
    const X = [o[0] + t * d[0], o[1] + t * d[1], o[2] + t * d[2]];
    const uv = [dot(X, P.u), dot(X, P.v)];
    for (const s of profilesOf(sk)) {
      if (!pointInPolygon(uv, shapePolygon(s))) continue;
      if (findHoles(sk.shapes, s).some((hole) => pointInPolygon(uv, shapePolygon(hole)))) continue;
      if (!best || t < best.t) best = { t, sk, s };
    }
  }
  return best;
}

// ---------- panel vlastností ----------
let dynSec = null, shapeSec = null, dynSig = '', dynInputs = [];

function renderProps() {
  props.replaceChildren();
  dynSig = ''; dynInputs = []; dynSec = shapeSec = null;
  if (ui.mode === 'sketch') { props.hidden = true; renderSketchPanel(); }
  else if (ui.mode === 'extrude') { props.hidden = false; renderExtrudePanel(); }
  else props.hidden = true;
}

function numField(label, value, onCommit, unit = 'mm') {
  const input = h('input', { type: 'text', inputmode: 'decimal', value: fmtNum(value), autocomplete: 'off', spellcheck: 'false', 'aria-label': label });
  const row = h('div', { class: 'frow' }, h('label', { text: label }), h('div', { class: 'field' }, input, unit ? h('span', { class: 'unit', text: unit }) : null));
  input.addEventListener('focus', () => input.select());
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); e.stopPropagation(); });
  input.addEventListener('change', () => {
    const n = parseNum(input.value);
    if (n === null) { input.value = fmtNum(value); return; }
    onCommit(n);
  });
  return { row, input };
}

function renderSketchPanel() {
  const sk = getFeature(ui.sketchId);
  props.replaceChildren();
  if (!sk) { props.hidden = true; return; }
  dynSec = h('div', { class: 'psec', hidden: true });
  shapeSec = h('div', { class: 'psec', hidden: true });
  props.append(
    h('h3', {}, h('span', { text: sk.name }), h('small', { text: PLANES[sk.plane].name })),
    h('div', { class: 'pbody' }, dynSec, shapeSec),
  );
  dynSig = ''; dynInputs = [];
  renderShapeProps();
  sketch2d._updateDyn();
}

function refreshPanelVisibility() {
  if (ui.mode !== 'sketch') return;
  props.hidden = !(dynSig || (shapeSec && !shapeSec.hidden));
}

function updateDyn(def, live) {
  if (!dynSec || ui.mode !== 'sketch') return;
  if (!def) {
    if (dynSig) { dynSec.replaceChildren(); dynSec.hidden = true; dynSig = ''; dynInputs = []; }
    refreshPanelVisibility();
    return;
  }
  const sig = def.map((d) => d.key).join(',');
  if (sig !== dynSig) {
    dynSig = sig;
    dynSec.replaceChildren(h('div', { class: 'psec-title', text: 'Zadání rozměrů' }));
    dynInputs = def.map((d) => {
      const input = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', 'aria-label': d.label, 'data-key': d.key });
      input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); submitDyn(); }
        else if (e.key === 'Escape') { input.blur(); sketch2d.handleKey(e); }
      });
      dynSec.append(h('div', { class: 'frow' }, h('label', { text: d.label }), h('div', { class: 'field' }, input, h('span', { class: 'unit', text: d.unit }))));
      return input;
    });
    dynSec.append(h('p', { class: 'note', text: 'Napište hodnotu a potvrďte klávesou Enter. Tab přepíná pole.' }));
    dynSec.hidden = false;
  }
  def.forEach((d, i) => { dynInputs[i].placeholder = live && live[d.key] !== undefined ? fmtNum(live[d.key]) : ''; });
  refreshPanelVisibility();
}

function submitDyn() {
  const vals = {};
  dynInputs.forEach((i) => { vals[i.dataset.key] = i.value; });
  const keep = dynSig;
  if (!sketch2d.applyDyn(vals)) { toast('Zadejte kladnou hodnotu.'); return; }
  if (dynSig === keep && dynInputs.length) { dynInputs.forEach((i) => { i.value = ''; }); dynInputs[0].focus(); }
}

function renderShapeProps() {
  if (!shapeSec || ui.mode !== 'sketch') return;
  const s = sketch2d.selected;
  shapeSec.replaceChildren();
  if (!s) { shapeSec.hidden = true; refreshPanelVisibility(); return; }
  shapeSec.hidden = false;
  shapeSec.append(h('div', { class: 'psec-title', text: `Vybráno: ${describeShape(s)}` }));
  const fields = [];
  const apply = (fn) => { fn(); sketch2d.render(); commit(); sync(); };
  const add = (label, get, set, unit) => {
    const f = numField(label, get(), (n) => apply(() => set(n)), unit);
    fields.push({ input: f.input, get });
    shapeSec.append(f.row);
  };
  const sync = () => fields.forEach((f) => { if (document.activeElement !== f.input) f.input.value = fmtNum(f.get()); });
  if (s.t === 'rect') {
    add('Poloha X', () => Math.min(s.x1, s.x2), (n) => { const w = Math.abs(s.x2 - s.x1); s.x1 = n; s.x2 = n + w; });
    add('Poloha Y', () => Math.min(s.y1, s.y2), (n) => { const w = Math.abs(s.y2 - s.y1); s.y1 = n; s.y2 = n + w; });
    add('Šířka', () => Math.abs(s.x2 - s.x1), (n) => { const x = Math.min(s.x1, s.x2); if (Math.abs(n) > 1e-6) { s.x1 = x; s.x2 = x + Math.abs(n); } });
    add('Výška', () => Math.abs(s.y2 - s.y1), (n) => { const y = Math.min(s.y1, s.y2); if (Math.abs(n) > 1e-6) { s.y1 = y; s.y2 = y + Math.abs(n); } });
  } else if (s.t === 'circle') {
    add('Střed X', () => s.cx, (n) => { s.cx = n; });
    add('Střed Y', () => s.cy, (n) => { s.cy = n; });
    add('Průměr ⌀', () => s.r * 2, (n) => { if (Math.abs(n) > 1e-6) s.r = Math.abs(n) / 2; });
  } else {
    const box = h('div', { class: 'verts' });
    s.pts.forEach((p, i) => {
      const fx = numField('X', p[0], (n) => apply(() => { p[0] = n; }), '');
      const fy = numField('Y', p[1], (n) => apply(() => { p[1] = n; }), '');
      fields.push({ input: fx.input, get: () => p[0] }, { input: fy.input, get: () => p[1] });
      const row = h('div', { class: 'vrow' }, h('span', { text: String(i + 1) }), h('div', { class: 'field' }, fx.input), h('div', { class: 'field' }, fy.input));
      box.append(row);
    });
    shapeSec.append(h('div', { class: 'psec-title', text: s.closed ? 'Vrcholy (uzavřená křivka)' : 'Vrcholy (otevřená čára – nelze vytáhnout)' }), box);
  }
  if (!isClosedShape(s)) shapeSec.append(h('p', { class: 'warn', text: 'Tvar není uzavřený, proto ho nelze vytáhnout do 3D.' }));
  shapeSec.append(h('div', { class: 'btn-row' }, h('button', { class: 'btn', onclick: () => sketch2d.deleteSelected() }, 'Smazat tvar')));
  refreshPanelVisibility();
}

function renderExtrudePanel() {
  const ex = ui.ex;
  props.replaceChildren();
  if (!ex) return;
  const body = h('div', { class: 'pbody' });
  const profSec = h('div', { class: 'psec' }, h('div', { class: 'psec-title', text: 'Profil' }));
  const list = h('div', { class: 'plist' });
  for (const sk of sketches()) for (const s of profilesOf(sk)) {
    const { title, dim } = profileLabel(sk, s);
    const on = sk.id === ex.sketchId && s.id === ex.shapeId;
    list.append(h('button', { class: 'pitem' + (on ? ' on' : ''), onclick: () => { ex.sketchId = sk.id; ex.shapeId = s.id; renderExtrudePanel(); renderScene(); } }, h('span', { text: title }), h('small', { text: dim })));
  }
  profSec.append(list);
  const distSec = h('div', { class: 'psec' }, h('div', { class: 'psec-title', text: 'Rozměr' }));
  const f = numField('Vzdálenost', ex.dist, (n) => { if (Math.abs(n) > 1e-6) { ex.dist = n; } renderExtrudePanel(); renderScene(); });
  const sym = h('input', { type: 'checkbox' });
  sym.checked = ex.sym;
  sym.addEventListener('change', () => { ex.sym = sym.checked; renderScene(); });
  distSec.append(
    f.row,
    h('label', { class: 'chk' }, sym, 'Symetricky na obě strany'),
    h('div', { class: 'btn-row' }, h('button', { class: 'btn', onclick: () => { ex.dist = -ex.dist; renderExtrudePanel(); renderScene(); } }, 'Obrátit směr')),
  );
  const ok = h('button', { class: 'btn primary', onclick: applyExtrude }, h('span', { text: 'OK' }));
  const valid = Math.abs(ex.dist) > 1e-6;
  ok.disabled = !valid;
  const actions = h('div', { class: 'btn-row sticky' }, h('button', { class: 'btn', onclick: cancelExtrude }, 'Zrušit'), ok);
  body.append(profSec, distSec, h('p', { class: 'note', text: 'Tvary uvnitř vybraného profilu se stanou otvory. Tělesa se v této verzi zatím neslučují.' }), actions);
  props.append(h('h3', {}, h('span', { text: ex.editId ? 'Upravit vytažení' : 'Vytažení' })), body);
}

// ---------- soubory ----------
function download(blob, name) {
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

function saveProject() {
  doc.app = LABEL;
  const name = fileName(doc.name, APP, 'skica');
  download(new Blob([JSON.stringify(doc, null, 1)], { type: 'application/json' }), name);
  toast(`Projekt uložen: ${name}`);
}

function loadDoc(obj) {
  if (!obj || !Array.isArray(obj.features)) throw new Error('Soubor není projekt SkicaCAD.');
  const d = { ...newDoc(), ...obj };
  d.counters = { sketch: 0, extrude: 0, ...(obj.counters || {}) };
  let maxId = 0;
  for (const f of d.features) {
    if (!f || (f.type !== 'sketch' && f.type !== 'extrude') || !Number.isFinite(f.id)) throw new Error('Projekt obsahuje neplatný prvek.');
    maxId = Math.max(maxId, f.id);
    if (f.type === 'sketch') {
      if (!PLANES[f.plane] || !Array.isArray(f.shapes)) throw new Error('Projekt obsahuje neplatný náčrt.');
      f.visible = f.visible !== false;
      for (const s of f.shapes) maxId = Math.max(maxId, Number.isFinite(s.id) ? s.id : 0);
    }
  }
  d.nextId = Math.max(Number.isFinite(obj.nextId) ? obj.nextId : 0, maxId + 1);
  d.name = String(d.name || 'Bez názvu').slice(0, 60);
  return d;
}

function adoptDoc(d, fitView = true) {
  if (ui.mode === 'sketch') exitSketch();
  if (ui.mode === 'extrude') cancelExtrude();
  doc = d;
  ui.sel = null;
  $('#projName').value = doc.name;
  resetHistory();
  renderTimeline(); updateEmpty(); renderScene();
  if (fitView) { viewer && viewer.setView('iso'); fitScene(); }
  scheduleAutosave();
}

function newProject() {
  if (doc.features.length && !confirm('Začít nový projekt? Neuložené změny aktuálního projektu budou ztraceny.')) return;
  adoptDoc(newDoc(), false);
}

async function openProjectFile(file) {
  try {
    adoptDoc(loadDoc(JSON.parse(await file.text())));
    toast(`Otevřeno: ${file.name}`);
  } catch (e) {
    toast(`Soubor se nepodařilo otevřít: ${e.message}`, 5000);
  }
}

function currentSketchForExport() {
  const id = ui.sketchId || (getFeature(ui.sel) && getFeature(ui.sel).type === 'sketch' ? ui.sel : null);
  const sk = id ? getFeature(id) : sketches().slice(-1)[0];
  return sk || null;
}

function doExport(kind) {
  if (kind === 'stl') {
    const byId = new Map(sketches().map((s) => [s.id, s]));
    const arrays = [];
    for (const f of doc.features) if (f.type === 'extrude') { const b = extrudeBody(byId.get(f.sketchId), f); if (b) arrays.push(b.pos); }
    if (!arrays.length) { toast('Není co exportovat: nejdřív vytáhněte náčrt do 3D (tlačítko Vytáhnout).', 4500); return; }
    const name = fileName(doc.name, APP, 'stl');
    download(new Blob([buildSTL(arrays, LABEL)], { type: 'model/stl' }), name);
    toast(`Exportováno: ${name}`);
    return;
  }
  const sk = currentSketchForExport();
  if (!sk || !sk.shapes.length) { toast('Není co exportovat: nejdřív nakreslete náčrt.', 4000); return; }
  if (kind === 'svg') { const n = fileName(`${doc.name}_${sk.name}`, APP, 'svg'); download(new Blob([buildSVG(sk, LABEL)], { type: 'image/svg+xml' }), n); toast(`Exportováno: ${n}`); }
  if (kind === 'dxf') { const n = fileName(`${doc.name}_${sk.name}`, APP, 'dxf'); download(new Blob([buildDXF(sk, LABEL)], { type: 'application/dxf' }), n); toast(`Exportováno: ${n}`); }
}

// ---------- téma ----------
function applyTheme() {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  if (viewer) viewer.setTheme(dark
    ? { grid: [0.75, 0.8, 0.9, 0.22], gridMajor: [0.75, 0.8, 0.9, 0.45] }
    : { grid: [0.3, 0.38, 0.5, 0.34], gridMajor: [0.25, 0.33, 0.45, 0.62] });
  sketch2d.setTheme(dark
    ? { bg: '#1a232f', grid: 'rgba(180,195,220,0.10)', gridMajor: 'rgba(180,195,220,0.22)', stroke: '#e6edf6', fill: 'rgba(77,146,255,0.16)', accent: '#5aa0ff', text: '#e6edf6' }
    : { bg: '#f4f6f9', grid: 'rgba(120,130,150,0.18)', gridMajor: 'rgba(120,130,150,0.36)', stroke: '#1d2733', fill: 'rgba(60,120,220,0.10)', accent: '#2f7bff', text: '#27323f' });
}

// ---------- spuštění ----------
function init() {
  document.title = LABEL;
  $('#brandBadge').textContent = `${APP.stage} ${APP.version}`;
  $('#splashBadge').textContent = `${APP.stage} ${APP.version}`;
  $('#stVersion').textContent = LABEL;
  $('#aboutTitle').textContent = APP.name;
  $('#aboutVer').textContent = `${APP.stage} · verze ${APP.version}`;

  try {
    viewer = new Viewer(glCanvas, {
      onClick: (x, y) => {
        if (ui.mode !== 'extrude' || !ui.ex) return;
        const hit = pickProfileAt(x, y);
        if (hit) { ui.ex.sketchId = hit.sk.id; ui.ex.shapeId = hit.s.id; renderExtrudePanel(); renderScene(); }
      },
    });
  } catch (e) {
    const n = $('#nogl');
    n.hidden = false;
    n.replaceChildren(h('div', {}, h('h2', { text: '3D zobrazení není dostupné' }), h('p', { text: 'Tento prohlížeč nebo zařízení nepodporuje WebGL. Náčrty fungují, 3D zobrazení ne.' })));
  }
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

  // obnovení posledního projektu
  let restored = false;
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (raw) { const d = loadDoc(JSON.parse(raw).doc); if (d.features.length) { doc = d; restored = true; } }
  } catch (e) { /* poškozená data ignorujeme */ }
  $('#projName').value = doc.name;
  resetHistory();
  setMode('model');
  if (restored) { viewer && viewer.setView('iso'); fitScene(); toast('Obnoven naposledy otevřený projekt.'); }

  // topbar
  $('#projName').addEventListener('input', (e) => { doc.name = e.target.value.slice(0, 60); scheduleAutosave(); });
  $('#projName').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); });
  $('#btnNew').addEventListener('click', newProject);
  $('#btnOpen').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) openProjectFile(f); });
  $('#btnSave').addEventListener('click', saveProject);
  const closeDrawer = () => document.body.classList.remove('browser-open');
  $('#mbNew').addEventListener('click', () => { closeDrawer(); newProject(); });
  $('#mbOpen').addEventListener('click', () => { closeDrawer(); $('#fileInput').click(); });
  $('#mbSave').addEventListener('click', () => { closeDrawer(); saveProject(); });
  $('#mbStl').addEventListener('click', () => { closeDrawer(); doExport('stl'); });
  $('#btnUndo').addEventListener('click', undo);
  $('#btnRedo').addEventListener('click', redo);
  $('#btnAbout').addEventListener('click', () => $('#aboutDlg').showModal());
  const menu = $('#menuExport'), mbtn = $('#btnExport');
  const closeMenu = () => { menu.hidden = true; mbtn.setAttribute('aria-expanded', 'false'); };
  mbtn.addEventListener('click', (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; mbtn.setAttribute('aria-expanded', String(!menu.hidden)); });
  menu.addEventListener('click', (e) => { const b = e.target.closest('[data-export]'); if (b) { closeMenu(); doExport(b.dataset.export); } });
  document.addEventListener('click', closeMenu);
  $('#btnBrowser').addEventListener('click', () => document.body.classList.toggle('browser-open'));
  $('#btnBrowserClose').addEventListener('click', () => document.body.classList.remove('browser-open'));

  // pás nástrojů
  const askPlane = () => {
    const dlg = $('#planeDlg');
    dlg.returnValue = '';
    dlg.addEventListener('close', () => { if (dlg.returnValue && PLANES[dlg.returnValue]) startSketch(dlg.returnValue); }, { once: true });
    dlg.showModal();
  };
  $('#btnNewSketch').addEventListener('click', askPlane);
  $('#btnSplashSketch').addEventListener('click', askPlane);
  $('#btnExtrude').addEventListener('click', () => startExtrude());
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => viewer && viewer.setView(b.dataset.view)));
  $('#btnFit3d').addEventListener('click', fitScene);
  $('#btnGrid3d').addEventListener('click', (e) => { const b = e.currentTarget; const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); viewer && viewer.setGridVisible(on); });
  $$('[data-tool]').forEach((b) => b.addEventListener('click', () => sketch2d.setTool(b.dataset.tool)));
  $('#btnDelShape').addEventListener('click', () => { if (!sketch2d.deleteSelected()) toast('Nejdřív vyberte tvar.'); });
  $('#btnFit2d').addEventListener('click', () => sketch2d.fit());
  $('#btnSnap').addEventListener('click', (e) => { const b = e.currentTarget; const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); sketch2d.snapOn = on; });
  $('#btnFinishSketch').addEventListener('click', finishSketch);

  // klávesy
  window.addEventListener('keydown', (e) => {
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveProject(); return; }
    if (typing || $('dialog[open]')) return;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (ui.mode === 'sketch') {
      if (dynInputs.length && /^[0-9.,\-]$/.test(e.key) && !mod) { dynInputs[0].focus(); return; }
      if (sketch2d.handleKey(e)) e.preventDefault();
    } else if (ui.mode === 'extrude') {
      if (e.key === 'Escape') cancelExtrude();
      else if (e.key === 'Enter') applyExtrude();
    }
  });

  const ro = new ResizeObserver(() => { viewer && viewer.resize(); sketch2d.resize(); });
  [$('#stage'), glCanvas, cvCanvas].forEach((n) => ro.observe(n));

  // PWA
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; $('#btnInstall').hidden = false; });
  $('#btnInstall').addEventListener('click', async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#btnInstall').hidden = true; });
  window.addEventListener('appinstalled', () => { $('#btnInstall').hidden = true; toast('SkicaCAD je nainstalovaný.'); });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      const hadController = !!navigator.serviceWorker.controller;
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (nw) nw.addEventListener('statechange', () => { if (nw.state === 'installed' && hadController) toast('Je k dispozici nová verze. Zavřete a znovu otevřete aplikaci.', 6000); });
      });
    }).catch(() => {});
    navigator.serviceWorker.ready.then(() => { $('#stOffline').hidden = false; });
  }

  // ladicí rozhraní pro automatické testy
  self.__skica = { get doc() { return doc; }, ui, sketch2d, get viewer() { return viewer; }, commit, undo, redo, startSketch, finishSketch, startExtrude, applyExtrude, doExport, scene: () => lastItems };
}

init();
