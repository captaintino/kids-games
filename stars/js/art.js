// Pre-rendered sprites for Catch the Falling Stars: everything is drawn once into
// offscreen canvases, so each frame is just a handful of drawImage calls.
import { makeSprite, softStarPath, roundRectPath, INK, GLOW, splitGlow } from './engine.js';

const TAU = Math.PI * 2;
// Sprite resolution: big enough for retina tablets, built once.
const RES = 3;

export const STAR_COLORS = [
  { name: 'yellow', light: '#fff6b8', mid: '#ffd93b', dark: '#ffab1f', pop: '#ffe866' },
  { name: 'pink', light: '#ffd3ec', mid: '#ff7ac6', dark: '#ec3f98', pop: '#ff9ad6' },
  { name: 'blue', light: '#d6f4ff', mid: '#6fc8ff', dark: '#2f8cff', pop: '#8fd8ff' },
  { name: 'green', light: '#e0ffc9', mid: '#7be36b', dark: '#2fb85a', pop: '#a6ff7a' },
  { name: 'purple', light: '#eadcff', mid: '#b38bff', dark: '#7d4cff', pop: '#cdb0ff' },
  { name: 'orange', light: '#ffe2bf', mid: '#ffa64d', dark: '#ff6f1f', pop: '#ffc07a' },
  { name: 'red', light: '#ffd0d6', mid: '#ff6b7d', dark: '#e6334f', pop: '#ff94a2' },
];

