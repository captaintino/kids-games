// Feed the Animal: drag food to a hungry friend. Favorite foods get hearts and a
// happy wiggle, yucky foods get a silly face and are spat back out. A full tummy
// means a happy dance, a burp and a nap.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import {
  boot, $, fx, showScreen, celebrate, onPointer, createStore, replayClass, shuffle, pickOne,
  rand, vibrate, unit,
} from '../../shared/js/kit.js';
import { FRIENDS, FRIEND, friendSvg, mountFriend } from './characters.js';
import { FOODS, foodSvg } from '../../shared/js/food.js';

const store = createStore('feed', { fed: {}, total: 0 });
if (!store.data.fed || typeof store.data.fed !== 'object') store.data.fed = {};

const TUMMY = 5;
const SLOTS = 6;
const YUM = ['Yum!', 'Mmm!', 'Yummy!', 'Num num num!', 'Delicious!', 'Mmm, more please!'];
const BLEH = ['Bleh!', 'Blehh! Yucky!', 'Bleh! No thank you!', 'Ew! Bleh!'];
const HUNGRY = ["I'm hungry!", 'Feed me, please!', 'My tummy is rumbling!', 'Something yummy, please!'];

let cur = null;           // the friend being fed
let rig = null;           // its face controls
let state = 'off';        // off | idle | eating | full | asleep
let tummy = 0;
let pieces = [];          // food on the tray (one per slot)
let drag = null;
let token = 0;
let lastAction = 0;
let zTop = 10;
let safe = { t: 0, r: 0, b: 0, l: 0 };
let box = null;           // where the friend is on screen
let traySlots = [];
let pieceSize = 80;
let trayScale = 1;
let spits = [];           // food flying back out of the mouth

// face animation
let open = 0;
let openGoal = 0;
let blinkT = -1;
let nextBlink = 2;
let gaze = { x: 0, y: 0 };
let gazeGoal = null;
let nextGlance = 1;
let zzzT = 0;
let snoreT = 0;

const now = () => (window.performance ? performance.now() : Date.now());
function later(fn, ms) {
  const t = token;
  setTimeout(() => { if (t === token) fn(); }, ms);
}
const friendSay = (text, queue) => say(text, { pitch: cur ? cur.pitch : 1.1, rate: cur ? cur.rate : 0.95, queue: !!queue });

