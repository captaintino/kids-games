// The creatures of Fishing Pond: species data and their drawings.
// Fish with tails are pre-rendered as a body sprite plus a tail sprite (the tail
// wags around its joint); the eel, jellyfish and octopus are drawn live from a
// few strokes (only one or two are on screen), and the crab has walking frames.
import { makeSprite, starPath, INK } from './engine.js';

const TAU = Math.PI * 2;

const GOLD = { top: '#fff7b8', belly: '#ffc21f', fin: '#ffb000', finDark: '#e08a00' };

const POND_SPECIES = [
  {
    id: 'sunny', name: 'Sunny Fish', kind: 'fish', rx: 30, ry: 23, tail: 'fan', tl: 22, th: 20,
    top: '#fff27a', belly: '#ffb21f', fin: '#ff8a1f', pattern: { type: 'cheeks' }, depth: [0.05, 0.6], speed: [45, 70],
  },
  {
    id: 'clown', name: 'Clown Fish', kind: 'fish', rx: 32, ry: 19, tail: 'round', tl: 19, th: 16,
    top: '#ffab4d', belly: '#ff6a14', fin: '#ff7a1a', finEdge: true, pattern: { type: 'bands', color: '#ffffff' }, depth: [0.3, 0.85], speed: [50, 80],
  },
  {
    id: 'tang', name: 'Blue Tang', kind: 'fish', rx: 34, ry: 21, tail: 'fork', tl: 22, th: 18,
    top: '#5c9bff', belly: '#2d5fe0', fin: '#2d5fe0', tailColor: '#ffd23a', pattern: { type: 'tang', color: '#1d2b6b' }, depth: [0.1, 0.7], speed: [60, 90],
  },
  {
    id: 'puffer', name: 'Puffer Fish', kind: 'puffer', r: 24, tl: 13, th: 12,
    top: '#ffe7a3', belly: '#fffaf0', fin: '#ffbf5a', spots: '#d39a3a', depth: [0.2, 0.8], speed: [30, 45],
  },
  {
    id: 'angel', name: 'Angel Fish', kind: 'fish', shape: 'tall', rx: 31, ry: 30, tail: 'fan', tl: 16, th: 14,
    top: '#fff6a0', belly: '#ffd23a', fin: '#a77bff', pattern: { type: 'vstripes', color: '#a77bff' }, depth: [0.1, 0.6], speed: [35, 55],
  },
  {
    id: 'spotty', name: 'Polka Dot Fish', kind: 'fish', rx: 31, ry: 21, tail: 'fan', tl: 21, th: 18,
    top: '#ffa3da', belly: '#ff4fa8', fin: '#ff6fc0', pattern: { type: 'spots', color: '#ffffff' }, depth: [0.2, 0.75], speed: [45, 75],
  },
  {
    id: 'stripy', name: 'Stripy Fish', kind: 'fish', rx: 37, ry: 17, tail: 'fork', tl: 24, th: 17,
    top: '#a6f58a', belly: '#2fbf6a', fin: '#5cd65c', pattern: { type: 'hstripes', color: '#1f8f5a' }, depth: [0.05, 0.7], speed: [70, 100],
  },
  {
    id: 'eel', name: 'Wiggly Eel', kind: 'eel', len: 124, w: 15, color: '#4cc7b0', dark: '#1f8f86', light: '#fff27a', fin: '#ff9ad6',
    depth: [0.55, 0.95], speed: [35, 50],
  },
  {
    id: 'jelly', name: 'Jellyfish', kind: 'jelly', r: 24, color: '#ff9ad6', dark: '#e05aa8', light: '#ffe0f2',
    depth: [0.1, 0.6], speed: [16, 24],
  },
  {
    id: 'octopus', name: 'Octopus', kind: 'octopus', r: 24, color: '#b38bff', dark: '#7d4cff', light: '#e2d2ff',
    depth: [0.45, 0.85], speed: [24, 36],
  },
  {
    id: 'crab', name: 'Crab', kind: 'crab', r: 26, color: '#ff6a5a', dark: '#d1302b', light: '#ffb0a6',
    depth: [1, 1], speed: [30, 45],
  },
  // rare ones
  {
    id: 'gold', name: 'Golden Fish', rare: 'gold', kind: 'fish', rx: 30, ry: 22, tail: 'fancy', tl: 34, th: 28,
    top: GOLD.top, belly: GOLD.belly, fin: GOLD.fin, pattern: { type: 'scales', color: 'rgba(255,255,255,0.6)' }, crown: true,
    depth: [0.15, 0.75], speed: [40, 60],
  },
  {
    id: 'goldpuffer', name: 'Golden Puffer', rare: 'gold', kind: 'puffer', r: 25, tl: 14, th: 12,
    top: GOLD.top, belly: '#fff3c4', fin: GOLD.fin, spots: '#e8a200', depth: [0.2, 0.8], speed: [30, 45],
  },
  {
    id: 'goldangel', name: 'Golden Angel', rare: 'gold', kind: 'fish', shape: 'tall', rx: 31, ry: 30, tail: 'fan', tl: 16, th: 14,
    top: GOLD.top, belly: GOLD.belly, fin: GOLD.fin, pattern: { type: 'vstripes', color: 'rgba(255,255,255,0.7)' }, depth: [0.1, 0.6], speed: [35, 55],
  },
  {
    id: 'rainbow', name: 'Rainbow Fish', rare: 'rainbow', kind: 'fish', rx: 34, ry: 22, tail: 'fancy', tl: 34, th: 28,
    top: '#ffffff', belly: '#ffffff', fin: '#d9c2ff', pattern: { type: 'rainbow' }, depth: [0.15, 0.7], speed: [45, 65],
  },
];

POND_SPECIES.forEach((sp) => { sp.place = 'pond'; });

const OCEAN_SPECIES = [
  {
    id: 'parrot', name: 'Parrot Fish', kind: 'fish', rx: 33, ry: 22, tail: 'round', tl: 20, th: 18,
    top: '#7ff0d8', belly: '#2fc9a8', fin: '#ff7ac6', tailColor: '#ff9ad6', pattern: { type: 'scales', color: 'rgba(255,255,255,0.55)' }, beak: true,
    depth: [0.1, 0.7], speed: [45, 70],
  },
  {
    id: 'shark', name: 'Little Shark', kind: 'fish', shape: 'shark', rx: 44, ry: 18, tail: 'shark', tl: 28, th: 26,
    top: '#9fb8d9', belly: '#6f8fc0', fin: '#7f9fcc', pattern: { type: 'belly' }, teeth: true, depth: [0.2, 0.7], speed: [55, 80],
  },
  {
    id: 'sword', name: 'Swordfish', kind: 'fish', shape: 'shark', rx: 40, ry: 17, tail: 'fork', tl: 28, th: 24, sword: true,
    top: '#6f9bff', belly: '#c9d9ff', fin: '#3d6fe0', pattern: { type: 'hstripes', color: 'rgba(255,255,255,0.35)' }, depth: [0.1, 0.6], speed: [75, 100],
  },
  {
    id: 'ray', name: 'Stingray', kind: 'ray', r: 30, color: '#9fb5e0', dark: '#6a84c0', light: '#dbe6ff', spots: '#ffffff',
    depth: [0.55, 0.95], speed: [28, 40],
  },
  {
    id: 'turtle', name: 'Sea Turtle', kind: 'turtle', r: 26, shell: '#5cc9a0', shellDark: '#2f9a78', plate: '#a8f0cf', skin: '#c6f2a6', skinDark: '#7cc96a',
    depth: [0.2, 0.75], speed: [26, 36],
  },
  {
    id: 'seahorse', name: 'Seahorse', kind: 'seahorse', r: 22, color: '#ffb84d', dark: '#ff8a1f', light: '#ffe7a8', fin: '#ff9ad6',
    depth: [0.25, 0.8], speed: [14, 22],
  },
  {
    id: 'lobster', name: 'Lobster', kind: 'lobster', r: 24, color: '#ff5a4a', dark: '#c8282e', light: '#ffb0a0',
    depth: [1, 1], speed: [26, 38],
  },
  {
    id: 'goldseahorse', name: 'Golden Seahorse', rare: 'gold', kind: 'seahorse', r: 23, color: '#ffd93b', dark: '#ffb000', light: '#fff7b8', fin: '#ffffff',
    depth: [0.25, 0.75], speed: [14, 22],
  },
  {
    id: 'goldturtle', name: 'Golden Turtle', rare: 'gold', kind: 'turtle', r: 26, shell: '#ffd23a', shellDark: '#e0a000', plate: '#fff4b0', skin: '#fff2a6', skinDark: '#ffc21f',
    depth: [0.2, 0.7], speed: [26, 36],
  },
];
OCEAN_SPECIES.forEach((sp) => { sp.place = 'ocean'; });

const ICE_SPECIES = [
  {
    id: 'char', name: 'Arctic Char', kind: 'fish', rx: 34, ry: 19, tail: 'fork', tl: 22, th: 18,
    top: '#5f8fc0', belly: '#ff7a4a', fin: '#ff8a5c', pattern: { type: 'spots', color: '#ffd6e8' }, depth: [0.15, 0.75], speed: [50, 75],
  },
  {
    id: 'icefish', name: 'Ice Fish', kind: 'fish', rx: 32, ry: 18, tail: 'fan', tl: 22, th: 18,
    top: '#f2fbff', belly: '#a8dcf5', fin: '#cdeeff', pattern: { type: 'scales', color: 'rgba(120, 190, 240, 0.6)' }, depth: [0.1, 0.7], speed: [40, 60],
  },
  {
    id: 'cod', name: 'Polar Cod', kind: 'fish', rx: 35, ry: 19, tail: 'round', tl: 20, th: 17,
    top: '#c9d6ee', belly: '#8a9cc8', fin: '#9fb0d9', pattern: { type: 'hstripes', color: 'rgba(255,255,255,0.45)' }, whiskers: 'chin', depth: [0.3, 0.85], speed: [40, 60],
  },
  {
    id: 'narwhal', name: 'Baby Narwhal', kind: 'fish', shape: 'plump', rx: 38, ry: 23, tail: 'fork', tl: 22, th: 22, horn: true,
    top: '#b9c9e8', belly: '#e8f0ff', fin: '#9fb3d9', pattern: { type: 'spots', color: 'rgba(80, 100, 150, 0.35)' }, depth: [0.15, 0.6], speed: [35, 50],
  },
  {
    id: 'snowcrab', name: 'Snow Crab', kind: 'crab', r: 25, color: '#ffa07a', dark: '#e0603a', light: '#ffd9c6',
    depth: [1, 1], speed: [28, 40],
  },
  {
    id: 'moonjelly', name: 'Moon Jelly', kind: 'jelly', r: 23, color: '#b3d4ff', dark: '#7aa0e0', light: '#eef6ff',
    depth: [0.15, 0.65], speed: [14, 22],
  },
  {
    id: 'goldchar', name: 'Golden Char', rare: 'gold', kind: 'fish', rx: 34, ry: 20, tail: 'fancy', tl: 32, th: 26,
    top: GOLD.top, belly: GOLD.belly, fin: GOLD.fin, pattern: { type: 'spots', color: 'rgba(255,255,255,0.75)' }, crown: true,
    depth: [0.15, 0.7], speed: [40, 60],
  },
];
ICE_SPECIES.forEach((sp) => { sp.place = 'ice'; });

