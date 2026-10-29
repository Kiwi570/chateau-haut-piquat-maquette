// Les vins : ouverture, tour de la cave, l'accord parfait, servir votre vin.
import { $, $$, L, eur, CALM, TOUCH, hdrH, padMasks, sparkAt } from '../core.js?v=12';
import { WINES, CHATEAUX, FORMATS } from '../data.js?v=12';

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
function cave() {
  const frame = $('[data-cave-frame]'); const chs = $$('[data-cave-chapter]'); const dots = $$('[data-cave-dot]');
  const intros = chs.map(intro);
  ST.matchMedia({
    '(min-width: 900px) and (min-height: 700px)': () => {
      frame.classList.add('is-pinned');
      gsap.set(chs.slice(1), { autoAlpha: 0 });
      let active = -1;
      const setActive = (i) => {
        if (i === active) return; active = i;
        dots.forEach((d, j) => d.classList.toggle('is-on', j === i));
        intros[i].restart();
      };
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: {
        trigger: frame, start: () => `top top+=${hdrH()}`, end: () => `+=${innerHeight * 2.4}`, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
        onEnter: () => setActive(0), onEnterBack: () => {},
        onUpdate: (s) => setActive(s.progress < 0.36 ? 0 : s.progress < 0.7 ? 1 : 2),
      } });
      [0.28, 0.62].forEach((at, i) => {
        const a = chs[i]; const b = chs[i + 1];
        tl.to($('[data-cave-bottle]', a), { rotationY: -70, xPercent: -110, autoAlpha: 0, duration: 0.1 }, at)
          .to($('[data-cave-panel]', a), { y: -40, autoAlpha: 0, duration: 0.08 }, at)
          .to(a, { autoAlpha: 0, duration: 0.1 }, at + 0.02)
          .fromTo(b, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, at + 0.02)
          .fromTo($('[data-cave-bottle]', b), { rotationY: 70, xPercent: 10, autoAlpha: 0 }, { rotationY: 0, xPercent: -50, autoAlpha: 1, duration: 0.12, ease: 'power3.out' }, at + 0.05)
          .fromTo($('[data-cave-panel]', b), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1 }, at + 0.07);
      });
      tl.to({}, { duration: 0.01 }, 0.99);
      return () => { frame.classList.remove('is-pinned'); gsap.set(chs, { clearProps: 'all' }); chs.forEach((c) => gsap.set([$('[data-cave-bottle]', c), $('[data-cave-panel]', c)], { clearProps: 'opacity,visibility,transform' })); };
    },
    '(max-width: 899px), (max-height: 699px)': () => {
      chs.forEach((c, i) => {
        ST.create({ trigger: c, start: 'top 75%', once: true, onEnter: () => intros[i].restart() });
        gsap.from($('[data-cave-bottle]', c), { yPercent: 25, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 80%', once: true } });
      });
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
