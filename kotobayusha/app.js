// ===== ことばの勇者 アプリ本体 =====
const PARTS = ['who', 'where', 'what'];
const PART_LABEL = { who: 'だれが', where: 'どこで', what: 'なにを している' };
const PART_P = { who: 'が', where: 'で', what: '' };
const LEVELS = { 1: 'Lv1 えらぶ', 2: 'Lv2 ならべる', 3: 'Lv3 うめる', 4: 'Lv4 かく' };

// ---------- 保存 ----------
const SAVE_KEY = 'kotobaYusha.v1';
let DB = (() => {
  try { const s = localStorage.getItem(SAVE_KEY); if (s) return JSON.parse(s); } catch (e) {}
  return { players: [], cur: null };
})();
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(DB)); } catch (e) {} }
const me = () => DB.players.find(p => p.id === DB.cur);
DB.players.forEach(p => { if (!p.judge) p.judge = 'auto'; });
function newPlayer(name, look) {
  return { id: 'p' + Date.now(), name, look, level: 1, input: 'kana', judge: 'auto', unlockAll: false,
    done: AREAS.map(() => Array(10).fill(false)), treasures: [], monsters: [], log: [] };
}

// ---------- べんり ----------
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function pic(src, emo, cls = '') {
  return `<span class="pic ${cls}"><img src="${src}" alt="" onerror="this.parentNode.classList.add('noimg');this.remove()"><span class="emo">${emo}</span></span>`;
}
const lookOf = id => LOOKS.find(l => l.id === id) || LOOKS[0];
const heroPic = (p, cls = '') => pic(IMG.hero(p.look), lookOf(p.look).e, cls);

let _ja;
function jaVoice() {
  if (_ja) return _ja;
  const vs = speechSynthesis.getVoices().filter(v => /^ja/i.test(v.lang));
  _ja = vs.find(v => /google/i.test(v.name)) || vs[0];
  return _ja;
}
try { speechSynthesis.onvoiceschanged = () => { _ja = null; jaVoice(); }; } catch (e) {}
function say(t) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t.replace(/\s+/g, ' '));
    u.lang = 'ja-JP'; u.rate = 0.85;
    const v = jaVoice(); if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) {}
}
let actx;
function tone(seq) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    let t = actx.currentTime;
    seq.forEach(([f, d]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d); t += d * .8;
    });
  } catch (e) {}
}
const sOK = () => tone([[660, .12], [880, .12], [1320, .3]]);
const sNG = () => tone([[330, .18], [262, .25]]);
const sTap = () => tone([[700, .05]]);
function confetti() {
  const em = ['✨', '⭐', '🎉', '💫', '🌟'];
  for (let i = 0; i < 24; i++) {
    const d = document.createElement('div'); d.className = 'confetti';
    d.textContent = em[i % em.length]; d.style.left = Math.random() * 100 + 'vw';
    d.style.animationDelay = Math.random() * .6 + 's';
    document.body.appendChild(d); setTimeout(() => d.remove(), 3200);
  }
}

// 答え合わせ用：ひらがなにそろえ、空白・句読点をとる
function norm(s) {
  return String(s).replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s　。、，．,.！!？?「」]/g, '');
}
function normEnd(s) { // 「〜ています」「〜てる」も「〜ている」とみなす
  return s.replace(/(て|で)い?ます$/, '$1いる').replace(/(て|で)る$/, '$1いる').replace(/(て|で)ました$/, '$1いた');
}
const sentence = q => `${q.who}が ${q.where}で ${q.what}。`;

// ---------- 画面切りかえ ----------
let screen = 'title', Q = null, view = {};
function go(s, v = {}) { screen = s; view = v; try { speechSynthesis.cancel(); } catch (e) {} render(); window.scrollTo(0, 0); }
function render() {
  ({ title, players, create, map, intro, quiz, zukan, teacher, prompts })[screen]();
}

// ---------- タイトル ----------
function title() {
  app.innerHTML = `
  <div class="title-bg"><img src="${IMG.title}" alt="" onerror="this.remove()">
    <div class="cloud" style="top:8%">☁️</div><div class="cloud" style="top:20%;animation-delay:-12s">☁️</div>
  </div>
  <div class="screen center" style="gap:26px">
    <div class="title-logo"><ruby>ことばの<rt></rt></ruby><ruby>勇者<rt>ゆうしゃ</rt></ruby></div>
    <div class="title-sub">〜 ぶんの ちからで せかいを すくえ 〜</div>
    <button class="btn big" data-act="start">▶ はじめる</button>
  </div>
  <button class="teacher-link" data-act="teacherGate">せんせい用</button>`;
}

// ---------- プレイヤー選択 ----------
function players() {
  const list = DB.players.map(p => {
    const n = p.done.flat().filter(Boolean).length;
    return `<button class="pcard" data-act="pick" data-id="${p.id}">${heroPic(p)}<span>${esc(p.name)}</span><small>${n} / 100 もん</small></button>`;
  }).join('');
  app.innerHTML = `<div class="screen center">
    <div class="panel" style="font-size:28px">だれが ぼうけんする？</div>
    <div class="players">${list}
      <button class="pcard" data-act="newp"><span style="font-size:70px;line-height:90px">➕</span><span>あたらしく つくる</span></button>
    </div>
    <button class="btn sub" data-act="home">◀ もどる</button></div>`;
}

