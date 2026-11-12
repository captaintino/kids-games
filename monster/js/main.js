// Build a Monster: mix and match parts, color it in, then watch it dance.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import {
  boot, $, $$, fx, showScreen, onPointer, createStore, centerOf, replayClass, saveImage,
  pickOne, rand, wait, FONT,
} from '../../shared/js/kit.js';
import { paintScene } from '../../shared/js/scenes.js';
import {
  HEADS, EYES, MOUTHS, BODIES, LEGS, ARMS, EXTRAS, PATTERNS, COLORS, shade,
  monsterSVG, layout, randomMonster, cleanMonster, monsterName,
} from './parts.js';
import { createBeat } from './beat.js';

const PARTY = ['#5cd65c', '#2fc6b0', '#7b5cff'];
const MAX_SHELF = 12;
const COLOR_NAMES = ['Red', 'Orange', 'Yellow', 'Lime', 'Green', 'Teal', 'Sky blue', 'Blue', 'Purple', 'Pink',
  'Bubblegum', 'Brown', 'Gray', 'Midnight'];

const TABS = [
  { key: 'head', name: 'Heads', icon: '👹', list: HEADS },
  { key: 'eyes', name: 'Eyes', icon: '👀', list: EYES, focus: 'head' },
  { key: 'mouth', name: 'Mouths', icon: '👄', list: MOUTHS, focus: 'head' },
  { key: 'body', name: 'Bodies', icon: '👕', list: BODIES },
  { key: 'arms', name: 'Arms', icon: '💪', list: ARMS },
  { key: 'legs', name: 'Legs', icon: '👟', list: LEGS },
  { key: 'extra', name: 'Extras', icon: '🦇', list: EXTRAS },
  { key: 'paint', name: 'Colors', icon: '🎨' },
];
const tabOf = (key) => TABS.filter((t) => t.key === key)[0];

const store = createStore('monster', { cur: null, shelf: [], tab: 'head', brush: 0, target: 'body' });
store.data.shelf = (store.data.shelf || []).map(cleanMonster).filter(Boolean).slice(0, MAX_SHELF);
let m = cleanMonster(store.data.cur) || randomMonster();
if (!tabOf(store.data.tab)) store.data.tab = 'head';
if (!(store.data.brush >= 0 && store.data.brush < COLORS.length)) store.data.brush = 0;

function persist() {
  store.data.cur = m;
  store.persist();
}

// ---------------------------------------------------------------------------
// The live monster and its animation
// ---------------------------------------------------------------------------
const monEl = $('#mon');
let refs = null;
let playing = false;
let dancing = false;
const A = {
  bounceT: -9, wiggleT: -9, blinkT: -9, spinT: -9, nextBlink: 2, cheerT: -9,
  look: { x: 0, y: 0 }, lookAt: { x: 0, y: 0 }, lookUntil: 0, t: 0, idleDirty: true,
};

function render() {
  monEl.innerHTML = monsterSVG(m, { id: 'live', parts: true });
  const g = (n) => document.getElementById('live-' + n);
  refs = {
    all: g('all'), torso: g('torso'), head: g('head'), eyes: g('eyes'), pupils: g('pupils'),
    armL: g('armL'), armR: g('armR'), shadow: g('shadow'), legs: [],
  };
  for (let i = 0; i < 6; i++) { const l = g('leg' + i); if (l) refs.legs.push(l); }
  A.idleDirty = true;
  updateName();
}

function setT(el, v) { if (el) el.setAttribute('transform', v); }
const f2 = (v) => v.toFixed(2);

