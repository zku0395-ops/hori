// 書き順データを作る：node kanji3/tools/strokes.js
// ・KanjiVG（https://kanjivg.tagaini.net/）の SVG を ダウンロードして、data/strokes.js を作ります
// ・ひらがなの 書き順は、2年生のアプリ（kanji2/data/strokes.js）から そのまま 使います
// ・10画以上の字は、部品（KANJI_PARTS）も 作ります。分け方が 合わない字は、下の FIX で 直します
const fs = require('fs');
const path = require('path');
const https = require('https');
const root = path.join(__dirname, '..');
const cache = process.env.KVG_CACHE || path.join(require('os').tmpdir(), 'kanjivg-cache');
fs.mkdirSync(cache, { recursive: true });

const GRADE3 = '悪安暗医委意育員院飲運泳駅央横屋温化荷界開階寒感漢館岸起期客究急級宮球去橋業曲局銀区苦具君係軽血決研県庫湖向幸港号根祭皿仕死使始指歯詩次事持式実写者主守取酒受州拾終習集住重宿所暑助昭消商章勝乗植申身神真深進世整昔全相送想息速族他打対待代第題炭短談着注柱丁帳調追定庭笛鉄転都度投豆島湯登等動童農波配倍箱畑発反坂板皮悲美鼻筆氷表秒病品負部服福物平返勉放味命面問役薬由油有遊予羊洋葉陽様落流旅両緑礼列練路和';

// 部品の分け方を 手で 直す字（[部品の名前, 画の番号の はじめ, おわり]）
const FIX = {
  開: [['門', 0, 7], ['开', 8, 11]],
  問: [['門', 0, 7], ['口', 8, 10]],
  悲: [['非', 0, 7], ['心', 8, 11]],
  館: [['飠', 0, 7], ['官', 8, 15]],
  勉: [['免', 0, 7], ['力', 8, 9]],
};

const get = (url) => new Promise((ok, ng) => {
  https.get(url, (res) => {
    if (res.statusCode !== 200) { ng(new Error(url + ' ' + res.statusCode)); res.resume(); return; }
    let b = ''; res.setEncoding('utf8'); res.on('data', (c) => (b += c)); res.on('end', () => ok(b));
  }).on('error', ng);
});
async function svgOf(ch) {
  const code = ch.codePointAt(0).toString(16).padStart(5, '0');
  const f = path.join(cache, code + '.svg');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  const t = await get(`https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${code}.svg`);
  fs.writeFileSync(f, t);
  return t;
}

// SVG の g と path を 木の形に する
function parse(svg) {
  const body = svg.slice(svg.indexOf('<g id="kvg:StrokePaths'), svg.indexOf('<g id="kvg:StrokeNumbers'));
  const re = /<g([^>]*)>|<\/g>|<path([^>]*)\/>/g;
  const top = { kids: [], attrs: {} }, st = [top];
  let m, n = 0;
  const attrs = (s) => { const a = {}; (s || '').replace(/([\w:]+)="([^"]*)"/g, (_, k, v) => { a[k] = v; }); return a; };
  while ((m = re.exec(body))) {
    if (m[0] === '</g>') { st.pop(); continue; }
    if (m[1] !== undefined) { const g = { kids: [], attrs: attrs(m[1]) }; st[st.length - 1].kids.push(g); st.push(g); continue; }
    const a = attrs(m[2]);
    st[st.length - 1].kids.push({ path: a.d, i: n++ });
  }
  return top;
}
const strokesIn = (g) => g.path ? [g.i] : g.kids.flatMap(strokesIn);
// 数を 小数第1位までに する（となりの 数と くっつかないように 区切りを 入れなおす）
const round = (d) => {
  let out = '', prevNum = false;
  (d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+)/g) || []).forEach((t) => {
    if (/[a-zA-Z]/.test(t)) { out += t; prevNum = false; return; }
    const v = String(Math.round(parseFloat(t) * 10) / 10).replace(/^-0$/, '0');
    out += (prevNum && v[0] !== '-' ? ',' : '') + v;
    prevNum = true;
  });
  return out;
};