const JUNGLE_SPECIES = [
  {
    id: 'piranha', name: 'Piranha', kind: 'fish', shape: 'plump', rx: 30, ry: 23, tail: 'fork', tl: 18, th: 17,
    top: '#a6b8e0', belly: '#ff5a4a', fin: '#ff7a5a', pattern: { type: 'spots', color: 'rgba(255,255,255,0.4)' }, teeth: true,
    depth: [0.2, 0.8], speed: [55, 80],
  },
  {
    id: 'tetra', name: 'Neon Tetra', kind: 'fish', rx: 27, ry: 15, tail: 'fork', tl: 18, th: 14,
    top: '#c9f4ff', belly: '#fff0f4', fin: '#bfe8ff', pattern: { type: 'neon' }, depth: [0.05, 0.6], speed: [65, 95],
  },
  {
    id: 'discus', name: 'Discus Fish', kind: 'fish', shape: 'tall', rx: 30, ry: 29, tail: 'fan', tl: 15, th: 13,
    top: '#ffcf6b', belly: '#ff8a3d', fin: '#ff9a4d', pattern: { type: 'waves', color: '#3fa0ff' }, depth: [0.1, 0.6], speed: [30, 45],
  },
  {
    id: 'catfish', name: 'Catfish', kind: 'fish', rx: 38, ry: 18, tail: 'round', tl: 20, th: 16,
    top: '#d9b88a', belly: '#a8845a', fin: '#c49a6a', pattern: { type: 'spots', color: 'rgba(90, 60, 30, 0.35)' }, whiskers: 'cat',
    depth: [0.55, 0.95], speed: [30, 45],
  },
  {
    id: 'guppy', name: 'Fancy Guppy', kind: 'fish', rx: 24, ry: 15, tail: 'fancy', tl: 30, th: 26,
    top: '#fff0a6', belly: '#ffd23a', fin: '#ff7ac6', tailColor: '#7fd8ff', pattern: { type: 'cheeks' }, depth: [0.05, 0.55], speed: [50, 75],
  },
  {
    id: 'riverturtle', name: 'River Turtle', kind: 'turtle', r: 23, shell: '#8fae4a', shellDark: '#5a7a2a', plate: '#c9e07a', skin: '#d9ec8a', skinDark: '#9cba4a', redEar: true,
    depth: [0.3, 0.8], speed: [24, 34],
  },
  {
    id: 'goldpiranha', name: 'Golden Piranha', rare: 'gold', kind: 'fish', shape: 'plump', rx: 30, ry: 23, tail: 'fancy', tl: 28, th: 24,
    top: GOLD.top, belly: GOLD.belly, fin: GOLD.fin, pattern: { type: 'scales', color: 'rgba(255,255,255,0.6)' }, teeth: true, crown: true,
    depth: [0.2, 0.75], speed: [45, 65],
  },
];
JUNGLE_SPECIES.forEach((sp) => { sp.place = 'jungle'; });

export const SPECIES = POND_SPECIES.concat(OCEAN_SPECIES, ICE_SPECIES, JUNGLE_SPECIES);
export const BY_ID = {};
SPECIES.forEach((s) => { BY_ID[s.id] = s; });

/** Creatures that walk along the bottom. */
export const isWalker = (sp) => sp.kind === 'crab' || sp.kind === 'lobster';
/** Creatures drawn the same both ways (they don't flip to swim the other way). */
export const isFlipless = (sp) => sp.kind === 'crab' || sp.kind === 'jelly' || sp.kind === 'octopus';

const RAINBOW = ['#ff4d5e', '#ff9a2e', '#ffd93b', '#5cd65c', '#3d9bff', '#9d5cff'];

// ---------------------------------------------------------------------------
// Little face parts
// ---------------------------------------------------------------------------
function eye(c, x, y, r, happy) {
  if (happy) {
    c.strokeStyle = INK;
    c.lineWidth = r * 0.5;
    c.lineCap = 'round';
    c.beginPath(); c.arc(x, y + r * 0.35, r * 0.8, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    return;
  }
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.lineWidth = Math.max(1.6, r * 0.22);
  c.strokeStyle = INK;
  c.stroke();
  c.fillStyle = INK;
  c.beginPath(); c.arc(x + r * 0.22, y + r * 0.08, r * 0.58, 0, TAU); c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(x + r * 0.38, y - r * 0.22, r * 0.24, 0, TAU); c.fill();
}
function blush(c, x, y, r) {
  c.fillStyle = 'rgba(255, 90, 140, 0.4)';
  c.beginPath(); c.ellipse(x, y, r, r * 0.6, 0, 0, TAU); c.fill();
}
function grin(c, x, y, r, lw) {
  c.strokeStyle = INK;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.beginPath(); c.arc(x, y - r * 0.6, r, Math.PI * 0.25, Math.PI * 0.75); c.stroke();
}

// ---------------------------------------------------------------------------
// Fish with tails
// ---------------------------------------------------------------------------
function bodyPath(c, sp) {
  const rx = sp.rx;
  const ry = sp.ry;
  c.beginPath();
  if (sp.shape === 'shark') {
    c.moveTo(rx, ry * 0.12);
    c.bezierCurveTo(rx * 0.92, -ry * 0.8, rx * 0.3, -ry, -rx * 0.2, -ry * 0.86);
    c.bezierCurveTo(-rx * 0.6, -ry * 0.7, -rx, -ry * 0.3, -rx, 0);
    c.bezierCurveTo(-rx, ry * 0.3, -rx * 0.6, ry * 0.72, -rx * 0.2, ry * 0.84);
    c.bezierCurveTo(rx * 0.3, ry * 0.98, rx * 0.92, ry * 0.75, rx, ry * 0.12);
  } else if (sp.shape === 'tall') {
    c.moveTo(rx, 0);
    c.bezierCurveTo(rx * 0.85, -ry * 0.6, rx * 0.25, -ry, -rx * 0.15, -ry);
    c.bezierCurveTo(-rx * 0.6, -ry * 0.9, -rx, -ry * 0.3, -rx, 0);
    c.bezierCurveTo(-rx, ry * 0.3, -rx * 0.6, ry * 0.9, -rx * 0.15, ry);
    c.bezierCurveTo(rx * 0.25, ry, rx * 0.85, ry * 0.6, rx, 0);
  } else {
    c.moveTo(rx, ry * 0.05);
    c.bezierCurveTo(rx, -ry * 0.78, rx * 0.35, -ry, -rx * 0.15, -ry * 0.96);
    c.bezierCurveTo(-rx * 0.65, -ry * 0.9, -rx, -ry * 0.45, -rx, 0);
    c.bezierCurveTo(-rx, ry * 0.45, -rx * 0.65, ry * 0.9, -rx * 0.15, ry * 0.96);
    c.bezierCurveTo(rx * 0.35, ry, rx, ry * 0.78, rx, ry * 0.05);
  }
  c.closePath();
}

function finFill(c, sp, y0, y1, color) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, color || sp.fin);
  g.addColorStop(1, shade(color || sp.fin, -0.18));
  return g;
}

function shade(hex, amt) {
  if (hex.charAt(0) !== '#') return hex;
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt))));
  return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

function inkStroke(c, w) {
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.lineWidth = w;
  c.strokeStyle = INK;
  c.stroke();
}

function paintFins(c, sp) {
  const rx = sp.rx;
  const ry = sp.ry;
  c.beginPath();
  if (sp.shape === 'tall') {
    c.moveTo(rx * 0.15, -ry * 0.88);
    c.quadraticCurveTo(-rx * 0.3, -ry * 2.0, -rx * 1.1, -ry * 1.8);
    c.quadraticCurveTo(-rx * 0.75, -ry * 1.05, -rx * 0.62, -ry * 0.55);
    c.closePath();
    c.fillStyle = finFill(c, sp, -ry * 2, 0);
    c.fill(); inkStroke(c, 3);
    c.beginPath();
    c.moveTo(rx * 0.15, ry * 0.88);
    c.quadraticCurveTo(-rx * 0.3, ry * 2.0, -rx * 1.1, ry * 1.8);
    c.quadraticCurveTo(-rx * 0.75, ry * 1.05, -rx * 0.62, ry * 0.55);
    c.closePath();
    c.fillStyle = finFill(c, sp, 0, ry * 2);
    c.fill(); inkStroke(c, 3);
  } else if (sp.shape === 'shark') {
    c.moveTo(-rx * 0.35, -ry * 0.8);
    c.quadraticCurveTo(-rx * 0.15, -ry * 1.5, -rx * 0.05, -ry * 2.0);
    c.quadraticCurveTo(rx * 0.05, -ry * 1.3, rx * 0.25, -ry * 0.86);
    c.closePath();
    c.fillStyle = finFill(c, sp, -ry * 2, -ry * 0.8);
    c.fill(); inkStroke(c, 3);
    c.beginPath();
    c.moveTo(-rx * 0.1, ry * 0.75);
    c.quadraticCurveTo(-rx * 0.25, ry * 1.6, -rx * 0.42, ry * 1.55);
    c.quadraticCurveTo(-rx * 0.35, ry * 1.0, -rx * 0.38, ry * 0.7);
    c.closePath();
    c.fillStyle = finFill(c, sp, ry * 0.6, ry * 1.6);
    c.fill(); inkStroke(c, 3);
  } else {
    c.moveTo(-rx * 0.6, -ry * 0.7);
    c.quadraticCurveTo(-rx * 0.25, -ry * 1.75, rx * 0.32, -ry * 0.82);
    c.closePath();
    c.fillStyle = finFill(c, sp, -ry * 1.6, -ry * 0.6);
    c.fill(); inkStroke(c, 3);
    c.beginPath();
    c.moveTo(-rx * 0.4, ry * 0.75);
    c.quadraticCurveTo(-rx * 0.25, ry * 1.5, rx * 0.12, ry * 0.85);
    c.closePath();
    c.fillStyle = finFill(c, sp, ry * 0.6, ry * 1.5);
    c.fill(); inkStroke(c, 3);
  }
  if (sp.finEdge) {
    c.strokeStyle = 'rgba(45, 36, 66, 0.55)';
    c.lineWidth = 2;
  }
}

