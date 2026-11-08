/*
 * ワケルンの ぶんすう うちゅう パトロール：ステージ・かたち・ごほうびの データ
 *
 * STAGES（ステージ）
 *   kind: 'intro' … であう（おちて こない がめんで、1/2・1/4・1/8・1/3 を 1つずつ みる）
 *         'choose' … えらんで みよう（おちて こない がめんで、2つ〈2かいめは 3つ〉の なかから えらぶ。1かい 8もん）
 *         'hunt'  … さがせ（うえから おちて くる かたちの なかから、さがす ぶんすうを タッチ）
 *   rounds：クリアに ひつような かいすう（hunt は 3かい。1かいは「みつけた かず」が 先生の 設定の かず〈はじめは 10こ〉）
 *   targets：さがす ぶんすうの ぶんぼ。かい ごとに ちがう ときは roundTargets（[[2],[4],[8,3]] など）
 *   others：まちがいの かたち（ほかの ぶんすう）の ぶんぼ
 *   unequal：ひとしく わけて いない かたちも まぜる
 *   two：2つぶん ひかって いる かたちも まぜる（はってん）
 *   diag：ななめに わけた かたち（さんかくに なる わけかた）も まぜる（はってん）
 *   change：1かいの とちゅうで「〇 を さがせ」が かわる（まとめ）
 *   no：ステージの ばんごう（がめんに だす）
 *   hatten: true の ステージは、はじめは とじて います（先生用画面で ひらきます）。
 *
 * SHAPES：おちて くる かたち 6しゅるい（round：まるい かたち、square：しかくい かたち）
 *   かたちは index.html の SVG で かきます（わける せんと ひかる ばしょを 正しく するため）。
 *
 * ITEM_CATS（おみせ）：6しゅるい × 12こ。ねだんは 4だんかい（ふつう・ごうか・でんせつ・ちょうでんせつ）。
 *   はじめから もって いる もの（DEFAULT_EQUIP）は 12こに はいって いません。
 * LEVELS：みつけた かずで あがる レベル。
 * IMAGES：ChatGPT で つくった 絵が ある ファイル（img/ に おいたら ここに たす。ここに ある ものだけ よみこみます）。
 */
