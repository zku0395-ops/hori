// コード.gs の テスト（Apps Script の まねを する しくみで うごかす）：node monogatari/tools/test_gas.js
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
let fileSeq = 0;
const props = {}, folders = [], fetchLog = [], cacheStore = {};
let fetchReply = () => ({ getResponseCode: () => 500, getContentText: () => 'x' });
const ss = {
  getSheetByName: (n) => sheets[n] || null,
  insertSheet: (n) => (sheets[n] = makeSheet(n)),
  toast: () => {}, getName: () => 'きろく', getUrl: () => 'https://docs.google.com/y', getId: () => 'ACTIVE',
};
const ctx = {
  SpreadsheetApp: { getActiveSpreadsheet: () => ss, getUi: () => ({ createMenu: () => ({ addItem() { return this; }, addToUi() {} }) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Session: { getScriptTimeZone: () => 'Asia/Tokyo' },
  Utilities: {
    formatDate: (d, tz, f) => (f === 'yyyyMMdd' ? d.toISOString().slice(0, 10).replace(/-/g, '') : d.toISOString().slice(0, 10).replace(/-/g, '/') + ' 10:00'),
    DigestAlgorithm: { MD5: 'md5' }, Charset: { UTF_8: 'utf8' },
    computeDigest: (alg, str) => [...require('crypto').createHash('md5').update(str, 'utf8').digest()].map(b => (b > 127 ? b - 256 : b)),
    base64Decode: (t) => [...Buffer.from(t, 'base64')].map(b => (b > 127 ? b - 256 : b)),
    base64Encode: (bytes) => Buffer.from(bytes.map(b => b & 255)).toString('base64'),
    newBlob: (bytes, type, name) => ({ bytes, type, name, getBytes: () => bytes }),
  },
  CacheService: { getScriptCache: () => ({ get: (k) => (k in cacheStore ? cacheStore[k] : null), put: (k, v) => { cacheStore[k] = v; }, remove: (k) => { delete cacheStore[k]; } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); } }) },
  DriveApp: {
    getFileById: (id) => { for (const f of folders) for (const x of f.files) if (x.id === id) return { getBlob: () => x }; throw new Error('no file'); },
    getFoldersByName: (n) => { const l = folders.filter(f => f.name === n); return { hasNext: () => l.length > 0, next: () => l.shift() }; },
    createFolder: (n) => { const f = { name: n, files: [], getFilesByName: (fn) => { const l = f.files.filter(x => x.name === fn); return { hasNext: () => l.length > 0, next: () => ({ getBlob: () => l.shift() }) }; }, getFiles: () => { const l = [...f.files]; return { hasNext: () => l.length > 0, next: () => l.shift() }; }, createFile: (b) => { b.id = 'id' + (++fileSeq); b.getId = () => b.id; f.files.push(b); return b; } }; folders.push(f); return f; },
  },
  UrlFetchApp: { fetch: (url, o) => { fetchLog.push({ url, body: JSON.parse(o.payload), key: o.headers['x-goog-api-key'] }); return fetchReply(url); } },
  HtmlService: { createHtmlOutputFromFile: () => ({ setTitle() { return this; }, addMetaTag() { return this; }, setXFrameOptionsMode() { return this; } }), XFrameOptionsMode: {} },
  console: { log() {}, warn() {}, error() {} }, Date, JSON, Math, Object, String, Number, Array,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'コード.gs'), 'utf8'), ctx);

// スプレッドシートに ついて いない Apps Script（getActiveSpreadsheet が null）でも うごくか
{
  const ctx2 = { ...ctx, SS_CACHE_: undefined };
  const props2 = {};
  let created = 0;
  ctx2.PropertiesService = { getScriptProperties: () => ({ getProperty: (k) => (k in props2 ? props2[k] : null), setProperty: (k, v) => { props2[k] = String(v); } }) };
  const sheets2 = {};
  const ss2 = { getSheetByName: (n) => sheets2[n] || null, insertSheet: (n) => (sheets2[n] = makeSheet(n)), toast: () => { throw new Error('Cannot call SpreadsheetApp.showNotification() from this context.'); }, getId: () => 'NEWID', getName: () => 'ものがたりの もり 記録', getUrl: () => 'https://docs.google.com/x' };
  ctx2.SpreadsheetApp = { getActiveSpreadsheet: () => null, create: () => { created++; return ss2; }, openById: (id) => (id === 'NEWID' ? ss2 : null), getUi: ctx.SpreadsheetApp.getUi };
  ctx2.console = { log() {} };
  vm.createContext(ctx2);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'コード.gs'), 'utf8'), ctx2);
  ctx2.setup();
  globalThis.__standalone = { created, id: props2.SHEET_ID, ok: !!sheets2['名簿'] };
  // 2かいめ（あたらしい 実行）は おぼえた スプレッドシートを 使う
  vm.runInContext('SS_CACHE_ = null;', ctx2);
  ctx2.getInitData();
  globalThis.__standalone.created2 = created;
}
let bad = 0;
const ok = (c, msg) => { console.log((c ? '✔ ' : '✖ ') + msg); if (!c) bad++; };

