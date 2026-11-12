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

function paintBoat(c, face, v = {}) {
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
  if (v.hat === 'beanie') {
    // a cozy knitted hat
    c.beginPath();
    c.moveTo(hx - 24, hy - 14);
    c.quadraticCurveTo(hx - 24, hy - 44, hx, hy - 44);
    c.quadraticCurveTo(hx + 24, hy - 44, hx + 24, hy - 14);
    c.closePath();
    c.fillStyle = vgrad(c, hy - 44, hy - 14, [[0, '#8fd8ff'], [1, '#3d9bff']]);
    c.fill();
    ink(c, 3);
    c.strokeStyle = 'rgba(255,255,255,0.7)';
    c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(hx - 20, hy - 30); c.lineTo(hx + 20, hy - 30); c.stroke();
    roundRectPath(c, hx - 27, hy - 21, 54, 10, 5);
    c.fillStyle = '#ff7ac6'; c.fill(); ink(c, 2.6);
    c.beginPath(); c.arc(hx, hy - 47, 7, 0, TAU);
    c.fillStyle = '#ffffff'; c.fill(); ink(c, 2.6);
  } else if (v.hat === 'safari') {
    // an explorer's helmet
    c.beginPath(); c.ellipse(hx, hy - 18, 32, 7, -0.05, 0, TAU);
    c.fillStyle = '#e8cf8a'; c.fill(); ink(c, 3);
    c.beginPath();
    c.moveTo(hx - 21, hy - 19);
    c.quadraticCurveTo(hx - 20, hy - 46, hx, hy - 46);
    c.quadraticCurveTo(hx + 20, hy - 46, hx + 21, hy - 19);
    c.closePath();
    c.fillStyle = vgrad(c, hy - 46, hy - 19, [[0, '#fff0c0'], [1, '#d9b860']]);
    c.fill(); ink(c, 3);
    c.fillStyle = '#5cd65c';
    c.fillRect(hx - 20, hy - 27, 40, 5);
    c.beginPath(); c.arc(hx, hy - 47, 3, 0, TAU); c.fillStyle = '#d9b860'; c.fill(); ink(c, 2);
  } else {
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
  }
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

  if (v.hull === 'canoe') {
    // a long wooden canoe with a paddle
    c.save();
    c.translate(36, 66);
    c.rotate(0.55);
    roundRectPath(c, -3, 0, 6, 70, 3);
    c.fillStyle = '#c9824a'; c.fill(); ink(c, 2.4);
    c.beginPath(); c.ellipse(0, 76, 8, 14, 0, 0, TAU);
    c.fillStyle = '#e0a060'; c.fill(); ink(c, 2.4);
    c.restore();
    const hull = () => {
      c.beginPath();
      c.moveTo(-2, 92);
      c.quadraticCurveTo(90, 108, 182, 92);
      c.quadraticCurveTo(170, 136, 130, 138);
      c.lineTo(50, 138);
      c.quadraticCurveTo(10, 136, -2, 92);
      c.closePath();
    };
    hull();
    c.fillStyle = vgrad(c, 92, 138, [[0, '#d9935a'], [1, '#9a5a2e']]);
    c.fill();
    c.save(); hull(); c.clip();
    c.strokeStyle = 'rgba(90, 45, 15, 0.45)';
    c.lineWidth = 2;
    for (const y of [112, 124]) { c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(90, y + 8, 182, y); c.stroke(); }
    c.fillStyle = '#ffd23a';
    for (const x of [40, 90, 140]) { c.beginPath(); c.moveTo(x - 6, 116); c.lineTo(x, 110); c.lineTo(x + 6, 116); c.lineTo(x, 122); c.closePath(); c.fill(); }
    c.restore();
    hull(); ink(c, 3.6);
    c.strokeStyle = INK; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-2, 92); c.quadraticCurveTo(90, 108, 182, 92); c.stroke();
    return;
  }
  if (v.hull === 'sled') {
    // a little wooden sled on the ice
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(22, 124); c.lineTo(156, 124); c.quadraticCurveTo(172, 124, 170, 110);
    c.strokeStyle = INK; c.lineWidth = 8; c.stroke();
    c.strokeStyle = '#ff5f7a'; c.lineWidth = 4; c.stroke();
    for (const x of [44, 90, 134]) {
      c.fillStyle = '#c9824a';
      c.fillRect(x - 3, 108, 6, 16);
      c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x - 3, 108, 6, 16);
    }
    roundRectPath(c, 20, 98, 140, 12, 5);
    c.fillStyle = vgrad(c, 98, 110, [[0, '#e8a868'], [1, '#b86e36']]);
    c.fill(); ink(c, 3);
    c.strokeStyle = 'rgba(110, 60, 30, 0.5)'; c.lineWidth = 1.6;
    for (let x = 40; x < 160; x += 22) { c.beginPath(); c.moveTo(x, 99); c.lineTo(x, 109); c.stroke(); }
    return;
  }
  const top = v.hullTop || '#ff7a6a';
  const bottom = v.hullBottom || '#d93a3a';
  // hull
  c.beginPath();
  c.moveTo(8, 100);
  c.lineTo(172, 100);
  c.quadraticCurveTo(166, 134, 136, 140);
  c.lineTo(46, 140);
  c.quadraticCurveTo(16, 134, 8, 100);
  c.closePath();
  c.fillStyle = vgrad(c, 100, 140, [[0, top], [1, bottom]]);
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

