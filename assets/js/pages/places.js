// Parc et accès : mosaïque en parallaxe, plan schématique et boussole.
import { $, $$, L, TOUCH } from '../core.js?v=8';

const gsap = window.gsap; const ST = window.ScrollTrigger;

/* ---------- Parc : mosaïque en parallaxe croisée ---------- */
export function parc() {
  $$('[data-mosaic] [data-speed]').forEach((f) => {
    gsap.fromTo($('img', f), { yPercent: -(+f.dataset.speed) }, { yPercent: +f.dataset.speed, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.from(['[data-heli-ring]', '[data-heli-h]'], { drawSVG: '0%', duration: 1.6, ease: 'power2.inOut', stagger: 0.3, scrollTrigger: { trigger: '[data-heli-ring]', start: 'top 90%', once: true } });
}

/* ---------- Accès : plan schématique et boussole ---------- */
const PLACES = {
  home: [44.948468, -0.10066], se: [44.8944, -0.1556], lib: [44.9153, -0.2439], bdx: [44.8378, -0.5792], mon: [44.9306, -0.1286],
};
function proj([lat, lon]) {
  // projection équirectangulaire du Libournais dans la boîte 800 x 640
  const x0 = -0.66, x1 = 0.02, y0 = 44.79, y1 = 45.01;
  const x = ((lon - x0) / (x1 - x0)) * 800; const y = (1 - (lat - y0) / (y1 - y0)) * 640;
  return [x, y];
}
export function buildMap() {
  const g = $('[data-map-art]'); if (!g) return;
  const [hx, hy] = proj(PLACES.home);
  const town = (k, name, sub, anchor = 'start', dx = 10, dy = 4) => { const [x, y] = proj(PLACES[k]); return `<g class="town"><circle cx="${x}" cy="${y}" r="4.5"/><text x="${x + (anchor === 'end' ? -dx : dx)}" y="${y + dy}" text-anchor="${anchor}">${name}</text>${sub ? `<text class="sub" x="${x + (anchor === 'end' ? -dx : dx)}" y="${y + dy + 16}" text-anchor="${anchor}">${sub}</text>` : ''}</g>`; };
  const route = (k) => { const [x, y] = proj(PLACES[k]); const mx = (x + hx) / 2, my = (y + hy) / 2 + 30; return `<path class="route" d="M${hx} ${hy} Q${mx} ${my} ${x} ${y}" data-route/>`; };
  // rivières schématiques : la Dordogne longe Saint-Émilion, reçoit l'Isle à Libourne et rejoint la Garonne au Bec d'Ambès
  const dord = [[44.852, 0.03], [44.858, -0.05], [44.872, -0.13], [44.884, -0.19], [44.912, -0.247], [44.945, -0.33], [44.985, -0.44], [45.04, -0.56]].map(proj);
  const isle = [[45.04, -0.12], [45.0, -0.19], [44.96, -0.218], [44.915, -0.245]].map(proj);
  const garo = [[44.79, -0.5], [44.82, -0.545], [44.845, -0.565], [44.88, -0.54], [44.94, -0.555], [45.04, -0.565]].map(proj);
  const path = (pts) => 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L');
  g.innerHTML = `
    <rect width="800" height="640" fill="#F6F1E7"/>
    <g opacity=".5">${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="640" stroke="#1F1B16" stroke-opacity=".06"/>`).join('')}${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="800" y2="${i * 100}" stroke="#1F1B16" stroke-opacity=".06"/>`).join('')}</g>
    <path class="river" d="${path(dord)}"/><path class="river" d="${path(isle)}"/><path class="river" d="${path(garo)}"/>
    <text x="${dord[5][0] + 14}" y="${dord[5][1] + 22}" font-size="12" font-style="italic" fill="#6F8D96" font-family="Fraunces, Georgia, serif">Dordogne</text>
    <text x="${isle[1][0] + 12}" y="${isle[1][1]}" font-size="12" font-style="italic" fill="#6F8D96" font-family="Fraunces, Georgia, serif">Isle</text>
    <text x="${garo[3][0] + 10}" y="${garo[3][1] - 14}" font-size="12" font-style="italic" fill="#6F8D96" font-family="Fraunces, Georgia, serif">Garonne</text>
    ${route('se')}${route('lib')}${route('bdx')}
    ${town('bdx', 'Bordeaux', '56 km')}${town('lib', 'Libourne', '', 'end')}${town('se', 'Saint-Émilion', '8,7 km', 'start', 10, 18)}${town('mon', 'Montagne', '', 'end', 10, -8)}
    <g class="home"><circle class="pulse" cx="${hx}" cy="${hy}" r="16"/><circle cx="${hx}" cy="${hy}" r="7" fill="#9B4B33"/><text x="${hx - 14}" y="${hy - 16}" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="17" fill="#1F1B16">Château Haut-Piquat</text><text x="${hx - 14}" y="${hy + 2}" text-anchor="end" font-size="12" fill="#6B6052" font-family="Manrope, sans-serif">Lussac</text></g>`;
}
function bearing(a, b) {
  const toR = Math.PI / 180; const [la1, lo1] = a.map((v) => v * toR); const [la2, lo2] = b.map((v) => v * toR);
  const y = Math.sin(lo2 - lo1) * Math.cos(la2); const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(lo2 - lo1);
  return (Math.atan2(y, x) / toR + 360) % 360;
}
export function mapAnim() {
  const b = Math.round(bearing(PLACES.bdx, PLACES.home));
  const bt = $('[data-bearing]'); if (bt) bt.insertAdjacentHTML('beforeend', ' ' + L(`Cap ${b}° depuis Bordeaux.`, `Bearing ${b}° from Bordeaux.`));
  gsap.from('[data-route]', { drawSVG: '0%', duration: 1.8, ease: 'power2.inOut', stagger: 0.25, scrollTrigger: { trigger: '[data-map]', start: 'top 75%', once: true } });
  const needle = $('[data-needle]');
  ST.create({ trigger: '[data-map]', start: 'top 75%', once: true, onEnter: () => gsap.fromTo(needle, { rotation: -540, svgOrigin: '50 50' }, { rotation: b, svgOrigin: '50 50', duration: 2.6, ease: 'elastic.out(1, 0.35)' }) });
  if (!TOUCH) {
    const map = $('[data-map]'); const rTo = gsap.quickTo(needle, 'rotation', { duration: 1.2, ease: 'power3' });
    map.addEventListener('pointermove', (e) => { const r = map.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5; rTo(b + x * 24); });
    map.addEventListener('pointerleave', () => rTo(b));
  }
}
