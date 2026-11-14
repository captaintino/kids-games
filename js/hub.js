// The game list: one big tile per game, grouped for grown-ups, picked by kids from the pictures.
import * as sfx from '../shared/js/audio.js';
import { SCENES, paintScene, createAnimator } from '../shared/js/scenes.js';
import { say } from '../shared/js/speech.js';
import {
  boot, $, $$, showScreen, setScene, settings, IS_IOS, replayClass, centerOf, fx,
} from '../shared/js/kit.js';
import {
  grownups, saveGrownups, isHidden, playedToday, holdGate,
} from '../shared/js/grownups.js';
import { STICKERS, CATS, album, stickerHTML, resetAlbum } from '../shared/js/rewards.js';
import { VERSION, BUILT } from './version.js';
import { motion, setMotionChoice } from '../shared/js/motion.js';

// To add a game: add it here, then run tools/update-sw.py.
// id: used by the grown-up corner to hide a game. icon: an emoji, or an image path (img: true).
export const SECTIONS = [
  {
    title: 'Pop & Color', icon: '🎈',
    games: [
      { id: 'bubbles', href: 'bubbles/', name: 'Bubble Pop', icon: 'bubbles/icons/icon.svg', img: true, color: 'purple', say: 'Bubble Pop!' },
      { id: 'coloring', href: 'coloring/', name: 'Coloring', icon: 'coloring/icons/icon.svg', img: true, color: 'pink', say: 'Coloring!' },
    ],
  },
  {
    title: 'Pictures & Puzzles', icon: '🧩',
    games: [
      { id: 'jigsaw', href: 'jigsaw/', name: 'Jigsaw', icon: '🧩', color: 'blue', say: 'Jigsaw puzzles!' },
      { id: 'memory', href: 'memory/', name: 'Memory Match', icon: '🃏', color: 'orange', say: 'Memory match!' },
      { id: 'stickers', href: 'stickers/', name: 'Sticker Scene', icon: '🎩', color: 'teal', say: 'Sticker scene!' },
      { id: 'dots', href: 'dots/', name: 'Dot-to-Dot', icon: '✏️', color: 'purple', say: 'Dot to dot!' },
    ],
  },
  {
    title: 'Learn & Play', icon: '🧠',
    games: [
      { id: 'sorter', href: 'sorter/', name: 'Shapes & Colors', icon: '🔺', color: 'red', say: 'Shapes and colors!' },
      { id: 'count', href: 'bubbles/#count', name: 'Count & Pop', icon: '🔢', color: 'green', say: 'Count and pop!' },
      { id: 'shapepop', href: 'bubbles/#shapes', name: 'Shape Pop', icon: '🔷', color: 'blue', say: 'Shape pop!' },
      { id: 'letterpop', href: 'bubbles/#letters', name: 'Letter Pop', icon: '🅰️', color: 'pink', say: 'Letter pop!' },
      { id: 'tracing', href: 'tracing/', name: 'Letters', icon: '🔤', color: 'yellow', say: 'Letter tracing!' },
      { id: 'animals', href: 'animals/', name: 'Animal Sounds', icon: '🐮', color: 'orange', say: 'Animal sounds!' },
    ],
  },
  {
    title: 'Music & Making', icon: '🎵',
    games: [
      { id: 'music', href: 'music/', name: 'Music Time', icon: '🎹', color: 'purple', say: 'Music time!' },
      { id: 'spinart', href: 'spinart/', name: 'Spin Art', icon: '🌀', color: 'pink', say: 'Spin art!' },
      { id: 'monster', href: 'monster/', name: 'Build a Monster', icon: '👾', color: 'green', say: 'Build a monster!' },
    ],
  },
  {
    title: 'Just for Fun', icon: '🌟',
    games: [
      { id: 'stars', href: 'stars/', name: 'Catch the Stars', icon: '⭐', color: 'blue', say: 'Catch the stars!' },
      { id: 'fishing', href: 'fishing/', name: 'Fishing Pond', icon: '🎣', color: 'teal', say: 'Fishing pond!' },
      { id: 'feed', href: 'feed/', name: 'Feed the Animal', icon: '🍌', color: 'yellow', say: 'Feed the animal!' },
      { id: 'carwash', href: 'carwash/', name: 'Car Wash', icon: '🚗', color: 'red', say: 'Car wash!' },
    ],
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function buildSections() {
  let i = 0;
  $('#sections').innerHTML = SECTIONS.map((sec) => {
    const games = sec.games.filter((g) => !isHidden(g.id));
    if (!games.length) return '';
    return `
    <section class="hub-section">
      <h2 class="section-title"><span class="section-icon">${sec.icon}</span>${esc(sec.title)}</h2>
      <div class="game-grid">
        ${games.map((g) => {
          const icon = g.img
            ? `<img class="game-img" src="${g.icon}" alt="">`
            : `<span class="game-emoji">${g.icon}</span>`;
          return `<a class="game-tile tile ${g.color}" href="${g.href}" style="animation-delay:${(i++) * 0.04}s"
              data-say="${esc(g.say)}"><span class="game-icon">${icon}</span><span class="tile-name">${esc(g.name)}</span></a>`;
        }).join('')}
      </div>
    </section>`;
  }).join('');
  updateBookButton();
}

// Tiles are real links (so they work even before the script loads), but give
// them a bounce and a sound before leaving.
document.addEventListener('click', (e) => {
  const a = e.target.closest('.game-tile');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  sfx.unlock();
  sfx.chime([0, 4, 7, 12], 660, 0.05);
  replayClass(a, 'bounce');
  say(a.dataset.say);
  const href = a.getAttribute('href');
  setTimeout(() => { window.location.href = href; }, 380);
});

// ---------------------------------------------------------------------------
// Worlds (shared by every game, including Bubble Pop and Coloring)
// ---------------------------------------------------------------------------
// Bubble Pop and Coloring keep their own saves; tell them about the new world too.
const OLD_SAVES = ['bubble-pop-party.v1', 'color-splash-party.v1'];
function syncOldGames(id) {
  for (const key of OLD_SAVES) {
    try {
      const s = JSON.parse(localStorage.getItem(key)) || {};
      s.scene = id;
      localStorage.setItem(key, JSON.stringify(s));
    } catch (err) { /* storage blocked */ }
  }
}

function buildThemeGrid() {
  const grid = $('#theme-grid');
  grid.querySelectorAll('canvas').forEach((c) => { c.width = 0; c.height = 0; });
  grid.innerHTML = '';
  const cur = settings.data.scene;
  for (const sc of SCENES) {
    const btn = document.createElement('button');
    btn.className = 'theme-card' + (sc.id === cur ? ' selected' : '');
    btn.setAttribute('aria-label', sc.id === 'party' ? 'Party' : sc.name);
    btn.setAttribute('aria-pressed', String(sc.id === cur));
    btn.appendChild(document.createElement('canvas'));
    const name = sc.id === 'party' ? 'Party' : sc.name;
    btn.insertAdjacentHTML('beforeend', `<span class="check">✓</span><span class="theme-name">${sc.icon} ${name}</span>`);
    btn.addEventListener('click', () => {
      sfx.unlock();
      sfx.chime([0, 4, 7], 784, 0.05);
      say(name);
      setScene(sc.id);
      syncOldGames(sc.id);
      grid.querySelectorAll('.theme-card').forEach((c) => {
        const on = c === btn;
        c.classList.toggle('selected', on);
        c.setAttribute('aria-pressed', String(on));
      });
    });
    grid.appendChild(btn);
  }
  // paint the little previews once the cards have a size
  requestAnimationFrame(() => {
    grid.querySelectorAll('canvas').forEach((cv, i) => {
      const r = cv.getBoundingClientRect();
      const w = Math.max(60, r.width);
      const h = Math.max(75, r.height);
      const sc = Math.min(2, window.devicePixelRatio || 1);
      const vw = 360;
      const vh = (360 * h) / w;
      cv.width = Math.round(w * sc);
      cv.height = Math.round(h * sc);
      const c = cv.getContext('2d');
      c.scale((w * sc) / vw, (h * sc) / vh);
      paintScene(c, vw, vh, SCENES[i].id, HUB_PARTY);
      const anim = createAnimator(SCENES[i].id);
      for (let k = 0; k < 3; k++) anim.draw(c, vw, vh, 2 + k, k === 0 ? 0 : 1.2);
    });
  });
}

// ---------------------------------------------------------------------------
// Sticker book: every sticker earned in any game
// ---------------------------------------------------------------------------
let bookCat = CATS[0].key;

function updateBookButton() {
  const n = Object.keys(album().have).length;
  $('#book-count').textContent = n ? `${n} / ${STICKERS.length}` : '';
}

function buildBook() {
  const have = album().have;
  const n = Object.keys(have).length;
  $('#book-total').textContent = `${n} of ${STICKERS.length} stickers`;
  $('#book-tabs').innerHTML = CATS.map((c) => {
    const got = STICKERS.filter((s) => s.cat === c.key && have[s.id]).length;
    const all = STICKERS.filter((s) => s.cat === c.key).length;
    return `<button class="tab${c.key === bookCat ? ' on' : ''}" data-action="book-cat" data-cat="${c.key}" data-quiet
      aria-label="${c.name}">${c.icon} <small>${got}/${all}</small></button>`;
  }).join('');
  $('#book-page').innerHTML = STICKERS.filter((s) => s.cat === bookCat).map((s, i) => {
    const count = have[s.id] || 0;
    return count
      ? `<button class="slot got" data-action="book-sticker" data-id="${s.id}" data-quiet style="animation-delay:${i * 0.03}s"
          aria-label="${s.name}">${stickerHTML(s, 'slot-art')}${count > 1 ? `<span class="slot-n">×${count}</span>` : ''}</button>`
      : `<div class="slot empty" aria-label="Not found yet">${stickerHTML(s, 'slot-art')}<span class="slot-q">?</span></div>`;
  }).join('');
  if (!n) {
    $('#book-page').insertAdjacentHTML('afterbegin',
      '<p class="book-hint">Play any game to earn stickers! 🎉</p>');
  }
}

function openBook() {
  buildBook();
  showScreen('screen-book');
  const n = Object.keys(album().have).length;
  say(n ? `Your sticker book! You have ${n} stickers!` : 'Your sticker book! Play games to earn stickers!');
}

// ---------------------------------------------------------------------------
// Grown-up corner (opened by holding the lock button for 3 seconds)
// ---------------------------------------------------------------------------
const LIMITS = [0, 15, 30, 45, 60, 90, 120];

function buildGrownups() {
  const g = grownups.data;
  $('#gu-name').value = g.name || '';
  $('#gu-volume').value = Math.round((g.volume == null ? 1 : g.volume) * 100);
  $('#gu-voice').value = Math.round((g.voice == null ? 1 : g.voice) * 100);
  $('#gu-limit').innerHTML = LIMITS.map((m) =>
    `<button class="chip${(+g.limit || 0) === m ? ' on' : ''}" data-action="gu-limit" data-min="${m}">${m ? `${m} min` : 'No limit'}</button>`).join('');
  $('#gu-today').textContent = `Played today: ${playedToday()} min`;
  buildMotion();
  $('#gu-stickers').checked = g.stickers !== false;
  $('#gu-games').innerHTML = SECTIONS.map((sec) => sec.games.map((gm) => `
    <label class="gu-game"><input type="checkbox" data-game="${gm.id}"${isHidden(gm.id) ? '' : ' checked'}>
      <span class="gu-ico">${gm.img ? `<img src="${gm.icon}" alt="">` : gm.icon}</span> ${esc(gm.name)}</label>`).join('')).join('');
}

// Background motion: Auto (picked for this device), or a level chosen by a grown-up
const MOTION_CHOICES = [
  ['auto', 'Auto', 'Picked for this device, and turned down by itself if the games run slowly.'],
  [0, 'Full', 'Smooth movement in the background worlds.'],
  [1, 'Light', 'Gentler movement, easier on older tablets.'],
  [2, 'Minimal', 'Slow, stepping movement for very old or slow devices.'],
  [3, 'Still', 'The background worlds don\'t move at all. Good for kids who find movement distracting.'],
];
function buildMotion() {
  const cur = motion.choice;
  $('#gu-motion').innerHTML = MOTION_CHOICES.map(([v, name]) =>
    `<button class="chip${cur === v ? ' on' : ''}" data-action="gu-motion" data-motion="${v}">${
      v === 'auto' ? `Auto (${motion.autoName})` : name}</button>`).join('');
  const pick = MOTION_CHOICES.filter((c) => c[0] === cur)[0];
  $('#gu-motion-note').textContent = pick ? pick[2] : '';
}

// Version info for debugging: the version of the page that's running, and which offline
// copies are stored (an older one still listed means the update hasn't finished yet).
function buildVersion() {
  const box = $('#gu-version');
  const dpr = window.devicePixelRatio || 1;
  const lines = [`Version ${VERSION} (${BUILT})`];
  // the page and its scripts should always match: if not, an update only half arrived
  const pageVersion = box.getAttribute('data-version');
  if (pageVersion && pageVersion !== VERSION) {
    lines.push(`⚠️ Out of sync: page ${pageVersion}, scripts ${VERSION}. Close and reopen the app.`);
  }
  lines.push(
    `Screen ${window.innerWidth}×${window.innerHeight} at ${Math.round(dpr * 100) / 100}x`,
    `Background motion: ${motion.name} (${motion.reason})`);
  const show = (more) => { box.textContent = lines.concat(more).join('\n'); };
  show(['Offline copy: checking…']);
  const sw = navigator.serviceWorker;
  if (!sw || !window.caches) { show(['Offline copy: not supported on this browser']); return; }
  caches.keys().then((keys) => {
    const mine = keys.filter((k) => k.indexOf('play-party-') === 0).map((k) => k.slice(11));
    const state = sw.controller ? 'offline mode on' : 'offline mode not running yet';
    show([`Offline copy: ${mine.length ? mine.join(', ') : 'none yet'} (${state})`]);
  }, () => show(['Offline copy: unknown']));
}

function openGrownups() {
  buildGrownups();
  buildVersion();
  showScreen('screen-grownups');
}

function readGrownups() {
  const g = grownups.data;
  g.name = $('#gu-name').value.trim().slice(0, 20);
  g.volume = +$('#gu-volume').value / 100;
  g.voice = +$('#gu-voice').value / 100;
  g.stickers = $('#gu-stickers').checked;
  g.hidden = $$('#gu-games input').filter((i) => !i.checked).map((i) => i.dataset.game);
  saveGrownups();
}

function wireGrownups() {
  ['#gu-name', '#gu-volume', '#gu-voice', '#gu-stickers'].forEach((sel) => {
    $(sel).addEventListener('change', readGrownups);
  });
  $('#gu-name').addEventListener('input', readGrownups);
  $('#gu-games').addEventListener('change', readGrownups);
  holdGate($('#gu-lock'), openGrownups);
}

// ---------------------------------------------------------------------------
// Install
// ---------------------------------------------------------------------------
let installPrompt = null;
const IS_IPAD = /iPad/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function isInstalled() {
  try {
    return navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches;
  } catch (err) { return false; }
}
function updateInstallButton() {
  $('#install-btn').classList.toggle('hidden', isInstalled() || !(installPrompt || IS_IOS));
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  updateInstallButton();
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  updateInstallButton();
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
const HUB_PARTY = ['#8a4dff', '#ff6fb5', '#ffb86b'];
buildSections();
updateInstallButton();
boot({
  hub: true,
  party: HUB_PARTY,
  onAction(action, el) {
    switch (action) {
      case 'worlds': buildThemeGrid(); showScreen('screen-worlds'); break;
      case 'home': showScreen('screen-home'); break;
      case 'book': openBook(); break;
      case 'book-cat': bookCat = el.dataset.cat; sfx.click(); buildBook(); break;
      case 'book-sticker': {
        const st = STICKERS.filter((x) => x.id === el.dataset.id)[0];
        replayClass(el, 'bounce');
        const c = centerOf(el);
        fx.sparkles(c.x, c.y, 8, 30);
        sfx.chime([0, 7, 12], 880, 0.05);
        if (st) say(st.name);
        break;
      }
      case 'gu-motion':
        setMotionChoice(el.dataset.motion === 'auto' ? 'auto' : +el.dataset.motion);
        buildMotion();
        buildVersion();
        break;
      case 'gu-limit':
        grownups.data.limit = +el.dataset.min;
        saveGrownups();
        buildGrownups();
        break;
      case 'gu-test':
        readGrownups();
        sfx.chime([0, 4, 7, 12], 660, 0.08);
        say('Hello! This is how loud I am.');
        break;
      case 'gu-reset':
        showScreen('screen-reset');
        break;
      case 'gu-reset-no': showScreen('screen-grownups'); break;
      case 'gu-reset-yes':
        resetAlbum();
        updateBookButton();
        showScreen('screen-grownups');
        break;
      case 'gu-done':
        readGrownups();
        buildSections();
        showScreen('screen-home');
        break;
      case 'install':
        if (installPrompt) {
          installPrompt.prompt();
          installPrompt.userChoice.then(() => { installPrompt = null; updateInstallButton(); }, () => {});
        } else if (IS_IOS) {
          $('#install-where').textContent = IS_IPAD
            ? 'On iPad, the Share button is at the top, next to the address bar.'
            : 'On iPhone, the Share button is at the bottom of the screen. Tap the bottom edge if you can\'t see it.';
          showScreen('screen-install');
        }
        break;
    }
  },
  onBack(screen) {
    if (screen === 'screen-grownups') { readGrownups(); buildSections(); }
    if (screen === 'screen-reset') { showScreen('screen-grownups'); return true; }
    showScreen('screen-home');
    return true;
  },
});
wireGrownups();
// stickers earned in a game show up when coming back with the back button
window.addEventListener('pageshow', () => { updateBookButton(); buildSections(); });

// coming back with the browser's back button: the page may be restored from memory
window.addEventListener('pageshow', () => { $$('.game-tile').forEach((t) => t.classList.remove('bounce')); });

window.__hub = { SECTIONS };
