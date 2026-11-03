/* SkicaCAD – organic modelling (záložka ORGANICKÉ).
   Shapes for figurines and other soft forms, built on two tools:
   - signed distance fields on a voxel grid (negative inside): soft unions of spheres, capsules…, a stick skeleton with
     thickness, volumetric sculpting, remeshing and hollowing. A grid is turned back into triangles with surface nets.
   - triangle meshes: refining, Catmull–Clark subdivision, deformations (twist, taper, bend, lattice, soft move), sweeps
     and lofts.
   All results are lists of triangles in the kernel's polygon format, so the rest of the app (booleans, export…) works
   on them unchanged. */
const ORG = (() => {
'use strict';
const KK = (typeof K !== 'undefined') ? K : require('./kernel.js');
const D2R = Math.PI / 180;
const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const smooth = t => (t >= 1 ? 0 : t <= 0 ? 1 : (1 - t * t) * (1 - t * t)); /* brush / soft-move falloff */

/* ---------------- rotation helpers (Euler XYZ in degrees, as in Přesunout) ---------------- */
function rotMat(r) {
  const [a, b, c] = (r || [0, 0, 0]).map(x => (Number(x) || 0) * D2R);
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  /* R = Rz * Ry * Rx */
  return [
    [cb * cc, sa * sb * cc - ca * sc, ca * sb * cc + sa * sc],
    [cb * sc, sa * sb * sc + ca * cc, ca * sb * sc - sa * cc],
    [-sb, sa * cb, ca * cb]];
}
const mulT = (R, x, y, z) => [R[0][0] * x + R[1][0] * y + R[2][0] * z, R[0][1] * x + R[1][1] * y + R[2][1] * z, R[0][2] * x + R[1][2] * y + R[2][2] * z]; /* Rᵀ·v (world → local) */
const mulR = (R, v) => [R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2], R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2], R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2]];

/* ---------------- distance functions ---------------- */
function smin(a, b, k) { if (!(k > 0)) return Math.min(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
const smax = (a, b, k) => -smin(-a, -b, k);
function sdRoundCone(px, py, pz, a, b, r1, r2) {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2], l2 = bax * bax + bay * bay + baz * baz;
  const pax = px - a[0], pay = py - a[1], paz = pz - a[2];
  if (l2 < 1e-12) return len3(pax, pay, paz) - Math.max(r1, r2);
  const rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  if (a2 <= 1e-12) return Math.min(len3(pax, pay, paz) - r1, len3(px - b[0], py - b[1], pz - b[2]) - r2); /* one ball swallows the other */
  const y = pax * bax + pay * bay + paz * baz, z = y - l2;
  const xx = pax * l2 - bax * y, xy = pay * l2 - bay * y, xz = paz * l2 - baz * y, x2 = xx * xx + xy * xy + xz * xz;
  const y2 = y * y * l2, z2 = z * z * l2, k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
/* one element of a soft union, prepared for fast evaluation; returns { f(x,y,z), min, max } */
function prepElement(e) {
  const c = (e.c || [0, 0, 0]).map(Number), R = rotMat(e.rot), num = (v, d) => Math.max(0.05, Number(v) || d);
  const local = (x, y, z) => mulT(R, x - c[0], y - c[1], z - c[2]);
  let f, ext;
  if (e.t === 'sphere') { const r = num(e.d, 10) / 2; f = (x, y, z) => len3(x - c[0], y - c[1], z - c[2]) - r; ext = [r, r, r]; }
  else if (e.t === 'ellipsoid') {
    const rx = num(e.sx, 20) / 2, ry = num(e.sy, 14) / 2, rz = num(e.sz, 10) / 2;
    f = (x, y, z) => { const q = local(x, y, z), k0 = len3(q[0] / rx, q[1] / ry, q[2] / rz), k1 = len3(q[0] / (rx * rx), q[1] / (ry * ry), q[2] / (rz * rz)); return k1 > 1e-12 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz); };
    const m = Math.max(rx, ry, rz); ext = [m, m, m];
  } else if (e.t === 'capsule') {
    const L = Math.max(0, Number(e.len) || 0), r1 = num(e.d1, 8) / 2, r2 = num(e.d2 === undefined ? e.d1 : e.d2, 8) / 2;
    const ax = mulR(R, [0, 0, 1]), a = c.map((v, i) => v - ax[i] * L / 2), b = c.map((v, i) => v + ax[i] * L / 2);
    f = (x, y, z) => sdRoundCone(x, y, z, a, b, r1, r2);
    const m = L / 2 + Math.max(r1, r2); ext = [m, m, m];
  } else if (e.t === 'box') {
    const hx = num(e.sx, 20) / 2, hy = num(e.sy, 20) / 2, hz = num(e.sz, 20) / 2, rr = Math.min(Math.max(0, Number(e.r) || 0), hx, hy, hz);
    f = (x, y, z) => {
      const q = local(x, y, z), qx = Math.abs(q[0]) - hx + rr, qy = Math.abs(q[1]) - hy + rr, qz = Math.abs(q[2]) - hz + rr;
      return len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - rr;
    };
    const m = len3(hx, hy, hz); ext = [m, m, m];
  } else if (e.t === 'torus') {
    const Rm = num(e.R, 15), t = num(e.tt, 5) / 2;
    f = (x, y, z) => { const q = local(x, y, z); return Math.hypot(Math.hypot(q[0], q[1]) - Rm, q[2]) - t; };
    const m = Rm + t; ext = [m, m, m];
  } else if (e.t === 'rc') { /* round cone between two points (skeleton bone) */
    const a = e.a.map(Number), b = e.b.map(Number), r1 = Math.max(0.05, Number(e.ra)), r2 = Math.max(0.05, Number(e.rb));
    f = (x, y, z) => sdRoundCone(x, y, z, a, b, r1, r2);
    const mn = [0, 1, 2].map(i => Math.min(a[i] - r1, b[i] - r2)), mx = [0, 1, 2].map(i => Math.max(a[i] + r1, b[i] + r2));
    return { f, neg: !!e.neg, min: mn, max: mx };
  } else throw new Error('Neznámý tvar');
  return { f, neg: !!e.neg, min: c.map((v, i) => v - ext[i]), max: c.map((v, i) => v + ext[i]) };
}
/* soft union of elements (negatives are carved away softly afterwards) */
function blobField(elements, k) {
  const P = elements.map(prepElement), pos = P.filter(p => !p.neg), neg = P.filter(p => p.neg);
  if (!pos.length) throw new Error('Přidejte alespoň jeden tvar, který přidává hmotu');
  const kk = Math.max(0, Number(k) || 0);
  const f = (x, y, z) => {
    let d = pos[0].f(x, y, z);
    for (let i = 1; i < pos.length; i++) d = smin(d, pos[i].f(x, y, z), kk);
    for (const p of neg) d = smax(d, -p.f(x, y, z), kk);
    return d;
  };
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of pos) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p.min[i]); max[i] = Math.max(max[i], p.max[i]); }
  for (let i = 0; i < 3; i++) { min[i] -= kk / 2; max[i] += kk / 2; }
  return { f, min, max };
}

