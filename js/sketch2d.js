// SkicaCAD – 2D editor náčrtu (canvas). Nástroje: výběr, čára, obdélník, kružnice.
import { PLANES, shapePolygon, isClosedShape, hitShape, translateShape, shapeSnapPoints, shapeBounds } from './geometry.js';

const AXIS_COLOR = { X: '#e0453a', Y: '#3aa655', Z: '#3a6fe0' };
const niceSteps = [1, 2, 5];

const num = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const fmt = (n) => (Math.round(n * 100) / 100).toString().replace('.', ',');

export class Sketch2D {
  /**
   * hooks: { commit(label), select(shape|null), hint(text), dyn(def|null, live), status(text),
   *          newId(), toolChanged(tool) }
   */
  constructor(canvas, hooks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hooks = hooks;
    this.view = { cx: 0, cy: 0, s: 4 };
    this.sketch = null;
    this.tool = 'select';
    this.selId = null;
    this.draft = null;
    this.cursor = null;
    this.snapInfo = null;
    this.snapOn = true;
    this.live = {};
    this.theme = {
      bg: '#f4f6f9', grid: 'rgba(120,130,150,0.18)', gridMajor: 'rgba(120,130,150,0.36)',
      stroke: '#1d2733', fill: 'rgba(60,120,220,0.10)', accent: '#2f7bff', sel: '#ff8a00', text: '#27323f',
    };
    this._bind();
  }

  setTheme(t) { this.theme = { ...this.theme, ...t }; this.render(); }

  // ---------- připojení / nástroje ----------
  attach(sketch) {
    this.sketch = sketch;
    this.selId = null;
    this.draft = null;
    this.setTool('select');
    this.resize();
    this.fit();
  }

  detach() {
    this.sketch = null; this.draft = null; this.selId = null;
    this.hooks.dyn(null);
  }

  get shapes() { return this.sketch ? this.sketch.shapes : []; }
  get selected() { return this.shapes.find((s) => s.id === this.selId) || null; }

  setTool(t) {
    this.finishDraft(true);
    this.tool = t;
    this.draft = null;
    this.hooks.toolChanged && this.hooks.toolChanged(t);
    this._updateHint();
    this._updateDyn();
    this.render();
  }

  select(id) {
    this.selId = id;
    this.hooks.select(this.selected);
    this.render();
  }

  deleteSelected() {
    if (!this.selId) return false;
    const i = this.shapes.findIndex((s) => s.id === this.selId);
    if (i < 0) return false;
    this.shapes.splice(i, 1);
    this.selId = null;
    this.hooks.select(null);
    this.hooks.commit('Smazat tvar');
    this.render();
    return true;
  }

