/**
 * チョークんの マイこくばん（サーバー側）
 *
 * スプレッドシートの「拡張機能 → Apps Script」に貼り付けて使います。
 * シート：名簿・ぶんしょう・きろく・まとめ・せってい（なければ自動で作ります）
 */

const SHEET = { ROSTER: '名簿', TEXT: 'ぶんしょう', LOG: 'きろく', SUM: 'まとめ', SET: 'せってい' };
const TEXT_HEADER = ['ID', 'だいめい', 'しゅるい', 'つかう', 'ほんぶん', 'とい1', 'とい2', 'とい3', 'とい4', 'とい5', 'こたえ（さわらないでください）'];
const ANS_COL = TEXT_HEADER.length; // 先生が 決めた こたえ・きもちの ことば（先生用画面で 入れます）
const LOG_HEADER = ['日時', 'なまえ', 'ぶんしょう', 'とい', 'したこと', 'いろ', 'ことば', 'ID'];
// 「まとめ」は 子ども×文章で 1行。右の はしの「データ」に マイこくばんの 中身が 入ります
const SUM_HEADER = ['なまえ', 'ぶんしょうID', 'だいめい', 'こうしん', 'じょうたい', 'せんを ひいた ことば', 'こくばんに はった ことば', 'じぶんで かいた ことば', 'スタンプ・やじるし・わく', 'データ（さわらないでください）'];
const DATA_COL = SUM_HEADER.length; // データの 列（ここから 右へ つづく）
const CHUNK = 40000;                // 1つの セルに 入れる 文字数
const DEFAULT_PIN = '1234';
const SETTING_ROWS = [
  ['rate', 'よみあげの はやさ', '0.8', '1がふつう。小さいほどゆっくり（0.5〜1.2）'],
  ['font', 'もじの おおきさ', '1', '0.85（ちいさめ）・1（ふつう）・1.2（おおきめ）・1.4（とても おおきい）'],
  ['dir', 'ぶんしょうの むき', 'たて', 'たて／よこ'],
  ['sound', 'こうかおん', 'ならす', 'ならす／ならさない'],
];
const ONOFF = { dir: ['たて', 'よこ'], sound: ['ならす', 'ならさない'] };

// はじめから 入れておく れんしゅう用の 文章（オリジナル）
const SAMPLE_TEXTS = [
  ['s1', 'くもの ぼうし', 'ものがたり', '○',
    'あさ、こぐまの ポルは、のはらで 白（しろ）い ぼうしを ひろいました。\n「だれの ぼうしかな。」\n\nポルは、りすに ききました。\n「ううん、ぼくのじゃ ないよ。」\nポルは、こまって しまいました。\n\nその とき、風（かぜ）が ふいて、ぼうしは ふわりと 空（そら）へ とんで いきました。\n小（ちい）さな 雲（くも）が、ぼうしを かぶって わらって います。\n「ありがとう。」\nポルは、うれしく なって、大（おお）きく 手（て）を ふりました。',
    'とうじょうじんぶつに、あかい せんを ひこう。', 'ポルの きもちが わかる ぶんを、こくばんに はろう。', 'ぼうしは、だれの ものだったかな。じぶんの ことばで かこう。', '', '',
    '{"th":"-1907463431","n":40,"q":[{"u":[],"k":"jinbutsu","hint":true,"check":true,"c":"r"},{"u":[15,16,17,34,35,36,37,38,39],"k":"","hint":true,"check":true,"c":""},{"u":[],"k":"","hint":true,"check":true,"c":""}],"cats":{"hatsugen":[7,8,12,13,14,33],"jinbutsu":[2,10,28],"toki":[0,18,19],"basho":[3,24],"kimochi":[16,17,35,36],"yosu":[37,38,39],"ono":[23]},"fm":{"yosu:37":["うれしい","ありがとうの きもち"],"kimochi:16":["こまった"],"kimochi:35":["うれしい"]},"custom":[],"heads":["toki","basho","jinbutsu"],"para":[0,9,18],"paraShow":true,"words":["こまった","ふしぎ","びっくり","うれしい","ほっと した"],"flow":{"on":true,"who":"ポル","off":[],"sp":{"7":"ポル","12":"りす","33":"くも、雲"},"quiz":[{"q":"「だれの ぼうしかな。」と いったのは、だれかな？","o":["ポル","りす","くも"]},{"q":"いつの はなしかな？","o":["あさ","ひる","よる"]},{"q":"さいごの ポルは、どんな きもちかな？","o":["うれしい","こまった","かなしい"]}]}}'],
  ['s2', 'だんごむしの ひみつ', 'せつめいぶん', '○',
    'だんごむしは、石（いし）や おちばの 下（した）に います。\n\nだんごむしは、どうして まるく なるのでしょうか。\nてきに おそわれると、からだを まるく します。\nかたい せなかで、やわらかい おなかを まもるのです。\n\nだんごむしは、何（なに）を たべるのでしょうか。\nだんごむしは、おちばを たべます。\nたべた おちばは、土（つち）の えいように なります。',
    '「とい」の ぶんに、あおい せんを ひこう。', '「こたえ」の ぶんに、あかい せんを ひこう。', 'わかった ことを、こくばんに まとめよう。', '', '',
    '{"th":"152608060","n":30,"q":[{"u":[],"k":"toi","hint":true,"check":true,"c":"b"},{"u":[],"k":"kotae","hint":true,"check":true,"c":"r"},{"u":[],"k":"","hint":true,"check":true,"c":""}],"cats":{"toi":[5,6,7,8,19,20,21],"kotae":[9,10,11,12,13,22,23,24]},"custom":[],"heads":["toi","kotae"],"para":[0,5,19],"paraShow":true,"words":[]}'],
];

