// Shape & Color Sorter: drag toy blocks into their holes, or fruit and veg into
// the basket of their color. Every shape and color is said out loud.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import {
  boot, $, fx, showScreen, celebrate, onPointer, createStore, replayClass, shuffle, pickOne,
  rand, vibrate, unit,
} from '../../shared/js/kit.js';
import { earnSticker } from '../../shared/js/rewards.js';
import {
  SHAPES, SHAPE, BLOCK_COLORS, COLORS, blockSvg, holeSvg, miniShapeSvg, basketBackSvg, basketFrontSvg, blobSvg,
} from './art.js';
import { FOODS, foodSvg } from '../../shared/js/food.js';

const store = createStore('sorter', { round: { shapes: 0, colors: 0 }, sorted: 0 });
if (!store.data.round || typeof store.data.round !== 'object') store.data.round = { shapes: 0, colors: 0 };

// holes / baskets per round: grows gently, then stays at 6
const COUNTS = [2, 3, 3, 4, 4, 5, 5, 6];
const PRAISE = ['Great job!', 'You did it!', 'Well done!', 'Super!', 'Awesome!', 'Nice one!', 'Perfect!', 'Hooray!', 'Yay!'];
const CHEERS = ['Hooray!', 'Amazing!', 'Fantastic!', 'You did it!', 'Super sorting!', 'Wonderful!', 'Brilliant!'];

let mode = null;          // 'shapes' | 'colors'
let round = 0;
let targets = [];         // holes or baskets
let pieces = [];          // blocks or fruit
let drag = null;
let busy = true;          // between rounds
let token = 0;            // bumps when a round ends or we leave, cancelling old timers
let lastAction = 0;
let zTop = 10;
let introSaid = {};
let hintTimer = 0;
let safe = { t: 0, r: 0, b: 0, l: 0 };
let geo = null;           // current layout numbers

const now = () => (window.performance ? performance.now() : Date.now());
function later(fn, ms) {
  const t = token;
  setTimeout(() => { if (t === token) fn(); }, ms);
}

// ---------------------------------------------------------------------------
// Sounds made from the kit's synth
// ---------------------------------------------------------------------------
function clunk() {
  if (!sfx.ready()) return;
  sfx.tone({ f0: 200, f1: 70, dur: 0.2, vol: 0.45 });
  sfx.noise({ dur: 0.07, vol: 0.35, freq: 650 });
  sfx.tone({ type: 'triangle', f0: 520, f1: 380, dur: 0.09, vol: 0.12, delay: 0.03 });
}
function plop() {
  if (!sfx.ready()) return;
  sfx.tone({ f0: 320, f1: 120, dur: 0.16, vol: 0.35 });
  sfx.noise({ dur: 0.1, vol: 0.18, freq: 900 });
  sfx.tone({ type: 'triangle', f0: 700, f1: 1150, dur: 0.1, vol: 0.08, delay: 0.06 });
}
function floatBack() {
  if (!sfx.ready()) return;
  sfx.tone({ f0: 700, f1: 420, dur: 0.22, vol: 0.08 });
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------
function pieceName(pc) {
  return mode === 'shapes' ? SHAPE[pc.key].name : pc.color.name;
}
function sortedPhrase(pc) {
  if (mode === 'shapes') return `${SHAPE[pc.key].name}! ${pickOne(PRAISE)}`;
  const f = FOODS[pc.key];
  const cn = pc.color.name;
  if (pc.key === 'orange') return 'Orange! An orange!';
  if (f.plural) return `${cn}! ${cn} ${f.name}!`;
  return `${cn}! ${/^[aeiou]/i.test(cn) ? 'An' : 'A'} ${cn.toLowerCase()} ${f.name}!`;
}
function findPhrase(pc) {
  if (mode === 'shapes') return `Find the ${SHAPE[pc.key].name.toLowerCase()} hole!`;
  return `Find the ${pc.color.name.toLowerCase()} basket!`;
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
function readSafe() {
  const cs = getComputedStyle($('#probe'));
  safe = {
    t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0,
    b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0,
  };
}

function fitGrid(n, w, h, aspect) {
  let best = null;
  for (let c = 1; c <= n; c++) {
    const r = Math.ceil(n / c);
    const cw = w / c;
    const ch = h / r;
    const s = Math.min(cw, ch / aspect);
    if (!best || s > best.s + 0.5) best = { c, r, cw, ch, s };
  }
  return best;
}
function gridCenters(n, box, g) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / g.c);
    const inRow = Math.min(g.c, n - row * g.c);
    const col = i % g.c;
    const offx = (box.w - inRow * g.cw) / 2;
    const offy = (box.h - g.r * g.ch) / 2;
    out.push({ x: box.x + offx + (col + 0.5) * g.cw, y: box.y + offy + (row + 0.5) * g.ch });
  }
  return out;
}