function paintPattern(c, sp) {
  const rx = sp.rx;
  const ry = sp.ry;
  const p = sp.pattern;
  if (!p) return;
  switch (p.type) {
    case 'bands':
      [[rx * 0.42, rx * 0.2], [-rx * 0.12, rx * 0.26], [-rx * 0.7, rx * 0.17]].forEach(([x, w]) => {
        c.beginPath(); c.ellipse(x, 0, w / 2, ry * 1.25, 0, 0, TAU);
        c.fillStyle = p.color; c.fill();
        c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke();
      });
      break;
    case 'vstripes':
      [rx * 0.32, -rx * 0.22, -rx * 0.7].forEach((x) => {
        c.beginPath(); c.ellipse(x, 0, rx * 0.09, ry * 1.2, 0, 0, TAU);
        c.fillStyle = p.color; c.fill();
      });
      break;
    case 'hstripes':
      c.fillStyle = p.color;
      [-ry * 0.38, ry * 0.12].forEach((y) => {
        c.beginPath();
        c.moveTo(-rx * 1.1, y);
        c.quadraticCurveTo(0, y - ry * 0.12, rx * 0.55, y + ry * 0.02);
        c.lineTo(rx * 0.55, y + ry * 0.2);
        c.quadraticCurveTo(0, y + ry * 0.06, -rx * 1.1, y + ry * 0.2);
        c.closePath();
        c.fill();
      });
      break;
    case 'spots':
      c.fillStyle = p.color;
      [[0.05, -0.45, 0.17], [-0.42, -0.08, 0.2], [-0.1, 0.42, 0.15], [0.3, 0.45, 0.11], [-0.72, 0.32, 0.13], [-0.6, -0.55, 0.11], [0.25, -0.05, 0.1]].forEach(([x, y, r]) => {
        c.beginPath(); c.arc(x * rx, y * ry, r * ry, 0, TAU); c.fill();
      });
      break;
    case 'tang':
      c.fillStyle = p.color;
      c.beginPath();
      c.moveTo(rx * 0.32, -ry * 0.62);
      c.quadraticCurveTo(-rx * 0.35, -ry * 0.95, -rx * 0.9, -ry * 0.18);
      c.quadraticCurveTo(-rx * 0.45, -ry * 0.42, -rx * 0.18, ry * 0.22);
      c.quadraticCurveTo(-rx * 0.05, -ry * 0.25, rx * 0.32, -ry * 0.62);
      c.fill();
      break;
    case 'belly':
      c.fillStyle = '#f4f8ff';
      c.beginPath();
      c.moveTo(rx * 1.1, ry * 0.15);
      c.quadraticCurveTo(0, ry * 0.05, -rx * 1.1, ry * 0.35);
      c.lineTo(-rx * 1.1, ry * 1.2); c.lineTo(rx * 1.1, ry * 1.2);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)';
      for (const [x, y] of [[-0.45, -0.45], [-0.1, -0.6], [-0.7, -0.15]]) { c.beginPath(); c.arc(x * rx, y * ry, ry * 0.12, 0, TAU); c.fill(); }
      break;
    case 'neon':
      c.fillStyle = '#3fd0ff';
      c.beginPath();
      c.moveTo(rx * 0.5, -ry * 0.32); c.quadraticCurveTo(0, -ry * 0.42, -rx * 1.1, -ry * 0.2);
      c.lineTo(-rx * 1.1, ry * 0.05); c.quadraticCurveTo(0, -ry * 0.12, rx * 0.5, -ry * 0.06);
      c.closePath(); c.fill();
      c.fillStyle = '#ff4d6d';
      c.beginPath();
      c.moveTo(rx * 0.05, ry * 0.12); c.quadraticCurveTo(-rx * 0.4, ry * 0.08, -rx * 1.1, ry * 0.2);
      c.lineTo(-rx * 1.1, ry * 0.9); c.quadraticCurveTo(-rx * 0.4, ry * 0.9, rx * 0.05, ry * 0.6);
      c.closePath(); c.fill();
      break;
    case 'waves':
      c.strokeStyle = p.color;
      c.lineWidth = 2.6;
      c.lineCap = 'round';
      for (let k = -3; k <= 3; k++) {
        c.beginPath();
        for (let x = -rx * 1.1; x <= rx * 0.4; x += 4) {
          const y = k * ry * 0.27 + Math.sin(x * 0.35 + k) * 2;
          if (x === -rx * 1.1) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      }
      break;
    case 'scales':
    case 'rainbow':
      if (p.type === 'rainbow') {
        const band = (ry * 2.2) / RAINBOW.length;
        RAINBOW.forEach((col, i) => {
          c.fillStyle = col;
          c.fillRect(-rx * 1.2, -ry * 1.1 + i * band, rx * 2.4, band + 0.6);
        });
      }
      c.strokeStyle = p.type === 'rainbow' ? 'rgba(255,255,255,0.6)' : p.color;
      c.lineWidth = 1.6;
      for (let row = -2; row <= 2; row++) {
        for (let col = -3; col <= 1; col++) {
          const x = col * ry * 0.42 + (row % 2 ? ry * 0.21 : 0);
          const y = row * ry * 0.36;
          c.beginPath(); c.arc(x, y, ry * 0.22, -Math.PI / 2, Math.PI / 2); c.stroke();
        }
      }
      break;
  }
}

function paintBody(c, sp, happy) {
  const rx = sp.rx;
  const ry = sp.ry;
  if (sp.sword) {
    c.beginPath();
    c.moveTo(rx * 0.85, -ry * 0.12);
    c.lineTo(rx * 1.85, -ry * 0.02);
    c.lineTo(rx * 0.85, ry * 0.2);
    c.closePath();
    c.fillStyle = '#dfe8ff';
    c.fill(); inkStroke(c, 2.6);
  }
  if (sp.horn) {
    c.save();
    c.translate(rx * 0.72, -ry * 0.45);
    c.rotate(-0.42);
    c.beginPath(); c.moveTo(0, -3.4); c.lineTo(rx * 0.95, 0); c.lineTo(0, 3.4); c.closePath();
    c.fillStyle = '#fff6dc'; c.fill(); inkStroke(c, 2.4);
    c.strokeStyle = 'rgba(160, 120, 60, 0.6)'; c.lineWidth = 1.4;
    for (let k = 1; k < 5; k++) { const x = (k / 5) * rx * 0.95; c.beginPath(); c.moveTo(x - 2, -3.4 * (1 - k / 5)); c.lineTo(x + 2, 3.4 * (1 - k / 5)); c.stroke(); }
    c.restore();
  }
  paintFins(c, sp);
  bodyPath(c, sp);
  const g = c.createLinearGradient(0, -ry, 0, ry);
  g.addColorStop(0, sp.top);
  g.addColorStop(1, sp.belly);
  c.fillStyle = g;
  c.fill();
  c.save();
  bodyPath(c, sp);
  c.clip();
  paintPattern(c, sp);
  // round 3D shading
  const sh = c.createLinearGradient(0, -ry, 0, ry);
  sh.addColorStop(0, 'rgba(255,255,255,0.35)');
  sh.addColorStop(0.45, 'rgba(255,255,255,0)');
  sh.addColorStop(1, 'rgba(40, 0, 60, 0.18)');
  c.fillStyle = sh;
  c.fillRect(-rx * 1.2, -ry * 1.2, rx * 2.4, ry * 2.4);
  // gill
  c.strokeStyle = 'rgba(45, 36, 66, 0.3)';
  c.lineWidth = 2;
  c.beginPath(); c.arc(rx * 0.05, 0, ry * 0.6, -0.9, 0.9); c.stroke();
  c.restore();
  bodyPath(c, sp);
  inkStroke(c, 3.4);
  // pectoral fin on the side
  c.beginPath();
  c.moveTo(-rx * 0.02, ry * 0.12);
  c.quadraticCurveTo(-rx * 0.45, ry * 0.2, -rx * 0.3, ry * 0.55);
  c.quadraticCurveTo(-rx * 0.1, ry * 0.45, -rx * 0.02, ry * 0.12);
  c.fillStyle = sp.rare ? 'rgba(255,255,255,0.7)' : shade(sp.fin, 0.15);
  c.fill();
  inkStroke(c, 2);
  // shine
  c.fillStyle = 'rgba(255,255,255,0.75)';
  c.beginPath(); c.ellipse(rx * 0.15, -ry * 0.62, rx * 0.22, ry * 0.12, -0.15, 0, TAU); c.fill();
  // face
  const er = Math.max(5.5, ry * 0.3);
  eye(c, rx * 0.5, -ry * 0.18, er, happy);
  blush(c, rx * 0.45, ry * 0.32, er * 0.75);
  grin(c, rx * 0.8, ry * 0.32, er * 0.55, 2.2);
  if (sp.teeth) {
    c.fillStyle = '#ffffff';
    for (const dx of [-0.1, 0.06]) {
      const x = rx * (0.8 + dx);
      const y = ry * 0.32 - er * 0.55 * 0.6 + er * 0.55 * 0.95;
      c.beginPath(); c.moveTo(x - 2.4, y - 0.6); c.lineTo(x, y + 3.6); c.lineTo(x + 2.4, y - 0.6); c.closePath();
      c.fill(); inkStroke(c, 1.2);
    }
  }
  if (sp.beak) {
    c.beginPath();
    c.moveTo(rx * 0.86, ry * 0.0); c.quadraticCurveTo(rx * 1.12, ry * 0.15, rx * 0.9, ry * 0.42); c.closePath();
    c.fillStyle = '#fff6dc'; c.fill(); inkStroke(c, 2);
  }
  if (sp.whiskers) {
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.lineCap = 'round';
    if (sp.whiskers === 'chin') {
      c.beginPath(); c.moveTo(rx * 0.7, ry * 0.62); c.quadraticCurveTo(rx * 0.72, ry * 0.95, rx * 0.6, ry * 1.1); c.stroke();
    } else {
      for (const [dy, len] of [[0.05, 1], [0.25, 0.9]]) {
        c.beginPath(); c.moveTo(rx * 0.92, ry * dy); c.quadraticCurveTo(rx * 1.25, ry * (dy + 0.1), rx * 1.32 * len, ry * (dy + 0.6)); c.stroke();
      }
      c.beginPath(); c.moveTo(rx * 0.8, ry * 0.5); c.quadraticCurveTo(rx * 0.9, ry * 0.95, rx * 0.75, ry * 1.15); c.stroke();
    }
  }
  if (sp.crown) {
    c.save();
    c.translate(rx * 0.1, -ry * 1.05);
    c.rotate(-0.15);
    c.beginPath();
    c.moveTo(-10, 4); c.lineTo(-11, -9); c.lineTo(-4, -2); c.lineTo(0, -12); c.lineTo(4, -2); c.lineTo(11, -9); c.lineTo(10, 4);
    c.closePath();
    c.fillStyle = '#ffd23a';
    c.fill();
    inkStroke(c, 2.2);
    c.fillStyle = '#ff5fa8';
    c.beginPath(); c.arc(0, -1, 2.2, 0, TAU); c.fill();
    c.restore();
  }
  if (sp.rare) {
    // extra glints
    c.fillStyle = '#ffffff';
    starPath(c, -rx * 0.35, -ry * 0.35, 5, 1.2, 4, 0); c.fill();
    starPath(c, rx * 0.1, ry * 0.45, 4, 1, 4, 0); c.fill();
  }
}

