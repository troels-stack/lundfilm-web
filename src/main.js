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
        el.appendChild(img);
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
  function openVideo(id, title) {
    if (!modal) return;
    lastFocus = document.activeElement;
    frame.innerHTML = '<iframe src="https://player.vimeo.com/video/' + encodeURIComponent(id) + '?autoplay=1&dnt=1&title=0&byline=0&portrait=0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="' + (title || 'Video').replace(/"/g, '&quot;') + '"></iframe>';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function closeVideo() {
    if (!modal) return;
    modal.classList.remove('open');
    frame.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  Array.prototype.slice.call(document.querySelectorAll('[data-vimeo]')).forEach(function (b) {
    b.addEventListener('click', function () { openVideo(b.getAttribute('data-vimeo'), b.getAttribute('aria-label')); });
  });
  if (closeBtn) closeBtn.addEventListener('click', closeVideo);
  if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeVideo(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeVideo(); });

  // E-mail: assembled in the browser so simple harvesters never see it in the HTML
  Array.prototype.slice.call(document.querySelectorAll('[data-u][data-d]')).forEach(function (a) {
    var addr = a.getAttribute('data-u') + '@' + a.getAttribute('data-d');
    a.href = 'mailto:' + addr;
    a.textContent = addr;
  });
})();