function regions() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const gap = Math.max(10, Math.min(W, H) * 0.03);
  const x0 = safe.l + gap;
  const x1 = W - safe.r - gap;
  const y0 = safe.t + 10 + 52 + gap;
  const y1 = H - safe.b - gap;
  const aw = x1 - x0;
  const ah = y1 - y0;
  if (aw > ah * 1.15) {
    const bw = Math.round(aw * 0.6);
    return { land: true, board: { x: x0, y: y0, w: bw, h: ah - 10 }, tray: { x: x0 + bw + gap, y: y0, w: aw - bw - gap, h: ah - 10 } };
  }
  const bh = Math.round(ah * 0.57);
  return { land: false, board: { x: x0, y: y0, w: aw, h: bh }, tray: { x: x0, y: y0 + bh + gap + 10, w: aw, h: ah - bh - gap - 10 } };
}

function setBox(el, b) {
  el.style.left = `${b.x}px`;
  el.style.top = `${b.y}px`;
  el.style.width = `${b.w}px`;
  el.style.height = `${b.h}px`;
}

function layout() {
  if (!mode) return;
  readSafe();
  const R = regions();
  setBox($('#board'), R.board);
  setBox($('#tray'), R.tray);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const pad = 18;
  const inner = { x: R.board.x + pad, y: R.board.y + pad, w: R.board.w - pad * 2, h: R.board.h - pad * 2 };
  const n = targets.length;
  let size;
  let tw;
  let th;
  if (mode === 'shapes') {
    const g = fitGrid(n, inner.w, inner.h, 1);
    size = Math.min(g.s * 0.84, Math.min(W, H) * 0.42);
    tw = size; th = size;
    gridCenters(n, inner, g).forEach((c, i) => { targets[i].cx = c.x; targets[i].cy = c.y; });
  } else {
    const aspect = 1.12;
    const g = fitGrid(n, inner.w, inner.h, aspect);
    size = Math.min(g.s * 0.9, Math.min(W, H) * 0.4);
    tw = size; th = size * aspect;
    gridCenters(n, inner, g).forEach((c, i) => { targets[i].cx = c.x; targets[i].cy = c.y; });
  }
  targets.forEach((t) => {
    t.w = tw; t.h = th;
    setBox(t.el, { x: t.cx - tw / 2, y: t.cy - th / 2, w: tw, h: th });
    if (mode === 'colors') layoutBasket(t);
  });

  // pieces: full size D on the board, scaled down to fit the tray
  const D = mode === 'shapes' ? size * 0.9 : size * 0.52;
  const m = pieces.length;
  const tin = { x: R.tray.x + 8, y: R.tray.y + 8, w: R.tray.w - 16, h: R.tray.h - 16 };
  const g = fitGrid(m, tin.w, tin.h, 1);
  const trayScale = Math.min(mode === 'colors' ? 1.7 : 1, (g.s * 0.84) / D);
  gridCenters(m, tin, g).forEach((c, i) => {
    const pc = pieces[i];
    pc.homeX = c.x + rand(-0.04, 0.04) * g.cw;
    pc.homeY = c.y + rand(-0.04, 0.04) * g.ch;
  });
  geo = { size, D, trayScale, tw, th };
  pieces.forEach((pc) => {
    pc.size = D;
    pc.el.style.width = `${D}px`;
    pc.el.style.height = `${D}px`;
    if (pc.done) {
      if (mode === 'shapes' && pc.target) { pc.x = pc.target.cx; pc.y = pc.target.cy; pc.scale = 1; pc.rot = 0; }
    } else if (!(drag && drag.pc === pc)) {
      pc.x = pc.homeX; pc.y = pc.homeY; pc.scale = trayScale; pc.rot = pc.homeRot;
    }
    pc.el.style.transition = 'none';
    place(pc);
  });
}

