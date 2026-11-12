// The game kit: everything the games in this collection have in common, so each
// game file only holds its own game. Read shared/README.md for a walkthrough.
//
//   import { boot, fx, showScreen, banner, celebrate, onPointer, ... } from '../../shared/js/kit.js';
//
//   boot({
//     party: ['#ff6fb5', '#c27bff', '#6fc8ff'],  // Paint Party world colors for this game
//     onFrame(dt, t) {},                         // called every animation frame
//     onResize(W, H) {},                         // after the screen size changes
//     onAction(action, el, event) {},            // a tap on any [data-action] element
//     onBack(screenId) { return true; },         // Android back / browser back; false = default
//     hub: true,                                 // only for the game list page at the root
//   });
//
// What boot() adds to the page (no markup needed): the animated background world
// (#bg), the effects layer (#fx), the banner, the "save on older iPads" card, and
// sound/speech unlocking on the first tap.

import * as sfx from './audio.js';
import { SCENES, paintScene, createAnimator } from './scenes.js';
import { unlockSpeech, setSpeechMuted } from './speech.js';
import { createStore } from './store.js';
import { startGrownups } from './grownups.js';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
export const $ = (s, root) => (root || document).querySelector(s);
export const $$ = (s, root) => Array.prototype.slice.call((root || document).querySelectorAll(s));
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
export function vibrate(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch (err) { /* ignore */ }
}
export const IS_IOS = /iP(ad|hone|od)/.test(navigator.platform) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const FONT = 'Fredoka, ui-rounded, system-ui, sans-serif';

/** Wait a little (for sequencing animations). */
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Easing helpers for hand-rolled animations. */
export const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
};

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------
// createStore lives in store.js (no side effects, so pages without the kit can use it too).
export { createStore };

/** Settings every game shares: sound on/off and the background world. */
export const settings = createStore('settings', { muted: false, scene: 'party' });
if (!SCENES.some((sc) => sc.id === settings.data.scene)) settings.data.scene = 'party';

/** The coloring game's save, so other games can use the kids' own colored pictures. */
export function coloringSave() {
  try {
    const s = JSON.parse(localStorage.getItem('color-splash-party.v1'));
    if (s && typeof s === 'object') return s;
  } catch (err) { /* ignore */ }
  return null;
}

// ---------------------------------------------------------------------------
// Canvases: background world behind, effects in front
// ---------------------------------------------------------------------------
let opts = {};
let bg, bgx, fadeCv, fadeX, an, anx, fxc, fxx;
export let W = 0;
export let H = 0;
/** 1 on a ~400px phone, bigger on tablets. Multiply sizes by it. */
export let unit = 1;
export let DPR = 1;

// The world is three layers: #bg (the still picture, painted once), #bg-fade (a copy of
// the old picture while a new world fades in) and #bg-anim (only the small moving bits,
// redrawn at 30 frames a second and a lower resolution). Repainting the whole picture
// every frame was the biggest cost on older tablets.
let animDpr = 1;
let animAcc = 0;
let animCleared = false;
let fadeTimer = 0;
let party = 0;
let animator = null;
let fxDirty = true;
let sceneOverride = null;

function sizeCanvas(cv, c, dpr) {
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  // pixel budget so big retina tablets stay smooth
  DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2400000 / (W * H))));
  sizeCanvas(bg, bgx, Math.min(DPR, 1.5));
  animDpr = 1;
  sizeCanvas(an, anx, animDpr);
  sizeCanvas(fxc, fxx, DPR);
  fxDirty = true;
  unit = clamp(Math.min(W, H) / 400, 0.8, 1.8);
  rebuildBackground(false);
  if (opts.onResize) opts.onResize(W, H);
}

export function currentScene() { return sceneOverride || settings.data.scene; }

