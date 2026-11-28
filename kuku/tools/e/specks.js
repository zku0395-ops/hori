// specks.py と同じ（Python が ない パソコン用。node と sharp）
// となりの絵の はしなど、小さな かけらを消す：node specks.js 入力 出力 [割合 0.004]
// 絵の広さに くらべて 割合より 小さい かたまりを すかす
const sharp = require('sharp');
(async () => {
  const [src, dst, rS] = process.argv.slice(2);
  const { data: px, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, mn = (+rS || 0.004) * w * h;
  const on = i => px[i * 4 + 3] > 40, seen = new Uint8Array(w * h); let cnt = 0;
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || !on(s)) continue;
    const st = [s], pts = []; seen[s] = 1;
    while (st.length) {
      const i = st.pop(), x = i % w, y = (i / w) | 0; pts.push(i);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, j = ny * w + nx;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && !seen[j] && on(j)) { seen[j] = 1; st.push(j); }
      }
    }
    if (pts.length < mn) { cnt++; for (const i of pts) px[i * 4 + 3] = 0; }
  }
  await sharp(px, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 88, effort: 6 }).toFile(dst);
  console.log('specks', cnt);
})();
