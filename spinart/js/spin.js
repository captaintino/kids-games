// Spin Paint: a round paper disc spins; touching it drips paint, which lands in
// the disc's own (turning) frame and gets flung outward into spiral streaks.
//
// The paint lives in a canvas in disc coordinates, so it sticks to the paper.
// Nothing is redrawn while the disc turns: the turntable and the paper are their own
// layers on the page, turned with a CSS transform (the browser's compositor does the
// spinning), and the paper canvas only changes where paint lands. The shadow under
// the turntable and the rim + centre pin on top are drawn once into small canvases.
import { paintColor, specks, bubbleCluster, blob, pictureLayer, drawAt, setTransform } from './paint.js';

const TAU = Math.PI * 2;
const INK = '#2d2442';
export const SPEEDS = [0, 2.6, 5.6, 10.5];   // radians per second: stop, slow, medium, fast

export function createSpin(P) {
  const paint = document.createElement('canvas');
  paint.width = paint.height = P;
  const pc = paint.getContext('2d');
  const R = P / 2;
  // paint never leaves the round paper
  pc.save();
  pc.beginPath();
  pc.arc(R, R, R - 1, 0, TAU);
  pc.clip();
  pc.lineCap = 'round';
  pc.lineJoin = 'round';

  const S = {
    paint,
    angle: 0,
    omega: 0,
    target: SPEEDS[2],
    blobs: [],
    fingers: {},
    cx: 0, cy: 0, r: 100,     // on screen (CSS px)
    hub: null,
    dropT: -9,                // for the "new paper" bounce
    changed: false,
    t: 0,
    usesStage: false,         // everything is drawn in the layers below
  };

  // the layers, bottom to top: shadow, turntable, paper, rim + pin
  const shadowL = pictureLayer();
  const platterL = pictureLayer(true);
  const topL = pictureLayer();
  paint.className = 'layer moving';
  S.layers = [shadowL.el, platterL.el, paint, topL.el];
  let shownAngle = NaN;
  let shownBounce = NaN;

  function clearPaper() {
    pc.globalCompositeOperation = 'source-over';
    pc.globalAlpha = 1;
    pc.fillStyle = '#ffffff';
    pc.fillRect(0, 0, P, P);
    // the faintest paper texture
    pc.globalAlpha = 0.035;
    pc.fillStyle = '#7b5cff';
    for (let i = 0; i < 220; i++) {
      pc.beginPath();
      pc.arc(Math.random() * P, Math.random() * P, Math.random() * 2 + 0.5, 0, TAU);
      pc.fill();
    }
    pc.globalAlpha = 1;
    S.blobs = [];
  }
  clearPaper();

  S.clear = function () {
    clearPaper();
    S.dropT = S.t;
    S.changed = true;
  };

  S.setSpeed = function (i) { S.target = SPEEDS[i] || 0; };

  // ---------------------------------------------------------------------
  // Layout and cached sprites
  // ---------------------------------------------------------------------
  S.layout = function (w, h, dpr) {
    S.cx = w / 2;
    S.cy = h / 2;
    S.r = Math.max(60, Math.min(w, h) / 2 / 1.1 - 6);
    const pr = S.r * 1.09;
    const size = Math.ceil(pr * 2 + 8);
    // the turntable: a candy-colored ring with dots, so you can see it turn
    platterL.draw(size, size, dpr, (c) => {
      c.translate(size / 2, size / 2);
      const segs = 12;
      const cols = ['#ff4d5e', '#ff9a2e', '#ffd93b', '#5cd65c', '#22c7b8', '#3d7bff', '#9d5cff', '#ff7ac6'];
      for (let i = 0; i < segs; i++) {
        c.beginPath();
        c.moveTo(0, 0);
        c.arc(0, 0, pr, (i / segs) * TAU, ((i + 1) / segs) * TAU);
        c.closePath();
        c.fillStyle = cols[i % cols.length];
        c.fill();
      }
      c.beginPath();
      c.arc(0, 0, pr, 0, TAU);
      c.lineWidth = Math.max(4, pr * 0.025);
      c.strokeStyle = INK;
      c.stroke();
      for (let i = 0; i < segs; i++) {
        const a = ((i + 0.5) / segs) * TAU;
        c.beginPath();
        c.arc(Math.cos(a) * (pr - (pr - S.r) / 2), Math.sin(a) * (pr - (pr - S.r) / 2), Math.max(2, (pr - S.r) * 0.28), 0, TAU);
        c.fillStyle = '#fff';
        c.fill();
      }
    });
    S.platterSize = size;
    // the centre pin
    const hs = Math.ceil(S.r * 0.24);
    S.hub = document.createElement('canvas');
    S.hub.width = S.hub.height = Math.ceil(hs * dpr);
    const hc = S.hub.getContext('2d');
    hc.setTransform(dpr, 0, 0, dpr, hs / 2 * dpr, hs / 2 * dpr);
    const hr = hs * 0.34;
    const g = hc.createRadialGradient(-hr * 0.3, -hr * 0.3, hr * 0.1, 0, 0, hr);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.35, '#ffb3dc');
    g.addColorStop(1, '#ff3d9a');
    hc.beginPath();
    hc.arc(0, 0, hr, 0, TAU);
    hc.fillStyle = g;
    hc.fill();
    hc.lineWidth = Math.max(2.5, hr * 0.16);
    hc.strokeStyle = INK;
    hc.stroke();
    S.hubSize = hs;

    S.dpr = dpr;
    // the soft shadow under the turntable
    const sr = S.r * 1.1;
    const sy = S.cy + S.r * 0.08;
    drawAt(shadowL, S.cx - sr - 1, sy - sr - 1, sr * 2 + 2, sr * 2 + 2, dpr, (c) => {
      c.fillStyle = 'rgba(40, 10, 90, .22)';
      c.beginPath();
      c.ellipse(S.cx, sy, sr, sr, 0, 0, TAU);
      c.fill();
    });
    // the rim and the centre pin, on top of the paper
    drawAt(topL, S.cx - size / 2, S.cy - size / 2, size, size, dpr, (c) => drawTop(c, 1));
    // the paper turns about the centre (the turntable too, see render)
    paint.style.width = paint.style.height = `${S.r * 2}px`;
    shownAngle = NaN;
    shownBounce = 1;
    S.render();
  };

  function drawTop(c, bounce) {
    // a soft rim so the paper looks round and a little raised
    c.beginPath();
    c.arc(S.cx, S.cy, S.r * bounce, 0, TAU);
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(45, 36, 66, .35)';
    c.stroke();
    const hs = S.hubSize;
    c.drawImage(S.hub, S.cx - hs / 2, S.cy - hs / 2, hs, hs);
  }

  /** Turn the layers to the current angle (only touches what changed). */
  S.render = function () {
    if (!S.hub) return;
    const age = S.t - S.dropT;
    const bounce = age < 0.6 ? 1 + 0.08 * Math.sin(age * 16) * Math.exp(-age * 6) : 1;
    if (S.angle !== shownAngle || bounce !== shownBounce) {
      const rot = `translate(${S.cx.toFixed(2)}px,${S.cy.toFixed(2)}px) rotate(${(S.angle * 180 / Math.PI).toFixed(3)}deg)`;
      const ps = S.platterSize;
      setTransform(platterL.el, `${rot} translate(${(-ps / 2).toFixed(2)}px,${(-ps / 2).toFixed(2)}px)`);
      setTransform(paint, `${rot} scale(${bounce.toFixed(4)}) translate(${(-S.r).toFixed(2)}px,${(-S.r).toFixed(2)}px)`);
      shownAngle = S.angle;
    }
    if (bounce !== shownBounce) {
      if (!isNaN(shownBounce)) {
        // the rim bounces with the new paper: redraw it while it moves
        const cv = topL.live();
        const c = cv.getContext('2d');
        const dpr = S.dpr;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, cv.width, cv.height);
        c.setTransform(dpr, 0, 0, dpr, -topL.x * dpr, -topL.y * dpr);
        drawTop(c, bounce);
        if (bounce === 1) topL.still();
      }
      shownBounce = bounce;
    }
  };

  // ---------------------------------------------------------------------
  // Fingers drip paint
  // ---------------------------------------------------------------------
  /** Screen point -> paper (disc) coordinates. */
  function toDisc(x, y) {
    const dx = x - S.cx;
    const dy = y - S.cy;
    const ca = Math.cos(-S.angle);
    const sa = Math.sin(-S.angle);
    const k = R / S.r;
    return { x: R + (dx * ca - dy * sa) * k, y: R + (dx * sa + dy * ca) * k };
  }
  S.onDisc = function (x, y) {
    const dx = x - S.cx;
    const dy = y - S.cy;
    return dx * dx + dy * dy <= S.r * S.r * 1.04;
  };

  function newBlob(x, y, vol, color, glitter) {
    if (S.blobs.length > 170) S.blobs.shift();
    S.blobs.push({ x, y, vx: 0, vy: 0, vol, color, glitter, age: 0 });
  }

  /** Paint lands at a disc point. */
  function drip(f, d, big) {
    const color = paintColor(f.colorKey, S.t);
    const glitter = f.colorKey === 'glitter';
    if (f.tool === 'bubble') {
      bubbleCluster(pc, d.x, d.y, P * 0.03, () => paintColor(f.colorKey, S.t), glitter);
      S.changed = true;
      return;
    }
    const r = P * (big ? 0.03 : 0.02);
    blob(pc, d.x, d.y, r, color, Math.random() * 10);
    if (glitter) specks(pc, d.x, d.y, r, 3);
    newBlob(d.x, d.y, big ? 1 : 0.7, color, glitter);
    S.changed = true;
  }

  S.down = function (id, x, y, colorKey, tool) {
    const on = S.onDisc(x, y);
    const d = toDisc(x, y);
    const f = { colorKey, tool, last: on ? d : null, lastT: S.t, sx: x, sy: y };
    S.fingers[id] = f;
    if (on) drip(f, d, true);
    return on;
  };
  // the page's stage canvas is not used by Spin Paint (the layers show everything)
  S.busy = function () { return false; };
  S.move = function (id, x, y) {
    const f = S.fingers[id];
    if (f) { f.sx = x; f.sy = y; }
  };
  S.up = function (id) { delete S.fingers[id]; };

  // while a finger stays down, the paper turns under it: keep dripping
  function feedFingers() {
    for (const id in S.fingers) {
      const f = S.fingers[id];
      if (!S.onDisc(f.sx, f.sy)) { f.last = null; continue; }
      const d = toDisc(f.sx, f.sy);
      if (f.tool === 'bubble') {
        if (S.t - f.lastT > 0.09) { f.lastT = S.t; drip(f, d, false); }
        f.last = d;
        continue;
      }
      // a continuous trickle between the last spot and this one
      if (f.last) {
        const dx = d.x - f.last.x;
        const dy = d.y - f.last.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.5) {
          const col = paintColor(f.colorKey, S.t);
          pc.strokeStyle = col;
          pc.lineWidth = P * 0.024;
          pc.beginPath();
          pc.moveTo(f.last.x, f.last.y);
          pc.lineTo(d.x, d.y);
          pc.stroke();
          if (f.colorKey === 'glitter' && Math.random() < 0.5) specks(pc, d.x, d.y, P * 0.015, 2);
          S.changed = true;
        }
      }
      f.last = d;
      if (S.t - f.lastT > 0.075) {
        f.lastT = S.t;
        drip(f, d, false);
      }
    }
  }

  // ---------------------------------------------------------------------
  // Paint physics in the turning frame: centrifugal + Coriolis + drag
  // ---------------------------------------------------------------------
  const K = 1.6;       // how strongly spinning pushes paint outward
  const DRAG = 18;     // how much the paper holds the paint back
  function simulate(dt) {
    const w = S.omega;
    const steps = Math.min(6, Math.max(1, Math.ceil(dt / 0.008)));
    const h = dt / steps;
    const keep = [];
    for (const b of S.blobs) {
      const ox = b.x;
      const oy = b.y;
      const startVol = b.vol;
      pc.beginPath();
      pc.moveTo(ox, oy);
      let alive = true;
      for (let s = 0; s < steps && alive; s++) {
        const rx = b.x - R;
        const ry = b.y - R;
        const ax = K * w * w * rx + 2 * w * b.vy - DRAG * b.vx;
        const ay = K * w * w * ry - 2 * w * b.vx - DRAG * b.vy;
        b.vx += ax * h;
        b.vy += ay * h;
        const mx = b.vx * h;
        const my = b.vy * h;
        b.x += mx;
        b.y += my;
        const dist = Math.sqrt(mx * mx + my * my);
        // paint soaks into the paper as it goes, and as time passes
        b.vol -= dist / (P * 0.95) + h * (w > 0.3 ? 0.55 : 0.03);
        pc.lineTo(b.x, b.y);
        const rr = Math.sqrt((b.x - R) * (b.x - R) + (b.y - R) * (b.y - R));
        if (rr > R * 0.975) { splat(b); alive = false; }
        // fast drops throw off tiny droplets
        const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (sp > P * 0.5 && b.vol > 0.25 && Math.random() < h * 5 && S.blobs.length < 170) {
          const a = Math.atan2(b.vy, b.vx) + (Math.random() - 0.5) * 0.8;
          keep.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp * 1.3, vy: Math.sin(a) * sp * 1.3, vol: 0.12, color: b.color, glitter: b.glitter, age: 0 });
          b.vol -= 0.05;
        }
        if (b.vol <= 0.04) alive = false;
      }
      const moved = Math.abs(b.x - ox) + Math.abs(b.y - oy);
      if (moved > 0.3) {
        pc.strokeStyle = b.color;
        pc.lineWidth = P * 0.03 * (0.25 + 0.75 * Math.sqrt(Math.max(0, startVol)));
        pc.stroke();
        if (b.glitter && Math.random() < 0.6) specks(pc, b.x, b.y, P * 0.012, 1);
        S.changed = true;
      }
      // a still drop on a stopped disc just stays a drop
      if (alive && (w > 0.3 || moved > 0.3)) keep.push(b);
      else if (alive && w <= 0.3) { b.vx = 0; b.vy = 0; keep.push(b); }
    }
    // drops sitting on a stopped disc wait for it to spin again (but not forever)
    S.blobs = keep.filter((b) => (b.age += dt) < 30);
  }

  // paint flying off the edge leaves a splash just inside it
  function splat(b) {
    const a = Math.atan2(b.y - R, b.x - R);
    const n = 2 + Math.floor(Math.random() * 4);
    pc.fillStyle = b.color;
    for (let i = 0; i < n; i++) {
      const aa = a + (Math.random() - 0.5) * 0.18;
      const rr = R * (0.9 + Math.random() * 0.08);
      const s = P * (0.003 + Math.random() * 0.009) * (0.5 + b.vol);
      pc.beginPath();
      pc.arc(R + Math.cos(aa) * rr, R + Math.sin(aa) * rr, s, 0, TAU);
      pc.fill();
    }
    if (b.glitter) specks(pc, b.x, b.y, P * 0.02, 2);
  }

  // ---------------------------------------------------------------------
  // Frame
  // ---------------------------------------------------------------------
  S.update = function (dt) {
    S.t += dt;
    S.omega += (S.target - S.omega) * Math.min(1, dt * 2.2);
    if (Math.abs(S.omega - S.target) < 0.01) S.omega = S.target;
    S.angle = (S.angle + S.omega * dt) % TAU;
    feedFingers();
    simulate(dt);
    S.render();
  };

  S.draw = function () {};

  /** The painting as a picture to save. */
  S.exportCanvas = function () {
    const pad = Math.round(P * 0.06);
    const cv = document.createElement('canvas');
    cv.width = cv.height = P + pad * 2;
    const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, cv.height);
    g.addColorStop(0, '#fbe9ff');
    g.addColorStop(1, '#e3f3ff');
    c.fillStyle = g;
    c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = 'rgba(60, 20, 120, .18)';
    c.beginPath();
    c.arc(cv.width / 2, cv.height / 2 + pad * 0.25, R, 0, TAU);
    c.fill();
    c.drawImage(paint, pad, pad);
    return cv;
  };

  /** For saving progress: the paper on white, as a JPEG. */
  S.snapshot = function () {
    try { return paint.toDataURL('image/jpeg', 0.8); } catch (err) { return ''; }
  };
  S.restore = function (url, done) {
    if (!url) return;
    const img = new Image();
    img.onload = () => { pc.drawImage(img, 0, 0, P, P); S.changed = true; if (done) done(); };
    img.src = url;
  };

  return S;
}
