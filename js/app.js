(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const V3 = THREE.Vector3;
const D2R = Math.PI / 180;
const KEY = 'kota-cad-v2', SKEY = 'kota-cad-settings', BKEY = 'kota-cad-blobs';
const fmt = (n, d = 2) => { const s = (Math.round(n * 10 ** d) / 10 ** d + 0).toString(); return s; };
const EN = () => !!(window.I18N && I18N.lang === 'en');
const fmtc = (n, d = 2) => (EN() ? fmt(n, d) : fmt(n, d).replace('.', ','));
const parseNum = s => parseFloat(String(s).trim().replace(',', '.'));
const clone = o => JSON.parse(JSON.stringify(o));
const v3 = a => new V3(a[0], a[1], a[2]);

/* ================= icons ================= */
const ICONS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  undo: '<path d="M9 6 4 11l5 5M4 11h10a5 5 0 0 1 0 10h-3"/>',
  redo: '<path d="M15 6l5 5-5 5M20 11H10a5 5 0 0 0 0 10h3"/>',
  chev: '<path d="m7 10 5 5 5-5"/>',
  chevr: '<path d="m10 7 5 5-5 5"/>',
  home: '<path d="M4 11 12 4l8 7M6.5 9.5V20h11V9.5"/>',
  fit: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/><rect x="8.5" y="8.5" width="7" height="7" rx="1"/>',
  persp: '<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  style: '<path class="b" d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  grid: '<path d="M4 4v16M10 4v16M16 4v16M4 4h16M4 10h16M4 16h16M20 4v16M4 20h16"/>',
  snap: '<path d="M4 4v16M12 4v16M20 4v16M4 4h16M4 12h16M4 20h16" opacity=".5"/><circle class="b2" cx="12" cy="12" r="3"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeoff: '<path d="M2.5 12S6 5.5 12 5.5c1.5 0 2.9.4 4.1 1M21.5 12S18 18.5 12 18.5c-1.5 0-2.9-.4-4.1-1M4 4l16 16"/>',
  doc: '<path class="b" d="M6 3h8l4 4v14H6z"/><path d="M6 3h8l4 4v14H6zM14 3v4h4"/>',
  folder: '<path d="M3 6.5h6l2 2h10V19H3z"/>',
  origin: '<path d="M12 12V3M12 12l8 5M12 12l-8 5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  bodyi: '<path class="b" d="M12 4 19 8v8l-7 4-7-4V8z"/><path d="M12 4 19 8v8l-7 4-7-4V8zM5 8l7 4 7-4M12 12v8"/>',
  sketchi: '<rect class="o" x="4" y="6" width="16" height="12" rx="1" opacity=".55"/><rect x="4" y="6" width="16" height="12" rx="1"/>',
  sketch: '<rect class="o" x="3" y="9" width="12" height="11" rx="1" opacity=".5"/><rect x="3" y="9" width="12" height="11" rx="1"/><path class="o" d="m11 14 8.6-8.6a1.7 1.7 0 0 1 2.4 2.4L13.4 16.4 10.5 17z"/>',
  extrude: '<path class="o" d="M3.5 18.5 9 15h11.5L15 18.5z"/><path class="b" d="M9 6.5h11.5v8.5H9zM3.5 10 9 6.5v8.5L3.5 18.5z"/><path d="M3.5 10 9 6.5h11.5L15 10zM3.5 10v8.5H15V10M15 18.5 20.5 15V6.5"/><path d="M12 9V2.5M9.8 4.7 12 2.5l2.2 2.2"/>',
  box: '<path class="b" d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path class="b2" d="M12 12 20 7.5v9L12 21z"/><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9zM4 7.5 12 12l8-4.5M12 12v9"/>',
  cylinder: '<path class="b" d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6z"/><ellipse class="b2" cx="12" cy="6" rx="7" ry="2.8"/><ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6"/>',
  sphere: '<circle class="b" cx="12" cy="12" r="8.5"/><path class="b2" d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5c-2.5 1.6-5.4 2.2-8.5 2.2" opacity=".7"/><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12c0 1.8 3.8 3.2 8.5 3.2s8.5-1.4 8.5-3.2"/>',
  cone: '<path class="b" d="M12 3 5 17.5c0 1.7 3.1 3 7 3s7-1.3 7-3z"/><path d="M12 3 5 17.5M12 3l7 14.5"/><ellipse cx="12" cy="17.5" rx="7" ry="3"/>',
  torus: '<ellipse class="b" cx="12" cy="12" rx="9.5" ry="6"/><ellipse cx="12" cy="12" rx="9.5" ry="6"/><path class="b2" d="M7.5 11.8c1.2-1.2 2.8-1.8 4.5-1.8s3.3.6 4.5 1.8c-1.2 1-2.8 1.5-4.5 1.5s-3.3-.5-4.5-1.5z" style="fill:var(--panel)"/><path d="M7.5 11.8c1.2-1.2 2.8-1.8 4.5-1.8s3.3.6 4.5 1.8c-1.2 1-2.8 1.5-4.5 1.5s-3.3-.5-4.5-1.5z"/>',
  fillet: '<path class="b" d="M4 20V9h6a5 5 0 0 0 5 5h5v6z"/><path d="M4 20V9h6a5 5 0 0 0 5 5h5v6z"/><path class="o" d="M10 9a5 5 0 0 0 5 5" style="fill:none;stroke:var(--orange);stroke-width:2.4"/><path d="M10 9V4h10v10" stroke-dasharray="2 2" opacity=".6"/>',
  chamfer: '<path class="b" d="M4 20V9h6l5 5h5v6z"/><path d="M4 20V9h6l5 5h5v6z"/><path d="M10 9l5 5" style="stroke:var(--orange);stroke-width:2.4"/><path d="M10 9V4h10v10" stroke-dasharray="2 2" opacity=".6"/>',
  combine: '<rect class="b" x="3" y="7" width="11" height="11" rx="1"/><circle class="b2" cx="15" cy="10" r="6" opacity=".85"/><rect x="3" y="7" width="11" height="11" rx="1"/><circle cx="15" cy="10" r="6"/>',
  move: '<path d="M12 3v18M3 12h18M12 3 9.5 5.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/><rect class="b" x="9" y="9" width="6" height="6" rx="1"/>',
  del: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/><path class="r" d="M10 11v6M14 11v6" style="stroke:var(--danger)"/>',
  line: '<path d="M4 19 10 7l10 4"/><rect x="2.5" y="17.5" width="3" height="3" style="fill:var(--panel)"/><rect x="8.5" y="5.5" width="3" height="3" style="fill:var(--panel)"/><rect x="18.5" y="9.5" width="3" height="3" style="fill:var(--panel)"/>',
  rect: '<rect class="o" x="4" y="6" width="16" height="12" opacity=".35"/><rect x="4" y="6" width="16" height="12"/><rect x="2.5" y="4.5" width="3" height="3" style="fill:var(--panel)"/><rect x="18.5" y="16.5" width="3" height="3" style="fill:var(--panel)"/>',
  circle: '<circle class="o" cx="12" cy="12" r="8" opacity=".35"/><circle cx="12" cy="12" r="8"/><path d="M12 12l5.6-5.6"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
  skdel: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  finish: '<circle class="g" cx="12" cy="12" r="9" opacity=".2"/><circle cx="12" cy="12" r="9" style="stroke:var(--ok)"/><path d="m7.5 12.5 3 3 6-6.5" style="stroke:var(--ok);stroke-width:2.2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  sktrim: '<circle cx="6.5" cy="17" r="2.6"/><circle cx="17.5" cy="17" r="2.6"/><path d="M8.4 15.2 16 4M15.6 15.2 8 4"/><path class="o" d="M3 10h18" stroke-dasharray="2 2" style="stroke:var(--orange)"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5z"/>',
  tfirst: '<path d="M6 5v14M18 5l-9 7 9 7z"/>',
  tprev: '<path d="M16 5l-9 7 9 7z"/>',
  tnext: '<path d="M8 5l9 7-9 7z"/>',
  tlast: '<path d="M18 5v14M6 5l9 7-9 7z"/>',
  facemode: '<path class="b" d="M4 9 12 5l8 4-8 4z"/><path d="M4 9 12 5l8 4-8 4zM4 9v7l8 4 8-4V9M12 13v7"/>',
  pressface: '<path d="M4 14 12 10l8 4-8 4z"/><path class="b" d="M4 14 12 10l8 4-8 4z" opacity=".7"/><path d="M4 14v4l8 4 8-4v-4"/><path d="M12 9V2M9.5 4.5 12 2l2.5 2.5"/>',
  center: '<path d="M12 2v5M12 17v5M2 12h5M17 12h5"/><rect class="b" x="7" y="7" width="10" height="10" rx="1"/><rect x="7" y="7" width="10" height="10" rx="1"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  selall: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 2"/><rect class="b" x="7" y="7" width="5" height="5"/><rect class="b2" x="13" y="12" width="5" height="5"/><rect x="7" y="7" width="5" height="5"/><rect x="13" y="12" width="5" height="5"/>',
  scale: '<rect class="b" x="3" y="11" width="10" height="10" rx="1"/><rect x="3" y="11" width="10" height="10" rx="1"/><path d="M8 11V4h12v12h-7" stroke-dasharray="2 2"/><path d="M13 11l6-6M14.5 5H19v4.5"/>',
  thread: '<path class="b" d="M8 4h8v16H8z"/><path d="M8 4h8v16H8z"/><path d="M8 7.5 16 6M8 11 16 9.5M8 14.5 16 13M8 18 16 16.5"/><path d="M5 4v16" stroke-dasharray="2 2" opacity=".6"/>',
  rotate: '<path class="b" d="M9 8.5 14 6l5 2.5v6L14 17l-5-2.5z"/><path d="M9 8.5 14 6l5 2.5v6L14 17l-5-2.5zM9 8.5l5 2.5 5-2.5M14 11v6"/><path d="M6.5 18.5A8.5 8.5 0 0 1 5 7"/><path d="M3 9l2-2.4 2.4 1.6"/>',
  revolve: '<path class="o" d="M13 4h4v15h-4z" opacity=".7"/><path d="M13 4h4v15h-4z"/><path d="M9 2v20" stroke-dasharray="2 2"/><path class="b" d="M5.5 8.5c-2 .8-2 6.2 0 7l1.2-1.8c-.9-1-.9-2.4 0-3.4z" opacity=".9"/><path d="M5.5 8.5c-2 .8-2 6.2 0 7M5.5 15.5l-.2-2.3 2.1.9"/>',
  mirror: '<path d="M12 2v20" stroke-dasharray="2 2"/><path class="b" d="M3 7h6v10H3z"/><path d="M3 7h6v10H3z"/><path class="b2" d="M15 7h6v10h-6z" opacity=".55"/><path d="M15 7h6v10h-6z" stroke-dasharray="2 1.5"/>',
  pattern: '<circle cx="12" cy="12" r="1.2" fill="currentColor"/><rect class="b" x="9.5" y="2.5" width="5" height="5" rx="1"/><rect class="b2" x="16.5" y="9.5" width="5" height="5" rx="1"/><rect class="b2" x="9.5" y="16.5" width="5" height="5" rx="1"/><rect class="b2" x="2.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="2.5" width="5" height="5" rx="1"/><rect x="16.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="16.5" width="5" height="5" rx="1"/><rect x="2.5" y="9.5" width="5" height="5" rx="1"/>',
  measure: '<path class="o" d="M3 15 15 3l6 6L9 21z" opacity=".55"/><path d="M3 15 15 3l6 6L9 21zM7 11l2 2M10 8l3 3M13 5l2 2M16 12l-2-2M10 14l-1-1"/>',
  import: '<path d="M12 3v11M8 10l4 4 4-4"/><path class="b" d="M4 15v5h16v-5" opacity=".6"/><path d="M4 15v5h16v-5"/>',
  ngon: '<path class="o" d="M12 3.5 19.4 7.8v8.4L12 20.5l-7.4-4.3V7.8z" opacity=".35"/><path d="M12 3.5 19.4 7.8v8.4L12 20.5l-7.4-4.3V7.8z"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  spline: '<path d="M3 18c3-9 6-12 9-6s6 3 9-6"/><rect x="1.5" y="16.5" width="3" height="3" style="fill:var(--panel)"/><rect x="10.5" y="10.5" width="3" height="3" style="fill:var(--panel)"/><rect x="19.5" y="4.5" width="3" height="3" style="fill:var(--panel)"/>',
  ellipse: '<ellipse class="o" cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-25 12 12)" opacity=".35"/><ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-25 12 12)"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  slot: '<path class="o" d="M7.5 8h9a4 4 0 0 1 0 8h-9a4 4 0 0 1 0-8z" opacity=".35"/><path d="M7.5 8h9a4 4 0 0 1 0 8h-9a4 4 0 0 1 0-8z"/><circle cx="7.5" cy="12" r="1" fill="currentColor"/><circle cx="16.5" cy="12" r="1" fill="currentColor"/>',
  skfillet: '<path d="M4 20V11a7 7 0 0 1 7-7h9"/><path d="M4 11V4h7" stroke-dasharray="2 2" opacity=".6"/><path d="M4 11a7 7 0 0 1 7-7" style="stroke:var(--orange);stroke-width:2.4"/>',
  skimport: '<rect class="o" x="3" y="11" width="10" height="9" rx="1" opacity=".4"/><rect x="3" y="11" width="10" height="9" rx="1"/><path d="M17 3v10M13.5 9.5 17 13l3.5-3.5"/>'
};
const svg = (name, size) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
const paintIcons = root => $$('[data-ic]', root).forEach(el => { el.innerHTML = svg(el.dataset.ic, +(el.dataset.s || 22)); });
paintIcons(document);

/* ================= renderer, cameras, controls ================= */
const vp = $('#vp');
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
catch (e) { const p = $('#prompt'); p.hidden = false; p.textContent = 'Tento prohlížeč nepodporuje WebGL, 3D pohled nelze zobrazit.'; return; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
renderer.domElement.className = 'scene';
renderer.domElement.tabIndex = 0;
vp.insertBefore(renderer.domElement, vp.firstChild);
const dom = renderer.domElement;
dom.addEventListener('contextmenu', e => e.preventDefault());

const scene = new THREE.Scene();
const persp = new THREE.PerspectiveCamera(30, 1, 0.5, 20000); persp.up.set(0, 0, 1);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -20000, 20000); ortho.up.set(0, 0, 1);
let isOrtho = false, orthoH = 100;
const cam = () => (isOrtho ? ortho : persp);
persp.position.set(160, -200, 150);

const hemi = new THREE.HemisphereLight(0xffffff, 0x6f7987, 0.75); hemi.position.set(0, 0, 1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); scene.add(sun, sun.target);

const controls = new THREE.OrbitControls(persp, dom);
controls.screenSpacePanning = true;
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
controls.minDistance = 1; controls.maxDistance = 6000; controls.minZoom = 0.02; controls.maxZoom = 80;
controls.rotateSpeed = 0.8; controls.zoomSpeed = 1.1;
controls.target.set(0, 0, 10);
controls.update();

const transform = new THREE.TransformControls(persp, dom);
transform.setSize(0.9);
scene.add(transform);

const G = {
  grid: new THREE.Group(), origin: new THREE.Group(), bodies: new THREE.Group(), sketches: new THREE.Group(),
  planes: new THREE.Group(), overlay: new THREE.Group(), preview: new THREE.Group(), skwork: new THREE.Group()
};
Object.values(G).forEach(g => scene.add(g));
G.planes.visible = false;

/* theme tokens -> three colours */
const tok = {};
function readTokens() {
  const cs = getComputedStyle(document.documentElement);
  ['--accent', '--accent-hover', '--orange', '--danger', '--body', '--edge', '--sketch', '--grid', '--grid-major', '--cube', '--cube-ink', '--panel', '--line', '--muted', '--ok', '--ink']
    .forEach(n => { try { tok[n.slice(2)] = new THREE.Color(cs.getPropertyValue(n).trim() || '#888'); } catch (e) { tok[n.slice(2)] = new THREE.Color('#888'); } });
}
readTokens();
const css = c => '#' + c.getHexString();

function lineGeo(arr) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); return g; }
const noRay = o => { o.raycast = () => {}; return o; };

/* grid + origin */
const gridMinor = new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.9, depthWrite: false });
const gridMajor = new THREE.LineBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.9, depthWrite: false });
(() => {
  const ext = 300, mi = [], ma = [];
  for (let i = -ext; i <= ext; i += 10) (i % 50 === 0 ? ma : mi).push(i, -ext, 0, i, ext, 0, -ext, i, 0, ext, i, 0);
  G.grid.add(noRay(new THREE.LineSegments(lineGeo(mi), gridMinor)), noRay(new THREE.LineSegments(lineGeo(ma), gridMajor)));
  G.grid.renderOrder = -1;
  const ax = (to, c) => G.origin.add(noRay(new THREE.Line(lineGeo([0, 0, 0.01, ...to]), new THREE.LineBasicMaterial({ color: c }))));
  ax([120, 0, 0.01], 0xe5484d); ax([0, 120, 0.01], 0x2f9e6a); ax([0, 0, 120], 0x4f7ae0);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 8), new THREE.MeshBasicMaterial({ color: 0xe2862c }));
  G.origin.add(noRay(dot));
})();

/* origin planes for sketch placement */
const PLANE_DEFS = [['XY', 0x4f7ae0], ['XZ', 0x2f9e6a], ['YZ', 0xe5484d]];
const planeMeshes = PLANE_DEFS.map(([name, col]) => {
  const P = Engine.PLANES[name], s = 70;
  const g = new THREE.PlaneGeometry(s, s);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
  m.matrixAutoUpdate = false; m.matrix.copy(planeMatrix(P)).multiply(new THREE.Matrix4().makeTranslation(s / 2 + 4, s / 2 + 4, 0));
  const edge = noRay(new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: col })));
  m.add(edge);
  m.userData = { plane: P, name, col };
  G.planes.add(m);
  return m;
});
function planeMatrix(P) { const m = new THREE.Matrix4(); m.makeBasis(v3(P.u), v3(P.v), v3(P.n)); m.setPosition(v3(P.o)); return m; }
const P3 = (P, x, y, z = 0) => new V3(P.o[0] + P.u[0] * x + P.v[0] * y + P.n[0] * z, P.o[1] + P.u[1] * x + P.v[1] * y + P.n[1] * z, P.o[2] + P.u[2] * x + P.v[2] * y + P.n[2] * z);
const P2 = (P, p) => { const d = [p.x - P.o[0], p.y - P.o[1], p.z - P.o[2]]; return [d[0] * P.u[0] + d[1] * P.u[1] + d[2] * P.u[2], d[0] * P.v[0] + d[1] * P.v[1] + d[2] * P.v[2]]; };
function planeFromPoly(p) {
  const n = p.n, o = [n[0] * p.w, n[1] * p.w, n[2] * p.w];
  let u, v;
  if (Math.abs(n[2]) > 0.9) { u = K.vnorm(K.vsub([1, 0, 0], K.vmul(n, n[0]))); v = K.cross(n, u); }
  else { v = K.vnorm(K.vsub([0, 0, 1], K.vmul(n, n[2]))); u = K.cross(v, n); }
  const r = a => a.map(x => Math.round(x * 1e6) / 1e6);
  return { o: r(o), u: r(u), v: r(v), n: r(n) };
}

/* ================= settings, document, history ================= */
const settings = { snap: 1, gridSnap: true, style: 'se', grid: true };
try { Object.assign(settings, JSON.parse(localStorage.getItem(SKEY)) || {}); } catch (e) {}
const saveSettings = () => { try { localStorage.setItem(SKEY, JSON.stringify(settings)); } catch (e) {} };

const XY = Engine.PLANES.XY;
function exampleDoc() {
  const edges = [[-40, -25], [40, -25], [40, 25], [-40, 25]].map(([x, y]) => ({ k: 'line', a: [x, y, 0], b: [x, y, 12] }));
  return {
    uid: newUid(), name: 'Držák s nábojem', seq: 8, vis: { f1: false, f3: false }, names: {},
    features: [
      { id: 'f1', type: 'sketch', name: 'Skica 1', plane: XY, ents: [{ t: 'rect', x: -40, y: -25, w: 80, h: 50 }, { t: 'circle', x: -25, y: 0, r: 5 }, { t: 'circle', x: 25, y: 0, r: 5 }] },
      { id: 'f2', type: 'extrude', sketch: 'f1', regions: [0], dist: 12, sym: false, op: 'new' },
      { id: 'f3', type: 'sketch', name: 'Skica 2', plane: { o: [0, 0, 12], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] }, ents: [{ t: 'circle', x: 0, y: 0, r: 12 }, { t: 'circle', x: 0, y: 0, r: 6 }] },
      { id: 'f4', type: 'extrude', sketch: 'f3', regions: [0], dist: 18, sym: false, op: 'join' },
      { id: 'f5', type: 'extrude', sketch: 'f3', regions: [1], dist: -12, sym: false, op: 'cut' },
      { id: 'f6', type: 'fillet', body: 'f2', r: 8, edges },
      { id: 'f7', type: 'chamfer', body: 'f2', r: 1.5, edges: [{ k: 'circle', c: [0, 0, 30], r: 12, ax: [0, 0, 1] }] },
      { id: 'f8', type: 'fillet', body: 'f2', r: 2, edges: [{ k: 'circle', c: [0, 0, 12], r: 12, ax: [0, 0, 1] }] }
    ],
    marker: 8
  };
}
const newUid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const emptyDoc = () => ({ uid: newUid(), name: EN() ? 'Untitled' : 'Bez názvu', seq: 0, vis: {}, names: {}, features: [], marker: 0 });
function validDoc(d) {
  if (!d || !Array.isArray(d.features)) return null;
  const out = { uid: typeof d.uid === 'string' && /^[a-z0-9]{4,24}$/.test(d.uid) ? d.uid : newUid(), name: String(d.name || 'Bez názvu').slice(0, 60), seq: Number(d.seq) || 0, vis: (d.vis && typeof d.vis === 'object') ? d.vis : {},
    names: (d.names && typeof d.names === 'object') ? d.names : {}, features: d.features.filter(f => f && typeof f.id === 'string' && Engine.FEATURE_LABEL[f.type]).slice(0, 400) };
  out.marker = Math.max(0, Math.min(out.features.length, Number.isFinite(+d.marker) ? +d.marker : out.features.length));
  out.features.forEach(f => { const n = parseInt(f.id.replace(/\D/g, ''), 10); if (n > out.seq) out.seq = n; });
  return out;
}
/* local library of designs: index under LKEY, every design under its own key. Empty designs are never stored. */
const LKEY = 'skicacad-library', DKEY = uid => 'skicacad-doc-' + uid, TKEY = uid => 'skicacad-thumb-' + uid, LIB_MAX = 60;
const libThumb = uid => { try { return localStorage.getItem(TKEY(uid)); } catch (e) { return null; } };
function libList() { try { const l = JSON.parse(localStorage.getItem(LKEY)); return Array.isArray(l) ? l.filter(x => x && typeof x.uid === 'string') : []; } catch (e) { return []; } }
function libWrite(list) { try { localStorage.setItem(LKEY, JSON.stringify(list)); } catch (e) { /* ignore */ } }
function libGet(uid) { try { return validDoc(JSON.parse(localStorage.getItem(DKEY(uid)))); } catch (e) { return null; } }
function libDelete(uid) { libWrite(libList().filter(x => x.uid !== uid)); try { localStorage.removeItem(DKEY(uid)); localStorage.removeItem(TKEY(uid)); } catch (e) { /* ignore */ } }
function libStore(d) {
  localStorage.setItem(DKEY(d.uid), JSON.stringify(d));
  const l = libList().filter(x => x.uid !== d.uid);
  l.unshift({ uid: d.uid, name: d.name, t: Date.now(), n: d.features.length });
  for (const x of l.splice(LIB_MAX)) { try { localStorage.removeItem(DKEY(x.uid)); localStorage.removeItem(TKEY(x.uid)); } catch (e) { /* ignore */ } }
  libWrite(l);
}
/* one-time move of the old single autosaved design into the library */
try {
  const old = validDoc(JSON.parse(localStorage.getItem(KEY)));
  if (old && old.features.length && !libList().some(x => x.uid === old.uid)) libStore(old);
  localStorage.removeItem(KEY);
} catch (e) { /* ignore */ }

let doc = emptyDoc();
let hist = [], hi = -1, quotaWarned = false;
const saveDoc = () => {
  if (!doc.uid) doc.uid = newUid();
  if (!doc.features.length) return;
  scheduleThumb();
  try { libStore(doc); } catch (e) { if (!quotaWarned) { quotaWarned = true; toast('Úložiště prohlížeče je plné. Smažte staré návrhy (Soubor › Moje návrhy) nebo návrh uložte do souboru.'); } }
};
function pushHist() {
  const s = JSON.stringify(doc);
  if (hist[hi] === s) return;
  hist = hist.slice(0, hi + 1); hist.push(s); if (hist.length > 120) hist.shift(); hi = hist.length - 1;
  updateUndo();
}
function updateUndo() { $('#undo').disabled = hi <= 0 || !!cmd || !!sk; $('#redo').disabled = hi >= hist.length - 1 || !!cmd || !!sk; }
function commit() { pushHist(); saveDoc(); refreshBusy(); }
function undo() { if (hi > 0 && !cmd && !sk) { hi--; doc = JSON.parse(hist[hi]); afterDocSwap(); } }
function redo() { if (hi < hist.length - 1 && !cmd && !sk) { hi++; doc = JSON.parse(hist[hi]); afterDocSwap(); } }
function afterDocSwap() { $('#docname').value = doc.name; tlSel = null; saveDoc(); updateUndo(); refreshBusy(); }
const newId = () => 'f' + (++doc.seq);

/* ================= model state & display ================= */
const rebuilder = Engine.makeRebuilder();
let cur = { bodies: [], sketches: new Map(), status: [] };
let viewMarker = null;
let sel = new Set(), hoverBody = null, tlSel = null;
const meshes = new Map(); /* bodyId -> {mesh, edges, polys, name} */
const sketchObjs = new Map(); /* sketchId -> {f, obj} */
const chainCache = new WeakMap(), smoothCache = new WeakMap();

const isVis = id => doc.vis[id] !== false;
const bodiesVisible = () => doc.vis.__bodies !== false;
const sketchesVisible = () => doc.vis.__sketches !== false;
const bodyName = b => doc.names[b.id] || b.name;
const bodyById = id => cur.bodies.find(b => b.id === id);

let busyTimer = null;
function refreshBusy(after) {
  const b = $('#busy');
  clearTimeout(busyTimer);
  busyTimer = setTimeout(() => { b.hidden = false; }, 120);
  requestAnimationFrame(() => setTimeout(() => {
    try { refresh(); } finally { clearTimeout(busyTimer); b.hidden = true; }
    if (after) after();
  }, 0));
}
function refresh() {
  const m = viewMarker === null ? doc.marker : viewMarker;
  cur = rebuilder(doc.features, m);
  if (typeof selFace !== 'undefined' && selFace && (!meshes.has(selFace.bodyId) || !cur.bodies.some(b => b.polys === selFace.polys))) { selFace = null; hoverFace = null; }
  syncBodies(); syncSketches(); renderBrowser(); renderTimeline(); updateInfo(); updateUndo(); requestRender();
  if (typeof drawFaces === 'function' && typeof faceGroup !== 'undefined') drawFaces();
}
function bodyMaterial() {
  return new THREE.MeshStandardMaterial({ color: tok.body.clone(), roughness: 0.42, metalness: 0.16, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
}
function meshFromPolys(polys, mat) {
  const rm = K.renderMesh(polys), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(rm.pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(rm.nor, 3));
  g.computeBoundingSphere();
  const m = new THREE.Mesh(g, mat);
  m.userData.triPoly = rm.triPoly;
  return m;
}
function makeBodyEntry(b) {
  const mesh = meshFromPolys(b.polys, bodyMaterial());
  mesh.userData.bodyId = b.id; mesh.userData.polys = b.polys;
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(K.edgeSegments(b.polys), 3));
  const edges = noRay(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: tok.edge.clone() })));
  mesh.add(edges);
  G.bodies.add(mesh);
  return { mesh, edges, polys: b.polys };
}
function disposeEntry(e) {
  e.mesh.geometry.dispose(); e.mesh.material.dispose(); e.edges.geometry.dispose(); e.edges.material.dispose();
  G.bodies.remove(e.mesh);
}
function syncBodies() {
  const seen = new Set();
  for (const b of cur.bodies) {
    seen.add(b.id);
    let e = meshes.get(b.id);
    if (!e || e.polys !== b.polys) { if (e) disposeEntry(e); e = makeBodyEntry(b); meshes.set(b.id, e); }
    e.name = bodyName(b);
  }
  for (const [id, e] of meshes) if (!seen.has(id)) { disposeEntry(e); meshes.delete(id); }
  sel = new Set([...sel].filter(id => meshes.has(id)));
  styleBodies();
}
const bodyTint = new Map(); /* id -> 'target' | 'tool' (combine) */
function styleBodies() {
  const hideForPreview = cmd && cmd.hideBody;
  for (const [id, e] of meshes) {
    const visible = bodiesVisible() && isVis(id) && id !== hideForPreview;
    e.mesh.visible = visible;
    const m = e.mesh.material, isSel = sel.has(id) || (cmd && cmd.highlight && cmd.highlight.has(id));
    const tint = bodyTint.get(id);
    m.color.copy(tok.body);
    if (tint === 'tool') m.color.lerp(tok.orange, 0.5);
    else if (isSel || tint === 'target') m.color.lerp(tok.accent, 0.45);
    m.wireframe = false;
    m.visible = settings.style !== 'w';
    m.transparent = false; m.opacity = 1;
    e.edges.visible = settings.style !== 's';
    /* sharp edges are drawn softly (a shade darker than the body); selection and hover keep strong colours */
    const strong = isSel || tint || hoverBody === id;
    e.edges.material.color.copy(isSel || tint ? (tint === 'tool' ? tok.orange : tok.accent) : (hoverBody === id ? tok['accent-hover'] : softEdge()));
    e.edges.material.transparent = !strong; e.edges.material.opacity = strong ? 1 : 0.55; e.edges.material.depthWrite = strong;
  }
  requestRender();
}
function softEdge() { return tok.body.clone().lerp(tok.edge, 0.6); }
function visibleMeshes() { return Array.from(meshes.values()).filter(e => e.mesh.visible).map(e => e.mesh); }

