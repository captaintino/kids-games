// Paint helpers shared by the three Spin Art modes: colors (plain, rainbow,
// glitter), blobs, bubble prints and the soft "blotted" mirror for the butterfly.

export const COLORS = [
  { key: 'red', hex: '#ff4d5e' },
  { key: 'orange', hex: '#ff9a2e' },
  { key: 'yellow', hex: '#ffd93b' },
  { key: 'green', hex: '#5cd65c' },
  { key: 'teal', hex: '#22c7b8' },
  { key: 'blue', hex: '#3d7bff' },
  { key: 'purple', hex: '#9d5cff' },
  { key: 'pink', hex: '#ff7ac6' },
  { key: 'magenta', hex: '#e8399b' },
  { key: 'ink', hex: '#3a3550' },
  { key: 'rainbow', magic: true },
  { key: 'glitter', magic: true },
];

const GLITTER = ['#ffd23f', '#ffe680', '#f7b733', '#ffc8ec', '#c6f0ff', '#e7c6ff'];
const rand = (a, b) => a + Math.random() * (b - a);

/**
 * A color for the next bit of paint. Rainbow walks around the color wheel as you
 * paint; glitter picks shiny golds and pastels.
 */
export function paintColor(key, t) {
  if (key === 'rainbow') return `hsl(${Math.round((t * 140) % 360)}, 95%, 57%)`;
  if (key === 'glitter') return GLITTER[Math.floor(Math.random() * GLITTER.length)];
  for (const c of COLORS) if (c.key === key) return c.hex;
  return '#ff4d5e';
}

/** Tiny white and gold sparkles sprinkled around a point (glitter paint). */
export function specks(c, x, y, spread, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * spread;
    const r = rand(0.8, 2.6) * (spread / 18 + 0.6);
    c.fillStyle = Math.random() < 0.6 ? '#ffffff' : '#fff2a8';
    c.beginPath();
    const px = x + Math.cos(a) * d;
    const py = y + Math.sin(a) * d;
    // a little four-point twinkle
    c.moveTo(px, py - r * 1.8);
    c.lineTo(px + r * 0.45, py - r * 0.45);
    c.lineTo(px + r * 1.8, py);
    c.lineTo(px + r * 0.45, py + r * 0.45);
    c.lineTo(px, py + r * 1.8);
    c.lineTo(px - r * 0.45, py + r * 0.45);
    c.lineTo(px - r * 1.8, py);
    c.lineTo(px - r * 0.45, py - r * 0.45);
    c.closePath();
    c.fill();
  }
}

/** A wobbly round paint blob (a drop of paint, not a perfect circle). */
export function blob(c, x, y, r, color, seed) {
  const n = 12;
  const s = seed || 1;
  c.fillStyle = color;
  c.beginPath();
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.13 * Math.sin(a * 3 + s * 1.7) + 0.08 * Math.sin(a * 5 + s * 3.1);
    pts.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k]);
  }
  // smooth closed curve through the points
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    const mx = (p[0] + q[0]) / 2;
    const my = (p[1] + q[1]) / 2;
    if (i === 0) {
      const z = pts[n - 1];
      c.moveTo((z[0] + p[0]) / 2, (z[1] + p[1]) / 2);
    }
    c.quadraticCurveTo(p[0], p[1], mx, my);
  }
  c.closePath();
  c.fill();
}

/**
 * One bubble print: the ring a soapy, painty bubble leaves when it pops on paper,
 * with a pale middle and a few smaller rings inside it.
 */
export function bubblePrint(c, x, y, r, color, glitter) {
  c.save();
  c.fillStyle = color;
  c.strokeStyle = color;
  c.globalAlpha = 0.16;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 0.9;
  c.lineWidth = Math.max(1.5, r * 0.09);
  c.stroke();
  // inner foam rings, a bit off center
  const inner = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < inner; i++) {
    const rr = r * rand(0.25, 0.6);
    const a = Math.random() * Math.PI * 2;
    const d = (r - rr) * rand(0.2, 0.9);
    c.globalAlpha = rand(0.35, 0.6);
    c.lineWidth = Math.max(1, rr * 0.08);
    c.beginPath();
    c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, 0, Math.PI * 2);
    c.stroke();
  }
  // a shiny arc where the bubble caught the light
  c.globalAlpha = 0.55;
  c.lineWidth = Math.max(1, r * 0.05);
  c.beginPath();
  c.arc(x, y, r * 0.78, Math.PI * 1.1, Math.PI * 1.45);
  c.stroke();
  c.restore();
  if (glitter) specks(c, x, y, r, 3);
}