/** The cat's boat for a place: v = { hull: 'boat' | 'canoe' | 'sled', hat, hullTop, hullBottom }. */
export function buildBoat(res, v) {
  return {
    calm: makeSprite(BOAT_W, BOAT_H, (c) => paintBoat(c, 'calm', v), res),
    joy: makeSprite(BOAT_W, BOAT_H, (c) => paintBoat(c, 'joy', v), res),
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

// ---------------------------------------------------------------------------
// The other places: the ocean, ice fishing and the jungle river
// ---------------------------------------------------------------------------
function paintSun(c, sx, sy, sr, u) {
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
}

function floorLine(w, floorY, u) {
  return (x) => floorY + Math.sin(x * 0.013) * 7 * u + Math.sin(x * 0.041) * 3 * u;
}
function paintFloor(c, w, h, floorY, u, R, top, bottom, dots) {
  const fy = floorLine(w, floorY, u);
  c.beginPath();
  c.moveTo(0, h);
  for (let x = 0; x <= w + 20; x += 20) c.lineTo(x, fy(x));
  c.lineTo(w, h);
  c.closePath();
  c.fillStyle = vgrad(c, floorY - 8 * u, h, [[0, top], [1, bottom]]);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = 2 * u;
  c.beginPath();
  for (let x = 0; x <= w + 20; x += 20) { if (x === 0) c.moveTo(x, fy(x)); else c.lineTo(x, fy(x)); }
  c.stroke();
  c.fillStyle = dots;
  for (let i = 0; i < Math.round(w / 6); i++) {
    c.beginPath(); c.arc(R() * w, floorY + 10 * u + R() * (h - floorY), (1 + R() * 1.8) * u, 0, TAU); c.fill();
  }
}
function pebbles(c, w, floorY, u, R, cols, n) {
  for (let i = 0; i < n; i++) {
    const x = R() * w;
    const y = floorY + (6 + R() * 18) * u;
    const r = (4 + R() * 6) * u;
    c.beginPath(); c.ellipse(x, y, r * 1.3, r, 0, 0, TAU);
    c.fillStyle = cols[i % cols.length];
    c.fill();
    ink(c, 2 * u);
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.ellipse(x - r * 0.4, y - r * 0.35, r * 0.4, r * 0.2, 0, 0, TAU); c.fill();
  }
}
function waterLight(c, w, surfaceY, u, R, n) {
  c.strokeStyle = 'rgba(255,255,255,0.16)';
  c.lineWidth = 2.5 * u;
  c.lineCap = 'round';
  for (let k = 0; k < n; k++) {
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
}
function coral(c, x, y, s, col, R) {
  c.strokeStyle = col;
  c.lineCap = 'round';
  const branch = (x0, y0, a, len, depth) => {
    const x1 = x0 + Math.cos(a) * len;
    const y1 = y0 + Math.sin(a) * len;
    c.lineWidth = (3 + depth * 2.2) * s;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    if (depth > 0) {
      branch(x1, y1, a - 0.45 - R() * 0.2, len * 0.72, depth - 1);
      branch(x1, y1, a + 0.45 + R() * 0.2, len * 0.72, depth - 1);
    } else {
      c.fillStyle = col;
      c.beginPath(); c.arc(x1, y1, 3.2 * s, 0, TAU); c.fill();
    }
  };
  branch(x, y, -Math.PI / 2, 18 * s, 2);
}

export function paintOcean(c, w, h) {
  const R = rng(17);
  const u = Math.min(w, h) / 400;
  const { surfaceY, floorY } = pondLayout(w, h);
  c.fillStyle = vgrad(c, 0, surfaceY, [[0, '#4cb8ff'], [0.7, '#a8e4ff'], [1, '#e2f8ff']]);
  c.fillRect(0, 0, w, surfaceY + 2);
  paintSun(c, w * 0.84, Math.max(surfaceY * 0.42, 52 * u), 26 * u, u);
  // a little island with a lighthouse on the horizon
  const ix = w * 0.62;
  c.fillStyle = '#ffe7a8';
  c.beginPath(); c.ellipse(ix, surfaceY + 2, 46 * u, 12 * u, 0, Math.PI, TAU); c.fill();
  c.fillStyle = '#5cc97a';
  c.beginPath(); c.ellipse(ix - 14 * u, surfaceY - 6 * u, 18 * u, 7 * u, 0, Math.PI, TAU); c.fill();
  const lx = ix + 16 * u;
  const lb = surfaceY - 6 * u;
  c.beginPath(); c.moveTo(lx - 7 * u, lb); c.lineTo(lx - 5 * u, lb - 38 * u); c.lineTo(lx + 5 * u, lb - 38 * u); c.lineTo(lx + 7 * u, lb); c.closePath();
  c.fillStyle = '#ffffff'; c.fill();
  c.save(); c.clip();
  c.fillStyle = '#ff5a5a';
  for (let k = 0; k < 3; k++) c.fillRect(lx - 8 * u, lb - (8 + k * 12) * u, 16 * u, 6 * u);
  c.restore();
  c.beginPath(); c.moveTo(lx - 7 * u, lb); c.lineTo(lx - 5 * u, lb - 38 * u); c.lineTo(lx + 5 * u, lb - 38 * u); c.lineTo(lx + 7 * u, lb); c.closePath(); ink(c, 1.8 * u);
  c.fillStyle = '#fff27a';
  c.fillRect(lx - 5 * u, lb - 46 * u, 10 * u, 8 * u);
  c.strokeRect(lx - 5 * u, lb - 46 * u, 10 * u, 8 * u);
  c.beginPath(); c.moveTo(lx - 7 * u, lb - 46 * u); c.lineTo(lx, lb - 53 * u); c.lineTo(lx + 7 * u, lb - 46 * u); c.closePath();
  c.fillStyle = '#ff5a5a'; c.fill(); ink(c, 1.8 * u);
  // seagulls
  c.strokeStyle = INK;
  c.lineWidth = 2.2 * u;
  for (let i = 0; i < 3; i++) {
    const gx = w * (0.18 + i * 0.13 + R() * 0.05);
    const gy = surfaceY * (0.3 + R() * 0.3);
    const gs = (6 + R() * 3) * u;
    c.beginPath(); c.moveTo(gx - gs, gy); c.quadraticCurveTo(gx - gs * 0.5, gy - gs * 0.7, gx, gy); c.quadraticCurveTo(gx + gs * 0.5, gy - gs * 0.7, gx + gs, gy); c.stroke();
  }
  // deep blue sea
  c.fillStyle = vgrad(c, surfaceY, floorY + 20 * u, [[0, '#4cc4f0'], [0.25, '#2196dc'], [0.7, '#1262b8'], [1, '#0c3f8c']]);
  c.fillRect(0, surfaceY, w, h - surfaceY);
  waterLight(c, w, surfaceY, u, R, 7);
  // far rocks and corals
  c.fillStyle = 'rgba(10, 40, 110, 0.4)';
  for (let i = 0; i < 6; i++) {
    c.beginPath();
    c.ellipse(w * (i / 5) + (R() - 0.5) * 60 * u, floorY + 6 * u, (50 + R() * 60) * u, (30 + R() * 40) * u, 0, Math.PI, TAU);
    c.fill();
  }
  paintFloor(c, w, h, floorY, u, R, '#ffe2a0', '#e0a860', 'rgba(180, 120, 50, 0.3)');
  const fy = floorLine(w, floorY, u);
  const corals = ['#ff7ac6', '#ff9a4d', '#c98bff', '#ff5f7a'];
  const nc = Math.max(3, Math.round(w / (90 * u)));
  for (let i = 0; i < nc; i++) {
    const x = ((i + 0.2 + R() * 0.6) / nc) * w;
    coral(c, x, fy(x) + 4 * u, u * (0.8 + R() * 0.5), corals[i % corals.length], R);
  }
  // brain coral and a starfish
  for (const fx of [0.42, 0.88]) {
    const x = w * fx;
    const y = fy(x) + 6 * u;
    c.beginPath(); c.ellipse(x, y, 20 * u, 13 * u, 0, Math.PI, TAU); c.closePath();
    c.fillStyle = '#ffb35c'; c.fill(); ink(c, 2.2 * u);
    c.strokeStyle = 'rgba(200, 100, 20, 0.6)'; c.lineWidth = 1.6 * u;
    for (let k = 1; k < 4; k++) { c.beginPath(); c.ellipse(x, y, k * 5 * u, k * 3.2 * u, 0, Math.PI, TAU); c.stroke(); }
  }
  c.save();
  c.translate(w * 0.24, fy(w * 0.24) + 14 * u);
  c.rotate(-0.3);
  starPath(c, 0, 0, 14 * u, 6.5 * u);
  c.fillStyle = '#ffd23a'; c.fill(); ink(c, 2.2 * u);
  c.restore();
  pebbles(c, w, floorY, u, R, ['#b9c3d6', '#9fb0c9', '#ffd3e4'], Math.round(w / (60 * u)));
  // the pier
  const dockW = Math.min(w * 0.2, 120 * u);
  const deckY = surfaceY - 22 * u;
  for (const px of [dockW * 0.2, dockW * 0.7]) {
    c.fillStyle = vgrad(c, deckY, floorY, [[0, '#a8683c'], [0.3, '#7a4a28'], [1, '#3a2a40']]);
    roundRectPath(c, px - 6 * u, deckY, 12 * u, floorY - deckY + 10 * u, 3 * u);
    c.fill();
    ink(c, 2.4 * u);
    c.strokeStyle = 'rgba(80, 200, 120, 0.6)';
    c.lineWidth = 3 * u;
    for (let k = 0; k < 3; k++) { const y = surfaceY + (40 + k * 60 + R() * 20) * u; if (y < floorY) { c.beginPath(); c.moveTo(px - 6 * u, y); c.lineTo(px + 6 * u, y + 6 * u); c.stroke(); } }
  }
  c.fillStyle = '#d99a5c';
  roundRectPath(c, -10 * u, deckY - 10 * u, dockW + 10 * u, 12 * u, 4 * u);
  c.fill();
  ink(c, 2.6 * u);
  // railing and a life ring
  c.strokeStyle = INK;
  c.lineWidth = 2.4 * u;
  for (const px of [dockW * 0.2, dockW * 0.7]) {
    c.fillStyle = '#c9824a';
    c.fillRect(px - 3 * u, deckY - 34 * u, 6 * u, 25 * u);
    c.strokeRect(px - 3 * u, deckY - 34 * u, 6 * u, 25 * u);
  }
  c.fillStyle = '#c9824a';
  c.fillRect(-4 * u, deckY - 36 * u, dockW * 0.7 + 8 * u, 5 * u);
  c.strokeRect(-4 * u, deckY - 36 * u, dockW * 0.7 + 8 * u, 5 * u);
  const rx = dockW * 0.45;
  const ry = deckY - 22 * u;
  c.beginPath(); c.arc(rx, ry, 11 * u, 0, TAU); c.arc(rx, ry, 5.5 * u, 0, TAU, true);
  c.fillStyle = '#ffffff'; c.fill('evenodd');
  c.save(); c.beginPath(); c.arc(rx, ry, 11 * u, 0, TAU); c.arc(rx, ry, 5.5 * u, 0, TAU, true); c.clip('evenodd');
  c.fillStyle = '#ff5a5a';
  for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(rx, ry); c.arc(rx, ry, 12 * u, (k * TAU) / 4, (k * TAU) / 4 + 0.6); c.closePath(); c.fill(); }
  c.restore();
  c.beginPath(); c.arc(rx, ry, 11 * u, 0, TAU); ink(c, 2 * u);
  c.beginPath(); c.arc(rx, ry, 5.5 * u, 0, TAU); ink(c, 2 * u);
  return { surfaceY, floorY, dockW, deckY };
}

export function paintIce(c, w, h) {
  const R = rng(29);
  const u = Math.min(w, h) / 400;
  const { surfaceY, floorY } = pondLayout(w, h);
  const iceTop = surfaceY - 12 * u;
  const iceBottom = surfaceY + 18 * u;
  c.fillStyle = vgrad(c, 0, surfaceY, [[0, '#8fcfff'], [0.7, '#d6efff'], [1, '#f2faff']]);
  c.fillRect(0, 0, w, surfaceY + 2);
  // a pale sun and snowy mountains
  const g = c.createRadialGradient(w * 0.82, surfaceY * 0.35, 0, w * 0.82, surfaceY * 0.35, 80 * u);
  g.addColorStop(0, 'rgba(255, 255, 230, 0.95)');
  g.addColorStop(0.25, 'rgba(255, 250, 200, 0.6)');
  g.addColorStop(1, 'rgba(255, 250, 200, 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, surfaceY);
  const peaks = Math.max(3, Math.round(w / (110 * u)));
  for (let i = 0; i < peaks; i++) {
    const x = ((i + 0.5) / peaks) * w + (R() - 0.5) * 30 * u;
    const ph = (34 + R() * 30) * u;
    const pw = (60 + R() * 40) * u;
    c.beginPath(); c.moveTo(x - pw, iceTop + 2); c.lineTo(x, iceTop - ph); c.lineTo(x + pw, iceTop + 2); c.closePath();
    c.fillStyle = '#c9dcf5'; c.fill();
    c.beginPath(); c.moveTo(x - pw * 0.35, iceTop - ph * 0.65); c.lineTo(x, iceTop - ph); c.lineTo(x + pw * 0.35, iceTop - ph * 0.65);
    c.lineTo(x + pw * 0.15, iceTop - ph * 0.55); c.lineTo(x, iceTop - ph * 0.68); c.lineTo(x - pw * 0.15, iceTop - ph * 0.55); c.closePath();
    c.fillStyle = '#ffffff'; c.fill();
  }
  // icy water under the ice
  c.fillStyle = vgrad(c, surfaceY, floorY + 20 * u, [[0, '#7fd6f2'], [0.3, '#3a9ad6'], [0.75, '#1f5fae'], [1, '#183f86']]);
  c.fillRect(0, surfaceY, w, h - surfaceY);
  waterLight(c, w, iceBottom, u, R, 5);
  // the sea floor: pale sand and rocks
  c.fillStyle = 'rgba(20, 50, 110, 0.4)';
  for (let i = 0; i < 6; i++) {
    c.beginPath();
    c.ellipse(w * (i / 5) + (R() - 0.5) * 60 * u, floorY + 6 * u, (50 + R() * 60) * u, (24 + R() * 30) * u, 0, Math.PI, TAU);
    c.fill();
  }
  paintFloor(c, w, h, floorY, u, R, '#e6eef8', '#b8c8de', 'rgba(110, 140, 180, 0.3)');
  pebbles(c, w, floorY, u, R, ['#9fb0c9', '#c9d6ea', '#8a9cc0', '#d6e2f2'], Math.round(w / (40 * u)));
  // the ice sheet, with two fishing holes
  const holes = [w * 0.27, w * 0.73];
  const hw = 34 * u;
  const segs = [[-20, holes[0] - hw], [holes[0] + hw, holes[1] - hw], [holes[1] + hw, w + 20]];
  for (const hx of holes) {
    // dark water inside the hole
    c.fillStyle = vgrad(c, iceTop, iceBottom, [[0, '#2f7fc0'], [1, '#5fc0ea']]);
    c.fillRect(hx - hw, iceTop + 6 * u, hw * 2, iceBottom - iceTop - 6 * u);
  }
  for (const [x0, x1] of segs) {
    roundRectPath(c, x0, iceTop, x1 - x0, iceBottom - iceTop, 9 * u);
    c.fillStyle = vgrad(c, iceTop, iceBottom, [[0, '#ffffff'], [0.4, '#e2f5ff'], [1, '#a8d8f2']]);
    c.fill();
    ink(c, 2.6 * u);
    c.strokeStyle = 'rgba(120, 180, 230, 0.6)';
    c.lineWidth = 1.6 * u;
    for (let k = 0; k < Math.max(1, (x1 - x0) / (70 * u)); k++) {
      const x = x0 + 20 * u + R() * Math.max(10, x1 - x0 - 40 * u);
      c.beginPath(); c.moveTo(x, iceTop + 10 * u); c.lineTo(x + 6 * u, iceTop + 16 * u); c.lineTo(x + 2 * u, iceBottom - 4 * u); c.stroke();
    }
    // icicles underneath
    c.fillStyle = '#c9ecff';
    for (let x = x0 + 14 * u; x < x1 - 10 * u; x += (16 + R() * 26) * u) {
      const len = (6 + R() * 12) * u;
      c.beginPath(); c.moveTo(x - 3.5 * u, iceBottom - 1); c.lineTo(x, iceBottom + len); c.lineTo(x + 3.5 * u, iceBottom - 1); c.closePath();
      c.fill(); ink(c, 1.4 * u);
    }
    // snow lumps on top
    c.fillStyle = '#ffffff';
    for (let x = x0 + 18 * u; x < x1 - 16 * u; x += (30 + R() * 50) * u) {
      c.beginPath(); c.ellipse(x, iceTop + 1, (10 + R() * 10) * u, 4.5 * u, 0, Math.PI, TAU); c.fill();
    }
  }
  // an igloo on the ice
  const gx = Math.min(w * 0.1, 50 * u) + 8 * u;
  const gr = 30 * u;
  c.beginPath(); c.arc(gx, iceTop + 1, gr, Math.PI, TAU); c.closePath();
  c.fillStyle = vgrad(c, iceTop - gr, iceTop, [[0, '#ffffff'], [1, '#d6ecfa']]);
  c.fill(); ink(c, 2.6 * u);
  c.save(); c.beginPath(); c.arc(gx, iceTop + 1, gr, Math.PI, TAU); c.clip();
  c.strokeStyle = 'rgba(120, 170, 220, 0.7)'; c.lineWidth = 1.6 * u;
  for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(gx - gr, iceTop - k * 8 * u); c.lineTo(gx + gr, iceTop - k * 8 * u); c.stroke(); }
  for (let k = 0; k < 4; k++) { for (let j = -3; j <= 3; j++) { const x = gx + j * 12 * u + (k % 2) * 6 * u; c.beginPath(); c.moveTo(x, iceTop - k * 8 * u); c.lineTo(x, iceTop - (k + 1) * 8 * u); c.stroke(); } }
  c.restore();
  c.beginPath(); c.arc(gx + 8 * u, iceTop + 1, 10 * u, Math.PI, TAU); c.closePath();
  c.fillStyle = '#3a5a8a'; c.fill(); ink(c, 2.2 * u);
  return { surfaceY, floorY, dockW: 0, deckY: iceTop, holes, iceTop, iceBottom };
}

function bigLeaf(c, x, y, len, a, col, u) {
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(len * 0.3, -len * 0.32, len * 0.85, -len * 0.25, len, 0);
  c.bezierCurveTo(len * 0.85, len * 0.25, len * 0.3, len * 0.32, 0, 0);
  c.closePath();
  c.fillStyle = col; c.fill(); ink(c, 2.4 * u);
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.8 * u;
  c.beginPath(); c.moveTo(len * 0.05, 0); c.lineTo(len * 0.92, 0); c.stroke();
  for (let k = 1; k < 4; k++) {
    const px = len * k * 0.22;
    c.beginPath(); c.moveTo(px, 0); c.lineTo(px + len * 0.1, -len * 0.14); c.moveTo(px, 0); c.lineTo(px + len * 0.1, len * 0.14); c.stroke();
  }
  c.restore();
}

export function paintJungle(c, w, h) {
  const R = rng(41);
  const u = Math.min(w, h) / 400;
  const { surfaceY, floorY } = pondLayout(w, h);
  c.fillStyle = vgrad(c, 0, surfaceY, [[0, '#6fd0ff'], [0.65, '#c4f2e6'], [1, '#e8fbe0']]);
  c.fillRect(0, 0, w, surfaceY + 2);
  paintSun(c, w * 0.5, Math.max(surfaceY * 0.3, 40 * u), 22 * u, u);
  // the jungle on the far bank: layers of round treetops and palms
  const layers = [['#4fbf72', 34], ['#38a85e', 22], ['#2f9450', 10]];
  for (const [col, hgt] of layers) {
    c.fillStyle = col;
    for (let x = -20 * u; x < w + 30 * u; x += (22 + R() * 18) * u) {
      c.beginPath(); c.arc(x, surfaceY - hgt * u + R() * 8 * u, (16 + R() * 12) * u, 0, TAU); c.fill();
    }
    c.fillRect(0, surfaceY - hgt * u, w, hgt * u + 2);
  }
  for (const fx of [0.3, 0.75]) {
    const x = w * fx;
    const base = surfaceY - 10 * u;
    c.strokeStyle = '#8a5a35'; c.lineWidth = 5 * u; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + 8 * u, base - 30 * u, x + 4 * u, base - 58 * u); c.stroke();
    for (let k = 0; k < 6; k++) bigLeaf(c, x + 4 * u, base - 58 * u, 28 * u, -Math.PI + (k / 5) * Math.PI + 0.1, '#3fbf5e', u);
  }
  // a parrot on a branch
  const px = w * 0.86;
  const py = Math.max(52 * u, surfaceY * 0.42);
  c.strokeStyle = '#8a5a35'; c.lineWidth = 5 * u;
  c.beginPath(); c.moveTo(w + 4, py + 16 * u); c.quadraticCurveTo(px, py + 14 * u, px - 30 * u, py + 22 * u); c.stroke();
  c.beginPath(); c.moveTo(px + 2 * u, py + 10 * u); c.lineTo(px + 10 * u, py + 34 * u); c.lineTo(px - 2 * u, py + 26 * u); c.closePath();
  c.fillStyle = '#3d9bff'; c.fill(); ink(c, 1.8 * u);
  c.beginPath(); c.ellipse(px, py, 9 * u, 13 * u, 0.2, 0, TAU);
  c.fillStyle = '#ff4d5e'; c.fill(); ink(c, 2 * u);
  c.beginPath(); c.ellipse(px + 2 * u, py + 3 * u, 5 * u, 8 * u, 0.3, 0, TAU);
  c.fillStyle = '#ffd23a'; c.fill();
  c.beginPath(); c.arc(px - 2 * u, py - 12 * u, 7 * u, 0, TAU);
  c.fillStyle = '#ff4d5e'; c.fill(); ink(c, 2 * u);
  c.beginPath(); c.moveTo(px - 8 * u, py - 14 * u); c.quadraticCurveTo(px - 15 * u, py - 12 * u, px - 9 * u, py - 7 * u); c.closePath();
  c.fillStyle = '#fff2a6'; c.fill(); ink(c, 1.6 * u);
  c.fillStyle = INK; c.beginPath(); c.arc(px - 3 * u, py - 14 * u, 1.6 * u, 0, TAU); c.fill();
  // green river water
  c.fillStyle = vgrad(c, surfaceY, floorY + 20 * u, [[0, '#7fe0c0'], [0.25, '#3ab8a0'], [0.7, '#1f8a84'], [1, '#156068']]);
  c.fillRect(0, surfaceY, w, h - surfaceY);
  waterLight(c, w, surfaceY, u, R, 6);
  c.fillStyle = 'rgba(10, 70, 60, 0.35)';
  for (let i = 0; i < 6; i++) {
    c.beginPath();
    c.ellipse(w * (i / 5) + (R() - 0.5) * 60 * u, floorY + 6 * u, (50 + R() * 60) * u, (24 + R() * 36) * u, 0, Math.PI, TAU);
    c.fill();
  }
  paintFloor(c, w, h, floorY, u, R, '#e0c98a', '#b0945a', 'rgba(120, 90, 40, 0.3)');
  // a sunken log
  const fy = floorLine(w, floorY, u);
  const lx = w * 0.62;
  c.save();
  c.translate(lx, fy(lx) + 2 * u);
  c.rotate(-0.08);
  roundRectPath(c, -46 * u, -12 * u, 92 * u, 22 * u, 11 * u);
  c.fillStyle = vgrad(c, -12 * u, 10 * u, [[0, '#a8703a'], [1, '#6e4220']]);
  c.fill(); ink(c, 2.4 * u);
  c.beginPath(); c.ellipse(44 * u, -1 * u, 6 * u, 11 * u, 0, 0, TAU);
  c.fillStyle = '#e0b07a'; c.fill(); ink(c, 2 * u);
  c.strokeStyle = 'rgba(80, 200, 120, 0.7)'; c.lineWidth = 3 * u;
  c.beginPath(); c.moveTo(-30 * u, -11 * u); c.quadraticCurveTo(-20 * u, -16 * u, -8 * u, -11 * u); c.stroke();
  c.restore();
  pebbles(c, w, floorY, u, R, ['#9fa88a', '#c9b88a', '#8a9a7a', '#b8a6c9'], Math.round(w / (35 * u)));
  // the muddy bank on the left, with reeds
  const dockW = Math.min(w * 0.13, 70 * u);
  c.beginPath();
  c.moveTo(0, surfaceY - 22 * u);
  c.quadraticCurveTo(dockW * 0.7, surfaceY - 22 * u, dockW, surfaceY + 6 * u);
  c.quadraticCurveTo(dockW * 0.8, surfaceY + 50 * u, 0, surfaceY + 70 * u);
  c.closePath();
  c.fillStyle = vgrad(c, surfaceY - 22 * u, surfaceY + 70 * u, [[0, '#a8844a'], [0.4, '#7a5a30'], [1, '#5a4a30']]);
  c.fill(); ink(c, 2.4 * u);
  c.fillStyle = '#5cc97a';
  c.beginPath(); c.ellipse(dockW * 0.4, surfaceY - 22 * u, dockW * 0.55, 6 * u, 0, Math.PI, TAU); c.fill();
  for (let i = 0; i < 4; i++) {
    const x = dockW * (0.15 + i * 0.2);
    c.strokeStyle = '#2f9e4d'; c.lineWidth = 3.5 * u;
    c.beginPath(); c.moveTo(x, surfaceY - 20 * u); c.quadraticCurveTo(x + 3 * u, surfaceY - 40 * u, x + (i - 1.5) * 4 * u, surfaceY - (50 + (i % 2) * 12) * u); c.stroke();
  }
  // vines and big leaves hanging from the top
  const vines = Math.max(3, Math.round(w / (110 * u)));
  for (let i = 0; i < vines; i++) {
    const x = ((i + 0.3 + R() * 0.4) / vines) * w;
    const len = (40 + R() * Math.max(20, surfaceY * 0.45 - 40)) * u;
    c.strokeStyle = '#3f9e4a'; c.lineWidth = 3 * u;
    c.beginPath(); c.moveTo(x, -2); c.quadraticCurveTo(x + 14 * u, len * 0.5, x + 4 * u, len); c.stroke();
    for (let k = 0.25; k < 1; k += 0.25) {
      const yy = len * k;
      const xx = x + 14 * u * Math.sin(k * Math.PI) * 0.8;
      bigLeaf(c, xx, yy, 13 * u, k * 6 % 2 > 1 ? 0.6 : Math.PI - 0.6, '#5cd65c', u * 0.7);
    }
  }
  for (const [x, a] of [[0, 0.5], [w, Math.PI - 0.5]]) {
    bigLeaf(c, x, -4 * u, 70 * u, a + 0.3, '#2f9e4d', u);
    bigLeaf(c, x, -4 * u, 56 * u, a - 0.15, '#3fbf5e', u);
  }
  // lily pads with flowers
  for (const [fx, fl] of [[0.4, true], [0.88, false]]) {
    const x = w * fx;
    const y = surfaceY + 3 * u;
    c.beginPath(); c.moveTo(x, y); c.ellipse(x, y, 22 * u, 6 * u, 0, 0.25, TAU - 0.05); c.closePath();
    c.fillStyle = '#4fc56a'; c.fill(); ink(c, 2 * u);
    if (fl) {
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const a = Math.PI + (i / 4) * Math.PI;
        c.beginPath(); c.ellipse(x + 6 * u + Math.cos(a) * 5 * u, y - 4 * u + Math.sin(a) * 4 * u, 4 * u, 2.4 * u, a, 0, TAU); c.fill();
      }
      c.fillStyle = '#ffe866';
      c.beginPath(); c.arc(x + 6 * u, y - 4 * u, 2.4 * u, 0, TAU); c.fill();
    }
  }
  return { surfaceY, floorY, dockW, deckY: surfaceY - 22 * u };
}

