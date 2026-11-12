// Background "worlds" behind the coloring screens. Each scene has:
//   paint(ctx, w, h, palette)  - the still picture, drawn ONCE into a cached canvas
//   animator                    - a few cheap moving bits drawn every frame (fish, clouds, flags...)
// Keeping the big picture cached means a whole scene costs one image copy per frame.
// Shared by every game in the collection (Bubble Pop Party keeps its own copy with
// per-level colors). The first world, Paint Party, takes each game's own colors.

// Paint Party sky colors: [top, middle, bottom]. One per screen, so the colors
// change as you move between the title and each coloring mode.
export const PARTY_THEMES = [
  ['#ff6fb5', '#c27bff', '#6fc8ff'], // title: cotton candy
  ['#ff6fa8', '#ff9f7a', '#ffd86b'], // Tap & Fill: sunset
  ['#36b7ff', '#6ad5ff', '#b9f3ff'], // Paint: sky
  ['#2bd4b4', '#64e6a8', '#c9ff8a'], // Color by Number: lagoon
  ['#4b3cff', '#8a4dff', '#ff6fd8'], // Magic Reveal: night party
];

export function starPath(ctx, x, y, outer, inner, points = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

export const SCENES = [
  { id: 'party', name: 'Paint Party', icon: '🎨' },
  { id: 'underwater', name: 'Under the Sea', icon: '🐠' },
  { id: 'west', name: 'Wild West', icon: '🤠' },
  { id: 'knights', name: 'Knights & Castles', icon: '🏰' },
  { id: 'space', name: 'Outer Space', icon: '🚀' },
  { id: 'farm', name: 'Farm', icon: '🐮' },
  { id: 'city', name: 'City', icon: '🚌' },
  { id: 'winter', name: 'Winter', icon: '⛄' },
  { id: 'birthday', name: 'Birthday Party', icon: '🎂' },
];

const TAU = Math.PI * 2;
const FONT = 'Fredoka, ui-rounded, system-ui, sans-serif';

// Seeded random so a scene looks the same every time it is redrawn (e.g. on rotate).
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = (a, b) => a + Math.random() * (b - a);

function vgrad(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
}

// Small sprite canvases drawn at 2x for crispness.
function sprite(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(w * 2);
  cv.height = Math.ceil(h * 2);
  const c = cv.getContext('2d');
  c.scale(2, 2);
  draw(c, w, h);
  return { img: cv, w, h };
}

function blit(ctx, s, x, y, scale = 1, flip = false, alpha = 1) {
  const w = s.w * scale;
  const h = s.h * scale;
  ctx.globalAlpha = alpha;
  if (flip) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.drawImage(s.img, -w / 2, -h / 2, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(s.img, x - w / 2, y - h / 2, w, h);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Shared sprites (built lazily, once)
// ---------------------------------------------------------------------------
let shared = null;
function sharedSprites() {
  if (shared) return shared;
  const soft = sprite(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });
  const sparkle = sprite(32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
    c.fillStyle = '#fff';
    starPath(c, 16, 16, 15, 2.2, 4, 0);
    c.fill();
  });
  const cloud = sprite(170, 80, (c) => {
    const puffs = [[40, 52, 26], [70, 38, 32], [104, 36, 28], [130, 52, 24], [86, 58, 26], [55, 60, 20], [118, 62, 18]];
    c.fillStyle = 'rgba(120, 140, 220, 0.18)';
    for (const [x, y, r] of puffs) { c.beginPath(); c.arc(x, y + 6, r, 0, TAU); c.fill(); }
    c.fillStyle = '#ffffff';
    for (const [x, y, r] of puffs) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.ellipse(66, 28, 14, 6, -0.3, 0, TAU); c.fill();
  });
  const ringBubble = sprite(24, 24, (c) => {
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    c.lineWidth = 1.8;
    c.beginPath(); c.arc(12, 12, 9, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.arc(9, 9, 2.2, 0, TAU); c.fill();
  });
  shared = { soft, sparkle, cloud, ringBubble };
  return shared;
}

// Clouds drifting slowly across the sky (used by a few scenes).
function makeClouds(n, yMin, yMax, alpha = 1) {
  const S = sharedSprites();
  let clouds = null;
  return {
    draw(ctx, w, h, t, dt) {
      if (!clouds) {
        clouds = Array.from({ length: n }, (_, i) => ({
          x: (i + Math.random() * 0.5) * (w / n), y: rand(yMin, yMax), s: rand(0.6, 1.1), v: rand(6, 14),
        }));
      }
      const u = Math.min(w, h) / 400;
      for (const cl of clouds) {
        cl.x += cl.v * dt;
        const half = S.cloud.w * cl.s * u * 0.5;
        if (cl.x - half > w) { cl.x = -half; cl.y = rand(yMin, yMax); }
        blit(ctx, S.cloud, cl.x, cl.y * h, cl.s * u, false, alpha);
      }
    },
  };
}

// Twinkling sparkles at random spots.
function makeTwinkles(n, yMax = 1) {
  const S = sharedSprites();
  const tw = Array.from({ length: n }, () => ({
    fx: Math.random(), fy: Math.random() * yMax, s: rand(6, 16), phase: rand(0, TAU), speed: rand(1.2, 3),
  }));
  return {
    draw(ctx, w, h, t) {
      for (const s of tw) {
        const a = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        const size = s.s * (0.6 + a * 0.6);
        ctx.globalAlpha = a * 0.85;
        ctx.drawImage(S.sparkle.img, s.fx * w - size / 2, s.fy * h - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    },
  };
}

// ---------------------------------------------------------------------------
// Paint Party (colors change with the screen you are on)
// ---------------------------------------------------------------------------
// `palette` is an index into PARTY_THEMES, or a game's own [top, middle, bottom] colors.
function paintParty(c, w, h, palette) {
  const [a, b, d] = Array.isArray(palette) ? palette : PARTY_THEMES[palette % PARTY_THEMES.length];
  c.fillStyle = vgrad(c, 0, h, [[0, a], [0.55, b], [1, d]]);
  c.fillRect(0, 0, w, h);
}

const BLOB_COLORS = ['#ff4d5e', '#ff9a2e', '#ffd93b', '#5cd65c', '#3d9bff', '#9d5cff', '#ff7ac6'];
let blobSprites = null;
function paintBlobs() {
  if (blobSprites) return blobSprites;
  blobSprites = BLOB_COLORS.map((color) => sprite(64, 64, (c) => {
    const g = c.createRadialGradient(22, 22, 0, 32, 32, 32);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  }));
  return blobSprites;
}

function partyAnimator() {
  const blobs = paintBlobs();
  const list = Array.from({ length: 11 }, () => ({
    fx: Math.random(), fy: Math.random(), r: rand(26, 80), v: rand(0.006, 0.02),
    a: rand(0.12, 0.24), drift: rand(0, TAU), k: Math.floor(Math.random() * blobs.length),
  }));
  const tw = makeTwinkles(24);
  return {
    draw(ctx, w, h, t, dt) {
      const u = Math.min(w, h) / 400;
      for (const b of list) {
        b.fy -= b.v * dt;
        if (b.fy < -0.2) { b.fy = 1.2; b.fx = Math.random(); b.k = Math.floor(Math.random() * blobs.length); }
        const r = b.r * u;
        ctx.globalAlpha = b.a;
        ctx.drawImage(blobs[b.k].img, b.fx * w + Math.sin(t * 0.3 + b.drift) * 20 - r, b.fy * h - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      tw.draw(ctx, w, h, t, dt);
    },
  };
}

// ---------------------------------------------------------------------------
// Under the Sea
// ---------------------------------------------------------------------------
const seaFloor = (w, h) => h - Math.max(70, h * 0.13);

function coral(c, R, x, y, len, ang, width, depth, color, tip) {
  const x2 = x + Math.cos(ang) * len;
  const y2 = y + Math.sin(ang) * len;
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
  if (depth > 0) {
    coral(c, R, x2, y2, len * 0.72, ang - 0.5 + R() * 0.2, width * 0.72, depth - 1, color, tip);
    coral(c, R, x2, y2, len * 0.72, ang + 0.5 - R() * 0.2, width * 0.72, depth - 1, color, tip);
  } else {
    c.fillStyle = tip;
    c.beginPath(); c.arc(x2, y2, width * 0.55, 0, TAU); c.fill();
  }
}

function paintUnderwater(c, w, h) {
  const R = rng(11);
  const u = Math.min(w, h) / 400;
  const floor = seaFloor(w, h);
  c.fillStyle = vgrad(c, 0, h, [[0, '#7aeaf4'], [0.25, '#2bb4e4'], [0.7, '#1474c6'], [1, '#0b4a9a']]);
  c.fillRect(0, 0, w, h);

  // sunbeams from the surface
  for (let i = 0; i < 6; i++) {
    const x = w * (0.04 + i * 0.19 + R() * 0.06);
    const top = (14 + R() * 26) * u;
    const bot = (110 + R() * 120) * u;
    const len = h * (0.55 + R() * 0.3);
    const skew = w * 0.1;
    c.fillStyle = vgrad(c, 0, len, [[0, 'rgba(255,255,255,0.24)'], [1, 'rgba(255,255,255,0)']]);
    c.beginPath();
    c.moveTo(x - top, 0); c.lineTo(x + top, 0);
    c.lineTo(x + bot + skew, len); c.lineTo(x - bot + skew, len);
    c.closePath(); c.fill();
  }
  // ripples at the surface
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = 3 * u;
  c.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    c.beginPath();
    for (let x = 0; x <= w; x += 10) {
      const y = (10 + k * 16) * u + Math.sin(x * 0.04 + k * 2) * 4 * u;
      x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
  }
  // far-away rocks
  c.fillStyle = 'rgba(8, 50, 125, 0.45)';
  for (let i = 0; i < 7; i++) {
    c.beginPath();
    c.ellipse(w * (i / 6) + R() * 30, floor + 12, w * 0.12 + R() * 40, (40 + R() * 70) * u, 0, 0, TAU);
    c.fill();
  }
  // coral
  c.lineCap = 'round';
  coral(c, R, w * 0.1, floor + 14, 46 * u, -Math.PI / 2, 13 * u, 3, '#ff6fa8', '#ffc1dc');
  coral(c, R, w * 0.9, floor + 14, 54 * u, -Math.PI / 2 - 0.1, 14 * u, 3, '#b36bff', '#e2c2ff');
  coral(c, R, w * 0.52, floor + 16, 30 * u, -Math.PI / 2 + 0.15, 10 * u, 2, '#ff9a4d', '#ffd2a6');
  // brain coral
  const bx = w * 0.72;
  const by = floor + 8;
  c.fillStyle = vgrad(c, by - 34 * u, by + 10 * u, [[0, '#ffd27a'], [1, '#ff9f4a']]);
  c.beginPath(); c.ellipse(bx, by, 40 * u, 30 * u, 0, Math.PI, 0); c.fill();
  c.strokeStyle = 'rgba(200, 100, 30, 0.45)';
  c.lineWidth = 3 * u;
  for (let k = 1; k < 4; k++) {
    c.beginPath(); c.ellipse(bx, by, 40 * u * k / 4, 30 * u * k / 4, 0, Math.PI, 0); c.stroke();
  }

  // sand
  c.beginPath();
  c.moveTo(0, h);
  for (let x = 0; x <= w + 20; x += 20) c.lineTo(x, floor + Math.sin(x * 0.015) * 8 * u + Math.sin(x * 0.043) * 3 * u);
  c.lineTo(w, h);
  c.closePath();
  c.fillStyle = vgrad(c, floor - 10, h, [[0, '#ffe9ad'], [1, '#efbd68']]);
  c.fill();
  c.fillStyle = 'rgba(190, 130, 50, 0.35)';
  for (let i = 0; i < 70; i++) {
    c.beginPath(); c.arc(R() * w, floor + 12 + R() * (h - floor - 14), (1 + R() * 2) * u, 0, TAU); c.fill();
  }

  // starfish
  const sx = w * 0.3;
  const sy = floor + (h - floor) * 0.5;
  c.save();
  c.translate(sx, sy);
  c.rotate(0.3);
  starPath(c, 0, 0, 24 * u, 11 * u);
  c.fillStyle = '#ff8357';
  c.strokeStyle = '#ff8357';
  c.lineJoin = 'round';
  c.lineWidth = 6 * u;
  c.stroke(); c.fill();
  c.fillStyle = '#ffd0b5';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 5;
    c.beginPath(); c.arc(Math.cos(a) * 12 * u, Math.sin(a) * 12 * u, 2.2 * u, 0, TAU); c.fill();
  }
  c.restore();

  // seashell
  const shx = w * 0.58;
  const shy = floor + (h - floor) * 0.6;
  c.fillStyle = '#ffd3e4';
  c.strokeStyle = '#f39abf';
  c.lineWidth = 2 * u;
  c.beginPath(); c.moveTo(shx, shy + 10 * u); c.arc(shx, shy + 10 * u, 22 * u, Math.PI * 1.1, Math.PI * 1.9); c.closePath();
  c.fill(); c.stroke();
  for (let i = 1; i < 5; i++) {
    const a = Math.PI * (1.1 + i * 0.16);
    c.beginPath(); c.moveTo(shx, shy + 10 * u); c.lineTo(shx + Math.cos(a) * 21 * u, shy + 10 * u + Math.sin(a) * 21 * u); c.stroke();
  }

  // treasure chest
  const cx = w * 0.84;
  const cy = floor + (h - floor) * 0.45;
  const cw = 54 * u;
  const ch = 32 * u;
  c.fillStyle = '#ffd34d';
  for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(cx - cw * 0.3 + i * cw * 0.15, cy - ch * 0.55 - (i % 2) * 4 * u, 6 * u, 0, TAU); c.fill(); }
  c.fillStyle = '#a5642f';
  c.strokeStyle = '#6e3d17';
  c.lineWidth = 2.5 * u;
  c.beginPath(); c.rect(cx - cw / 2, cy - ch / 2, cw, ch); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(cx, cy - ch / 2, cw / 2, ch * 0.45, 0, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#ffcf3d';
  c.fillRect(cx - 4 * u, cy - ch * 0.9, 8 * u, ch * 1.4);
  c.fillRect(cx - cw / 2, cy - ch * 0.12, cw, 5 * u);
  c.fillStyle = '#6e3d17';
  c.beginPath(); c.arc(cx, cy, 3 * u, 0, TAU); c.fill();
}

function fishSprite(body, belly, fin, stripe) {
  return sprite(90, 60, (c) => {
    c.fillStyle = fin;
    c.beginPath(); c.moveTo(24, 30); c.lineTo(4, 12); c.quadraticCurveTo(12, 30, 4, 48); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(36, 14); c.quadraticCurveTo(48, -2, 64, 14); c.closePath(); c.fill();
    c.fillStyle = vgrad(c, 11, 49, [[0, body], [1, belly]]);
    c.beginPath(); c.ellipse(50, 30, 32, 19, 0, 0, TAU); c.fill();
    if (stripe) {
      c.save();
      c.beginPath(); c.ellipse(50, 30, 32, 19, 0, 0, TAU); c.clip();
      c.fillStyle = stripe;
      c.fillRect(38, 0, 8, 60);
      c.fillRect(58, 0, 7, 60);
      c.restore();
    }
    c.strokeStyle = 'rgba(0,0,0,0.18)';
    c.lineWidth = 2;
    c.beginPath(); c.ellipse(50, 30, 32, 19, 0, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath(); c.ellipse(46, 20, 13, 4, -0.1, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(67, 25, 7.5, 0, TAU); c.fill();
    c.fillStyle = '#1d1d3a';
    c.beginPath(); c.arc(69, 25, 4.2, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(70.5, 23.3, 1.6, 0, TAU); c.fill();
    c.strokeStyle = '#1d1d3a';
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath(); c.arc(72, 33, 5, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke();
  });
}

let fishSprites = null;
function underwaterAnimator() {
  const S = sharedSprites();
  if (!fishSprites) {
    fishSprites = [
      fishSprite('#ffa43a', '#ff7a1a', '#ff8a2a', 'rgba(255,255,255,0.95)'),
      fishSprite('#ffe14a', '#ffbf1f', '#ffcd3a', null),
      fishSprite('#ff8ad0', '#ff4fae', '#ff6fc0', 'rgba(255,255,255,0.55)'),
      fishSprite('#6fd8ff', '#3a8cff', '#59b2ff', 'rgba(255,240,120,0.9)'),
    ];
  }
  let fish = null;
  let weeds = null;
  const bubbles = Array.from({ length: 16 }, () => ({ fx: Math.random(), fy: Math.random(), s: rand(0.5, 1.2), v: rand(0.04, 0.09), ph: rand(0, TAU) }));
  const newFish = (f, w, h, first) => {
    f.dir = Math.random() < 0.5 ? 1 : -1;
    f.y = rand(0.25, 0.72) * h;
    f.v = rand(28, 60) * f.dir;
    f.x = first ? rand(0, w) : f.dir > 0 ? -80 - rand(0, 300) : w + 80 + rand(0, 300);
  };
  return {
    draw(ctx, w, h, t, dt) {
      const u = Math.min(w, h) / 400;
      const floor = seaFloor(w, h);
      if (!fish || fish.w !== w) {
        fish = fishSprites.map((s) => { const f = { s, sc: rand(0.6, 0.95) }; newFish(f, w, h, true); return f; });
        fish.w = w;
        weeds = [0.04, 0.2, 0.42, 0.64, 0.78, 0.96].map((fx, i) => ({
          x: fx * w, hgt: rand(90, 170) * u, ph: rand(0, TAU), col: i % 2 ? '#2fbf6a' : '#46d67e',
        }));
      }
      // rising little bubbles
      for (const b of bubbles) {
        b.fy -= b.v * dt;
        if (b.fy < -0.05) { b.fy = 1.05; b.fx = Math.random(); }
        const x = b.fx * w + Math.sin(t * 2 + b.ph) * 6;
        blit(ctx, S.ringBubble, x, b.fy * floor, b.s * u, false, 0.8);
      }
      // fish
      for (const f of fish) {
        f.x += f.v * dt;
        if ((f.v > 0 && f.x > w + 100) || (f.v < 0 && f.x < -100)) newFish(f, w, h, false);
        blit(ctx, f.s, f.x, f.y + Math.sin(t * 1.6 + f.sc * 10) * 6 * u, f.sc * u, f.v < 0);
      }
      // swaying seaweed
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const wd of weeds) {
        const segs = 6;
        const step = wd.hgt / segs;
        for (const [col, lw] of [['#1b8f4c', 13 * u], [wd.col, 8 * u]]) {
          ctx.strokeStyle = col;
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(wd.x, floor + 14 * u);
          for (let i = 1; i <= segs; i++) {
            const sway = Math.sin(t * 1.4 + wd.ph + i * 0.55) * i * 2.6 * u;
            ctx.lineTo(wd.x + sway, floor + 14 * u - i * step);
          }
          ctx.stroke();
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Wild West
// ---------------------------------------------------------------------------
const westHorizon = (h) => h * 0.6;

function cactus(c, x, base, hh) {
  const tw = hh * 0.2;
  const parts = (lw) => {
    c.lineWidth = lw;
    c.beginPath(); c.moveTo(x, base); c.lineTo(x, base - hh); c.stroke();
    c.lineWidth = lw * 0.75;
    c.beginPath(); c.moveTo(x, base - hh * 0.42); c.lineTo(x - hh * 0.28, base - hh * 0.42); c.lineTo(x - hh * 0.28, base - hh * 0.74); c.stroke();
    c.beginPath(); c.moveTo(x, base - hh * 0.58); c.lineTo(x + hh * 0.26, base - hh * 0.58); c.lineTo(x + hh * 0.26, base - hh * 0.9); c.stroke();
  };
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.fillStyle = 'rgba(150, 80, 30, 0.25)';
  c.beginPath(); c.ellipse(x + hh * 0.05, base + 2, hh * 0.35, hh * 0.05, 0, 0, TAU); c.fill();
  c.strokeStyle = '#257a35'; parts(tw + 6);
  c.strokeStyle = '#46ad55'; parts(tw);
  c.save(); c.translate(-tw * 0.2, 0);
  c.strokeStyle = 'rgba(160, 240, 140, 0.6)'; parts(tw * 0.2);
  c.restore();
  c.fillStyle = '#ff6fa8';
  for (let i = 0; i < 5; i++) {
    const a = (i * TAU) / 5;
    c.beginPath(); c.arc(x + Math.cos(a) * tw * 0.22, base - hh - tw * 0.35 + Math.sin(a) * tw * 0.22, tw * 0.18, 0, TAU); c.fill();
  }
  c.fillStyle = '#ffe14a';
  c.beginPath(); c.arc(x, base - hh - tw * 0.35, tw * 0.12, 0, TAU); c.fill();
}

function paintWest(c, w, h) {
  const R = rng(7);
  const u = Math.min(w, h) / 400;
  const hz = westHorizon(h);
  c.fillStyle = vgrad(c, 0, hz, [[0, '#ff8d5c'], [0.45, '#ffb56c'], [1, '#ffe4a3']]);
  c.fillRect(0, 0, w, hz + 2);

  // sun
  const sx = w * 0.78;
  const sy = h * 0.17;
  const sr = 42 * u;
  const glow = c.createRadialGradient(sx, sy, sr, sx, sy, sr * 3);
  glow.addColorStop(0, 'rgba(255, 245, 170, 0.65)');
  glow.addColorStop(1, 'rgba(255, 245, 170, 0)');
  c.fillStyle = glow;
  c.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6);
  c.fillStyle = 'rgba(255, 250, 200, 0.45)';
  for (let i = 0; i < 12; i++) {
    const a = (i * TAU) / 12;
    c.beginPath();
    c.moveTo(sx + Math.cos(a - 0.1) * sr * 1.2, sy + Math.sin(a - 0.1) * sr * 1.2);
    c.lineTo(sx + Math.cos(a) * sr * 1.95, sy + Math.sin(a) * sr * 1.95);
    c.lineTo(sx + Math.cos(a + 0.1) * sr * 1.2, sy + Math.sin(a + 0.1) * sr * 1.2);
    c.fill();
  }
  const sun = c.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, 0, sx, sy, sr);
  sun.addColorStop(0, '#fffbe2');
  sun.addColorStop(0.5, '#ffe250');
  sun.addColorStop(1, '#ffb52e');
  c.fillStyle = sun;
  c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.fill();

  // mesas (flat-topped hills)
  const mesas = (list, color, stripe) => {
    for (const [x0, x1, top] of list) {
      const s = (x1 - x0) * 0.12;
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(x0, hz + 2); c.lineTo(x0 + s, hz - top); c.lineTo(x1 - s, hz - top); c.lineTo(x1, hz + 2);
      c.closePath(); c.fill();
      if (stripe) {
        c.strokeStyle = stripe;
        c.lineWidth = 3 * u;
        for (let k = 1; k < 3; k++) {
          const y = hz - top + (top * k) / 3;
          const inset = s * (1 - k / 3);
          c.beginPath(); c.moveTo(x0 + inset + 4, y); c.lineTo(x1 - inset - 4, y); c.stroke();
        }
      }
    }
  };
  mesas([[w * -0.05, w * 0.3, h * 0.09], [w * 0.42, w * 0.7, h * 0.13], [w * 0.75, w * 1.1, h * 0.07]], '#efa070');
  mesas([[w * 0.12, w * 0.5, h * 0.16], [w * 0.68, w * 0.92, h * 0.1]], '#d4693f', '#e88758');

  // desert ground
  c.fillStyle = vgrad(c, hz, h, [[0, '#f8cc84'], [1, '#e8a059']]);
  c.fillRect(0, hz, w, h - hz);
  c.strokeStyle = 'rgba(255, 240, 200, 0.55)';
  c.lineWidth = 3 * u;
  for (let k = 0; k < 4; k++) {
    const y0 = hz + (h - hz) * (0.18 + k * 0.22);
    c.beginPath();
    for (let x = 0; x <= w; x += 12) {
      const y = y0 + Math.sin(x * 0.012 + k * 1.7) * 8 * u;
      x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
  }
  c.fillStyle = 'rgba(160, 90, 40, 0.35)';
  for (let i = 0; i < 60; i++) {
    c.beginPath(); c.arc(R() * w, hz + 8 + R() * (h - hz - 10), (1 + R() * 2.2) * u, 0, TAU); c.fill();
  }
  // rocks
  for (const [fx, fy, s] of [[0.36, 0.86, 1], [0.7, 0.95, 1.3], [0.05, 0.97, 0.9]]) {
    const x = w * fx;
    const y = h * fy;
    c.fillStyle = '#b98060';
    c.beginPath(); c.ellipse(x, y, 22 * s * u, 13 * s * u, 0, Math.PI, 0); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.beginPath(); c.ellipse(x - 6 * s * u, y - 7 * s * u, 7 * s * u, 3 * s * u, -0.3, 0, TAU); c.fill();
  }

  cactus(c, w * 0.62, hz + (h - hz) * 0.18, 70 * u);
  cactus(c, w * 0.13, h * 0.84, 120 * u);
  cactus(c, w * 0.88, h * 0.92, 140 * u);

  // signpost
  const px = w * 0.42;
  const pb = h * 0.9;
  const ph = 100 * u;
  c.fillStyle = '#8a5a34';
  c.fillRect(px - 5 * u, pb - ph, 10 * u, ph);
  const bw = 112 * u;
  const bh = 32 * u;
  const by = pb - ph + 6 * u;
  c.fillStyle = '#d0904e';
  c.strokeStyle = '#7a4a24';
  c.lineWidth = 3 * u;
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(px - bw * 0.42, by); c.lineTo(px + bw * 0.42, by); c.lineTo(px + bw * 0.55, by + bh / 2);
  c.lineTo(px + bw * 0.42, by + bh); c.lineTo(px - bw * 0.42, by + bh); c.closePath();
  c.fill(); c.stroke();
  c.fillStyle = '#5a3418';
  c.font = `700 ${17 * u}px ${FONT}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('POP TOWN', px + bw * 0.02, by + bh / 2 + 1);
}

function westAnimator() {
  const clouds = makeClouds(3, 0.05, 0.3, 0.9);
  let tumble = null;
  let wait = 2;
  const tumbleSprite = sprite(56, 56, (c) => {
    const R = rng(3);
    c.lineCap = 'round';
    for (let i = 0; i < 30; i++) {
      c.strokeStyle = i % 3 ? '#a7743f' : '#cf9c5e';
      c.lineWidth = 2.2;
      const r = 8 + R() * 18;
      const a = R() * TAU;
      c.beginPath(); c.arc(28 + Math.cos(a) * (24 - r) * 0.5, 28 + Math.sin(a) * (24 - r) * 0.5, r, a, a + 2 + R() * 2); c.stroke();
    }
  });
  return {
    draw(ctx, w, h, t, dt) {
      clouds.draw(ctx, w, h, t, dt);
      const u = Math.min(w, h) / 400;
      if (!tumble) {
        wait -= dt;
        if (wait <= 0) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          tumble = { dir, x: dir > 0 ? -40 : w + 40, gy: rand(westHorizon(h) + (h - westHorizon(h)) * 0.35, h * 0.93), rot: 0, ph: 0, s: rand(0.8, 1.2) };
        }
        return;
      }
      tumble.x += tumble.dir * 110 * u * dt;
      tumble.ph += dt * 5;
      tumble.rot += tumble.dir * dt * 6;
      const r = 28 * u * tumble.s;
      const y = tumble.gy - r - Math.abs(Math.sin(tumble.ph)) * 26 * u;
      ctx.save();
      ctx.translate(tumble.x, y);
      ctx.rotate(tumble.rot);
      ctx.drawImage(tumbleSprite.img, -r, -r, r * 2, r * 2);
      ctx.restore();
      if (tumble.x < -60 || tumble.x > w + 60) { tumble = null; wait = rand(3, 8); }
    },
  };
}

// ---------------------------------------------------------------------------
// Knights & Castles
// ---------------------------------------------------------------------------
function castleLayout(w, h) {
  const S = Math.min(w * 0.78, h * 0.42);
  const cx = w * 0.5;
  const base = h * 0.66;
  const tw = S * 0.2;
  const towerH = S * 0.52;
  const roofH = S * 0.24;
  const keepH = S * 0.6;
  const poles = [
    { x: cx - S * 0.4, y: base - towerH - roofH - S * 0.1, color: '#ff4f8f' },
    { x: cx + S * 0.4, y: base - towerH - roofH - S * 0.1, color: '#7a5cff' },
    { x: cx, y: base - keepH - S * 0.16, color: '#ffcf2e' },
  ];
  return { S, cx, base, tw, towerH, roofH, keepH, poles };
}

function crenels(c, x, y, wdt, size) {
  const n = Math.max(3, Math.round(wdt / (size * 1.6)));
  const step = wdt / n;
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) c.fillRect(x + i * step, y - size, step + 0.5, size + 0.5);
  }
}

function lollipopTree(c, x, y, s) {
  c.fillStyle = '#8a5a34';
  c.fillRect(x - 3 * s, y - 22 * s, 6 * s, 22 * s);
  c.fillStyle = '#3fae3f';
  c.beginPath(); c.arc(x, y - 32 * s, 16 * s, 0, TAU); c.fill();
  c.fillStyle = '#62cc55';
  c.beginPath(); c.arc(x - 4 * s, y - 36 * s, 10 * s, 0, TAU); c.fill();
}

function paintKnights(c, w, h) {
  const R = rng(5);
  const u = Math.min(w, h) / 400;
  const L = castleLayout(w, h);
  c.fillStyle = vgrad(c, 0, h * 0.7, [[0, '#5cb6ff'], [0.6, '#a9e1ff'], [1, '#e9f9ff']]);
  c.fillRect(0, 0, w, h);

  // soft rainbow behind the castle
  const rr = Math.max(w, h * 0.7) * 0.55;
  const bands = ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'];
  c.globalAlpha = 0.32;
  c.lineWidth = 12 * u;
  bands.forEach((col, i) => {
    c.strokeStyle = col;
    c.beginPath(); c.arc(w * 0.5, h * 0.66, rr - i * 12 * u, Math.PI, 0); c.stroke();
  });
  c.globalAlpha = 1;

  // hills
  c.fillStyle = '#a8e07f';
  c.beginPath(); c.ellipse(w * 0.15, h * 0.68, w * 0.5, h * 0.12, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(w * 0.9, h * 0.67, w * 0.45, h * 0.11, 0, 0, TAU); c.fill();
  c.fillStyle = '#80d05c';
  c.beginPath(); c.ellipse(w * 0.5, h * 0.72, w * 0.75, h * 0.1, 0, 0, TAU); c.fill();

  // castle
  const { S, cx, base, tw, towerH, roofH, keepH } = L;
  const stone = '#d4cff0';
  const shade = '#b2abdb';
  const line = '#8077b8';
  const crn = S * 0.045;
  // keep
  c.fillStyle = shade;
  c.fillRect(cx - S * 0.15, base - keepH, S * 0.3, keepH);
  c.fillStyle = stone;
  c.fillRect(cx - S * 0.15, base - keepH, S * 0.22, keepH);
  c.fillStyle = shade;
  crenels(c, cx - S * 0.15, base - keepH, S * 0.3, crn);
  // main wall
  c.fillStyle = stone;
  c.fillRect(cx - S * 0.38, base - S * 0.3, S * 0.76, S * 0.3);
  crenels(c, cx - S * 0.38, base - S * 0.3, S * 0.76, crn);
  // towers + pointy roofs
  for (const [dx, roof, roofShade] of [[-0.4, '#ff5f8f', '#e03a72'], [0.4, '#8a6bff', '#6a4ee0']]) {
    const tx = cx + S * dx;
    c.fillStyle = stone;
    c.fillRect(tx - tw / 2, base - towerH, tw, towerH);
    c.fillStyle = shade;
    c.fillRect(tx + tw * 0.15, base - towerH, tw * 0.35, towerH);
    c.fillStyle = roof;
    c.beginPath(); c.moveTo(tx - tw * 0.65, base - towerH); c.lineTo(tx, base - towerH - roofH); c.lineTo(tx + tw * 0.65, base - towerH); c.closePath(); c.fill();
    c.fillStyle = roofShade;
    c.beginPath(); c.moveTo(tx, base - towerH - roofH); c.lineTo(tx + tw * 0.65, base - towerH); c.lineTo(tx + tw * 0.15, base - towerH); c.closePath(); c.fill();
    // window
    c.fillStyle = '#ffe27a';
    c.beginPath(); c.arc(tx, base - towerH * 0.6, tw * 0.16, Math.PI, 0); c.rect(tx - tw * 0.16, base - towerH * 0.6, tw * 0.32, tw * 0.3); c.fill();
  }
  // stone texture
  c.fillStyle = 'rgba(255,255,255,0.45)';
  for (let i = 0; i < 26; i++) {
    const bx = cx - S * 0.4 + R() * S * 0.8;
    const by = base - R() * S * 0.5;
    c.fillRect(bx, by, S * 0.05, S * 0.022);
  }
  // keep windows
  c.fillStyle = '#5a4e9a';
  for (const dy of [0.42, 0.62]) {
    c.beginPath(); c.arc(cx, base - keepH * dy - 6 * u, S * 0.03, Math.PI, 0); c.rect(cx - S * 0.03, base - keepH * dy - 6 * u, S * 0.06, S * 0.05); c.fill();
  }
  // banners on the wall
  for (const [dx, col, emblem] of [[-0.24, '#4dabf7', 'star'], [0.24, '#ff6b6b', 'heart']]) {
    const bx = cx + S * dx;
    const by = base - S * 0.26;
    const bw = S * 0.08;
    const bh = S * 0.15;
    c.fillStyle = col;
    c.beginPath(); c.moveTo(bx - bw / 2, by); c.lineTo(bx + bw / 2, by); c.lineTo(bx + bw / 2, by + bh); c.lineTo(bx, by + bh * 0.8); c.lineTo(bx - bw / 2, by + bh); c.closePath(); c.fill();
    c.fillStyle = '#ffe066';
    if (emblem === 'star') { starPath(c, bx, by + bh * 0.4, bw * 0.3, bw * 0.13); c.fill(); }
    else { c.beginPath(); c.arc(bx - bw * 0.12, by + bh * 0.36, bw * 0.15, 0, TAU); c.arc(bx + bw * 0.12, by + bh * 0.36, bw * 0.15, 0, TAU); c.fill(); c.beginPath(); c.moveTo(bx - bw * 0.26, by + bh * 0.4); c.lineTo(bx, by + bh * 0.62); c.lineTo(bx + bw * 0.26, by + bh * 0.4); c.fill(); }
  }
  // gate
  const gw = S * 0.16;
  const gh = S * 0.2;
  c.fillStyle = '#8a5a3c';
  c.beginPath(); c.moveTo(cx - gw / 2, base); c.lineTo(cx - gw / 2, base - gh + gw / 2); c.arc(cx, base - gh + gw / 2, gw / 2, Math.PI, 0); c.lineTo(cx + gw / 2, base); c.closePath(); c.fill();
  c.strokeStyle = '#5e3a22';
  c.lineWidth = 2 * u;
  for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(cx - gw / 2 + (gw * i) / 4, base); c.lineTo(cx - gw / 2 + (gw * i) / 4, base - gh + 4 * u); c.stroke(); }
  // outlines
  c.strokeStyle = line;
  c.lineWidth = 2 * u;
  c.strokeRect(cx - S * 0.38, base - S * 0.3, S * 0.76, S * 0.3);
  // flag poles
  c.strokeStyle = '#6e5a4a';
  c.lineWidth = 3 * u;
  for (const p of L.poles) {
    const bottom = p.x === cx ? base - keepH - crn : base - towerH - roofH + 2;
    c.beginPath(); c.moveTo(p.x, bottom); c.lineTo(p.x, p.y); c.stroke();
  }

  // front hills, path and trees
  c.fillStyle = '#5ec247';
  c.beginPath(); c.ellipse(w * 0.2, h * 1.02, w * 0.75, h * 0.3, 0, 0, TAU); c.fill();
  c.fillStyle = '#4caf3c';
  c.beginPath(); c.ellipse(w * 0.95, h * 1.05, w * 0.6, h * 0.3, 0, 0, TAU); c.fill();
  c.fillStyle = '#f3dca0';
  c.beginPath();
  c.moveTo(cx - gw * 0.45, base);
  c.quadraticCurveTo(cx - S * 0.3, h * 0.82, cx - w * 0.05, h);
  c.lineTo(cx + w * 0.18, h);
  c.quadraticCurveTo(cx + S * 0.05, h * 0.8, cx + gw * 0.45, base);
  c.closePath(); c.fill();
  lollipopTree(c, w * 0.1, h * 0.74, 1.3 * u);
  lollipopTree(c, w * 0.88, h * 0.76, 1.5 * u);
  lollipopTree(c, w * 0.8, h * 0.9, 2 * u);
  // flowers
  const fl = ['#ff6b9a', '#ffe066', '#ffffff', '#9775fa'];
  for (let i = 0; i < 40; i++) {
    const x = R() * w;
    const y = h * 0.8 + R() * h * 0.2;
    if (Math.abs(x - (cx + w * 0.05)) < w * 0.12) continue;
    c.fillStyle = fl[i % fl.length];
    c.beginPath(); c.arc(x, y, (2.5 + R() * 2) * u, 0, TAU); c.fill();
  }
}

function knightsAnimator() {
  const clouds = makeClouds(3, 0.08, 0.3);
  return {
    draw(ctx, w, h, t, dt) {
      clouds.draw(ctx, w, h, t, dt);
      const { S, poles } = castleLayout(w, h);
      const fl = S * 0.16;
      const fh = S * 0.09;
      for (const p of poles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        const n = 6;
        for (let i = 0; i <= n; i++) {
          const k = i / n;
          const y = p.y + Math.sin(t * 6 - k * 4) * fh * 0.25 * k;
          i === 0 ? ctx.moveTo(p.x, y) : ctx.lineTo(p.x + fl * k, y + fh * 0.5 * k * 0.2);
        }
        for (let i = n; i >= 0; i--) {
          const k = i / n;
          const y = p.y + fh + Math.sin(t * 6 - k * 4) * fh * 0.25 * k - fh * k * 0.35;
          ctx.lineTo(p.x + fl * k, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Outer Space
// ---------------------------------------------------------------------------
function paintSpace(c, w, h) {
  const R = rng(9);
  const u = Math.min(w, h) / 400;
  c.fillStyle = vgrad(c, 0, h, [[0, '#130a38'], [0.5, '#28156a'], [1, '#55208a']]);
  c.fillRect(0, 0, w, h);
  // nebula clouds
  for (const [fx, fy, r, col] of [[0.2, 0.3, 0.5, '255, 90, 200'], [0.8, 0.6, 0.55, '70, 200, 255'], [0.4, 0.85, 0.45, '170, 90, 255']]) {
    const x = w * fx;
    const y = h * fy;
    const rad = Math.max(w, h) * r;
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(${col}, 0.28)`);
    g.addColorStop(1, `rgba(${col}, 0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }
  // stars
  for (let i = 0; i < 160; i++) {
    c.globalAlpha = 0.4 + R() * 0.6;
    c.fillStyle = R() < 0.2 ? '#ffe9a8' : '#ffffff';
    c.beginPath(); c.arc(R() * w, R() * h, (0.6 + R() * 1.6) * u, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;

  // ringed planet
  const px = w * 0.76;
  const py = h * 0.24;
  const pr = 52 * u;
  const ring = (front) => {
    c.save();
    c.translate(px, py);
    c.rotate(-0.35);
    c.strokeStyle = '#ffe7a8';
    c.lineWidth = 8 * u;
    c.beginPath(); c.ellipse(0, 0, pr * 1.85, pr * 0.48, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); c.stroke();
    c.strokeStyle = 'rgba(255, 170, 110, 0.8)';
    c.lineWidth = 3 * u;
    c.beginPath(); c.ellipse(0, 0, pr * 2.1, pr * 0.58, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); c.stroke();
    c.restore();
  };
  ring(false);
  const pg = c.createRadialGradient(px - pr * 0.35, py - pr * 0.35, 0, px, py, pr);
  pg.addColorStop(0, '#ffe0a0');
  pg.addColorStop(0.5, '#ff9a6a');
  pg.addColorStop(1, '#d9456a');
  c.fillStyle = pg;
  c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
  c.save();
  c.beginPath(); c.arc(px, py, pr, 0, TAU); c.clip();
  c.fillStyle = 'rgba(255, 255, 255, 0.18)';
  for (let k = -2; k <= 2; k++) c.fillRect(px - pr, py + k * pr * 0.32, pr * 2, pr * 0.1);
  c.restore();
  ring(true);

  // little teal planet
  const qx = w * 0.16;
  const qy = h * 0.42;
  const qr = 24 * u;
  const qg = c.createRadialGradient(qx - qr * 0.3, qy - qr * 0.3, 0, qx, qy, qr);
  qg.addColorStop(0, '#b5fff4');
  qg.addColorStop(1, '#1fb5b0');
  c.fillStyle = qg;
  c.beginPath(); c.arc(qx, qy, qr, 0, TAU); c.fill();
  c.fillStyle = 'rgba(0, 90, 100, 0.3)';
  c.beginPath(); c.arc(qx + qr * 0.3, qy + qr * 0.2, qr * 0.25, 0, TAU); c.fill();

  // moon surface along the bottom
  const mr = Math.max(w, h) * 0.75;
  const mx = w * 0.4;
  const my = h + mr - Math.max(80, h * 0.15);
  const mg = c.createRadialGradient(mx, my - mr, 0, mx, my, mr);
  mg.addColorStop(0, '#e6e0ff');
  mg.addColorStop(1, '#a79ce0');
  c.fillStyle = mg;
  c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
  const surface = (x) => my - Math.sqrt(Math.max(0, mr * mr - (x - mx) * (x - mx)));
  for (let i = 0; i < 9; i++) {
    const x = R() * w;
    const y = surface(x) + (16 + R() * 60) * u;
    const r = (8 + R() * 16) * u;
    c.fillStyle = 'rgba(120, 105, 190, 0.45)';
    c.beginPath(); c.ellipse(x, y, r, r * 0.45, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255, 255, 255, 0.35)';
    c.beginPath(); c.ellipse(x, y + r * 0.12, r * 0.8, r * 0.3, 0, 0, Math.PI); c.fill();
  }
  // flag on the moon
  const fx = w * 0.78;
  const fy = surface(fx) + 6 * u;
  c.strokeStyle = '#ffffff';
  c.lineWidth = 3 * u;
  c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy - 56 * u); c.stroke();
  c.fillStyle = '#ff5fa8';
  c.fillRect(fx, fy - 56 * u, 34 * u, 22 * u);
  c.fillStyle = '#ffe066';
  starPath(c, fx + 17 * u, fy - 45 * u, 8 * u, 3.5 * u);
  c.fill();
}

function spaceAnimator() {
  const tw = makeTwinkles(30, 0.8);
  const S = sharedSprites();
  let shoot = null;
  let shootWait = 2;
  let rocket = null;
  let rocketWait = 3;
  const rocketSprite = sprite(100, 44, (c) => {
    c.fillStyle = '#ff5f6d';
    c.beginPath(); c.moveTo(22, 8); c.lineTo(36, 18); c.lineTo(36, 26); c.lineTo(22, 36); c.closePath(); c.fill();
    c.fillStyle = vgrad(c, 8, 36, [[0, '#ffffff'], [1, '#c9c6ee']]);
    c.beginPath(); c.moveTo(24, 12); c.lineTo(70, 12); c.quadraticCurveTo(96, 22, 70, 32); c.lineTo(24, 32); c.closePath(); c.fill();
    c.fillStyle = '#ff5f6d';
    c.beginPath(); c.moveTo(74, 12.6); c.quadraticCurveTo(96, 22, 74, 31.4); c.closePath(); c.fill();
    c.fillStyle = '#4dc3ff';
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2.5;
    c.beginPath(); c.arc(56, 22, 6.5, 0, TAU); c.fill(); c.stroke();
  });
  return {
    draw(ctx, w, h, t, dt) {
      tw.draw(ctx, w, h, t, dt);
      const u = Math.min(w, h) / 400;
      // shooting star
      if (!shoot) {
        shootWait -= dt;
        if (shootWait <= 0) shoot = { x: rand(0.2, 1) * w, y: rand(0, 0.35) * h, life: 0.9 };
      } else {
        shoot.life -= dt;
        shoot.x -= 520 * u * dt;
        shoot.y += 260 * u * dt;
        const g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x + 90 * u, shoot.y - 45 * u);
        g.addColorStop(0, `rgba(255,255,255,${Math.min(1, shoot.life * 2)})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 3 * u;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x + 90 * u, shoot.y - 45 * u); ctx.stroke();
        ctx.drawImage(S.sparkle.img, shoot.x - 10 * u, shoot.y - 10 * u, 20 * u, 20 * u);
        if (shoot.life <= 0) { shoot = null; shootWait = rand(2.5, 6); }
      }
      // rocket cruising by
      if (!rocket) {
        rocketWait -= dt;
        if (rocketWait <= 0) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          rocket = { dir, x: dir > 0 ? -80 : w + 80, y: rand(0.4, 0.68) * h, ph: rand(0, TAU) };
        }
      } else {
        rocket.x += rocket.dir * 70 * u * dt;
        const y = rocket.y + Math.sin(t * 1.5 + rocket.ph) * 10 * u;
        const s = 0.9 * u;
        ctx.save();
        ctx.translate(rocket.x, y);
        ctx.scale(rocket.dir * s, s);
        const flick = 0.7 + Math.random() * 0.5;
        ctx.fillStyle = '#ffb02e';
        ctx.beginPath(); ctx.moveTo(-26, -6); ctx.lineTo(-26 - 26 * flick, 0); ctx.lineTo(-26, 6); ctx.fill();
        ctx.fillStyle = '#fff3a0';
        ctx.beginPath(); ctx.moveTo(-26, -3); ctx.lineTo(-26 - 14 * flick, 0); ctx.lineTo(-26, 3); ctx.fill();
        ctx.drawImage(rocketSprite.img, -50 + 22, -22, 100, 44);
        ctx.restore();
        if (rocket.x < -120 || rocket.x > w + 120) { rocket = null; rocketWait = rand(6, 12); }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Little helpers for the newer worlds
// ---------------------------------------------------------------------------
function rrect(c, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + k, y);
  c.lineTo(x + w - k, y);
  c.quadraticCurveTo(x + w, y, x + w, y + k);
  c.lineTo(x + w, y + h - k);
  c.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  c.lineTo(x + k, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - k);
  c.lineTo(x, y + k);
  c.quadraticCurveTo(x, y, x + k, y);
  c.closePath();
}

function sunDisc(c, x, y, r, core = '#ffe250', rim = '#ffb52e') {
  const glow = c.createRadialGradient(x, y, r, x, y, r * 2.8);
  glow.addColorStop(0, 'rgba(255, 245, 170, 0.6)');
  glow.addColorStop(1, 'rgba(255, 245, 170, 0)');
  c.fillStyle = glow;
  c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, '#fffbe2');
  g.addColorStop(0.5, core);
  g.addColorStop(1, rim);
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}

// A wavy ridge from the left edge to the right edge, filled down to `bottom`.
function ridge(c, w, bottom, yAt, fill, step = 14) {
  c.beginPath();
  c.moveTo(0, bottom);
  for (let x = 0; x <= w + step; x += step) c.lineTo(x, yAt(x));
  c.lineTo(w, bottom);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

// soft round glow in one color (lamps, candle light)
const glowSprites = {};
function glowSprite(color) {
  if (!glowSprites[color]) {
    glowSprites[color] = sprite(48, 48, (c) => {
      const g = c.createRadialGradient(24, 24, 0, 24, 24, 24);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 48, 48);
    });
  }
  return glowSprites[color];
}

// Something that comes by now and then: a tractor, a car... The first one is
// already on screen (so world previews show it), later ones drive in from a side.
function mover(first) {
  return { on: first, x: 0, dir: 1, wait: 0 };
}
// World previews and saved pictures are made by drawing a few frames with big time
// steps (dt > 0.5) onto one still picture. Big moving things (tractors, cars, balloons)
// are drawn only on the first of those frames, so they don't show up two or three times.
const isStill = (dt) => dt > 0.5;

// ---------------------------------------------------------------------------
// Farm
// ---------------------------------------------------------------------------
function farmLayout(w, h) {
  const u = Math.min(w, h) / 400;
  const wide = w > h;
  const hz = h * 0.56;
  const fence = hz + (h - hz) * 0.42;
  const barn = { x: w * (wide ? 0.3 : 0.33), base: hz + 26 * u, s: u * (wide ? 1.05 : 0.96) };
  const mill = { x: w * (wide ? 0.85 : 0.84), base: hz + 12 * u, s: u * 0.95 };
  mill.hx = mill.x;
  mill.hy = mill.base - 122 * mill.s;
  const gate = barn.x;
  return { u, hz, fence, barn, mill, gate, lane: fence + (h - fence) * 0.52 };
}

function haybale(c, x, y, r) {
  c.fillStyle = 'rgba(60, 110, 30, 0.25)';
  c.beginPath(); c.ellipse(x + r * 0.7, y + r * 0.95, r * 1.5, r * 0.22, 0, 0, TAU); c.fill();
  // body going back to the right
  c.fillStyle = '#e9b543';
  rrect(c, x, y - r, r * 1.45, r * 2, r * 0.5);
  c.fill();
  c.strokeStyle = 'rgba(170, 110, 20, 0.5)';
  c.lineWidth = r * 0.07;
  for (let k = 1; k < 4; k++) {
    c.beginPath(); c.moveTo(x + r * 0.2, y - r + (k * r) / 2); c.lineTo(x + r * 1.3, y - r + (k * r) / 2); c.stroke();
  }
  // round face with a spiral
  c.fillStyle = '#ffd766';
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = '#d9a23a';
  c.lineWidth = r * 0.09;
  c.lineCap = 'round';
  c.beginPath();
  for (let a = 0; a < TAU * 3; a += 0.25) {
    const rr = (r * 0.88 * a) / (TAU * 3);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    a === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
  }
  c.stroke();
  c.strokeStyle = 'rgba(170, 110, 20, 0.6)';
  c.lineWidth = r * 0.06;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
}

function paintFarm(c, w, h) {
  const R = rng(21);
  const L = farmLayout(w, h);
  const { u, hz, fence } = L;
  c.fillStyle = vgrad(c, 0, hz, [[0, '#55bdfd'], [0.6, '#a6e2ff'], [1, '#e8faff']]);
  c.fillRect(0, 0, w, hz + 4);
  sunDisc(c, w * 0.16, h * 0.12, 32 * u);

  // far fields: a patchwork on the back hills, with hedges in between
  const back = (x) => hz - (26 + 14 * Math.sin(x * 0.006 + 1) + 8 * Math.sin(x * 0.019)) * u;
  ridge(c, w, hz + 4, back, '#a6dd7f');
  c.save();
  c.clip();
  const cols = ['#c8e87a', '#ffe08a', '#8fd16a', '#f5d06b', '#b5e383', '#9fd873'];
  const top = hz - 60 * u;
  let x = -w * 0.15;
  let i = 0;
  const edges = [];
  while (x < w * 1.15) {
    const bw = (46 + R() * 60) * u;
    c.fillStyle = cols[i % cols.length];
    c.beginPath();
    c.moveTo(x, hz + 4); c.lineTo(x + bw, hz + 4); c.lineTo(x + bw + 40 * u, top); c.lineTo(x + 40 * u, top);
    c.closePath(); c.fill();
    // crop rows in some fields
    if (i % 2 === 0) {
      c.strokeStyle = 'rgba(120, 150, 40, 0.25)';
      c.lineWidth = 2 * u;
      for (let k = 1; k < 4; k++) {
        const f = k / 4;
        c.beginPath(); c.moveTo(x + bw * f, hz + 4); c.lineTo(x + 40 * u + bw * f, top); c.stroke();
      }
    }
    edges.push(x + bw);
    x += bw;
    i++;
  }
  c.strokeStyle = '#6cbf4f';
  c.lineWidth = 4 * u;
  for (const ex of edges) { c.beginPath(); c.moveTo(ex, hz + 4); c.lineTo(ex + 40 * u, top); c.stroke(); }
  c.restore();
  // little round trees along the hedges
  for (let k = 0; k < 7; k++) {
    const tx = R() * w;
    const ty = back(tx) + 4 * u;
    c.fillStyle = '#4fa63e';
    c.beginPath(); c.arc(tx, ty - 7 * u, 9 * u, 0, TAU); c.fill();
    c.fillStyle = '#6cc451';
    c.beginPath(); c.arc(tx - 2 * u, ty - 9 * u, 5 * u, 0, TAU); c.fill();
  }

  // the farm yard
  c.fillStyle = vgrad(c, hz, h, [[0, '#8bd862'], [1, '#56b843']]);
  c.fillRect(0, hz, w, h - hz);
  // a wheat field on the right with rows
  const fx0 = w * 0.5;
  c.fillStyle = '#f3d36c';
  c.beginPath();
  c.moveTo(fx0 + 30 * u, hz + 6 * u); c.lineTo(w + 10, hz + 6 * u); c.lineTo(w + 10, fence - 52 * u); c.lineTo(fx0, fence - 52 * u);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(190, 140, 40, 0.45)';
  c.lineWidth = 3 * u;
  for (let y = hz + 14 * u; y < fence - 54 * u; y += 11 * u) {
    const k = (y - hz) / (fence - 52 * u - hz);
    c.beginPath(); c.moveTo(fx0 + 30 * u * (1 - k) + 6 * u, y); c.lineTo(w, y); c.stroke();
  }

  // windmill
  const M = L.mill;
  const s = M.s;
  c.fillStyle = 'rgba(40, 100, 20, 0.22)';
  c.beginPath(); c.ellipse(M.x, M.base, 34 * s, 6 * s, 0, 0, TAU); c.fill();
  c.fillStyle = vgrad(c, M.base - 110 * s, M.base, [[0, '#fff8e6'], [1, '#f1dfba']]);
  c.beginPath();
  c.moveTo(M.x - 25 * s, M.base); c.lineTo(M.x - 14 * s, M.base - 108 * s); c.lineTo(M.x + 14 * s, M.base - 108 * s); c.lineTo(M.x + 25 * s, M.base);
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(190, 150, 100, 0.35)';
  c.beginPath();
  c.moveTo(M.x + 6 * s, M.base); c.lineTo(M.x + 4 * s, M.base - 108 * s); c.lineTo(M.x + 14 * s, M.base - 108 * s); c.lineTo(M.x + 25 * s, M.base);
  c.closePath(); c.fill();
  c.fillStyle = '#e5414a';
  c.beginPath(); c.moveTo(M.x - 19 * s, M.base - 106 * s); c.quadraticCurveTo(M.x, M.base - 146 * s, M.x + 19 * s, M.base - 106 * s); c.closePath(); c.fill();
  c.fillStyle = '#9a5a34';
  c.beginPath(); c.arc(M.x, M.base - 14 * s, 9 * s, Math.PI, 0); c.rect(M.x - 9 * s, M.base - 14 * s, 18 * s, 14 * s); c.fill();
  c.fillStyle = '#7fc8ff';
  c.beginPath(); c.arc(M.x, M.base - 64 * s, 6 * s, 0, TAU); c.fill();
  c.strokeStyle = '#fff';
  c.lineWidth = 2 * s;
  c.stroke();

  // barn + silo
  const B = L.barn;
  const k = B.s;
  const bw = 150 * k;
  const x0 = B.x - bw / 2;
  const x1 = B.x + bw / 2;
  const base = B.base;
  const eave = base - 84 * k;
  const sh = eave - 40 * k;
  const peak = eave - 66 * k;
  // silo behind the right side
  const sx = x1 + 22 * k;
  const sw = 44 * k;
  const stop = base - 150 * k;
  c.fillStyle = 'rgba(40, 100, 20, 0.25)';
  c.beginPath(); c.ellipse(B.x + 20 * k, base + 2 * k, bw * 0.75, 10 * k, 0, 0, TAU); c.fill();
  const sg = c.createLinearGradient(sx, 0, sx + sw, 0);
  sg.addColorStop(0, '#eef3f8'); sg.addColorStop(0.6, '#cdd8e5'); sg.addColorStop(1, '#a9b8cb');
  c.fillStyle = sg;
  c.fillRect(sx, stop, sw, base - stop);
  c.strokeStyle = 'rgba(110, 125, 150, 0.45)';
  c.lineWidth = 2 * k;
  for (let y = stop + 18 * k; y < base; y += 18 * k) { c.beginPath(); c.moveTo(sx, y); c.lineTo(sx + sw, y); c.stroke(); }
  c.fillStyle = '#d6353f';
  c.beginPath(); c.ellipse(sx + sw / 2, stop, sw / 2 + 2 * k, sw * 0.55, 0, Math.PI, 0); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath(); c.ellipse(sx + sw * 0.32, stop - sw * 0.25, sw * 0.12, sw * 0.08, -0.5, 0, TAU); c.fill();

  const facade = () => {
    c.beginPath();
    c.moveTo(x0, base); c.lineTo(x0, eave); c.lineTo(x0 + 20 * k, sh); c.lineTo(B.x, peak);
    c.lineTo(x1 - 20 * k, sh); c.lineTo(x1, eave); c.lineTo(x1, base); c.closePath();
  };
  facade();
  c.fillStyle = vgrad(c, peak, base, [[0, '#f2575d'], [1, '#d2343f']]);
  c.fill();
  c.save();
  facade();
  c.clip();
  c.strokeStyle = 'rgba(120, 10, 25, 0.2)';
  c.lineWidth = 2 * k;
  for (let bx = x0 + 11 * k; bx < x1; bx += 11 * k) { c.beginPath(); c.moveTo(bx, peak); c.lineTo(bx, base); c.stroke(); }
  c.fillStyle = 'rgba(120, 10, 25, 0.15)';
  c.fillRect(B.x + bw * 0.28, peak, bw, base - peak);
  c.restore();
  // roof edge with white trim
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.strokeStyle = '#7b3530';
  c.lineWidth = 11 * k;
  c.beginPath(); c.moveTo(x0 - 7 * k, eave + 4 * k); c.lineTo(x0 + 18 * k, sh - 2 * k); c.lineTo(B.x, peak - 3 * k); c.lineTo(x1 - 18 * k, sh - 2 * k); c.lineTo(x1 + 7 * k, eave + 4 * k); c.stroke();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 4 * k;
  c.beginPath(); c.moveTo(x0 + 2 * k, eave + 8 * k); c.lineTo(x0 + 24 * k, sh + 6 * k); c.lineTo(B.x, peak + 8 * k); c.lineTo(x1 - 24 * k, sh + 6 * k); c.lineTo(x1 - 2 * k, eave + 8 * k); c.stroke();
  c.fillStyle = '#fff';
  c.fillRect(x0, eave + 6 * k, 5 * k, base - eave - 6 * k);
  c.fillRect(x1 - 5 * k, eave + 6 * k, 5 * k, base - eave - 6 * k);
  // hayloft
  const hw = 30 * k;
  const hy = eave - 22 * k;
  c.fillStyle = '#5a2328';
  c.fillRect(B.x - hw / 2, hy - hw / 2, hw, hw);
  c.fillStyle = '#ffd25a';
  c.beginPath(); c.moveTo(B.x - hw / 2, hy + hw / 2); c.quadraticCurveTo(B.x - hw / 4, hy - 2 * k, B.x, hy + 4 * k); c.quadraticCurveTo(B.x + hw / 4, hy - 4 * k, B.x + hw / 2, hy + hw / 2); c.closePath(); c.fill();
  c.strokeStyle = '#fff';
  c.lineWidth = 4 * k;
  c.strokeRect(B.x - hw / 2, hy - hw / 2, hw, hw);
  // big doors
  const dw = 64 * k;
  const dh = 60 * k;
  c.fillStyle = '#c42f3a';
  c.fillRect(B.x - dw / 2, base - dh, dw, dh);
  c.strokeStyle = '#fff';
  c.lineWidth = 4 * k;
  c.strokeRect(B.x - dw / 2, base - dh, dw, dh);
  c.beginPath();
  c.moveTo(B.x, base - dh); c.lineTo(B.x, base);
  c.moveTo(B.x - dw / 2, base - dh); c.lineTo(B.x, base); c.moveTo(B.x, base - dh); c.lineTo(B.x - dw / 2, base);
  c.moveTo(B.x + dw / 2, base - dh); c.lineTo(B.x, base); c.moveTo(B.x, base - dh); c.lineTo(B.x + dw / 2, base);
  c.stroke();
  // little side windows
  for (const wx of [x0 + 22 * k, x1 - 22 * k]) {
    c.fillStyle = '#ffe9a0';
    c.fillRect(wx - 9 * k, eave + 18 * k, 18 * k, 16 * k);
    c.strokeStyle = '#fff';
    c.lineWidth = 3 * k;
    c.strokeRect(wx - 9 * k, eave + 18 * k, 18 * k, 16 * k);
    c.beginPath(); c.moveTo(wx, eave + 18 * k); c.lineTo(wx, eave + 34 * k); c.stroke();
  }
  c.strokeStyle = '#9e2530';
  c.lineWidth = 2.5 * k;
  facade();
  c.stroke();

  // dirt path from the barn doors down through the gate
  c.fillStyle = '#e8c48c';
  c.beginPath();
  c.moveTo(B.x - dw / 2, base); c.lineTo(B.x + dw / 2, base);
  c.quadraticCurveTo(B.x + 60 * u, (base + h) / 2, B.x + 90 * u, h + 2);
  c.lineTo(B.x - 50 * u, h + 2);
  c.quadraticCurveTo(B.x - 50 * u, (base + h) / 2, B.x - dw / 2, base);
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(170, 120, 60, 0.35)';
  for (let j = 0; j < 18; j++) {
    const py = base + R() * (h - base);
    const f = (py - base) / (h - base);
    const px = B.x - dw / 2 + f * -10 * u + R() * (dw + f * 100 * u);
    c.beginPath(); c.arc(px, py, (1.5 + R() * 2) * u, 0, TAU); c.fill();
  }

  // hay bales in the field
  haybale(c, w * 0.62, hz + (fence - hz) * 0.42, 17 * u);
  haybale(c, w * (w > h ? 0.74 : 0.8), hz + (fence - hz) * 0.66, 21 * u);

  // the fence (open where the path goes through)
  const gapL = B.x - 48 * u;
  const gapR = B.x + 62 * u;
  const rail = (y) => {
    for (const [a, b] of [[-10, gapL], [gapR, w + 10]]) {
      c.fillStyle = '#b77a43';
      c.fillRect(a, y, b - a, 8 * u);
      c.fillStyle = '#d99c5e';
      c.fillRect(a, y, b - a, 3 * u);
    }
  };
  rail(fence - 38 * u);
  rail(fence - 18 * u);
  for (let px = 8 * u; px < w + 10 * u; px += 44 * u) {
    if (px > gapL - 4 * u && px < gapR + 4 * u) continue;
    c.fillStyle = '#9c6234';
    c.fillRect(px - 5 * u, fence - 48 * u, 10 * u, 52 * u);
    c.fillStyle = '#c4874f';
    c.fillRect(px - 5 * u, fence - 48 * u, 4 * u, 52 * u);
    c.fillStyle = '#9c6234';
    c.beginPath(); c.moveTo(px - 5 * u, fence - 48 * u); c.lineTo(px, fence - 54 * u); c.lineTo(px + 5 * u, fence - 48 * u); c.fill();
  }
  // gate posts
  for (const gx of [gapL, gapR]) {
    c.fillStyle = '#8a5530';
    c.fillRect(gx - 6 * u, fence - 56 * u, 12 * u, 60 * u);
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(gx, fence - 58 * u, 6 * u, 0, TAU); c.fill();
  }

  // flowers and grass tufts in the front
  c.strokeStyle = '#3f9e35';
  c.lineWidth = 2.5 * u;
  c.lineCap = 'round';
  for (let j = 0; j < 30; j++) {
    const gx = R() * w;
    const gy = fence + 12 * u + R() * (h - fence - 14 * u);
    c.beginPath();
    c.moveTo(gx - 4 * u, gy - 7 * u); c.lineTo(gx, gy); c.lineTo(gx + 1 * u, gy - 9 * u);
    c.moveTo(gx, gy); c.lineTo(gx + 5 * u, gy - 6 * u);
    c.stroke();
  }
  const fl = ['#ff6b9a', '#ffe066', '#ffffff', '#b98bff'];
  for (let j = 0; j < 34; j++) {
    const gx = R() * w;
    const gy = hz + 10 * u + R() * (h - hz - 12 * u);
    if (Math.abs(gx - B.x) < 70 * u && gy > base - 10 * u) continue;
    if (gy < fence - 50 * u && gx > fx0) continue;
    c.fillStyle = fl[j % fl.length];
    c.beginPath(); c.arc(gx, gy, (2.4 + R() * 2) * u, 0, TAU); c.fill();
  }
}

let farmSprites = null;
function henSprite(body, wing) {
  return sprite(60, 56, (c) => {
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(45, 36, 66, 0.45)';
    c.lineWidth = 1.6;
    // legs
    c.strokeStyle = '#f08a1c';
    c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(26, 40); c.lineTo(25, 52); c.lineTo(21, 54); c.moveTo(25, 52); c.lineTo(29, 54);
    c.moveTo(34, 40); c.lineTo(34, 52); c.lineTo(30, 54); c.moveTo(34, 52); c.lineTo(38, 54); c.stroke();
    c.strokeStyle = 'rgba(45, 36, 66, 0.4)';
    c.lineWidth = 1.6;
    // tail
    c.fillStyle = body;
    c.beginPath(); c.moveTo(14, 30); c.quadraticCurveTo(2, 10, 12, 8); c.quadraticCurveTo(16, 18, 22, 22); c.closePath(); c.fill(); c.stroke();
    // body
    c.beginPath(); c.ellipse(29, 31, 18, 13, 0, 0, TAU); c.fill(); c.stroke();
    // head
    c.beginPath(); c.arc(44, 18, 9, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(38, 24); c.quadraticCurveTo(44, 30, 42, 34); c.lineTo(36, 30); c.closePath(); c.fill();
    // comb and wattle
    c.fillStyle = '#ff4d5e';
    c.beginPath(); c.arc(40, 9, 3.4, 0, TAU); c.arc(45, 7.5, 3.6, 0, TAU); c.arc(50, 10, 3, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(51, 25, 2.4, 3.6, 0, 0, TAU); c.fill();
    // beak
    c.fillStyle = '#ffc21f';
    c.beginPath(); c.moveTo(52, 16); c.lineTo(59, 19.5); c.lineTo(52, 22); c.closePath(); c.fill();
    // wing
    c.fillStyle = wing;
    c.beginPath(); c.ellipse(27, 31, 10, 7, -0.25, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(45, 36, 66, 0.3)';
    c.beginPath(); c.moveTo(20, 32); c.quadraticCurveTo(27, 36, 34, 31); c.stroke();
    // eye
    c.fillStyle = '#2d2442';
    c.beginPath(); c.arc(46.5, 16.5, 2.1, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(47.1, 15.8, 0.7, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255, 120, 160, 0.5)';
    c.beginPath(); c.arc(44, 22, 2.2, 0, TAU); c.fill();
  });
}
function wheelSprite(r, rim) {
  return sprite(r * 2 + 2, r * 2 + 2, (c) => {
    const m = r + 1;
    c.fillStyle = '#3a3550';
    c.beginPath(); c.arc(m, m, r, 0, TAU); c.fill();
    c.strokeStyle = '#26223a';
    c.lineWidth = r * 0.16;
    for (let i = 0; i < 12; i++) {
      const a = (i * TAU) / 12;
      c.beginPath(); c.moveTo(m + Math.cos(a) * r * 0.82, m + Math.sin(a) * r * 0.82); c.lineTo(m + Math.cos(a) * r * 0.98, m + Math.sin(a) * r * 0.98); c.stroke();
    }
    c.fillStyle = rim;
    c.beginPath(); c.arc(m, m, r * 0.56, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.25)';
    c.lineWidth = r * 0.1;
    for (let i = 0; i < 5; i++) {
      const a = (i * TAU) / 5;
      c.beginPath(); c.moveTo(m, m); c.lineTo(m + Math.cos(a) * r * 0.5, m + Math.sin(a) * r * 0.5); c.stroke();
    }
    c.fillStyle = '#fff6c8';
    c.beginPath(); c.arc(m, m, r * 0.16, 0, TAU); c.fill();
  });
}
function buildFarmSprites() {
  if (farmSprites) return farmSprites;
  const sails = sprite(140, 140, (c) => {
    c.translate(70, 70);
    for (let i = 0; i < 4; i++) {
      c.save();
      c.rotate((i * Math.PI) / 2);
      c.fillStyle = '#8a5a34';
      c.fillRect(-2.5, -66, 5, 66);
      c.fillStyle = 'rgba(255, 255, 255, 0.95)';
      c.fillRect(3, -64, 15, 50);
      c.strokeStyle = '#b07a4a';
      c.lineWidth = 1.6;
      c.strokeRect(3, -64, 15, 50);
      for (let y = -54; y < -14; y += 10) { c.beginPath(); c.moveTo(3, y); c.lineTo(18, y); c.stroke(); }
      c.beginPath(); c.moveTo(10.5, -64); c.lineTo(10.5, -14); c.stroke();
      c.restore();
    }
    c.fillStyle = '#7a4b2a';
    c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.fill();
    c.fillStyle = '#ffd93b';
    c.beginPath(); c.arc(0, 0, 3, 0, TAU); c.fill();
  });
  // tractor facing right, wheels drawn separately so they can roll
  const tractor = sprite(150, 100, (c) => {
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(45, 36, 66, 0.45)';
    c.lineWidth = 2;
    // exhaust pipe
    c.fillStyle = '#5b5670';
    c.fillRect(110, 14, 6, 30);
    c.fillStyle = '#3a3550';
    c.fillRect(108, 12, 10, 4);
    // hood
    c.fillStyle = '#43b649';
    rrect(c, 70, 38, 74, 34, 8); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.3)';
    rrect(c, 76, 42, 56, 6, 3); c.fill();
    c.fillStyle = '#2f8f3a';
    for (let x = 128; x < 142; x += 4) c.fillRect(x, 50, 2, 18);
    // headlight
    c.fillStyle = '#fff59a';
    c.beginPath(); c.arc(141, 46, 4, 0, TAU); c.fill(); c.stroke();
    // cabin
    c.fillStyle = '#43b649';
    c.beginPath(); c.moveTo(28, 72); c.lineTo(30, 14); c.lineTo(74, 14); c.lineTo(78, 72); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#bfeaff';
    c.beginPath(); c.moveTo(38, 46); c.lineTo(39, 22); c.lineTo(68, 22); c.lineTo(70, 46); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath(); c.moveTo(44, 40); c.lineTo(54, 24); c.lineTo(59, 24); c.lineTo(49, 40); c.closePath(); c.fill();
    // a happy farmer in the window
    c.fillStyle = '#ffd2a6';
    c.beginPath(); c.arc(56, 36, 7, 0, TAU); c.fill();
    c.fillStyle = '#e5414a';
    c.beginPath(); c.arc(56, 31, 7, Math.PI, 0); c.fill();
    c.fillRect(56, 29.5, 10, 2.5);
    c.fillStyle = '#2d2442';
    c.beginPath(); c.arc(59, 36, 1.2, 0, TAU); c.fill();
    // roof
    c.fillStyle = '#ffd93b';
    rrect(c, 22, 6, 60, 10, 4); c.fill(); c.stroke();
    // fender over the big wheel
    c.fillStyle = '#ffd93b';
    c.beginPath(); c.arc(46, 70, 32, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(76, 74); c.lineTo(16, 74); c.closePath(); c.fill(); c.stroke();
  });
  farmSprites = {
    sails,
    tractor,
    bigWheel: wheelSprite(28, '#ffd93b'),
    smallWheel: wheelSprite(16, '#ffd93b'),
    hens: [henSprite('#ffffff', '#f1ece4'), henSprite('#d98a4e', '#b8693a'), henSprite('#fff7ec', '#efe2cf')],
  };
  return farmSprites;
}

function farmAnimator() {
  const S = sharedSprites();
  const F = buildFarmSprites();
  const clouds = makeClouds(3, 0.04, 0.22);
  let lay = null;
  let hens = null;
  const trac = mover(true);
  const puffs = [];
  let puffWait = 0;
  return {
    draw(ctx, w, h, t, dt) {
      if (!lay || lay.w !== w || lay.h !== h) {
        lay = farmLayout(w, h);
        lay.w = w;
        lay.h = h;
        const f = lay.fence;
        hens = [[0.12, 0.3], [0.62, 0.22], [0.86, 0.86], [0.38, 0.9]].map(([fx, fy], i) => ({
          x: fx * w, y: f + 14 * lay.u + fy * (h - f - 18 * lay.u), dir: i % 2 ? -1 : 1, ph: i * 1.7,
          s: F.hens[i % F.hens.length], walk: rand(0, 3),
        }));
        trac.x = w * 0.6;
        trac.dir = 1;
      }
      const u = lay.u;
      const still = isStill(dt);
      clouds.draw(ctx, w, h, t, dt);
      // windmill sails
      const M = lay.mill;
      const sz = 140 * M.s;
      if (!still) {
        ctx.save();
        ctx.translate(M.hx, M.hy);
        ctx.rotate(t * 0.7);
        ctx.drawImage(F.sails.img, -sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      }

      // the tractor comes by now and then
      if (!trac.on) {
        trac.wait -= dt;
        if (trac.wait <= 0) {
          trac.on = true;
          trac.dir = Math.random() < 0.5 ? 1 : -1;
          trac.x = trac.dir > 0 ? -90 * u : w + 90 * u;
        }
      } else {
        trac.x += trac.dir * 46 * u * dt;
        if (trac.x < -100 * u || trac.x > w + 100 * u) { trac.on = false; trac.wait = rand(3, 8); }
      }
      // hens wander and peck
      for (const hn of hens) {
        hn.walk -= dt;
        if (hn.walk < 0) {
          hn.walk = rand(2, 5);
          if (Math.random() < 0.5) hn.dir = -hn.dir;
        }
        const pecking = Math.sin(t * 0.9 + hn.ph) > 0.1;
        if (!pecking) hn.x += hn.dir * 12 * u * dt;
        if (hn.x < 20 * u) hn.dir = 1;
        if (hn.x > w - 20 * u) hn.dir = -1;
        hn.peck = pecking ? Math.pow(Math.max(0, Math.sin(t * 9 + hn.ph * 3)), 4) : 0;
      }
      const drawHen = (hn) => {
        if (still) return;
        const k = 0.78 * u;
        ctx.save();
        ctx.translate(hn.x, hn.y);
        ctx.scale(hn.dir, 1);
        ctx.rotate(hn.peck * 0.75);
        ctx.drawImage(hn.s.img, -30 * k, -54 * k, 60 * k, 56 * k);
        ctx.restore();
      };
      const lane = lay.lane;
      for (const hn of hens) if (hn.y <= lane) drawHen(hn);
      if (trac.on && !still) {
        const k = 0.72 * u;
        const bob = Math.abs(Math.sin(t * 9)) * 1.2 * u;
        ctx.save();
        ctx.translate(trac.x, lane - bob);
        ctx.scale(trac.dir * k, k);
        ctx.drawImage(F.tractor.img, -75, -100, 150, 100);
        const roll = (trac.x / (28 * k)) * trac.dir;
        for (const [wx, wy, r, sp] of [[46 - 75, 70 - 100, 28, F.bigWheel], [122 - 75, 83 - 100, 16, F.smallWheel]]) {
          ctx.save();
          ctx.translate(wx, wy);
          ctx.rotate(roll * (28 / r));
          ctx.drawImage(sp.img, -r - 1, -r - 1, r * 2 + 2, r * 2 + 2);
          ctx.restore();
        }
        ctx.restore();
        // little puffs from the pipe
        puffWait -= dt;
        if (puffWait <= 0 && puffs.length < 5) {
          puffWait = 0.45;
          puffs.push({ x: trac.x + trac.dir * (113 - 75) * k, y: lane - (100 - 10) * k, life: 0 });
        }
      }
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.life += dt;
        p.y -= 22 * u * dt;
        p.x -= trac.dir * 8 * u * dt;
        if (p.life > 1.6) { puffs.splice(i, 1); continue; }
        const r = (5 + p.life * 9) * u;
        ctx.globalAlpha = 0.7 * (1 - p.life / 1.6);
        ctx.drawImage(S.soft.img, p.x - r, p.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      for (const hn of hens) if (hn.y > lane) drawHen(hn);
    },
  };
}

// ---------------------------------------------------------------------------
// City
// ---------------------------------------------------------------------------
const CITY_COLORS = ['#ff8f6b', '#ffcf5c', '#5fd3e0', '#a98bff', '#ff85b8', '#7fd68a', '#6fb4ff', '#ffa94d'];
function cityLayout(w, h) {
  const u = Math.min(w, h) / 400;
  const g = h * 0.6;
  const walk = 16 * u;
  const road0 = g + walk;
  const roadH = 78 * u;
  const road1 = road0 + roadH;
  const R = rng(33);
  const blocks = [];
  let x = -12 * u;
  let i = 0;
  while (x < w + 10 * u) {
    const bw = (64 + R() * 44) * u;
    const bh = Math.max(96 * u, Math.min(g - 70 * u, h * (0.15 + R() * 0.22)));
    const b = { x, w: bw, h: bh, col: CITY_COLORS[(i * 3 + Math.floor(R() * 2)) % CITY_COLORS.length], shop: R() < 0.45, roof: R(), win: [] };
    const shopH = b.shop ? 34 * u : 0;
    const cols = Math.max(1, Math.floor((bw - 14 * u) / (21 * u)));
    const rows = Math.max(1, Math.floor((bh - 26 * u - shopH) / (27 * u)));
    const gapX = (bw - cols * 12 * u) / (cols + 1);
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        b.win.push({ x: x + gapX + k * (12 * u + gapX), y: g - bh + 16 * u + r * 27 * u, lit: R() < 0.3 });
      }
    }
    blocks.push(b);
    x += bw + (R() < 0.25 ? 8 * u : 0);
    i++;
  }
  const lights = [w * 0.17, w * 0.83].map((lx) => ({ x: lx, top: g + walk * 0.5 - 110 * u }));
  return { u, g, walk, road0, roadH, road1, blocks, lights, lanes: [road0 + roadH * 0.42, road0 + roadH * 0.92] };
}

function paintCity(c, w, h) {
  const R = rng(17);
  const L = cityLayout(w, h);
  const { u, g, walk, road0, roadH, road1 } = L;
  c.fillStyle = vgrad(c, 0, g, [[0, '#6ccaff'], [0.65, '#bfe9ff'], [1, '#fff0dc']]);
  c.fillRect(0, 0, w, g + 2);
  sunDisc(c, w * 0.82, h * 0.1, 28 * u);

  // far skyline
  let x = -10;
  while (x < w + 10) {
    const bw = (34 + R() * 52) * u;
    const bh = Math.min(g * 0.9, h * (0.24 + R() * 0.22));
    c.fillStyle = '#c4cdf4';
    c.fillRect(x, g - bh, bw, bh);
    if (R() < 0.35) { c.fillRect(x + bw * 0.45, g - bh - 18 * u, 3 * u, 18 * u); }
    c.fillStyle = 'rgba(255,255,255,0.45)';
    for (let wy = g - bh + 10 * u; wy < g - 20 * u; wy += 16 * u) {
      for (let wx = x + 6 * u; wx < x + bw - 8 * u; wx += 12 * u) c.fillRect(wx, wy, 5 * u, 7 * u);
    }
    x += bw + 2 * u;
  }

  // main buildings
  for (const b of L.blocks) {
    const top = g - b.h;
    c.fillStyle = b.col;
    c.fillRect(b.x, top, b.w, b.h);
    c.fillStyle = 'rgba(60, 30, 90, 0.14)';
    c.fillRect(b.x + b.w * 0.82, top, b.w * 0.18, b.h);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(b.x - 3 * u, top - 6 * u, b.w + 6 * u, 7 * u);
    c.fillStyle = 'rgba(60, 30, 90, 0.18)';
    c.fillRect(b.x - 3 * u, top + 1 * u, b.w + 6 * u, 2 * u);
    // rooftop things
    if (b.roof < 0.25) {
      // water tower
      const tx = b.x + b.w * 0.35;
      c.fillStyle = '#9a6a45';
      c.fillRect(tx - 9 * u, top - 22 * u, 2.5 * u, 16 * u);
      c.fillRect(tx + 7 * u, top - 22 * u, 2.5 * u, 16 * u);
      c.fillStyle = '#c08a5a';
      rrect(c, tx - 12 * u, top - 42 * u, 24 * u, 22 * u, 3 * u); c.fill();
      c.fillStyle = '#8a5a34';
      c.beginPath(); c.moveTo(tx - 14 * u, top - 41 * u); c.lineTo(tx, top - 52 * u); c.lineTo(tx + 14 * u, top - 41 * u); c.closePath(); c.fill();
    } else if (b.roof < 0.45) {
      c.strokeStyle = '#6b6f86';
      c.lineWidth = 2.5 * u;
      c.beginPath(); c.moveTo(b.x + b.w * 0.6, top - 6 * u); c.lineTo(b.x + b.w * 0.6, top - 34 * u); c.stroke();
      c.fillStyle = '#ff4d5e';
      c.beginPath(); c.arc(b.x + b.w * 0.6, top - 35 * u, 3.5 * u, 0, TAU); c.fill();
    }
    for (const wn of b.win) {
      c.fillStyle = wn.lit ? '#fff3a6' : '#d9f2ff';
      c.fillRect(wn.x, wn.y, 12 * u, 15 * u);
      c.fillStyle = 'rgba(60, 30, 90, 0.2)';
      c.fillRect(wn.x, wn.y + 13 * u, 12 * u, 2 * u);
    }
    if (b.shop) {
      // a little shop with a striped awning
      const ay = g - 34 * u;
      c.fillStyle = '#e9f6ff';
      c.fillRect(b.x + 6 * u, ay + 10 * u, b.w - 30 * u, 24 * u);
      c.fillStyle = '#8a5a34';
      c.fillRect(b.x + b.w - 22 * u, ay + 8 * u, 14 * u, 26 * u);
      const n = Math.max(3, Math.round((b.w - 4 * u) / (12 * u)));
      const sw = (b.w - 4 * u) / n;
      for (let k = 0; k < n; k++) {
        c.fillStyle = k % 2 ? '#ffffff' : ['#ff4d5e', '#3d9bff', '#2fbf6a', '#ff9a2e'][Math.floor(b.roof * 40) % 4];
        c.beginPath();
        c.moveTo(b.x + 2 * u + k * sw, ay);
        c.lineTo(b.x + 2 * u + (k + 1) * sw, ay);
        c.lineTo(b.x + 2 * u + (k + 1) * sw, ay + 8 * u);
        c.arc(b.x + 2 * u + (k + 0.5) * sw, ay + 8 * u, sw / 2, 0, Math.PI);
        c.closePath();
        c.fill();
      }
    } else {
      // a door
      c.fillStyle = '#8a5a34';
      c.fillRect(b.x + b.w * 0.5 - 8 * u, g - 26 * u, 16 * u, 26 * u);
      c.fillStyle = '#ffd93b';
      c.beginPath(); c.arc(b.x + b.w * 0.5 + 4 * u, g - 13 * u, 1.8 * u, 0, TAU); c.fill();
    }
  }

  // sidewalk and road
  c.fillStyle = '#e6e2f2';
  c.fillRect(0, g, w, walk);
  c.fillStyle = '#c9c3dd';
  c.fillRect(0, road0 - 4 * u, w, 4 * u);
  c.fillStyle = vgrad(c, road0, road1, [[0, '#5d6178'], [1, '#4c5068']]);
  c.fillRect(0, road0, w, roadH);
  c.fillStyle = '#ffd93b';
  const mid = road0 + roadH * 0.5;
  for (let lx = 10 * u; lx < w; lx += 46 * u) c.fillRect(lx, mid - 2 * u, 26 * u, 4 * u);
  // crosswalk
  const cx = w * 0.5;
  c.fillStyle = 'rgba(255,255,255,0.85)';
  for (let k = 0; k < 6; k++) c.fillRect(cx - 40 * u + k * 15 * u, road0 + 5 * u, 8 * u, roadH - 10 * u);

  // traffic light poles (lamps are drawn by the animator)
  for (const lt of L.lights) {
    c.fillStyle = '#4a4a62';
    c.fillRect(lt.x - 3 * u, lt.top + 40 * u, 6 * u, g + walk * 0.5 - lt.top - 40 * u);
    c.fillStyle = '#3a3550';
    rrect(c, lt.x - 12 * u, lt.top, 24 * u, 62 * u, 7 * u); c.fill();
    for (let k = 0; k < 3; k++) {
      c.fillStyle = ['#6b2a35', '#6b5a25', '#235a3a'][k];
      c.beginPath(); c.arc(lt.x, lt.top + 11 * u + k * 20 * u, 7.5 * u, 0, TAU); c.fill();
    }
  }
  // street trees on the sidewalk
  for (const fx of [0.36, 0.66, 0.97]) lollipopTree(c, w * fx, g + walk * 0.6, 1.05 * u);

  // the park in front
  c.fillStyle = '#d8d3ea';
  c.fillRect(0, road1, w, 7 * u);
  c.fillStyle = vgrad(c, road1 + 7 * u, h, [[0, '#86d862'], [1, '#5cbb48']]);
  c.fillRect(0, road1 + 7 * u, w, h - road1);
  const room = h - road1;
  c.fillStyle = '#f1dcae';
  c.beginPath();
  c.moveTo(-10, road1 + room * 0.75);
  c.bezierCurveTo(w * 0.3, road1 + room * 0.3, w * 0.6, road1 + room * 1.0, w + 10, road1 + room * 0.45);
  c.lineTo(w + 10, road1 + room * 0.45 + 16 * u);
  c.bezierCurveTo(w * 0.6, road1 + room * 1.0 + 16 * u, w * 0.3, road1 + room * 0.3 + 16 * u, -10, road1 + room * 0.75 + 16 * u);
  c.closePath(); c.fill();
  // bushes along the curb
  for (let bx = 18 * u; bx < w; bx += 70 * u) {
    c.fillStyle = '#3fa23d';
    c.beginPath(); c.arc(bx, road1 + 16 * u, 10 * u, 0, TAU); c.arc(bx + 12 * u, road1 + 13 * u, 11 * u, 0, TAU); c.arc(bx + 24 * u, road1 + 17 * u, 9 * u, 0, TAU); c.fill();
    c.fillStyle = '#ff6b9a';
    c.beginPath(); c.arc(bx + 8 * u, road1 + 10 * u, 2.5 * u, 0, TAU); c.arc(bx + 20 * u, road1 + 14 * u, 2.5 * u, 0, TAU); c.fill();
  }
  // a bench
  const bx = w * 0.72;
  const by = road1 + Math.min(room * 0.42, 70 * u);
  c.fillStyle = '#7a4b2a';
  c.fillRect(bx - 22 * u, by - 2 * u, 4 * u, 14 * u);
  c.fillRect(bx + 18 * u, by - 2 * u, 4 * u, 14 * u);
  c.fillStyle = '#c98a52';
  c.fillRect(bx - 28 * u, by - 18 * u, 56 * u, 6 * u);
  c.fillRect(bx - 28 * u, by - 8 * u, 56 * u, 6 * u);
  // flowers
  const fl = ['#ff6b9a', '#ffe066', '#ffffff', '#b98bff'];
  for (let j = 0; j < 30; j++) {
    c.fillStyle = fl[j % fl.length];
    c.beginPath(); c.arc(R() * w, road1 + 26 * u + R() * (room - 28 * u), (2.2 + R() * 1.8) * u, 0, TAU); c.fill();
  }
  // big park trees when there is room for them
  if (room > 110 * u) {
    lollipopTree(c, w * 0.14, h - room * 0.2, 1.7 * u);
    lollipopTree(c, w * 0.9, h - room * 0.1, 2 * u);
  }
}

let citySprites = null;
function carSprite(body, top, extra) {
  return sprite(120, 64, (c) => {
    c.lineJoin = 'round';
    c.strokeStyle = 'rgba(45, 36, 66, 0.5)';
    c.lineWidth = 2;
    c.fillStyle = top;
    c.beginPath(); c.moveTo(30, 30); c.lineTo(40, 8); c.quadraticCurveTo(42, 5, 47, 5); c.lineTo(78, 5); c.quadraticCurveTo(83, 5, 86, 9); c.lineTo(98, 30); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#c9eeff';
    c.beginPath(); c.moveTo(40, 29); c.lineTo(47, 11); c.lineTo(61, 11); c.lineTo(61, 29); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(66, 29); c.lineTo(66, 11); c.lineTo(80, 11); c.lineTo(90, 29); c.closePath(); c.fill();
    c.fillStyle = body;
    rrect(c, 6, 27, 110, 24, 10); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    rrect(c, 14, 31, 80, 5, 2.5); c.fill();
    if (extra) extra(c);
    c.fillStyle = '#fff59a';
    c.beginPath(); c.ellipse(111, 36, 4, 5, 0, 0, TAU); c.fill();
    c.fillStyle = '#ff4d5e';
    c.fillRect(6, 33, 5, 8);
    for (const wx of [30, 92]) {
      c.fillStyle = '#3a3550';
      c.beginPath(); c.arc(wx, 51, 11, 0, TAU); c.fill();
      c.fillStyle = '#c9d1df';
      c.beginPath(); c.arc(wx, 51, 5, 0, TAU); c.fill();
    }
  });
}
function buildCitySprites() {
  if (citySprites) return citySprites;
  const taxi = carSprite('#ffc21f', '#ffc21f', (c) => {
    c.fillStyle = '#2d2442';
    for (let k = 0; k < 10; k++) c.fillRect(14 + k * 9, 40 + (k % 2) * 4, 5, 4);
    c.fillStyle = '#fff';
    c.fillRect(56, 0, 14, 6);
  });
  const bus = sprite(200, 84, (c) => {
    c.lineJoin = 'round';
    c.strokeStyle = 'rgba(45, 36, 66, 0.5)';
    c.lineWidth = 2;
    c.fillStyle = '#ff5d5d';
    rrect(c, 6, 6, 188, 64, 12); c.fill(); c.stroke();
    c.fillStyle = '#ffffff';
    c.fillRect(6, 46, 188, 6);
    c.fillStyle = '#c9eeff';
    for (let k = 0; k < 6; k++) { rrect(c, 16 + k * 26, 14, 20, 22, 4); c.fill(); }
    rrect(c, 172, 14, 16, 30, 4); c.fill();
    // faces in the windows
    for (const k of [1, 3, 4]) {
      c.fillStyle = k === 3 ? '#a5673f' : '#ffd2a6';
      c.beginPath(); c.arc(26 + k * 26, 30, 6, 0, TAU); c.fill();
      c.fillStyle = '#2d2442';
      c.beginPath(); c.arc(28 + k * 26, 29, 1.1, 0, TAU); c.fill();
    }
    c.fillStyle = '#8a3040';
    c.fillRect(150, 38, 16, 30);
    c.fillStyle = '#fff59a';
    c.beginPath(); c.ellipse(190, 58, 4, 5, 0, 0, TAU); c.fill();
    for (const wx of [40, 156]) {
      c.fillStyle = '#3a3550';
      c.beginPath(); c.arc(wx, 72, 12, 0, TAU); c.fill();
      c.fillStyle = '#c9d1df';
      c.beginPath(); c.arc(wx, 72, 5.5, 0, TAU); c.fill();
    }
  });
  citySprites = {
    cars: [
      { s: carSprite('#ff5d6d', '#ff5d6d'), w: 120, h: 64 },
      { s: carSprite('#4d9bff', '#4d9bff'), w: 120, h: 64 },
      { s: taxi, w: 120, h: 64 },
      { s: carSprite('#5fd38a', '#5fd38a'), w: 120, h: 64 },
      { s: bus, w: 200, h: 84 },
    ],
  };
  return citySprites;
}

function cityAnimator() {
  const C = buildCitySprites();
  const clouds = makeClouds(3, 0.03, 0.18);
  let lay = null;
  let cars = null;
  let blink = null;
  const pick = () => C.cars[Math.floor(Math.random() * C.cars.length)];
  return {
    draw(ctx, w, h, t, dt) {
      if (!lay || lay.w !== w || lay.h !== h) {
        lay = cityLayout(w, h);
        lay.w = w;
        lay.h = h;
        // two cars on each side of the road, the first ones already on screen
        cars = [0, 1, 2, 3].map((i) => ({
          lane: i % 2, dir: i % 2 ? 1 : -1, sp: rand(55, 85), v: C.cars[(i * 2 + 1) % C.cars.length],
          x: i < 2 ? w * (i ? 0.3 : 0.72) : -1e4, wait: rand(1, 4) + i,
        }));
        const all = [];
        lay.blocks.forEach((b) => b.win.forEach((wn) => all.push(wn)));
        blink = [];
        for (let i = 0; i < Math.min(10, all.length); i++) {
          const wn = all[Math.floor(Math.random() * all.length)];
          blink.push({ wn, lit: !wn.lit, next: rand(0.5, 5) });
        }
      }
      const u = lay.u;
      const still = isStill(dt);
      clouds.draw(ctx, w, h, t, dt);
      // windows going on and off
      for (const b of blink) {
        b.next -= dt;
        if (b.next <= 0) { b.lit = !b.lit; b.next = rand(2, 7); }
        ctx.fillStyle = b.lit ? '#fff3a6' : '#d9f2ff';
        ctx.fillRect(b.wn.x, b.wn.y, 12 * u, 13 * u);
      }
      // traffic lights: green, yellow, red
      if (!still) lay.lights.forEach((lt, i) => {
        const ph = (t + i * 4) % 9;
        const k = ph < 4 ? 2 : ph < 5.5 ? 1 : 0;
        const col = ['#ff4d5e', '#ffd23f', '#3ee07a'][k];
        const y = lt.top + 11 * u + k * 20 * u;
        const g = glowSprite(col);
        ctx.globalAlpha = 0.8;
        ctx.drawImage(g.img, lt.x - 22 * u, y - 22 * u, 44 * u, 44 * u);
        ctx.globalAlpha = 1;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(lt.x, y, 7.5 * u, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(lt.x - 2.5 * u, y - 2.5 * u, 2.4 * u, 0, TAU); ctx.fill();
      });
      // cars: far lane first
      for (const lane of [0, 1]) {
        for (const car of cars) {
          if (car.lane !== lane) continue;
          const k = (car.v.w > 150 ? 0.6 : 0.56) * u;
          const half = (car.v.w * k) / 2;
          if (car.x < -9e3) {
            car.wait -= dt;
            if (car.wait > 0) continue;
            // only drive in when the lane entrance is free
            const ent = car.dir > 0 ? -half : w + half;
            if (cars.some((o) => o !== car && o.lane === lane && o.x > -9e3 && Math.abs(o.x - ent) < 170 * u)) { car.wait = 0.5; continue; }
            car.v = pick();
            car.sp = rand(55, 85);
            car.x = car.dir > 0 ? -half - 4 : w + half + 4;
          }
          // keep a gap behind the car in front
          let sp = car.sp;
          for (const o of cars) {
            if (o === car || o.lane !== lane || o.x < -9e3) continue;
            const ahead = (o.x - car.x) * car.dir;
            if (ahead > 0 && ahead < 150 * u) sp = Math.min(sp, o.sp * 0.95);
          }
          car.sp = sp;
          car.x += car.dir * sp * u * dt;
          if (car.x < -half - 10 || car.x > w + half + 10) { car.x = -1e4; car.wait = rand(0.5, 4); continue; }
          if (still) continue;
          const y = lay.lanes[lane] + Math.sin(t * 14 + car.sp) * 0.5 * u;
          const ch = car.v.h * k;
          if (car.dir < 0) {
            ctx.save();
            ctx.translate(car.x, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(car.v.s.img, -half, y - ch, half * 2, ch);
            ctx.restore();
          } else {
            ctx.drawImage(car.v.s.img, car.x - half, y - ch, half * 2, ch);
          }
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Winter
// ---------------------------------------------------------------------------
function winterLayout(w, h) {
  const u = Math.min(w, h) / 400;
  const wide = w > h;
  const hz = h * 0.5;
  const cabin = { x: w * (wide ? 0.22 : 0.3), base: h * 0.64, s: u * (wide ? 1 : 0.95) };
  cabin.chimX = cabin.x + 30 * cabin.s;
  cabin.chimY = cabin.base - 122 * cabin.s;
  const pond = { x: w * (wide ? 0.62 : 0.58), y: h * 0.81, rx: Math.min(w * (wide ? 0.24 : 0.36), 190 * u), ry: 30 * u };
  return { u, hz, cabin, pond };
}

function pine(c, x, base, hh, dark = '#2a8a5a', light = '#3aa66a') {
  const w0 = hh * 0.46;
  c.fillStyle = '#7a4b2a';
  c.fillRect(x - hh * 0.04, base - hh * 0.16, hh * 0.08, hh * 0.16);
  for (let i = 0; i < 3; i++) {
    const ty = base - hh * 0.12 - i * hh * 0.25;
    const tw = w0 * (1 - i * 0.24);
    const th = hh * 0.42;
    c.fillStyle = dark;
    c.beginPath(); c.moveTo(x - tw, ty); c.lineTo(x, ty - th); c.lineTo(x + tw, ty); c.closePath(); c.fill();
    c.fillStyle = light;
    c.beginPath(); c.moveTo(x - tw * 0.9, ty - 1); c.lineTo(x, ty - th); c.lineTo(x - tw * 0.05, ty - 1); c.closePath(); c.fill();
    // snow on each tier: a scalloped white edge
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(x - tw * 1.02, ty + 1);
    const n = 4;
    for (let k = 0; k < n; k++) {
      const a = x - tw + ((k + 0.5) * 2 * tw) / n;
      c.quadraticCurveTo(a, ty + hh * 0.05, x - tw + ((k + 1) * 2 * tw) / n, ty + 1);
    }
    c.lineTo(x + tw * 0.55, ty - th * 0.28);
    c.lineTo(x - tw * 0.55, ty - th * 0.28);
    c.closePath();
    c.fill();
    c.fillStyle = dark;
    c.beginPath(); c.moveTo(x - tw * 0.62, ty - th * 0.26); c.lineTo(x, ty - th * 0.95); c.lineTo(x + tw * 0.62, ty - th * 0.26); c.closePath(); c.fill();
    c.fillStyle = light;
    c.beginPath(); c.moveTo(x - tw * 0.55, ty - th * 0.27); c.lineTo(x, ty - th * 0.95); c.lineTo(x - tw * 0.05, ty - th * 0.27); c.closePath(); c.fill();
  }
  c.fillStyle = '#ffffff';
  c.beginPath(); c.moveTo(x - hh * 0.07, base - hh * 0.9); c.lineTo(x, base - hh * 1.0); c.lineTo(x + hh * 0.07, base - hh * 0.9); c.quadraticCurveTo(x, base - hh * 0.86, x - hh * 0.07, base - hh * 0.9); c.fill();
}

function paintWinter(c, w, h) {
  const R = rng(41);
  const L = winterLayout(w, h);
  const { u, hz, cabin, pond } = L;
  c.fillStyle = vgrad(c, 0, hz + 40 * u, [[0, '#86c5ff'], [0.55, '#c3e3ff'], [1, '#f1ecff']]);
  c.fillRect(0, 0, w, hz + 42 * u);
  sunDisc(c, w * 0.8, h * 0.12, 26 * u, '#fff3b0', '#ffd27a');

  // mountains with snowy tops
  const peaks = [[0.12, 150], [0.38, 190], [0.66, 160], [0.92, 200]];
  for (const [fx, ph] of peaks) {
    const px = w * fx;
    const top = hz - ph * u;
    const half = ph * u * 1.15;
    c.fillStyle = '#a3b8e2';
    c.beginPath(); c.moveTo(px - half, hz + 10 * u); c.lineTo(px, top); c.lineTo(px + half, hz + 10 * u); c.closePath(); c.fill();
    c.fillStyle = '#8ea6d6';
    c.beginPath(); c.moveTo(px, top); c.lineTo(px + half, hz + 10 * u); c.lineTo(px + half * 0.35, hz + 10 * u); c.closePath(); c.fill();
    c.fillStyle = '#ffffff';
    const sy = top + ph * u * 0.32;
    c.beginPath();
    c.moveTo(px, top);
    c.lineTo(px + half * 0.33, sy);
    c.lineTo(px + half * 0.16, sy - 8 * u);
    c.lineTo(px, sy + 4 * u);
    c.lineTo(px - half * 0.16, sy - 8 * u);
    c.lineTo(px - half * 0.33, sy);
    c.closePath();
    c.fill();
  }
  // far snowy hills with little trees
  const far = (x) => hz - (14 + 12 * Math.sin(x * 0.008 + 2) + 6 * Math.sin(x * 0.023)) * u;
  ridge(c, w, h, far, '#e4eeff');
  for (let k = 0; k < 9; k++) {
    const tx = R() * w;
    pine(c, tx, far(tx) + 6 * u, (26 + R() * 14) * u, '#6aa78f', '#7fbaa2');
  }
  // middle hills
  const midY = (x) => hz + (34 + 14 * Math.sin(x * 0.006) + 8 * Math.sin(x * 0.017 + 1)) * u;
  ridge(c, w, h, midY, '#f4f8ff');
  c.fillStyle = vgrad(c, hz + 20 * u, h, [[0, 'rgba(160, 190, 240, 0.0)'], [1, 'rgba(160, 190, 240, 0.35)']]);
  c.fillRect(0, hz + 20 * u, w, h - hz);
  // trees behind the cabin
  pine(c, cabin.x - 78 * cabin.s, cabin.base - 6 * u, 120 * u);
  pine(c, cabin.x + 86 * cabin.s, cabin.base - 10 * u, 96 * u);
  pine(c, w * 0.94, midY(w * 0.94) + 30 * u, 130 * u);
  if (w > h) pine(c, w * 0.46, midY(w * 0.46) + 12 * u, 84 * u);

  // the cabin
  const s = cabin.s;
  const cx = cabin.x;
  const base = cabin.base;
  const cw = 112 * s;
  const ch = 62 * s;
  c.fillStyle = 'rgba(120, 150, 210, 0.35)';
  c.beginPath(); c.ellipse(cx, base + 2 * s, cw * 0.75, 9 * s, 0, 0, TAU); c.fill();
  // chimney
  c.fillStyle = '#c4574a';
  c.fillRect(cabin.chimX - 9 * s, cabin.chimY, 18 * s, 64 * s);
  c.fillStyle = 'rgba(0,0,0,0.12)';
  for (let k = 0; k < 4; k++) c.fillRect(cabin.chimX - 9 * s, cabin.chimY + 8 * s + k * 10 * s, 18 * s, 2 * s);
  c.fillStyle = '#fff';
  rrect(c, cabin.chimX - 12 * s, cabin.chimY - 6 * s, 24 * s, 9 * s, 4 * s); c.fill();
  // log walls
  c.fillStyle = '#b8743f';
  c.fillRect(cx - cw / 2, base - ch, cw, ch);
  for (let k = 0; k < 6; k++) {
    const ly = base - ch + k * (ch / 6);
    c.fillStyle = k % 2 ? '#a9663a' : '#c47f48';
    rrect(c, cx - cw / 2 - 4 * s, ly, cw + 8 * s, ch / 6 - 1 * s, 5 * s); c.fill();
  }
  // roof covered in snow
  const ry = base - ch;
  c.fillStyle = '#8a4b2c';
  c.beginPath(); c.moveTo(cx - cw / 2 - 16 * s, ry + 4 * s); c.lineTo(cx, ry - 50 * s); c.lineTo(cx + cw / 2 + 16 * s, ry + 4 * s); c.closePath(); c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.moveTo(cx - cw / 2 - 20 * s, ry + 2 * s);
  c.lineTo(cx, ry - 58 * s);
  c.lineTo(cx + cw / 2 + 20 * s, ry + 2 * s);
  c.quadraticCurveTo(cx + cw / 2 + 12 * s, ry + 12 * s, cx + cw / 2, ry + 6 * s);
  c.quadraticCurveTo(cx + cw / 4, ry + 14 * s, cx, ry + 6 * s);
  c.quadraticCurveTo(cx - cw / 4, ry + 14 * s, cx - cw / 2, ry + 6 * s);
  c.quadraticCurveTo(cx - cw / 2 - 12 * s, ry + 12 * s, cx - cw / 2 - 20 * s, ry + 2 * s);
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(150, 180, 230, 0.5)';
  c.beginPath(); c.moveTo(cx, ry - 58 * s); c.lineTo(cx + cw / 2 + 20 * s, ry + 2 * s); c.lineTo(cx + cw / 2 - 4 * s, ry + 2 * s); c.lineTo(cx, ry - 44 * s); c.closePath(); c.fill();
  // icicles
  c.fillStyle = '#d4efff';
  for (let k = 0; k < 7; k++) {
    const ix = cx - cw / 2 + 8 * s + k * (cw - 16 * s) / 6;
    const il = (6 + ((k * 7) % 5) * 2) * s;
    c.beginPath(); c.moveTo(ix - 2.5 * s, ry + 8 * s); c.lineTo(ix, ry + 8 * s + il); c.lineTo(ix + 2.5 * s, ry + 8 * s); c.closePath(); c.fill();
  }
  // round window in the gable
  c.fillStyle = '#ffd76a';
  c.beginPath(); c.arc(cx, ry - 18 * s, 8 * s, 0, TAU); c.fill();
  c.strokeStyle = '#7a4422';
  c.lineWidth = 2.5 * s;
  c.stroke();
  // warm window
  const wx = cx - 28 * s;
  const wy = base - ch + 16 * s;
  const wg = c.createRadialGradient(wx, wy + 12 * s, 2 * s, wx, wy + 12 * s, 40 * s);
  wg.addColorStop(0, 'rgba(255, 220, 120, 0.55)');
  wg.addColorStop(1, 'rgba(255, 220, 120, 0)');
  c.fillStyle = wg;
  c.fillRect(wx - 40 * s, wy - 28 * s, 80 * s, 80 * s);
  c.fillStyle = '#ffd76a';
  c.fillRect(wx - 15 * s, wy, 30 * s, 24 * s);
  c.strokeStyle = '#7a4422';
  c.lineWidth = 3 * s;
  c.strokeRect(wx - 15 * s, wy, 30 * s, 24 * s);
  c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx, wy + 24 * s); c.moveTo(wx - 15 * s, wy + 12 * s); c.lineTo(wx + 15 * s, wy + 12 * s); c.stroke();
  c.fillStyle = '#fff';
  rrect(c, wx - 18 * s, wy + 22 * s, 36 * s, 6 * s, 3 * s); c.fill();
  // door
  c.fillStyle = '#7a4422';
  c.beginPath(); c.moveTo(cx + 12 * s, base); c.lineTo(cx + 12 * s, base - 36 * s); c.arc(cx + 26 * s, base - 36 * s, 14 * s, Math.PI, 0); c.lineTo(cx + 40 * s, base); c.closePath(); c.fill();
  c.fillStyle = '#ffd93b';
  c.beginPath(); c.arc(cx + 35 * s, base - 20 * s, 2.2 * s, 0, TAU); c.fill();
  // snow drifts at the bottom of the walls
  c.fillStyle = '#ffffff';
  c.beginPath(); c.ellipse(cx - cw * 0.3, base, cw * 0.3, 8 * s, 0, Math.PI, 0); c.fill();
  c.beginPath(); c.ellipse(cx + cw * 0.42, base, cw * 0.18, 6 * s, 0, Math.PI, 0); c.fill();

  // front snow
  const front = (x) => base + (16 + 8 * Math.sin(x * 0.01 + 0.5)) * u;
  ridge(c, w, h, front, '#ffffff');
  c.fillStyle = vgrad(c, base, h, [[0, 'rgba(170, 200, 245, 0)'], [1, 'rgba(170, 200, 245, 0.4)']]);
  c.fillRect(0, base, w, h - base);

  // frozen pond
  c.fillStyle = 'rgba(140, 170, 225, 0.45)';
  c.beginPath(); c.ellipse(pond.x, pond.y + 5 * u, pond.rx + 10 * u, pond.ry + 8 * u, 0, 0, TAU); c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.ellipse(pond.x, pond.y, pond.rx + 10 * u, pond.ry + 8 * u, 0, 0, TAU); c.fill();
  const ig = c.createLinearGradient(0, pond.y - pond.ry, 0, pond.y + pond.ry);
  ig.addColorStop(0, '#9fd8ff');
  ig.addColorStop(1, '#d9f3ff');
  c.fillStyle = ig;
  c.beginPath(); c.ellipse(pond.x, pond.y, pond.rx, pond.ry, 0, 0, TAU); c.fill();
  c.save();
  c.beginPath(); c.ellipse(pond.x, pond.y, pond.rx, pond.ry, 0, 0, TAU); c.clip();
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = 4 * u;
  c.lineCap = 'round';
  for (const [dx, dy, len] of [[-0.5, -0.3, 0.3], [0.1, 0.1, 0.4], [0.45, -0.2, 0.2]]) {
    c.beginPath();
    c.moveTo(pond.x + dx * pond.rx, pond.y + dy * pond.ry);
    c.lineTo(pond.x + (dx + len) * pond.rx, pond.y + (dy - len * 0.6) * pond.ry);
    c.stroke();
  }
  c.restore();

  // a little snowman by the pond
  const smx = pond.x - pond.rx - (w > h ? 46 : 18) * u;
  const smy = Math.min(h - 12 * u, pond.y + 36 * u);
  const ss = 0.85 * u;
  c.fillStyle = 'rgba(140, 170, 225, 0.4)';
  c.beginPath(); c.ellipse(smx, smy, 26 * ss, 6 * ss, 0, 0, TAU); c.fill();
  c.strokeStyle = '#7a4b2a';
  c.lineWidth = 3 * ss;
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(smx - 16 * ss, smy - 46 * ss); c.lineTo(smx - 36 * ss, smy - 60 * ss); c.moveTo(smx + 16 * ss, smy - 46 * ss); c.lineTo(smx + 36 * ss, smy - 62 * ss); c.stroke();
  for (const [dy, r] of [[-22, 24], [-56, 17], [-82, 13]]) {
    c.fillStyle = '#ffffff';
    c.strokeStyle = 'rgba(120, 150, 210, 0.7)';
    c.lineWidth = 2 * ss;
    c.beginPath(); c.arc(smx, smy + dy * ss, r * ss, 0, TAU); c.stroke(); c.fill();
    c.fillStyle = 'rgba(150, 180, 230, 0.35)';
    c.beginPath(); c.arc(smx + r * 0.35 * ss, smy + (dy + r * 0.2) * ss, r * 0.7 * ss, -0.6, 1.6); c.fill();
  }
  c.fillStyle = '#ff4d5e';
  rrect(c, smx - 15 * ss, smy - 72 * ss, 30 * ss, 7 * ss, 3 * ss); c.fill();
  c.fillRect(smx + 4 * ss, smy - 70 * ss, 7 * ss, 18 * ss);
  c.fillStyle = '#2d2442';
  c.beginPath(); c.arc(smx - 4.5 * ss, smy - 86 * ss, 2 * ss, 0, TAU); c.arc(smx + 4.5 * ss, smy - 86 * ss, 2 * ss, 0, TAU); c.fill();
  for (const dy of [-60, -50]) { c.beginPath(); c.arc(smx, smy + dy * ss, 2 * ss, 0, TAU); c.fill(); }
  c.fillStyle = '#ff8a1f';
  c.beginPath(); c.moveTo(smx, smy - 83 * ss); c.lineTo(smx + 13 * ss, smy - 80 * ss); c.lineTo(smx, smy - 78 * ss); c.closePath(); c.fill();
  c.fillStyle = '#3a3550';
  c.fillRect(smx - 13 * ss, smy - 98 * ss, 26 * ss, 4 * ss);
  c.fillRect(smx - 8 * ss, smy - 114 * ss, 16 * ss, 17 * ss);

  // sparkly snow
  for (let j = 0; j < 40; j++) {
    c.fillStyle = j % 3 ? 'rgba(150, 190, 245, 0.55)' : 'rgba(255, 255, 255, 0.95)';
    c.beginPath(); c.arc(R() * w, base + R() * (h - base), (1 + R() * 1.6) * u, 0, TAU); c.fill();
  }
}

let winterSprites = null;
function buildWinterSprites() {
  if (winterSprites) return winterSprites;
  const flake = sprite(16, 16, (c) => {
    const g = c.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 16, 16);
  });
  const star = sprite(24, 24, (c) => {
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      c.beginPath(); c.moveTo(12 - Math.cos(a) * 10, 12 - Math.sin(a) * 10); c.lineTo(12 + Math.cos(a) * 10, 12 + Math.sin(a) * 10); c.stroke();
    }
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(12, 12, 2.5, 0, TAU); c.fill();
  });
  const penguin = sprite(50, 62, (c) => {
    c.lineJoin = 'round';
    c.strokeStyle = 'rgba(45, 36, 66, 0.55)';
    c.lineWidth = 1.6;
    c.fillStyle = '#ff9a2e';
    c.beginPath(); c.ellipse(18, 58, 7, 3.5, 0, 0, TAU); c.ellipse(32, 58, 7, 3.5, 0, 0, TAU); c.fill();
    c.fillStyle = '#c9d1df';
    c.fillRect(8, 60, 32, 2);
    c.fillStyle = '#2f2c45';
    c.beginPath(); c.ellipse(25, 36, 17, 22, 0, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(8, 38, 5, 12, 0.5, 0, TAU); c.ellipse(42, 38, 5, 12, -0.5, 0, TAU); c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(27, 41, 11, 15, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(21, 20, 6, 7, 0, 0, TAU); c.ellipse(32, 20, 6, 7, 0, 0, TAU); c.fill();
    c.fillStyle = '#2d2442';
    c.beginPath(); c.arc(23, 20, 2.3, 0, TAU); c.arc(33, 20, 2.3, 0, TAU); c.fill();
    c.fillStyle = '#ff9a2e';
    c.beginPath(); c.moveTo(26, 23); c.lineTo(37, 26); c.lineTo(26, 29); c.closePath(); c.fill();
    c.fillStyle = '#ff4d6d';
    rrect(c, 12, 29, 27, 6, 3); c.fill();
    c.fillRect(14, 32, 6, 12);
    c.fillStyle = 'rgba(255, 120, 160, 0.55)';
    c.beginPath(); c.arc(18, 26, 2.4, 0, TAU); c.arc(37, 25, 2, 0, TAU); c.fill();
  });
  winterSprites = { flake, star, penguin };
  return winterSprites;
}

function winterAnimator() {
  const S = sharedSprites();
  const W = buildWinterSprites();
  const clouds = makeClouds(2, 0.05, 0.2, 0.85);
  const flakes = Array.from({ length: 64 }, (_, i) => ({
    fx: Math.random(), fy: Math.random(), s: rand(3, 7), v: rand(0.035, 0.08), ph: rand(0, TAU), star: i % 9 === 0,
  }));
  const smoke = [];
  let smokeWait = 0;
  let lay = null;
  return {
    draw(ctx, w, h, t, dt) {
      if (!lay || lay.w !== w || lay.h !== h) {
        lay = winterLayout(w, h);
        lay.w = w;
        lay.h = h;
      }
      const u = lay.u;
      clouds.draw(ctx, w, h, t, dt);
      // chimney smoke
      smokeWait -= dt;
      if (smokeWait <= 0 && smoke.length < 7) {
        smokeWait = 0.7;
        smoke.push({ x: lay.cabin.chimX, y: lay.cabin.chimY - 6 * u, life: 0, ph: Math.random() * TAU });
      }
      for (let i = smoke.length - 1; i >= 0; i--) {
        const p = smoke[i];
        p.life += dt;
        if (p.life > 4) { smoke.splice(i, 1); continue; }
        const r = (8 + p.life * 9) * u;
        const x = p.x + p.life * 14 * u + Math.sin(p.life * 2 + p.ph) * 5 * u;
        const y = p.y - p.life * 26 * u;
        ctx.globalAlpha = 0.75 * (1 - p.life / 4);
        ctx.drawImage(S.soft.img, x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      // a penguin skating on the pond
      const P = lay.pond;
      if (!isStill(dt)) {
      const k = 0.85 * u;
      const ph = t * 0.55;
      const px = P.x + Math.sin(ph) * P.rx * 0.62;
      const py = P.y + Math.cos(ph * 2) * P.ry * 0.25 + 4 * u;
      const dir = Math.cos(ph) >= 0 ? 1 : -1;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(dir, 1);
      ctx.rotate(0.12 + Math.sin(t * 3) * 0.05);
      ctx.drawImage(W.penguin.img, -25 * k, -62 * k, 50 * k, 62 * k);
      ctx.restore();
      }
      // falling snow
      for (const f of flakes) {
        f.fy += f.v * dt;
        if (f.fy > 1.03) { f.fy = -0.03; f.fx = Math.random(); }
        const x = f.fx * w + Math.sin(t * 0.8 + f.ph) * 14 * u;
        const y = f.fy * h;
        const sz = f.s * u * (f.star ? 2.2 : 1);
        ctx.drawImage((f.star ? W.star : W.flake).img, x - sz / 2, y - sz / 2, sz, sz);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Birthday Party
// ---------------------------------------------------------------------------
const PARTY_COLORS = ['#ff4d6d', '#ffb703', '#4cc9f0', '#5cd65c', '#b388ff', '#ff7ac6'];
function birthdayLayout(w, h) {
  const u = Math.min(w, h) / 400;
  const floor = h * 0.8;
  const top = Math.min(h * 0.68, floor - 50 * u);
  const tw = Math.min(w * 0.64, 340 * u);
  const cake = { x: w * 0.5, base: top - 2 * u, s: u };
  const candles = [-20, 0, 20].map((dx, i) => ({ x: cake.x + dx * u, y: cake.base - (44 + 34 + 26) * u - (i === 1 ? 4 * u : 0) }));
  return { u, floor, top, tw, cake, candles };
}

function balloonShape(c, x, y, r, color) {
  c.strokeStyle = 'rgba(80, 60, 110, 0.55)';
  c.lineWidth = 1.6 * (r / 20);
  c.fillStyle = color;
  c.beginPath(); c.ellipse(x, y, r * 0.86, r, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(x - r * 0.14, y + r * 1.08); c.lineTo(x + r * 0.14, y + r * 1.08); c.lineTo(x, y + r * 0.94); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.4, r * 0.16, r * 0.28, 0.5, 0, TAU); c.fill();
}

function present(c, x, base, bw, bh, box, ribbon, s) {
  c.fillStyle = 'rgba(120, 60, 90, 0.2)';
  c.beginPath(); c.ellipse(x, base, bw * 0.6, 4 * s, 0, 0, TAU); c.fill();
  c.fillStyle = box;
  c.fillRect(x - bw / 2, base - bh, bw, bh);
  c.fillStyle = 'rgba(255,255,255,0.25)';
  c.fillRect(x - bw / 2, base - bh, bw * 0.3, bh);
  c.fillStyle = 'rgba(0,0,0,0.08)';
  c.fillRect(x - bw / 2 - 2 * s, base - bh, bw + 4 * s, bh * 0.22);
  c.fillStyle = ribbon;
  c.fillRect(x - bw * 0.08, base - bh, bw * 0.16, bh);
  c.fillRect(x - bw / 2 - 2 * s, base - bh * 0.88, bw + 4 * s, bh * 0.12);
  c.beginPath();
  c.ellipse(x - bw * 0.16, base - bh - 5 * s, bw * 0.17, 6 * s, -0.4, 0, TAU);
  c.ellipse(x + bw * 0.16, base - bh - 5 * s, bw * 0.17, 6 * s, 0.4, 0, TAU);
  c.fill();
  c.beginPath(); c.arc(x, base - bh - 2 * s, 4 * s, 0, TAU); c.fill();
}

function paintBirthday(c, w, h) {
  const R = rng(55);
  const L = birthdayLayout(w, h);
  const { u, floor, top, tw, cake } = L;
  // wallpaper: soft stripes and confetti dots
  c.fillStyle = vgrad(c, 0, floor, [[0, '#fff3fa'], [1, '#ffd6ea']]);
  c.fillRect(0, 0, w, floor);
  c.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let x = 0; x < w; x += 44 * u) c.fillRect(x, 0, 20 * u, floor);
  for (let i = 0; i < 70; i++) {
    c.globalAlpha = 0.25;
    c.fillStyle = PARTY_COLORS[i % PARTY_COLORS.length];
    c.beginPath(); c.arc(R() * w, R() * floor, (2.5 + R() * 3) * u, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;

  // streamers swooping across the ceiling
  c.lineCap = 'round';
  [['#ff7ac6', 0, 70], ['#4cc9f0', 0.5, 100], ['#ffd23f', 1, 56]].forEach(([col, off, sag], i) => {
    const y0 = (6 + i * 4) * u;
    const path = () => {
      c.beginPath();
      c.moveTo(-10, y0);
      c.quadraticCurveTo(w * (0.25 + off * 0.1), (sag + 30) * u, w * 0.5, y0 + 6 * u);
      c.quadraticCurveTo(w * (0.75 - off * 0.1), (sag + 30) * u, w + 10, y0);
    };
    c.strokeStyle = col;
    c.lineWidth = 9 * u;
    path(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = 3 * u;
    c.setLineDash([5 * u, 9 * u]);
    path(); c.stroke();
    c.setLineDash([]);
  });
  // hanging twisty streamers at the sides
  for (const [x0, col] of [[w * 0.06, '#b388ff'], [w * 0.94, '#5cd65c'], [w * 0.3, '#ffb703'], [w * 0.7, '#ff4d6d']]) {
    const len = (x0 < w * 0.2 || x0 > w * 0.8 ? 0.42 : 0.2) * h;
    c.strokeStyle = col;
    c.lineWidth = 7 * u;
    c.beginPath();
    c.moveTo(x0, 0);
    for (let y = 0; y <= len; y += 6 * u) c.lineTo(x0 + Math.sin(y * 0.09 / u) * 6 * u, y);
    c.stroke();
  }

  // bunting
  const by0 = 34 * u;
  const sag = Math.min(70 * u, h * 0.12);
  const bpt = (s) => ({ x: -10 + (w + 20) * s, y: by0 + 4 * sag * s * (1 - s) });
  c.strokeStyle = '#7a5c8a';
  c.lineWidth = 2 * u;
  c.beginPath();
  for (let s = 0; s <= 1.001; s += 0.02) { const p = bpt(s); s === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y); }
  c.stroke();
  const n = Math.max(6, Math.round(w / (36 * u)));
  for (let i = 0; i < n; i++) {
    const s0 = (i + 0.15) / n;
    const s1 = (i + 0.85) / n;
    const a = bpt(s0);
    const b = bpt(s1);
    const m = bpt((s0 + s1) / 2);
    c.fillStyle = PARTY_COLORS[i % PARTY_COLORS.length];
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(m.x, m.y + 34 * u); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.beginPath(); c.arc(m.x, m.y + 11 * u, 3.2 * u, 0, TAU); c.fill();
  }

  // floor
  c.fillStyle = vgrad(c, floor, h, [[0, '#f5c48e'], [1, '#e9a96a']]);
  c.fillRect(0, floor, w, h - floor);
  c.strokeStyle = 'rgba(150, 90, 40, 0.3)';
  c.lineWidth = 2 * u;
  for (let y = floor + 14 * u; y < h; y += 16 * u) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  for (let y = floor, row = 0; y < h; y += 16 * u, row++) {
    for (let x = (row % 2) * 40 * u; x < w; x += 80 * u) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 14 * u); c.stroke(); }
  }
  c.fillStyle = '#ffffff';
  c.fillRect(0, floor - 8 * u, w, 9 * u);
  // round rug under the table
  c.fillStyle = '#9fdcff';
  c.beginPath(); c.ellipse(w * 0.5, floor + (h - floor) * 0.45, tw * 0.62, (h - floor) * 0.35, 0, 0, TAU); c.fill();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 3 * u;
  c.setLineDash([6 * u, 6 * u]);
  c.beginPath(); c.ellipse(w * 0.5, floor + (h - floor) * 0.45, tw * 0.55, (h - floor) * 0.28, 0, 0, TAU); c.stroke();
  c.setLineDash([]);

  // balloon bunches in the corners
  const bunch = (x, y, flip) => {
    const list = [[-18, -6, 0], [16, -14, 1], [0, -40, 2], [-26, -36, 3]];
    c.strokeStyle = 'rgba(120, 90, 140, 0.7)';
    c.lineWidth = 1.5 * u;
    for (const [dx, dy] of list) {
      c.beginPath(); c.moveTo(x + dx * u * flip, y + dy * u + 22 * u); c.quadraticCurveTo(x + dx * u * 0.3 * flip, y + 60 * u, x, floor - 8 * u); c.stroke();
    }
    list.forEach(([dx, dy, k]) => balloonShape(c, x + dx * u * flip, y + dy * u, 21 * u, PARTY_COLORS[(k + (flip > 0 ? 0 : 3)) % PARTY_COLORS.length]));
  };
  bunch(w * 0.1, h * 0.36, 1);
  bunch(w * 0.9, h * 0.32, -1);

  // presents on the floor
  present(c, w * 0.12, floor + (h - floor) * 0.6, 46 * u, 38 * u, '#7c5cff', '#ffd23f', u);
  present(c, w * 0.2, floor + (h - floor) * 0.8, 36 * u, 28 * u, '#ff7ac6', '#ffffff', u);
  present(c, w * 0.86, floor + (h - floor) * 0.7, 50 * u, 40 * u, '#2fc6a0', '#ff4d6d', u);

  // the table
  const tx0 = w * 0.5 - tw / 2;
  c.fillStyle = '#b77a43';
  c.fillRect(tx0 + 16 * u, top + 30 * u, 9 * u, floor - top - 30 * u);
  c.fillRect(tx0 + tw - 25 * u, top + 30 * u, 9 * u, floor - top - 30 * u);
  c.fillStyle = 'rgba(120, 60, 90, 0.18)';
  c.beginPath(); c.ellipse(w * 0.5, floor + 2 * u, tw * 0.5, 6 * u, 0, 0, TAU); c.fill();
  // tablecloth with a scalloped edge
  const dropY = top + 38 * u;
  c.fillStyle = '#ff9ccd';
  c.beginPath();
  c.moveTo(tx0 - 6 * u, top);
  c.lineTo(tx0 + tw + 6 * u, top);
  c.lineTo(tx0 + tw + 6 * u, dropY);
  const sc = Math.max(5, Math.round(tw / (28 * u)));
  const step = (tw + 12 * u) / sc;
  for (let i = sc; i > 0; i--) {
    const xA = tx0 - 6 * u + i * step;
    c.quadraticCurveTo(xA - step / 2, dropY + 16 * u, xA - step, dropY);
  }
  c.closePath();
  c.fill();
  c.fillStyle = '#ffffff';
  for (let i = 0; i < sc; i++) {
    c.beginPath(); c.arc(tx0 - 6 * u + (i + 0.5) * step, dropY - 6 * u, 4 * u, 0, TAU); c.fill();
    c.beginPath(); c.arc(tx0 - 6 * u + (i + 1) * step, top + 14 * u, 3 * u, 0, TAU); c.fill();
  }
  c.fillStyle = '#ffd1e6';
  c.fillRect(tx0 - 6 * u, top - 2 * u, tw + 12 * u, 6 * u);

  // cake
  const k = cake.s;
  const cx = cake.x;
  const b0 = cake.base;
  c.fillStyle = '#e9edf6';
  c.beginPath(); c.ellipse(cx, b0, 70 * k, 9 * k, 0, 0, TAU); c.fill();
  const tier = (yb, tw2, th, sponge, icing) => {
    c.fillStyle = sponge;
    rrect(c, cx - tw2 / 2, yb - th, tw2, th, 8 * k); c.fill();
    c.fillStyle = icing;
    c.beginPath();
    c.moveTo(cx - tw2 / 2, yb - th + 8 * k);
    c.quadraticCurveTo(cx - tw2 / 2, yb - th, cx - tw2 / 2 + 8 * k, yb - th);
    c.lineTo(cx + tw2 / 2 - 8 * k, yb - th);
    c.quadraticCurveTo(cx + tw2 / 2, yb - th, cx + tw2 / 2, yb - th + 8 * k);
    const drips = Math.round(tw2 / (14 * k));
    for (let i = drips; i >= 0; i--) {
      const dx = cx - tw2 / 2 + (i * tw2) / drips;
      c.lineTo(dx, yb - th + (i % 2 ? 18 : 10) * k);
    }
    c.closePath();
    c.fill();
  };
  tier(b0, 112 * k, 44 * k, '#fff2df', '#ff8fc4');
  tier(b0 - 44 * k, 76 * k, 34 * k, '#fff2df', '#b98bff');
  for (let i = 0; i < 26; i++) {
    c.fillStyle = PARTY_COLORS[i % PARTY_COLORS.length];
    const yy = i < 15 ? b0 - 4 * k - R() * 22 * k : b0 - 48 * k - R() * 14 * k;
    const ww = i < 15 ? 100 : 64;
    c.fillRect(cx - (ww / 2) * k + R() * ww * k, yy, 4 * k, 2 * k);
  }
  // candles (flames are drawn by the animator)
  for (const cd of L.candles) {
    const ch = cd.y - (b0 - 78 * k);
    c.fillStyle = '#ffffff';
    c.fillRect(cd.x - 3.5 * k, cd.y, 7 * k, -ch);
    c.strokeStyle = '#4cc9f0';
    c.lineWidth = 2.5 * k;
    for (let y = cd.y + 4 * k; y < b0 - 78 * k; y += 7 * k) { c.beginPath(); c.moveTo(cd.x - 3.5 * k, y + 3 * k); c.lineTo(cd.x + 3.5 * k, y); c.stroke(); }
    c.strokeStyle = '#2d2442';
    c.lineWidth = 1.5 * k;
    c.beginPath(); c.moveTo(cd.x, cd.y); c.lineTo(cd.x, cd.y - 4 * k); c.stroke();
  }
  // presents and cups on the table
  present(c, tx0 + tw * 0.13, top + 2 * u, 34 * u, 28 * u, '#4cc9f0', '#ff4d6d', u);
  if (tw > 260 * u) present(c, tx0 + tw * 0.88, top + 2 * u, 30 * u, 24 * u, '#ffb703', '#7c5cff', u);
  for (const [fx, col] of [[0.3, '#5cd65c'], [0.72, '#ff7ac6']]) {
    const px = tx0 + tw * fx;
    c.fillStyle = col;
    c.beginPath(); c.moveTo(px - 9 * u, top - 26 * u); c.lineTo(px + 9 * u, top - 26 * u); c.lineTo(px + 6 * u, top); c.lineTo(px - 6 * u, top); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.fillRect(px - 7 * u, top - 20 * u, 14 * u, 3 * u);
    c.strokeStyle = '#ff4d6d';
    c.lineWidth = 2.5 * u;
    c.beginPath(); c.moveTo(px + 2 * u, top - 24 * u); c.lineTo(px + 6 * u, top - 38 * u); c.lineTo(px + 11 * u, top - 38 * u); c.stroke();
  }
}

let partySprites = null;
function buildPartySprites() {
  if (partySprites) return partySprites;
  partySprites = PARTY_COLORS.map((col) => sprite(48, 110, (c) => {
    c.strokeStyle = 'rgba(120, 90, 140, 0.75)';
    c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(24, 50); c.quadraticCurveTo(18, 66, 26, 80); c.quadraticCurveTo(32, 94, 24, 108); c.stroke();
    balloonShape(c, 24, 24, 22, col);
  }));
  return partySprites;
}

function birthdayAnimator() {
  const B = buildPartySprites();
  let lay = null;
  const balloons = Array.from({ length: 5 }, (_, i) => ({
    fx: (i + 0.5) / 5 + rand(-0.05, 0.05), fy: rand(0.15, 1.1), v: rand(0.03, 0.05), ph: rand(0, TAU), k: i % B.length, s: rand(0.85, 1.1),
  }));
  const confetti = Array.from({ length: 34 }, (_, i) => ({
    fx: Math.random(), fy: Math.random(), v: rand(0.05, 0.11), ph: rand(0, TAU), spin: rand(3, 7), col: PARTY_COLORS[i % PARTY_COLORS.length], round: i % 4 === 0,
  }));
  return {
    draw(ctx, w, h, t, dt) {
      if (!lay || lay.w !== w || lay.h !== h) {
        lay = birthdayLayout(w, h);
        lay.w = w;
        lay.h = h;
      }
      const u = lay.u;
      const still = isStill(dt);
      // candle flames flicker
      const glow = glowSprite('rgba(255, 210, 90, 0.85)');
      if (!still) lay.candles.forEach((cd, i) => {
        const f = 1 + Math.sin(t * 17 + i * 2.1) * 0.1 + Math.sin(t * 29 + i) * 0.06;
        const fy = cd.y - 5 * u;
        ctx.globalAlpha = 0.55;
        ctx.drawImage(glow.img, cd.x - 22 * u, fy - 26 * u, 44 * u, 44 * u);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffa31a';
        ctx.beginPath();
        ctx.moveTo(cd.x, fy - 15 * u * f);
        ctx.quadraticCurveTo(cd.x + 6.5 * u, fy - 4 * u, cd.x, fy);
        ctx.quadraticCurveTo(cd.x - 6.5 * u, fy - 4 * u, cd.x, fy - 15 * u * f);
        ctx.fill();
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.moveTo(cd.x, fy - 8 * u * f);
        ctx.quadraticCurveTo(cd.x + 3 * u, fy - 2.5 * u, cd.x, fy - 0.5 * u);
        ctx.quadraticCurveTo(cd.x - 3 * u, fy - 2.5 * u, cd.x, fy - 8 * u * f);
        ctx.fill();
      });
      // balloons floating up
      for (const b of balloons) {
        b.fy -= b.v * dt;
        if (b.fy < -0.25) { b.fy = 1.12; b.fx = rand(0.05, 0.95); b.k = Math.floor(Math.random() * B.length); }
        if (still) continue;
        const s = b.s * u * 0.95;
        const x = b.fx * w + Math.sin(t * 0.7 + b.ph) * 16 * u;
        ctx.save();
        ctx.translate(x, b.fy * h);
        ctx.rotate(Math.sin(t * 0.9 + b.ph) * 0.12);
        ctx.drawImage(B[b.k].img, -24 * s, -24 * s, 48 * s, 110 * s);
        ctx.restore();
      }
      // confetti drifting down
      for (const p of confetti) {
        p.fy += p.v * dt;
        if (p.fy > 1.02) { p.fy = -0.02; p.fx = Math.random(); }
        const x = p.fx * w + Math.sin(t * 1.3 + p.ph) * 18 * u;
        const y = p.fy * h;
        ctx.fillStyle = p.col;
        if (p.round) {
          ctx.beginPath(); ctx.arc(x, y, 3.2 * u, 0, TAU); ctx.fill();
          continue;
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * p.spin * 0.3 + p.ph);
        ctx.scale(1, Math.cos(t * p.spin + p.ph));
        ctx.fillRect(-4.5 * u, -2.5 * u, 9 * u, 5 * u);
        ctx.restore();
      }
    },
  };
}

// ---------------------------------------------------------------------------
const PAINT = {
  party: paintParty, underwater: paintUnderwater, west: paintWest, knights: paintKnights, space: paintSpace,
  farm: paintFarm, city: paintCity, winter: paintWinter, birthday: paintBirthday,
};
const ANIM = {
  party: partyAnimator, underwater: underwaterAnimator, west: westAnimator, knights: knightsAnimator, space: spaceAnimator,
  farm: farmAnimator, city: cityAnimator, winter: winterAnimator, birthday: birthdayAnimator,
};

export function paintScene(ctx, w, h, id, palette = 0) {
  (PAINT[id] || paintParty)(ctx, w, h, palette);
}

export function createAnimator(id) {
  return (ANIM[id] || partyAnimator)();
}
