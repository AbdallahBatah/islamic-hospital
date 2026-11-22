/* Islamic Hospital: page behaviour. No dependencies; every feature degrades to plain HTML. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  /* menu */
  var btn = doc.querySelector('.menu-btn'), nav = doc.getElementById('site-nav');
  if (btn && nav) btn.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* mega menu: hover or the arrow button on wide screens, accordion inside the mobile menu */
  var megas = [].slice.call(doc.querySelectorAll('.has-mega'));
  var wide = window.matchMedia('(min-width: 1201px)'), canHover = window.matchMedia('(hover: hover)');
  function setMega(li, open) {
    li.classList.toggle('is-open', open);
    li.querySelector('.mega-btn').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) li.pinned = false;
  }
  function closeMegas(except) { megas.forEach(function (li) { if (li !== except) setMega(li, false); }); }
  megas.forEach(function (li) {
    var b = li.querySelector('.mega-btn'), t;
    b.addEventListener('click', function () {
      clearTimeout(t);
      var open = li.classList.contains('is-open');
      if (wide.matches) closeMegas(li);
      if (open && !li.pinned && wide.matches && canHover.matches) { li.pinned = true; return; } // opened by hover: a click keeps it open
      setMega(li, !open); li.pinned = !open;
    });
    li.addEventListener('mouseenter', function () {
      if (!wide.matches || !canHover.matches) return;
      clearTimeout(t); t = setTimeout(function () { closeMegas(li); setMega(li, true); }, 90);
    });
    li.addEventListener('mouseleave', function () {
      if (!wide.matches || !canHover.matches) return;
      clearTimeout(t); t = setTimeout(function () { if (!li.pinned) setMega(li, false); }, 260);
    });
    li.addEventListener('focusout', function (e) {
      if (wide.matches && e.relatedTarget && !li.contains(e.relatedTarget)) setMega(li, false);
    });
  });
  if (megas.length) {
    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      megas.forEach(function (li) {
        if (!li.classList.contains('is-open')) return;
        var inside = li.contains(doc.activeElement);
        setMega(li, false);
        if (inside) li.querySelector('.mega-btn').focus();
      });
    });
    doc.addEventListener('click', function (e) { if (wide.matches && !(e.target.closest && e.target.closest('.has-mega'))) closeMegas(); });
  }

  /* the board: what is open right now, on Amman time wherever the visitor is */
  function ammanNow() {
    var d = new Date(), day = d.getDay(), h = d.getHours(), m = d.getMinutes();
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Amman', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d), o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday); h = Number(o.hour) % 24; m = Number(o.minute);
    } catch (e) { /* older browsers: fall back to the visitor's clock */ }
    return { day: day, mins: h * 60 + m, h: h };
  }
  function mins(s) { var p = String(s).split(':'); return Number(p[0]) * 60 + Number(p[1]); }
  function clock(total) { var h = Math.floor(total / 60), m = total % 60; return ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'ص' : 'م'); }
  function statusOf(el, now) {
    if (el.hasAttribute('data-always')) return { open: true, text: 'مفتوح الآن، على مدار الساعة' };
    var days = (el.getAttribute('data-days') || '').split(',').filter(function (x) { return x !== ''; }).map(Number);
    var o = mins(el.getAttribute('data-open')), c = mins(el.getAttribute('data-close'));
    if (!days.length || isNaN(o) || isNaN(c)) return null;
    if (days.indexOf(now.day) > -1 && now.mins >= o && now.mins < c) return { open: true, text: 'مفتوح الآن، يغلق ' + clock(c) };
    for (var i = 0; i < 8; i++) {
      var d = (now.day + i) % 7;
      if (days.indexOf(d) > -1 && (i > 0 || now.mins < o)) {
        return { open: false, text: 'مغلق الآن، يفتح ' + (i === 0 ? 'اليوم' : i === 1 ? 'غدًا' : DAYS[d]) + ' ' + clock(o) };
      }
    }
    return null;
  }
  function tick() {
    var now = ammanNow();
    doc.querySelectorAll('.sign').forEach(function (el) {
      var out = el.querySelector('[data-status]');
      if (!out || !(el.hasAttribute('data-always') || el.hasAttribute('data-open'))) return;
      var s = statusOf(el, now);
      if (!s) return;
      out.textContent = s.text; out.setAttribute('data-state', s.open ? 'open' : 'closed');
    });
    var g = doc.querySelector('[data-greeting]'), c = doc.querySelector('[data-clock]');
    if (g) g.textContent = now.h >= 5 && now.h < 12 ? 'صباح الخير.' : now.h >= 12 ? 'مساء الخير.' : 'أهلًا بك.';
    if (c) c.textContent = DAYS[now.day] + '، ' + clock(now.mins) + ' بتوقيت عمّان';
  }
  if (doc.querySelector('.board')) { tick(); setInterval(tick, 30000); }

  /* department search */
  function norm(s) {
    return String(s).replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase().trim();
  }
  var q = doc.getElementById('dept-q');
  if (q) {
    var items = [].slice.call(doc.querySelectorAll('[data-dept]')), count = doc.querySelector('[data-dept-count]'), empty = doc.querySelector('[data-dept-empty]');
    var index = items.map(function (li) { return norm(li.textContent); });
    q.addEventListener('input', function () {
      var term = norm(q.value), shown = 0;
      items.forEach(function (li, i) { var ok = !term || index[i].indexOf(term) > -1; li.hidden = !ok; if (ok) shown++; });
      doc.querySelectorAll('.dept-group').forEach(function (g) { g.hidden = !g.querySelector('[data-dept]:not([hidden])'); });
      if (empty) empty.hidden = shown > 0;
      if (count) count.textContent = term ? (shown ? 'عدد النتائج: ' + shown : '') : '';
    });
  }

  /* gallery lightbox */
  var box = doc.querySelector('[data-lightbox]');
  if (box && box.showModal) doc.querySelectorAll('[data-zoom]').forEach(function (b) {
    b.addEventListener('click', function () {
      var im = b.querySelector('img'), cap = b.parentNode.querySelector('figcaption');
      box.querySelector('img').src = im.currentSrc || im.src; box.querySelector('img').alt = im.alt;
      box.querySelector('p').textContent = cap ? cap.textContent : '';
      box.showModal();
    });
  });
  if (box) box.addEventListener('click', function (e) { if (e.target === box) box.close(); });

  /* contact form: compose the email in the visitor's own mail app */
  var form = doc.querySelector('form[data-mailto]');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements, body = 'الاسم: ' + f.name.value + '\nالهاتف: ' + f.phone.value + '\n\n' + f.message.value;
    location.href = 'mailto:' + form.getAttribute('data-mailto') + '?subject=' + encodeURIComponent(f.topic.value + ' - ' + f.name.value) + '&body=' + encodeURIComponent(body);
  });
})();
