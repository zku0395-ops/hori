// ぶんづくり プリントの PDF を作ります。
// つかいかた：node bunbunprint/tools/make-pdf.js
// （Playwright と Chromium が いります。できた PDF は bunbunprint/pdf/ に入ります）
// FONT_CSS に フォントの CSS の 場所を 入れると、Google Fonts の かわりに それを 使います（ネットに つながらない ところで 作るとき）。
const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('/opt/node-tools/node_modules/playwright'); }

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pdf');
// ファイル名には 記号を 使わない（メールや ほかの パソコンで 文字化け しないように）
const FILES = [
  { q: 'v=color&rei=1', name: 'ぶんづくりプリント_1_カラー.pdf' },
  { q: 'v=mono&rei=1', name: 'ぶんづくりプリント_2_しろくろ.pdf' },
  { q: 'v=key&rei=0', name: 'ぶんづくりプリント_3_こたえ.pdf' },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await playwright.chromium.launch();
  const ctx = await browser.newContext();
  if (process.env.FONT_CSS) {
    await ctx.route(/fonts\.googleapis\.com/, r => r.fulfill({ body: fs.readFileSync(process.env.FONT_CSS), contentType: 'text/css' }));
    await ctx.route(/fonts\.gstatic\.com/, r => r.abort());
  }
  const page = await ctx.newPage();
  for (const f of FILES) {
    await page.goto('file://' + path.join(ROOT, 'index.html') + '?print=1&' + f.q);
    await page.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
    await page.waitForTimeout(500);
    await page.emulateMedia({ media: 'print' });
    const file = path.join(OUT, f.name);
    await page.pdf({ path: file, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true });
    console.log('できました：', path.relative(process.cwd(), file), (await page.$$('.page')).length + 'まい');
  }
  await browser.close();
})();
