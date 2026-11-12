// Car Wash: a muddy vehicle (or pet) drives in; soap it, rinse it, dry it and
// make it shine, then decorate it and wave it goodbye.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import {
  boot, $, $$, fx, showScreen, celebrate, onPointer, createStore, replayClass, pickOne, wait, rand,
  saveImage, DPR,
} from '../../shared/js/kit.js';
import { INK } from '../../shared/js/pictures.js';
import { earnSticker } from '../../shared/js/rewards.js';
import { addArt } from '../../shared/js/gallery.js';
import { VEHICLES, VW, VH, vehicleMarkup } from './vehicles.js';
import { createWash } from './wash.js';

const store = createStore('carwash', { washed: {}, total: 0 });

const STEPS = [
  {
    id: 'soap', tap: 'Tap the sponge!', icon: '🧽', name: 'Soap', R: 34,
    start: 'Soap time! Rub rub rub!',
    rub: ['Scrub scrub!', 'Rub a dub dub!', 'Bubbles!', 'Squeaky clean!'],
    pet: ['Hee hee! That tickles!', 'Scrub scrub!', 'Bubbles!'],
    done: 'So bubbly!', next: 'Now rinse it off!',
  },
  {
    id: 'rinse', tap: 'Tap the shower!', icon: '🚿', name: 'Rinse', R: 34,
    start: 'Rinse time! Splash!',
    rub: ['Splish splash!', 'Bye bye mud!', 'Whoosh!'],
    pet: ['Splish splash!', 'Hee hee!', 'Bye bye mud!'],
    done: 'All clean!', next: 'Now dry it!',
  },
  {
    id: 'dry', tap: 'Tap the blower!', icon: '🌬️', name: 'Dry', R: 40,
    start: 'Dry time! Whoosh!',
    rub: ['Whoosh!', 'Blow blow!', 'Brrr!'],
    pet: ['Whoosh!', 'So fluffy!', 'Brrr!'],
    done: 'All dry!', next: 'Now make it shine!',
  },
  {
    id: 'shine', tap: 'Tap the sparkles!', icon: '✨', name: 'Shine', R: 36,
    start: 'Make it shine!',
    rub: ['Sparkle sparkle!', 'Shiny!', 'Ooh, sparkly!'],
    pet: ['Sparkle sparkle!', 'So pretty!'],
    done: 'So shiny!', next: 'Make it pretty, or tap the flag to go!',
  },
];
const STEP_BY_ID = {};
STEPS.forEach((s) => { STEP_BY_ID[s.id] = s; });

const PAINTS = [
  { hex: '#ff4d5e', name: 'Red' }, { hex: '#ffd93b', name: 'Yellow' }, { hex: '#5cd65c', name: 'Green' },
  { hex: '#3d7bff', name: 'Blue' }, { hex: '#9d5cff', name: 'Purple' }, { hex: '#ff7ac6', name: 'Pink' },
];
const STICKERS = ['⭐', '❤️', '🌈', '🌸', '⚡', '🎀'];
const CHEERS = ['Wow!', 'Sparkly clean!', 'Beautiful!', 'Super shiny!', 'All clean!', 'Great job!'];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const C = {
  vi: 0,
  v: VEHICLES[0],
  on: false,
  phase: 'off', // 'in' (driving in), 'wash', 'out' (driving away), 'off'
  tool: 'soap',
  done: {},
  ptr: null,
  last: null,
  eyes: [],
  wheels: [],
  look: null,
  drive: null,
  sheen: -1,
  blink: 3,
  blinking: 0,
  sticker: 0,
  paint: null,
  pop: null,
  lastSound: 0,
  lastSay: 0,
  lastNudge: 0,
  ready: false,
  token: 0,
};

const bay = $('#bay');
const rig = $('#rig');
const veh = $('#veh');
const art = $('#veh-art');
const stickersG = $('#veh-stickers');
const grime = $('#grime');
const spray = $('#spray');
const sx = spray.getContext('2d');
const toolEl = $('#tool');
const W = createWash(grime);

const SVGNS = 'http://www.w3.org/2000/svg';
const svgUri = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);