function tailPath(c, sp) {
  const L = sp.tl;
  const T = sp.th;
  c.beginPath();
  switch (sp.tail) {
    case 'fork':
      c.moveTo(4, -T * 0.22);
      c.quadraticCurveTo(-L * 0.4, -T * 0.3, -L, -T);
      c.quadraticCurveTo(-L * 0.6, -T * 0.25, -L * 0.55, 0);
      c.quadraticCurveTo(-L * 0.6, T * 0.25, -L, T);
      c.quadraticCurveTo(-L * 0.4, T * 0.3, 4, T * 0.22);
      break;
    case 'shark':
      c.moveTo(4, -T * 0.2);
      c.quadraticCurveTo(-L * 0.5, -T * 0.5, -L * 1.05, -T * 1.15);
      c.quadraticCurveTo(-L * 0.75, -T * 0.2, -L * 0.62, T * 0.1);
      c.quadraticCurveTo(-L * 0.75, T * 0.35, -L * 0.8, T * 0.7);
      c.quadraticCurveTo(-L * 0.35, T * 0.35, 4, T * 0.2);
      break;
    case 'round':
      c.moveTo(4, -T * 0.32);
      c.bezierCurveTo(-L * 0.6, -T * 1.2, -L * 1.2, -T * 0.4, -L, 0);
      c.bezierCurveTo(-L * 1.2, T * 0.4, -L * 0.6, T * 1.2, 4, T * 0.32);
      break;
    case 'fancy':
      c.moveTo(4, -T * 0.2);
      c.bezierCurveTo(-L * 0.3, -T * 0.6, -L * 0.8, -T * 1.2, -L, -T * 0.8);
      c.bezierCurveTo(-L * 0.85, -T * 0.4, -L * 1.05, -T * 0.1, -L * 0.78, 0);
      c.bezierCurveTo(-L * 1.05, T * 0.1, -L * 0.85, T * 0.4, -L, T * 0.8);
      c.bezierCurveTo(-L * 0.8, T * 1.2, -L * 0.3, T * 0.6, 4, T * 0.2);
      break;
    default: // fan
      c.moveTo(4, -T * 0.25);
      c.quadraticCurveTo(-L * 0.3, -T * 0.3, -L, -T);
      c.quadraticCurveTo(-L * 0.72, 0, -L, T);
      c.quadraticCurveTo(-L * 0.3, T * 0.3, 4, T * 0.25);
  }
  c.closePath();
}

function paintTail(c, sp) {
  tailPath(c, sp);
  if (sp.pattern && sp.pattern.type === 'rainbow') {
    const g = c.createLinearGradient(0, -sp.th, 0, sp.th);
    RAINBOW.forEach((col, i) => g.addColorStop(i / (RAINBOW.length - 1), col));
    c.fillStyle = g;
  } else {
    c.fillStyle = finFill(c, sp, -sp.th, sp.th, sp.tailColor);
  }
  c.fill();
  c.save();
  tailPath(c, sp);
  c.clip();
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = 1.6;
  for (let i = -2; i <= 2; i++) {
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-sp.tl, i * sp.th * 0.4); c.stroke();
  }
  c.restore();
  tailPath(c, sp);
  inkStroke(c, 3.2);
}

// ---------------------------------------------------------------------------
// Puffer fish
// ---------------------------------------------------------------------------
function paintPuffer(c, sp, puffed, happy) {
  const r = sp.r * (puffed ? 1.32 : 1);
  // spikes
  const n = 14;
  c.fillStyle = shade(sp.fin, -0.1);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + 0.1;
    if (Math.cos(a) > 0.82) continue; // not over the face
    const len = puffed ? r * 0.32 : r * 0.16;
    c.beginPath();
    c.moveTo(Math.cos(a - 0.12) * r * 0.95, Math.sin(a - 0.12) * r * 0.95);
    c.lineTo(Math.cos(a) * (r + len), Math.sin(a) * (r + len));
    c.lineTo(Math.cos(a + 0.12) * r * 0.95, Math.sin(a + 0.12) * r * 0.95);
    c.closePath();
    c.fill();
    inkStroke(c, 2);
  }
  // little top fin
  c.beginPath();
  c.moveTo(-r * 0.3, -r * 0.85);
  c.quadraticCurveTo(-r * 0.1, -r * 1.4, r * 0.25, -r * 0.92);
  c.closePath();
  c.fillStyle = sp.fin;
  c.fill();
  inkStroke(c, 2.6);
  c.beginPath();
  c.arc(0, 0, r, 0, TAU);
  const g = c.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, sp.top);
  g.addColorStop(0.6, sp.top);
  g.addColorStop(1, sp.belly);
  c.fillStyle = g;
  c.fill();
  c.save();
  c.clip();
  c.fillStyle = sp.spots;
  [[-0.5, -0.45, 0.1], [-0.1, -0.6, 0.08], [-0.65, 0.05, 0.09], [-0.3, -0.15, 0.07], [0.15, -0.35, 0.06], [-0.45, 0.45, 0.07]].forEach(([x, y, s]) => {
    c.beginPath(); c.arc(x * r, y * r, s * r, 0, TAU); c.fill();
  });
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.beginPath(); c.ellipse(0, r * 0.75, r * 0.85, r * 0.45, 0, 0, TAU); c.fill();
  c.restore();
  c.beginPath(); c.arc(0, 0, r, 0, TAU);
  inkStroke(c, 3.4);
  c.fillStyle = 'rgba(255,255,255,0.75)';
  c.beginPath(); c.ellipse(-r * 0.2, -r * 0.62, r * 0.32, r * 0.14, -0.3, 0, TAU); c.fill();
  // side fin
  c.beginPath();
  c.ellipse(-r * 0.05, r * 0.2, r * 0.2, r * 0.12, 0.6, 0, TAU);
  c.fillStyle = sp.fin; c.fill(); inkStroke(c, 2);
  eye(c, r * 0.45, -r * 0.2, r * 0.27, happy);
  blush(c, r * 0.4, r * 0.3, r * 0.18);
  // little "o" mouth
  c.beginPath(); c.ellipse(r * 0.85, r * 0.18, r * 0.1, r * 0.12, 0, 0, TAU);
  c.fillStyle = '#d6456f'; c.fill(); inkStroke(c, 2);
  if (sp.rare) {
    c.fillStyle = '#ffffff';
    starPath(c, -r * 0.4, -r * 0.2, 5, 1.2, 4, 0); c.fill();
  }
}

// ---------------------------------------------------------------------------
// Live-drawn creatures (local units, facing right, centered on 0,0)
// ---------------------------------------------------------------------------
// The parts of the live-drawn creatures that never change shape (the eel's face, the
// jellyfish's bell, the octopus's head) are pre-rendered once per species, so each
// frame draws one picture instead of a dozen little shapes. `a` = the creature's art
// (from buildArt); without it (the big pictures for the card and the book) they are
// drawn from shapes as before.
function partSprite(a, name, box, draw) {
  if (!a.parts) a.parts = {};
  let cv = a.parts[name];
  if (!cv) {
    cv = boxSprite(box, a.res || 2, draw);
    a.parts[name] = cv;
  }
  return cv;
}
function drawPart(c, cv, x, y) {
  c.drawImage(cv, x - cv.cx, y - cv.cy, cv.w, cv.h);
}

function eelFace(c, h2, happy) {
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.beginPath(); c.ellipse(-4, -h2 * 0.55, h2 * 0.6, h2 * 0.25, 0, 0, TAU); c.fill();
  eye(c, 1, -4, 6.5, happy);
  grin(c, 8, 6, 4.5, 2.2);
  blush(c, -3, 6, 4);
}

