// Boutique : filtres, cartes inclinables, ajout au panier, règle des formats.
import { $, $$, L, eur, CALM, TOUCH, scrollToEl, sparkAt } from '../core.js?v=12';
import { WINES, CHATEAUX, FORMATS } from '../data.js?v=12';
import { addToCart } from '../cart.js?v=12';

const gsap = window.gsap; const Flip = window.Flip;
const ORDER = WINES.map((w) => w.id);
const LIMIT = 12; let expanded = false;
const state = { ch: new Set(), vin: new Set(), fmt: new Set(), coeur: false, promo: false, sort: 'default' };
const FMT_ORDER = ['d37', 'b75', 'm150', 'dm300', 'i600'];

function readParams() {
  const p = new URLSearchParams(location.search);
  if (p.get('chateau') && CHATEAUX[p.get('chateau')]) state.ch.add(p.get('chateau'));
  if (p.get('millesime')) state.vin.add(+p.get('millesime'));
  if (p.get('format') && FORMATS[p.get('format')]) state.fmt.add(p.get('format'));
}

function card(w) {
  const f = FORMATS[w.fmt]; const ch = CHATEAUX[w.ch];
  const per = w.price / f.units;
  const badge = w.badge === 'coeur' ? `<span class="pcard__badge is-coeur">${L('Coup de cœur', 'Favourite')}</span>` : w.badge === 'promo' ? `<span class="pcard__badge is-promo">${L('Promotion', 'Offer')}</span>` : '';
  const dist = w.dist.filter((d) => d.k !== 'hve').slice(0, 2).map((d) => L(d.t.fr, d.t.en)).join(' · ');
  return `<article class="pcard" data-id="${w.id}" data-flip-id="${w.id}">
    <a class="pcard__img" href="vin.html?id=${w.id}" aria-label="${ch.name} ${w.vintage}">${badge}<img src="${w.img.src}" width="${w.img.w}" height="${w.img.h}" alt="${ch.name} ${w.vintage}, ${f.label.fr}" loading="lazy" decoding="async" data-pimg></a>
    <div class="pcard__body">
      <h3><a href="vin.html?id=${w.id}">${ch.name.replace('Haut-Piquat', '<span class="nw">Haut-Piquat</span>')} <span class="num">${w.vintage}</span></a></h3>
      <p class="pcard__fmt"><span class="long">${L(f.label.fr, f.label.en)}</span><span class="short">${f.units} × ${f.cl} cl</span></p>
      ${dist ? `<p class="pcard__dist">${dist}</p>` : ''}
      <div class="pcard__price"><b>${eur(w.price)}</b>${w.old ? `<s>${eur(w.old)}</s>` : ''}<small>${L(`${eur(per)} / ${f.unit.fr === 'bouteille' ? 'bt' : f.unit.fr}`, `${eur(per)} / ${f.unit.en === 'bottle' ? 'btl' : f.unit.en}`)}${w.promo51 ? L(' · 5 + 1 offerte', ' · 5 + 1 free') : ''}</small></div>
      <button class="btn btn--sm pcard__add" type="button" data-add="${w.id}">${L('Ajouter', 'Add')}</button>
    </div>
  </article>`;
}

