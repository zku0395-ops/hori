// ぼうけんの データの 点検：node kanjiquest/tools/check.js
// kanji1・kanji2・kanji3 の 漢字・ステージと、kanjiquest の しま・エリア・まもの・おみせが あって いるかを しらべます。
// さいごに、img/ に ある 絵の 一覧（data/imglist.js）を 作りなおします。絵を 足したら かならず 動かしてください。
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const load = (rel) => { const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname, rel), 'utf8'), ctx); return ctx.window; };
const G = {}, STROKES = {};
[1, 2, 3].forEach((g) => {
  G[g] = load(`../../kanji${g}/data/mondai.js`).KANJI_DATA;
  Object.assign(STROKES, load(`../../kanji${g}/data/strokes.js`).KANJI_STROKES);
});
const Q = load('../data/quest.js').QUEST;
let bad = 0;
const ok = (c, msg) => { console.log((c ? '✔ ' : '✖ ') + msg); if (!c) bad++; };
const key = (g, id) => (g === 1 ? id : `${g}-${id}`);

ok(Q.ISLANDS.length === 3, 'しまは 3つ（1〜3年生）');
[1, 2, 3].forEach((g) => {
  const st = G[g].STAGES.filter((s) => s.type === 'kanji' || s.type === 'review');
  const areas = Q.AREAS.filter((a) => a.grade === g);
  const used = areas.flatMap((a) => a.stages.concat([a.boss]));
  const all = st.map((s) => key(g, s.id));
  ok(JSON.stringify(used.slice().sort()) === JSON.stringify(all.slice().sort()), `${g}年生：エリア ${areas.length}つで、ステージと ふくしゅう ${all.length}こを ぜんぶ つかう`);
  ok(areas.every((a) => { const r = st.find((s) => key(g, s.id) === a.boss); return r && JSON.stringify(r.from.map((x) => key(g, x))) === JSON.stringify(a.stages); }), `${g}年生：ボスは その エリアの ステージの ふくしゅう`);
  ok(used.every((id) => Q.MON[id] && Q.MON[id].name), `${g}年生：どの ステージにも まものが いる`);
  const kanji = st.filter((s) => s.type === 'kanji').flatMap((s) => s.kanji);
  ok(kanji.every((k) => G[g].KANJI[k] && G[g].KANJI[k].ex.length >= 1), `${g}年生：${kanji.length}字 どの 漢字にも 例文が ある`);
  ok(kanji.every((k) => STROKES[k] && STROKES[k].length > 0), `${g}年生：どの 漢字にも 書き順が ある`);
  const yomi = new Set(kanji.flatMap((k) => G[g].KANJI[k].ex.flatMap((e) => [...e.y])));
  const KANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっぁぃぅぇぉー';
  const odd = [...yomi].filter((c) => !KANA.includes(c));
  ok(!odd.length, `${g}年生：よみは 50おんひょうで 入力できる もじだけ${odd.length ? '（' + odd.join('') + '）' : ''}`);
});
ok(Object.keys(Q.MON).length === 110, 'まものは 110ぴき（20＋40＋50）');
ok(Q.HEROES.length === 4 && Q.HEROES.every((h) => h.id && h.name && h.img), 'しゅじんこうは 4しょくぎょう');
const ids = Q.SHOP.flatMap((c) => c.items.map((i) => i.id));
ok(new Set(ids).size === ids.length && Q.SHOP.every((c) => c.items.every((i) => i.p > 0)), `おみせの しなもの ${ids.length}こ（IDと ねだん）`);

// 絵（なくても うごきますが、ない ものを 知らせます）
const monImg = (id) => 'mon_' + id.replace('-', '_');
const want = ['title', 'fude', 'story_dark', ...Q.ISLANDS.map((i) => i.map), ...Q.HEROES.map((h) => h.img),
  ...Q.AREAS.flatMap((a) => ['field_' + a.id, 'bg_' + a.id]), ...Object.keys(Q.MON).map(monImg),
  ...Q.SHOP.flatMap((cat) => cat.items.map((it) => 'item_' + it.id))];
const dir = path.join(__dirname, '..', 'img');
const have = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
const list = {};
have.forEach((f) => { const m = f.match(/^([a-z0-9_]+)\.(webp|png|jpg)$/); if (m && !list[m[1]]) list[m[1]] = m[2]; });
const missing = want.filter((n) => !list[n]);
console.log(`\n絵：${want.length - missing.length} / ${want.length}まい あります${missing.length ? '。まだ ない 絵：' + missing.join('、') : ''}`);
const out = '/* 絵の 一覧（tools/check.js が 自動で 作ります。手で 書きかえないでください） */\nwindow.KQ_IMG = ' + JSON.stringify(list) + ';\n';
fs.writeFileSync(path.join(__dirname, '..', 'data', 'imglist.js'), out);
console.log(`data/imglist.js を 作りました（${Object.keys(list).length}まい）`);

console.log(bad ? `\n✖ ${bad}こ しっぱい` : '\nぜんぶ OK');
process.exit(bad ? 1 : 0);
