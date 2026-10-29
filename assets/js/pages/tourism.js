// Visites & événements : passage de l'arche, atelier écriVins, journée dans le Libournais, réservation simulée, accès et parc.
import { $, $$, L, eur, CALM, TOUCH, DESKTOP, hdrH, scrollToEl, toast, lang, padMasks, sparkAt } from '../core.js?v=15';
import { ACTIVITIES } from '../data.js?v=15';
import { parc, buildMap, mapAnim } from './places.js?v=15';

const gsap = window.gsap; const ST = window.ScrollTrigger;

/* ---------- Jours fériés (France métropolitaine) ---------- */
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, month - 1, day));
}
const iso = (d) => d.toISOString().slice(0, 10);
function holidays(y) {
  const e = easter(y); const add = (n) => iso(new Date(e.getTime() + n * 864e5));
  return new Set([`${y}-01-01`, `${y}-05-01`, `${y}-05-08`, `${y}-07-14`, `${y}-08-15`, `${y}-11-01`, `${y}-11-11`, `${y}-12-25`, add(1), add(39), add(50)]);
}

/* ---------- Réservation simulée ---------- */
function initBooking() {
  const form = $('[data-booking]'); if (!form) return;
  const list = $('[data-formule-list]'); const date = $('[data-bdate]'); const n = $('[data-bn]');
  const alert = $('[data-balert]'); const sum = $('[data-bsum]'); const sumL = $('[data-bsum-label]'); const submit = $('[data-bsubmit]');
  const pre = new URLSearchParams(location.search).get('formule');
  list.innerHTML = ACTIVITIES.map((a, i) => `<label><input type="radio" name="formule" value="${a.id}" ${(pre ? pre === a.id : i === 0) ? 'checked' : ''}><span><b>${L(a.name.fr, a.name.en)}</b><small>${L(a.dur.fr, a.dur.en)} · ${L(`${a.min} à ${a.max} pers.`, `${a.min} to ${a.max} people`)}</small></span><span class="p">${eur(a.price)}</span></label>`).join('');
  const t = new Date(); t.setDate(t.getDate() + 1); date.min = iso(new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())));
  const cur = () => ACTIVITIES.find((a) => a.id === (form.formule.value || 'visite'));
  function update() {
    const a = cur(); n.min = a.min; n.max = a.max;
    if (!n.value || +n.value < a.min) n.value = a.min; if (+n.value > a.max) n.value = a.max;
    const total = a.price * (+n.value || 0);
    sumL.innerHTML = L(`${n.value} × ${a.price}&nbsp;€`, `${n.value} × €${a.price}`); sum.innerHTML = eur(total);
    let msg = ''; let block = false;
    if (date.value) {
      const d = new Date(date.value + 'T12:00:00'); const day = d.getDay();
      if (day === 0 || day === 6 || holidays(d.getFullYear()).has(date.value)) {
        block = true;
        msg = L(`Le ${day === 0 ? 'dimanche' : day === 6 ? 'samedi' : 'jour férié'}, la réservation se fait uniquement par téléphone&nbsp;: <a class="link" href="tel:+33685304242">+33 6 85 30 42 42</a>.`, `On ${day === 0 ? 'Sundays' : day === 6 ? 'Saturdays' : 'public holidays'}, bookings are by phone only: <a class="link" href="tel:+33685304242">+33 6 85 30 42 42</a>.`);
      } else if (a.meal) {
        msg = L('Formule avec repas&nbsp;: annulation possible jusqu\'à 72&nbsp;h avant.', 'Experience with a meal: cancellation up to 72 hours before.');
      }
    }
    alert.innerHTML = msg; alert.classList.toggle('is-on', !!msg); submit.disabled = block;
  }
  const IMG = { visite: 'chateau-facade', ecrivins: 'table-ecrivins', journee: 'cour-tables-barriques', repas: 'parc-pelouse-cedre' };
  const recap = $('[data-brecap]'); const done = $('[data-bdone]');
  function renderRecap() {
    if (!recap) return;
    const a = cur(); const card = $(`[data-pick="${a.id}"]`)?.closest('.tcard'); const ul = card ? $('ul', card) : null;
    recap.innerHTML = `<span class="frame"><img src="assets/img/photos/${IMG[a.id]}-640.webp" alt="" width="640" height="360" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover"></span>
      <b>${L(a.name.fr, a.name.en)}</b>
      <p class="small muted" style="margin:0">${L(a.dur.fr, a.dur.en)} · ${L(`${a.min} à ${a.max} pers.`, `${a.min} to ${a.max} people`)} · ${L(`${a.price}&nbsp;€ par personne`, `€${a.price} per person`)}</p>
      ${ul ? `<ul>${ul.innerHTML}</ul>` : ''}
      <p class="form-note" style="margin:0">${a.online ? L('Réservable en ligne sur le site actuel.', 'Bookable online on the current website.') : L('Sur demande auprès du domaine.', 'On request from the estate.')}</p>`;
  }
  const fieldOf = (el) => el.closest('.field') || el.closest('.check');
  function setErr(el, bad) { const f = fieldOf(el); if (f) f.classList.toggle('is-invalid', bad); el.setAttribute('aria-invalid', bad ? 'true' : 'false'); }
  function validate() {
    const a = cur(); const nv = +n.value; const errs = [];
    const checks = [[date, !date.value || (date.min && date.value < date.min)], [n, !nv || nv < a.min || nv > a.max], [form['b-name'], !form['b-name'].value.trim()], [form['b-mail'], !form['b-mail'].checkValidity() || !form['b-mail'].value], [$('[data-bage]', form), !$('[data-bage]', form).checked]];
    checks.forEach(([el, bad]) => { setErr(el, bad); if (bad) errs.push(el); });
    const en = $('[data-err-n]'); if (en) en.innerHTML = L(`De ${a.min} à ${a.max} personnes pour cette formule.`, `${a.min} to ${a.max} people for this experience.`);
    return errs;
  }
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') validate(); });
  form.addEventListener('change', () => { update(); renderRecap(); }); n.addEventListener('input', update); update(); renderRecap();
  document.addEventListener('ahp:lang', renderRecap);
  function ics(a, dateStr, people) {
    const d = dateStr.replace(/-/g, ''); const nx = new Date(dateStr + 'T12:00:00Z'); nx.setUTCDate(nx.getUTCDate() + 1); const d2 = nx.toISOString().slice(0, 10).replace(/-/g, '');
    const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chateau Haut-Piquat//Maquette//FR', 'BEGIN:VEVENT', `UID:${Date.now()}@chateau-haut-piquat-maquette`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${d2}`, `SUMMARY:${a.name.fr} (simulation)`, `DESCRIPTION:${people} pers. Demande simulee - horaire a confirmer par le domaine.`, 'LOCATION:Chateau Haut-Piquat\\, 33570 Lussac', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return URL.createObjectURL(new Blob([txt], { type: 'text/calendar' }));
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length) { scrollToEl(fieldOf(errs[0]) || errs[0]); setTimeout(() => errs[0].focus({ preventScroll: true }), 450); return; }
    const a = cur(); const d = new Date(date.value + 'T12:00:00');
    const dl = d.toLocaleDateString(lang() === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const people = +n.value;
    done.innerHTML = `<svg class="ast" aria-hidden="true"><use href="#ast"/></svg>
      <h3 class="h3" style="margin:0">${L('Demande prête', 'Request ready')}</h3>
      <p class="muted" style="margin:0">${L('Simulation&nbsp;: rien n\'a été envoyé. Sur le site réel, le domaine confirmerait l\'horaire par e-mail.', 'Simulation: nothing was sent. On the live site, the estate would confirm the time by email.')}</p>
      <dl><dt>${L('Formule', 'Experience')}</dt><dd>${L(a.name.fr, a.name.en)}</dd><dt>Date</dt><dd>${dl}</dd><dt>${L('Personnes', 'People')}</dt><dd>${people}</dd><dt>Total</dt><dd>${eur(a.price * people)}</dd></dl>
      <div style="display:flex;flex-wrap:wrap;gap:10px"><a class="btn btn--sm" href="${ics(a, date.value, people)}" download="visite-chateau-haut-piquat.ics">${L('Ajouter au calendrier', 'Add to calendar')}</a><a class="btn btn--ghost btn--sm" href="#acces">${L('Comment venir', 'Getting here')}</a><button class="link small" type="button" style="border:0;background:none;padding:0;min-height:44px" data-bagain>${L('Nouvelle réservation', 'New booking')}</button></div>`;
    form.hidden = true; done.classList.add('is-on'); scrollToEl(done); setTimeout(() => { done.focus({ preventScroll: true }); sparkAt($('.ast', done)); }, 700);
    if (window.gsap && !CALM) gsap.from(done.children, { y: 18, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06 });
  });
  done?.addEventListener('click', (e) => {
    if (!e.target.closest('[data-bagain]')) return;
    done.classList.remove('is-on'); done.innerHTML = ''; form.hidden = false; form.reset(); $$('.is-invalid', form).forEach((f) => f.classList.remove('is-invalid')); update(); renderRecap(); scrollToEl(form);
  });
  document.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pick]'); if (!p) return;
    const r = $(`input[name="formule"][value="${p.dataset.pick}"]`, form); if (r) { r.checked = true; update(); renderRecap(); }
  });
}

