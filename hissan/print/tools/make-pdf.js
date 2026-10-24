// ひっ算プリントの PDF を作ります。
// つかいかた：node hissan/print/tools/make-pdf.js
// （Playwright と Chromium が いります。できた PDF は hissan/print/pdf/ に入ります）
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
let playwright;
try { playwright = require('playwright'); } catch (e) {
  try { playwright = require('/opt/node-tools/node_modules/playwright'); } catch (e2) { playwright = require('/opt/node22/lib/node_modules/playwright'); }
}

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pdf');
// ファイル名には 記号を 使わない（メールや ほかの パソコンで 文字化け しないように）
const FILES = [
  { q: 'sec=jun', name: 'ひっさんプリント_1_じゅんび.pdf' },
  { q: 'sec=ren', name: 'ひっさんプリント_2_れんしゅう.pdf' },
  { q: 'sec=test', name: 'ひっさんプリント_3_テスト.pdf' },
  { q: 'g=all&only=key', name: 'ひっさんプリント_4_こたえ.pdf' },
];

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
  const parts = [];
  for (const f of FILES) {
    await page.goto('file://' + path.join(ROOT, 'index.html') + '?' + f.q);
    await page.waitForSelector('body[data-ready="1"]', { timeout: 60000 });
    await page.emulateMedia({ media: 'print' });
    const file = path.join(OUT, f.name);
    await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
    parts.push(file);
    console.log('できました：', path.relative(process.cwd(), file), (await page.$$('.page')).length + 'まい');
  }
  const all = path.join(OUT, 'ひっさんプリント_ぜんぶ.pdf');
  unite(parts, all);
  console.log('できました：', path.relative(process.cwd(), all));
  await browser.close();
})();
