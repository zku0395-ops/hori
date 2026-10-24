// 問題データの点検：node kanji3/tools/check.js
// ・3年生の200字が、もれなく 重ならずに ステージに入っているか
// ・例文の中の漢字が、1・2年生の字と、そのステージまでに習った3年生の字だけか
// ・ふりがなの ない 漢字が ないか
// ・こたえの読みが、その漢字の読みの一覧に入っているか
// ・書き順データがあるか（漢字・こたえの ひらがな）
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'data');
global.window = {};
eval(fs.readFileSync(path.join(dir, 'mondai.js'), 'utf8'));
eval(fs.readFileSync(path.join(dir, 'strokes.js'), 'utf8'));
const { KANJI, STAGES, HATTEN, PIC, PREV, BU } = window.KANJI_DATA;
const STROKES = window.KANJI_STROKES;
const GRADE3 = '悪安暗医委意育員院飲運泳駅央横屋温化荷界開階寒感漢館岸起期客究急級宮球去橋業曲局銀区苦具君係軽血決研県庫湖向幸港号根祭皿仕死使始指歯詩次事持式実写者主守取酒受州拾終習集住重宿所暑助昭消商章勝乗植申身神真深進世整昔全相送想息速族他打対待代第題炭短談着注柱丁帳調追定庭笛鉄転都度投豆島湯登等動童農波配倍箱畑発反坂板皮悲美鼻筆氷表秒病品負部服福物平返勉放味命面問役薬由油有遊予羊洋葉陽様落流旅両緑礼列練路和';
let bad = 0;
const ng = (...a) => { console.log(...a); bad++; };
const isKanji = (c) => /[一-鿿]/.test(c);
const learned = new Set(Object.keys(PREV));
if (learned.size !== 240) ng('1・2年生の字が240字でない', learned.size);

const inStages = STAGES.filter(s => s.type === 'kanji').flatMap(s => s.kanji);
if (inStages.length !== 200 || new Set(inStages).size !== 200) ng('ステージの字が200字でない', inStages.length, new Set(inStages).size);
[...GRADE3].forEach(c => { if (!inStages.includes(c)) ng('ステージに ない字', c); });
inStages.forEach(c => { if (!GRADE3.includes(c)) ng('3年生の字ではない', c); });
STAGES.filter(s => s.type === 'review').forEach(r => r.from.forEach(id => { if (!STAGES.find(s => s.id === id)) ng('ふくしゅうの ステージが ない', r.id, id); }));

const checkSentence = (who, s) => {
  const rubies = [...s.matchAll(/\{(.+?)\|(.+?)\}/g)];
  rubies.forEach(r => [...r[1]].forEach(c => { if (!learned.has(c)) ng('まだ習っていない字', who, c, s); }));
  const plain = s.replace(/\{(.+?)\|(.+?)\}/g, '').replace(/\[(.+?)\]/g, '');
  [...plain].forEach(c => { if (isKanji(c)) ng('ふりがなのない漢字', who, c, s); });
  if (/\s{2,}|^\s|\s$/.test(s)) ng('空白が おかしい', who, s);
  if (/[{}\[\]|]/.test(s.replace(/\{(.+?)\|(.+?)\}/g, '').replace(/\[(.+?)\]/g, ''))) ng('かっこが おかしい', who, s);
};

STAGES.filter(s => s.type === 'kanji').forEach(st => {
  st.kanji.forEach(k => learned.add(k));
  st.kanji.forEach(k => {
    const d = KANJI[k];
    if (!d) { ng('データなし', k); return; }
    if (d.ex.length !== 3) ng('例文が3つでない', k);
    if (!STROKES[k]) ng('書き順なし', k);
    if (!d.story) ng('なりたちが ない', k);
    if (!(k in BU)) ng('部首の データが ない', k);
    if (new Set(d.look).size !== d.look.length) ng('にている字が かさなる', k);
    d.look.forEach(l => { if (l === k) ng('にている字に じぶん', k); if (!KANJI[l] && !PREV[l]) console.log('（注意）にている字が 1〜3年生の字では ない', k, l); });
    const single = d.ex.filter(x => x.s.match(/\[(.+?)\]/)[1].length === 1);
    if (single.length < 2) ng('1字の問題が 2つ より すくない', k);
    if (single[0] !== d.ex[0]) ng('1つめの例文は 1字の問題に する', k);
    d.ex.forEach(x => {
      const ms = [...x.s.matchAll(/\[(.+?)\]/g)];
      if (ms.length !== 1 || ms[0][1][0] !== k) { ng('[ ] が おかしい', k, x.s); return; }
      const word = ms[0][1].length > 1;
      if (!word && !d.yomi.includes(x.y)) ng('よみが一覧にない', k, x.y);
      if (word && (!x.ng || x.ng.length < 2)) ng('ことばの問題に まちがいやすい読みが ない', k, x.s);
      if (!x.e) ng('絵が ない', k, x.s);
      [...x.y].forEach(c => { if (!STROKES[c]) ng('ひらがなの書き順なし', c); });
      checkSentence(k, x.s);
    });
  });
});
HATTEN.forEach(h => h.words.forEach(w => {
  if (!w.s.includes(`[${w.w}]`)) ng('はってんの [ ] が おかしい', w.w, w.s);
  checkSentence(w.w, w.s);
  [...w.w].forEach(c => { if (isKanji(c) && !learned.has(c)) ng('はってんの ことばに ならっていない字', w.w); });
  if (h.type === 'okuri') {
    if (!w.ng || w.ng.length < 2) ng('おくりがなの まちがいが ない', w.w);
    if (w.ng.includes(w.w) || new Set(w.ng).size !== w.ng.length) ng('おくりがなの まちがいが かさなる', w.w);
  }
  if (h.type === 'hantai') {
    if (!w.a || !w.ay || !w.ae) ng('はんたいの ことばが ない', w.w);
    [...w.a].forEach(c => { if (isKanji(c) && !learned.has(c)) ng('はんたいの ことばに ならっていない字', w.a); });
  }
}));
PIC.forEach(k => { if (!KANJI[k]) ng('なりたちの絵の字が ない', k); });
const imgDir = path.join(__dirname, '..', 'img', 'n');
PIC.forEach(k => { const f = path.join(imgDir, k.codePointAt(0).toString(16) + '.webp'); if (!fs.existsSync(f)) ng('なりたちの絵の ファイルが ない', k, f); });
console.log('漢字', Object.keys(KANJI).length, 'ステージ', STAGES.length, '例文', Object.values(KANJI).reduce((n, d) => n + d.ex.length, 0),
  'はってん', HATTEN.reduce((n, h) => n + h.words.length, 0), 'ことば', '部品', Object.keys(window.KANJI_PARTS).length, '字',
  '部首', Object.values(BU).filter(Boolean).length, '字', 'なりたちの絵', PIC.length, '字');
console.log(bad ? `⚠ ${bad} か所` : 'OK');
process.exit(bad ? 1 : 0);