// 前の 版の「くもの ぼうし」の こたえ（ものがたりの 型が 入る 前）。先生が 何も 直して いない ときだけ、新しい ものに 入れかえる
const OLD_S1_ANS = '{"th":"-1907463431","n":40,"q":[{"u":[],"k":"jinbutsu","hint":true,"check":true,"c":"r"},{"u":[15,16,17,34,35,36,37,38,39],"k":"","hint":true,"check":true,"c":""},{"u":[],"k":"","hint":true,"check":true,"c":""}],"cats":{"hatsugen":[7,8,12,13,14,33],"jinbutsu":[2,10,28],"toki":[0,18,19],"basho":[3,24],"kimochi":[16,17,35,36],"yosu":[37,38,39],"ono":[23]},"fm":{"yosu:37":["うれしい","ありがとうの きもち"],"kimochi:16":["こまった"],"kimochi:35":["うれしい"]},"custom":[],"heads":["toki","basho","jinbutsu"],"para":[0,9,18],"paraShow":true,"words":["こまった","ふしぎ","びっくり","うれしい","ほっと した"]}';

// ---------------------------------------------------------------------
// 画面を表示する
// ---------------------------------------------------------------------
function doGet() {
  ensureSheets_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('チョークんの マイこくばん')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// スプレッドシートを開いたときにメニューを出す
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('マイこくばん')
    .addItem('シートを準備する', 'setup')
    .addItem('「くもの ぼうし」を 新しい れいに 入れ直す', 'resetSample')
    .addToUi();
}

function setup() {
  ensureSheets_();
  SpreadsheetApp.getActiveSpreadsheet().toast('シートの準備ができました。「名簿」シートに子どもの名前を入れてください。');
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
      .setFontWeight('bold').setBackground('#bbf7d0');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 420);
  }
  sh = ss.getSheetByName(SHEET.TEXT);
  if (!sh) {
    sh = ss.insertSheet(SHEET.TEXT);
    sh.getRange(1, 1, 1, TEXT_HEADER.length).setValues([TEXT_HEADER]).setFontWeight('bold').setBackground('#fef9c3');
    sh.getRange(2, 1, SAMPLE_TEXTS.length, TEXT_HEADER.length).setValues(SAMPLE_TEXTS);
    sh.setFrozenRows(1);
    sh.setColumnWidth(2, 180);
    sh.setColumnWidth(5, 480);
  } else if (!String(sh.getRange(1, ANS_COL).getValue())) {
    sh.getRange(1, ANS_COL).setValue(TEXT_HEADER[ANS_COL - 1]).setFontWeight('bold').setBackground('#fef9c3'); // 前の 版の シートに 列を 足す
  }
  upgradeSample_(sh);
  sh = ss.getSheetByName(SHEET.LOG);
  if (!sh) {
    sh = ss.insertSheet(SHEET.LOG);
    sh.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]).setFontWeight('bold').setBackground('#dcfce7');
    sh.setFrozenRows(1);
  }
  sh = ss.getSheetByName(SHEET.SUM);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SUM);
    sh.getRange(1, 1, 1, SUM_HEADER.length).setValues([SUM_HEADER]).setFontWeight('bold').setBackground('#e0f2fe');
    sh.setFrozenRows(1);
    sh.setColumnWidth(6, 320);
    sh.setColumnWidth(7, 320);
    sh.setColumnWidth(8, 320);
  }
  sh = ss.getSheetByName(SHEET.SET);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SET);
    sh.getRange('B:B').setNumberFormat('@'); // 暗証番号の先頭の0が消えないように文字列にする
    const rows = [['こうもく', 'あたい', 'せつめい'], ['暗証番号', DEFAULT_PIN, '先生用画面に入るための4けたの数字']]
      .concat(SETTING_ROWS.map(function (r) { return [r[1], r[2], r[3]]; }));
    sh.getRange(1, 1, rows.length, 3).setValues(rows);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#e0e7ff');
    sh.setColumnWidth(1, 220);
    sh.setColumnWidth(3, 460);
  }
}

