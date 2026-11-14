// Fishing Pond: tap the water to drop the line, a fish always comes along,
// and every catch goes into the Fish Book. There is no way to fail.
// Four places to fish (pond, ocean, ice, jungle river), and the fish you keep
// swim in your own aquarium.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import { earnSticker } from '../../shared/js/rewards.js';
import {
  boot, $, fx, showScreen, currentScreen, celebrate, onPointer, createStore, rand, randInt, pickOne, clamp, lerp,
  vibrate, animateBackground, showBackground, centerOf, replayClass,
} from '../../shared/js/kit.js';
import { createEngine, goFullscreen, glowImg, makeSprite, dotSprite } from './engine.js';
import { motion } from '../../shared/js/motion.js';
import { SPECIES, BY_ID, buildArt, drawCreature, drawCreatureFlat, portrait, boundsOf, isWalker, isFlipless } from './fish.js';
import * as scene from './scene.js';
import * as snd from './sounds.js';

const TAU = Math.PI * 2;
const store = createStore('fishing', {
  caught: {}, total: 0, kept: 0, released: 0, bookDone: false,
  place: 'pond', tank: null, placesDone: {},
});
const TANK_MAX = 20; // fish swimming in the aquarium at once
// older saves: the kept pond fish move into the new aquarium
if (!Array.isArray(store.data.tank)) {
  store.data.tank = [];
  const had = SPECIES.filter((s) => store.data.caught[s.id]);
  for (let i = 0; i < Math.min(store.data.kept || 0, TANK_MAX); i++) if (had.length) store.data.tank.push(had[i % had.length].id);
}
if (!store.data.placesDone) store.data.placesDone = {};
if (store.data.bookDone) store.data.placesDone.pond = true;

// ---------------------------------------------------------------------------
// The places
// ---------------------------------------------------------------------------
const PLACES = [
  {
    id: 'pond', name: 'Pond', icon: '🏞️', tile: 'green', say: 'The sunny pond!', paint: scene.paintPond,
    boat: {}, surface: 'rgba(95, 214, 238, 0.82)', waves: 1, weeds: ['#3fcf7a', '#2fbf6a', '#5ad68a', '#28a860'], weedDark: '#1d7a45', rays: 0.22,
  },
  {
    id: 'ocean', name: 'Ocean', icon: '🌊', tile: 'blue', say: 'The big blue ocean!', paint: scene.paintOcean,
    boat: { hullTop: '#7fb8ff', hullBottom: '#2f6fd9' }, surface: 'rgba(76, 196, 240, 0.85)', waves: 2.4, weeds: ['#3fcf9a', '#2fbf8a', '#7fd65a', '#28a870'], weedDark: '#1d6a55', rays: 0.25,
  },
  {
    id: 'ice', name: 'Ice Fishing', icon: '🧊', tile: 'teal', say: 'Brrr! Ice fishing!', paint: scene.paintIce, ice: true,
    boat: { hull: 'sled', hat: 'beanie' }, surface: 'rgba(120, 210, 240, 0.85)', waves: 0.6, weeds: ['#5fbfa8', '#4fa898', '#7fd0b8'], weedDark: '#2a6a6a', rays: 0.12,
  },
  {
    id: 'jungle', name: 'Jungle River', icon: '🌴', tile: 'orange', say: 'The jungle river!', paint: scene.paintJungle,
    boat: { hull: 'canoe', hat: 'safari' }, surface: 'rgba(120, 224, 190, 0.8)', waves: 1.2, weeds: ['#5cd65c', '#3fbf4a', '#8fe05a', '#2fa84a'], weedDark: '#1d6a35', rays: 0.18,
  },
];
const PLACE_BY_ID = {};
PLACES.forEach((p) => { PLACE_BY_ID[p.id] = p; p.species = SPECIES.filter((s) => s.place === p.id); });
if (!PLACE_BY_ID[store.data.place]) store.data.place = 'pond';
let PLACE = PLACE_BY_ID[store.data.place];

// ---------------------------------------------------------------------------
// Canvas and sprites
// ---------------------------------------------------------------------------
const canvas = $('#game');
const eng = createEngine(canvas, { onQuality: () => { paintPondCache(); if (state.mode === 'tank') paintTankCache(); } });
const ctx = eng.ctx;

const RES = clamp((window.devicePixelRatio || 1) * clamp(Math.min(window.innerWidth, window.innerHeight) / 400, 0.8, 1.8), 2, 3.5);
// Fish sprites are made the first time a species is needed (there are many now).
const ART = {};
function artOf(sp) {
  if (!ART[sp.id]) ART[sp.id] = buildArt(sp, RES);
  return ART[sp.id];
}
const BOATS = {};
function boatOf(place) {
  if (!BOATS[place.id]) BOATS[place.id] = scene.buildBoat(RES, place.boat);
  return BOATS[place.id];
}
const BOBBER = scene.buildBobber(RES);
const DUCK = scene.buildDuck(RES);
const CLOUD = scene.buildCloud(RES);
const RAY = scene.buildRay();
const BUBBLE = scene.buildBubble(RES);
let WHALE = null;
let SEAL = null;
let PENGUIN = null;
let FROG = null;
let CHEST = null;
const goldGlow = makeSprite(64, 64, (c) => {
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255, 240, 140, 0.85)');
  g.addColorStop(0.45, 'rgba(255, 210, 60, 0.35)');
  g.addColorStop(1, 'rgba(255, 210, 60, 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
}, 1);

// ---------------------------------------------------------------------------
// Layout and the cached pond picture
// ---------------------------------------------------------------------------
const P = { surfaceY: 200, floorY: 700, dockW: 80, deckY: 180, bs: 1, holes: null, iceTop: 0 };
const pond = document.createElement('canvas');
let weeds = [];
let rays = [];
let skyClouds = [];

function paintPondCache() {
  const { W, H } = eng;
  if (!W || !H) return;
  // painted at the game canvas's own resolution, so the copy each frame is a plain
  // 1:1 pixel copy (a scaled full-screen copy costs several times more)
  const s = eng.DPR;
  pond.width = Math.round(W * s);
  pond.height = Math.round(H * s);
  const c = pond.getContext('2d');
  c.setTransform(s, 0, 0, s, 0, 0);
  const r = PLACE.paint(c, W, H);
  P.surfaceY = r.surfaceY;
  P.floorY = r.floorY;
  P.dockW = r.dockW;
  P.deckY = r.deckY;
  P.holes = r.holes || null;
  P.iceTop = r.iceTop || r.surfaceY;
  resetScenery();
}

function layout() {
  const { W, H, unit } = eng;
  P.bs = unit * (H < 520 ? 0.72 : 0.9);
  weeds = [];
  const n = Math.max(4, Math.round(W / (75 * unit))) - (PLACE.ice ? 2 : 0);
  const greens = PLACE.weeds;
  for (let i = 0; i < n; i++) {
    weeds.push({
      x: ((i + 0.2 + Math.random() * 0.6) / n) * W,
      h: rand(0.25, PLACE.id === 'ocean' ? 0.6 : 0.5) * (P.floorY - P.surfaceY),
      ph: rand(0, TAU),
      col: greens[i % greens.length],
      w: rand(7, 10) * unit,
    });
  }
  rays = [0.12, 0.38, 0.64, 0.88].map((fx) => ({ x: fx * W, w: rand(60, 110) * unit, ph: rand(0, TAU) }));
  resetScenery();
  if (!skyClouds.length) {
    skyClouds = [0.15, 0.55, 0.9].map((fx) => ({ x: fx * W, k: rand(0.2, 0.7), s: rand(0.6, 0.95), v: rand(5, 10) }));
  }
  boat.x = clamp(boat.x || W * 0.5, boatMinX(), boatMaxX());
  boat.tx = clamp(boat.tx || boat.x, boatMinX(), boatMaxX());
  friends.penguinX = W - Math.max(40 * unit, W * 0.08);
  friends.frogX = W * 0.15 + 30 * unit;
}

const waterTop = () => P.surfaceY + (PLACE.ice ? 44 : 34) * eng.unit;
const waterBottom = () => P.floorY - 30 * eng.unit;
const boatMinX = () => (PLACE.ice ? 50 * P.bs : P.dockW + 70 * P.bs);
const boatMaxX = () => eng.W - (PLACE.ice ? 50 : 66) * P.bs;
/** Where the boat sits on the water (the sled sits on top of the ice). */
const boatY = () => (PLACE.ice ? P.iceTop : P.surfaceY);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = { mode: 'menu', session: 0, idle: 0, lastPlay: 0, duckT: 8 };
const stats = { spawns: 0, sinceGold: 0, sinceRainbow: 0 };
let fish = [];
let flying = null; // the caught fish jumping up to the card, or diving back in
let spawnTimer = 0;
const boat = { x: 0, tx: 0, face: 1, faceK: 1, joyT: 0, bend: 0 };
const line = { st: 'idle', t: 0, bx: 0, hx: 0, hy: 0, tx: 0, ty: 0, cx0: 0, cy0: 0, waitT: 0, biter: null, dipped: 0, dip: 0, fishSp: null };
const duck = { on: false, x: 0, dir: 1, hop: 0 };
// the other places' friends
const friends = { whale: null, whaleT: 6, seal: null, sealT: 5, penguinX: 0, penguinFlap: 0, frogX: 0, frogJump: 0, frogT: 6 };
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

