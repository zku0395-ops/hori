// なぞとき プリント — テストの 文章（アプリに ない 新しい 文章）
//
// 書き方は nazotoki/tools/mondai.js と 同じです。
// - 漢字は {漢字|よみ}（1年生で習う漢字だけ）。分かち書きは 半角スペース。
// - itsu / doko / dare / nani は 答え（文章の中に そのままの形で 入っています）。
// - q：くわしい 問いかけ（ない ときは ふつうの 問いかけ）。
// - ng：○を つける テスト（T1）の、まちがいやすい 選択肢（足りない分は 自動で 選びます）。
// - k：書く テスト（T2）の わく。a＝書く字、f＝わく（＿のところに □ を出します）。
// - en：Canva で 挿絵を 作るときの ことば。
// id は あとから 変えないでください（挿絵の ファイル名と 結びついています）。

const T1 = [
  // 1文
  { id: 'T1-1', st: 5, t: ['{夕|ゆう}がた、とうしんくんは こうえんで シャボンだまを とばしました。'],
    itsu: '{夕|ゆう}がた', doko: 'こうえん', dare: 'とうしんくん', nani: 'シャボンだまを とばしました',
    ng: { nani: ['シャボンだまを かいました', 'ふうせんを とばしました'] },
    pic: 'ゆうがたの こうえんで、男の子が シャボンだまを とばしている', en: 'At sunset, a boy blows soap bubbles in a park, orange evening sky. He is the only person.' },
  // 1文（ならびかえ）
  { id: 'T1-2', st: 6, t: ['ゆきさんは、{日|にち}ようびに どうぶつえんで うさぎを だっこしました。'],
    itsu: '{日|にち}ようび', doko: 'どうぶつえん', dare: 'ゆきさん', nani: 'うさぎを だっこしました',
    ng: { nani: ['うさぎに えさを やりました', 'うさぎを みつけました'] },
    pic: 'どうぶつえんの ふれあいコーナーで、女の子が うさぎを だっこしている', en: 'A girl gently holds a white rabbit in her arms at a petting zoo. She is the only person.' },
  // 2文
  { id: 'T1-3', st: 7, t: ['{雨|あめ}の あさでした。', 'りょうまくんは げんかんで ながぐつを はきました。'],
    itsu: '{雨|あめ}の あさ', doko: 'げんかん', dare: 'りょうまくん', nani: 'ながぐつを はきました',
    ng: { itsu: ['{雨|あめ}の よる', 'はれの あさ'], doko: ['へや', 'だいどころ'], nani: ['かさを さしました', 'ながぐつを ぬぎました'] },
    pic: 'あめの あさ、げんかんで、男の子が ながぐつを はいている', en: 'On a rainy morning, a boy puts on yellow rain boots at the entrance of a house, rain outside the open door. He is the only person.' },
  // 3文
  { id: 'T1-4', st: 9, t: ['なつ{休|やす}みの ことです。', 'たけるくんは おじいちゃんと {川|かわ}へ いきました。', 'たけるくんは {川|かわ}で ザリガニを つかまえました。'],
    itsu: 'なつ{休|やす}み', doko: '{川|かわ}', dare: 'たけるくん', nani: 'ザリガニを つかまえました',
    pos: { dare: 2, doko: 2 },
    q: { itsu: 'いつの ことですか？', doko: 'どこで ザリガニを つかまえましたか？', dare: 'だれが ザリガニを つかまえましたか？', nani: 'たけるくんは {川|かわ}で なにを しましたか？' },
    ng: { dare: ['おじいちゃん'], nani: ['{川|かわ}へ いきました', 'さかなを つりました'] },
    pic: 'なつの 川で、男の子が ザリガニを つかまえている。よこに おじいちゃん', en: 'In summer, a boy catches a red crayfish in a shallow river, his grandfather smiling beside him.' },
  // 3文（にている ことばが いくつも）
  { id: 'T1-5', st: 10, t: ['{月|げつ}ようびの あさ、ゆうまくんは {学校|がっこう}へ いきました。', 'ひる{休|やす}みに、{学校|がっこう}の にわで あさがおを みました。', 'ほうかごに、こうえんで なわとびを しました。'],
    itsu: 'ほうかご', doko: 'こうえん', dare: 'ゆうまくん', nani: 'あさがおを みました',
    q: { itsu: 'いつ なわとびを しましたか？', doko: 'どこで なわとびを しましたか？', dare: 'だれが {学校|がっこう}へ いきましたか？', nani: 'ゆうまくんは ひる{休|やす}みに なにを しましたか？' },
    ng: { itsu: ['{月|げつ}ようびの あさ', 'ひる{休|やす}み'], doko: ['{学校|がっこう}の にわ'], nani: ['なわとびを しました', '{学校|がっこう}へ いきました'] },
    pic: 'ほうかごの こうえんで、男の子が なわとびを している', en: 'After school, a boy with a school backpack on a bench jumps rope in a park. He is the only person.' },
];

