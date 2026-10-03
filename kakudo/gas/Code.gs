/**
 * ワニワニ先生の ピザやさん（角の学習）― Google Apps Script（スプレッドシートに付けて使う）
 *
 * このスクリプトには 2つの役目があります。
 *   1. 子どもが開く「入口ページ」
 *      「はじめる」ボタンで GitHub Pages のアプリ本体を開きます。
 *      そのとき、記録の送り先（このウェブアプリのURL）と合言葉を アプリに渡します。
 *   2. 記録の「受け取り口」
 *      アプリから送られてきた 1問ごとの結果を、このスプレッドシートの「きろく」シートに書き込み、
 *      「いちらん」シートを作り直します。
 *
 * 音読アプリとは別のスプレッドシートに付けてください。
 * 準備のしかたは kakudo/README.md の「Google Apps Script とスプレッドシートの準備」を見てください。
 */

// アプリ本体（GitHub Pages）のURL
const APP_URL = 'https://zku0395-ops.github.io/hori/kakudo/';
// 記録の送り先がうまく渡らないときだけ、デプロイしたウェブアプリのURL（…/exec）をここに貼ります
const RECORD_URL = '';

const APP_ID = 'wani-kakudo';
const SHEET_SUMMARY = 'いちらん';
const SHEET_LOG = 'きろく';
const SHEET_DATA = '_data';
const LOG_HEADER = ['日時', 'なまえ', 'ステージ', '問題番号', '問題', '正しい答え', '答えた内容', '結果', 'まちがえた回数', 'ヒントの回数', 'かかった時間(秒)', 'つまずき', '目盛り', '答え方', '記録ID'];
const MAX_RECORDS_PER_POST = 300;
const ID_RE = /^[a-z0-9-]{1,20}$/;
const ERR_RE = /^[a-z]{1,12}$/;