function layoutBasket(t) {
  const k = t.w / 132; // basket art is 132 units wide (viewBox -6..126)
  const artH = 122 * k;
  t.el.querySelector('.b-back').style.height = `${artH}px`;
  t.el.querySelector('.b-front').style.height = `${artH}px`;
  const tag = t.el.querySelector('.tag');
  tag.style.top = `${artH + 2}px`;
  tag.style.fontSize = `${Math.max(14, t.w * 0.16)}px`;
  t.mouthX = (60 + 6) * k;
  t.mouthY = (52 + 6) * k;
  t.fs = t.w * 0.4;
  const items = t.el.querySelectorAll('.inside');
  for (let i = 0; i < items.length; i++) placeInside(t, items[i], i);
}

const INSIDE = [[0, 0], [-0.26, 0.04], [0.26, 0.04], [-0.13, -0.16], [0.13, -0.16], [0, -0.3]];
function placeInside(t, el, i) {
  const o = INSIDE[i % INSIDE.length];
  const s = t.fs;
  el.style.width = `${s}px`;
  el.style.height = `${s}px`;
  el.style.left = `${t.mouthX + o[0] * t.w - s / 2}px`;
  el.style.top = `${t.mouthY - s * 0.62 + o[1] * s}px`;
}

function place(pc) {
  pc.el.style.transform = `translate3d(${(pc.x - pc.size / 2).toFixed(1)}px,${(pc.y - pc.size / 2).toFixed(1)}px,0) rotate(${pc.rot.toFixed(1)}deg) scale(${pc.scale.toFixed(3)})`;
}
function moveTo(pc, x, y, scale, rot, ms, easing) {
  pc.x = x; pc.y = y; pc.scale = scale; pc.rot = rot;
  pc.el.style.transition = ms ? `transform ${ms}ms ${easing || 'cubic-bezier(.3,1.4,.5,1)'}` : 'none';
  place(pc);
}

// ---------------------------------------------------------------------------
// Rounds
// ---------------------------------------------------------------------------
function updateProgress() {
  const el = $('#progress');
  el.innerHTML = pieces.map((pc) => `<span class="pdot${pc.done ? ' on' : ''}">${
    mode === 'shapes' ? miniShapeSvg(pc.key, pc.done ? pc.color : '#fff') : blobSvg(pc.done ? pc.color.hex : '#fff')}</span>`).join('');
}

