// Turns a coloring picture into a dot-to-dot outline.
//
//   outlineOf(pic, cfg)          the picture's silhouette as a closed list of points
//                                (sheet units, 400 x 400), clockwise, cached per picture
//   pickDots(outline, n)         the n points that keep the shape best (Visvalingam),
//                                starting at the top and going clockwise
//   placeLabels(dots)            where each dot's number goes (outside the shape)
//
// How the silhouette is found: the chosen parts are filled together on a small
// canvas, the biggest blob is kept (with its holes filled), and its edge is
// followed pixel by pixel. That works for any picture, so a picture only needs a
// little config: which parts to use (or which to leave out).
import { SIZE } from '../../shared/js/art.js';

const GRID = 200; // raster size (2 sheet units per pixel)
const K = GRID / SIZE;

// An off-screen SVG path, for measuring a part's bounding box.
const SVGNS = 'http://www.w3.org/2000/svg';
let measurePath = null;
function bbox(d) {
  if (!measurePath) {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('width', '0');
    s.setAttribute('height', '0');
    s.setAttribute('aria-hidden', 'true');
    s.style.position = 'absolute';
    s.style.visibility = 'hidden';
    document.body.appendChild(s);
    measurePath = document.createElementNS(SVGNS, 'path');
    s.appendChild(measurePath);
  }
  measurePath.setAttribute('d', d);
  try { return measurePath.getBBox(); } catch (err) { return { x: 0, y: 0, width: SIZE, height: SIZE }; }
}

/**
 * Which parts make up the silhouette. By default: every colorable part that is not
 * the background and does not reach the edge of the sheet (grass, ground, sea).
 * cfg.parts lists them explicitly; cfg.skip leaves some out.
 */
export function partsOf(pic, cfg = {}) {
  if (cfg.parts) return cfg.parts.slice();
  const skip = cfg.skip || [];
  const out = [];
  pic.shapes.forEach((s, i) => {
    if (!s.c || s.bg || skip.indexOf(i) >= 0) return;
    const b = bbox(s.d);
    const edge = b.x <= 1 || b.y <= 1 || b.x + b.width >= SIZE - 1 || b.y + b.height >= SIZE - 1;
    if (!edge) out.push(i);
  });
  return out;
}

const cache = new Map();

/** The silhouette of a picture: a closed, clockwise list of {x, y} on the sheet. */
export function outlineOf(pic, cfg = {}) {
  if (cache.has(pic.id)) return cache.get(pic.id);
  const cv = document.createElement('canvas');
  cv.width = cv.height = GRID;
  const c = cv.getContext('2d');
  c.scale(K, K);
  c.fillStyle = '#000';
  c.strokeStyle = '#000';
  c.lineJoin = 'round';
  c.lineWidth = cfg.grow || 6;
  for (const i of partsOf(pic, cfg)) {
    const p = new Path2D(pic.shapes[i].d);
    c.fill(p);
    c.stroke(p);
  }
  const data = c.getImageData(0, 0, GRID, GRID).data;
  const N = GRID * GRID;
  const m = new Uint8Array(N);
  for (let p = 0; p < N; p++) m[p] = data[p * 4 + 3] > 110 ? 1 : 0;
  // the edge row/column stay empty, so tracing never walks off the grid
  for (let i = 0; i < GRID; i++) {
    m[i] = 0; m[(GRID - 1) * GRID + i] = 0; m[i * GRID] = 0; m[i * GRID + GRID - 1] = 0;
  }
  const blob = biggestBlob(m);
  const pts = trace(blob);
  const out = pts.map((p) => ({ x: (p % GRID + 0.5) / K, y: (Math.floor(p / GRID) + 0.5) / K }));
  if (area(out) < 0) out.reverse();
  cache.set(pic.id, out);
  return out;
}

