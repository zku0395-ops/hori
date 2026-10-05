/**
 * ロボタンと カタカナ（サーバー側）
 *
 * スプレッドシートの「拡張機能 → Apps Script」に貼り付けて使います。
 * シート：名簿・きろく・まとめ・せってい（なければ自動で作ります）
 */

const SHEET = { ROSTER: '名簿', LOG: 'きろく', SUM: 'まとめ', SET: 'せってい' };
const LOG_HEADER = ['日時', 'なまえ', 'コース', 'だん', 'がくしゅう', 'もんだい', 'ねらいの もじ', 'しゅるい', 'けっか', 'かいすう'];
const KINDS = ['よむ', 'ことば', 'なぞる', 'かく'];
const DEFAULT_PIN = '1234';

// ---------------------------------------------------------------------
// 画面を表示する
// ---------------------------------------------------------------------
function doGet() {
  ensureSheets_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ロボタンと カタカナ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// スプレッドシートを開いたときにメニューを出す
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ロボタン')
    .addItem('シートを準備する', 'setup')
    .addItem('まとめを更新する', 'updateSummary')
    .addToUi();
}

function setup() {
  ensureSheets_();
  SpreadsheetApp.getActiveSpreadsheet().toast('シートの準備ができました。「名簿」シートに児童の名前を入れてください。');
}

function updateSummary() {
  const agg = aggregate_(readLog_());
  writeSummary_(agg, rosterNames_());
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
      .setFontWeight('bold').setBackground('#e0f2fe');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 420);
  }
  sh = ss.getSheetByName(SHEET.LOG);
  if (!sh) {
    sh = ss.insertSheet(SHEET.LOG);
    sh.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]).setFontWeight('bold').setBackground('#fef9c3');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('yyyy/mm/dd hh:mm');
  }
  sh = ss.getSheetByName(SHEET.SUM);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SUM);
    sh.getRange(1, 1).setValue('先生用画面を開くか、メニュー「ロボタン → まとめを更新する」で作られます。');
  }
  sh = ss.getSheetByName(SHEET.SET);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SET);
    sh.getRange('B:B').setNumberFormat('@'); // 暗証番号の先頭の0が消えないように文字列にする
    sh.getRange(1, 1, 4, 3).setValues([
      ['こうもく', 'あたい', 'せつめい'],
      ['暗証番号', DEFAULT_PIN, '先生用画面に入るための4けたの数字'],
      ['よみあげの はやさ', '0.8', '1がふつう。小さいほどゆっくり（0.5〜1.2）'],
      ['こえの たかさ', '1.3', '1がふつう。大きいほど高い声（0.5〜2）'],
    ]);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#ede9fe');
    sh.setColumnWidth(1, 160);
    sh.setColumnWidth(3, 360);
  }
}

function getSettings_() {
  const sh = ss_().getSheetByName(SHEET.SET);
  const values = sh.getDataRange().getDisplayValues();
  const map = {};
  values.forEach(function (r) { if (r[0]) map[String(r[0]).trim()] = String(r[1]).trim(); });
  return map;
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
  const s = getSettings_();
  return String(pin) === String(s['暗証番号'] || DEFAULT_PIN);
}

// ---------------------------------------------------------------------
// アプリから呼ばれる関数
// ---------------------------------------------------------------------
function getInitData() {
  ensureSheets_();
  const s = getSettings_();
  return {
    students: rosterNames_(),
    settings: { rate: Number(s['よみあげの はやさ']) || 0.8, pitch: Number(s['こえの たかさ']) || 1.3 },
  };
}

function getStudent(name) {
  const row = findRosterRow_(name);
  if (row < 0) throw new Error('名簿に「' + name + '」が見つかりません');
  return String(ss_().getSheetByName(SHEET.ROSTER).getRange(row, 2).getValue() || '');
}

