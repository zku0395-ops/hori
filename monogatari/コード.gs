/**
 * ピカリせんせいの ものがたりの もり（サーバー側）
 *
 * スプレッドシートの「拡張機能 → Apps Script」に貼り付けて使います。
 * シート：名簿・きろく・まとめ・せってい（なければ自動で作ります）
 */

const SHEET = { ROSTER: '名簿', LOG: 'きろく', SUM: 'まとめ', SET: 'せってい' };
const LOG_HEADER = ['日時', 'なまえ', 'おはなし', 'だいめい', 'しゅるい', 'もんだい', 'こたえ', 'けっか', 'まちがい', 'ヒント', 'えらんだ こたえ', 'びょう', 'ID'];
const DEFAULT_PIN = '1234';
// 「せってい」シートの項目（アプリの設定名 と 見出し）
const SETTING_ROWS = [
  ['rate', 'よみあげの はやさ', '0.8', '1がふつう。小さいほどゆっくり（0.5〜1.2）'],
  ['font', 'もじの おおきさ', '1', '0.9（ちいさめ）・1（ふつう）・1.15（おおきめ）・1.3（とても おおきい）'],
  ['quiz', '③ たしかめ', 'する', 'する／しない（しない にすると、① きく と ② さがす で おわります）'],
  ['sound', 'こうかおん', 'ならす', 'ならす／ならさない'],
  ['tts', 'よみきかせの こえ（Gemini）', 'つかう', 'つかう／つかわない（APIキーが ないときは、ブラウザの こえで 読みます）'],
  ['voice', 'こえの しゅるい', 'Sulafat', 'Sulafat（あたたかい）・Leda（わかわかしい）・Aoede（さわやか）・Achird（したしみやすい）・Callirrhoe（おだやか）・Despina（なめらか）'],
];
// オン・オフの 設定の ことば（オンの ことば、オフの ことば）
const ONOFF = { quiz: ['する', 'しない'], sound: ['ならす', 'ならさない'], tts: ['つかう', 'つかわない'] };
// 先生が 変える フラグ（全部開く）
const FLAGS = ['unlockAll'];
// きろくの「しゅるい」
const CAT_NAMES = { dare: '①だれが いった', itsu: '②いつ', doko: '③どこ', kimochi: '④きもち', oto: '⑤オノマトペ' };

// ---------------------------------------------------------------------
// 画面を表示する
// ---------------------------------------------------------------------
function doGet() {
  ensureSheets_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ピカリせんせいの ものがたりの もり')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// スプレッドシートを開いたときにメニューを出す
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ものがたりの もり')
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
      .setFontWeight('bold').setBackground('#fde68a');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 420);
  }
  sh = ss.getSheetByName(SHEET.LOG);
  if (!sh) {
    sh = ss.insertSheet(SHEET.LOG);
    sh.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]).setFontWeight('bold').setBackground('#fef3c7');
    sh.setFrozenRows(1);
  }
  sh = ss.getSheetByName(SHEET.SUM);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SUM);
    sh.getRange(1, 1).setValue('先生用画面を開くか、メニュー「ものがたりの もり → まとめを更新する」で作られます。');
  }
  sh = ss.getSheetByName(SHEET.SET);
  if (!sh) {
    sh = ss.insertSheet(SHEET.SET);
    sh.getRange('B:B').setNumberFormat('@'); // 暗証番号の先頭の0が消えないように文字列にする
    const rows = [['こうもく', 'あたい', 'せつめい'], ['暗証番号', DEFAULT_PIN, '先生用画面に入るための4けたの数字']]
      .concat(SETTING_ROWS.map(function (r) { return [r[1], r[2], r[3]]; }));
    sh.getRange(1, 1, rows.length, 3).setValues(rows);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#e0e7ff');
    sh.setColumnWidth(1, 260);
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
    rate: Number(get('rate')) || 0.8,
    font: Number(get('font')) || 1,
    voice: TTS_VOICES.indexOf(get('voice')) >= 0 ? get('voice') : TTS_VOICES[0],
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
        return [t, name, Number(r.story) || 0, r.title || '', r.cat || '', r.q || '', r.a || '', r.result || '',
          Number(r.miss) || 0, Number(r.hint) || 0, r.picks || '', Number(r.secs) || 0, r.id].map(safe_);
      });
      if (rows.length) log.getRange(last + 1, 1, rows.length, LOG_HEADER.length).setValues(rows);
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function emptyStudent_() {
  return { count: 0, ok: 0, miss: 0, hint: 0, done: 0, last: '', stories: {}, cats: {}, sc: {}, misses: [] };
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
    classCats: agg.classCats,
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
  return { ok: true, data: { app: 'monogatari', time: new Date().toISOString(), roster: rosterValues_().filter(function (r) { return String(r[0]).trim(); }).map(function (r) { return [String(r[0]).trim(), String(r[1] || '')]; }), settings: appSettings_() } };
}

