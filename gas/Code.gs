/**
 * おんどくはかせの ちょうせんじょう ― Google Apps Script（スプレッドシートに付けて使う）
 *
 * このスクリプトには 2つの役目があります。
 *   1. 子どもが開く「入口ページ」
 *      「はじめる」ボタンで GitHub Pages のアプリ本体を開きます。
 *      そのとき、記録の送り先（このウェブアプリのURL）と合言葉を アプリに渡します。
 *   2. 記録の「受け取り口」
 *      アプリから送られてきた点数を、このスプレッドシートの「きろく」シートに書き込み、
 *      「いちらん」シートを作り直します。録音は受け取りません。
 *   3. はかせの声・おてほんの声づくり（Gemini の読み上げ）
 *      APIキーは「プロジェクトの設定 → スクリプト プロパティ」の GEMINI_API_KEY に入れます。
 *      作った声は、ドライブの「おんどくはかせ こえ」フォルダに保存して使い回します。
 *
 * 準備のしかたは README.md の「Google Apps Script とスプレッドシートの準備」を見てください。
 */

// アプリ本体（GitHub Pages）のURL
const APP_URL = 'https://zku0395-ops.github.io/hori/';
// 記録の送り先がうまく渡らないときだけ、デプロイしたウェブアプリのURL（…/exec）をここに貼ります
const RECORD_URL = '';

const PASS_SCORE = 80;
const SHEET_SUMMARY = 'いちらん';
const SHEET_LOG = 'きろく';
const SHEET_DATA = '_data';
const LOG_HEADER = ['日時', 'なまえ', 'ステージ', '課題番号', '課題', '合計', '声の大きさ', '読みの正確さ', '強弱', '速さ', '合格', '読んだ時間(秒)', '聞き取った言葉', '採点のきびしさ', '課題ID', '記録ID'];
const MAX_RECORDS_PER_POST = 300;

/* ---------- 入口ページ ---------- */
function doGet() {
  setup_();
  const template = HtmlService.createTemplateFromFile('start');
  const rec = webAppUrl_();
  template.startUrl = APP_URL + (rec ? '#rec=' + encodeURIComponent(rec) + '&key=' + encodeURIComponent(getKey_()) : '');
  return template.evaluate()
    .setTitle('おんどくはかせの ちょうせんじょう')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ---------- 記録の受け取り口 ---------- */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad-json' });
  }
  if (!body || body.app !== 'ondoku-hakase' || String(body.key || '') !== getKey_()) {
    return json_({ ok: false, error: 'key' });
  }
  // 声づくり（記録は 書かない）
  if (body.tts) return json_(getVoice(body.tts.text, body.tts.role, body.tts.voice, !!body.tts.prep));
  if (body.ttsStatus) return json_(getTtsStatus());
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    setup_();
    const added = appendRecords_(body);
    if (body.name && body.summary) saveSummary_(body);
    updateSummary();
    return json_({ ok: true, added: added });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- スプレッドシートのメニュー ---------- */
function onOpen() {
  try { setup_(); } catch (e) { /* 準備は デプロイ後の 初回の 送信でも 行う */ }
  SpreadsheetApp.getUi()
    .createMenu('音読はかせ')
    .addItem('一覧を更新', 'updateSummary')
    .addItem('子どもに配るURLと合言葉を表示', 'showUrl')
    .addToUi();
}

function showUrl() {
  setup_();
  const url = webAppUrl_();
  const ui = SpreadsheetApp.getUi();
  if (!url) {
    ui.alert('まだウェブアプリとしてデプロイされていません。\n「デプロイ」→「新しいデプロイ」から、種類「ウェブアプリ」、アクセスできるユーザー「全員」でデプロイしてください。');
    return;
  }
  ui.alert(
    '子どもに配るURL（入口ページ）：\n' + url +
    '\n\n合言葉：' + getKey_() +
    '\n\n入口ページから開けば、記録の送り先と合言葉はアプリに自動で設定されます。' +
    '\n入口ページを通さずに開いた端末では、アプリの先生用画面「データ」タブで、上のURLと合言葉を入力してください。'
  );
}

