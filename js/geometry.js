// SkicaCAD – čistá geometrie (bez DOMu, testovatelná v Node)
// Jednotky: milimetry. Náčrty jsou v lokálních souřadnicích roviny (u, v).

export const PLANES = {
  XY: { name: 'XY – půdorys', u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1], axes: ['X', 'Y'] },
  XZ: { name: 'XZ – nárys', u: [1, 0, 0], v: [0, 0, 1], n: [0, -1, 0], axes: ['X', 'Z'] },
  YZ: { name: 'YZ – bokorys', u: [0, 1, 0], v: [0, 0, 1], n: [1, 0, 0], axes: ['Y', 'Z'] },
};

const EPS = 1e-9;

// ---------- Tvary náčrtu ----------
// rect:   {t:'rect', x1,y1,x2,y2}
// circle: {t:'circle', cx,cy,r}
// poly:   {t:'poly', pts:[[x,y],...], closed:bool}

export function isClosedShape(s) {
  if (s.t === 'rect') return Math.abs(s.x2 - s.x1) > 1e-6 && Math.abs(s.y2 - s.y1) > 1e-6;
  if (s.t === 'circle') return s.r > 1e-6;
  if (s.t === 'poly') return !!s.closed && s.pts.length >= 3 && Math.abs(polygonArea(s.pts)) > 1e-9;
  return false;
}

export function shapePolygon(s, segs = 72) {
  if (s.t === 'rect') {
    const x1 = Math.min(s.x1, s.x2), x2 = Math.max(s.x1, s.x2);
    const y1 = Math.min(s.y1, s.y2), y2 = Math.max(s.y1, s.y2);
    return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
  }
  if (s.t === 'circle') {
    const out = [];
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      out.push([s.cx + s.r * Math.cos(a), s.cy + s.r * Math.sin(a)]);
    }
    return out;
  }
  return s.pts.map((p) => [p[0], p[1]]);
}

export function polygonArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

export function pointInPolygon(pt, poly) {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polyInsidePoly(inner, outer) {
  return inner.every((p) => pointInPolygon(p, outer));
}

// Díry = uzavřené tvary ve stejném náčrtu přímo uvnitř vnějšího tvaru
export function findHoles(shapes, outer) {
  const outerPoly = shapePolygon(outer);
  const cands = shapes.filter((s) => s.id !== outer.id && isClosedShape(s) && polyInsidePoly(shapePolygon(s), outerPoly));
  return cands.filter((c) => {
    const cp = shapePolygon(c);
    return !cands.some((d) => d.id !== c.id && polyInsidePoly(cp, shapePolygon(d)));
  });
}

export function distToSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  let t = l2 < EPS ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

export function hitShape(s, p, tol) {
  if (s.t === 'circle') return Math.abs(Math.hypot(p[0] - s.cx, p[1] - s.cy) - s.r) <= tol;
  const poly = shapePolygon(s);
  const closed = s.t === 'rect' || s.closed;
  const n = closed ? poly.length : poly.length - 1;
  for (let i = 0; i < n; i++) {
    if (distToSegment(p, poly[i], poly[(i + 1) % poly.length]) <= tol) return true;
  }
  return false;
}

export function translateShape(s, dx, dy) {
  if (s.t === 'rect') return { ...s, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy };
  if (s.t === 'circle') return { ...s, cx: s.cx + dx, cy: s.cy + dy };
  return { ...s, pts: s.pts.map((p) => [p[0] + dx, p[1] + dy]) };
}

export function shapeSnapPoints(s) {
  if (s.t === 'rect') {
    const mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2;
    return [[s.x1, s.y1], [s.x2, s.y1], [s.x2, s.y2], [s.x1, s.y2], [mx, my]];
  }
  if (s.t === 'circle') {
    return [[s.cx, s.cy], [s.cx + s.r, s.cy], [s.cx - s.r, s.cy], [s.cx, s.cy + s.r], [s.cx, s.cy - s.r]];
  }
  return s.pts.map((p) => [p[0], p[1]]);
}

export function shapeBounds(shapes) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const s of shapes) {
    for (const p of shapePolygon(s, 32)) {
      x1 = Math.min(x1, p[0]); y1 = Math.min(y1, p[1]);
      x2 = Math.max(x2, p[0]); y2 = Math.max(y2, p[1]);
    }
  }
  return x1 === Infinity ? null : { x1, y1, x2, y2 };
}

export function describeShape(s) {
  if (s.t === 'rect') return 'Obdélník';
  if (s.t === 'circle') return 'Kružnice';
  return s.closed ? 'Uzavřená křivka' : 'Lomená čára';
}

// ---------- Triangulace (ear clipping + zavedení děr můstky) ----------

