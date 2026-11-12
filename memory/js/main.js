// Memory Match: flip the cards and find the pairs. Card faces are the coloring
// pictures in their real colors. Levels grow from 3 to 8 pairs.
import * as sfx from '../../shared/js/audio.js';
import { say, numberWord } from '../../shared/js/speech.js';
import {
  boot, $, $$, fx, showScreen, celebrate, onPointer, createStore, replayClass, centerOf,
  pickOne, shuffle, rand, clamp, wait, currentScreen, W, H,
} from '../../shared/js/kit.js';
import { PICTURES, INK, star } from '../../shared/js/pictures.js';
import { pictureMarkup, svgOpen } from '../../shared/js/art.js';

const LEVELS = [3, 4, 5, 6, 7, 8];
const store = createStore('memory', { best: {}, level: 3 });
if (!store.data.best || typeof store.data.best !== 'object') store.data.best = {};
if (LEVELS.indexOf(store.data.level) < 0) store.data.level = 3;

const PRAISE = ['Great job!', 'You found them all!', 'Hooray!', 'Super memory!', 'Wonderful!', 'Amazing!', 'You did it!'];

// ---------------------------------------------------------------------------
// Art: card faces (cached SVG images) and the candy card back
// ---------------------------------------------------------------------------
const faces = {};
function faceUrl(pic) {
  if (!faces[pic.id]) {
    const svg = `${svgOpen()}${pictureMarkup(pic, { prefix: `f${pic.id}`, fill: (i) => pic.shapes[i].c })}</svg>`;
    faces[pic.id] = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  return faces[pic.id];
}

// The badge in the middle of every card back: a smiling star in a white circle.
function backBadge() {
  const sp = (x, y, r) => `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<circle cx="50" cy="52" r="44" fill="#c4166b" opacity=".35"/>' +
    `<circle cx="50" cy="50" r="42" fill="#fff" stroke="${INK}" stroke-width="4"/>` +
    '<circle cx="50" cy="50" r="35" fill="#fff4c2"/>' +
    `<path d="${star(50, 53, 31, 14)}" fill="#ffd93b" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    '<path d="M42 32L46 40" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>' +
    `<circle cx="43" cy="53" r="3.6" fill="${INK}"/><circle cx="57" cy="53" r="3.6" fill="${INK}"/>` +
    '<circle cx="42" cy="51.6" r="1.3" fill="#fff"/><circle cx="56" cy="51.6" r="1.3" fill="#fff"/>' +
    `<path d="M45 60Q50 65 55 60" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>` +
    '<ellipse cx="38" cy="60" rx="3.6" ry="2.3" fill="#ff4d5e" opacity=".5"/><ellipse cx="62" cy="60" rx="3.6" ry="2.3" fill="#ff4d5e" opacity=".5"/>' +
    `<path d="${sp(82, 20, 7)}" fill="#fff"/><path d="${sp(16, 82, 5)}" fill="#fff"/>` +
    '</svg>';
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}
document.documentElement.style.setProperty('--back-badge', backBadge());

function cardMarkup(pic, extra) {
  return `<div class="glow"></div><div class="inner${extra || ''}">` +
    '<div class="face back"></div>' +
    `<div class="face front"><img src="${faceUrl(pic)}" alt="${pic.name}" draggable="false"></div></div>`;
}

function heroMarkup() {
  const kitty = PICTURES.find((p) => p.id === 'kitty') || PICTURES[0];
  return `<div class="hero-card left">${cardMarkup(kitty)}</div>` +
    `<div class="hero-card right">${cardMarkup(kitty)}</div>` +
    `<div class="hero-card mid">${cardMarkup(kitty, ' spin')}</div>`;
}

// ---------------------------------------------------------------------------
// Sounds made from the shared synth
// ---------------------------------------------------------------------------
function flipSound(up) {
  if (!sfx.ready()) return;
  const p = rand(0.92, 1.08);
  // the "fff" of a card swishing over, then the soft tap as it lands
  sfx.noise({ dur: 0.07, vol: 0.18, freq: 2600 * p });
  sfx.tone({ type: 'triangle', f0: (up ? 480 : 380) * p, f1: (up ? 920 : 620) * p, dur: 0.08, vol: 0.07 });
  sfx.noise({ dur: 0.035, vol: 0.2, freq: 1100 * p, delay: 0.075 });
  sfx.tone({ type: 'sine', f0: 210 * p, f1: 150 * p, dur: 0.05, vol: 0.12, delay: 0.075 });
}
function softMiss() {
  if (!sfx.ready()) return;
  sfx.tone({ type: 'sine', f0: 523, f1: 494, dur: 0.16, vol: 0.07 });
  sfx.tone({ type: 'sine', f0: 440, f1: 392, dur: 0.22, vol: 0.07, delay: 0.14 });
}
function starSound(i) {
  if (!sfx.ready()) return;
  sfx.pick(4 + i * 2);
  sfx.tone({ type: 'triangle', f0: 1568 * Math.pow(2, i / 6), dur: 0.25, vol: 0.05, delay: 0.03 });
}

// ---------------------------------------------------------------------------
// Title and level picker
// ---------------------------------------------------------------------------
function totalStars() {
  return LEVELS.reduce((n, l) => n + (store.data.best[l] || 0), 0);
}
function updateTitle() {
  const n = totalStars();
  $('#title-best').textContent = n ? `⭐ ${n} of ${LEVELS.length * 3} stars` : 'Flip two cards. Find the pairs!';
}

// A little picture of the table: one tiny card per card in the level.
function miniCards(pairs) {
  const n = pairs * 2;
  const cols = n <= 10 ? Math.ceil(n / 2) : Math.ceil(n / 3);
  let rows = '';
  for (let i = 0; i < n; i += cols) {
    let row = '';
    for (let j = i; j < Math.min(n, i + cols); j++) row += '<i></i>';
    rows += `<span class="mini-row">${row}</span>`;
  }
  return `<span class="mini">${rows}</span>`;
}

const TILE_COLORS = ['green', 'teal', 'blue', 'purple', 'pink', 'orange'];
function buildLevels() {
  $('#level-grid').innerHTML = LEVELS.map((l, i) => {
    const b = store.data.best[l] || 0;
    const stars = [1, 2, 3].map((k) => `<i class="${k <= b ? 'on' : ''}">★</i>`).join('');
    return `<button class="tile level-tile ${TILE_COLORS[i]}${l === store.data.level ? ' next' : ''}" data-level="${l}" style="animation-delay:${i * 50}ms" aria-label="${l} pairs">` +
      `${miniCards(l)}<span class="tile-name">${l} pairs</span><span class="lvl-stars">${stars}</span></button>`;
  }).join('');
}

$('#level-grid').addEventListener('click', (e) => {
  const t = e.target.closest('[data-level]');
  if (!t) return;
  sfx.unlock();
  sfx.click();
  startLevel(+t.dataset.level);
});

// ---------------------------------------------------------------------------
// The game
// ---------------------------------------------------------------------------
const play = $('#play');
const table = $('#table');
let game = null;
let token = 0;
let autoTimer = 0;
let saidIntro = false;

function startLevel(pairs) {
  clearTimeout(autoTimer);
  const my = ++token;
  // pick pictures from different groups first, so the pairs look different
  const byCat = {};
  shuffle(PICTURES).forEach((p) => { (byCat[p.cat] = byCat[p.cat] || []).push(p); });
  const pool = [];
  const cats = shuffle(Object.keys(byCat));
  for (let k = 0; pool.length < PICTURES.length; k++) {
    cats.forEach((c) => { if (byCat[c][k]) pool.push(byCat[c][k]); });
  }
  const pics = pool.slice(0, pairs);
  const deck = shuffle(pics.concat(pics));
  game = { pairs, cards: [], open: [], busy: false, found: 0, moves: 0, won: false, token: my };
  table.innerHTML = '';
  deck.forEach((pic, i) => {
    const el = document.createElement('div');
    el.className = 'mcard deal';
    el.style.animationDelay = `${i * 45}ms`;
    el.innerHTML = cardMarkup(pic);
    table.appendChild(el);
    game.cards.push({ pic, el, up: false, matched: false, i });
  });
  $('#pips').innerHTML = pics.map(() => '<span class="pip">★</span>').join('');
  showScreen(null);
  play.classList.remove('hidden');
  layout();
  sfx.whoosh();
  if (!saidIntro) { saidIntro = true; say('Find the matching pairs!'); } else say(`${numberWord(pairs)} pairs!`);
  // the deal animation is only for the start
  setTimeout(() => { if (my === token) game.cards.forEach((c) => c.el.classList.remove('deal')); }, deck.length * 45 + 600);
}

// Biggest cards that fit, in whatever grid suits the screen.
function layout() {
  if (!game) return;
  const r = $('#area').getBoundingClientRect();
  const n = game.cards.length;
  const gap = clamp(Math.min(W, H) * 0.022, 7, 16);
  const ratio = 0.9; // width / height (faces are square pictures, cropped a little at the sides)
  let best = null;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const w = Math.min((r.width - gap * (cols - 1)) / cols, ((r.height - gap * (rows - 1)) / rows) * ratio);
    const empty = cols * rows - n;
    const score = w * (1 - empty * 0.03) * (empty >= cols ? 0 : 1);
    if (!best || score > best.score) best = { cols, rows, w, score };
  }
  const w = Math.min(best.w, 230);
  const h = w / ratio;
  const { cols, rows } = best;
  const totalH = rows * h + (rows - 1) * gap;
  const oy = r.top + (r.height - totalH) / 2;
  game.cards.forEach((c, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    const rowW = inRow * w + (inRow - 1) * gap;
    const ox = r.left + (r.width - rowW) / 2;
    const col = i - row * cols;
    const s = c.el.style;
    s.left = `${Math.round(ox + col * (w + gap))}px`;
    s.top = `${Math.round(oy + row * (h + gap))}px`;
    s.width = `${Math.round(w)}px`;
    s.height = `${Math.round(h)}px`;
  });
  table.style.setProperty('--card-w', `${Math.round(w)}px`);
}

