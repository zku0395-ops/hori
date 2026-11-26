/*
 * プリントの もんだい（data/print.js）を 点検します。
 *   node ouchisagashiprint/tools/check.js
 * ・文に ぜんぶ 合う 家が、ならべた 6けんの 中で 1けんだけか（アプリの しくみとは べつに、ここで 数え直します）
 * ・「なんけんめ」は、めじるしを 数えて しまった ときも 1けんに 決まるか
 * ・文が アプリと 同じ 言い方か、絵の ファイルが あるか、町に すきまが ないか
 */
const fs = require('fs');
const path = require('path');
const D = require('../../ouchisagashi/data/data.js');
const P = require('../data/print.js');
const IMG = path.join(__dirname, '..', 'img');
let ng = 0, n = 0;
const bad = (q, m) => { ng++; console.log('✕ もんだい ' + q.no + '：' + m); };
const has = f => fs.existsSync(path.join(IMG, f));
const kinds = {}, ansCount = {};

P.sheets.forEach(s => {
  if (s.qs.length !== 2) { ng++; console.log('✕ ' + s.no + ' まいめ：もんだいが 2つ では ありません'); }
  s.qs.forEach(q => {
    n++;
    const hs = q.houses.map(id => D.house(id));
    if (hs.length !== 6 || new Set(q.houses).size !== 6) bad(q, '家が 6けん では ありません');
    q.houses.forEach(id => { if (!has('h_' + id + '.jpg')) bad(q, '絵が ありません h_' + id); });
    if (!has('r_' + q.target + '.jpg')) bad(q, '絵が ありません r_' + q.target);
    if (q.houses[q.ans - 1] !== q.target) bad(q, 'こたえの ばんごうが 合いません');
    q.kinds.forEach(k => { kinds[k] = (kinds[k] || 0) + 1; });
    ansCount[q.ans] = (ansCount[q.ans] || 0) + 1;

    // 町の 中での 場所（ばんごう → だん・ます）
    const pos = {}; let mark = null;
    if (q.town) {
      if (!has('m_' + q.town.mark.id + '.jpg')) bad(q, '絵が ありません m_' + q.town.mark.id);
      q.town.rows.forEach((r, li) => {
        const occ = r.map((x, c) => x ? c : -1).filter(c => c >= 0);
        if (occ.length && occ[occ.length - 1] - occ[0] + 1 !== occ.length) bad(q, '町に すきまが あります');
        r.forEach((x, c) => { if (x === 'M') mark = { li: li, c: c }; else if (x) pos[x] = { li: li, c: c }; });
      });
      if (Object.keys(pos).length !== 6 || !mark) bad(q, '町の 家や めじるしの 数が 合いません');
    }
    const at = (li, c) => { const x = q.town.rows[li] && q.town.rows[li][c]; return x || 0; };
    const refOk = (x, ref) => { if (!x) return false; if (ref.m) return x === 'M' && ref.m === q.town.mark.id; return x !== 'M' && hs[x - 1][ref.a] === ref.v; };
    // loose：めじるしも 数えて しまった とき
    const match = (k, c, loose) => {
      const h = hs[k - 1];
      if (D.LOOK.indexOf(c.t) >= 0) return h[c.t] === c.v;
      const p = pos[k], L = at(p.li, p.c - 1), R = at(p.li, p.c + 1);
      switch (c.t) {
        case 'row': return (p.li === 2 ? 1 : 0) === c.v;
        case 'near': return refOk(L, c.ref) || refOk(R, c.ref);
        case 'side': return refOk(c.dir === 'R' ? L : R, c.ref);
        case 'between': return (refOk(L, c.refs[0]) && refOk(R, c.refs[1])) || (refOk(L, c.refs[1]) && refOk(R, c.refs[0]));
        case 'opp': return p.li === 2 ? false : refOk(at(p.li === 0 ? 1 : 0, p.c), c.ref);
        case 'ord': {
          const line = q.town.rows[p.li]; let cnt = 1, cntAll = 1;
          const step = c.dir === 'L' ? -1 : 1;
          for (let x = p.c + step; x >= 0 && x < line.length && line[x]; x += step) { cntAll++; if (line[x] !== 'M') cnt++; }
          return cnt === c.k || (loose && cntAll === c.k);
        }
      }
      throw new Error('しらない 文 ' + c.t);
    };
    if (!q.town && q.clues.some(c => D.LOOK.indexOf(c.t) < 0)) bad(q, '町が ないのに、場所の 文が あります');
    [false, true].forEach(loose => {
      const ok = [1, 2, 3, 4, 5, 6].filter(k => q.clues.every(c => match(k, c, loose)));
      if (ok.length !== 1 || ok[0] !== q.ans) bad(q, (loose ? '（めじるしも 数えた とき）' : '') + '合う 家：' + ok.join('・') + '　こたえ：' + q.ans);
    });
    // どの 文も いる（その 文が なくても 決まる 文は ないか）※ 知らせる だけ
    q.clues.forEach((c, i) => {
      const rest = q.clues.filter((x, j) => j !== i);
      const ok = [1, 2, 3, 4, 5, 6].filter(k => rest.every(x => match(k, x, false)));
      if (ok.length === 1) q._free = (q._free || 0) + 1;
    });
    // 文が アプリと 同じ 言い方か（町の めじるしの 名前は、もとの 場所の ものを つかう）
    const areaId = q.target.split('-')[0];
    q.clues.forEach((c, i) => { if (D.text(areaId, c).replace(/[【】]/g, '') !== q.lines[i]) bad(q, '文が ちがいます：' + q.lines[i]); });
    if (/[一-龠]/.test(q.lines.join('') + q.who)) bad(q, '漢字が 入って います');
  });
});
const free = []; P.sheets.forEach(s => s.qs.forEach(q => { if (q._free) free.push(q.no); }));
console.log('もんだい ' + n + 'もん（' + P.sheets.length + 'まい）');
console.log('文の しゅるい：' + Object.keys(kinds).map(k => k + ' ' + kinds[k]).join('、'));
console.log('こたえの ばんごう：' + [1, 2, 3, 4, 5, 6].map(k => k + '→' + (ansCount[k] || 0)).join('　'));
console.log('読まなくても 決まる 文が ある もんだい：' + (free.length ? free.join('・') : 'なし'));
console.log(ng ? '✕ ' + ng + 'こ 見つかりました' : 'ぜんぶ OK');
process.exit(ng ? 1 : 0);
