// rooms.py と同じ（Python が ない パソコン用。node と sharp）
// node rooms.js 入力 下からの余白 出力.webp 見本.png
// 絵の はばいっぱいで 4:1 に切り、1600x400 にする。見本は アプリの場面（1150x168、object-cover）の見え方
const sharp = require('sharp');
(async () => {
  const [src, offS, out, prev] = process.argv.slice(2);
  const m = await sharp(src).metadata();
  const w = m.width, sh = Math.floor(w / 4), b = m.height - (+offS || 0), t = Math.max(0, b - sh);
  const r = await sharp(src).extract({ left: 0, top: t, width: w, height: sh }).resize(1600, 400).webp({ quality: 86 }).toBuffer();
  await sharp(r).toFile(out);
  const ch = Math.round(1600 * 168 / 1150);
  if (prev) await sharp(r).extract({ left: 0, top: Math.floor((400 - ch) / 2), width: 1600, height: ch }).resize(1150, 168).png().toFile(prev);
  console.log(out, w + 'x' + m.height, 'top', t);
})();
