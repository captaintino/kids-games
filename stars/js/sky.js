// The constellations: every star caught lights up the next dot of a picture in
// the sky. Each shape is a list of dots (in a 100 x 100 box, y down) joined by
// lines, plus a cute glowing creature drawn around them when it is complete.
import { makeSprite, starPath } from './engine.js';

const TAU = Math.PI * 2;

function heartPts(n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push([Math.round((50 + x * 2.6) * 10) / 10, Math.round((47 - y * 2.6) * 10) / 10]);
  }
  return pts;
}

// --- little drawing helpers for the creature details (box units) ---
function eyes(c, pts, r) {
  for (const [x, y] of pts) {
    c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(x, y, r * 0.85, r, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(30, 20, 70, 0.9)';
    c.beginPath(); c.arc(x + r * 0.15, y + r * 0.15, r * 0.5, 0, TAU); c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(x + r * 0.3, y - r * 0.15, r * 0.2, 0, TAU); c.fill();
  }
}
function smile(c, x, y, r) {
  c.beginPath(); c.arc(x, y - r * 0.5, r, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
}
function cheeks(c, pts, r) {
  c.fillStyle = 'rgba(255, 140, 190, 0.55)';
  for (const [x, y] of pts) { c.beginPath(); c.ellipse(x, y, r, r * 0.6, 0, 0, TAU); c.fill(); }
}
function poly(c, pts) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
}
function ring(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); }

