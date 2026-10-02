/**
 * 仮想職員室 ― Google Apps Script（スプレッドシートに付けて使う）
 *
 * 担任ひとりが使う「仮想職員室」の本体です。
 *   - doGet() で 画面（app.html）を 出します。
 *   - 画面から 呼ばれる apiGetAll / apiPut / apiRemove / apiSaveSettings で、
 *     このスプレッドシートの シートに 予定・時間割・週案・単元計画などを 読み書きします。
 *
 *   - 毎週火曜日の朝（時間主導型トリガー）に weeklyDraftJob() が 次の週の 週案の 下書きを 作ります。
 *     下書きの 計算は、app.html の「共通ここから」〜「共通ここまで」の 部分を 読みこんで 使います。
 *
 * デプロイは「次のユーザーとして実行：自分」「アクセスできるユーザー：自分のみ」で 行います。
 * 準備のしかたは shokuinshitsu/README.md を 見てください。
 */

const APP_TITLE = '仮想職員室';
const SHEET_SETTINGS = '設定';
const COL_ID = 'ID';
const COL_UPDATED = '更新日時';
const MAX_TEXT = 2000;
const MAX_LONG = 10000;
const MAX_RECORDS = 500;
const BULK = 30; // これより 多く 書きかえる・消す ときは、まとめて 書きなおす
const HEADER_BG = '#d9ead3';
const DRAFT_JOB = 'weeklyDraftJob';
const DRAFT_WEEKDAY = 'TUESDAY'; // 下書きを 作る 曜日（ScriptApp.WeekDay の 名前）
const DRAFT_DAY_LABEL = '火曜日';
const DRAFT_HOUR = 6; // 6時台に 作る（プロジェクトの タイムゾーンの 時刻）

