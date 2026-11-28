// データの 点検：node kagakukan/tools/check.js
//   node kagakukan/tools/check.js 3 で、ステージ3の クイズを 出します
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'kagakukan.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'img.js'), 'utf8'), ctx);
const D = ctx.window.KAGAKU_DATA, IMG = ctx.window.KAGAKU_IMG;

let bad = 0;
const ng = (m) => { console.log('✖ ' + m); bad++; };
const one = process.argv[2];
if (one) {
  (D.QUIZ[one] || []).forEach(q => console.log(`${q.id} ${q.q}\n  ○ ${q.a}\n${q.w.map(w => `  ✖ ${w[0]}（${w[1]}）`).join('\n')}`));
  process.exit(0);
}
if (D.STAGES.length !== 10) ng('ステージは 10');
const ids = new Set();
D.ITEMS.forEach(it => {
  if (ids.has(it.id)) ng('てんじの id が かさなって いる：' + it.id); ids.add(it.id);
  if (!/^[pecknst]\d$/.test(it.id) || it.id[0] !== it.g) ng('てんじの id：' + it.id);
});
['c', 'k', 's', 'n', 't'].forEach(g => { if (D.ITEMS.filter(i => i.g === g).length < 3) ng('てんじが すくない：' + g); });
const qids = new Set();
D.STAGES.forEach(st => {
  const list = D.QUIZ[st.id] || [];
  if (st.kind !== 'best' && list.length < 3) ng(`${st.n}：クイズが すくない`);
  list.forEach(q => {
    if (qids.has(q.id)) ng('クイズの id が かさなって いる：' + q.id); qids.add(q.id);
    const all = [q.a, ...q.w.map(w => w[0])];
    if (new Set(all).size !== all.length) ng(`${q.id}：こたえが かさなって いる`);
    if (q.w.length !== 2) ng(`${q.id}：まちがいの こたえは 2つ`);
    if (!q.h1 || !q.h2 || !q.h3) ng(`${q.id}：ヒントが たりない`);
    if (q.item && !ids.has(q.item)) ng(`${q.id}：てんじが ない`);
  });
});
if (D.REASONS.length < 4) ng('りゆうが すくない');
const gs = fs.readFileSync(path.join(__dirname, '..', 'コード.gs'), 'utf8');
D.ITEMS.forEach(it => { if (!gs.includes(`${it.id}: '${it.n}'`)) ng(`コード.gs の ITEM_NAME に ない：${it.id} ${it.n}`); });
D.REASONS.forEach(r => { if (!gs.includes(`${r.id}: '${r.t}'`)) ng(`コード.gs の REASON_NAME に ない：${r.id}`); });
IMG.forEach(f => { if (!fs.existsSync(path.join(__dirname, '..', 'img', f))) ng('絵の ファイルが ない：' + f); });
console.log(bad ? `✖ ${bad}けん` : `✔ データは だいじょうぶ（てんじ ${D.ITEMS.length}こ・クイズ ${qids.size}もん・絵 ${IMG.length}まい）`);
process.exit(bad ? 1 : 0);
