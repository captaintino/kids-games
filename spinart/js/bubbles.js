// Bubble Print: hold a finger on the paper to blow painty bubbles. They float up
// and wobble; tap one (or wait) and it pops onto the paper as a bubble print.
import { paintColor, bubblePrint } from './paint.js';

const TAU = Math.PI * 2;
export const BP = 800;    // paper size (square, in paper pixels)
const SIZES = { s: [10, 18], m: [18, 30], l: [30, 48] };

const spriteCache = {};
/** A shiny soap bubble tinted with a paint color, drawn once per color. */
function bubbleSprite(color) {
  if (spriteCache[color]) return spriteCache[color];
  const s = 96;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const c = cv.getContext('2d');
  const r = s / 2 - 3;
  const g = c.createRadialGradient(s / 2, s / 2, r * 0.35, s / 2, s / 2, r);
  g.addColorStop(0, 'rgba(255,255,255,0.05)');
  g.addColorStop(0.75, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0.55)');
  c.beginPath();
  c.arc(s / 2, s / 2, r, 0, TAU);
  c.fillStyle = color;
  c.globalAlpha = 0.28;
  c.fill();
  c.globalAlpha = 1;
  c.fillStyle = g;
  c.fill();
  c.lineWidth = 3.5;
  c.strokeStyle = color;
  c.stroke();
  // shine
  c.beginPath();
  c.ellipse(s * 0.36, s * 0.32, r * 0.26, r * 0.14, -0.7, 0, TAU);
  c.fillStyle = 'rgba(255,255,255,.85)';
  c.fill();
  c.beginPath();
  c.arc(s * 0.66, s * 0.7, r * 0.07, 0, TAU);
  c.fill();
  // a hint of rainbow on the rim
  c.beginPath();
  c.arc(s / 2, s / 2, r - 3, 0.1 * Math.PI, 0.6 * Math.PI);
  c.lineWidth = 3;
  c.strokeStyle = 'rgba(120, 220, 255, .55)';
  c.stroke();
  c.beginPath();
  c.arc(s / 2, s / 2, r - 3, 1.1 * Math.PI, 1.4 * Math.PI);
  c.strokeStyle = 'rgba(255, 150, 220, .55)';
  c.stroke();
  spriteCache[color] = cv;
  return cv;
}