// 受け取った文字列が 式として うごかないように する（先頭が = + - @ のとき）
// れんしゅう用の「くもの ぼうし」に、ものがたりの 型（発問・かくにん もんだい）を 入れる。
// 本文も こたえも、はじめの ままの ときだけ 入れかえる（先生が 直した 文章には さわらない）。子どもの きろくは 変えない。
function upgradeSample_(sh) {
  const last = Math.min(sh.getLastRow(), 30);
  if (last < 2) return;
  const values = sh.getRange(2, 1, last - 1, TEXT_HEADER.length).getValues();
  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    if (String(r[0]) !== 's1') continue;
    if (String(r[4]) === SAMPLE_TEXTS[0][4] && String(r[ANS_COL - 1]) === OLD_S1_ANS) sh.getRange(i + 2, ANS_COL).setValue(SAMPLE_TEXTS[0][ANS_COL - 1]);
    return;
  }
}

// メニュー：先生が 直した「くもの ぼうし」を、新しい れんしゅう用の 形（ものがたりの 型）に 入れ直す。
// 先生が 自分で 押した ときだけ 動く。子どもの きろく・こくばんには さわらない。
function resetSample() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert('「くもの ぼうし」を 入れ直します',
    '先生が 直した「くもの ぼうし」の 本文・とい・こたえは 消えて、新しい れんしゅう用の 形（ものがたりの 型と かくにん もんだい）に なります。\n\n' +
    '子どもの きろくと こくばんは 残ります。本文が 変わる ときは、その子が ひいた せんだけ 消えます。\n\n入れ直しますか？', ui.ButtonSet.OK_CANCEL);
  if (res !== ui.Button.OK) return;
  resetSample_();
  ss_().toast('「くもの ぼうし」を 入れ直しました。アプリを 開き直して ください。');
}
function resetSample_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    ensureSheets_();
    const sh = ss_().getSheetByName(SHEET.TEXT), last = sh.getLastRow();
    let row = 0;
    if (last >= 2) {
      const ids = sh.getRange(2, 1, last - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === 's1') { row = i + 2; break; }
    }
    sh.getRange(row || Math.max(2, last + 1), 1, 1, TEXT_HEADER.length).setValues([SAMPLE_TEXTS[0]]); // ない ときは、いちばん 下に 足す
    return { ok: true, added: !row };
  } finally {
    lock.releaseLock();
  }
}

