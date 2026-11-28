// コード.gs の テスト（Apps Script の まねを する しくみで うごかす）：node kanjiquest/tools/test_gas.js
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
ok(['名簿', 'きろく', 'まとめ', 'せってい'].every((n) => sheets[n]), '4つの シートが できる');
ok(sheets['きろく'].data[0].join(',') === '日時,なまえ,ステージ,かんじ,もんだい,わざ,みほん,けっか,まちがい,ヒント,まちがえた こたえ,びょう,ID', 'きろくの 見出し');
sheets['名簿'].getRange(2, 1, 2, 1).setValues([['たろう'], ['はなこ']]);
const init = ctx.getInitData();
const s0 = init.settings;
ok(init.students.length === 2 && s0.count === 5 && s0.rate === 0.8 && s0.sound === true && s0.kana === 'もじカード' && s0.mihon === 'なし' && s0.judge === 'やさしい', 'はじめの 設定');

// 2. きろくを うけとる
const rec = (id, o = {}) => Object.assign({ id, time: Date.now(), stage: 's1', k: '一', problem: 'りんごが 一つ あります。', waza: 'よみ・えらぶ', mihon: '', result: '○', miss: 0, hint: 0, wrong: '', secs: 4 }, o);
const prog = JSON.stringify({ t: 100, gold: 3, hero: 'yusha', st: { s1: { lv: 2, clear: 1, done: false } } });
let r = ctx.saveResult({ name: 'たろう', progress: prog, records: [
  rec('a1'),
  rec('a2', { k: '二', waza: 'かんじ・えらぶ', result: '△', miss: 1, hint: 0, wrong: '三' }),
  rec('a3', { k: '三', waza: 'かんじ・かく', mihon: 'なぞる', problem: '=SUM(A1)' }),
], time: Date.now() });
ok(r.ok, 'saveResult が うごく');
ok(sheets['きろく'].getLastRow() === 4, 'きろくが 3ぎょう ふえる');
ok(sheets['きろく'].data[3][4] === "'=SUM(A1)", '式に ならないように する');
ok(sheets['きろく'].data[2][3] === '二' && sheets['きろく'].data[2][5] === 'かんじ・えらぶ' && sheets['きろく'].data[2][10] === '三', 'かんじ・わざ・まちがえた こたえ');
ctx.saveResult({ name: 'たろう', progress: prog, records: [rec('a1'), rec('a2')], time: Date.now() });
ok(sheets['きろく'].getLastRow() === 4, '同じ きろくは 二重に 書かない');
ok(JSON.parse(sheets['名簿'].data[1][1]).gold === 3, 'しんちょくを 名簿に 書く');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 50, gold: 0 }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).gold === 3, '古い しんちょくでは 上書きしない');
ok(ctx.saveResult({ name: 'いない', progress: prog, records: [] }).ok === false, '名簿に ない 名前は うけとらない');

// 3. 先生用
ok(ctx.getTeacherData('0000').ok === false, '暗証番号が ちがうと ひらかない');
const td = ctx.getTeacherData('1234');
const taro = td.students.find((s) => s.name === 'たろう');
ok(td.ok && td.isDefaultPin && taro.count === 3 && taro.ok === 2, '先生用の まとめ（3問・2問 まちがえずに）');
ok(taro.kanji['二|かんじ・えらぶ'][0] === 1 && taro.kanji['二|かんじ・えらぶ'][2] === 1, '漢字ごと・わざごとの 表');
ok(sheets['まとめ'].data.length > 1, '「まとめ」シートを 作る');
ctx.setFlag('1234', 'たろう', 'unlockAll', true);
ok(JSON.parse(sheets['名簿'].data[1][1]).unlockAll === true, '全部開く');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 200, gold: 9, unlockAll: false }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).unlockAll === true, '先生の 全部開くは 古い 端末で 消えない');
ctx.addGold('1234', 'たろう', 10);
const g = JSON.parse(sheets['名簿'].data[1][1]).gold;
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 300 - 1e9, gold: 0 }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).gold === g, '先生が 足した ゴールドは のこる');
ctx.saveSettings('1234', { count: 3, kana: '50おんひょう', mihon: 'へんな あたい', sound: false, newPin: '5678' });
const s1 = ctx.getInitData().settings;
ok(s1.count === 3 && s1.kana === '50おんひょう' && s1.mihon === 'なし' && s1.sound === false, '設定を 保存する（へんな あたいは 入れない）');
ok(ctx.getTeacherData('5678').ok === true, '暗証番号を かえる');
ok(ctx.getBackup('5678').data.app === 'kanjiquest', 'バックアップ');
ctx.clearRecords('5678', 'たろう');
ok(sheets['きろく'].getLastRow() <= 1 && sheets['名簿'].data[1][1] === '', 'この子の 記録を 消す');

console.log(bad ? `\n✖ ${bad}こ しっぱい` : '\nぜんぶ OK');
process.exit(bad ? 1 : 0);