function cardAt(x, y) {
  if (!game) return null;
  for (const c of game.cards) {
    const b = c.el.getBoundingClientRect();
    if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return c;
  }
  return null;
}

onPointer(table, {
  down(p) {
    if (!game || currentScreen() !== null) return false;
    const c = cardAt(p.x, p.y);
    if (!c) return false;
    tap(c);
    return true;
  },
});

function tap(c) {
  if (game.won || c.matched || c.up) {
    if (c.matched) replayClass(c.el, 'bounce');
    return;
  }
  if (game.busy) return; // two cards are showing: wait for them
  c.up = true;
  c.el.classList.remove('down-slow');
  c.el.classList.add('up');
  flipSound(true);
  game.open.push(c);
  if (game.open.length < 2) return;
  game.busy = true;
  game.moves++;
  const a = game.open[0];
  const b = game.open[1];
  const my = token;
  if (a.pic === b.pic) setTimeout(() => { if (my === token) match(a, b); }, 480);
  else setTimeout(() => { if (my === token) mismatch(a, b); }, 1350);
}

function match(a, b) {
  a.matched = b.matched = true;
  game.open = [];
  game.busy = false;
  game.found++;
  [a, b].forEach((c, k) => {
    c.el.classList.add('matched');
    setTimeout(() => replayClass(c.el, 'happy'), k * 90);
    const p = centerOf(c.el);
    fx.sparkles(p.x, p.y, 9, 46);
    fx.ring(p.x, p.y, '#fff3a6');
  });
  sfx.chime([0, 4, 7, 12], 660 * Math.pow(2, (game.found - 1) / 12));
  const mid = centerOf(b.el);
  fx.text(mid.x, mid.y - 20, `${a.pic.name}!`, '#fff', 30, 1);
  say(`${a.pic.name}!`);
  const pip = $$('.pip')[game.found - 1];
  if (pip) { pip.classList.add('on'); replayClass(pip, 'bounce'); }
  if (game.found === game.pairs) {
    game.won = true;
    const my = token;
    setTimeout(() => { if (my === token) win(); }, 900);
  }
}

