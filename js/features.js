/* Kóta feature engine: replays the timeline (feature list) into bodies. Pure JS on top of K. */
const Engine = (() => {
'use strict';
const KK = (typeof K !== 'undefined') ? K : require('./kernel.js');
const PLANES = {
  XY: { o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] },
  XZ: { o: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], n: [0, -1, 0] },
  YZ: { o: [0, 0, 0], u: [0, 1, 0], v: [0, 0, 1], n: [1, 0, 0] }
};
const FEATURE_LABEL = { boxpose: 'Poloha krabičky', latch: 'Západka', hinge: 'Pant', shell: 'Skořepina', hole: 'Díra', sketch: 'Skica', extrude: 'Vysunutí', revolve: 'Rotace', box: 'Krychle', cylinder: 'Válec', sphere: 'Koule', cone: 'Kužel', torus: 'Torus',
  fillet: 'Zaoblení', chamfer: 'Zkosení', combine: 'Kombinovat', move: 'Přesunout', rotate: 'Otočit', center: 'Zarovnat', offsetface: 'Upravit plochu', splitface: 'Rozdělit plochu', bendface: 'Ohnout plochu', splitbody: 'Rozříznout', thread: 'Závit', bolt: 'Šroub', nut: 'Matice', scale: 'Měřítko', mirror: 'Zrcadlit', pattern: 'Pole', import: 'Import', del: 'Odstranit těleso' };
let blobResolver = () => null;
const blobCache = new Map();
function blobPolys(id) {
  if (blobCache.has(id)) return blobCache.get(id);
  const b = blobResolver(id); if (!b) return null;
  const polys = KK.unpack(b); blobCache.set(id, polys); return polys;
}
const PRIM = {
  box: { lift: p => p.h / 2 }, cylinder: { lift: p => p.h / 2 }, cone: { lift: p => p.h / 2 }, sphere: { lift: p => p.r }, torus: { lift: p => p.t }
};

/* ---------- sketch loops and regions ---------- */
function closedLoops(sk) {
  const out = [];
  (sk.ents || []).forEach((e, i) => {
    if (e.cons) return; /* construction (helper) elements never form a profile */
    if (e.t === 'rect' && Math.abs(e.w) > 1e-6 && Math.abs(e.h) > 1e-6) out.push({ ei: i, pts: KK.profilePoints(e) });
    else if ((e.t === 'circle' || e.t === 'ngon') && e.r > 1e-6) out.push({ ei: i, pts: KK.profilePoints(e) });
    else if (e.t === 'slot' && Math.abs(e.w) > 1e-6) out.push({ ei: i, pts: KK.profilePoints(e) });
    else if (e.t === 'ellipse' && e.rx > 1e-6 && e.ry > 1e-6) out.push({ ei: i, pts: KK.profilePoints(e) });
    else if (e.t === 'spline' && e.closed && e.pts.length >= 3) { const pts = KK.profilePoints(e); if (Math.abs(KK.area2D(pts)) > 1e-6) out.push({ ei: i, pts }); }
    else if (e.t === 'poly' && e.closed && e.pts.length >= 3) { const pts = KK.profilePoints(e); if (Math.abs(KK.area2D(pts)) > 1e-6) out.push({ ei: i, pts }); }
    else if (e.t === 'text' && typeof skicaTextLoops === 'function') for (const pts of skicaTextLoops(e)) if (Math.abs(KK.area2D(pts)) > 1e-6) out.push({ ei: i, pts, txt: true });
  });
  return out;
}
function regions(sk) {
  const L = closedLoops(sk).map(l => ({ ...l, a: Math.abs(KK.area2D(l.pts)) }));
  L.forEach(A => { A.parents = L.filter(B => B !== A && B.a > A.a && A.pts.every(p => KK.inPoly2D(p, B.pts))).sort((s, t) => s.a - t.a); });
  /* the inside of a letter (the hole of an "o") is not a profile of its own */
  return L.filter(A => !A.txt || A.parents.filter(B => B.ei === A.ei).length % 2 === 0)
    .map(A => ({ ei: A.ei, pts: A.pts, holes: L.filter(C => C.parents[0] === A).map(C => ({ ei: C.ei, pts: C.pts })) }));
}

/* ---------- small math ---------- */
function eulerMatrix(c, t, rdeg) {
  const [x, y, z] = rdeg.map(d => d * Math.PI / 180);
  const a = Math.cos(x), b = Math.sin(x), cc = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const ae = a * e, af = a * f, be = b * e, bf = b * f;
  /* THREE 'XYZ' order, row-major rows */
  const R = [[cc * e, -cc * f, d], [af + be * d, ae - bf * d, -b * cc], [bf - ae * d, be + af * d, a * cc]];
  const T = [0, 1, 2].map(i => c[i] + t[i] - (R[i][0] * c[0] + R[i][1] * c[1] + R[i][2] * c[2]));
  return [R[0][0], R[1][0], R[2][0], 0, R[0][1], R[1][1], R[2][1], 0, R[0][2], R[1][2], R[2][2], 0, T[0], T[1], T[2], 1];
}
/* rotation (3x3, row-major) turning unit vector a onto unit vector b */
function rotBetween(a, b) {
  const c = KK.vdot(a, b);
  if (c > 1 - 1e-12) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  let ax;
  if (c < -1 + 1e-12) { ax = KK.vnorm(Math.abs(a[0]) < 0.9 ? KK.cross(a, [1, 0, 0]) : KK.cross(a, [0, 1, 0])); }
  else ax = KK.vnorm(KK.cross(a, b));
  const th = Math.acos(Math.max(-1, Math.min(1, c))), s = Math.sin(th), t = 1 - Math.cos(th), [x, y, z] = ax;
  return [[t * x * x + Math.cos(th), t * x * y - s * z, t * x * z + s * y], [t * x * y + s * z, t * y * y + Math.cos(th), t * y * z - s * x], [t * x * z - s * y, t * y * z + s * x, t * z * z + Math.cos(th)]];
}
const mulRv = (R, v) => [0, 1, 2].map(i => R[i][0] * v[0] + R[i][1] * v[1] + R[i][2] * v[2]);
/* face to face: src {kind:'plane', n, c} lands on dst plane (normals opposite, or the same with flip);
   axis to axis: src {kind:'cyl', a, c} becomes coaxial with dst. centerOn also matches the centres. */
function alignFaceMatrix(src, dst, flip, centerOn, gap) {
  if (!src || !dst) throw new Error('Vyberte obě plochy');
  if (src.kind !== dst.kind) throw new Error('Rovnou plochu lze zarovnat jen s rovnou plochou, válcovou jen s válcovou');
  const sa = KK.vnorm(src.kind === 'plane' ? src.n : src.a), da = KK.vnorm(dst.kind === 'plane' ? dst.n : dst.a);
  let target;
  if (src.kind === 'plane') target = flip ? da : KK.vmul(da, -1);
  else target = (KK.vdot(sa, da) >= 0) !== !!flip ? da : KK.vmul(da, -1);
  const R = rotBetween(sa, target), c = src.c, c2 = c; /* rotation about the source centre keeps it in place */
  let t;
  if (src.kind === 'plane') {
    const off = KK.vdot(KK.vsub(dst.c, c2), da) + gap;
    if (centerOn) { const inPlane = KK.vsub(KK.vsub(dst.c, c2), KK.vmul(da, KK.vdot(KK.vsub(dst.c, c2), da))); t = KK.vadd(inPlane, KK.vmul(da, off)); }
    else t = KK.vmul(da, off);
  } else {
    const d = KK.vsub(c2, dst.c), along = KK.vdot(d, da), foot = KK.vadd(dst.c, KK.vmul(da, centerOn ? 0 : along));
    t = KK.vadd(KK.vsub(foot, c2), KK.vmul(da, centerOn ? gap : 0));
  }
  const T = [0, 1, 2].map(i => c[i] + t[i] - (R[i][0] * c[0] + R[i][1] * c[1] + R[i][2] * c[2]));
  return [R[0][0], R[1][0], R[2][0], 0, R[0][1], R[1][1], R[2][1], 0, R[0][2], R[1][2], R[2][2], 0, T[0], T[1], T[2], 1];
}
function overlaps(a, b) {
  const A = KK.bbox(a), B = KK.bbox(b);
  for (let k = 0; k < 3; k++) if (A.max[k] < B.min[k] - 1e-3 || B.max[k] < A.min[k] - 1e-3) return false;
  return true;
}

/* ---------- edge descriptors ---------- */
function describe(ch) {
  if (ch.kind === 'line') return { k: 'line', a: ch.line.p0.map(r4), b: ch.line.p1.map(r4) };
  if (ch.kind === 'arc') return { k: 'arc', c: ch.circle.c.map(r4), r: r4(ch.circle.r), ax: ch.circle.axis.map(r4), a: ch.pts[0].map(r4), b: ch.pts[ch.pts.length - 1].map(r4) };
  if (ch.kind === 'circle') return { k: 'circle', c: ch.circle.c.map(r4), r: r4(ch.circle.r), ax: ch.circle.axis.map(r4) };
  return null;
}
const r4 = x => Math.round(x * 1e4) / 1e4;
const near = (p, q, t) => Math.abs(p[0] - q[0]) < t && Math.abs(p[1] - q[1]) < t && Math.abs(p[2] - q[2]) < t;
function matchEdge(chains, d) {
  const T = 0.02;
  return chains.find(ch => {
    if (d.k === 'line' && ch.kind === 'line') return (near(ch.line.p0, d.a, T) && near(ch.line.p1, d.b, T)) || (near(ch.line.p0, d.b, T) && near(ch.line.p1, d.a, T));
    if (d.k === 'arc' && ch.kind === 'arc') {
      const e0 = ch.pts[0], e1 = ch.pts[ch.pts.length - 1];
      return near(ch.circle.c, d.c, 0.05) && Math.abs(ch.circle.r - d.r) < 0.05 && ((near(e0, d.a, T) && near(e1, d.b, T)) || (near(e0, d.b, T) && near(e1, d.a, T)));
    }
    if (d.k === 'circle' && ch.kind === 'circle') return near(ch.circle.c, d.c, T) && Math.abs(ch.circle.r - d.r) < T && Math.abs(Math.abs(KK.vdot(ch.circle.axis, d.ax)) - 1) < 1e-3;
    return false;
  });
}

/* ---------- applying features ---------- */
function toolForExtrude(f, sketches) {
  const sk = sketches.get(f.sketch);
  if (!sk) throw new Error('Skica neexistuje');
  const regs = regions(sk), sel = (f.regions && f.regions.length ? f.regions : regs.map(r => r.ei));
  const B = sk.plane, d = Number(f.dist) || 0;
  if (Math.abs(d) < 1e-6) throw new Error('Nulová vzdálenost');
  const z0 = f.sym ? -Math.abs(d) / 2 : Math.min(0, d), z1 = f.sym ? Math.abs(d) / 2 : Math.max(0, d);
  let tool = [];
  for (const ei of sel) {
    for (const r of regs.filter(x => x.ei === ei)) { /* a text element has one region per letter */
    const solid = KK.extrudeProfiles([{ t: 'poly', pts: r.pts }, ...r.holes.map(h => ({ t: 'poly', pts: h.pts }))], B, z0, z1);
    tool = tool.length ? KK.boolean(tool, solid, 'union') : solid;
  } }
  if (!tool.length) throw new Error('Vyberte profil');
  return tool;
}
function revolveAxis(f, sk) {
  if (f.axis === 'v') return { p: [0, 0], d: [0, 1] };
  if (f.axis === 'u' || f.axis === undefined) return { p: [0, 0], d: [1, 0] };
  const e = (sk.ents || [])[f.axis];
  if (!e || e.t !== 'poly' || e.pts.length < 2) throw new Error('Osa rotace neexistuje');
  const a = e.pts[0], b = e.pts[e.pts.length - 1];
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-9) throw new Error('Osa rotace má nulovou délku');
  return { p: a, d: [b[0] - a[0], b[1] - a[1]] };
}
function toolForRevolve(f, sketches) {
  const sk = sketches.get(f.sketch);
  if (!sk) throw new Error('Skica neexistuje');
  const ang = Number(f.angle) || 0;
  if (Math.abs(ang) < 0.01) throw new Error('Nulový úhel');
  const ax = revolveAxis(f, sk), regs = regions(sk), sel = f.regions && f.regions.length ? f.regions : regs.map(r => r.ei);
  let tool = [];
  for (const ei of sel) {
    for (const r of regs.filter(x => x.ei === ei)) {
    const solid = KK.revolveProfiles([{ t: 'poly', pts: r.pts }, ...r.holes.map(h => ({ t: 'poly', pts: h.pts }))], sk.plane, ax, Math.max(-360, Math.min(360, ang)) * Math.PI / 180);
    tool = tool.length ? KK.boolean(tool, solid, 'union') : solid;
  } }
  if (!tool.length) throw new Error('Vyberte profil');
  return tool;
}
function importPolys(f) {
  const base = blobPolys(f.blob);
  if (!base) throw new Error('Data importu chybí');
  const s = Number(f.scale) > 0 ? Number(f.scale) : 1, bb = KK.bbox(base);
  const t = [0, 0, 0];
  if (f.center) { t[0] = -(bb.min[0] + bb.max[0]) / 2 * s; t[1] = -(bb.min[1] + bb.max[1]) / 2 * s; }
  if (f.ground) t[2] = -bb.min[2] * s;
  if (s === 1 && !t[0] && !t[1] && !t[2]) return base;
  return KK.transform(base, [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, t[0], t[1], t[2], 1]);
}
const THREADS = [[1.6, 0.35], [2, 0.4], [2.5, 0.45], [3, 0.5], [4, 0.7], [5, 0.8], [6, 1], [8, 1.25], [10, 1.5], [12, 1.75], [14, 2], [16, 2], [18, 2.5], [20, 2.5], [22, 2.5], [24, 3], [27, 3], [30, 3.5]];
/* best ISO metric size for a cylinder: outer diameter for bolts, minor diameter for holes */
function suggestThread(r, internal) {
  let best = THREADS[0], bd = Infinity;
  for (const t of THREADS) { const ref = internal ? t[0] - 1.0825 * t[1] : t[0]; const d = Math.abs(ref - 2 * r); if (d < bd) { bd = d; best = t; } }
  return { d: best[0], p: best[1] };
}
function threadTool(f) {
  const P = Number(f.pitch), d = Number(f.size), r = Number(f.r), L = Number(f.len);
  if (!(P > 0.05) || !(d > 0) || !(r > 0)) throw new Error('Neplatné parametry závitu');
  const start = Math.max(0, Math.min(L, Number(f.start) || 0));
  const len = f.full ? L - start : Math.max(0, Math.min(L - start, Number(f.length) || 0));
  if (len < P / 2) throw new Error('Závit je příliš krátký');
  const z0 = f.fromEnd ? L - start - len : start;
  const ax = KK.vnorm(f.ax), o = KK.vadd(f.c, KK.vmul(ax, z0)), inner = r * Math.cos(Math.PI / 40);
  const tol = Math.max(0, Math.min(1, Number(f.tol) || 0)); /* 3D-print clearance on the diameter (Thread command only; bolts and nuts pass an adjusted size) */
  let sp;
  if (f.internal) {
    /* clearance enlarges the whole profile (the minor diameter too, even when the hole was drawn at the nominal D1) */
    const D = d + tol;
    sp = { rConst: inner - 0.05, rCrest: Math.max(r, (D - 1.0825 * P) / 2) + 0.02, rRoot: D / 2, crestF: 0.25, rootF: 0.125 };
    if (sp.rRoot < sp.rCrest + 0.02) throw new Error('Díra je pro zvolenou velikost závitu příliš velká');
  } else {
    /* ISO 68-1 external profile: crest flat P/8, root at d3 = d - 1.2269 P; flanks kept at 60° all the way down, which leaves a root flat of P/6 (approximates the rounded root R = H/6) */
    /* clearance shrinks the whole profile (the crests too, even on a pin drawn at the nominal d) */
    const de = d - tol;
    sp = { rConst: r + 0.05, rCrest: Math.min(inner, de / 2) - 0.02, rRoot: de / 2 - 0.6134 * P, crestF: 0.125, rootF: 1 - 0.125 - 2 * 0.6134 * Math.tan(Math.PI / 6) };
    if (sp.rRoot > sp.rCrest - 0.02) throw new Error('Válec je pro zvolenou velikost závitu příliš tenký');
    if (sp.rRoot <= 0.05) throw new Error('Stoupání je pro tento průměr příliš velké');
  }
  return KK.threadGroove({ ...sp, o, ax, len, pitch: P, left: !!f.left, z0, segs: Math.max(36, Math.min(72, Math.round(Math.PI * d / 0.6))) });
}
/* column-major matrix mapping local (x, y, z) to a frame with z along ax starting at o */
function frameMatrix(o, ax) {
  const a = KK.vnorm(ax), u = KK.vnorm(Math.abs(a[0]) < 0.9 ? KK.cross(a, [1, 0, 0]) : KK.cross(a, [0, 1, 0])), v = KK.cross(a, u);
  return [u[0], u[1], u[2], 0, v[0], v[1], v[2], 0, a[0], a[1], a[2], 0, o[0], o[1], o[2], 1];
}
function cylAlong(o, ax, r, len) { return KK.transform(KK.translate(KK.primitive('cylinder', { r, h: len }), [0, 0, len / 2]), frameMatrix(o, ax)); }
function basisFromPlane(n, w) {
  const o = [n[0] * w, n[1] * w, n[2] * w];
  let u, v;
  if (Math.abs(n[2]) > 0.9) { u = KK.vnorm(KK.vsub([1, 0, 0], KK.vmul(n, n[0]))); v = KK.cross(n, u); }
  else { v = KK.vnorm(KK.vsub([0, 0, 1], KK.vmul(n, n[2]))); u = KK.cross(v, n); }
  return { o, u, v, n };
}
/* ---------- split faces ----------
   A body keeps its dividing lines (seams): {n, w, a, b} = the face plane and two points of the line. The mesh itself is not cut,
   the part of a face is cut out when it is used (selection, Upravit plochu, sketch from face). */