/* ---------------- voxel grids ---------------- */
const QUALITY = { low: 90e3, mid: 300e3, high: 900e3 };
function makeGrid(min, max, h, maxCells) {
  const size = [0, 1, 2].map(i => Math.max(1e-3, max[i] - min[i]));
  let hh = h > 0 ? h : Math.cbrt(size[0] * size[1] * size[2] / (maxCells || QUALITY.mid));
  const cells = s => [0, 1, 2].map(i => Math.ceil(size[i] / s) + 3);
  let n = cells(hh); while (n[0] * n[1] * n[2] > (maxCells || QUALITY.mid) * 1.05) { hh *= 1.06; n = cells(hh); }
  const o = [0, 1, 2].map(i => min[i] - ((n[i] - 1) * hh - size[i]) / 2);
  return { nx: n[0], ny: n[1], nz: n[2], h: hh, o, d: new Float32Array(n[0] * n[1] * n[2]) };
}
function fillGrid(G, f) {
  const { nx, ny, nz, h, o, d } = G;
  for (let k = 0; k < nz; k++) { const z = o[2] + k * h; for (let j = 0; j < ny; j++) { const y = o[1] + j * h; let idx = nx * (j + ny * k); for (let i = 0; i < nx; i++) d[idx++] = f(o[0] + i * h, y, z); } }
  /* the border stays outside, so the surface is always closed */
  forBorder(G, i => { if (d[i] < 0.5 * h) d[i] = 0.5 * h; });
  return G;
}
function forBorder(G, fn) {
  const { nx, ny, nz } = G;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++)
    if (i === 0 || j === 0 || k === 0 || i === nx - 1 || j === ny - 1 || k === nz - 1) fn(i + nx * (j + ny * k));
}
/* trilinear sample (outside the grid: far outside) */
function sample(G, x, y, z) {
  const { nx, ny, nz, h, o, d } = G;
  const fx = (x - o[0]) / h, fy = (y - o[1]) / h, fz = (z - o[2]) / h;
  if (!(fx >= 0 && fy >= 0 && fz >= 0 && fx <= nx - 1 && fy <= ny - 1 && fz <= nz - 1)) return h * 4;
  const i = Math.min(nx - 2, fx | 0), j = Math.min(ny - 2, fy | 0), k = Math.min(nz - 2, fz | 0), u = fx - i, v = fy - j, w = fz - k;
  const a = i + nx * (j + ny * k), sx = 1, sy = nx, sz = nx * ny;
  const c00 = d[a] * (1 - u) + d[a + sx] * u, c10 = d[a + sy] * (1 - u) + d[a + sy + sx] * u;
  const c01 = d[a + sz] * (1 - u) + d[a + sz + sx] * u, c11 = d[a + sz + sy] * (1 - u) + d[a + sz + sy + sx] * u;
  return (c00 * (1 - v) + c10 * v) * (1 - w) + (c01 * (1 - v) + c11 * v) * w;
}
/* surface nets: one vertex per cell the surface passes through, quads across sign changes; vertices are then pulled onto
   the zero level of the (exact or trilinear) field. Returns kernel polygons (triangles), oriented outward. */
function polygonize(G, fn) {
  const { nx, ny, nz, h, o, d } = G, sxy = nx * ny;
  const cid = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1), V = [];
  const cidx = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const corner = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const val = new Float64Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { const q = corner[c]; val[c] = d[(i + q[0]) + nx * ((j + q[1]) + ny * (k + q[2]))]; if (val[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, cnt = 0;
    for (const [a, b] of edges) {
      const va = val[a], vb = val[b]; if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb), A = corner[a], B = corner[b];
      sx += A[0] + (B[0] - A[0]) * t; sy += A[1] + (B[1] - A[1]) * t; sz += A[2] + (B[2] - A[2]) * t; cnt++;
    }
    cid[cidx(i, j, k)] = V.length;
    V.push([o[0] + (i + sx / cnt) * h, o[1] + (j + sy / cnt) * h, o[2] + (k + sz / cnt) * h]);
  }
  /* pull every vertex onto the surface (two Newton steps on the field), at most half a cell */
  const F = fn || ((x, y, z) => sample(G, x, y, z)), e = h * 0.25;
  for (const p of V) {
    const p0 = p.slice();
    for (let it = 0; it < 2; it++) {
      const v = F(p[0], p[1], p[2]);
      const gx = (F(p[0] + e, p[1], p[2]) - F(p[0] - e, p[1], p[2])) / (2 * e), gy = (F(p[0], p[1] + e, p[2]) - F(p[0], p[1] - e, p[2])) / (2 * e), gz = (F(p[0], p[1], p[2] + e) - F(p[0], p[1], p[2] - e)) / (2 * e);
      const g2 = gx * gx + gy * gy + gz * gz; if (g2 < 1e-12) break;
      p[0] -= v * gx / g2; p[1] -= v * gy / g2; p[2] -= v * gz / g2;
    }
    const dx = p[0] - p0[0], dy = p[1] - p0[1], dz = p[2] - p0[2], m = len3(dx, dy, dz);
    if (!(m <= h * 0.6)) { const s = m > 0 && isFinite(m) ? h * 0.6 / m : 0; p[0] = p0[0] + dx * s; p[1] = p0[1] + dy * s; p[2] = p0[2] + dz * s; }
    for (let a = 0; a < 3; a++) p[a] = Math.round(p[a] * 1e5) / 1e5;
  }
  const out = [];
  const tri = (a, b, c) => { if (a === b || b === c || a === c) return; const q = KK.mkPoly([V[a], V[b], V[c]]); if (q) out.push(q); };
  const quad = (a, b, c, dd) => {
    if (a < 0 || b < 0 || c < 0 || dd < 0) return;
    const pa = V[a], pc = V[c], pb = V[b], pd = V[dd];
    if (len3(pa[0] - pc[0], pa[1] - pc[1], pa[2] - pc[2]) <= len3(pb[0] - pd[0], pb[1] - pd[1], pb[2] - pd[2])) { tri(a, b, c); tri(a, c, dd); }
    else { tri(a, b, dd); tri(b, c, dd); }
  };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const p = i + nx * (j + ny * k), inside = d[p] < 0;
    /* x edge (i,j,k)-(i+1,j,k): cells around it in (y,z) */
    if (i < nx - 1 && (d[p + 1] < 0) !== inside) {
      const q = [cid[cidx(i, j - 1, k - 1)], cid[cidx(i, j, k - 1)], cid[cidx(i, j, k)], cid[cidx(i, j - 1, k)]];
      if (inside) quad(q[0], q[1], q[2], q[3]); else quad(q[3], q[2], q[1], q[0]);
    }
    if (j < ny - 1 && (d[p + nx] < 0) !== inside) { /* y edge: cells in (z,x) */
      const q = [cid[cidx(i - 1, j, k - 1)], cid[cidx(i - 1, j, k)], cid[cidx(i, j, k)], cid[cidx(i, j, k - 1)]];
      if (inside) quad(q[0], q[1], q[2], q[3]); else quad(q[3], q[2], q[1], q[0]);
    }
    if (k < nz - 1 && (d[p + sxy] < 0) !== inside) { /* z edge: cells in (x,y) */
      const q = [cid[cidx(i - 1, j - 1, k)], cid[cidx(i, j - 1, k)], cid[cidx(i, j, k)], cid[cidx(i - 1, j, k)]];
      if (inside) quad(q[0], q[1], q[2], q[3]); else quad(q[3], q[2], q[1], q[0]);
    }
  }
  if (!out.length) throw new Error('Tvar je prázdný');
  return out;
}