function mismatch(a, b) {
  [a, b].forEach((c) => {
    c.up = false;
    c.el.classList.add('down-slow');
    c.el.classList.remove('up');
  });
  softMiss();
  setTimeout(() => flipSound(false), 120);
  game.open = [];
  game.busy = false;
}

function starsFor(pairs, moves) {
  const extra = moves - pairs;
  if (extra <= Math.max(4, Math.ceil(pairs * 1.6))) return 3;
  if (extra <= pairs * 3 + 2) return 2;
  return 1;
}

async function win() {
  const my = token;
  const pairs = game.pairs;
  const stars = starsFor(pairs, game.moves);
  store.data.best[pairs] = Math.max(store.data.best[pairs] || 0, stars);
  const idx = LEVELS.indexOf(pairs);
  if (idx < LEVELS.length - 1) store.data.level = Math.max(store.data.level, LEVELS[idx + 1]);
  store.persist();
  // a happy wave across the table
  game.cards.forEach((c, i) => setTimeout(() => { if (my === token) replayClass(c.el, 'happy'); }, i * 50));
  celebrate(pickOne(['Hooray!', 'You did it!', 'All found!', 'Super!']), `${numberWord(pairs)} pairs!`.replace(/^./, (s) => s.toUpperCase()));
  say(pickOne(PRAISE));
  await wait(2000);
  if (my !== token) return;
  showWin(stars);
}