// ---------- キャラ作成 ----------
function create() {
  view.look = view.look || 'h1';
  view.name = view.name || '';
  view.mode = view.mode || 'kana';
  const looks = LOOKS.map(l => `<button class="look ${view.look === l.id ? 'sel' : ''}" data-act="look" data-id="${l.id}">${pic(IMG.hero(l.id), l.e)}${l.n}</button>`).join('');
  app.innerHTML = `<div class="screen">
    <div class="topbar"><button class="btn sub" data-act="back-players">◀ もどる</button>
      <div class="panel" style="padding:10px 18px;font-size:24px">ゆうしゃを つくろう！</div></div>
    <div class="quiz">
      <div class="panel"><div style="font-size:22px;margin-bottom:10px">① すがたを えらぼう</div><div class="looks">${looks}</div></div>
      <div class="panel qcard">
        <div style="font-size:22px">② なまえを いれよう</div>
        ${inputBox(view.name, view.mode, 'name')}
        <button class="btn green big" data-act="makep" ${view.name.trim() ? '' : 'disabled'}>けってい！</button>
      </div>
    </div></div>`;
  bindRomaji('name');
}

// ---------- 入力（ひらがな表・ローマ字） ----------
const KANA_COLS = [
  'あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの',
  'はひふへほ', 'まみむめも', 'や ゆ よ', 'らりるれろ', 'わをんー ',
];
function inputBox(text, mode, target) {
  const switcher = `<div class="row"><span style="font-size:16px">にゅうりょく：</span>
    <button class="modebtn" data-act="mode" data-m="kana" data-t="${target}" style="${mode === 'kana' ? 'background:#ffe58a' : ''}">あ ひらがな表</button>
    <button class="modebtn" data-act="mode" data-m="romaji" data-t="${target}" style="${mode === 'romaji' ? 'background:#ffe58a' : ''}">A ローマ字</button></div>`;
  if (mode === 'romaji') {
    return `${switcher}<input id="romaji" class="typed-input" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(text)}" placeholder="ここに かこう">`;
  }
  let cells = '';
  for (let r = 0; r < 5; r++) {
    // 右がわ（先頭）に きのうキー
    const fn = [['゛', 'daku'], ['゜', 'handaku'], ['小', 'small'], ['、', 'ch:、'], ['⌫', 'del']][r];
    cells += `<button class="fn ${fn[1] === 'del' ? 'del' : ''}" data-k="${fn[1]}">${fn[0]}</button>`;
    KANA_COLS.forEach(col => {
      const c = col[r];
      cells += c && c !== ' ' ? `<button data-k="ch:${c}">${c}</button>` : `<button class="empty"></button>`;
    });
  }
  return `${switcher}<div class="typed" id="typed">${esc(text)}<span class="caret"></span></div>
    <div class="kana">${cells}</div>
    <div class="row" style="justify-content:flex-end"><button class="modebtn" data-k="ch: ">␣ あける</button><button class="modebtn" data-k="ch:。">。</button><button class="modebtn" data-k="clear">ぜんぶ けす</button></div>`;
}
const DAKU = { か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご', さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ', た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど', は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ', う: 'ゔ' };
const HANDAKU = { は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ' };
const SMALL = { あ: 'ぁ', い: 'ぃ', う: 'ぅ', え: 'ぇ', お: 'ぉ', や: 'ゃ', ゆ: 'ゅ', よ: 'ょ', つ: 'っ', わ: 'ゎ' };
const inv = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
const BASE = { ...inv(DAKU), ...inv(HANDAKU), ...inv(SMALL) };
function applyKey(text, k) {
  if (k === 'del') return text.slice(0, -1);
  if (k === 'clear') return '';
  if (k.startsWith('ch:')) return (text + k.slice(3)).slice(0, 40);
  const last = text.slice(-1); if (!last) return text;
  const map = k === 'daku' ? DAKU : k === 'handaku' ? HANDAKU : SMALL;
  const base = BASE[last] || last;
  const next = map[base] && map[base] !== last ? map[base] : base;
  return text.slice(0, -1) + next;
}
function getText(target) { return target === 'name' ? view.name : Q.typed; }
function setText(target, t) {
  if (target === 'name') { view.name = t; const b = $('[data-act=makep]'); if (b) b.disabled = !t.trim(); }
  else { Q.typed = t; if (Q.level >= 3) livePreview(); }
  const box = $('#typed'); if (box) box.innerHTML = esc(t) + '<span class="caret"></span>';
}
function bindRomaji(target) {
  const el = $('#romaji'); if (!el) return;
  el.addEventListener('input', () => setText(target, el.value));
  el.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing && target !== 'name') check(); });
}

// ---------- ワールドマップ ----------
const NODE_POS = [[9, 80], [24, 64], [12, 42], [27, 22], [45, 34], [52, 62], [68, 80], [84, 62], [72, 38], [88, 16]];
function unlocked(p, a) { return p.unlockAll || a === 0 || p.done[a - 1].every(Boolean); }
function map() {
  const p = me();
  let nowA = AREAS.findIndex((_, a) => unlocked(p, a) && !p.done[a].every(Boolean));
  if (nowA < 0) nowA = 9;
  const path = NODE_POS.map(([x, y]) => `${x},${y}`).join(' ');
  const nodes = AREAS.map((A, a) => {
    const n = p.done[a].filter(Boolean).length, lock = !unlocked(p, a);
    const cls = lock ? 'locked' : n === 10 ? 'clear' : a === nowA ? 'now' : '';
    return `<button class="node ${cls}" style="left:${NODE_POS[a][0]}%;top:${NODE_POS[a][1]}%" data-act="area" data-a="${a}" ${lock ? 'data-locked="1"' : ''}>
      <span class="disc">${lock ? '🔒' : A.emoji}</span><span class="lbl">${a + 1}. ${A.name}</span><span class="stars">⭐ ${n}/10</span></button>`;
  }).join('');
  const [hx, hy] = NODE_POS[nowA];
  const total = p.done.flat().filter(Boolean).length;
  app.innerHTML = `<div class="screen">
    <div class="topbar">
      <span class="chip" style="font-size:22px">${heroPic(p, '').replace('class="pic ', 'style="width:36px;height:36px;font-size:30px" class="pic ')} ${esc(p.name)}</span>
      <span class="chip">⭐ ${total} / 100</span><span class="chip">💎 ${p.treasures.length}</span><span class="chip">🐾 ${p.monsters.length}</span>
      <span class="chip">${LEVELS[p.level]}</span>
      <span class="spacer"></span>
      <button class="btn sub" data-act="zukan">📖 ずかん</button>
      <button class="btn sub" data-act="home">🏠 おわる</button>
    </div>
    <div class="map">
      <img class="mapimg" src="${IMG.map}" alt="" onerror="this.remove()">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${path}" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="2 1.4" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:10px;opacity:.85"/></svg>
      ${nodes}
      <div class="hero-on-map" style="left:${hx}%;top:${hy - 6}%">${heroPic(p)}</div>
    </div></div>`;
}

