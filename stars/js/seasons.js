// The four seasons of Catch the Falling Stars: everything a season needs is drawn
// once into offscreen canvases (falling things, its special, its gentle "oops"
// drop and cloud, a basket overlay) plus a still backdrop painter.
import { makeSprite, softStarPath, roundRectPath, starPath, INK, GLOW, splitGlow } from './engine.js';
import {
  eyes, cheeks, smile, hexA, cloudBody, rng, STAR_BOX, BASKET_W, BASKET_H, RIM_Y, BX, HALF,
  DROP_W, DROP_H, CLOUD_W, CLOUD_H,
} from './art.js';

const TAU = Math.PI * 2;
const RES = 3;
const C = STAR_BOX / 2;
const GOLD = { light: '#ffffff', mid: '#fff07a', dark: '#ffc21f', pop: '#fff27a' };
const RAINBOW = ['#ff4d5e', '#ff9a2e', '#ffd93b', '#5cd65c', '#3d9bff', '#9d5cff'];

/** The seasons, in the order of the title tiles. */
export const SEASONS = [
  { id: 'night', name: 'Night Sky', icon: '🌙', tile: 'purple', unit: 'stars', one: 'star', say: 'Night sky! Catch the stars!' },
  { id: 'winter', name: 'Winter', icon: '❄️', tile: 'blue', unit: 'snowflakes', one: 'snowflake', say: 'Winter! Catch the snowflakes!' },
  { id: 'autumn', name: 'Autumn', icon: '🍂', tile: 'orange', unit: 'leaves', one: 'leaf', say: 'Autumn! Catch the leaves!' },
  { id: 'spring', name: 'Spring', icon: '🌸', tile: 'pink', unit: 'flowers', one: 'flower', say: 'Spring! Catch the flowers and butterflies!' },
  { id: 'summer', name: 'Summer', icon: '☀️', tile: 'yellow', unit: 'goodies', one: 'goodie', say: 'Summer evening! Catch the fruit and the fireflies!' },
];
export const SEASON_BY_ID = {};
SEASONS.forEach((s) => { SEASON_BY_ID[s.id] = s; });

// ---------------------------------------------------------------------------
// Little drawing helpers (box units: 100 x 100, the thing in the middle)
// ---------------------------------------------------------------------------
function ink(c, w) {
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.lineWidth = w;
  c.strokeStyle = INK;
  c.stroke();
}
function fillFor(c, pal, x0, y0, x1, y1) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  if (pal === 'rainbow') {
    RAINBOW.forEach((col, i) => { g.addColorStop(i / 6, col); g.addColorStop((i + 1) / 6 - 0.001, col); });
  } else {
    g.addColorStop(0, pal.light);
    g.addColorStop(0.45, pal.mid);
    g.addColorStop(1, pal.dark);
  }
  return g;
}
function glow(c, color, r0 = 17) {
  const paint = (cc) => {
    const g = cc.createRadialGradient(C, C, r0, C, C, C);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    cc.fillStyle = g;
    cc.fillRect(0, 0, STAR_BOX, STAR_BOX);
  };
  // (always the first thing drawn, so the sprite can be split: see splitGlow)
  if (GLOW.skip) GLOW.seen = { key: color + '|' + r0, paint };
  else paint(c);
}
function glowFor(pal) { return pal === 'rainbow' ? 'rgba(255,255,255,0.8)' : hexA(pal.mid, 0.5); }
function shine(c, x, y, rx, ry, rot) {
  c.fillStyle = 'rgba(255,255,255,0.8)';
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill();
}
function face(c, x, y, s, kind) {
  eyes(c, x, y, 7.5 * s, 3 * s, kind);
  cheeks(c, x, y + 6 * s, 13 * s, 3.4 * s);
  smile(c, x, y + 8 * s, 4.2 * s, 2.2 * Math.max(0.8, s), kind === 'happy');
}
function shadeClip(c, path, y0, y1) {
  c.save();
  path();
  c.clip();
  const sh = c.createLinearGradient(0, y0, 0, y1);
  sh.addColorStop(0, 'rgba(255,255,255,0.5)');
  sh.addColorStop(0.45, 'rgba(255,255,255,0)');
  sh.addColorStop(1, 'rgba(60,0,80,0.16)');
  c.fillStyle = sh;
  c.fillRect(0, 0, STAR_BOX, STAR_BOX);
  c.restore();
}
/** A closed shape through polar points, softened with curves through the midpoints. */
function softPolar(c, cx, cy, list) {
  const pts = list.map(([a, r]) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  const n = pts.length;
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  c.beginPath();
  const m0 = mid(pts[n - 1], pts[0]);
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  c.closePath();
}
/** Like softPolar, but the points stay pointy (only the joins are rounded by the stroke). */
function jaggedPolar(c, cx, cy, list) {
  c.beginPath();
  list.forEach(([a, r], i) => {
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i) c.lineTo(x, y); else c.moveTo(x, y);
  });
  c.closePath();
}
function zzz(c, x, y, s) {
  c.strokeStyle = INK;
  c.lineWidth = 2;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6 * s, y); c.lineTo(x, y + 6 * s); c.lineTo(x + 6 * s, y + 6 * s); c.stroke();
}

// ---------------------------------------------------------------------------
// Winter
// ---------------------------------------------------------------------------
function snowflake(c, pal, ek) {
  glow(c, glowFor(pal));
  const arms = (w, col) => {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * TAU) / 6;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      c.moveTo(C, C); c.lineTo(C + ca * 33, C + sa * 33);
      const bx = C + ca * 21;
      const by = C + sa * 21;
      for (const s of [-1, 1]) {
        const b = a + s * 0.85;
        c.moveTo(bx, by); c.lineTo(bx + Math.cos(b) * 10, by + Math.sin(b) * 10);
      }
    }
    c.stroke();
  };
  arms(12.5, INK);
  arms(6.5, fillFor(c, pal, 20, 14, 80, 86));
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 6;
    c.beginPath(); c.arc(C + Math.cos(a) * 33, C + Math.sin(a) * 33, 4.6, 0, TAU);
    c.fillStyle = pal === 'rainbow' ? RAINBOW[i] : pal.light;
    c.fill(); ink(c, 2.2);
  }
  c.beginPath(); c.arc(C, C, 16.5, 0, TAU);
  c.fillStyle = fillFor(c, pal, 0, C - 16, 0, C + 16);
  c.fill();
  shadeClip(c, () => { c.beginPath(); c.arc(C, C, 16.5, 0, TAU); }, C - 16, C + 16);
  c.beginPath(); c.arc(C, C, 16.5, 0, TAU);
  ink(c, 3.4);
  shine(c, C - 7, C - 9, 4, 2, -0.6);
  face(c, C, C - 1, 0.74, ek);
}

function cocoa(c) {
  glow(c, 'rgba(255, 210, 160, 0.6)');
  // steam
  c.strokeStyle = 'rgba(255,255,255,0.95)';
  c.lineWidth = 3.4;
  c.lineCap = 'round';
  for (const x of [C - 10, C + 4]) {
    c.beginPath(); c.moveTo(x, C - 18); c.bezierCurveTo(x - 7, C - 25, x + 7, C - 30, x, C - 38); c.stroke();
  }
  // handle
  c.beginPath(); c.arc(C + 23, C + 6, 10, -Math.PI / 2, Math.PI / 2);
  c.strokeStyle = INK; c.lineWidth = 9; c.stroke();
  c.strokeStyle = '#ff6b7d'; c.lineWidth = 4.4; c.stroke();
  // mug
  const body = () => roundRectPath(c, C - 26, C - 14, 50, 44, 11);
  body();
  c.fillStyle = fillFor(c, { light: '#ffb3bd', mid: '#ff6b7d', dark: '#e6334f' }, 0, C - 14, 0, C + 30);
  c.fill();
  c.save(); body(); c.clip();
  c.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [x, y] of [[C - 16, C + 22], [C + 14, C + 20], [C - 2, C + 25], [C + 18, C - 4], [C - 19, C - 2]]) {
    starPath(c, x, y, 3.4, 1.2, 6, 0); c.fill();
  }
  c.restore();
  shadeClip(c, body, C - 14, C + 30);
  body(); ink(c, 3.4);
  // cocoa and marshmallows
  c.beginPath(); c.ellipse(C - 1, C - 13, 21, 5, 0, 0, TAU);
  c.fillStyle = '#8a4b2a'; c.fill(); ink(c, 2.4);
  for (const [x, y, r] of [[C - 8, C - 15, -0.3], [C + 6, C - 14, 0.4]]) {
    c.save(); c.translate(x, y); c.rotate(r);
    roundRectPath(c, -5, -4, 10, 8, 2.5);
    c.fillStyle = '#ffffff'; c.fill(); ink(c, 1.8);
    c.restore();
  }
  face(c, C - 1, C + 6, 0.9, 'closed');
  zzz(c, C + 30, C - 30, 1);
}

function snowClump(c) {
  const lumps = [[13, 23, 10], [7.5, 18, 6.5], [18.5, 17, 6.5], [13, 12.5, 6.5]];
  c.strokeStyle = INK;
  c.lineWidth = 4.4;
  for (const [x, y, r] of lumps) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); }
  const g = c.createLinearGradient(0, 6, 0, 34);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#bcd6f5');
  c.fillStyle = g;
  for (const [x, y, r] of lumps) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  c.fillStyle = '#ffffff';
  c.beginPath(); c.ellipse(9, 14, 2.4, 1.6, -0.5, 0, TAU); c.fill();
  c.fillStyle = 'rgba(140, 180, 240, 0.7)';
  for (const [x, y] of [[16, 26], [9, 24], [15, 19]]) { c.beginPath(); c.arc(x, y, 1.2, 0, TAU); c.fill(); }
}

