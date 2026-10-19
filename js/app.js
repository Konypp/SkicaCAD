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
  splitbody: '<path class="b" d="M4 8 12 4l8 4v8l-8 4-8-4z" opacity=".55"/><path d="M4 8 12 4l8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"/><path d="M2 13.5 12 9l10 4.5" stroke-dasharray="2.2 1.6"/>',
  bendface: '<path class="b" d="M3 5h9a8 8 0 0 1 8 8v8h-5v-8a3 3 0 0 0-3-3H3z" opacity=".55"/><path d="M3 5h9a8 8 0 0 1 8 8v8h-5v-8a3 3 0 0 0-3-3H3z"/>',
  combine: '<rect class="b" x="3" y="7" width="11" height="11" rx="1"/><circle class="b2" cx="15" cy="10" r="6" opacity=".85"/><rect x="3" y="7" width="11" height="11" rx="1"/><circle cx="15" cy="10" r="6"/>',
  move: '<path d="M12 3v18M3 12h18M12 3 9.5 5.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/><rect class="b" x="9" y="9" width="6" height="6" rx="1"/>',
  del: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/><path class="r" d="M10 11v6M14 11v6" style="stroke:var(--danger)"/>',
  line: '<path d="M4 19 10 7l10 4"/><rect x="2.5" y="17.5" width="3" height="3" style="fill:var(--panel)"/><rect x="8.5" y="5.5" width="3" height="3" style="fill:var(--panel)"/><rect x="18.5" y="9.5" width="3" height="3" style="fill:var(--panel)"/>',
  rect: '<rect class="o" x="4" y="6" width="16" height="12" opacity=".35"/><rect x="4" y="6" width="16" height="12"/><rect x="2.5" y="4.5" width="3" height="3" style="fill:var(--panel)"/><rect x="18.5" y="16.5" width="3" height="3" style="fill:var(--panel)"/>',
  circle: '<circle class="o" cx="12" cy="12" r="8" opacity=".35"/><circle cx="12" cy="12" r="8"/><path d="M12 12l5.6-5.6"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
  skdel: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  finish: '<circle class="g" cx="12" cy="12" r="9" opacity=".2"/><circle cx="12" cy="12" r="9" style="stroke:var(--ok)"/><path d="m7.5 12.5 3 3 6-6.5" style="stroke:var(--ok);stroke-width:2.2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  sktrim: '<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/><path class="o" d="M12 7.2a6 6 0 0 1 0 9.6" style="stroke:var(--orange)"/>',
  sktext: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  skoffset: '<rect x="7" y="7" width="10" height="10" rx="1"/><rect x="3" y="3" width="18" height="18" rx="3" style="stroke:var(--orange)" stroke-dasharray="3 2"/>',
  sksegtrim: '<circle cx="10" cy="13" r="6"/><path d="M12 4h9v9h-5"/><path class="o" d="M13.5 7.5 16 10" stroke-dasharray="2 2" style="stroke:var(--orange)"/><path d="M3 21 8 16M8 21 3 16" style="stroke:var(--orange)"/>',
  skjoin: '<path d="M4 6c3-2 6 2 9 0"/><path d="M4 18c3 2 6-2 9 0"/><path d="M13 6 18 12 13 18M4 6v12" stroke-dasharray="2 2" style="stroke:var(--orange)"/>',
  skcons: '<path d="M3 20 21 4" stroke-dasharray="3 2.5"/><circle cx="3.5" cy="19.5" r="1.6"/><circle cx="20.5" cy="4.5" r="1.6"/>',
  skdup: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  bolt: '<path class="b" d="M7 3h10l2 3.5-2 3.5H7L5 6.5z"/><path d="M9.5 10v11h5V10"/><path d="M9.5 13l5 1.5M9.5 16l5 1.5M9.5 19l5 1.5"/>',
  nut: '<path class="b" d="M7.5 4h9l4.5 8-4.5 8h-9L3 12z"/><circle cx="12" cy="12" r="3.6"/>',
  latch: '<path class="b" d="M3 3h18v8H3z"/><path d="M3 3h18v8H3zM3 13h18v8H3z"/><path class="o" d="M14 7h3v9.5l-2 1.5" style="stroke:var(--orange)"/><path d="M13 16.5h5"/>',
  hinge: '<path class="b" d="M2 6h7.5v12H2z"/><path d="M2 6h7.5v12H2zM14.5 6H22v12h-7.5z"/><rect x="9.5" y="4" width="5" height="5" rx="1.2"/><rect x="9.5" y="15" width="5" height="5" rx="1.2"/><rect class="o" x="9.5" y="9.5" width="5" height="5" rx="1.2" style="stroke:var(--orange)"/><path d="M12 3v18" stroke-dasharray="1.6 1.6"/>',
  thauto: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" style="fill:currentColor;stroke:none"/>',
  thlight: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  thdark: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5z"/>',
  tfirst: '<path d="M6 5v14M18 5l-9 7 9 7z"/>',
  tprev: '<path d="M16 5l-9 7 9 7z"/>',
  tnext: '<path d="M8 5l9 7-9 7z"/>',
  tlast: '<path d="M18 5v14M6 5l9 7-9 7z"/>',
  facemode: '<path class="b" d="M4 9 12 5l8 4-8 4z"/><path d="M4 9 12 5l8 4-8 4zM4 9v7l8 4 8-4V9M12 13v7"/>',
  splitface: '<path class="b" d="M4 9 12 5l8 4-8 4z"/><path d="M4 9 12 5l8 4-8 4zM4 9v7l8 4 8-4V9"/><path d="M8 7l8 4" stroke-dasharray="2 1.6"/>',
  shell: '<path d="M4 8 12 4l8 4v9l-8 4-8-4z"/><path class="o" d="M7 9.5 12 7l5 2.5v6L12 18l-5-2.5z" style="stroke:var(--orange)"/>',
  hole: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7"/><ellipse class="o" cx="12" cy="7" rx="3" ry="1.3" style="stroke:var(--orange)"/><path d="M9 7.5v8M15 7.5v8" stroke-dasharray="2 2" style="stroke:var(--orange)"/>',
  pressface: '<path d="M4 14 12 10l8 4-8 4z"/><path class="b" d="M4 14 12 10l8 4-8 4z" opacity=".7"/><path d="M4 14v4l8 4 8-4v-4"/><path d="M12 9V2M9.5 4.5 12 2l2.5 2.5"/>',
  center: '<path d="M12 2v5M12 17v5M2 12h5M17 12h5"/><rect class="b" x="7" y="7" width="10" height="10" rx="1"/><rect x="7" y="7" width="10" height="10" rx="1"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  selall: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 2"/><rect class="b" x="7" y="7" width="5" height="5"/><rect class="b2" x="13" y="12" width="5" height="5"/><rect x="7" y="7" width="5" height="5"/><rect x="13" y="12" width="5" height="5"/>',
  scale: '<rect class="b" x="3" y="11" width="10" height="10" rx="1"/><rect x="3" y="11" width="10" height="10" rx="1"/><path d="M8 11V4h12v12h-7" stroke-dasharray="2 2"/><path d="M13 11l6-6M14.5 5H19v4.5"/>',
  thread: '<path class="b" d="M8 4h8v16H8z"/><path d="M8 4h8v16H8z"/><path d="M8 7.5 16 6M8 11 16 9.5M8 14.5 16 13M8 18 16 16.5"/><path d="M5 4v16" stroke-dasharray="2 2" opacity=".6"/>',
  rotate: '<path class="b" d="M9 8.5 14 6l5 2.5v6L14 17l-5-2.5z"/><path d="M9 8.5 14 6l5 2.5v6L14 17l-5-2.5zM9 8.5l5 2.5 5-2.5M14 11v6"/><path d="M6.5 18.5A8.5 8.5 0 0 1 5 7"/><path d="M3 9l2-2.4 2.4 1.6"/>',
  revolve: '<path class="o" d="M13 4h4v15h-4z" opacity=".7"/><path d="M13 4h4v15h-4z"/><path d="M9 2v20" stroke-dasharray="2 2"/><path class="b" d="M5.5 8.5c-2 .8-2 6.2 0 7l1.2-1.8c-.9-1-.9-2.4 0-3.4z" opacity=".9"/><path d="M5.5 8.5c-2 .8-2 6.2 0 7M5.5 15.5l-.2-2.3 2.1.9"/>',
  mirror: '<path d="M12 2v20" stroke-dasharray="2 2"/><path class="b" d="M3 7h6v10H3z"/><path d="M3 7h6v10H3z"/><path class="b2" d="M15 7h6v10h-6z" opacity=".55"/><path d="M15 7h6v10h-6z" stroke-dasharray="2 1.5"/>',
  pattern: '<circle cx="12" cy="12" r="1.2" fill="currentColor"/><rect class="b" x="9.5" y="2.5" width="5" height="5" rx="1"/><rect class="b2" x="16.5" y="9.5" width="5" height="5" rx="1"/><rect class="b2" x="9.5" y="16.5" width="5" height="5" rx="1"/><rect class="b2" x="2.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="2.5" width="5" height="5" rx="1"/><rect x="16.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="16.5" width="5" height="5" rx="1"/><rect x="2.5" y="9.5" width="5" height="5" rx="1"/>',
  simulate: '<path class="b" d="M3 14h18v7H3z"/><path d="M3 14h18v7H3z"/><path class="o" d="M4 12 17 4.5" style="stroke:var(--orange)"/><path d="M20 3.5a8 8 0 0 1 1 7" stroke-dasharray="2 2"/><path d="m21.6 8.3-.6 2.4-2.2-1"/>',
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
/* the app has its own right-click menus: keep the browser's menu away everywhere except in text fields
   (the app's menu opens under the pointer, so the browser's 'contextmenu' event lands on that menu, not on the canvas) */
document.addEventListener('contextmenu', e => { if (!(e.target.closest && e.target.closest('input, textarea, [contenteditable="true"]'))) e.preventDefault(); });

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
/* mouse: left drag rotates, middle or right drag pans, the wheel zooms; Shift + left drag selects with a rubber band */
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
controls.minDistance = 1; controls.maxDistance = 6000; controls.minZoom = 0.02; controls.maxZoom = 80;
controls.rotateSpeed = 0.8; controls.zoomSpeed = 1.1;
controls.target.set(0, 0, 10);
controls.update();

const transform = new THREE.TransformControls(persp, dom);
transform.setSize(0.9);
transform.freeXY = true; /* the centre handle moves bodies in X and Y only (patched TransformControls) */
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
  /* X and Y axes across the whole grid (no Z axis line); the origin is a small circle */
  const ax = (a, b, c) => G.origin.add(noRay(new THREE.Line(lineGeo([...a, ...b]), new THREE.LineBasicMaterial({ color: c }))));
  ax([-ext, 0, 0.02], [ext, 0, 0.02], 0xe5484d); ax([0, -ext, 0.02], [0, ext, 0.02], 0x2f9e6a);
  const ring = []; for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; ring.push(Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0.03); }
  G.origin.add(noRay(new THREE.Line(lineGeo(ring), new THREE.LineBasicMaterial({ color: 0xe2862c }))));
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
/* sketch plane on a body face: origin in the middle of the face (centre of its bounding box in the plane), so the grid
   and the sketch coordinates start at the face centre and not where the world origin projects onto the plane */
function facePlane(n, w, regionPolys) {
  const B = Engine.basisFromPlane(n, w), r = a => a.map(x => Math.round(x * 1e6) / 1e6);
  if (!regionPolys || !regionPolys.length) return { o: r(B.o), u: r(B.u), v: r(B.v), n: r(B.n) };
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (const q of regionPolys) for (const p of q.v) { const d = K.vsub(p, B.o), a = K.vdot(d, B.u), b = K.vdot(d, B.v); u0 = Math.min(u0, a); u1 = Math.max(u1, a); v0 = Math.min(v0, b); v1 = Math.max(v1, b); }
  const r4 = x => Math.round(x * 1e4) / 1e4, cu = r4((u0 + u1) / 2), cv = r4((v0 + v1) / 2);
  const o = K.vadd(B.o, K.vadd(K.vmul(B.u, cu), K.vmul(B.v, cv)));
  return { o: o.map(x => Math.round(x * 1e4) / 1e4), u: r(B.u), v: r(B.v), n: r(B.n) };
}
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

/* design names are unique in the library: a clash gets " (2)", " (3)", … */
function uniqueName(name, uid) {
  const key = x => String(x || '').trim().toLocaleLowerCase();
  const taken = new Set(libList().filter(x => x.uid !== uid).map(x => key(x.name)));
  const nm = String(name || '').trim() || (EN() ? 'Untitled' : 'Bez názvu');
  if (!taken.has(key(nm))) return nm;
  const base = nm.replace(/\s*\(\d+\)$/, '');
  for (let i = 2; i < 1000; i++) { const c = `${base} (${i})`; if (!taken.has(key(c))) return c; }
  return nm;
}
/* rename the open design if its name is taken; quiet while the name is being typed */
function ensureUniqueName(announce) {
  const nm = uniqueName(doc.name, doc.uid);
  if (nm === doc.name) return false;
  doc.name = nm; const el = $('#docname'); if (el) el.value = nm;
  if (announce) toast(`Návrh s tímto názvem už existuje, název změněn na „${nm}“.`);
  return true;
}
let doc = emptyDoc();
let hist = [], hi = -1, quotaWarned = false;
const saveDoc = () => {
  if (!doc.uid) doc.uid = newUid();
  if (!doc.features.length) return;
  if (document.activeElement !== $('#docname') && ensureUniqueName(false) && typeof renderBrowser === 'function') renderBrowser();
  scheduleThumb();
  try { libStore(doc); checkStorage(); } catch (e) { if (!quotaWarned) { quotaWarned = true; toast('Úložiště prohlížeče je plné. Zálohujte knihovnu (Soubor › Zálohovat knihovnu) a smažte staré návrhy (Soubor › Moje návrhy).'); } }
};
/* how full the browser storage for designs is: localStorage holds about 5 million characters per site */
const LS_QUOTA = 5e6;
function storageUsed() {
  let n = 0;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^(skicacad|kota-cad)/.test(k)) n += k.length + (localStorage.getItem(k) || '').length; } } catch (e) { /* ignore */ }
  return n;
}
let storageWarnLevel = 0;
function checkStorage() {
  const r = storageUsed() / LS_QUOTA, lvl = r >= 0.95 ? 2 : r >= 0.8 ? 1 : 0;
  if (lvl > storageWarnLevel) toast(`Úložiště návrhů je zaplněné z ${Math.round(r * 100)} %. Zálohujte knihovnu (Soubor › Zálohovat knihovnu) a smažte staré návrhy (Soubor › Moje návrhy).`);
  storageWarnLevel = Math.max(storageWarnLevel, lvl);
}
const fmtMB = n => (n < 1e5 ? fmtc(Math.max(1, n / 1e3), 0) + ' kB' : fmtc(n / 1e6, 1) + ' MB');
function pushHist() {
  const s = JSON.stringify(doc);
  if (hist[hi] === s) return;
  hist = hist.slice(0, hi + 1); hist.push(s); if (hist.length > 120) hist.shift(); hi = hist.length - 1;
  updateUndo();
}
function updateUndo() {
  if (sk) { $('#undo').disabled = !(sk.hist && sk.hist.length) && !sk.draft; $('#redo').disabled = !(sk.fut && sk.fut.length); return; }
  $('#undo').disabled = hi <= 0 || !!cmd; $('#redo').disabled = hi >= hist.length - 1 || !!cmd;
}
function commit() { pushHist(); saveDoc(); refreshBusy(); }
function undo() { if (sk) { skUndo(); return; } if (hi > 0 && !cmd) { hi--; doc = JSON.parse(hist[hi]); afterDocSwap(); } }
function redo() { if (sk) { skRedo(); return; } if (hi < hist.length - 1 && !cmd) { hi++; doc = JSON.parse(hist[hi]); afterDocSwap(); } }
/* sketch history: its own undo stack while the sketch is open (whole sketch closes as one step in the model history).
   A snapshot is taken whenever the palette refreshes after a change; undo first takes back the point or shape being drawn. */
/* elements drawn while helper drawing is on become construction elements (same undo step as the drawing) */
function markCons(n0) {
  if (!sk || !sk.consMode || sk.f.ents.length <= n0) return;
  for (let i = n0; i < sk.f.ents.length; i++) sk.f.ents[i].cons = true;
  sk.lastJSON = JSON.stringify(sk.f.ents); renderPalette(); redrawSketch();
}
function toggleCons() {
  if (!sk) return;
  const e = sk.f.ents[sk.selEnt];
  if (!sk.tool && e) {
    if (e.cons) delete e.cons; else e.cons = true;
    toast(e.cons ? 'Prvek je pomocný: kreslí se čárkovaně a netvoří profil.' : 'Prvek už není pomocný.');
    renderPalette(); redrawSketch(); return;
  }
  sk.consMode = !sk.consMode;
  toast(sk.consMode ? 'Pomocné kreslení zapnuto: nové prvky budou pomocné (čárkovaně, netvoří profil).' : 'Pomocné kreslení vypnuto');
  renderRibbon(); redrawSketch();
}
function skCheckpoint() {
  if (!sk || !sk.hist) return;
  const j = JSON.stringify(sk.f.ents);
  if (j !== sk.lastJSON) { sk.hist.push(sk.lastJSON); if (sk.hist.length > 200) sk.hist.shift(); sk.fut = []; sk.lastJSON = j; }
  updateUndo();
}
function skSwap(j) { sk.f.ents = JSON.parse(j); sk.lastJSON = j; sk.selEnt = -1; sk.joinA = null; sk.drag = null; $('#dim').hidden = true; renderPalette(); redrawSketch(); updateUndo(); }
function skUndo() {
  if (sk.draft) {
    if (sk.draft.pts && sk.draft.pts.length > 1 && isPolyTool(sk.tool) && !isFreehand()) sk.draft.pts.pop(); else sk.draft = null;
    redrawSketch(); updateDimLabel(); updateUndo(); return;
  }
  if (!sk.hist.length) return;
  sk.fut.push(sk.lastJSON); skSwap(sk.hist.pop());
}
function skRedo() { if (!sk.fut.length) return; sk.hist.push(sk.lastJSON); skSwap(sk.fut.pop()); }
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
/* Move / Rotate preview bodies with mesh matrices. After OK the preview stays in place until the rebuild has replaced the meshes,
   otherwise the bodies would jump back for a moment and then to the new place. */
let xformResetPending = false;
function resetBodyMatrices(defer) {
  if (defer) { xformResetPending = true; return; }
  xformResetPending = false;
  for (const e of meshes.values()) { e.mesh.matrixAutoUpdate = true; e.mesh.matrix.identity(); e.mesh.position.set(0, 0, 0); e.mesh.rotation.set(0, 0, 0); e.mesh.updateMatrix(); }
}
function refresh() {
  const m = viewMarker === null ? doc.marker : viewMarker;
  cur = rebuilder(doc.features, m);
  if (typeof selFace !== 'undefined') {
    const stale = fc => fc && (!cur.bodies.some(b => b.polys === fc.polys && b.id === fc.bodyId));
    if (stale(selFace)) { selFace = null; hoverFace = null; }
    if (stale(hoverFace)) hoverFace = null;
  }
  syncBodies(); if (xformResetPending) resetBodyMatrices(false); syncSketches(); renderBrowser(); renderTimeline(); updateInfo(); updateUndo(); requestRender();
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
  /* sharp edges plus the dividing lines of split faces */
  let segs = K.edgeSegments(b.polys);
  if (b.seams && b.seams.length) { const sa = Engine.seamSegments(b.polys, b.seams); if (sa.length) { const all = new Float32Array(segs.length + sa.length); all.set(segs); all.set(sa, segs.length); segs = all; } }
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(segs, 3));
  const edges = noRay(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: tok.edge.clone() })));
  mesh.add(edges);
  G.bodies.add(mesh);
  return { mesh, edges, polys: b.polys, seams: b.seams };
}
function disposeEntry(e) {
  e.mesh.geometry.dispose(); e.mesh.material.dispose(); e.edges.geometry.dispose(); e.edges.material.dispose();
  if (e.facets) { e.facets.geometry.dispose(); e.facets.material.dispose(); }
  G.bodies.remove(e.mesh);
}
function syncBodies() {
  const seen = new Set();
  for (const b of cur.bodies) {
    seen.add(b.id);
    let e = meshes.get(b.id);
    if (!e || e.polys !== b.polys || e.seams !== b.seams) { if (e) disposeEntry(e); e = makeBodyEntry(b); meshes.set(b.id, e); }
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
    const visible = bodiesVisible() && isVis(id) && id !== hideForPreview && !(cmd && cmd.hideBodies && cmd.hideBodies.has(id));
    e.mesh.visible = visible;
    const m = e.mesh.material, isSel = sel.has(id) || (cmd && cmd.highlight && cmd.highlight.has(id));
    const tint = bodyTint.get(id);
    m.color.copy(tok.body);
    if (tint === 'tool') m.color.lerp(tok.orange, 0.5);
    else if (isSel || tint === 'target') m.color.lerp(tok.accent, 0.45);
    /* wireframe: the edges of the facets the body is made of (every edge where the surface turns, however little, so curved
       faces show their shape), no triangle diagonals inside flat faces; sharp edges are drawn stronger over them */
    const wire = settings.style === 'w';
    m.wireframe = false; m.transparent = false; m.opacity = 1; m.depthWrite = true;
    m.visible = !wire;
    if (wire && !e.facets) {
      const arr = [];
      for (const ed of K.edgeMapOf(e.polys).values()) { if (ed.ps.length === 2 && K.vdot(e.polys[ed.ps[0]].n, e.polys[ed.ps[1]].n) > 0.99999) continue; arr.push(...ed.a, ...ed.b); }
      e.facets = noRay(new THREE.LineSegments(lineGeo(arr), new THREE.LineBasicMaterial({ color: tok.edge.clone(), transparent: true, opacity: 0.45 })));
      e.mesh.add(e.facets);
    }
    if (e.facets) { e.facets.visible = wire; e.facets.material.color.copy(tok.muted); e.facets.material.opacity = 0.5; }
    e.edges.visible = settings.style !== 's';
    /* sharp edges are drawn softly (a shade darker than the body); selection and hover keep strong colours */
    const strong = isSel || tint || hoverBody === id;
    e.edges.material.color.copy(isSel || tint ? (tint === 'tool' ? tok.orange : tok.accent) : (hoverBody === id ? tok['accent-hover'] : softEdge()));
    e.edges.material.transparent = !strong; e.edges.material.opacity = strong ? 1 : 0.55; e.edges.material.depthWrite = strong;
    if (wire && !strong) { e.edges.material.color.copy(tok.muted); e.edges.material.transparent = false; e.edges.material.opacity = 1; }
  }
  requestRender();
}
function softEdge() { return tok.body.clone().lerp(tok.edge, 0.6); }
function visibleMeshes() { return Array.from(meshes.values()).filter(e => e.mesh.visible).map(e => e.mesh); }

