// 問題のデータ（mondai.js）を確かめて、選択肢をつくり、一覧表を書き出します。
//   node nazotoki/tools/build.js            … 確かめて、nazotoki/ichiran.md を書き出す
//   node nazotoki/tools/build.js --html 出力先.html … 先生に見せる一覧表（HTML）も書き出す
//   node nazotoki/tools/build.js --app      … nazotoki/index.html の問題データを書きかえる
const fs = require('fs');
const path = require('path');
const { L1, L2, POOL } = require('./mondai.js');

const ROOT = path.join(__dirname, '..');
const KANJI1 = '一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六';
const KEYS = ['itsu', 'doko', 'dare', 'nani'];
const NAME = { itsu: 'いつ', doko: 'どこで', dare: 'だれが', nani: 'なにを した' };
const DEFAULT_Q = { itsu: 'いつの おはなしかな？', doko: 'どこで したのかな？', dare: 'だれが したのかな？', nani: 'なにを したのかな？' };

const plain = (s) => s.replace(/\{([^|}]+)\|([^}]+)\}/g, '$1');   // 漢字のまま
const yomi = (s) => s.replace(/\{([^|}]+)\|([^}]+)\}/g, '$2');    // ひらがなに
const ruby = (s) => s.replace(/\{([^|}]+)\|([^}]+)\}/g, '<ruby>$1<rt>$2</rt></ruby>');

