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
const menu = []; let uiAnswer = 'cancel'; // メニューに 足した 関数の 名前と、「入れ直しますか？」への 答え
const ss = {
  getSheetByName: (n) => sheets[n] || null,
  insertSheet: (n) => (sheets[n] = makeSheet(n)),
  toast: () => {},
};
const ctx = {
  SpreadsheetApp: { getActiveSpreadsheet: () => ss, getUi: () => ({ createMenu: () => ({ addItem(label, fn) { menu.push(fn); return this; }, addToUi() {} }), alert: () => uiAnswer, ButtonSet: { OK_CANCEL: 1 }, Button: { OK: 'ok', CANCEL: 'cancel' } }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Session: { getScriptTimeZone: () => 'Asia/Tokyo' },
  Utilities: { formatDate: (d) => d.toISOString().slice(0, 10).replace(/-/g, '/') + ' 10:00' },
  HtmlService: { createHtmlOutputFromFile: () => ({ setTitle() { return this; }, addMetaTag() { return this; }, setXFrameOptionsMode() { return this; } }), XFrameOptionsMode: {} },
  console, Date, JSON, Math, Object, String, Number, Array,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'コード.gs'), 'utf8'), ctx);
vm.runInContext('function SAMPLE_TEXTS_FOR_TEST() { return SAMPLE_TEXTS; } function OLD_S1_ANS_FOR_TEST() { return OLD_S1_ANS; } function OLD_S1_ANS_2_FOR_TEST() { return OLD_S1_ANS_2; } function OLD_S1_3_FOR_TEST() { return [OLD_S1_BODY, OLD_S1_ANS_3]; }', ctx); // const は 外から 見えないので、テスト用に 取り出す

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
r = ctx.saveText('1234', { title: 'あたらしい はなし', kind: 'ものがたり', body: '=1+1\nつぎの ぎょう', qs: ['とい あ', '', 'とい い'], use: true, ans: '{"q":[{"u":[1]}]}' });
ok(r.ok && r.texts.length === 3 && r.texts[2].qs.length === 2 && sheets['ぶんしょう'].data[3][4].startsWith("'="), '文章を 足す');
ok(r.texts[2].ans === '{"q":[{"u":[1]}]}' && ctx.getInitData().texts[2].ans === r.texts[2].ans && sheets['ぶんしょう'].data[0][10].startsWith('こたえ'), 'こたえを 文章と いっしょに ほぞんする');
sheets['ぶんしょう'].data[0][10] = ''; ctx.getInitData();
ok(sheets['ぶんしょう'].data[0][10].startsWith('こたえ'), '前の 版の シートに「こたえ」の 列を 足す');
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

// ものがたりの 型：れんしゅう用の「くもの ぼうし」の こたえを 入れかえる
{
  const sh = sheets['ぶんしょう'], row = sh.data.findIndex(r => r[0] === 's1'), NEW = ctx.SAMPLE_TEXTS_FOR_TEST()[0][10], OLD = ctx.OLD_S1_ANS_FOR_TEST();
  const f = JSON.parse(NEW).flow;
  ok(f.on === true && f.who === 'ポル' && f.quiz.length === 4 && f.quiz.every(q => q.q && q.o.length === 3 && q.o.every(o => o && o.length <= 30)) && f.sp['7'] === 'ポル', 'くもの ぼうしに ものがたりの 型が 入って いる');
  ok(f.quiz[3].w === true && f.quiz[3].q.includes('なぜかな') && f.quiz.slice(0, 3).every(q => !q.w), '4問めは 理由の 問題で、「じぶんで かく」が 出る');
  { const OLD2 = ctx.OLD_S1_ANS_2_FOR_TEST(), f2 = JSON.parse(OLD2).flow;
    ok(f2.on === true && f2.quiz.length === 3 && JSON.stringify(f2.quiz) === JSON.stringify(f.quiz.slice(0, 3)), '1つ 前の こたえ（3問）と、はじめの 3問は 同じ');
    sh.data[row][10] = OLD2; ctx.doGet();
    ok(sh.data[row][10] === NEW, '1つ 前の 版の ままの「くもの ぼうし」も、新しい こたえ（4問）に 入れかわる'); }
  { const P = JSON.parse(ctx.OLD_S1_3_FOR_TEST()[1]); // 本文を 変える 前の こたえ（4問）
    ok(!JSON.parse(OLD).flow && JSON.parse(OLD).n === P.n && JSON.stringify(JSON.parse(OLD).cats) === JSON.stringify(P.cats) && JSON.stringify(P.flow) === JSON.stringify(JSON.parse(NEW).flow), '前の 本文の こたえは 印が 同じ（型だけ 足した）。新しい 本文でも 型は 同じ'); }
  sh.data[row][10] = OLD; ctx.doGet();
  ok(sh.data[row][10] === NEW, '前の 版の ままの「くもの ぼうし」は、新しい こたえに 入れかわる');
  sh.data[row][10] = OLD.replace('"paraShow":true', '"paraShow":false'); const keep = sh.data[row][10]; ctx.doGet();
  ok(sh.data[row][10] === keep, '先生が こたえを 直して いたら、入れかえない');
  sh.data[row][10] = OLD; const body = sh.data[row][4]; sh.data[row][4] = body + 'あ'; ctx.doGet();
  ok(sh.data[row][10] === OLD, '先生が 本文を 直して いたら、入れかえない');
  sh.data[row][4] = body; sh.data[row][10] = NEW;
}

