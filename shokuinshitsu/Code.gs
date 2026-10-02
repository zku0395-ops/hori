/**
 * 仮想職員室 ― Google Apps Script（スプレッドシートに付けて使う）
 *
 * 担任ひとりが使う「仮想職員室」の本体です。
 *   - doGet() で 画面（app.html）を 出します。
 *   - 画面から 呼ばれる apiGetAll / apiPut / apiRemove / apiSaveSettings で、
 *     このスプレッドシートの シートに 予定・時間割・週案・単元計画などを 読み書きします。
 *
 * デプロイは「次のユーザーとして実行：自分」「アクセスできるユーザー：自分のみ」で 行います。
 * 準備のしかたは shokuinshitsu/README.md を 見てください。
 */

const APP_TITLE = '仮想職員室';
const SHEET_SETTINGS = '設定';
const COL_ID = 'ID';
const COL_UPDATED = '更新日時';
const MAX_TEXT = 2000;
const MAX_LONG = 10000;
const MAX_RECORDS = 500;
const HEADER_BG = '#d9ead3';

// 画面の データの 種類と、シートの 列の 対応
// [画面での 名前, シートの 見出し, 型（省略＝文字 / long＝長い文 / num＝数 / date＝日付 / time＝時刻）]
const TABLES = {
  events: {
    sheet: '行事予定',
    cols: [['id', COL_ID], ['date', '日付', 'date'], ['end', '終わりの日', 'date'], ['time', '時刻', 'time'], ['title', '内容'], ['cat', '種類'], ['memo', 'メモ']],
  },
  timetable: {
    sheet: '基本の時間割',
    cols: [['id', COL_ID], ['day', '曜日(1=月)', 'num'], ['period', '校時ID'], ['subject', '教科'], ['memo', 'メモ']],
  },
  weekly: {
    sheet: '週案',
    cols: [['id', COL_ID], ['date', '日付', 'date'], ['period', '校時ID'], ['subject', '教科'], ['unitId', '単元ID'], ['content', '学習内容'], ['note', 'メモ・ふりかえり']],
  },
  children: {
    sheet: '子ども',
    cols: [['id', COL_ID], ['name', '呼び名'], ['grade', '学年'], ['homeroom', '交流学級'], ['order', '並び順', 'num'], ['memo', 'メモ']],
  },
  exchange: {
    sheet: '交流',
    cols: [['id', COL_ID], ['childId', '子どもID'], ['day', '曜日(1=月)', 'num'], ['period', '校時ID'], ['subject', '教科'], ['room', '交流先'], ['memo', 'メモ']],
  },
  units: {
    sheet: '単元計画',
    cols: [['id', COL_ID], ['subject', '教科'], ['name', '単元名'], ['start', 'はじめ', 'date'], ['end', 'おわり', 'date'], ['hours', '計画時数', 'num'], ['target', '対象'], ['goal', 'ねらい'], ['memo', 'メモ']],
  },
  materials: {
    sheet: '教材',
    cols: [['id', COL_ID], ['name', '名前'], ['subject', '教科'], ['kind', '種類'], ['url', 'URL'], ['unitId', '単元ID'], ['memo', 'メモ']],
    // シートを 作った ときに 最初から 入れておく 行
    seed: [{ id: 'm-ondoku', name: 'おんどくはかせの ちょうせんじょう', subject: '国語', kind: 'アプリ', url: 'https://zku0395-ops.github.io/hori/', memo: '自作の音読アプリ。全員の記録は「音読はかせ 記録」のスプレッドシートで見られます。' }],
  },
  // ここから 公務の部屋
  tasks: {
    sheet: 'やること',
    cols: [['id', COL_ID], ['title', 'やること'], ['due', '締め切り', 'date'], ['to', '提出先'], ['cat', '分類'], ['dutyId', '分掌ID'], ['memo', 'メモ'], ['done', '完了した日', 'date'], ['fromId', 'もとの記録']],
  },
  duties: {
    sheet: '校務分掌',
    cols: [['id', COL_ID], ['name', '分掌'], ['role', '役割'], ['order', '並び順', 'num'], ['memo', 'メモ']],
  },
  dutyItems: {
    sheet: '分掌の仕事',
    cols: [['id', COL_ID], ['dutyId', '分掌ID'], ['month', '月', 'num'], ['title', '仕事'], ['timing', '時期'], ['memo', 'メモ']],
  },
  meetings: {
    sheet: '会議メモ',
    cols: [['id', COL_ID], ['date', '日付', 'date'], ['kind', '種類'], ['title', '会議名'], ['content', '内容', 'long'], ['mine', '自分がやること', 'long']],
  },
  templates: {
    sheet: '文書のひな形',
    cols: [['id', COL_ID], ['title', '題名'], ['kind', '種類'], ['body', '本文', 'long']],
    seed: [
      { id: 'tp-dayori', title: '学級だより', kind: '学級だより', body: '{学級名} だより　{年度}年度　第　号\n{日付}\n\n保護者のみなさまへ\n\n（今月の ようす）\n\n\n（来月の 予定）\n・\n\n（お知らせ・お願い）\n・\n\n担任　' },
      { id: 'tp-oshirase', title: '保護者へのお知らせ（行事）', kind: 'お知らせ', body: '{日付}\n保護者のみなさま\n{学級名} 担任\n\n　　　　の お知らせ\n\n　日ごろより、本学級の教育活動に ご理解と ご協力を いただき、ありがとうございます。\n　さて、下記のとおり　　　　を 行います。ご確認くださいますよう、お願いいたします。\n\n記\n１　日時　　月　日（　）\n２　場所　\n３　持ち物　\n４　その他　\n\n以上' },
      { id: 'tp-moushiokuri', title: '交流学級の先生への申し送り', kind: '申し送り', body: '{日付}　交流学級担任の先生へ\n\n（呼び名）さんについて\n\n・きょうの ようす：\n・気をつけてほしいこと：\n・連絡：\n\n{学級名} 担任' },
    ],
  },
};

