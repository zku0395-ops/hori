// ChatGPT で つくった 絵を 切り分けて、アプリ用の 絵（img/*.webp）に する
//
//   node ouchisagashi/tools/kiriwake.js ie <画像> <いえの id> <id> …    … いえが ならんだ 絵（よこ2 × たて2 など）を 1けんずつに
//       例：node ouchisagashi/tools/kiriwake.js ie まち1.png machi-01 machi-02 machi-03 machi-04
//   node ouchisagashi/tools/kiriwake.js hito <画像> <id> …              … じゅうにんが ならんだ 絵（よこ5 × たて2）を 1人ずつに
//   node ouchisagashi/tools/kiriwake.js one <画像> <なまえ> [よこ] [たて] … 1まいの 絵（hero・ho_normal など）。背景を すかして 小さく する
//   node ouchisagashi/tools/kiriwake.js bg <画像> <ばしょの id>          … はいけい（bg_machi など）
//   node ouchisagashi/tools/kiriwake.js cut <画像> <なまえ> <なまえ> … --cols=3 --rows=1 --w=400 --h=400
//       … すきな なまえで 切り分ける（hero・m_funsui〈めじるし〉・ho_normal など）。「-」は とばす ます
//   node ouchisagashi/tools/kiriwake.js auto <画像> <なまえ> <なまえ> … --w=400 --h=400
//       … よこに ならんだ ものを、すきま（すけて いる ところ）で 分ける。大きさが そろって いない 絵に つかう
//   オプション：--cols=2 --rows=2（ならびかた）
//
// ・白い 背景は すかします（絵の ふちから つながって いる 白だけ。いえの 白い かべは のこります）。
// ・さいごに data/data.js の IMAGES を、img/ に ある ファイルに あわせて 書きなおします。
// ・sharp が ひつようです（npm install sharp）。
const fs = require('fs');
const path = require('path');
let sharp;
try { sharp = require('sharp'); } catch (e) {
  try { sharp = require(path.join(process.env.SHARP_DIR || '', 'node_modules', 'sharp')); } catch (e2) { console.error('sharp が ありません。npm install sharp を して、SHARP_DIR に その フォルダを 入れて ください。'); process.exit(1); }
}
const IMG = path.join(__dirname, '..', 'img');
const DATA = path.join(__dirname, '..', 'data', 'data.js');
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const opt = {}; process.argv.slice(2).filter(a => a.startsWith('--')).forEach(a => { const [k, v] = a.slice(2).split('='); opt[k] = v === undefined ? true : v; });
const [mode, file, ...names] = args;

