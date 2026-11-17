// CDN を ローカルの ファイルで おきかえる（unpkg などに つながらないため）
const fs = require('fs');
// vendor：React・ReactDOM・Babel の npm パッケージを展開した場所と、tailwindcss で作った tw.css（下の README 参照）
const V = process.env.VENDOR || (__dirname + '/vendor/');
const MAP = {
  'react.production.min.js': V + 'react-18.3.1/package/umd/react.production.min.js',
  'react-dom.production.min.js': V + 'react-dom-18.3.1/package/umd/react-dom.production.min.js',
  'babel.min.js': V + 'babel-standalone-7.24.7/package/babel.min.js',
};
const { chromium } = require('playwright');
exports.open = async (w = 1280, h = 800) => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await pg.route(/^https?:\/\//, async (route) => {
    const u = route.request().url();
    const k = Object.keys(MAP).find(k => u.includes(k));
    if (k) return route.fulfill({ body: fs.readFileSync(MAP[k]), contentType: 'application/javascript' });
    if (u.includes('cdn.tailwindcss.com')) {
      const css = fs.readFileSync(V + 'tw.css', 'utf8');
      return route.fulfill({ body: `(function(){var s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.appendChild(s);})();`, contentType: 'application/javascript' });
    }
    return route.abort();
  });
  return { b, pg, errs };
};
