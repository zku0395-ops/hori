// データの 点検：node sukiwake/tools/check.js
// ・1つの ばしょに もの が 15こ あるか、id や なまえが かさならないか
// ・カードの id が あるか、漢字が ないか
// ・どの ものにも、あう カードが 4まい いじょう、あわない カード（あじ・できること）が 3まい いじょう あるか
// node sukiwake/tools/check.js y01 のように id を つけると、その ものの カードを 出します
const path = require('path');
require(path.join(__dirname, '..', 'data', 'sukiwake.js'));
const D = globalThis.SUKI_DATA;
let bad = 0;
const ng = (m) => { console.log('✖ ' + m); bad++; };
const KANJI = /[一-鿿々]/;
const CARD = {}; D.CARDS.forEach(c => { if (CARD[c.id]) ng(`カード ${c.id} が かさなって います`); CARD[c.id] = c; });
const wrongOf = D.wrongCards;

if (process.argv[2]) {
  const it = D.ITEMS.find(x => x.id === process.argv[2]);
  if (!it) { console.log('ありません'); process.exit(1); }
  console.log(`${it.n}（${it.g}）`);
  console.log('あう：' + it.ok.map(id => CARD[id] ? CARD[id].t : `？${id}`).join('・'));
  console.log('あわない：' + wrongOf(it).map(c => c.t).join('・'));
  process.exit(0);
}

D.CARDS.forEach(c => {
  if (KANJI.test(c.t + c.te)) ng(`カード ${c.id}：漢字が あります`);
  if (![1, 2, 3, 4, 5].includes(c.k)) ng(`カード ${c.id}：しゅるいが ちがいます`);
  if (!['i', 'v', 'na'].includes(c.f)) ng(`カード ${c.id}：かたちが ちがいます`);
  if (c.f === 'na' && !c.te.endsWith('で')) ng(`カード ${c.id}：つなぐ かたちが「で」で おわって いません`);
  if (c.f === 'i' && !c.te.endsWith('くて')) ng(`カード ${c.id}：つなぐ かたちが「くて」で おわって いません`);
  if (c.f === 'v' && !/[てで]$/.test(c.te)) ng(`カード ${c.id}：つなぐ かたちが「て・で」で おわって いません`);
  if (!c.g.length) ng(`カード ${c.id}：なかまが ありません`);
});
const ids = new Set(), names = new Set();
D.PLACES.forEach(p => {
  const its = D.ITEMS.filter(i => i.p === p.id);
  if (its.length !== 15) ng(`${p.name}：もの が 15こ では ありません（${its.length}）`);
  if (KANJI.test(p.name + p.say)) ng(`${p.name}：漢字が あります`);
});
D.ITEMS.forEach(it => {
  if (ids.has(it.id)) ng(`${it.id}：id が かさなって います`); ids.add(it.id);
  if (names.has(it.n)) ng(`${it.n}：なまえが かさなって います`); names.add(it.n);
  if (KANJI.test(it.n + it.sub)) ng(`${it.n}：漢字が あります`);
  if (!it.e && !it.svg) ng(`${it.n}：絵が ありません`);
  it.ok.forEach(id => {
    if (!CARD[id]) ng(`${it.n}：カード ${id} が ありません`);
    else if (!CARD[id].g.includes(it.g)) ng(`${it.n}：カード「${CARD[id].t}」の なかまに ${it.g} が ありません`);
  });
  if (it.ok.length < 4) ng(`${it.n}：あう カードが 4まい より すくない`);
  if (new Set(it.ok.map(id => CARD[id] && CARD[id].k)).size < 2) ng(`${it.n}：あう カードの しゅるいが 1つだけ`);
  if (wrongOf(it).length < 3) ng(`${it.n}：あわない カードが 3まい より すくない`);
});
const used = new Set(D.ITEMS.flatMap(i => i.ok));
D.CARDS.forEach(c => { if (!used.has(c.id)) console.log(`（メモ）カード「${c.t}」は どの ものにも つかって いません`); });
const ss = new Set();
D.SHOP.forEach(cat => cat.items.forEach(it => { if (ss.has(it.id)) ng(`おみせ ${it.id} が かさなって います`); ss.add(it.id); if (!(it.p > 0)) ng(`おみせ ${it.id}：ねだん`); }));
console.log(`ばしょ ${D.PLACES.length}・もの ${D.ITEMS.length}・カード ${D.CARDS.length}・おみせ ${ss.size}`);
console.log(bad ? `✖ ${bad}この もんだいが あります` : '✔ もんだいは ありません');
process.exit(bad ? 1 : 0);