function partsOf(tree) {
  // いちばん 外の 字の g（kvg:XXXXX）
  let node = tree.kids[0].kids[0];
  const kidsOf = (g) => g.kids.filter((k) => k.path || k.kids.length);
  let list = kidsOf(node);
  // 1つしか ないときは 中へ
  while (list.length === 1 && !list[0].path) { node = list[0]; list = kidsOf(node); }
  // 大きな 部品（8画以上）で、中が 位置で 分かれて いるものは 分ける（4つまで）
  for (let pass = 0; pass < 2; pass++) {
    const out = [];
    list.forEach((g) => {
      const sub = g.path ? [] : kidsOf(g);
      if (!g.path && strokesIn(g).length >= 8 && sub.length >= 2 && sub.every((s) => !s.path) && list.length - 1 + sub.length <= 4 && sub.some((s) => s.attrs['kvg:position'])) out.push(...sub);
      else out.push(g);
    });
    list = out;
  }
  // 1画だけの はしたは となりに くっつける
  const parts = [];
  list.forEach((g) => {
    const ids = strokesIn(g);
    const el = g.path ? '' : (g.attrs['kvg:element'] || '');
    if (ids.length === 1 && g.path && parts.length) parts[parts.length - 1][1].push(...ids);
    else parts.push([el, ids]);
  });
  if (parts.length > 1 && parts[0][1].length === 1 && !parts[0][0]) { parts[1][1].unshift(...parts[0][1]); parts.shift(); }
  return parts.length >= 2 ? parts : null;
}

// 部首（kvg:radical="general"）
function radicalOf(tree) {
  let r = null;
  const walk = (g) => { if (g.path) return; if (!r && g.attrs['kvg:radical'] === 'general') r = [g.attrs['kvg:element'] || '', g.attrs['kvg:position'] || '', strokesIn(g)]; g.kids.forEach(walk); };
  walk(tree);
  return r;
}

(async () => {
  global.window = {};
  eval(fs.readFileSync(path.join(root, '..', 'kanji2', 'data', 'strokes.js'), 'utf8'));
  const old = window.KANJI_STROKES;
  const S = {}, P = {}, R = {};
  Object.keys(old).filter((c) => /[ぁ-ゖ]/.test(c)).forEach((c) => { S[c] = old[c]; });
  for (const ch of GRADE3) {
    const tree = parse(await svgOf(ch));
    const paths = [];
    const walk = (g) => { if (g.path) paths[g.i] = round(g.path); else g.kids.forEach(walk); };
    walk(tree);
    S[ch] = paths;
    R[ch] = radicalOf(tree);
    if (paths.length >= 10) {
      const p = FIX[ch] ? FIX[ch].map(([el, a, b]) => [el, Array.from({ length: b - a + 1 }, (_, i) => a + i)]) : partsOf(tree);
      if (p) P[ch] = p;
    }
  }
  const out = '/* 書き順データ：KanjiVG（CC BY-SA 3.0 / Ulrich Apel ほか, https://kanjivg.tagaini.net/）より。座標は小数第1位まで。\n' +
    ' * KANJI_PARTS：10画以上の字の部品（[部品, 画の番号（0から）]）。KanjiVG の部品の区切りによります。\n' +
    ' * このファイルは kanji3/tools/strokes.js で 作ります。 */\n' +
    'window.KANJI_STROKES = ' + JSON.stringify(S) + ';\n' +
    'window.KANJI_PARTS = ' + JSON.stringify(P) + ';\n';
  fs.writeFileSync(path.join(root, 'data', 'strokes.js'), out);
  if (process.argv.includes('--report')) {
    for (const ch of GRADE3) console.log(ch, S[ch].length, P[ch] ? P[ch].map((p) => `${p[0] || '?'}:${p[1].length}`).join(' ') : '', '| 部首', R[ch] ? `${R[ch][0]}(${R[ch][1]})${R[ch][2].length}` : '-');
  }
  console.log('字', Object.keys(S).length, '部品', Object.keys(P).length);
})().catch((e) => { console.error(e); process.exit(1); });