function seamXform(seams, m) {
  if (!seams || !seams.length) return seams;
  const P = v => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];
  const c0 = [m[0], m[1], m[2]], c1 = [m[4], m[5], m[6]], c2 = [m[8], m[9], m[10]], det = KK.vdot(c0, KK.cross(c1, c2));
  const ca = KK.cross(c1, c2), cb = KK.cross(c2, c0), cc = KK.cross(c0, c1); /* normals transform with the inverse transpose */
  return seams.map(q => {
    let n = [0, 1, 2].map(k => q.n[0] * ca[k] + q.n[1] * cb[k] + q.n[2] * cc[k]);
    n = KK.vnorm(det < 0 ? KK.vmul(n, -1) : n);
    const A = P(q.a), B = P(q.b);
    return { n, w: KK.vdot(n, A), a: A, b: B };
  });
}
const xfBody = (x, m) => ({ ...x, polys: KK.transform(x.polys, m), seams: seamXform(x.seams, m) });
const mvBody = (x, t) => ({ ...x, polys: KK.translate(x.polys, t), seams: seamXform(x.seams, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1]) });
function seamPatch(polys, q) { return KK.planarFace(polys, q.n, q.w, q.a) || KK.planarFace(polys, q.n, q.w, q.b); }
function seamPlane(q) { const m = KK.vnorm(KK.cross(q.n, KK.vsub(q.b, q.a))); return { m, d: KK.vdot(m, q.a) }; }
/* half-planes cutting out the part of a planar face (polygon indices `group`) that contains point p */
function faceClip(polys, seams, n, w, group, p) {
  const out = [], gs = new Set(group);
  for (const q of seams || []) {
    if (KK.vdot(q.n, n) < 0.9999 || Math.abs(q.w - w) > 2e-3) continue;
    const g = seamPatch(polys, q); if (!g || !g.some(i => gs.has(i))) continue;
    const h = seamPlane(q), sd = KK.vdot(h.m, p) - h.d;
    out.push(sd >= 0 ? h : { m: KK.vmul(h.m, -1), d: -h.d });
  }
  return out;
}
function clipConvex(v, h) {
  const out = [], E = 1e-9;
  for (let i = 0; i < v.length; i++) {
    const a = v[i], b = v[(i + 1) % v.length], da = KK.vdot(h.m, a) - h.d, db = KK.vdot(h.m, b) - h.d;
    if (da >= -E) out.push(a);
    if ((da > E && db < -E) || (da < -E && db > E)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
  }
  return out;
}
/* the face polygons clipped to the half-planes (convex pieces in the face plane) */
function clipRegion(polys, group, clip) {
  const out = [];
  for (const i of group) {
    let v = polys[i].v;
    for (const h of clip) { v = clipConvex(v, h); if (v.length < 3) break; }
    if (v.length >= 3) { const q = { v, n: polys[i].n, w: polys[i].w }; if (KK.surfaceArea([q]) > 1e-8) out.push(q); }
  }
  return out;
}
/* polyline segments (flat xyz array) where the seams cross their faces, for drawing */
function seamSegments(polys, seams) {
  const arr = [];
  for (const q of seams || []) {
    const g = seamPatch(polys, q); if (!g) continue;
    const h = seamPlane(q), dir = KK.vnorm(KK.vsub(q.b, q.a));
    for (const i of g) {
      const v = polys[i].v; let t0 = Infinity, t1 = -Infinity;
      for (let k = 0; k < v.length; k++) {
        const a = v[k], b = v[(k + 1) % v.length], da = KK.vdot(h.m, a) - h.d, db = KK.vdot(h.m, b) - h.d;
        if ((da >= 0) === (db >= 0) && Math.abs(da) > 1e-9 && Math.abs(db) > 1e-9) continue;
        const t = Math.abs(da - db) < 1e-12 ? 0 : da / (da - db), x = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        const s = KK.vdot(KK.vsub(x, q.a), dir); t0 = Math.min(t0, s); t1 = Math.max(t1, s);
      }
      if (t1 - t0 > 1e-6) { const A = KK.vadd(q.a, KK.vmul(dir, t0)), B = KK.vadd(q.a, KK.vmul(dir, t1)); arr.push(...A, ...B); }
    }
  }
  return arr;
}
/* outline loops (2D, in basis B) of a planar face or of its part cut out by half-planes */
function faceLoops2D(polys, f, B) {
  const g = KK.planarFace(polys, f.n, f.w, f.p);
  if (!g) throw new Error('Plocha nebyla nalezena');
  const cp = f.clip && f.clip.length ? clipRegion(polys, g, f.clip) : null;
  if (cp && !cp.length) throw new Error('Část plochy nebyla nalezena');
  return (cp ? KK.faceLoops(cp, cp.map((_, i) => i)) : KK.faceLoops(polys, g)).map(l => l.map(q => { const dq = KK.vsub(q, B.o); return [KK.vdot(dq, B.u), KK.vdot(dq, B.v)]; }));
}
/* bend a planar face: the face is revolved about a line in its plane (one of its edges, moved outwards by the bend radius)
   into the space in front of it, so the body continues around a bend and ends in a tilted face that can be extruded further */
function bendFaceTool(polys, f) {
  const ang = Number(f.angle) || 0;
  if (!(Math.abs(ang) >= 0.5 && Math.abs(ang) <= 180)) throw new Error('Úhel ohybu musí být 0,5° až 180°');
  const B = basisFromPlane(f.n, f.w), loops = faceLoops2D(polys, f, B);
  if (!loops.length) throw new Error('Obrys plochy se nepodařilo určit');
  const to2 = q => { const dq = KK.vsub(q, B.o); return [KK.vdot(dq, B.u), KK.vdot(dq, B.v)]; };
  const A = to2(f.axis.a), Bp = to2(f.axis.b);
  let d = [Bp[0] - A[0], Bp[1] - A[1]]; const dl = Math.hypot(d[0], d[1]);
  if (dl < 1e-6) throw new Error('Osa ohybu není určená');
  d = [d[0] / dl, d[1] / dl];
  /* the face must lie on the left of the axis (+per side) so that a positive angle sweeps in front of the face */
  const all = loops.flat(); let side = 0;
  for (const q of all) side += (q[0] - A[0]) * -d[1] + (q[1] - A[1]) * d[0];
  if (side < 0) d = [-d[0], -d[1]];
  const per = [-d[1], d[0]];
  /* points a hair across the axis (rounded coordinates) push the axis out by that much; more means the axis cuts the face */
  let minD = Infinity; for (const q of all) minD = Math.min(minD, (q[0] - A[0]) * per[0] + (q[1] - A[1]) * per[1]);
  if (minD < -1e-3) throw new Error('Osa ohybu musí ležet na okraji plochy, ne uvnitř');
  const r = Math.max(0, Number(f.radius) || 0) + Math.max(0, -minD) + 1e-6, P0 = [A[0] - per[0] * r, A[1] - per[1] * r];
  /* the sweep starts slightly (EPS) inside the body, so the union never meets the face coplanar and the swept side walls
     never run tangent to the body's walls (that left a pinched, non-manifold rim on cylinders); the end face stays at the angle */
  const EPS = 0.5, sg = ang < 0 ? -1 : 1;
  const tool = KK.revolveProfiles(loops.map(l => ({ t: 'poly', pts: l })), B, { p: P0, d }, (ang + sg * EPS) * Math.PI / 180);
  if (!tool.length) throw new Error('Ohyb se nepodařilo vytvořit');
  const o3 = KK.vadd(B.o, KK.vadd(KK.vmul(B.u, P0[0]), KK.vmul(B.v, P0[1]))), k = KK.vnorm(KK.vadd(KK.vmul(B.u, d[0]), KK.vmul(B.v, d[1])));
  /* rotation by -EPS about the bend axis (Rodrigues), column-major; the sweep turns from the face towards +n about k x per */
  const per3 = KK.vadd(KK.vmul(B.u, -d[1]), KK.vmul(B.v, d[0])), sgnAx = KK.vdot(KK.cross(per3, B.n), k) >= 0 ? 1 : -1;
  const th = -sg * sgnAx * EPS * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), t = 1 - c, [x, y, z] = k;
  const Rm = [t * x * x + c, t * x * y + s * z, t * x * z - s * y, t * x * y - s * z, t * y * y + c, t * y * z + s * x, t * x * z + s * y, t * y * z - s * x, t * z * z + c];
  const ro = [o3[0] - (Rm[0] * o3[0] + Rm[3] * o3[1] + Rm[6] * o3[2]), o3[1] - (Rm[1] * o3[0] + Rm[4] * o3[1] + Rm[7] * o3[2]), o3[2] - (Rm[2] * o3[0] + Rm[5] * o3[1] + Rm[8] * o3[2])];
  return KK.transform(tool, [Rm[0], Rm[1], Rm[2], 0, Rm[3], Rm[4], Rm[5], 0, Rm[6], Rm[7], Rm[8], 0, ro[0], ro[1], ro[2], 1]);
}
/* cutting tool of Rozříznout: the whole half-space, or (a smaller cutting face) a square prism standing on the face,
   which cuts out only the part of the body in front of that square */
function cutTool(f, n, w, bb) {
  if (!f.rect) return halfSpace(n, w, bb);
  const r = f.rect, S = Number(r.size) / 2, D = Math.hypot(bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]) * 2 + 10;
  if (!(S > 0)) throw new Error('Velikost řezné plochy musí být větší než 0');
  const B = { o: r.c.map(Number), u: KK.vnorm(r.u.map(Number)), v: KK.vnorm(r.v.map(Number)), n };
  return KK.extrudeProfiles([{ t: 'poly', pts: [[-S, -S], [S, -S], [S, S], [-S, S]] }], B, 0, D);
}
/* half-space solid on the +n side of the plane n·x = w, large enough to contain the given bounding box */
function halfSpace(n, w, bb) {
  const c = [0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2), D = Math.hypot(bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]) * 2 + 10;
  const B = basisFromPlane(n, w), off = KK.vdot(KK.vsub(c, B.o), B.u), offv = KK.vdot(KK.vsub(c, B.o), B.v);
  return KK.extrudeProfiles([{ t: 'poly', pts: [[off - D, offv - D], [off + D, offv - D], [off + D, offv + D], [off - D, offv + D]] }], B, 0, D);
}
/* direct face edit: new diameter for a cylindrical face, or push / pull a planar face */
function offsetFaceTool(polys, f) {
  if (f.kind === 'cyl') {
    const r = Number(f.r), nr = Number(f.newR), len = Number(f.len);
    if (!(nr > 0.05)) throw new Error('Průměr musí být větší než 0,1 mm');
    if (Math.abs(nr - r) < 1e-4) throw new Error('Průměr se nezměnil');
    const outer = r / Math.cos(Math.PI / 40) + 0.02;
    if (f.internal) {
      if (nr > r) return [{ op: 'subtract', tool: cylAlong(f.c, f.ax, nr, len) }];
      return [{ op: 'union', tool: cylAlong(f.c, f.ax, outer, len) }, { op: 'subtract', tool: cylAlong(f.c, f.ax, nr, len) }];
    }
    if (nr > r) return [{ op: 'union', tool: cylAlong(f.c, f.ax, nr, len) }];
    const tube = KK.boolean(cylAlong(f.c, f.ax, outer + 0.05, len), cylAlong(f.c, f.ax, nr, len), 'subtract');
    return [{ op: 'subtract', tool: tube }];
  }
  const d = Number(f.d);
  if (!(Math.abs(d) > 1e-4)) throw new Error('Zadejte odsazení různé od nuly');
  const g = KK.planarFace(polys, f.n, f.w, f.p);
  if (!g) throw new Error('Plocha nebyla nalezena');
  const B = basisFromPlane(f.n, f.w);
  const cp = f.clip && f.clip.length ? clipRegion(polys, g, f.clip) : null;
  if (cp && !cp.length) throw new Error('Část plochy nebyla nalezena');
  const loops = (cp ? KK.faceLoops(cp, cp.map((_, i) => i)) : KK.faceLoops(polys, g)).map(l => ({ t: 'poly', pts: l.map(q => { const dq = KK.vsub(q, B.o); return [KK.vdot(dq, B.u), KK.vdot(dq, B.v)]; }) }));
  if (!loops.length) throw new Error('Obrys plochy se nepodařilo určit');
  const tool = d > 0 ? KK.extrudeProfiles(loops, B, -0.01, d) : KK.extrudeProfiles(loops, B, d, 0.01);
  return [{ op: d > 0 ? 'union' : 'subtract', tool }];
}
/* ---------- shell (skořepina): hollow a body with a given wall thickness, optionally opening chosen planar faces ----------
   Every vertex moves to the point lying t inside all faces around it (least squares over their planes); faces chosen
   as open move t outward instead, so the inner solid pokes through them and the subtraction opens them. */
function shellBody(polys, f) {
  const t = Number(f.t);
  if (!(t >= 0.1)) throw new Error('Tloušťka stěny musí být alespoň 0,1 mm');
  const open = new Set();
  for (const fd of f.faces || []) { const g = KK.planarFace(polys, fd.n, fd.w, fd.p); if (!g || !g.length) throw new Error('Otevřená plocha nebyla nalezena'); g.forEach(i => open.add(i)); }
  const vm = new Map();
  polys.forEach((p, i) => {
    const d = KK.vdot(p.n, p.v[0]) + (open.has(i) ? t : -t);
    for (const v of p.v) {
      const k = KK.qk(v); let e = vm.get(k); if (!e) vm.set(k, e = { v, pl: [] });
      const q = e.pl.find(x => KK.vdot(x.n, p.n) > 1 - 1e-7);
      if (!q) e.pl.push({ n: p.n, d }); else if (open.has(i)) q.d = d; /* an open face wins over a coplanar closed piece */
    }
  });
  const eps = 1e-6;
  for (const e of vm.values()) {
    const A = [[eps, 0, 0], [0, eps, 0], [0, 0, eps]], b = [eps * e.v[0], eps * e.v[1], eps * e.v[2]];
    for (const { n, d } of e.pl) for (let r = 0; r < 3; r++) { for (let c = 0; c < 3; c++) A[r][c] += n[r] * n[c]; b[r] += n[r] * d; }
    const det = M => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
    const D = det(A); if (Math.abs(D) < 1e-18) { e.x = e.v; continue; }
    e.x = [0, 1, 2].map(c => det(A.map((row, r) => row.map((x, j) => (j === c ? b[r] : x)))) / D);
    /* a vertex must not run far away (nearly parallel faces around a sharp edge) */
    const L = Math.hypot(e.x[0] - e.v[0], e.x[1] - e.v[1], e.x[2] - e.v[2]); if (L > t * 6) { const s = t * 6 / L; e.x = e.v.map((v, k) => v + (e.x[k] - v) * s); }
  }
  const inner = polys.map(p => KK.mkPoly(p.v.map(v => vm.get(KK.qk(v)).x))).filter(Boolean);
  const V0 = KK.signedVolume(polys), Vi = KK.signedVolume(inner);
  if (!(Vi > V0 * 1e-4) || Vi >= V0) throw new Error('Stěna je na toto těleso příliš silná');
  const out = KK.boolean(polys, inner, 'subtract'), V1 = KK.signedVolume(out);
  if (!out.length || !(V1 > 0) || V1 >= V0 - 1e-6) throw new Error('Skořepinu se nepodařilo vytvořit');
  return out;
}
function offsetFace(polys, f) {
  let out = polys;
  for (const s of offsetFaceTool(polys, f)) out = KK.boolean(out, s.tool, s.op);
  if (!out.length) throw new Error('Úprava plochy by odstranila celé těleso');
  return out;
}
/* ---------- ISO metric bolts and nuts ----------
   size: [pitch, hex across flats (ISO 4017 / 4032), hex head height, nut height, socket head diameter (ISO 4762), hex key, socket depth] */
