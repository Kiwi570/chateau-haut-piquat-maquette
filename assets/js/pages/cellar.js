// Les vins : ouverture, tour de la cave, l'accord parfait, servir votre vin.
import { $, $$, L, eur, CALM, TOUCH, hdrH, padMasks, splitHold, sparkAt, smooth, thudSound, anticipate, pinType } from '../core.js?v=19';
import { WINES, CHATEAUX, FORMATS } from '../data.js?v=19';
import { formatsMeter } from './formats.js?v=19';

const gsap = window.gsap; const ST = window.ScrollTrigger;
const ORDER = ['hp', 'lf', 'bl'];

export function setup() {
  fillChapters(); buildAccords(); initServe();
  // grands formats : la bouteille survolée s'éclaire, le niveau monte, l'équivalence se remplit
  const links = $$('.vformats__links a');
  formatsMeter($('.vformats .formats__img'), { items: links, keyOf: (a) => new URL(a.href, location.href).searchParams.get('format'), rest: 'i600' });
}
export function enter() {
  if (CALM) return;
  heroIn();
  cave();
  ST.create({ trigger: '[data-serve]', start: 'top 85%', once: true, onEnter: () => setServe(currentAge, true) });
}

/* ---------- Fiches des trois châteaux, complétées depuis les données de la boutique ---------- */
function excerpt(t) {
  const parts = t.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/); let out = '';
  for (const p of parts) { if (out && (out + ' ' + p).length > 200) break; out += (out ? ' ' : '') + p; }
  return out;
}
function fillChapters() {
  ORDER.forEach((k) => {
    const list = WINES.filter((w) => w.ch === k);
    const vint = [...new Set(list.map((w) => w.vintage))].sort();
    const b75 = list.filter((w) => w.fmt === 'b75'); const min = Math.min(...(b75.length ? b75 : list).map((w) => w.price));
    const offer = $(`[data-cave-offer="${k}"]`);
    if (offer) offer.innerHTML = L(`${vint.length} millésimes en vente, de ${vint[0]} à ${vint[vint.length - 1]} · à partir de ${eur(min)} la caisse de 6`, `${vint.length} vintages for sale, ${vint[0]} to ${vint[vint.length - 1]} · from ${eur(min)} per case of 6`);
    const btn = $(`[data-cave-vintages="${k}"]`); if (btn) btn.innerHTML = L(`Voir les ${vint.length} millésimes`, `See the ${vint.length} vintages`);
  });
  $$('[data-cave-note]').forEach((fig) => {
    const w = WINES.find((x) => x.id === fig.dataset.caveNote); if (!w || !w.note) return;
    fig.innerHTML = `<blockquote>«&nbsp;${excerpt(w.note)}&nbsp;»</blockquote><figcaption>${w.noteSrc || 'Château Haut-Piquat'} · ${w.vintage}<span lang="en"> · original note in French</span></figcaption>`;
    const a = $(`[data-cave-sheet="${w.id}"]`); if (a) a.innerHTML = L(`Fiche du millésime ${w.vintage}`, `${w.vintage} vintage sheet`);
  });
}

/* ---------- Ouverture ---------- */
function heroIn() {
  const t = $('[data-hero-title]');
  const s = splitHold(t, 'words');
  if (s) gsap.from(s.words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.1, onComplete: s.done });
  gsap.from('.vhero__text .kicker, .vhero__text .lead, .vhero__text .hero__ctas > *', { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.35 });
  const plinths = $$('.vhero__plinth');
  gsap.from(plinths, { y: 80, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, delay: 0.25 });
  gsap.from('[data-vh-bottle]', { yPercent: 40, duration: 1.3, ease: 'expo.out', stagger: 0.12, delay: 0.55 }); gsap.from('[data-vh-bottle]', { autoAlpha: 0, duration: 0.3, stagger: 0.12, delay: 0.55 });
  if (!TOUCH) {
    const trio = $('.vhero__trio'); const rx = gsap.quickTo(trio, 'rotationY', { duration: 1, ease: 'power3' });
    gsap.set(trio, { transformPerspective: 1400 });
    $('[data-vhero]').addEventListener('pointermove', (e) => rx(((e.clientX / innerWidth) - 0.5) * 10));
  }
  gsap.to('.vhero__trio', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '[data-vhero]', start: 'top top', end: 'bottom top', scrub: true } });
}