// Keep the biggest 4-connected blob, with its holes filled in.
function biggestBlob(m) {
  const N = m.length;
  const lab = new Int32Array(N);
  const stack = new Int32Array(N);
  let best = 0;
  let bestSize = 0;
  let id = 0;
  for (let s = 0; s < N; s++) {
    if (!m[s] || lab[s]) continue;
    id++;
    let top = 0;
    let size = 0;
    stack[top++] = s;
    lab[s] = id;
    while (top) {
      const p = stack[--top];
      size++;
      const nb = [p - 1, p + 1, p - GRID, p + GRID];
      for (let j = 0; j < 4; j++) {
        const q = nb[j];
        if (q >= 0 && q < N && m[q] && !lab[q]) { lab[q] = id; stack[top++] = q; }
      }
    }
    if (size > bestSize) { bestSize = size; best = id; }
  }
  // background reachable from the border; everything else belongs to the blob
  const outside = new Uint8Array(N);
  let top = 0;
  for (let i = 0; i < GRID; i++) {
    [i, (GRID - 1) * GRID + i, i * GRID, i * GRID + GRID - 1].forEach((p) => {
      if (lab[p] !== best && !outside[p]) { outside[p] = 1; stack[top++] = p; }
    });
  }
  while (top) {
    const p = stack[--top];
    const x = p % GRID;
    const nb = [x > 0 ? p - 1 : -1, x < GRID - 1 ? p + 1 : -1, p - GRID, p + GRID];
    for (let j = 0; j < 4; j++) {
      const q = nb[j];
      if (q >= 0 && q < N && !outside[q] && lab[q] !== best) { outside[q] = 1; stack[top++] = q; }
    }
  }
  const b = new Uint8Array(N);
  for (let p = 0; p < N; p++) b[p] = outside[p] ? 0 : 1;
  return b;
}

// Moore-neighbour tracing of the blob's outer edge (pixel indices, in order).
// The start is the top-left pixel, so the walk goes clockwise around the blob.
function trace(b) {
  let start = -1;
  for (let p = 0; p < b.length; p++) if (b[p]) { start = p; break; }
  if (start < 0) return [];
  // neighbours clockwise on screen (y down), starting west
  const DX = [-1, -1, 0, 1, 1, 1, 0, -1];
  const DY = [0, -1, -1, -1, 0, 1, 1, 1];
  const out = [];
  let cur = start;
  let s = 0; // where the next search starts
  let firstDir = -1;
  const limit = b.length;
  for (let n = 0; n < limit; n++) {
    let dir = -1;
    let found = -1;
    for (let j = 0; j < 8; j++) {
      const d = (s + j) % 8;
      const q = (Math.floor(cur / GRID) + DY[d]) * GRID + (cur % GRID) + DX[d];
      if (b[q]) { dir = d; found = q; break; }
    }
    if (found < 0) { out.push(cur); break; } // a single pixel
    if (cur === start) {
      if (firstDir === dir) break; // back where we started, going the same way
      if (firstDir < 0) firstDir = dir;
    }
    out.push(cur);
    cur = found;
    s = (dir + 6) % 8;
  }
  return out;
}

