// Dot to Dot: connect numbered dots (or letters) in order and a picture appears.
// The dots sit on the outline of one of the coloring pictures; outline.js finds
// that outline and picks the dots.
import * as sfx from '../../shared/js/audio.js';
import { say, numberWord } from '../../shared/js/speech.js';
import {
  boot, $, $$, fx, showScreen, celebrate, onPointer, createStore, replayClass, pickOne, wait,
} from '../../shared/js/kit.js';
import { PICTURES, INK, star as starPath } from '../../shared/js/pictures.js';
import { pictureMarkup, svgOpen } from '../../shared/js/art.js';
import { earnSticker } from '../../shared/js/rewards.js';
import { CURATED } from './curated.js';
import { outlineOf, pickDots, placeLabels, dist } from './outline.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const VB = { x: -16, y: -16, w: 432 }; // the sheet's viewBox (a 400 x 400 picture plus a margin)
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const MODES = {
  easy: { n: 10, label: '1–10', say: 'One to ten!' },
  medium: { n: 15, label: '1–15', say: 'One to fifteen!' },
  hard: { n: 25, label: '1–25', say: 'One to twenty-five!' },
  abc: { n: 26, label: 'A–Z', say: 'A B C!', letters: true },
};
const LEVELS = ['easy', 'medium', 'hard'];
const TILE_COLORS = ['pink', 'blue', 'green', 'orange', 'purple', 'teal', 'red', 'yellow'];
const CHEERS = ['Wow!', 'Amazing!', 'You did it!', 'Super!', 'Awesome!', 'Great job!', 'Fantastic!', 'Hooray!'];
const LINE_COLORS = ['#ff3d9a', '#7b4dff', '#2f8cff', '#14b8a6', '#ff8a1f'];

const store = createStore('dots', { done: {}, hint: true, mode: 'easy' });

const BY_ID = {};
PICTURES.forEach((p) => { BY_ID[p.id] = p; });
const LIST = CURATED.filter((c) => BY_ID[c.id]).map((c) => ({ pic: BY_ID[c.id], cfg: c }));

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const G = {
  mode: MODES[store.data.mode] ? store.data.mode : 'easy',
  i: 0,
  pic: null,
  dots: [], // { x, y, label, el, wig }
  path: [], // indices of connected dots, in order
  next: 0,
  on: false,
  finished: false,
  ptr: null,
  finger: null,
  anim: null, // the newest line growing: { a, b, t }
  glow: 0,
  idle: 0,
  hinted: 0,
  token: 0,
  rect: null,
  color: LINE_COLORS[0],
};

const sheet = $('#sheet');
const paper = $('#paper');
const dotsLayer = $('#dots');
const linesLayer = $('#lines');
const rubber = $('#rubber');
const pulse = $('#pulse');
const glow = $('#glow');

function el(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

const doneOf = (id) => store.data.done[id] || {};
const labelOf = (i) => (MODES[G.mode].letters ? LETTERS[i] : String(i + 1));
const wordOf = (i) => (MODES[G.mode].letters ? LETTERS[i] : numberWord(i + 1));

// ---------------------------------------------------------------------------
// Title mascot: a happy star being drawn dot by dot
// ---------------------------------------------------------------------------
(function mascot() {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 34 : 78;
    const a = (-90 + i * 36) * Math.PI / 180;
    pts.push([130 + Math.cos(a) * r, 88 + Math.sin(a) * r]);
  }
  const done = pts.slice(0, 5).map((p) => p.join(' ')).join(' L');
  let dots = '';
  pts.forEach((p, i) => {
    const on = i < 5;
    dots += `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="${on ? '#ffd23f' : INK}" stroke="#fff" stroke-width="3"/>`;
  });
  $('#mascot').innerHTML = `<svg viewBox="0 0 260 176" aria-hidden="true">
    <path d="${starPath(130, 88, 78, 34)}" fill="#ffd93b" opacity=".8"/>
    <path d="M${pts.slice(4).concat([pts[0]]).map((p) => p.join(' ')).join(' L')}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="2 9" stroke-linecap="round"/>
    <path d="M${done}" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${done}" fill="none" stroke="#ff3d9a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
    <circle cx="116" cy="92" r="5.5" fill="${INK}"/><circle cx="144" cy="92" r="5.5" fill="${INK}"/>
    <circle cx="114.5" cy="90" r="1.8" fill="#fff"/><circle cx="142.5" cy="90" r="1.8" fill="#fff"/>
    <path d="M121 104Q130 112 139 104" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="106" cy="104" r="5" fill="#ff7ac6" opacity=".7"/><circle cx="154" cy="104" r="5" fill="#ff7ac6" opacity=".7"/>
    <g transform="translate(${pts[4][0] + 8.4} ${pts[4][1] - 9.5}) rotate(60)" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round">
      <rect x="-6" y="-58" width="20" height="14" rx="5" fill="#ff7ac6"/>
      <rect x="-6" y="-46" width="20" height="8" fill="#b3b9c6"/>
      <rect x="-6" y="-38" width="20" height="30" fill="#2f8cff"/>
      <path d="M-6 -8L4 12L14 -8Z" fill="#ffd2a6"/>
      <path d="M0 4L4 12L8 4Z" fill="${INK}"/>
    </g>
  </svg>`;
}());

