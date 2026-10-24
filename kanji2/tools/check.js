// 問題データの点検：node kanji2/tools/check.js
// ・2年生の160字が、もれなく 重ならずに ステージに入っているか
// ・例文の中の漢字が、1年生の字と、そのステージまでに習った2年生の字だけか
// ・ふりがなの ない 漢字が ないか
// ・こたえの読みが、その漢字の読みの一覧に入っているか
// ・書き順データがあるか（漢字・こたえの ひらがな）
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'data');
global.window = {};
eval(fs.readFileSync(path.join(dir, 'mondai.js'), 'utf8'));
eval(fs.readFileSync(path.join(dir, 'strokes.js'), 'utf8'));
const { KANJI, STAGES, HATTEN, PIC, Y1 } = window.KANJI_DATA;
const STROKES = window.KANJI_STROKES;
const GRADE2 = '引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話';
let bad = 0;
const ng = (...a) => { console.log(...a); bad++; };
const isKanji = (c) => /[一-鿿]/.test(c);
const learned = new Set(Object.keys(Y1));
if (learned.size !== 80) ng('1年生の字が80字でない', learned.size);

const inStages = STAGES.filter(s => s.type === 'kanji').flatMap(s => s.kanji);
if (inStages.length !== 160 || new Set(inStages).size !== 160) ng('ステージの字が160字でない', inStages.length, new Set(inStages).size);
[...GRADE2].forEach(c => { if (!inStages.includes(c)) ng('ステージに ない字', c); });
inStages.forEach(c => { if (!GRADE2.includes(c)) ng('2年生の字ではない', c); });
STAGES.filter(s => s.type === 'review').forEach(r => r.from.forEach(id => { if (!STAGES.find(s => s.id === id)) ng('ふくしゅうの ステージが ない', r.id, id); }));

const checkSentence = (who, s) => {
  const rubies = [...s.matchAll(/\{(.+?)\|(.+?)\}/g)];
  rubies.forEach(r => [...r[1]].forEach(c => { if (!learned.has(c)) ng('まだ習っていない字', who, c, s); }));
  const plain = s.replace(/\{(.+?)\|(.+?)\}/g, '').replace(/\[(.+?)\]/g, '');
  [...plain].forEach(c => { if (isKanji(c)) ng('ふりがなのない漢字', who, c, s); });
  if (/\s{2,}|^\s|\s$/.test(s)) ng('空白が おかしい', who, s);
};

STAGES.filter(s => s.type === 'kanji').forEach(st => {
  st.kanji.forEach(k => learned.add(k));
  st.kanji.forEach(k => {
    const d = KANJI[k];
    if (!d) { ng('データなし', k); return; }
    if (d.ex.length !== 3) ng('例文が3つでない', k);
    if (!STROKES[k]) ng('書き順なし', k);
    if (!d.story) ng('なりたちが ない', k);
    d.look.forEach(l => { if (l === k) ng('にている字に じぶん', k); if (!KANJI[l] && !Y1[l]) console.log('（注意）にている字が 1・2年生の字では ない', k, l); });
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
  if (h.type === 'okuri') {
    if (!w.ng || w.ng.length < 2) ng('おくりがなの まちがいが ない', w.w);
    if (w.ng.includes(w.w) || new Set(w.ng).size !== w.ng.length) ng('おくりがなの まちがいが かさなる', w.w);
  }
}));
PIC.forEach(k => { if (!KANJI[k]) ng('なりたちの絵の字が ない', k); });
console.log('漢字', Object.keys(KANJI).length, 'ステージ', STAGES.length, '例文', Object.values(KANJI).reduce((n, d) => n + d.ex.length, 0),
  'はってん', HATTEN.reduce((n, h) => n + h.words.length, 0), 'ことば', '部品', Object.keys(window.KANJI_PARTS).length, '字');
console.log(bad ? `⚠ ${bad} か所` : 'OK');
process.exit(bad ? 1 : 0);
