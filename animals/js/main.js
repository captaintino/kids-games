// Animal Sounds: tap an animal to hear its (made-up, synthesized) sound and
// watch it bounce, or play "Who says...?" and find the animal that made a sound.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import {
  boot, $, $$, fx, showScreen, banner, createStore, centerOf, replayClass, pickOne, shuffle, wait, W, H,
} from '../../shared/js/kit.js';
import { ANIMALS, animalSVG } from './animals.js';
import { play as playSound, SOUNDS, soundLength } from './sounds.js';

const store = createStore('animals', { stars: 0 });
const byId = {};
ANIMALS.forEach((a) => { byId[a.id] = a; });

const RIGHT = ['Yes!', 'You got it!', 'Great job!', "That's right!", 'Hooray!', 'Well done!', 'Super!'];
const lower = (s) => s.toLowerCase();
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

let mode = null; // 'play' | 'quiz' | null (title)

// ---------------------------------------------------------------------------
// Tiles
// ---------------------------------------------------------------------------
const svgCache = {};
const art = (a) => svgCache[a.id] || (svgCache[a.id] = animalSVG(a));

function tileHTML(a, i, cls) {
  return `<button class="animal ${cls || ''}" data-action="animal" data-quiet data-id="${a.id}" aria-label="${a.name}"
    style="--bg1:${a.bg[0]};--bg2:${a.bg[1]};--ink:${a.ink};animation-delay:${(i * 0.04).toFixed(2)}s">
    <span class="a-card"><span class="a-bob">${art(a)}</span></span>
    <span class="a-name">${a.name}</span>
    <span class="bubble"><span>${a.word}</span></span>
  </button>`;
}

/** Make an animal sing: its sound, a bounce (or a wiggle), mouth flaps and a speech bubble. */
function perform(tile, a, move) {
  playSound(a.id);
  replayClass(tile.querySelector('.a-card'), move || 'hop');
  replayClass(tile, 'talk');
  (tile._timers || []).forEach(clearTimeout);
  tile.classList.remove('sing');
  tile._timers = [];
  SOUNDS[a.id].syl.forEach((s) => {
    tile._timers.push(setTimeout(() => tile.classList.add('sing'), s[0] * 1000 + 20));
    tile._timers.push(setTimeout(() => tile.classList.remove('sing'), (s[0] + s[1]) * 1000 + 20));
  });
  const c = centerOf(tile);
  fx.sparkles(c.x, c.y - tile.offsetHeight * 0.1, 6, tile.offsetWidth * 0.35);
  return soundLength(a.id);
}

/** Choose columns/rows so n tiles are as big as possible in the box. */
function fitGrid(box, n, maxSize) {
  const w = box.clientWidth;
  const h = box.clientHeight;
  const gap = Math.min(W, H) > 600 ? 18 : 10;
  const tall = 1.14; // tile height / width (room for the name)
  let best = null;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const s = Math.min((w - gap * (cols - 1)) / cols, (h - gap * (rows - 1)) / rows / tall);
    if (!best || s > best.s + 0.5) best = { cols, rows, s };
  }
  const s = Math.max(60, Math.floor(Math.min(best.s, maxSize || 1e9)));
  box.style.gridTemplateColumns = `repeat(${best.cols}, ${s}px)`;
  box.style.gridTemplateRows = `repeat(${best.rows}, ${Math.floor(s * tall)}px)`;
  box.style.gridGap = `${gap}px`;
  box.style.setProperty('--tile', `${s}px`);
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const PARADE = ['cow', 'pig', 'duck', 'lion', 'frog'];
$('#parade').innerHTML = PARADE.map((id, i) =>
  `<button class="p-head" data-action="parade" data-quiet data-id="${id}" aria-label="${byId[id].name}"
    style="--bg1:${byId[id].bg[0]};--bg2:${byId[id].bg[1]};--ink:${byId[id].ink};animation-delay:${-i * 0.35}s"><span class="a-card"><span class="a-bob">${art(byId[id])}</span></span><span class="bubble"><span>${byId[id].word}</span></span></button>`).join('');

function updateTitle() {
  $('#title-stars').textContent = store.data.stars ? `⭐ ${store.data.stars}` : '';
}

function toTitle() {
  leaveModes();
  updateTitle();
  showScreen('screen-title');
}

function leaveModes() {
  mode = null;
  Q.token++;
  Q.talk++;
  clearTimeout(speakTimer);
  $$('.mode-area').forEach((m) => m.classList.remove('active'));
}

// ---------------------------------------------------------------------------
// Tap & Hear
// ---------------------------------------------------------------------------
let speakTimer = 0;
let lastTap = 0;
const taps = {};

function startPlay() {
  leaveModes();
  mode = 'play';
  showScreen(null);
  $('#barn').innerHTML = ANIMALS.map((a, i) => tileHTML(a, i)).join('');
  $('#play').classList.add('active');
  layout();
  lastTap = performance.now();
  say('Tap an animal!');
}

function tapPlay(tile, a) {
  lastTap = performance.now();
  const len = perform(tile, a, 'hop');
  taps[a.id] = (taps[a.id] || 0) + 1;
  clearTimeout(speakTimer);
  speakTimer = setTimeout(() => {
    say(taps[a.id] % 2 ? `The ${lower(a.name)} says ${a.says}!` : `${a.name}!`);
  }, len * 1000 + 120);
}

