/*
 * ホーせんぱいと おうちさがし たんていだん：ばしょ・いえ・じゅうにん・ステージの データと、もんだいを つくる しくみ
 *
 * AREAS（ばしょ）… まち・もり・はやし・みなと・むら・やま。1つの ばしょに いえが 10けん。
 *   layout：3ぼんの みち（あおい みち・きいろい みち・あかい みち）。1ぽんの みちに、おくがわ（u）と てまえがわ（d）の ならびが あり、どちらも 5ます。
 *     数字（0〜9）は いえの ばんごう、'A' 'B' は めじるし（marks の 1つめ・2つめ）、null は あきち。ならびの とちゅうに null は 入れません。
 *     u と d の おなじ ますは「むかい」に なります。
 *   animals：じゅうにん（いえの ばんごうと おなじ じゅん）
 * HOUSES（いえの 設計表）… [やねの いろ, かべの いろ, にわの もの, のりもの, ドアの いろ, まどの かたち]
 *   ChatGPT で つくる いえの 絵は、この 表に あわせます（e_chatgpt.md）。表を かえたら 絵も つくりなおしに なります。
 * STAGES（ステージ）
 *   n：がめんに 出す いえの かず（6・8・10）。10 の ときは、ばしょの いえを ぜんぶ 出す（layout の ならび）
 *   pats：ヒントの 文の くみあわせ（もんだい ごとに じゅんばんに つかう）
 *     roof やね / wall かべ / garden にわ / vehicle のりもの / door ドア / window まど / look 見ための どれか
 *     row みち（あおい みち など）/ nearM めじるしの となり / nearH いえの となり / side みぎ・ひだり どなり / between あいだ
 *     opp みちを はさんだ むかい / ord ひだり（みぎ）から なんけんめ / pos ばしょの どれか
 *     neg 「〜では ありません」/ neg2 「〜でも 〜でも ありません」
 *   who：'a' じゅうにん 1〜5、'b' じゅうにん 6〜10、'r' 10人から 5人
 *   extra：いらない 文を まぜる かず（はってん）
 *   hatten: true の ステージは、はじめは とじて います（先生用画面で ひらきます）。
 * きろくの ステージ id（s1a など）は、あとから かえないで ください（いまある きろくと むすびついて います）。
 */
