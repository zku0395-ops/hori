// コード.gs の テスト（Apps Script の まねを する しくみで うごかす）：node katachi/tools/test_gas.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ---- スプレッドシートの まね ----
function makeSheet(name) {
  const sh = { name, data: [], fmt: {} };
  const ensure = (r, c) => { while (sh.data.length < r) sh.data.push([]); sh.data.forEach(row => { while (row.length < c) row.push(''); }); };
  const width = () => Math.max(0, ...sh.data.map(r => r.length));
  sh.getLastRow = () => { for (let i = sh.data.length; i > 0; i--) if (sh.data[i - 1].some(v => v !== '' && v != null)) return i; return 0; };
  sh.getRange = (a, b, c, d) => {
    if (typeof a === 'string') return { setNumberFormat() { return this; } };
    const r0 = a, c0 = b, nr = c || 1, nc = d || 1;
    const rg = {
      getValues: () => { ensure(r0 + nr - 1, c0 + nc - 1); return sh.data.slice(r0 - 1, r0 - 1 + nr).map(row => row.slice(c0 - 1, c0 - 1 + nc)); },
      getValue: () => rg.getValues()[0][0],
      getDisplayValues: () => rg.getValues().map(r => r.map(String)),
      setValues: (v) => { ensure(r0 + nr - 1, c0 + nc - 1); v.forEach((row, i) => row.forEach((x, j) => { sh.data[r0 - 1 + i][c0 - 1 + j] = x; })); return rg; },
      setValue: (v) => rg.setValues([[v]]),
      clearContent: () => rg.setValues(Array.from({ length: nr }, () => Array(nc).fill(''))),
      setFontWeight: () => rg, setBackground: () => rg, setBackgrounds: () => rg, setNumberFormat: () => rg,
    };
    return rg;
  };
  sh.getDataRange = () => sh.getRange(1, 1, Math.max(1, sh.getLastRow()), Math.max(1, width()));
  sh.appendRow = (row) => { const r = sh.getLastRow() + 1; sh.getRange(r, 1, 1, row.length).setValues([row]); };
  sh.setFrozenRows = () => {}; sh.setColumnWidth = () => {};
  sh.clear = () => { sh.data = []; };
  return sh;
}
const sheets = {};
const ss = { getSheetByName: (n) => sheets[n] || null, insertSheet: (n) => (sheets[n] = makeSheet(n)), toast: () => {} };
const ctx = {
  SpreadsheetApp: { getActiveSpreadsheet: () => ss, getUi: () => ({ createMenu: () => ({ addItem() { return this; }, addToUi() {} }) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Session: { getScriptTimeZone: () => 'Asia/Tokyo' },
  Utilities: { formatDate: (d) => d.toISOString().slice(0, 10).replace(/-/g, '/') + ' 10:00' },
  HtmlService: { createHtmlOutputFromFile: () => ({ setTitle() { return this; }, addMetaTag() { return this; }, setXFrameOptionsMode() { return this; } }), XFrameOptionsMode: {} },
  console, Date, JSON, Math, Object, String, Number, Array,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'コード.gs'), 'utf8'), ctx);

let bad = 0;
const ok = (c, msg) => { console.log((c ? '✔ ' : '✖ ') + msg); if (!c) bad++; };

// 1. シートの じゅんび
ctx.setup();
ok(['名簿', 'きろく', 'まとめ', 'せってい'].every(n => sheets[n]), '4つの シートが できる');
ok(sheets['きろく'].data[0].join(',') === '日時,なまえ,ステージ,もんだい,けっか,まちがい,ヒント,まちがいの しゅるい,びょう,ID', 'きろくの 見出し');
sheets['名簿'].getRange(2, 1, 2, 1).setValues([['たろう'], ['はなこ']]);
const init = ctx.getInitData();
ok(init.students.length === 2 && init.settings.count === 5 && init.settings.rate === 0.8 && init.settings.font === 1 && init.settings.sound === true, 'はじめの 設定（5もん・0.8倍・おと あり）');

// 2. きろくを うけとる
const rec = (id, o = {}) => Object.assign({ id, stage: '1-2', label: '点をむすぶ(三角形)', result: '○', miss: 0, hint: 0, kinds: '', secs: 12 }, o);
let r = ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 100, coins: 3, xp: 30 }), time: Date.now(),
  records: [rec('a1'), rec('a2', { result: '△', miss: 2, hint: 3, kinds: 'いっちょくせん・★を つかわない' }), rec('a3', { stage: '5-2', label: '=SUM(A1)', result: '△', miss: 1, kinds: 'わけの えらび まちがい' })] });
