// くく しゅぎょう プリントの PDF を作ります。
// つかいかた：node kuku/print/tools/make-pdf.js
// （Playwright と Chromium が あれば それを、なければ パソコンの Edge か Chrome を つかいます。
//   できた PDF は kuku/print/pdf/ に入ります）
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pdf');
// ファイル名には 記号を 使わない（メールや ほかの パソコンで 文字化け しないように）
const FILES = [
  { q: 'g=all', name: 'くくプリント_1_カラー.pdf' },
  { q: 'g=all&mono=1', name: 'くくプリント_2_しろくろ.pdf' },
  { q: 'g=all&only=key', name: 'くくプリント_3_こたえ.pdf' },
];
const url = q => 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/').replace(/^\//, '') + '?' + q;

let playwright = null;
try { playwright = require('playwright'); } catch (e) { /* なければ Edge・Chrome */ }

async function withPlaywright() {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  for (const f of FILES) {
    await page.goto(url(f.q));
    await page.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
    await page.emulateMedia({ media: 'print' });
    const file = path.join(OUT, f.name);
    await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log('できました：', path.relative(process.cwd(), file), (await page.$$('.page')).length + 'まい');
  }
  await browser.close();
}

// Edge は すぐ もどって うしろで 作るので、ファイルが できて 大きさが かわらなく なるまで まつ
function waitFile(p) {
  const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  let last = -1, same = 0;
  for (let t = 0; t < 1200; t++) {
    sleep(1000);
    const n = fs.existsSync(p) ? fs.statSync(p).size : -1;
    if (n > 0 && n === last) { if (++same >= 3) return; } else same = 0;
    last = n;
  }
  throw new Error('PDF が できません：' + p);
}

function withEdge() {
  const cands = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/chromium', '/usr/bin/google-chrome',
  ];
  const exe = cands.find(p => fs.existsSync(p));
  if (!exe) throw new Error('Playwright も Edge・Chrome も ありません');
  const prof = path.join(require('os').tmpdir(), 'kuku-print-pdf');
  for (const f of FILES) {
    const file = path.join(OUT, f.name), tmp = path.join(OUT, 'tmp_' + Date.now() + '.pdf');
    // 日本語の ファイル名だと Edge が かけないので、いったん ちがう 名前で 作る
    execFileSync(exe, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=30000',
      `--user-data-dir=${prof}`, `--print-to-pdf=${tmp}`, url(f.q)], { stdio: 'ignore' });
    waitFile(tmp);
    fs.renameSync(tmp, file);
    console.log('できました：', path.relative(process.cwd(), file), Math.round(fs.statSync(file).size / 1024) + 'KB');
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  if (playwright) await withPlaywright(); else withEdge();
})();
