// Château Haut-Piquat — socle commun : défilement, ouverture, curseur, langue, calme, âge, transitions.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const html = document.documentElement;
export const CALM = html.classList.contains('calm');
export const TOUCH = matchMedia('(pointer: coarse)').matches;
export const DESKTOP = () => innerWidth >= 900;
export const L = (fr, en) => (en == null ? fr : `<span lang="fr">${fr}</span><span lang="en">${en}</span>`);
export const lang = () => (html.lang === 'en' ? 'en' : 'fr');
export const eur = (n) => L(n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), n.toLocaleString('en-GB', { style: 'currency', currency: 'EUR' }));
export const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } },
  ses(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } },
};
export const px = (v) => parseFloat(getComputedStyle(html).getPropertyValue(v)) || 0;
export const hdrH = () => ($('[data-hdr]')?.offsetHeight || 64);
export const legalH = () => ($('[data-legal]')?.offsetHeight || 32);

let gsap, ScrollTrigger;

/* ---------- Défilement fluide (module maison, inspiré de Lenis) ---------- */
export const smooth = {
  enabled: false, target: 0, current: 0, raf: 0, locked: false,
  init() {
    if (CALM || TOUCH) return;
    this.enabled = true;
    this.target = this.current = scrollY;
    addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    addEventListener('scroll', () => { if (!this.raf) { this.target = this.current = scrollY; } }, { passive: true });
    addEventListener('resize', () => { this.target = this.current = scrollY; });
  },
  max() { return document.documentElement.scrollHeight - innerHeight; },
  onWheel(e) {
    if (!this.enabled || e.ctrlKey || this.locked) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // gestes horizontaux (retour arrière, galeries) laissés au navigateur
    if (e.target.closest && e.target.closest('[data-native-scroll], dialog, .cart, .mmenu')) {
      const sc = e.target.closest('[data-native-scroll], dialog, .cart, .mmenu');
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || sc.scrollHeight > sc.clientHeight) return;
    }
    e.preventDefault();
    let d = e.deltaY;
    if (e.deltaMode === 1) d *= 32; else if (e.deltaMode === 2) d *= innerHeight;
    this.target = Math.max(0, Math.min(this.max(), this.target + d));
    this.start();
  },
  start() { if (!this.raf) this.raf = requestAnimationFrame(() => this.tick()); },
  tick() {
    this.current += (this.target - this.current) * 0.12;
    if (Math.abs(this.target - this.current) < 0.5) { this.current = this.target; scrollTo(0, this.current); this.raf = 0; return; }
    scrollTo(0, this.current);
    this.raf = requestAnimationFrame(() => this.tick());
  },
  to(y, immediate = false) {
    y = Math.max(0, Math.min(this.max(), y));
    if (!this.enabled || immediate) { scrollTo({ top: y, behavior: immediate || CALM ? 'auto' : 'smooth' }); this.target = this.current = y; return; }
    this.target = y; this.start();
  },
  lock(on) { this.locked = on; document.body.style.overflow = on ? 'hidden' : ''; },
};
export function scrollToEl(el, immediate) {
  if (!el) return;
  const y = el.getBoundingClientRect().top + scrollY - hdrH() + 1;
  smooth.to(y, immediate);
}

/* ---------- Langue ---------- */
function applyLangAttrs() {
  const en = lang() === 'en';
  $$('[data-alt-en]').forEach((el) => { if (!el.dataset.altFr) el.dataset.altFr = el.alt; el.alt = en ? el.dataset.altEn : el.dataset.altFr; });
  $$('[data-aria-en]').forEach((el) => { if (!el.dataset.ariaFr) el.dataset.ariaFr = el.getAttribute('aria-label') || ''; el.setAttribute('aria-label', en ? el.dataset.ariaEn : el.dataset.ariaFr); });
  $$('[data-text-en]').forEach((el) => { if (!el.dataset.textFr) el.dataset.textFr = el.textContent; el.textContent = en ? el.dataset.textEn : el.dataset.textFr; });
  $$('[data-placeholder-en]').forEach((el) => { if (!el.dataset.phFr) el.dataset.phFr = el.placeholder; el.placeholder = en ? el.dataset.placeholderEn : el.dataset.phFr; });
}
export function onLang(fn) { document.addEventListener('ahp:lang', fn); }
function initLang() {
  applyLangAttrs();
  $$('[data-lang-toggle]').forEach((b) => b.addEventListener('click', () => {
    html.lang = lang() === 'en' ? 'fr' : 'en';
    store.set('ahp-lang', html.lang);
    applyLangAttrs();
    document.dispatchEvent(new CustomEvent('ahp:lang'));
    ScrollTrigger && ScrollTrigger.refresh();
  }));
}

