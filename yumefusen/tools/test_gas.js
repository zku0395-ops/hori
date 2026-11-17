// コード.gs の テスト（Apps Script の まねを する しくみで うごかす）：node yumefusen/tools/test_gas.js
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
ok(sheets['きろく'].data[0].join(',') === '日時,なまえ,ステージ,おだい,もの,つくった ぶん,けっか,まちがい,ヒント,まちがいの しゅるい,えらんだ カード,かいた ことば,みかた,びょう,ID', 'きろくの 見出し');
sheets['名簿'].getRange(2, 1, 2, 1).setValues([['たろう'], ['=はなこ']]);
const init = ctx.getInitData();
const s0 = init.settings;
ok(init.students.length === 2 && s0.happyo === true && s0.color === true && s0.sound === true && s0.rate === 0.8 && s0.font === 1,
  'はじめの 設定（はっぴょう つかう・いろわけ あり・こうかおん・0.8倍）');

// 2. きろくを うけとる
const rec = (id, o = {}) => Object.assign({ id, stage: '1', topic: 'かいたい どうぶつ', item: 'いぬ', answer: 'かいたい どうぶつは、いぬです。そのりゆうは、いっしょに さんぽが できるからです。', result: '○', miss: 0, hint: 0, types: '', picks: 'いっしょに さんぽが できる', written: '', kinds: 'できること', secs: 6.2 }, o);
const prog = JSON.stringify({ t: 100, stars: 3, cards: { d01: { s1: 'a', s2: 'b' } } });
let r = ctx.saveResult({ name: 'たろう', progress: prog, records: [
  rec('a1'),
  rec('a2', { item: 'ねこ', result: '△', miss: 1, hint: 2, types: 'あわない カード', picks: 'うみで ジャンプが できる✖・ふわふわ', kinds: 'ようす' }),
  rec('a3', { stage: '2', topic: 'たべたい もの', item: 'オムライス', result: '△', miss: 1, types: 'だから→から', picks: 'たまごが ふわふわ・からです。（ちがう）', kinds: 'ようす' }),
  rec('a4', { stage: 'h1', item: 'うさぎ', answer: '=SUM(A1)', written: 'ぴょんぴょん はねる', kinds: '' }),
  rec('a5', { stage: '4', topic: 'いきたい ところ', item: 'うみ', answer: 'いきたい ところは、うみです。そのりゆうは、およげるからです。', written: 'x', kinds: '' }),
], time: Date.now() });
ok(r.ok, 'saveResult が うごく');
ok(sheets['きろく'].getLastRow() === 6, 'きろくが 5ぎょう ふえる');
ok(sheets['きろく'].data[4][5] === "'=SUM(A1)", '式に ならないように する');
ok(sheets['きろく'].data[4][2] === 'h1' && sheets['きろく'].data[4][11] === 'ぴょんぴょん はねる' && sheets['きろく'].data[2][10] === 'うみで ジャンプが できる✖・ふわふわ' && sheets['きろく'].data[1][12] === 'できること' && sheets['きろく'].data[1][3] === 'かいたい どうぶつ',
  'ステージ・おだい・かいた ことば・えらんだ カード・みかた');
ctx.saveResult({ name: 'たろう', progress: prog, records: [rec('a1'), rec('a2')], time: Date.now() });
ok(sheets['きろく'].getLastRow() === 6, '同じ きろくは 二重に 書かない');
ok(JSON.parse(sheets['名簿'].data[1][1]).stars === 3, 'しんちょくを 名簿に 書く');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 50, stars: 0 }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).stars === 3, '古い しんちょくでは 上書きしない');
ok(ctx.saveResult({ name: 'いない', progress: prog, records: [] }).ok === false, '名簿に ない 名前は うけとらない');