/* ---------------- triangles of a body ---------------- */
function trisOf(polys) {
  const T = [];
  for (const p of polys) for (let i = 1; i < p.v.length - 1; i++) T.push([p.v[0], p.v[i], p.v[i + 1]]);
  return T;
}
/* closest point on a triangle (Ericson), returns squared distance */
function triDist2(p, a, b, c) {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const d2 = q => { const x = p[0] - q[0], y = p[1] - q[1], z = p[2] - q[2]; return x * x + y * y + z * z; };
  const d1 = dot(ab, ap), dd2 = dot(ac, ap); if (d1 <= 0 && dd2 <= 0) return d2(a);
  const bp = [p[0] - b[0], p[1] - b[1], p[2] - b[2]], d3 = dot(ab, bp), d4 = dot(ac, bp); if (d3 >= 0 && d4 <= d3) return d2(b);
  const vc = d1 * d4 - d3 * dd2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return d2([a[0] + ab[0] * v, a[1] + ab[1] * v, a[2] + ab[2] * v]); }
  const cp = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], d5 = dot(ab, cp), d6 = dot(ac, cp); if (d6 >= 0 && d5 <= d6) return d2(c);
  const vb = d5 * dd2 - d1 * d6; if (vb <= 0 && dd2 >= 0 && d6 <= 0) { const w = dd2 / (dd2 - d6); return d2([a[0] + ac[0] * w, a[1] + ac[1] * w, a[2] + ac[2] * w]); }
  const va = d3 * d6 - d5 * d4; if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return d2([b[0] + (c[0] - b[0]) * w, b[1] + (c[1] - b[1]) * w, b[2] + (c[2] - b[2]) * w]); }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  return d2([a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w]);
}
/* 1D squared distance transform (Felzenszwalb) on f with stride */
function edt1(f, n, off, stride, z, v, g) {
  for (let i = 0; i < n; i++) g[i] = f[off + i * stride];
  let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s;
    while (true) { const r = v[k]; s = ((g[q] + q * q) - (g[r] + r * r)) / (2 * q - 2 * r); if (s <= z[k] && k > 0) k--; else break; }
    if (s <= z[k]) { v[0] = q; z[0] = -Infinity; z[1] = Infinity; k = 0; continue; }
    k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const r = v[k]; f[off + q * stride] = (q - r) * (q - r) + g[r]; }
}
function edt3(f, nx, ny, nz) {
  const m = Math.max(nx, ny, nz), z = new Float64Array(m + 1), v = new Int32Array(m), g = new Float64Array(m);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) edt1(f, nx, nx * (j + ny * k), 1, z, v, g);
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) edt1(f, ny, i + nx * ny * k, nx, z, v, g);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) edt1(f, nz, i + nx * j, nx * ny, z, v, g);
}
/* signed distance field of a closed body on a grid: inside/outside from z scanlines, distances from distance
   transforms, exact distances to the triangles near the surface */
function voxelize(polys, opts) {
  opts = opts || {};
  const T = trisOf(polys); if (!T.length) throw new Error('Těleso je prázdné');
  const bb = KK.bbox(polys), size = Math.max(...[0, 1, 2].map(i => bb.max[i] - bb.min[i]));
  const margin = opts.margin === undefined ? Math.max(2, size * 0.06) : opts.margin;
  const G = makeGrid(bb.min.map(v => v - margin), bb.max.map(v => v + margin), opts.h, opts.maxCells || QUALITY.mid);
  const { nx, ny, nz, h, o, d } = G, N = nx * ny * nz;
  /* scanlines along z through every (i,j) column */
  const inside = new Uint8Array(N), cols = new Array(nx * ny);
  const ex = 1.37e-4 * h, ey = 2.91e-4 * h;
  for (const t of T) {
    const [a, b, c] = t;
    const i0 = Math.max(0, Math.ceil((Math.min(a[0], b[0], c[0]) - o[0] - ex) / h)), i1 = Math.min(nx - 1, Math.floor((Math.max(a[0], b[0], c[0]) - o[0] - ex) / h));
    const j0 = Math.max(0, Math.ceil((Math.min(a[1], b[1], c[1]) - o[1] - ey) / h)), j1 = Math.min(ny - 1, Math.floor((Math.max(a[1], b[1], c[1]) - o[1] - ey) / h));
    if (i0 > i1 || j0 > j1) continue;
    const den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]); if (Math.abs(den) < 1e-14) continue;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = o[0] + i * h + ex, y = o[1] + j * h + ey;
      const l1 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / den, l2 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / den, l3 = 1 - l1 - l2;
      if (l1 < 0 || l2 < 0 || l3 < 0) continue;
      const zz = l1 * a[2] + l2 * b[2] + l3 * c[2], ci = i + nx * j;
      (cols[ci] || (cols[ci] = [])).push(zz);
    }
  }
  for (let ci = 0; ci < nx * ny; ci++) {
    const zs = cols[ci]; if (!zs || zs.length < 2) continue;
    zs.sort((p, q) => p - q);
    const i = ci % nx, j = (ci / nx) | 0;
    for (let s = 0; s + 1 < zs.length; s += 2) {
      const k0 = Math.max(0, Math.ceil((zs[s] - o[2]) / h)), k1 = Math.min(nz - 1, Math.floor((zs[s + 1] - o[2]) / h));
      for (let k = k0; k <= k1; k++) inside[i + nx * (j + ny * k)] = 1;
    }
  }
  /* distance transforms both ways (in cells) */
  const BIG = 1e20, fo = new Float64Array(N), fi = new Float64Array(N);
  for (let i = 0; i < N; i++) { fo[i] = inside[i] ? 0 : BIG; fi[i] = inside[i] ? BIG : 0; }
  edt3(fo, nx, ny, nz); edt3(fi, nx, ny, nz);
  for (let i = 0; i < N; i++) d[i] = inside[i] ? -(Math.sqrt(fi[i]) - 0.5) * h : (Math.sqrt(fo[i]) - 0.5) * h;
  /* exact distances in a band around the surface */
  const cs = 2 * h, hash = new Map(), key = (a, b, c) => a + ',' + b + ',' + c;
  T.forEach((t, ti) => {
    const mn = [0, 1, 2].map(k => Math.floor(Math.min(t[0][k], t[1][k], t[2][k]) / cs)), mx = [0, 1, 2].map(k => Math.floor(Math.max(t[0][k], t[1][k], t[2][k]) / cs));
    for (let a = mn[0]; a <= mx[0]; a++) for (let b = mn[1]; b <= mx[1]; b++) for (let c = mn[2]; c <= mx[2]; c++) { const kk = key(a, b, c); let l = hash.get(kk); if (!l) hash.set(kk, l = []); l.push(ti); }
  });
  const p = [0, 0, 0];
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const idx = i + nx * (j + ny * k); if (Math.abs(d[idx]) > 1.8 * h) continue;
    p[0] = o[0] + i * h; p[1] = o[1] + j * h; p[2] = o[2] + k * h;
    const a0 = Math.floor(p[0] / cs), b0 = Math.floor(p[1] / cs), c0 = Math.floor(p[2] / cs);
    let best = Infinity; const seen = new Set();
    for (let a = a0 - 1; a <= a0 + 1; a++) for (let b = b0 - 1; b <= b0 + 1; b++) for (let c = c0 - 1; c <= c0 + 1; c++) {
      const l = hash.get(key(a, b, c)); if (!l) continue;
      for (const ti of l) { if (seen.has(ti)) continue; seen.add(ti); const t = T[ti], q = triDist2(p, t[0], t[1], t[2]); if (q < best) best = q; }
    }
    if (best < Infinity) { const dist = Math.sqrt(best); d[idx] = inside[idx] ? -dist : dist; }
  }
  forBorder(G, i => { if (d[i] < 0.5 * h) d[i] = 0.5 * h; });
  return G;
}