  // ---------- zobrazení ----------
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    this.dpr = dpr;
    this.render();
  }

  fit() {
    const W = this.canvas.clientWidth || 600, H = this.canvas.clientHeight || 400;
    const b = shapeBounds(this.shapes);
    if (!b) { this.view = { cx: 0, cy: 0, s: Math.min(W, H) / 120 }; }
    else {
      const w = Math.max(b.x2 - b.x1, 5), h = Math.max(b.y2 - b.y1, 5);
      this.view = { cx: (b.x1 + b.x2) / 2, cy: (b.y1 + b.y2) / 2, s: Math.min(W / (w * 1.4), H / (h * 1.4)) };
    }
    this.render();
  }

  w2s(x, y) {
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight, v = this.view;
    return [W / 2 + (x - v.cx) * v.s, H / 2 - (y - v.cy) * v.s];
  }
  s2w(px, py) {
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight, v = this.view;
    return [v.cx + (px - W / 2) / v.s, v.cy - (py - H / 2) / v.s];
  }

  gridStep() {
    let k = Math.pow(10, Math.floor(Math.log10(10 / this.view.s)) - 1);
    for (let guard = 0; guard < 40; guard++) {
      for (const m of niceSteps) if (k * m * this.view.s >= 10) return k * m;
      k *= 10;
    }
    return k;
  }

  // ---------- přichytávání ----------
  snap(raw, ignoreShapeId = null) {
    const tolPx = 10, v = this.view;
    let best = null, bd = tolPx / v.s;
    const consider = (p, kind) => {
      const d = Math.hypot(p[0] - raw[0], p[1] - raw[1]);
      if (d < bd) { bd = d; best = { p: [p[0], p[1]], kind }; }
    };
    consider([0, 0], 'origin');
    for (const s of this.shapes) {
      if (s.id === ignoreShapeId) continue;
      for (const p of shapeSnapPoints(s)) consider(p, 'point');
    }
    if (this.draft && this.draft.pts) for (const p of this.draft.pts) consider(p, 'point');
    if (best) return best;
    if (this.snapOn) {
      const g = this.gridStep();
      return { p: [Math.round(raw[0] / g) * g, Math.round(raw[1] / g) * g], kind: 'grid' };
    }
    return { p: raw, kind: 'free' };
  }

  // ---------- vstup ----------
  _bind() {
    const c = this.canvas;
    c.style.touchAction = 'none';
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    const ptrs = new Map();
    let down = null, gesture = null, drag = null;
    const pos = (e) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

    c.addEventListener('pointerdown', (e) => {
      if (!this.sketch) return;
      c.setPointerCapture(e.pointerId);
      const p = pos(e);
      ptrs.set(e.pointerId, { x: p[0], y: p[1] });
      if (ptrs.size === 1) {
        down = { x: p[0], y: p[1], button: e.button, moved: 0, panning: e.button === 1 };
        drag = null;
        if (e.button === 0 && this.tool === 'select') {
          const w = this.s2w(p[0], p[1]);
          const hit = this._hitAt(w);
          if (hit) {
            this.select(hit.id);
            drag = { id: hit.id, orig: JSON.parse(JSON.stringify(hit)), start: w, active: false };
          } else if (this.selId) this.select(null);
        }
      } else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        gesture = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        if (down) down.moved = 99;
        drag = null;
      }
    });

    c.addEventListener('pointermove', (e) => {
      if (!this.sketch) return;
      const p = pos(e);
      const rec = ptrs.get(e.pointerId);
      const raw = this.s2w(p[0], p[1]);
      if (!rec) { this._hover(raw); return; }
      const dx = p[0] - rec.x, dy = p[1] - rec.y;
      rec.x = p[0]; rec.y = p[1];
      if (ptrs.size >= 2 && gesture) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        if (gesture.d > 0 && d > 0) this._zoomAt(mx, my, d / gesture.d);
        this.view.cx -= (mx - gesture.mx) / this.view.s;
        this.view.cy += (my - gesture.my) / this.view.s;
        gesture = { d, mx, my };
        this.render();
        return;
      }
      if (!down) return;
      down.moved += Math.abs(dx) + Math.abs(dy);
      if (drag && down.moved > 5) {
        drag.active = true;
        const w = this.s2w(p[0], p[1]);
        let ddx = w[0] - drag.start[0], ddy = w[1] - drag.start[1];
        if (this.snapOn) { const g = this.gridStep(); ddx = Math.round(ddx / g) * g; ddy = Math.round(ddy / g) * g; }
        const moved = translateShape(drag.orig, ddx, ddy);
        const i = this.shapes.findIndex((s) => s.id === drag.id);
        if (i >= 0) this.shapes[i] = moved;
        this.render();
      } else if (down.moved > 5 && !drag) {
        this.view.cx -= dx / this.view.s;
        this.view.cy += dy / this.view.s;
        this.render();
      }
      if (!drag) this._hover(raw);
    });

    const end = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      const p = pos(e);
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) gesture = null;
      if (ptrs.size === 0 && down) {
        if (drag && drag.active) {
          this.hooks.select(this.selected);
          this.hooks.commit('Přesunout tvar');
        } else if (down.moved < 6) {
          if (down.button === 0) this._click(this.s2w(p[0], p[1]));
          else if (down.button === 2) this.finishDraft();
        }
        down = null; drag = null;
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('dblclick', () => { if (this.tool === 'line') this.finishDraft(); });
    c.addEventListener('wheel', (e) => {
      if (!this.sketch) return;
      e.preventDefault();
      const r = c.getBoundingClientRect();
      this._zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
      this.render();
    }, { passive: false });
  }

  _zoomAt(px, py, k) {
    const before = this.s2w(px, py);
    this.view.s = Math.min(2000, Math.max(0.05, this.view.s * k));
    const after = this.s2w(px, py);
    this.view.cx += before[0] - after[0];
    this.view.cy += before[1] - after[1];
  }

  _hitAt(w) {
    const tol = 8 / this.view.s;
    for (let i = this.shapes.length - 1; i >= 0; i--) if (hitShape(this.shapes[i], w, tol)) return this.shapes[i];
    return null;
  }

  _hover(raw) {
    const sn = this.tool === 'select' ? { p: raw, kind: 'free' } : this.snap(raw);
    this.cursor = sn.p;
    this.snapInfo = sn;
    const ax = this.sketch ? PLANES[this.sketch.plane].axes : ['X', 'Y'];
    this.hooks.status(`${ax[0]}: ${fmt(sn.p[0])}   ${ax[1]}: ${fmt(sn.p[1])} mm`, this.gridStep());
    this._updateDyn();
    this.render();
  }

  // ---------- kreslení ----------
  _click(raw) {
    const sn = this.snap(raw);
    const p = sn.p;
    this.cursor = p;
    if (this.tool === 'select') { this.render(); return; }
    if (this.tool === 'line') {
      if (!this.draft) { this.draft = { t: 'poly', pts: [p] }; }
      else {
        const pts = this.draft.pts;
        const first = pts[0], last = pts[pts.length - 1];
        const closeTol = 10 / this.view.s;
        if (pts.length >= 3 && Math.hypot(p[0] - first[0], p[1] - first[1]) < closeTol) {
          this._addShape({ t: 'poly', pts: pts.map((q) => [q[0], q[1]]), closed: true }, 'Nakreslit křivku');
          this.draft = null;
        } else if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 1e-9) pts.push(p);
      }
    } else if (this.tool === 'rect') {
      if (!this.draft) this.draft = { t: 'rect', a: p };
      else {
        const a = this.draft.a;
        if (Math.abs(p[0] - a[0]) > 1e-9 && Math.abs(p[1] - a[1]) > 1e-9) {
          this._addShape({ t: 'rect', x1: a[0], y1: a[1], x2: p[0], y2: p[1] }, 'Nakreslit obdélník');
          this.draft = null;
        }
      }
    } else if (this.tool === 'circle') {
      if (!this.draft) this.draft = { t: 'circle', c: p };
      else {
        const r = Math.hypot(p[0] - this.draft.c[0], p[1] - this.draft.c[1]);
        if (r > 1e-9) {
          this._addShape({ t: 'circle', cx: this.draft.c[0], cy: this.draft.c[1], r }, 'Nakreslit kružnici');
          this.draft = null;
        }
      }
    }
    this._updateHint();
    this._updateDyn();
    this.render();
  }

  _addShape(shape, label) {
    shape.id = this.hooks.newId();
    this.sketch.shapes.push(shape);
    this.selId = shape.id;
    this.hooks.select(shape);
    this.hooks.commit(label);
  }

  // Dokončí rozpracovanou čáru (jako otevřenou lomenou čáru) nebo zruší rozpracovaný tvar
  finishDraft(silent = false) {
    const d = this.draft;
    if (!d) return false;
    if (d.t === 'poly' && d.pts.length >= 2) {
      this._addShape({ t: 'poly', pts: d.pts.map((q) => [q[0], q[1]]), closed: false }, 'Nakreslit čáru');
    }
    this.draft = null;
    if (!silent) { this._updateHint(); this._updateDyn(); this.render(); }
    return true;
  }

  cancelDraft() {
    if (!this.draft) return false;
    this.draft = null;
    this._updateHint(); this._updateDyn(); this.render();
    return true;
  }

  // Klávesy (volá app.js, když nepíšeme do pole)
  handleKey(e) {
    if (!this.sketch) return false;
    const k = e.key;
    if (k === 'Escape') {
      if (this.draft) {
        if (this.draft.t === 'poly' && this.draft.pts.length >= 2) this.finishDraft(); else this.cancelDraft();
      } else if (this.tool !== 'select') this.setTool('select');
      else if (this.selId) this.select(null);
      return true;
    }
    if (k === 'Enter') { if (this.draft && this.draft.t === 'poly') { this.finishDraft(); return true; } return false; }
    if (k === 'Delete' || k === 'Backspace') return this.deleteSelected();
    const map = { v: 'select', l: 'line', r: 'rect', c: 'circle' };
    if (!e.ctrlKey && !e.metaKey && !e.altKey && map[k.toLowerCase()]) { this.setTool(map[k.toLowerCase()]); return true; }
    return false;
  }

  // ---------- dynamické vstupy (přesné zadání rozměrů) ----------
  _computeLive() {
    const d = this.draft, c = this.cursor;
    if (!d || !c) return {};
    if (d.t === 'poly') {
      const last = d.pts[d.pts.length - 1];
      const dx = c[0] - last[0], dy = c[1] - last[1];
      return { len: Math.hypot(dx, dy), ang: ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360 };
    }
    if (d.t === 'rect') return { w: c[0] - d.a[0], h: c[1] - d.a[1] };
    return { d: 2 * Math.hypot(c[0] - d.c[0], c[1] - d.c[1]) };
  }

  _updateDyn() {
    const d = this.draft;
    if (!d) { this.hooks.dyn(null); this.live = {}; return; }
    this.live = this._computeLive();
    let def;
    if (d.t === 'poly') def = [{ key: 'len', label: 'Délka', unit: 'mm' }, { key: 'ang', label: 'Úhel', unit: '°' }];
    else if (d.t === 'rect') def = [{ key: 'w', label: 'Šířka', unit: 'mm' }, { key: 'h', label: 'Výška', unit: 'mm' }];
    else def = [{ key: 'd', label: 'Průměr ⌀', unit: 'mm' }];
    this.hooks.dyn(def, this.live);
  }

  applyDyn(vals) {
    const d = this.draft;
    if (!d) return false;
    const live = this._computeLive();
    if (d.t === 'poly') {
      const last = d.pts[d.pts.length - 1];
      const len = num(vals.len) ?? live.len;
      const ang = num(vals.ang) ?? live.ang;
      if (!(len > 0)) return false;
      const a = (ang * Math.PI) / 180;
      const r6 = (n) => Math.round(n * 1e6) / 1e6;
      d.pts.push([r6(last[0] + len * Math.cos(a)), r6(last[1] + len * Math.sin(a))]);
    } else if (d.t === 'rect') {
      const tw = num(vals.w), th = num(vals.h);
      const sw = live.w < 0 ? -1 : 1, sh = live.h < 0 ? -1 : 1;
      const w = tw !== null ? Math.abs(tw) * sw : live.w;
      const h = th !== null ? Math.abs(th) * sh : live.h;
      if (!(Math.abs(w) > 1e-9 && Math.abs(h) > 1e-9)) return false;
      this._addShape({ t: 'rect', x1: d.a[0], y1: d.a[1], x2: d.a[0] + w, y2: d.a[1] + h }, 'Nakreslit obdélník');
      this.draft = null;
    } else {
      const dia = num(vals.d) ?? live.d;
      if (!(dia > 1e-9)) return false;
      this._addShape({ t: 'circle', cx: d.c[0], cy: d.c[1], r: Math.abs(dia) / 2 }, 'Nakreslit kružnici');
      this.draft = null;
    }
    this._updateHint(); this._updateDyn(); this.render();
    return true;
  }

  _updateHint() {
    const d = this.draft;
    let t = '';
    if (this.tool === 'select') t = 'Klikněte na tvar pro výběr, tažením ho přesunete. Tažení v prázdném místě posouvá pohled, kolečko přibližuje.';
    else if (this.tool === 'line') t = d ? 'Další bod: klik, nebo zadejte délku a úhel + Enter. Klik na první bod uzavře křivku. Dvojklik / Enter / pravé tlačítko ukončí čáru.' : 'Čára: klikněte na první bod.';
    else if (this.tool === 'rect') t = d ? 'Klikněte na protější roh, nebo zadejte šířku a výšku + Enter.' : 'Obdélník: klikněte na první roh.';
    else if (this.tool === 'circle') t = d ? 'Klikněte pro určení poloměru, nebo zadejte průměr + Enter.' : 'Kružnice: klikněte na střed.';
    this.hooks.hint(t);
  }

  // ---------- vykreslení ----------
  render() {
    const ctx = this.ctx, th = this.theme;
    if (!this.canvas.width) return;
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    ctx.setTransform(this.dpr || 1, 0, 0, this.dpr || 1, 0, 0);
    ctx.fillStyle = th.bg;
    ctx.fillRect(0, 0, W, H);
    if (!this.sketch) return;
    const v = this.view;

    // mřížka
    const g = this.gridStep();
    const [wx1, wy2] = this.s2w(0, 0), [wx2, wy1] = this.s2w(W, H);
    ctx.lineWidth = 1;
    const i0 = Math.floor(wx1 / g), i1 = Math.ceil(wx2 / g);
    for (let i = i0; i <= i1; i++) {
      const x = Math.round(this.w2s(i * g, 0)[0]) + 0.5;
      ctx.strokeStyle = i % 5 === 0 ? th.gridMajor : th.grid;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    const j0 = Math.floor(wy1 / g), j1 = Math.ceil(wy2 / g);
    for (let j = j0; j <= j1; j++) {
      const y = Math.round(this.w2s(0, j * g)[1]) + 0.5;
      ctx.strokeStyle = j % 5 === 0 ? th.gridMajor : th.grid;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // osy
    const axes = PLANES[this.sketch.plane].axes;
    const [ox, oy] = this.w2s(0, 0);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = AXIS_COLOR[axes[0]]; ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
    ctx.strokeStyle = AXIS_COLOR[axes[1]]; ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
    ctx.fillStyle = AXIS_COLOR[axes[0]]; ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText(axes[0], W - 16, Math.min(Math.max(oy - 6, 14), H - 6));
    ctx.fillStyle = AXIS_COLOR[axes[1]]; ctx.fillText(axes[1], Math.min(Math.max(ox + 6, 6), W - 16), 16);
    ctx.fillStyle = th.text; ctx.beginPath(); ctx.arc(ox, oy, 3, 0, Math.PI * 2); ctx.fill();

    // tvary
    for (const s of this.shapes) this._drawShape(s, s.id === this.selId);

    // rozpracovaný tvar
    if (this.draft && this.cursor) this._drawDraft();

    // přichycení
    if (this.snapInfo && this.cursor && this.tool !== 'select') {
      const [sx, sy] = this.w2s(this.cursor[0], this.cursor[1]);
      ctx.lineWidth = 1.5;
      if (this.snapInfo.kind === 'point' || this.snapInfo.kind === 'origin') {
        ctx.strokeStyle = '#18a957'; ctx.strokeRect(sx - 5, sy - 5, 10, 10);
      } else {
        ctx.strokeStyle = th.accent;
        ctx.beginPath(); ctx.moveTo(sx - 6, sy); ctx.lineTo(sx + 6, sy); ctx.moveTo(sx, sy - 6); ctx.lineTo(sx, sy + 6); ctx.stroke();
      }
    }
  }

  _path(poly, closed) {
    const ctx = this.ctx;
    ctx.beginPath();
    poly.forEach((p, i) => { const [x, y] = this.w2s(p[0], p[1]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    if (closed) ctx.closePath();
  }

  _drawShape(s, selected) {
    const ctx = this.ctx, th = this.theme;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.lineWidth = selected ? 3 : 2;
    ctx.strokeStyle = selected ? th.sel : th.stroke;
    if (s.t === 'circle') {
      const [cx, cy] = this.w2s(s.cx, s.cy);
      ctx.beginPath(); ctx.arc(cx, cy, s.r * this.view.s, 0, Math.PI * 2);
      ctx.fillStyle = th.fill; ctx.fill(); ctx.stroke();
    } else {
      const poly = shapePolygon(s);
      const closed = s.t === 'rect' || s.closed;
      this._path(poly, closed);
      if (closed) { ctx.fillStyle = th.fill; ctx.fill(); }
      ctx.stroke();
    }
    if (selected) {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = th.sel; ctx.lineWidth = 1.5;
      for (const p of shapeSnapPoints(s)) {
        const [x, y] = this.w2s(p[0], p[1]);
        ctx.fillRect(x - 3.5, y - 3.5, 7, 7); ctx.strokeRect(x - 3.5, y - 3.5, 7, 7);
      }
    }
  }

  _label(text, x, y) {
    const ctx = this.ctx, th = this.theme;
    ctx.font = '600 12px system-ui, sans-serif';
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = th.accent; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - 10, w, 20, 5) : ctx.rect(x - w / 2, y - 10, w, 20);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#16202b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 0.5);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  _drawDraft() {
    const ctx = this.ctx, th = this.theme, d = this.draft, c = this.cursor;
    ctx.strokeStyle = th.accent; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (d.t === 'poly') {
      this._path([...d.pts, c], false); ctx.stroke(); ctx.setLineDash([]);
      for (const p of d.pts) { const [x, y] = this.w2s(p[0], p[1]); ctx.fillStyle = th.accent; ctx.fillRect(x - 3, y - 3, 6, 6); }
      const last = d.pts[d.pts.length - 1];
      const len = Math.hypot(c[0] - last[0], c[1] - last[1]);
      if (len > 1e-9) {
        const [mx, my] = this.w2s((last[0] + c[0]) / 2, (last[1] + c[1]) / 2);
        const ang = ((Math.atan2(c[1] - last[1], c[0] - last[0]) * 180) / Math.PI + 360) % 360;
        this._label(`${fmt(len)} mm · ${fmt(ang)}°`, mx, my - 16);
      }
    } else if (d.t === 'rect') {
      const poly = [[d.a[0], d.a[1]], [c[0], d.a[1]], [c[0], c[1]], [d.a[0], c[1]]];
      this._path(poly, true); ctx.fillStyle = th.fill; ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      const w = Math.abs(c[0] - d.a[0]), h = Math.abs(c[1] - d.a[1]);
      if (w > 1e-9) { const [x, y] = this.w2s((d.a[0] + c[0]) / 2, c[1]); this._label(`${fmt(w)} mm`, x, y + (c[1] >= d.a[1] ? -16 : 16)); }
      if (h > 1e-9) { const [x, y] = this.w2s(c[0], (d.a[1] + c[1]) / 2); this._label(`${fmt(h)} mm`, x + (c[0] >= d.a[0] ? 40 : -40), y); }
    } else {
      const r = Math.hypot(c[0] - d.c[0], c[1] - d.c[1]);
      const [cx, cy] = this.w2s(d.c[0], d.c[1]);
      ctx.beginPath(); ctx.arc(cx, cy, r * this.view.s, 0, Math.PI * 2); ctx.fillStyle = th.fill; ctx.fill(); ctx.stroke();
      const [px, py] = this.w2s(c[0], c[1]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke(); ctx.setLineDash([]);
      if (r > 1e-9) this._label(`⌀ ${fmt(2 * r)} mm`, (cx + px) / 2, (cy + py) / 2 - 16);
    }
    ctx.setLineDash([]);
  }
}
