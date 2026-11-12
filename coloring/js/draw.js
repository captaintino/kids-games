// Free drawing on a blank page: brush strokes, the eraser and stamps, drawn on a
// <canvas>. Everything is kept as a list of small "ops" (in 400 x 400 sheet units)
// so undo can redraw the page, and the page itself is saved as a PNG.
//
//   { t: 'line', k: 'red' | 'rainbow' | 'eraser', w: 22, p: [x0, y0, x1, y1, ...] }
//   { t: 'stamp', s: 'heart', k: 'red', x, y, r, a }        (a = rotation in degrees)
import { PALETTE, INK } from '../../shared/js/pictures.js';

export const SHEET = 400;
export const PX = 1000; // canvas pixels per side
const K = PX / SHEET;

const HEX = {};
PALETTE.forEach((p) => { HEX[p.key] = p.hex; });

export const STAMPS = [
  { key: 'star', name: 'Star' },
  { key: 'heart', name: 'Heart' },
  { key: 'flower', name: 'Flower' },
  { key: 'smiley', name: 'Smiley face' },
  { key: 'paw', name: 'Paw print' },
  { key: 'butterfly', name: 'Butterfly' },
];

// ---------------------------------------------------------------------------
// Magic paints as canvas pattern tiles (the same looks as the SVG ones in art.js)
// ---------------------------------------------------------------------------
const tiles = {};

function tileCanvas(w, h = w) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return cv;
}

function hexRGB(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

// Paint a tile pixel by pixel: color(x, y) -> [r, g, b]. Two samples per axis smooth the edges.
function pixelTile(size, color) {
  const cv = tileCanvas(size);
  const c = cv.getContext('2d');
  const img = c.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const col = color(x + 0.25 + sx * 0.5, y + 0.25 + sy * 0.5);
          r += col[0]; g += col[1]; b += col[2];
        }
      }
      const i = (y * size + x) * 4;
      d[i] = r / 4; d[i + 1] = g / 4; d[i + 2] = b / 4; d[i + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  return cv;
}

function starPath(c, x, y, R, r, points = 5, rot = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 ? r : R;
    const a = rot + (i * Math.PI) / points;
    c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  c.closePath();
}

function twinklePath(c, x, y, r) {
  c.beginPath();
  c.moveTo(x, y - r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y);
  c.quadraticCurveTo(x, y, x, y - r);
  c.closePath();
}

const MAKERS = {
  rainbow() {
    const stops = ['#ff4d5e', '#ff9a2e', '#ffd93b', '#5cd65c', '#3d9bff', '#9d5cff', '#ff4d5e'].map(hexRGB);
    const size = Math.round(160 * K); // one rainbow every 160 sheet units, along the diagonal
    return pixelTile(size, (x, y) => {
      const t = (((x + y) / size) % 1) * (stops.length - 1);
      const i = Math.floor(t);
      const f = t - i;
      const a = stops[i];
      const b = stops[Math.min(stops.length - 1, i + 1)];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    });
  },
  candy() {
    const red = hexRGB('#ff4d5e');
    const white = [255, 255, 255];
    const size = Math.round(28 * K);
    return pixelTile(size, (x, y) => (((x + y) % size) < size / 2 ? red : white));
  },
  glitter() {
    const s = Math.round(36 * K);
    const cv = tileCanvas(s);
    const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#fff3a6');
    g.addColorStop(0.5, '#ffc83a');
    g.addColorStop(1, '#ffa21f');
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
    const u = s / 36;
    c.fillStyle = '#fff';
    twinklePath(c, 9 * u, 9 * u, 6 * u); c.fill();
    twinklePath(c, 27 * u, 25 * u, 4.5 * u); c.fill();
    [[26, 8, 1.8, '#ff7ac6'], [9, 27, 1.8, '#8fdcff'], [18, 17, 1.3, '#fff']].forEach(([x, y, r, col]) => {
      c.fillStyle = col;
      c.beginPath();
      c.arc(x * u, y * u, r * u, 0, Math.PI * 2);
      c.fill();
    });
    return cv;
  },
  dots() {
    const s = Math.round(24 * K);
    const cv = tileCanvas(s);
    const c = cv.getContext('2d');
    const u = s / 24;
    c.fillStyle = '#ff7ac6';
    c.fillRect(0, 0, s, s);
    c.fillStyle = '#fff';
    [[6, 6], [18, 18]].forEach(([x, y]) => {
      c.beginPath();
      c.arc(x * u, y * u, 4.5 * u, 0, Math.PI * 2);
      c.fill();
    });
    return cv;
  },
  stars() {
    const s = Math.round(40 * K);
    const cv = tileCanvas(s);
    const c = cv.getContext('2d');
    const u = s / 40;
    c.fillStyle = '#7d4dff';
    c.fillRect(0, 0, s, s);
    c.fillStyle = '#ffd93b';
    starPath(c, 10 * u, 11 * u, 7.5 * u, 3.2 * u); c.fill();
    starPath(c, 30 * u, 31 * u, 7.5 * u, 3.2 * u); c.fill();
    c.fillStyle = '#fff';
    [[31, 10], [10, 31]].forEach(([x, y]) => {
      c.beginPath();
      c.arc(x * u, y * u, 1.7 * u, 0, Math.PI * 2);
      c.fill();
    });
    return cv;
  },
};