function countKind(kind) {
  let n = 0;
  for (const f of fish) if (f.sp.kind === kind) n++;
  return n;
}

const CAPS = { crab: 1, lobster: 1, eel: 1, octopus: 1, jelly: 2, puffer: 2, turtle: 1, ray: 1, seahorse: 2 };
function pickSpecies() {
  stats.spawns++;
  const caughtData = store.data.caught;
  const list = PLACE.species;
  const rainbow = list.filter((s) => s.rare === 'rainbow');
  if (rainbow.length && !fish.some((f) => f.sp.rare === 'rainbow') && (Math.random() < 1 / 110 || stats.sinceRainbow > 110)) {
    stats.sinceRainbow = 0;
    return rainbow[0];
  }
  stats.sinceRainbow++;
  const golds = list.filter((s) => s.rare === 'gold');
  if (golds.length && (Math.random() < 1 / 25 || stats.sinceGold > 38) && fish.filter((f) => f.sp.rare).length < 2) {
    stats.sinceGold = 0;
    const weighted = [];
    golds.forEach((s) => { const w = caughtData[s.id] ? 1 : 3; for (let i = 0; i < w; i++) weighted.push(s); });
    return pickOne(weighted);
  }
  stats.sinceGold++;
  const pool = [];
  for (const s of list) {
    if (s.rare) continue;
    if (CAPS[s.kind] != null && countKind(s.kind) >= CAPS[s.kind]) continue;
    const w = caughtData[s.id] ? 2 : 3;
    for (let i = 0; i < w; i++) pool.push(s);
  }
  return pickOne(pool.length ? pool : list.filter((s) => !s.rare));
}