/* ---------- Messages ---------- */
let toastT;
export function toast(msg, ms = 3800) {
  const t = $('[data-toast]'); if (!t) return;
  t.innerHTML = msg; t.classList.add('is-on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), ms);
}

/* ---------- Barres fixes : hauteurs réelles ---------- */
function initBars() {
  const set = () => {
    html.style.setProperty('--legal-h', legalH() + 'px');
    html.style.setProperty('--hdr-h', hdrH() + 'px');
  };
  set();
  new ResizeObserver(set).observe($('[data-legal]'));
}

/* ---------- En-tête et menu ---------- */
function initHeader() {
  const h = $('[data-hdr]');
  const upd = () => h.classList.toggle('is-solid', scrollY > 40 || document.body.dataset.page === 'vin' || document.body.dataset.page === 'informations');
  upd(); addEventListener('scroll', upd, { passive: true });
  const btn = $('[data-menu]'); const m = $('[data-mmenu]');
  const close = () => { if (!m.classList.contains('is-open')) return; m.classList.remove('is-open'); m.setAttribute('aria-hidden', 'true'); btn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); smooth.lock(false); $$('main, footer').forEach((el) => { el.inert = false; }); btn.focus({ preventScroll: true }); };
  btn?.addEventListener('click', () => {
    const open = !m.classList.contains('is-open');
    if (!open) return close();
    hideToast(); m.classList.add('is-open'); m.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true'); document.body.classList.add('menu-open'); smooth.lock(true); $$('main, footer').forEach((el) => { el.inert = true; }); setTimeout(() => $('nav a', m).focus({ preventScroll: true }), 120);
    if (!CALM && gsap) gsap.from($$('nav a', m), { y: 40, autoAlpha: 0, stagger: 0.05, duration: 0.7, ease: 'power3.out', delay: 0.15 });
  });
  $$('a', m).forEach((a) => a.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && m.classList.contains('is-open')) close(); });
}

/* ---------- Mode calme ---------- */
function initCalm() {
  $$('[data-calm]').forEach((b) => {
    b.setAttribute('aria-pressed', CALM ? 'true' : 'false');
    b.addEventListener('click', () => { store.set('ahp-calm', CALM ? '0' : '1'); location.reload(); });
  });
}