const FASTENERS = {
  2: [0.4, 4, 1.4, 1.6, 3.8, 1.5, 1], 2.5: [0.45, 5, 1.7, 2, 4.5, 2, 1.1], 3: [0.5, 5.5, 2, 2.4, 5.5, 2.5, 1.3], 4: [0.7, 7, 2.8, 3.2, 7, 3, 2],
  5: [0.8, 8, 3.5, 4.7, 8.5, 4, 2.5], 6: [1, 10, 4, 5.2, 10, 5, 3], 8: [1.25, 13, 5.3, 6.8, 13, 6, 4], 10: [1.5, 16, 6.4, 8.4, 16, 8, 5],
  12: [1.75, 18, 7.5, 10.8, 18, 10, 6], 16: [2, 24, 10, 14.8, 24, 14, 8], 20: [2.5, 30, 12.5, 18, 30, 17, 10], 24: [3, 36, 15, 21.5, 36, 19, 12]
};
/* thin (jam) nuts ISO 4035: height m max; across flats as ISO 4032 */
const THIN_NUT = { 2: 1.2, 2.5: 1.6, 3: 1.8, 4: 2.2, 5: 2.7, 6: 3.2, 8: 4, 10: 5, 12: 6, 16: 8, 20: 10, 24: 12 };
/* screwdriver heads: slotted cheese head (ISO 1207): [dk, k, slot width, slot depth]; Phillips pan head (ISO 7045): [dk, k] (recess approximated) */
const SLOT_HEADS = { 2: [3.8, 1.3, 0.5, 0.6], 2.5: [4.5, 1.6, 0.6, 0.7], 3: [5.5, 2, 0.8, 0.85], 4: [7, 2.6, 1.2, 1.1], 5: [8.5, 3.3, 1.2, 1.3], 6: [10, 3.9, 1.6, 1.6], 8: [13, 5, 2, 2], 10: [16, 6, 2.5, 2.4], 12: [18, 7, 3, 2.8], 16: [24, 9, 4, 3.6], 20: [30, 11, 5, 4.4], 24: [36, 13, 6, 5.2] };
const PAN_HEADS = { 2: [4, 1.6], 2.5: [5, 1.75], 3: [5.6, 2.4], 4: [8, 3.1], 5: [9.5, 3.7], 6: [12, 4.6], 8: [16, 6], 10: [20, 7.5], 12: [24, 9], 16: [32, 12], 20: [40, 15], 24: [48, 18] };
const XYB = { o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] };
const hexPrism = (af, z0, z1) => KK.extrudeProfiles([{ t: 'ngon', x: 0, y: 0, r: af / Math.sqrt(3), n: 6, a: 30 }], XYB, z0, z1);
/* ---------- hole for a bolt (Díra) with an optional nut pocket ----------
   clearance holes ISO 273 medium, counterbores for socket heads DIN 974, 90° countersinks ISO 15065 */
const HOLE_CLEAR = { 2: 2.4, 2.5: 2.9, 3: 3.4, 4: 4.5, 5: 5.5, 6: 6.6, 8: 9, 10: 11, 12: 13.5, 16: 17.5, 20: 22, 24: 26 };
const HOLE_CBORE = { 2: 4.4, 2.5: 5.5, 3: 6.5, 4: 8, 5: 10, 6: 11, 8: 15, 10: 18, 12: 20, 16: 26, 20: 33, 24: 40 };
const HOLE_CSINK = { 2: 4.4, 2.5: 5.5, 3: 6.3, 4: 8.3, 5: 10.4, 6: 12.4, 8: 16.4, 10: 20.4, 12: 24.4, 16: 32.4, 20: 40.4, 24: 48.4 };
/* how deep a ray from p along a runs inside the polys: the nearest face where it leaves the material (the far side of the wall) */
function rayExit(polys, p, a) {
  let best = Infinity;
  for (const q of polys) {
    const dn = KK.vdot(q.n, a); if (dn < 1e-9) continue; /* only faces the ray leaves through */
    const t = (q.w - KK.vdot(q.n, p)) / dn; if (!(t > 1e-4) || t >= best) continue;
    const x = KK.vadd(p, KK.vmul(a, t)), ax = Math.abs(q.n[0]) > Math.abs(q.n[1]) ? (Math.abs(q.n[0]) > Math.abs(q.n[2]) ? 0 : 2) : (Math.abs(q.n[1]) > Math.abs(q.n[2]) ? 1 : 2);
    const i0 = ax === 0 ? 1 : 0, i1 = ax === 2 ? 1 : 2;
    if (KK.inPoly2D([x[i0], x[i1]], q.v.map(v => [v[i0], v[i1]]))) best = t;
  }
  return isFinite(best) ? best : 0;
}
/* f: { size, kind: 'clear' | 'socket' | 'csk' | 'thread', n (face normal, out of the body), p (point on the face), through, depth, cbDepth, tol,
        nut: 'none' | 'top' | 'bottom' | 'side', nutLow, nutTol, nutDepth, nutDir (deg, in the face plane) } */