/** The bubble brush: a little cluster of bubble prints around a point. */
export function bubbleCluster(c, x, y, size, colorFn, glitter) {
  const n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const r = size * rand(0.3, 1);
    const a = Math.random() * Math.PI * 2;
    const d = size * rand(0, 1.1);
    bubblePrint(c, x + Math.cos(a) * d, y + Math.sin(a) * d, r, colorFn(), glitter);
  }
}

/** A blotchy speckle texture, drawn once, used to make mirrored paint look pressed. */
let mottle = null;
function mottleCanvas() {
  if (mottle) return mottle;
  mottle = document.createElement('canvas');
  mottle.width = mottle.height = 128;
  const c = mottle.getContext('2d');
  for (let i = 0; i < 260; i++) {
    c.fillStyle = `rgba(0,0,0,${rand(0.15, 0.6)})`;
    c.beginPath();
    c.arc(Math.random() * 128, Math.random() * 128, rand(0.6, 3.2), 0, Math.PI * 2);
    c.fill();
  }
  return mottle;
}

/**
 * Press the paper together: returns a new canvas where each half also gets the
 * other half's paint, mirrored across the middle and softened like a blot.
 */
export function blotMirror(src) {
  const w = src.width;
  const h = src.height;
  // 1. the mirror image, a little mottled
  const m = document.createElement('canvas');
  m.width = w;
  m.height = h;
  const mc = m.getContext('2d');
  mc.translate(w, 0);
  mc.scale(-1, 1);
  mc.drawImage(src, 0, 0);
  mc.setTransform(1, 0, 0, 1, 0, 0);
  mc.globalCompositeOperation = 'destination-out';
  mc.fillStyle = mc.createPattern(mottleCanvas(), 'repeat');
  mc.globalAlpha = 0.5;
  mc.fillRect(0, 0, w, h);
  // 2. soften it: several slightly shifted copies (no canvas blur filter on old Safari)
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const oc = out.getContext('2d');
  const d = Math.max(1.5, w / 400);
  const offs = [[0, 0], [d, 0], [-d, 0], [0, d], [0, -d], [d * 1.6, d * 1.2], [-d * 1.4, -d * 1.5], [d * 1.2, -d * 1.6]];
  offs.forEach((o, i) => {
    oc.globalAlpha = i === 0 ? 0.9 : 0.32;
    oc.drawImage(m, o[0], o[1]);
  });
  // 3. the original paint on top, also squished a little
  oc.globalAlpha = 1;
  oc.drawImage(src, 0, 0);
  oc.globalAlpha = 0.25;
  oc.drawImage(src, d * 0.8, d * 0.6);
  oc.drawImage(src, -d * 0.6, -d * 0.8);
  oc.globalAlpha = 1;
  return out;
}

/** True when a canvas has any paint on it (checked on a small copy). */
export function hasPaint(cv) {
  const s = document.createElement('canvas');
  s.width = 64;
  s.height = Math.max(1, Math.round(64 * cv.height / cv.width));
  const c = s.getContext('2d');
  c.drawImage(cv, 0, 0, s.width, s.height);
  const d = c.getImageData(0, 0, s.width, s.height).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 20) return true;
  return false;
}

/** Load a saved picture (data URL) into a canvas. */
export function loadInto(cv, url, done) {
  if (!url) { if (done) done(false); return; }
  const img = new Image();
  img.onload = () => {
    const c = cv.getContext('2d');
    c.drawImage(img, 0, 0, cv.width, cv.height);
    if (done) done(true);
  };
  img.onerror = () => { if (done) done(false); };
  img.src = url;
}
