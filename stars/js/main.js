// Catch the Falling Stars: slide the basket, catch the stars, dodge the rain.
// Nobody loses: rain only makes the basket soggy for a moment.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import {
  boot, $, fx, showScreen, celebrate, onPointer, createStore, rand, randInt, pickOne, clamp, lerp,
  vibrate, currentScene, setScene, setPartyColors, animateBackground,
} from '../../shared/js/kit.js';
import { SCENES, paintScene, createAnimator } from '../../shared/js/scenes.js';
import { createEngine, goFullscreen, sparkleImg, glowImg, dotSprite, makeSprite } from './engine.js';
import * as art from './art.js';
import * as snd from './sounds.js';

const TAU = Math.PI * 2;
const store = createStore('stars', { best: 0, bestCalm: 0, games: 0, total: 0 });

// ---------------------------------------------------------------------------
// Canvas, sprites and layout
// ---------------------------------------------------------------------------
const canvas = $('#game');
const eng = createEngine(canvas, { onQuality: () => { paintSky(); } });
const ctx = eng.ctx;

const STARS = art.buildStarSprites();
const TAIL = art.buildTail();
const MOON = art.buildMoon();
const CLOUD = art.buildClouds();
const DROP = art.buildDrop();
const BASKET = art.buildBasket();
const RAINBOW_COLORS = ['#ff4d5e', '#ff9a2e', '#ffd93b', '#5cd65c', '#3d9bff', '#9d5cff'];

// a dreamy blue glow around the edges while the moon slows everything down
const dreamImg = makeSprite(128, 128, (c) => {
  const g = c.createRadialGradient(64, 64, 34, 64, 64, 92);
  g.addColorStop(0, 'rgba(120, 140, 255, 0)');
  g.addColorStop(1, 'rgba(120, 140, 255, 0.55)');
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
}, 1);

const L = { groundY: 0, footY: 0, rimY: 0, bs: 1, hudBottom: 80, cloudY: 120 };
let sky = document.createElement('canvas');
let skyGround = 0;
let skyAlpha = currentScene() === 'party' ? 1 : 0;
let twinkles = [];
let fireflies = [];

function paintSky() {
  const W = eng.W;
  const H = eng.H;
  if (!W || !H) return;
  const s = Math.min(eng.DPR, 1.5);
  sky.width = Math.round(W * s);
  sky.height = Math.round(H * s);
  const c = sky.getContext('2d');
  c.setTransform(s, 0, 0, s, 0, 0);
  skyGround = art.paintNight(c, W, H);
  twinkles = [];
  const n = Math.round(clamp((W * H) / 30000, 12, 30));
  for (let i = 0; i < n; i++) {
    twinkles.push({ x: rand(0, W), y: rand(0, skyGround * 0.8), ph: rand(0, TAU), sp: rand(1, 2.4), s: rand(10, 22) });
  }
  fireflies = [];
  for (let i = 0; i < 6; i++) fireflies.push({ x: rand(0, W), y: skyGround - rand(10, 70), ph: rand(0, TAU), v: rand(8, 20) * (Math.random() < 0.5 ? -1 : 1) });
}

function layout() {
  const { W, H, unit } = eng;
  const safeBottom = $('#safe-probe').offsetHeight || 0;
  const hud = $('#hud').getBoundingClientRect();
  L.hudBottom = hud.bottom || 80;
  L.bs = unit * (H < 500 ? 0.86 : 1);
  const party = currentScene() === 'party';
  L.groundY = party ? skyGround : H - safeBottom - 12 * unit;
  L.footY = Math.min(L.groundY + 16 * unit, H - safeBottom - 6 * unit);
  L.rimY = L.footY - (art.BOTTOM_Y + 10 - art.RIM_Y) * L.bs;
  L.cloudY = Math.max(L.hudBottom + 34 * unit, H * 0.16);
  basket.x = clamp(basket.x || W / 2, 40, W - 40);
  basket.tx = clamp(basket.tx || W / 2, 0, W);
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  mode: 'menu', // 'menu' | 'play' | 'over'
  calm: false,
  paused: false,
  time: 0,
  intro: 0,
  score: 0,
  spawnTimer: 0,
  cloudTimer: 0,
  slowTimer: 0,
  timeScale: 1,
  soggy: 0,
  streak: 0,
  seen: {},
  hint: 0,
  movedHint: 0,
};
let items = [];
let clouds = [];
const basket = { x: 0, tx: 0, vx: 0, tilt: 0, sq: 0, sqv: 0, joyT: 0, blinkT: 3, walk: 0, pile: [] };
let keyDir = 0;
let lastSay = 0;

const playing = () => state.mode === 'play' && !state.paused;

function talk(text, force) {
  const now = performance.now();
  if (!force && now - lastSay < 2600) return;
  lastSay = now;
  say(text);
}

// ---------------------------------------------------------------------------
// Pace: ramps up gently over two minutes, then stays the same
// ---------------------------------------------------------------------------
function params() {
  if (state.mode === 'menu') return { spawn: 0.9, fall: 7, clouds: 0, rain: 99 };
  const t = state.time;
  const k0 = clamp(t / 110, 0, 1);
  const k = k0 * k0 * (3 - 2 * k0);
  if (state.calm) return { spawn: lerp(1.15, 0.8, k), fall: lerp(5.6, 4.4, k), clouds: 0, rain: 99 };
  return {
    spawn: lerp(1.05, 0.56, k),
    fall: lerp(5.2, 3.3, k),
    clouds: t < 9 ? 0 : t < 50 ? 1 : 2,
    rain: lerp(3.0, 1.9, k),
  };
}

