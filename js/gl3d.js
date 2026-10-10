// SkicaCAD – malý 3D engine nad WebGL (bez závislostí).
// Z nahoru, orbitální kamera, jednoduché osvětlení, hrany, mřížka, osy.

const V = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};

function mat4Mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  const o = new Float32Array(16);
  o[0] = f / aspect; o[5] = f; o[10] = (far + near) * nf; o[11] = -1; o[14] = 2 * far * near * nf;
  return o;
}
function viewMatrix(right, up, fwd, eye) {
  const back = V.mul(fwd, -1);
  const o = new Float32Array(16);
  o[0] = right[0]; o[4] = right[1]; o[8] = right[2];
  o[1] = up[0]; o[5] = up[1]; o[9] = up[2];
  o[2] = back[0]; o[6] = back[1]; o[10] = back[2];
  o[12] = -V.dot(right, eye); o[13] = -V.dot(up, eye); o[14] = -V.dot(back, eye); o[15] = 1;
  return o;
}

const MESH_VS = `
attribute vec3 aPos; attribute vec3 aNrm;
uniform mat4 uVP; uniform mat3 uViewRot;
varying vec3 vN;
void main(){ vN = uViewRot * aNrm; gl_Position = uVP * vec4(aPos, 1.0); }`;
const MESH_FS = `
precision mediump float;
varying vec3 vN; uniform vec4 uColor;
void main(){
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 l1 = normalize(vec3(-0.45, 0.55, 0.70));
  vec3 l2 = normalize(vec3(0.65, -0.25, 0.35));
  float d = max(dot(n, l1), 0.0) * 0.58 + max(dot(n, l2), 0.0) * 0.22;
  vec3 c = uColor.rgb * (0.30 + d);
  gl_FragColor = vec4(min(c, vec3(1.0)), uColor.a);
}`;
const LINE_VS = `attribute vec3 aPos; uniform mat4 uVP; void main(){ gl_Position = uVP * vec4(aPos, 1.0); }`;
const LINE_FS = `precision mediump float; uniform vec4 uColor; void main(){ gl_FragColor = uColor; }`;

