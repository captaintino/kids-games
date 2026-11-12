// The three instruments. Each one lays itself out in the free area of the screen,
// builds itself out of little pictures on the page (see Layers below: while you play,
// only CSS transforms and opacities change, nothing is repainted), and tells which
// key / bar / drum is under a finger.
//
// Xylophone and piano are drawn in their own "virtual" coordinates: u runs across
// the keys from low to high, v along a key. On a tall phone the whole instrument is
// turned a quarter turn (low notes at the bottom), so the keys stay big.

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------
// The instruments are drawn as layers on the page instead of being repainted on one
// big canvas every frame. Every part (a bar, its glow, a key's lit look, a drum's
// skin) is drawn once into a little picture; while you play, only CSS transforms
// (a bar wobbling, a drum squashing) and opacities (glows fading) change, which the
// browser's compositor handles without repainting anything.
//
// Each picture is drawn into a canvas and then shown as an <img>: a canvas on the
// page is copied to the compositor again on every page update in some browsers
// (Chrome without a GPU), an image is not. The canvas stays visible until its image
// is ready, so nothing ever blinks.

export function setTransform(el, t) {
  if (el._tf === t) return;
  el._tf = t;
  el.style.webkitTransform = t;
  el.style.transform = t;
}

/** Fade a part in or out (0 hides it completely). */
export function setAlpha(el, a) {
  const v = a <= 0.001 ? 0 : Math.min(1, Math.round(a * 1000) / 1000);
  if (el._a === v) return;
  el._a = v;
  el.style.visibility = v ? '' : 'hidden';
  if (v) el.style.opacity = String(v);
}

export function show(el, on) {
  setAlpha(el, on ? 1 : 0);
}

// pictures are turned into images a few at a time, so making many never stalls a frame
const queue = [];
let pumping = false;
function pump() {
  const end = Date.now() + 6;
  while (queue.length && Date.now() < end) queue.shift()();
  if (queue.length) requestAnimationFrame(pump);
  else pumping = false;
}
function later(job) {
  queue.push(job);
  if (!pumping) { pumping = true; requestAnimationFrame(pump); }
}

/** A group that moves its children together (a bar, a key, a drum). */
export function group(cls) {
  const el = document.createElement('div');
  el.className = cls ? `part ${cls}` : 'part';
  return el;
}

/**
 * A still picture covering the box (x, y, w, h) in its parent's coordinates (CSS px).
 * draw(c) paints it in those same coordinates. The box is snapped to the picture's
 * pixel grid.
 */
export function picture(x, y, w, h, dpr, draw, cls) {
  const px0 = Math.floor(x * dpr);
  const py0 = Math.floor(y * dpr);
  const pw = Math.max(1, Math.ceil((x + w) * dpr) - px0);
  const ph = Math.max(1, Math.ceil((y + h) * dpr) - py0);
  const bx = px0 / dpr;
  const by = py0 / dpr;
  const el = document.createElement('div');
  el.className = cls ? `part pic ${cls}` : 'part pic';
  el.style.width = `${pw / dpr}px`;
  el.style.height = `${ph / dpr}px`;
  setTransform(el, `translate(${bx}px,${by}px)`);
  const cv = document.createElement('canvas');
  cv.width = pw;
  cv.height = ph;
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, -bx * dpr, -by * dpr);
  draw(c);
  el.appendChild(cv);
  later(() => {
    let url = '';
    try { url = cv.toDataURL('image/png'); } catch (err) { return; }
    const img = new Image();
    img.alt = '';
    img.onload = () => {
      if (cv.parentNode !== el) return;
      el.replaceChild(img, cv);
      cv.width = cv.height = 1;
    };
    img.src = url;
  });
  return el;
}

// ---------------------------------------------------------------------------

const INK = '#2d2442';
const TAU = Math.PI * 2;