function buildRound() {
  token++;
  busy = false;
  drag = null;
  clearHint();
  const n = COUNTS[Math.min(round, COUNTS.length - 1)];
  const tLayer = $('#targets');
  const pLayer = $('#pieces');
  tLayer.innerHTML = '';
  pLayer.innerHTML = '';
  targets = [];
  pieces = [];
  let keys;
  if (mode === 'shapes') {
    keys = shuffle(SHAPES).slice(0, n).map((s) => s.key);
    const cols = shuffle(BLOCK_COLORS);
    keys.forEach((k, i) => pieces.push({ key: k, match: k, color: cols[i % cols.length] }));
  } else {
    const cols = shuffle(COLORS).slice(0, n);
    keys = cols.map((c) => c.key);
    const m = Math.min(n + 1, 6);
    cols.forEach((c) => pieces.push({ key: pickOne(c.items), match: c.key, color: c }));
    while (pieces.length < m) {
      const c = pickOne(cols);
      const free = c.items.filter((k) => !pieces.some((p) => p.key === k));
      pieces.push({ key: free.length ? pickOne(free) : pickOne(c.items), match: c.key, color: c });
    }
  }
  // the holes/baskets and the tray are each shuffled, and never in the same order
  const order = shuffle(keys);
  pieces = shuffle(pieces);
  if (pieces.length > 1 && pieces.map((p) => p.match).join() === order.join()) pieces.push(pieces.shift());

  order.forEach((k, i) => {
    const el = document.createElement('div');
    const t = { key: k, el, contents: [] };
    if (mode === 'shapes') {
      el.className = 'target hole';
      el.innerHTML = `<div class="glow"></div><div class="tin">${holeSvg(k)}</div>`;
    } else {
      const c = COLORS.filter((x) => x.key === k)[0];
      t.color = c;
      el.className = 'target basket';
      el.innerHTML = `<div class="glow"></div><div class="tin"><div class="b-back">${basketBackSvg(c)}</div>` +
        `<div class="contents"></div><div class="b-front">${basketFrontSvg(c)}</div>` +
        `<div class="tag" style="color:#fff">${c.name}</div></div>`;
      el.querySelector('.tag').style.textShadow = `0 2px 0 ${c.hex}, 0 -2px 0 ${c.hex}, 2px 0 0 ${c.hex}, -2px 0 0 ${c.hex}, 0 4px 0 rgba(45,36,66,.5)`;
    }
    el.style.animationDelay = `${i * 0.08}s`;
    tLayer.appendChild(el);
    targets.push(t);
  });
  pieces.forEach((pc, i) => {
    const el = document.createElement('div');
    el.className = `piece enter${mode === 'colors' ? ' food' : ''}`;
    el.innerHTML = `<div class="pin" style="animation-delay:${0.25 + i * 0.07}s">${
      mode === 'shapes' ? blockSvg(pc.key, pc.color) : foodSvg(pc.key)}</div>`;
    pLayer.appendChild(el);
    pc.el = el;
    pc.pin = el.firstChild;
    pc.done = false;
    pc.misses = 0;
    pc.homeRot = rand(-12, 12);
    pc.rot = pc.homeRot;
    pc.scale = 1;
    pc.x = 0; pc.y = 0;
    el.style.zIndex = String(++zTop);
  });
  $('#board').className = `board ${mode === 'shapes' ? 'wood' : 'meadow'}`;
  layout();
  updateProgress();
  lastAction = now();
  later(() => pieces.forEach((pc) => pc.el.classList.remove('enter')), 1200);
  if (!introSaid[mode]) {
    introSaid[mode] = true;
    say(mode === 'shapes' ? 'Put each shape in its hole!' : 'Put the food in the basket with the same color!');
  }
}

function roundDone() {
  busy = true;
  round++;
  store.data.round[mode] = round;
  store.persist();
  later(() => {
    const cheer = pickOne(CHEERS);
    celebrate(cheer, '');
    say(cheer, { queue: true });
    earnSticker('sorter');
    targets.forEach((t) => replayClass(t.el, 'happy'));
  }, 900);
  later(() => {
    targets.forEach((t, i) => { t.el.style.animationDelay = `${i * 0.05}s`; t.el.classList.add('leave'); });
    pieces.forEach((pc) => pc.el.classList.add('leave'));
    sfx.whoosh();
  }, 3300);
  later(buildRound, 3750);
}

// ---------------------------------------------------------------------------
// Hints
// ---------------------------------------------------------------------------
function clearHint() {
  clearTimeout(hintTimer);
  targets.forEach((t) => t.el.classList.remove('hint'));
}
function hint(pc, speak) {
  clearHint();
  const t = targets.filter((x) => x.key === pc.match)[0];
  if (!t) return;
  t.el.classList.add('hint');
  hintTimer = setTimeout(() => t.el.classList.remove('hint'), 3500);
  if (speak) say(findPhrase(pc));
}

// ---------------------------------------------------------------------------
// Dragging
// ---------------------------------------------------------------------------
function pieceAt(x, y) {
  let best = null;
  let bestD = Infinity;
  pieces.forEach((pc) => {
    if (pc.done) return;
    const r = pc.el.getBoundingClientRect();
    const m = 10;
    if (x < r.left - m || x > r.right + m || y < r.top - m || y > r.bottom + m) return;
    const d = Math.pow(x - (r.left + r.width / 2), 2) + Math.pow(y - (r.top + r.height / 2), 2);
    if (d < bestD) { bestD = d; best = pc; }
  });
  return best;
}