/* ---------- Son d'ambiance : vent dans les vignes, généré en code ---------- */
const sound = { ctx: null, gain: null, on: false };
function startSound() {
  if (!sound.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = new AC(); const len = ctx.sampleRate * 4; const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11; } }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.6;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06; const lfoG = ctx.createGain(); lfoG.gain.value = 260; lfo.connect(lfoG); lfoG.connect(lp.frequency);
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(lp); lp.connect(g); g.connect(ctx.destination); src.start(); lfo.start();
    sound.ctx = ctx; sound.gain = g;
  }
  sound.ctx.resume(); sound.gain.gain.setTargetAtTime(0.5, sound.ctx.currentTime, 1.2); sound.on = true;
}
function stopSound() { if (sound.ctx) sound.gain.gain.setTargetAtTime(0, sound.ctx.currentTime, 0.4); sound.on = false; }
/* Bouteille posée sur la pierre, seulement si le son d'ambiance est activé : un « toc » sourd et court */
export function thudSound() {
  if (!sound.on || !sound.ctx || sound.ctx.state !== 'running') return;
  const ctx = sound.ctx; const now = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(150, now); o.frequency.exponentialRampToValueAtTime(58, now + 0.16);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.5, now + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + 0.35);
  if (!sound.noise) { const n = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; sound.noise = n; }
  const src = ctx.createBufferSource(); src.buffer = sound.noise; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.2;
  const gn = ctx.createGain(); gn.gain.setValueAtTime(0.0001, now); gn.gain.exponentialRampToValueAtTime(0.18, now + 0.004); gn.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  src.connect(bp); bp.connect(gn); gn.connect(ctx.destination); src.start(now); src.stop(now + 0.1);
}
/* Bruit du vin versé, seulement si le son d'ambiance est activé : un glouglou dont la note monte à mesure que la jauge se remplit */
export function pourSound(dur = 1) {
  if (!sound.on || !sound.ctx || sound.ctx.state !== 'running') return null;
  const ctx = sound.ctx; const now = ctx.currentTime;
  if (!sound.noise) { const n = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; sound.noise = n; }
  const src = ctx.createBufferSource(); src.buffer = sound.noise; src.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 5;
  bp.frequency.setValueAtTime(380, now); bp.frequency.exponentialRampToValueAtTime(1150, now + Math.max(0.3, dur));
  const am = ctx.createGain(); am.gain.value = 0.55;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 8; const lg = ctx.createGain(); lg.gain.value = 0.4; lfo.connect(lg); lg.connect(am.gain);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(1, now + 0.06);
  src.connect(bp); bp.connect(am); am.connect(g); g.connect(ctx.destination); src.start(now); lfo.start(now);
  let done = false;
  return { stop() { if (done) return; done = true; const t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.setTargetAtTime(0, t, 0.05); src.stop(t + 0.35); lfo.stop(t + 0.35); } };
}
function initSound() {
  const btns = $$('[data-sound]');
  const sync = () => btns.forEach((b) => b.setAttribute('aria-pressed', sound.on ? 'true' : 'false'));
  btns.forEach((b) => b.addEventListener('click', () => { sound.on ? stopSound() : startSound(); store.set('ahp-sound', sound.on ? '1' : '0'); sync(); }));
  if (store.get('ahp-sound') === '1') {
    const once = () => { startSound(); sync(); removeEventListener('pointerdown', once); removeEventListener('keydown', once); };
    addEventListener('pointerdown', once); addEventListener('keydown', once);
  }
}

/* ---------- Curseur et boutons magnétiques ---------- */
function initCursor() {
  if (TOUCH || CALM) return;
  const c = $('[data-cursor]'); if (!c) return;
  html.classList.add('has-cursor');
  const xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); c.classList.add('is-on'); }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    c.classList.toggle('is-hover', !!t.closest('a, button, label, select, [data-cursor-hover]'));
    c.classList.toggle('on-dark', !!t.closest('.is-dark, .hero, .coupe, .phero, .ohero, .chai, .ftr, .mmenu'));
  });
}
function initMagnetic() {
  if (TOUCH || CALM) return;
  $$('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.28); yTo((e.clientY - r.top - r.height / 2) * 0.35); });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------- Voile de lumière : de midi au soir ---------- */
function initVeil() {
  if (CALM) return;
  const upd = () => { const p = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight); html.style.setProperty('--day', Math.pow(Math.min(1, p), 1.3).toFixed(3)); };
  upd(); addEventListener('scroll', upd, { passive: true });
}

/* ---------- Transitions de page ---------- */
function initTransitions() {
  const bands = $$('.ptrans span');
  const leave = (href) => {
    store.ses('ahp-trans', '1');
    if (CALM) { location.href = href; return; }
    gsap.set(bands, { transformOrigin: 'bottom' });
    gsap.to(bands, { scaleY: 1, duration: 0.5, ease: 'power3.inOut', stagger: 0.07, onComplete: () => { location.href = href; } });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a) return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || /^(mailto|tel):/.test(a.getAttribute('href'))) return;
    const samePage = url.pathname.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '') === location.pathname.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '');
    if (samePage && url.hash) { e.preventDefault(); const t = document.getElementById(decodeURIComponent(url.hash.slice(1))); if (t) { scrollToEl(t); history.replaceState(null, '', url.hash); } return; }
    if (samePage && url.search === location.search) return;
    e.preventDefault(); leave(url.href);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) { gsap.set(bands, { scaleY: 0 }); html.classList.remove('trans-in'); } });
}
function transIn() {
  const bands = $$('.ptrans span');
  if (!html.classList.contains('trans-in')) return 0;
  store.ses('ahp-trans', null);
  gsap.set(bands, { scaleY: 1, transformOrigin: 'top' });
  html.classList.remove('trans-in');
  gsap.to(bands, { scaleY: 0, duration: 0.65, ease: 'power3.inOut', stagger: 0.07, delay: 0.05 });
  return 1;
}

