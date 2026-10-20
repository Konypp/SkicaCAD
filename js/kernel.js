/* Kóta geometry kernel: convex-polygon solids, BSP booleans, extrusion, fillet / chamfer.
   Polygons: {v:[[x,y,z],...], n:[x,y,z], w:number}  (convex, CCW seen from outside). Units: mm. */
const K = (() => {
'use strict';
const Q = 1e6, QK = 1e5, EPS = 5e-4;
let CULL = true, RAW = false;
const vsub = (a, b) => a.map((x, i) => x - b[i]);
const vadd = (a, b) => a.map((x, i) => x + b[i]);
const vmul = (a, s) => a.map(x => x * s);
const vdot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const vlen = a => Math.sqrt(vdot(a, a));
const vnorm = a => { const l = vlen(a) || 1; return a.map(x => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mid3 = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const qr = x => Math.round(x * Q) / Q;
const qk = p => Math.round(p[0] * QK) + ',' + Math.round(p[1] * QK) + ',' + Math.round(p[2] * QK);
const centroid = v => { const c = [0, 0, 0]; for (const p of v) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; } return [c[0] / v.length, c[1] / v.length, c[2] / v.length]; };

/* ---------- polygons ---------- */
function newellVec(v) {
  let x = 0, y = 0, z = 0; const n = v.length;
  for (let i = 0; i < n; i++) {
    const a = v[i], b = v[(i + 1) % n];
    x += (a[1] - b[1]) * (a[2] + b[2]); y += (a[2] - b[2]) * (a[0] + b[0]); z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return [x, y, z];
}
function mkPoly(v) {
  const nv = newellVec(v), l = vlen(nv);
  if (!(l > 1e-12)) return null;
  const n = [nv[0] / l, nv[1] / l, nv[2] / l], c = centroid(v);
  return { v, n, w: vdot(n, c) };
}
const clonePoly = p => ({ v: p.v.map(x => x.slice()), n: p.n.slice(), w: p.w });
function flipPoly(p) { p.v.reverse(); p.n = [-p.n[0], -p.n[1], -p.n[2]]; p.w = -p.w; }
function signedVolume(polys) {
  let s = 0;
  for (const p of polys) { const v = p.v; for (let i = 1; i < v.length - 1; i++) s += vdot(v[0], cross(v[i], v[i + 1])); }
  return s / 6;
}
function fixOrientation(polys) { if (signedVolume(polys) < 0) polys.forEach(flipPoly); return polys; }
function bbox(polys) {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const p of polys) for (const q of p.v) for (let k = 0; k < 3; k++) { if (q[k] < mn[k]) mn[k] = q[k]; if (q[k] > mx[k]) mx[k] = q[k]; }
  return { min: mn, max: mx };
}
function transform(polys, m) { /* m: column-major 4x4 (THREE.Matrix4.elements) */
  const out = [];
  for (const p of polys) {
    const v = p.v.map(q => [
      m[0] * q[0] + m[4] * q[1] + m[8] * q[2] + m[12],
      m[1] * q[0] + m[5] * q[1] + m[9] * q[2] + m[13],
      m[2] * q[0] + m[6] * q[1] + m[10] * q[2] + m[14]]);
    const np = mkPoly(v); if (np) out.push(np);
  }
  return out;
}
const translate = (polys, d) => polys.map(p => mkPoly(p.v.map(q => [q[0] + d[0], q[1] + d[1], q[2] + d[2]]))).filter(Boolean);

/* ---------- BSP booleans (after csg.js) ---------- */
/* work budget so a pathological boolean fails with a message instead of exhausting memory */
const budget = { left: Infinity, deadline: Infinity };
const TOO_COMPLEX = 'Operace je pro tento model příliš složitá. Zkuste zjednodušit tělesa nebo operaci rozdělit.';
function spend(n) {
  budget.left -= n;
  if (budget.left < 0) throw new Error(TOO_COMPLEX);
  if ((budget.left & 4095) === 0 && Date.now() > budget.deadline) throw new Error(TOO_COMPLEX);
}
function splitPolygon(pl, poly, cf, cb, f, b) {
  spend(1);
  let type = 0; const types = [];
  for (const q of poly.v) {
    const t = pl.n[0] * q[0] + pl.n[1] * q[1] + pl.n[2] * q[2] - pl.w;
    const ty = t < -EPS ? 2 : t > EPS ? 1 : 0; type |= ty; types.push(ty);
  }
  if (type === 0) { (vdot(pl.n, poly.n) > 0 ? cf : cb).push(poly); }
  else if (type === 1) f.push(poly);
  else if (type === 2) b.push(poly);
  else {
    const fv = [], bv = [], n = poly.v.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ti = types[i], tj = types[j], vi = poly.v[i], vj = poly.v[j];
      if (ti !== 2) fv.push(vi);
      if (ti !== 1) bv.push(ti !== 2 ? vi.slice() : vi);
      if ((ti | tj) === 3) {
        const t = (pl.w - vdot(pl.n, vi)) / vdot(pl.n, vsub(vj, vi));
        const p = [vi[0] + (vj[0] - vi[0]) * t, vi[1] + (vj[1] - vi[1]) * t, vi[2] + (vj[2] - vi[2]) * t];
        fv.push(p); bv.push(p.slice());
      }
    }
    if (fv.length >= 3) f.push({ v: fv, n: poly.n, w: poly.w });
    if (bv.length >= 3) b.push({ v: bv, n: poly.n, w: poly.w });
  }
}
class BSP {
  constructor(polys) { this.plane = null; this.front = null; this.back = null; this.polygons = []; if (polys && polys.length) this.build(polys); }
  invert() {
    const st = [this];
    while (st.length) {
      const nd = st.pop();
      for (const p of nd.polygons) flipPoly(p);
      if (nd.plane) nd.plane = { n: [-nd.plane.n[0], -nd.plane.n[1], -nd.plane.n[2]], w: -nd.plane.w };
      const t = nd.front; nd.front = nd.back; nd.back = t;
      if (nd.front) st.push(nd.front); if (nd.back) st.push(nd.back);
    }
  }
  clipPolygons(polys) {
    const out = [], st = [[this, polys]];
    while (st.length) {
      const [nd, ps] = st.pop();
      if (!nd.plane) { for (const p of ps) out.push(p); continue; }
      const f = [], b = [];
      for (const p of ps) splitPolygon(nd.plane, p, f, b, f, b);
      if (nd.front) st.push([nd.front, f]); else for (const p of f) out.push(p);
      if (nd.back) st.push([nd.back, b]);
    }
    return out;
  }
  clipTo(bsp) {
    const st = [this];
    while (st.length) {
      const nd = st.pop();
      nd.polygons = bsp.clipPolygons(nd.polygons);
      if (nd.front) st.push(nd.front); if (nd.back) st.push(nd.back);
    }
  }
  allPolygons() {
    const out = [], st = [this];
    while (st.length) { const nd = st.pop(); for (const p of nd.polygons) out.push(p); if (nd.front) st.push(nd.front); if (nd.back) st.push(nd.back); }
    return out;
  }
  build(polys) {
    const st = [[this, polys]];
    while (st.length) {
      const [nd, ps] = st.pop();
      if (!ps.length) continue;
      if (!nd.plane) {
        let best = ps[0], bs = Infinity;
        if (ps.length > 8) {
          const step = Math.max(1, Math.floor(ps.length / 12));
          for (let c = 0; c < ps.length && bs > 0; c += step) {
            const cand = ps[c]; let sc = 0, fr = 0, bk = 0;
            for (let j = 0; j < ps.length; j += Math.max(1, Math.floor(ps.length / 200))) {
              let ty = 0;
              for (const q of ps[j].v) { const t = vdot(cand.n, q) - cand.w; ty |= t < -EPS ? 2 : t > EPS ? 1 : 0; }
              if (ty === 3) sc++; else if (ty === 1) fr++; else if (ty === 2) bk++;
            }
            const score = sc * 4 + Math.abs(fr - bk);
            if (score < bs) { bs = score; best = cand; }
          }
        }
        nd.plane = { n: best.n.slice(), w: best.w };
      }
      const f = [], b = [];
      for (const p of ps) splitPolygon(nd.plane, p, nd.polygons, nd.polygons, f, b);
      if (f.length) { if (!nd.front) nd.front = new BSP(); st.push([nd.front, f]); }
      if (b.length) { if (!nd.back) nd.back = new BSP(); st.push([nd.back, b]); }
    }
  }
}
function boolean(a, b, op) {
  const outer = budget.left === Infinity;
  if (outer) { budget.left = Math.max(4e6, 400 * (a.length + b.length)); budget.deadline = Date.now() + 25000; }
  try { return booleanInner(a, b, op); }
  finally { if (outer) { budget.left = Infinity; budget.deadline = Infinity; } }
}
let USE_BSP = false;
function booleanInner(a, b, op) {
  if (!USE_BSP && a.length && b.length) {
    const ba0 = bbox(a), bb0 = bbox(b);
    for (let k = 0; k < 3; k++) if (ba0.max[k] < bb0.min[k] - EPS || bb0.max[k] < ba0.min[k] - EPS) return op === 'union' ? a.concat(b).map(clonePoly) : op === 'subtract' ? a.map(clonePoly) : [];
    return meshBoolean(a, b, op);
  }
  return bspBoolean(a, b, op);
}
function bspBoolean(a, b, op) {
  if (!a.length) return op === 'union' ? b.map(clonePoly) : [];
  if (!b.length) return op === 'intersect' ? [] : a.map(clonePoly);
  const ba = bbox(a), bb = bbox(b);
  let sep = false;
  for (let k = 0; k < 3; k++) if (ba.max[k] < bb.min[k] - EPS || bb.max[k] < ba.min[k] - EPS) sep = true;
  if (sep) return op === 'union' ? a.concat(b).map(clonePoly) : op === 'subtract' ? a.map(clonePoly) : [];
  /* polygons outside the other solid's bounding box are unaffected: keep or drop them without the BSP */
  const pad = 1e-3, outside = (p, bx) => {
    for (let k = 0; k < 3; k++) {
      let lo = Infinity, hi = -Infinity; for (const q of p.v) { if (q[k] < lo) lo = q[k]; if (q[k] > hi) hi = q[k]; }
      if (hi < bx.min[k] - pad || lo > bx.max[k] + pad) return true;
    }
    return false;
  };
  const aIn = [], aOut = [], bIn = [], bOut = [];
  for (const p of a) ((CULL && outside(p, bb)) ? aOut : aIn).push(p);
  for (const p of b) ((CULL && outside(p, ba)) ? bOut : bIn).push(p);
  const keep = op === 'union' ? aOut.concat(bOut) : op === 'subtract' ? aOut : [];
  const A = new BSP(aIn.map(clonePoly)), B = new BSP(bIn.map(clonePoly));
  if (op === 'union') { A.clipTo(B); B.clipTo(A); B.invert(); B.clipTo(A); B.invert(); A.build(B.allPolygons()); }
  else if (op === 'subtract') { A.invert(); A.clipTo(B); B.clipTo(A); B.invert(); B.clipTo(A); B.invert(); A.build(B.allPolygons()); A.invert(); }
  else { A.invert(); B.clipTo(A); B.invert(); A.clipTo(B); B.clipTo(A); A.build(B.allPolygons()); A.invert(); }
  const res = A.allPolygons().concat(keep.map(clonePoly));
  return RAW ? res : clean(res);
}

/* ---------- mesh booleans: split only where surfaces cross, classify pieces by ray casting ---------- */
function polyBox(p) {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const q of p.v) for (let k = 0; k < 3; k++) { if (q[k] < mn[k]) mn[k] = q[k]; if (q[k] > mx[k]) mx[k] = q[k]; }
  return [mn, mx];
}
function buildBVH(polys) {
  const items = polys.map((p, i) => { const [mn, mx] = polyBox(p); return { i, mn, mx, c: [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2] }; });
  const make = list => {
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (const it of list) for (let k = 0; k < 3; k++) { if (it.mn[k] < mn[k]) mn[k] = it.mn[k]; if (it.mx[k] > mx[k]) mx[k] = it.mx[k]; }
    if (list.length <= 6) return { mn, mx, leaf: list.map(it => it.i) };
    let ax = 0, best = -1;
    for (let k = 0; k < 3; k++) { let lo = Infinity, hi = -Infinity; for (const it of list) { if (it.c[k] < lo) lo = it.c[k]; if (it.c[k] > hi) hi = it.c[k]; } if (hi - lo > best) { best = hi - lo; ax = k; } }
    list.sort((a, b) => a.c[ax] - b.c[ax]);
    const h = list.length >> 1;
    return { mn, mx, l: make(list.slice(0, h)), r: make(list.slice(h)) };
  };
  return polys.length ? make(items) : null;
}
function bvhQuery(node, mn, mx, out) {
  if (!node) return out;
  const st = [node];
  while (st.length) {
    const n = st.pop();
    if (n.mx[0] < mn[0] || n.mn[0] > mx[0] || n.mx[1] < mn[1] || n.mn[1] > mx[1] || n.mx[2] < mn[2] || n.mn[2] > mx[2]) continue;
    if (n.leaf) for (const i of n.leaf) out.push(i); else st.push(n.l, n.r);
  }
  return out;
}
function rayHitsBox(n, o, inv) {
  let t0 = 0, t1 = Infinity;
  for (let k = 0; k < 3; k++) {
    let a = (n.mn[k] - o[k]) * inv[k], b = (n.mx[k] - o[k]) * inv[k];
    if (a > b) { const t = a; a = b; b = t; }
    if (a > t0) t0 = a; if (b < t1) t1 = b;
    if (t0 > t1) return false;
  }
  return true;
}
function pointInConvex(p, poly, tol) {
  const v = poly.v, n = poly.n, m = v.length;
  for (let i = 0; i < m; i++) {
    const a = v[i], b = v[(i + 1) % m];
    const ex = b[0] - a[0], ey = b[1] - a[1], ez = b[2] - a[2], px = p[0] - a[0], py = p[1] - a[1], pz = p[2] - a[2];
    const cx = ey * pz - ez * py, cy = ez * px - ex * pz, cz = ex * py - ey * px;
    const L = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1;
    if ((cx * n[0] + cy * n[1] + cz * n[2]) / L < -tol) return false;
  }
  return true;
}
const RAYS = [[0.5378, 0.6292, 0.5612], [-0.6021, 0.3313, 0.7264], [0.2187, -0.8463, 0.4858]].map(vnorm);
function insideSolid(pt, polys, bvh) {
  if (!bvh) return false;
  let votes = 0;
  for (const d of RAYS) {
    const inv = d.map(x => (Math.abs(x) > 1e-12 ? 1 / x : 1e12));
    let cnt = 0;
    const st = [bvh];
    while (st.length) {
      const n = st.pop();
      if (!rayHitsBox(n, pt, inv)) continue;
      if (!n.leaf) { st.push(n.l, n.r); continue; }
      for (const i of n.leaf) {
        const q = polys[i], den = vdot(q.n, d);
        if (Math.abs(den) < 1e-12) continue;
        const t = (q.w - vdot(q.n, pt)) / den;
        if (t <= 1e-7) continue;
        const h = [pt[0] + d[0] * t, pt[1] + d[1] * t, pt[2] + d[2] * t];
        if (pointInConvex(h, q, 0)) cnt++;
      }
    }
    if (cnt & 1) votes++;
  }
  return votes >= 2;
}
function relation(p, q) {
  let pos = 0, neg = 0, on = 0;
  for (const v of q.v) { const t = vdot(p.n, v) - p.w; if (t > EPS) pos++; else if (t < -EPS) neg++; else on++; }
  if (!pos && !neg) return Math.abs(vdot(p.n, q.n)) > 0.999 ? 'copl' : 'none';
  if (!pos || !neg) return on >= 2 ? 'cross' : 'none'; /* q touches p's plane along an edge */
  pos = 0; neg = 0;
  for (const v of p.v) { const t = vdot(q.n, v) - q.w; if (t > EPS) pos++; else if (t < -EPS) neg++; }
  if (!pos || !neg) return 'none';
  return 'cross';
}
/* does segment a-b (lying in the polygon's plane) pass through the polygon's interior? */
function segThrough(a, b, poly) {
  const v = poly.v, n = poly.n, m = v.length, d = vsub(b, a);
  let t0 = 0, t1 = 1;
  for (let i = 0; i < m; i++) {
    const vi = v[i], vj = v[(i + 1) % m], e = vsub(vj, vi), L = vlen(e) || 1;
    const inw = vmul(cross(n, e), 1 / L);
    const num = vdot(inw, vsub(a, vi)) - EPS, den = vdot(inw, d);
    if (Math.abs(den) < 1e-14) { if (num < 0) return false; continue; }
    const t = -num / den;
    if (den > 0) { if (t > t0) t0 = t; } else { if (t < t1) t1 = t; }
    if (t0 >= t1) return false;
  }
  return t1 - t0 > 1e-9;
}
function crossSegment(q, p) { /* part of polygon q lying in p's plane */
  const pts = [], m = q.v.length;
  for (let i = 0; i < m; i++) {
    const a = q.v[i], b = q.v[(i + 1) % m], da = vdot(p.n, a) - p.w, db = vdot(p.n, b) - p.w;
    if (Math.abs(da) <= EPS) pts.push(a);
    if ((da > EPS && db < -EPS) || (da < -EPS && db > EPS)) { const t = da / (da - db); pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
  }
  if (pts.length < 2) return null;
  const L = cross(p.n, q.n);
  let lo = pts[0], hi = pts[0], tl = vdot(L, lo), th = tl;
  for (const x of pts) { const t = vdot(L, x); if (t < tl) { tl = t; lo = x; } if (t > th) { th = t; hi = x; } }
  return th - tl > 1e-9 ? [lo, hi] : null;
}
function splitBy(pieces, plane, seg) {
  const out = [];
  for (const pc of pieces) {
    if (seg && !segThrough(seg[0], seg[1], pc)) { out.push(pc); continue; }
    const f = [], b = [];
    splitPolygon(plane, pc, f, b, f, b);
    for (const x of f) out.push(x); for (const x of b) out.push(x);
  }
  return out;
}
function classifySide(polys, other, obvh, otherBox) {
  const res = [], m = polys.length;
  const info = new Array(m);
  for (let i = 0; i < m; i++) {
    const [mn, mx] = polyBox(polys[i]);
    const e = EPS * 4;
    const cand = bvhQuery(obvh, [mn[0] - e, mn[1] - e, mn[2] - e], [mx[0] + e, mx[1] + e, mx[2] + e], []);
    const cuts = [], copl = [];
    for (const qi of cand) { const r = relation(polys[i], other[qi]); if (r === 'cross') cuts.push(other[qi]); else if (r === 'copl') copl.push(other[qi]); }
    info[i] = { cand: cand.length, cuts, copl };
  }
  /* flood fill: polygons with no nearby geometry of the other solid share one status per connected patch */
  const status = new Int8Array(m).fill(-1), adj = new Map();
  polys.forEach((p, i) => { if (info[i].cand) return; for (let k = 0; k < p.v.length; k++) { const a = qk(p.v[k]), b = qk(p.v[(k + 1) % p.v.length]), key = a < b ? a + '|' + b : b + '|' + a; let l = adj.get(key); if (!l) adj.set(key, l = []); l.push(i); } });
  const outsideBox = p => { const [mn, mx] = polyBox(p); for (let k = 0; k < 3; k++) if (mx[k] < otherBox.min[k] - EPS || mn[k] > otherBox.max[k] + EPS) return true; return false; };
  for (let i = 0; i < m; i++) {
    if (info[i].cand || status[i] >= 0) continue;
    const p = polys[i], inside = outsideBox(p) ? false : insideSolid(centroid(p.v), other, obvh);
    const st = [i]; status[i] = inside ? 1 : 0;
    while (st.length) {
      const j = st.pop(), q = polys[j];
      for (let k = 0; k < q.v.length; k++) {
        const a = qk(q.v[k]), b = qk(q.v[(k + 1) % q.v.length]), key = a < b ? a + '|' + b : b + '|' + a;
        for (const nb of adj.get(key) || []) if (status[nb] < 0) { status[nb] = status[i]; st.push(nb); }
      }
    }
  }
  for (let i = 0; i < m; i++) {
    const p = polys[i];
    if (status[i] >= 0) { res.push({ p, c: status[i] ? 'in' : 'out' }); continue; }
    let pieces = [p];
    const { cuts, copl } = info[i];
    for (const q of cuts) { const seg = crossSegment(q, p); if (seg) pieces = splitBy(pieces, { n: q.n, w: q.w }, seg); }
    for (const q of copl) for (let k = 0; k < q.v.length; k++) {
      const a = q.v[k], b = q.v[(k + 1) % q.v.length], ed = vsub(b, a), L = vlen(ed); if (L < 1e-9) continue;
      const nn = vnorm(cross(p.n, ed));
      pieces = splitBy(pieces, { n: nn, w: vdot(nn, a) }, [a, b]);
    }
    spend(pieces.length);
    for (const pc of pieces) {
      const c = centroid(pc.v);
      let cls = null;
      for (const q of copl) if (Math.abs(vdot(q.n, c) - q.w) < EPS * 2 && pointInConvex(c, q, -EPS)) { cls = vdot(q.n, pc.n) > 0 ? 'same' : 'opp'; break; }
      if (!cls) cls = insideSolid(c, other, obvh) ? 'in' : 'out';
      res.push({ p: pc, c: cls });
    }
  }
  return res;
}
const KEEP = {
  union: { a: { out: 1, same: 1 }, b: { out: 1 } },
  subtract: { a: { out: 1, opp: 1 }, b: { in: 1 } },
  intersect: { a: { in: 1, same: 1 }, b: { in: 1 } }
};
function meshBoolean(a, b, op) {
  const A = a.map(clonePoly), B = b.map(clonePoly);
  const bvA = buildBVH(A), bvB = buildBVH(B), boxA = bbox(A), boxB = bbox(B);
  const ca = classifySide(A, B, bvB, boxB), cb = classifySide(B, A, bvA, boxA);
  const rule = KEEP[op], out = [];
  for (const x of ca) if (rule.a[x.c]) out.push(x.p);
  for (const x of cb) if (rule.b[x.c]) { const p = clonePoly(x.p); if (op === 'subtract') flipPoly(p); out.push(p); }
  return clean(out);
}

/* ---------- cleanup: quantise, merge coplanar polygons, weld T-junctions ---------- */
function convexOK(v, n) {
  const m = v.length;
  for (let i = 0; i < m; i++) {
    const a = v[i], b = v[(i + 1) % m], c = v[(i + 2) % m];
    if (vdot(cross(vsub(b, a), vsub(c, b)), n) < -1e-7) return false;
  }
  return true;
}
/* greedily merge adjacent coplanar polygons (vertex loops) while the result stays convex */
function mergeLoops(list, n) {
  const alive = list.map(v => v.slice()), em = new Map();
  const ek = (a, b) => qk(a) + '>' + qk(b);
  const index = pi => { const v = alive[pi]; for (let i = 0; i < v.length; i++) em.set(ek(v[i], v[(i + 1) % v.length]), pi); };
  alive.forEach((v, pi) => index(pi));
  let changed = true, guard = 0;
  while (changed && guard++ < 50) {
    changed = false;
    for (let pi = 0; pi < alive.length; pi++) {
      let v = alive[pi]; if (!v) continue;
      for (let i = 0; i < v.length; i++) {
        const a = v[i], b = v[(i + 1) % v.length], oj = em.get(ek(b, a));
        if (oj === undefined || oj === pi || !alive[oj]) continue;
        const w = alive[oj], j = w.findIndex((q, k) => qk(q) === qk(b) && qk(w[(k + 1) % w.length]) === qk(a));
        if (j < 0) continue;
        const merged = [];
        for (let k = 0; k < v.length; k++) merged.push(v[(i + 1 + k) % v.length]);
        for (let k = 2; k < w.length; k++) merged.push(w[(j + k) % w.length]);
        if (merged.length < 3 || !convexOK(merged, n)) continue;
        for (let k = 0; k < v.length; k++) em.delete(ek(v[k], v[(k + 1) % v.length]));
        for (let k = 0; k < w.length; k++) em.delete(ek(w[k], w[(k + 1) % w.length]));
        alive[oj] = null; alive[pi] = merged; index(pi); v = merged; i = -1; changed = true;
      }
    }
  }
  return alive.filter(Boolean);
}
/* triangulate a planar region given as boundary loops (outer CCW, holes CW in 2D) */
function triangulateRegion(loops2, loops3) {
  const outers = [], holes = [];
  loops2.forEach((l, i) => (area2D(l) > 0 ? outers : holes).push(i));
  const segsCross = (p1, p2, p3, p4) => {
    const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
    return ((d1 > 1e-12 && d2 < -1e-12) || (d1 < -1e-12 && d2 > 1e-12)) && ((d3 > 1e-12 && d4 < -1e-12) || (d3 < -1e-12 && d4 > 1e-12));
  };
  const tris = [];
  for (const oi of outers) {
    let P2 = loops2[oi].slice(), P3 = loops3[oi].slice();
    const my = holes.filter(hi => inPoly2D(loops2[hi][0], loops2[oi]) && !outers.some(o2 => o2 !== oi && area2D(loops2[o2]) < area2D(loops2[oi]) && inPoly2D(loops2[hi][0], loops2[o2]) && inPoly2D(loops2[o2][0], loops2[oi])));
    my.sort((a, b) => Math.max(...loops2[b].map(p => p[0])) - Math.max(...loops2[a].map(p => p[0])));
    for (const hi of my) {
      const H2 = loops2[hi], H3 = loops3[hi];
      let mi = 0; H2.forEach((p, i) => { if (p[0] > H2[mi][0]) mi = i; });
      const M = H2[mi], allLoops = [P2, ...my.map(h => loops2[h])];
      const cand = P2.map((p, i) => [i, (p[0] - M[0]) ** 2 + (p[1] - M[1]) ** 2]).sort((a, b) => a[1] - b[1]);
      let pick = -1;
      for (const [i] of cand) {
        const Pp = P2[i]; let ok = true;
        for (const L of allLoops) { for (let k = 0; k < L.length && ok; k++) if (segsCross(M, Pp, L[k], L[(k + 1) % L.length])) ok = false; if (!ok) break; }
        if (ok) { pick = i; break; }
      }
      if (pick < 0) return null;
      const rot2 = [], rot3 = [];
      for (let k = 0; k <= H2.length; k++) { rot2.push(H2[(mi + k) % H2.length]); rot3.push(H3[(mi + k) % H3.length]); }
      P2 = [...P2.slice(0, pick + 1), ...rot2, P2[pick], ...P2.slice(pick + 1)];
      P3 = [...P3.slice(0, pick + 1), ...rot3, P3[pick], ...P3.slice(pick + 1)];
    }
    for (const t of earclip(P2)) tris.push([P3[t[0]], P3[t[1]], P3[t[2]]]);
  }
  return tris;
}
/* rebuild every planar face from its boundary: removes BSP fragmentation inside faces */
function rebuildFaces(polys) {
  const groups = new Map();
  for (const p of polys) {
    const k = [Math.round(p.n[0] * 1e3), Math.round(p.n[1] * 1e3), Math.round(p.n[2] * 1e3), Math.round(p.w * 1e2)].join();
    let g = groups.get(k); if (!g) groups.set(k, g = []); g.push(p);
  }
  const out = [];
  for (const g of groups.values()) {
    if (g.length < 2) { out.push(...g); continue; }
    const n = vnorm(g.reduce((s, p) => vadd(s, vmul(p.n, p.v.length)), [0, 0, 0]));
    const cnt = new Map(), pts = new Map();
    for (const p of g) for (let i = 0; i < p.v.length; i++) {
      const a = p.v[i], b = p.v[(i + 1) % p.v.length], ka = qk(a), kb = qk(b); if (ka === kb) continue;
      pts.set(ka, a); pts.set(kb, b);
      const rk = kb + '>' + ka;
      if (cnt.get(rk) > 0) cnt.set(rk, cnt.get(rk) - 1); else cnt.set(ka + '>' + kb, (cnt.get(ka + '>' + kb) || 0) + 1);
    }
    const next = new Map(); let ok = true;
    for (const [k, c] of cnt) { if (c <= 0) continue; if (c > 1) { ok = false; break; } const [a, b] = k.split('>'); let l = next.get(a); if (!l) next.set(a, l = []); l.push(b); }
    const loops3 = [];
    if (ok) {
      for (const start of Array.from(next.keys())) {
        while (next.get(start) && next.get(start).length) {
          const loop = [start]; let cur = next.get(start).pop(), guard = 0;
          while (cur !== start && guard++ < 100000) { loop.push(cur); const l = next.get(cur); if (!l || !l.length) { ok = false; break; } cur = l.pop(); }
          if (!ok) break;
          loops3.push(loop.map(k => pts.get(k)));
        }
        if (!ok) break;
      }
    }
    let rebuilt = null;
    if (ok && loops3.length) {
      const u = vnorm(Math.abs(n[0]) < 0.9 ? cross(n, [1, 0, 0]) : cross(n, [0, 1, 0])), v = cross(n, u);
      const loops2 = loops3.map(l => l.map(q => [vdot(q, u), vdot(q, v)]));
      const tris = triangulateRegion(loops2, loops3);
      if (tris) {
        const areaIn = g.reduce((s, p) => s + vlen(newellVec(p.v)) / 2, 0), areaOut = tris.reduce((s, t) => s + vlen(newellVec(t)) / 2, 0);
        if (Math.abs(areaIn - areaOut) < 1e-4 * Math.max(1, areaIn)) rebuilt = mergeLoops(tris.filter(t => vlen(newellVec(t)) > 1e-10), n).map(mkPoly).filter(Boolean);
      }
    }
    out.push(...(rebuilt || g));
  }
  return out;
}
function weldT(polys) {
  /* only edges without a matching reverse edge can carry a T-junction; candidates are the endpoints of such edges */
  const dir = new Set();
  for (const p of polys) for (let i = 0; i < p.v.length; i++) dir.add(qk(p.v[i]) + '>' + qk(p.v[(i + 1) % p.v.length]));
  const vm = new Map(), verts = [];
  for (const p of polys) for (let i = 0; i < p.v.length; i++) {
    const a = p.v[i], b = p.v[(i + 1) % p.v.length], ka = qk(a), kb = qk(b);
    if (dir.has(kb + '>' + ka)) continue;
    if (!vm.has(ka)) { vm.set(ka, 1); verts.push(a); }
    if (!vm.has(kb)) { vm.set(kb, 1); verts.push(b); }
  }
  if (!verts.length) return polys;
  const bb = bbox(polys), diag = vlen(vsub(bb.max, bb.min)), h = Math.max(diag / 40, 0.25), grid = new Map();
  const cell = x => Math.floor(x / h);
  verts.forEach((q, i) => { const k = cell(q[0]) + ',' + cell(q[1]) + ',' + cell(q[2]); let c = grid.get(k); if (!c) grid.set(k, c = []); c.push(i); });
  const TOL = 1.2e-3;
  return polys.map(p => {
    const out = [], n = p.v.length;
    for (let i = 0; i < n; i++) {
      const a = p.v[i], b = p.v[(i + 1) % n]; out.push(a);
      const ka = qk(a), kb = qk(b);
      if (dir.has(kb + '>' + ka)) continue;
      const ab = vsub(b, a), L2 = vdot(ab, ab); if (L2 < 1e-10) continue;
      const lo = [0, 1, 2].map(k => cell(Math.min(a[k], b[k]) - TOL)), hi = [0, 1, 2].map(k => cell(Math.max(a[k], b[k]) + TOL));
      const found = [];
      const test = q => {
        const kq = qk(q); if (kq === ka || kq === kb) return;
        const t = vdot(vsub(q, a), ab) / L2; if (t <= 1e-6 || t >= 1 - 1e-6) return;
        const d = vlen(vsub(q, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]));
        if (d < TOL) found.push([t, q]);
      };
      const nc = (hi[0] - lo[0] + 1) * (hi[1] - lo[1] + 1) * (hi[2] - lo[2] + 1);
      if (nc > verts.length) verts.forEach(test);
      else for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) {
        const c = grid.get(x + ',' + y + ',' + z); if (c) for (const idx of c) test(verts[idx]);
      }
      if (found.length) { found.sort((u, w) => u[0] - w[0]); let last = ka; for (const f of found) { const k = qk(f[1]); if (k !== last) { out.push(f[1]); last = k; } } }
    }
    return { v: out, n: p.n, w: p.w };
  });
}
const SNAP = 1.5e-3;
function clean(polys) {
  let out = [];
  const grid = new Map(), cs = SNAP * 2;
  const snap = pt => {
    const cx = Math.floor(pt[0] / cs), cy = Math.floor(pt[1] / cs), cz = Math.floor(pt[2] / cs);
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) for (let z = cz - 1; z <= cz + 1; z++) {
      const c = grid.get(x + ',' + y + ',' + z);
      if (c) for (const r of c) if (Math.abs(r[0] - pt[0]) < SNAP && Math.abs(r[1] - pt[1]) < SNAP && Math.abs(r[2] - pt[2]) < SNAP) return r;
    }
    const r = [qr(pt[0]), qr(pt[1]), qr(pt[2])], k = cx + ',' + cy + ',' + cz;
    let c = grid.get(k); if (!c) grid.set(k, c = []); c.push(r); return r;
  };
  for (const p of polys) {
    const v = [];
    for (const pt of p.v) {
      const q = snap(pt);
      if (!v.length || qk(q) !== qk(v[v.length - 1])) v.push(q);
    }
    while (v.length > 1 && qk(v[0]) === qk(v[v.length - 1])) v.pop();
    if (v.length < 3) continue;
    const np = mkPoly(v); if (!np) continue;
    const nv = newellVec(v); if (vlen(nv) / 2 < 1e-7) continue;
    out.push(np);
  }
  return rebuildFaces(weldT(out));
}

