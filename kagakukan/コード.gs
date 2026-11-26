/**
 * キラボと かがくかん たんけん（サーバー側）
 *
 * スプレッドシートの「拡張機能 → Apps Script」に貼り付けて使います。
 * シート：名簿・きろく・まとめ・せってい（なければ自動で作ります）
 */

const SHEET = { ROSTER: '名簿', LOG: 'きろく', SUM: 'まとめ', SET: 'せってい' };
const LOG_HEADER = ['日時', 'なまえ', 'ステージ', 'もんだいID', 'もんだい', 'こたえ', 'けっか', 'まちがい', 'ヒント', 'えらんだ まちがい', 'びょう', 'ID'];
const DEFAULT_PIN = '1234';
// 「せってい」シートの項目（アプリの設定名 と 見出し）
const SETTING_ROWS = [
  ['date', 'けんがくの 日', '2026/12/10', '年/月/日 で 書きます（例：2026/12/10）。曜日は 自動で 出ます'],
  ['rate', 'よみあげの はやさ', '0.8', '1がふつう。小さいほどゆっくり（0.5〜1.2）'],
  ['font', 'もじの おおきさ', '1', '0.9（ちいさめ）・1（ふつう）・1.15（おおきめ）・1.3（とても おおきい）'],
  ['sound', 'こうかおん', 'ならす', 'ならす／ならさない'],
];
const ONOFF = { sound: ['ならす', 'ならさない'] };
// 先生が 変える フラグ
const FLAGS = ['unlockAll'];

// てんじの なまえ（まとめ・にんき ランキング 用。アプリの data/kagakukan.js と おなじ id）
const ITEM_NAME = {
  p1: 'サイエンスエッグ', p2: '1おく4000まんこの ほし', p3: 'かいせつの おはなし', p4: 'バーチャル つき りょこう',
  e1: 'でんきの せいしつを たしかめよう',
  c1: 'ムーンウォーカー', c2: 'レインボーシャドー', c3: 'ボールレース', c4: 'かいてん ブランコ', c5: 'じつぶつ げんそ しゅうきひょう',
  k1: 'かおりあて クイズ', k2: 'まぼろしの リンゴ', k3: 'はんしゃ しんけい', k4: 'カプラ ひろば',
  s1: 'ピアノの しくみ', s2: 'ギアの かべ', s3: 'リニアモーターカー', s4: 'エレクトリックタウン',
  n1: 'こんちゅうの ひょうほん', n2: 'とりの はくせい', n3: 'いきて いる さかな', n4: 'むさしのの ぞうきばやし',
  t1: 'かせき', t2: 'ひかる いし', t3: 'いんせき', t4: 'いしの ベンチ',
};
const ITEM_PLACE = { p: 'プラネタリウム', e: 'でんきの じっけん', c: 'チャレンジの部屋', k: 'からだの部屋', s: 'しくみの部屋', n: '自然の部屋', t: '地球の部屋' };
const REASON_NAME = { r1: 'おもしろそう だから', r2: 'さわって みたい から', r3: 'もっと しりたい から', r4: 'みた ことが ない から', r5: 'すきな もの だから', r6: 'やって みたい から' };
const STAGE_IDS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// ---------------------------------------------------------------------
// 画面を表示する
// ---------------------------------------------------------------------
function doGet() {
  ensureSheets_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('キラボと かがくかん たんけん')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// スプレッドシートを開いたときにメニューを出す
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('かがくかん たんけん')
    .addItem('シートを準備する', 'setup')
    .addItem('まとめを更新する', 'updateSummary')
    .addToUi();
}

function setup() {
  ensureSheets_();
  SpreadsheetApp.getActiveSpreadsheet().toast('シートの準備ができました。「名簿」シートに子どもの名前を入れてください。');
}

function updateSummary() {
  const roster = rosterValues_().filter(function (r) { return String(r[0]).trim(); });
  writeSummary_(aggregate_(readLog_()), roster);
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
    sh.getRange(1, 1).setValue('先生用画面を開くか、メニュー「かがくかん たんけん → まとめを更新する」で作られます。');
  }
  sh = ss.getSheetByName(SHEET.SET);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SET);
    sh.getRange('B:B').setNumberFormat('@'); // 暗証番号の先頭の0や 日にちが かわらないように文字列にする
    const rows = [['こうもく', 'あたい', 'せつめい'], ['暗証番号', DEFAULT_PIN, '先生用画面に入るための4けたの数字']]
      .concat(SETTING_ROWS.map(function (r) { return [r[1], r[2], r[3]]; }));
    sh.getRange(1, 1, rows.length, 3).setValues(rows);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#e0e7ff');
    sh.setColumnWidth(1, 220);
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
  const s = {
    date: String(get('date')),
    rate: Number(get('rate')) || 0.8,
    font: Number(get('font')) || 1,
  };
  Object.keys(ONOFF).forEach(function (k) { s[k] = get(k) === ONOFF[k][0]; });
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
  let p = {};
  try { p = JSON.parse(s || '{}') || {}; } catch (e) { p = {}; }
  p.cleared = p.cleared || {}; p.hearts = p.hearts || {}; p.best = p.best || [];
  return p;
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
        // 子どもの 端末は フラグを 変えないので、先生が 変えた ほうを いつも のこす
        if (old.flagT && old.flagT > (neu.flagT || 0)) {
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
        return [t, name, String(r.stage), String(r.qid || ''), r.q, r.answer, r.result, Number(r.miss) || 0, Number(r.hint) || 0,
          r.wrong || '', Number(r.secs) || 0, r.id].map(safe_);
      });
      if (rows.length) {
        log.getRange(last + 1, 3, rows.length, 1).setNumberFormat('@');
        log.getRange(last + 1, 1, rows.length, LOG_HEADER.length).setValues(rows);
      }
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function emptyStudent_() {
  return { count: 0, ok: 0, last: '', stages: {}, miss: {} };
}

