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
  1: 'カナカナパズル_1_かげ.pdf',
  2: 'カナカナパズル_2_マス.pdf',
  3: 'カナカナパズル_3_じぶんで.pdf',
};
// 3つを1つにまとめた PDF（メールで1回で送れるように）
const ALL = 'カナカナパズル_ぜんぶ.pdf';
// ファイル名には ★ などの記号を使わない（メールやほかのパソコンで文字化けしないように）

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

  const { execFileSync } = require('child_process');
  const parts = [1, 2, 3].map(s => path.join(OUT, FILES[s]));
  const all = path.join(OUT, ALL);
  try {
    execFileSync('pdfunite', [...parts, all]);
  } catch (e) {
    execFileSync('python3', ['-c', 'import sys,pypdf\nw=pypdf.PdfWriter()\nfor f in sys.argv[2:]: w.append(f)\nw.write(sys.argv[1])', all, ...parts]);
  }
  console.log('できました：', path.relative(process.cwd(), all));
})();
