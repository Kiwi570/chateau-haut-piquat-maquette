// Accueil : ouverture, coupe géologique, vins, millésimes, puis deux bandeaux vers Le domaine et Visites & événements.
import { $, $$, L, eur, CALM, TOUCH, DESKTOP, hdrH, splitTitle, splitHold, padMasks, pourSound, anticipate, pinType } from '../core.js?v=18';
import { heroLight, fossils } from '../gl.js?v=18';
import { WINES, CHATEAUX, FORMATS } from '../data.js?v=18';

const gsap = window.gsap; const ST = window.ScrollTrigger;
let hero = null;

export function setup() {
  buildVintages();
  if (CALM) return;
  gsap.set(['[data-hero-img]', '[data-hero-video]'], { scale: 1.16 });
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
  const split = splitHold(title, 'chars');
  const tl = gsap.timeline();
  tl.to('[data-hero-strata] span', { scaleY: 0, duration: 0.85, ease: 'expo.inOut', stagger: 0.09 }, 0)
    .to(['[data-hero-img]', '[data-hero-video]'], { scale: 1.03, duration: 2.0, ease: 'expo.out' }, 0);
  if (split) tl.from(split.chars, { yPercent: 115, rotate: 4, duration: 0.75, ease: 'expo.out', stagger: 0.02, onComplete: split.done }, 0.1);
  tl.to('[data-hdr]', { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.35)
    .to(['[data-hero-kicker]', '[data-hero-sub]', '[data-hero-ctas] > *', '[data-hero-meta]', '[data-hero-scroll]'], { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power3.out', stagger: 0.04 }, 0.45)
    .add(() => startHeroVideo(), 0.2);
  // la photo descend doucement au défilement
  gsap.to('.hero__media', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -18, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'center center', end: 'bottom top', scrub: true } });
  // halo CSS de secours (sans WebGL) qui suit le pointeur
  const glow = $('.hero__glow');
  addEventListener('pointermove', (e) => { glow.style.setProperty('--mx', (e.clientX / innerWidth * 100) + '%'); glow.style.setProperty('--my', (e.clientY / innerHeight * 100) + '%'); }, { passive: true });
}
/* Vidéo de l'ouverture : boucle muette, photo en attente, repli sur la lumière WebGL */
function startHeroVideo() {
  const v = $('[data-hero-video]');
  const net = navigator.connection || {};
  const slow = net.saveData || /(^|-)2g$/.test(net.effectiveType || '');
  if (!v || slow || !v.canPlayType('video/mp4')) { setTimeout(startHeroGL, 1500); return; }
  const portrait = matchMedia('(max-aspect-ratio: 1/1)').matches;
  v.src = portrait ? 'assets/video/ouverture-720.mp4' : 'assets/video/ouverture-1920.mp4';
  let fell = false; const fallback = () => { if (fell) return; fell = true; v.removeAttribute('src'); v.load(); startHeroGL(); };
  const timer = setTimeout(() => { if (!v.classList.contains('is-on')) fallback(); }, 9000);
  v.addEventListener('playing', () => { clearTimeout(timer); v.classList.add('is-on'); }, { once: true });
  v.addEventListener('error', fallback, { once: true });
  const p = v.play(); if (p && p.catch) p.catch(fallback);
  // pause hors de l'écran et quand l'onglet est masqué
  const io = new IntersectionObserver(([e]) => { if (fell) return; if (e.isIntersecting && !document.hidden) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.05 });
  io.observe($('[data-hero]'));
  document.addEventListener('visibilitychange', () => { if (fell) return; if (document.hidden) v.pause(); else if ($('[data-hero]').getBoundingClientRect().bottom > 0) v.play().catch(() => {}); });
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
  const T = 1.3; const blend = blendTimeline(); let played = false;
  // le titre de l'assemblage entre d'un seul geste (et non au rythme du défilement) : il n'est jamais figé à moitié
  const head = $$('[data-asm-head]'); let headIn = false;
  gsap.set(head, { y: 16, autoAlpha: 0 });
  const fos = fossils($('[data-fossils]'));
  gsap.set(panels, { autoAlpha: 0, y: 24 });
  gsap.set('[data-panel-box]', { autoAlpha: 0 });
  const travel = () => stack.offsetHeight - frame.offsetHeight;
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
    trigger: frame, start: () => `top top+=${hdrH()}`, end: () => `+=${frame.offsetHeight * (DESKTOP() ? 4.2 : 3.6) * T}`,
    pin: true, scrub: 0.8, anticipatePin: anticipate(), pinType: pinType(), invalidateOnRefresh: true,
    onToggle: (s) => { if (fos) s.isActive ? fos.start() : fos.stop(); },
    onLeave: () => { if (!headIn) { headIn = true; gsap.set(head, { y: 0, autoAlpha: 1 }); } if (!blend) return; if (!played) { played = true; blend.progress(1); } else { blend.scroll(1); blend.hurry(); } },
    onUpdate: (s) => {
      const t = s.progress * T; const p = t / 0.82;
      ticks.forEach((k, i) => k.classList.toggle('is-on', p >= [0, 0.24, 0.51, 0.77][i]));
      if (fos) fos.progress = gsap.utils.clamp(0, 1, (t - 0.6) / 0.24);
      if (!headIn && t >= 0.83) { headIn = true; gsap.to(head, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out', stagger: 0.06, overwrite: true }); }
      else if (headIn && t < 0.81) { headIn = false; gsap.to(head, { y: 16, autoAlpha: 0, duration: 0.25, overwrite: true }); }
      if (blend) {
        // on rejoue seulement quand l'assemblage est redevenu invisible ; en remontant depuis plus bas, la jauge est déjà pleine
        if (!played && t >= 0.855) { played = true; if (s.direction < 0) blend.progress(1); else blend.restart(); }
        else if (played && t < 0.81) { played = false; blend.pause(0); }
        if (played) blend.scroll(gsap.utils.clamp(0, 1, (t - 0.855) / (T - 0.07 - 0.855)));
      }
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
    .to('[data-assemblage]', { autoAlpha: 1, duration: 0.035 }, 0.815);
  tl.to({}, { duration: 0.01 }, T - 0.01);
}

/* Assemblage : une bouteille de Château Haut-Piquat verse le vin, chaque cépage remplit sa part de la jauge.
   Le versement avance seul, mais le défilement peut le pousser : il est toujours terminé quand la section se libère. */
function blendTimeline() {
  const chart = $('[data-asm]'); if (!chart) return null;
  const segs = $$('[data-asm-seg]'); const labs = $$('[data-asm-lab]'); const leads = $$('[data-asm-lead]'); const note = $('[data-asm-note]');
  const pour = $('[data-asm-pour]'); const bottle = $('[data-asm-bottle]'); const stream = $('[data-asm-stream]'); const dropsBox = $('[data-asm-drops]'); const drops = $$('i', dropsBox);
  const liq = segs.map((s) => $('.asm-liquid', s)); const nums = labs.map((l) => $('[data-asm-n]', l));
  const COLORS = ['#9A2C49', '#6C2456', '#55307A']; const FILL = [1.15, 0.6, 0.48];
  let tl = null; let dropTl = null; let ticker = null; let snd = null;
  let shown = 0; let push = 0; let pushS = 0; let level = 0; let geo = null; let full = false;
  // vitesse maximale du versement : le défilement peut l'accélérer jusqu'à 1,6 fois sa vitesse naturelle, pas plus
  const CAP = 1.6; let cap = CAP;
  const stopTicker = () => { if (ticker) { gsap.ticker.remove(ticker); ticker = null; } };
  const stopSnd = () => { if (snd) { snd.stop(); snd = null; } };
  const reset = () => {
    stopTicker(); stopSnd(); if (tl) tl.kill(); tl = null; if (dropTl) dropTl.kill(); dropTl = null;
    gsap.killTweensOf(liq); full = false; push = pushS = shown = level = 0; cap = CAP;
    gsap.set(liq, { yPercent: 100 }); segs.forEach((s) => s.classList.remove('is-full', 'is-filling'));
    gsap.set([...labs, note], { autoAlpha: 0 }); gsap.set(leads, { scaleY: 0 });
    nums.forEach((n) => { n.textContent = '0'; });
    gsap.set(pour, { autoAlpha: 0 }); gsap.set(bottle, { rotation: 0, rotationY: 0, scale: 1 }); gsap.set(stream, { scaleY: 0 }); gsap.set(dropsBox, { autoAlpha: 0 });
  };
  const finish = () => {
    reset(); full = true;
    gsap.set(liq, { yPercent: 0 }); segs.forEach((s) => s.classList.add('is-full'));
    gsap.set([...labs, note], { autoAlpha: 1, y: 0 }); gsap.set(leads, { scaleY: 1 }); nums.forEach((n) => { n.textContent = n.dataset.asmN; });
  };
  const build = () => {
    reset();
    const cr = chart.getBoundingClientRect(); const br = $('.asm-bar', chart).getBoundingClientRect();
    const barTop = br.top - cr.top; const barH = br.height; const bh = bottle.offsetHeight || 110;
    const tipY = barTop - Math.round(bh * 0.34);
    const xs = segs.map((s) => { const r = s.getBoundingClientRect(); return [r.left - cr.left, r.width]; });
    geo = innerWidth;
    gsap.set(stream, { height: barTop - tipY + barH - 4 });
    dropTl = gsap.timeline({ repeat: -1, paused: true });
    drops.forEach((d, k) => dropTl.fromTo(d, { x: 0, y: 0, scale: 1, autoAlpha: 1 }, { x: (k % 2 ? 1 : -1) * (6 + k * 3), y: -10 - k * 4, scale: 0.4, autoAlpha: 0, duration: 0.42, ease: 'power2.out' }, k * 0.11));
    const t = gsap.timeline({ paused: true });
    const x1 = xs[0][0] + Math.max(xs[0][1] * 0.16, bh * 0.92);
    // entrée en profondeur : la bouteille pivote sur elle-même avant de s'incliner
    t.fromTo(pour, { autoAlpha: 0, x: x1 - 70, y: tipY - 30 }, { autoAlpha: 1, x: x1, y: tipY, duration: 0.7, ease: 'power3.out' }, 0)
      .fromTo(bottle, { rotation: 8, rotationY: -70, scale: 0.72, transformPerspective: 520 }, { rotation: 118, rotationY: 0, scale: 1, duration: 0.75, ease: 'power2.inOut' }, 0);
    let at = 0.66;
    segs.forEach((s, i) => {
      const [x0, w] = xs[i];
      if (i > 0) {
        t.to(stream, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.12, ease: 'power1.in' }, at)
          .to(bottle, { rotation: 96, duration: 0.2, ease: 'power2.out' }, at)
          .add(() => { stopSnd(); dropTl.pause(); gsap.to(dropsBox, { autoAlpha: 0, duration: 0.15 }); }, at)
          .to(pour, { x: x0 + w * 0.5, duration: 0.42, ease: 'power2.inOut' }, at + 0.05)
          .to(bottle, { rotation: 118, duration: 0.22, ease: 'power2.in' }, at + 0.28);
        at += 0.5;
      }
      const reps = Math.max(1, Math.floor(FILL[i] / 0.45));
      t.set(stream, { backgroundColor: COLORS[i], transformOrigin: '50% 0%' }, at)
        .to(stream, { scaleY: 1, duration: 0.16, ease: 'power1.in' }, at)
        .add(() => { s.classList.add('is-filling'); gsap.set(drops, { backgroundColor: COLORS[i] }); gsap.to(dropsBox, { autoAlpha: 1, duration: 0.15 }); dropTl.restart(); stopSnd(); snd = pourSound(FILL[i]); }, at + 0.12)
        .to(bottle, { rotation: 112, duration: Math.min(0.22, (FILL[i] - 0.08) / (2 * reps)), ease: 'sine.inOut', yoyo: true, repeat: 2 * reps - 1 }, at + 0.16)
        .to(liq[i], { yPercent: 0, duration: FILL[i], ease: 'power1.inOut', onUpdate() { level = this.progress(); } }, at + 0.12)
        .fromTo(nums[i], { textContent: 0 }, { textContent: +nums[i].dataset.asmN, duration: FILL[i], ease: 'power1.inOut', snap: { textContent: 1 } }, at + 0.12)
        .add(() => { stopSnd(); s.classList.remove('is-filling'); s.classList.add('is-full'); level = 0; }, at + 0.12 + FILL[i]);
      if (i === 0) t.to(pour, { x: x0 + w * 0.66, duration: FILL[0] + 0.1, ease: 'sine.inOut' }, at + 0.08);
      if (i < 2) t.fromTo(labs[i], { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' }, at + FILL[i] * 0.5);
      if (i === 1) t.fromTo(leads[0], { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'power2.out' }, at + FILL[i] * 0.4);
      at += 0.12 + FILL[i];
    });
    t.to(stream, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.14, ease: 'power1.in' }, at)
      .add(() => { stopSnd(); dropTl.pause(); gsap.to(dropsBox, { autoAlpha: 0, duration: 0.2 }); }, at)
      .to(bottle, { rotation: 0, rotationY: 50, scale: 0.8, duration: 0.55, ease: 'power2.inOut' }, at)
      .to(pour, { y: tipY - 40, x: '+=22', autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, at + 0.1)
      .fromTo(leads[1], { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'power2.out' }, at + 0.42)
      .fromTo(labs[2], { y: -12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' }, at + 0.5)
      .fromTo(note, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, at + 0.62);
    tl = t;
    const D = t.duration();
    // les gouttes suivent la bouteille et la surface du vin ; le temps fait avancer le versement, le défilement peut l'accélérer
    ticker = () => {
      gsap.set(dropsBox, { x: gsap.getProperty(pour, 'x'), y: barTop + barH * (1 - level) - 2 });
      const r = gsap.ticker.deltaRatio(60);
      const dt = r / 60;
      pushS += (push - pushS) * (1 - Math.pow(0.75, r));
      const want = Math.max(shown + dt / D, pushS > 0.985 ? 1 : pushS);
      shown = Math.min(1, shown + Math.min(want - shown, dt * cap / D));
      t.progress(shown);
      if (shown >= 1) { stopTicker(); stopSnd(); full = true; }
    };
    gsap.ticker.add(ticker);
  };
  // la jauge pleine ondule quand on la survole ou qu'on la touche
  segs.forEach((s, i) => s.addEventListener('pointerenter', () => {
    if (!full || gsap.isTweening(liq[i])) return;
    s.classList.add('is-filling');
    gsap.timeline({ onComplete: () => s.classList.remove('is-filling') })
      .to(liq[i], { yPercent: 12, duration: 0.24, ease: 'power2.out' })
      .to(liq[i], { yPercent: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)' });
  }));
  // une largeur d'écran qui change pendant le versement fausserait la position de la bouteille : on termine
  addEventListener('resize', () => { if (ticker && geo !== innerWidth) finish(); });
  bottle.addEventListener('error', () => { bottle.style.display = 'none'; }, { once: true });
  reset();
  return { restart: build, pause: reset, progress: finish, scroll: (v) => { push = v; }, hurry: () => { cap = 4; }, playing: () => !!ticker };
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