/** Fill / stroke style for a palette or magic key on this context. */
export function styleFor(c, key) {
  if (key === 'eraser') return '#ffffff';
  if (HEX[key]) return HEX[key];
  if (!MAKERS[key]) return HEX.red;
  if (!tiles[key]) tiles[key] = MAKERS[key]();
  return c.createPattern(tiles[key], 'repeat') || HEX.red;
}

// ---------------------------------------------------------------------------
// Lines
// ---------------------------------------------------------------------------
export function beginLine(c, op) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.lineWidth = op.w * K;
  const st = styleFor(c, op.k);
  c.strokeStyle = st;
  c.fillStyle = st;
  // a tap leaves a round dot
  c.beginPath();
  c.arc(op.p[0] * K, op.p[1] * K, (op.w * K) / 2, 0, Math.PI * 2);
  c.fill();
}

/** Draw the line's segment from point index i - 1 to i (call after beginLine). */
export function lineSegment(c, op, i) {
  c.beginPath();
  c.moveTo(op.p[i * 2 - 2] * K, op.p[i * 2 - 1] * K);
  c.lineTo(op.p[i * 2] * K, op.p[i * 2 + 1] * K);
  c.stroke();
}

function drawLine(c, op) {
  beginLine(c, op);
  const n = op.p.length / 2;
  if (n < 2) return;
  c.beginPath();
  c.moveTo(op.p[0] * K, op.p[1] * K);
  for (let i = 1; i < n; i++) c.lineTo(op.p[i * 2] * K, op.p[i * 2 + 1] * K);
  c.stroke();
}

// ---------------------------------------------------------------------------
// Stamps (drawn around 0, 0 with radius R, in canvas pixels)
// ---------------------------------------------------------------------------
function ink(c, R) {
  c.strokeStyle = INK;
  c.lineWidth = Math.max(2.5, R * 0.1);
  c.lineJoin = 'round';
  c.lineCap = 'round';
}

