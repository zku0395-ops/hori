/**
 * ショコの まなびの としょかん（サーバー側）
 *
 * スプレッドシートの「拡張機能 → Apps Script」に貼り付けて使います。
 * シート：ほんだな・しりょう・せってい（なければ自動で作ります）
 * デプロイは「次のユーザーとして実行：自分」「アクセスできるユーザー：自分のみ」にします。
 */

const SHEET = { BOOKS: 'ほんだな', RES: 'しりょう', SET: 'せってい' };
const BOOK_HEADER = ['フォルダ', 'たな（教科）', 'アプリの URL', '入口ページの URL', 'メモ', 'こうしん'];
const RES_HEADER = ['ID', 'なまえ', 'URL', 'しゅるい', 'たな（教科）', 'つかう アプリ', 'メモ', 'こうしん'];
// しりょうの しゅるい（画面の id と、シートに 書く なまえ）
const RES_TYPES = {
  canva: 'Canva', doc: 'Google ドキュメント', slide: 'Google スライド', sheet: 'Google スプレッドシート',
  form: 'Google フォーム', pdf: 'PDF・ドライブ', youtube: 'YouTube', link: 'リンク',
};
// 画面の 教科の id と、シートに 書く なまえ
const SUBJECTS = {
  kokugo: '国語', sansu: '算数', seikatsu: '生活単元', ongaku: '音楽', zuko: '図工',
  sogo: '総合', taiiku: '体育', dotoku: '道徳', seiseki: '成績', komu: '校務', new: 'あたらしい本',
};
// 「せってい」シートの項目（画面の設定名・見出し・はじめの値・説明）
const SETTING_ROWS = [
  ['voice', 'ショコの こえ', 'オフ', 'オン／オフ'],
  ['rate', 'よみあげの はやさ', '0.9', '1がふつう。小さいほどゆっくり（0.7〜1.1）'],
  ['font', 'もじの おおきさ', '1', '0.9（ちいさめ）・1（ふつう）・1.15（おおきめ）・1.3（とても おおきい）'],
  ['favorites', 'おきにいり', '', 'フォルダの名前を「,」で区切ったもの（画面で ☆ を押すと変わります）'],
  ['recent', 'さいきん ひらいた', '', 'フォルダの名前を「,」で区切ったもの（自動で記録します）'],
];
const GITHUB = { OWNER: 'zku0395-ops', REPO: 'hori', BRANCH: 'main' };

// ---------------------------------------------------------------------
// 画面を表示する
// ---------------------------------------------------------------------
function doGet() {
  ensureSheets_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ショコの まなびの としょかん')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// スプレッドシートを開いたときにメニューを出す
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📚 としょかん')
    .addItem('シートを準備する', 'setup')
    .addToUi();
}

function setup() {
  ensureSheets_();
  SpreadsheetApp.getActiveSpreadsheet().toast('シートの準備ができました。ウェブアプリを開いて使ってください。');
}

// ---------------------------------------------------------------------
// シートの準備
// ---------------------------------------------------------------------
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function ensureSheets_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET.BOOKS);
  if (!sh) {
    sh = ss.insertSheet(SHEET.BOOKS, 0);
    sh.getRange(1, 1, 1, BOOK_HEADER.length).setValues([BOOK_HEADER]).setFontWeight('bold').setBackground('#cffafe');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('@');
    sh.setColumnWidth(1, 160);
    sh.setColumnWidth(3, 380);
    sh.setColumnWidth(4, 380);
    sh.setColumnWidth(5, 260);
  }
  sh = ss.getSheetByName(SHEET.RES);
  if (!sh) {
    sh = ss.insertSheet(SHEET.RES, 1);
    sh.getRange(1, 1, 1, RES_HEADER.length).setValues([RES_HEADER]).setFontWeight('bold').setBackground('#fef3c7');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('@');
    sh.setColumnWidth(2, 260);
    sh.setColumnWidth(3, 380);
    sh.setColumnWidth(7, 260);
  }
  sh = ss.getSheetByName(SHEET.SET);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SET);
    sh.getRange('B:B').setNumberFormat('@');
    const rows = [['こうもく', 'あたい', 'せつめい']].concat(SETTING_ROWS.map(function (r) { return [r[1], r[2], r[3]]; }));
    sh.getRange(1, 1, rows.length, 3).setValues(rows);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#ede9fe');
    sh.setColumnWidth(1, 180);
    sh.setColumnWidth(2, 300);
    sh.setColumnWidth(3, 460);
  }
}

