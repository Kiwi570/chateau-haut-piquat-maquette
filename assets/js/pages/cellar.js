// Les vins : ouverture, tour de la cave, l'accord parfait, servir votre vin.
import { $, $$, L, eur, CALM, TOUCH, hdrH, padMasks, sparkAt, smooth, thudSound } from '../core.js?v=14';
import { WINES, CHATEAUX, FORMATS } from '../data.js?v=14';

const gsap = window.gsap; const ST = window.ScrollTrigger;
const ORDER = ['hp', 'lf', 'bl'];

export function setup() { fillChapters(); buildAccords(); initServe(); }
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
  const s = window.SplitText ? SplitText.create(t, { type: 'words', mask: 'words' }) : null;
  if (s) { padMasks(s, 'words'); gsap.from(s.words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.1, onComplete: () => s.revert() }); }
  gsap.from('.vhero__text .kicker, .vhero__text .lead, .vhero__text .hero__ctas > *', { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.35 });
  const plinths = $$('.vhero__plinth');
  gsap.from(plinths, { y: 80, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, delay: 0.25 });
  gsap.from('[data-vh-bottle]', { yPercent: 40, autoAlpha: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12, delay: 0.55 });
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
  tl.fromTo($$('[data-cv-seg]', ch), { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power2.inOut', stagger: 0.18 }, 0.1)
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
const liftY = (P) => { const b = P.bottle.getBoundingClientRect(); const r = P.c.getBoundingClientRect(); return -(b.bottom - r.top + 40); };
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
      let cur = -1; let xtl = null;
      P.forEach((p) => { gsap.set(p.bottle, { y: liftY(p) }); gsap.set(p.shadow, { autoAlpha: 0 }); gsap.set([...p.items, p.note], { autoAlpha: 0 }); gsap.set(p.words, { yPercent: 110 }); });
      // chaque chapitre forme sa propre couche : le décor qui s'ouvre passe bien au-dessus du précédent
      chs.forEach((c, k) => gsap.set(c, { zIndex: k + 1, isolation: 'isolate' }));
      gsap.set(chs.slice(1), { visibility: 'hidden' });
      const mark = (j) => dots.forEach((d, k) => { d.classList.toggle('is-on', k === j); const b = $('button', d); if (b) b.setAttribute('aria-current', k === j ? 'true' : 'false'); });
      // le socle reste en place ; la bouteille qui part est soulevée, le décor suivant s'ouvre en cercle, la nouvelle bouteille est posée
      const go = (j) => {
        if (j === cur) return; const i = cur; cur = j; mark(j);
        if (xtl) { xtl.progress(1); xtl.kill(); xtl = null; }
        if (i < 0) {
          chs.forEach((c, k) => gsap.set(c, { visibility: k === j ? 'visible' : 'hidden', clipPath: 'none' }));
          xtl = gsap.timeline().add(drop(P[j]), 0.1).add(panelIn(P[j], intros[j]), 0.35);
          return;
        }
        const A = P[i]; const B = P[j]; const fwd = j > i;
        chs.forEach((c, k) => { if (k !== i && k !== j) gsap.set(c, { visibility: 'hidden', clipPath: 'none' }); });
        gsap.set([A.c, B.c], { visibility: 'visible' });
        gsap.set(B.bottle, { y: liftY(B) }); gsap.set(B.shadow, { autoAlpha: 0 }); gsap.set(B.items, { autoAlpha: 0 }); gsap.set(B.words, { yPercent: 110 });
        const top = fwd ? B : A; const r = top.c.getBoundingClientRect(); const sr = top.socle.getBoundingClientRect();
        // en avançant, le décor s'ouvre depuis le socle ; en reculant, il se referme vers le texte pour dégager le socle d'abord
        const cx = fwd ? sr.left + sr.width / 2 - r.left : r.width; const cy = fwd ? sr.top + sr.height * 0.1 - r.top : r.height / 2;
        const R = Math.hypot(Math.max(cx, r.width - cx), Math.max(cy, r.height - cy)) + 30;
        const circ = (rad) => `circle(${rad}px at ${cx}px ${cy}px)`;
        xtl = gsap.timeline({ onComplete: () => { gsap.set(A.c, { visibility: 'hidden', clipPath: 'none' }); gsap.set(B.c, { clipPath: 'none' }); gsap.set(A.num, { clearProps: 'opacity,visibility,transform' }); } });
        xtl.to(A.words, { yPercent: -110, duration: 0.45, ease: 'power3.in', stagger: 0.03 }, 0)
          .to([...A.items, A.note], { y: -16, autoAlpha: 0, duration: 0.32, ease: 'power2.in', stagger: 0.02 }, 0)
          .to(A.bottle, { y: liftY(A), rotation: 3, duration: 0.62, ease: 'power3.in' }, 0)
          .to(A.shadow, { scale: 0.3, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 0)
          .to(A.num, { yPercent: -25, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 0)
          .fromTo(fwd ? B.c : A.c, { clipPath: circ(fwd ? 0 : R) }, { clipPath: circ(fwd ? R : 0), duration: 0.95, ease: 'power2.inOut' }, 0.32)
          .fromTo(B.num, { yPercent: 25, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' }, 0.7)
          .add(drop(B), 0.86)
          .add(panelIn(B, intros[j]), 0.95);
      };
      // un peu d'hystérésis : un léger retour en arrière près d'un seuil ne relance pas la transition
      const B1 = [0.34, 0.68];
      const pick = (p) => { const cand = p < B1[0] ? 0 : p < B1[1] ? 1 : 2; if (cur < 0) return cand; if (cand > cur && p < B1[cand - 1] + 0.015) return cur; if (cand < cur && p > B1[cand] - 0.015) return cur; return cand; };
      const st = ST.create({ trigger: frame, start: () => `top top+=${hdrH()}`, end: () => `+=${innerHeight * 2.4}`, pin: true, anticipatePin: 1, invalidateOnRefresh: true, onUpdate: (s) => go(pick(s.progress)) });
      // première bouteille posée dès que la section entre dans l'écran
      const first = ST.create({ trigger: frame, start: 'top 70%', once: true, onEnter: () => { if (cur < 0) go(0); } });
      const onGo = (e) => { const b = e.target.closest('[data-cave-go]'); if (!b) return; const k = +b.dataset.caveGo; smooth.to(st.start + (st.end - st.start) * [0.12, 0.51, 0.86][k]); };
      frame.addEventListener('click', onGo);
      return () => {
        frame.removeEventListener('click', onGo); first.kill(); if (xtl) xtl.kill();
        frame.classList.remove('is-pinned');
        gsap.set(chs, { clearProps: 'all' });
        P.forEach((p) => gsap.set([p.bottle, p.shadow, p.socle, p.num, ...p.items, p.note, ...p.words], { clearProps: 'opacity,visibility,transform' }));
        P.forEach((p) => { gsap.set([p.bottle, p.shadow, p.dust], { xPercent: -50 }); });
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
  box.innerHTML = hits.map(({ w, dishes }) => `<a class="acc-card" href="vin.html?id=${w.id}"><img src="${w.img.small}" alt="" width="${w.img.w}" height="${w.img.h}" loading="lazy"><span><b>${CHATEAUX[w.ch].name.replace('Haut-Piquat', '<span class="nw">Haut-Piquat</span>')} ${w.vintage}</b><i>${dishes.join(' · ')}</i><small>${L(FORMATS[w.fmt].label.fr, FORMATS[w.fmt].label.en)} · ${eur(w.price)}</small></span></a>`).join('');
  if (animate && !CALM) gsap.from($$('.acc-card', box), { y: 18, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.04 });
}

/* ---------- Servir votre vin : conseils du domaine ---------- */
const SERVE = {
  jeune: { hi: 18, temp: '16–18&nbsp;°C', ttext: L('Grands vins rouges&nbsp;: 16 à 18&nbsp;°C. Mieux vaut un vin un peu frais, que l\'on «&nbsp;chambre&nbsp;» dans le verre, qu\'un vin trop chaud.', 'Fine red wines: 16 to 18 °C. A slightly cool wine that warms in the glass is better than one served too warm.'), carafe: L('Carafer 1&nbsp;h avant', 'Decant 1 hr ahead'), ctext: L('Vins jeunes&nbsp;: carafer une heure avant pour aérer et arrondir les tannins.', 'Young wines: decant an hour ahead to aerate and soften the tannins.') },
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