// ---------------------------------------------------------------------------
// Sounds
// ---------------------------------------------------------------------------
function chomp(i) {
  if (!sfx.ready()) return;
  sfx.tone({ type: 'triangle', f0: 190 + i * 25, f1: 90, dur: 0.09, vol: 0.32 });
  sfx.noise({ dur: 0.08, vol: 0.32, freq: 380 + Math.random() * 300 });
}
function bleh() {
  if (!sfx.ready()) return;
  for (let i = 0; i < 7; i++) {
    sfx.tone({ type: 'triangle', f0: 290 - i * 16 + (i % 2 ? 45 : 0), f1: 250 - i * 16, dur: 0.1, vol: 0.22, delay: i * 0.065 });
  }
  sfx.noise({ dur: 0.45, vol: 0.06, freq: 500 });
}
function spitSound() {
  if (!sfx.ready()) return;
  sfx.tone({ f0: 260, f1: 980, dur: 0.16, vol: 0.22 });
  sfx.noise({ dur: 0.08, vol: 0.14, freq: 2200 });
}
function burp() {
  if (!sfx.ready()) return;
  sfx.tone({ f0: 130, f1: 64, dur: 0.6, vol: 0.5, attack: 0.03 });
  sfx.tone({ type: 'triangle', f0: 100, f1: 58, dur: 0.55, vol: 0.25, attack: 0.03 });
  for (let i = 0; i < 6; i++) sfx.tone({ f0: 118 - i * 8, dur: 0.08, vol: 0.18, delay: i * 0.08 });
  sfx.noise({ dur: 0.4, vol: 0.12, freq: 260 });
}
function rumble() {
  if (!sfx.ready()) return;
  for (let i = 0; i < 4; i++) sfx.tone({ f0: 72 + Math.random() * 18, f1: 52, dur: 0.32, vol: 0.32, delay: i * 0.2, attack: 0.05 });
  sfx.noise({ dur: 0.8, vol: 0.06, freq: 170 });
}
function giggle() {
  if (!sfx.ready()) return;
  for (let i = 0; i < 4; i++) sfx.tone({ f0: 820 + (i % 2) * 140, f1: 1050, dur: 0.07, vol: 0.1, delay: i * 0.09 });
}
function snore() {
  if (!sfx.ready()) return;
  sfx.tone({ f0: 150, f1: 115, dur: 1, vol: 0.06, attack: 0.35 });
  sfx.tone({ f0: 600, f1: 900, dur: 0.6, vol: 0.02, attack: 0.2, delay: 1.1 });
}
function floatBack() {
  if (!sfx.ready()) return;
  sfx.tone({ f0: 700, f1: 420, dur: 0.22, vol: 0.08 });
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
function setBox(el, b) {
  el.style.left = `${b.x}px`;
  el.style.top = `${b.y}px`;
  el.style.width = `${b.w}px`;
  el.style.height = `${b.h}px`;
}
function fitGrid(n, w, h) {
  let best = null;
  for (let c = 1; c <= n; c++) {
    const r = Math.ceil(n / c);
    const s = Math.min(w / c, h / r);
    if (!best || s > best.s + 0.5) best = { c, r, cw: w / c, ch: h / r, s };
  }
  return best;
}

function layout() {
  readSafe();
  const W = window.innerWidth;
  const H = window.innerHeight;
  const gap = Math.max(10, Math.min(W, H) * 0.03);
  const x0 = safe.l + gap;
  const x1 = W - safe.r - gap;
  const y0 = safe.t + 10 + 56 + gap;
  const y1 = H - safe.b - gap;
  const aw = x1 - x0;
  const ah = y1 - y0;
  let stage;
  let tray;
  if (aw > ah * 1.15) {
    const tw = Math.round(Math.min(aw * 0.4, ah * 1.1));
    stage = { x: x0, y: y0, w: aw - tw - gap, h: ah };
    tray = { x: x1 - tw, y: y0, w: tw, h: ah };
  } else {
    const th = Math.round(Math.min(ah * 0.33, aw * 0.75));
    stage = { x: x0, y: y0, w: aw, h: ah - th - gap };
    tray = { x: x0, y: y1 - th, w: aw, h: th };
  }
  const fw = Math.min(stage.w, (stage.h * 400) / 430) * 0.97;
  const fh = (fw * 430) / 400;
  box = { x: stage.x + (stage.w - fw) / 2, y: stage.y + (stage.h - fh) / 2, w: fw, h: fh, k: fw / 400 };
  setBox($('#friend'), box);
  setBox($('#tray'), tray);

  const tin = { x: tray.x + 8, y: tray.y + 8, w: tray.w - 16, h: tray.h - 16 };
  const g = fitGrid(SLOTS, tin.w, tin.h);
  pieceSize = Math.min(g.s * 0.86, fw * 0.36);
  trayScale = 1;
  traySlots = [];
  for (let i = 0; i < SLOTS; i++) {
    const row = Math.floor(i / g.c);
    const col = i % g.c;
    const inRow = Math.min(g.c, SLOTS - row * g.c);
    traySlots.push({
      x: tin.x + (tin.w - inRow * g.cw) / 2 + (col + 0.5) * g.cw,
      y: tin.y + (tin.h - g.r * g.ch) / 2 + (row + 0.5) * g.ch,
    });
  }
  pieces.forEach((pc) => {
    if (!pc) return;
    pc.homeX = traySlots[pc.slot].x;
    pc.homeY = traySlots[pc.slot].y;
    sizePiece(pc);
    if (!(drag && drag.pc === pc) && !pc.flying) { pc.x = pc.homeX; pc.y = pc.homeY; pc.el.style.transition = 'none'; place(pc); }
  });
}

/** A point on the friend's sheet (400 x 430) in screen pixels. */
function toScreen(x, y) { return { x: box.x + x * box.k, y: box.y + y * box.k }; }
function toSheet(x, y) { return { x: (x - box.x) / box.k, y: (y - box.y) / box.k }; }
function mouthPt() {
  const m = cur.mouth;
  return toScreen(m[0], m[1] + m[2] * 0.3);
}

// ---------------------------------------------------------------------------
// Food pieces
// ---------------------------------------------------------------------------
function sizePiece(pc) {
  pc.size = pieceSize;
  pc.el.style.width = `${pieceSize}px`;
  pc.el.style.height = `${pieceSize}px`;
}
function place(pc) {
  pc.el.style.transform = `translate3d(${(pc.x - pc.size / 2).toFixed(1)}px,${(pc.y - pc.size / 2).toFixed(1)}px,0) rotate(${pc.rot.toFixed(1)}deg) scale(${pc.scale.toFixed(3)})`;
}
function moveTo(pc, x, y, scale, rot, ms, easing) {
  pc.x = x; pc.y = y; pc.scale = scale; pc.rot = rot;
  pc.el.style.transition = ms ? `transform ${ms}ms ${easing || 'cubic-bezier(.3,1.4,.5,1)'}` : 'none';
  place(pc);
}

function chooseFood() {
  const onTray = pieces.filter(Boolean).map((p) => p.key);
  const likesOut = onTray.filter((k) => cur.likes.indexOf(k) >= 0).length;
  const yucksOut = onTray.filter((k) => cur.yucks.indexOf(k) >= 0).length;
  let pool;
  if (likesOut < 3) pool = cur.likes;
  else if (yucksOut < 1) pool = cur.yucks;
  else pool = Math.random() < 0.72 ? cur.likes : cur.yucks;
  const fresh = pool.filter((k) => onTray.indexOf(k) < 0);
  return pickOne(fresh.length ? fresh : pool);
}

function makePiece(slot, key, delay) {
  const el = document.createElement('div');
  el.className = 'piece enter';
  el.innerHTML = `<div class="pin" style="animation-delay:${delay || 0}s">${foodSvg(key)}</div>`;
  $('#pieces').appendChild(el);
  const pc = {
    key, slot, el, pin: el.firstChild, rot: rand(-10, 10), scale: trayScale,
    homeX: traySlots[slot].x, homeY: traySlots[slot].y, x: traySlots[slot].x, y: traySlots[slot].y,
  };
  pc.homeRot = pc.rot;
  el.style.zIndex = String(++zTop);
  sizePiece(pc);
  place(pc);
  pieces[slot] = pc;
  setTimeout(() => el.classList.remove('enter'), 900 + (delay || 0) * 1000);
  return pc;
}

function fillTray() {
  $('#pieces').innerHTML = '';
  pieces = [];
  const keys = shuffle([
    'broccoli', cur.yucks[1],
  ].concat(shuffle(cur.likes).slice(0, SLOTS - 2)));
  keys.forEach((k, i) => makePiece(i, k, 0.3 + i * 0.07));
}

function pieceAt(x, y) {
  let best = null;
  let bestD = Infinity;
  pieces.forEach((pc) => {
    if (!pc || pc.flying || pc.eaten) return;
    const r = pc.el.getBoundingClientRect();
    const m = 10;
    if (x < r.left - m || x > r.right + m || y < r.top - m || y > r.bottom + m) return;
    const d = Math.pow(x - (r.left + r.width / 2), 2) + Math.pow(y - (r.top + r.height / 2), 2);
    if (d < bestD) { bestD = d; best = pc; }
  });
  return best;
}

// ---------------------------------------------------------------------------
// Floating hearts and Zzz
// ---------------------------------------------------------------------------
const HEART = '<svg viewBox="-4 -4 108 108"><path d="M50 90C20 70 4 52 8 32C12 12 40 8 50 30C60 8 88 12 92 32C96 52 80 70 50 90Z" fill="#ff4d8a" stroke="#2d2442" stroke-width="8" stroke-linejoin="round"/><ellipse cx="28" cy="32" rx="9" ry="6" transform="rotate(-40 28 32)" fill="#fff" opacity=".7"/></svg>';
function floater(cls, x, y, size, html, rot, life) {
  const layer = $('#floaters');
  if (layer.children.length > 14) layer.removeChild(layer.firstChild);
  const el = document.createElement('div');
  el.className = `floater ${cls}`;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.transform = `translate3d(${(x - size / 2).toFixed(1)}px,${(y - size / 2).toFixed(1)}px,0) rotate(${rot}deg)`;
  el.innerHTML = `<div class="fl-in">${html}</div>`;
  layer.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, life);
}
function hearts(n) {
  const c = toScreen(200, 150);
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      floater('heart', c.x + rand(-0.32, 0.32) * box.w, c.y + rand(-0.1, 0.15) * box.h,
        rand(0.09, 0.14) * box.w, HEART, rand(-25, 25), 1400);
    }, i * 110);
  }
}
function zzz() {
  const c = toScreen(285, 120);
  const s = rand(0.1, 0.16) * box.w;
  floater('zzz', c.x, c.y, s, `<div style="font-size:${s}px">Z</div>`, 0, 2700);
}

