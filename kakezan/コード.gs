/**
 * ケンジャの カケルさまの ひっさん クエスト（サーバー側）
 *
 * スプレッドシートの「拡張機能 → Apps Script」に貼り付けて使います。
 * シート：名簿・きろく・まとめ・せってい（なければ自動で作ります）
 * 絵：Google ドライブの「ひっさんクエスト え」フォルダ（なければ自動で作ります）
 */

const SHEET = { ROSTER: '名簿', LOG: 'きろく', SUM: 'まとめ', SET: 'せってい' };
const LOG_HEADER = ['日時', 'なまえ', 'ばしょ', 'たたかい', 'もんだい', 'こたえ', 'けっか', 'まちがい', 'ヒント', 'まちがいの しゅるい', 'まちがえて いれた かず', 'びょう', 'ID'];
const DEFAULT_PIN = '1234';
const IMG_FOLDER = 'ひっさんクエスト え';
// 「せってい」シートの項目（アプリの設定名 と 見出し）
const SETTING_ROWS = [
  ['rate', 'よみあげの はやさ', '0.8', '1がふつう。小さいほどゆっくり（0.5〜1.2）'],
  ['font', 'もじの おおきさ', '1', '0.9（ちいさめ）・1（ふつう）・1.15（おおきめ）・1.3（とても おおきい）'],
  ['count', '1回の もんだいの かず（かける数が 1けた）', '10', '3・5・10（モンスター 1ぴきに この かず）'],
  ['count2', '1回の もんだいの かず（かける数が 2けた）', '10', '2・3・5・10（モンスター 1ぴきに この かず）'],
  ['kakashi', 'かかし れんぞくの もんだいの かず', '10', '5・10'],
  ['hint', 'ヒントボタン', 'だす', 'だす／ださない（ださないときも、3回まちがえると答えがうすく出ます）'],
  ['yomi', '1マスごとの よみあげ', 'する', 'する／しない'],
  ['sound', 'こうかおん', 'ならす', 'ならす／ならさない'],
];
// オン・オフの 設定の ことば（オンの ことば、オフの ことば）
const ONOFF = { sound: ['ならす', 'ならさない'], hint: ['だす', 'ださない'], yomi: ['する', 'しない'] };
const NUM_CHOICES = { count: [3, 5, 10], count2: [2, 3, 5, 10], kakashi: [5, 10] };
// 前の版の「せってい」シート（せつめいが むかしの まま）は、はじめの かず（5・3）を 10 に かえる
const OLD_SETTING_NOTES = { count: ['3・5', '5'], count2: ['2・3・5', '3'] };
// 先生が 変える ところ（子どもの 端末の 古い しんちょくで 上書きしない）
const TEACHER_KEYS = ['unlockAll', 'hatten', 'range', 'hero'];

// ---------------------------------------------------------------------
// 画面を表示する
// ---------------------------------------------------------------------
function doGet() {
  ensureSheets_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ケンジャの カケルさまの ひっさん クエスト')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// スプレッドシートを開いたときにメニューを出す
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ひっさんクエスト')
    .addItem('シートを準備する', 'setup')
    .addItem('まとめを更新する', 'updateSummary')
    .addItem('絵のフォルダを作る・たしかめる', 'checkImageFolder')
    .addToUi();
}

function setup() {
  ensureSheets_();
  SpreadsheetApp.getActiveSpreadsheet().toast('シートの準備ができました。「名簿」シートに子どもの名前を入れてください。');
}

function updateSummary() {
  writeSummary_(aggregate_(readLog_()), rosterNames_());
  SpreadsheetApp.getActiveSpreadsheet().toast('まとめを更新しました。');
}

function checkImageFolder() {
  const r = getImageList();
  SpreadsheetApp.getActiveSpreadsheet().toast(r.ok ? 'ドライブの「' + IMG_FOLDER + '」フォルダに、絵が ' + r.files.length + 'まい あります。' : '絵のフォルダを たしかめられませんでした：' + r.reason);
}