/* ---------- Le tour de la cave ---------- */
function intro(ch) {
  const tl = gsap.timeline({ paused: true });
  // la jauge d'assemblage se remplit d'un seul trait, cépage après cépage, sans trou entre deux segments
  const segs = $$('[data-cv-seg]', ch); const w = (s) => parseFloat(s.style.flexGrow) || 1; const tot = segs.reduce((a, s) => a + w(s), 0) || 1;
  const fill = gsap.timeline({ paused: true });
  segs.forEach((s) => fill.fromTo(s, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: w(s) / tot, ease: 'none' }));
  tl.fromTo(fill, { progress: 0 }, { progress: 1, duration: 1.1, ease: 'power2.inOut' }, 0.1)
    .fromTo($$('.medal', ch), { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out', stagger: 0.08 }, 0.3)
    .fromTo($$('.medal circle', ch), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.out', stagger: 0.06 }, 0.35)
    .fromTo($('.cave__note', ch), { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' }, 0.5);
  return tl;
}
/* Mise en scène d'une bouteille : ombre de contact et poussière de calcaire ajoutées au socle */
function stageFx(c) {
  const stage = $('[data-cave-stage]', c); const bottle = $('[data-cave-bottle]', c);
  const shadow = document.createElement('span'); shadow.className = 'cave__shadow'; shadow.setAttribute('aria-hidden', 'true');
  const dust = document.createElement('span'); dust.className = 'cave__dust'; dust.setAttribute('aria-hidden', 'true');
  dust.innerHTML = '<i></i>'.repeat(18);
  stage.insertBefore(shadow, bottle); stage.appendChild(dust);
  gsap.set(bottle, { xPercent: -50 }); gsap.set([shadow, dust], { xPercent: -50 });
  const name = $('.cave__name', c);
  const split = window.SplitText ? SplitText.create(name, { type: 'words', mask: 'words' }) : null;
  if (split) padMasks(split, 'words');
  const panel = $('[data-cave-panel]', c);
  const items = [...panel.children].filter((el) => !el.matches('.cave__note, .cave__name'));
  return { c, stage, bottle, shadow, dust, socle: $('.socle', c), num: $('.cave__num', c), words: split ? split.words : [name], items, note: $('.cave__note', c) };
}
// hauteur à laquelle la bouteille sort du cadre par le haut
const liftY = (P) => -(P.stage.offsetTop + P.bottle.offsetTop + P.bottle.offsetHeight + 40);
function puff(P) {
  $$('i', P.dust).forEach((d, k) => {
    const side = k % 2 ? 1 : -1; const far = 36 + Math.random() * 110;
    gsap.fromTo(d, { x: side * (6 + Math.random() * 14), y: 2, scale: 0.25 + Math.random() * 0.3, autoAlpha: 0.95 },
      { x: side * far, y: -(4 + Math.random() * 40), scale: 1.8 + Math.random() * 1.8, autoAlpha: 0, duration: 1 + Math.random() * 0.8, ease: 'power2.out', overwrite: true });
  });
}
// la bouteille descend et se pose sur le socle : ombre qui se forme, petit choc, poussière
function drop(P) {
  const tl = gsap.timeline();
  tl.fromTo(P.bottle, { y: liftY(P), rotation: -4, scaleX: 1, scaleY: 1, autoAlpha: 1 }, { y: -6, rotation: 0, duration: 0.62, ease: 'power2.out' }, 0)
    .to(P.bottle, { y: 0, duration: 0.16, ease: 'power1.in' }, 0.62)
    .fromTo(P.shadow, { scale: 0.25, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.78, ease: 'power2.in' }, 0)
    .add(() => { puff(P); thudSound(); }, 0.76)
    .to(P.bottle, { scaleY: 0.982, scaleX: 1.014, duration: 0.07, ease: 'power1.out' }, 0.78)
    .to(P.bottle, { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' }, 0.85)
    .to(P.socle, { y: 3, duration: 0.06, ease: 'power1.out' }, 0.78)
    .to(P.socle, { y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, 0.84);
  return tl;
}
function panelIn(P, intro) {
  const tl = gsap.timeline();
  tl.fromTo(P.words, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 0)
    .fromTo(P.items, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', stagger: 0.05 }, 0.1)
    .add(() => intro.restart(), 0.15);
  return tl;
}
function cave() {
  const frame = $('[data-cave-frame]'); const chs = $$('[data-cave-chapter]'); const dots = $$('[data-cave-dot]');
  const intros = chs.map(intro);
  const P = chs.map(stageFx);
  ST.matchMedia({
    '(min-width: 900px) and (min-height: 700px)': () => {
      frame.classList.add('is-pinned');
      // chaque chapitre forme sa propre couche : le décor qui s'ouvre passe bien au-dessus du précédent
      chs.forEach((c, k) => gsap.set(c, { zIndex: k + 1, isolation: 'isolate' }));
      const N = chs.length;
      // découpage du défilement épinglé : un temps de pose par vin, un passage entre deux vins
      const REST = 0.16; const PASS = (1 - REST * N) / (N - 1);
      const zone = (k) => REST * (k + 1) + PASS * k; // début du passage du vin k au vin k + 1
      const rests = chs.map((_, k) => [k ? zone(k - 1) + PASS : 0, zone(k)]);
      const center = (P) => { const x = P.stage.offsetLeft + P.socle.offsetLeft + P.socle.offsetWidth / 2; const y = P.stage.offsetTop + P.socle.offsetTop + P.socle.offsetHeight * 0.1; const w = P.c.offsetWidth; const h = P.c.offsetHeight; return [x, y, Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 30]; };
      const circ = (P, full) => { const [x, y, R] = center(P); return `circle(${full ? R : 0}px at ${x}px ${y}px)`; };
      // le passage suit exactement le défilement (les états de départ sont posés par les vins qui arrivent) ; seuls la pose (poussière, choc, son) et l'animation du texte de détail sont déclenchées
      const tl = gsap.timeline({ defaults: { ease: 'none' } });
      for (let k = 0; k < N - 1; k++) {
        const A = P[k]; const B = P[k + 1]; const at = zone(k); const d = PASS;
        tl.fromTo(A.words, { yPercent: 0 }, { yPercent: -110, duration: d * 0.22, ease: 'power2.in', stagger: d * 0.02, immediateRender: false }, at)
          .fromTo([...A.items, A.note], { y: 0, autoAlpha: 1 }, { y: -16, autoAlpha: 0, duration: d * 0.2, ease: 'power1.in', stagger: d * 0.012, immediateRender: false }, at)
          .fromTo(A.bottle, { y: 0, rotation: 0 }, { y: () => liftY(A), rotation: 3, duration: d * 0.38, ease: 'power2.in', immediateRender: false }, at)
          .fromTo(A.shadow, { scale: 1, autoAlpha: 1 }, { scale: 0.3, autoAlpha: 0, duration: d * 0.25, ease: 'power1.in', immediateRender: false }, at)
          .fromTo(A.num, { yPercent: 0, autoAlpha: 1 }, { yPercent: -25, autoAlpha: 0, duration: d * 0.3, immediateRender: false }, at)
          .fromTo(B.c, { clipPath: () => circ(B, false) }, { clipPath: () => circ(B, true), duration: d * 0.55, ease: 'power2.inOut' }, at + d * 0.16)
          .fromTo(B.num, { yPercent: 25, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: d * 0.3, ease: 'power2.out' }, at + d * 0.45)
          .fromTo(B.bottle, { y: () => liftY(B), rotation: -4 }, { y: 0, rotation: 0, duration: d * 0.5, ease: 'power1.out' }, at + d * 0.5)
          .fromTo(B.shadow, { scale: 0.25, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: d * 0.5, ease: 'power2.in' }, at + d * 0.5)
          .fromTo(B.words, { yPercent: 110 }, { yPercent: 0, duration: d * 0.3, ease: 'power2.out', stagger: d * 0.025 }, at + d * 0.58)
          .fromTo(B.items, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: d * 0.3, ease: 'power2.out', stagger: d * 0.015 }, at + d * 0.62);
      }
      tl.to({}, { duration: 0.001 }, 0.999);
      // la pose : poussière, petit choc, son, puis jauge, médailles et avis
      const land = (k) => { const p = P[k]; puff(p); thudSound(); gsap.timeline().to(p.bottle, { scaleY: 0.982, scaleX: 1.014, duration: 0.07, ease: 'power1.out' }).to(p.bottle, { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' }); gsap.timeline().to(p.socle, { y: 3, duration: 0.06 }).to(p.socle, { y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }); intros[k].restart(); };
      const local = (k, pr) => gsap.utils.clamp(0, 1, (pr - zone(k)) / PASS);
      const prev = chs.slice(1).map(() => 0); let active = -1; let lastRest = 0;
      const mark = (j) => { if (j === active) return; active = j; dots.forEach((dd, k) => { dd.classList.toggle('is-on', k === j); const b = $('button', dd); if (b) b.setAttribute('aria-current', k === j ? 'true' : 'false'); }); chs.forEach((c, k) => { c.inert = k !== j; }); };
      tl.eventCallback('onUpdate', () => {
        const pr = tl.progress();
        for (let k = 0; k < N - 1; k++) {
          const l = local(k, pr);
          // la pose se déclenche au contact réel de la bouteille avec le socle
          if (prev[k] < 0.97 && l >= 0.97) land(k + 1);
          else if (prev[k] > 0.02 && l <= 0.02) land(k);
          prev[k] = l;
        }
        mark(rests.findIndex(([, b], k) => k === N - 1 || pr < b + PASS / 2));
      });
      const trackRest = (s) => { const r = rests.findIndex(([a, b]) => s.progress >= a && s.progress <= b); if (r >= 0) lastRest = r; };
      // un vin s'aimante quand on s'arrête au milieu d'un passage : jamais de bouteille suspendue en l'air
      // le sens vient du dernier geste du visiteur (molette, doigt, clavier), sinon du dernier vin où il s'est arrêté
      let userDir = 0;
      const onWheel = (e) => { if (e.deltaY) userDir = Math.sign(e.deltaY); };
      let ty = 0; const onTouchStart = (e) => { ty = e.touches[0].clientY; }; const onTouchMove = (e) => { const y = e.touches[0].clientY; if (Math.abs(y - ty) > 4) { userDir = y < ty ? 1 : -1; ty = y; } };
      const onKey = (e) => { if (['ArrowDown', 'PageDown', ' ', 'End'].includes(e.key)) userDir = 1; else if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) userDir = -1; };
      addEventListener('wheel', onWheel, { passive: true }); addEventListener('touchstart', onTouchStart, { passive: true }); addEventListener('touchmove', onTouchMove, { passive: true }); addEventListener('keydown', onKey);
      const snapTo = (v) => {
        if (rests.some(([a, b]) => v >= a && v <= b)) return v;
        const k = rests.findIndex(([, b]) => v < b + PASS); const a = rests[k][1]; const b = rests[k + 1][0]; const l = (v - a) / PASS;
        const fwd = userDir > 0 ? l > 0.2 : userDir < 0 ? l > 0.8 : lastRest <= k ? l > 0.2 : l > 0.8;
        return fwd ? b + 0.005 : a - 0.005;
      };
      const st = ST.create({ trigger: frame, start: () => `top top+=${hdrH()}`, end: () => `+=${innerHeight * 3}`, pin: true, anticipatePin: anticipate(), pinType: pinType(), invalidateOnRefresh: true, scrub: 0.5, animation: tl, onUpdate: trackRest });
      // aimantation faite avec le défilement fluide du site (une aimantation ScrollTrigger se battrait avec lui)
      let idle = 0;
      const settle = () => { if (!st.isActive) return; const pr = st.progress; const to = snapTo(pr); if (Math.abs(to - pr) > 0.002) smooth.to(st.start + (st.end - st.start) * to); };
      const onScroll = () => { clearTimeout(idle); idle = setTimeout(() => { if (smooth.raf) onScroll(); else settle(); }, 220); };
      addEventListener('scroll', onScroll, { passive: true });
      // le premier vin : la bouteille descend sur le socle à mesure que la section arrive, son texte entre avec elle
      const A0 = P[0];
      const entry = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: frame, start: 'top 85%', end: () => `top top+=${hdrH()}`, scrub: 0.5, invalidateOnRefresh: true } });
      // détection sur l'animation elle-même (et non sur le défilement, qu'elle suit avec un léger retard)
      entry.eventCallback('onUpdate', () => {
        const e = entry.progress(); if (e >= 0.97 && !A0.landed) { A0.landed = true; land(0); } else if (e < 0.9) A0.landed = false;
        if (tl.progress() > 0) syncFirst();
      });
      // si la page s'ouvre (ou se redimensionne) au milieu des trois vins, le passage reprend la main sur le premier vin
      function syncFirst() { if (st.progress > 0.0005) { const pr = tl.progress(); tl.progress(0, true).progress(pr, true); } }
      ST.addEventListener('refresh', syncFirst); requestAnimationFrame(syncFirst);
      entry.fromTo(A0.bottle, { y: () => liftY(A0), rotation: -4 }, { y: 0, rotation: 0, duration: 0.75, ease: 'power1.out' }, 0.25)
        .fromTo(A0.shadow, { scale: 0.25, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.75, ease: 'power2.in' }, 0.25)
        .fromTo(A0.words, { yPercent: 110 }, { yPercent: 0, duration: 0.35, ease: 'power2.out', stagger: 0.04 }, 0.2)
        .fromTo(A0.items, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out', stagger: 0.025 }, 0.3);
      gsap.set(P.slice(1).map((p) => p.note), { autoAlpha: 0 });
      mark(0);
      const onGo = (e) => { const b = e.target.closest('[data-cave-go]'); if (!b) return; const k = +b.dataset.caveGo; const [a, bb] = rests[k]; smooth.to(st.start + (st.end - st.start) * (k === 0 ? a + 0.02 : k === N - 1 ? bb - 0.02 : (a + bb) / 2)); };
      frame.addEventListener('click', onGo);
      return () => {
        frame.removeEventListener('click', onGo); removeEventListener('scroll', onScroll); removeEventListener('wheel', onWheel); removeEventListener('touchstart', onTouchStart); removeEventListener('touchmove', onTouchMove); removeEventListener('keydown', onKey); ST.removeEventListener('refresh', syncFirst); clearTimeout(idle); entry.scrollTrigger && entry.scrollTrigger.kill(); entry.kill();
        frame.classList.remove('is-pinned'); chs.forEach((c) => { c.inert = false; });
        gsap.set(chs, { clearProps: 'all' });
        P.forEach((p) => { gsap.set([p.bottle, p.shadow, p.socle, p.num, ...p.items, p.note, ...p.words], { clearProps: 'opacity,visibility,transform' }); gsap.set([p.bottle, p.shadow, p.dust], { xPercent: -50 }); p.landed = false; });
      };
    },
    '(max-width: 899px), (max-height: 699px)': () => {
      P.forEach((p, i) => {
        gsap.set(p.bottle, { y: liftY(p) }); gsap.set(p.shadow, { autoAlpha: 0 });
        ST.create({ trigger: p.c, start: 'top 72%', once: true, onEnter: () => { drop(p); intros[i].restart(); } });
      });
      return () => P.forEach((p) => gsap.set([p.bottle, p.shadow, p.socle], { clearProps: 'opacity,visibility,transform' }));
    },
  });
}

/* ---------- L'accord parfait : les plats cités sur les fiches du domaine ---------- */
const CATS = [
  ['boeuf', L('Bœuf', 'Beef'), /bœuf|boeuf|entrec[ôo]te|tournedos/i],
  ['canard', L('Canard', 'Duck'), /canard|canette|magret/i],
  ['agneau', L('Agneau et chevreau', 'Lamb and kid'), /agneau|chevreau/i],
  ['volaille', L('Volailles', 'Poultry'), /poulet|poularde|pintade|dinde|chapon|caille/i],
  ['gibier', L('Gibier', 'Game'), /faisan|bécasse|chevreuil|palombe|lièvre/i],
  ['veau', L('Veau', 'Veal'), /veau/i],
  ['fromage', L('Fromages', 'Cheese'), /reblochon|brie|camembert|iraty|marcellin|brillat|gouda|tête de moine/i],
  ['terroir', L('Cèpes et terroir', 'Ceps and local fare'), /./],
];
const catOf = (dish) => CATS.find(([, , re]) => re.test(dish))[0];
// format dans le titre quand ce n'est pas la caisse de 75 cl (deux fiches 2019 : demi-bouteilles et magnums)
const FMT_NAME = { d37: L('demi-bouteilles', 'half bottles'), m150: L('magnums', 'magnums'), dm300: L('double magnum', 'double magnum'), i600: L('impériale', 'impériale') };
let accCat = 'canard';
function buildAccords() {
  const chips = $('[data-acc-chips]'); if (!chips) return;
  const counts = Object.fromEntries(CATS.map(([k]) => [k, 0]));
  WINES.forEach((w) => { const seen = new Set((w.pairs || []).map(catOf)); seen.forEach((k) => counts[k]++); });
  chips.innerHTML = CATS.filter(([k]) => counts[k]).map(([k, label]) => `<button class="chip acc-chip" type="button" data-acc="${k}" aria-pressed="${k === accCat}">${label} <span class="muted">${counts[k]}</span></button>`).join('');
  chips.addEventListener('click', (e) => { const b = e.target.closest('[data-acc]'); if (!b) return; accCat = b.dataset.acc; renderAccords(true); if (!CALM) sparkAt(b); });
  renderAccords(false);
}
function renderAccords(animate) {
  $$('[data-acc]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.acc === accCat ? 'true' : 'false'));
  const hits = WINES.map((w) => ({ w, dishes: (w.pairs || []).filter((p) => catOf(p) === accCat) })).filter((x) => x.dishes.length)
    .sort((a, b) => ORDER.indexOf(a.w.ch) - ORDER.indexOf(b.w.ch) || a.w.vintage - b.w.vintage);
  const lit = new Set(hits.map((x) => x.w.ch));
  $$('[data-acc-ch]').forEach((el) => {
    const on = lit.has(el.dataset.accCh); const was = el.classList.contains('is-lit');
    const n = hits.filter((x) => x.w.ch === el.dataset.accCh).length;
    let em = $('em', el); if (!em) { em = document.createElement('em'); el.appendChild(em); }
    em.innerHTML = n ? L(`${n} fiche${n > 1 ? 's' : ''}`, `${n} sheet${n > 1 ? 's' : ''}`) : '—';
    el.classList.toggle('is-lit', on);
    if (animate && on && !was && !CALM) gsap.fromTo(el, { y: 8 }, { y: 0, duration: 0.7, ease: 'elastic.out(1, .45)' });
  });
  const box = $('[data-acc-results]');
  box.innerHTML = hits.map(({ w, dishes }) => `<a class="acc-card" href="vin.html?id=${w.id}"><img src="${w.img.small}" alt="" width="${w.img.w}" height="${w.img.h}" loading="lazy"><span><b>${CHATEAUX[w.ch].name.replace('Haut-Piquat', '<span class="nw">Haut-Piquat</span>')} ${w.vintage}${FMT_NAME[w.fmt] ? ` <span class="acc-fmt">· ${FMT_NAME[w.fmt]}</span>` : ''}</b><i>${dishes.join(' · ')}</i><small>${L(FORMATS[w.fmt].label.fr, FORMATS[w.fmt].label.en)} · ${eur(w.price)}</small></span></a>`).join('');
  if (animate && !CALM) gsap.from($$('.acc-card', box), { y: 18, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.04 });
}

/* ---------- Servir votre vin : conseils du domaine ---------- */
const SERVE = {
  jeune: { hi: 18, temp: '16–18&nbsp;°C', ttext: L('Grands vins rouges&nbsp;: 16 à 18&nbsp;°C. Mieux vaut un vin un peu frais, que l\'on «&nbsp;chambre&nbsp;» dans le verre, qu\'un vin trop chaud.', 'Fine red wines: 16 to 18 °C. A slightly cool wine that warms in the glass is better than one served too warm.'), carafe: L('Carafer 1&nbsp;h avant', 'Decant 1 hr ahead'), ctext: L('Vins jeunes&nbsp;: carafer une heure avant pour aérer et arrondir les tanins.', 'Young wines: decant an hour ahead to aerate and soften the tannins.') },
  vieux: { hi: 20, temp: '18–20&nbsp;°C', ttext: L('Vins rouges vieux&nbsp;: 18 à 20&nbsp;°C. Mieux vaut un vin un peu frais, que l\'on «&nbsp;chambre&nbsp;» dans le verre, qu\'un vin trop chaud.', 'Older reds: 18 to 20 °C. A slightly cool wine that warms in the glass is better than one served too warm.'), carafe: L('Décanter au service', 'Decant when serving'), ctext: L('Vins vieux&nbsp;: décanter juste avant de servir, très délicatement, pour séparer le dépôt.', 'Older wines: decant very gently just before serving to leave the sediment behind.') },
};
let currentAge = 'jeune'; let bubbles = null;
const yOf = (t) => 190 - (t - 8) * 12;
function setServe(age, animate) {
  currentAge = age; const s = SERVE[age];
  $$('[data-age]').forEach((b) => b.setAttribute('aria-checked', b.dataset.age === age ? 'true' : 'false'));
  $('[data-serve-temp]').innerHTML = s.temp; $('[data-serve-ttext]').innerHTML = s.ttext;
  $('[data-serve-carafe]').innerHTML = s.carafe; $('[data-serve-ctext]').innerHTML = s.ctext;
  const merc = $('[data-mercury]'); const y = yOf(s.hi); const lees = $('[data-carafe-lees]'); const air = $('[data-carafe-air]');
  if (!animate || CALM || !gsap) {
    merc.setAttribute('y', y); merc.setAttribute('height', 206 - y);
    lees.style.opacity = age === 'vieux' ? 1 : 0; air.style.opacity = age === 'jeune' ? 1 : 0;
    return;
  }
  gsap.to(merc, { attr: { y, height: 206 - y }, duration: 1.2, ease: 'elastic.out(1, .55)' });
  gsap.to(lees, { opacity: age === 'vieux' ? 1 : 0, duration: 0.6 });
  gsap.to(air, { opacity: age === 'jeune' ? 1 : 0, duration: 0.4 });
  gsap.fromTo('[data-carafe-wine]', { attr: { y: 132 } }, { attr: { y: 120 }, duration: 1, ease: 'elastic.out(1, .4)' });
  if (!bubbles) bubbles = gsap.to($$('circle', air), { y: -40, autoAlpha: 0, duration: 2.2, ease: 'sine.in', stagger: { each: 0.5, repeat: -1 } });
}
function initServe() {
  const box = $('[data-serve]'); if (!box) return;
  const merc = $('[data-mercury]'); merc.setAttribute('y', 190); merc.setAttribute('height', 16);
  if (CALM) setServe('jeune', false); else { $('[data-serve-temp]').innerHTML = SERVE.jeune.temp; $('[data-serve-ttext]').innerHTML = SERVE.jeune.ttext; $('[data-serve-carafe]').innerHTML = SERVE.jeune.carafe; $('[data-serve-ctext]').innerHTML = SERVE.jeune.ctext; }
  box.addEventListener('click', (e) => { const b = e.target.closest('[data-age]'); if (b) setServe(b.dataset.age, true); });
}
