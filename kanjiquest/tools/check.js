// ぼうけんの データの 点検：node kanjiquest/tools/check.js
// kanji1 の 漢字・ステージと、kanjiquest の エリア・まもの・おみせが あって いるかを しらべます。
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['../../kanji1/data/mondai.js', '../../kanji1/data/strokes.js', '../data/quest.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), ctx);
}
const { KANJI, STAGES } = ctx.window.KANJI_DATA;
const STROKES = ctx.window.KANJI_STROKES;
const Q = ctx.window.QUEST;
let bad = 0;
const ok = (c, msg) => { console.log((c ? '✔ ' : '✖ ') + msg); if (!c) bad++; };

const used = Q.AREAS.flatMap((a) => a.stages.concat([a.boss]));
const all = STAGES.filter((s) => s.type === 'kanji' || s.type === 'review').map((s) => s.id);
ok(Q.AREAS.length === 4, 'エリアは 4つ');
ok(JSON.stringify(used.slice().sort()) === JSON.stringify(all.slice().sort()), 'kanji1 の ステージ 16 ＋ ふくしゅう 4 を ぜんぶ つかう');
ok(Q.AREAS.every((a) => a.nodes.length === a.stages.length + 1), 'エリアの 地図の 位置の 数');
ok(Q.AREAS.every((a) => { const r = STAGES.find((s) => s.id === a.boss); return r && JSON.stringify(r.from) === JSON.stringify(a.stages); }), 'ボスは その エリアの ステージの ふくしゅう');
ok(used.every((id) => Q.MON[id] && Q.MON[id].name), 'どの ステージにも まものが いる');
ok(Object.keys(Q.MON).length === 20, 'まものは 20ぴき');
const kanji = STAGES.filter((s) => s.type === 'kanji').flatMap((s) => s.kanji);
ok(kanji.length === 80 && new Set(kanji).size === 80, '漢字は 80字（かさならない）');
ok(kanji.every((k) => KANJI[k] && KANJI[k].ex.length >= 1), 'どの 漢字にも 例文が ある');
ok(kanji.every((k) => STROKES[k] && STROKES[k].length > 0), 'どの 漢字にも 書き順が ある');
const yomiChars = new Set(kanji.flatMap((k) => KANJI[k].ex.flatMap((e) => [...e.y])));
const KANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっぁぃぅぇぉ';
ok([...yomiChars].every((c) => KANA.includes(c)), 'よみは 50おんひょうで 入力できる もじだけ');
ok(Q.HEROES.length === 4 && Q.HEROES.every((h) => h.id && h.name && h.img), 'しゅじんこうは 4しょくぎょう');
const ids = Q.SHOP.flatMap((c) => c.items.map((i) => i.id));
ok(new Set(ids).size === ids.length && Q.SHOP.every((c) => c.items.every((i) => i.p > 0)), 'おみせの しなもの（IDと ねだん）');

// 絵（なくても うごきますが、ない ものを 知らせます）
const want = ['title', 'world_map', 'fude', 'story_dark', ...Q.HEROES.map((h) => h.img), ...Q.AREAS.flatMap((a) => ['field_' + a.id, 'bg_' + a.id]), ...Object.keys(Q.MON).map((id) => 'mon_' + id), ...Q.SHOP.flatMap((cat) => cat.items.map((it) => 'item_' + it.id))];
const dir = path.join(__dirname, '..', 'img');
const have = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
const missing = want.filter((n) => !have.includes(n + '.webp') && !have.includes(n + '.png') && !have.includes(n + '.jpg'));
console.log(`\n絵：${want.length - missing.length} / ${want.length}まい あります${missing.length ? '。まだ ない 絵：' + missing.join('、') : ''}`);

console.log(bad ? `\n✖ ${bad}こ しっぱい` : '\nぜんぶ OK');
process.exit(bad ? 1 : 0);