export const CONSTELLATIONS = [
  {
    id: 'heart', name: 'Heart', say: 'A big heart!', color: '#ff7ac6',
    parts: [{ pts: heartPts(15), closed: true }],
    deco(c) {
      eyes(c, [[40, 44], [60, 44]], 4.2);
      smile(c, 50, 56, 6);
      cheeks(c, [[33, 54], [67, 54]], 4.5);
    },
  },
  {
    id: 'fish', name: 'Fish', say: 'A fishy!', color: '#6fc8ff',
    parts: [{ closed: true, pts: [[84, 50], [78, 37], [66, 29], [52, 27], [38, 31], [28, 39], [21, 45], [8, 28], [14, 50], [8, 72], [21, 55], [28, 61], [38, 69], [52, 73], [66, 71], [78, 63]] }],
    deco(c) {
      eyes(c, [[66, 44]], 4.4);
      smile(c, 76, 57, 4);
      cheeks(c, [[64, 57]], 4);
      c.beginPath(); c.moveTo(46, 50); c.quadraticCurveTo(36, 54, 40, 62); c.stroke();
      c.beginPath(); c.arc(56, 50, 14, -1, 1); c.stroke();
    },
  },
  {
    id: 'bunny', name: 'Bunny', say: 'A bunny!', color: '#ffb3dd',
    parts: [{ closed: true, pts: [[26, 64], [33, 81], [50, 88], [67, 81], [74, 64], [70, 48], [72, 30], [70, 12], [62, 5], [55, 16], [56, 34], [50, 42], [44, 34], [45, 16], [38, 5], [30, 12], [28, 30], [30, 48]] }],
    deco(c) {
      poly(c, [[63, 14], [62, 34]]);
      poly(c, [[37, 14], [38, 34]]);
      eyes(c, [[41, 61], [59, 61]], 4);
      c.fillStyle = '#ff9ad6';
      c.beginPath(); c.ellipse(50, 68, 3, 2.2, 0, 0, TAU); c.fill();
      smile(c, 47, 74, 3); smile(c, 53, 74, 3);
      cheeks(c, [[34, 70], [66, 70]], 4);
      poly(c, [[20, 66], [33, 68]]); poly(c, [[80, 66], [67, 68]]);
    },
  },
  {
    id: 'rocket', name: 'Rocket', say: 'A rocket! Whoosh!', color: '#ff9a4d', tension: 0.55,
    parts: [{ closed: true, pts: [[50, 6], [59, 14], [64, 26], [66, 42], [66, 58], [64, 68], [78, 78], [78, 90], [64, 82], [36, 82], [22, 90], [22, 78], [36, 68], [34, 58], [34, 42], [36, 26], [41, 14]] }],
    deco(c) {
      ring(c, 50, 42, 10);
      eyes(c, [[46, 41], [54, 41]], 2.6);
      smile(c, 50, 47, 2.6);
      poly(c, [[37, 24], [63, 24]]);
      c.beginPath(); c.moveTo(42, 86); c.quadraticCurveTo(50, 104, 58, 86); c.stroke();
      c.beginPath(); c.moveTo(46, 87); c.quadraticCurveTo(50, 96, 54, 87); c.stroke();
    },
  },
  {
    id: 'bear', name: 'Teddy Bear', say: 'A teddy bear!', color: '#ffc27a',
    parts: [{ closed: true, pts: [[20, 58], [25, 75], [36, 85], [50, 89], [64, 85], [75, 75], [80, 58], [76, 42], [84, 35], [89, 26], [84, 17], [73, 16], [62, 28], [50, 27], [38, 28], [27, 16], [16, 17], [11, 26], [16, 35], [24, 42]] }],
    deco(c) {
      ring(c, 79, 25, 5); ring(c, 21, 25, 5);
      eyes(c, [[38, 52], [62, 52]], 4.2);
      c.beginPath(); c.ellipse(50, 69, 13, 10, 0, 0, TAU); c.stroke();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.ellipse(50, 64, 4.5, 3.2, 0, 0, TAU); c.fill();
      smile(c, 50, 74, 4);
      cheeks(c, [[30, 64], [70, 64]], 4.5);
    },
  },
  {
    id: 'kite', name: 'Kite', say: 'A kite! Up, up, up!', color: '#7be36b', tension: 0.15,
    parts: [
      { closed: true, pts: [[50, 4], [63, 16], [76, 28], [63, 45], [50, 62], [37, 45], [24, 28], [37, 16]] },
      { pts: [[50, 4], [50, 28], [50, 62]] },
      { pts: [[24, 28], [50, 28], [76, 28]] },
      { pts: [[50, 62], [43, 67], [45, 75], [53, 79], [58, 86], [54, 93], [47, 97]], tension: 1 },
    ],
    deco(c) {
      eyes(c, [[42, 36], [58, 36]], 3.4);
      smile(c, 50, 47, 4);
      cheeks(c, [[36, 44], [64, 44]], 3.4);
      for (const [x, y] of [[45, 72], [56, 83], [50, 95]]) {
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6, y - 4); c.lineTo(x - 6, y + 4); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y - 4); c.lineTo(x + 6, y + 4); c.closePath(); c.stroke();
      }
    },
  },
  {
    id: 'cat', name: 'Kitty', say: 'A kitty! Meow!', color: '#ffd93b',
    parts: [{ closed: true, pts: [[22, 60], [27, 76], [38, 86], [50, 89], [62, 86], [73, 76], [78, 60], [75, 46], [77, 30], [76, 14], [61, 33], [50, 32], [39, 33], [24, 14], [23, 30], [25, 46]] }],
    deco(c) {
      poly(c, [[69, 36], [73, 22], [65, 34]]);
      poly(c, [[31, 36], [27, 22], [35, 34]]);
      eyes(c, [[39, 56], [61, 56]], 4.4);
      c.fillStyle = '#ff9ad6';
      c.beginPath(); c.moveTo(46, 64); c.lineTo(54, 64); c.lineTo(50, 68.5); c.closePath(); c.fill();
      smile(c, 47, 72, 3); smile(c, 53, 72, 3);
      poly(c, [[14, 62], [32, 66]]); poly(c, [[14, 70], [32, 70]]);
      poly(c, [[86, 62], [68, 66]]); poly(c, [[86, 70], [68, 70]]);
      cheeks(c, [[32, 76], [68, 76]], 3.5);
    },
  },
  {
    id: 'whale', name: 'Whale', say: 'A big whale!', color: '#5c9bff',
    parts: [
      { closed: true, pts: [[90, 58], [86, 72], [72, 82], [54, 85], [36, 80], [24, 70], [16, 58], [6, 40], [16, 44], [26, 34], [26, 52], [38, 46], [54, 42], [70, 43], [82, 48]] },
      { pts: [[70, 43], [68, 30]] },
      { pts: [[60, 21], [68, 30], [76, 21]] },
    ],
    deco(c) {
      eyes(c, [[74, 60]], 4);
      smile(c, 84, 68, 4);
      cheeks(c, [[70, 69]], 4);
      for (const y of [72, 77]) { c.beginPath(); c.moveTo(48, y); c.quadraticCurveTo(64, y + 3, 78, y - 2); c.stroke(); }
    },
  },
  {
    id: 'butterfly', name: 'Butterfly', say: 'A butterfly!', color: '#c9a3ff',
    parts: [{ closed: true, pts: [[50, 32], [60, 20], [76, 12], [90, 20], [88, 38], [72, 48], [54, 52], [74, 60], [80, 76], [66, 86], [54, 72], [50, 76], [46, 72], [34, 86], [20, 76], [26, 60], [46, 52], [28, 48], [12, 38], [10, 20], [24, 12], [40, 20]] }],
    deco(c) {
      c.beginPath(); c.ellipse(50, 54, 4, 20, 0, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(48, 34); c.quadraticCurveTo(44, 20, 38, 16); c.stroke();
      c.beginPath(); c.moveTo(52, 34); c.quadraticCurveTo(56, 20, 62, 16); c.stroke();
      ring(c, 73, 30, 6); ring(c, 27, 30, 6); ring(c, 68, 70, 4); ring(c, 32, 70, 4);
      eyes(c, [[47, 40], [53, 40]], 2);
      smile(c, 50, 46, 2);
    },
  },
  {
    id: 'turtle', name: 'Turtle', say: 'A turtle!', color: '#5cd65c',
    parts: [{ closed: true, pts: [[18, 60], [24, 44], [36, 33], [50, 29], [64, 33], [76, 44], [82, 56], [88, 49], [96, 54], [92, 64], [80, 66], [78, 77], [67, 77], [64, 68], [36, 68], [33, 77], [22, 77], [21, 66], [10, 64]] }],
    deco(c) {
      poly(c, [[20, 61], [81, 61]]);
      for (const [x, y] of [[50, 46], [34, 52], [66, 52]]) {
        c.beginPath();
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const px = x + Math.cos(a) * 7; const py = y + Math.sin(a) * 6; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
        c.closePath(); c.stroke();
      }
      eyes(c, [[90, 54]], 2.8);
      smile(c, 93, 60, 2.4);
    },
  },
  {
    id: 'duck', name: 'Duck', say: 'A duck! Quack!', color: '#fff27a',
    parts: [{ closed: true, pts: [[80, 28], [92, 32], [84, 38], [76, 44], [80, 58], [74, 74], [58, 84], [40, 84], [22, 78], [12, 64], [6, 48], [20, 52], [36, 50], [52, 46], [54, 36], [58, 20], [68, 16], [78, 20]] }],
    deco(c) {
      eyes(c, [[69, 27]], 3.6);
      cheeks(c, [[70, 36]], 3.4);
      c.beginPath(); c.moveTo(30, 62); c.quadraticCurveTo(44, 76, 60, 62); c.quadraticCurveTo(46, 66, 30, 62); c.stroke();
    },
  },
  {
    id: 'owl', name: 'Owl', say: 'An owl! Hoo hoo!', color: '#d9a066',
    parts: [{ closed: true, pts: [[24, 18], [36, 27], [50, 25], [64, 27], [76, 18], [79, 34], [81, 52], [78, 70], [70, 83], [58, 91], [42, 91], [30, 83], [22, 70], [19, 52], [21, 34]] }],
    deco(c) {
      ring(c, 38, 44, 10); ring(c, 62, 44, 10);
      eyes(c, [[38, 44], [62, 44]], 5);
      c.beginPath(); c.moveTo(46, 54); c.lineTo(54, 54); c.lineTo(50, 61); c.closePath(); c.stroke();
      for (const [x, y] of [[42, 70], [58, 70], [50, 78]]) { c.beginPath(); c.arc(x, y - 3, 4, 0.3, Math.PI - 0.3); c.stroke(); }
      cheeks(c, [[28, 58], [72, 58]], 4);
    },
  },
  {
    id: 'snail', name: 'Snail', say: 'A little snail!', color: '#ff9ad6',
    parts: [
      { closed: true, pts: [[6, 84], [28, 86], [54, 86], [78, 84], [90, 76], [91, 62], [84, 54], [76, 62], [70, 52], [66, 36], [56, 26], [42, 24], [28, 30], [20, 42], [18, 56], [22, 70]] },
      { pts: [[46, 50], [54, 54], [46, 62], [34, 54], [42, 38]], tension: 1 },
    ],
    deco(c) {
      c.beginPath(); c.moveTo(84, 56); c.quadraticCurveTo(80, 44, 76, 38); c.stroke();
      c.beginPath(); c.moveTo(88, 56); c.quadraticCurveTo(92, 44, 94, 38); c.stroke();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(76, 37, 2.6, 0, TAU); c.fill();
      c.beginPath(); c.arc(94, 37, 2.6, 0, TAU); c.fill();
      eyes(c, [[86, 64]], 2.6);
      smile(c, 86, 72, 3);
    },
  },
  {
    id: 'dino', name: 'Dinosaur', say: 'A dinosaur! Roar!', color: '#8ff7a8',
    parts: [{ closed: true, pts: [[82, 17], [92, 22], [90, 30], [78, 31], [72, 44], [71, 58], [72, 80], [62, 81], [60, 70], [44, 72], [36, 81], [26, 81], [26, 68], [12, 64], [4, 58], [18, 52], [36, 44], [54, 46], [64, 32], [72, 20]] }],
    deco(c) {
      eyes(c, [[82, 22]], 2.8);
      smile(c, 88, 28, 2.4);
      cheeks(c, [[80, 27]], 2.4);
      for (const [x, y] of [[36, 56], [48, 58], [56, 54]]) { c.beginPath(); c.arc(x, y, 3, 0, TAU); c.stroke(); }
    },
  },
];