function toolForHole(f, bodies) {
  const d = Number(f.size), M = FASTENERS[d]; if (!M) throw new Error('Neznámá velikost závitu');
  const [P, s, , m0] = M, tol = Math.max(0, Math.min(1, Number(f.tol) || 0)), n = KK.vnorm(f.n), a = KK.vmul(n, -1), p = f.p;
  const B = basisFromPlane(n, KK.vdot(n, p)), U = B.u, V = KK.cross(a, U), W = KK.cross(n, U);
  const mat = [U[0], U[1], U[2], 0, V[0], V[1], V[2], 0, a[0], a[1], a[2], 0, p[0], p[1], p[2], 1];
  let depth = Number(f.depth) || 0;
  if (f.through !== false) {
    const b = (bodies || []).find(x => x.id === f.body), polys = b ? b.polys : (bodies || []).flatMap(x => x.polys);
    depth = rayExit(polys, KK.vadd(p, KK.vmul(a, -1e-3)), a);
    if (!(depth > 0.05)) throw new Error('Díra neprochází tělesem, klepněte na stěnu tělesa');
  }
  if (!(depth > 0.05)) throw new Error('Zadejte hloubku díry');
  const z1 = f.through !== false ? depth + 1 : depth, cyl = (r, za, zb) => KK.translate(KK.primitive('cylinder', { r, h: zb - za }), [0, 0, (za + zb) / 2]);
  const parts = [];
  if (f.kind === 'thread') {
    const de = d + tol, rh = (de - 1.0825 * P) / 2;
    parts.push(cyl(rh, -1, z1));
    parts.push(threadTool({ internal: true, pitch: P, size: de, r: rh, len: depth, start: 0, full: true, ax: [0, 0, 1], c: [0, 0, 0] }));
  } else {
    const rb = (HOLE_CLEAR[d] || d * 1.1) / 2 + tol / 2;
    parts.push(cyl(rb, -1, z1));
    if (f.kind === 'socket') { const rc = (HOLE_CBORE[d] || M[4] + 1) / 2 + tol / 2, cd = Number(f.cbDepth) > 0 ? Number(f.cbDepth) : d + 0.4; parts.push(cyl(rc, -1, Math.min(cd, depth))); }
    if (f.kind === 'csk') { const R = (HOLE_CSINK[d] || d * 2) / 2 + tol / 2, h = R - rb; parts.push(cyl(R, -1, 0.001)); if (h > 0.01) parts.push(KK.translate(KK.primitive('cone', { r: R, rt: rb, h }), [0, 0, h / 2])); }
  }
  if (f.nut && f.nut !== 'none') {
    const nt = Number(f.nutTol); const ntol = nt >= 0 && nt <= 1 ? nt : 0.3;
    const af = s + ntol, hN = (f.nutLow ? THIN_NUT[d] : m0) + ntol;
    /* hex flats parallel to the insertion direction (local +y after the turn) */
    const dir = (Number(f.nutDir) || 0) * Math.PI / 180, dw = KK.vadd(KK.vmul(U, Math.cos(dir)), KK.vmul(W, Math.sin(dir)));
    const lx = KK.vdot(dw, U), ly = KK.vdot(dw, V), turn = Math.atan2(ly, lx) - Math.PI / 2, c = Math.cos(turn), sn = Math.sin(turn);
    const rotZ = [c, sn, 0, 0, -sn, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    if (f.nut === 'top') parts.push(hexPrism(af, -1, hN));
    else if (f.nut === 'bottom') parts.push(hexPrism(af, depth - hN, depth + 1));
    else {
      const zc = Math.max(hN / 2 + 0.4, Math.min(depth - hN / 2 - 0.4, Number(f.nutDepth) || depth / 2)), L = 1000;
      parts.push(KK.transform(hexPrism(af, zc - hN / 2, zc + hN / 2), rotZ));
      parts.push(KK.transform(KK.translate(KK.primitive('box', { w: af, d: L, h: hN }), [0, L / 2, zc]), rotZ));
    }
  }
  let tool = parts[0]; for (const q of parts.slice(1)) tool = KK.boolean(tool, q, 'union');
  return KK.transform(tool, mat);
}
/* a bolt stands on its head (head z 0..k, shank above it), a nut lies on z = 0; tol is the 3D-printing clearance */
function toolForFastener(f) {
  const d = Number(f.size), M = FASTENERS[d]; if (!M) throw new Error('Neznámá velikost závitu');
  const [P, s, k, m0, dk, key, tk] = M, tol = Math.max(0, Math.min(1, Number(f.tol) || 0)), thread = f.thread !== false;
  let polys;
  if (f.type === 'bolt') {
    const L = Number(f.len); if (!(L >= 2 * P && L <= 500)) throw new Error('Délka šroubu musí být ' + (2 * P) + ' až 500 mm');
    const de = d - tol, r = de / 2, socket = f.head === 'socket', slotted = f.head === 'slotted', phil = f.head === 'phillips', hexSlot = f.head === 'hexslot', hexCross = f.head === 'hexcross';
    const SH = SLOT_HEADS[d], PH = PAN_HEADS[d];
    const hk = socket ? d : slotted ? SH[1] : phil ? PH[1] : k;
    const head = socket ? cylAlong([0, 0, 0], [0, 0, 1], dk / 2, hk) : slotted ? cylAlong([0, 0, 0], [0, 0, 1], SH[0] / 2, hk) : phil ? cylAlong([0, 0, 0], [0, 0, 1], PH[0] / 2, hk) : hexPrism(s, 0, hk);
    polys = KK.boolean(head, cylAlong([0, 0, hk - 0.02], [0, 0, 1], r, L + 0.02), 'union');
    /* the driving recess is in the face the bolt stands on (z = 0) */
    const slotBox = (w, l, depth, rot) => { const b = KK.translate(KK.primitive('box', { w: l, d: w, h: depth + 0.5 }), [0, 0, (depth - 0.5) / 2]); return rot ? KK.transform(b, [0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) : b; };
    if (socket) polys = KK.boolean(polys, hexPrism(key + tol, -0.5, Math.min(tk, hk - 0.6)), 'subtract');
    if (slotted) polys = KK.boolean(polys, slotBox(SH[2] + tol, SH[0] + 1, Math.min(SH[3], hk - 0.4), false), 'subtract');
    if (phil) {
      const w = Math.max(0.6, PH[0] * 0.13) + tol, l = PH[0] * 0.55, dep = Math.min(hk * 0.6, hk - 0.4);
      polys = KK.boolean(polys, KK.boolean(slotBox(w, l, dep, false), slotBox(w, l, dep, true), 'union'), 'subtract');
    }
    /* hex head with a screwdriver slot or cross as well (slot through the whole head width) */
    if (hexSlot) polys = KK.boolean(polys, slotBox(SH[2] + tol, s * 1.2 + 1, Math.min(SH[3], hk - 0.4), false), 'subtract');
    if (hexCross) {
      const w = Math.max(0.6, s * 0.13) + tol, l = s * 0.6, dep = Math.min(hk * 0.6, hk - 0.4);
      polys = KK.boolean(polys, KK.boolean(slotBox(w, l, dep, false), slotBox(w, l, dep, true), 'union'), 'subtract');
    }
    if (f.chamfer !== false) {
      /* 45° lead-in at the tip, down to the thread root diameter (cut before the thread: cleaner mesh) */
      const T = hk + L, c = Math.min(P, L / 3), rm = thread ? Math.max(0.3, de / 2 - 0.6134 * P) : Math.max(0.3, r - c), R = rm + c;
      const keep = KK.translate(KK.primitive('cone', { r: R, h: R }), [0, 0, T - c + R / 2]);
      const ring = KK.boolean(cylAlong([0, 0, T - c], [0, 0, 1], r + 1, c + 1), keep, 'subtract');
      polys = KK.boolean(polys, ring, 'subtract');
    }
    /* thread undercut (DIN 76 style): a short plain neck below the head, slightly under the thread root diameter */
    const g = thread && f.undercut ? Math.min(2.5 * P, L / 3) : 0;
    if (thread) {
      /* the thread stops 0.05 mm short of the head: ending exactly on the head face left slivers in the mesh */
      const tl = Math.min(L - g, Number(f.tlen) > 0 ? Number(f.tlen) : L, L - 0.05);
      if (tl >= P / 2) polys = KK.boolean(polys, threadTool({ pitch: P, size: de, r, len: L, start: 0, length: tl, fromEnd: true, ax: [0, 0, 1], c: [0, 0, hk] }), 'subtract');
    }
    if (g > 0) {
      const rg = Math.max(0.3, de / 2 - 0.6134 * P - 0.1), ring = KK.boolean(cylAlong([0, 0, hk], [0, 0, 1], r + 1, g), cylAlong([0, 0, hk - 0.5], [0, 0, 1], rg, g + 1), 'subtract');
      polys = KK.boolean(polys, ring, 'subtract');
    }
  } else {
    const de = d + tol, rh = thread ? (de - 1.0825 * P) / 2 : de / 2, m = f.low ? (THIN_NUT[d] || m0 * 0.6) : m0; /* f.low: thin nut ISO 4035 */
    polys = KK.boolean(hexPrism(s, 0, m), cylAlong([0, 0, -0.5], [0, 0, 1], rh, m + 1), 'subtract');
    if (thread) polys = KK.boolean(polys, threadTool({ internal: true, pitch: P, size: de, r: rh, len: m, start: 0, full: true, ax: [0, 0, 1], c: [0, 0, 0] }), 'subtract');
    if (f.chamfer !== false) {
      /* 90° countersink on both faces so the bolt finds the thread easily */
      const rc = de / 2 + 0.15, e = 0.01, cone = KK.primitive('cone', { r: rc, h: rc });
      polys = KK.boolean(polys, KK.translate(cone, [0, 0, rc / 2 - e]), 'subtract');
      polys = KK.boolean(polys, KK.translate(KK.mirror(cone, 'XY'), [0, 0, m - rc / 2 + e]), 'subtract');
    }
  }
  const pos = f.pos || [0, 0, 0];
  return KK.translate(polys, pos);
}
function toolForPrimitive(f) {
  const p = {}; for (const k in f.p) p[k] = Math.max(k === 'rt' ? 0 : 0.01, Number(f.p[k]) || 0); /* a cone's top radius may be 0 (pointed cone) */
  if (f.type === 'torus' && p.t >= p.R) throw new Error('Trubice musí být menší než hlavní poloměr');
  const pos = f.pos || [0, 0, 0];
  return KK.translate(KK.primitive(f.type, p), [pos[0], pos[1], pos[2] + PRIM[f.type].lift(p)]);
}
/* ---------- hinge (print-in-place or for a screw), lying flat: axis along x, leaves in ±y, z up ---------- */
const HINGE_WALL = 1.2;
function hingeDims(f) {
  const L = Number(f.len), W = Number(f.w), t = Number(f.t), N = Math.round(Number(f.n)) || 3, pd = Number(f.pin), c = Math.max(0, Math.min(1.5, Number(f.tol) || 0)), screw = f.kind === 'screw';
  if (!(L >= 6 && L <= 500)) throw new Error('Délka pantu musí být 6 až 500 mm');
  if (!(pd >= 1 && pd <= 20)) throw new Error('Průměr čepu musí být 1 až 20 mm');
  if (![2, 3, 5, 7].includes(N)) throw new Error('Počet kloubů musí být 2, 3, 5 nebo 7');
  /* two knuckles: the pin ends in a bulb (double cone) caught in a cavity of knuckle A, so the leaves stay together both ways */
  const pr = pd / 2, bulb = N === 2 && !screw, be = c + 0.4, D0 = c * Math.SQRT2;
  const R = Math.max(bulb ? Math.max(pr + c + HINGE_WALL, pr + be + D0 + 0.9) : pr + c + HINGE_WALL, Number(f.rMin) || 0), zc = 0.75 * R;
  if (!(t >= 0.8)) throw new Error('Tloušťka křídla musí být alespoň 0,8 mm');
  if (t > zc + R - 0.3) throw new Error('Křídlo je na tento čep příliš silné (nejvýš ' + (Math.floor((zc + R - 0.3) * 10) / 10).toString().replace('.', ',') + ' mm), zvětšete průměr čepu');
  if (!(W >= R + c + 2)) throw new Error('Křídlo musí být široké alespoň ' + (Math.ceil((R + c + 2) * 10) / 10).toString().replace('.', ',') + ' mm');
  const k = (L - (N - 1) * c) / N, rt = Math.max(0.4, pr * 0.35), ch = pr - rt, D = c * Math.SQRT2;
  const kMin = screw ? Math.max(2, (Number(f.recDepth) || 0) + 1.5) : bulb ? HINGE_WALL + D + (pr + be - rt) + be + 1.5 : HINGE_WALL + D + ch + 1.5;
  if (k < kMin) throw new Error(f.recDepth ? 'Krajní klouby jsou na zapuštění hlavy šroubu a matice příliš krátké (potřebují alespoň ' + (Math.ceil(kMin * 10) / 10).toString().replace('.', ',') + ' mm), prodlužte pant' : 'Klouby jsou příliš krátké, prodlužte pant nebo zvolte méně kloubů');
  return { L, W, t, N, pd, pr, c, R, zc, k, rt, ch, D, screw, bulb, be };
}
const YZB = { o: [0, 0, 0], u: [0, 1, 0], v: [0, 0, 1], n: [1, 0, 0] };
/* 2D outline (y, z) of one leaf section: the knuckle (circle cut flat at z = 0 so it prints without supports) merged with the plate */
function hingeSection(H, side) {
  const { R, zc, t, W } = H, a0 = Math.asin(-zc / R), a1 = Math.PI - a0, pts = [], M = 40;
  /* arc from the right end of the flat bottom, over the top, down the left side to z = t */
  const aT = Math.PI - Math.asin(Math.max(-1, Math.min(1, (t - zc) / R)));
  for (let i = 0; i <= M; i++) { const a = a0 + (aT - a0) * i / M; pts.push([R * Math.cos(a), zc + R * Math.sin(a)]); }
  pts.push([-W, t], [-W, 0]);
  void a1;
  return side < 0 ? pts : pts.map(([y, z]) => [-y, z]).reverse();
}
function prismX(pts, x0, x1) { return KK.extrudeProfiles([{ pts, closed: true }], YZB, x0, x1); }
function coneX(o, dir, r0, r1, h) { return KK.transform(KK.translate(KK.primitive('cone', { r: r0, rt: r1, h }), [0, 0, h / 2]), frameMatrix(o, dir)); }
function hingeParts(f0) {
  const rec = f0.kind === 'screw' && f0.recess ? screwRecess(Number(f0.pin), Math.max(0, Math.min(1.5, Number(f0.tol) || 0))) : null;
  const f = rec ? { ...f0, rMin: rec.rMin, recDepth: rec.depth } : f0;
  const H = hingeDims(f), { L, W, t, N, pr, c, R, zc, k, rt, ch, D, screw } = H;
  const leaf = side => {
    let acc = prismX(side < 0 ? [[-W, 0], [-(R + c), 0], [-(R + c), t], [-W, t]] : [[R + c, 0], [W, 0], [W, t], [R + c, t]], 0, L);
    for (let i = side < 0 ? 0 : 1; i < N; i += 2) { const x0 = i * (k + c); acc = KK.boolean(acc, prismX(hingeSection(H, side), x0, x0 + k), 'union'); }
    return acc;
  };
  let A = leaf(-1), B = leaf(1);
  /* screw holes in the plates: through, countersunk from the top when the plate is thick enough */
  const nh = Math.round(Number(f.holes) || 0);
  if (nh > 0) {
    const hd = Math.max(1, Number(f.hd) || 3), hr = hd / 2 + 0.2, csk = hd > 0 && hd - hr + 0.2 < t * 0.75;
    const ym = (R + c + W) / 2;
    if (W - (R + c) < 2 * hd + 1.5) throw new Error('Křídlo je na otvory pro šrouby příliš úzké');
    for (const side of [-1, 1]) {
      let cut = null;
      for (let j = 0; j < nh; j++) {
        const x = nh === 1 ? L / 2 : 2 + hr + hd / 2 + (L - 2 * (2 + hr + hd / 2)) * j / (nh - 1), o = [x, side * ym, 0];
        let h = cylAlong([o[0], o[1], -1], [0, 0, 1], hr, t + 2);
        if (csk) h = KK.boolean(h, coneX([o[0], o[1], t - (hd - hr)], [0, 0, 1], hr, hd + 0.2, hd - hr + 0.21), 'union');
        cut = cut ? KK.boolean(cut, h, 'union') : h;
      }
      if (side < 0) A = KK.boolean(A, cut, 'subtract'); else B = KK.boolean(B, cut, 'subtract');
    }
  }
  if (screw) {
    let hole = cylAlong([-1, 0, zc], [1, 0, 0], (H.pd + c + SCREW_FREE) / 2, L + 2); /* screw free: d + clearance − 0.1 (hole test) */
    if (rec) hole = KK.boolean(hole, screwRecessTool(rec, L, zc), 'union');
    A = KK.boolean(A, hole, 'subtract'); B = KK.boolean(B, hole, 'subtract');
  } else {
    ({ A, B } = hingePin(H, A, B, zc));
  }
  return { A, B, H };
}
/* the pin belongs to leaf B; its cone tips sit in blind cone sockets in A's end knuckles, which keeps the two leaves together (axis along x at height az) */
function hingePin(H, A, B, az) {
  const { pin, sock } = pinParts(H, az);
  return { A: KK.boolean(A, sock, 'subtract'), B: KK.boolean(B, pin, 'union') };
}
function pinParts(H, az) {
  if (H.bulb) {
    /* knuckle A (x 0..k) holds the bulb; the pin runs on through knuckle B (fused to it) */
    const { L, pr, c, rt, D, be } = H, w = HINGE_WALL, rb = pr + be, x0 = w + D, x1 = x0 + (rb - rt), x2 = x1 + be;
    let pin = cylAlong([x2 - 0.01, 0, az], [1, 0, 0], pr, L - w - x2 + 0.01);
    pin = KK.boolean(pin, coneX([x1, 0, az], [-1, 0, 0], rb, rt, x1 - x0), 'union');
    pin = KK.boolean(pin, coneX([x1, 0, az], [1, 0, 0], rb, pr, be), 'union');
    const rbS = rb + D, x3 = x1 + (rbS - pr - c);
    let sock = cylAlong([x3 - 0.01, 0, az], [1, 0, 0], pr + c, L - x3 + 0.02);
    sock = KK.boolean(sock, coneX([x1, 0, az], [-1, 0, 0], rbS, rt, x1 - w), 'union');
    sock = KK.boolean(sock, coneX([x1, 0, az], [1, 0, 0], rbS, pr + c, rbS - pr - c), 'union');
    return { pin, sock };
  }
  const { L, pr, c, rt, ch, D } = H, w = HINGE_WALL, xa = w + D + ch, xb = L - w - D - ch;
  let pin = cylAlong([xa, 0, az], [1, 0, 0], pr, xb - xa);
  pin = KK.boolean(pin, coneX([xa, 0, az], [-1, 0, 0], pr, rt, ch), 'union');
  pin = KK.boolean(pin, coneX([xb, 0, az], [1, 0, 0], pr, rt, ch), 'union');
  const hs = pr + c - rt, sa = w + hs, sb = L - w - hs;
  let sock = cylAlong([sa - 0.01, 0, az], [1, 0, 0], pr + c, sb - sa + 0.02);
  sock = KK.boolean(sock, coneX([sa, 0, az], [-1, 0, 0], pr + c, rt, hs), 'union');
  sock = KK.boolean(sock, coneX([sb, 0, az], [1, 0, 0], pr + c, rt, hs), 'union');
  return { pin, sock };
}
/* ---------- box hinge: box and lid stand side by side with their rims at the same height; the axis lies on the rim
   in the middle of the gap, each leaf hangs down the facing wall on a 45° web so the whole thing prints in one piece.
   Local frame: axis along x (0..L), the box on -y with its wall face at y = -G/2, the lid on +y, rim at z = 0. */
const BOXH_GRIP = 0.8; /* how far the leaf reaches into the wall */
function boxHingeSection(H, G, side, lift) {
  const { R } = H, M = 36, gw = G / 2, pts = [], lf = Math.max(0, lift || 0);
  const zj = -R * Math.SQRT2 - gw; /* where the 45° web (tangent to the knuckle at -45°) meets the wall */
  pts.push([-gw - BOXH_GRIP, zj - 1], [-gw, zj - 1], [-gw, zj]);
  for (let i = 0; i <= M; i++) { const a = -Math.PI / 4 + (Math.PI + Math.PI / 4) * i / M; pts.push([R * Math.cos(a), R * Math.sin(a)]); }
  /* with the axis 'lift' above the rim, the part that grips the wall stops at the rim: above it the other part's wall
     comes to rest when the lid is shut (otherwise the leaf would hold the lid up at the hinge) */
  if (lf > 1e-6) pts.push([-gw, 0], [-gw, -lf], [-gw - BOXH_GRIP, -lf]);
  else pts.push([-gw - BOXH_GRIP, 0]);
  return side < 0 ? pts : pts.map(([y, z]) => [-y, z]).reverse();
}
/* the axle hole of a hinge on a pin: free in every knuckle, or (pinTight, a piece of filament) tight in the outer
   knuckle(s), so the filament is pressed in there and cannot fall out while the inner knuckles turn on it freely.
   With an even number of knuckles the two outer ones belong to different parts, so only the first one is tight. */
/* recesses for a screw axle (d = ISO metric size): a counterbore for a socket or pan head at the start of the axle and
   a hex pocket for the nut at its end, so neither sticks out; the knuckles grow to keep 1 mm of wall around them */
function screwRecess(d, c) {
  const F = FASTENERS[d]; if (!F) return null;
  const hr = (F[4] + c) / 2, hd = d + 0.3, nr = (F[1] + c) / Math.sqrt(3), nd = F[3] + 0.3;
  return { d, hr, hd, nr, nd, rMin: Math.max(hr, nr) + 1.0, depth: Math.max(hd, nd) };
}
function screwRecessTool(rc, L, az) {
  const head = cylAlong([-1, 0, az], [1, 0, 0], rc.hr, rc.hd + 1);
  const nut = KK.translate(KK.extrudeProfiles([{ t: 'ngon', x: 0, y: 0, r: rc.nr, n: 6, a: 90 }], YZB, L - rc.nd, L + 1), [0, 0, az]); /* a corner up: the roof prints at 60° */
  return KK.boolean(head, nut, 'union');
}
function pinHoleTool(f, H) {
  if (f.recess && !f.pinTight) return KK.boolean(cylAlong([-1, 0, 0], [1, 0, 0], f.pinHole / 2, H.L + 2), screwRecessTool(f.recess, H.L, 0), 'union');
  const { L, N, k, c } = H;
  if (!f.pinTight) return cylAlong([-1, 0, 0], [1, 0, 0], f.pinHole / 2, L + 2);
  const xs = k + c / 2, xe = N % 2 ? (N - 1) * (k + c) - c / 2 : L + 1;
  return KK.boolean(cylAlong([-1, 0, 0], [1, 0, 0], f.pinTight / 2, L + 2), cylAlong([xs, 0, 0], [1, 0, 0], f.pinHole / 2, xe - xs), 'union');
}
function boxHingeLocal(f, G) {
  const H = hingeDims({ ...f, w: 1e3, t: 1, kind: f.pinHole ? 'screw' : 'print' }), { L, N, k, c, R } = H;
  if (G < 2 * (R + c) - 1e-6) throw new Error('Mezera mezi krabičkou a víkem musí být alespoň ' + (Math.ceil(2 * (R + c) * 10) / 10).toString().replace('.', ',') + ' mm (teď ' + (Math.round(G * 10) / 10).toString().replace('.', ',') + ' mm)');
  if (G > 30) throw new Error('Krabička a víko jsou od sebe příliš daleko (nejvýš 30 mm)');
  let A = null, B = null;
  for (let i = 0; i < N; i++) {
    const side = i % 2 ? 1 : -1, x0 = i * (k + c), pr = prismX(boxHingeSection(H, G, side, f.pinHole ? 0 : f.liftEff), x0, x0 + k);
    if (side < 0) A = A ? KK.boolean(A, pr, 'union') : pr; else B = B ? KK.boolean(B, pr, 'union') : pr;
  }
  if (f.pinHole) { const hole = pinHoleTool(f, H); return { H, A: KK.boolean(A, hole, 'subtract'), B: KK.boolean(B, hole, 'subtract') }; }
  return { H, ...hingePin(H, A, B, 0) };
}
/* ---------- flush box hinge: the knuckles sit on the rim, sunk into both walls, so nothing sticks out behind the box.
   Each knuckle is a teardrop (circle with a 45° point downwards) so it prints without supports; the other part's wall
   gets a teardrop pocket (radius + clearance) where the knuckle passes. Local frame as boxHingeLocal: rim at z = 0. */
function teardrop(r) {
  const pts = [], M = 40;
  for (let i = 0; i <= M; i++) { const a = -Math.PI / 4 + (1.5 * Math.PI) * i / M; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
  pts.push([0, -r * Math.SQRT2]);
  return pts;
}
function boxHingeFlushLocal(f, G) {
  const H = hingeDims({ ...f, w: 1e3, t: 1, kind: f.pinHole ? 'screw' : 'print' }), { L, N, k, c, R } = H, gw = G / 2;
  if (gw > R - 0.6) throw new Error('Pro zapuštěný pant musí být krabička a víko blíž u sebe: mezera nejvýš ' + (Math.floor(2 * (R - 0.6) * 10) / 10).toString().replace('.', ',') + ' mm (teď ' + (Math.round(G * 10) / 10).toString().replace('.', ',') + ' mm)');
  if (G < Math.max(0.4, c) - 1e-6) throw new Error('Mezera mezi krabičkou a víkem musí být alespoň ' + Math.max(0.4, c).toString().replace('.', ',') + ' mm');
  /* the knuckle's underside is the teardrop's 45° edge run on down to its own wall, so no point of it hangs in the gap */
  const knuckle = side => { const zj = -R * Math.SQRT2 - gw, pts = [];
    for (let i = 0; i <= 40; i++) { const a = -Math.PI / 4 + (1.25 * Math.PI) * i / 40; pts.push([R * Math.cos(a), R * Math.sin(a)]); }
    pts.push([-R, zj], [-gw, zj]);
    return side < 0 ? pts : pts.map(([y, z]) => [-y, z]).reverse(); };
  /* the pocket prints tighter than drawn (a concave curve) and the knuckle a little fuller: 0.2 mm more room, otherwise the
     closed lid springs open at the front (test print) */
  const pc = c + 0.2, pocket = teardrop(R + pc);
  let A = null, B = null, cutA = null, cutB = null;
  const add = (acc, p) => (acc ? KK.boolean(acc, p, 'union') : p);
  for (let i = 0; i < N; i++) {
    const x0 = i * (k + c), kn = prismX(knuckle(i % 2 ? 1 : -1), x0, x0 + k), pk = prismX(pocket, x0 - c, x0 + k + c);
    if (i % 2) { B = add(B, kn); cutA = add(cutA, pk); } else { A = add(A, kn); cutB = add(cutB, pk); }
  }
  /* a rib on the inside of each back wall along the hinge, so the pocket does not cut through a thin wall;
     its underside slopes at 45° towards the wall, parallel to the pocket's point, so it prints without supports */
  const rc = R + pc, Wb = Math.max(rc + 1.2, gw + 0.8), zW = -rc * Math.SQRT2 + Wb - 1.7, z0 = zW - (Wb - gw);
  const rib = side => prismX([[gw, 0], [Wb, 0], [Wb, zW], [gw, z0]].map(([y, z]) => [side * y, z]), -c, L + c);
  const base = { H, A, cutA, cutB, addA: rib(-1), addB: rib(1), depth: -z0 };
  if (f.pinHole) { const hole = pinHoleTool(f, H); return { ...base, B, sock: hole, sockB: hole }; }
  const { pin, sock } = pinParts(H, 0);
  return { ...base, B: KK.boolean(B, pin, 'union'), sock };
}
/* place the box hinge(s) from the two bodies: returns world-space tools for the box and for the lid */
function boxHingeTools(f, boxPolys, lidPolys) {
  const a = KK.bbox(boxPolys), b = KK.bbox(lidPolys);
  if (f.zRim === undefined && Math.abs(a.max[2] - b.max[2]) > 0.05) throw new Error('Krabička a víko musí mít horní hranu ve stejné výšce');
  let ax = -1, G = -1, dir = 0;
  for (const k of [0, 1]) {
    const g1 = b.min[k] - a.max[k], g2 = a.min[k] - b.max[k];
    if (g1 > G) { G = g1; ax = k; dir = 1; }
    if (g2 > G) { G = g2; ax = k; dir = -1; }
  }
  if (G <= 0) throw new Error('Krabička a víko se překrývají, postavte je vedle sebe s mezerou');
  const o = 1 - ax, s0 = Math.max(a.min[o], b.min[o]), s1 = Math.min(a.max[o], b.max[o]), span = s1 - s0, L = Number(f.len), cnt = Math.max(1, Math.min(4, Math.round(Number(f.count) || 1)));
  const sh = Number(f.shift) || 0;
  if (Math.abs(sh) > 1e-9 && (s0 + span * 0.5 / cnt + sh - L / 2 < s0 - 1e-6 || s0 + span * (cnt - 0.5) / cnt + sh + L / 2 > s1 + 1e-6)) throw new Error('Posunutý pant by přesahoval hranu');
  if (span < L * cnt + 2 * (cnt - 1)) throw new Error('Panty se nevejdou podél hrany (' + (Math.round(span * 10) / 10).toString().replace('.', ',') + ' mm)');
  if (f.style === 'hidden') throw new Error('Skrytý pant je jen pro krabičku navrženou zavřenou');
  const flush = f.style === 'flush';
  const lift0 = f.pinHole ? 0 : Math.max(0, Math.min(2, f.lift === undefined ? 0 : Number(f.lift) || 0));
  const P = flush ? boxHingeFlushLocal(f, G) : boxHingeLocal({ ...f, liftEff: lift0 }, G), H = P.H;
  /* how far below the rim the hinge reaches: the 45° web (R·√2 + G/2 + 1 mm grip), or the teardrop pocket; it must stay above the print bed */
  const need = flush ? P.depth + 1 : H.R * Math.SQRT2 + G / 2 + 1, low = Math.max(a.min[2], b.min[2]);
  if (a.max[2] - need < low - 1e-6) throw new Error('Krabička je na pant příliš nízká, potřebuje výšku alespoň ' + (Math.ceil(need * 10) / 10).toString().replace('.', ',') + ' mm');
  /* local y points from the box to the lid, local x along the edge, z up; keep it right-handed */
  const ey = [0, 0, 0]; ey[ax] = dir; const ex = [ey[1], -ey[0], 0], zA = f.zRim !== undefined ? f.zRim : a.max[2];
  const mid = (dir > 0 ? a.max[ax] + b.min[ax] : b.max[ax] + a.min[ax]) / 2;
  const lift = f.pinHole ? 0 : Math.max(0, Math.min(2, f.lift === undefined ? 0 : Number(f.lift) || 0));
  const zA0 = f.zRim !== undefined ? f.zRim : a.max[2], midA = (dir > 0 ? a.max[ax] + b.min[ax] : b.max[ax] + a.min[ax]) / 2;
  const fold = ax === 1 ? [1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 2 * midA, 2 * zA0, 1] : [-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 2 * midA, 0, 2 * zA0, 1];
  const out = { H, G, flush, lift, fold };
  for (let j = 0; j < cnt; j++) {
    const cAlong = s0 + span * (j + 0.5) / cnt + sh, org = [0, 0, zA]; org[ax] = mid; org[o] = cAlong - ex[o] * L / 2;
    const m = [ex[0], ex[1], ex[2], 0, ey[0], ey[1], ey[2], 0, 0, 0, 1, 0, org[0], org[1], org[2], 1];
    /* the hinge itself sits 'lift' above the rims: a lid turned 180° about it then comes down 2 × lift above the box at the
       hinge side, so it closes onto its front edge first and nothing at the hinge (play, a slightly fat print) holds it open */
    const mL = m.slice(); mL[14] += lift;
    for (const key of ['A', 'B', 'cutA', 'cutB', 'sock', 'sockB', 'addA', 'addB']) if (P[key]) { const t = KK.transform(P[key], key === 'addA' || key === 'addB' ? m : mL); out[key] = out[key] ? out[key].concat(t) : t; }
  }
  return out;
}
/* sep: the knuckle parts stay separate bodies (the box and lid still get their pockets, ribs and pin holes) */
function applyBoxHinge(T, pb, pl, sep) {
  if (T.addA) pb = KK.boolean(pb, T.addA, 'union');
  if (T.addB) pl = KK.boolean(pl, T.addB, 'union');
  if (T.cutA) pb = KK.boolean(pb, T.cutA, 'subtract');
  if (T.cutB) pl = KK.boolean(pl, T.cutB, 'subtract');
  let pa = T.A, pB = T.B;
  if (sep) {
    if (T.sock) { pb = KK.boolean(pb, T.sock, 'subtract'); pa = KK.boolean(pa, T.sock, 'subtract'); }
    if (T.sockB) { pl = KK.boolean(pl, T.sockB, 'subtract'); pB = KK.boolean(pB, T.sockB, 'subtract'); }
    return { box: pb, lid: pl, partA: pa, partB: pB };
  }
  pb = KK.boolean(pb, pa, 'union'); pl = KK.boolean(pl, pB, 'union');
  if (T.sock) pb = KK.boolean(pb, T.sock, 'subtract');
  if (T.sockB) pl = KK.boolean(pl, T.sockB, 'subtract');
  return { box: pb, lid: pl };
}
/* ---------- box hinge designed on the CLOSED box: the lid lies on the box, back walls flush. The axis is on the
   parting plane behind (or, flush, just outside) the chosen back wall; the lid is turned 180° about it, the hinge
   is built exactly as for the open pair, and then the lid is either left open beside the box (printed in one piece)
   or turned back closed (printed separately and joined by a filament pin or a screw). Because the open pair is
   made by turning the closed lid, the lid always closes onto the box exactly as it was designed. */
const CLOSED_PINS = { fil: 1.75, m2: 2, m3: 3 };
function closedHingeGeom(f, boxPolys, lidPolys) {
  const a = KK.bbox(boxPolys), b = KK.bbox(lidPolys), zp = a.max[2];
  /* the lid rests on the box rim (a latch tab may hang below the rim, so only its top half is checked) */
  if (b.min[2] > zp + 0.05 || b.max[2] < zp + 0.5) throw new Error('Víko musí ležet na krabičce (navrhněte krabičku zavřenou)');
  const side = f.side || '+y', k = side[1] === 'x' ? 0 : 1, sg = side[0] === '-' ? -1 : 1, o = 1 - k;
  const face = sg > 0 ? a.max[k] : a.min[k], lface = sg > 0 ? b.max[k] : b.min[k];
  if (Math.abs(face - lface) > 0.05) throw new Error('Zadní stěna víka musí lícovat se zadní stěnou krabičky');
  if (Math.min(a.max[o], b.max[o]) - Math.max(a.min[o], b.min[o]) <= 0) throw new Error('Víko neleží nad krabičkou');
  const pinMode = f.join === 'pin', pinD = pinMode ? (CLOSED_PINS[f.pinKind] || 1.75) : Number(f.pin) || 3;
  /* filament: free hole 1.8 mm + clearance, pressed into the outer knuckles 2.0 mm (as the flip latch's axle); screw: d + clearance − 0.1 */
  const fil = pinMode && (f.pinKind || 'fil') === 'fil', tl = Math.max(0.2, Number(f.tol) || 0.4);
  const g = { ...f, pin: pinD, pinHole: pinMode ? (fil ? FIL_FREE + tl : pinD + tl + SCREW_FREE) : 0, pinTight: fil && f.pinTight ? FIL_PRESS : 0 };
  const rec = pinMode && !fil && f.recess ? screwRecess(pinD, tl) : null;
  if (rec) { g.recess = rec; g.rMin = rec.rMin; g.recDepth = rec.depth; }
  const H = hingeDims({ ...g, w: 1e3, t: 1, kind: pinMode ? 'screw' : 'print' });
  const d = f.style === 'flush' ? Math.max(0.2, (Number(f.gap) || 1) / 2) : H.R + H.c;
  const axc = face + sg * d;
  /* turning by 180° about the axis (along the other horizontal direction, on the parting plane) */
  const U = k === 1 ? [1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 2 * axc, 2 * zp, 1] : [-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 2 * axc, 0, 2 * zp, 1];
  return { g, U, zp, a, b, pinMode, H };
}
function closedHingeTools(f, boxPolys, lidPolys) {
  const { g, U, zp, a, b, pinMode } = closedHingeGeom(f, boxPolys, lidPolys);
  if (!pinMode && Math.abs((b.max[2] - zp) - (zp - a.min[2])) > 0.05) throw new Error('Pro tisk vcelku musí být víko stejně vysoké jako krabička; nižší víko připojte na kolík nebo šroub');
  const open = KK.transform(lidPolys, U);
  return { T: boxHingeTools({ ...g, kind: 'box', zRim: zp }, boxPolys, open), U, open, pinMode };
}
function closedHingeResult(f, boxPolys, lidPolys) {
  if (f.style === 'hidden') return hiddenHingeResult(f, boxPolys, lidPolys);
  const { T, U, open, pinMode } = closedHingeTools(f, boxPolys, lidPolys);
  const r = applyBoxHinge(T, boxPolys, open, f.out === 'new');
  const back = p => (p && pinMode ? KK.transform(p, U) : p);
  return { box: r.box, lid: back(r.lid), partA: r.partA, partB: back(r.partB), T, U, pinMode };
}
/* ---------- hidden box hinge (closed box, filament axle): the axis lies on the parting plane inside the back wall, far
   enough in that no knuckle reaches past the back face, so nothing sticks out of the closed box. Behind the axis the
   box's top edge and the lid's bottom edge are bevelled at HIDDEN_BEVEL° from the parting plane: the bevels close
   onto each other at 2 × HIDDEN_BEVEL° (the lid stops there and stays open). Knuckles alternate as usual (teardrops
   pointing into their own part, pockets in the other part); inside the back walls a rib carries the knuckles and,
   along the whole edge, the channel for the filament, which goes in through a side wall.
   Local frame: x along the edge, y = outward normal of the back wall (face at y = 0), z up, parting plane z = 0. */
const HIDDEN_BEVEL = 50;
function hiddenHingeResult(f, boxPolys, lidPolys) {
  const a = KK.bbox(boxPolys), b = KK.bbox(lidPolys), zp = a.max[2];
  if (b.min[2] > zp + 0.05 || b.max[2] < zp + 0.5) throw new Error('Víko musí ležet na krabičce (navrhněte krabičku zavřenou)');
  const side = f.side || '+y', k = side[1] === 'x' ? 0 : 1, sg = side[0] === '-' ? -1 : 1, o = 1 - k;
  const face = sg > 0 ? a.max[k] : a.min[k], lface = sg > 0 ? b.max[k] : b.min[k];
  if (Math.abs(face - lface) > 0.05) throw new Error('Zadní stěna víka musí lícovat se zadní stěnou krabičky');
  const s0 = Math.max(a.min[o], b.min[o]), s1 = Math.min(a.max[o], b.max[o]), span = s1 - s0;
  if (span <= 0) throw new Error('Víko neleží nad krabičkou');
  const tl = Math.max(0.2, Number(f.tol) || 0.4), hole = FIL_FREE + tl;
  const g = { ...f, pin: CLOSED_PINS.fil, pinHole: hole, pinTight: f.pinTight ? FIL_PRESS : 0 };
  const H = hingeDims({ ...g, w: 1e3, t: 1, kind: 'screw' }), { L, N, k: kl, c, R } = H;
  const pc = c + 0.2, rc = R + pc, e = rc, tb = Math.tan(HIDDEN_BEVEL * Math.PI / 180), rh = hole / 2;
  const cnt = Math.max(1, Math.min(4, Math.round(Number(f.count) || 1))), sh = Number(f.shift) || 0;
  if (Math.abs(sh) > 1e-9 && (s0 + span * 0.5 / cnt + sh - L / 2 < s0 - 1e-6 || s0 + span * (cnt - 0.5) / cnt + sh + L / 2 > s1 + 1e-6)) throw new Error('Posunutý pant by přesahoval hranu');
  if (span < L * cnt + 2 * (cnt - 1)) throw new Error('Panty se nevejdou podél hrany (' + (Math.round(span * 10) / 10).toString().replace('.', ',') + ' mm)');
  /* rib under the knuckles: 1.2 mm round the pocket and the knuckle's point, the underside at 45° down to the back face */
  const yI = -e - rc - 1.2, zV = -Math.max(rc, R * Math.SQRT2) - 1.2, yC = -e - rh - 1.2, zC = -rh - 1.2;
  const fmt = v => (Math.ceil(v * 10) / 10).toString().replace('.', ',');
  if (zp - a.min[2] < -zV + 0.8) throw new Error('Krabička je na skrytý pant příliš nízká, potřebuje výšku alespoň ' + fmt(-zV + 0.8) + ' mm');
  if (b.max[2] - zp < -zV + 0.8) throw new Error('Víko je na skrytý pant příliš nízké, potřebuje výšku alespoň ' + fmt(-zV + 0.8) + ' mm');
  const ccw = pts => { let A = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; A += p[0] * q[1] - q[0] * p[1]; } return A < 0 ? pts.slice().reverse() : pts; };
  const flipZ = pts => ccw(pts.map(([y, z]) => [y, -z]));
  const at = pts => pts.map(([y, z]) => [y - e, z]); /* centred on the axis */
  const circle = r => { const p = []; for (let i = 0; i < 48; i++) { const t = 2 * Math.PI * i / 48; p.push([r * Math.cos(t), r * Math.sin(t)]); } return p; };
  const pr = (pts, x0, x1) => prismX(ccw(pts), x0, x1);
  const add = (acc, p) => (acc && acc.length ? KK.boolean(acc, p, 'union') : p);
  /* x along the edge: world coordinate along o times ex[o] */
  const ey = [0, 0, 0]; ey[k] = sg; const ex = [ey[1], -ey[0], 0], xs = ex[o];
  const xa = Math.min(a.min[o] * xs, a.max[o] * xs), xb = Math.max(a.min[o] * xs, a.max[o] * xs);
  const ribH = [[0, 0], [yI, 0], [yI, zV], [0, zV + yI]], ribC = [[0, 0], [yC, 0], [yC, zC], [0, zC + yC]];
  const bevel = [[-e, 0], [1, -(e + 1) * tb], [1, 0.5], [-e, 0.5]];
  let boxAdd = pr(ribC, xa, xb), lidAdd = pr(flipZ(ribC), xa, xb), boxCut = pr(bevel, xa - 1, xb + 1), lidCut = pr(flipZ(bevel), xa - 1, xb + 1);
  let kA = null, kB = null, holes = null;
  const spans = [];
  for (let j = 0; j < cnt; j++) {
    const x0h = (s0 + span * (j + 0.5) / cnt + sh) * xs - L / 2;
    spans.push([x0h, x0h + L]);
    boxAdd = add(boxAdd, pr(ribH, x0h - c, x0h + L + c)); lidAdd = add(lidAdd, pr(flipZ(ribH), x0h - c, x0h + L + c));
    for (let i = 0; i < N; i++) {
      const x0 = x0h + i * (kl + c), pk = pr(at(circle(rc)), x0 - c, x0 + kl + c);
      if (i % 2) { kB = add(kB, pr(flipZ(at(teardrop(R))), x0, x0 + kl)); boxCut = add(boxCut, pk); }
      else { kA = add(kA, pr(at(teardrop(R)), x0, x0 + kl)); lidCut = add(lidCut, pk); }
    }
    holes = add(holes, KK.translate(pinHoleTool(g, H), [x0h, -e, 0]));
  }
  /* the filament channel between the hinges and out through both side walls */
  spans.sort((p, q) => p[0] - q[0]);
  let x = xa - 1;
  for (const [p0, p1] of spans) { if (p0 > x + 1e-6) holes = add(holes, cylAlong([x, -e, 0], [1, 0, 0], rh, p0 - x)); x = p1; }
  holes = add(holes, cylAlong([x, -e, 0], [1, 0, 0], rh, xb + 1 - x));
  const org = [0, 0, zp]; org[k] = face;
  const M = [ex[0], ex[1], ex[2], 0, ey[0], ey[1], ey[2], 0, 0, 0, 1, 0, org[0], org[1], org[2], 1], W = p => KK.transform(p, M);
  /* the ribs stay within the parts' height */
  const blk = (z0, z1) => KK.translate(KK.primitive('box', { w: a.max[0] - a.min[0] + 40, d: a.max[1] - a.min[1] + 40, h: z1 - z0 }), [(a.min[0] + a.max[0]) / 2, (a.min[1] + a.max[1]) / 2, (z0 + z1) / 2]);
  let box = KK.boolean(boxPolys, KK.boolean(W(boxAdd), blk(a.min[2], zp), 'intersect'), 'union');
  let lid = KK.boolean(lidPolys, KK.boolean(W(lidAdd), blk(zp, b.max[2]), 'intersect'), 'union');
  box = KK.boolean(box, W(boxCut), 'subtract'); lid = KK.boolean(lid, W(lidCut), 'subtract');
  const hw = W(holes);
  let pA = KK.boolean(W(kA), hw, 'subtract'), pB = KK.boolean(W(kB), hw, 'subtract');
  box = KK.boolean(box, hw, 'subtract'); lid = KK.boolean(lid, hw, 'subtract');
  const sep = f.out === 'new';
  if (!sep) { box = KK.boolean(box, pA, 'union'); lid = KK.boolean(lid, pB, 'union'); }
  /* the lid's turn about the axis (for the simulation): 180° on the parting plane */
  const axc = face - sg * e;
  const U = k === 1 ? [1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 2 * axc, 2 * zp, 1] : [-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 2 * axc, 0, 2 * zp, 1];
  return { box, lid, partA: sep ? pA : undefined, partB: sep ? pB : undefined, T: { H, G: 0, lift: 0 }, U, pinMode: true, hidden: true, maxAngle: 2 * HIDDEN_BEVEL, filLen: Math.round(xb - xa) };
}
/* ---------- latch for a box designed closed (lid lying on the box). Local frame: u = outward normal of the chosen wall
   (wall face at u = 0), x along the edge, z up with the parting plane at z = 0 (box below, lid above).
   'out'  (on the wall): a springy tab hangs from the lid over the box wall; its hook snaps under a ridge on the box.
   'flush' (hidden): a springy lip hangs from the lid inside the box; its bump snaps into a groove in the box wall.
   Every overhang is 45° both for the box (printed upright) and for the lid (printed upside down). */
/* the latch's length below the parting plane: f.len when set (not below the shortest that works), else the default */
function latchLenOf(f, def, min) {
  const v = Number(f.len);
  if (!(f.len !== undefined && f.len !== null && f.len !== '' && v > 0)) return def;
  if (v < min - 1e-6) throw new Error('Západka je příliš krátká, nejméně ' + (Math.ceil(min * 10) / 10).toString().replace('.', ',') + ' mm');
  if (v > 200) throw new Error('Západka je příliš dlouhá (nejvýš 200 mm)');
  return v;
}
function latchParts(f) {
  const c = Math.max(0.1, Math.min(1, Number(f.tol) || 0.4)), W = Math.max(4, Number(f.width) || 12), flush = f.style === 'flush';
  const h = flush ? 0.6 : 1.0, t = flush ? 1.2 : 1.6, wall = Math.max(0.8, Number(f.wall) || 2);
  let box = [], lid = [], cut = [];
  if (!flush) {
    /* snug: the hook's upper face lies on the ridge's lower face (0.05 mm apart, so the faces never touch in the model): the closed lid has no play */
    /* length (parting plane to the tab's end): by default the ridge 4 mm below the rim; f.len moves the ridge with it */
    const dh = f.snug ? -h + c - SNUG_GAP : -h - c * (Math.SQRT2 - 1), dlt = dh - h - 1.5, lenDef = 4 - dlt, lenMin = 2.4 - dlt;
    const len = latchLenOf(f, lenDef, lenMin);
    const zr = -len - dlt, zh = zr + dh, zb = zh - h - 1.5, ui = c + h, uo = ui + t;
    box = [[[0, zr - h], [h, zr], [0, zr + h], [-0.8, zr + h + 0.8], [-0.8, zr - h - 0.8]]]; /* ridge (grips 0.8 into the wall) */
    lid = [[[ui, zb], [uo, zb], [uo, 0], [ui, 0]],                                              /* tab */
      [[ui + 0.01, zh - h], [ui + 0.01, zh + h], [c, zh]],                                      /* hook (apex c from the wall) */
      [[-0.8, 0], [uo, 0], [-0.8, uo + 0.8]]];                                                  /* 45° bracket into the lid wall */
    return { W, box, lid, cut, depth: -zb, zb, len: -zb, lenDef, lenMin };
  }
  const Hl = latchLenOf(f, 5, 3.5), ui = -(wall + c + t), uo = -(wall + c), zg = -Hl + 1.8;
  lid = [[[ui, -Hl], [uo, -Hl], [uo, 0], [ui, 0]],                                              /* lip inside the box */
    [[uo - 0.01, zg - h], [uo + h, zg], [uo - 0.01, zg + h]],                                    /* bump, 45° both ways */
    [[-wall + 0.8, 0], [ui, 0], [-wall + 0.8, (-wall + 0.8) - ui]]];                             /* 45° bracket to the lid's inner wall */
  const gz = f.snug ? SNUG_GAP - 2 * c : 0; /* snug: the groove's upper face meets the bump's, no play upwards */
  cut = [[[-wall - 0.01, zg - h - c + gz], [-wall + h + c, zg + gz], [-wall - 0.01, zg + h + c + gz]]];          /* groove in the box wall */
  return { W, box, lid, cut, depth: Hl, len: Hl, lenDef: 5, lenMin: 3.5 };
}
/* rotary latch: a lever turning on an axle (screw or a piece of filament) in the LID wall hangs down over the box;
   a notch at its lower end hooks under a stud on the box, so the lid cannot lift. Swung aside (90°) it lies on the lid
   and the lid opens. 'rot' sits on the wall, 'rotflush' sits in a pocket level with the wall. The lever is a separate
   body (print it flat). Local frame as latchParts: u out of the wall, x along the edge, z up, parting plane z = 0. */
function prismU(profiles, u0, u1) { return KK.extrudeProfiles(profiles, { o: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], n: [0, -1, 0] }, -u1, -u0); }
function rotLatchLocal(f) {
  const c = Math.max(0.1, Math.min(1, Number(f.tol) || 0.4)), flush = f.style === 'rotflush', wall = Math.max(0.8, Number(f.wall) || 2);
  const Lv = Math.max(10, Number(f.lever) || 16), wv = Math.max(5, Math.min(Lv / 2, Number(f.width) || 7)), tv = flush ? 1.6 : 2;
  /* lever: free on the axle; wall: M3 self-tapping / 1.75 mm filament pressed in (sizes from the hole test print) */
  const screw = f.axle !== 'fil', hole = screw ? (3 + c + SCREW_FREE) / 2 : (FIL_FREE + c) / 2, pilot = screw ? M3_TAP / 2 : FIL_PRESS / 2;
  const rs = 1.6, ec = rs + c + 1.6, L = Lv - wv, pz = L - ec, reach = L + wv / 2;
  if (flush && wall < tv + 0.3 + 0.8) throw new Error('Pro zapuštěnou otočnou západku musí mít stěna alespoň ' + (Math.ceil((tv + 1.1) * 10) / 10).toString().replace('.', ',') + ' mm (jinak zvolte otočnou na stěně)');
  if (pz < wv / 2 + 0.5) throw new Error('Páčka je příliš krátká');
  /* the lever hanging down (a = 0) or swung towards -x by a degrees */
  const slot = (a, ext) => { const r = a * Math.PI / 180; return { t: 'slot', x1: 0, y1: pz, x2: -Math.sin(r) * L, y2: pz - Math.cos(r) * L, w: wv + 2 * ext }; };
  const u0 = flush ? -tv - 0.1 : c, u1 = u0 + tv, floorU = flush ? -tv - 0.3 : 0;
  /* the notch: the path of the stud seen from the lever while the lever end swings towards -x (it rises on an arc
     about the axle), widened by the clearance; it opens at the lever's +x edge */
  const tMax = Math.asin(Math.min(1, (wv / 2 + rs + c + 0.6) / L)), pathPts = [];
  for (let i = 0; i <= 8; i++) { const t = tMax * i / 8; pathPts.push([L * Math.sin(t), pz - L * Math.cos(t)]); }
  const R0 = rs + c, outline = [];
  for (const [x, z] of pathPts) outline.push([x - R0 * Math.cos(Math.atan2(z - pz, x)), z - R0 * Math.sin(Math.atan2(z - pz, x))]);
  for (const [x, z] of pathPts.slice().reverse()) outline.push([x + R0 * Math.cos(Math.atan2(z - pz, x)), z + R0 * Math.sin(Math.atan2(z - pz, x))]);
  let lever = prismU([slot(0, 0), { t: 'circle', x: 0, y: pz, r: hole }], u0, u1);
  let notchP = prismU([{ t: 'circle', x: 0, y: -ec, r: R0 }], u0 - 1, u1 + 1);
  notchP = KK.boolean(notchP, prismU([{ pts: outline, closed: true }], u0 - 1, u1 + 1), 'union');
  notchP = KK.boolean(notchP, prismU([{ t: 'circle', x: pathPts[8][0], y: pathPts[8][1], r: R0 }], u0 - 1, u1 + 1), 'union');
  lever = KK.boolean(lever, notchP, 'subtract');
  /* stud on the box (grips 0.8 into the wall or the pocket floor), level with the lever face */
  const stud = prismU([{ t: 'circle', x: 0, y: -ec, r: rs }], floorU - 0.8, u1);
  /* axle: pilot hole through the lid wall into a 45° boss on the inside */
  const rb1 = pilot + 1.2, rb0 = rb1 + 2.5;
  const boss = KK.transform(KK.translate(KK.primitive('cone', { r: rb0, rt: rb1, h: 2.5 }), [0, 0, 1.25]), frameMatrix([0, -wall + 0.01, pz], [0, -1, 0]));
  let lidCut = KK.transform(KK.translate(KK.primitive('cylinder', { r: pilot, h: wall + 3.5 }), [0, 0, (wall + 3.5) / 2]), frameMatrix([0, floorU + 0.5, pz], [0, -1, 0]));
  let boxCut = null;
  if (flush) {
    const pts = [[0, pz]]; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; pts.push([-Math.sin(a) * (reach + c), pz - Math.cos(a) * (reach + c)]); }
    let pk = KK.boolean(prismU([slot(0, c)], floorU, 0.5), prismU([slot(90, c)], floorU, 0.5), 'union');
    pk = KK.boolean(pk, prismU([{ pts, closed: true }], floorU, 0.5), 'union');
    lidCut = KK.boolean(lidCut, pk, 'union'); boxCut = pk;
  }
  /* centre the swept area (from x = -reach to wv/2) on the chosen place */
  const dx = (reach - wv / 2) / 2, mv = p => (p ? KK.translate(p, [dx, 0, 0]) : p);
  return { lever: mv(lever), pivot: { p: [dx, 0, pz], d: [0, 1, 0], a: 90 }, boxAdd: mv(stud), lidAdd: mv(boss), boxCut: mv(boxCut), lidCut: mv(lidCut), W: reach + wv / 2 + 1, depth: ec + rs + c + 1, ov: pz + wv / 2 + 1.5 };
}
/* flip latch (like a spring latch on the wall, but the tab turns on an axle): a flap hangs on an axle in two lugs of the
   LID; it flips from the top down and its hook goes under a ridge on the box. The ridge's underside is undercut, so a
   pull on the lid presses the hook towards the wall (self-locking); it opens by pulling the flap's lower edge outwards.
   'flip' sits on the wall (axle: M3 screw or filament pushed through the lugs); 'flipflush' sits in a pocket level with
   the wall (filament fixed in the flap clicks into slots in the pocket ends; a bulge inside backs the pocket).
   The flap is a separate body, printed lying on its outer face. Local frame as latchParts. */
