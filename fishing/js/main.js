// Fishing Pond: tap the water to drop the line, a fish always comes along,
// and every catch goes into the Fish Book. There is no way to fail.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import {
  boot, $, fx, showScreen, currentScreen, celebrate, onPointer, createStore, rand, randInt, pickOne, clamp, lerp,
  vibrate, animateBackground, centerOf, replayClass,
} from '../../shared/js/kit.js';
import { createEngine, goFullscreen, glowImg, makeSprite } from './engine.js';
import { SPECIES, BY_ID, buildArt, drawCreature, portrait, boundsOf } from './fish.js';
import * as scene from './scene.js';
import * as snd from './sounds.js';

const TAU = Math.PI * 2;
const store = createStore('fishing', { caught: {}, total: 0, kept: 0, released: 0, bookDone: false });

// ---------------------------------------------------------------------------
// Canvas and sprites
// ---------------------------------------------------------------------------
const canvas = $('#game');
const eng = createEngine(canvas, { onQuality: () => paintPondCache() });
const ctx = eng.ctx;

const RES = clamp((window.devicePixelRatio || 1) * clamp(Math.min(window.innerWidth, window.innerHeight) / 400, 0.8, 1.8), 2, 3.5);
const ART = {};
SPECIES.forEach((sp) => { ART[sp.id] = buildArt(sp, RES); });
const BOAT = scene.buildBoat(RES);
const BOBBER = scene.buildBobber(RES);
const DUCK = scene.buildDuck(RES);
const CLOUD = scene.buildCloud(RES);
const RAY = scene.buildRay();
const BUBBLE = scene.buildBubble(RES);
const goldGlow = makeSprite(64, 64, (c) => {
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255, 240, 140, 0.85)');
  g.addColorStop(0.45, 'rgba(255, 210, 60, 0.35)');
  g.addColorStop(1, 'rgba(255, 210, 60, 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
}, 1);
const RAINBOW = ['#ff4d5e', '#ff9a2e', '#ffd93b', '#5cd65c', '#3d9bff', '#9d5cff'];

// ---------------------------------------------------------------------------
// Layout and the cached pond picture
// ---------------------------------------------------------------------------
const P = { surfaceY: 200, floorY: 700, dockW: 80, deckY: 180, bs: 1 };
const pond = document.createElement('canvas');
let weeds = [];
let rays = [];
let skyClouds = [];

function paintPondCache() {
  const { W, H } = eng;
  if (!W || !H) return;
  const s = Math.min(eng.DPR, 1.5);
  pond.width = Math.round(W * s);
  pond.height = Math.round(H * s);
  const c = pond.getContext('2d');
  c.setTransform(s, 0, 0, s, 0, 0);
  const r = scene.paintPond(c, W, H);
  P.surfaceY = r.surfaceY;
  P.floorY = r.floorY;
  P.dockW = r.dockW;
  P.deckY = r.deckY;
}

function layout() {
  const { W, H, unit } = eng;
  P.bs = unit * (H < 520 ? 0.72 : 0.9);
  weeds = [];
  const n = Math.max(4, Math.round(W / (75 * unit)));
  const greens = ['#3fcf7a', '#2fbf6a', '#5ad68a', '#28a860'];
  for (let i = 0; i < n; i++) {
    weeds.push({
      x: ((i + 0.2 + Math.random() * 0.6) / n) * W,
      h: rand(0.25, 0.5) * (P.floorY - P.surfaceY),
      ph: rand(0, TAU),
      col: greens[i % greens.length],
      w: rand(7, 10) * unit,
    });
  }
  rays = [0.12, 0.38, 0.64, 0.88].map((fx) => ({ x: fx * W, w: rand(60, 110) * unit, ph: rand(0, TAU) }));
  if (!skyClouds.length) {
    skyClouds = [0.15, 0.55, 0.9].map((fx) => ({ x: fx * W, k: rand(0.2, 0.7), s: rand(0.6, 0.95), v: rand(5, 10) }));
  }
  boat.x = clamp(boat.x || W * 0.5, boatMinX(), boatMaxX());
  boat.tx = clamp(boat.tx || boat.x, boatMinX(), boatMaxX());
}

const waterTop = () => P.surfaceY + 34 * eng.unit;
const waterBottom = () => P.floorY - 30 * eng.unit;
const boatMinX = () => P.dockW + 70 * P.bs;
const boatMaxX = () => eng.W - 66 * P.bs;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = { mode: 'menu', session: 0, idle: 0, lastPlay: 0, duckT: 8 };
const stats = { spawns: 0, sinceGold: 0, sinceRainbow: 0 };
let fish = [];
let flying = null; // the caught fish jumping up to the card, or diving back in
let spawnTimer = 0;
const boat = { x: 0, tx: 0, face: 1, faceK: 1, joyT: 0, bend: 0 };
const line = { st: 'idle', t: 0, bx: 0, hx: 0, hy: 0, ty: 0, cx0: 0, cy0: 0, waitT: 0, biter: null, dipped: 0, dip: 0, fishSp: null };
const duck = { on: false, x: 0, dir: 1, hop: 0 };
let caught = null; // the catch shown on the card

let lastSay = 0;
function talk(text, force) {
  const now = performance.now();
  if (!force && now - lastSay < 2200) return;
  lastSay = now;
  say(text);
}

// ---------------------------------------------------------------------------
// Fish
// ---------------------------------------------------------------------------
function targetCount() {
  return clamp(Math.round((eng.W * (P.floorY - P.surfaceY)) / 38000), 5, 10);
}

function countOf(id) {
  let n = 0;
  for (const f of fish) if (f.sp.id === id) n++;
  return n;
}

function pickSpecies() {
  stats.spawns++;
  const caughtData = store.data.caught;
  if (!fish.some((f) => f.sp.rare === 'rainbow') && (Math.random() < 1 / 110 || stats.sinceRainbow > 110)) {
    stats.sinceRainbow = 0;
    return BY_ID.rainbow;
  }
  stats.sinceRainbow++;
  if ((Math.random() < 1 / 25 || stats.sinceGold > 38) && fish.filter((f) => f.sp.rare).length < 2) {
    stats.sinceGold = 0;
    const golds = SPECIES.filter((s) => s.rare === 'gold');
    const weighted = [];
    golds.forEach((s) => { const w = caughtData[s.id] ? 1 : 3; for (let i = 0; i < w; i++) weighted.push(s); });
    return pickOne(weighted);
  }
  stats.sinceGold++;
  const caps = { crab: 1, eel: 1, octopus: 1, jelly: 2, puffer: 2 };
  const pool = [];
  for (const s of SPECIES) {
    if (s.rare) continue;
    if (caps[s.id] != null && countOf(s.id) >= caps[s.id]) continue;
    const w = caughtData[s.id] ? 2 : 3;
    for (let i = 0; i < w; i++) pool.push(s);
  }
  return pickOne(pool);
}

