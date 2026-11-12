// Butterfly Fold: paint on a paper with a butterfly outline, press 🦋 Fold and the
// paper folds over and opens again with the paint blotted onto the other side.
// Then it is cut out into a butterfly (body, antennae) that flaps its wings.
import { paintColor, specks, blob, bubbleCluster, blotMirror, hasPaint } from './paint.js';

const TAU = Math.PI * 2;
const INK = '#2d2442';
export const PW = 800;
export const PH = 640;

// One wing (upper + lower), as cubic curves; x is the distance from the fold line
// (as a share of the paper width), y from the top (as a share of the height).
const WING = [
  ['M', 0.0, 0.40],
  ['C', 0.02, 0.18, 0.18, 0.04, 0.32, 0.06],
  ['C', 0.46, 0.08, 0.49, 0.24, 0.43, 0.35],
  ['C', 0.38, 0.44, 0.2, 0.5, 0.05, 0.52],
  ['C', 0.22, 0.54, 0.41, 0.62, 0.40, 0.76],
  ['C', 0.39, 0.9, 0.24, 0.97, 0.15, 0.91],
  ['C', 0.07, 0.86, 0.03, 0.74, 0.0, 0.64],
];

/** Add one wing to the current path. side: 1 = right, -1 = left. */
function wingPath(c, x0, y0, w, h, side) {
  const X = (v) => x0 + side * v * w;
  const Y = (v) => y0 + v * h;
  for (const s of WING) {
    if (s[0] === 'M') c.moveTo(X(s[1]), Y(s[2]));
    else c.bezierCurveTo(X(s[1]), Y(s[2]), X(s[3]), Y(s[4]), X(s[5]), Y(s[6]));
  }
  c.closePath();
}
function butterflyPath(c, x, y, w, h) {
  c.beginPath();
  wingPath(c, x + w / 2, y, w, h, 1);
  wingPath(c, x + w / 2, y, w, h, -1);
}

