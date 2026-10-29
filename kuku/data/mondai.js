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

  // ---- しょうごう（f：ごうかく した 階の かず、all：はってんを ぜんぶ クリア、bouken：ぼうけんを ぜんぶ クリア） ----
  const TITLES = [
    { n: 'みならい にんじゃ', f: 0 },
    { n: 'げにん', f: 3 },
    { n: 'ちゅうにん', f: 6 },
    { n: 'じょうにん', f: 9 },
    { n: 'にんじゃ マスター', all: true },
    { n: 'くく でんせつの にんじゃ', bouken: true },
  ];
  // ぼうけんを ぜんぶ クリアすると もらえる とくべつな いろ（よろずやでは うらない）
  const BOUKEN_COLOR = { id: 'densetsu', name: 'でんせつの よろい', zukin: '#b91c1c', fuku: '#facc15', obi: '#b91c1c', pattern: 'shine' };

  (typeof window !== 'undefined' ? window : globalThis).KUKU_DATA = { TONAE, FLOORS, ENEMIES, TREASURES, STEP, STAGES, COLORS, ITEM_CATS, TITLES, PLACES, BOUKEN, SOUVENIRS, BOUKEN_COLOR };
})();
