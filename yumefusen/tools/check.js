// データの 点検：node yumefusen/tools/check.js
//   node yumefusen/tools/check.js d01 で、その ものの「あう カード」と「あわない カード」を出します
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'yume.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'img.js'), 'utf8'), ctx);
const D = ctx.window.YUME_DATA, IMG = new Set(ctx.window.YUME_IMG);

let bad = 0;
const ng = (m) => { console.log('✖ ' + m); bad++; };
const one = process.argv[2];
if (one) {
  const it = D.ITEMS.find(i => i.id === one);
  if (!it) { console.log('ありません'); process.exit(1); }
  console.log(`${it.n}（${it.id}）`);
  it.cards.forEach(id => { const c = D.CARDS.find(x => x.id === id); console.log(`  あう：${c.t}${c.f === 'na' ? 'だからです' : 'からです'}`); });
  D.wrongCards(it).forEach(c => console.log(`  あわない：${c.t}（${D.ITEMS.find(i => i.id === c.it).n}）`));
  process.exit(0);
}

if (D.TOPICS.length !== 6) ng('おだいは 6つ');
D.TOPICS.forEach(t => {
  const items = D.ITEMS.filter(i => i.t === t.id);
  if (items.length !== 12) ng(`${t.head}：もの が ${items.length}こ（12こ）`);
  if (t.starts.length !== 3) ng(`${t.head}：書き出しが 3つ ない`);
  items.forEach(it => {
    if (!IMG.has(`items/${it.id}.webp`)) ng(`${it.n}：絵が ない`);
    if (!fs.existsSync(path.join(__dirname, '..', 'img', 'items', `${it.id}.webp`))) ng(`${it.n}：絵の ファイルが ない`);
    if (D.wrongCards(it).length < 2) ng(`${it.n}：あわない カードが すくない`);
  });
});
const ids = new Set(), names = new Set();
D.ITEMS.forEach(it => {
  if (ids.has(it.id)) ng('id が かさなって いる：' + it.id); ids.add(it.id);
  if (names.has(it.n)) ng('なまえが かさなって いる：' + it.n); names.add(it.n);
});
D.CARDS.forEach(c => {
  if (/[。、]$/.test(c.t)) ng(`カードの おわりに 。、が ある：${c.t}`);
  if (/(から|です)$/.test(c.t)) ng(`カードに「から・です」が ある：${c.t}`);
});
// おなじ おだいの なかで、おなじ カードの ことばが ないか
D.TOPICS.forEach(t => {
  const seen = {};
  D.CARDS.filter(c => D.ITEMS.find(i => i.id === c.it).t === t.id).forEach(c => { if (seen[c.t]) ng(`${t.head}：カードが かさなって いる「${c.t}」`); seen[c.t] = 1; });
});
['fuwari.webp', 'fuwari_happy.webp', 'fuwari_think.webp', 'fuwari_give.webp', 'home.webp', 'sky.webp', 'stage.webp'].forEach(f => { if (!IMG.has(f)) ng('絵が ない：' + f); });
const na = D.CARDS.filter(c => c.f === 'na').length;
console.log(`おだい ${D.TOPICS.length}・もの ${D.ITEMS.length}・カード ${D.CARDS.length}（だからです ${na}まい）`);
console.log(bad ? `✖ ${bad}けん` : '✔ ぜんぶ うまく いきました');
process.exit(bad ? 1 : 0);
