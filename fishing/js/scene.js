// The pond: the still picture (painted once into a cached canvas) and the
// sprites for the boat, the fishing cat, the bobber, the duck and the clouds.
import { makeSprite, starPath, roundRectPath, INK } from './engine.js';

const TAU = Math.PI * 2;

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function vgrad(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
}
function ink(c, w) {
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.lineWidth = w;
  c.strokeStyle = INK;
  c.stroke();
}

/** Where the water starts and where the sandy bottom is, for a w x h screen. */
export function pondLayout(w, h) {
  const surfaceY = Math.round(h * (h < 520 ? 0.3 : w > h ? 0.27 : 0.235));
  const u = Math.min(w, h) / 400;
  const floorY = Math.round(h - Math.max(48 * u, h * 0.085));
  return { surfaceY, floorY };
}

export const WATER_TOP = '#5fd6ee';

/** Paints the still pond picture. */
export function paintPond(c, w, h) {
  const R = rng(5);
  const u = Math.min(w, h) / 400;
  const { surfaceY, floorY } = pondLayout(w, h);

  // sky
  c.fillStyle = vgrad(c, 0, surfaceY, [[0, '#73cfff'], [0.7, '#b8ecff'], [1, '#e4f9ff']]);
  c.fillRect(0, 0, w, surfaceY + 2);
  // smiling sun
  const sx = w * 0.84;
  const sy = Math.max(surfaceY * 0.42, 52 * u);
  const sr = 26 * u;
  const glow = c.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 3);
  glow.addColorStop(0, 'rgba(255, 245, 170, 0.8)');
  glow.addColorStop(1, 'rgba(255, 245, 170, 0)');
  c.fillStyle = glow;
  c.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6);
  c.fillStyle = '#ffd23a';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    c.beginPath();
    c.moveTo(sx + Math.cos(a - 0.14) * sr * 1.12, sy + Math.sin(a - 0.14) * sr * 1.12);
    c.lineTo(sx + Math.cos(a) * sr * 1.5, sy + Math.sin(a) * sr * 1.5);
    c.lineTo(sx + Math.cos(a + 0.14) * sr * 1.12, sy + Math.sin(a + 0.14) * sr * 1.12);
    c.closePath();
    c.fill();
  }
  c.beginPath(); c.arc(sx, sy, sr, 0, TAU);
  c.fillStyle = vgrad(c, sy - sr, sy + sr, [[0, '#fff6a0'], [1, '#ffc21f']]);
  c.fill();
  ink(c, 3 * u);
  c.fillStyle = INK;
  c.beginPath(); c.arc(sx - sr * 0.33, sy - sr * 0.1, sr * 0.1, 0, TAU); c.fill();
  c.beginPath(); c.arc(sx + sr * 0.33, sy - sr * 0.1, sr * 0.1, 0, TAU); c.fill();
  c.strokeStyle = INK;
  c.lineWidth = 2.4 * u;
  c.beginPath(); c.arc(sx, sy + sr * 0.05, sr * 0.38, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
  c.fillStyle = 'rgba(255, 110, 120, 0.45)';
  c.beginPath(); c.ellipse(sx - sr * 0.55, sy + sr * 0.25, sr * 0.16, sr * 0.1, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(sx + sr * 0.55, sy + sr * 0.25, sr * 0.16, sr * 0.1, 0, 0, TAU); c.fill();

  // far shore: rolling hills and round trees
  const hz = surfaceY;
  c.fillStyle = '#9be37a';
  c.beginPath();
  c.moveTo(0, hz + 2);
  for (let x = 0; x <= w + 10; x += 10) c.lineTo(x, hz - 16 * u - Math.sin(x / (90 * u) + 0.5) * 9 * u - Math.sin(x / (37 * u)) * 3 * u);
  c.lineTo(w, hz + 2);
  c.closePath();
  c.fill();
  const trees = Math.max(4, Math.round(w / (70 * u)));
  for (let i = 0; i < trees; i++) {
    const x = ((i + 0.2 + R() * 0.6) / trees) * w;
    const base = hz - 12 * u - Math.sin(x / (90 * u) + 0.5) * 9 * u;
    const r = (8 + R() * 7) * u;
    c.fillStyle = '#8a5a35';
    c.fillRect(x - 1.6 * u, base - r, 3.2 * u, r);
    c.fillStyle = R() < 0.5 ? '#4fc56a' : '#3fb35e';
    c.beginPath(); c.arc(x, base - r * 1.2, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.beginPath(); c.arc(x - r * 0.35, base - r * 1.5, r * 0.35, 0, TAU); c.fill();
  }
  c.fillStyle = '#7fd36a';
  c.fillRect(0, hz - 4 * u, w, 6 * u);

  // water
  c.fillStyle = vgrad(c, surfaceY, floorY + 20 * u, [[0, WATER_TOP], [0.2, '#34b6e4'], [0.65, '#1d86cf'], [1, '#125fae']]);
  c.fillRect(0, surfaceY, w, h - surfaceY);
  // soft wobbly light near the surface
  c.strokeStyle = 'rgba(255,255,255,0.18)';
  c.lineWidth = 2.5 * u;
  c.lineCap = 'round';
  for (let k = 0; k < 7; k++) {
    const y = surfaceY + (24 + k * 22 + R() * 10) * u;
    const x0 = R() * w;
    const len = (40 + R() * 70) * u;
    c.beginPath();
    for (let x = 0; x <= len; x += 6) {
      const yy = y + Math.sin((x / len) * TAU) * 3 * u;
      if (x === 0) c.moveTo(x0 + x, yy); else c.lineTo(x0 + x, yy);
    }
    c.stroke();
  }
  // distant rocks
  c.fillStyle = 'rgba(10, 60, 130, 0.35)';
  for (let i = 0; i < 6; i++) {
    c.beginPath();
    c.ellipse(w * (i / 5) + (R() - 0.5) * 60 * u, floorY + 6 * u, (50 + R() * 60) * u, (24 + R() * 36) * u, 0, Math.PI, TAU);
    c.fill();
  }

  // sandy bottom
  c.beginPath();
  c.moveTo(0, h);
  for (let x = 0; x <= w + 20; x += 20) c.lineTo(x, floorY + Math.sin(x * 0.013) * 7 * u + Math.sin(x * 0.041) * 3 * u);
  c.lineTo(w, h);
  c.closePath();
  c.fillStyle = vgrad(c, floorY - 8 * u, h, [[0, '#ffe7a8'], [1, '#e8b665']]);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.5)';
  c.lineWidth = 2 * u;
  c.beginPath();
  for (let x = 0; x <= w + 20; x += 20) {
    const y = floorY + Math.sin(x * 0.013) * 7 * u + Math.sin(x * 0.041) * 3 * u;
    if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.stroke();
  c.fillStyle = 'rgba(180, 120, 50, 0.3)';
  for (let i = 0; i < Math.round(w / 6); i++) {
    c.beginPath(); c.arc(R() * w, floorY + 10 * u + R() * (h - floorY), (1 + R() * 1.8) * u, 0, TAU); c.fill();
  }
  // pebbles
  const pebbleCols = ['#b9c3d6', '#9fb0c9', '#d7c3a8', '#c4a6d8'];
  for (let i = 0; i < Math.round(w / (45 * u)); i++) {
    const x = R() * w;
    const y = floorY + (6 + R() * 18) * u;
    const r = (4 + R() * 6) * u;
    c.beginPath(); c.ellipse(x, y, r * 1.3, r, 0, 0, TAU);
    c.fillStyle = pebbleCols[i % pebbleCols.length];
    c.fill();
    ink(c, 2 * u);
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.ellipse(x - r * 0.4, y - r * 0.35, r * 0.4, r * 0.2, 0, 0, TAU); c.fill();
  }
  // a starfish and a shell
  const st = [w * 0.33, floorY + 16 * u];
  c.save();
  c.translate(st[0], st[1]);
  c.rotate(0.3);
  starPath(c, 0, 0, 15 * u, 7 * u);
  c.fillStyle = '#ff8357';
  c.fill();
  ink(c, 2.4 * u);
  c.fillStyle = '#ffd0b5';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 5;
    c.beginPath(); c.arc(Math.cos(a) * 7 * u, Math.sin(a) * 7 * u, 1.6 * u, 0, TAU); c.fill();
  }
  c.restore();
  const shx = w * 0.68;
  const shy = floorY + 22 * u;
  c.beginPath(); c.moveTo(shx, shy); c.arc(shx, shy, 14 * u, Math.PI * 1.1, Math.PI * 1.9); c.closePath();
  c.fillStyle = '#ffd3e4';
  c.fill();
  ink(c, 2.2 * u);
  c.strokeStyle = 'rgba(220, 110, 160, 0.7)';
  c.lineWidth = 1.6 * u;
  for (let i = 1; i < 5; i++) {
    const a = Math.PI * (1.1 + i * 0.16);
    c.beginPath(); c.moveTo(shx, shy); c.lineTo(shx + Math.cos(a) * 13 * u, shy + Math.sin(a) * 13 * u); c.stroke();
  }

  // wooden dock on the left
  const dockW = Math.min(w * 0.2, 120 * u);
  const deckY = surfaceY - 16 * u;
  for (const px of [dockW * 0.25, dockW * 0.85]) {
    c.fillStyle = vgrad(c, deckY, surfaceY + 40 * u, [[0, '#a8683c'], [1, '#6e3f22']]);
    roundRectPath(c, px - 5 * u, deckY, 10 * u, surfaceY - deckY + 40 * u, 3 * u);
    c.fill();
    ink(c, 2.4 * u);
  }
  c.fillStyle = '#d99a5c';
  roundRectPath(c, -10 * u, deckY - 9 * u, dockW + 10 * u, 11 * u, 4 * u);
  c.fill();
  ink(c, 2.6 * u);
  c.strokeStyle = 'rgba(110, 60, 30, 0.55)';
  c.lineWidth = 1.6 * u;
  for (let x = 14 * u; x < dockW; x += 16 * u) {
    c.beginPath(); c.moveTo(x, deckY - 8 * u); c.lineTo(x, deckY + 1 * u); c.stroke();
  }
  // a bucket on the dock
  const bx = dockW * 0.5;
  c.beginPath();
  c.moveTo(bx - 10 * u, deckY - 30 * u);
  c.lineTo(bx + 10 * u, deckY - 30 * u);
  c.lineTo(bx + 8 * u, deckY - 9 * u);
  c.lineTo(bx - 8 * u, deckY - 9 * u);
  c.closePath();
  c.fillStyle = '#6fc8ff';
  c.fill();
  ink(c, 2.4 * u);
  c.beginPath(); c.arc(bx, deckY - 30 * u, 10 * u, Math.PI, TAU);
  c.strokeStyle = INK;
  c.lineWidth = 2 * u;
  c.stroke();

  // reeds and cattails on the right
  const rx0 = w - 30 * u;
  for (let i = 0; i < 5; i++) {
    const x = rx0 + (i - 2) * 9 * u;
    const top = surfaceY - (34 + (i % 3) * 14) * u;
    c.strokeStyle = '#2f9e4d';
    c.lineWidth = 4 * u;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, surfaceY + 6 * u); c.quadraticCurveTo(x + 4 * u, (top + surfaceY) / 2, x + (i - 2) * 2 * u, top); c.stroke();
    if (i % 2 === 0) {
      c.fillStyle = '#8a5a35';
      roundRectPath(c, x + (i - 2) * 2 * u - 3.5 * u, top - 4 * u, 7 * u, 16 * u, 3.5 * u);
      c.fill();
      ink(c, 1.8 * u);
    }
  }

  // lily pads
  for (const [fx, fl] of [[0.3, true], [0.62, false]]) {
    const lx = w * fx;
    const ly = surfaceY + 3 * u;
    c.beginPath();
    c.moveTo(lx, ly);
    c.ellipse(lx, ly, 22 * u, 6 * u, 0, 0.25, TAU - 0.05);
    c.closePath();
    c.fillStyle = '#4fc56a';
    c.fill();
    ink(c, 2 * u);
    if (fl) {
      c.fillStyle = '#ff9ad6';
      for (let i = 0; i < 5; i++) {
        const a = Math.PI + (i / 4) * Math.PI;
        c.beginPath(); c.ellipse(lx + 6 * u + Math.cos(a) * 5 * u, ly - 4 * u + Math.sin(a) * 4 * u, 4 * u, 2.4 * u, a, 0, TAU); c.fill();
      }
      c.fillStyle = '#ffe866';
      c.beginPath(); c.arc(lx + 6 * u, ly - 4 * u, 2.4 * u, 0, TAU); c.fill();
    }
  }
  return { surfaceY, floorY, dockW, deckY };
}