// ---------------------------------------------------------------------------
// Falling things
// ---------------------------------------------------------------------------
function baseR() { return 28 * eng.unit; }

function makeItem(kind, opts = {}) {
  const p = params();
  const { W } = eng;
  let r = baseR();
  if (kind === 'star') r *= pickOne([0.8, 1, 1, 1.25]);
  if (kind === 'rainbow' || kind === 'moon') r *= 1.25;
  if (kind === 'shoot') r *= 1.05;
  if (kind === 'rain') r = 11 * eng.unit;
  const it = {
    kind,
    col: randInt(0, art.STAR_COLORS.length - 1),
    r,
    x0: opts.x != null ? opts.x : rand(r + 10, Math.max(r + 10, W - r - 10)),
    y: opts.y != null ? opts.y : -r * 1.4,
    vx: 0,
    vy: 0,
    age: 0,
    phase: rand(0, TAU),
    swayAmp: rand(8, 20) * eng.unit,
    swaySpeed: rand(0.8, 1.5),
    rot: 0,
    blinkT: rand(1, 4),
    st: 'fall',
    t: 0,
    bvx: 0,
    bvy: 0,
  };
  const dist = L.rimY + r * 1.4;
  it.vy = (dist / p.fall) * rand(0.9, 1.1);
  if (kind === 'rainbow') it.vy *= 0.8;
  if (kind === 'moon') { it.vy *= 0.75; it.swayAmp *= 1.4; }
  if (kind === 'shoot') {
    it.vy = (dist / (p.fall * 0.62));
    const T = dist / it.vy;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const target = rand(0.22, 0.78) * W;
    it.vx = (dir * W * 0.35) / T;
    it.x0 = target - it.vx * T;
    it.swayAmp = 0;
  }
  if (kind === 'rain') {
    it.vy = 50 * eng.unit;
    it.maxVy = (dist / (p.fall * 0.9)) * 1.05;
    it.vx = opts.vx || 0;
    it.swayAmp = 0;
  }
  it.x = it.x0;
  return it;
}

function chooseKind() {
  if (state.mode === 'menu') return Math.random() < 0.04 ? 'shoot' : 'star';
  const t = state.time;
  // make sure every special shows up early at least once, so kids discover them
  if (t > 7 && !state.seen.shoot) return 'shoot';
  if (t > 22 && !state.seen.rainbow) return 'rainbow';
  if (t > 38 && !state.seen.moon) return 'moon';
  const roll = Math.random();
  if (roll < 0.06) return 'shoot';
  if (t > 15 && roll < 0.085 && !items.some((i) => i.kind === 'rainbow')) return 'rainbow';
  if (t > 20 && roll < 0.11 && state.slowTimer <= 0 && !items.some((i) => i.kind === 'moon')) return 'moon';
  return 'star';
}

function spawn() {
  if (items.length > 34) return;
  const kind = chooseKind();
  state.seen[kind] = true;
  items.push(makeItem(kind));
  if (kind === 'star' && state.mode === 'play' && state.time > 60 && Math.random() < 0.15) {
    const it = makeItem('star');
    it.y -= it.r * 3;
    items.push(it);
  }
}

// ---------------------------------------------------------------------------
// Clouds
// ---------------------------------------------------------------------------
function spawnCloud() {
  const { W, unit } = eng;
  const dir = Math.random() < 0.5 ? 1 : -1;
  const s = unit * rand(0.8, 1);
  const w = art.CLOUD_W * s;
  clouds.push({
    x: dir > 0 ? -w * 0.6 : W + w * 0.6,
    y: L.cloudY + rand(-10, 16) * unit,
    dir,
    v: rand(36, 56) * unit,
    s,
    dropT: rand(1.2, 2),
    puffT: 0,
    ph: rand(0, TAU),
    fade: 1,
  });
}