function saveResult(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    ensureSheets_();
    const row = findRosterRow_(payload.name);
    if (row > 0 && payload.progress) {
      ss_().getSheetByName(SHEET.ROSTER).getRange(row, 2).setValue(payload.progress);
    }
    const recs = payload.records || [];
    if (recs.length) {
      const log = ss_().getSheetByName(SHEET.LOG);
      const t = new Date(payload.time || Date.now());
      const rows = recs.map(function (r) {
        return [t, payload.name, r.part, r.row, r.step, r.problem, r.target, r.kind, r.result, r.tries];
      });
      log.getRange(log.getLastRow() + 1, 1, rows.length, LOG_HEADER.length).setValues(rows);
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function getTeacherData(pin) {
  if (!checkPin_(pin)) return { ok: false };
  const roster = rosterValues_();
  const agg = aggregate_(readLog_());
  const names = roster.map(function (r) { return String(r[0]).trim(); }).filter(String);
  writeSummary_(agg, names);
  const empty = function () { return { count: 0, ok: 0, last: '', targets: {}, words: {} }; };
  return {
    ok: true,
    isDefaultPin: String(pin) === DEFAULT_PIN,
    students: roster.filter(function (r) { return String(r[0]).trim(); }).map(function (r) {
      const n = String(r[0]).trim();
      const s = agg.students[n] || empty();
      return { name: n, progress: String(r[1] || ''), count: s.count, ok: s.ok, last: s.last, targets: s.targets, words: s.words };
    }),
    classTargets: agg.classTargets,
  };
}

function setUnlockAll(pin, name, flag) {
  if (!checkPin_(pin)) return { ok: false };
  const row = findRosterRow_(name);
  if (row < 0) return { ok: false };
  const cell = ss_().getSheetByName(SHEET.ROSTER).getRange(row, 2);
  let p = {};
  try { p = JSON.parse(cell.getValue() || '{}'); } catch (e) { p = {}; }
  p.unlockAll = !!flag;
  const json = JSON.stringify(p);
  cell.setValue(json);
  return { ok: true, progress: json };
}

// ---------------------------------------------------------------------
// 集計
// ---------------------------------------------------------------------
function readLog_() {
  const sh = ss_().getSheetByName(SHEET.LOG);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, LOG_HEADER.length).getValues();
}

function addStat_(map, key, kind, ok) {
  const m = map[key] || (map[key] = {});
  const k = m[kind] || (m[kind] = [0, 0]);
  k[0]++;
  k[1] += ok;
}

function aggregate_(rows) {
  const tz = Session.getScriptTimeZone();
  const students = {};
  const classTargets = {};
  rows.forEach(function (r) {
    const name = String(r[1]).trim();
    if (!name) return;
    const problem = String(r[5]);
    const target = String(r[6]);
    const kind = String(r[7]);
    const ok = r[8] === '○' ? 1 : 0;
    const s = students[name] || (students[name] = { count: 0, ok: 0, last: '', targets: {}, words: {} });
    s.count++;
    s.ok += ok;
    const day = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy/MM/dd') : String(r[0]).slice(0, 10);
    if (day > s.last) s.last = day;
    if (target) {
      addStat_(s.targets, target, kind, ok);
      addStat_(classTargets, target, kind, ok);
    }
    if (problem.length > 1 && (kind === 'よむ' || kind === 'ことば')) {
      const w = s.words[problem] || (s.words[problem] = [0, 0]);
      w[0]++;
      w[1] += ok;
    }
  });
  return { students: students, classTargets: classTargets };
}

// 「まとめ」シート：児童ごと・文字ごとの1回目正答率（低い順）
function writeSummary_(agg, names) {
  const sh = ss_().getSheetByName(SHEET.SUM);
  sh.clear();
  const header = ['なまえ', 'もじ', 'ぜんたい', 'よむ', 'ことば', 'なぞる', 'かく', 'かいすう'];
  const out = [header];
  names.forEach(function (n) {
    const s = agg.students[n];
    if (!s) return;
    const rows = Object.keys(s.targets).map(function (ch) {
      const t = s.targets[ch];
      let tot = 0, ok = 0;
      const per = KINDS.map(function (k) {
        if (!t[k]) return '';
        tot += t[k][0];
        ok += t[k][1];
        return t[k][1] / t[k][0];
      });
      return [n, ch, ok / tot].concat(per).concat([tot]);
    });
    rows.sort(function (a, b) { return a[2] - b[2]; });
    rows.forEach(function (r) { out.push(r); });
  });
  sh.getRange(1, 1, out.length, header.length).setValues(out);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#e0f2fe');
  sh.setFrozenRows(1);
  if (out.length > 1) {
    const body = sh.getRange(2, 3, out.length - 1, 5);
    body.setNumberFormat('0%');
    const colors = body.getValues().map(function (r) {
      return r.map(function (v) {
        if (v === '') return null;
        return v < 0.6 ? '#fecaca' : v < 0.8 ? '#fef08a' : '#bbf7d0';
      });
    });
    body.setBackgrounds(colors);
  }
  sh.getRange(out.length + 2, 1).setValue('※ 1回目で正解した割合。赤：60%未満　黄：60〜79%　緑：80%以上　更新：' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm'));
}