ok(r.ok && sheets['きろく'].getLastRow() === 4, 'きろくが 3ぎょう ふえる');
ok(sheets['きろく'].data[3][3] === "'=SUM(A1)", '式に ならないように する');
ok(sheets['きろく'].data[1][2] === '1-2', 'ステージは 文字の まま');
ctx.saveResult({ name: 'たろう', progress: '', records: [rec('a1'), rec('a4')], time: Date.now() });
ok(sheets['きろく'].getLastRow() === 5, 'おなじ きろくは 二重に 書かない');
ok(ctx.saveResult({ name: 'だれか', records: [rec('z1')] }).ok === false, '名簿に ない なまえは 書かない');
ok(JSON.parse(ctx.getStudent('たろう')).coins === 3, 'しんちょくが 名簿に のこる');

// 3. 古い しんちょくでは 上書きしない・先生の「全部開く」は のこる
ok(ctx.setFlag('1234', 'たろう', 'unlockAll', true).ok && ctx.setFlag('0000', 'たろう', 'unlockAll', false).ok === false, '全部開く（暗証番号が ちがうと できない）');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 50, coins: 99 }), records: [] });
ok(JSON.parse(ctx.getStudent('たろう')).coins === 3, '古い しんちょくでは 上書きしない');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: Date.now() + 5000, coins: 8, unlockAll: false }), records: [] });
ok(JSON.parse(ctx.getStudent('たろう')).coins === 8, '新しい しんちょくで 上書きする');
ctx.setFlag('1234', 'たろう', 'unlockAll', true);
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: Date.now() - 1000, coins: 8, unlockAll: false }), records: [] });
ok(JSON.parse(ctx.getStudent('たろう')).unlockAll === true, '先生の「全部開く」は のこる');
ok(ctx.addCoins('1234', 'たろう', 10).ok && JSON.parse(ctx.getStudent('たろう')).coins === 18, 'コインを 足す');

// 4. 先生用の まとめ
ok(ctx.getTeacherData('9999').ok === false, '暗証番号が ちがうと 見られない');
const t = ctx.getTeacherData('1234');
const taro = t.students[0];
ok(t.ok && t.isDefaultPin && taro.count === 4 && taro.ok === 2 && taro.miss === 3 && taro.hint === 1, '子どもごとの 集計');
ok(taro.stages['1-2'][0] === 3 && taro.stages['5-2'][3]['わけの えらび まちがい'] === 1 && t.classKinds['いっちょくせん'] === 1, 'ステージごと・まちがいの しゅるい');
ok(sheets['まとめ'].data[1][1] === 'ぜんたい' && sheets['まとめ'].data[2][1] === '1-2', 'まとめシートが できる');

// 5. 設定・書き出し・バックアップ・消去
ok(ctx.saveSettings('1234', { rate: 0.7, font: 1.15, count: 7, sound: false, newPin: '4321' }).ok, '設定を 保存');
const s2 = ctx.getInitData().settings;
ok(s2.rate === 0.7 && s2.font === 1.15 && s2.count === 7 && s2.sound === false, '設定が かわる');
ok(ctx.getTeacherData('1234').ok === false && ctx.getTeacherData('4321').ok, '暗証番号が かわる');
ok(ctx.getLogRows('4321').rows.length === 5, 'きろくの 書き出し');
const b = ctx.getBackup('4321');
ok(b.ok && b.data.app === 'katachi' && b.data.roster.length === 2, 'バックアップ');
ok(ctx.clearRecords('4321', 'たろう').ok && sheets['きろく'].getLastRow() === 1 && ctx.getStudent('たろう') === '', 'きろくを 消す');
ok(ctx.restoreBackup('4321', b.data).ok && JSON.parse(ctx.getStudent('たろう')).coins === 18, 'バックアップから もどす');
ok(ctx.restoreBackup('4321', { app: 'wakerun' }).ok === false, 'ほかの アプリの バックアップは うけつけない');

console.log(bad ? `\n✖ ${bad}こ しっぱい` : '\n✔ ぜんぶ とおりました');
process.exit(bad ? 1 : 0);