/* ---------- Filtre d'âge ---------- */
export function ageGate(delay = 0) {
  return new Promise((resolve) => {
    if (html.classList.contains('age-ok')) return resolve();
    const g = $('[data-agegate]');
    const bg = () => $$('main, footer, .hdr, .mmenu');
    const show = () => {
      g.classList.add('is-open'); smooth.lock(true); bg().forEach((el) => { el.inert = true; });
      if (!CALM) gsap.from($('.agegate__card', g), { y: 50, autoAlpha: 0, duration: 0.8, ease: 'power3.out' });
      $('[data-age-yes]', g).focus({ preventScroll: true });
    };
    delay ? setTimeout(show, delay * 1000) : show();
    $('[data-age-yes]', g).addEventListener('click', () => {
      store.set('ahp-age', 'ok'); html.classList.add('age-ok');
      const done = () => { g.classList.remove('is-open'); smooth.lock(false); bg().forEach((el) => { el.inert = false; }); resolve(); };
      CALM ? done() : gsap.to(g, { autoAlpha: 0, duration: 0.45, onComplete: () => { g.style.cssText = ''; done(); } });
    });
    $('[data-age-no]', g).addEventListener('click', () => g.classList.add('is-refused'));
    g.addEventListener('keydown', (e) => { if (e.key === 'Tab') { const f = $$('button', g); const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } } });
  });
}

/* ---------- Ouverture ---------- */
export function opening() {
  // Résout quand le chargement s'efface ; la page joue ensuite sa propre entrée.
  const loader = $('[data-loader]');
  if (CALM || !loader) { loader && loader.remove(); return Promise.resolve({ fromTrans: false }); }
  const fromTrans = transIn();
  if (fromTrans) { loader.remove(); return Promise.resolve({ fromTrans: true }); }
  return new Promise((resolve) => {
    const path = $('[data-ast-path]', loader); const hole = $('[data-ast-hole]', loader);
    const home = document.body.dataset.page === 'index';
    const tl = gsap.timeline({ onComplete: () => { loader.remove(); } });
    tl.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', duration: home ? 0.7 : 0.45, ease: 'power2.inOut' })
      .fromTo(hole, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.25, ease: 'power2.out' }, '-=0.2')
      .to(loader.querySelector('svg'), { rotate: 36, scale: 0.6, duration: 0.4, ease: 'power3.in' }, '+=0.02')
      .add(() => resolve({ fromTrans: false }), '-=0.32')
      .to(loader, { autoAlpha: 0, duration: 0.4, ease: 'power2.out' }, '-=0.25');
  });
}

