/**
 * ツバサせんせいの にっぽん たんけんたい（都道府県の 調べ学習）― Google Apps Script（スプレッドシートに付けて使う）
 *
 * このスクリプトには 2つの役目があります。
 *   1. 子どもが開く「入口ページ」
 *      「はじめる」ボタンで GitHub Pages のアプリ本体を開きます。
 *      そのとき、記録の送り先（このウェブアプリのURL）と合言葉を アプリに渡します。
 *   2. 記録の「受け取り口」
 *      アプリから送られてきた「しんぶん」（1まい1行）とクイズの結果を、このスプレッドシートに書き込み、
 *      「いちらん」シート（1人1行）を作り直します。
 *
 * ほかのアプリとは別のスプレッドシートに付けてください。
 * 準備のしかたは tankentai/README.md の「2. Apps Script とスプレッドシート」を見てください。
 */

// アプリ本体（GitHub Pages）のURL
const APP_URL = 'https://zku0395-ops.github.io/hori/tankentai/';
// 記録の送り先がうまく渡らないときだけ、デプロイしたウェブアプリのURL（…/exec）をここに貼ります
const RECORD_URL = '';

const APP_ID = 'tsubasa-tankentai';
const SHEET_SUMMARY = 'いちらん';
const SHEET_PAPER = 'しんぶん';
const SHEET_LOG = 'きろく';
const SHEET_DATA = '_data';
// しんぶんの 5つの わく（どの 都道府県も この 順）
const ITEM_LABELS = ['県庁（都庁）の ある ところ', 'とくさんぶつ', 'おみやげ', 'かんこうめいしょ', 'てつどう'];
const NUMS = ['①', '②', '③', '④', '⑤'];
const PAPER_HEADER = ['更新日時', 'なまえ', '都道府県', 'できた項目']
  .concat(ITEM_LABELS.reduce(function (a, l, i) { return a.concat([NUMS[i] + ' ' + l + '：写真', NUMS[i] + ' 書いた文']); }, []))
  .concat(['ID']);
const LOG_HEADER = ['日時', 'なまえ', '都道府県', '項目', '問い', '正しい答え', '答えた内容', '結果', 'まちがえた回数', 'ヒントの段階', 'かかった時間(秒)', '記録ID'];
const MAX_RECORDS_PER_POST = 300;
const MAX_SHEETS_PER_POST = 60;
const PREF_RE = /^[a-z]{1,20}$/;

