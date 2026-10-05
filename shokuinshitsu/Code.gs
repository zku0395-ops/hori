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
      ['hours', '時数', 'num'], ['subject2', '教科2'], ['hours2', '時数2', 'num'], ['aim', 'めあて', 'long'], ['head', '1行目', 'long']],
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
      ['likes', '好きなこと・得意なこと', 'long'], ['care', '配慮・支援のポイント', 'long'], ['stages', '教科ごとの段階', 'long']],
  },
  exchange: {
    sheet: '交流',
    cols: [['id', COL_ID], ['childId', '子どもID'], ['day', '曜日(1=月)', 'num'], ['period', '校時ID'], ['subject', '教科'], ['room', '交流先'], ['memo', 'メモ']],
  },
  units: {
    sheet: '単元計画',
    cols: [['id', COL_ID], ['subject', '教科'], ['name', '単元名'], ['start', 'はじめ', 'date'], ['end', 'おわり', 'date'], ['hours', '計画時数', 'num'], ['target', '対象'], ['goal', 'ねらい'], ['memo', 'メモ']],
  },
  // 教科・単元ごとの めあてと 学習内容（週案で 選んで 使う）
  lessonItems: {
    sheet: 'めあて・学習内容の一覧',
    cols: [['id', COL_ID], ['subject', '教科'], ['unitId', '単元ID'], ['no', '時', 'num'], ['aim', 'めあて', 'long'], ['content', '学習内容', 'long'], ['head', '1行目']],
  },
  // スモールステップの 段階表（シートを 作る ときに、app.html の はじめの 内容を 入れる）
  steps: {
    sheet: '段階表',
    cols: [['id', COL_ID], ['subject', '教科'], ['stage', '段階'], ['area', '領域'], ['no', '並び順', 'num'], ['aim', 'めあて', 'long'], ['content', '学習内容', 'long']],
    seed: function () { return stepDefaults_(); },
  },
  materials: {
    sheet: '教材',
    cols: [['id', COL_ID], ['name', '名前'], ['subject', '教科'], ['kind', '種類'], ['url', 'URL'], ['unitId', '単元ID'], ['memo', 'メモ'],
      ['fileId', 'ファイルID'], ['fileName', 'ファイル名'], ['mime', 'ファイルの種類'], ['size', '大きさ（バイト）', 'num'], ['savedAt', '保存した日', 'date'],
      ['files', 'コードのファイル', 'long'], ['src', 'コードの読みこみ元', 'long']],
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
  // 子どもが 段階表の 次の 段階へ 進んだ 記録
  stageLogs: {
    sheet: '段階のあゆみ',
    cols: [['id', COL_ID], ['childId', '子どもID'], ['date', '日付', 'date'], ['subject', '教科'], ['from', 'まえの段階'], ['to', 'つぎの段階'], ['memo', 'メモ', 'long']],
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
  // ここから 研究・研修の部屋
  trainings: {
    sheet: '研修の記録',
    cols: [['id', COL_ID], ['date', '日付', 'date'], ['time', '時刻'], ['title', '研修名'], ['kind', '種類'], ['org', '主催'], ['place', '場所・方法'], ['hours', '時間', 'num'],
      ['learned', '学んだこと', 'long'], ['apply', '学級で生かすこと', 'long'], ['report', '報告書'], ['reportDue', '報告書の締め切り', 'date'], ['url', '資料のリンク'], ['trip', '出張']],
  },
  subs: {
    sheet: '補教',
    cols: [['id', COL_ID], ['date', '日付', 'date'], ['period', '校時ID'], ['trainingId', '研修ID'], ['teacher', '補教の先生'], ['task', 'お願いすること', 'long']],
  },
  research: {
    sheet: '校内研究',
    cols: [['id', COL_ID], ['nendo', '年度', 'num'], ['theme', '研究主題'], ['sub', '副題・研究の重点', 'long'], ['group', '部会'], ['role', '自分の役割'], ['memo', 'メモ', 'long']],
  },
  studies: {
    sheet: '研究授業',
    cols: [['id', COL_ID], ['kind', '種類'], ['date', '日付', 'date'], ['time', '時刻'], ['teacher', '授業者'], ['room', '学級'], ['subject', '教科'], ['unitId', '単元ID'], ['title', '本時の題'],
      ['steps', '終わった段階'], ['aim', '本時の目標', 'long'], ['flow', '本時の展開', 'long'], ['feedback', '協議会での意見', 'long'], ['reflect', 'ふりかえり・学んだこと', 'long']],
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
  // シートの 一覧を 1回だけ 見て、足りない ときだけ 準備する（はじめて 開いた とき・新しい 版に した とき）
  const byName = sheetsByName_(ss);
  const missing = !byName[SHEET_SETTINGS] || Object.keys(TABLES).some(function (k) { return !byName[TABLES[k].sheet]; });
  if (missing) withLock_(setup_);
  const sheets = missing ? sheetsByName_(ss) : byName;
  const tz = ss.getSpreadsheetTimeZone();
  const draftId = PropertiesService.getScriptProperties().getProperty('DRAFT_SSID');
  const out = { settings: readSettings_(), tables: readAllTables_(ss, tz, sheets).tables, sheetUrl: ss.getUrl(), draftTrigger: draftTriggerOn_(), draftSheetUrl: draftId ? 'https://docs.google.com/spreadsheets/d/' + draftId + '/edit' : '' };
  return JSON.stringify(out);
}

function sheetsByName_(ss) {
  const out = {};
  ss.getSheets().forEach(function (sh) { out[sh.getName()] = sh; });
  return out;
}

// 動作チェック（設定の「🩺 動作チェック」から）：個人の 情報は 返さない
function apiDiag() {
  const t0 = Date.now();
  const ss = ss_();
  const byName = sheetsByName_(ss);
  const names = Object.keys(byName);
  // すべての シートを 読む（画面を 開く ときと 同じ 読み方）時間と、記録の 数
  const t1 = Date.now();
  const all = readAllTables_(ss, ss.getSpreadsheetTimeZone(), byName);
  const readMs = Date.now() - t1;
  const rows = {};
  Object.keys(TABLES).forEach(function (k) { rows[k] = byName[TABLES[k].sheet] ? all.tables[k].length : -1; });
  const scriptTz = Session.getScriptTimeZone();
  const sheetTz = ss.getSpreadsheetTimeZone();
  const code = codeApiState_();
  return JSON.stringify({
    scriptTz: scriptTz,
    scriptOffset: Utilities.formatDate(new Date(), scriptTz, 'Z'),
    sheetTz: sheetTz,
    sheetOffset: Utilities.formatDate(new Date(), sheetTz, 'Z'),
    now: Utilities.formatDate(new Date(), sheetTz, 'yyyy-MM-dd HH:mm'),
    sheets: names.length,
    missing: Object.keys(TABLES).map(function (k) { return TABLES[k].sheet; }).filter(function (n) { return names.indexOf(n) < 0; }),
    rows: rows,
    trigger: draftTriggerOn_(),
    readMs: readMs,
    batch: all.batch,
    codeApi: code.state,
    codeFetch: code.fetch,
    ms: Date.now() - t0,
  });
}

/* ---------- 教材置き場の ファイル（自分の Google ドライブの「仮想職員室 教材置き場」） ---------- */
const MAT_FOLDER = '仮想職員室 教材置き場';
const MAX_FILE = 20 * 1024 * 1024; // 1つの ファイルは 20MB まで
function matRoot_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('MAT_FOLDER_ID');
  if (id) {
    try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) { /* 消された ときは 作りなおす */ }
  }
  const root = DriveApp.createFolder(MAT_FOLDER);
  props.setProperty('MAT_FOLDER_ID', root.getId());
  return root;
}
// 教科ごとの 小さい フォルダ
function matFolder_(subject) {
  const root = matRoot_();
  if (!subject) return root;
  const it = root.getFoldersByName(subject);
  return it.hasNext() ? it.next() : root.createFolder(subject);
}
// 教材置き場の フォルダ（か その 中の 教科の フォルダ）に ある ファイルだけ さわる
function matFile_(id) {
  const file = DriveApp.getFileById(String(id));
  const rootId = PropertiesService.getScriptProperties().getProperty('MAT_FOLDER_ID');
  const ps = file.getParents();
  while (ps.hasNext()) {
    const p = ps.next();
    if (p.getId() === rootId) return file;
    const pp = p.getParents();
    while (pp.hasNext()) if (pp.next().getId() === rootId) return file;
  }
  throw new Error('教材置き場の ファイルでは ありません。');
}
// data = { name, mime, data（base64）, subject }
function apiSaveFile(json) {
  const d = JSON.parse(json);
  const name = String(d.name || 'ファイル').replace(/[\\/:*?"<>|]/g, '_').slice(0, 200);
  const bytes = Utilities.base64Decode(String(d.data || ''));
  if (bytes.length > MAX_FILE) throw new Error('20MBを こえる ファイルは 保存できません。Google ドライブに 直接 入れて、リンクを 貼ってください。');
  const blob = Utilities.newBlob(bytes, String(d.mime || 'application/octet-stream'), name);
  const file = withLock_(function () { return matFolder_(String(d.subject || '').slice(0, 30)).createFile(blob); });
  return JSON.stringify({ id: file.getId(), url: file.getUrl(), name: file.getName(), size: file.getSize(), mime: file.getMimeType() });
}
// 文字の ファイル（プログラム・HTML の アプリなど）の 中身
function apiReadFile(id) {
  const file = matFile_(id);
  if (file.getSize() > 5 * 1024 * 1024) throw new Error('大きすぎて 表示できません（5MBまで）。');
  return file.getBlob().getDataAsString('UTF-8');
}
function apiTrashFile(id) {
  matFile_(id).setTrashed(true);
  return true;
}

/* ---------- アプリから コードを 読みこんで 教材置き場に 保存する ---------- */
// src = { type: 'self' }（この 仮想職員室）｜{ type: 'gas', id: 編集画面の URL か スクリプト ID }｜{ type: 'url', urls: [アドレス] }
// 読みこんだ ファイルを 教材置き場（教科の フォルダ）に 保存して、{ title, files: [{ id, name, size, mime, url }], warn } を 返す
const CODE_FILE_MAX = 5 * 1024 * 1024; // コードの ファイルは 1つ 5MB まで（画面で 見られる 大きさ）
function apiImportCode(json) {
  const d = JSON.parse(json);
  let got;
  if (d.type === 'self') got = selfCode_();
  else if (d.type === 'gas') got = gasProject_(scriptIdFrom_(d.id));
  else if (d.type === 'url') got = urlCode_([].concat(d.urls || []));
  else throw new Error('読みこむ ものの 種類が ちがいます。');
  if (!got.files.length) throw new Error('コードの ファイルが 見つかりませんでした。');
  got.files.forEach(function (f) { if (f.text.length > CODE_FILE_MAX) throw new Error('「' + f.name + '」は 大きすぎます（5MBまで）。'); });
  const files = withLock_(function () {
    const folder = matFolder_(String(d.subject || '').slice(0, 30));
    return got.files.map(function (f) {
      const blob = Utilities.newBlob('', f.mime, f.name).setDataFromString(f.text, 'UTF-8');
      const file = folder.createFile(blob);
      return { id: file.getId(), name: file.getName(), size: file.getSize(), mime: file.getMimeType(), url: file.getUrl() };
    });
  });
  return JSON.stringify({ title: got.title || '', files: files, warn: got.warn || '' });
}
// 編集画面の アドレス（…/projects/ID/edit、…/d/ID/edit）か、スクリプト ID そのもの
function scriptIdFrom_(s) {
  s = String(s || '').trim();
  if (/script\.google\.com\/(a\/[^/]+\/)?macros\/s\//.test(s)) throw new Error('これは ウェブアプリの アドレス（…/exec）です。Apps Script の 編集画面の アドレス（…/projects/…/edit）か、「プロジェクトの設定」の スクリプト ID を 入れてください。');
  const m = /\/(?:projects|d)\/([A-Za-z0-9_-]{20,})/.exec(s) || /^([A-Za-z0-9_-]{20,})$/.exec(s);
  if (!m) throw new Error('Apps Script の 編集画面の アドレス（…/projects/…/edit）か、スクリプト ID を 入れてください。');
  return m[1];
}
// Apps Script API で プロジェクトの ファイル（.gs・.html・appsscript.json）を 読む
function gasProject_(scriptId) {
  const base = 'https://script.googleapis.com/v1/projects/' + encodeURIComponent(scriptId);
  const opt = { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true };
  const res = UrlFetchApp.fetch(base + '/content', opt);
  if (res.getResponseCode() !== 200) throw new Error(gasApiError_(res.getResponseCode(), res.getContentText()));
  const body = JSON.parse(res.getContentText() || '{}');
  let title = '';
  try {
    const info = UrlFetchApp.fetch(base, opt);
    if (info.getResponseCode() === 200) title = JSON.parse(info.getContentText() || '{}').title || '';
  } catch (e) { /* 名前が 読めなくても ファイルは 保存する */ }
  const ext = { SERVER_JS: '.gs', HTML: '.html', JSON: '.json' };
  const mime = { SERVER_JS: 'text/plain', HTML: 'text/html', JSON: 'application/json' };
  const files = (body.files || []).filter(function (f) { return ext[f.type]; }).map(function (f) {
    return { name: String(f.name) + ext[f.type], text: String(f.source || ''), mime: mime[f.type] };
  });
  return { title: title, files: files };
}
function gasApiError_(code, text) {
  let msg = '';
  try { msg = (JSON.parse(text).error || {}).message || ''; } catch (e) { msg = String(text || '').slice(0, 200); }
  // 原文も 短く つける（どこで 止まったかを 確かめる ため）
  const raw = '（' + code + (msg ? '：' + msg.slice(0, 160) : '') + '）';
  if (/User has not enabled|usersettings/i.test(msg)) return 'コードを 読む しくみ（Google Apps Script API）が オフです。学校の アカウントで https://script.google.com/home/usersettings を 開いて「Google Apps Script API」を オンに し、数分 待ってから もう一度 ためしてください。' + raw;
  if (/has not been used in project|SERVICE_DISABLED|is disabled/i.test(msg)) return 'この Apps Script の プロジェクト（Google Cloud の 設定）では、Apps Script API が 使えません。この 職員室の コードは「ウェブの アドレス」で GitHub の Raw の アドレスから 読みこめます。' + raw;
  if (/insufficient|scope/i.test(msg)) return 'コードを 読む 許可が まだ ありません。README の「アプリから コードを 読みこむ ための 準備」の とおりに appsscript.json を 新しく して、もう一度 許可してください。' + raw;
  if (code === 404) return 'プロジェクトが 見つかりません。アドレスか スクリプト ID を 確かめてください。' + raw;
  if (code === 403) return 'この プロジェクトを 読む 権限が ありません（自分が 編集できる プロジェクトだけ 読めます）。' + raw;
  return 'コードを 読めませんでした' + raw;
}
// この 仮想職員室の コード。Apps Script API が まだ 使えない ときは、画面（app.html）だけ 保存する
function selfCode_() {
  try {
    const got = gasProject_(ScriptApp.getScriptId());
    if (!got.title) got.title = APP_TITLE;
    return got;
  } catch (e) {
    return {
      title: APP_TITLE,
      files: [{ name: 'app.html', text: HtmlService.createHtmlOutputFromFile('app').getContent(), mime: 'text/html' }],
      warn: 'Code.gs は 読めなかったので、画面（app.html）だけ 保存しました。' + (e && e.message ? e.message : e),
    };
  }
}
// ウェブの アドレスから 読む（GitHub の ファイルの ページは、文字だけの ページ（raw）に なおす）
function urlCode_(urls) {
  urls = urls.map(function (u) { return String(u || '').trim(); }).filter(Boolean).slice(0, 20);
  if (!urls.length) throw new Error('アドレスを 入れてください。');
  let title = '';
  const files = urls.map(function (u) {
    const url = u.replace(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\//, 'https://raw.githubusercontent.com/$1/$2/');
    if (!/^https:\/\/[^\s]+$/.test(url)) throw new Error('https:// で 始まる アドレスを 入れてください：' + u);
    if (/script\.google\.com\/(a\/[^/]+\/)?macros\/s\//.test(url)) throw new Error('Apps Script の ウェブアプリは、アドレスからは コードを 読めません。「Apps Script の プロジェクト」を 選んで、編集画面の アドレスを 入れてください。');
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    const code = res.getResponseCode();
    if (code !== 200) throw new Error('読みこめませんでした（' + code + '）：' + u);
    const headers = res.getHeaders() || {};
    const type = String(headers['Content-Type'] || headers['content-type'] || '').toLowerCase();
    if (type && !/^text\/|javascript|json|xml/.test(type)) throw new Error('コードの ファイルでは ありません（' + type.split(';')[0] + '）：' + u);
    const text = res.getContentText('UTF-8');
    const path = url.replace(/[?#].*$/, '').replace(/^https:\/\/[^/]+/, '');
    let name = path.split('/').pop() || '';
    try { name = decodeURIComponent(name); } catch (e) { /* そのまま */ }
    name = name || 'index.html';
    if (!/\.[A-Za-z0-9]{1,5}$/.test(name)) name += /html/.test(type) || /^\s*</.test(text) ? '.html' : '.txt';
    name = name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 100);
    if (!title) { const t = /<title[^>]*>([^<]{1,80})<\/title>/i.exec(text); if (t) title = t[1].trim(); }
    const mime = /\.html?$/i.test(name) ? 'text/html' : /\.json$/i.test(name) ? 'application/json' : 'text/plain';
    return { name: name, text: text, mime: mime };
  });
  return { title: title, files: files };
}
// 動作チェック用：この プロジェクトの コードを 読めるか（state：'ok'｜理由、fetch：ウェブに つなぐ 許可が あるか）
function codeApiState_() {
  try {
    const res = UrlFetchApp.fetch('https://script.googleapis.com/v1/projects/' + encodeURIComponent(ScriptApp.getScriptId()), { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    return { fetch: true, state: res.getResponseCode() === 200 ? 'ok' : gasApiError_(res.getResponseCode(), res.getContentText()) };
  } catch (e) {
    return { fetch: false, state: 'ウェブに つなぐ 許可が まだ ありません。Apps Script の 画面で 関数「apiDiag」を「実行」して 許可してください。（' + (e && e.message ? e.message : e) + '）' };
  }
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
    const all = readAllTables_(ss_(), tz).tables;
    Object.keys(TABLES).forEach(function (k) { T[k] = new Map(all[k].map(function (r) { return [String(r.id), r]; })); });
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

// 段階表の はじめの 内容（app.html の「段階表ここから」〜「段階表ここまで」）
function stepDefaults_() {
  const html = HtmlService.createHtmlOutputFromFile('app').getContent();
  const m = html.match(/\/\* 段階表ここから \*\/([\s\S]*?)\/\* 段階表ここまで \*\//);
  if (!m) return [];
  return new Function(m[1] + '\nreturn stepRows();')();
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
// 見出しと 中身を 1回で 読む（sh を 渡せば シートを さがす 手間も はぶく）
function readTable_(kind, tz, sh) {
  const t = table_(kind);
  let values = (sh || tableSheet_(kind)).getDataRange().getValues();
  // 新しい 版で 見出しが 足りない ときだけ、足してから 読みなおす
  if (!hasHeader_(t, values)) values = withLock_(function () { return tableSheet_(kind).getDataRange().getValues(); });
  return valuesToRecs_(kind, values, tz, false);
}
function hasHeader_(t, values) {
  const header = (values[0] || []).map(String);
  return t.cols.every(function (c) { return header.indexOf(c[1]) >= 0; });
}

// すべての 表を 読む。Apps Script の「サービス」に Google Sheets API を 足して あれば、1回で まとめて 読む（速い）
function readAllTables_(ss, tz, sheets) {
  const kinds = Object.keys(TABLES);
  const batch = batchValues_(ss, kinds.map(function (k) { return TABLES[k].sheet; }));
  const tables = {};
  kinds.forEach(function (kind) {
    const t = TABLES[kind];
    const values = batch && batch[t.sheet];
    tables[kind] = values && hasHeader_(t, values) ? valuesToRecs_(kind, values, tz, true) : readTable_(kind, tz, sheets && sheets[t.sheet]);
  });
  return { tables: tables, batch: !!batch };
}
function batchValues_(ss, names) {
  if (typeof Sheets === 'undefined' || !Sheets.Spreadsheets || !Sheets.Spreadsheets.Values) return null;
  try {
    const res = Sheets.Spreadsheets.Values.batchGet(ss.getId(), {
      ranges: names.map(function (n) { return "'" + n.replace(/'/g, "''") + "'"; }),
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'SERIAL_NUMBER',
    });
    const out = {};
    (res.valueRanges || []).forEach(function (vr, i) { out[names[i]] = vr.values || []; });
    return out;
  } catch (e) {
    console.warn('Google Sheets API で まとめて 読めませんでした：' + e);
    return null;
  }
}
// シートの 日付の 通し番号（1899年12月30日から 何日目か）を 'yyyy-MM-dd' に
function serialToYmd_(v) {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(Number(v) * 86400000));
  return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
}
// 読んだ 値を 記録に する（serial：日付が 通し番号で 来る 読み方）
function valuesToRecs_(kind, values, tz, serial) {
  const t = table_(kind);
  if (values.length < 2) return [];
  const header = values[0].map(String);
  const idx = t.cols.map(function (c) { return header.indexOf(c[1]); });
  const list = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i] || [];
    const rec = {};
    t.cols.forEach(function (c, k) {
      if (idx[k] < 0) { rec[c[0]] = ''; return; }
      let v = row[idx[k]];
      if (v === undefined) v = '';
      if (serial && c[2] === 'date' && typeof v === 'number') v = serialToYmd_(v);
      rec[c[0]] = fromCell_(v, c[2], tz);
    });
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
    if (t.seed) writeTable_(kind, typeof t.seed === 'function' ? t.seed() : t.seed);
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
