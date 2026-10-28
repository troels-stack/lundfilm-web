// Builds the static site into dist/ from data/*.json. No dependencies: `node build.js`.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));

const site = read('site.json');
const news = read('news.json').sort((a, b) => b.date.localeCompare(a.date));
const work = read('work.json');
const roadPhotos = read('road.json');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const img = (file) => '/images/' + encodeURIComponent(file);
const PLAY = '<svg width="16" height="16" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 1.5v11l9-5.5z" fill="currentColor"/></svg>';
const credit = (name) => name ? `<span class="photo-credit">Foto: ${esc(name)}</span>` : '';

// --- Latest: the newest N news items; everything older moves to "From the road".
const latest = news.slice(0, site.latestCount || 4);
const olderNews = news.slice(site.latestCount || 4);

function media(item, cls) {
  if (item.image) {
    return `<div class="media ${cls || ''}"><img src="${img(item.image)}" alt="${esc(item.alt)}" loading="lazy">${credit(item.credit)}${item.tag ? `<span class="tag">${esc(item.tag)}</span>` : ''}</div>`;
  }
  if (item.vimeo) {
    return `<div class="media ${cls || ''}" data-vimeo-thumb="${esc(item.vimeo)}"><span class="placeholder">${esc(item.title)}</span>${item.tag ? `<span class="tag">${esc(item.tag)}</span>` : ''}</div>`;
  }
  return `<div class="media ${cls || ''}"><span class="placeholder">${esc(item.title)}</span>${item.tag ? `<span class="tag">${esc(item.tag)}</span>` : ''}</div>`;
}

function videoLayer(item) {
  if (!item.vimeo) return '';
  return `<button class="vimeo-trigger" type="button" data-vimeo="${esc(item.vimeo)}" aria-label="Play: ${esc(item.title)}"></button><span class="play" aria-hidden="true">${PLAY}</span>`;
}

function photoLayer(item) {
  if (!item.image || item.vimeo) return '';
  const cap = item.title + (item.credit ? ' · Foto: ' + item.credit : '');
  return `<button class="vimeo-trigger" type="button" data-photo="${img(item.image)}" data-caption="${esc(cap)}" aria-label="Open photo: ${esc(item.title)}"></button>`;
}

function latestCard(n) {
  const m = media(n).replace(/<\/div>$/, videoLayer(n) + photoLayer(n) + '</div>');
  return `<article class="card">${m}<div class="card-body"><span class="card-date">${esc(n.label)}</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div></article>`;
}

function workCard(w) {
  let inner;
  if (w.image) {
    inner = `<img src="${img(w.image)}" alt="${esc(w.alt)}" loading="lazy">${credit(w.credit)}`;
  } else if (w.vimeo) {
    inner = `<span class="placeholder">${esc(w.title)}</span>`;
  } else {
    inner = `<span class="placeholder">${esc(w.title)}</span>`;
  }
  const thumbAttr = !w.image && w.vimeo ? ` data-vimeo-thumb="${esc(w.vimeo)}"` : '';
  return `<article class="work"><div class="media"${thumbAttr}>${inner}${videoLayer(w)}${photoLayer(w)}</div><div class="work-title"><h3>${esc(w.title)}</h3>${w.year ? `<span>${esc(w.year)}</span>` : ''}</div><p class="work-role">${esc(w.role)}</p></article>`;
}

// --- From the road: photos + news that has dropped out of "Latest", newest first.
const road = [
  ...roadPhotos.map((r) => ({ ...r, kind: 'photo' })),
  ...olderNews.map((n) => ({ ...n, group: 'news', kind: 'news' }))
].sort((a, b) => b.date.localeCompare(a.date));

function tile(r) {
  const wide = r.wide ? ' wide' : '';
  let pic = '';
  if (r.image) pic = `<img src="${img(r.image)}" alt="${esc(r.alt)}" loading="lazy">`;
  const thumb = !r.image && r.vimeo ? ` data-vimeo-thumb="${esc(r.vimeo)}"` : '';
  const vid = r.vimeo ? `<button class="vimeo-trigger" type="button" data-vimeo="${esc(r.vimeo)}" aria-label="Play: ${esc(r.title)}"></button>` : photoLayer(r);
  return `<figure class="tile${wide}" data-group="${esc(r.group)}"${thumb}>${pic}<div class="tile-scrim"></div>${vid}<figcaption>${r.label ? `<span class="t-date">${esc(r.label)}</span>` : ''}<span class="t-title">${esc(r.title)}</span>${r.credit ? `<span class="t-credit">Foto: ${esc(r.credit)}</span>` : ''}</figcaption></figure>`;
}