function showWin(stars) {
  const seen = [];
  game.cards.forEach((c) => { if (seen.indexOf(c.pic) < 0) seen.push(c.pic); });
  $('#win-pics').innerHTML = seen.map((p, i) =>
    `<span class="win-pic" style="animation-delay:${300 + i * 60}ms"><img src="${faceUrl(p)}" alt="${p.name}"></span>`).join('');
  $('#win-title').textContent = pickOne(['You did it!', 'All pairs found!', 'Great memory!']);
  const els = $$('#win-stars .rstar');
  els.forEach((s) => s.classList.remove('on'));
  showScreen('screen-win');
  const my = token;
  els.forEach((s, i) => {
    if (i >= stars) return;
    setTimeout(() => {
      if (my !== token) return;
      s.classList.add('on');
      starSound(i);
      const p = centerOf(s);
      fx.sparkles(p.x, p.y, 6, 26);
    }, 450 + i * 350);
  });
  // carry on to the next level by itself after a little while
  const fill = $('#autofill');
  fill.classList.remove('run');
  void fill.offsetWidth;
  fill.classList.add('run');
  clearTimeout(autoTimer);
  autoTimer = setTimeout(() => { if (my === token && currentScreen() === 'screen-win') nextLevel(); }, 9000);
}

function nextLevel() {
  clearTimeout(autoTimer);
  const idx = LEVELS.indexOf(game ? game.pairs : 3);
  startLevel(LEVELS[Math.min(LEVELS.length - 1, idx + 1)]);
}

function leaveGame(to) {
  clearTimeout(autoTimer);
  token++;
  game = null;
  play.classList.add('hidden');
  table.innerHTML = '';
  fx.clear();
  if (to === 'levels') openLevels();
  else { updateTitle(); showScreen('screen-title'); }
}

function openLevels() {
  buildLevels();
  showScreen('screen-levels');
}

boot({
  party: ['#3d9bff', '#9d5cff', '#ff6fb5'],
  onAction(action) {
    switch (action) {
      case 'play': startLevel(store.data.level); break;
      case 'levels': openLevels(); break;
      case 'home': updateTitle(); showScreen('screen-title'); break;
      case 'back': leaveGame('levels'); break;
      case 'next': nextLevel(); break;
      case 'again': clearTimeout(autoTimer); startLevel(game ? game.pairs : store.data.level); break;
    }
  },
  onBack(screen) {
    if (screen === null || screen === 'screen-win') { leaveGame('levels'); return true; }
    if (screen === 'screen-levels') { updateTitle(); showScreen('screen-title'); return true; }
    return false;
  },
  onResize() { layout(); },
});

$('#hero').innerHTML = heroMarkup();
updateTitle();

// for automated tests
window.__memory = {
  get game() { return game; },
  store,
  startLevel,
  starsFor,
};