/* holes with a horizontal axis print slightly oval; from the user's test print (clearance 0.3): filament pressed in 2.0 mm,
   filament free 2.1 mm (1.8 + clearance), screw free d + clearance − 0.1 (M3: 3.2 mm) */
const FIL_PRESS = 2.0, FIL_FREE = 1.8, SCREW_FREE = -0.1, M3_TAP = 2.8;
/* the small lugs and the flap's knuckle print tighter than the test blocks (in the test boxes filament passed none of
   them), so the latch's filament holes get more: pressed in 2.15 mm, free 2.0 mm + clearance (2.3 mm) */
const LATCH_FIL_PRESS = 2.15, LATCH_FIL_FREE = 2.0;
/* snug latch (lid without play): the hook stays 0.05 mm below the ridge, so the faces never touch in the model
   (0.2 mm was tried, but the lid held open at the front in the test print was caused by the hinge, not by the latch) */
const SNUG_GAP = 0.05; /* M3 self-tapping: 2.5 too tight, 2.6 tight (lug could crack), 3.2 free */
function flipLatchLocal(f) {
  const c = Math.max(0.1, Math.min(1, Number(f.tol) || 0.4)), flush = f.style === 'flipflush', wall = Math.max(0.8, Number(f.wall) || 2);
  const W = Math.max(10, Number(f.width) || 14), inPlace = !flush && f.axle === 'print', screw = !flush && !inPlace && f.axle !== 'fil';
  /* filament holes (horizontal axis): pressed in 2.0 mm, turning freely 1.8 mm + clearance */
  const pressR = LATCH_FIL_PRESS / 2, freeR = (LATCH_FIL_FREE + c) / 2;
  const knH = flush ? pressR : screw ? (3 + c + SCREW_FREE) / 2 : freeR;        /* hole in the flap: filament pressed or glued in / free on the screw or filament */
  const lugH = flush ? freeR : screw ? M3_TAP / 2 : pressR;      /* hole in the lugs: free (snap slot) / M3 pilot / filament press fit */
  const rk = inPlace ? 3 : Math.max(knH, lugH) + 1.2, lw = screw || inPlace ? 3 : 2.5, h = 1.5, s = Math.tan(30 * Math.PI / 180);
  const ui = h + c, uA = c + rk, uo = uA + rk, zA = rk + 0.4;
  /* ridge low enough that the arc of the hook is flatter than the undercut (self-locking) */
  const Lmin = Math.max(8, (uA - (c + h) / 2) / (0.5 * s));
  /* snug: the hook's top lies on the ridge's undercut (the arc is flatter, so it slides in and touches only at the end) */
  const gv = f.snug ? SNUG_GAP : c;
  /* length below the parting plane = L + K (L = axle to ridge); a longer flap only moves the ridge down (not printed in place,
     where the lid's height sets it) */
  const tip = inPlace ? 2.0 : 1.2, K = -zA - c + s * c + gv + 1.6 + (uo - tip - c), lenDef = Lmin + K;
  /* printed in place the flap reaches down to the bed (the lid's top): the ridge and the hook move down with it, so the hook
     stays at the flap's lower end like on the other flip latches */
  const L = inPlace ? Math.max(Lmin, (Number(f._hl) || 0) - 2 * zA - K) : latchLenOf(f, lenDef, lenDef) - K, zr = zA + c - L;
  const zh = zr - s * c - gv, xf = W / 2 - lw - c - (flush ? 0.2 : 0); /* flush: 0.2 mm more room in the pocket ends (the flap prints lying, its edges spread a little) */
  /* below the hook the flap's inner face runs on along the hook's 45° underside straight to the end of the flap, which is
     a flat tip (thicker when the flap is printed in place, where the tip is the foot it stands on): a fingertip gets behind
     it, and the hook and the bevel are one line */
  let zbot = zh - 1.6 - (uo - tip - c);
  if (xf < 3) throw new Error('Západka je příliš úzká');
  /* printed in place: the flap is printed turned up 180° along the lid wall (the lid prints upside down), standing on
     the bed with its end, so it is lengthened to reach the lid's top exactly */
  if (inPlace) {
    const Hl = Number(f._hl) || 0, need = 2 * zA - zbot;
    if (Hl < need - 1e-6) throw new Error('Víko je na tisk jazýčku vcelku příliš nízké, potřebuje výšku alespoň ' + (Math.ceil(need * 10) / 10).toString().replace('.', ',') + ' mm (jinak zvolte osu ze šroubu nebo filamentu)');
    zbot = 2 * zA - Hl;
  }
  let flap = KK.extrudeProfiles([{ pts: [[ui, zbot], [uo, zbot], [uo, zA], [ui, zA]], closed: true }, { t: 'circle', x: uA, y: zA, r: rk }], YZB, -xf, xf);
  /* the hook is narrower than the ridge: at both ends of the ridge a 45° gusset carries its undercut while printing
     (the box prints standing, so the undercut alone would start in the air), and the layers bridge between the gussets */
  const gw = 1.2, xh = xf - gw - c;
  if (xh < 2) throw new Error('Západka je příliš úzká');
  flap = KK.boolean(flap, prismX([[ui + 0.02, zr - s * ui - gv], [c, zh], [c, zh - 1.6], [ui + 0.02, zh - 1.6 - (ui - c)]], -xh, xh), 'union');
  /* the line from the hook's tip to the inner edge of the flat end: 45° (printed in place it is steeper, the flap reaching
     down to the bed; the hook's underside is then filled out to the same line, so it stays one straight face) */
  const m = (zh - 1.6 - zbot) / (uo - tip - c), zl = u => zh - 1.6 - (u - c) * m;
  if (m > 1 + 1e-9) flap = KK.boolean(flap, prismX([[c, zh - 1.6], [ui + 0.02, zh - 1.6 - (ui - c)], [ui + 0.02, zl(ui + 0.02)]], -xh, xh), 'union');
  flap = KK.boolean(flap, prismX([[ui - 0.01, zl(ui - 0.01)], [ui - 0.01, zbot - 0.01], [uo - tip, zbot - 0.01], [uo - tip, zbot]], -xf - 0.1, xf + 0.1), 'subtract');
  /* axle: printed cone pins (45°) on the lugs in cone sockets of the knuckle, or a through hole for a screw or filament */
  const x0 = W / 2 - lw, rb = rk - 1.4, rt = 0.4, C2 = c * Math.SQRT2;
  if (inPlace) for (const sgn of [1, -1]) flap = KK.boolean(flap, coneX([sgn * (x0 + 0.5), uA, zA], [-sgn, 0, 0], rb + C2 + 0.5, rt, rb + C2 + 0.5 - rt), 'subtract');
  else flap = KK.boolean(flap, KK.extrudeProfiles([{ t: 'circle', x: uA, y: zA, r: knH }], YZB, -xf - 1, xf + 1), 'subtract');
  let ridge = prismX([[-0.8, zr + 0.8 * s], [h, zr - s * h], [h, zr + 0.4], [-0.8, zr + 0.4 + h + 0.8]], -xf, xf);
  const zlow = zr - s * h, gus = [[-0.8, zlow - h - 0.8], [h, zlow], [h, zlow + 0.01], [-0.8, zr + 0.8 * s]];
  for (const sg of [1, -1]) ridge = KK.boolean(ridge, prismX(gus, sg > 0 ? xf - gw : -xf, sg > 0 ? xf : -xf + gw), 'union');
  const hx = flush ? W / 2 : W / 2 + 0.5, hole = inPlace ? null : KK.extrudeProfiles([{ t: 'circle', x: uA, y: zA, r: lugH }], YZB, -hx, hx);
  let boxAdd = ridge, lidAdd = null, boxCut = null, lidCut = hole;
  const zTop = zA + rk + c;
  if (!flush) {
    const lug = KK.extrudeProfiles([{ pts: [[-0.8, zA - rk], [uA, zA - rk], [uo, zA], [-0.8, zA + uo + 0.8]], closed: true }, { t: 'circle', x: uA, y: zA, r: rk }], YZB, -W / 2, -W / 2 + lw);
    lidAdd = KK.boolean(lug, KK.translate(lug, [W - lw, 0, 0]), 'union');
    if (inPlace) for (const sgn of [1, -1]) lidAdd = KK.boolean(lidAdd, coneX([sgn * (x0 + 0.3), uA, zA], [-sgn, 0, 0], rb + 0.3, rt, rb + 0.3 - rt), 'union');
  } else {
    /* the pocket ends act as lugs: a slot (narrower than the filament) lets the axle click in from outside */
    /* below the flap a finger recess (its floor falls 45° outwards, so it prints) to get behind the flap and lift it */
    const F = uo + 0.5;
    const pkB = KK.boolean(prismX([[-0.01, zbot - c], [uo + 0.5, zbot - c], [uo + 0.5, 0.01], [-0.01, 0.01]], -(W / 2 - lw), W / 2 - lw),
      prismX([[-0.01, zbot - c + 0.01], [uo + 0.5, zbot - c - F], [uo + 0.5, zbot - c + 0.01]], -(W / 2 - lw), W / 2 - lw), 'union');
    const pkL = prismX([[-0.01, -0.5], [uo + 0.5, -0.5], [uo + 0.5, zTop], [-0.01, zTop]], -(W / 2 - lw), W / 2 - lw);
    const slotC = prismX([[uA, zA - 0.8], [uo + 0.5, zA - 0.8], [uo + 0.5, zA + 0.8], [uA, zA + 0.8]], -hx, hx); /* 1.6 mm: the 1.75 filament clicks through */
    boxCut = pkB; lidCut = KK.boolean(KK.boolean(pkL, hole, 'union'), slotC, 'union');
    const d = -uo, mv = p => (p ? KK.translate(p, [0, d, 0]) : p);
    boxAdd = mv(boxAdd); boxCut = mv(boxCut); lidCut = mv(lidCut);
    /* backing bulge on the inside where the wall is thinner than the pocket (45° towards the wall for printing) */
    const fl = d - 1, wi = -wall + 0.3, dep = wi - fl;
    if (dep > 0) {
      boxAdd = KK.boolean(boxAdd, KK.boolean(prismX([[wi, 0], [fl, 0], [fl, zbot - c - 1], [wi, zbot - c - 1 - dep]], -W / 2 - 1, W / 2 + 1), boxCut, 'subtract'), 'union');
      /* the recess goes deeper than the pocket floor only at its top, so the bulge above already backs it */
      lidAdd = prismX([[wi, 0], [fl, 0], [fl, zTop + 1], [wi, zTop + 1 + dep]], -W / 2 - 1, W / 2 + 1);
    }
    return { lever: mv(flap), pivot: { p: [0, uA + d, zA], d: [1, 0, 0], a: 90 } /* swung out level; further its end meets the lid wall above the pocket */, boxAdd, lidAdd, boxCut, lidCut, W: W + 2, depth: -zbot + c + 2 + Math.max(0, dep) + 1, ov: zTop + 1 + Math.max(0, dep), len: -zbot, lenDef, lenMin: lenDef };
  }
  if (inPlace) {
    /* stored as printed: turned 180° about the axle (rest), lying along the lid wall */
    const T = [1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 2 * uA, 2 * zA, 1];
    return { lever: KK.transform(flap, T), pivot: { p: [0, uA, zA], d: [1, 0, 0], a: 150, rest: 180 }, boxAdd, lidAdd, boxCut, lidCut, W, depth: -zbot + 1, ov: zA + uo + 1, len: -zbot, lenDef, lenMin: lenDef };
  }
  return { lever: flap, pivot: { p: [0, uA, zA], d: [1, 0, 0], a: 150 }, boxAdd, lidAdd, boxCut, lidCut, W, depth: -zbot + 1, ov: zA + uo + 1, len: -zbot, lenDef, lenMin: lenDef };
}
function latchTools(f, boxPolys, lidPolys, zRim) {
  /* the parting plane: the box rim (hinge knuckles of a box hinge may stand above it, so the hinge passes it on) */
  const a = KK.bbox(boxPolys), b = KK.bbox(lidPolys), zp = zRim !== undefined ? zRim : a.max[2];
  if (b.min[2] > zp + 0.05 || b.max[2] < zp + 0.5) throw new Error('Víko musí ležet na krabičce (zavřená krabička)');
  const side = f.side || '-y', k = side[1] === 'x' ? 0 : 1, sg = side[0] === '-' ? -1 : 1, o = 1 - k;
  const face = sg > 0 ? a.max[k] : a.min[k];
  const s0 = Math.max(a.min[o], b.min[o]), s1 = Math.min(a.max[o], b.max[o]), cnt = Math.max(1, Math.min(3, Math.round(Number(f.count) || 1))), sh = Number(f.shift) || 0;
  const flip = f.style === 'flip' || f.style === 'flipflush', rot = flip || f.style === 'rot' || f.style === 'rotflush';
  const P = flip ? flipLatchLocal({ ...f, _hl: b.max[2] - zp }) : rot ? rotLatchLocal(f) : latchParts(f);
  const Wx = P.W;
  if (s1 - s0 < Wx * cnt + 2) throw new Error('Západka se nevejde podél hrany');
  if (zp - a.min[2] < P.depth + 1) throw new Error('Krabička je na západku příliš nízká');
  if (rot && b.max[2] - zp < P.ov) throw new Error(flip ? 'Víko je na sklopnou západku příliš nízké' : 'Víko je na páčku příliš nízké, zkraťte páčku');
  const eu = [0, 0, 0]; eu[k] = sg; const ex = KK.cross(eu, [0, 0, 1]);
  const out = { box: null, lid: null, cut: null, cutLid: null, lever: null, levers: [] };
  const put = (key, polys) => { out[key] = out[key] ? (key === 'lever' ? out[key].concat(polys) : KK.boolean(out[key], polys, 'union')) : polys; };
  for (let j = 0; j < cnt; j++) {
    const cAlong = s0 + (s1 - s0) * (j + 0.5) / cnt + sh, org = [0, 0, zp]; org[k] = face; org[o] = cAlong;
    if (cAlong - Wx / 2 < s0 - 1e-6 || cAlong + Wx / 2 > s1 + 1e-6) throw new Error('Posunutá západka by přesahovala hranu');
    const m = [ex[0], ex[1], ex[2], 0, eu[0], eu[1], eu[2], 0, 0, 0, 1, 0, org[0], org[1], org[2], 1];
    if (rot) {
      if (P.boxAdd) put('box', KK.transform(P.boxAdd, m)); if (P.boxCut) put('cut', KK.transform(P.boxCut, m));
      if (P.lidAdd) put('lid', KK.transform(P.lidAdd, m));
      if (P.lidCut) put('cutLid', KK.transform(P.lidCut, m)); put('lever', KK.transform(P.lever, m));
      const tp = q => [m[0] * q[0] + m[4] * q[1] + m[8] * q[2] + m[12], m[1] * q[0] + m[5] * q[1] + m[9] * q[2] + m[13], m[2] * q[0] + m[6] * q[1] + m[10] * q[2] + m[14]];
      const pv = P.pivot, td = q => [m[0] * q[0] + m[4] * q[1] + m[8] * q[2], m[1] * q[0] + m[5] * q[1] + m[9] * q[2], m[2] * q[0] + m[6] * q[1] + m[10] * q[2]];
      out.levers.push({ polys: KK.transform(P.lever, m), pivot: { p: tp(pv.p), d: td(pv.d), a: pv.a, rest: pv.rest || 0 } });
    } else {
      for (const L of P.box) put('box', KK.transform(prismX(L, -P.W / 2, P.W / 2), m));
      for (const L of P.lid) put('lid', KK.transform(prismX(L, -P.W / 2, P.W / 2), m));
      for (const L of P.cut) put('cut', KK.transform(prismX(L, -P.W / 2 - 0.5, P.W / 2 + 0.5), m));
    }
  }
  return out;
}
/* length of the latch below the parting plane: the value used, the default and the shortest allowed (none for a lever
   or a flap printed in place, whose length the lever setting or the lid's height decides) */
