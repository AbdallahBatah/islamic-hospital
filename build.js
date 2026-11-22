#!/usr/bin/env node
/* Rebuilds the site in the repository root from content.json.
   Usage: node build.js            (no dependencies; Node 16+)
   Output: *.html, news/, assets/, admin/, sitemap.xml, robots.txt, .htaccess */
const fs = require('fs'), path = require('path');
const R = require('./src/render.js');
const root = __dirname, src = p => path.join(root, 'src', p), read = p => fs.readFileSync(p, 'utf8');
const content = JSON.parse(read(path.join(root, 'content.json')));
const minCss = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/ ?([{};]) ?/g, '$1').trim();

const assets = { 'css/site.css': minCss(read(src('site.css'))), 'js/site.js': read(src('site.js')), 'extra/.htaccess': read(src('htaccess.txt')) };
for (const f of fs.readdirSync(src('img'))) assets['img/' + f] = new Uint8Array(fs.readFileSync(path.join(src('img'), f)));

const files = R.buildSite(content, assets, {});

// the admin panel: one self-contained file that carries the renderer, the styles and the images
const appAssets = {};
for (const [k, v] of Object.entries(assets)) appAssets[k] = typeof v === 'string' ? v : { b64: Buffer.from(v).toString('base64') };
const safe = o => JSON.stringify(o).replace(/</g, '\\u003c');
const inline = p => read(src(p)).replace(/<\/script/g, '<\\/script');
files['admin/index.html'] = read(src('admin.html'))
  .replace('{{START}}', 'admin')
  .replace('{{ADMIN_CSS}}', () => minCss(read(src('admin.css'))))
  .replace('{{CONTENT}}', () => safe(content))
  .replace('{{ASSETS}}', () => safe(appAssets))
  .replace('{{RENDER_JS}}', () => inline('render.js'))
  .replace('{{ADMIN_JS}}', () => inline('admin.js'));

for (const d of ['assets', 'admin', 'news']) fs.rmSync(path.join(root, d), { recursive: true, force: true }); // generated folders only
for (const [p, data] of Object.entries(files)) {
  const out = path.join(root, p);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, data);
}
const kb = p => (fs.statSync(path.join(root, p)).size / 1024).toFixed(1) + ' KB';
console.log(Object.keys(files).length + ' files written.  css ' + kb('assets/css/site.css') + ', js ' + kb('assets/js/site.js') + ', home html ' + kb('index.html'));
