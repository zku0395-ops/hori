// コード.gs の テスト（Apps Script の まねを する しくみで うごかす）：node kakezan/tools/test_gas.js
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
  Utilities: { formatDate: (d) => d.toISOString().slice(0, 10).replace(/-/g, '/') + ' 10:00', base64Encode: (b) => Buffer.from(b).toString('base64') },
  DriveApp: (() => {
    // ドライブの まね：「ひっさんクエスト え」に 絵が 2まいと 文書が 1つ。ほかの フォルダに 絵が 1まい
    const folder = { getId: () => 'F1' }, other = { getId: () => 'F2' };
    const file = (id, name, mime, parent) => ({ getId: () => id, getName: () => name, getMimeType: () => mime, getSize: () => 1000, getLastUpdated: () => new Date(1700000000000),
      getParents: () => { let d = false; return { hasNext: () => !d, next: () => { d = true; return parent; } }; }, getBlob: () => ({ getBytes: () => [1, 2, 3] }) });
    const files = [file('i1', 'monster_kusadango.png', 'image/png', folder), file('i2', 'kakeru_normal.webp', 'image/webp', folder), file('d1', 'メモ', 'application/vnd.google-apps.document', folder)];
    const secret = file('s1', 'himitsu.png', 'image/png', other);
    const iter = (a) => { let i = 0; return { hasNext: () => i < a.length, next: () => a[i++] }; };
    folder.getFiles = () => iter(files);
    let made = false;
    return {
      getFoldersByName: () => iter(made ? [folder] : []),
      createFolder: () => { made = true; return folder; },
      getFileById: (id) => files.concat([secret]).find(f => f.getId() === id),
    };
  })(),
  HtmlService: { createHtmlOutputFromFile: () => ({ setTitle() { return this; }, addMetaTag() { return this; }, setXFrameOptionsMode() { return this; } }), XFrameOptionsMode: {} },
  console, Date, JSON, Math, Object, String, Number, Array, Buffer, isNaN,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'コード.gs'), 'utf8'), ctx);


let bad = 0;
const ok = (c, msg) => { console.log((c ? '✔ ' : '✖ ') + msg); if (!c) bad++; };

// 1. シートの じゅんび
ctx.setup();
ok(['名簿', 'きろく', 'まとめ', 'せってい'].every(n => sheets[n]), '4つの シートが できる');
ok(sheets['きろく'].data[0].join(',') === '日時,なまえ,ばしょ,たたかい,もんだい,こたえ,けっか,まちがい,ヒント,まちがいの しゅるい,まちがえて いれた かず,びょう,ID', 'きろくの 見出し');
sheets['名簿'].getRange(2, 1, 2, 1).setValues([['たろう'], ['はなこ']]);
const init = ctx.getInitData();
ok(init.students.length === 2 && init.settings.count === 5 && init.settings.count2 === 3 && init.settings.kakashi === 10 && init.settings.rate === 0.8 && init.settings.hint === true && init.settings.yomi === true && init.settings.sound === true, 'はじめの 設定（5もん・3もん・10もん・0.8倍・ヒント・よみあげ・おと）');

// 2. きろくを うけとる
const rec = (id, o = {}) => Object.assign({ id, place: 'Lv2 みずうみの ほとり', battle: 'ざこ ①', prob: '27×3', ans: 81, result: '○', miss: 0, hint: 0, kinds: '', inputs: '', secs: 20 }, o);
const prog = JSON.stringify({ t: 100, gold: 30, hero: { job: 'yusha', form: 1 } });
let r = ctx.saveResult({ name: 'たろう', progress: prog, records: [rec('a1'), rec('a2', { prob: '34×3', ans: 102, result: '△', miss: 2, hint: 3, kinds: 'くりあがりの たしわすれ・くらいの まちがい', inputs: '10の位:9→0・100の位:2→1' }), rec('a3', { battle: '=SUM(A1)' })], time: Date.now() });
ok(r.ok, 'saveResult が うごく');
ok(sheets['きろく'].getLastRow() === 4, 'きろくが 3ぎょう ふえる');
ok(sheets['きろく'].data[3][3] === "'=SUM(A1)", '式に ならないように する');
ok(sheets['きろく'].data[2][4] === '34×3' && sheets['きろく'].data[2][5] === 102 && sheets['きろく'].data[2][6] === '△', 'もんだい・こたえ・けっか');
ctx.saveResult({ name: 'たろう', progress: prog, records: [rec('a1'), rec('a2')], time: Date.now() });
ok(sheets['きろく'].getLastRow() === 4, '同じ きろくは 二重に 書かない');
ok(JSON.parse(sheets['名簿'].data[1][1]).gold === 30, 'しんちょくを 名簿に 書く');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 50, gold: 0 }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).gold === 30, '古い しんちょくでは 上書きしない');
ok(ctx.saveResult({ name: 'いない', progress: prog, records: [] }).ok === false, '名簿に ない 名前は うけとらない');