// 画面の データの 種類と、シートの 列の 対応
// [画面での 名前, シートの 見出し, 型（省略＝文字 / long＝長い文 / num＝数 / date＝日付 / time＝時刻）]
const TABLES = {
  events: {
    sheet: '行事予定',
    cols: [['id', COL_ID], ['date', '日付', 'date'], ['end', '終わりの日', 'date'], ['time', '時刻', 'time'], ['title', '内容'], ['cat', '種類'], ['memo', 'メモ']],
  },
  timetable: {
    sheet: '基本の時間割',
    cols: [['id', COL_ID], ['day', '曜日(1=月)', 'num'], ['period', '校時ID'], ['subject', '教科'], ['memo', 'メモ']],
  },
  weekly: {
    sheet: '週案',
    cols: [['id', COL_ID], ['date', '日付', 'date'], ['period', '校時ID'], ['subject', '教科'], ['unitId', '単元ID'], ['content', '学習内容', 'long'], ['note', 'メモ・ふりかえり'],
      ['hours', '時数', 'num'], ['subject2', '教科2'], ['hours2', '時数2', 'num']],
  },
  // 日ごとの 情報（授業時数・週案簿の 備考など）
  days: {
    sheet: '日ごと',
    cols: [['id', COL_ID], ['date', '日付', 'date'], ['jisu', '授業時数', 'num'], ['fixed', '週案あり', 'num'], ['yasumi', '休み時間', 'long'], ['biko', '備考', 'long'], ['kiroku', '記録欄', 'long']],
  },
  // 週ごとの 情報（今週の重点）
  weeks: {
    sheet: '週ごと',
    cols: [['id', COL_ID], ['monday', '週のはじめ', 'date'], ['focus', '今週の重点', 'long'], ['draftAt', '下書きを作った日', 'date']],
  },
  children: {
    sheet: '子ども',
    cols: [['id', COL_ID], ['name', '呼び名'], ['grade', '学年'], ['homeroom', '交流学級'], ['order', '並び順', 'num'], ['memo', 'メモ'],
      ['likes', '好きなこと・得意なこと', 'long'], ['care', '配慮・支援のポイント', 'long']],
  },
  exchange: {
    sheet: '交流',
    cols: [['id', COL_ID], ['childId', '子どもID'], ['day', '曜日(1=月)', 'num'], ['period', '校時ID'], ['subject', '教科'], ['room', '交流先'], ['memo', 'メモ']],
  },
  units: {
    sheet: '単元計画',
    cols: [['id', COL_ID], ['subject', '教科'], ['name', '単元名'], ['start', 'はじめ', 'date'], ['end', 'おわり', 'date'], ['hours', '計画時数', 'num'], ['target', '対象'], ['goal', 'ねらい'], ['memo', 'メモ']],
  },
  materials: {
    sheet: '教材',
    cols: [['id', COL_ID], ['name', '名前'], ['subject', '教科'], ['kind', '種類'], ['url', 'URL'], ['unitId', '単元ID'], ['memo', 'メモ']],
    // シートを 作った ときに 最初から 入れておく 行
    seed: [{ id: 'm-ondoku', name: 'おんどくはかせの ちょうせんじょう', subject: '国語', kind: 'アプリ', url: 'https://zku0395-ops.github.io/hori/', memo: '自作の音読アプリ。全員の記録は「音読はかせ 記録」のスプレッドシートで見られます。' }],
  },
  // ここから 子どもの部屋
  notes: {
    sheet: '子どもの記録',
    cols: [['id', COL_ID], ['childId', '子どもID'], ['date', '日付', 'date'], ['tag', '分類'], ['text', '記録', 'long']],
  },
  plans: {
    sheet: '指導計画',
    cols: [['id', COL_ID], ['childId', '子どもID'], ['nendo', '年度', 'num'], ['wishSelf', '本人の願い', 'long'], ['wishParent', '保護者の願い', 'long'], ['longGoal', '長期目標', 'long'], ['memo', 'メモ', 'long']],
  },
  goals: {
    sheet: '指導計画の目標',
    cols: [['id', COL_ID], ['childId', '子どもID'], ['nendo', '年度', 'num'], ['term', '学期'], ['area', '領域'], ['goal', '目標', 'long'], ['support', '手立て', 'long'], ['level', '達成'], ['evaluation', '評価', 'long'], ['order', '並び順', 'num']],
  },
  contacts: {
    sheet: '保護者連絡',
    cols: [['id', COL_ID], ['childId', '子どもID'], ['date', '日付', 'date'], ['method', '方法'], ['content', '内容', 'long'], ['followup', '次にすること', 'long']],
  },
  // ここから 連携の部屋
  classes: {
    sheet: '交流学級',
    cols: [['id', COL_ID], ['name', '学級'], ['teacher', '担任'], ['memo', 'メモ', 'long']],
  },
  handovers: {
    sheet: '申し送り',
    cols: [['id', COL_ID], ['date', '日付', 'date'], ['room', '学級'], ['childId', '子どもID'], ['content', '内容', 'long'], ['reply', '返事・次にすること', 'long']],
  },
  staff: {
    sheet: '支援員など',
    cols: [['id', COL_ID], ['name', '名前'], ['role', '役割'], ['days', '勤務曜日'], ['order', '並び順', 'num'], ['memo', 'メモ', 'long']],
  },
  staffPlans: {
    sheet: '支援員の動き',
    cols: [['id', COL_ID], ['staffId', '支援員ID'], ['date', '日付（その日だけ）', 'date'], ['day', '曜日（基本）', 'num'], ['period', '校時ID'], ['text', '動き', 'long']],
  },
  orgs: {
    sheet: '関係機関',
    cols: [['id', COL_ID], ['name', '名前'], ['kind', '種類'], ['person', '担当者'], ['phone', '電話'], ['childIds', '関係する子どもID'], ['memo', 'メモ', 'long']],
  },
  orgLogs: {
    sheet: '関係機関との連絡',
    cols: [['id', COL_ID], ['orgId', '関係機関ID'], ['childId', '子どもID'], ['date', '日付', 'date'], ['method', '方法'], ['content', '内容', 'long'], ['followup', '次にすること', 'long']],
  },
  // ここから 公務の部屋
  tasks: {
    sheet: 'やること',
    cols: [['id', COL_ID], ['title', 'やること'], ['due', '締め切り', 'date'], ['to', '提出先'], ['cat', '分類'], ['dutyId', '分掌ID'], ['memo', 'メモ'], ['done', '完了した日', 'date'], ['fromId', 'もとの記録']],
  },
  duties: {
    sheet: '校務分掌',
    cols: [['id', COL_ID], ['name', '分掌'], ['role', '役割'], ['order', '並び順', 'num'], ['memo', 'メモ']],
  },
  dutyItems: {
    sheet: '分掌の仕事',
    cols: [['id', COL_ID], ['dutyId', '分掌ID'], ['month', '月', 'num'], ['title', '仕事'], ['timing', '時期'], ['memo', 'メモ']],
  },
  meetings: {
    sheet: '会議メモ',
    cols: [['id', COL_ID], ['date', '日付', 'date'], ['kind', '種類'], ['title', '会議名'], ['content', '内容', 'long'], ['mine', '自分がやること', 'long']],
  },
  templates: {
    sheet: '文書のひな形',
    cols: [['id', COL_ID], ['title', '題名'], ['kind', '種類'], ['body', '本文', 'long']],
    seed: [
      { id: 'tp-dayori', title: '学級だより', kind: '学級だより', body: '{学級名} だより　{年度}年度　第　号\n{日付}\n\n保護者のみなさまへ\n\n（今月の ようす）\n\n\n（来月の 予定）\n・\n\n（お知らせ・お願い）\n・\n\n担任　' },
      { id: 'tp-oshirase', title: '保護者へのお知らせ（行事）', kind: 'お知らせ', body: '{日付}\n保護者のみなさま\n{学級名} 担任\n\n　　　　の お知らせ\n\n　日ごろより、本学級の教育活動に ご理解と ご協力を いただき、ありがとうございます。\n　さて、下記のとおり　　　　を 行います。ご確認くださいますよう、お願いいたします。\n\n記\n１　日時　　月　日（　）\n２　場所　\n３　持ち物　\n４　その他　\n\n以上' },
      { id: 'tp-moushiokuri', title: '交流学級の先生への申し送り', kind: '申し送り', body: '{日付}　交流学級担任の先生へ\n\n（呼び名）さんについて\n\n・きょうの ようす：\n・気をつけてほしいこと：\n・連絡：\n\n{学級名} 担任' },
    ],
  },
};