function animate(t) {
  if (!refs || !playing) return;
  A.t = t;
  let allY = 0;
  let allR = 0;
  let sx = 1;
  let sy = 1;
  let torsoR = 0;
  let headR = 0;
  let armR = 0;
  let armL = 0;
  const legR = [];
  let px = A.look.x;
  let py = A.look.y;
  let eyeS = 1;
  let active = false;

  // blinking every few seconds
  if (t > A.nextBlink) { A.blinkT = t; A.nextBlink = t + rand(2.4, 5); }
  const kb = t - A.blinkT;
  if (kb < 0.18) { eyeS = 1 - Math.sin((kb / 0.18) * Math.PI) * 0.92; active = true; }

  if (dancing && danceBeat.on) {
    const b = beatNow();
    const hop = Math.abs(Math.sin(Math.PI * b));
    const loopBeat = b % 16;
    allY = -hop * 24;
    sy = 1 - (1 - hop) * 0.07;
    sx = 1 + (1 - hop) * 0.05;
    allR = Math.sin((Math.PI * b) / 2) * 7;
    headR = Math.sin(Math.PI * b) * 12;
    armR = -15 - 55 * (0.5 + 0.5 * Math.sin(Math.PI * b));
    armL = -15 - 55 * (0.5 + 0.5 * Math.sin(Math.PI * b + Math.PI));
    for (let i = 0; i < refs.legs.length; i++) legR.push(Math.sin(Math.PI * b + i * Math.PI) * 16);
    px = Math.cos((Math.PI * b) / 2) * 7;
    py = Math.sin((Math.PI * b) / 2) * 6;
    if (loopBeat >= 12 && loopBeat < 14) sx *= Math.cos(((loopBeat - 12) / 2) * Math.PI * 2);
    active = true;
  } else {
    // little reactions while building
    const k1 = t - A.bounceT;
    if (k1 < 0.7) {
      const e = 1 - k1 / 0.7;
      allY = -Math.abs(Math.sin((k1 * Math.PI) / 0.32)) * 26 * e;
      sy = 1 + Math.sin((k1 * Math.PI) / 0.16) * 0.06 * e;
      sx = 2 - sy;
      active = true;
    }
    const k2 = t - A.wiggleT;
    if (k2 < 0.9) {
      const e = 1 - k2 / 0.9;
      torsoR = Math.sin(k2 * 28) * 9 * e;
      headR = Math.sin(k2 * 28 + 1.2) * 8 * e;
      armR = Math.sin(k2 * 22) * 25 * e;
      armL = -armR;
      active = true;
    }
    const k3 = t - A.spinT;
    if (k3 < 0.7) {
      sx *= Math.cos((k3 / 0.7) * Math.PI * 2);
      allY = Math.min(allY, -Math.sin((k3 / 0.7) * Math.PI) * 40);
      active = true;
    }
    const k4 = t - A.cheerT;
    if (k4 < 2.4) {
      // happy wave after a dance
      armR = -40 - Math.sin(k4 * 10) * 30;
      armL = -40 - Math.sin(k4 * 10 + 1) * 30;
      allY = -Math.abs(Math.sin(k4 * 6)) * 10 * (1 - k4 / 2.4);
      active = true;
    }
    // eyes follow the last tap for a moment
    const tx = t < A.lookUntil ? A.lookAt.x : 0;
    const ty = t < A.lookUntil ? A.lookAt.y : 0;
    A.look.x += (tx - A.look.x) * 0.2;
    A.look.y += (ty - A.look.y) * 0.2;
    px = A.look.x;
    py = A.look.y;
    if (Math.abs(tx - A.look.x) > 0.05 || Math.abs(ty - A.look.y) > 0.05) active = true;
  }
  // skip the DOM work entirely when nothing is moving
  if (!active && !A.idleDirty) return;
  A.idleDirty = active;
  setT(refs.all, `translate(0 ${f2(allY)}) rotate(${f2(allR)}) scale(${f2(sx)} ${f2(sy)})`);
  setT(refs.torso, `rotate(${f2(torsoR)})`);
  setT(refs.head, `rotate(${f2(headR)})`);
  setT(refs.eyes, `scale(1 ${f2(eyeS)})`);
  setT(refs.pupils, `translate(${f2(px)} ${f2(py)})`);
  setT(refs.armR, `rotate(${f2(armR)})`);
  setT(refs.armL, `rotate(${f2(armL)})`);
  refs.legs.forEach((l, i) => setT(l, `rotate(${f2(legR[i] || 0)})`));
  const sh = 1 + allY / 120;
  setT(refs.shadow, `translate(200 452) scale(${f2(sh)} ${f2(sh)}) translate(-200 -452)`);
}

function giggle() {
  if (!sfx.ready()) return;
  [0, 0.09, 0.18, 0.27, 0.36].forEach((d, i) => sfx.tone({ type: 'triangle', f0: 760 - i * 40, f1: 620 - i * 40, dur: 0.07, vol: 0.16, delay: d }));
}
function boingPop() {
  if (!sfx.ready()) return;
  sfx.tone({ type: 'sine', f0: 220, f1: 640, dur: 0.12, vol: 0.25 });
  sfx.tone({ type: 'triangle', f0: 640, f1: 300, dur: 0.16, vol: 0.12, delay: 0.1 });
}
function react(kind) {
  const t = A.t;
  const r = kind || pickOne(['bounce', 'wiggle', 'blink', 'bounce']);
  if (r === 'bounce') { A.bounceT = t; boingPop(); }
  if (r === 'wiggle') { A.wiggleT = t; giggle(); }
  if (r === 'blink') { A.blinkT = t; A.nextBlink = t + 3; A.bounceT = t; sfx.pop(1.1); }
  if (r === 'spin') { A.spinT = t; }
}