function rebuildBackground(fade) {
  if (fade && bg.width) {
    // keep a copy of the old picture on top and fade it out over the new one
    fadeCv.width = bg.width;
    fadeCv.height = bg.height;
    fadeX.drawImage(bg, 0, 0);
    fadeCv.style.transition = 'none';
    fadeCv.style.opacity = '1';
    fadeCv.style.visibility = 'visible';
    void fadeCv.offsetWidth;
    fadeCv.style.transition = 'opacity .6s ease';
    fadeCv.style.opacity = '0';
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
      fadeCv.style.visibility = 'hidden';
      fadeCv.width = 0;
      fadeCv.height = 0;
    }, 700);
  }
  const s = bg.width / W;
  bgx.setTransform(1, 0, 0, 1, 0, 0);
  bgx.clearRect(0, 0, bg.width, bg.height);
  bgx.setTransform(s, 0, 0, s, 0, 0);
  paintScene(bgx, W, H, currentScene(), party);
}

/** Change the Paint Party colors (an index into PARTY_THEMES or [top, middle, bottom]). */
export function setPartyColors(p) {
  if (JSON.stringify(p) === JSON.stringify(party)) return;
  party = p;
  if (currentScene() === 'party' && bg) rebuildBackground(true);
}

/** Pick the background world for every game (saved). */
export function setScene(id) {
  if (settings.data.scene === id) return;
  settings.data.scene = id;
  settings.persist();
  if (!sceneOverride) applyScene();
}

/** Show a different world just for now (e.g. a sticker scene), or null to go back. */
export function overrideScene(id) {
  if (sceneOverride === id) return;
  sceneOverride = id;
  applyScene();
}

function applyScene() {
  animator = createAnimator(currentScene());
  if (bg) rebuildBackground(true);
}

/** Hide the moving background details (e.g. to keep a busy game screen calm). */
let bgAnimate = true;
export function animateBackground(on) { bgAnimate = on; animCleared = false; }

/** Turn the whole background world off (for a game that paints its own), saving work every frame. */
let bgOn = true;
export function showBackground(on) {
  bgOn = on;
  if (bg) {
    bg.style.visibility = on ? '' : 'hidden';
    an.style.visibility = on ? '' : 'hidden';
  }
}

function drawBackground(t, dt) {
  if (!bgAnimate) {
    if (!animCleared) {
      anx.setTransform(1, 0, 0, 1, 0, 0);
      anx.clearRect(0, 0, an.width, an.height);
      animCleared = true;
    }
    return;
  }
  // the moving bits are slow drifting things: 30 frames a second is plenty
  animAcc += dt;
  if (animAcc < 1 / 31) return;
  const step = Math.min(animAcc, 0.1);
  animAcc = 0;
  anx.setTransform(1, 0, 0, 1, 0, 0);
  anx.clearRect(0, 0, an.width, an.height);
  anx.setTransform(animDpr, 0, 0, animDpr, 0, 0);
  animator.draw(anx, W, H, t, step);
  anx.globalAlpha = 1;
  animCleared = false;
}

// ---------------------------------------------------------------------------
// Effects: sparkles, splashes, confetti, floating words
// ---------------------------------------------------------------------------
const sparkleImg = (() => {
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, s, s);
  c.fillStyle = '#fff';
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 ? s * 0.07 : s * 0.48;
    const a = (i * Math.PI) / 4;
    c.lineTo(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r);
  }
  c.fill();
  return cv;
})();

let particles = [];
function addParticle(p) {
  if (particles.length > 400) particles.shift();
  particles.push(p);
}
const hue = () => `hsl(${randInt(0, 360)}, 100%, 62%)`;

/**
 * Effects, all in screen (CSS pixel) coordinates. Use rect centers from
 * getBoundingClientRect() to put them on top of an element.
 */