/* ---------- primitives (Z up, centred on origin) ---------- */
const ring = (r, n, z) => { const o = []; for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n; o.push([r * Math.cos(a), r * Math.sin(a), z]); } return o; };
function primitive(type, p) {
  let polys = [];
  const add = v => { const q = mkPoly(v); if (q) polys.push(q); };
  if (type === 'box') {
    const x = p.w / 2, y = p.d / 2, z = p.h / 2, P = (a, b, c) => [a * x, b * y, c * z];
    add([P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)]);
    add([P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1), P(1, -1, -1)]);
    add([P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)]);
    add([P(-1, 1, -1), P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1)]);
    add([P(1, 1, -1), P(-1, 1, -1), P(-1, 1, 1), P(1, 1, 1)]);
    add([P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1)]);
  } else if (type === 'cylinder' || type === 'cone') {
    const N = 48, h2 = p.h / 2, bot = ring(p.r, N, -h2);
    add(bot.slice().reverse());
    if (type === 'cylinder') {
      const top = ring(p.r, N, h2); add(top);
      for (let i = 0; i < N; i++) { const j = (i + 1) % N; add([bot[i], bot[j], top[j], top[i]]); }
    } else if (p.rt > 1e-3) { /* truncated cone (frustum) with top radius rt */
      const top = ring(p.rt, N, h2); add(top);
      for (let i = 0; i < N; i++) { const j = (i + 1) % N; add([bot[i], bot[j], top[j], top[i]]); }
    } else {
      for (let i = 0; i < N; i++) { const j = (i + 1) % N; add([bot[i], bot[j], [0, 0, h2]]); }
    }
  } else if (type === 'sphere') {
    const N = 40, M = 20, pt = (i, j) => { const th = Math.PI * j / M, a = 2 * Math.PI * (i % N) / N; return [p.r * Math.sin(th) * Math.cos(a), p.r * Math.sin(th) * Math.sin(a), p.r * Math.cos(th)]; };
    for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
      if (j === 0) add([pt(0, 0), pt(i + 1, 1), pt(i, 1)]);
      else if (j === M - 1) add([pt(i, j), pt(i + 1, j), pt(0, M)]);
      else add([pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)]);
    }
  } else if (type === 'torus') {
    const N = 48, M = 20, pt = (i, j) => { const a = 2 * Math.PI * (i % N) / N, b = 2 * Math.PI * (j % M) / M, rr = p.R + p.t * Math.cos(b); return [rr * Math.cos(a), rr * Math.sin(a), p.t * Math.sin(b)]; };
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) add([pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)]);
  }
  fixOrientation(polys);
  return clean(polys);
}