function getTeacherData(pin) {
  if (!checkPin_(pin)) return { ok: false };
  const roster = rosterValues_().filter(function (r) { return String(r[0]).trim(); });
  const agg = aggregate_(readLog_());
  writeSummary_(agg, roster);
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
    classMiss: agg.classMiss,
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

function setFlag(pin, name, key, value) {
  if (!checkPin_(pin)) return { ok: false };
  if (FLAGS.indexOf(key) < 0) return { ok: false };
  return updateProgress_(name, function (p) { p[key] = !!value; p.flagT = Date.now(); });
}

function saveSettings(pin, s) {
  if (!checkPin_(pin)) return { ok: false };
  SETTING_ROWS.forEach(function (r) {
    if (s[r[0]] === undefined) return;
    let v = s[r[0]];
    if (ONOFF[r[0]]) v = v ? ONOFF[r[0]][0] : ONOFF[r[0]][1];
    if (r[0] === 'date' && !/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(String(v))) return;
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
  return { ok: true, data: { app: 'kagakukan', time: new Date().toISOString(), roster: rosterValues_().filter(function (r) { return String(r[0]).trim(); }).map(function (r) { return [String(r[0]).trim(), String(r[1] || '')]; }), settings: appSettings_() } };
}

function restoreBackup(pin, data) {
  if (!checkPin_(pin)) return { ok: false };
  if (!data || data.app !== 'kagakukan') return { ok: false };
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
  const students = {}, classMiss = {};
  rows.forEach(function (r) {
    const name = String(r[1]).trim();
    if (!name) return;
    const st = String(r[2]);
    if (st === '9') return; // ベスト3 は しんちょくから よむ
    const s = students[name] || (students[name] = emptyStudent_());
    const when = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy/MM/dd HH:mm') : String(r[0]);
    const day = when.slice(0, 10);
    if (day > s.last) s.last = day;
    const ok = r[6] === '○' ? 1 : 0;
    s.count++; s.ok += ok;
    const g = s.stages[st] || (s.stages[st] = [0, 0]);
    g[0]++; g[1] += ok;
    if (!ok) {
      const key = String(r[4]);
      s.miss[key] = (s.miss[key] || 0) + 1;
      const c = classMiss[key] || (classMiss[key] = { n: 0, w: {} });
      c.n++;
      String(r[9] || '').split('・').forEach(function (w) { if (w) c.w[w] = (c.w[w] || 0) + 1; });
    }
  });
  return { students: students, classMiss: classMiss };
}

function top_(m, n) {
  return Object.keys(m || {}).sort(function (a, b) { return m[b] - m[a]; }).slice(0, n)
    .map(function (k) { return k + '（' + m[k] + '）'; }).join('・');
}

// 「まとめ」シート：子どもごとの すすみ・つまずき・ベスト3、学級の にんき ランキング
function writeSummary_(agg, roster) {
  const sh = ss_().getSheetByName(SHEET.SUM);
  sh.clear();
  const header = ['なまえ', 'クリアした ステージ', 'クイズ（まちがえずに できた／ぜんぶ）', 'つまずいた もんだい', 'ベスト1', 'りゆう', 'ベスト2', 'りゆう', 'ベスト3', 'りゆう', 'みたい！'];
  const out = [header];
  const count = {};
  roster.forEach(function (r) {
    const n = String(r[0]).trim();
    const p = parseProgress_(String(r[1] || ''));
    const s = agg.students[n] || emptyStudent_();
    const best = [];
    for (let i = 0; i < 3; i++) {
      const b = p.best[i];
      best.push(b ? (ITEM_NAME[b.item] || b.item) : '', b ? (REASON_NAME[b.reason] || '') : '');
      if (b) { const c = count[b.item] || (count[b.item] = { best: [], heart: [] }); c.best.push(n); }
    }
    Object.keys(p.hearts).forEach(function (id) { const c = count[id] || (count[id] = { best: [], heart: [] }); c.heart.push(n); });
    out.push([n, STAGE_IDS.filter(function (id) { return p.cleared[id]; }).join(' '), s.count ? s.ok + '／' + s.count : '', top_(s.miss, 5)]
      .concat(best, [Object.keys(p.hearts).map(function (id) { return ITEM_NAME[id] || id; }).join('・')]));
  });
  const width = header.length;
  const pad = function (row) { while (row.length < width) row.push(''); return row; };
  out.push(pad([]));
  out.push(pad(['にんき ランキング（ベスト3＝3点、みたい！＝1点）']));
  out.push(pad(['てんじ', 'ばしょ', 'てん', 'ベスト3に えらんだ 子', 'みたい！ の 子']));
  Object.keys(count).map(function (id) { return [id, count[id].best.length * 3 + count[id].heart.length]; })
    .sort(function (a, b) { return b[1] - a[1]; })
    .forEach(function (x) {
      const id = x[0];
      out.push(pad([ITEM_NAME[id] || id, ITEM_PLACE[id.charAt(0)] || '', x[1], count[id].best.join('・'), count[id].heart.join('・')]));
    });
  sh.getRange(1, 1, out.length, width).setValues(out.map(function (r) { return r.map(safe_); }));
  sh.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#e0e7ff');
  sh.setFrozenRows(1);
}
