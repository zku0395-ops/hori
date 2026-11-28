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

  // ---- たたかう あいて（④にんじゃ しけん・てんしゅかく）と へやの絵 ----
  // f：階（T＝てんしゅかく）、e：絵が ないときの 絵文字、room：へやの説明（絵は img/room_<f>.webp、あいては img/enemy_<id>.webp）
  // hello：はじめの ことば、escape：にげる ときの ことば
  const ENEMIES = [
    { id: 'mihari', f: 1, name: 'みはりの にんじゃ', e: '🥷', room: '明るい 板の間の ろうか', hello: 'くせものだ！ ここは とおさんぞ！', escape: 'ふん、きょうは みのがして やる！' },
    { id: 'karakasa', f: 2, name: 'からかさおばけ', e: '☂️', room: 'しょうじが ならぶ ろうか', hello: 'けけけ！ おどろかして やるぞ〜！', escape: 'けけっ、また あそぼうな〜！' },
    { id: 'kotengu', f: 3, name: 'こてんぐ', e: '🐦', room: '太い はりと 階段の ある 広間', hello: 'わしの はやわざに ついて こられるかな？', escape: 'まだまだ しゅぎょうが たりんのう！' },
    { id: 'rokuro', f: 4, name: 'ろくろくび', e: '👻', room: 'ふすまに 月の絵の ある たたみの へや', hello: 'くびが のびるぞ〜。こわいか〜？', escape: 'くびを ながく して まって おるぞ〜' },
    { id: 'akaoni', f: 5, name: 'あかおに', e: '👹', room: 'うす暗い たたみの へや', hello: 'がおー！ おれさまと しょうぶだ！', escape: 'がはは！ つぎは まけんぞ！' },
    { id: 'musha', f: 6, name: 'よろいの むしゃ', e: '🛡️', room: '武具が かざって ある へや', hello: 'いざ じんじょうに しょうぶ！', escape: 'みごとな こころいき。また まいれ！' },
    { id: 'hannya', f: 7, name: 'はんにゃ', e: '🎭', room: '夜の ろうか', hello: 'ふっふっふ……この おめんが こわいか？', escape: 'ふっふっふ……また あおう……' },
    { id: 'daitengu', f: 8, name: 'だいてんぐ', e: '👺', room: 'ろうそくの 明かりの 広間', hello: 'わしが この やまの だいてんぐじゃ！', escape: 'かっかっか！ でなおして まいれ！' },
    { id: 'kashira', f: 9, name: 'くろにんじゃの かしら', e: '🥷', room: '金の ふすまの 大広間', hello: 'ここまで きたか。だが、ここで おわりだ！', escape: 'その うででは まだ とおせんな。' },
    { id: 'shogun', f: 'T', name: 'からくり だいしょうぐん', e: '🤖', room: 'てんしゅかくの 最上階（まどの外に 満月）', hello: 'ガシャン！ ワレハ からくり だいしょうぐん。しろの たからを まもる！', escape: 'ガシャン……また ちょうせん セヨ……' },
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
    (a, en) => `にんじゃ しけん！ ${en.name}が まちかまえて いるよ。${a}の だんを ばらばらに 9もん。まちがえずに こたえると、しゅりけんが あたるよ。たおしたら、たからばこが ひらくよ。`,
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
    STAGES.push({ id: `${fl.a}-${sp.s}`, f: fl.f, a: fl.a, s: sp.s, title: sp.title, kind: sp.kind, intro: INTRO[sp.s](fl.a, ENEMIES.find(en => en.f === fl.f)) });
  }));
  STAGES.push({ id: 'T', tenshu: true, title: 'てんしゅかくの しけん', kind: 'mix', all: true,
    intro: 'てんしゅかくに ついたよ！ からくり だいしょうぐんが まって いるよ。1から 9の だんが ぜんぶ まざって でるよ。' });
  STAGES.push({ id: 'R', review: true, title: 'ふくしゅうの へや', kind: 'mix',
    intro: 'ふくしゅうの へやだよ。これまでに ごうかく した だんが まざって でるよ。にがてな くくが すこし おおめに でるよ。' });
  STAGES.push({ id: 'H1', hatten: true, title: 'こたえから しきを さがす', kind: 'findEq',
    intro: 'はってん①。こたえに なる くくは どれかな？ さがして みよう。' });
  STAGES.push({ id: 'H2', hatten: true, title: '□を もとめる', kind: 'blank',
    intro: 'はってん②。3 × □ ＝ 12 の □に はいる かずを かんがえよう。' });

  // ---- ぼうけん（てんしゅかくを クリアすると ひらく） ----
  // 8かしょの ばしょ。bg：はいけいの説明（絵は img/bouken_<p>.webp）
  const PLACES = [
    { p: 1, name: 'じょうかまち', e: '🏘️', color: '#f59e0b', bg: '夜の 城下町の 路地裏（ちょうちんの 明かり）',
      intro: 'おしろの そとへ ぼうけんに でよう！ さいしょは よるの じょうかまち。あやしい かげが うごいて いるよ。' },
    { p: 2, name: 'たけやぶ', e: '🎋', color: '#16a34a', bg: '月明かりの 竹やぶの 小道',
      intro: 'たけやぶに ついたよ。かぜで たけが ざわざわ……。なにかが かくれて いるよ。' },
    { p: 3, name: 'やまでら', e: '🛕', color: '#a16207', bg: '山寺の 境内（石灯籠と 本堂）',
      intro: 'やまの うえの おてらだよ。ふしぎな ようかいたちが すんで いるよ。' },
    { p: 4, name: 'かわら', e: '🏞️', color: '#0ea5e9', bg: '夕方の 川原（あしと 石ころ）',
      intro: 'かわらに ついたよ。みずの なかから だれかが こっちを みて いるよ。' },
    { p: 5, name: 'ゆきやま', e: '🏔️', color: '#60a5fa', bg: '吹雪の 雪山（針葉樹）',
      intro: 'ゆきやまだよ。さむい さむい！ ふぶきの なかに あいてが まって いるよ。' },
    { p: 6, name: 'ひのやま', e: '🌋', color: '#ef4444', bg: '火山の 岩場（赤い 溶岩）',
      intro: 'ひのやまに ついたよ。あつい あつい！ ほのおの あいてに きを つけて。' },
    { p: 7, name: 'うみべ・ふね', e: '⛵', color: '#0891b2', bg: '夜の 海と 大きな 帆船の 甲板',
      intro: 'うみべから ふねに のったよ。なみの うえで たたかおう！' },
    { p: 8, name: 'おにがしま', e: '👹', color: '#7c3aed', bg: '鬼ヶ島の 岩の 門と 宝の 山',
      intro: 'いよいよ さいごの おにがしま！ おにの だいおうを たおして、ぼうけんを クリアしよう！' },
  ];
  // 48たい（ばしょごとに ふつう 5たい ＋ ボス）。n：じゅんばん（6＝ボス）、e：絵が ないときの 絵文字（絵は img/enemy_<id>.webp）
  // hello：はじめの ことば、item：たおすと はじめの 1かいだけ もらえる おみやげ
  const BOUKEN = [
    // 1 じょうかまち
    { id: 'bk_dorobo', p: 1, n: 1, name: 'どろぼう にんじゃ', e: '🥷', hello: 'その こばん、いただきだ！', item: 's_dango' },
    { id: 'bk_nekomata', p: 1, n: 2, name: 'ねこまた', e: '🐈‍⬛', hello: 'にゃっはっは！ しっぽが 2ほん あるのさ。', item: 's_furin' },
    { id: 'bk_nopperabo', p: 1, n: 3, name: 'のっぺらぼう', e: '😶', hello: 'ばあっ！ かおが ないだろう〜？', item: 's_koinobori' },
    { id: 'bk_chochin', p: 1, n: 4, name: 'ちょうちん おばけ', e: '🏮', hello: 'べろべろば〜！ よみちは きけんだよ〜。', item: 's_senbei' },
    { id: 'bk_kasabushi', p: 1, n: 5, name: 'かさ ぶし', e: '👒', hello: 'あみがさの したから、ずっと みて おったぞ。', item: 's_tako' },
    { id: 'bk_kagenushi', p: 1, n: 6, boss: true, name: 'まちの かげぬし', e: '🌑', hello: 'この まちの よるは わしの もの。かげに のみこまれるが よい！', item: 's_kagi' },
    // 2 たけやぶ
    { id: 'bk_kamaitachi', p: 2, n: 1, name: 'かまいたち', e: '🌪️', hello: 'ひゅるるる〜！ かぜより はやいぞ！', item: 's_ocha' },
    { id: 'bk_takenoko', p: 2, n: 2, name: 'たけのこ こぞう', e: '🎍', hello: 'にょきにょき！ ぼくの せは まだまだ のびるよ！', item: 's_tanabata' },
    { id: 'bk_kitsunebi', p: 2, n: 3, name: 'きつねび', e: '🔥', hello: 'ゆら〜り ゆらり。どっちが ほんものかな〜？', item: 's_kuri' },
    { id: 'bk_bakedanuki', p: 2, n: 4, name: 'ばけだぬき', e: '🦝', hello: 'ぽんぽこ！ なんにでも ばけて みせるぞ！', item: 's_kinoko' },
    { id: 'bk_takeninja', p: 2, n: 5, name: 'たけやぶ にんじゃ', e: '🥷', hello: 'たけの かげに かくれて いたのさ！', item: 's_ohashi' },
    { id: 'bk_kyubi', p: 2, n: 6, boss: true, name: 'きゅうびの きつね', e: '🦊', hello: 'こんこん……9ほんの しっぽの ちからを みせて あげる。', item: 's_houju' },
    // 3 やまでら
    { id: 'bk_hitotsume', p: 3, n: 1, name: 'ひとつめ こぞう', e: '👁️', hello: 'じーっ……おおきな めで みはって いるぞ。', item: 's_kane' },
    { id: 'bk_nurikabe', p: 3, n: 2, name: 'ぬりかべ', e: '🧱', hello: 'ぬ〜り〜か〜べ〜。ここは とおれないぞ〜。', item: 's_hasu' },
    { id: 'bk_azukiarai', p: 3, n: 3, name: 'あずきあらい', e: '🫘', hello: 'しょきしょき……あずき あらおか、くく とこか〜。', item: 's_rousoku' },
    { id: 'bk_tsurube', p: 3, n: 4, name: 'つるべおとし', e: '🪣', hello: 'うえから どすーん！ びっくり したか？', item: 's_juzu' },
    { id: 'bk_yamabushi', p: 3, n: 5, name: 'やまぶし にんじゃ', e: '📿', hello: 'やまで きたえた わざを うけて みよ！', item: 's_azuki' },
    { id: 'bk_oonyudo', p: 3, n: 6, boss: true, name: 'おおにゅうどう', e: '🗿', hello: 'みあげるほど おおきいぞ〜。わしに かてるかな？', item: 's_suzu' },
    // 4 かわら
    { id: 'bk_kogappa', p: 4, n: 1, name: 'こがっぱ', e: '🥒', hello: 'きゅうり くれたら とおして あげても いいよ！', item: 's_kyuri' },
    { id: 'bk_oogaeru', p: 4, n: 2, name: 'おおがえる', e: '🐸', hello: 'げろげろ！ ひとのみに して やるぞ！', item: 's_tsurizao' },
    { id: 'bk_kawauso', p: 4, n: 3, name: 'かわうそ', e: '🦦', hello: 'すいすい〜。かわの なかは おいらの もの！', item: 's_hane' },
    { id: 'bk_namazu', p: 4, n: 4, name: 'なまず おばけ', e: '🐟', hello: 'ぐらぐら〜っ！ じめんを ゆらして やるぞ！', item: 's_ishi' },
    { id: 'bk_suiton', p: 4, n: 5, name: 'すいとん にんじゃ', e: '💧', hello: 'みずの なかから ずっと まって いたぞ！', item: 's_suika' },
    { id: 'bk_kappaoyabun', p: 4, n: 6, boss: true, name: 'かっぱの おやぶん', e: '🐢', hello: 'おれさまが かわの おやぶんだ！ すもうでも くくでも まけんぞ！', item: 's_sara' },
    // 5 ゆきやま
    { id: 'bk_yukinko', p: 5, n: 1, name: 'ゆきんこ', e: '⛄', hello: 'ゆきがっせんしよう！ えいっ！', item: 's_sori' },
    { id: 'bk_tsurara', p: 5, n: 2, name: 'つらら おばけ', e: '🧊', hello: 'つーん！ つめたい つららだぞ〜。', item: 's_tebukuro' },
    { id: 'bk_yukidaruma', p: 5, n: 3, name: 'ゆきだるま むしゃ', e: '☃️', hello: 'ころころ ころがって、おおきく なったぞ！', item: 's_nabe' },
    { id: 'bk_fubuki', p: 5, n: 4, name: 'ふぶき にんじゃ', e: '🌨️', hello: 'ふぶきに まぎれて しのびよったぞ！', item: 's_yakiimo' },
    { id: 'bk_kooriookami', p: 5, n: 5, name: 'こおり おおかみ', e: '🐺', hello: 'うおおーん！ ゆきやまは わしらの なわばりだ！', item: 's_erimaki' },
    { id: 'bk_yukionna', p: 5, n: 6, boss: true, name: 'ゆきおんな', e: '❄️', hello: 'ふう〜っ……こおりの いきで かためて あげましょう。', item: 's_kesshou' },
    // 6 ひのやま
    { id: 'bk_hinotama', p: 6, n: 1, name: 'ひのたま', e: '🔥', hello: 'ぼわっ！ あちちち、ちかよると あぶないぞ！', item: 's_hanabi' },
    { id: 'bk_kanezumi', p: 6, n: 2, name: 'かえん ねずみ', e: '🐀', hello: 'ちゅちゅっ！ ほのおの けがわは あったかいぞ！', item: 's_tamago' },
    { id: 'bk_iwaoni', p: 6, n: 3, name: 'いわ おに', e: '🪨', hello: 'ごつごつ！ いわの からだは かたいぞ！', item: 's_oke' },
    { id: 'bk_wanyudo', p: 6, n: 4, name: 'わにゅうどう', e: '🛞', hello: 'ごろごろごろ〜！ ひの くるまが とおるぞ！', item: 's_tougarashi' },
    { id: 'bk_kaenninja', p: 6, n: 5, name: 'かえん にんじゃ', e: '🥷', hello: 'ほのおの じゅつを みせて やる！', item: 's_hiuchi' },
    { id: 'bk_kaenryu', p: 6, n: 6, boss: true, name: 'かえんりゅう', e: '🐲', hello: 'ごおおお！ ひのやまの ぬし、かえんりゅう さまだ！', item: 's_uroko' },
    // 7 うみべ・ふね
    { id: 'bk_funayurei', p: 7, n: 1, name: 'ふなゆうれい', e: '👻', hello: 'ひしゃく かして〜。うらめしや〜。', item: 's_kaigara' },
    { id: 'bk_oodako', p: 7, n: 2, name: 'おおだこ', e: '🐙', hello: '8ほんの あしで つかまえて やるぞ！', item: 's_ebi' },
    { id: 'bk_kanimusha', p: 7, n: 3, name: 'かに むしゃ', e: '🦀', hello: 'ちょきちょき！ よこあるきで せめるぞ！', item: 's_chizu' },
    { id: 'bk_kaizoku', p: 7, n: 4, name: 'かいぞく にんじゃ', e: '🏴‍☠️', hello: 'この ふねの たからは わたさんぞ！', item: 's_rashinban' },
    { id: 'bk_sameotoko', p: 7, n: 5, name: 'さめ おとこ', e: '🦈', hello: 'がぶがぶっ！ うみの なかでは まけないぞ！', item: 's_ikari' },
    { id: 'bk_umibozu', p: 7, n: 6, boss: true, name: 'うみぼうず', e: '🌊', hello: 'ざっぱーん！ うみの そこから きたぞ〜。ふねを しずめて やる！', item: 's_shinju' },
    // 8 おにがしま
    { id: 'bk_kooni', p: 8, n: 1, name: 'こおに', e: '👺', hello: 'おにごっこ しようぜ！ おれが おにだけどな！', item: 's_momo' },
    { id: 'bk_aooni', p: 8, n: 2, name: 'あおおに', e: '👹', hello: 'あかおにの あにきの かたきだ！', item: 's_taiko' },
    { id: 'bk_kioni', p: 8, n: 3, name: 'きいろ おに', e: '👹', hello: 'ぴかぴか きいろの かなぼうを くらえ！', item: 's_hata' },
    { id: 'bk_midorioni', p: 8, n: 4, name: 'みどり おに', e: '👹', hello: 'どすこい！ ちからくらべなら まけないぞ！', item: 's_okane' },
    { id: 'bk_monban', p: 8, n: 5, name: 'おにの もんばん', e: '🚪', hello: 'この もんの さきへは いかせんぞ！', item: 's_sakura' },
    { id: 'bk_daiou', p: 8, n: 6, boss: true, name: 'おにの だいおう', e: '👑', hello: 'がっはっは！ よくぞ ここまで きた。わしが おにがしまの だいおうだ！', item: 's_oukan' },
  ];
  // ぼうけんの おみやげ（48こ。ばしょごとに 6こ、6こめは ボスの とくべつな アイテム）
  const SOUVENIRS = [
    { id: 's_dango', name: 'みたらし だんご', e: '🍡' }, { id: 's_furin', name: 'ふうりん', e: '🎐' }, { id: 's_koinobori', name: 'こいのぼり', e: '🎏' },
    { id: 's_senbei', name: 'おせんべい', e: '🍘' }, { id: 's_tako', name: 'たこあげの たこ', e: '🪁' }, { id: 's_kagi', name: 'かげの かぎ', e: '🗝️', sp: true },
    { id: 's_ocha', name: 'おちゃ', e: '🍵' }, { id: 's_tanabata', name: 'たなばた かざり', e: '🎋' }, { id: 's_kuri', name: 'くり', e: '🌰' },
    { id: 's_kinoko', name: 'きのこ', e: '🍄' }, { id: 's_ohashi', name: 'たけの おはし', e: '🥢' }, { id: 's_houju', name: 'きつねの ほうじゅ', e: '🔶', sp: true },
    { id: 's_kane', name: 'おてらの かね', e: '🔔' }, { id: 's_hasu', name: 'はすの はな', e: '🪷' }, { id: 's_rousoku', name: 'ろうそく', e: '🕯️' },
    { id: 's_juzu', name: 'じゅず', e: '📿' }, { id: 's_azuki', name: 'あずき', e: '🫘' }, { id: 's_suzu', name: 'ふしぎな すず', e: '🛎️', sp: true },
    { id: 's_kyuri', name: 'きゅうり', e: '🥒' }, { id: 's_tsurizao', name: 'つりざお', e: '🎣' }, { id: 's_hane', name: 'とりの はね', e: '🪶' },
    { id: 's_ishi', name: 'まるい いし', e: '🪨' }, { id: 's_suika', name: 'すいか', e: '🍉' }, { id: 's_sara', name: 'かっぱの おさら', e: '🍽️', sp: true },
    { id: 's_sori', name: 'そり', e: '🛷' }, { id: 's_tebukuro', name: 'てぶくろ', e: '🧤' }, { id: 's_nabe', name: 'あったか なべ', e: '🍲' },
    { id: 's_yakiimo', name: 'やきいも', e: '🍠' }, { id: 's_erimaki', name: 'えりまき', e: '🧣' }, { id: 's_kesshou', name: 'ゆきの けっしょう', e: '❄️', sp: true },
    { id: 's_hanabi', name: 'はなび', e: '🎆' }, { id: 's_tamago', name: 'おんせん たまご', e: '🥚' }, { id: 's_oke', name: 'おんせんの おけ', e: '♨️' },
    { id: 's_tougarashi', name: 'とうがらし', e: '🌶️' }, { id: 's_hiuchi', name: 'ひうちいし', e: '💎' }, { id: 's_uroko', name: 'りゅうの うろこ', e: '🐉', sp: true },
    { id: 's_kaigara', name: 'かいがら', e: '🐚' }, { id: 's_ebi', name: 'えび', e: '🦐' }, { id: 's_chizu', name: 'たからの ちず', e: '🗺️' },
    { id: 's_rashinban', name: 'らしんばん', e: '🧭' }, { id: 's_ikari', name: 'ふねの いかり', e: '⚓' }, { id: 's_shinju', name: 'しんじゅの かい', e: '🦪', sp: true },
    { id: 's_momo', name: 'もも', e: '🍑' }, { id: 's_taiko', name: 'おにの たいこ', e: '🥁' }, { id: 's_hata', name: 'はた', e: '🎌' },
    { id: 's_okane', name: 'おにの こばん', e: '🪙' }, { id: 's_sakura', name: 'さくらの えだ', e: '🌸' }, { id: 's_oukan', name: 'おにの おうかん', e: '👑', sp: true },
  ];

  // ---- まおうの もり（ぼうけんを ぜんぶ クリアすると ひらく） ----
  // 8かしょ。絵は img/mori_<p>.webp。⑧の さいごに まおう（M9）が でる
  const MORI_PLACES = [
    { p: 1, name: 'もりの いりぐち', e: '🌳', color: '#15803d', bg: '夕ぐれの 深い森の 入口（大きな 古木の 門、光る 小さな 玉が うかぶ）',
      intro: 'ここが まおうの もりの いりぐちだよ。おおきな きが ざわざわ……。もりの なかから だれかが みて いるよ。' },
    { p: 2, name: 'きのこの もり', e: '🍄', color: '#c026d3', bg: '光る 大きな きのこが 生えた 森（むらさきと 水色の 光）',
      intro: 'きのこの もりに ついたよ。おおきな きのこが ぴかぴか ひかって いるね。' },
    { p: 3, name: 'ほたるの たに', e: '✨', color: '#ca8a04', bg: '夜の 谷間（小川と たくさんの ほたるの 光）',
      intro: 'ほたるの たにだよ。きらきら ひかる ほたるが いっぱい。きれいだけど、ゆだんは きんもつ！' },
    { p: 4, name: 'くらやみの ぬま', e: '🌑', color: '#475569', bg: '暗い 沼地（枯れ木、霧、水面に うつる 月）',
      intro: 'くらやみの ぬまに ついたよ。あしもとに きを つけて すすもう。' },
    { p: 5, name: 'ねじれぎの みち', e: '🌀', color: '#92400e', bg: 'ぐるぐる ねじれた 木が 並ぶ 森の 小道（つたと 光る 文字の 石）',
      intro: 'ねじれぎの みちだよ。きが ぐにゃぐにゃ まがって いるね。みちに まよわないように しよう。' },
    { p: 6, name: 'きりの みずうみ', e: '🌫️', color: '#0891b2', bg: '霧に つつまれた 静かな 湖（小さな 島と 鳥居）',
      intro: 'きりの みずうみに ついたよ。きりで まわりが よく みえないね。みずうみの なかに なにか いるよ。' },
    { p: 7, name: 'いばらの とりで', e: '🏯', color: '#be123c', bg: 'いばらに おおわれた 古い 砦の 門（赤い 月）',
      intro: 'いばらの とりでだよ。まおうの けらいたちが まもって いるよ。' },
    { p: 8, name: 'まおうの しろ', e: '🏰', color: '#6d28d9', bg: '森の 奥の 黒い 城の 大広間（むらさきの 炎の 灯り）',
      intro: 'いよいよ まおうの しろ！ けらいを たおして、さいごに まおうと たたかおう！' },
  ];
  // 48たい ＋ まおう。n：じゅんばん（6＝ボス、7＝まおう）、e：絵が ないときの 絵文字（絵は img/enemy_<id>.webp）
  // ふつうの あいては くく 10もん。ボスは 6もん（ぶんしょうだい・□を もとめる・しきを さがす）、まおうは 10もん
  const MORI = [
    // 1 もりの いりぐち
    { id: 'mr_kodama', p: 1, n: 1, name: 'こだま', e: '🌱', hello: 'こだま〜 こだま〜。もりに はいる ものは だれだ〜？', item: 'm_donguri' },
    { id: 'mr_happa', p: 1, n: 2, name: 'はっぱ こぞう', e: '🍃', hello: 'ひらひら〜っ！ はっぱに かくれて いたんだよ！', item: 'm_happa' },
    { id: 'mr_risu', p: 1, n: 3, name: 'いたずら りす', e: '🐿️', hello: 'きみの おべんとう、もらっちゃうぞ！', item: 'm_kurumi' },
    { id: 'mr_fukurou', p: 1, n: 4, name: 'よふかし ふくろう', e: '🦉', hello: 'ほう ほう。よるの もりは わしの なわばりじゃ。', item: 'm_hane' },
    { id: 'mr_mihari', p: 1, n: 5, name: 'もりの みはり にんじゃ', e: '🥷', hello: 'まおうさまの もりには いれさせないぞ！', item: 'm_fue' },
    { id: 'mr_kusunoki', p: 1, n: 6, boss: true, name: 'くすのき じい', e: '🌳', hello: 'わしは この もりで 1000ねん いきて おる。わしの なぞが とけるかな？', item: 'm_ki' },
    // 2 きのこの もり
    { id: 'mr_odorikinoko', p: 2, n: 1, name: 'おどる きのこ', e: '🍄', hello: 'るんるん るん♪ いっしょに おどろうよ！', item: 'm_shiitake' },
    { id: 'mr_houshi', p: 2, n: 2, name: 'ほうし ぐも', e: '☁️', hello: 'ふわふわ〜。くしゃみが でちゃう ぞ〜。', item: 'm_wata' },
    { id: 'mr_katatsumuri', p: 2, n: 3, name: 'かたつむり むしゃ', e: '🐌', hello: 'ゆっくり いくぞ。でも からは かたいぞ！', item: 'm_ajisai' },
    { id: 'mr_kinokoninja', p: 2, n: 4, name: 'きのこ にんじゃ', e: '🥷', hello: 'きのこの かさに かくれる じゅつ！', item: 'm_kasa' },
    { id: 'mr_kinokomajo', p: 2, n: 5, name: 'きのこの まほうつかい', e: '🧙', hello: 'ちちんぷいぷい！ きのこに なあれ！', item: 'm_tsue' },
    { id: 'mr_ookinoko', p: 2, n: 6, boss: true, name: 'おおきのこ さま', e: '🍄', hello: 'ぽよん ぽよん！ わしが きのこの もりの おうさまじゃ！', item: 'm_kinokokanmuri' },
    // 3 ほたるの たに
    { id: 'mr_hotarubouzu', p: 3, n: 1, name: 'ほたる ぼうず', e: '💡', hello: 'ぴかっ ぴかっ。おしりが ひかるんだ！', item: 'm_hotaru' },
    { id: 'mr_hoshikuzu', p: 3, n: 2, name: 'ほしくず こびと', e: '⭐', hello: 'ほしの かけらを あつめて いるんだ。じゃま しないで！', item: 'm_hoshi' },
    { id: 'mr_tsukiusagi', p: 3, n: 3, name: 'つきよの うさぎ', e: '🐇', hello: 'ぴょーん！ おつきさままで とんで いけるよ！', item: 'm_mochi' },
    { id: 'mr_hotaruninja', p: 3, n: 4, name: 'ほたるび にんじゃ', e: '🥷', hello: 'ひかりに まぎれて しのびよったぞ！', item: 'm_chochin' },
    { id: 'mr_tanikaze', p: 3, n: 5, name: 'たにかぜ こぞう', e: '🌬️', hello: 'ぴゅーっ！ かぜで ふきとばして やる！', item: 'm_kazaguruma' },
    { id: 'mr_hotaruhime', p: 3, n: 6, boss: true, name: 'ほたるの ひめ', e: '🌟', hello: 'わたくしの ひかりの まほう、みやぶれるかしら？', item: 'm_hikaridama' },
    // 4 くらやみの ぬま
    { id: 'mr_dorotabou', p: 4, n: 1, name: 'どろたぼう', e: '🟫', hello: 'どろ どろ〜。ぬまに ひきこんで やるぞ〜。', item: 'm_hasu' },
    { id: 'mr_koumori', p: 4, n: 2, name: 'くらやみ こうもり', e: '🦇', hello: 'きーきー！ くらやみなら まけないよ！', item: 'm_tsukimi' },
    { id: 'mr_mizugumo', p: 4, n: 3, name: 'みずぐも', e: '🕷️', hello: 'すいすい〜。みずの うえを あるけるのさ。', item: 'm_ito' },
    { id: 'mr_kageninja', p: 4, n: 4, name: 'かげ にんじゃ', e: '🥷', hello: 'わたしは かげ。どこに いるか わかるまい！', item: 'm_kagami' },
    { id: 'mr_numahitodama', p: 4, n: 5, name: 'ぬまの ひとだま', e: '👻', hello: 'ふわ〜り ふわり。こっちへ おいで〜。', item: 'm_ame' },
    { id: 'mr_daija', p: 4, n: 6, boss: true, name: 'くらやみ だいじゃ', e: '🐍', hello: 'しゅるるる……。ぬまの ぬしは この わしだ。', item: 'm_hebinoko' },
    // 5 ねじれぎの みち
    { id: 'mr_nejireeda', p: 5, n: 1, name: 'ねじれえだ おばけ', e: '🌿', hello: 'ぐにゃ〜り。みちを まげて やったぞ！', item: 'm_eda' },
    { id: 'mr_karasutengu', p: 5, n: 2, name: 'からす てんぐ', e: '🐦‍⬛', hello: 'かあ かあ！ そらから まる みえだぞ！', item: 'm_uchiwa' },
    { id: 'mr_tsuchigumo', p: 5, n: 3, name: 'つちぐも', e: '🕸️', hello: 'あみに かかったな！ にがさないぞ〜。', item: 'm_kumonosu' },
    { id: 'mr_tsutamajo', p: 5, n: 4, name: 'つたの まほうつかい', e: '🧝', hello: 'つたよ のびろ！ ぐるぐる まきに して あげる！', item: 'm_tsuta' },
    { id: 'mr_oomukade', p: 5, n: 5, name: 'おおむかで', e: '🐛', hello: 'あしが いっぱい！ はやいぞ はやいぞ！', item: 'm_kutsu' },
    { id: 'mr_daitengu', p: 5, n: 6, boss: true, name: 'だいてんぐ', e: '👺', hello: 'わしは やまの だいてんぐ。ちえくらべを しようでは ないか！', item: 'm_tenguuchiwa' },
    // 6 きりの みずうみ
    { id: 'mr_kiri', p: 6, n: 1, name: 'きり にゅうどう', e: '🌫️', hello: 'もわ〜ん。きりで なにも みえないだろう〜。', item: 'm_shizuku' },
    { id: 'mr_sagi', p: 6, n: 2, name: 'あおさぎ ようかい', e: '🪶', hello: 'くわっ！ ながい あしで まって いたぞ！', item: 'm_sakana' },
    { id: 'mr_kame', p: 6, n: 3, name: 'ふしぎな かめ', e: '🐢', hello: 'わしは 100ねん いきた かめじゃ。のんびり いこう。', item: 'm_koura' },
    { id: 'mr_kirininja', p: 6, n: 4, name: 'きり にんじゃ', e: '🥷', hello: 'きりの なかから しゅっ！ みえたかな？', item: 'm_hasuha' },
    { id: 'mr_suishou', p: 6, n: 5, name: 'すいしょう ようせい', e: '💠', hello: 'きらきら〜。わたしの まほうで こおらせちゃう！', item: 'm_suishou' },
    { id: 'mr_kiriryu', p: 6, n: 6, boss: true, name: 'きりの りゅう', e: '🐉', hello: 'みずうみの そこから めざめたぞ。わしの もんだいに こたえて みよ！', item: 'm_ryutama' },
    // 7 いばらの とりで
    { id: 'mr_ibaramusha', p: 7, n: 1, name: 'いばら むしゃ', e: '🌹', hello: 'とげとげの よろいだ！ ちかよるな！', item: 'm_bara' },
    { id: 'mr_karakuri', p: 7, n: 2, name: 'からくり へい', e: '⚙️', hello: 'がしゃん がしゃん。とりでを まもる からくりだ。', item: 'm_haguruma' },
    { id: 'mr_inoshishi', p: 7, n: 3, name: 'いばら いのしし', e: '🐗', hello: 'ぶもー！ まっすぐ とっしんだ！', item: 'm_kuri' },
    { id: 'mr_kuromajo', p: 7, n: 4, name: 'くろい まほうつかい', e: '🧙', hello: 'まおうさまの ために、まほうで とめて みせる！', item: 'm_hon' },
    { id: 'mr_toridenin', p: 7, n: 5, name: 'とりでの もんばん にんじゃ', e: '🥷', hello: 'この もんは とおさん！ まおうさまの めいれいだ！', item: 'm_hata' },
    { id: 'mr_kurokage', p: 7, n: 6, boss: true, name: 'くろかげ しょうぐん', e: '⚔️', hello: 'わしは まおうさまの みぎうで。ここで おまえを とめる！', item: 'm_kabuto' },
    // 8 まおうの しろ
    { id: 'mr_shimobe', p: 8, n: 1, name: 'まおうの しもべ おに', e: '👹', hello: 'まおうさまの ところへは いかせないぞ！', item: 'm_kanabou' },
    { id: 'mr_kageboushi', p: 8, n: 2, name: 'かげぼうし', e: '👤', hello: 'きみの かげに なって ついて いくよ〜。', item: 'm_rousoku' },
    { id: 'mr_yamineko', p: 8, n: 3, name: 'やみねこ', e: '🐈‍⬛', hello: 'にゃおーん。くらやみで めが ひかるのさ。', item: 'm_suzu' },
    { id: 'mr_yamimajo', p: 8, n: 4, name: 'やみの まほうつかい', e: '🔮', hello: 'まおうさまの まほうを みよ！ むらさきの ほのお！', item: 'm_tama' },
    { id: 'mr_yamininja', p: 8, n: 5, name: 'やみ にんじゃ', e: '🥷', hello: 'わたしが まおうさまの さいごの まもり！', item: 'm_kunai' },
    { id: 'mr_monban', p: 8, n: 6, boss: true, name: 'やみの もんばん', e: '🛡️', hello: 'この とびらの さきに まおうさまが いる。とおりたければ わしを たおせ！', item: 'm_kagi' },
    // さいごの たたかい（⑧の ボスを たおすと でる）
    { id: 'mr_maou', p: 8, n: 7, boss: true, maou: true, name: 'まおう', e: '😈', hello: 'ぐわっはっは！ よくぞ ここまで きた。わしが この もりの まおうだ！ くくの ちからで かかって こい！',
      lose: 'まいった〜！ きみは ほんとうに つよいのう。……わしも きみの なかまに して くれんか？', item: 'm_maoukanmuri' },
  ];
  // もりの おみやげ（49こ。ばしょごとに 6こ、6こめは ボスの とくべつな アイテム。さいごは まおうの もの）
  const MORI_SOUVENIRS = [
    { id: 'm_donguri', name: 'どんぐり', e: '🌰' }, { id: 'm_happa', name: 'もみじの はっぱ', e: '🍁' }, { id: 'm_kurumi', name: 'くるみ', e: '🥜' },
    { id: 'm_hane', name: 'ふくろうの はね', e: '🪶' }, { id: 'm_fue', name: 'くさぶえ', e: '🎶' }, { id: 'm_ki', name: 'せんねんの きの み', e: '🍏', sp: true },
    { id: 'm_shiitake', name: 'しいたけ', e: '🍄‍🟫' }, { id: 'm_wata', name: 'わたげ', e: '🌼' }, { id: 'm_ajisai', name: 'あじさい', e: '💐' },
    { id: 'm_kasa', name: 'きのこの かさ', e: '☂️' }, { id: 'm_tsue', name: 'まほうの つえ', e: '🪄' }, { id: 'm_kinokokanmuri', name: 'きのこの かんむり', e: '🍄', sp: true },
    { id: 'm_hotaru', name: 'ほたるの ひかり', e: '💡' }, { id: 'm_hoshi', name: 'ほしの かけら', e: '⭐' }, { id: 'm_mochi', name: 'つきみ もち', e: '🍡' },
    { id: 'm_chochin', name: 'ほたる ちょうちん', e: '🏮' }, { id: 'm_kazaguruma', name: 'かざぐるま', e: '🎡' }, { id: 'm_hikaridama', name: 'ひかりの たま', e: '🌟', sp: true },
    { id: 'm_hasu', name: 'ぬまの はす', e: '🪷' }, { id: 'm_tsukimi', name: 'つきの しずく', e: '🌙' }, { id: 'm_ito', name: 'ぎんの いと', e: '🧵' },
    { id: 'm_kagami', name: 'かげの かがみ', e: '🪞' }, { id: 'm_ame', name: 'あめだま', e: '🍬' }, { id: 'm_hebinoko', name: 'へびの ぬけがら', e: '🐍', sp: true },
    { id: 'm_eda', name: 'ねじれた えだ', e: '🪵' }, { id: 'm_uchiwa', name: 'からすの うちわ', e: '🪭' }, { id: 'm_kumonosu', name: 'くもの す', e: '🕸️' },
    { id: 'm_tsuta', name: 'つたの わ', e: '🌿' }, { id: 'm_kutsu', name: 'はやい わらじ', e: '👡' }, { id: 'm_tenguuchiwa', name: 'てんぐの はうちわ', e: '🍃', sp: true },
    { id: 'm_shizuku', name: 'きりの しずく', e: '💧' }, { id: 'm_sakana', name: 'みずうみの さかな', e: '🐟' }, { id: 'm_koura', name: 'かめの こうら', e: '🐢' },
    { id: 'm_hasuha', name: 'はすの は', e: '☘️' }, { id: 'm_suishou', name: 'すいしょう', e: '💎' }, { id: 'm_ryutama', name: 'りゅうの たま', e: '🔮', sp: true },
    { id: 'm_bara', name: 'のばらの はな', e: '🌹' }, { id: 'm_haguruma', name: 'はぐるま', e: '⚙️' }, { id: 'm_kuri', name: 'いがぐり', e: '🌰' },
    { id: 'm_hon', name: 'まほうの ほん', e: '📕' }, { id: 'm_hata', name: 'とりでの はた', e: '🚩' }, { id: 'm_kabuto', name: 'くろい かぶと', e: '🪖', sp: true },
    { id: 'm_kanabou', name: 'おにの かなぼう', e: '🏏' }, { id: 'm_rousoku', name: 'むらさきの ろうそく', e: '🕯️' }, { id: 'm_suzu', name: 'ねこの すず', e: '🔔' },
    { id: 'm_tama', name: 'すいしょうだま', e: '🫧' }, { id: 'm_kunai', name: 'やみの くない', e: '🗡️' }, { id: 'm_kagi', name: 'とびらの かぎ', e: '🗝️', sp: true },
    { id: 'm_maoukanmuri', name: 'まおうの かんむり', e: '👑', sp: true },
  ];
  // ぶんしょうだい（ボス・まおう）。1つ分（a）の もの と、いくつ分（b）の いれもの
  // u：もの の かぞえかた、bu：いれもの の かぞえかた（すうじが かわっても よみが かわらない ものだけ）
  const MORI_STORY = [
    { thing: 'きのこ', e: '🍄', u: 'こ', box: 'かご', bu: 'こ' },
    { thing: 'どんぐり', e: '🌰', u: 'こ', box: 'ふくろ', bu: 'つ' },
    { thing: 'りんご', e: '🍎', u: 'こ', box: 'はこ', bu: 'こ' },
    { thing: 'いちご', e: '🍓', u: 'こ', box: 'おさら', bu: 'まい' },
    { thing: 'おだんご', e: '🍡', u: 'こ', box: 'おさら', bu: 'まい' },
    { thing: 'もみじの はっぱ', e: '🍁', u: 'まい', box: 'ふくろ', bu: 'つ' },
    { thing: 'ひかる いし', e: '💎', u: 'こ', box: 'はこ', bu: 'こ' },
    { thing: 'おせんべい', e: '🍘', u: 'まい', box: 'おさら', bu: 'まい' },
  ];
  // まおうの もりを ぜんぶ クリアすると もらえる とくべつな いろ と あいぼう（よろずやでは うらない）
  const MORI_COLOR = { id: 'mori', name: 'もりの しのび', zukin: '#166534', fuku: '#4d7c0f', obi: '#a16207', pattern: 'shine' };
  const MORI_AIBOU = { id: 'a_maou', n: 'まおう', e: '😈', img: 'enemy_mr_maou.webp', cat: 'aibou' };

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

  // ---- しょうごう（f：ごうかく した 階の かず、all：はってんを ぜんぶ クリア、bouken：ぼうけんを ぜんぶ クリア、mori：まおうの もりを ぜんぶ クリア） ----
  const TITLES = [
    { n: 'みならい にんじゃ', f: 0 },
    { n: 'げにん', f: 3 },
    { n: 'ちゅうにん', f: 6 },
    { n: 'じょうにん', f: 9 },
    { n: 'にんじゃ マスター', all: true },
    { n: 'くく でんせつの にんじゃ', bouken: true },
    { n: 'まおうの もりの えいゆう', mori: true },
  ];
  // ぼうけんを ぜんぶ クリアすると もらえる とくべつな いろ（よろずやでは うらない）
  const BOUKEN_COLOR = { id: 'densetsu', name: 'でんせつの よろい', zukin: '#b91c1c', fuku: '#facc15', obi: '#b91c1c', pattern: 'shine' };

  (typeof window !== 'undefined' ? window : globalThis).KUKU_DATA = { TONAE, FLOORS, ENEMIES, TREASURES, STEP, STAGES, COLORS, ITEM_CATS, TITLES, PLACES, BOUKEN, SOUVENIRS, BOUKEN_COLOR,
    MORI_PLACES, MORI, MORI_SOUVENIRS, MORI_STORY, MORI_COLOR, MORI_AIBOU };
})();