/** The rim of the (soggy) basket front, for overlays. */
function rimPoint(t) {
  const x0 = BX - HALF - 2;
  const x2 = BX + HALF + 2;
  const cy = RIM_Y + 14 + 10 * 1.6;
  return [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * BX + t * t * x2, (1 - t) * (1 - t) * RIM_Y + 2 * (1 - t) * t * cy + t * t * RIM_Y];
}

function snowCap(c) {
  const lumps = [];
  for (let i = 0; i <= 8; i++) {
    const [x, y] = rimPoint(i / 8);
    lumps.push([x, y - 5, i % 2 ? 9 : 11.5]);
  }
  // icicles
  for (const t of [0.22, 0.4, 0.62, 0.8]) {
    const [x, y] = rimPoint(t);
    c.beginPath(); c.moveTo(x - 4, y + 2); c.lineTo(x, y + 13 + (t * 10 % 4)); c.lineTo(x + 4, y + 2); c.closePath();
    c.fillStyle = '#d6f1ff'; c.fill(); ink(c, 2);
  }
  c.strokeStyle = INK;
  c.lineWidth = 4.4;
  for (const [x, y, r] of lumps) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); }
  for (const [x, y, r] of lumps) {
    const g = c.createLinearGradient(0, y - r, 0, y + r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#cfe2fa');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,0.95)';
  for (const [x, y, r] of lumps) { c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.45, r * 0.3, r * 0.16, -0.4, 0, TAU); c.fill(); }
}

// ---------------------------------------------------------------------------
// Autumn
// ---------------------------------------------------------------------------
function leafPath(c) {
  c.beginPath();
  c.moveTo(C, 11);
  c.bezierCurveTo(C + 33, 26, C + 31, 66, C, 82);
  c.bezierCurveTo(C - 31, 66, C - 33, 26, C, 11);
  c.closePath();
}
function stem(c, x0, y0, x1, y1, col = '#8a5a35') {
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 4, (y0 + y1) / 2, x1, y1);
  c.strokeStyle = INK; c.lineWidth = 8; c.stroke();
  c.strokeStyle = col; c.lineWidth = 4; c.stroke();
}
function veins(c, pal, lines) {
  c.strokeStyle = pal === 'rainbow' ? 'rgba(255,255,255,0.6)' : hexA(pal.dark, 0.75);
  c.lineWidth = 2;
  c.lineCap = 'round';
  c.beginPath();
  for (const [x0, y0, x1, y1] of lines) { c.moveTo(x0, y0); c.lineTo(x1, y1); }
  c.stroke();
}
function leaf(c, pal, ek) {
  glow(c, glowFor(pal));
  stem(c, C, 78, C + 3, 93);
  leafPath(c);
  c.fillStyle = fillFor(c, pal, 20, 11, 80, 82);
  c.fill();
  shadeClip(c, () => leafPath(c), 11, 82);
  veins(c, pal, [[C, 16, C, 34], [C, 66, C, 80], [C, 26, C + 13, 20], [C, 26, C - 13, 20], [C, 72, C + 14, 64], [C, 72, C - 14, 64]]);
  leafPath(c);
  ink(c, 3.6);
  shine(c, C - 12, 30, 5, 2.6, -0.9);
  face(c, C, C - 2, 0.85, ek);
}
function maplePts() {
  const list = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 5;
    const k = i === 0 ? 1.06 : i === 1 || i === 4 ? 1 : 0.78;
    list.push([a - 0.63, i === 3 ? 10 : 15], [a - 0.42, 27 * k], [a - 0.27, 23 * k], [a - 0.13, 30 * k], [a, 38 * k], [a + 0.13, 30 * k], [a + 0.27, 23 * k], [a + 0.42, 27 * k]);
  }
  return list;
}
function maple(c, pal, ek) {
  glow(c, glowFor(pal));
  const cy = C - 2;
  stem(c, C, cy + 12, C + 2, 95);
  const path = () => jaggedPolar(c, C, cy, maplePts());
  path();
  c.fillStyle = fillFor(c, pal, 15, 12, 85, 88);
  c.fill();
  shadeClip(c, path, 12, 85);
  const vs = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 5;
    vs.push([C + Math.cos(a) * 19, cy + Math.sin(a) * 19, C + Math.cos(a) * 30, cy + Math.sin(a) * 30]);
  }
  veins(c, pal, vs);
  path();
  ink(c, 3.6);
  shine(c, C - 14, cy - 12, 5, 2.6, -0.8);
  face(c, C, cy + 1, 0.85, ek);
}
const NUT = { light: '#ffe2b0', mid: '#e9a85c', dark: '#b8702e' };
function acorn(c, pal, ek) {
  glow(c, 'rgba(255, 220, 160, 0.5)');
  const nut = () => {
    c.beginPath();
    c.moveTo(C - 24, C - 4);
    c.bezierCurveTo(C - 25, C + 24, C - 9, C + 36, C, C + 39);
    c.bezierCurveTo(C + 9, C + 36, C + 25, C + 24, C + 24, C - 4);
    c.closePath();
  };
  nut();
  c.fillStyle = fillFor(c, pal || NUT, 0, C - 4, 0, C + 39);
  c.fill();
  shadeClip(c, nut, C - 4, C + 39);
  nut(); ink(c, 3.4);
  face(c, C, C + 13, 0.85, ek);
  // cap
  const cap = () => {
    c.beginPath();
    c.moveTo(C - 30, C);
    c.quadraticCurveTo(C - 31, C - 27, C, C - 27);
    c.quadraticCurveTo(C + 31, C - 27, C + 30, C);
    c.quadraticCurveTo(C, C + 7, C - 30, C);
    c.closePath();
  };
  cap();
  c.fillStyle = fillFor(c, { light: '#c98a4a', mid: '#9a6230', dark: '#6e4220' }, 0, C - 27, 0, C + 4);
  c.fill();
  c.save(); cap(); c.clip();
  c.strokeStyle = 'rgba(60, 30, 10, 0.45)';
  c.lineWidth = 1.8;
  for (let k = -40; k <= 40; k += 8) {
    c.beginPath(); c.moveTo(C + k, C - 30); c.lineTo(C + k + 22, C + 6); c.stroke();
    c.beginPath(); c.moveTo(C + k, C - 30); c.lineTo(C + k - 22, C + 6); c.stroke();
  }
  c.restore();
  cap(); ink(c, 3.4);
  roundRectPath(c, C - 3.5, C - 37, 7, 12, 3);
  c.fillStyle = '#8a5a35'; c.fill(); ink(c, 2.4);
  shine(c, C - 12, C - 16, 5, 2.2, -0.4);
}
function pumpkin(c) {
  glow(c, 'rgba(255, 170, 80, 0.55)');
  const pal = { light: '#ffcf7a', mid: '#ff9a2e', dark: '#e0661a' };
  // stem, leaf and a curly vine
  c.beginPath(); c.moveTo(C + 4, C - 20); c.bezierCurveTo(C + 16, C - 34, C + 26, C - 22, C + 20, C - 18); c.bezierCurveTo(C + 16, C - 14, C + 12, C - 22, C + 18, C - 24);
  c.strokeStyle = INK; c.lineWidth = 5; c.stroke(); c.strokeStyle = '#5cd65c'; c.lineWidth = 2.2; c.stroke();
  for (const [x, rx] of [[C - 15, 17], [C + 15, 17], [C, 19]]) {
    c.beginPath(); c.ellipse(x, C + 6, rx, 26, 0, 0, TAU);
    c.fillStyle = fillFor(c, pal, 0, C - 20, 0, C + 32);
    c.fill(); ink(c, 3.2);
  }
  shine(c, C - 8, C - 10, 5, 2.4, -0.5);
  roundRectPath(c, C - 4, C - 31, 8, 14, 3);
  c.fillStyle = '#7a5a2a'; c.fill(); ink(c, 2.6);
  c.beginPath(); c.ellipse(C - 13, C - 25, 9, 4.5, -0.4, 0, TAU);
  c.fillStyle = '#5cd65c'; c.fill(); ink(c, 2.4);
  face(c, C, C + 8, 0.95, 'closed');
  zzz(c, C + 28, C - 36, 1);
}
function mudDrop(c) {
  const x = DROP_W / 2;
  c.beginPath();
  c.moveTo(x, 3);
  c.bezierCurveTo(x + 4, 12, x + 10, 17, x + 10, 24);
  c.arc(x, 24, 10, 0, Math.PI, false);
  c.bezierCurveTo(x - 10, 17, x - 4, 12, x, 3);
  c.closePath();
  const g = c.createLinearGradient(0, 3, 0, 34);
  g.addColorStop(0, '#e8c08a');
  g.addColorStop(1, '#8a5a2e');
  c.fillStyle = g;
  c.fill();
  ink(c, 2.6);
  c.fillStyle = 'rgba(255,255,255,0.8)';
  c.beginPath(); c.ellipse(x - 4, 23, 2.4, 4, 0.3, 0, TAU); c.fill();
  c.fillStyle = 'rgba(90, 50, 20, 0.5)';
  c.beginPath(); c.arc(x + 4, 27, 1.6, 0, TAU); c.fill();
}
function mudSplats(c) {
  const blobs = [[BX - 44, 58, 9, 7], [BX + 44, 50, 8, 6], [BX - 14, 104, 9, 5], [BX + 26, 100, 7, 5], [BX - 30, 34, 10, 6], [BX + 20, 40, 8, 5]];
  for (const [x, y, rx, ry] of blobs) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0.3, 0, TAU);
    c.fillStyle = 'rgba(122, 76, 36, 0.92)';
    c.fill();
    c.beginPath(); c.arc(x + rx * 0.9, y + ry * 0.4, ry * 0.45, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255, 220, 170, 0.45)';
    c.beginPath(); c.ellipse(x - rx * 0.3, y - ry * 0.3, rx * 0.35, ry * 0.25, 0, 0, TAU); c.fill();
  }
}

