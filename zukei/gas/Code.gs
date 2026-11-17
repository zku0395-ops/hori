/**
 * トンガリはかせの ロボット けんきゅうじょ（三角形・四角形の学習）― Google Apps Script（スプレッドシートに付けて使う）
 *
 * このスクリプトには 2つの役目があります。
 *   1. 子どもが開く「入口ページ」
 *      「はじめる」ボタンで GitHub Pages のアプリ本体を開きます。
 *      そのとき、記録の送り先（このウェブアプリのURL）と合言葉を アプリに渡します。
 *   2. 記録の「受け取り口」
 *      アプリから送られてきた 1問ごとの記録を「きろく」シートに書き込み、
 *      「いちらん」（1人1行）と「まとめ」（形ごとの正答率）を作り直します。
 *
 * ほかのアプリとは別のスプレッドシートに付けてください。
 * 準備のしかたは zukei/README.md の「2. Apps Script とスプレッドシート」を見てください。
 */

// アプリ本体（GitHub Pages）のURL
const APP_URL = 'https://zku0395-ops.github.io/hori/zukei/';
// 記録の送り先がうまく渡らないときだけ、デプロイしたウェブアプリのURL（…/exec）をここに貼ります
const RECORD_URL = '';

const APP_ID = 'zukei-robot';
const SHEET_SUMMARY = 'いちらん';
const SHEET_LOG = 'きろく';
const SHEET_SUM = 'まとめ';
const SHEET_DATA = '_data';
// 見出しは 前の版（Apps Script だけの版）と おなじ。いちばん右に 記録ID を 足す
const LOG_HEADER = ['日時', 'なまえ', 'ステージ', 'ステップ', 'もんだい', 'かたち', 'けっか', 'かいすう', 'ヒント', 'まちがい', '記録ID'];
const STAGE_IDS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7'];
const SET_SIZE = 10;
const MAX_RECORDS_PER_POST = 300;

/* ---------- 入口ページ ---------- */
function doGet() {
  setup_();
  const template = HtmlService.createTemplateFromFile('start');
  const rec = webAppUrl_();
  template.startUrl = APP_URL + (rec ? '#rec=' + encodeURIComponent(rec) + '&key=' + encodeURIComponent(getKey_()) : '');
  return template.evaluate()
    .setTitle('トンガリはかせの ロボット けんきゅうじょ')
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
    .createMenu('ロボット けんきゅうじょ')
    .addItem('一覧とまとめを更新', 'updateSummary')
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

/* ---------- いちらん・まとめ シートを作り直す ---------- */
function updateSummary() {
  setup_();
  writeIchiran_();
  writeMatome_();
}

// いちらん：1人1行
function writeIchiran_() {
  const data = sheet_(SHEET_DATA);
  const last = data.getLastRow();
  const rows = last > 1 ? data.getRange(2, 1, last - 1, 2).getValues() : [];
  const people = rows
    .map(function (r) { let s = {}; try { s = JSON.parse(r[1]); } catch (e) { s = {}; } return { name: String(r[0]), s: s }; })
    .filter(function (p) { return p.name; })
    .sort(function (a, b) { return a.name.localeCompare(b.name, 'ja'); });
  const header = ['なまえ', 'レベル', 'クリアしたステージ', 'いま学習中', '回答数', '1回目正答率', '最終学習日', 'アイテム']
    .concat(STAGE_IDS.map(function (id, i) { return 'ステージ' + i; }));
  const values = [header];
  const bgs = [header.map(function () { return '#e0f2fe'; })];
  people.forEach(function (p) {
    const s = p.s;
    const row = [p.name, s.level || 1, (s.cleared || 0) + ' / 8', s.current || '', s.count || 0,
      s.count ? Math.round((s.first || 0) / s.count * 100) + '%' : '', s.last || '', (s.items || 0) + ' / 29' + (s.kira ? '（キラキラ ' + s.kira + '）' : '')];
    const bg = row.map(function () { return '#ffffff'; });
    STAGE_IDS.forEach(function (id) {
      const r = (s.rounds || {})[id] || 0;
      row.push(r >= SET_SIZE ? '◎' : r ? r + '/' + SET_SIZE : '');
      bg.push(r >= SET_SIZE ? '#bbf7d0' : r ? '#fef9c3' : '#ffffff');
    });
    values.push(row);
    bgs.push(bg);
  });
  const sh = sheet_(SHEET_SUMMARY);
  sh.clear();
  if (people.length) sh.getRange(2, 3, people.length, 1).setNumberFormat('@');
  sh.getRange(1, 1, values.length, header.length).setValues(values).setBackgrounds(bgs);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);
  sh.getRange(values.length + 2, 1).setValue(people.length
    ? 'ステージの列：◎＝1セット（10回）クリア、「4/10」＝10回のうち4回まで終わった。'
    : 'まだ記録がありません。子どもがアプリで問題をとくと、ここに表示されます。');
}

