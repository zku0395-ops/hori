// なぞとき プリントの データを 作ります。
//   node nazotokiprint/tools/make-data.js            … 確かめて、data/print.js と ichiran.md を 書き出す
//   node nazotokiprint/tools/make-data.js --html 出力先.html … 先生に 見せる 一覧表（HTML）も 書き出す
// れんしゅうプリントの 文章は アプリ（nazotoki/tools/mondai.js）から、テストの 文章は data/tests.js から とります。
const fs = require('fs');
const path = require('path');
const { L1, L2 } = require('../../nazotoki/tools/mondai.js');
const B = require('../../nazotoki/tools/build.js');
const { T1, T2 } = require('../data/tests.js');

const ROOT = path.join(__dirname, '..');
const { KEYS, DEFAULT_Q, plain, ruby } = B;

// れんしゅうプリントに 使う 文章（各ステージから 2つ。人・動物・場面が かたよらないように、5人の 名前の 文章も 入れる）
const PICK1 = ['1-02', '1-05', '1-07', '1-09', '1-11', '1-14', '1-16', '1-19', '1-21', '1-22', '1-26', '1-28', '1-32', '1-34', '1-36', '1-39', '1-42', '1-43', '1-46', '1-48'];
const PICK2 = ['2-01', '2-03', '2-06', '2-10', '2-12', '2-13', '2-16', '2-17', '2-22', '2-23', '2-26', '2-30', '2-31', '2-34', '2-36', '2-40', '2-42', '2-44', '2-46', '2-48'];

// テストの 文章を 確かめる（アプリと 同じ きまり。50こ ある かの きまりは のぞく）
B.errors.length = 0;
B.check(T1, 1);
B.check(T2, 2);
const errs = B.errors.filter((e) => !/文章が \d+こ/.test(e));
const ids = new Set([...L1, ...L2].map((m) => m.id));
[...PICK1, ...PICK2].forEach((id) => { if (!ids.has(id)) errs.push(`れんしゅうの ${id} が アプリに ありません`); });
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }

// プリントでは、どの 文章も 4つとも 聞く
const q = (m, k) => (m.q && m.q[k]) || DEFAULT_Q[k];
function choose(m, pool) {
  return { id: m.id, st: m.st, t: m.t, span: Object.fromEntries(KEYS.map((k) => [k, m[k]])),
    qs: Object.fromEntries(KEYS.map((k) => [k, { q: q(m, k), a: m[k], ng: B.choicesFor(m, k, pool).map((x) => x.t) }])) };
}
function write(m) {
  return { id: m.id, st: m.st, t: m.t, span: Object.fromEntries(KEYS.map((k) => [k, m[k]])),
    qs: Object.fromEntries(KEYS.map((k) => [k, { q: q(m, k), a: m.k[k].a, f: m.k[k].f }])) };
}
// アプリでは 聞いていない 手がかりの 選択肢を、プリント用に 足す（「げんかん」と「いえ」のように、どちらも 正しく みえる ものを さける）
const PRACTICE_NG = {
  '1-11': { doko: ['へや', 'だいどころ'] },
};
const byId = (list, id) => { const m = list.find((x) => x.id === id); const add = PRACTICE_NG[id]; return add ? { ...m, ng: { ...(m.ng || {}), ...add } } : m; };
const DATA = {
  practice1: PICK1.map((id) => choose(byId(L1, id), L1)),
  practice2: PICK2.map((id) => write(byId(L2, id))),
  test1: T1.map((m) => choose(m, [...T1, ...L1])),
  test2: T2.map((m) => write(m)),
};
fs.writeFileSync(path.join(ROOT, 'data', 'print.js'),
  '// このファイルは nazotokiprint/tools/make-data.js が 作ります（手で 直さないでください）\nwindow.NAZOPRINT = ' + JSON.stringify(DATA) + ';\n');
console.log('data/print.js を 書き出しました');

// ── 一覧表
const box = (f, a) => f.replace('＿', '□'.repeat([...a].length));
const KN = { itsu: 'いつ', doko: 'どこで', dare: 'だれが', nani: 'なにを した' };
const SRC = Object.fromEntries([...L1, ...L2, ...T1, ...T2].map((m) => [m.id, m]));
function md() {
  let s = '# なぞとき プリントの 文章と答えの一覧表\n\nこの表は `nazotokiprint/tools/make-data.js` で 自動で 作っています。\n\n';
  s += '- **太字** が答えです。（ ）の中は、○を つける プリントの まちがいやすい選択肢です。\n- 書く プリントの □ は、子どもが 書くところです。\n\n';
  const part = (title, list, kind) => {
    s += `## ${title}\n\n| 番号 | 文章 | いつ | どこで | だれが | なにを した |\n|---|---|---|---|---|---|\n`;
    list.forEach((m) => {
      const cells = KEYS.map((k) => {
        const x = m.qs[k];
        let c = kind === 1 ? `**${ruby(x.a)}**（${x.ng.map(ruby).join('／')}）` : `**${ruby(box(x.f, x.a))}**（${x.a}）`;
        if (SRC[m.id].q && SRC[m.id].q[k]) c += `<br>問い：${ruby(x.q)}`;
        return c;
      });
      s += `| ${m.id} | ${m.t.map(ruby).join('<br>')} | ${cells.join(' | ')} |\n`;
    });
    s += '\n';
  };
  part('テスト（○を つける・5まい）', DATA.test1, 1);
  part('テスト（書く・5まい）', DATA.test2, 2);
  part('れんしゅう（○を つける・20まい）', DATA.practice1, 1);
  part('れんしゅう（書く・20まい）', DATA.practice2, 2);
  return s;
}
fs.writeFileSync(path.join(ROOT, 'ichiran.md'), md());
console.log('ichiran.md を 書き出しました');

