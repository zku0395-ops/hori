// としょかんの 目録（toshokan/mokuroku.json）を 作りなおす
// 使い方：リポジトリの いちばん上で  node toshokan/tools/mokuroku.js
// GitHub の 一覧の 窓口（1時間に60回まで）が 使えないとき、アプリは この 目録を 読みます。
// 新しい アプリや ファイルを 足したら、これを 動かして 一緒に コミットします。
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..', '..');
const OUT = path.join(root, 'toshokan', 'mokuroku.json');
const paths = execSync('git ls-files -z --cached --others --exclude-standard', { cwd: root }).toString('utf8').split('\0').filter(Boolean)
  .filter(p => p !== 'toshokan/mokuroku.json');
if (!paths.includes('toshokan/mokuroku.json')) paths.push('toshokan/mokuroku.json');
paths.sort();

// README.md の 1行目の 見出しを 本の なまえに する
const titles = {};
paths.filter(p => /(^|\/)README\.md$/.test(p)).forEach(p => {
  const line = fs.readFileSync(path.join(root, p), 'utf8').split('\n').find(l => /^#\s/.test(l));
  if (line) titles[p.replace(/\/?README\.md$/, '')] = line.trim();
});

fs.writeFileSync(OUT, JSON.stringify({ note: 'node toshokan/tools/mokuroku.js で 作ります。手で 書きかえないでください。', paths, titles }, null, 1) + '\n');
console.log(`目録を 書きました：ファイル ${paths.length}こ、本 ${Object.keys(titles).length}さつ`);
