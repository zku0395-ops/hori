// かんじプリントの PDF を作ります。
// つかいかた：node kanjiprint/tools/make-pdf.js        … 1年生・2年生・3年生の 全部
//             node kanjiprint/tools/make-pdf.js 2      … 2年生だけ（1 なら 1年生だけ、3 なら 3年生だけ）
//             node kanjiprint/tools/make-pdf.js 2 s1   … 2年生の ステージ1だけ（ためしに 作るとき。ぜんぶ は 作りません）
// （Playwright と Chromium が いります。できた PDF は 1年生が kanjiprint/pdf/、2年生が kanjiprint/pdf/2nen/、3年生が kanjiprint/pdf/3nen/ に入ります）
// FONT_CSS に フォントの CSS の 場所を 入れると、Google Fonts の かわりに それを 使います（ネットに つながらない ところで 作るとき）。
const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('/opt/node-tools/node_modules/playwright'); }

const ROOT = path.join(__dirname, '..');

(async () => {
  const [ga, only] = process.argv.slice(2);
  const grades = ga ? [Number(ga)] : [1, 2, 3];
  const launch = {};
  if (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') && !process.env.PLAYWRIGHT_CHROMIUM) launch.executablePath = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await playwright.chromium.launch(launch).catch(() => playwright.chromium.launch());
  const ctx = await browser.newContext();
  if (process.env.FONT_CSS) {
    await ctx.route(/fonts\.googleapis\.com/, r => r.fulfill({ body: fs.readFileSync(process.env.FONT_CSS), contentType: 'text/css' }));
    await ctx.route(/fonts\.gstatic\.com/, r => r.abort());
  }
  const page = await ctx.newPage();
  for (const g of grades) {
    const open = async (stage) => {
      await page.goto('file://' + path.join(ROOT, 'index.html') + `?print=1&g=${g}&stage=${stage}`);
      await page.waitForSelector('body[data-ready="1"]', { timeout: stage === 'all' ? 900000 : 60000 });
      await page.waitForTimeout(500);
      await page.emulateMedia({ media: 'print' });
    };
    await open('s1');
    const info = await page.evaluate(() => ({ files: window.KANJIPRINT_FILES, dir: window.KANJIPRINT_DIR, all: window.KANJIPRINT_ALL }));
    const OUT = path.join(ROOT, info.dir);
    fs.mkdirSync(OUT, { recursive: true });
    for (const f of info.files) {
      if (only && f.id !== only) continue;
      await open(f.id);
      const file = path.join(OUT, f.file);
      await page.pdf({ path: file, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true });
      console.log('できました：', path.relative(process.cwd(), file));
    }
    if (only) continue;
    // ぜんぶ は 1回で 作ります（つなぎあわせると フォントが かさなって 大きく なるため）
    await open('all');
    const all = path.join(OUT, info.all);
    await page.pdf({ path: all, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true });
    console.log('できました：', path.relative(process.cwd(), all));
  }
  await browser.close();
})();