/* ---------- 画面を 出す ---------- */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('app')
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ---------- スプレッドシートの メニュー ---------- */
function onOpen() {
  try { ss_(); } catch (e) { /* スプレッドシートの 場所は 画面を 開いたときにも 覚える */ }
  SpreadsheetApp.getUi()
    .createMenu(APP_TITLE)
    .addItem('職員室を開くURLを表示', 'showUrl')
    .addItem('シートを準備する', 'setupSheets')
    .addToUi();
}

function showUrl() {
  let url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) { url = ''; }
  const ui = SpreadsheetApp.getUi();
  if (!url) {
    ui.alert('まだウェブアプリとしてデプロイされていません。\n「デプロイ」→「新しいデプロイ」から、種類「ウェブアプリ」、次のユーザーとして実行「自分」、アクセスできるユーザー「自分のみ」でデプロイしてください。');
    return;
  }
  ui.alert('仮想職員室のURL：\n' + url + '\n\nブラウザのブックマークに入れておくと便利です。学校のアカウントでログインしているときだけ開けます。');
}

function setupSheets() {
  withLock_(setup_);
  SpreadsheetApp.getUi().alert('シートを準備しました。');
}

/* ---------- 画面から 呼ばれる 関数 ---------- */
// すべての データを 1回で 返す（日付の 値は 文字に そろえる）
function apiGetAll() {
  const ss = ss_();
  withLock_(setup_);
  const tz = ss.getSpreadsheetTimeZone();
  const out = { settings: readSettings_(), tables: {}, sheetUrl: ss.getUrl() };
  Object.keys(TABLES).forEach(function (kind) { out.tables[kind] = readTable_(kind, tz); });
  return JSON.stringify(out);
}

// 記録を 書きこむ（同じ ID の 行が あれば 書きかえ、なければ 下に 足す）
function apiPut(kind, json) {
  table_(kind);
  const recs = parseList_(json);
  withLock_(function () { writeTable_(kind, recs); });
  return true;
}

function apiRemove(kind, json) {
  table_(kind);
  const ids = parseList_(json).map(function (v) { return cleanId_(v); }).filter(String);
  withLock_(function () { deleteRows_(kind, ids); });
  return true;
}