/* sketches (finished) */
/* outlines of sketch elements; each carries ei, the index of its element (a text gives one outline per letter contour) */
function entityPolylines(ents) {
  const out = [];
  ents.forEach((e, ei) => {
    if (e.t === 'spline') { out.push({ ei, pts: K.splinePoints(e.pts, !!e.closed && e.pts.length >= 3, 16, e.lin), closed: !!e.closed && e.pts.length >= 3 }); return; }
    if (e.t === 'text') { for (const pts of skicaTextLoops(e)) out.push({ ei, pts, closed: true }); return; }
    if (e.t === 'circle') { const p = []; for (let i = 0; i < 72; i++) { const a = 2 * Math.PI * i / 72; p.push([e.x + e.r * Math.cos(a), e.y + e.r * Math.sin(a)]); } out.push({ ei, pts: p, closed: true }); }
    else if (e.t === 'poly' && !(e.closed && e.fr > 0)) out.push({ ei, pts: e.pts, closed: !!e.closed });
    else if (e.t === 'rect' || e.t === 'ngon' || e.t === 'slot' || e.t === 'ellipse' || e.t === 'poly') { try { out.push({ ei, pts: K.profilePoints(e), closed: true }); } catch (er) { /* skip degenerate */ } }
  });
  return out;
}
/* construction (helper) elements – e.cons – are drawn dashed and never form a profile */
function sketchLines(P, ents, color, lift = 0.03) {
  const seg = list => {
    const arr = [];
    for (const pl of entityPolylines(list)) {
      const n = pl.pts.length, m = pl.closed ? n : n - 1;
      for (let i = 0; i < m; i++) { const a = pl.pts[i], b = pl.pts[(i + 1) % n]; const A = P3(P, a[0], a[1], lift), B = P3(P, b[0], b[1], lift); arr.push(A.x, A.y, A.z, B.x, B.y, B.z); }
    }
    return arr;
  };
  const norm = ents.filter(e => !e.cons), cons = ents.filter(e => e.cons);
  const solid = noRay(new THREE.LineSegments(lineGeo(seg(norm)), new THREE.LineBasicMaterial({ color })));
  if (!cons.length) return solid;
  const g = noRay(new THREE.Group()); g.add(solid);
  /* one dash pattern per element outline, measured along the outline (computeLineDistances on segment pairs would restart every segment) */
  for (const pl of entityPolylines(cons)) {
    const arr = [], n = pl.pts.length; for (let i = 0; i < (pl.closed ? n + 1 : n); i++) { const q = pl.pts[i % n], v = P3(P, q[0], q[1], lift); arr.push(v.x, v.y, v.z); }
    const l = new THREE.Line(lineGeo(arr), new THREE.LineDashedMaterial({ color, dashSize: 1.6, gapSize: 1.2 })); l.computeLineDistances(); g.add(noRay(l));
  }
  return g;
}
function keyPoints(ents) {
  const pts = [[0, 0]];
  for (const e of ents) {
    if (e.t === 'rect') pts.push([e.x, e.y], [e.x + e.w, e.y], [e.x + e.w, e.y + e.h], [e.x, e.y + e.h], [e.x + e.w / 2, e.y + e.h / 2]);
    else if (e.t === 'circle') pts.push([e.x, e.y]);
    else if (e.t === 'poly' || e.t === 'spline') pts.push(...e.pts.filter((q, j) => !isSmoothPt(e, j)));
    else if (e.t === 'ngon') { pts.push([e.x, e.y]); for (let i = 0; i < e.n; i++) { const a = (e.a || 0) * D2R + 2 * Math.PI * i / e.n; pts.push([e.x + e.r * Math.cos(a), e.y + e.r * Math.sin(a)]); } }
    else if (e.t === 'slot') pts.push([e.x1, e.y1], [e.x2, e.y2]);
    else if (e.t === 'text') pts.push([e.x, e.y]);
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
  cubeCam = new THREE.OrthographicCamera(-2.05, 2.05, 2.05, -2.05, 0.1, 20);
  cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), []);
  cubeMesh.rotation.x = Math.PI / 2;
  cubeScene.add(cubeMesh);
  const ce = noRay(new THREE.LineSegments(new THREE.EdgesGeometry(cubeMesh.geometry), new THREE.LineBasicMaterial({ color: 0x777777 })));
  cubeMesh.add(ce); cubeMesh.userData.edges = ce;
  /* axes run from the cube's corner out past the opposite faces; letters sit at the outer ends */
  const AL = 2.15, axes = [[[AL, 0, 0], 0xe5484d], [[0, AL, 0], 0x2f9e6a], [[0, 0, AL], 0x4f7ae0]];
  axes.forEach(([to, c], k) => {
    cubeScene.add(noRay(new THREE.Line(lineGeo([-0.8, -0.8, -0.8, to[0] - 0.8, to[1] - 0.8, to[2] - 0.8]), new THREE.LineBasicMaterial({ color: c }))));
    /* axis letter at the end of each axis */
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    g.font = 'bold 44px IBM Plex Sans, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#' + new THREE.Color(c).getHexString(); g.fillText('XYZ'[k], 32, 34);
    const tex = new THREE.CanvasTexture(cv), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true, depthWrite: false, transparent: true }));
    sp.scale.set(0.5, 0.5, 1); const lp = (AL + 0.22) / AL; sp.position.set(to[0] * lp - 0.8, to[1] * lp - 0.8, to[2] * lp - 0.8); sp.renderOrder = 5;
    cubeScene.add(noRay(sp));
  });
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
  if (sk) { const fg = G.skwork.getObjectByName('fine'); if (fg) fg.visible = 10 / worldPerPx(controls.target) > 90; }
  renderer.render(scene, c);
  renderCube();
  if (sk) { updateDimLabel(); updateSegLabels(); } else if (segLabelsOn) updateSegLabels();
  updateSketchDims();
}
/* ---------- sketch dimensions (kóty): drawn in screen space in an SVG overlay, recomputed every frame ---------- */
let skDimsOn = false, dimMeta = [];
const showSkDims = () => settings.skDims !== false;
/* turning angle of a polyline at point j (180 at open ends); a trimmed outline (tr) keeps arcs as short chords with small turns */
function polyTurn(e, j) {
  const n = e.pts.length; if (!e.closed && (j <= 0 || j >= n - 1)) return 180;
  const p0 = e.pts[(j - 1 + n) % n], p1 = e.pts[j % n], p2 = e.pts[(j + 1) % n];
  let d = Math.abs(Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) - Math.atan2(p1[1] - p0[1], p1[0] - p0[0])) / D2R; return d > 180 ? 360 - d : d;
}
/* chords of arcs (small turn at an end) and slivers shorter than 1 % of the outline left over at intersections */
const polyLen = e => { const n = e.pts.length, m = e.closed ? n : n - 1; let L = 0; for (let k = 0; k < m; k++) L += Math.hypot(e.pts[(k + 1) % n][0] - e.pts[k][0], e.pts[(k + 1) % n][1] - e.pts[k][1]); return L; };
const isChord = (e, k) => { if (!e.tr) return false; if (polyTurn(e, k) < 12 || polyTurn(e, k + 1) < 12) return true; const n = e.pts.length, a = e.pts[k % n], b = e.pts[(k + 1) % n]; return Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.01 * polyLen(e); };
const isSmoothPt = (e, j) => !!e.tr && polyTurn(e, j) < 12;
function updateSketchDims() {
  const box = $('#skdims'); if (!box) return;
  if (!sk || (!showSkDims() && !sk.f.orig)) { if (skDimsOn) { box.innerHTML = ''; skDimsOn = false; } return; }
  const P = sk.f.plane, W = dom.clientWidth, H = dom.clientHeight, out = []; dimMeta = [];
  const px = (x, y) => toPx(P3(P, x, y));
  const f1 = v => fmtc(v, 2);
  const hse = !sk.tool ? sk.f.ents[sk.selEnt] : null, hpx = hse && hse.t !== 'poly' && hse.t !== 'spline' ? shapeHandles(hse).map(h => px(h.p[0], h.p[1])) : [];
  const arrow = (t, d) => { const n = [-d[1], d[0]]; return `<path class="ah" d="M${t[0]},${t[1]}L${t[0] - d[0] * 6 + n[0] * 1.8},${t[1] - d[1] * 6 + n[1] * 1.8}L${t[0] - d[0] * 6 - n[0] * 1.8},${t[1] - d[1] * 6 - n[1] * 1.8}Z"/>`; };
  const text = (x, y, s, ang = 0, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}"${ang ? ` transform="rotate(${ang} ${x} ${y})"` : ''}>${s}</text>`;
  /* an editable label gets an invisible, finger-sized hit area; tapping it opens a number field (openDimEdit) */
  const hit = (ed, x, y, label, ang = 0, anchor = 'middle') => {
    if (!ed || ed.i < 0) return '';
    const w = Math.max(40, label.length * 6.5 + 16), x0 = anchor === 'start' ? x - 6 : anchor === 'end' ? x - w + 6 : x - w / 2;
    /* a label lying over a size handle gets no hit area, so the handle stays draggable */
    const ca = Math.cos(-ang * D2R), sa = Math.sin(-ang * D2R);
    if (hpx.some(q => { const qx = x + (q[0] - x) * ca - (q[1] - y) * sa, qy = y + (q[0] - x) * sa + (q[1] - y) * ca; return qx > x0 - 8 && qx < x0 + w + 8 && qy > y - 20 && qy < y + 20; })) return '';
    const di = dimMeta.push({ ...ed, x: anchor === 'middle' ? x : anchor === 'start' ? x + w / 2 - 6 : x - w / 2 + 6, y }) - 1;
    return `<rect class="dhit" data-di="${di}" x="${x0}" y="${y - 12}" width="${w}" height="24" rx="4"${ang ? ` transform="rotate(${ang} ${x} ${y})"` : ''}/>`;
  };
  const ok = (...q) => q.every(v => v[2] < 1 && v[0] > -W && v[0] < 2 * W && v[1] > -H && v[1] < 2 * H);
  /* aligned linear dimension between plane points a and b, pushed away from plane point c */
  const lin = (a, b, c, label, ed) => {
    const A = px(a[0], a[1]), B = px(b[0], b[1]), C = px(c[0], c[1]); if (!ok(A, B)) return;
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy); if (L < 18) return;
    const u = [dx / L, dy / L]; let n = [-u[1], u[0]];
    const side = (A[0] + B[0]) / 2 - C[0], sideY = (A[1] + B[1]) / 2 - C[1], dot = n[0] * side + n[1] * sideY;
    if (Math.abs(dot) < 1e-3 ? n[1] > 0 : dot < 0) n = [-n[0], -n[1]];
    const o = 16, a1 = [A[0] + n[0] * o, A[1] + n[1] * o], b1 = [B[0] + n[0] * o, B[1] + n[1] * o];
    out.push(`<path d="M${A[0] + n[0] * 4},${A[1] + n[1] * 4}L${A[0] + n[0] * (o + 3)},${A[1] + n[1] * (o + 3)}M${B[0] + n[0] * 4},${B[1] + n[1] * 4}L${B[0] + n[0] * (o + 3)},${B[1] + n[1] * (o + 3)}M${a1[0]},${a1[1]}L${b1[0]},${b1[1]}"/>`);
    out.push(arrow(a1, [-u[0], -u[1]]), arrow(b1, u));
    let ang = Math.atan2(u[1], u[0]) / D2R; if (ang > 90) ang -= 180; if (ang <= -90) ang += 180;
    const lb = label || f1(Math.hypot(b[0] - a[0], b[1] - a[1])), tx = (a1[0] + b1[0]) / 2, ty = (a1[1] + b1[1]) / 2, ra = Math.round(ang * 10) / 10;
    out.push(hit(ed, tx, ty, lb, ra), text(tx, ty, lb, ra));
  };
  /* line through or from a centre with arrows at the ends that touch the curve; the label sits past the end */
  const across = (p1, p2, label, both, ed) => {
    const A = px(p1[0], p1[1]), B = px(p2[0], p2[1]); if (!ok(A, B)) return;
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy); if (L < 10) return;
    const u = [dx / L, dy / L], E = [B[0] + u[0] * 8, B[1] + u[1] * 8], hz = E[0] + (u[0] >= 0 ? 9 : -9);
    out.push(`<path d="M${A[0]},${A[1]}L${E[0]},${E[1]}L${hz},${E[1]}"/>`, arrow(B, u));
    if (both) out.push(arrow(A, [-u[0], -u[1]]));
    const tx = hz + (u[0] >= 0 ? 3 : -3), an = u[0] >= 0 ? 'start' : 'end';
    out.push(hit(ed, tx, E[1], label, 0, an), text(tx, E[1], label, 0, an));
  };
  const rot = (cx, cy, a, x, y) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)];
  /* angle of segment a→b against the sketch X axis: dashed reference line, arc and the value */
  const angleDim = (a, b) => {
    const A = px(a[0], a[1]), B = px(b[0], b[1]), X = px(a[0] + 1, a[1]); if (!ok(A, B, X)) return;
    const sl = Math.hypot(B[0] - A[0], B[1] - A[1]); if (sl < 24) return;
    const r = [X[0] - A[0], X[1] - A[1]], rl = Math.hypot(r[0], r[1]); if (rl < 1e-6) return;
    const a0 = Math.atan2(r[1], r[0]), a1 = Math.atan2(B[1] - A[1], B[0] - A[0]);
    let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    const R = Math.min(30, sl * 0.6), L = R + 10, n = Math.max(2, Math.ceil(Math.abs(da) / 0.15));
    let path = `M${A[0]},${A[1]}L${A[0] + Math.cos(a0) * L},${A[1] + Math.sin(a0) * L}`;
    out.push(`<path d="${path}" stroke-dasharray="3 2"/>`);
    let arc = ''; for (let j = 0; j <= n; j++) { const t = a0 + da * j / n; arc += (j ? 'L' : 'M') + (A[0] + Math.cos(t) * R) + ',' + (A[1] + Math.sin(t) * R); }
    out.push(`<path d="${arc}"/>`);
    const deg = dirAngle(a, b), shown = deg > 180 ? deg - 360 : deg, tm = a0 + da / 2;
    out.push(text(A[0] + Math.cos(tm) * (R + 12), A[1] + Math.sin(tm) * (R + 12), fmtc(shown, 1) + '°'));
  };
  /* sketch made from a face: how far each outline has moved from where it was on the face */
  if (sk.f.orig) {
    const cen = e => { const pl = entityPolylines([e])[0]; if (!pl || !pl.pts.length) return null; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const q of pl.pts) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); } return [(x0 + x1) / 2, (y0 + y1) / 2]; };
    sk.f.orig.forEach((o, i) => {
      const e = sk.f.ents[i]; if (!e || e.t !== o.t) return;
      const a = cen(o), b = cen(e); if (!a || !b) return;
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); if (L < 1e-4) return;
      const A = px(a[0], a[1]), B = px(b[0], b[1]); if (!ok(A, B)) return;
      const sl = Math.hypot(B[0] - A[0], B[1] - A[1]); if (sl < 4) return;
      const u = [(B[0] - A[0]) / sl, (B[1] - A[1]) / sl];
      out.push(`<g class="moved"><circle cx="${A[0]}" cy="${A[1]}" r="2.5"/><path d="M${A[0]},${A[1]}L${B[0]},${B[1]}"/>${arrow(B, u)}</g>`);
      out.push(`<text class="moved" x="${A[0] - u[0] * 8}" y="${A[1] - u[1] * 8 + (u[1] > 0 ? -8 : 12)}" text-anchor="${u[0] > 0 ? 'end' : 'start'}">${EN() ? 'Moved' : 'Posun'} ${f1(L)} mm (X ${f1(dx)} · Y ${f1(dy)})</text>`);
    });
  }
  const ents = showSkDims() ? sk.f.ents.map((e, i) => [e, i]) : [];
  const d = showSkDims() ? draftEntity() : null; if (d) ents.push([d, -1]);
  if (ents.length > 80) { box.innerHTML = out.join(''); skDimsOn = true; return; }
  for (const [e, i] of ents) {
    const ed = (k, v, map) => ({ i, k, v, map });
    if (e.t === 'rect') {
      const x0 = Math.min(e.x, e.x + e.w), x1 = Math.max(e.x, e.x + e.w), y0 = Math.min(e.y, e.y + e.h), y1 = Math.max(e.y, e.y + e.h), c = [(x0 + x1) / 2, (y0 + y1) / 2];
      lin([x0, y0], [x1, y0], c, null, ed('w', x1 - x0, v => (e.w < 0 ? -v : v))); lin([x1, y0], [x1, y1], c, null, ed('h', y1 - y0, v => (e.h < 0 ? -v : v)));
    } else if (e.t === 'circle') {
      const a = Math.PI / 4; across([e.x - e.r * Math.cos(a), e.y - e.r * Math.sin(a)], [e.x + e.r * Math.cos(a), e.y + e.r * Math.sin(a)], 'Ø ' + f1(e.r * 2), true, ed('d', e.r * 2));
    } else if (e.t === 'ngon') {
      const a = (e.a || 0) * D2R; across([e.x, e.y], [e.x + e.r * Math.cos(a), e.y + e.r * Math.sin(a)], 'R ' + f1(e.r), false, ed('r', e.r));
      /* side length on the side opposite the radius line so the two labels don't collide */
      const s1 = a + Math.floor(e.n / 2) * 2 * Math.PI / e.n, s2 = s1 + 2 * Math.PI / e.n; lin([e.x + e.r * Math.cos(s1), e.y + e.r * Math.sin(s1)], [e.x + e.r * Math.cos(s2), e.y + e.r * Math.sin(s2)], [e.x, e.y], null, ed('r', 2 * e.r * Math.sin(Math.PI / e.n), v => v / (2 * Math.sin(Math.PI / e.n))));
    } else if (e.t === 'ellipse') {
      const a = (e.a || 0) * D2R, c = [e.x, e.y];
      lin(rot(e.x, e.y, a, -e.rx, -e.ry), rot(e.x, e.y, a, e.rx, -e.ry), c, f1(e.rx * 2), ed('rx', e.rx * 2, v => v / 2));
      lin(rot(e.x, e.y, a, e.rx, -e.ry), rot(e.x, e.y, a, e.rx, e.ry), c, f1(e.ry * 2), ed('ry', e.ry * 2, v => v / 2));
    } else if (e.t === 'slot') {
      const g = slotGeom(e), a = g.ang * D2R, h = e.w / 2, c = [g.cx, g.cy];
      lin(rot(g.cx, g.cy, a, -g.len / 2, -h), rot(g.cx, g.cy, a, g.len / 2, -h), c, f1(g.len), ed('slen', g.len));
      lin(rot(g.cx, g.cy, a, g.len / 2 - h, -h), rot(g.cx, g.cy, a, g.len / 2 - h, h), rot(g.cx, g.cy, a, 0, 0), f1(e.w), ed('w', e.w));
    } else if (e.t === 'poly') {
      const n = e.pts.length, segs = e.closed ? n : n - 1; if ((segs > 40 && !e.tr) || n < 2) continue;
      const c = e.pts.reduce((s, q) => [s[0] + q[0] / n, s[1] + q[1] / n], [0, 0]);
      /* a trimmed outline keeps arcs as short chords: those get no length, only the straight sides do */
      for (let k = 0; k < segs; k++) { if (isChord(e, k)) continue; const a = e.pts[k], b = e.pts[(k + 1) % n]; lin(a, b, c, null, ed('L' + k, Math.hypot(b[0] - a[0], b[1] - a[1]))); }
      if (i < 0 && n >= 2) angleDim(e.pts[n - 2], e.pts[n - 1]); /* the segment being drawn: its angle too */
      else if (i === sk.selEnt && !sk.tool && !e.closed && segs <= 6) for (let k = 0; k < segs; k++) if (!isChord(e, k)) angleDim(e.pts[k], e.pts[k + 1]); /* a selected open line: angles of its segments */
    } else if (e.t === 'spline' && i < 0 && e.pts.length >= 2) {
      const a = e.pts[e.pts.length - 2], b = e.pts[e.pts.length - 1];
      lin(a, b, [a[0] + (a[1] - b[1]), a[1] + (b[0] - a[0])], null, null); angleDim(a, b);
    }
  }
  box.innerHTML = out.join(''); skDimsOn = true;
}
/* editing a dimension in place: a number field over the label, Enter or leaving the field applies, Esc cancels */
function openDimEdit(m) {
  closeDimEdit(false);
  const box = $('#skdims').parentNode, inp = document.createElement('input');
  inp.className = 'dimedit'; inp.id = 'dimedit'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = fmtc(m.v, 3);
  inp.setAttribute('aria-label', EN() ? 'Dimension' : 'Kóta');
  inp.style.left = m.x + 'px'; inp.style.top = m.y + 'px';
  inp._m = m; box.appendChild(inp); inp.focus(); inp.select();
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); closeDimEdit(true); } else if (e.key === 'Escape') { e.preventDefault(); closeDimEdit(false); } e.stopPropagation(); });
  inp.addEventListener('blur', () => closeDimEdit(true));
}
function closeDimEdit(apply) {
  const inp = $('#dimedit'); if (!inp || inp._closing) return; inp._closing = true;
  const m = inp._m, v = parseNum(inp.value); inp.remove();
  if (!apply || !sk || !sk.f.ents[m.i] || !(v > 0) || Math.abs(v - m.v) < 1e-9) { requestRender(); return; }
  onPaletteChange({ dataset: { ent: String(m.i), k: m.k }, value: String(m.map ? m.map(v) : v) });
  requestRender();
}
$('#skdims').addEventListener('pointerdown', e => {
  const h = e.target.closest && e.target.closest('.dhit'); if (!h || !sk) return;
  e.preventDefault(); e.stopPropagation();
  const m = dimMeta[+h.dataset.di]; if (m) openDimEdit(m);
});
let segLabelsOn = false;
/* length and angle labels for the selected polyline */
function updateSegLabels() {
  const box = $('#seglabels');
  const e = sk && sk.f.ents[sk.selEnt];
  /* with dimensions shown, lengths and angles are in the dimensions: no label boxes */
  if (!e || e.t !== 'poly' || sk.tool || showSkDims()) { if (segLabelsOn) { box.innerHTML = ''; segLabelsOn = false; } return; }
  const P = sk.f.plane, n = e.pts.length, segs = e.closed ? n : n - 1, html = [];
  if (segs > 40 && !e.tr) { box.innerHTML = ''; return; }
  const scr = e.pts.map(q => toPx(P3(P, q[0], q[1])));
  for (let k = 0; k < segs; k++) {
    if (isChord(e, k)) continue;
    const a = e.pts[k], b = e.pts[(k + 1) % n], sa = scr[k], sb = scr[(k + 1) % n];
    html.push(`<span class="seg" style="left:${(sa[0] + sb[0]) / 2}px;top:${(sa[1] + sb[1]) / 2}px">${fmtc(Math.hypot(b[0] - a[0], b[1] - a[1]), 2)} mm · ${fmtc(dirAngle(a, b), 1)}°</span>`);
  }
  for (let k = 0; k < n; k++) {
    if ((!e.closed && (k === 0 || k === n - 1)) || isSmoothPt(e, k)) continue;
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
const NARROW = () => window.matchMedia('(max-width: 760px)').matches;
function setPrompt(t) { const p = $('#prompt'); if (p.textContent !== (t || '')) p.classList.remove('min', 'full'); p.textContent = t || ''; p.hidden = !t; }
/* phone: the hint stays out of the way – touching the work area shrinks it to "?", tapping it shows the whole text */
$('#prompt').addEventListener('click', () => { const p = $('#prompt'); if (!NARROW()) return; if (p.classList.contains('min')) { p.classList.remove('min'); p.classList.add('full'); } else p.classList.toggle('full'); });
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
  if (f.type === 'boxpose') return f.state === 'open' ? 'Otevřená krabička' : 'Zavřená krabička';
  let n = 0; for (let j = 0; j <= i; j++) if (doc.features[j].type === f.type) n++;
  return Engine.FEATURE_LABEL[f.type] + ' ' + n;
}
const TL_ICON = { shell: 'shell', hole: 'hole', offsetface: 'pressface', splitface: 'splitface', bendface: 'bendface', splitbody: 'splitbody', center: 'center', scale: 'scale', thread: 'thread', rotate: 'rotate', revolve: 'revolve', mirror: 'mirror', pattern: 'pattern', import: 'import', sketch: 'sketchi', extrude: 'extrude', box: 'box', cylinder: 'cylinder', sphere: 'sphere', cone: 'cone', torus: 'torus', bolt: 'bolt', nut: 'nut', hinge: 'hinge', latch: 'latch', boxpose: 'simulate', fillet: 'fillet', chamfer: 'chamfer', combine: 'combine', move: 'move', del: 'del' };
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
/* compact ribbon: a plain item is [id, label, key]; a menu is { menu, label, items } and opens a drop-down list of items
   (rarely used or related tools); its button shows the tool used last */
const RIBBON = {
  solid: [
    ['Vytvořit', [['sketch', 'Vytvořit skicu', 'S'], ['extrude', 'Vysunutí', 'E'], ['revolve', 'Rotace'], ['thread', 'Závit', 'T'],
      { menu: 'prim', label: 'Základní tělesa', items: [['box', 'Krychle'], ['cylinder', 'Válec'], ['sphere', 'Koule'], ['cone', 'Kužel'], ['torus', 'Torus']] },
      { menu: 'parts', label: 'Součásti', items: [['bolt', 'Šroub'], ['nut', 'Matice'], ['hinge', 'Pant'], ['latch', 'Západka']] }]],
    ['Upravit', [['fillet', 'Zaoblení', 'F'], ['hole', 'Díra', 'H'], ['shell', 'Skořepina'], ['move', 'Přesunout', 'M'], ['rotate', 'Otočit', 'R'], ['facemode', 'Plochy', 'G'],
      { menu: 'shape', label: 'Tvar', items: [['chamfer', 'Zkosení'], ['combine', 'Kombinovat'], ['splitbody', 'Rozříznout']] },
      { menu: 'xform', label: 'Uspořádat', items: [['scale', 'Měřítko'], ['center', 'Zarovnat'], ['mirror', 'Zrcadlit'], ['pattern', 'Pole']] },
      ['del', 'Odstranit', 'Del']]],
    ['Nástroje', [['selall', 'Vybrat vše', 'Ctrl+A'], ['measure', 'Měřit', 'I'], ['simulate', 'Simulace'], ['import', 'Importovat']]]
  ],
  sketch: [
    ['Vytvořit', [['line', 'Čára', 'L'], ['spline', 'Křivka', 'K'], ['rect', 'Obdélník', 'R'], ['circle', 'Kružnice', 'C'], ['sktext', 'Text'],
      { menu: 'skshape', label: 'Další tvary', items: [['ellipse', 'Elipsa', 'E'], ['ngon', 'Mnohoúhelník', 'P'], ['slot', 'Drážka', 'D']] }]],
    ['Upravit', [['sksegtrim', 'Oříznout', 'T'], ['skcons', 'Pomocná', 'Q'], ['skdel', 'Smazat', 'Del'],
      { menu: 'skedit', label: 'Úpravy skici', items: [['skfillet', 'Zaoblit rohy'], ['skoffset', 'Odsadit', 'O'], ['sktrim', 'Kombinovat', 'X'], ['skjoin', 'Spojit', 'J']] }]],
    ['Dokončit', [['skimport', 'DXF / SVG'], ['finish', 'Dokončit skicu', 'Enter']]]
  ]
};
const ribMem = {};
const itemPressed = id => sk ? (SK_TOOLS.includes(id) ? sk.tool === id : id === 'skcons' ? !!sk.consMode : null) : id === 'facemode' ? faceMode : null;
function renderRibbon() {
  const mode = sk ? 'sketch' : 'solid', body = $('#rbody');
  closeRibMenu();
  $('#tab-sketch').hidden = !sk;
  $('#tab-solid').setAttribute('aria-selected', String(!sk));
  $('#tab-sketch').setAttribute('aria-selected', String(!!sk));
  $('#tab-solid').disabled = !!sk;
  const btn = ([id, label, key]) => { const pr = itemPressed(id); return `<button class="tool${id === 'finish' ? ' finish' : ''}" data-cmd="${id}" title="${label}${key ? ' (' + key + ')' : ''}"${pr === null ? '' : ` aria-pressed="${pr}"`}><span class="ico">${svg(id, 24)}</span><span>${label}</span></button>`; };
  body.innerHTML = RIBBON[mode].map(([g, items]) => `<div class="rgroup"><div class="rtools">${items.map(it => {
    if (!it.menu) return btn(it);
    const on = it.items.find(x => itemPressed(x[0])), shown = on || it.items.find(x => x[0] === ribMem[it.menu]) || it.items[0];
    return `<button class="tool tmenu" data-menu="${it.menu}" aria-haspopup="true" aria-expanded="false" title="${it.label}"${on ? ' aria-pressed="true"' : ''}><span class="ico">${svg(shown[0], 24)}</span><span>${it.label}<i class="caret" aria-hidden="true"></i></span></button>`;
  }).join('')}</div><div class="rlabel">${g}</div></div>`).join('');
}
function closeRibMenu() { const m = document.getElementById('ribmenu'); if (m) m.remove(); document.querySelectorAll('#rbody [data-menu][aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false')); }
function openRibMenu(btn) {
  const was = btn.getAttribute('aria-expanded') === 'true';
  closeRibMenu(); if (was) return;
  const def = RIBBON[sk ? 'sketch' : 'solid'].flatMap(g => g[1]).find(x => x.menu === btn.dataset.menu); if (!def) return;
  const m = document.createElement('div'); m.id = 'ribmenu'; m.className = 'ribmenu'; m.setAttribute('role', 'menu');
  m.innerHTML = def.items.map(([id, label, key]) => { const pr = itemPressed(id); return `<button role="menuitem" data-cmd="${id}"${pr ? ' aria-pressed="true"' : ''}><span class="ico">${svg(id, 22)}</span><span class="lbl">${label}</span>${key ? `<kbd>${key}</kbd>` : ''}</button>`; }).join('');
  m.addEventListener('click', e => { const b = e.target.closest('[data-cmd]'); if (!b) return; ribMem[def.menu] = b.dataset.cmd; closeRibMenu(); runCommand(b.dataset.cmd); renderRibbon(); });
  document.body.append(m);
  const r = btn.getBoundingClientRect();
  m.style.left = Math.max(8, Math.min(r.left, window.innerWidth - m.offsetWidth - 8)) + 'px';
  m.style.top = r.bottom + 2 + 'px';
  btn.setAttribute('aria-expanded', 'true');
}
document.addEventListener('pointerdown', e => { if (!e.target.closest || e.target.closest('#ribmenu, [data-menu]')) return; closeRibMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRibMenu(); });
$('#rbody').addEventListener('click', e => { const mb = e.target.closest('[data-menu]'); if (mb) { openRibMenu(mb); return; } });
$('#rbody').addEventListener('click', e => { const b = e.target.closest('[data-cmd]'); if (b) runCommand(b.dataset.cmd); });
const SK_TOOLS = ['line', 'spline', 'rect', 'circle', 'ellipse', 'ngon', 'slot', 'skfillet', 'skoffset', 'sktext', 'sktrim', 'sksegtrim', 'skjoin'];
function runCommand(id) {
  $('#ctxmenu').hidden = true;
  if (sk) {
    if (id === 'finish') finishSketch(true);
    else if (id === 'skdel') deleteSketchEntity();
    else if (id === 'skcons') toggleCons();
    else if (SK_TOOLS.includes(id)) setSketchTool(sk.tool === id ? null : id);
    else if (id === 'skimport') pickImportFile('.dxf,.svg');
    return;
  }
  if (cmd) endCmd(false);
  switch (id) {
    case 'sketch': startSketchCmd(); break;
    case 'extrude': startExtrude(); break;
    case 'box': case 'cylinder': case 'sphere': case 'cone': case 'torus': startPrimitive(id); break;
    case 'bolt': case 'nut': startFastener(id); break;
    case 'hinge': startHinge(); break;
    case 'latch': startLatch(); break;
    case 'fillet': case 'chamfer': startEdgeMod(id); break;
    case 'combine': startCombine(); break;
    case 'hole': startHole(); break;
    case 'shell': startShell(); break;
    case 'splitbody': startSplitBody(); break;
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
    case 'simulate': startSimulate(); break;
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
      case 'num': return `<div class="frow" data-row="${f.id}"><label for="${id}">${f.label}</label><span class="fnum"><input id="${id}" data-f="${f.id}" inputmode="decimal" autocomplete="off"><span class="u">${f.unit || 'mm'}</span></span></div>`
        + (f.range ? `<div class="frow frange-row" data-row="${f.id}-r"><input type="range" class="frange" id="${id}-r" data-f="${f.id}" data-range="1" min="${f.range[0]}" max="${f.range[1]}" step="${f.range[2] || 1}" aria-label="${f.label}"></div>` : '');
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
      if (f.k === 'num') { const el2 = $('#dlg-' + id); if (document.activeElement !== el2) el2.value = fmtc(v, 3); const r = $('#dlg-' + id + '-r'); if (r && document.activeElement !== r && isFinite(v)) r.value = String(v); }
      else if (f.k === 'xyz') v.forEach((x, j) => { const el2 = $(`#dlg-${id}-${j}`); if (document.activeElement !== el2) el2.value = fmtc(x, 3); });
      else if (f.k === 'opt') $('#dlg-' + id).value = v;
      else if (f.k === 'chk') $('#dlg-' + id).checked = !!v;
      else if (f.k === 'seg') $$(`#dlg-${id} button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      else if (f.k === 'note') { const n = $('#dlg-' + id); n.textContent = v || ''; n.classList.toggle('err', !!(v && v.startsWith('!'))); if (v && v.startsWith('!')) n.textContent = v.slice(1); }
      else if (f.k === 'sel') { const b = $('#dlg-' + id); $('.tx', b).textContent = v.text; b.classList.toggle('has', !!v.has); b.classList.toggle('active', !!v.active); }
    },
    okEnabled(on) { $('[data-act="ok"]', el).disabled = !on; },
    setOptions(id, options, value) { const sel = $('#dlg-' + id); sel.innerHTML = options.map(([v, l]) => `<option value="${v}">${l}</option>`).join(''); if (value !== undefined) sel.value = String(value); },
    show(id, on) { const r = $(`#dialog [data-row="${id}"]`); if (r) r.hidden = !on; const r2 = $(`#dialog [data-row="${id}-r"]`); if (r2) r2.hidden = !on; },
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
/* a slider under a number field writes its value into the field (the field stays the source of the value) */
const syncRange = t => { if (t && t.dataset && t.dataset.range) { const n = $('#dlg-' + t.dataset.f); if (n) n.value = fmtc(parseFloat(t.value), 3); } };
$('#dialog').addEventListener('input', e => { syncRange(e.target); const f = e.target.dataset && e.target.dataset.f; if (f && dlg && dlg.spec.onChange && e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT') dlg.spec.onChange(f, true); });
$('#dialog').addEventListener('change', e => {
  syncRange(e.target);
  const f = e.target.dataset && e.target.dataset.f; if (f && dlg && dlg.spec.onChange) dlg.spec.onChange(f);
  if (sk && e.target.dataset.ent) onPaletteChange(e.target);
  if (sk && e.target.id === 'pal-ngon') { const v = Math.round(parseNum(e.target.value)); if (v >= 3 && v <= 64) sk.ngonN = v; e.target.value = sk.ngonN; redrawSketch(); }
  if (sk && e.target.id === 'pal-dims') { settings.skDims = e.target.checked; saveSettings(); requestRender(); }
  if (sk && e.target.id === 'pal-offd') { const v = parseNum(e.target.value); if (v > 0) sk.offD = v; e.target.value = fmtc(sk.offD, 3); }
  if (sk && e.target.id === 'pal-txt') { const t = e.target.value.trim(); if (t) sk.txt.s = t.slice(0, 200); e.target.value = sk.txt.s; redrawSketch(); }
  if (sk && e.target.id === 'pal-txth') { const v = parseNum(e.target.value); if (v > 0) sk.txt.h = Math.min(1000, v); e.target.value = fmtc(sk.txt.h, 3); redrawSketch(); }
  if (sk && e.target.id === 'pal-txtb') { sk.txt.bold = e.target.checked; redrawSketch(); }
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
  if (c.cleanup) c.cleanup(applied);
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
    case 'bolt': case 'nut': startFastener(f.type, i, ef); break;
    case 'hinge': startHinge(i, ef); break;
    case 'latch': startLatch(i, ef); break;
    case 'boxpose': startSimulate(i, ef); break;
    case 'fillet': case 'chamfer': startEdgeMod(f.type, i, ef); break;
    case 'combine': startCombine(i, ef); break;
    case 'move': startMove(i, ef); break;
    case 'rotate': startRotate(i, ef); break;
    case 'thread': startThread(i, ef); break;
    case 'scale': startScale(i, ef); break;
    case 'center': startCenter(i, ef); break;
    case 'offsetface': startPressFace(i, ef); break;
    case 'hole': startHole(i, ef); break;
    case 'shell': startShell(i, ef); break;
    case 'splitface': startSplitFace(i, ef); break;
    case 'bendface': startBendFace(i, ef); break;
    case 'splitbody': startSplitBody(i, ef); break;
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
        const cen = poly.v.reduce((a, v) => K.vadd(a, K.vmul(v, 1 / poly.v.length)), [0, 0, 0]), g = K.planarFace(polys, poly.n, poly.w, cen);
        return { face: true, plane: facePlane(poly.n, poly.w, g ? g.map(i => polys[i]) : [poly]), polys, key: planeKey(poly) };
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
  sk = { f, editIndex, tool: null, draft: null, selEnt: -1, cursor: null, snapPt: null, ngonN: 6, frR: 2, offD: 2, offIn: false, txt: { s: 'Text', h: 10, bold: true } };
  if (!f.ents) f.ents = [];
  sk.hist = []; sk.fut = []; sk.lastJSON = JSON.stringify(f.ents);
  /* a sketch taken from a face is resized uniformly by default (its outline keeps its shape) */
  if (f.orig) sk.uniform = true;
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
  /* the grid is drawn over everything (depthTest off): on a face of a body it would otherwise fight with the face and flicker or vanish when zooming */
  const g1 = noRay(new THREE.LineSegments(lineGeo(mi), new THREE.LineBasicMaterial({ color: tok.grid, transparent: true, opacity: 0.8, depthWrite: false, depthTest: false })));
  const g2 = noRay(new THREE.LineSegments(lineGeo(ma), new THREE.LineBasicMaterial({ color: tok['grid-major'], transparent: true, opacity: 0.9, depthWrite: false, depthTest: false })));
  g1.renderOrder = g2.renderOrder = -2;
  /* 1 mm lines, shown only when zoomed in far enough (see render) */
  const fl = [];
  for (let i = -ext; i <= ext; i += 1) { if (i % step === 0) continue; const a = P3(P, i, -ext, 0), b = P3(P, i, ext, 0), c = P3(P, -ext, i, 0), d = P3(P, ext, i, 0); fl.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z); }
  const gf = noRay(new THREE.LineSegments(lineGeo(fl), new THREE.LineBasicMaterial({ color: tok.grid, transparent: true, opacity: 0.45, depthWrite: false, depthTest: false })));
  gf.name = 'fine'; gf.renderOrder = -3; gf.visible = false;
  const ax1 = P3(P, -ext, 0, -0.005), ax2 = P3(P, ext, 0, -0.005), ay1 = P3(P, 0, -ext, -0.005), ay2 = P3(P, 0, ext, -0.005);
  const axU = noRay(new THREE.Line(lineGeo([ax1.x, ax1.y, ax1.z, ax2.x, ax2.y, ax2.z]), new THREE.LineBasicMaterial({ color: 0xe5484d, transparent: true, opacity: 0.6, depthTest: false })));
  const axV = noRay(new THREE.Line(lineGeo([ay1.x, ay1.y, ay1.z, ay2.x, ay2.y, ay2.z]), new THREE.LineBasicMaterial({ color: 0x2f9e6a, transparent: true, opacity: 0.6, depthTest: false })));
  const work = new THREE.Group(); work.name = 'grid'; work.add(gf, g1, g2, axU, axV);
  G.skwork.add(work);
  const live = new THREE.Group(); live.name = 'live'; G.skwork.add(live);
}
function redrawSketch() {
  if (!sk) return;
  const live = G.skwork.getObjectByName('live'); clearGroup(live);
  const P = sk.f.plane, ents = sk.f.ents;
  /* profile fills */
  for (const r of Engine.regions(sk.f)) live.add(regionMesh(P, r, tok.orange, 0.2, 0.01));
  if (sk.f.orig) { const g = sketchLines(P, sk.f.orig.map(e => ({ ...e, cons: true })), new THREE.Color(0x8a94a0), 0.02); live.add(g); }
  live.add(sketchLines(P, ents, tok.sketch, 0.04));
  if (sk.selEnt >= 0 && ents[sk.selEnt]) live.add(sketchLines(P, [ents[sk.selEnt]], tok.orange, 0.06));
  live.add(pointsObj(P, keyPoints(ents).slice(1), tok.sketch, 5));
  const d = draftEntity();
  if (d) { if (sk.consMode) d.cons = true; live.add(sketchLines(P, [d], tok.orange, 0.07)); }
  if (sk.offHover && sk.tool === 'skoffset') live.add(sketchLines(P, [{ ...sk.offHover, cons: true }], tok.accent, 0.08));
  if (sk.segHover && sk.tool === 'sksegtrim') { const g = sketchLines(P, [{ t: 'poly', pts: sk.segHover, closed: false, cons: true }], tok.danger, 0.08); live.add(g); }
  if (sk.draft && isPolyTool(sk.tool)) live.add(pointsObj(P, sk.draft.pts, tok.orange, 6));
  const se = ents[sk.selEnt];
  if (se && (se.t === 'spline' || se.t === 'poly') && !sk.tool) live.add(pointsObj(P, se.pts.filter((q, j) => !isSmoothPt(se, j)), tok.orange, 9));
  if (!sk.tool) ents.forEach((e, i) => { if (e.t !== 'poly' && e.t !== 'spline' && (i === sk.selEnt || (e.t === 'circle' && sk.f.orig))) live.add(pointsObj(P, shapeHandles(e).map(h => h.p), tok.orange, 9)); });
  for (const e of ents) if (e.t === 'spline' && e !== se) live.add(pointsObj(P, e.pts, tok.sketch, 7));
  updateUndo();
  if (sk.snapPt) live.add(sk.snapMid ? midMarker(P, sk.snapPt, tok.accent) : pointsObj(P, [sk.snapPt], tok.accent, 10));
  if (sk.hoverMid && !sk.tool) live.add(midMarker(P, sk.hoverMid, tok.accent));
  if (sk.gridHot && !sk.snapPt) live.add(crossMarker(P, sk.gridHot));
  /* the sketch grid is drawn without depth test in the transparent pass (so a body face cannot hide it);
     sketch lines and points must therefore come after it in that pass, or the grid would paint over them */
  live.traverse(o => { if (o.isLine || o.isPoints) { o.material.transparent = true; o.renderOrder = Math.max(o.renderOrder, 6); } });
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
  if (sk && sk.tool === 'sktext' && sk.cursor && sk.txt) return { t: 'text', s: sk.txt.s, x: sk.cursor[0], y: sk.cursor[1], h: sk.txt.h, bold: sk.txt.bold, a: 0 };
  if (!sk || !sk.draft || !sk.cursor) return null;
  const c = sk.cursor, d = sk.draft;
  /* line and curve drafts keep a point list (pts) instead of a first point (p) */
  if (!d.p) return sk.tool === 'line' ? { t: 'poly', pts: d.pts.concat([c]), closed: false } : sk.tool === 'spline' ? { t: 'spline', pts: d.pts.concat([c]), closed: false } : null;
  const dx = c[0] - d.p[0], dy = c[1] - d.p[1], corner = drawMode(sk.tool) === 'corner';
  /* "from corner": the shape fills the box between the two clicks (circle and polygon use a square anchored at the first click) */
  /* with grid snapping on, radii and widths measured from a centre snap to the step too (unless the cursor sits on an existing point) */
  const sr = r => (settings.gridSnap && !sk.snapPt ? Math.max(settings.snap, Math.round(r / settings.snap) * settings.snap) : r);
  const sq = () => { const sd = Math.max(Math.abs(dx), Math.abs(dy)); return { cx: d.p[0] + Math.sign(dx || 1) * sd / 2, cy: d.p[1] + Math.sign(dy || 1) * sd / 2, r: sd / 2 }; };
  if (sk.tool === 'rect') return corner ? { t: 'rect', x: d.p[0], y: d.p[1], w: dx, h: dy } : { t: 'rect', x: d.p[0] - dx, y: d.p[1] - dy, w: 2 * dx, h: 2 * dy };
  if (sk.tool === 'circle') { if (corner) { const q = sq(); return { t: 'circle', x: q.cx, y: q.cy, r: q.r }; } return { t: 'circle', x: d.p[0], y: d.p[1], r: sr(Math.hypot(dx, dy)) }; }
  if (corner && sk.tool === 'ngon') { const q = sq(); return { t: 'ngon', x: q.cx, y: q.cy, r: q.r, n: sk.ngonN, a: 90 }; }
  /* ellipse: two clicks, the box it fits in (from a corner or from the centre); a flat box gets half the other axis */
  const eFix = (rx, ry) => (rx < 1e-3 && ry < 1e-3 ? [rx, ry] : rx < 1e-3 ? [ry / 2, ry] : ry < 1e-3 ? [rx, rx / 2] : [rx, ry]);
  if (corner && sk.tool === 'ellipse') { const [rx, ry] = eFix(Math.abs(dx) / 2, Math.abs(dy) / 2); return { t: 'ellipse', x: d.p[0] + dx / 2, y: d.p[1] + dy / 2, rx, ry, a: 0 }; }
  if (corner && sk.tool === 'slot') {
    const W = Math.abs(dx), H = Math.abs(dy), cx = d.p[0] + dx / 2, cy = d.p[1] + dy / 2;
    if (W >= H) { const w = Math.max(0.01, H), hl = Math.max(0.005, (W - w) / 2); return { t: 'slot', x1: cx - hl, y1: cy, x2: cx + hl, y2: cy, w }; }
    const w = Math.max(0.01, W), hl = Math.max(0.005, (H - w) / 2); return { t: 'slot', x1: cx, y1: cy - hl, x2: cx, y2: cy + hl, w };
  }
  if (sk.tool === 'line') return { t: 'poly', pts: d.pts.concat([c]), closed: false };
  if (sk.tool === 'spline') return { t: 'spline', pts: d.pts.concat([c]), closed: false };
  if (sk.tool === 'ngon') return { t: 'ngon', x: d.p[0], y: d.p[1], r: sr(Math.hypot(c[0] - d.p[0], c[1] - d.p[1])), n: sk.ngonN, a: Math.atan2(c[1] - d.p[1], c[0] - d.p[0]) / D2R };
  if (sk.tool === 'ellipse') { const [rx, ry] = eFix(Math.abs(dx), Math.abs(dy)); return { t: 'ellipse', x: d.p[0], y: d.p[1], rx, ry, a: 0 }; }
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
const DRAW_DEFAULT = { rect: 'corner', circle: 'center', ellipse: 'center', ngon: 'center', slot: 'center', spline: 'points' };
const isDrawTool = t => ['rect', 'circle', 'ellipse', 'ngon', 'slot', 'line', 'spline'].includes(t);
const isFreehand = () => sk && sk.tool === 'spline' && drawMode('spline') === 'free';
const drawMode = t => ((settings.drawModes || {})[t] || DRAW_DEFAULT[t]);
function slotHalfWidth(a, b, c) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  if (L < 1e-9) return Math.hypot(c[0] - a[0], c[1] - a[1]);
  return Math.abs((c[0] - a[0]) * dy - (c[1] - a[1]) * dx) / L;
}
function setSketchTool(t) {
  if (!sk) return;
  sk.tool = t; sk.draft = null; sk.cut = null; sk.joinA = null; sk.segHover = null; sk.offHover = null;
  const PROMPTS = {
    rect: drawMode('rect') === 'center' ? 'Obdélník ze středu: klepněte na střed, pak na roh' : 'Obdélník: klepněte na první roh, pak na protější roh',
    circle: drawMode('circle') === 'corner' ? 'Kružnice z rohu: klepněte na roh čtverce, do kterého se kružnice vepíše, pak na protější roh' : 'Kružnice: klepněte na střed, pak určete poloměr',
    line: 'Čára: klepejte na body nebo táhněte úseky; klepnutím na první bod obrys uzavřete, dvojím klepnutím nebo Enter ukončíte',
    spline: drawMode('spline') === 'free' ? 'Křivka od ruky: táhněte prstem nebo myší, po puštění se tah převede na hladkou křivku. Když skončíte u začátku, křivka se uzavře.' : 'Křivka: klepejte nebo táhněte na body, kterými má křivka projít; klepnutím na první bod ji uzavřete, dvojím klepnutím nebo Enter ukončíte. Body pak jde přetáhnout.',
    ngon: drawMode('ngon') === 'corner' ? 'Mnohoúhelník z rohu: klepněte na roh čtverce, do kterého se vepíše, pak na protější roh. Počet stran nastavíte v paletě.' : 'Mnohoúhelník: klepněte na střed, pak na vrchol. Počet stran nastavíte v paletě.',
    slot: drawMode('slot') === 'corner' ? 'Drážka z rohu: klepněte na roh, pak na protější roh obdélníku, do kterého se drážka vejde' : 'Drážka: klepněte na jeden konec, pak na druhý konec drážky (celková délka), třetím klepnutím určíte šířku',
    ellipse: drawMode('ellipse') === 'corner' ? 'Elipsa z rohu: klepněte na roh, pak na protější roh obdélníku, do kterého se elipsa vepíše' : 'Elipsa ze středu: klepněte na střed, pak na roh obdélníku, do kterého se elipsa vepíše. Natočení nastavíte v paletě.',
    skfillet: 'Zaoblení rohů: nastavte poloměr v paletě a klepněte na obdélník, mnohoúhelník nebo uzavřený obrys',
    sktrim: COMB_PROMPT1[combOp()],
    skjoin: JOIN_PROMPT1,
    skoffset: 'Odsadit: nastavte vzdálenost a směr v paletě a klepněte na obrys, vedle vznikne odsazená kopie',
    sktext: 'Text: napište text a výšku písma v paletě, pak klepněte na místo, kde má text začínat (levý konec účaří)',
    sksegtrim: 'Oříznout: klepněte na úsek čáry mezi průsečíky, úsek se odstraní a navazující čáry se spojí do jednoho obrysu'
  };
  setPrompt(PROMPTS[t] || 'Klepnutím vyberte prvek skici, tažením ho přesunete. Nástroje kreslení jsou v pásu nahoře.');
  dom.style.cursor = t && t !== 'skfillet' && t !== 'skoffset' && t !== 'sktrim' && t !== 'sksegtrim' && t !== 'skjoin' ? 'crosshair' : '';
  renderRibbon(); redrawSketch(); renderPalette(); $('#dim').hidden = true;
}
/* freehand curve: the sampled stroke is thinned (Douglas–Peucker) to a few through-points of a smooth spline */
function finishFreehand() { const n0 = sk ? sk.f.ents.length : 0; finishFreehand0(); markCons(n0); }
function finishFreehand0() {
  if (!sk || !sk.draft) return;
  const raw = sk.draft.pts; sk.draft = null; sk.cursor = null;
  if (raw.length >= 2) {
    const P = sk.f.plane, wpp = worldPerPx(P3(P, raw[0][0], raw[0][1]));
    const dp = (pts, tol) => {
      if (pts.length < 3) return pts.slice();
      const a = pts[0], b = pts[pts.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      let im = -1, dm = 0;
      for (let i = 1; i < pts.length - 1; i++) { const q = pts[i]; const d = L < 1e-9 ? Math.hypot(q[0] - a[0], q[1] - a[1]) : Math.abs((q[0] - a[0]) * dy - (q[1] - a[1]) * dx) / L; if (d > dm) { dm = d; im = i; } }
      if (dm <= tol) return [a, b];
      const l = dp(pts.slice(0, im + 1), tol), r = dp(pts.slice(im), tol); return l.slice(0, -1).concat(r);
    };
    const len = raw.reduce((s, q, i) => i ? s + Math.hypot(q[0] - raw[i - 1][0], q[1] - raw[i - 1][1]) : 0, 0);
    if (len > wpp * 10) {
      const closed = raw.length > 6 && Math.hypot(raw[0][0] - raw[raw.length - 1][0], raw[0][1] - raw[raw.length - 1][1]) < wpp * 18;
      let tol = wpp * 3, pts = dp(raw, tol);
      while (pts.length > 40) { tol *= 1.5; pts = dp(raw, tol); }
      if (closed && pts.length > 3) pts.pop();
      pts = pts.map(q => [Math.round(q[0] * 100) / 100, Math.round(q[1] * 100) / 100]);
      if (pts.length >= 2) { sk.f.ents.push({ t: 'spline', pts, closed: closed && pts.length >= 3 }); sk.selEnt = sk.f.ents.length - 1; }
    }
  }
  renderPalette(); redrawSketch(); $('#dim').hidden = true;
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
  let best = null, bd = TOUCH ? 16 : 10;
  const pts = keyPoints(sk.f.ents).concat(sk.draft && isPolyTool(sk.tool) ? sk.draft.pts : []).concat(sk.draft && sk.draft.p ? [sk.draft.p] : []).concat(sk.draft && sk.draft.p2 ? [sk.draft.p2] : []);
  for (const q of pts) { const s = toPx(P3(P, q[0], q[1])); const d = Math.hypot(s[0] - mx, s[1] - my); if (d < bd) { bd = d; best = q; } }
  sk.snapMid = false;
  if (!best) { const m = nearMidpoint(ev, bd); if (m) { best = m; sk.snapMid = true; } }
  sk.snapPt = best;
  if (best) { sk.gridHot = null; return best.slice(); }
  const c = crossNear(p); if (c) { sk.gridHot = c; return c; }
  const q = [snapV(p[0]), snapV(p[1])]; sk.gridHot = onCross(q) ? q : null;
  return q;
}
/* size handles of the closed shapes (shown on the selected shape): key k → point in the sketch */
function shapeHandles(e) {
  const H = [];
  if (e.t === 'circle') H.push({ k: 'r', p: [e.x + e.r, e.y] });
  else if (e.t === 'rect') {
    const x0 = e.x, y0 = e.y, x1 = e.x + e.w, y1 = e.y + e.h, xm = e.x + e.w / 2, ym = e.y + e.h / 2;
    H.push({ k: 'c00', p: [x0, y0] }, { k: 'c10', p: [x1, y0] }, { k: 'c11', p: [x1, y1] }, { k: 'c01', p: [x0, y1] },
      { k: 'e0', p: [xm, y0] }, { k: 'e1', p: [x1, ym] }, { k: 'e2', p: [xm, y1] }, { k: 'e3', p: [x0, ym] });
  }
  else if (e.t === 'ngon') { const a = (e.a || 0) * D2R; H.push({ k: 'r', p: [e.x + e.r * Math.cos(a), e.y + e.r * Math.sin(a)] }); }
  else if (e.t === 'ellipse') { const a = (e.a || 0) * D2R, c = Math.cos(a), s = Math.sin(a); H.push({ k: 'rx', p: [e.x + e.rx * c, e.y + e.rx * s] }, { k: 'ry', p: [e.x - e.ry * s, e.y + e.ry * c] }); }
  else if (e.t === 'slot') {
    const dx = e.x2 - e.x1, dy = e.y2 - e.y1, L = Math.hypot(dx, dy) || 1e-9, ux = dx / L, uy = dy / L, h = e.w / 2;
    H.push({ k: 's1', p: [e.x1 - ux * h, e.y1 - uy * h] }, { k: 's2', p: [e.x2 + ux * h, e.y2 + uy * h] }, { k: 'w', p: [(e.x1 + e.x2) / 2 - uy * h, (e.y1 + e.y2) / 2 + ux * h] });
  }
  return H;
}
/* drag of a size handle: o = the shape before the drag, p = pointer in the sketch; returns the new shape and a label */
function applyShapeHandle(o, k, p, keep) {
  const r4 = v => Math.round(v * 1e4) / 1e4;
  /* lengths measured from a centre: whole grid steps (diameters / widths in steps), otherwise 0.001 mm */
  const len = (v, two) => settings.gridSnap ? Math.max(settings.snap, Math.round((two ? 2 : 1) * v / settings.snap) * settings.snap) / (two ? 2 : 1) : Math.max(0.01, Math.round(v * 1000) / 1000);
  const e = clone(o);
  if (o.t === 'circle') { e.r = len(Math.hypot(p[0] - o.x, p[1] - o.y), true); return [e, `Ø ${fmtc(2 * e.r, 2)} mm`]; }
  if (o.t === 'ngon') { const a = (o.a || 0) * D2R, d = (p[0] - o.x) * Math.cos(a) + (p[1] - o.y) * Math.sin(a); e.r = len(Math.max(0.01, d)); return [e, `R ${fmtc(e.r, 2)} mm · ${EN() ? 'across flats' : 'otvor klíče'} ${fmtc(2 * e.r * Math.cos(Math.PI / o.n), 2)} mm`]; }
  if (o.t === 'ellipse') {
    const a = (o.a || 0) * D2R, c = Math.cos(a), s = Math.sin(a), qx = p[0] - o.x, qy = p[1] - o.y;
    if (k === 'rx') e.rx = len(Math.abs(qx * c + qy * s), true); else e.ry = len(Math.abs(-qx * s + qy * c), true);
    if (keep && o.rx > 1e-9 && o.ry > 1e-9) { if (k === 'rx') e.ry = r4(o.ry * e.rx / o.rx); else e.rx = r4(o.rx * e.ry / o.ry); } /* Ctrl: keep the proportions */
    return [e, `${fmtc(2 * e.rx, 2)} × ${fmtc(2 * e.ry, 2)} mm`];
  }
  if (o.t === 'rect') {
    const q = crossNear(p) || [snapV(p[0]), snapV(p[1])];
    let x0 = o.x, y0 = o.y, x1 = o.x + o.w, y1 = o.y + o.h;
    if (k[0] === 'c') { if (k[1] === '0') x0 = q[0]; else x1 = q[0]; if (k[2] === '0') y0 = q[1]; else y1 = q[1]; }
    else if (k === 'e0') y0 = q[1]; else if (k === 'e2') y1 = q[1]; else if (k === 'e1') x1 = q[0]; else if (k === 'e3') x0 = q[0];
    /* Ctrl on a corner: keep the proportions (the opposite corner stays) */
    if (keep && k[0] === 'c' && Math.abs(o.w) > 1e-9 && Math.abs(o.h) > 1e-9) {
      const ax = k[1] === '0' ? o.x + o.w : o.x, ay = k[2] === '0' ? o.y + o.h : o.y, mx = k[1] === '0' ? o.x : o.x + o.w, my = k[2] === '0' ? o.y : o.y + o.h;
      const fx = ((k[1] === '0' ? x0 : x1) - ax) / (mx - ax), fy = ((k[2] === '0' ? y0 : y1) - ay) / (my - ay), f = Math.abs(fx) > Math.abs(fy) ? fx : fy;
      const nx = ax + (mx - ax) * f, ny = ay + (my - ay) * f;
      if (k[1] === '0') x0 = nx; else x1 = nx; if (k[2] === '0') y0 = ny; else y1 = ny;
    }
    if (Math.abs(x1 - x0) < 0.01) x1 = x0 + (x1 >= x0 ? 0.01 : -0.01);
    if (Math.abs(y1 - y0) < 0.01) y1 = y0 + (y1 >= y0 ? 0.01 : -0.01);
    Object.assign(e, { x: r4(x0), y: r4(y0), w: r4(x1 - x0), h: r4(y1 - y0) });
    return [e, `${fmtc(Math.abs(e.w), 2)} × ${fmtc(Math.abs(e.h), 2)} mm`];
  }
  if (o.t === 'slot') {
    const dx = o.x2 - o.x1, dy = o.y2 - o.y1, L = Math.hypot(dx, dy) || 1e-9, ux = dx / L, uy = dy / L, h = o.w / 2;
    if (k === 'w') {
      const mx = (o.x1 + o.x2) / 2, my = (o.y1 + o.y2) / 2;
      e.w = len(2 * Math.abs(-(p[0] - mx) * uy + (p[1] - my) * ux));
    } else {
      /* one outer end follows the pointer along the slot axis, the other end stays */
      const fx = k === 's1' ? o.x2 + ux * h : o.x1 - ux * h, fy = k === 's1' ? o.y2 + uy * h : o.y1 - uy * h, sg = k === 's1' ? -1 : 1;
      const Lt = Math.max(o.w + 0.01, len(sg * ((p[0] - fx) * ux + (p[1] - fy) * uy)));
      const ex = fx + sg * ux * Lt, ey = fy + sg * uy * Lt, a1 = [ex - sg * ux * h, ey - sg * uy * h], a2 = [fx + sg * ux * h, fy + sg * uy * h];
      if (k === 's1') { e.x1 = r4(a1[0]); e.y1 = r4(a1[1]); e.x2 = r4(a2[0]); e.y2 = r4(a2[1]); } else { e.x2 = r4(a1[0]); e.y2 = r4(a1[1]); e.x1 = r4(a2[0]); e.y1 = r4(a2[1]); }
    }
    const Lo = Math.hypot(e.x2 - e.x1, e.y2 - e.y1) + e.w;
    return [e, `${fmtc(Lo, 2)} × ${fmtc(e.w, 2)} mm`];
  }
  return [e, ''];
}
/* draggable points: vertices of polylines and curves, size handles of the selected shape */
function sketchHandleAt(ev) {
  const [mx, my] = evPx(ev), P = sk.f.plane;
  let best = null, bd = 10;
  sk.f.ents.forEach((e, ei) => {
    /* a circle has a radius handle on its right-hand side (in a face sketch always, otherwise when selected) */
    if (e.t !== 'spline' && e.t !== 'poly') {
      if (ei !== sk.selEnt && !(e.t === 'circle' && sk.f.orig)) return;
      shapeHandles(e).forEach(h => { const s = toPx(P3(P, h.p[0], h.p[1])); const d = Math.hypot(s[0] - mx, s[1] - my); if (d < bd) { bd = d; best = { ei, shape: h.k }; } });
      return;
    }
    if (e.t === 'poly' && ei !== sk.selEnt) return;
    e.pts.forEach((q, pi) => { if (isSmoothPt(e, pi)) return; const s = toPx(P3(P, q[0], q[1])); const d = Math.hypot(s[0] - mx, s[1] - my); if (d < bd) { bd = d; best = { ei, pi }; } });
  });
  return best;
}
function sketchDrag(ev) {
  if (sk.drag.move) {
    if (!down || !down.moved) return;
    const d = sk.drag, p = sketchRawPoint(ev); if (!p) return;
    let dx = snapV(p[0] - d.p0[0]), dy = snapV(p[1] - d.p0[1]);
    if (ev.shiftKey) { if (Math.abs(dx) >= Math.abs(dy)) dy = 0; else dx = 0; } /* Shift: move along one axis only */
    /* the element's first key point (corner, centre or first point) is pulled onto a nearby grid crossing */
    const k0 = keyPoints([d.orig])[1];
    if (k0 && !ev.shiftKey) { const kp = [k0[0] + dx, k0[1] + dy], c = crossNear(kp); if (c) { dx += c[0] - kp[0]; dy += c[1] - kp[1]; sk.gridHot = c; } else sk.gridHot = onCross(kp) ? kp : null; }
    sk.f.ents[d.ei] = translateEnt(d.orig, dx, dy);
    if (sk.f.ents[d.ei].pts) sk.f.ents[d.ei].pts = sk.f.ents[d.ei].pts.map(q => [Math.round(q[0] * 1e4) / 1e4, Math.round(q[1] * 1e4) / 1e4]);
    const el = $('#dim'), px = evPx(ev); el.textContent = `${EN() ? 'Move' : 'Posun'} X ${fmtc(dx, 2)} · Y ${fmtc(dy, 2)} mm`; el.hidden = false; el.style.left = px[0] + 'px'; el.style.top = px[1] + 'px';
    redrawSketch(); return;
  }
  const P = sk.f.plane, e = sk.f.ents[sk.drag.ei]; if (!e) return;
  if (sk.drag.shape) {
    const p = sketchRawPoint(ev); if (!p) return;
    if (!sk.drag.orig) sk.drag.orig = clone(e);
    const [ne, label] = applyShapeHandle(sk.drag.orig, sk.drag.shape, p, ev.ctrlKey || ev.metaKey);
    sk.f.ents[sk.drag.ei] = ne;
    if (ne.t !== 'rect') sk.gridHot = null;
    const el = $('#dim'), px = evPx(ev); el.textContent = label; el.hidden = !label || showSkDims(); /* with dimensions shown the new size is in them */ el.style.left = px[0] + 'px'; el.style.top = px[1] + 'px';
    redrawSketch(); return;
  }
  ray.setFromCamera(evNdc(ev), cam());
  const hit = ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(v3(P.n), v3(P.o)), new V3());
  if (!hit) return;
  const p = P2(P, hit);
  if ((sk.uniform || ev.ctrlKey || ev.metaKey) && e.pts.length >= 2) {
    const d = sk.drag;
    if (!d.orig) { d.orig = e.pts.map(q => q.slice()); d.c = [0, 1].map(k => d.orig.reduce((t, q) => t + q[k], 0) / d.orig.length); }
    const c = d.c, o = d.orig[d.pi], ov = [o[0] - c[0], o[1] - c[1]], l2 = ov[0] * ov[0] + ov[1] * ov[1];
    if (l2 < 1e-12) return;
    let fct = Math.max(0.01, Math.round(((p[0] - c[0]) * ov[0] + (p[1] - c[1]) * ov[1]) / l2 * 100) / 100);
    const r4 = x => Math.round(x * 1e4) / 1e4, bw = q => { const xs = q.map(t => t[0]), ys = q.map(t => t[1]); return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; };
    /* with grid snapping the larger side of the outline grows in whole steps */
    const [w0, h0] = bw(d.orig), big = Math.max(w0, h0);
    if (settings.gridSnap && big > 1e-6) { const st = settings.snap; fct = Math.max(st, Math.round(big * fct / st) * st) / big; }
    e.pts = d.orig.map(q => [r4(c[0] + (q[0] - c[0]) * fct), r4(c[1] + (q[1] - c[1]) * fct)]);
    const el = $('#dim'), px = evPx(ev); el.textContent = `Velikost ${fmtc(fct * 100, 0)} % · ${fmtc(w0 * fct, 2)} × ${fmtc(h0 * fct, 2)} mm`; el.hidden = false; el.style.left = px[0] + 'px'; el.style.top = px[1] + 'px';
  } else {
    const d = sk.drag; if (!d.p0pt) d.p0pt = e.pts[d.pi].slice();
    const c = ev.shiftKey ? null : crossNear(p); let q = c || [snapV(p[0]), snapV(p[1])];
    /* Shift: the point moves only horizontally or vertically from where it started */
    if (ev.shiftKey) { if (Math.abs(q[0] - d.p0pt[0]) >= Math.abs(q[1] - d.p0pt[1])) q = [q[0], d.p0pt[1]]; else q = [d.p0pt[0], q[1]]; }
    sk.gridHot = c || (onCross(q) ? q : null); e.pts[d.pi] = q;
  }
  redrawSketch();
}
function sketchMove(ev) {
  if (!sk.tool) { dom.style.cursor = sketchHandleAt(ev) ? 'move' : ''; }
  if (sk.tool === 'sksegtrim') { const r = segTrimAt(ev); sk.segHover = r ? r.cut : null; sk.snapPt = null; sk.cursor = null; sk.gridHot = null; redrawSketch(); return; }
  if (sk.tool === 'skoffset') { const i = hitSketchEntity(ev), e = sk.f.ents[i]; sk.segHover = null; let o = null; try { o = e ? offsetEnt(e, offsetDist()) : null; } catch (er) { o = null; } sk.offHover = o; sk.snapPt = null; sk.cursor = null; sk.gridHot = null; redrawSketch(); return; }
  if (!sk.tool || sk.tool === 'skfillet' || sk.tool === 'sktrim' || sk.tool === 'skjoin') { sk.snapPt = null; sk.cursor = null; sk.gridHot = null; sk.hoverMid = !sk.tool ? nearMidpoint(ev) : null; redrawSketch(); return; }
  sk.cursor = sketchPoint(ev);
  if (isFreehand()) sk.gridHot = null;
  redrawSketch();
  updateDimLabel(ev);
}
let lastPointer = null;
function updateDimLabel(ev) {
  const el = $('#dim');
  if (ev) lastPointer = evPx(ev);
  const d = draftEntity();
  if (!sk || !d || !lastPointer) { el.hidden = true; return; }
  /* with dimensions shown the sizes and the angle are in the dimensions themselves, no extra box at the pointer */
  if (showSkDims() || d.t === 'text') { el.hidden = true; return; }
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
function sketchClick(ev) { const n0 = sk.f.ents.length; sketchClick0(ev); markCons(n0); if (sk && ev.pointerType === 'touch' && sk.gridHot) { sk.gridHot = null; redrawSketch(); } }
function sketchClick0(ev) {
  if (!sk.tool) { pickSketchEntity(ev); return; }
  if (sk.tool === 'sktrim') { trimClick(ev); return; }
  if (sk.tool === 'skjoin') { joinClick(ev); return; }
  if (sk.tool === 'sksegtrim') { segTrimClick(ev); return; }
  if (sk.tool === 'skoffset') { offsetClick(ev); return; }
  if (sk.tool === 'sktext') { const p = sketchPoint(ev); if (!p) return; sk.f.ents.push({ t: 'text', s: sk.txt.s, x: p[0], y: p[1], h: sk.txt.h, bold: sk.txt.bold, a: 0 }); sk.selEnt = sk.f.ents.length - 1; renderPalette(); redrawSketch(); return; }
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
    else { sk.cursor = p; const d = draftEntity(); if (d && Math.abs(d.w) > 1e-6 && Math.abs(d.h) > 1e-6) { for (const k of ['x', 'y', 'w', 'h']) d[k] = Math.round(d[k] * 1e4) / 1e4; f.ents.push(d); sk.selEnt = f.ents.length - 1; } sk.draft = null; renderPalette(); }
  } else if (sk.tool === 'circle') {
    if (!sk.draft) sk.draft = { p };
    else { sk.cursor = p; const d = draftEntity(); if (d && d.r > 1e-6) { f.ents.push({ ...d, r: Math.round(d.r * 1000) / 1000 }); sk.selEnt = f.ents.length - 1; } sk.draft = null; renderPalette(); }
  } else if (sk.tool === 'ngon') {
    if (!sk.draft) sk.draft = { p };
    else { sk.cursor = p; const d = draftEntity(); if (d && d.r > 1e-6) { f.ents.push({ t: 'ngon', x: d.x, y: d.y, r: Math.round(d.r * 1000) / 1000, n: d.n, a: Math.round(d.a * 100) / 100 }); sk.selEnt = f.ents.length - 1; } sk.draft = null; renderPalette(); }
  } else if (sk.tool === 'ellipse' || (sk.tool === 'slot' && drawMode(sk.tool) === 'corner')) {
    if (!sk.draft) sk.draft = { p };
    else {
      sk.cursor = p; const d = draftEntity(), r3 = v => Math.round(v * 1000) / 1000;
      if (d && (d.t === 'slot' ? d.w > 1e-6 : d.rx > 1e-6 && d.ry > 1e-6)) { for (const k of ['x', 'y', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'w']) if (d[k] !== undefined) d[k] = r3(d[k]); f.ents.push(d); sk.selEnt = f.ents.length - 1; }
      sk.draft = null; renderPalette();
    }
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
function finishPolyline(closed) { const n0 = sk ? sk.f.ents.length : 0; finishPolyline0(closed); markCons(n0); }
function finishPolyline0(closed) {
  if (!sk || !isPolyTool(sk.tool) || !sk.draft) return;
  const pts = sk.draft.pts;
  if (pts.length >= 2) { sk.f.ents.push({ t: sk.tool === 'spline' ? 'spline' : 'poly', pts: pts.map(p => p.slice()), closed: !!closed && pts.length >= 3 }); sk.selEnt = sk.f.ents.length - 1; }
  sk.draft = null; renderPalette(); redrawSketch(); $('#dim').hidden = true;
}
function pickSketchEntity(ev) {
  const best = hitSketchEntity(ev);
  sk.selEnt = best; renderPalette(); redrawSketch();
  if (best >= 0) { const row = $(`#dialog [data-ent-row="${best}"]`); if (row) row.scrollIntoView({ block: 'nearest' }); }
}
function hitSketchEntity(ev) {
  const [mx, my] = evPx(ev), P = sk.f.plane;
  let best = -1, bd = 9;
  entityPolylines(sk.f.ents).forEach(pl => {
    const i = pl.ei, n = pl.pts.length, m = pl.closed ? n : n - 1;
    for (let k = 0; k < m; k++) {
      const a = toPx(P3(P, pl.pts[k][0], pl.pts[k][1])), b = toPx(P3(P, pl.pts[(k + 1) % n][0], pl.pts[(k + 1) % n][1]));
      const [d] = segDist(mx, my, a, b); if (d < bd || (i === sk.selEnt && d <= bd + 0.5)) { bd = d; best = i; }
    }
  });
  return best;
}
/* ---------- joining open lines and curves into a closed outline ---------- */
const JOIN_PROMPT1 = 'Spojit: klepněte na první otevřenou čáru nebo křivku, pak na druhou. Konce se propojí úsečkami a vznikne uzavřený obrys.';
const JOIN_PROMPT2 = 'Spojit: klepněte na druhou čáru nebo křivku. Klepnutím na stejnou ji uzavřete úsečkou.';
const isOpenEnt = e => !!e && (e.t === 'poly' || e.t === 'spline') && !e.closed && e.pts.length >= 2;
function joinClick(ev) {
  const i = hitSketchEntity(ev), e = sk.f.ents[i];
  if (!isOpenEnt(e)) { toast('Klepněte na otevřenou čáru nebo křivku.'); return; }
  if (sk.joinA == null || !isOpenEnt(sk.f.ents[sk.joinA])) { sk.joinA = i; sk.selEnt = i; setPrompt(JOIN_PROMPT2); renderPalette(); redrawSketch(); return; }
  const r = joinEnts(sk.joinA, i); sk.joinA = null; setPrompt(JOIN_PROMPT1);
  if (r >= 0) { sk.selEnt = r; toast('Spojeno do uzavřeného obrysu'); }
  renderPalette(); redrawSketch();
}
/* A and B (or A alone) become one closed outline; straight connectors are added where the ends do not meet.
   Lines stay straight and curves stay curved: a mixed result is a closed spline with the straight segments listed in lin. */
function joinEnts(ia, ib) {
  const ents = sk.f.ents, A = ents[ia], B = ents[ib], eq = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6, dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const kinds = (e, rev) => { const n = e.pts.length, out = []; for (let k = 0; k < n - 1; k++) { const kk = rev ? n - 2 - k : k; out.push(e.t === 'poly' || (e.lin && e.lin.includes(kk)) ? 'l' : 'c'); } return out; };
  const pts = A.pts.map(q => q.slice()), types = kinds(A, false);
  if (ib !== ia) {
    const a0 = A.pts[0], a1 = A.pts[A.pts.length - 1], b0 = B.pts[0], b1 = B.pts[B.pts.length - 1];
    const rev = dist(a1, b1) + dist(b0, a0) < dist(a1, b0) + dist(b1, a0);
    const bp = (rev ? B.pts.slice().reverse() : B.pts).map(q => q.slice()), bt = kinds(B, rev);
    if (eq(pts[pts.length - 1], bp[0])) { pts.push(...bp.slice(1)); types.push(...bt); }
    else { types.push('l'); pts.push(...bp); types.push(...bt); }
  }
  if (eq(pts[pts.length - 1], pts[0])) pts.pop(); else types.push('l');
  if (pts.length < 3) { toast('Z takových prvků uzavřený obrys nevznikne.'); return -1; }
  const lin = types.map((t, k) => (t === 'l' ? k : -1)).filter(k => k >= 0);
  const res = lin.length === types.length ? { t: 'poly', pts, closed: true } : { t: 'spline', pts, closed: true, ...(lin.length ? { lin } : {}) };
  ents[ia] = res;
  if (ib !== ia) { ents.splice(ib, 1); if (ib < ia) return ia - 1; }
  return ia;
}
/* midpoints of straight segments: lines, rectangle sides and the line being drawn */
function midPoints() {
  const out = [], seg = (a, b) => out.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  for (const e of sk.f.ents) {
    if (e.t === 'poly') { const n = e.pts.length; for (let k = 0; k < (e.closed ? n : n - 1); k++) seg(e.pts[k], e.pts[(k + 1) % n]); }
    else if (e.t === 'spline' && e.lin) { const n = e.pts.length; for (const k of e.lin) if (k < n) seg(e.pts[k], e.pts[(k + 1) % n]); }
    else if (e.t === 'rect') { const c = [[e.x, e.y], [e.x + e.w, e.y], [e.x + e.w, e.y + e.h], [e.x, e.y + e.h]]; for (let k = 0; k < 4; k++) seg(c[k], c[(k + 1) % 4]); }
  }
  if (sk.draft && sk.draft.pts && sk.tool === 'line') for (let k = 0; k < sk.draft.pts.length - 1; k++) seg(sk.draft.pts[k], sk.draft.pts[k + 1]);
  return out;
}
function nearMidpoint(ev, maxPx) {
  const [mx, my] = evPx(ev), P = sk.f.plane; let best = null, bd = maxPx || (TOUCH ? 16 : 10);
  for (const q of midPoints()) { const s = toPx(P3(P, q[0], q[1])); const d = Math.hypot(s[0] - mx, s[1] - my); if (d < bd) { bd = d; best = q; } }
  return best;
}
/* grid crossing near the pointer (10 mm grid, or 1 mm when the fine grid is shown), only while drawing or dragging */
/* grid crossings: the visible grid (10 mm, or 1 mm while the fine grid is shown). A point that comes within a few
   pixels of a crossing is pulled exactly onto it, and only then is the crossing highlighted */
const gridSpacing = () => { const fg = G.skwork.getObjectByName('fine'); return fg && fg.visible ? 1 : 10; };
function crossNear(q, maxPx) {
  if (!q) return null;
  const sp = gridSpacing(), c = [Math.round(q[0] / sp) * sp, Math.round(q[1] / sp) * sp], P = sk.f.plane;
  const a = toPx(P3(P, c[0], c[1])), b = toPx(P3(P, q[0], q[1]));
  return Math.hypot(a[0] - b[0], a[1] - b[1]) <= (maxPx == null ? (TOUCH ? 8 : 5) : maxPx) ? c : null;
}
const onCross = q => { const sp = gridSpacing(), e = 1e-6; return !!q && Math.abs(q[0] / sp - Math.round(q[0] / sp)) < e && Math.abs(q[1] / sp - Math.round(q[1] / sp)) < e; };
function crossMarker(P, q) {
  const s = worldPerPx(P3(P, q[0], q[1])) * 3.5, arr = [];
  for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, v = P3(P, q[0] + Math.cos(a) * s, q[1] + Math.sin(a) * s, 0.02); arr.push(v.x, v.y, v.z); }
  const g = noRay(new THREE.Group());
  g.add(noRay(new THREE.Line(lineGeo(arr), new THREE.LineBasicMaterial({ color: tok['accent-hover'], transparent: true, opacity: 0.9, depthTest: false }))));
  const d = P3(P, q[0], q[1], 0.02);
  g.add(noRay(new THREE.Points(lineGeo([d.x, d.y, d.z]), new THREE.PointsMaterial({ color: tok['accent-hover'], size: 3, sizeAttenuation: false, transparent: true, opacity: 0.8, depthTest: false }))));
  return g;
}
/* small triangle marking a midpoint (constant size on screen) */
function midMarker(P, q, color) {
  const s = worldPerPx(P3(P, q[0], q[1])) * 7, arr = [];
  for (const [x, y] of [[0, 1], [-0.87, -0.5], [0.87, -0.5], [0, 1]]) { const v = P3(P, q[0] + x * s, q[1] + y * s, 0.08); arr.push(v.x, v.y, v.z); }
  const l = noRay(new THREE.Line(lineGeo(arr), new THREE.LineBasicMaterial({ color, depthTest: false })));
  l.renderOrder = 12; return l;
}
/* ---------- Kombinovat tvary: union, subtraction or intersection of two closed shapes, or splitting a shape along a line ---------- */
const COMB_OPS = [['subtract', 'Odečíst'], ['union', 'Sjednotit'], ['intersect', 'Průnik'], ['split', 'Rozdělit']];
const combOp = () => (sk && sk.combOp) || 'subtract';
const COMB_PROMPT1 = {
  subtract: 'Odečíst: klepněte na uzavřený tvar, od kterého se má odečítat',
  union: 'Sjednotit: klepněte na první uzavřený tvar',
  intersect: 'Průnik: klepněte na první uzavřený tvar',
  split: 'Rozdělit: klepněte na uzavřený tvar, který se má rozdělit'
};
const COMB_PROMPT2 = {
  subtract: 'Teď klepněte na tvar, který se odečte (nebo na čáru, podél které se tvar rozdělí)',
  union: 'Teď klepněte na druhý tvar, oba se spojí do jednoho obrysu',
  intersect: 'Teď klepněte na druhý tvar, zůstane jen jejich společná část',
  split: 'Teď klepněte na čáru nebo křivku, podél které se tvar rozdělí'
};
const XY_B = { o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] };
const isClosedEnt = e => e && (['rect', 'circle', 'ngon', 'slot', 'ellipse'].includes(e.t) || ((e.t === 'poly' || e.t === 'spline') && e.closed));
/* 2D boolean of a closed sketch entity with a closed point loop, done with the solid kernel on thin prisms; returns outline loops */
function clip2D(ent, cutPts, op) {
  /* for a union both tops lie at z = 1 so the merged top face is the outline; otherwise the cutter pokes through */
  const A = K.extrudeProfiles([ent], XY_B, 0, 1), B = K.extrudeProfiles([{ t: 'poly', pts: cutPts, closed: true }], XY_B, -1, op === 'union' ? 1 : 2);
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
  const f = sk.f, c = sk.cut || (sk.cut = {}), op = combOp(), done = () => setPrompt(COMB_PROMPT1[op]);
  if (c.parts) {
    const p = sketchRawPoint(ev); if (!p) return;
    const hitPart = [c.parts.a, c.parts.b].find(list => list.some(i => f.ents[i] && K.inPoly2D(p, K.profilePoints(f.ents[i]))));
    if (!hitPart) { toast('Klepněte dovnitř jedné z částí.'); return; }
    [...hitPart].sort((x, y) => y - x).forEach(i => f.ents.splice(i, 1));
    sk.cut = null; sk.selEnt = -1; toast('Část odstraněna.'); done(); renderPalette(); redrawSketch(); return;
  }
  pickSketchEntity(ev);
  const i = sk.selEnt; if (i < 0) return;
  if (c.target === undefined || c.target === null || !f.ents[c.target]) {
    if (!isClosedEnt(f.ents[i])) { toast('Nejprve klepněte na uzavřený tvar.'); return; }
    c.target = i; setPrompt(COMB_PROMPT2[op]); return;
  }
  if (i === c.target) return;
  const tgt = f.ents[c.target], cut = f.ents[i];
  /* results keep arcs as short chords: tr marks them so only the straight sides get dimensions and handles */
  const put = pts => f.ents.push({ t: 'poly', pts, closed: true, tr: true }) - 1;
  try {
    if (isClosedEnt(cut) && op !== 'split') {
      const loops = clip2D(tgt, K.profilePoints(cut), op);
      if (op === 'union' && loops.length > 1) { toast('Tvary se nepřekrývají, nic se nespojilo.'); sk.cut = null; sk.selEnt = -1; done(); renderPalette(); redrawSketch(); return; }
      const rm = [c.target, i].sort((x, y) => y - x); rm.forEach(k => f.ents.splice(k, 1));
      loops.forEach(put);
      sk.cut = null; sk.selEnt = loops.length ? f.ents.length - 1 : -1;
      toast(op === 'union' ? 'Spojeno do jednoho tvaru.' : op === 'intersect' ? (loops.length ? 'Zůstala společná část.' : 'Tvary se nepřekrývají, nic nezůstalo.') : (loops.length ? 'Odečteno.' : 'Tvar byl odečten celý.'));
      done();
    } else if (isClosedEnt(cut)) { toast('Pro rozdělení klepněte na čáru nebo křivku.'); return; }
    else {
      const line = entityPolylines([cut])[0].pts;
      if (line.length < 2) return;
      const side = sidePolygon(line), a = clip2D(tgt, side, 'intersect'), b = clip2D(tgt, side, 'subtract');
      if (!a.length || !b.length) { toast('Čára tvar neprotíná, nic se nerozdělilo.'); sk.cut = null; done(); return; }
      const rm = [c.target, i].sort((x, y) => y - x); rm.forEach(k => f.ents.splice(k, 1));
      const ia = a.map(put), ib = b.map(put);
      sk.cut = { parts: { a: ia, b: ib } }; sk.selEnt = -1;
      setPrompt('Tvar je rozdělený. Klepněte do části, kterou chcete odstranit (Esc nechá obě části)');
    }
  } catch (e) { toast('Kombinace tvarů se nepodařila: ' + e.message); sk.cut = null; }
  renderPalette(); redrawSketch();
}
/* ---------- trimming a segment: the part of an element between its two nearest intersections with other elements ---------- */
function segTrimAt(ev) {
  const ents = sk.f.ents, ei = hitSketchEntity(ev); if (ei < 0) return null;
  const p = sketchRawPoint(ev); if (!p) return null;
  if (ents[ei].t === 'text') return null;
  const pls = entityPolylines(ents), A = pls.find(q => q.ei === ei); if (!A || A.pts.length < 2) return null;
  const pts = A.pts, n = pts.length, closed = A.closed, m = closed ? n : n - 1, cum = [0];
  for (let k = 0; k < m; k++) cum.push(cum[k] + Math.hypot(pts[(k + 1) % n][0] - pts[k][0], pts[(k + 1) % n][1] - pts[k][1]));
  const L = cum[m]; if (L < 1e-9) return null;
  /* where the pointer lies along the outline */
  let tp = 0, bd = Infinity;
  for (let k = 0; k < m; k++) {
    const a = pts[k], b = pts[(k + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    const u = l2 > 0 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0, d = Math.hypot(a[0] + dx * u - p[0], a[1] + dy * u - p[1]);
    if (d < bd) { bd = d; tp = cum[k] + u * (cum[k + 1] - cum[k]); }
  }
  /* intersections with all other elements, as distances along this outline */
  const ts = [], eps = L * 1e-7 + 1e-9;
  pls.forEach(B => {
    if (B.ei === ei) return;
    const q = B.pts, nb = q.length, mb = B.closed ? nb : nb - 1;
    for (let k = 0; k < m; k++) {
      const a = pts[k], b = pts[(k + 1) % n], rx = b[0] - a[0], ry = b[1] - a[1];
      const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
      for (let h = 0; h < mb; h++) {
        const c = q[h], d = q[(h + 1) % nb];
        if (Math.max(c[0], d[0]) < x0 - 1e-9 || Math.min(c[0], d[0]) > x1 + 1e-9 || Math.max(c[1], d[1]) < y0 - 1e-9 || Math.min(c[1], d[1]) > y1 + 1e-9) continue;
        const sx = d[0] - c[0], sy = d[1] - c[1], den = rx * sy - ry * sx; if (Math.abs(den) < 1e-14) continue;
        const wx = c[0] - a[0], wy = c[1] - a[1], u = (wx * sy - wy * sx) / den, v = (wx * ry - wy * rx) / den;
        if (u < -1e-9 || u > 1 + 1e-9 || v < -1e-9 || v > 1 + 1e-9) continue;
        ts.push(cum[k] + Math.max(0, Math.min(1, u)) * (cum[k + 1] - cum[k]));
      }
    }
  });
  ts.sort((x, y) => x - y);
  const cuts = []; for (const t of ts) if (!cuts.length || t - cuts[cuts.length - 1] > eps * 10) cuts.push(t);
  if (closed && cuts.length > 1 && cuts[0] + L - cuts[cuts.length - 1] <= eps * 10) cuts.pop();
  const inner = closed ? cuts : cuts.filter(t => t > eps * 10 && t < L - eps * 10);
  /* the outline from distance a to b (b may run past the end of a closed outline) */
  const at = t => { t = closed ? ((t % L) + L) % L : Math.max(0, Math.min(L, t)); let k = 0; while (k < m - 1 && cum[k + 1] < t) k++; const a = pts[k], b = pts[(k + 1) % n], l = cum[k + 1] - cum[k], u = l > 0 ? (t - cum[k]) / l : 0; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; };
  const sub = (a, b) => {
    const out = [at(a)];
    for (let lap = 0; lap < 2; lap++) for (let k = 1; k <= m; k++) { const t = cum[k] + lap * L; if (t > a + eps && t < b - eps) out.push(pts[k % n].slice()); }
    out.push(at(b)); return out;
  };
  if (!inner.length || (closed && inner.length < 2)) return { ei, keep: [], cut: closed ? pts.concat([pts[0]]) : pts.slice(), all: true };
  let lo, hi;
  if (closed) { lo = inner.filter(t => t < tp).pop(); hi = inner.find(t => t > tp); if (lo === undefined) lo = inner[inner.length - 1] - L; if (hi === undefined) hi = inner[0] + L; }
  else { lo = inner.filter(t => t < tp).pop(); hi = inner.find(t => t > tp); if (lo === undefined) lo = 0; if (hi === undefined) hi = L; }
  const cut = sub(lo, hi), keep = [];
  if (closed) keep.push(sub(hi, lo + L));
  else { if (lo > eps * 10) keep.push(sub(0, lo)); if (hi < L - eps * 10) keep.push(sub(hi, L)); }
  return { ei, keep, cut };
}
function segTrimClick(ev) {
  const r = segTrimAt(ev); if (!r) { toast('Klepněte na čáru, kterou chcete oříznout.'); return; }
  const f = sk.f, o = f.ents[r.ei], r4 = q => [Math.round(q[0] * 1e4) / 1e4, Math.round(q[1] * 1e4) / 1e4];
  f.ents.splice(r.ei, 1);
  r.keep.forEach(pts => { const e = { t: 'poly', pts: pts.map(r4), closed: false, tr: true }; if (o.cons) e.cons = true; f.ents.push(e); });
  /* trimmed pieces whose ends meet are joined into one line, closed when the chain comes back to its start */
  const same = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-3, isT = e => e && e.t === 'poly' && e.tr && !e.closed;
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < f.ents.length && !changed; i++) {
      const A = f.ents[i]; if (!isT(A)) continue;
      if (A.pts.length > 2 && same(A.pts[0], A.pts[A.pts.length - 1])) { A.pts.pop(); A.closed = true; changed = true; break; }
      for (let j = 0; j < f.ents.length; j++) {
        const B = f.ents[j]; if (j === i || !isT(B) || !!A.cons !== !!B.cons) continue;
        const a0 = A.pts[0], a1 = A.pts[A.pts.length - 1], b0 = B.pts[0], b1 = B.pts[B.pts.length - 1];
        let pts = null;
        if (same(a1, b0)) pts = A.pts.concat(B.pts.slice(1));
        else if (same(a1, b1)) pts = A.pts.concat(B.pts.slice(0, -1).reverse());
        else if (same(a0, b1)) pts = B.pts.concat(A.pts.slice(1));
        else if (same(a0, b0)) pts = B.pts.slice().reverse().concat(A.pts.slice(1));
        if (pts) { A.pts = pts; f.ents.splice(j, 1); changed = true; break; }
      }
    }
  }
  sk.segHover = null; sk.selEnt = -1;
  toast(r.all ? 'Prvek nemá průsečík, odstraněn celý.' : 'Úsek odstraněn.');
  renderPalette(); redrawSketch();
}
/* ---------- offset (odsazení) of an outline: + outward, − inward ---------- */
const offsetDist = () => (sk.offIn ? -1 : 1) * sk.offD;
/* miter offset of a point loop or an open line; d > 0 pushes a counter-clockwise loop outward, an open line to its right */
function offsetPts(pts, closed, d) {
  const n = pts.length, ccw = closed ? K.area2D(pts) > 0 : true, sg = ccw ? 1 : -1, out = [];
  const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [sg * dy / L, -sg * dx / L]; };
  for (let i = 0; i < n; i++) {
    const p = pts[i], prev = closed ? pts[(i - 1 + n) % n] : pts[i - 1], next = closed ? pts[(i + 1) % n] : pts[i + 1];
    const n1 = prev ? nrm(prev, p) : null, n2 = next ? nrm(p, next) : null;
    if (!n1 || !n2) { const m = n1 || n2; out.push([p[0] + m[0] * d, p[1] + m[1] * d]); continue; }
    const c = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    if (c < 0.5) { out.push([p[0] + n1[0] * d, p[1] + n1[1] * d], [p[0] + n2[0] * d, p[1] + n2[1] * d]); continue; } /* very sharp corner: bevel */
    out.push([p[0] + (n1[0] + n2[0]) / c * d, p[1] + (n1[1] + n2[1]) / c * d]);
  }
  return out.map(q => [Math.round(q[0] * 1e4) / 1e4, Math.round(q[1] * 1e4) / 1e4]);
}
function offsetEnt(e, d) {
  const r4 = v => Math.round(v * 1e4) / 1e4, bad = () => { throw new Error('Odsazení je větší než tvar.'); };
  if (e.t === 'text') throw new Error('Text nejde odsadit.');
  if (e.t === 'circle') { const r = e.r + d; if (r <= 1e-3) bad(); return { t: 'circle', x: e.x, y: e.y, r: r4(r) }; }
  if (e.t === 'rect') {
    const x0 = Math.min(e.x, e.x + e.w), y0 = Math.min(e.y, e.y + e.h), w = Math.abs(e.w) + 2 * d, h = Math.abs(e.h) + 2 * d; if (w <= 1e-3 || h <= 1e-3) bad();
    const o = { t: 'rect', x: r4(x0 - d), y: r4(y0 - d), w: r4(w), h: r4(h) }; if (e.fr > 0 && e.fr + d > 1e-3) o.fr = r4(e.fr + d); return o;
  }
  if (e.t === 'ngon') { const r = e.r + d / Math.cos(Math.PI / e.n); if (r <= 1e-3) bad(); const o = { t: 'ngon', x: e.x, y: e.y, r: r4(r), n: e.n, a: e.a || 0 }; if (e.fr > 0 && e.fr + d > 1e-3) o.fr = r4(e.fr + d); return o; }
  if (e.t === 'slot') { const w = e.w + 2 * d; if (w <= 1e-3) bad(); return { t: 'slot', x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2, w: r4(w) }; }
  const pl = entityPolylines([e])[0]; if (!pl || pl.pts.length < 2) bad();
  const curved = e.t === 'spline' || e.t === 'ellipse' || !!e.tr || (e.t === 'poly' && e.fr > 0);
  if (!pl.closed) return { t: 'poly', pts: offsetPts(pl.pts, false, d), closed: false, ...(curved ? { tr: true } : {}) };
  const pts = offsetPts(pl.pts, true, d), a0 = K.area2D(pl.pts), a1 = K.area2D(pts);
  if (Math.sign(a0) !== Math.sign(a1) || Math.abs(a1) < 1e-6) bad();
  return { t: 'poly', pts, closed: true, ...(curved ? { tr: true } : {}) };
}
function offsetClick(ev) {
  const i = hitSketchEntity(ev), e = sk.f.ents[i]; if (!e) { toast('Klepněte na obrys, který chcete odsadit.'); return; }
  let o; try { o = offsetEnt(e, offsetDist()); } catch (er) { toast(er.message); return; }
  if (e.cons) o.cons = true;
  sk.f.ents.push(o); sk.selEnt = sk.f.ents.length - 1; sk.offHover = null; renderPalette(); redrawSketch();
}
function deleteSketchEntity() {
  if (!sk) return;
  if (sk.selEnt < 0 || !sk.f.ents[sk.selEnt]) { toast('Nejprve vyberte prvek skici.'); return; }
  sk.f.ents.splice(sk.selEnt, 1); sk.selEnt = -1; renderPalette(); redrawSketch();
}
const ENT_LABEL = { text: 'Text', spline: 'Křivka', rect: 'Obdélník', circle: 'Kružnice', poly: 'Čára', ngon: 'Mnohoúhelník', slot: 'Drážka', ellipse: 'Elipsa' };
function openPalette() {
  const el = $('#dialog'); el.hidden = false; dlg = null;
  el.innerHTML = `<div class="phead"><span class="ico">${svg('sketch', 18)}</span><span class="t">PALETA SKICI</span><button class="ibtn" data-act="cancel" aria-label="Zrušit skicu" title="Zrušit změny">${svg('close', 14)}</button></div>
    <div class="dbody palette"><div id="pal-tool" hidden></div><div class="note" id="pal-note"></div><label class="chk"><input type="checkbox" id="pal-dims"${showSkDims() ? ' checked' : ''}><span>Zobrazit kóty</span></label><div class="ents" id="pal-ents"></div></div>
    <div class="dfoot"><button class="btn" data-act="cancel">Zrušit</button><button class="btn primary" data-act="ok">Dokončit skicu</button></div>`;
  renderPalette();
}
function renderPalette() {
  if (!sk) return;
  skCheckpoint();
  const box = $('#pal-ents'); if (!box) return;
  const ents = sk.f.ents;
  const nr = Engine.regions(sk.f).length;
  const tb = $('#pal-tool');
  if (tb) {
    const hasMode = !!DRAW_DEFAULT[sk.tool], want = (hasMode ? 'm-' + sk.tool + '-' + drawMode(sk.tool) : '') + (sk.tool === 'ngon' ? '+ngon' : '') + (sk.tool === 'skfillet' ? 'fr' : '') + (sk.tool === 'sktrim' ? 'comb-' + combOp() : '') + (sk.tool === 'skoffset' ? 'off-' + sk.offIn : '') + (sk.tool === 'sktext' ? 'txt' : '');
    if (tb.dataset.kind !== want) {
      tb.dataset.kind = want;
      const opts = sk.tool === 'spline' ? [['points', 'Bod po bodu'], ['free', 'Od ruky']] : [['corner', 'Z rohu'], ['center', sk.tool === 'slot' ? 'Od konce ke konci' : 'Ze středu']];
      const modeRow = hasMode ? `<div class="frow"><span class="fl">Kreslit</span><div class="seg">${opts.map(([v, l]) => `<button data-rmode="${v}" aria-pressed="${drawMode(sk.tool) === v}">${l}</button>`).join('')}</div></div>` : '';
      const combRow = sk.tool === 'sktrim' ? `<div class="frow"><div class="seg">${COMB_OPS.map(([v, l]) => `<button data-cmode="${v}" aria-pressed="${combOp() === v}">${l}</button>`).join('')}</div></div>` : '';
      const offRow = sk.tool === 'skoffset' ? `<div class="frow"><label for="pal-offd">Vzdálenost</label><span class="fnum"><input id="pal-offd" value="${fmtc(sk.offD, 3)}" inputmode="decimal" autocomplete="off"><span class="u">mm</span></span></div><div class="frow"><div class="seg"><button data-offdir="out" aria-pressed="${!sk.offIn}">Ven</button><button data-offdir="in" aria-pressed="${sk.offIn}">Dovnitř</button></div></div>` : '';
      const esc = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      const txtRow = sk.tool === 'sktext' ? `<div class="frow"><label for="pal-txt">Text</label><span class="fnum ftext"><input id="pal-txt" value="${esc(sk.txt.s)}" autocomplete="off"></span></div><div class="frow"><label for="pal-txth">Výška písmen</label><span class="fnum"><input id="pal-txth" value="${fmtc(sk.txt.h, 3)}" inputmode="decimal" autocomplete="off"><span class="u">mm</span></span></div><label class="chk"><input type="checkbox" id="pal-txtb"${sk.txt.bold ? ' checked' : ''}><span>Tučné písmo</span></label>` : '';
      tb.innerHTML = modeRow + combRow + offRow + txtRow + (sk.tool === 'ngon' ? `<div class="frow"><label for="pal-ngon">Počet stran</label><span class="fnum"><input id="pal-ngon" value="${sk.ngonN}" inputmode="numeric" autocomplete="off"><span class="u">ks</span></span></div>`
        : want === 'fr' ? `<div class="frow"><label for="pal-fr">Poloměr rohů</label><span class="fnum"><input id="pal-fr" value="${fmtc(sk.frR, 3)}" inputmode="decimal" autocomplete="off"><span class="u">mm</span></span></div>`
        : '');
    }
    tb.hidden = !want;
  }
  $('#pal-note').textContent = ents.length ? `${sk.f.name} · ${nr} ${nr === 1 ? 'uzavřený profil' : nr >= 2 && nr <= 4 ? 'uzavřené profily' : 'uzavřených profilů'}` : 'Skica je prázdná. Nakreslete obdélník, kružnici nebo čáru.';
  const num = (i, k, label, val) => `<label class="fnum" title="${label}"><span class="ax">${label}</span><input id="ent-${i}-${k}" data-ent="${i}" data-k="${k}" value="${fmtc(val, 3)}" inputmode="decimal" autocomplete="off" aria-label="${label}"></label>`;
  const uniChk = i => `<label class="chk"><input type="checkbox" id="ent-${i}-uni" data-ent="${i}" data-k="uni"${sk.uniform ? ' checked' : ''}><span>Zachovat poměr stran</span></label>`;
  box.innerHTML = ents.map((e, i) => {
    let body = '';
    if (e.t === 'rect') body = `<div class="grid2">${num(i, 'x', 'X', e.x)}${num(i, 'y', 'Y', e.y)}${num(i, 'w', 'Š', e.w)}${num(i, 'h', 'V', e.h)}${num(i, 'fr', 'R', e.fr || 0)}</div>`;
    else if (e.t === 'circle') body = `<div class="grid2">${num(i, 'x', 'X', e.x)}${num(i, 'y', 'Y', e.y)}${num(i, 'd', 'Ø', e.r * 2)}</div>`;
    else if (e.t === 'ngon') body = `<div class="grid2">${num(i, 'x', 'X', e.x)}${num(i, 'y', 'Y', e.y)}${num(i, 'r', 'R', e.r)}${num(i, 'n', 'n', e.n)}${num(i, 'a', '∠', e.a || 0)}${num(i, 'fr', 'Rz', e.fr || 0)}</div>`;
    else if (e.t === 'ellipse') body = `<div class="grid2">${num(i, 'x', 'X', e.x)}${num(i, 'y', 'Y', e.y)}${num(i, 'rx', 'a', e.rx)}${num(i, 'ry', 'b', e.ry)}${num(i, 'a', '∠', e.a || 0)}</div>`;
    else if (e.t === 'slot') { const g = slotGeom(e); body = `<div class="grid2">${num(i, 'scx', 'X', g.cx)}${num(i, 'scy', 'Y', g.cy)}${num(i, 'slen', 'L', g.len)}${num(i, 'sd', 'R', g.d)}${num(i, 'w', 'Š', e.w)}${num(i, 'sang', '∠', g.ang)}</div><div class="note">X, Y střed · L celková délka · R rozteč středů zaoblení · Š šířka · ∠ natočení</div>`; }
    else if (e.t === 'text') body = `<label class="fnum ftext" title="Text"><span class="ax">T</span><input id="ent-${i}-s" data-ent="${i}" data-k="s" value="${String(e.s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}" autocomplete="off" aria-label="Text"></label><div class="grid2">${num(i, 'x', 'X', e.x)}${num(i, 'y', 'Y', e.y)}${num(i, 'h', 'V', e.h)}${num(i, 'a', '∠', e.a || 0)}${num(i, 'sp', 'Mez.', e.sp || 0)}</div><label class="chk"><input type="checkbox" id="ent-${i}-bold" data-ent="${i}" data-k="bold"${e.bold !== false ? ' checked' : ''}><span>Tučné písmo</span></label><div class="note">V výška velkých písmen · Mez. mezera mezi písmeny (mm)</div>`;
    else if (e.t === 'spline') body = `<div class="note">${e.pts.length} bodů · body přesunete tažením ve skice</div><label class="chk"><input type="checkbox" id="ent-${i}-closed" data-ent="${i}" data-k="closed"${e.closed ? ' checked' : ''}${e.pts.length < 3 ? ' disabled' : ''}><span>Uzavřená křivka</span></label>${uniChk(i)}`;
    else {
      const n = e.pts.length, segs = e.closed ? n : n - 1, rows = [];
      for (let k = 0, shown = 0; k < segs && shown < 40; k++) {
        if (isChord(e, k)) continue; shown++;
        const a = e.pts[k], b = e.pts[(k + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        rows.push(`<div class="seglbl">Úsečka ${k + 1}${e.closed && k === n - 1 ? ' (uzavírací)' : ''}</div><div class="grid2">${num(i, 'L' + k, 'L', L)}${num(i, 'A' + k, '∠', dirAngle(a, b))}</div>`);
      }
      body = `<div class="note">${n} bodů · ${e.closed ? 'uzavřený obrys' : 'otevřená čára (lze použít jako osu rotace)'}</div>${rows.join('')}${e.closed ? `<div class="grid2">${num(i, 'fr', 'R', e.fr || 0)}</div>${uniChk(i)}` : ''}`;
    }
    body += `<label class="chk"><input type="checkbox" id="ent-${i}-cons" data-ent="${i}" data-k="cons"${e.cons ? ' checked' : ''}><span>Pomocný prvek</span></label>`;
    return `<div class="ent${sk.selEnt === i ? ' sel' : ''}${e.cons ? ' cons' : ''}" data-ent-row="${i}"><div class="eh"><span class="ico">${svg(e.t === 'poly' ? 'line' : e.t, 16)}</span>${ENT_LABEL[e.t]} ${i + 1}<button class="ibtn" data-entdup="${i}" aria-label="Duplikovat prvek" title="Duplikovat (Ctrl+D)">${svg('skdup', 14)}</button><button class="ibtn" data-entdel="${i}" aria-label="Smazat prvek" title="Smazat">${svg('skdel', 14)}</button></div>${body}</div>`;
  }).join('');
}
$('#dialog').addEventListener('click', e => {
  if (!sk) return;
  const od = e.target.closest('[data-offdir]'); if (od && sk && sk.tool === 'skoffset') { sk.offIn = od.dataset.offdir === 'in'; renderPalette(); return; }
  const cm = e.target.closest('[data-cmode]'); if (cm && sk.tool === 'sktrim') { sk.combOp = cm.dataset.cmode; sk.cut = null; setSketchTool('sktrim'); return; }
  const rm = e.target.closest('[data-rmode]'); if (rm && DRAW_DEFAULT[sk.tool]) { settings.drawModes = { ...(settings.drawModes || {}), [sk.tool]: rm.dataset.rmode }; saveSettings(); sk.draft = null; setSketchTool(sk.tool); return; }
  const du = e.target.closest('[data-entdup]'); if (du) { sk.selEnt = +du.dataset.entdup; duplicateSel(); return; }
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
  if (e && k === 'cons') { if (inp.checked) e.cons = true; else delete e.cons; renderPalette(); redrawSketch(); return; }
  if (e && e.t === 'text' && k === 's') { const t = inp.value.trim(); if (t) e.s = t.slice(0, 200); renderPalette(); redrawSketch(); return; }
  if (e && e.t === 'text' && k === 'bold') { e.bold = inp.checked; renderPalette(); redrawSketch(); return; }
  if (e && e.t === 'text' && k === 'h') { const v = parseNum(inp.value); if (v > 0) e.h = Math.min(1000, v); renderPalette(); redrawSketch(); return; }
  if (e && k === 'closed') { e.closed = inp.checked && e.pts.length >= 3; renderPalette(); redrawSketch(); return; }
  const v = parseNum(inp.value);
  if (e && e.t === 'slot' && ['scx', 'scy', 'slen', 'sd', 'sang', 'w'].includes(k)) {
    if (!isFinite(v)) { renderPalette(); return; }
    const g = slotGeom(e);
    if (k === 'scx') g.cx = v; else if (k === 'scy') g.cy = v; else if (k === 'sang') g.ang = v;
    else if (k === 'slen') { if (v > 0) g.d = Math.max(0.01, v - e.w); }
    else if (k === 'sd') { if (v >= 0) g.d = Math.max(0.01, v); }
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
      this.regions = new Set(new Set(regs.map(r => r.ei)).size === 1 || all ? regs.map(r => r.ei) : []);
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
      const st = settings.gridSnap ? settings.snap : 0.01; s = Math.round(s / st) * st;
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
  cone: [['D', 'Průměr', 30], ['Dt', 'Horní průměr', 0], ['h', 'Výška', 30]],
  torus: [['R', 'Poloměr', 25], ['t', 'Poloměr trubice', 6]]
};
function primParams(type, vals) {
  if (type === 'box') return { w: vals.w, d: vals.d, h: vals.h };
  if (type === 'cone') return { r: vals.D / 2, h: vals.h, rt: Math.max(0, vals.Dt || 0) / 2 };
  if (type === 'cylinder') return { r: vals.D / 2, h: vals.h };
  if (type === 'sphere') return { r: vals.D / 2 };
  return { R: vals.R, t: vals.t };
}
function primVals(type, p) {
  if (type === 'box') return { w: p.w, d: p.d, h: p.h };
  if (type === 'cone') return { D: p.r * 2, Dt: (p.rt || 0) * 2, h: p.h };
  if (type === 'cylinder') return { D: p.r * 2, h: p.h };
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
  if (type === 'cone') return [
    q('D', 'Průměr', [0, 0, 0], DIAG, v.D / 2, s => ({ D: 2 * s })),
    q('Dt', 'Horní průměr', [0, 0, v.h], [-DIAG[0], -DIAG[1], 0], (v.Dt || 0) / 2, s => ({ Dt: Math.max(0, 2 * s) })),
    q('h', 'Výška', [0, 0, 0], [0, 0, 1], v.h, s => ({ h: s }))];
  if (type === 'cylinder') return [
    q('D', 'Průměr', [0, 0, v.h / 2], DIAG, v.D / 2, s => ({ D: 2 * s })),
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
    editIndex, vals, pos: f ? f.pos.slice() : [0, 0, 0], op: f ? f.op : 'new', autoOp: false, /* inserted objects always start as a new body; the operation can still be changed in the dialog */ tool: null,
    hgrp: null, handles: [], drag: null, hover: null, gizmoDrag: false,
    /* a cube keeps its shape when dragged; any shape being edited keeps it if all its sides are equal */
    uniform: type === 'box' && (!f || (f.p.w === f.p.d && f.p.d === f.p.h)),
    init() {
      openDialog({
        title: Engine.FEATURE_LABEL[type], icon: type,
        fields: [...defs.map(([k, l]) => ({ k: 'num', id: k, label: l, value: this.vals[k] })), { k: 'xyz', id: 'pos', label: 'Poloha základny', value: this.pos },
          { k: 'chk', id: 'uni', label: 'Zachovat poměr stran', value: this.uniform },
          { k: 'opt', id: 'op', label: 'Operace', options: OPS, value: this.op }, { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'uni') { this.uniform = dlg.get('uni'); return; }
          if (id === 'pos') this.pos = dlg.get('pos');
          else if (id === 'op') { this.op = dlg.get('op'); this.autoOp = false; }
          else { const v = dlg.get(id); if (isFinite(v) && (v > 0 || (id === 'Dt' && v >= 0))) this.vals[id] = v; }
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
        let v = Math.round(nv[k] / st) * st; v = Math.max(k === 'Dt' ? 0 : st, Math.round(v * 1000) / 1000); /* a cone may end in a point */
        if (type === 'torus' && k === 'R') v = Math.max(v, this.vals.t + st);
        if (type === 'torus' && k === 't') v = Math.min(v, this.vals.R - st);
        if ((v > 0 || k === 'Dt') && v !== this.vals[k]) { this.vals[k] = v; dlg.set(k, v); this.update(); }
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

/* ================= bolts and nuts (ISO metric) ================= */
const FAST_SIZES = [2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
function startFastener(type, editIndex, f) {
  const bolt = type === 'bolt', pivot = new THREE.Object3D(); scene.add(pivot);
  const c = {
    editIndex, tool: null, gizmoDrag: false, timer: null,
    v: f ? { size: f.size, len: f.len, head: f.head || 'hex', thread: f.thread !== false, chamfer: f.chamfer !== false, undercut: !!f.undercut, tlen: f.tlen || 0, tol: f.tol != null ? f.tol : (bolt ? TOL_BOLT : TOL_NUT), low: !!f.low } : { size: 6, len: 20, head: 'hex', thread: true, chamfer: true, undercut: false, tlen: 0, tol: bolt ? TOL_BOLT : TOL_NUT, low: false },
    pos: f ? f.pos.slice() : [0, 0, 0], op: f ? f.op : 'new', autoOp: false,
    init() {
      const sizes = FAST_SIZES.map(d => [String(d), 'M' + fmtc(d, 1)]);
      openDialog({
        title: Engine.FEATURE_LABEL[type], icon: type,
        fields: [{ k: 'opt', id: 'size', label: 'Velikost závitu', options: sizes, value: String(this.v.size) },
          ...(bolt ? [{ k: 'num', id: 'len', label: 'Délka dříku', value: this.v.len },
            { k: 'opt', id: 'head', label: 'Hlava', options: [['hex', 'Šestihranná (ISO 4017)'], ['socket', 'Válcová s imbusem (ISO 4762)'], ['slotted', 'Válcová s drážkou – plochý šroubovák (ISO 1207)'], ['phillips', 'Půlkulatá s křížem – křížový šroubovák (ISO 7045)'], ['hexslot', 'Šestihranná s drážkou (klíč i plochý šroubovák)'], ['hexcross', 'Šestihranná s křížem (klíč i křížový šroubovák)']], value: this.v.head }] : []),
          ...(bolt ? [] : [{ k: 'seg', id: 'low', label: 'Výška', options: [['n', 'Normální (ISO 4032)'], ['l', 'Nízká (ISO 4035)']], value: this.v.low ? 'l' : 'n' }]),
          { k: 'chk', id: 'thread', label: 'Modelovat závit', value: this.v.thread },
          { k: 'chk', id: 'chamfer', label: bolt ? 'Zkosená špička (snazší našroubování)' : 'Zkosený náběh díry z obou stran', value: this.v.chamfer },
          ...(bolt ? [{ k: 'chk', id: 'undercut', label: 'Zápich pod hlavou (hladký krček bez závitu)', value: this.v.undercut }, { k: 'num', id: 'tlen', label: 'Délka závitu (0 = celý dřík)', value: this.v.tlen }] : []),
          { k: 'num', id: 'tol', label: bolt ? 'Vůle pro 3D tisk (zmenší průměr)' : 'Vůle pro 3D tisk (zvětší díru)', value: this.v.tol },
          { k: 'xyz', id: 'pos', label: 'Poloha', value: this.pos },
          { k: 'opt', id: 'op', label: 'Operace', options: OPS, value: this.op }, { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'pos') this.pos = dlg.get('pos');
          else if (id === 'op') { this.op = dlg.get('op'); this.autoOp = false; }
          else if (id === 'size') this.v.size = parseFloat(dlg.get('size'));
          else if (id === 'head') this.v.head = dlg.get('head');
          else if (id === 'thread') this.v.thread = dlg.get('thread');
          else if (id === 'chamfer') this.v.chamfer = dlg.get('chamfer');
          else if (id === 'undercut') this.v.undercut = dlg.get('undercut');
          else if (id === 'low') this.v.low = dlg.get('low') === 'l';
          else { const x = dlg.get(id); if (isFinite(x) && x >= 0) this.v[id] = x; }
          this.schedule();
        }
      });
      transform.setMode('translate'); transform.setSpace('world');
      transform.addEventListener('objectChange', this.onGizmo);
      transform.addEventListener('dragging-changed', this.onDragChange);
      transform.attach(pivot);
      setPrompt(bolt ? 'Šroub stojí na hlavě. Klepnutím do pohledu ho umístíte, manipulátorem posunete.' : 'Klepnutím do pohledu matici umístíte, manipulátorem posunete.');
      this.update();
    },
    feature() { return { id: f ? f.id : 'tmp', type, size: this.v.size, ...(bolt ? { len: this.v.len, head: this.v.head, tlen: this.v.tlen, undercut: this.v.undercut } : { low: this.v.low }), thread: this.v.thread, chamfer: this.v.chamfer, tol: this.v.tol, pos: this.pos.slice(), op: this.op }; },
    schedule() { clearTimeout(this.timer); dlg.set('n', 'Počítám…'); this.timer = setTimeout(() => this.update(), 120); },
    update() {
      clearGroup(G.preview); this.tool = null;
      if (!this.gizmoDrag) pivot.position.set(this.pos[0], this.pos[1], this.pos[2]);
      try {
        this.tool = Engine.toolForFastener(this.feature());
        if (this.autoOp) { const o = anyOverlap(this.tool) ? 'join' : 'new'; if (o !== this.op) { this.op = o; dlg.set('op', o); } }
        G.preview.add(previewMesh(this.tool, this.op));
        const M = Engine.FASTENERS[this.v.size];
        dlg.set('n', `M${fmtc(this.v.size, 1)} × ${fmtc(M[0], 2)} · ` + (bolt ? (this.v.head === 'socket' ? `hlava Ø ${fmtc(M[4], 1)} × ${fmtc(this.v.size, 1)} mm, imbus ${fmtc(M[5], 1)}` : this.v.head === 'slotted' || this.v.head === 'phillips' ? (h => `hlava Ø ${fmtc(h[0], 1)} × ${fmtc(h[1], 1)} mm`)(Engine.SCREW_HEADS[this.v.head][this.v.size]) : `klíč ${fmtc(M[1], 1)}, hlava ${fmtc(M[2], 1)} mm`) : `klíč ${fmtc(M[1], 1)}, výška ${fmtc(this.v.low ? (Engine.THIN_NUT[this.v.size] || M[3] * 0.6) : M[3], 1)} mm`));
        dlg.okEnabled(true);
      } catch (e) { dlg.set('n', '!' + e.message); dlg.okEnabled(false); }
      requestRender();
    },
    onClick(ev) {
      const h = hitBodies(ev); let p;
      if (h) p = h.point; else { ray.setFromCamera(evNdc(ev), cam()); p = ray.ray.intersectPlane(new THREE.Plane(new V3(0, 0, 1), 0), new V3()); }
      if (!p) return;
      this.pos = [snapV(p.x), snapV(p.y), Math.round(p.z * 1000) / 1000]; dlg.set('pos', this.pos); this.schedule();
    },
    onGizmo: null, onDragChange: null,
    ok() { if (!this.tool) return null; const out = this.feature(); out.id = f ? f.id : newId(); return out; },
    cleanup() {
      clearTimeout(this.timer);
      transform.removeEventListener('objectChange', this.onGizmo);
      transform.removeEventListener('dragging-changed', this.onDragChange);
      transform.detach(); transform.enabled = true; scene.remove(pivot); controls.enabled = true;
    }
  };
  c.onGizmo = () => { const p = pivot.position; c.pos = [snapV(p.x), snapV(p.y), snapV(p.z)]; dlg.set('pos', c.pos); };
  c.onDragChange = e => { controls.enabled = !e.value; c.gizmoDrag = e.value; if (!e.value) { pivot.position.set(c.pos[0], c.pos[1], c.pos[2]); c.schedule(); } };
  beginCmd(c); c.init();
}

/* ================= hinge ================= */
/* screw length for a hinge with a recessed head and nut: from the counterbore floor (d + 0.3 deep) through the nut */
function screwLen(L, d) { const F = Engine.FASTENERS[d]; return F ? Math.floor(L - (d + 0.3) - 0.3) : Math.floor(L); }
function startHinge(editIndex, f) {
  const pivot = new THREE.Object3D(); scene.add(pivot);
  const D0 = { kind: 'print', style: 'flush', len: 40, w: 15, t: 2.5, n: 3, pin: 3, tol: TOL_HINGE, holes: 2, hd: 3, part: 'both', rot: 0, count: 1, side: '+y', join: 'print', pinKind: 'fil', pinTight: false, recess: true, gap: 1, shift: 0, out: 'join', lift: 0 }; /* lift 0: test prints with 0.2 mm stayed ajar at the hinge */
  const c = {
    editIndex, tool: null, tools: null, gizmoDrag: false, timer: null,
    v: f ? { ...D0, style: 'out', pinTight: false, recess: false, ...f } : { ...D0 }, /* an older hinge keeps its free axle hole */
    pos: f && f.pos ? f.pos.slice() : [0, 0, 0], op: f && f.op ? f.op : 'new',
    box: f ? f.box || null : null, lid: f ? f.lid || null : null, pick: 'box', highlight: new Set(),
    init() {
      if (!f && sel.size === 2) { [this.box, this.lid] = [...sel]; }
      openDialog({
        title: 'Pant', icon: 'hinge',
        fields: [{ k: 'opt', id: 'kind', label: 'Typ', options: [['print', 'Samostatný, tištěný vcelku'], ['screw', 'Samostatný, na šroub'], ['closed', 'Krabička navržená zavřená'], ['box', 'Krabička a víko vedle sebe']], value: this.v.kind },
          { k: 'seg', id: 'join', label: 'Spojení', options: [['print', 'Tisk vcelku'], ['pin', 'Kolík / šroub']], value: this.v.join },
          { k: 'seg', id: 'pinKind', label: 'Kolík', options: [['fil', 'Filament 1,75'], ['m2', 'Šroub M2'], ['m3', 'Šroub M3']], value: this.v.pinKind },
          { k: 'chk', id: 'recess', label: 'Zapustit hlavu šroubu a matici', value: this.v.recess },
          { k: 'chk', id: 'pinTight', label: 'Filament natlačit do krajních kloubů (nevypadne)', value: this.v.pinTight },
          { k: 'opt', id: 'side', label: 'Strana pantu', options: [['+y', 'Zadní (+Y)'], ['-y', 'Přední (−Y)'], ['+x', 'Pravá (+X)'], ['-x', 'Levá (−X)']], value: this.v.side },
          { k: 'seg', id: 'style', label: 'Umístění', options: [['flush', 'Zapuštěný'], ['out', 'Na stěně']], value: this.v.style },
          { k: 'num', id: 'gap', label: 'Mezera mezi díly po rozložení', value: this.v.gap },
          { k: 'sel', id: 'box', label: 'Krabička' }, { k: 'sel', id: 'lid', label: 'Víko' },
          { k: 'num', id: 'len', label: 'Délka pantu', value: this.v.len },
          { k: 'opt', id: 'count', label: 'Počet pantů', options: [['1', '1'], ['2', '2'], ['3', '3']], value: String(this.v.count) },
          { k: 'num', id: 'shift', label: 'Posun podél hrany', value: this.v.shift, range: [-50, 50, 0.5] },
          { k: 'seg', id: 'out', label: 'Výsledek', options: [['join', 'Přidat k tělesům'], ['new', 'Nová tělesa']], value: this.v.out },
          { k: 'num', id: 'w', label: 'Šířka křídla', value: this.v.w },
          { k: 'num', id: 't', label: 'Tloušťka křídla', value: this.v.t },
          { k: 'seg', id: 'cnt', label: 'Počet kloubů', options: [['2', '2'], ['3', '3'], ['5', '5'], ['7', '7']], value: String(this.v.n) },
          { k: 'num', id: 'pin', label: this.v.kind === 'screw' ? 'Průměr šroubu v ose' : 'Průměr čepu', value: this.v.pin },
          { k: 'num', id: 'tol', label: 'Vůle pro 3D tisk', value: this.v.tol },
          { k: 'num', id: 'lift', label: 'Rezerva při zavření (osa nad okrajem)', value: this.v.lift },
          { k: 'opt', id: 'holes', label: 'Otvory v křídle', options: [['0', 'Žádné'], ['1', '1'], ['2', '2'], ['3', '3']], value: String(this.v.holes) },
          { k: 'opt', id: 'hd', label: 'Zápustné šrouby', options: [['2', 'M2'], ['2.5', 'M2,5'], ['3', 'M3'], ['4', 'M4']], value: String(this.v.hd) },
          { k: 'seg', id: 'part', label: 'Vytvořit', options: [['both', 'Celý pant'], ['a', 'Křídlo A'], ['b', 'Křídlo B']], value: this.v.part },
          { k: 'seg', id: 'rot', label: 'Osa pantu', options: [['0', 'Podél X'], ['90', 'Podél Y']], value: String(this.v.rot) },
          { k: 'xyz', id: 'pos', label: 'Poloha (střed osy)', value: this.pos },
          { k: 'opt', id: 'op', label: 'Operace', options: OPS, value: this.op }, { k: 'note', id: 'n' }, { k: 'note', id: 'n2' }, { k: 'note', id: 'n3' }],
        onSel: id => { this.pick = id; this.update(); },
        onChange: id => {
          if (id === 'pos') this.pos = dlg.get('pos');
          else if (id === 'op') this.op = dlg.get('op');
          else if (['kind', 'part', 'style', 'join', 'pinKind', 'side', 'out'].includes(id)) this.v[id] = dlg.get(id);
          else if (id === 'pinTight') this.v.pinTight = !!dlg.get('pinTight');
          else if (id === 'recess') this.v.recess = !!dlg.get('recess');
          else if (id === 'cnt') this.v.n = parseFloat(dlg.get('cnt'));
          else if (id === 'holes' || id === 'rot' || id === 'hd' || id === 'count') this.v[id] = parseFloat(dlg.get(id));
          else { const x = dlg.get(id); if (isFinite(x) && (x >= 0 || id === 'shift')) this.v[id] = x; }
          if (id === 'join' || id === 'style' || id === 'pinKind' || id === 'kind') this.layout();
          if (id === 'kind') {
            const l = $('#dialog [data-row="pin"] label'); if (l) l.textContent = this.v.kind === 'screw' ? 'Průměr šroubu v ose' : 'Průměr čepu';
            if (this.isBox() && this.v.len > 25) { this.v.len = 20; dlg.set('len', 20); }
            this.layout();
          }
          this.schedule();
        }
      });
      transform.setMode('translate'); transform.setSpace('world');
      transform.addEventListener('objectChange', this.onGizmo);
      transform.addEventListener('dragging-changed', this.onDragChange);
      this.layout();
      this.update();
    },
    isBox() { return this.v.kind === 'box' || this.v.kind === 'closed'; },
    isClosed() { return this.v.kind === 'closed'; },
    layout() {
      const bx = this.isBox(), cl = this.isClosed(), pin = cl && this.v.join === 'pin';
      for (const id of ['style', 'box', 'lid', 'count', 'shift', 'out']) dlg.show(id, bx);
      dlg.show('join', cl); dlg.show('side', cl); dlg.show('lift', bx && !pin); dlg.show('pinKind', pin); dlg.show('pinTight', pin && this.v.pinKind === 'fil'); dlg.show('recess', (pin && this.v.pinKind !== 'fil') || (!bx && this.v.kind === 'screw')); dlg.show('pin', !pin); dlg.show('gap', cl && !pin && this.v.style === 'flush');
      for (const id of ['w', 't', 'holes', 'hd', 'part', 'rot', 'pos', 'op']) dlg.show(id, !bx);
      if (bx) transform.detach(); else transform.attach(pivot);
      if (bx && !this.box) this.pick = 'box'; else if (bx && !this.lid) this.pick = 'lid';
    },
    feature() {
      const v = this.v;
      if (this.isClosed()) return { id: f ? f.id : 'tmp', type: 'hinge', kind: 'closed', style: v.style, side: v.side, join: v.join, pinKind: v.pinKind, pinTight: !!v.pinTight, recess: !!v.recess, gap: v.gap, box: this.box, lid: this.lid, len: v.len, n: v.n, pin: v.pin, tol: v.tol, count: v.count, shift: v.shift, out: v.out, lift: v.lift };
      if (this.isBox()) return { id: f ? f.id : 'tmp', type: 'hinge', kind: 'box', style: v.style, box: this.box, lid: this.lid, len: v.len, n: v.n, pin: v.pin, tol: v.tol, count: v.count, shift: v.shift, out: v.out, lift: v.lift };
      return { id: f ? f.id : 'tmp', type: 'hinge', kind: v.kind, len: v.len, w: v.w, t: v.t, n: v.n, pin: v.pin, tol: v.tol, holes: v.holes, hd: v.hd, part: v.part, rot: v.rot, recess: !!v.recess, pos: this.pos.slice(), op: this.op };
    },
    schedule() { clearTimeout(this.timer); dlg.set('n', 'Počítám…'); this.timer = setTimeout(() => this.update(), 150); },
    update() {
      clearGroup(G.preview); this.tool = null;
      const bx = this.isBox();
      this.highlight = new Set([this.box, this.lid].filter(Boolean)); styleBodies();
      if (bx) {
        const bb = this.box && bodyById(this.box), lb = this.lid && bodyById(this.lid);
        dlg.set('box', { text: bb ? bodyName(bb) : 'Klepněte na krabičku', has: !!bb, active: this.pick === 'box' });
        dlg.set('lid', { text: lb ? bodyName(lb) : 'Klepněte na víko', has: !!lb, active: this.pick === 'lid' });
        if (this.isClosed()) setPrompt(this.pick === 'box' ? 'Klepněte na zadní stěnu krabičky, kde má být pant. Víko má ležet na krabičce (zavřená krabička).' : 'Klepněte na víko, které leží na krabičce.');
        else setPrompt(this.pick === 'box' ? 'Klepněte na krabičku. Krabička a víko mají stát vedle sebe otevřené nahoru, horní hrany ve stejné výšce.' : 'Klepněte na víko, které stojí vedle krabičky.');
        if (!bb || !lb) { dlg.set('n', ''); dlg.set('n2', ''); dlg.set('n3', ''); dlg.okEnabled(false); requestRender(); return; }
      } else if (!this.gizmoDrag) pivot.position.set(this.pos[0], this.pos[1], this.pos[2]);
      try {
        const F = this.feature();
        this.hideBodies = null;
        if (this.isClosed()) {
          if (this.box === this.lid) throw new Error('Krabička a víko musí být dvě různá tělesa');
          const Rz = Engine.closedHingeResult(F, bodyById(this.box).polys, bodyById(this.lid).polys), H = Rz.T.H;
          this.tool = Rz.box.concat(Rz.lid, Rz.partA || [], Rz.partB || []); this.hideBodies = new Set([this.box, this.lid]); styleBodies();
          G.preview.add(previewMesh(this.tool, 'new'));
          dlg.set('n', `Kloub Ø ${fmtc(2 * H.R, 1)} mm, ${H.N} × ${fmtc(H.k, 1)} mm, vůle ${fmtc(H.c, 2)} mm`);
          dlg.set('n2', Rz.pinMode ? `Do kloubů patří ${this.v.pinKind === 'fil' ? 'kus filamentu 1,75 mm' : 'šroub ' + this.v.pinKind.toUpperCase()} dlouhý ${this.v.pinKind !== 'fil' && this.v.recess && H.k ? screwLen(H.L, this.v.pinKind === 'm2' ? 2 : 3) : Math.floor(H.L)} mm${this.v.pinKind === 'fil' ? (this.v.pinTight ? (H.N % 2 ? '; natlačte ho, v krajních kloubech drží napevno' : '; natlačte ho, v prvním kloubu drží napevno') : '; konce zatavte nebo zaklepněte') : (this.v.recess ? ' s válcovou nebo půlkulatou hlavou a maticí, obě se zapustí do krajních kloubů' : ' s maticí')}.` : `Víko je odklopené o 180° vedle krabičky, mezera ${fmtc(Rz.T.G, 1)} mm.`);
          dlg.set('n3', Rz.pinMode ? 'Krabička a víko se tisknou zvlášť (víko otočte otevřenou stranou nahoru). Pant je navržený pro zavřenou polohu, víko proto vždy dosedne.' : 'Tiskne se vcelku bez podpěr. Pant je navržený pro zavřenou polohu, víko proto po překlopení přesně dosedne.');
        } else if (bx) {
          if (this.box === this.lid) throw new Error('Krabička a víko musí být dvě různá tělesa');
          const T = Engine.boxHingeTools(F, bodyById(this.box).polys, bodyById(this.lid).polys), H = T.H;
          this.tool = T.A.concat(T.B);
          G.preview.add(previewMesh(this.tool, 'join'));
          dlg.set('n', `Kloub Ø ${fmtc(2 * H.R, 1)} mm, ${H.N} × ${fmtc(H.k, 1)} mm, mezera ${fmtc(H.c, 2)} mm`);
          dlg.set('n2', T.flush ? `Mezera mezi krabičkou a víkem ${fmtc(T.G, 1)} mm (nejvýš ${fmtc(Math.floor(2 * (H.R - 0.6) * 10) / 10, 1)} mm).` : `Mezera mezi krabičkou a víkem ${fmtc(T.G, 1)} mm (nejméně ${fmtc(2 * (H.R + H.c), 1)} mm).`);
          dlg.set('n3', T.flush ? 'Klouby jsou zapuštěné do horní hrany obou stěn, zevnitř je podél pantu žebro. Tiskne se vcelku bez podpěr; víko se po tisku překlopí o 180°.' : 'Tiskne se vcelku bez podpěr; víko se po tisku překlopí o 180° na krabičku.');
        } else {
          setPrompt('Pant leží naplocho v poloze pro tisk. Klepnutím do pohledu ho umístíte, manipulátorem posunete.');
          const H = Engine.hingeDims(F);
          this.tool = Engine.toolForHinge(F);
          G.preview.add(previewMesh(this.tool, this.op));
          dlg.set('n', `Kloub Ø ${fmtc(2 * H.R, 1)} mm, ${H.N} × ${fmtc(H.k, 1)} mm, mezera ${fmtc(H.c, 2)} mm`);
          dlg.set('n2', H.screw ? `Do osy šroub M${fmtc(H.pd, 1)} × ${this.v.recess && Engine.FASTENERS[H.pd] ? screwLen(H.L, H.pd) + ' mm s válcovou nebo půlkulatou hlavou a maticí, obě se zapustí do krajních kloubů' : Math.ceil(H.L + 2) + ' mm s maticí'}.` : 'Tiskne se vcelku bez podpěr; po tisku pant několikrát protočte, aby se uvolnil.');
          dlg.set('n3', this.op === 'new' ? '' : this.v.part === 'both' ? 'Pro připojení ke dvěma tělesům vytvořte zvlášť křídlo A a křídlo B ve stejné poloze.' : `Osu dejte alespoň ${fmtc(H.R + H.c + 0.1, 1)} mm za hranu tělesa, jinak se ho dotknou i klouby druhého křídla.`);
        }
        dlg.okEnabled(true);
      } catch (e) { this.hideBodies = null; styleBodies(); dlg.set('n', '!' + e.message); dlg.set('n2', ''); dlg.set('n3', ''); dlg.okEnabled(false); }
      requestRender();
    },
    onMove(ev) { if (this.isBox()) { const h = hitBodies(ev); dom.style.cursor = h ? 'pointer' : ''; } },
    onClick(ev) {
      const h = hitBodies(ev);
      if (this.isBox()) {
        if (!h) return;
        const id = h.object.userData.bodyId;
        /* closed box: the wall clicked on the box picks the hinge side */
        if (this.isClosed() && this.pick === 'box' && h.face) {
          const nn = h.face.normal.clone().transformDirection(h.object.matrixWorld);
          if (Math.abs(nn.z) < 0.3) { const sd = Math.abs(nn.x) > Math.abs(nn.y) ? (nn.x > 0 ? '+x' : '-x') : (nn.y > 0 ? '+y' : '-y'); this.v.side = sd; dlg.set('side', sd); }
        }
        if (this.pick === 'box') { this.box = id; if (this.lid === id) this.lid = null; this.pick = this.lid ? 'box' : 'lid'; }
        else { this.lid = id; if (this.box === id) this.box = null; this.pick = this.box ? 'lid' : 'box'; }
        this.schedule(); this.update(); return;
      }
      let p;
      if (h) p = h.point; else { ray.setFromCamera(evNdc(ev), cam()); p = ray.ray.intersectPlane(new THREE.Plane(new V3(0, 0, 1), 0), new V3()); }
      if (!p) return;
      this.pos = [snapV(p.x), snapV(p.y), Math.round(p.z * 1000) / 1000]; dlg.set('pos', this.pos); this.schedule();
    },
    onGizmo: null, onDragChange: null,
    ok() { if (!this.tool) return null; const out = this.feature(); out.id = f ? f.id : newId(); return out; },
    cleanup() {
      clearTimeout(this.timer);
      transform.removeEventListener('objectChange', this.onGizmo);
      transform.removeEventListener('dragging-changed', this.onDragChange);
      transform.detach(); transform.enabled = true; scene.remove(pivot); controls.enabled = true;
      this.highlight = null; this.hideBodies = null; styleBodies();
    }
  };
  c.onGizmo = () => { const p = pivot.position; c.pos = [snapV(p.x), snapV(p.y), snapV(p.z)]; dlg.set('pos', c.pos); };
  c.onDragChange = e => { controls.enabled = !e.value; c.gizmoDrag = e.value; if (!e.value) { pivot.position.set(c.pos[0], c.pos[1], c.pos[2]); c.schedule(); } };
  beginCmd(c); c.init();
}

/* ================= latch (box designed closed) ================= */
function startLatch(editIndex, f) {
  const D0 = { style: 'out', side: '-y', width: 12, count: 1, shift: 0, tol: TOL_HINGE, wall: 2, out: 'join', lever: 16, axle: 'screw', snug: true };
  const c = {
    editIndex, tool: null, timer: null, v: f ? { ...D0, snug: false, ...f } : { ...D0 }, /* an older latch keeps its play */
    box: f ? f.box : null, lid: f ? f.lid : null, pick: 'box', highlight: new Set(),
    init() {
      if (!f && sel.size === 2) [this.box, this.lid] = [...sel];
      openDialog({
        title: 'Západka', icon: 'latch',
        /* the swivel-lever latches were withdrawn; they stay only for editing an older document that uses them */
        fields: [{ k: 'opt', id: 'style', label: 'Provedení', options: [['out', 'Pružná na stěně'], ['flush', 'Pružná zasunutá'], ['flip', 'Sklopná na ose na stěně'], ['flipflush', 'Sklopná na ose zapuštěná']].concat(f && (f.style === 'rot' || f.style === 'rotflush') ? [['rot', 'Otočná páčka na stěně'], ['rotflush', 'Otočná páčka zapuštěná']] : []), value: this.v.style },
          { k: 'sel', id: 'box', label: 'Krabička' }, { k: 'sel', id: 'lid', label: 'Víko' },
          { k: 'opt', id: 'side', label: 'Strana', options: [['-y', 'Přední (−Y)'], ['+y', 'Zadní (+Y)'], ['+x', 'Pravá (+X)'], ['-x', 'Levá (−X)']], value: this.v.side },
          { k: 'num', id: 'width', label: 'Šířka západky', value: this.v.width },
          { k: 'num', id: 'lever', label: 'Délka páčky', value: this.v.lever },
          { k: 'seg', id: 'axle', label: 'Osa', options: [['screw', 'Šroub M3'], ['fil', 'Filament 1,75']], value: this.v.axle === 'print' ? 'screw' : this.v.axle },
          { k: 'seg', id: 'axleF', label: 'Osa', options: [['screw', 'Šroub M3'], ['fil', 'Filament 1,75'], ['print', 'Tisk vcelku']], value: this.v.axle },
          { k: 'opt', id: 'count', label: 'Počet', options: [['1', '1'], ['2', '2'], ['3', '3']], value: String(this.v.count) },
          { k: 'num', id: 'shift', label: 'Posun podél hrany', value: this.v.shift, range: [-50, 50, 0.5] },
          { k: 'num', id: 'wall', label: 'Tloušťka stěny krabičky', value: this.v.wall },
          { k: 'num', id: 'tol', label: 'Vůle pro 3D tisk', value: this.v.tol },
          { k: 'chk', id: 'snug', label: 'Víko bez vůle (háček víko přitáhne)', value: this.v.snug },
          { k: 'seg', id: 'out', label: 'Výsledek', options: [['join', 'Přidat k tělesům'], ['new', 'Nová tělesa']], value: this.v.out },
          { k: 'note', id: 'n' }, { k: 'note', id: 'n2' }],
        onSel: id => { this.pick = id; this.update(); },
        onChange: id => {
          if (['style', 'side', 'out', 'axle'].includes(id)) this.v[id] = dlg.get(id);
          else if (id === 'axleF') this.v.axle = dlg.get('axleF');
          else if (id === 'snug') this.v.snug = !!dlg.get('snug');
          else if (id === 'count') this.v.count = parseFloat(dlg.get('count'));
          else { const x = dlg.get(id); if (isFinite(x) && (x >= 0 || id === 'shift')) this.v[id] = x; }
          if (id === 'style') { const cat = this.isFlip() ? 'flip' : this.isRot() ? 'rot' : 'spring'; if (cat !== this.cat) { const w = { flip: 16, rot: 7, spring: 12 }[cat]; this.v.width = w; dlg.set('width', w); } this.cat = cat; this.layout(); }
          this.schedule();
        }
      });
      this.cat = this.isFlip() ? 'flip' : this.isRot() ? 'rot' : 'spring';
      this.layout();
      this.update();
    },
    isRot() { return this.v.style === 'rot' || this.v.style === 'rotflush'; },
    isFlip() { return this.v.style === 'flip' || this.v.style === 'flipflush'; },
    layout() {
      const rot = this.isRot(), flip = this.isFlip();
      dlg.show('wall', this.v.style !== 'out' && this.v.style !== 'flip'); dlg.show('snug', !rot); dlg.show('lever', rot); dlg.show('axle', rot); dlg.show('axleF', this.v.style === 'flip');
      if (rot && this.v.axle === 'print') { this.v.axle = 'screw'; dlg.set('axle', 'screw'); }
      dlg.set(rot ? 'axle' : 'axleF', this.v.axle); dlg.show('out', !rot && !flip);
      const l = $('#dialog [data-row="width"] label'); if (l) l.textContent = rot ? 'Šířka páčky' : 'Šířka západky';
    },
    feature() { const v = this.v; return { id: f ? f.id : 'tmp', type: 'latch', style: v.style, side: v.side, width: v.width, count: v.count, shift: v.shift, tol: v.tol, snug: !!v.snug, wall: v.wall, out: v.out, lever: v.lever, axle: v.axle, box: this.box, lid: this.lid }; },
    schedule() { clearTimeout(this.timer); dlg.set('n', 'Počítám…'); this.timer = setTimeout(() => this.update(), 150); },
    update() {
      clearGroup(G.preview); this.tool = null;
      this.highlight = new Set([this.box, this.lid].filter(Boolean)); styleBodies();
      const bb = this.box && bodyById(this.box), lb = this.lid && bodyById(this.lid);
      dlg.set('box', { text: bb ? bodyName(bb) : 'Klepněte na krabičku', has: !!bb, active: this.pick === 'box' });
      dlg.set('lid', { text: lb ? bodyName(lb) : 'Klepněte na víko', has: !!lb, active: this.pick === 'lid' });
      setPrompt(this.pick === 'box' ? 'Klepněte na stěnu krabičky, kde má být západka. Víko leží na krabičce, nebo je připojené pantem krabičky.' : 'Klepněte na víko.');
      if (!bb || !lb) { dlg.set('n', ''); dlg.set('n2', ''); dlg.okEnabled(false); requestRender(); return; }
      try {
        if (this.box === this.lid) throw new Error('Krabička a víko musí být dvě různá tělesa');
        const Rz = Engine.latchApply(this.feature(), bb, lb);
        this.tool = Rz.preview.concat(Rz.previewCut);
        if (Rz.preview.length) G.preview.add(previewMesh(Rz.preview, 'join'));
        if (Rz.previewCut.length) G.preview.add(previewMesh(Rz.previewCut, 'cut'));
        const st = this.v.style;
        dlg.set('n', st === 'flush' ? 'Z víka do krabičky zajede pružný jazýček, jeho výstupek zaskočí do drážky ve stěně krabičky. Zvenku není vidět.'
          : st === 'out' ? 'Z víka visí přes stěnu krabičky pružný jazýček, jeho zobáček zaskočí pod lištu na krabičce. Otevře se zatažením za jazýček.'
          : st === 'flip' || st === 'flipflush' ? 'Jazýček visí na ose v očkách víka, sklopí se shora dolů a jeho háček zajede pod lištu na krabičce. Spodní strana lišty je podříznutá, takže tah víka háček přitlačí ke stěně. Otevře se zatažením za spodní okraj jazýčku.' + (st === 'flipflush' ? ' Jazýček leží v kapse zarovnaný se stěnou.' : '')
          : 'Páčka se otáčí na ose ve stěně víka a visí dolů přes krabičku; výřezem na konci zachytí kolík na krabičce. Odklopením páčky stranou (o 90°) se víko uvolní.' + (st === 'rotflush' ? ' Páčka leží v kapse zarovnaná se stěnou.' : ''));
        const W = this.v.width;
        dlg.set('n2', (st === 'flip' && this.v.axle === 'print' ? 'Jazýček se tiskne vcelku s víkem: je přiklopený nahoru ke stěně víka a stojí na podložce, osu tvoří tištěné kuželové čepy v očkách. Po tisku ho sklopte dolů. '
          : st === 'flip' ? `Jazýček je samostatné těleso, tiskněte ho naležato na vnější ploše; osa: ${this.v.axle === 'fil' ? `kus filamentu 1,75 mm dlouhý ${W} mm (natlačit do oček)` : `šroub M3 × ${Math.max(6, W - 2)} mm (samořezný do vzdálenějšího očka)`}. `
          : st === 'flipflush' ? `Jazýček je samostatné těleso, tiskněte ho naležato na vnější ploše; do jeho očka vlepte kus filamentu 1,75 mm dlouhý ${W} mm a jazýček zacvakněte zvenku do zářezů na koncích kapsy. ` : '')
          + (st === 'rot' || st === 'rotflush' ? `Páčka je samostatné těleso, tiskněte ji naležato; osa: ${this.v.axle === 'fil' ? 'kus filamentu 1,75 mm (natlačit do díry ve víku)' : 'samořezný šroub M3 do díry ve víku'}. ` : st.startsWith('flip') ? '' : 'Všechny převisy jsou 45°, tiskne se bez podpěr. ') + (Rz.fold ? 'Víko je připojené pantem; západka se spočítala na zavřené krabičce a víko zůstalo odklopené.' : ''));
        dlg.okEnabled(true);
      } catch (e) { dlg.set('n', '!' + e.message); dlg.set('n2', ''); dlg.okEnabled(false); }
      requestRender();
    },
    onMove(ev) { const h = hitBodies(ev); dom.style.cursor = h ? 'pointer' : ''; },
    onClick(ev) {
      const h = hitBodies(ev); if (!h) return;
      const id = h.object.userData.bodyId;
      if (this.pick === 'box' && h.face) {
        const nn = h.face.normal.clone().transformDirection(h.object.matrixWorld);
        if (Math.abs(nn.z) < 0.3) { const sd = Math.abs(nn.x) > Math.abs(nn.y) ? (nn.x > 0 ? '+x' : '-x') : (nn.y > 0 ? '+y' : '-y'); this.v.side = sd; dlg.set('side', sd); }
      }
      if (this.pick === 'box') { this.box = id; if (this.lid === id) this.lid = null; this.pick = this.lid ? 'box' : 'lid'; }
      else { this.lid = id; if (this.box === id) this.box = null; this.pick = this.box ? 'lid' : 'box'; }
      this.schedule(); this.update();
    },
    ok() { if (!this.tool) return null; const out = this.feature(); out.id = f ? f.id : newId(); return out; },
    cleanup() { clearTimeout(this.timer); this.highlight = null; styleBodies(); }
  };
  beginCmd(c); c.init();
}

/* ================= simulation: opening and closing a box =================
   The lid turns about its hinge axis (swing, stored by the box hinge); levers and flaps of latches (pivot) turn first
   and then ride on the lid. Without a hinge the lid lifts straight up. Clashes are checked on sampled positions. */
function startSimulate(editIndex, ef) {
  const LIFT = 20;
  const c = {
    editIndex,
    lid: null, prog: 0, anim: null, scan: null, clash: [], moved: new Set(), clashIds: new Set(), info: null,
    init() {
      const cands = cur.bodies.filter(b => b.swing || cur.bodies.some(r => r.rides === b.id) || doc.features.some(f => (f.type === 'latch' || f.type === 'hinge') && f.lid === b.id));
      const picked = [...sel].find(id => cands.some(b => b.id === id));
      this.lid = (ef && ef.lid) || picked || (cands[0] && cands[0].id) || null;
      openDialog({ title: 'Simulace', icon: 'simulate', fields: [{ k: 'sel', id: 'lid', label: 'Víko' },
        { k: 'num', id: 'prog', label: 'Průběh', unit: '%', value: 0, range: [0, 100, 1] },
        { k: 'btns', id: 'go', label: 'Přehrát', options: [['open', 'Otevřít'], ['close', 'Zavřít'], ['loop', 'Dokola']] },
        { k: 'note', id: 'n' }, { k: 'note', id: 'n2' },
        { k: 'chk', id: 'keep', label: 'Po zavření dialogu nechat krabičku zavřenou', value: !!ef && ef.state !== 'open' },
        { k: 'chk', id: 'keepO', label: 'Po zavření dialogu nechat krabičku otevřenou', value: !!ef && ef.state === 'open' }],
        onSel: () => {},
        onBtn: (id, v) => this.play(v),
        onChange: id => { if (id === 'prog') { const x = dlg.get('prog'); if (isFinite(x)) { this.stop(); this.prog = Math.max(0, Math.min(100, x)); this.pose(); } } }
      });
      dlg.okLabel('Zavřít');
      this.setup();
    },
    setup() {
      this.stop(); this.reset(); this.settle = 0; this.gapHinge = 0; this.smax = 0; this.noted = false;
      const lb = this.lid && bodyById(this.lid);
      dlg.set('lid', { text: lb ? bodyName(lb) : 'Klepněte na víko', has: !!lb, active: true });
      if (!lb) { dlg.set('n', '!Klepněte na víko. Simulace potřebuje víko připojené pantem krabičky nebo víko se západkou na ose.'); dlg.set('n2', ''); this.info = null; requestRender(); return; }
      const riders = cur.bodies.filter(b => b.rides === lb.id), levers = riders.filter(b => b.pivot);
      const I = new THREE.Matrix4();
      let O = I, U = I, axis = null, pt = null, sg = 1, Phi = 0;
      if (lb.swing) {
        const e = lb.swing.M; U = new THREE.Matrix4().fromArray(e);
        if (!lb.swing.open) O = U;
        const i = [0, 5, 10].findIndex(k => e[k] > 0.5);
        axis = new THREE.Vector3(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0);
        pt = new THREE.Vector3(e[12] / 2, e[13] / 2, e[14] / 2 + (lb.swing.lift || 0));
        /* the lid as printed (open, lying beside the box) and the way it swings up */
        const bb = K.bbox(lb.polys), cs = [];
        const OB = O.clone(); if (lb.unpose) OB.multiply(new THREE.Matrix4().fromArray(lb.unpose));
        for (const x of [bb.min[0], bb.max[0]]) for (const y of [bb.min[1], bb.max[1]]) for (const z of [bb.min[2], bb.max[2]]) cs.push(new THREE.Vector3(x, y, z).applyMatrix4(OB));
        const ctr = cs.reduce((acc, v) => acc.add(v), new THREE.Vector3()).multiplyScalar(1 / 8);
        const up = a => ctr.clone().sub(pt).applyAxisAngle(axis, a).z;
        sg = up(Math.PI / 2) >= up(-Math.PI / 2) ? 1 : -1;
        /* with the axis above the rim the lid turns a little past 180° until its front edge reaches the rim */
        const ob = new THREE.Box3().setFromPoints(cs), rim = [];
        for (const x of [ob.min.x, ob.max.x]) for (const y of [ob.min.y, ob.max.y]) rim.push(new THREE.Vector3(x, y, lb.swing.zp));
        /* closed, the lid settles down in the play of the knuckles by s (found by the scan: as far as it goes without
           running into the box, at most until it lies level on the rim), then tips a little past 180° until its front
           edge reaches the rim; the gap left at the hinge is reported */
        const lift = lb.swing.lift || 0, zp = lb.swing.zp;
        this.solve = s => {
          const at = (v, d) => v.clone().sub(pt).applyAxisAngle(axis, sg * (180 + d) * Math.PI / 180).z + pt.z - s;
          const low = d => Math.min(...rim.map(v => at(v, d))) - zp;
          let P = 180;
          if (lift > 1e-6 && low(0) > 1e-6 && low(10) < 0) { let d0 = 0, d1 = 10; for (let k = 0; k < 40; k++) { const m = (d0 + d1) / 2; if (low(m) > 0) d0 = m; else d1 = m; } P = 180 + d0; }
          return { Phi: P, gap: Math.max(0, Math.max(...rim.map(v => at(v, P - 180))) - zp) };
        };
        this.smax = lift > 1e-6 ? Math.min(lb.swing.play || 0, 2 * lift) : 0;
        const r0 = this.solve(0); Phi = r0.Phi; this.gapHinge = r0.gap;
      }
      const other = cur.bodies.filter(b => b.id !== lb.id && b.rides !== lb.id && isVis(b.id));
      const spring = doc.features.some(f => f.type === 'latch' && f.lid === lb.id && (f.style === 'out' || f.style === 'flush'));
      this.info = { lb, riders, levers, O, U, axis, pt, sg, Phi, other, spring, tA: levers.length ? 30 : 0 };
      for (const b of [lb, ...riders]) this.moved.add(b.id);
      this.note(false);
      /* the lid stands open (as printed, or opened by an earlier step) or closed: offer the other state */
      const isOpen = lb.posed ? lb.posed === 'open' : !!(lb.swing && lb.swing.open);
      this.isOpen = isOpen;
      dlg.show('keep', !!lb.swing && isOpen); dlg.show('keepO', !!lb.swing && !isOpen);
      this.pose(); this.startScan();
    },
    note(done) {
      const S = this.info, lb = S.lb;
      dlg.set('n', (lb.swing ? 'Víko se otáčí na ose pantu' : 'Víko nemá pant krabičky, simulace ho jen zvedne') + (S.levers.length ? '; nejdřív se odklopí ' + (S.levers.length === 1 ? 'západka' : 'západky') + '.' : '.')
        + (lb.swing && (lb.swing.lift || 0) > 1e-6 && done ? ` Zavřené víko si ve vůli kloubů sedne o ${fmtc(this.settle, 2)} mm; ` + (this.gapHinge > 0.02 ? `u pantu zůstane mezera ${fmtc(this.gapHinge, 2)} mm (osa pantu je ${fmtc(lb.swing.lift, 2)} mm nad okrajem).` : 'dosedne celé.') : ''));
    },
    /* the pose at progress t (0–100): matrices for the lid, its riders and the levers */
    mats(t) {
      const S = this.info, I = new THREE.Matrix4();
      const fa = S.tA ? Math.min(1, t / S.tA) : 1, fb = Math.max(0, (t - S.tA) / (100 - S.tA));
      let L, Uc = S.U;
      if (S.axis) {
        const a = S.sg * S.Phi * (1 - fb) * Math.PI / 180;
        L = new THREE.Matrix4().makeTranslation(S.pt.x, S.pt.y, S.pt.z - (this.settle || 0) * (1 - fb)).multiply(new THREE.Matrix4().makeRotationAxis(S.axis, a)).multiply(new THREE.Matrix4().makeTranslation(-S.pt.x, -S.pt.y, -S.pt.z));
      } else L = new THREE.Matrix4().makeTranslation(0, 0, fb * LIFT);
      const out = new Map(), base = b => (b.unpose ? new THREE.Matrix4().fromArray(b.unpose) : new THREE.Matrix4());
      out.set(S.lb.id, L.clone().multiply(S.O).multiply(base(S.lb)));
      for (const r of S.riders) {
        if (r.pivot) {
          const p = r.pivot, d = new THREE.Vector3(...p.d).normalize();
          const P = new THREE.Matrix4().makeTranslation(p.p[0], p.p[1], p.p[2]).multiply(new THREE.Matrix4().makeRotationAxis(d, (fa * (p.rest || p.a) - (p.rest || 0)) * Math.PI / 180)).multiply(new THREE.Matrix4().makeTranslation(-p.p[0], -p.p[1], -p.p[2]));
          out.set(r.id, L.clone().multiply(Uc).multiply(P).multiply(r.openPose ? Uc : new THREE.Matrix4()).multiply(base(r)));
        } else out.set(r.id, (r.openPose ? L.clone().multiply(S.O) : L.clone().multiply(Uc)).multiply(base(r)));
      }
      return { out, angle: S.axis ? fb * S.Phi : fb * LIFT, fa, fb };
    },
    pose() {
      const S = this.info; if (!S) return;
      const { out, angle, fa } = this.mats(this.prog);
      for (const [id, M] of out) { const e = meshes.get(id); if (!e) continue; e.mesh.matrixAutoUpdate = false; e.mesh.matrix.copy(M); e.mesh.matrixWorldNeedsUpdate = true; }
      dlg.set('prog', Math.round(this.prog));
      const lv = S.levers.length ? `západka ${Math.round(fa * 100)} % · ` : '';
      dlg.set('n2', this.scan ? `${lv}víko ${S.axis ? Math.round(angle) + '°' : fmtc(angle, 1) + ' mm'} · ${/%$/.test(this.scan) ? 'kontroluji kolize… ' + this.scan : 'počítám usazení víka…'}` : this.clashText(lv, angle));
      /* clashing bodies near this position turn red */
      const k = this.clash.find(q => Math.abs(q.t - this.prog) <= q.step / 2 + 0.01);
      this.clashIds = new Set(k ? k.ids : []);
      styleBodies();
      for (const id of this.clashIds) { const e = meshes.get(id); if (e) { e.mesh.material.color.copy(tok.body).lerp(tok.danger, 0.6); e.edges.material.color.copy(tok.danger); } }
      requestRender();
    },
    clashText(lv, angle) {
      const S = this.info, pos = `${lv}víko ${S.axis ? Math.round(angle) + '°' : fmtc(angle, 1) + ' mm'}`;
      if (!this.done) return pos;
      const bad = this.clash.filter(q => q.ids.length), snap = this.clash.some(q => q.snap) ? ' Pružná západka těsně před zavřením zaskočí (tam se díly krátce překrývají, to je v pořádku).' : '';
      if (!bad.length) return pos + ' · bez kolizí v celém rozsahu.' + snap;
      const desc = bad.map(q => q.label).filter((x, i, a) => a.indexOf(x) === i);
      return '!' + pos + ' · kolize: ' + desc.slice(0, 6).join(', ') + (desc.length > 6 ? '…' : '') + '.' + snap;
    },
    startScan() {
      const S = this.info; this.clash = []; this.done = false;
      const steps = [];
      if (S.tA) for (let i = 1; i <= 8; i++) steps.push({ t: S.tA * i / 8, step: S.tA / 8 });
      /* the lid: finely near the closed position (snapping latches, the hinge), then every 5° */
      const fbs = S.axis ? [0, 1, 2, 3, 4, 6, 8, 10].map(a => a / S.Phi) : [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1];
      if (S.axis) for (let a = 15; a < S.Phi; a += 5) fbs.push(a / S.Phi);
      if (S.axis) fbs.push(1);
      fbs.forEach((fb, i) => { const t = S.tA + (100 - S.tA) * fb, nb = fbs[i + 1] !== undefined ? fbs[i + 1] : fb, pb = i ? fbs[i - 1] : fb; steps.push({ t, step: Math.max(0.5, (100 - S.tA) * (nb - pb)) }); });
      const moving = [S.lb, ...S.riders], token = {}; this.scanTok = token;
      /* a clash is a real overlap: some volume and thicker than a rounding sliver in every direction */
      const vol = (a, b) => { if (!Engine.overlaps(a, b)) return 0; const i = K.boolean(a, b, 'intersect'); if (!i.length) return 0; const bb = K.bbox(i); return Math.min(bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]) < 0.03 ? 0 : K.signedVolume(i); };
      let i = 0, lo = 0, hi = this.smax || 0, it = S.axis && hi > 0 ? 7 : 0;
      const closedClash = s => { const r = this.solve(s); S.Phi = r.Phi; this.settle = s; const M = this.mats(S.tA).out.get(S.lb.id); const P = K.transform(S.lb.polys, M.elements); return S.other.some(o => vol(P, o.polys) > 0.05); };
      if (it && !closedClash(hi)) { lo = hi; it = 0; }
      const next = () => {
        if (this.scanTok !== token || cmd !== this) return;
        if (it > 0) { const m = (lo + hi) / 2; if (closedClash(m)) hi = m; else lo = m; it--; this.scan = 'usazení víka'; dlg && this.pose(); setTimeout(next, 0); return; }
        if (!this.noted) { if (S.axis) { const r = this.solve(lo); S.Phi = r.Phi; this.settle = lo; this.gapHinge = r.gap; } this.note(true); this.noted = true; }
        if (i >= steps.length) { this.scan = null; this.done = true; this.pose(); return; }
        const st = steps[i++], { out, angle, fa } = this.mats(st.t), ids = new Set();
        const P = new Map(moving.map(b => [b.id, K.transform(b.polys, out.get(b.id).elements)]));
        for (const m of moving) {
          for (const o of S.other) if (vol(P.get(m.id), o.polys) > 0.05) { ids.add(m.id); ids.add(o.id); }
          /* levers turn against the lid while they swing open */
          if (m.pivot && st.t <= S.tA + 1e-9 && vol(P.get(m.id), P.get(S.lb.id)) > 0.05) { ids.add(m.id); ids.add(S.lb.id); }
        }
        const lbl = st.t <= S.tA + 1e-9 && S.tA ? `západka ${Math.round(fa * 100)} %` : (S.axis ? Math.round(angle) + '°' : fmtc(angle, 1) + ' mm');
        const snap = S.spring && st.t > S.tA && angle < (S.axis ? 8 : 6);
        this.clash.push({ t: st.t, step: st.step, ids: snap ? [] : [...ids], snap: snap && ids.size > 0, label: lbl });
        this.scan = Math.round(i / steps.length * 100) + ' %';
        dlg && this.pose();
        setTimeout(next, 0);
      };
      this.scan = '0 %'; setTimeout(next, 30);
    },
    play(mode) {
      this.stop();
      let dir = mode === 'close' ? -1 : 1, last = performance.now();
      const run = now => {
        if (cmd !== this) return;
        const dt = Math.min(0.1, (now - last) / 1000); last = now;
        this.prog += dir * dt * 25;
        if (this.prog >= 100) { this.prog = 100; if (mode === 'loop') dir = -1; else { this.pose(); this.anim = null; return; } }
        if (this.prog <= 0) { this.prog = 0; if (mode === 'loop') dir = 1; else { this.pose(); this.anim = null; return; } }
        this.pose(); this.anim = requestAnimationFrame(run);
      };
      this.anim = requestAnimationFrame(run);
    },
    stop() { if (this.anim) cancelAnimationFrame(this.anim); this.anim = null; },
    reset() {
      for (const id of this.moved) { const e = meshes.get(id); if (e) { e.mesh.matrixAutoUpdate = true; e.mesh.matrix.identity(); e.mesh.position.set(0, 0, 0); e.mesh.rotation.set(0, 0, 0); e.mesh.updateMatrix(); } }
      this.moved = new Set(); this.clashIds = new Set(); styleBodies();
    },
    onMove(ev) { const h = hitBodies(ev); dom.style.cursor = h ? 'pointer' : ''; },
    onClick(ev) { const h = hitBodies(ev); if (!h) return; const id = h.object.userData.bodyId, b = bodyById(id); this.lid = b && b.rides ? b.rides : id; this.prog = 0; this.setup(); },
    /* keep closed: a feature that turns the lid (and its levers and parts) shut, as the simulation shows it */
    ok() {
      const S = this.info;
      const want = !S || !S.lb.swing ? null : this.isOpen ? (dlg.get('keep') ? 'closed' : null) : (dlg.get('keepO') ? 'open' : null);
      if (!want) { endCmd(false); return null; }
      if (this.solve && !this.noted) { const r = this.solve(this.settle || 0); S.Phi = r.Phi; }
      const { out } = this.mats(want === 'closed' ? 0 : 100), mats = {};
      for (const [id, M] of out) mats[id] = Array.from(M.elements).map(x => Math.round(x * 1e9) / 1e9);
      return { id: ef ? ef.id : newId(), type: 'boxpose', state: want, lid: S.lb.id, mats };
    },
    cleanup() { this.stop(); this.scanTok = null; this.reset(); requestRender(); }
  };
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
    /* arrow keys: shift by a step along X / Y (PageUp / PageDown along Z) */
    nudge(v) {
      this.t = this.t.map((x, k) => Math.round((x + v[k]) * 1e4) / 1e4); dlg.set('t', this.t);
      if (this.dir !== 'free') { this.dir = 'free'; dlg.set('dir', 'free'); }
      this.fields(); this.apply(true);
    },
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
    cleanup(applied) {
      transform.removeEventListener('objectChange', this.onGizmo);
      transform.removeEventListener('dragging-changed', this.onDragChange);
      transform.detach(); scene.remove(pivot);
      resetBodyMatrices(applied);
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
  /* a face split by dividing lines (Rozdělit plochu): only the part under the pointer */
  const body = cur.bodies.find(b => b.id === bodyId), at = h.point.toArray();
  const clip = body && body.seams ? Engine.faceClip(polys, body.seams, poly.n, poly.w, group, at) : [];
  const cpolys = clip.length ? Engine.clipRegion(polys, group, clip) : null;
  const area = cpolys ? K.surfaceArea(cpolys) : group.reduce((s, i) => s + K.surfaceArea([polys[i]]), 0);
  const r6 = x => Math.round(x * 1e6) / 1e6;
  return { bodyId, polys, kind: 'plane', group, n: poly.n.slice(), w: poly.w, p: cen, area,
    ...(cpolys ? { clip: clip.map(q => ({ m: q.m.map(r6), d: r6(q.d) })), cpolys, ck: clip.map(q => (q.d > 0 ? '+' : '-') + q.m.map(v => v.toFixed(3)).join()).join('|') } : {}) };
}
/* polygons of a selected face (only its part when the face is split) */
const facePolys = face => face.cpolys || face.group.map(i => face.polys[i]);
const faceKey = face => (face ? face.bodyId + ':' + face.kind + ':' + face.group[0] + ':' + face.group.length + ':' + (face.ck || '') : '');
function faceMesh(face, color, opacity) {
  const m = meshFromPolys(facePolys(face), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  noRay(m); m.renderOrder = 6; return m;
}
const faceGroup = new THREE.Group(); scene.add(faceGroup);
function drawFaces() {
  clearGroup(faceGroup);
  if (hoverFace && faceKey(hoverFace) !== faceKey(selFace)) faceGroup.add(faceMesh(hoverFace, tok['accent-hover'], 0.3));
  if (selFace) faceGroup.add(faceMesh(selFace, tok.accent, 0.5));
  requestRender();
}
/* action bar for the selected face (works on touch screens, where there is no right click) */
let faceBarKey = '';
function syncFaceBar() {
  const bar = $('#facebar'); if (!bar) return;
  const show = faceMode && selFace && !cmd && !sk;
  const key = show ? faceKey(selFace) : '';
  if (key === faceBarKey) return;
  faceBarKey = key; bar.hidden = !show; document.body.classList.toggle('has-facebar', !!show); if (!show) { bar.innerHTML = ''; return; }
  const pl = selFace.kind === 'plane', acts = pl
    ? [['ext', 'Vysunout', 'extrude'], ['press', 'Posunout plochu', 'pressface'], ['split', 'Rozdělit plochu', 'splitface'], ['bend', 'Ohnout', 'bendface'], ['al', 'Zarovnat k…', 'center'], ['sk', 'Skica z plochy', 'sketchi'], ['esk', 'Prázdná skica', 'sketch']]
    : [['press', selFace.cyl.internal ? 'Průměr otvoru' : 'Změnit průměr', 'pressface'], ['al', 'Zarovnat k…', 'center'], ['thr', 'Závit', 'thread']];
  bar.innerHTML = `<span class="fb-t"></span><div class="fb-a">${acts.map(([k, l, ic]) => `<button class="fb-b" data-fb="${k}"><span class="ico">${svg(ic, 18)}</span>${l}</button>`).join('')}<button class="ibtn" data-fb="x" aria-label="Zrušit výběr plochy" title="Zrušit výběr plochy">${svg('close', 16)}</button></div>`;
  $('.fb-t', bar).textContent = faceText(selFace);
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-fb]'); if (!b || !selFace) return;
  const k = b.dataset.fb, s = selFace;
  if (k === 'ext') extrudeFace();
  else if (k === 'press') startPressFace();
  else if (k === 'split') startSplitFace(undefined, undefined, s);
  else if (k === 'bend') startBendFace(undefined, undefined, s);
  else if (k === 'sk') faceToSketch();
  else if (k === 'esk') enterSketch({ id: newId(), type: 'sketch', name: 'Skica ' + (doc.features.filter(x => x.type === 'sketch').length + 1), plane: facePlane(s.n, s.w, facePolys(s)), ents: [] }, null);
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
  const same = (a, b) => faceKey(a) === faceKey(b);
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
    ['Rozdělit plochu čarou…', () => startSplitFace(undefined, undefined, selFace), selFace.kind !== 'plane'],
    ['Ohnout plochu kolem hrany…', () => startBendFace(undefined, undefined, selFace), selFace.kind !== 'plane'],
    ['Skica z plochy (Ctrl+D)', () => faceToSketch(), selFace.kind !== 'plane'],
    ['Nová prázdná skica na ploše', () => { const s = selFace; enterSketch({ id: newId(), type: 'sketch', name: 'Skica ' + (doc.features.filter(x => x.type === 'sketch').length + 1), plane: facePlane(s.n, s.w, facePolys(s)), ents: [] }, null); }, selFace.kind !== 'plane'],
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
  const fp = facePolys(s), B = facePlane(s.n, s.w, fp), r4 = x => Math.round(x * 1e4) / 1e4;
  const ents = [];
  for (const loop of K.faceLoops(fp, fp.map((_, i) => i))) {
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
  return { id: newId(), type: 'sketch', name: `Skica ${n} (z plochy)`, plane: { o: B.o.map(r4), u: B.u.map(r4), v: B.v.map(r4), n: B.n.map(r4) }, ents, orig: clone(ents) };
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
      else this.desc = { kind: 'plane', n: face.n.map(v => Math.round(v * 1e6) / 1e6), w: Math.round(face.w * 1e5) / 1e5, p: face.p.map(v => Math.round(v * 1e4) / 1e4), ...(face.clip ? { clip: face.clip } : {}) };
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


/* ================= shell (skořepina) ================= */
function startShell(editIndex, f) {
  const r6 = x => Math.round(x * 1e6) / 1e6, r4 = x => Math.round(x * 1e4) / 1e4;
  const c = {
    editIndex, body: f ? f.body : null, t: f ? f.t : 2, faces: f ? clone(f.faces || []) : [], timer: null, hideBody: null, result: null, openMeshes: [],
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      openDialog({ title: 'Skořepina', icon: 'shell', fields: [{ k: 'sel', id: 'body', label: 'Těleso' }, { k: 'num', id: 't', label: 'Tloušťka stěny', value: this.t },
        { k: 'sel', id: 'faces', label: 'Otevřené plochy' }, { k: 'btns', id: 'clear', label: '', options: [['x', 'Zrušit otevřené plochy']] }, { k: 'note', id: 'n' }],
        onChange: id => { if (id === 't') { const v = dlg.get('t'); if (v >= 0.1) this.t = v; } this.schedule(); },
        onBtn: id => { if (id === 'clear') { this.faces = []; this.update(); this.schedule(); } } });
      if (!f && sel.size === 1) this.body = [...sel][0];
      this.update(); this.schedule();
    },
    update() {
      dlg.set('body', { text: this.body ? bodyName(bodyById(this.body) || { name: '?' }) : 'Klepněte na těleso', has: !!this.body, active: !this.body });
      dlg.set('faces', { text: this.faces.length ? `${this.faces.length} ${this.faces.length === 1 ? 'plocha' : this.faces.length < 5 ? 'plochy' : 'ploch'}` : 'Žádná (uzavřená dutina)', has: this.faces.length > 0, active: !!this.body });
      setPrompt(this.body ? 'Klepnutím na rovnou stěnu ji otevřete (znovu klepnutím zavřete). Tloušťku stěny zadejte v dialogu.' : 'Klepněte na těleso, ze kterého se má udělat skořepina');
      clearGroup(G.overlay); const b = bodyById(this.body);
      if (b) for (const fd of this.faces) { const g = K.planarFace(b.polys, fd.n, fd.w, fd.p); if (g) G.overlay.add(faceMesh({ polys: b.polys, group: g }, tok.accent, 0.45)); }
      if (!this.body) dlg.okEnabled(false);
      requestRender();
    },
    feature() { return { id: f ? f.id : 'tmp', type: 'shell', body: this.body, t: this.t, faces: this.faces }; },
    schedule() {
      clearTimeout(this.timer); if (!this.body) return;
      dlg.set('n', 'Počítám náhled…'); dlg.okEnabled(false);
      this.timer = setTimeout(() => {
        if (cmd !== this) return;
        clearGroup(G.preview); this.hideBody = null; this.result = null;
        const b = bodyById(this.body);
        try {
          if (!b) throw new Error('Těleso neexistuje');
          this.result = Engine.shellBody(b.polys, this.feature());
          const m = meshFromPolys(this.result, bodyMaterial()); noRay(m); m.material.color.copy(tok.body).lerp(tok.accent, 0.25);
          m.material.transparent = true; m.material.opacity = 0.75; m.material.side = THREE.DoubleSide;
          const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(K.edgeSegments(this.result), 3));
          m.add(noRay(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: tok.edge }))));
          G.preview.add(m); this.hideBody = this.body;
          const v0 = K.signedVolume(b.polys) / 1000, v1 = K.signedVolume(this.result) / 1000;
          dlg.set('n', `Objem ${fmtc(v0, 2)} → ${fmtc(v1, 2)} cm³ (${fmtc(v1 / v0 * 100, 0)} %)`); dlg.okEnabled(true);
        } catch (e) { dlg.set('n', '!' + e.message); }
        styleBodies(); requestRender();
      }, 250);
    },
    onMove(ev) { const h = hitBodies(ev); dom.style.cursor = h ? 'pointer' : ''; },
    onClick(ev) {
      ray.setFromCamera(evNdc(ev), cam());
      const h = ray.intersectObjects(pickableMeshes(), false)[0]; if (!h) return;
      const id = h.object.userData.bodyId;
      if (id !== this.body) { this.body = id; this.faces = []; this.update(); this.schedule(); return; }
      const fc = faceAtHit(h); if (!fc || fc.kind !== 'plane') { toast('Otevřít lze jen rovnou stěnu.'); return; }
      const i = this.faces.findIndex(q => K.vdot(q.n, fc.n) > 0.9999 && Math.abs(q.w - fc.w) < 1e-4 && (K.planarFace(fc.polys, q.n, q.w, q.p) || []).includes(fc.group[0]));
      if (i >= 0) this.faces.splice(i, 1); else this.faces.push({ n: fc.n.map(r6), w: r6(fc.w), p: fc.p.map(r4) });
      this.update(); this.schedule();
    },
    ok() { if (!this.result) return null; const o = this.feature(); o.id = f ? f.id : newId(); return o; },
    cleanup() { clearTimeout(this.timer); this.hideBody = null; clearGroup(G.overlay); }
  };
  beginCmd(c); c.init();
}
/* ================= hole for a bolt (díra) with an optional nut pocket ================= */
function startHole(editIndex, f) {
  const r6 = x => Math.round(x * 1e6) / 1e6, r4 = x => Math.round(x * 1e4) / 1e4;
  const sizes = Object.keys(Engine.FASTENERS).map(Number).sort((a, b) => a - b).map(d => [String(d), 'M' + fmtc(d, 1)]);
  const c = {
    editIndex, body: f ? f.body : null, n: f ? f.n : null, p: f ? f.p.slice() : null, faceCen: null,
    v: f ? { size: f.size, kind: f.kind || 'clear', through: f.through !== false, depth: f.depth || 10, cbDepth: f.cbDepth || 0, tol: f.tol || 0, nut: f.nut || 'none', nutLow: !!f.nutLow, nutTol: f.nutTol != null ? f.nutTol : 0.3, nutDepth: f.nutDepth || 5, nutDir: f.nutDir || 0 }
      : { size: 3, kind: 'clear', through: true, depth: 10, cbDepth: 0, tol: 0, nut: 'none', nutLow: false, nutTol: 0.3, nutDepth: 5, nutDir: 0 },
    tolSet: !!f, timer: null, tool: null,
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      openDialog({ title: 'Díra', icon: 'hole', fields: [{ k: 'sel', id: 'face', label: 'Místo' },
        { k: 'btns', id: 'center', label: '', options: [['c', 'Do středu plochy']] },
        { k: 'xyz', id: 'p', label: 'Střed díry', value: this.p || [0, 0, 0] },
        { k: 'opt', id: 'size', label: 'Šroub', options: sizes, value: String(this.v.size) },
        { k: 'opt', id: 'kind', label: 'Typ', options: [['clear', 'Průchozí pro šroub (ISO 273)'], ['socket', 'Zahloubení pro imbus (DIN 974)'], ['csk', 'Zápustná 90° (ISO 15065)'], ['thread', 'Se závitem']], value: this.v.kind },
        { k: 'chk', id: 'through', label: 'Skrz celé těleso', value: this.v.through },
        { k: 'num', id: 'depth', label: 'Hloubka', value: this.v.depth },
        { k: 'num', id: 'cbDepth', label: 'Hloubka zahloubení (0 = výška hlavy)', value: this.v.cbDepth },
        { k: 'num', id: 'tol', label: 'Vůle pro 3D tisk (zvětší díru)', value: this.v.tol },
        { k: 'opt', id: 'nut', label: 'Kapsa pro matici', options: [['none', 'Bez kapsy'], ['top', 'Na straně šroubu'], ['bottom', 'Na druhé straně'], ['side', 'Boční vsuvka']], value: this.v.nut },
        { k: 'chk', id: 'nutLow', label: 'Nízká matice (ISO 4035)', value: this.v.nutLow },
        { k: 'num', id: 'nutTol', label: 'Vůle kapsy', value: this.v.nutTol },
        { k: 'num', id: 'nutDepth', label: 'Hloubka matice (střed)', value: this.v.nutDepth },
        { k: 'num', id: 'nutDir', label: 'Směr vsuvky', unit: '°', value: this.v.nutDir, range: [0, 360, 15] },
        { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'p') { const q = dlg.get('p'); if (q.every(isFinite)) this.p = q; }
          else if (id === 'size') this.v.size = parseFloat(dlg.get('size'));
          else if (id === 'kind') { this.v.kind = dlg.get('kind'); if (!this.tolSet) { this.v.tol = this.v.kind === 'thread' ? TOL_NUT : 0; dlg.set('tol', this.v.tol); } }
          else if (id === 'through' || id === 'nutLow') this.v[id] = dlg.get(id);
          else if (id === 'nut') this.v.nut = dlg.get('nut');
          else { const x = dlg.get(id); if (isFinite(x) && x >= 0) { this.v[id] = x; if (id === 'tol') this.tolSet = true; } }
          this.update(); this.schedule();
        },
        onBtn: id => { if (id === 'center' && this.faceCen) { this.p = this.faceCen.slice(); dlg.set('p', this.p); this.update(); this.schedule(); } } });
      if (!f && selFace && selFace.kind === 'plane') this.useFace(selFace, null);
      this.update(); this.schedule();
    },
    useFace(fc, at) {
      this.body = fc.bodyId; this.n = fc.n.map(r6);
      const ps = facePolys(fc); let A = 0; const cen = [0, 0, 0];
      for (const q of ps) for (let i = 1; i < q.v.length - 1; i++) { const a = K.surfaceArea([{ v: [q.v[0], q.v[i], q.v[i + 1]], n: q.n }]); A += a; for (let k = 0; k < 3; k++) cen[k] += a * (q.v[0][k] + q.v[i][k] + q.v[i + 1][k]) / 3; }
      this.faceCen = A > 0 ? cen.map(x => r4(x / A)) : fc.p.map(r4);
      this.p = (at || this.faceCen).map(r4); dlg.set('p', this.p);
    },
    update() {
      const has = !!this.n;
      dlg.set('face', { text: has ? 'Rovná stěna' : 'Klepněte na místo na rovné stěně', has, active: true });
      dlg.show('depth', !this.v.through); dlg.show('cbDepth', this.v.kind === 'socket'); dlg.show('center', !!this.faceCen);
      const nut = this.v.nut !== 'none'; dlg.show('nutLow', nut); dlg.show('nutTol', nut); dlg.show('nutDepth', this.v.nut === 'side'); dlg.show('nutDir', this.v.nut === 'side');
      setPrompt(has ? 'Klepnutím na jiné místo díru přesunete. Přesnou polohu zadáte v dialogu.' : 'Klepněte na rovnou stěnu tělesa, kde má být díra');
      if (!has) dlg.okEnabled(false);
    },
    feature() { return { id: f ? f.id : 'tmp', type: 'hole', body: this.body, n: this.n, p: this.p, ...this.v }; },
    schedule() {
      clearTimeout(this.timer); if (!this.n) return;
      dlg.set('n', 'Počítám…'); dlg.okEnabled(false);
      this.timer = setTimeout(() => {
        if (cmd !== this) return;
        clearGroup(G.preview); this.tool = null;
        try {
          this.tool = Engine.toolForHole(this.feature(), cur.bodies);
          G.preview.add(previewMesh(this.tool, 'cut'));
          const d = this.v.size, M = Engine.FASTENERS[d], k = this.v.kind;
          const dia = k === 'thread' ? `závit M${fmtc(d, 1)} × ${fmtc(M[0], 2)}` : `díra Ø ${fmtc(Engine.HOLE_CLEAR[d] + this.v.tol, 2)}` + (k === 'socket' ? `, zahloubení Ø ${fmtc(Engine.HOLE_CBORE[d] + this.v.tol, 1)}` : k === 'csk' ? `, kužel Ø ${fmtc(Engine.HOLE_CSINK[d] + this.v.tol, 1)}` : '');
          const nut = this.v.nut !== 'none' ? ` · kapsa klíč ${fmtc(M[1] + this.v.nutTol, 2)} mm` : '';
          dlg.set('n', dia + ' mm' + nut); dlg.okEnabled(true);
        } catch (e) { dlg.set('n', '!' + e.message); }
        requestRender();
      }, 200);
    },
    onMove(ev) { const h = hitBodies(ev); dom.style.cursor = h ? 'crosshair' : ''; },
    onClick(ev) {
      const h = hitBodies(ev); if (!h) return;
      const fc = faceAtHit(h); if (!fc || fc.kind !== 'plane') { toast('Díru umístěte na rovnou stěnu.'); return; }
      /* the clicked point, pulled onto the grid of the face when snapping is on */
      let at = h.point.toArray();
      if (settings.gridSnap) { const B = Engine.basisFromPlane(fc.n, fc.w), q = K.vsub(at, B.o), st = settings.snap, uu = Math.round(K.vdot(q, B.u) / st) * st, vv = Math.round(K.vdot(q, B.v) / st) * st; at = K.vadd(B.o, K.vadd(K.vmul(B.u, uu), K.vmul(B.v, vv))); }
      this.useFace(fc, at); this.update(); this.schedule();
    },
    ok() { if (!this.tool) return null; const o = this.feature(); o.id = f ? f.id : newId(); return o; },
    cleanup() { clearTimeout(this.timer); }
  };
  beginCmd(c); c.init();
}
/* axis colours of the move / rotate / scale manipulator */
const HANDLE_AXIS_COL = [0xff0000, 0x00ff00, 0x0000ff];
/* ================= bend a face about one of its edges ================= */
/* straight pieces of the outline of a (part of a) planar face, as [a, b] world points */
function faceEdgesOf(regionPolys) {
  const out = [];
  for (const loop of K.faceLoops(regionPolys, regionPolys.map((_, i) => i))) {
    const n = loop.length; if (n < 3) continue;
    const dir = (a, b) => K.vnorm(K.vsub(b, a));
    const corner = []; for (let i = 0; i < n; i++) { const a = loop[(i - 1 + n) % n], b = loop[i], c = loop[(i + 1) % n]; if (K.vdot(dir(a, b), dir(b, c)) < 1 - 1e-6) corner.push(i); }
    for (let k = 0; k < corner.length; k++) { const a = loop[corner[k]], b = loop[corner[(k + 1) % corner.length]]; if (K.vdot(K.vsub(b, a), K.vsub(b, a)) > 1e-6) out.push([a, b]); }
  }
  return out;
}
function startBendFace(editIndex, f, face) {
  const R = TOUCH ? 24 : 14, r6 = x => Math.round(x * 1e6) / 1e6, r4 = x => Math.round(x * 1e4) / 1e4;
  const c = {
    editIndex, body: f ? f.body : null, desc: f ? { n: f.n, w: f.w, p: f.p, ...(f.clip ? { clip: f.clip } : {}) } : null,
    axis: f ? { a: f.axis.a.slice(), b: f.axis.b.slice() } : null, angle: f ? f.angle : 90, radius: f ? (f.radius || 0) : 2,
    phi: f && isFinite(f.phi) ? f.phi : null, outline: [], edges: [], hoverEdge: -1, timer: null, tool: null, piv: null, gdrag: null, hmode: 'rot', onGizmo: null, onDragChange: null, onPtr: null, lastEv: null,
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      openDialog({
        title: 'Ohnout plochu', icon: 'bendface',
        fields: [{ k: 'sel', id: 'face', label: 'Plocha' }, { k: 'seg', id: 'hmode', label: 'Táhla', options: [['rot', 'Natočení'], ['move', 'Poloměr']], value: this.hmode },
          { k: 'seg', id: 'dir', label: 'Směr ohybu', options: [['0', '+X'], ['90', '+Y'], ['180', '−X'], ['270', '−Y']] },
          { k: 'num', id: 'phi', label: 'Natočení směru', unit: '°', value: 0, range: [0, 360, 1] },
          { k: 'num', id: 'angle', label: 'Úhel', unit: '°', value: this.angle, range: [1, 180, 1] },
          { k: 'num', id: 'radius', label: 'Poloměr ohybu', value: this.radius, range: [0, 20, 0.5] }, { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'hmode') { this.hmode = dlg.get('hmode'); this.syncPiv(); return; }
          if (id === 'angle') { const v = dlg.get('angle'); if (isFinite(v) && v > 0) this.angle = Math.min(180, v); }
          if (id === 'radius') { const v = dlg.get('radius'); if (v >= 0) this.radius = v; }
          if (id === 'phi') { const v = dlg.get('phi'); if (isFinite(v)) { this.phi = ((v % 360) + 360) % 360; this.makeAxis(); } }
          if (id === 'dir') { this.phi = parseFloat(dlg.get('dir')); dlg.set('phi', this.phi); this.makeAxis(); }
          this.update();
        }
      });
      /* the same manipulator as Otočit / Přesunout, sitting on the bend axis: local X = bend axis, local Z = face normal */
      this.piv = new THREE.Object3D(); scene.add(this.piv);
      transform.addEventListener('objectChange', this.onGizmo);
      transform.addEventListener('dragging-changed', this.onDragChange);
      this.onPtr = ev => { this.lastEv = ev; }; dom.addEventListener('pointermove', this.onPtr);
      if (!f && face && face.kind === 'plane') this.useFace(face); else { this.loadOutline(); if (this.desc) { if (this.phi === null) this.phi = this.phiOfAxis(); this.labels(); } }
      this.update();
    },
    regionPolys() {
      const b = cur.bodies.find(x => x.id === this.body); if (!b || !this.desc) return null;
      const g = K.planarFace(b.polys, this.desc.n, this.desc.w, this.desc.p); if (!g) return null;
      return this.desc.clip ? Engine.clipRegion(b.polys, g, this.desc.clip) : g.map(i => b.polys[i]);
    },
    loadOutline() { const rp = this.regionPolys(); this.edges = rp ? faceEdgesOf(rp) : []; this.outline = rp ? K.faceLoops(rp, rp.map((_, i) => i)).flat() : []; },
    /* in-plane directions aligned with the world axes: U follows X (or Y on faces facing X), V = n x U */
    frame() {
      const n = this.desc.n, pick = Math.abs(n[0]) > 0.9 ? [0, 1, 0] : [1, 0, 0];
      const U = K.vnorm(K.vsub(pick, K.vmul(n, K.vdot(pick, n)))), V = K.cross(n, U);
      return { U, V };
    },
    dirOf(phi) { const { U, V } = this.frame(), a = phi * D2R; return K.vadd(K.vmul(U, Math.cos(a)), K.vmul(V, Math.sin(a))); },
    axisName(v) { const k = [0, 1, 2].reduce((m, i) => (Math.abs(v[i]) > Math.abs(v[m]) ? i : m), 0); return (v[k] >= 0 ? '+' : '−') + 'XYZ'[k]; },
    /* the four quick directions get the names of the world axes they point along */
    labels() { if (!this.desc) return; $$('#dlg-dir button').forEach(btn => { btn.textContent = this.axisName(this.dirOf(parseFloat(btn.dataset.v))); }); dlg.set('dir', String(this.phi)); dlg.set('phi', this.phi); },
    phiOfAxis() {
      if (!this.axis || !this.outline.length) return 0;
      const { U, V } = this.frame(), cen = this.outline.reduce((s2, q) => K.vadd(s2, K.vmul(q, 1 / this.outline.length)), [0, 0, 0]);
      const mid = K.vmul(K.vadd(this.axis.a, this.axis.b), 0.5), t = K.vnorm(K.vsub(this.axis.b, this.axis.a));
      let d = K.vsub(mid, cen); d = K.vsub(d, K.vmul(t, K.vdot(d, t)));
      return Math.round(((Math.atan2(K.vdot(d, V), K.vdot(d, U)) / D2R) % 360 + 360) % 360 * 100) / 100;
    },
    /* bend axis = the line across the face at its outermost point in the bend direction (a straight edge when there is one) */
    makeAxis() {
      if (!this.desc || !this.outline.length) { this.axis = null; return; }
      const dir = this.dirOf(this.phi), t = K.cross(this.desc.n, dir);
      let sMax = -Infinity; for (const q of this.outline) sMax = Math.max(sMax, K.vdot(q, dir));
      const on = this.outline.filter(q => K.vdot(q, dir) > sMax - 1e-4);
      let tMin = Infinity, tMax = -Infinity; for (const q of this.outline) { const v = K.vdot(q, t); tMin = Math.min(tMin, v); tMax = Math.max(tMax, v); }
      const P = on[0], tp = K.vdot(P, t);
      const A = K.vadd(P, K.vmul(t, tMin - tp)), B = K.vadd(P, K.vmul(t, tMax - tp));
      this.axis = K.vdot(K.vsub(B, A), K.vsub(B, A)) > 1e-8 ? { a: A.map(r4), b: B.map(r4) } : null;
    },
    useFace(fc) {
      this.body = fc.bodyId; this.desc = { n: fc.n.map(r6), w: r6(fc.w), p: fc.p.map(r4), ...(fc.clip ? { clip: fc.clip } : {}) };
      this.loadOutline();
      /* default: bend downwards on upright faces, towards +X (or +Y) on flat ones */
      const { U, V } = this.frame(), down = K.vsub([0, 0, -1], K.vmul(this.desc.n, -this.desc.n[2]));
      this.phi = K.vdot(down, down) > 0.01 ? Math.round(((Math.atan2(K.vdot(down, V), K.vdot(down, U)) / D2R) % 360 + 360) % 360) : 0;
      this.makeAxis(); this.labels();
    },
    /* bend geometry for the handles: axis point O, axis k, r0 from the axis towards the face, face normal n, radius of the face centre */
    geo() {
      if (!this.desc || !this.axis || !this.outline.length) return null;
      const dir = v3(this.dirOf(this.phi)), r0 = dir.clone().negate(), n = v3(this.desc.n).normalize();
      const a = v3(this.axis.a), b = v3(this.axis.b), k = b.clone().sub(a).normalize(), mid = a.clone().add(b).multiplyScalar(0.5);
      const O = mid.clone().addScaledVector(dir, this.radius);
      const cen = this.outline.reduce((s2, q) => s2.add(v3(q)), new V3()).multiplyScalar(1 / this.outline.length);
      const rho = Math.max(1, cen.clone().sub(O).dot(r0));
      return { dir, r0, n, k, mid, O, rho };
    },
    faceCen() { return this.outline.reduce((s2, q) => s2.add(v3(q)), new V3()).multiplyScalar(1 / Math.max(1, this.outline.length)); },
    /* Natočení: ring about the bend axis = angle, ring about the face normal = direction; Poloměr: arrow away from the face */
    syncPiv() {
      const g = this.geo();
      if (!g) { transform.detach(); requestRender(); return; }
      if (this.gdrag) return;
      /* right-handed frame with local Y = the direction in which the radius grows (so the arrow points the right way) */
      const X = g.dir.clone().cross(g.n).normalize();
      this.piv.position.copy(g.O);
      this.piv.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, g.dir.clone(), g.n));
      this.piv.scale.set(1, 1, 1);
      transform.setMode(this.hmode === 'rot' ? 'rotate' : 'translate'); transform.setSpace('local');
      if (this.hmode === 'rot') { transform.showX = true; transform.showY = false; transform.showZ = true; }
      else { transform.showX = false; transform.showY = true; transform.showZ = false; }
      if (transform.object !== this.piv) transform.attach(this.piv);
      requestRender();
    },
    fromGizmo() {
      const d = this.gdrag; if (!d) return;
      if (d.mode === 'rot') {
        /* rotation since the drag started, in the manipulator's own axes */
        const q = d.q0.clone().invert().multiply(this.piv.quaternion), w = Math.max(-1, Math.min(1, q.w)), th = 2 * Math.acos(w), sn = Math.sqrt(1 - w * w);
        const ax = sn > 1e-6 ? new V3(q.x / sn, q.y / sn, q.z / sn) : new V3(), deg = th / D2R;
        if (Math.abs(ax.x) >= Math.abs(ax.z)) {
          const a = Math.max(1, Math.min(180, Math.round(d.angle + deg * Math.sign(ax.x) * d.sx)));
          if (a !== this.angle) { this.angle = a; dlg.set('angle', a); }
          showDimAt(this.lastEv, `Úhel ${fmtc(this.angle, 0)}°`);
        } else {
          const p = ((Math.round(d.phi + deg * Math.sign(ax.z)) % 360) + 360) % 360;
          if (p !== this.phi) { this.phi = p; dlg.set('phi', p); dlg.set('dir', String(p)); this.makeAxis(); }
          showDimAt(this.lastEv, `Směr ${this.axisName(this.dirOf(this.phi))} · ${fmtc(this.phi, 0)}°`);
        }
      } else {
        const g = this.geo(); if (!g) return;
        const st = settings.gridSnap ? 0.5 : 0.1, r = Math.max(0, Math.round(this.piv.position.clone().sub(g.mid).dot(g.dir) / st) * st);
        if (Math.abs(r - this.radius) > 1e-9) { this.radius = Math.round(r * 1000) / 1000; dlg.set('radius', this.radius); }
        showDimAt(this.lastEv, `Poloměr ohybu ${fmtc(this.radius, 2)} mm`);
      }
      this.update();
    },
    feature() { return { id: f ? f.id : 'tmp', type: 'bendface', body: this.body, ...this.desc, axis: this.axis, phi: this.phi, angle: this.angle, radius: this.radius }; },
    curved() {
      if (!this.axis) return false;
      const L = Math.hypot(...[0, 1, 2].map(k => this.axis.b[k] - this.axis.a[k]));
      const on = this.edges.some(([a, b2]) => { const l = Math.hypot(...[0, 1, 2].map(k => b2[k] - a[k])); return l > 0.6 * L && [a, b2].every(q => { const d = K.vsub(q, this.axis.a), t = K.vnorm(K.vsub(this.axis.b, this.axis.a)), pp = K.vsub(d, K.vmul(t, K.vdot(d, t))); return K.vdot(pp, pp) < 1e-6; }); });
      return !on;
    },
    update() {
      clearGroup(G.overlay);
      const has = !!this.desc;
      dlg.set('face', { text: has ? 'Rovinná plocha' : 'Klepněte na rovinnou plochu', has, active: !has });
      ['dir', 'phi'].forEach(id => dlg.show(id, has));
      setPrompt(!has ? 'Klepněte na rovinnou plochu, kterou chcete ohnout' : 'Táhly natočíte úhel a směr ohybu (přepínač Táhla: Poloměr), směr jde zvolit i tlačítky nebo klepnutím na hranu');
      if (has) {
        const rp = this.regionPolys(); if (rp && rp.length) G.overlay.add(faceOverlay(rp, planeKey(rp[0]), tok.accent, 0.2));
        if (this.hoverEdge >= 0 && this.edges[this.hoverEdge]) { const [a, b2] = this.edges[this.hoverEdge]; const l = noRay(new THREE.LineSegments(lineGeo([...a, ...b2]), new THREE.LineBasicMaterial({ color: tok.accent, depthTest: false, transparent: true }))); l.renderOrder = 12; G.overlay.add(l); }
        if (this.axis) {
          const l = noRay(new THREE.LineSegments(lineGeo([...this.axis.a, ...this.axis.b]), new THREE.LineBasicMaterial({ color: tok.orange, depthTest: false, transparent: true }))); l.renderOrder = 13; G.overlay.add(l);
          G.overlay.add(mpts([v3(this.axis.a), v3(this.axis.b)], tok.orange, 8));
        }
      }
      this.schedule();
      this.syncPiv();
    },
    schedule() {
      clearTimeout(this.timer); clearGroup(G.preview); this.tool = null;
      if (!this.desc || !this.axis) { dlg.set('n', this.desc ? 'Směr ohybu se nepodařilo určit.' : 'Vyberte rovinnou stěnu tělesa, třeba čelo hranolu nebo podstavu válce.'); dlg.okEnabled(false); requestRender(); return; }
      dlg.set('n', 'Počítám náhled…'); dlg.okEnabled(false);
      this.timer = setTimeout(() => {
        if (cmd !== this) return;
        try {
          const b = cur.bodies.find(x => x.id === this.body);
          this.tool = Engine.bendFaceTool(b.polys, this.feature());
          G.preview.add(previewMesh(this.tool, 'join'));
          dlg.set('n', this.curved() && this.radius < 1 ? 'Malý poloměr ohybu: u zaoblené plochy se ohyb na vnitřní straně zúží až do jednoho bodu (vypadá jako spoj). Pro plynulý ohyb zadejte alespoň 1 až 2 mm.' : 'Plocha se ohne kolem oranžové osy směrem, který jste zvolili. Koncovou plochu pak vysunete pod úhlem (režim Plochy › Vysunout).'); dlg.okEnabled(true);
        } catch (e) { dlg.set('n', '!' + e.message); }
        requestRender();
      }, this.dragging ? 60 : 150);
    },
    edgeAt(ev) {
      const [mx, my] = evPx(ev); let best = -1, bd = R;
      this.edges.forEach(([a, b2], i) => { const pa = toPx(v3(a)), pb = toPx(v3(b2)); if (pa[2] >= 1 || pb[2] >= 1) return; const [d] = segDist(mx, my, pa, pb); if (d < bd) { bd = d; best = i; } });
      return best;
    },
    onMove(ev) {
      if (transform.axis) { dom.style.cursor = 'grab'; return; }
      if (!this.desc) { dom.style.cursor = hitBodies(ev) ? 'pointer' : ''; return; }
      const i = this.edgeAt(ev); dom.style.cursor = i >= 0 || hitBodies(ev) ? 'pointer' : '';
      if (i !== this.hoverEdge) { this.hoverEdge = i; this.update(); }
    },
    onClick(ev) {
      if (transform.axis) return;
      if (this.desc) {
        const i = this.edgeAt(ev);
        if (i >= 0) {
          /* a tapped edge sets the direction perpendicular to it, away from the face */
          const [a, b2] = this.edges[i], t = K.vnorm(K.vsub(b2, a)), { U, V } = this.frame();
          let d = K.cross(t, this.desc.n);
          const cen = this.outline.reduce((s2, q) => K.vadd(s2, K.vmul(q, 1 / this.outline.length)), [0, 0, 0]);
          if (K.vdot(d, K.vsub(K.vmul(K.vadd(a, b2), 0.5), cen)) < 0) d = K.vmul(d, -1);
          this.phi = Math.round(((Math.atan2(K.vdot(d, V), K.vdot(d, U)) / D2R) % 360 + 360) % 360 * 100) / 100;
          dlg.set('phi', this.phi); dlg.set('dir', String(this.phi)); this.makeAxis(); this.update(); return;
        }
      }
      const h = hitBodies(ev), fc = h ? faceAtHit(h) : null;
      if (!fc) return;
      if (fc.kind !== 'plane') { toast('Ohnout lze jen rovinnou plochu.'); return; }
      this.useFace(fc); this.update();
    },
    ok() {
      /* Enter in a field confirms before the delayed preview has run: check the bend right away */
      if (!this.tool && this.desc && this.axis) { try { const b = cur.bodies.find(x => x.id === this.body); this.tool = Engine.bendFaceTool(b.polys, this.feature()); } catch (e) { dlg.set('n', '!' + e.message); return null; } }
      if (!this.tool) return null; const o = this.feature(); o.id = f ? f.id : newId(); return o;
    },
    after() { selFace = null; hoverFace = null; setTimeout(() => toast('Ohyb je hotový. Koncovou plochu vysunete v režimu Plochy: klepněte na ni a zvolte Vysunout.'), 700); },
    cleanup() {
      clearTimeout(this.timer);
      transform.removeEventListener('objectChange', this.onGizmo); transform.removeEventListener('dragging-changed', this.onDragChange); dom.removeEventListener('pointermove', this.onPtr);
      transform.detach(); scene.remove(this.piv); transform.setMode('translate'); transform.setSpace('world'); transform.showX = transform.showY = transform.showZ = true;
      controls.enabled = true; $('#dim').hidden = true;
    }
  };
  c.onGizmo = () => { if (c.gdrag) c.fromGizmo(); };
  c.onDragChange = e => {
    controls.enabled = !e.value;
    if (e.value) {
      const g = c.geo(), Y = g ? g.dir.clone() : new V3();
      /* +rotation about local X turns local Y towards Z: that opens the bend when Y points from the axis to the face */
      c.gdrag = { mode: c.hmode, q0: c.piv.quaternion.clone(), angle: c.angle, phi: c.phi, sx: g && Y.dot(g.r0) >= 0 ? 1 : -1 };
    } else { c.gdrag = null; $('#dim').hidden = true; c.syncPiv(); c.update(); }
  };
  beginCmd(c); c.init();
}

/* ================= split bodies with a plane ================= */
const SPLIT_PLANES = { XY: [0, 0, 1], XZ: [0, 1, 0], YZ: [1, 0, 0] };
function startSplitBody(editIndex, f) {
  const r3 = x => Math.round(x * 1000) / 1000, r6 = x => Math.round(x * 1e6) / 1e6;
  const c = {
    editIndex, bodies: new Set(f ? (f.bodies || []) : [...sel]), mode: f ? (f.mode || 'XY') : 'XY', off: f ? (Number(f.offset) || 0) : null,
    faceN: f && f.mode === 'face' ? (f.fn || f.n).slice() : null, faceW: f && f.mode === 'face' ? (f.fw !== undefined ? Number(f.fw) : Number(f.w) - (Number(f.offset) || 0)) : 0,
    tilt: f && f.tilt ? f.tilt.slice() : [0, 0], shift: f && f.shift ? f.shift.slice() : [0, 0], size: f && f.size ? Number(f.size) : null,
    keep: f ? (f.keep || 'both') : 'both', pick: 'bodies', timer: null, ok_: false, hideBodies: new Set(), highlight: new Set(), piv: null, gdrag: null, hmode: 'move',
    ids() { return [...this.bodies].filter(id => meshes.has(id)); },
    /* bounding box of the selection, cached (the handles ask for it every frame) */
    bb() {
      const ids = this.ids(), key = ids.join();
      if (this._bbKey !== key || this._bbCur !== cur) { this._bbKey = key; this._bbCur = cur; this._bb = ids.length ? K.bbox(cur.bodies.filter(b => ids.includes(b.id)).flatMap(b => b.polys)) : null; }
      return this._bb;
    },
    /* size of a cutting face that covers the whole selection (and more); a bigger value cuts straight through everything */
    /* half size of the square drawn for the cutting face; a full cut is drawn only a little larger than the selection so its handles stay in view */
    visH() { const bb = this.bb(), d = bb ? Math.hypot(bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]) : 50; return Math.min(Math.min(this.size, this.fullSize()) / 2, d * 0.4 + 2); },
    fullSize() { const bb = this.bb(); return bb ? Math.ceil(Math.hypot(bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]) * 1.3 + 4) : 100; },
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      if (this.off === null) this.off = this.centerOff();
      if (this.size === null) this.size = this.fullSize();
      /* the same manipulator as Přesunout / Otočit / Měřítko, attached to the cutting face (its local Z = the face normal) */
      this.piv = new THREE.Object3D(); scene.add(this.piv);
      transform.setSpace('local');
      transform.addEventListener('objectChange', this.onGizmo);
      transform.addEventListener('dragging-changed', this.onDragChange);
      this.onPtr = ev => { this.lastEv = ev; }; dom.addEventListener('pointermove', this.onPtr);
      openDialog({
        title: 'Rozříznout', icon: 'splitbody',
        fields: [{ k: 'sel', id: 'bodies', label: 'Tělesa' },
          { k: 'opt', id: 'mode', label: 'Řezná rovina', options: [['XY', 'Rovina XY (vodorovně)'], ['XZ', 'Rovina XZ (zepředu)'], ['YZ', 'Rovina YZ (zboku)'], ['face', 'Rovina plochy tělesa']], value: this.mode },
          { k: 'sel', id: 'plane', label: 'Plocha' },
          { k: 'seg', id: 'hmode', label: 'Táhla', options: [['move', 'Posun'], ['rot', 'Natočení'], ['scale', 'Velikost']], value: this.hmode },
          { k: 'num', id: 'off', label: 'Posun roviny', value: this.off, range: [-100, 100, 0.5] },
          { k: 'num', id: 'ta', label: 'Natočení kolem X', unit: '°', value: this.tilt[0], range: [-90, 90, 1] },
          { k: 'num', id: 'tb', label: 'Natočení kolem Y', unit: '°', value: this.tilt[1], range: [-90, 90, 1] },
          { k: 'num', id: 'size', label: 'Velikost řezné plochy', value: this.size, range: [1, 100, 1] },
          { k: 'num', id: 'su', label: 'Posun plochy X', value: this.shift[0], range: [-50, 50, 0.5] },
          { k: 'num', id: 'sv', label: 'Posun plochy Y', value: this.shift[1], range: [-50, 50, 0.5] },
          { k: 'seg', id: 'keep', label: 'Ponechat', options: [['both', 'Obě části'], ['pos', 'Nad rovinou'], ['neg', 'Pod rovinou']], value: this.keep },
          { k: 'note', id: 'n' }],
        onSel: id => { this.pick = id; this.update(); },
        onChange: id => {
          const num = (k, fn) => { const v = dlg.get(k); if (isFinite(v)) fn(v); };
          if (id === 'mode') { this.mode = dlg.get('mode'); if (this.mode === 'face') { if (!this.faceN) this.pick = 'plane'; this.off = 0; } else this.off = this.centerOff(); dlg.set('off', this.off); this.ranges(); }
          if (id === 'off') num('off', v => { this.off = v; });
          if (id === 'ta') num('ta', v => { this.tilt[0] = Math.max(-90, Math.min(90, v)); });
          if (id === 'tb') num('tb', v => { this.tilt[1] = Math.max(-90, Math.min(90, v)); });
          if (id === 'size') num('size', v => { if (v > 0) this.size = v; });
          if (id === 'su') num('su', v => { this.shift[0] = v; });
          if (id === 'sv') num('sv', v => { this.shift[1] = v; });
          if (id === 'keep') this.keep = dlg.get('keep');
          if (id === 'hmode') { this.hmode = dlg.get('hmode'); this.syncPiv(); return; }
          this.update();
        }
      });
      this.ranges();
      this.update();
    },
    /* the base plane before tilting: principal plane, or the plane of the picked face */
    base() {
      if (this.mode === 'face') return this.faceN ? { n: this.faceN, w: this.faceW + this.off } : null;
      return { n: SPLIT_PLANES[this.mode], w: this.off };
    },
    axisName(v) { const k = [0, 1, 2].reduce((m, i) => (Math.abs(v[i]) > Math.abs(v[m]) ? i : m), 0); return 'XYZ'[k]; },
    /* slider ranges and labels follow the selection and the plane */
    ranges() {
      const bb = this.bb(), b0 = this.base(), set = (id, lo, hi) => { const r = $('#dlg-' + id + '-r'); if (r) { r.min = String(lo); r.max = String(hi); } };
      const lbl = (id, t) => { const l = $(`#dialog label[for="dlg-${id}"]`); if (l) l.textContent = t; };
      if (bb && b0) {
        let lo = Infinity, hi = -Infinity;
        for (const x of [bb.min[0], bb.max[0]]) for (const y of [bb.min[1], bb.max[1]]) for (const z of [bb.min[2], bb.max[2]]) { const t = K.vdot(b0.n, [x, y, z]) - (this.mode === 'face' ? this.faceW : 0); lo = Math.min(lo, t); hi = Math.max(hi, t); }
        set('off', Math.floor(lo - 1), Math.ceil(hi + 1));
        const F = this.fullSize(); set('size', 1, F); set('su', -Math.ceil(F / 2), Math.ceil(F / 2)); set('sv', -Math.ceil(F / 2), Math.ceil(F / 2));
        const B = Engine.basisFromPlane(b0.n, b0.w);
        lbl('ta', 'Natočení kolem ' + this.axisName(B.u)); lbl('tb', 'Natočení kolem ' + this.axisName(B.v));
        lbl('su', 'Posun plochy ' + this.axisName(B.u)); lbl('sv', 'Posun plochy ' + this.axisName(B.v));
      }
    },
    centerOff() {
      const n = SPLIT_PLANES[this.mode] || [0, 0, 1], bb = this.bb(); if (!bb) return 0;
      const k = n.indexOf(1);
      return r3((bb.min[k] + bb.max[k]) / 2);
    },
    /* final cutting plane: base plane through the selection centre (+ shift in the plane), tilted about its two in-plane axes */
    plane() {
      const b0 = this.base(), bb = this.bb(); if (!b0) return null;
      const B = Engine.basisFromPlane(b0.n, b0.w), cc = bb ? [0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2) : B.o;
      let P = K.vsub(cc, K.vmul(b0.n, K.vdot(b0.n, cc) - b0.w));
      P = K.vadd(P, K.vadd(K.vmul(B.u, this.shift[0]), K.vmul(B.v, this.shift[1])));
      const rot = (v, ax, a) => { const c2 = Math.cos(a), s2 = Math.sin(a); return K.vadd(K.vadd(K.vmul(v, c2), K.vmul(K.cross(ax, v), s2)), K.vmul(ax, K.vdot(ax, v) * (1 - c2))); };
      const ta = this.tilt[0] * D2R, tb = this.tilt[1] * D2R;
      let n = rot(b0.n, B.u, ta), U = B.u, V = rot(B.v, B.u, ta);
      n = rot(n, V, tb); U = rot(U, V, tb);
      n = K.vnorm(n); U = K.vnorm(U); V = K.vnorm(K.cross(n, U));
      const full = this.size >= this.fullSize() - 1e-6;
      return { n, w: K.vdot(n, P), P, U, V, rect: full ? null : { c: P.map(r6), u: U.map(r6), v: V.map(r6), size: this.size } };
    },
    update() {
      const ids = this.ids(), pl = this.plane();
      this.highlight = new Set(ids);
      dlg.set('bodies', { ...bodySelText(new Set(ids)), active: this.pick === 'bodies' });
      dlg.show('plane', this.mode === 'face');
      dlg.set('plane', { text: this.faceN ? 'Rovinná plocha' : 'Klepněte na rovinnou plochu', has: !!this.faceN, active: this.pick === 'plane' });
      const limited = pl && !!pl.rect; dlg.show('su', limited); dlg.show('sv', limited);
      setPrompt(this.pick === 'plane' ? 'Klepněte na rovinnou plochu, jejíž rovina těleso rozřízne' : ids.length ? 'Táhly posuňte, natočte nebo zmenšete řeznou plochu; klepnutím na tělesa změníte výběr' : 'Klepnutím na tělesa vyberte, co rozříznout');
      clearGroup(G.overlay);
      if (pl && ids.length) {
        /* the cutting face as a translucent square (its real size when it is limited) */
        const H = this.visH(), P = (x, y) => K.vadd(pl.P, K.vadd(K.vmul(pl.U, x), K.vmul(pl.V, y)));
        const q = [P(-H, -H), P(H, -H), P(H, H), P(-H, H)];
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]], 3));
        const m = noRay(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: tok.orange, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })));
        m.renderOrder = 4; G.overlay.add(m);
        G.overlay.add(noRay(new THREE.LineLoop(lineGeo([...q[0], ...q[1], ...q[2], ...q[3]]), new THREE.LineBasicMaterial({ color: tok.orange }))));
        /* the normal: "above the plane" is where it points */
        const tip = K.vadd(pl.P, K.vmul(pl.n, Math.max(3, H * 0.35)));
        G.overlay.add(noRay(new THREE.Line(lineGeo([...pl.P, ...tip]), new THREE.LineBasicMaterial({ color: tok.orange }))));
        G.overlay.add(mpts([v3(tip)], tok.orange, 8));
      }
      this.schedule();
      styleBodies();
      this.syncPiv();
    },
    schedule() {
      clearTimeout(this.timer); this.ok_ = false;
      const ids = this.ids(), pl = this.plane();
      if (!ids.length || !pl) { clearGroup(G.preview); this.hideBodies = new Set(); dlg.set('n', !ids.length ? 'Vyberte tělesa, která chcete rozříznout.' : 'Vyberte plochu, podle které se má řezat.'); dlg.okEnabled(false); styleBodies(); requestRender(); return; }
      dlg.set('n', 'Počítám náhled…'); dlg.okEnabled(false);
      this.timer = setTimeout(() => { if (cmd === this) this.compute(); }, 120);
    },
    compute() {
      clearTimeout(this.timer); clearGroup(G.preview); this.hideBodies = new Set();
      const ids = this.ids(), pl = this.plane(); if (!ids.length || !pl) return false;
      let cut = 0;
      try {
        for (const b of cur.bodies.filter(x => ids.includes(x.id))) {
          const hs = Engine.cutTool({ rect: pl.rect }, pl.n, pl.w, K.bbox(b.polys)), pos = K.boolean(b.polys, hs, 'intersect'), neg = K.boolean(b.polys, hs, 'subtract');
          if (!pos.length || !neg.length || Math.abs(K.signedVolume(pos)) < 1e-6 || Math.abs(K.signedVolume(neg)) < 1e-6) continue;
          cut++; this.hideBodies.add(b.id);
          /* the part that stays is shown like the body, the part that goes away in red */
          G.preview.add(previewMesh(pos, this.keep === 'neg' ? 'cut' : 'join'));
          G.preview.add(previewMesh(neg, this.keep === 'pos' ? 'cut' : 'intersect'));
        }
      } catch (e) { dlg.set('n', '!' + e.message); dlg.okEnabled(false); styleBodies(); requestRender(); return false; }
      styleBodies();
      if (!cut) dlg.set('n', '!Řezná plocha žádné vybrané těleso neprotíná.');
      else { this.ok_ = true; dlg.set('n', (this.keep === 'both' ? `Rozřízne se ${plural(cut, 'těleso', 'tělesa', 'těles')}, z každého vzniknou dvě (modře a oranžově).` : 'Červeně je část, která se odstraní.') + (pl.rect ? ' Zmenšená plocha odřízne jen část před sebou (ve směru šipky).' : '')); }
      dlg.okEnabled(this.ok_); requestRender();
      return this.ok_;
    },
    /* manipulator on the cutting face: Posun = arrows (normal; in the plane only for a smaller face), Natočení = rings about the two
       in-plane axes, Velikost = the in-plane scale handles */
    syncPiv() {
      const pl = this.ids().length ? this.plane() : null;
      if (!pl || this.pick === 'plane') { transform.detach(); requestRender(); return; }
      if (this.gdrag) return;
      this.piv.position.copy(v3(pl.P));
      this.piv.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(v3(pl.U), v3(pl.V), v3(pl.n)));
      this.piv.scale.set(1, 1, 1);
      const m = this.hmode;
      transform.setMode(m === 'move' ? 'translate' : m === 'rot' ? 'rotate' : 'scale'); transform.setSpace('local');
      transform.showX = transform.showY = m !== 'move' || !!pl.rect; transform.showZ = m === 'move';
      if (transform.object !== this.piv) transform.attach(this.piv);
      requestRender();
    },
    /* read the manipulator back into the face parameters */
    fromGizmo() {
      const g = this.gdrag; if (!g) return;
      const b0 = this.base(), B = Engine.basisFromPlane(b0.n, b0.w), n0 = v3(b0.n), st = settings.gridSnap ? settings.snap : 0.01, snapL = v => Math.round(Math.round(v / st) * st * 1000) / 1000;
      if (g.mode === 'move') {
        const tilted = this.tilt[0] || this.tilt[1];
        const P = this.piv.position.clone(), bb = this.bb(), cc = bb ? v3([0, 1, 2].map(k => (bb.min[k] + bb.max[k]) / 2)) : new V3();
        const wb = P.dot(n0), Pc = cc.clone().addScaledVector(n0, wb - cc.dot(n0)), d = P.clone().sub(Pc);
        this.off = tilted ? Math.round((wb - (this.mode === 'face' ? this.faceW : 0)) * 1000) / 1000 : snapL(wb - (this.mode === 'face' ? this.faceW : 0)); dlg.set('off', this.off);
        /* the manipulator moves along the TILTED plane's axes; keep the in-plane part of the move too (not only with a limited
           face), otherwise the pivot falls back onto the untilted centre line and the tilted plane moves by less than dragged */
        this.shift = [d.dot(v3(B.u)), d.dot(v3(B.v))].map(x => (tilted ? Math.round(x * 1000) / 1000 : snapL(x))); dlg.set('su', this.shift[0]); dlg.set('sv', this.shift[1]);
        showDimAt(this.lastEv, `Posun roviny ${fmtc(this.off, 2)} mm`);
      } else if (g.mode === 'rot') {
        const n = new V3(0, 0, 1).applyQuaternion(this.piv.quaternion), u = n.dot(v3(B.u)), v = n.dot(v3(B.v)), w = n.dot(n0);
        this.tilt = [Math.max(-90, Math.min(90, Math.round(Math.atan2(-v, w) / D2R))), Math.max(-90, Math.min(90, Math.round(Math.asin(Math.max(-1, Math.min(1, u))) / D2R)))];
        dlg.set('ta', this.tilt[0]); dlg.set('tb', this.tilt[1]);
        showDimAt(this.lastEv, `Natočení ${fmtc(this.tilt[0], 0)}° · ${fmtc(this.tilt[1], 0)}°`);
      } else {
        const k = Math.max(Math.abs(this.piv.scale.x), Math.abs(this.piv.scale.y), 1e-3);
        this.size = Math.max(st, Math.min(this.fullSize(), snapL(g.size * k))); dlg.set('size', this.size);
        showDimAt(this.lastEv, `Velikost ${fmtc(this.size, 2)} mm`);
      }
      this.update();
    },
    onGizmo: null, onDragChange: null, onPtr: null, lastEv: null,
    onMove(ev) { this.lastEv = ev; dom.style.cursor = transform.axis ? 'grab' : hitBodies(ev) ? 'pointer' : ''; },
    onClick(ev) {
      if (transform.axis) return;
      const h = hitBodies(ev); if (!h) return;
      if (this.mode === 'face' && this.pick === 'plane') {
        const fc = faceAtHit(h);
        if (!fc || fc.kind !== 'plane') { toast('Vyberte rovinnou plochu.'); return; }
        this.faceN = fc.n.map(r6); this.faceW = Math.round(fc.w * 1e5) / 1e5;
        if (!this.ids().length) this.bodies.add(fc.bodyId);
        this.pick = 'bodies'; this.ranges(); this.update(); return;
      }
      const id = h.object.userData.bodyId, first = !this.ids().length;
      if (this.bodies.has(id)) this.bodies.delete(id); else this.bodies.add(id);
      if (first && this.ids().length) {
        if (this.mode !== 'face') { this.off = this.centerOff(); dlg.set('off', this.off); }
        this.size = this.fullSize(); dlg.set('size', this.size);
      }
      if (this.mode === 'face' && !this.faceN) this.pick = 'plane';
      this.ranges(); this.update();
    },
    ok() {
      if (!this.ok_ && !this.compute()) return null;
      const pl = this.plane();
      return { id: f ? f.id : newId(), type: 'splitbody', bodies: this.ids(), mode: this.mode, offset: this.off, n: pl.n.map(r6), w: r6(pl.w), keep: this.keep,
        tilt: this.tilt.slice(), shift: this.shift.slice(), size: this.size, ...(pl.rect ? { rect: pl.rect } : {}), ...(this.mode === 'face' ? { fn: this.faceN, fw: this.faceW } : {}) };
    },
    cleanup() {
      clearTimeout(this.timer); this.hideBodies = new Set(); this.highlight = null;
      transform.removeEventListener('objectChange', this.onGizmo); transform.removeEventListener('dragging-changed', this.onDragChange); dom.removeEventListener('pointermove', this.onPtr);
      transform.detach(); scene.remove(this.piv); transform.setMode('translate'); transform.setSpace('world'); transform.showX = transform.showY = transform.showZ = true;
      controls.enabled = true; $('#dim').hidden = true;
    }
  };
  c.onGizmo = () => { if (c.gdrag) c.fromGizmo(); };
  c.onDragChange = e => {
    controls.enabled = !e.value;
    if (e.value) c.gdrag = { mode: c.hmode, size: Math.min(c.size, c.fullSize()) };
    else { c.gdrag = null; $('#dim').hidden = true; c.syncPiv(); c.update(); }
  };
  beginCmd(c); c.init();
}

