// The dirt, foam, water and sparkles on the vehicle, as canvas layers.
//
// Four offscreen layers are stacked into one visible canvas over the vehicle
// drawing: mud (M), foam (F), water beads (B) and sparkles (S). Everything is
// clipped to the vehicle's silhouette (SIL, with holes for the eyes so they
// always show). Rubbing only redraws the small area under the finger, so
// nothing runs per frame unless a finger is moving (or the short shine sweep).
//
// Progress is counted on a coarse grid of 10 x 10 unit cells over the vehicle:
// a step is as far along as the share of the vehicle's cells it has touched.
import { VW, VH } from './vehicles.js';

export const CELL = 10;
export const GX = VW / CELL;
export const GY = VH / CELL;
export const STEP_IDS = ['soap', 'rinse', 'dry', 'shine'];

const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function createWash(out) {
  const og = out.getContext('2d');
  const W = {
    iw: 0, ih: 0, k: 1,
    M: null, F: null, B: null, S: null, SIL: null,
    inside: new Uint8Array(GX * GY),
    total: 1,
    marks: {},
    counts: {},
  };

  function ctx(c) { return c.getContext('2d'); }

  /** Size the layers and load the silhouette. `img` is the clean vehicle drawn as an image. */
  W.init = function init(img, iw, eyes) {
    W.iw = iw;
    W.ih = Math.round((iw * VH) / VW);
    W.k = iw / VW;
    out.width = W.iw;
    out.height = W.ih;
    ['M', 'F', 'B', 'S', 'SIL'].forEach((key) => {
      if (!W[key]) W[key] = canvas(W.iw, W.ih);
      W[key].width = W.iw;
      W[key].height = W.ih;
    });
    const sc = ctx(W.SIL);
    sc.drawImage(img, 0, 0, W.iw, W.ih);
    // holes for the eyes: nothing ever covers them
    sc.globalCompositeOperation = 'destination-out';
    eyes.forEach((e) => {
      sc.beginPath();
      sc.arc(e.x * W.k, e.y * W.k, (e.r + 3) * W.k, 0, TAU);
      sc.fill();
    });
    sc.globalCompositeOperation = 'source-over';
    findInside(img);
    STEP_IDS.forEach((s) => { W.marks[s] = new Uint8Array(GX * GY); W.counts[s] = 0; });
    drawMud();
    W.compose();
  };

  // Which grid cells belong to the vehicle (read from a tiny copy of the silhouette).
  function findInside(img) {
    const c = canvas(GX * 2, GY * 2);
    const x = ctx(c);
    let total = 0;
    try {
      x.drawImage(W.SIL, 0, 0, GX * 2, GY * 2);
      const d = x.getImageData(0, 0, GX * 2, GY * 2).data;
      for (let j = 0; j < GY; j++) {
        for (let i = 0; i < GX; i++) {
          let a = 0;
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) a += d[(((j * 2 + dy) * GX * 2) + i * 2 + dx) * 4 + 3];
          }
          const on = a / 4 > 110 ? 1 : 0;
          W.inside[j * GX + i] = on;
          total += on;
        }
      }
    } catch (err) {
      // could not read the pixels: a rough oval instead
      for (let j = 0; j < GY; j++) {
        for (let i = 0; i < GX; i++) {
          const u = ((i + 0.5) / GX - 0.5) * 2;
          const v = ((j + 0.5) / GY - 0.55) * 2.3;
          const on = u * u + v * v < 1 ? 1 : 0;
          W.inside[j * GX + i] = on;
          total += on;
        }
      }
    }
    W.total = Math.max(1, total);
  }

  function randomInside() {
    for (let t = 0; t < 60; t++) {
      const c = Math.floor(Math.random() * GX * GY);
      if (W.inside[c]) return { x: ((c % GX) + Math.random()) * CELL, y: (Math.floor(c / GX) + Math.random()) * CELL };
    }
    return { x: VW / 2, y: VH / 2 };
  }

  // ---------------------------------------------------------------------------
  // Mud
  // ---------------------------------------------------------------------------
  const MUDS = ['#8a5a2b', '#7a4a22', '#9c6a38', '#6e4420'];
  function splat(c, x, y, r, col) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
    const n = 7 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.3, 0.3);
      const d = r * rand(0.75, 1.15);
      c.beginPath();
      c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * rand(0.22, 0.45), 0, TAU);
      c.fill();
    }
    // flung drops
    for (let i = 0; i < 5; i++) {
      const a = rand(0, TAU);
      const d = r * rand(1.4, 2.1);
      c.beginPath();
      c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * rand(0.08, 0.16), 0, TAU);
      c.fill();
    }
    // drips running down
    const drips = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < drips; i++) {
      const dx = x + rand(-r * 0.7, r * 0.7);
      const w = r * rand(0.16, 0.26);
      const len = r * rand(0.8, 1.7);
      c.beginPath();
      c.moveTo(dx - w, y);
      c.lineTo(dx - w, y + len);
      c.arc(dx, y + len, w, Math.PI, 0, true);
      c.lineTo(dx + w, y);
      c.fill();
    }
  }
  function leaf(c, x, y, s, rot, col) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.fillStyle = col;
    c.strokeStyle = '#2d2442';
    c.lineWidth = 2.5 * W.k;
    c.beginPath();
    c.moveTo(-s, 0);
    c.quadraticCurveTo(0, -s * 0.75, s, 0);
    c.quadraticCurveTo(0, s * 0.75, -s, 0);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(-s * 0.9, 0);
    c.lineTo(s * 0.8, 0);
    c.lineWidth = 2 * W.k;
    c.stroke();
    c.beginPath();
    c.moveTo(-s, 0);
    c.lineTo(-s * 1.35, s * 0.12);
    c.stroke();
    c.restore();
  }
  function drawMud() {
    const k = W.k;
    const m = ctx(W.M);
    ['F', 'B', 'S'].forEach((key) => ctx(W[key]).clearRect(0, 0, W.iw, W.ih));
    m.clearRect(0, 0, W.iw, W.ih);
    // a dull muddy film over everything
    m.fillStyle = 'rgba(128, 86, 44, 0.42)';
    m.fillRect(0, 0, W.iw, W.ih);
    for (let i = 0; i < 16; i++) {
      const p = randomInside();
      splat(m, p.x * k, p.y * k, rand(14, 32) * k, MUDS[i % MUDS.length]);
    }
    m.fillStyle = '#5e3a1a';
    for (let i = 0; i < 60; i++) {
      const p = randomInside();
      m.beginPath();
      m.arc(p.x * k, p.y * k, rand(1.5, 5) * k, 0, TAU);
      m.fill();
    }
    // a few lighter wet spots
    m.fillStyle = 'rgba(255, 230, 190, 0.25)';
    for (let i = 0; i < 12; i++) {
      const p = randomInside();
      m.beginPath();
      m.ellipse(p.x * k, p.y * k, rand(3, 7) * k, rand(1.5, 3) * k, rand(-0.5, 0.5), 0, TAU);
      m.fill();
    }
    const LEAVES = ['#5cbf3a', '#ff9a2e', '#ffc21f', '#3fa34d', '#e8642c'];
    for (let i = 0; i < 6; i++) {
      const p = randomInside();
      leaf(m, p.x * k, p.y * k, rand(9, 14) * k, rand(0, TAU), LEAVES[i % LEAVES.length]);
    }
    clip(m, 0, 0, W.iw, W.ih);
  }
  function clip(c, x, y, w, h) {
    c.save();
    c.globalCompositeOperation = 'destination-in';
    c.drawImage(W.SIL, x, y, w, h, x, y, w, h);
    c.restore();
  }

  // ---------------------------------------------------------------------------
  // Stamps (vehicle units in, dirty rectangle in canvas pixels out)
  // ---------------------------------------------------------------------------
  function bubble(c, x, y, r) {
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fillStyle = '#ffffff';
    c.fill();
    c.lineWidth = Math.max(1, 1.6 * W.k);
    c.strokeStyle = 'rgba(140, 185, 235, 0.9)';
    c.stroke();
    c.beginPath();
    c.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, TAU);
    c.fillStyle = 'rgba(190, 225, 255, 0.95)';
    c.fill();
  }
  function bead(c, x, y, r) {
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fillStyle = 'rgba(215, 242, 255, 0.85)';
    c.fill();
    c.lineWidth = Math.max(1, 1.3 * W.k);
    c.strokeStyle = 'rgba(70, 150, 230, 0.75)';
    c.stroke();
    c.beginPath();
    c.arc(x - r * 0.3, y - r * 0.35, r * 0.3, 0, TAU);
    c.fillStyle = '#fff';
    c.fill();
  }
  function twinkle(c, x, y, r) {
    const g = c.createRadialGradient(x, y, 0, x, y, r * 1.2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,250,200,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r * 1.2, 0, TAU);
    c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(x, y - r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.quadraticCurveTo(x, y, x, y + r);
    c.quadraticCurveTo(x, y, x - r, y);
    c.quadraticCurveTo(x, y, x, y - r);
    c.fill();
  }
  function erase(c, x, y, r) {
    c.save();
    c.globalCompositeOperation = 'destination-out';
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.9)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
    c.restore();
  }

  function mark(step, x, y, R) {
    const m = W.marks[step];
    let fresh = 0;
    const i0 = Math.max(0, Math.floor((x - R) / CELL));
    const i1 = Math.min(GX - 1, Math.floor((x + R) / CELL));
    const j0 = Math.max(0, Math.floor((y - R) / CELL));
    const j1 = Math.min(GY - 1, Math.floor((y + R) / CELL));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const c = j * GX + i;
        if (!W.inside[c] || m[c]) continue;
        const dx = (i + 0.5) * CELL - x;
        const dy = (j + 0.5) * CELL - y;
        if (dx * dx + dy * dy <= R * R) { m[c] = 1; fresh++; }
      }
    }
    W.counts[step] += fresh;
    return fresh;
  }

  /** Is this spot on the vehicle? */
  W.onVehicle = function onVehicle(x, y) {
    const i = Math.floor(x / CELL);
    const j = Math.floor(y / CELL);
    if (i < 0 || j < 0 || i >= GX || j >= GY) return false;
    return !!W.inside[j * GX + i];
  };

  /** Rub one spot with a tool. Returns the dirty rect [x, y, w, h] in canvas pixels. */
  W.stamp = function stamp(step, x, y, R) {
    const k = W.k;
    const px = x * k;
    const py = y * k;
    const pr = R * k;
    if (step === 'soap') {
      const f = ctx(W.F);
      f.fillStyle = 'rgba(255,255,255,0.75)';
      f.beginPath();
      f.arc(px, py, pr * 0.55, 0, TAU);
      f.fill();
      for (let i = 0; i < 4; i++) {
        const a = rand(0, TAU);
        const d = rand(0, pr * 0.7);
        bubble(f, px + Math.cos(a) * d, py + Math.sin(a) * d, rand(5, 13) * k);
      }
    } else if (step === 'rinse') {
      erase(ctx(W.M), px, py, pr);
      erase(ctx(W.F), px, py, pr);
      if (Math.random() < 0.7) {
        const a = rand(0, TAU);
        const d = rand(0, pr * 0.9);
        bead(ctx(W.B), px + Math.cos(a) * d, py + Math.sin(a) * d, rand(3, 6) * k);
      }
    } else if (step === 'dry') {
      erase(ctx(W.B), px, py, pr);
    } else if (step === 'shine') {
      if (Math.random() < 0.45) {
        const a = rand(0, TAU);
        const d = rand(0, pr * 0.8);
        twinkle(ctx(W.S), px + Math.cos(a) * d, py + Math.sin(a) * d, rand(5, 11) * k);
      }
    }
    mark(step, x, y, R);
    const m = pr + 16 * k;
    return [px - m, py - m, m * 2, m * 2];
  };

  W.progress = function progress(step) { return W.counts[step] / W.total; };

  /** The last bits of a step happen by themselves (nobody gets stuck on the last speck). */
  W.finishStep = function finishStep(step) {
    const k = W.k;
    const m = W.marks[step];
    if (step === 'soap') {
      const f = ctx(W.F);
      for (let c = 0; c < GX * GY; c++) {
        if (!W.inside[c] || m[c]) continue;
        const x = ((c % GX) + 0.5) * CELL * k;
        const y = (Math.floor(c / GX) + 0.5) * CELL * k;
        f.fillStyle = 'rgba(255,255,255,0.8)';
        f.beginPath();
        f.arc(x, y, 12 * k, 0, TAU);
        f.fill();
        bubble(f, x + rand(-4, 4) * k, y + rand(-4, 4) * k, rand(5, 10) * k);
      }
    } else if (step === 'rinse') {
      ctx(W.M).clearRect(0, 0, W.iw, W.ih);
      ctx(W.F).clearRect(0, 0, W.iw, W.ih);
      // beads all over, ready for drying
      const b = ctx(W.B);
      for (let c = 0; c < GX * GY; c++) {
        if (!W.inside[c] || (m[c] && Math.random() < 0.6) || Math.random() < 0.5) continue;
        bead(b, ((c % GX) + Math.random()) * CELL * k, (Math.floor(c / GX) + Math.random()) * CELL * k, rand(3, 6) * k);
      }
    } else if (step === 'dry') {
      ctx(W.B).clearRect(0, 0, W.iw, W.ih);
    } else if (step === 'shine') {
      const s = ctx(W.S);
      for (let c = 0; c < GX * GY; c++) {
        if (!W.inside[c] || m[c] || Math.random() < 0.75) continue;
        twinkle(s, ((c % GX) + Math.random()) * CELL * k, (Math.floor(c / GX) + Math.random()) * CELL * k, rand(5, 10) * k);
      }
    }
    for (let c = 0; c < GX * GY; c++) if (W.inside[c]) m[c] = 1;
    W.counts[step] = W.total;
    W.compose();
  };

  /** Stack the layers into the visible canvas (a rect in canvas pixels, or everything). */
  W.compose = function compose(r, sheen) {
    let x = 0;
    let y = 0;
    let w = W.iw;
    let h = W.ih;
    if (r) {
      x = Math.max(0, Math.floor(r[0]));
      y = Math.max(0, Math.floor(r[1]));
      w = Math.min(W.iw, Math.ceil(r[0] + r[2])) - x;
      h = Math.min(W.ih, Math.ceil(r[1] + r[3])) - y;
      if (w <= 0 || h <= 0) return;
    }
    og.clearRect(x, y, w, h);
    og.drawImage(W.M, x, y, w, h, x, y, w, h);
    og.drawImage(W.F, x, y, w, h, x, y, w, h);
    og.drawImage(W.B, x, y, w, h, x, y, w, h);
    og.drawImage(W.S, x, y, w, h, x, y, w, h);
    if (sheen != null) {
      // a glossy band sweeping across
      const bx = (sheen * 1.6 - 0.3) * W.iw;
      const g = og.createLinearGradient(bx - W.iw * 0.12, 0, bx + W.iw * 0.12, W.ih * 0.4);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.7)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      og.fillStyle = g;
      og.fillRect(x, y, w, h);
    }
    og.save();
    // (destination-in would also wipe everything outside the image, so clip to the rect first)
    og.beginPath();
    og.rect(x, y, w, h);
    og.clip();
    og.globalCompositeOperation = 'destination-in';
    og.drawImage(W.SIL, x, y, w, h, x, y, w, h);
    og.restore();
  };

  /** Is anything still on the vehicle? (for the sheen and saving) */
  W.layers = () => [W.M, W.F, W.B, W.S];
  return W;
}