/** The lily pad the frog sits on (drawn live so it can bob). */
export function paintLilyPad(c, x, y, u) {
  c.beginPath(); c.moveTo(x, y); c.ellipse(x, y, 26 * u, 7 * u, 0, 0.25, TAU - 0.05); c.closePath();
  c.fillStyle = '#5cd65c'; c.fill(); ink(c, 2.2 * u);
}

// ---------------------------------------------------------------------------
// Friends: the whale, the seal, the penguin and the frog
// ---------------------------------------------------------------------------
export const WHALE_W = 300;
export const WHALE_H = 150;
export function buildWhale(res) {
  return makeSprite(WHALE_W, WHALE_H, (c) => {
    const body = () => {
      c.beginPath();
      c.moveTo(286, 82);
      c.bezierCurveTo(286, 30, 220, 22, 150, 30);
      c.bezierCurveTo(100, 36, 70, 58, 46, 70);
      c.quadraticCurveTo(28, 60, 12, 36);
      c.quadraticCurveTo(26, 62, 8, 92);
      c.quadraticCurveTo(30, 80, 46, 80);
      c.bezierCurveTo(80, 112, 140, 128, 210, 122);
      c.bezierCurveTo(260, 118, 286, 108, 286, 82);
      c.closePath();
    };
    body();
    c.fillStyle = vgrad(c, 24, 128, [[0, '#6f9bff'], [1, '#3d5fd6']]);
    c.fill();
    c.save(); body(); c.clip();
    c.fillStyle = '#c9dcff';
    c.beginPath(); c.ellipse(200, 128, 90, 26, -0.05, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(80, 100, 200, 0.5)'; c.lineWidth = 2.5;
    for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(140 + k * 8, 108 + k * 3); c.quadraticCurveTo(200, 118 + k * 4, 270, 100 + k * 2); c.stroke(); }
    c.restore();
    body(); ink(c, 4);
    c.beginPath(); c.moveTo(170, 92); c.quadraticCurveTo(160, 118, 136, 120); c.quadraticCurveTo(150, 102, 150, 90); c.closePath();
    c.fillStyle = '#4f72e0'; c.fill(); ink(c, 3);
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.ellipse(200, 42, 36, 7, -0.05, 0, TAU); c.fill();
    c.fillStyle = INK;
    c.beginPath(); c.arc(246, 70, 5, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(247.5, 68, 1.8, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.arc(262, 84, 12, 0.3, 1.5); c.stroke();
    c.fillStyle = 'rgba(255, 110, 150, 0.45)';
    c.beginPath(); c.ellipse(240, 86, 8, 5, 0, 0, TAU); c.fill();
  }, Math.min(res, 2));
}

export const SEAL_W = 74;
export const SEAL_H = 64;
export function buildSeal(res) {
  return makeSprite(SEAL_W, SEAL_H, (c) => {
    c.beginPath();
    c.moveTo(10, 64); c.quadraticCurveTo(8, 30, 37, 22); c.quadraticCurveTo(66, 30, 64, 64); c.closePath();
    c.fillStyle = vgrad(c, 14, 64, [[0, '#c9d6ea'], [1, '#8a9cc0']]);
    c.fill(); ink(c, 3);
    c.beginPath(); c.arc(37, 26, 21, 0, TAU);
    c.fillStyle = vgrad(c, 5, 47, [[0, '#e2ebf8'], [1, '#a8b8d6']]);
    c.fill(); ink(c, 3);
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.beginPath(); c.ellipse(28, 12, 6, 3, -0.4, 0, TAU); c.fill();
    for (const x of [29, 45]) {
      c.fillStyle = INK; c.beginPath(); c.ellipse(x, 24, 3.8, 4.6, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 1.2, 22.4, 1.5, 0, TAU); c.fill();
    }
    c.beginPath(); c.ellipse(37, 33, 9, 6, 0, 0, TAU);
    c.fillStyle = '#f2f6ff'; c.fill();
    c.fillStyle = INK; c.beginPath(); c.ellipse(37, 30, 3.4, 2.4, 0, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.lineCap = 'round';
    c.beginPath(); c.arc(34, 34, 3, 0.2 * Math.PI, 0.8 * Math.PI); c.arc(40, 34, 3, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
    c.strokeStyle = 'rgba(45, 36, 66, 0.6)';
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(37 + s * 8, 32); c.lineTo(37 + s * 18, 29); c.moveTo(37 + s * 8, 35); c.lineTo(37 + s * 18, 36); c.stroke();
    }
    c.fillStyle = 'rgba(255, 110, 150, 0.45)';
    c.beginPath(); c.ellipse(22, 33, 4, 2.6, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(52, 33, 4, 2.6, 0, 0, TAU); c.fill();
  }, res);
}

export const PENGUIN_W = 64;
export const PENGUIN_H = 84;
function paintPenguin(c, flap) {
  // flippers
  for (const s of [-1, 1]) {
    c.save();
    c.translate(32 + s * 18, 44);
    c.rotate(s * (flap ? 1.1 : 0.25));
    c.beginPath(); c.ellipse(0, 12, 6, 15, 0, 0, TAU);
    c.fillStyle = '#3d3a6b'; c.fill(); ink(c, 2.6);
    c.restore();
  }
  // feet
  for (const s of [-1, 1]) {
    c.beginPath(); c.ellipse(32 + s * 9, 80, 9, 4, 0, 0, TAU);
    c.fillStyle = '#ffa63d'; c.fill(); ink(c, 2.4);
  }
  c.beginPath(); c.ellipse(32, 48, 22, 32, 0, 0, TAU);
  c.fillStyle = vgrad(c, 16, 80, [[0, '#4a4680'], [1, '#2d2a55']]);
  c.fill(); ink(c, 3);
  c.beginPath(); c.ellipse(32, 54, 15, 24, 0, 0, TAU);
  c.fillStyle = '#ffffff'; c.fill();
  c.beginPath(); c.ellipse(32, 24, 14, 11, 0, 0, TAU); c.fill();
  for (const x of [26, 38]) {
    c.fillStyle = INK; c.beginPath(); c.ellipse(x, 23, 2.8, 3.4, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 0.9, 21.8, 1.1, 0, TAU); c.fill();
  }
  c.beginPath(); c.moveTo(28, 29); c.lineTo(36, 29); c.lineTo(32, 35); c.closePath();
  c.fillStyle = '#ffa63d'; c.fill(); ink(c, 1.8);
  c.fillStyle = 'rgba(255, 110, 150, 0.5)';
  c.beginPath(); c.ellipse(21, 30, 3.4, 2.2, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(43, 30, 3.4, 2.2, 0, 0, TAU); c.fill();
  // a scarf
  c.beginPath(); c.ellipse(32, 38, 17, 4.5, 0, 0, TAU);
  c.fillStyle = '#ff5f7a'; c.fill(); ink(c, 2);
  c.beginPath(); c.moveTo(40, 39); c.lineTo(46, 52); c.lineTo(40, 53); c.lineTo(36, 40); c.closePath(); c.fill(); ink(c, 2);
}
export function buildPenguin(res) {
  return {
    calm: makeSprite(PENGUIN_W, PENGUIN_H, (c) => paintPenguin(c, false), res),
    flap: makeSprite(PENGUIN_W, PENGUIN_H, (c) => paintPenguin(c, true), res),
  };
}

export const FROG_W = 64;
export const FROG_H = 52;
function paintFrog(c, jump) {
  // back legs
  for (const s of [-1, 1]) {
    c.beginPath();
    if (jump) c.ellipse(32 + s * 16, 46, 6, 12, s * 0.6, 0, TAU);
    else c.ellipse(32 + s * 18, 42, 11, 8, 0, 0, TAU);
    c.fillStyle = '#4fc56a'; c.fill(); ink(c, 2.4);
  }
  c.beginPath(); c.ellipse(32, 34, 21, 15, 0, 0, TAU);
  c.fillStyle = vgrad(c, 19, 49, [[0, '#9ff28a'], [1, '#3fae55']]);
  c.fill(); ink(c, 3);
  c.beginPath(); c.ellipse(32, 40, 12, 7, 0, 0, TAU);
  c.fillStyle = '#e8ffc9'; c.fill();
  for (const s of [-1, 1]) {
    c.beginPath(); c.arc(32 + s * 11, 19, 8, 0, TAU);
    c.fillStyle = '#7fe06a'; c.fill(); ink(c, 2.6);
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(32 + s * 11, 19, 5, 0, TAU); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(32 + s * 11 + 0.8, 19.6, 3, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(32 + s * 11 + 1.8, 18.4, 1.1, 0, TAU); c.fill();
  }
  c.strokeStyle = INK; c.lineWidth = 2; c.lineCap = 'round';
  c.beginPath(); c.arc(32, 28, 9, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
  c.fillStyle = 'rgba(255, 110, 150, 0.5)';
  c.beginPath(); c.ellipse(19, 33, 3.6, 2.4, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(45, 33, 3.6, 2.4, 0, 0, TAU); c.fill();
  // front feet
  for (const s of [-1, 1]) {
    c.beginPath(); c.ellipse(32 + s * 8, jump ? 50 : 48, 5, 3, 0, 0, TAU);
    c.fillStyle = '#4fc56a'; c.fill(); ink(c, 2);
  }
}
export function buildFrog(res) {
  return {
    sit: makeSprite(FROG_W, FROG_H, (c) => paintFrog(c, false), res),
    jump: makeSprite(FROG_W, FROG_H, (c) => paintFrog(c, true), res),
  };
}

// ---------------------------------------------------------------------------
// The aquarium
// ---------------------------------------------------------------------------
/** Paints the room and the glass tank. Returns the tank's inside (water) box. */
export function paintTank(c, w, h, box) {
  const R = rng(61);
  const u = Math.min(w, h) / 400;
  // a cozy room
  c.fillStyle = vgrad(c, 0, h, [[0, '#ffd9ec'], [1, '#e0c4ff']]);
  c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  for (let y = 12 * u; y < h; y += 34 * u) {
    for (let x = ((y / (34 * u)) % 2) * 17 * u; x < w; x += 34 * u) {
      c.beginPath(); c.arc(x, y, 3 * u, 0, TAU); c.fill();
    }
  }
  const { x, y, wd, ht } = box;
  // the wooden stand under the tank
  c.fillStyle = vgrad(c, y + ht, h, [[0, '#c9824a'], [1, '#8a5a35']]);
  c.fillRect(x - 8 * u, y + ht - 4 * u, wd + 16 * u, h - y - ht + 8 * u);
  // the glass and water
  const r = 18 * u;
  roundRectPath(c, x, y, wd, ht, r);
  c.fillStyle = vgrad(c, y, y + ht, [[0, '#8fe8ff'], [0.15, '#4cc4f0'], [0.7, '#2a8fd8'], [1, '#1f6fc0']]);
  c.fill();
  c.save();
  roundRectPath(c, x, y, wd, ht, r);
  c.clip();
  // the air above the water line
  const waterY = y + 22 * u;
  c.fillStyle = 'rgba(230, 250, 255, 0.85)';
  c.fillRect(x, y, wd, waterY - y);
  c.strokeStyle = 'rgba(255,255,255,0.9)';
  c.lineWidth = 3 * u;
  c.beginPath(); c.moveTo(x, waterY); c.lineTo(x + wd, waterY); c.stroke();
  waterLight(c, w, waterY, u, R, 6);
  // back plants (still) and rocks
  c.fillStyle = 'rgba(20, 80, 150, 0.35)';
  for (let i = 0; i < 5; i++) {
    c.beginPath(); c.ellipse(x + wd * (i / 4) + (R() - 0.5) * 40 * u, y + ht - 40 * u, (40 + R() * 40) * u, (30 + R() * 30) * u, 0, Math.PI, TAU); c.fill();
  }
  // sand
  const sandY = y + ht - 46 * u;
  c.beginPath();
  c.moveTo(x, y + ht);
  for (let xx = x; xx <= x + wd + 20; xx += 20) c.lineTo(xx, sandY + Math.sin(xx * 0.02) * 6 * u);
  c.lineTo(x + wd, y + ht);
  c.closePath();
  c.fillStyle = vgrad(c, sandY - 8 * u, y + ht, [[0, '#fff0b8'], [1, '#e8c070']]);
  c.fill();
  c.fillStyle = 'rgba(190, 130, 50, 0.3)';
  for (let i = 0; i < Math.round(wd / 7); i++) { c.beginPath(); c.arc(x + R() * wd, sandY + 8 * u + R() * 38 * u, (1 + R() * 1.6) * u, 0, TAU); c.fill(); }
  c.translate(x, 0);
  pebbles(c, wd, sandY, u, R, ['#ff9ad6', '#8fd8ff', '#ffe866', '#c9a3ff', '#9ff28a'], Math.round(wd / (36 * u)));
  c.restore();
  // shine on the glass and the frame
  c.save();
  roundRectPath(c, x, y, wd, ht, r);
  c.clip();
  c.fillStyle = 'rgba(255,255,255,0.18)';
  c.beginPath(); c.moveTo(x + wd * 0.06, y); c.lineTo(x + wd * 0.16, y); c.lineTo(x + wd * 0.02, y + ht); c.lineTo(x - wd * 0.08, y + ht); c.closePath(); c.fill();
  c.restore();
  roundRectPath(c, x, y, wd, ht, r);
  c.strokeStyle = 'rgba(255,255,255,0.95)';
  c.lineWidth = 8 * u;
  c.stroke();
  ink(c, 3 * u);
  // the lid
  roundRectPath(c, x - 6 * u, y - 10 * u, wd + 12 * u, 14 * u, 7 * u);
  c.fillStyle = vgrad(c, y - 10 * u, y + 4 * u, [[0, '#7fe3ff'], [1, '#2f8cff']]);
  c.fill(); ink(c, 3 * u);
  return { waterY, sandY };
}

export const CHEST_W = 90;
export const CHEST_H = 70;
function paintChest(c, open) {
  // lid
  if (open) {
    c.beginPath(); c.moveTo(10, 30); c.lineTo(20, 4); c.lineTo(78, 4); c.lineTo(80, 30); c.closePath();
    c.fillStyle = vgrad(c, 4, 30, [[0, '#c9824a'], [1, '#8a5a35']]); c.fill(); ink(c, 3);
    c.fillStyle = '#ffd23a';
    c.beginPath(); c.ellipse(45, 32, 32, 7, 0, 0, TAU); c.fill(); ink(c, 2);
    for (const [x, y] of [[30, 30], [45, 28], [58, 31], [38, 33], [52, 34]]) {
      c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fillStyle = '#fff27a'; c.fill(); ink(c, 1.4);
    }
    c.fillStyle = '#ff5fa8'; c.beginPath(); c.arc(64, 26, 4.5, 0, TAU); c.fill(); ink(c, 1.4);
  } else {
    c.beginPath(); c.moveTo(8, 34); c.quadraticCurveTo(8, 12, 45, 12); c.quadraticCurveTo(82, 12, 82, 34); c.closePath();
    c.fillStyle = vgrad(c, 12, 34, [[0, '#d9935a'], [1, '#9a5a2e']]); c.fill(); ink(c, 3);
    c.fillStyle = '#ffd23a';
    c.fillRect(40, 13, 10, 21); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(40, 13, 10, 21);
  }
  roundRectPath(c, 8, 34, 74, 34, 6);
  c.fillStyle = vgrad(c, 34, 68, [[0, '#c9824a'], [1, '#7a4a28']]);
  c.fill(); ink(c, 3);
  c.fillStyle = '#ffd23a';
  c.fillRect(20, 34, 7, 34); c.fillRect(63, 34, 7, 34);
  c.strokeStyle = INK; c.lineWidth = 2;
  c.strokeRect(20, 34, 7, 34); c.strokeRect(63, 34, 7, 34);
  roundRectPath(c, 39, 38, 12, 14, 3);
  c.fillStyle = '#ffd23a'; c.fill(); ink(c, 2);
  c.fillStyle = INK; c.beginPath(); c.arc(45, 44, 2, 0, TAU); c.fill();
}
export function buildChest(res) {
  return {
    closed: makeSprite(CHEST_W, CHEST_H, (c) => paintChest(c, false), res),
    open: makeSprite(CHEST_W, CHEST_H, (c) => paintChest(c, true), res),
  };
}
