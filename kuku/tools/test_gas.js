// コード.gs の テスト（Apps Script の まねを する しくみで うごかす）：node kuku/tools/test_gas.js
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
ok(sheets['きろく'].data[0].join(',') === '日時,なまえ,ステージ,しゅぎょう,もんだい,こたえ,けっか,まちがい,ヒント,まちがいの しゅるい,えらんだ こたえ,くく,こたえかた,びょう,ID', 'きろくの 見出し');
sheets['名簿'].getRange(2, 1, 2, 1).setValues([['たろう'], ['=はなこ']]);
const init = ctx.getInitData();
const s0 = init.settings;
ok(init.students.length === 2 && s0.count === 5 && s0.mode === 'auto' && s0.tonae === true && s0.pass === 7 && s0.sound === true && s0.rate === 0.8, 'はじめの 設定（5問・じどう・となえかた だす・ごうかく7・0.8倍）');

// 2. きろくを うけとる
const rec = (id, o = {}) => Object.assign({ id, stage: '5-2', step: '1かい 5の だん ②じゅんばん', problem: '5×3', answer: '15', result: '○', miss: 0, hint: 0, types: '', picks: '', kuku: '5×3', how: 'えらぶ', secs: 4.2 }, o);
const prog = JSON.stringify({ t: 100, coins: 3, cleared: { '0-1': 1 } });
let r = ctx.saveResult({ name: 'たろう', progress: prog, records: [
  rec('a1'),
  rec('a2', { stage: '7-4', step: '6かい 7の だん ④にんじゃ しけん', problem: '7×6', answer: '42', result: '△', miss: 2, hint: 1, types: 'となりの こたえ・ちがう だん', picks: '35・36', kuku: '7×6', how: 'すうじ' }),
  rec('a3', { stage: 'H1', problem: '=SUM(A1)', kuku: '' }),
], time: Date.now() });
ok(r.ok, 'saveResult が うごく');
ok(sheets['きろく'].getLastRow() === 4, 'きろくが 3ぎょう ふえる');
ok(sheets['きろく'].data[3][4] === "'=SUM(A1)", '式に ならないように する');
ok(sheets['きろく'].data[2][11] === '7×6' && sheets['きろく'].data[2][2] === '7-4' && sheets['きろく'].data[2][12] === 'すうじ', 'くく・ステージ・こたえかた');
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
ok(td.ok && t.count === 3 && t.ok === 2, '問題の数と まちがえずに できた 数');
ok(t.types['となりの こたえ'] === 1 && t.types['ちがう だん'] === 1 && td.classTypes['となりの こたえ'] === 1, 'まちがいの しゅるい');
ok(JSON.stringify(t.kuku['7×6']) === '[1,0,2,1]' && JSON.stringify(t.kuku['5×3']) === '[1,1,0,0]' && td.classKuku['7×6'][0] === 1, 'くくごとの 結果（もんだい・まちがえずに・まちがい・ヒント）');
ok(t.missProb['7-4：7×6'] === 1, 'まちがえた もんだい');
ok(t.stages['5-2'][0] === 1 && t.stages['H1'][0] === 1, 'ステージごとの 結果');
ok(sheets['まとめ'].data.length >= 2 && sheets['まとめ'].data[1][0] === 'たろう', 'まとめ シートが できる');
ok(String(sheets['まとめ'].data[1][5]).includes('5の だん 1/1') && String(sheets['まとめ'].data[1][5]).includes('7の だん 0/1'), 'まとめ シートの だんごと');

// 4. 設定・フラグ・こばん
ctx.saveSettings('1234', { count: 9, mode: 'key', tonae: false, pass: 9, sound: false, rate: 0.7, font: 1.15, newPin: '0123' });
const s2 = ctx.getInitData().settings;
ok(s2.count === 9 && s2.mode === 'key' && s2.tonae === false && s2.pass === 9 && s2.sound === false && s2.rate === 0.7 && s2.font === 1.15, '設定を 保存して よみだす');
ok(sheets['せってい'].data.some(row => row[0] === 'こたえかた' && row[1] === 'すうじ'), 'こたえかたは ことばで 書く');
ctx.saveSettings('0123', { pass: 0 });
ok(ctx.getInitData().settings.pass === 0, 'ごうかく「さいごまで こたえたら」（0）');
ok(ctx.getTeacherData('0123').ok, '暗証番号を かえる（先頭の 0 も のこる）');
ctx.setFlag('0123', 'たろう', 'unlockAll', true);
ctx.setFlag('0123', 'たろう', 'skipIri', true);
ok(ctx.setFlag('0123', 'たろう', 'coins', true).ok === false, 'しらない フラグは うけつけない');
ctx.addCoins('0123', 'たろう', 5);
const p2 = JSON.parse(sheets['名簿'].data[1][1]);
ok(p2.unlockAll === true && p2.skipIri === true && p2.coins === 8, '全部開く・いりぐちを とばす・こばんを たす');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: p2.flagT - 10, coins: 8, unlockAll: false, skipIri: false }), records: [] });
const p3 = JSON.parse(sheets['名簿'].data[1][1]);
ok(p3.unlockAll === true && p3.skipIri === true, '先生が 変えた フラグは 古い 端末で もどらない');

// 5. バックアップ・消す
const bk = ctx.getBackup('0123');
ok(bk.ok && bk.data.app === 'kuku' && bk.data.roster.length === 2, 'バックアップ');
ok(ctx.restoreBackup('0123', { app: 'warizan', roster: [] }).ok === false, 'ほかの アプリの バックアップは うけつけない');
ctx.clearRecords('0123', 'たろう');
ok(sheets['きろく'].getLastRow() === 1 && sheets['名簿'].data[1][1] === '', 'この子の 記録を 消す');
ok(ctx.restoreBackup('0123', bk.data).ok && JSON.parse(sheets['名簿'].data[1][1]).coins === 8, 'バックアップから もどす');

console.log(bad ? `✖ ${bad}けん うまく いきません` : '✔ ぜんぶ うまく いきました');
process.exit(bad ? 1 : 0);