function cross3(a, b, c) {
  return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
}
function same(a, b) {
  return Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
}
function pointInTriInclusive(p, a, b, c) {
  const d1 = (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
  const d2 = (p[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (p[1] - c[1]);
  const d3 = (p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1]);
  const neg = d1 < -1e-12 || d2 < -1e-12 || d3 < -1e-12;
  const pos = d1 > 1e-12 || d2 > 1e-12 || d3 > 1e-12;
  return !(neg && pos);
}
function segIntersectProper(p1, p2, p3, p4) {
  const o = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = o(p3, p4, p1), d2 = o(p3, p4, p2), d3 = o(p1, p2, p3), d4 = o(p1, p2, p4);
  return ((d1 > 1e-12 && d2 < -1e-12) || (d1 < -1e-12 && d2 > 1e-12)) &&
         ((d3 > 1e-12 && d4 < -1e-12) || (d3 < -1e-12 && d4 > 1e-12));
}

export function orient(poly, ccw) {
  const a = polygonArea(poly);
  return (a > 0) === ccw ? poly.slice() : poly.slice().reverse();
}

// Vrací pole trojúhelníků [[a,b,c],...] pro vnější kontury (CCW) a díry (CW).
export function triangulate(outerIn, holesIn = []) {
  const outer = orient(outerIn, true);
  const holes = holesIn.map((h) => orient(h, false));
  let ring = outer.slice();
  const bridges = [];
  const allEdges = [];
  const addEdges = (poly) => poly.forEach((p, i) => allEdges.push([p, poly[(i + 1) % poly.length]]));
  addEdges(outer);
  holes.forEach(addEdges);

  // díry seřadíme podle nejlevějšího bodu (zprava doleva, jako v earcutu)
  const order = holes.map((h, i) => ({ h, i, x: Math.min(...h.map((p) => p[0])) })).sort((a, b) => b.x - a.x);

  for (const { h } of order) {
    let best = null;
    for (let oi = 0; oi < ring.length; oi++) {
      for (let hj = 0; hj < h.length; hj++) {
        const A = ring[oi], B = h[hj];
        const d = Math.hypot(A[0] - B[0], A[1] - B[1]);
        if (best && d >= best.d) continue;
        const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
        if (!pointInPolygon(mid, outer)) continue;
        if (holes.some((hh) => pointInPolygon(mid, hh))) continue;
        let ok = true;
        for (const [p, q] of allEdges.concat(bridges)) {
          if (same(p, A) || same(p, B) || same(q, A) || same(q, B)) continue;
          if (segIntersectProper(A, B, p, q)) { ok = false; break; }
        }
        if (ok) best = { d, oi, hj };
      }
    }
    if (!best) continue; // nelze propojit – díru vynecháme
    const { oi, hj } = best;
    const rotated = h.slice(hj).concat(h.slice(0, hj));
    bridges.push([ring[oi], h[hj]]);
    ring = ring.slice(0, oi + 1).concat(rotated, [h[hj]], [ring[oi]], ring.slice(oi + 1));
  }
  return earClip(ring);
}

function earClip(ring) {
  const idx = ring.map((_, i) => i);
  const tris = [];
  let guard = 0;
  while (idx.length > 3 && guard++ < 100000) {
    let clipped = false;
    const m = idx.length;
    for (let k = 0; k < m; k++) {
      const ia = idx[(k + m - 1) % m], ib = idx[k], ic = idx[(k + 1) % m];
      const a = ring[ia], b = ring[ib], c = ring[ic];
      const cr = cross3(a, b, c);
      if (cr <= 1e-12) continue;
      let ok = true;
      for (let q = 0; q < m; q++) {
        const j = idx[q];
        if (j === ia || j === ib || j === ic) continue;
        const p = ring[j];
        if (same(p, a) || same(p, b) || same(p, c)) continue;
        if (pointInTriInclusive(p, a, b, c)) { ok = false; break; }
      }
      if (ok) { tris.push([a, b, c]); idx.splice(k, 1); clipped = true; break; }
    }
    if (clipped) continue;
    // nouzově: odstraň degenerovaný (kolineární) vrchol, jinak vynuť ořez
    let removed = false;
    for (let k = 0; k < m; k++) {
      const a = ring[idx[(k + m - 1) % m]], b = ring[idx[k]], c = ring[idx[(k + 1) % m]];
      if (Math.abs(cross3(a, b, c)) <= 1e-9) { idx.splice(k, 1); removed = true; break; }
    }
    if (removed) continue;
    const a = ring[idx[m - 1]], b = ring[idx[0]], c = ring[idx[1]];
    if (cross3(a, b, c) > 0) tris.push([a, b, c]);
    idx.splice(0, 1);
  }
  if (idx.length === 3) {
    const [a, b, c] = idx.map((i) => ring[i]);
    if (cross3(a, b, c) > 1e-12) tris.push([a, b, c]);
  }
  return tris;
}

// ---------- Vytažení (extruze) ----------
// Vrací {pos, nrm, edges} jako Float32Array v LOKÁLNÍCH souřadnicích (u,v,w);
// w = 0 … depth (po posunu z0).
export function buildExtrusion(outerPoly, holePolys, z0, z1) {
  const outer = orient(outerPoly, true);
  const holes = holePolys.map((h) => orient(h, false));
  const pos = [], nrm = [], edges = [];

  const push = (p, n) => { pos.push(p[0], p[1], p[2]); nrm.push(n[0], n[1], n[2]); };

  // víka
  const tris = triangulate(outer, holes);
  for (const [a, b, c] of tris) {
    push([a[0], a[1], z1], [0, 0, 1]); push([b[0], b[1], z1], [0, 0, 1]); push([c[0], c[1], z1], [0, 0, 1]);
    push([a[0], a[1], z0], [0, 0, -1]); push([c[0], c[1], z0], [0, 0, -1]); push([b[0], b[1], z0], [0, 0, -1]);
  }

  // stěny
  const SMOOTH_COS = Math.cos((35 * Math.PI) / 180);
  for (const ring of [outer, ...holes]) {
    const n = ring.length;
    const en = ring.map((p, i) => {
      const q = ring[(i + 1) % n];
      const dx = q[0] - p[0], dy = q[1] - p[1];
      const l = Math.hypot(dx, dy) || 1;
      return [dy / l, -dx / l];
    });
    const vn = ring.map((_, i) => {
      const a = en[(i + n - 1) % n], b = en[i];
      const dot = a[0] * b[0] + a[1] * b[1];
      if (dot >= SMOOTH_COS) {
        const sx = a[0] + b[0], sy = a[1] + b[1], l = Math.hypot(sx, sy) || 1;
        return { smooth: true, n: [sx / l, sy / l] };
      }
      return { smooth: false };
    });
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const p = ring[i], q = ring[j];
      const ni = vn[i].smooth ? vn[i].n : en[i];
      const nj = vn[j].smooth ? vn[j].n : en[i];
      const N0 = [ni[0], ni[1], 0], N1 = [nj[0], nj[1], 0];
      push([p[0], p[1], z0], N0); push([q[0], q[1], z0], N1); push([q[0], q[1], z1], N1);
      push([p[0], p[1], z0], N0); push([q[0], q[1], z1], N1); push([p[0], p[1], z1], N0);
      // hrany: obvod víček + svislé hrany jen v ostrých rozích
      edges.push(p[0], p[1], z0, q[0], q[1], z0, p[0], p[1], z1, q[0], q[1], z1);
      if (!vn[i].smooth) edges.push(p[0], p[1], z0, p[0], p[1], z1);
    }
  }
  return { pos: new Float32Array(pos), nrm: new Float32Array(nrm), edges: new Float32Array(edges) };
}

// Transformace lokálních souřadnic (u,v,w) do světa podle roviny náčrtu
export function planeToWorld(planeKey, arr, isNormal = false) {
  const P = PLANES[planeKey];
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i += 3) {
    const x = arr[i], y = arr[i + 1], z = arr[i + 2];
    for (let k = 0; k < 3; k++) out[i + k] = P.u[k] * x + P.v[k] * y + P.n[k] * z;
  }
  return out;
}

