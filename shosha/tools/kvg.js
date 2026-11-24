// 字の 線（まん中の線）を、KanjiVG の 書き順データから 作ります。
// ・もとの データ：../../kanji1/data/strokes.js（KanjiVG, CC BY-SA 3.0）
// ・使い方：node shosha/tools/kvg.js ふ じ 山
//   出てきた「const KVG = …」を、index.html の KVG の ところに 貼ります。
//   あわせて、1画ごとの 区切り（0〜1）も 出ます。筆の ことば（トン・スー など）を 切りかえる 場所を 決める ときに 使います。
// ・noSerif に 書いた 画は、書きはじめの 小さな かざり（うったての 形）を はずして、まっすぐ 始めます。
const path = require('path');
global.window = {};
require(path.join(__dirname, '../../kanji1/data/strokes.js'));
const SRC = window.KANJI_STROKES;

const NAMES = { 'ふ': 'fu', 'じ': 'ji', '山': 'yama' };
const noSerif = { yama1: 1, yama2: 1, yama3: 1 };
const F = 6.4, CX = 500, CY = 318;   // 109 の ますを、1000×640 の 画面の まん中に 置く

function flatten(d) {
  const segs = [];   // 区切りごとの 点
  let x = 0, y = 0, px = 0, py = 0;
  const re = /([MmCcSsLl])([^MmCcSsLl]*)/g; let m;
  while ((m = re.exec(d))) {
    const cmd = m[1], n = (m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number);
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    if (C === 'M') { x = n[0]; y = n[1]; segs.push([[x, y]]); px = x; py = y; continue; }
    const step = C === 'C' ? 6 : C === 'S' ? 4 : 2;
    for (let i = 0; i + step <= n.length; i += step) {
      let x1, y1, x2, y2, x3, y3;
      const ox = rel ? x : 0, oy = rel ? y : 0;
      if (C === 'C') { x1 = ox + n[i]; y1 = oy + n[i + 1]; x2 = ox + n[i + 2]; y2 = oy + n[i + 3]; x3 = ox + n[i + 4]; y3 = oy + n[i + 5]; }
      else if (C === 'S') { x1 = 2 * x - px; y1 = 2 * y - py; x2 = ox + n[i]; y2 = oy + n[i + 1]; x3 = ox + n[i + 2]; y3 = oy + n[i + 3]; }
      else { x1 = x; y1 = y; x3 = ox + n[i]; y3 = oy + n[i + 1]; x2 = x3; y2 = y3; }
      const pts = [];
      for (let k = 1; k <= 14; k++) {
        const t = k / 14, u = 1 - t;
        pts.push([u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]);
      }
      segs.push(pts); px = x2; py = y2; x = x3; y = y3;
    }
  }
  return segs;
}

const out = {}, info = [];
for (const ch of process.argv.slice(2)) {
  const name = NAMES[ch] || ch;
  (SRC[ch] || []).forEach((d, i) => {
    const key = name + (i + 1);
    let segs = flatten(d);
    if (noSerif[key]) { const first = segs[2][0]; segs = [[[first[0], segs[0][0][1]]]].concat(segs.slice(2)); }
    const pts = [], cuts = [];
    segs.forEach(s => { s.forEach(p => pts.push([Math.round((p[0] - 54.5) * F + CX), Math.round((p[1] - 54.5) * F + CY)])); cuts.push(pts.length - 1); });
    const len = [0]; for (let k = 1; k < pts.length; k++) len.push(len[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    out[key] = pts.filter((p, k) => k === 0 || k === pts.length - 1 || len[k] - len[k - 1] > 0);
    info.push(key + '  長さ ' + Math.round(len[len.length - 1]) + '  区切り ' + cuts.slice(1).map(c => (len[c] / len[len.length - 1]).toFixed(2)).join(' ') + '  はじめ ' + pts[0] + '  おわり ' + pts[pts.length - 1]);
  });
}
console.log('/* 字の まん中の線：KanjiVG（CC BY-SA 3.0 / Ulrich Apel ほか, https://kanjivg.tagaini.net/）より。shosha/tools/kvg.js で 作る */');
console.log('const KVG = {\n' + Object.keys(out).map(k => '  ' + k + ': ' + JSON.stringify(out[k])).join(',\n') + '\n};');
console.error(info.join('\n'));
