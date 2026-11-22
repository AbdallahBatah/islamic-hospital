/*!
 * Islamic Hospital website: page renderer.
 * One set of templates used three ways: the Node build (static HTML for hosting),
 * the admin panel's live preview, and the admin panel's "export site" button.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IHRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var FONT_URL = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap';
  /* Built-in photos: widths available on disk, height/width ratio, and the label shown in the admin panel. */
  var IMAGES = {
    'entrance-hero': { w: [440, 720], ratio: 1.25, label: 'المدخل الرئيسي (عمودية)' },
    'entrance': { w: [640, 1280], ratio: 1001 / 1502, label: 'المدخل الرئيسي (أفقية)' },
    'building': { w: [300, 447], ratio: 1, label: 'مبنى المستشفى من الخارج' },
    'lobby': { w: [320, 547], ratio: 365 / 547, label: 'جدار الشعار في الاستقبال' },
    'waiting': { w: [275], ratio: 183 / 275, label: 'قاعة الانتظار' },
    'flag': { w: [300, 462], ratio: 840 / 462, label: 'العلم الأردني عند المدخل' },
    'awareness': { w: [300, 480], ratio: 860 / 480, label: 'راية المستشفى ولوحة التوعية' },
    'operating-room': { w: [560, 1100], ratio: 1, label: 'غرفة العمليات (كاملة)' },
    'or-lights': { w: [360, 700], ratio: 500 / 700, label: 'غرفة العمليات: الإضاءة الجراحية' },
    'or-table': { w: [400, 800], ratio: 0.75, label: 'غرفة العمليات: الطاولة الجراحية' },
    'or-anesthesia': { w: [300, 540], ratio: 820 / 540, label: 'غرفة العمليات: جهاز التخدير' }
  };
  /* Icon set drawn for this site: [admin label, SVG shapes on a 24 grid]. */
  var ICONS = {
    "emergency": ["الطوارئ", "<rect x='3.5' y='3.5' width='17' height='17' rx='4'/><path d='M12 8v8M8 12h8'/>"],
    "stethoscope": ["سماعة طبية", "<path d='M5 3h2M13 3h2M6 3v6a4 4 0 0 0 8 0V3'/><path d='M10 13v2.500a4.5 4.5 0 0 0 9 0V14'/><circle cx='19' cy='12' r='2'/>"],
    "flask": ["مختبر", "<path d='M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.400a2 2 0 0 0 1.8-3l-5-9V3'/><path d='M7.8 15h8.4'/>"],
    "pill": ["دواء", "<rect x='2.5' y='8' width='19' height='8' rx='4' transform='rotate(-45 12 12)'/><path d='m9.2 9.2 5.6 5.6'/>"],
    "clock": ["ساعة", "<circle cx='12' cy='12' r='8.5'/><path d='M12 7.500V12l3 2'/>"],
    "briefcase": ["وظائف", "<rect x='3' y='7.5' width='18' height='12' rx='2'/><path d='M9 7.500V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.500M3 13h18'/>"],
    "scissors": ["جراحة", "<circle cx='6.5' cy='17.5' r='2.5'/><circle cx='17.5' cy='17.5' r='2.5'/><path d='M8 15.5 17 3M16 15.5 7 3'/>"],
    "baby": ["أطفال", "<circle cx='12' cy='13.5' r='7'/><path d='M9.5 12.500h.01M14.5 12.500h.01'/><path d='M10 16c1.2 1 2.8 1 4 0'/><path d='M12 6.500c-1.5-1.8 0-3.5 1.8-3'/>"],
    "brain": ["دماغ وأعصاب", "<path d='M12 6a3 3 0 0 0-5.6-1.5 3.2 3.2 0 0 0-2.2 5 3.4 3.4 0 0 0 .6 5.600A3.2 3.2 0 0 0 9 19.500a3 3 0 0 0 3-3z'/><path d='M12 6a3 3 0 0 0-5.6-1.5 3.2 3.2 0 0 0-2.2 5 3.4 3.4 0 0 0 .6 5.600A3.2 3.2 0 0 0 9 19.500a3 3 0 0 0 3-3z' transform='matrix(-1 0 0 1 24 0)'/>"],
    "eye": ["عيون", "<path d='M2.5 12s3.5-6.5 9.5-6.500S21.5 12 21.5 12s-3.5 6.5-9.5 6.500S2.5 12 2.5 12z'/><circle cx='12' cy='12' r='2.8'/>"],
    "heart": ["قلب", "<path d='M12 20s-7.5-4.5-7.5-10A4.3 4.3 0 0 1 12 7.5 4.3 4.3 0 0 1 19.5 10c0 5.5-7.5 10-7.5 10z'/><path d='M7.5 12.500h2l1.5-2.5 2 4.5 1.5-2h2'/>"],
    "monitor": ["عناية مركزة", "<rect x='3' y='4.5' width='18' height='12' rx='2'/><path d='M6.5 11h2.500l1.5-2.5 2.5 5 1.5-2.500h3'/><path d='M9 20h6M12 16.500V20'/>"],
    "bed": ["سرير", "<path d='M3 18V7M3 14h18v4M21 14v-1.500a3 3 0 0 0-3-3h-7V14'/><circle cx='7' cy='10.5' r='1.8'/>"],
    "dumbbell": ["علاج طبيعي", "<path d='M6.5 7.500v9M3.5 10v4M17.5 7.500v9M20.5 10v4M6.5 12h11'/>"],
    "tooth": ["أسنان", "<path d='M7.5 3.500c-2.5 0-4 2-4 4.5 0 2 .8 3.2 1.2 5 .5 2.3.6 7.5 2.3 7.5 1.8 0 1.5-5.5 3-5.500h4c1.5 0 1.2 5.5 3 5.5 1.7 0 1.8-5.2 2.3-7.5.4-1.8 1.2-3 1.2-5 0-2.5-1.5-4.5-4-4.5-1.8 0-2.5 1-4.5 1s-2.7-1-4.5-1z'/>"],
    "atom": ["طب نووي", "<circle cx='12' cy='12' r='1.3'/><ellipse cx='12' cy='12' rx='9' ry='3.6'/><ellipse cx='12' cy='12' rx='9' ry='3.6' transform='rotate(60 12 12)'/><ellipse cx='12' cy='12' rx='9' ry='3.6' transform='rotate(120 12 12)'/>"],
    "lungs": ["تنفسية", "<path d='M12 3.500V10M12 10l-2.5 2M12 10l2.5 2'/><path d='M9.5 8c-3 .5-6 5-6 9 0 1.8 1 2.8 2.5 2.8 2 0 3.5-1.2 3.5-3z'/><path d='M9.5 8c-3 .5-6 5-6 9 0 1.8 1 2.8 2.5 2.8 2 0 3.5-1.2 3.5-3z' transform='matrix(-1 0 0 1 24 0)'/>"],
    "drip": ["علاج وريدي", "<rect x='8' y='3' width='8' height='10' rx='2'/><path d='M10.5 6.500h3M12 13v2.5'/><path d='M12 17.300c-1.4 1.5-1.4 3.7 0 3.700s1.4-2.2 0-3.700z'/>"],
    "waves": ["تفتيت الحصى", "<circle cx='7' cy='12' r='2.5'/><path d='M12.5 8.500a5 5 0 0 1 0 7M15.5 6a8.5 8.5 0 0 1 0 12M18.5 4a12 12 0 0 1 0 16'/>"],
    "scope": ["تنظير", "<path d='M3 4h4M5 4v8a4.5 4.5 0 0 0 9 0v-2a3 3 0 0 1 6 0v7'/><circle cx='20' cy='19' r='2'/>"],
    "droplet": ["غسيل كلى", "<path d='M12 3.500s6 6.2 6 10.500a6 6 0 0 1-12 0c0-4.3 6-10.5 6-10.500z'/><path d='M9.5 14.500A2.5 2.5 0 0 0 12 17'/>"],
    "phone": ["هاتف", "<path d='M5 4h4l2 5-2.5 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'/>"],
    "mobile": ["خلوي", "<rect x='7' y='2.5' width='10' height='19' rx='2.5'/><path d='M11 18h2'/>"],
    "mail": ["بريد", "<rect x='3' y='5.5' width='18' height='13' rx='2'/><path d='m3.5 7.5 8.5 6 8.5-6'/>"],
    "pin": ["موقع", "<path d='M12 21s7-6.1 7-11.500a7 7 0 1 0-14 0C5 14.9 12 21 12 21z'/><circle cx='12' cy='9.5' r='2.4'/>"],
    "calendar": ["تاريخ", "<rect x='3.5' y='5' width='17' height='15' rx='2'/><path d='M3.5 10h17M8 3v4M16 3v4'/>"],
    "news": ["أخبار", "<rect x='4' y='4' width='16' height='16' rx='2'/><path d='M8 8.500h8M8 12h8M8 15.500h5'/>"],
    "image": ["صور", "<rect x='3' y='5' width='18' height='14' rx='2'/><circle cx='8.5' cy='10' r='1.5'/><path d='m4 17 5-4.5 3.5 3 3-2.5 4.5 4'/>"],
    "building": ["مبنى المستشفى", "<path d='M5 21V5a1.5 1.5 0 0 1 1.5-1.500h11A1.5 1.5 0 0 1 19 5v16M3 21h18M10 21v-4h4v4M12 7v4M10 9h4'/>"],
    "users": ["كوادر", "<circle cx='9' cy='8' r='3'/><path d='M3.5 19.500a5.5 5.5 0 0 1 11 0'/><path d='M16 5.300a3 3 0 0 1 0 5.400M17.5 14.300a5.5 5.5 0 0 1 3 5.2'/>"],
    "book": ["تعليم وتدريب", "<path d='M12 6.500c-2-1.5-5-2-8-1.500v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.500V5c-3-.5-6 0-8 1.500zM12 6.500v13'/>"],
    "hand-heart": ["غير ربحية", "<path d='M12 11s-4-2.3-4-5a2.3 2.3 0 0 1 4-1.500A2.3 2.3 0 0 1 16 6c0 2.7-4 5-4 5z'/><path d='M3 14.500h3l4.5 1.500h3a1.5 1.5 0 0 1 0 3H10'/><path d='M3 20.500h9.500l7.5-3.500a1.6 1.6 0 0 0-1.5-2.800L15 15.7'/>"],
    "search": ["بحث", "<circle cx='11' cy='11' r='6.5'/><path d='m16 16 4.5 4.5'/>"],
    "info": ["معلومات", "<circle cx='12' cy='12' r='8.5'/><path d='M12 11v5M12 8h.01'/>"],
    "menu": ["قائمة", "<path d='M4 6h16M4 12h16M4 18h10'/>"]
  };
  var MONTHS = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
  var DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var WEEK = [6, 0, 1, 2, 3, 4, 5]; // the week starts on Saturday in Jordan

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function lines(s) { return String(s || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function paras(s) { return String(s || '').split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function tel(n) { return 'tel:' + String(n || '').replace(/[^\d+]/g, ''); }
  function ltr(s) { return '<span dir="ltr" class="ltr">' + esc(s) + '</span>'; }
  function dateText(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1] : '';
  }
  function timeText(hhmm) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
    if (!m) return '';
    var h = Number(m[1]);
    return ((h % 12) || 12) + ':' + m[2] + ' ' + (h < 12 ? 'ص' : 'م');
  }
  function dayList(csv) {
    return String(csv || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x !== ''; }).map(Number);
  }
  function daysText(csv) {
    var set = dayList(csv);
    if (!set.length) return '';
    if (set.length === 7) return 'يوميًا';
    var ordered = WEEK.filter(function (d) { return set.indexOf(d) > -1; });
    var first = WEEK.indexOf(ordered[0]);
    var contiguous = ordered.every(function (d, i) { return WEEK[first + i] === d; });
    if (contiguous && ordered.length > 2) return DAYS[ordered[0]] + ' – ' + DAYS[ordered[ordered.length - 1]];
    return ordered.map(function (d) { return DAYS[d]; }).join('، ');
  }
  function scheduleText(sign) {
    if (sign.always) return 'على مدار الساعة';
    if (!sign.open || !sign.close) return '';
    return daysText(sign.days) + '، ' + timeText(sign.open) + ' – ' + timeText(sign.close);
  }

  /* ---------- links, images, icons ---------- */
  function L(ctx, path) {
    return ctx.app ? 'href="#" data-route="' + esc(path) + '"' : 'href="' + esc(ctx.prefix + path) + '"';
  }
  function img(ctx, name, alt, sizes, opt) {
    opt = opt || {};
    var load = opt.eager ? 'fetchpriority="high"' : 'loading="lazy"';
    var m = IMAGES[name];
    if (!m) {
      if (!name) return '';
      var src = /^(data:|https?:)/.test(name) ? name : ctx.img(name);
      return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" ' + load + ' decoding="async">';
    }
    var big = m.w[m.w.length - 1];
    var attrs = 'src="' + ctx.img(name + '-' + big + '.webp') + '"';
    if (!ctx.app && m.w.length > 1) {
      attrs += ' srcset="' + m.w.map(function (w) { return ctx.img(name + '-' + w + '.webp') + ' ' + w + 'w'; }).join(', ') + '" sizes="' + sizes + '"';
    }
    return '<img ' + attrs + ' width="' + big + '" height="' + Math.round(big * m.ratio) + '" alt="' + esc(alt) + '" ' + load + ' decoding="async">';
  }
  /* Icons are referenced from one sprite per page, so each shape is sent once however often it is used. */
  function ic(ctx, name, cls) {
    if (!ICONS[name]) return '';
    (ctx.icons || (ctx.icons = {}))[name] = 1;
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }
  function sprite(ctx) {
    var names = Object.keys(ctx.icons || {});
    if (!names.length) return '';
    return '<svg class="sprite" aria-hidden="true"><defs>' + names.map(function (n) { return '<symbol id="i-' + n + '" viewBox="0 0 24 24">' + ICONS[n][1] + '</symbol>'; }).join('') + '</defs></svg>\n';
  }
  var ICON = {
    arrow: '<svg class="i-arrow" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M14.5 5 7.5 12l7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  /* The logo's own composition: a crescent cradling a drop, with a photo where the calligraphy sits. */
  function moonArt(ctx, id, image, alt, sizes, eager) {
    return '<div class="moonart"><svg class="moonart__moon" viewBox="0 0 520 600" aria-hidden="true"><defs><mask id="' + id + '"><rect width="520" height="600" fill="#fff"/><circle cx="328" cy="316" r="232" fill="#000"/></mask></defs>' +
      '<circle class="moon" cx="262" cy="338" r="252" mask="url(#' + id + ')"/>' +
      '<path class="star" d="M0-17 4.2-8.7 13.3-10.6 9.4-2.1 16.6 3.8 7.5 5.9 7.4 15.3 0 9.6-7.4 15.3-7.5 5.9-16.6 3.8-9.4-2.1-13.3-10.6-4.2-8.7Z" transform="translate(280 50)"/></svg>' +
      '<div class="moonart__drop">' + img(ctx, image, alt, sizes, { eager: eager }) + '</div></div>';
  }

  /* ---------- routes ---------- */
  var NAV = [
    ['index.html', 'الرئيسية', 'home', 'building'], ['about.html', 'من نحن', 'about', 'info'], ['departments.html', 'الأقسام', 'departments', 'stethoscope'],
    ['news.html', 'الأخبار', 'news', 'news'], ['gallery.html', 'معرض الصور', 'gallery', 'image'], ['careers.html', 'الوظائف', 'careers', 'briefcase'], ['contact.html', 'اتصل بنا', 'contact', 'phone']
  ];
  function publishedNews(c) {
    return (c.news || []).filter(function (n) { return n.published && n.slug; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }
  function routes(c) {
    var out = NAV.map(function (n) { return { path: n[0], label: n[1], key: n[2], seo: (c.seo || {})[n[2]] || {} }; });
    publishedNews(c).forEach(function (n) {
      out.push({ path: 'news/' + n.slug + '.html', label: n.title, key: 'article', article: n, seo: { title: n.title + ' | ' + c.settings.siteName, description: n.excerpt } });
    });
    return out;
  }
  function canonical(c, path) {
    return String(c.settings.siteUrl || '').replace(/\/+$/, '') + '/' + (path === 'index.html' ? '' : path);
  }

  /* ---------- shared blocks ---------- */
  function pageHead(c, ctx, title, sub, crumbs, image) {
    var trail = [['index.html', 'الرئيسية']].concat(crumbs || []);
    return '<header class="page-head"><div class="wrap page-head__grid"><div>' +
      '<nav class="crumbs" aria-label="مسار الصفحة"><ol>' +
      trail.map(function (t) { return '<li><a ' + L(ctx, t[0]) + '>' + esc(t[1]) + '</a></li>'; }).join('') +
      '<li aria-current="page">' + esc(title) + '</li></ol></nav>' +
      '<h1>' + esc(title) + '</h1>' + (sub ? '<p class="page-head__sub">' + esc(sub) + '</p>' : '') + '</div>' +
      (image ? '<div class="page-head__art">' + moonArt(ctx, 'head-moon', image, '', '180px') + '</div>' : '') +
      '</div></header>';
  }
  function factsBlock(c, ctx) {
    return '<dl class="facts">' + (c.facts || []).map(function (f) {
      return '<div><dt>' + ic(ctx, f.icon) + esc(f.label) + '</dt><dd>' + esc(f.value) + '</dd></div>';
    }).join('') + '</dl>';
  }
  function signCell(ctx, s) {
    var sched = scheduleText(s);
    return '<li><a class="sign" ' + L(ctx, s.link || 'contact.html') +
      (s.always ? ' data-always="1"' : '') + (s.open && s.close ? ' data-days="' + esc(s.days) + '" data-open="' + esc(s.open) + '" data-close="' + esc(s.close) + '"' : '') + '>' +
      ic(ctx, s.icon, 'sign__ic') +
      '<span class="sign__label">' + esc(s.label) + '</span>' +
      '<span class="sign__note">' + esc(s.note) + '</span>' +
      (sched ? '<span class="sign__status" data-status>' + esc(sched) + '</span>' : '') +
      ICON.arrow + '</a></li>';
  }
  function newsRow(ctx, n, tag) {
    var href = L(ctx, 'news/' + n.slug + '.html');
    return '<li><article class="news-row' + (n.image ? ' news-row--thumb' : '') + '"><time datetime="' + esc(n.date) + '">' + ic(ctx, 'calendar') + dateText(n.date) + '</time><div><' + tag + '><a ' + href + '>' + esc(n.title) + '</a></' + tag + '><p>' + esc(n.excerpt) + '</p></div>' +
      (n.image ? '<a class="news-row__thumb" ' + href + ' tabindex="-1" aria-hidden="true">' + img(ctx, n.image, '', '160px') + '</a>' : '') + '</article></li>';
  }
  function contactLines(c, ctx) {
    var s = c.settings;
    return '<ul class="contact-lines">' +
      '<li><span>' + ic(ctx, 'phone') + 'الهاتف</span><a href="' + tel(s.phoneMain) + '">' + ltr(s.phoneMain) + '</a></li>' +
      (s.phoneMobile ? '<li><span>' + ic(ctx, 'mobile') + 'الخلوي</span><a href="' + tel(s.phoneMobile) + '">' + ltr(s.phoneMobile) + '</a></li>' : '') +
      '<li><span>' + ic(ctx, 'mail') + 'البريد الإلكتروني</span><a href="mailto:' + esc(s.email) + '">' + ltr(s.email) + '</a></li>' +
      '<li><span>' + ic(ctx, 'pin') + 'العنوان</span><span>' + esc(s.address) + '</span></li></ul>';
  }

  /* ---------- mega menu: each panel is filled from the content, nothing to maintain by hand ---------- */
  function megaPanels(c, ctx) {
    var s = c.settings, a = c.about, out = {};
    var col = function (title, href, body, cls) {
      return '<div class="mega__col' + (cls ? ' ' + cls : '') + '"><p class="mega__title">' + (href ? '<a ' + L(ctx, href) + '>' + esc(title) + '</a>' : esc(title)) + '</p>' + body + '</div>';
    };
    var item = function (attr, text, icon) { return '<li><a ' + attr + '>' + ic(ctx, icon) + '<span>' + text + '</span></a></li>'; };
    var links = function (items) { return '<ul class="mega__links">' + items.map(function (x) { return item(L(ctx, x[0]), esc(x[1]), x[2]); }).join('') + '</ul>'; };
    var tile = function (href, image, text) { // photo tile; on small screens only its caption link is shown
      return '<a class="mega__tile" ' + L(ctx, href) + '>' + img(ctx, image, '', '260px') + '<span>' + text + ' ' + ICON.arrow + '</span></a>';
    };

    out.about = '<div class="mega__col mega__col--lead">' + tile('about.html', a.image, 'صفحة من نحن') + '</div>' +
      col(a.subtitle, 'about.html', '<p class="mega__text">' + esc(c.home.lede) + '</p>' + links((a.sections || []).map(function (x, i) { return ['about.html#about-' + (i + 1), x.title]; }))) +
      col('بطاقة تعريف', '', '<dl class="mega__facts">' + (c.facts || []).slice(0, 4).map(function (f) { return '<div><dt>' + ic(ctx, f.icon) + esc(f.label) + '</dt><dd>' + esc(f.value) + '</dd></div>'; }).join('') + '</dl>', 'mega__col--extra');

    out.departments = (c.departmentsPage.groups || []).map(function (g) {
      var items = (c.departments || []).filter(function (d) { return d.group === g.id; });
      return items.length ? col(g.title, 'departments.html#' + g.id, links(items.map(function (d) { return ['departments.html#' + d.id, d.name, d.icon]; })), 'mega__col--' + g.id) : '';
    }).join('') + '<div class="mega__col mega__col--tile">' + tile('departments.html', c.departmentsPage.image, 'الدليل كاملًا مع البحث') + '</div>';

    var news = publishedNews(c).slice(0, 3);
    if (news.length) out.news = col(c.home.newsTitle, 'news.html', '<ul class="mega__news">' + news.map(function (n) {
      return '<li><a ' + L(ctx, 'news/' + n.slug + '.html') + '>' + (n.image ? img(ctx, n.image, '', '120px') : '<span class="mega__ph">' + ic(ctx, 'news') + '</span>') +
        '<span><time datetime="' + esc(n.date) + '">' + dateText(n.date) + '</time><b>' + esc(n.title) + '</b></span></a></li>';
    }).join('') + '</ul><p class="mega__all"><a class="more" ' + L(ctx, 'news.html') + '>كل الأخبار ' + ICON.arrow + '</a></p>', 'mega__col--wide');

    out.contact = col(c.contactPage.emergencyTitle, 'contact.html#emergency', '<p class="mega__text">' + esc(c.contactPage.emergencyText) + '</p><p><a class="mega__big" href="' + tel(s.phoneEmergency) + '">' + ic(ctx, 'emergency') + ltr(s.phoneEmergency) + '</a></p>', 'mega__col--alert') +
      col('الهاتف والبريد', '', '<ul class="mega__links">' + item('href="' + tel(s.phoneMain) + '"', ltr(s.phoneMain), 'phone') + (s.phoneMobile ? item('href="' + tel(s.phoneMobile) + '"', ltr(s.phoneMobile), 'mobile') : '') + item('href="mailto:' + esc(s.email) + '"', ltr(s.email), 'mail') + '</ul>') +
      col('الوصول والدوام', '', '<ul class="mega__links">' + item('href="' + esc(s.mapUrl) + '" target="_blank" rel="noopener"', 'افتح الموقع على خرائط Google', 'pin') + item(L(ctx, 'contact.html#hours'), esc(c.contactPage.hoursTitle), 'clock') + item(L(ctx, 'contact.html'), 'أرسل استفسارك', 'mail') + '</ul><p class="mega__text">' + esc(s.address) + '</p>') +
      '<div class="mega__col mega__col--tile">' + tile('contact.html', c.contactPage.image, 'صفحة اتصل بنا') + '</div>';
    return out;
  }

  /* ---------- pages ---------- */
  var PAGES = {};

  PAGES.home = function (c, ctx) {
    var h = c.home, s = c.settings;
    var centers = (c.departments || []).filter(function (d) { return d.group === 'centers'; });
    var news = publishedNews(c).slice(0, 3);
    return '' +
      '<section class="hero"><div class="wrap hero__grid">' +
        '<div class="hero__text"><h1>' + esc(h.h1) + '</h1><p class="lede">' + esc(h.lede) + '</p>' +
        '<p class="actions"><a class="btn" ' + L(ctx, 'departments.html') + '>' + ic(ctx, 'search') + 'دليل الأقسام والمراكز</a>' +
        '<a class="btn btn--line" href="' + tel(s.phoneMain) + '">' + ic(ctx, 'phone') + 'اتصل بالمستشفى ' + ltr(s.phoneMain) + '</a></p></div>' +
        '<div class="hero__art">' + moonArt(ctx, 'hero-moon', h.heroImage, h.heroAlt, '(max-width: 760px) 60vw, 250px', true) + '</div>' +
      '</div></section>' +

      '<section class="board" aria-labelledby="board-q"><div class="wrap">' +
        '<div class="board__head"><h2 id="board-q"><span data-greeting>أهلًا بك.</span> ' + esc(h.boardQuestion) + '</h2>' +
        '<p class="board__clock" data-clock aria-live="off"></p></div>' +
        '<ul class="board__grid">' + (c.signs || []).map(function (x) { return signCell(ctx, x); }).join('') + '</ul>' +
      '</div></section>' +

      '<section class="band"><div class="wrap about-teaser">' +
        '<div class="about-teaser__text"><h2>' + esc(h.aboutTitle) + '</h2><p>' + esc(h.aboutText) + '</p>' +
        '<blockquote class="quote"><p>«' + esc(h.quote) + '»</p><footer>' + esc(h.quoteSource) + '</footer></blockquote>' +
        '<p><a class="more" ' + L(ctx, 'about.html') + '>اقرأ عن المستشفى ' + ICON.arrow + '</a></p></div>' +
        '<div class="about-teaser__facts">' + (h.aboutImage ? '<figure class="photo">' + img(ctx, h.aboutImage, h.aboutImageAlt, '(max-width: 900px) 100vw, 480px') + '</figure>' : '') + factsBlock(c, ctx) + '</div>' +
      '</div></section>' +

      '<section class="band band--mint"><div class="wrap centers">' +
        '<div class="centers__media">' + img(ctx, 'operating-room', 'غرفة عمليات في المستشفى الإسلامي مجهزة بطاولة وإضاءة جراحية', '(max-width: 900px) 100vw, 480px') + '</div>' +
        '<div class="centers__body"><h2>' + esc(h.deptTitle) + '</h2><p>' + esc(h.deptText) + '</p>' +
        '<ul class="dir dir--plain">' + centers.map(function (d) {
          return '<li><a ' + L(ctx, 'departments.html#' + d.id) + '>' + ic(ctx, d.icon, 'ic--tile') + '<span>' + esc(d.name) + '</span>' + ICON.arrow + '</a></li>';
        }).join('') + '</ul>' +
        '<p><a class="btn" ' + L(ctx, 'departments.html') + '>كل الأقسام والوحدات</a></p></div>' +
      '</div></section>' +

      (news.length ? '<section class="band"><div class="wrap"><div class="band__head"><h2>' + esc(h.newsTitle) + '</h2><a class="more" ' + L(ctx, 'news.html') + '>كل الأخبار ' + ICON.arrow + '</a></div>' +
        '<ul class="news-list">' + news.map(function (n) { return newsRow(ctx, n, 'h3'); }).join('') + '</ul></div></section>' : '') +

      '<section class="band band--ink"><div class="wrap reach' + (h.reachImage ? ' reach--photo' : '') + '">' +
        '<div><h2>الوصول إلى المستشفى</h2><p>' + esc(s.address) + '</p>' +
        '<p class="actions"><a class="btn btn--light" href="' + esc(s.mapUrl) + '" target="_blank" rel="noopener">' + ic(ctx, 'pin') + 'افتح الموقع على خرائط Google</a>' +
        '<a class="btn btn--ghost" ' + L(ctx, 'contact.html') + '>كل طرق التواصل</a></p></div>' +
        contactLines(c, ctx) +
        (h.reachImage ? '<figure class="photo reach__photo">' + img(ctx, h.reachImage, h.reachImageAlt, '(max-width: 900px) 100vw, 300px') + '</figure>' : '') +
      '</div></section>';
  };

  PAGES.about = function (c, ctx) {
    var a = c.about, h = c.home;
    return pageHead(c, ctx, a.h1, a.subtitle, null, a.headImage) +
      '<div class="wrap about"><div class="about__main">' +
      (a.sections || []).map(function (s, i) {
        return '<section id="about-' + (i + 1) + '"><h2>' + esc(s.title) + '</h2>' + paras(s.text).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</section>' +
          (i === 0 ? '<blockquote class="quote quote--big"><p>«' + esc(h.quote) + '»</p><footer>' + esc(h.quoteSource) + '</footer></blockquote>' : '');
      }).join('') +
      '</div><aside class="about__side"><figure class="photo">' + img(ctx, a.image, a.imageAlt, '(max-width: 900px) 100vw, 420px') + '</figure>' +
      '<h2 class="side-title">بطاقة تعريف</h2>' + factsBlock(c, ctx) + '</aside></div>';
  };

  PAGES.departments = function (c, ctx) {
    var p = c.departmentsPage;
    return pageHead(c, ctx, p.h1, p.intro, null, p.image) +
      '<div class="wrap depts">' +
      '<form class="search" role="search" onsubmit="return false"><label for="dept-q">ابحث عن قسم أو مركز</label>' +
      '<div class="search__box">' + ic(ctx, 'search') + '<input id="dept-q" type="search" placeholder="مثال: العيون، الكلى، المختبر" autocomplete="off" enterkeyhint="search"></div>' +
      '<p class="search__count" data-dept-count aria-live="polite"></p></form>' +
      (p.groups || []).map(function (g) {
        var items = (c.departments || []).filter(function (d) { return d.group === g.id; });
        if (!items.length) return '';
        return '<section class="dept-group" id="' + esc(g.id) + '"><h2>' + esc(g.title) + '</h2><ul class="dir">' +
          items.map(function (d) {
            return '<li id="' + esc(d.id) + '" data-dept>' + ic(ctx, d.icon || 'stethoscope', 'ic--tile') + '<div><h3>' + esc(d.name) + '</h3><p>' + esc(d.desc) + '</p>' +
              (d.phone ? '<a class="dir__tel" href="' + tel(d.phone) + '">' + ltr(d.phone) + '</a>' : '') + '</div></li>';
          }).join('') + '</ul></section>';
      }).join('') +
      '<p class="empty" data-dept-empty hidden>لا يوجد قسم بهذا الاسم. جرّب كلمة أقصر، أو اتصل بالمقسم على ' + ltr(c.settings.phoneMain) + '.</p>' +
      '</div>';
  };

  PAGES.news = function (c, ctx) {
    var p = c.newsPage, list = publishedNews(c);
    return pageHead(c, ctx, p.h1, p.intro, null, p.image) + '<div class="wrap narrow">' +
      (list.length ? '<ul class="news-list">' + list.map(function (n) { return newsRow(ctx, n, 'h2'); }).join('') + '</ul>' : '<p class="empty">' + esc(p.empty) + '</p>') + '</div>';
  };

  PAGES.article = function (c, ctx, route) {
    var n = route.article;
    return pageHead(c, ctx, n.title, '', [['news.html', 'الأخبار']]) +
      '<article class="wrap narrow article"><p class="article__date">' + ic(ctx, 'calendar') + '<time datetime="' + esc(n.date) + '">' + dateText(n.date) + '</time></p>' +
      (n.image ? '<figure class="photo">' + img(ctx, n.image, n.imageAlt || n.title, '(max-width: 800px) 100vw, 760px') + '</figure>' : '') +
      paras(n.body).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      '<p><a class="more more--back" ' + L(ctx, 'news.html') + '>العودة إلى الأخبار</a></p></article>';
  };

  PAGES.gallery = function (c, ctx) {
    var p = c.galleryPage;
    return pageHead(c, ctx, p.h1, p.intro, null, p.image) + '<div class="wrap"><ul class="gallery">' +
      (c.gallery || []).map(function (g) {
        return '<li><figure><button type="button" class="gallery__open" data-zoom aria-label="تكبير الصورة: ' + esc(g.caption) + '">' +
          img(ctx, g.image, g.alt, '(max-width: 700px) 100vw, 380px') + '</button><figcaption>' + esc(g.caption) + '</figcaption></figure></li>';
      }).join('') + '</ul></div>' +
      '<dialog class="lightbox" data-lightbox aria-label="عرض الصورة"><form method="dialog"><button class="lightbox__close" aria-label="إغلاق">إغلاق</button></form><img alt=""><p></p></dialog>';
  };

  PAGES.careers = function (c, ctx) {
    var p = c.careersPage, s = c.settings;
    var jobs = (c.jobs || []).filter(function (j) { return j.published; });
    var mail = function (subject) { return 'mailto:' + esc(s.email) + '?subject=' + encodeURIComponent(subject); };
    return pageHead(c, ctx, p.h1, p.intro, null, p.image) + '<div class="wrap careers">' +
      '<section class="careers__jobs"><h2>الشواغر الحالية</h2>' +
      (jobs.length ? '<ul class="jobs">' + jobs.map(function (j) {
        return '<li>' + ic(ctx, 'briefcase', 'ic--tile') + '<div><h3>' + esc(j.title) + '</h3><p class="jobs__meta">' + [j.dept, j.type, j.date ? 'أُعلن في ' + dateText(j.date) : ''].filter(Boolean).map(esc).join('، ') + '</p><p>' + esc(j.desc) + '</p></div>' +
          '<a class="btn btn--line" href="' + mail('طلب توظيف: ' + j.title) + '">قدّم على هذا الشاغر</a></li>';
      }).join('') + '</ul>' : '<p class="empty">' + esc(p.empty) + '</p><p><a class="btn" href="' + mail('سيرة ذاتية للحفظ') + '">' + ic(ctx, 'mail') + 'أرسل سيرتك الذاتية</a></p>') +
      '</section><aside class="careers__side"><h2>' + esc(p.applyTitle) + '</h2><ol class="steps">' +
      lines(p.applySteps).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      '<h2>' + esc(p.fieldsTitle) + '</h2><ul class="tags">' + lines(p.fields).map(function (x) { return '<li>' + ic(ctx, 'users') + esc(x) + '</li>'; }).join('') + '</ul></aside></div>';
  };

  PAGES.contact = function (c, ctx) {
    var p = c.contactPage, s = c.settings;
    var hours = (c.signs || []).filter(function (x) { return scheduleText(x); });
    return pageHead(c, ctx, p.h1, p.intro, null, p.image) + '<div class="wrap contact">' +
      '<div class="contact__col"><section class="contact__emergency" id="emergency"><h2>' + ic(ctx, 'emergency') + esc(p.emergencyTitle) + '</h2><p>' + esc(p.emergencyText) + '</p>' +
      '<a class="btn btn--alert" href="' + tel(s.phoneEmergency) + '">' + ic(ctx, 'phone') + 'اتصل بالطوارئ ' + ltr(s.phoneEmergency) + '</a></section>' +
      '<section class="contact__hours" id="hours"><h2>' + esc(p.hoursTitle) + '</h2><table class="hours"><tbody>' +
      hours.map(function (x) { return '<tr><th scope="row">' + ic(ctx, x.icon) + esc(x.label) + '</th><td>' + esc(scheduleText(x)) + '</td></tr>'; }).join('') + '</tbody></table></section></div>' +
      '<div class="contact__col"><section class="contact__info"><h2>أرقام وعناوين</h2>' + contactLines(c, ctx) +
      '<p><a class="btn btn--line" href="' + esc(s.mapUrl) + '" target="_blank" rel="noopener">' + ic(ctx, 'pin') + 'افتح الموقع على خرائط Google</a></p></section>' +
      '<section class="contact__form"><h2>' + esc(p.formTitle) + '</h2>' +
      '<form data-mailto="' + esc(s.email) + '" action="mailto:' + esc(s.email) + '" method="post" enctype="text/plain">' +
      '<div class="field"><label for="cf-name">الاسم</label><input id="cf-name" name="name" autocomplete="name" required></div>' +
      '<div class="field"><label for="cf-phone">رقم الهاتف</label><input id="cf-phone" name="phone" type="tel" inputmode="tel" dir="ltr" autocomplete="tel"></div>' +
      '<div class="field"><label for="cf-topic">الموضوع</label><select id="cf-topic" name="topic"><option>استفسار عام</option><option>مواعيد العيادات</option><option>شؤون المرضى</option><option>التوظيف</option></select></div>' +
      '<div class="field field--wide"><label for="cf-msg">رسالتك</label><textarea id="cf-msg" name="message" rows="5" required></textarea></div>' +
      '<p class="form-note">' + esc(p.formNote) + '</p><button class="btn" type="submit">' + ic(ctx, 'mail') + 'أرسل الرسالة</button></form></section></div></div>';
  };

  /* ---------- structured data ---------- */
  function schemas(c, route) {
    var s = c.settings, base = String(s.siteUrl || '').replace(/\/+$/, '');
    var out = [];
    var hospital = {
      '@context': 'https://schema.org', '@type': 'Hospital', '@id': base + '/#hospital',
      name: s.siteName, alternateName: s.siteNameEn, url: base + '/',
      logo: base + '/assets/img/logo.png', image: base + '/assets/img/og-cover.jpg',
      telephone: s.phoneMain, email: s.email,
      address: { '@type': 'PostalAddress', streetAddress: s.address, addressLocality: s.city, addressCountry: 'JO' },
      sameAs: [s.facebook, s.instagram, s.linkedin, s.youtube].filter(Boolean)
    };
    if (route.key === 'home' || route.key === 'contact' || route.key === 'about') out.push(hospital);
    if (route.key === 'home') out.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: s.siteName, alternateName: s.siteNameEn, url: base + '/', inLanguage: 'ar-JO' });
    if (route.key !== 'home') {
      var trail = [{ name: 'الرئيسية', path: 'index.html' }];
      if (route.key === 'article') trail.push({ name: 'الأخبار', path: 'news.html' });
      trail.push({ name: route.label, path: route.path });
      out.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: trail.map(function (t, i) { return { '@type': 'ListItem', position: i + 1, name: t.name, item: canonical(c, t.path) }; }) });
    }
    if (route.key === 'article') {
      var n = route.article;
      out.push({ '@context': 'https://schema.org', '@type': 'NewsArticle', headline: n.title, description: n.excerpt, datePublished: n.date, inLanguage: 'ar-JO', mainEntityOfPage: canonical(c, route.path), image: base + '/assets/img/og-cover.jpg', publisher: { '@type': 'Organization', name: s.siteName, logo: { '@type': 'ImageObject', url: base + '/assets/img/logo.png' } } });
    }
    return out.map(function (o) { return '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>'; }).join('\n');
  }

  /* ---------- full document ---------- */
  function renderPage(c, path, ctx) {
    var all = routes(c);
    var route = all.filter(function (r) { return r.path === path; })[0] || all[0];
    var s = c.settings, live = s.status === 'live';
    var depth = route.path.split('/').length - 1;
    ctx = ctx || {};
    ctx.icons = {};
    ctx.prefix = ctx.app ? '' : new Array(depth + 1).join('../');
    if (!ctx.img) ctx.img = function (f) { return ctx.prefix + 'assets/img/' + f; };
    var navKey = route.key === 'article' ? 'news' : route.key;
    var url = canonical(c, route.path), og = String(s.siteUrl || '').replace(/\/+$/, '') + '/assets/img/og-cover.jpg';
    var title = route.seo.title || route.label + ' | ' + s.siteName, desc = route.seo.description || '';
    var css = ctx.app ? '<style>' + ctx.css + '</style>' : '<link rel="stylesheet" href="' + ctx.prefix + 'assets/css/site.css">';
    var js = ctx.app ? '<script>' + ctx.js + '</script>' + (ctx.appScript || '') : '<script src="' + ctx.prefix + 'assets/js/site.js" defer></script>';
    var hero = IMAGES[c.home.heroImage];
    var heroPreload = (route.key === 'home' && !ctx.app && hero)
      ? '<link rel="preload" as="image" type="image/webp" href="' + ctx.img(c.home.heroImage + '-' + hero.w[hero.w.length - 1] + '.webp') + '" imagesrcset="' + hero.w.map(function (w) { return ctx.img(c.home.heroImage + '-' + w + '.webp') + ' ' + w + 'w'; }).join(', ') + '" imagesizes="(max-width: 760px) 60vw, 250px">\n' : '';

    var head = '<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(title) + '</title>\n' +
      '<meta name="description" content="' + esc(desc) + '">\n' +
      '<meta name="robots" content="' + (live ? 'index, follow, max-image-preview:large' : 'noindex, nofollow') + '">\n' +
      '<link rel="canonical" href="' + esc(url) + '">\n' +
      '<link rel="alternate" hreflang="ar-JO" href="' + esc(url) + '">\n' +
      '<meta property="og:type" content="' + (route.key === 'article' ? 'article' : 'website') + '">\n' +
      '<meta property="og:site_name" content="' + esc(s.siteName) + '">\n' +
      '<meta property="og:locale" content="ar_JO">\n' +
      '<meta property="og:title" content="' + esc(title) + '">\n' +
      '<meta property="og:description" content="' + esc(desc) + '">\n' +
      '<meta property="og:url" content="' + esc(url) + '">\n' +
      '<meta property="og:image" content="' + esc(og) + '">\n' +
      '<meta name="twitter:card" content="summary_large_image">\n' +
      '<meta name="theme-color" content="#0b3a3f">\n' +
      (ctx.app ? '' : '<link rel="icon" type="image/png" href="' + ctx.prefix + 'assets/img/favicon.png">\n<link rel="apple-touch-icon" href="' + ctx.prefix + 'assets/img/apple-touch-icon.png">\n') +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      heroPreload +
      '<link rel="stylesheet" href="' + FONT_URL + '" media="print" onload="this.media=\'all\'">\n' +
      '<noscript><link rel="stylesheet" href="' + FONT_URL + '"></noscript>\n' +
      css + '\n' + schemas(c, route) + '\n</head>\n';

    var panels = megaPanels(c, ctx);
    var nav = NAV.map(function (n) {
      var link = '<a ' + L(ctx, n[0]) + (n[2] === navKey ? ' aria-current="page"' : '') + '>' + ic(ctx, n[3], 'nav-ic') + n[1] + '</a>', panel = panels[n[2]];
      if (!panel) return '<li>' + link + '</li>';
      return '<li class="has-mega">' + link + '<button class="mega-btn" type="button" aria-expanded="false" aria-controls="mega-' + n[2] + '" aria-label="قائمة ' + n[1] + '">' + ICON.down + '</button>' +
        '<div class="mega" id="mega-' + n[2] + '"><div class="wrap mega__grid mega__grid--' + n[2] + '">' + panel + '</div></div></li>';
    }).join('');
    var social = [['facebook', 'فيسبوك'], ['instagram', 'إنستغرام'], ['linkedin', 'لينكدإن'], ['youtube', 'يوتيوب']]
      .filter(function (x) { return s[x[0]]; })
      .map(function (x) { return '<li><a href="' + esc(s[x[0]]) + '" target="_blank" rel="noopener">' + x[1] + '</a></li>'; }).join('');

    var body = '<body class="page-' + route.key + '">\n<a class="skip" href="#main">تجاوز إلى المحتوى</a>\n' +
      (live ? '' : '<p class="ribbon" role="note">' + esc(s.reviewNote) + '</p>\n') +
      '<header class="site-head">' +
        '<div class="util"><div class="wrap"><span>' + ic(ctx, 'pin') + esc(s.address) + '</span><a href="mailto:' + esc(s.email) + '">' + ic(ctx, 'mail') + ltr(s.email) + '</a></div></div>' +
        '<div class="wrap site-head__bar">' +
          '<a class="logo" ' + L(ctx, 'index.html') + ' aria-label="' + esc(s.siteName) + '، الصفحة الرئيسية"><img src="' + ctx.img('logo.png') + '" width="149" height="130" alt="' + esc(s.siteName) + '"></a>' +
          '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">' + ic(ctx, 'news') + '<span>القائمة</span></button>' +
          '<nav id="site-nav" class="site-nav" aria-label="القائمة الرئيسية"><ul>' + nav + '</ul></nav>' +
          '<a class="hotline" href="' + tel(s.phoneEmergency) + '">' + ic(ctx, 'emergency') + '<span class="hotline__label">الطوارئ</span>' + ltr(s.phoneEmergency) + '</a>' +
        '</div></header>\n' +
      '<main id="main">' + PAGES[route.key](c, ctx, route) + '</main>\n' +
      '<footer class="site-foot"><div class="wrap site-foot__grid">' +
        '<div class="site-foot__brand"><img src="' + ctx.img('logo-white.png') + '" width="126" height="110" alt="" loading="lazy"><p>مؤسسة طبية تعليمية غير ربحية في قلب عمّان منذ عام 1982.</p></div>' +
        '<nav aria-label="روابط الموقع"><h2>الموقع</h2><ul>' + NAV.map(function (n) { return '<li><a ' + L(ctx, n[0]) + '>' + n[1] + '</a></li>'; }).join('') + '</ul></nav>' +
        '<div><h2>تواصل معنا</h2><ul class="foot-contact"><li>' + ic(ctx, 'phone') + '<a href="' + tel(s.phoneMain) + '">' + ltr(s.phoneMain) + '</a></li>' + (s.phoneMobile ? '<li>' + ic(ctx, 'mobile') + '<a href="' + tel(s.phoneMobile) + '">' + ltr(s.phoneMobile) + '</a></li>' : '') + '<li>' + ic(ctx, 'mail') + '<a href="mailto:' + esc(s.email) + '">' + ltr(s.email) + '</a></li><li>' + ic(ctx, 'pin') + '<span>' + esc(s.address) + '</span></li></ul>' + (social ? '<ul class="social">' + social + '</ul>' : '') + '</div>' +
      '</div><div class="wrap site-foot__legal"><p>' + esc(s.copyright) + '</p></div></footer>\n' +
      '<nav class="dock" aria-label="اختصارات"><a href="' + tel(s.phoneMain) + '">' + ic(ctx, 'phone') + 'اتصل</a><a href="' + esc(s.mapUrl) + '" target="_blank" rel="noopener">' + ic(ctx, 'pin') + 'الموقع</a><a ' + L(ctx, 'departments.html') + '>' + ic(ctx, 'stethoscope') + 'الأقسام</a></nav>\n';
    return head + body + sprite(ctx) + js + '\n</body>\n</html>\n';
  }

  /* ---------- whole site ---------- */
  function utf8(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    return Uint8Array.from(Buffer.from(str, 'utf8'));
  }
  function b64ToBytes(b64) {
    if (typeof atob === 'function') { var bin = atob(b64), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
    return Uint8Array.from(Buffer.from(b64, 'base64'));
  }
  /* assets: { 'css/site.css': string, 'js/site.js': string, 'img/<file>': Uint8Array|string, 'extra/<path>': string } */
  function buildSite(content, assets, opt) {
    opt = opt || {};
    var c = JSON.parse(JSON.stringify(content)), files = {}, n = 0;
    (function walk(o) { // uploaded images (data URLs) become real files
      Object.keys(o).forEach(function (k) {
        var v = o[k];
        if (v && typeof v === 'object') return walk(v);
        var m = typeof v === 'string' && /^data:image\/(\w+);base64,(.+)$/.exec(v);
        if (m) { n++; var name = 'uploads/upload-' + n + '.' + m[1].replace('jpeg', 'jpg'); files['assets/img/' + name] = b64ToBytes(m[2]); o[k] = name; }
      });
    })(c);
    var today = opt.date || new Date().toISOString().slice(0, 10);
    var all = routes(c), live = c.settings.status === 'live';
    all.forEach(function (r) { files[r.path] = renderPage(c, r.path, {}); });
    Object.keys(assets).forEach(function (k) {
      if (k.indexOf('extra/') === 0) files[k.slice(6)] = assets[k]; else files['assets/' + k] = assets[k];
    });
    files['sitemap.xml'] = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      all.map(function (r) { return '  <url><loc>' + esc(canonical(c, r.path)) + '</loc><lastmod>' + (r.article ? r.article.date : today) + '</lastmod></url>'; }).join('\n') + '\n</urlset>\n';
    files['robots.txt'] = live
      ? 'User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ' + canonical(c, 'sitemap.xml') + '\n'
      : '# Review build: not for indexing. Switch the site status to "live" in the admin panel before launch.\nUser-agent: *\nDisallow: /\n';
    files['content.json'] = JSON.stringify(content, null, 2);
    return files;
  }

  /* ---------- zip (store only) ---------- */
  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  var NOW = new Date(), DOS_DATE = ((NOW.getFullYear() - 1980) << 9) | ((NOW.getMonth() + 1) << 5) | NOW.getDate();
  function zip(files) {
    var parts = [], central = [], offset = 0, names = Object.keys(files).sort();
    function header(sig, name, data, crc, extra) {
      var h = new Uint8Array(extra.length ? 46 : 30), v = new DataView(h.buffer), p = 0;
      v.setUint32(p, sig, true); p += 4;
      if (extra.length) { v.setUint16(p, 20, true); p += 2; }
      v.setUint16(p, 20, true); v.setUint16(p + 2, 0x0800, true); v.setUint16(p + 4, 0, true);
      v.setUint16(p + 6, 0, true); v.setUint16(p + 8, DOS_DATE, true); p += 10;
      v.setUint32(p, crc, true); v.setUint32(p + 4, data.length, true); v.setUint32(p + 8, data.length, true); p += 12;
      v.setUint16(p, name.length, true); v.setUint16(p + 2, 0, true); p += 4;
      if (extra.length) { p += 8; v.setUint32(p + 2, extra[0], true); }
      return h;
    }
    names.forEach(function (path) {
      var data = typeof files[path] === 'string' ? utf8(files[path]) : files[path], name = utf8(path), crc = crc32(data);
      parts.push(header(0x04034b50, name, data, crc, []), name, data);
      central.push(header(0x02014b50, name, data, crc, [offset]), name);
      offset += 30 + name.length + data.length;
    });
    var size = central.reduce(function (a, b) { return a + b.length; }, 0);
    var end = new Uint8Array(22), ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, names.length, true); ev.setUint16(10, names.length, true);
    ev.setUint32(12, size, true); ev.setUint32(16, offset, true);
    var all = parts.concat(central, [end]), total = all.reduce(function (a, b) { return a + b.length; }, 0), out = new Uint8Array(total), at = 0;
    all.forEach(function (p) { out.set(p, at); at += p.length; });
    return out;
  }

  return { routes: routes, renderPage: renderPage, buildSite: buildSite, zip: zip, scheduleText: scheduleText, dateText: dateText, b64ToBytes: b64ToBytes, IMAGES: IMAGES, ICONS: ICONS, NAV: NAV };
});