/* ---------- 画面を 出す ---------- */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('app')
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ---------- スプレッドシートの メニュー ---------- */
function onOpen() {
  try { ss_(); } catch (e) { /* スプレッドシートの 場所は 画面を 開いたときにも 覚える */ }
  SpreadsheetApp.getUi()
    .createMenu(APP_TITLE)
    .addItem('職員室を開くURLを表示', 'showUrl')
    .addItem('シートを準備する', 'setupSheets')
    .addSeparator()
    .addItem(DRAFT_DAY_LABEL + 'の朝の 週案の自動作成を オンにする', 'enableDraftTrigger')
    .addItem(DRAFT_DAY_LABEL + 'の朝の 週案の自動作成を オフにする', 'disableDraftTrigger')
    .addItem('次の週の 週案の下書きを いま作る', 'runDraftNow')
    .addToUi();
}

function enableDraftTrigger() {
  apiSetDraftTrigger(true);
  SpreadsheetApp.getUi().alert('毎週' + DRAFT_DAY_LABEL + 'の朝（' + DRAFT_HOUR + '時台）に、次の週の 週案の 下書きを 自動で 作ります。\n仮想職員室を 開かなくても 作られます。');
}

function disableDraftTrigger() {
  apiSetDraftTrigger(false);
  SpreadsheetApp.getUi().alert(DRAFT_DAY_LABEL + 'の朝の 自動作成を オフにしました。');
}

function runDraftNow() {
  const r = weeklyDraftJob(true);
  SpreadsheetApp.getUi().alert(r.message);
}

function showUrl() {
  let url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) { url = ''; }
  const ui = SpreadsheetApp.getUi();
  if (!url) {
    ui.alert('まだウェブアプリとしてデプロイされていません。\n「デプロイ」→「新しいデプロイ」から、種類「ウェブアプリ」、次のユーザーとして実行「自分」、アクセスできるユーザー「自分のみ」でデプロイしてください。');
    return;
  }
  ui.alert('仮想職員室のURL：\n' + url + '\n\nブラウザのブックマークに入れておくと便利です。学校のアカウントでログインしているときだけ開けます。');
}

function setupSheets() {
  withLock_(setup_);
  SpreadsheetApp.getUi().alert('シートを準備しました。');
}