export function drawEel(c, sp, t, happy, a) {
  const n = 15;
  const len = sp.len;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n; // 0 = tail, 1 = head
    const x = -len / 2 + k * len;
    const y = Math.sin(t * 5 - k * 5.5) * 9 * (1 - k * 0.65);
    pts.push([x, y, sp.w * (0.3 + 0.7 * Math.min(1, k * 1.6)) * (i === n ? 1.12 : 1)]);
  }
  // fin along the back
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  for (let i = 1; i < n - 1; i++) {
    const p = pts[i];
    if (i === 1) c.moveTo(p[0], p[1] - p[2] * 1.05); else c.lineTo(p[0], p[1] - p[2] * 1.05);
  }
  c.strokeStyle = INK; c.lineWidth = 10; c.stroke();
  c.strokeStyle = sp.fin; c.lineWidth = 6; c.stroke();
  // the outline circles, then the body circles (each set filled as one shape: same look, fewer draws)
  c.fillStyle = INK;
  c.beginPath();
  for (const p of pts) { c.moveTo(p[0] + p[2] + 2, p[1]); c.arc(p[0], p[1], p[2] + 2, 0, TAU); }
  c.fill();
  c.fillStyle = sp.color;
  c.beginPath();
  for (const p of pts) { c.moveTo(p[0] + p[2], p[1]); c.arc(p[0], p[1], p[2], 0, TAU); }
  c.fill();
  // a pale belly and yellow spots
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath(); c.ellipse(p[0], p[1] + p[2] * 0.45, p[2] * 0.75, p[2] * 0.4, 0, 0, TAU); c.fill();
  }
  for (let i = 2; i < pts.length - 2; i += 3) {
    const p = pts[i];
    c.fillStyle = sp.light;
    c.beginPath(); c.arc(p[0] - 1, p[1] - p[2] * 0.3, p[2] * 0.3, 0, TAU); c.fill();
  }
  const h = pts[n];
  if (a) {
    const h2 = h[2];
    const face = partSprite(a, happy ? 'faceHappy' : 'face', { left: 18, right: 18, top: 18, bottom: 14 }, (g) => eelFace(g, h2, happy));
    drawPart(c, face, h[0], h[1]);
  } else {
    c.save();
    c.translate(h[0], h[1]);
    eelFace(c, h[2], happy);
    c.restore();
  }
}

function bellPath(c, r) {
  c.beginPath();
  c.moveTo(-r, r * 0.25);
  c.bezierCurveTo(-r * 1.05, -r * 1.25, r * 1.05, -r * 1.25, r, r * 0.25);
  const k = 5;
  for (let i = 0; i < k; i++) {
    const x0 = r - (i * 2 * r) / k;
    const x1 = r - ((i + 1) * 2 * r) / k;
    c.quadraticCurveTo((x0 + x1) / 2, r * 0.55, x1, r * 0.25);
  }
  c.closePath();
}

function jellyBell(c, sp, r, happy) {
  bellPath(c, r);
  const g = c.createLinearGradient(0, -r, 0, r * 0.5);
  g.addColorStop(0, sp.light);
  g.addColorStop(1, sp.color);
  c.globalAlpha = 0.95;
  c.fillStyle = g;
  c.fill();
  c.globalAlpha = 1;
  inkStroke(c, 3.2);
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.beginPath(); c.ellipse(-r * 0.4, -r * 0.55, r * 0.25, r * 0.12, -0.6, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)';
  for (const [x, y] of [[r * 0.35, -r * 0.5], [r * 0.55, -r * 0.1], [-r * 0.6, -r * 0.05]]) {
    c.beginPath(); c.arc(x, y, r * 0.09, 0, TAU); c.fill();
  }
  eye(c, -r * 0.3, -r * 0.1, r * 0.18, happy);
  eye(c, r * 0.3, -r * 0.1, r * 0.18, happy);
  blush(c, -r * 0.55, r * 0.12, r * 0.13);
  blush(c, r * 0.55, r * 0.12, r * 0.13);
  grin(c, 0, r * 0.14, r * 0.16, 2);
}

export function drawJelly(c, sp, t, happy, squash = 1, a) {
  const r = sp.r;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // tentacles
  for (let i = 0; i < 5; i++) {
    const x0 = -r * 0.7 + i * r * 0.35;
    c.beginPath();
    c.moveTo(x0, r * 0.3);
    for (let s = 1; s <= 4; s++) {
      const y = r * 0.3 + s * r * 0.42;
      const x = x0 + Math.sin(t * 3 + i + s * 1.2) * 5 * (s / 4);
      c.lineTo(x, y);
    }
    c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
    c.strokeStyle = i % 2 ? sp.color : sp.light; c.lineWidth = 2.6; c.stroke();
  }
  c.save();
  c.scale(1 / squash, squash);
  if (a) {
    const box = { left: r * 1.15 + 4, right: r * 1.15 + 4, top: r * 1.1 + 4, bottom: r * 0.7 + 4 };
    drawPart(c, partSprite(a, happy ? 'bellHappy' : 'bell', box, (g) => jellyBell(g, sp, r, happy)), 0, 0);
  } else jellyBell(c, sp, r, happy);
  c.restore();
}

function octopusHead(c, sp, r, happy) {
  c.beginPath();
  c.ellipse(0, -r * 0.1, r, r * 1.02, 0, 0, TAU);
  const g = c.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, sp.light);
  g.addColorStop(0.5, sp.color);
  g.addColorStop(1, sp.dark);
  c.fillStyle = g;
  c.fill();
  inkStroke(c, 3.4);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  for (const [x, y, s] of [[r * 0.45, -r * 0.6, 0.12], [-r * 0.5, -r * 0.45, 0.1], [r * 0.6, -r * 0.15, 0.08]]) {
    c.beginPath(); c.arc(x, y, r * s, 0, TAU); c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.beginPath(); c.ellipse(-r * 0.3, -r * 0.75, r * 0.3, r * 0.13, -0.4, 0, TAU); c.fill();
  eye(c, -r * 0.32, r * 0.05, r * 0.22, happy);
  eye(c, r * 0.32, r * 0.05, r * 0.22, happy);
  blush(c, -r * 0.6, r * 0.38, r * 0.14);
  blush(c, r * 0.6, r * 0.38, r * 0.14);
  grin(c, 0, r * 0.45, r * 0.18, 2.2);
}

export function drawOctopus(c, sp, t, happy, squash = 1, a) {
  const r = sp.r;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (let i = 0; i < 6; i++) {
    const x0 = -r * 0.62 + i * r * 0.25;
    const side = x0 < 0 ? -1 : 1;
    c.beginPath();
    c.moveTo(x0, r * 0.4);
    let x = x0;
    let y = r * 0.4;
    for (let s = 1; s <= 4; s++) {
      x += side * 3 + Math.sin(t * 3.4 + i * 1.3 + s) * 4;
      y += r * 0.3;
      c.lineTo(x, y);
    }
    c.quadraticCurveTo(x + side * 8, y + 6, x + side * 7, y - 3);
    c.strokeStyle = INK; c.lineWidth = 10; c.stroke();
    c.strokeStyle = i % 2 ? sp.color : sp.dark; c.lineWidth = 6.2; c.stroke();
  }
  c.save();
  c.scale(1 / squash, squash);
  if (a) {
    const box = { left: r + 4, right: r + 4, top: r * 1.12 + 4, bottom: r * 0.92 + 4 };
    drawPart(c, partSprite(a, happy ? 'headHappy' : 'head', box, (g) => octopusHead(g, sp, r, happy)), 0, 0);
  } else octopusHead(c, sp, r, happy);
  c.restore();
}

function paintCrab(c, sp, frame) {
  const r = sp.r;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // legs
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const lift = (frame === 'b' ? (i % 2 ? 1 : -1) : (i % 2 ? -1 : 1)) * 4;
      c.beginPath();
      c.moveTo(side * r * (0.45 + i * 0.12), r * 0.25);
      c.lineTo(side * r * (0.95 + i * 0.12), r * 0.35 + lift * 0.5);
      c.lineTo(side * r * (1.1 + i * 0.14), r * 0.8 + lift);
      c.strokeStyle = INK; c.lineWidth = 7.5; c.stroke();
      c.strokeStyle = sp.dark; c.lineWidth = 4; c.stroke();
    }
  }
  // arms and claws
  const up = frame === 'wave';
  for (const side of [-1, 1]) {
    const cx = side * r * 1.15;
    const cy = up ? -r * 1.05 : -r * 0.5;
    c.beginPath();
    c.moveTo(side * r * 0.6, -r * 0.1);
    c.quadraticCurveTo(side * r * 1.0, -r * 0.2, cx, cy + r * 0.25);
    c.strokeStyle = INK; c.lineWidth = 8; c.stroke();
    c.strokeStyle = sp.color; c.lineWidth = 4.5; c.stroke();
    c.save();
    c.translate(cx, cy);
    c.rotate(side * (up ? 0.3 : -0.2));
    c.beginPath();
    c.arc(0, 0, r * 0.36, -Math.PI * 0.35, Math.PI * 1.35);
    c.lineTo(0, -r * 0.08);
    c.closePath();
    c.fillStyle = sp.color;
    c.fill();
    inkStroke(c, 3);
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.ellipse(-r * 0.1, r * 0.08, r * 0.1, r * 0.06, -0.5, 0, TAU); c.fill();
    c.restore();
  }
  // eye stalks
  for (const side of [-1, 1]) {
    c.beginPath(); c.moveTo(side * r * 0.25, -r * 0.4); c.lineTo(side * r * 0.32, -r * 0.95);
    c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
    c.strokeStyle = sp.color; c.lineWidth = 2.2; c.stroke();
  }
  // body
  c.beginPath();
  c.ellipse(0, 0, r, r * 0.62, 0, 0, TAU);
  const g = c.createLinearGradient(0, -r * 0.6, 0, r * 0.6);
  g.addColorStop(0, sp.light);
  g.addColorStop(0.45, sp.color);
  g.addColorStop(1, sp.dark);
  c.fillStyle = g;
  c.fill();
  inkStroke(c, 3.4);
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.beginPath(); c.ellipse(-r * 0.3, -r * 0.3, r * 0.28, r * 0.1, -0.2, 0, TAU); c.fill();
  eye(c, -r * 0.32, -r * 1.05, r * 0.2, false);
  eye(c, r * 0.32, -r * 1.05, r * 0.2, false);
  blush(c, -r * 0.5, r * 0.15, r * 0.15);
  blush(c, r * 0.5, r * 0.15, r * 0.15);
  grin(c, 0, r * 0.18, r * 0.22, 2.4);
}

// ---------------------------------------------------------------------------
// Ocean (and river) creatures: stingray, turtles, seahorses, the lobster
// ---------------------------------------------------------------------------
function grad(c, y0, y1, a, b, d) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, a);
  g.addColorStop(0.5, b);
  g.addColorStop(1, d || b);
  return g;
}

