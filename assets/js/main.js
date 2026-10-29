// Point d'entrée : socle commun, panier, puis module de la page.
import { initCore, initReveals, opening, ageGate, CALM, $, scrollToEl } from './core.js?v=11';
import { initCart } from './cart.js?v=11';

const page = document.body.dataset.page;
const loaders = {
  index: () => import('./pages/home.js?v=11'),
  boutique: () => import('./pages/shop.js?v=11'),
  vin: () => import('./pages/wine.js?v=11'),
  oenotourisme: () => import('./pages/tourism.js?v=11'),
  domaine: () => import('./pages/domain.js?v=11'),
  vins: () => import('./pages/cellar.js?v=11'),
};

async function boot() {
  if (!window.gsap || !window.ScrollTrigger) { document.documentElement.classList.add('calm'); return; }
  initCore();
  initCart();
  const mod = loaders[page] ? await loaders[page]() : null;
  if (mod && mod.setup) mod.setup();
  const res = await opening();
  if (mod && mod.enter) mod.enter(res); else genericEnter();
  initReveals();
  ageGate(CALM ? 0 : page === 'index' && !res.fromTrans ? 1.1 : 0.5);
  // Ancre dans l'adresse : y aller une fois les sections épinglées en place.
  if (location.hash) {
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t) setTimeout(() => { window.ScrollTrigger.refresh(); scrollToEl(t, true); }, CALM ? 50 : 900);
  }
  addEventListener('load', () => window.ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => window.ScrollTrigger.refresh());
}

function genericEnter() {
  if (CALM) return;
  const t = $('[data-hero-title]');
  if (t) window.gsap.from(t, { y: 40, autoAlpha: 0, duration: 1, ease: 'power3.out' });
}

boot();
