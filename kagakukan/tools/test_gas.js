// コード.gs の テスト（Apps Script の まねを する しくみで うごかす）：node kagakukan/tools/test_gas.js
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
ok(sheets['きろく'].data[0].join(',') === '日時,なまえ,ステージ,もんだいID,もんだい,こたえ,けっか,まちがい,ヒント,えらんだ まちがい,びょう,ID', 'きろくの 見出し');
sheets['名簿'].getRange(2, 1, 2, 1).setValues([['たろう'], ['はなこ']]);
const init = ctx.getInitData();
const s0 = init.settings;
ok(init.students.length === 2 && s0.sound === true && s0.rate === 0.8 && s0.font === 1 && s0.date === '2026/12/10', 'はじめの 設定（0.8倍・けんがくの 日）');

// 2. きろくを うけとる
const rec = (id, o = {}) => Object.assign({ id, stage: '1', qid: 'p01', q: 'たいようは どの ほうから のぼる？', answer: 'ひがし', result: '○', miss: 0, hint: 0, wrong: '', secs: 6 }, o);
const prog = JSON.stringify({ t: 100, stars: 3, cleared: { '0': 1 }, hearts: { c1: 1, p1: 1 }, best: [] });
let r = ctx.saveResult({ name: 'たろう', progress: prog, records: [
  rec('a1'),
  rec('a2', { qid: 'p02', q: 'たいようが いちばん たかく なるのは どの ほう？', answer: 'みなみ', result: '△', miss: 2, hint: 3, wrong: 'きた・ひがし' }),
  rec('a3', { stage: '3', qid: 'c01', q: '「ムーンウォーカー」で できる ことは？', answer: '=SUM(A1)' }),
], time: Date.now() });
ok(r.ok, 'saveResult が うごく');
ok(sheets['きろく'].getLastRow() === 4, 'きろくが 3ぎょう ふえる');
ok(sheets['きろく'].data[3][5] === "'=SUM(A1)", '式に ならないように する');
ok(sheets['きろく'].data[2][9] === 'きた・ひがし' && sheets['きろく'].data[2][3] === 'p02', 'えらんだ まちがい・もんだいID');
ctx.saveResult({ name: 'たろう', progress: prog, records: [rec('a1'), rec('a2')], time: Date.now() });
ok(sheets['きろく'].getLastRow() === 4, '同じ きろくは 二重に 書かない');
ok(JSON.parse(sheets['名簿'].data[1][1]).stars === 3, 'しんちょくを 名簿に 書く');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 50, stars: 0 }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).stars === 3, '古い しんちょくでは 上書きしない');
ok(ctx.saveResult({ name: 'いない', progress: prog, records: [] }).ok === false, '名簿に ない 名前は うけとらない');
// ベスト3
const prog2 = JSON.stringify({ t: 200, stars: 9, cleared: { '0': 1, '9': 1 }, hearts: { c1: 1, p1: 1, k1: 1 }, best: [{ item: 'c1', reason: 'r6' }, { item: 'k1', reason: 'r1' }, { item: 't3', reason: 'r4' }] });
ctx.saveResult({ name: 'たろう', progress: prog2, records: [rec('b1', { stage: '9', qid: 'best1', q: 'ベスト1', answer: 'ムーンウォーカー', result: 'やって みたい から' })], time: Date.now() });
ctx.saveResult({ name: 'はなこ', progress: JSON.stringify({ t: 10, hearts: { c1: 1 }, best: [{ item: 'c1', reason: 'r1' }] }), records: [] });

// 3. 先生用
ok(ctx.getTeacherData('0000').ok === false, '暗証番号が ちがうと 見られない');
const td = ctx.getTeacherData('1234');
const t = td.students.find(s => s.name === 'たろう');
ok(td.ok && t.count === 3 && t.ok === 2, '問題の数と まちがえずに できた 数（ベスト3は 数えない）');
ok(t.miss['たいようが いちばん たかく なるのは どの ほう？'] === 1 && td.classMiss['たいようが いちばん たかく なるのは どの ほう？'].w['きた'] === 1, 'つまずいた もんだいと えらんだ まちがい');
const sum = sheets['まとめ'].data;
ok(sum[1][0] === 'たろう' && sum[1][4] === 'ムーンウォーカー' && sum[1][5] === 'やって みたい から' && sum[1][1] === '0 9', 'まとめ：ベスト3と りゆう・クリア');
const rk = sum.find(row => row[0] === 'ムーンウォーカー' && row[1] === 'チャレンジの部屋');
ok(rk && rk[2] === 8 && rk[3] === 'たろう・はなこ', 'にんき ランキング（3点＋1点）');

// 4. 設定・フラグ
ctx.saveSettings('1234', { sound: false, rate: 0.7, font: 1.15, date: '2026/12/11', newPin: '0123' });
const s2 = ctx.getInitData().settings;
ok(s2.sound === false && s2.rate === 0.7 && s2.font === 1.15 && s2.date === '2026/12/11', '設定を 保存して よみだす');
ctx.saveSettings('0123', { date: '=1+1' });
ok(ctx.getInitData().settings.date === '2026/12/11', 'へんな 日にちは うけつけない');
ok(ctx.getTeacherData('0123').ok, '暗証番号を かえる（先頭の 0 も のこる）');
ctx.setFlag('0123', 'たろう', 'unlockAll', true);
ok(ctx.setFlag('0123', 'たろう', 'stars', true).ok === false, 'しらない フラグは うけつけない');
const p2 = JSON.parse(sheets['名簿'].data[1][1]);
ok(p2.unlockAll === true && p2.best.length === 3, '全部開く');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: p2.flagT - 10, unlockAll: false }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).unlockAll === true, '先生が 変えた フラグは 古い 端末で もどらない');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: p2.flagT + 10, stars: 12, unlockAll: false, flagT: 1 }), records: [] });
const p3 = JSON.parse(sheets['名簿'].data[1][1]);
ok(p3.unlockAll === true && p3.stars === 12, 'あたらしい しんちょくでも 先生の フラグは のこる');

// 5. バックアップ・消す
const bk = ctx.getBackup('0123');
ok(bk.ok && bk.data.app === 'kagakukan' && bk.data.roster.length === 2, 'バックアップ');
ok(ctx.restoreBackup('0123', { app: 'sukiwake', roster: [] }).ok === false, 'ほかの アプリの バックアップは うけつけない');
ctx.clearRecords('0123', 'たろう');
ok(sheets['きろく'].getLastRow() === 1 && sheets['名簿'].data[1][1] === '', 'この子の 記録を 消す');
ok(ctx.restoreBackup('0123', bk.data).ok && JSON.parse(sheets['名簿'].data[1][1]).stars === 12, 'バックアップから もどす');

console.log(bad ? `✖ ${bad}けん うまく いきません` : '✔ ぜんぶ うまく いきました');
process.exit(bad ? 1 : 0);