/* ---------------- volumetric sculpting on a grid ---------------- */
/* a dab: [brush, x, y, z, nx, ny, nz, radius, strength, dx, dy, dz]; brushes: draw, inflate, smooth, grab, flatten, pinch */
const BRUSHES = ['draw', 'inflate', 'smooth', 'grab', 'flatten', 'pinch'];
function applyDab(G, dab) {
  const [b, px, py, pz, nx0, ny0, nz0, r0, s0, dx = 0, dy = 0, dz = 0] = dab;
  const r = Math.max(G.h, Number(r0) || 1), s = Number(s0) || 0, { nx, ny, nz, h, o, d } = G;
  const nl = len3(nx0, ny0, nz0) || 1, n = [nx0 / nl, ny0 / nl, nz0 / nl];
  const reach = r + (b === 'grab' ? len3(dx, dy, dz) : 0) + h;
  const i0 = clamp(Math.floor((px - reach - o[0]) / h), 1, nx - 2), i1 = clamp(Math.ceil((px + reach - o[0]) / h), 1, nx - 2);
  const j0 = clamp(Math.floor((py - reach - o[1]) / h), 1, ny - 2), j1 = clamp(Math.ceil((py + reach - o[1]) / h), 1, ny - 2);
  const k0 = clamp(Math.floor((pz - reach - o[2]) / h), 1, nz - 2), k1 = clamp(Math.ceil((pz + reach - o[2]) / h), 1, nz - 2);
  if (i0 > i1 || j0 > j1 || k0 > k1) return;
  const src = (b === 'grab' || b === 'draw' || b === 'smooth' || b === 'pinch') ? { ...G, d: d.slice() } : null;
  for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const x = o[0] + i * h, y = o[1] + j * h, z = o[2] + k * h, idx = i + nx * (j + ny * k);
    if (b === 'grab') { /* material follows the drag: sample where this point came from */
      const w = smooth(len3(x - dx - px, y - dy - py, z - dz - pz) / r); if (!w) continue;
      d[idx] = sample(src, x - dx * w, y - dy * w, z - dz * w); continue;
    }
    const w = smooth(len3(x - px, y - py, z - pz) / r); if (!w) continue;
    if (b === 'inflate') d[idx] -= s * w;
    else if (b === 'draw') d[idx] = sample(src, x - n[0] * s * w, y - n[1] * s * w, z - n[2] * s * w);
    else if (b === 'flatten') { const pd = (x - px) * n[0] + (y - py) * n[1] + (z - pz) * n[2]; const a = clamp(Math.abs(s) * w, 0, 1); d[idx] = d[idx] * (1 - a) + pd * a; }
    else if (b === 'smooth') {
      const sd = src.d; let sum = 0; for (let c = -1; c <= 1; c++) for (let bb = -1; bb <= 1; bb++) for (let a = -1; a <= 1; a++) sum += sd[idx + a + nx * (bb + ny * c)];
      const a = clamp(Math.abs(s) * w, 0, 1); d[idx] = d[idx] * (1 - a) + (sum / 27) * a;
    } else if (b === 'pinch') { /* pull material towards the dab centre */
      const k2 = clamp(Math.abs(s) * w * 0.3, 0, 0.9); d[idx] = sample(src, x + (x - px) * k2, y + (y - py) * k2, z + (z - pz) * k2);
    }
  }
}