// a random animal hops now and then while nobody is tapping
setInterval(() => {
  if (mode !== 'play' || performance.now() - lastTap < 3500 || document.hidden) return;
  const tiles = $$('#barn .animal');
  if (tiles.length) replayClass(pickOne(tiles).querySelector('.a-card'), 'idle');
}, 2200);

// ---------------------------------------------------------------------------
// Who says...?
// ---------------------------------------------------------------------------
const Q = { target: null, last: null, wrong: 0, locked: false, run: 0, token: 0, talk: 0 };

function startQuiz() {
  leaveModes();
  mode = 'quiz';
  Q.run = 0;
  showScreen(null);
  $('#quiz').classList.add('active');
  updateStars(false);
  newRound();
}

function updateStars(bump) {
  $('#star-pill').textContent = `⭐ ${store.data.stars}`;
  if (bump) replayClass($('#star-pill'), 'bump');
}

function newRound() {
  const token = ++Q.token;
  Q.talk++;
  const count = Q.run < 3 ? 2 : Q.run < 7 ? 3 : 4;
  Q.target = pickOne(ANIMALS.filter((a) => a !== Q.last));
  Q.last = Q.target;
  const others = shuffle(ANIMALS.filter((a) => a !== Q.target)).slice(0, count - 1);
  const list = shuffle(others.concat([Q.target]));
  Q.wrong = 0;
  Q.locked = false;
  $('#choices').innerHTML = list.map((a, i) => tileHTML(a, i, 'choice')).join('');
  const word = Q.target.word.replace(/!$/, '');
  $('#q-text').innerHTML = `Who says <b style="color:${Q.target.ink}">${word}</b>?`;
  layout();
  replayClass($('#question'), 'bounce');
  ask(token);
}

async function ask(token) {
  const talk = ++Q.talk;
  await wait(250);
  if (talk !== Q.talk) return;
  await say(`Who says ${Q.target.says}?`);
  if (talk !== Q.talk || token !== Q.token) return;
  await wait(120);
  if (talk !== Q.talk) return;
  hearTarget();
}

function hearTarget() {
  if (!Q.target || mode !== 'quiz') return;
  playSound(Q.target.id);
  const btn = $('#quiz .replay');
  btn.classList.add('playing');
  clearTimeout(btn._t);
  btn._t = setTimeout(() => btn.classList.remove('playing'), soundLength(Q.target.id) * 1000 + 100);
}

function tapQuiz(tile, a) {
  if (Q.locked) return;
  Q.talk++;
  if (a === Q.target) {
    Q.locked = true;
    Q.run++;
    store.data.stars++;
    store.persist();
    const token = Q.token;
    const len = perform(tile, a, 'hop');
    tile.classList.add('right');
    $$('#choices .animal').forEach((t) => { if (t !== tile) t.classList.add('fade'); });
    const c = centerOf(tile);
    fx.sparkles(c.x, c.y, 14, 80);
    sfx.sparkle();
    setTimeout(() => {
      if (token !== Q.token) return;
      updateStars(true);
      const p = centerOf($('#star-pill'));
      fx.burst(p.x, p.y, '#ffe34d');
      fx.confetti(45);
      sfx.chime([0, 4, 7, 12, 16], 523, 0.08);
      say(`${pickOne(RIGHT)} The ${lower(a.name)} says ${a.says}!`);
      if (store.data.stars % 5 === 0) {
        setTimeout(() => {
          if (token !== Q.token) return;
          fx.confetti(90);
          sfx.win();
          banner('Animal expert!', `⭐ ${store.data.stars}`);
        }, 600);
      }
    }, len * 1000 + 80);
    setTimeout(() => { if (token === Q.token && mode === 'quiz') newRound(); }, len * 1000 + 2900);
  } else {
    Q.wrong++;
    const len = perform(tile, a, 'wiggle');
    const talk = Q.talk;
    if (Q.wrong >= 2) {
      const right = $(`#choices .animal[data-id="${Q.target.id}"]`);
      if (right) right.classList.add('hint');
    }
    (async () => {
      await wait(len * 1000 + 100);
      if (talk !== Q.talk) return;
      await say(`That's the ${lower(a.name)}! ${cap(a.says)}! Who says ${Q.target.says}?`);
      if (talk !== Q.talk) return;
      await wait(100);
      if (talk === Q.talk) hearTarget();
    })();
  }
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
function layout() {
  if (mode === 'play') fitGrid($('#barn'), ANIMALS.length, 260);
  if (mode === 'quiz') fitGrid($('#choices'), $$('#choices .animal').length, 300);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
updateTitle();

boot({
  party: ['#7fd8ff', '#9fe7b0', '#ffd36b'],
  onAction(action, el) {
    switch (action) {
      case 'play': startPlay(); break;
      case 'quiz': startQuiz(); break;
      case 'back': toTitle(); break;
      case 'animal': {
        const a = byId[el.dataset.id];
        if (mode === 'play') tapPlay(el, a);
        else if (mode === 'quiz') tapQuiz(el, a);
        break;
      }
      case 'parade': {
        const a = byId[el.dataset.id];
        perform(el, a, 'hop');
        break;
      }
      case 'replay':
        Q.talk++;
        replayClass(el, 'bounce');
        hearTarget();
        break;
    }
  },
  onBack(screen) {
    if (screen === null && mode) { toTitle(); return true; }
    return false;
  },
  onResize() { requestAnimationFrame(layout); },
});

// For automated tests
window.__animals = { Q, store, startPlay, startQuiz, get mode() { return mode; } };