function safe_(v) {
  if (typeof v !== 'string') return v;
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function str_(v, max) { return String(v === undefined || v === null ? '' : v).slice(0, max || 500); }

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
    vertical: get('dir') !== 'よこ',
    sound: get('sound') !== 'ならさない',
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

function fmt_(d) {
  return d instanceof Date ? Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm') : String(d || '');
}

// ---------------------------------------------------------------------
// 文章
// ---------------------------------------------------------------------
// 「ぶんしょう」シートを 読む。ID の ない 行（先生が シートに じかに 足した 行）には ID を 付ける
function readTexts_() {
  const sh = ss_().getSheetByName(SHEET.TEXT);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const values = sh.getRange(2, 1, last - 1, TEXT_HEADER.length).getValues();
  const out = [];
  values.forEach(function (r, i) {
    const title = String(r[1]).trim(), body = String(r[4]).replace(/\r\n?/g, '\n').trim();
    if (!title && !body) return;
    let id = String(r[0]).trim();
    if (!id) {
      id = 't' + Date.now().toString(36) + i;
      sh.getRange(i + 2, 1).setValue(id);
    }
    const use = String(r[3]).trim();
    out.push({
      id: id, title: title || '（だいめい なし）', kind: String(r[2]).trim() === 'せつめいぶん' ? 'せつめいぶん' : 'ものがたり',
      use: !(use === '×' || use === 'x' || use === 'つかわない'), body: body,
      qs: [r[5], r[6], r[7], r[8], r[9]].map(function (q) { return String(q).trim(); }).filter(String),
      ans: String(r[10] || ''),
      row: i + 2,
    });
  });
  return out;
}

function publicText_(t) { return { id: t.id, title: t.title, kind: t.kind, use: t.use, body: t.body, qs: t.qs, ans: t.ans }; }

// ---------------------------------------------------------------------
// マイこくばん（「まとめ」シート）
// ---------------------------------------------------------------------
function sumValues_() {
  const sh = ss_().getSheetByName(SHEET.SUM);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getDataRange().getValues().slice(1);
}

function findWorkRow_(values, name, id) {
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === name && String(values[i][1]).trim() === id) return i;
  }
  return -1;
}

function workData_(row) { return row.slice(DATA_COL - 1).join(''); }

function workInfo_(r) {
  return {
    name: String(r[0]).trim(), id: String(r[1]).trim(), title: String(r[2]), updated: fmt_(r[3]), done: String(r[4]) === 'できた',
    lines: String(r[5] || ''), pasted: String(r[6] || ''), own: String(r[7] || ''), etc: String(r[8] || ''),
  };
}

// ---------------------------------------------------------------------
// アプリから呼ばれる関数（子ども）
// ---------------------------------------------------------------------
function getInitData() {
  ensureSheets_();
  return {
    students: rosterNames_(), settings: appSettings_(),
    texts: readTexts_().filter(function (t) { return t.use; }).map(publicText_),
  };
}

function getStudent(name) {
  name = String(name || '').trim();
  const row = findRosterRow_(name);
  if (row < 0) throw new Error('名簿に「' + name + '」が見つかりません');
  const works = {};
  sumValues_().forEach(function (r) {
    if (String(r[0]).trim() !== name) return;
    works[String(r[1]).trim()] = { updated: fmt_(r[3]), done: String(r[4]) === 'できた' };
  });
  return { progress: String(ss_().getSheetByName(SHEET.ROSTER).getRange(row, 2).getValue() || ''), works: works };
}

function getWork(name, id) {
  const values = sumValues_();
  const i = findWorkRow_(values, String(name || '').trim(), String(id || '').trim());
  return i < 0 ? '' : workData_(values[i]);
}