// ---------------------------------------------------------------------------
// Faces
// ---------------------------------------------------------------------------
export function eyes(c, x, y, gap, r, kind) {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (const s of [-1, 1]) {
    const ex = x + s * gap;
    if (kind === 'closed') {
      c.strokeStyle = INK;
      c.lineWidth = r * 0.7;
      c.beginPath(); c.arc(ex, y - r * 0.2, r * 0.95, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
    } else if (kind === 'happy') {
      c.strokeStyle = INK;
      c.lineWidth = r * 0.7;
      c.beginPath(); c.arc(ex, y + r * 0.5, r * 0.95, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    } else if (kind === 'droopy') {
      c.fillStyle = INK;
      c.beginPath(); c.ellipse(ex, y + r * 0.2, r * 0.85, r * 0.6, 0, 0, TAU); c.fill();
      c.strokeStyle = INK;
      c.lineWidth = r * 0.5;
      c.beginPath(); c.moveTo(ex - r * 1.2, y - r * 0.55 - s * r * 0.35); c.lineTo(ex + r * 1.1, y - r * 0.55 + s * r * 0.35); c.stroke();
    } else {
      c.fillStyle = INK;
      c.beginPath(); c.ellipse(ex, y, r * 0.85, r, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(ex - r * 0.25, y - r * 0.35, r * 0.36, 0, TAU); c.fill();
    }
  }
}
export function cheeks(c, x, y, gap, r, color = 'rgba(255, 90, 140, 0.45)') {
  c.fillStyle = color;
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * gap, y, r, r * 0.62, 0, 0, TAU); c.fill(); }
}
export function smile(c, x, y, r, lw, open) {
  c.strokeStyle = INK;
  c.lineWidth = lw;
  c.lineCap = 'round';
  if (open) {
    c.fillStyle = '#b02a5a';
    c.beginPath(); c.arc(x, y - r * 0.2, r, 0.1, Math.PI - 0.1); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ff8fb0';
    c.beginPath(); c.ellipse(x, y + r * 0.45, r * 0.45, r * 0.25, 0, 0, TAU); c.fill();
  } else {
    c.beginPath(); c.arc(x, y - r * 0.5, r, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
  }
}

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------
// Star sprites are 100 x 100 units with the star (radius 34) in the middle; the
// rest is glow. STAR_R is the star radius inside the sprite.
export const STAR_BOX = 100;
export const STAR_R = 34;

function starBody(c, fill, glow, eyesKind, opts = {}) {
  const C = STAR_BOX / 2;
  const R = STAR_R;
  // glow
  const paintGlow = (cc) => {
    const g = cc.createRadialGradient(C, C, R * 0.5, C, C, C);
    g.addColorStop(0, glow);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    cc.fillStyle = g;
    cc.fillRect(0, 0, STAR_BOX, STAR_BOX);
  };
  if (GLOW.skip) GLOW.seen = { key: 'star|' + glow, paint: paintGlow };
  else paintGlow(c);
  // body
  softStarPath(c, C, C + 1, R, R * 0.52);
  c.fillStyle = fill;
  c.fill();
  // soft shading on the lower half
  c.save();
  c.clip();
  if (opts.after) opts.after(c);
  const sh = c.createLinearGradient(0, C - R, 0, C + R);
  sh.addColorStop(0, 'rgba(255,255,255,0.55)');
  sh.addColorStop(0.45, 'rgba(255,255,255,0)');
  sh.addColorStop(1, 'rgba(60,0,80,0.16)');
  c.fillStyle = sh;
  c.fillRect(0, 0, STAR_BOX, STAR_BOX);
  c.restore();
  c.lineJoin = 'round';
  c.lineWidth = 3.6;
  c.strokeStyle = INK;
  softStarPath(c, C, C + 1, R, R * 0.52);
  c.stroke();
  // shine
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.beginPath(); c.ellipse(C - 9, C - 13, 6, 3.2, -0.6, 0, TAU); c.fill();
  c.beginPath(); c.arc(C - 15, C - 6, 1.8, 0, TAU); c.fill();
  // face
  eyes(c, C, C + 3, 7.5, 3, eyesKind);
  cheeks(c, C, C + 9, 13, 3.4);
  smile(c, C, C + 11, 4.2, 2.2, opts.open);
}

function colorFill(c, col) {
  const C = STAR_BOX / 2;
  const g = c.createLinearGradient(0, C - STAR_R, 0, C + STAR_R);
  g.addColorStop(0, col.light);
  g.addColorStop(0.45, col.mid);
  g.addColorStop(1, col.dark);
  return g;
}

export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const RAINBOW = ['#ff4d5e', '#ff9a2e', '#ffd93b', '#5cd65c', '#3d9bff', '#9d5cff'];

export function buildStarSprites() {
  const make = (draw) => splitGlow(makeSprite(STAR_BOX, STAR_BOX, draw, RES), STAR_BOX, STAR_BOX, RES, draw);
  const colors = STAR_COLORS.map((col) => ({
    open: make((c) => starBody(c, colorFill(c, col), hexA(col.mid, 0.55), 'open')),
    blink: make((c) => starBody(c, colorFill(c, col), hexA(col.mid, 0.55), 'closed')),
  }));
  const gold = { light: '#ffffff', mid: '#fff07a', dark: '#ffc21f' };
  const shoot = make((c) => starBody(c, colorFill(c, gold), 'rgba(255, 250, 200, 0.9)', 'happy', { open: true }));
  const rainbow = make((c) => starBody(c, '#fff', 'rgba(255,255,255,0.8)', 'happy', {
    open: true,
    after(cc) {
      const C = STAR_BOX / 2;
      cc.save();
      cc.translate(C, C);
      cc.rotate(-0.5);
      const band = (STAR_R * 2.4) / RAINBOW.length;
      RAINBOW.forEach((col, i) => {
        cc.fillStyle = col;
        cc.fillRect(-STAR_R * 1.5, -STAR_R * 1.2 + i * band, STAR_R * 3, band + 0.5);
      });
      cc.restore();
    },
  }));
  return { colors, shoot, rainbow };
}

/** The glowing tail behind a shooting star, pointing left from the head at (TAIL_W, TAIL_H/2). */
export const TAIL_W = 180;
export const TAIL_H = 44;
export function buildTail() {
  return makeSprite(TAIL_W, TAIL_H, (c) => {
    const y = TAIL_H / 2;
    const layers = [
      ['rgba(255, 140, 220, 0.45)', 20],
      ['rgba(255, 230, 120, 0.75)', 12],
      ['rgba(255, 255, 255, 0.95)', 5],
    ];
    for (const [col, hw] of layers) {
      const g = c.createLinearGradient(0, 0, TAIL_W, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, col);
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, y);
      c.quadraticCurveTo(TAIL_W * 0.6, y - hw * 0.8, TAIL_W, y - hw);
      c.arc(TAIL_W - hw * 0.2, y, hw, -Math.PI / 2, Math.PI / 2);
      c.quadraticCurveTo(TAIL_W * 0.6, y + hw * 0.8, 0, y);
      c.fill();
    }
  }, 2);
}

// ---------------------------------------------------------------------------
// Moon (a sleepy crescent)
// ---------------------------------------------------------------------------
function crescentPath(c, x, y, R, dx, dy, r2) {
  // outer circle (x, y, R) minus the circle (x + dx, y + dy, r2)
  const d = Math.hypot(dx, dy);
  const a = (R * R - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, R * R - a * a));
  const px = x + (a * dx) / d;
  const py = y + (a * dy) / d;
  const i1 = [px + (h * -dy) / d, py + (h * dx) / d];
  const i2 = [px - (h * -dy) / d, py - (h * dx) / d];
  const t1 = Math.atan2(i1[1] - y, i1[0] - x);
  const t2 = Math.atan2(i2[1] - y, i2[0] - x);
  const p1 = Math.atan2(i1[1] - (y + dy), i1[0] - (x + dx));
  const p2 = Math.atan2(i2[1] - (y + dy), i2[0] - (x + dx));
  c.beginPath();
  c.arc(x, y, R, t1, t2, false);
  c.arc(x + dx, y + dy, r2, p2, p1, true);
  c.closePath();
}

