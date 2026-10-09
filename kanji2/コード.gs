/**
 * ポンタせんせいの かんじ デパート（サーバー側）
 *
 * スプレッドシートの「拡張機能 → Apps Script」に貼り付けて使います。
 * シート：名簿・きろく・まとめ・せってい（なければ自動で作ります）
 */

const SHEET = { ROSTER: '名簿', LOG: 'きろく', SUM: 'まとめ', SET: 'せってい' };
const LOG_HEADER = ['日時', 'なまえ', 'ステージ', 'だんかい', 'かんじ', 'もんだい', 'しゅるい', 'みほん', 'けっか', 'かいすう', 'まちがえた こたえ', 'ID'];
const KINDS = ['よみを えらぶ', 'かんじを えらぶ', 'よみを かく', 'かんじを かく', 'おくりがな'];
const KIND_NUM = { 'よみを えらぶ': '①', 'かんじを えらぶ': '③', 'よみを かく': '②', 'かんじを かく': '④', 'おくりがな': '🖋' };
const DEFAULT_PIN = '1234';
// 「せってい」シートの項目（アプリの設定名 と 見出し）
const SETTING_ROWS = [
  ['rate', 'よみあげの はやさ', '0.8', '1がふつう。小さいほどゆっくり（0.5〜1.2）'],
  ['font', 'もじの おおきさ', '1', '0.9（ちいさめ）・1（ふつう）・1.15（おおきめ）・1.3（とても おおきい）'],
  ['sound', 'こうかおん', 'ならす', 'ならす／ならさない（ファンファーレなど）'],
  ['judge', 'かく はんていの きびしさ', 'やさしい', 'やさしい／ふつう'],
  ['flow', 'かく れんしゅうの すすめかた', '3', '3（なぞる→うすい→みほんなし）・2（うすい→みほんなし）・1（みほんなし だけ）'],
  ['parts', 'ぶひんの いろわけ', 'つかう', 'つかう／つかわない（10画いじょうの字を、部品ごとに色分けして見せる）'],
];

