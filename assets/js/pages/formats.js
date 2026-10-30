// Château Haut-Piquat — grands formats : la bouteille choisie s'éclaire sur la photo de la gamme,
// un trait de niveau monte jusqu'à son épaule et l'équivalence en bouteilles de 75 cl se remplit.
// Utilisé sur Les vins (liens vers la boutique) et dans la Boutique (réglette qui filtre le catalogue).
import { $, $$, L, CALM } from '../core.js?v=19';

// repères mesurés sur la photo gamme-formats (720 × 687, affichée recadrée à 720 × 646 depuis le haut) :
// centre horizontal, haut et bas de chaque bouteille, demi-largeur, en % du cadre
const SHOT = {
  d37: { x: 7.4, top: 63.2, bot: 98.3, rx: 6, eq: 0.5 },
  b75: { x: 19.9, top: 48.5, bot: 98.5, rx: 7.5, eq: 1 },
  m150: { x: 36.9, top: 35, bot: 98.6, rx: 10, eq: 2 },
  dm300: { x: 57.6, top: 21.8, bot: 98.6, rx: 13, eq: 4 },
  i600: { x: 85.4, top: 0.6, bot: 98.6, rx: 17, eq: 8 },
};
const ORDER = ['d37', 'b75', 'm150', 'dm300', 'i600'];
const VOL = { d37: L('37,5 cl', '37.5 cl'), b75: '75 cl', m150: L('1,5 L', '1.5 L'), dm300: '3 L', i600: '6 L' };
const EQ = {
  d37: L('1 demi-bouteille = <b>½ bouteille</b> de 75 cl', '1 half bottle = <b>½ bottle</b> of 75 cl'),
  b75: L('1 bouteille = <b>75 cl</b>, la mesure de référence', '1 bottle = <b>75 cl</b>, the reference measure'),
  m150: L('1 magnum = <b>2 bouteilles</b> de 75 cl', '1 magnum = <b>2 bottles</b> of 75 cl'),
  dm300: L('1 double magnum = <b>4 bouteilles</b> de 75 cl', '1 double magnum = <b>4 bottles</b> of 75 cl'),
  i600: L('1 impériale = <b>8 bouteilles</b> de 75 cl', '1 impériale = <b>8 bottles</b> of 75 cl'),
};
const CHIP = {
  d37: L('37,5 cl · ½ bouteille', '37.5 cl · ½ bottle'), b75: L('75 cl · 1 bouteille', '75 cl · 1 bottle'),
  m150: L('1,5 L · 2 bouteilles', '1.5 L · 2 bottles'), dm300: L('3 L · 4 bouteilles', '3 L · 4 bottles'), i600: L('6 L · 8 bouteilles', '6 L · 8 bottles'),
};
const BOTTLE = 'M8 0h6v14c0 4 8 6 8 14v40a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V28c0-8 8-10 8-14z';
let uid = 0;