// ---------------------------------------------------------------------------
// Little drawings: the tools under the finger
// ---------------------------------------------------------------------------
const TOOLS = {
  soap: { w: 96, h: 96, hx: 48, hy: 52, svg: `<svg viewBox="0 0 96 96"><g transform="rotate(-12 48 50)" stroke="${INK}" stroke-width="4" stroke-linejoin="round">
    <rect x="14" y="30" width="68" height="44" rx="14" fill="#ffd93b"/>
    <path d="M14 44V40Q14 30 28 30H68Q82 30 82 40V44Z" fill="#5cd65c"/>
    <g fill="#e8a91c" stroke="none"><circle cx="30" cy="56" r="4"/><circle cx="48" cy="62" r="3"/><circle cx="64" cy="54" r="4.5"/><circle cx="40" cy="66" r="2.5"/></g></g>
    <g fill="#fff" stroke="#8cb9eb" stroke-width="2.5"><circle cx="18" cy="24" r="8"/><circle cx="80" cy="20" r="6"/><circle cx="84" cy="80" r="7"/></g></svg>` },
  rinse: { w: 120, h: 120, hx: 30, hy: 88, svg: `<svg viewBox="0 0 120 120">
    <path d="M70 46L18 74Q30 96 44 104Z" fill="#8fdcff" opacity=".75"/>
    <g fill="#fff"><circle cx="34" cy="86" r="4"/><circle cx="46" cy="76" r="3"/><circle cx="28" cy="98" r="3"/><circle cx="52" cy="90" r="2.5"/></g>
    <g stroke="${INK}" stroke-width="4" stroke-linejoin="round">
    <path d="M86 26L104 58Q108 66 100 70L94 72L80 46Z" fill="#3d7bff"/>
    <path d="M64 30H96Q104 30 104 38V42Q104 50 96 50H64Q58 50 58 44V36Q58 30 64 30Z" fill="#ff4d5e"/>
    <rect x="52" y="34" width="10" height="12" rx="3" fill="#b3b9c6"/>
    <path d="M100 30Q108 14 118 12" fill="none" stroke="#2f8cff" stroke-width="9" stroke-linecap="round"/></g></svg>` },
  dry: { w: 120, h: 120, hx: 30, hy: 86, svg: `<svg viewBox="0 0 120 120">
    <g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9">
    <path d="M54 62Q44 70 30 74"/><path d="M60 72Q50 84 38 92"/><path d="M48 54Q36 56 22 60"/></g>
    <g stroke="${INK}" stroke-width="4" stroke-linejoin="round">
    <path d="M88 52L98 92Q100 100 92 102L86 103Q80 103 80 96L76 58Z" fill="#9d5cff"/>
    <path d="M58 36Q60 22 80 20Q104 20 106 42Q106 62 84 64Q66 64 58 52Z" fill="#ff7ac6"/>
    <path d="M58 36L46 40Q42 44 46 50L58 52Z" fill="#b3b9c6"/>
    <circle cx="84" cy="42" r="10" fill="#fff"/><circle cx="84" cy="42" r="4" fill="${INK}" stroke="none"/></g></svg>` },
  shine: { w: 100, h: 100, hx: 50, hy: 56, svg: `<svg viewBox="0 0 100 100">
    <path d="M20 44Q28 26 50 30Q76 26 82 46Q88 68 66 74Q46 82 30 72Q12 62 20 44Z" fill="#8fdcff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M30 50Q44 44 58 52M36 62Q50 56 66 62" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>
    <path d="M78 10Q78 22 90 22Q78 22 78 34Q78 22 66 22Q78 22 78 10Z" fill="#ffd93b" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M18 12Q18 19 25 19Q18 19 18 26Q18 19 11 19Q18 19 18 12Z" fill="#fff"/></svg>` },
};

// ---------------------------------------------------------------------------
// Title and picker
// ---------------------------------------------------------------------------
function thumbSvg(v, happy) {
  let m = vehicleMarkup(v);
  if (happy) {
    m = m.replace(/class="happy" style="display:none"/g, 'class="happy"')
      .replace(/<circle class="sclera"[^>]*\/>/g, (s) => s.replace('fill="#fff"', 'fill="#fff" opacity="0"').replace(/stroke-width="5"/, 'stroke-width="0"'))
      .replace(/<g class="pupil">/g, '<g class="pupil" style="display:none">');
  }
  return `<svg viewBox="0 0 ${VW} ${VH}" class="vthumb" aria-hidden="true">${m}</svg>`;
}

function buildMascot() {
  const bubbles = [[40, 60, 18], [360, 40, 14], [380, 120, 10], [20, 150, 12], [300, 20, 9]]
    .map((b) => `<circle cx="${b[0]}" cy="${b[1]}" r="${b[2]}" fill="rgba(255,255,255,.55)" stroke="#fff" stroke-width="3"/><circle cx="${b[0] - b[2] * 0.35}" cy="${b[1] - b[2] * 0.35}" r="${b[2] * 0.25}" fill="#fff"/>`).join('');
  $('#mascot').innerHTML = `<svg viewBox="-10 -10 420 280" aria-hidden="true">${bubbles}${thumbSvg(VEHICLES[0], true).replace(/^<svg[^>]*>|<\/svg>$/g, '')}
    <path d="M20 248H380" stroke="rgba(255,255,255,.7)" stroke-width="6" stroke-linecap="round"/></svg>`;
}

function updateTitle() {
  $('#title-count').textContent = store.data.total ? `🚿 ${store.data.total}` : '';
}