/* ---------- Révélations, titres, compteurs ---------- */
// Les masques de SplitText coupent l'italique et les jambages : on les élargit, puis on rend le texte d'origine.
export function padMasks(split, kind) {
  const items = split[kind] || [];
  items.forEach((it) => { const m = it.parentElement; if (m && m !== split.elements?.[0]) { m.style.padding = '0.14em 0.2em 0.28em'; m.style.margin = '-0.14em -0.2em -0.28em'; } });
}
export function splitTitle(el, opts = {}) {
  if (CALM || !window.SplitText) return null;
  const s = SplitText.create(el, { type: 'words', mask: 'words' });
  padMasks(s, 'words');
  gsap.set(s.words, { yPercent: 115 });
  const anim = () => {
    gsap.to(s.words, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.06, delay: opts.delay || 0, onComplete: () => s.revert() });
    gsap.fromTo(el, { fontVariationSettings: '"SOFT" 0, "WONK" 0' }, { fontVariationSettings: '"SOFT" 100, "WONK" 0', duration: 1.8, ease: 'power2.out', delay: (opts.delay || 0) + 0.2, clearProps: 'fontVariationSettings' });
  };
  if (opts.now) anim(); else ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: anim });
  return s;
}
// Petite astérie qui s'allume à chaque validation (ajout au panier, réservation…)
export function spark(x, y) {
  if (CALM || !gsap) return;
  const d = document.createElement('div'); d.className = 'spark'; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = '<svg aria-hidden="true"><use href="#ast"/></svg>';
  d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d);
  gsap.fromTo(d, { scale: 0.2, rotate: -40, autoAlpha: 0 }, { scale: 1.3, rotate: 36, autoAlpha: 1, duration: 0.45, ease: 'back.out(2)' });
  gsap.to(d, { scale: 1.8, autoAlpha: 0, duration: 0.5, delay: 0.45, ease: 'power2.in', onComplete: () => d.remove() });
}
export function sparkAt(el) { if (!el) return; const r = el.getBoundingClientRect(); spark(r.left + r.width / 2, r.top + r.height / 2); }
export function hideToast() { const t = $('[data-toast]'); if (t) t.classList.remove('is-on'); }
function fmtCount(n, ref) {
  const s = Math.round(n).toString();
  return ref.includes(' ') ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s;
}
export function initReveals(root = document) {
  if (CALM) return;
  $$('[data-split]', root).forEach((el) => splitTitle(el));
  ScrollTrigger.batch($$('[data-reveal]', root), { start: 'top 90%', once: true, onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }) });
  $$('[data-count]', root).forEach((el) => {
    const ref = el.dataset.count; if (!/^[\d\s]+$/.test(ref)) return;
    const end = parseFloat(ref.replace(/\s/g, '')); if (isNaN(end) || (end >= 1800 && end <= 2100)) return;
    const o = { v: 0 };
    el.textContent = fmtCount(o.v, ref);
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = fmtCount(o.v, ref); } }) });
  });
}

/* ---------- Formulaires simulés, copie, fenêtre de dialogue ---------- */
const MODALS = {
  parc: {
    title: L('Un événement dans le parc', 'An event in the park'),
    intro: L('Festival, mariage, anniversaire, rassemblement de véhicules&nbsp;: décrivez votre projet, le domaine vous répondra.', 'Festival, wedding, birthday, car rally: describe your project and the estate will reply.'),
    extra: `<div class="field"><label for="m-type">${L('Type d\'événement', 'Type of event')}</label><select id="m-type">${[['Festival ou concert', 'Festival or concert'], ['Mariage', 'Wedding'], ['Anniversaire', 'Birthday'], ['Véhicules anciens ou lancement', 'Classic cars or launch'], ['Autre', 'Other']].map(([f, e]) => `<option data-text-en="${e}">${lang() === 'en' ? e : f}</option>`).join('')}</select></div>`,
  },
  groupe: {
    title: L('Votre projet de groupe', 'Your group project'),
    intro: L('Séminaire d\'entreprise, team building, anniversaire&nbsp;: expliquez-nous votre projet, nous vous répondrons dans les meilleurs délais.', 'Corporate seminar, team building, birthday: tell us about your project and we will reply as soon as possible.'),
    extra: `<div class="field"><label for="m-n">${L('Nombre de personnes', 'Number of people')}</label><input id="m-n" type="number" min="1" inputmode="numeric"></div>`,
  },
};
export function openModal(key) {
  const d = $('[data-modal]'); const m = MODALS[key]; if (!d || !m) return;
  $('[data-modal-body]', d).innerHTML = `<h2>${m.title}</h2><p class="muted">${m.intro}</p>
    <div class="form-grid two"><div class="field"><label for="m-name">${L('Nom', 'Name')} *</label><input id="m-name" required autocomplete="name"></div><div class="field"><label for="m-mail">E-mail *</label><input id="m-mail" type="email" required autocomplete="email"></div></div>
    ${m.extra}<div class="field"><label for="m-msg">Message *</label><textarea id="m-msg" required></textarea></div>
    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center"><button class="btn" value="send" type="submit">${L('Envoyer (simulation)', 'Send (simulation)')}</button><span class="form-note">${L('Rien n\'est envoyé&nbsp;: maquette.', 'Nothing is sent: mock-up.')}</span></div>`;
  applyLangAttrs();
  d.showModal(); smooth.lock(true);
}
function initForms() {
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.matches('[data-fake-form]')) { e.preventDefault(); if (!f.reportValidity()) return; f.reset(); toast(L('Message bien reçu&nbsp;! <small>(Maquette&nbsp;: rien n\'a été envoyé.)</small>', 'Message received! <small>(Mock-up: nothing was sent.)</small>')); }
  });
  const d = $('[data-modal]');
  if (d) {
    d.addEventListener('close', () => { smooth.lock(false); if (d.returnValue === 'send') toast(L('Demande bien reçue&nbsp;! <small>(Maquette&nbsp;: rien n\'a été envoyé.)</small>', 'Request received! <small>(Mock-up: nothing was sent.)</small>')); });
    d.addEventListener('click', (e) => { if (e.target === d) d.close('cancel'); });
  }
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open-modal]'); if (o) openModal(o.dataset.openModal);
    const c = e.target.closest('[data-copy]');
    if (c) { (navigator.clipboard ? navigator.clipboard.writeText(c.dataset.copy) : Promise.reject()).then(() => toast(L('Coordonnées GPS copiées.', 'GPS coordinates copied.')), () => toast(c.dataset.copy)); }
  });
}