// ふちから つながって いる 白（うすい 灰色）を すかす
function clearWhite(buf, w, h) {
  const seen = new Uint8Array(w * h), stack = [];
  const isBg = (i) => { const a = buf[i * 4 + 3]; if (a < 20) return true; const r = buf[i * 4], g = buf[i * 4 + 1], b = buf[i * 4 + 2]; return r > 238 && g > 238 && b > 238 && Math.max(r, g, b) - Math.min(r, g, b) < 12; };
  const push = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; if (seen[i]) return; seen[i] = 1; if (isBg(i)) stack.push(i); };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) { const i = stack.pop(); buf[i * 4 + 3] = 0; const x = i % w, y = (i - x) / w; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  // ふちの 白い にじみを うすく する
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; if (buf[i * 4 + 3] === 0) continue;
    const n = [i - 1, i + 1, i - w, i + w].filter(j => buf[j * 4 + 3] === 0).length;
    if (n && buf[i * 4] > 225 && buf[i * 4 + 1] > 225 && buf[i * 4 + 2] > 225) buf[i * 4 + 3] = 90;
  }
}
// 1こ ぶんを 切り出し、まわりの すきまを つめて、きまった 大きさの まん中（下そろえ）に おく
async function piece(src, box, outW, outH, outFile, clear) {
  const { data, info } = await sharp(src).extract(box).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (clear) clearWhite(data, info.width, info.height);
  // となりの ますから はみ出した かけら（小さな しま）を けす：いちばん 大きな かたまり いがいで、ふちに ふれて いる ものを けす
  const w = info.width, h = info.height, lab = new Int32Array(w * h), sizes = [0], touch = [false];
  let n = 0;
  for (let s = 0; s < w * h; s++) {
    if (lab[s] || data[s * 4 + 3] < 30) continue;
    n++; sizes.push(0); touch.push(false); const st = [s]; lab[s] = n;
    while (st.length) { const i = st.pop(); sizes[n]++; const x = i % w, y = (i - x) / w; if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touch[n] = true;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) return; const j = Y * w + X; if (!lab[j] && data[j * 4 + 3] >= 30) { lab[j] = n; st.push(j); } }); }
  }
  const big = Math.max(...sizes);
  for (let i = 0; i < w * h; i++) { const l = lab[i]; if (l && ((touch[l] && sizes[l] < big * 0.5) || sizes[l] < 40)) data[i * 4 + 3] = 0; }
  const img = sharp(data, { raw: { width: w, height: h, channels: 4 } });
  const trimmed = await img.png().toBuffer().then(b => sharp(b).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true }));
  const pad = Math.round(outW * 0.02);
  const fitted = await sharp(trimmed.data).resize({ width: outW - pad * 2, height: outH - pad * 2, fit: 'inside' }).toBuffer({ resolveWithObject: true });
  const left = Math.round((outW - fitted.info.width) / 2), top = outH - pad - fitted.info.height;
  await sharp({ create: { width: outW, height: outH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fitted.data, left, top }]).webp({ quality: 86, alphaQuality: 90 }).toFile(outFile);
  console.log('  ' + path.basename(outFile) + '  ' + Math.round(fs.statSync(outFile).size / 1024) + 'KB');
}
async function sheet(prefix, cols, rows, outW, outH) {
  const meta = await sharp(file).metadata();
  const cw = Math.floor(meta.width / cols), ch = Math.floor(meta.height / rows);
  for (let i = 0; i < names.length; i++) {
    if (names[i] === '-') continue; // とばす ます
    const c = i % cols, r = Math.floor(i / cols);
    await piece(file, { left: c * cw, top: r * ch, width: cw, height: ch }, outW, outH, path.join(IMG, prefix + names[i] + '.webp'), true);
  }
}
// よこに ならんだ ものを、たてに すけて いる すきまで 分ける
async function auto(outW, outH) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  clearWhite(data, info.width, info.height);
  const w = info.width, h = info.height, used = [], cnt = [];
  for (let x = 0; x < w; x++) { let n = 0; for (let y = 0; y < h; y++) if (data[(y * w + x) * 4 + 3] > 40) n++; cnt.push(n); used.push(n > 2); }
  let runs = [], st = -1;
  for (let x = 0; x <= w; x++) { if (x < w && used[x]) { if (st < 0) st = x; } else if (st >= 0) { runs.push([st, x]); st = -1; } }
  // せまい すきま（10px より 小さい）は つなぐ。小さすぎる かけらは すてる
  runs = runs.reduce((a, r) => { const l = a[a.length - 1]; if (l && r[0] - l[1] < 10) l[1] = r[1]; else a.push(r.slice()); return a; }, []).filter(r => r[1] - r[0] > 30);
  // くっついて いる ときは、いちばん 広い かたまりを、いちばん 細い ところで 分ける
  while (runs.length < names.length) {
    let bi = 0; runs.forEach((r, i) => { if (r[1] - r[0] > runs[bi][1] - runs[bi][0]) bi = i; });
    const [a, b] = runs[bi], lo = Math.round(a + (b - a) * 0.2), hi = Math.round(a + (b - a) * 0.8);
    let cut = lo; for (let x = lo; x < hi; x++) if (cnt[x] < cnt[cut]) cut = x;
    for (let y = 0; y < h; y++) for (let x = cut - 1; x <= cut + 1; x++) data[(y * w + x) * 4 + 3] = 0;
    runs.splice(bi, 1, [a, cut - 1], [cut + 2, b]);
  }
  if (runs.length !== names.length) { console.error('ものの かずが あいません：絵に ' + runs.length + 'こ、なまえが ' + names.length + 'こ'); process.exit(1); }
  const png = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  for (let i = 0; i < names.length; i++) {
    if (names[i] === '-') continue;
    const left = Math.max(0, runs[i][0] - 4), right = Math.min(w, runs[i][1] + 4);
    await piece(png, { left, top: 0, width: right - left, height: h }, outW, outH, path.join(IMG, names[i] + '.webp'), false);
  }
}
function updateList() {
  const list = fs.readdirSync(IMG).filter(f => f.endsWith('.webp')).sort();
  let d = fs.readFileSync(DATA, 'utf8');
  d = d.replace(/var IMAGES = \[[^\]]*\];/, 'var IMAGES = [' + list.map(f => "'" + f + "'").join(', ') + '];');
  fs.writeFileSync(DATA, d);
  console.log('data.js の IMAGES：' + list.length + 'まい');
}
(async () => {
  if (!fs.existsSync(IMG)) fs.mkdirSync(IMG);
  if (mode === 'list') { updateList(); return; }
  if (!file || !fs.existsSync(file)) { console.error('画像が ありません：' + file); process.exit(1); }
  if (mode === 'ie') await sheet('h_', Number(opt.cols) || 2, Number(opt.rows) || 2, 630, 420);
  else if (mode === 'hito') await sheet('r_', Number(opt.cols) || 5, Number(opt.rows) || 2, 300, 300);
  else if (mode === 'auto') await auto(Number(opt.w) || 400, Number(opt.h) || 400);
  else if (mode === 'cut') await sheet('', Number(opt.cols) || names.length, Number(opt.rows) || 1, Number(opt.w) || 400, Number(opt.h) || 400);
  else if (mode === 'one') { const meta = await sharp(file).metadata(); await piece(file, { left: 0, top: 0, width: meta.width, height: meta.height }, Number(names[1]) || 360, Number(names[2]) || 520, path.join(IMG, names[0] + '.webp'), true); }
  else if (mode === 'bg') { const out = path.join(IMG, 'bg_' + names[0] + '.webp'); await sharp(file).resize({ width: 1800, height: 1200, fit: 'cover' }).webp({ quality: 78 }).toFile(out); console.log('  ' + path.basename(out) + '  ' + Math.round(fs.statSync(out).size / 1024) + 'KB'); }
  else { console.error('つかいかた：ie / hito / cut / one / bg / list'); process.exit(1); }
  updateList();
})();
