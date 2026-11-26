// データの 点検：node ouchisagashi/tools/check.js
//  ・いえ 60けんが ぜんぶ ちがうか
//  ・どの ステージ・どの いえでも、もんだいが つくれて、こたえが 1けんに きまるか
//  ・「--hyo」を つけると、いえの 設計表（e_chatgpt.md に のせる 表）を 出します
const O = require('../data/data.js');
let bad = 0;
const ok = (c, msg) => { if (!c) { console.log('✖ ' + msg); bad++; } };
let seed = 7;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

O.AREAS.forEach(a => {
  const hs = O.houses(a.id);
  ok(hs.length === 10, `${a.n}：いえが 10けん`);
  ok(new Set(hs.map(h => O.LOOK.map(k => h[k]).join('|'))).size === 10, `${a.n}：おなじ いえが ない`);
  ok(a.animals.length === 10, `${a.n}：じゅうにんが 10人`);
  hs.forEach(h => {
    ok(O.ROOF[h.roof] && O.WALL[h.wall] && O.GARDEN[h.garden] && O.VEHICLE[h.vehicle] && O.DOOR[h.door] && O.WINDOW.includes(h.window), `${h.id}：あたいが ただしい`);
    ok(h.row !== undefined, `${h.id}：ちずに ある`);
    ok(h.door !== h.wall, `${h.id}：ドアと かべが ちがう いろ`);
  });
  ok(O.cells(a.id).length === 12, `${a.n}：ちずに いえ 10けんと めじるし 2つ`);
  // ならびの とちゅうに あきちが ない
  a.layout.forEach((rd, r) => ['u', 'd'].forEach(sd => { const l = (rd[sd] || []).map(x => x !== null && x !== undefined); ok(l.length === 0 || l.length === O.SLOTS, `${a.n}：みち${r + 1}の ますの かず`); ok(l.join('').replace(/^(false)*|(false)*$/g, '').indexOf('false') < 0, `${a.n}：みち${r + 1}の ならびが つながって いる`); }));
});
ok(new Set(O.AREAS.flatMap(a => a.animals.map(x => x[0]))).size === 60, 'じゅうにん 60人が ぜんぶ ちがう');
ok(new Set(O.STAGES.map(s => s.id)).size === O.STAGES.length, 'ステージの id が ぜんぶ ちがう');

let total = 0, needSum = 0, clueSum = 0;
const fall = {}, kinds = {}, lens = {};
O.STAGES.forEach(st => {
  const areas = st.area === 'all' ? O.AREAS.map(a => a.id) : [st.area];
  areas.forEach(aid => {
    const hs = O.houses(aid);
    const ts = st.who === 'a' ? hs.slice(0, 5) : st.who === 'b' ? hs.slice(5) : hs;
    ts.forEach(t => {
      for (let qi = 0; qi < 5; qi++) for (let r = 0; r < 20; r++) {
        const q = O.makeQuestion(st, t, qi, rnd);
        if (!q) { ok(false, `${st.id} ${t.id}：もんだいが つくれない`); continue; }
        const real = q.clues.filter(c => c.t !== 'extra');
        const m = q.shown.filter(h => O.matchAll(h, q.clues, true));
        ok(m.length === 1 && m[0] === q.target, `${st.id} ${t.id}：こたえが 1けん`);
        ok(q.shown.length === st.n, `${st.id} ${t.id}：いえの かず ${q.shown.length}`);
        ok(new Set(q.shown).size === q.shown.length, `${st.id} ${t.id}：おなじ いえが 2回 出ない`);
        q.clues.forEach(c => ok(typeof O.text(aid, c) === 'string' && !/undefined/.test(O.text(aid, c)), `${st.id}：文が つくれる`));
        ok((q.clues.length - real.length) === (st.extra || 0), `${st.id}：いらない 文の かず`);
        q.clues.forEach(c => ok(!O.kind(c).includes('・'), `${st.id}：しゅるいの なまえに「・」を つかわない（${O.kind(c)}）`));
        total++; needSum += q.need; clueSum += real.length; real.forEach(c => { kinds[O.kind(c)] = (kinds[O.kind(c)] || 0) + 1; }); lens[st.id] = lens[st.id] || {}; lens[st.id][real.length] = (lens[st.id][real.length] || 0) + 1;
        const wantPos = st.pats[qi % st.pats.length].some(x => ['row', 'nearM', 'nearH', 'near', 'side', 'between', 'opp', 'ord', 'pos'].includes(x));
        if (wantPos && !real.some(c => ['row', 'near', 'side', 'between', 'opp', 'ord'].includes(c.t))) fall[st.id] = (fall[st.id] || 0) + 1;
      }
    });
  });
});
const targets = O.STAGES.filter(s => s.area !== 'all').flatMap(s => { const hs = O.houses(s.area); return s.who === 'a' ? hs.slice(0, 5) : s.who === 'b' ? hs.slice(5) : []; });
ok(new Set(targets.map(h => h.id)).size === 60, 'ステージ a・b で 60人 ぜんぶに あえる');

if (process.argv.includes('--hyo')) {
  O.AREAS.forEach(a => {
    console.log(`\n### ${a.n}（${a.id}）\n\n| ばんごう | じゅうにん | やね | かべ | ドア | まど | にわ | のりもの |\n|---|---|---|---|---|---|---|---|`);
    O.houses(a.id).forEach(h => console.log(`| ${h.i + 1} | ${h.who} | ${h.roof} | ${h.wall} | ${h.door} | ${h.window} | ${O.GARDEN[h.garden].n} | ${O.VEHICLE[h.vehicle].n} |`));
  });
} else {
  console.log(`もんだい ${total}こを つくって たしかめました。`);
  console.log(`「その 文が ないと きまらない」文の わりあい：${Math.round(needSum / clueSum * 100)}%`);
  console.log('ばしょの 文を 入れられなかった かず：' + (Object.keys(fall).length ? JSON.stringify(fall) : 'なし'));
  console.log('文の しゅるい：' + JSON.stringify(kinds));
  console.log('文の かず（ステージ ごと）：' + Object.keys(lens).map(k => k + ' ' + JSON.stringify(lens[k])).join(' / ').replace(/"/g, ''));
  // れい
  ['s1a', 's2a', 's3b', 's4b', 's5b', 's6c', 'h1', 'h2'].forEach(id => {
    const st = O.STAGES.find(s => s.id === id), aid = st.area === 'all' ? 'yama' : st.area, t = O.houses(aid)[st.who === 'b' ? 6 : 2];
    const q = O.makeQuestion(st, t, 0, rnd);
    console.log(`  ${st.no}（${t.who}さん）` + q.clues.map(c => O.text(aid, c).replace(/[【】]/g, '')).join(' '));
  });
  console.log(bad ? `\n${bad}こ まちがい` : '\nぜんぶ OK');
}
process.exit(bad ? 1 : 0);
