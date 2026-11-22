/* Islamic Hospital: admin panel. Edits the content, previews it with the site's own renderer, and exports a ready-to-upload site. */
(function () {
  'use strict';
  var SOURCE = '<!doctype html>\n' + document.documentElement.outerHTML; // pristine copy of this file, reused by the export
  var R = window.IHRender;
  var DEFAULT = JSON.parse(document.getElementById('ih-content').textContent);
  var ASSETS = JSON.parse(document.getElementById('ih-assets').textContent);
  var KEY = 'ih-content-v1';
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  /* ---------- storage ---------- */
  var storeOk = true;
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY)); return v && v.settings && v.seo ? v : null; } catch (e) { storeOk = false; return null; } }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(content)); storeOk = true; } catch (e) { storeOk = false; } }
  var content = load() || clone(DEFAULT);
  Object.keys(DEFAULT).forEach(function (k) { if (content[k] === undefined) content[k] = clone(DEFAULT[k]); });

  var state = { view: document.documentElement.getAttribute('data-start') === 'site' ? 'site' : 'admin', section: 'overview', route: 'index.html', hash: '', scroll: 0, device: 'desktop', open: -1 };

  /* ---------- tiny DOM helpers ---------- */
  var uid = 0;
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (k === 'text') n.textContent = v; else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k, ''); else if (v !== false && v != null) n.setAttribute(k, v);
    });
    [].concat(kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function imgUrl(file) {
    var a = ASSETS['img/' + file];
    if (!a) return '';
    return 'data:image/' + (/\.png$/.test(file) ? 'png' : /\.jpe?g$/.test(file) ? 'jpeg' : 'webp') + ';base64,' + a.b64;
  }
  function thumb(v) {
    if (!v) return '';
    if (/^(data:|https?:)/.test(v)) return v;
    var m = R.IMAGES[v];
    return m ? imgUrl(v + '-' + m.w[0] + '.webp') : '';
  }

  /* ---------- preview ---------- */
  var frame, saveEl, routeSel, timer;
  function appScript() {
    return '<script>(function(){var Y=' + Number(state.scroll || 0) + ',H=' + JSON.stringify(state.hash || '') + ';' +
      'document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[data-route]");if(!a)return;e.preventDefault();parent.postMessage({ih:"route",route:a.getAttribute("data-route")},"*")});' +
      'var t;addEventListener("scroll",function(){clearTimeout(t);t=setTimeout(function(){parent.postMessage({ih:"scroll",y:scrollY},"*")},120)});' +
      'addEventListener("load",function(){document.documentElement.style.scrollBehavior="auto";var n=H&&document.getElementById(H);if(n){n.classList.add("is-target");n.scrollIntoView()}else if(Y)scrollTo(0,Y)});' +
      '})();<\/script>';
  }
  function refresh() {
    var all = R.routes(content);
    if (!all.some(function (r) { return r.path === state.route; })) state.route = 'index.html';
    frame.srcdoc = R.renderPage(content, state.route, { app: true, css: ASSETS['css/site.css'] + '.dept-group .dir li.is-target{padding-inline:.9rem;background:var(--mint);box-shadow:inset -3px 0 0 var(--teal)}', js: ASSETS['js/site.js'], img: imgUrl, appScript: appScript() });
    routeSel.innerHTML = '';
    all.forEach(function (r) { routeSel.appendChild(el('option', { value: r.path, text: r.label, selected: r.path === state.route })); });
  }
  function go(route) {
    var parts = String(route).split('#');
    state.route = parts[0] || 'index.html'; state.hash = parts[1] || ''; state.scroll = 0;
    refresh();
  }
  function changed() { // every edit: save, then repaint the preview where the editor was looking
    persist(); showSave();
    clearTimeout(timer); timer = setTimeout(function () { state.hash = ''; refresh(); }, 350);
  }
  function showSave() {
    saveEl.textContent = storeOk ? 'تُحفظ التعديلات تلقائيًا في هذا المتصفح' : 'تعذّر الحفظ في هذا المتصفح. صدّر الموقع أو ملف المحتوى للاحتفاظ بتعديلاتك.';
    saveEl.setAttribute('data-ok', storeOk ? '1' : '0');
  }
  window.addEventListener('message', function (e) {
    if (!frame || e.source !== frame.contentWindow || !e.data) return;
    if (e.data.ih === 'route') go(e.data.route);
    if (e.data.ih === 'scroll') state.scroll = e.data.y;
  });

  /* ---------- fields ---------- */
  var BUILTIN = [['', 'بدون صورة']].concat(Object.keys(R.IMAGES).map(function (k) { return [k, R.IMAGES[k].label]; }));
  var ICON_OPTIONS = [['', 'بدون أيقونة']].concat(Object.keys(R.ICONS).map(function (k) { return [k, R.ICONS[k][0]]; }));
  var DAY = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  function counter(node, len, range) {
    var mark = len > range[1] || len < range[0] ? 'warn' : 'ok';
    node.textContent = len + ' حرفًا' + (len > range[1] ? '، أطول من ' + range[1] + ' وقد يُقتطع في نتائج البحث' : len < range[0] ? '، أقصر من المستحسن (' + range[0] + ' إلى ' + range[1] + ')' : '، طول مناسب');
    node.setAttribute('data-state', mark);
  }
  function field(obj, f, after) {
    var id = 'f' + (++uid), t = f.t || 'text', input, extra = [];
    var set = function (v) { obj[f.k] = v; changed(); if (after) after(); };
    if (t === 'toggle') {
      input = el('input', { type: 'checkbox', id: id, checked: !!obj[f.k], onchange: function () { set(input.checked); } });
      return el('div', { 'class': 'fld' + (f.wide ? ' fld--wide' : '') }, [el('label', { 'class': 'check', 'for': id }, [input, f.l]), f.help ? el('p', { 'class': 'help', text: f.help }) : null]);
    }
    if (t === 'days') {
      var cur = String(obj[f.k] || '').split(',').filter(function (x) { return x !== ''; });
      var box = el('div', { 'class': 'days' }, [6, 0, 1, 2, 3, 4, 5].map(function (d) {
        var c = el('input', { type: 'checkbox', checked: cur.indexOf(String(d)) > -1, onchange: function () {
          cur = cur.filter(function (x) { return x !== String(d); }); if (c.checked) cur.push(String(d)); set(cur.join(','));
        } });
        return el('label', { 'class': 'check' }, [c, DAY[d]]);
      }));
      return el('div', { 'class': 'fld fld--wide' }, [el('span', { 'class': 'lbl', text: f.l }), box]);
    }
    if (t === 'image') {
      var pic = el('img', { alt: '', src: thumb(obj[f.k]) || 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' });
      var sel = el('select', { id: id, onchange: function () { if (sel.value !== '__up') { set(sel.value); pic.src = thumb(sel.value) || pic.src; } } });
      var fill = function () {
        sel.innerHTML = '';
        BUILTIN.forEach(function (b) { sel.appendChild(el('option', { value: b[0], text: b[1], selected: obj[f.k] === b[0] })); });
        if (/^(data:|https?:|uploads\/)/.test(obj[f.k] || '')) sel.appendChild(el('option', { value: '__up', text: 'صورة مرفوعة', selected: true }));
      };
      fill();
      var file = el('input', { type: 'file', accept: 'image/*', hidden: true, onchange: function () {
        var fr = new FileReader();
        fr.onload = function () {
          var im = new Image();
          im.onload = function () {
            var k = Math.min(1, 1400 / Math.max(im.width, im.height)), cv = document.createElement('canvas');
            cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
            cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
            var out = cv.toDataURL('image/webp', 0.8);
            if (out.indexOf('data:image/webp') !== 0) out = cv.toDataURL('image/jpeg', 0.82);
            set(out); pic.src = out; fill();
          };
          im.src = fr.result;
        };
        if (file.files[0]) fr.readAsDataURL(file.files[0]);
      } });
      return el('div', { 'class': 'fld fld--wide' }, [el('label', { 'for': id, text: f.l }), el('div', { 'class': 'imgf' }, [pic, sel, el('button', { type: 'button', 'class': 'b b--small', text: 'ارفع صورة', onclick: function () { file.click(); } }), file]),
        el('p', { 'class': 'help', text: 'تُصغَّر الصورة المرفوعة تلقائيًا إلى 1400 بكسل وتُحوَّل إلى WebP للحفاظ على سرعة الموقع.' })]);
    }
    if (t === 'icon') {
      var show = el('span', { 'class': 'icf__show' }), pick = el('select', { id: id, onchange: function () { set(pick.value); paintIcon(); } });
      var paintIcon = function () { show.innerHTML = R.ICONS[obj[f.k]] ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + R.ICONS[obj[f.k]][1] + '</svg>' : ''; };
      ICON_OPTIONS.forEach(function (o) { pick.appendChild(el('option', { value: o[0], text: o[1], selected: (obj[f.k] || '') === o[0] })); });
      paintIcon();
      return el('div', { 'class': 'fld' }, [el('label', { 'for': id, text: f.l }), el('div', { 'class': 'icf' }, [show, pick])]);
    }
    if (t === 'area') input = el('textarea', { id: id, rows: f.rows || 3, dir: f.dir });
    else if (t === 'select') { input = el('select', { id: id }); f.options().forEach(function (o) { input.appendChild(el('option', { value: o[0], text: o[1] })); }); }
    else input = el('input', { id: id, type: t === 'date' || t === 'time' || t === 'url' ? t : 'text', dir: f.dir, spellcheck: f.dir === 'ltr' ? 'false' : null });
    input.value = obj[f.k] == null ? '' : obj[f.k];
    if (f.count) { var cnt = el('p', { 'class': 'count' }); counter(cnt, input.value.length, f.count); extra.push(cnt); }
    input.addEventListener(t === 'select' || t === 'date' || t === 'time' ? 'change' : 'input', function () { set(input.value); if (f.count) counter(extra[0], input.value.length, f.count); });
    if (f.help) extra.push(el('p', { 'class': 'help', text: f.help }));
    return el('div', { 'class': 'fld' + (f.wide || t === 'area' ? ' fld--wide' : '') }, [el('label', { 'for': id, text: f.l })].concat([input], extra));
  }
  function form(obj, fields) { return el('div', { 'class': 'panel' }, el('div', { 'class': 'grid' }, fields.map(function (f) { return field(obj, f); }))); }
  function danger(label, fn) {
    var b = el('button', { type: 'button', 'class': 'b b--small b--danger', text: label, onclick: function (e) {
      e.preventDefault();
      if (b.hasAttribute('data-armed')) return fn();
      b.setAttribute('data-armed', ''); b.textContent = 'تأكيد الحذف';
      setTimeout(function () { b.removeAttribute('data-armed'); b.textContent = label; }, 3000);
    } });
    return b;
  }
  function list(arr, spec) {
    var box = el('div');
    arr.forEach(function (item, i) {
      var title = el('span', { 'class': 't', text: item[spec.title] || spec.untitled });
      var badge = spec.publish && !item.published ? el('span', { 'class': 'badge', text: 'غير منشور' }) : null;
      var move = function (d) { return function (e) { e.preventDefault(); var j = i + d; if (j < 0 || j >= arr.length) return; arr.splice(j, 0, arr.splice(i, 1)[0]); state.open = j; changed(); draw(); }; };
      var tools = el('span', { 'class': 'tools' }, [
        el('button', { type: 'button', 'class': 'b b--small', text: 'أعلى', 'aria-label': 'تحريك للأعلى', onclick: move(-1) }),
        el('button', { type: 'button', 'class': 'b b--small', text: 'أسفل', 'aria-label': 'تحريك للأسفل', onclick: move(1) }),
        danger('حذف', function () { arr.splice(i, 1); state.open = -1; changed(); draw(); })
      ]);
      var d = el('details', { 'class': 'item', open: i === state.open }, [
        el('summary', {}, [title, badge, tools]),
        el('div', { 'class': 'grid' }, spec.fields.map(function (f) {
          return field(item, f, f.k === spec.title ? function () { title.textContent = item[spec.title] || spec.untitled; } : f.k === 'published' ? function () { state.open = i; draw(); } : null);
        }))
      ]);
      box.appendChild(d);
    });
    box.appendChild(el('button', { type: 'button', 'class': 'b add', text: spec.add, onclick: function () { arr.push(spec.blank()); state.open = arr.length - 1; changed(); draw(); } }));
    return box;
  }

  /* ---------- sections ---------- */
  var T = function (k, l, more) { var f = { k: k, l: l }; Object.keys(more || {}).forEach(function (x) { f[x] = more[x]; }); return f; };
  var today = function () { return new Date().toISOString().slice(0, 10); };
  var SECTIONS = [
    { id: 'overview', label: 'نظرة عامة', route: 'index.html' },
    { id: 'seo', label: 'عناوين وأوصاف الصفحات (SEO)', route: 'index.html' },
    { id: 'settings', label: 'بيانات التواصل والإعدادات', route: 'contact.html', hint: 'تظهر هذه البيانات في رأس الموقع وتذييله وصفحة اتصل بنا، وفي بيانات المستشفى المنظمة التي تقرؤها محركات البحث.',
      forms: [{ path: 'settings', fields: [T('siteName', 'اسم الموقع'), T('siteUrl', 'نطاق الموقع', { dir: 'ltr', help: 'يُبنى عليه الرابط الأساسي لكل صفحة وخريطة الموقع.' }), T('phoneMain', 'هاتف المقسم', { dir: 'ltr' }), T('phoneEmergency', 'هاتف الطوارئ', { dir: 'ltr' }), T('phoneMobile', 'الخلوي', { dir: 'ltr' }), T('email', 'البريد الإلكتروني', { dir: 'ltr' }), T('address', 'العنوان', { wide: true }), T('mapUrl', 'رابط خرائط Google', { dir: 'ltr', wide: true }), T('facebook', 'فيسبوك', { dir: 'ltr' }), T('instagram', 'إنستغرام', { dir: 'ltr' }), T('linkedin', 'لينكدإن', { dir: 'ltr' }), T('youtube', 'يوتيوب', { dir: 'ltr' }), T('copyright', 'سطر الحقوق', { wide: true })] }] },
    { id: 'home', label: 'الصفحة الرئيسية', route: 'index.html',
      forms: [{ path: 'home', fields: [T('h1', 'العنوان الرئيسي (H1)', { wide: true, help: 'عنوان واحد لكل صفحة، ويُستحسن أن يتضمن اسم المستشفى والمدينة.' }), T('lede', 'الفقرة التعريفية', { t: 'area' }), T('heroImage', 'صورة الواجهة', { t: 'image' }), T('heroAlt', 'النص البديل للصورة', { wide: true, count: [20, 100] }), T('boardQuestion', 'سؤال لوحة الإرشاد'), T('aboutTitle', 'عنوان فقرة «عن المستشفى»'), T('aboutText', 'نص الفقرة', { t: 'area', rows: 4 }), T('aboutImage', 'صورة فقرة «عن المستشفى»', { t: 'image' }), T('aboutImageAlt', 'النص البديل لها', { wide: true, count: [20, 100] }), T('reachImage', 'صورة فقرة «الوصول إلى المستشفى»', { t: 'image' }), T('reachImageAlt', 'النص البديل لها', { wide: true, count: [20, 100] }), T('quote', 'الاقتباس', { t: 'area', rows: 2 }), T('quoteSource', 'مصدر الاقتباس', { wide: true }), T('deptTitle', 'عنوان قسم المراكز'), T('newsTitle', 'عنوان قسم الأخبار'), T('deptText', 'نص قسم المراكز', { t: 'area', rows: 2 })] }] },
    { id: 'signs', label: 'لوحة الإرشاد وأوقات الدوام', route: 'index.html', hint: 'كل خانة في اللوحة وجهة يقصدها المراجع. يحسب الموقع حالتها (مفتوح أو مغلق) تلقائيًا بتوقيت عمّان من الأوقات التي تدخلها هنا، وتظهر الأوقات نفسها في صفحة اتصل بنا.',
      lists: [{ key: 'signs', title: 'label', untitled: 'وجهة جديدة', add: 'أضف وجهة', blank: function () { return { icon: 'info', label: '', note: '', always: false, days: '6,0,1,2,3,4', open: '08:00', close: '16:00', link: 'contact.html' }; },
        fields: [T('label', 'اسم الوجهة'), T('icon', 'الأيقونة', { t: 'icon' }), T('note', 'سطر توضيحي', { wide: true }), T('always', 'يعمل على مدار الساعة', { t: 'toggle', wide: true }), T('days', 'أيام الدوام', { t: 'days' }), T('open', 'يفتح', { t: 'time' }), T('close', 'يغلق', { t: 'time' }), T('link', 'يقود إلى', { dir: 'ltr', wide: true, help: 'مثال: departments.html#lab أو contact.html#hours. اترك وقتي الفتح والإغلاق فارغين لوجهة بلا دوام.' })] }] },
    { id: 'facts', label: 'بطاقة التعريف', route: 'about.html', hint: 'حقائق مختصرة تظهر في الصفحة الرئيسية وصفحة من نحن.',
      lists: [{ key: 'facts', title: 'label', untitled: 'معلومة جديدة', add: 'أضف معلومة', blank: function () { return { icon: 'info', label: '', value: '' }; }, fields: [T('label', 'البند'), T('icon', 'الأيقونة', { t: 'icon' }), T('value', 'القيمة', { wide: true })] }] },
    { id: 'about', label: 'من نحن', route: 'about.html',
      forms: [{ path: 'about', fields: [T('h1', 'عنوان الصفحة (H1)'), T('subtitle', 'العنوان الفرعي'), T('headImage', 'صورة رأس الصفحة (داخل الهلال)', { t: 'image' }), T('image', 'الصورة الجانبية (تظهر أيضًا في القائمة)', { t: 'image' }), T('imageAlt', 'النص البديل للصورة الجانبية', { wide: true, count: [20, 100] })] }],
      lists: [{ heading: 'فقرات الصفحة', key: 'about.sections', title: 'title', untitled: 'فقرة جديدة', add: 'أضف فقرة', blank: function () { return { title: '', text: '' }; }, fields: [T('title', 'العنوان (H2)', { wide: true }), T('text', 'النص', { t: 'area', rows: 7 })] }] },
    { id: 'departments', label: 'الأقسام والمراكز', route: 'departments.html',
      forms: [{ path: 'departmentsPage', fields: [T('h1', 'عنوان الصفحة (H1)'), T('intro', 'السطر التعريفي'), T('image', 'صورة رأس الصفحة والقائمة', { t: 'image' })] }],
      lists: [{ heading: 'الدليل', key: 'departments', title: 'name', untitled: 'قسم جديد', add: 'أضف قسمًا', blank: function () { return { id: 'dept-' + Date.now().toString(36), group: 'sections', icon: 'stethoscope', name: '', desc: '', phone: '' }; },
        fields: [T('name', 'الاسم', { wide: true }), T('group', 'التصنيف', { t: 'select', options: function () { return content.departmentsPage.groups.map(function (g) { return [g.id, g.title]; }); } }), T('icon', 'الأيقونة', { t: 'icon' }), T('phone', 'هاتف القسم (اختياري)', { dir: 'ltr' }), T('desc', 'الوصف', { t: 'area', rows: 2 }), T('id', 'المعرّف في الرابط', { dir: 'ltr', help: 'بأحرف لاتينية وبلا مسافات، مثل lab. تُبنى عليه الروابط المباشرة للقسم.' })] }] },
    { id: 'news', label: 'الأخبار', route: 'news.html', hint: 'لكل خبر منشور صفحة مستقلة برابط خاص، عنوانها في نتائج البحث هو عنوان الخبر ووصفها هو الملخص.',
      forms: [{ path: 'newsPage', fields: [T('h1', 'عنوان الصفحة (H1)'), T('intro', 'السطر التعريفي'), T('empty', 'النص عند عدم وجود أخبار', { wide: true }), T('image', 'صورة رأس الصفحة', { t: 'image' })] }],
      lists: [{ heading: 'الأخبار', key: 'news', title: 'title', untitled: 'خبر جديد', publish: true, add: 'أضف خبرًا', blank: function () { return { slug: 'news-' + Date.now().toString(36), published: false, date: today(), title: '', excerpt: '', image: '', imageAlt: '', body: '' }; },
        fields: [T('published', 'منشور على الموقع', { t: 'toggle', wide: true }), T('title', 'العنوان', { wide: true, count: [20, 60] }), T('date', 'التاريخ', { t: 'date' }), T('slug', 'الرابط', { dir: 'ltr', help: 'بأحرف لاتينية وشرطات، مثل open-day-2026.' }), T('excerpt', 'الملخص (يظهر وصفًا في نتائج البحث)', { t: 'area', rows: 2, count: [80, 160] }), T('image', 'الصورة', { t: 'image' }), T('imageAlt', 'النص البديل للصورة', { wide: true }), T('body', 'نص الخبر', { t: 'area', rows: 8, help: 'اترك سطرًا فارغًا بين الفقرات.' })] }] },
    { id: 'gallery', label: 'معرض الصور', route: 'gallery.html',
      forms: [{ path: 'galleryPage', fields: [T('h1', 'عنوان الصفحة (H1)'), T('intro', 'السطر التعريفي'), T('image', 'صورة رأس الصفحة', { t: 'image' })] }],
      lists: [{ heading: 'الصور', key: 'gallery', title: 'caption', untitled: 'صورة جديدة', add: 'أضف صورة', blank: function () { return { image: '', alt: '', caption: '' }; }, fields: [T('image', 'الصورة', { t: 'image' }), T('caption', 'التعليق', { wide: true }), T('alt', 'النص البديل (وصف ما في الصورة)', { wide: true, count: [20, 100] })] }] },
    { id: 'careers', label: 'الوظائف', route: 'careers.html',
      forms: [{ path: 'careersPage', fields: [T('h1', 'عنوان الصفحة (H1)'), T('applyTitle', 'عنوان طريقة التقديم'), T('intro', 'السطر التعريفي', { wide: true }), T('applySteps', 'خطوات التقديم', { t: 'area', rows: 4, help: 'خطوة في كل سطر.' }), T('fieldsTitle', 'عنوان مجالات العمل'), T('fields', 'مجالات العمل', { t: 'area', rows: 4, help: 'مجال في كل سطر.' }), T('empty', 'النص عند عدم وجود شواغر', { t: 'area', rows: 2 }), T('image', 'صورة رأس الصفحة', { t: 'image' })] }],
      lists: [{ heading: 'الشواغر', key: 'jobs', title: 'title', untitled: 'شاغر جديد', publish: true, add: 'أضف شاغرًا', blank: function () { return { published: false, title: '', dept: '', type: 'دوام كامل', date: today(), desc: '' }; },
        fields: [T('published', 'منشور على الموقع', { t: 'toggle', wide: true }), T('title', 'المسمى الوظيفي', { wide: true }), T('dept', 'القسم'), T('type', 'نوع الدوام'), T('date', 'تاريخ الإعلان', { t: 'date' }), T('desc', 'الوصف والمتطلبات', { t: 'area', rows: 3 })] }] },
    { id: 'contact', label: 'اتصل بنا', route: 'contact.html', hint: 'الأرقام والعنوان تُعدَّل من «بيانات التواصل والإعدادات»، وأوقات الدوام من «لوحة الإرشاد».',
      forms: [{ path: 'contactPage', fields: [T('h1', 'عنوان الصفحة (H1)'), T('intro', 'السطر التعريفي'), T('emergencyTitle', 'عنوان فقرة الطوارئ'), T('hoursTitle', 'عنوان أوقات الدوام'), T('emergencyText', 'نص فقرة الطوارئ', { wide: true }), T('formTitle', 'عنوان النموذج'), T('formNote', 'ملاحظة النموذج', { t: 'area', rows: 2 }), T('image', 'صورة رأس الصفحة والقائمة', { t: 'image' })] }] }
  ];
  function at(path) { return path.split('.').reduce(function (o, k) { return o[k]; }, content); }

  function overview(box) {
    var s = content.settings, live = s.status === 'live';
    var sel = el('select', { id: 'st', onchange: function () { s.status = sel.value; changed(); draw(); } }, [el('option', { value: 'review', text: 'مراجعة: شريط تنبيه ظاهر، ومحجوب عن محركات البحث', selected: !live }), el('option', { value: 'live', text: 'منشور: بلا شريط، ومتاح للفهرسة', selected: live })]);
    box.appendChild(el('div', { 'class': 'panel' }, [el('div', { 'class': 'fld' }, [el('label', { 'for': 'st', text: 'حالة الموقع' }), sel,
      el('p', { 'class': 'help', text: live ? 'الموقع في وضع النشر: وسم robots يسمح بالفهرسة، وملف robots.txt يشير إلى خريطة الموقع.' : 'الموقع في وضع المراجعة: تحمل كل صفحة وسم noindex، ويمنع robots.txt الزحف. بدّل الحالة بعد اعتماد المحتوى ثم صدّر الموقع.' })])]));
    box.appendChild(el('h2', { text: 'المحتوى الحالي' }));
    var pub = function (a) { return a.filter(function (x) { return x.published; }).length; };
    box.appendChild(el('div', { 'class': 'stats' }, [[R.routes(content).length, 'صفحة'], [content.departments.length, 'قسمًا ومركزًا'], [pub(content.news) + ' / ' + content.news.length, 'خبرًا منشورًا'], [pub(content.jobs) + ' / ' + content.jobs.length, 'شاغرًا منشورًا']].map(function (x) { return el('div', {}, [el('b', { text: String(x[0]) }), el('span', { text: x[1] })]); })));
    box.appendChild(el('h2', { text: 'قبل النشر: نقاط تنتظر اعتماد المستشفى' }));
    var ul = el('ul', { 'class': 'todo panel' });
    content.review.forEach(function (r, i) {
      var li = el('li', { 'data-done': r.done ? '1' : '0' });
      var cb = el('input', { type: 'checkbox', checked: !!r.done, 'aria-label': 'تم', onchange: function () { r.done = cb.checked; li.setAttribute('data-done', r.done ? '1' : '0'); persist(); showSave(); } });
      var tx = el('textarea', { rows: 1, 'aria-label': 'البند', oninput: function () { r.text = tx.value; persist(); showSave(); tx.style.height = 'auto'; tx.style.height = tx.scrollHeight + 'px'; } }); tx.value = r.text; setTimeout(function () { tx.style.height = tx.scrollHeight + 'px'; });
      li.appendChild(cb); li.appendChild(tx); li.appendChild(danger('حذف', function () { content.review.splice(i, 1); persist(); draw(); }));
      ul.appendChild(li);
    });
    box.appendChild(ul);
    box.appendChild(el('button', { type: 'button', 'class': 'b add', text: 'أضف بندًا', onclick: function () { content.review.push({ done: false, text: '' }); persist(); draw(); } }));
    box.appendChild(el('h2', { text: 'النشر والنسخ الاحتياطي' }));
    var imp = el('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: function () {
      var fr = new FileReader();
      fr.onload = function () { try { var v = JSON.parse(fr.result); if (!v.settings || !v.seo) throw 0; content = v; persist(); draw(); refresh(); note.textContent = 'تم استيراد المحتوى.'; } catch (e) { note.textContent = 'الملف ليس ملف محتوى صالحًا. اختر ملف content.json سبق تصديره من هذه اللوحة.'; } };
      if (imp.files[0]) fr.readAsText(imp.files[0]);
    } });
    var note = el('p', { 'class': 'note', 'aria-live': 'polite' });
    box.appendChild(el('div', { 'class': 'panel' }, [
      el('p', { 'class': 'note', text: '«تصدير الموقع» ينزّل ملف ZIP فيه كل الصفحات جاهزة للرفع على الاستضافة كما هي، مع خريطة الموقع وrobots.txt ونسخة من هذه اللوحة بمحتواها الحالي.' }),
      el('div', { 'class': 'row', style: 'margin-top:.75rem' }, [
        el('button', { type: 'button', 'class': 'b b--primary', text: 'تصدير الموقع (ZIP)', onclick: exportZip }),
        el('button', { type: 'button', 'class': 'b', text: 'تصدير ملف المحتوى', onclick: function () { download(JSON.stringify(content, null, 2), 'content.json', 'application/json'); } }),
        el('button', { type: 'button', 'class': 'b', text: 'استيراد ملف محتوى', onclick: function () { imp.click(); } }), imp,
        danger('استرجاع المحتوى الأصلي', function () { content = clone(DEFAULT); persist(); draw(); refresh(); })
      ]), note
    ]));
  }

  function seo(box) {
    var base = String(content.settings.siteUrl || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
    R.NAV.forEach(function (n) {
      var o = content.seo[n[2]] || (content.seo[n[2]] = { title: '', description: '' });
      var st = el('div', { 'class': 'serp__title' }), sd = el('div', { 'class': 'serp__desc' });
      var paint = function () { st.textContent = o.title || n[1]; sd.textContent = o.description; };
      paint();
      box.appendChild(el('h2', {}, [n[1] + ' ', el('button', { type: 'button', 'class': 'b b--small', text: 'اعرض الصفحة', onclick: function () { go(n[0]); } })]));
      box.appendChild(el('div', { 'class': 'panel' }, [
        el('div', { 'class': 'grid' }, [field(o, T('title', 'عنوان الصفحة (meta title)', { wide: true, count: [30, 60] }), paint), field(o, T('description', 'وصف الصفحة (meta description)', { t: 'area', rows: 3, count: [110, 160] }), paint)]),
        el('div', { 'class': 'serp', dir: 'rtl', 'aria-label': 'معاينة تقريبية لنتيجة البحث' }, [
          el('div', { 'class': 'serp__site' }, [el('img', { src: imgUrl('favicon.png'), alt: '' }), el('div', {}, [el('b', { text: content.settings.siteName }), el('span', { dir: 'ltr', text: base + (n[0] === 'index.html' ? '' : ' › ' + n[0].replace('.html', '')) })])]), st, sd
        ])
      ]));
    });
  }

  /* ---------- export ---------- */
  function download(data, name, type) {
    var url = URL.createObjectURL(new Blob([data], { type: type })), a = el('a', { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function exportZip() {
    var assets = {};
    Object.keys(ASSETS).forEach(function (k) { var v = ASSETS[k]; assets[k] = typeof v === 'string' ? v : R.b64ToBytes(v.b64); });
    var files = R.buildSite(content, assets, {});
    var open = '<script id="ih-content" type="application/json">', a = SOURCE.indexOf(open) + open.length, b = SOURCE.indexOf('<\/script>', a);
    files['admin/index.html'] = (SOURCE.slice(0, a) + JSON.stringify(content).replace(/</g, '\\u003c') + SOURCE.slice(b)).replace(/data-start="\w+"/, 'data-start="admin"');
    download(R.zip(files), 'islamic-hospital-site.zip', 'application/zip');
  }

  /* ---------- shell ---------- */
  var appEl = document.getElementById('app'), editor, navEl, shell, preview;
  function draw() {
    var sec = SECTIONS.filter(function (s) { return s.id === state.section; })[0];
    [].forEach.call(navEl.children, function (b) { if (b.getAttribute('data-id') === sec.id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    editor.innerHTML = '';
    editor.appendChild(el('h1', { text: sec.label }));
    editor.appendChild(el('p', { 'class': 'hint', text: sec.hint || '' }));
    if (sec.id === 'overview') return overview(editor);
    if (sec.id === 'seo') return seo(editor);
    (sec.forms || []).forEach(function (f) { editor.appendChild(form(at(f.path), f.fields)); });
    (sec.lists || []).forEach(function (l) { if (l.heading) editor.appendChild(el('h2', { text: l.heading })); editor.appendChild(list(at(l.key), l)); });
  }
  function fit() { // desktop preview: render at a real desktop width, scaled down to the pane
    var stage = frame.parentNode, w = stage.clientWidth, h = stage.clientHeight, st = frame.style;
    if (state.view === 'admin' && state.device === 'desktop' && w && w < 1280) {
      var k = w / 1280;
      st.width = '1280px'; st.height = Math.ceil(h / k) + 'px'; st.transform = 'scale(' + k + ')'; st.transformOrigin = 'top left'; st.position = 'absolute'; st.left = '0'; st.top = '0';
    } else { st.width = st.height = st.transform = st.position = st.left = st.top = ''; }
  }
  function setView(v) { state.view = v; shell.setAttribute('data-view', v); fit(); }
  function boot() {
    saveEl = el('span', { 'class': 'adm-save', 'aria-live': 'polite' });
    navEl = el('nav', { 'class': 'adm-nav', 'aria-label': 'أقسام لوحة التحكم' }, SECTIONS.map(function (s) {
      return el('button', { type: 'button', 'data-id': s.id, text: s.label, onclick: function () { state.section = s.id; state.open = -1; draw(); editor.scrollTop = 0; if (state.route !== s.route) go(s.route); } });
    }));
    editor = el('section', { 'class': 'adm-edit', 'aria-label': 'المحرر' });
    frame = el('iframe', { title: 'معاينة الموقع' });
    routeSel = el('select', { 'aria-label': 'الصفحة المعروضة', onchange: function () { go(routeSel.value); } });
    var seg = [['desktop', 'سطح المكتب'], ['mobile', 'جوال']].map(function (d) {
      return el('button', { type: 'button', 'class': 'b b--small', text: d[1], 'aria-pressed': d[0] === state.device ? 'true' : 'false', onclick: function () {
        state.device = d[0]; preview.setAttribute('data-device', d[0]); fit(); seg.forEach(function (b, i) { b.setAttribute('aria-pressed', ['desktop', 'mobile'][i] === d[0] ? 'true' : 'false'); });
      } });
    });
    preview = el('aside', { 'class': 'adm-preview', 'data-device': state.device, 'aria-label': 'المعاينة' }, [
      el('div', { 'class': 'adm-preview__bar' }, [el('span', { 'class': 'note', text: 'معاينة حيّة:' }), routeSel, el('div', { 'class': 'seg' }, seg)]),
      el('div', { 'class': 'adm-preview__stage' }, frame)
    ]);
    shell = el('div', { 'class': 'adm', 'data-view': state.view }, [
      el('header', { 'class': 'adm-top' }, [
        el('strong', { 'class': 'adm-brand' }, ['لوحة التحكم', el('span', { text: content.settings.siteName })]), saveEl,
        el('div', { 'class': 'adm-top__actions' }, [
          el('button', { type: 'button', 'class': 'b b--onink', text: 'اعرض الموقع بملء الشاشة', onclick: function () { setView('site'); } }),
          el('button', { type: 'button', 'class': 'b b--primary', text: 'تصدير الموقع (ZIP)', onclick: exportZip })
        ])
      ]),
      el('div', { 'class': 'adm-body' }, [navEl, editor, preview]),
      el('div', { 'class': 'site-bar' }, el('button', { type: 'button', 'class': 'b b--primary', text: 'افتح لوحة التحكم', onclick: function () { setView('admin'); } }))
    ]);
    appEl.appendChild(shell);
    showSave(); draw(); refresh(); fit();
    window.addEventListener('resize', fit);
  }
  boot();
})();
