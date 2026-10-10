// SkicaCAD – exporty souborů. Každý vytvořený soubor nese název aplikace, Beta a verzi.
import { shapePolygon, PLANES } from './geometry.js';

export function appLabel(app) {
  return `${app.name} ${app.stage} ${app.version}`;
}

export function safeName(s) {
  return (s || 'model').trim().replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_') || 'model';
}

export function fileName(projName, app, ext) {
  return `${safeName(projName)}_${app.name}-${app.stage}-${app.version}.${ext}`;
}

// Binární STL: 80B hlavička (text s verzí), počet trojúhelníků, 50B na trojúhelník
export function buildSTL(positionArrays, label) {
  let nTri = 0;
  for (const p of positionArrays) nTri += p.length / 9;
  const buf = new ArrayBuffer(84 + nTri * 50);
  const dv = new DataView(buf);
  const head = `${label} - binary STL, mm`.slice(0, 79);
  for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i) & 0x7f);
  dv.setUint32(80, nTri, true);
  let o = 84;
  for (const p of positionArrays) {
    for (let i = 0; i < p.length; i += 9) {
      const ux = p[i + 3] - p[i], uy = p[i + 4] - p[i + 1], uz = p[i + 5] - p[i + 2];
      const vx = p[i + 6] - p[i], vy = p[i + 7] - p[i + 1], vz = p[i + 8] - p[i + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      dv.setFloat32(o, nx, true); dv.setFloat32(o + 4, ny, true); dv.setFloat32(o + 8, nz, true);
      for (let k = 0; k < 9; k++) dv.setFloat32(o + 12 + k * 4, p[i + k], true);
      dv.setUint16(o + 48, 0, true);
      o += 50;
    }
  }
  return buf;
}

const f = (n) => (Math.round(n * 1e4) / 1e4).toString();

export function buildSVG(sketch, label) {
  const shapes = sketch.shapes;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const s of shapes) for (const p of shapePolygon(s, 48)) {
    x1 = Math.min(x1, p[0]); y1 = Math.min(y1, p[1]); x2 = Math.max(x2, p[0]); y2 = Math.max(y2, p[1]);
  }
  if (x1 === Infinity) { x1 = y1 = 0; x2 = y2 = 10; }
  const pad = 2;
  const w = x2 - x1 + pad * 2, h = y2 - y1 + pad * 2;
  const X = (x) => f(x - x1 + pad), Y = (y) => f(y2 - y + pad); // osa Y nahoru
  const out = [];
  out.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  out.push(`<!-- ${label} · náčrt "${sketch.name}" · rovina ${PLANES[sketch.plane].name} · jednotky mm -->`);
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}mm" height="${f(h)}mm" viewBox="0 0 ${f(w)} ${f(h)}">`);
  out.push(`<metadata>${label}</metadata>`);
  out.push(`<g fill="none" stroke="#000" stroke-width="0.2">`);
  for (const s of shapes) {
    if (s.t === 'circle') out.push(`<circle cx="${X(s.cx)}" cy="${Y(s.cy)}" r="${f(s.r)}"/>`);
    else {
      const pts = shapePolygon(s).map((p) => `${X(p[0])},${Y(p[1])}`).join(' ');
      const closed = s.t === 'rect' || s.closed;
      out.push(closed ? `<polygon points="${pts}"/>` : `<polyline points="${pts}"/>`);
    }
  }
  out.push(`</g>`, `</svg>`);
  return out.join('\n');
}

export function buildDXF(sketch, label) {
  const o = [];
  o.push('999', `${label} - sketch ${sketch.name} - plane ${sketch.plane} - mm`);
  o.push('0', 'SECTION', '2', 'ENTITIES');
  const line = (a, b) => o.push('0', 'LINE', '8', '0', '10', f(a[0]), '20', f(a[1]), '30', '0', '11', f(b[0]), '21', f(b[1]), '31', '0');
  for (const s of sketch.shapes) {
    if (s.t === 'circle') o.push('0', 'CIRCLE', '8', '0', '10', f(s.cx), '20', f(s.cy), '30', '0', '40', f(s.r));
    else {
      const poly = shapePolygon(s);
      const closed = s.t === 'rect' || s.closed;
      const n = closed ? poly.length : poly.length - 1;
      for (let i = 0; i < n; i++) line(poly[i], poly[(i + 1) % poly.length]);
    }
  }
  o.push('0', 'ENDSEC', '0', 'EOF');
  return o.join('\r\n') + '\r\n';
}
