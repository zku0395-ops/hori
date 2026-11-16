// フデリュウの かんじ ワークシートの PDF を 作ります。
// つかいかた：node kanjiquestprint/tools/make-pdf.js        … 1年生・2年生・3年生の 全部
//             node kanjiquestprint/tools/make-pdf.js 1      … 1年生だけ（2 なら 2年生だけ、3 なら 3年生だけ）
//             node kanjiquestprint/tools/make-pdf.js 1 s1   … 1年生の ステージ1だけ（ためしに 作るとき。ぜんぶ は 作りません）
// ・ブラウザは、Windows の Microsoft Edge（なければ Google Chrome）を そのまま 使います。
//   ほかに 入れる ものは ありません（ネットには つながって いる ことが いります：フォントを よみこむため）。
// ・ページは、この フォルダを 見せる かんたんな サーバーを 自分で 立てて 開きます（画像を よみこむため）。
// ・できた PDF は 1年生が kanjiquestprint/pdf/、2年生が pdf/2nen/、3年生が pdf/3nen/ に 入ります。
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');
const { execFile } = require('child_process');
// サーバーが こたえられるように、ブラウザは まって いる あいだも ほかの しごとが できる 形で 動かす
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (args) => new Promise((resolve) => execFile(BROWSER, args, { timeout: 120000 }, () => resolve()));

const ROOT = path.join(__dirname, '..', '..'); // hori
const HERE = path.join(__dirname, '..');
const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const BROWSER = process.env.BROWSER_EXE || BROWSERS.find((b) => fs.existsSync(b));
if (!BROWSER) { console.error('Edge か Chrome が 見つかりません。BROWSER_EXE に 場所を 入れてください。'); process.exit(1); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

// ブラウザの 一時的な せっていの 場所（PROFILE_DIR で かえられます）
const profile = fs.mkdtempSync(path.join(process.env.PROFILE_DIR || os.tmpdir(), 'kqprint-'));
// ブラウザは いったん 一時的な 場所に 書き出し、それを コピーします（日本語の 名前や 書きこめない 場所でも 作れるように）
async function pdf(url, file) {
  const tmp = path.join(profile, 'out.pdf');
  for (let t = 0; t < 6; t++) {
    try { fs.unlinkSync(tmp); } catch (e) { /* ない */ }
    try {
      await run(['--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, '--no-pdf-header-footer',
        '--virtual-time-budget=20000', `--print-to-pdf=${tmp}`, url]);
    } catch (e) { /* つぎへ */ }
    // Edge は 先に もどって きて、うしろで 書きつづける ことが あるので、大きさが かわらなく なるまで まつ
    let last = -1;
    for (let w = 0; w < 60; w++) {
      await sleep(1000);
      const size = fs.existsSync(tmp) ? fs.statSync(tmp).size : 0;
      if (size > 10000 && size === last) { fs.copyFileSync(tmp, file); return true; }
      last = size;
    }
  }
  return false;
}

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const [ga, only] = process.argv.slice(2);
  const grades = ga ? [Number(ga)] : [1, 2, 3];
  const vm = require('vm');
  for (const g of grades) {
    // ステージの 一覧（ファイルの 名前は ページと おなじ きまりで つくる）
    const ctx = { window: {} }; vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, `kanji${g}/data/mondai.js`), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'kanjiquest/data/quest.js'), 'utf8'), ctx);
    const { STAGES } = ctx.window.KANJI_DATA;
    const AREAS = ctx.window.QUEST.AREAS.filter((a) => a.grade === g);
    const key = (id) => (g === 1 ? id : `${g}-${id}`);
    const R = STAGES.filter((s) => s.type === 'review');
    const clean = (t) => t.replace(/[①②③・ 　「」]/g, (c) => ({ '①': '1', '②': '2', '③': '3' }[c] || ''));
    const PRE = g === 1 ? 'かんじワークシート' : `かんじワークシート${g}ねん`;
    const OUT = path.join(HERE, g === 1 ? 'pdf' : `pdf/${g}nen`);
    fs.mkdirSync(OUT, { recursive: true });
    const name = (st) => st.type === 'review'
      ? `${PRE}_ボス${R.indexOf(st) + 1}_${clean((AREAS.find((a) => a.boss === key(st.id)) || {}).name || '')}.pdf`
      : `${PRE}_ステージ${String(Number(st.id.slice(1))).padStart(2, '0')}_${clean(st.name)}.pdf`;
    const url = (stage) => `http://127.0.0.1:${port}/kanjiquestprint/index.html?print=1&g=${g}&stage=${stage}`;
    for (const st of STAGES) {
      if (only && st.id !== only) continue;
      const file = path.join(OUT, name(st));
      console.log((await pdf(url(st.id), file) ? 'できました：' : '✖ できませんでした：') + path.relative(process.cwd(), file));
    }
    if (only) continue;
    const all = path.join(OUT, `${PRE}_ぜんぶ.pdf`);
    console.log((await pdf(url('all'), all) ? 'できました：' : '✖ できませんでした：') + path.relative(process.cwd(), all));
  }
  server.close();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* ブラウザが まだ つかって いる ときは のこす */ }
});
