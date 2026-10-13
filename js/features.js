/* Kóta feature engine: replays the timeline (feature list) into bodies. Pure JS on top of K. */
const Engine = (() => {
'use strict';
const KK = (typeof K !== 'undefined') ? K : require('./kernel.js');
const PLANES = {
  XY: { o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] },
  XZ: { o: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], n: [0, -1, 0] },
  YZ: { o: [0, 0, 0], u: [0, 1, 0], v: [0, 0, 1], n: [1, 0, 0] }
};
const FEATURE_LABEL = { sketch: 'Skica', extrude: 'Vysunutí', revolve: 'Rotace', box: 'Krychle', cylinder: 'Válec', sphere: 'Koule', cone: 'Kužel', torus: 'Torus',
  fillet: 'Zaoblení', chamfer: 'Zkosení', combine: 'Kombinovat', move: 'Přesunout', rotate: 'Otočit', center: 'Zarovnat', offsetface: 'Upravit plochu', thread: 'Závit', scale: 'Měřítko', mirror: 'Zrcadlit', pattern: 'Pole', import: 'Import', del: 'Odstranit těleso' };
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
  });
  return out;
}
function regions(sk) {
  const L = closedLoops(sk).map(l => ({ ...l, a: Math.abs(KK.area2D(l.pts)) }));
  L.forEach(A => { A.parents = L.filter(B => B !== A && B.a > A.a && A.pts.every(p => KK.inPoly2D(p, B.pts))).sort((s, t) => s.a - t.a); });
  return L.map(A => ({ ei: A.ei, pts: A.pts, holes: L.filter(C => C.parents[0] === A).map(C => ({ ei: C.ei, pts: C.pts })) }));
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
    const r = regs.find(x => x.ei === ei); if (!r) continue;
    const solid = KK.extrudeProfiles([{ t: 'poly', pts: r.pts }, ...r.holes.map(h => ({ t: 'poly', pts: h.pts }))], B, z0, z1);
    tool = tool.length ? KK.boolean(tool, solid, 'union') : solid;
  }
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
    const r = regs.find(x => x.ei === ei); if (!r) continue;
    const solid = KK.revolveProfiles([{ t: 'poly', pts: r.pts }, ...r.holes.map(h => ({ t: 'poly', pts: h.pts }))], sk.plane, ax, Math.max(-360, Math.min(360, ang)) * Math.PI / 180);
    tool = tool.length ? KK.boolean(tool, solid, 'union') : solid;
  }
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
  let sp;
  if (f.internal) {
    sp = { rConst: inner - 0.05, rCrest: r + 0.02, rRoot: d / 2, crestF: 0.25, rootF: 0.125 };
    if (sp.rRoot < sp.rCrest + 0.02) throw new Error('Díra je pro zvolenou velikost závitu příliš velká');
  } else {
    sp = { rConst: r + 0.05, rCrest: inner - 0.02, rRoot: d / 2 - 0.6134 * P, crestF: 0.125, rootF: 0.25 };
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
  const loops = KK.faceLoops(polys, g).map(l => ({ t: 'poly', pts: l.map(q => { const dq = KK.vsub(q, B.o); return [KK.vdot(dq, B.u), KK.vdot(dq, B.v)]; }) }));
  if (!loops.length) throw new Error('Obrys plochy se nepodařilo určit');
  const tool = d > 0 ? KK.extrudeProfiles(loops, B, -0.01, d) : KK.extrudeProfiles(loops, B, d, 0.01);
  return [{ op: d > 0 ? 'union' : 'subtract', tool }];
}
function offsetFace(polys, f) {
  let out = polys;
  for (const s of offsetFaceTool(polys, f)) out = KK.boolean(out, s.tool, s.op);
  if (!out.length) throw new Error('Úprava plochy by odstranila celé těleso');
  return out;
}
function toolForPrimitive(f) {
  const p = {}; for (const k in f.p) p[k] = Math.max(0.01, Number(f.p[k]) || 0);
  if (f.type === 'torus' && p.t >= p.R) throw new Error('Trubice musí být menší než hlavní poloměr');
  const pos = f.pos || [0, 0, 0];
  return KK.translate(KK.primitive(f.type, p), [pos[0], pos[1], pos[2] + PRIM[f.type].lift(p)]);
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
        const copies = mats.map(m => (m ? KK.transform(b.polys, m) : KK.mirror(b.polys, f.plane || 'YZ')));
        if (f.join) {
          let acc = b.polys; for (const c of copies) acc = KK.boolean(acc, c, 'union');
          repl.set(b.id, acc);
        } else copies.forEach(c => added.push({ id: f.id + '_' + (k++), name: 'Těleso ' + (++n), polys: c, from: f.id }));
      }
      out = bodies.map(b => (repl.has(b.id) ? { ...b, polys: repl.get(b.id) } : b)).concat(added);
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
      const map = new Map(sel.map(x => [x.id, { ...x, polys: KK.transform(x.polys, m) }]));
      out = bodies.map(x => map.get(x.id) || x);
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
        out = bodies.map(x => (x === b ? { ...x, polys: KK.transform(x.polys, m) } : x));
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
      const map = new Map(sel.map(x => [x.id, { ...x, polys: KK.translate(x.polys, f.each ? shift(KK.bbox(x.polys)) : gs) }]));
      out = bodies.map(x => map.get(x.id) || x);
      break;
    }
    case 'rotate': {
      const sel = f.all ? bodies.slice() : bodies.filter(x => (f.bodies || []).includes(x.id));
      if (!sel.length) throw new Error('Vyberte tělesa');
      const bb = KK.bbox(sel.flatMap(x => x.polys));
      const c = f.pivot === 'origin' ? [0, 0, 0] : [0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2);
      const m = eulerMatrix(c, [0, 0, 0], (f.r || [0, 0, 0]).map(Number));
      let moved = sel.map(x => ({ ...x, polys: KK.transform(x.polys, m) }));
      if (f.ground) {
        const mz = Math.min(...moved.map(x => KK.bbox(x.polys).min[2]));
        if (Math.abs(mz) > 1e-9) moved = moved.map(x => ({ ...x, polys: KK.translate(x.polys, [0, 0, -mz]) }));
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
        for (const x of sel) { let p = x.polys; for (let j = 1; j <= cnt; j++) { p = KK.transform(p, m); added.push({ id: f.id + (k ? '_' + k : ''), name: 'Těleso ' + (++n), polys: p, from: f.id }); k++; } }
        out = bodies.concat(added);
      }
      else out = bodies.map(x => (sel.includes(x) ? { ...x, polys: KK.transform(x.polys, m) } : x));
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

return { offsetFace, offsetFaceTool, basisFromPlane, THREADS, suggestThread, threadTool, setBlobResolver: fn => { blobResolver = fn; blobCache.clear(); }, toolForRevolve, importPolys, revolveAxis, PLANES, FEATURE_LABEL, regions, closedLoops, describe, matchEdge, step, makeRebuilder, toolForExtrude, toolForPrimitive, eulerMatrix, overlaps };
})();




