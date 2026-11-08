// コード.gs の テスト（Apps Script の まねを する しくみで うごかす）：node wakerun/tools/test_gas.js
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
const ss = {
  getSheetByName: (n) => sheets[n] || null,
  insertSheet: (n) => (sheets[n] = makeSheet(n)),
  toast: () => {},
};
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
ok(sheets['きろく'].data[0].join(',') === '日時,なまえ,ステージ,かい,さがす ぶんすう,みつけた かたち,けっか,まちがい,ヒント,まちがえた もの,まちがいの しゅるい,びょう,ID', 'きろくの 見出し');
sheets['名簿'].getRange(2, 1, 2, 1).setValues([['たろう'], ['=はなこ']]);
const init = ctx.getInitData();
ok(init.students.length === 2 && init.settings.count === 10 && init.settings.speed === 1 && init.settings.at === 3 && init.settings.rate === 0.8 && init.settings.sound === true, 'はじめの 設定（10こ・ゆっくり・3こ・0.8倍・おと あり）');

// 2. きろくを うけとる
const rec = (id, o = {}) => Object.assign({ id, stage: 's1', round: 1, target: '1/2', shape: 'ピザ', result: '○', miss: 0, hint: 0, wrongs: '', kinds: '', secs: 2.5 }, o);
const prog = JSON.stringify({ t: 100, coins: 3, rounds: { s0: 1 } });
let r = ctx.saveResult({ name: 'たろう', progress: prog, records: [rec('a1'), rec('a2', { target: '1/3', shape: 'しかく', result: '△', miss: 2, hint: 3, wrongs: 'まる:1/4・ピザ:ひとしくない', kinds: 'ほかの ぶんすう・ひとしくない' }), rec('a3', { shape: '=SUM(A1)' })], time: Date.now() });
ok(r.ok, 'saveResult が うごく');
ok(sheets['きろく'].getLastRow() === 4, 'きろくが 3ぎょう ふえる');
ok(sheets['きろく'].data[3][5] === "'=SUM(A1)", '式に ならないように する');
ok(sheets['きろく'].data[1][4] === '1/2', 'ぶんすうは 文字の まま');
ctx.saveResult({ name: 'たろう', progress: prog, records: [rec('a1'), rec('a2')], time: Date.now() });
ok(sheets['きろく'].getLastRow() === 4, '同じ きろくは 二重に 書かない');
ok(JSON.parse(sheets['名簿'].data[1][1]).coins === 3, 'しんちょくを 名簿に 書く');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 50, coins: 0 }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).coins === 3, '古い しんちょくでは 上書きしない');
ok(ctx.saveResult({ name: 'いない', progress: prog, records: [] }).ok === false, '名簿に ない 名前は うけとらない');

// 3. 先生用
ok(ctx.getTeacherData('0000').ok === false, '暗証番号が ちがうと 見られない');
const td = ctx.getTeacherData('1234');
const t = td.students.find(s => s.name === 'たろう');
ok(td.ok && t.count === 3 && t.ok === 2 && t.miss === 2 && t.hint === 1, '見つけた数・まちがえずに・まちがい・ヒント');
ok(t.fracs['1/2'][0] === 2 && t.fracs['1/3'][2] === 2, '分数ごとの 結果');
ok(t.confuse['1/3→1/4'] === 1 && t.confuse['1/3→ひとしくない'] === 1 && td.classConfuse['1/3→1/4'] === 1, 'まちがえやすい 分数');
ok(t.kinds['ほかの ぶんすう'] === 1 && t.kinds['ひとしくない'] === 1, 'まちがいの しゅるい');
ok(t.shapes['ピザ'][0] === 1 && t.shapes['ピザ'][1] === 1 && t.shapes['まる'][1] === 1, '形ごとの 結果');
ok(sheets['まとめ'].data.some(r => r[0] === 'たろう' && r[1] === "'1/3"), 'まとめシートに 分数ごとの 行');
// 日づけに なって しまった 1/2 も もどす
ok(ctx.fracText_(new Date(2026, 0, 2)) === '1/2', '日づけに なった 1/2 を もどす');

// 4. フラグ・コイン・設定
r = ctx.setFlag('1234', 'たろう', 'hatten', true);
ok(r.ok && JSON.parse(r.progress).hatten === true, 'はってんを ひらく');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 120, coins: 9, hatten: false }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).hatten === true, '先生の フラグは 古い 端末で けされない');
ok(ctx.setFlag('1234', 'たろう', 'coins', 1).ok === false, 'ほかの フラグは かえられない');
r = ctx.addCoins('1234', 'たろう', -100);
ok(JSON.parse(r.progress).coins === 0, 'コインは 0より へらない');
ctx.saveSettings('1234', { count: 15, speed: 3, at: 5, sound: false, rate: 1, newPin: '0042' });
const s2 = ctx.getInitData().settings;
ok(s2.count === 15 && s2.speed === 3 && s2.at === 5 && s2.sound === false && s2.rate === 1, '設定を 保存する');
ok(ctx.getTeacherData('0042').ok, '暗証番号を かえる（先頭の 0 も のこる）');

// 5. バックアップ・消去
const bk = ctx.getBackup('0042');
ok(bk.ok && bk.data.app === 'wakerun' && bk.data.roster.length === 2, 'バックアップ');
ctx.clearRecords('0042', 'たろう');
ok(sheets['きろく'].getLastRow() === 1 && sheets['名簿'].data[1][1] === '', 'ひとりの きろくを けす');
ok(ctx.restoreBackup('0042', bk.data).ok && JSON.parse(sheets['名簿'].data[1][1]).coins === 0, 'バックアップから もどす');
ok(ctx.restoreBackup('0042', { app: 'pico' }).ok === false, 'ほかの アプリの バックアップは うけつけない');

console.log(bad ? `\n${bad}こ まちがい` : '\nぜんぶ OK');
process.exit(bad ? 1 : 0);
