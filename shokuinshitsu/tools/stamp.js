// 版を 作る 人の 道具です（Apps Script には 貼り付けません）。
// app.html の 起動の 見守りに、下の プログラムの 文字数・始まる 行・25行ごとの しるしを 書きこみます。
// app.html を 直したら、そのたびに  node tools/stamp.js  を 動かしてください。
const fs = require('fs');
const path = require('path');
const p = process.argv[2] || path.join(__dirname, '..', 'app.html');
const hash = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };
const measure = (html) => {
  const open = '<script id="main-js">';
  const start = html.indexOf(open);
  if (start < 0) throw new Error('main-js が 見つかりません');
  // ブラウザの textContent と 同じに なるよう、改行を そろえる
  const body = html.slice(start + open.length, html.indexOf('</script>', start)).replace(/\r\n?/g, '\n');
  const rows = body.split('\n');
  const sums = [];
  for (let k = 0; k * 25 < rows.length; k++) sums.push(hash(rows.slice(k * 25, k * 25 + 25).join('\n')));
  const lines = html.split('\n');
  return {
    len: body.length,
    line: html.slice(0, start).split('\n').length,
    self: lines.findIndex((l) => l.includes("throw new Error('here')")) + 1,
    last: lines.findIndex((l) => l.trim() === '</html>') + 1,
    sums: sums.join(','),
  };
};
let html = fs.readFileSync(p, 'utf8');
const re = /var EXPECT = \{[^\n]*\};/;
if (!re.test(html)) throw new Error('EXPECT の 行が 見つかりません');
const m = measure(html);
html = html.replace(re, `var EXPECT = { len: ${m.len}, line: ${m.line}, self: ${m.self}, last: ${m.last}, sums: '${m.sums}' };`);
const again = measure(html);
if (JSON.stringify(again) !== JSON.stringify(m)) throw new Error('書きこみで 中身が 変わりました');
fs.writeFileSync(p, html);
console.log('stamped', { len: m.len, line: m.line, self: m.self, last: m.last, blocks: m.sums.split(',').length });