/* sketches (finished) */
function entityPolylines(ents) {
  const out = [];
  for (const e of ents) {
    if (e.t === 'spline') { out.push({ pts: K.splinePoints(e.pts, !!e.closed && e.pts.length >= 3, 16), closed: !!e.closed && e.pts.length >= 3 }); continue; }
    if (e.t === 'circle') { const p = []; for (let i = 0; i < 72; i++) { const a = 2 * Math.PI * i / 72; p.push([e.x + e.r * Math.cos(a), e.y + e.r * Math.sin(a)]); } out.push({ pts: p, closed: true }); }
    else if (e.t === 'poly' && !(e.closed && e.fr > 0)) out.push({ pts: e.pts, closed: !!e.closed });
    else if (e.t === 'rect' || e.t === 'ngon' || e.t === 'slot' || e.t === 'ellipse' || e.t === 'poly') { try { out.push({ pts: K.profilePoints(e), closed: true }); } catch (er) { /* skip degenerate */ } }
  }
  return out;
}
function sketchLines(P, ents, color, lift = 0.03) {
  const arr = [];
  for (const pl of entityPolylines(ents)) {
    const n = pl.pts.length, m = pl.closed ? n : n - 1;
    for (let i = 0; i < m; i++) { const a = pl.pts[i], b = pl.pts[(i + 1) % n]; const A = P3(P, a[0], a[1], lift), B = P3(P, b[0], b[1], lift); arr.push(A.x, A.y, A.z, B.x, B.y, B.z); }
  }
  return noRay(new THREE.LineSegments(lineGeo(arr), new THREE.LineBasicMaterial({ color })));
}
function keyPoints(ents) {
  const pts = [[0, 0]];
  for (const e of ents) {
    if (e.t === 'rect') pts.push([e.x, e.y], [e.x + e.w, e.y], [e.x + e.w, e.y + e.h], [e.x, e.y + e.h], [e.x + e.w / 2, e.y + e.h / 2]);
    else if (e.t === 'circle') pts.push([e.x, e.y]);
    else if (e.t === 'poly' || e.t === 'spline') pts.push(...e.pts);
    else if (e.t === 'ngon') { pts.push([e.x, e.y]); for (let i = 0; i < e.n; i++) { const a = (e.a || 0) * D2R + 2 * Math.PI * i / e.n; pts.push([e.x + e.r * Math.cos(a), e.y + e.r * Math.sin(a)]); } }
    else if (e.t === 'slot') pts.push([e.x1, e.y1], [e.x2, e.y2]);
    else if (e.t === 'ellipse') { const a = (e.a || 0) * D2R, c = Math.cos(a), s = Math.sin(a); pts.push([e.x, e.y], [e.x + e.rx * c, e.y + e.rx * s], [e.x - e.rx * c, e.y - e.rx * s], [e.x - e.ry * s, e.y + e.ry * c], [e.x + e.ry * s, e.y - e.ry * c]); }
  }
  return pts;
}
function pointsObj(P, pts2, color, size = 5) {
  const arr = []; for (const p of pts2) { const q = P3(P, p[0], p[1], 0.05); arr.push(q.x, q.y, q.z); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  return noRay(new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: false })));
}
function disposeObj(o) { o.traverse(c => { if (c.geometry && !(c.userData && c.userData.sharedGeo)) c.geometry.dispose(); if (c.material) (Array.isArray(c.material) ? c.material : [c.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); }); }
function syncSketches() {
  const want = new Map();
  if (sketchesVisible()) for (const [id, f] of cur.sketches) if (isVis(id) && !(sk && sk.f.id === id)) want.set(id, f);
  for (const [id, o] of sketchObjs) if (!want.has(id) || want.get(id) !== o.f) { G.sketches.remove(o.obj); disposeObj(o.obj); sketchObjs.delete(id); }
  for (const [id, f] of want) {
    if (sketchObjs.has(id)) continue;
    const grp = new THREE.Group();
    grp.add(sketchLines(f.plane, f.ents || [], tok.sketch));
    G.sketches.add(grp); sketchObjs.set(id, { f, obj: grp });
  }
  G.origin.visible = doc.vis.__origin !== false;
}

/* ================= camera ================= */
function applyOrtho() {
  const a = persp.aspect || 1;
  ortho.top = orthoH; ortho.bottom = -orthoH; ortho.left = -orthoH * a; ortho.right = orthoH * a; ortho.updateProjectionMatrix();
}
function setProjection(o) {
  if (o === isOrtho) return;
  const t = controls.target, k = Math.tan(persp.fov * D2R / 2);
  if (o) { orthoH = persp.position.distanceTo(t) * k; ortho.zoom = 1; ortho.position.copy(persp.position); ortho.quaternion.copy(persp.quaternion); applyOrtho(); }
  else { const dir = ortho.position.clone().sub(t).normalize(); persp.position.copy(t).addScaledVector(dir, orthoH / ortho.zoom / k); persp.lookAt(t); }
  isOrtho = o; controls.object = cam(); transform.camera = cam(); controls.update();
  $('#nav-proj').setAttribute('aria-pressed', String(o)); requestRender();
}
function sceneBox(onlySel) {
  const box = new THREE.Box3();
  for (const [id, e] of meshes) { if (!e.mesh.visible) continue; if (onlySel && !sel.has(id)) continue; e.mesh.geometry.computeBoundingBox(); box.union(e.mesh.geometry.boundingBox); }
  return box;
}
let anim = null;
function viewTo(dir, center, radius, instant) {
  const c = cam(), t0 = controls.target.clone(), d0 = c.position.clone().sub(t0), dist0 = d0.length();
  let d1 = dir ? dir.clone().normalize() : d0.clone().normalize();
  if (Math.abs(d1.z) > 0.9995) d1 = new V3(0, -0.001, Math.sign(d1.z)).normalize();
  const t1 = center ? center.clone() : t0.clone();
  const a = persp.aspect || 1, vf = persp.fov * D2R, hf = 2 * Math.atan(Math.tan(vf / 2) * a);
  const r = radius || null;
  const dist1 = r ? Math.max(r / Math.sin(Math.min(vf, hf) / 2) * 1.08, 10) : dist0;
  const oh0 = orthoH / ortho.zoom, oh1 = r ? r * 1.1 * Math.max(1, 1 / a) : oh0;
  const q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion().setFromUnitVectors(d0.clone().normalize(), d1);
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = instant || reduce ? 0 : 320, start = performance.now();
  const step = now => {
    const s = dur ? Math.min(1, (now - start) / dur) : 1, e = s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2;
    const q = q0.clone().slerp(q1, e), dir2 = d0.clone().normalize().applyQuaternion(q);
    const t = t0.clone().lerp(t1, e), dist = dist0 + (dist1 - dist0) * e;
    controls.target.copy(t);
    c.position.copy(t).addScaledVector(dir2, isOrtho ? Math.max(dist, 2000) : dist);
    if (isOrtho) { ortho.zoom = 1; orthoH = oh0 + (oh1 - oh0) * e; applyOrtho(); }
    c.lookAt(t); controls.update(); render();
    if (s < 1) anim = requestAnimationFrame(step); else anim = null;
  };
  if (anim) cancelAnimationFrame(anim);
  anim = requestAnimationFrame(step);
}
function fitView(dir, instant) {
  let box = sceneBox(false);
  if (box.isEmpty()) box = new THREE.Box3(new V3(-60, -60, 0), new V3(60, 60, 30));
  const sp = box.getBoundingSphere(new THREE.Sphere());
  viewTo(dir, sp.center, Math.max(sp.radius, 10), instant);
}
const VIEW_ISO = new V3(1, -1.25, 0.95);
controls.addEventListener('change', () => requestRender());

/* ================= view cube ================= */
const cubeCanvas = $('#viewcube');
let cubeR = null, cubeScene, cubeCam, cubeMesh;
try {
  cubeR = new THREE.WebGLRenderer({ canvas: cubeCanvas, antialias: true, alpha: true });
  cubeR.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  cubeScene = new THREE.Scene();
  cubeCam = new THREE.OrthographicCamera(-1.55, 1.55, 1.55, -1.55, 0.1, 20);
  cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), []);
  cubeMesh.rotation.x = Math.PI / 2;
  cubeScene.add(cubeMesh);
  const ce = noRay(new THREE.LineSegments(new THREE.EdgesGeometry(cubeMesh.geometry), new THREE.LineBasicMaterial({ color: 0x777777 })));
  cubeMesh.add(ce); cubeMesh.userData.edges = ce;
  const axes = [[[1.15, 0, 0], 0xe5484d], [[0, 1.15, 0], 0x2f9e6a], [[0, 0, 1.15], 0x4f7ae0]];
  axes.forEach(([to, c]) => cubeScene.add(noRay(new THREE.Line(lineGeo([-0.8, -0.8, -0.8, to[0] - 0.8, to[1] - 0.8, to[2] - 0.8]), new THREE.LineBasicMaterial({ color: c })))));
} catch (e) { cubeR = null; $('#cubewrap').hidden = true; }
const CUBE_FACES = ['PRAVÝ', 'LEVÝ', 'HORNÍ', 'DOLNÍ', 'PŘEDNÍ', 'ZADNÍ']; /* local +X -X +Y -Y +Z -Z (cube rotated so local +Y = world +Z) */
function buildCubeMaterials() {
  if (!cubeR) return;
  cubeMesh.material.forEach && cubeMesh.material.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
  cubeMesh.material = CUBE_FACES.map(t0 => { const txt = window.I18N ? I18N.t(t0) : t0;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = css(tok.cube); g.fillRect(0, 0, 128, 128);
    g.strokeStyle = css(tok.line); g.lineWidth = 4; g.strokeRect(2, 2, 124, 124);
    g.fillStyle = css(tok['cube-ink']); g.font = '600 21px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, 64, 66);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
    return new THREE.MeshBasicMaterial({ map: t });
  });
  cubeMesh.userData.edges.material.color.copy(tok.muted);
}
buildCubeMaterials();
function renderCube() {
  if (!cubeR) return;
  const w = cubeCanvas.clientWidth, h = cubeCanvas.clientHeight;
  if (!w || !h) return;
  if (cubeCanvas.width !== Math.round(w * cubeR.getPixelRatio())) cubeR.setSize(w, h, false);
  const c = cam(), d = c.position.clone().sub(controls.target).normalize();
  cubeCam.position.copy(d.multiplyScalar(6)); cubeCam.quaternion.copy(c.quaternion);
  cubeR.render(cubeScene, cubeCam);
}
const cubeRay = new THREE.Raycaster();
function cubeHit(ev) {
  const r = cubeCanvas.getBoundingClientRect();
  cubeRay.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), cubeCam);
  return cubeRay.intersectObject(cubeMesh, false)[0] || null;
}
if (cubeR) {
  let cdown = null;
  cubeCanvas.addEventListener('pointerdown', e => { cdown = { x: e.clientX, y: e.clientY }; });
  cubeCanvas.addEventListener('pointerup', e => {
    if (!cdown || Math.hypot(e.clientX - cdown.x, e.clientY - cdown.y) > 4) { cdown = null; return; }
    cdown = null;
    const h = cubeHit(e); if (!h) return;
    const p = h.point, lim = 0.8 * 0.45;
    const dir = new V3(Math.abs(p.x) > lim ? Math.sign(p.x) : 0, Math.abs(p.y) > lim ? Math.sign(p.y) : 0, Math.abs(p.z) > lim ? Math.sign(p.z) : 0);
    if (dir.lengthSq() === 0) return;
    viewTo(dir, null, null);
  });
}
$('#home').addEventListener('click', () => fitView(VIEW_ISO));

/* ================= render loop ================= */
let queued = false;
function requestRender() { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; render(); }); } }
function render() {
  const c = cam();
  const dist = c.position.distanceTo(controls.target);
  sun.position.copy(c.position).add(new V3(0.3, 0.2, 0.5).multiplyScalar(dist));
  sun.target.position.copy(controls.target);
  if (cmd && cmd.onFrame) cmd.onFrame();
  if (typeof syncFaceBar === 'function') syncFaceBar();
  renderer.render(scene, c);
  renderCube();
  if (sk) { updateDimLabel(); updateSegLabels(); } else if (segLabelsOn) updateSegLabels();
}
let segLabelsOn = false;
/* length and angle labels for the selected polyline */
function updateSegLabels() {
  const box = $('#seglabels');
  const e = sk && sk.f.ents[sk.selEnt];
  if (!e || e.t !== 'poly' || sk.tool) { if (segLabelsOn) { box.innerHTML = ''; segLabelsOn = false; } return; }
  const P = sk.f.plane, n = e.pts.length, segs = e.closed ? n : n - 1, html = [];
  if (segs > 40) { box.innerHTML = ''; return; }
  const scr = e.pts.map(q => toPx(P3(P, q[0], q[1])));
  for (let k = 0; k < segs; k++) {
    const a = e.pts[k], b = e.pts[(k + 1) % n], sa = scr[k], sb = scr[(k + 1) % n];
    html.push(`<span class="seg" style="left:${(sa[0] + sb[0]) / 2}px;top:${(sa[1] + sb[1]) / 2}px">${fmtc(Math.hypot(b[0] - a[0], b[1] - a[1]), 2)} mm · ${fmtc(dirAngle(a, b), 1)}°</span>`);
  }
  for (let k = 0; k < n; k++) {
    if (!e.closed && (k === 0 || k === n - 1)) continue;
    const p = e.pts[k], a = e.pts[(k - 1 + n) % n], b = e.pts[(k + 1) % n];
    const v1 = [a[0] - p[0], a[1] - p[1]], v2 = [b[0] - p[0], b[1] - p[1]], l1 = Math.hypot(...v1), l2 = Math.hypot(...v2);
    if (l1 < 1e-9 || l2 < 1e-9) continue;
    const ang = Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2)))) / D2R;
    html.push(`<span class="vtx" style="left:${scr[k][0]}px;top:${scr[k][1]}px">∠ ${fmtc(ang, 1)}°</span>`);
  }
  box.innerHTML = html.join(''); segLabelsOn = true;
}
function resize() {
  const w = vp.clientWidth, h = vp.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h); persp.aspect = w / h; persp.updateProjectionMatrix(); applyOrtho(); requestRender();
}
new ResizeObserver(resize).observe(vp);

/* ================= picking helpers ================= */
const ray = new THREE.Raycaster();
ray.params.Line = { threshold: 1 };
ray.params.Points = { threshold: 1 };
function evNdc(ev) { const r = dom.getBoundingClientRect(); return new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); }
function evPx(ev) { const r = dom.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
/* world size of the drag arrows so that they stay about the same on screen (a bit larger on touch screens) */
const TOUCH = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
function worldPerPx(p) {
  const h = dom.clientHeight || 600;
  return isOrtho ? (2 * orthoH / ortho.zoom) / h : 2 * cam().position.distanceTo(p) * Math.tan(persp.fov * D2R / 2) / h;
}
function arrowSize(tip) { return worldPerPx(tip) * (TOUCH ? 26 : 20) / 2.6; }
/* parameter along the line a + t*dir closest to the pointer ray, or null when the line points at the viewer */
function lineParam(ev, a, dir) {
  ray.setFromCamera(evNdc(ev), cam());
  const o = ray.ray.origin, r = ray.ray.direction, w0 = a.clone().sub(o), b = dir.dot(r), dd = dir.dot(w0), e = r.dot(w0), den = 1 - b * b;
  return Math.abs(den) < 1e-6 ? null : (b * e - dd) / den;
}
function toPx(p) { const v = p.clone().project(cam()); return [(v.x + 1) / 2 * dom.clientWidth, (1 - v.y) / 2 * dom.clientHeight, v.z]; }
function pickableMeshes() { const hb = cmd && cmd.hideBody; return Array.from(meshes.entries()).filter(([id, e]) => e.mesh.visible || (id === hb && bodiesVisible() && isVis(id))).map(([, e]) => e.mesh); }
function hitBodies(ev) { ray.setFromCamera(evNdc(ev), cam()); return ray.intersectObjects(visibleMeshes(), false)[0] || null; }
function polyOfHit(hit) { const pi = hit.object.userData.triPoly[hit.faceIndex]; return { pi, poly: hit.object.userData.polys[pi] }; }
function chainsFor(polys) { let c = chainCache.get(polys); if (!c) { c = K.chainsOf(polys); chainCache.set(polys, c); } return c; }
function smoothFor(polys) {
  let s = smoothCache.get(polys);
  if (!s) {
    s = new Uint8Array(polys.length);
    const lim = Math.cos(20 * D2R);
    for (const e of K.edgeMapOf(polys).values()) if (e.ps.length === 2) { const d = K.vdot(polys[e.ps[0]].n, polys[e.ps[1]].n); if (d > lim && d < 0.99999) { s[e.ps[0]] = 1; s[e.ps[1]] = 1; } }
    smoothCache.set(polys, s);
  }
  return s;
}
const planeKey = p => [Math.round(p.n[0] * 1e3), Math.round(p.n[1] * 1e3), Math.round(p.n[2] * 1e3), Math.round(p.w * 1e2)].join();
function occluded(p) {
  const v = p.clone().project(cam());
  ray.setFromCamera(new THREE.Vector2(v.x, v.y), cam());
  const h = ray.intersectObjects(pickableMeshes(), false)[0];
  if (!h) return false;
  const d = ray.ray.origin.distanceTo(p);
  return h.distance < d - Math.max(0.15, d * 0.003);
}
function segDist(px, py, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
  let t = L2 ? ((px - a[0]) * dx + (py - a[1]) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t));
  return [Math.hypot(px - (a[0] + dx * t), py - (a[1] + dy * t)), t];
}
function pickEdge(ev, onlyBody) {
  const [mx, my] = evPx(ev), cands = [];
  const pm = new Set(pickableMeshes());
  for (const [id, e] of meshes) {
    if (!pm.has(e.mesh) || (onlyBody && onlyBody !== id)) continue;
    chainsFor(e.polys).forEach((s, si) => {
      let best = Infinity, bp = null, prev = null, prevP = null;
      for (const p of s.pts) {
        const q = toPx(v3(p));
        if (prev && prev[2] < 1 && q[2] < 1) { const [d, t] = segDist(mx, my, prev, q); if (d < best) { best = d; bp = v3(prevP).lerp(v3(p), t); } }
        prev = q; prevP = p;
      }
      if (best < 10) cands.push({ id, si, seg: s, d: best, p: bp });
    });
  }
  cands.sort((a, b) => a.d - b.d);
  for (const c of cands.slice(0, 8)) if (!occluded(c.p)) return c;
  return null;
}
function segLine(pts, color, lift) {
  const arr = [];
  for (let i = 0; i < pts.length - 1; i++) arr.push(...pts[i], ...pts[i + 1]);
  const l = noRay(new THREE.LineSegments(lineGeo(arr), new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true })));
  l.renderOrder = 10; return l;
}
function faceOverlay(polys, keyStr, color, opacity) {
  const sub = polys.filter(p => planeKey(p) === keyStr);
  const m = meshFromPolys(sub, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  noRay(m); m.renderOrder = 5; return m;
}
function clearGroup(g) { while (g.children.length) { const c = g.children.pop(); disposeObj(c); } }

/* ================= UI: prompt, toast, info ================= */
function setPrompt(t) { const p = $('#prompt'); p.textContent = t || ''; p.hidden = !t; }
let toastT;
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3200); }
function updateInfo() {
  const el = $('#info');
  if (faceMode && selFace) { el.textContent = faceText(selFace); el.hidden = false; return; }
  if (sel.size === 1) {
    const b = bodyById([...sel][0]); if (!b) { el.hidden = true; return; }
    const bb = K.bbox(b.polys), vol = K.signedVolume(b.polys) / 1000;
    el.innerHTML = `<b></b> · objem ${fmtc(vol, 2)} cm³ · povrch ${fmtc(K.surfaceArea(b.polys) / 100, 2)} cm² · ${fmtc(bb.max[0] - bb.min[0], 1)} × ${fmtc(bb.max[1] - bb.min[1], 1)} × ${fmtc(bb.max[2] - bb.min[2], 1)} mm`;
    $('b', el).textContent = bodyName(b); el.hidden = false;
  } else if (sel.size > 1) { el.textContent = `Vybráno těles: ${sel.size}`; el.hidden = false; }
  else el.hidden = true;
}

/* ================= browser panel ================= */
const open = { doc: true, bodies: true, sketches: true };
let renaming = null;
function renderBrowser() {
  const tree = $('#tree'); tree.innerHTML = '';
  const li = (cls, html) => { const n = document.createElement('li'); n.className = 'node ' + cls; n.innerHTML = html; tree.appendChild(n); return n; };
  const tw = (k, has) => `<button class="tw${has ? '' : ' none'}" data-tw="${k}" aria-label="Rozbalit">${svg(open[k] ? 'chev' : 'chevr', 14)}</button>`;
  const eye = (k, on) => `<button class="eye" data-eye="${k}" aria-label="${on ? 'Skrýt' : 'Zobrazit'}" title="${on ? 'Skrýt' : 'Zobrazit'}">${svg(on ? 'eye' : 'eyeoff', 15)}</button>`;
  const d = li('lv1', `${tw('doc', true)}<span class="ico">${svg('doc', 16)}</span><span class="lbl"></span>`);
  $('.lbl', d).textContent = doc.name || 'Bez názvu';
  if (!open.doc) return;
  li('lv2' + (doc.vis.__origin === false ? ' off' : ''), `${tw('', false)}${eye('__origin', doc.vis.__origin !== false)}<span class="ico">${svg('origin', 16)}</span><span class="lbl">Počátek</span>`);
  const bodies = cur.bodies;
  li('lv2' + (bodiesVisible() ? '' : ' off'), `${tw('bodies', bodies.length)}${eye('__bodies', bodiesVisible())}<span class="ico">${svg('folder', 16)}</span><button class="lbl" data-selall="1" title="Klepnutím vyberete všechna tělesa">Tělesa</button><span class="cnt">${bodies.length}</span>`);
  if (open.bodies) for (const b of bodies) {
    const n = li('lv3' + (sel.has(b.id) ? ' sel' : '') + (isVis(b.id) ? '' : ' off'), `${eye(b.id, isVis(b.id))}<span class="ico">${svg('bodyi', 16)}</span>`);
    if (renaming === b.id) {
      const inp = document.createElement('input'); inp.className = 'ren'; inp.value = bodyName(b); inp.maxLength = 40; inp.id = 'ren-' + b.id; n.appendChild(inp);
      setTimeout(() => { inp.focus(); inp.select(); }, 0);
      const done = ok => { if (renaming !== b.id) return; renaming = null; if (ok && inp.value.trim()) { doc.names[b.id] = inp.value.trim(); pushHist(); saveDoc(); } refresh(); };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') done(true); else if (e.key === 'Escape') done(false); e.stopPropagation(); });
      inp.addEventListener('blur', () => done(true));
    } else {
      const lb = document.createElement('button'); lb.className = 'lbl'; lb.textContent = bodyName(b); lb.dataset.body = b.id; lb.title = 'Dvojklikem přejmenujete'; n.appendChild(lb);
    }
  }
  const sks = Array.from(cur.sketches.values());
  li('lv2' + (sketchesVisible() ? '' : ' off'), `${tw('sketches', sks.length)}${eye('__sketches', sketchesVisible())}<span class="ico">${svg('folder', 16)}</span><span class="lbl">Skici</span><span class="cnt">${sks.length}</span>`);
  if (open.sketches) for (const f of sks) {
    const selSk = (cmd && cmd.sketch === f.id) || (tlSel !== null && doc.features[tlSel] && doc.features[tlSel].id === f.id);
    const n = li('lv3' + (selSk ? ' sel' : '') + (isVis(f.id) ? '' : ' off'), `${eye(f.id, isVis(f.id))}<span class="ico">${svg('sketchi', 16)}</span>`);
    const lb = document.createElement('button'); lb.className = 'lbl'; lb.textContent = f.name || 'Skica'; lb.dataset.sketch = f.id; lb.title = 'Klepnutím vyberete (např. pro Vysunutí), dvojklikem upravíte skicu'; n.appendChild(lb);
  }
}
$('#tree').addEventListener('click', e => {
  const t = e.target.closest('[data-tw]'); if (t && t.dataset.tw) { open[t.dataset.tw] = !open[t.dataset.tw]; renderBrowser(); return; }
  const ey = e.target.closest('[data-eye]');
  if (ey) { const k = ey.dataset.eye; doc.vis[k] = doc.vis[k] === false; if (doc.vis[k] === true) delete doc.vis[k]; saveDoc(); syncSketches(); styleBodies(); renderBrowser(); return; }
  const b = e.target.closest('[data-body]');
  if (b) { bodyClick(b.dataset.body, e.ctrlKey || e.metaKey || e.shiftKey); return; }
  if (e.target.closest('[data-selall]')) { selectAll(); return; }
  const sk1 = e.target.closest('[data-sketch]');
  if (sk1) {
    if (cmd && cmd.onSketch) { cmd.onSketch(sk1.dataset.sketch); return; }
    if (cmd || sk) return;
    const i = doc.features.findIndex(x => x.id === sk1.dataset.sketch);
    if (i >= 0) { sel = new Set(); tlSel = i; styleBodies(); renderBrowser(); renderTimeline(); updateInfo(); }
  }
});
$('#tree').addEventListener('dblclick', e => {
  const b = e.target.closest('[data-body]'); if (b && !cmd && !sk) { renaming = b.dataset.body; renderBrowser(); return; }
  const s = e.target.closest('[data-sketch]');
  if (s && !cmd && !sk) { const i = doc.features.findIndex(f => f.id === s.dataset.sketch); if (i >= 0) editFeature(i); }
});
$('#bw-toggle').addEventListener('click', () => {
  const bw = $('#browser'), narrow = window.matchMedia('(max-width: 760px)').matches;
  if (narrow) bw.classList.toggle('open-m'); else bw.classList.toggle('collapsed');
  const c = narrow ? !bw.classList.contains('open-m') : bw.classList.contains('collapsed');
  $('#bw-toggle').innerHTML = svg(c ? 'chevr' : 'chev', 14);
});

function bodyClick(id, multi) {
  if (cmd && cmd.onBody) { cmd.onBody(id); return; }
  if (cmd || sk) return;
  if (multi) { if (sel.has(id)) sel.delete(id); else sel.add(id); } else sel = new Set([id]);
  tlSel = null; styleBodies(); renderBrowser(); renderTimeline(); updateInfo();
}

/* ================= timeline ================= */
function featureTitle(i) {
  const f = doc.features[i];
  if (f.type === 'sketch') return f.name || 'Skica';
  let n = 0; for (let j = 0; j <= i; j++) if (doc.features[j].type === f.type) n++;
  return Engine.FEATURE_LABEL[f.type] + ' ' + n;
}
const TL_ICON = { offsetface: 'pressface', center: 'center', scale: 'scale', thread: 'thread', rotate: 'rotate', revolve: 'revolve', mirror: 'mirror', pattern: 'pattern', import: 'import', sketch: 'sketchi', extrude: 'extrude', box: 'box', cylinder: 'cylinder', sphere: 'sphere', cone: 'cone', torus: 'torus', fillet: 'fillet', chamfer: 'chamfer', combine: 'combine', move: 'move', del: 'del' };
function renderTimeline() {
  const tr = $('#tltrack'); tr.innerHTML = '';
  const m = viewMarker === null ? doc.marker : viewMarker;
  if (!doc.features.length) { tr.innerHTML = '<span class="tlempty">Časová osa je prázdná. Začněte příkazem Vytvořit skicu.</span>'; $('#tlname').textContent = ''; return; }
  const mark = () => { const s = document.createElement('span'); s.className = 'tlmark'; s.title = 'Značka historie'; tr.appendChild(s); };
  doc.features.forEach((f, i) => {
    if (i === m) mark();
    const b = document.createElement('button');
    const err = i < m ? cur.status[i] : null;
    b.className = 'tli' + (i >= m ? ' rolled' : '') + (f.off ? ' off' : '') + (err ? ' err' : '') + (tlSel === i ? ' sel' : '');
    b.dataset.i = i;
    b.title = featureTitle(i) + (f.off ? ' (potlačeno)' : '') + (err ? ' – chyba: ' + err : '') + '\nDvojklikem upravíte, pravým tlačítkem další volby';
    b.innerHTML = `<span class="ico">${svg(TL_ICON[f.type] || 'box', 19)}</span>`;
    tr.appendChild(b);
  });
  if (m >= doc.features.length) mark();
  $('#tlname').textContent = tlSel !== null && doc.features[tlSel] ? featureTitle(tlSel) : '';
  const btns = { first: m > 0, prev: m > 0, next: m < doc.features.length, last: m < doc.features.length };
  for (const k in btns) $('#tl-' + k).disabled = !btns[k] || !!cmd || !!sk;
}
$('#tltrack').addEventListener('click', e => {
  const b = e.target.closest('.tli'); if (!b || cmd || sk) return;
  const i = +b.dataset.i, f = doc.features[i];
  tlSel = i;
  const body = f.type === 'fillet' || f.type === 'chamfer' ? f.body : f.type === 'combine' ? f.target : (meshes.has(f.id) ? f.id : null);
  sel = body && meshes.has(body) ? new Set([body]) : new Set();
  styleBodies(); renderBrowser(); renderTimeline(); updateInfo();
});
$('#tltrack').addEventListener('dblclick', e => { const b = e.target.closest('.tli'); if (b && !cmd && !sk) editFeature(+b.dataset.i); });
$('#tltrack').addEventListener('contextmenu', e => {
  e.preventDefault();
  const b = e.target.closest('.tli'); if (!b || cmd || sk) return;
  const i = +b.dataset.i, f = doc.features[i];
  tlSel = i; renderTimeline();
  showCtx(e.clientX, e.clientY, [
    ['Upravit prvek', () => editFeature(i), f.type === 'del'],
    [f.off ? 'Obnovit prvek' : 'Potlačit prvek', () => { f.off = !f.off; if (!f.off) delete f.off; commit(); }],
    ['Přesunout značku sem', () => { doc.marker = i + 1; commit(); }],
    null,
    ['Odstranit prvek', () => deleteFeature(i)]
  ]);
});
function deleteFeature(i) {
  doc.features.splice(i, 1);
  if (i < doc.marker) doc.marker--;
  tlSel = null; commit();
}
function moveMarker(m) { doc.marker = Math.max(0, Math.min(doc.features.length, m)); tlSel = null; commit(); }
$('#tl-first').addEventListener('click', () => moveMarker(0));
$('#tl-prev').addEventListener('click', () => moveMarker(doc.marker - 1));
$('#tl-next').addEventListener('click', () => moveMarker(doc.marker + 1));
$('#tl-last').addEventListener('click', () => moveMarker(doc.features.length));

function showCtx(x, y, items) {
  const m = $('#ctxmenu'); m.innerHTML = '';
  for (const it of items) {
    if (!it) { m.appendChild(document.createElement('hr')); continue; }
    const b = document.createElement('button'); b.textContent = it[0]; b.disabled = !!it[2];
    b.addEventListener('click', () => { m.hidden = true; it[1](); });
    m.appendChild(b);
  }
  m.hidden = false;
  const w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = Math.max(8, Math.min(x, window.innerWidth - w - 8)) + 'px';
  m.style.top = Math.max(8, Math.min(y - h, window.innerHeight - h - 8)) + 'px';
}
document.addEventListener('pointerdown', e => { const m = $('#ctxmenu'); if (!m.hidden && !m.contains(e.target)) m.hidden = true; });

/* ================= ribbon ================= */
const RIBBON = {
  solid: [
    ['Vytvořit', [['sketch', 'Vytvořit skicu', 'S'], ['extrude', 'Vysunutí', 'E'], ['revolve', 'Rotace'], ['thread', 'Závit', 'T'], ['box', 'Krychle'], ['cylinder', 'Válec'], ['sphere', 'Koule'], ['cone', 'Kužel'], ['torus', 'Torus']]],
    ['Upravit', [['fillet', 'Zaoblení', 'F'], ['chamfer', 'Zkosení'], ['combine', 'Kombinovat'], ['move', 'Přesunout', 'M'], ['rotate', 'Otočit', 'R'], ['scale', 'Měřítko'], ['center', 'Zarovnat'], ['facemode', 'Plochy', 'G'], ['mirror', 'Zrcadlit'], ['pattern', 'Pole'], ['del', 'Odstranit', 'Del']]],
    ['Výběr', [['selall', 'Vybrat vše', 'Ctrl+A']]],
    ['Kontrola', [['measure', 'Měřit', 'I']]],
    ['Vložit', [['import', 'Importovat']]]
  ],
  sketch: [
    ['Vytvořit', [['line', 'Čára', 'L'], ['spline', 'Křivka', 'K'], ['rect', 'Obdélník', 'R'], ['circle', 'Kružnice', 'C'], ['ellipse', 'Elipsa', 'E'], ['ngon', 'Mnohoúhelník', 'P'], ['slot', 'Drážka', 'D']]],
    ['Upravit', [['skfillet', 'Zaoblit rohy'], ['sktrim', 'Vystřihnout', 'X'], ['skdel', 'Smazat', 'Del']]],
    ['Vložit', [['skimport', 'DXF / SVG']]],
    ['Dokončit', [['finish', 'Dokončit skicu', 'Enter']]]
  ]
};
function renderRibbon() {
  const mode = sk ? 'sketch' : 'solid', body = $('#rbody');
  $('#tab-sketch').hidden = !sk;
  $('#tab-solid').setAttribute('aria-selected', String(!sk));
  $('#tab-sketch').setAttribute('aria-selected', String(!!sk));
  $('#tab-solid').disabled = !!sk;
  body.innerHTML = RIBBON[mode].map(([g, items]) => `<div class="rgroup"><div class="rtools">${items.map(([id, label, key]) =>
    `<button class="tool${id === 'finish' ? ' finish' : ''}" data-cmd="${id}" title="${label}${key ? ' (' + key + ')' : ''}"${sk && SK_TOOLS.includes(id) ? ` aria-pressed="${sk.tool === id}"` : ''}${!sk && id === 'facemode' ? ` aria-pressed="${faceMode}"` : ''}><span class="ico">${svg(id, 26)}</span><span>${label}</span></button>`).join('')}</div><div class="rlabel">${g}</div></div>`).join('');
}
$('#rbody').addEventListener('click', e => { const b = e.target.closest('[data-cmd]'); if (b) runCommand(b.dataset.cmd); });
const SK_TOOLS = ['line', 'spline', 'rect', 'circle', 'ellipse', 'ngon', 'slot', 'skfillet', 'sktrim'];
function runCommand(id) {
  $('#ctxmenu').hidden = true;
  if (sk) {
    if (id === 'finish') finishSketch(true);
    else if (id === 'skdel') deleteSketchEntity();
    else if (SK_TOOLS.includes(id)) setSketchTool(sk.tool === id ? null : id);
    else if (id === 'skimport') pickImportFile('.dxf,.svg');
    return;
  }
  if (cmd) endCmd(false);
  switch (id) {
    case 'sketch': startSketchCmd(); break;
    case 'extrude': startExtrude(); break;
    case 'box': case 'cylinder': case 'sphere': case 'cone': case 'torus': startPrimitive(id); break;
    case 'fillet': case 'chamfer': startEdgeMod(id); break;
    case 'combine': startCombine(); break;
    case 'move': startMove(); break;
    case 'rotate': startRotate(); break;
    case 'thread': startThread(); break;
    case 'scale': startScale(); break;
    case 'center': startCenter(); break;
    case 'selall': if (faceMode) setFaceMode(false); selectAll(); break;
    case 'facemode': setFaceMode(!faceMode); break;
    case 'pressface': startPressFace(); break;
    case 'revolve': startRevolve(); break;
    case 'mirror': startMirror(); break;
    case 'pattern': startPattern(); break;
    case 'measure': startMeasure(); break;
    case 'import': pickImportFile('.stl,.obj,.dxf,.svg,.zip'); break;
    case 'del': deleteSelected(); break;
  }
}

/* ================= dialog framework ================= */
let dlg = null;
function openDialog(spec) {
  const el = $('#dialog'); el.hidden = false;
  const rows = spec.fields.map(f => {
    const id = 'dlg-' + f.id;
    switch (f.k) {
      case 'sel': return `<div class="frow" data-row="${f.id}"><span class="fl">${f.label}</span><button class="selbtn" id="${id}" data-sel="${f.id}"><span class="dot"></span><span class="tx"></span></button></div>`;
      case 'num': return `<div class="frow" data-row="${f.id}"><label for="${id}">${f.label}</label><span class="fnum"><input id="${id}" data-f="${f.id}" inputmode="decimal" autocomplete="off"><span class="u">${f.unit || 'mm'}</span></span></div>`;
      case 'xyz': return `<div class="frow" data-row="${f.id}"><span class="fl">${f.label}</span><div class="xyz">${['x', 'y', 'z'].map((a, j) => `<span class="fnum"><span class="ax ax-${a}">${a.toUpperCase()}</span><input id="${id}-${j}" data-f="${f.id}" data-j="${j}" inputmode="decimal" autocomplete="off" aria-label="${f.label} ${a.toUpperCase()}"></span>`).join('')}</div></div>`;
      case 'opt': return `<div class="frow" data-row="${f.id}"><label for="${id}">${f.label}</label><select class="fsel" id="${id}" data-f="${f.id}">${f.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>`;
      case 'seg': return `<div class="frow" data-row="${f.id}"><span class="fl">${f.label}</span><div class="seg" id="${id}" data-seg="${f.id}">${f.options.map(([v, l]) => `<button data-v="${v}" aria-pressed="false">${l}</button>`).join('')}</div></div>`;
      case 'btns': return `<div class="frow" data-row="${f.id}"><span class="fl">${f.label}</span><div class="btnrow${f.options.length === 1 ? ' one' : ''}">${f.options.map(([v, l]) => `<button class="btn sm" data-btn="${f.id}" data-v="${v}" aria-pressed="false">${l}</button>`).join('')}</div></div>`;
      case 'chk': return `<label class="chk" data-row="${f.id}"><input type="checkbox" id="${id}" data-f="${f.id}"><span>${f.label}</span></label>`;
      case 'note': return `<div class="note" id="${id}"></div>`;
    }
    return '';
  }).join('');
  el.innerHTML = `<div class="phead"><span class="ico">${svg(spec.icon, 18)}</span><span class="t"></span><button class="ibtn" data-act="cancel" aria-label="Zavřít">${svg('close', 14)}</button></div>
    <div class="dbody">${rows}</div>
    <div class="dfoot"><button class="btn" data-act="cancel">Zrušit</button><button class="btn primary" data-act="ok">OK</button></div>`;
  $('.phead .t', el).textContent = spec.title;
  dlg = {
    spec,
    get(id) {
      const f = spec.fields.find(x => x.id === id); if (!f) return undefined;
      if (f.k === 'num') return parseNum($('#dlg-' + id).value);
      if (f.k === 'xyz') return [0, 1, 2].map(j => parseNum($(`#dlg-${id}-${j}`).value) || 0);
      if (f.k === 'opt') return $('#dlg-' + id).value;
      if (f.k === 'chk') return $('#dlg-' + id).checked;
      if (f.k === 'seg') { const b = $(`#dlg-${id} [aria-pressed="true"]`); return b ? b.dataset.v : null; }
      return undefined;
    },
    set(id, v) {
      const f = spec.fields.find(x => x.id === id); if (!f) return;
      if (f.k === 'num') { const el2 = $('#dlg-' + id); if (document.activeElement !== el2) el2.value = fmtc(v, 3); }
      else if (f.k === 'xyz') v.forEach((x, j) => { const el2 = $(`#dlg-${id}-${j}`); if (document.activeElement !== el2) el2.value = fmtc(x, 3); });
      else if (f.k === 'opt') $('#dlg-' + id).value = v;
      else if (f.k === 'chk') $('#dlg-' + id).checked = !!v;
      else if (f.k === 'seg') $$(`#dlg-${id} button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      else if (f.k === 'note') { const n = $('#dlg-' + id); n.textContent = v || ''; n.classList.toggle('err', !!(v && v.startsWith('!'))); if (v && v.startsWith('!')) n.textContent = v.slice(1); }
      else if (f.k === 'sel') { const b = $('#dlg-' + id); $('.tx', b).textContent = v.text; b.classList.toggle('has', !!v.has); b.classList.toggle('active', !!v.active); }
    },
    okEnabled(on) { $('[data-act="ok"]', el).disabled = !on; },
    setOptions(id, options, value) { const sel = $('#dlg-' + id); sel.innerHTML = options.map(([v, l]) => `<option value="${v}">${l}</option>`).join(''); if (value !== undefined) sel.value = String(value); },
    show(id, on) { const r = $(`#dialog [data-row="${id}"]`); if (r) r.hidden = !on; },
    okLabel(t) { $('[data-act="ok"]', el).textContent = t; }
  };
  spec.fields.forEach(f => { if (f.value !== undefined) dlg.set(f.id, f.value); });
  return dlg;
}
function closeDialog() { const el = $('#dialog'); el.hidden = true; el.innerHTML = ''; dlg = null; }
$('#dialog').addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (a) { if (a.dataset.act === 'ok') { if (sk) finishSketch(true); else okCmd(); } else { if (sk) finishSketch(false); else endCmd(false); } return; }
  const sb = e.target.closest('[data-sel]'); if (sb && dlg && dlg.spec.onSel) { dlg.spec.onSel(sb.dataset.sel); return; }
  const bt = e.target.closest('[data-btn]'); if (bt && dlg && dlg.spec.onBtn) { dlg.spec.onBtn(bt.dataset.btn, bt.dataset.v); return; }
  const sg = e.target.closest('[data-seg] button');
  if (sg && dlg) { const id = sg.parentElement.dataset.seg; dlg.set(id, sg.dataset.v); dlg.spec.onChange && dlg.spec.onChange(id); }
});
$('#dialog').addEventListener('input', e => { const f = e.target.dataset && e.target.dataset.f; if (f && dlg && dlg.spec.onChange && e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT') dlg.spec.onChange(f, true); });
$('#dialog').addEventListener('change', e => {
  const f = e.target.dataset && e.target.dataset.f; if (f && dlg && dlg.spec.onChange) dlg.spec.onChange(f);
  if (sk && e.target.dataset.ent) onPaletteChange(e.target);
  if (sk && e.target.id === 'pal-ngon') { const v = Math.round(parseNum(e.target.value)); if (v >= 3 && v <= 64) sk.ngonN = v; e.target.value = sk.ngonN; redrawSketch(); }
  if (sk && e.target.id === 'pal-fr') { const v = parseNum(e.target.value); if (v > 0) sk.frR = v; e.target.value = fmtc(sk.frR, 3); }
});
$('#dialog').addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); e.target.blur(); if (sk) return; setTimeout(okCmd, 0); }
  else if (e.key === 'Escape') { e.preventDefault(); e.target.blur(); }
});