// 3. 先生用
ok(ctx.getTeacherData('0000').ok === false, '暗証番号が ちがうと 見られない');
const td = ctx.getTeacherData('1234');
const t = td.students.find(s => s.name === 'たろう');
ok(td.ok && t.count === 3 && t.ok === 2 && t.miss === 2 && t.hint === 1, 'といた数・まちがえずに・まちがい・ヒント');
ok(t.places['Lv2 みずうみの ほとり'][0] === 3 && t.kinds['くりあがりの たしわすれ'] === 1, 'ばしょごと・まちがいの しゅるい');
ok(t.wrongs.length === 1 && t.wrongs[0][3] === '34×3' && t.wrongs[0][4].indexOf('9→0') >= 0, 'さいきん まちがえた 問題');
ok(sheets['まとめ'].data.length > 1, 'まとめシートを 作る');
ok(ctx.setFlag('1234', 'たろう', 'unlockAll', true).ok && JSON.parse(sheets['名簿'].data[1][1]).unlockAll === true, '全部開く');
ctx.setFlag('1234', 'たろう', 'range', '3');
ok(JSON.parse(sheets['名簿'].data[1][1]).range === 3, 'しゅぎょうの はんい');
ctx.setFlag('1234', 'たろう', 'remake', true);
ok(JSON.parse(sheets['名簿'].data[1][1]).hero === null, 'しゅじんこうを つくりなおす');
ok(ctx.setFlag('1234', 'たろう', 'gold', 999).ok === false, 'しらない フラグは うけとらない');
// 先生が 変えた あとに、古い 端末から しんちょくが とどいても のこす
const flagT = JSON.parse(sheets['名簿'].data[1][1]).flagT;
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: flagT - 10 + 20 * 0, gold: 40, hero: { job: 'mahou', form: 2 }, unlockAll: false }), records: [] });
let pr = JSON.parse(sheets['名簿'].data[1][1]);
ok(pr.t === undefined || pr.unlockAll === true, '古い しんちょくで 全部開くが きえない');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: flagT + 100, gold: 40, hero: { job: 'mahou', form: 2 }, unlockAll: true, range: 3, flagT }), records: [] });
pr = JSON.parse(sheets['名簿'].data[1][1]);
ok(pr.hero && pr.hero.job === 'mahou' && pr.gold === 40, 'つくりなおした しゅじんこうを うけとる');
ctx.addGold('1234', 'たろう', -100);
ok(JSON.parse(sheets['名簿'].data[1][1]).gold === 0, 'ゴールドは 0より へらない');
ctx.saveSettings('1234', { count: 3, count2: 5, kakashi: 5, hint: false, yomi: false, sound: false, rate: 0.7, newPin: '0042' });
const s2 = ctx.getInitData().settings;
ok(s2.count === 3 && s2.count2 === 5 && s2.kakashi === 5 && s2.hint === false && s2.yomi === false && s2.sound === false && s2.rate === 0.7, '設定を 保存する');
ok(ctx.getTeacherData('0042').ok && !ctx.getTeacherData('1234').ok, '暗証番号を 変える');
const bk = ctx.getBackup('0042');
ok(bk.ok && bk.data.app === 'kakezan' && bk.data.roster.length === 2, 'バックアップ');
ok(ctx.getLogRows('0042').rows.length === 4, 'CSV の ぎょう');
ctx.clearRecords('0042', 'たろう');
ok(sheets['きろく'].getLastRow() === 1 && sheets['名簿'].data[1][1] === '', 'たろうの 記録を 消す');
ok(ctx.restoreBackup('0042', bk.data).ok && JSON.parse(sheets['名簿'].data[1][1]).hero.job === 'mahou', 'バックアップから もどす');

// 4. 絵
const list = ctx.getImageList();
ok(list.ok && list.files.length === 2 && list.files[0].name === 'monster_kusadango.png' && list.files[0].t === 1700000000000, 'フォルダの 絵の 一覧（絵だけ）');
const im = ctx.getImage('i1');
ok(im.ok && im.mime === 'image/png' && im.b64 === Buffer.from([1, 2, 3]).toString('base64'), '絵を わたす');
ok(ctx.getImage('s1').ok === false, 'フォルダの そとの 絵は わたさない');
ok(ctx.getImage('d1').ok === false, '絵では ない ファイルは わたさない');

console.log(bad ? `\n${bad}こ もんだいが あります` : '\n✔ ぜんぶ OK');
process.exit(bad ? 1 : 0);