// ---------------------------------------------------------------------------
// Title and picker
// ---------------------------------------------------------------------------
function starsOf(id) {
  const d = doneOf(id);
  return LEVELS.filter((l) => d[l]).length;
}
function totalStars() {
  let n = 0;
  LIST.forEach((it) => { n += starsOf(it.pic.id); });
  return n;
}
function updateTitle() {
  const n = totalStars();
  $('#title-stars').textContent = n ? `⭐ ${n}` : '';
}

function openMode(mode) {
  G.mode = MODES[mode] ? mode : 'easy';
  store.data.mode = G.mode;
  store.persist();
  buildPicker();
  showScreen('screen-picker');
  $('#picker-scroll').scrollTop = 0;
  say(MODES[G.mode].say);
}

function thumb(pic) {
  return `${svgOpen('thumb')}${pictureMarkup(pic, { fill: (i) => pic.shapes[i].c })}</svg>`;
}

function buildPicker() {
  $('#picker-title').textContent = MODES[G.mode].label;
  $('#pic-grid').innerHTML = LIST.map((it, i) => {
    const d = doneOf(it.pic.id);
    let stars = '';
    LEVELS.forEach((l) => { stars += `<i class="${d[l] ? 'on' : ''}">★</i>`; });
    if (d.abc) stars += '<b class="abc-on">A</b>';
    return `<button class="tile ptile ${TILE_COLORS[i % TILE_COLORS.length]}${d[G.mode] ? ' done' : ''}" data-action="open" data-i="${i}" aria-label="${it.pic.name}" style="animation-delay:${Math.min(i, 16) * 0.025}s">
      <span class="pthumb">${thumb(it.pic)}</span><span class="pstars">${stars}</span>${d[G.mode] ? '<span class="pcheck">✓</span>' : ''}</button>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// Building a picture
// ---------------------------------------------------------------------------
function openPic(i) {
  G.token++;
  G.i = ((i % LIST.length) + LIST.length) % LIST.length;
  const it = LIST[G.i];
  G.pic = it.pic;
  const n = MODES[G.mode].n;
  const pts = pickDots(outlineOf(it.pic, it.cfg), n);
  const labels = placeLabels(pts);
  G.dots = pts.map((p, k) => ({ x: p.x, y: p.y, lx: labels[k].x - p.x, ly: labels[k].y - p.y, el: null, wig: 0 }));
  G.path = [];
  G.next = 0;
  G.finished = false;
  G.ptr = null;
  G.finger = null;
  G.anim = null;
  G.glow = 0;
  G.idle = 0;
  G.hinted = 0;
  G.color = LINE_COLORS[G.i % LINE_COLORS.length];

  $('#ghost').innerHTML = pictureMarkup(it.pic, { plain: true });
  $('#final').innerHTML = pictureMarkup(it.pic, { fill: (k) => it.pic.shapes[k].c });
  $('#final').classList.remove('show');
  paper.classList.remove('finished');
  applyHint();
  linesLayer.innerHTML = '';
  G.under = el('polyline', { class: 'line-under', points: '' }, linesLayer);
  G.top = el('polyline', { class: 'line-top', points: '', stroke: G.color }, linesLayer);
  rubber.setAttribute('stroke', G.color);
  rubber.style.display = 'none';

  dotsLayer.innerHTML = '';
  const big = n > 15;
  dotsLayer.setAttribute('class', big ? 'many' : '');
  G.dots.forEach((d, k) => {
    const g = el('g', { class: 'dot', transform: `translate(${d.x} ${d.y})` }, dotsLayer);
    el('circle', { class: 'dc', r: big ? 8 : 9.5 }, g);
    const t = labelOf(k);
    el('text', { class: 'lb-bg', x: d.lx, y: d.ly }, g).textContent = t;
    el('text', { class: 'lb', x: d.lx, y: d.ly }, g).textContent = t;
    d.el = g;
  });
  updateNext();

  showScreen(null);
  G.on = true;
  $('#play').classList.add('active');
  replayClass(paper, 'pop');
  requestAnimationFrame(() => layout());
  const tk = G.token;
  setTimeout(() => { if (tk === G.token && !G.path.length) say(`Start at ${wordOf(0)}!`); }, 450);
}

function applyHint() {
  $('#ghost').style.opacity = store.data.hint ? '' : '0';
  $('#eye-btn').classList.toggle('off', !store.data.hint);
}

function updateNext() {
  const n = G.dots.length;
  const k = Math.min(G.next, n - 1);
  $('#nb-num').textContent = G.finished ? '★' : labelOf(k);
  $('#nb-num').classList.toggle('long', !G.finished && labelOf(k).length > 1);
  $('#progress-fill').style.width = `${Math.round((G.path.length / n) * 100)}%`;
  G.dots.forEach((d, i) => {
    let cls = 'dot';
    if (i < G.next) cls += ' on';
    else if (i === G.next && !G.finished) cls += ' nx';
    d.el.setAttribute('class', cls);
  });
  if (!G.finished && G.dots[G.next]) {
    pulse.setAttribute('cx', G.dots[G.next].x);
    pulse.setAttribute('cy', G.dots[G.next].y);
    glow.setAttribute('cx', G.dots[G.next].x);
    glow.setAttribute('cy', G.dots[G.next].y);
    pulse.style.display = '';
  } else {
    pulse.style.display = 'none';
  }
}

// ---------------------------------------------------------------------------
// Playing
// ---------------------------------------------------------------------------
function toSheet(p) {
  const r = G.rect;
  return { x: VB.x + ((p.x - r.left) / r.width) * VB.w, y: VB.y + ((p.y - r.top) / r.height) * VB.w };
}
function toScreen(d) {
  const r = G.rect || sheet.getBoundingClientRect();
  return { x: r.left + ((d.x - VB.x) / VB.w) * r.width, y: r.top + ((d.y - VB.y) / VB.w) * r.height };
}
function hitRadius() {
  // at least ~32 px on screen, in sheet units
  const px = Math.max(32, G.rect.width * 0.075);
  return (px / G.rect.width) * VB.w;
}

function handle(p, isDown) {
  if (G.finished) return;
  const s = toSheet(p);
  const R = hitRadius();
  const nd = G.dots[G.next];
  if (dist(s, nd) < R) { connect(); return; }
  if (!isDown) return;
  // a tap on another dot that is not the next one
  let wrong = -1;
  let best = R * 0.8;
  G.dots.forEach((d, i) => {
    if (i <= G.next) return;
    const dd = dist(s, d);
    if (dd < best) { best = dd; wrong = i; }
  });
  if (wrong >= 0) {
    sfx.boing();
    G.dots[wrong].wig = 0.45;
    G.glow = 1.4;
    say(wordOf(G.next));
  }
}

function connect() {
  const k = G.next;
  const d = G.dots[k];
  G.path.push(k);
  G.next++;
  G.idle = 0;
  if (k > 0) G.anim = { a: G.dots[k - 1], b: d, t: 0 };
  const c = toScreen(d);
  const n = G.dots.length;
  sfx.pop(0.8 + (k / n) * 0.9);
  fx.ring(c.x, c.y, G.color);
  fx.sparkles(c.x, c.y, 4, 22);
  say(wordOf(k));
  if (G.next >= n) finish();
  else updateNext();
}

function linePoints(extra) {
  let s = '';
  const upto = G.anim ? G.path.length - 1 : G.path.length;
  for (let i = 0; i < upto; i++) {
    const d = G.dots[G.path[i]];
    s += `${d.x.toFixed(1)},${d.y.toFixed(1)} `;
  }
  if (extra) s += `${extra.x.toFixed(1)},${extra.y.toFixed(1)}`;
  return s;
}
function drawLines() {
  let extra = null;
  if (G.anim) {
    const t = Math.min(1, G.anim.t);
    extra = { x: G.anim.a.x + (G.anim.b.x - G.anim.a.x) * t, y: G.anim.a.y + (G.anim.b.y - G.anim.a.y) * t };
  }
  const pts = linePoints(extra);
  G.under.setAttribute('points', pts);
  G.top.setAttribute('points', pts);
}

async function finish() {
  const tk = G.token;
  G.finished = true;
  G.finger = null;
  rubber.style.display = 'none';
  updateNext();
  const it = LIST[G.i];
  const done = store.data.done[it.pic.id] || {};
  const fresh = !done[G.mode];
  done[G.mode] = 1;
  store.data.done[it.pic.id] = done;
  store.persist();

  await wait(260);
  if (tk !== G.token) return;
  // close the shape
  G.path.push(0);
  G.anim = { a: G.dots[G.dots.length - 1], b: G.dots[0], t: 0 };
  sfx.whoosh();
  await wait(420);
  if (tk !== G.token) return;
  // the picture appears
  paper.classList.add('finished');
  $('#final').classList.add('show');
  sfx.sparkle();
  const step = Math.max(1, Math.floor(G.dots.length / 12));
  for (let i = 0; i < G.dots.length; i += step) {
    const c = toScreen(G.dots[i]);
    fx.sparkle(c.x, c.y, 26);
  }
  say(`${it.pic.name}!`);
  await wait(1000);
  if (tk !== G.token) return;
  const cheer = pickOne(CHEERS);
  celebrate(cheer, it.pic.name);
  say(`${cheer} It's ${/^[aeiou]/i.test(it.pic.name) ? 'an' : 'a'} ${it.pic.name}!`, { queue: true });
  earnSticker('dots');
  updateTitle();
  await wait(2000);
  if (tk !== G.token) return;
  showDone(fresh);
}

function showDone(fresh) {
  const it = LIST[G.i];
  $('#done-title').textContent = `${it.pic.name}!`;
  $('#done-thumb').innerHTML = thumb(it.pic);
  const d = doneOf(it.pic.id);
  $$('#done-stars .rstar').forEach((s, i) => {
    s.classList.remove('on');
    s.style.animationDelay = `${0.15 + i * 0.18}s`;
    if (d[LEVELS[i]]) setTimeout(() => s.classList.add('on'), 30);
  });
  showScreen('screen-done');
  if (fresh && G.mode !== 'abc') setTimeout(() => sfx.chime([0, 4, 7], 784, 0.12), 300);
}

// ---------------------------------------------------------------------------
// Pointer
// ---------------------------------------------------------------------------
onPointer(paper, {
  down(p) {
    if (!G.on || G.finished || G.ptr !== null) return false;
    G.ptr = p.id;
    G.rect = sheet.getBoundingClientRect();
    G.idle = 0;
    G.finger = toSheet(p);
    handle(p, true);
    return true;
  },
  move(p) {
    if (p.id !== G.ptr) return;
    G.finger = toSheet(p);
    handle(p, false);
  },
  up(p) {
    if (p.id !== G.ptr) return;
    G.ptr = null;
    G.finger = null;
    rubber.style.display = 'none';
  },
});

// ---------------------------------------------------------------------------
// Every frame (only while the play screen is up)
// ---------------------------------------------------------------------------
let clock = 0;
function frame(dt) {
  if (!G.on) return;
  clock += dt;
  if (G.anim) {
    G.anim.t += dt / 0.16;
    drawLines();
    if (G.anim.t >= 1) { G.anim = null; drawLines(); }
  }
  // rubber band from the last dot to the finger
  if (G.finger && G.path.length && !G.finished) {
    const a = G.dots[G.path[G.path.length - 1]];
    rubber.setAttribute('x1', a.x);
    rubber.setAttribute('y1', a.y);
    rubber.setAttribute('x2', G.finger.x);
    rubber.setAttribute('y2', G.finger.y);
    rubber.style.display = '';
  }
  // the next dot gently pulses
  if (!G.finished) {
    const k = (Math.sin(clock * 5) + 1) / 2;
    pulse.setAttribute('r', (13 + k * 7).toFixed(1));
    pulse.style.opacity = (0.9 - k * 0.5).toFixed(2);
  }
  // help: the right dot glows
  if (G.glow > 0) {
    G.glow -= dt;
    const k = Math.max(0, G.glow);
    glow.style.display = '';
    glow.setAttribute('r', (18 + (1.4 - k) * 26).toFixed(1));
    glow.style.opacity = Math.min(1, k).toFixed(2);
  } else glow.style.display = 'none';
  // wrong dots wiggle
  for (const d of G.dots) {
    if (d.wig <= 0) continue;
    d.wig = Math.max(0, d.wig - dt);
    const off = Math.sin(d.wig * 45) * 5 * (d.wig / 0.45);
    d.el.setAttribute('transform', `translate(${(d.x + off).toFixed(1)} ${d.y})`);
  }
  // a little help after a quiet while
  if (!G.finished && G.ptr === null) {
    G.idle += dt;
    if (G.idle > (G.hinted ? 12 : 7)) {
      G.idle = 0;
      G.hinted++;
      G.glow = 1.4;
      sfx.chime([0, 7], 660, 0.1);
      say(G.next === 0 ? `Start at ${wordOf(0)}!` : `Find ${wordOf(G.next)}!`);
    }
  }
}

// ---------------------------------------------------------------------------
// Leaving, layout
// ---------------------------------------------------------------------------
function leavePlay() {
  G.token++;
  G.on = false;
  G.ptr = null;
  G.finger = null;
  $('#play').classList.remove('active');
  fx.clear();
}
function toPicker() {
  leavePlay();
  buildPicker();
  showScreen('screen-picker');
}
function toTitle() {
  leavePlay();
  updateTitle();
  showScreen('screen-title');
}

function layout() {
  if (!G.on) return;
  const st = $('#stage');
  const size = Math.floor(Math.max(160, Math.min(st.clientWidth, st.clientHeight, 820)));
  paper.style.width = `${size}px`;
  paper.style.height = `${size}px`;
  G.rect = sheet.getBoundingClientRect();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
updateTitle();

boot({
  party: ['#7b5cff', '#ff7ac6', '#6fc8ff'],
  onAction(action, elx) {
    switch (action) {
      case 'mode': openMode(elx.dataset.mode); break;
      case 'title': toTitle(); break;
      case 'open': openPic(+elx.dataset.i); break;
      case 'picker': toPicker(); break;
      case 'again': sfx.whoosh(); openPic(G.i); break;
      case 'next': sfx.whoosh(); openPic(G.i + 1); break;
      case 'hint':
        store.data.hint = !store.data.hint;
        store.persist();
        applyHint();
        replayClass($('#eye-btn'), 'bounce');
        break;
      case 'where':
        if (!G.on || G.finished) break;
        replayClass($('#next-badge'), 'bounce');
        sfx.pick(G.next % 10);
        G.glow = 1.4;
        G.idle = 0;
        say(wordOf(G.next));
        break;
    }
  },
  onBack(screen) {
    if (screen === 'screen-done' || (screen === null && G.on)) { toPicker(); return true; }
    if (screen === 'screen-picker') { toTitle(); return true; }
    return false;
  },
  onFrame(dt) { frame(dt); },
  onResize() {
    if (G.on) requestAnimationFrame(layout);
  },
});

// For automated tests
window.__dots = {
  G,
  store,
  LIST,
  MODES,
  open(mode, id) {
    G.mode = mode;
    let i = 0;
    LIST.forEach((it, k) => { if (it.pic.id === id) i = k; });
    openPic(i);
  },
  dotScreen(i) { G.rect = sheet.getBoundingClientRect(); return toScreen(G.dots[i]); },
};
