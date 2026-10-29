// Le domaine : frise gravée, savoir-faire ouvert par une fissure, chai de 480 barriques.
import { $, $$, L, CALM, hdrH, padMasks, splitHold, anticipate, pinType } from '../core.js?v=18';

const gsap = window.gsap; const ST = window.ScrollTrigger;

export function setup() {
  if (CALM) { drawBarrels($('[data-barrels]'), 480); $('[data-chai-count]').textContent = '480'; }
}

export function enter() {
  if (CALM) return;
  heroIn();
  story();
  craft();
  chai();
}

function heroIn() {
  const t = $('[data-hero-title]');
  const s = splitHold(t, 'words');
  if (s) gsap.from(s.words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.1, onComplete: s.done });
  gsap.from('.phero__content .kicker, .phero__content .lead, .dhero__nav a', { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.4 });
  gsap.fromTo('[data-parallax-img]', { scale: 1.15 }, { scale: 1, duration: 2, ease: 'expo.out' });
  gsap.to('[data-parallax-img]', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '[data-phero]', start: 'top top', end: 'bottom top', scrub: true } });
}

/* ---------- 2 000 ans gravés dans la pierre ---------- */
function engrave(el, opts) {
  gsap.fromTo(el, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'steps(14)', ...opts });
}
function equalizeEras() {
  const bodies = $$('[data-era] .era__body'); bodies.forEach((b) => { b.style.minHeight = ''; });
  if (innerWidth < 900) return;
  const h = Math.max(...bodies.map((b) => b.offsetHeight)); bodies.forEach((b) => { b.style.minHeight = h + 'px'; });
}
function story() {
  equalizeEras(); addEventListener('resize', equalizeEras); document.addEventListener('ahp:lang', equalizeEras);
  const frame = $('[data-story-frame]'); const track = $('[data-story-track]');
  const dates = $$('[data-engrave]');
  ST.matchMedia({
    '(min-width: 900px)': () => {
      const dist = () => track.scrollWidth - innerWidth;
      const tw = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: {
        trigger: frame, start: () => `top top+=${hdrH()}`, end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: anticipate(), pinType: pinType(),
        onUpdate: (s) => gsap.set('[data-story-progress]', { scaleX: s.progress }),
      } });
      dates.forEach((d) => engrave(d, { scrollTrigger: { trigger: d.closest('.era'), containerAnimation: tw, start: 'left 85%', once: true } }));
      $$('[data-era] .era__img img').forEach((im) => gsap.fromTo(im, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: im.closest('.era'), containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } }));
    },
    '(max-width: 899px)': () => {
      gsap.set(dates, { clipPath: 'inset(0 100% 0 0)' });
      dates.slice(0, 2).forEach((d) => engrave(d, { scrollTrigger: { trigger: d, start: 'top 92%', once: true } }));
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { engrave($('[data-engrave]', e.target), {}); io.unobserve(e.target); } }), { root: track, threshold: 0.55 });
      $$('[data-era]').slice(2).forEach((e) => io.observe(e));
      return () => io.disconnect();
    },
  });
}