function latchLen(f) {
  if (f.style === 'rot' || f.style === 'rotflush' || (f.style === 'flip' && f.axle === 'print')) return null;
  const P = f.style === 'flip' || f.style === 'flipflush' ? flipLatchLocal({ ...f, len: null }) : latchParts({ ...f, len: null });
  const v = Number(f.len), set = f.len !== undefined && f.len !== null && f.len !== '' && v > 0;
  return { len: set ? v : P.lenDef, lenDef: P.lenDef, lenMin: P.lenMin, set };
}
/* the latch on a box and lid; when the lid lies open beside the box (a hinge printed in one piece turned it over), the
   lid is folded shut for the latch and opened again afterwards */
function latchApply(f, bx, ld) {
  const zp = ld.swing ? ld.swing.zp : KK.bbox(bx.polys).max[2], lb = KK.bbox(ld.polys), onBox = lb.min[2] <= zp + 0.05 && lb.max[2] >= zp + 0.5;
  const fold = ld.fold || null; /* a lid with fold is stored open (turned over by a box hinge) */
  const lidP = fold ? KK.transform(ld.polys, fold) : ld.polys;
  if (!fold && !onBox) throw new Error('Víko musí ležet na krabičce, nebo být připojené pantem krabičky (tisk vcelku)');
  const T = latchTools(f, bx.polys, lidP, ld.swing ? ld.swing.zp : undefined), sep = f.out === 'new', back = p => (p && fold ? KK.transform(p, fold) : p);
  let pb = bx.polys, pl = lidP;
  if (T.cut) pb = KK.boolean(pb, T.cut, 'subtract');
  if (T.box && !sep) pb = KK.boolean(pb, T.box, 'union');
  if (T.lid && !sep) pl = KK.boolean(pl, T.lid, 'union');
  if (T.cutLid) pl = KK.boolean(pl, T.cutLid, 'subtract'); /* after the boss, so the axle hole goes through it */
  return { box: pb, lid: back(pl), partBox: sep ? T.box : null, partLid: sep ? back(T.lid) : null, lever: T.lever, levers: T.levers, T, fold, preview: [].concat(T.box || [], T.lid ? back(T.lid) : [], ...(T.levers || []).map(L => (L.pivot.rest ? back(L.polys) : L.polys))), previewCut: [].concat(T.cut || [], T.cutLid ? back(T.cutLid) : []) };
}
function toolForHinge(f) {
  const { A, B } = hingeParts(f), part = f.part || 'both';
  const polys = part === 'a' ? A : part === 'b' ? B : A.concat(B);
  /* the hinge is modelled centred on its axis: x from -L/2, axis at y = 0, lying on z = 0 */
  const L = Number(f.len), pos = (f.pos || [0, 0, 0]).map(Number), rz = Number(f.rot) || 0;
  return KK.transform(KK.translate(polys, [-L / 2, 0, 0]), eulerMatrix([0, 0, 0], pos, [0, 0, rz]));
}
function applyTool(bodies, f, tool, newBody) {
  const op = f.op || 'new';
  if (op === 'new') return bodies.concat([newBody(tool)]);
  let targets = (f.targets && f.targets.length) ? bodies.filter(b => f.targets.includes(b.id)) : bodies.filter(b => b.visible !== false && overlaps(b.polys, tool));
  if (op === 'join') {
    if (!targets.length) return bodies.concat([newBody(tool)]);
    let acc = targets[0].polys;
    for (const t of targets.slice(1)) acc = KK.boolean(acc, t.polys, 'union');
    acc = KK.boolean(acc, tool, 'union');
    const keep = targets[0].id, drop = new Set(targets.slice(1).map(t => t.id));
    return bodies.filter(b => !drop.has(b.id)).map(b => (b.id === keep ? { ...b, polys: acc } : b));
  }
  if (!targets.length) throw new Error('Nástroj nezasahuje do žádného tělesa');
  const ids = new Set(targets.map(t => t.id));
  return bodies.map(b => (ids.has(b.id) ? { ...b, polys: KK.boolean(b.polys, tool, op === 'cut' ? 'subtract' : 'intersect') } : b)).filter(b => b.polys.length);
}
function step(state, f) {
  const sketches = new Map(state.sketches), bodies = state.bodies;
  let n = state.n;
  const newBody = polys => ({ id: f.id, name: 'Těleso ' + (++n), polys, from: f.id });
  let out = bodies;
  switch (f.type) {
    case 'sketch':
      sketches.set(f.id, f); break;
    case 'extrude':
      out = applyTool(bodies, f, toolForExtrude(f, sketches), newBody); break;
    case 'revolve':
      out = applyTool(bodies, f, toolForRevolve(f, sketches), newBody); break;
    case 'box': case 'cylinder': case 'sphere': case 'cone': case 'torus':
      out = applyTool(bodies, f, toolForPrimitive(f), newBody); break;
    case 'bolt': case 'nut':
      out = applyTool(bodies, f, toolForFastener(f), polys => ({ id: f.id, name: (f.type === 'bolt' ? 'Šroub M' + f.size + '×' + f.len : 'Matice M' + f.size + (f.low ? ' nízká' : '')).replace('.', ','), polys, from: f.id })); break;
    case 'hinge': if (f.kind === 'box' || f.kind === 'closed') {
      const bx = bodies.find(b => b.id === f.box), ld = bodies.find(b => b.id === f.lid);
      if (!bx || !ld) throw new Error('Krabička nebo víko chybí');
      if (bx === ld) throw new Error('Krabička a víko musí být dvě různá tělesa');
      let R, fold = null;
      let swing;
      if (f.kind === 'closed') { R = closedHingeResult(f, bx.polys, ld.polys); if (!R.pinMode) fold = R.U; swing = { M: R.U, open: !R.pinMode, lift: R.T.lift, play: R.T.H.c, zp: KK.bbox(bx.polys).max[2], max: R.maxAngle || 180 }; }
      else { const T = boxHingeTools(f, bx.polys, ld.polys); R = applyBoxHinge(T, bx.polys, ld.polys, f.out === 'new'); fold = T.fold; swing = { M: T.fold, open: true, lift: T.lift, play: T.H.c, zp: KK.bbox(bx.polys).max[2] }; }
      /* fold: turns the open lid shut (a later latch is built on the closed box); swing: the hinge axis for the simulation
         (M = the 180° turn on the rim plane, open = the lid is stored turned open; the real axis is lift above the rim; play = radial play of the knuckles, the lid settles by it) */
      out = bodies.map(b => (b === bx ? { ...b, polys: R.box } : b === ld ? { ...b, polys: R.lid, fold, swing } : b));
      if (R.partA) out = out.concat([{ id: f.id + 'a', name: 'Pant – díl krabičky', polys: R.partA, from: f.id }, { id: f.id + 'b', name: 'Pant – díl víka', polys: R.partB, from: f.id, rides: ld.id, openPose: swing.open }]);
      break;
    } else {
      /* the two leaves interlock, so a bounding-box test would also catch the body on the other leaf: join only bodies the hinge really touches */
      const tool = toolForHinge(f);
      let ff = f;
      if ((f.op || 'new') !== 'new' && !(f.targets && f.targets.length)) {
        const e = 0.05, touches = b => [[0, 0, 0], [0, 0, -e], [0, 0, e], [-e, 0, 0], [e, 0, 0], [0, -e, 0], [0, e, 0]].some(d => KK.signedVolume(KK.boolean(b.polys, d[0] || d[1] || d[2] ? KK.translate(tool, d) : tool, 'intersect')) > 1e-4);
        const t = bodies.filter(b => b.visible !== false && overlaps(b.polys, tool) && touches(b)).map(b => b.id);
        ff = { ...f, targets: t.length ? t : ['\u0000none'] };
      }
      out = applyTool(bodies, ff, tool, polys => ({ id: f.id, name: ('Pant ' + f.len + '×' + (2 * f.w) + (f.part === 'a' ? ' – křídlo A' : f.part === 'b' ? ' – křídlo B' : '')).replace('.', ','), polys, from: f.id })); break;
    }
    case 'latch': {
      const bx = bodies.find(b => b.id === f.box), ld = bodies.find(b => b.id === f.lid);
      if (!bx || !ld) throw new Error('Krabička nebo víko chybí');
      if (bx === ld) throw new Error('Krabička a víko musí být dvě různá tělesa');
      const R = latchApply(f, bx, ld);
      out = bodies.map(b => (b === bx ? { ...b, polys: R.box } : b === ld ? { ...b, polys: R.lid } : b));
      if (R.partBox) out.push({ id: f.id + 'a', name: 'Západka – díl krabičky', polys: R.partBox, from: f.id });
      if (R.partLid) out.push({ id: f.id + 'b', name: 'Západka – díl víka', polys: R.partLid, from: f.id, rides: ld.id, openPose: !!R.fold });
      const nm = f.style === 'flip' || f.style === 'flipflush' ? 'Západka – jazýček' : 'Západka – páčka';
      /* each lever is its own body; pivot (in the closed-lid position) lets the simulation turn it, rides: it moves with the lid */
      /* a flap printed in place belongs to the lid as printed: with a lid turned open by the hinge it is turned along (openPose) */
      (R.levers || []).forEach((L, i) => { const op = !!(R.fold && L.pivot.rest); out.push({ id: f.id + 'p' + (i ? i + 1 : ''), name: nm + (R.levers.length > 1 ? ' ' + (i + 1) : ''), polys: op ? KK.transform(L.polys, R.fold) : L.polys, from: f.id, rides: ld.id, pivot: L.pivot, ...(op ? { openPose: true } : {}) }); });
      break;
    }
    case 'boxpose': {
      /* the lid (and what rides on it) turned shut (state 'closed') or open ('open') as the simulation shows it.
         unpose: back to the position the hinge and latches were made in (kept through several of these steps);
         posed: whether the lid now stands open; fold: turns it shut for a later latch */
      const M = f.mats || {}, inv = m => { const t = [m[12], m[13], m[14]], r = [m[0], m[4], m[8], 0, m[1], m[5], m[9], 0, m[2], m[6], m[10], 0];
        return r.concat([0, 1, 2].map(i => -(r[i] * t[0] + r[4 + i] * t[1] + r[8 + i] * t[2])), [1]); };
      const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; };
      if (!bodies.some(b => b.id === f.lid)) throw new Error('Víko chybí');
      const open = f.state === 'open';
      out = bodies.map(b => {
        const m = M[b.id]; if (!m) return b;
        const x = xfBody(b, m); x.unpose = b.unpose ? mul(b.unpose, inv(m)) : inv(m);
        if (b.id === f.lid) {
          x.posed = open ? 'open' : 'closed';
          if (open && x.swing) x.fold = x.swing.open ? mul(x.swing.M, x.unpose) : x.unpose; else delete x.fold;
        }
        return x;
      });
      break;
    }
    case 'import':
      out = applyTool(bodies, f, importPolys(f), polys => ({ id: f.id, name: f.name || ('Import ' + (++n)), polys, from: f.id })); break;
    case 'mirror': case 'pattern': {
      const sel = bodies.filter(x => (f.bodies || []).includes(x.id));
      if (!sel.length) throw new Error('Vyberte tělesa');
      const mats = [];
      if (f.type === 'mirror') mats.push(null);
      else if (f.kind === 'rect') {
        const nx = Math.max(1, Math.min(50, Math.round(f.nx) || 1)), ny = Math.max(1, Math.min(50, Math.round(f.ny) || 1));
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) if (i || j) mats.push(eulerMatrix([0, 0, 0], [i * (Number(f.dx) || 0), j * (Number(f.dy) || 0), 0], [0, 0, 0]));
      } else {
        const cnt = Math.max(2, Math.min(100, Math.round(f.count) || 2)), tot = Number(f.angle) || 360;
        const stepA = Math.abs(tot) >= 360 ? tot / cnt : tot / (cnt - 1), ai = f.axis === 'x' ? 0 : f.axis === 'y' ? 1 : 2;
        for (let k = 1; k < cnt; k++) { const r = [0, 0, 0]; r[ai] = stepA * k; mats.push(eulerMatrix([0, 0, 0], [0, 0, 0], r)); }
      }
      if (!mats.length) throw new Error('Pole potřebuje alespoň dvě instance');
      let added = [], k = 0;
      const repl = new Map();
      for (const b of sel) {
        const MIR = { YZ: [-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], XZ: [1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], XY: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1] };
        const copies = mats.map(m => (m ? KK.transform(b.polys, m) : KK.mirror(b.polys, f.plane || 'YZ')));
        const cseams = mats.map(m => seamXform(b.seams, m || MIR[f.plane || 'YZ']));
        if (f.join) {
          let acc = b.polys; for (const c of copies) acc = KK.boolean(acc, c, 'union');
          repl.set(b.id, acc); if (b.seams) repl.set(b.id + '\u0000s', [].concat(b.seams, ...cseams.filter(Boolean)));
        } else copies.forEach((c, j) => added.push({ id: f.id + '_' + (k++), name: 'Těleso ' + (++n), polys: c, from: f.id, ...(cseams[j] ? { seams: cseams[j] } : {}) }));
      }
      out = bodies.map(b => (repl.has(b.id) ? { ...b, polys: repl.get(b.id), ...(repl.has(b.id + '\u0000s') ? { seams: repl.get(b.id + '\u0000s') } : {}) } : b)).concat(added);
      break;
    }
    case 'fillet': case 'chamfer': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      const r = Number(f.r);
      if (!(r > 0)) throw new Error('Neplatná hodnota');
      const chains = KK.chainsOf(b.polys), sel = [];
      for (const d of f.edges || []) { const ch = matchEdge(chains, d); if (!ch) throw new Error('Hrana nebyla nalezena'); sel.push(ch); }
      if (!sel.length) throw new Error('Vyberte hrany');
      const res = KK.modifyEdges(b.polys, sel, f.type, r);
      if (res.err) throw new Error(res.err);
      out = bodies.map(x => (x === b ? { ...x, polys: res.polys } : x));
      break;
    }
    case 'combine': {
      const t = bodies.find(x => x.id === f.target), tools = bodies.filter(x => (f.tools || []).includes(x.id) && x.id !== f.target);
      if (!t) throw new Error('Cílové těleso neexistuje');
      if (!tools.length) throw new Error('Vyberte nástrojová tělesa');
      let acc = t.polys;
      for (const tl of tools) acc = KK.boolean(acc, tl.polys, f.op === 'cut' ? 'subtract' : f.op === 'intersect' ? 'intersect' : 'union');
      const drop = f.keep ? new Set() : new Set(tools.map(x => x.id));
      out = bodies.filter(x => !drop.has(x.id)).map(x => (x === t ? { ...x, polys: acc } : x)).filter(x => x.polys.length);
      break;
    }
    case 'thread': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      const tool = threadTool(f);
      const res = KK.boolean(b.polys, tool, 'subtract');
      out = bodies.map(x => (x === b ? { ...x, polys: res } : x));
      break;
    }
    case 'scale': {
      const sel = f.all ? bodies.slice() : bodies.filter(x => (f.bodies || []).includes(x.id));
      if (!sel.length) throw new Error('Vyberte tělesa');
      const s = (f.s || [1, 1, 1]).map(Number);
      if (s.some(v => !(v > 1e-4) || v > 1e4)) throw new Error('Měřítko musí být kladné číslo');
      const bb = KK.bbox(sel.flatMap(x => x.polys)), mid = [0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2);
      const c = f.pivot === 'origin' ? [0, 0, 0] : f.pivot === 'base' ? [mid[0], mid[1], bb.min[2]] : mid;
      const m = [s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, c[0] * (1 - s[0]), c[1] * (1 - s[1]), c[2] * (1 - s[2]), 1];
      const map = new Map(sel.map(x => [x.id, xfBody(x, m)]));
      out = bodies.map(x => map.get(x.id) || x);
      break;
    }
    case 'hole':
      out = applyTool(bodies, { ...f, op: 'cut' }, toolForHole(f, bodies), newBody); break;
    case 'shell': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      out = bodies.map(x => (x === b ? { ...x, polys: shellBody(b.polys, f) } : x));
      break;
    }
    case 'offsetface': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      out = bodies.map(x => (x === b ? { ...x, polys: offsetFace(b.polys, f) } : x));
      break;
    }
    case 'center': {
      /* Zarovnat (align): to the origin (original Vycentrovat), to another body per axis, or face to face / axis to axis */
      const mode = f.target || 'origin';
      if (mode === 'face') {
        const b = bodies.find(x => x.id === f.body);
        if (!b) throw new Error('Těleso neexistuje');
        const m = alignFaceMatrix(f.src, f.dst, !!f.flip, !!f.centerOn, Number(f.gap) || 0);
        out = bodies.map(x => (x === b ? xfBody(x, m) : x));
        break;
      }
      const sel = f.all ? bodies.slice() : bodies.filter(x => (f.bodies || []).includes(x.id));
      if (!sel.length) throw new Error('Vyberte tělesa');
      let shift;
      if (mode === 'body') {
        const ref = bodies.find(x => x.id === f.ref);
        if (!ref) throw new Error('Vyberte těleso, ke kterému se zarovná');
        if (sel.some(x => x.id === ref.id)) throw new Error('Vztažné těleso nemůže být mezi zarovnávanými');
        const R = KK.bbox(ref.polys), ax = f.ax || ['center', 'center', 'keep'];
        shift = bb => [0, 1, 2].map(k => {
          const m = ax[k];
          if (m === 'min') return R.min[k] - bb.min[k];
          if (m === 'max') return R.max[k] - bb.max[k];
          if (m === 'center') return (R.min[k] + R.max[k]) / 2 - (bb.min[k] + bb.max[k]) / 2;
          if (m === 'after') return R.max[k] - bb.min[k];
          if (m === 'before') return R.min[k] - bb.max[k];
          return 0;
        });
      } else {
        shift = bb => [f.x !== false ? -(bb.min[0] + bb.max[0]) / 2 : 0, f.y !== false ? -(bb.min[1] + bb.max[1]) / 2 : 0,
          f.z === 'center' ? -(bb.min[2] + bb.max[2]) / 2 : f.z === 'keep' ? 0 : -bb.min[2]];
      }
      const gs = shift(KK.bbox(sel.flatMap(x => x.polys)));
      const map = new Map(sel.map(x => [x.id, mvBody(x, f.each ? shift(KK.bbox(x.polys)) : gs)]));
      out = bodies.map(x => map.get(x.id) || x);
      break;
    }
    case 'rotate': {
      const sel = f.all ? bodies.slice() : bodies.filter(x => (f.bodies || []).includes(x.id));
      if (!sel.length) throw new Error('Vyberte tělesa');
      const bb = KK.bbox(sel.flatMap(x => x.polys));
      const c = f.pivot === 'origin' ? [0, 0, 0] : [0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2);
      const m = eulerMatrix(c, [0, 0, 0], (f.r || [0, 0, 0]).map(Number));
      let moved = sel.map(x => xfBody(x, m));
      if (f.ground) {
        const mz = Math.min(...moved.map(x => KK.bbox(x.polys).min[2]));
        if (Math.abs(mz) > 1e-9) moved = moved.map(x => mvBody(x, [0, 0, -mz]));
      }
      const map = new Map(moved.map(x => [x.id, x]));
      out = bodies.map(x => map.get(x.id) || x);
      break;
    }
    case 'move': {
      const sel = bodies.filter(x => (f.bodies || []).includes(x.id));
      if (!sel.length) throw new Error('Vyberte tělesa');
      const all = sel.flatMap(x => x.polys), bb = KK.bbox(all), c = [0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2);
      const m = eulerMatrix(c, (f.t || [0, 0, 0]).map(Number), (f.r || [0, 0, 0]).map(Number));
      if (f.copy) {
        const cnt = Math.max(1, Math.min(100, Math.round(Number(f.count) || 1))), added = [];
        let k = 0;
        for (const x of sel) { let p = x.polys, sm = x.seams; for (let j = 1; j <= cnt; j++) { p = KK.transform(p, m); sm = seamXform(sm, m); added.push({ id: f.id + (k ? '_' + k : ''), name: 'Těleso ' + (++n), polys: p, from: f.id, ...(sm ? { seams: sm } : {}) }); k++; } }
        out = bodies.concat(added);
      }
      else out = bodies.map(x => (sel.includes(x) ? xfBody(x, m) : x));
      break;
    }
    case 'bendface': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      const res = KK.boolean(b.polys, bendFaceTool(b.polys, f), 'union');
      if (!res.length) throw new Error('Ohyb se nepodařilo vytvořit');
      out = bodies.map(x => (x === b ? { ...x, polys: res } : x));
      break;
    }
    case 'splitbody': {
      const sel = bodies.filter(x => (f.bodies || []).includes(x.id));
      if (!sel.length) throw new Error('Vyberte tělesa');
      const nn = KK.vnorm(f.n.map(Number)), w = Number(f.w), keep = f.keep || 'both', added = [], repl = new Map();
      let k = 0, cut = 0;
      for (const x of sel) {
        const hs = cutTool(f, nn, w, KK.bbox(x.polys));
        const pos = KK.boolean(x.polys, hs, 'intersect'), neg = KK.boolean(x.polys, hs, 'subtract');
        const vp = pos.length ? Math.abs(KK.signedVolume(pos)) : 0, vn = neg.length ? Math.abs(KK.signedVolume(neg)) : 0;
        if (vp < 1e-6 || vn < 1e-6) continue;
        cut++;
        if (keep === 'pos') repl.set(x.id, pos);
        else if (keep === 'neg') repl.set(x.id, neg);
        else { repl.set(x.id, neg); added.push({ id: f.id + (k ? '_' + k : ''), name: 'Těleso ' + (++n), polys: pos, from: f.id, ...(x.seams ? { seams: x.seams } : {}) }); k++; }
      }
      if (!cut) throw new Error('Rovina řezu žádné vybrané těleso neprotíná');
      out = bodies.map(x => (repl.has(x.id) ? { ...x, polys: repl.get(x.id) } : x)).concat(added);
      break;
    }
    case 'splitface': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      const q = { n: f.n.map(Number), w: Number(f.w), a: f.a.map(Number), b: f.b.map(Number) }, d = KK.vsub(q.b, q.a);
      if (KK.vdot(d, d) < 1e-8) throw new Error('Body dělicí čáry splývají');
      const g = seamPatch(b.polys, q);
      if (!g) throw new Error('Plocha nebyla nalezena');
      const h = seamPlane(q), A = clipRegion(b.polys, g, [h]), B = clipRegion(b.polys, g, [{ m: KK.vmul(h.m, -1), d: -h.d }]);
      if (KK.surfaceArea(A) < 1e-4 || KK.surfaceArea(B) < 1e-4) throw new Error('Čára plochu nerozdělí, musí plochou procházet');
      out = bodies.map(x => (x === b ? { ...x, seams: (x.seams || []).concat([q]) } : x));
      break;
    }
    case 'del': {
      const ids = new Set(f.bodies || []);
      if (!bodies.some(b => ids.has(b.id))) throw new Error('Těleso neexistuje');
      out = bodies.filter(b => !ids.has(b.id)); break;
    }
    default: throw new Error('Neznámý prvek');
  }
  return { bodies: out, sketches, n };
}

