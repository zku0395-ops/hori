// ぶんすう さがし カード の PDF を 作ります。
// つかいかた：node bunsucard/tools/make-pdf.js
// （Playwright と Chromium が いります。できた PDF は bunsucard/pdf/ に 入ります）
const path = require('path');
const fs = require('fs');
const http = require('http');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('/opt/node-tools/node_modules/playwright'); }

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png' };
function serve() {
  return new Promise((ok) => {
    const sv = http.createServer((req, res) => {
      const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    sv.listen(0, '127.0.0.1', () => ok(sv));
  });
}

(async () => {
  const sv = await serve();
  const BASE = `http://127.0.0.1:${sv.address().port}/index.html`;
  const launch = {};
  if (fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
  const browser = await playwright.chromium.launch(launch).catch(() => playwright.chromium.launch());
  const page = await browser.newPage();
  const open = async (q) => {
    await page.goto(BASE + (q ? '?' + q : ''));
    await page.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
    await page.waitForTimeout(300);
    await page.emulateMedia({ media: 'print' });
  };
  await open('');
  const files = await page.evaluate(() => window.BUNSUCARD_FILES);
  const OUT = path.join(ROOT, 'pdf');
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of files) {
    await open(f.q);
    const file = path.join(OUT, f.file);
    await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log('できました：', path.relative(process.cwd(), file));
  }
  await browser.close();
  sv.close();
})();