// ---------- エリア紹介 ----------
function intro() {
  const A = AREAS[view.a];
  app.innerHTML = `<div class="screen">
    <div class="topbar"><button class="btn sub" data-act="map">◀ マップ</button>
      <div class="panel" style="padding:10px 18px;font-size:26px">${A.no}. ${A.name}</div></div>
    <div class="intro" style="background:linear-gradient(180deg,${A.bg[0]},${A.bg[1]})">
      <div class="bgpic" style="position:absolute;inset:0">${pic(IMG.area(view.a), A.emoji, '').replace('class="pic ', 'style="width:100%;height:100%" class="pic ')}</div>
      <div class="story">${esc(A.story)} <button class="speak" data-act="say" data-t="${esc(A.story)}">🔊</button></div>
    </div>
    <div class="row" style="justify-content:center"><button class="btn big green" data-act="startArea">しゅっぱつ！</button></div></div>`;
  say(A.story);
}

// ---------- もんだい ----------
function startQuiz(a, idx) {
  const p = me();
  if (idx == null) { idx = p.done[a].findIndex(d => !d); if (idx < 0) idx = 0; }
  const q = AREAS[a].qs[idx];
  const pool = AREAS[a].qs;
  const opts = {};
  PARTS.forEach(k => {
    const others = shuffle([...new Set(pool.map(x => x[k]).filter(v => v !== q[k]))]).slice(0, 2);
    opts[k] = shuffle([q[k], ...others]);
  });
  const toks = [
    { t: q.who, c: 'who' }, { t: 'が', c: 'p' }, { t: q.where, c: 'where' }, { t: 'で', c: 'p' }, { t: q.what, c: 'what' },
    { t: 'を', c: 'p' }, { t: 'に', c: 'p' },
  ];
  Q = { a, idx, q, level: p.level, opts, sel: {}, ok: {}, ng: {}, toks: shuffle(toks), placed: [],
        typed: '', hint: 0, msg: '', msgc: '', blank: PARTS[idx % 3], tries: 0 };
  go('quiz');
  say('えを みて、ぶんを つくろう。');
}

function quiz() {
  const { q, a, idx, level } = Q; const p = me(); const A = AREAS[a];
  const prog = p.done[a].map((d, i) => `<i class="${d ? 'done' : ''} ${i === idx ? 'cur' : ''}"></i>`).join('');
  const rings = level <= 2 || Q.hint >= 1;
  const scene = `<div class="scene ${rings ? 'rings' : ''}" style="background:linear-gradient(180deg,${A.bg[0]},${A.bg[1]})">
      <img src="${IMG.q(a, idx)}" alt="" onerror="this.parentNode.classList.add('noimg');this.remove()">
      <div class="emoscene"><div class="place">${q.ep}</div><div class="who ring">${q.ew}</div><div class="thing ring">${q.et}</div></div>
    </div>`;
  const ask = `<div class="ask"><button class="speak" data-act="say" data-t="えを みて、だれが、どこで、なにを しているか、ぶんを つくろう。">🔊</button>
    えを みて <span class="tag who">だれが</span><span class="tag where">どこで</span><span class="tag what">なにを している</span> を ぶんに しよう</div>`;
  let body = '';
  if (level === 1) body = lv1();
  else if (level === 2) body = lv2();
  else if (level === 3) body = lv3();
  else body = lv4();
  app.innerHTML = `<div class="screen">
    <div class="topbar"><button class="btn sub" data-act="map">◀ マップ</button>
      <span class="chip">${A.emoji} ${A.name}</span><span class="chip">${idx + 1} もんめ</span>
      <div class="progress">${prog}</div><span class="spacer"></span><span class="chip">${LEVELS[level]}</span></div>
    <div class="quiz">
      <div>${scene}</div>
      <div class="panel qcard">${ask}${body}
        <div class="msg ${Q.msgc}">${Q.msg}</div>
        <div class="row" style="justify-content:center">
          <button class="btn sub" data-act="hint">💡 ヒント</button>
          <button class="btn green big" data-act="check">できた！</button>
        </div>
      </div>
    </div></div>`;
  bindRomaji('ans');
}

