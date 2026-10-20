// 問題データの 点検：node warizan/tools/check.js
// ・ステージの id が かさならないか、だんかいごとに ステージが あるか
// ・それぞれの ステージで 問題が つくれるか（わる数 × こたえ が ぜんぶの かずの さいだい いかに なるか）
// ・お話の 書き方、どうぶつ・くだもの・おみせの 品物の 数と 値段
const path = require('path');
require(path.join(__dirname, '..', 'data', 'mondai.js'));
const D = globalThis.WARIZAN_DATA;

let bad = 0;
const ng = (msg) => { console.log('✖ ' + msg); bad++; };

// 1. ステージ
const ids = new Set();
D.STAGES.forEach(st => {
  if (ids.has(st.id)) ng(`ステージの id が かさなって いる：${st.id}`);
  ids.add(st.id);
  if (!st.intro) ng(`${st.id}：intro が ありません`);
  if (!st.hatten && !D.DAN[st.dan]) ng(`${st.id}：だんかい ${st.dan} が ありません`);
  const k = st.kind;
  const pairs = (ds, ans, max) => ds.flatMap(d => ans.map(a => [d, a])).filter(([d, a]) => !max || d * a <= max);
  if (['deal', 'dealAsk', 'predict', 'eqDeal'].includes(k) && pairs(st.ks || st.ds, st.ans, st.max).length < 2) ng(`${st.id}：くばる 問題が つくれません`);
  if (k === 'pack' && pairs(st.ss, st.ans, st.max).length < 2) ng(`${st.id}：つめる 問題が つくれません`);
  if (['which', 'which2', 'eqPic', 'storyEq', 'storyBuild', 'story3'].includes(k) && pairs(st.ds, st.ans, st.max).length < 2) ng(`${st.id}：問題が つくれません`);
  if (st.pair && st.ds.filter(d => 12 % d === 0 && 12 / d >= 2).length < 2) ng(`${st.id}：12こを わける 問題が たりません`);
  if (['mulBlank', 'divKuku', 'calc', 'remCalc'].includes(k) && !(st.divs || []).length) ng(`${st.id}：わる数が ありません`);
  if (k === 'remDeal' && !st.ks.some(d => d * 1 + 1 <= st.max)) ng(`${st.id}：あまりの 問題が つくれません`);
  if (st.kind === 'calc' && st.calc && st.dan !== 9) ng(`${st.id}：calc は ⑨だけ`);
});
D.DAN.forEach(dn => {
  const n = D.STAGES.filter(s => !s.hatten && s.dan === dn.n).length;
  if (n < 3) ng(`だんかい ${dn.n}：ステージが ${n}こ しか ありません`);
});
const main = D.STAGES.filter(s => !s.hatten).length, hat = D.STAGES.filter(s => s.hatten).length;
if (main !== 37) ng(`本編の ステージは 37 の はずです（${main}）`);
if (hat !== 3) ng(`はってんは 3 の はずです（${hat}）`);
// ⓪〜④は 20こまで、⑤〜⑧は 九九の はんい（こたえは 1けた）
D.STAGES.filter(s => !s.hatten && s.dan <= 4 && s.max).forEach(s => { if (s.max > 20) ng(`${s.id}：20こを こえます`); });
D.STAGES.filter(s => (s.ans || []).some(a => a > 9)).forEach(s => ng(`${s.id}：こたえが 2けたに なります`));

// 2. どうぶつ
const aid = new Set(D.ANIMALS.map(a => a.id));
if (D.ANIMALS.length !== 12) ng(`どうぶつは 12ひきの はずです（${D.ANIMALS.length}）`);
const used = [...D.DAN.map(d => d.animal), ...D.HATTEN_ANIMALS.map(h => h.animal)];
used.forEach(a => { if (!aid.has(a)) ng(`どうぶつ ${a} が ありません`); });
if (new Set(used).size !== 12) ng('だんかい・はってんの どうぶつが かさなって いるか、たりません');
D.HATTEN_ANIMALS.forEach(h => h.need.forEach(id => { if (!ids.has(id)) ng(`はってんの ステージ ${id} が ありません`); }));

// 3. お話
['deal', 'pack'].forEach(type => D.STORIES[type].forEach(s => {
  const rest = s.t.replace(/\{(N|D|S|f|Kn|Kh)\}/g, '');
  if (/[{}]/.test(rest)) ng(`お話の 書き方が ちがいます：${s.t}`);
  if (!s.t.includes('{N}')) ng(`お話に ぜんぶの かず（{N}）が ありません：${s.t}`);
  if (type === 'pack' && !s.t.includes('{S}')) ng(`つめる お話に {S} が ありません：${s.t}`);
  if (!s.a) ng(`お話に こたえの たんいが ありません：${s.t}`);
  // 子どもの 画面の 漢字は「人」だけ（ふりがなを つける）
  const kanji = (s.t.match(/[一-鿿]/g) || []).filter(c => c !== '人');
  if (kanji.length) ng(`お話に ふりがなの ない 漢字が あります：${kanji.join('')}`);
}));

// 4. おみせ・しょうごう
const P = [5, 5, 5, 5, 15, 15, 15, 30, 30, 60];
const iid = new Set();
D.ITEM_CATS.forEach(c => {
  if (c.items.length !== 10) ng(`おみせ ${c.name}：品物は 10こ の はずです`);
  c.items.forEach((it, i) => { if (it.p !== P[i]) ng(`${it.n}：値段の だんかいが ちがいます`); if (iid.has(it.id)) ng(`品物の id が かさなって いる：${it.id}`); iid.add(it.id); });
});
if (!D.TITLES.some(t => t.all)) ng('ぜんぶ クリアの しょうごうが ありません');

console.log(bad ? `✖ ${bad}けん` : `✔ ステージ ${main}＋はってん ${hat}・どうぶつ ${D.ANIMALS.length}・おみせ ${iid.size}こ。もんだい なし`);
process.exit(bad ? 1 : 0);
