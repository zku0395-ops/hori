/*
 * ピコロボの タイピング パトロール：ローマ字の しくみ（タイピングアプリ typing/data/romaji.js と おなじ）
 *
 * ひらがな（カタカナ）の ことばを、1つの おと（ユニット）ずつに 分けて、
 * どの ローマ字で うっても 正解に します。
 *   ・画面に 出す 書き方は、教科書と 同じ 書き方（し＝si、ち＝ti、つ＝tu、ふ＝hu、じ＝zi、しゃ＝sya）
 *   ・shi・chi・tsu・fu・ji・sha・cha・ja なども 正解
 *   ・ん：画面は nn。つぎの おとが あいうえお・や行・な行 で なければ n 1つでも 正解
 *   ・っ：つぎの おとの はじめの キーを 2かい（xtu・ltu でも 正解）
 *   ・ー：- の キー、、：, の キー、。：. の キー
 *   ・ことばの あいだの すきま（分かち書き）は うたなくて よい
 */
(function () {
  const B = {
    あ: ['a'], い: ['i', 'yi'], う: ['u', 'wu', 'whu'], え: ['e'], お: ['o'],
    か: ['ka', 'ca'], き: ['ki'], く: ['ku', 'cu', 'qu'], け: ['ke'], こ: ['ko', 'co'],
    さ: ['sa'], し: ['si', 'shi', 'ci'], す: ['su'], せ: ['se', 'ce'], そ: ['so'],
    た: ['ta'], ち: ['ti', 'chi'], つ: ['tu', 'tsu'], て: ['te'], と: ['to'],
    な: ['na'], に: ['ni'], ぬ: ['nu'], ね: ['ne'], の: ['no'],
    は: ['ha'], ひ: ['hi'], ふ: ['hu', 'fu'], へ: ['he'], ほ: ['ho'],
    ま: ['ma'], み: ['mi'], む: ['mu'], め: ['me'], も: ['mo'],
    や: ['ya'], ゆ: ['yu'], よ: ['yo'],
    ら: ['ra'], り: ['ri'], る: ['ru'], れ: ['re'], ろ: ['ro'],
    わ: ['wa'], を: ['wo'], ん: ['nn', 'xn'],
    が: ['ga'], ぎ: ['gi'], ぐ: ['gu'], げ: ['ge'], ご: ['go'],
    ざ: ['za'], じ: ['zi', 'ji'], ず: ['zu'], ぜ: ['ze'], ぞ: ['zo'],
    だ: ['da'], ぢ: ['di'], づ: ['du'], で: ['de'], ど: ['do'],
    ば: ['ba'], び: ['bi'], ぶ: ['bu'], べ: ['be'], ぼ: ['bo'],
    ぱ: ['pa'], ぴ: ['pi'], ぷ: ['pu'], ぺ: ['pe'], ぽ: ['po'],
    ぁ: ['xa', 'la'], ぃ: ['xi', 'li'], ぅ: ['xu', 'lu'], ぇ: ['xe', 'le'], ぉ: ['xo', 'lo'],
    ゃ: ['xya', 'lya'], ゅ: ['xyu', 'lyu'], ょ: ['xyo', 'lyo'], ゎ: ['xwa', 'lwa'],
    っ: ['xtu', 'ltu', 'xtsu', 'ltsu'],
    ゔ: ['vu'],
    'ー': ['-'], '、': [','], '。': ['.'], '，': [','], '．': ['.'],
  };
  // ちいさい ゃゅょ などが つく おと
  const Y = {};
  [['き', 'k'], ['に', 'n'], ['ひ', 'h'], ['み', 'm'], ['り', 'r'], ['ぎ', 'g'], ['び', 'b'], ['ぴ', 'p'], ['ぢ', 'dy']].forEach(([c, s]) => {
    const y = s.length > 1 ? s : s + 'y';
    Y[c + 'ゃ'] = [y + 'a']; Y[c + 'ゅ'] = [y + 'u']; Y[c + 'ょ'] = [y + 'o']; Y[c + 'ぇ'] = [y + 'e'];
  });
  Object.assign(Y, {
    しゃ: ['sya', 'sha'], しゅ: ['syu', 'shu'], しょ: ['syo', 'sho'], しぇ: ['sye', 'she'],
    ちゃ: ['tya', 'cha', 'cya'], ちゅ: ['tyu', 'chu', 'cyu'], ちょ: ['tyo', 'cho', 'cyo'], ちぇ: ['tye', 'che', 'cye'],
    じゃ: ['zya', 'ja', 'jya'], じゅ: ['zyu', 'ju', 'jyu'], じょ: ['zyo', 'jo', 'jyo'], じぇ: ['zye', 'je', 'jye'],
    ふぁ: ['fa'], ふぃ: ['fi'], ふぇ: ['fe'], ふぉ: ['fo'],
    てぃ: ['thi'], でぃ: ['dhi'], でゅ: ['dhu'], とぅ: ['twu'], どぅ: ['dwu'],
    うぃ: ['wi'], うぇ: ['we'], うぉ: ['who'],
    ゔぁ: ['va'], ゔぃ: ['vi'], ゔぇ: ['ve'], ゔぉ: ['vo'],
    つぁ: ['tsa'], くぁ: ['kwa', 'qa'],
  });
  const SMALL = 'ぁぃぅぇぉゃゅょゎ';
  const VOWELS = 'aiueo';

  // カタカナ → ひらがな（ー は そのまま）
  const toHira = (s) => String(s).replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/ヴ/g, 'ゔ');

  // ことばを おとの ならびに 分ける。すきまは { sp: true }
  function units(text) {
    const s = toHira(text);
    const out = [];
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === ' ' || c === '　') { out.push({ sp: true, k: ' ', show: s[i] === text[i] ? c : text[i] }); continue; }
      const two = s.slice(i, i + 2);
      if (two.length === 2 && SMALL.includes(two[1]) && (Y[two] || B[two[0]])) {
        const opts = (Y[two] || []).slice();
        // き＋ゃ（ki xya）のように 分けて うっても よい
        if (B[two[0]] && B[two[1]]) B[two[0]].forEach(a => B[two[1]].forEach(b => opts.push(a + b)));
        out.push({ k: two, show: text.slice(i, i + 2), opts: uniq(opts) });
        i++;
        continue;
      }
      if (!B[c]) throw new Error('ローマ字に できない もじ：「' + c + '」（' + text + '）');
      out.push({ k: c, show: text[i], opts: B[c].slice() });
    }
    // っ と ん は、つぎの おとで きまる
    const nextOf = (i) => { for (let j = i + 1; j < out.length; j++) if (!out[j].sp) return out[j]; return null; };
    out.forEach((u, i) => {
      if (u.sp) return;
      const nx = nextOf(i);
      if (u.k === 'っ' && nx) {
        const cs = uniq(nx.opts.map(o => o[0]).filter(ch => /[a-z]/.test(ch) && !VOWELS.includes(ch) && ch !== 'n'));
        if (cs.length) u.opts = cs.concat(u.opts);
      }
      // ん：つぎが あいうえお・や行・な行 で なければ n 1つでも よい
      if (u.k === 'ん' && nx && nx.opts.every(o => /^[a-z]/.test(o) && !'aiueoyn'.includes(o[0]))) u.single = true;
    });
    return out;
  }
  function uniq(a) { return a.filter((x, i) => a.indexOf(x) === i); }

  // 1つの もんだいを うつ しくみ
  function Typer(text) {
    this.text = text;
    this.u = units(text);
    this.i = 0;           // いまの おと
    this.buf = '';        // いまの おとで うった キー
    this.chosen = [];     // おとごとに うった ローマ字
    this.skip();
  }
  Typer.prototype.skip = function () { while (this.i < this.u.length && this.u[this.i].sp) { this.chosen[this.i] = ''; this.i++; } };
  Typer.prototype.done = function () { return this.i >= this.u.length; };
  Typer.prototype.cands = function (i) {
    const u = this.u[i];
    const c = u.opts.slice();
    if (u.single) c.push('n');
    return c;
  };
  // いま おすと よい キー（画面で 光らせる キー）
  Typer.prototype.next = function () {
    if (this.done()) return null;
    const c = this.cands(this.i).find(o => o.startsWith(this.buf) && o.length > this.buf.length);
    return c ? c[this.buf.length] : null;
  };
  // いまの おとの、画面に 出す ローマ字（うちかけの ときは その 書き方）
  Typer.prototype.shown = function (i) {
    if (i < this.i) return this.chosen[i] || '';
    const u = this.u[i];
    if (u.sp) return '';
    if (i === this.i) return this.cands(i).find(o => o.startsWith(this.buf)) || u.opts[0];
    return u.opts[0];
  };
  Typer.prototype.finishUnit = function () {
    this.chosen[this.i] = this.buf;
    this.i++; this.buf = '';
    this.skip();
  };
  // キーを おす。{ ok, done, unit（おわった おとの 番号） }
  Typer.prototype.press = function (key) {
    if (this.done()) return { ok: false, done: true };
    key = String(key).toLowerCase();
    const c = this.cands(this.i);
    const nb = this.buf + key;
    const m = c.filter(o => o.startsWith(nb));
    if (m.length) {
      this.buf = nb;
      const at = this.i;
      // ほかに つづく 書き方が なければ、この おとは おわり（ん の n は つぎの キーまで まつ）
      if (m.includes(nb) && m.every(o => o === nb)) { this.finishUnit(); return { ok: true, unit: at, done: this.done() }; }
      return { ok: true, done: false };
    }
    // ん を n 1つで うって、つぎの おとへ すすむ
    if (this.buf && c.includes(this.buf) && !'aiueoyn'.includes(key)) {
      const save = { i: this.i, buf: this.buf, chosen: this.chosen.slice() };
      const at = this.i;
      this.finishUnit();
      const r = this.press(key);
      if (r.ok) return { ok: true, unit: at, done: this.done() };
      Object.assign(this, save);
      return { ok: false, done: false };
    }
    return { ok: false, done: false };
  };
  // ぜんぶで うつ キーの 数（画面の 書き方で）
  Typer.prototype.total = function () { let n = 0; for (let i = 0; i < this.u.length; i++) n += this.shown(i).length; return n; };
  // いまの おと
  Typer.prototype.cur = function () { return this.done() ? null : this.u[this.i]; };

  const ROMAJI = { units, Typer, toHira, B, Y };
  if (typeof window !== 'undefined') window.PICO_ROMAJI = ROMAJI;
  if (typeof module !== 'undefined') module.exports = ROMAJI;
})();