function buildPicker() {
  const colors = ['blue', 'red', 'yellow', 'purple', 'green', 'orange', 'teal', 'pink'];
  $('#veh-grid').innerHTML = VEHICLES.map((v, i) => {
    const n = store.data.washed[v.id] || 0;
    return `<button class="tile vtile ${colors[i % colors.length]}" data-action="open" data-i="${i}" aria-label="${v.name}" style="animation-delay:${i * 0.04}s">
      ${v.kind === 'pet' ? '<span class="pet-badge">🐾</span>' : ''}
      <span class="vt-art">${thumbSvg(v)}</span>
      <span class="tile-name">${v.name}</span>
      <span class="vt-count">${n ? `✨ ${n}` : '&nbsp;'}</span></button>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// Dock and tray
// ---------------------------------------------------------------------------
function buildDock() {
  let h = '';
  STEPS.forEach((s) => {
    h += `<button class="tool-btn" data-action="tool" data-tool="${s.id}" data-quiet aria-label="${s.name}">
      <span class="t-ico">${s.icon}</span><span class="t-bar"><i></i></span><span class="t-check">✓</span></button>`;
  });
  h += '<button class="tool-btn" data-action="tool" data-tool="decor" data-quiet aria-label="Decorate"><span class="t-ico">🎨</span></button>';
  h += '<button class="tool-btn go-btn" data-action="go" data-quiet aria-label="All done, drive away"><span class="t-ico">🏁</span></button>';
  $('#dock').innerHTML = h;
  $('#tray-paint').innerHTML = PAINTS.map((p, i) =>
    `<button class="swatch" data-action="paint" data-quiet data-i="${i}" aria-label="${p.name}" style="--c:${p.hex}"></button>`).join('');
  $('#tray-stickers').innerHTML = STICKERS.map((s, i) =>
    `<button class="stk" data-action="sticker" data-quiet data-i="${i}" aria-label="Sticker">${s}</button>`).join('');
}

function stepIndex(id) {
  for (let i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) return i;
  return STEPS.length;
}
/** The first step that is not done yet (or the decorate step). */
function needed() {
  for (let i = 0; i < STEPS.length; i++) if (!C.done[STEPS[i].id]) return STEPS[i].id;
  return 'decor';
}
function unlocked(id) {
  if (id === 'go') return !!C.done.shine;
  return stepIndex(id) <= stepIndex(needed());
}

function updateDock() {
  $$('#dock .tool-btn').forEach((b) => {
    const id = b.dataset.tool || 'go';
    b.classList.toggle('on', id === C.tool);
    b.classList.toggle('locked', !unlocked(id));
    b.classList.toggle('done', !!C.done[id]);
    const bar = b.querySelector('.t-bar i');
    if (bar && W.total) bar.style.width = `${Math.round(Math.min(1, C.done[id] ? 1 : W.progress(id) / 0.85) * 100)}%`;
  });
  $('#tray').classList.toggle('hidden', C.tool !== 'decor');
  $$('#tray-stickers .stk').forEach((b, i) => b.classList.toggle('on', i === C.sticker));
  $$('#tray-paint .swatch').forEach((b) => b.classList.toggle('on', PAINTS[+b.dataset.i].hex === C.paint));
}
function updateBar(id) {
  const b = $(`#dock [data-tool="${id}"] .t-bar i`);
  if (b) b.style.width = `${Math.round(Math.min(1, W.progress(id) / 0.85) * 100)}%`;
}

function nudge(id) {
  $$('#dock .tool-btn').forEach((b) => b.classList.toggle('nudge', (b.dataset.tool || 'go') === id));
}

function selectTool(id) {
  if (!C.on || C.phase !== 'wash') return;
  if (!unlocked(id)) {
    sfx.boing();
    replayClass($(`#dock [data-tool="${id}"]`), 'wiggle');
    const need = needed();
    nudge(need);
    say(STEP_BY_ID[need] ? STEP_BY_ID[need].tap : 'Make it pretty!');
    return;
  }
  C.tool = id;
  sfx.pick(stepIndex(id) * 2);
  const btn = $(`#dock [data-tool="${id}"]`);
  replayClass(btn, 'bounce');
  btn.classList.remove('nudge');
  if (id === 'decor') {
    say('Make it pretty!');
  } else if (!C.done[id]) {
    say(STEP_BY_ID[id].start);
  }
  updateDock();
  if (id === 'decor' || C.done.shine) nudge(id === 'decor' ? 'go' : '');
  requestAnimationFrame(layout);
}

// ---------------------------------------------------------------------------
// Starting a wash
// ---------------------------------------------------------------------------
function startWash(i) {
  C.token++;
  const tk = C.token;
  C.vi = ((i % VEHICLES.length) + VEHICLES.length) % VEHICLES.length;
  C.v = VEHICLES[C.vi];
  C.paint = C.v.paint;
  C.done = {};
  C.tool = 'soap';
  C.ptr = null;
  C.look = null;
  C.sheen = -1;
  C.pop = null;
  C.ready = false;
  C.phase = 'in';
  art.innerHTML = vehicleMarkup(C.v);
  stickersG.innerHTML = '';
  C.eyes = $$('.eye', art).map((e) => ({
    el: e, pupil: $('.pupil', e), x: +e.dataset.x, y: +e.dataset.y, r: +e.dataset.r,
  }));
  C.wheels = $$('.wheel', art).map((w) => ({ el: w, x: +w.dataset.cx, y: +w.dataset.cy }));
  setFace(false);
  grime.getContext('2d').clearRect(0, 0, grime.width, grime.height);
  toolEl.classList.add('hidden');
  particles = [];

  showScreen(null);
  C.on = true;
  $('#play').classList.add('active');
  updateDock();
  nudge('');
  layout();

  // the mud is drawn on canvases sized for this screen, clipped to the vehicle's shape
  const img = new Image();
  img.onload = () => {
    if (tk !== C.token) return;
    const iw = Math.round(Math.min(960, Math.max(520, rig.clientWidth * Math.min(DPR, 1.5))));
    W.init(img, iw, C.eyes);
    C.ready = true;
    updateDock();
  };
  img.src = svgUri(`<svg xmlns="${SVGNS}" viewBox="0 0 ${VW} ${VH}" width="${VW * 2}" height="${VH * 2}">${vehicleMarkup(C.v)}</svg>`);

  // drive (or trot) in
  C.drive = { from: -(bay.clientWidth / 2 + rig.clientWidth), to: 0, t: 0, dur: 1.6, ease: 'out', end: arrived };
  C.look = { x: VW * 3, y: VH * 0.4 };
  if (C.v.kind === 'pet') trot(); else engine();
}

function arrived() {
  C.phase = 'wash';
  C.look = null;
  C.drive = null;
  rig.style.transform = '';
  const tk = C.token;
  say(`Oh no! The ${C.v.name.toLowerCase()} is so muddy!`).then(() => {
    if (tk !== C.token || C.phase !== 'wash') return;
    if (!C.done.soap && C.tool === 'soap') say(STEPS[0].start, { queue: true });
  });
  nudge('soap');
  wiggleMud();
}
function wiggleMud() {
  replayClass(rig, 'shake');
}

// ---------------------------------------------------------------------------
// Faces: eyes follow the sponge, giggle while being scrubbed
// ---------------------------------------------------------------------------
function setFace(giggle, happy) {
  $$('.smile', art).forEach((e) => { e.style.display = giggle ? 'none' : ''; });
  $$('.giggle', art).forEach((e) => { e.style.display = giggle ? '' : 'none'; });
  C.eyes.forEach((e) => {
    e.pupil.style.display = happy ? 'none' : '';
    $('.sclera', e.el).style.display = happy ? 'none' : '';
    $('.happy', e.el).style.display = happy ? '' : 'none';
  });
  C.happy = !!happy;
}

function updateEyes() {
  C.eyes.forEach((e) => {
    let tx = 0;
    let ty = 0;
    if (C.look) {
      const dx = C.look.x - e.x;
      const dy = C.look.y - e.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const off = Math.min(e.r * 0.34, len * 0.12);
      tx = (dx / len) * off;
      ty = (dy / len) * off;
    }
    e.pupil.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)})`);
  });
}

// ---------------------------------------------------------------------------
// Sounds
// ---------------------------------------------------------------------------
function squeak() {
  if (!sfx.ready()) return;
  const f = rand(1300, 2100);
  sfx.tone({ type: 'sine', f0: f, f1: f * 1.4, dur: 0.07, vol: 0.06 });
}
function sprayNoise() {
  if (!sfx.ready()) return;
  sfx.noise({ dur: 0.12, vol: 0.09, freq: rand(3500, 5500) });
}
function blowNoise() {
  if (!sfx.ready()) return;
  sfx.noise({ dur: 0.16, vol: 0.11, freq: rand(700, 1100) });
}
function engine() {
  if (!sfx.ready()) return;
  for (let i = 0; i < 6; i++) sfx.tone({ type: 'triangle', f0: 80 + i * 6, f1: 110 + i * 8, dur: 0.2, vol: 0.09, delay: i * 0.2 });
}
function trot() {
  if (!sfx.ready()) return;
  for (let i = 0; i < 7; i++) sfx.tone({ type: 'sine', f0: 500 + (i % 2) * 120, f1: 380, dur: 0.07, vol: 0.08, delay: i * 0.2 });
}
function honk() {
  if (!sfx.ready()) return;
  const v = C.v;
  if (v.kind === 'pet') {
    sfx.tone({ type: 'triangle', f0: 520, f1: 760, dur: 0.12, vol: 0.18 });
    sfx.tone({ type: 'triangle', f0: 560, f1: 820, dur: 0.12, vol: 0.18, delay: 0.25 });
  } else if (v.id === 'firetruck') {
    for (let i = 0; i < 4; i++) sfx.tone({ type: 'triangle', f0: i % 2 ? 620 : 820, dur: 0.3, vol: 0.14, delay: i * 0.32 });
  } else {
    [0, 0.3].forEach((d) => {
      sfx.tone({ type: 'square', f0: 392, dur: 0.2, vol: 0.07, delay: d });
      sfx.tone({ type: 'square', f0: 494, dur: 0.2, vol: 0.06, delay: d });
    });
  }
}

// ---------------------------------------------------------------------------
// Particles (soap bubbles, water drops) on a canvas over the bay
// ---------------------------------------------------------------------------
let particles = [];
let sprayDirty = false;
let spDpr = 1;
function addP(p) {
  if (particles.length > 160) particles.shift();
  particles.push(p);
}
function stepParticles(dt) {
  if (!particles.length) {
    if (sprayDirty) { sx.clearRect(0, 0, spray.width, spray.height); sprayDirty = false; }
    return;
  }
  sprayDirty = true;
  sx.setTransform(spDpr, 0, 0, spDpr, 0, 0);
  sx.clearRect(0, 0, spray.width / spDpr, spray.height / spDpr);
  for (const p of particles) {
    p.life -= dt;
    if (p.g) p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const k = Math.max(0, p.life / p.max);
    if (p.t === 'bub') {
      p.x += Math.sin(p.life * 9 + p.ph) * 0.6;
      sx.globalAlpha = Math.min(1, k * 2);
      sx.beginPath();
      sx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      sx.fillStyle = 'rgba(255,255,255,.35)';
      sx.fill();
      sx.lineWidth = 2;
      sx.strokeStyle = '#fff';
      sx.stroke();
      sx.beginPath();
      sx.arc(p.x - p.s * 0.35, p.y - p.s * 0.35, p.s * 0.25, 0, Math.PI * 2);
      sx.fillStyle = '#fff';
      sx.fill();
    } else if (p.t === 'drip') {
      sx.globalAlpha = Math.min(1, k * 2) * 0.85;
      sx.fillStyle = '#8fd4ff';
      sx.beginPath();
      sx.ellipse(p.x, p.y, p.s * 0.55, p.s * 1.1, 0, 0, Math.PI * 2);
      sx.fill();
      sx.fillStyle = '#fff';
      sx.beginPath();
      sx.arc(p.x - p.s * 0.15, p.y - p.s * 0.4, p.s * 0.2, 0, Math.PI * 2);
      sx.fill();
    } else {
      sx.globalAlpha = Math.min(1, k * 2);
      sx.fillStyle = p.c || '#6fc8ff';
      sx.beginPath();
      sx.arc(p.x, p.y, p.s * (0.5 + k * 0.5), 0, Math.PI * 2);
      sx.fill();
      sx.fillStyle = 'rgba(255,255,255,.85)';
      sx.beginPath();
      sx.arc(p.x - p.s * 0.25, p.y - p.s * 0.25, p.s * 0.3, 0, Math.PI * 2);
      sx.fill();
    }
  }
  sx.globalAlpha = 1;
  particles = particles.filter((p) => p.life > 0);
}

// ---------------------------------------------------------------------------
// Rubbing
// ---------------------------------------------------------------------------
function toVeh(p) {
  const r = C.rect;
  return { x: ((p.x - r.left) / r.width) * VW, y: ((p.y - r.top) / r.height) * VH };
}

function showTool(p) {
  const t = TOOLS[C.tool];
  if (!t) { toolEl.classList.add('hidden'); return; }
  if (toolEl.dataset.tool !== C.tool) {
    toolEl.dataset.tool = C.tool;
    toolEl.innerHTML = t.svg;
    toolEl.style.width = `${t.w}px`;
    toolEl.style.height = `${t.h}px`;
  }
  toolEl.classList.remove('hidden');
  const tr = `translate3d(${Math.round(p.x - t.hx)}px, ${Math.round(p.y - t.hy)}px, 0)`;
  toolEl.style.webkitTransform = tr;
  toolEl.style.transform = tr;
}

function rubAt(p, first) {
  const step = STEP_BY_ID[C.tool];
  const q = toVeh(p);
  C.look = q;
  updateEyes();
  showTool(p);
  const now = performance.now();
  if (C.done[step.id]) {
    // this step is finished: point at the next tool
    if (now - C.lastNudge > 3500) {
      C.lastNudge = now;
      const need = needed();
      nudge(need === 'decor' ? 'go' : need);
      if (need !== 'decor') say(STEP_BY_ID[need].tap);
      else say('Tap the flag to go!');
    }
    if (step.id === 'shine' && Math.random() < 0.3) fx.sparkle(p.x, p.y);
    return;
  }
  // stamp along the way from the last spot, so fast swipes leave no gaps
  const from = first || !C.last ? q : C.last;
  const dx = q.x - from.x;
  const dy = q.y - from.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  const n = Math.max(1, Math.ceil(d / (step.R * 0.45)));
  let rect = null;
  let hit = false;
  for (let i = 1; i <= n; i++) {
    const x = from.x + (dx * i) / n;
    const y = from.y + (dy * i) / n;
    if (x < -step.R || y < -step.R || x > VW + step.R || y > VH + step.R) continue;
    if (W.onVehicle(x, y)) hit = true;
    const r = W.stamp(step.id, x, y, step.R);
    rect = rect ? union(rect, r) : r;
  }
  C.last = q;
  if (rect) W.compose(rect);
  if (hit) {
    effects(step.id, p, now);
    if (now - C.lastSay > 5200) {
      C.lastSay = now;
      say(pickOne(C.v.kind === 'pet' ? step.pet : step.rub));
    }
  }
  updateBar(step.id);
  if (W.progress(step.id) >= 0.85) completeStep(step.id);
}

function union(a, b) {
  const x = Math.min(a[0], b[0]);
  const y = Math.min(a[1], b[1]);
  return [x, y, Math.max(a[0] + a[2], b[0] + b[2]) - x, Math.max(a[1] + a[3], b[1] + b[3]) - y];
}

function effects(id, p, now) {
  const gap = now - C.lastSound;
  if (id === 'soap') {
    if (gap > 90) { C.lastSound = now; squeak(); }
    if (Math.random() < 0.5) {
      addP({ t: 'bub', x: p.x + rand(-24, 24), y: p.y + rand(-20, 10), vx: rand(-15, 15), vy: rand(-90, -40), s: rand(5, 12), life: rand(0.8, 1.4), max: 1.4, ph: rand(0, 6) });
    }
  } else if (id === 'rinse') {
    if (gap > 75) { C.lastSound = now; sprayNoise(); }
    for (let i = 0; i < 2; i++) {
      addP({ t: 'drop', x: p.x + rand(-10, 10), y: p.y + rand(-6, 6), vx: rand(-140, 140), vy: rand(-180, -40), g: 900, s: rand(3, 6), life: rand(0.4, 0.7), max: 0.7 });
    }
    if (Math.random() < 0.6) {
      addP({ t: 'drip', x: p.x + rand(-26, 26), y: p.y + rand(0, 16), vx: 0, vy: rand(55, 110), s: rand(4, 7), life: rand(0.7, 1.1), max: 1.1 });
    }
  } else if (id === 'dry') {
    if (gap > 120) { C.lastSound = now; blowNoise(); }
    for (let i = 0; i < 2; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(260, 420);
      addP({ t: 'drop', x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, s: rand(2.5, 5), life: rand(0.35, 0.6), max: 0.6, c: '#9fdcff' });
    }
  } else if (id === 'shine') {
    if (gap > 110) { C.lastSound = now; sfx.shimmer(); }
    if (Math.random() < 0.5) fx.sparkle(p.x + rand(-20, 20), p.y + rand(-20, 20));
  }
}

function completeStep(id) {
  if (C.done[id]) return;
  C.done[id] = true;
  W.finishStep(id);
  const step = STEP_BY_ID[id];
  sfx.chime([0, 4, 7, 12], 660, 0.08);
  const r = rig.getBoundingClientRect();
  fx.sparkles(r.left + r.width / 2, r.top + r.height / 2, 12, Math.min(r.width, 300) / 2.4);
  if (id === 'rinse') {
    for (let i = 0; i < 14; i++) {
      addP({ t: 'drip', x: r.left + rand(0.1, 0.9) * r.width, y: r.top + rand(0.3, 0.7) * r.height, vx: 0, vy: rand(60, 120), s: rand(4, 7), life: rand(0.8, 1.3), max: 1.3 });
    }
  }
  if (id === 'shine') C.sheen = 0;
  const tk = C.token;
  setFace(true, true);
  setTimeout(() => { if (tk === C.token && C.phase === 'wash') setFace(C.ptr !== null, false); }, 1300);
  updateDock();
  const need = needed();
  nudge(need === 'decor' ? 'go' : need);
  if (need === 'decor') $(`#dock [data-tool="decor"]`).classList.add('nudge');
  say(step.done).then(() => {
    if (tk === C.token && C.phase === 'wash') say(step.next, { queue: true });
  });
}

// ---------------------------------------------------------------------------
// Decorating
// ---------------------------------------------------------------------------
function setPaint(hex) {
  C.paint = hex;
  $$('.paint', art).forEach((e) => e.setAttribute('fill', hex));
  $$('.paint-s', art).forEach((e) => e.setAttribute('stroke', hex));
  updateDock();
}
function placeSticker(q) {
  const ch = STICKERS[C.sticker];
  const t = document.createElementNS(SVGNS, 'text');
  t.setAttribute('x', q.x.toFixed(1));
  t.setAttribute('y', q.y.toFixed(1));
  t.setAttribute('font-size', '10');
  t.setAttribute('text-anchor', 'middle');
  t.setAttribute('dominant-baseline', 'central');
  t.textContent = ch;
  stickersG.appendChild(t);
  while (stickersG.childNodes.length > 14) stickersG.removeChild(stickersG.firstChild);
  C.pop = { el: t, t: 0 };
  sfx.pop(1.2);
  fx.sparkles(C.rect.left + (q.x / VW) * C.rect.width, C.rect.top + (q.y / VH) * C.rect.height, 6, 26);
}

// ---------------------------------------------------------------------------
// All done: beam, honk, drive away
// ---------------------------------------------------------------------------
async function finishWash() {
  if (C.phase !== 'wash') return;
  if (!C.done.shine) {
    sfx.boing();
    replayClass($('#dock .go-btn'), 'wiggle');
    const need = needed();
    nudge(need);
    say(STEP_BY_ID[need].tap);
    return;
  }
  const tk = C.token;
  C.phase = 'out';
  C.ptr = null;
  toolEl.classList.add('hidden');
  nudge('');
  setFace(true, true);
  C.look = null;
  updateEyes();
  sfx.sparkle();
  const r = rig.getBoundingClientRect();
  fx.sparkles(r.left + r.width / 2, r.top + r.height / 2, 14, Math.min(r.width, 320) / 2.2);
  replayClass(rig, 'beam');
  await wait(400);
  if (tk !== C.token) return;
  honk();
  say(C.v.thanks);
  store.data.washed[C.v.id] = (store.data.washed[C.v.id] || 0) + 1;
  store.data.total = (store.data.total || 0) + 1;
  store.persist();
  await wait(1300);
  if (tk !== C.token) return;
  $('#done-thumb').innerHTML = `<svg viewBox="0 0 ${VW} ${VH}">${art.innerHTML}${stickersG.outerHTML}</svg>`;
  C.drive = { from: 0, to: bay.clientWidth / 2 + rig.clientWidth * 1.2, t: 0, dur: 1.5, ease: 'in', end: null };
  if (C.v.kind === 'pet') trot(); else engine();
  sfx.whoosh();
  celebrate(pickOne(CHEERS), C.v.name);
  earnSticker('carwash');
  await wait(2000);
  if (tk !== C.token) return;
  C.drive = null;
  $('#done-title').textContent = 'All clean!';
  showScreen('screen-done');
  say('All clean!', { queue: true });
}

// ---------------------------------------------------------------------------
// Saving a picture
// ---------------------------------------------------------------------------
async function photo() {
  const PW = 900;
  const PH = 600;
  const cv = document.createElement('canvas');
  cv.width = PW;
  cv.height = PH;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, PH);
  g.addColorStop(0, '#9fe3ff');
  g.addColorStop(0.72, '#e6f8ff');
  c.fillStyle = g;
  c.fillRect(0, 0, PW, PH);
  c.strokeStyle = 'rgba(255,255,255,.7)';
  c.lineWidth = 3;
  for (let y = 40; y < PH * 0.76; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(PW, y); c.stroke(); }
  for (let x = 30; x < PW; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, PH * 0.76); c.stroke(); }
  c.fillStyle = '#8fa6c4';
  c.fillRect(0, PH * 0.76, PW, PH * 0.24);
  c.fillStyle = '#a9bfdb';
  c.fillRect(0, PH * 0.76, PW, 14);
  const bub = [[90, 110, 30], [810, 90, 22], [760, 200, 14], [140, 240, 16], [470, 60, 18]];
  bub.forEach((b) => {
    c.beginPath(); c.arc(b[0], b[1], b[2], 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,.45)'; c.fill();
    c.lineWidth = 4; c.strokeStyle = '#fff'; c.stroke();
  });
  const vw = 780;
  const vh = (vw * VH) / VW;
  const vx = (PW - vw) / 2;
  const vy = PH * 0.76 + 28 - (vh * 244) / VH;
  try {
    const clone = veh.cloneNode(true);
    clone.setAttribute('width', VW * 2);
    clone.setAttribute('height', VH * 2);
    clone.removeAttribute('class');
    const str = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = svgUri(str); });
    c.fillStyle = 'rgba(40,30,70,.18)';
    c.beginPath();
    c.ellipse(PW / 2, PH * 0.76 + 30, vw * 0.42, 16, 0, 0, Math.PI * 2);
    c.fill();
    c.drawImage(img, vx, vy, vw, vh);
    if (W.iw) c.drawImage(grime, vx, vy, vw, vh);
  } catch (err) { /* save the background at least */ }
  try { addArt(cv, { game: 'carwash', title: C.v.name }); } catch (err) { /* ignore */ }
  saveImage(cv, `my-${C.v.id}`, `My ${C.v.name}`);
}

