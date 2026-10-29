// Panier simulé : tiroir toujours accessible, frais de port et minimum de commande du domaine.
import { $, $$, L, eur, store, toast, smooth, CALM, TOUCH, hideToast, sparkAt } from './core.js?v=8';
import { WINES, CHATEAUX, FORMATS } from './data.js?v=8';

const KEY = 'ahp-cart';
const FREE = 350, SHIP = 35, MIN = 105;
let lines = [];
try { lines = JSON.parse(store.get(KEY) || '[]').filter((l) => WINES.some((w) => w.id === l.id)); } catch (e) { lines = []; }
const save = () => store.set(KEY, JSON.stringify(lines));
export const wineById = (id) => WINES.find((w) => w.id === id);
export const wineName = (w) => `${CHATEAUX[w.ch].name} ${w.vintage}`;

function totals() {
  let sub = 0;
  lines.forEach((l) => { const w = wineById(l.id); const f = FORMATS[w.fmt]; sub += l.qty * (w.price + (l.wood && f.wood ? f.wood : 0)); });
  const ship = sub === 0 ? 0 : sub >= FREE ? 0 : SHIP;
  return { sub, ship, total: sub + ship, count: lines.reduce((a, l) => a + l.qty, 0) };
}

function renderCount() {
  const { count } = totals();
  $$('[data-cart-count]').forEach((c) => { c.textContent = count ? String(count) : ''; });
}

function render() {
  const body = $('[data-cart-body]'); const foot = $('[data-cart-foot]'); if (!body) return;
  renderCount();
  if (!lines.length) {
    body.innerHTML = `<div class="cart__empty"><svg class="ast" aria-hidden="true"><use href="#ast"/></svg><p>${L('Votre panier est vide.', 'Your cart is empty.')}</p><a class="btn btn--sm" href="boutique.html">${L('Voir la boutique', 'Visit the shop')}</a></div>`;
    foot.innerHTML = `<p class="form-note">${L('Port offert dès 350&nbsp;€ en France métropolitaine.', 'Free delivery from €350 in mainland France.')}</p>`;
    lastRatio = 0;
    return;
  }
  body.innerHTML = lines.map((l, i) => {
    const w = wineById(l.id); const f = FORMATS[w.fmt];
    const unit = w.price + (l.wood && f.wood ? f.wood : 0);
    const wood = f.wood ? `<label><input type="checkbox" data-wood="${i}" ${l.wood ? 'checked' : ''}><span>${L('En caisse bois', 'In a wooden case')} <span style="white-space:nowrap">+${eur(f.wood)}</span></span></label>` : '';
    return `<div class="cline"><img src="${w.img.small}" alt="" width="64" height="84" loading="lazy">
      <div><h3>${wineName(w)}</h3><p class="sub">${L(f.label.fr, f.label.en)}</p>
      <div class="qty" role="group" aria-label="Quantité"><button type="button" data-dec="${i}" aria-label="Retirer une caisse">−</button><span>${l.qty}</span><button type="button" data-inc="${i}" aria-label="Ajouter une caisse">+</button></div>
      ${wood}<button class="rm" type="button" data-rm="${i}">${L('Retirer', 'Remove')}</button></div>
      <p class="price">${eur(unit * l.qty)}</p></div>`;
  }).join('');
  const t = totals();
  const left = Math.max(0, FREE - t.sub);
  const minOk = t.sub >= MIN;
  foot.innerHTML = `
    ${caseMeter(lastRatio)}
    <p class="small" style="margin:0">${left > 0 ? L(`Plus que <b>${eur(left)}</b> pour le port offert.`, `Only <b>${eur(left)}</b> more for free delivery.`) : L('<b>Port offert</b> en France métropolitaine.', '<b>Free delivery</b> in mainland France.')}</p>
    <div class="cart__rows"><div><span>${L('Sous-total', 'Subtotal')}</span><span>${eur(t.sub)}</span></div><div><span>${L('Livraison (France métropolitaine)', 'Delivery (mainland France)')}</span><span>${t.ship ? eur(t.ship) : L('Offerte', 'Free')}</span></div><div class="total"><span>${L('Total TTC', 'Total incl. VAT')}</span><span>${eur(t.total)}</span></div></div>
    <p class="cart__msg" role="status">${minOk ? '' : L(`Commande minimum de ${eur(MIN)} hors port.`, `Minimum order ${eur(MIN)} excluding delivery.`)}</p>
    <button class="btn" type="button" data-checkout ${minOk ? '' : 'disabled'}>${L('Commander', 'Checkout')}</button>
    <div class="checkout" data-checkout-step>
      <label class="check"><input type="checkbox" data-c-age required> <span>${L('Je certifie avoir 18 ans ou plus.', 'I certify that I am 18 or older.')}</span></label>
      <label class="check"><input type="checkbox" data-c-cgv required> <span>${L('J\'ai pris connaissance des <a class="link" href="informations.html#cgv">conditions générales de vente</a> et je les accepte.', 'I have read and accept the <a class="link" href="informations.html#cgv">terms of sale</a>.')}</span></label>
      <fieldset class="paychips" role="radiogroup"><legend>${L('Moyen de paiement', 'Payment method')}</legend>${[['visa', 'Visa', 'Visa'], ['mc', 'Mastercard', 'Mastercard'], ['paypal', 'PayPal', 'PayPal'], ['cheque', 'Chèque', 'Cheque'], ['virement', 'Virement', 'Transfer']].map(([v, f, e]) => `<label><input type="radio" name="pay" value="${v}" data-c-pay>${L(f, e)}</label>`).join('')}</fieldset>
      <p class="checkout__help" data-c-help>${L('Cochez les deux cases et choisissez un moyen de paiement pour continuer.', 'Tick both boxes and choose a payment method to continue.')}</p>
      <button class="btn" type="button" data-pay disabled>${L('Payer (simulation)', 'Pay (simulation)')}</button>
      <p class="form-note">${L('Maquette&nbsp;: aucun paiement ni aucune commande n\'est enregistré.', 'Mock-up: no payment or order is recorded.')} ${L('L\'abus d\'alcool est dangereux pour la santé, à consommer avec modération.', 'Alcohol abuse is dangerous for your health; drink in moderation.')}</p>
    </div>`;
  animateCase(Math.min(1, t.sub / FREE));
}

