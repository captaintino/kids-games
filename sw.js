// Service worker: caches every game so the whole collection works offline.
// Run `python3 tools/update-sw.py` after changing files: it refreshes ASSETS and
// bumps VERSION, so installed copies download the new files.
const VERSION = 'v2';
const CACHE = `play-party-${VERSION}`;

const ASSETS = [
  './',
  './bubbles/css/style.css',
  './bubbles/icons/apple-touch-icon.png',
  './bubbles/icons/icon-192.png',
  './bubbles/icons/icon-512.png',
  './bubbles/icons/icon-maskable-512.png',
  './bubbles/icons/icon.svg',
  './bubbles/',
  './bubbles/index.html',
  './bubbles/js/levels.js',
  './bubbles/js/main.js',
  './bubbles/js/scenes.js',
  './bubbles/js/sprites.js',
  './coloring/css/style.css',
  './coloring/icons/apple-touch-icon.png',
  './coloring/icons/icon-192.png',
  './coloring/icons/icon-512.png',
  './coloring/icons/icon-maskable-512.png',
  './coloring/icons/icon.svg',
  './coloring/',
  './coloring/index.html',
  './coloring/js/main.js',
  './css/hub.css',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon.svg',
  './index.html',
  './jigsaw/',
  './jigsaw/index.html',
  './jigsaw/js/cut.js',
  './js/hub.js',
  './manifest.webmanifest',
  './shared/css/kit.css',
  './shared/fonts/fredoka-latin.woff2',
  './shared/js/art.js',
  './shared/js/audio.js',
  './shared/js/kit.js',
  './shared/js/pictures.js',
  './shared/js/scenes.js',
  './shared/js/speech.js',
  './stars/js/engine.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('play-party-') && k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Page loads: serve the cached page for that game (works offline).
  if (req.mode === 'navigate') {
    const page = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
    event.respondWith(
      caches.match(page, { ignoreSearch: true })
        .then((cached) => cached || fetch(req))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Everything else: cache first, then network (and remember it).
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