// ---------------------------------------------------------------------------
// Spring
// ---------------------------------------------------------------------------
function blossom(c, pal, ek) {
  glow(c, glowFor(pal));
  const petals = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 5;
    petals.push([C + Math.cos(a) * 19, C + Math.sin(a) * 19, a]);
  }
  const petal = (x, y, a) => {
    c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2);
    c.beginPath();
    c.moveTo(0, 10);
    c.bezierCurveTo(-19, 4, -17, -16, -5, -16);
    c.lineTo(0, -11);
    c.lineTo(5, -16);
    c.bezierCurveTo(17, -16, 19, 4, 0, 10);
    c.closePath();
    c.restore();
  };
  c.strokeStyle = INK;
  c.lineWidth = 7.2;
  c.lineJoin = 'round';
  for (const [x, y, a] of petals) { petal(x, y, a); c.stroke(); }
  for (const [x, y, a] of petals) {
    petal(x, y, a);
    c.fillStyle = fillFor(c, pal, x - 14, y - 14, x + 14, y + 14);
    c.fill();
  }
  c.strokeStyle = pal === 'rainbow' ? 'rgba(255,255,255,0.7)' : hexA(pal.dark, 0.5);
  c.lineWidth = 1.6;
  for (const [x, y, a] of petals) {
    c.beginPath(); c.moveTo(C + Math.cos(a) * 12, C + Math.sin(a) * 12); c.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); c.stroke();
  }
  c.beginPath(); c.arc(C, C, 15, 0, TAU);
  c.fillStyle = fillFor(c, { light: '#fff6b8', mid: '#ffd93b', dark: '#ffab1f' }, 0, C - 15, 0, C + 15);
  c.fill(); ink(c, 3.2);
  shine(c, C - 14, C - 22, 4, 2, -0.6);
  face(c, C, C - 1, 0.66, ek);
}
function daisy(c, pal, ek) {
  glow(c, 'rgba(255,255,255,0.6)');
  const n = 11;
  const petal = (i) => {
    const a = (i / n) * TAU;
    c.save(); c.translate(C, C); c.rotate(a);
    c.beginPath(); c.ellipse(0, -23, 7.5, 15, 0, 0, TAU);
    c.restore();
  };
  c.strokeStyle = INK;
  c.lineWidth = 6.4;
  for (let i = 0; i < n; i++) { petal(i); c.stroke(); }
  for (let i = 0; i < n; i++) { petal(i); c.fillStyle = fillFor(c, pal, 0, 10, 0, 90); c.fill(); }
  c.beginPath(); c.arc(C, C, 17, 0, TAU);
  c.fillStyle = fillFor(c, { light: '#fff6b8', mid: '#ffd93b', dark: '#ff9a1f' }, 0, C - 17, 0, C + 17);
  c.fill(); ink(c, 3.2);
  shine(c, C - 7, C - 9, 4, 2, -0.6);
  face(c, C, C - 1, 0.74, ek);
}
const BUG = { light: '#d8c4ff', mid: '#9d7bff', dark: '#6a48d8' };
function butterfly(c, pal, ek, k) {
  glow(c, glowFor(pal));
  for (const s of [-1, 1]) {
    c.save();
    c.translate(C, C);
    c.scale(s * k, 1);
    const up = () => { c.beginPath(); c.moveTo(4, -6); c.bezierCurveTo(10, -40, 44, -42, 40, -14); c.bezierCurveTo(38, -1, 18, 3, 4, 1); c.closePath(); };
    const low = () => { c.beginPath(); c.moveTo(4, 4); c.bezierCurveTo(28, 4, 38, 26, 22, 34); c.bezierCurveTo(10, 38, 4, 22, 4, 6); c.closePath(); };
    for (const p of [low, up]) {
      p();
      c.fillStyle = fillFor(c, pal, 0, -40, 30, 36);
      c.fill();
      c.save(); p(); c.clip();
      c.fillStyle = 'rgba(255,255,255,0.55)';
      c.beginPath(); c.arc(26, -20, 7, 0, TAU); c.fill();
      c.beginPath(); c.arc(18, 22, 5, 0, TAU); c.fill();
      c.fillStyle = 'rgba(60, 0, 80, 0.14)';
      c.beginPath(); c.arc(4, 0, 18, 0, TAU); c.fill();
      c.restore();
      p(); ink(c, 3.2);
    }
    c.restore();
  }
  // antennae
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(C + s * 3, C - 20); c.quadraticCurveTo(C + s * 6, C - 34, C + s * 14, C - 37);
    c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.arc(C + s * 14, C - 37, 3.4, 0, TAU); c.fillStyle = INK; c.fill();
  }
  const body = () => { c.beginPath(); c.ellipse(C, C + 2, 11, 24, 0, 0, TAU); };
  body();
  c.fillStyle = fillFor(c, BUG, 0, C - 22, 0, C + 26);
  c.fill();
  shadeClip(c, body, C - 22, C + 26);
  body(); ink(c, 3.2);
  c.strokeStyle = 'rgba(60, 20, 120, 0.35)';
  c.lineWidth = 1.8;
  for (const y of [C + 10, C + 17]) { c.beginPath(); c.moveTo(C - 8, y); c.quadraticCurveTo(C, y + 3, C + 8, y); c.stroke(); }
  face(c, C, C - 9, 0.6, ek);
}
function snail(c) {
  glow(c, 'rgba(255, 230, 160, 0.55)');
  // body
  const body = () => {
    c.beginPath();
    c.moveTo(C + 36, C + 30);
    c.quadraticCurveTo(C + 10, C + 34, C - 22, C + 30);
    c.quadraticCurveTo(C - 36, C + 28, C - 34, C + 8);
    c.quadraticCurveTo(C - 33, C - 6, C - 24, C - 6);
    c.quadraticCurveTo(C - 14, C - 6, C - 14, C + 10);
    c.quadraticCurveTo(C + 10, C + 18, C + 36, C + 30);
    c.closePath();
  };
  // eye stalks
  for (const [x, y] of [[C - 30, C - 22], [C - 18, C - 24]]) {
    c.beginPath(); c.moveTo(C - 24, C - 4); c.lineTo(x, y);
    c.strokeStyle = INK; c.lineWidth = 6; c.lineCap = 'round'; c.stroke();
    c.strokeStyle = '#d8f59a'; c.lineWidth = 2.6; c.stroke();
    c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fillStyle = '#d8f59a'; c.fill(); ink(c, 2);
  }
  body();
  c.fillStyle = fillFor(c, { light: '#f2ffc9', mid: '#d0f08a', dark: '#9cd65a' }, 0, C - 6, 0, C + 32);
  c.fill(); ink(c, 3.2);
  // shell
  c.beginPath(); c.arc(C + 8, C + 2, 23, 0, TAU);
  c.fillStyle = fillFor(c, { light: '#ffe0b0', mid: '#ffa64d', dark: '#e0661a' }, 0, C - 21, 0, C + 25);
  c.fill(); ink(c, 3.4);
  c.beginPath();
  for (let i = 0; i <= 40; i++) {
    const a = i * 0.32;
    const r = 2 + i * 0.42;
    const x = C + 8 + Math.cos(a) * r;
    const y = C + 2 + Math.sin(a) * r;
    if (i) c.lineTo(x, y); else c.moveTo(x, y);
  }
  c.strokeStyle = 'rgba(140, 60, 10, 0.75)'; c.lineWidth = 2.6; c.stroke();
  shine(c, C, C - 13, 5, 2.4, -0.5);
  // sleepy face on the head
  eyes(c, C - 24, C + 6, 4.6, 2.2, 'closed');
  cheeks(c, C - 24, C + 11, 8, 2.6);
  smile(c, C - 24, C + 13, 3, 2, false);
  zzz(c, C + 30, C - 34, 1);
}

