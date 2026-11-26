// コード.gs の テスト（Apps Script の まねを する しくみで うごかす）：node ouchisagashi/tools/test_gas.js
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

// 0. アプリと 見出しが そろって いるか
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const head = /const LOG_HEADER = (\[.*?\]);/.exec(html)[1];
ok(JSON.stringify(eval(head)) === JSON.stringify(vm.runInContext('LOG_HEADER', ctx)), 'きろくの 見出しが アプリと おなじ');

// 1. シートの じゅんび
ctx.setup();
ok(['名簿', 'きろく', 'まとめ', 'せってい'].every(n => sheets[n]), '4つの シートが できる');
ok(sheets['きろく'].data[0].join(',') === '日時,なまえ,ステージ,もん,ばしょ,じゅうにん,ヒントの ぶん,けっか,まちがい,ヒント,まちがえた いえ,まちがいの しゅるい,よみあげ,びょう,ID', 'きろくの 見出し');
sheets['名簿'].getRange(2, 1, 2, 1).setValues([['たろう'], ['=はなこ']]);
const init = ctx.getInitData();
ok(init.students.length === 2 && init.settings.read === true && init.settings.rate === 0.8 && init.settings.font === 1 && init.settings.sound === true && init.settings.map === true, 'はじめの 設定（よみあげる・0.8倍・ふつう・おと あり・ちず あり）');

// 2. きろくを うけとる
const rec = (id, o = {}) => Object.assign({ id, stage: 's2a', q: 1, area: 'もり', who: 'くま', kinds: 'やね・にわ', result: '○', miss: 0, hint: 0, wrongs: '', wkinds: '', read: 'あり', secs: 12.5 }, o);
const prog = JSON.stringify({ t: 100, stickers: ['mori-01'], clear: { s1a: 1 } });
let r = ctx.saveResult({ name: 'たろう', progress: prog, time: Date.now(), records: [rec('a1'),
  rec('a2', { who: 'きつね', kinds: 'やね・となり（いえ）・いらない ぶん', result: '△', miss: 2, hint: 3, wrongs: 'りす・しか', wkinds: 'やね・となり（いえ）' }), rec('a3', { who: '=SUM(A1)', kinds: 'かべ' })] });
ok(r.ok, 'saveResult が うごく');
ok(sheets['きろく'].getLastRow() === 4, 'きろくが 3ぎょう ふえる');
ok(sheets['きろく'].data[3][5] === "'=SUM(A1)", '式に ならないように する');
ctx.saveResult({ name: 'たろう', progress: prog, records: [rec('a1'), rec('a2')], time: Date.now() });
ok(sheets['きろく'].getLastRow() === 4, '同じ きろくは 二重に 書かない');
ok(JSON.parse(sheets['名簿'].data[1][1]).stickers.length === 1, 'しんちょくを 名簿に 書く');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 50, stickers: [] }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).stickers.length === 1, '古い しんちょくでは 上書きしない');
ok(ctx.saveResult({ name: 'いない', progress: prog, records: [] }).ok === false, '名簿に ない 名前は うけとらない');
ok(ctx.getStudent('たろう') === prog, 'しんちょくを よみだす');

// 3. 先生用
ok(ctx.getTeacherData('0000').ok === false, '暗証番号が ちがうと 見られない');
ok(ctx.getLogRows('0000').ok === false && ctx.getBackup('0000').ok === false && ctx.clearRecords('0000', '').ok === false, '暗証番号が ちがうと 書き出しも 消去も できない');
const td = ctx.getTeacherData('1234');
const t = td.students.find(s => s.name === 'たろう');
ok(td.ok && td.isDefaultPin && t.count === 3 && t.ok === 2 && t.miss === 2 && t.hint === 1, 'といた数・1回で・まちがい・ヒント');
ok(t.kinds['やね'][0] === 2 && t.kinds['やね'][1] === 1 && t.kinds['となり（いえ）'][1] === 1 && t.kinds['にわ'][1] === 0 && td.classKinds['やね'][0] === 2, '文の しゅるいごとの 出た数・つまずいた数');
ok(t.lens[2][0] === 2 && t.lens[2][1] === 1 && t.lens[1][0] === 1, '文の かずごと（いらない 文は かぞえない）');
ok(t.stages['s2a'][0] === 3 && t.stages['s2a'][1] === 2, 'ステージごと');
ok(sheets['まとめ'].data.some(r => r[0] === 'たろう' && r[1] === 'やね' && r[2] === 2 && r[3] === 0.5), 'まとめシートに 文の しゅるいの 行');

// 4. フラグ・設定
r = ctx.setFlag('1234', 'たろう', 'hatten', true);
ok(r.ok && JSON.parse(r.progress).hatten === true, 'はってんを ひらく');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 120, stickers: ['mori-01', 'mori-02'], hatten: false }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).hatten === true, '先生の フラグは 古い 端末で けされない');
ok(ctx.setFlag('1234', 'たろう', 'stickers', 1).ok === false, 'ほかの フラグは かえられない');
ctx.saveSettings('1234', { read: false, sound: false, map: false, rate: 1, font: 1.3, newPin: '0042' });
const s2 = ctx.getInitData().settings;
ok(s2.read === false && s2.sound === false && s2.map === false && s2.rate === 1 && s2.font === 1.3, '設定を 保存する（よみあげない）');
ok(ctx.getTeacherData('0042').ok && !ctx.getTeacherData('1234').ok, '暗証番号を かえる（先頭の 0 も のこる）');

// 5. 書き出し・バックアップ・消去
ok(ctx.getLogRows('0042').rows.length === 4, 'きろくを 書き出す');
const bk = ctx.getBackup('0042');
ok(bk.ok && bk.data.app === 'ouchisagashi' && bk.data.roster.length === 2, 'バックアップ');
ctx.clearRecords('0042', 'たろう');
ok(sheets['きろく'].getLastRow() === 1 && sheets['名簿'].data[1][1] === '', 'ひとりの きろくを けす');
ok(ctx.restoreBackup('0042', bk.data).ok && JSON.parse(sheets['名簿'].data[1][1]).hatten === true, 'バックアップから もどす');
ok(ctx.restoreBackup('0042', { app: 'wakerun' }).ok === false, 'ほかの アプリの バックアップは うけつけない');

console.log(bad ? `\n${bad}こ まちがい` : '\nぜんぶ OK');
process.exit(bad ? 1 : 0);