// ---------------------------------------------------------------------------
// Dragging and eating
// ---------------------------------------------------------------------------
function startDrag(pc, p) {
  const r = pc.el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const lift = 14 * unit;
  drag = { pc, id: p.id, dx: cx - p.x, dy: cy - p.y - lift };
  pc.el.classList.add('lifted');
  pc.el.classList.remove('enter');
  pc.el.style.zIndex = String(++zTop);
  moveTo(pc, cx, cy - lift, 1.12, 0, 120, 'ease-out');
  sfx.pick(pc.slot + 3);
  vibrate(8);
  const f = FOODS[pc.key];
  say(`${f.name.charAt(0).toUpperCase()}${f.name.slice(1)}!`);
  lastAction = now();
}

function moveDrag(p) {
  const pc = drag.pc;
  pc.x = p.x + drag.dx;
  pc.y = p.y + drag.dy;
  pc.el.style.transition = 'none';
  place(pc);
  lastAction = now();
}

function nearMouth(pc) {
  const m = mouthPt();
  const d = Math.sqrt(Math.pow(pc.x - m.x, 2) + Math.pow(pc.y - m.y, 2));
  const head = toScreen(200, 205);
  const dh = Math.sqrt(Math.pow(pc.x - head.x, 2) + Math.pow(pc.y - head.y, 2));
  return { d, inside: d < box.w * 0.24 || dh < box.w * 0.3 };
}