// Lv1 えらぶ
function lv1() {
  const prev = PARTS.map(k => Q.sel[k] ? `<span class="w ${k}">${esc(Q.sel[k])}</span>${PART_P[k]}` : `<span class="blank">${PART_LABEL[k]}</span>${PART_P[k]}`).join(' ');
  return PARTS.map(k => {
    const hintVal = Q.hintPart === k ? Q.q[k] : null;
    return `<div class="part ${k} ${Q.ok[k] ? 'ok' : ''} ${Q.ng[k] ? 'ng' : ''}"><h3>${PART_LABEL[k]}</h3><div class="opts">${
      Q.opts[k].map(v => `<button class="opt ${Q.sel[k] === v ? 'sel' : ''} ${hintVal === v ? 'hint' : ''}" data-act="sel" data-part="${k}" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div></div>`;
  }).join('') + `<div class="sentence">${prev}。</div>`;
}
// Lv2 ならべる
function lv2() {
  const line = Q.placed.map(i => { const t = Q.toks[i]; return `<button class="tok ${t.c === 'p' ? 'p' : 'c-' + t.c}" data-act="unplace" data-i="${i}">${esc(t.t)}</button>`; }).join('');
  const pool = Q.toks.map((t, i) => `<button class="tok ${t.c === 'p' ? 'p' : 'c-' + t.c} ${Q.placed.includes(i) ? 'used' : ''} ${Q.hintTok === i ? 'hint' : ''}" data-act="place" data-i="${i}">${esc(t.t)}</button>`).join('');
  return `<div style="font-size:18px">カードを じゅんばんに タッチして ぶんを つくろう（「が」「で」も つかうよ）</div>
    <div class="sentence" style="min-height:84px">${line || '<span style="color:#bbb">ここに ならぶよ</span>'}<span style="margin-left:auto">。</span></div>
    <div class="tokens">${pool}</div>`;
}
// Lv3 うめる
function lv3() {
  const k = Q.blank;
  const parts = PARTS.map(x => x === k
    ? `<span class="blank fill" id="blankfill" style="border-color:var(--${x})">${esc(Q.typed) || PART_LABEL[x]}</span>${PART_P[x]}`
    : `<span class="w ${x}">${esc(Q.q[x])}</span>${PART_P[x]}`).join(' ');
  const h = hintText(k);
  return `<div style="font-size:20px"><span class="tag ${k}">${PART_LABEL[k]}</span> の ところを かこう</div>
    <div class="sentence">${parts}。</div>
    ${h ? `<div class="ghost">ヒント：${h}</div>` : ''}
    ${inputBox(Q.typed, me().input, 'ans')}`;
}
// Lv4 かく
function lv4() {
  const g = PARTS.map(k => `<span class="g c-${k} ${Q.ok[k] ? 'okk' : ''}">${Q.ok[k] ? '✔ ' : ''}${PART_LABEL[k]}</span>${PART_P[k] ? `<span>${PART_P[k]}</span>` : ''}`).join('');
  const h = Q.hint >= 1 ? PARTS.map(k => hintText(k)).join(' ') + '。' : '';
  return `<div style="font-size:20px">ぶんを ぜんぶ かこう</div>
    <div class="guide">かたち： ${g}<span>。</span></div>
    ${h ? `<div class="ghost">ヒント：${h}</div>` : ''}
    ${inputBox(Q.typed, me().input, 'ans')}`;
}
function hintText(k) {
  const v = Q.q[k] + PART_P[k];
  if (Q.hint === 1) return v[0] + '…' + (PART_P[k] || '');
  if (Q.hint >= 2) return v;
  return '';
}
function livePreview() {
  const b = $('#blankfill'); if (b) b.textContent = Q.typed || PART_LABEL[Q.blank];
}

function check() {
  const { q, level } = Q;
  let allOk = false;
  Q.ng = {};
  if (level === 1) {
    const miss = PARTS.filter(k => !Q.sel[k]);
    if (miss.length) { Q.msg = `<span class="tag ${miss[0]}">${PART_LABEL[miss[0]]}</span> を えらんでね`; Q.msgc = ''; return quiz(); }
    PARTS.forEach(k => { if (Q.sel[k] === q[k]) Q.ok[k] = true; else { Q.ng[k] = true; delete Q.sel[k]; } });
    allOk = PARTS.every(k => Q.ok[k]);
  } else if (level === 2) {
    const s = Q.placed.map(i => Q.toks[i].t).join('');
    allOk = s === q.who + 'が' + q.where + 'で' + q.what || s === q.where + 'で' + q.who + 'が' + q.what;
    if (!allOk && Q.placed.length < 5) { Q.msg = 'まだ カードが たりないよ'; Q.msgc = ''; return quiz(); }
  } else if (level === 3) {
    let t = norm(Q.typed); const k = Q.blank;
    if (!t) { Q.msg = 'かいてみよう！'; Q.msgc = ''; return quiz(); }
    if (PART_P[k] && t.endsWith(PART_P[k]) && !norm(q[k]).endsWith(PART_P[k])) t = t.slice(0, -1);
    allOk = (k === 'what' ? normEnd(t) : t) === norm(q[k]);
    if (me().judge === 'teacher') return askTeacher(allOk);
    logWrite(Q.typed, allOk);
  } else {
    const t = normEnd(norm(Q.typed));
    if (!t) { Q.msg = 'かいてみよう！'; Q.msgc = ''; return quiz(); }
    const w = norm(q.who), wh = norm(q.where), wt = norm(q.what);
    Q.ok = {
      who: t.includes(w + 'が') || t.includes(w + 'は'),
      where: t.includes(wh + 'で'),
      what: t.endsWith(wt),
    };
    allOk = PARTS.every(k => Q.ok[k]);
    if (me().judge === 'teacher') { Q.ok = {}; return askTeacher(allOk); }
    logWrite(Q.typed, allOk);
  }
  if (allOk) { if (level >= 3) Q.judgeEntry = me().log[me().log.length - 1]; return success(); }
  Q.tries++;
  sNG();
  const nearly = level === 4 ? PARTS.filter(k => !Q.ok[k]).map(k => `<span class="tag ${k}">${PART_LABEL[k]}</span>`).join(' ') + ' を もういちど みてみよう' : 'おしい！ もういちど えを よく みてみよう';
  Q.msg = 'あと すこし！ ' + nearly; Q.msgc = 'ng';
  if (Q.tries >= 2 && Q.hint === 0 && level >= 3) { Q.hint = 1; Q.msg += '（ヒントを だしたよ）'; }
  quiz();
}
function logWrite(text, ok, auto = ok) {
  const p = me();
  const e = { a: Q.a, i: Q.idx, lv: Q.level, t: text, ok, auto, by: ok === null ? '' : 'app', d: new Date().toISOString() };
  p.log.push(e);
  if (p.log.length > 500) p.log = p.log.slice(-500);
  save();
  return e;
}

// ---------- 先生が その場で はんてい ----------
// ながおしで おす ボタン（子どもが うっかり おさないように）
function holdBtn(el, fn) {
  let tm;
  const down = e => { e.preventDefault(); el.classList.add('down'); tm = setTimeout(() => { el.classList.remove('down'); fn(); }, 1500); };
  const up = () => { el.classList.remove('down'); clearTimeout(tm); };
  el.addEventListener('pointerdown', down); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, up));
}
function lv3Sentence(typed) {
  return PARTS.map(x => (x === Q.blank ? typed : Q.q[x]) + PART_P[x]).join(' ') + '。';
}
function askTeacher(auto) {
  const e = logWrite(Q.typed, null, auto);
  const q = Q.q;
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = `<div class="reward judge">
    <h2 style="color:#1e6fd9">せんせいに みて もらおう</h2>
    <div class="sentence">${esc(Q.level === 3 ? lv3Sentence(Q.typed) : Q.typed)}</div>
    <div class="jnote">こたえの れい：${esc(sentence(q))}<br>アプリの はんてい：${auto ? '○ あっている' : '△ ちがう ところが ある'}</div>
    <div style="font-size:16px;font-weight:500">せんせいが ボタンを ながおし してください</div>
    <div class="row" style="justify-content:center;gap:18px">
      <button class="btn green hold jbtn" id="jok"><span class="fill"></span><span style="position:relative">○ せいかい</span></button>
      <button class="btn hold jng jbtn" id="jng"><span class="fill"></span><span style="position:relative">× もういちど</span></button>
    </div>
    <button class="btn sub" data-act="judgeLater">あとで みて もらう</button></div>`;
  document.body.appendChild(ov);
  Q.judgeEntry = e;
  say('せんせいに みて もらおう。');
  holdBtn($('#jok'), () => { e.ok = true; e.by = 't'; save(); closeOverlay(); success(); });
  holdBtn($('#jng'), () => {
    e.ok = false; e.by = 't'; Q.judgeEntry = null; save(); closeOverlay();
    Q.tries++; sNG();
    Q.msg = 'もういちど かいて みよう'; Q.msgc = 'ng';
    if (Q.tries >= 2 && Q.hint === 0) { Q.hint = 1; Q.msg += '（ヒントを だしたよ）'; }
    quiz(); say('もういちど かいて みよう。');
  });
}
function judgeLater() {
  closeOverlay(); Q.judgeEntry = null;
  const last = Q.idx >= 9;
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = `<div class="reward"><div style="font-size:26px;line-height:1.6">せんせいが あとで みて くれるよ。<br>${last ? 'マップに もどろう。' : 'つぎの もんだいへ すすもう。'}</div>
    <button class="btn big green" data-act="${last ? 'map' : 'next'}">${last ? 'マップへ ▶' : 'つぎの もんだい ▶'}</button></div>`;
  document.body.appendChild(ov);
  say('せんせいが あとで みて くれるよ。');
}

function hint() {
  sTap();
  const { q, level } = Q;
  if (level === 1) {
    Q.hintPart = PARTS.find(k => Q.sel[k] !== q[k]) || null;
  } else if (level === 2) {
    const order = [q.who, 'が', q.where, 'で', q.what];
    const cur = Q.placed.map(i => Q.toks[i].t);
    let n = 0; while (n < cur.length && cur[n] === order[n]) n++;
    if (n < cur.length) { Q.placed = Q.placed.slice(0, n); }
    const want = order[n];
    Q.hintTok = Q.toks.findIndex((t, i) => t.t === want && !Q.placed.includes(i));
  } else {
    Q.hint = Math.min(2, Q.hint + 1);
  }
  quiz();
}

// もんだいを クリアにして、はじめての ときは たからものや なかまを あげる
function clearQ(p, a, idx) {
  const A = AREAS[a]; const first = !p.done[a][idx];
  p.done[a][idx] = true;
  const r = { first, html: '', say: '', got: [] };
  if (first && TREASURE_AT[idx] != null) {
    const t = A.treasures[TREASURE_AT[idx]]; const id = `a${a}t${TREASURE_AT[idx]}`;
    if (!p.treasures.includes(id)) { p.treasures.push(id); r.got.push(id); }
    r.html = `<div style="font-size:26px">たからばこが あらわれた！</div><div class="big">${t.e}</div><div style="font-size:28px">「${t.n}」を てに いれた！</div>`;
    r.say = `${t.n}を てに いれた！`;
  }
  if (first && MONSTER_AT[idx] != null) {
    const m = A.monsters[MONSTER_AT[idx]]; const id = `a${a}m${MONSTER_AT[idx]}`;
    if (!p.monsters.includes(id)) { p.monsters.push(id); r.got.push(id); }
    r.html = `<div style="font-size:26px">きりの なかから ${idx === 9 ? 'ボス' : 'モンスター'}が でてきた！</div>
      <div class="big">${pic(IMG.mon(a, MONSTER_AT[idx]), m.e)}</div><div style="font-size:28px">${m.n}が なかまに なった！</div>`;
    r.say = `${m.n}が なかまに なった！`;
  }
  return r;
}
function success() {
  const p = me(); const { a, idx, q } = Q;
  const r = clearQ(p, a, idx); const first = r.first;
  if (Q.judgeEntry && first) { Q.judgeEntry.cl = true; Q.judgeEntry.got = r.got; }
  Q.judgeEntry = null;
  const rewardHtml = r.html, sayExtra = r.say;
  save();
  sOK(); confetti();
  const s = PARTS.map(k => `<span class="w ${k}">${esc(q[k])}</span>${PART_P[k]}`).join(' ');
  const areaClear = p.done[a].every(Boolean) && first;
  const nextBtn = areaClear ? `<button class="btn big green" data-act="clearArea">つぎへ ▶</button>`
    : idx < 9 ? `<button class="btn big green" data-act="next">つぎの もんだい ▶</button>` : `<button class="btn big green" data-act="map">マップへ ▶</button>`;
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="reward"><h2>${['せいかい！', 'すごい！', 'やったね！', 'きりが はれた！'][Math.floor(Math.random() * 4)]}</h2>
    <div class="sentence">${s}。</div>${rewardHtml}
    <div class="row" style="justify-content:center"><button class="btn sub" data-act="say" data-t="${esc(sentence(q))}">🔊 よむ</button>${nextBtn}</div></div>`;
  document.body.appendChild(ov);
  say(sentence(q) + ' ' + sayExtra);
}
function closeOverlay() { document.querySelectorAll('.overlay').forEach(o => o.remove()); }
function areaClearScreen() {
  const A = AREAS[Q.a];
  closeOverlay();
  const ov = document.createElement('div'); ov.className = 'overlay';
  const last = Q.a === 9;
  const msg = last ? 'せかいの きりが ぜんぶ はれた！ きみは ほんものの ことばの ゆうしゃだ！' : `${A.name}の きりが はれた！ つぎの エリアへ すすめるよ！`;
  ov.innerHTML = `<div class="reward"><h2>${last ? '🎊 ゲームクリア 🎊' : 'エリア クリア！'}</h2><div class="big">${last ? '🏆' : A.emoji}</div>
    <div style="font-size:26px;line-height:1.6">${msg}</div><button class="btn big green" data-act="map">マップへ ▶</button></div>`;
  document.body.appendChild(ov); confetti(); setTimeout(confetti, 800); say(msg);
}

// ---------- ずかん ----------
function zukan() {
  const p = me(); const tab = view.tab || 'm';
  let cells = '';
  AREAS.forEach((A, a) => {
    [0, 1].forEach(i => {
      if (tab === 'm') {
        const m = A.monsters[i], has = p.monsters.includes(`a${a}m${i}`);
        cells += has ? `<div class="zcell">${pic(IMG.mon(a, i), m.e)}<span>${m.n}</span><small>${A.name}</small></div>`
          : `<div class="zcell no"><span class="q">？</span><span>？？？</span><small>${A.name}</small></div>`;
      } else {
        const t = A.treasures[i], has = p.treasures.includes(`a${a}t${i}`);
        cells += has ? `<div class="zcell"><span style="font-size:60px;height:80px">${t.e}</span><span>${t.n}</span><small>${A.name}</small></div>`
          : `<div class="zcell no"><span class="q">？</span><span>？？？</span><small>${A.name}</small></div>`;
      }
    });
  });
  app.innerHTML = `<div class="screen">
    <div class="topbar"><button class="btn sub" data-act="map">◀ マップ</button><div class="panel" style="padding:10px 18px;font-size:24px">📖 ずかん</div></div>
    <div class="tabs"><button class="${tab === 'm' ? 'on' : ''}" data-act="ztab" data-t="m">🐾 なかま ${p.monsters.length}/20</button>
      <button class="${tab === 't' ? 'on' : ''}" data-act="ztab" data-t="t">💎 たからもの ${p.treasures.length}/20</button></div>
    <div class="panel" style="border-top-left-radius:0"><div class="zgrid">${cells}</div></div></div>`;
}

// ---------- 先生用 ----------
function teacherGate() {
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = `<div class="reward"><div style="font-size:24px">せんせい用の ページです</div>
    <div style="font-size:16px;font-weight:500">下のボタンを 2びょう ながおし してください</div>
    <button class="btn hold" id="holdbtn"><span class="fill"></span><span style="position:relative">ながおしで ひらく</span></button>
    <button class="btn sub" data-act="closeOv">やめる</button></div>`;
  document.body.appendChild(ov);
  const b = $('#holdbtn'); let tm;
  const down = e => { e.preventDefault(); b.classList.add('down'); tm = setTimeout(() => { closeOverlay(); go('teacher'); }, 1500); };
  const up = () => { b.classList.remove('down'); clearTimeout(tm); };
  b.addEventListener('pointerdown', down); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, up));
}
function teacher() {
  const rows = DB.players.map(p => {
    const n = p.done.flat().filter(Boolean).length;
    const areas = p.done.map(d => d.filter(Boolean).length).join(' / ');
    return `<tr><td>${lookOf(p.look).e} ${esc(p.name)}</td>
      <td><select data-tset="level" data-id="${p.id}">${[1, 2, 3, 4].map(l => `<option value="${l}" ${p.level === l ? 'selected' : ''}>${LEVELS[l]}</option>`).join('')}</select></td>
      <td><select data-tset="input" data-id="${p.id}"><option value="kana" ${p.input === 'kana' ? 'selected' : ''}>ひらがな表</option><option value="romaji" ${p.input === 'romaji' ? 'selected' : ''}>ローマ字</option></select></td>
      <td><select data-tset="judge" data-id="${p.id}"><option value="auto" ${p.judge !== 'teacher' ? 'selected' : ''}>じどう</option><option value="teacher" ${p.judge === 'teacher' ? 'selected' : ''}>せんせいが はんてい</option></select></td>
      <td><label><input type="checkbox" data-tset="unlockAll" data-id="${p.id}" ${p.unlockAll ? 'checked' : ''}> 全エリア開放</label></td>
      <td>${n}/100<br><small>${areas}</small></td>
      <td><button class="tbtn" data-act="tlog" data-id="${p.id}">記録${pend(p) ? ` <b class="pend">未判定 ${pend(p)}</b>` : ''}</button> <button class="tbtn" data-act="tdel" data-id="${p.id}">削除</button></td></tr>`;
  }).join('') || '<tr><td colspan="7">まだ児童が登録されていません</td></tr>';
  let logHtml = '';
  if (view.log) {
    const p = DB.players.find(x => x.id === view.log);
    if (p) {
      const items = p.log.map((l, li) => [l, li]).reverse().map(([l, li]) => {
        const q = AREAS[l.a].qs[l.i];
        const st = l.ok == null ? '<b class="pend">未判定</b>'
          : (l.ok ? '○' : (l.by === 't' ? '×' : '△')) + `<small>（${l.by === 't' ? '先生' : 'アプリ'}）</small>`;
        const btn = `<button class="tbtn jb ${l.ok === true ? 'on' : ''}" data-act="tjudge" data-id="${p.id}" data-li="${li}" data-v="1">○</button>
          <button class="tbtn jb ${l.ok === false && l.by === 't' ? 'on' : ''}" data-act="tjudge" data-id="${p.id}" data-li="${li}" data-v="0">×</button>`;
        return `<tr class="${l.ok == null ? 'pendrow' : ''}"><td>${new Date(l.d).toLocaleString('ja-JP')}</td><td>${l.a + 1}-${l.i + 1}</td><td>Lv${l.lv}</td><td>${esc(l.t)}</td><td>${st}</td><td style="white-space:nowrap">${btn}</td><td>${esc(sentence(q))}</td></tr>`;
      }).join('') || '<tr><td colspan="7">Lv3・Lv4で書いた文がここに残ります</td></tr>';
      logHtml = `<div class="panel tpanel"><h3 style="margin-top:0">${esc(p.name)} さんの 書いた文</h3>
        <table><tr><th>日時</th><th>問題</th><th>レベル</th><th>書いた文</th><th>判定</th><th>判定を直す</th><th>正答例</th></tr>${items}</table></div>`;
    }
  }
  app.innerHTML = `<div class="screen">
    <div class="topbar"><button class="btn sub" data-act="home">◀ タイトル</button><div class="panel" style="padding:10px 18px;font-size:24px">先生用ページ</div>
      <span class="spacer"></span><button class="btn sub" data-act="prompts">🎨 イラスト一覧（ChatGPT用）</button></div>
    <div class="panel tpanel">
      <p style="margin-top:0">レベル：Lv1 えらぶ（3択）→ Lv2 ならべる（カードと助詞）→ Lv3 うめる（1か所を書く）→ Lv4 かく（文をまるごと書く）<br>
      書いた文の判定：「じどう」はアプリが判定します。「せんせいが はんてい」は、子どもが「できた！」を押すと先生を呼ぶ画面が出ます。○か×を長押しして判定します。<br>
      どちらの場合も、「記録」で あとから ○・× を直せます。○にすると、その問題はクリアになります。<br>
      記録はこの端末（ブラウザ）の中に保存されます。</p>
      <table><tr><th>児童</th><th>レベル</th><th>入力方法</th><th>書いた文の判定</th><th>エリア</th><th>進み具合（エリア別）</th><th></th></tr>${rows}</table>
    </div>${logHtml}</div>`;
}
const pend = p => p.log.filter(l => l.ok === null).length;
// 先生が「記録」で ○・× を つける（あとから直す）
function teacherJudge(pid, li, ok) {
  const p = DB.players.find(x => x.id === pid); const l = p && p.log[li]; if (!l) return;
  if (l.ok === ok && l.by === 't') return;
  l.ok = ok; l.by = 't';
  if (ok && !p.done[l.a][l.i]) {
    const r = clearQ(p, l.a, l.i); l.cl = true; l.got = r.got;
  } else if (!ok && l.cl) {
    // この記録で クリアにした ときだけ もとに もどす
    p.done[l.a][l.i] = false;
    p.treasures = p.treasures.filter(id => !(l.got || []).includes(id));
    p.monsters = p.monsters.filter(id => !(l.got || []).includes(id));
    l.cl = false; l.got = [];
  }
  save(); teacher();
}
function prompts() {
  const sec = [];
  const row = (src, emo, file, text) => `<div class="prow"><div class="thumb"><img src="${src}" alt="" onerror="this.parentNode.textContent='${emo}'"></div>
    <div><code>${file}</code><div>${esc(text)}</div></div><button class="tbtn" data-act="copy" data-t="${esc(text)}">コピー</button></div>`;
  sec.push(`<h3>共通（タイトル・マップ・主人公）</h3>` +
    row(IMG.title, '🏰', IMG.title, `${STYLE}ゲームのタイトル画面の背景。青空と白いお城、坂道の町、遠くに空に浮かぶ島。横長（3:2）。`) +
    row(IMG.map, '🗺️', IMG.map, `${STYLE}ファンタジー世界の冒険マップを上から見た絵。左下に町、草原、学校の塔、市場、森、湖、火山、氷のどうくつ、雲の上のお城、右上に空に浮かぶ島。それらを一本の道がつないでいる。横長（3:2）。`) +
    LOOKS.map(l => row(IMG.hero(l.id), l.e, IMG.hero(l.id), `${STYLE}主人公キャラクター：${l.p}。全身、正面。背景は透明（透過PNG）。正方形。`)).join(''));
  AREAS.forEach((A, a) => {
    let h = `<h3>${A.no}. ${A.name}</h3>`;
    h += row(IMG.area(a), A.emoji, IMG.area(a), `${STYLE}背景画像：${A.place}。人物はいない。横長（3:2）。`);
    A.monsters.forEach((m, i) => { h += row(IMG.mon(a, i), m.e, IMG.mon(a, i), `${STYLE}仲間になるモンスター「${m.n}」：${m.p}。全身。背景は透明（透過PNG）。正方形。`); });
    A.qs.forEach((q, i) => {
      h += row(IMG.q(a, i), q.ew, IMG.q(a, i), `${STYLE}「${q.who}が ${q.where}で ${q.what}」場面。${q.who}は1人（1ぴき）だけで大きく描き、${q.where}だと すぐ分かる背景にする。「${q.what}」の動作がはっきり分かるようにする。正方形 1024×1024。`);
    });
    sec.push(h);
  });
  app.innerHTML = `<div class="screen">
    <div class="topbar"><button class="btn sub" data-act="teacher">◀ 先生用ページ</button><div class="panel" style="padding:10px 18px;font-size:22px">🎨 イラスト一覧（ChatGPT用プロンプト）</div></div>
    <div class="panel tpanel"><p style="margin-top:0">「コピー」でプロンプトをコピーし、ChatGPTに貼りつけて画像を作ります。できた画像を左のファイル名で保存すると、アプリの絵文字が自動で画像に置きかわります。<br>
    共通スタイル：${esc(STYLE)}</p>${sec.join('')}</div></div>`;
}