function restoreBackup(pin, data) {
  if (!checkPin_(pin)) return { ok: false };
  if (!data || data.app !== 'monogatari') return { ok: false };
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
//   しゅるい が「おわり」の 行は、1わ よみおわった しるし（もんだいの かずには 入れない）
// ---------------------------------------------------------------------
function readLog_() {
  const sh = ss_().getSheetByName(SHEET.LOG);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, LOG_HEADER.length).getValues().filter(function (r) { return String(r[1]).trim(); });
}

function aggregate_(rows) {
  const tz = Session.getScriptTimeZone();
  const students = {}, classCats = {};
  const add = function (m, k, ok, miss, hint) { const a = m[k] || (m[k] = [0, 0, 0, 0]); a[0]++; a[1] += ok; a[2] += miss; a[3] += hint; };
  rows.forEach(function (r) {
    const name = String(r[1]).trim();
    if (!name) return;
    const s = students[name] || (students[name] = emptyStudent_());
    const when = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy/MM/dd HH:mm') : String(r[0]).slice(0, 16);
    const day = when.slice(0, 10);
    if (day > s.last) s.last = day;
    const cat = String(r[4]);
    if (cat === 'おわり') { s.done++; return; }
    const st = String(r[2]), ok = r[7] === '○' ? 1 : 0, miss = Number(r[8]) || 0, hint = Number(r[9]) || 0;
    s.count++; s.ok += ok; s.miss += miss; s.hint += hint;
    add(s.stories, st, ok, miss, hint);
    add(s.cats, cat, ok, miss, hint);
    add(classCats, cat, ok, miss, hint);
    add(s.sc, st + '|' + cat, ok, miss, hint); // おはなし × しゅるい
    if (!ok) s.misses.push([when, st, cat, String(r[5]), String(r[6]), String(r[10] || ''), hint]);
  });
  Object.keys(students).forEach(function (n) { students[n].misses = students[n].misses.slice(-15).reverse(); });
  return { students: students, classCats: classCats };
}

