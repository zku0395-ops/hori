// コード.gs の テスト（Apps Script の まねを する しくみで うごかす）：node kokuban/tools/test_gas.js
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
ok(['名簿', 'ぶんしょう', 'きろく', 'まとめ', 'せってい'].every(n => sheets[n]), '5つの シートが できる');
ok(sheets['きろく'].data[0].join(',') === '日時,なまえ,ぶんしょう,とい,したこと,いろ,ことば,ID', 'きろくの 見出し');
sheets['名簿'].getRange(2, 1, 2, 1).setValues([['たろう'], ['はなこ']]);
const init = ctx.getInitData();
ok(init.students.length === 2 && init.settings.rate === 0.8 && init.settings.vertical === true && init.settings.sound === true, 'はじめの 設定（0.8倍・たて書き）');
ok(init.texts.length === 2 && init.texts[0].id === 's1' && init.texts[0].qs.length === 3 && init.texts[1].kind === 'せつめいぶん', 'れんしゅう用の 文章が 2つ 入る');

// 2. マイこくばんを うけとる
const big = JSON.stringify({ v: 1, marks: { 1: 'r' }, items: [{ t: 'f', text: 'あ'.repeat(90000) }] });
const sum = { lines: 'あか：りすに', pasted: '=わるい しき', own: 'くもの ぼうし', etc: '😊' };
const rec = (id, o = {}) => Object.assign({ id, text: 'くもの ぼうし', q: 'とい1', act: 'せんを ひく', color: 'あか', word: 'りすに' }, o);
let r = ctx.saveWork({ name: 'たろう', textId: 's1', title: 'くもの ぼうし', data: big, done: false, summary: sum,
  progress: JSON.stringify({ t: 100, stickers: [{ e: '🍎' }] }), records: [rec('a1'), rec('a2', { word: '+1+1' })], time: Date.now() });