/* Caisse en bois : six bouteilles se remplissent jusqu'au port offert */
let lastRatio = 0; let caseTween = null;
const BOTTLE = 'M8 0h6v14c0 4 8 6 8 14v40a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V28c0-8 8-10 8-14z';
const lvl = (r, i) => Math.max(0, Math.min(1, r * 6 - i));
function caseMeter(r) {
  const b = [0, 1, 2, 3, 4, 5].map((i) => { const h = 71 * lvl(r, i); return `<g transform="translate(${27 + i * 33} 8)"><path class="b-out" d="${BOTTLE}"/><rect class="b-fill" clip-path="url(#ship-b)" x="0" y="${71 - h}" width="22" height="${h}" data-b="${i}"/><rect class="b-cap" x="7.5" y="0" width="7" height="${lvl(r, i) >= 1 ? 9 : 0}" rx="1" data-cap="${i}"/></g>`; }).join('');
  return `<div class="ship-case${r >= 1 ? ' is-full' : ''}" data-ship-case aria-hidden="true"><svg viewBox="0 0 250 96"><defs><clipPath id="ship-b"><path d="${BOTTLE}"/></clipPath></defs>${b}
    <g class="crate"><rect x="8" y="62" width="234" height="30" rx="2"/><path d="M8 72h234M8 82h234" /><text x="125" y="80.5" text-anchor="middle"><tspan lang="fr">PORT OFFERT</tspan><tspan lang="en">FREE DELIVERY</tspan></text></g></svg></div>`;
}
function animateCase(r) {
  if (!$('[data-ship-case]') || !$('[data-cart]')?.classList.contains('is-open')) return;
  const set = (rr) => {
    lastRatio = rr; const box = $('[data-ship-case]'); if (!box) return;
    $$('[data-b]', box).forEach((el) => { const h = 71 * lvl(rr, +el.dataset.b); el.setAttribute('y', 71 - h); el.setAttribute('height', h); });
    $$('[data-cap]', box).forEach((el) => el.setAttribute('height', lvl(rr, +el.dataset.cap) >= 1 ? 9 : 0));
  };
  const was = lastRatio;
  if (caseTween) caseTween.kill();
  const done = () => { const box = $('[data-ship-case]'); if (!box) return; box.classList.toggle('is-full', r >= 1); if (r >= 1 && was < 1 && !CALM && window.gsap) { gsap.fromTo($('.crate', box), { y: -6 }, { y: 0, duration: 0.7, ease: 'bounce.out' }); sparkAt(box); } };
  if (CALM || !window.gsap || was === r) { set(r); done(); return; }
  const o = { r: was };
  caseTween = gsap.to(o, { r, duration: 0.8 + Math.abs(r - was) * 0.8, delay: 0.25, ease: 'power2.inOut', onUpdate: () => set(o.r), onComplete: done });
}