function apiSaveSettings(json) {
  const obj = JSON.parse(json);
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('設定の形が正しくありません。');
  withLock_(function () { writeSettings_(obj); });
  return true;
}

/* ---------- シートの 読み書き ---------- */
function readTable_(kind, tz) {
  const t = table_(kind);
  const values = tableSheet_(kind).getDataRange().getValues();
  if (values.length < 2) return [];
  const header = values[0].map(String);
  const idx = t.cols.map(function (c) { return header.indexOf(c[1]); });
  const list = [];
  for (let i = 1; i < values.length; i++) {
    const rec = {};
    t.cols.forEach(function (c, k) { rec[c[0]] = idx[k] >= 0 ? fromCell_(values[i][idx[k]], c[2], tz) : ''; });
    if (rec.id) list.push(rec);
  }
  return list;
}

function writeTable_(kind, recs) {
  const t = table_(kind);
  const sh = tableSheet_(kind);
  const width = sh.getLastColumn();
  const values = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), width).getValues();
  const header = values[0].map(String);
  const idCol = header.indexOf(COL_ID);
  const updCol = header.indexOf(COL_UPDATED);
  const rowOf = {};
  for (let i = 1; i < values.length; i++) {
    const id = String(values[i][idCol]);
    if (id) rowOf[id] = i;
  }

  // 同じ ID が 2回 来たら あとの ほうを 使う
  const byId = {};
  const order = [];
  recs.forEach(function (rec) {
    const id = rec && cleanId_(rec.id);
    if (!id) return;
    if (!byId[id]) order.push(id);
    byId[id] = rec;
  });

  const now = new Date();
  const appended = [];
  order.forEach(function (id) {
    const rec = byId[id];
    const i = rowOf[id];
    // 画面が 知らない 列（先生が 足した列）の 値は そのまま 残す
    const row = i !== undefined ? values[i].map(keepCell_) : header.map(function () { return ''; });
    t.cols.forEach(function (c) {
      const j = header.indexOf(c[1]);
      if (j < 0) return;
      if (c[0] === 'id') row[j] = id;
      else if (Object.prototype.hasOwnProperty.call(rec, c[0])) row[j] = toCell_(rec[c[0]], c[2]);
    });
    if (updCol >= 0) row[updCol] = now;
    if (i !== undefined) sh.getRange(i + 1, 1, 1, width).setValues([row]);
    else appended.push(row);
  });
  if (appended.length) sh.getRange(values.length + 1, 1, appended.length, width).setValues(appended);
}

function deleteRows_(kind, ids) {
  if (!ids.length) return;
  const sh = tableSheet_(kind);
  const last = sh.getLastRow();
  if (last < 2) return;
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const idCol = header.indexOf(COL_ID) + 1;
  const col = sh.getRange(2, idCol, last - 1, 1).getValues();
  const want = {};
  ids.forEach(function (id) { want[id] = true; });
  // 下の 行から 消すと 行番号が ずれない
  for (let i = col.length - 1; i >= 0; i--) {
    if (want[String(col[i][0])]) sh.deleteRow(i + 2);
  }
}

/* ---------- 設定（「設定」シートに 項目ごとに 1行） ---------- */
function readSettings_() {
  const sh = settingsSheet_();
  const last = sh.getLastRow();
  const out = {};
  if (last < 2) return out;
  sh.getRange(2, 1, last - 1, 2).getValues().forEach(function (r) {
    const key = String(r[0]);
    if (!/^[A-Za-z]{1,30}$/.test(key)) return;
    try { out[key] = JSON.parse(String(r[1])); } catch (e) { /* 読めない 行は 使わない */ }
  });
  return out;
}

function writeSettings_(obj) {
  const sh = settingsSheet_();
  const last = sh.getLastRow();
  const keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  let next = Math.max(last, 1) + 1;
  Object.keys(obj).forEach(function (key) {
    if (!/^[A-Za-z]{1,30}$/.test(key)) return;
    const json = JSON.stringify(obj[key]);
    if (json === undefined || json.length > 40000) return;
    const i = keys.indexOf(key);
    const row = i >= 0 ? i + 2 : next++;
    sh.getRange(row, 1, 1, 3).setValues([[key, "'" + json, new Date()]]);
  });
}