// 受け取った文字列が 式として うごかないように する（先頭が = + - @ のとき）
function safe_(v) {
  v = v == null ? '' : String(v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

// フォルダの名前：画面では いちばん上を ''、シートでは '/' と書く
function dirToSheet_(d) { return d === '' ? '/' : String(d); }
function dirFromSheet_(d) { d = String(d).trim(); return d === '/' ? '' : d; }

function subjectId_(name) {
  name = String(name || '').trim();
  for (const id in SUBJECTS) if (SUBJECTS[id] === name || id === name) return id;
  return '';
}

function typeId_(name) {
  name = String(name || '').trim();
  for (const id in RES_TYPES) if (RES_TYPES[id] === name || id === name) return id;
  return 'link';
}

function cleanUrl_(u) {
  u = String(u || '').trim();
  return /^https:\/\/\S+$/.test(u) ? u : '';
}

// ---------------------------------------------------------------------
// 画面から よばれる 関数
// ---------------------------------------------------------------------
function loadState() {
  ensureSheets_();
  const books = {};
  const values = ss_().getSheetByName(SHEET.BOOKS).getDataRange().getDisplayValues();
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!String(r[0]).trim()) continue;
    books[dirFromSheet_(r[0])] = {
      subject: subjectId_(r[1]), appUrl: cleanUrl_(r[2]), entryUrl: cleanUrl_(r[3]), memo: String(r[4] || ''),
    };
  }
  const resources = [];
  const rv = ss_().getSheetByName(SHEET.RES).getDataRange().getDisplayValues();
  for (let i = 1; i < rv.length; i++) {
    const r = rv[i];
    const id = String(r[0]).trim();
    if (!id || !cleanUrl_(r[2])) continue;
    resources.push({
      id: id, title: String(r[1] || ''), url: cleanUrl_(r[2]), type: typeId_(r[3]),
      subject: subjectId_(r[4]), app: String(r[5] || '').trim(), // いちばん上の アプリ（音読）は '/'
      memo: String(r[6] || ''),
    });
  }
  const m = settingsMap_();
  const get = function (key) {
    const row = SETTING_ROWS.filter(function (r) { return r[0] === key; })[0];
    const v = m[row[1]];
    return v === undefined ? row[2] : v;
  };
  const list = function (key) {
    return get(key) === '' ? [] : get(key).split(',').map(function (s) { return dirFromSheet_(s); }).filter(function (s, i, a) { return a.indexOf(s) === i; });
  };
  return {
    books: books,
    resources: resources,
    favorites: list('favorites'),
    recent: list('recent'),
    settings: {
      voice: get('voice') === 'オン',
      rate: Number(get('rate')) || 0.9,
      font: Number(get('font')) || 1,
    },
  };
}

function saveBook(dir, data) {
  ensureSheets_();
  dir = String(dir == null ? '' : dir);
  if (!/^[\w\-\/.]*$/.test(dir) || dir.indexOf('..') >= 0) throw new Error('フォルダの名前が正しくありません');
  data = data || {};
  const subject = SUBJECTS[data.subject] || '';
  const row = [dirToSheet_(dir), subject, cleanUrl_(data.appUrl), cleanUrl_(data.entryUrl), safe_(String(data.memo || '').slice(0, 500)), new Date()];
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = ss_().getSheetByName(SHEET.BOOKS);
    const keys = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getDisplayValues();
    let at = -1;
    for (let i = 1; i < keys.length; i++) if (String(keys[i][0]).trim() === dirToSheet_(dir)) { at = i + 1; break; }
    if (at < 0) at = sh.getLastRow() + 1;
    sh.getRange(at, 1, 1, row.length).setValues([row]);
  } finally {
    lock.releaseLock();
  }
  return true;
}

function saveList(key, list) {
  if (key !== 'favorites' && key !== 'recent') throw new Error('しらない こうもく です');
  const v = (list || []).map(function (d) { return dirToSheet_(String(d)); })
    .filter(function (d) { return /^[\w\-\/.:]+$/.test(d); }).slice(0, 50).join(',');
  writeSetting_(key, v);
  return true;
}

function saveSettings(s) {
  s = s || {};
  writeSetting_('voice', s.voice ? 'オン' : 'オフ');
  writeSetting_('rate', String(Math.min(1.5, Math.max(0.5, Number(s.rate) || 0.9))));
  writeSetting_('font', String(Math.min(1.5, Math.max(0.8, Number(s.font) || 1))));
  return true;
}

