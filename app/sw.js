// Service worker BIM Studio: aplicația funcționează offline după prima încărcare.
const VERSION = 'bim-studio-v9';
const ASSETS = [
  './', './index.html', './cad.css', './main.js', './model.js', './state.js', './editor2d.js', './geometry3d.js',
  './view3d.js', './loads.js', './ifc-export.js', './boq.js', './excel.js', './design.js', './pdf.js', './i18n.js', './i18n-fr.js', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './viewer/', './viewer/index.html', './viewer/bim.css', './viewer/main.js', './viewer/demo.js', './viewer/ifc.js',
  './viewer/bimx.js', './viewer/sheets.js',
];
// Bibliotecile externe (three.js, web-ifc) se păstrează în cache după prima folosire
const CDN_HOSTS = ['cdn.jsdelivr.net'];

self.addEventListener('install', (e) => {
  // cache: 'reload' ocolește memoria HTTP a browserului – altfel o versiune nouă putea primi fișiere vechi amestecate cu cele noi
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('bim-studio-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // stale-while-revalidate; fiecare pagină (Proiectare / vizualizator) își are propriul index.html
    e.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const key = req.mode === 'navigate'
          ? new URL(url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname, location.origin).href
          : req;
        const cached = await cache.match(key);
        const net = fetch(req).then((res) => {
          if (res.ok) cache.put(key, res.clone());
          return res;
        }).catch(() => cached);
        return cached || net;
      })
    );
  } else if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
  }
});