/* ================= command lifecycle ================= */
let cmd = null;
function beginCmd(c) {
  cmd = c; tlSel = null;
  if (c.editIndex !== undefined && c.editIndex !== null) { viewMarker = c.editIndex; refresh(); }
  renderTimeline(); updateUndo();
}
function endCmd(applied) {
  if (!cmd) return;
  const c = cmd; cmd = null;
  if (c.cleanup) c.cleanup();
  closeDialog(); clearGroup(G.overlay); clearGroup(G.preview); setPrompt(''); bodyTint.clear();
  transform.detach();
  G.planes.visible = false;
  if (!applied && viewMarker !== null) { viewMarker = null; refresh(); }
  else { styleBodies(); renderTimeline(); updateUndo(); }
  dom.style.cursor = '';
}
function okCmd() {
  if (!cmd || !cmd.ok) return;
  const f = cmd.ok();
  if (!f) return;
  const c = cmd;
  if (c.editIndex !== undefined && c.editIndex !== null) doc.features[c.editIndex] = f;
  else { doc.features.splice(doc.marker, 0, f); doc.marker++; }
  if (c.after) c.after(f);
  viewMarker = null;
  endCmd(true);
  commit();
}
function editFeature(i) {
  const f = doc.features[i]; if (!f) return;
  if (cmd) endCmd(false);
  const ef = clone(f);
  switch (f.type) {
    case 'sketch': viewMarker = i; refresh(); enterSketch(ef, i); break;
    case 'extrude': startExtrude(i, ef); break;
    case 'box': case 'cylinder': case 'sphere': case 'cone': case 'torus': startPrimitive(f.type, i, ef); break;
    case 'fillet': case 'chamfer': startEdgeMod(f.type, i, ef); break;
    case 'combine': startCombine(i, ef); break;
    case 'move': startMove(i, ef); break;
    case 'rotate': startRotate(i, ef); break;
    case 'thread': startThread(i, ef); break;
    case 'scale': startScale(i, ef); break;
    case 'center': startCenter(i, ef); break;
    case 'offsetface': startPressFace(i, ef); break;
    case 'revolve': startRevolve(i, ef); break;
    case 'mirror': startMirror(i, ef); break;
    case 'pattern': startPattern(i, ef); break;
    case 'import': startImportMesh(null, i, ef); break;
    default: toast('Tento prvek nemá parametry k úpravě.');
  }
}
const OPS = [['new', 'Nové těleso'], ['join', 'Spojit'], ['cut', 'Vyříznout'], ['intersect', 'Průnik']];
const OP_COLOR = op => (op === 'cut' ? tok.danger : op === 'intersect' ? tok.orange : tok.accent);
function previewMesh(polys, op) {
  const m = meshFromPolys(polys, new THREE.MeshStandardMaterial({ color: OP_COLOR(op).clone(), transparent: true, opacity: 0.5, roughness: 0.5, metalness: 0.05, depthWrite: false, side: THREE.DoubleSide }));
  noRay(m);
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(K.edgeSegments(polys), 3));
  m.add(noRay(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: OP_COLOR(op).clone() }))));
  m.renderOrder = 3; return m;
}
const anyOverlap = tool => cur.bodies.some(b => isVis(b.id) && Engine.overlaps(b.polys, tool));
const snapV = v => (settings.gridSnap ? Math.round(v / settings.snap) * settings.snap : Math.round(v * 1000) / 1000);

/* ================= sketch: plane pick ================= */
function startSketchCmd() {
  const c = {
    hover: null,
    init() {
      G.planes.visible = true;
      setPrompt('Vyberte rovinu počátku nebo rovinnou plochu tělesa');
      openDialog({ title: 'Vytvořit skicu', icon: 'sketch', fields: [{ k: 'note', id: 'n', value: 'Klepněte na jednu z rovin XY, XZ, YZ nebo na rovinnou plochu modelu.' }] }).okEnabled(false);
      requestRender();
    },
    pick(ev) {
      ray.setFromCamera(evNdc(ev), cam());
      const hb = hitBodies(ev);
      ray.setFromCamera(evNdc(ev), cam());
      const hp = ray.intersectObjects(planeMeshes, false)[0];
      if (hb && (!hp || hb.distance <= hp.distance + 1e-6)) {
        const { pi, poly } = polyOfHit(hb), polys = hb.object.userData.polys;
        if (smoothFor(polys)[pi]) return { bad: true };
        return { face: true, plane: planeFromPoly(poly), polys, key: planeKey(poly) };
      }
      if (hp) return { plane: hp.object.userData.plane, mesh: hp.object };
      return null;
    },
    onMove(ev) {
      const p = this.pick(ev);
      clearGroup(G.overlay);
      planeMeshes.forEach(m => { m.material.opacity = 0.16; });
      dom.style.cursor = p && !p.bad ? 'pointer' : '';
      if (!p || p.bad) return requestRender();
      if (p.face) G.overlay.add(faceOverlay(p.polys, p.key, tok.accent, 0.35));
      else p.mesh.material.opacity = 0.38;
      requestRender();
    },
    onClick(ev) {
      const p = this.pick(ev);
      if (!p) return;
      if (p.bad) { toast('Skicu lze umístit jen na rovinnou plochu.'); return; }
      endCmd(true);
      planeMeshes.forEach(m => { m.material.opacity = 0.16; });
      const n = doc.features.filter(f => f.type === 'sketch').length + 1;
      enterSketch({ id: newId(), type: 'sketch', name: 'Skica ' + n, plane: p.plane, ents: [] }, null);
    },
    cleanup() { planeMeshes.forEach(m => { m.material.opacity = 0.16; }); }
  };
  beginCmd(c); c.init();
}

/* ================= sketch mode ================= */
let sk = null; /* {f, editIndex, tool, draft, selEnt, hoverPt} */
const skGridMat = { minor: null, major: null };
function enterSketch(f, editIndex) {
  sk = { f, editIndex, tool: null, draft: null, selEnt: -1, cursor: null, snapPt: null, ngonN: 6, frR: 2 };
  if (!f.ents) f.ents = [];
  sel = new Set(); styleBodies();
  G.grid.visible = false;
  buildSketchGrid();
  syncSketches();
  renderRibbon(); renderTimeline(); updateUndo(); updateInfo();
  openPalette();
  redrawSketch();
  setSketchTool(f.ents.length ? null : 'rect');
  const P = f.plane;
  let center = v3(P.o);
  const bb = new THREE.Box3();
  for (const e of f.ents) for (const p of keyPoints([e])) bb.expandByPoint(P3(P, p[0], p[1]));
  if (!bb.isEmpty()) center = bb.getCenter(new V3());
  const rad = bb.isEmpty() ? 70 : Math.max(bb.getSize(new V3()).length() / 2 + 15, 30);
  viewTo(v3(P.n), center, rad);
}
function buildSketchGrid() {
  clearGroup(G.skwork);
  const P = sk.f.plane, ext = 250, step = 10, mi = [], ma = [];
  for (let i = -ext; i <= ext; i += step) {
    const arr = i % 50 === 0 ? ma : mi;
    const a = P3(P, i, -ext, -0.01), b = P3(P, i, ext, -0.01), c = P3(P, -ext, i, -0.01), d = P3(P, ext, i, -0.01);
    arr.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z);
  }
  const g1 = noRay(new THREE.LineSegments(lineGeo(mi), new THREE.LineBasicMaterial({ color: tok.grid, transparent: true, opacity: 0.8, depthWrite: false })));
  const g2 = noRay(new THREE.LineSegments(lineGeo(ma), new THREE.LineBasicMaterial({ color: tok['grid-major'], transparent: true, opacity: 0.9, depthWrite: false })));
  const ax1 = P3(P, -ext, 0, -0.005), ax2 = P3(P, ext, 0, -0.005), ay1 = P3(P, 0, -ext, -0.005), ay2 = P3(P, 0, ext, -0.005);
  const axU = noRay(new THREE.Line(lineGeo([ax1.x, ax1.y, ax1.z, ax2.x, ax2.y, ax2.z]), new THREE.LineBasicMaterial({ color: 0xe5484d, transparent: true, opacity: 0.6 })));
  const axV = noRay(new THREE.Line(lineGeo([ay1.x, ay1.y, ay1.z, ay2.x, ay2.y, ay2.z]), new THREE.LineBasicMaterial({ color: 0x2f9e6a, transparent: true, opacity: 0.6 })));
  const work = new THREE.Group(); work.name = 'grid'; work.add(g1, g2, axU, axV);
  G.skwork.add(work);
  const live = new THREE.Group(); live.name = 'live'; G.skwork.add(live);
}
function redrawSketch() {
  if (!sk) return;
  const live = G.skwork.getObjectByName('live'); clearGroup(live);
  const P = sk.f.plane, ents = sk.f.ents;
  /* profile fills */
  for (const r of Engine.regions(sk.f)) live.add(regionMesh(P, r, tok.orange, 0.2, 0.01));
  live.add(sketchLines(P, ents, tok.sketch, 0.04));
  if (sk.selEnt >= 0 && ents[sk.selEnt]) live.add(sketchLines(P, [ents[sk.selEnt]], tok.orange, 0.06));
  live.add(pointsObj(P, keyPoints(ents).slice(1), tok.sketch, 5));
  const d = draftEntity();
  if (d) live.add(sketchLines(P, [d], tok.orange, 0.07));
  if (sk.draft && isPolyTool(sk.tool)) live.add(pointsObj(P, sk.draft.pts, tok.orange, 6));
  const se = ents[sk.selEnt];
  if (se && (se.t === 'spline' || se.t === 'poly') && !sk.tool) live.add(pointsObj(P, se.pts, tok.orange, 9));
  for (const e of ents) if (e.t === 'spline' && e !== se) live.add(pointsObj(P, e.pts, tok.sketch, 7));
  if (sk.snapPt) live.add(pointsObj(P, [sk.snapPt], tok.accent, 10));
  requestRender();
}
function regionMesh(P, r, color, opacity, lift) {
  const shape = new THREE.Shape(r.pts.map(p => new THREE.Vector2(p[0], p[1])));
  for (const h of r.holes) shape.holes.push(new THREE.Path(h.pts.map(p => new THREE.Vector2(p[0], p[1]))));
  const g = new THREE.ShapeGeometry(shape);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }));
  m.matrixAutoUpdate = false; m.matrix.copy(planeMatrix(P)).multiply(new THREE.Matrix4().makeTranslation(0, 0, lift || 0));
  m.renderOrder = 4;
  return m;
}
function draftEntity() {
  if (!sk || !sk.draft || !sk.cursor) return null;
  const c = sk.cursor, d = sk.draft;
  const dx = c[0] - d.p[0], dy = c[1] - d.p[1], corner = drawMode(sk.tool) === 'corner';
  /* "from corner": the shape fills the box between the two clicks (circle and polygon use a square anchored at the first click) */
  const sq = () => { const sd = Math.max(Math.abs(dx), Math.abs(dy)); return { cx: d.p[0] + Math.sign(dx || 1) * sd / 2, cy: d.p[1] + Math.sign(dy || 1) * sd / 2, r: sd / 2 }; };
  if (sk.tool === 'rect') return corner ? { t: 'rect', x: d.p[0], y: d.p[1], w: dx, h: dy } : { t: 'rect', x: d.p[0] - dx, y: d.p[1] - dy, w: 2 * dx, h: 2 * dy };
  if (sk.tool === 'circle') { if (corner) { const q = sq(); return { t: 'circle', x: q.cx, y: q.cy, r: q.r }; } return { t: 'circle', x: d.p[0], y: d.p[1], r: Math.hypot(dx, dy) }; }
  if (corner && sk.tool === 'ngon') { const q = sq(); return { t: 'ngon', x: q.cx, y: q.cy, r: q.r, n: sk.ngonN, a: 90 }; }
  if (corner && sk.tool === 'ellipse') return { t: 'ellipse', x: d.p[0] + dx / 2, y: d.p[1] + dy / 2, rx: Math.max(0.01, Math.abs(dx) / 2), ry: Math.max(0.01, Math.abs(dy) / 2), a: 0 };
  if (corner && sk.tool === 'slot') {
    const W = Math.abs(dx), H = Math.abs(dy), cx = d.p[0] + dx / 2, cy = d.p[1] + dy / 2;
    if (W >= H) { const w = Math.max(0.01, H), hl = Math.max(0.005, (W - w) / 2); return { t: 'slot', x1: cx - hl, y1: cy, x2: cx + hl, y2: cy, w }; }
    const w = Math.max(0.01, W), hl = Math.max(0.005, (H - w) / 2); return { t: 'slot', x1: cx, y1: cy - hl, x2: cx, y2: cy + hl, w };
  }
  if (sk.tool === 'line') return { t: 'poly', pts: d.pts.concat([c]), closed: false };
  if (sk.tool === 'spline') return { t: 'spline', pts: d.pts.concat([c]), closed: false };
  if (sk.tool === 'ngon') return { t: 'ngon', x: d.p[0], y: d.p[1], r: Math.hypot(c[0] - d.p[0], c[1] - d.p[1]), n: sk.ngonN, a: Math.atan2(c[1] - d.p[1], c[0] - d.p[0]) / D2R };
  if (sk.tool === 'ellipse') {
    if (!d.p2) { const rx = Math.hypot(c[0] - d.p[0], c[1] - d.p[1]); return { t: 'ellipse', x: d.p[0], y: d.p[1], rx, ry: rx * 0.5, a: Math.atan2(c[1] - d.p[1], c[0] - d.p[0]) / D2R }; }
    const rx = Math.hypot(d.p2[0] - d.p[0], d.p2[1] - d.p[1]);
    return { t: 'ellipse', x: d.p[0], y: d.p[1], rx, ry: Math.max(0.01, slotHalfWidth(d.p, d.p2, c)), a: Math.atan2(d.p2[1] - d.p[1], d.p2[0] - d.p[0]) / D2R };
  }
  if (sk.tool === 'slot') {
    if (!d.p2) return { t: 'poly', pts: [d.p, c], closed: false };
    /* the two clicks are the outer ends of the slot (overall length); the arc centres sit half the width inside */
    const w = Math.max(0.01, 2 * slotHalfWidth(d.p, d.p2, c)), ex = d.p2[0] - d.p[0], ey = d.p2[1] - d.p[1], L = Math.hypot(ex, ey) || 1e-9;
    const ux = ex / L, uy = ey / L, mx = (d.p[0] + d.p2[0]) / 2, my = (d.p[1] + d.p2[1]) / 2, hl = Math.max(0.005, (L - w) / 2);
    return { t: 'slot', x1: mx - ux * hl, y1: my - uy * hl, x2: mx + ux * hl, y2: my + uy * hl, w };
  }
  return null;
}
/* drawing mode of a shape tool: from the corner (box) or from the centre; remembered in the settings */
const DRAW_DEFAULT = { rect: 'corner', circle: 'center', ellipse: 'center', ngon: 'center', slot: 'center' };
const drawMode = t => ((settings.drawModes || {})[t] || DRAW_DEFAULT[t]);
function slotHalfWidth(a, b, c) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  if (L < 1e-9) return Math.hypot(c[0] - a[0], c[1] - a[1]);
  return Math.abs((c[0] - a[0]) * dy - (c[1] - a[1]) * dx) / L;
}
function setSketchTool(t) {
  if (!sk) return;
  sk.tool = t; sk.draft = null; sk.cut = null;
  const PROMPTS = {
    rect: drawMode('rect') === 'center' ? 'Obdélník ze středu: klepněte na střed, pak na roh' : 'Obdélník: klepněte na první roh, pak na protější roh',
    circle: drawMode('circle') === 'corner' ? 'Kružnice z rohu: klepněte na roh čtverce, do kterého se kružnice vepíše, pak na protější roh' : 'Kružnice: klepněte na střed, pak určete poloměr',
    line: 'Čára: klepejte na body; klepnutím na první bod obrys uzavřete, Enter ukončí',
    spline: 'Křivka: klepejte na body, kterými má křivka projít; klepnutím na první bod ji uzavřete, Enter ukončí. Body pak jde přetáhnout.',
    ngon: drawMode('ngon') === 'corner' ? 'Mnohoúhelník z rohu: klepněte na roh čtverce, do kterého se vepíše, pak na protější roh. Počet stran nastavíte v paletě.' : 'Mnohoúhelník: klepněte na střed, pak na vrchol. Počet stran nastavíte v paletě.',
    slot: drawMode('slot') === 'corner' ? 'Drážka z rohu: klepněte na roh, pak na protější roh obdélníku, do kterého se drážka vejde' : 'Drážka: klepněte na jeden konec, pak na druhý konec drážky (celková délka), třetím klepnutím určíte šířku',
    ellipse: drawMode('ellipse') === 'corner' ? 'Elipsa z rohu: klepněte na roh, pak na protější roh obdélníku, do kterého se elipsa vepíše' : 'Elipsa: klepněte na střed, pak na konec hlavní osy, třetím klepnutím určíte šířku',
    skfillet: 'Zaoblení rohů: nastavte poloměr v paletě a klepněte na obdélník, mnohoúhelník nebo uzavřený obrys',
    sktrim: 'Vystřihnout: klepněte na uzavřený tvar, ze kterého se má vystřihovat'
  };
  setPrompt(PROMPTS[t] || 'Klepnutím vyberte prvek skici. Nástroje kreslení jsou v pásu nahoře.');
  dom.style.cursor = t && t !== 'skfillet' && t !== 'sktrim' ? 'crosshair' : '';
  renderRibbon(); redrawSketch(); renderPalette(); $('#dim').hidden = true;
}
function sketchPoint(ev) {
  const P = sk.f.plane;
  ray.setFromCamera(evNdc(ev), cam());
  const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(v3(P.n), v3(P.o));
  const hit = ray.ray.intersectPlane(pl, new V3());
  if (!hit) return null;
  let p = P2(P, hit);
  const [mx, my] = evPx(ev);
  /* snap to existing points */
  let best = null, bd = 10;
  const pts = keyPoints(sk.f.ents).concat(sk.draft && isPolyTool(sk.tool) ? sk.draft.pts : []).concat(sk.draft && sk.draft.p ? [sk.draft.p] : []).concat(sk.draft && sk.draft.p2 ? [sk.draft.p2] : []);
  for (const q of pts) { const s = toPx(P3(P, q[0], q[1])); const d = Math.hypot(s[0] - mx, s[1] - my); if (d < bd) { bd = d; best = q; } }
  sk.snapPt = best;
  if (best) return best.slice();
  return [snapV(p[0]), snapV(p[1])];
}
/* draggable points: vertices of polylines and curves */
function sketchHandleAt(ev) {
  const [mx, my] = evPx(ev), P = sk.f.plane;
  let best = null, bd = 10;
  sk.f.ents.forEach((e, ei) => {
    if (e.t !== 'spline' && e.t !== 'poly') return;
    if (e.t === 'poly' && ei !== sk.selEnt) return;
    e.pts.forEach((q, pi) => { const s = toPx(P3(P, q[0], q[1])); const d = Math.hypot(s[0] - mx, s[1] - my); if (d < bd) { bd = d; best = { ei, pi }; } });
  });
  return best;
}
function sketchDrag(ev) {
  const P = sk.f.plane, e = sk.f.ents[sk.drag.ei]; if (!e) return;
  ray.setFromCamera(evNdc(ev), cam());
  const hit = ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(v3(P.n), v3(P.o)), new V3());
  if (!hit) return;
  const p = P2(P, hit);
  if (sk.uniform && e.pts.length >= 2) {
    const d = sk.drag;
    if (!d.orig) { d.orig = e.pts.map(q => q.slice()); d.c = [0, 1].map(k => d.orig.reduce((t, q) => t + q[k], 0) / d.orig.length); }
    const c = d.c, o = d.orig[d.pi], ov = [o[0] - c[0], o[1] - c[1]], l2 = ov[0] * ov[0] + ov[1] * ov[1];
    if (l2 < 1e-12) return;
    const fct = Math.max(0.01, Math.round(((p[0] - c[0]) * ov[0] + (p[1] - c[1]) * ov[1]) / l2 * 100) / 100), r4 = x => Math.round(x * 1e4) / 1e4;
    e.pts = d.orig.map(q => [r4(c[0] + (q[0] - c[0]) * fct), r4(c[1] + (q[1] - c[1]) * fct)]);
    const el = $('#dim'), px = evPx(ev); el.textContent = `Velikost ${fmtc(fct * 100, 0)} %`; el.hidden = false; el.style.left = px[0] + 'px'; el.style.top = px[1] + 'px';
  } else e.pts[sk.drag.pi] = [snapV(p[0]), snapV(p[1])];
  redrawSketch();
}
function sketchMove(ev) {
  if (!sk.tool) { dom.style.cursor = sketchHandleAt(ev) ? 'move' : ''; }
  if (!sk.tool || sk.tool === 'skfillet' || sk.tool === 'sktrim') { sk.snapPt = null; sk.cursor = null; redrawSketch(); return; }
  sk.cursor = sketchPoint(ev);
  redrawSketch();
  updateDimLabel(ev);
}
let lastPointer = null;
function updateDimLabel(ev) {
  const el = $('#dim');
  if (ev) lastPointer = evPx(ev);
  const d = draftEntity();
  if (!sk || !d || !lastPointer) { el.hidden = true; return; }
  let t = '';
  if (d.t === 'rect') t = `${fmtc(Math.abs(d.w), 2)} × ${fmtc(Math.abs(d.h), 2)} mm`;
  else if (d.t === 'circle') t = `Ø ${fmtc(d.r * 2, 2)} mm`;
  else if (d.t === 'ngon') t = `${d.n}× · R ${fmtc(d.r, 2)} mm`;
  else if (d.t === 'ellipse') t = `${fmtc(d.rx * 2, 2)} × ${fmtc(d.ry * 2, 2)} mm · ${fmtc(d.a, 1)}°`;
  else if (d.t === 'slot') t = `${fmtc(Math.hypot(d.x2 - d.x1, d.y2 - d.y1), 2)} mm · šířka ${fmtc(d.w, 2)} mm`;
  else { const a = d.pts[d.pts.length - 2], b = d.pts[d.pts.length - 1]; t = `${fmtc(Math.hypot(b[0] - a[0], b[1] - a[1]), 2)} mm · ${fmtc(dirAngle(a, b), 1)}°` + (d.t === 'spline' ? ` · ${d.pts.length} bodů` : ''); }
  el.textContent = t; el.hidden = false;
  el.style.left = lastPointer[0] + 'px'; el.style.top = lastPointer[1] + 'px';
}
function sketchClick(ev) {
  if (!sk.tool) { pickSketchEntity(ev); return; }
  if (sk.tool === 'sktrim') { trimClick(ev); return; }
  if (sk.tool === 'skfillet') {
    pickSketchEntity(ev);
    const e = sk.f.ents[sk.selEnt];
    if (!e) return;
    if (e.t === 'rect' || e.t === 'ngon' || (e.t === 'poly' && e.closed)) { e.fr = sk.frR; renderPalette(); redrawSketch(); }
    else toast('Zaoblit lze rohy obdélníku, mnohoúhelníku nebo uzavřeného obrysu.');
    return;
  }
  const p = sketchPoint(ev); if (!p) return;
  sk.cursor = p;
  const f = sk.f;
  if (sk.tool === 'rect') {
    if (!sk.draft) sk.draft = { p };
    else { sk.cursor = p; const d = draftEntity(); if (d && Math.abs(d.w) > 1e-6 && Math.abs(d.h) > 1e-6) { f.ents.push(d); sk.selEnt = f.ents.length - 1; } sk.draft = null; renderPalette(); }
  } else if (sk.tool === 'circle') {
    if (!sk.draft) sk.draft = { p };
    else { sk.cursor = p; const d = draftEntity(); if (d && d.r > 1e-6) { f.ents.push({ ...d, r: Math.round(d.r * 1000) / 1000 }); sk.selEnt = f.ents.length - 1; } sk.draft = null; renderPalette(); }
  } else if (sk.tool === 'ngon') {
    if (!sk.draft) sk.draft = { p };
    else { sk.cursor = p; const d = draftEntity(); if (d && d.r > 1e-6) { f.ents.push({ t: 'ngon', x: d.x, y: d.y, r: Math.round(d.r * 1000) / 1000, n: d.n, a: Math.round(d.a * 100) / 100 }); sk.selEnt = f.ents.length - 1; } sk.draft = null; renderPalette(); }
  } else if ((sk.tool === 'ellipse' || sk.tool === 'slot') && drawMode(sk.tool) === 'corner') {
    if (!sk.draft) sk.draft = { p };
    else {
      sk.cursor = p; const d = draftEntity(), r3 = v => Math.round(v * 1000) / 1000;
      if (d && (d.t === 'slot' ? d.w > 1e-6 : d.rx > 1e-6 && d.ry > 1e-6)) { for (const k of ['x', 'y', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'w']) if (d[k] !== undefined) d[k] = r3(d[k]); f.ents.push(d); sk.selEnt = f.ents.length - 1; }
      sk.draft = null; renderPalette();
    }
  } else if (sk.tool === 'ellipse') {
    if (!sk.draft) sk.draft = { p };
    else if (!sk.draft.p2) { if (Math.hypot(p[0] - sk.draft.p[0], p[1] - sk.draft.p[1]) > 1e-6) sk.draft.p2 = p; }
    else { const d = draftEntity(); if (d && d.rx > 1e-6 && d.ry > 1e-6) { const r3 = v => Math.round(v * 1000) / 1000; f.ents.push({ t: 'ellipse', x: d.x, y: d.y, rx: r3(d.rx), ry: r3(d.ry), a: Math.round(d.a * 100) / 100 }); sk.selEnt = f.ents.length - 1; } sk.draft = null; renderPalette(); }
  } else if (sk.tool === 'slot') {
    if (!sk.draft) sk.draft = { p };
    else if (!sk.draft.p2) { if (Math.hypot(p[0] - sk.draft.p[0], p[1] - sk.draft.p[1]) > 1e-6) sk.draft.p2 = p; }
    else { const d = draftEntity(); if (d && d.t === 'slot') { for (const k of ['x1', 'y1', 'x2', 'y2', 'w']) d[k] = Math.round(d[k] * 1000) / 1000; f.ents.push(d); sk.selEnt = f.ents.length - 1; } sk.draft = null; renderPalette(); }
  } else if (isPolyTool(sk.tool)) {
    if (!sk.draft) sk.draft = { pts: [p] };
    else {
      const first = sk.draft.pts[0], last = sk.draft.pts[sk.draft.pts.length - 1];
      if (sk.draft.pts.length >= 3 && Math.abs(p[0] - first[0]) < 1e-9 && Math.abs(p[1] - first[1]) < 1e-9) { finishPolyline(true); return; }
      if (Math.abs(p[0] - last[0]) > 1e-9 || Math.abs(p[1] - last[1]) > 1e-9) sk.draft.pts.push(p);
    }
  }
  redrawSketch(); updateDimLabel(ev);
}
const isPolyTool = t => t === 'line' || t === 'spline';
const dirAngle = (a, b) => { let d = Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R; if (d < 0) d += 360; return Math.round(d * 100) / 100 % 360; };
function finishPolyline(closed) {
  if (!sk || !isPolyTool(sk.tool) || !sk.draft) return;
  const pts = sk.draft.pts;
  if (pts.length >= 2) { sk.f.ents.push({ t: sk.tool === 'spline' ? 'spline' : 'poly', pts: pts.map(p => p.slice()), closed: !!closed && pts.length >= 3 }); sk.selEnt = sk.f.ents.length - 1; }
  sk.draft = null; renderPalette(); redrawSketch(); $('#dim').hidden = true;
}
function pickSketchEntity(ev) {
  const [mx, my] = evPx(ev), P = sk.f.plane;
  let best = -1, bd = 9;
  entityPolylines(sk.f.ents).forEach((pl, i) => {
    const n = pl.pts.length, m = pl.closed ? n : n - 1;
    for (let k = 0; k < m; k++) {
      const a = toPx(P3(P, pl.pts[k][0], pl.pts[k][1])), b = toPx(P3(P, pl.pts[(k + 1) % n][0], pl.pts[(k + 1) % n][1]));
      const [d] = segDist(mx, my, a, b); if (d < bd) { bd = d; best = i; }
    }
  });
  sk.selEnt = best; renderPalette(); redrawSketch();
  if (best >= 0) { const row = $(`#dialog [data-ent-row="${best}"]`); if (row) row.scrollIntoView({ block: 'nearest' }); }
}
/* ---------- Vystřihnout (cut out part of a closed shape by another shape or by a line) ---------- */
const XY_B = { o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] };
const isClosedEnt = e => e && (['rect', 'circle', 'ngon', 'slot', 'ellipse'].includes(e.t) || ((e.t === 'poly' || e.t === 'spline') && e.closed));
/* 2D boolean of a closed sketch entity with a closed point loop, done with the solid kernel on thin prisms; returns outline loops */
function clip2D(ent, cutPts, op) {
  const A = K.extrudeProfiles([ent], XY_B, 0, 1), B = K.extrudeProfiles([{ t: 'poly', pts: cutPts, closed: true }], XY_B, -1, 2);
  const R = K.boolean(A, B, op), idx = [];
  R.forEach((p, i) => { if (p.n[2] > 0.999 && p.v.every(v => Math.abs(v[2] - 1) < 1e-6)) idx.push(i); });
  const r4 = x => Math.round(x * 1e4) / 1e4;
  return K.faceLoops(R, idx).map(loop => {
    let pts = loop.map(v => [r4(v[0]), r4(v[1])]);
    pts = pts.filter((p, i) => { const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length]; return Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) > 1e-7; });
    return pts;
  }).filter(pts => pts.length >= 3 && Math.abs(K.area2D(pts)) > 1e-6);
}
/* half-plane on the left of an open polyline, closed far away */
function sidePolygon(pts) {
  const L = 1e4, n = pts.length, u = (a, b) => { const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(d[0], d[1]) || 1; return [d[0] / l, d[1] / l]; };
  const d0 = u(pts[1], pts[0]), d1 = u(pts[n - 2], pts[n - 1]);
  const s = [pts[0][0] + d0[0] * L, pts[0][1] + d0[1] * L], e = [pts[n - 1][0] + d1[0] * L, pts[n - 1][1] + d1[1] * L];
  const ch = u(s, e), nl = [-ch[1], ch[0]];
  return [s, ...pts, e, [e[0] + nl[0] * L, e[1] + nl[1] * L], [s[0] + nl[0] * L, s[1] + nl[1] * L]];
}
function sketchRawPoint(ev) {
  const P = sk.f.plane; ray.setFromCamera(evNdc(ev), cam());
  const hit = ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(v3(P.n), v3(P.o)), new V3());
  return hit ? P2(P, hit) : null;
}
function trimClick(ev) {
  const f = sk.f, c = sk.cut || (sk.cut = {});
  if (c.parts) {
    const p = sketchRawPoint(ev); if (!p) return;
    const hitPart = [c.parts.a, c.parts.b].find(list => list.some(i => f.ents[i] && K.inPoly2D(p, K.profilePoints(f.ents[i]))));
    if (!hitPart) { toast('Klepněte dovnitř jedné z částí.'); return; }
    [...hitPart].sort((x, y) => y - x).forEach(i => f.ents.splice(i, 1));
    sk.cut = null; sk.selEnt = -1; setPrompt('Část odstraněna. Klepněte na další tvar, ze kterého se má vystřihovat.'); renderPalette(); redrawSketch(); return;
  }
  pickSketchEntity(ev);
  const i = sk.selEnt; if (i < 0) return;
  if (c.target === undefined || c.target === null || !f.ents[c.target]) {
    if (!isClosedEnt(f.ents[i])) { toast('Nejprve klepněte na uzavřený tvar, ze kterého se má vystřihovat.'); return; }
    c.target = i; setPrompt('Teď klepněte na tvar, který se vystřihne, nebo na čáru, podél které se tvar rozdělí'); return;
  }
  if (i === c.target) return;
  const tgt = f.ents[c.target], cut = f.ents[i];
  try {
    if (isClosedEnt(cut)) {
      const loops = clip2D(tgt, K.profilePoints(cut), 'subtract');
      const rm = [c.target, i].sort((x, y) => y - x); rm.forEach(k => f.ents.splice(k, 1));
      loops.forEach(pts => f.ents.push({ t: 'poly', pts, closed: true }));
      sk.cut = null; sk.selEnt = loops.length ? f.ents.length - 1 : -1;
      toast(loops.length ? 'Vystřiženo.' : 'Tvar byl vystřižen celý.');
      setPrompt('Klepněte na další tvar, ze kterého se má vystřihovat');
    } else {
      const line = entityPolylines([cut])[0].pts;
      if (line.length < 2) return;
      const side = sidePolygon(line), a = clip2D(tgt, side, 'intersect'), b = clip2D(tgt, side, 'subtract');
      if (!a.length || !b.length) { toast('Čára tvar neprotíná, nic se nerozdělilo.'); sk.cut = null; return; }
      const rm = [c.target, i].sort((x, y) => y - x); rm.forEach(k => f.ents.splice(k, 1));
      const ia = a.map(pts => f.ents.push({ t: 'poly', pts, closed: true }) - 1), ib = b.map(pts => f.ents.push({ t: 'poly', pts, closed: true }) - 1);
      sk.cut = { parts: { a: ia, b: ib } }; sk.selEnt = -1;
      setPrompt('Tvar je rozdělený. Klepněte do části, kterou chcete odstranit (Esc nechá obě části)');
    }
  } catch (e) { toast('Vystřižení se nepodařilo: ' + e.message); sk.cut = null; }
  renderPalette(); redrawSketch();
}
function deleteSketchEntity() {
  if (!sk) return;
  if (sk.selEnt < 0 || !sk.f.ents[sk.selEnt]) { toast('Nejprve vyberte prvek skici.'); return; }
  sk.f.ents.splice(sk.selEnt, 1); sk.selEnt = -1; renderPalette(); redrawSketch();
}
const ENT_LABEL = { spline: 'Křivka', rect: 'Obdélník', circle: 'Kružnice', poly: 'Čára', ngon: 'Mnohoúhelník', slot: 'Drážka', ellipse: 'Elipsa' };
function openPalette() {
  const el = $('#dialog'); el.hidden = false; dlg = null;
  el.innerHTML = `<div class="phead"><span class="ico">${svg('sketch', 18)}</span><span class="t">PALETA SKICI</span><button class="ibtn" data-act="cancel" aria-label="Zrušit skicu" title="Zrušit změny">${svg('close', 14)}</button></div>
    <div class="dbody palette"><div id="pal-tool" hidden></div><div class="note" id="pal-note"></div><div class="ents" id="pal-ents"></div></div>
    <div class="dfoot"><button class="btn" data-act="cancel">Zrušit</button><button class="btn primary" data-act="ok">Dokončit skicu</button></div>`;
  renderPalette();
}
function renderPalette() {
  if (!sk) return;
  const box = $('#pal-ents'); if (!box) return;
  const ents = sk.f.ents;
  const nr = Engine.regions(sk.f).length;
  const tb = $('#pal-tool');
  if (tb) {
    const hasMode = !!DRAW_DEFAULT[sk.tool], want = (hasMode ? 'm-' + sk.tool + '-' + drawMode(sk.tool) : '') + (sk.tool === 'ngon' ? '+ngon' : '') + (sk.tool === 'skfillet' ? 'fr' : '');
    if (tb.dataset.kind !== want) {
      tb.dataset.kind = want;
      const modeRow = hasMode ? `<div class="frow"><span class="fl">Kreslit</span><div class="seg"><button data-rmode="corner" aria-pressed="${drawMode(sk.tool) === 'corner'}">Z rohu</button><button data-rmode="center" aria-pressed="${drawMode(sk.tool) === 'center'}">${sk.tool === 'slot' ? 'Od konce ke konci' : 'Ze středu'}</button></div></div>` : '';
      tb.innerHTML = modeRow + (sk.tool === 'ngon' ? `<div class="frow"><label for="pal-ngon">Počet stran</label><span class="fnum"><input id="pal-ngon" value="${sk.ngonN}" inputmode="numeric" autocomplete="off"><span class="u">ks</span></span></div>`
        : want === 'fr' ? `<div class="frow"><label for="pal-fr">Poloměr rohů</label><span class="fnum"><input id="pal-fr" value="${fmtc(sk.frR, 3)}" inputmode="decimal" autocomplete="off"><span class="u">mm</span></span></div>`
        : '');
    }
    tb.hidden = !want;
  }
  $('#pal-note').textContent = ents.length ? `${sk.f.name} · ${nr} ${nr === 1 ? 'uzavřený profil' : nr >= 2 && nr <= 4 ? 'uzavřené profily' : 'uzavřených profilů'}` : 'Skica je prázdná. Nakreslete obdélník, kružnici nebo čáru.';
  const num = (i, k, label, val) => `<label class="fnum" title="${label}"><span class="ax">${label}</span><input id="ent-${i}-${k}" data-ent="${i}" data-k="${k}" value="${fmtc(val, 3)}" inputmode="decimal" autocomplete="off" aria-label="${label}"></label>`;
  const uniChk = i => `<label class="chk"><input type="checkbox" id="ent-${i}-uni" data-ent="${i}" data-k="uni"${sk.uniform ? ' checked' : ''}><span>Tažením bodu měnit velikost rovnoměrně</span></label>`;
  box.innerHTML = ents.map((e, i) => {
    let body = '';
    if (e.t === 'rect') body = `<div class="grid2">${num(i, 'x', 'X', e.x)}${num(i, 'y', 'Y', e.y)}${num(i, 'w', 'Š', e.w)}${num(i, 'h', 'V', e.h)}${num(i, 'fr', 'R', e.fr || 0)}</div>`;
    else if (e.t === 'circle') body = `<div class="grid2">${num(i, 'x', 'X', e.x)}${num(i, 'y', 'Y', e.y)}${num(i, 'd', 'Ø', e.r * 2)}</div>`;
    else if (e.t === 'ngon') body = `<div class="grid2">${num(i, 'x', 'X', e.x)}${num(i, 'y', 'Y', e.y)}${num(i, 'r', 'R', e.r)}${num(i, 'n', 'n', e.n)}${num(i, 'a', '∠', e.a || 0)}${num(i, 'fr', 'Rz', e.fr || 0)}</div>`;
    else if (e.t === 'ellipse') body = `<div class="grid2">${num(i, 'x', 'X', e.x)}${num(i, 'y', 'Y', e.y)}${num(i, 'rx', 'a', e.rx)}${num(i, 'ry', 'b', e.ry)}${num(i, 'a', '∠', e.a || 0)}</div>`;
    else if (e.t === 'slot') { const g = slotGeom(e); body = `<div class="grid2">${num(i, 'scx', 'X', g.cx)}${num(i, 'scy', 'Y', g.cy)}${num(i, 'slen', 'L', g.len)}${num(i, 'w', 'Š', e.w)}${num(i, 'sang', '∠', g.ang)}</div><div class="note">X, Y střed · L celková délka · Š šířka · ∠ natočení</div>`; }
    else if (e.t === 'spline') body = `<div class="note">${e.pts.length} bodů · body přesunete tažením ve skice</div><label class="chk"><input type="checkbox" id="ent-${i}-closed" data-ent="${i}" data-k="closed"${e.closed ? ' checked' : ''}${e.pts.length < 3 ? ' disabled' : ''}><span>Uzavřená křivka</span></label>${uniChk(i)}`;
    else {
      const n = e.pts.length, segs = e.closed ? n : n - 1, rows = [];
      for (let k = 0; k < Math.min(segs, 40); k++) {
        const a = e.pts[k], b = e.pts[(k + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        rows.push(`<div class="seglbl">Úsečka ${k + 1}${e.closed && k === n - 1 ? ' (uzavírací)' : ''}</div><div class="grid2">${num(i, 'L' + k, 'L', L)}${num(i, 'A' + k, '∠', dirAngle(a, b))}</div>`);
      }
      body = `<div class="note">${n} bodů · ${e.closed ? 'uzavřený obrys' : 'otevřená čára (lze použít jako osu rotace)'}</div>${rows.join('')}${e.closed ? `<div class="grid2">${num(i, 'fr', 'R', e.fr || 0)}</div>${uniChk(i)}` : ''}`;
    }
    return `<div class="ent${sk.selEnt === i ? ' sel' : ''}" data-ent-row="${i}"><div class="eh"><span class="ico">${svg(e.t === 'poly' ? 'line' : e.t, 16)}</span>${ENT_LABEL[e.t]} ${i + 1}<button class="ibtn" data-entdel="${i}" aria-label="Smazat prvek" title="Smazat">${svg('skdel', 14)}</button></div>${body}</div>`;
  }).join('');
}
$('#dialog').addEventListener('click', e => {
  if (!sk) return;
  const rm = e.target.closest('[data-rmode]'); if (rm && DRAW_DEFAULT[sk.tool]) { settings.drawModes = { ...(settings.drawModes || {}), [sk.tool]: rm.dataset.rmode }; saveSettings(); sk.draft = null; setSketchTool(sk.tool); return; }
  const d = e.target.closest('[data-entdel]'); if (d) { sk.f.ents.splice(+d.dataset.entdel, 1); sk.selEnt = -1; renderPalette(); redrawSketch(); return; }
  const r = e.target.closest('[data-ent-row]'); if (r && !e.target.closest('input')) { sk.selEnt = +r.dataset.entRow; renderPalette(); redrawSketch(); }
});
/* slot shown as centre, overall length, width and angle; stored as the two arc centres and the width */
function slotGeom(e) {
  const dx = e.x2 - e.x1, dy = e.y2 - e.y1, d = Math.hypot(dx, dy);
  let ang = Math.round(Math.atan2(dy, dx) / D2R * 100) / 100; if (Object.is(ang, -0)) ang = 0;
  return { cx: (e.x1 + e.x2) / 2, cy: (e.y1 + e.y2) / 2, d, len: d + e.w, ang };
}
function setSlotGeom(e, g) {
  const r4 = x => Math.round(x * 1e4) / 1e4, a = g.ang * D2R, h = Math.max(0.005, g.d) / 2;
  e.x1 = r4(g.cx - Math.cos(a) * h); e.y1 = r4(g.cy - Math.sin(a) * h); e.x2 = r4(g.cx + Math.cos(a) * h); e.y2 = r4(g.cy + Math.sin(a) * h);
}
function onPaletteChange(inp) {
  const i = +inp.dataset.ent, k = inp.dataset.k, e = sk.f.ents[i];
  if (k === 'uni') { sk.uniform = inp.checked; renderPalette(); return; }
  if (e && k === 'closed') { e.closed = inp.checked && e.pts.length >= 3; renderPalette(); redrawSketch(); return; }
  const v = parseNum(inp.value);
  if (e && e.t === 'slot' && ['scx', 'scy', 'slen', 'sang', 'w'].includes(k)) {
    if (!isFinite(v)) { renderPalette(); return; }
    const g = slotGeom(e);
    if (k === 'scx') g.cx = v; else if (k === 'scy') g.cy = v; else if (k === 'sang') g.ang = v;
    else if (k === 'slen') { if (v > 0) g.d = Math.max(0.01, v - e.w); }
    else if (k === 'w') { if (v > 0) { const L = g.len; e.w = v; g.d = Math.max(0.01, L - v); } }
    setSlotGeom(e, g); renderPalette(); redrawSketch(); return;
  }
  if (e && e.t === 'poly' && /^[LA]\d+$/.test(k) && isFinite(v)) {
    const j = +k.slice(1), n = e.pts.length, a = e.pts[j], b = e.pts[(j + 1) % n];
    let L = Math.hypot(b[0] - a[0], b[1] - a[1]), A = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const r4 = x => Math.round(x * 1e4) / 1e4;
    if (e.closed && k[0] === 'L') {
      /* stretch: move every vertex lying beyond the middle of the edited side, so parallel sides stay parallel */
      if (!(v > 0) || L < 1e-9) { renderPalette(); return; }
      const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], d = v - L, m = ((a[0] + b[0]) * u[0] + (a[1] + b[1]) * u[1]) / 2;
      e.pts = e.pts.map(q => (q[0] * u[0] + q[1] * u[1] > m + 1e-7 ? [r4(q[0] + u[0] * d), r4(q[1] + u[1] * d)] : q));
      renderPalette(); redrawSketch(); return;
    }
    if (e.closed && k[0] === 'A' && j === n - 1) {
      /* closing side: keep the first point, turn the side around it */
      const A2 = v * D2R; e.pts[j] = [r4(b[0] - L * Math.cos(A2)), r4(b[1] - L * Math.sin(A2))];
      renderPalette(); redrawSketch(); return;
    }
    if (k[0] === 'L') { if (v > 0) L = v; } else A = v * D2R;
    const nb = [a[0] + L * Math.cos(A), a[1] + L * Math.sin(A)], dx = nb[0] - b[0], dy = nb[1] - b[1];
    for (let q = j + 1; q < n; q++) e.pts[q] = [r4(e.pts[q][0] + dx), r4(e.pts[q][1] + dy)];
    renderPalette(); redrawSketch(); return;
  }
  if (!e || !isFinite(v)) { renderPalette(); return; }
  if (k === 'd') { if (v > 0) e.r = v / 2; }
  else if ((k === 'w' || k === 'h') && Math.abs(v) < 1e-6) { /* keep */ }
  else if (k === 'n') e.n = Math.max(3, Math.min(64, Math.round(v)));
  else if (k === 'rx' || k === 'ry') { if (v > 0) e[k] = v; }
  else if (k === 'r' || k === 'fr') { if (v >= 0 && (k === 'fr' || v > 0)) e[k] = v; if (k === 'fr' && v === 0) delete e.fr; }
  else e[k] = v;
  renderPalette(); redrawSketch();
}
function finishSketch(apply) {
  if (!sk) return;
  if (isPolyTool(sk.tool) && sk.draft) finishPolyline(false);
  const s = sk;
  sk = null;
  clearGroup(G.skwork); closeDialog(); setPrompt(''); $('#dim').hidden = true; dom.style.cursor = '';
  G.grid.visible = settings.grid;
  renderRibbon();
  viewMarker = null;
  if (apply && (s.f.ents.length || s.editIndex !== null)) {
    if (s.editIndex !== null) doc.features[s.editIndex] = s.f;
    else { doc.features.splice(doc.marker, 0, s.f); doc.marker++; }
    commit();
  } else refreshBusy();
}

/* ================= extrude ================= */
/* profiles (sketch regions) already consumed by an extrude or revolve; a feature being edited does not count */
function usedRegions(exceptId) {
  const m = new Map();
  for (const x of doc.features) {
    if (x.id === exceptId || !x.sketch || !Array.isArray(x.regions)) continue;
    let st = m.get(x.sketch); if (!st) m.set(x.sketch, st = new Set());
    x.regions.forEach(r => st.add(r));
  }
  return m;
}
function freeRegions(s, used) { const u = used.get(s.id); return Engine.regions(s).filter(r => !u || !u.has(r.ei)); }
function startExtrude(editIndex, f, opts) {
  opts = opts || {};
  const used = usedRegions(f && f.id);
  const c = {
    editIndex, sketch: f ? f.sketch : null, regions: new Set(f ? f.regions : []), dist: f ? f.dist : 10, sym: f ? !!f.sym : false,
    op: f ? f.op : 'new', autoOp: !f, regionMeshes: [], tool: null, arrow: null, drag: null,
    init() {
      /* only sketches with a profile that has not been extruded yet (plus the one of the feature being edited) */
      const sketches = Array.from(cur.sketches.values()).filter(s => freeRegions(s, used).length || s.id === this.sketch);
      if (!sketches.length) {
        endCmd(false);
        toast(cur.sketches.size ? 'Všechny skici už jsou vysunuté. Nakreslete novou skicu (S), nebo v režimu Plochy (G) vyberte stěnu a zvolte Vysunout.' : 'Nejprve vytvořte skicu s uzavřeným profilem (S), nebo v režimu Plochy (G) vyberte stěnu a zvolte Vysunout.');
        return;
      }
      if (!this.sketch) {
        /* start with the sketch selected in the timeline or browser, otherwise the newest one with a free profile */
        const pre = this.preSketch && sketches.find(s => s.id === this.preSketch);
        const pick = pre || sketches[sketches.length - 1];
        this.chooseSketch(pick.id, false, !!opts.fromFace);
      }
      this.buildOverlay();
      openDialog({
        title: 'Vysunutí', icon: 'extrude',
        fields: [{ k: 'opt', id: 'sk', label: 'Skica', options: [['', '– vyberte –'], ...sketches.map(s => [s.id, s.name || 'Skica'])], value: this.sketch || '' },
          { k: 'sel', id: 'prof', label: 'Profil' }, { k: 'seg', id: 'dir', label: 'Směr', options: [['one', 'Jedna strana'], ['sym', 'Symetricky']], value: this.sym ? 'sym' : 'one' },
          { k: 'num', id: 'dist', label: 'Vzdálenost', value: this.dist }, { k: 'opt', id: 'op', label: 'Operace', options: OPS, value: this.op }, { k: 'note', id: 'n' }],
        onChange: (id, live) => {
          if (id === 'sk') { const v = dlg.get('sk'); if (v) { this.chooseSketch(v, true); this.buildOverlay(); } }
          if (id === 'dist') { const v = dlg.get('dist'); if (isFinite(v)) this.dist = v; }
          if (id === 'dir') this.sym = dlg.get('dir') === 'sym';
          if (id === 'op') { this.op = dlg.get('op'); this.autoOp = false; }
          this.update();
        }
      });
      this.update();
    },
    preSketch: opts.sketch || (() => { if (f || tlSel === null) return null; const t = doc.features[tlSel]; return t && t.type === 'sketch' ? t.id : null; })(),
    applied: false,
    /* select a sketch; a single closed profile is selected straight away */
    chooseSketch(id, fromUser, all) {
      const s = cur.sketches.get(id); if (!s) return;
      const regs = freeRegions(s, used);
      if (!regs.length && id !== this.sketch) { toast('Tato skica už je vysunutá.'); return; }
      this.sketch = id;
      this.regions = new Set(regs.length === 1 || all ? regs.map(r => r.ei) : []);
      if (fromUser && dlg) dlg.set('sk', id);
    },
    /* show profiles of visible sketches, of sketches not used yet, and of the chosen one */
    buildOverlay() {
      clearGroup(G.overlay); this.regionMeshes = [];
      for (const s of cur.sketches.values()) {
        const regs = s.id === this.sketch && f ? Engine.regions(s).filter(r => !(used.get(s.id) || new Set()).has(r.ei) || this.regions.has(r.ei)) : freeRegions(s, used);
        if (!regs.length) continue;
        for (const r of regs) { const m = regionMesh(s.plane, r, tok.orange, 0.22, 0.02); m.userData = { sid: s.id, ei: r.ei }; this.regionMeshes.push(m); G.overlay.add(m); }
        G.overlay.add(sketchLines(s.plane, s.ents, s.id === this.sketch ? tok.accent : tok.sketch, 0.05));
      }
    },
    update() {
      this.regionMeshes.forEach(m => { const on = m.userData.sid === this.sketch && this.regions.has(m.userData.ei); m.material.color.copy(on ? tok.accent : tok.orange); m.material.opacity = on ? 0.4 : 0.22; });
      if (dlg) dlg.set('sk', this.sketch || '');
      clearGroup(G.preview); this.tool = null; this.arrow = null;
      const n = this.regions.size;
      dlg.set('prof', { text: n ? `${n} ${n === 1 ? 'profil' : n < 5 ? 'profily' : 'profilů'}` : 'Vyberte profil', has: n > 0, active: true });
      setPrompt(n ? 'Táhněte šipkou nebo zadejte vzdálenost. Klepnutím na profil výběr změníte.' : 'Vyberte uzavřený profil skici');
      if (!n) { dlg.set('n', ''); dlg.okEnabled(false); return requestRender(); }
      try {
        this.tool = Engine.toolForExtrude(this.feature(), cur.sketches);
        if (this.autoOp) { const o = anyOverlap(this.tool) ? (this.dist < 0 && !this.sym ? 'cut' : 'join') : 'new'; if (o !== this.op) { this.op = o; dlg.set('op', o); } }
        G.preview.add(previewMesh(this.tool, this.op));
        dlg.set('n', ''); dlg.okEnabled(true);
      } catch (e) { dlg.set('n', '!' + e.message); dlg.okEnabled(false); }
      this.makeArrow();
      requestRender();
    },
    axis() {
      const s = cur.sketches.get(this.sketch); if (!s) return null;
      const regs = Engine.regions(s).filter(r => this.regions.has(r.ei)); if (!regs.length) return null;
      let cx = 0, cy = 0, k = 0; for (const r of regs) for (const p of r.pts) { cx += p[0]; cy += p[1]; k++; }
      return { o: P3(s.plane, cx / k, cy / k), n: v3(s.plane.n) };
    },
    makeArrow() {
      const ax = this.axis(); if (!ax) return;
      const end = this.sym ? Math.abs(this.dist) / 2 : this.dist;
      const grp = new THREE.Group();
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1, 2.6, 18), new THREE.MeshBasicMaterial({ color: tok.accent, depthTest: false, transparent: true }));
      cone.renderOrder = 12; cone.userData.arrow = true;
      const q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), ax.n.clone().multiplyScalar(end >= 0 ? 1 : -1));
      cone.quaternion.copy(q);
      grp.add(cone);
      const shaft = noRay(new THREE.Line(lineGeo([0, 0, 0, 0, 0, 0]), new THREE.LineBasicMaterial({ color: tok.accent, depthTest: false, transparent: true })));
      shaft.frustumCulled = false;
      shaft.renderOrder = 12; grp.add(shaft);
      G.preview.add(grp);
      this.arrow = { grp, cone, shaft, ax, end };
    },
    onFrame() {
      if (!this.arrow) return;
      const { cone, shaft, ax, end } = this.arrow;
      const tip = ax.o.clone().addScaledVector(ax.n, end);
      const s = arrowSize(tip);
      const dirn = ax.n.clone().multiplyScalar(end >= 0 ? 1 : -1);
      cone.scale.setScalar(s); cone.position.copy(tip).addScaledVector(dirn, s * 2.2);
      const a = tip, b = tip.clone().addScaledVector(dirn, s * 1.2);
      const pa = shaft.geometry.attributes.position; pa.setXYZ(0, a.x, a.y, a.z); pa.setXYZ(1, b.x, b.y, b.z); pa.needsUpdate = true;
    },
    feature() { return { id: f ? f.id : 'tmp', type: 'extrude', sketch: this.sketch, regions: Array.from(this.regions), dist: this.dist, sym: this.sym, op: this.op }; },
    onDown(ev) {
      if (!this.arrow) return false;
      ray.setFromCamera(evNdc(ev), cam());
      this.arrow.cone.updateMatrixWorld(true);
      if (ray.intersectObject(this.arrow.cone, false).length) { this.drag = true; controls.enabled = false; return true; }
      return false;
    },
    onDrag(ev) {
      const ax = this.arrow && this.arrow.ax; if (!ax) return;
      ray.setFromCamera(evNdc(ev), cam());
      const o = ray.ray.origin, d = ray.ray.direction, w0 = ax.o.clone().sub(o), b = ax.n.dot(d), dd = ax.n.dot(w0), e = d.dot(w0), den = 1 - b * b;
      if (Math.abs(den) < 1e-6) return;
      let s = (b * e - dd) / den;
      s = Math.round(s / settings.snap) * settings.snap;
      const v = this.sym ? Math.abs(s) * 2 : s;
      if (Math.abs(v) < 1e-9 || v === this.dist) return;
      this.dist = v; dlg.set('dist', v); this.update();
    },
    onUp() { this.drag = false; controls.enabled = true; },
    onMove(ev) {
      ray.setFromCamera(evNdc(ev), cam());
      const h = ray.intersectObjects(this.regionMeshes, false)[0];
      let overArrow = false;
      if (this.arrow) { this.arrow.cone.updateMatrixWorld(true); overArrow = ray.intersectObject(this.arrow.cone, false).length > 0; }
      dom.style.cursor = overArrow ? 'grab' : h ? 'pointer' : '';
    },
    onClick(ev) {
      ray.setFromCamera(evNdc(ev), cam());
      this.regionMeshes.forEach(m => m.updateMatrixWorld(true));
      const h = ray.intersectObjects(this.regionMeshes, false)[0]; if (!h) return;
      const { sid, ei } = h.object.userData;
      if (sid !== this.sketch) { this.sketch = sid; this.regions = new Set([ei]); this.buildOverlay(); }
      else if (this.regions.has(ei)) this.regions.delete(ei); else this.regions.add(ei);
      this.update();
    },
    onSketch(id) { this.chooseSketch(id, true); this.buildOverlay(); this.update(); },
    ok() {
      if (!this.tool) return null;
      const out = this.feature(); out.id = f ? f.id : newId();
      this.applied = true;
      return out;
    },
    after(out) { doc.vis[out.sketch] = false; },
    /* a sketch made only for this extrude (Vysunout on a face) is removed again when the command is cancelled */
    cleanup() {
      if (!opts.tempSketch || this.applied) return;
      const i = doc.features.findIndex(x => x.id === opts.tempSketch);
      if (i >= 0) { doc.features.splice(i, 1); if (doc.marker > i) doc.marker--; setTimeout(commit, 0); }
    }
  };
  beginCmd(c); c.init();
}