/** The butterfly's body, head and antennae, centred on cx, from top y, paper size w x h. */
function drawBody(c, cx, y, w, h, t) {
  const s = w / PW;
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  // antennae
  [-1, 1].forEach((side) => {
    const sway = Math.sin(t * 2.2 + side) * 6 * s;
    c.beginPath();
    c.moveTo(cx + side * 10 * s, y + h * 0.3);
    c.bezierCurveTo(cx + side * 20 * s, y + h * 0.16, cx + side * 60 * s + sway, y + h * 0.1, cx + side * 82 * s + sway, y + h * 0.12);
    c.lineWidth = 7 * s;
    c.strokeStyle = INK;
    c.stroke();
    c.beginPath();
    c.arc(cx + side * 86 * s + sway, y + h * 0.125, 13 * s, 0, TAU);
    c.fillStyle = '#ff5fa8';
    c.fill();
    c.lineWidth = 5 * s;
    c.stroke();
  });
  // body
  c.beginPath();
  c.ellipse(cx, y + h * 0.58, 26 * s, h * 0.22, 0, 0, TAU);
  const g = c.createLinearGradient(cx - 26 * s, 0, cx + 26 * s, 0);
  g.addColorStop(0, '#9d5cff');
  g.addColorStop(0.45, '#c9a3ff');
  g.addColorStop(1, '#6a35d9');
  c.fillStyle = g;
  c.fill();
  c.lineWidth = 6 * s;
  c.strokeStyle = INK;
  c.stroke();
  // stripes
  c.save();
  c.clip();
  c.strokeStyle = 'rgba(45,36,66,.45)';
  c.lineWidth = 5 * s;
  for (let i = 0; i < 5; i++) {
    const yy = y + h * (0.47 + i * 0.065);
    c.beginPath();
    c.moveTo(cx - 30 * s, yy);
    c.quadraticCurveTo(cx, yy + 9 * s, cx + 30 * s, yy);
    c.stroke();
  }
  c.restore();
  // head with a happy face
  const hy = y + h * 0.33;
  const hr = 34 * s;
  c.beginPath();
  c.arc(cx, hy, hr, 0, TAU);
  c.fillStyle = '#b48cff';
  c.fill();
  c.lineWidth = 6 * s;
  c.strokeStyle = INK;
  c.stroke();
  [-1, 1].forEach((side) => {
    c.beginPath();
    c.ellipse(cx + side * 12 * s, hy - 4 * s, 6 * s, 8 * s, 0, 0, TAU);
    c.fillStyle = INK;
    c.fill();
    c.beginPath();
    c.arc(cx + side * 12 * s + 2 * s, hy - 7 * s, 2.4 * s, 0, TAU);
    c.fillStyle = '#fff';
    c.fill();
    c.beginPath();
    c.ellipse(cx + side * 22 * s, hy + 9 * s, 6 * s, 4 * s, 0, 0, TAU);
    c.fillStyle = 'rgba(255,110,170,.7)';
    c.fill();
  });
  c.beginPath();
  c.arc(cx, hy + 6 * s, 10 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  c.lineWidth = 4.5 * s;
  c.strokeStyle = INK;
  c.stroke();
  c.restore();
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createButterfly(hooks) {
  const paint = document.createElement('canvas');
  paint.width = PW;
  paint.height = PH;
  const pc = paint.getContext('2d');
  pc.lineCap = 'round';
  pc.lineJoin = 'round';

  const B = {
    paint,
    state: 'paint',     // 'paint', 'fold', 'cut', 'made'
    stateT: 0,
    mirror: false,
    x: 0, y: 0, w: 100, h: 80, k: 1,   // the paper on screen
    fingers: {},
    dirty: true,
    changed: false,
    t: 0,
    wings: null,
    flutter: 0,
    blotted: false,
  };

  B.layout = function (w, h) {
    const m = 14;
    const k = Math.min((w - m * 2) / PW, (h - m * 2) / PH);
    B.k = k;
    B.w = PW * k;
    B.h = PH * k;
    B.x = (w - B.w) / 2;
    B.y = (h - B.h) / 2;
    B.dirty = true;
  };

  B.clear = function () {
    pc.clearRect(0, 0, PW, PH);
    B.state = 'paint';
    B.dirty = true;
    B.changed = true;
  };
  B.isEmpty = () => !hasPaint(paint);

  // ---------------------------------------------------------------------
  // Painting
  // ---------------------------------------------------------------------
  const toPaper = (x, y) => ({ x: (x - B.x) / B.k, y: (y - B.y) / B.k });
  B.onPaper = (x, y) => x >= B.x - 10 && x <= B.x + B.w + 10 && y >= B.y - 10 && y <= B.y + B.h + 10;

  function both(fn, x, y) {
    fn(x, y);
    if (B.mirror) fn(PW - x, y);
  }

  function stampBlob(f, p, r) {
    const col = paintColor(f.colorKey, B.t);
    const seed = Math.random() * 10;
    both((x, y) => {
      blob(pc, x, y, r, col, seed);
      if (f.colorKey === 'glitter') specks(pc, x, y, r, 3);
    }, p.x, p.y);
  }

  B.down = function (id, x, y, colorKey, tool) {
    if (B.state === 'made') {
      // tap the butterfly: it flutters!
      B.flutter = 1.4;
      if (hooks.flutter) hooks.flutter(x, y);
      return;
    }
    if (B.state !== 'paint') return;
    const p = toPaper(x, y);
    const f = { colorKey, tool, last: p, start: B.t, startP: p, r: 22, dist: 0 };
    B.fingers[id] = f;
    if (tool === 'blob') stampBlob(f, p, 22);
    else if (tool === 'bubble') {
      const col = () => paintColor(colorKey, B.t);
      both((xx, yy) => bubbleCluster(pc, xx, yy, 26, col, colorKey === 'glitter'), p.x, p.y);
    } else {
      const col = paintColor(colorKey, B.t);
      both((xx, yy) => {
        pc.fillStyle = col;
        pc.beginPath();
        pc.arc(xx, yy, 13, 0, TAU);
        pc.fill();
      }, p.x, p.y);
    }
    B.dirty = true;
    B.changed = true;
  };

  B.move = function (id, x, y) {
    const f = B.fingers[id];
    if (!f || B.state !== 'paint') return;
    const p = toPaper(x, y);
    const dx = p.x - f.last.x;
    const dy = p.y - f.last.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 2) return;
    f.dist += d;
    if (f.tool === 'brush') {
      const col = paintColor(f.colorKey, B.t);
      const seg = (ax, ay, bx, by) => {
        pc.strokeStyle = col;
        pc.lineWidth = 26;
        pc.beginPath();
        pc.moveTo(ax, ay);
        pc.lineTo(bx, by);
        pc.stroke();
        if (f.colorKey === 'glitter' && Math.random() < 0.6) specks(pc, bx, by, 14, 2);
      };
      seg(f.last.x, f.last.y, p.x, p.y);
      if (B.mirror) seg(PW - f.last.x, f.last.y, PW - p.x, p.y);
      f.last = p;
    } else if (f.tool === 'bubble') {
      if (d > 24) {
        const col = () => paintColor(f.colorKey, B.t);
        both((xx, yy) => bubbleCluster(pc, xx, yy, 24, col, f.colorKey === 'glitter'), p.x, p.y);
        f.last = p;
      } else return;
    } else {
      // blobby line: drops along the way
      const r = 20;
      const n = Math.ceil(d / (r * 0.45));
      for (let i = 1; i <= n; i++) {
        stampBlob(f, { x: f.last.x + dx * i / n, y: f.last.y + dy * i / n }, r);
      }
      f.last = p;
      f.start = B.t;
      f.r = r;
    }
    B.dirty = true;
    B.changed = true;
  };

  B.up = function (id) { delete B.fingers[id]; };

  // a blob grows while the finger stays still
  function growBlobs() {
    for (const id in B.fingers) {
      const f = B.fingers[id];
      if (f.tool !== 'blob') continue;
      const held = B.t - f.start;
      if (held < 0.2) continue;
      const r = Math.min(80, 22 + (held - 0.2) * 45);
      if (r > f.r + 1.5) {
        f.r = r;
        stampBlob(f, f.last, r);
        B.dirty = true;
        B.changed = true;
      }
    }
  }

  // ---------------------------------------------------------------------
  // Fold, blot, cut and fly
  // ---------------------------------------------------------------------
  B.fold = function () {
    if (B.state !== 'paint') return false;
    B.fingers = {};
    B.state = 'fold';
    B.stateT = B.t;
    B.blotted = false;
    B.dirty = true;
    return true;
  };

  B.unmake = function () {
    B.state = 'paint';
    B.dirty = true;
  };

  function buildWings() {
    const cv = document.createElement('canvas');
    cv.width = PW;
    cv.height = PH;
    const c = cv.getContext('2d');
    butterflyPath(c, 0, 0, PW, PH);
    c.fillStyle = '#ffffff';
    c.fill();
    c.save();
    c.clip();
    c.drawImage(paint, 0, 0);
    c.restore();
    butterflyPath(c, 0, 0, PW, PH);
    c.lineWidth = 9;
    c.lineJoin = 'round';
    c.strokeStyle = INK;
    c.stroke();
    B.wings = cv;
  }

  B.update = function (dt) {
    B.t += dt;
    if (B.state === 'paint') growBlobs();
    if (B.state === 'fold') {
      const a = B.t - B.stateT;
      if (a > 0.85 && !B.blotted) {
        B.blotted = true;
        const out = blotMirror(paint);
        pc.clearRect(0, 0, PW, PH);
        pc.drawImage(out, 0, 0);
        B.changed = true;
        if (hooks.pressed) hooks.pressed();
      }
      if (a > 2.1) {
        buildWings();
        B.state = 'cut';
        B.stateT = B.t;
        if (hooks.cut) hooks.cut();
      }
    } else if (B.state === 'cut') {
      if (B.t - B.stateT > 1.2) {
        B.state = 'made';
        B.stateT = B.t;
        if (hooks.made) hooks.made();
      }
    }
    if (B.state === 'made') B.phase = (B.phase || 0) + (B.flutter > 0 ? 11 : 3.2) * dt;
    if (B.flutter > 0) B.flutter = Math.max(0, B.flutter - dt);
  };

  B.busy = () => B.state !== 'paint' || B.dirty;

  // ---------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------
  function paperShadow(c) {
    c.fillStyle = 'rgba(40, 10, 90, .22)';
    rrect(c, B.x + 4, B.y + 10, B.w, B.h, 18);
    c.fill();
  }

  function drawPaintState(c) {
    paperShadow(c);
    rrect(c, B.x, B.y, B.w, B.h, 18);
    c.fillStyle = '#ffffff';
    c.fill();
    c.save();
    c.clip();
    c.drawImage(paint, B.x, B.y, B.w, B.h);
    c.restore();
    // the butterfly to cut out (dashed) and the fold line (dotted)
    c.save();
    butterflyPath(c, B.x, B.y, B.w, B.h);
    c.setLineDash([10, 9]);
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(45, 36, 66, .38)';
    c.stroke();
    c.setLineDash([2, 10]);
    c.lineCap = 'round';
    c.lineWidth = B.mirror ? 7 : 5;
    c.strokeStyle = B.mirror ? 'rgba(255, 61, 154, .85)' : 'rgba(157, 92, 255, .7)';
    c.beginPath();
    c.moveTo(B.x + B.w / 2, B.y + 8);
    c.lineTo(B.x + B.w / 2, B.y + B.h - 8);
    c.stroke();
    c.restore();
    rrect(c, B.x, B.y, B.w, B.h, 18);
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(45, 36, 66, .25)';
    c.stroke();
  }

  function drawFold(c) {
    const a = B.t - B.stateT;
    // 0..0.8 fold over, 0.8..1.3 press, 1.3..2.1 open again
    let sx;
    if (a < 0.8) sx = Math.cos(Math.PI * ease(a / 0.8));
    else if (a < 1.3) sx = -1;
    else sx = Math.cos(Math.PI * (1 - ease(Math.min(1, (a - 1.3) / 0.8))));
    const press = a > 0.8 && a < 1.3 ? Math.sin((a - 0.8) / 0.5 * Math.PI) : 0;
    const half = B.w / 2;
    const fx = B.x + half;
    // left half (stays put)
    c.fillStyle = 'rgba(40, 10, 90, .22)';
    c.fillRect(B.x + 4, B.y + 10, half, B.h);
    c.save();
    c.translate(fx, B.y + B.h / 2);
    c.scale(1 - press * 0.02, 1 - press * 0.03);
    c.fillStyle = '#fff';
    c.fillRect(-half, -B.h / 2, half, B.h);
    c.drawImage(paint, 0, 0, PW / 2, PH, -half, -B.h / 2, half, B.h);
    c.restore();
    // right half: the flap
    c.save();
    c.translate(fx, B.y + B.h / 2);
    const lift = 1 + 0.08 * (1 - Math.abs(sx));
    c.scale(sx * (1 - press * 0.02), lift * (1 - press * 0.03));
    if (sx > 0) {
      c.fillStyle = '#fff';
      c.fillRect(0, -B.h / 2, half, B.h);
      c.drawImage(paint, PW / 2, 0, PW / 2, PH, 0, -B.h / 2, half, B.h);
    } else {
      // the back of the paper, with the paint showing through a little
      c.fillStyle = '#f3ecff';
      c.fillRect(0, -B.h / 2, half, B.h);
      c.globalAlpha = 0.14;
      c.drawImage(paint, PW / 2, 0, PW / 2, PH, 0, -B.h / 2, half, B.h);
      c.globalAlpha = 1;
    }
    c.fillStyle = `rgba(70, 30, 140, ${0.28 * (1 - Math.abs(sx))})`;
    c.fillRect(0, -B.h / 2, half, B.h);
    c.lineWidth = 2 / Math.max(0.05, Math.abs(sx));
    c.strokeStyle = 'rgba(45, 36, 66, .25)';
    c.strokeRect(0, -B.h / 2, half, B.h);
    c.restore();
  }

  function drawWings(c, open, bob) {
    const half = B.w / 2;
    const cx = B.x + half;
    const y = B.y + bob;
    [-1, 1].forEach((side) => {
      c.save();
      c.translate(cx, y + B.h / 2);
      c.scale(open, 1 - (1 - open) * 0.05);
      if (side < 0) c.drawImage(B.wings, 0, 0, PW / 2, PH, -half, -B.h / 2, half, B.h);
      else c.drawImage(B.wings, PW / 2, 0, PW / 2, PH, 0, -B.h / 2, half, B.h);
      c.restore();
    });
  }

  B.draw = function (c, dpr) {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (B.state === 'paint') drawPaintState(c);
    else if (B.state === 'fold') drawFold(c);
    else if (B.state === 'cut') {
      const a = Math.min(1, (B.t - B.stateT) / 1.0);
      // the paper around the butterfly falls away
      c.save();
      c.globalAlpha = 1 - a;
      c.translate(0, a * a * 40);
      c.fillStyle = '#fff';
      rrect(c, B.x, B.y, B.w, B.h, 18);
      c.fill();
      c.drawImage(paint, B.x, B.y, B.w, B.h);
      c.restore();
      drawWings(c, 1, 0);
      c.globalAlpha = a;
      drawBody(c, B.x + B.w / 2, B.y, B.w, B.h, B.t);
      c.globalAlpha = 1;
      // the scissors travel round the outline
      const sa = (B.t - B.stateT) * 6;
      c.font = `${Math.round(34 * B.k * 2)}px sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      if (a < 1) c.fillText('✂️', B.x + B.w / 2 + Math.cos(sa) * B.w * 0.42, B.y + B.h / 2 + Math.sin(sa) * B.h * 0.42);
    } else {
      const age = B.t - B.stateT;
      const open = 0.62 + 0.38 * (0.5 + 0.5 * Math.cos(B.phase));
      const bob = Math.sin(B.t * 1.7) * 8 * B.k * 2 - Math.min(1, age) * 6;
      drawWings(c, open, bob);
      drawBody(c, B.x + B.w / 2, B.y + bob, B.w, B.h, B.t);
    }
    B.dirty = false;
  };

  /** The picture to save: the paper, or the finished butterfly on a sky. */
  B.exportCanvas = function () {
    const cv = document.createElement('canvas');
    if (B.state === 'made' && B.wings) {
      cv.width = PW + 120;
      cv.height = PH + 120;
      const c = cv.getContext('2d');
      const g = c.createLinearGradient(0, 0, 0, cv.height);
      g.addColorStop(0, '#d6f1ff');
      g.addColorStop(1, '#ffe3f4');
      c.fillStyle = g;
      c.fillRect(0, 0, cv.width, cv.height);
      c.drawImage(B.wings, 60, 60);
      drawBody(c, 60 + PW / 2, 60, PW, PH, 0);
      return cv;
    }
    cv.width = PW;
    cv.height = PH;
    const c = cv.getContext('2d');
    c.fillStyle = '#fff';
    c.fillRect(0, 0, PW, PH);
    c.drawImage(paint, 0, 0);
    return cv;
  };

  B.snapshot = function () {
    try { return paint.toDataURL('image/png'); } catch (err) { return ''; }
  };
  B.restore = function (url) {
    if (!url) return;
    const img = new Image();
    img.onload = () => { pc.drawImage(img, 0, 0, PW, PH); B.dirty = true; };
    img.src = url;
  };

  return B;
}

function rrect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}
