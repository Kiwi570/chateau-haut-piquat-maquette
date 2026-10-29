// Panier simulé : tiroir toujours accessible, frais de port et minimum de commande du domaine.
import { $, $$, L, eur, store, toast, smooth, CALM, TOUCH, hideToast, sparkAt } from './core.js?v=17';
import { WINES, CHATEAUX, FORMATS } from './data.js?v=17';

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
    ${crateHTML('drawer')}
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
  crateDefs(); paintCrates(!!$('[data-cart]')?.classList.contains('is-open'));
}

/* ---------- Caisse bois vue de dessus : six cases qui se remplissent jusqu'au port offert (350 €) ----------
   Une case pleine = un sixième du port offert (environ 58 €). La case en cours se remplit en transparence.
   La même caisse sert dans le tiroir du panier et dans la petite fenêtre qui s'ouvre sous l'icône du panier. */
const CAP = { hp: '#8E1D2D', lf: '#6A1426', bl: '#A3283A' };
const SLOTS = [[48, 48], [120, 48], [192, 48], [48, 120], [120, 120], [192, 120]];
let shown = { full: 0, part: 0, sub: 0 };
function crateState() {
  const { sub } = totals();
  const r = Math.min(1, sub / FREE); const x = r * 6; const full = r >= 1 ? 6 : Math.floor(x + 1e-6); const part = r >= 1 ? 0 : x - full;
  // couleur de capsule de chaque case : le vin qui « occupe » cette part de la commande
  const colors = []; let acc = 0; const seg = FREE / 6;
  const parts = lines.map((l) => { const w = wineById(l.id); const f = FORMATS[w.fmt]; return { ch: w.ch, v: l.qty * (w.price + (l.wood && f.wood ? f.wood : 0)) }; });
  for (let k = 0; k < 6; k++) { const mid = (k + 0.5) * seg; let a = 0; let c = parts[0] ? parts[0].ch : 'hp'; for (const p of parts) { a += p.v; c = p.ch; if (a >= mid) break; } colors.push(CAP[c] || CAP.hp); }
  return { sub, r, full, part, colors, left: Math.max(0, FREE - sub) };
}
function crateDefs() {
  if ($('#crate-defs')) return;
  document.body.insertAdjacentHTML('beforeend', `<svg id="crate-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="crate-wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D6AC70"/><stop offset=".55" stop-color="#C39257"/><stop offset="1" stop-color="#A97842"/></linearGradient>
    <radialGradient id="crate-glass" cx=".38" cy=".34" r=".72"><stop offset="0" stop-color="#46584A"/><stop offset=".62" stop-color="#1D271F"/><stop offset="1" stop-color="#0D130E"/></radialGradient>
  </defs></svg>`);
}
function crateHTML(kind) {
  const slots = SLOTS.map(([x, y], i) => `<g class="crate__slot" transform="translate(${x} ${y})"><circle class="crate__hole" r="25"/><g class="crate__cap" data-cap="${i}"><circle r="28" fill="url(#crate-glass)"/><circle class="crate__capsule" r="15.5"/><circle r="15.5" fill="none" stroke="#D9B26A" stroke-width="1.6"/><circle r="9" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="1"/><ellipse cx="-5" cy="-6" rx="6" ry="3.6" fill="rgba(255,255,255,.22)"/></g></g>`).join('');
  return `<div class="crate crate--${kind}" data-crate>
    <div class="crate__box" aria-hidden="true"><svg viewBox="0 0 240 168"><rect x="1" y="1" width="238" height="166" rx="8" fill="url(#crate-wood)" stroke="#7A522D" stroke-width="2"/>
      <path d="M10 5.5H230M10 162.5H230M5.5 12V156M234.5 12V156" stroke="rgba(110,70,35,.28)" stroke-width="1"/>
      <rect x="12" y="12" width="216" height="144" rx="3" fill="#6E4826"/><rect x="12" y="12" width="216" height="144" rx="3" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="5"/>
      <path d="M84 12V156M156 12V156M12 84H228" stroke="#C79A61" stroke-width="5"/><path d="M86.5 12V156M158.5 12V156M12 86.5H228" stroke="rgba(60,35,15,.35)" stroke-width="1.2"/>
      ${slots}</svg><span class="crate__stamp">${L('Port offert', 'Free delivery')}</span></div>
    <div class="crate__gauge" aria-hidden="true"><i data-crate-gauge></i></div>
    <p class="crate__msg" data-crate-msg></p>
  </div>`;
}
function crateMsg(st) {
  if (!st.sub) return L('Port offert dès 350&nbsp;€ en France métropolitaine.', 'Free delivery from €350 in mainland France.');
  if (st.left > 0) return L(`Plus que <b>${eur(st.left)}</b> pour le port offert.`, `Only <b>${eur(st.left)}</b> more for free delivery.`);
  return L('<b>Port offert</b> en France métropolitaine.', '<b>Free delivery</b> in mainland France.');
}
// met à jour toutes les caisses visibles ; anim = la case qui vient d'être remplie tombe dans la caisse
function paintCrates(anim = false) {
  const st = crateState();
  $$('[data-crate]').forEach((box) => {
    $$('[data-cap]', box).forEach((g) => {
      const i = +g.dataset.cap; const cap = $('.crate__capsule', g); cap.setAttribute('fill', st.colors[i]);
      const target = i < st.full ? 1 : (i === st.full ? Math.min(0.55, st.part * 0.7) : 0);
      const was = g.dataset.o != null ? +g.dataset.o : (i < shown.full ? 1 : (i === shown.full ? Math.min(0.55, shown.part * 0.7) : 0));
      g.dataset.o = target;
      const moving = anim && !CALM && window.gsap && Math.abs(target - was) > 0.01;
      if (moving && target === 1) {
        gsap.fromTo(g, { opacity: 0, scale: 1.75, y: -30, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.9)', delay: Math.max(0, 0.08 * (i - shown.full)), overwrite: true });
      } else if (moving) {
        gsap.fromTo(g, { opacity: was }, { opacity: target, scale: 1, y: 0, duration: 0.45, overwrite: true });
      } else { if (window.gsap) gsap.killTweensOf(g); g.style.opacity = target; g.removeAttribute('transform'); g.style.transform = ''; }
    });
    const gauge = $('[data-crate-gauge]', box); if (gauge) gauge.style.transform = `scaleX(${st.r})`;
    const msg = $('[data-crate-msg]', box); if (msg) msg.innerHTML = crateMsg(st);
    const full = st.r >= 1; const wasFull = box.classList.contains('is-full'); box.classList.toggle('is-full', full);
    if (full && !wasFull && anim && !CALM && window.gsap) {
      gsap.fromTo($('.crate__stamp', box), { scale: 2.2, rotation: -24, autoAlpha: 0 }, { scale: 1, rotation: -8, autoAlpha: 1, duration: 0.55, ease: 'back.out(2.2)', delay: 0.45 });
      gsap.fromTo($('.crate__box svg', box), { y: 0 }, { y: -5, duration: 0.12, yoyo: true, repeat: 3, ease: 'power1.inOut', delay: 0.5 });
    }
  });
  shown = { full: st.full, part: st.part, sub: st.sub };
  return st;
}
// position (à l'écran) de la case où va tomber le vin qu'on vient d'ajouter
function nextSlotRect(box, st) {
  const i = Math.min(5, st.full >= 6 ? 5 : (st.full > shown.full ? st.full - 1 : st.full));
  const g = $(`[data-cap="${i}"]`, box); if (!g) return null;
  const svg = $('svg', box).getBoundingClientRect(); const [x, y] = SLOTS[i]; const k = svg.width / 240;
  return { left: svg.left + (x - 28) * k, top: svg.top + (y - 28) * k, width: 56 * k, height: 56 * k };
}

/* Petite fenêtre sous l'icône du panier : la caisse, la jauge du port offert et le lien vers le panier */
let flyTimer = 0;
function flyout() {
  let f = $('[data-cfly]');
  if (!f) {
    crateDefs();
    f = document.createElement('div'); f.className = 'cfly'; f.setAttribute('data-cfly', ''); f.setAttribute('role', 'status'); f.setAttribute('aria-live', 'polite');
    document.body.appendChild(f);
    f.addEventListener('pointerenter', () => clearTimeout(flyTimer));
    f.addEventListener('pointerleave', () => hideFlyout(1600));
    f.addEventListener('focusin', () => clearTimeout(flyTimer));
  }
  return f;
}
function hideFlyout(ms = 0) { clearTimeout(flyTimer); flyTimer = setTimeout(() => { const f = $('[data-cfly]'); if (f) f.classList.remove('is-on'); }, ms); }
function showFlyout(w, fromImg) {
  const f = flyout();
  const before = { ...shown };
  f.innerHTML = `<p class="cfly__title"><b>${wineName(w)}</b> ${L('ajouté au panier', 'added to your cart')}</p>${crateHTML('fly')}<div class="cfly__actions"><button class="btn btn--sm" type="button" data-cart-open>${L('Voir le panier', 'View cart')}</button><button class="cfly__close" type="button" data-cfly-close aria-label="${'Fermer'}" data-aria-en="Close">×</button></div>`;
  const box = $('[data-crate]', f);
  // état d'avant l'ajout, puis la nouvelle bouteille tombe dans sa case
  shown = before;
  $$('[data-cap]', box).forEach((g) => { const i = +g.dataset.cap; const o = i < before.full ? 1 : 0; g.dataset.o = o; g.style.opacity = o; });
  const gauge = $('[data-crate-gauge]', box); if (gauge) gauge.style.transform = `scaleX(${Math.min(1, before.sub / FREE)})`;
  $('[data-crate-msg]', box).innerHTML = crateMsg(crateState());
  f.classList.add('is-on'); hideToast();
  const st = crateState();
  const go = () => { paintCrates(true); renderCount(); bump(); hideFlyout(TOUCH ? 3400 : 3800); };
  if (CALM || !fromImg || !window.gsap) { go(); return; }
  requestAnimationFrame(() => fly(fromImg, nextSlotRect(box, st), go));
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

function fly(fromImg, rect, done) {
  const target = $('.hdr [data-cart-open]');
  if (CALM || !fromImg || (!rect && !target) || !window.gsap) return done();
  const r = fromImg.getBoundingClientRect(); const t = rect || target.getBoundingClientRect();
  const clone = fromImg.cloneNode(); clone.removeAttribute('srcset'); clone.className = 'fly';
  Object.assign(clone.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  document.body.appendChild(clone);
  const dx = t.left + t.width / 2 - (r.left + r.width / 2); const dy = t.top + t.height / 2 - (r.top + r.height / 2);
  const tl = gsap.timeline({ onComplete: () => { clone.remove(); done(); } });
  tl.to(clone, { x: dx, duration: 0.85, ease: 'power2.inOut' }, 0)
    .to(clone, { y: dy * 0.2 - 120, duration: 0.38, ease: 'power2.out' }, 0)
    .to(clone, { y: dy, duration: 0.47, ease: 'power2.in' }, 0.38)
    .to(clone, { scale: rect ? Math.max(0.08, Math.min(t.width / r.width, t.height / r.height)) : 0.12, rotation: rect ? 0 : 24, duration: 0.85, ease: 'power2.in' }, 0)
    .to(clone, { autoAlpha: 0, duration: 0.15 }, 0.75);
}

export function addToCart(id, qty = 1, fromImg = null) {
  const w = wineById(id); if (!w) return;
  const l = lines.find((x) => x.id === id);
  if (l) l.qty = Math.min(24, l.qty + qty); else lines.push({ id, qty, wood: false });
  save();
  // la caisse s'ouvre sous l'icône du panier et la bouteille tombe dans sa case
  if ($('[data-cart]')?.classList.contains('is-open')) { render(); renderCount(); return; }
  showFlyout(w, fromImg);
}

export function initCart() {
  renderCount();
  { const st = crateState(); shown = { full: st.full, part: st.part, sub: st.sub }; }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cfly-close]')) { hideFlyout(0); return; }
    if (e.target.closest('[data-cart-open]')) { e.preventDefault(); hideFlyout(0); openCart(); return; }
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
    if (e.key === 'Escape' && $('[data-cfly].is-on')) hideFlyout(0);
    const cart = $('[data-cart]'); if (!cart.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeCart(); return; }
    if (e.key === 'Tab') {
      const f = $$('button:not([disabled]), a[href], input:not([disabled])', cart).filter((el) => el.offsetParent);
      if (!f.length) return; const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
}