export function buildMoon() {
  return makeSprite(STAR_BOX, STAR_BOX, (c) => {
    const C = STAR_BOX / 2;
    const g = c.createRadialGradient(C, C, 18, C, C, C);
    g.addColorStop(0, 'rgba(255, 245, 190, 0.7)');
    g.addColorStop(1, 'rgba(255, 245, 190, 0)');
    c.fillStyle = g;
    c.fillRect(0, 0, STAR_BOX, STAR_BOX);
    const R = 33;
    const mx = C - 2;
    crescentPath(c, mx, C, R, 18, -10, 27);
    const f = c.createLinearGradient(mx - R, C - R, mx + R, C + R);
    f.addColorStop(0, '#fffbe0');
    f.addColorStop(0.5, '#ffe98a');
    f.addColorStop(1, '#ffc94a');
    c.fillStyle = f;
    c.fill();
    c.lineJoin = 'round';
    c.lineWidth = 3.6;
    c.strokeStyle = INK;
    c.stroke();
    // craters
    c.fillStyle = 'rgba(230, 170, 40, 0.35)';
    c.beginPath(); c.arc(mx - 12, C + 18, 4, 0, TAU); c.fill();
    c.beginPath(); c.arc(mx + 4, C + 25, 2.6, 0, TAU); c.fill();
    // sleepy face on the fat part of the crescent
    const fx = mx - 17;
    const fy = C + 2;
    c.strokeStyle = INK;
    c.lineCap = 'round';
    c.lineWidth = 2.4;
    c.beginPath(); c.arc(fx, fy - 6, 3.6, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
    c.beginPath(); c.arc(fx + 8, fy + 6, 3, Math.PI * 0.2, Math.PI * 0.85); c.stroke();
    c.fillStyle = 'rgba(255, 110, 150, 0.45)';
    c.beginPath(); c.ellipse(fx - 4, fy + 4, 4, 2.6, 0, 0, TAU); c.fill();
    // nightcap
    c.save();
    c.translate(mx - 14, C - 26);
    c.rotate(-0.5);
    c.beginPath();
    c.moveTo(-11, 4);
    c.quadraticCurveTo(-2, -20, 18, -16);
    c.quadraticCurveTo(6, -6, 11, 4);
    c.closePath();
    c.fillStyle = '#7d6bff';
    c.fill();
    c.lineWidth = 2.6;
    c.strokeStyle = INK;
    c.stroke();
    roundRectPath(c, -13, 1, 27, 7, 3.5);
    c.fillStyle = '#ffffff';
    c.fill(); c.stroke();
    c.beginPath(); c.arc(19, -16, 4, 0, TAU);
    c.fill(); c.stroke();
    c.restore();
  }, RES);
}

// ---------------------------------------------------------------------------
// Rain cloud and raindrop
// ---------------------------------------------------------------------------
export const CLOUD_W = 170;
export const CLOUD_H = 110;
const PUFFS = [[42, 66, 26], [70, 48, 30], [104, 44, 32], [134, 62, 25], [88, 74, 26], [58, 78, 20], [118, 80, 20]];

export function cloudBody(c, top, bottom, face) {
  c.lineJoin = 'round';
  c.strokeStyle = INK;
  c.lineWidth = 7;
  for (const [x, y, r] of PUFFS) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); }
  const g = c.createLinearGradient(0, 14, 0, 100);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  for (const [x, y, r] of PUFFS) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,0.45)';
  c.beginPath(); c.ellipse(78, 32, 14, 6, -0.3, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(112, 28, 9, 4, -0.2, 0, TAU); c.fill();
  // face
  const fx = 90;
  const fy = 66;
  if (face === 'puff') {
    eyes(c, fx, fy - 2, 13, 3.6, 'closed');
    c.fillStyle = INK;
    c.beginPath(); c.ellipse(fx, fy + 11, 4.5, 5.5, 0, 0, TAU); c.fill();
    cheeks(c, fx, fy + 6, 22, 6, 'rgba(120, 150, 255, 0.55)');
  } else {
    eyes(c, fx, fy - 2, 13, 3.6, 'open');
    cheeks(c, fx, fy + 6, 22, 5.5, 'rgba(255, 120, 170, 0.45)');
    c.strokeStyle = INK;
    c.lineWidth = 2.6;
    c.lineCap = 'round';
    c.beginPath(); c.arc(fx, fy + 4, 4.5, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
  }
}

export function buildClouds() {
  const make = (face) => makeSprite(CLOUD_W, CLOUD_H, (c) => cloudBody(c, '#dfe7fb', '#8f9fcc', face), 2.5);
  return { calm: make('calm'), puff: make('puff') };
}

export const DROP_W = 26;
export const DROP_H = 36;
export function buildDrop() {
  return makeSprite(DROP_W, DROP_H, (c) => {
    const x = DROP_W / 2;
    c.beginPath();
    c.moveTo(x, 3);
    c.bezierCurveTo(x + 4, 12, x + 10, 17, x + 10, 24);
    c.arc(x, 24, 10, 0, Math.PI, false);
    c.bezierCurveTo(x - 10, 17, x - 4, 12, x, 3);
    c.closePath();
    const g = c.createLinearGradient(0, 3, 0, 34);
    g.addColorStop(0, '#d9f4ff');
    g.addColorStop(1, '#3d9bff');
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 2.6;
    c.lineJoin = 'round';
    c.strokeStyle = INK;
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.ellipse(x - 4, 23, 2.4, 4, 0.3, 0, TAU); c.fill();
  }, RES);
}

// ---------------------------------------------------------------------------
// The basket (back half, front half with faces)
// ---------------------------------------------------------------------------
// The basket sprite is BASKET_W x BASKET_H units; its rim (the catching line)
// sits at RIM_Y, the bottom at BOTTOM_Y.
export const BASKET_W = 150;
export const BASKET_H = 120;
export const RIM_Y = 34;
export const BOTTOM_Y = 108;
export const BX = BASKET_W / 2;
export const HALF = 62; // half width at the rim

export function bodyPath(c, sag) {
  c.beginPath();
  c.moveTo(BX - HALF, RIM_Y);
  c.quadraticCurveTo(BX, RIM_Y + sag, BX + HALF, RIM_Y);
  c.bezierCurveTo(BX + HALF - 2, RIM_Y + 40, BX + 50, BOTTOM_Y - 4, BX + 36, BOTTOM_Y);
  c.lineTo(BX - 36, BOTTOM_Y);
  c.bezierCurveTo(BX - 50, BOTTOM_Y - 4, BX - HALF + 2, RIM_Y + 40, BX - HALF, RIM_Y);
  c.closePath();
}

function basketBack(c, wet) {
  // the dark inside of the basket, seen over the front rim
  c.beginPath();
  c.ellipse(BX, RIM_Y, HALF - 2, 13, 0, 0, TAU);
  c.fillStyle = wet ? '#4f3a33' : '#7a4520';
  c.fill();
  c.lineWidth = 3.6;
  c.strokeStyle = INK;
  c.stroke();
  c.beginPath();
  c.ellipse(BX, RIM_Y + 3, HALF - 10, 8, 0, Math.PI, TAU);
  c.fillStyle = wet ? '#3a2a26' : '#5a3016';
  c.fill();
}

function basketFront(c, face, wet) {
  const sag = wet ? 10 : 0;
  const top = wet ? '#d2a77a' : '#f7c06e';
  const bottom = wet ? '#8d6a52' : '#d9873a';
  bodyPath(c, sag);
  const g = c.createLinearGradient(0, RIM_Y, 0, BOTTOM_Y);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  c.fill();
  // woven pattern
  c.save();
  bodyPath(c, sag);
  c.clip();
  const rows = 5;
  const rowH = (BOTTOM_Y - RIM_Y) / rows;
  for (let r = 0; r < rows; r++) {
    const y = RIM_Y + 6 + r * rowH;
    const off = r % 2 ? 0 : 11;
    for (let x = -22 + off; x < BASKET_W + 22; x += 22) {
      roundRectPath(c, x + 1.5, y + 1.5, 19, rowH - 3, 6);
      c.fillStyle = wet ? 'rgba(255, 235, 210, 0.18)' : 'rgba(255, 240, 200, 0.35)';
      c.fill();
      c.lineWidth = 1.6;
      c.strokeStyle = wet ? 'rgba(60, 30, 20, 0.35)' : 'rgba(140, 70, 20, 0.45)';
      c.stroke();
    }
  }
  // shading to the sides
  const sh = c.createLinearGradient(BX - HALF, 0, BX + HALF, 0);
  sh.addColorStop(0, 'rgba(80, 30, 0, 0.22)');
  sh.addColorStop(0.3, 'rgba(80, 30, 0, 0)');
  sh.addColorStop(0.7, 'rgba(80, 30, 0, 0)');
  sh.addColorStop(1, 'rgba(80, 30, 0, 0.28)');
  c.fillStyle = sh;
  c.fillRect(0, 0, BASKET_W, BASKET_H);
  if (wet) {
    // wet streaks
    c.fillStyle = 'rgba(80, 140, 230, 0.25)';
    for (const x of [BX - 34, BX - 6, BX + 26]) {
      c.beginPath(); c.ellipse(x, RIM_Y + 40, 5, 26, 0, 0, TAU); c.fill();
    }
  }
  c.restore();
  bodyPath(c, sag);
  c.lineWidth = 4;
  c.lineJoin = 'round';
  c.strokeStyle = INK;
  c.stroke();
  // rim: a thick braided band
  c.lineCap = 'round';
  c.strokeStyle = INK;
  c.lineWidth = 15;
  c.beginPath(); c.moveTo(BX - HALF - 2, RIM_Y); c.quadraticCurveTo(BX, RIM_Y + 14 + sag * 1.6, BX + HALF + 2, RIM_Y); c.stroke();
  c.strokeStyle = wet ? '#c9a98a' : '#ffd890';
  c.lineWidth = 9;
  c.beginPath(); c.moveTo(BX - HALF - 2, RIM_Y); c.quadraticCurveTo(BX, RIM_Y + 14 + sag * 1.6, BX + HALF + 2, RIM_Y); c.stroke();
  c.strokeStyle = wet ? 'rgba(90, 60, 40, 0.5)' : 'rgba(190, 110, 30, 0.6)';
  c.lineWidth = 2;
  for (let i = 1; i < 12; i++) {
    const t = i / 12;
    const x = (1 - t) * (1 - t) * (BX - HALF - 2) + 2 * (1 - t) * t * BX + t * t * (BX + HALF + 2);
    const y = (1 - t) * (1 - t) * RIM_Y + 2 * (1 - t) * t * (RIM_Y + 14 + sag * 1.6) + t * t * RIM_Y;
    c.beginPath(); c.moveTo(x - 3, y - 3); c.lineTo(x + 2, y + 3); c.stroke();
  }
  // face
  const fy = RIM_Y + 38 + (wet ? 4 : 0);
  if (face === 'soggy') {
    eyes(c, BX, fy, 16, 4.2, 'droopy');
    cheeks(c, BX, fy + 10, 27, 6, 'rgba(110, 160, 255, 0.5)');
    // wobbly mouth
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(BX - 9, fy + 17);
    c.quadraticCurveTo(BX - 4.5, fy + 12, BX, fy + 17);
    c.quadraticCurveTo(BX + 4.5, fy + 22, BX + 9, fy + 17);
    c.stroke();
    // a drip on the nose
    c.fillStyle = '#9fdcff';
    c.beginPath(); c.moveTo(BX + 24, fy - 12); c.quadraticCurveTo(BX + 30, fy - 3, BX + 24, fy - 1); c.quadraticCurveTo(BX + 18, fy - 3, BX + 24, fy - 12); c.fill();
    c.lineWidth = 1.6;
    c.stroke();
  } else {
    eyes(c, BX, fy, 16, 4.4, face === 'joy' ? 'happy' : face === 'blink' ? 'closed' : 'open');
    cheeks(c, BX, fy + 10, 27, 6.5);
    smile(c, BX, fy + 13, 7, 3, face === 'joy');
  }
}

export function buildBasket() {
  const make = (draw) => makeSprite(BASKET_W, BASKET_H, draw, 2.5);
  return {
    back: make((c) => basketBack(c, false)),
    backWet: make((c) => basketBack(c, true)),
    happy: make((c) => basketFront(c, 'happy', false)),
    blink: make((c) => basketFront(c, 'blink', false)),
    joy: make((c) => basketFront(c, 'joy', false)),
    soggy: make((c) => basketFront(c, 'soggy', true)),
  };
}

// ---------------------------------------------------------------------------
// The game's own night sky (shown when the Paint Party world is picked)
// ---------------------------------------------------------------------------
export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const NIGHT = ['#0b1238', '#211d63', '#4b3a92'];

/** Paints the still night sky into c (w x h). Returns the ground line y. */
export function paintNight(c, w, h) {
  const R = rng(7);
  const u = Math.min(w, h) / 400;
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, NIGHT[0]);
  g.addColorStop(0.55, NIGHT[1]);
  g.addColorStop(1, NIGHT[2]);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  // soft nebula clouds
  const neb = [['rgba(255, 110, 200, 0.16)', 0.2, 0.3], ['rgba(110, 170, 255, 0.16)', 0.75, 0.2], ['rgba(170, 120, 255, 0.18)', 0.55, 0.55]];
  for (const [col, fx, fy] of neb) {
    const r = Math.max(w, h) * 0.45;
    const ng = c.createRadialGradient(fx * w, fy * h, 0, fx * w, fy * h, r);
    ng.addColorStop(0, col);
    ng.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = ng;
    c.fillRect(0, 0, w, h);
  }
  // tiny background stars
  const n = Math.round((w * h) / 2600);
  for (let i = 0; i < n; i++) {
    const x = R() * w;
    const y = R() * h * 0.85;
    const r = (0.5 + R() * 1.3) * u;
    c.globalAlpha = 0.35 + R() * 0.65;
    c.fillStyle = R() < 0.2 ? '#ffe9a8' : '#ffffff';
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
  // far hills with little houses
  const groundY = h - Math.max(46 * u, h * 0.075);
  c.fillStyle = '#2b2a78';
  c.beginPath();
  c.moveTo(0, h);
  for (let x = 0; x <= w + 10; x += 10) c.lineTo(x, groundY - 46 * u - Math.sin(x / (120 * u) + 1) * 22 * u - Math.sin(x / (47 * u)) * 6 * u);
  c.lineTo(w, h);
  c.closePath();
  c.fill();
  const houses = Math.max(2, Math.round(w / (170 * u)));
  for (let i = 0; i < houses; i++) {
    const x = ((i + 0.3 + R() * 0.4) / houses) * w;
    const base = groundY - 40 * u - Math.sin(x / (120 * u) + 1) * 22 * u - Math.sin(x / (47 * u)) * 6 * u;
    const s = (0.8 + R() * 0.5) * u;
    c.fillStyle = '#211f5e';
    c.fillRect(x - 13 * s, base - 20 * s, 26 * s, 22 * s);
    c.beginPath(); c.moveTo(x - 17 * s, base - 19 * s); c.lineTo(x, base - 34 * s); c.lineTo(x + 17 * s, base - 19 * s); c.closePath(); c.fill();
    c.fillStyle = '#ffd56b';
    c.fillRect(x - 7 * s, base - 14 * s, 6 * s, 6 * s);
    if (R() < 0.6) c.fillRect(x + 2 * s, base - 14 * s, 6 * s, 6 * s);
    const wg = c.createRadialGradient(x, base - 11 * s, 0, x, base - 11 * s, 26 * s);
    wg.addColorStop(0, 'rgba(255, 213, 107, 0.28)');
    wg.addColorStop(1, 'rgba(255, 213, 107, 0)');
    c.fillStyle = wg;
    c.fillRect(x - 30 * s, base - 40 * s, 60 * s, 60 * s);
  }
  // round trees on the near hill
  c.fillStyle = '#1c3d5e';
  const trees = Math.max(3, Math.round(w / (110 * u)));
  for (let i = 0; i < trees; i++) {
    const x = ((i + R()) / trees) * w;
    const r = (14 + R() * 12) * u;
    c.beginPath(); c.arc(x, groundY - r * 0.6, r, 0, TAU); c.fill();
  }
  // near grassy hill the basket walks on
  c.beginPath();
  c.moveTo(0, h);
  for (let x = 0; x <= w + 10; x += 10) c.lineTo(x, groundY - Math.sin(x / (160 * u)) * 7 * u);
  c.lineTo(w, h);
  c.closePath();
  const gg = c.createLinearGradient(0, groundY - 10 * u, 0, h);
  gg.addColorStop(0, '#2c6a7a');
  gg.addColorStop(1, '#173a55');
  c.fillStyle = gg;
  c.fill();
  c.strokeStyle = 'rgba(160, 230, 255, 0.35)';
  c.lineWidth = 2.5 * u;
  c.beginPath();
  for (let x = 0; x <= w + 10; x += 10) {
    const y = groundY - Math.sin(x / (160 * u)) * 7 * u;
    if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.stroke();
  // little flowers in the grass
  for (let i = 0; i < Math.round(w / (40 * u)); i++) {
    const x = R() * w;
    const y = groundY + (8 + R() * (h - groundY - 12)) ;
    c.fillStyle = ['#ff9ad6', '#ffe866', '#9fe0ff'][i % 3];
    c.globalAlpha = 0.7;
    c.beginPath(); c.arc(x, y, 2.4 * u, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
  return groundY;
}