/* ================= split a planar face with a line ================= */
/* the line is stored on the body (seam); the face then falls apart into parts that can be selected and edited one by one */
function startSplitFace(editIndex, f, face) {
  const R = TOUCH ? 24 : 14;
  const c = {
    editIndex, body: f ? f.body : face && face.kind === 'plane' ? face.bodyId : null,
    n: f ? f.n.slice() : face && face.kind === 'plane' ? face.n.slice() : null, w: f ? f.w : face && face.kind === 'plane' ? face.w : 0,
    seed: f ? f.a.slice() : face && face.kind === 'plane' ? face.p.slice() : null,
    pts: f ? [v3(f.a), v3(f.b)] : [], hover: null, valid: false,
    polys() { const b = cur.bodies.find(x => x.id === this.body); return b ? b.polys : null; },
    init() {
      if (!cur.bodies.length) { endCmd(false); toast('Model zatím neobsahuje žádné těleso.'); return; }
      openDialog({
        title: 'Rozdělit plochu', icon: 'splitface',
        fields: [{ k: 'sel', id: 'face', label: 'Plocha' }, { k: 'sel', id: 'p1', label: 'Bod 1' }, { k: 'sel', id: 'p2', label: 'Bod 2' },
          { k: 'btns', id: 'dir', label: 'Čára z bodu 1', options: [['u', 'Vodorovně'], ['v', 'Svisle']] }, { k: 'note', id: 'n' }],
        onBtn: (id, v) => {
          if (id !== 'dir' || !this.n || !this.pts.length) return;
          const B = Engine.basisFromPlane(this.n, this.w), d = v3(v === 'u' ? B.u : B.v);
          this.pts = [this.pts[0], this.pts[0].clone().addScaledVector(d, 10)]; this.update();
        }
      });
      this.update();
    },
    basis() { return Engine.basisFromPlane(this.n, this.w); },
    /* point on the face plane under the pointer; snaps to corners, edge midpoints, circle centres and edges of that plane, then to the grid */
    pick(ev) {
      const P = this.polys(); if (!P) return null;
      ray.setFromCamera(evNdc(ev), cam());
      const pl = new THREE.Plane(v3(this.n), -this.w), x = new V3();
      if (!ray.ray.intersectPlane(pl, x)) return null;
      const [mx, my] = evPx(ev), onPl = p => Math.abs(K.vdot(this.n, p) - this.w) < 1e-3;
      const t = measureTargets(P); let best = null, bd = R;
      for (const q of t.pts) { if (!onPl(q.p.toArray())) continue; const sp = toPx(q.p), d = Math.hypot(sp[0] - mx, sp[1] - my) - (q.kind === 'v' ? 3 : 0); if (d < bd) { bd = d; best = { p: q.p.clone(), kind: q.kind }; } }
      if (best) return best;
      bd = R * 0.75;
      for (const ch of t.chains) {
        if (!ch.pts.every(onPl)) continue;
        let prev = null, prevP = null;
        for (const p of ch.pts) { const q = toPx(v3(p)); if (prev) { const [d, tt] = segDist(mx, my, prev, q); if (d < bd) { bd = d; best = { p: v3(prevP).lerp(v3(p), tt), kind: 'e', ch }; } } prev = q; prevP = p; }
      }
      /* on a straight edge the point moves in grid steps from the edge's start */
      if (best && best.ch.kind === 'line' && settings.gridSnap) {
        const a = v3(best.ch.line.p0), b = v3(best.ch.line.p1), L = a.distanceTo(b), st = settings.snap;
        const t = Math.min(L, Math.max(0, Math.round(best.p.distanceTo(a) / st) * st));
        best.p = a.clone().lerp(b, L > 0 ? t / L : 0);
      }
      if (best) return best;
      if (settings.gridSnap) {
        const B = this.basis(), o = v3(B.o), u = v3(B.u), v = v3(B.v), d = x.clone().sub(o), st = settings.snap;
        const gu = Math.round(d.dot(u) / st) * st, gv = Math.round(d.dot(v) / st) * st;
        return { p: o.clone().addScaledVector(u, gu).addScaledVector(v, gv), kind: 'g' };
      }
      return { p: x, kind: 'f' };
    },
    line(a, b) { return { n: this.n, w: this.w, a: a.toArray(), b: b.toArray() }; },
    update() {
      clearGroup(G.overlay);
      const P = this.polys(), has = !!(P && this.n);
      dlg.set('face', { text: has ? 'Rovinná plocha' : 'Klepněte na rovinnou plochu', has, active: !has });
      const f3 = p => `${fmtc(p.x, 2)}; ${fmtc(p.y, 2)}; ${fmtc(p.z, 2)}`;
      dlg.set('p1', { text: this.pts[0] ? f3(this.pts[0]) : 'Klepněte na plochu', has: !!this.pts[0], active: has && (this.pts.length === 0 || this.pts.length === 2) });
      dlg.set('p2', { text: this.pts[1] ? f3(this.pts[1]) : 'Klepněte na plochu', has: !!this.pts[1], active: has && this.pts.length === 1 });
      dlg.show('dir', this.pts.length >= 1);
      this.valid = false;
      if (has) {
        const g = K.planarFace(P, this.n, this.w, this.seed);
        if (g) G.overlay.add(faceOverlay(g.map(i => P[i]), planeKey(P[g[0]]), tok.accent, 0.18));
        const b = this.pts.length === 2 ? this.pts[1] : this.pts.length === 1 && this.hover ? this.hover.p : null;
        if (b && this.pts[0].distanceTo(b) > 1e-3) {
          const q = this.line(this.pts[0], b), seg = Engine.seamSegments(P, [q]);
          if (seg.length) { const l = noRay(new THREE.LineSegments(lineGeo(seg), new THREE.LineBasicMaterial({ color: tok.orange, depthTest: false, transparent: true }))); l.renderOrder = 12; G.overlay.add(l); }
          if (this.pts.length === 2) {
            const h = Engine.seamPlane(q), gg = g || [];
            const A = K.surfaceArea(Engine.clipRegion(P, gg, [h])), Bb = K.surfaceArea(Engine.clipRegion(P, gg, [{ m: K.vmul(h.m, -1), d: -h.d }]));
            this.valid = A > 1e-4 && Bb > 1e-4;
            dlg.set('n', this.valid ? `Plocha se rozdělí na části ${fmtc(A, 1)} mm² a ${fmtc(Bb, 1)} mm². Každou pak vyberete a upravíte samostatně.` : '!Čára plochu nerozdělí, musí plochou procházet.');
          }
        }
        if (this.pts.length < 2) dlg.set('n', this.pts.length ? 'Klepněte na druhý bod, nebo veďte čáru vodorovně či svisle.' : 'Body se přichytí k rohům, středům hran a hranám plochy, jinak k mřížce.');
        if (this.pts.length) G.overlay.add(mpts(this.pts, tok.orange, 10));
        if (this.hover) G.overlay.add(mpts([this.hover.p], tok.accent, 12));
      } else dlg.set('n', 'Vyberte rovinnou stěnu tělesa, kterou chcete rozdělit.');
      setPrompt(!has ? 'Klepněte na rovinnou plochu, kterou chcete rozdělit' : this.pts.length === 1 ? 'Klepněte na druhý bod dělicí čáry' : 'Klepněte na první bod dělicí čáry');
      dlg.okEnabled(this.valid); requestRender();
    },
    onMove(ev) {
      if (!this.n) { dom.style.cursor = hitBodies(ev) ? 'pointer' : ''; return; }
      const q = this.pick(ev); dom.style.cursor = q ? 'crosshair' : '';
      const key = o => (o ? o.kind + o.p.toArray().map(v => v.toFixed(4)).join() : '');
      if (key(q) !== key(this.hover)) { this.hover = q; this.update(); }
    },
    onClick(ev) {
      if (!this.n) {
        const h = hitBodies(ev), fc = h ? faceAtHit(h) : null;
        if (!fc || fc.kind !== 'plane') { if (h) toast('Rozdělit lze jen rovinnou plochu.'); return; }
        this.body = fc.bodyId; this.n = fc.n.slice(); this.w = fc.w; this.seed = fc.p.slice(); this.update(); return;
      }
      const q = this.pick(ev); if (!q) return;
      if (this.pts.length >= 2) this.pts = [];
      this.pts.push(q.p); this.hover = TOUCH ? null : q; this.update();
    },
    ok() {
      if (!this.valid) return null;
      const r4 = v => Math.round(v * 1e4) / 1e4, r6 = v => Math.round(v * 1e6) / 1e6;
      return { id: f ? f.id : newId(), type: 'splitface', body: this.body, n: this.n.map(r6), w: r6(this.w), a: this.pts[0].toArray().map(r4), b: this.pts[1].toArray().map(r4) };
    },
    after() { selFace = null; hoverFace = null; setTimeout(() => toast('Plocha je rozdělená. V režimu Plochy klepněte na její část a upravte ji.'), 700); },
    cleanup() { this.hover = null; }
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
  for (const p of facePolys(face)) { const a = K.surfaceArea([p]); let q = [0, 0, 0]; for (const v of p.v) q = K.vadd(q, v); q = K.vmul(q, 1 / p.v.length); A += a; for (let k = 0; k < 3; k++) c[k] += q[k] * a; }
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
      const fc = this.faceUnder(ev), same = (a, b) => faceKey(a) === faceKey(b);
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
    /* the copy goes next to the original: along X in the top, front and back views, along Y in the side views
       (in plane coordinates: the plane direction closest to that world axis), shifted by its own width + 5 mm */
    const P = sk.f.plane, W = Math.abs(P.n[0]) > 0.9 ? [0, 1, 0] : [1, 0, 0];
    let du = W[0] * P.u[0] + W[1] * P.u[1] + W[2] * P.u[2], dv = W[0] * P.v[0] + W[1] * P.v[1] + W[2] * P.v[2]; const dl = Math.hypot(du, dv) || 1; du /= dl; dv /= dl;
    const proj = entityPolylines(clip.ents).flatMap(pl => pl.pts).map(q => q[0] * du + q[1] * dv);
    const width = proj.length ? Math.max(...proj) - Math.min(...proj) : 0, stepD = Math.ceil((width + 5) / settings.snap) * settings.snap, d = stepD * clip.n;
    for (const e of clip.ents) { const c = translateEnt(e, d * du, d * dv); if (c.pts) c.pts = c.pts.map(q => [Math.round(q[0] * 1e4) / 1e4, Math.round(q[1] * 1e4) / 1e4]); sk.f.ents.push(c); }
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
    sk.f.ents.push(translateEnt(e, 0, 0)); sk.selEnt = sk.f.ents.length - 1; renderPalette(); redrawSketch(); toast('Duplikováno na stejné místo. Kopii přesunete tažením.'); return;
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
  /* grow over neighbours whose normal is perpendicular to the axis (breadth first, nearest first) */
  const grow = ok => {
    const g = new Set([pi]), order = [pi];
    for (let h = 0; h < order.length; h++) {
      const i = order[h];
      for (const nb of adj[i]) { if (g.has(nb)) continue; const q = polys[nb]; if (Math.abs(K.vdot(q.n, axis)) < 0.02 && K.vdot(q.n, polys[i].n) > lim && ok(nb)) { g.add(nb); order.push(nb); } }
    }
    return { g, order };
  };
  const tt = Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = K.vnorm(K.cross(axis, tt)), e2 = K.cross(axis, e1);
  const fit = idx => {
    const p2 = []; for (const i of idx) for (const v of polys[i].v) p2.push([K.vdot(v, e1), K.vdot(v, e2)]);
    const A = p2[0]; let B = A, bd = 0, C = A, cd = 0;
    for (const q of p2) { const d = Math.hypot(q[0] - A[0], q[1] - A[1]); if (d > bd) { bd = d; B = q; } }
    for (const q of p2) { const d = Math.abs((B[0] - A[0]) * (q[1] - A[1]) - (B[1] - A[1]) * (q[0] - A[0])); if (d > cd) { cd = d; C = q; } }
    const D = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]));
    if (Math.abs(D) < 1e-9) return null;
    const s = q => q[0] * q[0] + q[1] * q[1];
    const cx = (s(A) * (B[1] - C[1]) + s(B) * (C[1] - A[1]) + s(C) * (A[1] - B[1])) / D, cy = (s(A) * (C[0] - B[0]) + s(B) * (A[0] - C[0]) + s(C) * (B[0] - A[0])) / D;
    return { cx, cy, r: Math.hypot(A[0] - cx, A[1] - cy) };
  };
  /* a torus or other curved surface next to the cylinder has strips with the same kind of normals: fit the circle on the polygons
     nearest to the tapped one, keep only polygons lying on that cylinder and regrow from the tapped polygon through them */
  const first = grow(() => true);
  if (first.g.size < 6) return null;
  const f0 = fit(first.order.slice(0, Math.min(first.order.length, 40)));
  if (!f0) return null;
  const Q = K.vadd(K.vmul(e1, f0.cx), K.vmul(e2, f0.cy)), planeDist = P => Math.abs(K.vdot(P.n, Q) - P.w), d0 = planeDist(p0);
  const onCyl = i => {
    const P = polys[i];
    if (!P.v.every(v => Math.abs(Math.hypot(K.vdot(v, e1) - f0.cx, K.vdot(v, e2) - f0.cy) - f0.r) < 0.03 * f0.r + 0.01)) return false;
    /* all facets of one cylinder lie at the same distance from its axis (a neighbouring torus strip lies a little further out) */
    return Math.abs(planeDist(P) - d0) < Math.max(1e-3, 5e-4 * f0.r);
  };
  const group = grow(onCyl).g;
  if (group.size < 6) return null;
  const pts = []; for (const i of group) for (const v of polys[i].v) pts.push(v);
  const p2 = pts.map(v => [K.vdot(v, e1), K.vdot(v, e2)]);
  const ff = fit(group); if (!ff) return null;
  const { cx, cy, r } = ff;
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
/* default 3D-print clearances on the diameter, from print tests: bolt / pin 0.15 mm, nut / hole 0.35 mm */
const TOL_HINGE = 0.3; /* hinges and latches, from the user's test prints */
const TOL_BOLT = 0.15, TOL_NUT = 0.35;
const threadLabel = (d, p) => `M${fmtc(d, 1)} × ${fmtc(p, 2)}`;
function startThread(editIndex, f) {
  const c = {
    editIndex, body: f ? f.body : null, face: f ? { c: f.c, ax: f.ax, r: f.r, len: f.len, internal: f.internal } : null,
    size: f ? f.size : 10, pitch: f ? f.pitch : 1.5, left: f ? !!f.left : false, full: f ? f.full !== false : true, tol: f ? (Number(f.tol) || 0) : TOL_BOLT, tolSet: !!f,
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
          { k: 'num', id: 'tol', label: 'Vůle pro 3D tisk', value: this.tol },
          { k: 'chk', id: 'full', label: 'Po celé délce plochy', value: this.full },
          { k: 'seg', id: 'from', label: 'Měřit od', options: [['a', 'Spodní konec'], ['b', 'Horní konec']], value: this.fromEnd ? 'b' : 'a' },
          { k: 'num', id: 'start', label: 'Odsazení', value: this.start }, { k: 'num', id: 'length', label: 'Délka závitu', value: this.length },
          { k: 'note', id: 'n' }],
        onChange: id => {
          if (id === 'size') { this.size = parseFloat(dlg.get('size')); const t = Engine.THREADS.find(x => x[0] === this.size); if (t) { this.pitch = t[1]; dlg.set('pitch', t[1]); } }
          else if (id === 'pitch') { const v = dlg.get('pitch'); if (v > 0) this.pitch = v; }
          else if (id === 'hand') this.left = dlg.get('hand') === 'l';
          else if (id === 'tol') { const v = dlg.get('tol'); if (v >= 0 && v <= 1) { this.tol = v; this.tolSet = true; } }
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
      /* default clearance by kind: a hole (nut side) needs more than a pin (bolt side) */
      if (!this.tolSet) { this.tol = cyl.internal ? TOL_NUT : TOL_BOLT; dlg.set('tol', this.tol); }
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
      return { id: f ? f.id : 'tmp', type: 'thread', body: this.body, ...this.face, size: this.size, pitch: this.pitch, left: this.left, tol: this.tol, full: this.full,
        length: this.length, start: this.start, fromEnd: this.fromEnd };
    },
    update() {
      const fc = this.face;
      dlg.set('face', { text: fc ? `Válcová plocha Ø${fmtc(fc.r * 2, 2)}` : 'Klepněte na válcovou plochu', has: !!fc, active: true });
      dlg.set('kind', fc ? `${fc.internal ? 'Vnitřní závit (díra)' : 'Vnější závit (čep)'} · délka plochy ${fmtc(fc.len, 2)} mm` + (this.tol > 0 ? ` · vůle ${fc.internal ? 'zvětší' : 'zmenší'} závit o ${fmtc(this.tol, 2)} mm` : '') : 'Vyberte vnější plochu čepu nebo vnitřní plochu díry.');
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
function showDimAt(ev, text) { if (!ev) return; const el = $('#dim'), px = evPx(ev); el.textContent = text; el.hidden = false; el.style.left = px[0] + 'px'; el.style.top = px[1] + 'px'; }

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
    editIndex, all: f ? !!f.all : false, bodies: new Set(f ? (f.bodies || []) : [...sel]), r: f ? f.r.slice() : [0, 0, 0],
    pivotMode: f ? (f.pivot || 'center') : 'center', ground: f ? !!f.ground : true, dragging: false, faceMode: false, center: new V3(), highlight: new Set(),
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
          /* angles and grounding only change the transform: no need to recompute the selection box */
          if (id === 'r') { this.r = dlg.get('r'); this.apply(true); return; }
          if (id === 'ground') { this.ground = dlg.get('ground'); this.apply(true); return; }
          if (id === 'all') this.all = dlg.get('all');
          if (id === 'pivot') this.pivotMode = dlg.get('pivot');
          this.recenter();
        },
        onBtn: (id, v) => {
          if (id === 'face') { this.faceMode = !this.faceMode; this.recenter(); return; }
          const ax = v[0] === 'x' ? new V3(1, 0, 0) : v[0] === 'y' ? new V3(0, 1, 0) : new V3(0, 0, 1);
          const q = new THREE.Quaternion().setFromAxisAngle(ax, (v[1] === '+' ? 1 : -1) * Math.PI / 2).multiply(this.quat());
          this.setQuat(q); this.apply(true);
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
      /* the manipulator follows the rotated selection (incl. the shift onto the bed); while dragging it must stay put */
      if (!this.dragging && transform.object === pivot) pivot.position.copy(this.center).applyMatrix4(M);
      styleBodies();
    },
    onBody(id) { if (this.all) return; if (this.bodies.has(id)) this.bodies.delete(id); else this.bodies.add(id); this.recenter(); },
    /* ---- angle scale just inside the rotation rings (between the ring and the free-rotation ball, so it does not catch the
       manipulator): a tick every 5°, a longer one every 15°; tapping a tick turns to that angle ---- */
    ticks: null, tickList: [], hoverTick: null,
    /* direction of angle a (radians) on the ring about axis k; 0° at +Y for X, +Z for Y, +X for Z, growing anticlockwise about the axis */
    ringDir(k, a) { const c2 = Math.cos(a), s2 = Math.sin(a); return k === 0 ? new V3(0, c2, s2) : k === 1 ? new V3(s2, 0, c2) : new V3(c2, s2, 0); },
    gizmoRadius() {
      const c3 = cam(), p = pivot.position;
      const factor = c3.isOrthographicCamera ? (c3.top - c3.bottom) / c3.zoom : p.distanceTo(c3.position) * Math.min(1.9 * Math.tan(Math.PI * c3.fov / 360) / c3.zoom, 7);
      return factor * transform.size / 7;
    },
    onFrame() {
      if (!this.ticks) {
        this.ticks = new THREE.Group(); scene.add(this.ticks);
        for (let k = 0; k < 3; k++) {
          const l = noRay(new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: HANDLE_AXIS_COL[k], depthTest: false, transparent: true, opacity: 0.85 })));
          l.renderOrder = 15; l.frustumCulled = false; this.ticks.add(l);
        }
        const hl = noRay(new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffd000, depthTest: false, transparent: true })));
        hl.renderOrder = 16; hl.frustumCulled = false; this.ticks.add(hl);
        const cur3 = noRay(new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 7, sizeAttenuation: false, depthTest: false, transparent: true, vertexColors: true })));
        cur3.renderOrder = 16; cur3.frustumCulled = false; this.ticks.add(cur3);
      }
      const on = transform.object === pivot && !this.faceMode;
      this.ticks.visible = on; if (!on) { this.tickList = []; return; }
      const C = pivot.position, R = this.gizmoRadius(), toCam = cam().position.clone().sub(C).normalize();
      this.tickList = [];
      for (let k = 0; k < 3; k++) {
        const arr = [];
        for (let d = 0; d < 360; d += 5) {
          const u = this.ringDir(k, d * D2R);
          if (u.dot(toCam) < -0.05) continue; /* only the half of the ring facing the viewer, like the ring itself */
          const big = d % 15 === 0, a2 = C.clone().addScaledVector(u, R * 0.88), b2 = C.clone().addScaledVector(u, R * (big ? 0.74 : 0.8));
          arr.push(a2.x, a2.y, a2.z, b2.x, b2.y, b2.z);
          this.tickList.push({ k, d: d > 180 ? d - 360 : d, a: a2, b: b2 });
        }
        this.ticks.children[k].geometry.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      }
      const h = this.hoverTick, hl = [];
      if (h) { const u = this.ringDir(h.k, h.d * D2R), a2 = C.clone().addScaledVector(u, R * 0.89), b2 = C.clone().addScaledVector(u, R * 0.71); hl.push(a2.x, a2.y, a2.z, b2.x, b2.y, b2.z); }
      this.ticks.children[3].geometry.setAttribute('position', new THREE.Float32BufferAttribute(hl, 3));
      /* current angle of each axis as a dot on its scale */
      const pts = [], cols = [];
      for (let k = 0; k < 3; k++) { const u = this.ringDir(k, this.r[k] * D2R); if (u.dot(toCam) < -0.05) continue; const q = C.clone().addScaledVector(u, R * 0.84); pts.push(q.x, q.y, q.z); const cc = new THREE.Color(HANDLE_AXIS_COL[k]); cols.push(cc.r, cc.g, cc.b); }
      const g2 = this.ticks.children[4].geometry; g2.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g2.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    },
    tickAt(ev) {
      if (!this.tickList.length || this.dragging) return null;
      const [mx, my] = evPx(ev), lim = TOUCH ? 11 : 7, toCam = cam().position.clone().sub(pivot.position).normalize();
      /* where two scales cross (on the axes) prefer the ring that faces the viewer more */
      let best = null, bs = Infinity;
      for (const t of this.tickList) {
        const pa = toPx(t.a), pb = toPx(t.b); if (pa[2] >= 1) continue; const [dd] = segDist(mx, my, pa, pb); if (dd > lim) continue;
        const sc = dd - 3 * Math.abs(toCam.getComponent(t.k)); if (sc < bs) { bs = sc; best = t; }
      }
      return best;
    },
    onMove(ev) {
      const t = this.tickAt(ev);
      if ((t && t.k + ':' + t.d) !== (this.hoverTick && this.hoverTick.k + ':' + this.hoverTick.d)) { this.hoverTick = t; requestRender(); }
      /* over a tick the scale wins: the manipulator ignores the pointer, so a tap selects the angle instead of grabbing a ring */
      transform.enabled = !t; if (t) transform.axis = null;
      if (t) { dom.style.cursor = 'pointer'; showDimAt(ev, `${'XYZ'[t.k]}: ${fmtc(t.d, 0)}°`); return; }
      $('#dim').hidden = true;
      dom.style.cursor = hitBodies(ev) ? 'pointer' : '';
    },
    onClick(ev) {
      const t = this.tickAt(ev);
      if (t) { this.r[t.k] = t.d; dlg.set('r', this.r); this.apply(true); $('#dim').hidden = true; return; }
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
    cleanup(applied) {
      transform.removeEventListener('objectChange', this.onGizmo);
      transform.removeEventListener('dragging-changed', this.onDragChange);
      transform.detach(); scene.remove(pivot); transform.setMode('translate');
      resetBodyMatrices(applied);
      this.highlight = null;
      if (this.ticks) { scene.remove(this.ticks); disposeObj(this.ticks); this.ticks = null; }
      transform.enabled = true;
      $('#dim').hidden = true;
    }
  };
  c.onGizmo = () => { c.r = [roundDeg(pivot.rotation.x), roundDeg(pivot.rotation.y), roundDeg(pivot.rotation.z)]; dlg.set('r', c.r); c.apply(false); };
  c.onDragChange = e => { controls.enabled = !e.value; c.dragging = e.value; if (!e.value) c.apply(false); };
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
/* snap targets of one body: corners, edge midpoints and circle/arc centres from the feature-edge chains (cached per mesh) */
const measureCache = new WeakMap();
function measureTargets(polys) {
  let t = measureCache.get(polys);
  if (t) return t;
  const pts = [], seen = new Set();
  const add = (p, kind, info) => { const k = kind + K.qk(p); if (seen.has(k)) return; seen.add(k); pts.push({ p: v3(p), kind, info }); };
  const chains = chainsFor(polys);
  for (const c of chains) {
    if (c.kind === 'line') {
      add(c.line.p0, 'v'); add(c.line.p1, 'v');
      add([(c.line.p0[0] + c.line.p1[0]) / 2, (c.line.p0[1] + c.line.p1[1]) / 2, (c.line.p0[2] + c.line.p1[2]) / 2], 'm', c);
    } else if (c.kind === 'arc') {
      add(c.pts[0], 'v'); add(c.pts[c.pts.length - 1], 'v'); add(c.circle.c, 'c', c);
    } else if (c.kind === 'circle') add(c.circle.c, 'c', c);
  }
  t = { pts, chains }; measureCache.set(polys, t); return t;
}
const MEASURE_KIND = { v: 'Vrchol', m: 'Střed hrany', c: 'Střed kružnice', e: 'Hrana', f: 'Plocha' };
function chainInfo(c) {
  if (!c) return '';
  if (c.kind === 'circle') return `Kružnice · Ø ${fmtc(2 * c.circle.r, 3)} mm`;
  if (c.kind === 'arc') return `Oblouk · R ${fmtc(c.circle.r, 3)} mm`;
  let L = 0; for (let i = 1; i < c.pts.length; i++) L += Math.hypot(c.pts[i][0] - c.pts[i - 1][0], c.pts[i][1] - c.pts[i - 1][1], c.pts[i][2] - c.pts[i - 1][2]);
  return `Hrana · délka ${fmtc(L, 3)} mm`;
}
function mpts(list, color, size) {
  const arr = []; for (const p of list) arr.push(p.x, p.y, p.z);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  const o = noRay(new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: false, depthTest: false, transparent: true })));
  o.renderOrder = 13; return o;
}
/* what was picked, as geometry: a point, a straight edge (line) or a flat face (plane) */
function measureGeom(q) {
  if (q.kind === 'e' && q.chain && q.chain.kind === 'line') { const a = v3(q.chain.line.p0), b = v3(q.chain.line.p1); return { t: 'line', a, b, d: b.clone().sub(a).normalize() }; }
  if (q.kind === 'f' && q.flat) return { t: 'plane', o: q.p, n: q.n };
  return { t: 'point', p: q.p };
}
/* distance between two picks: perpendicular when an edge or a face is involved, plus the angle for non-parallel edges or faces */
function measureResult(qa, qb) {
  const A = measureGeom(qa), B = measureGeom(qb), D2R_ = 180 / Math.PI;
  const onLine = (p, L) => L.a.clone().add(L.d.clone().multiplyScalar(p.clone().sub(L.a).dot(L.d)));
  const onPlane = (p, P) => p.clone().sub(P.n.clone().multiplyScalar(p.clone().sub(P.o).dot(P.n)));
  const par = (u, v) => Math.abs(Math.abs(u.dot(v)) - 1) < 1e-4;
  const ang = (u, v) => Math.acos(Math.min(1, Math.abs(u.dot(v)))) * D2R_;
  const T = A.t + '-' + B.t;
  let pa = qa.p.clone(), pb = qb.p.clone(), label = 'Vzdálenost', angle = null, angOnly = false;
  if (T === 'point-point') { /* plain */ }
  else if (T === 'point-line') { pb = onLine(pa, B); label = 'Kolmá vzdálenost od hrany'; }
  else if (T === 'line-point') { pa = onLine(pb, A); label = 'Kolmá vzdálenost od hrany'; }
  else if (T === 'point-plane') { pb = onPlane(pa, B); label = 'Kolmá vzdálenost od plochy'; }
  else if (T === 'plane-point') { pa = onPlane(pb, A); label = 'Kolmá vzdálenost od plochy'; }
  else if (T === 'line-line') {
    if (par(A.d, B.d)) { pb = onLine(pa, B); label = 'Vzdálenost rovnoběžných hran'; }
    else {
      const w = A.a.clone().sub(B.a), b = A.d.dot(B.d), d = A.d.dot(w), e = B.d.dot(w), den = 1 - b * b;
      pa = A.a.clone().add(A.d.clone().multiplyScalar((b * e - d) / den)); pb = B.a.clone().add(B.d.clone().multiplyScalar((e - b * d) / den));
      label = 'Nejkratší vzdálenost přímek hran'; angle = ang(A.d, B.d);
    }
  } else if (T === 'plane-plane') {
    if (par(A.n, B.n)) { pb = onPlane(pa, B); label = 'Vzdálenost rovnoběžných ploch'; }
    else { angOnly = true; angle = 180 - Math.acos(Math.max(-1, Math.min(1, A.n.dot(B.n)))) * D2R_; }
  } else if (T === 'line-plane' || T === 'plane-line') {
    const L = A.t === 'line' ? A : B, P = A.t === 'line' ? B : A;
    if (Math.abs(L.d.dot(P.n)) < 1e-4) { const pl = L === A ? pa : pb, pp = onPlane(pl, P); if (L === A) pb = pp; else pa = pp; label = 'Vzdálenost hrany od plochy'; }
    else { angOnly = true; angle = 90 - Math.acos(Math.min(1, Math.abs(L.d.dot(P.n)))) * D2R_; }
  }
  return { pa, pb, d: pa.distanceTo(pb), label, angle, angOnly };
}
function startMeasure() {
  const R = TOUCH ? 24 : 14; /* snap radius in screen pixels */
  const c = {
    pts: [], hover: null,
    init() {
      openDialog({ title: 'Měřit', icon: 'measure', fields: [{ k: 'sel', id: 'p1', label: 'Bod 1' }, { k: 'sel', id: 'p2', label: 'Bod 2' }, { k: 'note', id: 'n' }] });
      dlg.okLabel('Zavřít');
      this.update();
    },
    /* snapping order: corner / edge midpoint / circle centre within R px, then the nearest point of an edge, then the face under the cursor */
    pick(ev) {
      const [mx, my] = evPx(ev), pm = new Set(pickableMeshes());
      const near = [], edges = [];
      for (const [, e] of meshes) {
        if (!pm.has(e.mesh)) continue;
        const t = measureTargets(e.polys);
        for (const q of t.pts) { const s = toPx(q.p); if (s[2] >= 1) continue; const d = Math.hypot(s[0] - mx, s[1] - my); if (d < R) near.push({ p: q.p, kind: q.kind, chain: q.info, d: d - (q.kind === 'v' ? 3 : 0) }); }
        for (const ch of t.chains) {
          let best = Infinity, bp = null, prev = null, prevP = null;
          for (const p of ch.pts) {
            const q = toPx(v3(p));
            if (prev && prev[2] < 1 && q[2] < 1) { const [d, tt] = segDist(mx, my, prev, q); if (d < best) { best = d; bp = v3(prevP).lerp(v3(p), tt); } }
            prev = q; prevP = p;
          }
          if (best < R * 0.75) edges.push({ p: bp, kind: 'e', chain: ch, d: best });
        }
      }
      near.sort((a, b) => a.d - b.d);
      for (const q of near.slice(0, 10)) if (!occluded(q.p)) return q;
      edges.sort((a, b) => a.d - b.d);
      for (const q of edges.slice(0, 8)) if (!occluded(q.p)) return q;
      const h = hitBodies(ev);
      if (!h) return null;
      const { poly } = polyOfHit(h), polys = h.object.userData.polys;
      return { p: h.point.clone(), kind: 'f', n: v3(poly.n).normalize(), flat: !smoothFor(polys)[polys.indexOf(poly)], polys, key: planeKey(poly), pi: polys.indexOf(poly) };
    },
    update() {
      const f3 = q => `${MEASURE_KIND[q.kind]}: ${fmtc(q.p.x, 2)}; ${fmtc(q.p.y, 2)}; ${fmtc(q.p.z, 2)}`;
      dlg.set('p1', { text: this.pts[0] ? f3(this.pts[0]) : 'Klepněte na model', has: !!this.pts[0], active: this.pts.length === 0 || this.pts.length === 2 });
      dlg.set('p2', { text: this.pts[1] ? f3(this.pts[1]) : 'Klepněte na model', has: !!this.pts[1], active: this.pts.length === 1 });
      clearGroup(G.overlay);
      const line = (a, b, dashed) => {
        const ln = noRay(new THREE.Line(lineGeo([a.x, a.y, a.z, b.x, b.y, b.z]), dashed
          ? new THREE.LineDashedMaterial({ color: tok.orange, depthTest: false, transparent: true, dashSize: worldPerPx(a) * 6, gapSize: worldPerPx(a) * 4 })
          : new THREE.LineBasicMaterial({ color: tok.orange, depthTest: false, transparent: true })));
        if (dashed) ln.computeLineDistances();
        ln.renderOrder = 12; G.overlay.add(ln);
      };
      const hv = this.hover;
      const mark = (q, col, op) => { if (q.chain) G.overlay.add(segLine(q.chain.pts, col)); else if (q.kind === 'f' && q.flat) G.overlay.add(faceOverlay(q.polys, q.key, col, op)); };
      this.pts.forEach(q => mark(q, tok.orange, 0.25));
      if (hv && !this.pts.some(q => (q.chain && q.chain === hv.chain) || (q.kind === 'f' && hv.kind === 'f' && q.polys === hv.polys && q.key === hv.key))) mark(hv, tok.accent, 0.18);
      if (this.pts.length) G.overlay.add(mpts(this.pts.map(q => q.p), tok.orange, 10));
      if (hv) G.overlay.add(mpts([hv.p], hv.kind === 'f' ? tok.muted : tok.accent, hv.kind === 'f' ? 7 : 12));
      const tip = (cls, text, w, dy) => {
        let el = document.querySelector('.mtip.' + cls);
        if (!text) { if (el) el.remove(); return; }
        if (!el) { el = document.createElement('div'); el.className = 'mtip ' + cls; $('#skdims').parentNode.appendChild(el); }
        el.textContent = text; el._w = w.clone(); el._dy = dy; this.onFrame();
      };
      /* a circular edge or a cylindrical face gives its diameter straight away */
      const dia = q => { if (!q) return null; if (q.chain && q.chain.circle) return q.chain.circle.r * 2; if (q.kind === 'f' && !q.flat && q.pi >= 0) { const cy = cylinderAt(q.polys, q.pi); return cy ? cy.r * 2 : null; } return null; };
      const dq = this.pts.length === 1 && !(hv && this.pts.length === 1 && hv !== this.pts[0] && hv.p.distanceTo(this.pts[0].p) > 1e-6) ? this.pts[0] : this.pts.length === 0 ? hv : null, dv = dia(dq);
      tip('kind', hv ? MEASURE_KIND[hv.kind] + (dia(hv) ? ` · Ø ${fmtc(dia(hv), 3)} mm` : '') : '', hv && hv.p, -18);
      const Q2 = this.pts.length === 2 ? this.pts[1] : this.pts.length === 1 && hv ? hv : null;
      const r = Q2 ? measureResult(this.pts[0], Q2) : null;
      const angTxt = r && r.angle !== null ? `Úhel ${fmtc(r.angle, 2)}°` : '';
      tip('len', r ? (r.angOnly ? angTxt : `${fmtc(r.d, 3)} mm`) : '', r && r.pa.clone().add(r.pb).multiplyScalar(0.5), 0);
      let note = 'Bod se přichytí k vrcholu, středu hrany, středu kružnice nebo k hraně. Klepnutím na hranu nebo rovnou plochu se měří kolmá vzdálenost.';
      if (r) {
        line(r.pa, r.pb, this.pts.length === 1);
        if (r.pa.distanceTo(this.pts[0].p) > 1e-6) line(this.pts[0].p, r.pa, true);
        if (r.pb.distanceTo(Q2.p) > 1e-6) line(Q2.p, r.pb, true);
        note = r.angOnly ? `${angTxt} · vzdálenost bodů ${fmtc(r.d, 3)} mm` : `${r.label} ${fmtc(r.d, 3)} mm · ΔX ${fmtc(r.pb.x - r.pa.x, 3)} · ΔY ${fmtc(r.pb.y - r.pa.y, 3)} · ΔZ ${fmtc(r.pb.z - r.pa.z, 3)} mm` + (angTxt ? ' · ' + angTxt : '');
      }
      else if (hv && hv.chain) note = chainInfo(hv.chain);
      else if (hv) note = f3(hv);
      if (!r && dv) note = `Průměr Ø ${fmtc(dv, 3)} mm (poloměr ${fmtc(dv / 2, 3)} mm) · ` + note;
      else if (!r && !this.pts.length) note = 'Průměr změříte klepnutím na válcovou plochu nebo kruhovou hranu. ' + note;
      dlg.set('n', note);
      setPrompt(this.pts.length === 1 ? (dv ? `Průměr Ø ${fmtc(dv, 3)} mm · klepněte na druhý bod pro vzdálenost` : 'Klepněte na druhý bod') : 'Klepněte na první bod (průměr: klepněte na válcovou plochu nebo kruhovou hranu)');
      dlg.okEnabled(true); requestRender();
    },
    onMove(ev) {
      const q = this.pick(ev); dom.style.cursor = q ? 'crosshair' : '';
      const k = q ? q.kind + q.p.x.toFixed(4) + q.p.y.toFixed(4) + q.p.z.toFixed(4) : '', ok = this.hover ? this.hover.kind + this.hover.p.x.toFixed(4) + this.hover.p.y.toFixed(4) + this.hover.p.z.toFixed(4) : '';
      if (k !== ok) { this.hover = q; this.update(); }
    },
    onClick(ev) { const q = this.pick(ev); if (!q) return; if (this.pts.length >= 2) this.pts = []; this.pts.push(q); this.hover = TOUCH ? null : q; this.update(); },
    ok() { endCmd(false); return null; },
    onFrame() { document.querySelectorAll('.mtip').forEach(el => { const q = toPx(el._w); el.style.left = q[0] + 'px'; el.style.top = (q[1] + el._dy) + 'px'; el.style.display = q[2] < 1 ? '' : 'none'; }); },
    cleanup() { this.hover = null; document.querySelectorAll('.mtip').forEach(e => e.remove()); }
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
let down = null, hoverQueued = false, lastMoveEv = null, longPressT = null, drawDrag = null, lastTap = null;
/* drawing by dragging: with a sketch drawing tool active, one finger (or the left mouse button) draws instead of turning the view;
   a second finger cancels the stroke and the two fingers pan and zoom as usual */
function cancelDrawDrag() { if (!drawDrag) return; const dd = drawDrag; drawDrag = null; controls.enabled = true; if (dd.started && (dd.created || dd.free)) { sk.draft = null; sk.cursor = null; } if (sk) { redrawSketch(); $('#dim').hidden = true; } }
dom.addEventListener('pointerdown', e => {
  try { dom.focus({ preventScroll: true }); } catch (er) {}
  if (NARROW()) { const pr = $('#prompt'); if (!pr.hidden) { pr.classList.remove('full'); pr.classList.add('min'); } }
  if (sk) sk.hoverMid = null;
  if (sk && sk.drag && sk.drag.move && sk.drag.pid !== e.pointerId) { sk.f.ents[sk.drag.ei] = sk.drag.orig; sk.drag = null; controls.enabled = true; $('#dim').hidden = true; redrawSketch(); }
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
  else if (e.pointerType !== 'touch' && e.button === 0 && e.shiftKey && !sk && !cmd && !faceMode && !down.gizmo) { down.marquee = true; controls.enabled = false; try { dom.setPointerCapture(e.pointerId); } catch (er) {} }
  else if (sk && isDrawTool(sk.tool) && (drawDrag || e.button === 0)) {
    if (drawDrag) { cancelDrawDrag(); down.moved = true; }
    else { drawDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, ev0: e, started: false }; controls.enabled = false; }
  }
  else if (e.button === 0 && sk && !sk.tool) {
    const h = sketchHandleAt(e);
    if (h) { sk.drag = h; sk.selEnt = h.ei; down.special = true; controls.enabled = false; try { dom.setPointerCapture(e.pointerId); } catch (er) {} }
    else {
      /* pressing on an element and dragging moves the whole element */
      const ei = hitSketchEntity(e), p = ei >= 0 ? sketchRawPoint(e) : null;
      if (p) { sk.drag = { move: true, ei, pid: e.pointerId, p0: p, orig: clone(sk.f.ents[ei]) }; sk.selEnt = ei; down.special = true; controls.enabled = false; try { dom.setPointerCapture(e.pointerId); } catch (er) {} }
    }
  }
}, true);
dom.addEventListener('pointermove', e => {
  if (down && !down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { down.moved = true; clearTimeout(longPressT); }
  if (drawDrag && e.pointerId === drawDrag.id && sk) {
    const dd = drawDrag;
    if (!dd.started && Math.hypot(e.clientX - dd.x, e.clientY - dd.y) > 8) {
      dd.started = true;
      if (isFreehand()) { dd.free = true; const p = sketchRawPoint(dd.ev0); sk.draft = { pts: p ? [p] : [] }; dd.lx = dd.x; dd.ly = dd.y; }
      else if (!sk.draft) { sketchClick(dd.ev0); dd.created = true; }
    }
    if (dd.started) {
      if (dd.free) { if (Math.hypot(e.clientX - dd.lx, e.clientY - dd.ly) >= 4) { const p = sketchRawPoint(e); if (p) { sk.draft.pts.push(p); sk.cursor = p; dd.lx = e.clientX; dd.ly = e.clientY; redrawSketch(); } } }
      else sketchMove(e);
    }
    return;
  }
  if (down && down.marquee && down.moved) { marqueeDraw(e); return; }
  if (down && down.special && sk && sk.drag) { sketchDrag(e); return; }
  if (down && down.special && cmd && cmd.onDrag) { cmd.onDrag(e); return; }
  if (e.buttons) return;
  lastMoveEv = e;
  if (!hoverQueued) { hoverQueued = true; requestAnimationFrame(() => { hoverQueued = false; handleHover(lastMoveEv); }); }
});
dom.addEventListener('pointerleave', () => { if (sk && (sk.hoverMid || sk.gridHot)) { sk.hoverMid = null; sk.gridHot = null; redrawSketch(); } if (cmd && cmd.onLeave) cmd.onLeave(); if (hoverBody) { hoverBody = null; styleBodies(); } $('#dim').hidden = true; });
dom.addEventListener('pointercancel', e => { if (drawDrag && e.pointerId === drawDrag.id) cancelDrawDrag(); if (down && down.marquee) { controls.enabled = true; marqueeHide(); down = null; } });
dom.addEventListener('pointerup', e => {
  if (drawDrag && e.pointerId === drawDrag.id) {
    const dd = drawDrag; drawDrag = null; controls.enabled = true; if (sk && e.pointerType === 'touch') sk.gridHot = null;
    if (dd.started) { down = null; lastTap = null; if (dd.free) finishFreehand(); else sketchClick(e); return; }
    if (isFreehand()) { down = null; return; }
  }
  if (!down) return;
  const d = down; down = null; clearTimeout(longPressT);
  if (d.longpress) return;
  if (d.special) { if (sk && sk.drag) { sk.drag = null; sk.gridHot = null; controls.enabled = true; $('#dim').hidden = true; renderPalette(); redrawSketch(); return; } if (cmd && cmd.onUp) cmd.onUp(e); return; }
  const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5;
  if (d.marquee) { controls.enabled = true; const was = marqueeEl && !marqueeEl.hidden; marqueeHide(); if (was && moved) { marqueeSelect(d, e); return; } }
  if (d.gizmo || moved) { if (cmd && cmd.onLeave && moved) cmd.onLeave(); return; }
  if (d.btn === 2 && sk && isPolyTool(sk.tool) && sk.draft) { finishPolyline(false); return; }
  if (d.btn === 2 && !sk && !cmd && faceMode) { faceContext(e); return; }
  if (d.btn === 2 && !sk && !cmd) { const h = hitBodies(e); if (h) bodyContext(e, h.object.userData.bodyId); return; }
  if (d.btn !== 0) return;
  /* double tap finishes a line or a point-by-point curve (touch has no Enter key or right button) */
  if (sk && isPolyTool(sk.tool) && sk.draft) {
    const now = performance.now();
    if (lastTap && now - lastTap.t < 380 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 24) { lastTap = null; finishPolyline(false); return; }
    lastTap = { t: now, x: e.clientX, y: e.clientY };
  } else lastTap = { t: performance.now(), x: e.clientX, y: e.clientY };
  handleClick(e);
});
/* rubber-band selection (Shift + left drag): dragging right takes bodies fully inside the frame, dragging left every body the frame touches; adds to the selection */
let marqueeEl = null;
function marqueeDraw(e) {
  if (!marqueeEl) {
    marqueeEl = document.createElement('div');
    marqueeEl.style.cssText = 'position:fixed;z-index:30;pointer-events:none;border:1px solid var(--accent);background:var(--accent-soft);opacity:.55';
    document.body.append(marqueeEl);
  }
  const l = Math.min(down.x, e.clientX), t = Math.min(down.y, e.clientY);
  marqueeEl.hidden = false; marqueeEl.style.borderStyle = e.clientX < down.x ? 'dashed' : 'solid';
  Object.assign(marqueeEl.style, { left: l + 'px', top: t + 'px', width: Math.abs(e.clientX - down.x) + 'px', height: Math.abs(e.clientY - down.y) + 'px' });
}
function marqueeHide() { if (marqueeEl) marqueeEl.hidden = true; }
function marqueeSelect(d, e) {
  const r = dom.getBoundingClientRect(), x0 = Math.min(d.x, e.clientX) - r.left, x1 = Math.max(d.x, e.clientX) - r.left, y0 = Math.min(d.y, e.clientY) - r.top, y1 = Math.max(d.y, e.clientY) - r.top;
  const cross = e.clientX < d.x, hit = [];
  for (const m of visibleMeshes()) {
    const bb = new THREE.Box3().setFromObject(m), c = [];
    for (let i = 0; i < 8; i++) c.push(toPx(new THREE.Vector3(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z)));
    const bx0 = Math.min(...c.map(p => p[0])), bx1 = Math.max(...c.map(p => p[0])), by0 = Math.min(...c.map(p => p[1])), by1 = Math.max(...c.map(p => p[1]));
    const ok = cross ? (bx1 >= x0 && bx0 <= x1 && by1 >= y0 && by0 <= y1) : (bx0 >= x0 && bx1 <= x1 && by0 >= y0 && by1 <= y1);
    if (ok && m.userData.bodyId != null) hit.push(m.userData.bodyId);
  }
  sel = new Set([...sel, ...hit]);
  tlSel = null; styleBodies(); renderBrowser(); renderTimeline(); updateInfo();
  if (hit.length) toast(`Vybráno: ${plural(sel.size, 'těleso', 'tělesa', 'těles')}`);
}
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
  /* arrow keys (PageUp / PageDown = Z): move the selected sketch element, the bodies in Move (selected bodies open Move), or pan the view; one grid step, Shift ×10 */
  const AR = { ArrowLeft: [-1, 0, 0], ArrowRight: [1, 0, 0], ArrowUp: [0, 1, 0], ArrowDown: [0, -1, 0], PageUp: [0, 0, 1], PageDown: [0, 0, -1] }[k];
  if (AR) { if (nudgeKeys(AR, e.shiftKey)) e.preventDefault(); return; }
  const map = sk ? { l: 'line', k: 'spline', r: 'rect', c: 'circle', e: 'ellipse', p: 'ngon', d: 'slot', x: 'sktrim', o: 'skoffset', t: 'sksegtrim', j: 'skjoin', q: 'skcons' } : cmd ? {} : { s: 'sketch', e: 'extrude', f: 'fillet', m: 'move', r: 'rotate', t: 'thread', i: 'measure', g: 'facemode', h: 'hole' };
  const id = map[k.toLowerCase()];
  if (id) { e.preventDefault(); runCommand(id); return; }
  if (k === 'F6') { e.preventDefault(); fitView(); }
});

