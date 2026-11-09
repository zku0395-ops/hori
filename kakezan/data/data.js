/*
 * ケンジャの カケルさまの ひっさん クエスト：ばしょ・モンスター・おみせ・おはなしの データ
 *
 * PLACES（ばしょ）：1つの ばしょ ＝ 1つの レベル。たたかいは 3かい（ざこ①・ざこ②・ぬし）。
 *   battles：たたかい ごとの もんだいの しゅるい（index.html の makeProblem で つくります）
 *     k    … 1けた × 1けた（九九を ひっ算の かたちで）
 *     n0   … 2けた × 1けた　くりあがり なし（23×3）
 *     c1   … 2けた × 1けた　1の位で くりあがる。こたえは 2けた（27×3）
 *     d3   … 2けた × 1けた　こたえが 3けた（54×4）
 *     z0   … 2けた × 1けた　くりあがって 0に なる（34×3＝102）
 *     t10  … 2けた × 10
 *     tn   … 2けた × 何十（20〜90）
 *     t1x  … 2けた × 11〜19
 *     x22a … 2けた × 2けた（かけ算の くりあがりが すくない）
 *     x22  … 2けた × 2けた
 *     m1   … まとめ（かける かずが 1けた）
 *     m2   … まとめ（かける かずが 2けた）
 *     h31  … 3けた × 1けた（はってん）
 *     h32  … 3けた × 2けた（はってん）
 *   pool に ある もんだい（先生の プリントと スライドの もんだい）を ときどき まぜます。
 *   hatten: true の ばしょは、はじめは とじて います（先生用画面で ひらきます）。
 *
 * MONSTERS：ばしょ ごとに 3たい（さいごが ぬし）。絵は ChatGPT（img/monster_<id>.webp）。ないときは 絵文字。
 * JOBS（しょくぎょう）× FORMS（すがた）＝ 12まいの 絵（img/hero_<job>_<form>.webp）。
 * SHOPS（おみせ）：3けん × 10こ。ねだんは 4だんかい（TIERS）。
 * IMAGES：GitHub の img/ に おいた 絵の ファイル名（ここに ある ものだけ よみこみます）。
 *   ドライブの「ひっさんクエスト え」フォルダに おいた 絵は、ここに 書かなくても 自動で よみこみます。
 */