/* ---------- 2D helpers, profiles, extrusion ---------- */
const area2D = pts => { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
function inPoly2D(pt, poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins;
  }
  return ins;
}
function earclip(pts) {
  const n = pts.length, idx = []; for (let i = 0; i < n; i++) idx.push(i);
  const tris = [], a2 = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const inTri = (p, a, b, c) => a2(a, b, p) >= -1e-9 && a2(b, c, p) >= -1e-9 && a2(c, a, p) >= -1e-9;
  let guard = 0;
  while (idx.length > 3 && guard++ < 5000) {
    let ear = false;
    for (let i = 0; i < idx.length; i++) {
      const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length];
      const a = pts[ia], b = pts[ib], c = pts[ic];
      if (a2(a, b, c) <= 1e-12) continue;
      let ok = true;
      for (const j of idx) { if (j === ia || j === ib || j === ic) continue; if (inTri(pts[j], a, b, c)) { ok = false; break; } }
      if (ok) { tris.push([ia, ib, ic]); idx.splice(i, 1); ear = true; break; }
    }
    if (!ear) break;
  }
  if (idx.length === 3) tris.push(idx.slice());
  else if (idx.length > 3) for (let i = 1; i < idx.length - 1; i++) tris.push([idx[0], idx[i], idx[i + 1]]);
  return tris;
}
/* round every corner of a closed 2D loop with radius r (convex and concave corners) */
function roundCorners(pts, r) {
  if (!(r > 0) || pts.length < 3) return pts;
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    if (la < 1e-9 || lb < 1e-9) { out.push(p); continue; }
    const d1 = [(p[0] - a[0]) / la, (p[1] - a[1]) / la], d2 = [(b[0] - p[0]) / lb, (b[1] - p[1]) / lb];
    const theta = Math.acos(Math.max(-1, Math.min(1, -(d1[0] * d2[0] + d1[1] * d2[1]))));
    if (theta < 1e-3 || theta > Math.PI - 1e-3) { out.push(p); continue; }
    let t = r / Math.tan(theta / 2), rr = r;
    const tmax = 0.5 * Math.min(la, lb) - 1e-6;
    if (t > tmax) { t = Math.max(tmax, 0); rr = t * Math.tan(theta / 2); }
    if (rr < 1e-6) { out.push(p); continue; }
    const T1 = [p[0] - d1[0] * t, p[1] - d1[1] * t], T2 = [p[0] + d2[0] * t, p[1] + d2[1] * t];
    let bx = -d1[0] + d2[0], by = -d1[1] + d2[1]; const bl = Math.hypot(bx, by) || 1; bx /= bl; by /= bl;
    const h = rr / Math.sin(theta / 2), C = [p[0] + bx * h, p[1] + by * h];
    const a1 = Math.atan2(T1[1] - C[1], T1[0] - C[0]), a2 = Math.atan2(T2[1] - C[1], T2[0] - C[0]);
    let da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    const N = Math.max(2, Math.ceil(Math.abs(da) / (Math.PI / 16)));
    for (let k = 0; k <= N; k++) { const ang = a1 + da * k / N; out.push([C[0] + rr * Math.cos(ang), C[1] + rr * Math.sin(ang)]); }
  }
  return out;
}
/* centripetal Catmull-Rom curve through the given points */
/* lin: indices of straight segments (from P[i] to P[i+1]); curved neighbours of a straight segment end there like an open curve */
function splinePoints(P, closed, seg, lin) {
  const n = P.length; if (n < 2) return P.map(p => p.slice());
  const S = seg || 16, out = [], L = lin && lin.length ? new Set(lin) : null;
  const get = i => (closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
  const segs = closed ? n : n - 1, isL = i => !!L && L.has(closed ? (i + segs) % segs : i);
  for (let i = 0; i < segs; i++) {
    if (isL(i)) { out.push(get(i).slice()); continue; }
    const p1 = get(i), p2 = get(i + 1), p0 = isL(i - 1) ? p1 : get(i - 1), p3 = isL(i + 1) ? p2 : get(i + 2);
    const tj = (a, b) => Math.max(Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5), 1e-6);
    const t0 = 0, t1 = t0 + tj(p0, p1), t2 = t1 + tj(p1, p2), t3 = t2 + tj(p2, p3);
    const lerp = (a, b, ta, tb, t) => { const w = (tb - ta) || 1e-9; return [a[0] * (tb - t) / w + b[0] * (t - ta) / w, a[1] * (tb - t) / w + b[1] * (t - ta) / w]; };
    for (let k = 0; k < S; k++) {
      const t = t1 + (t2 - t1) * k / S;
      const A1 = lerp(p0, p1, t0, t1, t), A2 = lerp(p1, p2, t1, t2, t), A3 = lerp(p2, p3, t2, t3, t);
      const B1 = lerp(A1, A2, t0, t2, t), B2 = lerp(A2, A3, t1, t3, t);
      out.push(lerp(B1, B2, t1, t2, t));
    }
  }
  if (!closed) out.push(P[n - 1].slice());
  return out;
}
function profilePoints(pr) {
  let pts;
  if (pr.t === 'rect') {
    const x0 = Math.min(pr.x, pr.x + pr.w), x1 = Math.max(pr.x, pr.x + pr.w), y0 = Math.min(pr.y, pr.y + pr.h), y1 = Math.max(pr.y, pr.y + pr.h);
    pts = roundCorners([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], pr.fr);
  } else if (pr.t === 'circle') {
    const N = 64; pts = []; for (let i = 0; i < N; i++) { const a = 2 * Math.PI * i / N; pts.push([pr.x + pr.r * Math.cos(a), pr.y + pr.r * Math.sin(a)]); }
  } else if (pr.t === 'spline') {
    pts = splinePoints(pr.pts, true, 16, pr.lin);
  } else if (pr.t === 'ellipse') {
    const N = 72, a0 = (pr.a || 0) * Math.PI / 180, ca = Math.cos(a0), sa = Math.sin(a0); pts = [];
    for (let i = 0; i < N; i++) { const t = 2 * Math.PI * i / N, x = pr.rx * Math.cos(t), y = pr.ry * Math.sin(t); pts.push([pr.x + x * ca - y * sa, pr.y + x * sa + y * ca]); }
  } else if (pr.t === 'ngon') {
    const n = Math.max(3, Math.min(64, Math.round(pr.n) || 6)), a0 = (pr.a || 0) * Math.PI / 180;
    pts = []; for (let i = 0; i < n; i++) { const a = a0 + 2 * Math.PI * i / n; pts.push([pr.x + pr.r * Math.cos(a), pr.y + pr.r * Math.sin(a)]); }
    pts = roundCorners(pts, pr.fr);
  } else if (pr.t === 'slot') {
    const dx = pr.x2 - pr.x1, dy = pr.y2 - pr.y1, L = Math.hypot(dx, dy), r = Math.abs(pr.w) / 2, base = L > 1e-9 ? Math.atan2(dy, dx) : 0, M = 24;
    pts = [];
    for (let i = 0; i <= M; i++) { const a = base - Math.PI / 2 + Math.PI * i / M; pts.push([pr.x2 + r * Math.cos(a), pr.y2 + r * Math.sin(a)]); }
    for (let i = 0; i <= M; i++) { const a = base + Math.PI / 2 + Math.PI * i / M; pts.push([pr.x1 + r * Math.cos(a), pr.y1 + r * Math.sin(a)]); }
    if (L <= 1e-9) pts = pts.slice(0, -1);
  } else {
    pts = pr.pts.map(p => p.slice());
    if (pr.closed && pr.fr > 0) { if (area2D(pts) < 0) pts.reverse(); pts = roundCorners(pts, pr.fr); }
  }
  if (area2D(pts) < 0) pts.reverse();
  return pts;
}
function extrudeLoop(pts, B, z0, z1) {
  const to3 = (p, z) => [B.o[0] + B.u[0] * p[0] + B.v[0] * p[1] + B.n[0] * z, B.o[1] + B.u[1] * p[0] + B.v[1] * p[1] + B.n[1] * z, B.o[2] + B.u[2] * p[0] + B.v[2] * p[1] + B.n[2] * z];
  const bot = pts.map(p => to3(p, z0)), top = pts.map(p => to3(p, z1)), out = [], n = pts.length;
  const add = v => { const q = mkPoly(v); if (q) out.push(q); };
  let convex = true;
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], c = pts[(i + 2) % n]; if ((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) < -1e-9) convex = false; }
  if (convex) { add(top); add(bot.slice().reverse()); }
  else for (const t of earclip(pts)) { add([top[t[0]], top[t[1]], top[t[2]]]); add([bot[t[2]], bot[t[1]], bot[t[0]]]); }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; add([bot[i], bot[j], top[j], top[i]]); }
  return out;
}
/* build a solid from nested profiles: even nesting depth = material, odd = holes */
function profileSolids(profiles, makeLoop) {
  const loops = profiles.map(profilePoints).filter(p => p.length >= 3 && Math.abs(area2D(p)) > 1e-9);
  const info = loops.map((p, i) => ({ p, i, a: Math.abs(area2D(p)), parents: [] }));
  info.forEach(A => info.forEach(Bq => { if (A !== Bq && Bq.a > A.a && A.p.every(pt => inPoly2D(pt, Bq.p))) A.parents.push(Bq); }));
  info.forEach(A => { A.depth = A.parents.length; A.parent = A.parents.sort((s, t) => s.a - t.a)[0] || null; });
  let result = [];
  for (const A of info.filter(x => x.depth % 2 === 0)) {
    let solid = fixOrientation(clean(makeLoop(A.p, false)));
    for (const H of info.filter(x => x.depth % 2 === 1 && x.parent === A)) solid = boolean(solid, makeLoop(H.p, true), 'subtract');
    result = result.length ? boolean(result, solid, 'union') : solid;
  }
  return result;
}
/* profiles: [{t:'rect'|'circle'|'poly'|...}] in plane B={o,u,v,n}; extrudes from z0 to z1 along n. Nested profiles become holes. */
function extrudeProfiles(profiles, B, z0, z1) {
  return profileSolids(profiles, (p, hole) => extrudeLoop(p, B, hole ? z0 - 1 : z0, hole ? z1 + 1 : z1));
}
/* revolve a CCW 2D loop around an in-plane axis {p:[x,y], d:[dx,dy]} by angle (radians) */
function revolveLoop(pts, B, ax, angle, grow) {
  const d = [ax.d[0], ax.d[1]], dl = Math.hypot(d[0], d[1]); d[0] /= dl; d[1] /= dl;
  const per = [-d[1], d[0]];
  const pl = (x, y) => [B.u[0] * x + B.v[0] * y, B.u[1] * x + B.v[1] * y, B.u[2] * x + B.v[2] * y];
  const A3 = vadd(B.o, pl(ax.p[0], ax.p[1])), D3 = pl(d[0], d[1]);
  let R3 = pl(per[0], per[1]), W3 = B.n.slice();
  let sh = pts.map(p => { const q = [p[0] - ax.p[0], p[1] - ax.p[1]]; return [q[0] * d[0] + q[1] * d[1], q[0] * per[0] + q[1] * per[1]]; });
  const neg = sh.some(q => q[1] < -1e-6), pos = sh.some(q => q[1] > 1e-6);
  if (neg && pos) throw new Error('Profil protíná osu rotace.');
  if (neg) { sh = sh.map(q => [q[0], -q[1]]); R3 = vmul(R3, -1); W3 = vmul(W3, -1); }
  sh = sh.map(q => [q[0], Math.max(0, q[1])]);
  if (area2D(sh) < 0) sh.reverse();
  if (grow) { /* holes are grown slightly along the axis so their faces never coincide */
    const c = sh.reduce((s, q) => [s[0] + q[0] / sh.length, s[1] + q[1] / sh.length], [0, 0]);
    sh = sh.map(q => [c[0] + (q[0] - c[0]) * 1.0005, q[1]]);
  }
  const full = Math.abs(Math.abs(angle) - 2 * Math.PI) < 1e-6;
  const N = Math.max(6, Math.ceil(Math.abs(angle) / (Math.PI / 24)));
  const rot = (q, th) => { const c = Math.cos(th), s = Math.sin(th); return vadd(vadd(A3, vmul(D3, q[0])), vadd(vmul(R3, q[1] * c), vmul(W3, q[1] * s))); };
  const rings = []; for (let j = 0; j <= N; j++) rings.push(sh.map(q => rot(q, angle * j / N)));
  const out = [], n = sh.length;
  const add = v => { const u = []; for (const p of v) if (!u.length || qk(u[u.length - 1]) !== qk(p)) u.push(p); while (u.length > 1 && qk(u[0]) === qk(u[u.length - 1])) u.pop(); if (u.length >= 3) { const q = mkPoly(u); if (q) out.push(q); } };
  const flip = angle < 0;
  for (let j = 0; j < N; j++) {
    const r0 = rings[j], r1 = full && j === N - 1 ? rings[0] : rings[j + 1];
    for (let i = 0; i < n; i++) { const k = (i + 1) % n, q = [r0[i], r0[k], r1[k], r1[i]]; add(flip ? q.reverse() : q); }
  }
  if (!full) {
    const sweepDir = th => { const c = Math.cos(th), s = Math.sin(th); return vmul(vadd(vmul(R3, -s), vmul(W3, c)), angle < 0 ? -1 : 1); };
    for (const [ring, th, sign] of [[rings[0], 0, -1], [rings[N], angle, 1]]) {
      const want = vmul(sweepDir(th), sign);
      for (const t of capTris(ring)) { const nv = newellVec(t); add(vdot(nv, want) >= 0 ? t : [t[0], t[2], t[1]]); }
    }
  }
  return out;
}
function revolveProfiles(profiles, B, ax, angle) {
  return profileSolids(profiles, (p, hole) => revolveLoop(p, B, ax, angle, hole));
}

