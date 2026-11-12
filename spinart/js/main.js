// Spin Art: Spin Paint, Butterfly Fold and Bubble Print.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import {
  boot, $, $$, fx, showScreen, celebrate, onPointer, createStore, replayClass, setPartyColors,
  saveImage, pickOne, centerOf, unit, DPR,
} from '../../shared/js/kit.js';
import { COLORS } from './paint.js';
import { createSpin } from './spin.js';
import { createButterfly } from './butterfly.js';
import { createBubbles } from './bubbles.js';

const store = createStore('spinart', {
  color: 'pink', speed: 2, spinTool: 'drip', flyTool: 'blob', mirror: false, bsize: 'm',
});
// each mode's picture is kept in its own little store, so a kid can come back to it
const pics = {
  spin: createStore('spinart-spin', { img: '' }),
  fly: createStore('spinart-butterfly', { img: '' }),
  bub: createStore('spinart-bubbles', { img: '' }),
};

const MODES = {
  spin: { name: 'Spin Paint', icon: '🌀', party: ['#ff6fb5', '#ffb347', '#7b5cff'], hello: 'Touch the spinning paper!' },
  fly: { name: 'Butterfly Fold', icon: '🦋', party: ['#4fc3ff', '#9d7bff', '#ff8fd0'], hello: 'Paint the butterfly, then fold!' },
  bub: { name: 'Bubble Print', icon: '<i class="bub-ico"></i>', party: ['#8a6bff', '#5ad1ff', '#ff9ad5'], hello: 'Blow bubbles, then pop them!' },
};
const COLOR_NAMES = {
  red: 'Red', orange: 'Orange', yellow: 'Yellow', green: 'Green', teal: 'Teal', blue: 'Blue', purple: 'Purple',
  pink: 'Pink', magenta: 'Magenta', ink: 'Dark', rainbow: 'Rainbow!', glitter: 'Glitter!',
};
const SPEED_WORDS = ['Stop!', 'Slow', 'Faster!', 'Super fast!'];

// paint canvases stay a modest size so old iPads stay smooth
const P = Math.min(1024, Math.max(640, Math.round(Math.min(screen.width, screen.height) * Math.min(2, window.devicePixelRatio || 1) * 0.9 / 64) * 64));

let modeId = null;
let M = null;
const made = {};
const stage = $('#stage');
const sc = stage.getContext('2d');
let rect = { left: 0, top: 0, width: 100, height: 100 };
let redraw = true;