ok(__standalone.ok && __standalone.created === 1 && __standalone.id === 'NEWID' && __standalone.created2 === 1, 'スプレッドシートに ついて いない Apps Script でも、記録の スプレッドシートを 作って つかう');
// 1. シートの じゅんび
ctx.setup();
ok(['名簿', 'きろく', 'まとめ', 'せってい'].every(n => sheets[n]), '4つの シートが できる');
ok(sheets['きろく'].data[0].join(',') === '日時,なまえ,おはなし,だいめい,しゅるい,もんだい,こたえ,けっか,まちがい,ヒント,えらんだ こたえ,びょう,ID', 'きろくの 見出し');
sheets['名簿'].getRange(2, 1, 2, 1).setValues([['たろう'], ['はなこ']]);
const init = ctx.getInitData();
const s0 = init.settings;
ok(init.students.length === 2 && s0.rate === 0.8 && s0.font === 1 && s0.quiz === true && s0.sound === true && s0.tts === true && s0.voice === 'Sulafat', 'はじめの 設定');

// 2. きろくを うけとる
const rec = (id, o = {}) => Object.assign({ id, story: 1, title: 'こぶたの ブーちゃんの おべんとう', cat: '②いつ', q: 'いつの おはなし かな？', a: 'にちようびの あさ', result: '○', miss: 0, hint: 0, picks: 'にちようびの あさ', secs: 4.2 }, o);
let r = ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: 10, kakera: 1 }), records: [rec('a1'), rec('a2', { cat: '③どこ', result: '△', miss: 2, hint: 2, picks: 'うみ→=SUM(1)→やま' })], time: Date.now() });
ok(r.ok, 'きろくを うけとる');
ok(sheets['きろく'].getLastRow() === 3, '2ぎょう 書く');
ctx.saveResult({ name: 'たろう', records: [rec('a1')] });
ok(sheets['きろく'].getLastRow() === 3, 'おなじ きろくは 二重に 書かない');
ok(String(sheets['きろく'].data[2][10]).includes('=SUM') && !String(sheets['きろく'].data[2][10]).startsWith('='), '式に ならない');
ctx.saveResult({ name: '=だれ', records: [rec('x')] });
ok(sheets['きろく'].getLastRow() === 3, '名簿に ない 名前は 書かない');
r = ctx.saveResult({ name: 'たろう', records: [rec('a3', { cat: 'おわり', q: '', a: '', result: '' })] });
ok(JSON.parse(ctx.getStudent('たろう')).kakera === 1, 'しんちょくを 名簿に 書く');