function shine(c, x, y, rx, ry) {
  c.save();
  c.globalAlpha = 0.6;
  c.fillStyle = '#fff';
  c.translate(x, y);
  c.rotate(-0.7);
  c.scale(1, ry / rx);
  c.beginPath();
  c.arc(0, 0, rx, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function dot(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function heartPath(c, R) {
  c.beginPath();
  c.moveTo(0, R * 0.92);
  c.bezierCurveTo(-R * 1.35, -R * 0.02, -R * 0.62, -R * 1.05, 0, -R * 0.42);
  c.bezierCurveTo(R * 0.62, -R * 1.05, R * 1.35, -R * 0.02, 0, R * 0.92);
  c.closePath();
}

function face(c, R, y = 0) {
  dot(c, -R * 0.3, y - R * 0.12, R * 0.11, INK);
  dot(c, R * 0.3, y - R * 0.12, R * 0.11, INK);
  dot(c, -R * 0.33, y - R * 0.16, R * 0.04, '#fff');
  dot(c, R * 0.27, y - R * 0.16, R * 0.04, '#fff');
  c.strokeStyle = INK;
  c.lineWidth = Math.max(2, R * 0.08);
  c.beginPath();
  c.arc(0, y + R * 0.08, R * 0.26, 0.15 * Math.PI, 0.85 * Math.PI);
  c.stroke();
}

const SHAPES = {
  star(c, R, fill) {
    starPath(c, 0, R * 0.06, R, R * 0.5);
    c.fillStyle = fill;
    c.fill();
    ink(c, R);
    c.stroke();
    shine(c, -R * 0.22, -R * 0.2, R * 0.13, R * 0.07);
  },
  heart(c, R, fill) {
    heartPath(c, R);
    c.fillStyle = fill;
    c.fill();
    ink(c, R);
    c.stroke();
    shine(c, -R * 0.45, -R * 0.4, R * 0.17, R * 0.09);
  },
  flower(c, R, fill, key) {
    const petals = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      petals.push([Math.cos(a) * R * 0.56, Math.sin(a) * R * 0.56]);
    }
    c.beginPath();
    petals.forEach(([x, y]) => { c.moveTo(x + R * 0.44, y); c.arc(x, y, R * 0.44, 0, Math.PI * 2); });
    c.fillStyle = fill;
    c.fill();
    ink(c, R);
    c.stroke();
    c.beginPath();
    c.arc(0, 0, R * 0.36, 0, Math.PI * 2);
    c.fillStyle = key === 'yellow' || key === 'orange' ? HEX.pink : HEX.yellow;
    c.fill();
    c.stroke();
    shine(c, -R * 0.12, -R * 0.13, R * 0.1, R * 0.06);
  },
  smiley(c, R, fill) {
    c.beginPath();
    c.arc(0, 0, R * 0.92, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    ink(c, R);
    c.stroke();
    dot(c, -R * 0.55, R * 0.2, R * 0.13, 'rgba(255, 122, 198, .75)');
    dot(c, R * 0.55, R * 0.2, R * 0.13, 'rgba(255, 122, 198, .75)');
    face(c, R * 1.25, 0);
    shine(c, -R * 0.5, -R * 0.5, R * 0.15, R * 0.08);
  },
  paw(c, R, fill) {
    c.beginPath();
    c.moveTo(0, -R * 0.02);
    c.bezierCurveTo(R * 0.5, -R * 0.02, R * 0.66, R * 0.62, R * 0.32, R * 0.74);
    c.bezierCurveTo(R * 0.14, R * 0.8, -R * 0.14, R * 0.8, -R * 0.32, R * 0.74);
    c.bezierCurveTo(-R * 0.66, R * 0.62, -R * 0.5, -R * 0.02, 0, -R * 0.02);
    [[-0.62, -0.12, 0.2], [-0.24, -0.56, 0.22], [0.24, -0.56, 0.22], [0.62, -0.12, 0.2]].forEach(([x, y, r]) => {
      c.moveTo(x * R + r * R, y * R);
      c.arc(x * R, y * R, r * R, 0, Math.PI * 2);
    });
    c.fillStyle = fill;
    c.fill();
    ink(c, R);
    c.stroke();
  },
  butterfly(c, R, fill) {
    c.beginPath();
    [[-0.48, -0.32, 0.46, 0.38, -0.5], [0.48, -0.32, 0.46, 0.38, 0.5], [-0.36, 0.38, 0.32, 0.28, 0.6], [0.36, 0.38, 0.32, 0.28, -0.6]]
      .forEach(([x, y, rx, ry, rot]) => {
        c.save();
        c.translate(x * R, y * R);
        c.rotate(rot);
        c.scale(1, ry / rx);
        c.moveTo(rx * R, 0);
        c.arc(0, 0, rx * R, 0, Math.PI * 2);
        c.restore();
      });
    c.fillStyle = fill;
    c.fill();
    ink(c, R);
    c.stroke();
    dot(c, -0.5 * R, -0.34 * R, 0.13 * R, 'rgba(255,255,255,.7)');
    dot(c, 0.5 * R, -0.34 * R, 0.13 * R, 'rgba(255,255,255,.7)');
    // body and feelers
    c.beginPath();
    c.moveTo(0, -0.5 * R);
    c.lineTo(0, 0.62 * R);
    c.strokeStyle = INK;
    c.lineWidth = R * 0.2;
    c.stroke();
    c.lineWidth = Math.max(2, R * 0.07);
    c.beginPath();
    c.moveTo(-0.04 * R, -0.56 * R);
    c.quadraticCurveTo(-0.1 * R, -0.9 * R, -0.3 * R, -0.96 * R);
    c.moveTo(0.04 * R, -0.56 * R);
    c.quadraticCurveTo(0.1 * R, -0.9 * R, 0.3 * R, -0.96 * R);
    c.stroke();
    dot(c, -0.3 * R, -0.96 * R, 0.07 * R, INK);
    dot(c, 0.3 * R, -0.96 * R, 0.07 * R, INK);
  },
};

/** Draw one stamp on a context whose transform is already set to pixels. */
export function stampAt(c, shape, key, x, y, R, angle) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  (SHAPES[shape] || SHAPES.star)(c, R, styleFor(c, key), key);
  c.restore();
}

function drawStamp(c, op) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  stampAt(c, op.s, op.k, op.x * K, op.y * K, op.r * K, (op.a * Math.PI) / 180);
}

export function drawOp(c, op) {
  if (op.t === 'stamp') drawStamp(c, op);
  else drawLine(c, op);
}

/** Paint a small stamp button icon in the current color. */
export function stampIcon(cv, shape, key) {
  const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, cv.width, cv.height);
  const s = Math.min(cv.width, cv.height);
  stampAt(c, shape, key === 'eraser' ? 'red' : key, cv.width / 2, cv.height / 2, s * 0.4, 0);
}

/** Clear to white. */
export function blank(c) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.fillStyle = '#fff';
  c.fillRect(0, 0, c.canvas.width, c.canvas.height);
}

/** How much real drawing a list of ops holds (eraser strokes don't count). */
export function inkAmount(ops) {
  let amount = 0;
  for (const op of ops) {
    if (op.t === 'stamp') { amount += 40; continue; }
    if (op.k === 'eraser') continue;
    amount += op.w * 0.5;
    for (let i = 2; i < op.p.length; i += 2) amount += Math.hypot(op.p[i] - op.p[i - 2], op.p[i + 1] - op.p[i - 1]);
  }
  return amount;
}