function targetAt(x, y) {
  let best = null;
  let bestD = Infinity;
  targets.forEach((t) => {
    const ex = mode === 'shapes' ? t.w * 0.62 : t.w * 0.6;
    const ey = mode === 'shapes' ? t.h * 0.62 : t.h * 0.6;
    const dx = x - t.cx;
    const dy = y - t.cy;
    if (Math.abs(dx) > ex || Math.abs(dy) > ey) return;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = t; }
  });
  return best;
}

function setHover(t) {
  targets.forEach((x) => x.el.classList.toggle('hover', x === t));
}

function startDrag(pc, p) {
  const r = pc.el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const lift = 14 * unit;
  drag = { pc, id: p.id, dx: cx - p.x, dy: cy - p.y - lift, t0: now(), hinted: false };
  pc.el.classList.add('lifted');
  pc.el.classList.remove('enter');
  pc.el.style.zIndex = String(++zTop);
  moveTo(pc, cx, cy - lift, Math.max(1.08, geo.trayScale * 1.05), 0, 120, 'ease-out');
  sfx.pick(pieces.indexOf(pc) + 2);
  vibrate(8);
  say(`${pieceName(pc)}!`);
  lastAction = now();
  if (pc.misses >= 2) hint(pc, false);
}

function moveDrag(p) {
  const pc = drag.pc;
  pc.x = p.x + drag.dx;
  pc.y = p.y + drag.dy;
  pc.el.style.transition = 'none';
  place(pc);
  setHover(targetAt(pc.x, pc.y));
  lastAction = now();
}

function endDrag() {
  const pc = drag.pc;
  drag = null;
  setHover(null);
  pc.el.classList.remove('lifted');
  lastAction = now();
  const t = targetAt(pc.x, pc.y);
  if (!t) {
    moveTo(pc, pc.homeX, pc.homeY, geo.trayScale, pc.homeRot, 550);
    floatBack();
    return;
  }
  if (t.key === pc.match) success(pc, t);
  else wrong(pc, t);
}

function wrong(pc, t) {
  pc.misses++;
  sfx.boing();
  vibrate(20);
  replayClass(t.el, 'shake');
  // a little hop out of the hole, then back to the tray
  moveTo(pc, pc.x + (pc.homeX - pc.x) * 0.15, pc.y - geo.size * 0.35, 1.15, rand(-20, 20), 180, 'ease-out');
  replayClass(pc.pin, 'squash');
  later(() => moveTo(pc, pc.homeX, pc.homeY, geo.trayScale, pc.homeRot, 650, 'cubic-bezier(.3,1.5,.5,1)'), 190);
  if (pc.misses >= 2) {
    later(() => hint(pc, true), 500);
  } else {
    later(() => say(pickOne(['Oops!', 'Boing!', 'Not that one!', 'Try again!'])), 150);
  }
}