function chips(group, items) {
  return `<div class="fgroup"><h3>${group}</h3><div class="chips">${items.join('')}</div></div>`;
}
function chip(kind, val, label, on, count) {
  const off = count === 0 && !on;
  return `<button class="chip" type="button" data-f="${kind}" data-v="${val}" aria-pressed="${on}"${off ? ' aria-disabled="true" tabindex="-1"' : ''}>${label}${count != null ? ` <span class="muted">${count}</span>` : ''}</button>`;
}
function match(w, skip) {
  return (skip === 'ch' || !state.ch.size || state.ch.has(w.ch)) && (skip === 'vin' || !state.vin.size || state.vin.has(w.vintage)) && (skip === 'fmt' || !state.fmt.size || state.fmt.has(w.fmt)) && (skip === 'coeur' || !state.coeur || w.badge === 'coeur') && (skip === 'promo' || !state.promo || w.badge === 'promo');
}
function renderFilters() {
  const el = $('[data-filters]');
  const count = (pred, skip) => WINES.filter((w) => match(w, skip) && pred(w)).length;
  const vintages = [...new Set(WINES.map((w) => w.vintage))].sort();
  const n0 = WINES.filter((w) => match(w)).length;
  el.innerHTML = [
    chips(L('Château', 'Château'), Object.entries(CHATEAUX).map(([k, c]) => chip('ch', k, { hp: 'Haut-Piquat', lf: 'La Fleur', bl: 'Beaulieu' }[k], state.ch.has(k), count((w) => w.ch === k, 'ch')))),
    chips(L('Millésime', 'Vintage'), vintages.map((v) => chip('vin', v, v, state.vin.has(v), count((w) => w.vintage === v, 'vin')))),
    chips(L('Format', 'Size'), FMT_ORDER.map((k) => chip('fmt', k, FORMATS[k].filter, state.fmt.has(k), count((w) => w.fmt === k, 'fmt')))),
    chips(L('Sélection', 'Selection'), [chip('coeur', 1, L('Coups de cœur', 'Favourites'), state.coeur, count((w) => w.badge === 'coeur', 'coeur')), chip('promo', 1, L('Promotions', 'Offers'), state.promo, count((w) => w.badge === 'promo', 'promo'))]),
    `<button class="link small" style="border:0;background:none;padding:0;justify-self:start;min-height:44px" type="button" data-reset>${L('Tout afficher', 'Show all')}</button>`,
    `<p class="form-note">${L('Caisses cadeaux et primeurs&nbsp;: <a class="link" href="#cadeaux">sur devis</a>.', 'Gift cases and en primeur: <a class="link" href="#cadeaux">on quote</a>.')}</p>`,
    `<button class="btn filters__apply" type="button" data-apply>${L(`Voir ${n0} vin${n0 > 1 ? 's' : ''}`, `Show ${n0} wine${n0 > 1 ? 's' : ''}`)}</button>`,
  ].join('');
  const n = state.ch.size + state.vin.size + state.fmt.size + (state.coeur ? 1 : 0) + (state.promo ? 1 : 0);
  $('[data-filter-count]').textContent = n ? `(${n})` : '';
}