// ---------------------------------------------------------------------------
// Summer
// ---------------------------------------------------------------------------
function leafy(c, x, y, a, len = 13) {
  c.save(); c.translate(x, y); c.rotate(a);
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.45, len, 0); c.quadraticCurveTo(len * 0.5, len * 0.45, 0, 0); c.closePath();
  c.fillStyle = '#5cd65c'; c.fill(); ink(c, 2.2);
  c.restore();
}
function strawberry(c, ek) {
  glow(c, 'rgba(255, 120, 140, 0.5)');
  const path = () => {
    c.beginPath();
    c.moveTo(C, C + 36);
    c.bezierCurveTo(C - 32, C + 18, C - 34, C - 20, C - 12, C - 20);
    c.quadraticCurveTo(C, C - 23, C + 12, C - 20);
    c.bezierCurveTo(C + 34, C - 20, C + 32, C + 18, C, C + 36);
    c.closePath();
  };
  path();
  c.fillStyle = fillFor(c, { light: '#ff9a9a', mid: '#ff4d5e', dark: '#d61f3c' }, 0, C - 20, 0, C + 36);
  c.fill();
  c.save(); path(); c.clip();
  c.fillStyle = '#ffe866';
  for (const [x, y] of [[-18, -6], [18, -6], [-22, 8], [22, 8], [-12, 22], [12, 22], [0, 30], [-26, -14], [26, -14]]) {
    c.beginPath(); c.ellipse(C + x, C + y, 1.6, 2.4, 0, 0, TAU); c.fill();
  }
  c.restore();
  shadeClip(c, path, C - 20, C + 36);
  path(); ink(c, 3.4);
  for (const a of [Math.PI * 0.94, Math.PI * 0.7, Math.PI * 0.3, Math.PI * 0.06]) leafy(c, C, C - 20, a, 17);
  c.beginPath(); c.moveTo(C, C - 22); c.lineTo(C + 3, C - 34);
  c.strokeStyle = INK; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#3fb35e'; c.lineWidth = 2.6; c.stroke();
  shine(c, C - 14, C - 8, 4.6, 2.4, -0.7);
  face(c, C, C + 4, 0.82, ek);
}
function cherries(c, ek) {
  glow(c, 'rgba(255, 110, 140, 0.5)');
  c.beginPath(); c.moveTo(C - 13, C + 2); c.quadraticCurveTo(C - 8, C - 22, C + 6, C - 34);
  c.moveTo(C + 15, C + 6); c.quadraticCurveTo(C + 14, C - 18, C + 6, C - 34);
  c.strokeStyle = INK; c.lineWidth = 6; c.lineCap = 'round'; c.stroke();
  c.strokeStyle = '#3fb35e'; c.lineWidth = 2.8; c.stroke();
  leafy(c, C + 6, C - 34, -0.3, 17);
  for (const [x, y, k] of [[C - 15, C + 16, ek], [C + 15, C + 20, ek === 'closed' ? 'closed' : 'open']]) {
    c.beginPath(); c.arc(x, y, 16, 0, TAU);
    c.fillStyle = fillFor(c, { light: '#ff9aa8', mid: '#ff3d5e', dark: '#c40f3a' }, 0, y - 16, 0, y + 16);
    c.fill(); ink(c, 3.2);
    shine(c, x - 6, y - 7, 3.6, 2, -0.6);
    face(c, x, y + 1, 0.56, k);
  }
}
function orange(c, ek) {
  glow(c, 'rgba(255, 180, 90, 0.55)');
  c.beginPath(); c.arc(C, C + 3, 30, 0, TAU);
  c.fillStyle = fillFor(c, { light: '#ffd9a0', mid: '#ffa64d', dark: '#ff7a1f' }, 0, C - 27, 0, C + 33);
  c.fill();
  c.fillStyle = 'rgba(200, 90, 0, 0.25)';
  for (const [x, y] of [[-14, -8], [10, -14], [16, 8], [-8, 18], [20, -2], [-20, 6], [2, 26]]) { c.beginPath(); c.arc(C + x, C + y, 1.3, 0, TAU); c.fill(); }
  shadeClip(c, () => { c.beginPath(); c.arc(C, C + 3, 30, 0, TAU); }, C - 27, C + 33);
  c.beginPath(); c.arc(C, C + 3, 30, 0, TAU); ink(c, 3.4);
  c.beginPath(); c.moveTo(C, C - 26); c.lineTo(C + 1, C - 32);
  c.strokeStyle = INK; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#8a5a35'; c.lineWidth = 2.6; c.stroke();
  leafy(c, C + 1, C - 30, -0.4, 18);
  shine(c, C - 13, C - 12, 5, 2.6, -0.7);
  face(c, C, C + 5, 0.9, ek);
}
function melon(c, ek) {
  glow(c, 'rgba(255, 130, 150, 0.5)');
  const cy = C - 14;
  c.beginPath(); c.arc(C, cy, 36, 0, Math.PI); c.closePath();
  c.fillStyle = fillFor(c, { light: '#9ff28a', mid: '#3fc95a', dark: '#1f8f45' }, 0, cy, 0, cy + 36);
  c.fill(); ink(c, 3.4);
  c.beginPath(); c.arc(C, cy + 1, 29, 0, Math.PI); c.closePath();
  c.fillStyle = '#ffffff'; c.fill();
  c.beginPath(); c.arc(C, cy + 1, 26, 0, Math.PI); c.closePath();
  c.fillStyle = fillFor(c, { light: '#ffb3b3', mid: '#ff5f6d', dark: '#e6334f' }, 0, cy, 0, cy + 28);
  c.fill();
  c.fillStyle = INK;
  for (const [x, y] of [[-17, 6], [17, 6], [-10, 16], [10, 16], [0, 21]]) {
    c.beginPath(); c.ellipse(C + x, cy + y, 1.6, 2.6, x * 0.03, 0, TAU); c.fill();
  }
  c.beginPath(); c.moveTo(C - 36, cy); c.lineTo(C + 36, cy); ink(c, 3.4);
  face(c, C, cy + 6, 0.62, ek);
}
const FLY = { light: '#e6dcff', mid: '#a68bff', dark: '#7255e6' };
function firefly(c, ek) {
  const g = c.createRadialGradient(C, C + 14, 4, C, C + 14, 46);
  g.addColorStop(0, 'rgba(240, 255, 150, 0.95)');
  g.addColorStop(0.35, 'rgba(220, 255, 120, 0.45)');
  g.addColorStop(1, 'rgba(220, 255, 120, 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, STAR_BOX, STAR_BOX);
  for (const s of [-1, 1]) {
    c.beginPath(); c.ellipse(C + s * 15, C - 18, 11, 17, s * 0.6, 0, TAU);
    c.fillStyle = 'rgba(225, 245, 255, 0.85)'; c.fill(); ink(c, 2.4);
  }
  c.beginPath(); c.ellipse(C, C + 16, 14, 14, 0, 0, TAU);
  c.fillStyle = fillFor(c, { light: '#ffffe0', mid: '#f4ff8a', dark: '#c8f04a' }, 0, C + 2, 0, C + 30);
  c.fill(); ink(c, 3);
  c.beginPath(); c.ellipse(C, C - 4, 17, 16, 0, 0, TAU);
  c.fillStyle = fillFor(c, FLY, 0, C - 20, 0, C + 12);
  c.fill();
  shadeClip(c, () => { c.beginPath(); c.ellipse(C, C - 4, 17, 16, 0, 0, TAU); }, C - 20, C + 12);
  c.beginPath(); c.ellipse(C, C - 4, 17, 16, 0, 0, TAU); ink(c, 3.2);
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(C + s * 5, C - 18); c.quadraticCurveTo(C + s * 8, C - 30, C + s * 15, C - 32);
    c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
    c.beginPath(); c.arc(C + s * 15, C - 32, 3, 0, TAU); c.fillStyle = INK; c.fill();
  }
  shine(c, C - 7, C - 13, 4, 2, -0.5);
  face(c, C, C - 4, 0.7, ek);
}
function starFruit(c, ek) {
  glow(c, 'rgba(255, 250, 200, 0.9)');
  const path = () => softStarPath(c, C, C + 1, 35, 22);
  path();
  c.fillStyle = fillFor(c, GOLD, 0, C - 35, 0, C + 35);
  c.fill();
  c.strokeStyle = 'rgba(220, 150, 0, 0.55)';
  c.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 5;
    c.beginPath(); c.moveTo(C + Math.cos(a) * 13, C + 1 + Math.sin(a) * 13); c.lineTo(C + Math.cos(a) * 28, C + 1 + Math.sin(a) * 28); c.stroke();
  }
  shadeClip(c, path, C - 35, C + 35);
  path(); ink(c, 3.6);
  shine(c, C - 9, C - 13, 6, 3.2, -0.6);
  face(c, C, C + 3, 1, ek);
}
function beachBall(c, ek) {
  glow(c, 'rgba(255,255,255,0.8)');
  const R = 31;
  c.save();
  c.beginPath(); c.arc(C, C, R, 0, TAU); c.clip();
  for (let i = 0; i < 6; i++) {
    c.beginPath(); c.moveTo(C, C - 4);
    c.arc(C, C - 4, R * 1.6, -Math.PI / 2 + (i - 0.5) * (TAU / 6), -Math.PI / 2 + (i + 0.5) * (TAU / 6));
    c.closePath();
    c.fillStyle = RAINBOW[i];
    c.fill();
  }
  c.beginPath(); c.ellipse(C, C - 18, 9, 6, 0, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
  const sh = c.createRadialGradient(C - 10, C - 14, 4, C, C, R);
  sh.addColorStop(0, 'rgba(255,255,255,0.45)');
  sh.addColorStop(0.6, 'rgba(255,255,255,0)');
  sh.addColorStop(1, 'rgba(60,0,80,0.22)');
  c.fillStyle = sh;
  c.fillRect(0, 0, STAR_BOX, STAR_BOX);
  c.restore();
  c.beginPath(); c.arc(C, C, R, 0, TAU); ink(c, 3.6);
  c.beginPath(); c.ellipse(C, C + 9, 15, 11, 0, 0, TAU);
  c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill();
  face(c, C, C + 6, 0.78, ek);
}
function sleepySun(c) {
  glow(c, 'rgba(255, 210, 90, 0.7)', 12);
  c.fillStyle = '#ffb21f';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    c.beginPath();
    c.moveTo(C + Math.cos(a - 0.2) * 24, C + Math.sin(a - 0.2) * 24);
    c.lineTo(C + Math.cos(a) * 37, C + Math.sin(a) * 37);
    c.lineTo(C + Math.cos(a + 0.2) * 24, C + Math.sin(a + 0.2) * 24);
    c.closePath();
    c.fill(); ink(c, 2.4);
  }
  c.beginPath(); c.arc(C, C, 26, 0, TAU);
  c.fillStyle = fillFor(c, { light: '#fff6b8', mid: '#ffd93b', dark: '#ff9a2e' }, 0, C - 26, 0, C + 26);
  c.fill(); ink(c, 3.4);
  shine(c, C - 10, C - 13, 5, 2.6, -0.6);
  face(c, C, C + 1, 1, 'closed');
  zzz(c, C + 26, C - 40, 1);
}
function waterBalloon(c) {
  const x = DROP_W / 2;
  c.beginPath(); c.moveTo(x, 9); c.quadraticCurveTo(x + 6, 4, x + 3, 1);
  c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  c.beginPath(); c.moveTo(x - 3, 11); c.lineTo(x, 7); c.lineTo(x + 3, 11); c.closePath();
  c.fillStyle = '#ff7ac6'; c.fill(); ink(c, 2);
  c.beginPath(); c.ellipse(x, 22, 10.5, 12, 0, 0, TAU);
  const g = c.createLinearGradient(0, 10, 0, 34);
  g.addColorStop(0, '#ffd6f0');
  g.addColorStop(1, '#ff5fa8');
  c.fillStyle = g;
  c.fill(); ink(c, 2.6);
  c.fillStyle = 'rgba(255,255,255,0.9)';
  c.beginPath(); c.ellipse(x - 4, 18, 2.4, 4, 0.4, 0, TAU); c.fill();
}