function compile(gl, vs, fs, attribs = []) {
  const mk = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
  attribs.forEach((name, i) => gl.bindAttribLocation(p, i, name));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

const DEFAULT_THEME = {
  grid: [0.55, 0.6, 0.68, 0.35], gridMajor: [0.45, 0.5, 0.6, 0.6],
  axisX: [0.9, 0.25, 0.25, 1], axisY: [0.2, 0.7, 0.3, 1], axisZ: [0.25, 0.45, 0.95, 1],
};

export class Viewer {
  constructor(canvas, hooks = {}) {
    this.canvas = canvas;
    this.hooks = hooks;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL není k dispozici');
    this.gl = gl;
    this.mesh = compile(gl, MESH_VS, MESH_FS, ['aPos', 'aNrm']);
    this.line = compile(gl, LINE_VS, LINE_FS, ['aPos']);
    this.theme = DEFAULT_THEME;
    this.items = [];
    this.highlightId = null;
    this.gridBuf = null; this.gridStep = 0;
    this.fov = (35 * Math.PI) / 180;
    this.target = [0, 0, 0]; this.dist = 220; this.yaw = -Math.PI / 4; this.pitch = Math.PI / 6;
    this.dirty = true; this.gridVisible = true;
    this._bindInput();
    this.resize();
  }

  setTheme(t) { this.theme = { ...DEFAULT_THEME, ...t }; this.gridStep = 0; this.requestRender(); }
  setGridVisible(v) { this.gridVisible = v; this.requestRender(); }
  setHighlight(id) { this.highlightId = id; this.requestRender(); }

  _buf(data) {
    const gl = this.gl, b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  }
  _free(item) {
    const gl = this.gl;
    for (const k of ['bPos', 'bNrm', 'bEdges']) if (item[k]) gl.deleteBuffer(item[k]);
  }

  // items: [{id, kind:'mesh'|'lines', pos, nrm?, edges?, color:[r,g,b], alpha?, edgeColor?, visible?}]
  setItems(items) {
    this.items.forEach((i) => this._free(i));
    this.items = items.map((it) => {
      const o = { alpha: 1, visible: true, edgeColor: [0.1, 0.12, 0.16, 1], ...it };
      o.bPos = this._buf(o.pos);
      o.count = o.pos.length / 3;
      if (o.nrm) o.bNrm = this._buf(o.nrm);
      if (o.edges && o.edges.length) { o.bEdges = this._buf(o.edges); o.edgeCount = o.edges.length / 3; }
      return o;
    });
    this.requestRender();
  }

  // ----- kamera -----
  _basis() {
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const dir = [cp * Math.cos(this.yaw), cp * Math.sin(this.yaw), sp];
    const eye = V.add(this.target, V.mul(dir, this.dist));
    const fwd = V.mul(dir, -1);
    const right = V.norm(V.cross(fwd, [0, 0, 1]));
    const up = V.cross(right, fwd);
    return { eye, fwd, right, up };
  }

  setView(name) {
    const P = {
      iso: [-Math.PI / 4, Math.PI / 6], front: [-Math.PI / 2, 0], back: [Math.PI / 2, 0],
      right: [0, 0], left: [Math.PI, 0], top: [-Math.PI / 2, Math.PI / 2 - 0.0005],
    }[name] || [-Math.PI / 4, Math.PI / 6];
    this.yaw = P[0]; this.pitch = P[1];
    this.requestRender();
  }

  fit(bounds) {
    let min = [-50, -50, 0], max = [50, 50, 50];
    if (bounds) { min = bounds.min; max = bounds.max; }
    this.target = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    const r = Math.max(Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2, 5);
    const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    const f = aspect < 1 ? this.fov * aspect : this.fov;
    this.dist = (r / Math.sin(f / 2)) * 1.15;
    this.requestRender();
  }

  // Paprsek ze souřadnic prohlížeče (client) do světa
  ray(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = 1 - ((clientY - rect.top) / rect.height) * 2;
    const { eye, fwd, right, up } = this._basis();
    const t = Math.tan(this.fov / 2), aspect = rect.width / rect.height;
    const d = V.norm(V.add(fwd, V.add(V.mul(right, nx * t * aspect), V.mul(up, ny * t))));
    return { o: eye, d };
  }

  // ----- vstup -----
  _bindInput() {
    const c = this.canvas;
    c.style.touchAction = 'none';
    const ptrs = new Map();
    let down = null, gesture = null;
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) down = { x: e.clientX, y: e.clientY, button: e.button, shift: e.shiftKey, moved: 0, t: performance.now() };
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        gesture = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        if (down) down.moved = 99;
      }
    });
    c.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size >= 2 && gesture) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        if (gesture.d > 0 && d > 0) this.dist = Math.min(1e5, Math.max(1, this.dist * (gesture.d / d)));
        this._pan(mx - gesture.mx, my - gesture.my);
        gesture = { d, mx, my };
        this.requestRender();
        return;
      }
      if (!down) return;
      down.moved += Math.abs(dx) + Math.abs(dy);
      const pan = down.button === 1 || down.button === 2 || down.shift;
      if (pan) this._pan(dx, dy);
      else {
        this.yaw -= dx * 0.0075;
        this.pitch = Math.max(-Math.PI / 2 + 0.0005, Math.min(Math.PI / 2 - 0.0005, this.pitch + dy * 0.0075));
      }
      this.requestRender();
    });
    const end = (e) => {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) gesture = null;
      if (ptrs.size === 0 && down) {
        if (down.moved < 6 && down.button === 0 && this.hooks.onClick) this.hooks.onClick(e.clientX, e.clientY, e);
        down = null;
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.dist = Math.min(1e5, Math.max(1, this.dist * Math.exp(e.deltaY * 0.0012)));
      this.requestRender();
    }, { passive: false });
  }

  _pan(dx, dy) {
    const { right, up } = this._basis();
    const k = (2 * this.dist * Math.tan(this.fov / 2)) / Math.max(1, this.canvas.clientHeight);
    this.target = V.add(this.target, V.add(V.mul(right, -dx * k), V.mul(up, dy * k)));
  }

  // ----- vykreslení -----
  _syncSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
  }

  resize() { this._syncSize(); this.requestRender(); }

  requestRender() {
    if (this.dirty && this._raf) return;
    this.dirty = true;
    this._raf = requestAnimationFrame(() => { this._raf = 0; this.dirty = false; this.render(); });
  }

  _grid() {
    const step = Math.pow(10, Math.floor(Math.log10(Math.max(this.dist, 1) * 0.12)));
    if (step === this.gridStep) return;
    this.gridStep = step;
    const gl = this.gl;
    if (this.gridBuf) { gl.deleteBuffer(this.gridBuf.minor); gl.deleteBuffer(this.gridBuf.major); gl.deleteBuffer(this.gridBuf.axes); }
    const N = 50, ext = N * step, minor = [], major = [];
    for (let i = -N; i <= N; i++) {
      const t = i * step, arr = i % 5 === 0 ? major : minor;
      if (i === 0) continue;
      arr.push(t, -ext, 0, t, ext, 0, -ext, t, 0, ext, t, 0);
    }
    const L = step * 12;
    const axes = [0, 0, 0, L, 0, 0, 0, 0, 0, 0, L, 0, 0, 0, 0, 0, 0, L];
    this.gridBuf = {
      minor: this._buf(new Float32Array(minor)), nMinor: minor.length / 3,
      major: this._buf(new Float32Array(major)), nMajor: major.length / 3,
      axes: this._buf(new Float32Array(axes)),
    };
  }

  render() {
    const gl = this.gl;
    this._syncSize();
    const W = this.canvas.width, H = this.canvas.height;
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const { eye, fwd, right, up } = this._basis();
    const near = Math.max(this.dist * 0.01, 0.05), far = this.dist * 200;
    const VP = mat4Mul(perspective(this.fov, W / H, near, far), viewMatrix(right, up, fwd, eye));
    const back = V.mul(fwd, -1);
    const viewRot = new Float32Array([right[0], up[0], back[0], right[1], up[1], back[1], right[2], up[2], back[2]]);

    // mřížka a osy
    const lp = this.line;
    gl.useProgram(lp);
    gl.disableVertexAttribArray(1); // normály používá jen program těles
    gl.uniformMatrix4fv(gl.getUniformLocation(lp, 'uVP'), false, VP);
    const aPosL = gl.getAttribLocation(lp, 'aPos');
    const uColL = gl.getUniformLocation(lp, 'uColor');
    gl.enableVertexAttribArray(aPosL);
    const drawLines = (buf, count, color, mode = gl.LINES) => {
      if (!count) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(aPosL, 3, gl.FLOAT, false, 0, 0);
      gl.uniform4fv(uColL, color);
      gl.drawArrays(mode, 0, count);
    };
    if (this.gridVisible) {
      this._grid();
      gl.depthMask(false);
      drawLines(this.gridBuf.minor, this.gridBuf.nMinor, this.theme.grid);
      drawLines(this.gridBuf.major, this.gridBuf.nMajor, this.theme.gridMajor);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuf.axes);
      gl.vertexAttribPointer(aPosL, 3, gl.FLOAT, false, 0, 0);
      [this.theme.axisX, this.theme.axisY, this.theme.axisZ].forEach((col, i) => {
        gl.uniform4fv(uColL, col); gl.drawArrays(gl.LINES, i * 2, 2);
      });
      gl.depthMask(true);
    }

    // tělesa
    const mp = this.mesh;
    gl.useProgram(mp);
    gl.uniformMatrix4fv(gl.getUniformLocation(mp, 'uVP'), false, VP);
    gl.uniformMatrix3fv(gl.getUniformLocation(mp, 'uViewRot'), false, viewRot);
    const aPosM = gl.getAttribLocation(mp, 'aPos'), aNrmM = gl.getAttribLocation(mp, 'aNrm');
    const uColM = gl.getUniformLocation(mp, 'uColor');
    const drawMesh = (it) => {
      gl.enableVertexAttribArray(aPosM); gl.enableVertexAttribArray(aNrmM);
      gl.bindBuffer(gl.ARRAY_BUFFER, it.bPos); gl.vertexAttribPointer(aPosM, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, it.bNrm); gl.vertexAttribPointer(aNrmM, 3, gl.FLOAT, false, 0, 0);
      const hl = it.id === this.highlightId;
      const c = hl ? [1.0, 0.62, 0.2] : it.color;
      gl.uniform4f(uColM, c[0], c[1], c[2], it.alpha);
      gl.drawArrays(gl.TRIANGLES, 0, it.count);
    };
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1);
    const vis = this.items.filter((i) => i.visible);
    for (const it of vis) if (it.kind === 'mesh' && it.alpha >= 1) drawMesh(it);
    gl.disable(gl.POLYGON_OFFSET_FILL);

    // hrany těles a čárové objekty
    gl.useProgram(lp);
    gl.disableVertexAttribArray(aNrmM);
    gl.enableVertexAttribArray(aPosL);
    for (const it of vis) {
      const hl = it.id === this.highlightId;
      if (it.kind === 'mesh' && it.alpha >= 1 && it.bEdges) {
        drawLines(it.bEdges, it.edgeCount, hl ? [0.55, 0.25, 0, 1] : it.edgeColor);
      } else if (it.kind === 'lines') {
        drawLines(it.bPos, it.count, hl ? [1, 0.55, 0.1, it.alpha] : [...it.color, it.alpha]);
      }
    }

    // průhledné plochy (profily, náhled)
    gl.useProgram(mp);
    gl.depthMask(false);
    for (const it of vis) if (it.kind === 'mesh' && it.alpha < 1) drawMesh(it);
    gl.depthMask(true);
  }
}
