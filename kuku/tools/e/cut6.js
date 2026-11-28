// Python が ない パソコン用（node と sharp）。使う前に、作業用フォルダで npm install sharp@0.33.5 をしておく
// node cut6.js 入力.png 人数 大きさ 出力1.webp 出力2.webp ...
// split2.py + cut.py と同じ：白い背景をすかし、かたまりごとに切り、正方形の WEBP にする
const sharp = require('sharp');
(async () => {
  const [src, nS, sizeS, ...outs] = process.argv.slice(2);
  const n = +nS, size = +sizeS;
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, px = data;
  const white = i => px[i * 4 + 3] === 0 || (px[i * 4] > 232 && px[i * 4 + 1] > 232 && px[i * 4 + 2] > 232);
  const seen = new Uint8Array(w * h), q = new Int32Array(w * h * 2); let qh = 0, qt = 0;
  const push = i => { if (!seen[i]) { seen[i] = 1; q[qt++] = i; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (qh < qt) {
    const i = q[qh++]; if (!white(i)) continue;
    px[i * 4 + 3] = 0;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) push(i - 1); if (x < w - 1) push(i + 1); if (y > 0) push(i - w); if (y < h - 1) push(i + w);
  }
  // アルファ：3x3 の最小 → 3x3 の ぼかし
  let a = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) a[i] = px[i * 4 + 3];
  const mn = new Uint8Array(w * h), bl = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let m = 255; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = Math.min(w - 1, Math.max(0, x + dx)), yy = Math.min(h - 1, Math.max(0, y + dy)); m = Math.min(m, a[yy * w + xx]); }
    mn[y * w + x] = m; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const wt = (dx || dy) ? ((dx && dy) ? 1 : 2) : 4; s += mn[yy * w + xx] * wt; k += wt; }
    bl[y * w + x] = Math.round(s / k); }
  for (let i = 0; i < w * h; i++) px[i * 4 + 3] = bl[i];
  // かたまり（1/4）
  const sw = (w / 4) | 0, sh = (h / 4) | 0, sp = new Uint8Array(sw * sh);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    let s = 0; for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) s += bl[(y * 4 + dy) * w + x * 4 + dx]; sp[y * sw + x] = s / 16; }
  const lab = new Int32Array(sw * sh), comps = [];
  for (let s0 = 0; s0 < sw * sh; s0++) {
    if (sp[s0] <= 40 || lab[s0]) continue;
    const k = comps.length + 1, st = [s0]; lab[s0] = k;
    let cnt = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, sx = 0;
    while (st.length) {
      const i = st.pop(), x = i % sw, y = (i / sw) | 0; cnt++; sx += x;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, j = ny * sw + nx;
        if (nx >= 0 && ny >= 0 && nx < sw && ny < sh && !lab[j] && sp[j] > 40) { lab[j] = k; st.push(j); } }
    }
    comps.push({ k, n: cnt, box: [x0, y0, x1, y1], cx: sx / cnt });
  }
  comps.sort((p, q) => q.n - p.n);
  const big = comps.slice(0, n).sort((p, q) => p.cx - q.cx);
  console.log('big', big.map(c => [c.n, c.box.map(v => v * 4)]), 'others', comps.length - n);
  const groups = big.map(c => [c]);
  for (const c of comps.slice(n)) {
    let j = 0; big.forEach((b, t) => { if (Math.abs(b.cx - c.cx) < Math.abs(big[j].cx - c.cx)) j = t; });
    if (c.n > 2) groups[j].push(c); // ごく小さい かけらは すてる
  }
  for (let g = 0; g < n; g++) {
    const keys = new Set(groups[g].map(c => c.k));
    const near = (x, y) => { const sx = (x / 4) | 0, sy = (y / 4) | 0;
      for (let yy = Math.max(0, sy - 1); yy < Math.min(sh, sy + 2); yy++) for (let xx = Math.max(0, sx - 1); xx < Math.min(sw, sx + 2); xx++) if (keys.has(lab[yy * sw + xx])) return true; return false; };
    const X0 = Math.min(...groups[g].map(c => c.box[0])) * 4 - 4, Y0 = Math.min(...groups[g].map(c => c.box[1])) * 4 - 4;
    const X1 = Math.max(...groups[g].map(c => c.box[2])) * 4 + 4, Y1 = Math.max(...groups[g].map(c => c.box[3])) * 4 + 4;
    const cw = X1 - X0, ch = Y1 - Y0, buf = Buffer.alloc(cw * ch * 4);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1;
    for (let y = Math.max(0, Y0); y < Math.min(h, Y1); y++) for (let x = Math.max(0, X0); x < Math.min(w, X1); x++) {
      const i = y * w + x; if (!px[i * 4 + 3] || !near(x, y)) continue;
      const o = ((y - Y0) * cw + (x - X0)) * 4; px.copy(buf, o, i * 4, i * 4 + 4);
      bx0 = Math.min(bx0, x - X0); by0 = Math.min(by0, y - Y0); bx1 = Math.max(bx1, x - X0 + 1); by1 = Math.max(by1, y - Y0 + 1);
    }
    const bw = bx1 - bx0, bh = by1 - by0, s = Math.max(bw, bh), pad = Math.round(s * 0.03);
    const crop = await sharp(buf, { raw: { width: cw, height: ch, channels: 4 } }).extract({ left: bx0, top: by0, width: bw, height: bh }).png().toBuffer();
    await sharp({ create: { width: s + 2 * pad, height: s + 2 * pad, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: crop, left: Math.floor((s - bw) / 2) + pad, top: Math.floor((s - bh) / 2) + pad }])
      .png().toBuffer().then(b => sharp(b).resize(size, size).webp({ quality: 88, effort: 6 }).toFile(outs[g]));
    console.log(outs[g], bw, bh);
  }
})();