// ---------------------------------------------------------------------------
// Sprites
// ---------------------------------------------------------------------------
// Boat sprite: BOAT_W x BOAT_H units, waterline at BOAT_WATER, facing right.
// The cat's paws (where the rod starts) are at PAWS.
export const BOAT_W = 180;
export const BOAT_H = 150;
export const BOAT_WATER = 124;
export const PAWS = [108, 84];

function paintBoat(c, face) {
  // cat body in a yellow raincoat
  c.beginPath();
  c.ellipse(86, 88, 25, 24, 0, 0, TAU);
  c.fillStyle = vgrad(c, 64, 112, [[0, '#ffe066'], [1, '#ffbf1f']]);
  c.fill();
  ink(c, 3.4);
  // raincoat buttons
  c.fillStyle = '#ff8a1f';
  c.beginPath(); c.arc(92, 82, 2.6, 0, TAU); c.fill();
  c.beginPath(); c.arc(93, 94, 2.6, 0, TAU); c.fill();
  // tail curling up behind
  c.beginPath();
  c.moveTo(62, 96);
  c.quadraticCurveTo(40, 92, 44, 70);
  c.strokeStyle = INK; c.lineWidth = 10; c.lineCap = 'round'; c.stroke();
  c.strokeStyle = '#ffb46b'; c.lineWidth = 6; c.stroke();
  // head
  const hx = 88;
  const hy = 50;
  // ears
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(hx + s * 9, hy - 18);
    c.lineTo(hx + s * 21, hy - 32);
    c.lineTo(hx + s * 22, hy - 10);
    c.closePath();
    c.fillStyle = '#ffb46b';
    c.fill();
    ink(c, 3);
    c.beginPath();
    c.moveTo(hx + s * 12, hy - 18);
    c.lineTo(hx + s * 19, hy - 26);
    c.lineTo(hx + s * 19, hy - 15);
    c.closePath();
    c.fillStyle = '#ff9ab0';
    c.fill();
  }
  c.beginPath();
  c.ellipse(hx, hy, 25, 22, 0, 0, TAU);
  c.fillStyle = vgrad(c, hy - 22, hy + 22, [[0, '#ffc98a'], [1, '#ff9f4a']]);
  c.fill();
  ink(c, 3.4);
  // stripes
  c.strokeStyle = 'rgba(200, 100, 30, 0.6)';
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(hx - 4, hy - 21); c.lineTo(hx - 3, hy - 13); c.moveTo(hx + 4, hy - 21); c.lineTo(hx + 3, hy - 13); c.stroke();
  // fisherman's hat
  c.beginPath();
  c.ellipse(hx, hy - 19, 30, 7, -0.05, 0, TAU);
  c.fillStyle = '#ffd23a';
  c.fill();
  ink(c, 3);
  c.beginPath();
  c.moveTo(hx - 17, hy - 20);
  c.quadraticCurveTo(hx - 15, hy - 40, hx, hy - 40);
  c.quadraticCurveTo(hx + 15, hy - 40, hx + 17, hy - 20);
  c.closePath();
  c.fillStyle = vgrad(c, hy - 40, hy - 20, [[0, '#fff07a'], [1, '#ffc21f']]);
  c.fill();
  ink(c, 3);
  c.fillStyle = '#ff7ac6';
  c.fillRect(hx - 16, hy - 27, 32, 5);
  // face (looking a little toward the front)
  const fx = hx + 5;
  if (face === 'joy') {
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath(); c.arc(fx - 9, hy + 2, 4.5, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    c.beginPath(); c.arc(fx + 9, hy + 2, 4.5, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    c.beginPath(); c.arc(fx, hy + 8, 6, 0.1, Math.PI - 0.1); c.closePath();
    c.fillStyle = '#c4325e'; c.fill(); ink(c, 2.4);
    c.fillStyle = '#ff8fb0';
    c.beginPath(); c.ellipse(fx, hy + 12, 3, 1.8, 0, 0, TAU); c.fill();
  } else {
    for (const s of [-1, 1]) {
      c.fillStyle = INK;
      c.beginPath(); c.ellipse(fx + s * 9, hy, 3.6, 4.6, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(fx + s * 9 + 1.2, hy - 1.6, 1.5, 0, TAU); c.fill();
    }
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(fx - 3, hy + 9, 3, 0.1 * Math.PI, 0.9 * Math.PI);
    c.arc(fx + 3, hy + 9, 3, 0.1 * Math.PI, 0.9 * Math.PI);
    c.stroke();
  }
  c.fillStyle = '#ff6f91';
  c.beginPath(); c.moveTo(fx - 3, hy + 4); c.lineTo(fx + 3, hy + 4); c.lineTo(fx, hy + 7.5); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255, 90, 120, 0.45)';
  c.beginPath(); c.ellipse(fx - 15, hy + 8, 4.5, 2.8, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(fx + 15, hy + 8, 4.5, 2.8, 0, 0, TAU); c.fill();
  // whiskers
  c.strokeStyle = 'rgba(45, 36, 66, 0.7)';
  c.lineWidth = 1.4;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(fx + s * 17, hy + 4); c.lineTo(fx + s * 29, hy + 1);
    c.moveTo(fx + s * 17, hy + 7); c.lineTo(fx + s * 29, hy + 8);
    c.stroke();
  }
  // paws holding the rod
  c.beginPath(); c.arc(PAWS[0], PAWS[1], 7, 0, TAU);
  c.fillStyle = '#ffc98a'; c.fill(); ink(c, 2.6);

  // hull
  c.beginPath();
  c.moveTo(8, 100);
  c.lineTo(172, 100);
  c.quadraticCurveTo(166, 134, 136, 140);
  c.lineTo(46, 140);
  c.quadraticCurveTo(16, 134, 8, 100);
  c.closePath();
  c.fillStyle = vgrad(c, 100, 140, [[0, '#ff7a6a'], [1, '#d93a3a']]);
  c.fill();
  c.save();
  c.clip();
  c.fillStyle = '#ffffff';
  c.fillRect(0, 112, BOAT_W, 7);
  c.fillStyle = 'rgba(255,255,255,0.3)';
  c.fillRect(0, 100, BOAT_W, 5);
  c.restore();
  c.beginPath();
  c.moveTo(8, 100);
  c.lineTo(172, 100);
  c.quadraticCurveTo(166, 134, 136, 140);
  c.lineTo(46, 140);
  c.quadraticCurveTo(16, 134, 8, 100);
  c.closePath();
  ink(c, 3.6);
  // wooden rim
  roundRectPath(c, 2, 94, 176, 10, 5);
  c.fillStyle = '#c9824a';
  c.fill();
  ink(c, 3);
  // name dot / porthole
  c.beginPath(); c.arc(140, 126, 5, 0, TAU);
  c.fillStyle = '#bfefff'; c.fill(); ink(c, 2.2);
}

export function buildBoat(res) {
  return {
    calm: makeSprite(BOAT_W, BOAT_H, (c) => paintBoat(c, 'calm'), res),
    joy: makeSprite(BOAT_W, BOAT_H, (c) => paintBoat(c, 'joy'), res),
  };
}

export const BOBBER_W = 26;
export const BOBBER_H = 34;
export function buildBobber(res) {
  return makeSprite(BOBBER_W, BOBBER_H, (c) => {
    const x = 13;
    const y = 20;
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x, 2); c.stroke();
    c.beginPath(); c.arc(x, y, 10, 0, TAU);
    c.fillStyle = '#ff4d5e';
    c.fill();
    c.save();
    c.clip();
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, BOBBER_W, y);
    c.restore();
    c.beginPath(); c.arc(x, y, 10, 0, TAU);
    ink(c, 2.8);
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath(); c.ellipse(x - 4, y + 4, 2.2, 3, 0.4, 0, TAU); c.fill();
  }, res);
}

