// カナカナパズルの PDF を作ります。
// つかいかた：node kanapuzzle/tools/make-pdf.js
// （Playwright と Chromium が いります。できた PDF は kanapuzzle/pdf/ に入ります）
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('/opt/node-tools/node_modules/playwright'); }

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pdf');
const STAGES = { 1: '1_かげ', 2: '2_マス', 3: '3_じぶんで' };
// ファイル名には ★ などの記号を使わない（メールやほかのパソコンで文字化けしないように）
const SETS = [
  { sheets: 'all', prefix: 'カナカナパズル_' },              // 清音（れんしゅう＋その1〜14）
  { sheets: 'daku', prefix: 'カナカナパズル_てんてんまる_' }, // 濁音・半濁音（5行＋みくらべ）
  { sheets: 'word', prefix: 'カナカナパズル_ことば_' },       // 長音・促音・拗音（ことば・たて書き）
];

// いくつかの PDF を 1つに まとめる（メールで1回で送れるように）
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
  for (const set of SETS) {
    const parts = [];
    for (const stage of [1, 2, 3]) {
      const url = 'file://' + path.join(ROOT, 'index.html') + `?print=1&sheets=${set.sheets}&stage=${stage}`;
      await page.goto(url);
      await page.waitForSelector('body[data-ready="1"]', { timeout: 30000 });
      await page.emulateMedia({ media: 'print' });
      const file = path.join(OUT, `${set.prefix}${STAGES[stage]}.pdf`);
      await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
      parts.push(file);
      console.log('できました：', path.relative(process.cwd(), file));
    }
    const all = path.join(OUT, `${set.prefix}ぜんぶ.pdf`);
    unite(parts, all);
    console.log('できました：', path.relative(process.cwd(), all));
  }
  await browser.close();
})();