// ---------------------------------------------------------------------------
// Sprite sets
// ---------------------------------------------------------------------------
const box = (draw) => splitGlow(makeSprite(STAR_BOX, STAR_BOX, draw, RES), STAR_BOX, STAR_BOX, RES, draw);
/** open + blink frames for a face drawn by fn(c, eyesKind). */
function look(fn, pop, motion) {
  return { open: box((c) => fn(c, 'open')), blink: box((c) => fn(c, 'closed')), pop, motion: motion || 'fall' };
}
function single(fn) { const s = box((c) => fn(c, 'happy')); return { open: s, blink: s }; }
const clouds = (top, bottom) => ({
  calm: makeSprite(CLOUD_W, CLOUD_H, (c) => cloudBody(c, top, bottom, 'calm'), 2.5),
  puff: makeSprite(CLOUD_W, CLOUD_H, (c) => cloudBody(c, top, bottom, 'puff'), 2.5),
});
const dropSprite = (fn) => makeSprite(DROP_W, DROP_H, fn, RES);
const basketOverlay = (fn) => makeSprite(BASKET_W, BASKET_H, fn, 2.5);

const PAL = {
  ice: { light: '#ffffff', mid: '#e3f4ff', dark: '#9fd0ff', pop: '#d6f4ff' },
  blue: { light: '#e6f8ff', mid: '#8fd8ff', dark: '#3d9bff', pop: '#8fd8ff' },
  lilac: { light: '#f3eaff', mid: '#cdb0ff', dark: '#9d6bff', pop: '#cdb0ff' },
  pink: { light: '#ffe6f4', mid: '#ffb3dd', dark: '#ff6fbf', pop: '#ff9ad6' },
  mint: { light: '#eafff6', mid: '#a6f2d4', dark: '#3fc9a0', pop: '#a6ffe0' },
  leafOrange: { light: '#ffd9a0', mid: '#ff9a2e', dark: '#e0601a', pop: '#ffb35c' },
  leafRed: { light: '#ffb0a0', mid: '#ff5a4a', dark: '#c8282e', pop: '#ff8a7a' },
  leafYellow: { light: '#fff6b8', mid: '#ffd93b', dark: '#f0a01f', pop: '#ffe866' },
  leafRust: { light: '#ffc7a0', mid: '#e8763a', dark: '#a8461e', pop: '#ff9a5c' },
  blossom: { light: '#fff0f8', mid: '#ffc2e2', dark: '#ff8ac6', pop: '#ffb3dd' },
  peach: { light: '#fff2e6', mid: '#ffcfa8', dark: '#ff9a6b', pop: '#ffc7a0' },
  daisy: { light: '#ffffff', mid: '#fdf6ff', dark: '#e0d0f0', pop: '#ffffff' },
  wingYellow: { light: '#fffbd0', mid: '#ffe14a', dark: '#ffa41f', pop: '#ffe866' },
  wingBlue: { light: '#e0f8ff', mid: '#6fd0ff', dark: '#2f7cff', pop: '#8fd8ff' },
  wingPink: { light: '#ffe0f2', mid: '#ff8ad0', dark: '#e0409e', pop: '#ff9ad6' },
};

/** Everything a season needs, built on first use. */
const cache = {};
export function buildSeason(id) {
  if (cache[id]) return cache[id];
  let s;
  switch (id) {
    case 'winter':
      s = {
        looks: [PAL.ice, PAL.blue, PAL.lilac, PAL.pink, PAL.mint].map((p) => look((c, ek) => snowflake(c, p, ek), p.pop, 'flake')),
        fast: single((c, ek) => snowflake(c, GOLD, ek)), fastName: 'Golden snowflake!', fastSay: 'A golden snowflake!',
        magnet: single((c, ek) => snowflake(c, 'rainbow', ek)), magnetName: 'RAINBOW!', magnetSay: 'Rainbow snowflake!',
        slow: box(cocoa), slowName: 'Cozy cocoa...', slowSay: 'Hot cocoa. Slooow!', slowChip: '☕ Slow',
        clouds: clouds('#ffffff', '#b2c2e8'), drop: dropSprite(snowClump), dropTint: ['#ffffff', '#d6ecff'],
        overlay: basketOverlay(snowCap), hazardWords: ['Brrr!', 'Snowy!', 'Poof!', 'Chilly!'], hazardSay: ['Brrr! Snowy basket!', 'Poof! Snow!', 'Chilly!'],
        hazardSound: 'snow', catchSound: 'ice',
      };
      break;
    case 'autumn':
      s = {
        looks: [
          look((c, ek) => maple(c, PAL.leafRed, ek), PAL.leafRed.pop, 'leaf'),
          look((c, ek) => leaf(c, PAL.leafOrange, ek), PAL.leafOrange.pop, 'leaf'),
          look((c, ek) => leaf(c, PAL.leafYellow, ek), PAL.leafYellow.pop, 'leaf'),
          look((c, ek) => maple(c, PAL.leafRust, ek), PAL.leafRust.pop, 'leaf'),
          look((c, ek) => acorn(c, null, ek), '#e9a85c', 'acorn'),
        ],
        fast: single((c, ek) => maple(c, GOLD, ek)), fastName: 'Golden leaf!', fastSay: 'A golden leaf!',
        magnet: single((c, ek) => maple(c, 'rainbow', ek)), magnetName: 'RAINBOW!', magnetSay: 'Rainbow leaf!',
        slow: box(pumpkin), slowName: 'Sleepy pumpkin...', slowSay: 'Sleepy pumpkin. Slooow!', slowChip: '🎃 Slow',
        clouds: clouds('#f2e9e0', '#a39488'), drop: dropSprite(mudDrop), dropTint: ['#c08a5a', '#8a5a2e'],
        overlay: basketOverlay(mudSplats), hazardWords: ['Splat!', 'Muddy!', 'Squish!', 'Oopsy!'], hazardSay: ['Splat! A muddy basket!', 'Squish squish!', 'Muddy!'],
        hazardSound: 'mud', catchSound: 'wood',
      };
      break;
    case 'spring':
      s = {
        looks: [
          look((c, ek) => blossom(c, PAL.blossom, ek), PAL.blossom.pop, 'petal'),
          look((c, ek) => daisy(c, PAL.daisy, ek), '#ffffff', 'petal'),
          look((c, ek) => blossom(c, PAL.peach, ek), PAL.peach.pop, 'petal'),
          { open: box((c) => butterfly(c, PAL.wingYellow, 'open', 1)), blink: box((c) => butterfly(c, PAL.wingYellow, 'open', 0.42)), pop: PAL.wingYellow.pop, motion: 'flutter' },
          { open: box((c) => butterfly(c, PAL.wingBlue, 'open', 1)), blink: box((c) => butterfly(c, PAL.wingBlue, 'open', 0.42)), pop: PAL.wingBlue.pop, motion: 'flutter' },
          { open: box((c) => butterfly(c, PAL.wingPink, 'open', 1)), blink: box((c) => butterfly(c, PAL.wingPink, 'open', 0.42)), pop: PAL.wingPink.pop, motion: 'flutter' },
        ],
        fast: { open: box((c) => butterfly(c, GOLD, 'happy', 1)), blink: box((c) => butterfly(c, GOLD, 'happy', 0.42)), flap: true },
        fastName: 'Golden butterfly!', fastSay: 'A golden butterfly!',
        magnet: { open: box((c) => butterfly(c, 'rainbow', 'happy', 1)), blink: box((c) => butterfly(c, 'rainbow', 'happy', 0.42)), flap: true },
        magnetName: 'RAINBOW!', magnetSay: 'Rainbow butterfly!',
        slow: box(snail), slowName: 'Slooow snail...', slowSay: 'A sleepy snail. Slooow!', slowChip: '🐌 Slow',
        clouds: clouds('#ffffff', '#a8c8ee'), drop: null, dropTint: ['#9fdcff', '#5cb8ff'],
        overlay: null, hazardWords: ['Puddle splash!', 'Splish!', 'Drip drop!'], hazardSay: ['Puddle splash!', 'Splish splash!', 'Spring rain!'],
        hazardSound: 'splish', catchSound: 'flute',
      };
      break;
    case 'summer':
      s = {
        looks: [
          look((c, ek) => strawberry(c, ek), '#ff6b7d'),
          look((c, ek) => orange(c, ek), '#ffa64d'),
          look((c, ek) => melon(c, ek), '#ff5f6d'),
          look((c, ek) => cherries(c, ek), '#ff3d5e'),
          look((c, ek) => firefly(c, ek), '#f4ff8a', 'firefly'),
          look((c, ek) => firefly(c, ek), '#f4ff8a', 'firefly'),
        ],
        fast: single((c, ek) => starFruit(c, ek)), fastName: 'Star fruit!', fastSay: 'A golden star fruit!',
        magnet: single((c, ek) => beachBall(c, ek)), magnetName: 'BEACH BALL!', magnetSay: 'Rainbow beach ball!',
        slow: box(sleepySun), slowName: 'Sleepy sun...', slowSay: 'The sleepy sun. Slooow!', slowChip: '🌅 Slow',
        clouds: clouds('#ffe6f2', '#d39ad0'), drop: dropSprite(waterBalloon), dropTint: ['#ff9ad6', '#9fdcff'],
        overlay: null, hazardWords: ['Sploosh!', 'Splash!', 'Water balloon!'], hazardSay: ['Sploosh! A water balloon!', 'Splash!', 'So refreshing!'],
        hazardSound: 'balloon', catchSound: 'marimba',
      };
      break;
    default:
      s = null;
  }
  cache[id] = s;
  return s;
}

