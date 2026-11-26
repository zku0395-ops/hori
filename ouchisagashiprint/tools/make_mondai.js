/*
 * プリントの もんだい（30まい・60もん）を 作って、data/print.js に 書きます。
 *   node ouchisagashiprint/tools/make_mondai.js
 * ・家と 文は、アプリ（ouchisagashi/data/data.js）と 同じ ものを つかいます。
 * ・見ための 文の もんだい：その 場所の 10けんから、6けんを えらんで ならべます。
 * ・場所の ことばの もんだい：6けんと めじるし 1つで、小さな 町（道 2本）を 作ります。
 * ・たねの 数（SEED）が 同じなら、いつも 同じ もんだいに なります。
 */
const fs = require('fs');
const path = require('path');
const D = require('../../ouchisagashi/data/data.js');
const SEED = 20261126;
function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = rng(SEED);
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// [アプリの ステージ, まい数, プリントの だい]
const SHEETS = [
  ['s1a', 1, 'やね・ドア・まど'], ['s1b', 1, 'かべ・にわ・のりもの'], ['s1c', 1, '1つの ぶん'],
  ['s2a', 2, '2つの ぶん'], ['s2b', 1, '2つの ぶん'], ['s2c', 2, '2つの ぶん'],
  ['s3a', 2, '3つの ぶん'], ['s3b', 1, '3つの ぶん'], ['s3c', 2, '3つの ぶん'],
  ['s4a', 2, 'みち と となり'], ['s4b', 2, 'となり と むかい'], ['s4c', 2, 'ばしょの ことば'],
  ['s5a', 2, 'みぎ・ひだり・なんけんめ'], ['s5b', 2, 'あいだ'], ['s5c', 2, 'ばしょ と みため'],
  ['s6a', 2, 'まとめ'], ['s6b', 1, 'まとめ'], ['s6c', 2, 'めいたんていの しけん'],
];
const PLACE = ['near', 'side', 'between', 'opp', 'ord'];
const isPos = t => t === 'row' || PLACE.indexOf(t) >= 0;
function tokenOk(tk, c) {
  switch (tk) {
    case 'look': return D.LOOK.indexOf(c.t) >= 0;
    case 'nearM': return c.t === 'near' && !!c.ref.m;
    case 'nearH': return c.t === 'near' && !c.ref.m;
    case 'pos': return PLACE.indexOf(c.t) >= 0;
    default: return c.t === tk;
  }
}
// 文の しゅるいが、ねらった くみあわせ（pat）と 合って いるか
function patOk(pat, clues) {
  if (pat.length !== clues.length) return false;
  const used = clues.map(() => false);
  const go = i => { if (i === pat.length) return true; for (let j = 0; j < clues.length; j++) if (!used[j] && tokenOk(pat[i], clues[j])) { used[j] = true; if (go(i + 1)) return true; used[j] = false; } return false; };
  return go(0);
}
const plain = s => s.replace(/[【】]/g, '');

// 小さな 町：道 2本。あおい みちは おくがわ と てまえがわ、きいろい みちは おくがわ だけ（よこ 4ます）
const COLS = 4;
const LINES = [[0, 'u'], [0, 'd'], [1, 'u']];
let townNo = 0;
function makeTown(areaId) {
  const ar = D.area(areaId), all = D.houses(areaId);
  const pickH = shuffle(all).slice(0, 6);
  for (let t = 0; t < 200; t++) {
    // どの だんも、すきまを あけずに ならべる（「となり」「なんけんめ」を とりちがえないように）
    const cnt = [2 + Math.floor(rnd() * 3), 1 + Math.floor(rnd() * 4), 1 + Math.floor(rnd() * 4)];
    if (cnt[0] + cnt[1] + cnt[2] !== 7) continue;
    const occ = [];
    cnt.forEach((n, li) => { const off = Math.floor(rnd() * (COLS - n + 1)); for (let c = 0; c < n; c++) occ.push(li * COLS + off + c); });
    const mIdx = Math.floor(rnd() * 7), mLine = Math.floor(occ[mIdx] / COLS);
    if (cnt[mLine] - 1 < (mLine === 0 ? 2 : 1)) continue;
    const cells = occ.filter((x, i) => i !== mIdx).concat([occ[mIdx]]);
    const mark = rnd() < 0.5 ? 0 : 1;
    const layout = [{ u: [null, null, null, null, null], d: [null, null, null, null, null] }, { u: [null, null, null, null, null] }];
    // ばんごうは、上の だんから、左から じゅんに つける
    const order = cells.slice(0, 6).sort((a, b) => a - b);
    order.forEach((ci, k) => { const ln = LINES[Math.floor(ci / COLS)]; layout[ln[0]][ln[1]][ci % COLS] = k; });
    const mi = cells[6], ml = LINES[Math.floor(mi / COLS)]; layout[ml[0]][ml[1]][mi % COLS] = 'A';
    const hs = shuffle(pickH);
    const id = 'p' + (++townNo);
    D.AREAS.push({ id: id, n: ar.n, marks: [ar.marks[mark], ar.marks[1 - mark]], layout: layout, animals: hs.map(h => [h.who, h.face]) });
    D.HOUSES[id] = hs.map(h => [h.roof, h.wall, h.garden, h.vehicle, h.door, h.window]);
    return { id: id, src: hs.map(h => h.id), layout: layout, mark: ar.marks[mark] };
  }
  return null;
}

