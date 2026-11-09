// ひっ算の しくみと データの 点検：node kakezan/tools/check.js
// ・先生の プリントの もんだい（POOL）が、その しゅるいに あって いるか
// ・どの しゅるいでも、1マスずつの てじゅんで 正しい こたえに なるか（2だんめの ✕の マスは 0）
// ・まちがいの しゅるいの 見分け（くりあがりの たしわすれ・くらいの まちがい など）
// ・ばしょ・モンスター・おみせ・しゅぎょうの データが そろって いるか
const fs = require('fs');
const path = require('path');
global.window = {};
eval(fs.readFileSync(path.join(__dirname, '..', 'data', 'data.js'), 'utf8'));
const D = window.KAKE_DATA;
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let bad = 0;
const ng = (...a) => { console.log('✖', ...a); bad++; };

// index.html の「4. ひっ算の しくみ」を とりだして うごかす
const a = html.indexOf('const digits = (n)'), b = html.indexOf('//  5. すすみぐあい');
const shuffle = (x) => { const y = [...x]; for (let i = y.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [y[i], y[j]] = [y[j], y[i]]; } return y; };
const pickOne = (x) => x[Math.floor(Math.random() * x.length)];
const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const H = new Function('D', 'shuffle', 'pickOne', 'rnd', html.slice(a, b).replace(/\/\/ ={5,}[\s\S]*$/, '') +
  '; return { classify, randFor, makeProblem, buildHissan, mistakeKind, stepPrompt, hintText, hintCalc, missText, operandCells, makeMato, makeIshi, KINDS };')(D, shuffle, pickOne, rnd);

// 1. プリントの もんだい
Object.entries(D.POOL).forEach(([spec, list]) => list.forEach(([x, y]) => {
  const c = H.classify(x, y);
  if (c !== spec) ng('プリントの もんだいの しゅるいが ちがう', spec, `${x}×${y}`, '→', c);
}));

// 2. てじゅんで こたえを つくる
function solve(h) {
  const cells = {};
  h.steps.forEach(s => { cells[(s.memo ? s.row + 'm' : s.row) + ':' + s.place] = s.val; });
  const read = (row) => { let v = 0; for (let p = 0; p < 8; p++) if (cells[row + ':' + p] !== undefined) v += cells[row + ':' + p] * 10 ** p; return v; };
  return h.two ? { p1: read('p1'), p2: read('p2'), ans: read('sum'), cells } : { ans: read('ans'), cells };
}
const specs = ['k', 'n0', 'c1', 'd3', 'z0', 't10', 'tn', 't1x', 'x22a', 'x22', 'h31', 'h32'];
const check = (x, y) => {
  const h = H.buildHissan(x, y), r = solve(h);
  if (r.ans !== x * y) ng('こたえが あわない', `${x}×${y}`, r.ans);
  if (h.two) {
    if (r.p1 !== x * (y % 10)) ng('1だんめが あわない', `${x}×${y}`, r.p1);
    if (r.p2 !== x * Math.floor(y / 10) * 10) ng('2だんめが あわない', `${x}×${y}`, r.p2);
    if (r.cells['p2:0'] !== 0) ng('✕の マスが 0 ではない', `${x}×${y}`);
    if (h.steps.find(s => s.kind === 'zero') !== h.steps.filter(s => s.row === 'p2')[0]) ng('✕の 0 が 2だんめの さいしょ ではない', `${x}×${y}`);
  }
  // みぎから じゅんばん（おなじ だんの なかで くらいが へらない）
  ['ans', 'p1', 'p2', 'sum'].forEach(row => {
    const ps = h.steps.filter(s => s.row === row && !s.memo).map(s => s.place);
    if (ps.some((p, i) => i && p < ps[i - 1])) ng('みぎから じゅんばんに なって いない', `${x}×${y}`, row);
  });
  h.steps.forEach(s => {
    if (s.val < 0 || s.val > 9) ng('マスに 2けたの かず', `${x}×${y}`, s.kind);
    if (!H.stepPrompt(s) || !H.hintText(s) || !H.hintCalc(s).length) ng('ことばが ない', s.kind);
    H.operandCells(s).forEach(k => { if (!/^(a|b|p1|p2|sum|ans|summ|p1m|p2m|ansm):\d$/.test(k)) ng('ひからせる マスが おかしい', k); });
  });
  return h;
};
specs.forEach(spec => {
  for (let i = 0; i < 400; i++) {
    const [x, y] = H.randFor(spec);
    if (H.classify(x, y) !== spec) ng('つくった もんだいの しゅるいが ちがう', spec, `${x}×${y}`);
    check(x, y);
  }
  const used = new Set();
  for (let i = 0; i < 5; i++) { const p = H.makeProblem(spec, used); if (!p) ng('もんだいが つくれない', spec); }
});
['m1', 'm2'].forEach(spec => { const used = new Set(); for (let i = 0; i < 20; i++) check(...H.makeProblem(spec, used)); });
for (let x = 2; x <= 9; x++) for (let y = 2; y <= 9; y++) check(x, y);
for (let x = 10; x <= 99; x++) for (let y = 2; y <= 99; y++) check(x, y);

