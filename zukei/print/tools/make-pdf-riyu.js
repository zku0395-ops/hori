// 「三角形と四角形 りゆうを かく プリント」（riyu.html）の PDF を作ります。
// つかいかた：node zukei/print/tools/make-pdf-riyu.js
// （Playwright と Chromium が いります。できた PDF は zukei/print/pdf/ に入ります）
const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch (e) {
  try { playwright = require('/opt/node-tools/node_modules/playwright'); } catch (e2) { playwright = require('/opt/node22/lib/node_modules/playwright'); }
}

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pdf');
const FILES = [
  { q: 'all=1&m=sel', name: 'さんかくしかくプリント_1_りゆうをえらぶ.pdf' },
  { q: 'all=1&m=kaku', name: 'さんかくしかくプリント_2_りゆうをかく.pdf' },
  { q: 'all=1&m=both&only=key', name: 'さんかくしかくプリント_3_こたえ.pdf' },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  for (const f of FILES) {
    await page.goto('file://' + path.join(ROOT, 'riyu.html') + '?' + f.q);
    await page.waitForSelector('body[data-ready="1"]', { timeout: 60000 });
    await page.emulateMedia({ media: 'print' });
    const file = path.join(OUT, f.name);
    await page.pdf({ path: file, printBackground: true, preferCSSPageSize: true });
    console.log('できました：', path.relative(process.cwd(), file), (await page.$$('.page')).length + 'まい');
  }
  await browser.close();
})();