export function createBubbles(hooks) {
  const paper = document.createElement('canvas');
  paper.width = paper.height = BP;
  const pc = paper.getContext('2d');

  const U = {
    paper,
    bubbles: [],
    fingers: {},
    size: 'm',
    x: 0, y: 0, s: 100, k: 1,     // the paper on screen
    t: 0,
    changed: false,
    unit: 1,
  };

  function clearPaper() {
    pc.fillStyle = '#fff';
    pc.fillRect(0, 0, BP, BP);
    U.bubbles = [];
  }
  clearPaper();
  U.clear = function () { clearPaper(); U.changed = true; };

  U.layout = function (w, h, dpr, unit) {
    const m = 14;
    U.s = Math.max(80, Math.min(w, h) - m * 2);
    U.k = U.s / BP;
    U.x = (w - U.s) / 2;
    U.y = (h - U.s) / 2;
    U.unit = unit || 1;
  };

  function quantColor(key) {
    // rainbow gives every bubble its own color, rounded so the sprites can be reused
    if (key === 'rainbow') return `hsl(${Math.floor(Math.random() * 12) * 30}, 95%, 57%)`;
    return paintColor(key, U.t);
  }

  function spawn(x, y, colorKey, vx, vy) {
    if (U.bubbles.length >= 36) popBubble(U.bubbles[0], true);
    const sz = SIZES[U.size];
    const r = (sz[0] + Math.random() * (sz[1] - sz[0])) * U.unit;
    const color = quantColor(colorKey);
    U.bubbles.push({
      x, y, r,
      vx: vx != null ? vx : (Math.random() - 0.5) * 50,
      vy: vy != null ? vy : -30 - Math.random() * 50,
      color, glitter: colorKey === 'glitter',
      phase: Math.random() * TAU,
      life: 3.5 + Math.random() * 3.5,
      // each bubble pops somewhere different, so the prints spread over the paper
      popAt: Math.min(y - r * 2, U.y + U.s * (0.06 + Math.random() * 0.7)),
      grow: 0,
    });
  }

  function popBubble(b, quiet) {
    const i = U.bubbles.indexOf(b);
    if (i < 0) return;
    U.bubbles.splice(i, 1);
    // print it where it popped, if it is over the paper
    const px = (b.x - U.x) / U.k;
    const py = (b.y - U.y) / U.k;
    const pr = b.r / U.k;
    if (px > -pr && px < BP + pr && py > -pr && py < BP + pr) {
      bubblePrint(pc, px, py, pr, b.color, b.glitter);
      U.changed = true;
    }
    if (hooks.pop) hooks.pop(b, quiet);
  }

  function bubbleAt(x, y) {
    for (let i = U.bubbles.length - 1; i >= 0; i--) {
      const b = U.bubbles[i];
      const dx = x - b.x;
      const dy = y - b.y;
      const rr = Math.max(b.r * 1.2, 26);
      if (dx * dx + dy * dy < rr * rr) return b;
    }
    return null;
  }

  U.onPaper = (x, y) => x >= U.x - 20 && x <= U.x + U.s + 20 && y >= U.y - 20 && y <= U.y + U.s + 20;

  U.down = function (id, x, y, colorKey) {
    const b = bubbleAt(x, y);
    if (b) {
      U.fingers[id] = { mode: 'pop' };
      popBubble(b);
      return;
    }
    U.fingers[id] = { mode: 'blow', x, y, colorKey, last: -9 };
    if (U.onPaper(x, y)) {
      spawn(x, y, colorKey);
      U.fingers[id].last = U.t;
      if (hooks.blow) hooks.blow();
    }
  };
  U.move = function (id, x, y) {
    const f = U.fingers[id];
    if (!f) return;
    if (f.mode === 'pop') {
      const b = bubbleAt(x, y);
      if (b) popBubble(b);
    } else {
      f.x = x;
      f.y = y;
    }
  };
  U.up = function (id) { delete U.fingers[id]; };

  /** 💨: a big puff of bubbles from the bottom of the paper. */
  U.blowPuff = function (colorKey) {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const sp = 90 + Math.random() * 140;
      spawn(U.x + U.s / 2 + (Math.random() - 0.5) * 30, U.y + U.s - 20, colorKey, Math.cos(a) * sp, Math.sin(a) * sp);
    }
  };

  U.update = function (dt) {
    U.t += dt;
    for (const id in U.fingers) {
      const f = U.fingers[id];
      if (f.mode === 'blow' && U.onPaper(f.x, f.y) && U.t - f.last > 0.16) {
        f.last = U.t;
        spawn(f.x, f.y, f.colorKey);
      }
    }
    const top = U.y;
    const left = U.x;
    const right = U.x + U.s;
    const bottom = U.y + U.s;
    const gone = [];
    for (const b of U.bubbles) {
      b.grow = Math.min(1, b.grow + dt * 5);
      b.life -= dt;
      b.vx += Math.sin(U.t * 1.6 + b.phase) * 40 * dt;
      b.vx *= 1 - dt * 0.8;
      b.vy += (-45 - b.vy) * dt * 0.9;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x - b.r < left) { b.x = left + b.r; b.vx = Math.abs(b.vx); }
      if (b.x + b.r > right) { b.x = right - b.r; b.vx = -Math.abs(b.vx); }
      if (b.y + b.r > bottom) { b.y = bottom - b.r; b.vy = -Math.abs(b.vy); }
      if (b.life <= 0 || b.y < b.popAt || b.y - b.r * 0.6 < top) gone.push(b);
    }
    gone.forEach((b) => popBubble(b, false));
  };

  U.draw = function (c, dpr) {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = 'rgba(40, 10, 90, .22)';
    c.fillRect(U.x + 4, U.y + 10, U.s, U.s);
    c.drawImage(paper, U.x, U.y, U.s, U.s);
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(45, 36, 66, .25)';
    c.strokeRect(U.x, U.y, U.s, U.s);
    for (const b of U.bubbles) {
      const sp = bubbleSprite(b.color);
      const wob = Math.sin(U.t * 7 + b.phase) * 0.05;
      const g = 0.4 + 0.6 * b.grow;
      const rx = b.r * (1 + wob) * g;
      const ry = b.r * (1 - wob) * g;
      c.drawImage(sp, b.x - rx, b.y - ry, rx * 2, ry * 2);
    }
  };

  U.exportCanvas = function () {
    const cv = document.createElement('canvas');
    cv.width = cv.height = BP;
    cv.getContext('2d').drawImage(paper, 0, 0);
    return cv;
  };
  U.snapshot = function () {
    try { return paper.toDataURL('image/jpeg', 0.8); } catch (err) { return ''; }
  };
  U.restore = function (url) {
    if (!url) return;
    const img = new Image();
    img.onload = () => { pc.drawImage(img, 0, 0, BP, BP); U.changed = true; };
    img.src = url;
  };
  return U;
}