function makeFish(sp, opts = {}) {
  const { W, unit } = eng;
  const s = unit * rand(0.85, 1.05) * (sp.kind === 'eel' ? 0.9 : 1);
  const dir = opts.dir || (Math.random() < 0.5 ? 1 : -1);
  const b = boundsOf(sp);
  const margin = Math.max(b.left, b.right) * s + 20;
  const f = {
    sp, a: ART[sp.id], s, dir, faceK: dir, margin,
    x: opts.x != null ? opts.x : dir > 0 ? -margin : W + margin,
    y: 0,
    depthK: opts.depthK != null ? opts.depthK : rand(sp.depth[0], sp.depth[1]),
    speed: rand(sp.speed[0], sp.speed[1]) * unit * (sp.rare ? 0.85 : 1),
    ph: rand(0, TAU),
    age: rand(0, 10),
    wag: 0,
    rot: 0,
    st: 'swim',
    notice: 0,
    happy: 0,
    puff: 0,
    dash: 0,
    sparkT: 0,
    step: 0,
  };
  f.y = swimY(f);
  if (opts.y != null) { f.y = opts.y; f.depthK = depthOf(f.y); }
  return f;
}

function depthOf(y) {
  return clamp((y - waterTop()) / Math.max(1, waterBottom() - waterTop()), 0, 1);
}
function swimY(f) {
  if (f.sp.kind === 'crab') return P.floorY - f.sp.r * 0.55 * f.s;
  return lerp(waterTop(), waterBottom(), f.depthK);
}

function spawnFish(initial) {
  const sp = pickSpecies();
  const f = makeFish(sp, initial ? { x: rand(eng.W * 0.08, eng.W * 0.92) } : {});
  fish.push(f);
  return f;
}

function fillPond() {
  fish = [];
  const n = targetCount();
  for (let i = 0; i < n; i++) spawnFish(true);
}

// Where a fish's center should be so its mouth is at (hx, hy).
function mouthTarget(f, hx, hy) {
  const sp = f.sp;
  const s = f.s;
  switch (sp.kind) {
    case 'fish': return { x: hx - f.dir * sp.rx * 1.0 * s, y: hy + sp.ry * 0.1 * s };
    case 'puffer': return { x: hx - f.dir * sp.r * 1.02 * s, y: hy - sp.r * 0.15 * s };
    case 'eel': return { x: hx - f.dir * (sp.len / 2 + 10) * s, y: hy };
    case 'jelly': return { x: hx, y: hy + sp.r * 0.9 * s };
    case 'octopus': return { x: hx, y: hy + sp.r * 1.0 * s };
    case 'crab': return { x: hx - f.dir * sp.r * 1.15 * s, y: P.floorY - sp.r * 0.55 * s };
  }
  return { x: hx, y: hy };
}
// How far the mouth is from the center, for hanging on the hook.
function mouthReach(f) {
  const sp = f.sp;
  if (sp.kind === 'fish') return sp.rx * 1.0 * f.s;
  if (sp.kind === 'puffer') return sp.r * 1.05 * f.s;
  if (sp.kind === 'eel') return (sp.len / 2 + 8) * f.s;
  if (sp.kind === 'crab') return sp.r * 1.3 * f.s;
  return sp.r * 1.0 * f.s;
}

function updateFish(dt, t) {
  const { W, unit } = eng;
  for (let i = fish.length - 1; i >= 0; i--) {
    const f = fish[i];
    f.age += dt;
    if (f.notice > 0) f.notice -= dt;
    if (f.happy > 0) f.happy -= dt;
    f.puff = lerp(f.puff, f.st === 'hooked' || f.happy > 0.5 ? 1 : 0, Math.min(1, dt * 8));
    f.faceK = lerp(f.faceK, f.dir, Math.min(1, dt * 7));
    let wagSpeed = 7;

    switch (f.st) {
      case 'swim':
      case 'flee': {
        const boost = f.st === 'flee' || f.dash > 0 ? 2.4 : 1;
        if (f.dash > 0) f.dash -= dt;
        f.x += f.dir * f.speed * boost * dt;
        if (f.sp.kind === 'crab') {
          f.y = swimY(f);
          f.step += dt * 6 * boost;
        } else {
          const target = swimY(f) + Math.sin(f.age * 1.1 + f.ph) * 7 * unit;
          f.y = lerp(f.y, target, Math.min(1, dt * 1.5));
        }
        wagSpeed = 7 * boost;
        f.rot = 0;
        // sometimes turn around (only while on screen)
        if (f.st === 'swim' && f.x > f.margin && f.x < W - f.margin && Math.random() < dt * 0.035) f.dir *= -1;
        if ((f.dir > 0 && f.x > W + f.margin) || (f.dir < 0 && f.x < -f.margin)) {
          fish.splice(i, 1);
          continue;
        }
        break;
      }
      case 'peek': {
        // came to have a look, hovering a little way from the hook
        const side = f.x < line.hx ? -1 : 1;
        const tx = line.hx + side * (90 * unit + f.margin * 0.4);
        const ty = clamp(line.hy + f.peekDy, waterTop(), waterBottom());
        f.dir = side < 0 ? 1 : -1;
        f.x = lerp(f.x, tx, Math.min(1, dt * 1.2));
        f.y = f.sp.kind === 'crab' ? swimY(f) : lerp(f.y, ty + Math.sin(f.age * 2) * 5 * unit, Math.min(1, dt * 1.2));
        f.step += dt * 3;
        wagSpeed = 10;
        break;
      }
      case 'curious': {
        if (line.st !== 'sink' && line.st !== 'wait' && line.st !== 'nibble') { letGo(f); break; }
        if (Math.abs(line.hx - f.x) > 6 * unit) f.dir = line.hx > f.x ? 1 : -1;
        const m = mouthTarget(f, line.hx, line.hy);
        const dx = m.x - f.x;
        const dy = m.y - f.y;
        const d = Math.hypot(dx, dy);
        const sp = clamp(d * 1.6, 70 * unit, 320 * unit);
        const step = Math.min(d, sp * dt);
        if (d > 0.01) { f.x += (dx / d) * step; f.y += (dy / d) * step; }
        f.rot = lerp(f.rot, clamp(dy / Math.max(40 * unit, d) * 0.5, -0.4, 0.4) * f.dir, Math.min(1, dt * 6));
        f.step += dt * 8;
        wagSpeed = 14;
        if (d < 3 * unit && line.st === 'wait') startNibble(f);
        break;
      }
      case 'nibble': {
        const m = mouthTarget(f, line.hx, line.hy);
        const peck = Math.max(0, Math.sin(line.t * 14)) * 4 * unit;
        f.x = m.x - f.dir * peck;
        f.y = m.y;
        f.rot = lerp(f.rot, 0, Math.min(1, dt * 6));
        f.step += dt * 4;
        wagSpeed = 12;
        break;
      }
      case 'hooked': {
        const wig = Math.sin(t * 17) * 0.32;
        if (f.sp.kind === 'jelly' || f.sp.kind === 'octopus') {
          f.rot = wig * 0.5;
          f.x = line.hx;
          f.y = line.hy + mouthReach(f);
        } else if (f.sp.kind === 'crab') {
          f.rot = wig * 0.6;
          f.x = line.hx;
          f.y = line.hy + mouthReach(f) * 0.7;
        } else {
          // hanging from the hook by the mouth, head up, wiggling
          f.rot = -f.dir * Math.PI * 0.42 + wig;
          const r = mouthReach(f);
          const hxv = f.faceK * r * Math.cos(f.rot);
          const hyv = f.faceK * r * Math.sin(f.rot);
          f.x = line.hx - hxv;
          f.y = line.hy - hyv;
        }
        wagSpeed = 22;
        break;
      }
    }
    f.wag = Math.sin(f.age * wagSpeed + f.ph) * (f.st === 'hooked' ? 0.5 : 0.3);

    // golden sparkle
    if (f.sp.rare) {
      f.sparkT -= dt;
      if (f.sparkT <= 0) {
        f.sparkT = eng.light() ? 0.35 : 0.18;
        eng.sparkle(f.x + rand(-30, 30) * f.s, f.y + rand(-20, 20) * f.s, rand(12, 22), -20);
      }
    }
    // a bubble now and then
    if (f.st === 'swim' && Math.random() < dt * 0.25) addBubble(f.x + f.dir * 30 * f.s, f.y - 6 * f.s, 0.6);
  }

  // keep the pond lively
  if (state.mode !== 'paused') {
    spawnTimer -= dt;
    const free = fish.filter((f) => f.st === 'swim' || f.st === 'flee').length;
    if (spawnTimer <= 0 && fish.length < targetCount() + 1 && free < targetCount()) {
      spawnTimer = rand(0.8, 2.2);
      spawnFish(false);
    }
  }
}

