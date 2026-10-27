// WebGL (OGL) : lumière rasante sur la photo d'ouverture, astéries qui s'allument dans le calcaire.
import { Renderer } from '../vendor/ogl/src/core/Renderer.js';
import { Program } from '../vendor/ogl/src/core/Program.js';
import { Mesh } from '../vendor/ogl/src/core/Mesh.js';
import { Texture } from '../vendor/ogl/src/core/Texture.js';
import { Triangle } from '../vendor/ogl/src/extras/Triangle.js';

const TOUCH = matchMedia('(pointer: coarse)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, TOUCH ? 1 : 1.25);

const VERT = /* glsl */ `
attribute vec2 uv; attribute vec2 position; varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const HAS_GL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
function makeRenderer(canvas, alpha) {
  if (!HAS_GL) return null;
  try {
    const r = new Renderer({ canvas, dpr: DPR, alpha, antialias: false, premultipliedAlpha: alpha, depth: false, powerPreference: 'low-power' });
    if (!r.gl) return null;
    return r;
  } catch (e) { return null; }
}

// Boucle commune : s'arrête hors écran.
function loop(el, frame) {
  let raf = 0, visible = false, running = false;
  const tick = (t) => { frame(t * 0.001); raf = requestAnimationFrame(tick); };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { rootMargin: '80px' });
  io.observe(el);
  function sync() { if (visible && running && !raf) raf = requestAnimationFrame(tick); if ((!visible || !running) && raf) { cancelAnimationFrame(raf); raf = 0; } }
  return { start() { running = true; sync(); }, stop() { running = false; sync(); }, destroy() { io.disconnect(); running = false; sync(); } };
}

/* ---------- Ouverture : lumière rasante qui suit le pointeur ---------- */
const HERO_FRAG = /* glsl */ `
precision mediump float;
uniform sampler2D tMap; uniform vec2 uRes; uniform vec2 uImg; uniform vec2 uMouse; uniform float uTime; uniform float uIn; uniform vec2 uPos;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
void main(){
  vec2 s = uRes / uImg; float sc = max(s.x, s.y) * 1.03;
  vec2 f = uRes / (uImg * sc);                 // même cadrage que object-position: 62% 45%
  vec2 pos = uPos;
  vec2 uv = vec2(pos.x * (1.0 - f.x) + vUv.x * f.x, 1.0 - (pos.y * (1.0 - f.y) + (1.0 - vUv.y) * f.y));
  vec2 m = uMouse - 0.5;
  uv += m * vec2(-0.012, 0.008) * uIn;
  uv = clamp(uv, 0.001, 0.999);
  vec3 col = texture2D(tMap, uv).rgb;
  vec2 p = vUv - uMouse; p.x *= uRes.x / uRes.y;
  float d = length(p);
  float glow = exp(-d * d * 3.2);
  float rake = smoothstep(1.2, -0.2, dot(normalize(vec2(0.9, -0.45)), vUv - uMouse) + 0.4);
  vec3 warm = vec3(1.0, 0.84, 0.6);
  col *= 0.9 + 0.32 * glow * warm * uIn + 0.06 * rake * uIn;
  col = mix(col, col * warm, 0.08 * uIn);
  float g = hash(gl_FragCoord.xy + floor(uTime * 8.0)) - 0.5;
  col += g * 0.025;
  gl_FragColor = vec4(col, 1.0);
}`;

export function heroLight(canvas, imgEl) {
  const renderer = makeRenderer(canvas, false); if (!renderer) return null;
  const gl = renderer.gl;
  const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
  const program = new Program(gl, { vertex: VERT, fragment: HERO_FRAG, uniforms: {
    tMap: { value: texture }, uRes: { value: [1, 1] }, uImg: { value: [imgEl.naturalWidth || 1920, imgEl.naturalHeight || 1440] },
    uMouse: { value: [0.72, 0.32] }, uTime: { value: 0 }, uIn: { value: 0 }, uPos: { value: [0.62, 0.45] } } });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const target = { x: 0.72, y: 0.32 }; const cur = { x: 0.72, y: 0.32 };
  const resize = () => { const r = canvas.parentElement.getBoundingClientRect(); renderer.setSize(r.width, r.height); program.uniforms.uRes.value = [r.width, r.height]; program.uniforms.uPos.value = r.width / r.height <= 0.8 ? [0.9, 0.4] : [0.62, 0.45]; };
  const load = () => new Promise((res) => {
    const im = new Image(); im.decoding = 'async'; im.src = imgEl.currentSrc || imgEl.src;
    im.onload = () => { texture.image = im; program.uniforms.uImg.value = [im.naturalWidth, im.naturalHeight]; res(true); };
    im.onerror = () => res(false);
  });
  const onMove = (e) => { const r = canvas.getBoundingClientRect(); target.x = (e.clientX - r.left) / r.width; target.y = 1 - (e.clientY - r.top) / r.height; };
  const l = loop(canvas, (t) => {
    cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
    if (TOUCH) { target.x = 0.62 + Math.sin(t * 0.25) * 0.18; target.y = 0.55 + Math.cos(t * 0.2) * 0.12; }
    program.uniforms.uMouse.value = [cur.x, cur.y]; program.uniforms.uTime.value = t;
    renderer.render({ scene: mesh });
  });
  const ro = new ResizeObserver(resize);
  canvas.style.width = '100%'; canvas.style.height = '100%';
  return {
    program,
    async start() {
      const ok = await load(); if (!ok) return false;
      resize(); ro.observe(canvas.parentElement); addEventListener('pointermove', onMove, { passive: true });
      l.start(); canvas.classList.add('is-ready');
      return true;
    },
    destroy() { l.destroy(); ro.disconnect(); removeEventListener('pointermove', onMove); },
  };
}

/* ---------- Calcaire : astéries fossiles qui s'allument ---------- */
const FOSSIL_FRAG = /* glsl */ `
precision mediump float;
uniform vec2 uRes; uniform float uProgress; uniform float uTime; uniform float uCell;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float sdStar5(vec2 p, float r, float rf){
  const vec2 k1 = vec2(0.809016994375, -0.587785252292); const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x); p -= 2.0 * max(dot(k1, p), 0.0) * k1; p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x); p.y -= r; vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}
