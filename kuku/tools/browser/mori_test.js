// まおうの もりの 確かめ（Playwright）：OUT=スクリーンショットの置き場所 node mori_test.js
// ぼうけんを ぜんぶ クリアした子で、もりの ちず → ①の ボス（ぶんしょうだいなど 6もん）→ まおう を ためす
const { open } = require('./pw.js');
const SP = process.env.OUT || require('os').tmpdir();
const shot = (pg, n) => pg.screenshot({ path: `${SP}/${n}.png` });
const progress = (extra) => {
  const cl = { T: 1 };
  ['5', '2', '3', '4', '6', '7', '8', '9', '1'].forEach(a => { for (let s = 0; s <= 4; s++) cl[`${a}-${s}`] = 1; });
  for (let p = 1; p <= 8; p++) for (let n = 1; n <= 6; n++) cl[`B${p}-${n}`] = 1;
  (extra || []).forEach(id => { cl[id] = 1; });
  return { v: 1, t: 1, coins: 0, earned: 0, items: [], cleared: cl, treasures: [], bitems: [], weak: {}, welcome: 1, look: { color: 'aka', form: 1 } };
};
// ヒントを 3かい おして、ひかった こたえを えらぶ（すうじの ときは「こたえは ○ だよ」を いれる）
async function solve(pg, label) {
  for (let k = 0; k < 3; k++) { await pg.click('button:has-text("ヒント")'); await pg.waitForTimeout(350); }
  const t = await pg.locator('body').innerText();
  const m = t.match(/こたえは (\d+) だよ/);
  if (m) { for (const ch of m[1]) await pg.click(`button:text-is("${ch}")`); await pg.click('button:has-text("こたえる")'); }
  else await pg.locator('button.glow').filter({ hasNotText: 'ヒント' }).first().click();
  await pg.waitForTimeout(1300);
}
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  await pg.exposeFunction('__prog', () => JSON.stringify(progress(process.env.EXTRA ? process.env.EXTRA.split(',') : ['M1-1', 'M1-2', 'M1-3', 'M1-4', 'M1-5'])));
  await pg.addInitScript(async () => {
    window.speechSynthesis && (window.speechSynthesis.speak = (u) => setTimeout(() => u.onend && u.onend(), 120));
    if (sessionStorage.getItem('init')) return; sessionStorage.setItem('init', 1);
  });
  await pg.goto('file://' + require('path').resolve(__dirname, '../../index.html'));
  await pg.evaluate(async () => {
    localStorage.setItem('kagemaru_kuku_local_v1', JSON.stringify({ roster: ['たろう'], progress: { 'たろう': await window.__prog() }, log: [], pin: '1234', settings: {} }));
  });
  await pg.reload();
  await pg.waitForSelector('text=たろう', { timeout: 20000 });
  await pg.click('text=たろう'); await pg.waitForTimeout(800);
  await shot(pg, 'm0_castle');
  await pg.click('button:has-text("🌲 まおうの もり")'); await pg.waitForTimeout(800);
  await shot(pg, 'm1_map');
  const target = process.env.FOE || 'くすのき じい';
  await pg.click(process.env.SEL || `button:has-text("${target}")`); await pg.waitForTimeout(500);
  await shot(pg, 'm2_modal');
  await pg.click('text=▶ はじめる'); await pg.waitForTimeout(3000);
  const n = Number(process.env.N || 6);
  for (let i = 0; i < n; i++) {
    const t = await pg.locator('body').innerText();
    const kind = /ぶんしょうだい/.test(t) ? 'story' : /の くくは？/.test(t) ? 'findEq' : 'kuku';
    await shot(pg, `m3_q${i + 1}_${kind}`);
    if (kind === 'story' && i < 3) {
      // わざと たしざんを えらぶ
      await pg.locator('button', { hasText: '＋' }).first().click(); await pg.waitForTimeout(600);
      await shot(pg, `m3_q${i + 1}_story_miss`);
    }
    await solve(pg);
    if (kind === 'story') { await shot(pg, `m3_q${i + 1}_story_num`); await solve(pg); }
  }
  await pg.waitForTimeout(1500); await shot(pg, 'm4_win');
  await pg.waitForTimeout(6000); await shot(pg, 'm5_result');
  if (process.env.ROOM) {
    await pg.click('button:has-text("ちずへ")'); await pg.waitForTimeout(600);
    await pg.click('button:has-text("おしろ")');
    await pg.waitForTimeout(600);
    await pg.click('button:has-text("にんじゃの へや")'); await pg.waitForTimeout(800); await shot(pg, 'm6_room');
  }
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
