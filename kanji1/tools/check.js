// 問題データの点検：node kanji1/tools/check.js
// ・例文の中の漢字が、そのステージまでに習った字だけか
// ・こたえの読みが、その漢字の読みの一覧に入っているか
// ・書き順データがあるか
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'data');
global.window = {};
eval(fs.readFileSync(path.join(dir, 'mondai.js'), 'utf8'));
eval(fs.readFileSync(path.join(dir, 'strokes.js'), 'utf8'));
const { KANJI, STAGES, HATTEN } = window.KANJI_DATA;
const STROKES = window.KANJI_STROKES;
let bad = 0;
const learned = new Set();
const isKanji = (c) => /[一-鿿]/.test(c);
STAGES.filter(s => s.type === 'kanji').forEach(st => {
  st.kanji.forEach(k => learned.add(k));
  st.kanji.forEach(k => {
    const d = KANJI[k];
    if (!d) { console.log('データなし', k); bad++; return; }
    if (d.ex.length !== 3) { console.log('例文が3つでない', k); bad++; }
    if (!STROKES[k]) { console.log('書き順なし', k); bad++; }
    d.ex.forEach(x => {
      const m = x.s.match(/\[(.)\]/);
      if (!m || m[1] !== k) { console.log('[ ] がない', k, x.s); bad++; }
      if (!d.yomi.includes(x.y)) { console.log('よみが一覧にない', k, x.y); bad++; }
      [...x.y].forEach(c => { if (!STROKES[c]) { console.log('ひらがなの書き順なし', c); bad++; } });
      const rubies = [...x.s.matchAll(/\{(.+?)\|(.+?)\}/g)];
      rubies.forEach(r => [...r[1]].forEach(c => { if (!learned.has(c)) { console.log('まだ習っていない字', k, c, x.s); bad++; } }));
      const plain = x.s.replace(/\{(.+?)\|(.+?)\}/g, '').replace(/\[(.)\]/, '');
      [...plain].forEach(c => { if (isKanji(c)) { console.log('ふりがなのない漢字', k, c, x.s); bad++; } });
    });
  });
});
const all = Object.keys(KANJI);
console.log('漢字', all.length, 'ステージ', STAGES.length, 'はってん', HATTEN.reduce((n, h) => n + h.words.length, 0), 'ことば');
console.log(bad ? `⚠ ${bad} か所` : 'OK');
process.exit(bad ? 1 : 0);