const out = [];
const usedTarget = {};
const usedN = t => usedTarget[t] || 0;
let qno = 0, lastAns = [];
SHEETS.forEach(([sid, n, title]) => {
  const st = D.STAGES.find(s => s.id === sid);
  for (let k = 0; k < n; k++) {
    const sheet = { stage: st.no, title: title, qs: [] };
    for (let j = 0; j < 2; j++) {
      const qi = (st.pats.length > 1 ? (k * 2 + j) : 0) % st.pats.length;
      const pat = st.pats[(k * 2 + j) % st.pats.length];
      const town = pat.some(tk => tk !== 'look' && D.LOOK.indexOf(tk) < 0);
      let best = null;
      for (let t = 0; t < 400; t++) {
        let q, src, tw = null;
        if (town) {
          tw = makeTown(st.area); if (!tw) continue;
          const hs = D.houses(tw.id), target = hs[Math.floor(rnd() * hs.length)];
          q = D.makeQuestion({ n: 6, pats: [pat] }, target, 0, rnd);
          src = tw.src;
        } else {
          const all = D.houses(st.area), target = all[Math.floor(rnd() * all.length)];
          q = D.makeQuestion({ n: 6, pats: [pat] }, target, 0, rnd);
        }
        if (!q || !patOk(pat, q.clues)) continue;
        const tid = town ? src[q.target.i] : q.target.id;
        // 同じ ステージの 中で、こたえの 家が かぶらない ものを えらぶ
        const ansNo = town ? q.target.i + 1 : q.shown.indexOf(q.target) + 1;
        // こたえの 家と、こたえの ばんごうが かぶらない ものを えらぶ
        // 「あおい ドアの いえの となり」と「ドアの いろは、あお」のように、同じ ことばが 2回 出る 文は さける
        const refs = []; q.clues.forEach(c => { (c.refs || (c.ref ? [c.ref] : [])).forEach(r => { if (r.a) refs.push(r.a + r.v); }); });
        const echo = q.clues.some(c => D.LOOK.indexOf(c.t) >= 0 && refs.indexOf(c.t + c.v) >= 0);
        const score = (echo ? -200 : 0) + q.need * 20 - usedN(tid) * 12 - (sheet.qs.some(x => x.target === tid) ? 50 : 0) - (sheet.qs.some(x => x.ans === ansNo) ? 30 : 0) - (lastAns.indexOf(ansNo) >= 0 ? 6 : 0) + rnd();
        if (!best || score > best.score) best = { score: score, q: q, tw: tw, src: src, tid: tid };
      }
      if (!best) throw new Error('作れません：' + sid + ' ' + pat.join('+'));
      const q = best.q, tw = best.tw;
      usedTarget[best.tid] = usedN(best.tid) + 1;
      const areaId = q.target.area;
      const item = {
        no: ++qno, target: best.tid, who: q.target.who,
        lines: q.clues.map(c => plain(D.text(areaId, c))), kinds: q.clues.map(c => D.kind(c)), clues: q.clues,
      };
      if (tw) {
        // houses：ばんごうの じゅん。town.rows：[おくがわ, てまえがわ, おくがわ] の ますに、家の ばんごう（1〜6）か 'M'（めじるし）か 0
        item.houses = tw.src;
        item.town = {
          mark: { id: tw.mark.id, n: tw.mark.n },
          rows: LINES.map(ln => tw.layout[ln[0]][ln[1]].slice(0, COLS).map(x => x === 'A' ? 'M' : typeof x === 'number' ? x + 1 : 0)),
        };
        item.ans = q.target.i + 1;
      } else {
        item.houses = q.shown.map(h => h.id);
        item.ans = q.shown.indexOf(q.target) + 1;
      }
      sheet.qs.push(item);
      lastAns = [item.ans].concat(lastAns).slice(0, 2);
    }
    out.push(sheet);
  }
});
out.forEach((s, i) => { s.no = i + 1; });
const roads = D.ROADS.slice(0, 2);
const js = '// ホーせんぱいの おうちさがし プリント：もんだい（tools/make_mondai.js が 作ります。手で 直さない）\nvar OUCHI_PRINT = ' +
  JSON.stringify({ seed: SEED, roads: roads, sheets: out }, null, 1) + ';\nif (typeof module !== \'undefined\') module.exports = OUCHI_PRINT;\n';
fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'data', 'print.js'), js);
console.log(out.length + 'まい、' + qno + 'もん を 書きました。');