/** A stingray swimming right, seen a little from above; k = how far the wings are spread. */
function paintRay(c, sp, k, happy) {
  const r = sp.r;
  // the long tail
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(-r * 0.6, 0); c.quadraticCurveTo(-r * 1.3, r * 0.12 * (k - 0.7), -r * 1.95, -r * 0.04);
  c.strokeStyle = INK; c.lineWidth = 6; c.stroke();
  c.strokeStyle = sp.dark; c.lineWidth = 2.6; c.stroke();
  c.beginPath(); c.moveTo(-r * 1.95, -r * 0.04); c.lineTo(-r * 1.75, -r * 0.16); c.lineTo(-r * 1.8, r * 0.02); c.closePath();
  c.fillStyle = sp.dark; c.fill(); inkStroke(c, 1.8);
  const wy = r * 1.0 * k;
  const body = () => {
    c.beginPath();
    c.moveTo(r * 0.95, 0);
    c.bezierCurveTo(r * 0.8, -r * 0.42, r * 0.25, -wy * 0.85, -r * 0.1, -wy);
    c.quadraticCurveTo(-r * 0.3, -wy * 0.45, -r * 0.72, 0);
    c.quadraticCurveTo(-r * 0.3, wy * 0.45, -r * 0.1, wy);
    c.bezierCurveTo(r * 0.25, wy * 0.85, r * 0.8, r * 0.42, r * 0.95, 0);
    c.closePath();
  };
  body();
  const g = c.createRadialGradient(r * 0.2, -r * 0.1, 2, 0, 0, r * 1.1);
  g.addColorStop(0, sp.light);
  g.addColorStop(0.55, sp.color);
  g.addColorStop(1, sp.dark);
  c.fillStyle = g;
  c.fill();
  c.save(); body(); c.clip();
  c.fillStyle = sp.spots;
  c.globalAlpha = 0.55;
  for (const [x, y, q] of [[-0.25, -0.5, 0.08], [-0.05, 0.55, 0.07], [-0.4, 0.25, 0.06], [0.05, -0.75, 0.05], [-0.2, 0.8, 0.05], [-0.45, -0.2, 0.05]]) {
    c.beginPath(); c.arc(x * r, y * wy, q * r, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
  c.restore();
  body(); inkStroke(c, 3.2);
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.beginPath(); c.ellipse(r * 0.3, -r * 0.22, r * 0.22, r * 0.08, -0.4, 0, TAU); c.fill();
  eye(c, r * 0.45, -r * 0.2, r * 0.17, happy);
  eye(c, r * 0.45, r * 0.2, r * 0.17, happy);
  blush(c, r * 0.6, -r * 0.38, r * 0.11);
  blush(c, r * 0.6, r * 0.38, r * 0.11);
  c.strokeStyle = INK; c.lineWidth = 2.2; c.lineCap = 'round';
  c.beginPath(); c.arc(r * 0.68, 0, r * 0.13, -Math.PI * 0.35, Math.PI * 0.35); c.stroke();
  if (sp.rare) { c.fillStyle = '#ffffff'; starPath(c, -r * 0.2, -r * 0.35, 5, 1.2, 4, 0); c.fill(); }
}

function turtleShell(c, sp) {
  const r = sp.r;
  c.beginPath();
  c.moveTo(-r * 0.98, r * 0.22);
  c.bezierCurveTo(-r * 0.98, -r * 0.82, r * 0.88, -r * 0.82, r * 0.88, r * 0.22);
  c.quadraticCurveTo(-r * 0.05, r * 0.36, -r * 0.98, r * 0.22);
  c.closePath();
}
function paintTurtle(c, sp, happy) {
  const r = sp.r;
  // tail
  c.beginPath(); c.moveTo(-r * 0.85, r * 0.05); c.lineTo(-r * 1.25, r * 0.2); c.lineTo(-r * 0.85, r * 0.3); c.closePath();
  c.fillStyle = sp.skin; c.fill(); inkStroke(c, 2.4);
  // neck and head
  c.beginPath(); c.ellipse(r * 0.85, r * 0.06, r * 0.32, r * 0.22, -0.2, 0, TAU);
  c.fillStyle = sp.skin; c.fill(); inkStroke(c, 2.8);
  c.beginPath(); c.arc(r * 1.2, -r * 0.08, r * 0.38, 0, TAU);
  c.fillStyle = grad(c, -r * 0.46, r * 0.3, '#ffffff', sp.skin, sp.skinDark);
  c.fill(); inkStroke(c, 3);
  if (sp.redEar) { c.fillStyle = '#ff5a4a'; c.beginPath(); c.ellipse(r * 1.0, -r * 0.02, r * 0.12, r * 0.07, -0.3, 0, TAU); c.fill(); }
  eye(c, r * 1.27, -r * 0.16, r * 0.15, happy);
  blush(c, r * 1.22, r * 0.08, r * 0.1);
  c.strokeStyle = INK; c.lineWidth = 2; c.lineCap = 'round';
  c.beginPath(); c.arc(r * 1.4, r * 0.0, r * 0.12, Math.PI * 0.15, Math.PI * 0.75); c.stroke();
  // shell
  turtleShell(c, sp);
  c.fillStyle = grad(c, -r * 0.8, r * 0.3, sp.plate, sp.shell, sp.shellDark);
  c.fill();
  c.save(); turtleShell(c, sp); c.clip();
  c.fillStyle = sp.plate;
  c.strokeStyle = sp.shellDark;
  c.lineWidth = 2.2;
  const hex = (x, y, h) => {
    c.beginPath();
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const px = x + Math.cos(a) * h; const py = y + Math.sin(a) * h * 0.85; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
    c.closePath(); c.globalAlpha = 0.75; c.fill(); c.globalAlpha = 1; c.stroke();
  };
  hex(-r * 0.05, -r * 0.25, r * 0.26);
  hex(-r * 0.62, -r * 0.05, r * 0.22);
  hex(r * 0.52, -r * 0.05, r * 0.22);
  c.fillStyle = sp.shellDark;
  c.fillRect(-r, r * 0.12, r * 2, r * 0.3);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  for (let x = -r * 0.8; x < r * 0.8; x += r * 0.3) { c.beginPath(); c.arc(x, r * 0.2, r * 0.05, 0, TAU); c.fill(); }
  c.restore();
  turtleShell(c, sp); inkStroke(c, 3.2);
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.beginPath(); c.ellipse(-r * 0.3, -r * 0.48, r * 0.25, r * 0.08, -0.3, 0, TAU); c.fill();
  if (sp.rare) { c.fillStyle = '#ffffff'; starPath(c, r * 0.3, -r * 0.4, 5, 1.2, 4, 0); c.fill(); }
}
function paintFlipper(c, sp, big) {
  const r = sp.r * (big ? 1 : 0.65);
  c.beginPath();
  c.moveTo(r * 0.12, -r * 0.08);
  c.bezierCurveTo(r * 0.1, r * 0.5, -r * 0.35, r * 0.75, -r * 0.7, r * 0.62);
  c.bezierCurveTo(-r * 0.45, r * 0.35, -r * 0.2, r * 0.1, -r * 0.18, -r * 0.05);
  c.closePath();
  c.fillStyle = grad(c, 0, r * 0.7, sp.skin, sp.skin, sp.skinDark);
  c.fill(); inkStroke(c, 2.6);
}

function paintSeahorse(c, sp, fin, happy) {
  const r = sp.r;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // curly tail
  const tail = () => {
    c.beginPath();
    c.moveTo(-r * 0.05, r * 0.5);
    c.bezierCurveTo(-r * 0.15, r * 1.25, -r * 0.8, r * 1.3, -r * 0.68, r * 0.92);
    c.quadraticCurveTo(-r * 0.58, r * 0.7, -r * 0.36, r * 0.86);
  };
  tail(); c.strokeStyle = INK; c.lineWidth = r * 0.34 + 5; c.stroke();
  tail(); c.strokeStyle = sp.color; c.lineWidth = r * 0.34; c.stroke();
  // back fin
  c.save();
  c.translate(-r * 0.42, -r * 0.08);
  c.scale(fin, 1);
  c.beginPath(); c.moveTo(0, -r * 0.32); c.quadraticCurveTo(-r * 0.45, -r * 0.1, -r * 0.05, r * 0.32); c.closePath();
  c.fillStyle = sp.fin; c.globalAlpha = 0.9; c.fill(); c.globalAlpha = 1; inkStroke(c, 2);
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.2;
  for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(-r * 0.02, k * r * 0.15); c.lineTo(-r * 0.24, k * r * 0.12); c.stroke(); }
  c.restore();
  // body
  const body = () => {
    c.beginPath();
    c.moveTo(r * 0.05, -r * 0.78);
    c.bezierCurveTo(r * 0.62, -r * 0.55, r * 0.62, r * 0.22, r * 0.22, r * 0.56);
    c.quadraticCurveTo(r * 0.04, r * 0.72, -r * 0.16, r * 0.52);
    c.bezierCurveTo(-r * 0.52, r * 0.2, -r * 0.48, -r * 0.5, -r * 0.16, -r * 0.76);
    c.closePath();
  };
  body();
  c.fillStyle = grad(c, -r * 0.8, r * 0.7, sp.light, sp.color, sp.dark);
  c.fill();
  c.save(); body(); c.clip();
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.8;
  for (let k = 0; k < 5; k++) { const y = -r * 0.45 + k * r * 0.22; c.beginPath(); c.moveTo(r * 0.15, y); c.quadraticCurveTo(r * 0.45, y + r * 0.06, r * 0.65, y); c.stroke(); }
  c.restore();
  body(); inkStroke(c, 3);
  // snout
  c.beginPath(); c.moveTo(r * 0.2, -r * 1.0); c.lineTo(r * 0.92, -r * 0.88);
  c.strokeStyle = INK; c.lineWidth = r * 0.3 + 5; c.stroke();
  c.strokeStyle = sp.color; c.lineWidth = r * 0.3; c.stroke();
  // crest
  c.fillStyle = sp.dark;
  for (const [x, y] of [[-r * 0.32, -r * 1.22], [-r * 0.12, -r * 1.36], [r * 0.08, -r * 1.36]]) {
    c.beginPath(); c.moveTo(x - r * 0.1, y + r * 0.12); c.lineTo(x, y - r * 0.08); c.lineTo(x + r * 0.1, y + r * 0.12); c.closePath(); c.fill(); inkStroke(c, 1.8);
  }
  // head
  c.beginPath(); c.arc(-r * 0.02, -r * 0.98, r * 0.42, 0, TAU);
  c.fillStyle = grad(c, -r * 1.4, -r * 0.56, sp.light, sp.color, sp.color);
  c.fill(); inkStroke(c, 3);
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.beginPath(); c.ellipse(-r * 0.15, -r * 1.2, r * 0.14, r * 0.07, -0.4, 0, TAU); c.fill();
  eye(c, r * 0.07, -r * 1.02, r * 0.19, happy);
  blush(c, r * 0.1, -r * 0.74, r * 0.12);
  c.beginPath(); c.arc(r * 0.98, -r * 0.88, r * 0.07, 0, TAU); c.fillStyle = INK; c.fill();
  if (sp.rare) { c.fillStyle = '#ffffff'; starPath(c, r * 0.18, -r * 0.1, 5, 1.2, 4, 0); c.fill(); }
}

function paintLobster(c, sp, frame) {
  const r = sp.r;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // antennae
  c.strokeStyle = INK; c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(r * 0.75, -r * 0.2); c.bezierCurveTo(r * 0.9, -r * 0.9, r * 0.3, -r * 1.3, -r * 0.5, -r * 1.1); c.stroke();
  c.beginPath(); c.moveTo(r * 0.8, -r * 0.15); c.bezierCurveTo(r * 1.2, -r * 0.8, r * 0.9, -r * 1.35, r * 0.3, -r * 1.38); c.stroke();
  // legs
  for (let i = 0; i < 4; i++) {
    const lift = (frame === 'b' ? (i % 2 ? 1 : -1) : (i % 2 ? -1 : 1)) * 3;
    const x = -r * 0.3 + i * r * 0.25;
    c.beginPath(); c.moveTo(x, r * 0.25); c.lineTo(x - r * 0.08, r * 0.5 + lift * 0.4); c.lineTo(x - r * 0.18, r * 0.74 + lift);
    c.strokeStyle = INK; c.lineWidth = 6.5; c.stroke();
    c.strokeStyle = sp.dark; c.lineWidth = 3.2; c.stroke();
  }
  // tail segments and fan
  const fill = (y0, y1) => grad(c, y0, y1, sp.light, sp.color, sp.dark);
  c.beginPath();
  c.moveTo(-r * 1.25, r * 0.1);
  c.lineTo(-r * 1.68, -r * 0.18); c.quadraticCurveTo(-r * 1.8, r * 0.12, -r * 1.68, r * 0.42);
  c.closePath();
  c.fillStyle = fill(-r * 0.2, r * 0.4); c.fill(); inkStroke(c, 2.6);
  for (let i = 2; i >= 0; i--) {
    c.beginPath(); c.ellipse(-r * 0.62 - i * r * 0.24, r * 0.05 + i * r * 0.02, r * 0.2, r * 0.28 - i * r * 0.03, 0, 0, TAU);
    c.fillStyle = fill(-r * 0.25, r * 0.35); c.fill(); inkStroke(c, 2.6);
  }
  // claws
  const up = frame === 'wave';
  const cx = up ? r * 1.15 : r * 1.3;
  const cy = up ? -r * 0.72 : -r * 0.1;
  c.beginPath(); c.moveTo(r * 0.55, r * 0.15); c.quadraticCurveTo(r * 1.0, r * 0.2, cx - r * 0.2, cy + r * 0.15);
  c.strokeStyle = INK; c.lineWidth = 8; c.stroke();
  c.strokeStyle = sp.color; c.lineWidth = 4.5; c.stroke();
  c.save();
  c.translate(cx, cy);
  c.rotate(up ? -0.9 : -0.2);
  c.beginPath();
  c.ellipse(0, 0, r * 0.42, r * 0.24, 0, Math.PI * 0.15, Math.PI * 1.85);
  c.lineTo(r * 0.05, 0);
  c.closePath();
  c.fillStyle = fill(-r * 0.24, r * 0.24); c.fill(); inkStroke(c, 2.8);
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.beginPath(); c.ellipse(-r * 0.12, -r * 0.08, r * 0.12, r * 0.05, -0.2, 0, TAU); c.fill();
  c.restore();
  // body
  c.beginPath(); c.ellipse(r * 0.05, 0, r * 0.62, r * 0.38, 0, 0, TAU);
  c.fillStyle = fill(-r * 0.38, r * 0.38); c.fill(); inkStroke(c, 3.2);
  c.beginPath(); c.ellipse(r * 0.62, -r * 0.04, r * 0.3, r * 0.3, 0, 0, TAU);
  c.fillStyle = fill(-r * 0.34, r * 0.26); c.fill(); inkStroke(c, 3);
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.beginPath(); c.ellipse(-r * 0.1, -r * 0.2, r * 0.25, r * 0.07, -0.1, 0, TAU); c.fill();
  // eyes on little stalks
  for (const [x, y] of [[r * 0.5, -r * 0.55], [r * 0.74, -r * 0.5]]) {
    c.beginPath(); c.moveTo(r * 0.62, -r * 0.25); c.lineTo(x, y);
    c.strokeStyle = INK; c.lineWidth = 4.5; c.stroke(); c.strokeStyle = sp.color; c.lineWidth = 2; c.stroke();
  }
  eye(c, r * 0.5, -r * 0.6, r * 0.17, false);
  eye(c, r * 0.76, -r * 0.55, r * 0.17, false);
  blush(c, r * 0.66, r * 0.1, r * 0.1);
  grin(c, r * 0.8, r * 0.12, r * 0.12, 2);
}

// ---------------------------------------------------------------------------
// Building the sprites
// ---------------------------------------------------------------------------
/** Size of the creature's drawing box (units), and where its center is. */
export function boundsOf(sp) {
  switch (sp.kind) {
    case 'fish': {
      const tall = sp.shape === 'tall';
      const shark = sp.shape === 'shark';
      const left = sp.rx * 0.85 + sp.tl;
      const right = sp.rx * (sp.sword ? 1.9 : sp.horn ? 1.55 : sp.whiskers === 'cat' ? 1.35 : 1.05);
      const top = sp.ry * (tall ? 1.9 : shark ? 2.05 : sp.horn ? 1.6 : 1.35) + (sp.crown ? 10 : 0);
      const bottom = sp.ry * (tall ? 1.9 : shark ? 1.6 : 1.3);
      return { left, right, top, bottom };
    }
    case 'ray': return { left: sp.r * 2.0, right: sp.r * 1.0, top: sp.r * 1.05, bottom: sp.r * 1.05 };
    case 'turtle': return { left: sp.r * 1.3, right: sp.r * 1.62, top: sp.r * 0.85, bottom: sp.r * 0.95 };
    case 'seahorse': return { left: sp.r * 0.9, right: sp.r * 1.1, top: sp.r * 1.5, bottom: sp.r * 1.45 };
    case 'lobster': return { left: sp.r * 1.8, right: sp.r * 1.75, top: sp.r * 1.45, bottom: sp.r * 0.8 };
    case 'puffer': return { left: sp.r * 1.4 + sp.tl, right: sp.r * 1.4, top: sp.r * 1.45, bottom: sp.r * 1.4 };
    case 'eel': return { left: sp.len / 2 + 6, right: sp.len / 2 + 10, top: 26, bottom: 26 };
    case 'jelly': return { left: sp.r * 1.1, right: sp.r * 1.1, top: sp.r * 1.05, bottom: sp.r * 2.1 };
    case 'octopus': return { left: sp.r * 1.4, right: sp.r * 1.4, top: sp.r * 1.2, bottom: sp.r * 1.9 };
    case 'crab': return { left: sp.r * 1.6, right: sp.r * 1.6, top: sp.r * 1.5, bottom: sp.r * 1.0 };
  }
  return { left: 40, right: 40, top: 40, bottom: 40 };
}

function boxSprite(b, res, draw) {
  const w = b.left + b.right + 8;
  const h = b.top + b.bottom + 8;
  const cv = makeSprite(w, h, (c) => { c.translate(b.left + 4, b.top + 4); draw(c); }, res);
  cv.cx = b.left + 4;
  cv.cy = b.top + 4;
  return trimSprite(cv);
}

// The boxes are roomy; a tail fills only about a quarter of its box. Trimming the empty
// border (keeping the same pixels per unit, and a clear 2-pixel edge) makes every
// drawing of it, turned or copied, touch far fewer pixels. Looks exactly the same.
function trimSprite(cv) {
  let d;
  try { d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; } catch (err) { return cv; }
  const W = cv.width;
  const H = cv.height;
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < H; y++) {
    const row = y * W * 4;
    for (let x = 0; x < W; x++) {
      if (d[row + x * 4 + 3]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        y1 = y;
      }
    }
  }
  if (x1 < 0) return cv;
  x0 = Math.max(0, x0 - 2);
  y0 = Math.max(0, y0 - 2);
  x1 = Math.min(W - 1, x1 + 2);
  y1 = Math.min(H - 1, y1 + 2);
  const nw = x1 - x0 + 1;
  const nh = y1 - y0 + 1;
  if (nw * nh > W * H * 0.85) return cv;
  const kx = W / cv.w;
  const ky = H / cv.h;
  const out = document.createElement('canvas');
  out.width = nw;
  out.height = nh;
  out.getContext('2d').drawImage(cv, x0, y0, nw, nh, 0, 0, nw, nh);
  out.w = nw / kx;
  out.h = nh / ky;
  out.cx = cv.cx - x0 / kx;
  out.cy = cv.cy - y0 / ky;
  return out;
}