/* ---------- いちらん シートを作り直す ---------- */
function updateSummary() {
  setup_();
  const data = sheet_(SHEET_DATA);
  const last = data.getLastRow();
  const rows = last > 1 ? data.getRange(2, 1, last - 1, 2).getValues() : [];
  let cols = [];
  try { cols = JSON.parse(PropertiesService.getScriptProperties().getProperty('COLUMNS') || '[]'); } catch (e) { cols = []; }

  const people = rows
    .map(function (r) { let s = {}; try { s = JSON.parse(r[1]); } catch (e) { s = {}; } return { name: String(r[0]), s: s }; })
    .filter(function (p) { return p.name; })
    .sort(function (a, b) { return a.name.localeCompare(b.name, 'ja'); });

  const fixed = ['なまえ', 'しょうごう', 'ごうかく', 'ちょうせん回数', 'さいごの学習', 'いまの課題'];
  const header = fixed.concat(cols.map(function (c) { return c.short; }));
  const values = [header];
  const bgs = [header.map(function () { return '#fde68a'; })];
  people.forEach(function (p) {
    const s = p.s || {};
    const best = s.best || {};
    const row = [str_(p.name, 40), s.title || '', (s.passed || 0) + ' / ' + (s.graded || 0), s.tries || 0, s.lastAt ? new Date(s.lastAt) : '', s.current || ''];
    const bg = row.map(function () { return '#ffffff'; });
    cols.forEach(function (c) {
      const v = best[c.id];
      const has = v !== undefined && v !== null && v !== '';
      row.push(has ? v : '');
      bg.push(!has ? '#ffffff' : v >= PASS_SCORE ? '#bbf7d0' : '#fef9c3');
    });
    values.push(row);
    bgs.push(bg);
  });

  const sh = sheet_(SHEET_SUMMARY);
  sh.clear();
  sh.clearNotes();
  if (people.length) {
    sh.getRange(2, 3, people.length, 1).setNumberFormat('@');
    sh.getRange(2, 5, people.length, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  }
  sh.getRange(1, 1, values.length, header.length).setValues(values).setBackgrounds(bgs);
  sh.getRange(1, 1, 1, header.length).setFontWeight('bold');
  if (cols.length) sh.getRange(1, fixed.length + 1, 1, cols.length).setNotes([cols.map(function (c) { return c.label; })]);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);
  sh.setColumnWidth(1, 110);
  sh.setColumnWidth(2, 170);
  sh.setColumnWidth(5, 130);
  sh.setColumnWidth(6, 170);
  if (cols.length) sh.setColumnWidths(fixed.length + 1, cols.length, 52);
  const noteRow = values.length + 2;
  sh.getRange(noteRow, 1, 1, 1).setValues([[
    people.length
      ? '数字＝その課題の最高点。緑＝合格（' + PASS_SCORE + '点以上）、黄＝挑戦中。見出しの課題番号にマウスを重ねると課題の文が出ます。'
      : 'まだ記録がありません。子どもがアプリで挑戦すると、ここに表示されます。',
  ]]);
}

/* ---------- 内部で使う関数 ---------- */
function appendRecords_(body) {
  const recs = (Array.isArray(body.records) ? body.records : []).slice(0, MAX_RECORDS_PER_POST);
  if (!recs.length) return 0;
  const sh = sheet_(SHEET_LOG);
  const last = sh.getLastRow();
  const idCol = LOG_HEADER.length;
  const known = {};
  if (last > 1) sh.getRange(2, idCol, last - 1, 1).getValues().forEach(function (r) { known[String(r[0])] = true; });
  const name = str_(body.name, 40);
  const rows = [];
  recs.forEach(function (r) {
    const uid = str_(r.uid, 80);
    if (!uid || known[uid]) return; // 同じ記録は 2回 書かない
    known[uid] = true;
    rows.push([
      new Date(Number(r.at) || Date.now()), name, str_(r.stage, 40), num_(r.no), str_(r.label, 80),
      num_(r.total), num_(r.vol), num_(r.acc), num_(r.dyn), num_(r.spd),
      Number(r.total) >= PASS_SCORE ? '合格' : '', num_(r.readSec), str_(r.heard, 200), str_(r.strict, 10),
      str_(r.taskId, 20), uid,
    ]);
  });
  if (!rows.length) return 0;
  sh.getRange(last + 1, 1, rows.length, 1).setNumberFormat('yyyy/mm/dd hh:mm');
  sh.getRange(last + 1, 1, rows.length, LOG_HEADER.length).setValues(rows);
  return rows.length;
}

