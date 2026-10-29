// Audit automatique de la maquette Château Haut-Piquat.
// Lancement : node _audit/audit.js [--rapide] [--films]   (depuis le dossier du site, Playwright installé)
// Le site est servi en local avec des adresses sans « .html », comme sur Vercel. Rapport : _audit/rapport.md
const http = require('http'); const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'); const OUT = __dirname;
const ARGS = process.argv.slice(2); const RAPIDE = ARGS.includes('--rapide'); const FILMS = ARGS.includes('--films');
const CAPT = process.env.AUDIT_CAPTURES || path.join(require('os').tmpdir(), 'audit-captures');
fs.mkdirSync(CAPT, { recursive: true });
const PAGES = ['/', '/domaine', '/vins', '/boutique', '/vin?id=hp-2020', '/oenotourisme', '/informations', '/page-inexistante'];
const SIZES = RAPIDE ? [[390, 844, 1], [1000, 560], [1440, 900]] : [[320, 568, 1], [375, 667, 1], [390, 844, 1], [844, 390, 1], [768, 1024, 1], [1024, 768, 1], [1000, 560], [1280, 720], [1366, 768], [1440, 900], [1728, 1000], [1920, 1080], [2560, 1440]];
const PIN_SIZES = [[1000, 560], [1024, 640], [1280, 720], [1366, 768], [1440, 900], [1728, 1000], [1920, 1080], [2560, 1440]];
const TYPES = { html: 'text/html; charset=utf-8', css: 'text/css', js: 'text/javascript', json: 'application/json', webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml', woff2: 'font/woff2', mp4: 'video/mp4', txt: 'text/plain' };
// petit serveur statique, adresses propres comme Vercel (cleanUrls)
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index';
      let f = path.join(ROOT, p); if (!path.extname(f)) f += '.html';
      if (!f.startsWith(ROOT) || !fs.existsSync(f)) { f = path.join(ROOT, '404.html'); rsp.statusCode = 404; }
      const ext = path.extname(f).slice(1); rsp.setHeader('Content-Type', TYPES[ext] || 'application/octet-stream');
      fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}
const R = []; const add = (cat, where, msg) => R.push({ cat, where, msg });