function endDrag() {
  const pc = drag.pc;
  drag = null;
  pc.el.classList.remove('lifted');
  lastAction = now();
  if (state === 'idle' && nearMouth(pc).inside) { eat(pc); return; }
  moveTo(pc, pc.homeX, pc.homeY, trayScale, pc.homeRot, 550);
  floatBack();
}

function setFace(eyes, mouth) {
  if (eyes) rig.setEyes(eyes);
  if (mouth) rig.setMouth(mouth);
}

function eat(pc) {
  state = 'eating';
  const liked = cur.likes.indexOf(pc.key) >= 0;
  const m = mouthPt();
  const food = FOODS[pc.key];
  setFace('open', 'open');
  open = 1.1;
  rig.setOpen(open);
  moveTo(pc, m.x, m.y - box.w * 0.02, 0.5, 0, 170, 'ease-in');
  later(() => { pc.el.classList.add('gone'); pc.eaten = true; }, 180);

  if (liked) {
    for (let i = 0; i < 4; i++) {
      later(() => {
        open = i % 2 ? 0.55 : 0.12;
        rig.setOpen(open);
        chomp(i);
        replayClass($('#fa'), 'chomp');
        if (i % 2 === 0) fx.burst(m.x + rand(-10, 10), m.y + 6, food.color);
      }, 200 + i * 150);
    }
    later(() => {
      setFace('happy', 'smile');
      rig.setGreen(false);
      replayClass($('#fa'), 'happy');
      hearts(5);
      sfx.chime([0, 4, 7, 12, 16], 587, 0.07);
      fx.sparkles(m.x, m.y - box.w * 0.25, 10, 70);
      friendSay(pickOne(YUM.concat([`Mmm, ${food.name}!`])));
      tummy = Math.min(TUMMY, tummy + 1);
      rig.setTummy(tummy / TUMMY);
      updateMeter(true);
      // a new food pops onto the tray
      const slot = pc.slot;
      later(() => {
        if (pc.el.parentNode) pc.el.parentNode.removeChild(pc.el);
        pieces[slot] = null;
        if (tummy < TUMMY) makePiece(slot, chooseFood(), 0);
      }, 500);
    }, 820);
    later(() => {
      if (tummy >= TUMMY) { full(); return; }
      setFace('open', 'smile');
      state = 'idle';
      lastAction = now();
    }, 1900);
  } else {
    later(() => { open = 0.2; rig.setOpen(open); chomp(0); replayClass($('#fa'), 'chomp'); }, 200);
    later(() => {
      setFace('squint', 'yuck');
      rig.setGreen(true);
      replayClass($('#fa'), 'shudder');
      bleh();
      vibrate([20, 40, 20]);
      friendSay(pickOne(BLEH.concat([`Bleh! No ${food.name}!`])));
    }, 420);
    later(() => {
      // ptoo! the food flies back to the tray
      setFace(null, 'open');
      open = 0.8;
      rig.setOpen(open);
      spitSound();
      pc.el.classList.remove('gone');
      pc.eaten = false;
      pc.flying = true;
      pc.el.style.transition = 'none';
      spits.push({ pc, t: 0, dur: 0.75, x0: m.x, y0: m.y, x1: pc.homeX, y1: pc.homeY, h: box.h * 0.35, s0: 0.5 });
      fx.burst(m.x, m.y, '#bdf7a0');
    }, 1250);
    later(() => { setFace('squint', 'yuck'); }, 1450);
    later(() => {
      setFace('open', 'smile');
      rig.setGreen(false);
      state = 'idle';
      lastAction = now();
    }, 2400);
  }
}

