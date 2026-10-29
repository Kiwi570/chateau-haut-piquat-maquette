// Panier simulé : tiroir toujours accessible, frais de port et minimum de commande du domaine.
import { $, $$, L, eur, store, toast, smooth, CALM, TOUCH, hideToast, sparkAt, lang } from './core.js?v=18';
import { WINES, CHATEAUX, FORMATS } from './data.js?v=18';

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
  const body = $('[data-cart-body]'); const foot = $('[data-cart-foot]'); const ship = $('[data-cart-ship]'); if (!body) return;
  renderCount();
  const t = totals();
  const sum = $('[data-cart-sum]');
  const bottles = lines.reduce((a, l) => a + l.qty * FORMATS[wineById(l.id).fmt].units, 0);
  if (sum) sum.innerHTML = lines.length ? L(`${t.count} caisse${t.count > 1 ? 's' : ''} · ${bottles} bouteille${bottles > 1 ? 's' : ''}`, `${t.count} case${t.count > 1 ? 's' : ''} · ${bottles} bottle${bottles > 1 ? 's' : ''}`) : '';
  if (!lines.length) {
    if (ship) ship.innerHTML = '';
    body.innerHTML = `<div class="cart__empty"><svg class="ast" aria-hidden="true"><use href="#ast"/></svg><p>${L('Votre panier est vide.', 'Your cart is empty.')}</p><a class="btn btn--sm" href="boutique.html">${L('Voir la boutique', 'Visit the shop')}</a></div>`;
    foot.innerHTML = `<p class="form-note">${L('Port offert dès 350&nbsp;€ en France métropolitaine.', 'Free delivery from €350 in mainland France.')}</p>`;
    return;
  }
  // une ligne compacte par vin : vignette, nom et format, quantité, prix ; la caisse bois en option dessous
  body.innerHTML = lines.map((l, i) => {
    const w = wineById(l.id); const f = FORMATS[w.fmt];
    const unit = w.price + (l.wood && f.wood ? f.wood : 0);
    const wood = f.wood ? `<label class="cline__wood"><input type="checkbox" data-wood="${i}" ${l.wood ? 'checked' : ''}><span>${L('En caisse bois', 'In a wooden case')} <span class="nw">+${eur(f.wood)}</span></span></label>` : '';
    const name = wineName(w).replace('Haut-Piquat', '<span class="nw">Haut-Piquat</span>');
    return `<div class="cline"><a class="cline__img" href="vin.html?id=${w.id}" tabindex="-1" aria-hidden="true"><img src="${w.img.small}" alt="" width="56" height="74" loading="lazy"></a>
      <div class="cline__info"><h3><a href="vin.html?id=${w.id}">${name}</a></h3><p class="sub">${L(f.label.fr, f.label.en)}${l.qty > 1 ? ` · ${eur(unit)} ${L('la caisse', 'per case')}` : ''}</p></div>
      <p class="price">${eur(unit * l.qty)}</p>
      <div class="cline__opts"><div class="qty" role="group" aria-label="${lang() === 'en' ? 'Quantity' : 'Quantité'}"><button type="button" data-dec="${i}" aria-label="${l.qty > 1 ? 'Retirer une caisse' : `Retirer ${wineName(w)} du panier`}">${l.qty > 1 ? '−' : '<svg class="qty__bin" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></svg>'}</button><span>${l.qty}</span><button type="button" data-inc="${i}" aria-label="Ajouter une caisse">+</button></div>${wood}<button class="rm" type="button" data-rm="${i}" aria-label="${lang() === 'en' ? 'Remove' : 'Retirer'} ${wineName(w)}"><span class="rm__t">${L('Retirer', 'Remove')}</span><svg class="rm__i" aria-hidden="true"><use href="#i-close"/></svg></button></div></div>`;
  }).join('');
  // en haut du tiroir : la caisse bois et ce qui manque pour le port offert
  if (ship) ship.innerHTML = crateHTML('drawer');
  const minOk = t.sub >= MIN;
  foot.innerHTML = `
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
const CAP = { hp: 'url(#crate-cap-hp)', lf: 'url(#crate-cap-lf)', bl: 'url(#crate-cap-bl)' };
const SLOTS = [[50.7, 50], [120, 50], [189.3, 50], [50.7, 118], [120, 118], [189.3, 118]];
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
  const cap = (id, a, b, c) => `<radialGradient id="crate-cap-${id}" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
  document.body.insertAdjacentHTML('beforeend', `<svg id="crate-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="crate-wood" x1="0" y1="0" x2="1" y2=".7"><stop offset="0" stop-color="#E0B97F"/><stop offset=".45" stop-color="#CB9C5E"/><stop offset="1" stop-color="#A87743"/></linearGradient>
    <linearGradient id="crate-wood-v" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="#D9AF73"/><stop offset="1" stop-color="#B28149"/></linearGradient>
    <radialGradient id="crate-floor" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#7A5130"/><stop offset=".7" stop-color="#5A3A20"/><stop offset="1" stop-color="#3E2714"/></radialGradient>
    <radialGradient id="crate-glass" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#5D7563"/><stop offset=".35" stop-color="#2C3B30"/><stop offset=".8" stop-color="#121A14"/><stop offset="1" stop-color="#0A0F0B"/></radialGradient>
    ${cap('hp', '#C9505C', '#8E1D2D', '#4E0C17')}${cap('lf', '#A84459', '#6A1426', '#3A0812')}${cap('bl', '#D25A62', '#A3283A', '#5C1320')}
  </defs></svg>`);
}
// veinage du bois : quelques fibres légèrement ondulées, toujours les mêmes (pas de hasard)
function grain(x0, y0, len, horiz, n) {
  let d = '';
  for (let k = 0; k < n; k++) {
    const o = 2.4 + k * (11 / n) + Math.sin(k * 2.3) * 0.8; const w = 0.6 + (k % 3) * 0.35; const ph = k * 1.7;
    const pts = [0, 0.25, 0.5, 0.75, 1].map((t) => { const a = t * len; const b = o + Math.sin(t * 6.3 + ph) * w; return horiz ? `${(x0 + a).toFixed(1)} ${(y0 + b).toFixed(1)}` : `${(x0 + b).toFixed(1)} ${(y0 + a).toFixed(1)}`; });
    d += `M${pts[0]} Q${pts[1]} ${pts[2]} T${pts[4]}`;
  }
  return d;
}
function crateHTML(kind) {
  const slots = SLOTS.map(([x, y], i) => `<g class="crate__slot" transform="translate(${x} ${y})">
      <circle class="crate__hole" r="26"/><circle class="crate__hole-in" r="20"/>
      <circle class="crate__arc" r="28.5" pathLength="100" stroke-dasharray="0 100" transform="rotate(-90)" data-arc="${i}"/>
      <g class="crate__cap" data-cap="${i}">
        <circle r="29" cx="2" cy="3" fill="rgba(0,0,0,.4)"/>
        <circle r="29" fill="url(#crate-glass)"/><path d="M-21 -14a26 26 0 0 1 22-12" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2.4" stroke-linecap="round"/>
        <circle r="16" fill="rgba(0,0,0,.35)"/><circle class="crate__capsule" r="15" fill="url(#crate-cap-hp)"/>
        <circle r="11.2" fill="none" stroke="#D9B26A" stroke-width="1.3"/><circle r="15" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1"/>
        <use href="#ast" x="-6.5" y="-6.5" width="13" height="13" class="crate__ast"/>
        <ellipse cx="-6" cy="-7" rx="6.5" ry="3.2" fill="rgba(255,255,255,.22)" transform="rotate(-28 -6 -7)"/>
      </g></g>`).join('');
  const nail = (x, y) => `<circle cx="${x}" cy="${y}" r="2.1" fill="#3A2614"/><circle cx="${x - 0.6}" cy="${y - 0.6}" r=".7" fill="rgba(255,240,210,.5)"/>`;
  return `<div class="crate crate--${kind}" data-crate>
    <div class="crate__box" aria-hidden="true"><svg viewBox="0 0 240 168">
      <rect x=".5" y=".5" width="239" height="167" rx="6" fill="url(#crate-wood)" stroke="#6B4524" stroke-width="1.4"/>
      <path d="M0 16H240M0 152H240" stroke="rgba(80,48,20,.0)"/>
      <path d="M16 16V152M224 16V152" stroke="none"/>
      <rect x=".5" y="16" width="15.5" height="136" fill="url(#crate-wood-v)"/><rect x="224" y="16" width="15.5" height="136" fill="url(#crate-wood-v)"/>
      <path d="${grain(6, 0, 228, true, 4)}${grain(6, 152, 228, true, 4)}${grain(0, 20, 128, false, 4)}${grain(224, 20, 128, false, 4)}" fill="none" stroke="rgba(92,56,24,.32)" stroke-width=".8"/>
      <path d="M1 1L16 16M239 1L224 16M1 167L16 152M239 167L224 152" stroke="rgba(70,40,15,.45)" stroke-width="1"/>
      <path d="M2 1.5H238" stroke="rgba(255,245,220,.45)" stroke-width="1"/>
      ${nail(8, 8)}${nail(232, 8)}${nail(8, 160)}${nail(232, 160)}${nail(120, 8)}${nail(120, 160)}
      <rect x="16" y="16" width="208" height="136" fill="url(#crate-floor)"/>
      <rect x="16" y="16" width="208" height="136" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="5"/>
      <g class="crate__div"><rect x="84" y="16" width="4" height="136" fill="rgba(0,0,0,.28)" transform="translate(1.5 1.5)"/><rect x="152" y="16" width="4" height="136" fill="rgba(0,0,0,.28)" transform="translate(1.5 1.5)"/><rect x="16" y="82" width="208" height="4" fill="rgba(0,0,0,.28)" transform="translate(1.5 1.5)"/>
        <rect x="84" y="16" width="4" height="136" fill="#D2B488"/><rect x="152" y="16" width="4" height="136" fill="#D2B488"/><rect x="16" y="82" width="208" height="4" fill="#D9BD92"/>
        <path d="M84 16V152M152 16V152M16 82H224" stroke="rgba(255,250,235,.55)" stroke-width=".8"/></g>
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
      const target = i < st.full ? 1 : 0;
      const was = g.dataset.o != null ? +g.dataset.o : (i < shown.full ? 1 : 0);
      const arc = $(`[data-arc="${i}"]`, box); const arcTo = i === st.full ? Math.round(st.part * 100) : 0;
      if (arc) { const a0 = +(arc.dataset.v != null ? arc.dataset.v : (i === shown.full ? Math.round(shown.part * 100) : 0)); arc.dataset.v = arcTo;
        if (anim && !CALM && window.gsap && a0 !== arcTo) { const o = { v: a0 }; gsap.to(o, { v: arcTo, duration: 0.7, delay: 0.35, ease: 'power2.out', onUpdate: () => arc.setAttribute('stroke-dasharray', `${o.v.toFixed(1)} 100`) }); }
        else arc.setAttribute('stroke-dasharray', `${arcTo} 100`); }
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
  $$('[data-arc]', box).forEach((c) => { const i = +c.dataset.arc; const v = i === before.full ? Math.round(before.part * 100) : 0; c.dataset.v = v; c.setAttribute('stroke-dasharray', `${v} 100`); });
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
  hideToast(); c.inert = false; c.classList.add('is-open'); document.body.classList.add('cart-open'); render(); ov.classList.add('is-open'); c.setAttribute('aria-hidden', 'false'); smooth.lock(true);
  lastFocus = document.activeElement;
  setTimeout(() => $('[data-cart-close]').focus({ preventScroll: true }), 50);
}
export function closeCart() {
  const c = $('[data-cart]'); const ov = $('[data-cart-ov]');
  c.classList.remove('is-open'); document.body.classList.remove('cart-open'); ov.classList.remove('is-open'); c.setAttribute('aria-hidden', 'true'); c.inert = true; smooth.lock(false);
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