/* ---------- 入口ページ ---------- */
function doGet() {
  setup_();
  const template = HtmlService.createTemplateFromFile('start');
  const rec = webAppUrl_();
  template.startUrl = APP_URL + (rec ? '#rec=' + encodeURIComponent(rec) + '&key=' + encodeURIComponent(getKey_()) : '');
  return template.evaluate()
    .setTitle('ワニワニ先生の ピザやさん')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ---------- 記録の受け取り口 ---------- */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad-json' });
  }
  if (!body || body.app !== APP_ID || String(body.key || '') !== getKey_()) {
    return json_({ ok: false, error: 'key' });
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    setup_();
    const added = appendRecords_(body);
    if (body.name && body.summary) saveSummary_(body);
    updateSummary();
    return json_({ ok: true, added: added });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- スプレッドシートのメニュー ---------- */
function onOpen() {
  try { setup_(); } catch (e) { /* 準備は デプロイ後の 初回の 送信でも 行う */ }
  SpreadsheetApp.getUi()
    .createMenu('ワニワニ先生')
    .addItem('一覧を更新', 'updateSummary')
    .addItem('子どもに配るURLと合言葉を表示', 'showUrl')
    .addToUi();
}

function showUrl() {
  setup_();
  const url = webAppUrl_();
  const ui = SpreadsheetApp.getUi();
  if (!url) {
    ui.alert('まだウェブアプリとしてデプロイされていません。\n「デプロイ」→「新しいデプロイ」から、種類「ウェブアプリ」、アクセスできるユーザー「全員」でデプロイしてください。');
    return;
  }
  ui.alert(
    '子どもに配るURL（入口ページ）：\n' + url +
    '\n\n合言葉：' + getKey_() +
    '\n\n入口ページから開けば、記録の送り先と合言葉はアプリに自動で設定されます。' +
    '\n入口ページを通さずに開いた端末では、アプリの先生用画面「データ」タブで、上のURLと合言葉を入力してください。'
  );
}

/* ---------- いちらん シートを作り直す ---------- */
function updateSummary() {
  setup_();
  const data = sheet_(SHEET_DATA);
  const last = data.getLastRow();
  const rows = last > 1 ? data.getRange(2, 1, last - 1, 2).getValues() : [];
  const props = PropertiesService.getScriptProperties();
  let cols = [];
  let errNames = {};
  try { cols = JSON.parse(props.getProperty('COLUMNS') || '[]'); } catch (e) { cols = []; }
  try { errNames = JSON.parse(props.getProperty('ERRNAMES') || '{}'); } catch (e) { errNames = {}; }
  const errKeys = Object.keys(errNames);

  const people = rows
    .map(function (r) { let s = {}; try { s = JSON.parse(r[1]); } catch (e) { s = {}; } return { name: String(r[0]), s: s }; })
    .filter(function (p) { return p.name; })
    .sort(function (a, b) { return a.name.localeCompare(b.name, 'ja'); });

  const fixed = ['なまえ', 'しょうごう', 'クリア', 'といた問題', '1回で正解', 'ピザ', 'さいごの学習', 'いまのステージ'];
  const header = fixed
    .concat(cols.map(function (c) { return c.short; }))
    .concat(errKeys.map(function (k) { return errNames[k]; }));
  const values = [header];
  const bgs = [header.map(function (h, i) { return i >= fixed.length + cols.length ? '#fed7aa' : '#bbf7d0'; })];
  people.forEach(function (p) {
    const s = p.s || {};
    const stages = s.stages || {};
    const errors = s.errors || {};
    const solved = s.solved || 0;
    const row = [
      str_(p.name, 40), s.title || '', (s.cleared || 0) + ' / ' + (s.mains || 8), solved,
      solved ? Math.round((s.first || 0) / solved * 100) + '%' : '', s.pizzas || 0,
      s.lastAt ? new Date(s.lastAt) : '', s.current || '',
    ];
    const bg = row.map(function () { return '#ffffff'; });
    cols.forEach(function (c) {
      const x = stages[c.id] || {};
      let v = '';
      let color = '#ffffff';
      if (x.clear) { v = x.plays > 1 ? '◎' + x.plays : '◎'; color = '#bbf7d0'; }
      else if (x.solved) { v = x.solved + '問'; color = '#fef9c3'; }
      row.push(v); bg.push(color);
    });
    errKeys.forEach(function (k) {
      const n = errors[k] || 0;
      row.push(n || '');
      bg.push(n >= 5 ? '#fdba74' : n >= 2 ? '#ffedd5' : '#ffffff');
    });
    values.push(row);
    bgs.push(bg);
  });

  const sh = sheet_(SHEET_SUMMARY);
  sh.clear();
  sh.clearNotes();
  if (people.length) {
    sh.getRange(2, 3, people.length, 1).setNumberFormat('@');
    sh.getRange(2, 7, people.length, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  }
  sh.getRange(1, 1, values.length, header.length).setValues(values).setBackgrounds(bgs);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold');
  if (cols.length) sh.getRange(1, fixed.length + 1, 1, cols.length).setNotes([cols.map(function (c) { return c.label; })]);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);
  sh.setColumnWidth(1, 110);
  sh.setColumnWidth(2, 170);
  sh.setColumnWidth(7, 130);
  sh.setColumnWidth(8, 170);
  if (cols.length) sh.setColumnWidths(fixed.length + 1, cols.length, 48);
  if (errKeys.length) sh.setColumnWidths(fixed.length + cols.length + 1, errKeys.length, 110);
  const noteRow = values.length + 2;
  sh.getRange(noteRow, 1, 1, 1).setValues([[
    people.length
      ? 'ステージの列：◎＝クリア（数字はクリアした回数）、「○問」＝挑戦中でといた問題の数。見出しの番号にマウスを重ねるとステージ名が出ます。オレンジの列は、つまずきの種類ごとのまちがえた回数です。'
      : 'まだ記録がありません。子どもがアプリで問題をとくと、ここに表示されます。',
  ]]);
}

/* ---------- 内部で使う関数 ---------- */
function appendRecords_(body) {
  const recs = (Array.isArray(body.records) ? body.records : []).slice(0, MAX_RECORDS_PER_POST);
  if (!recs.length) return 0;
  const sh = sheet_(SHEET_LOG);
  const last = sh.getLastRow();
  const idCol = LOG_HEADER.length;
  const known = {};
  if (last > 1) sh.getRange(2, idCol, last - 1, 1).getValues().forEach(function (r) { known[String(r[0])] = true; });
  const name = str_(body.name, 40);
  const rows = [];
  recs.forEach(function (r) {
    const uid = str_(r.uid, 80);
    if (!uid || known[uid]) return; // 同じ記録は 2回 書かない
    known[uid] = true;
    rows.push([
      new Date(Number(r.at) || Date.now()), name, str_(r.stage, 60), num_(r.no), str_(r.label, 80),
      str_(r.correct, 60), str_(r.answers, 200), str_(r.result, 30), num_(r.mistakes), num_(r.hints),
      num_(r.sec), str_(r.errors, 200), str_(r.step, 10), str_(r.mode, 10), uid,
    ]);
  });
  if (!rows.length) return 0;
  sh.getRange(last + 1, 1, rows.length, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  sh.getRange(last + 1, 1, rows.length, LOG_HEADER.length).setValues(rows);
  return rows.length;
}

function saveSummary_(body) {
  const s = body.summary || {};
  const clean = {
    title: str_(s.title, 40), cleared: num_(s.cleared), mains: num_(s.mains), solved: num_(s.solved), first: num_(s.first),
    pizzas: num_(s.pizzas), lastAt: num_(s.lastAt), current: str_(s.current, 40), stages: {}, errors: {},
  };
  Object.keys(s.stages || {}).slice(0, 50).forEach(function (k) {
    if (!ID_RE.test(k)) return;
    const x = s.stages[k] || {};
    clean.stages[k] = { clear: x.clear ? 1 : 0, plays: num_(x.plays), solved: num_(x.solved), first: num_(x.first) };
  });
  Object.keys(s.errors || {}).slice(0, 30).forEach(function (k) {
    if (ERR_RE.test(k)) clean.errors[k] = num_(s.errors[k]);
  });
  const name = String(body.name).slice(0, 40);
  const sh = sheet_(SHEET_DATA);
  const last = sh.getLastRow();
  const names = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  const idx = names.indexOf(name);
  const row = [str_(name, 40), JSON.stringify(clean), new Date()];
  sh.getRange(idx >= 0 ? idx + 2 : last + 1, 1, 1, 3).setValues([row]);

  const props = PropertiesService.getScriptProperties();
  if (Array.isArray(body.columns) && body.columns.length) {
    const cols = body.columns.slice(0, 50)
      .map(function (c) { return { id: String(c.id || ''), short: str_(c.short, 10), label: str_(c.label, 60) }; })
      .filter(function (c) { return ID_RE.test(c.id); });
    props.setProperty('COLUMNS', JSON.stringify(cols));
  }
  if (body.errorNames && typeof body.errorNames === 'object') {
    const names2 = {};
    Object.keys(body.errorNames).slice(0, 30).forEach(function (k) {
      if (ERR_RE.test(k)) names2[k] = str_(body.errorNames[k], 30);
    });
    props.setProperty('ERRNAMES', JSON.stringify(names2));
  }
}

function setup_() {
  const ss = ss_();
  if (!ss.getSheetByName(SHEET_SUMMARY)) ss.insertSheet(SHEET_SUMMARY, 0);
  let log = ss.getSheetByName(SHEET_LOG);
  if (!log) {
    log = ss.insertSheet(SHEET_LOG, 1);
    log.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]).setFontWeight('bold').setBackground('#bbf7d0');
    log.setFrozenRows(1);
  }
  let data = ss.getSheetByName(SHEET_DATA);
  if (!data) {
    data = ss.insertSheet(SHEET_DATA);
    data.getRange(1, 1, 1, 3).setValues([['なまえ', 'まとめ', '更新日時']]);
    data.hideSheet();
  }
  // 最初からある 空の シートは 消す
  ['シート1', 'Sheet1'].forEach(function (n) {
    const sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() === 0 && sh.getLastColumn() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
  getKey_();
}

function ss_() {
  const props = PropertiesService.getScriptProperties();
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    if (props.getProperty('SSID') !== active.getId()) props.setProperty('SSID', active.getId());
    return active;
  }
  const id = props.getProperty('SSID');
  if (!id) throw new Error('スプレッドシートが見つかりません。スプレッドシートの「拡張機能 → Apps Script」から作ったスクリプトか確認してください。');
  return SpreadsheetApp.openById(id);
}

function sheet_(name) {
  return ss_().getSheetByName(name);
}

function getKey_() {
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
    props.setProperty('KEY', key);
  }
  return key;
}

function webAppUrl_() {
  let url = RECORD_URL;
  if (!url) {
    try { url = ScriptApp.getService().getUrl() || ''; } catch (e) { url = ''; }
  }
  return url.replace(/\/a\/macros\/[^/]+\/s\//, '/macros/s/');
}

// 文字列は 長さを 切り、= + - @ で 始まるものは 式として 動かないように する
function str_(v, max) {
  let s = v === undefined || v === null ? '' : String(v).slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function num_(v) {
  const n = Number(v);
  return isFinite(n) ? n : '';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
