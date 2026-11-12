// The creatures of Fishing Pond: species data and their drawings.
// Fish with tails are pre-rendered as a body sprite plus a tail sprite (the tail
// wags around its joint); the eel, jellyfish and octopus are drawn live from a
// few strokes (only one or two are on screen), and the crab has walking frames.
import { makeSprite, starPath, INK } from './engine.js';

const TAU = Math.PI * 2;

const GOLD = { top: '#fff7b8', belly: '#ffc21f', fin: '#ffb000', finDark: '#e08a00' };

export const SPECIES = [
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

export const BY_ID = {};
SPECIES.forEach((s) => { BY_ID[s.id] = s; });

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
  if (sp.shape === 'tall') {
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
export function drawEel(c, sp, t, happy) {
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
  for (const p of pts) { c.fillStyle = INK; c.beginPath(); c.arc(p[0], p[1], p[2] + 2, 0, TAU); c.fill(); }
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    c.fillStyle = sp.color;
    c.beginPath(); c.arc(p[0], p[1], p[2], 0, TAU); c.fill();
  }
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
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.beginPath(); c.ellipse(h[0] - 4, h[1] - h[2] * 0.55, h[2] * 0.6, h[2] * 0.25, 0, 0, TAU); c.fill();
  eye(c, h[0] + 1, h[1] - 4, 6.5, happy);
  grin(c, h[0] + 8, h[1] + 6, 4.5, 2.2);
  blush(c, h[0] - 3, h[1] + 6, 4);
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

export function drawJelly(c, sp, t, happy, squash = 1) {
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
  c.restore();
}

export function drawOctopus(c, sp, t, happy, squash = 1) {
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
// Building the sprites
// ---------------------------------------------------------------------------
/** Size of the creature's drawing box (units), and where its center is. */
export function boundsOf(sp) {
  switch (sp.kind) {
    case 'fish': {
      const tall = sp.shape === 'tall';
      const left = sp.rx * 0.85 + sp.tl;
      return { left, right: sp.rx * 1.05, top: sp.ry * (tall ? 1.9 : 1.35) + (sp.crown ? 10 : 0), bottom: sp.ry * (tall ? 1.9 : 1.3) };
    }
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
  return cv;
}

/** Pre-renders everything a species needs. res = sprite pixels per unit. */
export function buildArt(sp, res) {
  const a = { sp };
  if (sp.kind === 'fish') {
    const b = { left: sp.rx * 1.25, right: sp.rx * 1.05, top: sp.ry * (sp.shape === 'tall' ? 2.05 : 1.6) + (sp.crown ? 14 : 0), bottom: sp.ry * (sp.shape === 'tall' ? 2.05 : 1.5) };
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
  } else if (sp.kind === 'crab') {
    const b = boundsOf(sp);
    a.frames = {
      a: boxSprite(b, res, (c) => paintCrab(c, sp, 'a')),
      b: boxSprite(b, res, (c) => paintCrab(c, sp, 'b')),
      wave: boxSprite(b, res, (c) => paintCrab(c, sp, 'wave')),
    };
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
    case 'eel': drawEel(c, sp, t, pose.happy); break;
    case 'jelly': drawJelly(c, sp, t, pose.happy, pose.squash || 1); break;
    case 'octopus': drawOctopus(c, sp, t, pose.happy, pose.squash || 1); break;
    case 'crab': {
      const f = pose.wave ? a.frames.wave : (Math.floor(pose.step || 0) % 2 ? a.frames.b : a.frames.a);
      c.drawImage(f, -f.cx, -f.cy, f.w, f.h);
      break;
    }
  }
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
  drawCreature(c, a, 0.7, { wag: 0.12, happy: !!happy, step: 0, wave: sp.kind === 'crab' && happy });
  if (silhouette) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = '#2b3f74';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
  }
  return cv;
}
