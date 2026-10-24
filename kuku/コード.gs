/**
 * 忍者九九修行（にんじゃ くく しゅぎょう）（サーバー側）
 *
 * スプレッドシートの「拡張機能 → Apps Script」に貼り付けて使います。
 * シート：名簿・きろく・まとめ・せってい（なければ自動で作ります）
 */

const SHEET = { ROSTER: '名簿', LOG: 'きろく', SUM: 'まとめ', SET: 'せってい' };
const LOG_HEADER = ['日時', 'なまえ', 'ステージ', 'しゅぎょう', 'もんだい', 'こたえ', 'けっか', 'まちがい', 'ヒント', 'まちがいの しゅるい', 'えらんだ こたえ', 'くく', 'こたえかた', 'びょう', 'ID'];
const DEFAULT_PIN = '1234';
// 「せってい」シートの項目（アプリの設定名 と 見出し）
const SETTING_ROWS = [
  ['rate', 'よみあげの はやさ', '0.8', '1がふつう。小さいほどゆっくり（0.5〜1.2）'],
  ['font', 'もじの おおきさ', '1', '0.9（ちいさめ）・1（ふつう）・1.15（おおきめ）・1.3（とても おおきい）'],
  ['count', '1回の もんだいの かず', '5', '3・5・9（しのびの いりぐち・ふくしゅう・はってん。お城の 階は いつも 9もん）'],
  ['mode', 'こたえかた', 'じどう', 'じどう（はじめは えらぶ、なれたら すうじ）／えらぶ／すうじ'],
  ['tonae', 'となえかたの ひょうじ', 'だす', 'だす／かくす（②じゅんばん・③ばらばら。①となえる では いつも だす）'],
  ['pass', 'しけんの ごうかく', '7', '7（9もん中 7もん まちがえずに）・9（ぜんぶ まちがえずに）・0（さいごまで こたえたら）'],
  ['sound', 'こうかおん', 'ならす', 'ならす／ならさない'],
];
// オン・オフの 設定の ことば（オンの ことば、オフの ことば）
const ONOFF = { sound: ['ならす', 'ならさない'], tonae: ['だす', 'かくす'] };
const MODES = { 'じどう': 'auto', 'えらぶ': 'choice', 'すうじ': 'key' };
const DANS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

// ---------------------------------------------------------------------
// 画面を表示する
// ---------------------------------------------------------------------
function doGet() {
  ensureSheets_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('忍者九九修行')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// スプレッドシートを開いたときにメニューを出す
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('九九修行')
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
      .setFontWeight('bold').setBackground('#c7d2fe');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 420);
  }
  sh = ss.getSheetByName(SHEET.LOG);
  if (!sh) {
    sh = ss.insertSheet(SHEET.LOG);
    sh.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]).setFontWeight('bold').setBackground('#e0e7ff');
    sh.setFrozenRows(1);
  }
  sh = ss.getSheetByName(SHEET.SUM);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SUM);
    sh.getRange(1, 1).setValue('先生用画面を開くか、メニュー「九九修行 → まとめを更新する」で作られます。');
  }
  sh = ss.getSheetByName(SHEET.SET);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SET);
    sh.getRange('B:B').setNumberFormat('@'); // 暗証番号の先頭の0が消えないように文字列にする
    const rows = [['こうもく', 'あたい', 'せつめい'], ['暗証番号', DEFAULT_PIN, '先生用画面に入るための4けたの数字']]
      .concat(SETTING_ROWS.map(function (r) { return [r[1], r[2], r[3]]; }));
    sh.getRange(1, 1, rows.length, 3).setValues(rows);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#ede9fe');
    sh.setColumnWidth(1, 260);
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
  const count = Number(get('count')), pass = Number(get('pass'));
  const s = {
    rate: Number(get('rate')) || 0.8,
    font: Number(get('font')) || 1,
    count: [3, 5, 9].indexOf(count) >= 0 ? count : 5,
    mode: MODES[get('mode')] || 'auto',
    pass: [0, 7, 9].indexOf(pass) >= 0 ? pass : 7,
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

// 先生が 変える フラグ（全部開く・はってん・いりぐちを とばす）
const FLAGS = ['unlockAll', 'hatten', 'skipIri'];

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
        if (old.flagT && old.flagT > (neu.t || 0)) {
          FLAGS.forEach(function (k) { neu[k] = !!old[k]; });
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
        return [t, name, String(r.stage), r.step, r.problem, String(r.answer), r.result, Number(r.miss) || 0, Number(r.hint) || 0,
          r.types || '', r.picks || '', String(r.kuku || ''), r.how || '', Number(r.secs) || 0, r.id].map(safe_);
      });
      if (rows.length) {
        // 「ステージ」「こたえ」は 文字列の まま（5-1 が 日付に ならないように）
        log.getRange(last + 1, 3, rows.length, 1).setNumberFormat('@');
        log.getRange(last + 1, 6, rows.length, 1).setNumberFormat('@');
        log.getRange(last + 1, 1, rows.length, LOG_HEADER.length).setValues(rows);
      }
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function emptyStudent_() {
  return { count: 0, ok: 0, secs: 0, last: '', stages: {}, types: {}, kuku: {}, missProb: {} };
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
    classTypes: agg.classTypes,
    classKuku: agg.classKuku,
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

// 全部開く（unlockAll）・はってん（hatten）・いりぐちを とばす（skipIri）
function setFlag(pin, name, key, value) {
  if (!checkPin_(pin)) return { ok: false };
  if (FLAGS.indexOf(key) < 0) return { ok: false };
  return updateProgress_(name, function (p) { p[key] = !!value; p.flagT = Date.now(); });
}

// こばん（ごほうび）を 足す・引く
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
    if (r[0] === 'mode') v = Object.keys(MODES).filter(function (k) { return MODES[k] === v; })[0] || 'じどう';
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
  return { ok: true, data: { app: 'kuku', time: new Date().toISOString(), roster: rosterValues_().filter(function (r) { return String(r[0]).trim(); }).map(function (r) { return [String(r[0]).trim(), String(r[1] || '')]; }), settings: appSettings_() } };
}