const groupNames = { tours: 'Tours', news: 'News' };
const groups = ['all', ...Object.keys(groupNames).filter((g) => road.some((r) => r.group === g))];
const filterButtons = groups.map((g, i) =>
  `<button class="filter" type="button" data-group="${g}" aria-pressed="${i === 0}">${g === 'all' ? 'All' : groupNames[g]}</button>`).join('');

const heroSlides = site.hero.map((h, i) =>
  `<img class="hero-slide${i === 0 ? ' on' : ''}" src="${img(h.image)}" alt="${esc(h.alt)}" data-credit="${esc(h.credit)}"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}>`).join('');

const about = site.aboutImage;
const year = new Date().getFullYear();
const ver = Date.now().toString(36); // cache-busting: browsers fetch new CSS/JS after every deploy

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lundfilm — Music never looked better</title>
<meta name="description" content="Lundfilm ApS — multi-camera and IMAG direction for world tours, festivals and live TV. Troels Lund, director since 2005.">
<meta property="og:title" content="Lundfilm — Music never looked better">
<meta property="og:description" content="Multi-camera and IMAG direction for world tours, festivals and live TV.">
<meta property="og:image" content="${img(site.hero[0].image)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#0C0C0D">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/archivo-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css?v=${ver}">
</head>
<body id="top">
<header class="wrap site-header">
  <a class="logo" href="#top" aria-label="Lundfilm — home"><span>LUNDFILM</span><span class="dot" aria-hidden="true"></span></a>
  <button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg></button>
  <nav class="nav" id="nav" aria-label="Main">
    <a href="#latest">Latest</a><a href="#work">Work</a><a href="#road">From the road</a><a href="#about">About</a><a class="pill" href="#contact">Contact</a>
  </nav>
</header>

<main>
<div class="wrap hero-wrap">
  <section class="hero" aria-label="Intro">
    ${heroSlides}
    <div class="hero-scrim" aria-hidden="true"></div>
    <div class="hero-hud" aria-hidden="true">
      <span class="hud-chip"><span class="dot"></span><span style="color:var(--text)">LIVE</span> <span data-cam>CAM 1</span> · PGM</span>
      <span class="hud-chip tc" data-tc style="color:var(--text)">20:14:00:00</span>
    </div>
    <h1>Music never<br>looked better<em>.</em></h1>
    <div class="hero-foot">
      <p>Multi-camera and IMAG direction for world tours, festivals and live TV — from The Weeknd and The Minds of 99 to the Eurovision Song Contest.</p>
      <div class="btns"><a class="btn btn-solid" href="#work">See the work</a><a class="btn btn-line" href="#contact">Book a call</a></div>
    </div>
    <span class="hero-credit">${esc(site.hero[0].credit)}</span>
  </section>
</div>

<div class="wrap credits" aria-label="Selected credits">
  <span class="label">SELECTED CREDITS</span>
  <span>THE WEEKND</span><span>THE MINDS OF 99</span><span>BENJAMIN HAV</span><span>WIZKID</span><span>SCORPIONS</span><span>EUROVISION SONG CONTEST</span><span>X FACTOR</span><span>DR</span><span>TV 2</span><span>ROSKILDE FESTIVAL</span>
</div>

<section class="wrap block" id="latest">
  <div class="section-head">
    <div><p class="eyebrow live">● ON AIR</p><h2 class="title">Latest from the road</h2></div>
    <p class="lede">The newest from tours, festivals and the studio. Older stories live in <a href="#road">From the road</a>.</p>
  </div>
  <div class="grid-latest">${latest.map(latestCard).join('')}</div>
</section>

<section class="wrap block" id="work">
  <div class="section-head">
    <h2 class="title">Selected work</h2>
    <p class="lede">Films marked ▶ play right here on the page.</p>
  </div>
  <div class="grid-work">${work.map(workCard).join('')}</div>
