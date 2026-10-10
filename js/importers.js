/* SkicaCAD importers: STL / OBJ meshes and DXF / SVG outlines for sketches. */
const Importers = (() => {
'use strict';

/* ---------- meshes ---------- */
function parseSTL(buf) {
  const dv = new DataView(buf);
  if (buf.byteLength >= 84) {
    const n = dv.getUint32(80, true);
    if (84 + 50 * n === buf.byteLength) {
      const out = new Float32Array(n * 9);
      for (let i = 0; i < n; i++) { const o = 84 + 50 * i + 12; for (let k = 0; k < 9; k++) out[i * 9 + k] = dv.getFloat32(o + 4 * k, true); }
      return out;
    }
  }
  const text = new TextDecoder().decode(new Uint8Array(buf));
  const re = /vertex\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)/g, v = [];
  let m; while ((m = re.exec(text))) v.push(+m[1], +m[2], +m[3]);
  if (!v.length || v.length % 9) throw new Error('Soubor STL nemá platný obsah.');
  return Float32Array.from(v);
}
function parseOBJ(text) {
  const V = [], out = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('v ')) { const p = line.split(/\s+/); V.push([+p[1], +p[2], +p[3]]); }
    else if (line.startsWith('f ')) {
      const idx = line.split(/\s+/).slice(1).map(t => { const i = parseInt(t.split('/')[0], 10); return i < 0 ? V.length + i : i - 1; });
      for (let k = 1; k < idx.length - 1; k++) { const a = V[idx[0]], b = V[idx[k]], c = V[idx[k + 1]]; if (a && b && c) out.push(...a, ...b, ...c); }
    }
  }
  if (!out.length) throw new Error('Soubor OBJ neobsahuje žádné plochy.');
  return Float32Array.from(out);
}

/* ---------- 2D helpers ---------- */
function arcPoints(cx, cy, r, a0, a1, ccw) {
  let da = a1 - a0;
  if (ccw) { while (da <= 0) da += 2 * Math.PI; } else { while (da >= 0) da -= 2 * Math.PI; }
  const n = Math.max(4, Math.ceil(Math.abs(da) / (Math.PI / 32))), out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + da * i / n; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return out;
}
function bulgePoints(p1, p2, b) {
  if (Math.abs(b) < 1e-9) return [p1, p2];
  const th = 4 * Math.atan(b), dx = p2[0] - p1[0], dy = p2[1] - p1[1], c = Math.hypot(dx, dy);
  if (c < 1e-12) return [p1, p2];
  const r = c / (2 * Math.sin(th / 2)), mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
  const h = Math.sqrt(Math.max(0, r * r - c * c / 4)) * Math.sign(b) * (Math.abs(th) > Math.PI ? -1 : 1);
  const cx = mx - dy / c * h, cy = my + dx / c * h;
  return arcPoints(cx, cy, Math.abs(r), Math.atan2(p1[1] - cy, p1[0] - cx), Math.atan2(p2[1] - cy, p2[0] - cx), b > 0);
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function dedupe(pts, tol) { const o = []; for (const p of pts) if (!o.length || dist(o[o.length - 1], p) > tol) o.push(p); return o; }
/* join open pieces whose ends meet into longer chains; closed when the chain comes back to its start */
function chainPieces(pieces, tol) {
  const items = pieces.map(p => dedupe(p, tol)).filter(p => p.length >= 2), used = new Array(items.length).fill(false), out = [];
  for (let i = 0; i < items.length; i++) {
    if (used[i]) continue; used[i] = true;
    let pts = items[i].slice();
    let grown = true;
    while (grown && dist(pts[0], pts[pts.length - 1]) > tol) {
      grown = false;
      const tail = pts[pts.length - 1], head = pts[0];
      for (let j = 0; j < items.length; j++) {
        if (used[j]) continue;
        const q = items[j], s = q[0], e = q[q.length - 1];
        if (dist(tail, s) <= tol) pts = pts.concat(q.slice(1));
        else if (dist(tail, e) <= tol) pts = pts.concat(q.slice(0, -1).reverse());
        else if (dist(head, e) <= tol) pts = q.slice(0, -1).concat(pts);
        else if (dist(head, s) <= tol) pts = q.slice(1).reverse().concat(pts);
        else continue;
        used[j] = true; grown = true; break;
      }
    }
    const closed = pts.length >= 4 && dist(pts[0], pts[pts.length - 1]) <= tol;
    if (closed) pts.pop();
    out.push({ pts, closed });
  }
  return out;
}
function finishOutlines(circles, pieces, closedLoops) {
  const all = circles.map(c => [c.x - c.r, c.y - c.r, c.x + c.r, c.y + c.r]);
  for (const p of pieces.concat(closedLoops)) for (const q of p) all.push([q[0], q[1], q[0], q[1]]);
  if (!all.length) throw new Error('V souboru nebyla nalezena žádná podporovaná geometrie.');
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const b of all) { x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); }
  const tol = Math.max(Math.hypot(x1 - x0, y1 - y0) * 1e-6, 1e-6) * 10;
  const ents = circles.map(c => ({ t: 'circle', x: c.x, y: c.y, r: c.r }));
  for (const L of closedLoops) { const p = dedupe(L, tol); if (p.length > 1 && dist(p[0], p[p.length - 1]) <= tol) p.pop(); if (p.length >= 3) ents.push({ t: 'poly', pts: p, closed: true }); }
  for (const c of chainPieces(pieces, tol)) if (c.pts.length >= (c.closed ? 3 : 2)) ents.push({ t: 'poly', pts: c.pts, closed: c.closed });
  return { ents, bbox: [x0, y0, x1, y1] };
}

