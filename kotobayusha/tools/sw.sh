#!/bin/sh
# Regenerate sw.js with the list of every file to keep offline. Run in the app folder after changing files.
V=$(date +%Y%m%d%H%M)
{
  echo "const CACHE = 'kotoba-$V';"
  echo "const FILES = ["
  echo "  './', 'index.html', 'app.js', 'data.js', 'manifest.json',"
  find images -type f | sort | sed "s/.*/  '&',/"
  echo "];"
  cat <<'JS'
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// pages and code: try the network first so updates show at once; pictures and fonts: use the saved copy first
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mine = url.origin === self.location.origin;
  if (!mine && !url.hostname.includes('fonts.g')) return;
  const put = res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put(req, c)); } return res; };
  const cached = () => caches.match(req, { ignoreSearch: true });
  if (mine && !url.pathname.includes('/images/')) {
    e.respondWith(fetch(req).then(put).catch(() => cached().then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(cached().then(r => r || fetch(req).then(put)));
  }
});
JS
} > sw.js
echo "sw.js: $(grep -c "^  '" sw.js) files, $V"