/* ---------------- triangle meshes ---------------- */
/* indexed triangle mesh from polygons (vertices welded) */
function indexed(polys) {
  const map = new Map(), V = [], F = [];
  const id = q => { const k = KK.qk(q); let i = map.get(k); if (i === undefined) { i = V.length; map.set(k, i); V.push(q.slice()); } return i; };
  for (const p of polys) { const f = p.v.map(id).filter((x, i, a) => x !== a[(i + 1) % a.length]); if (f.length >= 3) F.push(f); }
  return { V, F };
}
/* T-junctions (a vertex lying on another face's edge, left by booleans) are split into the edge so faces share vertices */
function fixTJunctions(M) {
  const { V, F } = M; let el = 0, ne = 0;
  for (const f of F) for (let i = 0; i < f.length; i++) { const a = V[f[i]], b = V[f[(i + 1) % f.length]]; el += len3(a[0] - b[0], a[1] - b[1], a[2] - b[2]); ne++; }
  const cs = Math.max(1e-3, el / Math.max(1, ne)), hash = new Map(), key = (a, b, c) => a + ',' + b + ',' + c;
  V.forEach((p, i) => { const k = key(Math.floor(p[0] / cs), Math.floor(p[1] / cs), Math.floor(p[2] / cs)); let l = hash.get(k); if (!l) hash.set(k, l = []); l.push(i); });
  const edgeCache = new Map();
  const onEdge = (ia, ib) => {
    const ck = ia < ib ? ia + '_' + ib : ib + '_' + ia; if (edgeCache.has(ck)) { const r = edgeCache.get(ck); return ia < ib ? r : r.slice().reverse(); }
    const a = V[ia], b = V[ib], ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L2 = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2], found = [];
    if (L2 > 1e-12 && L2 < (cs * 400) * (cs * 400)) {
      const mn = [0, 1, 2].map(k => Math.floor(Math.min(a[k], b[k]) / cs)), mx = [0, 1, 2].map(k => Math.floor(Math.max(a[k], b[k]) / cs));
      if ((mx[0] - mn[0] + 1) * (mx[1] - mn[1] + 1) * (mx[2] - mn[2] + 1) < 20000)
        for (let x = mn[0]; x <= mx[0]; x++) for (let y = mn[1]; y <= mx[1]; y++) for (let z = mn[2]; z <= mx[2]; z++) {
          const l = hash.get(key(x, y, z)); if (!l) continue;
          for (const iv of l) {
            if (iv === ia || iv === ib) continue;
            const p = V[iv], t = ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2]) / L2;
            if (t <= 1e-6 || t >= 1 - 1e-6) continue;
            const q = [a[0] + ab[0] * t - p[0], a[1] + ab[1] * t - p[1], a[2] + ab[2] * t - p[2]];
            if (q[0] * q[0] + q[1] * q[1] + q[2] * q[2] < 1e-8) found.push([t, iv]);
          }
        }
    }
    found.sort((p, q) => p[0] - q[0]);
    const r = found.map(x => x[1]); edgeCache.set(ck, ia < ib ? r : r.slice().reverse());
    return r;
  };
  M.F = F.map(f => { const out = []; for (let i = 0; i < f.length; i++) { out.push(f[i]); out.push(...onEdge(f[i], f[(i + 1) % f.length])); } return out; });
  return M;
}
/* Catmull–Clark subdivision on polygon faces (any number of sides), `levels` times */
function catmullClark(M, levels) {
  let { V, F } = M;
  for (let lv = 0; lv < levels; lv++) {
    const nV = V.length, FP = F.map(f => { const c = [0, 0, 0]; for (const i of f) { c[0] += V[i][0]; c[1] += V[i][1]; c[2] += V[i][2]; } return c.map(x => x / f.length); });
    const E = new Map(), ek = (a, b) => (a < b ? a * 4194304 + b : b * 4194304 + a);
    F.forEach((f, fi) => { for (let i = 0; i < f.length; i++) { const a = f[i], b = f[(i + 1) % f.length], k = ek(a, b); let e = E.get(k); if (!e) E.set(k, e = { a, b, f: [] }); e.f.push(fi); } });
    const NV = [], edgePt = new Map();
    for (const [k, e] of E) {
      const A = V[e.a], B = V[e.b];
      let p;
      if (e.f.length === 2) { const f1 = FP[e.f[0]], f2 = FP[e.f[1]]; p = [0, 1, 2].map(i => (A[i] + B[i] + f1[i] + f2[i]) / 4); }
      else p = [0, 1, 2].map(i => (A[i] + B[i]) / 2);
      edgePt.set(k, nV + F.length + NV.length); NV.push(p);
    }
    /* new positions of the old vertices */
    const vf = Array.from({ length: nV }, () => []), ve = Array.from({ length: nV }, () => []);
    F.forEach((f, fi) => f.forEach(i => vf[i].push(fi)));
    for (const e of E.values()) { ve[e.a].push(e); ve[e.b].push(e); }
    const OV = V.map((P, i) => {
      const es = ve[i], n = es.length; if (!n) return P.slice();
      const bnd = es.filter(e => e.f.length !== 2);
      if (bnd.length) { /* open edge: stay on the boundary curve */
        const s = [0, 0, 0]; for (const e of bnd) { const Q = V[e.a === i ? e.b : e.a]; s[0] += Q[0]; s[1] += Q[1]; s[2] += Q[2]; }
        return bnd.length === 2 ? [0, 1, 2].map(k => P[k] * 0.75 + s[k] * 0.125) : P.slice();
      }
      const Fa = [0, 0, 0]; for (const fi of vf[i]) { const c = FP[fi]; Fa[0] += c[0]; Fa[1] += c[1]; Fa[2] += c[2]; }
      const Ra = [0, 0, 0]; for (const e of es) { const Q = V[e.a === i ? e.b : e.a]; Ra[0] += (P[0] + Q[0]) / 2; Ra[1] += (P[1] + Q[1]) / 2; Ra[2] += (P[2] + Q[2]) / 2; }
      const m = vf[i].length;
      return [0, 1, 2].map(k => (Fa[k] / m + 2 * Ra[k] / n + (n - 3) * P[k]) / n);
    });
    const V2 = OV.concat(FP, NV), F2 = [];
    F.forEach((f, fi) => {
      for (let i = 0; i < f.length; i++) {
        const a = f[i], prev = f[(i - 1 + f.length) % f.length], next = f[(i + 1) % f.length];
        F2.push([a, edgePt.get(ek(a, next)), nV + fi, edgePt.get(ek(prev, a))]);
      }
    });
    V = V2; F = F2;
  }
  return { V, F };
}
/* faces → kernel triangles (quads split along the shorter diagonal) */
function toPolys(M) {
  const { V, F } = M, out = [];
  const P = V.map(p => p.map(x => Math.round(x * 1e5) / 1e5));
  const tri = (a, b, c) => { const q = KK.mkPoly([P[a], P[b], P[c]]); if (q) out.push(q); };
  for (const f of F) {
    if (f.length === 3) tri(f[0], f[1], f[2]);
    else if (f.length === 4) {
      const [a, b, c, d] = f, ac = len3(...[0, 1, 2].map(i => V[a][i] - V[c][i])), bd = len3(...[0, 1, 2].map(i => V[b][i] - V[d][i]));
      const ok = (x, y, z) => !!KK.mkPoly([P[x], P[y], P[z]]) && KK.surfaceArea([KK.mkPoly([P[x], P[y], P[z]])]) > 1e-9;
      const s1 = ok(a, b, c) && ok(a, c, d), s2 = ok(a, b, d) && ok(b, c, d);
      if (s1 && (ac <= bd || !s2)) { tri(a, b, c); tri(a, c, d); }
      else if (s2) { tri(a, b, d); tri(b, c, d); }
      else { const q = KK.mkPoly([P[a], P[b], P[c], P[d]]); if (q) out.push(q); } /* a triangle with one vertex on an edge: keep it whole */
    } else for (let i = 1; i < f.length - 1; i++) tri(f[0], f[i], f[i + 1]);
  }
  return out;
}
/* split triangle edges longer than L (only where `want(midpoint)` says so) until none is left or the mesh is too big */
function refine(polys, L, want, maxTris) {
  const M = fixTJunctions(indexed(polys)), V = M.V;
  let T = []; for (const f of M.F) for (let i = 1; i < f.length - 1; i++) T.push([f[0], f[i], f[i + 1]]);
  const lim = maxTris || 350000, L2 = L * L;
  for (let pass = 0; pass < 12 && T.length < lim; pass++) {
    const mid = new Map(), ek = (a, b) => (a < b ? a * 4194304 + b : b * 4194304 + a);
    const long = (a, b) => {
      const A = V[a], B = V[b], x = A[0] - B[0], y = A[1] - B[1], z = A[2] - B[2]; if (x * x + y * y + z * z <= L2) return false;
      return !want || want([(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2]);
    };
    const m = (a, b) => { const k = ek(a, b); let i = mid.get(k); if (i === undefined) { if (!long(a, b)) { mid.set(k, -1); return -1; } i = V.length; V.push([0, 1, 2].map(c => (V[a][c] + V[b][c]) / 2)); mid.set(k, i); } return i; };
    const T2 = []; let changed = false;
    for (const t of T) {
      const ms = [m(t[0], t[1]), m(t[1], t[2]), m(t[2], t[0])], cnt = ms.filter(x => x >= 0).length;
      if (!cnt) { T2.push(t); continue; }
      changed = true;
      let r = 0; /* rotate so the pattern starts at a fixed place */
      if (cnt === 1) r = ms.findIndex(x => x >= 0);
      else if (cnt === 2) r = (ms.findIndex(x => x < 0) + 1) % 3;
      const a = t[r], b = t[(r + 1) % 3], c = t[(r + 2) % 3], mab = ms[r], mbc = ms[(r + 1) % 3], mca = ms[(r + 2) % 3];
      if (cnt === 1) { T2.push([a, mab, c], [mab, b, c]); }
      else if (cnt === 2) { T2.push([mab, b, mbc], [a, mab, mbc], [a, mbc, c]); }
      else T2.push([a, mab, mca], [mab, b, mbc], [mca, mbc, c], [mab, mbc, mca]);
    }
    T = T2; if (!changed) break;
  }
  return { V, F: T };
}
/* ---------------- deformations ---------------- */
const AX = { x: 0, y: 1, z: 2 };
function deformSimple(polys, f) {
  const a = AX[f.axis] === undefined ? 2 : AX[f.axis], b = (a + 1) % 3, c = (a + 2) % 3, bb = KK.bbox(polys);
  const L = bb.max[a] - bb.min[a]; if (L < 1e-6) throw new Error('Těleso je v ose deformace ploché');
  const diag = len3(bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]);
  const M = refine(polys, Math.max(diag / 45, 0.3));
  const cb = (bb.min[b] + bb.max[b]) / 2, cc = (bb.min[c] + bb.max[c]) / 2;
  const t0 = clamp(Number(f.from === undefined ? 0 : f.from) / 100, 0, 1), t1 = clamp(Number(f.to === undefined ? 100 : f.to) / 100, 0, 1);
  const tt = s => (t1 > t0 ? clamp((s - t0) / (t1 - t0), 0, 1) : 0);
  const amt = Number(f.amount) || 0;
  for (const p of M.V) {
    const s = (p[a] - bb.min[a]) / L, t = tt(s);
    if (f.mode === 'twist') {
      const ang = amt * D2R * t, u = p[b] - cb, v = p[c] - cc, co = Math.cos(ang), si = Math.sin(ang);
      p[b] = cb + u * co - v * si; p[c] = cc + u * si + v * co;
    } else if (f.mode === 'taper') {
      const k = 1 + (amt / 100 - 1) * t; p[b] = cb + (p[b] - cb) * k; p[c] = cc + (p[c] - cc) * k;
    } else if (f.mode === 'bend') {
      if (Math.abs(amt) < 1e-6) continue;
      /* bend within the chosen part of the length; the rest follows straight along the tangent */
      const d = f.dir === 'c' ? c : b, cd = d === b ? cb : cc, Lb = L * (t1 - t0), al = amt * D2R, R = Lb / al;
      const z0 = bb.min[a] + L * t0, sAlong = clamp(p[a] - z0, 0, Lb), extra = p[a] - z0 - sAlong;
      const th = sAlong / R, u = p[d] - cd;
      let na = z0 + (R - u) * Math.sin(th), nd = cd + R - (R - u) * Math.cos(th);
      na += extra * Math.cos(th); nd += extra * Math.sin(th);
      p[a] = na; p[d] = nd;
    }
  }
  return toPolys(M);
}
/* free-form deformation by a lattice of n×n×n control points (Bernstein), offsets[i] = [dx,dy,dz] */
function bern(n, i, t) { let c = 1; for (let k = 0; k < i; k++) c = c * (n - k) / (k + 1); return c * Math.pow(t, i) * Math.pow(1 - t, n - i); }
function latticeBox(polys) { const bb = KK.bbox(polys), pad = [0, 1, 2].map(i => Math.max(0.5, (bb.max[i] - bb.min[i]) * 0.04)); return { min: bb.min.map((v, i) => v - pad[i]), max: bb.max.map((v, i) => v + pad[i]) }; }
function latticePoints(box, n) {
  const P = [];
  for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) P.push([i, j, k].map((q, a) => box.min[a] + (box.max[a] - box.min[a]) * q / (n - 1)));
  return P;
}
function deformLattice(polys, f) {
  const n = clamp(Math.round(Number(f.n) || 3), 2, 5), box = latticeBox(polys), off = f.pts || {};
  const bb = KK.bbox(polys), diag = len3(bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]);
  const M = refine(polys, Math.max(diag / 45, 0.3)), m = n - 1;
  const B = t => { const r = []; for (let i = 0; i <= m; i++) r.push(bern(m, i, t)); return r; };
  for (const p of M.V) {
    const u = [0, 1, 2].map(a => clamp((p[a] - box.min[a]) / (box.max[a] - box.min[a] || 1), 0, 1)), bu = B(u[0]), bv = B(u[1]), bw = B(u[2]);
    let dx = 0, dy = 0, dz = 0;
    for (const key in off) {
      const o = off[key], idx = Number(key); if (!o) continue;
      const i = idx % n, j = Math.floor(idx / n) % n, k = Math.floor(idx / (n * n)), w = bu[i] * bv[j] * bw[k];
      dx += w * (Number(o[0]) || 0); dy += w * (Number(o[1]) || 0); dz += w * (Number(o[2]) || 0);
    }
    p[0] += dx; p[1] += dy; p[2] += dz;
  }
  return toPolys(M);
}
/* soft move: a point drags its surroundings within radius r */
function softMove(polys, f) {
  const c = f.c.map(Number), dv = (f.d || [0, 0, 0]).map(Number), r = Math.max(0.1, Number(f.r) || 10);
  const M = refine(polys, Math.max(r / 10, 0.2), q => len3(q[0] - c[0], q[1] - c[1], q[2] - c[2]) < r * 1.15);
  const fall = f.fall === 'sharp' ? (t => (t >= 1 ? 0 : Math.pow(1 - t, 2))) : f.fall === 'sphere' ? (t => (t >= 1 ? 0 : Math.sqrt(1 - t * t))) : smooth;
  for (const p of M.V) { const w = fall(len3(p[0] - c[0], p[1] - c[1], p[2] - c[2]) / r); if (w) { p[0] += dv[0] * w; p[1] += dv[1] * w; p[2] += dv[2] * w; } }
  return toPolys(M);
}
function subdivide(polys, levels) {
  const lv = clamp(Math.round(Number(levels) || 1), 1, 4), M = fixTJunctions(indexed(polys));
  let faces = 0; for (const f of M.F) faces += f.length; if (faces * Math.pow(4, lv) > 1.6e6) throw new Error('Výsledek by měl příliš mnoho ploch, snižte počet úrovní');
  return toPolys(catmullClark(M, lv));
}

