// ことばの ワークシートの PDF を 作ります。
// つかいかた：node kotobaprint/tools/make-pdf.js      … 全部（1〜4ねん、それぞれ こたえも）
//             node kotobaprint/tools/make-pdf.js 3    … 1つの 学年だけ
// （Playwright と Chromium が いります。できた PDF は kotobaprint/pdf/ に 入ります）
// FONT_CSS に フォントの CSS の 場所を 入れると、Google Fonts の かわりに それを 使います。
const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('/opt/node-tools/node_modules/playwright'); }

const ROOT = path.join(__dirname, '..');
const REPO = path.join(ROOT, '..');
const http = require('http');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
// 絵を JPEG に するため、ファイルを その場の サーバーで 出します（file:// だと 絵を 書きかえられないため）
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
  const only = process.argv[2];
  const launch = {};
  if (fs.existsSync('/opt/pw-browsers/chromium') && !process.env.PLAYWRIGHT_CHROMIUM) launch.executablePath = '/opt/pw-browsers/chromium';
  const browser = await playwright.chromium.launch(launch).catch(() => playwright.chromium.launch());
  const ctx = await browser.newContext();
  if (process.env.FONT_CSS) {
    await ctx.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ body: fs.readFileSync(process.env.FONT_CSS), contentType: 'text/css' }));
    await ctx.route(/fonts\.gstatic\.com/, (r) => r.abort());
  }
  const sv = await serve();
  const BASE = `http://127.0.0.1:${sv.address().port}/kotobaprint/index.html`;
  const page = await ctx.newPage();
  const open = async (q) => {
    await page.emulateMedia({ media: 'print' }); // 印刷の 見た目で 字の 大きさと せんを 合わせる
    await page.goto(BASE + '?' + q);
    await page.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
    // 絵を JPEG に しておく（PDF が 小さく なります）
    await page.evaluate(() => Promise.all([...document.images].filter((im) => im.naturalWidth).map((im) => {
      const c = document.createElement('canvas');
      c.width = im.naturalWidth; c.height = im.naturalHeight;
      const g = c.getContext('2d');
      g.fillStyle = getComputedStyle(im.closest('.band') || document.body).backgroundColor || '#fff'; g.fillRect(0, 0, c.width, c.height); // おびの 色で うめる（すけて いる ところが 白く ならない ように）
      g.drawImage(im, 0, 0);
      im.src = c.toDataURL('image/jpeg', 0.88);
      return im.decode();
    })));
    await page.waitForTimeout(500);
  };
  await open('g=1');
  const files = await page.evaluate(() => window.KOTOBAPRINT_FILES);
  const OUT = path.join(ROOT, 'pdf');
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of files) {
    if (only && String(f.g) !== only) continue;
    await open(`g=${f.g}${f.ans ? '&ans=1' : ''}`);
    const file = path.join(OUT, f.file);
    await page.pdf({ path: file, format: 'A4', landscape: false, printBackground: true, preferCSSPageSize: true });
    console.log('できました：', path.relative(process.cwd(), file));
  }
  await browser.close();
  sv.close();
})();