/** Signed area (positive = clockwise on screen). */
export function area(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/**
 * Keep the n most important points of a closed outline (Visvalingam-Whyatt):
 * repeatedly drop the point whose triangle with its neighbours is smallest.
 * opts.minGap: points closer than this are merged first, so dots never sit on
 * top of each other.
 */
export function pickDots(outline, n, opts = {}) {
  const pts = outline.map((p) => ({ x: p.x, y: p.y }));
  let len = pts.length;
  if (len <= n) return orderFromTop(pts);
  const prev = new Int32Array(len);
  const next = new Int32Array(len);
  const alive = new Uint8Array(len);
  for (let i = 0; i < len; i++) { prev[i] = (i - 1 + len) % len; next[i] = (i + 1) % len; alive[i] = 1; }
  const tri = (i) => {
    const a = pts[prev[i]];
    const b = pts[i];
    const c = pts[next[i]];
    return Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
  };
  const gap = (i) => Math.min(dist(pts[i], pts[prev[i]]), dist(pts[i], pts[next[i]]));
  const minGap = opts.minGap || 0;
  const score = new Float64Array(len);
  for (let i = 0; i < len; i++) score[i] = tri(i);
  let count = len;
  while (count > n) {
    let best = -1;
    let bestScore = Infinity;
    for (let i = 0; i < len; i++) {
      if (!alive[i]) continue;
      // crowded points go first, then the least important ones
      const s = gap(i) < minGap ? score[i] - 1e9 : score[i];
      if (s < bestScore) { bestScore = s; best = i; }
    }
    alive[best] = 0;
    const a = prev[best];
    const c = next[best];
    next[a] = c;
    prev[c] = a;
    score[a] = tri(a);
    score[c] = tri(c);
    count--;
  }
  const out = [];
  let i = 0;
  while (!alive[i]) i++;
  const first = i;
  do { out.push(pts[i]); i = next[i]; } while (i !== first);
  return orderFromTop(out);
}

// Start at the top (leftmost of the top ones) and keep going clockwise.
function orderFromTop(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].y < pts[s].y - 6 || (Math.abs(pts[i].y - pts[s].y) <= 6 && pts[i].x < pts[s].x)) s = i;
  }
  return pts.slice(s).concat(pts.slice(0, s));
}

export const dist = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));

function inside(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

function segDist(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.sqrt((p.x - a.x - t * dx) * (p.x - a.x - t * dx) + (p.y - a.y - t * dy) * (p.y - a.y - t * dy));
}

/**
 * Where each dot's label goes: just outside the shape, turned a little this way
 * or that when it would bump into another dot, label or line.
 * Returns [{x, y}] in sheet units. `r` is how far from the dot, `pad` how close
 * to the sheet edge a label may sit (the sheet is SIZE x SIZE plus `margin`).
 */
export function placeLabels(dots, { r = 22, margin = 16, pad = 12 } = {}) {
  const n = dots.length;
  const out = [];
  const lo = -margin + pad;
  const hi = SIZE + margin - pad;
  for (let i = 0; i < n; i++) {
    const a = dots[(i - 1 + n) % n];
    const b = dots[i];
    const c = dots[(i + 1) % n];
    // outward direction: away from both neighbours' directions, flipped if it points inside
    let ux = (b.x - a.x) / (dist(a, b) || 1) + (b.x - c.x) / (dist(b, c) || 1);
    let uy = (b.y - a.y) / (dist(a, b) || 1) + (b.y - c.y) / (dist(b, c) || 1);
    let ul = Math.sqrt(ux * ux + uy * uy);
    if (ul < 0.2) {
      // straight run: use the edge's normal
      ux = c.y - a.y;
      uy = -(c.x - a.x);
      ul = Math.sqrt(ux * ux + uy * uy) || 1;
    }
    ux /= ul; uy /= ul;
    if (inside(dots, b.x + ux * 6, b.y + uy * 6)) { ux = -ux; uy = -uy; }
    const base = Math.atan2(uy, ux);
    let best = null;
    let bestScore = -Infinity;
    const tries = [0, 0.45, -0.45, 0.9, -0.9, 1.35, -1.35, Math.PI];
    for (let t = 0; t < tries.length; t++) {
      const ang = base + tries[t];
      const p = { x: b.x + Math.cos(ang) * r, y: b.y + Math.sin(ang) * r };
      p.x = Math.max(lo, Math.min(hi, p.x));
      p.y = Math.max(lo, Math.min(hi, p.y));
      let room = Infinity;
      for (let j = 0; j < n; j++) {
        if (j !== i) room = Math.min(room, dist(p, dots[j]) - 4);
        room = Math.min(room, segDist(p, dots[j], dots[(j + 1) % n]) + 2);
      }
      for (let j = 0; j < out.length; j++) room = Math.min(room, dist(p, out[j]) - 6);
      room = Math.min(room, dist(p, b) + 4);
      const s = Math.min(room, 26) - t * 0.8;
      if (s > bestScore) { bestScore = s; best = p; }
    }
    out.push(best);
  }
  return out;
}
