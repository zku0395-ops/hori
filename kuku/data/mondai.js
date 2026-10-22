// 忍者九九修行：お城の 階・ステージ・となえかた・たからもの・よろずやの データ
// （GitHub Pages から よみこみます。ここを直して main に入れると、Apps Script を貼り直さなくても 反映されます）
(function () {
  // ---- 九九の となえかた（教科書の よみかた）。[まえ, こたえ] ----
  const TONAE = {
    1: [['いんいちが', 'いち'], ['いんにが', 'に'], ['いんさんが', 'さん'], ['いんしが', 'し'], ['いんごが', 'ご'], ['いんろくが', 'ろく'], ['いんしちが', 'しち'], ['いんはちが', 'はち'], ['いんくが', 'く']],
    2: [['にいちが', 'に'], ['ににんが', 'し'], ['にさんが', 'ろく'], ['にしが', 'はち'], ['にご', 'じゅう'], ['にろく', 'じゅうに'], ['にしち', 'じゅうし'], ['にはち', 'じゅうろく'], ['にく', 'じゅうはち']],
    3: [['さんいちが', 'さん'], ['さんにが', 'ろく'], ['さざんが', 'く'], ['さんし', 'じゅうに'], ['さんご', 'じゅうご'], ['さぶろく', 'じゅうはち'], ['さんしち', 'にじゅういち'], ['さんぱ', 'にじゅうし'], ['さんく', 'にじゅうしち']],
    4: [['しいちが', 'し'], ['しにが', 'はち'], ['しさん', 'じゅうに'], ['しし', 'じゅうろく'], ['しご', 'にじゅう'], ['しろく', 'にじゅうし'], ['ししち', 'にじゅうはち'], ['しは', 'さんじゅうに'], ['しく', 'さんじゅうろく']],
    5: [['ごいちが', 'ご'], ['ごに', 'じゅう'], ['ごさん', 'じゅうご'], ['ごし', 'にじゅう'], ['ごご', 'にじゅうご'], ['ごろく', 'さんじゅう'], ['ごしち', 'さんじゅうご'], ['ごは', 'しじゅう'], ['ごっく', 'しじゅうご']],
    6: [['ろくいちが', 'ろく'], ['ろくに', 'じゅうに'], ['ろくさん', 'じゅうはち'], ['ろくし', 'にじゅうし'], ['ろくご', 'さんじゅう'], ['ろくろく', 'さんじゅうろく'], ['ろくしち', 'しじゅうに'], ['ろくは', 'しじゅうはち'], ['ろっく', 'ごじゅうし']],
    7: [['しちいちが', 'しち'], ['しちに', 'じゅうし'], ['しちさん', 'にじゅういち'], ['しちし', 'にじゅうはち'], ['しちご', 'さんじゅうご'], ['しちろく', 'しじゅうに'], ['しちしち', 'しじゅうく'], ['しちは', 'ごじゅうろく'], ['しちく', 'ろくじゅうさん']],
    8: [['はちいちが', 'はち'], ['はちに', 'じゅうろく'], ['はちさん', 'にじゅうし'], ['はちし', 'さんじゅうに'], ['はちご', 'しじゅう'], ['はちろく', 'しじゅうはち'], ['はちしち', 'ごじゅうろく'], ['はっぱ', 'ろくじゅうし'], ['はっく', 'しちじゅうに']],
    9: [['くいちが', 'く'], ['くに', 'じゅうはち'], ['くさん', 'にじゅうしち'], ['くし', 'さんじゅうろく'], ['くご', 'しじゅうご'], ['くろく', 'ごじゅうし'], ['くしち', 'ろくじゅうさん'], ['くは', 'しちじゅうに'], ['くく', 'はちじゅういち']],
  };

  // ---- お城の 階（下から）。a：その階の だん ----
  // treasure：しけんに ごうかく すると もらえる たからもの、karakuri：とける からくり
  const FLOORS = [
    { f: 1, a: 5, color: '#0ea5e9', treasure: 'makimono', karakuri: 'かくし とびらが ひらいた！' },
    { f: 2, a: 2, color: '#22c55e', treasure: 'sensu', karakuri: 'まわる かべが くるりと まわった！' },
    { f: 3, a: 3, color: '#eab308', treasure: 'tama', karakuri: 'ひみつの はしごが おりて きた！' },
    { f: 4, a: 4, color: '#f97316', treasure: 'tsubo', karakuri: 'たたみが ひっくりかえって、かいだんが でて きた！' },
    { f: 5, a: 6, color: '#ec4899', treasure: 'kagami', karakuri: 'からくり にんぎょうが みちを あけて くれた！' },
    { f: 6, a: 7, color: '#a855f7', treasure: 'kobanbako', karakuri: 'かけじくの うらに かくれた みちが あった！' },
    { f: 7, a: 8, color: '#6366f1', treasure: 'kabuto', karakuri: 'てんじょうから なわばしごが おりて きた！' },
    { f: 8, a: 9, color: '#ef4444', treasure: 'hougyoku', karakuri: 'おもい いしの とびらが ごごごと うごいた！' },
    { f: 9, a: 1, color: '#14b8a6', treasure: 'katana', karakuri: 'さいごの とびらが ひらいた！ てんしゅかくへ いけるよ！' },
  ];

  // ---- たからもの（9かい ＋ てんしゅかく） ----
  const TREASURES = [
    { id: 'makimono', name: 'ひみつの まきもの', e: '📜', where: '1かい（5の だん）' },
    { id: 'sensu', name: 'ぎんの せんす', e: '🪭', where: '2かい（2の だん）' },
    { id: 'tama', name: 'にじいろの たま', e: '🔮', where: '3かい（3の だん）' },
    { id: 'tsubo', name: 'せんねん まえの つぼ', e: '🏺', where: '4かい（4の だん）' },
    { id: 'kagami', name: 'ふしぎな かがみ', e: '🪞', where: '5かい（6の だん）' },
    { id: 'kobanbako', name: 'こばんの はこ', e: '💰', where: '6かい（7の だん）' },
    { id: 'kabuto', name: 'とのさまの かぶと', e: '🪖', where: '7かい（8の だん）' },
    { id: 'hougyoku', name: 'りゅうの ほうぎょく', e: '💎', where: '8かい（9の だん）' },
    { id: 'katana', name: 'でんせつの かたな', e: '🗡️', where: '9かい（1の だん）' },
    { id: 'shachihoko', name: 'きんの しゃちほこ', e: '🐟', where: 'てんしゅかく' },
  ];

  // ---- ステージ ----
  // kind：per（1つ分は いくつ）・phrase（〇の △つ分）・shiki（しきと ぜんぶで）
  //       deai（⓪であう）・tonae（①となえる）・junban（②じゅんばん）・bara（③ばらばら）・shiken（④にんじゃ しけん）
  //       mix（ふくしゅう・てんしゅかく）・findEq（こたえから しきを さがす）・blank（□を もとめる）
  const STEP = [
    { s: 0, title: 'であう', icon: '👀', kind: 'deai' },
    { s: 1, title: 'となえる', icon: '🗣️', kind: 'tonae' },
    { s: 2, title: 'じゅんばん', icon: '🔢', kind: 'junban' },
    { s: 3, title: 'ばらばら', icon: '🔀', kind: 'bara' },
    { s: 4, title: 'にんじゃ しけん', icon: '📜', kind: 'shiken' },
  ];
  const INTRO = [
    (a) => `${a}の だんに であうよ。おぼんの しゅりけんが ${a}まいずつ ふえて いくよ。ぜんぶで なんまいかな？`,
    (a) => `${a}の だんを となえよう。わたしの こえを きいて、いっしょに こえに だしてね。`,
    (a) => `${a} × 1 から じゅんばんに こたえよう。1つ まえの こたえに ${a}を たすと、つぎの こたえだよ。`,
    (a) => `こんどは ${a}の だんが ばらばらに でるよ。しのびあしで すすもう。`,
    (a) => `にんじゃ しけん！ ${a}の だんを ばらばらに 9もん。ごうかく したら、たからばこが ひらくよ。`,
  ];
  const STAGES = [
    { id: '0-1', iri: true, title: '1つ分は いくつ？', kind: 'per', as: [2, 3, 4, 5], bs: [2, 3, 4, 5],
      intro: 'しのびの いりぐちだよ。おぼんに しゅりけんが おなじ かずずつ のって いるね。1つの おぼんに なんまい あるかな？' },
    { id: '0-2', iri: true, title: '〇の △つ分', kind: 'phrase', as: [2, 3, 4, 5], bs: [2, 3, 4, 5],
      intro: '「3まいの 4つ分」の ように、1つ分の かずと、いくつ分かを あわせて いって みよう。' },
    { id: '0-3', iri: true, title: 'かけざんの しき', kind: 'shiki', as: [2, 3, 4, 5], bs: [2, 3, 4, 5],
      intro: '「3まいの 4つ分」は、しきで 3 × 4 と かくよ。ぜんぶで なんまいかも かんがえよう。' },
  ];
  FLOORS.forEach(fl => STEP.forEach(sp => {
    STAGES.push({ id: `${fl.a}-${sp.s}`, f: fl.f, a: fl.a, s: sp.s, title: sp.title, kind: sp.kind, intro: INTRO[sp.s](fl.a) });
  }));
  STAGES.push({ id: 'T', tenshu: true, title: 'てんしゅかくの しけん', kind: 'mix', all: true,
    intro: 'てんしゅかくに ついたよ！ さいごの しけんは、1から 9の だんが ぜんぶ まざって でるよ。' });
  STAGES.push({ id: 'R', review: true, title: 'ふくしゅうの へや', kind: 'mix',
    intro: 'ふくしゅうの へやだよ。これまでに ごうかく した だんが まざって でるよ。にがてな くくが すこし おおめに でるよ。' });
  STAGES.push({ id: 'H1', hatten: true, title: 'こたえから しきを さがす', kind: 'findEq',
    intro: 'はってん①。こたえに なる くくは どれかな？ さがして みよう。' });
  STAGES.push({ id: 'H2', hatten: true, title: '□を もとめる', kind: 'blank',
    intro: 'はってん②。3 × □ ＝ 12 の □に はいる かずを かんがえよう。' });

  // ---- にんじゃの すがた ----
  // いろ（ずきん・ふく・おびの セット）。はじめから えらべる 6いろ と、よろずやで かう とくべつな いろ
  const COLORS = [
    { id: 'aka', name: 'あか', zukin: '#dc2626', fuku: '#b91c1c', obi: '#fde047' },
    { id: 'ao', name: 'あお', zukin: '#2563eb', fuku: '#1e40af', obi: '#fde047' },
    { id: 'midori', name: 'みどり', zukin: '#16a34a', fuku: '#166534', obi: '#fde047' },
    { id: 'kiiro', name: 'きいろ', zukin: '#eab308', fuku: '#ca8a04', obi: '#dc2626' },
    { id: 'murasaki', name: 'むらさき', zukin: '#7c3aed', fuku: '#5b21b6', obi: '#fde047' },
    { id: 'kuro', name: 'くろ', zukin: '#334155', fuku: '#1e293b', obi: '#ef4444' },
  ];

  // ---- よろずや（ぶき・もちもの・あいぼう は 10こずつ。ねだんは ふつう・ごうか・ちょうごうか・でんせつ） ----
  // e：絵文字、svg：自作の 絵（しゅりけん など 絵文字が ない もの）
  const ITEM_CATS = [
    { id: 'buki', name: 'ぶき', icon: '⚔️', items: [
      { id: 'b_shuriken', n: 'しゅりけん', svg: 'shuriken', p: 5 },
      { id: 'b_kunai', n: 'くない', e: '🗡️', p: 5 },
      { id: 'b_makibishi', n: 'まきびし', svg: 'makibishi', p: 5 },
      { id: 'b_bou', n: 'ぼう', svg: 'bou', p: 5 },
      { id: 'b_yumi', n: 'ゆみや', e: '🏹', p: 15 },
      { id: 'b_tessen', n: 'てっせん', e: '🪭', p: 15 },
      { id: 'b_kusari', n: 'くさりがま', e: '⛓️', p: 15 },
      { id: 'b_katana', n: 'かたな', svg: 'katana', p: 30 },
      { id: 'b_nitou', n: 'にとうりゅう', e: '⚔️', p: 30 },
      { id: 'b_meitou', n: 'でんせつの めいとう', svg: 'meitou', p: 60 },
    ] },
    { id: 'mochi', name: 'もちもの', icon: '🎒', items: [
      { id: 'm_makimono', n: 'まきもの', e: '📜', p: 5 },
      { id: 'm_kemuri', n: 'けむりだま', svg: 'kemuri', p: 5 },
      { id: 'm_kaginawa', n: 'かぎなわ', e: '🪝', p: 5 },
      { id: 'm_chouchin', n: 'ちょうちん', e: '🏮', p: 5 },
      { id: 'm_onigiri', n: 'おにぎり', e: '🍙', p: 15 },
      { id: 'm_fue', n: 'よびぶえ', e: '🪈', p: 15 },
      { id: 'm_omamori', n: 'おまもり', e: '🧧', p: 15 },
      { id: 'm_horagai', n: 'ほらがい', e: '🐚', p: 30 },
      { id: 'm_hyoutan', n: 'ひょうたん', svg: 'hyoutan', p: 30 },
      { id: 'm_suishou', n: 'せんにんの すいしょう', e: '🔮', p: 60 },
    ] },
    { id: 'aibou', name: 'あいぼう', icon: '🐾', items: [
      { id: 'a_inu', n: 'いぬ', e: '🐕', p: 5 },
      { id: 'a_neko', n: 'ねこ', e: '🐈', p: 5 },
      { id: 'a_kaeru', n: 'かえる', e: '🐸', p: 5 },
      { id: 'a_usagi', n: 'うさぎ', e: '🐇', p: 5 },
      { id: 'a_taka', n: 'たか', e: '🦅', p: 15 },
      { id: 'a_kitsune', n: 'きつね', e: '🦊', p: 15 },
      { id: 'a_fukurou', n: 'ふくろう', e: '🦉', p: 15 },
      { id: 'a_tanuki', n: 'たぬき', e: '🦝', p: 30 },
      { id: 'a_shika', n: 'しか', e: '🦌', p: 30 },
      { id: 'a_ryu', n: 'りゅう', e: '🐉', p: 60 },
    ] },
    { id: 'iro', name: 'とくべつな いろ', icon: '🎨', items: [
      { id: 'c_sakura', n: 'さくらもよう', color: { id: 'sakura', name: 'さくらもよう', zukin: '#f472b6', fuku: '#fbcfe8', obi: '#be185d', pattern: 'sakura' }, p: 15 },
      { id: 'c_gin', n: 'ぎんいろ', color: { id: 'gin', name: 'ぎんいろ', zukin: '#94a3b8', fuku: '#cbd5e1', obi: '#1e3a8a', pattern: 'shine' }, p: 30 },
      { id: 'c_kin', n: 'きんいろ', color: { id: 'kin', name: 'きんいろ', zukin: '#d97706', fuku: '#fbbf24', obi: '#7f1d1d', pattern: 'shine' }, p: 60 },
      { id: 'c_niji', n: 'にじいろ', color: { id: 'niji', name: 'にじいろ', zukin: '#ef4444', fuku: '#3b82f6', obi: '#22c55e', pattern: 'niji' }, p: 60 },
    ] },
  ];

  // ---- しょうごう（f：ごうかく した 階の かず、all：はってんを ぜんぶ クリア） ----
  const TITLES = [
    { n: 'みならい にんじゃ', f: 0 },
    { n: 'げにん', f: 3 },
    { n: 'ちゅうにん', f: 6 },
    { n: 'じょうにん', f: 9 },
    { n: 'にんじゃ マスター', all: true },
  ];

  (typeof window !== 'undefined' ? window : globalThis).KUKU_DATA = { TONAE, FLOORS, TREASURES, STEP, STAGES, COLORS, ITEM_CATS, TITLES };
})();