function mirror(polys, plane) {
  const m = plane === 'YZ' ? [-1, 1, 1] : plane === 'XZ' ? [1, -1, 1] : [1, 1, -1];
  return fixOrientation(polys.map(p => mkPoly(p.v.map(q => [q[0] * m[0], q[1] * m[1], q[2] * m[2]]).reverse())).filter(Boolean));
}
const surfaceArea = polys => polys.reduce((s, p) => s + vlen(newellVec(p.v)) / 2, 0);
/* triangles (flat array, 9 numbers each) -> cleaned solid */
function fromTriangles(arr) {
  const out = [];
  for (let i = 0; i + 8 < arr.length; i += 9) { const q = mkPoly([[arr[i], arr[i + 1], arr[i + 2]], [arr[i + 3], arr[i + 4], arr[i + 5]], [arr[i + 6], arr[i + 7], arr[i + 8]]]); if (q) out.push(q); }
  fixOrientation(out);
  const res = clean(out);
  let open = 0; for (const e of edgeMapOf(res).values()) if (e.ps.length !== 2) open++;
  return { polys: res, open };
}


/* make neighbouring polygons agree on orientation (flood fill over shared edges) */
function orientConsistently(polys) {
  const em = new Map();
  polys.forEach((p, i) => { for (let k = 0; k < p.v.length; k++) { const a = qk(p.v[k]), b = qk(p.v[(k + 1) % p.v.length]), key = a < b ? a + '|' + b : b + '|' + a; let l = em.get(key); if (!l) em.set(key, l = []); l.push([i, a < b]); } });
  const done = new Uint8Array(polys.length), flip = new Uint8Array(polys.length);
  for (let s = 0; s < polys.length; s++) {
    if (done[s]) continue; done[s] = 1;
    const st = [s];
    while (st.length) {
      const i = st.pop(), p = polys[i];
      for (let k = 0; k < p.v.length; k++) {
        const a = qk(p.v[k]), b = qk(p.v[(k + 1) % p.v.length]), key = a < b ? a + '|' + b : b + '|' + a;
        const myDir = (a < b) !== !!flip[i];
        for (const [j, d] of em.get(key)) { if (j === i || done[j]) continue; flip[j] = (d === myDir) ? 1 : 0; done[j] = 1; st.push(j); }
      }
    }
  }
  polys.forEach((p, i) => { if (flip[i]) flipPoly(p); });
  return fixOrientation(polys);
}
/* helical thread groove between a constant-radius cylinder and a trapezoidal thread profile */
function threadGroove(sp) {
  const a = vnorm(sp.ax), t = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = vnorm(cross(a, t)), v = cross(a, u);
  const P = sp.pitch, len = sp.len, Nt = sp.segs || 48, Nz = Math.max(2, Math.ceil(len / (P / 8)));
  const c = sp.crestF, r = sp.rootF, f = (1 - c - r) / 2;
  const wave = ph => (ph < c ? 1 : ph < c + f ? 1 - (ph - c) / f : ph < c + f + r ? 0 : (ph - c - f - r) / f);
  const sgn = sp.left ? 1 : -1;
  const rVar = (i, z) => { let ph = ((z + sp.z0 + sgn * P * i / Nt) / P) % 1; if (ph < 0) ph += 1; return sp.rRoot + (sp.rCrest - sp.rRoot) * wave(ph); };
  const cs = [], sn = []; for (let i = 0; i < Nt; i++) { const th = 2 * Math.PI * i / Nt; cs.push(Math.cos(th)); sn.push(Math.sin(th)); }
  const pt = (i, z, rad) => [sp.o[0] + a[0] * z + (u[0] * cs[i] + v[0] * sn[i]) * rad, sp.o[1] + a[1] * z + (u[1] * cs[i] + v[1] * sn[i]) * rad, sp.o[2] + a[2] * z + (u[2] * cs[i] + v[2] * sn[i]) * rad];
  const V = []; for (let j = 0; j <= Nz; j++) { const z = len * j / Nz, row = []; for (let i = 0; i < Nt; i++) row.push(pt(i, z, rVar(i, z))); V.push(row); }
  const C0 = [], C1 = []; for (let i = 0; i < Nt; i++) { C0.push(pt(i, 0, sp.rConst)); C1.push(pt(i, len, sp.rConst)); }
  const out = [], add = vs => { const q = mkPoly(vs); if (q) out.push(q); };
  for (let j = 0; j < Nz; j++) for (let i = 0; i < Nt; i++) { const k = (i + 1) % Nt; add([V[j][i], V[j][k], V[j + 1][k]]); add([V[j][i], V[j + 1][k], V[j + 1][i]]); }
  for (let i = 0; i < Nt; i++) {
    const k = (i + 1) % Nt;
    add([C0[i], C1[i], C1[k], C0[k]]);
    add([V[0][i], C0[i], C0[k], V[0][k]]);
    add([V[Nz][i], V[Nz][k], C1[k], C1[i]]);
  }
  return orientConsistently(out);
}

