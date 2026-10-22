// 問題データの 点検：node kuku/tools/check.js
// ・となえかたが 1〜9の だん ×1〜×9 ぜんぶ あるか
// ・お城の 階（9かい）・ステージの id が かさならないか
// ・たからもの・よろずやの 品物の 数と 値段
const path = require('path');
require(path.join(__dirname, '..', 'data', 'mondai.js'));
const D = globalThis.KUKU_DATA;

let bad = 0;
const ng = (msg) => { console.log('✖ ' + msg); bad++; };

// 1. となえかた
for (let a = 1; a <= 9; a++) {
  const t = D.TONAE[a];
  if (!t || t.length !== 9) { ng(`${a}の だんの となえかたが 9こ ありません`); continue; }
  t.forEach(([l, r], i) => {
    if (!l || !r) ng(`${a}×${i + 1}：となえかたが ありません`);
    if (/[^ぁ-ん]/.test(l + r)) ng(`${a}×${i + 1}：ひらがな いがいの 文字が あります（${l} ${r}）`);
    // こたえが 1けたの ときは「が」を つける（教科書の よみかた）
    if ((a * (i + 1) < 10) !== l.endsWith('が')) ng(`${a}×${i + 1}：「が」の つけかたが ちがいます（${l}）`);
  });
}

// 2. 階・ステージ
const dans = D.FLOORS.map(f => f.a);
if (dans.join(',') !== '5,2,3,4,6,7,8,9,1') ng(`階の じゅんばんが ちがいます（${dans.join(',')}）`);
const ids = new Set();
D.STAGES.forEach(st => {
  if (ids.has(st.id)) ng(`ステージの id が かさなって いる：${st.id}`);
  ids.add(st.id);
  if (!st.intro) ng(`${st.id}：intro が ありません`);
  if (/[一-鿿]/.test(st.intro.replace(/分/g, ''))) ng(`${st.id}：intro に ふりがなの ない 漢字が あります`);
});
dans.forEach(a => { for (let s = 0; s <= 4; s++) if (!ids.has(`${a}-${s}`)) ng(`${a}-${s} が ありません`); });
['0-1', '0-2', '0-3', 'T', 'R', 'H1', 'H2'].forEach(id => { if (!ids.has(id)) ng(`${id} が ありません`); });

// 3. たからもの
const tid = new Set(D.TREASURES.map(t => t.id));
if (D.TREASURES.length !== 10) ng(`たからものは 10こ の はずです（${D.TREASURES.length}）`);
D.FLOORS.forEach(f => { if (!tid.has(f.treasure)) ng(`${f.f}かい：たからもの ${f.treasure} が ありません`); if (!f.karakuri) ng(`${f.f}かい：からくりが ありません`); });
if (!tid.has('shachihoko')) ng('てんしゅかくの たからもの（shachihoko）が ありません');

// 4. いろ・よろずや・しょうごう
if (D.COLORS.length !== 6) ng(`はじめの いろは 6しゅるいの はずです（${D.COLORS.length}）`);
const P = [5, 5, 5, 5, 15, 15, 15, 30, 30, 60];
const iid = new Set();
D.ITEM_CATS.forEach(c => {
  if (c.id !== 'iro' && c.items.length !== 10) ng(`よろずや ${c.name}：品物は 10こ の はずです`);
  c.items.forEach((it, i) => {
    if (c.id !== 'iro' && it.p !== P[i]) ng(`${it.n}：値段の だんかいが ちがいます`);
    if (![5, 15, 30, 60].includes(it.p)) ng(`${it.n}：値段は 5・15・30・60 の どれか`);
    if (iid.has(it.id)) ng(`品物の id が かさなって いる：${it.id}`);
    if (!it.e && !it.svg && !it.color) ng(`${it.n}：絵が ありません`);
    iid.add(it.id);
  });
});
if (!D.TITLES.some(t => t.all)) ng('はってん ぜんぶの しょうごうが ありません');

console.log(bad ? `✖ ${bad}けん` : `✔ ステージ ${D.STAGES.length}・たからもの ${D.TREASURES.length}・よろずや ${iid.size}こ・となえかた 81こ。もんだい なし`);
process.exit(bad ? 1 : 0);
