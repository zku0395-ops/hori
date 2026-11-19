/**
 * たしざん ひっさん クエスト（サーバー側）
 *
 * スプレッドシートの「拡張機能 → Apps Script」に貼り付けて使います。
 * シート：名簿・きろく・まとめ・せってい（なければ自動で作ります）
 */

const SHEET = { ROSTER: '名簿', LOG: 'きろく', SUM: 'まとめ', SET: 'せってい' };
const LOG_HEADER = ['日時', 'なまえ', 'ステージ', 'もんだい', 'こたえ', '一のくらいの まちがい', 'くりあがりの まちがい', '十のくらいの まちがい', '百のくらいの まちがい', 'ヒント', 'じどうヒント', 'ID'];
const DEFAULT_PIN = '1234';
const STAGE_NAMES = ['2けた＋1けた', '2けた＋2けた', 'なん十＋なん十', 'くりあがり①', 'くりあがり②', 'こたえが なん十', 'ボス：まとめ', 'こたえが 3けた①', 'こたえが 3けた②', 'こたえが 3けた③', 'だいボス：ぜんぶ'];
// 「せってい」シートの項目（アプリの設定名・見出し・はじめの値・説明）
const SETTING_ROWS = [
  ['rate', 'よみあげの はやさ', '0.85', '1がふつう。小さいほどゆっくり（0.7〜1.05）'],
  ['big', 'もじの おおきさ', 'ふつう', 'ふつう／おおきい'],
  ['allOpen', 'ステージ', 'じゅんばんに ひらく', 'じゅんばんに ひらく／ぜんぶ ひらく'],
];
// オン・オフの 設定の ことば（オンの ことば、オフの ことば）
const ONOFF = { big: ['おおきい', 'ふつう'], allOpen: ['ぜんぶ ひらく', 'じゅんばんに ひらく'] };

// ---------------------------------------------------------------------
// 画面を表示する
// ---------------------------------------------------------------------
function doGet() {
  ensureSheets_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('たしざん ひっさん クエスト')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// スプレッドシートを開いたときにメニューを出す
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('たしざん')
    .addItem('シートを準備する', 'setup')
    .addItem('まとめを更新する', 'updateSummary')
    .addToUi();
}

function setup() {
  ensureSheets_();
  SpreadsheetApp.getActiveSpreadsheet().toast('シートの準備ができました。「名簿」シートに子どもの名前を入れてください。');
}

function updateSummary() {
  writeSummary_(readLog_(), rosterNames_());
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
    sh.getRange(1, 1).setValue('先生用画面を開くか、メニュー「たしざん → まとめを更新する」で作られます。');
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
  const rate = Number(get('rate'));
  const s = { rate: rate >= 0.5 && rate <= 1.3 ? rate : 0.85 };
  Object.keys(ONOFF).forEach(function (k) { s[k] = String(get(k)).replace(/\s+/g, ' ').trim() === ONOFF[k][0]; });
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
      // 古い 端末の しんちょくでは 上書きしない
      if (!old.t || (neu.t || 0) >= old.t) cell.setValue(JSON.stringify(neu));
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
      const rows = recs.filter(function (r) { return r.id && !known[r.id]; }).map(function (r) {
        const a = Number(r.a) || 0, b = Number(r.b) || 0;
        return [new Date(Number(r.d) || payload.time || Date.now()), name, Number(r.st) || 0, a + '+' + b, a + b,
          Number(r.mo) || 0, Number(r.mc) || 0, Number(r.mt) || 0, Number(r.mh) || 0, Number(r.hint) || 0, Number(r.auto) || 0, String(r.id)].map(safe_);
      });
      if (rows.length) {
        // 「もんだい」は 文字列の まま（28+15 が 計算されないように）
        log.getRange(last + 1, 4, rows.length, 1).setNumberFormat('@');
        log.getRange(last + 1, 1, rows.length, LOG_HEADER.length).setValues(rows);
      }
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// 先生用画面：名簿・しんちょく・記録（新しいほうから 5000行まで）を わたす
function getTeacherData(pin) {
  if (!checkPin_(pin)) return { ok: false };
  const roster = rosterValues_().filter(function (r) { return String(r[0]).trim(); });
  const log = readLog_();
  writeSummary_(log, roster.map(function (r) { return String(r[0]).trim(); }));
  return {
    ok: true,
    isDefaultPin: String(pin) === DEFAULT_PIN,
    settings: appSettings_(),
    students: roster.map(function (r) { return { name: String(r[0]).trim(), progress: String(r[1] || '') }; }),
    rows: log.slice(-5000).map(function (r) {
      return [r[0] instanceof Date ? r[0].getTime() : 0, String(r[1]).trim(), Number(r[2]) || 0, String(r[3]), Number(r[4]) || 0,
        Number(r[5]) || 0, Number(r[6]) || 0, Number(r[7]) || 0, Number(r[8]) || 0, Number(r[9]) || 0, Number(r[10]) || 0];
    }),
  };
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

// 記録と しんちょくを 消す（name が空なら全員）
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

// 「まとめ」シート：子どもごと・ステージごとの 結果
function writeSummary_(rows, names) {
  const agg = {};
  rows.forEach(function (r) {
    const name = String(r[1]).trim(), st = Number(r[2]) || 0;
    const m = [Number(r[5]) || 0, Number(r[6]) || 0, Number(r[7]) || 0, Number(r[8]) || 0];
    [0, st].forEach(function (k) {
      const key = name + '\t' + k;
      const g = agg[key] || (agg[key] = { n: 0, ok: 0, m: [0, 0, 0, 0], hint: 0, auto: 0 });
      g.n++; if (m[0] + m[1] + m[2] + m[3] === 0) g.ok++;
      for (let i = 0; i < 4; i++) g.m[i] += m[i];
      g.hint += Number(r[9]) || 0; g.auto += Number(r[10]) || 0;
    });
  });
  const sh = ss_().getSheetByName(SHEET.SUM);
  sh.clear();
  const header = ['なまえ', 'ステージ', 'とけた もんだい', 'まちがえずに とけた わりあい', '一のくらいの まちがい', 'くりあがりの まちがい', '十のくらいの まちがい', '百のくらいの まちがい', 'ヒント', 'じどうヒント'];
  const out = [header];
  names.forEach(function (n) {
    for (let k = 0; k <= STAGE_NAMES.length; k++) {
      const g = agg[n + '\t' + k];
      if (!g) continue;
      out.push([safe_(n), k === 0 ? 'ぜんたい' : k + ' ' + STAGE_NAMES[k - 1], g.n, g.n ? g.ok / g.n : '', g.m[0], g.m[1], g.m[2], g.m[3], g.hint, g.auto]);
    }
  });
  sh.getRange(1, 1, out.length, header.length).setValues(out);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#dbeafe');
  sh.setFrozenRows(1);
  if (out.length > 1) {
    const body = sh.getRange(2, 4, out.length - 1, 1);
    body.setNumberFormat('0%');
    body.setBackgrounds(body.getValues().map(function (r) {
      return r.map(function (v) { return v === '' ? null : v < 0.6 ? '#fecaca' : v < 0.8 ? '#fef08a' : '#bbf7d0'; });
    }));
  }
  sh.getRange(out.length + 2, 1).setValue('※ 赤：60%未満　黄：60〜79%　緑：80%以上。まちがいの数は、その位で まちがえた 回数の 合計です。　更新：' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm'));
}
