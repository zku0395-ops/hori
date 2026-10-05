/**
 * トンガリはかせの ロボット けんきゅうじょ（サーバー側）
 *
 * スプレッドシートの「拡張機能 → Apps Script」に貼り付けて使います。
 * シート：名簿・きろく・まとめ・せってい（なければ自動で作ります）
 */

const SHEET = { ROSTER: '名簿', LOG: 'きろく', SUM: 'まとめ', SET: 'せってい' };
const LOG_HEADER = ['日時', 'なまえ', 'ステージ', 'ステップ', 'もんだい', 'かたち', 'けっか', 'かいすう', 'ヒント', 'まちがい'];
const DEFAULT_PIN = '1234';
// 「せってい」シートの 項目（画面の 設定と 対応）
const SETTING_ROWS = [
  ['暗証番号', DEFAULT_PIN, '先生用画面に入るための4けたの数字'],
  ['よみあげの はやさ', '0.85', '1がふつう。小さいほどゆっくり（0.5〜1.2）'],
  ['こえの たかさ', '1', '1がふつう。大きいほど高い声（0.5〜1.8）'],
  ['もじの おおきさ', 'ふつう', 'ふつう／おおきい／とても おおきい'],
  ['こうかおんの おおきさ', 'ふつう', 'ふつう／ちいさい／なし'],
  ['はってんを ひらく', 'いいえ', 'はい にすると、発展の問題（五角形・ちがう三角形を2つ）が開きます'],
];
const SIZES = ['ふつう', 'おおきい', 'とても おおきい'];
const VOLUMES = ['ふつう', 'ちいさい', 'なし'];

// ---------------------------------------------------------------------
// 画面を表示する
// ---------------------------------------------------------------------
function doGet() {
  ensureSheets_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('トンガリはかせの ロボット けんきゅうじょ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// スプレッドシートを開いたときにメニューを出す
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ロボット けんきゅうじょ')
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
    sh.getRange(1, 1).setValue('先生用画面を開くか、メニュー「ロボット けんきゅうじょ → まとめを更新する」で作られます。');
  }
  sh = ss.getSheetByName(SHEET.SET);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SET);
    sh.getRange('B:B').setNumberFormat('@'); // 暗証番号の先頭の0が消えないように文字列にする
    sh.getRange(1, 1, 1, 3).setValues([['こうもく', 'あたい', 'せつめい']]).setFontWeight('bold').setBackground('#ede9fe');
    sh.getRange(2, 1, SETTING_ROWS.length, 3).setValues(SETTING_ROWS);
    sh.setColumnWidth(1, 180);
    sh.setColumnWidth(3, 460);
  } else {
    // あとから ふえた 項目を 足す
    const have = sh.getDataRange().getDisplayValues().map(function (r) { return String(r[0]).trim(); });
    SETTING_ROWS.forEach(function (row) {
      if (have.indexOf(row[0]) < 0) sh.appendRow(row);
    });
  }
}

function getSettings_() {
  const values = ss_().getSheetByName(SHEET.SET).getDataRange().getDisplayValues();
  const map = {};
  values.forEach(function (r) { if (r[0]) map[String(r[0]).trim()] = String(r[1]).trim(); });
  return map;
}

function clientSettings_() {
  const s = getSettings_();
  return {
    rate: Number(s['よみあげの はやさ']) || 0.85,
    pitch: Number(s['こえの たかさ']) || 1,
    size: SIZES.indexOf(s['もじの おおきさ']) >= 0 ? s['もじの おおきさ'] : 'ふつう',
    vol: VOLUMES.indexOf(s['こうかおんの おおきさ']) >= 0 ? s['こうかおんの おおきさ'] : 'ふつう',
    adv: s['はってんを ひらく'] === 'はい',
  };
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

// 受け取った文字を、式として動かないようにしてから書く
function safe_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\r\n\t]/g, ' ').slice(0, max || 300);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

// ---------------------------------------------------------------------
// アプリから呼ばれる関数
// ---------------------------------------------------------------------
function getInitData() {
  ensureSheets_();
  return { students: rosterNames_(), settings: clientSettings_() };
}

function getStudent(name) {
  const row = findRosterRow_(String(name));
  if (row < 0) throw new Error('名簿に「' + name + '」が見つかりません');
  return String(ss_().getSheetByName(SHEET.ROSTER).getRange(row, 2).getValue() || '');
}