/* ================= primitives ================= */
const PRIM_FIELDS = {
  box: [['w', 'Šířka (X)', 30], ['d', 'Hloubka (Y)', 30], ['h', 'Výška (Z)', 30]],
  cylinder: [['D', 'Průměr', 30], ['h', 'Výška', 30]],
  sphere: [['D', 'Průměr', 30]],
  cone: [['D', 'Průměr', 30], ['h', 'Výška', 30]],
  torus: [['R', 'Poloměr', 25], ['t', 'Poloměr trubice', 6]]
};
function primParams(type, vals) {
  if (type === 'box') return { w: vals.w, d: vals.d, h: vals.h };
  if (type === 'cylinder' || type === 'cone') return { r: vals.D / 2, h: vals.h };
  if (type === 'sphere') return { r: vals.D / 2 };
  return { R: vals.R, t: vals.t };
}
function primVals(type, p) {
  if (type === 'box') return { w: p.w, d: p.d, h: p.h };
  if (type === 'cylinder' || type === 'cone') return { D: p.r * 2, h: p.h };
  if (type === 'sphere') return { D: p.r * 2 };
  return { R: p.R, t: p.t };
}
/* drag handles for primitive dimensions: anchor (relative to base point), direction, distance and setter */
const DIAG = [Math.SQRT1_2, -Math.SQRT1_2, 0];
function primHandles(type, v) {
  const q = (k, label, a, dir, dist, set) => ({ k, label, a, dir, dist, set });
  if (type === 'box') return [
    q('w', 'Šířka', [0, 0, v.h / 2], [1, 0, 0], v.w / 2, s => ({ w: 2 * s })),
    q('d', 'Hloubka', [0, 0, v.h / 2], [0, 1, 0], v.d / 2, s => ({ d: 2 * s })),
    q('h', 'Výška', [0, 0, 0], [0, 0, 1], v.h, s => ({ h: s }))];
  if (type === 'cylinder' || type === 'cone') return [
    q('D', 'Průměr', [0, 0, type === 'cone' ? 0 : v.h / 2], DIAG, v.D / 2, s => ({ D: 2 * s })),
    q('h', 'Výška', [0, 0, 0], [0, 0, 1], v.h, s => ({ h: s }))];
  if (type === 'sphere') return [q('D', 'Průměr', [0, 0, v.D / 2], DIAG, v.D / 2, s => ({ D: 2 * s }))];
  return [
    q('R', 'Poloměr', [0, 0, v.t], DIAG, v.R + v.t, s => ({ R: s - v.t })),
    q('t', 'Poloměr trubice', [-DIAG[0] * v.R, -DIAG[1] * v.R, v.t], [0, 0, 1], v.t, s => ({ t: s }))];
}
function startPrimitive(type, editIndex, f) {
  const defs = PRIM_FIELDS[type], vals = f ? primVals(type, f.p) : Object.fromEntries(defs.map(d => [d[0], d[2]]));
  const pivot = new THREE.Object3D(); scene.add(pivot);
  const c = {
    editIndex, vals, pos: f ? f.pos.slice() : [0, 0, 0], op: f ? f.op : 'new', autoOp: !f, tool: null,
    hgrp: null, handles: [], drag: null, hover: null, gizmoDrag: false,
    /* a cube keeps its shape when dragged; any shape being edited keeps it if all its sides are equal */
    uniform: type === 'box' && (!f || (f.p.w === f.p.d && f.p.d === f.p.h)),
    init() {
      openDialog({
        title: Engine.FEATURE_LABEL[type], icon: type,
        fields: [...defs.map(([k, l]) => ({ k: 'num', id: k, label: l, value: this.vals[k] })), { k: 'xyz', id: 'pos', label: 'Poloha základny', value: this.pos },
          { k: 'chk', id: 'uni', label: 'Šipkami měnit rovnoměrně všechny rozměry', value: this.uniform },
          { k: 'opt', id: 'op', label: 'Operace', options: OPS, value: this.op }, { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'uni') { this.uniform = dlg.get('uni'); return; }
          if (id === 'pos') this.pos = dlg.get('pos');
          else if (id === 'op') { this.op = dlg.get('op'); this.autoOp = false; }
          else { const v = dlg.get(id); if (isFinite(v) && v > 0) this.vals[id] = v; }
          this.update();
        }
      });
      this.hgrp = new THREE.Group(); G.overlay.add(this.hgrp);
      for (let i = 0; i < defs.length; i++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1, 2.6, 18), new THREE.MeshBasicMaterial({ color: tok.orange, depthTest: false, transparent: true }));
        cone.renderOrder = 12;
        const ball = noRay(new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8), new THREE.MeshBasicMaterial({ color: tok.orange, depthTest: false, transparent: true })));
        ball.renderOrder = 12;
        const shaft = noRay(new THREE.Line(lineGeo([0, 0, 0, 0, 0, 0]), new THREE.LineBasicMaterial({ color: tok.orange, depthTest: false, transparent: true })));
        shaft.frustumCulled = false; shaft.renderOrder = 12;
        this.hgrp.add(cone, ball, shaft); this.handles.push({ cone, ball, shaft });
      }
      transform.setMode('translate'); transform.setSpace('world');
      transform.addEventListener('objectChange', this.onGizmo);
      transform.addEventListener('dragging-changed', this.onDragChange);
      transform.attach(pivot);
      setPrompt('Táhněte oranžovými šipkami pro změnu rozměrů, manipulátorem pro posun, nebo klepněte do pohledu');
      this.update();
    },
    feature() { return { id: f ? f.id : 'tmp', type, p: primParams(type, this.vals), pos: this.pos.slice(), op: this.op }; },
    update() {
      clearGroup(G.preview); this.tool = null;
      if (!this.gizmoDrag) pivot.position.set(this.pos[0], this.pos[1], this.pos[2]);
      try {
        this.tool = Engine.toolForPrimitive(this.feature());
        if (this.autoOp) { const o = anyOverlap(this.tool) ? 'join' : 'new'; if (o !== this.op) { this.op = o; dlg.set('op', o); } }
        G.preview.add(previewMesh(this.tool, this.op)); dlg.set('n', ''); dlg.okEnabled(true);
      } catch (e) { dlg.set('n', '!' + e.message); dlg.okEnabled(false); }
      requestRender();
    },
    onFrame() {
      const hs = primHandles(type, this.vals), base = v3(this.pos);
      hs.forEach((h, i) => {
        const o = this.handles[i]; if (!o) return;
        const dir = v3(h.dir), a = base.clone().add(v3(h.a)), tip = a.clone().addScaledVector(dir, h.dist);
        const s = arrowSize(tip);
        o.cone.scale.setScalar(s); o.cone.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir);
        o.cone.position.copy(tip).addScaledVector(dir, s * 2.2);
        o.ball.scale.setScalar(s); o.ball.position.copy(tip);
        const b = tip.clone().addScaledVector(dir, s * 1.2), pa = o.shaft.geometry.attributes.position;
        pa.setXYZ(0, tip.x, tip.y, tip.z); pa.setXYZ(1, b.x, b.y, b.z); pa.needsUpdate = true;
        const on = this.drag ? this.drag.i === i : this.hover === i, col = on ? tok.accent : tok.orange;
        o.cone.material.color.copy(col); o.ball.material.color.copy(col); o.shaft.material.color.copy(col);
      });
    },
    handleAt(ev) {
      ray.setFromCamera(evNdc(ev), cam());
      for (let i = 0; i < this.handles.length; i++) { const cn = this.handles[i].cone; cn.updateMatrixWorld(true); if (ray.intersectObject(cn, false).length) return i; }
      return -1;
    },
    onDown(ev) {
      const i = this.handleAt(ev); if (i < 0) return false;
      const h = primHandles(type, this.vals)[i];
      this.drag = { i, a: v3(this.pos).add(v3(h.a)), dir: v3(h.dir) };
      controls.enabled = false; transform.enabled = false;
      return true;
    },
    onDrag(ev) {
      const d = this.drag; if (!d) return;
      ray.setFromCamera(evNdc(ev), cam());
      const o = ray.ray.origin, r = ray.ray.direction, w0 = d.a.clone().sub(o), b = d.dir.dot(r), dd = d.dir.dot(w0), e = r.dot(w0), den = 1 - b * b;
      if (Math.abs(den) < 1e-6) return;
      const s = (b * e - dd) / den, h = primHandles(type, this.vals)[d.i];
      const st = settings.gridSnap ? settings.snap : 0.01;
      const nv = h.set(s);
      if (this.uniform) {
        const k0 = Object.keys(nv)[0], fct = nv[k0] / this.vals[k0];
        if (!(fct > 0)) return;
        let v0 = Math.max(st, Math.round(nv[k0] / st) * st); const f2 = v0 / this.vals[k0];
        if (Math.abs(f2 - 1) < 1e-9) return;
        for (const k in this.vals) { this.vals[k] = Math.round(this.vals[k] * f2 * 1000) / 1000; dlg.set(k, this.vals[k]); }
        this.update();
      } else for (const k in nv) {
        let v = Math.round(nv[k] / st) * st; v = Math.max(st, Math.round(v * 1000) / 1000);
        if (type === 'torus' && k === 'R') v = Math.max(v, this.vals.t + st);
        if (type === 'torus' && k === 't') v = Math.min(v, this.vals.R - st);
        if (v > 0 && v !== this.vals[k]) { this.vals[k] = v; dlg.set(k, v); this.update(); }
      }
      const el = $('#dim'), px = evPx(ev), label = defs.find(x => x[0] === h.k)[1];
      el.textContent = `${label}: ${fmtc(this.vals[h.k], 2)} mm`; el.hidden = false;
      el.style.left = px[0] + 'px'; el.style.top = px[1] + 'px';
    },
    onUp() { this.drag = null; controls.enabled = true; transform.enabled = true; $('#dim').hidden = true; requestRender(); },
    onMove(ev) {
      const i = this.handleAt(ev), hv = i >= 0 ? i : null;
      if (hv !== this.hover) { this.hover = hv; requestRender(); }
      dom.style.cursor = hv !== null ? 'grab' : 'crosshair';
    },
    onClick(ev) {
      if (this.handleAt(ev) >= 0) return;
      const h = hitBodies(ev);
      let p;
      if (h) p = h.point;
      else { ray.setFromCamera(evNdc(ev), cam()); p = ray.ray.intersectPlane(new THREE.Plane(new V3(0, 0, 1), 0), new V3()); }
      if (!p) return;
      this.pos = [snapV(p.x), snapV(p.y), Math.round(p.z * 1000) / 1000];
      dlg.set('pos', this.pos); this.update();
    },
    onGizmo: null, onDragChange: null,
    ok() { if (!this.tool) return null; const out = this.feature(); out.id = f ? f.id : newId(); return out; },
    cleanup() {
      transform.removeEventListener('objectChange', this.onGizmo);
      transform.removeEventListener('dragging-changed', this.onDragChange);
      transform.detach(); transform.enabled = true; scene.remove(pivot);
      controls.enabled = true; $('#dim').hidden = true;
    }
  };
  c.onGizmo = () => {
    const p = pivot.position;
    c.pos = [snapV(p.x), snapV(p.y), snapV(p.z)];
    dlg.set('pos', c.pos); c.update();
  };
  c.onDragChange = e => { controls.enabled = !e.value; c.gizmoDrag = e.value; if (!e.value) { pivot.position.set(c.pos[0], c.pos[1], c.pos[2]); requestRender(); } };
  beginCmd(c); c.init();
}