function nudgeKeys(v, big) {
  const st = (settings.snap || 1) * (big ? 10 : 1);
  if (sk) {
    if (sk.tool || v[2]) return false;
    const e = sk.f.ents[sk.selEnt];
    if (!e) { panView(v, big); return true; }
    sk.f.ents[sk.selEnt] = translateEnt(e, v[0] * st, v[1] * st);
    const n = sk.f.ents[sk.selEnt], r4 = x => Math.round(x * 1e4) / 1e4; if (n.pts) n.pts = n.pts.map(q => [r4(q[0]), r4(q[1])]); for (const kk of ['x', 'y', 'x1', 'y1', 'x2', 'y2']) if (typeof n[kk] === 'number') n[kk] = r4(n[kk]);
    renderPalette(); redrawSketch(); return true;
  }
  if (cmd) { if (!cmd.nudge) return false; cmd.nudge(v.map(x => x * st)); return true; }
  if (sel.size) { startMove(); if (cmd && cmd.nudge) cmd.nudge(v.map(x => x * st)); return true; }
  if (v[2]) return false;
  panView(v, big); return true;
}
/* pan the view by a tenth of its height (Shift: half) along the screen axes */
function panView(v, big) {
  const c = cam(), H = dom.clientHeight || 600, d = worldPerPx(controls.target) * H * (big ? 0.5 : 0.1);
  const right = new V3().setFromMatrixColumn(c.matrixWorld, 0), up = new V3().setFromMatrixColumn(c.matrixWorld, 1);
  const off = right.multiplyScalar(v[0] * d).add(up.multiplyScalar(v[1] * d));
  c.position.add(off); controls.target.add(off); controls.update(); requestRender();
}
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
  try { await dl.save({ filename, data }); toast(okMsg || 'Soubor uložen'); }
  catch (e) {
    /* the Claude preview only lets pages save some file types (not .stl / .obj): hand the file over packed in a .zip */
    if (e && e.code === 'rejected_extension' && !/\.zip$/i.test(filename)) {
      try {
        await dl.save({ filename: filename + '.zip', data: makeZip([{ name: filename, data: typeof data === 'string' ? new TextEncoder().encode(data) : data }]) });
        toast('Tady nejde uložit soubor ' + filename.split('.').pop().toUpperCase() + ' přímo, je zabalený v ZIP. Ve verzi na GitHub Pages se uloží přímo.');
      } catch (e2) { if (!e2 || e2.code !== 'declined') toast('Soubor se nepodařilo uložit.'); }
      return;
    }
    if (!e || e.code !== 'declined') toast('Soubor se nepodařilo uložit.');
  }
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
/* 3MF (3D Manufacturing Format): a zip with the model XML; one object per visible body, units mm */
function threeMfBytes() {
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const objs = [], items = []; let id = 1;
  for (const b of cur.bodies) {
    if (!bodiesVisible() || !isVis(b.id)) continue;
    const pk = K.pack(b.polys), V = [], T = [];
    for (let i = 0; i < pk.v.length; i += 3) V.push(`<vertex x="${+pk.v[i].toFixed(5)}" y="${+pk.v[i + 1].toFixed(5)}" z="${+pk.v[i + 2].toFixed(5)}"/>`);
    for (const f of pk.p) for (let i = 1; i < f.length - 1; i++) if (f[0] !== f[i] && f[i] !== f[i + 1] && f[0] !== f[i + 1]) T.push(`<triangle v1="${f[0]}" v2="${f[i]}" v3="${f[i + 1]}"/>`);
    if (!T.length) continue;
    objs.push(`<object id="${id}" name="${esc(bodyName(b))}" type="model"><mesh><vertices>${V.join('')}</vertices><triangles>${T.join('')}</triangles></mesh></object>`);
    items.push(`<item objectid="${id}"/>`); id++;
  }
  if (!objs.length) return null;
  const model = `<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xml:lang="cs-CZ" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">${esc(doc.name || 'model')}</metadata><metadata name="Application">${esc(SKICA.full)}</metadata><resources>${objs.join('')}</resources><build>${items.join('')}</build></model>`;
  const types = '<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>';
  const rels = '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>';
  const te = new TextEncoder();
  return makeZip([{ name: '[Content_Types].xml', data: te.encode(types) }, { name: '_rels/.rels', data: te.encode(rels) }, { name: '3D/3dmodel.model', data: te.encode(model) }]);
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
/* kind: 'stl' | 'obj' | 'zip' (STL + OBJ + design) */
function exportMesh(kind = 'zip') {
  const tris = exportTris();
  if (!tris.length) { toast('Není co exportovat, model neobsahuje viditelná tělesa.'); return; }
  const n = fileBase();
  if (kind === 'stl') saveFile(n + '.stl', stlBytes(tris), 'STL uloženo');
  else if (kind === 'obj') saveFile(n + '.obj', objText(), 'OBJ uloženo');
  else if (kind === '3mf') { const z = threeMfBytes(); if (z) saveFile(n + '.3mf', z, '3MF uloženo'); }
  else saveFile(n + '.zip', exportZip(tris, n), 'Uloženo. Archiv otevřete znovu ve SkicaCAD přetažením do okna nebo přes Soubor › Otevřít návrh.');
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
    <div class="sd-foot"><button class="btn sm" data-act="file">Otevřít ze souboru…</button><button class="btn sm" data-act="example">Ukázkový model</button><button class="btn sm" data-act="backup"${list.length ? '' : ' disabled'}>Zálohovat knihovnu</button><button class="btn sm" data-act="restore">Obnovit ze zálohy…</button></div>
    ${(() => { const u = storageUsed(), r = Math.min(1, u / LS_QUOTA); return `<div class="sd-usage${r >= 0.8 ? ' warn' : ''}" title="Úložiště návrhů v tomto prohlížeči"><span class="bar"><span style="width:${Math.max(1, Math.round(r * 100))}%"></span></span><span>Úložiště: ${r > 0 && r < 0.01 ? '<1' : Math.round(r * 100)} % (${fmtMB(u)} z ~${fmtMB(LS_QUOTA)})</span></div>`; })()}
    <p class="sd-note">Návrhy se ukládají automaticky jen v tomto prohlížeči. Záloha celé knihovny je jeden soubor .zip, který obnovíte i na jiném zařízení.</p></div>`;
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
  else if (a === 'backup') backupLibrary();
  else if (a === 'restore') $('#fileinput').click();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#startdlg').hidden) { e.stopPropagation(); hideStart(); } }, true);
$('#m-example').addEventListener('click', () => { closeMenu(); loadDoc(exampleDoc(), 'Ukázkový model načten'); });
$('#m-open').addEventListener('click', () => { closeMenu(); $('#fileinput').click(); });
$('#m-import').addEventListener('click', () => { closeMenu(); pickImportFile('.stl,.obj,.dxf,.svg,.zip'); });
$('#m-save').addEventListener('click', () => { closeMenu(); saveFile(fileBase() + '.json', projectJSON()); });
$('#m-backup').addEventListener('click', () => { closeMenu(); backupLibrary(); });
$('#m-restore').addEventListener('click', () => { closeMenu(); $('#fileinput').click(); });
/* ---------- library backup: every stored design (with its imported meshes and thumbnail) in one .zip ---------- */
function backupLibrary() {
  if (doc.features.length) saveDoc();
  const list = libList(); if (!list.length) { toast('Knihovna je prázdná, není co zálohovat.'); return; }
  const files = [], used = new Set(), enc = new TextEncoder();
  list.forEach((x, i) => {
    const d = libGet(x.uid); if (!d) return;
    const bl = {}; for (const f of d.features) if (f.type === 'import' && blobs[f.blob]) bl[f.blob] = blobs[f.blob];
    const safe = String(d.name).replace(/[^\p{L}\p{N} _-]+/gu, '').trim().slice(0, 40) || 'navrh';
    let fn = `${String(i + 1).padStart(2, '0')} ${safe}.skicacad.json`; while (used.has(fn)) fn = fn.replace('.skicacad.json', '_.skicacad.json'); used.add(fn);
    files.push({ name: fn, data: enc.encode(JSON.stringify({ app: 'skicacad', generator: SKICA.full, appVersion: SKICA.version, version: 3, units: 'mm', saved: x.t, thumb: libThumb(x.uid) || undefined, doc: d, blobs: bl })) });
  });
  files.push({ name: 'library.json', data: enc.encode(JSON.stringify({ app: 'skicacad', kind: 'library', generator: SKICA.full, appVersion: SKICA.version, created: Date.now(), count: files.length })) });
  const day = new Date().toISOString().slice(0, 10);
  saveFile(`skicacad-knihovna-${day}.zip`, makeZip(files), `Záloha knihovny uložena (${plural(files.length - 1, 'návrh', 'návrhy', 'návrhů')})`);
}
/* restoring merges: a design missing here is added, one that exists here is replaced only by a newer copy */
function restoreLibrary(entries) {
  const dec = new TextDecoder(), list = libList(); let added = 0, updated = 0, same = 0, failed = 0;
  for (const en of entries) {
    if (!/\.json$/i.test(en.name) || /library\.json$/i.test(en.name)) continue;
    let j; try { j = JSON.parse(dec.decode(en.data)); } catch (e) { failed++; continue; }
    const d = validDoc(j && (j.doc || j)); if (!d || !d.features.length) { failed++; continue; }
    const t = Number(j.saved) || Date.now(), have = list.find(x => x.uid === d.uid);
    if (have && have.t >= t) { same++; continue; }
    try {
      localStorage.setItem(DKEY(d.uid), JSON.stringify(d));
      if (typeof j.thumb === 'string' && j.thumb.startsWith('data:image/')) localStorage.setItem(TKEY(d.uid), j.thumb);
    } catch (e) { toast('Úložiště prohlížeče je plné, část zálohy se nevešla. Smažte staré návrhy a zkuste to znovu.'); break; }
    if (j.blobs && typeof j.blobs === 'object') Object.assign(blobs, j.blobs);
    if (have) { have.t = t; have.name = d.name; have.n = d.features.length; updated++; } else { list.push({ uid: d.uid, name: d.name, t, n: d.features.length }); added++; }
  }
  list.sort((a, b) => b.t - a.t); libWrite(list.slice(0, LIB_MAX)); saveBlobs();
  toast(`Obnoveno ze zálohy: ${added} nových, ${updated} aktualizovaných, ${same} beze změny` + (failed ? `, ${failed} se nepodařilo načíst` : ''));
  showStart(false); checkStorage();
}
$('#m-export').addEventListener('click', () => { closeMenu(); exportMesh('zip'); });
$('#m-export-stl').addEventListener('click', () => { closeMenu(); exportMesh('stl'); });
$('#m-export-obj').addEventListener('click', () => { closeMenu(); exportMesh('obj'); });
$('#m-export-3mf').addEventListener('click', () => { closeMenu(); exportMesh('3mf'); });
$('#fileinput').addEventListener('change', e => {
  const file = e.target.files && e.target.files[0]; if (!file) return;
  e.target.value = '';
  (async () => {
    try {
      if (/\.zip$/i.test(file.name)) {
        const entries = await Importers.readZip(await file.arrayBuffer());
        if (entries.some(x => /(^|\/)library\.json$/i.test(x.name))) { restoreLibrary(entries); return; }
        const proj = entries.find(x => /\.skicacad\.json$/i.test(x.name)) || entries.find(x => /\.json$/i.test(x.name));
        if (!proj) throw new Error('Archiv neobsahuje návrh SkicaCAD. Síť z něj vložíte přes Importovat.');
        openProject(JSON.parse(new TextDecoder().decode(proj.data)));
      } else openProject(JSON.parse(await file.text()));
    } catch (er) { toast(er && er.message && !/JSON/.test(er.message) ? er.message : 'Soubor se nepodařilo načíst. Očekávám návrh SkicaCAD ve formátu .json nebo .zip.'); }
  })();
});
$('#docname').addEventListener('input', e => { doc.name = e.target.value; saveDoc(); renderBrowser(); });
$('#docname').addEventListener('change', () => { if (ensureUniqueName(true)) { saveDoc(); renderBrowser(); } pushHist(); });
$('#undo').addEventListener('click', undo);
$('#redo').addEventListener('click', redo);

/* ================= language ================= */
/* appearance: automatic (follows the system), light or dark; stored in the settings */
const THEMES = ['auto', 'light', 'dark'];
function applyTheme() {
  const t = settings.theme, r = document.documentElement;
  if (t === 'light' || t === 'dark') r.dataset.theme = t; else delete r.dataset.theme;
  const dark = t === 'dark' || (t !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const mc = document.querySelector('meta[name="theme-color"]'); if (mc) mc.content = dark ? '#1B2430' : '#F4F6F8';
  syncThemeBtn();
}
function syncThemeBtn() {
  const b = $('#themebtn'); if (!b) return; const t = THEMES.includes(settings.theme) ? settings.theme : 'auto', en = EN();
  b.querySelector('.ico').innerHTML = svg('th' + t, 17);
  b.title = en ? { auto: 'Appearance: automatic (follows the system)', light: 'Appearance: light', dark: 'Appearance: dark' }[t] : { auto: 'Vzhled: automaticky podle systému', light: 'Vzhled: světlý', dark: 'Vzhled: tmavý' }[t];
  b.setAttribute('aria-label', b.title);
}
if ($('#themebtn')) $('#themebtn').addEventListener('click', () => {
  const t = THEMES[(THEMES.indexOf(THEMES.includes(settings.theme) ? settings.theme : 'auto') + 1) % 3];
  settings.theme = t; saveSettings(); applyTheme(); requestRender();
  toast(EN() ? { auto: 'Appearance: automatic', light: 'Appearance: light', dark: 'Appearance: dark' }[t] : { auto: 'Vzhled: automaticky podle systému', light: 'Vzhled: světlý', dark: 'Vzhled: tmavý' }[t]);
});
applyTheme();
function syncLangBtn() { const b = $('#langbtn'); if (!b) return; const en = EN(); b.querySelector('.lc').textContent = en ? 'EN' : 'CZ'; b.title = en ? 'Language: English (switch to Czech)' : 'Jazyk: čeština (přepnout do angličtiny)'; }
if ($('#langbtn')) $('#langbtn').addEventListener('click', () => {
  const l = EN() ? 'cs' : 'en';
  settings.lang = l; saveSettings();
  if (window.I18N) I18N.set(l);
  if (doc.name === 'Bez názvu' || doc.name === 'Untitled') { doc.name = l === 'en' ? 'Untitled' : 'Bez názvu'; $('#docname').value = doc.name; }
  buildCubeMaterials(); renderRibbon(); renderBrowser(); renderTimeline(); updateInfo(); applyNav();
  if (sk) { renderPalette(); redrawSketch(); }
  if (!$('#startdlg').hidden) showStart(false);
  syncLangBtn(); syncThemeBtn(); requestRender();
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
if (window.matchMedia) { const mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', () => { onTheme(); applyTheme(); }); }

/* ================= start ================= */
gridMinor.color.copy(tok.grid); gridMajor.color.copy(tok['grid-major']);
$('#docname').value = doc.name;
renderRibbon(); applyNav(); updateMenu(); resize();
if (window.matchMedia('(max-width: 760px)').matches) $('#bw-toggle').innerHTML = svg('chevr', 14);
pushHist();
loadStoredBlobs();
refreshBusy(() => fitView(VIEW_ISO, true));
showStart(true);
if (window.__KOTA_TEST__) window.__kota = { get cmd() { return cmd; }, threeMfBytes, transform, get idbOk() { return idbOk; }, setFaceMode, faceAtHit, faceToSketch, startPressFace, get selFace() { return selFace; }, set selFace(v) { selFace = v; }, exportZip, exportTris, fileBase, selectAll, startCenter, copySel, pasteClip, duplicateSel, get clip() { return clip; }, sketchHandleAt, startScale, startThread, cylinderAt, startRotate, importFile, startPattern, startMirror, startRevolve, get blobs() { return blobs; }, runCommand, editFeature, okCmd, endCmd, enterSketch, finishSketch, bodyClick, moveMarker, deleteFeature, undo, redo, exportMesh, loadDoc, exampleDoc, emptyDoc, setSketchTool, libList, showStart, makeThumb, libThumb, transform, persp, toPx, startMove, alignDesc,
  get doc() { return doc; }, get cur() { return cur; }, get cmd() { return cmd; }, get sk() { return sk; }, get dlg() { return dlg; }, get sel() { return sel; }, meshes, chainsFor };
})();