function saveResult(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    ensureSheets_();
    const name = String(payload && payload.name || '').trim();
    const row = findRosterRow_(name);
    if (row < 0) return { ok: false, reason: 'not-in-roster' };
    // 送りなおしで 同じ記録を 二重に 書かない
    const cache = CacheService.getScriptCache();
    const key = payload.id ? 'rid:' + String(payload.id).slice(0, 60) : '';
    if (key && cache.get(key)) return { ok: true, dup: true };
    if (payload.progress) {
      let prog = String(payload.progress);
      try { JSON.parse(prog); } catch (e) { prog = ''; }
      if (prog && prog.length < 45000) ss_().getSheetByName(SHEET.ROSTER).getRange(row, 2).setValue(prog);
    }
    const recs = (payload.records || []).slice(0, 50);
    if (recs.length) {
      const log = ss_().getSheetByName(SHEET.LOG);
      const t = new Date(Number(payload.time) || Date.now());
      const rows = recs.map(function (r) {
        return [t, safe_(name, 40), safe_(r.stage, 10), safe_(r.step, 10), safe_(r.problem, 80), safe_(r.shape, 80),
          r.result === '○' ? '○' : '△', Number(r.tries) || 1, Number(r.hint) || 0, safe_(r.miss, 500)];
      });
      log.getRange(log.getLastRow() + 1, 1, rows.length, LOG_HEADER.length).setValues(rows);
    }
    if (key) cache.put(key, '1', 21600);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function getTeacherData(pin) {
  if (!checkPin_(pin)) return { ok: false };
  const roster = rosterValues_();
  const rows = readLog_();
  writeSummary_(aggregate_(rows), roster.map(function (r) { return String(r[0]).trim(); }).filter(String));
  const tz = Session.getScriptTimeZone();
  return {
    ok: true,
    isDefaultPin: String(pin) === DEFAULT_PIN,
    settings: clientSettings_(),
    students: roster.filter(function (r) { return String(r[0]).trim(); }).map(function (r) {
      return { name: String(r[0]).trim(), progress: String(r[1] || '') };
    }),
    log: rows.map(function (r) {
      const d = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy/MM/dd HH:mm') : String(r[0]);
      return [d].concat(r.slice(1).map(function (v) { return String(v); }));
    }),
  };
}

function setUnlockAll(pin, name, flag) {
  if (!checkPin_(pin)) return { ok: false };
  const row = findRosterRow_(String(name));
  if (row < 0) return { ok: false };
  const cell = ss_().getSheetByName(SHEET.ROSTER).getRange(row, 2);
  let p = {};
  try { p = JSON.parse(cell.getValue() || '{}'); } catch (e) { p = {}; }
  p.unlockAll = !!flag;
  const json = JSON.stringify(p);
  cell.setValue(json);
  return { ok: true, progress: json };
}

// 先生用画面の「設定」を「せってい」シートに書く
function saveSettings(pin, s) {
  if (!checkPin_(pin)) return { ok: false };
  ensureSheets_();
  const sh = ss_().getSheetByName(SHEET.SET);
  const values = sh.getDataRange().getDisplayValues();
  const clamp = function (v, lo, hi, def) { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def; };
  const put = {
    'よみあげの はやさ': String(clamp(s.rate, 0.5, 1.2, 0.85)),
    'こえの たかさ': String(clamp(s.pitch, 0.5, 1.8, 1)),
    'もじの おおきさ': SIZES.indexOf(s.size) >= 0 ? s.size : 'ふつう',
    'こうかおんの おおきさ': VOLUMES.indexOf(s.vol) >= 0 ? s.vol : 'ふつう',
    'はってんを ひらく': s.adv ? 'はい' : 'いいえ',
  };
  values.forEach(function (r, i) {
    const k = String(r[0]).trim();
    if (Object.prototype.hasOwnProperty.call(put, k)) sh.getRange(i + 1, 2).setValue(put[k]);
  });
  return { ok: true, settings: clientSettings_() };
}

// 1人分の 記録と 進み具合を 消す
function clearStudent(pin, name) {
  if (!checkPin_(pin)) return { ok: false };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    name = String(name).trim();
    const row = findRosterRow_(name);
    if (row < 0) return { ok: false };
    ss_().getSheetByName(SHEET.ROSTER).getRange(row, 2).setValue('');
    const log = ss_().getSheetByName(SHEET.LOG);
    const rows = readLog_();
    const keep = rows.filter(function (r) { return String(r[1]).trim() !== name; });
    if (keep.length !== rows.length) {
      log.getRange(2, 1, rows.length, LOG_HEADER.length).clearContent();
      if (keep.length) log.getRange(2, 1, keep.length, LOG_HEADER.length).setValues(keep);
    }
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
  return sh.getRange(2, 1, last - 1, LOG_HEADER.length).getValues();
}

function aggregate_(rows) {
  const students = {};
  rows.forEach(function (r) {
    const name = String(r[1]).trim();
    if (!name) return;
    const shape = String(r[5]);
    const ok = r[6] === '○' ? 1 : 0;
    const s = students[name] || (students[name] = { shapes: {} });
    if (!shape) return;
    const x = s.shapes[shape] || (s.shapes[shape] = { n: 0, ok: 0, miss: {} });
    x.n++;
    x.ok += ok;
    String(r[9] || '').split('、').forEach(function (m) {
      m = m.trim();
      if (m) x.miss[m] = (x.miss[m] || 0) + 1;
    });
  });
  return { students: students };
}

// 「まとめ」シート：子どもごと・形（問題）ごとの 1回目正答率（低い順）と 多いまちがい
function writeSummary_(agg, names) {
  const sh = ss_().getSheetByName(SHEET.SUM);
  sh.clear();
  const header = ['なまえ', 'かたち・もんだい', 'かいすう', '1回目で正解', '1回目正答率', 'おもな まちがい'];
  const out = [header];
  names.forEach(function (n) {
    const s = agg.students[n];
    if (!s) return;
    const rows = Object.keys(s.shapes).map(function (k) {
      const x = s.shapes[k];
      const miss = Object.keys(x.miss).sort(function (a, b) { return x.miss[b] - x.miss[a]; }).slice(0, 3)
        .map(function (m) { return m + '（' + x.miss[m] + '）'; }).join('、');
      return [n, k, x.n, x.ok, x.ok / x.n, miss];
    });
    rows.sort(function (a, b) { return a[4] - b[4]; });
    rows.forEach(function (r) { out.push(r); });
  });
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
  sh.getRange(out.length + 2, 1).setValue('※ 1回目で正解した割合。赤：60%未満　黄：60〜79%　緑：80%以上　更新：' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm'));
}