function success(pc, t) {
  pc.done = true;
  pc.target = t;
  clearHint();
  store.data.sorted++;
  store.persist();
  const left = pieces.filter((x) => !x.done).length;
  const done = pieces.length - left;
  if (mode === 'shapes') {
    moveTo(pc, t.cx, t.cy, 1, 0, 170, 'ease-out');
    later(() => {
      clunk();
      vibrate(25);
      pc.el.classList.add('seated');
      replayClass(pc.pin, 'clunk');
      fx.ring(t.cx, t.cy, pc.color);
      fx.sparkles(t.cx, t.cy, 12, geo.size * 0.5 / unit);
      sfx.chime([0, 4, 7, 12], 523 * Math.pow(2, done / 12), 0.06);
      say(sortedPhrase(pc));
      updateProgress();
      if (!left) roundDone();
    }, 180);
  } else {
    const mx = t.cx - t.w / 2 + t.mouthX;
    const my = t.cy - t.h / 2 + t.mouthY;
    moveTo(pc, mx, my - t.fs * 0.6, t.fs / pc.size, 0, 200, 'ease-out');
    later(() => {
      pc.el.classList.add('gone');
      const el = document.createElement('div');
      el.className = 'inside';
      el.innerHTML = foodSvg(pc.key);
      t.el.querySelector('.contents').appendChild(el);
      placeInside(t, el, t.el.querySelectorAll('.inside').length - 1);
      plop();
      vibrate(20);
      replayClass(t.el, 'happy');
      fx.burst(mx, my, pc.color.hex);
      fx.sparkles(mx, my - t.fs * 0.3, 10, 50);
      sfx.chime([0, 4, 7, 12], 523 * Math.pow(2, done / 12), 0.06);
      say(sortedPhrase(pc));
      updateProgress();
      if (!left) roundDone();
    }, 210);
  }
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------
function play(m) {
  mode = m;
  round = store.data.round[m] || 0;
  showScreen(null);
  $('#play').classList.remove('hidden');
  say(m === 'shapes' ? 'Shapes!' : 'Colors!');
  buildRound();
}
function leave() {
  token++;
  busy = true;
  drag = null;
  clearHint();
  mode = null;
  fx.clear();
  $('#play').classList.add('hidden');
  $('#targets').innerHTML = '';
  $('#pieces').innerHTML = '';
  showScreen('screen-title');
  updateTitle();
}
function updateTitle() {
  const n = store.data.sorted;
  $('#title-best').textContent = n ? `⭐ ${n} sorted!` : '';
}

function buildTitle() {
  $('#title-toys').innerHTML =
    `<div class="toy">${blockSvg('star', '#ffd93b')}</div>` +
    `<div class="toy">${foodSvg('apple')}</div>` +
    `<div class="toy">${blockSvg('heart', '#ff7ac6')}</div>` +
    `<div class="toy">${foodSvg('banana')}</div>` +
    `<div class="toy">${blockSvg('circle', '#3d7bff')}</div>`;
  $('#ico-shapes').innerHTML =
    `<svg style="left:-6px;top:4px;width:44px;height:44px" ${blockSvg('triangle', '#3d7bff').slice(5)}` +
    `<svg style="left:18px;top:14px;width:44px;height:44px" ${blockSvg('star', '#ffd93b').slice(5)}`;
  $('#ico-colors').innerHTML =
    `<svg style="left:-6px;top:2px;width:46px;height:46px" ${foodSvg('banana').slice(5)}` +
    `<svg style="left:16px;top:12px;width:46px;height:46px" ${foodSvg('apple').slice(5)}`;
  updateTitle();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
onPointer($('#play'), {
  down(p) {
    if (drag || busy || !mode) return false;
    const pc = pieceAt(p.x, p.y);
    if (!pc) return false;
    startDrag(pc, p);
    return true;
  },
  move(p) { if (drag && drag.id === p.id) moveDrag(p); },
  up(p) { if (drag && drag.id === p.id) endDrag(p); },
});

buildTitle();

boot({
  party: ['#ff9a2e', '#ff6fb5', '#8f6bff'],
  onAction(action, el) {
    if (action === 'mode') play(el.dataset.mode);
    if (action === 'back') leave();
  },
  onBack(screen) {
    if (screen === null) { leave(); return true; }
    return false;
  },
  onFrame() {
    if (!mode || busy) return;
    const t = now();
    if (drag) {
      if (!drag.hinted && t - drag.t0 > 3500) { drag.hinted = true; hint(drag.pc, false); }
      return;
    }
    if (t - lastAction > 8000) {
      lastAction = t;
      const left = pieces.filter((x) => !x.done);
      if (!left.length) return;
      const pc = left[0];
      replayClass(pc.pin, 'wiggle');
      hint(pc, true);
    }
  },
  onResize() {
    if (mode) layout();
  },
});

// a small hook for automated tests
window.__sorter = {
  state() {
    return {
      mode, round, busy,
      targets: targets.map((t) => ({ key: t.key, x: t.cx, y: t.cy, w: t.w, h: t.h })),
      pieces: pieces.map((pc) => ({ key: pc.key, match: pc.match, done: pc.done, x: pc.x, y: pc.y, homeX: pc.homeX, homeY: pc.homeY })),
    };
  },
};
