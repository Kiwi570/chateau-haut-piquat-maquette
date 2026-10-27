// Fiche vin : rendu depuis les données du site, bouteille qui pivote sur son socle.
import { $, $$, L, eur, CALM, TOUCH, toast } from '../core.js?v=3';
import { WINES, CHATEAUX, FORMATS, BOTTLES, TEXTURES } from '../data.js?v=3';
import { addToCart } from '../cart.js?v=3';

const gsap = window.gsap;
let wine = null;

function parseBlend(s) {
  const out = []; const re = /(\d+)\s*%\s*([A-Za-zÀ-ÿ ]+?)(?=,|\.|$|\s\d)/g; let m;
  while ((m = re.exec(s))) out.push({ pct: +m[1], name: m[2].trim().toLowerCase() });
  return out;
}
function medal(d) {
  return `<span class="medal is-${d.k}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="6"/></svg>${L(d.t.fr, d.t.en)}</span>`;
}

function render() {
  const id = new URLSearchParams(location.search).get('id');
  wine = WINES.find((w) => w.id === id) || WINES.find((w) => w.id === 'hp-2020');
  if (id && wine.id !== id) setTimeout(() => toast(L('Ce vin n\'existe pas&nbsp;: voici le Château Haut-Piquat 2020.', 'This wine does not exist: here is Château Haut-Piquat 2020.')), 1200);
  const w = wine; const ch0 = CHATEAUX[w.ch]; const ch = { ...ch0, app: ch0.app.replace(/-/g, '\u2011') }; const f = FORMATS[w.fmt];
  document.title = `${ch.name} ${w.vintage} · Château Haut-Piquat`;
  $('[data-wine-pack]').innerHTML = `<img src="${w.img.big}" width="${w.img.w}" height="${w.img.h}" alt="${ch.name} ${w.vintage}, ${f.label.fr}" decoding="async">`;
  const blend = parseBlend(w.blend);
  const tex = [TEXTURES.m, TEXTURES.cs, TEXTURES.x];
  const badges = [];
  if (w.badge === 'coeur') badges.push(`<span class="pcard__badge is-coeur" style="position:static">${L('Coup de cœur', 'Favourite')}</span>`);
  if (w.badge === 'promo') badges.push(`<span class="pcard__badge is-promo" style="position:static">${L('Promotion', 'Offer')}</span>`);
  const info = $('[data-wine-info]');
  info.innerHTML = `
    <p class="crumbs"><a href="boutique.html">${L('Boutique', 'Shop')}</a> / <a href="boutique.html?chateau=${w.ch}">${ch.name}</a> / ${w.vintage}</p>
    <p class="kicker">${ch.app}</p>
    <h1 class="h1" style="margin-top:14px" data-wine-title>${ch.name} <em>${w.vintage}</em></h1>
    <div class="whero__badges">${badges.join('')}</div>
    <div class="whero__price"><b>${eur(w.price)}</b>${w.old ? `<s>${eur(w.old)}</s>` : ''}<span class="muted">${L(f.label.fr, f.label.en)}</span></div>
    <p class="small muted" style="margin:0">${L(`Soit ${eur(w.price / f.units)} la ${f.unit.fr}, TVA comprise`, `${eur(w.price / f.units)} per ${f.unit.en}, VAT included`)}${w.promo51 ? L(' · promotion&nbsp;: 5 achetées, 1 offerte', ' · offer: buy 5, get 1 free') : ''}</p>
    <div class="whero__buy">
      <div class="qty" role="group" aria-label="Quantité"><button type="button" data-q="-1" aria-label="Moins">−</button><span data-qv>1</span><button type="button" data-q="1" aria-label="Plus">+</button></div>
      <button class="btn magnetic" type="button" data-add-wine>${L('Ajouter au panier', 'Add to cart')}</button>
    </div>
    <p class="form-note">${L('Port offert dès 350&nbsp;€ en France métropolitaine, 35&nbsp;€ en dessous, commande minimum 105&nbsp;€.', 'Free delivery from €350 in mainland France, €35 below, €105 minimum order.')}</p>
    <dl class="whero__facts">
      <div><dt>${L('Appellation', 'Appellation')}</dt><dd>${ch.app}</dd></div>
      <div><dt>${L('Millésime', 'Vintage')}</dt><dd>${w.vintage}</dd></div>
      <div><dt>${L('Degré', 'Alcohol')}</dt><dd><span class="todo">${L('à compléter', 'to complete')}</span></dd></div>
      <div><dt>${L('Allergènes', 'Allergens')}</dt><dd><span class="todo">${L('sulfites à confirmer', 'sulphites to confirm')}</span></dd></div>
    </dl>
    ${w.dist.length ? `<div class="panel"><h2>${L('Distinctions', 'Awards')}</h2><div class="medals">${w.dist.map(medal).join('')}</div></div>` : ''}
    ${w.note ? `<div class="panel"><h2>${L('Notes de dégustation', 'Tasting notes')}</h2><blockquote>«&nbsp;${w.note}&nbsp;»</blockquote>${w.noteSrc ? `<cite>${w.noteSrc}</cite>` : `<cite>${L('Château Haut-Piquat', 'Château Haut-Piquat')}</cite>`}<p class="form-note" lang="en" style="margin-top:10px">Original note in French; English translation to be supplied.</p></div>` : ''}
    ${blend.length ? `<div class="panel"><h2>${L('Assemblage', 'Blend')}</h2><div class="blend" data-blend>${blend.map((b, i) => `<span style="flex:${b.pct} 1 0;background-image:url('${tex[i % 3]}')" data-blend-bar><i>${b.pct}&nbsp;%</i></span>`).join('')}</div><div class="blend-legend">${blend.map((b) => `<span>${b.pct}&nbsp;% ${b.name}</span>`).join('')}</div>${w.blendSrc === 'fiche' ? `<p class="form-note" style="margin-top:8px">${L('Assemblage tiré de la fiche technique, absent de la fiche boutique.', 'Blend taken from the tech sheet; missing from the shop page.')}</p>` : ''}</div>` : ''}
    ${w.pairs.length ? `<div class="panel"><h2>${L('Accords gastronomiques', 'Food pairings')}</h2><ul class="pairs">${w.pairs.map((p) => `<li><svg class="ast" aria-hidden="true"><use href="#ast"/></svg>${p}</li>`).join('')}</ul></div>` : ''}
    ${w.flag ? `<div class="flag">${L(w.flag.fr, w.flag.en)}</div>` : ''}`;
  // la cuvée
  $('[data-wcuvee-bottle]').src = BOTTLES[ch.bottle];
  $('[data-wcuvee-bottle]').alt = `Bouteille de ${ch.name}`;
  $('[data-wcuvee-title]').innerHTML = ch.name;
  $('[data-wcuvee-specs]').innerHTML = `<dt>${L('Appellation', 'Appellation')}</dt><dd>${ch.app}</dd><dt>${L('Surface', 'Area')}</dt><dd>${ch.area}</dd><dt>${L('Sol', 'Soil')}</dt><dd>${L(ch.soil.fr, ch.soil.en)}</dd><dt>${L('Élevage', 'Ageing')}</dt><dd>${L(ch.aging.fr, ch.aging.en)}</dd>`;
  $('[data-wcuvee-note]').innerHTML = L(ch.note.fr, ch.note.en);
  // vous aimerez aussi
  const rel = WINES.filter((x) => x.id !== w.id && x.ch === w.ch).slice(0, 3).concat(WINES.filter((x) => x.ch !== w.ch && x.badge === 'coeur').slice(0, 1));
  $('[data-related]').innerHTML = rel.map((x) => `<a class="pcard" href="vin.html?id=${x.id}" style="text-decoration:none"><span class="pcard__img"><img src="${x.img.small}" alt="" loading="lazy" width="${x.img.w}" height="${x.img.h}"></span><span class="pcard__body"><span style="font-weight:600">${CHATEAUX[x.ch].name} ${x.vintage}</span><span class="pcard__fmt">${L(FORMATS[x.fmt].label.fr, FORMATS[x.fmt].label.en)}</span><span class="pcard__price"><b>${eur(x.price)}</b></span></span></a>`).join('');
}