/* ---------- rebuild with prefix cache ---------- */
function makeRebuilder() {
  let cache = []; /* [{key, state, err}] */
  return function rebuild(features, upto) {
    const N = Math.min(upto === undefined ? features.length : upto, features.length);
    let state = { bodies: [], sketches: new Map(), n: 0 }, i = 0;
    const status = [];
    for (; i < N; i++) {
      const key = JSON.stringify(features[i]);
      if (cache[i] && cache[i].key === key) { state = cache[i].state; status.push(cache[i].err); continue; }
      break;
    }
    if (i < N) cache.length = i;
    for (; i < N; i++) {
      const f = features[i], key = JSON.stringify(f);
      let err = null;
      if (!f.off) {
        try { state = step(state, f); } catch (e) { err = e && e.message ? e.message : 'Chyba'; }
      }
      cache[i] = { key, state, err }; status.push(err);
    }
    return { bodies: state.bodies, sketches: state.sketches, status };
  };
}

return { bendFaceTool, halfSpace, cutTool, faceClip, clipRegion, seamSegments, seamPlane, FASTENERS, THIN_NUT, SCREW_HEADS: { slotted: SLOT_HEADS, phillips: PAN_HEADS }, toolForFastener, toolForHinge, latchTools, latchApply, latchLen, hingeDims, boxHingeTools, closedHingeTools, closedHingeResult, applyBoxHinge, CLOSED_PINS, toolForHole, HOLE_CLEAR, HOLE_CBORE, HOLE_CSINK, shellBody, offsetFace, offsetFaceTool, basisFromPlane, THREADS, suggestThread, threadTool, setBlobResolver: fn => { blobResolver = fn; blobCache.clear(); }, toolForRevolve, importPolys, revolveAxis, PLANES, FEATURE_LABEL, regions, closedLoops, describe, matchEdge, step, makeRebuilder, toolForExtrude, toolForPrimitive, eulerMatrix, overlaps };
})();