/* ---------- 画面から 呼ばれる 関数 ---------- */
// すべての データを 1回で 返す（日付の 値は 文字に そろえる）
function apiGetAll() {
  const ss = ss_();
  withLock_(setup_);
  const tz = ss.getSpreadsheetTimeZone();
  const draftId = PropertiesService.getScriptProperties().getProperty('DRAFT_SSID');
  const out = { settings: readSettings_(), tables: {}, sheetUrl: ss.getUrl(), draftTrigger: draftTriggerOn_(), draftSheetUrl: draftId ? 'https://docs.google.com/spreadsheets/d/' + draftId + '/edit' : '' };
  Object.keys(TABLES).forEach(function (kind) { out.tables[kind] = readTable_(kind, tz); });
  return JSON.stringify(out);
}

// 記録を 書きこむ（同じ ID の 行が あれば 書きかえ、なければ 下に 足す）
function apiPut(kind, json) {
  table_(kind);
  const recs = parseList_(json);
  withLock_(function () { writeTable_(kind, recs); });
  return true;
}

function apiRemove(kind, json) {
  table_(kind);
  const ids = parseList_(json).map(function (v) { return cleanId_(v); }).filter(String);
  withLock_(function () { deleteRows_(kind, ids); });
  return true;
}

function apiSaveSettings(json) {
  const obj = JSON.parse(json);
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('設定の形が正しくありません。');
  withLock_(function () { writeSettings_(obj); });
  return true;
}

// 週案の 下書きを、週案簿と 同じ 形の 別の スプレッドシートに 書き出す（Excelで 開いて 貼り付けるため）
// data = { name: シート名, cells: { 'B12': '国語', ... }, merges: ['B7:C7', ...] }
function apiWriteDraft(json) {
  const d = JSON.parse(json);
  if (!d || typeof d.cells !== 'object') throw new Error('下書きの形が正しくありません。');
  return withLock_(function () { return writeDraftSheet_(d.name, d.cells, d.merges); });
}

function writeDraftSheet_(name, cells, merges) {
  const d = { name: name, cells: cells, merges: merges };
  {
    const props = PropertiesService.getScriptProperties();
    let ss = null;
    const id = props.getProperty('DRAFT_SSID');
    if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
    if (!ss) {
      ss = SpreadsheetApp.create(APP_TITLE + ' 週案の下書き');
      props.setProperty('DRAFT_SSID', ss.getId());
    }
    const sh = ss.getSheets()[0];
    const rows = 73, cols = 13; // A1:M73（週案簿の 週の シートと 同じ 行・列）
    const rng = sh.getRange(1, 1, rows, cols);
    rng.breakApart();
    sh.clear();
    const values = [];
    for (let r = 0; r < rows; r++) { const row = []; for (let c = 0; c < cols; c++) row.push(''); values.push(row); }
    Object.keys(d.cells).forEach(function (addr) {
      const m = String(addr).match(/^([A-M])(\d{1,2})$/);
      if (!m || Number(m[2]) < 1 || Number(m[2]) > rows) return;
      const v = d.cells[addr];
      values[Number(m[2]) - 1][m[1].charCodeAt(0) - 65] = typeof v === 'number' && isFinite(v) ? v : text_(String(v).slice(0, MAX_LONG));
    });
    rng.setValues(values);
    (Array.isArray(d.merges) ? d.merges : []).forEach(function (a1) {
      if (/^[A-M]\d{1,2}:[A-M]\d{1,2}$/.test(a1)) sh.getRange(a1).merge();
    });
    rng.setWrap(true).setVerticalAlignment('top');
    sh.setName(String(d.name || '週案').slice(0, 30));
    return ss.getUrl();
  }
}

