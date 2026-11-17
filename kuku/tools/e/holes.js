// holes.py と同じ（Python が ない パソコン用。node と sharp）
// とじた 白い すきま（うでと からだの あいだ など）も すかす：node holes.js 入力 出力 [最小の広さ]
// 512 の絵なら 最小の広さは 300 くらい。白い目や 歯を けさないよう、小さい すきまは のこす
const sharp = require('sharp');
(async () => {
  const [src, dst, mnS] = process.argv.slice(2);
  const mn = +mnS || 600;
  const { data: px, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const wh = i => px[i * 4 + 3] > 0 && px[i * 4] > 240 && px[i * 4 + 1] > 240 && px[i * 4 + 2] > 240;
  const seen = new Uint8Array(w * h); let cnt = 0;
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || !wh(s)) continue;
    const st = [s], pts = []; seen[s] = 1;
    while (st.length) {
      const i = st.pop(), x = i % w, y = (i / w) | 0; pts.push(i);
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1])
        if (j >= 0 && !seen[j] && wh(j)) { seen[j] = 1; st.push(j); }
    }
    if (pts.length >= mn) { cnt++; for (const i of pts) px[i * 4 + 3] = 0; }
  }
  await sharp(px, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 88, effort: 6 }).toFile(dst);
  console.log('holes', cnt);
})();