function letGo(f) {
  if (!f) return;
  f.st = 'swim';
  f.depthK = depthOf(f.y);
  f.rot = 0;
}

// ---------------------------------------------------------------------------
// The line
// ---------------------------------------------------------------------------
function rodTip() {
  const bs = P.bs;
  const by = P.surfaceY + Math.sin(clockT * 1.6) * 2.5 * eng.unit;
  const px = boat.x + boat.faceK * (scene.PAWS[0] - scene.BOAT_W / 2) * bs;
  const py = by + (scene.PAWS[1] - scene.BOAT_WATER) * bs;
  const a = 0.95 - boat.bend * 0.35;
  const len = 100 * bs;
  return { px, py, x: px + boat.faceK * Math.cos(a) * len, y: py - Math.sin(a) * len };
}

function cast(x, y) {
  const { unit } = eng;
  const f = x >= boat.x ? 1 : -1;
  const reach = 92 * P.bs + 26 * unit;
  boat.face = f;
  boat.tx = clamp(x - f * reach, boatMinX(), boatMaxX());
  const tip = rodTip();
  line.st = 'cast';
  line.t = 0;
  line.cx0 = tip.x;
  line.cy0 = tip.y;
  line.bx = clamp(x, 20 * unit, eng.W - 20 * unit);
  line.hx = line.cx0;
  line.hy = line.cy0;
  line.ty = clamp(y, waterTop(), waterBottom() + 8 * unit);
  // near the bottom, the crab (if there is one) gets to come along
  if (y > P.floorY - 70 * unit) line.ty = P.floorY - 26 * unit;
  line.waitT = 0;
  line.dip = 0;
  if (line.biter) letGo(line.biter);
  line.biter = null;
  for (const o of fish) if (o.st === 'peek') letGo(o);
  state.idle = 0;
  snd.cast();
}

function landHook() {
  const { unit } = eng;
  line.st = 'sink';
  line.t = 0;
  line.hx = line.bx;
  line.hy = P.surfaceY;
  snd.plop();
  eng.ring(line.bx, P.surfaceY + 2, 'rgba(255,255,255,0.9)', 6, 120, 4);
  eng.ring(line.bx, P.surfaceY + 2, 'rgba(255,255,255,0.7)', 2, 70, 3);
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + rand(-1, 1);
    const sp = rand(80, 200) * unit;
    eng.drip(line.bx, P.surfaceY, Math.cos(a) * sp, Math.sin(a) * sp, pickOne(['#bff0ff', '#ffffff', '#7fd8ff']), rand(3, 5));
  }
}

function chooseBiter(radius) {
  const nearFloor = line.hy > P.floorY - 70 * eng.unit;
  let best = null;
  let bd = Infinity;
  for (const f of fish) {
    if (f.st !== 'swim') continue;
    if (f.x < -10 || f.x > eng.W + 10) continue;
    if (f.sp.kind === 'crab' && !nearFloor) continue;
    let d = Math.hypot(f.x - line.hx, f.y - line.hy);
    if (f.sp.rare) d *= 0.5;
    if (f.sp.kind === 'crab') d *= 0.6;
    if (d < bd) { bd = d; best = f; }
  }
  return bd < radius ? best : null;
}

function setBiter(f) {
  line.biter = f;
  f.st = 'curious';
  f.notice = 1.1;
  snd.notice();
  // a couple of others come and have a look too
  let peekers = 0;
  for (const o of fish) {
    if (peekers >= 2 || o === f || o.st !== 'swim' || o.sp.kind === 'crab') continue;
    if (Math.hypot(o.x - line.hx, o.y - line.hy) < 280 * eng.unit) {
      o.st = 'peek';
      o.peekDy = rand(-50, 50) * eng.unit;
      o.notice = 0.8;
      peekers++;
    }
  }
}

function startNibble(f) {
  line.st = 'nibble';
  line.t = 0;
  line.dipped = 0;
  f.st = 'nibble';
}

function hookIt() {
  const f = line.biter;
  line.st = 'reel';
  line.t = 0;
  line.y0 = line.hy;
  line.x0 = line.hx;
  line.dur = clamp((line.hy - P.surfaceY) / (260 * eng.unit), 0.9, 1.8);
  f.st = 'hooked';
  f.happy = 0;
  for (const o of fish) {
    if (o.st === 'peek') { o.st = 'flee'; o.dir = o.x < line.hx ? -1 : 1; o.depthK = depthOf(o.y); setTimeout(() => { if (o.st === 'flee') o.st = 'swim'; }, 1500); }
  }
  boat.joyT = 3;
  snd.bigSplash();
  vibrate(30);
  eng.ring(line.bx, P.surfaceY + 2, '#ffffff', 8, 160, 5);
  if (Math.random() < 0.6) talk(pickOne(['A bite!', 'Reel it in!', 'Here it comes!', 'Got one!']));
}

