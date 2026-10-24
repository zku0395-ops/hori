// 問題データの点検：node typing/tools/check.js
// ・すべての ことば・ぶんが ローマ字に できるか
// ・ひらがなの ほし（6〜12）の ことばが、その ほしまでに ならった もじ だけで できて いるか
// ・ことばが かさなって いないか
// ・おみせの しなものが 16しゅるい × 10こ で、id が かさなって いないか
// ・ねだんが ふつう・ごうか・ちょうごうか・でんせつ の じゅんに あがって いるか
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'data');
global.window = {};
eval(fs.readFileSync(path.join(dir, 'romaji.js'), 'utf8'));
eval(fs.readFileSync(path.join(dir, 'mondai.js'), 'utf8'));
const R = window.TYPING_ROMAJI;
const { STAGES, ITEM_CATS, TIERS } = window.TYPING_DATA;
let bad = 0;
const ng = (...a) => { console.log('✖', ...a); bad++; };

// 1. ローマ字に できるか
STAGES.forEach(st => {
  (st.kanaList || []).forEach(k => { try { const t = new R.Typer(k); if (t.u.length !== 1) ng('かなが 1つの おとに ならない', st.id, k); } catch (e) { ng(st.id, e.message); } });
  (st.words || []).forEach(({ w }) => {
    try {
      const t = new R.Typer(w);
      // 画面の 書き方の とおりに うって おわるか
      const keys = t.u.map((u, i) => t.shown(i)).join('');
      for (const k of keys) if (!t.press(k).ok) { ng('画面の とおりに うてない', st.id, w, keys); break; }
      if (!t.done()) ng('うちおわらない', st.id, w, keys);
    } catch (e) { ng(st.id, e.message); }
  });
  const ws = (st.words || []).map(x => x.w);
  ws.forEach((w, i) => { if (ws.indexOf(w) !== i) ng('ことばが かさなって いる', st.id, w); });
});

// 2. ならった もじ だけか（ひらがなの ほし）
const learned = new Set();
const HIRA_STAGES = ['6', '7', '8', '9', '10', '11', '12'];
HIRA_STAGES.forEach(id => {
  const st = STAGES.find(s => s.id === id);
  (st.kanaList || []).forEach(k => [...k].forEach(c => learned.add(c)));
  if (id === '11') learned.add('っ');
  (st.words || []).forEach(({ w }) => [...w].forEach(c => { if (c !== ' ' && !learned.has(c)) ng('まだ ならって いない もじ', id, w, c); }));
});

// 3. おみせ
if (ITEM_CATS.length !== 16) ng('おみせが 16しゅるい でない', ITEM_CATS.length);
const ids = ITEM_CATS.flatMap(c => c.items.map(i => i.id));
ITEM_CATS.forEach(c => { if (c.items.length !== 10) ng('しなものが 10こ でない', c.id); });
ids.forEach((x, i) => { if (ids.indexOf(x) !== i) ng('id が かさなって いる', x); });
ITEM_CATS.filter(c => c.robo).forEach(c => c.items.forEach(i => { if (!i.slot || !i.v) ng('ロボットに つける ものに slot・v が ない', i.id); }));
const vs = ITEM_CATS.flatMap(c => c.items).filter(i => i.slot).map(i => i.slot + ':' + i.v);
vs.forEach((x, i) => { if (vs.indexOf(x) !== i) ng('ロボットの かたちが かさなって いる', x); });
ITEM_CATS.forEach(c => c.items.forEach((it, i) => {
  if (i && it.p < c.items[i - 1].p) ng('ねだんが さがって いる', it.id);
  if (it.p !== TIERS[it.tier].p) ng('ねだんが だんかいと あわない', it.id);
}));
// index.html の ロボットの 絵に、すべての かたちが あるか
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
ITEM_CATS.filter(c => c.robo).forEach(c => c.items.forEach(i => {
  if (!new RegExp(`(case '${i.v}'|\\b${i.v}: <|=== '${i.v}')`).test(html)) ng('ロボットの 絵に ない かたち', i.slot, i.v);
}));

const total = STAGES.reduce((n, s) => n + (s.words || []).length, 0);
console.log(`ほし ${STAGES.length}こ／ことば・ぶん ${total}こ／しなもの ${ids.length}こ`);
console.log(bad ? `✖ ${bad}けんの もんだいが あります` : '✔ もんだいは ありません');
process.exit(bad ? 1 : 0);
