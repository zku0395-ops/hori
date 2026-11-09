// かけざんの ひっさん プリントの PDF を作ります。
// つかいかた：node kakezan/print/tools/make-pdf.js
// （Playwright と Chromium が いります。できた PDF は kakezan/print/pdf/ に入ります）
// ネットに つながらない ところでは、npm の @fontsource/biz-udpgothic を
// FONT_DIR（その files フォルダ）に おくと、BIZ UDPゴシック で 作れます。
const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch (e) {
  try { playwright = require('/opt/node-tools/node_modules/playwright'); } catch (e2) { playwright = require('/opt/node22/lib/node_modules/playwright'); }
}

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pdf');
// ファイル名には 記号を 使わない（メールや ほかの パソコンで 文字化け しないように）
const FILES = [
  { q: 'g=all', name: 'かけざんひっさんプリント_1_カラー.pdf' },
  { q: 'g=all&mono=1', name: 'かけざんひっさんプリント_2_しろくろ.pdf' },
  { q: 'g=all&only=key', name: 'かけざんひっさんプリント_3_こたえ.pdf' },
];

// Google Fonts に つながらない ときは、手もとの フォントを つかう
async function localFonts(page) {
  const dir = process.env.FONT_DIR;
  if (!dir || !fs.existsSync(dir)) return;
  const css = ['400', '700'].map(w => {
    const files = fs.readdirSync(dir).filter(f => f.startsWith(`biz-udpgothic-japanese-${w}-normal`) && f.endsWith('.woff2'));
    return files.map(f => `@font-face{font-family:'BIZ UDPGothic';font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}) format('woff2');}`).join('\n');
  }).join('\n');
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: css }));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await localFonts(page);
  for (const f of FILES) {
    await page.goto('file://' + path.join(ROOT, 'index.html') + '?' + f.q);
    await page.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
    await page.emulateMedia({ media: 'print' });
    const file = path.join(OUT, f.name);
    await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log('できました：', path.relative(process.cwd(), file), (await page.$$('.page')).length + 'まい');
  }
  await browser.close();
})();