// 本文を「ありがとう。さがして いたんだ。」に 変えた 版
{
  const sh = sheets['ぶんしょう'], row = sh.data.findIndex(r => r[0] === 's1'), S = ctx.SAMPLE_TEXTS_FOR_TEST()[0], [OB, OA3] = ctx.OLD_S1_3_FOR_TEST();
  const A = JSON.parse(S[10]);
  ok(S[4].includes('「ありがとう。さがして いたんだ。」') && !OB.includes('さがして') && A.n === 42 && A.cats.hatsugen.join() === '7,8,12,13,14,33,34,35' && A.flow.sp['33'] === 'くも、雲' && A.fm['yosu:39'] && A.fm['kimochi:37'], '新しい 本文と、ずらした 印');
  for (const [name, body, ans] of [['はじめの 版', OB, ctx.OLD_S1_ANS_FOR_TEST()], ['3問の 版', OB, ctx.OLD_S1_ANS_2_FOR_TEST()], ['4問の 版', OB, OA3]]) {
    sh.data[row][4] = body; sh.data[row][10] = ans; ctx.doGet();
    ok(JSON.stringify(sh.data[row]) === JSON.stringify(S), name + 'の ままなら、本文も こたえも 新しく なる');
  }
  sh.data[row][4] = OB + 'あ'; sh.data[row][10] = OA3; ctx.doGet();
  ok(sh.data[row][10] === OA3 && sh.data[row][4] === OB + 'あ', '先生が 前の 本文を 直して いたら、入れかえない');
  sh.data[row] = S.slice();
}

// メニュー：先生が 直した「くもの ぼうし」を 入れ直す
{
  const sh = sheets['ぶんしょう'], S = ctx.SAMPLE_TEXTS_FOR_TEST()[0], find = () => sh.data.findIndex(r => r[0] === 's1');
  ctx.onOpen();
  ok(menu.includes('setup') && menu.includes('resetSample') && typeof ctx.resetSample === 'function', 'メニューに「入れ直す」が ある');
  const row = find(), other = JSON.stringify(sh.data.filter(r => r[0] !== 's1')), sum = JSON.stringify(sheets['まとめ'].data), log = JSON.stringify(sheets['きろく'].data);
  sh.data[row][1] = '先生が 直した だいめい'; sh.data[row][4] = '先生が 直した 本文。'; sh.data[row][5] = '先生の とい'; sh.data[row][10] = '{"q":[]}';
  uiAnswer = 'cancel'; ctx.resetSample();
  ok(sh.data[row][4] === '先生が 直した 本文。', '「キャンセル」なら 何も 変えない');
  uiAnswer = 'ok'; ctx.resetSample();
  ok(JSON.stringify(sh.data[row]) === JSON.stringify(S), '「OK」で、くもの ぼうしが 新しい れいに 入れかわる');
  ok(JSON.stringify(sh.data.filter(r => r[0] !== 's1')) === other && JSON.stringify(sheets['まとめ'].data) === sum && JSON.stringify(sheets['きろく'].data) === log, 'ほかの 文章・まとめ・きろくは 変わらない');
  ok(JSON.parse(ctx.getInitData().texts.find(t => t.id === 's1').ans).flow.on === true, 'アプリに 型つきの 文章が とどく');
  sh.data[row] = sh.data[row].map(() => ''); const n = sh.getLastRow(); ctx.resetSample();
  ok(find() >= 0 && sh.data.filter(r => r[0] === 's1').length === 1 && JSON.stringify(sh.data[find()]) === JSON.stringify(S), '「くもの ぼうし」が ない ときは、足す');
}

console.log(bad ? `\n✖ ${bad}こ しっぱい` : '\n✔ ぜんぶ OK');
process.exit(bad ? 1 : 0);