/* ---------- 毎週火曜日の朝：次の週の 週案の 下書き ---------- */
// 時間主導型トリガーから 呼ばれる。force＝true なら 曜日に 関係なく 次の週の 分を 作る（メニューから）
function weeklyDraftJob(force) {
  healDraftTrigger_();
  return withLock_(function () {
    const tz = ss_().getSpreadsheetTimeZone();
    const T = {};
    Object.keys(TABLES).forEach(function (k) { T[k] = new Map(readTable_(k, tz).map(function (r) { return [String(r.id), r]; })); });
    const S = {};
    const lib = shared_(T, S);
    Object.assign(S, lib.mergeSettings(readSettings_()));
    const now = lib.today();
    if (force !== true && !S.autoDraft) return { made: 0, message: '「設定」で 自動で 作らない ように なっています。' };
    const mon = lib.addDays(lib.mondayOf(now), 7);
    const wk = T.weeks.get('v' + mon);
    if (force !== true && wk && lib.isDate(wk.draftAt)) return { made: 0, message: '次の週の 下書きは もう できています。' };
    if (!lib.weekDates(mon).some(function (d) { return !lib.offReason(d); })) return { made: 0, message: '次の週は 授業の 日が ありません。' };
    const r = lib.draftRecs(mon);
    if (r.recs.length) writeTable_('weekly', r.recs);
    writeTable_('weeks', [r.mark]);
    if (r.plan) return { made: 0, message: '次の週は 週案簿から 取りこんだ 週案が あるので、下書きは 作りませんでした。' };
    // 週案簿に 貼る 形の スプレッドシートも 作っておく
    r.recs.forEach(function (x) { T.weekly.set(x.id, x); });
    const no = lib.weekNo(mon);
    const url = writeDraftSheet_(String(no || '週案'), lib.shuanboCells(mon).cells, lib.shuanboMerges());
    return { made: r.recs.length, url: url, message: '次の週（' + mon + '〜）の 週案の 下書きを ' + r.recs.length + 'コマ 作りました。\n週案簿に 貼る 形の ファイル：' + url };
  });
}

// app.html の「共通ここから」〜「共通ここまで」を 読みこんで、画面と 同じ 計算を 使う
function shared_(T, S) {
  const html = HtmlService.createHtmlOutputFromFile('app').getContent();
  const re = /\/\* 共通ここから \*\/([\s\S]*?)\/\* 共通ここまで \*\//g;
  const parts = [];
  let m;
  while ((m = re.exec(html))) parts.push(m[1]);
  if (!parts.length) throw new Error('app.html の 共通の 部分が 見つかりません。app.html を 新しいものに 貼りかえてください。');
  const make = new Function('T', 'S', parts.join('\n') +
    '\nreturn { mergeSettings: mergeSettings, draftRecs: draftRecs, shuanboCells: shuanboCells, shuanboMerges: shuanboMerges, weekNo: weekNo, weekDates: weekDates, offReason: offReason, today: today, addDays: addDays, mondayOf: mondayOf, isDate: isDate };');
  return make(T, S);
}

// 朝の トリガーを つける・はずす（同じ ものは 1つだけ）。曜日と 時刻は スクリプトの プロパティに 覚えておく
function apiSetDraftTrigger(on) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === DRAFT_JOB) ScriptApp.deleteTrigger(t);
  });
  const props = PropertiesService.getScriptProperties();
  if (on) {
    ScriptApp.newTrigger(DRAFT_JOB).timeBased().onWeekDay(ScriptApp.WeekDay[DRAFT_WEEKDAY]).atHour(DRAFT_HOUR).create();
    props.setProperty('DRAFT_SCHEDULE', draftSchedule_());
  }
  return draftTriggerOn_();
}

function draftSchedule_() { return DRAFT_WEEKDAY + '@' + DRAFT_HOUR; }

function hasDraftTrigger_() {
  try {
    return ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === DRAFT_JOB; });
  } catch (e) {
    return false;
  }
}

// トリガーが あり、いまの 曜日・時刻で つけた ものなら オン（前の 曜日の ままなら オフと みなす）
function draftTriggerOn_() {
  return hasDraftTrigger_() && PropertiesService.getScriptProperties().getProperty('DRAFT_SCHEDULE') === draftSchedule_();
}

// 前の 版の 曜日で つけた トリガーが 残っていたら、いまの 曜日に つけなおす
function healDraftTrigger_() {
  try {
    if (hasDraftTrigger_() && !draftTriggerOn_()) apiSetDraftTrigger(true);
  } catch (e) { /* トリガーの 管理が 許可されていない ときは そのまま */ }
}

/* ---------- シートの 読み書き ---------- */
function readTable_(kind, tz) {
  const t = table_(kind);
  const values = tableSheet_(kind).getDataRange().getValues();
  if (values.length < 2) return [];
  const header = values[0].map(String);
  const idx = t.cols.map(function (c) { return header.indexOf(c[1]); });
  const list = [];
  for (let i = 1; i < values.length; i++) {
    const rec = {};
    t.cols.forEach(function (c, k) { rec[c[0]] = idx[k] >= 0 ? fromCell_(values[i][idx[k]], c[2], tz) : ''; });
    if (rec.id) list.push(rec);
  }
  return list;
}