// まとめ：子どもごと・形（問題）ごとの 1回目正答率（低い順）と 多いまちがい
function writeMatome_() {
  const log = sheet_(SHEET_LOG);
  const last = log.getLastRow();
  const rows = last > 1 ? log.getRange(2, 1, last - 1, LOG_HEADER.length).getValues() : [];
  const students = {};
  rows.forEach(function (r) {
    const name = String(r[1]).trim(), shape = String(r[5]);
    if (!name || !shape) return;
    const s = students[name] || (students[name] = {});
    const x = s[shape] || (s[shape] = { n: 0, ok: 0, miss: {} });
    x.n++;
    x.ok += r[6] === '○' ? 1 : 0;
    String(r[9] || '').split('、').forEach(function (m) {
      m = m.trim();
      if (m) x.miss[m] = (x.miss[m] || 0) + 1;
    });
  });
  const header = ['なまえ', 'かたち・もんだい', 'かいすう', '1回目で正解', '1回目正答率', 'おもな まちがい'];
  const out = [header];
  Object.keys(students).sort(function (a, b) { return a.localeCompare(b, 'ja'); }).forEach(function (n) {
    const s = students[n];
    const list = Object.keys(s).map(function (k) {
      const x = s[k];
      const miss = Object.keys(x.miss).sort(function (a, b) { return x.miss[b] - x.miss[a]; }).slice(0, 3)
        .map(function (m) { return m + '（' + x.miss[m] + '）'; }).join('、');
      return [n, k, x.n, x.ok, x.ok / x.n, miss];
    });
    list.sort(function (a, b) { return a[4] - b[4]; });
    list.forEach(function (r) { out.push(r); });
  });
  const sh = sheet_(SHEET_SUM);
  sh.clear();
  sh.getRange(1, 1, out.length, header.length).setValues(out);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#e0f2fe');
  sh.setFrozenRows(1);
  if (out.length > 1) {
    const body = sh.getRange(2, 5, out.length - 1, 1);
    body.setNumberFormat('0%');
    body.setBackgrounds(body.getValues().map(function (r) {
      return [r[0] < 0.6 ? '#fecaca' : r[0] < 0.8 ? '#fef08a' : '#bbf7d0'];
    }));
  }
  sh.getRange(out.length + 2, 1).setValue('※ 1回目で正解した割合。赤：60%未満　黄：60〜79%　緑：80%以上');
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
      new Date(Number(r.at) || Date.now()), name, str_(r.stage, 10), str_(r.step, 10), str_(r.problem, 80), str_(r.shape, 80),
      r.result === '○' ? '○' : '△', num_(r.tries), num_(r.hint), str_(r.miss, 500), uid,
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
    level: num_(s.level), cleared: num_(s.cleared), count: num_(s.count), first: num_(s.first),
    last: str_(s.last, 20), current: str_(s.current, 60), items: num_(s.items), kira: num_(s.kira), rounds: {},
  };
  STAGE_IDS.forEach(function (id) { clean.rounds[id] = num_((s.rounds || {})[id]) || 0; });
  const name = str_(body.name, 40);
  const sh = sheet_(SHEET_DATA);
  const last = sh.getLastRow();
  const names = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  const idx = names.indexOf(name);
  sh.getRange(idx >= 0 ? idx + 2 : last + 1, 1, 1, 3).setValues([[name, JSON.stringify(clean), new Date()]]);
}

function setup_() {
  const ss = ss_();
  if (!ss.getSheetByName(SHEET_SUMMARY)) ss.insertSheet(SHEET_SUMMARY, 0);
  let log = ss.getSheetByName(SHEET_LOG);
  if (!log) {
    log = ss.insertSheet(SHEET_LOG, 1);
    log.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]).setFontWeight('bold').setBackground('#fef9c3');
    log.setFrozenRows(1);
  } else if (String(log.getRange(1, LOG_HEADER.length).getValue()) !== '記録ID') {
    // 前の版の「きろく」シートには 記録ID の 列が ないので 足す
    log.getRange(1, LOG_HEADER.length).setValue('記録ID').setFontWeight('bold').setBackground('#fef9c3');
  }
  if (!ss.getSheetByName(SHEET_SUM)) ss.insertSheet(SHEET_SUM);
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
  // 学校の アカウントの URL（/a/macros/学校/s/ や /a/学校/macros/s/）は /macros/s/ に そろえる
  return url.replace(/\/a\/macros\/[^/]+\/s\//, '/macros/s/').replace(/\/a\/[^/]+\/macros\/s\//, '/macros/s/');
}

// 文字列は 長さを 切り、= + - @ で 始まるものは 式として 動かないように する
function str_(v, max) {
  let s = v === undefined || v === null ? '' : String(v).replace(/[\r\n\t]/g, ' ').slice(0, max);
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
