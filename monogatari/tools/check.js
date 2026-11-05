// データの 点検：node monogatari/tools/check.js
// ・タグの しゅるい・ふりがな・1行の ながさ
// ・漢字に ふりがなが あるか（[漢字:よみ] の 外に 漢字が ないか）
// ・③ たしかめ の こたえが ぶんしょうの 中で みつかるか、ちがう こたえと かさならないか
// ・ボタンに ない しゅるいの もんだいが ないか
const path = require('path');
require(path.join(__dirname, '..', 'data', 'monogatari.js'));
const D = globalThis.MONOGATARI_DATA;
let bad = 0;
const ng = (m) => { console.log('✖ ' + m); bad++; };
const KANJI = /[一-鿿々]/;
const norm = (t) => String(t || '').replace(/[\s　、。「」！？!?]/g, '');
const CATS = D.CATS.map(c => c.id);
const ids = new Set();

D.STORIES.forEach((s, si) => {
  const where = `おはなし${s.id}（${s.title}）`;
  if (ids.has(s.id)) ng(`${where}：id が かさなって います`);
  ids.add(s.id);
  if (si > 0 && s.id !== D.STORIES[si - 1].id + 1) console.log(`△ ${where}：id が 1つずつ ふえて いません`);
  if (KANJI.test(s.title)) ng(`${where}：だいめいに 漢字が あります`);
  if (!s.lines || !s.lines.length) ng(`${where}：ぶんしょうが ありません`);
  const buttons = s.buttons && s.buttons.length ? s.buttons : CATS;
  buttons.forEach(b => { if (!CATS.includes(b)) ng(`${where}：ボタン「${b}」は ありません`); });
  let chars = 0;
  const lines = s.lines.map((l, li) => {
    if ((l.match(/\{/g) || []).length !== (l.match(/\}/g) || []).length) ng(`${where} ${li + 1}行め：{ } の かずが あいません`);
    if ((l.match(/\[/g) || []).length !== (l.match(/\]/g) || []).length) ng(`${where} ${li + 1}行め：[ ] の かずが あいません`);
    if (/\{(?![tpkosn]\d?:)/.test(l)) ng(`${where} ${li + 1}行め：タグの しゅるいが ちがいます（t p k o s1 n1 …）`);
    const nodes = D.parse(l);
    const base = D.plain(nodes);
    const noRuby = l.replace(/\[[^\]]*\]/g, '');
    if (KANJI.test(noRuby)) ng(`${where} ${li + 1}行め：ふりがなの ない 漢字が あります（${l}）`);
    if (base.replace(/ /g, '').length > 19) ng(`${where} ${li + 1}行め：1行が ながすぎます（${base.replace(/ /g, '').length}もじ。19もじ まで）`);
    chars += base.replace(/ /g, '').length;
    return nodes;
  });
  const spans = D.spans(lines);
  spans.forEach(sp => {
    if (sp.c === 'dare' && !(sp.n >= 1 && s.people && s.people[sp.n - 1])) ng(`${where}：「${sp.base}」の 人の ばんごう ${sp.n} が people に ありません`);
  });
  if (chars > 260) console.log(`△ ${where}：${chars}もじ（200もじ くらいが めやす）`);
  buttons.forEach(b => { if (!spans.some(sp => sp.c === b)) console.log(`△ ${where}：「${b}」の ことばが ぶんしょうに ありません`); });
  (s.quiz || []).forEach((q, qi) => {
    const w = `${where} もんだい${qi + 1}`;
    if (!buttons.includes(q.c)) ng(`${w}：しゅるい「${q.c}」の ボタンが ありません`);
    if (KANJI.test(q.q + q.a)) ng(`${w}：もんだい・こたえに 漢字が あります`);
    const t = norm(q.find || q.a);
    const hit = spans.find(sp => sp.c === q.c && (norm(sp.yomi).includes(t) || norm(sp.base).includes(t)));
    if (!hit) ng(`${w}：こたえ「${q.find || q.a}」が ぶんしょうの「${q.c}」の ことばに みつかりません`);
    const all = [q.a, ...q.ng.map(x => (Array.isArray(x) ? x[0] : x))];
    if (new Set(all.map(norm)).size !== all.length) ng(`${w}：えらぶ ことばが かさなって います`);
    if (q.ng.length !== 2) console.log(`△ ${w}：ちがう こたえが ${q.ng.length}つ（2つが めやす）`);
  });
  if (!s.quiz || s.quiz.length !== 5) console.log(`△ ${where}：たしかめ が ${(s.quiz || []).length}もん（5もんが めやす）`);
  console.log(`・${where}：${s.lines.length}行・${chars}もじ・ボタン ${buttons.join(' ')}`);
});
if (D.FOREST.length < D.STORIES.length) console.log(`△ もりの なかま（${D.FOREST.length}）が おはなしの かず（${D.STORIES.length}）より すくないです`);
console.log(bad ? `\n${bad}この もんだいが あります` : '\nOK：データに もんだいは ありません');
process.exit(bad ? 1 : 0);