/* ---------- Démarrage ---------- */
/* Fil de lecture : une ligne ocre sous l'en-tête suit la progression dans la page */
function initProgress() {
  const hdr = $('.hdr'); if (!hdr) return;
  const bar = document.createElement('span'); bar.className = 'hdr__progress'; bar.setAttribute('aria-hidden', 'true'); hdr.appendChild(bar);
  // retour en haut : une astérie qui tourne avec la lecture, cerclée de sa progression
  const top = document.createElement('button'); top.type = 'button'; top.className = 'totop';
  top.dataset.ariaFr = 'Revenir en haut de la page'; top.dataset.ariaEn = 'Back to top'; top.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Back to top' : 'Revenir en haut de la page');
  top.innerHTML = '<svg class="totop__ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/><circle class="p" cx="24" cy="24" r="21"/></svg><svg class="totop__ast" aria-hidden="true"><use href="#ast"/></svg>';
  document.body.appendChild(top);
  top.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: CALM ? 'auto' : 'smooth' }); if (!CALM) gsap.fromTo($('.totop__ast', top), { rotation: 0 }, { rotation: -360, duration: 1, ease: 'power3.out' }); });
  const ring = $('.p', top); const ast = $('.totop__ast', top); const C = 2 * Math.PI * 21;
  ring.style.strokeDasharray = C.toFixed(1);
  let raf = 0;
  const upd = () => {
    raf = 0; const max = document.documentElement.scrollHeight - innerHeight; const pr = max > 0 ? Math.min(1, scrollY / max) : 0;
    bar.style.transform = `scaleX(${pr.toFixed(4)})`;
    ring.style.strokeDashoffset = (C * (1 - pr)).toFixed(1); ast.style.transform = `rotate(${(pr * 360).toFixed(1)}deg)`;
    top.classList.toggle('is-on', scrollY > innerHeight * 1.2);
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
  addEventListener('resize', upd); upd();
}
export function initCore() {
  gsap = window.gsap; ScrollTrigger = window.ScrollTrigger;
  window.__ahpReady = true;
  gsap.registerPlugin(ScrollTrigger, window.SplitText, window.DrawSVGPlugin, window.CustomEase, window.Flip);
  ScrollTrigger.config({ ignoreMobileResize: true });
  initBars(); initLang(); initHeader(); initCalm(); initSound(); initForms();
  smooth.init();
  if (!CALM) { initCursor(); initMagnetic(); initVeil(); }
  initTransitions(); initProgress();
  return { gsap, ScrollTrigger };
}