/** Pre-renders everything a species needs. res = sprite pixels per unit. */
export function buildArt(sp, res) {
  const a = { sp, res };
  if (sp.kind === 'fish') {
    const bb = boundsOf(sp);
    const b = { left: sp.rx * 1.25, right: bb.right + 2, top: Math.max(sp.ry * (sp.shape === 'tall' ? 2.05 : 1.6) + (sp.crown ? 14 : 0), bb.top + 6), bottom: Math.max(sp.ry * (sp.shape === 'tall' ? 2.05 : 1.5), bb.bottom + 4) };
    a.body = boxSprite(b, res, (c) => paintBody(c, sp, false));
    a.bodyHappy = boxSprite(b, res, (c) => paintBody(c, sp, true));
    a.tail = boxSprite({ left: sp.tl * 1.25 + 4, right: 8, top: sp.th * 1.3 + 2, bottom: sp.th * 1.3 + 2 }, res, (c) => paintTail(c, sp));
    a.joint = -sp.rx * 0.86;
  } else if (sp.kind === 'puffer') {
    const b = { left: sp.r * 1.45, right: sp.r * 1.45, top: sp.r * 1.6, bottom: sp.r * 1.5 };
    a.body = boxSprite(b, res, (c) => paintPuffer(c, sp, false, false));
    a.bodyHappy = boxSprite(b, res, (c) => paintPuffer(c, sp, false, true));
    a.puffed = boxSprite(b, res, (c) => paintPuffer(c, sp, true, true));
    const tsp = { tl: sp.tl, th: sp.th, tail: 'fan', fin: sp.fin };
    a.tail = boxSprite({ left: sp.tl * 1.25 + 4, right: 8, top: sp.th * 1.3 + 2, bottom: sp.th * 1.3 + 2 }, res, (c) => paintTail(c, tsp));
    a.joint = -sp.r * 0.95;
  } else if (sp.kind === 'crab' || sp.kind === 'lobster') {
    const b = boundsOf(sp);
    const paint = sp.kind === 'crab' ? paintCrab : paintLobster;
    a.frames = {
      a: boxSprite(b, res, (c) => paint(c, sp, 'a')),
      b: boxSprite(b, res, (c) => paint(c, sp, 'b')),
      wave: boxSprite(b, res, (c) => paint(c, sp, 'wave')),
    };
  } else if (sp.kind === 'ray') {
    const b = boundsOf(sp);
    a.frames = [1, 0.78, 0.56].map((k) => boxSprite(b, res, (c) => paintRay(c, sp, k, false)));
    a.happyFrames = [1, 0.78, 0.56].map((k) => boxSprite(b, res, (c) => paintRay(c, sp, k, true)));
  } else if (sp.kind === 'turtle') {
    const b = boundsOf(sp);
    a.body = boxSprite(b, res, (c) => paintTurtle(c, sp, false));
    a.bodyHappy = boxSprite(b, res, (c) => paintTurtle(c, sp, true));
    const fb = { left: sp.r * 0.8, right: sp.r * 0.25, top: sp.r * 0.2, bottom: sp.r * 0.8 };
    a.front = boxSprite(fb, res, (c) => paintFlipper(c, sp, true));
    a.back = boxSprite(fb, res, (c) => paintFlipper(c, sp, false));
  } else if (sp.kind === 'seahorse') {
    const b = boundsOf(sp);
    a.frames = [1, 0.45].map((k) => boxSprite(b, res, (c) => paintSeahorse(c, sp, k, false)));
    a.happyFrames = [1, 0.45].map((k) => boxSprite(b, res, (c) => paintSeahorse(c, sp, k, true)));
  }
  return a;
}