/* ================= fillet / chamfer ================= */
function startEdgeMod(mode, editIndex, f) {
  const c = {
    editIndex, body: f ? f.body : null, segs: [], r: f ? f.r : (mode === 'fillet' ? 2 : 1), chain: true, timer: null, hoverSeg: null, result: null,
    hideBody: null, err: null,
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      if (f) {
        const b = bodyById(f.body);
        if (b) { const ch = chainsFor(b.polys); for (const d of f.edges) { const s = Engine.matchEdge(ch, d); if (s && !this.segs.includes(s)) this.segs.push(s); } }
      }
      openDialog({
        title: mode === 'fillet' ? 'Zaoblení' : 'Zkosení', icon: mode,
        fields: [{ k: 'sel', id: 'edges', label: 'Hrany' }, { k: 'num', id: 'r', label: mode === 'fillet' ? 'Poloměr' : 'Vzdálenost', value: this.r },
          { k: 'chk', id: 'chain', label: 'Tangentní řetěz', value: true }, { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'r') { const v = dlg.get('r'); if (isFinite(v) && v > 0) { this.r = v; this.schedule(); } }
          if (id === 'chain') this.chain = dlg.get('chain');
        }
      });
      this.update(); this.schedule();
    },
    update() {
      clearGroup(G.overlay);
      for (const s of this.segs) G.overlay.add(segLine(s.pts, tok.accent));
      if (this.hoverSeg) for (const s of this.hoverSeg) if (!this.segs.includes(s)) G.overlay.add(segLine(s.pts, tok['accent-hover']));
      const n = this.segs.length;
      dlg.set('edges', { text: n ? `${n} ${n === 1 ? 'hrana' : n < 5 ? 'hrany' : 'hran'}` : 'Vyberte hrany', has: n > 0, active: true });
      setPrompt(n ? 'Klepnutím přidáte nebo odeberete hranu' : 'Vyberte hrany tělesa');
      requestRender();
    },
    schedule() {
      clearTimeout(this.timer);
      if (!this.segs.length) { this.hideBody = null; clearGroup(G.preview); styleBodies(); }
      if (!this.segs.length) { dlg.set('n', ''); dlg.okEnabled(false); return; }
      dlg.set('n', 'Počítám náhled…'); dlg.okEnabled(false);
      this.timer = setTimeout(() => this.compute(), 220);
    },
    compute() {
      if (cmd !== this) return;
      const b = bodyById(this.body); if (!b) return;
      const res = K.modifyEdges(b.polys, this.segs, mode, this.r);
      clearGroup(G.preview);
      if (res.err) { this.err = res.err; dlg.set('n', '!' + res.err); dlg.okEnabled(false); this.hideBody = null; styleBodies(); return; }
      this.err = null;
      const m = meshFromPolys(res.polys, bodyMaterial()); noRay(m);
      m.material.color.copy(tok.body).lerp(tok.accent, 0.25);
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(K.edgeSegments(res.polys), 3));
      m.add(noRay(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: tok.edge }))));
      G.preview.add(m);
      this.hideBody = this.body; styleBodies();
      dlg.set('n', ''); dlg.okEnabled(true); requestRender();
    },
    segsFor(hit) {
      const all = chainsFor(meshes.get(hit.id).polys);
      return this.chain ? all.filter(s => s.group === hit.seg.group) : [hit.seg];
    },
    onMove(ev) {
      const h = pickEdge(ev, null);
      const hs = h ? this.segsFor(h) : null;
      const same = (hs && this.hoverSeg && hs.length === this.hoverSeg.length && hs.every((s, i) => s === this.hoverSeg[i])) || (!hs && !this.hoverSeg);
      dom.style.cursor = h ? 'pointer' : '';
      if (same) return;
      this.hoverSeg = hs; this.update();
    },
    onClick(ev) {
      const h = pickEdge(ev, null);
      if (!h) return;
      if (h.id !== this.body) { this.body = h.id; this.segs = []; }
      const group = this.segsFor(h), allIn = group.every(s => this.segs.includes(s));
      if (allIn) this.segs = this.segs.filter(s => !group.includes(s)); else for (const s of group) if (!this.segs.includes(s)) this.segs.push(s);
      this.update(); this.schedule();
    },
    ok() {
      if (!this.segs.length || this.err) return null;
      return { id: f ? f.id : newId(), type: mode, body: this.body, edges: this.segs.map(Engine.describe).filter(Boolean), r: this.r };
    },
    cleanup() { clearTimeout(this.timer); this.hideBody = null; }
  };
  beginCmd(c); c.init();
}

/* ================= combine ================= */
function startCombine(editIndex, f) {
  const c = {
    editIndex, target: f ? f.target : null, tools: new Set(f ? f.tools : []), op: f ? f.op : 'join', keep: f ? !!f.keep : false, active: 'target',
    init() {
      if (cur.bodies.length < 2) { endCmd(false); toast('Kombinace potřebuje alespoň dvě tělesa.'); return; }
      if (!f && sel.size) { const ids = [...sel]; this.target = ids[0]; ids.slice(1).forEach(i => this.tools.add(i)); }
      if (this.target) this.active = 'tools';
      openDialog({
        title: 'Kombinovat', icon: 'combine',
        fields: [{ k: 'sel', id: 'target', label: 'Cílové těleso' }, { k: 'sel', id: 'tools', label: 'Nástroje' },
          { k: 'opt', id: 'op', label: 'Operace', options: [['join', 'Spojit'], ['cut', 'Vyříznout'], ['intersect', 'Průnik']], value: this.op },
          { k: 'chk', id: 'keep', label: 'Ponechat nástrojová tělesa', value: this.keep }],
        onSel: id => { this.active = id; this.update(); },
        onChange: id => { if (id === 'op') this.op = dlg.get('op'); if (id === 'keep') this.keep = dlg.get('keep'); }
      });
      this.update();
    },
    update() {
      bodyTint.clear();
      if (this.target) bodyTint.set(this.target, 'target');
      for (const t of this.tools) bodyTint.set(t, 'tool');
      const tb = this.target && bodyById(this.target);
      dlg.set('target', { text: tb ? bodyName(tb) : 'Vyberte těleso', has: !!tb, active: this.active === 'target' });
      const n = this.tools.size;
      dlg.set('tools', { text: n ? `${n} ${n === 1 ? 'těleso' : n < 5 ? 'tělesa' : 'těles'}` : 'Vyberte tělesa', has: n > 0, active: this.active === 'tools' });
      dlg.okEnabled(!!tb && n > 0);
      setPrompt(this.active === 'target' ? 'Vyberte cílové těleso' : 'Vyberte nástrojová tělesa');
      styleBodies();
    },
    onBody(id) {
      if (this.active === 'target') { this.target = id; this.tools.delete(id); this.active = 'tools'; }
      else if (id !== this.target) { if (this.tools.has(id)) this.tools.delete(id); else this.tools.add(id); }
      this.update();
    },
    onMove(ev) { const h = hitBodies(ev); dom.style.cursor = h ? 'pointer' : ''; },
    onClick(ev) { const h = hitBodies(ev); if (h) this.onBody(h.object.userData.bodyId); },
    ok() { if (!this.target || !this.tools.size) return null; return { id: f ? f.id : newId(), type: 'combine', target: this.target, tools: Array.from(this.tools), op: this.op, keep: this.keep }; }
  };
  beginCmd(c); c.init();
}

/* ================= move ================= */
function startMove(editIndex, f, preset) {
  const pivot = new THREE.Object3D(); scene.add(pivot);
  const src = f || preset || null;
  const c = {
    editIndex, bodies: new Set(src ? src.bodies : [...sel]), t: src ? src.t.slice() : [0, 0, 0], r: src ? src.r.slice() : [0, 0, 0], copy: src ? !!src.copy : false,
    count: src && src.count ? src.count : 1, dir: src && src.dir ? src.dir : 'free', spacing: src && src.spacing ? src.spacing : 0,
    center: new V3(), size: new V3(), highlight: null,
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      this.highlight = this.bodies;
      openDialog({
        title: preset && preset.paste ? 'Vložit kopii' : 'Přesunout', icon: 'move',
        fields: [{ k: 'sel', id: 'bodies', label: 'Tělesa' }, { k: 'seg', id: 'mode', label: 'Manipulátor', options: [['translate', 'Posun'], ['rotate', 'Otočení']], value: 'translate' },
          { k: 'xyz', id: 't', label: 'Posun (mm)', value: this.t }, { k: 'xyz', id: 'r', label: 'Otočení (°)', value: this.r },
          { k: 'chk', id: 'copy', label: 'Vytvořit kopie (originál zůstane)', value: this.copy },
          { k: 'num', id: 'count', label: 'Počet kopií', unit: 'ks', value: this.count },
          { k: 'opt', id: 'dir', label: 'Směr', options: [['free', 'Podle posunu výše'], ['x', 'Podél osy X'], ['y', 'Podél osy Y'], ['z', 'Podél osy Z']], value: this.dir },
          { k: 'num', id: 'spacing', label: 'Rozestup', value: this.spacing }, { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'mode') transform.setMode(dlg.get('mode'));
          if (id === 't') { this.t = dlg.get('t'); if (this.dir !== 'free') { this.dir = 'free'; dlg.set('dir', 'free'); } }
          if (id === 'r') this.r = dlg.get('r');
          if (id === 'copy') this.copy = dlg.get('copy');
          if (id === 'count') { const v = Math.round(dlg.get('count')); if (v >= 1) this.count = Math.min(100, v); }
          if (id === 'dir') { this.dir = dlg.get('dir'); if (this.dir !== 'free' && !(this.spacing > 0)) this.spacing = this.defaultSpacing(); this.axisToT(); }
          if (id === 'spacing') { const v = dlg.get('spacing'); if (isFinite(v)) { this.spacing = v; this.axisToT(); } }
          this.fields(); this.apply(true);
        }
      });
      transform.setMode('translate'); transform.setSpace('world');
      transform.addEventListener('objectChange', this.onGizmo);
      transform.addEventListener('dragging-changed', this.onDragChange);
      this.recenter();
    },
    defaultSpacing() { const k = 'xyz'.indexOf(this.dir); const v = k >= 0 ? this.size.getComponent(k) : this.size.x; return Math.round((v + 5) * 10) / 10; },
    axisToT() { if (this.dir === 'free') return; const k = 'xyz'.indexOf(this.dir); this.t = [0, 0, 0]; this.t[k] = this.spacing; dlg.set('t', this.t); },
    fields() {
      dlg.show('count', this.copy); dlg.show('dir', this.copy); dlg.show('spacing', this.copy && this.dir !== 'free');
      const n = this.copy ? this.count * this.bodies.size : 0;
      dlg.set('n', this.copy ? (n === 1 ? 'Vznikne 1 kopie.' : n <= 4 ? `Vzniknou ${n} kopie.` : `Vznikne ${n} kopií.`) + (this.count > 1 ? ' Každá další kopie se posune o stejný krok.' : '') : '');
    },
    onGizmo: null, onDragChange: null,
    recenter() {
      const box = new THREE.Box3();
      for (const id of this.bodies) { const e = meshes.get(id); if (!e) continue; e.mesh.geometry.computeBoundingBox(); box.union(e.mesh.geometry.boundingBox); }
      if (box.isEmpty()) { transform.detach(); } else { box.getCenter(this.center); box.getSize(this.size); transform.attach(pivot); }
      const n = this.bodies.size;
      dlg.set('bodies', { text: n ? `${n} ${n === 1 ? 'těleso' : n < 5 ? 'tělesa' : 'těles'}` : 'Vyberte tělesa', has: n > 0, active: true });
      setPrompt(n ? 'Táhněte manipulátorem nebo zadejte hodnoty. Klepnutím na těleso výběr změníte.' : 'Vyberte tělesa k přesunu');
      dlg.okEnabled(n > 0);
      this.fields(); this.apply(true);
    },
    apply(fromFields) {
      if (fromFields) { pivot.position.copy(this.center).add(v3(this.t)); pivot.rotation.set(this.r[0] * D2R, this.r[1] * D2R, this.r[2] * D2R); }
      const M = new THREE.Matrix4().fromArray(Engine.eulerMatrix(this.center.toArray(), this.t, this.r));
      for (const [id, e] of meshes) {
        if (this.bodies.has(id) && !this.copy) { e.mesh.matrixAutoUpdate = false; e.mesh.matrix.copy(M); e.mesh.matrixWorldNeedsUpdate = true; }
        else { e.mesh.matrixAutoUpdate = true; e.mesh.matrix.identity(); e.mesh.updateMatrix(); }
      }
      clearGroup(G.preview);
      if (this.copy) {
        const mat = new THREE.MeshStandardMaterial({ color: tok.accent.clone(), transparent: true, opacity: 0.45, roughness: 0.5, depthWrite: false, side: THREE.DoubleSide });
        const Mk = new THREE.Matrix4();
        for (let k = 1; k <= this.count; k++) {
          Mk.premultiply(M); if (k === 1) Mk.copy(M);
          for (const id of this.bodies) {
            const e = meshes.get(id); if (!e) continue;
            const m = noRay(new THREE.Mesh(e.mesh.geometry, k === 1 ? mat : mat.clone()));
            m.userData.sharedGeo = true; m.matrixAutoUpdate = false; m.matrix.copy(Mk); m.renderOrder = 3;
            G.preview.add(m);
          }
        }
      }
      styleBodies();
    },
    onBody(id) { if (this.bodies.has(id)) this.bodies.delete(id); else this.bodies.add(id); this.recenter(); },
    onMove(ev) { const h = hitBodies(ev); dom.style.cursor = h ? 'pointer' : ''; },
    onClick(ev) { const h = hitBodies(ev); if (h) this.onBody(h.object.userData.bodyId); },
    ok() {
      if (!this.bodies.size) return null;
      const r3 = v => Math.round(v * 1000) / 1000, out = { id: f ? f.id : newId(), type: 'move', bodies: Array.from(this.bodies), t: this.t.map(r3), r: this.r.map(r3), copy: this.copy };
      if (this.copy) { out.count = this.count; out.dir = this.dir; if (this.dir !== 'free') out.spacing = this.spacing; }
      return out;
    },
    after(out) { if (out.copy) setTimeout(() => { sel = new Set(cur.bodies.filter(b => b.from === out.id).map(b => b.id)); styleBodies(); renderBrowser(); updateInfo(); }, 600); },
    cleanup() {
      transform.removeEventListener('objectChange', this.onGizmo);
      transform.removeEventListener('dragging-changed', this.onDragChange);
      transform.detach(); scene.remove(pivot);
      for (const e of meshes.values()) { e.mesh.matrixAutoUpdate = true; e.mesh.matrix.identity(); e.mesh.position.set(0, 0, 0); e.mesh.rotation.set(0, 0, 0); e.mesh.updateMatrix(); }
      this.highlight = null;
    }
  };
  c.onGizmo = () => {
    c.t = pivot.position.clone().sub(c.center).toArray().map(v => Math.round(v * 1000) / 1000);
    c.r = [pivot.rotation.x, pivot.rotation.y, pivot.rotation.z].map(v => Math.round(v / D2R * 100) / 100);
    if (c.dir !== 'free') { c.dir = 'free'; dlg.set('dir', 'free'); c.fields(); }
    dlg.set('t', c.t); dlg.set('r', c.r); c.apply(false);
  };
  c.onDragChange = e => { controls.enabled = !e.value; };
  beginCmd(c); c.init();
}


/* ================= face selection and direct face editing ================= */
let faceMode = false, selFace = null, hoverFace = null;
/* describe the face under a hit: whole cylinder (hole or boss) or a connected planar patch */
function faceAtHit(h) {
  const { pi, poly } = polyOfHit(h), polys = h.object.userData.polys, bodyId = h.object.userData.bodyId;
  if (smoothFor(polys)[pi]) {
    const cyl = cylinderAt(polys, pi);
    if (cyl) return { bodyId, polys, kind: 'cyl', group: [...cyl.group], cyl };
    return null;
  }
  const cen = [0, 0, 0]; for (const v of poly.v) { cen[0] += v[0] / poly.v.length; cen[1] += v[1] / poly.v.length; cen[2] += v[2] / poly.v.length; }
  const group = K.planarFace(polys, poly.n, poly.w, cen);
  if (!group) return null;
  const area = group.reduce((s, i) => s + K.surfaceArea([polys[i]]), 0);
  return { bodyId, polys, kind: 'plane', group, n: poly.n.slice(), w: poly.w, p: cen, area };
}
function faceMesh(face, color, opacity) {
  const m = meshFromPolys(face.group.map(i => face.polys[i]), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  noRay(m); m.renderOrder = 6; return m;
}
const faceGroup = new THREE.Group(); scene.add(faceGroup);
function drawFaces() {
  clearGroup(faceGroup);
  if (hoverFace && (!selFace || hoverFace.group[0] !== selFace.group[0] || hoverFace.bodyId !== selFace.bodyId)) faceGroup.add(faceMesh(hoverFace, tok['accent-hover'], 0.3));
  if (selFace) faceGroup.add(faceMesh(selFace, tok.accent, 0.5));
  requestRender();
}
/* action bar for the selected face (works on touch screens, where there is no right click) */
let faceBarKey = '';
function syncFaceBar() {
  const bar = $('#facebar'); if (!bar) return;
  const show = faceMode && selFace && !cmd && !sk;
  const key = show ? selFace.bodyId + ':' + selFace.kind + ':' + selFace.group[0] + ':' + selFace.group.length : '';
  if (key === faceBarKey) return;
  faceBarKey = key; bar.hidden = !show; document.body.classList.toggle('has-facebar', !!show); if (!show) { bar.innerHTML = ''; return; }
  const pl = selFace.kind === 'plane', acts = pl
    ? [['ext', 'Vysunout', 'extrude'], ['press', 'Posunout plochu', 'pressface'], ['al', 'Zarovnat k…', 'center'], ['sk', 'Skica z plochy', 'sketchi'], ['esk', 'Prázdná skica', 'sketch']]
    : [['press', selFace.cyl.internal ? 'Průměr otvoru' : 'Změnit průměr', 'pressface'], ['al', 'Zarovnat k…', 'center'], ['thr', 'Závit', 'thread']];
  bar.innerHTML = `<span class="fb-t"></span><div class="fb-a">${acts.map(([k, l, ic]) => `<button class="fb-b" data-fb="${k}"><span class="ico">${svg(ic, 18)}</span>${l}</button>`).join('')}<button class="ibtn" data-fb="x" aria-label="Zrušit výběr plochy" title="Zrušit výběr plochy">${svg('close', 16)}</button></div>`;
  $('.fb-t', bar).textContent = faceText(selFace);
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-fb]'); if (!b || !selFace) return;
  const k = b.dataset.fb, s = selFace;
  if (k === 'ext') extrudeFace();
  else if (k === 'press') startPressFace();
  else if (k === 'sk') faceToSketch();
  else if (k === 'esk') enterSketch({ id: newId(), type: 'sketch', name: 'Skica ' + (doc.features.filter(x => x.type === 'sketch').length + 1), plane: Engine.basisFromPlane(s.n, s.w), ents: [] }, null);
  else if (k === 'thr') { startThread(); if (cmd && cmd.setFace) cmd.setFace(s.bodyId, s.cyl); }
  else if (k === 'al') { setFaceMode(false, true); startCenter(undefined, undefined, { face: s }); }
  else if (k === 'x') { selFace = null; drawFaces(); updateInfo(); }
  syncFaceBar();
});
function faceText(f) {
  if (f.kind === 'cyl') return `${f.cyl.internal ? 'Vnitřní válcová plocha (otvor)' : 'Vnější válcová plocha'} · Ø ${fmtc(f.cyl.r * 2, 2)} mm · délka ${fmtc(f.cyl.len, 2)} mm`;
  return `Rovinná plocha · ${fmtc(f.area, 2)} mm² · normála ${f.n.map(v => fmtc(v, 2)).join('; ')}`;
}
function setFaceMode(on, quiet) {
  faceMode = on; hoverFace = null;
  if (!on) selFace = null;
  if (on) { sel = new Set(); styleBodies(); renderBrowser(); }
  drawFaces(); renderRibbon(); updateInfo();
  if (!quiet) toast(on ? 'Výběr ploch: klepněte na stěnu tělesa, možnosti se ukážou v liště dole.' : 'Výběr těles');
}
function faceHover(e) {
  const h = hitBodies(e), f = h ? faceAtHit(h) : null;
  const same = (a, b) => (!a && !b) || (a && b && a.bodyId === b.bodyId && a.group[0] === b.group[0] && a.group.length === b.group.length);
  if (!same(f, hoverFace)) { hoverFace = f; drawFaces(); }
  dom.style.cursor = f ? 'pointer' : '';
}
function faceClick(e) {
  const h = hitBodies(e), f = h ? faceAtHit(h) : null;
  selFace = f; drawFaces(); updateInfo();
  if (h && !f) toast('Tuto plochu nelze vybrat samostatně (zakřivená plocha, která není válcem).');
}
function faceContext(e) {
  const h = hitBodies(e), f = h ? faceAtHit(h) : null;
  if (f) { selFace = f; drawFaces(); updateInfo(); }
  if (!selFace) return;
  showCtx(e.clientX, e.clientY + 4, [
    ['Vysunout (nové těleso, přidat nebo vyříznout)…', () => extrudeFace(), selFace.kind !== 'plane'],
    [selFace.kind === 'cyl' ? (selFace.cyl.internal ? 'Změnit průměr otvoru…' : 'Změnit průměr…') : 'Posunout plochu (vysunout / zapustit)…', () => startPressFace()],
    ['Skica z plochy (Ctrl+D)', () => faceToSketch(), selFace.kind !== 'plane'],
    ['Nová prázdná skica na ploše', () => { const s = selFace; enterSketch({ id: newId(), type: 'sketch', name: 'Skica ' + (doc.features.filter(x => x.type === 'sketch').length + 1), plane: Engine.basisFromPlane(s.n, s.w), ents: [] }, null); }, selFace.kind !== 'plane'],
    ['Závit na této ploše…', () => { const s = selFace; startThread(); if (cmd && cmd.setFace) cmd.setFace(s.bodyId, s.cyl); }, selFace.kind !== 'cyl'],
    ['Zarovnat k jiné ploše…', () => { const s = selFace; setFaceMode(false, true); startCenter(undefined, undefined, { face: s }); }],
    null,
    ['Zrušit výběr plochy', () => { selFace = null; drawFaces(); updateInfo(); }]
  ]);
}
/* Vysunout on a selected face: its outline becomes a sketch and the Extrude command opens with it */
function extrudeFace() {
  const s = selFace;
  if (!s || s.kind !== 'plane') { toast('Vysunout lze rovinnou plochu.'); return; }
  const fs = faceSketch(s);
  if (!fs) { toast('Obrys plochy se nepodařilo převést na skicu.'); return; }
  setFaceMode(false, true);
  doc.features.splice(doc.marker, 0, fs); doc.marker++; doc.vis[fs.id] = false;
  pushHist(); saveDoc();
  refreshBusy(() => startExtrude(undefined, undefined, { sketch: fs.id, tempSketch: fs.id, fromFace: true }));
}
/* copy a planar face outline into a new sketch on the same plane (circles stay circles, so their size is editable) */
function faceSketch(s) {
  const B = Engine.basisFromPlane(s.n, s.w), r4 = x => Math.round(x * 1e4) / 1e4;
  const ents = [];
  for (const loop of K.faceLoops(s.polys, s.group)) {
    let pts = loop.map(q => { const d = K.vsub(q, B.o); return [K.vdot(d, B.u), K.vdot(d, B.v)]; });
    /* drop collinear points */
    pts = pts.filter((p, i) => { const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length]; return Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) > 1e-6; });
    if (pts.length < 3) continue;
    let cx = 0, cy = 0; pts.forEach(p => { cx += p[0] / pts.length; cy += p[1] / pts.length; });
    const rs = pts.map(p => Math.hypot(p[0] - cx, p[1] - cy)), rm = rs.reduce((a, b) => a + b, 0) / rs.length;
    if (pts.length >= 12 && rs.every(r => Math.abs(r - rm) < 0.01 * rm + 1e-3)) ents.push({ t: 'circle', x: r4(cx), y: r4(cy), r: r4(Math.max(...rs)) });
    else ents.push({ t: 'poly', pts: pts.map(p => [r4(p[0]), r4(p[1])]), closed: true });
  }
  if (!ents.length) return null;
  const n = doc.features.filter(x => x.type === 'sketch').length + 1;
  return { id: newId(), type: 'sketch', name: `Skica ${n} (z plochy)`, plane: { o: B.o.map(r4), u: B.u.map(r4), v: B.v.map(r4), n: B.n.map(r4) }, ents };
}
function faceToSketch() {
  const s = selFace;
  if (!s || s.kind !== 'plane') { toast('Vyberte rovinnou plochu (třeba horní stěnu válce).'); return; }
  const fs = faceSketch(s);
  if (!fs) { toast('Obrys plochy se nepodařilo převést na skicu.'); return; }
  setFaceMode(false, true);
  enterSketch(fs, null);
  sk.selEnt = 0; setSketchTool(null); renderPalette(); redrawSketch();
  toast('Obrys plochy je ve skice. Upravte rozměr v paletě, dokončete skicu a vysuňte ji (E), záporná vzdálenost vytvoří otvor.');
}
function startPressFace(editIndex, f) {
  const c = {
    editIndex, face: null, body: f ? f.body : null, d: f && f.kind === 'plane' ? f.d : 2, dia: f && f.kind === 'cyl' ? f.newR * 2 : null,
    timer: null, hideBody: null, result: null, desc: f ? clone(f) : null,
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      openDialog({ title: 'Upravit plochu', icon: 'pressface', fields: [{ k: 'sel', id: 'face', label: 'Plocha' }, { k: 'note', id: 'kind' },
        { k: 'num', id: 'dia', label: 'Nový průměr' }, { k: 'num', id: 'd', label: 'Posunutí', value: this.d }, { k: 'note', id: 'n' }],
        onChange: id => { if (id === 'dia') { const v = dlg.get('dia'); if (v > 0) this.dia = v; } if (id === 'd') { const v = dlg.get('d'); if (isFinite(v)) this.d = v; } this.schedule(); } });
      if (!f && selFace) this.useFace(selFace); else this.update();
    },
    useFace(face) {
      this.face = face; this.body = face.bodyId;
      if (face.kind === 'cyl') { const y = face.cyl; this.desc = { kind: 'cyl', c: y.c, ax: y.ax, r: y.r, len: y.len, internal: y.internal }; if (!(this.dia > 0)) this.dia = Math.round(y.r * 2 * 100) / 100; dlg.set('dia', this.dia); }
      else this.desc = { kind: 'plane', n: face.n.map(v => Math.round(v * 1e6) / 1e6), w: Math.round(face.w * 1e5) / 1e5, p: face.p.map(v => Math.round(v * 1e4) / 1e4) };
      this.update(); this.schedule();
    },
    feature() { const o = { id: f ? f.id : 'tmp', type: 'offsetface', body: this.body, ...this.desc }; if (o.kind === 'cyl') o.newR = this.dia / 2; else o.d = this.d; return o; },
    update() {
      const d = this.desc;
      dlg.set('face', { text: d ? (d.kind === 'cyl' ? `Válcová plocha Ø${fmtc(d.r * 2, 2)}` : 'Rovinná plocha') : 'Klepněte na stěnu tělesa', has: !!d, active: true });
      dlg.set('kind', !d ? 'Vyberte vnitřní stěnu otvoru, válec nebo rovnou stěnu.' : d.kind === 'cyl' ? (d.internal ? 'Otvor: zadejte nový průměr, otvor se zvětší nebo zmenší.' : 'Válec: zadejte nový průměr.') : 'Kladné posunutí přidá materiál ve směru plochy, záporné ho odebere (zapustí plochu).');
      dlg.show('dia', !!d && d.kind === 'cyl'); dlg.show('d', !!d && d.kind === 'plane');
      setPrompt(d ? 'Klepnutím na jinou stěnu výběr změníte' : 'Klepněte na stěnu tělesa');
      if (!d) dlg.okEnabled(false);
    },
    schedule() {
      clearTimeout(this.timer); if (!this.desc) return;
      dlg.set('n', 'Počítám náhled…'); dlg.okEnabled(false);
      this.timer = setTimeout(() => {
        if (cmd !== this) return;
        clearGroup(G.preview); this.hideBody = null; this.result = null;
        const b = bodyById(this.body);
        try {
          if (!b) throw new Error('Těleso neexistuje');
          this.result = Engine.offsetFace(b.polys, this.feature());
          const m = meshFromPolys(this.result, bodyMaterial()); noRay(m); m.material.color.copy(tok.body).lerp(tok.accent, 0.25);
          const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(K.edgeSegments(this.result), 3));
          m.add(noRay(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: tok.edge }))));
          G.preview.add(m); this.hideBody = this.body;
          const dv = (K.signedVolume(this.result) - K.signedVolume(b.polys)) / 1000;
          dlg.set('n', `Objem ${dv >= 0 ? '+' : ''}${fmtc(dv, 3)} cm³`); dlg.okEnabled(true);
        } catch (e) { dlg.set('n', '!' + e.message); }
        styleBodies(); requestRender();
      }, 200);
    },
    onMove(ev) { const h = hitBodies(ev); dom.style.cursor = h ? 'pointer' : ''; },
    onClick(ev) { const h = hitBodies(ev); if (!h) return; const fc = faceAtHit(h); if (!fc) { toast('Vyberte rovnou stěnu nebo válcovou plochu.'); return; } this.dia = null; this.useFace(fc); },
    ok() { if (!this.result) return null; const o = this.feature(); o.id = f ? f.id : newId(); return o; },
    after() { selFace = null; drawFaces(); },
    cleanup() { clearTimeout(this.timer); this.hideBody = null; }
  };
  beginCmd(c); c.init();
}