/* ---------------- sweeps and lofts ---------------- */
/* closed 2D profile (points) placed in 3D by origin o and axes u, v */
function ringOf(pts, o, u, v) { return pts.map(([x, y]) => [o[0] + u[0] * x + v[0] * y, o[1] + u[1] * x + v[1] * y, o[2] + u[2] * x + v[2] * y]); }
function areaSigned(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
/* resample a closed 2D loop to n points evenly along its length, starting at the point with the largest x+y·1e-3 */
function resample(pts, n) {
  const P = pts.slice(); if (areaSigned(P) < 0) P.reverse();
  let s0 = 0; P.forEach((p, i) => { if (p[0] + p[1] * 1e-3 > P[s0][0] + P[s0][1] * 1e-3) s0 = i; });
  const Q = P.slice(s0).concat(P.slice(0, s0)); Q.push(Q[0]);
  const cum = [0]; for (let i = 1; i < Q.length; i++) cum.push(cum[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]));
  const T = cum[cum.length - 1], out = []; let j = 0;
  for (let i = 0; i < n; i++) { const s = T * i / n; while (j < cum.length - 2 && cum[j + 1] < s) j++; const t = (s - cum[j]) / ((cum[j + 1] - cum[j]) || 1); out.push([Q[j][0] + (Q[j + 1][0] - Q[j][0]) * t, Q[j][1] + (Q[j + 1][1] - Q[j][1]) * t]); }
  return out;
}
function skinRings(rings, closedEnds) {
  const out = [], add = v => { const q = KK.mkPoly(v.map(p => p.map(x => Math.round(x * 1e5) / 1e5))); if (q) out.push(q); };
  const n = rings[0].length;
  for (let r = 0; r + 1 < rings.length; r++) {
    const A = rings[r], B = rings[r + 1];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; add([A[i], A[j], B[j]]); add([A[i], B[j], B[i]]); }
  }
  if (closedEnds) {
    for (const t of KK.capTris(rings[0])) add([t[0], t[2], t[1]]);
    for (const t of KK.capTris(rings[rings.length - 1])) add(t);
  }
  KK.fixOrientation(out);
  return out;
}
/* sweep: profile (2D points around their own centre) along a 3D path, frames by parallel transport, optional twist and
   end scale */