function updateClouds(dt, sdt) {
  const p = params();
  const { W } = eng;
  if (state.mode === 'play' && state.intro <= 0) {
    state.cloudTimer -= dt;
    if (clouds.length < p.clouds && state.cloudTimer <= 0) {
      spawnCloud();
      state.cloudTimer = rand(5, 9);
    }
  }
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i];
    c.x += c.dir * c.v * sdt;
    c.ph += dt;
    const w = art.CLOUD_W * c.s;
    if (c.leaving) c.fade -= dt * 1.5;
    if ((c.dir > 0 && c.x > W + w * 0.7) || (c.dir < 0 && c.x < -w * 0.7) || c.fade <= 0) {
      clouds.splice(i, 1);
      continue;
    }
    if (c.puffT > 0) {
      c.puffT -= sdt;
      if (c.puffT <= 0) {
        items.push(makeItem('rain', { x: c.x + rand(-20, 20) * c.s, y: c.y + 34 * c.s, vx: c.dir * c.v * 0.2 }));
        snd.puff();
      }
    } else if (state.mode === 'play' && !c.leaving && c.x > w * 0.3 && c.x < W - w * 0.3) {
      c.dropT -= sdt;
      if (c.dropT <= 0) {
        c.dropT = p.rain * rand(0.8, 1.2);
        c.puffT = 0.35;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Catching
// ---------------------------------------------------------------------------
function colorOf(it) {
  if (it.kind === 'shoot') return '#fff27a';
  if (it.kind === 'moon') return '#ffe98a';
  if (it.kind === 'rainbow') return pickOne(RAINBOW_COLORS);
  return art.STAR_COLORS[it.col].pop;
}
function spriteOf(it) {
  if (it.kind === 'shoot') return STARS.shoot;
  if (it.kind === 'rainbow') return STARS.rainbow;
  if (it.kind === 'moon') return MOON;
  const s = STARS.colors[it.col];
  return it.blinkT < 0.15 ? s.blink : s.open;
}

let hudDirty = true;
let lastBump = 0;

function addScore(n) {
  const before = state.score;
  state.score += n;
  hudDirty = true;
  const best = state.calm ? store.data.bestCalm : store.data.best;
  if (state.score > best) {
    if (state.calm) store.data.bestCalm = state.score; else store.data.best = state.score;
    if (best > 0 && before <= best && !state.newBestSaid) {
      state.newBestSaid = true;
      eng.text(eng.W / 2, L.hudBottom + 50 * eng.unit, 'New best!', '#fff27a', 34, 1.4, -30);
      sfx.chime([0, 4, 7, 12], 784, 0.06);
    }
  }
  const step = 10;
  if (Math.floor(state.score / step) > Math.floor(before / step)) milestone(Math.floor(state.score / step) * step);
}

// Big words in the middle of the screen; several at once stack instead of overlapping.
function announce(text, color, size, life) {
  const { W, H, unit } = eng;
  let n = 0;
  for (const p of eng.particles) if (p.announce && p.life > p.max * 0.3) n++;
  eng.text(W / 2, H * 0.36 + n * size * 1.2 * unit, text, color, size, life, -30);
  eng.particles[eng.particles.length - 1].announce = true;
}

function milestone(m) {
  const { W, H } = eng;
  if (m % 50 === 0) {
    celebrate(`${m} stars!`, pickOne(['Super star!', 'Amazing!', 'Wow wow wow!', 'Star champion!']));
  } else {
    fx.confetti(eng.light() ? 35 : 60);
    sfx.chime([0, 4, 7, 12, 16], 660, 0.07);
    announce(`${m} stars!`, '#fff27a', 50, 1.6);
  }
  talk(`${m} stars!`, true);
  vibrate(25);
}

function catchItem(it, chain) {
  const { unit } = eng;
  const col = colorOf(it);
  const x = it.x;
  const y = Math.min(it.y, L.rimY);
  it.st = 'gone';
  basket.joyT = 0.4;
  basket.sqv -= chain ? 1.2 : 2.6;
  pushPile(it);

  let pts = 1;
  if (it.kind === 'shoot') pts = 5;
  if (state.mode === 'play') {
    state.streak++;
    addScore(pts);
  }
  const big = it.kind !== 'star';
  eng.burst(x, y, it.kind === 'rainbow' ? RAINBOW_COLORS : [col, '#ffffff'], chain ? 5 : big ? 14 : 9, big ? 1.2 : 0.9, { sparks: chain ? 1 : big ? 4 : 2, ringColor: col });
  eng.text(x, y - 22 * unit, `+${pts}`, it.kind === 'shoot' ? '#fff27a' : col, pts > 1 ? 40 : 30);
  if (!chain) {
    snd.twinkle(Math.min(state.streak, 10));
    vibrate(10);
  } else {
    snd.twinkle(randInt(4, 10));
  }

  switch (it.kind) {
    case 'shoot':
      snd.zing();
      announce('Shooting star!', '#fff27a', 38, 1.3);
      talk('Shooting star!', true);
      break;
    case 'rainbow':
      sfx.whoosh();
      sfx.sparkle();
      announce('RAINBOW!', '#ffffff', 50, 1.4);
      talk('Rainbow!', true);
      rainbowPull(it);
      break;
    case 'moon':
      snd.lullaby();
      state.slowTimer = 7;
      $('#hud-moon').classList.remove('hidden');
      announce('Slooow...', '#e4f0ff', 46, 1.6);
      talk('Sleepy moon. Slooow!', true);
      break;
    default:
      if (!chain && state.mode === 'play' && state.streak > 0 && state.streak % 8 === 0) {
        announce(pickOne(['Great!', 'Super!', 'Wow!', 'Twinkly!', 'Yay!']), '#ffffff', 44, 1.1);
        talk(pickOne(['Great catching!', 'Wow!', 'Super!', 'You got it!', 'Twinkle twinkle!', 'Hooray!']));
      }
  }
}

function pushPile(it) {
  let img;
  if (it.kind === 'shoot') img = STARS.shoot;
  else if (it.kind === 'rainbow') img = STARS.rainbow;
  else if (it.kind === 'moon') img = MOON;
  else img = STARS.colors[it.col].open;
  basket.pile.push(img);
  if (basket.pile.length > 6) basket.pile.shift();
}

// The rainbow star pulls every star on the screen into the basket.
function rainbowPull(src) {
  let i = 0;
  for (const o of items) {
    if (o === src || o.st === 'gone' || o.st === 'zoom') continue;
    if (o.kind === 'rain') {
      // raindrops turn into sparkles
      o.st = 'gone';
      eng.burst(o.x, o.y, ['#bfe9ff', '#ffffff'], 5, 0.6, { sparks: 2, ring: false });
      continue;
    }
    o.st = 'zoom';
    o.t = -0.08 * i;
    o.sx = o.x;
    o.sy = o.y;
    i++;
  }
  for (const c of clouds) c.leaving = true;
}

function getSoggy(it) {
  const { unit } = eng;
  it.st = 'gone';
  state.soggy = 2;
  state.streak = 0;
  basket.sqv += 2.2;
  snd.splish();
  vibrate([10, 30, 10]);
  eng.text(clamp(it.x + (it.x < eng.W / 2 ? 70 : -70) * unit, 70 * unit, eng.W - 70 * unit), L.rimY - 60 * unit, pickOne(['Splish!', 'Splash!', 'Drip drop!', 'Soggy!']), '#bfe9ff', 34, 1);
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + rand(-1.2, 1.2);
    const sp = rand(120, 260) * unit;
    eng.drip(it.x, L.rimY, Math.cos(a) * sp, Math.sin(a) * sp, pickOne(['#9fdcff', '#5cb8ff', '#ffffff']), rand(4, 7));
  }
  if (Math.random() < 0.35) talk(pickOne(['Oops, soggy!', 'Splish splash!', 'Drip drop!']));
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
function update(dt) {
  const { W, unit } = eng;
  if (state.paused) return;

  if (state.mode === 'play') {
    if (state.intro > 0) state.intro -= dt;
    else state.time += dt;
  }
  if (state.slowTimer > 0) {
    state.slowTimer -= dt;
    if (state.slowTimer <= 0) $('#hud-moon').classList.add('hidden');
  }
  state.timeScale = lerp(state.timeScale, state.slowTimer > 0 ? 0.42 : 1, Math.min(1, dt * 4));
  const sdt = dt * state.timeScale;

  // spawning
  const spawning = state.mode === 'menu' || (state.mode === 'play' && state.intro <= 0);
  if (spawning) {
    state.spawnTimer -= sdt;
    if (state.spawnTimer <= 0) {
      state.spawnTimer += params().spawn * rand(0.8, 1.2);
      spawn();
    }
  }

  // basket
  if (state.mode === 'play') {
    if (keyDir) basket.tx = clamp(basket.tx + keyDir * 620 * unit * dt, 0, W);
    const half = art.BASKET_W * 0.42 * L.bs;
    const tx = clamp(basket.tx, half, W - half);
    const nx = lerp(basket.x, tx, 1 - Math.exp(-dt * (state.soggy > 0 ? 9 : 16)));
    basket.vx = (nx - basket.x) / Math.max(dt, 0.001);
    if (Math.abs(nx - basket.x) > 0.5) state.movedHint += Math.abs(nx - basket.x);
    basket.x = nx;
    basket.tilt = lerp(basket.tilt, clamp(basket.vx / (2200 * unit), -0.22, 0.22), Math.min(1, dt * 10));
    if (Math.abs(basket.vx) > 40 * unit) basket.walk += dt * 15;
    if (state.soggy > 0) {
      state.soggy -= dt;
      if (Math.random() < dt * 12) {
        eng.drip(basket.x + rand(-40, 40) * L.bs, L.rimY + rand(30, 70) * L.bs, rand(-20, 20), rand(20, 80), pickOne(['#9fdcff', '#5cb8ff']), rand(3, 5));
      }
      if (state.soggy <= 0) {
        // shake off the water
        basket.sqv -= 2;
        for (let i = 0; i < 8; i++) {
          const a = rand(0, TAU);
          eng.drip(basket.x, L.rimY + 30 * L.bs, Math.cos(a) * 200 * unit, -Math.abs(Math.sin(a)) * 220 * unit, '#9fdcff', 4);
        }
        sfx.chime([0, 7], 880, 0.06);
      }
    }
  }
  basket.sqv += (-basket.sq * 200 - basket.sqv * 11) * dt;
  basket.sq += basket.sqv * dt;
  if (basket.joyT > 0) basket.joyT -= dt;
  basket.blinkT -= dt;
  if (basket.blinkT < 0) basket.blinkT = rand(2.5, 5);

  // falling things
  const half = 62 * L.bs;
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (it.st === 'gone') { items.splice(i, 1); continue; }
    it.age += sdt;
    it.blinkT -= dt;
    if (it.blinkT < 0) it.blinkT = rand(2, 5);

    if (it.st === 'zoom') {
      it.t += dt / 0.5;
      if (it.t <= 0) continue;
      const k = Math.min(1, it.t);
      const e = k * k;
      const tx = basket.x;
      const ty = L.rimY;
      const cx = (it.sx + tx) / 2;
      const cy = Math.min(it.sy, ty) - 80 * unit;
      it.x = (1 - e) * (1 - e) * it.sx + 2 * (1 - e) * e * cx + e * e * tx;
      it.y = (1 - e) * (1 - e) * it.sy + 2 * (1 - e) * e * cy + e * e * ty;
      it.rot += dt * 10;
      if (Math.random() < 0.5) eng.trail(it.x, it.y, pickOne(RAINBOW_COLORS), 12, 0.35);
      if (k >= 1) catchItem(it, true);
      continue;
    }

    const prevY = it.y;
    if (it.st === 'bounce') {
      it.bvy += 900 * unit * sdt;
      it.x += it.bvx * sdt;
      if (it.x < it.r || it.x > W - it.r) { it.bvx *= -1; it.x = clamp(it.x, it.r, W - it.r); }
      it.y += it.bvy * sdt;
      it.rot += it.bvx * 0.004 * sdt;
      if (it.bvy >= it.vy) { it.st = 'fall'; it.x0 = it.x; it.swayAmp = 0; }
    } else {
      if (it.kind === 'rain') {
        it.vy = Math.min(it.maxVy, it.vy + 420 * unit * sdt);
      }
      it.y += it.vy * sdt;
      it.x0 += it.vx * sdt;
      // a gentle helping hand: stars just above the basket drift toward it
      if (state.mode === 'play' && it.kind !== 'rain' && state.soggy <= 0) {
        const dy = L.rimY - it.y;
        const dx = basket.x - it.x;
        if (dy > 0 && dy < 120 * unit && Math.abs(dx) < half * 1.7) it.x0 += dx * Math.min(1, sdt * 3);
      }
      it.x = it.x0 + Math.sin(it.age * it.swaySpeed + it.phase) * it.swayAmp;
      if (it.kind === 'rainbow') it.rot += sdt * 1.8;
      else if (it.kind === 'shoot') it.rot = 0;
      else it.rot = Math.sin(it.age * 2.2 + it.phase) * 0.28;
    }

    if (it.kind === 'shoot' && it.st === 'fall' && Math.random() < 0.7) {
      eng.trail(it.x - it.vx * 0.03, it.y - it.vy * 0.03, pickOne(['#fff27a', '#ffffff', '#ff9ad6']), 12, 0.5);
    } else if (it.kind === 'rainbow' && Math.random() < 0.25) {
      eng.trail(it.x + rand(-10, 10), it.y + rand(-10, 10), pickOne(RAINBOW_COLORS), 10, 0.5);
    } else if (it.kind === 'star' && Math.random() < dt * 0.6 && !eng.light()) {
      eng.sparkle(it.x + rand(-it.r, it.r), it.y + rand(-it.r, it.r), 12, -10);
    }

    // reaching the basket rim
    const line = L.rimY;
    if (state.mode === 'play' && it.st !== 'bounce' && prevY < line && it.y >= line) {
      const reach = half * 0.95 + it.r * (it.kind === 'rain' ? 0.1 : 0.4);
      if (Math.abs(it.x - basket.x) <= reach) {
        if (it.kind === 'rain') { getSoggy(it); continue; }
        if (state.soggy > 0) {
          // a soggy basket can't catch: the star bounces off (and can come back down!)
          it.st = 'bounce';
          it.bvy = -Math.max(260 * unit, it.vy * 1.1);
          it.bvx = (it.x < basket.x ? -1 : 1) * rand(100, 170) * unit;
          snd.bonk();
          eng.sparkle(it.x, it.y, 18);
          continue;
        }
        catchItem(it);
        continue;
      }
    }

    // landing on the ground (no penalty)
    const floor = state.mode === 'play' ? L.footY - 6 * unit : eng.H + it.r;
    if (it.y > floor) {
      it.st = 'gone';
      if (it.kind === 'rain') {
        eng.ring(it.x, floor, 'rgba(190, 230, 255, 0.9)', 4, 90, 3);
        for (let k = 0; k < 3; k++) eng.drip(it.x, floor, rand(-90, 90) * unit, rand(-160, -80) * unit, '#9fdcff', 3);
        snd.plip();
      } else if (state.mode === 'play') {
        state.streak = 0;
        eng.ring(it.x, floor, colorOf(it), 6, 120, 4);
        eng.sparkle(it.x, floor - 6 * unit, 22);
      }
    } else if (it.y > eng.H + it.r * 2) {
      it.st = 'gone';
    }
  }

  updateClouds(dt, sdt);
  eng.updateParticles(dt);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function drawSky(t, dt) {
  const target = currentScene() === 'party' ? 1 : 0;
  skyAlpha = lerp(skyAlpha, target, Math.min(1, dt * 2.5));
  if (Math.abs(skyAlpha - target) < 0.01) skyAlpha = target;
  if (skyAlpha <= 0) return;
  const { W, DPR } = eng;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = skyAlpha;
  ctx.drawImage(sky, 0, 0, canvas.width, canvas.height);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  for (const s of twinkles) {
    const a = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
    if (a < 0.08) continue;
    ctx.globalAlpha = a * skyAlpha;
    const z = s.s * eng.unit * (0.6 + a * 0.4);
    ctx.drawImage(sparkleImg, s.x - z / 2, s.y - z / 2, z, z);
  }
  const ff = dotSprite('#fff27a');
  for (const f of fireflies) {
    f.x += f.v * dt;
    if (f.x < -20) f.x = W + 20;
    if (f.x > W + 20) f.x = -20;
    const y = f.y + Math.sin(t * 1.3 + f.ph) * 10;
    const a = 0.45 + 0.55 * Math.sin(t * 2.6 + f.ph * 3);
    if (a <= 0) continue;
    ctx.globalAlpha = a * skyAlpha * 0.8;
    const z = 22 * eng.unit;
    ctx.drawImage(glowImg, f.x - z / 2, y - z / 2, z, z);
    ctx.drawImage(ff, f.x - 3, y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
}

function drawClouds(t) {
  for (const c of clouds) {
    const puff = c.puffT > 0;
    const k = puff ? Math.sin((1 - c.puffT / 0.35) * Math.PI) : 0;
    const w = art.CLOUD_W * c.s;
    const h = art.CLOUD_H * c.s;
    const sx = 1 + k * 0.08 + Math.sin(t * 1.6 + c.ph) * 0.015;
    const sy = 1 - k * 0.1 + Math.cos(t * 1.6 + c.ph) * 0.015;
    eng.blit(puff ? CLOUD.puff : CLOUD.calm, c.x, c.y + Math.sin(t * 1.1 + c.ph) * 4, w, h, 0, Math.max(0, c.fade), sx, sy);
  }
}

function drawItem(it, t) {
  if (it.kind === 'rain') {
    const w = art.DROP_W * (it.r / 11);
    const h = art.DROP_H * (it.r / 11);
    eng.blit(DROP, it.x, it.y, w, h, 0, 1, 1, 1 + Math.min(0.25, it.vy / (3000 * eng.unit)));
    return;
  }
  const size = (art.STAR_BOX * it.r) / art.STAR_R;
  if (it.kind === 'shoot') {
    const ang = Math.atan2(it.vy, it.vx);
    const D = eng.DPR;
    const tl = it.r * 4.4;
    const th = it.r * 1.1;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    ctx.setTransform(D * c, D * s, -D * s, D * c, D * it.x, D * it.y);
    ctx.globalAlpha = it.st === 'fall' ? 1 : 0.5;
    ctx.drawImage(TAIL, -tl, -th / 2, tl, th);
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.globalAlpha = 1;
  }
  const pulse = 1 + Math.sin(t * 5 + it.phase) * 0.05;
  let sc = pulse;
  if (it.st === 'zoom' && it.t > 0) sc *= 1 - Math.min(1, it.t) * 0.4;
  eng.blit(spriteOf(it), it.x, it.y, size, size, it.rot, 1, sc, sc);
}

function drawBasket(t) {
  const { unit, DPR } = eng;
  const bs = L.bs;
  const soggy = state.soggy > 0;
  let sy = 1 + basket.sq;
  let sx = 1 - basket.sq * 0.6;
  if (soggy) {
    sy *= 0.9 + Math.sin(t * 9) * 0.02;
    sx *= 1.06;
  }
  const bob = basket.walk ? Math.abs(Math.sin(basket.walk)) * 2.5 * unit : 0;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.translate(basket.x, L.footY);
  ctx.rotate(basket.tilt + (soggy ? Math.sin(t * 5) * 0.03 : 0));

  // feet
  const moving = Math.abs(basket.vx) > 40 * unit;
  const lift = moving ? Math.sin(basket.walk) * 6 * unit : 0;
  ctx.lineWidth = 3 * bs;
  ctx.strokeStyle = '#2d2442';
  ctx.fillStyle = soggy ? '#7fb5ff' : '#ff7a9a';
  for (const s of [-1, 1]) {
    const l = s < 0 ? Math.max(0, lift) : Math.max(0, -lift);
    ctx.beginPath();
    ctx.ellipse(s * 26 * bs, -6 * bs - l, 15 * bs, 8 * bs, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }

  ctx.translate(0, -bob);
  ctx.scale(sx, sy);
  const w = art.BASKET_W * bs;
  const h = art.BASKET_H * bs;
  const top = -(art.BOTTOM_Y + 8) * bs;
  ctx.drawImage(soggy ? BASKET.backWet : BASKET.back, -w / 2, top, w, h);
  // the stars caught so far, peeking out of the basket
  const slots = [[-30, 6], [24, 4], [-6, 2], [38, -2], [-42, -2], [8, -8]];
  const rimY = top + art.RIM_Y * bs;
  for (let i = 0; i < basket.pile.length; i++) {
    const [ox, oy] = slots[i];
    const z = 34 * bs;
    const wob = Math.sin(t * 2 + i) * 0.15;
    ctx.save();
    ctx.translate(ox * bs, rimY + oy * bs);
    ctx.rotate(wob + i);
    ctx.drawImage(basket.pile[i], -z / 2, -z / 2, z, z);
    ctx.restore();
  }
  let face = BASKET.happy;
  if (soggy) face = BASKET.soggy;
  else if (basket.joyT > 0) face = BASKET.joy;
  else if (basket.blinkT < 0.15) face = BASKET.blink;
  ctx.drawImage(face, -w / 2, top, w, h);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function drawHint(t) {
  if (state.mode !== 'play' || state.movedHint > 120 * eng.unit || state.time > 6) return;
  const a = 0.6 + 0.4 * Math.sin(t * 5);
  const off = 95 * L.bs + Math.sin(t * 5) * 8 * eng.unit;
  const y = L.rimY + 30 * L.bs;
  const l = eng.textSprite('◀', '#ffffff', 40 * eng.unit);
  const r = eng.textSprite('▶', '#ffffff', 40 * eng.unit);
  ctx.globalAlpha = a;
  ctx.drawImage(l, basket.x - off - l.cssW / 2, y - l.cssH / 2, l.cssW, l.cssH);
  ctx.drawImage(r, basket.x + off - r.cssW / 2, y - r.cssH / 2, r.cssW, r.cssH);
  ctx.globalAlpha = 1;
}

function render(t, dt) {
  eng.begin();
  drawSky(t, dt);
  drawClouds(t);
  for (const it of items) if (it.kind === 'rain') drawItem(it, t);
  for (const it of items) if (it.kind !== 'rain') drawItem(it, t);
  if (state.mode === 'play' || state.mode === 'over') drawBasket(t);
  drawHint(t);
  const k = clamp((1 - state.timeScale) / 0.55, 0, 1);
  if (k > 0.01) {
    ctx.globalAlpha = k;
    ctx.drawImage(dreamImg, 0, 0, eng.W, eng.H);
    ctx.globalAlpha = 1;
  }
  eng.drawParticles();
  flushHud();
}

function flushHud() {
  if (!hudDirty) return;
  hudDirty = false;
  $('#hud-score').textContent = state.score;
  $('#hud-best-val').textContent = state.calm ? store.data.bestCalm : store.data.best;
  const now = performance.now();
  if (now - lastBump > 200 && state.score > 0) {
    lastBump = now;
    const pill = $('#score-pill');
    pill.classList.remove('bump');
    void pill.offsetWidth;
    pill.classList.add('bump');
  }
}

let lastNow = performance.now();
function onFrame(dt, t) {
  const now = performance.now();
  const raw = (now - lastNow) / 1000;
  lastNow = now;
  eng.watch(raw, state.paused);
  update(dt);
  render(t, dt);
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
function tapStar(x, y) {
  let best = null;
  let bd = Infinity;
  for (const it of items) {
    if (it.st !== 'fall' || it.kind === 'rain') continue;
    const d = Math.hypot(it.x - x, it.y - y);
    if (d < it.r * 1.4 + 14 && d < bd) { bd = d; best = it; }
  }
  if (!best) { eng.sparkle(x, y, 24, -30); return; }
  best.st = 'gone';
  eng.burst(best.x, best.y, [colorOf(best), '#fff'], 9, 0.9, { sparks: 3, ringColor: colorOf(best) });
  snd.twinkle(randInt(0, 8));
}

onPointer(canvas, {
  down(p) {
    if (state.mode === 'play') {
      if (state.paused) return false;
      basket.tx = p.x;
      return true;
    }
    if (state.mode === 'menu') tapStar(p.x, p.y);
    return true;
  },
  move(p) {
    if (state.mode === 'play' && !state.paused) basket.tx = p.x;
  },
});
// with a mouse, the basket simply follows the pointer
window.addEventListener('mousemove', (e) => {
  if (state.mode === 'play' && !state.paused) basket.tx = e.clientX;
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'Left') { keyDir = -1; e.preventDefault(); }
  else if (e.key === 'ArrowRight' || e.key === 'Right') { keyDir = 1; e.preventDefault(); }
  else if ((e.key === 'Escape' || e.key === 'p') && state.mode === 'play') {
    if (state.paused) resumeGame(); else pauseGame();
  }
});
window.addEventListener('keyup', (e) => {
  if ((e.key === 'ArrowLeft' || e.key === 'Left') && keyDir < 0) keyDir = 0;
  if ((e.key === 'ArrowRight' || e.key === 'Right') && keyDir > 0) keyDir = 0;
});

// ---------------------------------------------------------------------------
// Flow
// ---------------------------------------------------------------------------
function setHud(on) { $('#hud').classList.toggle('active', on); }

function startGame(calm) {
  sfx.unlock();
  goFullscreen();
  state.mode = 'play';
  state.calm = calm;
  state.paused = false;
  state.time = 0;
  state.intro = 1.3;
  state.score = 0;
  state.spawnTimer = 0;
  state.cloudTimer = 0;
  state.slowTimer = 0;
  state.timeScale = 1;
  state.soggy = 0;
  state.streak = 0;
  state.seen = {};
  state.movedHint = 0;
  state.newBestSaid = false;
  state.startBest = calm ? store.data.bestCalm : store.data.best;
  for (const it of items) if (it.st !== 'gone') eng.sparkle(it.x, it.y, 18);
  items = [];
  clouds = [];
  basket.pile = [];
  basket.x = basket.tx = eng.W / 2;
  basket.sq = 0;
  basket.sqv = -3;
  keyDir = 0;
  $('#hud-moon').classList.add('hidden');
  hudDirty = true;
  showScreen(null);
  setHud(true);
  layout();
  sfx.chime([0, 4, 7, 12], 660, 0.08);
  talk(calm ? 'Catch the stars. Nice and calm.' : 'Catch the falling stars!', true);
}

function pauseGame() {
  if (state.mode !== 'play' || state.paused) return;
  state.paused = true;
  keyDir = 0;
  store.persist();
  showScreen('screen-pause');
}
function resumeGame() {
  if (!state.paused) return;
  state.paused = false;
  showScreen(null);
}

const RESULT_TITLES = ['Great catching!', 'Star catcher!', 'Super!', 'Wonderful!', 'Twinkle-tastic!'];
let resultTimer = 0;

function stopGame() {
  if (state.mode !== 'play') return;
  state.mode = 'over';
  state.paused = false;
  keyDir = 0;
  setHud(false);
  // the stars left on the screen float away with a sparkle
  for (const it of items) {
    if (it.st !== 'gone') eng.burst(it.x, it.y, [colorOf(it), '#fff'], 4, 0.6, { sparks: 1, ring: false });
  }
  items = [];
  for (const c of clouds) c.leaving = true;
  state.slowTimer = 0;
  $('#hud-moon').classList.add('hidden');

  const n = state.score;
  const isBest = n > state.startBest;
  store.data.games++;
  store.data.total += n;
  store.persistNow();

  $('#result-title').textContent = n > 0 ? pickOne(RESULT_TITLES) : 'Good night, stars!';
  $('#result-num').textContent = n;
  const bestEl = $('#result-best');
  bestEl.textContent = isBest && n > 0 ? '🏆 New best!' : `🏆 Best: ${state.calm ? store.data.bestCalm : store.data.best}`;
  bestEl.classList.toggle('new', isBest && n > 0);
  clearTimeout(resultTimer);
  resultTimer = setTimeout(() => {
    if (state.mode !== 'over') return;
    showScreen('screen-result');
    if (isBest && n > 0) {
      fx.confetti(90);
      sfx.win();
      talk(`You caught ${n} stars! A new best!`, true);
    } else {
      sfx.chime([0, 4, 7, 12, 16], 660, 0.08);
      talk(n === 1 ? 'You caught one star!' : `You caught ${n} stars!`, true);
    }
  }, 550);
}

function goTitle() {
  clearTimeout(resultTimer);
  state.mode = 'menu';
  state.paused = false;
  state.slowTimer = 0;
  keyDir = 0;
  setHud(false);
  items = [];
  clouds = [];
  store.persist();
  updateTitle();
  showScreen('screen-title');
}

function updateTitle() {
  const parts = [];
  if (store.data.best > 0) parts.push(`🏆 Best: ${store.data.best}`);
  if (store.data.bestCalm > 0) parts.push(`🌙 ${store.data.bestCalm}`);
  $('#title-best').textContent = parts.join('   ');
}

// ---------------------------------------------------------------------------
// World picker
// ---------------------------------------------------------------------------
function applyWorld() {
  const party = currentScene() === 'party';
  animateBackground(!party);
  layout();
}

function buildWorlds() {
  const grid = $('#theme-grid');
  grid.querySelectorAll('canvas').forEach((c) => { c.width = 0; c.height = 0; });
  grid.innerHTML = '';
  for (const sc of SCENES) {
    const btn = document.createElement('button');
    const on = sc.id === currentScene();
    btn.className = 'theme-card' + (on ? ' selected' : '');
    const name = sc.id === 'party' ? 'Night Sky' : sc.name;
    btn.setAttribute('aria-label', name);
    btn.setAttribute('aria-pressed', String(on));
    const cv = document.createElement('canvas');
    btn.appendChild(cv);
    btn.insertAdjacentHTML('beforeend', `<span class="check">✓</span><span class="theme-name">${sc.id === 'party' ? '🌙' : sc.icon} ${name}</span>`);
    btn.addEventListener('click', () => {
      sfx.unlock();
      sfx.chime([0, 4, 7], 784, 0.05);
      setScene(sc.id);
      applyWorld();
      grid.querySelectorAll('.theme-card').forEach((c) => {
        const sel = c === btn;
        c.classList.toggle('selected', sel);
        c.setAttribute('aria-pressed', String(sel));
      });
    });
    grid.appendChild(btn);
  }
  requestAnimationFrame(() => {
    grid.querySelectorAll('canvas').forEach((cv, i) => {
      const r = cv.getBoundingClientRect();
      const w = Math.max(60, r.width);
      const h = Math.max(75, r.height);
      const s = Math.min(2, window.devicePixelRatio || 1);
      const vw = 360;
      const vh = (360 * h) / w;
      cv.width = Math.round(w * s);
      cv.height = Math.round(h * s);
      const c = cv.getContext('2d');
      c.scale((w * s) / vw, (h * s) / vh);
      if (SCENES[i].id === 'party') {
        art.paintNight(c, vw, vh);
      } else {
        paintScene(c, vw, vh, SCENES[i].id, 0);
        const anim = createAnimator(SCENES[i].id);
        for (let k = 0; k < 3; k++) anim.draw(c, vw, vh, 2 + k, k === 0 ? 0 : 1.2);
      }
      // a few stars in every preview, so it looks like this game
      const z = 40;
      c.drawImage(STARS.colors[0].open, vw * 0.25 - z / 2, vh * 0.3, z, z);
      c.drawImage(STARS.colors[1].open, vw * 0.62 - z / 2, vh * 0.18, z, z);
      c.drawImage(STARS.colors[2].open, vw * 0.75 - z / 2, vh * 0.45, z, z);
    });
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

boot({
  party: art.NIGHT,
  onFrame,
  onResize() {
    eng.resize();
    eng.holdPerf(1.5);
    paintSky();
    layout();
  },
  onAction(action) {
    switch (action) {
      case 'play': startGame(false); break;
      case 'calm': startGame(true); break;
      case 'worlds': buildWorlds(); showScreen('screen-worlds'); break;
      case 'home': goTitle(); break;
      case 'pause': pauseGame(); break;
      case 'resume': resumeGame(); break;
      case 'stop': stopGame(); break;
      case 'again': startGame(state.calm); break;
    }
  },
  onBack(screen) {
    if (screen === null || screen === 'screen-pause' || screen === 'screen-result' || screen === 'screen-worlds') {
      goTitle();
      return true;
    }
    return false;
  },
});
setPartyColors(art.NIGHT);
applyWorld();
updateTitle();
// the hills and the score font: repaint once the font has loaded
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { eng.resize(); paintSky(); layout(); });

// a tiny hook for automated testing
window.__stars = {
  state, basket, L,
  get items() { return items; },
  get clouds() { return clouds; },
  get quality() { return eng.quality; },
  startGame, stopGame, pauseGame, resumeGame,
  spawn(kind, x) { const it = makeItem(kind, { x }); items.push(it); return it; },
  cloud() { spawnCloud(); },
};