export const DUCK_W = 80;
export const DUCK_H = 64;
export const DUCK_WATER = 52;
export function buildDuck(res) {
  return makeSprite(DUCK_W, DUCK_H, (c) => {
    // tail
    c.beginPath(); c.moveTo(14, 38); c.lineTo(4, 26); c.lineTo(20, 32); c.closePath();
    c.fillStyle = '#ffd23a'; c.fill(); ink(c, 2.6);
    // body
    c.beginPath(); c.ellipse(34, 42, 25, 14, 0, 0, TAU);
    c.fillStyle = vgrad(c, 28, 56, [[0, '#fff27a'], [1, '#ffc21f']]);
    c.fill(); ink(c, 3);
    // wing
    c.beginPath(); c.ellipse(30, 40, 12, 7, -0.25, 0, TAU);
    c.fillStyle = '#ffe14a'; c.fill(); ink(c, 2.2);
    // head
    c.beginPath(); c.arc(56, 22, 13, 0, TAU);
    c.fillStyle = vgrad(c, 9, 35, [[0, '#fff27a'], [1, '#ffd23a']]);
    c.fill(); ink(c, 3);
    // beak
    c.beginPath(); c.moveTo(66, 21); c.quadraticCurveTo(78, 20, 77, 26); c.quadraticCurveTo(72, 29, 65, 27); c.closePath();
    c.fillStyle = '#ff8a1f'; c.fill(); ink(c, 2.4);
    // eye and cheek
    c.fillStyle = INK;
    c.beginPath(); c.arc(59, 18, 2.6, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(59.8, 17, 1, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255, 110, 140, 0.45)';
    c.beginPath(); c.ellipse(57, 26, 3.6, 2.2, 0, 0, TAU); c.fill();
    // little hair tuft
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(54, 9); c.quadraticCurveTo(56, 3, 60, 6); c.stroke();
  }, res);
}

export const CLOUD_W = 140;
export const CLOUD_H = 60;
export function buildCloud(res) {
  return makeSprite(CLOUD_W, CLOUD_H, (c) => {
    const puffs = [[34, 40, 20], [58, 28, 24], [86, 26, 22], [108, 38, 18], [70, 44, 18]];
    c.fillStyle = 'rgba(110, 150, 210, 0.18)';
    for (const [x, y, r] of puffs) { c.beginPath(); c.arc(x, y + 4, r, 0, TAU); c.fill(); }
    c.fillStyle = '#ffffff';
    for (const [x, y, r] of puffs) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  }, Math.min(res, 2));
}

/** A slanted beam of sunlight for under the water. */
export function buildRay() {
  return makeSprite(60, 300, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(18, 0); c.lineTo(42, 0); c.lineTo(60, 300); c.lineTo(0, 300);
    c.closePath();
    c.fill();
  }, 1);
}

export function buildBubble(res) {
  return makeSprite(24, 24, (c) => {
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = 2;
    c.beginPath(); c.arc(12, 12, 9.5, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.beginPath(); c.arc(8.5, 8.5, 2.6, 0, TAU); c.fill();
  }, Math.min(res, 2));
}
