// Accueil : ouverture, coupe géologique, vins, millésimes, frise gravée, savoir-faire, chai, visites, parc, accès.
import { $, $$, L, eur, CALM, TOUCH, DESKTOP, hdrH, splitTitle, padMasks } from '../core.js?v=3';
import { heroLight, fossils } from '../gl.js?v=3';
import { WINES, CHATEAUX, FORMATS } from '../data.js?v=3';

const gsap = window.gsap; const ST = window.ScrollTrigger;
let hero = null;

export function setup() {
  buildVintages();
  buildMap();
  if (CALM) { drawBarrels($('[data-barrels]'), 480); $('[data-chai-count]').textContent = '480'; return; }
  gsap.set('[data-hero-img]', { scale: 1.16 });
  gsap.set(['[data-hero-kicker]', '[data-hero-sub]', '[data-hero-ctas] > *', '[data-hero-meta]', '[data-hero-scroll]'], { autoAlpha: 0, y: 24 });
  gsap.set('[data-hdr]', { autoAlpha: 0, y: -20 });
}

export function enter() {
  if (CALM) { initCraftStatic(); return; }
  heroIn();
  coupe();
  cuvees();
  story();
  craft();
  chai();
  tours();
  parc();
  mapAnim();
}

/* ---------- Ouverture ---------- */
function heroIn() {
  const title = $('[data-hero-title]');
  const split = window.SplitText ? SplitText.create(title, { type: 'chars', mask: 'chars' }) : null;
  if (split) padMasks(split, 'chars');
  const tl = gsap.timeline();
  tl.to('[data-hero-strata] span', { scaleY: 0, duration: 0.85, ease: 'expo.inOut', stagger: 0.09 }, 0)
    .to('[data-hero-img]', { scale: 1.03, duration: 2.0, ease: 'expo.out' }, 0);
  if (split) tl.from(split.chars, { yPercent: 115, rotate: 4, duration: 0.75, ease: 'expo.out', stagger: 0.02, onComplete: () => split.revert() }, 0.1);
  tl.to('[data-hdr]', { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.35)
    .to(['[data-hero-kicker]', '[data-hero-sub]', '[data-hero-ctas] > *', '[data-hero-meta]', '[data-hero-scroll]'], { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power3.out', stagger: 0.04 }, 0.45)
    .add(() => startHeroGL(), 1.7);
  // la photo descend doucement au défilement
  gsap.to('.hero__media', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -18, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'center center', end: 'bottom top', scrub: true } });
  // halo CSS de secours (sans WebGL) qui suit le pointeur
  const glow = $('.hero__glow');
  addEventListener('pointermove', (e) => { glow.style.setProperty('--mx', (e.clientX / innerWidth * 100) + '%'); glow.style.setProperty('--my', (e.clientY / innerHeight * 100) + '%'); }, { passive: true });
}
async function startHeroGL() {
  const img = $('[data-hero-img]'); const canvas = $('[data-hero-gl]');
  if (!img || !canvas) return;
  if (!img.complete) await new Promise((r) => img.addEventListener('load', r, { once: true }));
  hero = heroLight(canvas, img);
  if (!hero) return;
  const ok = await hero.start();
  if (ok) { $('.hero__glow').style.display = 'none'; gsap.to(hero.program.uniforms.uIn, { value: 1, duration: 1.6, ease: 'power2.out' }); }
}

/* ---------- La coupe géologique ---------- */
function coupe() {
  const frame = $('[data-coupe-frame]'); const stack = $('[data-coupe-stack]');
  const panels = $$('[data-panel]'); const ticks = $$('[data-tick]');
  const T = 1.08; const blend = blendTimeline(); let played = false;
  const fos = fossils($('[data-fossils]'));
  gsap.set(panels, { autoAlpha: 0, y: 24 });
  gsap.set('[data-panel-box]', { autoAlpha: 0 });
  const travel = () => stack.offsetHeight - frame.offsetHeight;
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
    trigger: frame, start: () => `top top+=${hdrH()}`, end: () => `+=${frame.offsetHeight * (DESKTOP() ? 4.2 : 3.6) * T}`,
    pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
    onToggle: (s) => { if (fos) s.isActive ? fos.start() : fos.stop(); },
    onLeave: () => { if (blend && !played) { played = true; blend.progress(1); } },
    onUpdate: (s) => {
      const t = s.progress * T; const p = t / 0.82;
      ticks.forEach((k, i) => k.classList.toggle('is-on', p >= [0, 0.22, 0.46, 0.66][i]));
      if (fos) fos.progress = gsap.utils.clamp(0, 1, (t - 0.6) / 0.24);
      if (blend && !played && t >= 0.87) { played = true; blend.restart(); }
      else if (blend && played && t < 0.84) { played = false; blend.pause(0); }
    },
  } });
  tl.to('[data-panel-box]', { autoAlpha: 1, duration: 0.03 }, 0)
    .to('[data-panel-box]', { autoAlpha: 0, duration: 0.03 }, 0.82)
    .to('[data-gauge]', { autoAlpha: 0, duration: 0.03 }, 0.82)
    .to(stack, { y: () => -travel(), duration: 0.82 }, 0)
    .to('[data-gauge-fill]', { scaleY: 1, duration: 0.82 }, 0)
    .to('.coupe__layer .layer-img', { yPercent: -6, duration: 0.82 }, 0);
  const seg = [[0, 0.17], [0.22, 0.4], [0.46, 0.6], [0.66, 0.82]];
  panels.forEach((p, i) => {
    const [a, b] = seg[i];
    tl.to(p, { autoAlpha: 1, y: 0, duration: 0.035, ease: 'power2.out' }, a === 0 ? 0.001 : a);
    if (i < 3) tl.to(p, { autoAlpha: 0, y: -24, duration: 0.03, ease: 'power2.in' }, b);
  });
  gsap.set('[data-core]', { xPercent: -50, yPercent: -30, autoAlpha: 0 });
  tl.fromTo('[data-core]', { autoAlpha: 0, scale: 0.7, rotate: -14, yPercent: -30 }, { autoAlpha: 1, scale: 1, rotate: 6, yPercent: -50, duration: 0.12, ease: 'power2.out' }, 0.64)
    .to('[data-core]', { rotate: -4, duration: 0.08 }, 0.76)
    .to('[data-core]', { autoAlpha: 0, duration: 0.03 }, 0.83)
    .to('[data-assemblage]', { autoAlpha: 1, duration: 0.04 }, 0.84)
    .from('[data-asm-head]', { y: 26, autoAlpha: 0, duration: 0.035, stagger: 0.01 }, 0.845);
  tl.to({}, { duration: 0.01 }, T - 0.01);
}

