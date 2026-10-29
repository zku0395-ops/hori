// ブンブンちょうろうの ことばの ぼうけん：ぶんの くみたての しくみ
// （アプリと、データの 点検 tools/check.js の りょうほうで つかいます）
//
// ・カードを「まとまり（ぶんせつ）」に わける：「ぼく は」「こうえん で」「おにごっこ を」「した。」
// ・正解に する ならびかた
//   ふつう：見本・べつの ならびかた ＋「どこで・どこへ・だれと・いつ」の まとまりを ほかの ばしょに うごかした もの
//           （「だれが」「なにを」の じゅんばんと、さいごの「どうした」は うごかさない）
//   ひろく：まとまりが あって いれば どの じゅんばんでも（さいごの「どうした」は さいご）
(function () {
  const JOSHI = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'の', 'から', 'まで', 'も', 'や'];
  const LINK = ['の']; // まとまりを つなぐ じょし（「くろい いぬ の なまえ は」）
  const MOVABLE = ['に', 'で', 'へ', 'と', 'から', 'まで'];

  // 'ぼく|は|あたらしい*a|くつ' → [{ t, g }]
  function parse(str, tagOf) {
    const parts = String(str).split('|');
    return parts.map((s, i) => {
      const m = s.match(/^(.*?)\*([a-z])$/);
      const t = m ? m[1] : s;
      let g = m ? m[2] : (tagOf && tagOf[t]) || '';
      if (!g) {
        if (LINK.includes(t)) g = 'l';
        else if (JOSHI.includes(t)) g = 'j';
        else if (i === parts.length - 1 || /[、。]$/.test(t)) g = 'v';
        else g = 'n';
      }
      return { t, g };
    });
  }

  // カードの ならびを ぶん（くぎり）と まとまりに わける
  function chunks(cards) {
    const clauses = [];
    let cur = [], ch = [];
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (c.g === 'c') {
        if (ch.length) { cur.push({ cards: ch, kind: 'v' }); ch = []; }
        if (cur.length) clauses.push(cur);
        clauses.push([{ cards: [c], kind: 'c' }]);
        cur = [];
        return;
      }
      ch.push(c);
      if (c.g === 'j') { cur.push({ cards: ch, kind: c.t }); ch = []; }
      else if (c.g === 'd' && ch.length === 1) { cur.push({ cards: ch, kind: 'd' }); ch = []; }
      else if (c.g === 't' && ch.length === 1 && !(next && (next.g === 'j' || next.g === 'l'))) { cur.push({ cards: ch, kind: 't' }); ch = []; }
      else if (c.g === 'v' && /[、。]$/.test(c.t)) { cur.push({ cards: ch, kind: 'v' }); ch = []; clauses.push(cur); cur = []; }
    });
    if (ch.length) cur.push({ cards: ch, kind: 'v' });
    if (cur.length) clauses.push(cur);
    return clauses;
  }
  const movable = (ch) => MOVABLE.includes(ch.kind) || ch.kind === 't';

  function perms(a) {
    if (a.length <= 1) return [a.slice()];
    const out = [];
    a.forEach((x, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(p => out.push([x].concat(p))));
    return out;
  }
  // 1つの ぶんの なかの ならびかた（まとまりの ならび）
  function clauseOrders(clause, free) {
    if (clause.length === 1) return [clause];
    const last = clause[clause.length - 1];
    const pred = last.kind === 'v' ? last : null;
    const rest = pred ? clause.slice(0, -1) : clause.slice();
    // ふつう：うごかせない まとまり（だれが・なにを など）は、もとの じゅんばんの まま
    //       「たくさん」「ゆっくり」などは うごかせるが、ぶんの はじめには こない
    const fixed = (ch) => !movable(ch) && ch.kind !== 'd';
    return perms(rest.map((_, i) => i))
      .filter(p => free || (p.filter(i => fixed(rest[i])).every((i, k, arr) => k === 0 || arr[k - 1] < i) && (p[0] === 0 || rest[p[0]].kind !== 'd')))
      .map(p => p.map(i => rest[i]).concat(pred ? [pred] : []));
  }

  // ぶんの データ → カード・正解の ならびかた
  function prepare(b) {
    const cards = parse(b.c);
    const tagOf = {};
    cards.forEach(c => { if (!(c.t in tagOf)) tagOf[c.t] = c.g; });
    const bases = [cards].concat((b.alt || []).map(s => parse(s, tagOf)));
    const make = (free) => {
      const seen = new Set(), out = [];
      bases.forEach(base => {
        let acc = [[]];
        chunks(base).forEach(cl => {
          const os = clauseOrders(cl, free).map(o => o.flatMap(ch => ch.cards.map(c => c.t)));
          const next = [];
          acc.forEach(a => os.forEach(o => next.push(a.concat(o))));
          acc = next;
        });
        acc.forEach(a => { const k = a.join('|'); if (!seen.has(k)) { seen.add(k); out.push(a); } });
      });
      return out;
    };
    return { cards, tagOf, okNormal: make(false), okFree: make(true), text: cards.map(c => c.t).join(' '), say: cards.map(c => c.t).join('') };
  }

  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const isOk = (placed, list) => list.some(o => same(placed, o));
  // いちばん にて いる 正解（あって いる ますが いちばん おおい もの）
  function closest(placed, list) {
    let best = list[0], bn = -1;
    list.forEach(o => { const n = o.filter((t, i) => placed[i] === t).length; if (n > bn) { bn = n; best = o; } });
    return best;
  }
  // まちがいの しゅるい（記録の ことば。あとから 変えないこと）
  const MT = { joshi: 'じょしの いち', owari: 'おわりの ことば', kuwashiku: 'くわしく する ことば', junban: 'ことばの じゅんばん', imi: 'ならびかた（いみは あう）' };
  function classify(placed, target, tagOf) {
    const types = [], joshi = [];
    placed.forEach((got, i) => {
      const need = target[i];
      if (got === need) return;
      const gN = tagOf[need], gG = tagOf[got];
      let t;
      if (gN === 'j' || gN === 'l' || gG === 'j' || gG === 'l') { t = MT.joshi; if (gN === 'j' || gN === 'l') joshi.push(need + '→' + (got || '')); }
      else if (gN === 'v' || gG === 'v') t = MT.owari;
      else if (['a', 'd'].includes(gN) || ['a', 'd'].includes(gG)) t = MT.kuwashiku;
      else t = MT.junban;
      if (!types.includes(t)) types.push(t);
    });
    return { types, joshi };
  }

  (typeof window !== 'undefined' ? window : globalThis).BUNBUN_KUMI = { JOSHI, MOVABLE, parse, chunks, prepare, isOk, closest, classify, MT };
})();