function bind() {
  let q = 1;
  $('[data-wine-info]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (b) { q = Math.max(1, Math.min(24, q + +b.dataset.q)); $('[data-qv]').textContent = q; }
    if (e.target.closest('[data-add-wine]')) addToCart(wine.id, q, $('[data-wine-pack] img'));
  });
}

export function setup() { render(); bind(); }
export function enter() {
  if (CALM) return;
  const pack = $('[data-wine-pack]');
  gsap.from(pack, { rotationY: -25, y: 60, autoAlpha: 0, duration: 1.4, ease: 'expo.out', transformPerspective: 1200 });
  gsap.from('[data-wine-info] > *', { y: 30, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.05, delay: 0.15 });
  gsap.from('[data-blend-bar]', { flexGrow: 0.001, duration: 1.4, ease: 'expo.inOut', stagger: 0.1, delay: 0.6 });
  gsap.from('.medal circle', { drawSVG: '0%', duration: 1.2, ease: 'power2.out', stagger: 0.08, delay: 0.6 });
  if (!TOUCH) {
    const rx = gsap.quickTo(pack, 'rotationX', { duration: 0.8, ease: 'power3' }); const ry = gsap.quickTo(pack, 'rotationY', { duration: 0.8, ease: 'power3' });
    gsap.set(pack, { transformPerspective: 1200 });
    pack.addEventListener('pointermove', (e) => { const r = pack.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 12); rx(-((e.clientY - r.top) / r.height - 0.5) * 9); });
    pack.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }
  // la bouteille de la cuvée pivote sur son socle au défilement
  const bottle = $('[data-wcuvee-bottle]');
  gsap.set(bottle, { transformPerspective: 800, xPercent: -50, x: 0 });
  gsap.fromTo(bottle, { rotationY: -38, yPercent: 8 }, { rotationY: 38, yPercent: -2, ease: 'none', scrollTrigger: { trigger: '[data-wcuvee-stage]', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
}