const T2 = [
  // 1文
  { id: 'T2-1', st: 5, t: ['あさ、さくらさんは にわで {花|はな}を つみました。'],
    itsu: 'あさ', doko: 'にわ', dare: 'さくらさん', nani: '{花|はな}を つみました',
    k: { itsu: { a: 'あさ', f: '＿' }, doko: { a: 'にわ', f: '＿' }, dare: { a: 'さくら', f: '＿さん' }, nani: { a: 'つみ', f: '{花|はな}を ＿ました' } },
    pic: 'あさの にわで、女の子が 花を つんでいる', en: 'In the morning, a girl picks flowers in a garden. She is the only person.' },
  // 1文（ならびかえ）
  { id: 'T2-2', st: 6, t: ['ペンギンが、ひるに プールで およぎました。'],
    itsu: 'ひる', doko: 'プール', dare: 'ペンギン', nani: 'およぎました',
    k: { itsu: { a: 'ひる', f: '＿' }, doko: { a: 'プール', f: '＿' }, dare: { a: 'ペンギン', f: '＿' }, nani: { a: 'およぎ', f: '＿ました' } },
    pic: 'ひるに、ペンギンが プールで およいでいる', en: 'At noon, a cute penguin swims in a blue pool at an aquarium.' },
  // 2文
  { id: 'T2-3', st: 7, t: ['ふゆの ことです。', 'たけるくんは {山|やま}で ソリに のりました。'],
    itsu: 'ふゆ', doko: '{山|やま}', dare: 'たけるくん', nani: 'ソリに のりました',
    k: { itsu: { a: 'ふゆ', f: '＿' }, doko: { a: 'やま', f: '＿' }, dare: { a: 'たける', f: '＿くん' }, nani: { a: 'ソリ', f: '＿に のりました' } },
    pic: 'ふゆの 山で、男の子が ソリに のっている', en: 'In winter, a boy rides a sled down a snowy mountain slope. He is the only person.' },
  // 3文
  { id: 'T2-4', st: 9, t: ['よるの ことです。', 'とうしんくんは ベランダで そらを みました。', '{大|おお}きな {月|つき}が でて いました。'],
    itsu: 'よる', doko: 'ベランダ', dare: 'とうしんくん', nani: 'そらを みました',
    q: { doko: 'どこで そらを みましたか？', dare: 'だれが そらを みましたか？', nani: 'とうしんくんは ベランダで なにを しましたか？' },
    k: { itsu: { a: 'よる', f: '＿' }, doko: { a: 'ベランダ', f: '＿' }, dare: { a: 'とうしん', f: '＿くん' }, nani: { a: 'み', f: 'そらを ＿ました' } },
    pic: 'よる、ベランダで、男の子が 大きな 月を みている', en: 'At night, a boy stands on a balcony of a house and looks up at a big full moon and stars. He is the only person.' },
  // 3文（にている ことばが いくつも）
  { id: 'T2-5', st: 10, t: ['あさ、りょうまくんは いえで {本|ほん}を よみました。', 'ひるに、こうえんで たこあげを しました。', '{夕|ゆう}がた、おふろで うたを うたいました。'],
    itsu: 'ひる', doko: 'おふろ', dare: 'りょうまくん', nani: '{本|ほん}を よみました',
    q: { itsu: 'いつ たこあげを しましたか？', doko: 'どこで うたを うたいましたか？', dare: 'だれが たこあげを しましたか？', nani: 'りょうまくんは あさ なにを しましたか？' },
    k: { itsu: { a: 'ひる', f: '＿' }, doko: { a: 'おふろ', f: '＿' }, dare: { a: 'りょうま', f: '＿くん' }, nani: { a: 'よみ', f: '{本|ほん}を ＿ました' } },
    pic: 'こうえんで、男の子が たこあげを している', en: 'At noon, a boy flies a kite in a park on a sunny day. He is the only person.' },
];

module.exports = { T1, T2 };