function bump() {
  const c = $$('[data-cart-count]');
  if (!CALM && window.gsap) gsap.fromTo(c, { scale: 1.6 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, .4)' });
}

let lastFocus = null;
export function openCart() {
  const c = $('[data-cart]'); const ov = $('[data-cart-ov]');
  hideToast(); c.inert = false; c.classList.add('is-open'); render(); ov.classList.add('is-open'); c.setAttribute('aria-hidden', 'false'); smooth.lock(true);
  lastFocus = document.activeElement;
  setTimeout(() => $('[data-cart-close]').focus({ preventScroll: true }), 50);
}
export function closeCart() {
  const c = $('[data-cart]'); const ov = $('[data-cart-ov]');
  c.classList.remove('is-open'); ov.classList.remove('is-open'); c.setAttribute('aria-hidden', 'true'); c.inert = true; smooth.lock(false);
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}

function fly(fromImg, done) {
  const target = $('[data-cart-open]');
  if (CALM || !fromImg || !target || !window.gsap) return done();
  const r = fromImg.getBoundingClientRect(); const t = target.getBoundingClientRect();
  const clone = fromImg.cloneNode(); clone.removeAttribute('srcset'); clone.className = 'fly';
  Object.assign(clone.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  document.body.appendChild(clone);
  const dx = t.left + t.width / 2 - (r.left + r.width / 2); const dy = t.top + t.height / 2 - (r.top + r.height / 2);
  const tl = gsap.timeline({ onComplete: () => { clone.remove(); done(); } });
  tl.to(clone, { x: dx, duration: 0.85, ease: 'power2.inOut' }, 0)
    .to(clone, { y: dy * 0.2 - 120, duration: 0.38, ease: 'power2.out' }, 0)
    .to(clone, { y: dy, duration: 0.47, ease: 'power2.in' }, 0.38)
    .to(clone, { scale: 0.12, rotation: 24, duration: 0.85, ease: 'power2.in' }, 0)
    .to(clone, { autoAlpha: 0, duration: 0.15 }, 0.75);
}

export function addToCart(id, qty = 1, fromImg = null) {
  const w = wineById(id); if (!w) return;
  const l = lines.find((x) => x.id === id);
  if (l) l.qty = Math.min(24, l.qty + qty); else lines.push({ id, qty, wood: false });
  save();
  fly(fromImg, () => { renderCount(); bump(); sparkAt($('.hdr [data-cart-open]')); });
  toast(L(`<b>${wineName(w)}</b> ajouté au panier.`, `<b>${wineName(w)}</b> added to your cart.`) + ` <button class="link" style="border:0;background:none;color:inherit;padding:0" type="button" data-cart-open>${L('Voir le panier', 'View cart')}</button>`);
}

export function initCart() {
  renderCount();
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-open]')) { e.preventDefault(); openCart(); return; }
    if (e.target.closest('[data-cart-close], [data-cart-ov]')) { closeCart(); return; }
    const t = e.target.closest('[data-inc],[data-dec],[data-rm],[data-checkout],[data-pay]'); if (!t) return;
    if (t.dataset.inc != null) { lines[+t.dataset.inc].qty = Math.min(24, lines[+t.dataset.inc].qty + 1); }
    else if (t.dataset.dec != null) { const l = lines[+t.dataset.dec]; l.qty -= 1; if (l.qty < 1) lines.splice(+t.dataset.dec, 1); }
    else if (t.dataset.rm != null) { lines.splice(+t.dataset.rm, 1); }
    else if (t.hasAttribute('data-checkout')) { $('[data-checkout-step]').classList.add('is-on'); t.remove(); $('[data-c-age]').focus(); return; }
    else if (t.hasAttribute('data-pay')) { lines = []; save(); render(); closeCart(); toast(L('Merci&nbsp;! Commande simulée&nbsp;: aucun paiement n\'a été effectué.', 'Thank you! Simulated order: no payment was made.'), 5200); return; }
    save(); render();
  });
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-wood]')) { lines[+e.target.dataset.wood].wood = e.target.checked; save(); render(); }
    if (e.target.matches('[data-c-age],[data-c-cgv],[data-c-pay]')) { const ok = $('[data-c-age]').checked && $('[data-c-cgv]').checked && !!$('[data-c-pay]:checked'); $('[data-pay]').disabled = !ok; $('[data-c-help]').style.visibility = ok ? 'hidden' : 'visible'; }
  });
  addEventListener('keydown', (e) => {
    const cart = $('[data-cart]'); if (!cart.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeCart(); return; }
    if (e.key === 'Tab') {
      const f = $$('button:not([disabled]), a[href], input:not([disabled])', cart).filter((el) => el.offsetParent);
      if (!f.length) return; const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
}