// マイこくばんと きろくを うけとる（同じ きろくは 二重に 書かない）
function saveWork(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    ensureSheets_();
    const name = String(p.name || '').trim();
    const rosterRow = findRosterRow_(name);
    if (rosterRow < 0) return { ok: false, reason: 'no-student' };
    if (p.progress) {
      const cell = ss_().getSheetByName(SHEET.ROSTER).getRange(rosterRow, 2);
      let old = {}, neu = {};
      try { old = JSON.parse(cell.getValue() || '{}'); } catch (e) { old = {}; }
      try { neu = JSON.parse(p.progress); } catch (e) { neu = null; }
      // 古い 端末の しんちょくでは 上書きしない
      if (neu && (!old.t || (neu.t || 0) >= old.t)) cell.setValue(JSON.stringify(neu));
    }
    const id = String(p.textId || '').trim();
    if (id && typeof p.data === 'string' && p.data) {
      const sh = ss_().getSheetByName(SHEET.SUM);
      const values = sumValues_();
      const i = findWorkRow_(values, name, id);
      const s = p.summary || {};
      const row = [name, id, str_(p.title, 100), new Date(p.time || Date.now()), p.done ? 'できた' : 'とちゅう',
        str_(s.lines, 5000), str_(s.pasted, 5000), str_(s.own, 5000), str_(s.etc, 500)].map(safe_);
      for (let k = 0; k < p.data.length; k += CHUNK) row.push(p.data.slice(k, k + CHUNK));
      const width = Math.max(row.length, i < 0 ? 0 : values[i].length);
      while (row.length < width) row.push('');
      const at = i < 0 ? sh.getLastRow() + 1 : i + 2;
      sh.getRange(at, 1, 1, row.length).setValues([row]);
    }
    const recs = p.records || [];
    if (recs.length) {
      const log = ss_().getSheetByName(SHEET.LOG);
      const last = log.getLastRow();
      const known = {};
      if (last >= 2) {
        const from = Math.max(2, last - 3000);
        log.getRange(from, LOG_HEADER.length, last - from + 1, 1).getValues().forEach(function (r) { known[String(r[0])] = true; });
      }
      const rows = recs.filter(function (r) { return r && r.id && !known[r.id]; }).map(function (r) {
        return [new Date(r.time || p.time || Date.now()), name, str_(r.text, 100), str_(r.q, 200), str_(r.act, 40), str_(r.color, 20), str_(r.word, 1000), str_(r.id, 40)].map(safe_);
      });
      if (rows.length) log.getRange(last + 1, 1, rows.length, LOG_HEADER.length).setValues(rows);
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------------
// アプリから呼ばれる関数（先生）
// ---------------------------------------------------------------------
function getTeacherData(pin) {
  if (!checkPin_(pin)) return { ok: false };
  return {
    ok: true,
    isDefaultPin: String(pin) === DEFAULT_PIN,
    settings: appSettings_(),
    students: rosterValues_().filter(function (r) { return String(r[0]).trim(); }).map(function (r) {
      return { name: String(r[0]).trim(), progress: String(r[1] || '') };
    }),
    texts: readTexts_().map(publicText_),
    works: sumValues_().filter(function (r) { return String(r[0]).trim(); }).map(workInfo_),
  };
}

// 1つの 文章の、みんなの マイこくばん（name を 入れると その子だけ）
function getWorks(pin, id, name) {
  if (!checkPin_(pin)) return { ok: false };
  const out = [];
  sumValues_().forEach(function (r) {
    if (String(r[1]).trim() !== String(id)) return;
    if (name && String(r[0]).trim() !== name) return;
    const w = workInfo_(r);
    w.data = workData_(r);
    out.push(w);
  });
  return { ok: true, works: out };
}

function saveText(pin, t) {
  if (!checkPin_(pin)) return { ok: false };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const title = str_(t.title, 100).trim(), body = String(t.body || '').replace(/\r\n?/g, '\n').slice(0, 20000).trim();
    if (!title || !body.trim()) return { ok: false, reason: 'empty' };
    const sh = ss_().getSheetByName(SHEET.TEXT);
    const texts = readTexts_();
    const old = texts.filter(function (x) { return x.id === t.id; })[0];
    const id = old ? old.id : 't' + Date.now().toString(36);
    const qs = (t.qs || []).map(function (q) { return str_(q, 200).trim(); }).filter(String).slice(0, 5);
    while (qs.length < 5) qs.push('');
    const row = [id, title, t.kind === 'せつめいぶん' ? 'せつめいぶん' : 'ものがたり', t.use === false ? '×' : '○', body].concat(qs).concat([str_(t.ans, 30000)]).map(safe_);
    sh.getRange(old ? old.row : sh.getLastRow() + 1, 1, 1, TEXT_HEADER.length).setValues([row]);
    return { ok: true, id: id, texts: readTexts_().map(publicText_) };
  } finally {
    lock.releaseLock();
  }
}

// 文章を 消す（子どもの マイこくばんは のこします）
function deleteText(pin, id) {
  if (!checkPin_(pin)) return { ok: false };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = ss_().getSheetByName(SHEET.TEXT);
    const t = readTexts_().filter(function (x) { return x.id === id; })[0];
    if (t) sh.getRange(t.row, 1, 1, TEXT_HEADER.length).clearContent();
    return { ok: true, texts: readTexts_().map(publicText_) };
  } finally {
    lock.releaseLock();
  }
}

