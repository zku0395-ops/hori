// ローマ字の しくみ（ガジガジせんせいの ローマじ こうぼう）
// ・ふだんは 教科書と おなじ 書き方（訓令式：si・ti・tu・hu・zi・sya）
// ・「べつの かきかた」（はってん）では shi・chi・tsu・fu・ji・sha など
// ・のばす おとは、ぼいんに「＾」を つけた ピース（â î û ê ô）
// ・アプリ（index.html）と 点検（tools/check.js）の りょうほうで つかいます
(function (root) {
  const VOWELS = ['a', 'i', 'u', 'e', 'o'];
  const LONG = { a: 'â', i: 'î', u: 'û', e: 'ê', o: 'ô' };
  const VOWEL_KANA = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' };
  const KANA_VOWEL = { 'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o' };

  // 清音の ひょう（ぎょう ＝ しいん、だん ＝ ぼいん）。「・」は もじが ない ところ
  const SEION = [
    ['', 'あいうえお'], ['k', 'かきくけこ'], ['s', 'さしすせそ'], ['t', 'たちつてと'], ['n', 'なにぬねの'],
    ['h', 'はひふへほ'], ['m', 'まみむめも'], ['y', 'や・ゆ・よ'], ['r', 'らりるれろ'], ['w', 'わ・・・を'],
  ];
  const DAKU = [['g', 'がぎぐげご'], ['z', 'ざじずぜぞ'], ['d', 'だぢづでど'], ['b', 'ばびぶべぼ'], ['p', 'ぱぴぷぺぽ']];
  const YOON_HEAD = 'きしちにひみりぎじびぴ';
  const SMALL = { 'ゃ': 'a', 'ゅ': 'u', 'ょ': 'o' };
  const BIG_OF_SMALL = { 'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ' };

  const ROMA = {};   // かな → ローマ字（教科書の 書き方）
  SEION.concat(DAKU).forEach(([c, s]) => [...s].forEach((k, i) => { if (k !== '・') ROMA[k] = c + VOWELS[i]; }));
  ROMA['ん'] = 'n';
  ROMA['を'] = 'wo';
  ROMA['ぢ'] = 'zi'; ROMA['づ'] = 'zu';
  [...YOON_HEAD].forEach(k => {
    const c = ROMA[k][0];
    Object.keys(SMALL).forEach(s => { ROMA[k + s] = c + 'y' + SMALL[s]; });
  });

  // べつの かきかた（ヘボン式など）
  const ALT = {
    'し': 'shi', 'ち': 'chi', 'つ': 'tsu', 'ふ': 'fu', 'じ': 'ji',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho', 'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho', 'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  };

  // ローマ字 → かな（まちがえて できた もじを 知らせる ため）
  const REV = {};
  Object.keys(ROMA).forEach(k => { if (k !== 'ぢ' && k !== 'づ' && !REV[ROMA[k]]) REV[ROMA[k]] = k; });
  Object.keys(ALT).forEach(k => { REV[ALT[k]] = k; });

  // 1つの まとまり（1もじ・ようおん・のばす おと）の ローマ字
  function unitRoma(u, alt) {
    if (alt && ALT[u]) return ALT[u];
    if (ROMA[u]) return ROMA[u];
    const last = u.slice(-1), head = u.slice(0, -1);
    if (head && KANA_VOWEL[last]) {
      const r = unitRoma(head, alt);
      if (r && LONG[r.slice(-1)]) return r.slice(0, -1) + LONG[r.slice(-1)];
    }
    return null;
  }

  // ことばを まとまりに わける。「|」で くぎって あれば その とおり（のばす おと）
  function splitWord(w) {
    if (w.includes('|')) return w.split('|').flatMap(x => x.split(/( )/).filter(Boolean));
    const out = [];
    [...w].forEach(ch => {
      if (SMALL[ch] && out.length) out[out.length - 1] += ch;
      else out.push(ch);
    });
    return out;
  }

  // ことば → [{ k: かな, r: ローマ字, space }]
  function wordUnits(w, alt) {
    const us = splitWord(w).map(k => k === ' ' ? { k, r: '', space: true } : { k, r: k === 'っ' ? '' : unitRoma(k, alt) });
    // ちいさい「っ」は、つぎの もじの はじめの ピースを もう1つ
    us.forEach((u, i) => {
      if (u.k !== 'っ') return;
      const nx = us.slice(i + 1).find(x => !x.space);
      u.r = nx && nx.r ? nx.r[0] : null;
    });
    return us;
  }

  const isVowel = (ch) => 'aiueoâîûêô'.includes(String(ch).toLowerCase());
  const pieces = (r) => [...String(r || '')];
  const kanaOf = (r) => REV[String(r || '').toLowerCase()] || null;
  const plainVowel = (ch) => { const x = String(ch).toLowerCase(); return Object.keys(LONG).find(v => LONG[v] === x) || x; };

  // ひょう（ヒント・ずかん・先生用）。cells は a i u e o の じゅん
  const table = (rows) => rows.map(([c, s]) => ({ c, cells: [...s].map(k => k === '・' ? null : k) }));
  const TABLES = {
    seion: table(SEION).concat([{ c: 'n', cells: ['ん', null, null, null, null] }]),
    daku: table(DAKU).map(r => ({ ...r, cells: r.cells.map(k => (k === 'ぢ' || k === 'づ') ? null : k) })),
    yoon: [...YOON_HEAD].map(h => ({ c: ROMA[h][0] + 'y', cells: [h + 'ゃ', null, h + 'ゅ', null, h + 'ょ'] })),
  };

  root.ROMAJI_KANA = {
    VOWELS, LONG, VOWEL_KANA, KANA_VOWEL, ROMA, ALT, REV, SMALL, BIG_OF_SMALL, TABLES,
    unitRoma, splitWord, wordUnits, isVowel, pieces, kanaOf, plainVowel,
  };
})(typeof window !== 'undefined' ? window : globalThis);
