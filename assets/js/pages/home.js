// Accueil : ouverture, coupe géologique, vins, millésimes, puis deux bandeaux vers Le domaine et Visites & événements.
import { $, $$, L, eur, CALM, TOUCH, DESKTOP, hdrH, splitTitle, padMasks } from '../core.js?v=8';
import { heroLight, fossils } from '../gl.js?v=8';
import { WINES, CHATEAUX, FORMATS } from '../data.js?v=8';

const gsap = window.gsap; const ST = window.ScrollTrigger;
let hero = null;

export function setup() {
  buildVintages();
  if (CALM) return;
  gsap.set('[data-hero-img]', { scale: 1.16 });
  gsap.set(['[data-hero-kicker]', '[data-hero-sub]', '[data-hero-ctas] > *', '[data-hero-meta]', '[data-hero-scroll]'], { autoAlpha: 0, y: 24 });
  gsap.set('[data-hdr]', { autoAlpha: 0, y: -20 });
}

export function enter() {
  if (CALM) return;
  heroIn();
  coupe();
  cuvees();
  teasers();
}

/* ---------- Bandeaux : Le domaine, Visites & événements ---------- */
function teasers() {
  const dates = $$('[data-tdates] [data-engrave]');
  gsap.set(dates, { clipPath: 'inset(0 100% 0 0)' });
  ST.create({ trigger: '[data-tdates]', start: 'top 85%', once: true, onEnter: () => gsap.to(dates, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'steps(14)', stagger: 0.25 }) });
  gsap.fromTo('.tdom__media img', { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.tdom', start: 'top bottom', end: 'bottom top', scrub: true } });
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
      ticks.forEach((k, i) => k.classList.toggle('is-on', p >= [0, 0.24, 0.51, 0.77][i]));
      if (fos) fos.progress = gsap.utils.clamp(0, 1, (t - 0.6) / 0.24);
      if (blend && !played && t >= 0.855) { played = true; blend.restart(); }
      else if (blend && played && t < 0.84) { played = false; blend.pause(0); }
    },
  } });
  tl.to('[data-panel-box]', { autoAlpha: 1, duration: 0.03 }, 0)
    .to('[data-panel-box]', { autoAlpha: 0, duration: 0.03 }, 0.82)
    .to('[data-gauge]', { autoAlpha: 0, duration: 0.03 }, 0.82)
    .to(stack, { y: () => -travel(), duration: 0.82 }, 0)
    .to('[data-gauge-fill]', { scaleY: 1, duration: 0.82 }, 0)
    .to('.coupe__layer .layer-img', { yPercent: -6, duration: 0.82 }, 0);
  // panneaux enchaînés en fondu croisé : la boîte n'est jamais vide
  const seg = [[0, 0.2], [0.2, 0.42], [0.42, 0.63], [0.63, 0.82]];
  panels.forEach((p, i) => {
    const [a, b] = seg[i];
    tl.to(p, { autoAlpha: 1, y: 0, duration: 0.03, ease: 'power2.out' }, a === 0 ? 0.001 : a - 0.005);
    if (i < 3) tl.to(p, { autoAlpha: 0, y: -20, duration: 0.025, ease: 'power2.in' }, b - 0.02);
  });
  gsap.set('[data-core]', { xPercent: -50, yPercent: -30, autoAlpha: 0 });
  tl.fromTo('[data-core]', { autoAlpha: 0, scale: 0.7, rotate: -14, yPercent: -30 }, { autoAlpha: 1, scale: 1, rotate: 6, yPercent: -50, duration: 0.12, ease: 'power2.out' }, 0.64)
    .to('[data-core]', { rotate: -4, duration: 0.08 }, 0.76)
    .to('[data-core]', { autoAlpha: 0, duration: 0.03 }, 0.83)
    .to('[data-assemblage]', { autoAlpha: 1, duration: 0.035 }, 0.815)
    .from('[data-asm-head]', { y: 26, autoAlpha: 0, duration: 0.035, stagger: 0.01 }, 0.845);
  tl.to({}, { duration: 0.01 }, T - 0.01);
}

/* Assemblage : la barre se remplit comme un vin versé, joué en entier une fois la scène atteinte */
function blendTimeline() {
  const segs = $$('[data-asm-seg]'); const labs = $$('[data-asm-lab]'); const leads = $$('[data-asm-lead]'); const note = $('[data-asm-note]');
  if (!segs.length) return null;
  const closed = 'inset(0% 100% 0% 0%)'; const open = 'inset(0% 0% 0% 0%)';
  const count = (lab, at, dur) => { const n = $('[data-asm-n]', lab); const v = +n.dataset.asmN; b.fromTo(n, { textContent: 0 }, { textContent: v, duration: dur, ease: 'power2.out', snap: { textContent: 1 } }, at); };
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