const hi = process.argv.indexOf('--html');
if (hi > 0) {
  const C = { itsu: '#ef4444', doko: '#16a34a', dare: '#2563eb', nani: '#ca8a04' };
  const mark = (t, m) => { let h = ruby(t); KEYS.forEach((k) => { h = h.replace(ruby(m.span[k]), () => `<span style="border-bottom:3px solid ${C[k]}">${ruby(m.span[k])}</span>`); }); return h; };
  let h = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>なぞとき プリントの一覧表</title>
<link href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap" rel="stylesheet">
<style>body{font-family:'BIZ UDPGothic',sans-serif;margin:0;padding:16px;background:#fffdf7;color:#1e293b}h1{font-size:22px}h2{margin-top:28px;padding:6px 12px;background:#92400e;color:#fff;border-radius:8px;font-size:19px}
table{border-collapse:collapse;width:100%;font-size:15px;background:#fff}th,td{border:1px solid #d6d3d1;padding:6px 8px;vertical-align:top;line-height:1.9}th{background:#fef3c7;font-size:14px}
td.id{white-space:nowrap;color:#78716c;font-size:13px}td.txt{min-width:240px}rt{font-size:.55em;color:#57534e}.a{font-weight:700}.ng{color:#78716c;font-size:13px}.q{font-size:12px;color:#7c3aed}.pic{font-size:13px;color:#57534e}.new{background:#dcfce7;color:#166534;border-radius:6px;padding:0 6px;font-size:12px;font-weight:700}
.legend{font-size:14px;background:#fff;border:1px solid #e7e5e4;border-radius:8px;padding:8px 12px}</style></head><body>
<h1>🔎 なぞとき プリント：文章と答えの一覧表（たたき台）</h1>
<div class="legend">・<b>テスト</b>は、アプリに ない 新しい 文章です（挿絵は これから Canva で 作ります）。<b>れんしゅう</b>は、アプリと 同じ 文章・同じ挿絵です。<br>
・<b>太字</b>が答えです。灰色の字は、○を つける プリントで いっしょに出す「まちがいやすい選択肢」です。書く プリントの □ は、子どもが 書くところです。<br>
・<span class="q">むらさきの字</span>は、2文・3文の文章で使う問いかけです（書いていないところは「いつの おはなしかな？」などの ふつうの問いかけです）。<br>
・どのプリントも、4つの手がかりを 全部 聞きます。</div>`;
  const part = (title, list, kind, isTest) => {
    h += `<h2>${title}</h2><table><tr><th>番号</th><th>文章</th><th>いつ</th><th>どこで</th><th>だれが</th><th>なにを した</th>${isTest ? '<th>挿絵（これから作る）</th>' : ''}</tr>`;
    list.forEach((m) => {
      const o = SRC[m.id];
      h += `<tr><td class="id">${m.id}${isTest ? '<br><span class="new">新しい文章</span>' : ''}</td><td class="txt">${m.t.map((t) => mark(t, m)).join('<br>')}</td>`;
      KEYS.forEach((k) => {
        const x = m.qs[k];
        h += '<td>' + (o.q && o.q[k] ? `<div class="q">${ruby(x.q)}</div>` : '');
        h += kind === 1 ? `<div class="a">${ruby(x.a)}</div><div class="ng">${x.ng.map(ruby).join('<br>')}</div>` : `<div class="a">${ruby(box(x.f, x.a))}</div><div class="ng">こたえ：${x.a}</div>`;
        h += '</td>';
      });
      h += (isTest ? `<td class="pic">${o.pic}</td>` : '') + '</tr>';
    });
    h += '</table>';
  };
  part('テスト（○を つける）5まい', DATA.test1, 1, true);
  part('テスト（書く）5まい', DATA.test2, 2, true);
  part('れんしゅう（○を つける）20まい', DATA.practice1, 1, false);
  part('れんしゅう（書く）20まい', DATA.practice2, 2, false);
  h += '</body></html>';
  fs.writeFileSync(process.argv[hi + 1], h);
  console.log('HTML を 書き出しました');
}