export function formatsMeter(root, { items, keyOf, rest = 'i600', onShow = () => {} }) {
  if (!root) return null;
  const img = $('img', root); if (!img) return null;
  const id = `fm${++uid}`;
  // scène : la photo, le voile qui éclaire une bouteille, le trait de niveau
  const stage = document.createElement('div'); stage.className = 'fstage';
  img.before(stage); stage.appendChild(img);
  stage.insertAdjacentHTML('beforeend', '<div class="fstage__spot" aria-hidden="true"></div><div class="fstage__line" aria-hidden="true"><span class="fstage__chip"></span></div>');
  const spot = $('.fstage__spot', stage); const line = $('.fstage__line', stage); const chip = $('.fstage__chip', stage);
  // équivalence : huit bouteilles de 75 cl qui se remplissent
  const meter = document.createElement('div'); meter.className = 'fmeter';
  meter.innerHTML = `<svg class="fmeter__row" viewBox="0 0 ${8 * 34 - 12} 72" aria-hidden="true"><defs><clipPath id="${id}-b"><path d="${BOTTLE}"/></clipPath></defs>${[...Array(8)].map((_, i) => `<g transform="translate(${i * 34} 0)"><path class="fmeter__out" d="${BOTTLE}"/><rect class="fmeter__wine" clip-path="url(#${id}-b)" x="0" y="71" width="22" height="0" data-fm="${i}"/></g>`).join('')}</svg><p class="fmeter__txt" aria-live="polite"></p>`;
  const ruler = items[0] && items[0].parentElement; (ruler || stage).after(meter);
  const txt = $('.fmeter__txt', meter);
  const fills = $$('[data-fm]', meter);

  const S = { x: 50, y: 60, rx: 60, ry: 80, a: 0, top: 99, lx: 40, lw: 20 };
  const paint = () => {
    spot.style.background = `radial-gradient(${S.rx}% ${S.ry}% at ${S.x}% ${S.y}%, rgba(20, 15, 10, 0) 0%, rgba(20, 15, 10, 0) 58%, rgba(20, 15, 10, ${S.a}) 100%)`;
    line.style.top = `${S.top}%`; line.style.left = `${S.lx}%`; line.style.width = `${S.lw}%`;
  };
  let cur = null;
  const show = (k, instant = false) => {
    const b = SHOT[k]; if (!b || k === cur) return; cur = k;
    items.forEach((el) => el.classList.toggle('is-shown', keyOf(el) === k));
    const lw = Math.min(b.rx * 2.6, 40); const lx = Math.max(1, Math.min(99 - lw, b.x - lw / 2));
    const to = { x: b.x, y: (b.top + b.bot) / 2, rx: b.rx * 1.55, ry: (b.bot - b.top) * 0.68 + 6, a: 0.6, top: b.top, lx, lw };
    chip.innerHTML = CHIP[k]; line.classList.toggle('is-left', b.x > 62);
    txt.innerHTML = EQ[k]; onShow(k);
    const lv = (i) => Math.max(0, Math.min(1, b.eq - i));
    if (instant || CALM || !window.gsap) {
      Object.assign(S, to); paint();
      fills.forEach((r, i) => { const h = 71 * lv(i); r.setAttribute('y', 71 - h); r.setAttribute('height', h); });
      return;
    }
    gsap.killTweensOf(S);
    // le voile se déplace, puis le trait de niveau remonte depuis le pied de la bouteille
    gsap.to(S, { x: to.x, y: to.y, rx: to.rx, ry: to.ry, a: to.a, lx: to.lx, lw: to.lw, duration: 0.55, ease: 'power3.out', onUpdate: paint });
    gsap.fromTo(S, { top: b.bot }, { top: to.top, duration: 0.9, ease: 'power2.out', delay: 0.12, onUpdate: paint, immediateRender: false });
    gsap.fromTo(chip, { autoAlpha: 0.35 }, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' });
    fills.forEach((r, i) => {
      const h = 71 * lv(i); const o = { h: +r.getAttribute('height') || 0 };
      gsap.killTweensOf(o);
      gsap.to(o, { h, duration: 0.45, delay: 0.1 + i * 0.07, ease: 'power2.inOut', onUpdate: () => { r.setAttribute('y', 71 - o.h); r.setAttribute('height', o.h); } });
    });
  };
  const restKey = () => (typeof rest === 'function' ? rest() : rest);
  items.forEach((el) => {
    el.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && (e.movementX || e.movementY)) show(keyOf(el)); });
    el.addEventListener('focus', () => show(keyOf(el)));
  });
  if (ruler) ruler.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && (e.movementX || e.movementY)) show(restKey()); });
  // état de départ lisible sans interaction ; à l'arrivée à l'écran, la gamme est parcourue une fois
  show(restKey(), true);
  if (!CALM && window.ScrollTrigger) {
    ScrollTrigger.create({ trigger: root, start: 'top 55%', once: true, onEnter: () => {
      cur = null; const seq = ORDER.concat(restKey() === 'i600' ? [] : [restKey()]);
      seq.forEach((k, i) => gsap.delayedCall(i * 0.6, () => show(k)));
    } });
  }
  return { show };
}
