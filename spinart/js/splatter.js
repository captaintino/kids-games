// Splatter: fling paint at the paper. A tap makes a round splat with little drops
// around it, a fast flick throws a long streak with droplets flying on ahead, and a
// held finger makes a dribble: a puddle with drips running down the paper (move it
// slowly to drizzle a line).
import { paintColor, specks, blob, splat, streak } from './paint.js';

const TAU = Math.PI * 2;
export const SP = 800;    // paper size (square, in paper pixels)
const HOLD = 0.28;        // seconds a finger stays still before it starts to dribble
const FLICK = 380;        // screen px per second that counts as a throw

export function createSplatter(hooks) {
  const paper = document.createElement('canvas');
  paper.width = paper.height = SP;
  const pc = paper.getContext('2d');
  pc.lineCap = 'round';
  pc.lineJoin = 'round';

  const U = {
    paper,
    fingers: {},
    flyers: [],     // paint in the air (screen coordinates)
    drips: [],      // paint running down the paper (paper coordinates)
    x: 0, y: 0, s: 100, k: 1,
    t: 0,
    changed: false,
    dirty: true,
    unit: 1,
  };

  function clearPaper() {
    pc.fillStyle = '#fff';
    pc.fillRect(0, 0, SP, SP);
    U.flyers = [];
    U.drips = [];
  }
  clearPaper();
  U.clear = function () { clearPaper(); U.changed = true; U.dirty = true; };

  U.layout = function (w, h, dpr, unit) {
    const m = 14;
    U.s = Math.max(80, Math.min(w, h) - m * 2);
    U.k = U.s / SP;
    U.x = (w - U.s) / 2;
    U.y = (h - U.s) / 2;
    U.unit = unit || 1;
    U.dirty = true;
  };

  const toPaper = (x, y) => ({ x: (x - U.x) / U.k, y: (y - U.y) / U.k });
  U.onPaper = (x, y) => x >= U.x - 24 && x <= U.x + U.s + 24 && y >= U.y - 24 && y <= U.y + U.s + 24;

  // ---------------------------------------------------------------------
  // Painting on the paper
  // ---------------------------------------------------------------------
  function roundSplat(x, y, colorKey, size) {
    const p = toPaper(x, y);
    const r = size || 26 + Math.random() * 16;
    splat(pc, p.x, p.y, r, paintColor(colorKey, U.t), colorKey === 'glitter');
    U.changed = true;
    U.dirty = true;
    if (hooks.splat) hooks.splat(x, y, r / 40);
  }

  /** Throw paint from (x, y) along (vx, vy) screen px/s. */
  function fling(x, y, vx, vy, colorKey) {
    const sp = Math.sqrt(vx * vx + vy * vy) || 1;
    const ux = vx / sp;
    const uy = vy / sp;
    const power = Math.min(1, (sp - FLICK * 0.6) / 2400);
    const color = paintColor(colorKey, U.t);
    const glitter = colorKey === 'glitter';
    // the big glob lands a little ahead of the finger and stretches out from there
    const reach = U.s * (0.06 + power * 0.16);
    const len = (60 + power * 220) * (0.85 + Math.random() * 0.3);
    U.flyers.push({
      kind: 'glob', x0: x, y0: y, x1: x + ux * reach, y1: y + uy * reach, t: 0, dur: 0.1 + power * 0.06,
      r: 22 + power * 10 + Math.random() * 6, ux, uy, len, color, glitter,
    });
    // spray: drops flying further on, a little fanned out
    const n = 4 + Math.round(power * 5);
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(uy, ux) + (Math.random() - 0.5) * 0.5;
      const d = reach + U.k * len * (0.9 + Math.random() * 1.3);
      U.flyers.push({
        kind: 'drop', x0: x, y0: y, x1: x + Math.cos(a) * d, y1: y + Math.sin(a) * d,
        t: 0, dur: 0.14 + Math.random() * 0.14, r: 3 + Math.random() * 7, ux: Math.cos(a), uy: Math.sin(a), color, glitter,
      });
    }
    U.dirty = true;
    if (hooks.throw) hooks.throw(power);
  }

  function land(f) {
    const p = toPaper(f.x1, f.y1);
    if (f.kind === 'glob') {
      streak(pc, p.x, p.y, f.ux, f.uy, f.len, f.r, f.color, f.glitter);
      if (hooks.splat) hooks.splat(f.x1, f.y1, 0.8 + f.r / 40);
    } else {
      pc.fillStyle = f.color;
      pc.beginPath();
      pc.ellipse(p.x, p.y, f.r * 1.6, f.r, Math.atan2(f.uy, f.ux), 0, TAU);
      pc.fill();
      if (f.glitter && Math.random() < 0.5) specks(pc, p.x, p.y, f.r * 2, 2);
    }
    U.changed = true;
  }

  // a held finger: the puddle grows and drips run down from it
  function dribbleAt(f, dt) {
    const p = toPaper(f.x, f.y);
    f.held += dt;
    const grow = Math.min(46, 12 + f.held * 22);
    if (!f.lastP) {
      f.lastP = p;
      blob(pc, p.x, p.y, 12, paintColor(f.colorKey, U.t), Math.random() * 10);
    }
    const dx = p.x - f.lastP.x;
    const dy = p.y - f.lastP.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const col = paintColor(f.colorKey, U.t);
    if (d > 3) {
      // drizzle: a wobbly line of paint following the finger
      pc.strokeStyle = col;
      pc.lineWidth = 9 + Math.random() * 5;
      pc.beginPath();
      pc.moveTo(f.lastP.x, f.lastP.y);
      pc.lineTo(p.x, p.y);
      pc.stroke();
      if (Math.random() < d / 60) {
        pc.fillStyle = col;
        pc.beginPath();
        pc.arc(p.x + (Math.random() - 0.5) * 8, p.y + (Math.random() - 0.5) * 8, 6 + Math.random() * 6, 0, TAU);
        pc.fill();
      }
      if (f.colorKey === 'glitter' && Math.random() < 0.5) specks(pc, p.x, p.y, 10, 2);
      f.lastP = p;
      f.puddle = 10;
    } else if (grow > f.puddle + 1.5) {
      f.puddle = grow;
      blob(pc, p.x, p.y, grow, col, f.seed);
      if (f.colorKey === 'glitter' && Math.random() < 0.4) specks(pc, p.x, p.y, grow, 2);
    }
    // drips run down from the bottom of the puddle
    f.dripClock -= dt;
    if (f.dripClock <= 0 && U.drips.length < 24) {
      f.dripClock = 0.35 + Math.random() * 0.45;
      const w = 4 + Math.random() * 5 + f.puddle * 0.08;
      U.drips.push({
        x: p.x + (Math.random() - 0.5) * f.puddle * 1.1, y: p.y + f.puddle * 0.5,
        w, v: 30 + Math.random() * 40, left: 70 + Math.random() * 150, color: col, glitter: f.colorKey === 'glitter',
      });
      if (hooks.drip) hooks.drip();
    }
    U.changed = true;
    U.dirty = true;
  }

  function runDrips(dt) {
    if (!U.drips.length) return;
    pc.lineCap = 'round';
    U.drips = U.drips.filter((d) => {
      const step = Math.min(d.left, d.v * dt);
      const wob = Math.sin(d.y * 0.08) * 0.6;
      pc.strokeStyle = d.color;
      pc.lineWidth = d.w;
      pc.beginPath();
      pc.moveTo(d.x, d.y);
      d.x += wob * step * 0.05;
      d.y += step;
      pc.lineTo(d.x, d.y);
      pc.stroke();
      d.left -= step;
      d.v *= 1 - dt * 0.6;
      U.changed = true;
      if (d.left <= 0.5 || d.v < 6 || d.y > SP) {
        // a little bead where the drip stops
        pc.fillStyle = d.color;
        pc.beginPath();
        pc.arc(d.x, d.y, d.w * 0.85, 0, TAU);
        pc.fill();
        if (d.glitter) specks(pc, d.x, d.y, d.w * 2, 2);
        return false;
      }
      return true;
    });
    U.dirty = true;
  }

  // ---------------------------------------------------------------------
  // Fingers: tap, flick or hold
  // ---------------------------------------------------------------------
  U.down = function (id, x, y, colorKey) {
    U.fingers[id] = {
      colorKey, x, y, x0: x, y0: y, t0: U.t, mode: 'wait', held: 0, lastP: null, puddle: 0,
      dripClock: 0.25, seed: Math.random() * 10, trail: [{ x, y, t: U.t }],
    };
  };
  U.move = function (id, x, y) {
    const f = U.fingers[id];
    if (!f) return;
    f.x = x;
    f.y = y;
    f.trail.push({ x, y, t: U.t });
    if (f.trail.length > 8) f.trail.shift();
    if (f.mode === 'wait') {
      const dx = x - f.x0;
      const dy = y - f.y0;
      if (dx * dx + dy * dy > 18 * 18 * U.unit * U.unit) f.mode = 'flick';
    }
  };
  function speedOf(f) {
    // finger speed over the last ~0.1 s
    const tr = f.trail;
    const last = tr[tr.length - 1];
    let first = tr[0];
    for (let i = tr.length - 2; i >= 0; i--) {
      first = tr[i];
      if (last.t - tr[i].t > 0.1) break;
    }
    const dt = Math.max(0.016, last.t - first.t);
    return { vx: (last.x - first.x) / dt, vy: (last.y - first.y) / dt };
  }
  U.up = function (id) {
    const f = U.fingers[id];
    if (!f) return;
    delete U.fingers[id];
    if (f.mode === 'wait') {
      if (U.onPaper(f.x0, f.y0)) roundSplat(f.x0, f.y0, f.colorKey);
    } else if (f.mode === 'flick') {
      const v = speedOf(f);
      const sp = Math.sqrt(v.vx * v.vx + v.vy * v.vy);
      if (sp > FLICK) fling(f.x, f.y, v.vx, v.vy, f.colorKey);
      else if (U.onPaper(f.x, f.y)) roundSplat(f.x, f.y, f.colorKey, 20 + Math.random() * 10);
    }
  };

  /** 💥: throw a splat from somewhere on the paper. */
  U.randomFling = function (colorKey) {
    const x = U.x + U.s * (0.15 + Math.random() * 0.7);
    const y = U.y + U.s * (0.15 + Math.random() * 0.7);
    // throw roughly toward the middle so the paint stays on the paper
    const a = Math.atan2(U.y + U.s / 2 - y, U.x + U.s / 2 - x) + (Math.random() - 0.5) * 1.6;
    const sp = 900 + Math.random() * 1500;
    fling(x, y, Math.cos(a) * sp, Math.sin(a) * sp, colorKey);
  };

  // ---------------------------------------------------------------------
  // Frame
  // ---------------------------------------------------------------------
  U.update = function (dt) {
    U.t += dt;
    for (const id in U.fingers) {
      const f = U.fingers[id];
      if (f.mode === 'wait' && U.t - f.t0 > HOLD) {
        f.mode = U.onPaper(f.x, f.y) ? 'hold' : 'off';
        if (f.mode === 'hold' && hooks.drip) hooks.drip();
      }
      // a slow drag that never flicked becomes a drizzle
      if (f.mode === 'flick' && U.t - f.t0 > 0.45) {
        const v = speedOf(f);
        if (v.vx * v.vx + v.vy * v.vy < 250 * 250) { f.mode = 'hold'; f.lastP = null; }
      }
      if (f.mode === 'hold' && U.onPaper(f.x, f.y)) dribbleAt(f, dt);
    }
    if (U.flyers.length) {
      U.flyers = U.flyers.filter((f) => {
        f.t += dt;
        if (f.t >= f.dur) { land(f); return false; }
        return true;
      });
      U.dirty = true;
    }
    runDrips(dt);
  };

  U.busy = function () {
    if (U.dirty || U.flyers.length || U.drips.length) return true;
    for (const id in U.fingers) if (U.fingers[id].mode === 'hold') return true;
    return false;
  };

  U.draw = function (c, dpr) {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = 'rgba(40, 10, 90, .22)';
    c.fillRect(U.x + 4, U.y + 10, U.s, U.s);
    c.drawImage(paper, U.x, U.y, U.s, U.s);
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(45, 36, 66, .25)';
    c.strokeRect(U.x, U.y, U.s, U.s);
    // paint in the air: a glob that stretches as it flies
    for (const f of U.flyers) {
      const k = f.t / f.dur;
      const e = 1 - (1 - k) * (1 - k);
      const x = f.x0 + (f.x1 - f.x0) * e;
      const y = f.y0 + (f.y1 - f.y0) * e;
      const r = (f.kind === 'glob' ? f.r * 0.7 : f.r) * U.k * (1.25 - k * 0.25);
      c.fillStyle = f.color;
      c.beginPath();
      c.ellipse(x, y, r * (1 + k * 0.8), r * (1 - k * 0.2), Math.atan2(f.uy, f.ux), 0, TAU);
      c.fill();
      if (f.kind === 'glob') {
        c.fillStyle = 'rgba(255,255,255,.6)';
        c.beginPath();
        c.arc(x - r * 0.3, y - r * 0.35, r * 0.28, 0, TAU);
        c.fill();
      }
    }
    U.dirty = false;
  };

  U.exportCanvas = function () {
    const cv = document.createElement('canvas');
    cv.width = cv.height = SP;
    cv.getContext('2d').drawImage(paper, 0, 0);
    return cv;
  };
  U.snapshot = function () {
    try { return paper.toDataURL('image/jpeg', 0.82); } catch (err) { return ''; }
  };
  U.restore = function (url) {
    if (!url) return;
    const img = new Image();
    img.onload = () => { pc.drawImage(img, 0, 0, SP, SP); U.changed = true; U.dirty = true; };
    img.src = url;
  };
  return U;
}
