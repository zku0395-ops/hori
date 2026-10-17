// 問題データの 点検：node romaji/tools/check.js
// ・ことばが、その ステージまでに ならった もじ だけで できて いるか
// ・どの もじ・ことばも ローマ字に できるか（ピースに わけられるか）
// ・くみたてる ときの 絵が あるか
// ・おみせの 品物の 数と 値段の だんかい
const path = require('path');
require(path.join(__dirname, '..', 'data', 'kana.js'));
require(path.join(__dirname, '..', 'data', 'mondai.js'));
const R = globalThis.ROMAJI_KANA, D = globalThis.ROMAJI_DATA;

let bad = 0;
const ng = (msg) => { console.log('✖ ' + msg); bad++; };

// 1. ローマ字の しくみ
const eq = (a, b, msg) => { if (a !== b) ng(`${msg}：${a} ≠ ${b}`); };
eq(R.unitRoma('し'), 'si', 'し'); eq(R.unitRoma('し', true), 'shi', 'し（べつ）');
eq(R.unitRoma('ちゃ'), 'tya', 'ちゃ'); eq(R.unitRoma('じょ'), 'zyo', 'じょ'); eq(R.unitRoma('じょ', true), 'jo', 'じょ（べつ）');
eq(R.unitRoma('を'), 'wo', 'を'); eq(R.unitRoma('ん'), 'n', 'ん');
eq(R.unitRoma('かあ'), 'kâ', 'かあ'); eq(R.unitRoma('ぼう'), 'bô', 'ぼう'); eq(R.unitRoma('ふう'), 'hû', 'ふう');
eq(R.wordUnits('きって').map(u => u.r).join(''), 'kitte', 'きって');
eq(R.wordUnits('お|かあ|さ|ん').map(u => u.r).join(''), 'okâsan', 'おかあさん');
eq(R.wordUnits('でんしゃ').map(u => u.r).join(''), 'densya', 'でんしゃ');
eq(R.wordUnits('ほんを よむ').filter(u => !u.space).map(u => u.r).join(''), 'honwoyomu', 'ほんを よむ');
eq(R.kanaOf('sa'), 'さ', 'sa → さ'); eq(R.kanaOf('zi'), 'じ', 'zi → じ'); eq(R.kanaOf('chi'), 'ち', 'chi → ち');

// 2. ステージ
const learned = new Set();
const stages = D.STAGES;
const ids = new Set();
stages.forEach(st => {
  if (ids.has(st.id)) ng(`ステージの id が かさなって いる：${st.id}`);
  ids.add(st.id);
  if (!st.hatten) st.kana.forEach(k => learned.add(k));
  st.kana.forEach(k => {
    if (!R.unitRoma(k, st.alt)) ng(`${st.title}：${k} を ローマ字に できません`);
    if (st.steps.includes('make') && !D.PICS[k]) ng(`${st.title}：${k} の 絵（PICS）が ありません`);
  });
  const need = { make: 'kana', read: 'kana', word: 'words', readword: 'words', mate_v: 'kana', mate_c: 'kana' };
  st.steps.forEach(s => { if (!(st[need[s]] || []).length) ng(`${st.title}：${s} の もんだいが ありません`); });
  (st.words || []).forEach(x => {
    const m = String(x).match(/^([ぁ-ゖ| ]+)(.*)$/);
    if (!m || !m[2].trim()) { ng(`${st.title}：ことばの 書き方が ちがいます（${x}）`); return; }
    const w = m[1].trim();
    const us = R.wordUnits(w, st.alt);
    us.forEach(u => { if (!u.space && !u.r) ng(`${st.title}：${w} の「${u.k}」を ローマ字に できません`); });
    if (!st.hatten) {
      [...w.replace(/[| ]/g, '')].forEach(ch => { if (!learned.has(ch)) ng(`${st.title}：${w} に まだ ならって いない「${ch}」が あります`); });
    }
    if (st.long && !us.some(u => /[âîûêô]/.test(u.r))) ng(`${st.title}：${w} に のばす おとが ありません`);
    if (!st.long && us.some(u => /[âîûêô]/.test(u.r))) ng(`${st.title}：${w} に のばす おとが あります`);
    if (st.id === 'h3' && !w.includes('っ')) ng(`${st.title}：${w} に ちいさい っ が ありません`);
  });
  if (st.steps.includes('mate_v')) {
    const vs = R.VOWELS.filter(v => st.kana.filter(k => k !== 'ん' && R.unitRoma(k).slice(-1) === v).length >= 3);
    if (vs.length < 5) ng(`${st.title}：なかまさがし（あいうえお）が たりません`);
  }
});
if (stages.filter(s => !s.hatten).length !== 15) ng('ステージは 15 の はずです');
if (learned.size !== 46) ng(`清音は 46もじ の はずです（${learned.size}）`);

// 3. おみせ
if (D.ITEM_CATS.length !== 6) ng('おみせの たなは 6つ の はずです');
D.ITEM_CATS.forEach(c => {
  if (c.items.length !== 10) ng(`${c.name}：品物が 10こ では ありません`);
  const tiers = [0, 0, 0, 0]; c.items.forEach(it => tiers[it.tier]++);
  if (tiers.join() !== '4,3,2,1') ng(`${c.name}：値段の だんかいが ちがいます（${tiers}）`);
  c.items.forEach(it => {
    if (!it.e && !it.svg) ng(`${c.name}：${it.n} に 絵が ありません`);
    if (c.kind === 'room' && !['floor', 'wall', 'shelf'].includes(it.place)) ng(`${c.name}：${it.n} の おく ばしょが ありません`);
    if (c.kind === 'wear' && !it.slot) ng(`${c.name}：${it.n} の つける ところが ありません`);
  });
});

console.log(bad ? `\n${bad}こ の もんだいが あります` : '✔ データは だいじょうぶです');
process.exit(bad ? 1 : 0);
