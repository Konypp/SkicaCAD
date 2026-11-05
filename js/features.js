/* Kóta feature engine: replays the timeline (feature list) into bodies. Pure JS on top of K. */
const Engine = (() => {
'use strict';
const KK = (typeof K !== 'undefined') ? K : require('./kernel.js');
const PLANES = {
  XY: { o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] },
  XZ: { o: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], n: [0, -1, 0] },
  YZ: { o: [0, 0, 0], u: [0, 1, 0], v: [0, 0, 1], n: [1, 0, 0] }
};
const FEATURE_LABEL = { buckle: 'Spona', articulate: 'Kloubový model', blob: 'Měkké spojení', skin: 'Kostra', sweep: 'Tažení po křivce', loft: 'Přechod profilů', deform: 'Deformace', lattice: 'Mřížka', softmove: 'Měkký posun', subdiv: 'Vyhlazení dělením', sculpt: 'Sochání', remesh: 'Přesíťování', hollow: 'Vydutění', flatbase: 'Plochá podstava', pegsplit: 'Konektory', libpart: 'Vložený díl', ribs: 'Žebra', jointpart: 'Kloubový spoj', curvecut: 'Rozříznout křivkou', text3d: 'Text', movefaces: 'Posunout plochy', boxpose: 'Poloha krabičky', latch: 'Západka', hinge: 'Pant', shell: 'Skořepina', hole: 'Díra', sketch: 'Skica', extrude: 'Vysunutí', revolve: 'Rotace', box: 'Krychle', cylinder: 'Válec', sphere: 'Koule', cone: 'Kužel', torus: 'Torus',
  fillet: 'Zaoblení', chamfer: 'Zkosení', combine: 'Kombinovat', move: 'Přesunout', rotate: 'Otočit', center: 'Zarovnat', offsetface: 'Upravit plochu', splitface: 'Rozdělit plochu', bendface: 'Ohnout plochu', splitbody: 'Rozříznout', thread: 'Závit', bolt: 'Šroub', nut: 'Matice', scale: 'Měřítko', mirror: 'Zrcadlit', pattern: 'Pole', import: 'Import', del: 'Odstranit těleso' };
let blobResolver = () => null;
const blobCache = new Map();
/* ready-made parts (js/partslib.js): packed meshes, unpacked once */
const LIB_PARTS = { link: 'Článek s háčkem', two: 'Dva spojené články', hook: 'Háček', neg: 'Kapsa – negativ' };
const libCache = new Map();
function libPolys(f) {
  const key = f.key || (f.part in LIB_PARTS ? f.part : 'link');
  let base = libCache.get(key);
  if (!base) { const L = typeof PARTS_LIB !== 'undefined' ? PARTS_LIB : (typeof window !== 'undefined' ? window.PARTS_LIB : null); if (!L || !L[key]) throw new Error('Knihovna dílů chybí'); base = KK.unpack(L[key]); libCache.set(key, base); }
  const s = (Number(f.scale) > 0 ? Number(f.scale) : 100) / 100, a = (Number(f.rot) || 0) * Math.PI / 180, c = Math.cos(a) * s, sn = Math.sin(a) * s, p = (f.pos || [0, 0, 0]).map(Number);
  return KK.transform(base, [c, sn, 0, 0, -sn, c, 0, 0, 0, 0, s, 0, p[0], p[1], p[2], 1]);
}
/* ready-made joints: a short bar (a block or a lying cylinder) cut in the middle by the chosen joint of the jointed
   model, printed in place; the user joins each half to a model of their own */
const JOINT_PARTS = { disc: 'Kotoučový kloub', hinge: 'Pantový kloub', flex: 'Kloub nahoru/dolů', ball: 'Kulový kloub', flexi: 'Kloub Flexi' };
const jointCache = new Map();
function jointParts(f) {
  const style = f.style in JOINT_PARTS ? f.style : 'disc', round = f.shape === 'round';
  const L = Math.max(10, Math.min(400, Number(f.len) || 60)), H = Math.max(3, Math.min(200, Number(f.h) || 14)), W = round ? H : Math.max(3, Math.min(200, Number(f.w) || 20));
  const opt = { style, axis: 'x', n: 1, at: [0], gap: Number(f.gap) || 0.4, angle: Number(f.angle) || 30, ...(f.snap && style === 'flex' ? { snap: true } : {}) };
  const key = JSON.stringify([round, L, W, H, opt]);
  let segs = jointCache.get(key);
  if (!segs) {
    const bar = round ? KK.transform(KK.primitive('cylinder', { r: H / 2, h: L }), [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, H / 2, 1])
      : KK.translate(KK.primitive('box', { w: L, d: W, h: H }), [0, 0, H / 2]);
    segs = articulate(bar, opt);
    if (jointCache.size > 24) jointCache.clear();
    jointCache.set(key, segs);
  }
  const a = (Number(f.rot) || 0) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), p = (f.pos || [0, 0, 0]).map(Number);
  return segs.map(P => KK.transform(P, [c, sn, 0, 0, -sn, c, 0, 0, 0, 0, 1, 0, p[0], p[1], p[2], 1]));
}
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
    return { ...q, n, w: KK.vdot(n, A), a: A, b: B, ...(q.pts ? { pts: q.pts.map(P) } : {}) };
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
    if (q.pts) { const R = curveRegion(q); out.push(inPoly3(R, q.n, p) ? { poly: R, n: q.n } : { poly: R, n: q.n, out: true }); continue; }
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
  const out = [], tris = new Map();
  const trisOf = h => { let t = tris.get(h); if (!t) tris.set(h, t = earTris(h.poly, h.n)); return t; };
  for (const i of group) {
    let pieces = [polys[i].v];
    for (const h of clip) {
      if (h.poly) { /* inside or outside a polygon on the face: through its triangles (convex) */
        const T = trisOf(h), next = [];
        if (!h.out) { for (const v of pieces) for (const t of T) { let w = v; for (const e of t) { w = clipConvex(w, e); if (w.length < 3) break; } if (w.length >= 3) next.push(w); } }
        else { let cur = pieces; for (const t of T) { const nx = []; for (const v of cur) for (let k = 0; k < 3; k++) { let w = clipConvex(v, { m: KK.vmul(t[k].m, -1), d: -t[k].d }); for (let j = 0; j < k && w.length >= 3; j++) w = clipConvex(w, t[j]); if (w.length >= 3) nx.push(w); } cur = nx; } next.push(...cur); }
        pieces = next;
      } else pieces = pieces.map(v => clipConvex(v, h)).filter(v => v.length >= 3);
      if (!pieces.length) break;
    }
    for (const v of pieces) { const q = { v, n: polys[i].n, w: polys[i].w }; if (KK.surfaceArea([q]) > 1e-8) out.push(q); }
  }
  return out;
}
/* a curved dividing line (Rozdělit plochu křivkou / odsazením hrany): a closed loop as it is, an open one made into the
   region on its left – its ends run on far along their directions and come back round on the left of the chord */