/* boundary loops (3D) of a set of coplanar polygons given by index */
function faceLoops(polys, idxs) {
  const cnt = new Map(), pts = new Map();
  for (const i of idxs) {
    const p = polys[i];
    for (let k = 0; k < p.v.length; k++) {
      const a = p.v[k], b = p.v[(k + 1) % p.v.length], ka = qk(a), kb = qk(b); if (ka === kb) continue;
      pts.set(ka, a); pts.set(kb, b);
      const rk = kb + '>' + ka;
      if (cnt.get(rk) > 0) cnt.set(rk, cnt.get(rk) - 1); else cnt.set(ka + '>' + kb, (cnt.get(ka + '>' + kb) || 0) + 1);
    }
  }
  const next = new Map();
  for (const [key, c] of cnt) { if (c <= 0) continue; const [a, b] = key.split('>'); let l = next.get(a); if (!l) next.set(a, l = []); for (let j = 0; j < c; j++) l.push(b); }
  const loops = [];
  for (const start of Array.from(next.keys())) {
    while (next.get(start) && next.get(start).length) {
      const loop = [start]; let cur = next.get(start).pop(), guard = 0;
      while (cur !== start && guard++ < 200000) { loop.push(cur); const l = next.get(cur); if (!l || !l.length) break; cur = l.pop(); }
      if (cur === start && loop.length >= 3) loops.push(loop.map(x => pts.get(x)));
    }
  }
  return loops;
}
/* coplanar connected patch containing point p (plane n, w) */
function planarFace(polys, n, w, p) {
  const ok = i => vdot(polys[i].n, n) > 0.9999 && Math.abs(polys[i].w - w) < 2e-3;
  let seed = -1;
  for (let i = 0; i < polys.length && seed < 0; i++) if (ok(i) && pointInConvex(p, polys[i], 1e-3)) seed = i;
  if (seed < 0) return null;
  const em = edgeMapOf(polys), adj = polys.map(() => []);
  for (const e of em.values()) if (e.ps.length === 2) { adj[e.ps[0]].push(e.ps[1]); adj[e.ps[1]].push(e.ps[0]); }
  const group = new Set([seed]), st = [seed];
  while (st.length) { const i = st.pop(); for (const j of adj[i]) if (!group.has(j) && ok(j)) { group.add(j); st.push(j); } }
  return [...group];
}

