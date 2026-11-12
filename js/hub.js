// The game list: one big tile per game, grouped for grown-ups, picked by kids from the pictures.
import * as sfx from '../shared/js/audio.js';
import { SCENES, paintScene, createAnimator } from '../shared/js/scenes.js';
import { say } from '../shared/js/speech.js';
import {
  boot, $, $$, showScreen, setScene, settings, IS_IOS, replayClass,
} from '../shared/js/kit.js';

// To add a game: add it here, then run tools/update-sw.py.
// icon: an emoji, or an image path (img: true).
export const SECTIONS = [
  {
    title: 'Pop & Color', icon: '🎈',
    games: [
      { href: 'bubbles/', name: 'Bubble Pop', icon: 'bubbles/icons/icon.svg', img: true, color: 'purple', say: 'Bubble Pop!' },
      { href: 'coloring/', name: 'Coloring', icon: 'coloring/icons/icon.svg', img: true, color: 'pink', say: 'Coloring!' },
    ],
  },
  {
    title: 'Pictures & Puzzles', icon: '🧩',
    games: [
      { href: 'jigsaw/', name: 'Jigsaw', icon: '🧩', color: 'blue', say: 'Jigsaw puzzles!' },
      { href: 'memory/', name: 'Memory Match', icon: '🃏', color: 'orange', say: 'Memory match!' },
      { href: 'stickers/', name: 'Sticker Scene', icon: '🎩', color: 'teal', say: 'Sticker scene!' },
    ],
  },
  {
    title: 'Learn & Play', icon: '🧠',
    games: [
      { href: 'sorter/', name: 'Shapes & Colors', icon: '🔺', color: 'red', say: 'Shapes and colors!' },
      { href: 'bubbles/#count', name: 'Count & Pop', icon: '🔢', color: 'green', say: 'Count and pop!' },
      { href: 'tracing/', name: 'Letters', icon: '✏️', color: 'yellow', say: 'Letter tracing!' },
      { href: 'animals/', name: 'Animal Sounds', icon: '🐮', color: 'orange', say: 'Animal sounds!' },
    ],
  },
  {
    title: 'Music & Making', icon: '🎵',
    games: [
      { href: 'music/', name: 'Music Time', icon: '🎹', color: 'purple', say: 'Music time!' },
      { href: 'spinart/', name: 'Spin Art', icon: '🌀', color: 'pink', say: 'Spin art!' },
      { href: 'monster/', name: 'Build a Monster', icon: '👾', color: 'green', say: 'Build a monster!' },
    ],
  },
  {
    title: 'Just for Fun', icon: '🌟',
    games: [
      { href: 'stars/', name: 'Catch the Stars', icon: '⭐', color: 'blue', say: 'Catch the stars!' },
      { href: 'fishing/', name: 'Fishing Pond', icon: '🎣', color: 'teal', say: 'Fishing pond!' },
      { href: 'feed/', name: 'Feed the Animal', icon: '🍌', color: 'yellow', say: 'Feed the animal!' },
    ],
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function buildSections() {
  let i = 0;
  $('#sections').innerHTML = SECTIONS.map((sec) => `
    <section class="hub-section">
      <h2 class="section-title"><span class="section-icon">${sec.icon}</span>${esc(sec.title)}</h2>
      <div class="game-grid">
        ${sec.games.map((g) => {
          const icon = g.img
            ? `<img class="game-img" src="${g.icon}" alt="">`
            : `<span class="game-emoji">${g.icon}</span>`;
          return `<a class="game-tile tile ${g.color}" href="${g.href}" style="animation-delay:${(i++) * 0.04}s"
              data-say="${esc(g.say)}"><span class="game-icon">${icon}</span><span class="tile-name">${esc(g.name)}</span></a>`;
        }).join('')}
      </div>
    </section>`).join('');
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
  onAction(action) {
    switch (action) {
      case 'worlds': buildThemeGrid(); showScreen('screen-worlds'); break;
      case 'home': showScreen('screen-home'); break;
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
  onBack() { showScreen('screen-home'); return true; },
});

// coming back with the browser's back button: the page may be restored from memory
window.addEventListener('pageshow', () => { $$('.game-tile').forEach((t) => t.classList.remove('bounce')); });

window.__hub = { SECTIONS };