// ---------------------------------------------------------------------------
// Pointer
// ---------------------------------------------------------------------------
onPointer(bay, {
  down(p) {
    if (!C.on || C.phase !== 'wash' || C.ptr !== null) return false;
    C.rect = rig.getBoundingClientRect();
    if (C.tool === 'decor') {
      const q = toVeh(p);
      if (q.x >= 0 && q.y >= 0 && q.x <= VW && q.y <= VH && (W.onVehicle(q.x, q.y) || !C.ready)) placeSticker(q);
      else sfx.click();
      return false;
    }
    if (!C.ready) return false;
    C.ptr = p.id;
    C.last = null;
    setFace(true, C.happy && false);
    rubAt(p, true);
    return true;
  },
  move(p) {
    if (p.id !== C.ptr) return;
    rubAt(p, false);
  },
  up(p) {
    if (p.id !== C.ptr) return;
    C.ptr = null;
    C.last = null;
    C.look = null;
    updateEyes();
    toolEl.classList.add('hidden');
    if (C.phase === 'wash') setFace(false, false);
  },
});

// ---------------------------------------------------------------------------
// Every frame (only while washing)
// ---------------------------------------------------------------------------
function frame(dt) {
  if (!C.on) return;
  stepParticles(dt);
  if (C.drive) {
    const d = C.drive;
    d.t = Math.min(1, d.t + dt / d.dur);
    const e = d.ease === 'out' ? 1 - Math.pow(1 - d.t, 3) : d.t * d.t;
    const x = d.from + (d.to - d.from) * e;
    const hop = C.v.kind === 'pet' ? -Math.abs(Math.sin(d.t * Math.PI * 6)) * 12 * (1 - e * 0.3) : 0;
    const tr = `translate3d(${x.toFixed(1)}px, ${hop.toFixed(1)}px, 0)`;
    rig.style.webkitTransform = tr;
    rig.style.transform = tr;
    // wheels roll with the distance travelled
    const unitPx = rig.clientWidth / VW;
    C.wheels.forEach((w) => {
      const r = +w.el.firstChild.getAttribute('r');
      const ang = (x / unitPx / r) * (180 / Math.PI);
      w.el.setAttribute('transform', `rotate(${ang.toFixed(1)} ${w.x} ${w.y})`);
    });
    updateEyes();
    if (d.t >= 1) {
      const end = d.end;
      if (end) end();
    }
  }
  if (C.sheen >= 0) {
    C.sheen += dt / 1.1;
    if (C.sheen >= 1) { C.sheen = -1; W.compose(); } else W.compose(null, C.sheen);
  }
  if (C.pop) {
    C.pop.t = Math.min(1, C.pop.t + dt / 0.3);
    const k = C.pop.t;
    const s = 10 + 40 * (1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2));
    C.pop.el.setAttribute('font-size', s.toFixed(1));
    if (k >= 1) C.pop = null;
  }
  // a gentle reminder after a quiet while
  if (C.phase === 'wash' && C.ptr === null && C.ready) {
    C.idle = (C.idle || 0) + dt;
    if (C.idle > 9) {
      C.idle = 0;
      const need = needed();
      if (need !== 'decor') {
        nudge(need);
        say(C.tool === need ? STEP_BY_ID[need].start : STEP_BY_ID[need].tap);
      } else if (C.tool !== 'decor') {
        nudge('go');
      }
    }
  } else C.idle = 0;
  // blink now and then
  if (!C.happy && C.eyes.length) {
    C.blink -= dt;
    if (C.blink <= 0 && !C.blinking) {
      C.blinking = 0.14;
      C.eyes.forEach((e) => e.el.setAttribute('transform', `translate(0 ${e.y}) scale(1 0.1) translate(0 ${-e.y})`));
    }
    if (C.blinking) {
      C.blinking -= dt;
      if (C.blinking <= 0) {
        C.blinking = 0;
        C.blink = rand(2.5, 5.5);
        C.eyes.forEach((e) => e.el.removeAttribute('transform'));
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Leaving, layout
// ---------------------------------------------------------------------------
function leavePlay() {
  C.token++;
  C.on = false;
  C.phase = 'off';
  C.ptr = null;
  C.drive = null;
  particles = [];
  sx.setTransform(1, 0, 0, 1, 0, 0);
  sx.clearRect(0, 0, spray.width, spray.height);
  toolEl.classList.add('hidden');
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
  if (!C.on) return;
  // the bay is never much taller than wide (no big empty wall on tall phones)
  const st = $('#stage');
  bay.style.height = `${Math.round(Math.min(st.clientHeight, Math.max(260, Math.min(st.clientWidth, 980) * 0.92)))}px`;
  const bw = bay.clientWidth;
  const bh = bay.clientHeight;
  const floor = bh * 0.2;
  let rw = Math.min(bw * 0.94, ((bh - floor * 0.5) * 0.84 * VW) / VH, 900);
  rw = Math.max(200, rw);
  const rh = (rw * VH) / VW;
  rig.style.width = `${Math.round(rw)}px`;
  rig.style.height = `${Math.round(rh)}px`;
  rig.style.left = `${Math.round((bw - rw) / 2)}px`;
  // the wheels stand on the floor line
  const groundY = bh - floor * 0.55;
  rig.style.top = `${Math.round(groundY - (rh * 244) / VH)}px`;
  // the particle canvas covers the whole screen
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  spDpr = Math.max(1, Math.min(DPR, Math.sqrt(1500000 / (sw * sh))));
  spray.width = Math.round(sw * spDpr);
  spray.height = Math.round(sh * spDpr);
  sprayDirty = true;
  C.rect = rig.getBoundingClientRect();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
buildMascot();
buildDock();
updateTitle();

boot({
  party: ['#5ec8ff', '#7b8cff', '#ff8fd2'],
  onAction(action, elx) {
    switch (action) {
      case 'picker': toPicker(); say("Who's muddy?"); break;
      case 'title': toTitle(); break;
      case 'surprise': startWash(Math.floor(Math.random() * VEHICLES.length)); break;
      case 'open': startWash(+elx.dataset.i); break;
      case 'back': toPicker(); break;
      case 'again': startWash(C.vi); break;
      case 'tool': selectTool(elx.dataset.tool); break;
      case 'go': finishWash(); break;
      case 'photo': sfx.click(); photo(); break;
      case 'paint': {
        const p = PAINTS[+elx.dataset.i];
        setPaint(p.hex);
        sfx.splash();
        replayClass(elx, 'bounce');
        say(p.name);
        break;
      }
      case 'sticker':
        C.sticker = +elx.dataset.i;
        sfx.pick(C.sticker);
        replayClass(elx, 'bounce');
        updateDock();
        break;
    }
  },
  onBack(screen) {
    if (screen === 'screen-done' || (screen === null && C.on)) { toPicker(); return true; }
    if (screen === 'screen-picker') { toTitle(); return true; }
    return false;
  },
  onFrame(dt) { frame(dt); },
  onResize() {
    if (C.on) requestAnimationFrame(layout);
  },
});

// For automated tests
window.__carwash = {
  C,
  W,
  store,
  VEHICLES,
  start(id) {
    let i = 0;
    VEHICLES.forEach((v, k) => { if (v.id === id) i = k; });
    startWash(i);
  },
  /** screen point of a spot on the vehicle (vehicle units) */
  at(x, y) {
    const r = rig.getBoundingClientRect();
    return { x: r.left + (x / VW) * r.width, y: r.top + (y / VH) * r.height };
  },
  inside() {
    const out = [];
    for (let c = 0; c < W.inside.length; c++) if (W.inside[c]) out.push({ x: ((c % 40) + 0.5) * 10, y: (Math.floor(c / 40) + 0.5) * 10 });
    return out;
  },
};