// ---------------------------------------------------------------------
// シートの準備
// ---------------------------------------------------------------------
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function ensureSheets_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET.ROSTER);
  if (!sh) {
    sh = ss.insertSheet(SHEET.ROSTER, 0);
    sh.getRange(1, 1, 1, 2).setValues([['なまえ（ひらがな）', 'しんちょく（自動で記録します。さわらないでください）']])
      .setFontWeight('bold').setBackground('#fef3c7');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 420);
  }
  sh = ss.getSheetByName(SHEET.LOG);
  if (!sh) {
    sh = ss.insertSheet(SHEET.LOG);
    sh.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]).setFontWeight('bold').setBackground('#fde68a');
    sh.setFrozenRows(1);
  }
  sh = ss.getSheetByName(SHEET.SUM);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SUM);
    sh.getRange(1, 1).setValue('先生用画面を開くか、メニュー「ひっさんクエスト → まとめを更新する」で作られます。');
  }
  sh = ss.getSheetByName(SHEET.SET);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SET);
    sh.getRange('B:B').setNumberFormat('@'); // 暗証番号の先頭の0が消えないように文字列にする
    const rows = [['こうもく', 'あたい', 'せつめい'], ['暗証番号', DEFAULT_PIN, '先生用画面に入るための4けたの数字']]
      .concat(SETTING_ROWS.map(function (r) { return [r[1], r[2], r[3]]; }));
    sh.getRange(1, 1, rows.length, 3).setValues(rows);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#ede9fe');
    sh.setColumnWidth(1, 300);
    sh.setColumnWidth(3, 420);
  }
}

// 受け取った文字列が 式として うごかないように する（先頭が = + - @ のとき）
function safe_(v) {
  if (typeof v !== 'string') return v;
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function settingsMap_() {
  const sh = ss_().getSheetByName(SHEET.SET);
  const values = sh.getDataRange().getDisplayValues();
  const map = {};
  values.forEach(function (r) { if (r[0]) map[String(r[0]).trim()] = String(r[1]).trim(); });
  return map;
}

function migrateSettings_() {
  const sh = ss_().getSheetByName(SHEET.SET);
  const values = sh.getDataRange().getValues();
  Object.keys(OLD_SETTING_NOTES).forEach(function (k) {
    const row = SETTING_ROWS.filter(function (r) { return r[0] === k; })[0];
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0]).trim() !== row[1] || String(values[i][2]).trim() !== OLD_SETTING_NOTES[k][0]) continue;
      if (String(values[i][1]).trim() === OLD_SETTING_NOTES[k][1]) sh.getRange(i + 1, 2).setValue(row[2]); // 先生が かえて いない ときだけ
      sh.getRange(i + 1, 3).setValue(row[3]);
    }
  });
}

function appSettings_() {
  migrateSettings_();
  const m = settingsMap_();
  const get = function (key) {
    const row = SETTING_ROWS.filter(function (r) { return r[0] === key; })[0];
    const v = m[row[1]];
    return v === undefined || v === '' ? row[2] : v;
  };
  const s = { rate: Number(get('rate')) || 0.8, font: Number(get('font')) || 1 };
  Object.keys(NUM_CHOICES).forEach(function (k) {
    const n = Number(get(k));
    const def = Number(SETTING_ROWS.filter(function (r) { return r[0] === k; })[0][2]);
    s[k] = NUM_CHOICES[k].indexOf(n) >= 0 ? n : def;
  });
  Object.keys(ONOFF).forEach(function (k) { s[k] = get(k) !== ONOFF[k][1]; });
  return s;
}

function setSetting_(label, value) {
  const sh = ss_().getSheetByName(SHEET.SET);
  const values = sh.getDataRange().getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === label) { sh.getRange(i + 1, 2).setValue(String(value)); return; }
  }
  sh.appendRow([label, String(value), '']);
}

function rosterValues_() {
  const sh = ss_().getSheetByName(SHEET.ROSTER);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 2).getValues();
}

function rosterNames_() {
  return rosterValues_().map(function (r) { return String(r[0]).trim(); }).filter(String);
}

function findRosterRow_(name) {
  const values = rosterValues_();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === name) return i + 2;
  }
  return -1;
}

function checkPin_(pin) {
  const s = settingsMap_();
  return String(pin) === String(s['暗証番号'] || DEFAULT_PIN);
}

function parseProgress_(s) {
  try { return JSON.parse(s || '{}') || {}; } catch (e) { return {}; }
}