// 3. スライドと おなじ かきかた
const h343 = H.buildHissan(34, 3);
const s0 = h343.steps;
if (!(s0[0].kind === 'mul' && s0[0].val === 2 && s0[1].kind === 'memo' && s0[1].val === 1 && s0[2].kind === 'mul' && s0[2].val === 0 && s0[2].carry === 1 && s0[3].kind === 'mulhi' && s0[3].val === 1))
  ng('34×3 の てじゅんが スライドと ちがう', JSON.stringify(s0.map(s => [s.kind, s.val])));
const h2326 = solve(H.buildHissan(23, 26));
if (h2326.p1 !== 138 || h2326.p2 !== 460 || h2326.ans !== 598) ng('23×26 が プリントと ちがう');

// 4. まちがいの しゅるい
const st27 = H.buildHissan(27, 3).steps; // 7×3=21 → 1, メモ 2, 2×3+2=8
if (H.mistakeKind(st27[0], 2) !== 'くらいの まちがい') ng('21 の 2 を かいたら くらいの まちがい');
if (H.mistakeKind(st27[0], 3) !== 'くくの まちがい') ng('ちがう かずは くくの まちがい');
if (H.mistakeKind(st27[2], 6) !== 'くりあがりの たしわすれ') ng('2×3 の 6 は くりあがりの たしわすれ');
const z = H.buildHissan(34, 12).steps.find(s => s.kind === 'zero');
if (H.mistakeKind(z, 4) !== '0の かきわすれ') ng('✕の マスの まちがいは 0の かきわすれ');
const add = H.buildHissan(23, 26).steps.filter(s => s.kind === 'add').find(s => s.carry > 0);
if (add && H.mistakeKind(add, (add.x + add.y) % 10) !== 'たし算の くりあがり わすれ') ng('たし算の くりあがり わすれ');
const kinds = new Set(H.KINDS);
for (let x = 10; x <= 99; x += 7) for (let y = 2; y <= 99; y += 3) H.buildHissan(x, y).steps.forEach(s => {
  for (let v = 0; v <= 9; v++) if (v !== s.val) { const k = H.mistakeKind(s, v); if (!kinds.has(k)) ng('しらない まちがいの しゅるい', k); if (!H.missText(k, s)) ng('こえかけが ない', k); }
});

// 5. しゅぎょう（えらぶ こたえ）
for (let i = 0; i < 500; i++) {
  [H.makeMato(), H.makeIshi()].forEach(q => {
    if (q.choices.length !== 4 || new Set(q.choices).size !== 4) ng('えらぶ こたえが 4つ ではない', q.q, q.choices);
    if (!q.choices.includes(q.ans)) ng('こたえが ない', q.q);
    if (q.choices.some(c => c <= 0)) ng('0いかの こたえ', q.q, q.choices);
  });
}

// 6. データ
if (D.PLACES.length !== 10) ng('ばしょが 10 ではない');
D.PLACES.forEach(pl => {
  if (pl.battles.length !== 3) ng('たたかいが 3つ ではない', pl.id);
  const ms = D.MONSTERS.filter(m => m.place === pl.id);
  if (ms.length !== 3 || !ms[2].boss || ms[0].boss || ms[1].boss) ng('モンスターが 3たい（さいごが ぬし）ではない', pl.id);
  if (!pl.intro || !pl.gem || !pl.gemColor || !pl.sky || !pl.ground) ng('ばしょの データが たりない', pl.id);
});
if (D.PLACES.filter(p => !p.hatten).length !== 9) ng('ほうせきの ばしょが 9 ではない');
const mids = D.MONSTERS.map(m => m.id);
if (new Set(mids).size !== mids.length) ng('モンスターの id が かさなって いる');
if (D.MONSTERS.length !== 30) ng('モンスターが 30たい ではない');
if (D.JOBS.length !== 4 || D.FORMS.length !== 3) ng('しょくぎょう 4・すがた 3 ではない');
const iids = new Set();
D.SHOPS.forEach(s => {
  if (s.items.length !== 10) ng('しなものが 10こ ではない', s.id);
  s.items.forEach((it, i) => {
    if (iids.has(it.id)) ng('しなものの id が かさなって いる', it.id); iids.add(it.id);
    if (i && it.p < s.items[i - 1].p) ng('ねだんが じゅんに なって いない', it.id);
    if (!D.TIERS.find(t => t.id === it.t)) ng('ねだんの だんかいが ない', it.id);
  });
  if (s.open && !D.PLACES.find(p => p.id === s.open)) ng('おみせが ひらく ばしょが ない', s.id);
});
if (D.SHUGYO.length !== 4) ng('しゅぎょうが 4つ ではない');
if (D.SHUGYO.some(s => !html.includes(`'${s.id}'`))) ng('しゅぎょうの id が index.html に ない');

console.log(bad ? `\n${bad}こ もんだいが あります` : '✔ ぜんぶ OK');
process.exit(bad ? 1 : 0);
