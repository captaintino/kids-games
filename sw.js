// Service worker: caches every game so the whole collection works offline.
// Run `python3 tools/update-sw.py` after changing files: it refreshes ASSETS and
// bumps VERSION, so installed copies download the new files.
const VERSION = 'v27';
const CACHE = `play-party-${VERSION}`;

const ASSETS = [
  './',
  './animals/css/style.css',
  './animals/',
  './animals/index.html',
  './animals/js/animals.js',
  './animals/js/main.js',
  './animals/js/sound-data.js',
  './animals/js/sounds.js',
  './animals/sounds/bee.mp3',
  './animals/sounds/cat.mp3',
  './animals/sounds/chicken.mp3',
  './animals/sounds/cow.mp3',
  './animals/sounds/dog.mp3',
  './animals/sounds/duck.mp3',
  './animals/sounds/elephant.mp3',
  './animals/sounds/frog.mp3',
  './animals/sounds/horse.mp3',
  './animals/sounds/lion.mp3',
  './animals/sounds/monkey.mp3',
  './animals/sounds/mouse.mp3',
  './animals/sounds/owl.mp3',
  './animals/sounds/pig.mp3',
  './animals/sounds/sheep.mp3',
  './bubbles/css/style.css',
  './bubbles/icons/apple-touch-icon.png',
  './bubbles/icons/icon-192.png',
  './bubbles/icons/icon-512.png',
  './bubbles/icons/icon-maskable-512.png',
  './bubbles/icons/icon.svg',
  './bubbles/',
  './bubbles/index.html',
  './bubbles/js/learn.js',
  './bubbles/js/levels.js',
  './bubbles/js/main.js',
  './bubbles/js/scenes.js',
  './bubbles/js/sprites.js',
  './carwash/css/style.css',
  './carwash/',
  './carwash/index.html',
  './carwash/js/main.js',
  './carwash/js/vehicles.js',
  './carwash/js/wash.js',
  './coloring/css/style.css',
  './coloring/icons/apple-touch-icon.png',
  './coloring/icons/icon-192.png',
  './coloring/icons/icon-512.png',
  './coloring/icons/icon-maskable-512.png',
  './coloring/icons/icon.svg',
  './coloring/',
  './coloring/index.html',
  './coloring/js/draw.js',
  './coloring/js/main.js',
  './css/hub.css',
  './dots/css/style.css',
  './dots/',
  './dots/index.html',
  './dots/js/curated.js',
  './dots/js/main.js',
  './dots/js/outline.js',
  './feed/css/style.css',
  './feed/',
  './feed/index.html',
  './feed/js/characters.js',
  './feed/js/main.js',
  './fishing/css/style.css',
  './fishing/',
  './fishing/index.html',
  './fishing/js/engine.js',
  './fishing/js/fish.js',
  './fishing/js/main.js',
  './fishing/js/scene.js',
  './fishing/js/sounds.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon.svg',
  './index.html',
  './jigsaw/css/style.css',
  './jigsaw/',
  './jigsaw/index.html',
  './jigsaw/js/cut.js',
  './jigsaw/js/main.js',
  './js/hub.js',
  './js/version.js',
  './manifest.webmanifest',
  './memory/css/style.css',
  './memory/',
  './memory/index.html',
  './memory/js/main.js',
  './monster/css/style.css',
  './monster/',
  './monster/index.html',
  './monster/js/beat.js',
  './monster/js/feed.js',
  './monster/js/main.js',
  './monster/js/moves.js',
  './monster/js/parade.js',
  './monster/js/parts.js',
  './monster/js/rig.js',
  './music/css/style.css',
  './music/',
  './music/index.html',
  './music/js/instruments.js',
  './music/js/main.js',
  './music/js/songs.js',
  './music/js/voices.js',
  './shared/css/kit.css',
  './shared/fonts/fredoka-latin.woff2',
  './shared/js/art.js',
  './shared/js/audio.js',
  './shared/js/food.js',
  './shared/js/gallery.js',
  './shared/js/grownups.js',
  './shared/js/kit.js',
  './shared/js/motion.js',
  './shared/js/pictures.js',
  './shared/js/rewards.js',
  './shared/js/scenes.js',
  './shared/js/speech.js',
  './shared/js/store.js',
  './shared/js/tap.js',
  './sorter/css/style.css',
  './sorter/',
  './sorter/index.html',
  './sorter/js/art.js',
  './sorter/js/main.js',
  './spinart/css/style.css',
  './spinart/',
  './spinart/index.html',
  './spinart/js/bubbles.js',
  './spinart/js/butterfly.js',
  './spinart/js/main.js',
  './spinart/js/paint.js',
  './spinart/js/spin.js',
  './spinart/js/splatter.js',
  './spinart/js/wall.js',
  './stars/css/style.css',
  './stars/',
  './stars/index.html',
  './stars/js/art.js',
  './stars/js/engine.js',
  './stars/js/main.js',
  './stars/js/seasons.js',
  './stars/js/sky.js',
  './stars/js/sounds.js',
  './stickers/css/style.css',
  './stickers/',
  './stickers/index.html',
  './stickers/js/art.js',
  './stickers/js/main.js',
  './tracing/css/style.css',
  './tracing/',
  './tracing/index.html',
  './tracing/js/letters.js',
  './tracing/js/main.js',
  './tracing/js/words.js',
];

// Tell every open page how the download is going (the grown-up corner shows it).
function tell(msg) {
  return self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
    .then((list) => list.forEach((c) => c.postMessage(Object.assign({ sw: VERSION }, msg))))
    .catch(() => {});
}

// One file, with a time limit and up to three tries (a slow or dropped connection on an
// old tablet must not leave the download hanging forever).
function fetchOne(u, cache) {
  const once = () => Promise.race([
    fetch(new Request(`${u}?v=${VERSION}`, { cache: 'reload' })),
    new Promise((resolve, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
  ]).then((res) => {
    if (!res.ok) throw new Error(`could not fetch ${u}`);
    return cache.put(u, res);
  });
  return once().catch(once).catch(once);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // Each file is fetched with ?v=VERSION so no browser or CDN cache can hand back an
      // older copy: a half-updated mix of files breaks things in confusing ways. Six at a
      // time, which old iPads handle better than all of them at once.
      .then((cache) => {
        let next = 0;
        let done = 0;
        const total = ASSETS.length;
        const worker = () => {
          if (next >= total) return Promise.resolve();
          const u = ASSETS[next++];
          return fetchOne(u, cache).then(() => {
            done++;
            if (done % 8 === 0 || done === total) tell({ type: 'progress', done, total });
            return worker();
          });
        };
        const workers = [];
        for (let i = 0; i < 6; i++) workers.push(worker());
        return Promise.all(workers);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        // throw away the half-filled copy so nothing mistakes it for a finished one
        return caches.delete(CACHE).then(() => tell({ type: 'failed' })).then(() => { throw err; });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('play-party-') && k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => tell({ type: 'ready' }))
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // never answer for the service worker itself or a "check for updates" request
  if (url.pathname.endsWith('/sw.js') || req.cache === 'no-store') return;

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