/* ---------- Savoir-faire : photos ouvertes par une fissure ---------- */
function crackPath(t, seed) {
  const n = 9; const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const y = (i / n) * 100;
    const j = (Math.sin(seed * 12.9 + i * 2.7) * 0.5 + Math.sin(seed * 4.1 + i * 5.3) * 0.5) * 7 * (1 - t);
    const half = t * 52;
    L.push(`${Math.max(0, 50 - half + j).toFixed(2)}% ${y}%`); R.push(`${Math.min(100, 50 + half + j).toFixed(2)}% ${y}%`);
  }
  return `polygon(${R.join(',')},${L.reverse().join(',')})`;
}
const CLOSED = 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)';
function crack(el, seed, play = true) {
  const o = { t: 0.0 };
  el.style.clipPath = CLOSED;
  return gsap.to(o, { t: 1, duration: 1.25, ease: 'power3.inOut', paused: !play, onUpdate: () => { el.style.clipPath = o.t < 0.01 ? CLOSED : crackPath(o.t, seed); }, onComplete: () => { el.style.clipPath = 'none'; }, onReverseComplete: () => { el.style.clipPath = CLOSED; } });
}
function craft() {
  const frames = $$('[data-craft-frame]'); const steps = $$('[data-step]');
  ST.matchMedia({
    '(min-width: 1000px)': () => {
      frames.forEach((f, i) => { if (i) f.style.clipPath = CLOSED; });
      steps.forEach((s, i) => {
        if (!i) return;
        const tw = crack(frames[i], i, false);
        ST.create({ trigger: s, start: 'top 60%', onEnter: () => tw.play(), onLeaveBack: () => tw.reverse() });
      });
      frames.forEach((f) => gsap.fromTo($('img', f), { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-craft-media]', start: 'top bottom', end: 'bottom top', scrub: true } }));
    },
    '(max-width: 999px)': () => {
      steps.forEach((s, i) => { const f = $('.frame', s); const tw = crack(f, i + 1, false); ST.create({ trigger: f, start: 'top 85%', once: true, onEnter: () => tw.play() }); });
    },
  });
}
function initCraftStatic() { /* mode calme : photos visibles, rien à faire */ }

/* ---------- Le chai : 480 barriques ---------- */
// 480 fonds de barriques empilés en quinconce, comme dans le chai : un fond dessiné une fois, puis recopié
let barrelSprite = null;
function barrelHead(d) {
  const c = document.createElement('canvas'); c.width = c.height = d; const x = c.getContext('2d'); const r = d / 2;
  const g = x.createRadialGradient(r * 0.8, r * 0.7, r * 0.1, r, r, r); g.addColorStop(0, '#9A6A3E'); g.addColorStop(0.75, '#6B4426'); g.addColorStop(1, '#3E2715');
  x.fillStyle = g; x.beginPath(); x.arc(r, r, r * 0.96, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(214,176,108,.9)'; x.lineWidth = Math.max(1, d * 0.07); x.beginPath(); x.arc(r, r, r * 0.9, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = 'rgba(30,18,10,.45)'; x.lineWidth = Math.max(0.6, d * 0.025);
  for (const k of [-0.36, 0, 0.36]) { const y = r + k * r; const w = Math.sqrt(Math.max(0, (r * 0.78) ** 2 - (y - r) ** 2)); x.beginPath(); x.moveTo(r - w, y); x.lineTo(r + w, y); x.stroke(); }
  x.fillStyle = 'rgba(20,12,6,.55)'; x.beginPath(); x.arc(r, r * 1.42, Math.max(0.8, d * 0.05), 0, Math.PI * 2); x.fill();
  return c;
}
function drawBarrels(cv, n) {
  if (!cv) return;
  const dpr = Math.min(devicePixelRatio || 1, 2); const r = cv.getBoundingClientRect();
  cv.width = r.width * dpr; cv.height = r.height * dpr;
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
  const cols = 24, rows = 20; const cw = r.width / (cols + 0.5), ch = r.height / rows; const d = Math.min(cw, ch * 1.12) * 0.98;
  const px = Math.round(d * dpr);
  if (!barrelSprite || barrelSprite.width !== px) barrelSprite = barrelHead(px);
  for (let i = 0; i < Math.min(n, 480); i++) {
    const row = Math.floor(i / cols); const col = i % cols;
    const x = col * cw + (row % 2 ? cw : cw / 2), y = r.height - (row * ch + ch / 2);
    ctx.drawImage(barrelSprite, x - d / 2, y - d / 2, d, d);
  }
}
function chai() {
  const cv = $('[data-barrels]'); const count = $('[data-chai-count]'); const o = { n: 0 };
  ST.create({ trigger: '[data-chai]', start: 'top 85%', once: true, onEnter: () => gsap.to(o, { n: 480, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { const v = Math.round(o.n); count.textContent = v; drawBarrels(cv, v); } }) });
  addEventListener('resize', () => drawBarrels(cv, Math.round(o.n)));
  gsap.to('[data-chai-bg]', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '[data-chai]', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('[data-beam]', { xPercent: 6, yPercent: -4, opacity: 0.55, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
}