/* Assemblage : la barre se remplit comme un vin versé, joué en entier une fois la scène atteinte */
function blendTimeline() {
  const segs = $$('[data-asm-seg]'); const labs = $$('[data-asm-lab]'); const leads = $$('[data-asm-lead]'); const note = $('[data-asm-note]');
  if (!segs.length) return null;
  const closed = 'inset(0% 100% 0% 0%)'; const open = 'inset(0% 0% 0% 0%)';
  const count = (lab, at, dur) => { const n = $('[data-count]', lab); const v = +n.dataset.count; b.fromTo(n, { textContent: 0 }, { textContent: v, duration: dur, ease: 'power2.out', snap: { textContent: 1 } }, at); };
  const b = gsap.timeline({ paused: true, defaults: { overwrite: 'auto' } });
  b.fromTo(segs[0], { clipPath: closed }, { clipPath: open, duration: 1.05, ease: 'power2.inOut' }, 0)
    .fromTo(labs[0], { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out' }, 0.25)
    .fromTo(segs[1], { clipPath: closed }, { clipPath: open, duration: 0.4, ease: 'power1.inOut' }, 0.98)
    .fromTo(leads[0], { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'power2.out' }, 1.1)
    .fromTo(labs[1], { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out' }, 1.15)
    .fromTo(segs[2], { clipPath: closed }, { clipPath: open, duration: 0.3, ease: 'power2.out' }, 1.34)
    .fromTo(leads[1], { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'power2.out' }, 1.46)
    .fromTo(labs[2], { y: -12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out' }, 1.5)
    .fromTo(note, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 1.7);
  count(labs[0], 0.05, 1.0); count(labs[1], 1.0, 0.45); count(labs[2], 1.36, 0.35);
  b.pause(0);
  return b;
}

/* ---------- Trois vins ---------- */
function cuvees() {
  $$('[data-cuvee]').forEach((c, i) => {
    const b = $('[data-bottle]', c); const stage = $('[data-stage]', c);
    gsap.set(b, { xPercent: -50, x: 0 });
    gsap.from(b, { yPercent: 30, autoAlpha: 0, duration: 1.3, ease: 'expo.out', delay: i * 0.12, scrollTrigger: { trigger: c, start: 'top 80%', once: true } });
    gsap.from($$('.medal circle', c), { drawSVG: '0%', duration: 1.2, ease: 'power2.out', stagger: 0.1, delay: 0.4 + i * 0.12, scrollTrigger: { trigger: c, start: 'top 80%', once: true } });
    if (!TOUCH) {
      const rY = gsap.quickTo(b, 'rotationY', { duration: 0.9, ease: 'power3' }); const rZ = gsap.quickTo(b, 'rotation', { duration: 0.9, ease: 'power3' });
      gsap.set(b, { transformPerspective: 700 });
      stage.addEventListener('pointermove', (e) => { const r = stage.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5; rY(x * 34); rZ(x * 3); });
      stage.addEventListener('pointerleave', () => { rY(0); rZ(0); });
    }
  });
}

/* ---------- Frise des millésimes ---------- */
function buildVintages() {
  const track = $('[data-vtrack]'); if (!track) return;
  const years = []; for (let y = 2010; y <= 2022; y++) years.push(y);
  const by = {}; WINES.forEach((w) => { (by[w.vintage] = by[w.vintage] || []).push(w); });
  track.insertAdjacentHTML('beforeend', years.map((y) => {
    const n = (by[y] || []).length;
    return `<button class="vyear ${n ? 'is-avail' : ''}" type="button" data-year="${y}" ${n ? '' : 'disabled'} aria-label="${y}${n ? ` : ${n} vin${n > 1 ? 's' : ''}` : ' : aucun vin en vente'}">${n ? `<span class="count">${n}</span>` : ''}<svg class="ast" aria-hidden="true"><use href="#ast"/></svg><span class="y">${y}</span></button>`;
  }).join(''));
  const tip = $('[data-vtip]');
  const show = (y, btn) => {
    $$('.vyear', track).forEach((b) => b.classList.toggle('is-active', b === btn));
    const list = by[y] || [];
    tip.innerHTML = `<strong class="h3" style="font-size:1.4rem">${L('Millésime', 'Vintage')} ${y}</strong><ul>${list.map((w) => `<li><a class="link" href="vin.html?id=${w.id}">${CHATEAUX[w.ch].name}</a> · <span class="muted">${L(FORMATS[w.fmt].label.fr, FORMATS[w.fmt].label.en)}</span> · <b>${eur(w.price)}</b></li>`).join('')}</ul><a class="small link" href="boutique.html?millesime=${y}">${L('Voir ce millésime à la boutique', 'See this vintage in the shop')}</a>`;
  };
  track.addEventListener('pointerover', (e) => { const b = e.target.closest('.vyear.is-avail'); if (b && !TOUCH) show(+b.dataset.year, b); });
  track.addEventListener('click', (e) => { const b = e.target.closest('.vyear.is-avail'); if (b) show(+b.dataset.year, b); });
  track.addEventListener('focusin', (e) => { const b = e.target.closest('.vyear.is-avail'); if (b) show(+b.dataset.year, b); });
  const last = [...$$('.vyear.is-avail', track)].pop(); if (last) show(+last.dataset.year, last);
  if (!CALM) {
    gsap.from('[data-vline]', { scaleX: 0, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: track, start: 'top 85%', once: true } });
    gsap.from($$('.vyear', track), { y: 30, autoAlpha: 0, rotate: -30, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.05, delay: 0.3, scrollTrigger: { trigger: track, start: 'top 85%', once: true } });
  }
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
        trigger: frame, start: () => `top top+=${hdrH()}`, end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
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
function drawBarrels(cv, n) {
  if (!cv) return;
  const dpr = Math.min(devicePixelRatio || 1, 2); const r = cv.getBoundingClientRect();
  cv.width = r.width * dpr; cv.height = r.height * dpr;
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
  const cols = 24, rows = 20; const cw = r.width / cols, ch = r.height / rows; const rad = Math.min(cw, ch) * 0.4;
  for (let i = 0; i < Math.min(n, 480); i++) {
    const x = (i % cols) * cw + cw / 2, y = Math.floor(i / cols) * ch + ch / 2;
    ctx.strokeStyle = 'rgba(194,155,87,.85)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(194,155,87,.4)';
    ctx.beginPath(); ctx.arc(x, y, rad * 0.62, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - rad * 0.62, y); ctx.lineTo(x + rad * 0.62, y); ctx.stroke();
  }
}
function chai() {
  const cv = $('[data-barrels]'); const count = $('[data-chai-count]'); const o = { n: 0 };
  ST.create({ trigger: '[data-chai]', start: 'top 85%', once: true, onEnter: () => gsap.to(o, { n: 480, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { const v = Math.round(o.n); count.textContent = v; drawBarrels(cv, v); } }) });
  addEventListener('resize', () => drawBarrels(cv, Math.round(o.n)));
  gsap.to('[data-chai-bg]', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '[data-chai]', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('[data-beam]', { xPercent: 6, yPercent: -4, opacity: 0.85, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
}

/* ---------- Visites : strates qui se soulèvent ---------- */
function tours() {
  const cards = $$('[data-tcard]');
  cards.forEach((c, i) => {
    const next = cards[i + 1]; if (!next || getComputedStyle(c).position !== 'sticky') return;
    const st = { trigger: next, start: 'top bottom', end: () => `top ${hdrH() + 40}px`, scrub: true };
    gsap.to(c, { scale: 0.96, ease: 'none', scrollTrigger: st });
    gsap.to($('.tcard__img img', c), { filter: 'saturate(.84) sepia(.08) brightness(.72)', ease: 'none', scrollTrigger: { ...st } });
  });
}

/* ---------- Parc : mosaïque en parallaxe croisée ---------- */
function parc() {
  $$('[data-mosaic] [data-speed]').forEach((f) => {
    gsap.fromTo($('img', f), { yPercent: -(+f.dataset.speed) }, { yPercent: +f.dataset.speed, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.from(['[data-heli-ring]', '[data-heli-h]'], { drawSVG: '0%', duration: 1.6, ease: 'power2.inOut', stagger: 0.3, scrollTrigger: { trigger: '[data-heli-ring]', start: 'top 90%', once: true } });
}

/* ---------- Accès : plan schématique et boussole ---------- */
const PLACES = {
  home: [44.948468, -0.10066], se: [44.8944, -0.1556], lib: [44.9153, -0.2439], bdx: [44.8378, -0.5792], mon: [44.9306, -0.1286],
};
function proj([lat, lon]) {
  // projection équirectangulaire du Libournais dans la boîte 800 x 640
  const x0 = -0.66, x1 = 0.02, y0 = 44.79, y1 = 45.01;
  const x = ((lon - x0) / (x1 - x0)) * 800; const y = (1 - (lat - y0) / (y1 - y0)) * 640;
  return [x, y];
}
function buildMap() {
  const g = $('[data-map-art]'); if (!g) return;
  const [hx, hy] = proj(PLACES.home);
  const town = (k, name, sub, anchor = 'start', dx = 10, dy = 4) => { const [x, y] = proj(PLACES[k]); return `<g class="town"><circle cx="${x}" cy="${y}" r="4.5"/><text x="${x + (anchor === 'end' ? -dx : dx)}" y="${y + dy}" text-anchor="${anchor}">${name}</text>${sub ? `<text class="sub" x="${x + (anchor === 'end' ? -dx : dx)}" y="${y + dy + 16}" text-anchor="${anchor}">${sub}</text>` : ''}</g>`; };
  const route = (k) => { const [x, y] = proj(PLACES[k]); const mx = (x + hx) / 2, my = (y + hy) / 2 + 30; return `<path class="route" d="M${hx} ${hy} Q${mx} ${my} ${x} ${y}" data-route/>`; };
  // rivières schématiques : la Dordogne longe Saint-Émilion, reçoit l'Isle à Libourne et rejoint la Garonne au Bec d'Ambès
  const dord = [[44.852, 0.03], [44.858, -0.05], [44.872, -0.13], [44.884, -0.19], [44.912, -0.247], [44.945, -0.33], [44.985, -0.44], [45.04, -0.56]].map(proj);
  const isle = [[45.04, -0.12], [45.0, -0.19], [44.96, -0.218], [44.915, -0.245]].map(proj);
  const garo = [[44.79, -0.5], [44.82, -0.545], [44.845, -0.565], [44.88, -0.54], [44.94, -0.555], [45.04, -0.565]].map(proj);
  const path = (pts) => 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L');
  g.innerHTML = `
    <rect width="800" height="640" fill="#F6F1E7"/>
    <g opacity=".5">${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="640" stroke="#1F1B16" stroke-opacity=".06"/>`).join('')}${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="800" y2="${i * 100}" stroke="#1F1B16" stroke-opacity=".06"/>`).join('')}</g>
    <path class="river" d="${path(dord)}"/><path class="river" d="${path(isle)}"/><path class="river" d="${path(garo)}"/>
    <text x="${dord[5][0] + 14}" y="${dord[5][1] + 22}" font-size="12" font-style="italic" fill="#6F8D96" font-family="Fraunces, Georgia, serif">Dordogne</text>
    <text x="${isle[1][0] + 12}" y="${isle[1][1]}" font-size="12" font-style="italic" fill="#6F8D96" font-family="Fraunces, Georgia, serif">Isle</text>
    <text x="${garo[3][0] + 10}" y="${garo[3][1] - 14}" font-size="12" font-style="italic" fill="#6F8D96" font-family="Fraunces, Georgia, serif">Garonne</text>
    ${route('se')}${route('lib')}${route('bdx')}
    ${town('bdx', 'Bordeaux', '56 km')}${town('lib', 'Libourne', '', 'end')}${town('se', 'Saint-Émilion', '8,7 km', 'start', 10, 18)}${town('mon', 'Montagne', '', 'end', 10, -8)}
    <g class="home"><circle class="pulse" cx="${hx}" cy="${hy}" r="16"/><circle cx="${hx}" cy="${hy}" r="7" fill="#9B4B33"/><text x="${hx - 14}" y="${hy - 16}" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="17" fill="#1F1B16">Château Haut-Piquat</text><text x="${hx - 14}" y="${hy + 2}" text-anchor="end" font-size="12" fill="#6B6052" font-family="Manrope, sans-serif">Lussac</text></g>`;
}
function bearing(a, b) {
  const toR = Math.PI / 180; const [la1, lo1] = a.map((v) => v * toR); const [la2, lo2] = b.map((v) => v * toR);
  const y = Math.sin(lo2 - lo1) * Math.cos(la2); const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(lo2 - lo1);
  return (Math.atan2(y, x) / toR + 360) % 360;
}
function mapAnim() {
  const b = Math.round(bearing(PLACES.bdx, PLACES.home));
  const bt = $('[data-bearing]'); if (bt) bt.insertAdjacentHTML('beforeend', ' ' + L(`Cap ${b}° depuis Bordeaux.`, `Bearing ${b}° from Bordeaux.`));
  gsap.from('[data-route]', { drawSVG: '0%', duration: 1.8, ease: 'power2.inOut', stagger: 0.25, scrollTrigger: { trigger: '[data-map]', start: 'top 75%', once: true } });
  const needle = $('[data-needle]');
  ST.create({ trigger: '[data-map]', start: 'top 75%', once: true, onEnter: () => gsap.fromTo(needle, { rotation: -540, svgOrigin: '50 50' }, { rotation: b, svgOrigin: '50 50', duration: 2.6, ease: 'elastic.out(1, 0.35)' }) });
  if (!TOUCH) {
    const map = $('[data-map]'); const rTo = gsap.quickTo(needle, 'rotation', { duration: 1.2, ease: 'power3' });
    map.addEventListener('pointermove', (e) => { const r = map.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5; rTo(b + x * 24); });
    map.addEventListener('pointerleave', () => rTo(b));
  }
}
