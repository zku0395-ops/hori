// ぶんの データの 点検：node bunbun/tools/check.js
// ・1つの エリアに ぶんが 20 あるか、id が かさならないか、おなじ ぶんが ないか
// ・漢字が ないか、さいごの カードが「。」で おわるか
// ・べつの ならびかたが、見本と おなじ カードで できて いるか
// ・正解に なる ならびかたの かず（おおすぎないか）
// ・モンスター・まちの ひと・たてもの・おみせ・しょうごう
// node bunbun/tools/check.js 4-01 のように ぶんの id を つけると、その ぶんの 正解の ならびかたを ぜんぶ 出します
const path = require('path');
require(path.join(__dirname, '..', 'data', 'bunbun.js'));
require(path.join(__dirname, '..', 'data', 'kumitate.js'));
const D = globalThis.BUNBUN_DATA, K = globalThis.BUNBUN_KUMI;

let bad = 0;
const ng = (msg) => { console.log('✖ ' + msg); bad++; };
const KANJI = /[一-鿿々]/;

if (process.argv[2]) {
  const b = D.BUN.find(x => x.id === process.argv[2]);
  if (!b) { console.log('ありません'); process.exit(1); }
  const p = K.prepare(b);
  console.log(p.cards.map(c => `${c.t}(${c.g})`).join(' '));
  console.log('まとまり：' + K.chunks(p.cards).map(cl => cl.map(ch => `[${ch.cards.map(c => c.t).join(' ')}:${ch.kind}]`).join('')).join(' / '));
  console.log(`ふつう ${p.okNormal.length}：`); p.okNormal.forEach(o => console.log('  ' + o.join(' ')));
  console.log(`ひろく ${p.okFree.length}`);
  process.exit(0);
}

// 1. エリア
const aid = new Set(D.AREAS.map(a => a.id));
D.AREAS.forEach(a => {
  if (KANJI.test(a.name + a.topic + a.intro)) ng(`エリア${a.id}：漢字が あります`);
  const ex = D.BUN.find(x => x.id === a.ex);
  if (!ex || ex.a !== a.id) ng(`エリア${a.id}：れいの ぶん ${a.ex} が この エリアに ありません`);
  if (D.BUN.filter(b => b.a === a.id).length !== 20) ng(`エリア${a.id}：ぶんが 20 では ありません`);
  if (!(a.x >= 0 && a.x <= 100 && a.y >= 0 && a.y <= 100)) ng(`エリア${a.id}：ちずの いちが ありません`);
  if (D.MONSTERS.filter(m => m.a === a.id).length !== 3 || D.MONSTERS.filter(m => m.a === a.id && m.boss).length !== 1) ng(`エリア${a.id}：モンスターが 2ひき＋ボス では ありません`);
  if (D.PEOPLE.filter(p => p.a === a.id).length !== 1) ng(`エリア${a.id}：まちの ひとが 1にん では ありません`);
  if (!D.MATS.some(m => m.sp === a.id)) ng(`エリア${a.id}：とくべつな ざいりょうが ありません`);
  a.drop.forEach(m => { if (!D.MATS.some(x => x.id === m)) ng(`エリア${a.id}：ざいりょう ${m} が ありません`); });
});

// 2. ぶん
const ids = new Set(), texts = new Set();
let maxN = 0, maxF = 0;
D.BUN.forEach(b => {
  const at = `${b.id}（${b.c.replace(/\|/g, ' ')}）`;
  if (ids.has(b.id)) ng(`${at}：id が かさなって います`);
  ids.add(b.id);
  if (!aid.has(b.a)) ng(`${at}：エリアが ありません`);
  const p = K.prepare(b);
  if (texts.has(p.text)) ng(`${at}：おなじ ぶんが 2つ あります`);
  texts.add(p.text);
  if (!b.e) ng(`${at}：絵文字が ありません`);
  if (KANJI.test(b.c + b.alt.join(''))) ng(`${at}：漢字が あります`);
  if (!p.cards[p.cards.length - 1].t.endsWith('。')) ng(`${at}：さいごの カードが「。」で おわって いません`);
  if (p.cards.length < 3) ng(`${at}：カードが 3まい より すくない`);
  p.cards.forEach(c => {
    if (!c.t.trim()) ng(`${at}：からの カードが あります`);
    if (!'njvadtcl'.includes(c.g)) ng(`${at}：「${c.t}」の しゅるい ${c.g} が ちがいます`);
    if (/\s$|^\s/.test(c.t)) ng(`${at}：「${c.t}」の まえか うしろに あきが あります`);
  });
  const key = (a) => a.slice().sort().join('|');
  b.alt.forEach(s => {
    if (key(s.split('|')) !== key(p.cards.map(c => c.t))) ng(`${at}：べつの ならびかた「${s}」の カードが 見本と ちがいます`);
  });
  if (!K.isOk(p.cards.map(c => c.t), p.okNormal)) ng(`${at}：見本が 正解に なりません`);
  if (p.okFree.length < p.okNormal.length) ng(`${at}：ひろく の ほうが すくない`);
  // じょしを まえの ことばと いれかえた ならびは、ひろく でも 正解に しない
  const sw = p.cards.map(c => c.t);
  p.cards.forEach((c, i) => {
    if (c.g !== 'j' || i === 0) return;
    const s2 = sw.slice(); [s2[i - 1], s2[i]] = [s2[i], s2[i - 1]];
    if (K.isOk(s2, p.okFree)) ng(`${at}：「${sw[i - 1]} ${c.t}」を いれかえても 正解に なって しまいます`);
  });
  maxN = Math.max(maxN, p.okNormal.length); maxF = Math.max(maxF, p.okFree.length);
  if (p.okFree.length > 5000) ng(`${at}：ひろく の ならびかたが おおすぎます（${p.okFree.length}）`);
});