// ---------------------------------------------------------------------
// アプリから呼ばれる関数
// ---------------------------------------------------------------------
function getInitData() {
  ensureSheets_();
  return { students: rosterNames_(), settings: appSettings_() };
}

function getStudent(name) {
  const row = findRosterRow_(name);
  if (row < 0) throw new Error('名簿に「' + name + '」が見つかりません');
  return String(ss_().getSheetByName(SHEET.ROSTER).getRange(row, 2).getValue() || '');
}

// 記録と しんちょくを うけとる（同じ記録は 二重に 書かない）
function saveResult(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    ensureSheets_();
    const name = String(payload.name || '').trim();
    const row = findRosterRow_(name);
    if (row < 0) return { ok: false, reason: 'no-student' };
    if (payload.progress) {
      const cell = ss_().getSheetByName(SHEET.ROSTER).getRange(row, 2);
      const old = parseProgress_(cell.getValue());
      const neu = parseProgress_(payload.progress);
      // 古い 端末の しんちょくでは 上書きしない。先生が あとから 変えた ところは のこす
      if (!old.t || (neu.t || 0) >= old.t) {
        if (old.flagT && old.flagT > (neu.t || 0)) {
          TEACHER_KEYS.forEach(function (k) { neu[k] = old[k] === undefined ? null : old[k]; });
          neu.flagT = old.flagT;
        }
        cell.setValue(JSON.stringify(neu));
      }
    }
    const recs = payload.records || [];
    if (recs.length) {
      const log = ss_().getSheetByName(SHEET.LOG);
      const last = log.getLastRow();
      const known = {};
      if (last >= 2) {
        const from = Math.max(2, last - 3000);
        log.getRange(from, LOG_HEADER.length, last - from + 1, 1).getValues().forEach(function (r) { known[String(r[0])] = true; });
      }
      const t = new Date(payload.time || Date.now());
      const rows = recs.filter(function (r) { return r.id && !known[r.id]; }).map(function (r) {
        return [t, name, String(r.place || ''), String(r.battle || ''), String(r.prob || ''), Number(r.ans) || 0, r.result === '○' ? '○' : '△',
          Number(r.miss) || 0, Number(r.hint) || 0, String(r.kinds || ''), String(r.inputs || ''), Number(r.secs) || 0, String(r.id)].map(safe_);
      });
      if (rows.length) {
        // 「もんだい」は 文字の まま
        log.getRange(last + 1, 5, rows.length, 1).setNumberFormat('@');
        log.getRange(last + 1, 1, rows.length, LOG_HEADER.length).setValues(rows);
      }
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function emptyStudent_() {
  return { count: 0, ok: 0, miss: 0, hint: 0, last: '', places: {}, kinds: {}, wrongs: [] };
}

function getTeacherData(pin) {
  if (!checkPin_(pin)) return { ok: false };
  const roster = rosterValues_().filter(function (r) { return String(r[0]).trim(); });
  const agg = aggregate_(readLog_());
  writeSummary_(agg, roster.map(function (r) { return String(r[0]).trim(); }));
  return {
    ok: true,
    isDefaultPin: String(pin) === DEFAULT_PIN,
    settings: appSettings_(),
    students: roster.map(function (r) {
      const n = String(r[0]).trim();
      const s = agg.students[n] || emptyStudent_();
      s.name = n;
      s.progress = String(r[1] || '');
      return s;
    }),
    classKinds: agg.classKinds,
    classPlaces: agg.classPlaces,
  };
}

function updateProgress_(name, fn) {
  const row = findRosterRow_(name);
  if (row < 0) return { ok: false };
  const cell = ss_().getSheetByName(SHEET.ROSTER).getRange(row, 2);
  const p = parseProgress_(cell.getValue());
  fn(p);
  p.t = Date.now();
  const json = JSON.stringify(p);
  cell.setValue(json);
  return { ok: true, progress: json };
}

// 全部開く（unlockAll）・はってん（hatten）・しゅぎょうの はんい（range）・しゅじんこうを つくりなおす（remake）
function setFlag(pin, name, key, value) {
  if (!checkPin_(pin)) return { ok: false };
  if (['unlockAll', 'hatten', 'range', 'remake'].indexOf(key) < 0) return { ok: false };
  return updateProgress_(name, function (p) {
    if (key === 'range') p.range = value === '' || value === null || value === undefined || isNaN(Number(value)) ? null : Number(value);
    else if (key === 'remake') p.hero = null;
    else p[key] = !!value;
    p.flagT = Date.now();
  });
}

function addGold(pin, name, delta) {
  if (!checkPin_(pin)) return { ok: false };
  return updateProgress_(name, function (p) { p.gold = Math.max(0, (Number(p.gold) || 0) + (Number(delta) || 0)); });
}

function saveSettings(pin, s) {
  if (!checkPin_(pin)) return { ok: false };
  SETTING_ROWS.forEach(function (r) {
    if (s[r[0]] === undefined) return;
    let v = s[r[0]];
    if (ONOFF[r[0]]) v = v ? ONOFF[r[0]][0] : ONOFF[r[0]][1];
    setSetting_(r[1], v);
  });
  if (s.newPin && /^\d{4}$/.test(String(s.newPin))) setSetting_('暗証番号', String(s.newPin));
  return { ok: true };
}

function getLogRows(pin) {
  if (!checkPin_(pin)) return { ok: false };
  const tz = Session.getScriptTimeZone();
  const rows = readLog_().map(function (r) {
    return r.map(function (v) { return v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy/MM/dd HH:mm') : v; });
  });
  return { ok: true, rows: [LOG_HEADER].concat(rows) };
}

function getBackup(pin) {
  if (!checkPin_(pin)) return { ok: false };
  return { ok: true, data: { app: 'kakezan', time: new Date().toISOString(), roster: rosterValues_().filter(function (r) { return String(r[0]).trim(); }).map(function (r) { return [String(r[0]).trim(), String(r[1] || '')]; }), settings: appSettings_() } };
}

function restoreBackup(pin, data) {
  if (!checkPin_(pin)) return { ok: false };
  if (!data || data.app !== 'kakezan') return { ok: false };
  const sh = ss_().getSheetByName(SHEET.ROSTER);
  (data.roster || []).forEach(function (r) {
    const name = String(r[0] || '').trim();
    if (!name) return;
    let row = findRosterRow_(name);
    if (row < 0) { sh.appendRow([safe_(name), '']); row = sh.getLastRow(); }
    sh.getRange(row, 2).setValue(String(r[1] || ''));
  });
  return { ok: true };
}

// 記録を消す（name が空なら全員）
function clearRecords(pin, name) {
  if (!checkPin_(pin)) return { ok: false };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const log = ss_().getSheetByName(SHEET.LOG);
    const last = log.getLastRow();
    if (last >= 2) {
      if (!name) log.getRange(2, 1, last - 1, LOG_HEADER.length).clearContent();
      else {
        const keep = log.getRange(2, 1, last - 1, LOG_HEADER.length).getValues().filter(function (r) { return String(r[1]).trim() !== name; });
        log.getRange(2, 1, last - 1, LOG_HEADER.length).clearContent();
        if (keep.length) log.getRange(2, 1, keep.length, LOG_HEADER.length).setValues(keep);
      }
    }
    const sh = ss_().getSheetByName(SHEET.ROSTER);
    rosterValues_().forEach(function (r, i) {
      if (!name || String(r[0]).trim() === name) sh.getRange(i + 2, 2).setValue('');
    });
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------------
// 絵（ドライブの「ひっさんクエスト え」フォルダ）
// ---------------------------------------------------------------------
function imgFolder_() {
  const it = DriveApp.getFoldersByName(IMG_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(IMG_FOLDER);
}

// フォルダの 絵の 一覧（名前・ID・さいごに 変えた 時こく）
function getImageList() {
  try {
    const files = imgFolder_().getFiles();
    const out = [];
    while (files.hasNext()) {
      const f = files.next();
      if (!/^image\//.test(f.getMimeType())) continue;
      if (f.getSize() > 8 * 1024 * 1024) continue; // 大きすぎる 絵は つかわない
      out.push({ name: f.getName(), id: f.getId(), t: f.getLastUpdated().getTime(), size: f.getSize() });
    }
    return { ok: true, folder: IMG_FOLDER, files: out };
  } catch (e) {
    return { ok: false, reason: String(e && e.message || e) };
  }
}

// 絵を 1まい わたす（このフォルダの 絵だけ）
function getImage(id) {
  try {
    const f = DriveApp.getFileById(String(id));
    const folderId = imgFolder_().getId();
    let inside = false;
    const ps = f.getParents();
    while (ps.hasNext()) { if (ps.next().getId() === folderId) inside = true; }
    if (!inside || !/^image\//.test(f.getMimeType())) return { ok: false };
    return { ok: true, mime: f.getMimeType(), b64: Utilities.base64Encode(f.getBlob().getBytes()) };
  } catch (e) {
    return { ok: false, reason: String(e && e.message || e) };
  }
}

// ---------------------------------------------------------------------
// 集計（アプリの aggregate と おなじ しくみ）
// ---------------------------------------------------------------------
function readLog_() {
  const sh = ss_().getSheetByName(SHEET.LOG);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, LOG_HEADER.length).getValues().filter(function (r) { return String(r[1]).trim(); });
}

function aggregate_(rows) {
  const tz = Session.getScriptTimeZone();
  const students = {}, classKinds = {}, classPlaces = {};
  rows.forEach(function (r) {
    const name = String(r[1]).trim();
    if (!name) return;
    const pl = String(r[2]), ok = r[6] === '○' ? 1 : 0, miss = Number(r[7]) || 0, hint = Number(r[8]) || 0;
    const s = students[name] || (students[name] = emptyStudent_());
    const when = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy/MM/dd HH:mm') : String(r[0]);
    const day = when.slice(0, 10);
    if (day > s.last) s.last = day;
    s.count++; s.ok += ok; s.miss += miss; s.hint += hint ? 1 : 0;
    const g = s.places[pl] || (s.places[pl] = [0, 0, 0]);
    g[0]++; g[1] += ok; g[2] += miss;
    const c = classPlaces[pl] || (classPlaces[pl] = [0, 0, 0]);
    c[0]++; c[1] += ok; c[2] += miss;
    String(r[9] || '').split('・').forEach(function (k) {
      if (k) { s.kinds[k] = (s.kinds[k] || 0) + 1; classKinds[k] = (classKinds[k] || 0) + 1; }
    });
    if (miss > 0) {
      s.wrongs.push([when.slice(0, 16), pl, String(r[3]), String(r[4]), String(r[10] || ''), String(r[9] || '')]);
      if (s.wrongs.length > 15) s.wrongs.shift();
    }
  });
  return { students: students, classKinds: classKinds, classPlaces: classPlaces };
}

function top_(m, n) {
  return Object.keys(m || {}).sort(function (a, b) { return m[b] - m[a]; }).slice(0, n)
    .map(function (k) { return k + '（' + m[k] + '）'; }).join('・');
}

// 「まとめ」シート：子どもごと・ばしょごとの 結果
function writeSummary_(agg, names) {
  const sh = ss_().getSheetByName(SHEET.SUM);
  sh.clear();
  const header = ['なまえ', 'ばしょ', 'といた かず', 'まちがえずに とけた わりあい', 'まちがいの かず', 'まちがいの しゅるい'];
  const out = [header];
  names.forEach(function (n) {
    const s = agg.students[n];
    if (!s) return;
    out.push([n, 'ぜんたい', s.count, s.count ? s.ok / s.count : '', s.miss, top_(s.kinds, 3)]);
    Object.keys(s.places).sort().forEach(function (pl) {
      const g = s.places[pl];
      out.push([n, pl, g[0], g[0] ? g[1] / g[0] : '', g[2], '']);
    });
  });
  sh.getRange(1, 1, out.length, header.length).setValues(out);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#fde68a');
  sh.setFrozenRows(1);
  if (out.length > 1) {
    const body = sh.getRange(2, 4, out.length - 1, 1);
    body.setNumberFormat('0%');
    body.setBackgrounds(body.getValues().map(function (r) {
      return r.map(function (v) { return v === '' ? null : v < 0.6 ? '#fecaca' : v < 0.8 ? '#fef08a' : '#bbf7d0'; });
    }));
  }
  sh.getRange(out.length + 2, 1).setValue('※ 赤：60%未満　黄：60〜79%　緑：80%以上。くわしい つまずき（どの マスで どの数を 押したか）は、アプリの 先生用画面の「子どもごと」で 見られます。　更新：' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm'));
}
