// ぶんしょうの プリント（B4よこ）の PDF を 作ります。
// つかいかた：node monogatari/tools/make-pdf.js
// （Playwright と Chromium が いります。できた PDF は monogatari/pdf/ に 入ります）
// FONT_CSS に フォントの CSS、FONT_DIR に フォントの ファイルの ある フォルダを 入れると、
// Google Fonts の かわりに それを 使います（CSS の 中は https://fonts.gstatic.com/fs/ファイル名 と 書きます）。
const path = require('path');
const fs = require('fs');
const http = require('http');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('/opt/node-tools/node_modules/playwright'); }

const ROOT = path.join(__dirname, '..');
const REPO = path.join(ROOT, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png' };
function serve() {
  return new Promise((ok) => {
    const sv = http.createServer((req, res) => {
      const f = path.join(REPO, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(REPO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    sv.listen(0, '127.0.0.1', () => ok(sv));
  });
}

(async () => {
  const browser = await playwright.chromium.launch();
  const ctx = await browser.newContext();
  if (process.env.FONT_CSS) {
    await ctx.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ body: fs.readFileSync(process.env.FONT_CSS), contentType: 'text/css' }));
    await ctx.route(/fonts\.gstatic\.com/, (r) => {
      const f = path.join(process.env.FONT_DIR || '', r.request().url().split('/fs/')[1] || '');
      if (process.env.FONT_DIR && fs.existsSync(f)) r.fulfill({ body: fs.readFileSync(f), contentType: 'font/woff2' }); else r.abort();
    });
  }
  const sv = await serve();
  const BASE = `http://127.0.0.1:${sv.address().port}/monogatari/print.html`;
  const page = await ctx.newPage();
  const open = async (q) => {
    await page.emulateMedia({ media: 'print' });
    await page.goto(BASE + '?' + q);
    await page.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
    await page.waitForTimeout(300);
  };
  await open('s=1&c=none');
  const files = await page.evaluate(() => window.MONO_PDF_FILES);
  const OUT = path.join(ROOT, 'pdf');
  fs.mkdirSync(OUT, { recursive: true });
  for (const [q, name] of files) {
    await open(q);
    await page.pdf({ path: path.join(OUT, name), width: '364mm', height: '257mm', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    console.log('できました：' + name);
  }
  await browser.close();
  sv.close();
})();