ok(r.ok, 'saveWork が うごく');
ok(sheets['まとめ'].getLastRow() === 2 && sheets['まとめ'].data[1][4] === 'とちゅう', 'まとめに 1行 できる');
ok(sheets['まとめ'].data[1].length >= 12 && sheets['まとめ'].data[1][9].length === 40000, '長い データは いくつかの セルに 分ける');
ok(ctx.getWork('たろう', 's1') === big, 'データを もとどおりに 読める');
ok(sheets['まとめ'].data[1][6] === "'=わるい しき" && sheets['きろく'].data[2][6] === "'+1+1", '式に ならないように する');
const small = JSON.stringify({ v: 1, marks: {}, items: [] });
ctx.saveWork({ name: 'たろう', textId: 's1', title: 'くもの ぼうし', data: small, done: true, summary: {}, records: [rec('a1'), rec('a3')], time: Date.now() });
ok(sheets['まとめ'].getLastRow() === 2 && ctx.getWork('たろう', 's1') === small, '同じ 文章は 上書きする（前の 長い データが のこらない）');
ok(sheets['きろく'].getLastRow() === 4, '同じ きろくは 二重に 書かない');
ctx.saveWork({ name: 'たろう', progress: JSON.stringify({ t: 50, stickers: [] }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).stickers.length === 1, '古い しんちょくでは 上書きしない');
ok(ctx.saveWork({ name: 'いない', textId: 's1', data: small }).ok === false, '名簿に ない 名前は うけとらない');
const st = ctx.getStudent('たろう');
ok(st.works.s1.done === true && JSON.parse(st.progress).t === 100, 'getStudent：しんちょくと できた しるし');
ctx.saveWork({ name: 'はなこ', textId: 's1', title: 'くもの ぼうし', data: small, done: false, summary: { own: 'はなこの ことば' }, time: Date.now() });

// 3. 先生用
ok(ctx.getTeacherData('0000').ok === false && ctx.getWorks('0000', 's1').ok === false, '暗証番号が ちがうと 見られない');
const td = ctx.getTeacherData('1234');
ok(td.ok && td.isDefaultPin && td.students.length === 2 && td.texts.length === 2 && td.works.length === 2, '先生用の データ');
ok(td.works.find(w => w.name === 'はなこ').own === 'はなこの ことば' && td.works.find(w => w.name === 'たろう').done, 'まとめの 中身');
ok(ctx.getWorks('1234', 's1').works.length === 2 && ctx.getWorks('1234', 's1', 'はなこ').works[0].data === small, 'みんなの／ひとりの マイこくばん');

// 4. 文章
r = ctx.saveText('1234', { title: 'あたらしい はなし', kind: 'ものがたり', body: '=1+1\nつぎの ぎょう', qs: ['とい あ', '', 'とい い'], use: true });
ok(r.ok && r.texts.length === 3 && r.texts[2].qs.length === 2 && sheets['ぶんしょう'].data[3][4].startsWith("'="), '文章を 足す');
const nid = r.id;
r = ctx.saveText('1234', { id: nid, title: 'なおした はなし', kind: 'せつめいぶん', body: 'ほんぶん', qs: [], use: false });
ok(r.texts.length === 3 && r.texts[2].title === 'なおした はなし' && r.texts[2].use === false, '文章を 直す（行は ふえない）');
ok(ctx.getInitData().texts.length === 2, '「つかわない」文章は 子どもに 出ない');
ok(ctx.saveText('1234', { title: '', body: '' }).ok === false && ctx.saveText('9', { title: 'a', body: 'b' }).ok === false, '空の 文章・暗証番号ちがいは 入れない');
sheets['ぶんしょう'].appendRow(['', 'てで たした', '', '', 'シートに じかに 書いた ぶん']);
const hand = ctx.getInitData().texts.find(t => t.title === 'てで たした');
ok(hand && hand.id && hand.kind === 'ものがたり', 'シートに じかに 足した 行にも ID が 付く');
r = ctx.deleteText('1234', nid);
ok(r.ok && r.texts.length === 3 && !r.texts.find(t => t.id === nid), '文章を 消す');

// 5. 設定・バックアップ・消去
r = ctx.saveSettings('1234', { rate: 1, font: 1.2, vertical: false, sound: false, newPin: '0420' });
ok(r.settings.rate === 1 && r.settings.font === 1.2 && r.settings.vertical === false && r.settings.sound === false, '設定を 変える');
ok(ctx.getTeacherData('1234').ok === false && ctx.getTeacherData('0420').ok === true, '暗証番号を 変える');
ok(ctx.getLogRows('0420').rows.length === 4, 'きろくの 書き出し');
const bk = ctx.getBackup('0420').data;
ok(bk.app === 'kokuban' && bk.works.length === 2 && bk.roster.length === 2 && bk.texts.length === 3, 'バックアップ');
ctx.clearRecords('0420', 'たろう');
ok(sheets['まとめ'].getLastRow() === 2 && sheets['まとめ'].data[1][0] === 'はなこ' && sheets['きろく'].getLastRow() === 1 && sheets['名簿'].data[1][1] === '', 'ひとりの 記録を 消す');
ctx.clearRecords('0420', '');
ok(sheets['まとめ'].getLastRow() === 1 && sheets['ぶんしょう'].getLastRow() === 5, '全員の 記録を 消す（文章は のこる）');
ctx.restoreBackup('0420', bk);
ok(sheets['まとめ'].getLastRow() === 3 && ctx.getWork('たろう', 's1') === small && JSON.parse(sheets['名簿'].data[1][1]).t === 100, 'バックアップから もどす');
ok(ctx.restoreBackup('0420', { app: 'ほか' }).ok === false, 'ほかの アプリの バックアップは 入れない');

console.log(bad ? `\n✖ ${bad}こ しっぱい` : '\n✔ ぜんぶ OK');
process.exit(bad ? 1 : 0);