// Extra decorations for the skies: a rainbow after spring showers, a wind curl.
export const RAINBOW_ARC = makeSprite(300, 156, (c) => {
  RAINBOW.forEach((col, i) => {
    c.beginPath();
    c.arc(150, 156, 146 - i * 9, Math.PI, TAU);
    c.strokeStyle = hexA(col, 0.6);
    c.lineWidth = 9.5;
    c.stroke();
  });
}, 1.5);
export const WIND = makeSprite(150, 50, (c) => {
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.lineCap = 'round';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(4, 30);
  c.bezierCurveTo(40, 18, 70, 42, 104, 28);
  c.bezierCurveTo(128, 18, 140, 30, 132, 38);
  c.bezierCurveTo(124, 46, 112, 36, 120, 30);
  c.stroke();
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(24, 42); c.bezierCurveTo(50, 36, 70, 46, 92, 40); c.stroke();
}, 2);

// ---------------------------------------------------------------------------
// Backdrops (painted once into a cached canvas). Each returns the ground line.
// ---------------------------------------------------------------------------
function vgrad(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
}
function hillY(x, base, u, amp, f, ph) { return base - Math.sin(x / (f * u) + ph) * amp * u - Math.sin(x / (f * 0.39 * u)) * amp * 0.25 * u; }
function hill(c, w, h, base, u, amp, f, ph, fill, line) {
  c.beginPath();
  c.moveTo(0, h);
  for (let x = 0; x <= w + 10; x += 10) c.lineTo(x, hillY(x, base, u, amp, f, ph));
  c.lineTo(w, h);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (line) {
    c.strokeStyle = line;
    c.lineWidth = 2.5 * u;
    c.beginPath();
    for (let x = 0; x <= w + 10; x += 10) {
      const y = hillY(x, base, u, amp, f, ph);
      if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
  }
}
function groundLine(c, w, h, groundY, u, fill, line) {
  hill(c, w, h, groundY, u, 7, 160, 0, fill, line);
}
function softCloud(c, x, y, s, col) {
  c.fillStyle = col;
  for (const [dx, dy, r] of [[-26, 4, 16], [-8, -6, 20], [14, -4, 18], [30, 6, 13], [2, 8, 15]]) {
    c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, TAU); c.fill();
  }
}
function house(c, x, base, s, wall, roof, snow) {
  c.lineJoin = 'round';
  c.fillStyle = wall;
  c.fillRect(x - 15 * s, base - 22 * s, 30 * s, 22 * s);
  c.strokeStyle = INK;
  c.lineWidth = 2 * s;
  c.strokeRect(x - 15 * s, base - 22 * s, 30 * s, 22 * s);
  c.beginPath(); c.moveTo(x - 20 * s, base - 20 * s); c.lineTo(x, base - 38 * s); c.lineTo(x + 20 * s, base - 20 * s); c.closePath();
  c.fillStyle = roof; c.fill(); c.stroke();
  if (snow) {
    c.beginPath(); c.moveTo(x - 21 * s, base - 19 * s); c.lineTo(x, base - 39 * s); c.lineTo(x + 21 * s, base - 19 * s);
    c.quadraticCurveTo(x + 14 * s, base - 22 * s, x + 10 * s, base - 21 * s);
    c.quadraticCurveTo(x, base - 27 * s, x - 10 * s, base - 21 * s);
    c.quadraticCurveTo(x - 15 * s, base - 22 * s, x - 21 * s, base - 19 * s);
    c.closePath();
    c.fillStyle = '#ffffff'; c.fill(); c.stroke();
  }
  c.fillStyle = '#ffd56b';
  c.fillRect(x - 9 * s, base - 16 * s, 7 * s, 7 * s);
  c.fillRect(x + 2 * s, base - 16 * s, 7 * s, 7 * s);
  c.strokeRect(x - 9 * s, base - 16 * s, 7 * s, 7 * s);
  c.strokeRect(x + 2 * s, base - 16 * s, 7 * s, 7 * s);
  const wg = c.createRadialGradient(x, base - 12 * s, 0, x, base - 12 * s, 26 * s);
  wg.addColorStop(0, 'rgba(255, 213, 107, 0.3)');
  wg.addColorStop(1, 'rgba(255, 213, 107, 0)');
  c.fillStyle = wg;
  c.fillRect(x - 30 * s, base - 40 * s, 60 * s, 60 * s);
}
function pine(c, x, base, s, snow) {
  c.fillStyle = '#7a5230';
  c.fillRect(x - 2.5 * s, base - 8 * s, 5 * s, 8 * s);
  for (let i = 0; i < 3; i++) {
    const y = base - 8 * s - i * 12 * s;
    const hw = (17 - i * 4) * s;
    c.beginPath(); c.moveTo(x - hw, y); c.lineTo(x, y - 20 * s); c.lineTo(x + hw, y); c.closePath();
    c.fillStyle = i % 2 ? '#2f9e6a' : '#27875a';
    c.fill();
    if (snow) {
      c.beginPath(); c.moveTo(x - hw * 0.55, y - 9 * s); c.lineTo(x, y - 20 * s); c.lineTo(x + hw * 0.55, y - 9 * s);
      c.quadraticCurveTo(x, y - 13 * s, x - hw * 0.55, y - 9 * s);
      c.fillStyle = '#ffffff'; c.fill();
    }
  }
}
function roundTree(c, x, base, r, trunk, leaves, light) {
  c.fillStyle = trunk;
  c.fillRect(x - r * 0.14, base - r * 1.2, r * 0.28, r * 1.2);
  c.fillStyle = leaves;
  c.beginPath(); c.arc(x, base - r * 1.5, r, 0, TAU); c.fill();
  c.fillStyle = light;
  c.beginPath(); c.arc(x - r * 0.35, base - r * 1.8, r * 0.38, 0, TAU); c.fill();
}