function sweep(path, profile, opts) {
  opts = opts || {};
  if (path.length < 2) throw new Error('Dráha je příliš krátká');
  /* dense, even path */
  const P = [path[0]]; for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i], L = len3(b[0] - a[0], b[1] - a[1], b[2] - a[2]); if (L < 1e-6) continue; const n = Math.max(1, Math.ceil(L / (opts.step || 2))); for (let k = 1; k <= n; k++) P.push([0, 1, 2].map(c => a[c] + (b[c] - a[c]) * k / n)); }
  if (P.length < 2) throw new Error('Dráha je příliš krátká');
  const tan = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; return KK.vnorm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]); });
  let u = KK.vnorm(Math.abs(tan[0][2]) < 0.9 ? KK.cross(tan[0], [0, 0, 1]) : KK.cross(tan[0], [1, 0, 0]));
  const prof = resample(profile, Math.max(12, Math.min(96, profile.length)));
  const cx = prof.reduce((s, p) => s + p[0], 0) / prof.length, cy = prof.reduce((s, p) => s + p[1], 0) / prof.length;
  const rings = [];
  for (let i = 0; i < P.length; i++) {
    if (i > 0) { /* parallel transport of u */
      const t0 = tan[i - 1], t1 = tan[i], ax = KK.cross(t0, t1), s = len3(ax[0], ax[1], ax[2]);
      if (s > 1e-9) { const c = KK.vdot(t0, t1), k = KK.vnorm(ax), th = Math.atan2(s, c); u = rodrigues(u, k, th); }
      u = KK.vnorm(KK.vsub(u, KK.vmul(t1, KK.vdot(u, t1))));
    }
    const t = i / (P.length - 1), tw = (Number(opts.twist) || 0) * D2R * t, sc = 1 + ((Number(opts.scale) || 100) / 100 - 1) * t;
    const v = KK.cross(tan[i], u), uu = rodrigues(u, tan[i], tw), vv = rodrigues(v, tan[i], tw);
    rings.push(ringOf(prof.map(([x, y]) => [(x - cx) * sc, (y - cy) * sc]), P[i], uu, vv));
  }
  return skinRings(rings, true);
}
function rodrigues(v, k, th) { const c = Math.cos(th), s = Math.sin(th), kv = KK.cross(k, v), d = KK.vdot(k, v); return [0, 1, 2].map(i => v[i] * c + kv[i] * s + k[i] * d * (1 - c)); }
/* loft through closed 3D loops (each given in its plane as 2D points with origin o and axes u, v); smooth: Catmull–Rom
   between sections */
function loft(sections, smoothOn) {
  if (sections.length < 2) throw new Error('Vyberte alespoň dva profily');
  const n = Math.max(24, Math.min(128, Math.max(...sections.map(s => s.pts.length))));
  /* every section resampled to n points, all running the same way round (seen along the loft) and starting at the point
     closest to the previous section's start */
  const rings = [];
  sections.forEach((s, si) => {
    let R = ringOf(resample(s.pts, n), s.o, s.u, s.v);
    if (si > 0) {
      const prev = rings[si - 1], dir = KK.vsub(cen(R), cen(prev)), nP = nrm(prev), nR = nrm(R);
      if (KK.vdot(nP, dir) * KK.vdot(nR, dir) < 0) R = R.slice().reverse();
      let best = 0, bd = Infinity; R.forEach((p, i) => { const d0 = len3(...KK.vsub(KK.vsub(p, cen(R)), KK.vsub(prev[0], cen(prev)))); if (d0 < bd) { bd = d0; best = i; } });
      R = R.slice(best).concat(R.slice(0, best));
    }
    rings.push(R);
  });
  let all = rings;
  if (smoothOn && rings.length > 2) {
    all = [];
    const steps = 8, get = i => rings[clamp(i, 0, rings.length - 1)];
    for (let r = 0; r + 1 < rings.length; r++) for (let s = 0; s < steps; s++) {
      const t = s / steps, p0 = get(r - 1), p1 = get(r), p2 = get(r + 1), p3 = get(r + 2);
      all.push(p1.map((_, i) => [0, 1, 2].map(c => 0.5 * ((2 * p1[i][c]) + (-p0[i][c] + p2[i][c]) * t + (2 * p0[i][c] - 5 * p1[i][c] + 4 * p2[i][c] - p3[i][c]) * t * t + (-p0[i][c] + 3 * p1[i][c] - 3 * p2[i][c] + p3[i][c]) * t * t * t))));
    }
    all.push(rings[rings.length - 1]);
  }
  return skinRings(all, true);
}
const cen = R => { const c = [0, 0, 0]; for (const p of R) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; } return c.map(x => x / R.length); };
const nrm = R => { let x = 0, y = 0, z = 0; for (let i = 0; i < R.length; i++) { const a = R[i], b = R[(i + 1) % R.length]; x += (a[1] - b[1]) * (a[2] + b[2]); y += (a[2] - b[2]) * (a[0] + b[0]); z += (a[0] - b[0]) * (a[1] + b[1]); } return KK.vnorm([x, y, z]); };

/* ---------------- 3D printing checks ---------------- */
/* per triangle: overhang (facing down more than `angle` from vertical, not on the bed) and thin walls (the opposite
   surface is closer than `thin` along the inward normal) */