function mode(id) {
  if (!made[id]) {
    if (id === 'spin') made[id] = createSpin(P);
    if (id === 'fly') made[id] = createButterfly(flyHooks);
    if (id === 'bub') made[id] = createBubbles(bubHooks);
    made[id].restore(pics[id].data.img);
  }
  return made[id];
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
function sizeStage() {
  const r = $('#stage-wrap').getBoundingClientRect();
  rect = { left: r.left, top: r.top, width: Math.max(60, r.width), height: Math.max(60, r.height) };
  stage.width = Math.round(rect.width * DPR);
  stage.height = Math.round(rect.height * DPR);
  if (M) M.layout(rect.width, rect.height, DPR, unit);
  redraw = true;
}

// ---------------------------------------------------------------------------
// Palette and tools
// ---------------------------------------------------------------------------
function buildPalette() {
  $('#palette').innerHTML = COLORS.map((c, i) => {
    const cls = c.magic ? `swatch magic m-${c.key}` : 'swatch';
    const style = c.magic ? '' : ` style="--c:${c.hex}"`;
    return `<button class="${cls}" data-action="color" data-color="${c.key}" data-i="${i}" data-quiet aria-label="${COLOR_NAMES[c.key]}"${style}></button>`;
  }).join('');
}
function syncTools() {
  $$('.swatch').forEach((b) => b.classList.toggle('on', b.dataset.color === store.data.color));
  $$('#speed-seg .seg-btn').forEach((b) => b.classList.toggle('on', +b.dataset.speed === store.data.speed));
  $$('.tools-spin [data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === store.data.spinTool));
  $$('.tools-fly [data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === store.data.flyTool));
  $$('#size-seg .seg-btn').forEach((b) => b.classList.toggle('on', b.dataset.size === store.data.bsize));
  $('#mirror-btn').classList.toggle('on', !!store.data.mirror);
}
function tool() {
  if (modeId === 'spin') return store.data.spinTool;
  if (modeId === 'fly') return store.data.flyTool;
  return 'bubble';
}
function setModeClass() {
  const p = $('#play');
  p.classList.remove('mode-spin', 'mode-fly', 'mode-made', 'mode-bub');
  if (!modeId) return;
  p.classList.add(`mode-${modeId}`);
  if (modeId === 'fly' && M.state === 'made') p.classList.add('mode-made');
}

// ---------------------------------------------------------------------------
// Fingers
// ---------------------------------------------------------------------------
let lastSound = 0;
let soundClock = 0;
onPointer(stage, {
  down(p) {
    if (!M) return false;
    const x = p.x - rect.left;
    const y = p.y - rect.top;
    if (modeId === 'spin') {
      if (M.down(p.id, x, y, store.data.color, tool())) {
        sfx.splash(store.data.spinTool === 'bubble' ? 1.4 : 1);
        fx.trail(p.x, p.y);
      }
    } else if (modeId === 'fly') {
      M.down(p.id, x, y, store.data.color, tool());
      if (M.state === 'paint' && M.onPaper(x, y)) sfx.splash(tool() === 'blob' ? 0.9 : 1.3);
    } else {
      M.down(p.id, x, y, store.data.color);
    }
    redraw = true;
    return true;
  },
  move(p) {
    if (!M) return;
    M.move(p.id, p.x - rect.left, p.y - rect.top);
    redraw = true;
    if (modeId === 'fly' && M.state === 'paint' && soundClock - lastSound > 0.12) {
      lastSound = soundClock;
      sfx.scribble();
    }
  },
  up(p) {
    if (!M) return;
    M.up(p.id);
    if (modeId === 'fly' && M.state === 'paint') $('.fold-btn').classList.add('ready');
  },
});

// ---------------------------------------------------------------------------
// Butterfly and bubble events
// ---------------------------------------------------------------------------
const flyHooks = {
  pressed() {
    sfx.splash(0.55);
    setTimeout(() => sfx.pop(0.6), 80);
    const c = centerOf(stage);
    fx.text(c.x, c.y, 'Squish!', '#fff', 40, 0.9);
  },
  cut() {
    [0, 0.18, 0.36, 0.54].forEach((d) => setTimeout(() => {
      if (sfx.ready()) sfx.noise({ dur: 0.05, vol: 0.18, freq: 5200 });
    }, d * 1000));
    say('Snip, snip!');
  },
  made() {
    setModeClass();
    persist();
    celebrate('Ta-da!', 'A butterfly!');
    say(pickOne(['What a beautiful butterfly!', 'Look, a butterfly!', 'Ta-da! A butterfly!']));
  },
  flutter(x, y) {
    fx.sparkles(x + rect.left, y + rect.top, 8, 50);
    sfx.sparkle();
  },
};
const bubHooks = {
  pop(b, quiet) {
    if (quiet) return;
    const x = b.x + rect.left;
    const y = b.y + rect.top;
    fx.ring(x, y, b.color);
    if (b.r > 22) fx.sparkle(x, y);
    sfx.pop(Math.max(0.6, Math.min(1.6, 26 / b.r)));
  },
  blow() {
    if (sfx.ready()) sfx.tone({ f0: 500, f1: 900, dur: 0.12, vol: 0.06 });
  },
};

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------
function openMode(id) {
  modeId = id;
  M = mode(id);
  M.fingers = {};
  if (id === 'spin') M.setSpeed(store.data.speed);
  if (id === 'fly') M.mirror = !!store.data.mirror;
  if (id === 'bub') M.size = store.data.bsize;
  const I = MODES[id];
  $('#pill-icon').innerHTML = I.icon;
  $('#pill-text').textContent = I.name;
  setPartyColors(I.party);
  showScreen(null);
  $('#play').classList.remove('hidden');
  setModeClass();
  syncTools();
  $('.fold-btn').classList.remove('ready');
  sizeStage();
  say(I.hello);
}

function persist() {
  if (!M || !modeId || !M.changed) return;
  M.changed = false;
  pics[modeId].data.img = M.snapshot();
  pics[modeId].persistNow();
}

function leave() {
  persist();
  $('#play').classList.add('hidden');
  modeId = null;
  M = null;
  fx.clear();
  setPartyColors(['#ff6fb5', '#c27bff', '#6fc8ff']);
  showScreen('screen-title');
}

function newPaper() {
  if (!M) return;
  if (modeId === 'fly') M.unmake();
  M.clear();
  pics[modeId].data.img = '';
  pics[modeId].persistNow();
  M.changed = false;
  setModeClass();
  $('.fold-btn').classList.remove('ready');
  sfx.whoosh();
  const c = centerOf(stage);
  fx.sparkles(c.x, c.y, 12, 90);
  say(pickOne(['New paper!', 'A fresh page!', 'Ready!']));
  redraw = true;
}

function doFold() {
  if (M.state !== 'paint') return;
  if (M.isEmpty()) {
    sfx.boing();
    replayClass($('.fold-btn'), 'wiggle');
    say('Paint some colors first!');
    return;
  }
  if (M.fold()) {
    sfx.whoosh();
    $('.fold-btn').classList.remove('ready');
    say('Fold!');
  }
}

function pickColor(el) {
  store.data.color = el.dataset.color;
  store.persist();
  syncTools();
  sfx.pick(+el.dataset.i);
  replayClass(el, 'bounce');
  say(COLOR_NAMES[el.dataset.color]);
  if (modeId === 'fly' && M && M.state === 'made') { M.unmake(); setModeClass(); }
}

// ---------------------------------------------------------------------------
// The little spinning picture on the title screen
// ---------------------------------------------------------------------------
function drawTitleDisc() {
  const cv = $('#title-disc');
  const c = cv.getContext('2d');
  const R = 100;
  c.fillStyle = '#fff';
  c.fillRect(0, 0, 200, 200);
  c.lineCap = 'round';
  const cols = ['#ff4d5e', '#ff9a2e', '#ffd93b', '#5cd65c', '#22c7b8', '#3d7bff', '#9d5cff', '#ff7ac6'];
  for (let i = 0; i < 26; i++) {
    let r = 8 + Math.random() * 40;
    let a = Math.random() * Math.PI * 2;
    c.strokeStyle = cols[i % cols.length];
    let w = 9;
    c.beginPath();
    c.moveTo(R + Math.cos(a) * r, R + Math.sin(a) * r);
    while (r < 96 && w > 1.5) {
      r += 3;
      a -= 0.035;
      c.lineTo(R + Math.cos(a) * r, R + Math.sin(a) * r);
    }
    c.lineWidth = w;
    c.stroke();
    c.fillStyle = cols[i % cols.length];
    c.beginPath();
    c.arc(R + Math.cos(a) * 94, R + Math.sin(a) * 94, 3, 0, Math.PI * 2);
    c.fill();
  }
  c.beginPath();
  c.arc(R, R, 10, 0, Math.PI * 2);
  c.fillStyle = '#ff3d9a';
  c.fill();
  c.lineWidth = 3;
  c.strokeStyle = '#2d2442';
  c.stroke();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
buildPalette();
drawTitleDisc();

let saveClock = 0;
boot({
  party: ['#ff6fb5', '#c27bff', '#6fc8ff'],
  onAction(action, el) {
    switch (action) {
      case 'mode': openMode(el.dataset.mode); break;
      case 'back': leave(); break;
      case 'new': newPaper(); break;
      case 'save':
        if (M) { persist(); saveImage(M.exportCanvas(), modeId === 'fly' ? 'butterfly' : modeId === 'bub' ? 'bubble-print' : 'spin-art', 'My painting'); }
        break;
      case 'color': pickColor(el); break;
      case 'speed': {
        const s = +el.dataset.speed;
        const faster = s > store.data.speed;
        store.data.speed = s;
        store.persist();
        if (M && modeId === 'spin') M.setSpeed(s);
        syncTools();
        if (s === 0) sfx.boing(); else if (faster) sfx.whoosh(); else sfx.click();
        say(SPEED_WORDS[s]);
        break;
      }
      case 'tool':
        if (modeId === 'spin') store.data.spinTool = el.dataset.tool;
        else store.data.flyTool = el.dataset.tool;
        store.persist();
        syncTools();
        if (modeId === 'fly' && M && M.state === 'made') { M.unmake(); setModeClass(); }
        break;
      case 'mirror':
        store.data.mirror = !store.data.mirror;
        store.persist();
        if (M && modeId === 'fly') M.mirror = store.data.mirror;
        syncTools();
        redraw = true;
        if (store.data.mirror) { sfx.sparkle(); say('Magic mirror!'); }
        break;
      case 'fold': doFold(); break;
      case 'unmake': M.unmake(); setModeClass(); break;
      case 'flutter': {
        M.flutter = 1.6;
        const c = centerOf(stage);
        flyHooks.flutter(c.x - rect.left, c.y - rect.top);
        say(pickOne(['Flap, flap!', 'Fly, butterfly!', 'Wheee!']));
        break;
      }
      case 'bsize':
        store.data.bsize = el.dataset.size;
        store.persist();
        if (M && modeId === 'bub') M.size = el.dataset.size;
        syncTools();
        break;
      case 'blow':
        if (M && modeId === 'bub') { M.blowPuff(store.data.color); sfx.whoosh(); }
        break;
    }
  },
  onBack(screen) {
    if (screen === null && modeId) { leave(); return true; }
    return false;
  },
  onFrame(dt) {
    soundClock += dt;
    if (!M) return;
    M.update(dt);
    // a soft painty sound while a finger drips onto the spinning paper
    if (modeId === 'spin' && soundClock - lastSound > 0.16) {
      for (const id in M.fingers) {
        const f = M.fingers[id];
        if (M.onDisc(f.sx, f.sy)) { lastSound = soundClock; sfx.scribble(); break; }
      }
    }
    let need = redraw;
    if (modeId === 'spin') need = need || M.busy();
    else if (modeId === 'fly') need = need || M.busy();
    else need = need || M.bubbles.length > 0 || M.changed;
    if (need) {
      sc.setTransform(1, 0, 0, 1, 0, 0);
      sc.clearRect(0, 0, stage.width, stage.height);
      M.draw(sc, DPR);
      redraw = false;
    }
    // keep the painting safe now and then
    saveClock += dt;
    if (saveClock > 20) { saveClock = 0; persist(); }
  },
  onResize() { if (M) sizeStage(); },
});

window.addEventListener('pagehide', persist);
document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

// a tiny hook for automated tests
window.__spinart = {
  get mode() { return M; },
  get id() { return modeId; },
  rect: () => rect,
  open: openMode,
  P,
};