export const fx = {
  /** Colored droplets flying out of a point, with a ring. */
  burst(x, y, color, big = false) {
    const n = big ? 18 : 11;
    addParticle({ type: 'ring', x, y, r: 10 * unit, vr: 160 * unit, life: 0.4, max: 0.4, color: color || '#fff' });
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-0.25, 0.25);
      const sp = rand(110, 260) * unit;
      addParticle({
        type: 'drop', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, size: rand(4, 8) * unit,
        life: rand(0.4, 0.7), max: 0.7, color: color || hue(),
      });
    }
    for (let i = 0; i < 3; i++) fx.sparkle(x + rand(-20, 20), y + rand(-20, 20));
  },
  /** One twinkly star that drifts up. */
  sparkle(x, y, size) {
    addParticle({
      type: 'spark', x, y, vx: rand(-50, 50), vy: rand(-110, -20), size: (size || rand(14, 28)) * unit,
      rot: rand(0, Math.PI), vrot: rand(-4, 4), life: rand(0.5, 0.9), max: 0.9,
    });
  },
  /** A ring of sparkles around a point (a match, a correct answer). */
  sparkles(x, y, count = 10, radius = 40) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      fx.sparkle(x + Math.cos(a) * radius * unit * rand(0.5, 1), y + Math.sin(a) * radius * unit * rand(0.5, 1));
    }
  },
  /** A glowing dot left behind a moving finger. */
  trail(x, y, color) {
    addParticle({
      type: 'trail', x: x + rand(-8, 8), y: y + rand(-8, 8), vx: rand(-30, 30), vy: rand(-60, 0),
      size: rand(12, 24) * unit, life: rand(0.4, 0.7), max: 0.7, color: color || hue(),
    });
  },
  /** Big outlined words that float up and fade ("+1", "Yum!"). */
  text(x, y, text, color = '#fff', size = 34, life = 1) {
    addParticle({ type: 'text', x, y, vy: -70, text, color, size: size * unit, life, max: life });
  },
  /** An expanding ring. */
  ring(x, y, color = '#fff') {
    addParticle({ type: 'ring', x, y, r: 10 * unit, vr: 200 * unit, life: 0.5, max: 0.5, color });
  },
  /** Confetti falling from the top of the screen. */
  confetti(count = 90) {
    for (let i = 0; i < count; i++) {
      addParticle({
        type: 'confetti', x: rand(0, W), y: rand(-H * 0.3, -10), vx: rand(-60, 60), vy: rand(60, 200),
        size: rand(8, 14) * unit, rot: rand(0, 6), vrot: rand(-8, 8), color: hue(), life: rand(2.2, 3.4), max: 3.4,
      });
    }
  },
  /** Remove every effect (e.g. when leaving a screen). */
  clear() { particles = []; fxDirty = true; },
};

function updateParticles(dt) {
  for (const p of particles) {
    p.life -= dt;
    if (p.type === 'ring') { p.r += p.vr * dt; continue; }
    p.x += (p.vx || 0) * dt;
    p.y += (p.vy || 0) * dt;
    if (p.type === 'drop') p.vy += 500 * dt;
    if (p.type === 'confetti') { p.vx += Math.sin(p.rot) * 20 * dt; p.rot += p.vrot * dt; }
    if (p.type === 'spark') p.rot += p.vrot * dt;
  }
  particles = particles.filter((p) => p.life > 0);
}