export const BY_ID = {};
for (const con of CONSTELLATIONS) {
  BY_ID[con.id] = con;
  // dots (in lighting order, shared points counted once) and the lines between them
  const keys = {};
  con.dots = [];
  con.edges = [];
  for (const part of con.parts) {
    const idx = part.pts.map(([x, y]) => {
      const k = `${x},${y}`;
      if (keys[k] == null) { keys[k] = con.dots.length; con.dots.push([x, y]); }
      return keys[k];
    });
    for (let i = 1; i < idx.length; i++) con.edges.push([idx[i - 1], idx[i]]);
    if (part.closed) con.edges.push([idx[idx.length - 1], idx[0]]);
  }
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------
/** A smooth curve through the points (Catmull-Rom); tension 0 = straight lines. */
function smoothPath(c, pts, closed, tension) {
  const n = pts.length;
  const k = tension / 6;
  const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  if (closed) c.closePath();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** The cute creature (a glowing outline with a face), in box units. */
function drawCreature(c, con, alpha) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha = alpha;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const tension = (p) => (p.tension != null ? p.tension : con.tension != null ? con.tension : 1);
  const main = con.parts[0];
  // soft fill
  smoothPath(c, main.pts, main.closed, tension(main));
  c.fillStyle = hexA(con.color, 0.22);
  c.fill();
  for (const pass of [[hexA(con.color, 0.3), 9], [con.color, 3.6], ['rgba(255,255,255,0.9)', 1.3]]) {
    c.strokeStyle = pass[0];
    c.lineWidth = pass[1];
    for (const part of con.parts) {
      if (part !== main && tension(part) < 0.5) continue; // the kite's sticks stay as star lines
      smoothPath(c, part.pts, part.closed, tension(part));
      c.stroke();
    }
  }
  c.strokeStyle = 'rgba(255,255,255,0.9)';
  c.lineWidth = 2;
  con.deco(c);
  c.restore();
}

const dotSprites = {};
function dotSprite(color) {
  if (!dotSprites[color]) {
    dotSprites[color] = makeSprite(32, 32, (c) => {
      const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.25, hexA(color, 0.9));
      g.addColorStop(1, hexA(color, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, 32, 32);
      c.fillStyle = '#fff';
      starPath(c, 16, 16, 13, 2.6, 4, 0);
      c.fill();
    }, 2);
  }
  return dotSprites[color];
}

/**
 * Draws a constellation into c with its box at (x, y, size).
 * lit: how many dots are lit; creature: 0..1 how much of the creature shows;
 * faint: unlit dots are drawn as faint specks (0 hides them).
 */
export function drawConstellation(c, con, x, y, size, opts = {}) {
  const lit = opts.lit != null ? opts.lit : con.dots.length;
  const faint = opts.faint != null ? opts.faint : 0.35;
  const s = size / 100;
  const P = (p) => [x + p[0] * s, y + p[1] * s];
  c.save();
  if (opts.creature) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    drawCreature(c, con, opts.creature);
    c.restore();
  }
  // the lines between lit dots
  c.lineCap = 'round';
  c.strokeStyle = opts.lineColor || 'rgba(255, 255, 255, 0.75)';
  c.lineWidth = Math.max(1, size * (opts.lineW || 0.012));
  c.beginPath();
  for (const [a, b] of con.edges) {
    if (a >= lit || b >= lit) continue;
    const pa = P(con.dots[a]);
    const pb = P(con.dots[b]);
    c.moveTo(pa[0], pa[1]);
    c.lineTo(pb[0], pb[1]);
  }
  c.stroke();
  // the dots
  const img = dotSprite(con.color);
  for (let i = 0; i < con.dots.length; i++) {
    const p = P(con.dots[i]);
    if (i < lit) {
      const z = size * (opts.dotSize || 0.11) * (i === lit - 1 && opts.pulse ? 1 + opts.pulse : 1);
      c.globalAlpha = 1;
      c.drawImage(img, p[0] - z / 2, p[1] - z / 2, z, z);
    } else if (faint > 0) {
      c.globalAlpha = faint;
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(p[0], p[1], Math.max(1, size * (opts.faintR || 0.012)), 0, TAU); c.fill();
    }
  }
  c.restore();
}

/** A finished constellation as a sprite (size x size units), for the big celebration. */
const doneCache = {};
export function doneSprite(con) {
  if (!doneCache[con.id]) {
    doneCache[con.id] = makeSprite(200, 200, (c) => drawConstellation(c, con, 10, 10, 180, { creature: 1, dotSize: 0.12 }), 2.4);
  }
  return doneCache[con.id];
}

/** Which constellation comes next: the first one not found yet, or any. */
export function nextConstellation(found, notId) {
  for (const con of CONSTELLATIONS) if (!found[con.id] && con.id !== notId) return con.id;
  const pool = CONSTELLATIONS.filter((con) => con.id !== notId);
  return pool[Math.floor(Math.random() * pool.length)].id;
}
