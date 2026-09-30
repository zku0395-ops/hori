/**
 * おんどくはかせの ちょうせんじょう ― Google Apps Script（スプレッドシートに付けて使う）
 *
 * このスクリプトには 2つの役目があります。
 *   1. 子どもが開く「入口ページ」
 *      「はじめる」ボタンで GitHub Pages のアプリ本体を開きます。
 *      そのとき、記録の送り先（このウェブアプリのURL）と合言葉を アプリに渡します。
 *   2. 記録の「受け取り口」
 *      アプリから送られてきた点数を、このスプレッドシートの「きろく」シートに書き込み、
 *      「いちらん」シートを作り直します。録音は受け取りません。
 *
 * 準備のしかたは README.md の「Google Apps Script とスプレッドシートの準備」を見てください。
 */

// アプリ本体（GitHub Pages）のURL
const APP_URL = 'https://zku0395-ops.github.io/hori/';
// 記録の送り先がうまく渡らないときだけ、デプロイしたウェブアプリのURL（…/exec）をここに貼ります
const RECORD_URL = '';

const PASS_SCORE = 80;
const SHEET_SUMMARY = 'いちらん';
const SHEET_LOG = 'きろく';
const SHEET_DATA = '_data';
const LOG_HEADER = ['日時', 'なまえ', 'ステージ', '課題番号', '課題', '合計', '声の大きさ', '読みの正確さ', '強弱', '速さ', '合格', '読んだ時間(秒)', '聞き取った言葉', '採点のきびしさ', '課題ID', '記録ID'];
const MAX_RECORDS_PER_POST = 300;

/* ---------- 入口ページ ---------- */
function doGet() {
  setup_();
  const template = HtmlService.createTemplateFromFile('start');
  const rec = webAppUrl_();
  template.startUrl = APP_URL + (rec ? '#rec=' + encodeURIComponent(rec) + '&key=' + encodeURIComponent(getKey_()) : '');
  return template.evaluate()
    .setTitle('おんどくはかせの ちょうせんじょう')
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
  if (!body || body.app !== 'ondoku-hakase' || String(body.key || '') !== getKey_()) {
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
    .createMenu('音読はかせ')
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
  let cols = [];
  try { cols = JSON.parse(PropertiesService.getScriptProperties().getProperty('COLUMNS') || '[]'); } catch (e) { cols = []; }

  const people = rows
    .map(function (r) { let s = {}; try { s = JSON.parse(r[1]); } catch (e) { s = {}; } return { name: String(r[0]), s: s }; })
    .filter(function (p) { return p.name; })
    .sort(function (a, b) { return a.name.localeCompare(b.name, 'ja'); });

  const fixed = ['なまえ', 'しょうごう', 'ごうかく', 'ちょうせん回数', 'さいごの学習', 'いまの課題'];
  const header = fixed.concat(cols.map(function (c) { return c.short; }));
  const values = [header];
  const bgs = [header.map(function () { return '#fde68a'; })];
  people.forEach(function (p) {
    const s = p.s || {};
    const best = s.best || {};
    const row = [str_(p.name, 40), s.title || '', (s.passed || 0) + ' / ' + (s.graded || 0), s.tries || 0, s.lastAt ? new Date(s.lastAt) : '', s.current || ''];
    const bg = row.map(function () { return '#ffffff'; });
    cols.forEach(function (c) {
      const v = best[c.id];
      const has = v !== undefined && v !== null && v !== '';
      row.push(has ? v : '');
      bg.push(!has ? '#ffffff' : v >= PASS_SCORE ? '#bbf7d0' : '#fef9c3');
    });
    values.push(row);
    bgs.push(bg);
  });

  const sh = sheet_(SHEET_SUMMARY);
  sh.clear();
  sh.clearNotes();
  if (people.length) {
    sh.getRange(2, 3, people.length, 1).setNumberFormat('@');
    sh.getRange(2, 5, people.length, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  }
  sh.getRange(1, 1, values.length, header.length).setValues(values).setBackgrounds(bgs);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold');
  if (cols.length) sh.getRange(1, fixed.length + 1, 1, cols.length).setNotes([cols.map(function (c) { return c.label; })]);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);
  sh.setColumnWidth(1, 110);
  sh.setColumnWidth(2, 170);
  sh.setColumnWidth(5, 130);
  sh.setColumnWidth(6, 170);
  if (cols.length) sh.setColumnWidths(fixed.length + 1, cols.length, 52);
  const noteRow = values.length + 2;
  sh.getRange(noteRow, 1, 1, 1).setValues([[
    people.length
      ? '数字＝その課題の最高点。緑＝合格（' + PASS_SCORE + '点以上）、黄＝挑戦中。見出しの課題番号にマウスを重ねると課題の文が出ます。'
      : 'まだ記録がありません。子どもがアプリで挑戦すると、ここに表示されます。',
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
      new Date(Number(r.at) || Date.now()), name, str_(r.stage, 40), num_(r.no), str_(r.label, 80),
      num_(r.total), num_(r.vol), num_(r.acc), num_(r.dyn), num_(r.spd),
      Number(r.total) >= PASS_SCORE ? '合格' : '', num_(r.readSec), str_(r.heard, 200), str_(r.strict, 10),
      str_(r.taskId, 20), uid,
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
    title: str_(s.title, 40), passed: num_(s.passed), graded: num_(s.graded), tries: num_(s.tries),
    lastAt: num_(s.lastAt), current: str_(s.current, 40), best: {},
  };
  Object.keys(s.best || {}).slice(0, 200).forEach(function (k) {
    if (/^[a-z0-9-]{1,20}$/.test(k)) clean.best[k] = num_(s.best[k]);
  });
  const name = String(body.name).slice(0, 40);
  const sh = sheet_(SHEET_DATA);
  const last = sh.getLastRow();
  const names = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  const idx = names.indexOf(name);
  const row = [str_(name, 40), JSON.stringify(clean), new Date()];
  sh.getRange(idx >= 0 ? idx + 2 : last + 1, 1, 1, 3).setValues([row]);

  if (Array.isArray(body.columns) && body.columns.length) {
    const cols = body.columns.slice(0, 200)
      .map(function (c) { return { id: String(c.id || ''), short: str_(c.short, 10), label: str_(c.label, 60) }; })
      .filter(function (c) { return /^[a-z0-9-]{1,20}$/.test(c.id); });
    PropertiesService.getScriptProperties().setProperty('COLUMNS', JSON.stringify(cols));
  }
}

function setup_() {
  const ss = ss_();
  if (!ss.getSheetByName(SHEET_SUMMARY)) ss.insertSheet(SHEET_SUMMARY, 0);
  let log = ss.getSheetByName(SHEET_LOG);
  if (!log) {
    log = ss.insertSheet(SHEET_LOG, 1);
    log.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]).setFontWeight('bold').setBackground('#fde68a');
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
