/*
 * プリント用の 絵を 作ります（アプリの 絵を、白い 紙に のせた 小さな JPEG に します）。
 *   PDF に 入れた とき、ファイルが 大きく なりすぎないように する ためです。
 * つかいかた：
 *   npm install sharp を した フォルダを SHARP_DIR に 入れて、
 *   node ouchisagashiprint/tools/make_img.js
 */
const fs = require('fs');
const path = require('path');
let sharp;
try { sharp = require('sharp'); } catch (e) {
  try { sharp = require(path.join(process.env.SHARP_DIR || '', 'node_modules', 'sharp')); } catch (e2) { console.error('sharp が ありません。npm install sharp を して、SHARP_DIR に その フォルダを 入れて ください。'); process.exit(1); }
}
const SRC = path.join(__dirname, '..', '..', 'ouchisagashi', 'img');
const OUT = path.join(__dirname, '..', 'img');
fs.mkdirSync(OUT, { recursive: true });
// あたまの 文字ごとの 大きさ（よこ はば）
const SIZE = { h_: 520, r_: 220, m_: 260, ho: 320 };
(async () => {
  const files = fs.readdirSync(SRC).filter(f => /^(h_|r_|m_|ho_)/.test(f));
  let total = 0, first = {};
  for (const f of files) {
    const w = SIZE[f.slice(0, 2)];
    const img = sharp(path.join(SRC, f));
    const meta = await img.metadata();
    if (!first[f.slice(0, 2)]) { first[f.slice(0, 2)] = 1; console.log(f, meta.width + 'x' + meta.height, meta.hasAlpha ? 'すける' : 'すけない'); }
    const out = path.join(OUT, f.replace(/\.webp$/, '.jpg'));
    await img.trim({ threshold: 2 }).resize({ width: w, withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
    total += fs.statSync(out).size;
  }
  console.log(files.length + 'まい、あわせて ' + Math.round(total / 1024) + 'KB');
})();