function updateSpits(dt) {
  if (!spits.length) return;
  spits = spits.filter((s) => {
    s.t += dt / s.dur;
    const k = Math.min(1, s.t);
    const e = 1 - Math.pow(1 - k, 2);
    s.pc.x = s.x0 + (s.x1 - s.x0) * e;
    s.pc.y = s.y0 + (s.y1 - s.y0) * e - Math.sin(Math.PI * k) * s.h;
    s.pc.scale = s.s0 + (trayScale - s.s0) * k;
    s.pc.rot = 720 * e + s.pc.homeRot * k;
    place(s.pc);
    if (k >= 1) {
      s.pc.flying = false;
      s.pc.rot = s.pc.homeRot;
      replayClass(s.pc.pin, 'wiggle');
      sfx.boing();
      return false;
    }
    return true;
  });
}

function full() {
  state = 'full';
  const m = mouthPt();
  $('#tray').classList.add('dim');
  pieces.forEach((pc) => { if (pc) pc.el.classList.add('leave'); });
  setFace('happy', 'open');
  open = 0.6;
  rig.setOpen(open);
  replayClass($('#fa'), 'dance');
  celebrate('So full!', '');
  friendSay("I'm so full!");
  hearts(8);
  store.data.fed[cur.id] = (store.data.fed[cur.id] || 0) + 1;
  store.data.total = (store.data.total || 0) + 1;
  store.persist();
  later(() => {
    setFace('open', 'open');
    open = 1;
    rig.setOpen(open);
    replayClass($('#fa'), 'burp');
    burp();
    vibrate(60);
    fx.text(m.x, m.y - box.w * 0.12, 'BURP!', '#c8ff7a', 50, 1.4);
    fx.burst(m.x, m.y, '#e9ffd6', true);
  }, 2100);
  later(() => {
    setFace('happy', 'smile');
    giggle();
    replayClass($('#fa'), 'giggle');
    friendSay('Oops! Excuse me!');
  }, 2900);
  later(() => {
    setFace('sleep', 'open');
    open = 0.7;
    rig.setOpen(open);
    friendSay('Yawn... nap time!');
  }, 4700);
  later(() => {
    state = 'asleep';
    setFace('sleep', 'sleep');
    $('.fb').classList.add('sleepy');
    zzzT = 0;
    snoreT = 1.5;
    showScreen('screen-nap');
    say('Night night! Pick another friend!', { queue: true });
  }, 6200);
}

function tickle() {
  lastAction = now();
  if (state === 'asleep') { snore(); zzz(); return; }
  if (state !== 'idle') return;
  setFace('happy', 'open');
  open = 0.5;
  rig.setOpen(open);
  giggle();
  replayClass($('#fa'), 'giggle');
  friendSay(pickOne(['Hee hee!', 'That tickles!', 'Hi there!']));
  later(() => { if (state === 'idle') setFace('open', 'smile'); }, 900);
}