(function () {
  // 先生の プリント・スライドに ある もんだい（[かけられる かず, かける かず]）
  const POOL = {
    k: [[3, 3], [5, 3], [6, 3], [4, 5], [4, 6], [8, 6], [7, 5], [5, 4], [6, 6], [2, 3], [9, 3], [4, 4], [9, 5], [8, 4], [9, 2], [9, 6], [7, 3], [2, 5], [8, 2], [7, 6]],
    n0: [[23, 3], [12, 4], [31, 3], [21, 4], [42, 2], [32, 3], [11, 7], [24, 2], [13, 3], [41, 2]],
    c1: [[27, 3], [15, 4], [16, 3], [19, 4], [26, 3], [17, 5], [38, 2], [14, 6]],
    d3: [[71, 4], [16, 9], [88, 2], [42, 3], [54, 4], [63, 5], [82, 7], [56, 3]],
    z0: [[34, 3], [18, 6], [25, 4], [67, 3], [45, 9], [15, 7], [17, 6], [78, 9]],
    t10: [[34, 10], [23, 10], [56, 10], [71, 10], [18, 10]],
    tn: [[42, 20], [34, 20], [23, 30], [15, 40], [26, 30], [47, 20]],
    t1x: [[34, 11], [34, 12], [34, 13], [34, 15], [63, 12], [76, 12], [42, 11], [25, 13]],
    x22a: [[23, 21], [32, 23], [21, 34], [12, 24], [31, 22], [22, 31]],
    x22: [[23, 26], [92, 84], [75, 54], [49, 49], [18, 43], [57, 46], [38, 27], [64, 35]],
    h31: [[123, 4], [214, 3], [352, 2], [143, 6], [207, 4], [318, 3]],
    h32: [[123, 24], [214, 32], [152, 43], [306, 21], [241, 35]],
  };

  const PLACES = [
    { id: 'p0', lv: 'じゅんび', name: 'はじまりの そうげん', sub: '九九を ひっ算の かたちで', icon: '🌱', gem: 'みどりの ほうせき', gemColor: '#22c55e',
      battles: ['k', 'k', 'k'], sky: ['#bae6fd', '#bbf7d0'], ground: '#4ade80', deco: ['🌼', '🌿', '🌷'],
      intro: 'ひっ算は、たてに ならべて けいさんするよ。まずは 九九を ひっ算の かたちで かいて みよう。こたえが 2けたの ときは、1の位を みぎ、10の位を ひだりに かくよ。' },
    { id: 'p1', lv: 'Lv1', name: 'ささやきの もり', sub: '2けた × 1けた　くりあがり なし', icon: '🌳', gem: 'きいろの ほうせき', gemColor: '#facc15',
      battles: ['n0', 'n0', 'n0'], sky: ['#bbf7d0', '#166534'], ground: '#15803d', deco: ['🌲', '🍄', '🌳'],
      intro: '2けた かける 1けた だよ。はじめに 1の位を かけて、つぎに 10の位を かけるよ。みぎから じゅんばんに すすもう。' },
    { id: 'p2', lv: 'Lv2', name: 'みずうみの ほとり', sub: '1の位で くりあがる', icon: '🏞️', gem: 'あおの ほうせき', gemColor: '#3b82f6',
      battles: ['c1', 'c1', 'c1'], sky: ['#bfdbfe', '#60a5fa'], ground: '#0ea5e9', deco: ['💧', '🪷', '🐚'],
      intro: '1の位の かけ算の こたえが 10より おおきく なったら、10の位の かずを うえに ちいさく メモするよ。10の位を かけたら、メモの かずを たそう。' },
    { id: 'p3', lv: 'Lv3', name: 'いわやまの どうくつ', sub: 'こたえが 3けた', icon: '⛰️', gem: 'ちゃいろの ほうせき', gemColor: '#a16207',
      battles: ['d3', 'd3', 'd3'], sky: ['#d6d3d1', '#57534e'], ground: '#78716c', deco: ['🪨', '💎', '🕯️'],
      intro: '10の位の かけ算の こたえが 10より おおきく なると、こたえは 3けたに なるよ。のこりの かずは、ひだりの 100の位に かこう。' },
    { id: 'p4', lv: 'Lv4', name: 'すなかぜの さばく', sub: 'くりあがって 0に なる', icon: '🏜️', gem: 'オレンジの ほうせき', gemColor: '#f97316',
      battles: ['z0', 'z0', 'z0'], sky: ['#fef3c7', '#fbbf24'], ground: '#f59e0b', deco: ['🌵', '🐪', '☀️'],
      intro: 'くりあがりを たすと、ちょうど 10に なる ことが あるよ。そのときは 10の位に 0 を かいて、1 を 100の位に かこう。0を わすれないでね。' },
    { id: 'p5', lv: 'Lv5', name: 'こおりの たに', sub: '× 10・× 何十', icon: '🧊', gem: 'みずいろの ほうせき', gemColor: '#67e8f9',
      battles: ['t10', 'tn', 'tn'], sky: ['#e0f2fe', '#7dd3fc'], ground: '#bae6fd', deco: ['❄️', '⛄', '🧊'],
      intro: 'かける かずが 2けたに なるよ。1だんめは 1の位の 0 を かけるから、0 が ならぶよ。2だんめは 10の位を かけるよ。2だんめの 1の位の ✕の マスには 0 を かこう。さいごに たし算を するよ。' },
    { id: 'p6', lv: 'Lv6', name: 'ほのおの やま', sub: '× 11〜19', icon: '🌋', gem: 'あかの ほうせき', gemColor: '#ef4444',
      battles: ['t1x', 't1x', 't1x'], sky: ['#fecaca', '#7f1d1d'], ground: '#b91c1c', deco: ['🔥', '🌋', '♨️'],
      intro: '1だんめは 1の位の かずを かけるよ。2だんめは 10の位の 1 を かけて、✕の マスに 0。さいごに 1だんめと 2だんめを たそう。' },
    { id: 'p7', lv: 'Lv7', name: 'くらやみの ぬま', sub: '2けた × 2けた', icon: '🌫️', gem: 'むらさきの ほうせき', gemColor: '#a855f7',
      battles: ['x22a', 'x22', 'x22'], sky: ['#ddd6fe', '#3b0764'], ground: '#4c1d95', deco: ['🍂', '🦉', '🌙'],
      intro: '2けた かける 2けた だよ。1だんめは 1の位（きいろ）、2だんめは 10の位（みどり）を かけるよ。くりあがりの メモは、だん ごとに わけて かこう。' },
    { id: 'p8', lv: 'ボス', name: 'まおうの しろ', sub: 'まとめ', icon: '🏰', gem: 'にじいろの ほうせき', gemColor: '#f472b6',
      battles: ['m1', 'm2', 'm2'], sky: ['#475569', '#0f172a'], ground: '#1e293b', deco: ['🕯️', '⛓️', '🦇'],
      intro: 'いよいよ まおう バラバーラの しろだよ。これまで ならった ひっ算が ぜんぶ でて くるよ。おちついて、みぎから じゅんばんに。' },
    { id: 'p9', lv: 'はってん', name: 'そらの しま', sub: '3けた × 1けた・3けた × 2けた', icon: '☁️', gem: 'ほしの ほうせき', gemColor: '#fde047', hatten: true,
      battles: ['h31', 'h31', 'h32'], sky: ['#e0f2fe', '#a5b4fc'], ground: '#c7d2fe', deco: ['☁️', '🌈', '⭐'],
      intro: 'かけられる かずが 3けたに なるよ。やりかたは おなじ。1の位、10の位、100の位の じゅんに かけよう。' },
  ];

  // モンスター（オリジナル）。color は 絵が ない ときの まわりの いろ
  const MONSTERS = [
    { id: 'kusadango', place: 'p0', name: 'くさだんご', emoji: '🌿', color: '#86efac', look: 'くさの はっぱで できた まるい おだんごの まもの。にこにこ' },
    { id: 'korotento', place: 'p0', name: 'ころころ テントー', emoji: '🐞', color: '#fca5a5', look: 'ころころ ころがる おおきな てんとうむし' },
    { id: 'donmogura', place: 'p0', name: 'ドンモグラ', emoji: '🦔', color: '#d6d3d1', boss: true, look: 'ヘルメットを かぶった おおきな もぐら。そうげんの ぬし' },
    { id: 'nebokinoko', place: 'p1', name: 'ねぼすけ キノコ', emoji: '🍄', color: '#fecaca', look: 'あくびを して いる あかい かさの きのこの まもの' },
    { id: 'kodamarisu', place: 'p1', name: 'こだま リス', emoji: '🐿️', color: '#fed7aa', look: 'しっぽが はっぱの いたずら りす' },
    { id: 'fukuroad', place: 'p1', name: 'フクロード', emoji: '🦉', color: '#d9f99d', boss: true, look: 'つたの マントを きた おおきな ふくろう。もりの ぬし' },
    { id: 'pukagaeru', place: 'p2', name: 'ぷかぷか ガエル', emoji: '🐸', color: '#bbf7d0', look: 'はすの はに のった かえるの まもの' },
    { id: 'awasakana', place: 'p2', name: 'あわあわ フィッシュ', emoji: '🐟', color: '#bae6fd', look: 'あわに つつまれて ういて いる さかな' },
    { id: 'zabun', place: 'p2', name: 'ザブーン', emoji: '🐢', color: '#a5f3fc', boss: true, look: 'こうらに みずうみの しまが ある おおきな かめ。みずうみの ぬし' },
    { id: 'komorin', place: 'p3', name: 'こうもりん', emoji: '🦇', color: '#c4b5fd', look: 'ちいさな まるい こうもり' },
    { id: 'iwakoro', place: 'p3', name: 'いわころ', emoji: '🪨', color: '#e7e5e4', look: 'かおの ある まるい いわ' },
    { id: 'gansekigolem', place: 'p3', name: 'ガンセキ ゴーレム', emoji: '🗿', color: '#a8a29e', boss: true, look: 'ほうせきが ひかる いわの きょじん。どうくつの ぬし' },
    { id: 'sabosan', place: 'p4', name: 'サボさん', emoji: '🌵', color: '#bef264', look: 'サングラスを かけた サボテンの まもの' },
    { id: 'sunahebi', place: 'p4', name: 'すなヘビ', emoji: '🐍', color: '#fde68a', look: 'すなから かおを だす ヘビ' },
    { id: 'sasoking', place: 'p4', name: 'サソリキング', emoji: '🦂', color: '#fdba74', boss: true, look: 'おうかんを かぶった きんいろの さそり。さばくの ぬし' },
    { id: 'yukidarun', place: 'p5', name: 'ゆきだるん', emoji: '⛄', color: '#e0f2fe', look: 'マフラーを まいた ゆきだるまの まもの' },
    { id: 'kooripen', place: 'p5', name: 'こおり ペンギン', emoji: '🐧', color: '#bfdbfe', look: 'こおりの よろいの ペンギン' },
    { id: 'icewolf', place: 'p5', name: 'アイスウルフ', emoji: '🐺', color: '#a5f3fc', boss: true, look: 'こおりの たてがみの しろい おおかみ。たにの ぬし' },
    { id: 'hinoko', place: 'p6', name: 'ひのこ ボール', emoji: '🔥', color: '#fed7aa', look: 'めの ある ちいさな ほのおの たま' },
    { id: 'honotokage', place: 'p6', name: 'ほのお トカゲ', emoji: '🦎', color: '#fca5a5', look: 'しっぽが もえて いる トカゲ' },
    { id: 'volka', place: 'p6', name: 'ボルカドラゴン', emoji: '🐲', color: '#f87171', boss: true, look: 'マグマの つばさの あかい りゅう。やまの ぬし' },
    { id: 'numaghost', place: 'p7', name: 'ぬま ゴースト', emoji: '👻', color: '#ddd6fe', look: 'ぬまから でて きた ぼんやり ひかる おばけ' },
    { id: 'wanida', place: 'p7', name: 'ワニーダ', emoji: '🐊', color: '#bbf7d0', look: 'こけの はえた ワニ' },
    { id: 'numanuma', place: 'p7', name: 'ヌマヌマ', emoji: '🐙', color: '#c4b5fd', boss: true, look: 'むらさきの ぬまの タコ。ぬまの ぬし' },
    { id: 'kagekishi', place: 'p8', name: 'かげの きし', emoji: '🛡️', color: '#94a3b8', look: 'からっぽの よろいが うごく きし' },
    { id: 'yamimadoshi', place: 'p8', name: 'やみの まどうし', emoji: '🧙', color: '#a78bfa', look: 'くろい ローブの まほうつかい（かおは かげで みえない）' },
    { id: 'barabara', place: 'p8', name: 'まおう バラバーラ', emoji: '😈', color: '#f472b6', boss: true, look: 'かずの かけらを ばらまく まおう。マントに すうじの もよう' },
    { id: 'kaminarigumo', place: 'p9', name: 'かみなり ぐも', emoji: '⛈️', color: '#e2e8f0', look: 'おこった かおの かみなりぐも' },
    { id: 'sorawashi', place: 'p9', name: 'そら ワシ', emoji: '🦅', color: '#fde68a', look: 'くもの つばさの おおきな わし' },
    { id: 'tenkuryu', place: 'p9', name: 'てんくう りゅう', emoji: '🐉', color: '#c7d2fe', boss: true, look: 'にじいろの うろこの そらの りゅう。そらの しまの ぬし' },
  ];

  // しょくぎょう（こうげきの えんしゅつ）
  const JOBS = [
    { id: 'yusha', name: 'ゆうしゃ', emoji: '⚔️', color: '#2563eb', attack: 'けんで こうげき！', fx: '⚔️', look: 'あおい ふく、ぎんの むねあて、あかい マント、みじかい けん' },
    { id: 'mahou', name: 'まほうつかい', emoji: '🪄', color: '#7c3aed', attack: 'まほうで こうげき！', fx: '✨', look: 'むらさきの ローブと とんがりぼうし、ほしの ついた つえ' },
    { id: 'shonin', name: 'しょうにん', emoji: '💰', color: '#16a34a', attack: 'きんかを なげた！', fx: '🪙', look: 'みどりの ベスト、バンダナ、おおきな にもつの ふくろ、そろばん' },
    { id: 'soryo', name: 'そうりょ', emoji: '📿', color: '#d97706', attack: 'ひかりで こうげき！', fx: '🌟', look: 'しろい ローブに きんいろの もよう、フード、まるい かざりの ついた つえ' },
  ];
  // すがた（絵が ない ときの かみがた・かみの いろ・はだの いろ）
  const FORMS = [
    { id: 1, name: 'すがた 1', hair: 'short', hairColor: '#4a2c17', skin: '#ffe0c4', look: 'みじかい ちゃいろの かみ、げんきな かお' },
    { id: 2, name: 'すがた 2', hair: 'long', hairColor: '#f59e0b', skin: '#fde3cf', look: 'ながい きんいろの かみ、やさしい かお' },
    { id: 3, name: 'すがた 3', hair: 'tail', hairColor: '#1f2937', skin: '#e8b48a', look: 'くろい かみを うしろで むすぶ、きりっと した かお' },
  ];

  // ねだんの だんかい
  const TIERS = [
    { id: 1, name: 'ふつう', color: '#94a3b8' },
    { id: 2, name: 'ごうか', color: '#22c55e' },
    { id: 3, name: 'ちょうごうか', color: '#3b82f6' },
    { id: 4, name: 'でんせつ', color: '#f59e0b' },
  ];
  const SHOPS = [
    { id: 'buki', name: 'ぶきや', icon: '⚔️', keeper: '🧔', open: 0, hello: 'いらっしゃい！ つよい ぶきが そろって いるよ。',
      items: [
        { id: 'b1', n: 'きの ぼう', e: '🪵', p: 20, t: 1 }, { id: 'b2', n: 'どうの つるぎ', e: '🗡️', p: 30, t: 1 }, { id: 'b3', n: 'まなびの つえ', e: '🪄', p: 40, t: 1 },
        { id: 'b4', n: 'はがねの つるぎ', e: '⚔️', p: 60, t: 2 }, { id: 'b5', n: 'かけざん そろばん', e: '🧮', p: 80, t: 2 }, { id: 'b6', n: 'ほしの ゆみ', e: '🏹', p: 100, t: 2 },
        { id: 'b7', n: 'いかずちの ハンマー', e: '🔨', p: 150, t: 3 }, { id: 'b8', n: 'こおりの やり', e: '🔱', p: 200, t: 3 },
        { id: 'b9', n: 'ひかりの けん', e: '🌟', p: 300, t: 4 }, { id: 'b10', n: 'ひっさんの せいけん', e: '✴️', p: 400, t: 4 },
      ] },
    { id: 'bougu', name: 'ぼうぐや', icon: '🛡️', keeper: '👩‍🦰', open: 'p1', hello: 'いらっしゃいませ。からだを まもる そうびは いかが？',
      items: [
        { id: 'a1', n: 'かわの ぼうし', e: '🧢', p: 20, t: 1 }, { id: 'a2', n: 'たびびとの マント', e: '🧥', p: 30, t: 1 }, { id: 'a3', n: 'きの たて', e: '🛡️', p: 40, t: 1 },
        { id: 'a4', n: 'まほうの ぼうし', e: '🎩', p: 60, t: 2 }, { id: 'a5', n: 'はがねの よろい', e: '🦺', p: 80, t: 2 }, { id: 'a6', n: 'はねの くつ', e: '👢', p: 100, t: 2 },
        { id: 'a7', n: 'にじの マント', e: '🌈', p: 150, t: 3 }, { id: 'a8', n: 'おうじゃの かんむり', e: '👑', p: 200, t: 3 },
        { id: 'a9', n: 'りゅうの よろい', e: '🐉', p: 300, t: 4 }, { id: 'a10', n: 'てんくうの はごろも', e: '🪽', p: 400, t: 4 },
      ] },
    { id: 'dougu', name: 'どうぐや', icon: '🧪', keeper: '👴', open: 'p3', hello: 'ほっほっ。たびに やくだつ どうぐが あるぞ。',
      items: [
        { id: 'd1', n: 'よつばの おまもり', e: '🍀', p: 20, t: 1 }, { id: 'd2', n: 'ぼうけんの はた', e: '🚩', p: 30, t: 1 }, { id: 'd3', n: 'ひかる ランタン', e: '🏮', p: 40, t: 1 },
        { id: 'd4', n: 'こいぬの ペット', e: '🐶', p: 60, t: 2 }, { id: 'd5', n: 'こねこの ペット', e: '🐱', p: 80, t: 2 }, { id: 'd6', n: 'まほうの すいしょう', e: '🔮', p: 100, t: 2 },
        { id: 'd7', n: 'ちいさな ドラゴン', e: '🐲', p: 150, t: 3 }, { id: 'd8', n: 'ほしの コンパス', e: '🧭', p: 200, t: 3 },
        { id: 'd9', n: 'ふしちょうの はね', e: '🪶', p: 300, t: 4 }, { id: 'd10', n: 'ユニコーンの ペット', e: '🦄', p: 400, t: 4 },
      ] },
  ];

  // しゅぎょうの ば
  const SHUGYO = [
    { id: 'mato', name: 'くくの まと', icon: '🎯', sub: 'ひっ算で つかう 九九', waza: 'はやうち', wazaFx: '🏹', desc: 'かけ算の こたえの まとを ねらおう！' },
    { id: 'ishi', name: 'くりあがりの いし', icon: '🪨', sub: 'くりあがりの たし算', waza: 'いわくだき', wazaFx: '💥', desc: 'メモの かずを たして いしを わろう！' },
    { id: 'kakashi', name: 'かかし れんぞく', icon: '🌾', sub: 'ひっ算を つづけて とく', waza: 'れんぞくぎり', wazaFx: '🌀', desc: 'かかしに むかって ひっ算を つづけて とこう！' },
    { id: 'dojo', name: 'にがての どうじょう', icon: '🥋', sub: 'まちがえた かたちの もんだい', waza: 'こころの め', wazaFx: '👁️', desc: 'まえに まちがえた かたちの もんだいに もういちど ちょうせん！' },
  ];
  const WAZA_AT = 5; // しゅぎょうを この かいすう やると わざを おぼえる

  // レベルの しょうごう（この レベルから）
  const RANKS = [
    { lv: 1, n: 'みならい' }, { lv: 4, n: 'かけだしの' }, { lv: 8, n: 'いちにんまえの' },
    { lv: 12, n: 'ベテラン' }, { lv: 16, n: 'えいゆう' }, { lv: 20, n: 'ひっさんマスター', full: true },
  ];

  // ごほうび
  const REWARD = { gold: 10, exp: 10, zakoBonus: 20, bossBonus: 50, shuGold: 5, shuExp: 5, shuBonus: 10 };

  // おはなし
  const STORY = {
    opening: [
      { who: 'kakeru', text: 'ようこそ、わかき ぼうけんしゃよ。わしは ケンジャの カケル。この まちで ひっ算を おしえて おる。' },
      { who: 'maou', text: 'ある ひ、まおう バラバーラが あらわれて、まちの ひとたちから かけ算の ちからを うばって しまったのじゃ。' },
      { who: 'kakeru', text: 'ちからは 9つの ほうせきに なって、せかいの あちこちに ちらばって おる。ひっ算を おぼえて、なかまと いっしょに とりもどして くれんか。' },
    ],
    ending: [
      { who: 'kakeru', text: 'やったな！ まおう バラバーラを たおしたぞ。ほうせきが ぜんぶ もどって、まちに かけ算の ちからが もどった。' },
      { who: 'kakeru', text: 'きみは もう りっぱな ひっさんの ゆうしゃじゃ。これからも しゅぎょうの ばで うでを みがくと よいぞ。' },
    ],
  };

  // GitHub の img/ に おいた 絵（ファイル名）
  const IMAGES = [
    'hero_yusha_1.webp', 'hero_yusha_2.webp', 'hero_yusha_3.webp', 'hero_mahou_1.webp', 'hero_mahou_2.webp', 'hero_mahou_3.webp',
    'hero_shonin_1.webp', 'hero_shonin_2.webp', 'hero_shonin_3.webp', 'hero_soryo_1.webp', 'hero_soryo_2.webp', 'hero_soryo_3.webp',
    'kakeru_normal.webp', 'kakeru_happy.webp', 'kakeru_think.webp',
    // モンスター（シートC）
    'monster_kusadango.webp', 'monster_korotento.webp', 'monster_donmogura.webp', 'monster_nebokinoko.webp', 'monster_kodamarisu.webp',
    'monster_fukuroad.webp', 'monster_pukagaeru.webp', 'monster_awasakana.webp', 'monster_zabun.webp', 'monster_komorin.webp',
    // モンスター（シートD）
    'monster_iwakoro.webp', 'monster_gansekigolem.webp', 'monster_sabosan.webp', 'monster_sunahebi.webp', 'monster_sasoking.webp',
    'monster_yukidarun.webp', 'monster_kooripen.webp', 'monster_icewolf.webp', 'monster_hinoko.webp', 'monster_honotokage.webp',
    // モンスター（シートE）
    'monster_volka.webp', 'monster_numaghost.webp', 'monster_wanida.webp', 'monster_numanuma.webp', 'monster_kagekishi.webp',
    'monster_yamimadoshi.webp', 'monster_barabara.webp', 'monster_kaminarigumo.webp', 'monster_sorawashi.webp', 'monster_tenkuryu.webp',
    // ばしょの はいけい（シートF・G・H）
    'bg_p0.webp', 'bg_p1.webp', 'bg_p2.webp', 'bg_p3.webp',
    'bg_p4.webp', 'bg_p5.webp', 'bg_p6.webp', 'bg_p7.webp',
    'bg_p8.webp', 'bg_p9.webp',
    // まちと ワールドマップ
    'town.webp', 'worldmap.webp', 'title.webp', 'logo.webp', 'story.webp', 'story_end.webp',
    // たてものの なか（シートM・N）
    'room_buki.webp', 'room_bougu.webp', 'room_dougu.webp', 'room_house.webp',
    'room_inn.webp', 'room_castle.webp', 'room_guild.webp', 'room_shugyo.webp',
    'town_bg.webp',
    // おみせの しなもの（シートI・J・K・L）
    'item_b1.webp', 'item_b2.webp', 'item_b3.webp', 'item_b4.webp', 'item_b5.webp', 'item_b6.webp', 'item_b7.webp', 'item_b8.webp',
    'item_b9.webp', 'item_b10.webp', 'item_a1.webp', 'item_a2.webp', 'item_a3.webp', 'item_a4.webp', 'item_a5.webp', 'item_a6.webp',
    'item_a7.webp', 'item_a8.webp', 'item_a9.webp', 'item_a10.webp', 'item_d1.webp', 'item_d2.webp', 'item_d3.webp', 'item_d4.webp',
    'item_d5.webp', 'item_d6.webp', 'item_d7.webp', 'item_d8.webp', 'item_d9.webp', 'item_d10.webp',
  ];

  // ChatGPT の まちの 絵（town）の うえで 押す ばしょ。TOWN_SIZE は 絵の 大きさ（よこ, たて。ピクセル）
  // [x, y, はば, たかさ]（ひだりうえが 0, 0）。絵を かえたら、絵に あわせて なおす
  const TOWN_SIZE = [748, 776];
  const TOWN_SPOTS = {
    castle: [230, 20, 320, 195], guild: [30, 100, 200, 165], buki: [555, 100, 170, 140], bougu: [565, 245, 160, 115],
    dougu: [585, 362, 145, 118], inn: [500, 485, 200, 150], house: [160, 515, 130, 100], shugyo: [10, 335, 200, 175], gate: [285, 618, 190, 110],
    fountain: [380, 400, 78], // ふんすいの まんなかと、ほうせきを ならべる はんけい
    hero: [380, 520],         // しゅじんこうと なかまが たつ ところ
  };
  // ChatGPT の ワールドマップの 絵（worldmap）の うえの ばしょ（まんなか）。MAP_SIZE は 絵の 大きさ（よこ 3：たて 2 の 絵）
  // おなじ 絵なら、大きさを かえても（ドライブに 入れても）ずれません（わりあいで おきます）
  const MAP_SIZE = [1536, 1024];
  const MAP_SPOTS = { p9: [150, 125], town: [225, 705], p0: [370, 775], p1: [490, 605], p2: [740, 850], p3: [990, 555], p4: [1145, 768], p5: [1340, 358], p6: [1195, 222], p7: [855, 292], p8: [520, 237] };
  // なかまが あるく みちの とちゅうの まがりかど（'town>p0' は まち から そうげん へ。かえりは ぎゃくに たどる）
  // 絵の 黄色い みちと まるい しるしに そって あるく
  const MAP_VIA = {
    'p9>town': [[150, 260], [100, 335], [62, 420], [80, 500], [130, 570], [185, 650]],
    'town>p0': [[235, 750], [280, 772]],
    'p0>p1': [[410, 765], [415, 695], [455, 645]],
    'p1>p2': [[440, 520], [430, 430], [480, 395], [620, 390], [740, 430], [790, 510], [900, 565], [990, 555], [1060, 590], [1090, 660], [1120, 740], [1145, 768], [1030, 805], [900, 840]],
    'p2>p3': [[900, 840], [1030, 805], [1145, 768], [1120, 740], [1090, 660], [1060, 590]],
    'p3>p4': [[1060, 590], [1090, 660], [1120, 740]],
    'p4>p5': [[1200, 700], [1300, 640], [1245, 545], [1275, 470], [1345, 420]],
    'p5>p6': [[1355, 290], [1290, 235]],
    'p6>p7': [[1080, 235], [1020, 280], [940, 295]],
    'p7>p8': [[700, 290], [600, 265]],
  };

  window.KAKE_DATA = { POOL, PLACES, MONSTERS, JOBS, FORMS, TIERS, SHOPS, SHUGYO, WAZA_AT, RANKS, REWARD, STORY, IMAGES, TOWN_SIZE, TOWN_SPOTS, MAP_SIZE, MAP_SPOTS, MAP_VIA };
})();