// ---------- タッチ操作 ----------
document.addEventListener('click', e => {
  const k = e.target.closest('[data-k]');
  if (k && (screen === 'create' || screen === 'quiz') && $('#typed')) {
    sTap();
    const target = screen === 'create' ? 'name' : 'ans';
    setText(target, applyKey(getText(target), k.dataset.k));
    return;
  }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  switch (act) {
    case 'start': sTap(); go('players'); break;
    case 'home': closeOverlay(); go('title'); break;
    case 'newp': go('create', {}); break;
    case 'back-players': go('players'); break;
    case 'pick': DB.cur = b.dataset.id; save(); go('map'); break;
    case 'look': view.look = b.dataset.id; sTap(); say(lookOf(b.dataset.id).n); create(); break;
    case 'mode': {
      const m = b.dataset.m;
      if (b.dataset.t === 'name') { view.mode = m; create(); }
      else { me().input = m; save(); quiz(); }
      if (m === 'romaji') setTimeout(() => $('#romaji') && $('#romaji').focus(), 50);
      break;
    }
    case 'makep': {
      const name = view.name.trim(); if (!name) return;
      const p = newPlayer(name, view.look); p.input = view.mode;
      DB.players.push(p); DB.cur = p.id; save(); sOK();
      say(`${name}、ぼうけんに しゅっぱつだ！`); go('map'); break;
    }
    case 'map': closeOverlay(); go('map'); break;
    case 'area':
      if (b.dataset.locked) { sNG(); say('まえの エリアを クリアすると ひらくよ'); return; }
      sTap(); go('intro', { a: +b.dataset.a }); break;
    case 'startArea': startQuiz(view.a); break;
    case 'say': say(b.dataset.t); break;
    case 'sel':
      sTap(); Q.sel[b.dataset.part] = b.dataset.v; Q.ok[b.dataset.part] = false; Q.ng = {}; Q.msg = ''; Q.hintPart = null;
      say(b.dataset.v); quiz(); break;
    case 'place': sTap(); Q.placed.push(+b.dataset.i); Q.hintTok = null; Q.msg = ''; say(Q.toks[+b.dataset.i].t); quiz(); break;
    case 'unplace': sTap(); Q.placed = Q.placed.filter(i => i !== +b.dataset.i); quiz(); break;
    case 'check': check(); break;
    case 'hint': hint(); break;
    case 'next': closeOverlay(); startQuiz(Q.a, Q.idx + 1); break;
    case 'clearArea': areaClearScreen(); break;
    case 'zukan': go('zukan', { tab: 'm' }); break;
    case 'ztab': view.tab = b.dataset.t; zukan(); break;
    case 'teacherGate': teacherGate(); break;
    case 'closeOv': closeOverlay(); break;
    case 'teacher': go('teacher'); break;
    case 'prompts': go('prompts'); break;
    case 'tlog': view.log = b.dataset.id; teacher(); break;
    case 'tjudge': teacherJudge(b.dataset.id, +b.dataset.li, b.dataset.v === '1'); break;
    case 'judgeLater': judgeLater(); break;
    case 'tdel': {
      const p = DB.players.find(x => x.id === b.dataset.id);
      if (p && confirm(`${p.name} さんのデータを削除します。元に戻せません。よろしいですか？`)) {
        DB.players = DB.players.filter(x => x !== p); if (DB.cur === p.id) DB.cur = null; save(); teacher();
      }
      break;
    }
    case 'copy': {
      const t = b.dataset.t;
      const done = () => { b.textContent = 'コピーしました'; setTimeout(() => b.textContent = 'コピー', 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, () => fallbackCopy(t, done)); else fallbackCopy(t, done);
      break;
    }
  }
});
function fallbackCopy(t, done) {
  const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch (e) {} ta.remove();
}
document.addEventListener('change', e => {
  const el = e.target.closest('[data-tset]'); if (!el) return;
  const p = DB.players.find(x => x.id === el.dataset.id); if (!p) return;
  const k = el.dataset.tset;
  p[k] = k === 'level' ? +el.value : k === 'unlockAll' ? el.checked : el.value;
  save();
});

render();