/* fast path for imported meshes: weld equal vertices, orient, merge flat areas only on smaller meshes */
function fromTrianglesFast(arr) {
  const nv = arr.length / 3, map = new Map(), V = [], idx = new Int32Array(nv);
  for (let i = 0; i < nv; i++) {
    const x = arr[3 * i], y = arr[3 * i + 1], z = arr[3 * i + 2];
    const key = Math.round(x * 1e4) + ',' + Math.round(y * 1e4) + ',' + Math.round(z * 1e4);
    let j = map.get(key);
    if (j === undefined) { j = V.length; map.set(key, j); V.push([qr(x), qr(y), qr(z)]); }
    idx[i] = j;
  }
  let polys = [];
  const seen = new Set();
  for (let t = 0; t < nv; t += 3) {
    const a = idx[t], b = idx[t + 1], c = idx[t + 2];
    if (a === b || b === c || a === c) continue;
    const s = [a, b, c].sort((p, q) => p - q).join(',');
    if (seen.has(s)) continue; seen.add(s);
    const q = mkPoly([V[a], V[b], V[c]]); if (q) out1(q);
  }
  function out1(q) { polys.push(q); }
  fixOrientation(polys);
  if (polys.length <= 60000) polys = rebuildFaces(polys);
  const N = V.length + 1, ec = new Map(), vid = new Map(); V.forEach((v, i) => vid.set(v, i));
  for (const p of polys) for (let i = 0; i < p.v.length; i++) {
    let a = vid.get(p.v[i]), b = vid.get(p.v[(i + 1) % p.v.length]);
    if (a === undefined || b === undefined) continue;
    if (a > b) { const t2 = a; a = b; b = t2; }
    const key = a * N + b; ec.set(key, (ec.get(key) || 0) + 1);
  }
  let open = 0; for (const c of ec.values()) if (c !== 2) open++;
  return { polys, open };
}
/* vertex-clustering simplification of a triangle soup to roughly `target` triangles */
function decimateTris(arr, target) {
  const n = arr.length / 9;
  if (n <= target) return arr;
  let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity], el = 0;
  for (let i = 0; i < arr.length; i += 3) for (let k = 0; k < 3; k++) { const v = arr[i + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
  for (let t = 0; t < arr.length; t += 9 * Math.max(1, Math.floor(n / 20000))) el += Math.hypot(arr[t] - arr[t + 3], arr[t + 1] - arr[t + 4], arr[t + 2] - arr[t + 5]);
  el /= Math.min(n, 20000) || 1;
  const cnt = h => {
    let c = 0;
    for (let t = 0; t < arr.length; t += 9) {
      const k = o => Math.floor((arr[t + o] - mn[0]) / h) + ':' + Math.floor((arr[t + o + 1] - mn[1]) / h) + ':' + Math.floor((arr[t + o + 2] - mn[2]) / h);
      const a = k(0), b = k(3), d = k(6); if (a !== b && b !== d && a !== d) c++;
    }
    return c;
  };
  let h = Math.max(el, 1e-6) * Math.sqrt(n / target) * 0.75;
  for (let it = 0; it < 4; it++) { const c = cnt(h); if (Math.abs(c - target) < target * 0.15) break; h *= Math.sqrt(Math.max(c, 1) / target); }
  const cl = new Map(), out = [];
  const cell = o => Math.floor((arr[o] - mn[0]) / h) + ':' + Math.floor((arr[o + 1] - mn[1]) / h) + ':' + Math.floor((arr[o + 2] - mn[2]) / h);
  const ids = new Int32Array(arr.length / 3), sums = [];
  for (let i = 0; i < arr.length / 3; i++) {
    const key = cell(3 * i); let j = cl.get(key);
    if (j === undefined) { j = sums.length; cl.set(key, j); sums.push([0, 0, 0, 0]); }
    const s = sums[j]; s[0] += arr[3 * i]; s[1] += arr[3 * i + 1]; s[2] += arr[3 * i + 2]; s[3]++; ids[i] = j;
  }
  const seen = new Set();
  for (let t = 0; t < ids.length; t += 3) {
    const a = ids[t], b = ids[t + 1], c = ids[t + 2];
    if (a === b || b === c || a === c) continue;
    const key = [a, b, c].sort((p, q) => p - q).join(',');
    if (seen.has(key)) continue; seen.add(key);
    for (const j of [a, b, c]) { const s = sums[j]; out.push(s[0] / s[3], s[1] / s[3], s[2] / s[3]); }
  }
  return Float32Array.from(out);
}
/* ---------- rendering helpers ---------- */
function renderMesh(polys, crease) {
  const cs = crease === undefined ? Math.cos(35 * Math.PI / 180) : crease;
  const vmap = new Map();
  polys.forEach((p, i) => p.v.forEach(q => { const k = qk(q); let l = vmap.get(k); if (!l) vmap.set(k, l = []); l.push(i); }));
  const pos = [], nor = [], triPoly = [];
  polys.forEach((p, i) => {
    const nrm = p.v.map(q => {
      const l = vmap.get(qk(q)); let s = [0, 0, 0];
      for (const j of l) { const nj = polys[j].n; if (vdot(nj, p.n) > cs) { s[0] += nj[0]; s[1] += nj[1]; s[2] += nj[2]; } }
      return vnorm(s);
    });
    for (let k = 1; k < p.v.length - 1; k++) {
      for (const idx of [0, k, k + 1]) { const q = p.v[idx]; pos.push(q[0], q[1], q[2]); const nn = nrm[idx]; nor.push(nn[0], nn[1], nn[2]); }
      triPoly.push(i);
    }
  });
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), triPoly: Uint32Array.from(triPoly) };
}
function edgeMapOf(polys) {
  const m = new Map();
  polys.forEach((p, pi) => {
    const n = p.v.length;
    for (let i = 0; i < n; i++) {
      const a = p.v[i], b = p.v[(i + 1) % n], ka = qk(a), kb = qk(b); if (ka === kb) continue;
      const k = ka < kb ? ka + '|' + kb : kb + '|' + ka; let e = m.get(k);
      if (!e) m.set(k, e = { a, b, ps: [] }); e.ps.push(pi);
    }
  });
  return m;
}
function featureEdges(polys, cosT) {
  const lim = cosT === undefined ? Math.cos(15 * Math.PI / 180) : cosT, out = [];
  for (const e of edgeMapOf(polys).values()) if (e.ps.length === 2 && vdot(polys[e.ps[0]].n, polys[e.ps[1]].n) < lim) out.push(e);
  return out;
}
function edgeSegments(polys) {
  const arr = []; for (const e of featureEdges(polys)) arr.push(e.a[0], e.a[1], e.a[2], e.b[0], e.b[1], e.b[2]);
  return new Float32Array(arr);
}
function circumcircle(A, B, C) {
  const ab = vsub(B, A), ac = vsub(C, A), w = cross(ab, ac), w2 = vdot(w, w);
  if (w2 < 1e-12) return null;
  const a11 = vdot(ab, ab), a12 = vdot(ab, ac), a22 = vdot(ac, ac), det = a11 * a22 - a12 * a12;
  const al = (a11 / 2 * a22 - a12 * a22 / 2) / det, be = (a11 * a22 / 2 - a12 * a11 / 2) / det;
  const c = vadd(A, vadd(vmul(ab, al), vmul(ac, be)));
  return { c, r: vlen(vsub(A, c)), axis: vnorm(w) };
}
function chainsOf(polys) {
  const edges = featureEdges(polys), adj = new Map(), byKey = new Map();
  edges.forEach((e, i) => {
    for (const p of [e.a, e.b]) { const k = qk(p); let l = adj.get(k); if (!l) adj.set(k, l = []); l.push(i); }
    byKey.set(qk(e.a) + '|' + qk(e.b), e); byKey.set(qk(e.b) + '|' + qk(e.a), e);
  });
  const used = new Array(edges.length).fill(false), chains = [], COS = Math.cos(30 * Math.PI / 180);
  const other = (e, k) => (qk(e.a) === k ? e.b : e.a);
  const extend = (pts, tail) => {
    for (;;) {
      const last = tail ? pts[pts.length - 1] : pts[0], prev = tail ? pts[pts.length - 2] : pts[1], k = qk(last), l = adj.get(k);
      if (!l || l.length !== 2) return;
      const nx = l.find(i => !used[i]); if (nx === undefined) return;
      const np = other(edges[nx], k), d1 = vnorm(vsub(last, prev)), d2 = vnorm(vsub(np, last));
      if (vdot(d1, d2) < COS) return;
      used[nx] = true; if (tail) pts.push(np); else pts.unshift(np);
      if (qk(np) === qk(tail ? pts[0] : pts[pts.length - 1])) return;
    }
  };
  const edgeOf = (a, b) => byKey.get(qk(a) + '|' + qk(b));
  let gid = 0;
  edges.forEach((e0, i) => {
    if (used[i]) return; used[i] = true;
    const pts = [e0.a, e0.b]; extend(pts, true);
    if (qk(pts[0]) !== qk(pts[pts.length - 1])) extend(pts, false);
    const closed = pts.length > 3 && qk(pts[0]) === qk(pts[pts.length - 1]);
    splitChain(pts, closed, edgeOf).forEach(s => { s.group = gid; chains.push(s); });
    gid++;
  });
  return chains;
}
function fitCircle(P) {
  const n = P.length; if (n < 3) return null;
  const cc = circumcircle(P[0], P[Math.floor(n / 3) || 1], P[Math.max(Math.floor(2 * n / 3), 2)]);
  if (!cc) return null;
  const tol = Math.min(0.01 * cc.r, 0.05) + 2e-3;
  for (const p of P) { const d = vsub(p, cc.c); if (Math.abs(vlen(d) - cc.r) > tol || Math.abs(vdot(d, cc.axis)) > tol) return null; }
  return cc;
}
/* split a tangent-continuous chain into straight lines, circular arcs and full circles */
function splitChain(pts, closed, edgeOf) {
  const ring = closed ? pts.slice(0, -1) : pts.slice();
  const n = ring.length;
  const dirAt = (i, j) => vnorm(vsub(ring[j], ring[i]));
  /* corners: vertices where the chain actually turns (drops collinear T-junction points) */
  const corner = [];
  for (let i = 0; i < n; i++) {
    if (!closed && (i === 0 || i === n - 1)) { corner.push(i); continue; }
    const a = ring[(i - 1 + n) % n], b = ring[i], c = ring[(i + 1) % n];
    if (vdot(vnorm(vsub(b, a)), vnorm(vsub(c, b))) < 1 - 1e-7) corner.push(i);
  }
  if (corner.length < 2) return [];
  const m = corner.length, S = closed ? m : m - 1; /* number of straight pieces between corners */
  const ci = k => corner[((k % m) + m) % m];
  const segLen = k => vlen(vsub(ring[ci(k + 1)], ring[ci(k)]));
  const turn = k => { /* turning angle at corner k (between piece k-1 and piece k) */
    const a = ring[ci(k - 1)], b = ring[ci(k)], c = ring[ci(k + 1)];
    return Math.acos(Math.max(-1, Math.min(1, vdot(vnorm(vsub(b, a)), vnorm(vsub(c, b))))));
  };
  const similar = (x, y) => x > 1e-3 && y > 1e-3 && x / y < 1.7 && y / x < 1.7;
  const arcLink = k => similar(turn(k), turn(k + 1)) && similar(segLen(k - 1), segLen(k)) && similar(segLen(k), segLen(k + 1)); /* piece k continues an arc */
  const piecePts = (k0, k1) => { /* original points from corner k0 to corner k1 (k1 > k0) */
    const out = [], s = ci(k0), e = ci(k1);
    let i = s; out.push(ring[i]);
    while (i !== e) { i = (i + 1) % n; out.push(ring[i]); if (out.length > n + 1) break; }
    return out;
  };
  if (closed && m >= 8) {
    let all = true; for (let k = 0; k < m && all; k++) if (!(similar(turn(k), turn(k + 1)) && similar(segLen(k), segLen(k + 1)))) all = false;
    if (all) { const cr = corner.map(i => ring[i]), cc = fitCircle(cr); if (cc) return [{ kind: 'circle', closed: true, pts, ring: cr, circle: cc, e0: edgeOf(ring[0], ring[1]) }]; }
  }
  /* closed chains: start at a corner where an arc run begins or a line ends */
  let k0 = 0;
  if (closed) { for (let k = 0; k < m; k++) if (!similar(turn(k), turn(k + 1)) || !similar(segLen(k - 1), segLen(k))) { k0 = k; break; } }
  const out = [];
  let k = 0;
  while (k < S) {
    const kk = k0 + k;
    let e = k;
    if (k + 2 < S + (closed ? 0 : 0) && similar(turn(kk + 1), turn(kk + 2)) && similar(segLen(kk), segLen(kk + 1)) && similar(segLen(kk + 1), segLen(kk + 2))) {
      e = k + 2;
      while (e + 1 < S && similar(turn(k0 + e), turn(k0 + e + 1)) && similar(segLen(k0 + e), segLen(k0 + e + 1))) e++;
      const P = piecePts(kk, k0 + e + 1), CR = []; for (let q = kk; q <= k0 + e + 1; q++) CR.push(ring[ci(q)]);
      const cc = fitCircle(CR);
      if (cc) { out.push({ kind: 'arc', pts: P, ring: CR, circle: cc, e0: edgeOf(P[0], P[1]) }); k = e + 1; continue; }
    }
    const P = piecePts(kk, kk + 1);
    out.push({ kind: 'line', pts: P, line: { p0: P[0], p1: P[P.length - 1] }, e0: edgeOf(P[0], P[1]) });
    k++;
  }
  return out;
}