void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 cell = floor(fc / uCell);
  float h = hash(cell);
  if (h > 0.26) { gl_FragColor = vec4(0.0); return; }           // pas d'astérie dans cette case : sortie immédiate
  float appear = hash(cell + 7.1);
  float vis = smoothstep(appear - 0.08, appear + 0.04, uProgress * 1.15);
  if (vis <= 0.001) { gl_FragColor = vec4(0.0); return; }
  vec2 local = fc - (cell + 0.5) * uCell;
  vec2 off = (vec2(hash(cell + 1.3), hash(cell + 2.9)) - 0.5) * uCell * 0.36;
  vec2 p = local - off;
  float a = hash(cell + 4.7) * 6.2831; float c = cos(a), s = sin(a);
  p = mat2(c, -s, s, c) * p;
  float r = uCell * (0.1 + 0.11 * hash(cell + 9.2));
  float d = sdStar5(p, r, 0.48);
  float core = smoothstep(1.5, -1.0, d);
  float glow = exp(-max(d, 0.0) / (r * 0.55)) * 0.75;
  float pulse = 0.82 + 0.18 * sin(uTime * 0.6 + h * 40.0);       // respiration lente, sans clignotement
  vec3 gold = vec3(1.0, 0.8, 0.5);
  float alpha = (core * 0.62 + glow * 0.42) * vis * pulse;
  gl_FragColor = vec4(gold * alpha, alpha);
}`;

export function fossils(canvas) {
  const renderer = makeRenderer(canvas, true); if (!renderer) return null;
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  const program = new Program(gl, { vertex: VERT, fragment: FOSSIL_FRAG, transparent: true, uniforms: {
    uRes: { value: [1, 1] }, uProgress: { value: 0 }, uTime: { value: 0 }, uCell: { value: 110 } } });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const resize = () => { const r = canvas.parentElement.getBoundingClientRect(); renderer.setSize(r.width, r.height); program.uniforms.uCell.value = Math.max(70, Math.min(130, r.width / 13)) * DPR; program.uniforms.uRes.value = [r.width, r.height]; };
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();
  const l = loop(canvas, (t) => { program.uniforms.uTime.value = t; renderer.render({ scene: mesh }); });
  return { set progress(v) { program.uniforms.uProgress.value = v; }, start() { l.start(); }, stop() { l.stop(); } };
}