function rumbleTime() {
  lastAction = now();
  rumble();
  replayClass($('#fa'), 'rumble');
  setFace('open', 'open');
  open = 0.3;
  later(() => { if (state === 'idle') setFace('open', 'smile'); }, 1600);
  later(() => friendSay(pickOne(HUNGRY)), 500);
  // a gentle hint: one of the favorite foods wiggles
  const fav = pieces.filter((pc) => pc && !pc.flying && cur.likes.indexOf(pc.key) >= 0);
  if (fav.length) {
    const pc = pickOne(fav);
    later(() => replayClass(pc.pin, 'wiggle'), 900);
    later(() => replayClass(pc.pin, 'wiggle'), 1500);
    gazeGoal = toSheet(pc.homeX, pc.homeY);
    nextGlance = 2.5;
  }
}

// ---------------------------------------------------------------------------
// Meter
// ---------------------------------------------------------------------------
function buildMeter() {
  $('#m-ico').innerHTML = friendSvg(cur, 'mini').replace('viewBox="0 0 400 430"', 'viewBox="60 50 280 280"');
  let h = '';
  for (let i = 0; i < TUMMY; i++) h += '<div class="m-seg"></div>';
  $('#m-bar').innerHTML = h;
  updateMeter(false);
}
function updateMeter(bump) {
  const segs = $('#m-bar').children;
  for (let i = 0; i < segs.length; i++) segs[i].classList.toggle('on', i < tummy);
  $('#meter').classList.toggle('full', tummy >= TUMMY);
  if (bump) replayClass($('#meter'), 'bump');
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------
function startFriend(id) {
  token++;
  cur = FRIEND[id];
  tummy = 0;
  drag = null;
  spits = [];
  showScreen(null);
  $('#play').classList.remove('hidden');
  $('#tray').classList.remove('dim');
  $('#floaters').innerHTML = '';
  rig = mountFriend($('#fa'), cur);
  rig.setTummy(0);
  open = 0; openGoal = 0;
  $('.fb').className = 'fb enter';
  later(() => { $('.fb').className = 'fb'; }, 750);
  layout();
  fillTray();
  buildMeter();
  state = 'idle';
  lastAction = now();
  nextBlink = 1.5;
  friendSay(`Hi! I'm ${cur.name}! I'm hungry!`);
}

function showPicker() {
  token++;
  state = 'off';
  drag = null;
  fx.clear();
  $('#play').classList.add('hidden');
  $('#pal-grid').innerHTML = FRIENDS.map((f, i) => {
    const n = store.data.fed[f.id] || 0;
    return `<button class="tile ${f.tile}" data-action="friend" data-id="${f.id}" style="animation-delay:${i * 0.05}s">` +
      `<div class="tile-pic">${friendSvg(f, 'thumb')}</div><div class="tile-name">${f.name}</div>` +
      (n ? `<div class="stars">⭐${n}</div>` : '') + `</button>`;
  }).join('');
  showScreen('screen-pick');
  say("Who's hungry?");
}

function goTitle() {
  token++;
  state = 'off';
  drag = null;
  fx.clear();
  $('#play').classList.add('hidden');
  showScreen('screen-title');
  updateTitle();
}

function updateTitle() {
  const n = store.data.total || 0;
  $('#title-best').textContent = n ? `😋 ${n} full ${n === 1 ? 'tummy' : 'tummies'}!` : '';
}

function buildTitle() {
  const pals = shuffle(FRIENDS).slice(0, 3);
  $('#title-pals').innerHTML = pals.map((f) => `<div class="pal">${friendSvg(f, 'thumb')}</div>`).join('');
  updateTitle();
}

// ---------------------------------------------------------------------------
// Every frame: blinking, looking around, the mouth opening for food
// ---------------------------------------------------------------------------
function frame(dt) {
  if (state === 'off' || !rig) return;
  updateSpits(dt);
  const t = now();

  // eyes follow the food being dragged, otherwise glance around
  if (drag) {
    const s = toSheet(drag.pc.x, drag.pc.y);
    gazeGoal = s;
  } else {
    nextGlance -= dt;
    if (nextGlance <= 0) {
      nextGlance = rand(1.4, 3.4);
      const r = Math.random();
      if (r < 0.35) gazeGoal = null;
      else if (r < 0.75) {
        const list = pieces.filter((pc) => pc && !pc.flying);
        const pc = list.length ? pickOne(list) : null;
        gazeGoal = pc ? toSheet(pc.homeX, pc.homeY) : null;
      } else gazeGoal = { x: rand(-200, 600), y: rand(0, 400) };
    }
  }
  const gx = gazeGoal ? gazeGoal.x : 200;
  const gy = gazeGoal ? gazeGoal.y : 230;
  const ease = Math.min(1, dt * (drag ? 14 : 6));
  gaze.x += (gx - gaze.x) * ease;
  gaze.y += (gy - gaze.y) * ease;
  rig.look(gazeGoal || drag ? gaze.x : null, gaze.y, gazeGoal || drag ? 1 : 0);

  // blinking
  if (rig.eyes === 'open') {
    if (blinkT >= 0) {
      blinkT += dt;
      const k = blinkT / 0.2;
      rig.setBlink(k >= 1 ? 1 : 1 - Math.sin(Math.PI * k) * 0.92);
      if (k >= 1) blinkT = -1;
    } else {
      nextBlink -= dt;
      if (nextBlink <= 0) { blinkT = 0; nextBlink = Math.random() < 0.2 ? 0.3 : rand(2.2, 5); }
    }
  } else rig.setBlink(1);

  if (state === 'idle') {
    // mouth opens wider as food gets closer
    openGoal = 0;
    if (drag) {
      const d = nearMouth(drag.pc).d;
      openGoal = Math.max(0, Math.min(1, 1 - (d - box.w * 0.1) / (box.w * 0.8)));
      openGoal = openGoal * openGoal * 1.1;
    }
    open += (openGoal - open) * Math.min(1, dt * 10);
    if (rig.mouth === 'open' || rig.mouth === 'smile') {
      if (open > 0.08) { rig.setMouth('open'); rig.setOpen(open); } else rig.setMouth('smile');
    }
    if (!drag && t - lastAction > 12000) rumbleTime();
  }

  if (state === 'asleep') {
    zzzT -= dt;
    if (zzzT <= 0) { zzzT = 1.1; zzz(); }
    snoreT -= dt;
    if (snoreT <= 0) { snoreT = 3.6; snore(); }
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
onPointer($('#play'), {
  down(p) {
    if (drag || !rig) return false;
    if (state === 'idle') {
      const pc = pieceAt(p.x, p.y);
      if (pc) { startDrag(pc, p); return true; }
    }
    if (box && p.x > box.x + box.w * 0.15 && p.x < box.x + box.w * 0.85 && p.y > box.y && p.y < box.y + box.h) {
      tickle();
    }
    return false;
  },
  move(p) { if (drag && drag.id === p.id) moveDrag(p); },
  up(p) { if (drag && drag.id === p.id) endDrag(p); },
});

buildTitle();

boot({
  party: ['#5cd65c', '#ffb84d', '#ff7ac6'],
  onAction(action, el) {
    switch (action) {
      case 'pick': showPicker(); break;
      case 'surprise': startFriend(pickOne(FRIENDS).id); break;
      case 'friend': startFriend(el.dataset.id); break;
      case 'friends': showPicker(); break;
      case 'again': startFriend(cur.id); break;
      case 'leave': showPicker(); break;
      case 'home': goTitle(); break;
    }
  },
  onBack(screen) {
    if (screen === null || screen === 'screen-nap') { showPicker(); return true; }
    if (screen === 'screen-pick') { goTitle(); return true; }
    return false;
  },
  onFrame(dt) { frame(dt); },
  onResize() { if (state !== 'off') layout(); },
});

// a small hook for automated tests
window.__feed = {
  state() {
    return {
      friend: cur && cur.id, state, tummy,
      mouth: cur && box ? mouthPt() : null,
      likes: cur && cur.likes, yucks: cur && cur.yucks,
      pieces: pieces.map((pc) => pc && { key: pc.key, x: pc.homeX, y: pc.homeY, flying: !!pc.flying }),
    };
  },
};