</section>

<section class="wrap block" id="road">
  <div class="section-head">
    <div><p class="eyebrow">ARCHIVE</p><h2 class="title">From the road</h2></div>
    <div class="filters" role="group" aria-label="Filter archive">${filterButtons}</div>
  </div>
  <div class="grid-road">${road.map(tile).join('')}</div>
</section>

<section class="wrap block" id="services" aria-label="Services">
  <h2 class="title" style="margin-bottom:48px">What we do</h2>
  <div class="services">
    <div class="service"><span class="n">01</span><h3>Tours &amp; festivals</h3><p>IMAG direction for arena and stadium tours and festival main stages — Roskilde, Smukfest, Northside, Tinderbox.</p></div>
    <div class="service"><span class="n">02</span><h3>Live TV</h3><p>Multi-camera direction and full scripting for music shows — Eurovision, Melodi Grand Prix, X Factor, Sport.</p></div>
    <div class="service"><span class="n">03</span><h3>Stand-up &amp; entertainment</h3><p>Show recordings and talk shows — Rune Klan, Jonatan Spang, Jan Gintberg and more.</p></div>
    <div class="service"><span class="n">04</span><h3>Corporate &amp; e-sport</h3><p>Summits, award shows and tournaments — BLAST Premier, Novo Nordisk, Danske Bank, Lauritzen Fonden.</p></div>
  </div>
</section>

<section class="wrap block" id="about">
  <div class="about">
    <div class="media"><img src="${img(about.image)}" alt="${esc(about.alt)}" loading="lazy">${credit(about.credit)}</div>
    <div class="about-text">
      <h2>25 years behind the cameras.</h2>
      <p>Lundfilm is run by director Troels Lund. Trained at Nordisk Film from 1997, independent since 2005. Multi-camera director of the Eurovision Song Contest, seven Melodi Grand Prix finals and four seasons of X Factor — and IMAG director on tour with The Weeknd, The Minds of 99, WizKid and Scorpions.</p>
      <p>Whether it is a world star or a new talent, the focus is the same: a visual experience that multiplies the impact of the music.</p>
      <div class="stats">
        <div class="stat"><b>3×</b><span>Eurovision Song Contest</span></div>
        <div class="stat"><b>40,000</b><span>at Parken, X Factor final 2011</span></div>
        <div class="stat"><b>2005</b><span>Lundfilm founded</span></div>
      </div>
      <p class="awards">TV Prisen, Best Live Event — Sport 2022 · Zulu Award, Best Comedy Director</p>
    </div>
  </div>
</section>
</main>

<footer class="site-footer" id="contact">
  <div class="wrap">
    <h2>Let's make your show look as good as it sounds<em>.</em></h2>
    <div class="contact-row">
      <div class="contact-main">
        <a class="email" data-u="contact" data-d="lundfilm.com" href="#contact">contact [at] lundfilm.com</a>
        <a class="phone" href="tel:+4530573500">+45 30 57 35 00</a>
        <span style="color:var(--muted)">Hvidovre, Denmark</span>
      </div>
      <nav class="socials" aria-label="Social media">
        <a href="https://www.instagram.com/lundfilm/" rel="noopener">Instagram</a>
        <a href="https://www.facebook.com/lundfilm" rel="noopener">Facebook</a>
        <a href="https://www.linkedin.com/in/troels-lund-8b7385/" rel="noopener">LinkedIn</a>
      </nav>
    </div>
    <div class="fine"><span>© ${year} Lundfilm ApS</span><span>MUSIC NEVER LOOKED BETTER</span></div>
  </div>
</footer>

<div class="modal" role="dialog" aria-modal="true" aria-label="Media viewer">
  <button class="modal-close" type="button" aria-label="Close video"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  <div class="modal-frame"></div>
  <p class="modal-caption"></p>
</div>

<script src="/main.js?v=${ver}" defer></script>
</body>
</html>
`;

// --- Write dist/
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src', 'styles.css'), path.join(OUT, 'styles.css'));
fs.copyFileSync(path.join(ROOT, 'src', 'main.js'), path.join(OUT, 'main.js'));
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log(`Built dist/: ${latest.length} latest, ${work.length} work, ${road.length} road items.`);
