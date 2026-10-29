// ことばの データの 点検：node kotoba/tools/check.js
// ・ことばが 1つの ばしょに 10こ あるか、id が かさならないか
// ・まちがいやすい ことば（mg）が データの 中に あるか、③ぶんで つかう に 2つ いじょう 出せるか
// ・いみ・れいぶん・文に ふりがなの ない 漢字が ないか、文の（　）が 1つか
// ・モンスター・おみせ・しょうごう
const path = require('path');
require(path.join(__dirname, '..', 'data', 'kotoba.js'));
const D = globalThis.KOTOBA_DATA;

let bad = 0;
const ng = (msg) => { console.log('✖ ' + msg); bad++; };
const KANJI = /[一-鿿々]/;
const byW = new Map(D.WORDS.map(w => [w.w, w]));

// 1. ちほう・ばしょ
const pid = new Set(D.PLACES.map(p => p.id));
D.CHIHOU.forEach(c => {
  if (c.places.length !== (c.g <= 2 ? 8 : 9)) ng(`${c.name}：ばしょの かずが ちがいます`);
  c.places.forEach(p => { if (!pid.has(p)) ng(`${c.name}：ばしょ ${p} が ありません`); });
});
D.PLACES.forEach(p => {
  if (KANJI.test(p.name + p.group + p.intro)) ng(`${p.id}：ばしょの ことばに 漢字が あります`);
  if (D.WORDS.filter(w => w.p === p.id).length !== 10) ng(`${p.id}：ことばが 10こ では ありません`);
  if (!(p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100)) ng(`${p.id}：ちずの いちが ありません`);
});

// 2. ことば
const ids = new Set(), ws = new Set();
D.WORDS.forEach(w => {
  const at = `${w.id}（${w.w}）`;
  if (ids.has(w.id)) ng(`${at}：id が かさなって います`);
  if (ws.has(w.w)) ng(`${at}：おなじ ことばが 2つ あります`);
  ids.add(w.id); ws.add(w.w);
  if (!w.e || !w.mean || !w.ex || !w.bun) ng(`${at}：絵文字・いみ・れいぶん・文の どれかが ありません`);
  if (KANJI.test(w.w + w.mean + w.ex + w.bun + w.ng.join(''))) ng(`${at}：ふりがなの ない 漢字が あります`);
  if ((w.bun.match(/（　）/g) || []).length !== 1) ng(`${at}：文の（　）が 1つ では ありません`);
  if (w.ng.length !== 2) ng(`${at}：はってんの まちがった 文が 2つ では ありません`);
  w.ng.forEach(t => { if (!t.endsWith('。')) ng(`${at}：はってんの 文が「。」で おわって いません（${t}）`); });
  const mg = w.mg || [];
  mg.forEach(([x, t]) => {
    if (!byW.has(x)) ng(`${at}：まちがいやすい ことば「${x}」が データに ありません`);
    if (x === w.w) ng(`${at}：まちがいやすい ことばに じぶんが 入って います`);
    if (!['h', 'o', 'n', 'k'].includes(t)) ng(`${at}：「${x}」の しゅるい ${t} が ちがいます`);
  });
  if (mg.length < 3) ng(`${at}：まちがいやすい ことばが 3つ いじょう ありません`);
  if (mg.filter(m => m[2] !== 'x').length < 2) ng(`${at}：③ぶんで つかう に 出せる まちがいやすい ことばが 2つ いじょう ありません`);
  // れいぶんの 中に ことばが あるか（⓪であう の 下線と、②の ヒントで つかう。アプリの wordVariants と おなじ）
  const b = w.w.replace('〜', ''), vs = [b];
  const DAKU = { 'ひ': 'びぴ', 'ほ': 'ぼぽ', 'は': 'ばぱ' };
  if (w.w.startsWith('〜') && DAKU[b[0]]) [...DAKU[b[0]]].forEach(c => vs.push(c + b.slice(1)));
  if (b.includes(' ')) vs.push(b.split(' ')[0]);
  if (b.length >= 3) vs.push(b.slice(0, -1));
  if (!vs.some(v => w.ex.includes(v))) ng(`${at}：れいぶんに ことばが みつかりません（${w.ex}）`);
  // いみが おなじ ことばが ないか
  if (D.WORDS.some(o => o !== w && o.mean === w.mean)) ng(`${at}：おなじ いみの 文が ほかにも あります`);
});

// 3. モンスター
const mid = new Set();
D.PLACES.forEach(p => {
  const ms = D.MONSTERS.filter(m => m.p === p.id);
  if (ms.length !== 2 || ms.filter(m => m.boss).length !== 1) ng(`${p.id}：モンスターは ふつう1・ボス1 の はずです`);
});
D.MONSTERS.forEach(m => {
  if (mid.has(m.id)) ng(`モンスターの id が かさなって います：${m.id}`);
  mid.add(m.id);
  if (!m.name || !m.e || !m.hello || !m.bye) ng(`${m.id}：なまえ・絵文字・ことばが たりません`);
  if (KANJI.test(m.name + m.hello + m.bye)) ng(`${m.id}：漢字が あります`);
});

// 4. しょくぎょう・いろ・おみせ・しょうごう
if (D.JOBS.length !== 3) ng('しょくぎょうは 3つの はずです');
if (D.COLORS.length !== 6) ng('はじめの いろは 6つの はずです');
const PRICE = [20, 20, 20, 20, 60, 60, 60, 120, 120, 240];
const iid = new Set();
D.ITEM_CATS.forEach(c => {
  if (c.items.length !== 10) ng(`おみせ ${c.name}：品物は 10こ の はずです`);
  c.items.forEach((it, i) => {
    if (it.p !== PRICE[i]) ng(`${it.n}：ねだんの だんかいが ちがいます`);
    if (iid.has(it.id)) ng(`品物の id が かさなって います：${it.id}`);
    if (!it.e && !it.color) ng(`${it.n}：絵が ありません`);
    if (KANJI.test(it.n)) ng(`${it.n}：漢字が あります`);
    iid.add(it.id);
  });
});
if (!D.TITLES.some(t => t.all)) ng('はってん ぜんぶの しょうごうが ありません');

console.log(bad ? `✖ ${bad}けん` : `✔ ちほう ${D.CHIHOU.length}・ばしょ ${D.PLACES.length}・ことば ${D.WORDS.length}・モンスター ${D.MONSTERS.length}・おみせ ${iid.size}こ。もんだい なし`);
process.exit(bad ? 1 : 0);