// 「まとめ」シート：子どもごと・しゅるいごとの 結果
function writeSummary_(agg, names) {
  const sh = ss_().getSheetByName(SHEET.SUM);
  sh.clear();
  const header = ['なまえ', 'よんだ おはなし', 'くぎり', 'もんだい', 'まちがえずに できた わりあい', 'まちがい', 'ヒント'];
  const out = [header];
  names.forEach(function (n) {
    const s = agg.students[n];
    if (!s) return;
    out.push([n, s.done, 'ぜんたい', s.count, s.count ? s.ok / s.count : '', s.miss, s.hint]);
    Object.keys(CAT_NAMES).forEach(function (c) {
      const g = s.cats[CAT_NAMES[c]];
      if (g) out.push([n, '', CAT_NAMES[c], g[0], g[0] ? g[1] / g[0] : '', g[2], g[3]]);
    });
    Object.keys(s.stories).forEach(function (st) {
      const g = s.stories[st];
      out.push([n, '', 'おはなし ' + st, g[0], g[0] ? g[1] / g[0] : '', g[2], g[3]]);
    });
  });
  sh.getRange(1, 1, out.length, header.length).setValues(out);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#fde68a');
  sh.setFrozenRows(1);
  if (out.length > 1) {
    const body = sh.getRange(2, 5, out.length - 1, 1);
    body.setNumberFormat('0%');
    body.setBackgrounds(body.getValues().map(function (r) {
      return r.map(function (v) { return v === '' ? null : v < 0.6 ? '#fecaca' : v < 0.8 ? '#fef08a' : '#bbf7d0'; });
    }));
  }
  sh.getRange(out.length + 2, 1).setValue('※ 赤：60%未満　黄：60〜79%　緑：80%以上。「まちがえずに できた」は、まちがえず ヒントも 使わずに できた もんだい。　更新：' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm'));
}

// ---------------------------------------------------------------------
// ピカリせんせいの こえ・よみきかせ（Gemini の よみあげ）
//   APIキーは「プロジェクトの設定 → スクリプト プロパティ」の GEMINI_API_KEY に入れる（画面には出さない）
//   一度 作った こえは、ドライブの「ものがたりの もり こえ」フォルダに 保存して 使い回す
// ---------------------------------------------------------------------
const TTS_VOICES = ['Sulafat', 'Leda', 'Aoede', 'Achird', 'Callirrhoe', 'Despina'];
// つかう モデル（あたらしい じゅん。つかえない ときは つぎを ためす。スクリプト プロパティ GEMINI_TTS_MODEL で かえられる）
const TTS_MODELS = ['gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts'];
const TTS_STYLE = 'やさしい 先生が、小学校の 低学年の 子どもに 絵本を 読み聞かせるように、ゆっくり はっきり、あたたかく 読んでください。かぎかっこの せりふは、その 人物の 気持ちを こめて 読んでください。';
const TTS_FOLDER = 'ものがたりの もり こえ';
const TTS_MAX_CHARS = 200;

function ttsProps_() { return PropertiesService.getScriptProperties(); }

function ttsHash_(text, voice) {
  const d = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, voice + '|' + TTS_STYLE + '|' + text, Utilities.Charset.UTF_8);
  return d.map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

function ttsFolder_() {
  const it = DriveApp.getFoldersByName(TTS_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(TTS_FOLDER);
}

// PCM（16bit・1ch）に WAV の あたまを つける
function wavBytes_(pcm, rate) {
  const n = pcm.length, h = [];
  const s4 = function (t) { for (let i = 0; i < 4; i++) h.push(t.charCodeAt(i)); };
  const u32 = function (v) { h.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >> 24) & 255); };
  const u16 = function (v) { h.push(v & 255, (v >> 8) & 255); };
  s4('RIFF'); u32(36 + n); s4('WAVE'); s4('fmt '); u32(16); u16(1); u16(1); u32(rate); u32(rate * 2); u16(2); u16(16); s4('data'); u32(n);
  return h.map(function (b) { return b > 127 ? b - 256 : b; }).concat(pcm);
}

function ttsCountKey_() { return 'TTS_COUNT_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd'); }