// しりょう（Canva・Google の ファイルなど）を 登録する・なおす
function saveResource(r) {
  ensureSheets_();
  r = r || {};
  const id = String(r.id || '');
  if (!/^r[a-z0-9]{4,24}$/.test(id)) throw new Error('ID が 正しくありません');
  const url = cleanUrl_(r.url);
  if (!url) throw new Error('https:// で はじまる URL を 入れてください');
  const title = String(r.title || '').trim().slice(0, 100);
  if (!title) throw new Error('なまえを 入れてください');
  const subject = SUBJECTS[r.subject] && r.subject !== 'new' ? SUBJECTS[r.subject] : '';
  if (!subject) throw new Error('たなを えらんでください');
  const app = String(r.app || '');
  if (app && (!/^[\w\-\/.]+$/.test(app) || app.indexOf('..') >= 0)) throw new Error('アプリの 名前が 正しくありません');
  const row = [id, safe_(title), url, RES_TYPES[r.type] || RES_TYPES.link, subject, app, safe_(String(r.memo || '').slice(0, 500)), new Date()];
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = ss_().getSheetByName(SHEET.RES);
    const at = findRow_(sh, id);
    sh.getRange(at > 0 ? at : sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  } finally {
    lock.releaseLock();
  }
  return true;
}

// しりょうを けす（おきにいり・さいきん からも けす）。Canva や Google の ファイルそのものは けさない
function deleteResource(id) {
  ensureSheets_();
  id = String(id || '');
  if (!/^r[a-z0-9]{4,24}$/.test(id)) throw new Error('ID が 正しくありません');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = ss_().getSheetByName(SHEET.RES);
    const at = findRow_(sh, id);
    if (at > 0) sh.deleteRow(at);
  } finally {
    lock.releaseLock();
  }
  const st = loadState();
  saveList('favorites', st.favorites.filter(function (d) { return d !== 'res:' + id; }));
  saveList('recent', st.recent.filter(function (d) { return d !== 'res:' + id; }));
  return true;
}

// 1れつめが key の 行の 番号（なければ -1）
function findRow_(sh, key) {
  const keys = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getDisplayValues();
  for (let i = 1; i < keys.length; i++) if (String(keys[i][0]).trim() === key) return i + 1;
  return -1;
}

// GitHub の ファイルの 一覧（画面から 直接 読めないときの 予備）
function fetchTree() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('tree');
  if (hit) return JSON.parse(hit);
  const url = 'https://api.github.com/repos/' + GITHUB.OWNER + '/' + GITHUB.REPO + '/git/trees/' + GITHUB.BRANCH + '?recursive=1';
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { Accept: 'application/vnd.github+json' } });
  if (res.getResponseCode() !== 200) throw new Error('GitHub ' + res.getResponseCode());
  const paths = JSON.parse(res.getContentText()).tree
    .filter(function (t) { return t.type === 'blob'; })
    .map(function (t) { return t.path; });
  try { cache.put('tree', JSON.stringify(paths), 600); } catch (e) { /* 大きすぎるときは 保存しない */ }
  return paths;
}

// ファイルの 中み（画面から 直接 読めないときの 予備）
function fetchFile(path) {
  path = String(path || '');
  if (!path || path.indexOf('..') >= 0 || /^\//.test(path)) throw new Error('ファイルの名前が正しくありません');
  const url = 'https://raw.githubusercontent.com/' + GITHUB.OWNER + '/' + GITHUB.REPO + '/' + GITHUB.BRANCH + '/' +
    path.split('/').map(encodeURIComponent).join('/');
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('GitHub ' + res.getResponseCode());
  return res.getContentText('UTF-8');
}

// ---------------------------------------------------------------------
// 「せってい」シート
// ---------------------------------------------------------------------
function settingsMap_() {
  const values = ss_().getSheetByName(SHEET.SET).getDataRange().getDisplayValues();
  const map = {};
  values.forEach(function (r) { if (r[0]) map[String(r[0]).trim()] = String(r[1]).trim(); });
  return map;
}

function writeSetting_(key, value) {
  ensureSheets_();
  const row = SETTING_ROWS.filter(function (r) { return r[0] === key; })[0];
  const sh = ss_().getSheetByName(SHEET.SET);
  const values = sh.getDataRange().getDisplayValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === row[1]) { sh.getRange(i + 1, 2).setValue(safe_(value)); return; }
  }
  sh.appendRow([row[1], safe_(value), row[3]]);
}