// 3. 先生用
ok(ctx.getTeacherData('0000').ok === false, '暗証番号が ちがうと 見られない');
const td = ctx.getTeacherData('1234');
const t = td.students.find(s => s.name === 'たろう');
ok(td.ok && t.count === 5 && t.ok === 3, '問題の数と まちがえずに できた 数');
ok(t.types['あわない カード'] === 1 && t.types['だから→から'] === 1 && td.classTypes['だから→から'] === 1, 'まちがいの しゅるい');
ok(t.wrong['ねこ：うみで ジャンプが できる'] === 1 && Object.keys(t.wrong).length === 1 && td.classWrong['ねこ：うみで ジャンプが できる'] === 1, 'あわない カード（おわりの まちがいは 入れない）');
ok(t.kinds['できること'] === 1 && t.kinds['ようす'] === 2 && td.classKinds['ようす'] === 2, 'よく えらぶ みかた');
ok(t.grid['かいたい どうぶつ']['1'][0] === 2 && t.grid['かいたい どうぶつ']['1'][1] === 1 && td.classGrid['たべたい もの']['2'][0] === 1, 'お題 × ステージ の つまずき');
ok(t.texts.length === 2 && t.texts[0][1] === '4' && t.texts[1][1] === 'h1' && t.texts[1][2] === 'うさぎ' && t.texts[0][6] === 'いきたい ところ', '書いた文（③④・はってん）');
ok(t.stages['1'][0] === 2 && t.stages['2'][0] === 1, 'ステージごとの 結果');
ok(sheets['まとめ'].data.length >= 2 && sheets['まとめ'].data[1][0] === 'たろう' && sheets['まとめ'].data.some(row => row[1] === 'はってん① なぜなら'), 'まとめ シートが できる');
ok(sheets['まとめ'].data.some(row => row[0] === 'たろう' && row[4] === 'うさぎ' && row[3] === 'かいたい どうぶつ'), 'まとめ シートに 書いた 文の 一覧');

// 4. 設定・フラグ・はなまる
ctx.saveSettings('1234', { happyo: false, color: false, sound: false, rate: 0.7, font: 1.15, newPin: '0123' });
const s2 = ctx.getInitData().settings;
ok(s2.happyo === false && s2.color === false && s2.sound === false && s2.rate === 0.7 && s2.font === 1.15, '設定を 保存して よみだす');
ok(sheets['せってい'].data.some(row => row[0] === 'はっぴょう（ステージで よむ）' && row[1] === 'つかわない'), 'オン・オフは ことばで 書く');
ok(ctx.getTeacherData('0123').ok, '暗証番号を かえる（先頭の 0 も のこる）');
ctx.setFlag('0123', 'たろう', 'unlockAll', true);
ctx.setFlag('0123', 'たろう', 'hatten', true);
ctx.setFlag('0123', 'たろう', 'pc', true);
ok(ctx.setFlag('0123', 'たろう', 'stars', true).ok === false, 'しらない フラグは うけつけない');
ok(ctx.setHanamaru('0000', 'たろう', 'd01', 'b').ok === false, '暗証番号が ちがうと はなまるは つけられない');
ok(ctx.setHanamaru('0123', 'たろう', '=x', 'b').ok === false, 'へんな もの の id は うけつけない');
ctx.setHanamaru('0123', 'たろう', 'd01', 'b');
const p2 = JSON.parse(sheets['名簿'].data[1][1]);
ok(p2.unlockAll === true && p2.hatten === true && p2.pc === true && p2.hana.d01 === 'b', '全部開く・はってん・キーボード・はなまる');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: p2.t + 1, stars: 4, unlockAll: true, hatten: true, pc: true, flagT: p2.flagT, hana: {} }), records: [] });
const p3 = JSON.parse(sheets['名簿'].data[1][1]);
ok(p3.hana.d01 === 'b' && p3.stars === 4, 'はなまるは 子どもの 端末から 消えない（ほしは ふえる）');
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: p2.flagT - 10, stars: 4, unlockAll: false, hatten: false, pc: false }), records: [] });
ok(JSON.parse(sheets['名簿'].data[1][1]).unlockAll === true, '先生が 変えた フラグは 古い 端末で もどらない');
ctx.setHanamaru('0123', 'たろう', 'd01', '');
ok(!JSON.parse(sheets['名簿'].data[1][1]).hana.d01, 'はなまるを はずす');

// 5. バックアップ・消す
const bk = ctx.getBackup('0123');
ok(bk.ok && bk.data.app === 'yumefusen' && bk.data.roster.length === 2, 'バックアップ');
ok(ctx.restoreBackup('0123', { app: 'sukiwake', roster: [] }).ok === false, 'ほかの アプリの バックアップは うけつけない');
ctx.clearRecords('0123', 'たろう');
ok(sheets['きろく'].getLastRow() === 1 && sheets['名簿'].data[1][1] === '', 'この子の 記録を 消す');
ok(ctx.restoreBackup('0123', bk.data).ok && JSON.parse(sheets['名簿'].data[1][1]).stars === 4, 'バックアップから もどす');

console.log(bad ? `✖ ${bad}けん うまく いきません` : '✔ ぜんぶ うまく いきました');
process.exit(bad ? 1 : 0);