function writeTable_(kind, recs) {
  const t = table_(kind);
  const sh = tableSheet_(kind);
  const width = sh.getLastColumn();
  const values = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), width).getValues();
  const header = values[0].map(String);
  const idCol = header.indexOf(COL_ID);
  const updCol = header.indexOf(COL_UPDATED);
  const rowOf = {};
  for (let i = 1; i < values.length; i++) {
    const id = String(values[i][idCol]);
    if (id) rowOf[id] = i;
  }

  // 同じ ID が 2回 来たら あとの ほうを 使う
  const byId = {};
  const order = [];
  recs.forEach(function (rec) {
    const id = rec && cleanId_(rec.id);
    if (!id) return;
    if (!byId[id]) order.push(id);
    byId[id] = rec;
  });

  const now = new Date();
  const appended = [];
  const changed = {};
  order.forEach(function (id) {
    const rec = byId[id];
    const i = rowOf[id];
    // 画面が 知らない 列（先生が 足した列）の 値は そのまま 残す
    const row = i !== undefined ? values[i].map(keepCell_) : header.map(function () { return ''; });
    t.cols.forEach(function (c) {
      const j = header.indexOf(c[1]);
      if (j < 0) return;
      if (c[0] === 'id') row[j] = id;
      else if (Object.prototype.hasOwnProperty.call(rec, c[0])) row[j] = toCell_(rec[c[0]], c[2]);
    });
    if (updCol >= 0) row[updCol] = now;
    if (i !== undefined) { values[i] = row; changed[i] = true; } else appended.push(row);
  });
  const rows = Object.keys(changed).map(Number);
  if (rows.length > BULK) {
    // たくさん 書きかえる ときは、表を まとめて 書きなおす（1行ずつより ずっと 速い）
    const body = values.slice(1).map(function (r, k) { return changed[k + 1] ? r : r.map(keepCell_); });
    sh.getRange(2, 1, body.length, width).setValues(body);
  } else {
    rows.forEach(function (i) { sh.getRange(i + 1, 1, 1, width).setValues([values[i]]); });
  }
  if (appended.length) sh.getRange(values.length + 1, 1, appended.length, width).setValues(appended);
}

function deleteRows_(kind, ids) {
  if (!ids.length) return;
  const sh = tableSheet_(kind);
  const last = sh.getLastRow();
  if (last < 2) return;
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const idCol = header.indexOf(COL_ID) + 1;
  const col = sh.getRange(2, idCol, last - 1, 1).getValues();
  const want = {};
  ids.forEach(function (id) { want[id] = true; });
  const hit = col.filter(function (r) { return want[String(r[0])]; }).length;
  if (!hit) return;
  if (hit > BULK) {
    // たくさん 消す ときは、残す 行だけを 書きなおす
    const width = sh.getLastColumn();
    const body = sh.getRange(2, 1, last - 1, width).getValues();
    const keep = body.filter(function (r) { return !want[String(r[idCol - 1])]; }).map(function (r) { return r.map(keepCell_); });
    sh.getRange(2, 1, last - 1, width).clearContent();
    if (keep.length) sh.getRange(2, 1, keep.length, width).setValues(keep);
    return;
  }
  // 下の 行から 消すと 行番号が ずれない
  for (let i = col.length - 1; i >= 0; i--) {
    if (want[String(col[i][0])]) sh.deleteRow(i + 2);
  }
}

/* ---------- 設定（「設定」シートに 項目ごとに 1行） ---------- */
function readSettings_() {
  const sh = settingsSheet_();
  const last = sh.getLastRow();
  const out = {};
  if (last < 2) return out;
  sh.getRange(2, 1, last - 1, 2).getValues().forEach(function (r) {
    const key = String(r[0]);
    if (!/^[A-Za-z]{1,30}$/.test(key)) return;
    try { out[key] = JSON.parse(String(r[1])); } catch (e) { /* 読めない 行は 使わない */ }
  });
  return out;
}