// 3. 先生用
ok(!ctx.getTeacherData('0000').ok, 'ちがう 暗証番号は だめ');
const t = ctx.getTeacherData('1234');
const taro = t.students.find(x => x.name === 'たろう');
ok(t.ok && taro.count === 2 && taro.done === 1 && taro.ok === 1, '先生用：もんだいの かず・よんだ かず');
ok(taro.cats['③どこ'][2] === 2 && taro.cats['③どこ'][3] === 2 && taro.sc['1|③どこ'][0] === 1, '先生用：しゅるいごと・おはなし×しゅるい');
ok(taro.misses.length === 1 && t.classCats['②いつ'][0] === 1, '先生用：まちがえた もんだい・クラス全体');
ok(sheets['まとめ'].data.length > 2, 'まとめシートを 作る');
ctx.setFlag('1234', 'たろう', 'unlockAll', true);
ok(JSON.parse(ctx.getStudent('たろう')).unlockAll === true, 'ぜんぶ ひらく');
ctx.setFlag('1234', 'たろう', 'hatten', true);
ok(JSON.parse(ctx.getStudent('たろう')).hatten === true && JSON.parse(ctx.getStudent('たろう')).unlockAll === true, 'はってんを ひらく');
ok(ctx.setFlag('1234', 'たろう', 'xxx', true).ok === false, 'しらない フラグは だめ');
// 古い 端末から 来ても 先生の フラグは のこる
ctx.saveResult({ name: 'たろう', progress: JSON.stringify({ t: Date.now() - 100000, kakera: 5, unlockAll: false }), records: [] });
const pt = JSON.parse(ctx.getStudent('たろう'));
ok(pt.kakera === 1 && pt.unlockAll === true, '古い 端末の しんちょくで 上書きしない（先生が 変えた フラグを のこす）');
ctx.saveSettings('1234', { rate: 0.7, quiz: false, voice: 'Leda', newPin: '2468' });
const s1 = ctx.getInitData().settings;
ok(s1.rate === 0.7 && s1.quiz === false && s1.voice === 'Leda', '設定を ほぞん');
ok(ctx.getTeacherData('2468').ok && !ctx.getTeacherData('1234').ok, '暗証番号を 変える');
const bk = ctx.getBackup('2468');
ok(bk.ok && bk.data.app === 'monogatari', 'バックアップ');
ok(ctx.restoreBackup('2468', { app: 'tsuri', roster: [] }).ok === false, 'ちがう アプリの バックアップは もどさない');
ctx.clearRecords('2468', 'たろう');
ok(sheets['きろく'].getLastRow() === 1 && ctx.getStudent('たろう') === '', '記録を 消す');

// 4. こえ
ok(ctx.getVoice('こんにちは', 'Sulafat').reason === 'nokey', 'APIキーが ない ときは ブラウザの こえ');
props.GEMINI_API_KEY = 'k';
fetchReply = () => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: Buffer.from([1, 2, 3, 4]).toString('base64') } }] } }] }) });
let v = ctx.getVoice('にちようびの あさ、', 'Sulafat');
ok(v.ok && !v.cached && fetchLog.length === 1 && fetchLog[0].key === 'k', 'Gemini で こえを つくる');
ok(fetchLog[0].body.contents[0].parts[0].text.includes('読み聞かせ'), 'よみきかせの いいかた');
v = ctx.getVoice('にちようびの あさ、', 'Sulafat');
ok(v.ok && v.cached && fetchLog.length === 1, '2かいめは ドライブの こえを つかう');
ok(ctx.getVoice('x'.repeat(201), 'Sulafat').reason === 'text', 'ながすぎる ぶんは つくらない');
ok(fetchLog[0].body.contents[0].parts[0].text.includes('文：にちようびの あさ、') && fetchLog[0].body.contents[0].parts[0].text.includes('つづき'), '「文：」の あとの 文だけを 読むように たのむ');
// こえが ながすぎる（ほかの 詩を 読んだ）ときは つかわない・ドライブに のこさない・もう1かい ためす
{
  const longPcm = Buffer.alloc(24000 * 2 * 30).toString('base64'); // 30びょう
  const n0 = fetchLog.length;
  const filesBefore = folders.reduce((a, f) => a + f.files.length, 0);
  fetchReply = () => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: longPcm } }] } }] }) });
  const vl = ctx.getVoice('ふたを あけると、', 'Sulafat');
  ok(!vl.ok && fetchLog.length - n0 >= 2 && folders.reduce((a, f) => a + f.files.length, 0) === filesBefore && /ながすぎ/.test(props.TTS_LAST_ERROR), 'ながすぎる こえは つかわない（もう1かい ためして、のこさない）');
  const shortPcm = Buffer.alloc(24000 * 2 * 3).toString('base64'); // 3びょう
  fetchReply = () => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: shortPcm } }] } }] }) });
  ok(ctx.getVoice('ふたを あけると、', 'Sulafat').ok, 'ふつうの ながさの こえは つかう');
}
fetchReply = () => ({ getResponseCode: () => 429, getContentText: () => 'quota' });
ok(ctx.getVoice('べつの ぶん', 'Sulafat').reason === 'pause', 'つかいすぎの ときは やすむ');
ok(ctx.getTtsStatus('2468').hasKey === true, 'こえの ようす');

console.log(bad ? `\n✖ ${bad}この テストが うまく いきません` : '\nOK：ぜんぶ うまく いきました');
process.exit(bad ? 1 : 0);
