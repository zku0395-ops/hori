// 例文の一覧（ichiran.md）を作る：node kanji2/tools/ichiran.js
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..');
global.window = {};
eval(fs.readFileSync(path.join(dir, 'data', 'mondai.js'), 'utf8'));
const { KANJI, STAGES, HATTEN } = window.KANJI_DATA;
const plain = (s) => s.replace(/\[(.+?)\]/g, '**$1**').replace(/\{(.+?)\|(.+?)\}/g, '$1（$2）');
const out = ['# 例文の一覧（ポンタせんせいの かんじ デパート）', '',
  '- このファイルは `node kanji2/tools/ichiran.js` で作ります。例文を直すときは `data/mondai.js` を直してください。',
  '- **太字** が問題の漢字、（ ）は ほかの漢字の ふりがなです。「こたえ」は、文の中での その漢字の読みです。',
  '- 「今日」「明日」のような とくべつな読みの ことばは、読みの問題（①②）だけで出します。', ''];
STAGES.filter(s => s.type === 'kanji').forEach((st, i) => {
  out.push(`## ステージ${i + 1}　${st.name}（${st.kanji.join(' ')}）`, '');
  out.push('| 漢字 | よみ | にている字 | 例文 | こたえ | 絵 |', '|---|---|---|---|---|---|');
  st.kanji.forEach(k => {
    const d = KANJI[k];
    d.ex.forEach((x, j) => out.push(`| ${j === 0 ? k : ''} | ${j === 0 ? d.yomi.join('・') : ''} | ${j === 0 ? d.look.join(' ') : ''} | ${plain(x.s)} | ${x.y} | ${x.e} |`));
  });
  out.push('');
});
HATTEN.forEach(h => {
  const okuri = h.type === 'okuri';
  out.push(`## ${h.name}（はじめは とじて います）`, '', `| ことば | よみ | 例文 | 絵 |${okuri ? ' まちがいやすい かきかた |' : ''}`, `|---|---|---|---|${okuri ? '---|' : ''}`);
  h.words.forEach(w => out.push(`| ${w.w} | ${w.y} | ${plain(w.s)} | ${w.e} |${okuri ? ` ${w.ng.join('・')} |` : ''}`));
  out.push('');
});
fs.writeFileSync(path.join(dir, 'ichiran.md'), out.join('\n'));
console.log('ichiran.md を作りました');