function makeFish(sp, opts = {}) {
  const { W, unit } = eng;
  // (sizes in steps of 5%, so fish of one species can share their 1:1 copies)
  const s = unit * (Math.round(rand(0.85, 1.05) * 20) / 20) * (sp.kind === 'eel' ? 0.9 : 1);
  const dir = opts.dir || (Math.random() < 0.5 ? 1 : -1);
  const b = boundsOf(sp);
  const margin = Math.max(b.left, b.right) * s + 20;
  const f = {
    sp, a: artOf(sp), s, dir, faceK: dir, margin,
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
  if (opts.y != null && !isWalker(sp)) { f.y = opts.y; f.depthK = depthOf(f.y); }
  return f;
}

function depthOf(y) {
  return clamp((y - waterTop()) / Math.max(1, waterBottom() - waterTop()), 0, 1);
}
const walkerLift = (sp) => (sp.kind === 'lobster' ? 0.62 : 0.55);
function swimY(f) {
  if (isWalker(f.sp)) return P.floorY - f.sp.r * walkerLift(f.sp) * f.s;
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
    case 'ray': return { x: hx - f.dir * sp.r * 0.9 * s, y: hy };
    case 'turtle': return { x: hx - f.dir * sp.r * 1.45 * s, y: hy + sp.r * 0.05 * s };
    case 'seahorse': return { x: hx - f.dir * sp.r * 0.98 * s, y: hy + sp.r * 0.88 * s };
    case 'crab': return { x: hx - f.dir * sp.r * 1.15 * s, y: P.floorY - sp.r * 0.55 * s };
    case 'lobster': return { x: hx - f.dir * sp.r * 1.5 * s, y: P.floorY - sp.r * 0.62 * s };
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
  if (sp.kind === 'lobster') return sp.r * 1.4 * f.s;
  if (sp.kind === 'ray') return sp.r * 0.9 * f.s;
  if (sp.kind === 'turtle') return sp.r * 1.45 * f.s;
  if (sp.kind === 'seahorse') return sp.r * 1.2 * f.s;
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
    const walker = isWalker(f.sp);

    switch (f.st) {
      case 'swim':
      case 'flee': {
        const boost = f.st === 'flee' || f.dash > 0 ? 2.4 : 1;
        if (f.dash > 0) f.dash -= dt;
        f.x += f.dir * f.speed * boost * dt;
        if (walker) {
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
        f.y = walker ? swimY(f) : lerp(f.y, ty + Math.sin(f.age * 2) * 5 * unit, Math.min(1, dt * 1.2));
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
        if (f.sp.kind === 'seahorse') f.rot = 0;
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
        } else if (f.sp.kind === 'seahorse') {
          f.rot = wig * 0.4;
          f.x = line.hx - f.dir * f.sp.r * 0.98 * f.s;
          f.y = line.hy + f.sp.r * 0.88 * f.s;
        } else if (walker) {
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
  const by = boatY() + (PLACE.ice ? 0 : Math.sin(clockT * 1.6) * 2.5 * eng.unit);
  const px = boat.x + boat.faceK * (scene.PAWS[0] - scene.BOAT_W / 2) * bs;
  const py = by + (scene.PAWS[1] - scene.BOAT_WATER) * bs;
  const a = 0.95 - boat.bend * 0.35;
  const len = 100 * bs;
  return { px, py, x: px + boat.faceK * Math.cos(a) * len, y: py - Math.sin(a) * len };
}

function nearestHole(x) {
  let best = P.holes[0];
  for (const h of P.holes) if (Math.abs(h - x) < Math.abs(best - x)) best = h;
  return best;
}

function cast(x, y) {
  const { unit } = eng;
  const reach = 92 * P.bs + 26 * unit;
  let f = x >= boat.x ? 1 : -1;
  let bx = x;
  if (PLACE.ice) {
    // on the ice, the line goes down one of the holes; the hook swims over to where you tapped
    bx = nearestHole(x);
    f = bx > eng.W / 2 ? 1 : -1;
  }
  boat.face = f;
  boat.tx = clamp(bx - f * reach, boatMinX(), boatMaxX());
  const tip = rodTip();
  line.st = 'cast';
  line.t = 0;
  line.cx0 = tip.x;
  line.cy0 = tip.y;
  line.bx = clamp(bx, 20 * unit, eng.W - 20 * unit);
  line.hx = line.cx0;
  line.hy = line.cy0;
  line.tx = PLACE.ice ? clamp(x, 30 * unit, eng.W - 30 * unit) : line.bx;
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

function splashColors() {
  return PLACE.id === 'jungle' ? ['#c9f5e6', '#ffffff', '#7fe0c0'] : ['#bff0ff', '#ffffff', '#7fd8ff'];
}

function landHook() {
  const { unit } = eng;
  line.st = 'sink';
  line.t = 0;
  line.hx = line.bx;
  line.hxBase = line.bx;
  line.hy = P.surfaceY;
  snd.plop();
  eng.ring(line.bx, P.surfaceY + 2, 'rgba(255,255,255,0.9)', 6, 120, 4);
  eng.ring(line.bx, P.surfaceY + 2, 'rgba(255,255,255,0.7)', 2, 70, 3);
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + rand(-1, 1);
    const sp = rand(80, 200) * unit;
    eng.drip(line.bx, P.surfaceY, Math.cos(a) * sp, Math.sin(a) * sp, pickOne(splashColors()), rand(3, 5));
  }
}

function chooseBiter(radius) {
  const nearFloor = line.hy > P.floorY - 70 * eng.unit;
  let best = null;
  let bd = Infinity;
  for (const f of fish) {
    if (f.st !== 'swim') continue;
    if (f.x < -10 || f.x > eng.W + 10) continue;
    if (isWalker(f.sp) && !nearFloor) continue;
    let d = Math.hypot(f.x - line.hx, f.y - line.hy);
    if (f.sp.rare) d *= 0.5;
    if (isWalker(f.sp)) d *= 0.6;
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
    if (peekers >= 2 || o === f || o.st !== 'swim' || isWalker(o.sp)) continue;
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
  eng.burst(line.bx, P.surfaceY, splashColors(), 16, 1.3, { sparks: 3, up: 120 });
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
        line.hxBase += (line.tx - line.hxBase) * Math.min(1, dt * 2.2);
        line.hx = line.hxBase + Math.sin(line.t * 2) * 3 * unit;
        if (Math.abs(d) < 1.5 && Math.abs(line.tx - line.hxBase) < 3) line.st = 'wait';
      } else {
        line.hx = line.tx + Math.sin(line.t * 2) * 3 * unit;
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
          const walker = PLACE.species.find((s) => isWalker(s) && !s.rare);
          const wantWalker = nearFloor && !!walker;
          let sp = pickSpecies();
          let tries = 0;
          while (isWalker(sp) !== wantWalker && tries++ < 20) sp = wantWalker && !fish.some((f) => isWalker(f.sp)) ? walker : pickSpecies();
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
    // diving back into the water
    const k = Math.min(1, fl.t / 0.6);
    fl.x = lerp(fl.x0, fl.x1, k);
    fl.y = lerp(fl.y0, fl.y1, k) - Math.sin(k * Math.PI) * 120 * eng.unit;
    fl.sc = lerp(fl.s0, 1, k);
    fl.rot = fl.f.dir * (k * 2.2 - 0.6);
    if (k >= 1) {
      const f = fl.f;
      snd.release();
      eng.burst(fl.x, P.surfaceY, splashColors(), 14, 1.2, { sparks: 2, up: 140 });
      eng.ring(fl.x, P.surfaceY + 2, 'rgba(255,255,255,0.9)', 8, 180, 5);
      f.x = fl.x;
      f.y = P.surfaceY + 30 * eng.unit;
      f.depthK = rand(0.2, 0.6);
      f.st = 'swim';
      f.rot = 0;
      f.dash = 2;
      f.happy = 1.5;
      f.notice = 0;
      if (isWalker(f.sp)) f.y = swimY(f);
      // a fish from another place (the aquarium is shared) swims home instead
      if (f.sp.place === PLACE.id) fish.push(f);
      for (let i = 0; i < 6; i++) addBubble(fl.x + rand(-20, 20), P.surfaceY + rand(20, 50) * eng.unit, rand(0.5, 1));
      flying = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Catch card, release, keep
// ---------------------------------------------------------------------------
const portraitCache = {};
function portraitOf(sp, size, sil) {
  const key = `${sp.id}|${size}|${sil ? 1 : 0}`;
  if (!portraitCache[key]) portraitCache[key] = portrait(artOf(sp), size, sil, !sil);
  return portraitCache[key];
}

const found = (list) => list.filter((s) => store.data.caught[s.id]).length;
function speciesFound() { return found(SPECIES); }

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
  c.drawImage(portraitOf(sp, 360, false), 0, 0, cv.width, cv.height);
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
  // a sticker: always for the shiny ones, otherwise now and then
  if (sp.rare) earnSticker('fishing', { cooldown: 0, delay: 1400 });
  else earnSticker('fishing', { delay: 1400 });
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
    store.data.tank.push(sp.id);
    if (store.data.tank.length > 60) store.data.tank = store.data.tank.slice(-60);
    const from = centerOf(card);
    const btn = state.mode === 'play' ? $('#book-btn') : null;
    const to = btn ? centerOf(btn) : { x: eng.W - 40, y: 40 };
    card.style.setProperty('--tx', `${to.x - from.x}px`);
    card.style.setProperty('--ty', `${to.y - from.y}px`);
    card.classList.add('to-book');
    sfx.whoosh();
    talk(pickOne(['Into the fish book and the aquarium!', 'Off to your aquarium!', 'Keep it!', 'A new friend for your aquarium!']), true);
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
    const x1 = PLACE.ice ? nearestHole(boat.x) : clamp(boat.x + rand(-120, 120) * eng.unit, 60, W - 60);
    flying = {
      f, mode: 'down', t: 0,
      x0: W / 2, y0: H * 0.42, x1, y1: P.surfaceY,
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
}

function afterCard() {
  line.st = 'idle';
  line.biter = null;
  state.idle = 0;
  updateHud();
  // a whole place found: a big celebration (once)
  const list = PLACE.species;
  if (!store.data.placesDone[PLACE.id] && found(list) === list.length) {
    store.data.placesDone[PLACE.id] = true;
    if (PLACE.id === 'pond') store.data.bookDone = true;
    store.persist();
    setTimeout(() => {
      celebrate(`${PLACE.name} done!`, 'You found every fish here!');
      talk(`You found every fish in the ${PLACE.name}! Hooray!`, true);
      earnSticker('fishing', { cooldown: 0, delay: 1800 });
    }, 600);
  }
}

// ---------------------------------------------------------------------------
// Fish book (a page for each place)
// ---------------------------------------------------------------------------
let bookReturn = 'screen-title';
let bookPlace = PLACE.id;
function openBook() {
  bookReturn = currentScreen() === 'screen-title' ? 'screen-title' : null;
  $('#hud').classList.add('hidden');
  bookPlace = PLACE.id;
  buildBook();
  showScreen('screen-book');
  const n = speciesFound();
  talk(n === 0 ? 'Your fish book! Go catch some fish!' : `You found ${n} kinds of fish!`, true);
}
function closeBook() {
  showScreen(bookReturn);
  if (bookReturn === null && state.mode === 'play') $('#hud').classList.remove('hidden');
}

function buildTabs() {
  const tabs = $('#book-tabs');
  tabs.innerHTML = '';
  PLACES.forEach((pl) => {
    const b = document.createElement('button');
    const on = pl.id === bookPlace;
    b.className = `book-tab tab-${pl.tile}` + (on ? ' on' : '');
    b.setAttribute('aria-label', pl.name);
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = `<span class="tab-ico">${pl.icon}</span><span class="tab-n">${found(pl.species)}/${pl.species.length}</span>`;
    b.addEventListener('click', () => {
      sfx.unlock();
      sfx.pick(PLACES.indexOf(pl));
      bookPlace = pl.id;
      buildBook();
      talk(pl.name, true);
    });
    tabs.appendChild(b);
  });
}

function buildBook() {
  buildTabs();
  const grid = $('#book-grid');
  grid.innerHTML = '';
  grid.scrollTop = 0;
  const pl = PLACE_BY_ID[bookPlace];
  const list = pl.species;
  const nf = found(list);
  $('#book-text').textContent = `${nf} / ${list.length}`;
  $('#book-fill').style.width = `${(nf / list.length) * 100}%`;
  list.forEach((sp, i) => {
    const n = store.data.caught[sp.id] || 0;
    const btn = document.createElement('button');
    btn.className = 'fish-card' + (n ? '' : ' locked') + (sp.rare ? ` ${sp.rare}` : '');
    btn.style.animationDelay = `${i * 0.03}s`;
    btn.setAttribute('aria-label', n ? sp.name : 'Not found yet');
    const cv = document.createElement('canvas');
    cv.width = 240;
    cv.height = 180;
    cv.getContext('2d').drawImage(portraitOf(sp, 240, !n), 0, 0);
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
// Ambient life: bubbles, the duck, and each place's friends
// ---------------------------------------------------------------------------
function addBubble(x, y, size = 1) {
  const top = state.mode === 'tank' ? T.waterY : P.surfaceY;
  if (y < top + 8) return;
  const vy = -rand(40, 70) * eng.unit;
  eng.add({
    type: 'bubble', x, y, vy, img: BUBBLE, size: 14 * eng.unit * size * rand(0.7, 1.2),
    life: (y - top - 4) / -vy, max: 99,
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
  // the duck (on the pond)
  if (PLACE.id === 'pond') {
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
  // a whale passing far away in the ocean
  if (PLACE.id === 'ocean') {
    if (!friends.whale) {
      friends.whaleT -= dt;
      if (friends.whaleT <= 0) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const w = Math.min(W * 0.75, 360 * unit);
        friends.whale = { dir, w, x: dir > 0 ? -w : W + w, y: lerp(waterTop(), waterBottom(), rand(0.35, 0.6)), t: 0 };
        if (Math.random() < 0.5) snd.whale();
      }
    } else {
      const wh = friends.whale;
      wh.t += dt;
      wh.x += wh.dir * 30 * unit * dt;
      if ((wh.dir > 0 && wh.x > W + wh.w) || (wh.dir < 0 && wh.x < -wh.w)) { friends.whale = null; friends.whaleT = rand(22, 36); }
    }
  }
  // a seal popping out of a hole in the ice
  if (PLACE.ice) {
    if (friends.penguinFlap > 0) friends.penguinFlap -= dt;
    if (!friends.seal) {
      friends.sealT -= dt;
      if (friends.sealT <= 0) {
        const holes = P.holes.filter((h) => Math.abs(h - line.bx) > 40 * unit || line.st === 'idle');
        const hx = holes.length ? pickOne(holes) : P.holes[0];
        // not where the cat is fishing
        if (line.st === 'idle' || Math.abs(hx - line.bx) > 40 * unit) {
          friends.seal = { x: hx, t: 0, dur: 4.5, happy: 0 };
          snd.seal();
        } else friends.sealT = 2;
      }
    } else {
      const se = friends.seal;
      se.t += dt;
      if (se.happy > 0) se.happy -= dt;
      if (se.t >= se.dur) { friends.seal = null; friends.sealT = rand(14, 24); }
    }
  }
  // the frog on its lily pad
  if (PLACE.id === 'jungle') {
    if (friends.frogJump > 0) friends.frogJump -= dt;
    friends.frogT -= dt;
    if (friends.frogT <= 0) {
      friends.frogT = rand(10, 18);
      if (friends.frogJump <= 0 && Math.random() < 0.6) { friends.frogJump = 0.7; snd.ribbit(); }
    }
  }
}

function tapDuck(x, y) {
  if (PLACE.id !== 'pond' || !duck.on) return false;
  const s = P.bs * 0.9;
  const dy = P.surfaceY - (scene.DUCK_WATER - scene.DUCK_H / 2) * s;
  if (Math.hypot(x - duck.x, y - dy) > 50 * eng.unit) return false;
  duck.hop = 0.5;
  snd.quack();
  eng.text(duck.x, dy - 40 * eng.unit, '♥', '#ff7ac6', 34, 0.9);
  eng.ring(duck.x, P.surfaceY + 2, 'rgba(255,255,255,0.8)', 6, 100, 3);
  return true;
}

function tapFriends(x, y) {
  const { unit } = eng;
  const s = P.bs;
  if (PLACE.ice) {
    const se = friends.seal;
    if (se && Math.hypot(x - se.x, y - (P.iceTop - 20 * s)) < 50 * unit) {
      se.happy = 0.8;
      se.dur = Math.max(se.dur, se.t + 2);
      snd.seal();
      eng.text(se.x, P.iceTop - 70 * s, '♥', '#ff7ac6', 34, 0.9);
      talk(pickOne(['Arf arf!', 'Hello, seal!', 'A happy seal!']));
      return true;
    }
    const py = P.iceTop - (scene.PENGUIN_H / 2) * s;
    if (Math.hypot(x - friends.penguinX, y - py) < 50 * unit) {
      friends.penguinFlap = 0.8;
      snd.squeak();
      eng.text(friends.penguinX, py - 50 * s, '♥', '#ff7ac6', 34, 0.9);
      talk(pickOne(['Hello, penguin!', 'Flap flap!', 'Waddle waddle!']));
      return true;
    }
  }
  if (PLACE.id === 'jungle') {
    const fy = P.surfaceY - 14 * s;
    if (Math.hypot(x - friends.frogX, y - fy) < 50 * unit) {
      friends.frogJump = 0.7;
      snd.ribbit();
      eng.text(friends.frogX, fy - 50 * s, '♥', '#ff7ac6', 34, 0.9);
      eng.ring(friends.frogX, P.surfaceY + 2, 'rgba(255,255,255,0.8)', 6, 100, 3);
      return true;
    }
  }
  return false;
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
  const squash = (f.sp.kind === 'jelly' || f.sp.kind === 'octopus') ? 1 + Math.sin(f.age * 3 + f.ph) * 0.07 : 1;
  const pose = {
    wag: f.wag,
    happy: f.happy > 0 || f.st === 'hooked',
    puff: f.sp.kind === 'puffer' && f.puff > 0.5,
    squash,
    step: f.step,
    wave: isWalker(f.sp) && (f.st === 'hooked' || f.st === 'nibble'),
  };
  // swimming straight (not tilted or turning): copied 1:1, which is much cheaper
  const flip = isFlipless(f.sp) ? 1 : f.dir;
  const straight = !f.rot && (isFlipless(f.sp) || Math.abs(f.faceK - f.dir) < 0.004);
  if (!straight || !drawCreatureFlat(ctx, f.a, pose, f.x, f.y, s, flip, D)) {
    ctx.translate(f.x, f.y);
    if (f.rot) ctx.rotate(f.rot);
    ctx.scale(isFlipless(f.sp) ? s : sx, s);
    drawCreature(ctx, f.a, f.age + f.ph, pose);
    ctx.setTransform(D, 0, 0, D, 0, 0);
  }
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

function drawWeeds(t, list, floorY, dark) {
  const { unit } = eng;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const wd of list) {
    const segs = 6;
    const step = wd.h / segs;
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? wd.col : dark;
      ctx.lineWidth = pass ? wd.w : wd.w + 5 * unit;
      ctx.beginPath();
      ctx.moveTo(wd.x, floorY + 10 * unit);
      for (let i = 1; i <= segs; i++) {
        const sway = Math.sin(t * 1.3 + wd.ph + i * 0.55) * i * 2.4 * unit;
        ctx.lineTo(wd.x + sway, floorY + 10 * unit - i * step);
      }
      ctx.stroke();
    }
  }
}

// A ray is the RAY sprite stretched and slanted; doing that every frame was the most
// expensive thing in the scene. Each ray is now drawn that way once, at the canvas's
// own resolution, into its own canvas, and each frame only copied 1:1 (in a few
// horizontal bands, skipping the empty corners of the slanted box).
const RAY_SKEW = 0.25;
const RAY_BANDS = 6;
function raySprite(r, h, D) {
  const key = `${D}|${h}|${r.w}`;
  if (r.img && r.img.key === key) return r.img;
  const pad = Math.ceil((r.w / 60 + 2) * D); // the stretched sprite's soft edge
  const left = -r.w / 2; // local x of the box's left edge (bottom-left corner)
  const cw = Math.ceil((r.w + RAY_SKEW * h) * D) + pad * 2;
  const ch = Math.ceil(h * D) + 2;
  const cv = r.img && r.img.width ? r.img : document.createElement('canvas');
  cv.width = cw;
  cv.height = ch;
  const c = cv.getContext('2d');
  // the same drawing as before, with the slant, just without the moving offset
  c.setTransform(D, 0, D * RAY_SKEW, D, pad - left * D, 0);
  c.drawImage(RAY, -r.w / 2, 0, r.w, h);
  cv.key = key;
  cv.ox = pad - left * D; // where local x = 0 is, in sprite pixels
  // the parts of each band that hold any light: the ray widens and slants as it goes down
  cv.bands = [];
  for (let i = 0; i < RAY_BANDS; i++) {
    const y0 = Math.floor((i * ch) / RAY_BANDS);
    const y1 = Math.floor(((i + 1) * ch) / RAY_BANDS);
    const k0 = y0 / D / h;
    const k1 = y1 / D / h;
    const xl = Math.min(-0.2 - 0.3 * k0, -0.2 - 0.3 * k1) * r.w + RAY_SKEW * h * k0;
    const xr = Math.max(0.2 + 0.3 * k0, 0.2 + 0.3 * k1) * r.w + RAY_SKEW * h * k1;
    const sx = Math.max(0, Math.floor(cv.ox + xl * D) - pad);
    const ex = Math.min(cw, Math.ceil(cv.ox + xr * D) + pad);
    cv.bands.push([sx, y0, ex - sx, y1 - y0]);
  }
  r.img = cv;
  return cv;
}

/** One ray onto canvas context c (its transform is left at 1:1). */
function drawRay(c, r, t) {
  const D = eng.DPR;
  const a = PLACE.rays + Math.sin(t * 0.6 + r.ph) * 0.1;
  if (a <= 0) return;
  const h = (P.floorY - P.surfaceY) * 1.05;
  const top = PLACE.ice ? P.surfaceY + 18 * eng.unit : P.surfaceY;
  const img = raySprite(r, h, D);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = a;
  const dx = Math.round(D * (r.x + Math.sin(t * 0.3 + r.ph) * 10) - img.ox);
  const dy = Math.round(D * top);
  for (const b of img.bands) c.drawImage(img, b[0], b[1], b[2], b[3], dx + b[0], dy + b[1], b[2], b[3]);
  c.globalAlpha = 1;
}

function drawRays(t) {
  for (const r of rays) drawRay(ctx, r, t);
  ctx.setTransform(eng.DPR, 0, 0, eng.DPR, 0, 0);
}

// The still pond with the light rays on it, made into one picture a step at a time (one
// step per frame: the pond in two halves, then each ray), a fresh one about five times a
// second. Most frames then copy that one picture instead of the pond plus four big
// see-through rays. The rays drift and fade so slowly that the steps cannot be seen.
// While the whale swims by (it is behind the rays) everything is drawn live as before.
const scenery = { cur: document.createElement('canvas'), next: document.createElement('canvas'), ready: false, stage: 0, wait: 0 };
const SCENERY_WAIT = 4; // frames to rest between pictures
function resetScenery() {
  scenery.ready = false;
  scenery.stage = 0;
  scenery.wait = 0;
}
function stepScenery(t) {
  if (scenery.wait > 0) { scenery.wait--; return; }
  const n = scenery.next;
  const c = n.getContext('2d');
  const st = scenery.stage++;
  if (st < 2) {
    if (n.width !== pond.width || n.height !== pond.height) { n.width = pond.width; n.height = pond.height; }
    const y0 = st ? Math.floor(n.height / 2) : 0;
    const y1 = st ? n.height : Math.floor(n.height / 2);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.drawImage(pond, 0, y0, n.width, y1 - y0, 0, y0, n.width, y1 - y0);
  } else if (st - 2 < rays.length) {
    drawRay(c, rays[st - 2], t);
  } else {
    scenery.next = scenery.cur;
    scenery.cur = n;
    scenery.ready = true;
    scenery.stage = 0;
    scenery.wait = SCENERY_WAIT;
  }
}

function waveY(x, t) {
  const y0 = P.surfaceY;
  const u = eng.unit;
  const k = PLACE.waves;
  return y0 + Math.sin(x * 0.03 / Math.sqrt(k) + t * 2) * 2 * u * k + Math.sin(x * 0.011 - t * 1.3) * 1.5 * u * k;
}

function drawSurface(t) {
  const { W, unit } = eng;
  if (PLACE.ice) {
    // just a little water moving in each hole
    const hw = 34 * unit;
    ctx.fillStyle = PLACE.surface;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.4 * unit;
    for (const hx of P.holes) {
      ctx.beginPath();
      for (let x = hx - hw + 4 * unit; x <= hx + hw - 4 * unit; x += 6) {
        const y = P.surfaceY + Math.sin(x * 0.08 + t * 2.5) * 1.5 * unit;
        if (x === hx - hw + 4 * unit) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    return;
  }
  const y0 = P.surfaceY;
  ctx.beginPath();
  ctx.moveTo(0, y0 + 16 * unit);
  for (let x = 0; x <= W + 12; x += 12) ctx.lineTo(x, waveY(x, t));
  ctx.lineTo(W, y0 + 16 * unit);
  ctx.closePath();
  ctx.fillStyle = PLACE.surface;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3 * unit;
  ctx.beginPath();
  for (let x = 0; x <= W + 12; x += 12) {
    const y = waveY(x, t);
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (PLACE.id === 'ocean') {
    // little white wave caps
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2.2 * unit;
    for (let i = 0; i < 5; i++) {
      const x = ((i * 0.23 + t * 0.02) % 1.1) * W;
      const y = waveY(x, t) + 10 * unit;
      ctx.beginPath(); ctx.arc(x, y, 6 * unit, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    }
  }
}

function drawBoat(t) {
  const D = eng.DPR;
  const bs = P.bs;
  const bob = PLACE.ice ? 0 : Math.sin(t * 1.6) * 2.5 * eng.unit * Math.sqrt(PLACE.waves);
  const tilt = PLACE.ice ? (boat.tx - boat.x) * 0.0003 : Math.sin(t * 1.2) * 0.025 * Math.sqrt(PLACE.waves) + (boat.tx - boat.x) * 0.0006;
  ctx.setTransform(D, 0, 0, D, 0, 0);
  ctx.translate(boat.x, boatY() + bob);
  ctx.rotate(tilt);
  ctx.scale(boat.faceK * bs, bs);
  const B = boatOf(PLACE);
  const img = boat.joyT > 0 ? B.joy : B.calm;
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
  ctx.strokeStyle = PLACE.ice ? 'rgba(80, 90, 140, 0.9)' : lineCol;
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
  if (PLACE.id !== 'pond' || !duck.on) return;
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

function drawWhale(t) {
  const wh = friends.whale;
  if (!wh) return;
  if (!WHALE) WHALE = scene.buildWhale(RES);
  const D = eng.DPR;
  const h = (wh.w * scene.WHALE_H) / scene.WHALE_W;
  ctx.setTransform(D, 0, 0, D, 0, 0);
  ctx.globalAlpha = 0.5;
  ctx.translate(wh.x, wh.y + Math.sin(wh.t * 0.8) * 8 * eng.unit);
  ctx.rotate(Math.sin(wh.t * 0.8 + 1) * 0.03);
  ctx.scale(wh.dir, 1);
  ctx.drawImage(WHALE, -wh.w / 2, -h / 2, wh.w, h);
  ctx.setTransform(D, 0, 0, D, 0, 0);
  ctx.globalAlpha = 1;
  void t;
}

function drawIceFriends(t) {
  if (!PLACE.ice) return;
  const D = eng.DPR;
  const s = P.bs;
  // the penguin on the ice
  if (!PENGUIN) PENGUIN = scene.buildPenguin(RES);
  const flap = friends.penguinFlap > 0;
  const hop = flap ? Math.abs(Math.sin(friends.penguinFlap * 8)) * 8 * eng.unit : 0;
  ctx.setTransform(D, 0, 0, D, 0, 0);
  ctx.translate(friends.penguinX, P.iceTop + 2 - hop);
  ctx.rotate(Math.sin(t * 2) * 0.05);
  ctx.scale(-s, s);
  ctx.drawImage(flap && Math.sin(t * 20) > 0 ? PENGUIN.flap : PENGUIN.calm, -scene.PENGUIN_W / 2, -scene.PENGUIN_H, scene.PENGUIN_W, scene.PENGUIN_H);
  ctx.setTransform(D, 0, 0, D, 0, 0);
  // the seal popping up
  const se = friends.seal;
  if (se) {
    if (!SEAL) SEAL = scene.buildSeal(RES);
    const k = Math.min(1, se.t / 0.4, (se.dur - se.t) / 0.4);
    const up = Math.max(0, k) * (scene.SEAL_H * 0.9) * s;
    const hop = se.happy > 0 ? Math.abs(Math.sin(se.happy * 9)) * 6 * eng.unit : 0;
    ctx.save();
    // only the part above the water shows
    ctx.beginPath();
    ctx.rect(se.x - 40 * s, P.iceTop - 120 * s, 80 * s, 120 * s + (P.surfaceY - P.iceTop));
    ctx.clip();
    ctx.translate(se.x, P.surfaceY - up - hop);
    ctx.rotate(Math.sin(t * 3) * 0.06);
    ctx.scale(s, s);
    ctx.drawImage(SEAL, -scene.SEAL_W / 2, 0, scene.SEAL_W, scene.SEAL_H);
    ctx.restore();
    ctx.setTransform(D, 0, 0, D, 0, 0);
  }
}

function drawFrog(t) {
  if (PLACE.id !== 'jungle') return;
  if (!FROG) FROG = scene.buildFrog(RES);
  const D = eng.DPR;
  const s = P.bs;
  const u = eng.unit;
  const bob = Math.sin(t * 1.6) * 1.5 * u;
  ctx.setTransform(D, 0, 0, D, 0, 0);
  scene.paintLilyPad(ctx, friends.frogX, P.surfaceY + 3 * u + bob, u);
  const j = friends.frogJump > 0 ? Math.sin((1 - friends.frogJump / 0.7) * Math.PI) : 0;
  ctx.translate(friends.frogX, P.surfaceY + bob - j * 40 * u);
  ctx.scale(s, s);
  ctx.drawImage(j > 0.05 ? FROG.jump : FROG.sit, -scene.FROG_W / 2, -scene.FROG_H + 6, scene.FROG_W, scene.FROG_H);
  ctx.setTransform(D, 0, 0, D, 0, 0);
}

function drawSkyClouds() {
  const { unit } = eng;
  const D = eng.DPR;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const c of skyClouds) {
    const w = scene.CLOUD_W * c.s * unit;
    const h = scene.CLOUD_H * c.s * unit;
    const y = Math.max(10, P.surfaceY * c.k * 0.75);
    // each cloud is drawn at its size once, then copied 1:1
    const key = D + '|' + w;
    if (!c.img || c.img.key !== key) {
      c.img = makeSprite(w, h, (g) => g.drawImage(CLOUD, 0, 0, w, h), D);
      c.img.key = key;
    }
    ctx.globalAlpha = 0.95;
    ctx.drawImage(c.img, Math.round((c.x - w / 2) * D), Math.round(y * D));
  }
  ctx.setTransform(D, 0, 0, D, 0, 0);
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
  ctx.scale(isFlipless(f.sp) ? s : f.faceK * s, s);
  drawCreature(ctx, f.a, t, { wag: Math.sin(t * 20) * 0.5, happy: true, puff: f.sp.kind === 'puffer', wave: true, squash: 1, big: true });
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
  const baked = scenery.ready && !friends.whale && scenery.cur.width === canvas.width && scenery.cur.height === canvas.height;
  ctx.drawImage(baked ? scenery.cur : pond, 0, 0, canvas.width, canvas.height);
  ctx.setTransform(eng.DPR, 0, 0, eng.DPR, 0, 0);
  drawSkyClouds();
  if (!baked) {
    drawWhale(ambT);
    drawRays(ambT);
  }
  if (friends.whale) resetScenery();
  else if (!(motion.still && scenery.ready)) stepScenery(ambT); // Still: the rays don't move, so the picture is done
  drawWeeds(ambT, weeds, P.floorY, PLACE.weedDark);
  for (const f of fish) if (!isWalker(f.sp)) drawFish(f, t);
  for (const f of fish) if (isWalker(f.sp)) drawFish(f, t);
  drawDuck(t);
  drawFrog(t);
  drawIceFriends(t);
  drawBoat(t);
  if (line.st !== 'idle' && line.st !== 'card' && line.st !== 'cast' && line.st !== 'jump') {
    const by = line.bobY || P.surfaceY;
    drawBobber(line.bx, by, 0);
  }
  drawSurface(ambT);
  drawRodAndLine(t);
  drawFlying(t);
  eng.drawParticles();
  drawHint(t);
}

// ---------------------------------------------------------------------------
// The aquarium: every kept fish swims in a glass tank
// ---------------------------------------------------------------------------
const T = { x: 0, y: 0, wd: 0, ht: 0, waterY: 0, sandY: 0, s: 1 };
const tankCv = document.createElement('canvas');
let tankFish = [];
let tankWeeds = [];
let flakes = [];
const chest = { open: 0, t: 4 };
let tankBubbleT = 0;

function tankLayout() {
  const { W, H, unit } = eng;
  const hud = $('#tank-hud').getBoundingClientRect();
  const safe = (v) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v)) || 0;
  const sl = safe('--safe-left');
  const sr = safe('--safe-right');
  const sb = safe('--safe-bottom');
  T.x = 12 + sl;
  T.y = (hud.bottom || 80) + 16;
  T.wd = W - T.x - 12 - sr;
  T.ht = H - T.y - 14 - sb;
  T.s = clamp(Math.min(T.wd, T.ht * 1.3) / 430, 0.62, 1.35) * clamp(unit, 0.9, 1.3);
  void unit;
}

function paintTankCache() {
  const { W, H } = eng;
  if (!W || !H) return;
  tankLayout();
  const s = eng.DPR; // the canvas's own resolution: a 1:1 copy each frame
  tankCv.width = Math.round(W * s);
  tankCv.height = Math.round(H * s);
  const c = tankCv.getContext('2d');
  c.setTransform(s, 0, 0, s, 0, 0);
  const r = scene.paintTank(c, W, H, { x: T.x, y: T.y, wd: T.wd, ht: T.ht });
  T.waterY = r.waterY;
  T.sandY = r.sandY;
  tankWeeds = [];
  const n = Math.max(3, Math.round(T.wd / 110));
  const cols = ['#3fcf7a', '#5ad68a', '#2fbf6a', '#7fe06a'];
  for (let i = 0; i < n; i++) {
    tankWeeds.push({ x: T.x + ((i + 0.15 + Math.random() * 0.4) / n) * T.wd, h: rand(0.25, 0.5) * (T.sandY - T.waterY), ph: rand(0, TAU), col: cols[i % cols.length], w: rand(7, 10) * eng.unit });
  }
}

// keep the fish inside the glass
function tankBox(f) {
  const b = boundsOf(f.sp);
  const s = f.s;
  return {
    x0: T.x + Math.max(b.left, b.right) * s + 6,
    x1: T.x + T.wd - Math.max(b.left, b.right) * s - 6,
    y0: T.waterY + b.top * s + 4,
    y1: T.sandY - b.bottom * s + 4,
  };
}

function makeTankFish(sp, i) {
  const s = T.s * (Math.round(rand(0.85, 1) * 20) / 20); // steps of 5%: fish of a kind share their 1:1 copies
  const f = {
    sp, a: artOf(sp), s, dir: Math.random() < 0.5 ? 1 : -1, faceK: 1, x: 0, y: 0, tx: 0, ty: 0,
    speed: rand(sp.speed[0], sp.speed[1]) * eng.unit * 0.6, age: rand(0, 10), ph: rand(0, TAU), wag: 0,
    happy: 0, flip: 0, step: 0, wanderT: 0, target: null, puff: 0,
  };
  f.faceK = f.dir;
  const bx = tankBox(f);
  f.x = lerp(bx.x0, bx.x1, ((i * 0.37) % 1) * 0.8 + 0.1);
  f.y = isWalker(sp) ? bx.y1 : rand(bx.y0, Math.max(bx.y0, bx.y1));
  pickWander(f);
  return f;
}

function pickWander(f) {
  const bx = tankBox(f);
  f.tx = rand(bx.x0, Math.max(bx.x0, bx.x1));
  f.ty = isWalker(f.sp) ? bx.y1 : rand(bx.y0, Math.max(bx.y0, bx.y1));
  f.wanderT = rand(3, 7);
}

function fillTank() {
  const ids = store.data.tank.slice(-TANK_MAX);
  tankFish = ids.filter((id) => BY_ID[id]).map((id, i) => makeTankFish(BY_ID[id], i));
  flakes = [];
}

function feed() {
  if (!tankFish.length) { sfx.boing(); talk('Keep some fish first!', true); return; }
  const { unit } = eng;
  const cx = rand(T.x + T.wd * 0.25, T.x + T.wd * 0.75);
  const n = eng.light() ? 8 : 12;
  for (let i = 0; i < n && flakes.length < 36; i++) {
    flakes.push({ x: clamp(cx + rand(-90, 90) * unit, T.x + 20, T.x + T.wd - 20), y: T.waterY - rand(0, 20) * unit, vy: rand(22, 38) * unit, ph: rand(0, TAU), col: pickOne(['#ff9a4d', '#ffd23a', '#ff6b7d', '#8fe06a']), rest: 0, s: rand(5, 8) * unit });
  }
  snd.sprinkle();
  talk(pickOne(['Yummy food!', 'Dinner time!', 'Here you go, fishies!']));
  replayClass($('#feed-btn'), 'bump');
}

function updateTank(dt, t, adt) {
  const { unit } = eng;
  // food sinks slowly and rests on the sand for a while
  for (let i = flakes.length - 1; i >= 0; i--) {
    const fl = flakes[i];
    if (fl.y < T.sandY - 4 * unit) {
      fl.y += fl.vy * dt;
      fl.x += Math.sin(t * 2 + fl.ph) * 10 * unit * dt;
    } else {
      fl.rest += dt;
      if (fl.rest > 8) flakes.splice(i, 1);
    }
  }
  for (const f of tankFish) {
    f.age += dt;
    if (f.happy > 0) f.happy -= dt;
    if (f.flip > 0) f.flip = Math.max(0, f.flip - dt / 0.75);
    f.puff = lerp(f.puff, f.happy > 0.3 ? 1 : 0, Math.min(1, dt * 8));
    const walker = isWalker(f.sp);
    // go for the nearest food
    if (f.target && flakes.indexOf(f.target) < 0) f.target = null;
    if (!f.target && flakes.length) {
      let best = null;
      let bd = 320 * unit;
      for (const fl of flakes) {
        if (walker && fl.y < T.sandY - 20 * unit) continue;
        const d = Math.hypot(fl.x - f.x, fl.y - f.y);
        if (d < bd) { bd = d; best = fl; }
      }
      f.target = best;
      if (best) f.approach = best.x > f.x ? 1 : -1;
    }
    let tx = f.tx;
    let ty = f.ty;
    let boost = 1;
    const bx = tankBox(f);
    if (f.target) {
      const m = f.sp.kind === 'fish' ? f.sp.rx * f.s : (f.sp.r || 20) * f.s;
      tx = clamp(f.target.x - f.approach * m * 0.8, bx.x0, bx.x1);
      ty = walker ? bx.y1 : clamp(f.target.y, bx.y0, bx.y1);
      boost = 2.2;
      if (Math.hypot(f.target.x - f.x, f.target.y - f.y) < m * 1.3 + 10 * unit) {
        // munch!
        flakes.splice(flakes.indexOf(f.target), 1);
        f.target = null;
        f.happy = 0.9;
        snd.munch();
        eng.sparkle(f.x + f.dir * 20 * f.s, f.y - 10 * f.s, 16, -30);
      }
    } else {
      f.wanderT -= dt;
      if (f.wanderT <= 0 || Math.hypot(tx - f.x, ty - f.y) < 8) pickWander(f);
    }
    const dx = tx - f.x;
    const dy = ty - f.y;
    const d = Math.hypot(dx, dy);
    const slow = f.sp.kind === 'jelly' || f.sp.kind === 'seahorse' ? 0.5 : 1;
    const step = Math.min(d, f.speed * boost * slow * dt);
    if (d > 0.5) { f.x += (dx / d) * step; f.y += (dy / d) * step * (walker ? 0 : 0.8); }
    if (walker) f.y = bx.y1;
    if (Math.abs(dx) > 6) f.dir = dx > 0 ? 1 : -1;
    f.faceK = lerp(f.faceK, f.dir, Math.min(1, dt * 6));
    f.step += dt * (walker && d > 2 ? 6 : 1);
    f.wag = Math.sin(f.age * (boost > 1 ? 14 : 7) + f.ph) * 0.3;
    f.x = clamp(f.x, bx.x0, bx.x1);
    f.y = clamp(f.y, bx.y0, bx.y1);
    if (f.sp.rare && Math.random() < dt * 3) eng.sparkle(f.x + rand(-30, 30) * f.s, f.y + rand(-20, 20) * f.s, rand(12, 20), -20);
    if (Math.random() < dt * 0.15) addBubble(f.x + f.dir * 26 * f.s, f.y - 6 * f.s, 0.5);
  }
  // the treasure chest opens now and then
  chest.t -= dt;
  if (chest.open > 0) chest.open -= dt;
  if (chest.t <= 0) { openChest(); chest.t = rand(7, 11); }
  // the air stone (background motion: see ambientStep)
  tankBubbleT -= adt;
  if (tankBubbleT <= 0) {
    tankBubbleT = eng.light() ? 0.35 : 0.18;
    addBubble(T.x + 26 * unit + rand(-4, 4), T.sandY - 4 * unit, rand(0.4, 0.9));
  }
}

function chestPos() {
  const s = T.s * 0.9;
  return { x: T.x + T.wd * 0.76, y: T.sandY + 6 * eng.unit, s };
}
function openChest() {
  chest.open = 1.6;
  const p = chestPos();
  for (let i = 0; i < 7; i++) addBubble(p.x + rand(-20, 20) * p.s, p.y - 40 * p.s, rand(0.6, 1.2));
}

function drawTankFish(f, t) {
  const D = eng.DPR;
  const s = f.s;
  ctx.setTransform(D, 0, 0, D, 0, 0);
  if (f.sp.rare) {
    const z = 110 * s * (1 + Math.sin(t * 4 + f.ph) * 0.08);
    ctx.globalAlpha = 0.7;
    ctx.drawImage(f.sp.rare === 'rainbow' ? glowImg : goldGlow, f.x - z / 2, f.y - z / 2, z, z);
    ctx.globalAlpha = 1;
  }
  const squash = (f.sp.kind === 'jelly' || f.sp.kind === 'octopus') ? 1 + Math.sin(f.age * 3 + f.ph) * 0.07 : 1;
  const pose = {
    wag: f.wag, happy: f.happy > 0 || f.flip > 0, puff: f.sp.kind === 'puffer' && f.puff > 0.5, squash, step: f.step,
    wave: isWalker(f.sp) && f.flip > 0,
  };
  // swimming straight: copied 1:1 (see drawFish)
  const straight = !(f.flip > 0) && (isFlipless(f.sp) || Math.abs(f.faceK - f.dir) < 0.004);
  if (straight && drawCreatureFlat(ctx, f.a, pose, f.x, f.y, s, isFlipless(f.sp) ? 1 : f.dir, D)) return;
  ctx.translate(f.x, f.y);
  if (f.flip > 0) {
    // a happy flip (a little hop for the ones on the sand)
    const k = 1 - f.flip;
    if (isWalker(f.sp)) ctx.translate(0, -Math.sin(k * Math.PI) * 30 * s);
    else ctx.rotate(-f.dir * k * TAU);
  }
  ctx.scale(isFlipless(f.sp) ? s : f.faceK * s, s);
  drawCreature(ctx, f.a, f.age + f.ph, pose);
  ctx.setTransform(D, 0, 0, D, 0, 0);
}

function renderTank(t) {
  eng.begin(false);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(tankCv, 0, 0, canvas.width, canvas.height);
  const D = eng.DPR;
  ctx.setTransform(D, 0, 0, D, 0, 0);
  // everything inside the glass
  ctx.save();
  ctx.beginPath();
  ctx.rect(T.x + 4, T.y + 4, T.wd - 8, T.ht - 8);
  ctx.clip();
  drawWeeds(ambT, tankWeeds, T.sandY, '#1d7a45');
  // the chest
  if (!CHEST) CHEST = scene.buildChest(RES);
  const cp = chestPos();
  const cw = scene.CHEST_W * cp.s;
  const ch = scene.CHEST_H * cp.s;
  ctx.drawImage(chest.open > 0 ? CHEST.open : CHEST.closed, cp.x - cw / 2, cp.y - ch, cw, ch);
  if (chest.open > 0 && Math.random() < 0.3) eng.sparkle(cp.x + rand(-20, 20) * cp.s, cp.y - ch * 0.6, rand(12, 20), -40);
  // food
  for (const fl of flakes) {
    ctx.globalAlpha = fl.rest > 6 ? Math.max(0, (8 - fl.rest) / 2) : 1;
    ctx.drawImage(dotSprite(fl.col), fl.x - fl.s / 2, fl.y - fl.s / 2, fl.s, fl.s);
  }
  ctx.globalAlpha = 1;
  for (const f of tankFish) if (!isWalker(f.sp)) drawTankFish(f, t);
  for (const f of tankFish) if (isWalker(f.sp)) drawTankFish(f, t);
  ctx.restore();
  eng.drawParticles();
  if (!tankFish.length) {
    const img = eng.textSprite('📖 Keep fish to fill your tank!', '#ffffff', 26 * eng.unit);
    const w = Math.min(img.cssW, T.wd - 20);
    const h = (img.cssH * w) / img.cssW;
    ctx.globalAlpha = 0.8 + Math.sin(t * 3) * 0.2;
    ctx.drawImage(img, T.x + T.wd / 2 - w / 2, T.y + T.ht * 0.4 - h / 2, w, h);
    ctx.globalAlpha = 1;
  }
}

function tapTank(x, y) {
  let best = null;
  let bd = Infinity;
  for (const f of tankFish) {
    const d = Math.hypot(f.x - x, f.y - y);
    if (d < 46 * f.s + 10 && d < bd) { bd = d; best = f; }
  }
  if (best) {
    best.flip = 1;
    best.happy = 1.4;
    snd.blip(rand(0.9, 1.3));
    talk(best.sp.name, true);
    // a big bubble from its mouth
    const b = boundsOf(best.sp);
    addBubble(best.x + best.dir * b.right * best.s * 0.8, best.y - 6 * best.s, 1.6);
    addBubble(best.x + best.dir * b.right * best.s * 0.8, best.y - 16 * best.s, 0.8);
    return;
  }
  const cp = chestPos();
  if (Math.hypot(x - cp.x, y - (cp.y - 30 * cp.s)) < 50 * cp.s) {
    openChest();
    sfx.chime([0, 4, 7, 12], 784, 0.06);
    return;
  }
  if (y > T.waterY) { addBubble(x, y, 1); snd.blip(0.8); }
}

function openTank() {
  sfx.unlock();
  state.mode = 'tank';
  showScreen(null);
  $('#hud').classList.add('hidden');
  $('#tank-hud').classList.remove('hidden');
  eng.clearParticles();
  paintTankCache();
  fillTank();
  $('#tank-count').textContent = tankFish.length;
  sfx.chime([0, 4, 7, 12], 660, 0.08);
  talk(tankFish.length ? pickOne(['Your aquarium!', 'Hello, fishies!', 'Look at all your fish!']) : 'Your aquarium! Keep some fish to fill it!', true);
}

function closeTank() {
  $('#tank-hud').classList.add('hidden');
  eng.clearParticles();
  flakes = [];
  goTitle();
}

// ---------------------------------------------------------------------------
// Frame
// ---------------------------------------------------------------------------
let lastNow = performance.now();
// Background motion (weeds, light rays, waves, clouds, rising bubbles and passing
// visitors) follows the grown-up corner's motion level (shared/js/motion.js): it moves
// in steps on Light and Minimal and not at all on Still. Fish and the line always move.
let ambT = 0;
let ambAcc = 0;
function ambientStep(dt) {
  if (motion.level === 0) { ambT += dt; return dt; }
  if (motion.still) return 0;
  ambAcc += dt;
  if (ambAcc < 1 / (motion.fps + 1)) return 0;
  const s = Math.min(ambAcc, 0.2);
  ambAcc = 0;
  ambT += s;
  return s;
}

function onFrame(dt, t) {
  const now = performance.now();
  const adt = ambientStep(dt);
  eng.watch((now - lastNow) / 1000, false);
  lastNow = now;
  clockT = t;
  if (state.mode === 'tank') {
    updateTank(dt, t, adt);
    eng.updateParticles(dt);
    renderTank(t);
    frameCost += performance.now() - now;
    frameCount++;
    return;
  }
  // boat glides toward where it is going and turns to face the cast
  boat.x = lerp(boat.x, boat.tx, 1 - Math.exp(-dt * 3));
  boat.faceK = lerp(boat.faceK, boat.face, Math.min(1, dt * 8));
  if (boat.joyT > 0) boat.joyT -= dt;
  if (state.mode === 'play' && line.st === 'idle') state.idle += dt;
  updateLine(dt);
  updateFish(dt, t);
  updateFlying(dt);
  updateAmbient(adt);
  eng.updateParticles(dt);
  render(t);
  frameCost += performance.now() - now;
  frameCount++;
}
let frameCost = 0;
let frameCount = 0;

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
    if (state.mode === 'tank') { if (currentScreen() === null) tapTank(p.x, p.y); return true; }
    if (tapDuck(p.x, p.y)) return true;
    if (tapFriends(p.x, p.y)) return true;
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

/** Switch to another place: its picture, its fish and its friends. */
function setPlace(id) {
  const pl = PLACE_BY_ID[id] || PLACES[0];
  const changed = pl !== PLACE;
  PLACE = pl;
  store.data.place = pl.id;
  store.persist();
  if (!changed && fish.length) return;
  if (line.biter) letGo(line.biter);
  line.biter = null;
  line.st = 'idle';
  flying = null;
  duck.on = false;
  friends.whale = null;
  friends.whaleT = rand(4, 8);
  friends.seal = null;
  friends.sealT = rand(3, 6);
  stats.sinceGold = 0;
  eng.clearParticles();
  paintPondCache();
  layout();
  fillPond();
  document.querySelector('meta[name="theme-color"]').setAttribute('content', { pond: '#34b6e4', ocean: '#2196dc', ice: '#3a9ad6', jungle: '#3ab8a0' }[pl.id]);
}

function startPlay(id) {
  sfx.unlock();
  goFullscreen();
  if (id) setPlace(id);
  state.mode = 'play';
  state.idle = 0;
  showScreen(null);
  $('#hud').classList.remove('hidden');
  $('#tank-hud').classList.add('hidden');
  boat.tx = clamp(PLACE.ice ? eng.W / 2 : boat.x, boatMinX(), boatMaxX());
  updateHud();
  sfx.chime([0, 4, 7, 12], 660, 0.08);
  talk(state.session ? `${PLACE.say} Let's fish!` : `${PLACE.say} Tap the water to go fishing!`, true);
}

// On a short landscape screen the title would cover the boat: park it by the dock.
function titleBoatX() {
  return eng.H < 520 && eng.W > eng.H ? boatMinX() + 10 * eng.unit : eng.W * 0.55;
}

function goTitle() {
  if (caught) finishCard('release');
  if (state.mode === 'tank') {
    $('#tank-hud').classList.add('hidden');
    eng.clearParticles();
    flakes = [];
  }
  state.mode = 'menu';
  boat.tx = clamp(titleBoatX(), boatMinX(), boatMaxX());
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

// ---------------------------------------------------------------------------
// The place picker
// ---------------------------------------------------------------------------
function buildPlaces() {
  const grid = $('#place-grid');
  grid.innerHTML = '';
  PLACES.forEach((pl, i) => {
    const btn = document.createElement('button');
    btn.className = `tile place-tile ${pl.tile}` + (pl.id === PLACE.id ? ' current' : '');
    btn.style.animationDelay = `${i * 0.05}s`;
    btn.setAttribute('aria-label', pl.name);
    const nf = found(pl.species);
    btn.innerHTML = `<canvas></canvas><span class="place-count">📖 ${nf}/${pl.species.length}</span><span class="tile-name"><span class="tile-ico">${pl.icon}</span> ${pl.name}</span>`;
    btn.addEventListener('click', () => {
      sfx.unlock();
      sfx.click();
      startPlay(pl.id);
    });
    grid.appendChild(btn);
  });
  requestAnimationFrame(() => {
    const cards = grid.querySelectorAll('.place-tile');
    PLACES.forEach((pl, i) => {
      const cv = cards[i].querySelector('canvas');
      const r = cv.getBoundingClientRect();
      if (!r.width) return;
      const sc = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(r.width * sc);
      cv.height = Math.round(r.height * sc);
      const c = cv.getContext('2d');
      // paint a phone-shaped scene and show its middle (the water line and a few fish)
      const vw = 360;
      const vh = 640;
      const k = (r.width * sc) / vw;
      const shownH = (r.height * sc) / k;
      const lay = scene.pondLayout(vw, vh);
      const top = clamp(lay.surfaceY - shownH * 0.38, 0, vh - shownH);
      c.scale(k, k);
      c.translate(0, -top);
      pl.paint(c, vw, vh);
      // a few of its fish
      const list = pl.species.filter((s) => !s.rare && !isWalker(s));
      [[0.28, 0.62, 1], [0.72, 0.78, -1], [0.45, 0.95, 1]].forEach(([fx, fy, dir], j) => {
        const sp = list[(j * 2 + i) % list.length];
        const y = top + shownH * fy;
        c.save();
        c.translate(vw * fx, Math.min(y, lay.floorY - 30));
        c.scale(dir * 0.9, 0.9);
        drawCreature(c, artOf(sp), 0.7 + j, { wag: 0.15, happy: true, step: 0, squash: 1 });
        c.restore();
      });
      const B = boatOf(pl);
      const bs = 0.75;
      c.save();
      c.translate(vw * 0.5, pl.ice ? lay.surfaceY - 12 * (vw / 400) : lay.surfaceY);
      c.scale(bs, bs);
      c.drawImage(B.calm, -scene.BOAT_W / 2, -scene.BOAT_WATER, scene.BOAT_W, scene.BOAT_H);
      c.restore();
    });
  });
}

function openPlaces() {
  sfx.unlock();
  buildPlaces();
  showScreen('screen-places');
  talk('Where do you want to fish?', true);
}

boot({
  onFrame,
  onResize() {
    eng.resize();
    eng.holdPerf(1.5);
    paintPondCache();
    layout();
    if (state.mode === 'tank') {
      paintTankCache();
      // put the fish back inside the (new) glass
      for (const f of tankFish) { const b = tankBox(f); f.x = clamp(f.x, b.x0, b.x1); f.y = clamp(f.y, b.y0, b.y1); pickWander(f); }
    }
    // a line in the water would be in the wrong place now: reel it back in
    if (line.st === 'cast' || line.st === 'sink' || line.st === 'wait' || line.st === 'nibble') {
      if (line.biter) letGo(line.biter);
      line.biter = null;
      line.st = 'idle';
    }
    for (const f of fish) if (f.st === 'peek' || f.st === 'curious') letGo(f);
    if (state.mode === 'menu') boat.tx = clamp(titleBoatX(), boatMinX(), boatMaxX());
    if (currentScreen() === 'screen-places') buildPlaces();
  },
  onAction(action) {
    switch (action) {
      case 'play': openPlaces(); break;
      case 'home': goTitle(); break;
      case 'book': openBook(); break;
      case 'book-done': closeBook(); break;
      case 'tank': openTank(); break;
      case 'tank-home': closeTank(); break;
      case 'feed': feed(); break;
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
    if (screen === 'screen-places') { goTitle(); return true; }
    if (screen === null) { goTitle(); return true; }
    return false;
  },
});
// the pond paints its own world, so skip drawing the shared one every frame
showBackground(false);
animateBackground(false);
paintPondCache();
fillPond();
layout();
boat.x = boat.tx = clamp(titleBoatX(), boatMinX(), boatMaxX());
updateTitle();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { eng.resize(); paintPondCache(); if (state.mode === 'tank') paintTankCache(); });

// a tiny hook for automated testing
window.__fishing = {
  state, line, boat, P, T, store, stats, friends,
  get fish() { return fish; },
  get tankFish() { return tankFish; },
  get flakes() { return flakes; },
  get quality() { return eng.quality; },
  get caught() { return caught; },
  get place() { return PLACE.id; },
  cast, startPlay, goTitle, openBook, openTank, setPlace, feed, tapTank,
  spawn(id, x, y) { const f = makeFish(BY_ID[id], { x, y }); fish.push(f); return f; },
  duck() { state.duckT = 0; },
  cost() { const r = frameCost / Math.max(1, frameCount); frameCost = 0; frameCount = 0; return r; },
};