// きまった順に まぜる（毎回 同じ 選択肢に なるように）
function seeded(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
function shuffle(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const errors = [];
function check(list, level) {
  const ids = new Set();
  for (const m of list) {
    if (ids.has(m.id)) errors.push(`${m.id}: id が かさなっています`);
    ids.add(m.id);
    const all = [m.t.join(''), ...KEYS.map((k) => m[k]), ...Object.values(m.q || {}), ...Object.values(m.ng || {}).flat(), ...Object.values(m.k || {}).map((x) => x.f)].join('');
    for (const c of plain(all)) {
      if (/[一-鿿]/.test(c) && !KANJI1.includes(c)) errors.push(`${m.id}: 1年生で ならわない 漢字「${c}」`);
    }
    // ふりがなの ない 漢字
    const bare = all.replace(/\{[^}]+\}/g, '');
    if (/[一-鿿]/.test(bare)) errors.push(`${m.id}: ふりがなの ない 漢字 → ${bare.match(/[一-鿿]/g).join('')}`);
    const text = m.t.join('');
    for (const k of KEYS) {
      if (!m[k]) errors.push(`${m.id}: ${k} が ありません`);
      else if (!text.includes(m[k])) errors.push(`${m.id}: ${k}「${m[k]}」が 文章の なかに ありません`);
      else if (m.t.filter((x) => x.includes(m[k])).length > 1 && !(m.pos && m.pos[k] != null)) errors.push(`${m.id}: ${k}「${m[k]}」が 2つ以上の文に あります（pos を 書いてください）`);
      else if (m.pos && m.pos[k] != null && !(m.t[m.pos[k]] || '').includes(m[k])) errors.push(`${m.id}: pos.${k} の 文に「${m[k]}」が ありません`);
    }
    if (m.st <= 4 && !m.ask) errors.push(`${m.id}: ask が ありません`);
    if (m.st === 8 || m.st === 10) for (const k of KEYS) if (!(m.q && m.q[k])) errors.push(`${m.id}: q.${k} が ありません`);
    if (level === 2) {
      for (const k of KEYS) {
        const kk = m.k && m.k[k];
        if (!kk) { errors.push(`${m.id}: k.${k} が ありません`); continue; }
        if (!kk.f.includes('＿')) errors.push(`${m.id}: k.${k}.f に ＿ が ありません`);
        const full = yomi(kk.f.replace('＿', kk.a)).replace(/\s/g, '');
        const ans = yomi(m[k]).replace(/\s/g, '');
        // わくに 入れた 形が、答えの よみと あうか（「〜ました」の 形は 文章と くらべる）
        if (!yomi(text).replace(/\s/g, '').includes(full) && full !== ans) errors.push(`${m.id}: k.${k}「${full}」が 文章と あいません`);
        if (/[^ぁ-んァ-ヶー]/.test(kk.a)) errors.push(`${m.id}: k.${k}.a「${kk.a}」に ひらがな・カタカナ いがいの 字`);
      }
    }
  }
  if (list.length !== 50) errors.push(`レベル${level}: 文章が ${list.length}こ です（50こ にします）`);
}

// レベル1の 選択肢（答え＋まちがいやすい 3つ）
function choicesFor(m, key, all) {
  const rnd = seeded(m.id + key);
  const text = plain(m.t.join(''));
  const ans = m[key];
  const out = [];
  const add = (w) => { if (w && out.length < 3 && w !== ans && !out.includes(w)) out.push(w); };
  ((m.ng && m.ng[key]) || []).forEach(add);
  if (key === 'nani') {
    shuffle(all.filter((x) => x.id !== m.id).map((x) => x.nani), rnd).forEach(add);
  } else {
    const cross = { itsu: 'doko', doko: 'itsu', dare: 'doko' }[key];
    add(m[cross]);
    const groups = POOL[key];
    const ok = (w) => !text.includes(plain(w)) && !plain(w).includes(plain(ans)) && !plain(ans).includes(plain(w));
    const mine = groups.filter((g) => g.includes(ans));
    shuffle(mine.flat().filter(ok), rnd).forEach(add);
    shuffle(groups.flat().filter(ok), rnd).forEach(add);
  }
  // まちがいの 種類：cross＝ほかの 手がかりの 答え、trap＝文の 中の 別の ことば、near＝にている ことば
  return out.map((w) => ({
    t: w,
    e: KEYS.some((k) => k !== key && m[k] === w) ? 'cross' : text.includes(plain(w)) ? 'trap' : 'near',
  }));
}

function asks(m) { return m.st <= 4 ? [m.ask] : KEYS; }

function buildData() {
  const lv1 = L1.map((m) => {
    const qs = {};
    for (const k of asks(m)) qs[k] = { q: (m.q && m.q[k]) || DEFAULT_Q[k], a: m[k], ng: choicesFor(m, k, L1) };
    return { id: m.id, st: m.st, t: m.t, span: Object.fromEntries(KEYS.map((k) => [k, m[k]])), pos: m.pos || {}, qs };
  });
  const lv2 = L2.map((m) => {
    const qs = {};
    for (const k of asks(m)) qs[k] = { q: (m.q && m.q[k]) || DEFAULT_Q[k], a: m.k[k].a, f: m.k[k].f, other: KEYS.filter((x) => x !== k).map((x) => m.k[x].a) };
    return { id: m.id, st: m.st, t: m.t, span: Object.fromEntries(KEYS.map((k) => [k, m[k]])), pos: m.pos || {}, qs };
  });
  return { lv1, lv2 };
}

check(L1, 1);
check(L2, 2);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const data = buildData();
const STAGE_NAME = {
  1: '1文・だれが', 2: '1文・どこで', 3: '1文・いつ', 4: '1文・なにを した', 5: '1文・4つとも',
  6: '1文・4つとも（ならびかえ）', 7: '2文', 8: '2文（にている ことばが 2つ）', 9: '3文', 10: '3文（にている ことばが いくつも）',
};

// ── 一覧表（Markdown）
function md() {
  const box = (f, a) => f.replace('＿', '□'.repeat([...a].length));
  let s = '# 文章と答えの一覧表（ワンダせんせいの なぞとき たんていじむしょ）\n\n';
  s += 'この表は `nazotoki/tools/mondai.js` から自動で作っています。直すときは mondai.js を直し、`node nazotoki/tools/build.js` を動かします。\n\n';
  s += '- **太字** が答えです。（ ）の中は、レベル1で いっしょに出る まちがいやすい選択肢です。\n- ステージ1〜4は、★の手がかりだけを聞きます。ステージ5からは4つとも聞きます。\n- レベル2の □ は、子どもが50音表で打つところです。\n\n';
  for (const [lv, list, src] of [[1, data.lv1, L1], [2, data.lv2, L2]]) {
    s += `## レベル${lv}（${lv === 1 ? '4つの選択肢から選ぶ' : '50音表から入力する'}）\n\n`;
    for (let st = 1; st <= 10; st++) {
      s += `### ステージ${st}：${STAGE_NAME[st]}\n\n| 番号 | 文章 | いつ | どこで | だれが | なにを した | 挿絵 |\n|---|---|---|---|---|---|---|\n`;
      for (const m of list.filter((x) => x.st === st)) {
        const o = src.find((x) => x.id === m.id);
        const cells = KEYS.map((k) => {
          const q = m.qs[k];
          if (!q) return ruby(o[k]);
          let c = (m.st <= 4 ? '★' : '') + `**${ruby(o[k])}**`;
          if (lv === 1) c += `（${q.ng.map((x) => ruby(x.t)).join('／')}）`;
          else c += `<br>${ruby(box(q.f, q.a))}`;
          if (o.q && o.q[k]) c += `<br>問い：${ruby(o.q[k])}`;
          return c;
        });
        s += `| ${m.id} | ${m.t.map(ruby).join('<br>')} | ${cells.join(' | ')} | ${o.pic} |\n`;
      }
      s += '\n';
    }
  }
  return s;
}

fs.writeFileSync(path.join(ROOT, 'ichiran.md'), md());
console.log('ichiran.md を 書き出しました');

// ── 先生に見せる一覧表（HTML）
const hi = process.argv.indexOf('--html');
if (hi > 0) {
  const COLORS = { itsu: '#ef4444', doko: '#16a34a', dare: '#2563eb', nani: '#ca8a04' };
  const mark = (t, o) => {
    let h = ruby(t);
    for (const k of KEYS) h = h.replace(ruby(o[k]), () => `<span style="border-bottom:3px solid ${COLORS[k]}">${ruby(o[k])}</span>`);
    return h;
  };
  const box = (f, a) => ruby(f).replace('＿', `<span class="box">${'□'.repeat([...a].length)}</span>`);
  let h = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>文章と答えの一覧表</title>
<link href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap" rel="stylesheet">
<style>body{font-family:'BIZ UDPGothic',sans-serif;margin:0;padding:16px;background:#fffdf7;color:#1e293b}h1{font-size:22px}h2{margin-top:32px;padding:6px 12px;background:#92400e;color:#fff;border-radius:8px;font-size:20px}h3{font-size:17px;margin:20px 0 6px;color:#92400e}
table{border-collapse:collapse;width:100%;font-size:15px;background:#fff}th,td{border:1px solid #d6d3d1;padding:6px 8px;vertical-align:top;line-height:1.9}th{background:#fef3c7;font-size:14px}
td.id{white-space:nowrap;color:#78716c;font-size:13px}td.txt{min-width:240px}rt{font-size:.55em;color:#57534e}.a{font-weight:700}.ng{color:#78716c;font-size:13px}.q{font-size:12px;color:#7c3aed}.ask{background:#fef9c3}.pic{font-size:13px;color:#57534e}.box{letter-spacing:.1em;color:#0f766e;font-weight:700}
.dot{display:inline-block;width:12px;height:3px;vertical-align:middle;margin:0 4px}.legend{font-size:14px;background:#fff;border:1px solid #e7e5e4;border-radius:8px;padding:8px 12px}.muted{color:#a8a29e}
@media print{body{padding:0}h2{break-before:page}}</style></head><body>
<h1>🔎 ワンダせんせいの なぞとき たんていじむしょ<br>文章と答えの一覧表（たたき台）</h1>
<div class="legend">
<b>見かた</b><br>
・文章の下線の色：<span class="dot" style="background:${COLORS.itsu}"></span>いつ <span class="dot" style="background:${COLORS.doko}"></span>どこで <span class="dot" style="background:${COLORS.dare}"></span>だれが <span class="dot" style="background:${COLORS.nani}"></span>なにを した（ヒント2で出す色です）<br>
・<b>太字</b>が答えです。レベル1の灰色の字は、いっしょに出す「まちがいやすい選択肢」です。<br>
・ステージ1〜4は、黄色のマスの手がかりだけを聞きます。うすい字のところは聞きません。<br>
・レベル2の <span class="box">□□</span> は、子どもが50音表で打つところです。□の数が字の数です。<br>
・<span class="q">むらさきの字</span>は、2文・3文の文章で使う問いかけです（書いていないところは「いつの おはなしかな？」などの ふつうの問いかけです）。
</div>`;
  for (const [lv, list, src] of [[1, data.lv1, L1], [2, data.lv2, L2]]) {
    h += `<h2>レベル${lv}　${lv === 1 ? '4つの選択肢から えらぶ' : '50音表から 入力する'}（50の文章）</h2>`;
    for (let st = 1; st <= 10; st++) {
      h += `<h3>ステージ${st}：${STAGE_NAME[st]}</h3><table><tr><th>番号</th><th>文章</th><th style="color:${COLORS.itsu}">いつ</th><th style="color:${COLORS.doko}">どこで</th><th style="color:${COLORS.dare}">だれが</th><th style="color:${COLORS.nani}">なにを した</th><th>挿絵</th></tr>`;
      for (const m of list.filter((x) => x.st === st)) {
        const o = src.find((x) => x.id === m.id);
        h += `<tr><td class="id">${m.id}</td><td class="txt">${m.t.map((t) => mark(t, o)).join('<br>')}</td>`;
        for (const k of KEYS) {
          const q = m.qs[k];
          if (!q) { h += `<td class="muted">${ruby(o[k])}</td>`; continue; }
          h += `<td class="${m.st <= 4 ? 'ask' : ''}">`;
          if (o.q && o.q[k]) h += `<div class="q">${ruby(o.q[k])}</div>`;
          if (lv === 1) h += `<div class="a">${ruby(o[k])}</div><div class="ng">${q.ng.map((x) => ruby(x.t)).join('<br>')}</div>`;
          else h += `<div class="a">${box(q.f, q.a)}</div><div class="ng">こたえ：${q.a}</div>`;
          h += '</td>';
        }
        h += `<td class="pic">${o.pic}</td></tr>`;
      }
      h += '</table>';
    }
  }
  h += '</body></html>';
  fs.writeFileSync(process.argv[hi + 1], h);
  console.log('HTML を 書き出しました：' + process.argv[hi + 1]);
}

// ── アプリ（index.html）に 問題データを 入れる
if (process.argv.includes('--app')) {
  const file = path.join(ROOT, 'index.html');
  const src = fs.readFileSync(file, 'utf8');
  const re = /(\/\*@@DATA\*\/)[\s\S]*?(\/\*@@END\*\/)/;
  if (!re.test(src)) { console.error('index.html に /*@@DATA*/ … /*@@END*/ が ありません'); process.exit(1); }
  fs.writeFileSync(file, src.replace(re, (m, a, b) => a + JSON.stringify(data) + b));
  console.log('index.html の 問題データを 書きかえました');
}

module.exports = { buildData };