/* ---------- 入口ページ ---------- */
function doGet() {
  setup_();
  const template = HtmlService.createTemplateFromFile('start');
  const rec = webAppUrl_();
  template.startUrl = APP_URL + (rec ? '#rec=' + encodeURIComponent(rec) + '&key=' + encodeURIComponent(getKey_()) : '');
  return template.evaluate()
    .setTitle('ツバサせんせいの にっぽん たんけんたい')
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
  const name = str_(body.name, 40);
  if (!name) return json_({ ok: false, error: 'name' });
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    setup_();
    const added = appendRecords_(name, body.records);
    const papers = upsertPapers_(name, body.sheets);
    if (body.summary) saveSummary_(name, body.summary);
    updateSummary();
    return json_({ ok: true, added: added, papers: papers });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- スプレッドシートのメニュー ---------- */
function onOpen() {
  try { setup_(); } catch (e) { /* 準備は デプロイ後の 初回の 送信でも 行う */ }
  SpreadsheetApp.getUi()
    .createMenu('ツバサせんせい')
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
  const people = rows
    .map(function (r) { let s = {}; try { s = JSON.parse(r[1]); } catch (e) { s = {}; } return { name: String(r[0]), s: s }; })
    .filter(function (p) { return p.name; })
    .sort(function (a, b) { return a.name.localeCompare(b.name, 'ja'); });

  const header = ['なまえ', 'しょうごう', 'たずねた都道府県', 'シール', 'いま しらべている ところ', 'クイズ（1回で正解）', 'さいごの学習'];
  const values = [header];
  const bgs = [header.map(function () { return '#bfdbfe'; })];
  people.forEach(function (p) {
    const s = p.s || {};
    const n = s.quizN || 0;
    const r = n ? Math.round((s.quizFirst || 0) / n * 100) : null;
    values.push([
      str_(p.name, 40), s.title || '', (s.visited || 0) + ' けん', (s.stickers || 0) + ' / ' + (s.allStickers || 0),
      s.current || '', n ? r + '%（' + n + '問）' : '', s.lastAt ? new Date(s.lastAt) : '',
    ]);
    bgs.push(['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', r === null ? '#ffffff' : r < 50 ? '#fecaca' : r < 80 ? '#fef9c3' : '#dcfce7', '#ffffff']);
  });

  const sh = sheet_(SHEET_SUMMARY);
  sh.clear();
  if (people.length) {
    sh.getRange(2, 3, people.length, 4).setNumberFormat('@');
    sh.getRange(2, 7, people.length, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  }
  sh.getRange(1, 1, values.length, header.length).setValues(values).setBackgrounds(bgs);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 110);
  sh.setColumnWidth(2, 200);
  sh.setColumnWidth(5, 260);
  sh.setColumnWidth(6, 150);
  sh.setColumnWidth(7, 130);
  sh.getRange(values.length + 2, 1, 1, 1).setValues([[
    people.length
      ? 'クイズの列：まちがえずヒントも使わずに答えた割合（赤＝50%未満、黄＝80%未満）。書いた文は「しんぶん」シート、クイズの1問ずつの結果は「きろく」シートにあります。'
      : 'まだ記録がありません。子どもがアプリで調べ学習をすると、ここに表示されます。',
  ]]);
}

/* ---------- 内部で使う関数 ---------- */
// クイズの 結果（1問 1行）
function appendRecords_(name, records) {
  const recs = (Array.isArray(records) ? records : []).slice(0, MAX_RECORDS_PER_POST);
  if (!recs.length) return 0;
  const sh = sheet_(SHEET_LOG);
  const last = sh.getLastRow();
  const idCol = LOG_HEADER.length;
  const known = {};
  if (last > 1) sh.getRange(2, idCol, last - 1, 1).getValues().forEach(function (r) { known[String(r[0])] = true; });
  const rows = [];
  recs.forEach(function (r) {
    if (!r) return;
    const uid = str_(r.uid, 80);
    if (!uid || known[uid]) return; // 同じ記録は 2回 書かない
    known[uid] = true;
    rows.push([
      new Date(Number(r.at) || Date.now()), name, str_(r.pref, 20), str_(r.item, 30), str_(r.q, 100), str_(r.correct, 60),
      str_(r.answers, 200), str_(r.result, 30), num_(r.mistakes), num_(r.hints), num_(r.sec), uid,
    ]);
  });
  if (!rows.length) return 0;
  sh.getRange(last + 1, 1, rows.length, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  sh.getRange(last + 1, 3, rows.length, 6).setNumberFormat('@');
  sh.getRange(last + 1, 1, rows.length, LOG_HEADER.length).setValues(rows);
  return rows.length;
}

// しんぶん（なまえ と 都道府県 ごとに 1行。あたらしい 内容で 書きかえる）
function upsertPapers_(name, sheets) {
  const list = (Array.isArray(sheets) ? sheets : []).slice(0, MAX_SHEETS_PER_POST);
  if (!list.length) return 0;
  const sh = sheet_(SHEET_PAPER);
  const idCol = PAPER_HEADER.length;
  let last = sh.getLastRow();
  const ids = last > 1 ? sh.getRange(2, idCol, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  let n = 0;
  list.forEach(function (p) {
    if (!p || !PREF_RE.test(String(p.prefId || ''))) return;
    const id = name + '|' + p.prefId;
    const items = Array.isArray(p.items) ? p.items : [];
    const row = [new Date(), name, str_(p.pref, 20), num_(p.done) + ' / ' + num_(p.total)];
    for (let i = 0; i < ITEM_LABELS.length; i++) {
      const it = items[i] || {};
      row.push(it.done ? str_(it.photo, 60) : '', it.done ? str_(it.text, 300) : '');
    }
    row.push(str_(id, 80));
    let idx = ids.indexOf(id);
    let r;
    if (idx >= 0) r = idx + 2;
    else { last += 1; r = last; ids.push(id); }
    sh.getRange(r, 1, 1, 1).setNumberFormat('yyyy/mm/dd hh:mm');
    sh.getRange(r, 2, 1, PAPER_HEADER.length - 2).setNumberFormat('@');
    sh.getRange(r, 1, 1, PAPER_HEADER.length).setValues([row]);
    n++;
  });
  return n;
}

function saveSummary_(name, s) {
  const clean = {
    title: str_(s.title, 40), visited: num_(s.visited), stickers: num_(s.stickers), allStickers: num_(s.allStickers),
    quizN: num_(s.quizN), quizFirst: num_(s.quizFirst), lastAt: num_(s.lastAt), current: str_(s.current, 60),
  };
  const sh = sheet_(SHEET_DATA);
  const last = sh.getLastRow();
  const names = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  const idx = names.indexOf(name);
  sh.getRange(idx >= 0 ? idx + 2 : last + 1, 1, 1, 3).setValues([[name, JSON.stringify(clean), new Date()]]);
}

function setup_() {
  const ss = ss_();
  if (!ss.getSheetByName(SHEET_SUMMARY)) ss.insertSheet(SHEET_SUMMARY, 0);
  let paper = ss.getSheetByName(SHEET_PAPER);
  if (!paper) {
    paper = ss.insertSheet(SHEET_PAPER, 1);
    paper.getRange(1, 1, 1, PAPER_HEADER.length).setValues([PAPER_HEADER]).setFontWeight('bold').setBackground('#bbf7d0');
    paper.setFrozenRows(1);
    paper.setFrozenColumns(2);
    paper.setColumnWidth(1, 130);
    for (let i = 0; i < ITEM_LABELS.length; i++) {
      paper.setColumnWidth(5 + i * 2, 130);
      paper.setColumnWidth(6 + i * 2, 320);
    }
  }
  let log = ss.getSheetByName(SHEET_LOG);
  if (!log) {
    log = ss.insertSheet(SHEET_LOG, 2);
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