/* ---------- 準備 ---------- */
function setup_() {
  Object.keys(TABLES).forEach(tableSheet_);
  settingsSheet_();
  // 最初から ある 空の シートは 消す
  const ss = ss_();
  ['シート1', 'Sheet1'].forEach(function (n) {
    const sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() === 0 && sh.getLastColumn() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
}

// シートが なければ 作り、足りない 見出しが あれば 右に 足す
function tableSheet_(kind) {
  const t = table_(kind);
  const ss = ss_();
  const labels = t.cols.map(function (c) { return c[1]; }).concat([COL_UPDATED]);
  let sh = ss.getSheetByName(t.sheet);
  if (!sh) {
    sh = ss.insertSheet(t.sheet);
    sh.getRange(1, 1, 1, labels.length).setValues([labels]).setFontWeight('bold').setBackground(HEADER_BG);
    sh.setFrozenRows(1);
    if (t.seed) writeTable_(kind, t.seed);
    return sh;
  }
  const width = Math.max(sh.getLastColumn(), 1);
  const header = sh.getRange(1, 1, 1, width).getValues()[0].map(String);
  const missing = labels.filter(function (l) { return header.indexOf(l) < 0; });
  if (missing.length) {
    const start = header.join('') === '' ? 1 : width + 1;
    sh.getRange(1, start, 1, missing.length).setValues([missing]).setFontWeight('bold').setBackground(HEADER_BG);
    if (start === 1) sh.setFrozenRows(1);
  }
  return sh;
}

function settingsSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET_SETTINGS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_SETTINGS);
    sh.getRange(1, 1, 1, 3).setValues([['項目', '値', COL_UPDATED]]).setFontWeight('bold').setBackground(HEADER_BG);
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ---------- 内部で 使う 関数 ---------- */
function table_(kind) {
  if (!Object.prototype.hasOwnProperty.call(TABLES, kind)) throw new Error('知らない種類です：' + kind);
  return TABLES[kind];
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

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function parseList_(json) {
  const list = JSON.parse(json);
  if (!Array.isArray(list)) throw new Error('データの形が正しくありません。');
  if (list.length > MAX_RECORDS) throw new Error('一度に保存できるのは ' + MAX_RECORDS + ' 件までです。');
  return list;
}

function cleanId_(v) {
  const s = String(v === undefined || v === null ? '' : v);
  return /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(s) ? s : '';
}

// 画面の 値 → シートの 値
function toCell_(v, type) {
  if (v === undefined || v === null) return '';
  if (type === 'num') {
    const n = Number(v);
    return v === '' || !isFinite(n) ? '' : n;
  }
  const s = String(v).slice(0, type === 'long' ? MAX_LONG : MAX_TEXT);
  // 日付は シートでも 日付として 並べかえ できるように そのまま 入れる
  if (type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
  return text_(s);
}

// 式・数・日付として 読みかえられないように、先頭に ' を つけて 文字として 入れる
function text_(s) {
  if (s && (/^[=+\-@']/.test(s) || /^[\d\s/.:,-]+$/.test(s))) return "'" + s;
  return s;
}

// すでに ある 行を 書きもどす ときに、文字が 式などに 変わらないように する
function keepCell_(v) {
  return typeof v === 'string' ? text_(v.slice(0, MAX_LONG)) : v;
}

// シートの 値 → 画面の 値（Date は 画面に 渡せないので 文字に する）
function fromCell_(v, type, tz) {
  if (v instanceof Date) {
    if (type === 'time' || v.getFullYear() < 1901) return Utilities.formatDate(v, tz, 'HH:mm');
    return Utilities.formatDate(v, tz, type === 'date' ? 'yyyy-MM-dd' : 'yyyy/MM/dd');
  }
  if (v === null || v === undefined) return '';
  if (type === 'num') return v === '' || !isFinite(Number(v)) ? '' : Number(v);
  const s = String(v);
  if (type === 'date') {
    const m = s.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/);
    return m ? m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2) : '';
  }
  return s;
}