/* ---------- fillet / chamfer ---------- */
const DELTA = 0.05;
function section(E, f1, f2, alpha, k, mode) {
  let T1, T2; const arc = [];
  if (mode === 'chamfer') { T1 = vadd(E, vmul(f1, k)); T2 = vadd(E, vmul(f2, k)); }
  else {
    const half = alpha / 2, t = k / Math.tan(half), d = k / Math.sin(half), bis = vnorm(vadd(f1, f2)), O = vadd(E, vmul(bis, d));
    T1 = vadd(E, vmul(f1, t)); T2 = vadd(E, vmul(f2, t));
    const u1 = vmul(vsub(T1, O), 1 / k), u2 = vmul(vsub(T2, O), 1 / k), phi = Math.PI - alpha, N = Math.max(3, Math.ceil(phi / (Math.PI / 22)));
    for (let i = 1; i < N; i++) { const s = i / N; arc.push(vadd(O, vmul(vadd(vmul(u1, Math.sin((1 - s) * phi)), vmul(u2, Math.sin(s * phi))), k / Math.sin(phi)))); }
  }
  const mid = vmul(vadd(T1, T2), 0.5), Eo = vadd(E, vmul(vnorm(vsub(E, mid)), DELTA));
  if (mode !== 'chamfer') {
    /* move the tangent points slightly off their faces (out of the body on convex edges, into it on concave ones)
       so that no cutting plane grazes a face */
    const dl = Math.min(0.03, k * 0.01 + 0.01), c12 = vdot(f1, f2);
    const o1 = vnorm(vsub(vmul(f1, c12), f2)), o2 = vnorm(vsub(vmul(f2, c12), f1));
    T1 = vadd(T1, vmul(o1, dl)); T2 = vadd(T2, vmul(o2, dl));
  }
  return [Eo, T1, ...arc, T2];
}
/* triangulate a planar 3D loop (any simple polygon) */
function capTris(L) {
  const nv = vnorm(newellVec(L)), u = vnorm(Math.abs(nv[0]) < 0.9 ? cross(nv, [1, 0, 0]) : cross(nv, [0, 1, 0])), v = cross(nv, u);
  const P2 = L.map(q => [vdot(q, u), vdot(q, v)]);
  return earclip(P2).map(t => [L[t[0]], L[t[1]], L[t[2]]]);
}
function prism(A, B) {
  const nrm = newellVec(A), dir = vsub(centroid(B), centroid(A));
  if (vdot(nrm, dir) < 0) { A = A.slice().reverse(); B = B.slice().reverse(); }
  const out = [], n = A.length, add = v => { const q = mkPoly(v); if (q) out.push(q); };
  for (const t of capTris(B)) add(t);
  for (const t of capTris(A)) add([t[0], t[2], t[1]]);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; add([A[i], A[j], B[j], B[i]]); }
  return out;
}
function edgeFrame(polys, ch) {
  const e = ch.e0;
  if (!e || e.ps.length !== 2) return null;
  const A = polys[e.ps[0]], B = polys[e.ps[1]], M = mid3(e.a, e.b), t = vnorm(vsub(e.b, e.a));
  const into = P => { let d = vsub(centroid(P.v), M); d = vsub(d, vmul(t, vdot(d, t))); return vnorm(d); };
  const n1 = A.n, n2 = B.n;
  /* direction along each face, perpendicular to the edge, away from it */
  let f1 = vnorm(cross(t, n1)), f2 = vnorm(cross(t, n2));
  if (vdot(f1, into(A)) < 0) f1 = vmul(f1, -1);
  if (vdot(f2, into(B)) < 0) f2 = vmul(f2, -1);
  const convex = vdot(n2, f1) < 0;
  return { M, t, f1, f2, n1, n2, convex, alpha: Math.acos(Math.max(-1, Math.min(1, vdot(f1, f2)))) };
}
function ringSolid(c, axis, loop, rg, closed) {
  const m = rg.length, q = loop.length, out = [];
  const X = (i, j) => {
    const d = vsub(rg[j], c), rr = vnorm(vsub(d, vmul(axis, vdot(d, axis))));
    return vadd(vadd(c, vmul(rr, loop[i][0])), vmul(axis, loop[i][1]));
  };
  const add = v => { const p = mkPoly(v); if (p) out.push(p); };
  const J = closed ? m : m - 1;
  for (let j = 0; j < J; j++) for (let i = 0; i < q; i++) add([X(i, j), X((i + 1) % q, j), X((i + 1) % q, (j + 1) % m), X(i, (j + 1) % m)]);
  if (!closed) {
    const s0 = [], s1 = []; for (let i = 0; i < q; i++) { s0.push(X(i, 0)); s1.push(X(i, m - 1)); }
    /* caps: orient each so that it closes the ring consistently with the quads */
    const qn = newellVec([X(0, 0), X(1 % q, 0), X(1 % q, 1), X(0, 1)]);
    for (const t of capTris(s0)) add([t[0], t[2], t[1]]);
    for (const t of capTris(s1)) add(t);
    void qn;
  }
  return fixOrientation(out);
}
function removal(polys, ch, mode, k) {
  const fr = edgeFrame(polys, ch);
  if (!fr) return { err: 'Hranu nelze upravit.' };
  if (fr.alpha < 0.09 || fr.alpha > Math.PI - 0.09) return { err: 'Hrana je téměř rovná nebo příliš ostrá.' };
  const add = !fr.convex;
  if (ch.kind === 'line') {
    const { p0, p1 } = ch.line, L = vlen(vsub(p1, p0)), t = vnorm(vsub(p1, p0)), sM = vdot(vsub(fr.M, p0), t);
    if (k * Math.max(1, 1 / Math.tan(fr.alpha / 2)) > L * 4 + 50) return { err: 'Poloměr je pro tuto hranu příliš velký.' };
    const loop = section(fr.M, fr.f1, fr.f2, fr.alpha, k, mode);
    /* the cut runs 0.05 mm past an end where the edge ends in the open (a corner of the body), but stops exactly at an end
       where the body goes on beyond it (an edge standing on a ledge): running on would notch the ledge */
    let ext0 = 0, ext1 = 0;
    if (!add) {
      const bvh = buildBVH(polys), lc = vmul(loop.reduce((acc, p) => vadd(acc, p), [0, 0, 0]), 1 / loop.length);
      const past = s => vadd(lc, vmul(t, s - sM));
      ext0 = insideSolid(past(-0.03), polys, bvh) ? 0 : 0.05;
      ext1 = insideSolid(past(L + 0.03), polys, bvh) ? 0 : 0.05;
    }
    const A = loop.map(p => vadd(p, vmul(t, -ext0 - sM))), B = loop.map(p => vadd(p, vmul(t, L + ext1 - sM)));
    return { polys: fixOrientation(prism(A, B)), add };
  }
  if (ch.kind === 'circle' || ch.kind === 'arc') {
    const { c, axis, r } = ch.circle, rel = vsub(fr.M, c), rad = vnorm(vsub(rel, vmul(axis, vdot(rel, axis))));
    const E2 = [r, vdot(rel, axis)];
    const f2d = (n) => { const nn = vnorm([vdot(n, rad), vdot(n, axis)]); return [-nn[1], nn[0]]; };
    const pick = (n, f) => { const p = f2d(n), d = [vdot(f, rad), vdot(f, axis)]; return p[0] * d[0] + p[1] * d[1] >= 0 ? p : [-p[0], -p[1]]; };
    const g1 = pick(fr.n1, fr.f1), g2 = pick(fr.n2, fr.f2);
    const al = Math.acos(Math.max(-1, Math.min(1, g1[0] * g2[0] + g1[1] * g2[1])));
    const loop = section(E2, g1, g2, al, k, mode);
    if (loop.some(p => p[0] <= 1e-3)) return { err: 'Poloměr je pro tuto hranu příliš velký.' };
    return { polys: ringSolid(c, axis, loop, ch.ring, ch.kind === 'circle'), add };
  }
  return { err: 'Tento typ hrany zatím nelze upravit.' };
}
/* rolling-ball corners: where three or more convex filleted straight edges meet at a vertex, the edge cuts alone leave
   a spike (the corner lies inside all three cylinders but outside the ball). The corner cell between the three faces
   and their offsets by k, minus the ball of radius k touching all three faces, is cut away as well. */