/* ---------- DXF ---------- */
function parseDXF(text) {
  const L = text.split(/\r?\n/), pairs = [];
  for (let i = 0; i + 1 < L.length; i += 2) pairs.push([parseInt(L[i].trim(), 10), L[i + 1].trim()]);
  let section = null, units = 0, i = 0;
  const ents = [];
  while (i < pairs.length) {
    const [c, v] = pairs[i];
    if (c === 0 && v === 'SECTION') { section = pairs[i + 1] ? pairs[i + 1][1] : null; i += 2; continue; }
    if (c === 0 && v === 'ENDSEC') { section = null; i++; continue; }
    if (section === 'HEADER' && c === 9 && v === '$INSUNITS') { const n = pairs.slice(i + 1, i + 4).find(p => p[0] === 70); if (n) units = parseInt(n[1], 10); i++; continue; }
    if (section === 'ENTITIES' && c === 0) {
      const ent = { type: v, g: [] }; i++;
      while (i < pairs.length && pairs[i][0] !== 0) { ent.g.push(pairs[i]); i++; }
      ents.push(ent); continue;
    }
    i++;
  }
  const num = (e, code, def = 0) => { const p = e.g.find(q => q[0] === code); return p ? parseFloat(p[1]) : def; };
  const circles = [], pieces = [], loops = [], skipped = {};
  let poly = null;
  for (const e of ents) {
    switch (e.type) {
      case 'LINE': pieces.push([[num(e, 10), num(e, 20)], [num(e, 11), num(e, 21)]]); break;
      case 'CIRCLE': circles.push({ x: num(e, 10), y: num(e, 20), r: num(e, 40) }); break;
      case 'ARC': { const cx = num(e, 10), cy = num(e, 20), r = num(e, 40); pieces.push(arcPoints(cx, cy, r, num(e, 50) * Math.PI / 180, num(e, 51) * Math.PI / 180, true)); break; }
      case 'LWPOLYLINE': {
        const closed = (num(e, 70) & 1) === 1, vs = [];
        for (const [c, v] of e.g) { if (c === 10) vs.push({ p: [parseFloat(v), 0], b: 0 }); else if (c === 20 && vs.length) vs[vs.length - 1].p[1] = parseFloat(v); else if (c === 42 && vs.length) vs[vs.length - 1].b = parseFloat(v); }
        addPolyline(vs, closed); break;
      }
      case 'POLYLINE': poly = { closed: (num(e, 70) & 1) === 1, vs: [] }; break;
      case 'VERTEX': if (poly) poly.vs.push({ p: [num(e, 10), num(e, 20)], b: num(e, 42) }); break;
      case 'SEQEND': if (poly) { addPolyline(poly.vs, poly.closed); poly = null; } break;
      case 'ELLIPSE': {
        const cx = num(e, 10), cy = num(e, 20), mx = num(e, 11), my = num(e, 21), ratio = num(e, 40, 1);
        let t0 = num(e, 41, 0), t1 = num(e, 42, 2 * Math.PI); if (t1 <= t0) t1 += 2 * Math.PI;
        const a = Math.hypot(mx, my), rot = Math.atan2(my, mx), n = Math.max(8, Math.ceil((t1 - t0) / (Math.PI / 32))), pts = [];
        for (let k = 0; k <= n; k++) { const t = t0 + (t1 - t0) * k / n, x = a * Math.cos(t), y = a * ratio * Math.sin(t); pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
        pieces.push(pts); break;
      }
      case 'SPLINE': {
        const fit = [], ctl = [];
        for (const [c, v] of e.g) { if (c === 11) fit.push([parseFloat(v), 0]); else if (c === 21 && fit.length) fit[fit.length - 1][1] = parseFloat(v); else if (c === 10) ctl.push([parseFloat(v), 0]); else if (c === 20 && ctl.length) ctl[ctl.length - 1][1] = parseFloat(v); }
        const pts = fit.length >= 2 ? fit : ctl; if (pts.length >= 2) pieces.push(pts);
        break;
      }
      default: skipped[e.type] = (skipped[e.type] || 0) + 1;
    }
  }
  function addPolyline(vs, closed) {
    if (vs.length < 2) return;
    const pts = [];
    const n = closed ? vs.length : vs.length - 1;
    for (let k = 0; k < n; k++) { const a = vs[k], b = vs[(k + 1) % vs.length], seg = bulgePoints(a.p, b.p, a.b); if (pts.length) seg.shift(); pts.push(...seg); }
    if (closed) loops.push(pts); else pieces.push(pts);
  }
  const res = finishOutlines(circles, pieces, loops);
  const scale = { 1: 25.4, 2: 304.8, 4: 1, 5: 10, 6: 1000, 8: 0.0254, 9: 0.0254 }[units] || 1;
  return { ...res, scale, skipped, unitsKnown: !!({ 1: 1, 2: 1, 4: 1, 5: 1, 6: 1 }[units]) };
}

/* ---------- SVG ---------- */
const UNIT_MM = { mm: 1, cm: 10, in: 25.4, pt: 25.4 / 72, pc: 25.4 / 6, px: 25.4 / 96, '': 25.4 / 96 };
function svgPathSubpaths(d, segLen) {
  let i = 0;
  const s = d || '', out = [];
  const ws = () => { while (i < s.length && /[\s,]/.test(s[i])) i++; };
  const isNum = () => { ws(); return i < s.length && /[-+.0-9]/.test(s[i]); };
  const num = () => {
    ws(); const m = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(s.slice(i, i + 40));
    if (!m) throw new Error('Neplatná data cesty SVG.'); i += m[0].length; return parseFloat(m[0]);
  };
  const flag = () => { ws(); const c = s[i]; if (c !== '0' && c !== '1') throw new Error('Neplatný oblouk v cestě SVG.'); i++; return c === '1'; };
  let cur = [0, 0], start = [0, 0], sub = null, cmd = null, lastC = null, lastQ = null;
  const push = p => { if (!sub) { sub = { pts: [cur.slice()], closed: false }; out.push(sub); } sub.pts.push(p); cur = p; };
  const nseg = len => Math.max(4, Math.min(64, Math.ceil(len / segLen)));
  while (i < s.length) {
    ws(); if (i >= s.length) break;
    if (/[A-Za-z]/.test(s[i])) { cmd = s[i]; i++; } else if (!cmd) throw new Error('Neplatná data cesty SVG.');
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const P = (x, y) => (rel ? [cur[0] + x, cur[1] + y] : [x, y]);
    if (C === 'Z') { if (sub) { sub.closed = true; } cur = start.slice(); sub = null; lastC = lastQ = null; continue; }
    do {
      if (C === 'M') { const p = P(num(), num()); cur = p; start = p.slice(); sub = { pts: [p], closed: false }; out.push(sub); cmd = rel ? 'l' : 'L'; lastC = lastQ = null; }
      else if (C === 'L') { push(P(num(), num())); lastC = lastQ = null; }
      else if (C === 'H') { const x = num(); push([rel ? cur[0] + x : x, cur[1]]); lastC = lastQ = null; }
      else if (C === 'V') { const y = num(); push([cur[0], rel ? cur[1] + y : y]); lastC = lastQ = null; }
      else if (C === 'C' || C === 'S') {
        let c1;
        if (C === 'C') c1 = P(num(), num()); else c1 = lastC ? [2 * cur[0] - lastC[0], 2 * cur[1] - lastC[1]] : cur.slice();
        const c2 = P(num(), num()), e = P(num(), num()), p0 = cur.slice();
        const n = nseg(dist(p0, c1) + dist(c1, c2) + dist(c2, e));
        for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t; push([u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * e[0], u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * e[1]]); }
        lastC = c2; lastQ = null;
      } else if (C === 'Q' || C === 'T') {
        let c1;
        if (C === 'Q') c1 = P(num(), num()); else c1 = lastQ ? [2 * cur[0] - lastQ[0], 2 * cur[1] - lastQ[1]] : cur.slice();
        const e = P(num(), num()), p0 = cur.slice(), n = nseg(dist(p0, c1) + dist(c1, e));
        for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t; push([u * u * p0[0] + 2 * u * t * c1[0] + t * t * e[0], u * u * p0[1] + 2 * u * t * c1[1] + t * t * e[1]]); }
        lastQ = c1; lastC = null;
      } else if (C === 'A') {
        let rx = Math.abs(num()), ry = Math.abs(num()); const phi = num() * Math.PI / 180, large = flag(), sweep = flag(), e = P(num(), num()), p0 = cur.slice();
        if (rx < 1e-12 || ry < 1e-12 || dist(p0, e) < 1e-12) { push(e); }
        else {
          const cp = Math.cos(phi), sp = Math.sin(phi), dx = (p0[0] - e[0]) / 2, dy = (p0[1] - e[1]) / 2;
          const x1 = cp * dx + sp * dy, y1 = -sp * dx + cp * dy;
          const lam = x1 * x1 / (rx * rx) + y1 * y1 / (ry * ry); if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
          const num2 = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1, den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
          let co = Math.sqrt(Math.max(0, num2 / den)); if (large === sweep) co = -co;
          const cx1 = co * rx * y1 / ry, cy1 = -co * ry * x1 / rx;
          const cx = cp * cx1 - sp * cy1 + (p0[0] + e[0]) / 2, cy = sp * cx1 + cp * cy1 + (p0[1] + e[1]) / 2;
          const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
          const t1 = ang(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
          let dt = ang((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
          if (!sweep && dt > 0) dt -= 2 * Math.PI; else if (sweep && dt < 0) dt += 2 * Math.PI;
          const n = Math.max(4, Math.min(96, Math.ceil(Math.abs(dt) * Math.max(rx, ry) / segLen), Math.ceil(Math.abs(dt) / (Math.PI / 32))));
          for (let k = 1; k <= n; k++) { const t = t1 + dt * k / n, x = rx * Math.cos(t), y = ry * Math.sin(t); push(k === n ? e : [cp * x - sp * y + cx, sp * x + cp * y + cy]); }
        }
        lastC = lastQ = null;
      } else throw new Error('Nepodporovaný příkaz cesty SVG: ' + cmd);
    } while (isNum());
  }
  return out.filter(sp => sp.pts.length >= 2);
}
function parseSVG(text) {
  if (typeof DOMParser === 'undefined') throw new Error('Import SVG vyžaduje prohlížeč.');
  const src = new DOMParser().parseFromString(text, 'image/svg+xml');
  const root = src.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg' || src.getElementsByTagName('parsererror').length) throw new Error('Soubor není platné SVG.');
  const vb = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  const wm = /^\s*([0-9.]+)\s*([a-z%]*)\s*$/i.exec(root.getAttribute('width') || '');
  let mmPerUnit = 25.4 / 96, unitsKnown = false;
  if (wm && wm[2] !== '%') {
    const wmm = parseFloat(wm[1]) * (UNIT_MM[wm[2].toLowerCase()] || UNIT_MM.px);
    unitsKnown = /^(mm|cm|in|pt|pc)$/i.test(wm[2]);
    mmPerUnit = vb.length === 4 && vb[2] > 0 ? wmm / vb[2] : (UNIT_MM[wm[2].toLowerCase()] || UNIT_MM.px);
  }
  const NS = 'http://www.w3.org/2000/svg';
  const ALLOW = { g: ['transform'], a: ['transform'], path: ['d', 'transform'], rect: ['x', 'y', 'width', 'height', 'rx', 'ry', 'transform'], circle: ['cx', 'cy', 'r', 'transform'],
    ellipse: ['cx', 'cy', 'rx', 'ry', 'transform'], line: ['x1', 'y1', 'x2', 'y2', 'transform'], polyline: ['points', 'transform'], polygon: ['points', 'transform'] };
  const host = document.createElementNS(NS, 'svg');
  host.setAttribute('style', 'position:absolute;left:-10000px;top:0;width:10px;height:10px;overflow:hidden;visibility:hidden;pointer-events:none');
  const copy = (from, to) => {
    for (const ch of Array.from(from.children)) {
      const name = ch.localName.toLowerCase();
      if (!ALLOW[name] || ch.getAttribute('display') === 'none' || /display\s*:\s*none/.test(ch.getAttribute('style') || '')) continue;
      const el = document.createElementNS(NS, name === 'a' ? 'g' : name);
      for (const a of ALLOW[name]) { const v = ch.getAttribute(a); if (v !== null) el.setAttribute(a, v); }
      to.appendChild(el);
      if (name === 'g' || name === 'a') copy(ch, el);
    }
  };
  copy(root, host);
  document.body.appendChild(host);
  const circles = [], pieces = [], loops = [];
  const segLen = 0.4 / mmPerUnit;
  try {
    for (const el of host.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon')) {
      const m = el.getCTM(); if (!m) continue;
      const T = p => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
      const sc = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)), uniform = Math.abs(m.a - m.d) < 1e-6 * (Math.abs(m.a) + 1) && Math.abs(m.b + m.c) < 1e-6 * (Math.abs(m.b) + 1);
      const f = a => parseFloat(el.getAttribute(a)) || 0;
      const name = el.localName;
      if (name === 'path') { for (const sp of svgPathSubpaths(el.getAttribute('d'), segLen)) (sp.closed ? loops : pieces).push(sp.pts.map(T)); }
      else if (name === 'rect') {
        const x = f('x'), y = f('y'), w = f('width'), h = f('height'); if (w <= 0 || h <= 0) continue;
        let rx = el.hasAttribute('rx') ? f('rx') : f('ry'), ry = el.hasAttribute('ry') ? f('ry') : rx; rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
        if (rx > 0 && ry > 0) {
          const d = `M${x + rx},${y}H${x + w - rx}A${rx},${ry} 0 0 1 ${x + w},${y + ry}V${y + h - ry}A${rx},${ry} 0 0 1 ${x + w - rx},${y + h}H${x + rx}A${rx},${ry} 0 0 1 ${x},${y + h - ry}V${y + ry}A${rx},${ry} 0 0 1 ${x + rx},${y}Z`;
          for (const sp of svgPathSubpaths(d, segLen)) loops.push(sp.pts.map(T));
        } else loops.push([[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(T));
      } else if (name === 'circle' || name === 'ellipse') {
        const cx = f('cx'), cy = f('cy'), rx = name === 'circle' ? f('r') : f('rx'), ry = name === 'circle' ? f('r') : f('ry');
        if (rx <= 0 || ry <= 0) continue;
        if (Math.abs(rx - ry) < 1e-9 && uniform) { const c = T([cx, cy]); circles.push({ x: c[0], y: c[1], r: rx * sc }); }
        else { const pts = []; for (let k = 0; k < 72; k++) { const a = 2 * Math.PI * k / 72; pts.push(T([cx + rx * Math.cos(a), cy + ry * Math.sin(a)])); } loops.push(pts); }
      } else if (name === 'line') pieces.push([T([f('x1'), f('y1')]), T([f('x2'), f('y2')])]);
      else {
        const nums = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n)), pts = [];
        for (let k = 0; k + 1 < nums.length; k += 2) pts.push(T([nums[k], nums[k + 1]]));
        if (pts.length >= 2) (name === 'polygon' ? loops : pieces).push(pts);
      }
    }
  } finally { host.remove(); }
  /* SVG has y pointing down: flip to CAD orientation */
  const flipP = p => [p[0], -p[1]];
  const res = finishOutlines(circles.map(c => ({ x: c.x, y: -c.y, r: c.r })), pieces.map(p => p.map(flipP)), loops.map(p => p.map(flipP)));
  return { ...res, scale: mmPerUnit, unitsKnown, skipped: {} };
}