var OUCHI = (function () {
  // あたらしく 絵を 入れたら、ここに ファイル名を 足します（e_chatgpt.md）
  var IMAGES = ['bg_hayashi.webp', 'bg_machi.webp', 'bg_minato.webp', 'bg_mori.webp', 'bg_mura.webp', 'bg_yama.webp', 'd_benchi.webp', 'd_gaito.webp', 'd_ido.webp', 'd_iwa.webp', 'd_kirikabu.webp', 'd_taru.webp', 'h_hayashi-01.webp', 'h_hayashi-02.webp', 'h_hayashi-03.webp', 'h_hayashi-04.webp', 'h_hayashi-05.webp', 'h_hayashi-06.webp', 'h_hayashi-07.webp', 'h_hayashi-08.webp', 'h_hayashi-09.webp', 'h_hayashi-10.webp', 'h_machi-01.webp', 'h_machi-02.webp', 'h_machi-03.webp', 'h_machi-04.webp', 'h_machi-05.webp', 'h_machi-06.webp', 'h_machi-07.webp', 'h_machi-08.webp', 'h_machi-09.webp', 'h_machi-10.webp', 'h_minato-01.webp', 'h_minato-02.webp', 'h_minato-03.webp', 'h_minato-04.webp', 'h_minato-05.webp', 'h_minato-06.webp', 'h_minato-07.webp', 'h_minato-08.webp', 'h_minato-09.webp', 'h_minato-10.webp', 'h_mori-01.webp', 'h_mori-02.webp', 'h_mori-03.webp', 'h_mori-04.webp', 'h_mori-05.webp', 'h_mori-06.webp', 'h_mori-07.webp', 'h_mori-08.webp', 'h_mori-09.webp', 'h_mori-10.webp', 'h_mura-01.webp', 'h_mura-02.webp', 'h_mura-03.webp', 'h_mura-04.webp', 'h_mura-05.webp', 'h_mura-06.webp', 'h_mura-07.webp', 'h_mura-08.webp', 'h_mura-09.webp', 'h_mura-10.webp', 'h_yama-01.webp', 'h_yama-02.webp', 'h_yama-03.webp', 'h_yama-04.webp', 'h_yama-05.webp', 'h_yama-06.webp', 'h_yama-07.webp', 'h_yama-08.webp', 'h_yama-09.webp', 'h_yama-10.webp', 'hero.webp', 'ho_happy.webp', 'ho_normal.webp', 'ho_think.webp', 'm_basutei.webp', 'm_funsui.webp', 'm_fusha.webp', 'm_hatake.webp', 'm_ikari.webp', 'm_ike.webp', 'm_onsen.webp', 'm_posuto.webp', 'm_ropu.webp', 'm_takibi.webp', 'm_tento.webp', 'm_todai.webp', 'r_hayashi-01.webp', 'r_hayashi-02.webp', 'r_hayashi-03.webp', 'r_hayashi-04.webp', 'r_hayashi-05.webp', 'r_hayashi-06.webp', 'r_hayashi-07.webp', 'r_hayashi-08.webp', 'r_hayashi-09.webp', 'r_hayashi-10.webp', 'r_machi-01.webp', 'r_machi-02.webp', 'r_machi-03.webp', 'r_machi-04.webp', 'r_machi-05.webp', 'r_machi-06.webp', 'r_machi-07.webp', 'r_machi-08.webp', 'r_machi-09.webp', 'r_machi-10.webp', 'r_minato-01.webp', 'r_minato-02.webp', 'r_minato-03.webp', 'r_minato-04.webp', 'r_minato-05.webp', 'r_minato-06.webp', 'r_minato-07.webp', 'r_minato-08.webp', 'r_minato-09.webp', 'r_minato-10.webp', 'r_mori-01.webp', 'r_mori-02.webp', 'r_mori-03.webp', 'r_mori-04.webp', 'r_mori-05.webp', 'r_mori-06.webp', 'r_mori-07.webp', 'r_mori-08.webp', 'r_mori-09.webp', 'r_mori-10.webp', 'r_mura-01.webp', 'r_mura-02.webp', 'r_mura-03.webp', 'r_mura-04.webp', 'r_mura-05.webp', 'r_mura-06.webp', 'r_mura-07.webp', 'r_mura-08.webp', 'r_mura-09.webp', 'r_mura-10.webp', 'r_yama-01.webp', 'r_yama-02.webp', 'r_yama-03.webp', 'r_yama-04.webp', 'r_yama-05.webp', 'r_yama-06.webp', 'r_yama-07.webp', 'r_yama-08.webp', 'r_yama-09.webp', 'r_yama-10.webp'];

  // やねの いろ（こい いろ）
  var ROOF = { 'あか': '#ef4444', 'あお': '#2563eb', 'きいろ': '#facc15', 'みどり': '#16a34a', 'オレンジ': '#fb923c', 'ピンク': '#f472b6', 'むらさき': '#a855f7', 'ちゃいろ': '#92400e' };
  // かべの いろ（うすい いろ）
  var WALL = { 'しろ': '#ffffff', 'みずいろ': '#bae6fd', 'ピンク': '#fbcfe8', 'きいろ': '#fde68a', 'ちゃいろ': '#d6a77a' };
  // ドアの いろ と まどの かたち
  var DOOR = { 'あか': '#dc2626', 'あお': '#1d4ed8', 'きいろ': '#facc15', 'みどり': '#15803d' };
  var WINDOW = ['まる', 'しかく', 'さんかく'];
  // 「あかい やねの いえ」の いいかた
  var ADJ = { 'あか': 'あかい', 'あお': 'あおい', 'きいろ': 'きいろい', 'ちゃいろ': 'ちゃいろい', 'しろ': 'しろい', 'みどり': 'みどりの', 'オレンジ': 'オレンジの', 'ピンク': 'ピンクの', 'むらさき': 'むらさきの', 'みずいろ': 'みずいろの' };

  // にわの もの（e：絵。tree:〜 は 自作の 木、ほかは 絵文字）
  var GARDEN = {
    ringo: { n: 'りんごの き', e: 'tree:apple', v: 'あります', nv: 'ありません', rv: 'ある' },
    mikan: { n: 'みかんの き', e: 'tree:mikan', v: 'あります', nv: 'ありません', rv: 'ある' },
    sakura: { n: 'さくらの き', e: 'tree:sakura', v: 'あります', nv: 'ありません', rv: 'ある' },
    momi: { n: 'もみの き', e: '🌲', v: 'あります', nv: 'ありません', rv: 'ある' },
    yashi: { n: 'やしの き', e: '🌴', v: 'あります', nv: 'ありません', rv: 'ある' },
    tulip: { n: 'チューリップ', e: '🌷', v: 'さいて います', nv: 'さいて いません', rv: 'さいて いる' },
    himawari: { n: 'ひまわり', e: '🌻', v: 'さいて います', nv: 'さいて いません', rv: 'さいて いる' },
    bara: { n: 'バラ', e: '🌹', v: 'さいて います', nv: 'さいて いません', rv: 'さいて いる' },
    kinoko: { n: 'きのこ', e: '🍄', v: 'はえて います', nv: 'はえて いません', rv: 'はえて いる' },
    saboten: { n: 'サボテン', e: '🌵', v: 'あります', nv: 'ありません', rv: 'ある' },
    hata: { n: 'はた', e: '🚩', v: 'たって います', nv: 'たって いません', rv: 'たって いる' },
    kabocha: { n: 'かぼちゃ', e: '🎃', v: 'あります', nv: 'ありません', rv: 'ある' },
    morokoshi: { n: 'とうもろこし', e: '🌽', v: 'あります', nv: 'ありません', rv: 'ある' },
    yukidaruma: { n: 'ゆきだるま', e: '⛄', v: 'あります', nv: 'ありません', rv: 'ある' },
  };
  // のりもの（car:いろ は 自作の くるま）
  var VEHICLE = {
    carR: { n: 'あかい くるま', e: 'car:#ef4444', c: 'あか', v: 'とまって います', nv: 'とまって いません' },
    carB: { n: 'あおい くるま', e: 'car:#2563eb', c: 'あお', v: 'とまって います', nv: 'とまって いません' },
    carY: { n: 'きいろい くるま', e: 'car:#facc15', c: 'きいろ', v: 'とまって います', nv: 'とまって いません' },
    carG: { n: 'みどりの くるま', e: 'car:#16a34a', c: 'みどり', v: 'とまって います', nv: 'とまって いません' },
    jitensha: { n: 'じてんしゃ', e: '🚲', v: 'おいて あります', nv: 'おいて ありません' },
    baiku: { n: 'バイク', e: '🏍️', v: 'とまって います', nv: 'とまって いません' },
    torakku: { n: 'トラック', e: '🚚', v: 'とまって います', nv: 'とまって いません' },
    basu: { n: 'バス', e: '🚌', v: 'とまって います', nv: 'とまって いません' },
    yotto: { n: 'ヨット', e: '⛵', v: 'とまって います', nv: 'とまって いません' },
    boto: { n: 'ボート', e: '🚤', v: 'とまって います', nv: 'とまって いません' },
    torakuta: { n: 'トラクター', e: '🚜', v: 'とまって います', nv: 'とまって いません' },
    sori: { n: 'そり', e: '🛷', v: 'おいて あります', nv: 'おいて ありません' },
  };

  var N = null;
  var AREAS = [
    { id: 'machi', n: 'まち', e: '🏙️', sky: '#bfdbfe', ground: '#d1d5db', road: '#9ca3af',
      marks: [{ id: 'funsui', n: 'ふんすい', e: '⛲' }, { id: 'basutei', n: 'バスてい', e: '🚏' }],
      layout: [{ u: [0, 1, 'A', 2, N] }, { u: [N, 3, 4, 5, N], d: [N, N, 6, 7, N] }, { u: ['B', 8, 9, N, N] }],
      animals: [['いぬ', '🐶'], ['ねこ', '🐱'], ['うさぎ', '🐰'], ['ハムスター', '🐹'], ['パンダ', '🐼'], ['コアラ', '🐨'], ['さる', '🐵'], ['ぞう', '🐘'], ['きりん', '🦒'], ['ライオン', '🦁']] },
    { id: 'mori', n: 'もり', e: '🌳', sky: '#bbf7d0', ground: '#86efac', road: '#d6b98c',
      marks: [{ id: 'tento', n: 'テント', e: '⛺' }, { id: 'ike', n: 'いけ', e: 'pond' }],
      layout: [{ u: [N, 0, 'A', 1, N], d: [N, 2, 3, N, N] }, { u: [4, 5, 6, 'B', N] }, { u: [N, N, 7, 8, 9] }],
      animals: [['くま', '🐻'], ['きつね', '🦊'], ['たぬき', '🦝'], ['りす', '🐿️'], ['しか', '🦌'], ['はりねずみ', '🦔'], ['いのしし', '🐗'], ['ことり', '🐦'], ['かえる', '🐸'], ['おおかみ', '🐺']] },
    { id: 'hayashi', n: 'はやし', e: '🎋', sky: '#d9f99d', ground: '#bef264', road: '#e7d3a8',
      marks: [{ id: 'takibi', n: 'たきび', e: '🔥' }, { id: 'posuto', n: 'ポスト', e: '📮' }],
      layout: [{ u: [0, 1, 2, N, N] }, { u: [N, 'A', 3, 4, N], d: [N, N, 5, 6, N] }, { u: [N, 7, 8, N, N], d: [N, 'B', 9, N, N] }],
      animals: [['てんとうむし', '🐞'], ['みつばち', '🐝'], ['かたつむり', '🐌'], ['ちょうちょ', '🦋'], ['とかげ', '🦎'], ['ねずみ', '🐭'], ['スカンク', '🦨'], ['あなぐま', '🦡'], ['なまけもの', '🦥'], ['こうもり', '🦇']] },
    { id: 'minato', n: 'みなと', e: '⚓', sky: '#a5f3fc', ground: '#fde68a', road: '#d4d4d8',
      marks: [{ id: 'todai', n: 'とうだい', e: 'lighthouse' }, { id: 'ikari', n: 'いかり', e: '⚓' }],
      layout: [{ u: [0, 'A', 1, 5, N] }, { u: [N, 2, 3, 6, N], d: [N, 7, 8, N, N] }, { u: [4, 'B', 9, N, N] }],
      animals: [['ペンギン', '🐧'], ['いるか', '🐬'], ['くじら', '🐳'], ['かに', '🦀'], ['たこ', '🐙'], ['かめ', '🐢'], ['ラッコ', '🦦'], ['さめ', '🦈'], ['いか', '🦑'], ['えび', '🦐']] },
    { id: 'mura', n: 'むら', e: '🌾', sky: '#fef3c7', ground: '#d9f99d', road: '#d6b98c',
      marks: [{ id: 'fusha', n: 'ふうしゃ', e: 'windmill' }, { id: 'hatake', n: 'やさいの はたけ', e: '🥕' }],
      layout: [{ u: [0, 5, 6, 1, N] }, { u: [N, 2, 7, 'A', N], d: [N, 3, 8, N, N] }, { u: ['B', 9, 4, N, N] }],
      animals: [['うし', '🐮'], ['うま', '🐴'], ['ひつじ', '🐑'], ['やぎ', '🐐'], ['にわとり', '🐔'], ['ぶた', '🐷'], ['あひる', '🦆'], ['ひよこ', '🐤'], ['しちめんちょう', '🦃'], ['アルパカ', '🦙']] },
    { id: 'yama', n: 'やま', e: '⛰️', sky: '#e0e7ff', ground: '#e2e8f0', road: '#cbd5e1',
      marks: [{ id: 'ropu', n: 'ロープウェイ', e: '🚠' }, { id: 'onsen', n: 'おんせん', e: '♨️' }],
      layout: [{ u: [N, 0, 1, 'A', N] }, { u: [3, 5, 6, N, N], d: [N, 4, 2, N, N] }, { u: [N, 7, 'B', N, N], d: [N, 8, 9, N, N] }],
      animals: [['わし', '🦅'], ['しろくま', '🐻‍❄️'], ['とら', '🐯'], ['ゴリラ', '🦍'], ['ひょう', '🐆'], ['カンガルー', '🦘'], ['バイソン', '🦬'], ['くじゃく', '🦚'], ['しまうま', '🦓'], ['ドラゴン', '🐉']] },
  ];

  // いえの 設計表：[やね, かべ, にわ, のりもの, ドア, まど]（tools/check.js で たしかめます）
  var HOUSES = {
    machi: [
      ['きいろ', 'みずいろ', 'sakura', 'carY', 'みどり', 'まる'],
      ['あか', 'ピンク', 'himawari', 'jitensha', 'あか', 'しかく'],
      ['きいろ', 'しろ', 'himawari', 'carB', 'あお', 'しかく'],
      ['みどり', 'みずいろ', 'ringo', 'carB', 'あお', 'さんかく'],
      ['あお', 'ピンク', 'tulip', 'carY', 'きいろ', 'まる'],
      ['きいろ', 'ピンク', 'sakura', 'carY', 'みどり', 'まる'],
      ['みどり', 'みずいろ', 'ringo', 'carB', 'みどり', 'さんかく'],
      ['あか', 'みずいろ', 'himawari', 'jitensha', 'あか', 'しかく'],
      ['きいろ', 'しろ', 'himawari', 'carR', 'あお', 'しかく'],
      ['あお', 'ピンク', 'tulip', 'carR', 'きいろ', 'まる'],
    ],
    mori: [
      ['あか', 'しろ', 'bara', 'carG', 'きいろ', 'さんかく'],
      ['あか', 'しろ', 'mikan', 'jitensha', 'あか', 'しかく'],
      ['オレンジ', 'ちゃいろ', 'kinoko', 'carG', 'あお', 'しかく'],
      ['ちゃいろ', 'きいろ', 'momi', 'baiku', 'あお', 'さんかく'],
      ['ちゃいろ', 'きいろ', 'momi', 'baiku', 'みどり', 'さんかく'],
      ['あか', 'きいろ', 'mikan', 'jitensha', 'あか', 'しかく'],
      ['みどり', 'ちゃいろ', 'mikan', 'torakku', 'みどり', 'まる'],
      ['オレンジ', 'しろ', 'bara', 'carG', 'きいろ', 'さんかく'],
      ['みどり', 'しろ', 'mikan', 'torakku', 'みどり', 'まる'],
      ['あか', 'ちゃいろ', 'kinoko', 'carG', 'あお', 'しかく'],
    ],
    hayashi: [
      ['ピンク', 'ちゃいろ', 'ringo', 'basu', 'あか', 'まる'],
      ['あお', 'しろ', 'himawari', 'basu', 'あお', 'さんかく'],
      ['あお', 'しろ', 'himawari', 'carR', 'あお', 'さんかく'],
      ['むらさき', 'みずいろ', 'ringo', 'carR', 'きいろ', 'しかく'],
      ['むらさき', 'みずいろ', 'ringo', 'carR', 'きいろ', 'まる'],
      ['きいろ', 'しろ', 'tulip', 'carY', 'あか', 'さんかく'],
      ['むらさき', 'みずいろ', 'ringo', 'carR', 'みどり', 'しかく'],
      ['むらさき', 'ちゃいろ', 'saboten', 'basu', 'あか', 'まる'],
      ['きいろ', 'しろ', 'tulip', 'carY', 'みどり', 'さんかく'],
      ['ピンク', 'ちゃいろ', 'saboten', 'basu', 'あか', 'まる'],
    ],
    minato: [
      ['むらさき', 'しろ', 'himawari', 'jitensha', 'あお', 'しかく'],
      ['むらさき', 'しろ', 'himawari', 'jitensha', 'みどり', 'しかく'],
      ['あか', 'みずいろ', 'bara', 'carB', 'あか', 'しかく'],
      ['あか', 'みずいろ', 'bara', 'carB', 'あか', 'さんかく'],
      ['オレンジ', 'しろ', 'himawari', 'jitensha', 'みどり', 'しかく'],
      ['あお', 'しろ', 'hata', 'boto', 'きいろ', 'まる'],
      ['あか', 'きいろ', 'yashi', 'yotto', 'あお', 'まる'],
      ['あお', 'みずいろ', 'hata', 'boto', 'きいろ', 'まる'],
      ['オレンジ', 'きいろ', 'yashi', 'yotto', 'あお', 'まる'],
      ['あか', 'みずいろ', 'bara', 'carB', 'みどり', 'さんかく'],
    ],
    mura: [
      ['ちゃいろ', 'ちゃいろ', 'morokoshi', 'carR', 'あお', 'さんかく'],
      ['みどり', 'ピンク', 'sakura', 'jitensha', 'きいろ', 'しかく'],
      ['きいろ', 'しろ', 'morokoshi', 'torakku', 'あお', 'しかく'],
      ['あか', 'しろ', 'mikan', 'torakuta', 'あか', 'さんかく'],
      ['きいろ', 'しろ', 'morokoshi', 'torakku', 'きいろ', 'しかく'],
      ['ちゃいろ', 'ちゃいろ', 'mikan', 'carR', 'あお', 'さんかく'],
      ['あか', 'しろ', 'kabocha', 'torakuta', 'あか', 'さんかく'],
      ['みどり', 'ピンク', 'sakura', 'jitensha', 'みどり', 'しかく'],
      ['きいろ', 'ちゃいろ', 'kabocha', 'torakuta', 'みどり', 'まる'],
      ['きいろ', 'ちゃいろ', 'kabocha', 'jitensha', 'みどり', 'まる'],
    ],
    yama: [
      ['あお', 'きいろ', 'momi', 'sori', 'あお', 'しかく'],
      ['あか', 'しろ', 'yukidaruma', 'sori', 'きいろ', 'しかく'],
      ['みどり', 'きいろ', 'hata', 'basu', 'あか', 'さんかく'],
      ['みどり', 'ちゃいろ', 'yukidaruma', 'baiku', 'みどり', 'しかく'],
      ['あお', 'きいろ', 'momi', 'sori', 'あお', 'まる'],
      ['ピンク', 'ちゃいろ', 'ringo', 'baiku', 'あお', 'まる'],
      ['みどり', 'ちゃいろ', 'yukidaruma', 'baiku', 'みどり', 'さんかく'],
      ['ピンク', 'ちゃいろ', 'ringo', 'carY', 'あお', 'まる'],
      ['あか', 'しろ', 'yukidaruma', 'basu', 'きいろ', 'しかく'],
      ['みどり', 'きいろ', 'hata', 'carY', 'あか', 'さんかく'],
    ],
  };

  var LOOK = ['roof', 'wall', 'garden', 'vehicle', 'door', 'window'];
  var SLOTS = 5; // 1ぽんの みちに ならぶ ますの かず
  // 3ぼんの みち（おくから じゅんに）。ちずの 上で、みちに いろを つけて 出す
  var ROADS = [{ n: 'あおい みち', c: '#93c5fd' }, { n: 'きいろい みち', c: '#fde047' }, { n: 'あかい みち', c: '#fca5a5' }];
  var L2 = [['look', 'look']];
  var L3 = [['look', 'look', 'look']];
  var STAGES = [
    { id: 's1a', no: '1-1', area: 'machi', t: 'やね・ドア・まど', n: 6, who: 'a', pats: [['roof'], ['door'], ['window'], ['roof'], ['door']] },
    { id: 's1b', no: '1-2', area: 'machi', t: 'かべ・にわ・のりもの', n: 6, who: 'b', pats: [['wall'], ['garden'], ['vehicle'], ['window'], ['door']] },
    { id: 's1c', no: '1-3', area: 'machi', t: '6けんから さがす', n: 6, who: 'r', pats: [['look']] },
    { id: 's2a', no: '2-1', area: 'mori', t: '2つの ぶん', n: 8, who: 'a', pats: [['roof', 'door'], ['wall', 'window'], ['garden', 'door'], ['roof', 'window'], ['vehicle', 'door']] },
    { id: 's2b', no: '2-2', area: 'mori', t: '2つの ぶん', n: 8, who: 'b', pats: L2 },
    { id: 's2c', no: '2-3', area: 'mori', t: '10けんから さがす', n: 10, who: 'r', pats: L2 },
    { id: 's3a', no: '3-1', area: 'hayashi', t: '3つの ぶん', n: 8, who: 'a', pats: L3 },
    { id: 's3b', no: '3-2', area: 'hayashi', t: '3つの ぶん', n: 10, who: 'b', pats: L3 },
    { id: 's3c', no: '3-3', area: 'hayashi', t: '3つの ぶん', n: 10, who: 'r', pats: L3 },
    { id: 's4a', no: '4-1', area: 'minato', t: 'みち と となり', n: 10, who: 'a', pats: [['row', 'look'], ['nearM', 'look'], ['row', 'look', 'look'], ['nearM', 'look'], ['row', 'look']] },
    { id: 's4b', no: '4-2', area: 'minato', t: 'となり と むかい', n: 10, who: 'b', pats: [['nearH', 'look'], ['opp', 'look'], ['near', 'look'], ['opp', 'look'], ['nearH', 'look']] },
    { id: 's4c', no: '4-3', area: 'minato', t: 'ばしょの ことば', n: 10, who: 'r', pats: [['near', 'look'], ['row', 'near'], ['opp', 'look'], ['nearH', 'look', 'look']] },
    { id: 's5a', no: '5-1', area: 'mura', t: 'みぎ・ひだり', n: 10, who: 'a', pats: [['side', 'look'], ['ord', 'look'], ['side', 'look'], ['ord', 'look'], ['side']] },
    { id: 's5b', no: '5-2', area: 'mura', t: 'あいだ', n: 10, who: 'b', pats: [['between', 'look'], ['opp', 'look'], ['between'], ['side', 'look'], ['ord', 'look']] },
    { id: 's5c', no: '5-3', area: 'mura', t: 'ばしょ と みため', n: 10, who: 'r', pats: [['pos', 'look', 'look'], ['row', 'near', 'look'], ['ord', 'look', 'look']] },
    { id: 's6a', no: '6-1', area: 'yama', t: 'まとめ', n: 10, who: 'a', pats: [['pos', 'look', 'look'], L3[0], ['row', 'near', 'look'], ['ord', 'look', 'look']] },
    { id: 's6b', no: '6-2', area: 'yama', t: 'まとめ', n: 10, who: 'b', pats: [['pos', 'look', 'look'], ['side', 'look'], L3[0], ['opp', 'look', 'look']] },
    { id: 's6c', no: '6-3', area: 'yama', t: 'めいたんていの しけん', n: 10, who: 'r', pats: [['pos', 'look', 'look'], ['between', 'look'], ['row', 'pos', 'look'], ['ord', 'look', 'look']] },
    { id: 'h1', no: 'はってん 1', area: 'all', t: '「〜では ありません」', n: 10, who: 'r', hatten: true, pats: [['neg', 'look', 'look'], ['neg2', 'look', 'look'], ['neg', 'neg', 'look'], ['neg2', 'neg', 'look'], ['neg', 'pos', 'look']] },
    { id: 'h2', no: 'はってん 2', area: 'all', t: 'いらない ぶんが まざる', n: 10, who: 'r', hatten: true, extra: 1, pats: [['look', 'look', 'look'], ['pos', 'look'], ['pos', 'look', 'look']] },
  ];

  // しょうごう（あつめた シールの かず）
  var TITLES = [[0, 'みならい たんてい'], [5, 'かけだし たんてい'], [15, 'まちの たんてい'], [30, 'うでききの たんてい'], [45, 'めいたんてい'], [60, 'でんせつの めいたんてい']];

  // いらない 文（はってん 2）。{c} やねの いろ、{d} ドアの いろ、{g} にわの もの、{v} のりもの（こたえの いえとは ちがう もの）
  var EXTRA = [
    'すきな いろは、{c}です。', 'ともだちの いえの やねは、{c}です。', 'ともだちの いえの ドアは、{d}です。', 'きのう、{g}の えを かきました。', 'いつか、{v}に のって みたいです。',
    'あさごはんに、パンを たべました。', 'きのう、ともだちと あそびました。', 'きょうは、いい てんきですね。', 'うたを うたうのが すきです。',
  ];

  // ------------------------------------------------------------------
  //  いえの ならび
  // ------------------------------------------------------------------
  var cache = {};
  function reset() { cache = {}; }
  function area(id) { for (var i = 0; i < AREAS.length; i++) if (AREAS[i].id === id) return AREAS[i]; return null; }
  function pad2(n) { return (n < 9 ? '0' : '') + (n + 1); }
  function build(areaId) {
    if (cache[areaId]) return cache[areaId];
    var a = area(areaId), hs = [], list = [];
    HOUSES[areaId].forEach(function (h, i) {
      hs.push({ id: areaId + '-' + pad2(i), i: i, area: areaId, roof: h[0], wall: h[1], garden: h[2], vehicle: h[3], door: h[4], window: h[5], who: a.animals[i][0], face: a.animals[i][1] });
    });
    // grid[みち][0：おくがわ / 1：てまえがわ][ます]
    var grid = a.layout.map(function (rd, r) {
      return ['u', 'd'].map(function (s) {
        var line = [];
        for (var c = 0; c < SLOTS; c++) {
          var x = rd[s] ? rd[s][c] : null, cell = null;
          if (x === 'A' || x === 'B') cell = { mark: a.marks[x === 'A' ? 0 : 1] };
          else if (typeof x === 'number') { cell = { house: hs[x] }; hs[x].row = r; hs[x].side = s; hs[x].col = c; }
          if (cell) { cell.r = r; cell.s = s; cell.c = c; list.push(cell); }
          line.push(cell);
        }
        return line;
      });
    });
    return (cache[areaId] = { area: a, houses: hs, grid: grid, cells: list });
  }
  function houses(areaId) { return build(areaId).houses; }
  function cells(areaId) { return build(areaId).cells; }
  function house(id) { var p = id.split('-'); return houses(p[0])[Number(p[1]) - 1]; }
  function lineOf(h) { return build(h.area).grid[h.row][h.side === 'u' ? 0 : 1]; }
  // となり（L・R）と、みちを はさんだ むかい（O）
  function nb(h) {
    var c = lineOf(h), o = build(h.area).grid[h.row][h.side === 'u' ? 1 : 0];
    return { L: c[h.col - 1] || null, R: c[h.col + 1] || null, O: o[h.col] || null };
  }
  // ならんで いる いえの なかで、ひだりから・みぎから なんけんめ か
  //   L・R：いえだけを かぞえた とき、La・Ra：めじるしも かぞえた とき、mL・mR：その がわに めじるしが あるか、n：ならんで いる いえの かず
  function ordOf(h) {
    var c = lineOf(h), a = h.col, b = h.col, i, o = { L: 1, R: 1, La: 1, Ra: 1, mL: false, mR: false, n: 1 };
    while (c[a - 1]) a--;
    while (c[b + 1]) b++;
    for (i = a; i < h.col; i++) { o.La++; if (c[i].house) { o.L++; o.n++; } else o.mL = true; }
    for (i = h.col + 1; i <= b; i++) { o.Ra++; if (c[i].house) { o.R++; o.n++; } else o.mR = true; }
    return o;
  }
  function refOk(cell, ref) {
    if (!cell) return false;
    if (ref.m) return !!cell.mark && cell.mark.id === ref.m;
    return !!cell.house && cell.house[ref.a] === ref.v;
  }

  // ------------------------------------------------------------------
  //  ヒントの 文（clue）
  // ------------------------------------------------------------------
  // loose：「なんけんめ」を、めじるしも かぞえて しまった ときも あう ことに する（こたえが 1けんに きまるかの 点検に つかう）
  function match(h, c, loose) {
    var n, o;
    switch (c.t) {
      case 'roof': case 'wall': case 'garden': case 'vehicle': case 'door': case 'window': return h[c.t] === c.v;
      case 'neg': return h[c.a] !== c.v;
      case 'neg2': return h[c.a] !== c.vs[0] && h[c.a] !== c.vs[1];
      case 'row': return h.row === c.v;
      case 'near': n = nb(h); return refOk(n.L, c.ref) || refOk(n.R, c.ref);
      case 'side': n = nb(h); return refOk(c.dir === 'R' ? n.L : n.R, c.ref);
      case 'between': n = nb(h); return (refOk(n.L, c.refs[0]) && refOk(n.R, c.refs[1])) || (refOk(n.L, c.refs[1]) && refOk(n.R, c.refs[0]));
      case 'opp': return refOk(nb(h).O, c.ref);
      case 'ord': o = ordOf(h); return o[c.dir] === c.k || (!!loose && o[c.dir + 'a'] === c.k);
      default: return true; // extra（いらない 文）
    }
  }
  function matchAll(h, clues, loose) { for (var i = 0; i < clues.length; i++) if (!match(h, clues[i], loose)) return false; return true; }
  function markName(areaId, id) { var m = area(areaId).marks; return (m[0].id === id ? m[0] : m[1]).n; }
  function refText(areaId, ref) {
    if (ref.m) return markName(areaId, ref.m);
    if (ref.a === 'roof') return ADJ[ref.v] + ' やねの いえ';
    if (ref.a === 'door') return ADJ[ref.v] + ' ドアの いえ';
    return GARDEN[ref.v].n + 'が ' + GARDEN[ref.v].rv + ' いえ';
  }
  var HEAD = { roof: 'やねの いろは、', wall: 'かべの いろは、', door: 'ドアの いろは、', window: 'まどの かたちは、' };
  // 【 】は だいじな ことば（ヒント2で いろが つく）
  function text(areaId, c) {
    switch (c.t) {
      case 'roof': case 'wall': case 'door': case 'window': return HEAD[c.t] + '【' + c.v + '】です。';
      case 'garden': return 'にわに、【' + GARDEN[c.v].n + '】が ' + GARDEN[c.v].v + '。';
      case 'vehicle': return 'いえの まえに、【' + VEHICLE[c.v].n + '】が ' + VEHICLE[c.v].v + '。';
      case 'neg':
        if (HEAD[c.a]) return HEAD[c.a] + '【' + c.v + '】【では ありません】。';
        if (c.a === 'garden') return 'にわに、【' + GARDEN[c.v].n + '】は 【' + GARDEN[c.v].nv + '】。';
        return 'いえの まえに、【' + VEHICLE[c.v].n + '】は 【' + VEHICLE[c.v].nv + '】。';
      case 'neg2': return HEAD[c.a] + '【' + c.vs[0] + '】【でも】 【' + c.vs[1] + '】【でも ありません】。';
      case 'row': return '【' + ROADS[c.v].n + '】に あります。';
      case 'near': return '【' + refText(areaId, c.ref) + '】の 【となり】に あります。';
      case 'side': return '【' + refText(areaId, c.ref) + '】の 【' + (c.dir === 'R' ? 'みぎ' : 'ひだり') + ' どなり】に あります。';
      case 'between': return '【' + refText(areaId, c.refs[0]) + '】と 【' + refText(areaId, c.refs[1]) + '】の 【あいだ】に あります。';
      case 'opp': return 'みちを はさんで、【' + refText(areaId, c.ref) + '】の 【むかい】に あります。';
      case 'ord': return 'ならんで いる いえの、【' + ordText(c) + '】です。';
      default: return c.s;
    }
  }
  function ordText(c) { var d = c.dir === 'R' ? 'みぎ' : 'ひだり'; return c.k === 1 ? 'いちばん ' + d : d + 'から ' + c.k + 'けんめ'; }
  // きろくに のこす しゅるいの なまえ（あとから かえない。きろくでは「・」で くぎるので、なまえに「・」は つかわない）
  function kind(c) {
    switch (c.t) {
      case 'roof': return 'やね';
      case 'wall': return 'かべ';
      case 'garden': return 'にわ';
      case 'vehicle': return 'のりもの';
      case 'door': return 'ドア';
      case 'window': return 'まど';
      case 'neg': return 'うちけし';
      case 'neg2': return 'うちけし（2つ）';
      case 'row': return 'みち';
      case 'near': return c.ref.m ? 'となり（めじるし）' : 'となり（いえ）';
      case 'side': return 'みぎ／ひだり';
      case 'between': return 'あいだ';
      case 'opp': return 'むかい';
      case 'ord': return 'なんけんめ';
      default: return 'いらない ぶん';
    }
  }
  function attrOf(c) { return LOOK.indexOf(c.t) >= 0 ? c.t : c.t === 'neg' || c.t === 'neg2' ? c.a : null; }

  // こたえの いえ h に ついて、ほんとうの ことを いう 文の こうほ
  function cellRefs(cell, more) {
    if (!cell) return [];
    if (cell.mark) return [{ m: cell.mark.id }];
    var r = [{ a: 'roof', v: cell.house.roof }];
    if (more) { r.push({ a: 'garden', v: cell.house.garden }); r.push({ a: 'door', v: cell.house.door }); }
    return r;
  }
  function cands(h, token) {
    var out = [], n = nb(h), others = houses(h.area).filter(function (x) { return x !== h; }), o;
    var add = function (t) { cands(h, t).forEach(function (c) { out.push(c); }); };
    switch (token) {
      case 'roof': case 'wall': case 'garden': case 'vehicle': case 'door': case 'window': return [{ t: token, v: h[token] }];
      case 'look': LOOK.forEach(add); return out;
      case 'neg':
        LOOK.forEach(function (a) {
          var seen = {};
          others.forEach(function (o) { if (o[a] !== h[a] && !seen[o[a]]) { seen[o[a]] = 1; out.push({ t: 'neg', a: a, v: o[a] }); } });
        });
        return out;
      case 'neg2': // 「あかでも あおでも ありません」
        ['roof', 'wall', 'door', 'window'].forEach(function (a) {
          var vs = [];
          others.forEach(function (o) { if (o[a] !== h[a] && vs.indexOf(o[a]) < 0) vs.push(o[a]); });
          for (var i = 0; i < vs.length; i++) for (var j = i + 1; j < vs.length; j++) out.push({ t: 'neg2', a: a, vs: [vs[i], vs[j]] });
        });
        return out;
      case 'row': return [{ t: 'row', v: h.row }];
      case 'nearM': [n.L, n.R].forEach(function (c) { if (c && c.mark) out.push({ t: 'near', ref: { m: c.mark.id } }); }); return out;
      case 'nearH': [n.L, n.R].forEach(function (c) { if (c && c.house) cellRefs(c, true).forEach(function (ref) { out.push({ t: 'near', ref: ref }); }); }); return out;
      case 'near': add('nearM'); add('nearH'); return out;
      case 'side':
        cellRefs(n.L).forEach(function (ref) { out.push({ t: 'side', dir: 'R', ref: ref }); });
        cellRefs(n.R).forEach(function (ref) { out.push({ t: 'side', dir: 'L', ref: ref }); });
        return out;
      case 'between':
        if (n.L && n.R) out.push({ t: 'between', refs: [cellRefs(n.L)[0], cellRefs(n.R)[0]] });
        return out;
      case 'opp': cellRefs(n.O, true).forEach(function (ref) { out.push({ t: 'opp', ref: ref }); }); return out;
      case 'ord': // めじるしを またいで かぞえる いいかたは しない
        o = ordOf(h);
        if (o.n >= 2 && !o.mL) out.push({ t: 'ord', dir: 'L', k: o.L });
        if (o.n >= 2 && !o.mR) out.push({ t: 'ord', dir: 'R', k: o.R });
        return out;
      case 'pos': add('near'); add('side'); add('between'); add('opp'); add('ord'); return out;
    }
    return out;
  }
  function posGroup(c) { return c.t === 'row' ? 'row' : c.t === 'near' || c.t === 'side' || c.t === 'between' || c.t === 'opp' || c.t === 'ord' ? 'place' : null; }
  // 文の くみあわせを ぜんぶ ならべる（おなじ ところを 2回 いわない）
  function combos(h, pat) {
    var res = [[]];
    pat.forEach(function (token) {
      var cs = cands(h, token), next = [];
      res.forEach(function (cur) {
        cs.forEach(function (c) {
          var a = attrOf(c), g = posGroup(c);
          for (var i = 0; i < cur.length; i++) {
            if (a && attrOf(cur[i]) === a) return;
            if (g && posGroup(cur[i]) === g) return;
          }
          next.push(cur.concat([c]));
        });
      });
      res = next;
    });
    return res;
  }
  function shuffle(a, rnd) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
  function pick(a, rnd) { return a[Math.floor(rnd() * a.length)]; }
  // その 文が ないと 1けんに きまらない 文の かず
  function needed(h, clues, set) {
    var k = 0;
    clues.forEach(function (c, i) {
      var rest = clues.filter(function (x, j) { return j !== i; });
      if (set.some(function (o) { return o !== h && matchAll(o, rest); })) k++;
    });
    return k;
  }
  // いろの ことばが ほかの ところに ある いえ（やねの あか と ドアの あか など）
  function colorTrap(o, clues) {
    var k = 0;
    clues.forEach(function (c) {
      if (c.t === 'roof' && (o.wall === c.v || o.door === c.v || VEHICLE[o.vehicle].c === c.v)) k++;
      if (c.t === 'wall' && (o.roof === c.v || o.door === c.v)) k++;
      if (c.t === 'door' && (o.roof === c.v || o.wall === c.v || VEHICLE[o.vehicle].c === c.v)) k++;
      if (c.t === 'vehicle' && VEHICLE[c.v].c && (o.roof === VEHICLE[c.v].c || o.door === VEHICLE[c.v].c)) k++;
    });
    return k;
  }

  /*
   * もんだいを 1つ つくる
   *   stage：STAGES の 1つ、target：こたえの いえ、qi：なんもんめ（0〜）
   *   かえす もの：{ target, shown:[いえ…], clues:[文…], need:ひつような 文の かず }
   *   かならず「文に ぜんぶ あう いえは 1けんだけ」に なります。
   */
  function makeQuestion(stage, target, qi, rnd) {
    rnd = rnd || Math.random;
    var all = houses(target.area), pats = stage.pats, q = null;
    // きまらない ときは、おなじ くみあわせに 見ための 文を 1つ 足す → つぎの くみあわせ → 見ための 文だけ、の じゅんに ためす
    var tries = [];
    pats.forEach(function (p, k) { var pp = pats[(qi + k) % pats.length]; tries.push(pp); if (pp.length < 4) tries.push(pp.concat(['look'])); });
    tries.push(['look', 'look'], ['look', 'look', 'look'], ['look', 'look', 'look', 'look']);
    for (var k = 0; k < tries.length && !q; k++) {
      var pat = tries[k];
      var cs = combos(target, pat);
      if (!cs.length) continue;
      if (stage.n >= all.length) {
        var best = -1, pool = [];
        cs.forEach(function (c) {
          if (all.some(function (o) { return o !== target && matchAll(o, c, true); })) return;
          var s = needed(target, c, all);
          if (s > best) { best = s; pool = [c]; } else if (s === best) pool.push(c);
        });
        if (pool.length) q = { target: target, shown: all.slice(), clues: pick(pool, rnd), need: best };
      } else {
        // 文に ぜんぶ あう いえが ほかに あっても、その いえを 出さなければ よい（出せる いえが たりる くみあわせだけ）
        var usable = cs.filter(function (c) { return all.filter(function (o) { return o !== target && !matchAll(o, c); }).length >= stage.n - 1; });
        if (!usable.length) continue;
        var c = pick(usable, rnd);
        var others = all.filter(function (o) { return o !== target && !matchAll(o, c); });
        var chosen = [];
        // 1つの 文だけ あわない いえを 入れる（ぜんぶの 文を よまないと きまらないように）
        c.forEach(function (x, i) {
          var rest = c.filter(function (y, j) { return j !== i; });
          var p = others.filter(function (o) { return chosen.indexOf(o) < 0 && matchAll(o, rest); });
          if (p.length && chosen.length < stage.n - 1) chosen.push(pick(p, rnd));
        });
        // のこりは、にて いる いえ（あう 文が 多い・おなじ いろが ほかの ところに ある）から 入れる
        var restO = shuffle(others.filter(function (o) { return chosen.indexOf(o) < 0; }), rnd);
        var score = function (o) { return c.filter(function (x) { return match(o, x); }).length + colorTrap(o, c) * 1.5; };
        restO.sort(function (x, y) { return score(y) - score(x); });
        while (chosen.length < stage.n - 1 && restO.length) chosen.push(restO.shift());
        var shown = shuffle(chosen.concat([target]), rnd);
        q = { target: target, shown: shown, clues: c, need: needed(target, c, shown) };
      }
    }
    if (!q) return null;
    q.clues = shuffle(q.clues, rnd);
    for (var e = 0; e < (stage.extra || 0); e++) {
      var o2 = pick(all.filter(function (o) { return o !== target; }), rnd);
      var diff = function (a) { var v = all.filter(function (o) { return o[a] !== target[a]; }); return v.length ? pick(v, rnd)[a] : o2[a]; };
      var tpl = pick(EXTRA, rnd), cv = diff('roof'), dv = diff('door'), gv = diff('garden'), vv = diff('vehicle');
      var ex = { t: 'extra', s: tpl.replace('{c}', cv).replace('{d}', dv).replace('{g}', GARDEN[gv].n).replace('{v}', VEHICLE[vv].n) };
      // trap：この 文に つられると えらびやすい いえ（やねが その いろ など）
      if (tpl.indexOf('{c}') >= 0) ex.trap = { a: 'roof', v: cv }; else if (tpl.indexOf('{d}') >= 0) ex.trap = { a: 'door', v: dv }; else if (tpl.indexOf('{g}') >= 0) ex.trap = { a: 'garden', v: gv }; else if (tpl.indexOf('{v}') >= 0) ex.trap = { a: 'vehicle', v: vv };
      q.clues.splice(Math.floor(rnd() * (q.clues.length + 1)), 0, ex);
    }
    return q;
  }
  // 1かいぶん（5もん）の こたえの いえを きめる
  function pickTargets(stage, rnd, count) {
    rnd = rnd || Math.random; count = count || 5;
    if (stage.area === 'all') {
      return shuffle(AREAS, rnd).slice(0, count).map(function (a) { return pick(houses(a.id), rnd).id; });
    }
    var hs = houses(stage.area);
    var list = stage.who === 'a' ? hs.slice(0, 5) : stage.who === 'b' ? hs.slice(5) : shuffle(hs, rnd).slice(0, 5);
    return shuffle(list, rnd).slice(0, count).map(function (h) { return h.id; });
  }
  function titleOf(n) { var t = TITLES[0]; TITLES.forEach(function (x) { if (n >= x[0]) t = x; }); return t[1]; }

  return {
    IMAGES: IMAGES, ROOF: ROOF, WALL: WALL, DOOR: DOOR, WINDOW: WINDOW, ADJ: ADJ, GARDEN: GARDEN, VEHICLE: VEHICLE, AREAS: AREAS, HOUSES: HOUSES, STAGES: STAGES, TITLES: TITLES, LOOK: LOOK, ROADS: ROADS, SLOTS: SLOTS,
    area: area, houses: houses, cells: cells, house: house, match: match, matchAll: matchAll, text: text, kind: kind, refText: refText, ordText: ordText, ordOf: ordOf,
    makeQuestion: makeQuestion, pickTargets: pickTargets, titleOf: titleOf, combos: combos, needed: needed, reset: reset,
  };
})();
if (typeof module !== 'undefined') module.exports = OUCHI;
