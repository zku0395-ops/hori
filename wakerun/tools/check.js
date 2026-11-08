// データと かたちの 点検：node wakerun/tools/check.js
// ・ステージ・おみせ（6しゅるい × 12こ）・えんしゅつ・はいけい・すがたが そろって いるか
// ・ひとしく わけた かたちの ピースが ぜんぶ おなじ おおきさか（まる・しかく・ななめ）
// ・ひとしくない かたちで ひかる ピースが 1/n と はっきり ちがう おおきさか
const fs = require('fs');
const path = require('path');
global.window = {};
eval(fs.readFileSync(path.join(__dirname, '..', 'data', 'data.js'), 'utf8'));
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const { STAGES, SHAPES, ITEM_CATS, FX, TIERS, LEVELS } = window.WAKE_DATA;
let bad = 0;
const ng = (...a) => { console.log('✖', ...a); bad++; };

// 1. データ
const ids = STAGES.map(s => s.id);
if (new Set(ids).size !== ids.length) ng('ステージの id が かさなって いる');
STAGES.forEach(st => {
  if (st.kind === 'hunt') {
    const ts = st.roundTargets ? st.roundTargets.flat() : st.targets;
    ts.forEach(t => { if (![2, 3, 4, 8].includes(t)) ng('さがす ぶんすうが おかしい', st.id, t); if (!st.others.some(n => n !== t)) ng('まちがいの ぶんすうが ない', st.id, t); });
    if (!st.intro) ng('intro が ない', st.id);
  }
});
if (SHAPES.length !== 6) ng('かたちが 6しゅるい ではない');
if (ITEM_CATS.length !== 6) ng('おみせが 6しゅるい ではない');
const itemIds = new Set();
ITEM_CATS.forEach(c => {
  if (c.items.length !== 12) ng('しなものが 12こ ではない', c.id);
  c.items.forEach((it, i) => {
    if (itemIds.has(it.id)) ng('しなものの id が かさなって いる', it.id); itemIds.add(it.id);
    if (i > 0 && it.p < c.items[i - 1].p) ng('ねだんが じゅんに なって いない', it.id);
    if (!TIERS[it.tier]) ng('ねだんの だんかいが ない', it.id);
  });
  if (c.slot === 'fx') c.items.forEach(it => { if (!FX[it.id]) ng('えんしゅつの 絵文字が ない', it.id); });
  if (c.slot === 'bg') c.items.forEach(it => { if (!new RegExp(`\\b${it.v}: \\[`).test(html)) ng('はいけいの いろが index.html に ない', it.v); });
  if (c.slot === 'form') c.items.forEach(it => { if (!html.includes(`'${it.v}'`) && !new RegExp(`\\b${it.v}: `).test(html)) ng('すがたの 絵が index.html に ない', it.v); });
  if (c.slot === 'acc') c.items.forEach(it => { if (!['face', 'neck', 'hand', 'back', 'aura'].includes(it.v)) ng('アクセサリの ばしょが おかしい', it.id); });
});
LEVELS.forEach((l, i) => { if (i && l.at <= LEVELS[i - 1].at) ng('レベルが じゅんに なって いない', i); });

// 2. かたち（index.html の「3. かたちと わけかた」を とりだして うごかす）
const a = html.indexOf('const C0 = 50'), b = html.indexOf('const KIND_NAME');
const shuffle = (x) => { const y = [...x]; for (let i = y.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [y[i], y[j]] = [y[j], y[i]]; } return y; };
const pickOne = (x) => x[Math.floor(Math.random() * x.length)];
const geo = new Function('shuffle', 'pickOne', html.slice(a, b) + '; return { makePart, pickLit };')(shuffle, pickOne);
const near = (x, y) => Math.abs(x - y) < 1e-6;
for (let k = 0; k < 300; k++) {
  [true, false].forEach(round => [2, 3, 4, 8].forEach(n => ['eq', 'diag', 'uneq'].forEach(mode => {
    const part = geo.makePart(round, n, mode);
    if (part.length !== n) ng('ピースの かずが ちがう', round, n, mode, part.length);
    const sum = part.reduce((t, p) => t + p.a, 0);
    if (!near(sum, 1)) ng('ピースを あわせて 1に ならない', round, n, mode, sum);
    if (mode !== 'uneq' && !part.every(p => near(p.a, 1 / n))) ng('ひとしく わけて いない', round, n, mode, part.map(p => p.a.toFixed(3)).join(','));
    if (mode === 'uneq') {
      const lit = geo.pickLit(part, n, 'uneq')[0];
      if (Math.abs(part[lit].a - 1 / n) < 0.35 / n) ng('ひとしくない かたちの ひかる ピースが 1/n に ちかすぎる', round, n, part[lit].a);
    }
    const two = geo.pickLit(part, n, 'two');
    if (two.length !== 2 || two[0] === two[1]) ng('2つぶんが 2つ ではない', n);
  })));
}
console.log(bad ? `\n${bad}こ まちがい` : 'ぜんぶ OK（ステージ・おみせ・かたち）');
process.exit(bad ? 1 : 0);