function jumpOut() {
  const f = line.biter;
  const { W, H, unit } = eng;
  const idx = fish.indexOf(f);
  if (idx >= 0) fish.splice(idx, 1);
  line.st = 'jump';
  line.t = 0;
  snd.bigSplash();
  vibrate(20);
  eng.burst(line.bx, P.surfaceY, ['#bff0ff', '#ffffff', '#7fd8ff'], 16, 1.3, { sparks: 3, up: 120 });
  eng.ring(line.bx, P.surfaceY + 2, 'rgba(255,255,255,0.9)', 10, 200, 5);
  flying = {
    f, mode: 'up', t: 0,
    x0: f.x, y0: f.y,
    x1: W / 2, y1: H * (H < 520 ? 0.4 : 0.36),
    s0: 1, s1: clamp(Math.min(W, H) / (180 * unit), 1.3, 2),
  };
  f.happy = 3;
}

function updateLine(dt) {
  const { unit } = eng;
  line.t += dt;
  switch (line.st) {
    case 'cast': {
      const k = Math.min(1, line.t / 0.55);
      const e = k;
      line.hx = lerp(line.cx0, line.bx, e);
      line.hy = lerp(line.cy0, P.surfaceY, e) - Math.sin(k * Math.PI) * 90 * unit;
      if (k >= 1) landHook();
      break;
    }
    case 'sink':
    case 'wait': {
      if (line.st === 'sink') {
        const d = line.ty - line.hy;
        line.hy += Math.max(Math.min(d, 30 * unit * dt), d * Math.min(1, dt * 2.6));
        line.hx = line.bx + Math.sin(line.t * 2) * 3 * unit;
        if (Math.abs(d) < 1.5) line.st = 'wait';
      } else {
        line.hx = line.bx + Math.sin(line.t * 2) * 3 * unit;
        line.hy = line.ty + Math.sin(line.t * 2.6) * 3 * unit;
      }
      line.dip = lerp(line.dip, 0, Math.min(1, dt * 6));
      if (line.hy > P.surfaceY + 30 * unit) {
        line.waitT += dt;
        if (!line.biter && line.waitT > 0.35) {
          const radius = line.waitT < 1.5 ? 230 * unit : line.waitT < 3 ? 480 * unit : 1e9;
          const b = chooseBiter(radius);
          if (b) setBiter(b);
        }
        if (!line.biter && line.waitT > 4.2) {
          // nobody around? a fish always comes along
          const nearFloor = line.hy > P.floorY - 70 * unit;
          let sp = pickSpecies();
          let tries = 0;
          while ((sp.kind === 'crab') !== nearFloor && tries++ < 20) sp = nearFloor && !fish.some((f) => f.sp.kind === 'crab') ? BY_ID.crab : pickSpecies();
          const dir = line.hx < eng.W / 2 ? 1 : -1;
          const f = makeFish(sp, { dir, y: line.hy });
          fish.push(f);
          setBiter(f);
        }
      }
      break;
    }
    case 'nibble': {
      // two little dips of the bobber, then a big one: it's on!
      const marks = [0.12, 0.6];
      if (line.dipped < marks.length && line.t > marks[line.dipped]) {
        line.dip = 1;
        snd.nibble(line.dipped);
        eng.ring(line.bx, P.surfaceY + 2, 'rgba(255,255,255,0.8)', 4, 80, 3);
        addBubble(line.hx, line.hy - 6 * unit, 0.7);
        line.dipped++;
      }
      line.dip = lerp(line.dip, 0, Math.min(1, dt * 5));
      if (line.t > 1.05) hookIt();
      break;
    }
    case 'reel': {
      const k = Math.min(1, line.t / line.dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      line.hy = lerp(line.y0, P.surfaceY + 4 * unit, e);
      line.hx = lerp(line.x0, line.bx, e);
      line.dip = 1;
      boat.bend = lerp(boat.bend, 1, Math.min(1, dt * 8));
      snd.reelTick();
      if (Math.random() < dt * 8) addBubble(line.hx + rand(-10, 10), line.hy + 10 * unit, 0.6);
      if (k >= 1) jumpOut();
      break;
    }
    case 'jump':
    case 'card':
      line.dip = lerp(line.dip, 0, Math.min(1, dt * 5));
      boat.bend = lerp(boat.bend, 0, Math.min(1, dt * 5));
      break;
    default:
      boat.bend = lerp(boat.bend, 0, Math.min(1, dt * 5));
  }
}

function updateFlying(dt) {
  if (!flying) return;
  const fl = flying;
  fl.t += dt;
  if (fl.mode === 'up') {
    const k = Math.min(1, fl.t / 0.75);
    const e = 1 - Math.pow(1 - k, 3);
    fl.x = lerp(fl.x0, fl.x1, e);
    fl.y = lerp(fl.y0, fl.y1, e) - Math.sin(k * Math.PI) * 60 * eng.unit;
    fl.sc = lerp(fl.s0, fl.s1, e);
    fl.rot = k * TAU;
    if (Math.random() < 0.6) eng.drip(fl.x, fl.y, rand(-60, 60), rand(-20, 60), pickOne(['#bff0ff', '#ffffff']), rand(3, 5));
    if (k >= 1) { flying = null; showCatch(fl.f); }
  } else {
    // diving back into the pond
    const k = Math.min(1, fl.t / 0.6);
    fl.x = lerp(fl.x0, fl.x1, k);
    fl.y = lerp(fl.y0, fl.y1, k) - Math.sin(k * Math.PI) * 120 * eng.unit;
    fl.sc = lerp(fl.s0, 1, k);
    fl.rot = fl.f.dir * (k * 2.2 - 0.6);
    if (k >= 1) {
      const f = fl.f;
      snd.release();
      eng.burst(fl.x, P.surfaceY, ['#bff0ff', '#ffffff', '#7fd8ff'], 14, 1.2, { sparks: 2, up: 140 });
      eng.ring(fl.x, P.surfaceY + 2, 'rgba(255,255,255,0.9)', 8, 180, 5);
      f.x = fl.x;
      f.y = P.surfaceY + 30 * eng.unit;
      f.depthK = rand(0.2, 0.6);
      f.st = 'swim';
      f.rot = 0;
      f.dash = 2;
      f.happy = 1.5;
      f.notice = 0;
      fish.push(f);
      for (let i = 0; i < 6; i++) addBubble(fl.x + rand(-20, 20), P.surfaceY + rand(20, 50) * eng.unit, rand(0.5, 1));
      flying = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Catch card, release, keep
// ---------------------------------------------------------------------------
const portraitCache = {};
function portraitOf(id, size, sil) {
  const key = `${id}|${size}|${sil ? 1 : 0}`;
  if (!portraitCache[key]) portraitCache[key] = portrait(ART[id], size, sil, !sil);
  return portraitCache[key];
}

function speciesFound() {
  return SPECIES.filter((s) => store.data.caught[s.id]).length;
}

function showCatch(f) {
  const sp = f.sp;
  const isNew = !store.data.caught[sp.id];
  store.data.caught[sp.id] = (store.data.caught[sp.id] || 0) + 1;
  store.data.total++;
  store.persist();
  state.session++;
  caught = { f, sp, isNew };
  line.st = 'card';

  const card = $('#catch-card');
  card.classList.remove('gold', 'rainbow', 'to-book', 'to-pond');
  if (sp.rare) card.classList.add(sp.rare);
  const cv = $('#catch-canvas');
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  c.drawImage(portraitOf(sp.id, 360, false), 0, 0, cv.width, cv.height);
  $('#catch-name').textContent = sp.name;
  const n = store.data.caught[sp.id];
  $('#catch-count').textContent = n > 1 ? `🐟 × ${n}` : '';
  const nb = $('#catch-new');
  nb.classList.toggle('hidden', !isNew);
  nb.classList.remove('show');
  if (isNew) { void nb.offsetWidth; nb.classList.add('show'); }
  showScreen('screen-catch');
  updateHud(true);

  // celebrate (extra big for the rare ones)
  const tag = $('#catch-tag');
  tag.textContent = sp.rare === 'rainbow' ? '🌈 Super rare! 🌈' : sp.rare ? '✨ Golden! ✨' : '';
  tag.classList.toggle('hidden', !sp.rare);
  if (sp.rare === 'rainbow') {
    fx.confetti(130);
    sfx.win();
    snd.golden();
    vibrate([20, 40, 20, 40, 60]);
    setTimeout(() => fx.confetti(90), 700);
    talk(`Amazing! The ${sp.name}!`, true);
  } else if (sp.rare) {
    fx.confetti(120);
    sfx.win();
    snd.golden();
    vibrate([20, 40, 20, 40]);
    talk(`Wow! ${sp.name}! A golden one!`, true);
  } else if (isNew) {
    fx.confetti(eng.light() ? 40 : 70);
    sfx.win();
    talk(`A new fish! ${sp.name}!`, true);
  } else {
    sfx.chime([0, 4, 7, 12, 16], 660, 0.07);
    talk(pickOne([`${sp.name}!`, `It's a ${sp.name}!`, `You caught a ${sp.name}!`]), true);
  }
  const c2 = centerOf($('#catch-canvas'));
  fx.sparkles(c2.x, c2.y, sp.rare ? 16 : 10, 90);
}

let cardTimer = 0;
function finishCard(how) {
  if (!caught) return;
  const card = $('#catch-card');
  const { f, sp } = caught;
  caught = null;
  clearTimeout(cardTimer);
  if (how === 'keep') {
    store.data.kept++;
    const from = centerOf(card);
    const btn = state.mode === 'play' ? $('#book-btn') : null;
    const to = btn ? centerOf(btn) : { x: eng.W - 40, y: 40 };
    card.style.setProperty('--tx', `${to.x - from.x}px`);
    card.style.setProperty('--ty', `${to.y - from.y}px`);
    card.classList.add('to-book');
    sfx.whoosh();
    talk(pickOne(['Into the fish book!', 'Saved in your book!', 'Keep it!']), true);
    cardTimer = setTimeout(() => {
      showScreen(state.mode === 'play' ? null : 'screen-title');
      card.classList.remove('to-book');
      if (btn) {
        replayClass(btn, 'bump');
        fx.sparkles(to.x, to.y, 8, 30);
      }
      sfx.sparkle();
      afterCard();
    }, 480);
  } else {
    store.data.released++;
    card.classList.add('to-pond');
    talk(pickOne(['Bye bye, fishy!', 'Splash! Swim away!', 'See you later!', 'Off you go!']), true);
    const { W, H } = eng;
    flying = {
      f, mode: 'down', t: 0,
      x0: W / 2, y0: H * 0.42, x1: clamp(boat.x + rand(-120, 120) * eng.unit, 60, W - 60), y1: P.surfaceY,
      s0: 1.5, sc: 1.5, x: W / 2, y: H * 0.42, rot: 0,
    };
    f.dir = flying.x1 > flying.x0 ? 1 : -1;
    f.faceK = f.dir;
    cardTimer = setTimeout(() => {
      showScreen(state.mode === 'play' ? null : 'screen-title');
      card.classList.remove('to-pond');
      afterCard();
    }, 420);
  }
  store.persist();
  void sp;
}

function afterCard() {
  line.st = 'idle';
  line.biter = null;
  state.idle = 0;
  updateHud();
  if (!store.data.bookDone && speciesFound() === SPECIES.length) {
    store.data.bookDone = true;
    store.persist();
    setTimeout(() => {
      celebrate('Fish Book done!', 'You found every fish!');
      talk('You found every fish! Hooray!', true);
    }, 600);
  }
}

// ---------------------------------------------------------------------------
// Fish book
// ---------------------------------------------------------------------------
let bookReturn = 'screen-title';
function openBook() {
  bookReturn = currentScreen() === 'screen-title' ? 'screen-title' : null;
  $('#hud').classList.add('hidden');
  buildBook();
  showScreen('screen-book');
  const n = speciesFound();
  talk(n === 0 ? 'Your fish book! Go catch some fish!' : `You found ${n} kinds of fish!`, true);
}
function closeBook() {
  showScreen(bookReturn);
  if (bookReturn === null && state.mode === 'play') $('#hud').classList.remove('hidden');
}

function buildBook() {
  const grid = $('#book-grid');
  grid.innerHTML = '';
  const found = speciesFound();
  $('#book-text').textContent = `${found} / ${SPECIES.length}`;
  $('#book-fill').style.width = `${(found / SPECIES.length) * 100}%`;
  SPECIES.forEach((sp, i) => {
    const n = store.data.caught[sp.id] || 0;
    const btn = document.createElement('button');
    btn.className = 'fish-card' + (n ? '' : ' locked') + (sp.rare ? ` ${sp.rare}` : '');
    btn.style.animationDelay = `${i * 0.03}s`;
    btn.setAttribute('aria-label', n ? sp.name : 'Not found yet');
    const cv = document.createElement('canvas');
    cv.width = 240;
    cv.height = 180;
    cv.getContext('2d').drawImage(portraitOf(sp.id, 240, !n), 0, 0);
    btn.appendChild(cv);
    btn.insertAdjacentHTML('beforeend', `<span class="fname">${n ? sp.name : '?'}</span>${n ? `<span class="fcount">×${n}</span>` : ''}`);
    btn.addEventListener('click', () => {
      sfx.unlock();
      replayClass(btn, 'wiggle');
      if (n) {
        sfx.pick(i);
        const c = centerOf(btn);
        fx.sparkles(c.x, c.y, sp.rare ? 10 : 6, 50);
        talk(sp.rare ? `${sp.name}! So shiny!` : sp.name, true);
      } else {
        sfx.boing();
        talk(sp.rare ? 'A rare one! Keep fishing!' : pickOne(['Not found yet! Keep fishing!', 'Who could it be?', 'Keep fishing to find it!']), true);
      }
    });
    grid.appendChild(btn);
  });
}

// ---------------------------------------------------------------------------
// Ambient life: bubbles and the duck
// ---------------------------------------------------------------------------
function addBubble(x, y, size = 1) {
  if (y < P.surfaceY + 8) return;
  const vy = -rand(40, 70) * eng.unit;
  eng.add({
    type: 'bubble', x, y, vy, img: BUBBLE, size: 14 * eng.unit * size * rand(0.7, 1.2),
    life: (y - P.surfaceY - 4) / -vy, max: 99,
  });
}

let bubbleT = 0;
function updateAmbient(dt) {
  const { W, unit } = eng;
  bubbleT -= dt;
  if (bubbleT <= 0) {
    bubbleT = eng.light() ? 0.6 : 0.3;
    const w = pickOne(weeds);
    if (w) addBubble(w.x + rand(-10, 10), P.floorY - rand(0, 20) * unit, rand(0.5, 1.1));
  }
  for (const c of skyClouds) {
    c.x += c.v * unit * dt;
    if (c.x > W + 100 * unit) c.x = -100 * unit;
  }
  // the duck
  if (!duck.on) {
    state.duckT -= dt;
    if (state.duckT <= 0) {
      duck.on = true;
      duck.dir = Math.random() < 0.5 ? 1 : -1;
      duck.x = duck.dir > 0 ? -50 * unit : W + 50 * unit;
      duck.quacked = false;
    }
  } else {
    duck.x += duck.dir * 32 * unit * dt;
    if (duck.hop > 0) duck.hop -= dt;
    if (!duck.quacked && duck.x > 60 * unit && duck.x < W - 60 * unit) {
      duck.quacked = true;
      if (Math.random() < 0.6) snd.quack();
    }
    if ((duck.dir > 0 && duck.x > W + 60 * unit) || (duck.dir < 0 && duck.x < -60 * unit)) {
      duck.on = false;
      state.duckT = rand(18, 32);
    }
  }
}

function tapDuck(x, y) {
  if (!duck.on) return false;
  const s = P.bs * 0.9;
  const dy = P.surfaceY - (scene.DUCK_WATER - scene.DUCK_H / 2) * s;
  if (Math.hypot(x - duck.x, y - dy) > 50 * eng.unit) return false;
  duck.hop = 0.5;
  snd.quack();
  eng.text(duck.x, dy - 40 * eng.unit, '♥', '#ff7ac6', 34, 0.9);
  eng.ring(duck.x, P.surfaceY + 2, 'rgba(255,255,255,0.8)', 6, 100, 3);
  return true;
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------
let clockT = 0;

function drawFish(f, t) {
  const D = eng.DPR;
  const sx = f.faceK * f.s;
  const s = f.s;
  ctx.setTransform(D, 0, 0, D, 0, 0);
  if (f.sp.rare) {
    const z = 120 * s * (1 + Math.sin(t * 4 + f.ph) * 0.08);
    ctx.globalAlpha = 0.8;
    ctx.drawImage(f.sp.rare === 'rainbow' ? glowImg : goldGlow, f.x - z / 2, f.y - z / 2, z, z);
    ctx.globalAlpha = 1;
  }
  ctx.translate(f.x, f.y);
  if (f.rot) ctx.rotate(f.rot);
  const squash = (f.sp.kind === 'jelly' || f.sp.kind === 'octopus') ? 1 + Math.sin(f.age * 3 + f.ph) * 0.07 : 1;
  ctx.scale(f.sp.kind === 'crab' || f.sp.kind === 'jelly' || f.sp.kind === 'octopus' ? s : sx, s);
  drawCreature(ctx, f.a, f.age + f.ph, {
    wag: f.wag,
    happy: f.happy > 0 || f.st === 'hooked',
    puff: f.sp.kind === 'puffer' && f.puff > 0.5,
    squash,
    step: f.step,
    wave: f.sp.kind === 'crab' && (f.st === 'hooked' || f.st === 'nibble'),
  });
  ctx.setTransform(D, 0, 0, D, 0, 0);
  if (f.notice > 0) {
    const k = Math.min(1, (1.1 - f.notice) / 0.15);
    const img = eng.textSprite('!', '#ffe866', 34 * eng.unit);
    const b = boundsOf(f.sp);
    const yy = f.y - (b.top + 14) * s - Math.sin(t * 12) * 3;
    const z = 0.6 + 0.4 * k;
    ctx.globalAlpha = Math.min(1, f.notice * 4);
    ctx.drawImage(img, f.x - (img.cssW * z) / 2, yy - (img.cssH * z) / 2, img.cssW * z, img.cssH * z);
    ctx.globalAlpha = 1;
  }
}

function drawWeeds(t) {
  const { unit } = eng;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const wd of weeds) {
    const segs = 6;
    const step = wd.h / segs;
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? wd.col : '#1d7a45';
      ctx.lineWidth = pass ? wd.w : wd.w + 5 * unit;
      ctx.beginPath();
      ctx.moveTo(wd.x, P.floorY + 10 * unit);
      for (let i = 1; i <= segs; i++) {
        const sway = Math.sin(t * 1.3 + wd.ph + i * 0.55) * i * 2.4 * unit;
        ctx.lineTo(wd.x + sway, P.floorY + 10 * unit - i * step);
      }
      ctx.stroke();
    }
  }
}

function drawRays(t) {
  const D = eng.DPR;
  const h = (P.floorY - P.surfaceY) * 1.05;
  for (const r of rays) {
    const a = 0.22 + Math.sin(t * 0.6 + r.ph) * 0.1;
    ctx.globalAlpha = a;
    ctx.setTransform(D, 0, D * 0.25, D, D * (r.x + Math.sin(t * 0.3 + r.ph) * 10), D * P.surfaceY);
    ctx.drawImage(RAY, -r.w / 2, 0, r.w, h);
  }
  ctx.setTransform(D, 0, 0, D, 0, 0);
  ctx.globalAlpha = 1;
}

function drawSurface(t) {
  const { W, unit } = eng;
  const y0 = P.surfaceY;
  ctx.beginPath();
  ctx.moveTo(0, y0 + 16 * unit);
  for (let x = 0; x <= W + 12; x += 12) {
    ctx.lineTo(x, y0 + Math.sin(x * 0.03 + t * 2) * 2 * unit + Math.sin(x * 0.011 - t * 1.3) * 1.5 * unit);
  }
  ctx.lineTo(W, y0 + 16 * unit);
  ctx.closePath();
  ctx.fillStyle = 'rgba(95, 214, 238, 0.82)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3 * unit;
  ctx.beginPath();
  for (let x = 0; x <= W + 12; x += 12) {
    const y = y0 + Math.sin(x * 0.03 + t * 2) * 2 * unit + Math.sin(x * 0.011 - t * 1.3) * 1.5 * unit;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawBoat(t) {
  const D = eng.DPR;
  const bs = P.bs;
  const bob = Math.sin(t * 1.6) * 2.5 * eng.unit;
  const tilt = Math.sin(t * 1.2) * 0.025 + (boat.tx - boat.x) * 0.0006;
  ctx.setTransform(D, 0, 0, D, 0, 0);
  ctx.translate(boat.x, P.surfaceY + bob);
  ctx.rotate(tilt);
  ctx.scale(boat.faceK * bs, bs);
  const img = boat.joyT > 0 ? BOAT.joy : BOAT.calm;
  ctx.drawImage(img, -scene.BOAT_W / 2, -scene.BOAT_WATER, scene.BOAT_W, scene.BOAT_H);
  ctx.setTransform(D, 0, 0, D, 0, 0);
}

function drawRodAndLine(t) {
  const { unit } = eng;
  const tip = rodTip();
  const bs = P.bs;
  // the rod
  const mx = (tip.px + tip.x) / 2;
  const my = (tip.py + tip.y) / 2 + boat.bend * 14 * bs;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2d2442';
  ctx.lineWidth = 6.5 * bs;
  ctx.beginPath(); ctx.moveTo(tip.px, tip.py); ctx.quadraticCurveTo(mx, my, tip.x, tip.y); ctx.stroke();
  ctx.strokeStyle = '#c9824a';
  ctx.lineWidth = 3.5 * bs;
  ctx.beginPath(); ctx.moveTo(tip.px, tip.py); ctx.quadraticCurveTo(mx, my, tip.x, tip.y); ctx.stroke();
  // reel
  const rx = lerp(tip.px, tip.x, 0.18);
  const ry = lerp(tip.py, tip.y, 0.18) + 6 * bs;
  ctx.beginPath(); ctx.arc(rx, ry, 6 * bs, 0, TAU);
  ctx.fillStyle = '#9fb0c9'; ctx.fill();
  ctx.lineWidth = 2.4 * bs; ctx.stroke();
  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(line.st === 'reel' ? t * 18 : 0);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7 * bs, 0); ctx.stroke();
  ctx.restore();

  const lineCol = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = Math.max(1.2, 1.6 * unit);
  ctx.strokeStyle = lineCol;
  if (line.st === 'idle' || line.st === 'card') {
    // a little hook dangling from the rod tip
    const hx = tip.x + Math.sin(t * 2) * 3;
    const hy = tip.y + 34 * bs;
    ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(hx, hy); ctx.stroke();
    drawHook(hx, hy);
    return;
  }
  if (line.st === 'cast') {
    ctx.beginPath(); ctx.moveTo(tip.x, tip.y);
    ctx.quadraticCurveTo((tip.x + line.hx) / 2, Math.max(tip.y, line.hy) + 20 * unit, line.hx, line.hy);
    ctx.stroke();
    drawBobber(line.hx, line.hy - 10 * unit, 0);
    return;
  }
  if (line.st === 'jump') {
    if (!flying) return;
    ctx.beginPath(); ctx.moveTo(tip.x, tip.y);
    ctx.quadraticCurveTo((tip.x + flying.x) / 2, Math.max(tip.y, flying.y) + 30 * unit, flying.x, flying.y);
    ctx.stroke();
    return;
  }
  // rod tip to the bobber, sagging a little
  const by = P.surfaceY + Math.sin(t * 3) * 1.5 * unit + line.dip * 12 * unit;
  ctx.beginPath(); ctx.moveTo(tip.x, tip.y);
  ctx.quadraticCurveTo((tip.x + line.bx) / 2, Math.max(tip.y, by) - (line.st === 'reel' ? 0 : -10 * unit), line.bx, by);
  ctx.stroke();
  // bobber to hook, under the water
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = Math.max(1, 1.2 * unit);
  ctx.beginPath(); ctx.moveTo(line.bx, by); ctx.lineTo(line.hx, line.hy); ctx.stroke();
  drawHook(line.hx, line.hy);
  line.bobY = by;
}

function drawHook(x, y) {
  const s = eng.unit;
  ctx.strokeStyle = '#2d2442';
  ctx.lineWidth = 2.6 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y - 6 * s);
  ctx.lineTo(x, y + 4 * s);
  ctx.arc(x - 4 * s, y + 4 * s, 4 * s, 0, Math.PI * 0.95);
  ctx.stroke();
  ctx.fillStyle = '#ff7ac6';
  ctx.beginPath(); ctx.arc(x, y - 6 * s, 3.4 * s, 0, TAU); ctx.fill();
  ctx.lineWidth = 1.6 * s;
  ctx.stroke();
}

function drawBobber(x, y, sink) {
  const s = eng.unit;
  const w = scene.BOBBER_W * s;
  const h = scene.BOBBER_H * s;
  ctx.drawImage(BOBBER, x - w / 2, y - h * 0.6 + sink, w, h);
}

function drawDuck(t) {
  if (!duck.on) return;
  const D = eng.DPR;
  const s = P.bs * 0.9;
  const hop = duck.hop > 0 ? Math.sin((duck.hop / 0.5) * Math.PI) * 16 * eng.unit : 0;
  ctx.setTransform(D, 0, 0, D, 0, 0);
  ctx.translate(duck.x, P.surfaceY + Math.sin(t * 2.4) * 2 * eng.unit - hop);
  ctx.rotate(Math.sin(t * 2.4 + 1) * 0.06);
  ctx.scale(duck.dir * s, s);
  ctx.drawImage(DUCK, -scene.DUCK_W / 2, -scene.DUCK_WATER, scene.DUCK_W, scene.DUCK_H);
  ctx.setTransform(D, 0, 0, D, 0, 0);
}

function drawSkyClouds() {
  const { unit } = eng;
  for (const c of skyClouds) {
    const w = scene.CLOUD_W * c.s * unit;
    const h = scene.CLOUD_H * c.s * unit;
    const y = Math.max(10, P.surfaceY * c.k * 0.75);
    ctx.globalAlpha = 0.95;
    ctx.drawImage(CLOUD, c.x - w / 2, y, w, h);
  }
  ctx.globalAlpha = 1;
}

function drawFlying(t) {
  if (!flying) return;
  const fl = flying;
  const f = fl.f;
  const D = eng.DPR;
  const s = f.s * fl.sc;
  ctx.setTransform(D, 0, 0, D, 0, 0);
  if (f.sp.rare) {
    const z = 160 * s;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(goldGlow, fl.x - z / 2, fl.y - z / 2, z, z);
    ctx.globalAlpha = 1;
  }
  ctx.translate(fl.x, fl.y);
  ctx.rotate(fl.rot || 0);
  ctx.scale(f.sp.kind === 'crab' || f.sp.kind === 'jelly' || f.sp.kind === 'octopus' ? s : f.faceK * s, s);
  drawCreature(ctx, f.a, t, { wag: Math.sin(t * 20) * 0.5, happy: true, puff: f.sp.kind === 'puffer', wave: true, squash: 1 });
  ctx.setTransform(D, 0, 0, D, 0, 0);
}

function drawHint(t) {
  if (state.mode !== 'play' || line.st !== 'idle' || state.idle < (state.session ? 6 : 1.5) || currentScreen() !== null) return;
  const { W, unit } = eng;
  const x = clamp(boat.x + boat.face * 150 * unit, 60 * unit, W - 60 * unit);
  const y = lerp(P.surfaceY, P.floorY, 0.45);
  const k = (t * 1.2) % 1;
  ctx.globalAlpha = 1 - k;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4 * unit;
  ctx.beginPath(); ctx.arc(x, y, (14 + k * 34) * unit, 0, TAU); ctx.stroke();
  ctx.globalAlpha = 1;
  const img = eng.textSprite('👆', '#ffffff', 46 * unit);
  const bob = Math.abs(Math.sin(t * 4)) * 10 * unit;
  ctx.drawImage(img, x - img.cssW / 2 + 8 * unit, y + 14 * unit + bob, img.cssW, img.cssH);
}

function render(t) {
  eng.begin(false);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(pond, 0, 0, canvas.width, canvas.height);
  ctx.setTransform(eng.DPR, 0, 0, eng.DPR, 0, 0);
  drawSkyClouds();
  drawRays(t);
  drawWeeds(t);
  for (const f of fish) if (f.sp.kind !== 'crab') drawFish(f, t);
  for (const f of fish) if (f.sp.kind === 'crab') drawFish(f, t);
  drawBoat(t);
  drawDuck(t);
  if (line.st !== 'idle' && line.st !== 'card' && line.st !== 'cast' && line.st !== 'jump') {
    const by = line.bobY || P.surfaceY;
    drawBobber(line.bx, by, 0);
  }
  drawSurface(t);
  drawRodAndLine(t);
  drawFlying(t);
  eng.drawParticles();
  drawHint(t);
}

// ---------------------------------------------------------------------------
// Frame
// ---------------------------------------------------------------------------
let lastNow = performance.now();
function onFrame(dt, t) {
  const now = performance.now();
  eng.watch((now - lastNow) / 1000, false);
  lastNow = now;
  clockT = t;
  // boat glides toward where it is going and turns to face the cast
  boat.x = lerp(boat.x, boat.tx, 1 - Math.exp(-dt * 3));
  boat.faceK = lerp(boat.faceK, boat.face, Math.min(1, dt * 8));
  if (boat.joyT > 0) boat.joyT -= dt;
  if (state.mode === 'play' && line.st === 'idle') state.idle += dt;
  updateLine(dt);
  updateFish(dt, t);
  updateFlying(dt);
  updateAmbient(dt);
  eng.updateParticles(dt);
  render(t);
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
function tapFish(x, y) {
  for (const f of fish) {
    if (f.st !== 'swim') continue;
    if (Math.hypot(f.x - x, f.y - y) < 44 * f.s) {
      f.happy = 1.2;
      f.dash = 1;
      if (Math.random() < 0.5) f.dir *= -1;
      snd.blip(rand(0.9, 1.4));
      for (let i = 0; i < 4; i++) addBubble(f.x + rand(-10, 10), f.y - rand(0, 14), rand(0.5, 0.9));
      return true;
    }
  }
  return false;
}

onPointer(canvas, {
  down(p) {
    if (tapDuck(p.x, p.y)) return true;
    if (state.mode !== 'play' || currentScreen() !== null) {
      if (!tapFish(p.x, p.y) && p.y > P.surfaceY) addBubble(p.x, p.y, 1);
      return true;
    }
    if (p.y < P.surfaceY - 20 * eng.unit) {
      // tapping the sky: a little sparkle
      eng.sparkle(p.x, p.y, 22, -20);
      return true;
    }
    if (line.st === 'idle' || line.st === 'sink' || line.st === 'wait') {
      cast(p.x, Math.max(p.y, P.surfaceY + 40 * eng.unit));
    } else if (line.st === 'nibble' || line.st === 'reel') {
      // already catching one: little bubbles
      addBubble(p.x, Math.max(p.y, P.surfaceY + 20), 0.8);
    }
    return true;
  },
});

// ---------------------------------------------------------------------------
// Flow
// ---------------------------------------------------------------------------
function updateHud(bump) {
  $('#hud-count').textContent = state.session;
  $('#book-badge').textContent = speciesFound();
  if (bump) replayClass($('#catch-pill'), 'bump');
  updateTitle();
}

function updateTitle() {
  const n = speciesFound();
  $('#title-best').textContent = n ? `📖 ${n} / ${SPECIES.length} fish found` : '';
}

function startPlay() {
  sfx.unlock();
  goFullscreen();
  state.mode = 'play';
  state.idle = 0;
  showScreen(null);
  $('#hud').classList.remove('hidden');
  updateHud();
  sfx.chime([0, 4, 7, 12], 660, 0.08);
  talk(state.session ? 'Let\'s fish!' : 'Tap the water to go fishing!', true);
}

function goTitle() {
  if (caught) finishCard('release');
  state.mode = 'menu';
  if (line.st !== 'jump' && line.st !== 'card') {
    if (line.biter) letGo(line.biter);
    line.biter = null;
    line.st = 'idle';
    for (const o of fish) if (o.st === 'peek' || o.st === 'curious' || o.st === 'nibble') letGo(o);
  }
  $('#hud').classList.add('hidden');
  store.persist();
  updateTitle();
  showScreen('screen-title');
}

boot({
  onFrame,
  onResize() {
    eng.resize();
    eng.holdPerf(1.5);
    paintPondCache();
    layout();
    // a line in the water would be in the wrong place now: reel it back in
    if (line.st === 'cast' || line.st === 'sink' || line.st === 'wait' || line.st === 'nibble') {
      if (line.biter) letGo(line.biter);
      line.biter = null;
      line.st = 'idle';
    }
    for (const f of fish) if (f.st === 'peek' || f.st === 'curious') letGo(f);
  },
  onAction(action) {
    switch (action) {
      case 'play': startPlay(); break;
      case 'home': goTitle(); break;
      case 'book': openBook(); break;
      case 'book-done': closeBook(); break;
      case 'release': finishCard('release'); break;
      case 'keep': finishCard('keep'); break;
      case 'say-fish':
        if (caught) {
          talk(caught.sp.name, true);
          sfx.sparkle();
          replayClass($('.catch-pic'), 'bounce');
        }
        break;
    }
  },
  onBack(screen) {
    if (screen === 'screen-book') { closeBook(); return true; }
    if (screen === 'screen-catch') { finishCard('release'); return true; }
    if (screen === null) { goTitle(); return true; }
    return false;
  },
});
animateBackground(false);
fillPond();
boat.x = boat.tx = eng.W * 0.55;
layout();
updateTitle();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { eng.resize(); paintPondCache(); });

// a tiny hook for automated testing
window.__fishing = {
  state, line, boat, P, store, stats,
  get fish() { return fish; },
  get quality() { return eng.quality; },
  get caught() { return caught; },
  cast, startPlay, goTitle, openBook,
  spawn(id, x, y) { const f = makeFish(BY_ID[id], { x, y }); fish.push(f); return f; },
  duck() { state.duckT = 0; },
};