/** Draws a creature in local units (facing right, centered) with the given pose. */
export function drawCreature(c, a, t, pose) {
  const sp = a.sp;
  switch (sp.kind) {
    case 'fish':
    case 'puffer': {
      const body = pose.puff && a.puffed ? a.puffed : pose.happy ? a.bodyHappy : a.body;
      if (!(pose.puff && a.puffed)) {
        c.save();
        c.translate(a.joint, 0);
        c.rotate(pose.wag || 0);
        c.drawImage(a.tail, -a.tail.cx, -a.tail.cy, a.tail.w, a.tail.h);
        c.restore();
      } else {
        c.save();
        c.translate(a.joint * 1.3, 0);
        c.rotate(pose.wag || 0);
        c.drawImage(a.tail, -a.tail.cx, -a.tail.cy, a.tail.w, a.tail.h);
        c.restore();
      }
      c.drawImage(body, -body.cx, -body.cy, body.w, body.h);
      break;
    }
    case 'eel': drawEel(c, sp, t, pose.happy, pose.big ? null : a); break;
    case 'jelly': drawJelly(c, sp, t, pose.happy, pose.squash || 1, pose.big ? null : a); break;
    case 'octopus': drawOctopus(c, sp, t, pose.happy, pose.squash || 1, pose.big ? null : a); break;
    case 'crab':
    case 'lobster': {
      const f = pose.wave ? a.frames.wave : (Math.floor(pose.step || 0) % 2 ? a.frames.b : a.frames.a);
      c.drawImage(f, -f.cx, -f.cy, f.w, f.h);
      break;
    }
    case 'ray': {
      const w = pose.wag || 0;
      const set = pose.happy ? a.happyFrames : a.frames;
      const f = set[w > 0.1 ? 0 : w < -0.1 ? 2 : 1];
      c.drawImage(f, -f.cx, -f.cy, f.w, f.h);
      break;
    }
    case 'turtle': {
      const r = sp.r;
      const w = pose.wag || 0;
      c.save(); c.translate(-r * 0.55, r * 0.2); c.rotate(-w * 1.2); c.drawImage(a.back, -a.back.cx, -a.back.cy, a.back.w, a.back.h); c.restore();
      const body = pose.happy ? a.bodyHappy : a.body;
      c.drawImage(body, -body.cx, -body.cy, body.w, body.h);
      c.save(); c.translate(r * 0.42, r * 0.22); c.rotate(w * 1.5); c.drawImage(a.front, -a.front.cx, -a.front.cy, a.front.w, a.front.h); c.restore();
      break;
    }
    case 'seahorse': {
      const set = pose.happy ? a.happyFrames : a.frames;
      const f = set[(pose.wag || 0) > 0 ? 0 : 1];
      c.drawImage(f, -f.cx, -f.cy, f.w, f.h);
      break;
    }
  }
}

// ---- the same drawings, copied 1:1 ----
// A sprite drawn scaled (and mirrored) on the canvas costs several times more than a
// plain pixel copy. A creature that swims straight (no tilt, not turning, not
// squashed) has its sprite drawn once at its exact on-screen size into a small canvas,
// and then copied each frame at whole device pixels. The wagging tail and the turtle's
// flippers still turn, so they are drawn as before.
const baked = new Map();
let bakedD = 0;
function bake(img, k, flip) {
  const key = img.bakeId + '|' + k + '|' + flip;
  let cv = baked.get(key);
  if (cv) return cv;
  if (baked.size > 160) baked.clear();
  cv = document.createElement('canvas');
  cv.width = Math.ceil(img.w * k) + 2;
  cv.height = Math.ceil(img.h * k) + 2;
  cv.ox = (flip > 0 ? img.cx : img.w - img.cx) * k + 1;
  cv.oy = img.cy * k + 1;
  const c = cv.getContext('2d');
  c.setTransform(flip * k, 0, 0, k, cv.ox, cv.oy);
  c.drawImage(img, -img.cx, -img.cy, img.w, img.h);
  baked.set(key, cv);
  return cv;
}
let bakeIds = 0;
function blitBaked(c, img, x, y, k, flip) {
  if (!img.bakeId) img.bakeId = ++bakeIds;
  const cv = bake(img, k, flip);
  c.drawImage(cv, Math.round(x - cv.ox), Math.round(y - cv.oy));
}

/**
 * Draws a creature that swims straight, facing `flip` (1 or -1), at scale s, centered
 * at (x, y) in canvas units; D = device pixels per unit. The canvas transform must be
 * (D, 0, 0, D, 0, 0); it is left that way. Returns false for the ones drawn live
 * (eel, jellyfish, octopus): use drawCreature for those.
 */
export function drawCreatureFlat(c, a, pose, x, y, s, flip, D) {
  const sp = a.sp;
  if (sp.kind === 'eel' || sp.kind === 'jelly' || sp.kind === 'octopus') return false;
  if (D !== bakedD) { baked.clear(); bakedD = D; }
  const k = s * D;
  const X = x * D;
  const Y = y * D;
  const flat = () => c.setTransform(1, 0, 0, 1, 0, 0);
  const local = () => { c.setTransform(D, 0, 0, D, 0, 0); c.translate(x, y); c.scale(flip * s, s); };
  switch (sp.kind) {
    case 'fish':
    case 'puffer': {
      const puffed = pose.puff && a.puffed;
      const body = puffed ? a.puffed : pose.happy ? a.bodyHappy : a.body;
      local();
      c.translate(puffed ? a.joint * 1.3 : a.joint, 0);
      c.rotate(pose.wag || 0);
      c.drawImage(a.tail, -a.tail.cx, -a.tail.cy, a.tail.w, a.tail.h);
      flat();
      blitBaked(c, body, X, Y, k, flip);
      break;
    }
    case 'crab':
    case 'lobster': {
      const f = pose.wave ? a.frames.wave : (Math.floor(pose.step || 0) % 2 ? a.frames.b : a.frames.a);
      flat();
      blitBaked(c, f, X, Y, k, flip);
      break;
    }
    case 'ray': {
      const w = pose.wag || 0;
      const set = pose.happy ? a.happyFrames : a.frames;
      flat();
      blitBaked(c, set[w > 0.1 ? 0 : w < -0.1 ? 2 : 1], X, Y, k, flip);
      break;
    }
    case 'turtle': {
      const r = sp.r;
      const w = pose.wag || 0;
      local();
      c.translate(-r * 0.55, r * 0.2); c.rotate(-w * 1.2); c.drawImage(a.back, -a.back.cx, -a.back.cy, a.back.w, a.back.h);
      flat();
      blitBaked(c, pose.happy ? a.bodyHappy : a.body, X, Y, k, flip);
      local();
      c.translate(r * 0.42, r * 0.22); c.rotate(w * 1.5); c.drawImage(a.front, -a.front.cx, -a.front.cy, a.front.w, a.front.h);
      break;
    }
    case 'seahorse': {
      const set = pose.happy ? a.happyFrames : a.frames;
      flat();
      blitBaked(c, set[(pose.wag || 0) > 0 ? 0 : 1], X, Y, k, flip);
      break;
    }
    default:
      return false;
  }
  c.setTransform(D, 0, 0, D, 0, 0);
  return true;
}

/** A still picture of the creature for the catch card and the fish book. */
export function portrait(a, size, silhouette, happy) {
  const sp = a.sp;
  const b = boundsOf(sp);
  const bw = b.left + b.right;
  const bh = b.top + b.bottom;
  const W = size;
  const H = Math.round(size * 0.75);
  const scale = Math.min((W * 0.9) / bw, (H * 0.9) / bh);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');
  c.translate(W / 2 + ((b.left - b.right) / 2) * scale, H / 2 + ((b.top - b.bottom) / 2) * scale);
  c.scale(scale, scale);
  drawCreature(c, a, 0.7, { wag: 0.12, happy: !!happy, step: 0, wave: (sp.kind === 'crab' || sp.kind === 'lobster') && happy, big: true });
  if (silhouette) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = '#2b3f74';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
  }
  return cv;
}