function restoreBackup(pin, data) {
  if (!checkPin_(pin)) return { ok: false };
  if (!data || data.app !== 'kuku') return { ok: false };
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

// くく：「5×3」ごとに [もんだい, まちがえずに, まちがい, ヒント]
function addKuku_(m, k, ok, miss, hint) {
  const a = m[k] || (m[k] = [0, 0, 0, 0]);
  a[0]++; a[1] += ok; a[2] += miss; a[3] += hint ? 1 : 0;
}

function aggregate_(rows) {
  const tz = Session.getScriptTimeZone();
  const students = {}, classTypes = {}, classKuku = {};
  rows.forEach(function (r) {
    const name = String(r[1]).trim();
    if (!name) return;
    const st = String(r[2]), ok = r[6] === '○' ? 1 : 0;
    const s = students[name] || (students[name] = emptyStudent_());
    const day = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy/MM/dd') : String(r[0]).slice(0, 10);
    if (day > s.last) s.last = day;
    s.count++; s.ok += ok; s.secs += Number(r[13]) || 0;
    const g = s.stages[st] || (s.stages[st] = [0, 0]);
    g[0]++; g[1] += ok;
    String(r[9] || '').split('・').forEach(function (k) {
      if (k) { s.types[k] = (s.types[k] || 0) + 1; classTypes[k] = (classTypes[k] || 0) + 1; }
    });
    const kk = String(r[11] || '');
    if (kk) {
      addKuku_(s.kuku, kk, ok, Number(r[7]) || 0, Number(r[8]) || 0);
      addKuku_(classKuku, kk, ok, Number(r[7]) || 0, Number(r[8]) || 0);
    }
    if (!ok && Number(r[7]) > 0) { const k = st + '：' + r[4]; s.missProb[k] = (s.missProb[k] || 0) + 1; }
  });
  return { students: students, classTypes: classTypes, classKuku: classKuku };
}

function top_(m, n) {
  return Object.keys(m || {}).sort(function (a, b) { return m[b] - m[a]; }).slice(0, n)
    .map(function (k) { return k + '（' + m[k] + '）'; }).join('・');
}

// にがてな くく（2回いじょう といて、まちがえずに できた わりあいが 60%未満）
function weakKuku_(kuku) {
  return Object.keys(kuku || {}).filter(function (k) { return kuku[k][0] >= 2 && kuku[k][1] / kuku[k][0] < 0.6; })
    .sort(function (a, b) { return (kuku[a][1] / kuku[a][0]) - (kuku[b][1] / kuku[b][0]); }).slice(0, 8).join('・');
}

// 「まとめ」シート：子どもごと・ステージごとの 結果
function writeSummary_(agg, names) {
  const sh = ss_().getSheetByName(SHEET.SUM);
  sh.clear();
  const header = ['なまえ', 'ステージ', 'もんだい', 'まちがえずに できた わりあい', 'まちがいの しゅるい', 'だんごと（まちがえずに／もんだい）', 'にがてな くく', 'まちがえた もんだい'];
  const out = [header];
  names.forEach(function (n) {
    const s = agg.students[n];
    if (!s) return;
    const dan = DANS.map(function (d) {
      let all = 0, ok = 0;
      Object.keys(s.kuku).forEach(function (k) { if (k.split('×')[0] === d) { all += s.kuku[k][0]; ok += s.kuku[k][1]; } });
      return all ? d + 'の だん ' + ok + '/' + all : '';
    }).filter(String).join('　');
    out.push([n, 'ぜんたい', s.count, s.count ? s.ok / s.count : '', top_(s.types, 5), dan, weakKuku_(s.kuku), top_(s.missProb, 5)]);
    Object.keys(s.stages).forEach(function (st) {
      const g = s.stages[st];
      out.push([n, st, g[0], g[0] ? g[1] / g[0] : '', '', '', '', '']);
    });
  });
  // 「ステージ」の 5-1 などが 日付に ならないように 文字列に する
  sh.getRange(1, 2, out.length, 1).setNumberFormat('@');
  sh.getRange(1, 1, out.length, header.length).setValues(out);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#c7d2fe');
  sh.setFrozenRows(1);
  if (out.length > 1) {
    const body = sh.getRange(2, 4, out.length - 1, 1);
    body.setNumberFormat('0%');
    body.setBackgrounds(body.getValues().map(function (r) {
      return r.map(function (v) { return v === '' ? null : v < 0.6 ? '#fecaca' : v < 0.8 ? '#fef08a' : '#bbf7d0'; });
    }));
  }
  sh.getRange(out.length + 2, 1).setValue('※ 赤：60%未満　黄：60〜79%　緑：80%以上。ステージ：0-1〜0-3 しのびの いりぐち、5-0〜1-4 お城の 階（だん-しゅぎょう。0であう・1となえる・2じゅんばん・3ばらばら・4しけん）、T てんしゅかく、R ふくしゅう、H1・H2 はってん。にがてな くく：2回いじょう といて、まちがえずに できた わりあいが 60%未満。　更新：' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm'));
}