/* ---------- ZIP (stored or deflated entries) ---------- */
async function readZip(buf) {
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Soubor ZIP je poškozený nebo nemá platný formát.');
  const n = dv.getUint16(eocd + 10, true);
  let off = dv.getUint32(eocd + 16, true);
  const out = [];
  for (let k = 0; k < n && off + 46 <= buf.byteLength; k++) {
    if (dv.getUint32(off, true) !== 0x02014b50) break;
    const method = dv.getUint16(off + 10, true), csize = dv.getUint32(off + 20, true);
    const nl = dv.getUint16(off + 28, true), xl = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lho = dv.getUint32(off + 42, true);
    const name = new TextDecoder().decode(u8.subarray(off + 46, off + 46 + nl));
    off += 46 + nl + xl + cl;
    if (name.endsWith('/') || lho + 30 > buf.byteLength) continue;
    const start = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
    const raw = u8.subarray(start, start + csize);
    let data;
    if (method === 0) data = raw.slice();
    else if (method === 8) {
      if (typeof DecompressionStream === 'undefined') throw new Error('Tento prohlížeč neumí rozbalit komprimovaný ZIP.');
      const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      data = new Uint8Array(await new Response(stream).arrayBuffer());
    } else continue;
    out.push({ name, data });
  }
  return out;
}

return { readZip, parseSTL, parseOBJ, parseDXF, parseSVG, svgPathSubpaths, chainPieces, bulgePoints };
})();