function visible() {
  let list = WINES.filter((w) => match(w));
  const s = state.sort;
  if (s === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (s === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (s === 'vintage-desc') list.sort((a, b) => b.vintage - a.vintage);
  else if (s === 'vintage-asc') list.sort((a, b) => a.vintage - b.vintage);
  else list.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  return list;
}

function syncUrl() {
  const p = new URLSearchParams();
  if (state.ch.size === 1) p.set('chateau', [...state.ch][0]);
  if (state.vin.size === 1) p.set('millesime', [...state.vin][0]);
  if (state.fmt.size === 1) p.set('format', [...state.fmt][0]);
  const q = p.toString();
  history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
}
function renderGrid(animate) {
  syncUrl();
  const grid = $('[data-pgrid]');
  const all = visible();
  // sans filtre : 12 vins d'abord, le reste sur demande
  const noFilter = !state.ch.size && !state.vin.size && !state.fmt.size && !state.coeur && !state.promo;
  const limited = noFilter && !expanded && all.length > LIMIT;
  const list = limited ? all.slice(0, LIMIT) : all;
  const stateF = animate && !CALM && Flip ? Flip.getState($$('.pcard', grid)) : null;
  const existing = new Map($$('.pcard', grid).map((c) => [c.dataset.id, c]));
  const frag = document.createDocumentFragment();
  list.forEach((w) => {
    let c = existing.get(w.id);
    if (!c) { const t = document.createElement('template'); t.innerHTML = card(w).trim(); c = t.content.firstChild; bindTilt(c); }
    c.style.display = ''; frag.appendChild(c); existing.delete(w.id);
  });
  existing.forEach((c) => { c.style.display = 'none'; frag.appendChild(c); });
  grid.innerHTML = ''; grid.appendChild(frag);
  const drops = [];
  state.vin.forEach((v) => drops.push(['vin', v, String(v)]));
  state.fmt.forEach((k) => drops.push(['fmt', k, FORMATS[k].filter]));
  if (state.coeur) drops.push(['coeur', 1, L('coups de cœur', 'favourites')]);
  if (state.promo) drops.push(['promo', 1, L('promotions', 'offers')]);
  const empty = list.length ? '' : `<div class="pgrid__empty"><p>${L('Aucun vin ne correspond à ces filtres.', 'No wine matches these filters.')}</p><div class="actions">${drops.slice(0, 3).map(([k, v, t]) => `<button class="chip" type="button" data-drop="${k}" data-v="${v}">${L('Retirer', 'Remove')} ${t}</button>`).join('')}<button class="btn btn--sm" type="button" data-drop-all>${L('Tout afficher', 'Show all')}</button></div></div>`;
  grid.insertAdjacentHTML('beforeend', empty);
  $('[data-result-count]').innerHTML = L(`${all.length} vin${all.length > 1 ? 's' : ''}`, `${all.length} wine${all.length > 1 ? 's' : ''}`);
  let more = $('[data-pmore]');
  if (!more) { more = document.createElement('div'); more.className = 'pgrid__more'; more.setAttribute('data-pmore', ''); grid.after(more); }
  const rest = all.length - list.length;
  more.innerHTML = limited ? `<span class="pgrid__more-line" aria-hidden="true"></span><button class="btn btn--ghost magnetic" type="button" data-more>${L(`Voir les ${rest} autres vins`, `See the other ${rest} wines`)}</button><span class="pgrid__more-line" aria-hidden="true"></span>` : '';
  if (stateF) Flip.from(stateF, { duration: 0.7, ease: 'power3.inOut', absolute: true, stagger: 0.02, onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.6 }), onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.9, duration: 0.4 }) });
}

function bindTilt(c) {
  if (TOUCH || CALM) return;
  const rx = gsap.quickTo(c, 'rotationX', { duration: 0.6, ease: 'power3' }); const ry = gsap.quickTo(c, 'rotationY', { duration: 0.6, ease: 'power3' });
  gsap.set(c, { transformPerspective: 900 });
  c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 9); rx(-((e.clientY - r.top) / r.height - 0.5) * 7); });
  c.addEventListener('pointerleave', () => { rx(0); ry(0); });
}

function initFilters() {
  const panel = $('[data-filters]'); const toggle = $('[data-filters-toggle]');
  let scrim = null;
  const setOpen = (o) => {
    panel.classList.toggle('is-open', o); toggle.setAttribute('aria-expanded', o);
    if (o && innerWidth < 1100) { scrim = document.createElement('div'); scrim.className = 'filters__scrim'; scrim.addEventListener('click', () => setOpen(false)); panel.before(scrim); }
    else if (scrim) { scrim.remove(); scrim = null; }
    if (!o && innerWidth < 1100) { toggle.focus({ preventScroll: true }); scrollToEl($('[data-pgrid]')); }
  };
  toggle.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('is-open') && innerWidth < 1100) setOpen(false); });
  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-apply]')) { setOpen(false); return; }
    const b = e.target.closest('[data-f]');
    if (b && b.getAttribute('aria-disabled') === 'true') return;
    if (e.target.closest('[data-reset]')) { state.ch.clear(); state.vin.clear(); state.fmt.clear(); state.coeur = state.promo = false; }
    else if (b) {
      const k = b.dataset.f; const v = k === 'vin' ? +b.dataset.v : b.dataset.v;
      if (k === 'coeur' || k === 'promo') state[k] = !state[k]; else state[k].has(v) ? state[k].delete(v) : state[k].add(v);
    } else return;
    renderFilters(); renderGrid(true); syncRuler();
  });
  $('[data-sort]').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(true); });
  document.addEventListener('click', (e) => { if (!e.target.closest('[data-more]')) return; expanded = true; renderGrid(true); window.ScrollTrigger && ScrollTrigger.refresh(); });
  $('[data-pgrid]').addEventListener('click', (e) => {
    if (e.target.closest('[data-drop-all]')) { state.ch.clear(); state.vin.clear(); state.fmt.clear(); state.coeur = state.promo = false; renderFilters(); renderGrid(true); syncRuler(); return; }
    const d = e.target.closest('[data-drop]');
    if (d) { const k = d.dataset.drop; if (k === 'coeur' || k === 'promo') state[k] = false; else state[k].delete(k === 'vin' ? +d.dataset.v : d.dataset.v); renderFilters(); renderGrid(true); syncRuler(); return; }
    const b = e.target.closest('[data-add]'); if (!b) return;
    addToCart(b.dataset.add, 1, $('[data-pimg]', b.closest('.pcard')));
  });
}