function callGemini_(key, model, text, voice) {
  const body = {
    contents: [{ parts: [{ text: TTS_STYLE + '\n' + text }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
  };
  const res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(body),
    headers: { 'x-goog-api-key': key }, muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code !== 200) return { code: code, error: res.getContentText().slice(0, 300) };
  const j = JSON.parse(res.getContentText());
  const part = (((j.candidates || [])[0] || {}).content || {}).parts || [];
  const inl = part.filter(function (x) { return x.inlineData && x.inlineData.data; })[0];
  if (!inl) return { code: 500, error: 'こえが ありません' };
  const m = /rate=(\d+)/.exec(inl.inlineData.mimeType || '');
  return { code: 200, pcm: Utilities.base64Decode(inl.inlineData.data), rate: m ? Number(m[1]) : 24000 };
}

// アプリから よぶ：こえ（WAV の base64）を かえす。だめな ときは ok:false（アプリは ブラウザの こえで 読む）
//   prep が true の ときは、こえを つくって ドライブに のこす だけ（まとめて つくる ボタン用。こえは かえさない）
function getVoice(text, voice, prep) {
  text = String(text || '').trim();
  if (!text || text.length > TTS_MAX_CHARS) return { ok: false, reason: 'text' };
  if (TTS_VOICES.indexOf(voice) < 0) voice = TTS_VOICES[0];
  const props = ttsProps_();
  const key = props.getProperty('GEMINI_API_KEY');
  if (!key) return { ok: false, reason: 'nokey' };
  const name = ttsHash_(text, voice) + '.wav';
  // ドライブの ファイルの ばしょを おぼえて おいて、さがす じかんを へらす
  const cache = CacheService.getScriptCache();
  const fid = cache.get(name);
  if (fid) {
    try { const f = DriveApp.getFileById(fid); return { ok: true, wav: prep ? '' : Utilities.base64Encode(f.getBlob().getBytes()), cached: true }; } catch (e) { cache.remove(name); }
  }
  const folder = ttsFolder_();
  const found = folder.getFilesByName(name);
  if (found.hasNext()) {
    const f = found.next();
    cache.put(name, f.getId(), 21600);
    return { ok: true, wav: prep ? '' : Utilities.base64Encode(f.getBlob().getBytes()), cached: true };
  }
  if (Number(props.getProperty('TTS_PAUSE_UNTIL') || 0) > Date.now()) return { ok: false, reason: 'pause' };
  const custom = props.getProperty('GEMINI_TTS_MODEL');
  const models = custom ? [custom] : TTS_MODELS;
  const start = Math.max(0, models.indexOf(props.getProperty('TTS_MODEL_OK') || ''));
  let last = null;
  for (let i = start; i < models.length; i++) {
    const r = callGemini_(key, models[i], text, voice);
    if (r.code === 200) {
      props.setProperty('TTS_MODEL_OK', models[i]);
      const ck = ttsCountKey_();
      props.setProperty(ck, String(Number(props.getProperty(ck) || 0) + 1));
      const bytes = wavBytes_(r.pcm, r.rate);
      const nf = folder.createFile(Utilities.newBlob(bytes, 'audio/wav', name));
      cache.put(name, nf.getId(), 21600);
      return { ok: true, wav: prep ? '' : Utilities.base64Encode(bytes), cached: false };
    }
    last = r;
    if (r.code === 429) { props.setProperty('TTS_PAUSE_UNTIL', String(Date.now() + 10 * 60 * 1000)); break; } // つかいすぎ：10ぷん やすむ
    if (r.code !== 404 && r.code !== 400) break;
  }
  props.setProperty('TTS_LAST_ERROR', last ? (new Date().toISOString() + ' ' + last.code + ' ' + last.error) : '');
  return { ok: false, reason: last && last.code === 429 ? 'pause' : 'error' };
}

// 先生用画面：こえの ようす
function getTtsStatus(pin) {
  if (!checkPin_(pin)) return { ok: false };
  const p = ttsProps_();
  const it = DriveApp.getFoldersByName(TTS_FOLDER);
  let files = 0;
  if (it.hasNext()) { const f = it.next().getFiles(); while (f.hasNext()) { f.next(); files++; } }
  return {
    ok: true, hasKey: !!p.getProperty('GEMINI_API_KEY'), model: p.getProperty('GEMINI_TTS_MODEL') || p.getProperty('TTS_MODEL_OK') || '',
    today: Number(p.getProperty(ttsCountKey_()) || 0), files: files,
    pauseUntil: Number(p.getProperty('TTS_PAUSE_UNTIL') || 0), lastError: p.getProperty('TTS_LAST_ERROR') || '',
  };
}

// Apps Script の 画面で ためす：かんすうで ttsTest を えらんで ▶ 実行 → 「実行ログ」に けっかが 出る
function ttsTest() {
  const r = getVoice('こんにちは。わたしは ホタルの ピカリせんせい。いっしょに おはなしを よもうね。', TTS_VOICES[0]);
  console.log(r.ok ? 'OK：こえが できました（' + (r.cached ? 'ドライブに あった こえ' : 'あたらしく つくった こえ') + '）。モデル：' + (ttsProps_().getProperty('TTS_MODEL_OK') || '')
    : 'うまく いきません：' + r.reason + '　' + (ttsProps_().getProperty('TTS_LAST_ERROR') || ''));
}
