// そらの うえの がっこう：へやと アプリの 一覧
// ・アプリを 足すときは、その たなの apps に 1行 足します。
// ・id は ほかと かぶらない 英数字に します（「おすすめ」「かくす」「さいきん」の きろくに つかうので、あとから 変えない）。
// ・name の 漢字は {漢字|よみ} と 書くと、ふりがなが つきます。
// ・say は よみあげる ことば（なければ name を よみます）。
window.SORA = {
  rooms: [
    {
      id: 'kokugo', name: 'こくごの へや', emoji: '📚', color: '#ef4444', img: 'img/kokugo.webp',
      // 学校の 絵の 上で おす ところ（％）
      spot: { x: 9.5, y: 16.5, w: 22, h: 21 },
      shelves: [
        { id: 'hiragana', name: 'ひらがな', emoji: 'あ', apps: [
          { id: 'hiranarabe', emoji: '🐘', name: 'ひらがなを ならべよう', url: 'https://sites.google.com/view/hiraganawonarabeyou-doubutu/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'hiramaster', emoji: '🏅', name: 'ひらがなマスターに なろう', url: 'https://sites.google.com/view/hiraganamasternew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'hirajan', emoji: '✊', name: 'ひらがなジャン', url: 'https://sites.google.com/view/hiraganajyann/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'hirajan2', emoji: '✌️', name: 'ひらがじゃん②', say: 'ひらがじゃん に', url: 'https://sites.google.com/view/hiragajyan/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'yayuyo', emoji: '🔤', name: 'ちいさな「や・ゆ・よ」', say: 'ちいさな や ゆ よ', url: 'https://sites.google.com/view/youon/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'yayuyotsu', emoji: '📝', name: 'ちいさな「ゃ」「ゅ」「ょ」「っ」', say: 'ちいさな や ゆ よ つ', url: 'https://sites.google.com/view/chiisanayayuyotu/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'yayuyotsuyoko', emoji: '↔️', name: 'ちいさな「ゃ」「ゅ」「ょ」「っ」よこがき', say: 'ちいさな や ゆ よ つ よこがき', url: 'https://sites.google.com/view/tiisanayayuyotu/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kotobazukan', emoji: '📖', name: 'ひらがな ことばずかん', url: 'https://script.google.com/macros/s/AKfycbwrRzK0PS0lyo9C7QodChQ1Ag76rC04I4K8jBqBXVqfILwMdZn69xNwJqW3edue5HQf/exec' },
        ] },
        { id: 'katakana', name: 'カタカナ', emoji: 'ア', apps: [
          { id: 'katanarabe', emoji: '🧩', name: 'カタカナならべ', url: 'https://sites.google.com/view/katakananarabenew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'katamaster', emoji: '🏅', name: 'カタカナマスター', url: 'https://sites.google.com/view/katakanamasternew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'katamitsuke', emoji: '🔍', name: 'カタカナを みつけよう', url: 'https://sites.google.com/view/katakanawomitukeyo/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'katamichi', emoji: '🛤️', name: 'カタカナマスターへの みち', url: 'https://sites.google.com/view/katakanamasterhenomiti/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'katapuzzle', emoji: '🤖', name: 'カタカナパズル', url: 'https://sites.google.com/view/katakanapazuru/%E3%83%9B%E3%83%BC%E3%83%A0' },
        ] },
        { id: 'kanji', name: 'かんじ', emoji: '漢', apps: [
          { id: 'kanji1new', emoji: '1️⃣', name: 'かんじマスター レベル1', url: 'https://script.google.com/macros/s/AKfycbw0GYMJLo3kyIIt9--w2TMR3wHJB6EUOOP01K1GVM9tSqaSCkVH_l4Uxwb0puVVD5cLNA/exec' },
          { id: 'kanji1rec', emoji: '1️⃣', name: 'かんじマスター レベル1（きろく）', url: 'https://script.google.com/macros/s/AKfycbw1qBHCHRQNN8BKaUBRWnPYJW--s1k0mheInWr5SNcTul-S59FDeTavVj6DErqorq-ENQ/exec' },
          { id: 'kanji2new', emoji: '2️⃣', name: 'かんじマスター レベル2', url: 'https://sites.google.com/view/kannjimaster2/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kanji2rec', emoji: '2️⃣', name: 'かんじマスター レベル2（きろく）', url: 'https://sites.google.com/view/kannjirennseyuu2/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kanji3new', emoji: '3️⃣', name: 'かんじマスター レベル3', url: 'https://sites.google.com/view/kanjimaster3new/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kanji3rec', emoji: '3️⃣', name: 'かんじマスター レベル3（きろく）', url: 'https://sites.google.com/view/kanjigakusyuurebel3/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kanjimichi1', emoji: '🛤️', name: 'かんじマスターへの みち レベル1', url: 'https://sites.google.com/view/kannjimasterhenomiti/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kanjimichi2', emoji: '🛤️', name: 'かんじマスターへの みち レベル2', url: 'https://sites.google.com/view/kannjimastera2/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kanjimichi3', emoji: '🛤️', name: 'かんじマスターへの みち レベル3', url: 'https://sites.google.com/view/kannjimasterhenmiti3/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kanjitest1', emoji: '💯', name: 'かんじテスト（1ねん）', url: 'https://sites.google.com/view/kannjitestnew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kanjiquiz1', emoji: '❓', name: 'かんじクイズ①', say: 'かんじクイズ いち', url: 'https://sites.google.com/view/kanjikuizu1/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kanjiquiz2', emoji: '❓', name: 'かんじクイズ②', say: 'かんじクイズ に', url: 'https://sites.google.com/view/kanjijkuizu2/%E3%83%9B%E3%83%BC%E3%83%A0' },
        ] },
        { id: 'kotoba', name: 'ことばと ぶん', emoji: '💬', apps: [
          { id: 'kuttsuki', emoji: '🔗', name: 'くっつきことばマスター', url: 'https://sites.google.com/view/kuttukikotobamaster/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kuttsukisetsumei', emoji: '🎧', name: 'くっつきことばに ついて（せつめい）', url: 'https://notebooklm.google.com/notebook/bb420b8d-8ebb-4f51-bcbe-6b7c03f0285b' },
          { id: 'narabe1', emoji: '🧱', name: 'ならびかえて {文|ぶん}を つくろう レベル1', url: 'https://sites.google.com/view/sakubunmaster/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'narabe2', emoji: '🧱', name: 'ならびかえて {文|ぶん}を つくろう レベル2', url: 'https://tadashi-hori.my.canva.site/c6y733kmk4jep7h2' },
          { id: 'bunwotsukuro', emoji: '✏️', name: '{文|ぶん}を つくろう', url: 'https://sites.google.com/view/bunwotukukuro/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'bunzukuri', emoji: '🖊️', name: '{文|ぶん}づくり', url: 'https://script.google.com/macros/s/AKfycbw9_DicaDjek-cQTCSymdmOGcPOcR1Xx_JFQYjqK6SdUVPubJfl33yggIl1eFiQjjin/exec' },
          { id: 'tsunagesakubun', emoji: '🪢', name: 'つなげて さくぶん', url: 'https://sites.google.com/view/tunagetesakubun/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'dotchigasuki', emoji: '💗', name: 'どっちが すき', url: 'https://sites.google.com/view/dottigasukinew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'tateyoko1', emoji: '🔎', name: 'たてよこななめ ことばを みつけよう レベル1', url: 'https://tadashi-hori.my.canva.site/c71ybaw29c339mkd' },
          { id: 'tateyoko2', emoji: '🔎', name: 'たてよこななめ ことばを みつけよう レベル2', url: 'https://tadashi-hori.my.canva.site/c70zxgyj4ym1kq36' },
          { id: 'onomasetsumei', emoji: '🎧', name: 'オノマトペに ついて（せつめい）', url: 'https://notebooklm.google.com/notebook/5e887274-9057-4525-8e66-728d8bb01eaa/artifact/da434571-73b2-472b-89b6-609eec498dc8' },
          { id: 'onomamaster', emoji: '🐸', name: 'オノマトペマスター', url: 'https://sites.google.com/view/onomatopemasernew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'threehint', emoji: '💡', name: 'スリーヒントクイズ', url: 'https://sites.google.com/view/surihintokuizunew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kotobabingo', emoji: '🎯', name: 'ことばビンゴ', url: 'https://sites.google.com/view/kotobabingo/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kotobahirahira', emoji: '🍃', name: 'ことばひらひら', url: 'https://script.google.com/macros/s/AKfycbyWfhygXnZS_NKT_P5sEJqhd_fGWKk-rB6lUjox74AKmnWrtvrgSa08AVVX07rNpkSu/exec' },
          { id: 'dracchikotoba', emoji: '🐉', name: 'ドラッチと ことばの ぼうけん', say: 'ドラッチと ことばの ぼうけん', url: 'https://script.google.com/macros/s/AKfycbzqChsiLiRsDFR35HsC31TjfR8OsVqIp5Rr45uFSu1vkRHLXXJuEe-3auBd05JttFnuUA/exec' },
          { id: 'bunbunkotoba', emoji: '🧙', name: 'ブンブンちょうろうの ことばの ぼうけん', say: 'ブンブンちょうろうの ことばの ぼうけん', url: 'https://script.google.com/macros/s/AKfycbxVQOeY_SsNNFZAKkU2BoqpOBZgAGBVop7p-QW7jN5tVWI5e-773ZGFZJ96y40dHPdwtg/exec' },
        ] },
        { id: 'yomu', name: 'よむ', emoji: '📗', apps: [
          { id: 'ondokumaster', emoji: '🗣️', name: 'おんどくマスター', url: 'https://sites.google.com/view/ondokumasterda/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'hanashiyonde', emoji: '📖', name: 'はなしを よんで こたえよう', url: 'https://sites.google.com/view/hanasiwoyonndekottaeyou/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'shionakagagu', emoji: '🍙', name: '{詩|し}の {音読|おんどく}（おなかが ぐう）', url: 'https://claude.ai/artifact/HjPqjYUzb7B1v2pNnTgK8M' },
          { id: 'shiakinomori', emoji: '🍁', name: '{詩|し}の {音読|おんどく}（あきの もりで）', url: 'https://claude.ai/artifact/5gvPsmxYNgmJFpZ49QDb4c' },
          { id: 'doubutsunoshi', emoji: '🐻', name: '{動物|どうぶつ}の {詩|し}', url: 'https://claude.ai/artifact/EsMUwSso5VCpa99rWHBLD2' },
        ] },
      ],
    },
    {
      id: 'sansu', name: 'さんすうの へや', emoji: '🔢', color: '#f59e0b', img: 'img/sansu.webp',
      spot: { x: 36, y: 4, w: 29, h: 34 },
      shelves: [
        { id: 'kazu', name: 'かず', emoji: '🔢', apps: [
          { id: 'gousei', emoji: '🧮', name: 'かずの ごうせい・ぶんかい', url: 'https://sites.google.com/view/kazunogousebunkai/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'sen', emoji: '💯', name: '1000までの かず', say: 'せんまでの かず', url: 'https://sites.google.com/view/senmadenokazu/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'suujibingo', emoji: '🎯', name: 'すうじビンゴ', url: 'https://sites.google.com/view/suujibingo/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'daisho', emoji: '⚖️', name: 'かずの {大小|だいしょう}ゲーム', url: 'https://sites.google.com/view/kazunodaisyougame/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'suujitouch', emoji: '👆', name: 'すうじを タッチ', url: 'https://sites.google.com/view/suujiwotatti/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'tentsunagi', emoji: '✨', name: 'てんつなぎ', url: 'https://sites.google.com/view/tennwotunago/%E3%83%9B%E3%83%BC%E3%83%A0' },
        ] },
        { id: 'tashihiki', name: 'たしざん・ひきざん', emoji: '➕', apps: [
          { id: 'tashihissan', emoji: '➕', name: 'たしざん（ひっさん）マスター', url: 'https://sites.google.com/view/tasizanhissannmasternew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'hikimaster', emoji: '➖', name: 'ひきざんマスター', url: 'https://tadashi-hori.my.canva.site/c73hahewarmzp1m7' },
          { id: 'hikihissan', emoji: '➖', name: 'ひきざん（ひっさん）マスター', url: 'https://sites.google.com/view/hikizanhissann/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kurisagari', emoji: '🐿️', name: 'くりさがりの ある ひきざんマスター', url: 'https://sites.google.com/view/kurisagariarihissann/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'bunshoumondai', emoji: '📝', name: 'ぶんしょうもんだいマスター（たしざん・ひきざん）', url: 'https://sites.google.com/view/bunsyoumondai1/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kaimono', emoji: '🛒', name: 'かいものマスター', url: 'https://sites.google.com/view/kaimonomasternew/%E3%83%9B%E3%83%BC%E3%83%A0' },
        ] },
        { id: 'kakewari', name: 'かけざん・わりざん', emoji: '✖️', apps: [
          { id: 'kakeimi', emoji: '🍡', name: 'かけざんの いみ', url: 'https://sites.google.com/view/kakezannoiminew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kukumaster', emoji: '✖️', name: 'かけざん{九九|くく}マスター', url: 'https://sites.google.com/view/kakezankukumasternew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kukumastermuzu', emoji: '🔥', name: 'かけざん{九九|くく}マスター（ちょっと むずかしい）', url: 'https://sites.google.com/view/kakezankukumaster-chottomuzu/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kukuninja', emoji: '🥷', name: 'かけ{算|ざん}{九九|くく}にんじゃ', url: 'https://script.google.com/macros/s/AKfycbzDnGaipenV0jIjl5rZLum5ELXWcRUOHu21K0GqXRuBj7mxYwCm3dGM-F12N5Tr9OEg3w/exec' },
          { id: 'kukuquest', emoji: '🗡️', name: '{九九|くく}クエスト', url: 'https://script.google.com/macros/s/AKfycbyU7xBjhzT60Hw9rF1eRRe-aaHeOcZO7bV_l99qvWP7D8HFGQFZEGh1BjrdTFj-iRzT/exec' },
          { id: 'kukubingo', emoji: '🎯', name: 'かけ{算|ざん}{九九|くく}（ビンゴよう）', url: 'https://sites.google.com/view/kakezanbingo/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'anaaki', emoji: '🕳️', name: 'あなあき かけざん', url: 'https://sites.google.com/view/anaakikakezan/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kakehissan', emoji: '📐', name: 'かけざんの ひっさんマスター', url: 'https://sites.google.com/view/kakezanhissannmaster/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'warimaster', emoji: '🍎', name: 'わり{算|ざん}マスター', url: 'https://sites.google.com/view/warizanmaster/%E3%83%9B%E3%83%BC%E3%83%A0' },
        ] },
        { id: 'tokei', name: 'とけい・じかん', emoji: '🕐', apps: [
          { id: 'tokeiyomi', emoji: '🕐', name: 'とけいの よみかた', url: 'https://tadashi-hori.my.canva.site/dahav98a8kg' },
          { id: 'tokeiawase', emoji: '⏰', name: 'とけいを あわせよう', url: 'https://sites.google.com/view/tokeiwoawaseyounew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'jikan', emoji: '⏳', name: 'じかんと じこく', url: 'https://sites.google.com/view/jikanntojikoku/%E3%83%9B%E3%83%BC%E3%83%A0' },
        ] },
        { id: 'nagasa', name: 'ながさ・かさ', emoji: '📏', apps: [
          { id: 'nagasa', emoji: '📏', name: 'ながさを はかろう', url: 'https://sites.google.com/view/nagasawohakaro/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'nagasamm', emoji: '📐', name: 'ながさを はかろう（cm と mm）', say: 'ながさを はかろう センチメートルと ミリメートル', url: 'https://sites.google.com/view/nagasawohakarocmmm/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kasa', emoji: '🥛', name: 'かさの がくしゅう', url: 'https://tadashi-hori.my.canva.site/dahavpb-tme' },
        ] },
        { id: 'katachi', name: 'かたち・かくど', emoji: '🔺', apps: [
          { id: 'sankakupuzzle', emoji: '🔺', name: 'さんかくパズル', url: 'https://sites.google.com/view/sankakupazule/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'katachipuzzle', emoji: '🟦', name: 'かたちパズル', url: 'https://sites.google.com/view/katatipazle/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'sankakushikaku', emoji: '📐', name: 'さんかくけい・しかくけいマスター', url: 'https://sites.google.com/view/sannkakukeisiakkujke/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kakudomaster', emoji: '📐', name: '{角度|かくど}マスター', url: 'https://script.google.com/a/macros/kodaira.ed.jp/s/AKfycbxw8fASLD8nHe3qW3Z1Sz9M1-V3sIbk3NRCLYKLJjUEHTLWbLgTkrgHH6iRzHh7igJX/exec' },
          { id: 'kakudowani', emoji: '🐊', name: 'かくどを はかろう（ワニ）', url: 'https://sites.google.com/view/kakudowohakarou/%E3%83%9B%E3%83%BC%E3%83%A0' },
        ] },
        { id: 'bunsu', name: 'ぶんすう・しょうすう', emoji: '🍰', apps: [
          { id: 'bunsumaster', emoji: '🍰', name: 'ぶんすうマスター', url: 'https://sites.google.com/view/bunsumasternew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'bunsumaster2', emoji: '🎂', name: '{分数|ぶんすう}マスター②', say: 'ぶんすうマスター に', url: 'https://sites.google.com/view/bunsumaste/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'shousuhissan', emoji: '🔟', name: '{小数|しょうすう}の かけ{算|ざん}（ひっ{算|さん}）', url: 'https://sites.google.com/view/syousuunohissann/%E3%83%9B%E3%83%BC%E3%83%A0' },
        ] },
      ],
    },
    {
      id: 'pasokon', name: 'パソコンの へや', emoji: '💻', color: '#3b82f6', img: 'img/pasokon.webp',
      spot: { x: 4.5, y: 38, w: 27.5, h: 24 },
      shelves: [
        { id: 'pasokon', name: 'パソコン', emoji: '💻', apps: [
          { id: 'romajimaster', emoji: '🔠', name: 'ローマ{字|じ}マスター', url: 'https://sites.google.com/view/romajinyuuryoku/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'romajirenshu', emoji: '🔡', name: 'ローマ{字|じ}れんしゅう', url: 'https://sites.google.com/view/romajirensyuu/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'typingtei', emoji: '⌨️', name: 'タイピングマスター（ていがくねん）', url: 'https://claude.ai/artifact/87hE3TVFfXBBczDtKbTGyJ' },
          { id: 'typingchuko', emoji: '⌨️', name: 'タイピング（{中高学年|ちゅうこうがくねん}）', url: 'https://claude.ai/artifact/UGAfhC7vRaGa3TNFQdyTtq' },
          { id: 'typingstar', emoji: '⭐', name: 'タイピングマスター★', say: 'タイピングマスター スター', url: 'https://sites.google.com/view/taipinggmaster/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'programming', emoji: '🧑‍💻', name: 'プログラミング', url: 'https://script.google.com/a/macros/kodaira.ed.jp/s/AKfycbwwISvquqgK3DG6efV_RaOKDkYQO1gDhJAObqyGKBQv9hmfBuWmzXLGwEwT-c14n3NAMw/exec' },
          { id: 'robotpro2', emoji: '🤖', name: 'ロボットプログラミング②', say: 'ロボットプログラミング に', url: 'https://script.google.com/macros/s/AKfycbxxHcNErFRoeoc3_2bh7Tr-8GVIxLnFfVd40xyilg13rlzcVdFXn7fMQ6Ck2JkUzz-B/exec' },
        ] },
      ],
    },
    {
      id: 'shiraberu', name: 'しらべる へや', emoji: '🔭', color: '#0ea5e9', img: 'img/shiraberu.webp',
      spot: { x: 70, y: 3, w: 16, h: 31 },
      shelves: [
        { id: 'shiraberu', name: 'しらべる', emoji: '🔭', apps: [
          { id: 'todofuken', emoji: '🗾', name: 'とどうふけん しらべ', url: 'https://sites.google.com/view/todouhukensirabe/%E3%83%9B%E3%83%BC%E3%83%A0' },
        ] },
      ],
    },
    {
      id: 'tsukuru', name: 'つくる へや', emoji: '🎨', color: '#eab308', img: 'img/tsukuru.webp',
      spot: { x: 24, y: 52, w: 26, h: 25 },
      shelves: [
        { id: 'tsukuru', name: 'つくる', emoji: '🎨', apps: [
          { id: 'beads', emoji: '🌈', name: 'アイロンビーズ（ネームプレート）', url: 'https://zku0395-ops.github.io/hori/beads/' },
        ] },
      ],
    },
    {
      id: 'asobu', name: 'あそぶ へや', emoji: '⚽', color: '#22c55e', img: 'img/asobu.webp',
      spot: { x: 61.5, y: 36, w: 25.5, h: 24 },
      shelves: [
        { id: 'game', name: 'ゲーム', emoji: '🎲', apps: [
          { id: 'goblet', emoji: '🥤', name: 'ゴブレットゴブラーズ', url: 'https://sites.google.com/view/gobletgoblers/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'blocktsumi', emoji: '🧱', name: 'ブロックつみ', url: 'https://sites.google.com/view/burokkutuminew/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kazutori', emoji: '🔢', name: 'かずとりゲーム', url: 'https://sites.google.com/view/kazutorigame/%E3%83%9B%E3%83%BC%E3%83%A0' },
          { id: 'kazutori2', emoji: '🎲', name: 'かずとりゲーム②', say: 'かずとりゲーム に', url: 'https://sites.google.com/view/suujinarabegame2/%E3%83%9B%E3%83%BC%E3%83%A0' },
        ] },
      ],
    },
    {
      id: 'gyoji', name: 'ぎょうじの へや', emoji: '🎪', color: '#a855f7', img: 'img/gyoji.webp',
      spot: { x: 71.5, y: 53, w: 26, h: 27 },
      shelves: [
        { id: 'gyoji', name: 'ぎょうじ', emoji: '🎪', apps: [] },
      ],
    },
  ],

  // 先生用画面の「プリント」（子どもの画面には 出しません）
  prints: [
    { id: 'p-hissan', emoji: '🐿️', name: 'くりさがりの ある ひき算（プリント）', url: 'https://zku0395-ops.github.io/hori/hissan/print/' },
    { id: 'p-katakana', emoji: '🤖', name: 'カタカナプリント作成', url: 'https://sites.google.com/view/katakanapurinnto/%E3%83%9B%E3%83%BC%E3%83%A0' },
    { id: 'p-kanji1', emoji: '1️⃣', name: '漢字（1年）プリント', url: 'https://zku0395-ops.github.io/hori/kanjiprint/' },
    { id: 'p-kanji2', emoji: '2️⃣', name: '漢字（2年）プリント', url: 'https://zku0395-ops.github.io/hori/kanjiprint/?g=2' },
    { id: 'p-kanji3', emoji: '3️⃣', name: '漢字（3年）プリント', url: 'https://zku0395-ops.github.io/hori/kanjiprint/?g=3' },
    { id: 'p-nazotoki', emoji: '🐶', name: '文の読解（いつ・だれが）プリント', url: 'https://zku0395-ops.github.io/hori/nazotokiprint/' },
  ],

  // どの Chromebook でも はじめから「きょうの おすすめ」に 出す アプリの id（先生用画面で 変えると、その 台の 設定が 先に なります）
  osusume: [],
};