// ---------------------------------------------------------------------------
// Building: tabs, options, colors
// ---------------------------------------------------------------------------
let tab = store.data.tab;
function buildTabs() {
  $('#tabs').innerHTML = TABS.map((t) =>
    `<button class="tab" data-action="tab" data-tab="${t.key}" data-quiet aria-label="${t.name}">${t.icon}</button>`).join('');
}
function showTab(key, speak) {
  tab = key;
  store.data.tab = key;
  store.persist();
  $$('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === key));
  const isPaint = key === 'paint';
  $('#opts').classList.toggle('hidden', isPaint);
  $('#paint').classList.toggle('hidden', !isPaint);
  if (isPaint) buildPaint(); else buildOpts(true);
  if (speak) say(tabOf(key).name);
}
function buildOpts(scroll) {
  const t = tabOf(tab);
  if (!t.list) return;
  const opts = $('#opts');
  opts.innerHTML = t.list.map((p, i) => {
    const mm = Object.assign({}, m, { [tab]: i });
    return `<button class="opt${m[tab] === i ? ' on' : ''}" data-action="opt" data-i="${i}" data-quiet aria-label="${p.name}">` +
      `${monsterSVG(mm, { focus: t.focus })}</button>`;
  }).join('');
  if (scroll) scrollToOn(opts);
}
function scrollToOn(box) {
  const on = box.querySelector('.on');
  if (!on) return;
  const land = box.scrollHeight > box.clientHeight + 4 && box.scrollWidth <= box.clientWidth + 4;
  if (land) box.scrollTop = Math.max(0, on.offsetTop - box.clientHeight / 2 + on.offsetHeight / 2);
  else box.scrollLeft = Math.max(0, on.offsetLeft - box.clientWidth / 2 + on.offsetWidth / 2);
}
function buildPaint() {
  $('#swatches').innerHTML = COLORS.map((c, i) =>
    `<button class="swatch${store.data.brush === i ? ' on' : ''}" style="--c:${c}" data-action="color" data-i="${i}" data-quiet aria-label="${COLOR_NAMES[i]}"></button>`).join('');
  $('#pats').innerHTML = PATTERNS.map((p) =>
    `<button class="pat pat-${p.key}${m.pattern === p.key ? ' on' : ''}" style="--c:${COLORS[store.data.brush]};--s:${shade(COLORS[store.data.brush])}" data-action="pattern" data-key="${p.key}" data-quiet aria-label="${p.name}"></button>`).join('') +
    `<button class="pat pat-all" data-action="paint-all" data-quiet aria-label="Color the whole monster">🪣</button>`;
  scrollToOn($('#swatches'));
}

function choose(i, viaArrow) {
  const t = tabOf(tab);
  if (!t.list) return;
  const n = t.list.length;
  m[tab] = ((i % n) + n) % n;
  render();
  persist();
  react();
  $$('.opt').forEach((b) => b.classList.toggle('on', +b.dataset.i === m[tab]));
  if (viaArrow) scrollToOn($('#opts'));
  say(t.list[m[tab]].name);
}

const PART_TAB = { head: 'head', eyes: 'eyes', mouth: 'mouth', body: 'body', arms: 'arms', legs: 'legs', extra: 'extra' };
const PAINT_PART = { head: 'head', eyes: 'head', mouth: 'head', body: 'body', arms: 'arms', legs: 'legs', extra: 'extra' };
const PART_WORDS = { head: 'head', body: 'tummy', arms: 'arms', legs: 'legs', extra: 'extras' };

function paintPart(part, x, y) {
  const col = COLORS[store.data.brush];
  store.data.target = part;
  if (m.colors[part] === col) { react('blink'); return; }
  m.colors[part] = col;
  render();
  persist();
  sfx.splash();
  A.wiggleT = A.t;
  if (x != null) fx.burst(x, y, col);
}
function paintAll() {
  const col = COLORS[store.data.brush];
  ['head', 'body', 'arms', 'legs'].forEach((p) => { m.colors[p] = col; });
  render();
  persist();
  sfx.splash(0.8);
  setTimeout(() => sfx.splash(1.2), 120);
  react('spin');
  const c = centerOf(monEl);
  fx.burst(c.x, c.y, col, true);
  say(`All ${COLOR_NAMES[store.data.brush]}!`);
}

onPointer(monEl, {
  down(p, e) {
    if (!refs) return false;
    // eyes look where you tap
    const r = monEl.getBoundingClientRect();
    const dx = p.x - (r.left + r.width / 2);
    const dy = p.y - (r.top + r.height * 0.35);
    const d = Math.max(1, Math.hypot(dx, dy));
    A.lookAt = { x: (dx / d) * 7, y: (dy / d) * 6 };
    A.lookUntil = A.t + 1.6;
    if (dancing) { react('blink'); giggle(); return true; }
    const el = e.target && e.target.closest ? e.target.closest('[data-part]') : null;
    const part = el ? el.getAttribute('data-part') : null;
    if (!part) { react('blink'); return true; }
    if (tab === 'paint') {
      paintPart(PAINT_PART[part], p.x, p.y);
    } else {
      react('wiggle');
      if (PART_TAB[part] !== tab) showTab(PART_TAB[part], true);
    }
    return true;
  },
});

// ---------------------------------------------------------------------------
// Surprise!
// ---------------------------------------------------------------------------
function surprise() {
  const keep = { id: m.id, name: '' };
  m = Object.assign(randomMonster(), { id: Date.now().toString(36) });
  m.name = keep.name;
  render();
  persist();
  sfx.whoosh();
  setTimeout(boingPop, 350);
  react('spin');
  A.bounceT = A.t + 0.5;
  const c = centerOf(monEl);
  fx.sparkles(c.x, c.y, 14, 90);
  if (tab === 'paint') buildPaint(); else buildOpts(true);
  say(pickOne(['Surprise!', 'Ta-da!', 'Whoa!', 'Look at that!']));
}

// ---------------------------------------------------------------------------
// The dance: a short synthesized beat, all made with tone() and noise()
// ---------------------------------------------------------------------------
const BPM = 124;
const STEP = 60 / BPM / 4; // one sixteenth note
const BASS = [130.81, 110, 87.31, 98]; // C, A, F, G
const MELODY = [
  [[0, 4], [2, 7], [4, 9], [6, 7], [8, 4], [12, 0], [14, 2]],
  [[0, 4], [2, 4], [4, 2], [6, 0], [8, -3], [12, 0]],
  [[0, 5], [2, 9], [4, 12], [6, 9], [8, 7], [10, 5], [12, 4], [14, 2]],
  [[0, 2], [2, 7], [4, 11], [6, 14], [8, 12], [11, 7], [12, 12]],
];
const LOOPS = 2;
function playStep(i, d) {
  const s = i % 16;
  const bar = Math.floor(i / 16) % 4;
  const T = sfx.tone;
  if (s % 4 === 0) T({ type: 'sine', f0: 150, f1: 45, dur: 0.2, vol: 0.55, delay: d });
  if (s === 4 || s === 12) { sfx.noise({ dur: 0.14, vol: 0.32, freq: 1700, delay: d }); T({ type: 'triangle', f0: 240, f1: 160, dur: 0.07, vol: 0.12, delay: d }); }
  if (s % 2 === 0) sfx.noise({ dur: 0.03, vol: s % 4 === 2 ? 0.1 : 0.05, freq: 8000, delay: d });
  if ([0, 3, 6, 8, 11, 14].indexOf(s) >= 0) {
    const f = BASS[bar] * (s === 6 || s === 14 ? 2 : 1);
    T({ type: 'triangle', f0: f, dur: STEP * 1.6, vol: 0.3, delay: d });
  }
  for (const [ms, n] of MELODY[bar]) {
    if (ms !== s) continue;
    const f = 523.25 * Math.pow(2, n / 12);
    T({ type: 'square', f0: f, dur: STEP * 1.7, vol: 0.045, delay: d });
    T({ type: 'triangle', f0: f, dur: STEP * 1.9, vol: 0.1, delay: d });
  }
  // a silly boing at the end of each loop, sparkles on the bar
  if (i % 64 === 60) T({ type: 'sine', f0: 200, f1: 900, dur: 0.25, vol: 0.18, delay: d });
}
const danceBeat = createBeat({ bpm: BPM, loopSteps: 64, play: playStep });
const beatNow = () => danceBeat.beat();
let lastBar = -1;
function danceFrame() {
  if (!dancing || !danceBeat.on) return;
  const b = beatNow();
  const bar = Math.floor(b / 4);
  if (bar !== lastBar && b < LOOPS * 16) {
    lastBar = bar;
    if (bar > 0) {
      const c = centerOf(monEl);
      fx.sparkles(c.x, c.y - 40, 10, 110);
      if (bar % 4 === 0) fx.confetti(40);
    }
  }
}
function startMusic() {
  lastBar = -1;
  danceBeat.start(endDance, LOOPS);
}
function stopMusic() {
  danceBeat.stop();
}
function endDance() {
  stopMusic();
  A.cheerT = A.t;
  sfx.chime([0, 4, 7, 12, 16], 784, 0.08);
  const c = centerOf(monEl);
  fx.sparkles(c.x, c.y, 14, 100);
  say(pickOne(['Ta-da!', 'What a dancer!', 'Woo hoo!', 'Great moves!']));
  replayClass($('#dance-row'), 'bounce');
}

function saveToShelf() {
  const copy = JSON.parse(JSON.stringify(m));
  const list = store.data.shelf.filter((x) => x.id !== m.id);
  list.unshift(copy);
  store.data.shelf = list.slice(0, MAX_SHELF);
  persist();
}

async function done() {
  if (!m.name) m.name = monsterName();
  saveToShelf();
  dancing = true;
  $('#play').classList.add('dancing');
  updateName();
  render();
  fx.confetti(90);
  sfx.win();
  replayClass($('#mon-name'), 'bounce');
  await wait(450);
  if (!dancing) return;
  say(`Meet ${m.name}!`, { pitch: 1.35 });
  await wait(1300);
  if (!dancing) return;
  startMusic();
}
function stopDance() {
  dancing = false;
  stopMusic();
  $('#play').classList.remove('dancing');
  A.idleDirty = true;
  render();
  if (tab === 'paint') buildPaint(); else buildOpts(true);
}
function updateName() {
  const el = $('#mon-name');
  el.textContent = m.name ? `👾 ${m.name}` : '👾 Who am I?';
}
function rename() {
  if (!m.name && !dancing) { react('wiggle'); say('Tap Done to give me a name!'); return; }
  m.name = monsterName();
  updateName();
  persist();
  if (store.data.shelf.some((x) => x.id === m.id)) saveToShelf();
  replayClass($('#mon-name'), 'bounce');
  sfx.sparkle();
  react('wiggle');
  say(m.name, { pitch: 1.35 });
}

// ---------------------------------------------------------------------------
// Save a picture
// ---------------------------------------------------------------------------
async function savePicture() {
  const W2 = 500;
  const H2 = 625;
  const k = 2;
  const cv = document.createElement('canvas');
  cv.width = W2 * k;
  cv.height = H2 * k;
  const c = cv.getContext('2d');
  c.scale(k, k);
  paintScene(c, W2, H2, 'party', PARTY);
  const svg = monsterSVG(m).replace('<svg ', `<svg width="${W2 * 0.9 * k}" height="${W2 * 0.9 * 1.2 * k}" `);
  const img = new Image();
  try {
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
    const w = W2 * 0.9;
    const h = w * 1.2;
    c.drawImage(img, (W2 - w) / 2, m.name ? 10 : 50, w, h);
  } catch (err) { /* draw what we can */ }
  if (m.name) {
    c.font = `700 46px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = 10;
    c.strokeStyle = '#6b2fc0';
    c.strokeText(m.name, W2 / 2, H2 - 50);
    c.fillStyle = '#fff';
    c.fillText(m.name, W2 / 2, H2 - 50);
  }
  sfx.sparkle();
  react('blink');
  say('Say cheese!');
  saveImage(cv, (m.name || 'my-monster').toLowerCase().replace(/[^a-z]+/g, '-'), m.name || 'My monster');
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------
function openPlay(dance) {
  showScreen(null);
  $('#play').classList.remove('hidden');
  playing = true;
  dancing = false;
  $('#play').classList.remove('dancing');
  render();
  showTab(tab, false);
  if (dance) { done(); return; }
  react('bounce');
  say(m.name ? `Hi! I'm ${m.name}!` : 'Build a monster!');
}
function leavePlay() {
  if (dancing) { stopDance(); return; }
  playing = false;
  stopMusic();
  persist();
  $('#play').classList.add('hidden');
  fx.clear();
  buildTitle();
  showScreen('screen-title');
}

let shelfEdit = false;
function buildShelf() {
  const grid = $('#shelf-grid');
  const list = store.data.shelf;
  $('#shelf-edit').classList.toggle('hidden', !list.length);
  $('#shelf-edit').classList.toggle('on', shelfEdit);
  grid.classList.toggle('editing', shelfEdit);
  let html = `<button class="shelf-tile new-tile" data-action="new" aria-label="New monster"><span class="new-plus">➕</span><span class="shelf-name">New</span></button>`;
  list.forEach((mm, i) => {
    html += `<button class="shelf-tile" data-action="shelf-open" data-i="${i}" aria-label="${mm.name}">` +
      `${monsterSVG(mm)}<span class="shelf-name">${mm.name}</span><span class="shelf-x">✖</span></button>`;
  });
  grid.innerHTML = html;
}
function openShelf() {
  shelfEdit = false;
  buildShelf();
  showScreen('screen-shelf');
  say(store.data.shelf.length ? 'My monsters!' : 'No monsters yet. Make one!');
}
function buildTitle() {
  $('#title-mon').innerHTML = monsterSVG(m);
}

function newMonster() {
  m = randomMonster();
  persist();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
buildTabs();
buildTitle();

boot({
  party: PARTY,
  onAction(action, el) {
    switch (action) {
      case 'build': openPlay(false); break;
      case 'shelf': openShelf(); break;
      case 'home': showScreen('screen-title'); buildTitle(); break;
      case 'back': leavePlay(); break;
      case 'title-giggle':
        giggle();
        replayClass($('#title-mon'), 'wiggle');
        break;
      case 'tab':
        sfx.pick(TABS.indexOf(tabOf(el.dataset.tab)));
        showTab(el.dataset.tab, true);
        replayClass(el, 'bounce');
        break;
      case 'opt': choose(+el.dataset.i); replayClass(el, 'bounce'); break;
      case 'prev':
      case 'next': {
        const dir = action === 'next' ? 1 : -1;
        replayClass(el, 'bounce');
        if (tab === 'paint') {
          store.data.brush = (store.data.brush + dir + COLORS.length) % COLORS.length;
          sfx.pick(store.data.brush);
          paintAll();
          buildPaint();
        } else choose(m[tab] + dir, true);
        break;
      }
      case 'color': {
        const i = +el.dataset.i;
        store.data.brush = i;
        store.persist();
        sfx.pick(i);
        paintPart(store.data.target || 'body');
        buildPaint();
        say(COLOR_NAMES[i]);
        break;
      }
      case 'pattern':
        m.pattern = el.dataset.key;
        render();
        persist();
        buildPaint();
        sfx.splash(1.3);
        react('wiggle');
        say(PATTERNS.filter((p) => p.key === m.pattern)[0].name);
        break;
      case 'paint-all': paintAll(); break;
      case 'surprise': replayClass(el, 'wiggle'); surprise(); break;
      case 'done': done(); break;
      case 'again': A.cheerT = -9; fx.confetti(60); startMusic(); break;
      case 'edit': stopDance(); say('Change it up!'); break;
      case 'new':
        if (dancing) stopDance();
        newMonster();
        if (!playing) openPlay(false);
        else { render(); showTab(tab, false); react('spin'); sfx.whoosh(); say('A new monster!'); }
        break;
      case 'rename': rename(); break;
      case 'save': savePicture(); break;
      case 'shelf-edit':
        shelfEdit = !shelfEdit;
        buildShelf();
        break;
      case 'shelf-open': {
        const i = +el.dataset.i;
        if (shelfEdit) {
          store.data.shelf.splice(i, 1);
          store.persist();
          sfx.whoosh();
          const c = centerOf(el);
          fx.burst(c.x, c.y);
          if (!store.data.shelf.length) shelfEdit = false;
          buildShelf();
          break;
        }
        m = cleanMonster(store.data.shelf[i]);
        persist();
        openPlay(true);
        break;
      }
    }
  },
  onBack(screen) {
    if (screen === null && playing) { leavePlay(); return true; }
    if (screen === 'screen-shelf') { showScreen('screen-title'); return true; }
    return false;
  },
  onFrame(dt, t) {
    animate(t);
    danceFrame();
  },
});

// a little hook for automated tests
window.__monster = {
  get m() { return m; },
  get dancing() { return dancing; },
  beat: () => beatNow(),
  layout: () => layout(m),
  store,
};