// ---------- contrôles statiques ----------
function statics() {
  const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const hs = (vj.headers || []).flatMap((h) => h.headers || []);
  if (hs.some((h) => /cache-control/i.test(h.key))) add('config', 'vercel.json', 'règle Cache-Control présente (à retirer)');
  if (!hs.some((h) => h.key === 'X-Robots-Tag' && /noindex/.test(h.value))) add('config', 'vercel.json', 'X-Robots-Tag noindex manquant');
  ['X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options'].forEach((k) => { if (!hs.some((h) => h.key === k)) add('config', 'vercel.json', `en-tête ${k} manquant`); });
  const rb = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8'); if (/Disallow:\s*\/\s*$/m.test(rb)) add('config', 'robots.txt', 'Disallow: / empêche Google de lire le noindex');
  const vers = new Set();
  const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  const js = []; (function walk(d) { fs.readdirSync(d).forEach((f) => { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!/vendor|_audit|node_modules/.test(p)) walk(p); } else if (f.endsWith('.js')) js.push(p); }); })(path.join(ROOT, 'assets/js'));
  [...files.map((f) => path.join(ROOT, f)), ...js].forEach((p) => { const t = fs.readFileSync(p, 'utf8'); (t.match(/\?v=(\d+)/g) || []).forEach((m) => vers.add(m)); });
  if (vers.size !== 1) add('config', 'versions', `numéros ?v= différents : ${[...vers].join(', ')}`);
  files.forEach((f) => {
    const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if (!/<meta name="robots" content="noindex, nofollow">/.test(t)) add('config', f, 'meta robots noindex manquant');
    const og = (t.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
    if (!og) add('config', f, 'og:image manquant'); else { if (!/^https:\/\//.test(og)) add('config', f, 'og:image non absolue'); if (!/\.(jpe?g|png)$/i.test(og)) add('config', f, 'og:image doit être en JPG ou PNG'); }
    if (!/og:image:width" content="1200"/.test(t) || !/og:image:height" content="630"/.test(t)) add('config', f, 'og:image:width/height 1200×630 manquants');
    if (!/twitter:card" content="summary_large_image"/.test(t)) add('config', f, 'twitter:card manquant');
  });
  if (!fs.existsSync(path.join(ROOT, '.vercelignore')) || !/_audit/.test(fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8'))) add('config', '.vercelignore', '_audit/ doit être exclu de la mise en ligne');
  return [...vers][0];
}

// ---------- mesures dans la page (exécutées dans le navigateur) ----------
function pageMeasures(touch) {
  const vis = (el) => { if (!el.getClientRects().length) return false; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.1 || e.inert || e.getAttribute('aria-hidden') === 'true' || e.classList.contains('sr-only')) return false; } return true; };
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
  const name = (el) => (el.tagName + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '') + ' « ' + (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40) + ' »');
  const out = { overflow: document.documentElement.scrollWidth > innerWidth + 1, small: [], tap: [], clipped: [], overlap: [], contrast: [], onImage: 0, h1: document.querySelectorAll('h1').length, broken: [], typo: [], noVisual: [] };
  const texts = [...document.querySelectorAll('body *')].filter((el) => !['SCRIPT', 'STYLE', 'svg', 'SVG', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName) && ownText(el) && vis(el));
  // 2. textes sous 12 px
  texts.forEach((el) => { const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 11.95) out.small.push(`${name(el)} ${fs}px`); });
  // 3. zones tactiles sous 44 px
  if (touch) [...document.querySelectorAll('a[href], button, input, select, textarea, [role=button], summary')].filter(vis).forEach((el) => {
    if (el.closest('p, li > span, .prose, dd') && el.tagName === 'A' && !el.classList.contains('btn')) return;
    if (el.tagName === 'INPUT' && el.closest('label') && el.closest('label').getBoundingClientRect().height >= 43.5) return;
    if (el.tagName === 'INPUT' && el.labels && el.labels[0] && el.labels[0].getBoundingClientRect().height >= 43.5) return;
    const r = el.getBoundingClientRect(); if (r.width < 43.5 || r.height < 43.5) out.tap.push(`${name(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
  });
  // 4. texte coupé par son conteneur
  texts.forEach((el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowX + cs.overflowY)) break; /* zone qui défile au doigt : le texte est atteignable */ if (/(hidden|clip)/.test(cs.overflowX + cs.overflowY) && e.clientWidth > 0) { if (e.scrollWidth > e.clientWidth * 1.4 || e.closest('[data-marquee], .shipstrip, .story__frame, .sr-only')) break; const r = el.getBoundingClientRect(); const c = e.getBoundingClientRect(); if (r.right > c.right + 2 || r.left < c.left - 2 || r.bottom > c.bottom + 3 || r.top < c.top - 3) { if (!e.closest('[data-superpose]') && !/mask|word|line|char/.test(e.className + '')) out.clipped.push(`${name(el)} dans ${e.tagName}.${(e.className + '').split(' ')[0]}`); } break; } } });
  // 5. chevauchements entre blocs de texte, titres, boutons, prix
  const fixed = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) if (getComputedStyle(e).position === 'fixed') return true; return false; };
  const blocks = [...document.querySelectorAll('h1, h2, h3, h4, p, li, a.btn, button, [class*=price], dt, dd, figcaption, label')].filter((el) => vis(el) && !el.closest('[data-superpose]') && !fixed(el) && el.getBoundingClientRect().width > 0);
  for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) {
    const a = blocks[i], b = blocks[j]; if (a.contains(b) || b.contains(a)) continue;
    const r = a.getBoundingClientRect(), s = b.getBoundingClientRect();
    const w = Math.min(r.right, s.right) - Math.max(r.left, s.left), h = Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top);
    if (w > 4 && h > 4 && w * h > 0.2 * Math.min(r.width * r.height, s.width * s.height)) { const pa = getComputedStyle(a).position, pb = getComputedStyle(b).position; out.overlap.push(`${name(a)} × ${name(b)} (${Math.round(w)}×${Math.round(h)})`); }
    if (out.overlap.length > 40) break;
  }
  // 6. contrastes (couleur du texte sur le premier fond opaque)
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; };
  const lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  texts.forEach((el) => {
    const cs = getComputedStyle(el); let fg = parse(cs.color); if (!fg) return; let bg = null; let img = false;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e); if (s.backgroundImage !== 'none' && !/gradient/.test(s.backgroundImage)) { img = true; break; }
      const c = parse(s.backgroundColor); if (c && c[3] > 0.84) { bg = c; break; }
      // fond en dégradé opaque : moyenne de ses couleurs
      if (/gradient/.test(s.backgroundImage) && /^(auto( auto)?|cover|100% 100%)$/.test(s.backgroundSize)) { const st = [...s.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map((m) => parse(m[0])).filter((x) => x && x[3] > 0.84); if (st.length) { bg = [0, 1, 2].map((i) => st.reduce((t, x) => t + x[i], 0) / st.length).concat(1); break; } }
    }
    if (img || !bg) { out.onImage++; return; }
    if (el.closest('.is-dark, [class*=hero], .vhero, .ftr, .hdr, .mmenu') && lum(fg) > 0.5 && lum(bg) > 0.5) { out.onImage++; return; } // fond sombre posé par un pseudo-élément : jugé sur capture
    const op = [...(function* () { for (let e = el; e; e = e.parentElement) yield +getComputedStyle(e).opacity; })()].reduce((a, b) => a * b, 1);
    if (op < 0.95) return; // en cours d'animation
    const a = fg[3]; fg = [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)];
    const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize); const big = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
    if (ratio < (big ? 3 : 4.5)) out.contrast.push(`${name(el)} ${ratio.toFixed(2)}:1`);
  });
  // 9. images cassées, sections sans visuel
  document.querySelectorAll('img').forEach((im) => { if (im.complete && im.getAttribute('src') && im.naturalWidth === 0) out.broken.push(im.getAttribute('src')); });
  if (document.body.dataset.page !== 'informations') document.querySelectorAll('main > section, main > div > section').forEach((s) => { const hasV = s.querySelector('img, svg, canvas, video, picture') || [...s.querySelectorAll('*')].concat(s).some((e) => getComputedStyle(e).backgroundImage.includes('url(')); if (!hasV) out.noVisual.push(name(s.querySelector('h2, h3') || s)); });
  // 12. typographie française : espace insécable avant : ; ? ! » et après «
  if (document.documentElement.lang === 'fr') {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const p = n.parentElement; if (!p || p.closest('[lang=en], script, style, code, [data-typo-ok]') || !vis(p)) continue; const t = n.textContent; const m = t.match(/[^\s\u00a0\u202f(\d][:;?!»]|«[^\u00a0\u202f]/); if (m && !/https?:|\d:\d/.test(t)) out.typo.push(`« ${t.trim().slice(0, 50)} »`); if (out.typo.length > 15) break; }
  }
  return out;
}

(async () => {
  const t0 = Date.now(); const V = statics();
  const srv = await serve(); const BASE = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl'] });
  const ctxFor = async (w, h, touch, extra = {}) => { const c = await browser.newContext({ viewport: { width: w, height: h }, isMobile: !!touch, hasTouch: !!touch, ...extra }); await c.addInitScript(() => { try { localStorage.setItem('ahp-age', 'ok'); } catch (e) {} }); return c; };
  // ---------- toutes les pages à toutes les tailles ----------
  for (const [w, h, touch] of SIZES) for (const pg of PAGES) {
    const where = `${pg} ${w}×${h}`; const c = await ctxFor(w, h, touch); const p = await c.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 140)); });
    p.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('page-inexistante')) errs.push(`${r.status()} ${r.url().replace(BASE, '')}`); });
    await c.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(BASE + pg, { waitUntil: 'load' }); await p.waitForTimeout(2600);
    const first = await p.evaluate(() => { const hd = document.querySelector('[data-hdr]'); const hr = hd.getBoundingClientRect(); const bg = getComputedStyle(hd).backgroundColor; const h1 = document.querySelector('h1'); const r = h1 && h1.getBoundingClientRect(); const legal = document.querySelector('[data-legal]'); const lh = legal ? legal.getBoundingClientRect().height : 0; const links = [...hd.querySelectorAll('nav a')].filter((a) => a.getClientRects().length && getComputedStyle(a).visibility !== 'hidden'); const menu = hd.querySelector('[data-menu]'); const menuOn = menu && menu.getClientRects().length && getComputedStyle(menu).display !== 'none'; let touchLinks = false; for (let i = 1; i < links.length; i++) { const a = links[i - 1].getBoundingClientRect(), b = links[i].getBoundingClientRect(); if (b.left < a.right + 8 && Math.abs(a.top - b.top) < 4) touchLinks = true; } const wraps = links.length > 1 && new Set(links.map((a) => Math.round(a.getBoundingClientRect().top))).size > 1; return { cls: window.__cls, hdrTop: hr.top, hdrBottom: hr.bottom, h1Bottom: r ? r.bottom : null, h1Top: r ? r.top : null, vh: innerHeight, lh, nav: links.length, menuOn, touchLinks, wraps }; });
    if (first.cls > 0.05) add('stabilité', where, `CLS au chargement ${first.cls.toFixed(3)}`);
    if (first.hdrTop < -1) add('en-tête', where, 'en-tête coupé en haut');
    if (!first.menuOn && (first.nav === 0 || first.touchLinks || first.wraps)) add('en-tête', where, first.nav === 0 ? 'ni liens ni bouton Menu' : 'liens du menu serrés ou sur deux lignes');
    if (pg !== '/page-inexistante' && first.h1Bottom != null && (first.h1Bottom > first.vh - first.lh || first.h1Top < first.hdrBottom - 2)) add('premier écran', where, `titre principal hors du premier écran (${Math.round(first.h1Top)}–${Math.round(first.h1Bottom)} px)`);
    // défilement complet pour tout déclencher
    await p.evaluate(async () => { const H = () => document.documentElement.scrollHeight; for (let y = 0; y < H(); y += innerHeight * 0.6) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); } await new Promise((r) => setTimeout(r, 400)); });
    const m = await p.evaluate(pageMeasures, !!touch);
    if (m.overflow) add('débordement', where, 'défilement horizontal');
    if (m.h1 !== 1) add('accessibilité', where, `${m.h1} titres h1`);
    m.small.slice(0, 5).forEach((x) => add('texte < 12 px', where, x));
    m.tap.slice(0, 6).forEach((x) => add('zone tactile < 44 px', where, x));
    m.clipped.slice(0, 5).forEach((x) => add('texte coupé', where, x));
    m.overlap.slice(0, 5).forEach((x) => add('chevauchement', where, x));
    m.contrast.slice(0, 6).forEach((x) => add('contraste', where, x));
    m.broken.forEach((x) => add('images', where, `image cassée ${x}`));
    if (w === 1440) m.noVisual.forEach((x) => add('images', where, `section sans visuel : ${x}`));
    if (w === 1440 || w === 390) m.typo.slice(0, 6).forEach((x) => add('typographie', where, `espace insécable manquant ${x}`));
    errs.slice(0, 4).forEach((x) => add('console', where, x));
    if ([390, 1440].includes(w)) await p.screenshot({ path: path.join(CAPT, `${pg.replace(/\W+/g, '_') || 'accueil'}-${w}.png`) });
    await c.close();
  }
  // ---------- balayage des largeurs : débordement et navigation ----------
  { const c = await ctxFor(320, 800); const p = await c.newPage();
    for (const pg of ['/', '/vins', '/boutique']) { await p.goto(BASE + pg); await p.waitForTimeout(1500);
      for (let w = 320; w <= 1920; w += RAPIDE ? 80 : 20) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(60);
        const r = await p.evaluate(() => { const hd = document.querySelector('[data-hdr]'); const links = [...hd.querySelectorAll('nav a')].filter((a) => a.getClientRects().length && getComputedStyle(a).visibility !== 'hidden'); const menu = hd.querySelector('[data-menu]'); const menuOn = menu && menu.getClientRects().length && getComputedStyle(menu).display !== 'none'; let bad = false; for (let i = 1; i < links.length; i++) { const a = links[i - 1].getBoundingClientRect(), b = links[i].getBoundingClientRect(); if (b.left < a.right + 8 || Math.abs(a.top - b.top) > 3) bad = true; } return { of: document.documentElement.scrollWidth > innerWidth + 1, nav: menuOn || (links.length && !bad) }; });
        if (r.of) add('débordement', `${pg} ${w} px`, 'défilement horizontal'); if (!r.nav) add('en-tête', `${pg} ${w} px`, 'trou de navigation (liens serrés et pas de bouton Menu)'); } }
    await c.close(); }
  // ---------- sections épinglées : tout tient dans l'écran ----------
  for (const [w, h] of (RAPIDE ? [[1000, 560], [1440, 900]] : PIN_SIZES)) for (const pg of ['/', '/domaine', '/vins']) {
    const c = await ctxFor(w, h); const p = await c.newPage(); await p.goto(BASE + pg); await p.waitForTimeout(2200);
    const pins = await p.evaluate(() => ScrollTrigger.getAll().filter((s) => s.pin).map((s) => [s.start, s.end]));
    for (const [a, b] of pins) for (const f of [0.15, 0.5, 0.85]) {
      await p.evaluate((y) => window.scrollTo(0, y), a + (b - a) * f); await p.waitForTimeout(1600);
      const r = await p.evaluate(() => { const hd = document.querySelector('[data-hdr]').getBoundingClientRect().bottom; const lg = document.querySelector('[data-legal]'); const bot = innerHeight - (lg ? lg.getBoundingClientRect().height : 0); const bad = []; const pinned = [...document.querySelectorAll('.pin-spacer > *')].find((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }); if (!pinned) return bad; pinned.querySelectorAll('h2, h3, p, a, button, li, figcaption, dd, dt, [data-asm-note]').forEach((el) => { if (!el.getClientRects().length || el.closest('[inert]')) return; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity < 0.5 || cs.display === 'none') return; if (e === pinned) break; } const r = el.getBoundingClientRect(); if (r.height === 0) return; if (r.top < hd - 2 || r.bottom > bot + 2) bad.push(`${el.tagName} « ${el.textContent.trim().slice(0, 30)} » ${Math.round(r.top)}–${Math.round(r.bottom)} (zone ${Math.round(hd)}–${Math.round(bot)})`); }); return bad.slice(0, 3); });
      r.forEach((x) => add('tient dans l\'écran', `${pg} ${w}×${h} épingle ${Math.round(f * 100)} %`, x));
    }
    await c.close();
  }
  // ---------- modes : calme, sans WebGL, sans JavaScript, anglais ----------
  for (const pg of PAGES.slice(0, 7)) {
    let c = await ctxFor(1440, 900, false, { reducedMotion: 'reduce' }); let p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(BASE + pg); await p.waitForTimeout(1500);
    const calm = await p.evaluate(() => ({ calm: document.documentElement.classList.contains('calm'), pins: ScrollTrigger.getAll().filter((s) => s.pin).length, running: document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.getTiming().iterations === Infinity).length }));
    if (!calm.calm) add('mode calme', pg, 'la classe calm n\'est pas posée'); if (calm.pins) add('mode calme', pg, `${calm.pins} section(s) encore épinglée(s)`); if (calm.running) add('mode calme', pg, `${calm.running} animation(s) en boucle encore actives`);
    errs.forEach((x) => add('console', `${pg} calme`, x)); await c.close();
    c = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }); p = await c.newPage(); await p.goto(BASE + pg); await p.waitForTimeout(600);
    const nojs = await p.evaluate(() => { const h1 = document.querySelector('h1'); const st = h1 && getComputedStyle(h1); const hidden = [...document.querySelectorAll('main h2, main p')].filter((e) => { const s = getComputedStyle(e); return s.visibility === 'hidden' || +s.opacity === 0; }).length; return { h1: !!h1 && st.visibility !== 'hidden' && +st.opacity > 0.5, hidden }; });
    if (!nojs.h1 || nojs.hidden > 3) add('sans JavaScript', pg, `contenu caché sans JavaScript (${nojs.hidden} blocs)`); await c.close();
    c = await ctxFor(1440, 900); await c.addInitScript(() => { try { localStorage.setItem('ahp-lang', 'en'); } catch (e) {} }); p = await c.newPage(); await p.goto(BASE + pg); await p.waitForTimeout(1500);
    const en = await p.evaluate(() => ({ lang: document.documentElement.lang, fr: [...document.querySelectorAll('[lang=fr]')].filter((e) => e.getClientRects().length && getComputedStyle(e).display !== 'none' && e !== document.documentElement).length, missing: [...document.querySelectorAll('span[lang=fr]')].filter((e) => !(e.nextElementSibling && e.nextElementSibling.getAttribute('lang') === 'en') && !(e.previousElementSibling && e.previousElementSibling.getAttribute('lang') === 'en')).length }));
    if (en.lang !== 'en') add('langues', pg, 'la page ne passe pas en anglais'); if (en.fr) add('langues', pg, `${en.fr} texte(s) français visibles en anglais`); if (en.missing) add('langues', pg, `${en.missing} texte(s) sans traduction`);
    await c.close();
  }
  // ---------- CLS pendant le défilement à la molette ----------
  for (const pg of ['/', '/domaine', '/vins', '/vin?id=hp-2020', '/oenotourisme']) {
    const c = await ctxFor(1440, 900); await c.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    const p = await c.newPage(); await p.goto(BASE + pg); await p.waitForTimeout(2500); await p.mouse.move(700, 450);
    const before = await p.evaluate(() => window.__cls); const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let k = 0; k < Math.min(160, H / 100); k++) { await p.mouse.wheel(0, 100); await p.waitForTimeout(40); }
    await p.waitForTimeout(800); const after = await p.evaluate(() => window.__cls);
    if (after - before > 0.05) add('stabilité', `${pg} défilement`, `CLS pendant le défilement ${(after - before).toFixed(3)}`);
    await c.close();
  }
  // ---------- films : ouverture et transition, images presque blanches ----------
  if (FILMS) for (const [w, h, touch] of [[1440, 900], [390, 844, 1]]) {
    const c = await ctxFor(w, h, touch, { recordVideo: { dir: path.join(CAPT, 'films'), size: { width: w, height: h } } }); const p = await c.newPage();
    await p.goto(BASE + '/'); await p.waitForTimeout(3500); await p.click('a[href="vins.html"]').catch(() => {}); await p.waitForTimeout(3500); await p.goBack(); await p.waitForTimeout(2500);
    await c.close(); add('films', `${w}×${h}`, `film enregistré dans ${path.join(CAPT, 'films')} (à regarder)`);
  }
  await browser.close(); srv.close();
  // ---------- rapport ----------
  const cats = {}; R.forEach((r) => { (cats[r.cat] = cats[r.cat] || []).push(r); });
  const lines = [`# Audit automatique · maquette ${V || ''}`, '', `${new Date().toISOString().slice(0, 16).replace('T', ' ')} · ${PAGES.length} pages · ${SIZES.length} tailles${RAPIDE ? ' (rapide)' : ''} · ${Math.round((Date.now() - t0) / 1000)} s`, '', R.length ? `**${R.length} point(s) à regarder**` : '**Tout passe.**', ''];
  Object.entries(cats).forEach(([k, list]) => { lines.push(`## ${k} (${list.length})`); list.slice(0, 40).forEach((r) => lines.push(`- ${r.where} : ${r.msg}`)); if (list.length > 40) lines.push(`- … et ${list.length - 40} autres`); lines.push(''); });
  lines.push('Captures : ' + CAPT);
  fs.writeFileSync(path.join(OUT, 'rapport.md'), lines.join('\n'));
  console.log(lines.slice(0, 6).join('\n')); Object.entries(cats).forEach(([k, l]) => console.log(`  ${k} : ${l.length}`));
})();