function rr(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
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

function shade(hex, amt) {
  // amt > 0 lightens toward white, < 0 darkens toward black
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return `rgb(${r},${g},${b})`;
}

function ellipse(c, x, y, rx, ry) {
  c.beginPath();
  c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
}

/** The "light" on a key in Follow the Lights: a glowing white star. */
function litStar(c, x, y, r, t) {
  const pulse = 1 + 0.12 * Math.sin(t * 9);
  c.save();
  c.translate(x, y);
  c.rotate(Math.sin(t * 3) * 0.2);
  c.scale(pulse, pulse);
  c.shadowColor = '#fff3a0';
  c.shadowBlur = r * 0.9;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rad = i % 2 ? r * 0.45 : r;
    c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  c.closePath();
  c.fillStyle = '#fffbe0';
  c.fill();
  c.shadowBlur = 0;
  c.lineWidth = r * 0.16;
  c.strokeStyle = '#ffb12e';
  c.stroke();
  c.restore();
}

/** A struck thing settles down: 1 right after the hit, 0 later. */
const decay = (age, k) => (age < 0 ? 0 : Math.exp(-age * k));

export const RAINBOW = ['#ff4d5e', '#ff9a2e', '#ffd93b', '#5cd65c', '#2fd3c6', '#3d9bff', '#9d5cff', '#ff7ac6'];

// ---------------------------------------------------------------------------
// Shared base for the two keyboard-like instruments
// ---------------------------------------------------------------------------
class Keyed {
  constructor() {
    this.keys = [];
    this.vertical = false;
    this.m = [1, 0, 0, 1, 0, 0];
  }
  /** Virtual (u, v) to screen. */
  toScreen(u, v) {
    const m = this.m;
    return { x: m[0] * u + m[2] * v + m[4], y: m[1] * u + m[3] * v + m[5] };
  }
  toVirtual(x, y) {
    if (this.vertical) return { u: this.m[5] - y, v: x - this.m[4] };
    return { u: x - this.m[4], v: y - this.m[5] };
  }
  setFrame(area, across, along, uSize, vSize) {
    // centre a uSize x vSize block in the area, turned when vertical
    if (this.vertical) {
      const left = area.x + (area.w - vSize) / 2;
      const bottom = area.y + area.h - (area.h - uSize) / 2;
      this.m = [0, -1, 1, 0, left, bottom];
    } else {
      this.m = [1, 0, 0, 1, area.x + (area.w - uSize) / 2, area.y + (area.h - vSize) / 2];
    }
  }
  /** The instrument's frame on the page: (u, v) virtual coordinates to the screen. */
  frameTransform() {
    const m = this.m;
    return `translate(${m[4]}px,${m[5]}px) matrix(${m[0]},${m[1]},${m[2]},${m[3]},0,0)`;
  }
  /** Put the built instrument on the page. */
  mount(root) {
    while (root.firstChild) root.removeChild(root.firstChild);
    if (this.dom) root.appendChild(this.dom);
  }
  keyCenter(i) {
    const k = this.keys[i];
    return this.toScreen(k.u + k.w / 2, k.v + k.h * 0.55);
  }
  hit(i, t) { this.keys[i].hitT = t; }
  busy(t) {
    for (const k of this.keys) if (k.lit || k.hint || k.down || t - k.hitT < 1.2) return true;
    return false;
  }
}

// ---------------------------------------------------------------------------
// Xylophone: 8 rainbow bars, C major from middle C, getting shorter
// ---------------------------------------------------------------------------
export class Xylophone extends Keyed {
  constructor() {
    super();
    const semis = [0, 2, 4, 5, 7, 9, 11, 12];
    this.keys = semis.map((semi, i) => ({ i, semi, color: RAINBOW[i], hitT: -9, lit: false, hint: false, down: 0 }));
  }
  measure(across, along) {
    const gap = Math.max(6, across * 0.016);
    const t = Math.min(120, (across - gap * 7 - 20) / 8);
    const L0 = Math.min(along * 0.96, t * 5.4);
    return { gap, t, L0, size: t * L0 };
  }
  layout(area, dpr) {
    // lie the bars whichever way makes them biggest (tall phones: sideways, low notes at the bottom)
    const a = this.measure(area.w, area.h);
    const b = this.measure(area.h, area.w);
    this.vertical = b.size > a.size * 1.1;
    const across = this.vertical ? area.h : area.w;
    const along = this.vertical ? area.w : area.h;
    const mm = this.vertical ? b : a;
    const gap = mm.gap;
    const t = mm.t;
    const L0 = mm.L0;
    const uSize = t * 8 + gap * 7;
    this.thick = t;
    this.keys.forEach((k, i) => {
      const L = L0 * (1 - 0.4 * i / 7);
      k.u = i * (t + gap);
      k.w = t;
      k.h = L;
      k.v = (L0 - L) / 2;
    });
    this.L0 = L0;
    this.setFrame(area, across, along, uSize, L0);
    this.build(dpr);
  }
  pick(x, y) {
    const p = this.toVirtual(x, y);
    const half = (this.keys[1].u - this.keys[0].u - this.thick) / 2;
    for (const k of this.keys) {
      if (p.u >= k.u - half && p.u <= k.u + k.w + half && p.v >= k.v - 14 && p.v <= k.v + k.h + 14) return k.i;
    }
    return -1;
  }
  /** Build the xylophone out of pictures: the rails, then each bar on its own. */
  build(dpr) {
    const ks = this.keys;
    const s = this.thick / 80;
    this.s = s;
    this.dpr = dpr;
    const frame = group();
    setTransform(frame, this.frameTransform());
    // the wooden frame: two rails under the bars, closer together at the high end
    const railAt = (k, f) => k.v + k.h * f;
    const a = ks[0];
    const b = ks[ks.length - 1];
    const pad = this.thick * 0.45;
    const m = 14 * s;
    frame.appendChild(picture(a.u - pad - m, -m, b.u + b.w - a.u + (pad + m) * 2, this.L0 + m * 2, dpr, (c) => {
      [0.2, 0.8].forEach((f) => {
        const y0 = railAt(a, f);
        const y1 = railAt(b, f);
        c.lineCap = 'round';
        c.strokeStyle = INK;
        c.lineWidth = 20 * s;
        c.beginPath();
        c.moveTo(a.u - pad, y0);
        c.lineTo(b.u + b.w + pad, y1);
        c.stroke();
        c.strokeStyle = '#c47a3f';
        c.lineWidth = 13 * s;
        c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.35)';
        c.lineWidth = 4 * s;
        c.beginPath();
        c.moveTo(a.u - pad, y0 - 3 * s);
        c.lineTo(b.u + b.w + pad, y1 - 3 * s);
        c.stroke();
      });
    }));
    // each bar: glow, the bar, the bar lit up from inside (faded in), and later a star
    for (const k of ks) {
      const g = group('move');
      setTransform(g, `translate(${k.u + k.w / 2}px,${k.v + k.h / 2}px)`);
      k.el = { g, glow: this.glowPic(k, false), body: this.bodyPic(k, 0), bright: this.bodyPic(k, 0.5), glowLit: null, star: null };
      k.el.glow.classList.add('fade');
      k.el.bright.classList.add('fade');
      g.appendChild(k.el.glow);
      g.appendChild(k.el.body);
      g.appendChild(k.el.bright);
      frame.appendChild(g);
    }
    this.dom = frame;
    this.update(1e6); // at rest until the first frame
  }
  glowPic(k, lit) {
    const s = this.s;
    const g = (lit ? 13 : 8) * s;
    const blur = (lit ? 44 : 30) * s;
    const m = g + blur / this.dpr * 1.6 + 2;
    const x = -k.w / 2;
    const y = -k.h / 2;
    return picture(x - m, y - m, k.w + m * 2, k.h + m * 2, this.dpr, (c) => {
      c.shadowColor = lit ? '#fff7a8' : k.color;
      c.shadowBlur = blur;
      c.fillStyle = lit ? '#fffbd0' : shade(k.color, 0.5);
      rr(c, x - g, y - g, k.w + g * 2, k.h + g * 2, k.w * 0.4);
      c.fill();
    }, 'fade');
  }
  bodyPic(k, bright) {
    const s = this.s;
    const x = -k.w / 2;
    const y = -k.h / 2;
    const m = 4 * s;
    return picture(x - m, y - m, k.w + m * 2, k.h + m * 2, this.dpr, (c) => {
      // the bar
      rr(c, x, y, k.w, k.h, k.w * 0.3);
      c.fillStyle = k.color;
      c.fill();
      // lit / just-hit bars glow from inside
      c.save();
      c.clip();
      c.fillStyle = 'rgba(0,0,0,.14)';
      c.fillRect(x + k.w * 0.72, y, k.w * 0.4, k.h);
      c.fillStyle = 'rgba(255,255,255,.45)';
      rr(c, x + k.w * 0.14, y + k.w * 0.25, k.w * 0.17, k.h - k.w * 0.5, k.w * 0.1);
      c.fill();
      if (bright > 0.01) {
        c.fillStyle = `rgba(255,255,255,${bright})`;
        c.fillRect(x, y, k.w, k.h);
      }
      c.restore();
      rr(c, x, y, k.w, k.h, k.w * 0.3);
      c.lineWidth = 4.5 * s;
      c.strokeStyle = INK;
      c.stroke();
      // screws where the bar sits on the rails
      [0.2, 0.8].forEach((f) => {
        const sy = y + k.h * f;
        c.beginPath();
        c.arc(0, sy, 6 * s, 0, TAU);
        c.fillStyle = '#eef0f7';
        c.fill();
        c.lineWidth = 3 * s;
        c.strokeStyle = INK;
        c.stroke();
      });
    });
  }
  /** Move, fade and light the bars for time t (only what changed is touched). */
  update(t) {
    const s = this.s;
    for (const k of this.keys) {
      const e = k.el;
      if (!e) continue;
      const age = t - k.hitT;
      const kk = decay(age, 4);
      let tf = `translate(${k.u + k.w / 2}px,${k.v + k.h / 2}px)`;
      if (kk > 0.01) tf += ` rotate(${(0.06 * kk * Math.sin(age * 34)).toFixed(5)}rad) scale(${(1 + 0.06 * kk).toFixed(5)},${(1 + 0.02 * kk).toFixed(5)})`;
      if (k.down) tf += ` translate(0px,${2 * s}px)`;
      if (k.lit) tf += ' scale(1.06,1.03)';
      setTransform(e.g, tf);
      const glow = k.lit ? 1 : Math.max(kk * 0.9, k.hint ? 0.35 + 0.35 * Math.sin(t * 6) : 0);
      setAlpha(e.glow, !k.lit && glow > 0.02 ? glow : 0);
      if (k.lit && !e.glowLit) {
        e.glowLit = this.glowPic(k, true);
        e.g.insertBefore(e.glowLit, e.body);
      }
      if (e.glowLit) show(e.glowLit, k.lit);
      const bright = k.lit ? 0.45 : kk * 0.5;
      setAlpha(e.bright, bright > 0.01 ? bright / 0.5 : 0);
      if (k.lit && !e.star) {
        e.star = starPic(k.w * 0.3, this.dpr);
        e.g.appendChild(e.star);
      }
      if (e.star) {
        show(e.star, k.lit);
        if (k.lit) setTransform(e.star, starTransform(0, 0, t));
      }
    }
  }
}