/* ---------- Atelier écriVins (illustratif) ---------- */
const GRAPES = {
  m: { name: 'Merlot', col: [110, 28, 48], fr: 'élégance raffinée, gras en bouche, un côté accessible et flatteur', en: 'refined elegance, roundness and an approachable, generous side' },
  cf: { name: 'Cabernet franc', col: [128, 34, 62], fr: 'des vins plus tanniques et très aromatiques', en: 'more tannic, highly aromatic wines' },
  cs: { name: 'Cabernet sauvignon', col: [62, 20, 46], fr: 'des notes épicées, des tannins renforcés et l\'aptitude au vieillissement', en: 'spicy notes, firmer tannins and ageing potential' },
};
function initEcri() {
  const box = $('[data-ecri]'); if (!box) return;
  const inputs = $$('[data-grape]', box); const vals = { m: 60, cf: 25, cs: 15 };
  const set = () => {
    inputs.forEach((i) => { i.value = vals[i.dataset.grape]; $(`[data-out="${i.dataset.grape}"]`, box).textContent = `${vals[i.dataset.grape]} %`; });
    const mix = [0, 1, 2].map((c) => Math.round((GRAPES.m.col[c] * vals.m + GRAPES.cf.col[c] * vals.cf + GRAPES.cs.col[c] * vals.cs) / 100));
    const disc = $('[data-robe]', box); disc.style.background = `radial-gradient(circle at 35% 30%, rgba(255,255,255,.18), transparent 45%), rgb(${mix.join(',')})`;
    let acc = 0; ['cs', 'cf', 'm'].forEach((k) => { acc += vals[k]; const s = $(`[data-robe-${k}]`, box); s.style.height = acc + '%'; s.style.background = `rgba(${GRAPES[k].col.join(',')},.35)`; s.style.zIndex = 3 - ['cs', 'cf', 'm'].indexOf(k); });
    const order = Object.keys(vals).sort((a, b) => vals[b] - vals[a]).filter((k) => vals[k] > 0);
    const [d, ...rest] = order;
    $('[data-profile]', box).innerHTML = L(
      `<b>Dominante ${GRAPES[d].name.toLowerCase()} (${vals[d]}&nbsp;%)</b>&nbsp;: ${GRAPES[d].fr}.` + rest.map((k) => ` Le ${GRAPES[k].name.toLowerCase()} (${vals[k]}&nbsp;%) apporte ${GRAPES[k].fr}.`).join(''),
      `<b>${GRAPES[d].name}-led (${vals[d]}%)</b>: ${GRAPES[d].en}.` + rest.map((k) => ` ${GRAPES[k].name} (${vals[k]}%) brings ${GRAPES[k].en}.`).join(''));
  };
  // la robe tourne dans le verre quand on déplace un curseur
  const disc = $('[data-robe]', box); let spin = 0;
  const swirl = !CALM && window.gsap ? gsap.quickTo(disc, 'rotation', { duration: 0.9, ease: 'power3.out' }) : null;
  inputs.forEach((inp) => inp.addEventListener('input', () => {
    const k = inp.dataset.grape; const v = +inp.value;
    if (swirl) { spin += (v - vals[k]) * 2.4; swirl(spin); gsap.fromTo(disc, { scale: 0.95 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, .45)', overwrite: 'auto' }); } const others = Object.keys(vals).filter((x) => x !== k);
    const restOld = others.reduce((s, x) => s + vals[x], 0); const restNew = 100 - v;
    vals[k] = v;
    if (restOld === 0) { others.forEach((x) => { vals[x] = Math.round(restNew / 2); }); }
    else { others.forEach((x) => { vals[x] = Math.round(vals[x] / restOld * restNew); }); }
    const diff = 100 - (vals.m + vals.cf + vals.cs); vals[others[0]] += diff;
    set();
  }));
  set();
}

/* ---------- Plan de la journée ---------- */
function buildDayMap() {
  const g = $('[data-daymap-art]'); if (!g) return;
  // Château Chatain : position du village de Néac (adresse exacte à confirmer)
  const P = { hp: [44.948468, -0.10066], neac: [44.935, -0.178], se: [44.8944, -0.1556], lib: [44.9153, -0.2439], pom: [44.93, -0.207] };
  const proj = ([lat, lon]) => [((lon + 0.29) / 0.24) * 800, (1 - (lat - 44.87) / 0.11) * 640];
  const [hx, hy] = proj(P.hp); const [nx, ny] = proj(P.neac);
  const t = (k, name, anchor = 'start') => { const [x, y] = proj(P[k]); return `<g class="town"><circle cx="${x}" cy="${y}" r="4"/><text x="${x + (anchor === 'end' ? -10 : 10)}" y="${y + 4}" text-anchor="${anchor}">${name}</text></g>`; };
  const path = (pts) => 'M' + pts.map(proj).map((q) => q.map((v) => v.toFixed(1)).join(' ')).join(' L');
  const dord = [[44.86, -0.04], [44.872, -0.13], [44.884, -0.19], [44.912, -0.247], [44.93, -0.3]];
  const isle = [[45.0, -0.19], [44.96, -0.218], [44.915, -0.245]];
  g.innerHTML = `<rect width="800" height="640" fill="#F6F1E7"/><path class="river" d="${path(dord)}"/><path class="river" d="${path(isle)}"/>
    <path d="M${nx} ${ny} C ${nx + 120} ${ny - 90}, ${hx - 160} ${hy + 60}, ${hx} ${hy}" fill="none" stroke="#9B4B33" stroke-width="2.5" stroke-dasharray="7 7" data-dayroute/>
    ${t('lib', 'Libourne', 'end')}${t('se', 'Saint-Émilion')}${t('pom', 'Pomerol', 'end')}
    <g><circle cx="${nx}" cy="${ny}" r="9" fill="#1F1B16"/><text x="${nx - 14}" y="${ny - 14}" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="18" fill="#1F1B16">Château Chatain</text><text x="${nx - 14}" y="${ny + 4}" text-anchor="end" font-size="12" fill="#6B6052" font-family="Manrope, sans-serif">Néac</text></g>
    <g class="home"><circle class="pulse" cx="${hx}" cy="${hy}" r="16"/><circle cx="${hx}" cy="${hy}" r="9" fill="#9B4B33"/><text x="${hx - 14}" y="${hy - 16}" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="18" fill="#1F1B16">Château Haut-Piquat</text><text x="${hx - 14}" y="${hy + 2}" text-anchor="end" font-size="12" fill="#6B6052" font-family="Manrope, sans-serif">Lussac</text></g>`;
}

export function setup() { initBooking(); initEcri(); buildDayMap(); buildMap(); }

export function enter() {
  if (CALM) return;
  const t = $('[data-hero-title]');
  const s = window.SplitText ? SplitText.create(t, { type: 'chars', mask: 'chars' }) : null;
  if (s) { padMasks(s, 'chars'); gsap.from(s.chars, { yPercent: 115, duration: 1, ease: 'expo.out', stagger: 0.03, delay: 0.1, onComplete: () => s.revert() }); }
  gsap.from('.ohero__content p, .ohero__content .hero__ctas, .ohero__label', { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.45 });
  // passer l'arche : l'image grandit au défilement, on entre dans le vignoble
  gsap.fromTo('[data-arch]', { scale: 1.06 }, { scale: DESKTOP() ? 2.3 : 1.7, ease: 'none', scrollTrigger: { trigger: '[data-ohero]', start: 'top top', end: () => `+=${innerHeight * 0.9}`, scrub: 0.6, pin: true, anticipatePin: 1 } });
  gsap.to('.ohero__content', { autoAlpha: 0, y: -60, ease: 'none', scrollTrigger: { trigger: '[data-ohero]', start: 'top top', end: () => `+=${innerHeight * 0.5}`, scrub: true } });
  // frise de la journée
  gsap.to('[data-tl-fill]', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '[data-tl]', start: 'top 75%', end: 'bottom 55%', scrub: true } });
  $$('[data-tl-item]').forEach((li) => gsap.from(li, { x: -20, autoAlpha: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 85%', once: true } }));
  gsap.from('[data-dayroute]', { drawSVG: '0%', duration: 2, ease: 'power2.inOut', scrollTrigger: { trigger: '[data-daymap]', start: 'top 75%', once: true } });
  gsap.from('[data-robe]', { scale: 0.6, autoAlpha: 0, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: '[data-ecri]', start: 'top 80%', once: true } });
  parc();
  mapAnim();
}
