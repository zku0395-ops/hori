// 問題データの点検：node pico/tools/check.js
// ・すべての ことば・ぶんが ローマ字に できるか（画面の 書き方の とおりに うって おわるか）
// ・ひらがなの だんかい（6〜12）の ことばが、その だんかいまでに ならった もじ だけで できて いるか
// ・ことばが かさなって いないか
// ・いきものが どの だんかいも 5しゅるい（さいごの 1つが きんいろ）で、id が かさなって いないか
// ・おみせの しなものが 6しゅるい × 10こ で、ねだんが だんかいと あって いるか
// ・えんしゅつ・アクセサリの ばしょが index.html に あるか
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'data');
global.window = {};
eval(fs.readFileSync(path.join(dir, 'romaji.js'), 'utf8'));
eval(fs.readFileSync(path.join(dir, 'mondai.js'), 'utf8'));
const R = window.PICO_ROMAJI;
const { STAGES, ITEM_CATS, TIERS, FX, LEVELS, IMAGES } = window.PICO_DATA;
let bad = 0;
const ng = (...a) => { console.log('✖', ...a); bad++; };

// 1. ローマ字に できるか
STAGES.forEach(st => {
  (st.kanaList || []).forEach(k => { try { const t = new R.Typer(k); if (t.u.length !== 1) ng('かなが 1つの おとに ならない', st.id, k); } catch (e) { ng(st.id, e.message); } });
  (st.words || []).forEach(({ w }) => {
    try {
      const t = new R.Typer(w);
      const keys = t.u.map((u, i) => t.shown(i)).join('');
      for (const k of keys) if (!t.press(k).ok) { ng('画面の とおりに うてない', st.id, w, keys); break; }
      if (!t.done()) ng('うちおわらない', st.id, w, keys);
    } catch (e) { ng(st.id, e.message); }
  });
  const ws = (st.words || []).map(x => x.w);
  ws.forEach((w, i) => { if (ws.indexOf(w) !== i) ng('ことばが かさなって いる', st.id, w); });
  if (st.kind !== 'key' && !(st.words || []).length) ng('ことばが ない', st.id);
  if ((st.kind === 'word' || st.kind === 'sent') && !st.long) ng('ことば・ぶんの だんかいに long が ない', st.id);
});

// 2. ならった もじ だけか（ひらがなの だんかい）
const learned = new Set();
['6', '7', '8', '9', '10', '11', '12'].forEach(id => {
  const st = STAGES.find(s => s.id === id);
  (st.kanaList || []).forEach(k => [...k].forEach(c => learned.add(c)));
  if (id === '11') learned.add('っ');
  (st.words || []).forEach(({ w }) => [...w].forEach(c => { if (c !== ' ' && !learned.has(c)) ng('まだ ならって いない もじ', id, w, c); }));
});

// 3. いきもの
const mids = [];
STAGES.forEach(st => {
  if (!st.mobs || st.mobs.length !== 5) ng('いきものが 5しゅるい でない', st.id);
  (st.mobs || []).forEach((m, i) => { mids.push(m.id); if (m.rare !== (i === 4)) ng('きんいろは 5ばんめ だけ', m.id); if (!m.n || !m.e) ng('なまえか 絵文字が ない', m.id); });
});
mids.forEach((x, i) => { if (mids.indexOf(x) !== i) ng('いきものの id が かさなって いる', x); });
const names = STAGES.flatMap(st => st.mobs.map(m => m.n));
names.forEach((x, i) => { if (names.indexOf(x) !== i) ng('いきものの なまえが かさなって いる', x); });

// 4. おみせ
if (ITEM_CATS.length !== 6) ng('おみせが 6しゅるい でない', ITEM_CATS.length);
const ids = ITEM_CATS.flatMap(c => c.items.map(i => i.id));
ITEM_CATS.forEach(c => { if (c.items.length !== 10) ng('しなものが 10こ でない', c.id); });
ids.forEach((x, i) => { if (ids.indexOf(x) !== i) ng('id が かさなって いる', x); });
ITEM_CATS.forEach(c => c.items.forEach((it, i) => {
  if (i && it.p < c.items[i - 1].p) ng('ねだんが さがって いる', it.id);
  if (it.p !== TIERS[it.tier].p) ng('ねだんが だんかいと あわない', it.id);
}));
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
ITEM_CATS.find(c => c.slot === 'fx').items.forEach(it => { if (!FX[it.id]) ng('えんしゅつの とびちる ものが ない', it.id); });
ITEM_CATS.find(c => c.slot === 'body').items.forEach(it => { if (it.v !== 'rainbow' && !new RegExp(`\\b${it.v}: '`).test(html)) ng('からだの いろが index.html に ない', it.v); });
ITEM_CATS.find(c => c.slot === 'bg').items.forEach(it => { if (!new RegExp(`\\b${it.v}: \\['`).test(html)) ng('はいけいが index.html に ない', it.v); });
ITEM_CATS.find(c => c.slot === 'acc').items.forEach(it => { if (it.v === it.id && !new RegExp(`\\b${it.id}: \\{`).test(html)) ng('アクセサリの ばしょが index.html に ない', it.id); });
LEVELS.forEach((l, i) => { if (i && l.at <= LEVELS[i - 1].at) ng('レベルの かずが ふえて いない', i); });

// 5. 絵（IMAGES に ある ファイルが img/ に あるか）
IMAGES.forEach(f => { if (!fs.existsSync(path.join(__dirname, '..', 'img', f))) ng('絵の ファイルが ない', f); });

const total = STAGES.reduce((n, s) => n + (s.words || []).length, 0);
console.log(`だんかい ${STAGES.length}こ／ことば・ぶん ${total}こ／いきもの ${mids.length}しゅるい／しなもの ${ids.length}こ／絵 ${IMAGES.length}まい`);
console.log(bad ? `✖ ${bad}けんの もんだいが あります` : '✔ もんだいは ありません');
process.exit(bad ? 1 : 0);