function filletCorners(polys, chains, k) {
  const ends = new Map(), out = [];
  for (const ch of chains) {
    if (ch.kind !== 'line') continue;
    const fr = edgeFrame(polys, ch); if (!fr || !fr.convex) continue;
    for (const p of [ch.line.p0, ch.line.p1]) { const key = qk(p); if (!ends.has(key)) ends.set(key, { V: p, ns: [] }); const e = ends.get(key); for (const n of [fr.n1, fr.n2]) if (!e.ns.some(m => vdot(m, n) > 0.999)) e.ns.push(vnorm(n)); e.cnt = (e.cnt || 0) + 1; }
  }
  const solve = (N, b) => { /* 3x3: rows N[i]·x = b[i] */
    const [a, c, d] = N, det = vdot(a, cross(c, d)); if (Math.abs(det) < 1e-9) return null;
    return vmul(vadd(vadd(vmul(cross(c, d), b[0]), vmul(cross(d, a), b[1])), vmul(cross(a, c), b[2])), 1 / det);
  };
  for (const { V, ns, cnt } of ends.values()) {
    if (cnt < 3 || ns.length !== 3) continue;
    const base = ns.map(n => vdot(n, V)), C = solve(ns, base.map(b => b - k)); if (!C) continue;
    const P = (s0, s1, s2) => solve(ns, [base[0] + s0, base[1] + s1, base[2] + s2]);
    const o = Math.min(0.05, k * 0.05), lo = -k, S = [o, lo];
    const Q = []; for (const a of S) for (const b of S) for (const c of S) Q.push(P(a, b, c)); /* index = 4a + 2b + c */
    if (Q.some(q => !q)) continue;
    const cell = [];
    const cc = vmul(Q.reduce((t, q) => vadd(t, q), [0, 0, 0]), 1 / 8);
    const face = ids => { let v = ids.map(i => Q[i]); const fcn = vmul(v.reduce((t, q) => vadd(t, q), [0, 0, 0]), 1 / 4);
      if (vdot(newellVec(v), vsub(fcn, cc)) < 0) v = v.slice().reverse(); const q = mkPoly(v); if (q) cell.push(q); };
    face([0, 1, 3, 2]); face([4, 6, 7, 5]); face([0, 4, 5, 1]); face([2, 3, 7, 6]); face([0, 2, 6, 4]); face([1, 5, 7, 3]);
    fixOrientation(cell);
    const ball = translate(primitive('sphere', { r: k }), C);
    out.push(boolean(clean(cell), ball, 'subtract'));
  }
  return out;
}
function modifyEdges(polys, chains, mode, k) {
  const parts = [];
  for (const ch of chains) {
    const r = removal(polys, ch, mode, k);
    if (r.err) return { err: r.err };
    parts.push(r);
  }
  if (mode !== 'chamfer') for (const c of filletCorners(polys, chains, k)) parts.push({ polys: c, add: false });
  let cur = polys;
  for (const r of parts.filter(p => !p.add)) cur = boolean(cur, r.polys, 'subtract');
  for (const r of parts.filter(p => p.add)) cur = boolean(cur, r.polys, 'union');
  return { polys: cur };
}

/* ---------- (de)serialisation ---------- */
function pack(polys) {
  const map = new Map(), V = [], P = [];
  for (const p of polys) P.push(p.v.map(q => { const k = qk(q); let i = map.get(k); if (i === undefined) { i = V.length / 3; map.set(k, i); V.push(qr(q[0]), qr(q[1]), qr(q[2])); } return i; }));
  return { v: V, p: P };
}
function unpack(d) {
  const out = [];
  for (const idx of d.p) { const q = mkPoly(idx.map(i => [d.v[3 * i], d.v[3 * i + 1], d.v[3 * i + 2]])); if (q) out.push(q); }
  return out;
}

return { fromTrianglesFast, decimateTris, faceLoops, planarFace, pointInConvex, splinePoints, threadGroove, orientConsistently, setBsp: v => { USE_BSP = v; }, meshBoolean, setCull: v => { CULL = v; }, setRaw: v => { RAW = v; }, roundCorners, revolveProfiles, revolveLoop, mirror, surfaceArea, fromTriangles, fixOrientation, capTris, rebuildFaces, weldT, boolean, clean, primitive, extrudeProfiles, profilePoints, renderMesh, edgeSegments, chainsOf, edgeFrame, modifyEdges, removal,
         signedVolume, bbox, transform, translate, pack, unpack, mkPoly, edgeMapOf, featureEdges, inPoly2D, area2D, qk, vsub, vadd, vmul, vdot, vnorm, cross };
})();