function printCheck(polys, opts) {
  const ang = Number(opts.angle) || 45, thin = Number(opts.thin) || 0.8, T = trisOf(polys), bb = KK.bbox(polys), zBed = bb.min[2] + 0.2;
  const cosA = Math.cos((90 - ang) * D2R), N = T.map(t => KK.vnorm(KK.cross(KK.vsub(t[1], t[0]), KK.vsub(t[2], t[0]))));
  const cs = Math.max(thin, 0.5), hash = new Map(), key = (a, b, c) => a + ',' + b + ',' + c;
  T.forEach((t, ti) => {
    const mn = [0, 1, 2].map(k => Math.floor(Math.min(t[0][k], t[1][k], t[2][k]) / cs)), mx = [0, 1, 2].map(k => Math.floor(Math.max(t[0][k], t[1][k], t[2][k]) / cs));
    if ((mx[0] - mn[0] + 1) * (mx[1] - mn[1] + 1) * (mx[2] - mn[2] + 1) > 4000) return;
    for (let a = mn[0]; a <= mx[0]; a++) for (let b = mn[1]; b <= mx[1]; b++) for (let c = mn[2]; c <= mx[2]; c++) { const kk = key(a, b, c); let l = hash.get(kk); if (!l) hash.set(kk, l = []); l.push(ti); }
  });
  const flags = new Uint8Array(T.length); let aOver = 0, aThin = 0;
  T.forEach((t, ti) => {
    const n = N[ti], area = len3(...KK.cross(KK.vsub(t[1], t[0]), KK.vsub(t[2], t[0]))) / 2;
    if (n[2] < -cosA && Math.max(t[0][2], t[1][2], t[2][2]) > zBed) { flags[ti] |= 1; aOver += area; }
    /* thin: ray from the centre inward */
    const c = [0, 1, 2].map(k => (t[0][k] + t[1][k] + t[2][k]) / 3), dir = [-n[0], -n[1], -n[2]], o = [c[0] + dir[0] * 1e-3, c[1] + dir[1] * 1e-3, c[2] + dir[2] * 1e-3];
    const seen = new Set(); let hit = Infinity;
    for (let s = 0; s <= thin + cs * 0.5; s += cs * 0.5) {
      const q = [o[0] + dir[0] * s, o[1] + dir[1] * s, o[2] + dir[2] * s], l = hash.get(key(Math.floor(q[0] / cs), Math.floor(q[1] / cs), Math.floor(q[2] / cs)));
      if (!l) continue;
      for (const tj of l) { if (tj === ti || seen.has(tj)) continue; seen.add(tj); const d = rayTri(o, dir, T[tj]); if (d > 0 && d < hit) hit = d; }
    }
    if (hit < thin) { flags[ti] |= 2; aThin += area; }
  });
  return { tris: T, flags, overhang: aOver, thin: aThin };
}
function rayTri(o, d, t) {
  const e1 = KK.vsub(t[1], t[0]), e2 = KK.vsub(t[2], t[0]), p = KK.cross(d, e2), det = KK.vdot(e1, p);
  if (Math.abs(det) < 1e-12) return -1;
  const inv = 1 / det, s = KK.vsub(o, t[0]), u = KK.vdot(s, p) * inv; if (u < 0 || u > 1) return -1;
  const q = KK.cross(s, e1), v = KK.vdot(d, q) * inv; if (v < 0 || u + v > 1) return -1;
  return KK.vdot(e2, q) * inv;
}

/* ---------------- features ---------------- */
function blobPolysOf(f) {
  const F = blobField(f.el || [], f.k);
  const G = fillGrid(makeGrid(F.min, F.max, 0, QUALITY[f.q] || QUALITY.mid), F.f);
  return polygonize(G, F.f);
}
function skinElements(f) {
  const N = f.nodes || [], el = [], used = new Set();
  for (const [i, j] of f.edges || []) { const a = N[i], b = N[j]; if (!a || !b) continue; used.add(i); used.add(j); el.push({ t: 'rc', a: a.p, b: b.p, ra: a.d / 2, rb: b.d / 2 }); }
  N.forEach((n, i) => { if (!used.has(i)) el.push({ t: 'sphere', c: n.p, d: n.d }); });
  return el;
}
function skinPolysOf(f) {
  const el = skinElements(f); if (!el.length) throw new Error('Kostra nemá žádné body');
  const F = blobField(el, f.k);
  const G = fillGrid(makeGrid(F.min, F.max, 0, QUALITY[f.q] || QUALITY.mid), F.f);
  return polygonize(G, F.f);
}
/* voxel grid of a body, cached per body polygons and settings (sculpting re-uses it while you paint) */
const vcache = new WeakMap();
function bodyGrid(polys, q, roomy) {
  let m = vcache.get(polys); if (!m) vcache.set(polys, m = new Map());
  const key = q + (roomy ? '+' : '');
  let G = m.get(key);
  if (!G) {
    /* sculpting needs room around the body to grow into */
    const bb = KK.bbox(polys), size = Math.max(...[0, 1, 2].map(i => bb.max[i] - bb.min[i]));
    G = voxelize(polys, { maxCells: QUALITY[q] || QUALITY.mid, margin: roomy ? Math.max(5, size * 0.22) : undefined });
    m.set(key, G);
  }
  return G;
}
function sculptGrid(polys, f) {
  const G0 = bodyGrid(polys, f.q || 'mid', true), G = { ...G0, d: G0.d.slice() };
  for (const dab of f.dabs || []) applyDab(G, dab);
  return G;
}
function sculptPolys(polys, f) { return polygonize(sculptGrid(polys, f)); }
function remesh(polys, f) {
  const G = bodyGrid(polys, f.q || 'mid'), H = { ...G, d: G.d.slice() };
  for (let it = 0; it < (Number(f.smooth) || 0); it++) blur(H);
  return polygonize(H);
}
function blur(G) {
  const { nx, ny, nz, d } = G, s = d.slice();
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const p = i + nx * (j + ny * k);
    d[p] = (s[p] * 2 + s[p - 1] + s[p + 1] + s[p - nx] + s[p + nx] + s[p - nx * ny] + s[p + nx * ny]) / 8;
  }
}
/* hollow: walls of thickness t, optional drain hole (cylinder through the wall at point p along -normal n) */
function hollow(polys, f) {
  const t = Math.max(0.2, Number(f.t) || 2), G = bodyGrid(polys, f.q || 'mid'), H = { ...G, d: G.d.slice() }, d = H.d;
  if (t < H.h * 1.5) throw new Error('Stěna je na zvolenou jemnost příliš tenká; zvolte jemnější síť nebo silnější stěnu');
  let hole = null;
  if (f.hole && f.hole.p) {
    const p = f.hole.p.map(Number), n = KK.vnorm(f.hole.n.map(Number)), r = Math.max(0.3, Number(f.hole.d) || 4) / 2;
    hole = { a: p.map((v, i) => v + n[i] * (H.h * 3)), b: p.map((v, i) => v - n[i] * (t + H.h * 3)), r };
  }
  const { nx, ny, nz, h, o } = H;
  let anyInside = false;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const idx = i + nx * (j + ny * k), v = d[idx];
    let w = Math.max(v, -(v + t)); /* the shell between the surface and the surface moved inwards by t */
    if (v + t < 0) anyInside = true;
    if (hole) { const x = o[0] + i * h, y = o[1] + j * h, z = o[2] + k * h; w = Math.max(w, -sdRoundCone(x, y, z, hole.a, hole.b, hole.r, hole.r)); }
    d[idx] = w;
  }
  if (!anyInside) throw new Error('Těleso je na tuto tloušťku stěny příliš tenké');
  return polygonize(H);
}
/* flat base: cut off everything below `cut` mm above the lowest point and set it on z = 0 */
function flatBase(polys, f) {
  const bb = KK.bbox(polys), z = bb.min[2] + Math.max(0, Number(f.cut) || 0);
  const big = 1e4, box = KK.translate(KK.primitive('box', { w: big, d: big, h: big }), [(bb.min[0] + bb.max[0]) / 2, (bb.min[1] + bb.max[1]) / 2, z + big / 2]);
  let out = Number(f.cut) > 1e-6 ? KK.boolean(polys, box, 'intersect') : polys;
  if (!out.length) throw new Error('Řez je výš než těleso');
  if (f.drop !== false) out = KK.translate(out, [0, 0, -KK.bbox(out).min[2]]);
  return out;
}

return { rotMat, mulR, prepElement, blobField, makeGrid, fillGrid, polygonize, voxelize, sample, applyDab, BRUSHES, QUALITY, indexed, fixTJunctions, catmullClark, toPolys, refine,
  deformSimple, deformLattice, latticeBox, latticePoints, softMove, subdivide, sweep, loft, printCheck, blobPolysOf, skinPolysOf, skinElements, bodyGrid, sculptGrid, sculptPolys, remesh, hollow, flatBase, smin, sdRoundCone };
})();
if (typeof module !== 'undefined') module.exports = ORG;
