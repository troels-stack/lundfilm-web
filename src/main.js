(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero slideshow + live timecode
  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var credit = document.querySelector('.hero-credit');
  var cam = document.querySelector('[data-cam]');
  var tc = document.querySelector('[data-tc]');
  var cur = 0;
  function show(i) {
    slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    if (credit) credit.textContent = slides[i].getAttribute('data-credit') || '';
    if (cam) cam.textContent = 'CAM ' + (i + 1);
  }
  if (slides.length > 1 && !reduce) {
    setInterval(function () { cur = (cur + 1) % slides.length; show(cur); }, 6000);
  }
  if (tc) {
    var t0 = Date.now();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    setInterval(function () {
      var ms = Date.now() - t0;
      var s = 20 * 3600 + 14 * 60 + Math.floor(ms / 1000);
      tc.textContent = pad(Math.floor(s / 3600) % 24) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60) + ':' + pad(Math.floor((ms % 1000) / 40));
    }, reduce ? 1000 : 40);
  }

  // Mobile menu
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.querySelector('.nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // "From the road" filter
  var filters = Array.prototype.slice.call(document.querySelectorAll('.filter'));
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));
  filters.forEach(function (f) {
    f.addEventListener('click', function () {
      var g = f.getAttribute('data-group');
      filters.forEach(function (x) { x.setAttribute('aria-pressed', x === f ? 'true' : 'false'); });
      tiles.forEach(function (t) { t.hidden = !(g === 'all' || t.getAttribute('data-group') === g); });
    });
  });

  // Vimeo thumbnails (oEmbed) for items without our own photo
  Array.prototype.slice.call(document.querySelectorAll('[data-vimeo-thumb]')).forEach(function (el) {
    var id = el.getAttribute('data-vimeo-thumb');
    fetch('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent('https://vimeo.com/' + id) + '&width=1280')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.thumbnail_url) return;
        var img = new Image();
        img.alt = d.title || '';
        img.loading = 'lazy';
        img.src = d.thumbnail_url;
        el.insertBefore(img, el.firstChild);
        var ph = el.querySelector('.placeholder');
        if (ph) ph.remove();
      })
      .catch(function () {});
  });

  // Vimeo player modal
  var modal = document.querySelector('.modal');
  var frame = modal && modal.querySelector('.modal-frame');
  var closeBtn = modal && modal.querySelector('.modal-close');
  var lastFocus = null;
  var caption = modal && modal.querySelector('.modal-caption');
  function openModal() {
    lastFocus = document.activeElement;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function openVideo(id, title) {
    if (!modal) return;
    frame.classList.remove('photo', 'pano');
    if (caption) caption.textContent = '';
    frame.innerHTML = '<iframe src="https://player.vimeo.com/video/' + encodeURIComponent(id) + '?autoplay=1&badge=0&autopause=0&title=0&byline=0&portrait=0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="' + (title || 'Video').replace(/"/g, '&quot;') + '"></iframe>';
    openModal();
  }
  function openPhoto(src, text, alt) {
    if (!modal) return;
    frame.classList.remove('pano');
    frame.classList.add('photo');
    frame.innerHTML = '';
    var im = new Image();
    im.src = src;
    im.alt = alt || '';
    frame.appendChild(im);
    if (caption) caption.textContent = text || '';
    openModal();
  }
  // 360° photos: Pannellum (self-hosted in /vendor) is loaded only the first time someone opens one
  var viewer = null;
  var panoLib = null;
  function loadPannellum() {
    if (panoLib) return panoLib;
    panoLib = new Promise(function (resolve, reject) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = '/vendor/pannellum/pannellum.css';
      document.head.appendChild(css);
      var s = document.createElement('script');
      s.src = '/vendor/pannellum/pannellum.js';
      s.onload = function () { resolve(window.pannellum); };
      s.onerror = function () { panoLib = null; reject(); };
      document.head.appendChild(s);
    });
    return panoLib;
  }
  function openPano(src, text) {
    if (!modal) return;
    frame.classList.remove('photo');
    frame.classList.add('pano');
    frame.innerHTML = '<div class="pano-stage"></div><p class="pano-hint" aria-hidden="true">Drag to look around</p>';
    if (caption) caption.textContent = text || '';
    openModal();
    loadPannellum().then(function (p) {
      if (!modal.classList.contains('open') || !frame.classList.contains('pano')) return;
      var stage = frame.querySelector('.pano-stage');
      var portrait = stage.clientWidth < stage.clientHeight;
      viewer = p.viewer(stage, {
        type: 'equirectangular',
        panorama: src,
        autoLoad: true,
        autoRotate: reduce ? 0 : -2,
        autoRotateInactivityDelay: 4000,
        hfov: portrait ? 65 : 100,
        minHfov: 30,
        maxHfov: 120,
        showControls: true,
        showFullscreenCtrl: true,
        mouseZoom: true,
        draggable: true,
        friction: 0.15,
        crossOrigin: 'anonymous'
      });
      var hint = frame.querySelector('.pano-hint');
      if (hint) viewer.on('mousedown', function () { hint.remove(); }).on('touchstart', function () { hint.remove(); });
    }).catch(function () {
      frame.innerHTML = '<span class="placeholder">The 360° viewer could not be loaded.</span>';
    });
  }
  function closeVideo() {
    if (!modal) return;
    if (viewer) { try { viewer.destroy(); } catch (e) {} viewer = null; }
    frame.classList.remove('pano');
    modal.classList.remove('open');
    frame.innerHTML = '';
    frame.classList.remove('photo');
    if (caption) caption.textContent = '';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  Array.prototype.slice.call(document.querySelectorAll('[data-vimeo]')).forEach(function (b) {
    b.addEventListener('click', function () { openVideo(b.getAttribute('data-vimeo'), b.getAttribute('aria-label')); });
  });
  Array.prototype.slice.call(document.querySelectorAll('[data-photo]')).forEach(function (b) {
    b.addEventListener('click', function () {
      var pic = b.parentNode.querySelector('img');
      openPhoto(b.getAttribute('data-photo'), b.getAttribute('data-caption'), pic ? pic.alt : '');
    });
  });
  Array.prototype.slice.call(document.querySelectorAll('[data-pano]')).forEach(function (b) {
    b.addEventListener('click', function () { openPano(b.getAttribute('data-pano'), b.getAttribute('data-caption')); });
  });
  if (closeBtn) closeBtn.addEventListener('click', closeVideo);
  if (modal) modal.addEventListener('click', function (e) { if (e.target === modal || e.target === frame) closeVideo(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeVideo(); });

  // E-mail: assembled in the browser so simple harvesters never see it in the HTML
  Array.prototype.slice.call(document.querySelectorAll('[data-u][data-d]')).forEach(function (a) {
    var addr = a.getAttribute('data-u') + '@' + a.getAttribute('data-d');
    a.href = 'mailto:' + addr;
    a.textContent = addr;
  });
})();
