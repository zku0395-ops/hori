const { open } = require('./pw.js');
const SP = process.env.OUT || require('os').tmpdir();
const shot = (pg, n) => pg.screenshot({ path: `${SP}/${n}.png` });
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  await pg.addInitScript(() => {
    if (sessionStorage.getItem('init')) return; sessionStorage.setItem('init', 1);
    const cl = { T: 1 }; ['5','2','3','4','6','7','8','9','1'].forEach(a => { for (let s = 0; s <= 4; s++) cl[`${a}-${s}`] = 1; });
    const p = { v: 1, t: 1, coins: 0, earned: 0, items: [], cleared: cl, treasures: [], weak: {}, welcome: 1, look: { color: 'aka', form: 1 } };
    localStorage.setItem('kagemaru_kuku_local_v1', JSON.stringify({ roster: ['たろう'], progress: { 'たろう': JSON.stringify(p) }, log: [], pin: '1234', settings: {} }));
    window.speechSynthesis && (window.speechSynthesis.speak = (u) => setTimeout(() => u.onend && u.onend(), 200));
  });
  await pg.goto('file://' + require('path').resolve(__dirname, '../../index.html'));
  await pg.waitForSelector('text=たろう', { timeout: 20000 });
  await pg.click('text=たろう'); await pg.waitForTimeout(800);
  await shot(pg, 'k0_castle');
  await pg.click('button:has-text("🗺️ ぼうけん")'); await pg.waitForTimeout(800);
  await shot(pg, 'k1_map');
  await pg.click('button:has-text("どろぼう にんじゃ")'); await pg.waitForTimeout(500);
  await shot(pg, 'k2_modal');
  await pg.click('text=▶ はじめる'); await pg.waitForTimeout(2500);
  const answer = async (wrongFirst) => {
    const t = await pg.locator('div.border-indigo-300.px-8').first().innerText();
    const m = t.replace(/\s/g, '').match(/(\d+)×(\d+)/); const ans = String(m[1] * m[2]);
    if (wrongFirst) { await pg.click('button:text-is("0")'); await pg.click('button:has-text("こたえる")'); await pg.waitForTimeout(500); await shot(pg, 'k3_miss'); }
    for (const ch of ans) await pg.click(`button:text-is("${ch}")`);
    await pg.click('button:has-text("こたえる")');
  };
  await answer(true); await pg.waitForTimeout(700); await shot(pg, 'k4_hit'); await pg.waitForTimeout(800);
  for (let k = 1; k < 10; k++) { await answer(false); await pg.waitForTimeout(1500); }
  await pg.waitForTimeout(500); await shot(pg, 'k5_win');
  await pg.waitForTimeout(4000); await shot(pg, 'k6_result');
  await pg.click('button:has-text("ちずへ")'); await pg.waitForTimeout(700); await shot(pg, 'k7_map2');
  await pg.click('button:has-text("おしろ")'); await pg.waitForTimeout(500);
  await pg.click('button:has-text("ずかん")'); await pg.waitForTimeout(500);
  await pg.click('button:has-text("ぼうけん ずかん")'); await pg.waitForTimeout(500); await shot(pg, 'k8_zukan');
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