// 3. くみたての しくみ（正解・まちがいの みわけ）
const P = (id) => K.prepare(D.BUN.find(x => x.id === id));
const T = (s) => s.split(' ');
const expect = (cond, msg) => { if (!cond) ng('しくみ：' + msg); };
const uma = P('2-01');
expect(K.isOk(T('うま が にんじん を たべる。'), uma.okNormal), '見本は 正解');
expect(!K.isOk(T('にんじん が うま を たべる。'), uma.okFree), '「にんじん が うま を」は ひろく でも まちがい');
expect(!K.isOk(T('にんじん を うま が たべる。'), uma.okNormal) && K.isOk(T('にんじん を うま が たべる。'), uma.okFree), '「にんじん を うま が」は ふつう では まちがい、ひろく では 正解');
expect(K.classify(T('うま を にんじん が たべる。'), T('うま が にんじん を たべる。'), uma.tagOf).joshi.join() === 'が→を,を→が', 'じょしの いれかえを きろくする');
const kou = P('4-01');
expect(K.isOk(T('こうえん で ぼく は おにごっこ を した。'), kou.okNormal), '「どこで」を まえに だしても 正解');
expect(!K.isOk(T('おにごっこ を ぼく は こうえん で した。'), kou.okNormal), '「なにを」を まえに だすのは ふつう では まちがい');
const ki = P('5-11');
expect(!K.isOk(T('おんなのこ は ぼうし きいろい を かぶっている。'), ki.okFree), 'ようすの ことばは かかる ことばの まえ');
expect(K.classify(T('おんなのこ は ぼうし きいろい を かぶっている。'), T('おんなのこ は きいろい ぼうし を かぶっている。'), ki.tagOf).types.includes(K.MT.kuwashiku), 'ようすの ことばの まちがいを みわける');
const ta = P('7-16');
expect(K.isOk(T('はる は たくさん はな が さきます。'), ta.okNormal) && !K.isOk(T('たくさん はる は はな が さきます。'), ta.okNormal), '「たくさん」は うごかせるが、はじめには こない');
const two = P('12-09');
expect(!K.isOk(T('ぼく は かさ を さした。 あめ が ふって、'), two.okFree), '2つの ぶんの じゅんばんは かえない');
const sym = P('4-02');
expect(K.isOk(T('おとうと は ぼく と キャッチボール を した。'), sym.okNormal), 'べつの ならびかた（おとうと は ぼく と）');

// 4. まちの ひと・たてもの・おみせ
const mats = new Set(D.MATS.map(m => m.id).concat(['coin']));
D.BUILDINGS.forEach(bd => {
  Object.keys(bd.cost).forEach(k => { if (!mats.has(k)) ng(`たてもの ${bd.id}：ざいりょう ${k} が ありません`); });
  if (bd.a && !aid.has(bd.a)) ng(`たてもの ${bd.id}：エリアが ありません`);
  const sp = D.MATS.find(m => m.sp && bd.cost[m.id]);
  if (sp && sp.sp > bd.a) ng(`たてもの ${bd.id}：まだ もらえない ざいりょう ${sp.n} を つかって います`);
});
if (new Set(D.BUILDINGS.map(b => b.id)).size !== D.BUILDINGS.length) ng('たてものの id が かさなって います');
const items = D.ITEM_CATS.flatMap(c => c.items);
if (new Set(items.map(i => i.id)).size !== items.length) ng('おみせの id が かさなって います');
items.forEach(it => { if (![10, 25, 50, 100].includes(it.p)) ng(`おみせ ${it.id}：ねだんが ちがいます`); });
D.ITEM_CATS.forEach(c => { if (c.items.length !== 8) ng(`おみせ ${c.name}：8こ では ありません`); });
if (new Set(D.MONSTERS.map(m => m.id)).size !== D.MONSTERS.length) ng('モンスターの id が かさなって います');
[...D.MONSTERS.map(m => m.name + m.hello), ...D.PEOPLE.map(p => p.name + p.help + p.thanks), ...D.BUILDINGS.map(b => b.n), ...items.map(i => i.n), ...D.TITLES.map(t => t.n), ...D.MATS.map(m => m.n)]
  .forEach(s => { if (KANJI.test(s)) ng(`漢字が あります：${s}`); });

console.log(`ぶん ${D.BUN.length}・エリア ${D.AREAS.length}・モンスター ${D.MONSTERS.length}・たてもの ${D.BUILDINGS.length}・おみせ ${items.length}`);
console.log(`正解の ならびかた（いちばん おおい ぶん）：ふつう ${maxN}・ひろく ${maxF}`);
console.log(bad ? `✖ ${bad}けん なおして ください` : '✔ データは だいじょうぶです');
process.exit(bad ? 1 : 0);