function saveSummary_(body) {
  const s = body.summary || {};
  const clean = {
    title: str_(s.title, 40), passed: num_(s.passed), graded: num_(s.graded), tries: num_(s.tries),
    lastAt: num_(s.lastAt), current: str_(s.current, 40), best: {},
  };
  Object.keys(s.best || {}).slice(0, 200).forEach(function (k) {
    if (/^[a-z0-9-]{1,20}$/.test(k)) clean.best[k] = num_(s.best[k]);
  });
  const name = String(body.name).slice(0, 40);
  const sh = sheet_(SHEET_DATA);
  const last = sh.getLastRow();
  const names = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  const idx = names.indexOf(name);
  const row = [str_(name, 40), JSON.stringify(clean), new Date()];
  sh.getRange(idx >= 0 ? idx + 2 : last + 1, 1, 1, 3).setValues([row]);

  if (Array.isArray(body.columns) && body.columns.length) {
    const cols = body.columns.slice(0, 200)
      .map(function (c) { return { id: String(c.id || ''), short: str_(c.short, 10), label: str_(c.label, 60) }; })
      .filter(function (c) { return /^[a-z0-9-]{1,20}$/.test(c.id); });
    PropertiesService.getScriptProperties().setProperty('COLUMNS', JSON.stringify(cols));
  }
}

function setup_() {
  const ss = ss_();
  if (!ss.getSheetByName(SHEET_SUMMARY)) ss.insertSheet(SHEET_SUMMARY, 0);
  let log = ss.getSheetByName(SHEET_LOG);
  if (!log) {
    log = ss.insertSheet(SHEET_LOG, 1);
    log.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]).setFontWeight('bold').setBackground('#fde68a');
    log.setFrozenRows(1);
  }
  let data = ss.getSheetByName(SHEET_DATA);
  if (!data) {
    data = ss.insertSheet(SHEET_DATA);
    data.getRange(1, 1, 1, 3).setValues([['なまえ', 'まとめ', '更新日時']]);
    data.hideSheet();
  }
  // 最初からある 空の シートは 消す
  ['シート1', 'Sheet1'].forEach(function (n) {
    const sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() === 0 && sh.getLastColumn() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
  getKey_();
}

function ss_() {
  const props = PropertiesService.getScriptProperties();
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    if (props.getProperty('SSID') !== active.getId()) props.setProperty('SSID', active.getId());
    return active;
  }
  const id = props.getProperty('SSID');
  if (!id) throw new Error('スプレッドシートが見つかりません。スプレッドシートの「拡張機能 → Apps Script」から作ったスクリプトか確認してください。');
  return SpreadsheetApp.openById(id);
}

function sheet_(name) {
  return ss_().getSheetByName(name);
}

function getKey_() {
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
    props.setProperty('KEY', key);
  }
  return key;
}