(function () {
  const STAGES = [
    { id: 's0', no: '0-1', name: 'であう', sub: '1/2・1/4・1/8・1/3 と であう', kind: 'intro', rounds: 1, icon: '👀',
      intro: 'ぶんすうと であおう。おなじ おおきさに わけた 1つぶんを みて みよう。' },
    { id: 's0e', no: '0-2', name: 'えらんで みよう', sub: 'おちて こない がめんで えらぶ', kind: 'choose', rounds: 2, icon: '👆',
      targets: [2, 4, 8, 3], others: [2, 3, 4, 8],
      intro: 'ゆっくり えらんで みよう。いくつに わけて あるか かぞえてね。' },
    { id: 's1', no: '1', name: '1/2 を さがせ', sub: '2つに わけた 1つぶん', kind: 'hunt', rounds: 3, icon: '🍕',
      targets: [2], others: [4, 8],
      intro: '1/2 を さがそう。2つに おなじ おおきさに わけた 1つぶんが ひかって いる ものを タッチしてね。' },
    { id: 's2', no: '2', name: '1/4 を さがせ', sub: '4つに わけた 1つぶん', kind: 'hunt', rounds: 3, icon: '🥪',
      targets: [4], others: [2, 8],
      intro: '1/4 を さがそう。4つに おなじ おおきさに わけた 1つぶんが ひかって いる ものを タッチしてね。' },
    { id: 's3', no: '3', name: '1/8 を さがせ', sub: '8つに わけた 1つぶん', kind: 'hunt', rounds: 3, icon: '🛸',
      targets: [8], others: [2, 4],
      intro: '1/8 を さがそう。8つに おなじ おおきさに わけた 1つぶんが ひかって いる ものを タッチしてね。' },
    { id: 's4', no: '4', name: '1/3 を さがせ', sub: '3つに わけた 1つぶん', kind: 'hunt', rounds: 3, icon: '🟦',
      targets: [3], others: [2, 4, 8],
      intro: '1/3 を さがそう。3つに おなじ おおきさに わけた 1つぶんが ひかって いる ものを タッチしてね。1/4 と まちがえないように、いくつに わけて あるか かぞえよう。' },
    { id: 's5', no: '5', name: 'まぜて さがせ', sub: 'ほかの ぶんすうと ひとしくない かたちも まざる', kind: 'hunt', rounds: 3, icon: '🔀',
      roundTargets: [[2], [4], [8, 3]], others: [2, 3, 4, 8], unequal: true,
      intro: 'いろいろな かたちが まざって おちて くるよ。おなじ おおきさに わけて ある かも よく みてね。' },
    { id: 's6', no: '6', name: 'まとめ パトロール', sub: 'とちゅうで さがす ぶんすうが かわる', kind: 'hunt', rounds: 3, icon: '🏆',
      targets: [2, 4, 8, 3], others: [2, 3, 4, 8], unequal: true, change: true,
      intro: 'まとめの パトロールだよ。さがす ぶんすうが とちゅうで かわるから、うえの もじを よく みてね。' },
    { id: 'h1', name: 'ななめに わけた かたち', sub: 'さんかくに わけた しかくも まざる', kind: 'hunt', rounds: 3, icon: '🔺', hatten: true,
      roundTargets: [[2], [4], [8]], others: [2, 3, 4, 8], unequal: true, diag: true,
      intro: 'しかくを ななめに わけた かたちも おちて くるよ。さんかくに なって いても、おなじ おおきさなら なかまだよ。' },
    { id: 'h2', name: '2つぶん ひかる かたち', sub: '2つ ひかって いる ものは ちがうよ', kind: 'hunt', rounds: 3, icon: '✌️', hatten: true,
      targets: [2, 4, 8, 3], others: [2, 3, 4, 8], unequal: true, two: true, change: true,
      intro: '2つぶん ひかって いる かたちも まざって いるよ。ひかって いるのが 1つだけの ものを さがそう。' },
  ];

  // おちて くる かたち
  const SHAPES = [
    { id: 'pizza', n: 'ピザ', round: true },
    { id: 'circle', n: 'まる', round: true },
    { id: 'ufoR', n: 'まるい ユーフォー', round: true },
    { id: 'square', n: 'しかく', round: false },
    { id: 'sand', n: 'サンドイッチ', round: false },
    { id: 'ufoS', n: 'しかくい ユーフォー', round: false },
  ];

  // ぶんすうの よみかた
  const DEN_YOMI = { 2: 'に', 3: 'さん', 4: 'よん', 8: 'はち' };
  const NUM_YOMI = { 1: 'いち', 2: 'に' };

  const TIERS = [
    { id: 0, n: 'ふつう', color: '#64748b', bg: '#f1f5f9' },
    { id: 1, n: 'ごうか', color: '#d97706', bg: '#fef3c7' },
    { id: 2, n: 'でんせつ', color: '#9333ea', bg: '#f3e8ff' },
    { id: 3, n: 'ちょうでんせつ', color: '#db2777', bg: '#fce7f3' },
  ];
  // 12この ねだん：ふつう 5こ・ごうか 4こ・でんせつ 2こ・ちょうでんせつ 1こ
  const PRICES = [5, 8, 10, 12, 15, 25, 30, 40, 50, 80, 100, 200];
  const tierOf = (i) => (i < 5 ? 0 : i < 9 ? 1 : i < 11 ? 2 : 3);
  // x：[絵文字, なまえ, あたい（いろ など）]
  const cat = (id, name, icon, color, title, slot, list) => ({ id, name, icon, color, title, slot,
    items: list.map((x, i) => ({ id: id + (i + 1), e: x[0], n: x[1], v: x[2] || '', slot, tier: tierOf(i), p: PRICES[i] })) });

  const ITEM_CATS = [
    // はいけい：v は いろの くみあわせ（絵が とどいたら img/bg_<id>.webp）
    cat('bg', 'はいけい', '🖼️', '#0ea5e9', 'はいけい コレクター', 'bg', [
      ['🌙', 'つきの うら', 'moon'], ['🌅', 'ゆうやけ ぼし', 'sunset'], ['🌊', 'うみの ほし', 'sea'], ['🌳', 'もりの ほし', 'forest'],
      ['❄️', 'こおりの ほし', 'ice'], ['🍭', 'おかしの ほし', 'candy'], ['🌋', 'かざんの ほし', 'volcano'], ['🌌', 'ぎんが', 'galaxy'],
      ['🌈', 'にじの ほし', 'rainbow'], ['💎', 'ほうせきの ほし', 'gem'], ['🏯', 'うちゅう じょう', 'castle'], ['👑', 'でんせつの うちゅう', 'legend']]),
    // からだ：v は からだの いろ
    cat('body', 'からだ', '🎨', '#ec4899', 'おしゃれ ロボ', 'body', [
      ['🩵', 'みずいろ', '#7dd3fc'], ['💚', 'みどり', '#86efac'], ['💛', 'きいろ', '#fde047'], ['🧡', 'オレンジ', '#fdba74'],
      ['🩷', 'ピンク', '#f9a8d4'], ['💜', 'むらさき', '#c4b5fd'], ['❤️', 'あか', '#fca5a5'], ['🖤', 'くろ', '#475569'],
      ['🥈', 'ぎんいろ', 'silver'], ['🥇', 'きんいろ', 'gold'], ['💠', 'クリスタル', 'crystal'], ['🌈', 'にじいろ', 'rainbow']]),
    cat('hat', 'ぼうし', '🎩', '#dc2626', 'ぼうし コレクター', 'hat', [
      ['🧢', 'キャップ'], ['👒', 'むぎわらぼうし'], ['🎓', 'はかせの ぼうし'], ['⛑️', 'ヘルメット'],
      ['🎩', 'シルクハット'], ['🪖', 'たんけんの ぼうし'], ['🎃', 'かぼちゃの ぼうし'], ['🍕', 'ピザの ぼうし'],
      ['💮', 'はなの かんむり'], ['🛸', 'ユーフォーの ぼうし'], ['🌟', 'ほしの かんむり'], ['👑', 'おうかん']]),
    // アクセサリ：v は つける ばしょ（face：かお、neck：くび、hand：て、back：せなか）
    cat('acc', 'アクセサリ', '🕶️', '#7c3aed', 'アクセサリ コレクター', 'acc', [
      ['🎀', 'リボン', 'neck'], ['🧣', 'マフラー', 'neck'], ['🕶️', 'サングラス', 'face'], ['🎧', 'ヘッドホン', 'face'],
      ['🏅', 'メダル', 'neck'], ['🎒', 'リュック', 'back'], ['🪄', 'まほうの つえ', 'hand'], ['🔦', 'ライト', 'hand'],
      ['🛡️', 'ゆうしゃの たて', 'hand'], ['🪽', 'つばさ', 'back'], ['🚀', 'ジェット パック', 'back'], ['💫', 'ほしの オーラ', 'aura']]),
    // すがた：v は かたち（ねこ・うさぎ など。SVG で みみや つのを つける。絵が とどいたら img/form_<id>.webp）
    cat('form', 'すがた', '🤖', '#f97316', 'へんしん マスター', 'form', [
      ['🐱', 'ねこ ロボ', 'cat'], ['🐰', 'うさぎ ロボ', 'rabbit'], ['🐻', 'くま ロボ', 'bear'], ['🐧', 'ペンギン ロボ', 'penguin'],
      ['🐸', 'かえる ロボ', 'frog'], ['🦄', 'ユニコーン ロボ', 'unicorn'], ['🐲', 'ドラゴン ロボ', 'dragon'], ['🦁', 'ライオン ロボ', 'lion'],
      ['👽', 'うちゅうじん ロボ', 'alien'], ['🦅', 'ワシ ロボ', 'eagle'], ['🐯', 'トラ ロボ', 'tiger'], ['🌟', 'スター ロボ', 'star']]),
    // えんしゅつ：みつけた ときに とびちる もの
    cat('fx', 'えんしゅつ', '✨', '#eab308', 'えんしゅつ マスター', 'fx', [
      ['⭐', 'ほし'], ['💖', 'ハート'], ['🫧', 'あわ'], ['🌸', 'さくら'],
      ['🍕', 'ピザ'], ['🎵', 'おんぷ'], ['🎆', 'はなび'], ['⚡', 'いなずま'],
      ['🌈', 'にじ'], ['🪐', 'わくせい'], ['🌠', 'ながれぼし'], ['🐉', 'ドラゴン']]),
  ];
  // えんしゅつで とびちる 絵文字（はじめは きらきら）
  const FX = {
    base: ['✨', '⭐', '✨'], fx1: ['⭐', '🌟', '✨'], fx2: ['💖', '💗', '💕'], fx3: ['🫧', '🫧', '💧'], fx4: ['🌸', '🌸', '🌷'],
    fx5: ['🍕', '🧀', '🍅'], fx6: ['🎵', '🎶', '🎼'], fx7: ['🎆', '🎇', '✨'], fx8: ['⚡', '💥', '✨'],
    fx9: ['🌈', '☁️', '✨'], fx10: ['🪐', '🌍', '🌕'], fx11: ['🌠', '💫', '⭐'], fx12: ['🐉', '🔥', '✨'],
  };

  // はじめから もって いる もの
  const DEFAULT_EQUIP = { bg: '', body: '', hat: '', acc: '', form: '', fx: '' };

  // レベル：みつけた かず（ぜんぶの ステージを あわせて）
  const LEVELS = [
    { at: 0, n: 'みならい パトロール' }, { at: 20, n: 'ほしの パトロール' }, { at: 50, n: 'がんばり パトロール' },
    { at: 90, n: 'わけわけ たいいん' }, { at: 140, n: 'ぶんすう たいいん' }, { at: 200, n: 'ベテラン たいいん' },
    { at: 280, n: 'ふくたいちょう' }, { at: 380, n: 'パトロール たいちょう' }, { at: 500, n: 'ぶんすう はかせ' },
    { at: 650, n: 'スーパー はかせ' }, { at: 850, n: 'うちゅう いちの わけわけ はかせ' },
  ];

  // ChatGPT の 絵が ある ファイル（img/ に おいたら ここに たす）
  const IMAGES = ['bg_home.webp', 'bg_legend.webp', 'bg_castle.webp', 'bg_gem.webp', 'bg_rainbow.webp', 'bg_galaxy.webp', 'bg_volcano.webp', 'bg_candy.webp', 'bg_ice.webp', 'bg_forest.webp', 'bg_sea.webp', 'bg_moon.webp', 'bg_sunset.webp', 'wakerun_normal.webp', 'wakerun_happy.webp', 'wakerun_think.webp',
    'form_cat.webp', 'form_rabbit.webp', 'form_bear.webp', 'form_penguin.webp', 'form_frog.webp', 'form_unicorn.webp', 'form_dragon.webp', 'form_lion.webp', 'form_alien.webp', 'form_eagle.webp', 'form_tiger.webp', 'form_star.webp'];

  window.WAKE_DATA = { STAGES, SHAPES, DEN_YOMI, NUM_YOMI, TIERS, ITEM_CATS, FX, DEFAULT_EQUIP, LEVELS, IMAGES };
})();
