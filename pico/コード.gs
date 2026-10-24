/**
 * ピコロボの タイピング パトロール（サーバー側）
 *
 * スプレッドシートの「拡張機能 → Apps Script」に貼り付けて使います。
 * シート：名簿・きろく・まとめ・せってい（なければ自動で作ります）
 */

const SHEET = { ROSTER: '名簿', LOG: 'きろく', SUM: 'まとめ', SET: 'せってい' };
const LOG_HEADER = ['日時', 'なまえ', 'だんかい', 'はやさ', 'もんだい', 'けっか', 'まちがい', 'ヒント', 'まちがえた キー', 'まちがえた おと', 'うった キー', 'びょう', 'ID'];
const DEFAULT_PIN = '1234';
// 「せってい」シートの項目（アプリの設定名 と 見出し）
const SETTING_ROWS = [
  ['rate', 'よみあげの はやさ', '0.8', '1がふつう。小さいほどゆっくり（0.5〜1.2）'],
  ['font', 'もじの おおきさ', '1', '0.9（ちいさめ）・1（ふつう）・1.15（おおきめ）・1.3（とても おおきい）'],
  ['count', '1回の かず（キー・1もじ）', '30', '10・20・30'],
  ['countLong', '1回の かず（ことば・ぶん）', '10', '5・10・15'],
  ['maxSpeed', 'いちばん はやくて', 'とても はやい', 'とても ゆっくり・ゆっくり・ふつう・はやい・とても はやい'],
  ['maxAt', 'いっしょに でる かず', '1', '1・2・3（ぶんの だんかいは いつも 1）'],
  ['glow', 'つぎの キーを ひからせる', 'ひからせる', 'ひからせる／ひからせない'],
  ['finger', 'ゆびの いろわけ', 'だす', 'だす／ださない（キーボードと 手の絵）'],
  ['romaji', 'ローマ字', 'だす', 'だす／ださない（ひらがなの下の ローマ字）'],
  ['sound', 'こうかおん', 'ならす', 'ならす／ならさない'],
];
// オン・オフの 設定の ことば（オンの ことば、オフの ことば）
const ONOFF = { glow: ['ひからせる', 'ひからせない'], finger: ['だす', 'ださない'], romaji: ['だす', 'ださない'], sound: ['ならす', 'ならさない'] };
// おちる はやさの ことば（0〜4）
const SPEED_NAMES = ['とても ゆっくり', 'ゆっくり', 'ふつう', 'はやい', 'とても はやい'];

// ---------------------------------------------------------------------
// 画面を表示する
// ---------------------------------------------------------------------
function doGet() {
  ensureSheets_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ピコロボの タイピング パトロール')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// スプレッドシートを開いたときにメニューを出す
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ピコ')
    .addItem('シートを準備する', 'setup')
    .addItem('まとめを更新する', 'updateSummary')
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
      .setFontWeight('bold').setBackground('#dbeafe');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 420);
  }
  sh = ss.getSheetByName(SHEET.LOG);
  if (!sh) {
    sh = ss.insertSheet(SHEET.LOG);
    sh.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]).setFontWeight('bold').setBackground('#e0f2fe');
    sh.setFrozenRows(1);
  }
  sh = ss.getSheetByName(SHEET.SUM);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SUM);
    sh.getRange(1, 1).setValue('先生用画面を開くか、メニュー「ピコ → まとめを更新する」で作られます。');
  }
  sh = ss.getSheetByName(SHEET.SET);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SET);
    sh.getRange('B:B').setNumberFormat('@'); // 暗証番号の先頭の0が消えないように文字列にする
    const rows = [['こうもく', 'あたい', 'せつめい'], ['暗証番号', DEFAULT_PIN, '先生用画面に入るための4けたの数字']]
      .concat(SETTING_ROWS.map(function (r) { return [r[1], r[2], r[3]]; }));
    sh.getRange(1, 1, rows.length, 3).setValues(rows);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#ede9fe');
    sh.setColumnWidth(1, 220);
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