let fxShown = true;
function drawParticles() {
  // nothing to draw: leave the cleared layer alone (and hidden) instead of clearing it every frame
  if (!particles.length && !fxDirty) {
    if (fxShown) { fxc.style.visibility = 'hidden'; fxShown = false; }
    return;
  }
  if (!fxShown) { fxc.style.visibility = ''; fxShown = true; }
  fxDirty = particles.length > 0;
  fxx.clearRect(0, 0, W, H);
  for (const p of particles) {
    const k = p.life / p.max;
    switch (p.type) {
      case 'ring':
        fxx.globalAlpha = k * 0.9;
        fxx.strokeStyle = p.color;
        fxx.lineWidth = 6 * unit * k + 1;
        fxx.beginPath();
        fxx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        fxx.stroke();
        break;
      case 'drop':
        fxx.globalAlpha = Math.min(1, k * 1.5);
        fxx.fillStyle = p.color;
        fxx.beginPath();
        fxx.arc(p.x, p.y, p.size * (0.4 + k * 0.6), 0, Math.PI * 2);
        fxx.fill();
        fxx.fillStyle = 'rgba(255,255,255,0.8)';
        fxx.beginPath();
        fxx.arc(p.x - p.size * 0.25, p.y - p.size * 0.25, p.size * 0.3 * k, 0, Math.PI * 2);
        fxx.fill();
        break;
      case 'spark': {
        fxx.globalAlpha = Math.min(1, k * 1.6);
        const s = p.size * (0.5 + k * 0.5);
        fxx.save();
        fxx.translate(p.x, p.y);
        fxx.rotate(p.rot);
        fxx.drawImage(sparkleImg, -s / 2, -s / 2, s, s);
        fxx.restore();
        break;
      }
      case 'trail': {
        fxx.globalAlpha = k * 0.9;
        const s = p.size * (0.4 + k * 0.6);
        fxx.fillStyle = p.color;
        fxx.beginPath();
        fxx.arc(p.x, p.y, s * 0.3, 0, Math.PI * 2);
        fxx.fill();
        fxx.drawImage(sparkleImg, p.x - s / 2, p.y - s / 2, s, s);
        break;
      }
      case 'text': {
        const appear = Math.min(1, (p.max - p.life) / 0.12);
        fxx.globalAlpha = Math.min(1, k * 2.5);
        const size = p.size * (0.6 + appear * 0.4);
        fxx.font = `700 ${size}px ${FONT}`;
        fxx.textAlign = 'center';
        fxx.textBaseline = 'middle';
        fxx.lineJoin = 'round';
        fxx.lineWidth = Math.max(4, size * 0.16);
        fxx.strokeStyle = 'rgba(110, 40, 190, 0.85)';
        fxx.strokeText(p.text, p.x, p.y);
        fxx.fillStyle = p.color;
        fxx.fillText(p.text, p.x, p.y);
        break;
      }
      case 'confetti':
        fxx.globalAlpha = Math.min(1, k * 3);
        fxx.save();
        fxx.translate(p.x, p.y);
        fxx.rotate(p.rot);
        fxx.scale(1, Math.cos(p.rot * 1.7));
        fxx.fillStyle = p.color;
        fxx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        fxx.restore();
        break;
    }
  }
  fxx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Banner and celebrations
// ---------------------------------------------------------------------------
export function banner(title, sub = '') {
  const el = $('#banner');
  $('#banner-title').textContent = title;
  $('#banner-sub').textContent = sub;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

/** Confetti, a happy jingle and a banner. */
export function celebrate(title = 'Hooray!', sub = '') {
  fx.confetti(110);
  sfx.win();
  vibrate(30);
  banner(title, sub);
}

// ---------------------------------------------------------------------------
// Screens and the back button
// ---------------------------------------------------------------------------
// A game's screens are <section class="screen"> elements. The one marked
// data-start is the game's own title screen. showScreen(null) hides them all
// (for a play area that is not a .screen).
let current = null;
let startId = null;
export function currentScreen() { return current; }

export function showScreen(id) {
  current = id;
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  if (id !== startId) armBack();
}

// Android's back button (and the back swipe in Safari) would leave the game.
// Keep one extra history entry while away from the start screen and turn
// "back" into a step back. On the start screen, back goes to the game list.
let backArmed = false;
function armBack() {
  if (backArmed) return;
  try { history.pushState({ kidsGames: 1 }, ''); backArmed = true; } catch (err) { /* ignore */ }
}
/** Stop handling back (e.g. just before leaving the page). */
function disarmBack() { backArmed = false; }

window.addEventListener('popstate', () => {
  backArmed = false;
  if (current === startId) { goHub(); return; }
  if (current === 'screen-photo') showScreen(photoReturn);
  else if (!(opts.onBack && opts.onBack(current))) showScreen(startId);
  sfx.click();
  if (current !== startId) armBack();
});

/** Back to the game list. */
export function goHub() {
  disarmBack();
  window.location.href = opts.hub ? './' : '../';
}

// ---------------------------------------------------------------------------
// Sound button
// ---------------------------------------------------------------------------
function applyMuted() {
  sfx.setMuted(settings.data.muted);
  setSpeechMuted(settings.data.muted);
  $$('[data-action="sound"]').forEach((b) => {
    b.textContent = settings.data.muted ? '🔇' : '🔊';
    b.setAttribute('aria-label', settings.data.muted ? 'Turn sound on' : 'Turn sound off');
  });
}
export function isMuted() { return settings.data.muted; }

// ---------------------------------------------------------------------------
// Touch / mouse input
// ---------------------------------------------------------------------------
/**
 * Follow fingers (and the mouse) on an element. Works on older iPads that have
 * no Pointer Events. Each callback gets { id, x, y } in screen (client) pixels
 * plus the raw event. Several fingers at once each get their own id.
 *
 *   onPointer(el, { down(p, e) { return true; }, move(p, e) {}, up(p, e) {} })
 *
 * Return false from down() to ignore that finger (it then gets no move/up).
 * Scrolling and zooming are blocked on the element.
 */
export function onPointer(el, h) {
  const live = new Set();
  const call = (fn, id, x, y, e) => fn && fn({ id, x, y }, e);
  function start(id, x, y, e) {
    sfx.unlock();
    if (call(h.down, id, x, y, e) === false) return false;
    live.add(id);
    return true;
  }
  function moveTo(id, x, y, e) { if (live.has(id)) call(h.move, id, x, y, e); }
  function end(id, x, y, e) {
    if (!live.has(id)) return;
    live.delete(id);
    call(h.up, id, x, y, e);
  }
  el.style.touchAction = 'none';
  if (window.PointerEvent) {
    el.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      if (start(e.pointerId, e.clientX, e.clientY, e)) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        e.preventDefault();
      }
    });
    el.addEventListener('pointermove', (e) => moveTo(e.pointerId, e.clientX, e.clientY, e));
    const up = (e) => end(e.pointerId, e.clientX, e.clientY, e);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  } else {
    const noScroll = { passive: false };
    el.addEventListener('touchstart', (e) => {
      let took = false;
      for (const t of Array.prototype.slice.call(e.changedTouches)) {
        if (start(t.identifier, t.clientX, t.clientY, e)) took = true;
      }
      if (took) e.preventDefault();
    }, noScroll);
    el.addEventListener('touchmove', (e) => {
      for (const t of Array.prototype.slice.call(e.changedTouches)) moveTo(t.identifier, t.clientX, t.clientY, e);
      e.preventDefault();
    }, noScroll);
    const tend = (e) => {
      for (const t of Array.prototype.slice.call(e.changedTouches)) end(t.identifier, t.clientX, t.clientY, e);
    };
    el.addEventListener('touchend', tend);
    el.addEventListener('touchcancel', tend);
    el.addEventListener('mousedown', (e) => {
      if (e.button > 0) return;
      if (start('mouse', e.clientX, e.clientY, e)) e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => moveTo('mouse', e.clientX, e.clientY, e));
    window.addEventListener('mouseup', (e) => end('mouse', e.clientX, e.clientY, e));
  }
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

/** Center of an element on screen (for effects). */
export function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Restart a CSS animation class on an element (e.g. 'wiggle'). */
export function replayClass(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// ---------------------------------------------------------------------------
// Saving a picture the kid made
// ---------------------------------------------------------------------------
let photoReturn = null;
/**
 * Save a canvas as a PNG: the share sheet on phones (so it can go to Photos),
 * a download on computers, and on older iPads a card to long-press and save.
 */
export async function saveImage(cv, name = 'picture', title = 'My picture') {
  const file = `${name}.png`;
  try {
    const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
    let f = null;
    try { f = new File([blob], file, { type: 'image/png' }); } catch (err) { /* very old browsers */ }
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) {
      try {
        await navigator.share({ files: [f], title });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    if (IS_IOS) {
      $('#photo-img').src = cv.toDataURL('image/png');
      sfx.sparkle();
      photoReturn = current;
      showScreen('screen-photo');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    sfx.sparkle();
    banner('Saved!', 'Your picture is in your downloads');
  } catch (err) {
    sfx.boing();
    banner('Oops!', 'Could not save the picture');
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
const CHROME = `
<canvas id="bg" aria-hidden="true"></canvas>
<canvas id="bg-fade" aria-hidden="true"></canvas>
<canvas id="bg-anim" aria-hidden="true"></canvas>
<canvas id="fx" aria-hidden="true"></canvas>
<div id="banner" class="banner" aria-live="polite">
  <div class="banner-title" id="banner-title"></div>
  <div class="banner-sub" id="banner-sub"></div>
</div>
<section id="screen-photo" class="screen dim">
  <div class="panel card">
    <h2 class="heading">Your picture!</h2>
    <img id="photo-img" class="photo-img" alt="Your picture">
    <p class="card-text">Press and hold the picture,<br>then tap <b>Save Image</b>.</p>
    <div class="btn-col">
      <button class="btn btn-green btn-small" data-action="photo-done"><span class="btn-icon">👍</span> Done</button>
    </div>
  </div>
</section>`;

let last = 0;
let clock = 0;
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  clock += dt;
  if (bgOn) drawBackground(clock, dt);
  if (opts.onFrame) opts.onFrame(dt, clock);
  updateParticles(dt);
  drawParticles();
  requestAnimationFrame(frame);
}

export function boot(options = {}) {
  opts = options;
  party = options.party != null ? options.party : 0;
  document.body.insertAdjacentHTML('afterbegin', CHROME);
  bg = $('#bg');
  bgx = bg.getContext('2d', { alpha: false });
  fadeCv = $('#bg-fade');
  fadeX = fadeCv.getContext('2d');
  an = $('#bg-anim');
  anx = an.getContext('2d');
  fxc = $('#fx');
  fxx = fxc.getContext('2d');
  animator = createAnimator(currentScene());

  const start = $('.screen[data-start]') || $('.screen.active');
  startId = start ? start.id : null;
  current = $('.screen.active') ? $('.screen.active').id : startId;

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    sfx.unlock();
    unlockSpeech();
    const action = el.dataset.action;
    switch (action) {
      case 'sound':
        settings.data.muted = !settings.data.muted;
        settings.persist();
        applyMuted();
        sfx.click();
        return;
      case 'hub':
        sfx.click();
        goHub();
        return;
      case 'photo-done':
        sfx.click();
        showScreen(photoReturn);
        return;
    }
    if (!el.hasAttribute('data-quiet')) sfx.click();
    if (opts.onAction) opts.onAction(action, el, e);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) sfx.suspend();
    else { sfx.resume(); last = performance.now(); }
  });
  window.addEventListener('resize', resize);
  // iOS 12 sometimes reports the old size during the rotation itself
  window.addEventListener('orientationchange', () => setTimeout(resize, 300));
  // unlock sound and speech on the very first touch anywhere (iOS needs it inside a tap)
  ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'click'].forEach((type) => {
    window.addEventListener(type, () => { sfx.unlock(); unlockSpeech(); },
      { capture: true, passive: true });
  });
  // stop pinch-zoom on older iOS, which ignores user-scalable=no
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  resize();
  applyMuted();
  startGrownups();
  requestAnimationFrame((t) => { last = t; requestAnimationFrame(frame); });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      const root = options.hub ? './' : '../';
      navigator.serviceWorker.register(`${root}sw.js`, { scope: root }).catch(() => { /* offline support unavailable */ });
    });
  }
}