// the "light" star in Follow the Lights, as a picture that pulses and rocks
function starPic(r, dpr) {
  const m = r * 1.15 + r * 0.9 / dpr * 1.6 + 2;
  const g = group('move');
  g.appendChild(picture(-m, -m, m * 2, m * 2, dpr, (c) => litStar(c, 0, 0, r, 0)));
  return g;
}
function starTransform(x, y, t) {
  const pulse = 1 + 0.12 * Math.sin(t * 9);
  return `translate(${x}px,${y}px) rotate(${(Math.sin(t * 3) * 0.2).toFixed(4)}rad) scale(${pulse.toFixed(4)})`;
}

// ---------------------------------------------------------------------------
// Piano: 12 big pastel white keys (C to G, an octave and a half) and 8 black keys
// ---------------------------------------------------------------------------
const WHITE_SEMIS = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];
const BLACK_AFTER = [0, 1, 3, 4, 5, 7, 8, 10];

export class Piano extends Keyed {
  constructor() {
    super();
    this.keys = [];
    WHITE_SEMIS.forEach((semi, i) => {
      const hue = Math.round(i * 330 / 12);
      this.keys.push({
        i: this.keys.length, semi, black: false, wi: i, hitT: -9, lit: false, hint: false, down: 0,
        color: `hsl(${hue}, 95%, 86%)`, deep: `hsl(${hue}, 92%, 66%)`, glowColor: `hsl(${hue}, 100%, 70%)`,
      });
    });
    BLACK_AFTER.forEach((w) => {
      this.keys.push({
        i: this.keys.length, semi: WHITE_SEMIS[w] + 1, black: true, wi: w, hitT: -9, lit: false, hint: false, down: 0,
        color: '#3a2f57', deep: '#6b4fd8', glowColor: '#b78cff',
      });
    });
  }
  /** Index of the key that plays this note (or -1). */
  keyFor(semi) {
    for (const k of this.keys) if (k.semi === semi) return k.i;
    return -1;
  }
  measure(across, along) {
    const pad = Math.max(8, across * 0.014);
    const kw = Math.min(104, (across - pad * 2) / 12);
    const top = kw * 0.75;
    const kl = Math.min(along - top - pad * 2, kw * (across > 700 ? 6 : 4.8));
    return { pad, kw, top, kl, size: kw * Math.min(kl, kw * 4) };
  }
  layout(area, dpr) {
    const a = this.measure(area.w, area.h);
    const b = this.measure(area.h, area.w);
    // only phones turn the piano sideways; on a tablet it stays a real-looking keyboard
    this.vertical = area.w < 600 && b.size > a.size * 1.25;
    const across = this.vertical ? area.h : area.w;
    const along = this.vertical ? area.w : area.h;
    const mm = this.vertical ? b : a;
    const pad = mm.pad;
    const kw = mm.kw;
    const top = mm.top;
    const kl = mm.kl;
    this.kw = kw;
    this.kl = kl;
    this.pad = pad;
    this.top = top;
    for (const k of this.keys) {
      if (!k.black) {
        k.u = k.wi * kw;
        k.w = kw;
        k.v = 0;
        k.h = kl;
      } else {
        k.w = kw * 0.6;
        k.u = (k.wi + 1) * kw - k.w / 2;
        k.v = 0;
        k.h = kl * 0.6;
      }
    }
    const uSize = kw * 12 + pad * 2;
    const vSize = kl + top + pad * 2;
    this.setFrame(area, across, along, uSize, vSize);
    // keys start after the case's padding and top board
    this.m[4] += this.vertical ? (top + pad) : pad;
    if (this.vertical) this.m[5] -= pad;
    else this.m[5] += top + pad;
    this.build(dpr);
  }
  pick(x, y) {
    const p = this.toVirtual(x, y);
    if (p.v < -this.top || p.v > this.kl + this.pad + 6) return -1;
    for (const k of this.keys) {
      if (k.black && p.u >= k.u && p.u <= k.u + k.w && p.v <= k.h) return k.i;
    }
    if (p.u < -this.pad || p.u > 12 * this.kw + this.pad) return -1;
    const wi = Math.max(0, Math.min(11, Math.floor(p.u / this.kw)));
    return wi;
  }
  keyCenter(i) {
    const k = this.keys[i];
    return this.toScreen(k.u + k.w / 2, k.h * (k.black ? 0.6 : 0.78));
  }
  /** Build the piano out of pictures: case, lights, white keys, felt, black keys. */
  build(dpr) {
    const kw = this.kw;
    const kl = this.kl;
    const pad = this.pad;
    const top = this.top;
    const s = kw / 70;
    const W12 = kw * 12;
    this.s = s;
    this.dpr = dpr;
    const frame = group();
    setTransform(frame, this.frameTransform());
    const lightAt = (i) => ({ x: i * kw + kw / 2, y: -top / 2 - 2 * s, r: Math.min(kw * 0.2, top * 0.26) });
    // the case, the lights (off) and the dark gaps between the keys
    const m = 6 * s;
    frame.appendChild(picture(-pad - m, -top - pad - m, W12 + (pad + m) * 2, kl + top + (pad + m) * 2, dpr, (c) => {
      rr(c, -pad, -top - pad, W12 + pad * 2, kl + top + pad * 2, 22 * s);
      c.fillStyle = '#7b4fd6';
      c.fill();
      c.lineWidth = 5 * s;
      c.strokeStyle = INK;
      c.stroke();
      rr(c, -pad + 6 * s, -top - pad + 5 * s, W12 + pad * 2 - 12 * s, top * 0.45, 12 * s);
      c.fillStyle = 'rgba(255,255,255,.22)';
      c.fill();
      for (let i = 0; i < 12; i++) {
        const L = lightAt(i);
        c.beginPath();
        c.arc(L.x, L.y, L.r, 0, TAU);
        c.fillStyle = this.keys[i].deep;
        c.globalAlpha = 0.55;
        c.fill();
        c.globalAlpha = 1;
        c.lineWidth = 2.5 * s;
        c.strokeStyle = INK;
        c.stroke();
      }
      c.fillStyle = INK;
      c.fillRect(0, 0, W12, kl);
    }));
    // a little light above each white key (they glow when it plays)
    for (let i = 0; i < 12; i++) {
      const k = this.keys[i];
      const L = lightAt(i);
      const blur = 16 * s;
      const gm = L.r * 1.3 + blur / dpr * 1.6 + 2;
      const glow = picture(L.x - gm, L.y - gm, gm * 2, gm * 2, dpr, (c) => {
        c.shadowColor = k.glowColor;
        c.shadowBlur = blur;
        c.beginPath();
        c.arc(L.x, L.y, L.r * 1.3, 0, TAU);
        c.fillStyle = k.glowColor;
        c.fill();
      }, 'fade');
      const om = L.r + 3 * s;
      const on = picture(L.x - om, L.y - om, om * 2, om * 2, dpr, (c) => {
        c.beginPath();
        c.arc(L.x, L.y, L.r, 0, TAU);
        c.fillStyle = '#fff';
        c.fill();
        c.lineWidth = 2.5 * s;
        c.strokeStyle = INK;
        c.stroke();
      });
      k.light = { glow, on };
      frame.appendChild(glow);
      frame.appendChild(on);
    }
    // white keys, then the felt strip, then black keys on top
    for (const k of this.keys) {
      if (k.black) continue;
      const g = group('move');
      k.el = { g, body: this.whitePic(k, false, 0), glow: this.whitePic(k, false, 1), lit: null, star: null };
      k.el.glow.classList.add('fade');
      g.appendChild(k.el.body);
      g.appendChild(k.el.glow);
      frame.appendChild(g);
    }
    frame.appendChild(picture(-1, -1, W12 + 2, 7 * s + 2, dpr, (c) => {
      c.fillStyle = '#ff5fa8';
      c.fillRect(0, 0, W12, 5 * s);
      c.fillStyle = INK;
      c.fillRect(0, 5 * s, W12, 2 * s);
    }));
    for (const k of this.keys) {
      if (!k.black) continue;
      const g = group('move');
      k.el = { g, glow: this.blackGlowPic(k), body: this.blackPic(k, k.color), hit: this.blackPic(k, '#5a3f9c'), lit: null, star: null };
      k.el.glow.classList.add('fade');
      g.appendChild(k.el.glow);
      g.appendChild(k.el.body);
      g.appendChild(k.el.hit);
      frame.appendChild(g);
    }
    this.dom = frame;
    this.update(1e6); // at rest until the first frame
  }
  /** A white key at rest; `glow` 1 is the same key with its glow color laid over it. */
  whitePic(k, lit, glow) {
    const s = this.s;
    const g = 2 * s;
    const x = k.u + g;
    const w = k.w - g * 2;
    const h = k.h - g;
    const m = 3 * s;
    return picture(x - m, -10 - m, w + m * 2, h + 10 + m * 2, this.dpr, (c) => {
      c.save();
      rr(c, x, -10, w, h + 10, 12 * s);
      c.fillStyle = lit ? k.glowColor : k.color;
      c.fill();
      c.clip();
      if (glow > 0.02) {
        c.fillStyle = k.glowColor;
        c.globalAlpha = glow;
        c.fillRect(x, 0, w, h);
        c.globalAlpha = 1;
      }
      // the rounded front lip of the key
      c.fillStyle = 'rgba(255,255,255,.55)';
      c.fillRect(x + w * 0.12, 8 * s, w * 0.16, h - 30 * s);
      c.fillStyle = 'rgba(60,20,110,.12)';
      c.fillRect(x, h - 16 * s, w, 16 * s);
      c.restore();
      rr(c, x, -10, w, h + 10, 12 * s);
      c.lineWidth = 3 * s;
      c.strokeStyle = INK;
      c.stroke();
      // a star on each C so kids can find "home"
      if (k.semi % 12 === 0) {
        const cx = x + w / 2;
        const cy = h - 34 * s;
        const r = Math.min(w * 0.22, 12 * s);
        c.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + i * Math.PI / 5;
          const rad = i % 2 ? r * 0.45 : r;
          c.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        }
        c.closePath();
        c.fillStyle = '#fff';
        c.fill();
        c.lineWidth = 2 * s;
        c.strokeStyle = k.deep;
        c.stroke();
      }
    });
  }
  blackGlowPic(k) {
    const s = this.s;
    const h = k.h;
    const blur = 18 * s;
    const m = blur / this.dpr * 1.6 + 2;
    return picture(k.u - 3 * s - m, -6 - m, k.w + 6 * s + m * 2, h + 9 * s + m * 2, this.dpr, (c) => {
      c.shadowColor = k.glowColor;
      c.shadowBlur = blur;
      rr(c, k.u - 3 * s, -6, k.w + 6 * s, h + 9 * s, 10 * s);
      c.fillStyle = k.glowColor;
      c.fill();
    }, 'fade');
  }
  blackPic(k, color) {
    const s = this.s;
    const h = k.h;
    const m = 3 * s;
    return picture(k.u - m, -10 - m, k.w + m * 2, h + 10 + m * 2, this.dpr, (c) => {
      rr(c, k.u, -10, k.w, h + 10, 9 * s);
      c.fillStyle = color;
      c.fill();
      c.lineWidth = 3 * s;
      c.strokeStyle = INK;
      c.stroke();
      // shine
      rr(c, k.u + k.w * 0.2, 6 * s, k.w * 0.22, h - 22 * s, 5 * s);
      c.fillStyle = 'rgba(255,255,255,.28)';
      c.fill();
      rr(c, k.u + k.w * 0.12, h - 12 * s, k.w * 0.76, 7 * s, 4 * s);
      c.fillStyle = 'rgba(255,255,255,.18)';
      c.fill();
    }, 'fade');
  }
  /** Press, light and fade the keys for time t (only what changed is touched). */
  update(t) {
    const s = this.s;
    for (const k of this.keys) {
      const e = k.el;
      if (!e) continue;
      const age = t - k.hitT;
      const kk = decay(age, 4);
      const press = k.down ? 1 : kk > 0.3 ? (kk - 0.3) / 0.7 : 0;
      // a pressed key reaches a little further down (it grows from its hidden top end)
      const len = k.black ? k.h + 10 : k.h - 2 * s + 10;
      const sy = (len + press * 4 * s) / len;
      setTransform(e.g, sy === 1 ? 'none' : `translate(0px,-10px) scale(1,${sy.toFixed(5)}) translate(0px,10px)`);
      if (!k.black) {
        const on = k.lit ? 1 : decay(age, 3);
        setAlpha(k.light.glow, on > 0.05 ? on : 0);
        show(k.light.on, on > 0.05);
        const glow = k.lit ? 1 : (k.hint ? 0.3 + 0.3 * Math.sin(t * 6) : 0);
        setAlpha(e.glow, glow > 0.02 || kk > 0.02 ? Math.max(glow, kk * 0.8) : 0);
        if (k.lit && !e.lit) {
          e.lit = this.whitePic(k, true, 1);
          e.g.appendChild(e.lit);
        }
        if (e.lit) show(e.lit, k.lit);
      } else {
        const glow = k.lit ? 1 : Math.max(kk * 0.9, k.hint ? 0.35 + 0.3 * Math.sin(t * 6) : 0);
        setAlpha(e.glow, glow > 0.02 ? glow : 0);
        show(e.hit, !k.lit && kk > 0.05);
        if (k.lit && !e.lit) {
          e.lit = this.blackPic(k, k.deep);
          e.g.appendChild(e.lit);
        }
        if (e.lit) show(e.lit, k.lit);
      }
      if (k.lit && !e.star) {
        if (k.black) e.star = starPic(k.w * 0.36, this.dpr);
        else e.star = starPic(Math.min((k.w - 4 * s) * 0.32, 30 * s), this.dpr);
        e.g.appendChild(e.star);
      }
      if (e.star) {
        show(e.star, k.lit);
        if (k.lit) {
          const h = k.black ? k.h : k.h - 2 * s;
          setTransform(e.star, starTransform(k.u + k.w / 2, h * (k.black ? 0.6 : 0.62), t));
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Drum kit
// ---------------------------------------------------------------------------
// Each piece: the stand (static) and the part you hit (squashes, wobbles or swings).
// Both are drawn once into little pictures at layout time, so a busy drum solo only
// changes a few CSS transforms per frame.

const PIECES = {
  crash: { name: 'Crash', word: 'Crash!', color: '#ffc93b', kind: 'cymbal', hit: [0, -0.2, 1.05] },
  hihat: { name: 'Hi-hat', word: 'Tss!', color: '#ffd76b', kind: 'hihat', hit: [0, -0.15, 1.0] },
  tom1: { name: 'Tom', word: 'Bom!', color: '#3d9bff', kind: 'drum', hit: [0, -0.05, 1.0] },
  tom2: { name: 'Tom', word: 'Bum!', color: '#5cd65c', kind: 'drum', hit: [0, -0.05, 1.0] },
  floortom: { name: 'Floor tom', word: 'Doom!', color: '#9d5cff', kind: 'drum', hit: [0, -0.05, 1.0] },
  snare: { name: 'Snare', word: 'Tak!', color: '#ff4d5e', kind: 'snare', hit: [0, -0.05, 1.0] },
  kick: { name: 'Big drum', word: 'BOOM!', color: '#ff7ac6', kind: 'kick', hit: [0, 0, 1.0] },
  cowbell: { name: 'Cowbell', word: 'Clonk!', color: '#c7ced9', kind: 'cowbell', hit: [0, 0, 1.05] },
  tambourine: { name: 'Tambourine', word: 'Jingle!', color: '#ffb347', kind: 'tambourine', hit: [0, 0, 1.0] },
};

// [piece, x, y, r] in a box of bw x bh (one of these is picked to fit the screen)
const KIT_LAYOUTS = [
  { bw: 1, bh: 2.1, items: [
    ['crash', 0.27, 0.24, 0.21], ['hihat', 0.74, 0.24, 0.2],
    ['tom1', 0.19, 0.66, 0.155], ['tom2', 0.5, 0.64, 0.155], ['floortom', 0.81, 0.66, 0.165],
    ['kick', 0.5, 1.13, 0.29],
    ['snare', 0.19, 1.68, 0.17], ['cowbell', 0.5, 1.72, 0.13], ['tambourine', 0.81, 1.68, 0.16],
  ] },
  { bw: 1.45, bh: 1.5, items: [
    ['crash', 0.26, 0.27, 0.21], ['tom1', 0.73, 0.26, 0.17], ['hihat', 1.2, 0.27, 0.2],
    ['snare', 0.26, 0.76, 0.19], ['kick', 0.73, 0.8, 0.3], ['floortom', 1.2, 0.76, 0.19],
    ['tom2', 0.26, 1.24, 0.17], ['cowbell', 0.73, 1.3, 0.14], ['tambourine', 1.2, 1.24, 0.18],
  ] },
  { bw: 2.95, bh: 1, items: [
    ['crash', 0.3, 0.3, 0.24], ['hihat', 0.3, 0.76, 0.2],
    ['tom1', 0.86, 0.27, 0.19], ['snare', 0.86, 0.74, 0.21],
    ['kick', 1.47, 0.56, 0.38],
    ['tom2', 2.08, 0.27, 0.19], ['floortom', 2.08, 0.74, 0.21],
    ['cowbell', 2.64, 0.3, 0.16], ['tambourine', 2.64, 0.75, 0.2],
  ] },
];

function strokeInk(c, w) {
  c.lineWidth = w;
  c.strokeStyle = INK;
  c.stroke();
}

function stand(c, r, topY, footY, legs) {
  // a chrome pole with splayed feet
  c.lineCap = 'round';
  const pole = (x0, y0, x1, y1) => {
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.strokeStyle = INK;
    c.lineWidth = r * 0.11;
    c.stroke();
    c.strokeStyle = '#d9deea';
    c.lineWidth = r * 0.055;
    c.stroke();
  };
  if (legs) {
    pole(0, footY - r * 0.25, -r * 0.42, footY);
    pole(0, footY - r * 0.25, r * 0.42, footY);
  }
  pole(0, topY, 0, footY - (legs ? r * 0.2 : 0));
}

function drumBody(c, r, color, opts) {
  const rx = r * 0.92;
  const ry = r * 0.34;
  const top = -r * 0.32;
  const bot = r * 0.32;
  // shell
  c.beginPath();
  c.moveTo(-rx, top);
  c.lineTo(-rx, bot);
  c.ellipse(0, bot, rx, ry, 0, Math.PI, 0, true);
  c.lineTo(rx, top);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  // shell shine and shadow
  c.save();
  c.clip();
  c.fillStyle = 'rgba(255,255,255,.35)';
  c.fillRect(-rx * 0.7, top, rx * 0.22, bot - top + ry);
  c.fillStyle = 'rgba(0,0,0,.14)';
  c.fillRect(rx * 0.55, top, rx * 0.5, bot - top + ry);
  if (opts && opts.stripes) {
    c.fillStyle = 'rgba(255,255,255,.75)';
    c.fillRect(-rx, (top + bot) / 2 - r * 0.04, rx * 2, r * 0.08);
  }
  c.restore();
  c.beginPath();
  c.moveTo(-rx, top);
  c.lineTo(-rx, bot);
  c.ellipse(0, bot, rx, ry, 0, Math.PI, 0, true);
  c.lineTo(rx, top);
  strokeInk(c, r * 0.07);
  // lugs
  [-0.6, -0.2, 0.2, 0.6].forEach((f) => {
    const lx = f * rx;
    const ly = (top + bot) / 2 + Math.sqrt(1 - f * f) * ry * 0.5;
    rr(c, lx - r * 0.05, ly - r * 0.13, r * 0.1, r * 0.26, r * 0.05);
    c.fillStyle = '#eef0f7';
    c.fill();
    strokeInk(c, r * 0.035);
  });
  // bottom hoop
  c.beginPath();
  c.ellipse(0, bot, rx, ry, 0, 0.05, Math.PI - 0.05);
  c.strokeStyle = '#eef0f7';
  c.lineWidth = r * 0.06;
  c.stroke();
  // top skin
  ellipse(c, 0, top, rx, ry);
  c.fillStyle = '#fff9ea';
  c.fill();
  strokeInk(c, r * 0.07);
  ellipse(c, 0, top, rx * 0.84, ry * 0.8);
  c.strokeStyle = 'rgba(45,36,66,.15)';
  c.lineWidth = r * 0.03;
  c.stroke();
  // a little sparkle star on the skin
  c.fillStyle = shade(color, 0.35);
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rad = i % 2 ? r * 0.06 : r * 0.14;
    c.lineTo(Math.cos(a) * rad * 1.3, top + Math.sin(a) * rad * 0.55);
  }
  c.closePath();
  c.fill();
}

function cymbal(c, r, y, rx, ry, color) {
  const g = c.createLinearGradient(-rx, 0, rx, 0);
  g.addColorStop(0, shade(color, -0.1));
  g.addColorStop(0.35, shade(color, 0.45));
  g.addColorStop(0.6, color);
  g.addColorStop(1, shade(color, -0.2));
  ellipse(c, 0, y, rx, ry);
  c.fillStyle = g;
  c.fill();
  strokeInk(c, r * 0.06);
  [0.72, 0.45].forEach((f) => {
    ellipse(c, 0, y, rx * f, ry * f);
    c.strokeStyle = 'rgba(160,100,10,.35)';
    c.lineWidth = r * 0.025;
    c.stroke();
  });
  ellipse(c, 0, y - ry * 0.25, rx * 0.2, ry * 0.42);
  c.fillStyle = shade(color, 0.3);
  c.fill();
  strokeInk(c, r * 0.045);
  c.beginPath();
  c.ellipse(-rx * 0.35, y - ry * 0.25, rx * 0.25, ry * 0.25, -0.15, 0, TAU);
  c.fillStyle = 'rgba(255,255,255,.55)';
  c.fill();
}

function cuteFace(c, r, y) {
  // eyes
  [-1, 1].forEach((sx) => {
    ellipse(c, sx * r * 0.27, y - r * 0.08, r * 0.09, r * 0.12);
    c.fillStyle = INK;
    c.fill();
    c.beginPath();
    c.arc(sx * r * 0.27 + r * 0.03, y - r * 0.12, r * 0.035, 0, TAU);
    c.fillStyle = '#fff';
    c.fill();
    ellipse(c, sx * r * 0.42, y + r * 0.1, r * 0.1, r * 0.06);
    c.fillStyle = 'rgba(255,110,160,.55)';
    c.fill();
  });
  c.beginPath();
  c.arc(0, y + r * 0.04, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
  c.lineCap = 'round';
  strokeInk(c, r * 0.06);
}

const DRAW = {
  drum: {
    base(c, r, p) {
      if (p.id === 'floortom') {
        stand(c, r, r * 0.3, r * 0.95, false);
        c.save();
        c.translate(-r * 0.7, 0);
        stand(c, r, r * 0.3, r * 0.92, false);
        c.translate(r * 1.4, 0);
        stand(c, r, r * 0.3, r * 0.92, false);
        c.restore();
      } else stand(c, r, r * 0.3, r * 1.05, true);
    },
    top(c, r, p) { drumBody(c, r, p.color); },
    pivot: 0.62,
  },
  snare: {
    base(c, r) { stand(c, r, r * 0.3, r * 1.05, true); },
    top(c, r, p) { drumBody(c, r, p.color, { stripes: true }); },
    pivot: 0.62,
  },
  kick: {
    base(c, r) {
      // spurs and the pedal
      [-1, 1].forEach((sx) => {
        c.beginPath();
        c.moveTo(sx * r * 0.7, r * 0.55);
        c.lineTo(sx * r * 1.0, r * 1.0);
        c.strokeStyle = INK;
        c.lineWidth = r * 0.09;
        c.stroke();
        c.strokeStyle = '#d9deea';
        c.lineWidth = r * 0.045;
        c.stroke();
      });
      rr(c, -r * 0.16, r * 0.86, r * 0.32, r * 0.16, r * 0.05);
      c.fillStyle = '#d9deea';
      c.fill();
      strokeInk(c, r * 0.04);
    },
    top(c, r, p) {
      c.beginPath();
      c.arc(0, 0, r * 0.95, 0, TAU);
      c.fillStyle = p.color;
      c.fill();
      strokeInk(c, r * 0.06);
      // hoop and tension rods
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + Math.PI / 8;
        c.beginPath();
        c.arc(Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.88, r * 0.05, 0, TAU);
        c.fillStyle = '#eef0f7';
        c.fill();
        strokeInk(c, r * 0.025);
      }
      c.beginPath();
      c.arc(0, 0, r * 0.76, 0, TAU);
      c.fillStyle = '#fff9ea';
      c.fill();
      strokeInk(c, r * 0.05);
      c.beginPath();
      c.arc(0, 0, r * 0.76, Math.PI * 1.1, Math.PI * 1.45);
      c.strokeStyle = 'rgba(255,255,255,.9)';
      c.lineWidth = r * 0.05;
      c.stroke();
      cuteFace(c, r, 0);
      // star badge on top
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const rad = i % 2 ? r * 0.07 : r * 0.16;
        c.lineTo(Math.cos(a) * rad, -r * 0.48 + Math.sin(a) * rad);
      }
      c.closePath();
      c.fillStyle = '#ffd93b';
      c.fill();
      strokeInk(c, r * 0.03);
    },
    pivot: 0.95,
  },
  cymbal: {
    base(c, r) { stand(c, r, -r * 0.2, r * 1.05, true); },
    top(c, r, p) { cymbal(c, r, -r * 0.2, r * 1.0, r * 0.3, p.color); },
    pivot: -0.2,
  },
  hihat: {
    base(c, r) {
      stand(c, r, -r * 0.1, r * 1.05, true);
      cymbal(c, r, -r * 0.02, r * 0.85, r * 0.2, '#e8b830');
    },
    top(c, r, p) { cymbal(c, r, -r * 0.24, r * 0.85, r * 0.22, p.color); },
    pivot: -0.24,
  },
  cowbell: {
    base(c, r) {
      c.beginPath();
      c.moveTo(0, -r * 0.55);
      c.lineTo(0, r * 1.05);
      c.strokeStyle = INK;
      c.lineWidth = r * 0.14;
      c.stroke();
      c.strokeStyle = '#d9deea';
      c.lineWidth = r * 0.07;
      c.stroke();
      stand(c, r, r * 0.6, r * 1.1, true);
    },
    top(c, r, p) {
      c.beginPath();
      c.moveTo(-r * 0.32, -r * 0.62);
      c.lineTo(r * 0.32, -r * 0.62);
      c.lineTo(r * 0.62, r * 0.55);
      c.quadraticCurveTo(0, r * 0.68, -r * 0.62, r * 0.55);
      c.closePath();
      const g = c.createLinearGradient(-r * 0.6, 0, r * 0.6, 0);
      g.addColorStop(0, '#9aa3b5');
      g.addColorStop(0.35, '#ffffff');
      g.addColorStop(0.7, p.color);
      g.addColorStop(1, '#8a92a6');
      c.fillStyle = g;
      c.fill();
      strokeInk(c, r * 0.08);
      ellipse(c, 0, r * 0.52, r * 0.56, r * 0.14);
      c.fillStyle = INK;
      c.fill();
      cuteFace(c, r * 0.8, r * 0.02);
    },
    pivot: -0.6,
  },
  tambourine: {
    base() {},
    top(c, r, p) {
      c.beginPath();
      c.arc(0, 0, r * 0.88, 0, TAU);
      c.fillStyle = p.color;
      c.fill();
      strokeInk(c, r * 0.07);
      c.beginPath();
      c.arc(0, 0, r * 0.66, 0, TAU);
      c.fillStyle = '#fff4dc';
      c.fill();
      strokeInk(c, r * 0.05);
      // jingles
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6 + Math.PI / 6;
        const jx = Math.cos(a) * r * 0.77;
        const jy = Math.sin(a) * r * 0.77;
        c.save();
        c.translate(jx, jy);
        c.rotate(a + Math.PI / 2);
        rr(c, -r * 0.17, -r * 0.09, r * 0.34, r * 0.18, r * 0.05);
        c.fillStyle = INK;
        c.fill();
        ellipse(c, 0, 0, r * 0.14, r * 0.1);
        c.fillStyle = '#eef0f7';
        c.fill();
        strokeInk(c, r * 0.03);
        c.restore();
      }
      // ribbons and a heart on the skin
      c.beginPath();
      const hs = r * 0.22;
      c.moveTo(0, hs * 0.9);
      c.bezierCurveTo(-hs * 1.6, -hs * 0.2, -hs * 0.6, -hs * 1.3, 0, -hs * 0.45);
      c.bezierCurveTo(hs * 0.6, -hs * 1.3, hs * 1.6, -hs * 0.2, 0, hs * 0.9);
      c.fillStyle = '#ff5fa8';
      c.fill();
      strokeInk(c, r * 0.035);
    },
    pivot: 0,
  },
};

export class Drums {
  constructor() {
    this.pieces = Object.keys(PIECES).map((id) => Object.assign({ id, hitT: -9, x: 0, y: 0, r: 10, down: 0 }, PIECES[id]));
    this.byId = {};
    this.pieces.forEach((p) => { this.byId[p.id] = p; });
  }
  layout(area, dpr) {
    let best = null;
    let bestS = 0;
    for (const L of KIT_LAYOUTS) {
      const s = Math.min(area.w / L.bw, area.h / L.bh);
      if (s > bestS) { bestS = s; best = L; }
    }
    const s = bestS;
    const ox = area.x + (area.w - best.bw * s) / 2;
    const oy = area.y + (area.h - best.bh * s) / 2;
    best.items.forEach((it) => {
      const p = this.byId[it[0]];
      p.x = ox + it[1] * s;
      p.y = oy + it[2] * s;
      p.r = it[3] * s;
    });
    // draw order: back to front (higher on screen first), the big drum before what overlaps it
    this.order = this.pieces.slice().sort((a, b) => a.y - b.y);
    this.build(dpr);
  }
  /** Build the kit out of pictures: per piece its stand (with its shadow), then the part you hit. */
  build(dpr) {
    const root = group();
    for (const p of this.order) {
      const d = DRAW[p.kind];
      const size = p.r * 2.6;
      const half = size / 2;
      p.size = size;
      root.appendChild(picture(p.x - half, p.y - half, size, size, dpr, (c) => {
        c.lineJoin = 'round';
        c.lineCap = 'round';
        // soft floor shadow
        c.fillStyle = 'rgba(40,10,90,.18)';
        ellipse(c, p.x, p.y + p.r * 1.08, p.r * 0.8, p.r * 0.13);
        c.fill();
        c.translate(p.x, p.y);
        d.base(c, p.r, p);
      }));
      const piv = d.pivot * p.r;
      const g = group('move');
      const top = picture(-half, -half - piv, size, size, dpr, (c) => {
        c.lineJoin = 'round';
        c.lineCap = 'round';
        c.translate(0, -piv);
        d.top(c, p.r, p);
      });
      // a bright flash on the skin right after a hit
      const flash = picture(-half, -half - piv, size, size, dpr, (c) => {
        c.fillStyle = '#fff';
        if (p.kind === 'kick' || p.kind === 'tambourine') {
          c.beginPath();
          c.arc(0, -piv, p.r * 0.72, 0, TAU);
        } else if (p.kind === 'drum' || p.kind === 'snare') {
          ellipse(c, 0, -piv - p.r * 0.32, p.r * 0.86, p.r * 0.3);
        } else if (p.kind === 'cowbell') {
          ellipse(c, 0, -piv, p.r * 0.45, p.r * 0.5);
        } else {
          ellipse(c, 0, 0, p.r * 0.9, p.r * 0.25);
        }
        c.fill();
      }, 'fade');
      g.appendChild(top);
      g.appendChild(flash);
      root.appendChild(g);
      p.el = { g, flash };
    }
    this.dom = root;
    this.update(1e6); // at rest until the first frame
  }
  mount(root) {
    while (root.firstChild) root.removeChild(root.firstChild);
    if (this.dom) root.appendChild(this.dom);
  }
  pick(x, y) {
    let best = -1;
    let bestD = 1.0;
    this.pieces.forEach((p, i) => {
      const h = p.hit;
      const dx = x - (p.x + h[0] * p.r);
      const dy = y - (p.y + h[1] * p.r);
      const d = Math.sqrt(dx * dx + dy * dy) / (p.r * h[2]);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }
  keyCenter(i) {
    const p = this.pieces[i];
    return { x: p.x, y: p.y + p.hit[1] * p.r };
  }
  hit(i, t) { this.pieces[i].hitT = t; }
  busy(t) {
    for (const p of this.pieces) if (t - p.hitT < 1.6) return true;
    return false;
  }
  /** Wobble, squash and flash the pieces for time t (only what changed is touched). */
  update(t) {
    for (const p of this.order) {
      if (!p.el) continue;
      const age = t - p.hitT;
      const piv = DRAW[p.kind].pivot * p.r;
      let tf = `translate(${p.x}px,${p.y + piv}px)`;
      if (age < 1.6) {
        if (p.kind === 'cymbal') {
          tf += ` rotate(${(0.22 * decay(age, 2.6) * Math.sin(age * 16)).toFixed(5)}rad)`;
        } else if (p.kind === 'hihat') {
          tf += ` translate(0px,${(p.r * 0.1 * decay(age, 18)).toFixed(3)}px) rotate(${(0.08 * decay(age, 5) * Math.sin(age * 30)).toFixed(5)}rad)`;
        } else if (p.kind === 'cowbell') {
          tf += ` rotate(${(0.18 * decay(age, 4) * Math.sin(age * 20)).toFixed(5)}rad)`;
        } else if (p.kind === 'tambourine') {
          const sc = 1 + 0.08 * decay(age, 8);
          tf += ` rotate(${(0.3 * decay(age, 4) * Math.sin(age * 28)).toFixed(5)}rad) scale(${sc.toFixed(5)})`;
        } else {
          const k = decay(age, 6);
          const sq = Math.cos(age * 26) * k;
          tf += ` scale(${(1 + 0.07 * sq).toFixed(5)},${(1 - 0.1 * sq).toFixed(5)})`;
        }
      }
      setTransform(p.el.g, tf);
      const fl = decay(age, 9);
      setAlpha(p.el.flash, fl > 0.03 ? fl * 0.55 : 0);
    }
  }
}