function writeSettings_(obj) {
  const sh = settingsSheet_();
  const last = sh.getLastRow();
  const keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  let next = Math.max(last, 1) + 1;
  Object.keys(obj).forEach(function (key) {
    if (!/^[A-Za-z]{1,30}$/.test(key)) return;
    const json = JSON.stringify(obj[key]);
    if (json === undefined || json.length > 40000) return;
    const i = keys.indexOf(key);
    const row = i >= 0 ? i + 2 : next++;
    sh.getRange(row, 1, 1, 3).setValues([[key, "'" + json, new Date()]]);
  });
}

/* ---------- 準備 ---------- */
function setup_() {
  Object.keys(TABLES).forEach(tableSheet_);
  settingsSheet_();
  // 最初から ある 空の シートは 消す
  const ss = ss_();
  ['シート1', 'Sheet1'].forEach(function (n) {
    const sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() === 0 && sh.getLastColumn() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
}

// シートが なければ 作り、足りない 見出しが あれば 右に 足す
function tableSheet_(kind) {
  const t = table_(kind);
  const ss = ss_();
  const labels = t.cols.map(function (c) { return c[1]; }).concat([COL_UPDATED]);
  let sh = ss.getSheetByName(t.sheet);
  if (!sh) {
    sh = ss.insertSheet(t.sheet);
    sh.getRange(1, 1, 1, labels.length).setValues([labels]).setFontWeight('bold').setBackground(HEADER_BG);
    sh.setFrozenRows(1);
    if (t.seed) writeTable_(kind, t.seed);
    return sh;
  }
  const width = Math.max(sh.getLastColumn(), 1);
  const header = sh.getRange(1, 1, 1, width).getValues()[0].map(String);
  const missing = labels.filter(function (l) { return header.indexOf(l) < 0; });
  if (missing.length) {
    const start = header.join('') === '' ? 1 : width + 1;
    sh.getRange(1, start, 1, missing.length).setValues([missing]).setFontWeight('bold').setBackground(HEADER_BG);
    if (start === 1) sh.setFrozenRows(1);
  }
  return sh;
}

function settingsSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET_SETTINGS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_SETTINGS);
    sh.getRange(1, 1, 1, 3).setValues([['項目', '値', COL_UPDATED]]).setFontWeight('bold').setBackground(HEADER_BG);
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ---------- 内部で 使う 関数 ---------- */
function table_(kind) {
  if (!Object.prototype.hasOwnProperty.call(TABLES, kind)) throw new Error('知らない種類です：' + kind);
  return TABLES[kind];
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

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function parseList_(json) {
  const list = JSON.parse(json);
  if (!Array.isArray(list)) throw new Error('データの形が正しくありません。');
  if (list.length > MAX_RECORDS) throw new Error('一度に保存できるのは ' + MAX_RECORDS + ' 件までです。');
  return list;
}

function cleanId_(v) {
  const s = String(v === undefined || v === null ? '' : v);
  return /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(s) ? s : '';
}

// 画面の 値 → シートの 値
function toCell_(v, type) {
  if (v === undefined || v === null) return '';
  if (type === 'num') {
    const n = Number(v);
    return v === '' || !isFinite(n) ? '' : n;
  }
  const s = String(v).slice(0, type === 'long' ? MAX_LONG : MAX_TEXT);
  // 日付は シートでも 日付として 並べかえ できるように そのまま 入れる
  if (type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
  return text_(s);
}

// 式・数・日付として 読みかえられないように、先頭に ' を つけて 文字として 入れる
function text_(s) {
  if (s && (/^[=+\-@']/.test(s) || /^[\d\s/.:,-]+$/.test(s))) return "'" + s;
  return s;
}

// すでに ある 行を 書きもどす ときに、文字が 式などに 変わらないように する
function keepCell_(v) {
  return typeof v === 'string' ? text_(v.slice(0, MAX_LONG)) : v;
}

// シートの 値 → 画面の 値（Date は 画面に 渡せないので 文字に する）
function fromCell_(v, type, tz) {
  if (v instanceof Date) {
    if (type === 'time' || v.getFullYear() < 1901) return Utilities.formatDate(v, tz, 'HH:mm');
    return Utilities.formatDate(v, tz, type === 'date' ? 'yyyy-MM-dd' : 'yyyy/MM/dd');
  }
  if (v === null || v === undefined) return '';
  if (type === 'num') return v === '' || !isFinite(Number(v)) ? '' : Number(v);
  const s = String(v);
  if (type === 'date') {
    const m = s.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/);
    return m ? m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2) : '';
  }
  return s;
}
