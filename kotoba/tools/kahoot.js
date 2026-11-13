// 2年生の ことばから Kahoot! の 15問を 作る（JSON を 出す）
// つかいかた：node kotoba/tools/kahoot.js > kotoba/kahoot/kahoot_2nen.json → python3 kotoba/tools/kahoot_xlsx.py
require(require('path').join(__dirname, '..', 'data', 'kotoba.js'));
const D = globalThis.KOTOBA_DATA;
const WORD = {}; D.WORDS.forEach(w => { WORD[w.w] = w; });
function seeded(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
function shuffle(a, k) { const r = seeded(k); a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const bw = w => w.bw || w.w;
// 場所ごとに 2語（2-6 かぞえかた は のぞく）。さいごの 場所だけ 1語で 15語
const places = ['2-1', '2-2', '2-3', '2-4', '2-5', '2-7', '2-8', '2-6'];
const pick = [];
places.forEach((pid, i) => {
  const ws = D.WORDS.filter(w => w.p === pid);
  const n = pid === '2-6' ? 1 : 2;
  shuffle(ws, 'k' + pid).slice(0, n).forEach(w => pick.push(w));
});
// 型：A いみ→ことば 6、B ことば→いみ 4、C 文の（　） 5
const types = ['A', 'C', 'B', 'A', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'];
const order = shuffle(pick, 'order');
const out = order.map((w, i) => {
  const t = types[i];
  const mg = (w.mg || []).filter(m => WORD[m[0]]);
  // まちがいの こたえ 3つ：はんたい・にている おとを さきに
  const pri = mg.filter(m => m[1] === 'h' || m[1] === 'o'), rest = mg.filter(m => !(m[1] === 'h' || m[1] === 'o'));
  let wrong = pri.concat(rest).filter(m => !(t === 'C' && m[2] === 'x')).map(m => WORD[m[0]]);
  // たりない ときは 同じ 場所の ことばから
  D.WORDS.filter(x => x.p === w.p && x !== w && !wrong.includes(x) && !mg.some(m => m[0] === x.w && m[2] === 'x')).forEach(x => wrong.push(x));
  wrong = wrong.slice(0, 3);
  let q, right, opts;
  if (t === 'A') { q = `「${w.mean}」 この いみの ことばは どれ？`; right = w.w; opts = wrong.map(x => x.w); }
  if (t === 'B') { q = `「${w.w}」の いみは どれ？`; right = w.mean; opts = wrong.map(x => x.mean); }
  if (t === 'C') { q = `（　）に はいる ことばは どれ？　${w.bun}`; right = bw(w); opts = wrong.map(x => bw(x)); }
  const all = shuffle([right, ...opts], 'a' + w.id);
  return { no: i + 1, t, w: w.w, place: D.PLACES.find(p => p.id === w.p).name, q, answers: all, correct: all.indexOf(right) + 1 };
});
// 長さと 漢字の 点検
const KANJI = /[一-鿿々]/;
out.forEach(o => {
  if (o.q.length > 120) console.error('ながい もんだい', o.no, o.q.length);
  o.answers.forEach(a => { if (a.length > 75) console.error('ながい こたえ', o.no, a.length); });
  if (KANJI.test(o.q + o.answers.join(''))) console.error('かんじ', o.no);
  if (new Set(o.answers).size !== 4) console.error('おなじ こたえ', o.no);
});
console.log(JSON.stringify(out, null, 1));