/* ================= centre bodies on the origin ================= */
/* face / axis descriptor used by Zarovnat (plane: outward normal and centre; cylinder: axis and its midpoint) */
function alignDesc(face) {
  if (!face) return null;
  const r6 = x => Math.round(x * 1e6) / 1e6;
  if (face.kind === 'cyl') { const cy = face.cyl; return { kind: 'cyl', a: cy.ax.map(r6), c: K.vadd(cy.c, K.vmul(cy.ax, cy.len / 2)).map(r6) }; }
  let A = 0; const c = [0, 0, 0];
  for (const i of face.group) { const p = face.polys[i], a = K.surfaceArea([p]); let q = [0, 0, 0]; for (const v of p.v) q = K.vadd(q, v); q = K.vmul(q, 1 / p.v.length); A += a; for (let k = 0; k < 3; k++) c[k] += q[k] * a; }
  return { kind: 'plane', n: face.n.map(r6), c: c.map(v => r6(v / (A || 1))) };
}
const ALIGN_AX = [['keep', 'Neměnit'], ['min', 'Zarovnat začátky'], ['center', 'Na střed'], ['max', 'Zarovnat konce'], ['after', 'Přiložit za konec'], ['before', 'Přiložit před začátek']];
const ALIGN_AXZ = [['keep', 'Neměnit'], ['min', 'Zarovnat spodky'], ['center', 'Na střed'], ['max', 'Zarovnat vršky'], ['after', 'Položit navrch'], ['before', 'Dát pod']];
function startCenter(editIndex, f, preset) {
  const c = {
    editIndex, mode: f ? (f.target || 'origin') : (preset && preset.face ? 'face' : 'origin'),
    all: f ? !!f.all : !sel.size, bodies: new Set(f ? (f.bodies || []) : [...sel]),
    x: f ? f.x !== false : true, y: f ? f.y !== false : true, z: f ? (f.z || 'ground') : 'ground', each: f ? !!f.each : false,
    ref: f ? f.ref || null : null, ax: f && f.ax ? f.ax.slice() : ['center', 'center', 'keep'],
    body: f ? f.body || null : null, src: f ? f.src || null : null, dst: f ? f.dst || null : null, srcFace: null, dstFace: null,
    flip: f ? !!f.flip : false, centerOn: f ? f.centerOn !== false : true, gap: f ? Number(f.gap) || 0 : 0,
    pick: 'bodies', highlight: new Set(), hoverFace: null,
    ids() { return this.all ? cur.bodies.map(b => b.id) : [...this.bodies].filter(id => meshes.has(id)); },
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      if (preset && preset.face) { this.srcFace = preset.face; this.src = alignDesc(preset.face); this.body = preset.face.bodyId; this.pick = 'dst'; }
      if (this.mode === 'face' && !this.src) this.pick = 'src';
      if (this.mode === 'body') this.pick = this.ref ? 'bodies' : (this.ids().length ? 'ref' : 'bodies');
      openDialog({
        title: 'Zarovnat', icon: 'center',
        fields: [{ k: 'seg', id: 'mode', label: 'Zarovnat k', options: [['origin', 'Počátku'], ['body', 'Tělesu'], ['face', 'Ploše']], value: this.mode },
          { k: 'chk', id: 'all', label: 'Celý model', value: this.all }, { k: 'sel', id: 'bodies', label: 'Tělesa' },
          { k: 'sel', id: 'ref', label: 'Ke tělesu' },
          { k: 'chk', id: 'x', label: 'Vycentrovat v ose X', value: this.x }, { k: 'chk', id: 'y', label: 'Vycentrovat v ose Y', value: this.y },
          { k: 'opt', id: 'z', label: 'Osa Z', options: [['ground', 'Položit na podložku (Z = 0)'], ['center', 'Vycentrovat'], ['keep', 'Neměnit']], value: this.z },
          { k: 'opt', id: 'ax0', label: 'Osa X', options: ALIGN_AX, value: this.ax[0] }, { k: 'opt', id: 'ax1', label: 'Osa Y', options: ALIGN_AX, value: this.ax[1] },
          { k: 'opt', id: 'ax2', label: 'Osa Z', options: ALIGN_AXZ, value: this.ax[2] },
          { k: 'chk', id: 'each', label: 'Každé těleso zvlášť', value: this.each },
          { k: 'sel', id: 'src', label: 'Plocha, která se přesune' }, { k: 'sel', id: 'dst', label: 'Cílová plocha' },
          { k: 'chk', id: 'centerOn', label: 'Vystředit na cílovou plochu', value: this.centerOn },
          { k: 'chk', id: 'flip', label: 'Otočit opačně', value: this.flip },
          { k: 'num', id: 'gap', label: 'Mezera', value: this.gap }, { k: 'note', id: 'n' }],
        onSel: id => { this.pick = id === 'bodies' && this.all ? this.pick : id; this.update(); },
        onChange: id => {
          if (id === 'mode') { this.mode = dlg.get('mode'); this.pick = this.mode === 'face' ? (this.src ? 'dst' : 'src') : this.mode === 'body' ? (this.ref ? 'bodies' : (this.ids().length ? 'ref' : 'bodies')) : 'bodies'; }
          if (id === 'all') this.all = dlg.get('all');
          if (id === 'x') this.x = dlg.get('x');
          if (id === 'y') this.y = dlg.get('y');
          if (id === 'z') this.z = dlg.get('z');
          if (/^ax\d$/.test(id)) this.ax[+id[2]] = dlg.get(id);
          if (id === 'each') this.each = dlg.get('each');
          if (id === 'centerOn') this.centerOn = dlg.get('centerOn');
          if (id === 'flip') this.flip = dlg.get('flip');
          if (id === 'gap') { const v = dlg.get('gap'); if (isFinite(v)) this.gap = v; }
          this.update();
        }
      });
      this.update();
    },
    feature() {
      const base = { id: f ? f.id : 'tmp', type: 'center', target: this.mode };
      if (this.mode === 'face') return { ...base, body: this.body, src: this.src, dst: this.dst, flip: this.flip, centerOn: this.centerOn, gap: this.gap };
      if (this.mode === 'body') return { ...base, all: this.all, bodies: this.all ? [] : this.ids(), ref: this.ref, ax: this.ax.slice(), each: this.each };
      return { ...base, all: this.all, bodies: this.all ? [] : this.ids(), x: this.x, y: this.y, z: this.z, each: this.each };
    },
    ready() {
      if (this.mode === 'face') return !!(this.src && this.dst && this.body);
      if (this.mode === 'body') return !!(this.ref && this.ids().length && !this.ids().includes(this.ref));
      return this.ids().length > 0;
    },
    update() {
      const m = this.mode, ids = this.ids(), bodyName2 = id => { const b = bodyById(id); return b ? bodyName(b) : '?'; };
      ['all', 'bodies', 'each'].forEach(k => dlg.show(k, m !== 'face'));
      dlg.show('bodies', m !== 'face' && !this.all);
      ['x', 'y', 'z'].forEach(k => dlg.show(k, m === 'origin'));
      ['ref', 'ax0', 'ax1', 'ax2'].forEach(k => dlg.show(k, m === 'body'));
      ['src', 'dst', 'centerOn', 'flip', 'gap'].forEach(k => dlg.show(k, m === 'face'));
      const bs = bodySelText(new Set(ids)); bs.active = this.pick === 'bodies';
      dlg.set('bodies', this.all ? { text: 'Celý model', has: true, active: false } : bs);
      dlg.set('ref', { text: this.ref ? bodyName2(this.ref) : 'Vyberte těleso', has: !!this.ref, active: this.pick === 'ref' });
      const fdesc = d => (!d ? null : d.kind === 'cyl' ? 'Osa válcové plochy' : 'Rovinná plocha');
      dlg.set('src', { text: fdesc(this.src) || 'Klepněte na plochu', has: !!this.src, active: this.pick === 'src' });
      dlg.set('dst', { text: fdesc(this.dst) || 'Klepněte na plochu', has: !!this.dst, active: this.pick === 'dst' });
      setPrompt(m === 'face' ? (this.pick === 'src' ? 'Klepněte na plochu tělesa, které se má přesunout (rovnou stěnu nebo válec)' : 'Klepněte na cílovou plochu (k rovné stěně rovnou, k válci válcovou)')
        : m === 'body' ? (this.pick === 'ref' ? 'Klepněte na těleso, ke kterému se zarovná' : 'Klepnutím na těleso výběr změníte')
          : this.all ? 'Model se posune tak, aby jeho střed ležel v počátku' : ids.length ? 'Klepnutím na těleso výběr změníte' : 'Vyberte tělesa k vycentrování');
      this.highlight = new Set(m === 'face' ? (this.body ? [this.body] : []) : ids);
      bodyTint.clear(); if (m === 'body' && this.ref) bodyTint.set(this.ref, 'target');
      clearGroup(G.preview); clearGroup(G.overlay);
      if (m === 'face') {
        if (this.srcFace) G.overlay.add(faceMesh(this.srcFace, tok.orange, 0.55));
        if (this.dstFace) G.overlay.add(faceMesh(this.dstFace, tok.accent, 0.55));
        if (this.hoverFace) G.overlay.add(faceMesh(this.hoverFace, tok['accent-hover'], 0.3));
      }
      const ok = this.ready(); dlg.okEnabled(ok);
      const moved = new Map();
      if (ok) {
        try {
          const st = Engine.step({ bodies: cur.bodies, sketches: new Map(), n: 0 }, this.feature());
          for (const b of st.bodies) {
            const old = bodyById(b.id); if (!old || old.polys === b.polys) continue;
            if (m === 'face') {
              G.preview.add(noRay(meshFromPolys(b.polys, new THREE.MeshStandardMaterial({ color: tok.accent.clone(), transparent: true, opacity: 0.55, roughness: 0.5, depthWrite: false, side: THREE.DoubleSide }))));
            } else { const a = K.bbox(old.polys).min, z = K.bbox(b.polys).min; moved.set(b.id, [z[0] - a[0], z[1] - a[1], z[2] - a[2]]); }
          }
          const any = [...moved.values()][0] || [0, 0, 0];
          dlg.set('n', m === 'face' ? 'Modře je nová poloha tělesa.' : this.each ? 'Každé těleso se posune samostatně.' : `Posun: X ${fmtc(any[0], 2)} · Y ${fmtc(any[1], 2)} · Z ${fmtc(any[2], 2)} mm`);
        } catch (e) { dlg.set('n', '!' + e.message); dlg.okEnabled(false); }
      } else dlg.set('n', m === 'body' && this.ref && ids.includes(this.ref) ? '!Vztažné těleso nemůže být mezi zarovnávanými' : '');
      for (const [id, e] of meshes) {
        const d = moved.get(id);
        if (d) { e.mesh.matrixAutoUpdate = false; e.mesh.matrix.makeTranslation(d[0], d[1], d[2]); e.mesh.matrixWorldNeedsUpdate = true; }
        else { e.mesh.matrixAutoUpdate = true; e.mesh.matrix.identity(); e.mesh.updateMatrix(); }
      }
      styleBodies();
    },
    onBody(id) {
      if (this.mode === 'face') return;
      if (this.mode === 'body' && this.pick === 'ref') { this.ref = id; this.bodies.delete(id); this.pick = 'bodies'; this.update(); return; }
      if (this.all) return;
      if (this.bodies.has(id)) this.bodies.delete(id); else this.bodies.add(id);
      if (this.mode === 'body' && !this.ref && this.bodies.size) this.pick = 'ref';
      this.update();
    },
    faceUnder(ev) { const h = hitBodies(ev); return h ? faceAtHit(h) : null; },
    onMove(ev) {
      if (this.mode !== 'face') { dom.style.cursor = hitBodies(ev) ? 'pointer' : ''; return; }
      const fc = this.faceUnder(ev), same = (a, b) => (!a && !b) || (a && b && a.bodyId === b.bodyId && a.group[0] === b.group[0]);
      if (!same(fc, this.hoverFace)) { this.hoverFace = fc; this.update(); }
      dom.style.cursor = fc ? 'pointer' : '';
    },
    onClick(ev) {
      if (this.mode !== 'face') { const h = hitBodies(ev); if (h) this.onBody(h.object.userData.bodyId); return; }
      const fc = this.faceUnder(ev);
      if (!fc) { if (hitBodies(ev)) toast('Tuto plochu nelze vybrat samostatně (zakřivená plocha, která není válcem).'); return; }
      if (this.pick === 'src') { this.srcFace = fc; this.src = alignDesc(fc); this.body = fc.bodyId; this.pick = 'dst'; if (this.dstFace && this.dstFace.bodyId === fc.bodyId) { this.dst = null; this.dstFace = null; } }
      else {
        if (fc.bodyId === this.body) { toast('Cílová plocha musí patřit jinému tělesu.'); return; }
        this.dstFace = fc; this.dst = alignDesc(fc);
      }
      this.hoverFace = null; this.update();
    },
    ok() { if (!this.ready()) return null; const out = this.feature(); out.id = f ? f.id : newId(); return out; },
    cleanup() {
      for (const e of meshes.values()) { e.mesh.matrixAutoUpdate = true; e.mesh.matrix.identity(); e.mesh.position.set(0, 0, 0); e.mesh.rotation.set(0, 0, 0); e.mesh.updateMatrix(); }
      this.highlight = null; bodyTint.clear();
    }
  };
  beginCmd(c); c.init();
}
function selectAll() {
  if (sk || cmd) return;
  const ids = cur.bodies.filter(b => bodiesVisible() && isVis(b.id)).map(b => b.id);
  if (!ids.length) { toast('Model neobsahuje žádná viditelná tělesa.'); return; }
  sel = new Set(ids); tlSel = null; styleBodies(); renderBrowser(); renderTimeline(); updateInfo();
  toast(`Vybráno: ${plural(ids.length, 'těleso', 'tělesa', 'těles')}`);
}

/* ================= clipboard: copy, paste, duplicate ================= */
let clip = null;
function translateEnt(e, dx, dy) {
  const o = clone(e);
  if (o.t === 'slot') { o.x1 += dx; o.y1 += dy; o.x2 += dx; o.y2 += dy; }
  else if (o.pts) o.pts = o.pts.map(p => [p[0] + dx, p[1] + dy]);
  else { o.x += dx; o.y += dy; }
  return o;
}
function copySel() {
  if (sk) {
    const e = sk.f.ents[sk.selEnt]; if (!e) { toast('Vyberte prvek skici, který chcete kopírovat.'); return; }
    clip = { kind: 'ents', ents: [clone(e)], n: 0 }; toast('Prvek skici zkopírován. Vložíte ho Ctrl+V.'); return;
  }
  if (cmd) return;
  if (!sel.size) { toast('Vyberte těleso, které chcete kopírovat.'); return; }
  clip = { kind: 'bodies', ids: [...sel] };
  toast(`Zkopírováno: ${plural(sel.size, 'těleso', 'tělesa', 'těles')}. Vložíte Ctrl+V.`);
}
function pasteClip() {
  if (sk) {
    if (!clip || clip.kind !== 'ents') { toast('Schránka neobsahuje prvek skici. Zkopírujte ho Ctrl+C.'); return; }
    clip.n++;
    const d = 10 * clip.n;
    for (const e of clip.ents) sk.f.ents.push(translateEnt(e, d, d));
    sk.selEnt = sk.f.ents.length - 1; renderPalette(); redrawSketch(); toast('Vloženo'); return;
  }
  if (cmd) return;
  if (!clip || clip.kind !== 'bodies') { toast('Schránka je prázdná. Těleso zkopírujete Ctrl+C.'); return; }
  const ids = clip.ids.filter(id => meshes.has(id));
  if (!ids.length) { toast('Zkopírovaná tělesa už v modelu nejsou.'); return; }
  const bb = K.bbox(ids.flatMap(id => bodyById(id).polys));
  startMove(null, null, { bodies: ids, t: [Math.round((bb.max[0] - bb.min[0] + 5) * 10) / 10, 0, 0], r: [0, 0, 0], copy: true, count: 1, dir: 'free', paste: true });
}
function duplicateSel() {
  if (sk) {
    const e = sk.f.ents[sk.selEnt]; if (!e) { toast('Vyberte prvek skici, který chcete duplikovat.'); return; }
    sk.f.ents.push(translateEnt(e, 10, 10)); sk.selEnt = sk.f.ents.length - 1; renderPalette(); redrawSketch(); toast('Duplikováno'); return;
  }
  if (cmd) return;
  if (!sel.size) { toast('Vyberte těleso, které chcete duplikovat.'); return; }
  const ids = [...sel], bb = K.bbox(ids.flatMap(id => bodyById(id).polys));
  const f = { id: newId(), type: 'move', bodies: ids, t: [Math.round((bb.max[0] - bb.min[0] + 5) * 10) / 10, 0, 0], r: [0, 0, 0], copy: true, count: 1, dir: 'free' };
  doc.features.splice(doc.marker, 0, f); doc.marker++;
  pushHist(); saveDoc();
  refreshBusy(() => { sel = new Set(cur.bodies.filter(b => b.from === f.id).map(b => b.id)); styleBodies(); renderBrowser(); updateInfo(); toast('Duplikováno vedle originálu. Polohu upravíte dvojklikem na prvek v časové ose.'); });
}

/* ================= thread ================= */
const adjCache = new WeakMap();
function polyAdjacency(polys) {
  let a = adjCache.get(polys);
  if (!a) { a = polys.map(() => []); for (const e of K.edgeMapOf(polys).values()) if (e.ps.length === 2) { a[e.ps[0]].push(e.ps[1]); a[e.ps[1]].push(e.ps[0]); } adjCache.set(polys, a); }
  return a;
}
/* find the full cylindrical face that polygon pi belongs to */
function cylinderAt(polys, pi) {
  const adj = polyAdjacency(polys), p0 = polys[pi], lim = Math.cos(25 * D2R);
  let axis = null;
  for (const nb of adj[pi]) {
    const d = K.vdot(p0.n, polys[nb].n);
    if (d < 0.99999 && d > lim) { const c = K.cross(p0.n, polys[nb].n); if (Math.hypot(c[0], c[1], c[2]) > 1e-6) { axis = K.vnorm(c); break; } }
  }
  if (!axis) return null;
  const group = new Set([pi]), st = [pi];
  while (st.length) {
    const i = st.pop();
    for (const nb of adj[i]) { if (group.has(nb)) continue; const q = polys[nb]; if (Math.abs(K.vdot(q.n, axis)) < 0.02 && K.vdot(q.n, polys[i].n) > lim) { group.add(nb); st.push(nb); } }
  }
  if (group.size < 6) return null;
  const tt = Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = K.vnorm(K.cross(axis, tt)), e2 = K.cross(axis, e1);
  const pts = []; for (const i of group) for (const v of polys[i].v) pts.push(v);
  const p2 = pts.map(v => [K.vdot(v, e1), K.vdot(v, e2)]);
  const A = p2[0]; let B = A, bd = 0, C = A, cd = 0;
  for (const q of p2) { const d = Math.hypot(q[0] - A[0], q[1] - A[1]); if (d > bd) { bd = d; B = q; } }
  for (const q of p2) { const d = Math.abs((B[0] - A[0]) * (q[1] - A[1]) - (B[1] - A[1]) * (q[0] - A[0])); if (d > cd) { cd = d; C = q; } }
  const D = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]));
  if (Math.abs(D) < 1e-9) return null;
  const s = q => q[0] * q[0] + q[1] * q[1];
  const cx = (s(A) * (B[1] - C[1]) + s(B) * (C[1] - A[1]) + s(C) * (A[1] - B[1])) / D, cy = (s(A) * (C[0] - B[0]) + s(B) * (A[0] - C[0]) + s(C) * (B[0] - A[0])) / D;
  const r = Math.hypot(A[0] - cx, A[1] - cy);
  const angs = [];
  for (const q of p2) { const d = Math.hypot(q[0] - cx, q[1] - cy); if (Math.abs(d - r) > 0.03 * r + 0.01) return null; angs.push(Math.atan2(q[1] - cy, q[0] - cx)); }
  angs.sort((x, y) => x - y);
  let gap = angs[0] + 2 * Math.PI - angs[angs.length - 1];
  for (let i = 1; i < angs.length; i++) gap = Math.max(gap, angs[i] - angs[i - 1]);
  if (gap > 1.2) return null;
  let t0 = Infinity, t1 = -Infinity; for (const v of pts) { const t = K.vdot(v, axis); if (t < t0) t0 = t; if (t > t1) t1 = t; }
  const base = K.vadd(K.vadd(K.vmul(e1, cx), K.vmul(e2, cy)), K.vmul(axis, t0));
  const cen = (() => { const q = [0, 0, 0]; for (const v of p0.v) { q[0] += v[0] / p0.v.length; q[1] += v[1] / p0.v.length; q[2] += v[2] / p0.v.length; } return q; })();
  const onAxis = K.vadd(K.vadd(K.vmul(e1, cx), K.vmul(e2, cy)), K.vmul(axis, K.vdot(cen, axis)));
  const internal = K.vdot(p0.n, K.vsub(cen, onAxis)) < 0;
  const r6 = x => Math.round(x * 1e4) / 1e4;
  /* orient the axis so it points up (or along the dominant positive world axis): offsets are then measured from the bottom */
  const dom3 = [0, 1, 2].reduce((m, k) => (Math.abs(axis[k]) > Math.abs(axis[m]) ? k : m), 2);
  let cOut = base, aOut = axis;
  if (axis[dom3] < 0) { cOut = K.vadd(base, K.vmul(axis, t1 - t0)); aOut = K.vmul(axis, -1); }
  return { c: cOut.map(r6), ax: aOut.map(r6), r: r6(r), len: r6(t1 - t0), internal, group };
}
const threadLabel = (d, p) => `M${fmtc(d, 1)} × ${fmtc(p, 2)}`;
function startThread(editIndex, f) {
  const c = {
    editIndex, body: f ? f.body : null, face: f ? { c: f.c, ax: f.ax, r: f.r, len: f.len, internal: f.internal } : null,
    size: f ? f.size : 10, pitch: f ? f.pitch : 1.5, left: f ? !!f.left : false, full: f ? f.full !== false : true,
    length: f ? (f.length || 10) : 10, start: f ? (f.start || 0) : 0, fromEnd: f ? !!f.fromEnd : false,
    hover: null, timer: null, tool: null, handles: [], hgrp: null, drag: null, hoverH: null,
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      openDialog({
        title: 'Závit', icon: 'thread',
        fields: [{ k: 'sel', id: 'face', label: 'Plocha' }, { k: 'note', id: 'kind' },
          { k: 'opt', id: 'size', label: 'Velikost', options: Engine.THREADS.map(([d, p]) => [String(d), threadLabel(d, p)]), value: String(this.size) },
          { k: 'num', id: 'pitch', label: 'Stoupání', value: this.pitch },
          { k: 'seg', id: 'hand', label: 'Směr', options: [['r', 'Pravý'], ['l', 'Levý']], value: this.left ? 'l' : 'r' },
          { k: 'chk', id: 'full', label: 'Po celé délce plochy', value: this.full },
          { k: 'seg', id: 'from', label: 'Měřit od', options: [['a', 'Spodní konec'], ['b', 'Horní konec']], value: this.fromEnd ? 'b' : 'a' },
          { k: 'num', id: 'start', label: 'Odsazení', value: this.start }, { k: 'num', id: 'length', label: 'Délka závitu', value: this.length },
          { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'size') { this.size = parseFloat(dlg.get('size')); const t = Engine.THREADS.find(x => x[0] === this.size); if (t) { this.pitch = t[1]; dlg.set('pitch', t[1]); } }
          else if (id === 'pitch') { const v = dlg.get('pitch'); if (v > 0) this.pitch = v; }
          else if (id === 'hand') this.left = dlg.get('hand') === 'l';
          else if (id === 'full') this.full = dlg.get('full');
          else if (id === 'from') this.fromEnd = dlg.get('from') === 'b';
          else if (id === 'length') { const v = dlg.get('length'); if (v > 0) { this.length = v; this.full = false; dlg.set('full', false); } }
          else if (id === 'start') { const v = dlg.get('start'); if (v >= 0) this.start = v; }
          this.update();
        }
      });
      this.hgrp = new THREE.Group(); G.overlay.add(this.hgrp);
      for (let i = 0; i < 2; i++) {
        const mk = g => { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: tok.orange, depthTest: false, transparent: true })); m.renderOrder = 12; return m; };
        const cone = mk(new THREE.ConeGeometry(1, 2.6, 18)), ball = noRay(mk(new THREE.SphereGeometry(0.55, 12, 8)));
        const shaft = noRay(new THREE.Line(lineGeo([0, 0, 0, 0, 0, 0]), new THREE.LineBasicMaterial({ color: tok.orange, depthTest: false, transparent: true })));
        shaft.frustumCulled = false; shaft.renderOrder = 12;
        this.hgrp.add(cone, ball, shaft); this.handles.push({ cone, ball, shaft });
      }
      this.update();
    },
    setFace(bodyId, cyl) {
      this.body = bodyId; this.face = { c: cyl.c, ax: cyl.ax, r: cyl.r, len: cyl.len, internal: cyl.internal };
      const s = Engine.suggestThread(cyl.r, cyl.internal); this.size = s.d; this.pitch = s.p;
      dlg.set('size', String(s.d)); dlg.set('pitch', s.p);
      if (this.start > cyl.len) { this.start = 0; dlg.set('start', 0); }
      this.update();
    },
    /* thread region on the face as [a, b] measured from c along ax */
    span() {
      const L = this.face.len, st = Math.max(0, Math.min(L, this.start)), len = this.full ? L - st : Math.max(0, Math.min(L - st, this.length));
      return this.fromEnd ? [L - st - len, L - st] : [st, st + len];
    },
    setSpan(a, b) {
      const L = this.face.len;
      this.full = false; dlg.set('full', false);
      this.length = Math.round((b - a) * 1000) / 1000; this.start = Math.round((this.fromEnd ? L - b : a) * 1000) / 1000;
      dlg.set('length', this.length); dlg.set('start', this.start);
    },
    feature() {
      return { id: f ? f.id : 'tmp', type: 'thread', body: this.body, ...this.face, size: this.size, pitch: this.pitch, left: this.left, full: this.full,
        length: this.length, start: this.start, fromEnd: this.fromEnd };
    },
    update() {
      const fc = this.face;
      dlg.set('face', { text: fc ? `Válcová plocha Ø${fmtc(fc.r * 2, 2)}` : 'Klepněte na válcovou plochu', has: !!fc, active: true });
      dlg.set('kind', fc ? `${fc.internal ? 'Vnitřní závit (díra)' : 'Vnější závit (čep)'} · délka plochy ${fmtc(fc.len, 2)} mm` : 'Vyberte vnější plochu čepu nebo vnitřní plochu díry.');
      dlg.show('length', !this.full);
      if (fc) {
        const vert = Math.abs(fc.ax[2]) > 0.7, lb = vert ? ['Spodní konec', 'Horní konec'] : ['Začátek plochy', 'Konec plochy'];
        $$('#dlg-from button').forEach((b, i) => { b.textContent = lb[i]; });
      }
      setPrompt(fc ? 'Oranžovými šipkami nastavíte začátek a konec závitu. Klepnutím na jinou válcovou plochu výběr změníte.' : 'Klepněte na válcovou plochu tělesa');
      this.hgrp.visible = !!fc;
      clearTimeout(this.timer);
      if (!fc) { dlg.set('n', ''); dlg.okEnabled(false); requestRender(); return; }
      const ref = fc.internal ? this.size - 1.0825 * this.pitch : this.size, dia = fc.r * 2;
      const warn = Math.abs(ref - dia) > Math.max(0.15 * ref, 0.3) ? `Průměr plochy Ø${fmtc(dia, 2)} neodpovídá velikosti ${threadLabel(this.size, this.pitch)} (${fc.internal ? 'díra pro ni má mít' : 'čep má mít'} Ø${fmtc(ref, 2)}). ` : '';
      dlg.set('n', warn + 'Počítám náhled…'); dlg.okEnabled(false);
      requestRender();
      this.timer = setTimeout(() => {
        if (cmd !== this) return;
        clearGroup(G.preview); this.tool = null;
        try {
          this.tool = Engine.threadTool(this.feature());
          G.preview.add(previewMesh(this.tool, 'cut'));
          dlg.set('n', warn ? '!' + warn.trim() : 'Červeně je materiál, který závit odebere.'); dlg.okEnabled(true);
        } catch (e) { dlg.set('n', '!' + e.message); }
        requestRender();
      }, this.drag ? 250 : 150);
    },
    /* handle geometry: point on the side of the cylinder facing the camera */
    frame() {
      const fc = this.face, ax = v3(fc.ax), c0 = v3(fc.c);
      const mid = c0.clone().addScaledVector(ax, fc.len / 2);
      let side = cam().position.clone().sub(mid); side.addScaledVector(ax, -side.dot(ax));
      if (side.lengthSq() < 1e-9) side = new V3(1, 0, 0).addScaledVector(ax, -ax.x);
      side.normalize();
      return { ax, c0, side, rr: fc.internal ? fc.r * 0.5 : fc.r + Math.max(1.5, fc.r * 0.15) };
    },
    onFrame() {
      if (!this.face) return;
      const { ax, c0, side, rr } = this.frame(), sp = this.span();
      [0, 1].forEach(i => {
        const o = this.handles[i], dir = ax.clone().multiplyScalar(i ? 1 : -1);
        const tip = c0.clone().addScaledVector(ax, sp[i]).addScaledVector(side, rr);
        const s = arrowSize(tip);
        o.cone.scale.setScalar(s); o.cone.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir); o.cone.position.copy(tip).addScaledVector(dir, s * 2.2);
        o.ball.scale.setScalar(s); o.ball.position.copy(tip);
        const b = tip.clone().addScaledVector(dir, s * 1.2), pa = o.shaft.geometry.attributes.position;
        pa.setXYZ(0, tip.x, tip.y, tip.z); pa.setXYZ(1, b.x, b.y, b.z); pa.needsUpdate = true;
        const col = (this.drag ? this.drag.i === i : this.hoverH === i) ? tok.accent : tok.orange;
        o.cone.material.color.copy(col); o.ball.material.color.copy(col); o.shaft.material.color.copy(col);
      });
    },
    handleAt(ev) {
      if (!this.face) return -1;
      ray.setFromCamera(evNdc(ev), cam());
      for (let i = 0; i < 2; i++) { const cn = this.handles[i].cone; cn.updateMatrixWorld(true); if (ray.intersectObject(cn, false).length) return i; }
      return -1;
    },
    onDown(ev) {
      const i = this.handleAt(ev); if (i < 0) return false;
      const { ax, c0, side, rr } = this.frame();
      this.drag = { i, a: c0.clone().addScaledVector(side, rr), dir: ax };
      controls.enabled = false; return true;
    },
    onDrag(ev) {
      const d = this.drag; if (!d) return;
      ray.setFromCamera(evNdc(ev), cam());
      const o = ray.ray.origin, r = ray.ray.direction, w0 = d.a.clone().sub(o), b = d.dir.dot(r), dd = d.dir.dot(w0), e = r.dot(w0), den = 1 - b * b;
      if (Math.abs(den) < 1e-6) return;
      const L = this.face.len, st = settings.gridSnap ? settings.snap : 0.01, minL = Math.max(this.pitch, st);
      let t = Math.round(((b * e - dd) / den) / st) * st;
      const sp = this.span();
      if (d.i === 0) { t = Math.max(0, Math.min(t, sp[1] - minL)); if (Math.abs(t - sp[0]) < 1e-9) return; this.setSpan(t, sp[1]); }
      else { t = Math.min(L, Math.max(t, sp[0] + minL)); if (Math.abs(t - sp[1]) < 1e-9) return; this.setSpan(sp[0], t); }
      this.update();
      const el = $('#dim'), px = evPx(ev);
      el.textContent = `Odsazení ${fmtc(this.start, 2)} mm · délka ${fmtc(this.length, 2)} mm`; el.hidden = false;
      el.style.left = px[0] + 'px'; el.style.top = px[1] + 'px';
    },
    onUp() { this.drag = null; controls.enabled = true; $('#dim').hidden = true; this.update(); },
    pick(ev) {
      const h = hitBodies(ev); if (!h) return null;
      const { pi } = polyOfHit(h), polys = h.object.userData.polys, id = h.object.userData.bodyId;
      if (this.hover && this.hover.polys === polys && this.hover.cyl && this.hover.cyl.group.has(pi)) return this.hover;
      return { id, polys, cyl: cylinderAt(polys, pi) };
    },
    onMove(ev) {
      const hi = this.handleAt(ev), hv = hi >= 0 ? hi : null;
      if (hv !== this.hoverH) { this.hoverH = hv; requestRender(); }
      if (hv !== null) { dom.style.cursor = 'grab'; return; }
      const p = this.pick(ev);
      if (p !== this.hover) {
        this.hover = p;
        this.hgrp.parent && G.overlay.remove(this.hgrp);
        clearGroup(G.overlay); G.overlay.add(this.hgrp);
        if (p && p.cyl) G.overlay.add(meshFromPolys([...p.cyl.group].map(i => p.polys[i]), new THREE.MeshBasicMaterial({ color: tok.accent, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
        requestRender();
      }
      dom.style.cursor = p && p.cyl ? 'pointer' : '';
    },
    onClick(ev) {
      if (this.handleAt(ev) >= 0) return;
      const p = this.pick(ev);
      if (!p) return;
      if (!p.cyl) { toast('Závit lze vytvořit jen na celé válcové ploše (čep nebo díra).'); return; }
      this.setFace(p.id, p.cyl);
    },
    ok() { if (!this.tool || !this.face) return null; const out = this.feature(); out.id = f ? f.id : newId(); return out; },
    cleanup() { clearTimeout(this.timer); controls.enabled = true; $('#dim').hidden = true; }
  };
  beginCmd(c); c.init();
}

/* ================= scale finished bodies ================= */
/* dimension label next to the pointer while dragging */
function showDimAt(ev, text) { const el = $('#dim'), px = evPx(ev); el.textContent = text; el.hidden = false; el.style.left = px[0] + 'px'; el.style.top = px[1] + 'px'; }

function startScale(editIndex, f) {
  const c = {
    editIndex, all: f ? !!f.all : !sel.size, bodies: new Set(f ? (f.bodies || []) : [...sel]),
    s: f ? f.s.slice() : [1, 1, 1], uniform: f ? (f.s[0] === f.s[1] && f.s[1] === f.s[2]) : true, pivot: f ? (f.pivot || 'base') : 'base',
    box: new THREE.Box3(), highlight: new Set(),
    ids() { return this.all ? cur.bodies.map(b => b.id) : [...this.bodies].filter(id => meshes.has(id)); },
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      openDialog({
        title: 'Měřítko', icon: 'scale',
        fields: [{ k: 'chk', id: 'all', label: 'Celý model', value: this.all }, { k: 'sel', id: 'bodies', label: 'Tělesa' },
          { k: 'chk', id: 'uniform', label: 'Zachovat poměr stran', value: this.uniform },
          { k: 'num', id: 'factor', label: 'Měřítko', unit: '×', value: this.s[0] }, { k: 'xyz', id: 'fxyz', label: 'Měřítko (×)', value: this.s },
          { k: 'xyz', id: 'size', label: 'Rozměry (mm)', value: [0, 0, 0] },
          { k: 'btns', id: 'quick', label: 'Rychle', options: [['0.5', '50 %'], ['2', '200 %'], ['25.4', 'palce → mm']] },
          { k: 'opt', id: 'pivot', label: 'Střed změny', options: [['base', 'Spodní plocha (zůstane na podložce)'], ['center', 'Střed výběru'], ['origin', 'Počátek']], value: this.pivot },
          { k: 'note', id: 'n' }],
        onChange: (id, live) => {
          if (id === 'all') { this.all = dlg.get('all'); this.recenter(); return; }
          if (id === 'uniform') { this.uniform = dlg.get('uniform'); if (this.uniform) this.s = [this.s[0], this.s[0], this.s[0]]; }
          else if (id === 'factor') { const v = dlg.get('factor'); if (v > 0) this.s = [v, v, v]; else return; }
          else if (id === 'fxyz') { const v = dlg.get('fxyz'); if (v.every(x => x > 0)) this.s = v; else return; }
          else if (id === 'size') {
            const v = dlg.get('size'), o = this.orig();
            const j = [0, 1, 2].find(k => Math.abs(v[k] - o[k] * this.s[k]) > 1e-6);
            if (j === undefined || !(v[j] > 0) || !(o[j] > 1e-9)) return;
            const fj = v[j] / o[j];
            if (this.uniform) this.s = [fj, fj, fj]; else this.s[j] = fj;
          } else if (id === 'pivot') this.pivot = dlg.get('pivot');
          this.refreshFields(); this.apply();
        },
        onBtn: (id, v) => { const k = parseFloat(v); this.s = this.s.map(x => x * k); this.refreshFields(); this.apply(); }
      });
      transform.setMode('scale'); transform.setSpace('local');
      transform.addEventListener('objectChange', this.onGizmo);
      transform.addEventListener('dragging-changed', this.onDragChange);
      dom.addEventListener('pointermove', this.onPtr);
      dom.addEventListener('pointerdown', this.onPtrDown, true);
      this.recenter();
    },
    pivotObj: null, onGizmo: null, onDragChange: null, onPtr: null, onPtrDown: null, lastEv: null, downEv: null, startEv: null, axis: null, dragging: false, s0: null,
    pivotPt() { const mid = this.box.getCenter(new V3()); return this.pivot === 'origin' ? [0, 0, 0] : this.pivot === 'base' ? [mid.x, mid.y, this.box.min.z] : [mid.x, mid.y, mid.z]; },
    /* place the manipulator at the scaling centre and mirror the current factors in it */
    syncGizmo() {
      if (this.box.isEmpty()) { transform.detach(); return; }
      const cc = this.pivotPt();
      this.pivotObj.position.set(cc[0], cc[1], cc[2]); this.pivotObj.rotation.set(0, 0, 0);
      this.pivotObj.scale.set(1, 1, 1);
      if (transform.object !== this.pivotObj) transform.attach(this.pivotObj);
      requestRender();
    },
    /* size follows the pointer 1:1 in millimetres (independent of the current scale), snapped to the grid step */
    dragTo(ev) {
      const d0 = this.startEv; if (!d0) return;
      const ax = this.axis || 'XYZ', o = this.orig(), S0 = o.map((v, k) => v * this.s0[k]);
      const ks = [0, 1, 2].filter(k => ax.includes('XYZ'[k]));
      if (!ks.length) return;
      let delta;
      if (ks.length === 1) {
        const k = ks[0], dir = new V3(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0), p = this.pivotObj.position;
        const t1 = lineParam(ev, p, dir), t0 = lineParam(d0, p, dir); if (t1 === null || t0 === null) return;
        delta = t1 - t0;
      } else delta = ((ev.clientX - d0.clientX) - (ev.clientY - d0.clientY)) * worldPerPx(this.pivotObj.position);
      const st = settings.gridSnap ? settings.snap : 0.01, snapS = v => Math.max(st, Math.round(v / st) * st);
      let k = ks[0]; for (const j of ks) if (S0[j] > S0[k]) k = j;
      if (this.uniform) { if (!(S0[k] > 1e-9)) return; const f = snapS(S0[k] + delta) / S0[k]; this.s = this.s0.map(v => v * f); }
      else { this.s = this.s0.slice(); for (const j of ks) if (o[j] > 1e-9) this.s[j] = snapS(S0[j] + delta) / o[j]; }
      this.refreshFields(); this.apply();
      const sz = o.map((v, j) => v * this.s[j]);
      showDimAt(ev, this.uniform ? `${fmtc(this.s[0] * 100, 1)} % · ${sz.map(v => fmtc(v, 1)).join(' × ')} mm` : ks.map(j => `${'XYZ'[j]}: ${fmtc(sz[j], 2)} mm`).join(' · '));
    },
    orig() { const s = this.box.getSize(new V3()); return [s.x, s.y, s.z]; },
    recenter() {
      const ids = this.ids(); this.box = new THREE.Box3();
      for (const id of ids) { const e = meshes.get(id); if (!e) continue; e.mesh.geometry.computeBoundingBox(); this.box.union(e.mesh.geometry.boundingBox); }
      this.highlight = new Set(ids);
      dlg.show('bodies', !this.all);
      dlg.set('bodies', this.all ? { text: 'Celý model', has: true, active: false } : bodySelText(new Set(ids)));
      setPrompt(this.all ? 'Táhněte kostičkami manipulátoru (střed = všechny osy) nebo zadejte měřítko či rozměry' : ids.length ? 'Táhněte kostičkami manipulátoru (střed = všechny osy). Klepnutím na těleso výběr změníte.' : 'Vyberte tělesa, jejichž velikost chcete změnit');
      dlg.okEnabled(ids.length > 0);
      this.refreshFields(); this.apply();
    },
    refreshFields() {
      dlg.show('factor', this.uniform); dlg.show('fxyz', !this.uniform);
      const r = x => Math.round(x * 1e5) / 1e5;
      this.s = this.s.map(x => Math.round(x * 1e9) / 1e9);
      dlg.set('factor', r(this.s[0])); dlg.set('fxyz', this.s.map(r));
      const o = this.orig();
      if (!this.box.isEmpty()) {
        dlg.set('size', o.map((v, k) => r(v * this.s[k])));
        dlg.set('n', `Původní rozměry ${o.map(v => fmtc(v, 2)).join(' × ')} mm`);
      }
    },
    matrix() {
      if (this.box.isEmpty()) return new THREE.Matrix4();
      const mid = this.box.getCenter(new V3()), s = this.s;
      const cc = this.pivot === 'origin' ? [0, 0, 0] : this.pivot === 'base' ? [mid.x, mid.y, this.box.min.z] : [mid.x, mid.y, mid.z];
      return new THREE.Matrix4().fromArray([s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, cc[0] * (1 - s[0]), cc[1] * (1 - s[1]), cc[2] * (1 - s[2]), 1]);
    },
    apply() {
      const M = this.matrix(), ids = new Set(this.ids());
      for (const [id, e] of meshes) {
        if (ids.has(id)) { e.mesh.matrixAutoUpdate = false; e.mesh.matrix.copy(M); e.mesh.matrixWorldNeedsUpdate = true; }
        else { e.mesh.matrixAutoUpdate = true; e.mesh.matrix.identity(); e.mesh.updateMatrix(); }
      }
      if (!this.dragging) this.syncGizmo();
      styleBodies();
    },
    onBody(id) { if (this.all) return; if (this.bodies.has(id)) this.bodies.delete(id); else this.bodies.add(id); this.recenter(); },
    onMove(ev) { dom.style.cursor = transform.axis ? 'grab' : hitBodies(ev) ? 'pointer' : ''; },
    onClick(ev) { const h = hitBodies(ev); if (h) this.onBody(h.object.userData.bodyId); },
    ok() {
      const ids = this.ids(); if (!ids.length || !this.s.every(x => x > 0)) return null;
      return { id: f ? f.id : newId(), type: 'scale', all: this.all, bodies: this.all ? [] : ids, s: this.s.slice(), pivot: this.pivot };
    },
    cleanup() {
      transform.removeEventListener('objectChange', this.onGizmo);
      transform.removeEventListener('dragging-changed', this.onDragChange);
      dom.removeEventListener('pointermove', this.onPtr);
      dom.removeEventListener('pointerdown', this.onPtrDown, true);
      transform.detach(); scene.remove(this.pivotObj); transform.setMode('translate'); transform.setSpace('world');
      for (const e of meshes.values()) { e.mesh.matrixAutoUpdate = true; e.mesh.matrix.identity(); e.mesh.position.set(0, 0, 0); e.mesh.rotation.set(0, 0, 0); e.mesh.updateMatrix(); }
      this.highlight = null; controls.enabled = true; $('#dim').hidden = true;
    }
  };
  c.pivotObj = new THREE.Object3D(); scene.add(c.pivotObj);
  c.onGizmo = () => {};
  c.onDragChange = e => {
    controls.enabled = !e.value; c.dragging = !!e.value;
    if (e.value) { c.s0 = c.s.slice(); c.axis = transform.axis; c.startEv = c.downEv ? { clientX: c.downEv.clientX, clientY: c.downEv.clientY } : null; }
    else { c.s0 = null; c.startEv = null; $('#dim').hidden = true; c.syncGizmo(); }
  };
  c.onPtr = e => { c.lastEv = e; if (c.dragging) c.dragTo(e); };
  c.onPtrDown = e => { c.downEv = e; };
  beginCmd(c); c.init();
}

/* ================= rotate finished model ================= */
const QUICK = [['x-', 'X −90°'], ['y-', 'Y −90°'], ['z-', 'Z −90°'], ['x+', 'X +90°'], ['y+', 'Y +90°'], ['z+', 'Z +90°']];
const roundDeg = v => { let d = Math.round(v / D2R * 100) / 100; if (Object.is(d, -0) || Math.abs(d) < 0.005) d = 0; return d; };
function startRotate(editIndex, f) {
  const pivot = new THREE.Object3D(); scene.add(pivot);
  const c = {
    editIndex, all: f ? !!f.all : !sel.size, bodies: new Set(f ? (f.bodies || []) : [...sel]), r: f ? f.r.slice() : [0, 0, 0],
    pivotMode: f ? (f.pivot || 'center') : 'center', ground: f ? !!f.ground : true, faceMode: false, center: new V3(), highlight: new Set(),
    ids() { return this.all ? cur.bodies.map(b => b.id) : [...this.bodies].filter(id => meshes.has(id)); },
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      openDialog({
        title: 'Otočit', icon: 'rotate',
        fields: [{ k: 'chk', id: 'all', label: 'Otočit celý model', value: this.all }, { k: 'sel', id: 'bodies', label: 'Tělesa' },
          { k: 'btns', id: 'quick', label: 'Rychle', options: QUICK }, { k: 'xyz', id: 'r', label: 'Úhel (°)', value: this.r },
          { k: 'opt', id: 'pivot', label: 'Střed otáčení', options: [['center', 'Střed výběru'], ['origin', 'Počátek']], value: this.pivotMode },
          { k: 'chk', id: 'ground', label: 'Položit na podložku (Z = 0)', value: this.ground },
          { k: 'btns', id: 'face', label: 'Plochou dolů', options: [['pick', 'Vybrat plochu v modelu']] }, { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'all') this.all = dlg.get('all');
          if (id === 'r') this.r = dlg.get('r');
          if (id === 'pivot') this.pivotMode = dlg.get('pivot');
          if (id === 'ground') this.ground = dlg.get('ground');
          this.recenter();
        },
        onBtn: (id, v) => {
          if (id === 'face') { this.faceMode = !this.faceMode; this.recenter(); return; }
          const ax = v[0] === 'x' ? new V3(1, 0, 0) : v[0] === 'y' ? new V3(0, 1, 0) : new V3(0, 0, 1);
          const q = new THREE.Quaternion().setFromAxisAngle(ax, (v[1] === '+' ? 1 : -1) * Math.PI / 2).multiply(this.quat());
          this.setQuat(q); this.recenter();
        }
      });
      transform.setMode('rotate'); transform.setSpace('world');
      transform.addEventListener('objectChange', this.onGizmo);
      transform.addEventListener('dragging-changed', this.onDragChange);
      this.recenter();
    },
    quat() { return new THREE.Quaternion().setFromEuler(new THREE.Euler(this.r[0] * D2R, this.r[1] * D2R, this.r[2] * D2R, 'XYZ')); },
    setQuat(q) { const e = new THREE.Euler().setFromQuaternion(q, 'XYZ'); this.r = [roundDeg(e.x), roundDeg(e.y), roundDeg(e.z)]; dlg.set('r', this.r); },
    onGizmo: null, onDragChange: null,
    recenter() {
      const ids = this.ids(), box = new THREE.Box3();
      for (const id of ids) { const e = meshes.get(id); if (!e) continue; e.mesh.geometry.computeBoundingBox(); box.union(e.mesh.geometry.boundingBox); }
      this.highlight = new Set(ids);
      if (box.isEmpty()) transform.detach(); else { if (this.pivotMode === 'origin') this.center.set(0, 0, 0); else box.getCenter(this.center); transform.attach(pivot); }
      dlg.show('bodies', !this.all);
      dlg.set('bodies', this.all ? { text: 'Celý model', has: true, active: false } : bodySelText(new Set(ids)));
      const btn = $('#dialog [data-btn="face"]'); if (btn) { btn.setAttribute('aria-pressed', String(this.faceMode)); btn.textContent = this.faceMode ? 'Klepněte na plochu…' : 'Vybrat plochu v modelu'; }
      setPrompt(this.faceMode ? 'Klepněte na plochu, která má ležet na podložce' : this.all ? 'Otáčejte manipulátorem, rychlými tlačítky nebo zadejte úhly' : (ids.length ? 'Klepnutím na těleso výběr změníte' : 'Vyberte tělesa k otočení'));
      dlg.set('n', this.all ? `Otočí se ${plural(ids.length, 'těleso', 'tělesa', 'těles')} najednou.` : '');
      dlg.okEnabled(ids.length > 0);
      this.apply(true);
    },
    matrix() {
      const M = new THREE.Matrix4().fromArray(Engine.eulerMatrix(this.center.toArray(), [0, 0, 0], this.r));
      if (!this.ground) return M;
      const m = M.elements; let mz = Infinity;
      for (const id of this.ids()) {
        const e = meshes.get(id); if (!e) continue;
        const a = e.mesh.geometry.attributes.position.array;
        for (let i = 0; i < a.length; i += 3) { const z = m[2] * a[i] + m[6] * a[i + 1] + m[10] * a[i + 2] + m[14]; if (z < mz) mz = z; }
      }
      if (isFinite(mz)) m[14] -= mz;
      return M;
    },
    apply(fromFields) {
      if (fromFields) { pivot.position.copy(this.center); pivot.rotation.set(this.r[0] * D2R, this.r[1] * D2R, this.r[2] * D2R); }
      const M = this.matrix(), ids = new Set(this.ids());
      for (const [id, e] of meshes) {
        if (ids.has(id)) { e.mesh.matrixAutoUpdate = false; e.mesh.matrix.copy(M); e.mesh.matrixWorldNeedsUpdate = true; }
        else { e.mesh.matrixAutoUpdate = true; e.mesh.matrix.identity(); e.mesh.updateMatrix(); }
      }
      if (!this.dragging) this.syncGizmo();
      styleBodies();
    },
    onBody(id) { if (this.all) return; if (this.bodies.has(id)) this.bodies.delete(id); else this.bodies.add(id); this.recenter(); },
    onMove(ev) { dom.style.cursor = hitBodies(ev) ? 'pointer' : ''; },
    onClick(ev) {
      const h = hitBodies(ev); if (!h) return;
      if (this.faceMode) {
        const { poly } = polyOfHit(h);
        const n = v3(poly.n).applyQuaternion(this.quat()).normalize();
        this.setQuat(new THREE.Quaternion().setFromUnitVectors(n, new V3(0, 0, -1)).multiply(this.quat()));
        this.faceMode = false; this.ground = true; dlg.set('ground', true);
        this.recenter(); return;
      }
      this.onBody(h.object.userData.bodyId);
    },
    ok() {
      const ids = this.ids(); if (!ids.length) return null;
      return { id: f ? f.id : newId(), type: 'rotate', all: this.all, bodies: this.all ? [] : ids, r: this.r.map(v => Math.round(v * 100) / 100), pivot: this.pivotMode, ground: this.ground };
    },
    cleanup() {
      transform.removeEventListener('objectChange', this.onGizmo);
      transform.removeEventListener('dragging-changed', this.onDragChange);
      transform.detach(); scene.remove(pivot); transform.setMode('translate');
      for (const e of meshes.values()) { e.mesh.matrixAutoUpdate = true; e.mesh.matrix.identity(); e.mesh.position.set(0, 0, 0); e.mesh.rotation.set(0, 0, 0); e.mesh.updateMatrix(); }
      this.highlight = null;
    }
  };
  c.onGizmo = () => { c.r = [roundDeg(pivot.rotation.x), roundDeg(pivot.rotation.y), roundDeg(pivot.rotation.z)]; dlg.set('r', c.r); c.apply(false); };
  c.onDragChange = e => { controls.enabled = !e.value; };
  beginCmd(c); c.init();
}
function applySnapToGizmo() {
  transform.setTranslationSnap(settings.gridSnap ? settings.snap : null);
  transform.setRotationSnap(settings.gridSnap ? 15 * D2R : null);
}

