// カナカナパズルの PDF を作ります。
// つかいかた：node kanapuzzle/tools/make-pdf.js
// （Playwright と Chromium が いります。できた PDF は kanapuzzle/pdf/ に入ります）
const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('/opt/node-tools/node_modules/playwright'); }

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pdf');
const FILES = {
  1: 'カナカナパズル_★1かげ.pdf',
  2: 'カナカナパズル_★2マス.pdf',
  3: 'カナカナパズル_★3じぶんで.pdf',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  for (const stage of [1, 2, 3]) {
    const url = 'file://' + path.join(ROOT, 'index.html') + `?print=1&sheets=all&stage=${stage}`;
    await page.goto(url);
    await page.waitForSelector('body[data-ready="1"]', { timeout: 30000 });
    await page.emulateMedia({ media: 'print' });
    const file = path.join(OUT, FILES[stage]);
    await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log('できました：', path.relative(process.cwd(), file));
  }
  await browser.close();
})();
