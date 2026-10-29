// データの 点検：node tsuri/tools/check.js
// ・つりばに さかなが 5しゅるい（おきは 6）、ぬしが 1ぴき ずつ いるか
// ・さかなの id が かさならないか、ねだん・おおきさが あうか、漢字が ないか
// ・おみせの 品物・ふね・ふくの いろ・しょうごう
// ・いちばん おおきい ごうけいが、でんたくの 10けたに おさまるか
const path = require('path');
require(path.join(__dirname, '..', 'data', 'tsuri.js'));
const D = globalThis.TSURI_DATA;

let bad = 0;
const ng = (msg) => { console.log('✖ ' + msg); bad++; };
const KANJI = /[一-鿿々]/;
const ids = new Set();
const dup = (id, what) => { if (ids.has(id)) ng(`${what}：id「${id}」が かさなって います`); ids.add(id); };

// 1. つりば
D.SPOTS.forEach(s => {
  if (KANJI.test(s.name + s.intro)) ng(`つりば${s.id}：漢字が あります`);
  if (!(s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100)) ng(`つりば${s.id}：ちずの いちが ありません`);
  if (s.hatten) return;
  const fs = D.FISH.filter(f => f.s === s.id);
  const want = s.id === 5 ? 6 : 5;
  if (fs.length !== want) ng(`つりば${s.id}（${s.name}）：さかなが ${fs.length}しゅるい（${want}しゅるいの はず）`);
  if (fs.filter(f => f.nushi).length !== 1) ng(`つりば${s.id}（${s.name}）：ぬしが 1ぴき では ありません`);
  if (s.boat && !D.ITEM_CATS.some(c => c.items.some(it => it.id === s.boat && it.go === s.id))) ng(`つりば${s.id}：ふね「${s.boat}」が おみせに ありません`);
});

// 2. さかな
if (D.FISH.length !== 31) ng(`さかなが ${D.FISH.length}しゅるい（31しゅるいの はず）`);
D.FISH.forEach(f => {
  dup(f.id, 'さかな');
  if (KANJI.test(f.n + f.d)) ng(`${f.id}：漢字が あります`);
  if (!D.SPOTS.some(s => s.id === f.s)) ng(`${f.id}：つりば ${f.s} が ありません`);
  if (!(f.p > 0 && f.p % 50 === 0)) ng(`${f.id}：ねだん ${f.p} が へんです`);
  if (!(f.min > 0 && f.max >= f.min)) ng(`${f.id}：おおきさが へんです`);
  if (f.shape === 'emoji' ? !f.e : !f.c) ng(`${f.id}：じさくの えの いろ・えもじが ありません`);
  if (!f.d) ng(`${f.id}：ずかんの せつめいが ありません`);
});
// つりばごとの ねだん（はじめは 100えん・200えん）
const prices = (sid) => [...new Set(D.FISH.filter(f => f.s === sid).map(f => f.p))].sort((a, b) => a - b);
if (prices(1).some(p => p !== 100 && p !== 200)) ng('かわ：100えん・200えん いがいの ねだんが あります');
D.SLIDE.forEach(([id, p]) => { if (!D.FISH.some(f => f.id === id)) ng(`スライドの さかな ${id} が ありません`); if (p !== 100 && p !== 200) ng(`スライドの ${id}：ねだん ${p}`); });
if (D.SLIDE.length !== 8) ng('スライドの さかなが 8しゅるい では ありません');

// 3. だんかい
if (D.STEPS.length !== 5) ng('だんかいが 5つ（①〜⑤）では ありません');
[...D.STEPS, ...D.HATTEN_STEPS].forEach(s => { if (KANJI.test(s.name + s.topic)) ng(`だんかい ${s.name}：漢字が あります`); });

// 4. おみせ
const TIERS = [0, 1, 2, 3];
D.ITEM_CATS.forEach(c => {
  if (KANJI.test(c.name + c.note)) ng(`おみせ ${c.id}：漢字が あります`);
  c.items.forEach(it => {
    dup(it.id, 'しなもの');
    if (KANJI.test(it.n)) ng(`${it.id}：漢字が あります`);
    if (!TIERS.includes(it.t)) ng(`${it.id}：ねだんの だんかいが ありません`);
    if (!(it.p > 0)) ng(`${it.id}：ねだんが ありません`);
    if (c.id === 'color' && !it.color) ng(`${it.id}：いろが ありません`);
  });
});
D.COLORS.forEach(c => dup('color_' + c.id, 'いろ'));
D.TITLES.forEach(t => { if (KANJI.test(t.n)) ng(`しょうごう ${t.n}：漢字が あります`); });

// 5. いちばん おおきい けいさん（でんたくは 10けた）
const maxTotal = Math.max(...D.SPOTS.filter(s => !s.hatten).map(s => D.FISH.filter(f => f.s === s.id).reduce((a, f) => a + f.p * s.cmax, 0)));
if (String(maxTotal).length > 10) ng(`ごうけいが 10けたを こえます（${maxTotal}）`);

console.log(`さかな ${D.FISH.length}しゅるい・しなもの ${D.ITEM_CATS.reduce((a, c) => a + c.items.length, 0)}こ・いちばん おおきい ごうけい ${maxTotal}えん`);
D.SPOTS.filter(s => !s.hatten).forEach(s => console.log(`  ${s.icon} ${s.name}：${prices(s.id).join('・')}えん、1しゅるい 1〜${s.cmax}ひき`));
console.log(bad ? `✖ ${bad}けん なおす ところが あります` : '✔ ぜんぶ だいじょうぶ です');
process.exit(bad ? 1 : 0);