function paintSnowman(c, x, base, s) {
  const ball = (y, r) => {
    c.beginPath(); c.arc(x, y, r, 0, TAU);
    c.fillStyle = vgrad(c, y - r, y + r, [[0, '#ffffff'], [1, '#cfe0f7']]);
    c.fill();
    c.lineWidth = 2.6 * s; c.strokeStyle = INK; c.stroke();
  };
  // arms
  c.strokeStyle = '#7a5230'; c.lineWidth = 3 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - 14 * s, base - 40 * s); c.lineTo(x - 32 * s, base - 54 * s); c.moveTo(x - 27 * s, base - 50 * s); c.lineTo(x - 31 * s, base - 44 * s); c.stroke();
  c.beginPath(); c.moveTo(x + 14 * s, base - 40 * s); c.lineTo(x + 32 * s, base - 56 * s); c.moveTo(x + 27 * s, base - 52 * s); c.lineTo(x + 34 * s, base - 50 * s); c.stroke();
  ball(base - 17 * s, 19 * s);
  ball(base - 44 * s, 14 * s);
  ball(base - 66 * s, 11 * s);
  // buttons
  c.fillStyle = INK;
  for (const y of [-48, -40]) { c.beginPath(); c.arc(x, base + y * s, 1.8 * s, 0, TAU); c.fill(); }
  // scarf
  c.fillStyle = '#ff5f7a';
  c.beginPath(); c.ellipse(x, base - 56 * s, 12 * s, 4 * s, 0, 0, TAU); c.fill(); c.lineWidth = 2 * s; c.stroke();
  c.beginPath(); c.moveTo(x + 4 * s, base - 55 * s); c.lineTo(x + 10 * s, base - 42 * s); c.lineTo(x + 4 * s, base - 41 * s); c.lineTo(x, base - 54 * s); c.closePath(); c.fill(); c.stroke();
  // face
  c.beginPath(); c.arc(x - 4 * s, base - 69 * s, 1.8 * s, 0, TAU); c.arc(x + 4 * s, base - 69 * s, 1.8 * s, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(x, base - 66 * s); c.lineTo(x + 11 * s, base - 64 * s); c.lineTo(x, base - 63 * s); c.closePath();
  c.fillStyle = '#ff8a1f'; c.fill(); c.lineWidth = 1.4 * s; c.stroke();
  c.fillStyle = 'rgba(255, 110, 150, 0.5)';
  c.beginPath(); c.ellipse(x - 7 * s, base - 64 * s, 2.6 * s, 1.6 * s, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(x + 7 * s, base - 63 * s, 2.6 * s, 1.6 * s, 0, 0, TAU); c.fill();
  c.lineWidth = 1.6 * s; c.strokeStyle = INK;
  c.beginPath(); c.arc(x, base - 64 * s, 4 * s, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke();
  // hat
  c.fillStyle = '#3d3a6b';
  c.fillRect(x - 13 * s, base - 78 * s, 26 * s, 4 * s);
  c.fillRect(x - 8 * s, base - 92 * s, 16 * s, 15 * s);
  c.lineWidth = 2 * s;
  c.strokeRect(x - 13 * s, base - 78 * s, 26 * s, 4 * s);
  c.strokeRect(x - 8 * s, base - 92 * s, 16 * s, 15 * s);
  c.fillStyle = '#ff5f7a';
  c.fillRect(x - 8 * s, base - 81 * s, 16 * s, 3 * s);
}

function skyStars(c, w, h, R, n, maxY, u, alpha) {
  for (let i = 0; i < n; i++) {
    c.globalAlpha = (0.35 + R() * 0.65) * alpha;
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(R() * w, R() * maxY, (0.5 + R() * 1.2) * u, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
}

export const SKY_COLORS = {
  winter: ['#6aa6ec', '#9cc4f5', '#d6e6fb'],
  autumn: ['#7fc6f5', '#ffd7a0', '#ffb36b'],
  spring: ['#6fcaff', '#a8e4ff', '#d9f6ff'],
  summer: ['#2e2470', '#a64a9e', '#ff9a6b'],
};

function paintWinter(c, w, h) {
  const R = rng(11);
  const u = Math.min(w, h) / 400;
  const groundY = h - Math.max(46 * u, h * 0.075);
  c.fillStyle = vgrad(c, 0, groundY, [[0, '#6aa6ec'], [0.6, '#9cc4f5'], [1, '#e3edfc']]);
  c.fillRect(0, 0, w, h);
  // a pale moon-like sun and soft clouds
  const g = c.createRadialGradient(w * 0.2, h * 0.14, 0, w * 0.2, h * 0.14, 90 * u);
  g.addColorStop(0, 'rgba(255,255,255,0.8)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h * 0.4);
  for (let i = 0; i < 4; i++) softCloud(c, R() * w, (0.08 + R() * 0.25) * h, (0.9 + R() * 0.8) * u, 'rgba(255,255,255,0.45)');
  // snow already in the air
  for (let i = 0; i < Math.round((w * h) / 3000); i++) {
    c.globalAlpha = 0.4 + R() * 0.5;
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(R() * w, R() * groundY, (0.8 + R() * 1.6) * u, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
  // far hills with pines and houses
  hill(c, w, h, groundY - 50 * u, u, 22, 120, 1, '#d9e7fb');
  const trees = Math.max(3, Math.round(w / (60 * u)));
  for (let i = 0; i < trees; i++) {
    const x = ((i + R()) / trees) * w;
    pine(c, x, hillY(x, groundY - 46 * u, u, 22, 120, 1), (0.7 + R() * 0.4) * u, true);
  }
  const houses = Math.max(2, Math.round(w / (190 * u)));
  const walls = ['#ff8a8a', '#8fc8ff', '#ffd36b', '#b9a3ff'];
  for (let i = 0; i < houses; i++) {
    const x = ((i + 0.3 + R() * 0.4) / houses) * w;
    house(c, x, hillY(x, groundY - 40 * u, u, 22, 120, 1), (0.85 + R() * 0.3) * u, walls[i % walls.length], '#c2546b', true);
  }
  hill(c, w, h, groundY - 18 * u, u, 10, 200, 3, '#eaf2fd');
  // the snowman (off to the side, so the basket walks in front of him)
  paintSnowman(c, w - Math.max(46 * u, w * 0.1), groundY + 6 * u, 1.05 * u);
  // the near snowy ground
  groundLine(c, w, h, groundY, u, vgrad(c, groundY - 10 * u, h, [[0, '#ffffff'], [1, '#d3e3f8']]), 'rgba(140, 180, 235, 0.7)');
  for (let i = 0; i < Math.round(w / (30 * u)); i++) {
    const x = R() * w;
    const y = groundY + 8 * u + R() * (h - groundY - 12 * u);
    c.globalAlpha = 0.8;
    c.fillStyle = R() < 0.5 ? '#bcd6f5' : '#ffffff';
    starPath(c, x, y, 3 * u, 0.8 * u, 4, 0);
    c.fill();
  }
  c.globalAlpha = 1;
  return groundY;
}

function paintAutumn(c, w, h) {
  const R = rng(23);
  const u = Math.min(w, h) / 400;
  const groundY = h - Math.max(46 * u, h * 0.075);
  c.fillStyle = vgrad(c, 0, groundY, [[0, '#7fc6f5'], [0.55, '#ffe1b0'], [1, '#ffb878']]);
  c.fillRect(0, 0, w, h);
  // a warm sun low in the sky
  const sx = w * 0.78;
  const sy = groundY - 120 * u;
  const g = c.createRadialGradient(sx, sy, 0, sx, sy, 140 * u);
  g.addColorStop(0, 'rgba(255, 240, 180, 0.9)');
  g.addColorStop(0.3, 'rgba(255, 210, 120, 0.4)');
  g.addColorStop(1, 'rgba(255, 210, 120, 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffe48a';
  c.beginPath(); c.arc(sx, sy, 26 * u, 0, TAU); c.fill();
  for (let i = 0; i < 3; i++) softCloud(c, R() * w, (0.08 + R() * 0.2) * h, (0.8 + R() * 0.7) * u, 'rgba(255, 250, 240, 0.6)');
  // far golden hills with a barn and lollipop trees
  hill(c, w, h, groundY - 56 * u, u, 20, 130, 0.5, '#f0c070');
  const bx = w * 0.28;
  const bb = hillY(bx, groundY - 52 * u, u, 20, 130, 0.5);
  const s = u * 0.9;
  c.fillStyle = '#e0483e';
  c.fillRect(bx - 18 * s, bb - 24 * s, 36 * s, 26 * s);
  c.beginPath(); c.moveTo(bx - 22 * s, bb - 22 * s); c.lineTo(bx, bb - 40 * s); c.lineTo(bx + 22 * s, bb - 22 * s); c.closePath();
  c.fillStyle = '#b8323a'; c.fill();
  c.strokeStyle = '#ffffff'; c.lineWidth = 2 * s;
  c.strokeRect(bx - 7 * s, bb - 14 * s, 14 * s, 16 * s);
  c.beginPath(); c.moveTo(bx - 7 * s, bb - 14 * s); c.lineTo(bx + 7 * s, bb + 2 * s); c.moveTo(bx + 7 * s, bb - 14 * s); c.lineTo(bx - 7 * s, bb + 2 * s); c.stroke();
  const tcols = [['#ff7a2e', '#ffb36b'], ['#e8453a', '#ff8a7a'], ['#ffc21f', '#ffe48a'], ['#d9602a', '#ff9a5c']];
  const trees = Math.max(4, Math.round(w / (55 * u)));
  for (let i = 0; i < trees; i++) {
    const x = ((i + R()) / trees) * w;
    if (Math.abs(x - bx) < 30 * u) continue;
    const col = tcols[Math.floor(R() * tcols.length)];
    roundTree(c, x, hillY(x, groundY - 50 * u, u, 20, 130, 0.5), (10 + R() * 7) * u, '#8a5a35', col[0], col[1]);
  }
  hill(c, w, h, groundY - 20 * u, u, 9, 190, 2, '#d8b05a');
  // big trees in front
  for (const [fx, r] of [[0.06, 34], [0.94, 30]]) {
    const x = fx * w;
    c.fillStyle = '#7a4a2a';
    c.fillRect(x - 5 * u, groundY - 52 * u, 10 * u, 56 * u);
    for (const [dx, dy, k, col] of [[-16, -64, 0.7, '#e8453a'], [14, -70, 0.75, '#ff7a2e'], [0, -86, 0.8, '#ffb21f'], [-4, -70, 0.6, '#ff9a2e']]) {
      c.fillStyle = col;
      c.beginPath(); c.arc(x + dx * u, groundY + dy * u, r * k * u, 0, TAU); c.fill();
    }
  }
  // near ground: a fence, pumpkins and fallen leaves
  groundLine(c, w, h, groundY, u, vgrad(c, groundY - 10 * u, h, [[0, '#b8b04a'], [1, '#8a7a2e']]), 'rgba(255, 240, 160, 0.5)');
  c.strokeStyle = '#a8703a';
  c.lineWidth = 4 * u;
  c.lineCap = 'round';
  const fy = groundY - 8 * u;
  c.beginPath(); c.moveTo(0, fy - 14 * u); c.lineTo(w, fy - 14 * u); c.moveTo(0, fy - 4 * u); c.lineTo(w, fy - 4 * u); c.stroke();
  for (let x = 12 * u; x < w; x += 46 * u) { c.beginPath(); c.moveTo(x, fy + 4 * u); c.lineTo(x, fy - 24 * u); c.stroke(); }
  for (const fx of [0.18, 0.72]) {
    const x = fx * w;
    const y = groundY + 6 * u;
    for (const [dx, rx] of [[-7, 9], [7, 9], [0, 10]]) {
      c.beginPath(); c.ellipse(x + dx * u, y, rx * u, 11 * u, 0, 0, TAU);
      c.fillStyle = '#ff8a1f'; c.fill(); c.lineWidth = 2 * u; c.strokeStyle = INK; c.stroke();
    }
    c.fillStyle = '#5a8a2a'; c.fillRect(x - 1.5 * u, y - 16 * u, 3 * u, 6 * u);
  }
  const lc = ['#ff7a2e', '#e8453a', '#ffc21f', '#d9602a'];
  for (let i = 0; i < Math.round(w / (14 * u)); i++) {
    const x = R() * w;
    const y = groundY + 10 * u + R() * (h - groundY - 12 * u);
    c.fillStyle = lc[i % lc.length];
    c.beginPath(); c.ellipse(x, y, 4 * u, 2.2 * u, R() * 3, 0, TAU); c.fill();
  }
  return groundY;
}

function paintSpring(c, w, h) {
  const R = rng(37);
  const u = Math.min(w, h) / 400;
  const groundY = h - Math.max(46 * u, h * 0.075);
  c.fillStyle = vgrad(c, 0, groundY, [[0, '#6fcaff'], [0.6, '#a8e4ff'], [1, '#e3f9ff']]);
  c.fillRect(0, 0, w, h);
  // the sun
  const sx = w * 0.16;
  const sy = Math.max(110 * u, h * 0.16);
  const g = c.createRadialGradient(sx, sy, 0, sx, sy, 90 * u);
  g.addColorStop(0, 'rgba(255, 250, 200, 0.9)');
  g.addColorStop(1, 'rgba(255, 250, 200, 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h * 0.5);
  for (let i = 0; i < 5; i++) softCloud(c, R() * w, (0.1 + R() * 0.3) * h, (0.9 + R() * 0.9) * u, 'rgba(255,255,255,0.75)');
  hill(c, w, h, groundY - 52 * u, u, 22, 110, 2, '#a6ec8a');
  const trees = Math.max(3, Math.round(w / (90 * u)));
  for (let i = 0; i < trees; i++) {
    const x = ((i + R()) / trees) * w;
    const pink = R() < 0.55;
    roundTree(c, x, hillY(x, groundY - 48 * u, u, 22, 110, 2), (11 + R() * 7) * u, '#8a5a35', pink ? '#ffb3d9' : '#6fd66a', pink ? '#ffe0f0' : '#a6f58a');
  }
  hill(c, w, h, groundY - 20 * u, u, 10, 170, 4, '#8fe07a');
  // little flowers on the far meadow
  for (let i = 0; i < Math.round(w / (12 * u)); i++) {
    const x = R() * w;
    const y = hillY(x, groundY - 14 * u, u, 10, 170, 4) + R() * 14 * u;
    c.fillStyle = ['#ff9ad6', '#ffffff', '#ffe866', '#c9a3ff'][i % 4];
    c.beginPath(); c.arc(x, y, 2 * u, 0, TAU); c.fill();
  }
  groundLine(c, w, h, groundY, u, vgrad(c, groundY - 10 * u, h, [[0, '#6fd66a'], [1, '#3fae55']]), 'rgba(220, 255, 200, 0.6)');
  // tulips along the edges
  const tulip = (x, y, col) => {
    c.strokeStyle = '#2f9e4d'; c.lineWidth = 3 * u; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 22 * u); c.stroke();
    c.fillStyle = '#4fc56a';
    c.beginPath(); c.ellipse(x - 5 * u, y - 8 * u, 3 * u, 8 * u, -0.5, 0, TAU); c.fill();
    c.beginPath();
    c.moveTo(x - 7 * u, y - 30 * u); c.lineTo(x - 3.5 * u, y - 25 * u); c.lineTo(x, y - 31 * u); c.lineTo(x + 3.5 * u, y - 25 * u); c.lineTo(x + 7 * u, y - 30 * u);
    c.quadraticCurveTo(x + 8 * u, y - 18 * u, x, y - 18 * u); c.quadraticCurveTo(x - 8 * u, y - 18 * u, x - 7 * u, y - 30 * u);
    c.closePath();
    c.fillStyle = col; c.fill(); c.lineWidth = 1.8 * u; c.strokeStyle = INK; c.stroke();
  };
  const tcols = ['#ff5f7a', '#ffc21f', '#ff8ad0', '#b38bff'];
  for (let i = 0; i < Math.max(4, Math.round(w / (70 * u))); i++) {
    const x = ((i + 0.2 + R() * 0.6) / Math.max(4, Math.round(w / (70 * u)))) * w;
    tulip(x, groundY + 2 * u + R() * 6 * u, tcols[i % tcols.length]);
  }
  for (let i = 0; i < Math.round(w / (25 * u)); i++) {
    const x = R() * w;
    const y = groundY + 12 * u + R() * (h - groundY - 14 * u);
    c.fillStyle = ['#ffffff', '#ffe866', '#ff9ad6'][i % 3];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU;
      c.beginPath(); c.arc(x + Math.cos(a) * 2.4 * u, y + Math.sin(a) * 2.4 * u, 1.8 * u, 0, TAU); c.fill();
    }
    c.fillStyle = '#ffb21f';
    c.beginPath(); c.arc(x, y, 1.4 * u, 0, TAU); c.fill();
  }
  return groundY;
}

function paintSummer(c, w, h) {
  const R = rng(51);
  const u = Math.min(w, h) / 400;
  const groundY = h - Math.max(46 * u, h * 0.075);
  c.fillStyle = vgrad(c, 0, groundY, [[0, '#2e2470'], [0.4, '#7a3f9e'], [0.75, '#ff7a7a'], [1, '#ffc56b']]);
  c.fillRect(0, 0, w, h);
  skyStars(c, w, h, R, Math.round((w * h) / 9000), groundY * 0.4, u, 0.9);
  // the big setting sun
  const sx = w * 0.62;
  const sy = groundY - 40 * u;
  const g = c.createRadialGradient(sx, sy, 0, sx, sy, 200 * u);
  g.addColorStop(0, 'rgba(255, 230, 140, 0.9)');
  g.addColorStop(0.25, 'rgba(255, 180, 110, 0.45)');
  g.addColorStop(1, 'rgba(255, 150, 120, 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  c.beginPath(); c.arc(sx, sy, 48 * u, 0, TAU);
  c.fillStyle = vgrad(c, sy - 48 * u, sy + 48 * u, [[0, '#fff3a0'], [1, '#ff9a3d']]);
  c.fill();
  c.strokeStyle = 'rgba(255, 240, 200, 0.5)';
  c.lineWidth = 3 * u;
  for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(sx - 60 * u, sy + i * 10 * u - 8 * u); c.lineTo(sx + 60 * u, sy + i * 10 * u - 8 * u); c.stroke(); }
  for (let i = 0; i < 3; i++) softCloud(c, R() * w, (0.25 + R() * 0.25) * h, (0.8 + R() * 0.8) * u, 'rgba(255, 170, 200, 0.35)');
  // silhouette hills with a little house and trees
  hill(c, w, h, groundY - 44 * u, u, 20, 120, 0.3, '#6a3f7a');
  const hx = w * 0.2;
  const hb = hillY(hx, groundY - 40 * u, u, 20, 120, 0.3);
  const s = u;
  c.fillStyle = '#4d2a63';
  c.fillRect(hx - 14 * s, hb - 20 * s, 28 * s, 22 * s);
  c.beginPath(); c.moveTo(hx - 18 * s, hb - 19 * s); c.lineTo(hx, hb - 34 * s); c.lineTo(hx + 18 * s, hb - 19 * s); c.closePath(); c.fill();
  c.fillStyle = '#ffd56b';
  c.fillRect(hx - 8 * s, hb - 14 * s, 6 * s, 6 * s);
  c.fillRect(hx + 2 * s, hb - 14 * s, 6 * s, 6 * s);
  const trees = Math.max(3, Math.round(w / (80 * u)));
  for (let i = 0; i < trees; i++) {
    const x = ((i + R()) / trees) * w;
    if (Math.abs(x - hx) < 26 * u) continue;
    roundTree(c, x, hillY(x, groundY - 40 * u, u, 20, 120, 0.3), (12 + R() * 8) * u, '#3d2a4a', '#4a3a6e', '#5a4a80');
  }
  hill(c, w, h, groundY - 16 * u, u, 8, 180, 2.5, '#3e4e6e');
  groundLine(c, w, h, groundY, u, vgrad(c, groundY - 10 * u, h, [[0, '#2f6a5a'], [1, '#1d4a44']]), 'rgba(255, 200, 150, 0.45)');
  // tall grass
  c.strokeStyle = '#2a5a4a';
  c.lineWidth = 2.4 * u;
  c.lineCap = 'round';
  for (let i = 0; i < Math.round(w / (9 * u)); i++) {
    const x = R() * w;
    const y = groundY + 4 * u + R() * 6 * u;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 2 * u, y - 10 * u, x + (R() - 0.5) * 10 * u, y - (12 + R() * 12) * u); c.stroke();
  }
  return groundY;
}

export function paintSeason(id, c, w, h) {
  switch (id) {
    case 'winter': return paintWinter(c, w, h);
    case 'autumn': return paintAutumn(c, w, h);
    case 'spring': return paintSpring(c, w, h);
    case 'summer': return paintSummer(c, w, h);
  }
  return h * 0.9;
}