/* ================= shared: body selection for mirror / pattern ================= */
const plural = (n, a, b, c) => `${n} ${n === 1 ? a : n >= 2 && n <= 4 ? b : c}`;
function bodySelText(set) { const n = set.size; return { text: n ? plural(n, 'těleso', 'tělesa', 'těles') : 'Vyberte tělesa', has: n > 0, active: true }; }

/* ================= revolve ================= */
function axisOptions(sid) {
  const s = cur.sketches.get(sid), opts = [['u', 'Osa X skici'], ['v', 'Osa Y skici']];
  if (s) (s.ents || []).forEach((e, i) => { if (e.t === 'poly' && !e.closed && e.pts.length >= 2) opts.push([String(i), 'Čára ' + (i + 1)]); });
  return opts;
}
function startRevolve(editIndex, f) {
  const c = {
    editIndex, sketch: f ? f.sketch : null, regions: new Set(f ? f.regions : []), axis: f ? f.axis : null, angle: f ? f.angle : 360,
    op: f ? f.op : 'new', autoOp: !f, regionMeshes: [], tool: null,
    init() {
      const sketches = Array.from(cur.sketches.values());
      if (!sketches.length) { endCmd(false); toast('Nejprve vytvořte skicu s profilem a osou rotace (S).'); return; }
      if (!this.sketch) {
        const last = sketches[sketches.length - 1], regs = Engine.regions(last);
        if (regs.length === 1) { this.sketch = last.id; this.regions = new Set([regs[0].ei]); }
      }
      for (const s of sketches) {
        if (!isVis(s.id) && s.id !== this.sketch && s !== sketches[sketches.length - 1]) continue;
        for (const r of Engine.regions(s)) { const m = regionMesh(s.plane, r, tok.orange, 0.22, 0.02); m.userData = { sid: s.id, ei: r.ei }; this.regionMeshes.push(m); G.overlay.add(m); }
        G.overlay.add(sketchLines(s.plane, s.ents, tok.sketch, 0.05));
      }
      openDialog({
        title: 'Rotace', icon: 'revolve',
        fields: [{ k: 'sel', id: 'prof', label: 'Profil' }, { k: 'opt', id: 'axis', label: 'Osa', options: [['u', 'Osa X skici']] },
          { k: 'num', id: 'angle', label: 'Úhel', unit: '°', value: this.angle }, { k: 'opt', id: 'op', label: 'Operace', options: OPS, value: this.op }, { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'angle') { const v = dlg.get('angle'); if (isFinite(v)) this.angle = v; }
          if (id === 'axis') { const v = dlg.get('axis'); this.axis = v === 'u' || v === 'v' ? v : parseInt(v, 10); }
          if (id === 'op') { this.op = dlg.get('op'); this.autoOp = false; }
          this.update();
        }
      });
      this.syncAxis();
      this.update();
    },
    syncAxis() {
      if (!this.sketch) return;
      const opts = axisOptions(this.sketch);
      const vals = opts.map(o => o[0]);
      if (this.axis === null || !vals.includes(String(this.axis))) this.axis = opts.length > 2 ? parseInt(opts[2][0], 10) : 'v';
      dlg.setOptions('axis', opts, String(this.axis));
    },
    feature() { return { id: f ? f.id : 'tmp', type: 'revolve', sketch: this.sketch, regions: Array.from(this.regions), axis: this.axis, angle: this.angle, op: this.op }; },
    update() {
      this.regionMeshes.forEach(m => { const on = m.userData.sid === this.sketch && this.regions.has(m.userData.ei); m.material.color.copy(on ? tok.accent : tok.orange); m.material.opacity = on ? 0.4 : 0.22; });
      clearGroup(G.preview); this.tool = null;
      const n = this.regions.size;
      dlg.set('prof', { text: n ? plural(n, 'profil', 'profily', 'profilů') : 'Vyberte profil', has: n > 0, active: true });
      setPrompt(n ? 'Zvolte osu a úhel rotace. Klepnutím na profil výběr změníte.' : 'Vyberte uzavřený profil skici');
      const s = cur.sketches.get(this.sketch);
      if (s) {
        try {
          const ax = Engine.revolveAxis({ axis: this.axis === null ? 'v' : this.axis }, s), P = s.plane, L = 400;
          const d = Math.hypot(ax.d[0], ax.d[1]), ux = ax.d[0] / d, uy = ax.d[1] / d;
          const a = P3(P, ax.p[0] - ux * L, ax.p[1] - uy * L, 0.1), b = P3(P, ax.p[0] + ux * L, ax.p[1] + uy * L, 0.1);
          const ln = noRay(new THREE.Line(lineGeo([a.x, a.y, a.z, b.x, b.y, b.z]), new THREE.LineBasicMaterial({ color: tok.accent, depthTest: false, transparent: true })));
          ln.renderOrder = 11; G.preview.add(ln);
        } catch (e) { /* axis drawn once valid */ }
      }
      if (!n) { dlg.set('n', ''); dlg.okEnabled(false); return requestRender(); }
      try {
        this.tool = Engine.toolForRevolve(this.feature(), cur.sketches);
        if (this.autoOp) { const o = anyOverlap(this.tool) ? 'join' : 'new'; if (o !== this.op) { this.op = o; dlg.set('op', o); } }
        G.preview.add(previewMesh(this.tool, this.op));
        dlg.set('n', ''); dlg.okEnabled(true);
      } catch (e) { dlg.set('n', '!' + e.message); dlg.okEnabled(false); }
      requestRender();
    },
    onMove(ev) { ray.setFromCamera(evNdc(ev), cam()); dom.style.cursor = ray.intersectObjects(this.regionMeshes, false)[0] ? 'pointer' : ''; },
    onClick(ev) {
      ray.setFromCamera(evNdc(ev), cam());
      this.regionMeshes.forEach(m => m.updateMatrixWorld(true));
      const h = ray.intersectObjects(this.regionMeshes, false)[0]; if (!h) return;
      const { sid, ei } = h.object.userData;
      if (sid !== this.sketch) { this.sketch = sid; this.regions = new Set([ei]); this.axis = null; this.syncAxis(); }
      else if (this.regions.has(ei)) this.regions.delete(ei); else this.regions.add(ei);
      this.update();
    },
    ok() { if (!this.tool) return null; const out = this.feature(); out.id = f ? f.id : newId(); return out; },
    after(out) { doc.vis[out.sketch] = false; }
  };
  beginCmd(c); c.init();
}

/* ================= mirror ================= */
function startMirror(editIndex, f) {
  const c = {
    editIndex, bodies: new Set(f ? f.bodies : [...sel]), plane: f ? f.plane : 'YZ', join: f ? !!f.join : false, highlight: null,
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      this.highlight = this.bodies;
      openDialog({
        title: 'Zrcadlit', icon: 'mirror',
        fields: [{ k: 'sel', id: 'bodies', label: 'Tělesa' }, { k: 'opt', id: 'plane', label: 'Rovina', options: [['YZ', 'Rovina YZ (osa X)'], ['XZ', 'Rovina XZ (osa Y)'], ['XY', 'Rovina XY (osa Z)']], value: this.plane },
          { k: 'chk', id: 'join', label: 'Spojit s originálem', value: this.join }],
        onChange: id => { if (id === 'plane') this.plane = dlg.get('plane'); if (id === 'join') this.join = dlg.get('join'); this.update(); }
      });
      this.update();
    },
    update() {
      clearGroup(G.preview);
      dlg.set('bodies', bodySelText(this.bodies));
      for (const id of this.bodies) { const b = bodyById(id); if (b) G.preview.add(previewMesh(K.mirror(b.polys, this.plane), 'new')); }
      setPrompt(this.bodies.size ? 'Klepnutím na těleso výběr změníte' : 'Vyberte tělesa, která chcete zrcadlit');
      dlg.okEnabled(this.bodies.size > 0); styleBodies();
    },
    onBody(id) { if (this.bodies.has(id)) this.bodies.delete(id); else this.bodies.add(id); this.update(); },
    onMove(ev) { const h = hitBodies(ev); dom.style.cursor = h ? 'pointer' : ''; },
    onClick(ev) { const h = hitBodies(ev); if (h) this.onBody(h.object.userData.bodyId); },
    ok() { if (!this.bodies.size) return null; return { id: f ? f.id : newId(), type: 'mirror', bodies: Array.from(this.bodies), plane: this.plane, join: this.join }; },
    cleanup() { this.highlight = null; }
  };
  beginCmd(c); c.init();
}

/* ================= pattern ================= */
function startPattern(editIndex, f) {
  const d = f || { kind: 'circ', axis: 'z', count: 6, angle: 360, nx: 3, dx: 20, ny: 1, dy: 20, join: false };
  const c = {
    editIndex, bodies: new Set(f ? f.bodies : [...sel]), p: { kind: d.kind, axis: d.axis || 'z', count: d.count || 6, angle: d.angle || 360, nx: d.nx || 3, dx: d.dx || 20, ny: d.ny || 1, dy: d.dy || 20, join: !!d.join }, highlight: null,
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      this.highlight = this.bodies;
      const p = this.p;
      openDialog({
        title: 'Pole', icon: 'pattern',
        fields: [{ k: 'sel', id: 'bodies', label: 'Tělesa' }, { k: 'seg', id: 'kind', label: 'Typ', options: [['circ', 'Kruhové'], ['rect', 'Obdélníkové']], value: p.kind },
          { k: 'opt', id: 'axis', label: 'Osa', options: [['z', 'Osa Z'], ['x', 'Osa X'], ['y', 'Osa Y']], value: p.axis },
          { k: 'num', id: 'count', label: 'Počet', unit: 'ks', value: p.count }, { k: 'num', id: 'angle', label: 'Celkový úhel', unit: '°', value: p.angle },
          { k: 'num', id: 'nx', label: 'Počet v X', unit: 'ks', value: p.nx }, { k: 'num', id: 'dx', label: 'Rozteč X', value: p.dx },
          { k: 'num', id: 'ny', label: 'Počet v Y', unit: 'ks', value: p.ny }, { k: 'num', id: 'dy', label: 'Rozteč Y', value: p.dy },
          { k: 'chk', id: 'join', label: 'Spojit s originálem', value: p.join }, { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'kind') p.kind = dlg.get('kind');
          else if (id === 'axis') p.axis = dlg.get('axis');
          else if (id === 'join') p.join = dlg.get('join');
          else { const v = dlg.get(id); if (isFinite(v)) p[id] = (id === 'count' || id === 'nx' || id === 'ny') ? Math.max(1, Math.min(100, Math.round(v))) : v; }
          this.update();
        }
      });
      this.update();
    },
    feature() { return { id: f ? f.id : 'tmp', type: 'pattern', bodies: Array.from(this.bodies), ...this.p }; },
    update() {
      const p = this.p, circ = p.kind === 'circ';
      ['axis', 'count', 'angle'].forEach(k => dlg.show(k, circ)); ['nx', 'dx', 'ny', 'dy'].forEach(k => dlg.show(k, !circ));
      dlg.set('bodies', bodySelText(this.bodies));
      clearGroup(G.preview);
      let ok = this.bodies.size > 0, msg = '';
      if (ok) {
        try {
          const st = Engine.step({ bodies: cur.bodies.filter(b => this.bodies.has(b.id)), sketches: new Map(), n: 0 }, { ...this.feature(), join: false });
          const total = st.bodies.length - this.bodies.size;
          if (total > 300) throw new Error('Příliš mnoho kopií (víc než 300).');
          for (const b of st.bodies) if (!this.bodies.has(b.id)) G.preview.add(previewMesh(b.polys, 'new'));
          msg = total === 1 ? 'Vznikne 1 kopie.' : total <= 4 ? `Vzniknou ${total} kopie.` : `Vznikne ${total} kopií.`;
        } catch (e) { ok = false; msg = '!' + e.message; }
      }
      dlg.set('n', msg);
      setPrompt(this.bodies.size ? (circ ? 'Kruhové pole kolem osy procházející počátkem' : 'Obdélníkové pole ve směrech X a Y') : 'Vyberte tělesa pro pole');
      dlg.okEnabled(ok); styleBodies(); requestRender();
    },
    onBody(id) { if (this.bodies.has(id)) this.bodies.delete(id); else this.bodies.add(id); this.update(); },
    onMove(ev) { const h = hitBodies(ev); dom.style.cursor = h ? 'pointer' : ''; },
    onClick(ev) { const h = hitBodies(ev); if (h) this.onBody(h.object.userData.bodyId); },
    ok() { if (!this.bodies.size) return null; const out = this.feature(); out.id = f ? f.id : newId(); return out; },
    cleanup() { this.highlight = null; }
  };
  beginCmd(c); c.init();
}

/* ================= measure ================= */
function startMeasure() {
  const c = {
    pts: [],
    init() {
      openDialog({ title: 'Měřit', icon: 'measure', fields: [{ k: 'sel', id: 'p1', label: 'Bod 1' }, { k: 'sel', id: 'p2', label: 'Bod 2' }, { k: 'note', id: 'n' }] });
      dlg.okLabel('Zavřít');
      this.update();
    },
    pick(ev) {
      const h = hitBodies(ev); if (!h) return null;
      const { poly } = polyOfHit(h), [mx, my] = evPx(ev);
      let best = h.point.clone(), bd = 12, snapped = false;
      for (const q of poly.v) { const s = toPx(v3(q)); const dd = Math.hypot(s[0] - mx, s[1] - my); if (dd < bd) { bd = dd; best = v3(q); snapped = true; } }
      return { p: best, snapped };
    },
    update() {
      const f3 = p => `${fmtc(p.x, 2)}; ${fmtc(p.y, 2)}; ${fmtc(p.z, 2)}`;
      dlg.set('p1', { text: this.pts[0] ? f3(this.pts[0].p) : 'Klepněte na model', has: !!this.pts[0], active: this.pts.length === 0 || this.pts.length === 2 });
      dlg.set('p2', { text: this.pts[1] ? f3(this.pts[1].p) : 'Klepněte na model', has: !!this.pts[1], active: this.pts.length === 1 });
      clearGroup(G.overlay);
      if (this.pts.length) {
        const arr = []; this.pts.forEach(q => arr.push(q.p.x, q.p.y, q.p.z));
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
        const pt = noRay(new THREE.Points(g, new THREE.PointsMaterial({ color: tok.orange, size: 9, sizeAttenuation: false, depthTest: false })));
        pt.renderOrder = 12; G.overlay.add(pt);
      }
      if (this.pts.length === 2) {
        const [a, b] = this.pts.map(q => q.p), ln = noRay(new THREE.Line(lineGeo([a.x, a.y, a.z, b.x, b.y, b.z]), new THREE.LineBasicMaterial({ color: tok.orange, depthTest: false, transparent: true })));
        ln.renderOrder = 12; G.overlay.add(ln);
        dlg.set('n', `Vzdálenost ${fmtc(a.distanceTo(b), 3)} mm · ΔX ${fmtc(b.x - a.x, 3)} · ΔY ${fmtc(b.y - a.y, 3)} · ΔZ ${fmtc(b.z - a.z, 3)} mm`);
      } else dlg.set('n', 'Klepnutím blízko vrcholu se bod přichytí k vrcholu.');
      setPrompt(this.pts.length === 1 ? 'Klepněte na druhý bod' : 'Klepněte na první bod');
      dlg.okEnabled(true); requestRender();
    },
    onMove(ev) { dom.style.cursor = hitBodies(ev) ? 'crosshair' : ''; },
    onClick(ev) { const q = this.pick(ev); if (!q) return; if (this.pts.length >= 2) this.pts = []; this.pts.push(q); this.update(); },
    ok() { endCmd(false); return null; }
  };
  beginCmd(c); c.init();
}