function curveRegion(q) {
  if (q._reg) return q._reg;
  const B = basisFromPlane(q.n, q.w), to2 = p => { const d = KK.vsub(p, B.o); return [KK.vdot(d, B.u), KK.vdot(d, B.v)]; };
  const to3 = p => KK.vadd(B.o, KK.vadd(KK.vmul(B.u, p[0]), KK.vmul(B.v, p[1])));
  let P = q.pts.map(to2);
  if (!q.closed) {
    const F = 1e4, n = P.length, dir = (a, b) => { const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(d[0], d[1]) || 1; return [d[0] / l, d[1] / l]; };
    const ds = dir(P[1], P[0]), de = dir(P[n - 2], P[n - 1]), c = dir(P[0], P[n - 1]), L = [-c[1], c[0]];
    const s0 = [P[0][0] + ds[0] * F, P[0][1] + ds[1] * F], e0 = [P[n - 1][0] + de[0] * F, P[n - 1][1] + de[1] * F];
    P = [s0, ...P, e0, [e0[0] + L[0] * 3 * F, e0[1] + L[1] * 3 * F], [s0[0] + L[0] * 3 * F, s0[1] + L[1] * 3 * F]];
  }
  Object.defineProperty(q, '_reg', { value: P.map(to3), enumerable: false });
  return q._reg;
}
/* is p (on the plane) inside the polygon R (3D points on the plane of normal n) */
function inPoly3(R, n, p) {
  const B = basisFromPlane(n, KK.vdot(n, R[0])), to2 = x => { const d = KK.vsub(x, B.o); return [KK.vdot(d, B.u), KK.vdot(d, B.v)]; };
  return KK.inPoly2D(to2(p), R.map(to2));
}
/* triangles of a simple polygon (ear clipping), each as its three inward half-planes {m, d} */
function earTris(R, n) {
  const B = basisFromPlane(n, KK.vdot(n, R[0])), P = R.map(x => { const d = KK.vsub(x, B.o); return [KK.vdot(d, B.u), KK.vdot(d, B.v)]; });
  let idx = P.map((_, i) => i); if (KK.area2D(P) < 0) idx.reverse();
  const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), out = [];
  const inTri = (p, a, b, c) => cr(a, b, p) > 1e-12 && cr(b, c, p) > 1e-12 && cr(c, a, p) > 1e-12;
  let guard = 0;
  while (idx.length > 3 && guard++ < 100000) {
    let found = false;
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length], a = P[i0], b = P[i1], c = P[i2];
      if (cr(a, b, c) <= 1e-12) continue;
      if (idx.some(j => j !== i0 && j !== i1 && j !== i2 && inTri(P[j], a, b, c))) continue;
      out.push([i0, i1, i2]); idx.splice(k, 1); found = true; break;
    }
    if (!found) { idx.splice(0, 1); } /* degenerate: drop a point rather than loop */
  }
  if (idx.length === 3 && cr(P[idx[0]], P[idx[1]], P[idx[2]]) > 1e-12) out.push(idx.slice());
  return out.map(t => t.map((i, k) => { const a = R[i], b = R[t[(k + 1) % 3]], c = R[t[(k + 2) % 3]]; let m = KK.vnorm(KK.cross(n, KK.vsub(b, a))); if (KK.vdot(m, c) < KK.vdot(m, a)) m = KK.vmul(m, -1); return { m, d: KK.vdot(m, a) }; }));
}
/* polyline segments (flat xyz array) where the seams cross their faces, for drawing */
function seamSegments(polys, seams) {
  const arr = [];
  for (const q of seams || []) {
    const g = seamPatch(polys, q); if (!g) continue;
    if (q.pts) { /* the curve's pieces that lie on the face */
      const on = x => g.some(i => KK.pointInConvex(x, polys[i], 1e-6)), n = q.pts.length;
      for (let k = 0; k < (q.closed ? n : n - 1); k++) { const A = q.pts[k], B = q.pts[(k + 1) % n]; if (on(KK.vmul(KK.vadd(A, B), 0.5))) arr.push(...A, ...B); }
      continue;
    }
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
/* Žebra (Plochy › Žebra): ribs or grooves on a selected face. A rib is a loft of its cross-section (square, rounded or
   wedge, width × height, sunk 0.4 mm into the body so it joins) along the face: on a cylinder along the axis (with an
   optional twist into a spiral) or round it as rings; on a flat face as parallel bars at a chosen angle, cut to the
   face's outline. Grooves are the same shapes going into the body. */
function loftSolid(S, closed) {
  const polys = [], m = S[0].length, ns = S.length, add = v => { const q = KK.mkPoly(v); if (q) polys.push(q); };
  for (let k = 0; k < (closed ? ns : ns - 1); k++) { const A = S[k], B = S[(k + 1) % ns]; for (let j = 0; j < m; j++) { const j2 = (j + 1) % m; add([A[j], A[j2], B[j2]]); add([A[j], B[j2], B[j]]); } }
  if (!closed) { add(S[0].slice().reverse()); add(S[ns - 1].slice()); }
  return KK.fixOrientation(polys);
}
function ribProfile(kind, w, h, e) {
  if (kind === 'tri') return [[-w / 2, -e], [w / 2, -e], [0, h]];
  if (kind === 'round') { const P = [[-w / 2, -e], [w / 2, -e]]; for (let i = 0; i <= 12; i++) { const t = i / 12 * Math.PI; P.push([w / 2 * Math.cos(t), h * Math.sin(t)]); } return P.filter((q, i, a) => i === 0 || Math.hypot(q[0] - a[i - 1][0], q[1] - a[i - 1][1]) > 1e-6); }
  return [[-w / 2, -e], [w / 2, -e], [w / 2, h], [-w / 2, h]];
}
function ribsTool(polys, f) {
  const n = Math.max(1, Math.min(360, Math.round(Number(f.count) || 1))), w = Number(f.width), h = Number(f.height), e = 0.4;
  if (!(w > 0.05) || !(h > 0.05)) throw new Error('Šířka i výška žeber musí být větší než 0');
  const cut = f.op === 'cut', prof = ribProfile(f.profile, w, h, e), out = [];
  if (f.kind === 'cyl') {
    const ax = KK.vnorm(f.ax.map(Number)), c = f.c.map(Number), r = Number(f.r), len = Number(f.len);
    const t0 = Math.max(0, Math.min(100, Number(f.from) || 0)) / 100, t1 = Math.max(0, Math.min(100, f.to === undefined ? 100 : Number(f.to))) / 100;
    if (!(t1 > t0)) throw new Error('Rozsah Od–Do je prázdný');
    const z0 = len * t0, z1 = len * t1, tt = Math.abs(ax[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = KK.vnorm(KK.cross(ax, tt)), e2 = KK.cross(ax, e1);
    const D = (f.internal ? -1 : 1) * (cut ? -1 : 1);
    if (cut && h >= r * 0.95 && !f.internal) throw new Error('Drážky jsou hlubší než poloměr válce');
    const P = (z, ph, t, d) => { const U = KK.vadd(KK.vmul(e1, Math.cos(ph)), KK.vmul(e2, Math.sin(ph))), V = KK.vadd(KK.vmul(e1, -Math.sin(ph)), KK.vmul(e2, Math.cos(ph))); return KK.vadd(KK.vadd(c, KK.vmul(ax, z)), KK.vadd(KK.vmul(U, r + D * d), KK.vmul(V, t))); };
    if (f.dir === 'ring') {
      const M = 96;
      for (let i = 0; i < n; i++) {
        const zi = z0 + (i + 0.5) * (z1 - z0) / n, S = [];
        for (let k = 0; k < M; k++) { const ph = k / M * 2 * Math.PI; S.push(prof.map(([t, d]) => P(zi + t, ph, 0, d))); }
        out.push(...loftSolid(S, true));
      }
      if (n > 1 && (z1 - z0) / n < w + 0.05) throw new Error('Prstence se do délky nevejdou, zmenšete počet nebo šířku');
    } else {
      const tw = (Number(f.twist) || 0) * Math.PI / 180, dph = Math.max(2 * Math.PI / 180, Math.min(8 * Math.PI / 180, Math.sqrt(8 * 0.03 / (r + h)))), ns = Math.abs(tw) > 1e-6 ? Math.max(2, Math.ceil(Math.abs(tw) / dph) + 1) : 2;
      if (n > 1 && 2 * Math.PI * r / n < w + 0.05) throw new Error('Žebra se po obvodu nevejdou, zmenšete počet nebo šířku');
      for (let i = 0; i < n; i++) {
        const S = [];
        for (let k = 0; k < ns; k++) { const q = k / (ns - 1), z = z0 + (z1 - z0) * q, ph = 2 * Math.PI * i / n + tw * q; S.push(prof.map(([t, d]) => P(z, ph, t, d))); }
        out.push(...loftSolid(S, false));
      }
    }
    return out;
  }
  /* a flat face: parallel bars across it at the angle, cut to its outline */
  const B = basisFromPlane(f.n.map(Number), Number(f.w)), loops = faceLoops2D(polys, { n: f.n, w: f.w, p: f.p, clip: f.clip }, B);
  if (!loops.length) throw new Error('Obrys plochy se nepodařilo určit');
  const al = (Number(f.angle) || 0) * Math.PI / 180, dv = [Math.cos(al), Math.sin(al)], pv = [-dv[1], dv[0]], all = loops.flat();
  const dd = all.map(q => q[0] * dv[0] + q[1] * dv[1]), pp = all.map(q => q[0] * pv[0] + q[1] * pv[1]);
  const d0 = Math.min(...dd) - 1, d1 = Math.max(...dd) + 1, p0 = Math.min(...pp), p1 = Math.max(...pp);
  if (n > 1 && (p1 - p0) / n < w + 0.05) throw new Error('Žebra se na plochu nevejdou, zmenšete počet nebo šířku');
  const D = cut ? -1 : 1, P3 = (x, y, d) => KK.vadd(B.o, KK.vadd(KK.vadd(KK.vmul(B.u, x), KK.vmul(B.v, y)), KK.vmul(B.n, D * d)));
  const bars = [];
  for (let i = 0; i < n; i++) {
    const o = p0 + (i + 0.5) * (p1 - p0) / n, S = [d0, d1].map(a => prof.map(([t, d]) => P3(dv[0] * a + pv[0] * (o + t), dv[1] * a + pv[1] * (o + t), d)));
    bars.push(...loftSolid(S, false));
  }
  const lim = KK.fixOrientation(KK.extrudeProfiles(loops.map(l => ({ pts: l, closed: true })), B, -h - e - 1, h + e + 1));
  return KK.boolean(bars, lim, 'intersect');
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
/* ---------- move several faces (flat and rounded) by the same small distance along their normals, keeping the shape's
   layout: every vertex moves to the point that lies on the moved planes of its selected faces and on the planes of its other
   faces (least squares, as the shell does). Rounded faces (whole or partial cylinders) move facet by facet, so a rounded
   corner keeps its centre and its radius grows or shrinks with the distance. For clearances: the distance must stay smaller
   than the features next to the faces. f: { body, faces: [{ kind: 'plane', n, w, p } | { kind: 'cyl', c, ax, r, len }], d } */
function movedFacesPolys(polys, faces) {
  const sel = new Set();
  for (const fd of faces || []) {
    if (fd.kind === 'cyl') {
      const ax = KK.vnorm(fd.ax), c = fd.c, r = Number(fd.r), len = Number(fd.len), tol = Math.max(0.01, 0.03 * r);
      let hit = 0;
      polys.forEach((q, i) => {
        if (Math.abs(KK.vdot(q.n, ax)) > 0.02) return;
        if (!q.v.every(v => { const d = KK.vsub(v, c), t = KK.vdot(d, ax), pr = KK.vsub(d, KK.vmul(ax, t)); return t > -1e-3 && t < len + 1e-3 && Math.abs(Math.hypot(pr[0], pr[1], pr[2]) - r) < tol; })) return;
        sel.add(i); hit++;
      });
      if (!hit) throw new Error('Zaoblená plocha nebyla nalezena');
    } else {
      const g = KK.planarFace(polys, fd.n, fd.w, fd.p);
      if (!g || !g.length) throw new Error('Plocha nebyla nalezena');
      g.forEach(i => sel.add(i));
    }
  }
  /* faces running on smoothly (a flat side into a rounded corner, a corner into the next side) move with them: a face cannot
     move away from a neighbour it meets at a tangent without tearing, so the tangent chain goes along */
  const byV = new Map();
  polys.forEach((q, i) => { for (const v of q.v) { const k = KK.qk(v); let l = byV.get(k); if (!l) byV.set(k, l = []); l.push(i); } });
  const lim = Math.cos(25 * Math.PI / 180), st = [...sel];
  while (st.length) {
    const i = st.pop(), q = polys[i];
    for (const v of q.v) for (const j of byV.get(KK.qk(v))) if (!sel.has(j) && KK.vdot(polys[j].n, q.n) > lim) { sel.add(j); st.push(j); }
  }
  return sel;
}
function moveFaces(polys, f) {
  const d = Number(f.d);
  if (!(Math.abs(d) > 1e-4)) throw new Error('Zadejte posunutí různé od nuly');
  const sel = movedFacesPolys(polys, f.faces);
  const vm = new Map();
  polys.forEach((p, i) => {
    const w = KK.vdot(p.n, p.v[0]) + (sel.has(i) ? d : 0);
    for (const v of p.v) {
      const k = KK.qk(v); let e = vm.get(k); if (!e) vm.set(k, e = { v, pl: [], moved: false });
      if (sel.has(i)) e.moved = true;
      const q = e.pl.find(x => KK.vdot(x.n, p.n) > 1 - 1e-7);
      if (!q) e.pl.push({ n: p.n, d: w, s: sel.has(i) }); else if (sel.has(i) && !q.s) { q.d = w; q.s = true; }
    }
  });
  const eps = 1e-6, det = M => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  let far = 0;
  for (const e of vm.values()) {
    if (!e.moved) { e.x = e.v; continue; }
    const A = [[eps, 0, 0], [0, eps, 0], [0, 0, eps]], b = [eps * e.v[0], eps * e.v[1], eps * e.v[2]];
    for (const { n, d: w } of e.pl) for (let r = 0; r < 3; r++) { for (let c = 0; c < 3; c++) A[r][c] += n[r] * n[c]; b[r] += n[r] * w; }
    const D = det(A); if (Math.abs(D) < 1e-18) { e.x = e.v; continue; }
    e.x = [0, 1, 2].map(c => det(A.map((row, r) => row.map((x, j) => (j === c ? b[r] : x)))) / D);
    far = Math.max(far, Math.hypot(e.x[0] - e.v[0], e.x[1] - e.v[1], e.x[2] - e.v[2]));
  }
  if (far > Math.abs(d) * 6 + 1e-3) throw new Error('Posunutí je pro tvar kolem ploch příliš velké');
  const out = polys.map(p => KK.mkPoly(p.v.map(v => vm.get(KK.qk(v)).x))).filter(Boolean);
  if (!(KK.signedVolume(out) > 0)) throw new Error('Posunutí je pro tvar kolem ploch příliš velké');
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
/* height of a box's rim at one wall: the top of the wall's outer face (the plane where coordinate k = val). A lip standing on
   the rim inside the wall, or anything else higher up inside, does not count. */
function rimTop(polys, k, val) {
  let m = -Infinity;
  for (const q of polys) for (const v of q.v) if (Math.abs(v[k] - val) < 1e-3 && v[2] > m) m = v[2];
  return m > -Infinity ? m : KK.bbox(polys).max[2];
}
/* place the box hinge(s) from the two bodies: returns world-space tools for the box and for the lid */
function boxHingeTools(f, boxPolys, lidPolys) {
  const a = KK.bbox(boxPolys), b = KK.bbox(lidPolys);
  let ax = -1, G = -1, dir = 0;
  for (const k of [0, 1]) {
    const g1 = b.min[k] - a.max[k], g2 = a.min[k] - b.max[k];
    if (g1 > G) { G = g1; ax = k; dir = 1; }
    if (g2 > G) { G = g2; ax = k; dir = -1; }
  }
  if (G <= 0) throw new Error('Krabička a víko se překrývají, postavte je vedle sebe s mezerou');
  /* the rims are compared at the facing walls (a lip on the box or a recess in the lid may stand higher elsewhere) */
  const zR = f.zRim !== undefined ? f.zRim : rimTop(boxPolys, ax, dir > 0 ? a.max[ax] : a.min[ax]);
  if (f.zRim === undefined && Math.abs(zR - rimTop(lidPolys, ax, dir > 0 ? b.min[ax] : b.max[ax])) > 0.05) throw new Error('Krabička a víko musí mít horní hranu ve stejné výšce');
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
  if (zR - need < low - 1e-6) throw new Error('Krabička je na pant příliš nízká, potřebuje výšku alespoň ' + (Math.ceil(need * 10) / 10).toString().replace('.', ',') + ' mm');
  /* local y points from the box to the lid, local x along the edge, z up; keep it right-handed */
  const ey = [0, 0, 0]; ey[ax] = dir; const ex = [ey[1], -ey[0], 0], zA = zR;
  const mid = (dir > 0 ? a.max[ax] + b.min[ax] : b.max[ax] + a.min[ax]) / 2;
  const lift = f.pinHole ? 0 : Math.max(0, Math.min(2, f.lift === undefined ? 0 : Number(f.lift) || 0));
  const zA0 = zR, midA = (dir > 0 ? a.max[ax] + b.min[ax] : b.max[ax] + a.min[ax]) / 2;
  const fold = ax === 1 ? [1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 2 * midA, 2 * zA0, 1] : [-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 2 * midA, 0, 2 * zA0, 1];
  const out = { H, G, flush, lift, fold, zRim: zR };
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
  const a = KK.bbox(boxPolys), b = KK.bbox(lidPolys);
  const side = f.side || '+y', k = side[1] === 'x' ? 0 : 1, sg = side[0] === '-' ? -1 : 1, o = 1 - k;
  const face = sg > 0 ? a.max[k] : a.min[k], lface = sg > 0 ? b.max[k] : b.min[k];
  /* the parting plane: the top of the box's back wall (a lip on the rim reaches up into the lid) */
  const zp = rimTop(boxPolys, k, face);
  /* the lid rests on the box rim (a latch tab may hang below the rim, so only its top half is checked) */
  if (b.min[2] > zp + 0.05 || b.max[2] < zp + 0.5) throw new Error('Víko musí ležet na krabičce (navrhněte krabičku zavřenou)');
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
  const a = KK.bbox(boxPolys), b = KK.bbox(lidPolys);
  const side = f.side || '+y', k = side[1] === 'x' ? 0 : 1, sg = side[0] === '-' ? -1 : 1, o = 1 - k;
  const face = sg > 0 ? a.max[k] : a.min[k], lface = sg > 0 ? b.max[k] : b.min[k], zp = rimTop(boxPolys, k, face);
  if (b.min[2] > zp + 0.05 || b.max[2] < zp + 0.5) throw new Error('Víko musí ležet na krabičce (navrhněte krabičku zavřenou)');
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
  return { box, lid, partA: sep ? pA : undefined, partB: sep ? pB : undefined, T: { H, G: 0, lift: 0, zRim: zp }, U, pinMode: true, hidden: true, maxAngle: 2 * HIDDEN_BEVEL, filLen: Math.round(xb - xa) };
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
  const a = KK.bbox(boxPolys), b = KK.bbox(lidPolys);
  const side = f.side || '-y', k = side[1] === 'x' ? 0 : 1, sg = side[0] === '-' ? -1 : 1, o = 1 - k;
  const face = sg > 0 ? a.max[k] : a.min[k], zp = zRim !== undefined ? zRim : rimTop(boxPolys, k, face);
  if (b.min[2] > zp + 0.05 || b.max[2] < zp + 0.5) throw new Error('Víko musí ležet na krabičce (zavřená krabička)');
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
  const sd = f.side || '-y', sk0 = sd[1] === 'x' ? 0 : 1, bbB = KK.bbox(bx.polys);
  const zp = ld.swing ? ld.swing.zp : rimTop(bx.polys, sk0, sd[0] === '-' ? bbB.min[sk0] : bbB.max[sk0]), lb = KK.bbox(ld.polys), onBox = lb.min[2] <= zp + 0.05 && lb.max[2] >= zp + 0.5;
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
/* ---------- text as a solid: the letters of a text (all the sketch text settings) extruded on a plane or a planar face.
   f: { s, h, bold, sp, ws, sl, lh, arc, al, mir, a, depth, n (plane normal), p (anchor on the first line's baseline),
        onFace (on a body's face: embossed slightly into it / engraved from it), op } */
function toolForText(f) {
  if (!String(f.s || '').trim()) throw new Error('Napište text');
  if (!(Number(f.h) > 0)) throw new Error('Výška písmen musí být kladná');
  const depth = Number(f.depth); if (!(depth > 0)) throw new Error((f.op === 'cut' ? 'Hloubka' : 'Výška') + ' textu musí být kladná');
  const n = KK.vnorm(f.n || [0, 0, 1]), p = f.p || [0, 0, 0], B0 = basisFromPlane(n, KK.vdot(n, p)), B = { o: p, u: B0.u, v: B0.v, n };
  const e = { t: 'text', s: String(f.s), x: 0, y: 0, h: Number(f.h), a: Number(f.a) || 0, bold: f.bold !== false, font: f.font, sp: f.sp, ws: f.ws, sl: f.sl, lh: f.lh, arc: f.arc, al: f.al, mir: f.mir };
  const cut = f.op === 'cut', z0 = cut ? -depth : (f.onFace && f.op === 'join' ? -0.02 : 0), z1 = cut ? 0.05 : depth;
  /* cf: the anchor is the middle of the text (of its letters' outline), e.g. the centre of the face it was put on */
  if (f.cf) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const l of skicaTextLoops(e)) for (const [x, y] of l) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (x1 > x0) { e.x = -(x0 + x1) / 2; e.y = -(y0 + y1) / 2; }
  }
  let tool = null;
  for (const r of regions({ ents: [e] })) {
    const so = KK.extrudeProfiles([{ t: 'poly', pts: r.pts }, ...r.holes.map(q => ({ t: 'poly', pts: q.pts }))], B, z0, z1);
    tool = tool ? KK.boolean(tool, so, 'union') : so;
  }
  if (!tool || !tool.length) throw new Error('Text nemá žádná písmena');
  return tool;
}
/* the matrix a Přesunout / Otočit / Měřítko step applies to the given polygons (null for a copying move or another step);
   used to show an earlier step (a text being edited) where the later steps have put it */
function xformMatrix(f, polys) {
  const bb = KK.bbox(polys), mid = [0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2);
  if (f.type === 'move') { if (f.copy) return null; return eulerMatrix(f.pc ? f.pc.map(Number) : mid, (f.t || [0, 0, 0]).map(Number), (f.r || [0, 0, 0]).map(Number)); }
  if (f.type === 'rotate') {
    const c = f.pc ? f.pc.map(Number) : f.pivot === 'origin' ? [0, 0, 0] : mid, m = eulerMatrix(c, [0, 0, 0], (f.r || [0, 0, 0]).map(Number));
    if (f.ground) { const mz = KK.bbox(KK.transform(polys, m)).min[2]; m[14] -= mz; }
    return m;
  }
  if (f.type === 'scale') {
    const s = (f.s || [1, 1, 1]).map(Number), c = f.pc ? f.pc.map(Number) : f.pivot === 'origin' ? [0, 0, 0] : f.pivot === 'base' ? [mid[0], mid[1], bb.min[2]] : mid;
    return [s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, c[0] * (1 - s[0]), c[1] * (1 - s[1]), c[2] * (1 - s[2]), 1];
  }
  return null;
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
/* ---------- organic modelling (js/organic.js) ---------- */
const ORGX = () => { if (typeof ORG === 'undefined') throw new Error('Organické modelování není k dispozici'); return ORG; };
/* the mirrored copy (across the YZ plane) of soft-union elements or skeleton nodes, for symmetric figures */
function mirrorElements(el) {
  const out = el.slice();
  for (const e of el) {
    if (Math.abs(Number(e.c ? e.c[0] : 0)) < 1e-6 && e.t !== 'rc') continue;
    const m = JSON.parse(JSON.stringify(e));
    if (m.c) m.c[0] = -m.c[0];
    if (m.a) { m.a[0] = -m.a[0]; m.b[0] = -m.b[0]; }
    if (m.rot) m.rot = [m.rot[0], -m.rot[1], -m.rot[2]];
    out.push(m);
  }
  return out;
}
function blobTool(f) { return ORGX().blobPolysOf({ ...f, el: f.sym ? mirrorElements(f.el || []) : (f.el || []) }); }
function skinTool(f) {
  const el = ORGX().skinElements(f);
  if (!el.length) throw new Error('Kostra nemá žádné body');
  const all = f.sym ? mirrorElements(el) : el, F = ORG.blobField(all, f.k);
  const G = ORG.fillGrid(ORG.makeGrid(F.min, F.max, 0, ORG.QUALITY[f.q] || ORG.QUALITY.mid), F.f);
  return ORG.polygonize(G, F.f);
}
/* a sketch element in 3D: an open curve (points) or a closed region (2D points in the sketch plane) */
function sketchPath(sketches, ref) {
  const sk = ref && sketches.get(ref.sketch); if (!sk) throw new Error('Skica s dráhou chybí');
  const e = sk.ents[ref.ei]; if (!e) throw new Error('Dráha ve skice chybí');
  let pts;
  if (e.t === 'poly' && !e.closed) pts = e.pts;
  else if (e.t === 'spline' && !e.closed) pts = KK.splinePoints(e.pts, false, 16, e.lin);
  else throw new Error('Dráha musí být otevřená čára nebo křivka');
  const P = sk.plane;
  return pts.map(([x, y]) => [0, 1, 2].map(i => P.o[i] + P.u[i] * x + P.v[i] * y));
}
function sketchRegion(sketches, ref) {
  const sk = ref && sketches.get(ref.sketch); if (!sk) throw new Error('Skica s profilem chybí');
  const r = regions(sk).find(x => x.ei === ref.ei); if (!r) throw new Error('Profil ve skice chybí');
  return { pts: r.pts, o: sk.plane.o, u: sk.plane.u, v: sk.plane.v };
}
/* open curves and closed profiles of all sketches (for the dialogs of Tažení po křivce and Přechod profilů) */
function sketchCurves(sk) {
  const out = [];
  (sk.ents || []).forEach((e, i) => { if (!e.cons && ((e.t === 'poly' && !e.closed && e.pts.length >= 2) || (e.t === 'spline' && !e.closed && e.pts.length >= 2))) out.push(i); });
  return out;
}
function sweepTool(f, sketches) {
  const path = sketchPath(sketches, f.path);
  let prof;
  if (f.prof && f.prof.sketch) prof = sketchRegion(sketches, f.prof).pts;
  else { const r = Math.max(0.1, Number(f.d) || 4) / 2; prof = []; for (let i = 0; i < 40; i++) prof.push([r * Math.cos(i / 40 * 2 * Math.PI), r * Math.sin(i / 40 * 2 * Math.PI)]); }
  return ORGX().sweep(path, prof, { twist: f.twist, scale: f.scale });
}
function loftTool(f, sketches) { return ORGX().loft((f.secs || []).map(r => sketchRegion(sketches, r)), f.smooth !== false); }
/* modifications of one body; the result replaces its polygons */
function orgModify(polys, f) {
  const O = ORGX();
  switch (f.type) {
    case 'deform': return O.deformSimple(polys, f);
    case 'lattice': return O.deformLattice(polys, f);
    case 'softmove': return O.softMove(polys, f);
    case 'subdiv': return O.subdivide(polys, f.levels);
    case 'remesh': return O.remesh(polys, f);
    case 'sculpt': return O.sculptPolys(polys, f);
    case 'hollow': return O.hollow(polys, f);
    case 'flatbase': return O.flatBase(polys, f);
  }
  throw new Error('Neznámý prvek');
}
/* Konektory: the body is cut by a plane (across one axis, or along a line drawn over the model) and the two parts are
   joined by a printed connector: kolík (pegs, on the lower part or loose), snap-fit (slit pins with a barb that clicks
   into an undercut), rybina (dovetail tongue that slides into a groove), kulový kloub (ball on a neck in a socket) or
   čepový kloub (knuckles round a pin, the parts swing about an axis lying in the cut). Local frame at the centroid c of
   the cut: u = the long direction across the cut, v = across it, n = the plane's normal (towards the upper part). */
function connectorPlane(polys, f) {
  const bb = KK.bbox(polys);
  if (f.cut && f.cut.a && f.cut.b && f.cut.d) {
    const a = f.cut.a.map(Number), b = f.cut.b.map(Number), d = KK.vnorm(f.cut.d.map(Number));
    let n = KK.cross(KK.vsub(b, a), d); const ln = Math.hypot(...n);
    if (!(ln > 1e-6)) throw new Error('Čára řezu je příliš krátká');
    n = KK.vmul(n, 1 / ln);
    let m = 0; for (let k = 1; k < 3; k++) if (Math.abs(n[k]) > Math.abs(n[m]) + 1e-9) m = k;
    if (n[m] < 0) n = KK.vmul(n, -1);
    return { n, w: KK.vdot(n, a), bb };
  }
  const a = { x: 0, y: 1, z: 2 }[f.axis] === undefined ? 2 : { x: 0, y: 1, z: 2 }[f.axis];
  const n = [0, 0, 0]; n[a] = 1;
  const at = f.at === undefined || f.at === null ? (bb.min[a] + bb.max[a]) / 2 : Number(f.at);
  if (!(at > bb.min[a] + 1e-3 && at < bb.max[a] - 1e-3)) throw new Error('Rovina řezu těleso neprotíná');
  return { n, w: at, bb };
}
/* a cut along a curve drawn on the view (f.curve: {pts, d}): the parts split by the curve, and the plane of the curve's
   longest straight stretch, where the connector goes */
function connectorCurve(polys, f) {
  const kind = f.kind || 'peg';
  if (kind !== 'peg' && kind !== 'snap') throw new Error('Rybina, kulový a čepový kloub potřebují rovný řez; s křivkou jde kolík nebo snap-fit');
  const pts = (f.curve.pts || []).map(p => p.map(Number)), d = KK.vnorm(f.curve.d.map(Number)), B0 = basisFromPlane(d, 0);
  const r = curveCut(polys, { mode: 'view', pts, d, gap: 0 });
  const Q = pts.map(p => [KK.vdot(p, B0.u), KK.vdot(p, B0.v)]);
  let best = -1, bl = 0; for (let i = 0; i + 1 < Q.length; i++) { const l = Math.hypot(Q[i + 1][0] - Q[i][0], Q[i + 1][1] - Q[i][1]); if (l > bl) { bl = l; best = i; } }
  const A2 = Q[best], B2 = Q[best + 1], dx = (B2[0] - A2[0]) / bl, dy = (B2[1] - A2[1]) / bl;
  const n = KK.vnorm([0, 1, 2].map(k => -dy * B0.u[k] + dx * B0.v[k]));
  const w = KK.vdot(n, [0, 1, 2].map(k => A2[0] * B0.u[k] + A2[1] * B0.v[k]));
  return { n, w, bb: KK.bbox(polys), top: r.a, bot: r.b };
}
function pegSplit(polys, f) {
  const kind = f.kind || 'peg';
  let n, w, bb, top, bot;
  if (f.curve) ({ n, w, bb, top, bot } = connectorCurve(polys, f));
  else {
    ({ n, w, bb } = connectorPlane(polys, f));
    const hs = cutTool({}, n, w, bb);
    top = KK.boolean(polys, hs, 'intersect'); bot = KK.boolean(polys, hs, 'subtract');
  }
  if (!top.length || !bot.length) throw new Error('Rovina řezu těleso neprotíná');
  const cap = bot.filter(p => KK.vdot(p.n, n) > 0.999 && Math.abs(p.w - w) < 1e-3);
  if (!cap.length) throw new Error('Řez se nepodařilo najít');
  let A = 0; const c = [0, 0, 0];
  for (const p of cap) for (let i = 1; i < p.v.length - 1; i++) { const t = [p.v[0], p.v[i], p.v[i + 1]], ar = 0.5 * Math.hypot(...KK.cross(KK.vsub(t[1], t[0]), KK.vsub(t[2], t[0]))); A += ar; for (let k = 0; k < 3; k++) c[k] += ar * (t[0][k] + t[1][k] + t[2][k]) / 3; }
  for (let k = 0; k < 3; k++) c[k] /= A || 1;
  /* main direction across the cut */
  const B0 = basisFromPlane(n, w);
  let sbb = 0, scc = 0, sbc = 0;
  for (const p of cap) for (const q of p.v) { const r = KK.vsub(q, c), x = KK.vdot(r, B0.u), y = KK.vdot(r, B0.v); sbb += x * x; scc += y * y; sbc += x * y; }
  const ang = 0.5 * Math.atan2(2 * sbc, sbb - scc);
  let u = KK.vnorm(KK.vadd(KK.vmul(B0.u, Math.cos(ang)), KK.vmul(B0.v, Math.sin(ang)))), v = KK.cross(n, u);
  if (f.dir === 'cross') { const t = u; u = v; v = KK.vmul(t, -1); }
  const P = (s, t, h) => [c[0] + u[0] * s + v[0] * t + n[0] * h, c[1] + u[1] * s + v[1] * t + n[1] * h, c[2] + u[2] * s + v[2] * t + n[2] * h];
  const inCap = q => cap.some(p => KK.pointInConvex(q, p, 1e-4));
  /* how far the cut reaches from c along a direction in it, and how thick each part is above / below the cut */
  const reach = (du, dv) => { let lo = 0; while (lo < 1e4 && inCap(P(du * (lo + 0.25), dv * (lo + 0.25), 0))) lo += 0.25; return lo; };
  let hUp = 0, hDn = 0; for (const p of top) for (const q of p.v) hUp = Math.max(hUp, KK.vdot(q, n) - w); for (const p of bot) for (const q of p.v) hDn = Math.max(hDn, w - KK.vdot(q, n));
  const d = Math.max(1, Number(f.d) || 5), len = Math.max(2, Number(f.len) || 10), tol = Math.max(0, f.tol === undefined ? 0.2 : Number(f.tol)), cnt = Math.max(1, Math.min(3, Math.round(Number(f.n) || 1)));
  const cylN = (q, r, z0, z1) => cylAlong(KK.vadd(q, KK.vmul(n, z0)), n, r, z1 - z0);
  const plane = { o: c, u, v, n }, side = { o: c, u: v, v: n, n: u }; /* side: profile in (v, n), extruded along u */
  const lbox = (s0, s1, t0, t1, z0, z1) => KK.extrudeProfiles([{ t: 'poly', pts: [[s0, t0], [s1, t0], [s1, t1], [s0, t1]] }], plane, z0, z1);
  const sprism = (pts, s0, s1) => KK.extrudeProfiles([{ t: 'poly', pts: KK.area2D(pts) < 0 ? pts.slice().reverse() : pts }], side, s0, s1);
  let lower = bot, upper = top; const extra = [];
  const need = (h, what) => { if (h > hUp - 0.8 || h > hDn + 50) throw new Error(what + ' je delší než horní díl; zkraťte ho'); };
  if (kind === 'peg' || kind === 'snap') {
    const okAt = q => { for (let i = 0; i < 12; i++) { const t = i / 12 * 2 * Math.PI, r = d / 2 + 0.8 + (kind === 'snap' ? 0.6 : 0); if (!inCap(KK.vadd(q, KK.vadd(KK.vmul(u, r * Math.cos(t)), KK.vmul(v, r * Math.sin(t)))))) return false; } return inCap(q); };
    const spots = [];
    if (cnt > 1) {
      let ext = 0; for (const p of cap) for (const q of p.v) ext = Math.max(ext, Math.abs(KK.vdot(KK.vsub(q, c), u)));
      for (let s = 0.7; s > 0.05 && !spots.length; s -= 0.05) {
        for (let i = 0; i < cnt; i++) { const q = P((i / (cnt - 1) - 0.5) * 2 * s * ext, 0, 0); if (okAt(q)) spots.push(q); }
        if (spots.length !== cnt) spots.length = 0;
      }
    }
    if (!spots.length) spots.push(c.slice());
    if (!okAt(spots[0])) throw new Error((kind === 'snap' ? 'Západka' : 'Kolík') + ' se do řezu nevejde, zmenšete průměr');
    const r = d / 2, Lp = len / 2;
    need(Lp + 0.3, kind === 'snap' ? 'Západka' : 'Kolík');
    if (kind === 'peg') for (const q of spots) {
      if (f.style === 'loose') {
        lower = KK.boolean(lower, cylN(q, r + tol, -Lp - 0.3, 0.01), 'subtract');
        upper = KK.boolean(upper, cylN(q, r + tol, -0.01, Lp + 0.3), 'subtract');
        extra.push({ name: 'Kolík', polys: cylAlong([0, 0, 0], [0, 0, 1], r, len) });
      } else {
        lower = KK.boolean(lower, cylN(q, r, -0.5, Lp), 'union');
        upper = KK.boolean(upper, cylN(q, r + tol, -0.01, Lp + 0.3), 'subtract');
      }
    }
    else {
      /* snap-fit: a pin split by a slit into two springy halves, a conical barb at the tip; the hole has a narrow throat
         and an undercut chamber that the barb clicks into (the barb's flat ledge holds the parts together) */
      const e = Math.max(0.3, Math.min(0.6, d * 0.1)), hb = Math.max(1.2, Math.min(Lp * 0.35, 3)), sw = Math.max(0.8, d * 0.25);
      if (Lp < hb + 1) throw new Error('Západka je příliš krátká; prodlužte ji');
      for (const q of spots) {
        let pin = KK.boolean(cylN(q, r, -0.5, Lp - hb), coneX(KK.vadd(q, KK.vmul(n, Lp - hb)), n, r + e, r * 0.7, hb), 'union');
        pin = KK.boolean(pin, KK.extrudeProfiles([{ t: 'poly', pts: [[-sw / 2, -r - e - 1], [sw / 2, -r - e - 1], [sw / 2, r + e + 1], [-sw / 2, r + e + 1]].map(([s, t]) => [s + KK.vdot(KK.vsub(q, c), u), t + KK.vdot(KK.vsub(q, c), v)]) }], plane, Lp * 0.3, Lp + 1), 'subtract');
        lower = KK.boolean(lower, pin, 'union');
        let hole = KK.boolean(cylN(q, r + tol, -0.01, Lp - hb + 0.01), cylN(q, r + e + tol, Lp - hb, Lp + tol + 0.3), 'union');
        hole = KK.boolean(hole, coneX(KK.vadd(q, KK.vmul(n, Lp + tol + 0.29)), n, r + e + tol, r * 0.5, r + e), 'union');
        upper = KK.boolean(upper, hole, 'subtract');
      }
    }
  } else if (kind === 'dovetail') {
    /* rybina: a tongue widening upwards at 20° runs along u right across the cut; the upper part has the matching
       groove with clearance and slides on from the side */
    const hgt = Math.max(1.5, Math.min(len / 2, hUp - 1.5)), wb = d, wt = d + 2 * hgt * Math.tan(20 * Math.PI / 180);
    const half = Math.min(reach(0, 1), reach(0, -1));
    if (wt / 2 + tol + 0.8 > half) throw new Error('Rybina se do řezu nevejde, zmenšete šířku');
    let E = 0; for (const p of cap) for (const q of p.v) E = Math.max(E, Math.abs(KK.vdot(KK.vsub(q, c), u)));
    E += 2;
    const tongue = KK.boolean(sprism([[-wb / 2, -0.5], [wb / 2, -0.5], [wb / 2, 0], [wt / 2, hgt], [-wt / 2, hgt], [-wb / 2, 0]], -E, E), top, 'intersect');
    lower = KK.boolean(lower, tongue, 'union');
    upper = KK.boolean(upper, sprism([[-wb / 2 - tol, -0.01], [wb / 2 + tol, -0.01], [wt / 2 + tol, hgt + tol], [-wt / 2 - tol, hgt + tol]], -E - 1, E + 1), 'subtract');
  } else if (kind === 'ball') {
    /* kulový kloub: ball on a neck on the lower part; the upper part has a spherical socket whose mouth is a little
       narrower than the ball (it snaps in), flared below so the neck can tilt; a gap between the parts lets them turn */
    const rb = d / 2, R = rb + tol, ro = rb - 0.25, z0 = 0.8, gp = Math.max(0.8, d * 0.12), rn = Math.max(1, rb * 0.55);
    const zb = z0 + Math.sqrt(R * R - ro * ro);
    if (Math.min(reach(1, 0), reach(-1, 0), reach(0, 1), reach(0, -1)) < z0 + ro + 1) throw new Error('Kulový kloub se do řezu nevejde, zmenšete průměr');
    need(zb + R + 0.8, 'Kulový kloub');
    if (hDn < gp + 1) throw new Error('Spodní díl je na kloub příliš tenký');
    lower = KK.boolean(bot, cutTool({}, n, w - gp, bb), 'subtract');
    /* both faces at the joint slope away from the ball a little (a shallow cone), so the parts can tilt */
    const beta = Math.max(0, Math.min(25, (Number(f.angle) || 30) / 2 - 2)) * Math.PI / 180;
    if (beta > 0.01) {
      const Rb = Math.max(reach(1, 0), reach(-1, 0), reach(0, 1), reach(0, -1)) + 5, H = Rb * Math.tan(beta);
      lower = KK.boolean(lower, KK.boolean(lbox(-Rb, Rb, -Rb, Rb, -gp - H, -gp + 0.01), coneX(P(0, 0, -gp - H), n, Rb, 0.01, H), 'subtract'), 'subtract');
      upper = KK.boolean(upper, KK.boolean(lbox(-Rb, Rb, -Rb, Rb, -0.01, H), coneX(P(0, 0, 0), n, 0.01, Rb, H), 'subtract'), 'subtract');
    }
    lower = KK.boolean(lower, KK.boolean(cylN(c, rn, -gp - 0.5, zb), KK.translate(KK.primitive('sphere', { r: rb }), P(0, 0, zb)), 'union'), 'union');
    upper = KK.boolean(upper, coneX(P(0, 0, -0.01), n, ro + z0 + 0.01, ro - 0.4, z0 + 0.41), 'subtract');
    upper = KK.boolean(upper, KK.translate(KK.primitive('sphere', { r: R }), P(0, 0, zb)), 'subtract');
  } else if (kind === 'pin') {
    /* čepový kloub: knuckles round an axis along u lying in the cut (like a knee): the outer ones belong to the upper
       part, the middle one to the lower; a pin goes through all of them; V-shaped relief on both sides of the cut lets
       the parts swing by the given angle either way */
    const s0 = -reach(-1, 0), s1 = reach(1, 0), L = s1 - s0;
    let R = Math.min(reach(0, 1), reach(0, -1), hUp - 0.5, hDn - 0.5) * 0.97;
    const g = tol + 0.15, gk = tol + 0.2, rp = Math.min(d / 2, R * 0.45);
    if (R < 2 || L < 6 * gk + 3) throw new Error('Řez je na čepový kloub příliš malý');
    if (rp < 0.8) throw new Error('Čep je příliš tenký');
    const xa = s0 + L * 0.3, xb = s1 - L * 0.3, h = gk / 2, E = L + 10;
    const C = (a, b, r) => cylAlong(P(a, 0, 0), u, r, b - a);
    const beta = Math.max(5, Math.min(60, Number(f.angle) || 30)) / 2 * Math.PI / 180, Y = Math.max(reach(0, 1), reach(0, -1)) + 5, tz = Y * Math.tan(beta);
    const wedge = sg => KK.boolean(sprism([[0, -sg * 0.01], [Y, -sg * 0.01], [Y, sg * tz]], -E, E), sprism([[0, -sg * 0.01], [-Y, sg * tz], [-Y, -sg * 0.01]], -E, E), 'union');
    let up = KK.boolean(top, C(xa - h, xb + h, R + g), 'subtract'); up = KK.boolean(up, wedge(1), 'subtract');
    up = KK.boolean(up, KK.boolean(KK.boolean(C(s0 - 1, xa - h, R), C(xb + h, s1 + 1, R), 'union'), polys, 'intersect'), 'union');
    let lo = KK.boolean(bot, KK.boolean(C(s0 - 1, xa + h, R + g), C(xb - h, s1 + 1, R + g), 'union'), 'subtract'); lo = KK.boolean(lo, wedge(-1), 'subtract');
    lo = KK.boolean(lo, KK.boolean(C(xa + h, xb - h, R), polys, 'intersect'), 'union');
    const hole = C(s0 - 2, s1 + 2, rp + tol);
    upper = KK.boolean(up, hole, 'subtract'); lower = KK.boolean(lo, hole, 'subtract');
    extra.push({ name: 'Čep', polys: cylAlong([0, 0, 0], [0, 0, 1], rp, Math.max(2, L - 0.6)) });
  } else throw new Error('Neznámý typ konektoru');
  if (!lower.length || !upper.length) throw new Error('Konektor se nepodařilo vytvořit');
  return { lower, upper, pegs: extra.map(x => x.polys), extra, n, w, c, u, v };
}
/* ---------- Rozříznout křivkou: cut a body along a curve through clicked points ----------
   mode 'view': the curve is drawn on the view; the cut runs through it straight along the view direction f.d (like a
   cookie cutter), so it can zig-zag or wave across the body. mode 'around': the points lie on the body round an axis
   (f.axis through the body's middle); the cut runs from the curve straight in to the axis, so a cylinder parts into a
   top and a bottom with a shaped seam. f.smooth draws a smooth curve through the points, f.gap leaves a gap between the
   parts (the seam is moved by half of it each way). Returns the two parts and a direction to show them apart. */
function curveCut(polys, f) {
  const pts = (f.pts || []).map(p => p.map(Number)), gap = Math.max(0, Number(f.gap) || 0), bb = KK.bbox(polys);
  const span = Math.hypot(bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]), BIG = span * 2 + 50;
  const c = [0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2);
  let toolA, toolB, apart;
  if (f.mode === 'around') {
    if (pts.length < 1) throw new Error('Klepněte alespoň na jeden bod na tělese');
    const ax = { x: 0, y: 1, z: 2 }[f.axis] === undefined ? 2 : { x: 0, y: 1, z: 2 }[f.axis];
    const ea = [0, 0, 0]; ea[ax] = 1;
    const e1 = [0, 0, 0]; e1[(ax + 1) % 3] = 1; const e2 = KK.cross(ea, e1);
    /* the points as angle round the axis and height along it, sorted by angle */
    let P = pts.map(p => { const d = KK.vsub(p, c); return [Math.atan2(KK.vdot(d, e2), KK.vdot(d, e1)), KK.vdot(d, ea)]; }).sort((p, q) => p[0] - q[0]);
    P = P.filter((p, i) => i === 0 || p[0] - P[i - 1][0] > 1e-3);
    const n = P.length, TAU = 2 * Math.PI;
    const at = i => { const k = ((i % n) + n) % n, wrap = Math.floor(i / n); return [P[k][0] + wrap * TAU, P[k][1]]; };
    const H = th => { /* height of the seam at angle th (periodic) */
      if (n === 1) return P[0][1];
      let i = 0; while (i < n - 1 && !(th >= at(i)[0] && th < at(i + 1)[0])) i++;
      if (!(th >= at(i)[0] && th < at(i + 1)[0])) { i = th < at(0)[0] ? -1 : n - 1; }
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2), t = (th - p1[0]) / (p2[0] - p1[0] || 1);
      if (!f.smooth) return p1[1] + (p2[1] - p1[1]) * t;
      const dt = p2[0] - p1[0], m1 = (p2[1] - p0[1]) / (p2[0] - p0[0] || 1) * dt, m2 = (p3[1] - p1[1]) / (p3[0] - p1[0] || 1) * dt;
      const t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
    };
    const ths = []; const N = 180; for (let k = 0; k < N; k++) ths.push(-Math.PI + TAU * k / N);
    for (const p of P) ths.push(p[0]);
    ths.sort((p, q) => p - q);
    const T = ths.filter((t, i) => i === 0 || t - ths[i - 1] > 1e-4), hs = T.map(H);
    let rim = 0; for (const x of [bb.min, bb.max]) for (const y of [bb.min, bb.max]) for (const z of [bb.min, bb.max]) { const q = KK.vsub([x[0], y[1], z[2]], c), h = KK.vdot(q, ea); rim = Math.max(rim, Math.sqrt(Math.max(0, KK.vdot(q, q) - h * h))); }
    rim += 5; const r0 = Math.min(0.5, rim * 0.02), hmean = hs.reduce((s, h) => s + h, 0) / hs.length, hlo = Math.min(...hs) - BIG;
    const at3 = (r, th, h) => [0, 1, 2].map(k => c[k] + r * (Math.cos(th) * e1[k] + Math.sin(th) * e2[k]) + h * ea[k]);
    const solid = s => { /* everything below the seam, moved by s along the axis */
      const out = [], add = (v, want) => { const p = KK.mkPoly(v); if (!p) return; if (KK.vdot(p.n, want) < 0) { p.v.reverse(); p.n = p.n.map(x => -x); p.w = -p.w; } out.push(p); };
      const M = T.length, O = at3(0, 0, hmean + s);
      for (let k = 0; k < M; k++) {
        const j = (k + 1) % M, ta = T[k], tb = T[j], ha = hs[k] + s, hb = hs[j] + s, mid = ta + (((tb - ta) % TAU) + TAU) % TAU / 2;
        const Ia = at3(r0, ta, ha), Ib = at3(r0, tb, hb), Aa = at3(rim, ta, ha), Ab = at3(rim, tb, hb), Ba = at3(rim, ta, hlo), Bb = at3(rim, tb, hlo);
        add([O, Ia, Ib], ea); add([Ia, Aa, Ab], ea); add([Ia, Ab, Ib], ea);
        add([Ba, Bb, Ab, Aa], [0, 1, 2].map(i => Math.cos(mid) * e1[i] + Math.sin(mid) * e2[i]));
      }
      add(T.map(t => at3(rim, t, hlo)), ea.map(x => -x));
      return out;
    };
    toolA = solid(-gap / 2); toolB = solid(gap / 2); apart = ea.map(x => x * 6);
  } else {
    if (pts.length < 2) throw new Error('Klepněte alespoň na dva body křivky');
    const d = KK.vnorm((f.d || [0, 0, -1]).map(Number)), B0 = basisFromPlane(d, 0);
    let Q = pts.map(p => [KK.vdot(p, B0.u), KK.vdot(p, B0.v)]).filter((q, i, A) => i === 0 || Math.hypot(q[0] - A[i - 1][0], q[1] - A[i - 1][1]) > 1e-3);
    if (Q.length < 2) throw new Error('Body křivky splývají');
    if (f.smooth && Q.length > 2) Q = KK.splinePoints(Q, false, 12);
    const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    const off = s => Q.map((q, i) => { /* the polyline moved sideways by s (mitred corners) */
      const n1 = i > 0 ? nrm(Q[i - 1], q) : null, n2 = i < Q.length - 1 ? nrm(q, Q[i + 1]) : null;
      let m = n1 && n2 ? [n1[0] + n2[0], n1[1] + n2[1]] : (n1 || n2); const l = Math.hypot(m[0], m[1]) || 1; m = [m[0] / l, m[1] / l];
      const k = s / Math.max(0.35, m[0] * (n1 || n2)[0] + m[1] * (n1 || n2)[1]);
      return [q[0] + m[0] * k, q[1] + m[1] * k];
    });
    const tool = s => { /* the side on the left of the curve, through the whole body along the view */
      const R = off(s), a = R[0], b = R[R.length - 1], t0 = KK.vnorm([a[0] - R[1][0], a[1] - R[1][1], 0]), t1 = KK.vnorm([b[0] - R[R.length - 2][0], b[1] - R[R.length - 2][1], 0]);
      const D = KK.vnorm([b[0] - a[0], b[1] - a[1], 0]), L = [-D[1], D[0]];
      const E0 = [a[0] + t0[0] * BIG, a[1] + t0[1] * BIG], E1 = [b[0] + t1[0] * BIG, b[1] + t1[1] * BIG];
      let ring = [E0, ...R, E1, [E1[0] + L[0] * 3 * BIG, E1[1] + L[1] * 3 * BIG], [E0[0] + L[0] * 3 * BIG, E0[1] + L[1] * 3 * BIG]];
      if (KK.area2D(ring) < 0) ring = ring.reverse();
      const w = KK.vdot(c, d);
      return KK.extrudeProfiles([{ pts: ring, closed: true }], { o: [0, 0, 0], u: B0.u, v: B0.v, n: d }, w - BIG, w + BIG);
    };
    toolA = tool(gap / 2); toolB = tool(-gap / 2);
    const D = KK.vnorm([Q[Q.length - 1][0] - Q[0][0], Q[Q.length - 1][1] - Q[0][1], 0]);
    apart = [0, 1, 2].map(k => (-D[1] * B0.u[k] + D[0] * B0.v[k]) * 6);
  }
  const a = KK.boolean(polys, toolA, 'intersect'), b = KK.boolean(polys, toolB, 'subtract');
  if (!a.length || !b.length || Math.abs(KK.signedVolume(a)) < 1e-6 || Math.abs(KK.signedVolume(b)) < 1e-6) throw new Error('Křivka těleso nerozdělí; veďte ji přes celé těleso');
  return { a, b, apart };
}
/* ---------- Kloubový model: a body cut into segments joined by print-in-place hinges ----------
   The segments swing about vertical axes (they lie on the bed and move in the bed's plane, like an articulated snake or
   dragon). At each joint the right segment ends in a round knuckle, the left one has a matching hollow; a tongue of the
   left segment (a disc on a neck, in the middle of the height) sits in a slot of the knuckle, with a clearance all round,
   so the parts are trapped together yet print in one go without supports. */
function sectionAt(polys, a, x) {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; let any = false;
  for (const p of polys) for (let i = 0; i < p.v.length; i++) {
    const A = p.v[i], B = p.v[(i + 1) % p.v.length], da = A[a] - x, db = B[a] - x;
    if ((da < 0) === (db < 0) || da === db) continue;
    const t = da / (da - db); any = true;
    for (let k = 0; k < 3; k++) { const v = A[k] + (B[k] - A[k]) * t; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
  }
  return any ? { min: mn, max: mx } : null;
}
/* the section of a body by the plane (axis a) = x through the piece nearest to Q: a curved body (a snake in an S) may
   cross the plane in several places, only the one at the joint counts */
function sectionNear(polys, a, x, Q) {
  const segs = [], key = p => p.map(v => Math.round(v * 1e4)).join(',');
  for (const p of polys) {
    const pts = [];
    for (let i = 0; i < p.v.length; i++) {
      const A = p.v[i], B = p.v[(i + 1) % p.v.length], da = A[a] - x, db = B[a] - x;
      if ((da < 0) === (db < 0) || da === db) continue;
      const t = da / (da - db); pts.push([0, 1, 2].map(k => A[k] + (B[k] - A[k]) * t));
    }
    if (pts.length >= 2) segs.push([pts[0], pts[1]]);
  }
  if (!segs.length) return null;
  const parent = new Map(), find = k => { while (parent.get(k) !== k) { parent.set(k, parent.get(parent.get(k))); k = parent.get(k); } return k; };
  const add = k => { if (!parent.has(k)) parent.set(k, k); };
  for (const [p, q] of segs) { const kp = key(p), kq = key(q); add(kp); add(kq); parent.set(find(kp), find(kq)); }
  const boxes = new Map();
  for (const [p, q] of segs) {
    const r = find(key(p)); let b = boxes.get(r); if (!b) boxes.set(r, (b = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }));
    for (const v of [p, q]) for (let k = 0; k < 3; k++) { if (v[k] < b.min[k]) b.min[k] = v[k]; if (v[k] > b.max[k]) b.max[k] = v[k]; }
  }
  let best = null, bd = Infinity;
  for (const b of boxes.values()) {
    let d = 0; for (let k = 0; k < 3; k++) if (k !== a) { const o = Math.max(b.min[k] - Q[k], 0, Q[k] - b.max[k]); d += o * o; }
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}
/* ---------- Spona: a side release buckle (like on backpacks), both halves printed flat ----------
   Local frame: along +x from the back (x = 0, where a strap or webbing joins) to the front, bottom on z = 0, centred on
   y = 0. The female is a flat sleeve with windows in its sides near the back of the cavity; the male has a centre
   tongue and two springy prongs whose hooks snap into the windows (press them to release). The prongs bend in the
   bed's plane, which is how printed layers flex best; the sleeve's roof is one bridge. */
function buckleParts(f) {
  const Wf = Math.max(12, Number(f.w) || 25), H = Math.max(6, Number(f.h) || 8), g = Math.max(0.15, Number(f.gap) || 0.3);
  const ws = Math.max(1.6, Math.min(3, Wf * 0.08)), tw = Math.max(1.2, Math.min(2, H * 0.16));
  /* the male's tongue and prongs lie on the bed (z = 0) so they print without supports; in use they slide into the
     female's cavity, which is tw + g above her bottom */
  const Wc = Wf - 2 * ws, Hc = H - 2 * tw, hm = Hc - 2 * g, zoff = 0, zcav = tw + g;
  if (hm < 1.6) throw new Error('Spona je příliš nízká; zvyšte výšku spony');
  const Li = Wf * 0.75, Lc = Li + g, lh = Math.max(3, Wf * 0.22), pw = Math.max(1.6, Math.min(3, Wf * 0.1)), hk = Math.min(ws * 0.85, 2);
  const tc = Wc - 2 * (g + pw + hk + 0.8);
  if (tc < 2) throw new Error('Spona je příliš úzká; zvětšete šířku spony');
  const slot = !!f.slot, sl = 3.5, sz = slot ? sl + 2 * 2.2 : 0; /* webbing slot zone at the back */
  const bw = Math.max(2.5, Wf * 0.3), Lf = sz + bw + Lc, Lb = sz + 4; /* a solid back long enough for a broad waist */
  const box = (x0, x1, y0, y1, z0, z1) => KK.translate(KK.primitive('box', { w: x1 - x0, d: y1 - y0, h: z1 - z0 }), [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]);
  const prism = (pts, z0, z1) => KK.extrudeProfiles([{ pts: KK.area2D(pts) < 0 ? pts.slice().reverse() : pts, closed: true }], { o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] }, z0, z1);
  const rounded = (x0, x1, y0, y1, z0, z1, r) => prism(KK.profilePoints({ t: 'rect', x: x0, y: y0, w: x1 - x0, h: y1 - y0, fr: r }), z0, z1);
  /* female */
  let fem = rounded(0, Lf, -Wf / 2, Wf / 2, 0, H, Math.min(3, Wf * 0.12));
  fem = KK.boolean(fem, box(Lf - Lc, Lf + 1, -Wc / 2, Wc / 2, tw, H - tw), 'subtract');
  const wx0 = Lf - Lc, wx1 = Lf - Li + lh + g;
  for (const sg of [-1, 1]) fem = KK.boolean(fem, box(wx0, wx1, sg < 0 ? -Wf / 2 - 1 : Wc / 2 - 0.1, sg < 0 ? -Wc / 2 + 0.1 : Wf / 2 + 1, tw, H - tw), 'subtract');
  /* a broad scallop in each side over the window (the "waist" of a backpack buckle), so the hooks are easy to reach and
     press with finger and thumb. It ends exactly at the window's front edge, where the full side wall catches the hooks,
     and is a little deeper than the wall, so the hooks stand out of the scalloped side. */
  if (f.scallop !== false) {
    const hs = Math.max(3, Math.min((wx1 - wx0) * 1.1, (wx1 - sz - 1.5) / 2)), dm = ws + Math.min(1.2, hk), xs = wx1 - hs;
    const Rs = (hs * hs + dm * dm) / (2 * dm);
    for (const sg of [-1, 1]) fem = KK.boolean(fem, KK.translate(KK.primitive('cylinder', { r: Rs, h: H + 2 }), [xs, sg * (Wf / 2 + Rs - dm), H / 2]), 'subtract');
  }
  /* male: base, tongue, two prongs with hooks */
  let mal = rounded(0, Lb, -Wf / 2, Wf / 2, 0, H, Math.min(3, Wf * 0.12));
  mal = KK.boolean(mal, box(Lb - 0.5, Lb + Li - 1, -tc / 2, tc / 2, zoff, zoff + hm), 'union');
  const xt = Lb + Li, xc = xt - lh;
  for (const sg of [-1, 1]) {
    const yo = Wc / 2 - g, yi = yo - pw;
    mal = KK.boolean(mal, box(Lb - 0.5, xt, sg < 0 ? -yo : yi, sg < 0 ? -yi : yo, zoff, zoff + hm), 'union');
    /* hook: flat catch facing the base, a ramp towards the tip */
    const hp = [[xc, yo - 0.3], [xc, yo + hk], [xc + lh * 0.4, yo + hk], [xt, yo - 0.3]].map(([x, y]) => [x, sg * y]);
    mal = KK.boolean(mal, prism(hp, zoff, zoff + hm), 'union');
  }
  if (slot) for (const part of ['f', 'm']) {
    const hole = box(2.2, 2.2 + sl, -(Wc / 2 - 0.5), Wc / 2 - 0.5, -1, H + 1);
    if (part === 'f') fem = KK.boolean(fem, hole, 'subtract'); else mal = KK.boolean(mal, hole, 'subtract');
  }
  return { female: fem, male: mal, Lf, Lb, H, Wf, zcav };
}
/* ---------- Jazyk a poutko: the clasp of a thin strap (like a printed watch strap) ----------
   Local frame as for the buckle. The female is a narrow upright U at the strap's end, open at the top; the male is a
   flat tongue split into three fingers. Worn, the strap's last links bend down and the tongue slides into the U, where
   it is held snugly (the slot is a touch narrower than the tongue; the fingers give). */
function tongueParts(f) {
  const W = Math.max(8, Number(f.w) || 16), h = Math.max(2, Number(f.h) || 3.5), fit = Number(f.fit === undefined ? -0.05 : f.fit);
  const tt = Math.max(1.2, Math.min(2, h * 0.5)), Lt = Math.max(8, Math.min(W * 0.9, 16)), wt = 1.5, slot = Math.max(0.6, tt + fit), hb = Math.max(h, 3);
  const Lu = 2 * wt + slot, Hu = hb + Lt + 1;
  const box = (x0, x1, y0, y1, z0, z1) => KK.translate(KK.primitive('box', { w: x1 - x0, d: y1 - y0, h: z1 - z0 }), [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]);
  let female = KK.boolean(box(0, Lu, -W / 2, W / 2, 0, Hu), box(wt, wt + slot, -W / 2 - 1, W / 2 + 1, hb, Hu + 1), 'subtract');
  /* a lead-in at the top of the slot */
  const lead = KK.extrudeProfiles([{ pts: [[wt - 0.6, Hu + 0.01], [wt, Hu - 0.8], [wt + slot, Hu - 0.8], [wt + slot + 0.6, Hu + 0.01]], closed: true }], { o: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], n: [0, -1, 0] }, -W / 2 - 1, W / 2 + 1);
  female = KK.boolean(female, KK.fixOrientation(lead), 'subtract');
  const tw = W - 2;
  let male = box(-1, Lt, -tw / 2, tw / 2, 0, tt);
  for (const y of [-tw / 6, tw / 6]) male = KK.boolean(male, box(Lt * 0.3, Lt + 1, y - 0.4, y + 0.4, -1, tt + 1), 'subtract');
  /* rounded-off tip corners for an easy start */
  for (const sg of [-1, 1]) {
    const c = KK.extrudeProfiles([{ pts: [[Lt - 2, sg * tw / 2], [Lt + 0.1, sg * tw / 2], [Lt + 0.1, sg * (tw / 2 - 2)]].map(([x, y]) => [x, y]), closed: true }].map(q => ({ ...q, pts: KK.area2D(q.pts) < 0 ? q.pts.slice().reverse() : q.pts })), { o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] }, -1, tt + 1);
    male = KK.boolean(male, c, 'subtract');
  }
  return { female, male, W, Lu, Lt };
}
/* place a buckle half: local +x along dir (unit vector in the bed's plane), back at point o (z of the bed at o[2]) */
function placeLocal(polys, o, dir) {
  const c = dir[0], s2 = dir[1];
  return KK.transform(polys, [c, s2, 0, 0, -s2, c, 0, 0, 0, 0, 1, 0, o[0], o[1], o[2], 1]);
}
/* the clasp halves replace the ends of the strap (the strap keeps its length): the body is shortened at both ends by
   the length of the clasp parts, jointed, and the parts are joined on, the female at the start, the male at the end */
function articulate(polys, f) {
  const out = articulateParts(polys, f);
  if (!f.snap || f.style !== 'flex' || f.ends === 'fold') return out;
  /* printed in parts: the links are laid out apart along the chain, to be snapped together after printing */
  const a = f.axis === 'y' ? 1 : 0; let edge = -Infinity;
  return out.map(p => { const bb = KK.bbox(p), d = [0, 0, 0]; d[a] = edge === -Infinity ? 0 : Math.max(0, edge + 4 - bb.min[a]); edge = bb.max[a] + d[a]; return d[a] ? KK.translate(p, d) : p; });
}
function articulateParts(polys, f) {
  if (f.ends === 'fold') return articulateFold(polys, f);
  if (f.ends !== 'buckle' && f.ends !== 'tongue') return articulateCore(polys, f);
  const a = f.axis === 'y' ? 1 : 0, sAx = 1 - a, bb = KK.bbox(polys);
  const parts = [[bb.min[a], -1], [bb.max[a], 1]].map(([xe, sg]) => {
    const sec = sectionAt(polys, a, xe - sg * 0.6) || { min: bb.min, max: bb.max };
    const wEnd = sec.max[sAx] - sec.min[sAx], hEnd = sec.max[2] - sec.min[2];
    const B = f.ends === 'tongue' ? tongueParts({ w: Number(f.bw) || wEnd, h: hEnd })
      : buckleParts({ w: Number(f.bw) || Math.max(14, wEnd), h: Number(f.bh) || Math.max(7, hEnd), gap: f.bgap || 0.3 });
    const body = sg < 0 ? B.female : B.male, len = KK.bbox(body).max[0];
    return { xe, sg, body, len, sec };
  });
  const L = bb.max[a] - bb.min[a], inner = L - parts[0].len - parts[1].len;
  if (inner < 6) throw new Error('Řemínek je na zapínání příliš krátký');
  /* the strap without its ends (1 mm is left under each part so they join) */
  const lo = bb.min[a] + parts[0].len - 1, hi = bb.max[a] - parts[1].len + 1, BIG = 4 * Math.max(...[0, 1, 2].map(k => bb.max[k] - bb.min[k])) + 100;
  const blo = bb.min.map(v => v - BIG), bhi = bb.max.map(v => v + BIG); blo[a] = lo; bhi[a] = hi;
  const keep = KK.translate(KK.primitive('box', { w: bhi[0] - blo[0], d: bhi[1] - blo[1], h: bhi[2] - blo[2] }), [0, 1, 2].map(k => (blo[k] + bhi[k]) / 2));
  const trimmed = KK.boolean(polys, keep, 'intersect');
  const out = articulateCore(trimmed, { ...f, ends: undefined });
  for (const [k, p] of [[0, parts[0]], [out.length - 1, parts[1]]]) {
    const o = [0, 0, p.sec.min[2]]; o[a] = p.xe - p.sg * p.len; o[sAx] = (p.sec.min[sAx] + p.sec.max[sAx]) / 2;
    const dir = [0, 0]; dir[a] = p.sg;
    out[k] = KK.boolean(out[k], placeLocal(p.body, o, dir), 'union');
  }
  return out;
}
/* Spona sklápěcí: a buckle as thin as the strap (after the printed watch straps). The male lies flat at the end; the
   female is printed standing up at the start (its thin cavity needs no bridge that way) on a narrow foot that turns in
   an up/down joint of the first link: after printing, fold it 90° outwards into the strap's line, mouth outwards. The
   foot carries diamond lugs that turn in round bores of the link's arms. */
function articulateFold(polys, f) {
  const a = f.axis === 'y' ? 1 : 0, sAx = 1 - a, bb = KK.bbox(polys), g = Math.max(0.15, Number(f.gap) || 0.4);
  const ea = [0, 0, 0], es = [0, 0, 0], ez = [0, 0, 1]; ea[a] = 1; es[sAx] = 1;
  const BIG = 4 * Math.max(...[0, 1, 2].map(k => bb.max[k] - bb.min[k])) + 100;
  const P3 = (av, sv, zv) => { const p = [0, 0, zv]; p[a] = av; p[sAx] = sv; return p; };
  const boxAS = (ar, sr, zr) => { const lo = P3(ar[0], sr[0], zr[0]), hi = P3(ar[1], sr[1], zr[1]); return KK.translate(KK.primitive('box', { w: hi[0] - lo[0], d: hi[1] - lo[1], h: hi[2] - lo[2] }), [0, 1, 2].map(k => (lo[k] + hi[k]) / 2)); };
  const I = (p, q) => KK.boolean(p, q, 'intersect'), U = (p, q) => KK.boolean(p, q, 'union'), S = (p, q) => KK.boolean(p, q, 'subtract');
  const secS = sectionAt(polys, a, bb.min[a] + 0.6) || { min: bb.min, max: bb.max }, secE = sectionAt(polys, a, bb.max[a] - 0.6) || { min: bb.min, max: bb.max };
  const W = Number(f.bw) || (secS.max[sAx] - secS.min[sAx]), sc = (secS.min[sAx] + secS.max[sAx]) / 2, z0 = secS.min[2], zs = secS.max[2] - secS.min[2], zc = z0 + zs / 2, hz = zs / 2;
  /* thin buckle: cavity just thick enough for a male of ~1.6 mm */
  const T = Math.max(4.6, zs + 0.6), B = buckleParts({ w: Math.max(12, W), h: T, gap: f.bgap || 0.3 });
  const hw = W / 2, wa = Math.max(1.6, Math.min(3, hw * 0.22)), st = hw - wa - g;
  const dp = Math.max(0.8, Math.min(hz * 0.6, 2)), Rr = Math.max(hz, dp + g * 1.42 + 1.2), pd = Math.min(wa * 0.55, 1.4);
  if (st < 2 || zs < 2.4) throw new Error('Řemínek je na sklápěcí sponu příliš malý');
  const zw = zc + Rr + g, rise = Math.max(0, W / 2 - st), zb2 = zw + rise, Hup = zb2 - zc + B.Lf; /* height above the axis */
  /* the axis sits so that the folded female ends where the strap began; the male takes the strap's other end */
  const xpf = bb.min[a] + Hup, mlen = KK.bbox(B.male).max[0];
  if (bb.max[a] - mlen - xpf < 8) throw new Error('Řemínek je na zapínání příliš krátký');
  const lo = xpf - Rr - 0.5, hi = bb.max[a] - mlen + 1;
  const trimmed = I(polys, boxAS([lo, hi], [sc - BIG, sc + BIG], [z0 - BIG, z0 + BIG]));
  const out = articulateCore(trimmed, { ...f, ends: undefined });
  /* male at the end */
  { const o = [0, 0, secE.min[2]]; o[a] = bb.max[a] - mlen; o[sAx] = (secE.min[sAx] + secE.max[sAx]) / 2; const dir = [0, 0]; dir[a] = 1; out[out.length - 1] = U(out[out.length - 1], placeLocal(B.male, o, dir)); }
  /* the first link: arms round about the axis, the middle hollowed round for the female's foot, bores for its lugs */
  const Q = P3(xpf, sc, zc), along = r => { const o = Q.slice(); o[sAx] -= BIG / 2; return cylAlong(o, es, r, BIG); };
  const cylR = along(Rr), cylG = along(Rr + g);
  const halfB = boxAS([xpf + g / 2, xpf + BIG], [sc - BIG, sc + BIG], [z0 - BIG, z0 + BIG]);
  const inner = boxAS([xpf - BIG, xpf + BIG], [sc - st, sc + st], [z0 - BIG, z0 + BIG]);
  const outer = S(boxAS([xpf - BIG, xpf + BIG], [sc - BIG, sc + BIG], [z0 - BIG, z0 + BIG]), boxAS([xpf - BIG, xpf + BIG], [sc - st - g, sc + st + g], [z0 - BIG, z0 + BIG]));
  let link = out[0];
  link = U(I(link, I(S(halfB, cylG), inner)), I(link, I(U(halfB, cylR), outer)));
  for (const sg of [-1, 1]) { const o = Q.slice(); o[sAx] = sc + sg * st; link = S(link, cylAlong(o, KK.vmul(es, sg), dp + g, g + pd + g)); }
  /* the female, standing: foot (round about the axis), neck, a 45° widening, then the buckle's female, mouth up */
  const slab = boxAS([xpf - BIG, xpf + BIG], [sc - BIG, sc + BIG], [z0, z0 + BIG]);
  let fem = I(I(cylR, inner), slab);
  fem = U(fem, boxAS([xpf - T / 2, xpf + T / 2], [sc - st, sc + st], [zc, zw + 0.01]));
  { const n = KK.cross(es, ez), sgn = KK.vdot(n, ea) > 0 ? 1 : -1, pts = [[sc - st, zw], [sc + st, zw], [sc + W / 2, zb2 + 0.01], [sc - W / 2, zb2 + 0.01]];
    const tr = KK.extrudeProfiles([{ pts, closed: true }], { o: [0, 0, 0], u: es, v: ez, n }, sgn > 0 ? xpf - T / 2 : -(xpf + T / 2), sgn > 0 ? xpf + T / 2 : -(xpf - T / 2));
    fem = U(fem, KK.fixOrientation(tr)); }
  { const m = a === 0 ? [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, xpf - T / 2, sc, zb2, 1] : [0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, sc, xpf - T / 2, zb2, 1];
    fem = U(fem, KK.fixOrientation(KK.transform(B.female, m))); }
  /* diamond lugs on the foot's sides */
  { const n = KK.cross(ea, ez), sgn = KK.vdot(n, es) > 0 ? 1 : -1, d = [[xpf - dp, zc], [xpf, zc - dp], [xpf + dp, zc], [xpf, zc + dp]];
    for (const sg of [-1, 1]) {
      const s0 = sc + sg * (st - 0.3), s1 = sc + sg * (st + g + pd), lo2 = Math.min(s0, s1), hi2 = Math.max(s0, s1);
      const lug = KK.extrudeProfiles([{ pts: d, closed: true }], { o: [0, 0, 0], u: ea, v: ez, n }, sgn > 0 ? lo2 : -hi2, sgn > 0 ? hi2 : -lo2);
      fem = U(fem, KK.fixOrientation(lug));
    } }
  out[0] = link;
  out.unshift(fem);
  out.foldAxis = { Q, es, angle: (KK.vdot(KK.cross(es, ez), ea) > 0 ? -1 : 1) * Math.PI / 2 };
  return out;
}
/* joints along drawn cuts may be oblique (f.tilt: the turn of each joint's plane about the vertical, in degrees, paired
   with f.at): they are made one by one, each with the rest of the body turned so that its cut is square to the axis */
function articulateOblique(polys, f) {
  const a = f.axis === 'y' ? 1 : 0, s = 1 - a, bb = KK.bbox(polys), m = [0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2);
  /* along a curve (f.atS: the side position of each joint, in the curve's order) the joints may turn further */
  const lim = Array.isArray(f.atS) ? 80 : 60;
  let pairs = f.at.map((x, i) => [Number(x), Math.max(-lim, Math.min(lim, Number((f.tilt || [])[i]) || 0)), Array.isArray(f.atS) ? Number(f.atS[i]) : m[s]]).filter(p => p[0] > bb.min[a] + 1 && p[0] < bb.max[a] - 1);
  if (!Array.isArray(f.atS)) pairs = pairs.sort((p, q) => p[0] - q[0]);
  if (!pairs.length) throw new Error('Žádný z řezů neprotíná článkovanou část tělesa');
  const rotZ = (P, Q, deg) => { const t = deg * Math.PI / 180, c = Math.cos(t), sn = Math.sin(t); return KK.transform(P, [c, sn, 0, 0, -sn, c, 0, 0, 0, 0, 1, 0, Q[0] - c * Q[0] + sn * Q[1], Q[1] - sn * Q[0] - c * Q[1], 0, 1]); };
  const out = []; let rest = polys;
  for (const [x, t, sv] of pairs) {
    const Q = m.slice(); Q[a] = x; Q[s] = sv;
    const segs = articulateCore(rotZ(rest, Q, -t), { ...f, at: [x], tilt: undefined, atS: undefined, n: 1, near: Array.isArray(f.atS) ? Q : undefined });
    if (segs.length !== 2) throw new Error('Kloub se nepodařilo vytvořit');
    out.push(rotZ(segs[0], Q, t)); rest = rotZ(segs[1], Q, t);
  }
  out.push(rest);
  return out;
}
/* the FlexiJoint cutter with its flat faces rebuilt as whole polygons (the mesh had vertices inside them, which then
   stayed in the cut faces and folded when a neighbouring face was moved) */
let flexiCache = null;
const FLEXI_LOW = -7.7; /* the cup's lowest point below the cutter's centre: it is put 0.3 mm (scaled) under the bed, so the upright eye stands on the bed, coming out of the bottom wall */
function flexiTool() {
  if (flexiCache) return flexiCache;
  /* the flat disc is remade exactly (its own faces whole), only the middle (the cup, the ball's room and the holes the
     neck passes through, all within r 7.75) is taken from the mesh */
  const T = libPolys({ key: 'flexneg' }), h = 1.382, rc = 7.75;
  const cyl = (r, x0, x1) => cylAlong([x0, 0, 0], [1, 0, 0], r, x1 - x0);
  const disc = KK.boolean(cyl(16.99, -h, h), cyl(rc, -h - 1, h + 1), 'subtract'), mid = KK.boolean(T, cyl(rc, -10, 10), 'intersect');
  return (flexiCache = { disc, mid });
}
/* the separate shells of a solid (polygons joined through shared corners) */
function shellsOf(P) {
  const par = P.map((_, i) => i), find = i => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; }, seen = new Map();
  P.forEach((p, i) => p.v.forEach(q => { const k = KK.qk(q); if (seen.has(k)) par[find(i)] = find(seen.get(k)); else seen.set(k, i); }));
  const g = new Map(); P.forEach((p, i) => { const r = find(i); if (!g.has(r)) g.set(r, []); g.get(r).push(p); });
  return [...g.values()].filter(sh => KK.signedVolume(sh) > 1e-3);
}
/* the separate parts of a solid: its outer shells, each with the hollows (inner shells) that lie inside it; largest first */
function partsOf(P) {
  const par = P.map((_, i) => i), find = i => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; }, seen = new Map();
  P.forEach((p, i) => p.v.forEach(q => { const k = KK.qk(q); if (seen.has(k)) par[find(i)] = find(seen.get(k)); else seen.set(k, i); }));
  const g = new Map(); P.forEach((p, i) => { const r = find(i); if (!g.has(r)) g.set(r, []); g.get(r).push(p); });
  const all = [...g.values()].map(sh => ({ sh, v: KK.signedVolume(sh) })), outer = all.filter(x => x.v > 1e-3).sort((a, b) => b.v - a.v), inner = all.filter(x => x.v < -1e-3);
  if (outer.length <= 1) return [P];
  const parts = outer.map(x => ({ polys: x.sh.slice(), v: x.v, test: null }));
  for (const h of inner) {
    const q = h.sh[0].v[0];
    let best = null; for (const pt of parts) { pt.test = pt.test || insideTest(pt.polys); if (pt.test(q) && (!best || pt.v < best.v)) best = pt; }
    (best || parts[0]).polys.push(...h.sh);
  }
  return parts.map(x => x.polys);
}
/* a point-in-solid test by ray parity (one fixed skew direction) */
function insideTest(polys) {
  const dir = KK.vnorm([0.5773, 0.6131, 0.5401]), list = polys.map(p => ({ p, dn: KK.vdot(p.n, dir) }));
  return q => { let k = 0; for (const { p, dn } of list) { if (Math.abs(dn) < 1e-12) continue; const t = (p.w - KK.vdot(p.n, q)) / dn; if (t <= 1e-9) continue; if (KK.pointInConvex([q[0] + t * dir[0], q[1] + t * dir[1], q[2] + t * dir[2]], p, 1e-9)) k++; } return k % 2 === 1; };
}
function articulateCore(polys, f) {
  if (Array.isArray(f.at) && (Array.isArray(f.atS) || (Array.isArray(f.tilt) && f.tilt.some(t => Math.abs(Number(t) || 0) > 0.5)))) return articulateOblique(polys, f);
  const a = f.axis === 'y' ? 1 : 0, sAx = 1 - a, bb = KK.bbox(polys), g = Math.max(0.15, Number(f.gap) || 0.4);
  const L = bb.max[a] - bb.min[a], n = Math.max(1, Math.min(40, Math.round(Number(f.n) || 4))), th = Math.max(5, Math.min(60, Number(f.angle) || 30)) * Math.PI / 180;
  const BIG = 4 * Math.max(bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]) + 100;
  const box = (lo, hi) => KK.translate(KK.primitive('box', { w: hi[0] - lo[0], d: hi[1] - lo[1], h: hi[2] - lo[2] }), [0, 1, 2].map(k => (lo[k] + hi[k]) / 2));
  const C = [0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2);
  const span = (k, lo, hi) => { const l = C.map(v => v - BIG / 2), h = C.map(v => v + BIG / 2); l[k] = lo; h[k] = hi; return [l, h]; };
  const vcyl = (P, r, z0, z1) => cylAlong([P[0], P[1], z0], [0, 0, 1], r, z1 - z0);
  const rotAbout = (polysR, Pc, ax, ang) => { /* rotation about the line through Pc along unit vector ax */
    const [x, y, z] = ax, c = Math.cos(ang), sn = Math.sin(ang), t = 1 - c;
    const Rm = [[t * x * x + c, t * x * y - sn * z, t * x * z + sn * y], [t * x * y + sn * z, t * y * y + c, t * y * z - sn * x], [t * x * z - sn * y, t * y * z + sn * x, t * z * z + c]];
    const tr = [0, 1, 2].map(i => Pc[i] - (Rm[i][0] * Pc[0] + Rm[i][1] * Pc[1] + Rm[i][2] * Pc[2]));
    return KK.transform(polysR, [Rm[0][0], Rm[1][0], Rm[2][0], 0, Rm[0][1], Rm[1][1], Rm[2][1], 0, Rm[0][2], Rm[1][2], Rm[2][2], 0, tr[0], tr[1], tr[2], 1]);
  };
  const rotZ = (polysR, P, ang) => { const c = Math.cos(ang), sn = Math.sin(ang); return KK.transform(polysR, [c, sn, 0, 0, -sn, c, 0, 0, 0, 0, 1, 0, P[0] - c * P[0] + sn * P[1], P[1] - sn * P[0] - c * P[1], 0, 1]); };
  const at = Array.isArray(f.at) && f.at.length ? f.at.map(Number).filter(x => x > bb.min[a] + 1 && x < bb.max[a] - 1).sort((p, q) => p - q) : Array.from({ length: n }, (_, i) => bb.min[a] + L * (i + 1) / (n + 1));
  if (!at.length) throw new Error('Žádná z čar neprotíná článkovanou část tělesa');
  const out = []; let rest = polys;
  const I = (p, q) => KK.boolean(p, q, 'intersect'), U = (p, q) => KK.boolean(p, q, 'union'), S = (p, q) => KK.boolean(p, q, 'subtract');
  /* a box given per axis: [chain axis range], [side axis range], [z range] */
  const boxAS = (ar, sr, zr) => { const lo = [0, 0, 0], hi = [0, 0, 0]; lo[a] = ar[0]; hi[a] = ar[1]; lo[sAx] = sr[0]; hi[sAx] = sr[1]; lo[2] = zr[0]; hi[2] = zr[1]; return box(lo, hi); };
  const style = f.style || 'disc';
  /* room to swing: each segment keeps only a wedge of half-angle 90° − θ/2 around the chain axis at the joint (outside
     the knuckle), so the two can turn ±θ without touching */
  const ea = [0, 0, 0], es = [0, 0, 0]; ea[a] = 1; es[sAx] = 1;
  const XY = { o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] };
  const wedge = (P, dirSign, alpha) => {
    const pts = [[P[0], P[1]]], M = 24;
    for (let i = 0; i <= M; i++) {
      const ang = -alpha + 2 * alpha * i / M, u = Math.cos(ang) * dirSign * BIG, v = Math.sin(ang) * BIG;
      pts.push([P[0] + ea[0] * u + es[0] * v, P[1] + ea[1] * u + es[1] * v]);
    }
    if (KK.area2D(pts) < 0) pts.reverse();
    return KK.extrudeProfiles([{ pts, closed: true }], XY, KK.bbox(polys).min[2] - BIG, KK.bbox(polys).max[2] + BIG);
  };
  const alpha = Math.PI / 2 - th / 2 - 2 * Math.PI / 180;
  for (const xp of at) {
    const sec = f.near ? sectionNear(rest, a, xp, f.near) : sectionAt(rest, a, xp);
    if (!sec) throw new Error('Kloub mimo těleso');
    const sc = (sec.min[sAx] + sec.max[sAx]) / 2, zc = (sec.min[2] + sec.max[2]) / 2, zs = sec.max[2] - sec.min[2], hw = (sec.max[sAx] - sec.min[sAx]) / 2;
    const P = [0, 0, 0]; P[a] = xp; P[sAx] = sc;
    const z0 = zc - BIG / 2, z1 = zc + BIG / 2, far = BIG / 2;
    let A, B;
    if (style === 'flexi') {
      /* Flexi: the cutter of the FlexiJoint maker (js/partslib.js, flexneg) is taken away from the body at the joint: a
         thin disc (the gap between the segments) with a cup round a ball in its middle, so what is left is two segments
         held together by the ball in the cup, printed in one piece. The cutter stands across the chain at the joint,
         scaled to the section (up to 4×; its gaps grow with it); a body wider than its disc is cut
         through by a plain slab of the disc's thickness round it. The two parts are told apart by their shells. */
      const T0 = flexiTool(), core = 6.82, half = 1.382, disc = 16.99;
      /* it stands on the bed (the cup's bottom just under it, so the upright eye comes out of the bottom wall) when the
         cup fits the body there; on a round body (narrow at the bottom) it is lifted towards the middle, or made smaller */
      const inside = insideTest(rest), zb = sec.min[2], fitsAt = (s, tz) => {
        for (const [dx, r] of [[0, -FLEXI_LOW], [5, core], [-5, core]]) for (let i = 0; i < 24; i++) {
          const t = i / 24 * 2 * Math.PI, rr = r * s + 0.8, q = [0, 0, tz + rr * Math.sin(t)]; q[a] = xp + dx * s; q[sAx] = sc + rr * Math.cos(t);
          if (q[2] < zb + 0.05) continue; /* open to the bed on purpose */
          if (!inside(q)) return false;
        }
        return true;
      };
      let s = Math.min(4, (hw - 1) / 7.7, (zs - 1) / 15.4), tz = null;
      for (; s >= 0.35 && tz === null; s *= 0.94) {
        const low = zb - (FLEXI_LOW + 0.3) * s + (Number(f._flexiDz) || 0);
        for (const t of f.flexiBed === false ? [zc] : [low, (low + zc) / 2, zc]) if (fitsAt(s, t)) { tz = t; break; }
        if (tz !== null) break;
      }
      if (tz === null) throw new Error('Těleso je v místě kloubu na kloub Flexi příliš malé; použijte méně kloubů nebo jiný typ');
      if (Array.isArray(f._dbg)) f._dbg.push({ s, tz });
      const ez = [0, 0, 1], ey = KK.cross(ez, ea), M = [ea[0] * s, ea[1] * s, ea[2] * s, 0, ey[0] * s, ey[1] * s, ey[2] * s, 0, 0, 0, s, 0, P[0], P[1], tz, 1];
      const reach = Math.hypot(hw, Math.max(tz - sec.min[2], sec.max[2] - tz));
      let cut = S(S(rest, KK.transform(T0.disc, M)), KK.transform(T0.mid, M));
      if (reach > (disc - 0.6) * s) { /* the slab round the disc */
        const ring = S(boxAS([xp - half * s, xp + half * s], [sc - far, sc + far], [z0, z1]), cylAlong(P.map((v, k) => k === 2 ? tz : v - ea[k] * (half * s + 1)), ea, (disc - 0.5) * s, 2 * half * s + 2));
        cut = S(cut, ring);
      }
      const parts = shellsOf(cut), L = [], Rp = [];
      for (const sh of parts) { const b = KK.bbox(sh), m = (b.min[a] + b.max[a]) / 2; (m < xp ? L : Rp).push(...sh); }
      if (!L.length || !Rp.length) throw new Error('Kloub Flexi se nepodařilo vytvořit (díly se neoddělily)');
      A = KK.rebuildFaces(L); B = KK.rebuildFaces(Rp);
    } else if (style === 'ball') {
      /* Kulový: a ball on a neck of the left segment sits in a round socket of the right one, printed in place with a
         clearance all round, so the right segment turns about every axis (sideways, up and down, and twists). The
         socket's roof is a 45° tent, the ball has a small flat underside just above the socket's floor, the neck is a
         diamond (45° faces) and the mouth a cone, so it prints without supports; the mouth is narrower than the ball.
         The neck widens away from the ball (a diamond pyramid of half-angle nA about the ball's centre, its bottom ridge
         level), so it is thickest where it bends most; the mouth is the cone it sweeps (half-angle nA + swing), and nA
         is as large as keeps the mouth's rim on the socket narrower than the ball. Less swing → thicker neck. */
      /* the swing of a ball joint is held to 20°: the mouth must stay narrower than the ball while the neck sweeps it */
      const thB = Math.min(th, 20 * Math.PI / 180), dirA = ea.map(v => -v), sw = thB + Math.PI / 180;
      /* the socket (with a wall round it) must lie wholly inside the body: on a round body (cylinder, sphere) the section
         narrows away from its middle, so sizes and heights are tried, largest first, until the socket, its roof and the
         mouth on the face all keep inside */
      const inside = insideTest(rest), wall = 0.9;
      /* the neck's half-angle for a ball of radius rb: the largest (up to 40°) whose mouth rim on the socket stays within
         0.86 rb, so the ball cannot slip out */
      const neckAngle = rb => {
        const R = rb + g;
        for (let nA = 40; nA > 16; nA -= 0.5) {
          const be = nA * Math.PI / 180 + sw, del = g / Math.sin(be), rim = (R * Math.cos(be) + del) * Math.tan(be);
          if (rim <= 0.86 * rb) return nA * Math.PI / 180;
        }
        return 16 * Math.PI / 180;
      };
      const fits = (C, R, nA) => {
        const be = nA + sw, del = g / Math.sin(be), D = [];
        for (let i = 0; i < 16; i++) for (let j = 1; j < 8; j++) { const t = i / 16 * 2 * Math.PI, f2 = j / 8 * Math.PI, r = R + wall; D.push([r * Math.sin(f2) * Math.cos(t), r * Math.sin(f2) * Math.sin(t), r * Math.cos(f2)]); }
        D.push([0, 0, R * Math.SQRT2 + wall], [0, 0, -R - wall]);
        for (const d of D) { const q = [C[0] + d[0], C[1] + d[1], C[2] + d[2]]; if (!inside(q)) return false; }
        /* the mouth where it meets the face, and half-way to the socket */
        for (const xf of [xp + 0.05, (xp + C[a] - R) / 2]) {
          const rf = (del + C[a] - xf) * Math.tan(be) + wall;
          for (let i = 0; i < 16; i++) { const t = i / 16 * 2 * Math.PI, q = [0, 0, C[2] + rf * Math.sin(t)]; q[a] = xf; q[sAx] = sc + rf * Math.cos(t); if (!inside(q)) return false; }
        }
        return true;
      };
      let rb = Math.min(hw - g - 1.6, (zs - 2.4) / (1 + Math.SQRT2) - g, 12), R = 0, C = null;
      for (; rb >= 2 && !C; rb *= 0.93) {
        R = rb + g;
        for (const cz of [zc - (Math.SQRT2 - 1) * R / 2, sec.min[2] + 1.2 + R]) {
          const T = [0, 0, cz]; T[a] = xp + R + 1.2; T[sAx] = sc;
          if (fits(T, R, neckAngle(rb))) { C = T; break; }
        }
        if (C) break;
      }
      if (!C) throw new Error('Těleso je v místě kloubu na kulový kloub příliš malé; použijte méně kloubů nebo jiný typ');
      const nA = neckAngle(rb), be = nA + sw, rn = rb * Math.sin(nA);
      /* socket: sphere, 45° tent above it, a cone mouth towards the left segment */
      const tentH = R * Math.SQRT1_2;
      let sock = KK.translate(KK.primitive('sphere', { r: R }), C);
      sock = U(sock, KK.translate(KK.primitive('cone', { r: R * Math.SQRT1_2 + 0.01, rt: 0.01, h: tentH + 0.01 }), [C[0], C[1], C[2] + tentH + (tentH + 0.01) / 2]));
      /* the mouth: the cone the neck sweeps, i.e. of half-angle = swing, its apex moved back so the neck's thickness fits */
      const del = g / Math.sin(be), mouthLen = del + (C[a] - xp) + 2;
      const mouth = coneX(C.map((v, k) => v + ea[k] * del), dirA, 0.01, mouthLen * Math.tan(be), mouthLen);
      sock = U(sock, mouth);
      /* ball (flat underside near the floor) and the diamond neck back into the left segment */
      const ball = I(KK.translate(KK.primitive('sphere', { r: rb }), C), boxAS([C[a] - rb - 1, C[a] + rb + 1], [sc - rb - 1, sc + rb + 1], [C[2] - 0.92 * rb, C[2] + rb + 1]));
      const nLen = C[a] - (xp - g - Math.max(3, rb));
      /* cross-sections at distance t back from C: a diamond of half-diagonal w(t) = (0.95 t tan nA + rn) / 2 standing on
         the level ridge rn below C, so it keeps inside the cone of half-angle nA (and its faces at 45°) */
      const ez = [0, 0, 1], sec2 = t => { const w = (0.95 * t * Math.tan(nA) + rn) / 2, o = C.map((v, k) => v - ea[k] * t - ez[k] * rn);
        const at = (x, z) => o.map((v, k) => v + es[k] * x + ez[k] * z); return [at(0, 0), at(w, w), at(0, 2 * w), at(-w, w)]; };
      const n0 = sec2(rb * Math.cos(nA) * 0.85), n1 = sec2(nLen), fcs = [n0, n1.slice().reverse()];
      for (let i = 0; i < 4; i++) fcs.push([n0[i], n1[i], n1[(i + 1) % 4], n0[(i + 1) % 4]]);
      const neck = KK.fixOrientation(fcs.map(v => KK.mkPoly(v)).filter(Boolean));
      /* the left segment: everything up to the gap, opened in a V both ways about the ball's centre for the swing */
      /* the right segment's face turns about C (inside it): the left one keeps clear of every turned position of that face,
         i.e. behind the two planes tangent to the circle of radius (C − face) at ±(swing) – a V whose apex lies behind C */
      const th2 = thB + 2 * Math.PI / 180, al = Math.PI / 2 - th2, d = C[a] - xp + g, Q = C.slice(); Q[a] = C[a] - d / Math.cos(th2);
      const XZ = { o: [0, 0, 0], u: ea, v: [0, 0, 1], n: KK.cross(ea, [0, 0, 1]) };
      const wedgeV = () => { const pts = [[Q[a], Q[2]]], M = 24; for (let i = 0; i <= M; i++) { const t = -al + 2 * al * i / M; pts.push([Q[a] - Math.cos(t) * BIG, Q[2] + Math.sin(t) * BIG]); } if (KK.area2D(pts) < 0) pts.reverse(); const nv = KK.vdot(XZ.n, Q); return KK.extrudeProfiles([{ pts, closed: true }], XZ, nv - BIG, nv + BIG); };
      A = I(I(I(rest, boxAS([xp - far * 2, xp - g], [sc - far, sc + far], [z0, z1])), wedge(Q, -1, al)), KK.fixOrientation(wedgeV()));
      if (Array.isArray(f._dbg)) f._dbg.push({ body: A, neck: I(neck, rest), ball, C, rb, nA, rn, sock, be, del });
      A = U(U(A, I(neck, rest)), ball);
      B = S(I(rest, boxAS([xp, xp + far * 2], [sc - far, sc + far], [z0, z1])), sock);
    } else if (style === 'ring') {
      /* Očka (after the printed chain toys): two round rings interlocked like chain links at right angles; each passes
         through the other's centre. The left segment's ring A leans back 40° (its plane holds the axis across), the
         right segment's ring B stands upright along the chain, its bottom flattened on the bed; on flat straps that
         are too low for that, A lies flat instead. The right segment turns about A's axis through A's centre PA (bends
         sideways) and about the axis across through B's centre PB (bends up and down); both turns spin the rings within
         themselves, so only the bodies' faces limit the swing. The cut-outs are as on the toys, all faces at 45° or
         steeper: a V notch in the front of the left segment along A's axis, where B passes, and a V groove across the
         back of the right segment, where A passes. */
      const zmin = sec.min[2], ez = [0, 0, 1];
      /* the rings must stay inside the body (a round body is narrower near its top and bottom): candidate layouts are
         tried, largest first, and the first whose rings (with a 0.3 mm wall) lie wholly inside the body is taken */
      const inside = (() => {
        const dir = KK.vnorm([0.5773, 0.6131, 0.5401]), list = rest.map(p => ({ p, dn: KK.vdot(p.n, dir) }));
        return q => { let k = 0; for (const { p, dn } of list) { if (Math.abs(dn) < 1e-12) continue; const t = (p.w - KK.vdot(p.n, q)) / dn; if (t <= 1e-9) continue; if (KK.pointInConvex([q[0] + t * dir[0], q[1] + t * dir[1], q[2] + t * dir[2]], p, 1e-9)) k++; } return k % 2 === 1; };
      })();
      const ringFits = (P, ax, R, r) => {
        const b1 = Math.abs(ax[2]) > 0.9 ? KK.vnorm(KK.cross(ax, [1, 0, 0])) : KK.vnorm(KK.cross(ax, [0, 0, 1])), b2 = KK.cross(ax, b1), m = r + 0.3;
        for (let i = 0; i < 36; i++) for (let j = 0; j < 8; j++) {
          const f1 = i / 36 * 2 * Math.PI, f2 = j / 8 * 2 * Math.PI, rr = R + m * Math.cos(f2);
          const q = [0, 1, 2].map(k => P[k] + rr * (Math.cos(f1) * b1[k] + Math.sin(f1) * b2[k]) + m * Math.sin(f2) * ax[k]);
          if (q[2] < zmin + 0.05) continue; /* the bed flattens it there */
          if (!inside(q)) return false;
        }
        return true;
      };
      const layout = (lean, r, mid) => {
        const R = 2 * r + g + 0.3, be = lean ? 40 * Math.PI / 180 : 0;
        const u = [0, 1, 2].map(k => ea[k] * Math.cos(be) + ez[k] * Math.sin(be)), e1 = [0, 1, 2].map(k => ez[k] * Math.cos(be) - ea[k] * Math.sin(be));
        let zb = zmin + R + (lean ? 0.5 : 1) * r;
        if (mid) { /* the pair centred on the section's height (for round bodies) */
          const top = R + r, lo = Math.min(-(R + r), -2 * R * Math.sin(be) - r); /* B round PB; A lies lower by R sin 40° */
          zb = zc - (top + lo) / 2;
        }
        const PB = [0, 0, zb]; PB[a] = xp + R * Math.cos(be) / 2; PB[sAx] = sc;
        const PA = PB.map((v, k) => v - R * u[k]);
        return { R, r, be, u, e1, PA, PB };
      };
      let L = null;
      const r0 = Math.min((hw - g - 0.6) / 3, (zs - 2 * g - 0.6) / 5.5, 2.2), r1 = Math.min((hw - 2 * g - 1.1) / 3, (zs / 2 - g - 0.3) / 3, 2.2);
      /* first with the standing ring on the bed (as on the toys), only then lifted to the widest height */
      for (const mid of [false, true]) {
        for (const [lean, rmax] of [[true, r0], [false, r1]]) {
          for (let rt = rmax; !L && rt >= 0.7; rt *= 0.88) {
            const T = layout(lean, rt, mid);
            if (ringFits(T.PA, T.e1, T.R, rt) && ringFits(T.PB, es, T.R, rt)) L = T;
          }
          if (L) break;
        }
        if (L) break;
      }
      if (!L) throw new Error('Těleso je v místě kloubu na očka příliš malé; použijte méně kloubů nebo jiný typ');
      const { R, r, be, u, e1, PA, PB } = L, e2 = es, cl = r + g + 0.4;
      if (Array.isArray(f._dbg)) f._dbg.push(L);
      const toAxis = (P, ax) => { /* a torus about axis ax */
        const t = KK.primitive('torus', { R, t: r }), c = KK.cross([0, 0, 1], ax), sn = Math.hypot(...c), cs = ax[2];
        return KK.translate(sn < 1e-9 ? t : rotAbout(t, [0, 0, 0], c.map(v => v / sn), Math.atan2(sn, cs)), P);
      };
      const bed = boxAS([xp - far, xp + far], [sc - far, sc + far], [zmin, z1]);
      const ringA = I(toAxis(PA, e1), bed), ringB = I(toAxis(PB, e2), bed);
      const frame = (ax, dir) => ({ o: [0, 0, 0], u: dir, v: KK.cross(ax, dir), n: ax });
      const prism = (B0, Q, pts, h) => { /* a prism of a 2D outline around Q in frame B0, h along its normal both ways */
        const qu = KK.vdot(Q, B0.u), qv = KK.vdot(Q, B0.v), qn = KK.vdot(Q, B0.n), P2 = pts.map(([x, y]) => [qu + x, qv + y]);
        return KK.extrudeProfiles([{ pts: KK.area2D(P2) < 0 ? P2.reverse() : P2, closed: true }], B0, qn - h, qn + h);
      };
      const wedgeAx = (Q, ax, dirSign) => { /* keeps the side dirSign within ±alpha of the chain, about axis ax */
        const pts = [[0, 0]], M = 24;
        for (let i = 0; i <= M; i++) { const t = -alpha + 2 * alpha * i / M; pts.push([Math.cos(t) * dirSign * BIG, Math.sin(t) * BIG]); }
        return prism(frame(ax, ea), Q, pts, BIG); /* the gap's bisector runs along the chain (level), not along u */
      };
      const V = (B0, Q, dist, open, h) => prism(B0, Q, [[-dist * open, 0], [-dist * open + open * BIG, BIG], [-dist * open + open * BIG, -BIG]], h);
      /* the left segment's front is upright (as on the toys): ring B reaches back past PA by R(1 − cos 40°) at most */
      const back = R * (1 - Math.cos(be)), PF = PA.slice(); PF[a] -= back;
      const notch = V(frame(ez, ea), PF, cl * Math.SQRT2, 1, BIG);       /* apex behind PA, open forwards, upright */
      const groove = V(frame(es, ea), PB, cl * Math.SQRT2, -1, R + r + g + 0.5); /* apex ahead of PB, open backwards */
      A = I(I(I(rest, boxAS([xp - far * 2, xp], [sc - far, sc + far], [z0, z1])), wedgeAx(PF, ez, -1)), wedgeAx(PB, e2, -1));
      A = U(S(A, notch), ringA);
      B = I(I(I(rest, boxAS([xp, xp + far * 2], [sc - far, sc + far], [z0, z1])), wedgeAx(PF, ez, 1)), wedgeAx(PB, e2, 1));
      B = U(S(B, groove), ringB);
    } else if (style === 'chain') {
      /* two interlocked eyes, like chain links printed flat: an upright ring of the left segment along the chain and an
         upright ring of the right segment across it, alternating orientation. Every bar that closes a ring is a short
         bridge between two posts standing on the bed, and the ring of the right segment is lifted over the bottom bar of
         the left one, so nothing hangs in the air and nothing touches. Heights: 4 bars and 3 gaps fill the section. */
      const zb = sec.min[2], w = Math.max(1, Math.min(3.5, (zs * 0.92 - 3 * g) / 4)), t = w;
      const zbb = zb + w + g, zA1 = zbb + 2 * w + g, zb1 = zA1 + g + w;
      /* room for the swing: the left eye is long enough for the crossing eye to tilt either way, and the posts of the
         crossing eye stand far enough apart for the left eye's end to swing between them */
      const tb = w; let SI = 0, SO = 0, e = 0, aR1 = 0;
      for (let tc = Math.min(th, 25 * Math.PI / 180); ; tc -= 2.5 * Math.PI / 180) { /* less swing on a narrow body */
        const sn = Math.sin(Math.max(0, tc)); SI = t / 2 + g + 0.3; SO = SI + w;
        for (let it = 0; it < 3; it++) { e = SO * sn; aR1 = xp + tb / 2 + g + e + w; SI = t / 2 + g + 0.3 + (aR1 - xp) * sn; SO = SI + w; }
        if (SO <= hw || tc <= 0) break;
      }
      if (w < 1 || SO > hw || zb1 > sec.max[2] + 1e-6) throw new Error('Těleso je v místě kloubu na očka příliš malé; použijte méně kloubů, jiný typ nebo menší natočení');
      const aA = xp - tb / 2 - g - e, aB = aR1 + g, fr = w * 0.9;
      /* a rounded ring in a plane: outer and inner rounded rectangles, extruded by its thickness */
      const ring = (Bp, ox, oy, ow, oh, ix, iy, iw, ih, d0, d1) => {
        const outer = KK.extrudeProfiles([{ pts: KK.profilePoints({ t: 'rect', x: ox, y: oy, w: ow, h: oh, fr }), closed: true }], Bp, d0, d1);
        const inner = KK.extrudeProfiles([{ pts: KK.profilePoints({ t: 'rect', x: ix, y: iy, w: iw, h: ih, fr: Math.min(fr * 0.5, iw / 3, ih / 3) }), closed: true }], Bp, d0 - 1, d1 + 1);
        return S(outer, inner);
      };
      const ea = [0, 0, 0], es = [0, 0, 0], ez = [0, 0, 1]; ea[a] = 1; es[sAx] = 1;
      /* left eye: in the plane along the chain (u = chain axis, v = up), thickness t across */
      const nA = KK.cross(ea, ez), oA = [0, 0, 0]; oA[sAx] = sc; const BA = { o: oA, u: ea, v: ez, n: nA };
      const eyeA = ring(BA, aA - 1.5, zb, aR1 - aA + 1.5, zA1 - zb, aA, zb + w, aR1 - w - aA, zA1 - zb - 2 * w, -t / 2, t / 2);
      /* right eye: in the plane across the chain (u = side axis, v = up), lifted bottom bar, open below it */
      const nB = KK.cross(es, ez), oB = [0, 0, 0]; oB[a] = xp; const BB = { o: oB, u: es, v: ez, n: nB };
      let eyeB = ring(BB, sc - SO, zb, 2 * SO, zb1 - zb, sc - SI, zbb + w, 2 * SI, zb1 - w - zbb - w, -tb / 2, tb / 2);
      eyeB = S(eyeB, boxAS([xp - tb, xp + tb], [sc - SI, sc + SI], [zb - 1, zbb]));
      /* its two posts run back to the right segment */
      for (const sg of [-1, 1]) eyeB = U(eyeB, boxAS([xp, aB + 1], sg < 0 ? [sc - SO, sc - SI] : [sc + SI, sc + SO], [zb, zb1 - fr]));
      A = U(I(I(rest, boxAS([xp - far * 2, aA], [sc - far, sc + far], [z0, z1])), wedge(P, -1, alpha)), eyeA);
      B = U(I(I(rest, boxAS([aB, xp + far * 2], [sc - far, sc + far], [z0, z1])), wedge(P, 1, alpha)), eyeB);
    } else if (style === 'flex') {
      /* bends up and down (about a horizontal axis across the chain), like a watch strap: the right segment ends in a
         tongue between two arms of the left one; diamond lugs on the tongue's sides sit in V grooves inside the arms
         (all faces at 45°, so it prints flat without supports). Seen from the side both ends are round about the axis. */
      /* the round ends reach past the grooves by a solid wall, which is what keeps the joint from pulling apart */
      const zcc = zc, hz = zs / 2, dp0 = Math.max(0.8, Math.min(hz * 0.6, 2)), Rr = Math.max(hz, dp0 + g * 1.42 + 1.2), wa = Math.max(1.6, Math.min(3, hw * 0.22)), st = hw - wa - g;
      if (st < 1.5 || zs < 2.4) throw new Error('Těleso je v místě kloubu na ohybový kloub příliš malé; použijte méně kloubů');
      const Q = P.slice(); Q[2] = zcc;
      const along = (r) => { const o = Q.slice(); o[sAx] -= BIG / 2; return cylAlong(o, es, r, BIG); };
      const cylR = along(Rr), cylG = along(Rr + g);
      const halfA = boxAS([xp - far * 2, xp - g / 2], [sc - far, sc + far], [z0, z1]), halfB = boxAS([xp + g / 2, xp + far * 2], [sc - far, sc + far], [z0, z1]);
      const inner = boxAS([xp - far, xp + far], [sc - st, sc + st], [z0, z1]);
      const outer = S(boxAS([xp - far, xp + far], [sc - far, sc + far], [z0, z1]), boxAS([xp - far, xp + far], [sc - st - g, sc + st + g], [z0, z1]));
      A = I(rest, U(S(halfA, cylG), I(U(cylR, I(cylG, halfA)), outer)));
      B = I(rest, U(S(halfB, cylG), I(U(cylR, I(cylG, halfB)), inner)));
      /* cone lugs on the tongue's sides sit in conical seats in the arms: round about the axis, so the joint turns
         smoothly through any angle, and every face is at 45°, so it prints flat without supports. Printed in parts
         (f.snap) the lugs are lower and a shallow channel leads from the arms' front ends to the seats: the tongue is
         pushed in between the arms, which spread a little until the cones click into their seats. */
      const rb = Math.min(dp0 + 0.2, hz - g * 1.42 - 0.25), rs = rb + g * Math.SQRT2;
      const pd = Math.min(f.snap ? Math.min(0.8, wa * 0.4) : Math.min(wa * 0.55, 1.4), rb - g - 0.2);
      if (pd < 0.35) throw new Error('Těleso je v místě kloubu na ohybový kloub příliš malé; použijte méně kloubů');
      for (const sg of [-1, 1]) {
        const at = s0 => { const o = Q.slice(); o[sAx] = sc + sg * s0; return o; }, dir = es.map(v => v * sg);
        B = U(B, coneX(at(st - 0.3), dir, rb + 0.3, rb - g - pd, 0.3 + g + pd));
        A = S(A, coneX(at(st - 0.01), dir, rs + 0.01, rs - 2 * g - pd, 2 * g + pd + 0.01));
        if (f.snap) { /* lead-in channel, half as deep as the seat */
          const s0 = st + g - 0.01, s1 = st + g + pd / 2;
          A = S(A, boxAS([xp, xp + Rr + g + 2], sg < 0 ? [sc - s1, sc - s0] : [sc + s0, sc + s1], [zcc - rs, zcc + rs]));
        }
      }
    } else if (style === 'hinge') {
      /* a pin hinge with an upright axis, three knuckles (odd count, no axial play): the left segment holds the top and
         bottom knuckles joined by a pin through the middle knuckle of the right segment. The pin and its bore stand
         upright, so they are round in every layer; the top knuckle bridges between the pin and its segment. */
      const Rk = hw * 0.92, T = zs * 0.34, zl = zc - T / 2, zu = zc + T / 2;
      if (Rk < 2 * g + 2 || zs < 6 * g + 2) throw new Error('Těleso je v místě kloubu na kloub příliš tenké; použijte méně kloubů');
      const cylR = vcyl(P, Rk, z0, z1), cylG = vcyl(P, Rk + g, z0, z1);
      const halfA = boxAS([xp - far * 2, xp - g / 2], [sc - far, sc + far], [z0, z1]), halfB = boxAS([xp + g / 2, xp + far * 2], [sc - far, sc + far], [z0, z1]);
      const below = boxAS([xp - far, xp + far], [sc - far, sc + far], [z0, zl - g]), above = boxAS([xp - far, xp + far], [sc - far, sc + far], [zu + g, z1]);
      const mid = boxAS([xp - far, xp + far], [sc - far, sc + far], [zl, zu]);
      const rp = Math.max(1, Math.min(Rk * 0.38, 3));
      const knA = I(rest, I(U(cylR, I(cylG, halfA)), U(below, above)));
      A = U(U(I(rest, S(halfA, cylG)), knA), vcyl(P, rp, zl - g - 0.5, zu + g + 0.5));
      B = U(I(rest, S(halfB, cylG)), I(rest, I(U(cylR, I(cylG, halfB)), mid)));
      B = S(B, vcyl(P, rp + g, zl - 1, zu + 1));
    } else {
      const Rk = hw * 0.92;
      if (Rk < 2 * g + 1.5 || zs < 6 * g + 1.5) throw new Error('Těleso je v místě kloubu na kloub příliš tenké; použijte méně kloubů');
      /* the neck must stay narrower than the mouth the disc would need to slip out, at full swing too */
      /* (on a thin body the swing is reduced as needed rather than giving up) */
      const T = zs * 0.34, rd = Rk * 0.6, thd = Math.min(th, Math.asin(Math.max(0.05, Math.min(1, (1.7 * rd - 2 * g - 1) / (2 * rd)))));
      const wn = Math.min(rd * 0.9, 1.7 * rd - 2 * rd * Math.sin(thd) - 2 * g);
      if (wn < 0.8) throw new Error('Těleso je v místě kloubu na kloub příliš tenké; použijte méně kloubů');
      const [la, ha] = span(a, xp - BIG, xp);
      const halfA = box(la, ha);
      A = S(I(rest, halfA), vcyl(P, Rk + g, z0, z1));
      B = S(rest, S(halfA, vcyl(P, Rk, z0, z1)));
      /* tongue of A: disc around the axis on a neck towards A, in the middle of the height */
      const neckLo = [0, 0, 0], neckHi = [0, 0, 0];
      neckLo[a] = xp - Rk - g - 2; neckHi[a] = xp; neckLo[sAx] = sc - wn / 2; neckHi[sAx] = sc + wn / 2; neckLo[2] = zc - T / 2; neckHi[2] = zc + T / 2;
      const tongue = I(U(vcyl(P, rd, zc - T / 2, zc + T / 2), box(neckLo, neckHi)), rest);
      A = U(A, tongue);
      /* slot in B's knuckle: the disc with clearance plus the room the neck sweeps when the joint turns */
      const sLo = neckLo.slice(), sHi = neckHi.slice(); sLo[a] = xp - Rk - 1; sLo[sAx] -= g; sHi[sAx] += g; sLo[2] -= g; sHi[2] += g; sHi[a] = xp;
      let slot = vcyl(P, rd + g, zc - T / 2 - g, zc + T / 2 + g);
      const steps = Math.max(2, Math.ceil(thd / (10 * Math.PI / 180)));
      for (let i = -steps; i <= steps; i++) slot = U(slot, rotZ(box(sLo, sHi), P, thd * i / steps));
      B = S(B, slot);
    }
    if (style === 'disc' || style === 'hinge') {
      /* the room to swing is cut from the left segment only (a V of the full swing), so the right one keeps a whole
         face: no small slivers are trimmed off the sides of a round body next to the knuckle */
      /* the V is cut away (outside the knuckle) rather than the segment rebuilt from two pieces: rebuilding left seams
         across the body's surface, which showed as dark streaks on round bodies */
      const keep = vcyl(P, hw * 0.92 + g, z0, z1), cutV = (sg, al) => S(wedge(P, sg, Math.PI - al), keep);
      A = S(A, cutV(1, Math.PI / 2 - th - 2 * Math.PI / 180));
    } else if (style !== 'chain' && style !== 'flex' && style !== 'ball' && style !== 'flexi') {
      const keep = vcyl(P, hw * 0.92 + g, z0, z1), cutV = (sg, al) => S(wedge(P, sg, Math.PI - al), keep);
      A = S(A, cutV(1, alpha));
      B = S(B, cutV(-1, alpha));
    }
    if (!A.length || !B.length) throw new Error('Kloub se nepodařilo vytvořit');
    out.push(A); rest = B;
  }
  out.push(rest);
  return out;
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
      if (f.kind === 'closed') { R = closedHingeResult(f, bx.polys, ld.polys); if (!R.pinMode) fold = R.U; swing = { M: R.U, open: !R.pinMode, lift: R.T.lift, play: R.T.H.c, zp: R.T.zRim !== undefined ? R.T.zRim : KK.bbox(bx.polys).max[2], max: R.maxAngle || 180 }; }
      else { const T = boxHingeTools(f, bx.polys, ld.polys); R = applyBoxHinge(T, bx.polys, ld.polys, f.out === 'new'); fold = T.fold; swing = { M: T.fold, open: true, lift: T.lift, play: T.H.c, zp: T.zRim }; }
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
    case 'libpart': {
      const name = LIB_PARTS[f.part] || 'Díl';
      if (f.part === 'two') /* the two links come as two bodies, hooked into each other */
        out = bodies.concat(['two_a', 'two_b'].map((key, i) => ({ id: f.id + (i ? '_' + i : ''), name: 'Článek ' + (i + 1), polys: libPolys({ ...f, key }), from: f.id })));
      else out = bodies.concat([{ id: f.id, name, polys: libPolys(f), from: f.id }]);
      break;
    }
    case 'jointpart': {
      const name = JOINT_PARTS[f.style] || JOINT_PARTS.disc;
      out = bodies.concat(jointParts(f).map((polys, i) => ({ id: f.id + (i ? '_' + i : ''), name: name + ' – díl ' + (i + 1), polys, from: f.id })));
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
          /* copies apart from everything joined so far are only added (no boolean); one that may touch is joined just
             with the pieces whose boxes it meets – many small copies (ribs round a cylinder) join quickly */
          const ov = (p, q) => [0, 1, 2].every(k => p.min[k] <= q.max[k] + 1e-6 && q.min[k] <= p.max[k] + 1e-6);
          let pieces = [{ p: b.polys, bb: KK.bbox(b.polys) }];
          for (const c of copies) {
            const cb = KK.bbox(c), hit = pieces.filter(x => ov(x.bb, cb));
            if (!hit.length) { pieces.push({ p: c, bb: cb }); continue; }
            let m = c; for (const x of hit) m = KK.boolean(m, x.p, 'union');
            pieces = pieces.filter(x => !hit.includes(x)); pieces.push({ p: m, bb: KK.bbox(m) });
          }
          const acc = pieces.length === 1 ? pieces[0].p : [].concat(...pieces.map(x => x.p));
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
      /* Jako nové těleso: the result is added as a body of its own and the target and the tools all stay as they were */
      /* Rozdělit na samostatné díly: each separate piece of the result (e.g. the two segments left by a joint cutter) becomes a
         body of its own; the first (largest) keeps the target's place unless the result is a new body */
      const pieces = f.separate && acc.length ? partsOf(acc) : [acc];
      const extra = (k0) => pieces.slice(k0).map((polys, k) => ({ id: f.id + '_' + (k + k0), name: (t.name || 'Těleso') + ' – díl ' + (k + k0 + 1), polys, from: f.id }));
      if (f.asNew) {
        if (!acc.length) throw new Error('Výsledek kombinace je prázdný (tělesa se nepřekrývají)');
        out = bodies.concat(pieces.length > 1 ? extra(0) : [{ id: f.id, name: 'Těleso ' + (++n), polys: acc, from: f.id }]);
        break;
      }
      const drop = f.keep ? new Set() : new Set(tools.map(x => x.id));
      out = bodies.filter(x => !drop.has(x.id)).map(x => (x === t ? { ...x, polys: pieces[0] } : x)).filter(x => x.polys.length).concat(pieces.length > 1 ? extra(1) : []);
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
      /* pc: the scaling centre as it was when the step was made, so a later edit of an earlier step (a longer text) does not
         move the scaled bodies; older documents work it out from the bodies again */
      const c = f.pc ? f.pc.map(Number) : f.pivot === 'origin' ? [0, 0, 0] : f.pivot === 'base' ? [mid[0], mid[1], bb.min[2]] : mid;
      const m = [s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, c[0] * (1 - s[0]), c[1] * (1 - s[1]), c[2] * (1 - s[2]), 1];
      const map = new Map(sel.map(x => [x.id, xfBody(x, m)]));
      out = bodies.map(x => map.get(x.id) || x);
      break;
    }
    case 'hole':
      out = applyTool(bodies, { ...f, op: 'cut' }, toolForHole(f, bodies), newBody); break;
    case 'text3d':
      out = applyTool(bodies, f, toolForText(f), polys => ({ id: f.id, name: 'Text ' + (++n), polys, from: f.id })); break;
    case 'shell': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      out = bodies.map(x => (x === b ? { ...x, polys: shellBody(b.polys, f) } : x));
      break;
    }
    case 'movefaces': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      out = bodies.map(x => (x === b ? { ...x, polys: moveFaces(b.polys, f) } : x));
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
      /* pc: the pivot as it was when the step was made (older documents: worked out from the bodies again) */
      const c = f.pc ? f.pc.map(Number) : f.pivot === 'origin' ? [0, 0, 0] : [0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2);
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
      const all = sel.flatMap(x => x.polys), bb = KK.bbox(all), c = f.pc ? f.pc.map(Number) : [0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2);
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
    case 'ribs': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      const tool = ribsTool(b.polys, f);
      if (!tool.length) throw new Error('Žebra se nepodařilo vytvořit');
      /* Nové těleso: the ribs on their own (still sunk 0.4 mm into the face), to deform them before joining them on */
      if (f.op === 'new') { out = bodies.concat([{ id: f.id, name: 'Žebra ' + (bodies.filter(x => /^Žebra \d+$/.test(x.name)).length + 1), polys: tool, from: f.id }]); break; }
      const res = KK.boolean(b.polys, tool, f.op === 'cut' ? 'subtract' : 'union');
      if (!res.length) throw new Error('Žebra se nepodařilo vytvořit');
      out = bodies.map(x => (x === b ? { ...x, polys: res } : x));
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
      const q = { n: f.n.map(Number), w: Number(f.w), a: f.a.map(Number), b: f.b.map(Number), ...(Array.isArray(f.pts) && f.pts.length >= 2 ? { pts: f.pts.map(p => p.map(Number)), closed: !!f.closed } : {}) }, d = KK.vsub(q.b, q.a);
      if (KK.vdot(d, d) < 1e-8) throw new Error('Body dělicí čáry splývají');
      const g = seamPatch(b.polys, q);
      if (!g) throw new Error('Plocha nebyla nalezena');
      const h = q.pts ? { poly: curveRegion(q), n: q.n } : seamPlane(q), A = clipRegion(b.polys, g, [h]), B = clipRegion(b.polys, g, [q.pts ? { ...h, out: true } : { m: KK.vmul(h.m, -1), d: -h.d }]);
      if (KK.surfaceArea(A) < 1e-4 || KK.surfaceArea(B) < 1e-4) throw new Error('Čára plochu nerozdělí, musí plochou procházet');
      out = bodies.map(x => (x === b ? { ...x, seams: (x.seams || []).concat([q]) } : x));
      break;
    }
    case 'blob':
      out = applyTool(bodies, f, blobTool(f), polys => ({ id: f.id, name: 'Postavička ' + (++n), polys, from: f.id })); break;
    case 'skin':
      out = applyTool(bodies, f, skinTool(f), polys => ({ id: f.id, name: 'Kostra ' + (++n), polys, from: f.id })); break;
    case 'sweep':
      out = applyTool(bodies, f, sweepTool(f, sketches), newBody); break;
    case 'loft':
      out = applyTool(bodies, f, loftTool(f, sketches), newBody); break;
    case 'deform': case 'lattice': case 'softmove': case 'subdiv': case 'remesh': case 'sculpt': case 'hollow': case 'flatbase': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      const polys = orgModify(b.polys, f);
      out = bodies.map(x => (x === b ? { ...x, polys, seams: undefined } : x));
      break;
    }
    case 'articulate': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      const segs = articulate(b.polys, f), base = b.name || 'Těleso';
      out = bodies.map(x => (x === b ? { ...x, polys: segs[0], name: base + ' – článek 1', seams: undefined } : x))
        .concat(segs.slice(1).map((p, i) => ({ id: f.id + (i ? '_' + i : ''), name: base + ' – článek ' + (i + 2), polys: p, from: f.id })));
      break;
    }
    case 'buckle': {
      const B = buckleParts(f), p0 = (f.pos || [0, 0, 0]).map(Number);
      out = bodies.concat([{ id: f.id, name: 'Spona – samice', polys: KK.translate(B.female, [p0[0], p0[1] - B.Wf / 2 - 3, p0[2]]), from: f.id },
        { id: f.id + '_m', name: 'Spona – samec', polys: KK.translate(B.male, [p0[0], p0[1] + B.Wf / 2 + 3, p0[2]]), from: f.id }]);
      break;
    }
    case 'curvecut': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      const r = curveCut(b.polys, f);
      out = bodies.map(x => (x === b ? { ...x, polys: r.a, seams: undefined } : x)).concat([{ id: f.id, name: (b.name || 'Těleso') + ' – druhý díl', polys: r.b, from: f.id }]);
      break;
    }
    case 'pegsplit': {
      const b = bodies.find(x => x.id === f.body);
      if (!b) throw new Error('Těleso neexistuje');
      const r = pegSplit(b.polys, f), added = [{ id: f.id, name: (b.name || 'Těleso') + ' – horní díl', polys: r.upper, from: f.id }];
      r.extra.forEach((p, i) => added.push({ id: f.id + '_k' + (i + 1), name: p.name + (r.extra.length > 1 ? ' ' + (i + 1) : ''), polys: p.polys, from: f.id }));
      /* loose pegs lie beside the model */
      const bb = KK.bbox(b.polys); let x = bb.max[0] + 6;
      for (const q of added.slice(1)) { const pb = KK.bbox(q.polys); q.polys = KK.translate(q.polys, [x - pb.min[0], bb.min[1] - pb.min[1], -pb.min[2] + bb.min[2]]); x += (pb.max[0] - pb.min[0]) + 4; }
      out = bodies.map(x => (x === b ? { ...x, polys: r.lower, seams: undefined } : x)).concat(added);
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

return { ribsTool, curveRegion, inPoly3, LIB_PARTS, libPolys, JOINT_PARTS, jointParts, curveCut, tongueParts, buckleParts, articulate, orgModify, pegSplit, blobTool, skinTool, sweepTool, loftTool, sketchCurves, sketchRegion, mirrorElements, bendFaceTool, halfSpace, cutTool, faceClip, clipRegion, seamSegments, seamPlane, FASTENERS, THIN_NUT, SCREW_HEADS: { slotted: SLOT_HEADS, phillips: PAN_HEADS }, toolForFastener, toolForHinge, toolForText, xformMatrix, latchTools, latchApply, latchLen, hingeDims, boxHingeTools, closedHingeTools, closedHingeResult, applyBoxHinge, CLOSED_PINS, toolForHole, HOLE_CLEAR, HOLE_CBORE, HOLE_CSINK, shellBody, offsetFace, offsetFaceTool, moveFaces, basisFromPlane, THREADS, suggestThread, threadTool, setBlobResolver: fn => { blobResolver = fn; blobCache.clear(); }, toolForRevolve, importPolys, revolveAxis, PLANES, FEATURE_LABEL, regions, closedLoops, describe, matchEdge, step, makeRebuilder, toolForExtrude, toolForPrimitive, eulerMatrix, overlaps };
})();




