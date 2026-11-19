// コード.gs の テスト（Apps Script の まねを する しくみで うごかす）：node tashizan/tools/test_gas.js
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
ok(sheets['きろく'].data[0].join(',') === '日時,なまえ,ステージ,もんだい,こたえ,一のくらいの まちがい,くりあがりの まちがい,十のくらいの まちがい,百のくらいの まちがい,ヒント,じどうヒント,ID', 'きろくの 見出し');
sheets['名簿'].getRange(2, 1, 2, 1).setValues([['たろう'], ['=はなこ']]);
const init = ctx.getInitData();
ok(init.students.length === 2 && init.settings.rate === 0.85 && init.settings.big === false && init.settings.allOpen === false, 'はじめの 設定（0.85倍・ふつう・じゅんばん）');

// 2. きろくを うけとる
const rec = (id, o = {}) => Object.assign({ id, d: 1795000000000, st: 5, a: 28, b: 15, mo: 0, mc: 0, mt: 0, mh: 0, hint: 0, auto: 0 }, o);
const prog = JSON.stringify({ t: 100, coins: 15, exp: 30, cleared: 1, tre: [0], items: [], hero: 'yusha-f' });
let r = ctx.saveResult({ name: 'たろう', progress: prog, records: [rec('a1'), rec('a2', { mo: 3, mc: 1, auto: 1 }), rec('a3', { st: 10, a: 85, b: 47, mt: 2, hint: 1 })], time: Date.now() });
ok(r.ok, 'saveResult が うごく');
const L = sheets['きろく'].data;
ok(L.length === 4 && L[1][3] === '28+15' && L[1][4] === 43 && L[2][5] === 3 && L[2][10] === 1 && L[3][2] === 10 && L[3][11] === 'a3', '3行 書かれる（もんだい・こたえ・まちがい・ID）');
ok(L[1][0] instanceof Date && L[1][0].getTime() === 1795000000000, '日時は といた ときの じかん');
ctx.saveResult({ name: 'たろう', progress: prog, records: [rec('a1'), rec('a4')], time: Date.now() });
ok(sheets['きろく'].data.length === 5, '同じ ID は 二重に 書かない');
ok(ctx.getStudent('たろう') === prog, 'しんちょくが 名簿に 入る');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 50, coins: 0 }), records: [] });
ok(ctx.getStudent('たろう') === prog, '古い しんちょくでは 上書きしない');
ok(ctx.saveResult({ name: 'いない', progress: prog, records: [rec('z1')] }).reason === 'no-student', '名簿に ない 名前は ことわる');
ctx.saveResult({ name: '=はなこ', progress: '', records: [rec('b1', { id: '=x1' })] });
const last = sheets['きろく'].data[5];
ok(last[1] === "'=はなこ" && last[11] === "'=x1", '= で はじまる 文字は 式に ならない');

// 3. 先生用
ok(ctx.getTeacherData('0000').ok === false, 'ちがう 暗証番号は ことわる');
const t = ctx.getTeacherData('1234');
ok(t.ok && t.isDefaultPin && t.students.length === 2 && t.students[0].progress === prog, '先生用データ（名簿と しんちょく）');
ok(t.rows.length === 5 && t.rows[1].join(',') === '1795000000000,たろう,5,28+15,43,3,1,0,0,0,1', '先生用データ（記録の行）');
const S = sheets['まとめ'].data;
ok(S[0][0] === 'なまえ' && S[1][1] === 'ぜんたい' && S[1][2] === 4 && S[1][3] === 0.5 && S[1][4] === 3 && S[1][6] === 2, 'まとめ：ぜんたい（4問・半分が まちがえずに）');
ok(S[2][1] === '5 くりあがり②' && S[2][2] === 3 && S[3][1] === '10 こたえが 3けた③', 'まとめ：ステージごと');

// 4. 設定
ok(ctx.saveSettings('9999', { rate: 0.7 }).ok === false, '設定：ちがう 暗証番号は ことわる');
ctx.saveSettings('1234', { rate: 0.7, big: true, allOpen: true });
let st = ctx.getInitData().settings;
ok(st.rate === 0.7 && st.big === true && st.allOpen === true, '設定が かわる');
ok(settingsCell('もじの おおきさ') === 'おおきい' && settingsCell('ステージ') === 'ぜんぶ ひらく', 'せってい シートには ことばで 入る');
ctx.saveSettings('1234', { newPin: '0042' });
ok(ctx.getTeacherData('1234').ok === false && ctx.getTeacherData('0042').ok === true, '暗証番号が かわる');
ctx.saveSettings('0042', { newPin: 'abcd' });
ok(ctx.getTeacherData('0042').ok === true, '4けたの 数字で ない 番号には かえない');
function settingsCell(label) { return (sheets['せってい'].data.find(r => r[0] === label) || [])[1]; }

// 5. 消す
ok(ctx.clearRecords('1234', '').ok === false, '消す：ちがう 暗証番号は ことわる');
ctx.clearRecords('0042', 'たろう');
ok(ctx.getStudent('たろう') === '' && ctx.getTeacherData('0042').rows.length === 1, 'ひとりぶん 消す（ほかの子は のこる）');
ctx.clearRecords('0042', '');
ok(ctx.getTeacherData('0042').rows.length === 0, '全員ぶん 消す');

console.log(bad ? `\n${bad}こ しっぱい` : '\nぜんぶ OK');
process.exit(bad ? 1 : 0);