function appSettings_() {
  const m = settingsMap_();
  const get = function (key) {
    const row = SETTING_ROWS.filter(function (r) { return r[0] === key; })[0];
    const v = m[row[1]];
    return v === undefined || v === '' ? row[2] : v;
  };
  const count = Number(get('count')), countLong = Number(get('countLong')), maxAt = Number(get('maxAt'));
  const sp = SPEED_NAMES.indexOf(String(get('maxSpeed')).replace(/\s+/g, ' ').trim());
  const s = {
    rate: Number(get('rate')) || 0.8,
    font: Number(get('font')) || 1,
    count: [10, 20, 30].indexOf(count) >= 0 ? count : 30,
    countLong: [5, 10, 15].indexOf(countLong) >= 0 ? countLong : 10,
    maxSpeed: sp >= 0 ? sp : 4,
    maxAt: [1, 2, 3].indexOf(maxAt) >= 0 ? maxAt : 1,
  };
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
      // 先生が変えた フラグは のこす。古い 端末の しんちょくでは 上書きしない
      if (!old.t || (neu.t || 0) >= old.t) {
        if (old.flagT && old.flagT > (neu.t || 0)) { neu.unlockAll = !!old.unlockAll; neu.hatten = !!old.hatten; neu.flagT = old.flagT; }
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
        return [t, name, String(r.stage), r.speed || '', r.problem, r.result, Number(r.miss) || 0, Number(r.hint) || 0,
          r.wrongKeys || '', r.wrongSounds || '', Number(r.keys) || 0, Number(r.secs) || 0, r.id].map(safe_);
      });
      if (rows.length) {
        // 「だんかい」と「もんだい」は 文字列の まま（1 や 2 が 数字に ならないように）
        log.getRange(last + 1, 3, rows.length, 1).setNumberFormat('@');
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
  return { count: 0, ok: 0, keys: 0, miss: 0, pkeys: 0, psecs: 0, last: '', stages: {}, keyMiss: {}, soundMiss: {}, days: {} };
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
    classKey: agg.classKey,
    classSound: agg.classSound,
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

// 全部開く（unlockAll）・はってん（hatten）
function setFlag(pin, name, key, value) {
  if (!checkPin_(pin)) return { ok: false };
  if (key !== 'unlockAll' && key !== 'hatten') return { ok: false };
  return updateProgress_(name, function (p) { p[key] = !!value; p.flagT = Date.now(); });
}

function addCoins(pin, name, delta) {
  if (!checkPin_(pin)) return { ok: false };
  return updateProgress_(name, function (p) { p.coins = Math.max(0, (Number(p.coins) || 0) + (Number(delta) || 0)); });
}

function saveSettings(pin, s) {
  if (!checkPin_(pin)) return { ok: false };
  SETTING_ROWS.forEach(function (r) {
    if (s[r[0]] === undefined) return;
    let v = s[r[0]];
    if (ONOFF[r[0]]) v = v ? ONOFF[r[0]][0] : ONOFF[r[0]][1];
    if (r[0] === 'maxSpeed') v = SPEED_NAMES[Number(v)] || SPEED_NAMES[4];
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
  return { ok: true, data: { app: 'pico', time: new Date().toISOString(), roster: rosterValues_().filter(function (r) { return String(r[0]).trim(); }).map(function (r) { return [String(r[0]).trim(), String(r[1] || '')]; }), settings: appSettings_() } };
}

function restoreBackup(pin, data) {
  if (!checkPin_(pin)) return { ok: false };
  if (!data || data.app !== 'pico') return { ok: false };
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
  const students = {}, classKey = {}, classSound = {};
  rows.forEach(function (r) {
    const name = String(r[1]).trim();
    if (!name) return;
    const st = String(r[2]), ok = r[5] === '○' ? 1 : 0, miss = Number(r[6]) || 0;
    const keys = Number(r[10]) || 0, secs = Number(r[11]) || 0;
    const s = students[name] || (students[name] = emptyStudent_());
    const day = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy/MM/dd') : String(r[0]).slice(0, 10);
    if (day > s.last) s.last = day;
    s.count++; s.ok += ok; s.keys += keys; s.miss += miss;
    const g = s.stages[st] || (s.stages[st] = [0, 0, 0, 0, 0, 0]);
    g[0]++; g[1] += ok; g[2] += keys; g[3] += miss;
    if (secs > 0) {
      s.pkeys += keys; s.psecs += secs; g[4] += keys; g[5] += secs;
      const d = s.days[day] || (s.days[day] = [0, 0]); d[0] += keys; d[1] += secs;
    }
    String(r[8] || '').split('・').forEach(function (x) {
      const k = x.split('>')[0];
      if (k) { s.keyMiss[k] = (s.keyMiss[k] || 0) + 1; classKey[k] = (classKey[k] || 0) + 1; }
    });
    String(r[9] || '').split('・').forEach(function (k) {
      if (k) { s.soundMiss[k] = (s.soundMiss[k] || 0) + 1; classSound[k] = (classSound[k] || 0) + 1; }
    });
  });
  return { students: students, classKey: classKey, classSound: classSound };
}

function top_(m, n) {
  return Object.keys(m || {}).sort(function (a, b) { return m[b] - m[a]; }).slice(0, n)
    .map(function (k) { return (/^[a-z]$/.test(k) ? k.toUpperCase() : k) + '（' + m[k] + '）'; }).join('・');
}

// 「まとめ」シート：子どもごと・だんかいごとの 結果
function writeSummary_(agg, names) {
  const sh = ss_().getSheetByName(SHEET.SUM);
  sh.clear();
  const header = ['なまえ', 'だんかい', 'うった かず', 'まちがえずに できた わりあい', '正しく うてた わりあい', 'はやさ（1分間の キー）', 'まちがえやすい キー', 'まちがえやすい おと'];
  const out = [header];
  names.forEach(function (n) {
    const s = agg.students[n];
    if (!s) return;
    const sp = function (k, sec) { return sec > 0 ? Math.round(k / sec * 60) : ''; };
    out.push([n, 'ぜんたい', s.count, s.count ? s.ok / s.count : '', s.keys + s.miss ? s.keys / (s.keys + s.miss) : '', sp(s.pkeys, s.psecs), top_(s.keyMiss, 5), top_(s.soundMiss, 5)]);
    Object.keys(s.stages).forEach(function (st) {
      const g = s.stages[st];
      out.push([n, st, g[0], g[0] ? g[1] / g[0] : '', g[2] + g[3] ? g[2] / (g[2] + g[3]) : '', sp(g[4], g[5]), '', '']);
    });
  });
  sh.getRange(1, 1, out.length, header.length).setValues(out);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#dbeafe');
  sh.setFrozenRows(1);
  if (out.length > 1) {
    const body = sh.getRange(2, 4, out.length - 1, 2);
    body.setNumberFormat('0%');
    body.setBackgrounds(body.getValues().map(function (r) {
      return r.map(function (v) { return v === '' ? null : v < 0.6 ? '#fecaca' : v < 0.8 ? '#fef08a' : '#bbf7d0'; });
    }));
  }
  sh.getRange(out.length + 2, 1).setValue('※ 赤：60%未満　黄：60〜79%　緑：80%以上。はやさは 1分間に おした キーの かずです。　更新：' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm'));
}