function saveSettings(pin, s) {
  if (!checkPin_(pin)) return { ok: false };
  if (s.rate !== undefined) setSetting_('よみあげの はやさ', Math.min(1.2, Math.max(0.5, Number(s.rate) || 0.8)));
  if (s.font !== undefined) setSetting_('もじの おおきさ', Math.min(1.6, Math.max(0.7, Number(s.font) || 1)));
  if (s.vertical !== undefined) setSetting_('ぶんしょうの むき', s.vertical ? 'たて' : 'よこ');
  if (s.sound !== undefined) setSetting_('こうかおん', s.sound ? 'ならす' : 'ならさない');
  if (s.newPin && /^\d{4}$/.test(String(s.newPin))) setSetting_('暗証番号', String(s.newPin));
  return { ok: true, settings: appSettings_() };
}

function readLog_() {
  const sh = ss_().getSheetByName(SHEET.LOG);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, LOG_HEADER.length).getValues();
}

function getLogRows(pin) {
  if (!checkPin_(pin)) return { ok: false };
  const rows = readLog_().map(function (r) { return r.map(function (v) { return v instanceof Date ? fmt_(v) : v; }); });
  return { ok: true, rows: [LOG_HEADER].concat(rows) };
}

function getBackup(pin) {
  if (!checkPin_(pin)) return { ok: false };
  return {
    ok: true,
    data: {
      app: 'kokuban', time: new Date().toISOString(),
      roster: rosterValues_().filter(function (r) { return String(r[0]).trim(); }).map(function (r) { return [String(r[0]).trim(), String(r[1] || '')]; }),
      texts: readTexts_().map(publicText_),
      works: sumValues_().filter(function (r) { return String(r[0]).trim(); }).map(function (r) {
        const w = workInfo_(r);
        w.data = workData_(r);
        return w;
      }),
    },
  };
}

function restoreBackup(pin, data) {
  if (!checkPin_(pin)) return { ok: false };
  if (!data || data.app !== 'kokuban') return { ok: false };
  const sh = ss_().getSheetByName(SHEET.ROSTER);
  (data.roster || []).forEach(function (r) {
    const name = String(r[0] || '').trim();
    if (!name) return;
    let row = findRosterRow_(name);
    if (row < 0) { sh.appendRow([safe_(name), '']); row = sh.getLastRow(); }
    sh.getRange(row, 2).setValue(String(r[1] || ''));
  });
  const have = {};
  readTexts_().forEach(function (t) { have[t.id] = true; });
  (data.texts || []).forEach(function (t) {
    if (!t || !t.id || have[t.id]) return;
    const qs = (t.qs || []).slice(0, 5).map(function (q) { return str_(q, 200); });
    while (qs.length < 5) qs.push('');
    ss_().getSheetByName(SHEET.TEXT).appendRow([String(t.id), str_(t.title, 100), t.kind === 'せつめいぶん' ? 'せつめいぶん' : 'ものがたり', t.use === false ? '×' : '○', String(t.body || '').slice(0, 20000)].concat(qs).concat([str_(t.ans, 30000)]).map(safe_));
  });
  (data.works || []).forEach(function (w) {
    if (!w || !w.name || !w.id || !w.data) return;
    saveWork({ name: w.name, textId: w.id, title: w.title, data: String(w.data), done: !!w.done, time: Date.now(),
      summary: { lines: w.lines, pasted: w.pasted, own: w.own, etc: w.etc } });
  });
  return { ok: true };
}

// 記録を消す（name が空なら全員）。文章は 消しません
function clearRecords(pin, name) {
  if (!checkPin_(pin)) return { ok: false };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const wipe = function (sheetName, width) {
      const sh = ss_().getSheetByName(sheetName);
      const last = sh.getLastRow();
      if (last < 2) return;
      const all = sh.getDataRange().getValues().slice(1);
      const w = Math.max(width, all[0].length);
      const keep = name ? all.filter(function (r) { return String(r[sheetName === SHEET.LOG ? 1 : 0]).trim() !== name; }) : [];
      sh.getRange(2, 1, last - 1, w).clearContent();
      if (keep.length) sh.getRange(2, 1, keep.length, w).setValues(keep.map(function (r) { r = r.slice(0, w); while (r.length < w) r.push(''); return r; }));
    };
    wipe(SHEET.LOG, LOG_HEADER.length);
    wipe(SHEET.SUM, SUM_HEADER.length);
    const sh = ss_().getSheetByName(SHEET.ROSTER);
    rosterValues_().forEach(function (r, i) {
      if (!name || String(r[0]).trim() === name) sh.getRange(i + 2, 2).setValue('');
    });
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}