function webAppUrl_() {
  let url = RECORD_URL;
  if (!url) {
    try { url = ScriptApp.getService().getUrl() || ''; } catch (e) { url = ''; }
  }
  // 学校の アカウントの URL（/a/macros/学校/s/ や /a/学校/macros/s/）は /macros/s/ に そろえる
  return url.replace(/\/a\/macros\/[^/]+\/s\//, '/macros/s/').replace(/\/a\/[^/]+\/macros\/s\//, '/macros/s/');
}

// 文字列は 長さを 切り、= + - @ で 始まるものは 式として 動かないように する
function str_(v, max) {
  let s = v === undefined || v === null ? '' : String(v).slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function num_(v) {
  const n = Number(v);
  return isFinite(n) ? n : '';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- はかせの声・おてほんの声（Gemini の読み上げ） ---------- */
//   APIキーは「プロジェクトの設定 → スクリプト プロパティ」の GEMINI_API_KEY に入れる（画面には出さない）
//   一度 作った声は、ドライブの「おんどくはかせ こえ」フォルダに 保存して 使い回す
const TTS_VOICES = {
  hakase: ['Algenib', 'Gacrux', 'Charon', 'Sadaltager', 'Achird'],
  model: ['Erinome', 'Iapetus', 'Kore', 'Aoede', 'Sulafat', 'Achernar'],
};
const TTS_STYLE = {
  hakase: 'もの知りで やさしい フクロウの おじいさん博士が、小学校の 低学年の 子どもに 話しかけるように、ゆっくり はっきり、あたたかく 読んでください。',
  model: '小学校の 音読の お手本として、ことばの 区切りを はっきり、ていねいに、ふつうの 速さで 読んでください。',
};
// つかう モデル（あたらしい じゅん。つかえない ときは つぎを ためす。スクリプト プロパティ GEMINI_TTS_MODEL で かえられる）
const TTS_MODELS = ['gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts'];
const TTS_FOLDER = 'おんどくはかせ こえ';
const TTS_MAX_CHARS = 300;

function ttsProps_() { return PropertiesService.getScriptProperties(); }

function ttsHash_(text, role, voice) {
  const d = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, voice + '|' + TTS_STYLE[role] + '|' + text, Utilities.Charset.UTF_8);
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

function callGemini_(key, model, text, role, voice) {
  const body = {
    contents: [{ parts: [{ text: TTS_STYLE[role] + '\n' + text }] }],
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
  if (!inl) return { code: 500, error: '声が ありません' };
  const m = /rate=(\d+)/.exec(inl.inlineData.mimeType || '');
  return { code: 200, pcm: Utilities.base64Decode(inl.inlineData.data), rate: m ? Number(m[1]) : 24000 };
}

// アプリから よぶ：声（WAV の base64）を かえす。だめな ときは ok:false（アプリは ブラウザの声で 読む）
//   role は hakase（はかせの セリフ）か model（おてほん）
//   prep が true の ときは、声を 作って ドライブに のこす だけ（まとめて 作る ボタン用。声は かえさない）
function getVoice(text, role, voice, prep) {
  text = String(text || '').trim();
  if (!text || text.length > TTS_MAX_CHARS) return { ok: false, reason: 'text' };
  if (!TTS_VOICES[role]) role = 'hakase';
  if (TTS_VOICES[role].indexOf(voice) < 0) voice = TTS_VOICES[role][0];
  const props = ttsProps_();
  const key = props.getProperty('GEMINI_API_KEY');
  if (!key) return { ok: false, reason: 'nokey' };
  const name = role + '_' + ttsHash_(text, role, voice) + '.wav';
  // ドライブの ファイルの ばしょを おぼえて おいて、さがす 時間を へらす
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
    const r = callGemini_(key, models[i], text, role, voice);
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
    if (r.code === 429) { props.setProperty('TTS_PAUSE_UNTIL', String(Date.now() + 10 * 60 * 1000)); break; } // 使いすぎ：10分 休む
    if (r.code !== 404 && r.code !== 400) break;
  }
  props.setProperty('TTS_LAST_ERROR', last ? (new Date().toISOString() + ' ' + last.code + ' ' + last.error) : '');
  return { ok: false, reason: last && last.code === 429 ? 'pause' : 'error' };
}

// 先生用画面：声の ようす
function getTtsStatus() {
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

// Apps Script の 画面で ためす：関数で ttsTest を えらんで ▶ 実行 → 「実行ログ」に 結果が 出る
function ttsTest() {
  const r = getVoice('こんにちは。わしは ホーホーはかせ じゃ。いっしょに おんどくを しよう。', 'hakase');
  console.log(r.ok ? 'OK：声が できました（' + (r.cached ? 'ドライブに あった声' : 'あたらしく 作った声') + '）。モデル：' + (ttsProps_().getProperty('TTS_MODEL_OK') || '')
    : 'うまく いきません：' + r.reason + '　' + (ttsProps_().getProperty('TTS_LAST_ERROR') || ''));
}
