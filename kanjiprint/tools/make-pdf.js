// かんじプリントの PDF を作ります。
// つかいかた：node kanjiprint/tools/make-pdf.js
// （Playwright と Chromium が いります。できた PDF は kanjiprint/pdf/ に入ります）
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('/opt/node-tools/node_modules/playwright'); }

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pdf');

// いくつかの PDF を 1つに まとめる
function unite(parts, out) {
  try {
    execFileSync('pdfunite', [...parts, out]);
  } catch (e) {
    execFileSync('python3', ['-c', 'import sys,pypdf\nw=pypdf.PdfWriter()\nfor f in sys.argv[2:]: w.append(f)\nw.write(sys.argv[1])', out, ...parts]);
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  const open = async (stage) => {
    await page.goto('file://' + path.join(ROOT, 'index.html') + `?print=1&stage=${stage}`);
    await page.waitForSelector('body[data-ready="1"]', { timeout: 60000 });
    await page.waitForTimeout(500);
    await page.emulateMedia({ media: 'print' });
  };
  await open('s1');
  const files = await page.evaluate(() => window.KANJIPRINT_FILES);
  const parts = [];
  for (const f of files) {
    await open(f.id);
    const file = path.join(OUT, f.file);
    await page.pdf({ path: file, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true });
    parts.push(file);
    console.log('できました：', path.relative(process.cwd(), file));
  }
  const all = path.join(OUT, 'かんじプリント_ぜんぶ.pdf');
  unite(parts, all);
  console.log('できました：', path.relative(process.cwd(), all));
  await browser.close();
})();