/* ================= import ================= */
/* imported meshes live outside the undo history; they are stored in IndexedDB (localStorage only as a fallback) */
let blobs = {};
try { blobs = JSON.parse(localStorage.getItem(BKEY)) || {}; } catch (e) { blobs = {}; }
Engine.setBlobResolver(id => blobs[id] || null);
const IDB = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    try { const r = indexedDB.open('skicacad', 1); r.onupgradeneeded = () => r.result.createObjectStore('blobs'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }
    catch (e) { rej(e); }
  }));
  const tx = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => { const t = db.transaction('blobs', mode), out = fn(t.objectStore('blobs')); t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });
  };
  return {
    put: (k, v) => tx('readwrite', st => { st.put(v, k); }),
    del: k => tx('readwrite', st => { st.delete(k); }),
    all: () => tx('readonly', st => { const o = {}; const req = st.openCursor(); req.onsuccess = () => { const c = req.result; if (c) { o[c.key] = c.value; c.continue(); } }; return o; })
  };
})();
let idbOk = true;
const persisted = new Set();
function usedBlobs() { const out = {}; for (const f of doc.features) if (f.type === 'import' && blobs[f.blob]) out[f.blob] = blobs[f.blob]; return out; }
function saveBlobsLocal() {
  try { localStorage.setItem(BKEY, JSON.stringify(blobs)); return true; }
  catch (e) { toast('Importovaný model je na úložiště prohlížeče příliš velký. Návrh si uložte do souboru (Soubor › Uložit návrh).'); return false; }
}
async function saveBlobs() {
  if (!idbOk) return saveBlobsLocal();
  try { for (const id of Object.keys(blobs)) if (!persisted.has(id)) { await IDB.put(id, blobs[id]); persisted.add(id); } }
  catch (e) { idbOk = false; saveBlobsLocal(); }
}
function pruneBlobs() {
  const keep = new Set(); for (const h of hist) { try { for (const f of JSON.parse(h).features) if (f.type === 'import') keep.add(f.blob); } catch (e) { /* ignore */ } }
  for (const x of libList()) { const d = libGet(x.uid); if (d) for (const f of d.features) if (f.type === 'import') keep.add(f.blob); }
  for (const id of Object.keys(blobs)) if (!keep.has(id)) { delete blobs[id]; persisted.delete(id); if (idbOk) IDB.del(id).catch(() => {}); }
  if (!idbOk) saveBlobsLocal();
}
async function loadStoredBlobs() {
  try {
    const all = await IDB.all();
    let added = false;
    for (const id of Object.keys(all)) { persisted.add(id); if (!blobs[id]) { blobs[id] = all[id]; added = true; } }
    const legacy = Object.keys(blobs).filter(id => !persisted.has(id));
    if (legacy.length) { await saveBlobs(); try { localStorage.removeItem(BKEY); } catch (e) { /* ignore */ } }
    if (added) { Engine.setBlobResolver(id => blobs[id] || null); if (doc.features.some(f => f.type === 'import')) refreshBusy(); }
  } catch (e) { idbOk = false; }
  pruneBlobs();
}
function pickImportFile(accept) {
  const inp = $('#importinput'); inp.accept = accept; inp.value = ''; inp.click();
}
$('#importinput').addEventListener('change', e => { const file = e.target.files && e.target.files[0]; if (file) importFile(file); e.target.value = ''; });
async function importFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase(), name = file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Import';
  if (!['stl', 'obj', 'dxf', 'svg', 'zip'].includes(ext)) { toast('Podporované formáty importu: STL, OBJ (tělesa), DXF a SVG (skica) a archiv ZIP ze SkicaCAD.'); return; }
  if (file.size > 400e6) { toast('Soubor je příliš velký (víc než 400 MB).'); return; }
  if (sk && (ext === 'stl' || ext === 'obj')) { toast('Do skici lze vložit jen DXF nebo SVG. Model STL nebo OBJ importujte mimo skicu.'); return; }
  if (cmd) endCmd(false);
  const busy = $('#busy'); busy.textContent = 'Načítám soubor…'; busy.hidden = false;
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
  try {
    if (ext === 'zip') { await handleZip(await file.arrayBuffer(), name); return; }
    if (ext === 'stl' || ext === 'obj') {
      const tris = ext === 'stl' ? Importers.parseSTL(await file.arrayBuffer()) : Importers.parseOBJ(await file.text());
      prepareMesh(name, tris);
    } else {
      const r = ext === 'dxf' ? Importers.parseDXF(await file.text()) : Importers.parseSVG(await file.text());
      if (!r.ents.length) throw new Error('V souboru nebyla nalezena žádná podporovaná geometrie.');
      if (sk) importIntoSketch(r, ext, name); else startImport2D({ name, ext, ...r });
    }
  } catch (e) { toast(e && e.message ? e.message : 'Soubor se nepodařilo načíst.'); }
  finally { busy.hidden = true; busy.textContent = 'Přepočítávám model…'; }
}
/* a ZIP exported by SkicaCAD holds the STL, the OBJ and the editable design */
async function handleZip(buf, name) {
  const entries = await Importers.readZip(buf);
  const pick = re => entries.find(e => re.test(e.name));
  const proj = pick(/\.skicacad\.json$/i) || pick(/\.json$/i), stl = pick(/\.stl$/i), obj = pick(/\.obj$/i), flat = pick(/\.(dxf|svg)$/i);
  let project = null;
  if (proj) { try { const j = JSON.parse(new TextDecoder().decode(proj.data)); if (validDoc(j.doc || j)) project = j; } catch (e) { project = null; } }
  const meshImport = () => {
    const tris = stl ? Importers.parseSTL(stl.data.buffer.slice(stl.data.byteOffset, stl.data.byteOffset + stl.data.byteLength)) : Importers.parseOBJ(new TextDecoder().decode(obj.data));
    prepareMesh((stl || obj).name.replace(/^.*\//, '').replace(/\.[^.]+$/, '').slice(0, 40), tris);
  };
  if (sk) {
    if (!flat) throw new Error('Archiv neobsahuje DXF ani SVG, které by šlo vložit do skici.');
    const ext = flat.name.split('.').pop().toLowerCase(), text = new TextDecoder().decode(flat.data);
    importIntoSketch(ext === 'dxf' ? Importers.parseDXF(text) : Importers.parseSVG(text), ext, name); return;
  }
  if (project && (stl || obj)) {
    const c = {
      init() {
        openDialog({ title: 'Otevřít archiv ZIP', icon: 'import', fields: [{ k: 'note', id: 'info' }, { k: 'btns', id: 'how', label: 'Akce', options: [['doc', 'Otevřít návrh'], ['mesh', 'Vložit jako těleso']] }, { k: 'note', id: 'n' }],
          onBtn: (id, v) => { endCmd(false); try { if (v === 'doc') openProject(project); else meshImport(); } catch (e) { toast(e.message || 'Soubor se nepodařilo načíst.'); } } });
        $('#dialog .btnrow').classList.add('one');
        dlg.set('info', `${name}.zip obsahuje upravitelný návrh „${(project.doc || project).name || 'Bez názvu'}“${project.generator ? ' (' + project.generator + ')' : ''} i síť ${stl ? 'STL' : 'OBJ'}.`);
        dlg.set('n', 'Otevřít návrh obnoví celou časovou osu a nahradí aktuální návrh (vrátíte ho Ctrl+Z). Vložit jako těleso přidá síť do aktuálního návrhu.');
        dlg.okEnabled(false); setPrompt('Vyberte, jak archiv otevřít');
      }
    };
    beginCmd(c); c.init(); return;
  }
  if (project) { openProject(project); return; }
  if (stl || obj) { meshImport(); return; }
  if (flat) { const ext = flat.name.split('.').pop().toLowerCase(), text = new TextDecoder().decode(flat.data), r = ext === 'dxf' ? Importers.parseDXF(text) : Importers.parseSVG(text); startImport2D({ name, ext, ...r }); return; }
  throw new Error('Archiv ZIP neobsahuje návrh SkicaCAD ani soubor STL, OBJ, DXF nebo SVG.');
}
function openProject(j) {
  const d = validDoc(j.doc || j);
  if (!d) throw new Error('Soubor neobsahuje platný návrh SkicaCAD.');
  if (j.blobs && typeof j.blobs === 'object') { Object.assign(blobs, j.blobs); saveBlobs(); }
  loadDoc(d, 'Návrh otevřen' + (j.generator ? ' (vytvořen v ' + j.generator + ')' : ''));
}
const projectJSON = () => JSON.stringify({ app: 'skicacad', generator: SKICA.full, appVersion: SKICA.version, version: 3, units: 'mm', doc, blobs: usedBlobs() });
/* large meshes: offer a simplification before the mesh is built */
const MESH_COMFORT = 150000, MESH_MAX = 6000000;
function prepareMesh(name, tris) {
  const nt = tris.length / 9;
  if (nt > MESH_MAX) throw new Error(`Model má ${nt.toLocaleString('cs-CZ')} trojúhelníků, víc než zvládne prohlížeč (6 milionů). Zjednodušte ho prosím v jiném programu.`);
  if (nt <= MESH_COMFORT) { finishMesh(name, tris, nt); return; }
  const c = {
    target: '150000',
    init() {
      const opts = [['150000', 'Zjednodušit na 150 000 (doporučeno)'], ['300000', 'Zjednodušit na 300 000 (víc detailů)'], ['75000', 'Zjednodušit na 75 000 (nejrychlejší)'], ['0', 'Ponechat plné rozlišení']].filter(o => o[0] === '0' || +o[0] < nt);
      openDialog({ title: 'Velký model', icon: 'import', fields: [{ k: 'note', id: 'info' }, { k: 'opt', id: 'target', label: 'Síť', options: opts, value: '150000' }, { k: 'note', id: 'n' }],
        onChange: id => { if (id === 'target') { this.target = dlg.get('target'); this.update(); } } });
      dlg.set('info', `${name} má ${nt.toLocaleString('cs-CZ')} trojúhelníků. Pro plynulou práci doporučuji síť zjednodušit, jemné detaily se tím mírně vyhladí.`);
      this.update(); setPrompt('Zvolte, jak podrobně model načíst');
    },
    update() { dlg.set('n', this.target === '0' ? (nt > 1500000 ? '!Načtení a práce s plným rozlišením bude pomalá a může zaplnit paměť prohlížeče.' : 'Načtení plného rozlišení chvíli potrvá.') : 'Tvar a rozměry modelu zůstanou zachované.'); },
    ok() {
      const tgt = +this.target; endCmd(false);
      const busy = $('#busy'); busy.textContent = tgt ? 'Zjednodušuji síť…' : 'Načítám síť…'; busy.hidden = false;
      setTimeout(() => {
        try { const t2 = tgt ? K.decimateTris(tris, tgt) : tris; finishMesh(name, t2, nt); }
        catch (e) { toast(e && e.message ? e.message : 'Síť se nepodařilo zpracovat.'); }
        finally { busy.hidden = true; busy.textContent = 'Přepočítávám model…'; }
      }, 30);
      return null;
    }
  };
  beginCmd(c); c.init();
}
function finishMesh(name, tris, ntOrig) {
  const r = K.fromTrianglesFast(tris);
  if (!r.polys.length) throw new Error('Soubor neobsahuje použitelnou síť.');
  startImportMesh({ name, polys: r.polys, open: r.open, tris: tris.length / 9, from: ntOrig });
}
function transformEnts(ents, s, cx, cy) {
  const T = (x, y) => [Math.round((x - cx) * s * 1e4) / 1e4, Math.round((y - cy) * s * 1e4) / 1e4];
  return ents.map(e => {
    if (e.t === 'circle') { const [x, y] = T(e.x, e.y); return { t: 'circle', x, y, r: Math.round(e.r * s * 1e4) / 1e4 }; }
    return { t: 'poly', pts: e.pts.map(p => T(p[0], p[1])), closed: e.closed };
  });
}
function importIntoSketch(r, ext, name) {
  const center = ext === 'svg';
  const cx = center ? (r.bbox[0] + r.bbox[2]) / 2 : 0, cy = center ? (r.bbox[1] + r.bbox[3]) / 2 : 0;
  const ents = transformEnts(r.ents, r.scale, cx, cy);
  sk.f.ents.push(...ents); sk.selEnt = -1; renderPalette(); redrawSketch();
  toast(`Vloženo ${plural(ents.length, 'prvek', 'prvky', 'prvků')} ze souboru ${name}. Měřítko ${fmtc(r.scale, 4)} mm na jednotku${r.unitsKnown ? '' : ', jednotky nebyly v souboru uvedené'}.`);
}
function startImport2D(info) {
  const c = {
    plane: 'XY', scale: info.scale, center: info.ext === 'svg',
    init() {
      const w = info.bbox[2] - info.bbox[0], h = info.bbox[3] - info.bbox[1];
      const skipped = Object.entries(info.skipped || {}).map(([k, v]) => `${k} (${v})`).join(', ');
      openDialog({
        title: 'Import ' + info.ext.toUpperCase(), icon: 'import',
        fields: [{ k: 'note', id: 'info' }, { k: 'opt', id: 'plane', label: 'Rovina skici', options: [['XY', 'XY (půdorys)'], ['XZ', 'XZ (nárys)'], ['YZ', 'YZ (bokorys)']], value: 'XY' },
          { k: 'num', id: 'scale', label: 'Měřítko', unit: 'mm/j.', value: this.scale }, { k: 'chk', id: 'center', label: 'Vycentrovat na počátek', value: this.center }, { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'plane') this.plane = dlg.get('plane');
          if (id === 'scale') { const v = dlg.get('scale'); if (v > 0) this.scale = v; }
          if (id === 'center') this.center = dlg.get('center');
          this.update();
        }
      });
      this.base = `${info.name}.${info.ext} · ${plural(info.ents.length, 'prvek', 'prvky', 'prvků')} · ${fmtc(w, 2)} × ${fmtc(h, 2)} jednotek`;
      this.warn = (info.unitsKnown ? '' : 'Jednotky v souboru nejsou uvedené, zkontrolujte měřítko. ') + (skipped ? 'Přeskočeno: ' + skipped + '.' : '');
      dlg.set('n', this.warn);
      this.update();
    },
    ents() { const r = info, cx = this.center ? (r.bbox[0] + r.bbox[2]) / 2 : 0, cy = this.center ? (r.bbox[1] + r.bbox[3]) / 2 : 0; return transformEnts(r.ents, this.scale, cx, cy); },
    update() {
      const w = (info.bbox[2] - info.bbox[0]) * this.scale, h = (info.bbox[3] - info.bbox[1]) * this.scale;
      dlg.set('info', `${this.base} → ${fmtc(w, 2)} × ${fmtc(h, 2)} mm`);
      clearGroup(G.preview);
      G.preview.add(sketchLines(Engine.PLANES[this.plane], this.ents(), tok.sketch, 0.05));
      setPrompt('Zkontrolujte velikost a umístění, pak potvrďte. Vznikne nová skica.');
      requestRender();
    },
    ok() {
      const n = doc.features.filter(x => x.type === 'sketch').length + 1;
      return { id: newId(), type: 'sketch', name: `Skica ${n} (${info.name})`, plane: Engine.PLANES[this.plane], ents: this.ents() };
    },
    after() { setTimeout(() => toast('Skica z importu je hotová. Profily vysunete příkazem Vysunutí (E).'), 400); }
  };
  beginCmd(c); c.init();
  const P = Engine.PLANES[c.plane], ents = c.ents(), bb = new THREE.Box3();
  for (const p of keyPoints(ents).slice(1)) bb.expandByPoint(P3(P, p[0], p[1]));
  if (!bb.isEmpty()) viewTo(v3(P.n), bb.getCenter(new V3()), Math.max(bb.getSize(new V3()).length() / 2, 10));
}
const UNIT_OPTS = [['1', 'milimetry'], ['10', 'centimetry'], ['1000', 'metry'], ['25.4', 'palce']];
function startImportMesh(info, editIndex, f) {
  const fresh = !f;
  const blobId = f ? f.blob : 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  if (fresh) blobs[blobId] = K.pack(info.polys);
  const c = {
    editIndex, units: 1, scale: f ? f.scale : 1, center: f ? !!f.center : true, ground: f ? !!f.ground : true, op: f ? f.op || 'new' : 'new', tool: null, done: false,
    init() {
      if (!blobs[blobId]) { endCmd(false); toast('Data tohoto importu už nejsou k dispozici. Importujte soubor znovu.'); return; }
      openDialog({
        title: 'Import sítě', icon: 'import',
        fields: [{ k: 'note', id: 'info' }, { k: 'opt', id: 'units', label: 'Jednotky souboru', options: UNIT_OPTS, value: '1' },
          { k: 'num', id: 'scale', label: 'Měřítko', unit: '×', value: this.scale }, { k: 'chk', id: 'center', label: 'Vycentrovat na počátek (X, Y)', value: this.center },
          { k: 'chk', id: 'ground', label: 'Položit na rovinu XY', value: this.ground }, { k: 'opt', id: 'op', label: 'Operace', options: OPS, value: this.op }, { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'units') this.units = parseFloat(dlg.get('units')) || 1;
          if (id === 'scale') { const v = dlg.get('scale'); if (v > 0) this.scale = v; }
          if (id === 'center') this.center = dlg.get('center');
          if (id === 'ground') this.ground = dlg.get('ground');
          if (id === 'op') this.op = dlg.get('op');
          this.update();
        }
      });
      const polys = Engine.importPolys({ blob: blobId, scale: 1 });
      this.open = info ? info.open : 0;
      this.label = info ? `${info.name} · ${info.tris.toLocaleString('cs-CZ')} trojúhelníků${info.from && info.from !== info.tris ? ' (zjednodušeno z ' + info.from.toLocaleString('cs-CZ') + ')' : ''}` : (f.name || 'Import');
      this.polysCount = polys.length;
      this.update();
      if (fresh) { const bb = K.bbox(Engine.importPolys(this.feature())); const sp = new THREE.Box3(v3(bb.min), v3(bb.max)).getBoundingSphere(new THREE.Sphere()); viewTo(VIEW_ISO, sp.center, Math.max(sp.radius, 10)); }
    },
    feature() { return { id: f ? f.id : 'tmp', type: 'import', blob: blobId, name: f ? f.name : info.name, scale: Math.round(this.units * this.scale * 1e6) / 1e6, center: this.center, ground: this.ground, op: this.op }; },
    update() {
      clearGroup(G.preview); this.tool = null;
      try {
        this.tool = Engine.importPolys(this.feature());
        const bb = K.bbox(this.tool);
        dlg.set('info', `${this.label} → ${fmtc(bb.max[0] - bb.min[0], 2)} × ${fmtc(bb.max[1] - bb.min[1], 2)} × ${fmtc(bb.max[2] - bb.min[2], 2)} mm`);
        G.preview.add(previewMesh(this.tool, this.op === 'new' ? 'new' : this.op));
        dlg.set('n', this.open ? '!Síť není uzavřená (' + this.open + ' otevřených hran). Booleovské operace s ní nemusí fungovat.' : '');
        dlg.okEnabled(true);
      } catch (e) { dlg.set('n', '!' + e.message); dlg.okEnabled(false); }
      setPrompt('Nastavte jednotky a umístění importovaného modelu');
      requestRender();
    },
    ok() { if (!this.tool) return null; const out = this.feature(); out.id = f ? f.id : newId(); return out; },
    after() { this.done = true; saveBlobs(); },
    cleanup() { if (fresh && !this.done) delete blobs[blobId]; }
  };
  beginCmd(c); c.init();
}
/* drag and drop onto the viewport */
vp.addEventListener('dragover', e => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
vp.addEventListener('drop', e => { e.preventDefault(); const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (file) importFile(file); });

/* ================= delete ================= */
function deleteSelected() {
  if (!sel.size) { toast('Vyberte těleso, které chcete odstranit.'); return; }
  const f = { id: newId(), type: 'del', bodies: Array.from(sel) };
  doc.features.splice(doc.marker, 0, f); doc.marker++;
  sel = new Set(); commit();
}

/* ================= pointer routing ================= */
let down = null, hoverQueued = false, lastMoveEv = null, longPressT = null;
dom.addEventListener('pointerdown', e => {
  try { dom.focus({ preventScroll: true }); } catch (er) {}
  down = { x: e.clientX, y: e.clientY, btn: e.button, gizmo: !!(transform.object && transform.axis), special: false };
  /* touch: holding a finger still for a moment opens the same menu as a right click */
  clearTimeout(longPressT);
  if (e.pointerType === 'touch' && e.button === 0 && !sk && !cmd) {
    const d0 = down, ev0 = { clientX: e.clientX, clientY: e.clientY, button: 2 };
    longPressT = setTimeout(() => {
      if (down !== d0 || d0.moved) return;
      d0.longpress = true;
      if (faceMode) faceContext(ev0); else { const h = hitBodies(ev0); if (h) bodyContext(ev0, h.object.userData.bodyId); }
    }, 550);
  }
  if (e.button === 0 && cmd && cmd.onDown && cmd.onDown(e)) { down.special = true; try { dom.setPointerCapture(e.pointerId); } catch (er) {} }
  else if (e.button === 0 && sk && !sk.tool) { const h = sketchHandleAt(e); if (h) { sk.drag = h; sk.selEnt = h.ei; down.special = true; controls.enabled = false; try { dom.setPointerCapture(e.pointerId); } catch (er) {} } }
}, true);
dom.addEventListener('pointermove', e => {
  if (down && !down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { down.moved = true; clearTimeout(longPressT); }
  if (down && down.special && sk && sk.drag) { sketchDrag(e); return; }
  if (down && down.special && cmd && cmd.onDrag) { cmd.onDrag(e); return; }
  if (e.buttons) return;
  lastMoveEv = e;
  if (!hoverQueued) { hoverQueued = true; requestAnimationFrame(() => { hoverQueued = false; handleHover(lastMoveEv); }); }
});
dom.addEventListener('pointerleave', () => { if (cmd && cmd.onLeave) cmd.onLeave(); if (hoverBody) { hoverBody = null; styleBodies(); } $('#dim').hidden = true; });
dom.addEventListener('pointerup', e => {
  if (!down) return;
  const d = down; down = null; clearTimeout(longPressT);
  if (d.longpress) return;
  if (d.special) { if (sk && sk.drag) { sk.drag = null; controls.enabled = true; $('#dim').hidden = true; renderPalette(); redrawSketch(); return; } if (cmd && cmd.onUp) cmd.onUp(e); return; }
  const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5;
  if (d.gizmo || moved) { if (cmd && cmd.onLeave && moved) cmd.onLeave(); return; }
  if (d.btn === 2 && sk && isPolyTool(sk.tool) && sk.draft) { finishPolyline(false); return; }
  if (d.btn === 2 && !sk && !cmd && faceMode) { faceContext(e); return; }
  if (d.btn === 2 && !sk && !cmd) { const h = hitBodies(e); if (h) bodyContext(e, h.object.userData.bodyId); return; }
  if (d.btn !== 0) return;
  handleClick(e);
});
dom.addEventListener('dblclick', e => { if (sk && isPolyTool(sk.tool) && sk.draft) finishPolyline(false); });
function handleHover(e) {
  if (!e) return;
  if (sk) { sketchMove(e); return; }
  if (cmd) { if (cmd.onMove) cmd.onMove(e); return; }
  if (faceMode) { faceHover(e); return; }
  const h = hitBodies(e), id = h ? h.object.userData.bodyId : null;
  if (id !== hoverBody) { hoverBody = id; styleBodies(); }
  dom.style.cursor = id ? 'pointer' : '';
}
function handleClick(e) {
  if (sk) { sketchClick(e); return; }
  if (cmd) { if (cmd.onClick) cmd.onClick(e); return; }
  if (faceMode) { faceClick(e); return; }
  const h = hitBodies(e);
  if (h) bodyClick(h.object.userData.bodyId, e.ctrlKey || e.metaKey || e.shiftKey);
  else if (sel.size || tlSel !== null) { sel = new Set(); tlSel = null; styleBodies(); renderBrowser(); renderTimeline(); updateInfo(); }
}
function bodyContext(e, id) {
  if (!sel.has(id)) { sel = new Set([id]); styleBodies(); renderBrowser(); updateInfo(); }
  const idx = doc.features.findIndex(f => f.id === id);
  showCtx(e.clientX, e.clientY + 4, [
    ['Vybrat vše (Ctrl+A)', () => selectAll()],
    ['Přesunout…', () => startMove()],
    ['Kopírovat (Ctrl+C)', () => copySel()],
    ['Duplikovat (Ctrl+D)', () => duplicateSel()],
    ['Vložit kopii (Ctrl+V)', () => pasteClip(), !clip || clip.kind !== 'bodies'],
    ['Zaoblit hrany…', () => startEdgeMod('fillet')],
    ['Přejmenovat', () => { renaming = id; open.bodies = true; renderBrowser(); }],
    [isVis(id) ? 'Skrýt' : 'Zobrazit', () => { doc.vis[id] = !isVis(id); if (doc.vis[id]) delete doc.vis[id]; saveDoc(); styleBodies(); renderBrowser(); }],
    ['Upravit prvek, který těleso vytvořil', () => editFeature(idx), idx < 0],
    null,
    ['Odstranit těleso', () => deleteSelected()]
  ]);
}

/* ================= keyboard ================= */
document.addEventListener('keydown', e => {
  const inField = e.target.closest && e.target.closest('input, select, textarea');
  const k = e.key, mod = e.ctrlKey || e.metaKey;
  if (inField) return;
  if (mod && k.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
  if (mod && k.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (mod && k.toLowerCase() === 'a') { e.preventDefault(); selectAll(); return; }
  if (mod && k.toLowerCase() === 'c') { e.preventDefault(); copySel(); return; }
  if (mod && k.toLowerCase() === 'v') { e.preventDefault(); pasteClip(); return; }
  if (mod && k.toLowerCase() === 'd') { e.preventDefault(); if (faceMode && selFace && !sk && !cmd) faceToSketch(); else duplicateSel(); return; }
  if (mod) return;
  if (k === 'Escape') {
    $('#ctxmenu').hidden = true;
    if (sk) { if (sk.cut && (sk.cut.parts || sk.cut.target !== undefined)) { sk.cut = null; setSketchTool('sktrim'); return; } if (sk.draft) { sk.draft = null; redrawSketch(); $('#dim').hidden = true; } else if (sk.tool) setSketchTool(null); return; }
    if (cmd) { endCmd(false); return; }
    if (faceMode && selFace) { selFace = null; drawFaces(); updateInfo(); return; }
    if (faceMode) { setFaceMode(false); return; }
    if (sel.size || tlSel !== null) { sel = new Set(); tlSel = null; styleBodies(); renderBrowser(); renderTimeline(); updateInfo(); }
    return;
  }
  if (k === 'Enter') {
    if (sk) { if (isPolyTool(sk.tool) && sk.draft) finishPolyline(false); else finishSketch(true); return; }
    if (cmd) { okCmd(); return; }
    return;
  }
  if (k === 'Delete' || k === 'Backspace') {
    e.preventDefault();
    if (sk) { deleteSketchEntity(); return; }
    if (cmd) return;
    if (sel.size) deleteSelected();
    else if (tlSel !== null) deleteFeature(tlSel);
    return;
  }
  const map = sk ? { l: 'line', k: 'spline', r: 'rect', c: 'circle', e: 'ellipse', p: 'ngon', d: 'slot', x: 'sktrim' } : cmd ? {} : { s: 'sketch', e: 'extrude', f: 'fillet', m: 'move', r: 'rotate', t: 'thread', i: 'measure', g: 'facemode' };
  const id = map[k.toLowerCase()];
  if (id) { e.preventDefault(); runCommand(id); return; }
  if (k === 'F6') { e.preventDefault(); fitView(); }
});

/* ================= navigation bar ================= */
const STYLES = ['se', 's', 'w'], STYLE_LABEL = { se: 'Stínování s hranami', s: 'Stínování', w: 'Drátový model' };
function applyNav() {
  G.grid.visible = settings.grid && !sk;
  $('#nav-grid').setAttribute('aria-pressed', String(settings.grid));
  $('#nav-snap').setAttribute('aria-pressed', String(settings.gridSnap));
  $('#nav-step').value = String(settings.snap);
  $('#nav-style').title = 'Styl zobrazení: ' + STYLE_LABEL[settings.style];
  applySnapToGizmo(); styleBodies();
}
$('#nav-fit').addEventListener('click', () => fitView());
$('#nav-proj').addEventListener('click', () => setProjection(!isOrtho));
$('#nav-style').addEventListener('click', () => { settings.style = STYLES[(STYLES.indexOf(settings.style) + 1) % 3]; saveSettings(); applyNav(); toast(STYLE_LABEL[settings.style]); });
$('#nav-grid').addEventListener('click', () => { settings.grid = !settings.grid; saveSettings(); applyNav(); });
$('#nav-snap').addEventListener('click', () => { settings.gridSnap = !settings.gridSnap; saveSettings(); applyNav(); });
$('#nav-step').addEventListener('change', e => { settings.snap = parseFloat(e.target.value) || 1; saveSettings(); applyNav(); });

/* ================= file menu, export ================= */
/* samostatná verze (PWA): soubory se stahují přes odkaz s atributem download */
/* samostatná verze (PWA): soubory se stahují přes odkaz s atributem download */
const dl = { async save({ filename, data }) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: typeof data === 'string' ? 'application/json' : 'application/octet-stream' });
  const url = URL.createObjectURL(blob), el = document.createElement('a');
  el.href = url; el.download = filename; document.body.append(el); el.click();
  setTimeout(() => { URL.revokeObjectURL(url); el.remove(); }, 4000);
} };
function updateMenu() { ['#m-save', '#m-export'].forEach(s => { $(s).disabled = !dl; $(s).title = dl ? '' : 'Ukládání souborů není v tomto zobrazení dostupné'; }); }
async function saveFile(filename, data, okMsg) {
  if (!dl) { toast('Ukládání souborů není v tomto zobrazení dostupné.'); return; }
  try { await dl.save({ filename, data }); toast(okMsg || 'Soubor uložen'); } catch (e) { if (!e || e.code !== 'declined') toast('Soubor se nepodařilo uložit.'); }
}
const slug = () => (doc.name || 'model').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'model';
/* file names carry the app name and version, e.g. drzak-s-nabojem_SkicaCAD-Beta-0.9 */
const fileBase = () => slug() + '_' + SKICA.fileTag;
function exportTris() {
  const out = [];
  for (const b of cur.bodies) { if (!bodiesVisible() || !isVis(b.id)) continue; for (const p of b.polys) for (let i = 1; i < p.v.length - 1; i++) out.push({ n: p.n, t: [p.v[0], p.v[i], p.v[i + 1]] }); }
  return out;
}
function stlBytes(tris) {
  const buf = new ArrayBuffer(84 + 50 * tris.length), dv = new DataView(buf), head = SKICA.full + ' binary STL, units mm';
  for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i));
  dv.setUint32(80, tris.length, true);
  let o = 84;
  for (const tr of tris) { for (const v of [tr.n, ...tr.t]) { dv.setFloat32(o, v[0], true); dv.setFloat32(o + 4, v[1], true); dv.setFloat32(o + 8, v[2], true); o += 12; } dv.setUint16(o, 0, true); o += 2; }
  return new Uint8Array(buf);
}
function objText() {
  let s = '# ' + SKICA.full + ' export, units: mm, Z up\n', base = 0;
  for (const b of cur.bodies) {
    if (!bodiesVisible() || !isVis(b.id)) continue;
    const pk = K.pack(b.polys);
    s += `o ${bodyName(b).replace(/\s+/g, '_')}\n`;
    for (let i = 0; i < pk.v.length; i += 3) s += `v ${pk.v[i]} ${pk.v[i + 1]} ${pk.v[i + 2]}\n`;
    for (const f of pk.p) s += 'f ' + f.map(i => i + 1 + base).join(' ') + '\n';
    base += pk.v.length / 3;
  }
  return s;
}
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files) {
  const enc = new TextEncoder(), parts = [], central = [], d = new Date();
  const dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  let off = 0;
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(10, tm, true); lh.setUint16(12, dt, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, size, true); lh.setUint32(22, size, true); lh.setUint16(26, name.length, true);
    parts.push(new Uint8Array(lh.buffer), name, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(12, tm, true); ch.setUint16(14, dt, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, size, true); ch.setUint32(24, size, true); ch.setUint16(28, name.length, true); ch.setUint32(42, off, true);
    central.push(new Uint8Array(ch.buffer), name);
    off += 30 + name.length + size;
  }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, central.reduce((s, p) => s + p.length, 0), true); end.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}
function exportMesh() {
  const tris = exportTris();
  if (!tris.length) { toast('Není co exportovat, model neobsahuje viditelná tělesa.'); return; }
  const n = fileBase();
  saveFile(n + '.zip', exportZip(tris, n), 'Uloženo. Archiv otevřete znovu ve SkicaCAD přetažením do okna nebo přes Soubor › Otevřít návrh.');
}
function exportZip(tris, n) {
  return makeZip([{ name: n + '.stl', data: stlBytes(tris) }, { name: n + '.obj', data: new TextEncoder().encode(objText()) }, { name: n + '.skicacad.json', data: new TextEncoder().encode(projectJSON()) }]);
}
function loadDoc(d, msg) {
  if (sk) finishSketch(false);
  if (cmd) endCmd(false);
  doc = d; if (!doc.uid) doc.uid = newUid(); viewMarker = null; sel = new Set(); tlSel = null;
  $('#docname').value = doc.name;
  hist = []; hi = -1; pushHist(); saveDoc();
  refreshBusy(() => { fitView(VIEW_ISO); if (msg) toast(msg); });
}
const menu = $('#filemenu'), fbtn = $('#filebtn');
const closeMenu = () => { menu.hidden = true; fbtn.setAttribute('aria-expanded', 'false'); };
fbtn.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; fbtn.setAttribute('aria-expanded', String(!menu.hidden)); });
document.addEventListener('click', e => { if (!menu.contains(e.target) && e.target !== fbtn) closeMenu(); });
$('#m-new').addEventListener('click', () => { closeMenu(); loadDoc(emptyDoc(), 'Nový návrh'); });
$('#m-library').addEventListener('click', () => { closeMenu(); showStart(false); });

/* ================= design thumbnails for the library ================= */
/* rendered from a fixed isometric view into a small JPEG, independent of the user's current view */
let thumbTimer = null;
function scheduleThumb(delay = 1500) {
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(() => {
    if (cmd || sk || !$('#busy').hidden || viewMarker !== null) { scheduleThumb(1500); return; }
    const uid = doc.uid; if (!uid || !doc.features.length) return;
    const url = makeThumb();
    if (url) { try { localStorage.setItem(TKEY(uid), url); } catch (e) { /* storage full: keep going without a picture */ } }
  }, delay);
}
function makeThumb() {
  const box = new THREE.Box3();
  for (const e of meshes.values()) { if (!e.mesh.visible) continue; e.mesh.geometry.computeBoundingBox(); box.union(e.mesh.geometry.boundingBox); }
  if (box.isEmpty()) return null;
  const W = 240, H = 160, sp = box.getBoundingSphere(new THREE.Sphere());
  const tc = new THREE.PerspectiveCamera(30, W / H, 0.5, 20000); tc.up.set(0, 0, 1);
  const dist = Math.max(sp.radius, 1) / Math.sin(15 * D2R) * 1.08;
  tc.position.copy(sp.center).add(VIEW_ISO.clone().normalize().multiplyScalar(dist)); tc.lookAt(sp.center); tc.updateProjectionMatrix();
  const hide = [G.grid, G.origin, G.overlay, G.preview, G.sketches, G.planes, G.skwork, transform], was = hide.map(o => o.visible);
  const pr = renderer.getPixelRatio(), vw = vp.clientWidth, vh = vp.clientHeight;
  let url = null;
  try {
    hide.forEach(o => { o.visible = false; });
    sun.position.copy(tc.position).add(new V3(0.3, 0.2, 0.5).multiplyScalar(dist)); sun.target.position.copy(sp.center);
    renderer.setPixelRatio(1); renderer.setSize(W * 2, H * 2, false);
    renderer.render(scene, tc);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    g.fillStyle = css(tok.panel); g.fillRect(0, 0, W, H);
    g.drawImage(dom, 0, 0, W * 2, H * 2, 0, 0, W, H);
    url = cv.toDataURL('image/jpeg', 0.78);
    if (!url.startsWith('data:image/jpeg')) url = null;
  } catch (e) { url = null; }
  finally {
    hide.forEach((o, i) => { o.visible = was[i]; });
    renderer.setPixelRatio(pr); if (vw && vh) renderer.setSize(vw, vh);
    render();
  }
  return url;
}

/* ================= start screen and library of designs ================= */
const fmtDate = t => { const d = new Date(t), p = n => String(n).padStart(2, '0'); return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} ${d.getHours()}:${p(d.getMinutes())}`; };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const krok = n => (n === 1 ? '1 krok' : n >= 2 && n <= 4 ? `${n} kroky` : `${n} kroků`);
function showStart(first) {
  const ov = $('#startdlg'), list = libList(), last = list[0];
  const rows = list.map(x => `<li data-uid="${x.uid}"${doc.uid === x.uid && doc.features.length ? ' class="cur"' : ''}><button class="sd-open" data-open="${x.uid}">${(t => (t ? `<img class="sd-thumb" src="${t}" alt="" loading="lazy">` : `<span class="sd-thumb sd-nothumb">${svg('box', 22)}</span>`))(libThumb(x.uid))}<span class="sd-txt"><span class="sd-name">${esc(x.name)}</span><span class="sd-meta">${fmtDate(x.t)} · ${krok(x.n)}${doc.uid === x.uid && doc.features.length ? ' · otevřený' : ''}</span></span></button><button class="ibtn sd-del" data-del="${x.uid}" title="Smazat návrh" aria-label="Smazat návrh ${esc(x.name)}">${svg('skdel', 15)}</button></li>`).join('');
  ov.innerHTML = `<div class="sd-box" role="dialog" aria-modal="true" aria-labelledby="sd-title">
    <div class="sd-head"><h2 id="sd-title">${first ? 'Vítejte ve ' + esc(SKICA.full) : 'Moje návrhy'}</h2><button class="ibtn" data-act="close" aria-label="Zavřít" title="Zavřít">${svg('close', 16)}</button></div>
    <div class="sd-actions">
      <button class="btn primary" data-act="new">Nový návrh</button>
      ${last ? `<button class="btn" data-open="${last.uid}">Pokračovat: ${esc(last.name)}</button>` : ''}
    </div>
    ${list.length ? `<div class="sd-label">Předchozí návrhy</div><ul class="sd-list">${rows}</ul>` : '<p class="sd-empty">Zatím tu nejsou žádné uložené návrhy. Jakmile začnete modelovat, návrh se sám uloží a příště ho najdete tady.</p>'}
    <div class="sd-foot"><button class="btn sm" data-act="file">Otevřít ze souboru…</button><button class="btn sm" data-act="example">Ukázkový model</button></div>
    <p class="sd-note">Návrhy se ukládají automaticky jen v tomto prohlížeči. Zálohu uděláte přes Soubor › Uložit návrh.</p></div>`;
  ov.hidden = false;
  const b = ov.querySelector('.btn.primary'); if (b) b.focus();
}
const hideStart = () => { $('#startdlg').hidden = true; };
$('#startdlg').addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) { if (e.target.id === 'startdlg') hideStart(); return; }
  if (t.dataset.open) {
    const d = libGet(t.dataset.open);
    if (!d) { toast('Návrh se nepodařilo načíst.'); libDelete(t.dataset.open); showStart(false); return; }
    hideStart(); loadDoc(d, `Otevřen návrh „${d.name}“`); if (!libThumb(d.uid)) scheduleThumb(2500); return;
  }
  if (t.dataset.del) {
    if (t.dataset.confirm !== '1') { t.dataset.confirm = '1'; t.classList.add('warn'); t.title = 'Klepněte znovu pro smazání'; toast('Klepněte znovu na koš pro trvalé smazání návrhu.'); return; }
    const uid = t.dataset.del; libDelete(uid);
    if (doc.uid === uid) doc.uid = newUid();
    pruneBlobs(); showStart(false); return;
  }
  const a = t.dataset.act;
  if (a === 'close') hideStart();
  else if (a === 'new') { hideStart(); if (doc.features.length) loadDoc(emptyDoc(), 'Nový návrh'); }
  else if (a === 'file') { hideStart(); $('#fileinput').click(); }
  else if (a === 'example') { hideStart(); loadDoc(exampleDoc(), 'Ukázkový model načten'); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#startdlg').hidden) { e.stopPropagation(); hideStart(); } }, true);
$('#m-example').addEventListener('click', () => { closeMenu(); loadDoc(exampleDoc(), 'Ukázkový model načten'); });
$('#m-open').addEventListener('click', () => { closeMenu(); $('#fileinput').click(); });
$('#m-import').addEventListener('click', () => { closeMenu(); pickImportFile('.stl,.obj,.dxf,.svg,.zip'); });
$('#m-save').addEventListener('click', () => { closeMenu(); saveFile(fileBase() + '.json', projectJSON()); });
$('#m-export').addEventListener('click', () => { closeMenu(); exportMesh(); });
$('#fileinput').addEventListener('change', e => {
  const file = e.target.files && e.target.files[0]; if (!file) return;
  e.target.value = '';
  (async () => {
    try {
      if (/\.zip$/i.test(file.name)) {
        const entries = await Importers.readZip(await file.arrayBuffer());
        const proj = entries.find(x => /\.skicacad\.json$/i.test(x.name)) || entries.find(x => /\.json$/i.test(x.name));
        if (!proj) throw new Error('Archiv neobsahuje návrh SkicaCAD. Síť z něj vložíte přes Importovat.');
        openProject(JSON.parse(new TextDecoder().decode(proj.data)));
      } else openProject(JSON.parse(await file.text()));
    } catch (er) { toast(er && er.message && !/JSON/.test(er.message) ? er.message : 'Soubor se nepodařilo načíst. Očekávám návrh SkicaCAD ve formátu .json nebo .zip.'); }
  })();
});
$('#docname').addEventListener('input', e => { doc.name = e.target.value; saveDoc(); renderBrowser(); });
$('#docname').addEventListener('change', () => pushHist());
$('#undo').addEventListener('click', undo);
$('#redo').addEventListener('click', redo);

/* ================= language ================= */
function syncLangBtn() { const b = $('#langbtn'); if (!b) return; const en = EN(); b.querySelector('.lc').textContent = en ? 'EN' : 'CZ'; b.title = en ? 'Language: English (switch to Czech)' : 'Jazyk: čeština (přepnout do angličtiny)'; }
if ($('#langbtn')) $('#langbtn').addEventListener('click', () => {
  const l = EN() ? 'cs' : 'en';
  settings.lang = l; saveSettings();
  if (window.I18N) I18N.set(l);
  if (doc.name === 'Bez názvu' || doc.name === 'Untitled') { doc.name = l === 'en' ? 'Untitled' : 'Bez názvu'; $('#docname').value = doc.name; }
  buildCubeMaterials(); renderRibbon(); renderBrowser(); renderTimeline(); updateInfo(); applyNav();
  if (sk) { renderPalette(); redrawSketch(); }
  if (!$('#startdlg').hidden) showStart(false);
  syncLangBtn(); requestRender();
  toast(l === 'en' ? 'Language: English' : 'Jazyk: čeština');
});
syncLangBtn();

/* ================= theme changes ================= */
function onTheme() {
  readTokens(); buildCubeMaterials();
  gridMinor.color.copy(tok.grid); gridMajor.color.copy(tok['grid-major']);
  for (const o of sketchObjs.values()) { G.sketches.remove(o.obj); disposeObj(o.obj); }
  sketchObjs.clear(); syncSketches();
  if (sk) { buildSketchGrid(); redrawSketch(); }
  styleBodies();
}
new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
if (window.matchMedia) { const mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', onTheme); }

/* ================= start ================= */
gridMinor.color.copy(tok.grid); gridMajor.color.copy(tok['grid-major']);
$('#docname').value = doc.name;
renderRibbon(); applyNav(); updateMenu(); resize();
if (window.matchMedia('(max-width: 760px)').matches) $('#bw-toggle').innerHTML = svg('chevr', 14);
pushHist();
loadStoredBlobs();
refreshBusy(() => fitView(VIEW_ISO, true));
showStart(true);
if (window.__KOTA_TEST__) window.__kota = { get idbOk() { return idbOk; }, setFaceMode, faceAtHit, faceToSketch, startPressFace, get selFace() { return selFace; }, set selFace(v) { selFace = v; }, exportZip, exportTris, fileBase, selectAll, startCenter, copySel, pasteClip, duplicateSel, get clip() { return clip; }, sketchHandleAt, startScale, startThread, cylinderAt, startRotate, importFile, startPattern, startMirror, startRevolve, get blobs() { return blobs; }, runCommand, editFeature, okCmd, endCmd, enterSketch, finishSketch, bodyClick, moveMarker, deleteFeature, undo, redo, exportMesh, loadDoc, exampleDoc, emptyDoc, setSketchTool, libList, showStart, makeThumb, libThumb, transform, persp, toPx, startMove, alignDesc,
  get doc() { return doc; }, get cur() { return cur; }, get cmd() { return cmd; }, get sk() { return sk; }, get dlg() { return dlg; }, get sel() { return sel; }, meshes, chainsFor };
})();