// Sestaví těleso (světové souřadnice) pro operaci vytažení nad náčrtem.
// Vrací null, pokud vstupy nejsou platné.
export function extrudeBody(sketch, ext) {
  if (!sketch) return null;
  const shape = sketch.shapes.find((s) => s.id === ext.shapeId);
  if (!shape || !isClosedShape(shape)) return null;
  const depth = Math.abs(ext.dist);
  if (!(depth > 1e-6)) return null;
  let z0, z1;
  if (ext.sym) { z0 = -depth / 2; z1 = depth / 2; }
  else if (ext.dist >= 0) { z0 = 0; z1 = depth; }
  else { z0 = -depth; z1 = 0; }
  const holes = findHoles(sketch.shapes, shape).map((h) => shapePolygon(h));
  const local = buildExtrusion(shapePolygon(shape), holes, z0, z1);
  return {
    pos: planeToWorld(sketch.plane, local.pos),
    nrm: planeToWorld(sketch.plane, local.nrm),
    edges: planeToWorld(sketch.plane, local.edges),
  };
}

// Obrys tvaru ve světě jako dvojice úseček (pro kreslení náčrtů ve 3D)
export function shapeLines3D(planeKey, shape) {
  const poly = shapePolygon(shape);
  const closed = shape.t === 'rect' || shape.t === 'circle' || shape.closed;
  const n = closed ? poly.length : poly.length - 1;
  const arr = [];
  for (let i = 0; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    arr.push(p[0], p[1], 0, q[0], q[1], 0);
  }
  return planeToWorld(planeKey, new Float32Array(arr));
}

// Plocha profilu (víko) ve světě – pro průhledný náhled a výběr profilu
export function profileFace(sketch, shape) {
  const holes = findHoles(sketch.shapes, shape).map((h) => shapePolygon(h));
  const tris = triangulate(shapePolygon(shape), holes);
  const pos = [], nrm = [];
  for (const [a, b, c] of tris) {
    for (const p of [a, b, c]) { pos.push(p[0], p[1], 0); nrm.push(0, 0, 1); }
  }
  return { pos: planeToWorld(sketch.plane, new Float32Array(pos)), nrm: planeToWorld(sketch.plane, new Float32Array(nrm)) };
}