// ---------------------------------------------------------------------
// 画面を表示する
// ---------------------------------------------------------------------
function doGet() {
  ensureSheets_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ポンタせんせいの かんじ デパート')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// スプレッドシートを開いたときにメニューを出す
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ポンタ')
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
      .setFontWeight('bold').setBackground('#fef3c7');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 420);
  }
  sh = ss.getSheetByName(SHEET.LOG);
  if (!sh) {
    sh = ss.insertSheet(SHEET.LOG);
    sh.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]).setFontWeight('bold').setBackground('#fef9c3');
    sh.setFrozenRows(1);
  }
  sh = ss.getSheetByName(SHEET.SUM);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SUM);
    sh.getRange(1, 1).setValue('先生用画面を開くか、メニュー「ポンタ → まとめを更新する」で作られます。');
  }
  sh = ss.getSheetByName(SHEET.SET);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SET);
    sh.getRange('B:B').setNumberFormat('@'); // 暗証番号の先頭の0が消えないように文字列にする
    const rows = [['こうもく', 'あたい', 'せつめい'], ['暗証番号', DEFAULT_PIN, '先生用画面に入るための4けたの数字']]
      .concat(SETTING_ROWS.map(function (r) { return [r[1], r[2], r[3]]; }));
    sh.getRange(1, 1, rows.length, 3).setValues(rows);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#ede9fe');
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(3, 460);
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
  return {
    rate: Number(get('rate')) || 0.8,
    font: Number(get('font')) || 1,
    sound: get('sound') !== 'ならさない',
    judge: get('judge') === 'ふつう' ? 'ふつう' : 'やさしい',
    flow: ['1', '2', '3'].indexOf(String(get('flow'))) >= 0 ? String(get('flow')) : '3',
    parts: get('parts') !== 'つかわない',
  };
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
        return [t, name, r.stage, r.step, r.k, r.problem, r.kind, r.mihon, r.result, Number(r.tries) || 1, r.wrong, r.id].map(safe_);
      });
      if (rows.length) log.getRange(last + 1, 1, rows.length, LOG_HEADER.length).setValues(rows);
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function getTeacherData(pin) {
  if (!checkPin_(pin)) return { ok: false };
  const roster = rosterValues_().filter(function (r) { return String(r[0]).trim(); });
  const agg = aggregate_(readLog_());
  writeSummary_(agg, roster.map(function (r) { return String(r[0]).trim(); }));
  const empty = function () { return { count: 0, ok: 0, last: '', kanji: {}, wrong: {} }; };
  return {
    ok: true,
    isDefaultPin: String(pin) === DEFAULT_PIN,
    settings: appSettings_(),
    students: roster.map(function (r) {
      const n = String(r[0]).trim();
      const s = agg.students[n] || empty();
      return { name: n, progress: String(r[1] || ''), count: s.count, ok: s.ok, last: s.last, kanji: s.kanji, wrong: s.wrong };
    }),
    classKanji: agg.classKanji,
    classWrong: agg.classWrong,
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
    if (r[0] === 'sound') v = v ? 'ならす' : 'ならさない';
    if (r[0] === 'parts') v = v ? 'つかう' : 'つかわない';
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
  return { ok: true, data: { app: 'kanji2', time: new Date().toISOString(), roster: rosterValues_().filter(function (r) { return String(r[0]).trim(); }).map(function (r) { return [String(r[0]).trim(), String(r[1] || '')]; }), settings: appSettings_() } };
}

function restoreBackup(pin, data) {
  if (!checkPin_(pin)) return { ok: false };
  if (!data || data.app !== 'kanji2') return { ok: false };
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
// 集計
// ---------------------------------------------------------------------
function readLog_() {
  const sh = ss_().getSheetByName(SHEET.LOG);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, LOG_HEADER.length).getValues().filter(function (r) { return String(r[1]).trim(); });
}

function addStat_(map, key, kind, ok) {
  const m = map[key] || (map[key] = {});
  const k = m[kind] || (m[kind] = [0, 0]);
  k[0]++;
  k[1] += ok;
}

function aggregate_(rows) {
  const tz = Session.getScriptTimeZone();
  const students = {}, classKanji = {}, classWrong = {};
  rows.forEach(function (r) {
    const name = String(r[1]).trim();
    if (!name) return;
    const k = String(r[4]), kind = String(r[6]), ok = r[8] === '○' ? 1 : 0, wrong = String(r[10] || '');
    const s = students[name] || (students[name] = { count: 0, ok: 0, last: '', kanji: {}, wrong: {} });
    s.count++;
    s.ok += ok;
    const day = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy/MM/dd') : String(r[0]).slice(0, 10);
    if (day > s.last) s.last = day;
    if (k) {
      addStat_(s.kanji, k, kind, ok);
      addStat_(classKanji, k, kind, ok);
      if (wrong) wrong.split('・').forEach(function (w) {
        if (!w) return;
        const a = s.wrong[k] || (s.wrong[k] = {}); a[w] = (a[w] || 0) + 1;
        const b = classWrong[k] || (classWrong[k] = {}); b[w] = (b[w] || 0) + 1;
      });
    }
  });
  return { students: students, classKanji: classKanji, classWrong: classWrong };
}

// 「まとめ」シート：子どもごと・漢字ごとの 1回目正答率（低い順）
function writeSummary_(agg, names) {
  const sh = ss_().getSheetByName(SHEET.SUM);
  sh.clear();
  const header = ['なまえ', 'かんじ', 'ぜんたい'].concat(KINDS.map(function (k) { return KIND_NUM[k] + k; })).concat(['かいすう', 'よく えらんだ まちがい']);
  const out = [header];
  names.forEach(function (n) {
    const s = agg.students[n];
    if (!s) return;
    const rows = Object.keys(s.kanji).map(function (k) {
      const t = s.kanji[k];
      let tot = 0, ok = 0;
      const per = KINDS.map(function (kd) {
        if (!t[kd]) return '';
        tot += t[kd][0];
        ok += t[kd][1];
        return t[kd][1] / t[kd][0];
      });
      const w = s.wrong[k] ? Object.keys(s.wrong[k]).sort(function (a, b) { return s.wrong[k][b] - s.wrong[k][a]; }).slice(0, 3).join('・') : '';
      return [n, k, tot ? ok / tot : ''].concat(per).concat([tot, w]);
    });
    rows.sort(function (a, b) { return (a[2] === '' ? 2 : a[2]) - (b[2] === '' ? 2 : b[2]); });
    rows.forEach(function (r) { out.push(r); });
  });
  sh.getRange(1, 1, out.length, header.length).setValues(out);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#fef3c7');
  sh.setFrozenRows(1);
  if (out.length > 1) {
    const body = sh.getRange(2, 3, out.length - 1, KINDS.length + 1);
    body.setNumberFormat('0%');
    const colors = body.getValues().map(function (r) {
      return r.map(function (v) {
        if (v === '') return null;
        return v < 0.6 ? '#fecaca' : v < 0.8 ? '#fef08a' : '#bbf7d0';
      });
    });
    body.setBackgrounds(colors);
  }
  sh.getRange(out.length + 2, 1).setValue('※ 1回目で、ヒントを使わずに正解した割合。赤：60%未満　黄：60〜79%　緑：80%以上　更新：' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm'));
}