/* Règle des formats */
function syncRuler() { $$('[data-ruler] button').forEach((b) => b.setAttribute('aria-pressed', state.fmt.size === 1 && state.fmt.has(b.dataset.fmt) ? 'true' : 'false')); }
function initRuler() {
  const r = $('[data-ruler]'); const info = $('[data-formats-info]'); if (!r) return;
  const names = { d37: L('Demi-bouteille<br>37,5 cl', 'Half bottle<br>37.5 cl'), b75: L('Bouteille<br>75 cl', 'Bottle<br>75 cl'), m150: L('Magnum<br>1,5 L', 'Magnum<br>1.5 L'), dm300: L('Double magnum<br>3 L', 'Double magnum<br>3 L'), i600: L('Impériale<br>6 L', 'Impériale<br>6 L') };
  r.innerHTML = FMT_ORDER.map((k) => `<button type="button" data-fmt="${k}" aria-pressed="false">${names[k]}</button>`).join('');
  const describe = (k) => {
    const list = WINES.filter((w) => w.fmt === k); const min = Math.min(...list.map((w) => w.price));
    info.innerHTML = L(`${list.length} référence${list.length > 1 ? 's' : ''} en ${FORMATS[k].filter}, à partir de ${eur(min)}. <a class="link" href="#cat-title" data-goto-grid>Voir dans le catalogue</a>`, `${list.length} item${list.length > 1 ? 's' : ''} in ${FORMATS[k].filter}, from ${eur(min)}. <a class="link" href="#cat-title" data-goto-grid>See in the catalogue</a>`);
  };
  const current = () => (state.fmt.size === 1 ? [...state.fmt][0] : 'b75');
  describe(current());
  r.addEventListener('pointerover', (e) => { const b = e.target.closest('button'); if (b) describe(b.dataset.fmt); });
  r.addEventListener('pointerleave', () => describe(current()));
  r.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    describe(b.dataset.fmt); state.fmt.clear(); state.fmt.add(b.dataset.fmt); renderFilters(); renderGrid(false); syncRuler();
  });
  info.addEventListener('click', (e) => { if (e.target.closest('[data-goto-grid]')) { e.preventDefault(); scrollToEl($('[data-pgrid]').closest('section')); } });
  if (!CALM) gsap.from('.formats__img img', { y: 60, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '[data-formats]', start: 'top 80%', once: true } });
}

export function setup() {
  readParams();
  renderFilters(); renderGrid(false); initFilters(); initRuler(); syncRuler();
}
export function enter() {
  if (CALM) return;
  const t = $('[data-hero-title]');
  const s = window.SplitText ? SplitText.create(t, { type: 'words', mask: 'words' }) : null;
  if (s) gsap.from(s.words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.1 });
  gsap.from('.phero__content .kicker, .phero__content .lead', { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.4 });
  gsap.fromTo('[data-parallax-img]', { scale: 1.15 }, { scale: 1, duration: 2, ease: 'expo.out' });
  gsap.to('[data-parallax-img]', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '[data-phero]', start: 'top top', end: 'bottom top', scrub: true } });
  ScrollTrigger.batch('.pcard', { start: 'top 92%', once: true, onEnter: (els) => gsap.from(els, { y: 40, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06 }) });
}
