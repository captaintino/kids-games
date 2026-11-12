// A small canvas engine for this game, in the style of Bubble Pop Party:
// a game canvas with a pixel budget, automatic quality steps on slow devices,
// pre-rendered sprites, and a capped particle system with cached text sprites.
// (The same file is used by Catch the Falling Stars; it could move to shared/ one day.)

const TAU = Math.PI * 2;
const FONT = 'Fredoka, ui-rounded, system-ui, sans-serif';
export const INK = '#2d2442';

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Quality steps: fewer canvas pixels and fewer particles when frames are slow.
const QUALITY = [
  { pixels: 2.4e6, particles: 220 },
  { pixels: 1.3e6, particles: 140 },
  { pixels: 0.75e6, particles: 80 },
];

/** A canvas drawn at 2x (or `scale`) for crisp sprites: draw(c, w, h) in CSS-ish units. */
export function makeSprite(w, h, draw, scale = 2) {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w * scale));
  cv.height = Math.max(1, Math.ceil(h * scale));
  const c = cv.getContext('2d');
  c.scale(scale, scale);
  draw(c, w, h);
  cv.w = w;
  cv.h = h;
  return cv;
}

export function starPath(c, x, y, outer, inner, points = 5, rot = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
}

/** Rounded star: like starPath but with soft, rounded points (cuter). */
export function softStarPath(c, x, y, outer, inner, points = 5, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
  }
  c.beginPath();
  const n = pts.length;
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    c.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  c.closePath();
}

export function roundRectPath(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// Shared little sprites
export const sparkleImg = makeSprite(32, 32, (c) => {
  const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.75)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 32, 32);
  c.fillStyle = '#fff';
  starPath(c, 16, 16, 15, 2.2, 4, 0);
  c.fill();
});

export const glowImg = makeSprite(64, 64, (c) => {
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
}, 1);

const dotCache = new Map();
/** A glossy colored dot for droplets and trails (made on first use). */
export function dotSprite(color) {
  let cv = dotCache.get(color);
  if (!cv) {
    cv = makeSprite(16, 16, (c) => {
      c.fillStyle = color;
      c.beginPath(); c.arc(8, 8, 7.5, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.85)';
      c.beginPath(); c.arc(5.5, 5.5, 2.4, 0, TAU); c.fill();
    });
    dotCache.set(color, cv);
  }
  return cv;
}

/**
 * The game canvas. Call resize() from the kit's onResize, begin() at the start of
 * each frame, watch(rawDt) to let quality step down on slow devices.
 */
export function createEngine(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const eng = {
    canvas, ctx, W: 0, H: 0, DPR: 1, unit: 1, quality: 0, particles: [],
    onQuality: opts.onQuality || null,
  };
  const textCache = new Map();

  eng.resize = function resize() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(QUALITY[eng.quality].pixels / (W * H)));
    dpr = Math.max(1, dpr);
    eng.W = W; eng.H = H; eng.DPR = dpr;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    eng.unit = clamp(Math.min(W, H) / 400, 0.8, 1.8);
    textCache.clear();
  };

  eng.begin = function begin(clear = true) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    if (clear) ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(eng.DPR, 0, 0, eng.DPR, 0, 0);
  };

  // Draw an image centered at (x, y), scaled by sx/sy and rotated by rot.
  eng.blit = function blit(img, x, y, w, h, rot = 0, alpha = 1, sx = 1, sy = 1) {
    const D = eng.DPR;
    ctx.globalAlpha = alpha;
    if (rot) {
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      ctx.setTransform(D * c * sx, D * s * sx, -D * s * sy, D * c * sy, D * x, D * y);
    } else {
      ctx.setTransform(D * sx, 0, 0, D * sy, D * x, D * y);
    }
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.globalAlpha = 1;
  };

  // ---- performance watch (same idea as Bubble Pop Party) ----
  const perf = { frames: 0, time: 0, slow: 0, hold: 3 };
  eng.holdPerf = (s = 1.5) => { perf.hold = s; };
  eng.watch = function watch(rawDt, paused) {
    if (document.hidden || paused || rawDt > 0.5) return;
    if (perf.hold > 0) { perf.hold -= rawDt; return; }
    perf.frames++;
    perf.time += rawDt;
    if (perf.time < 1.5) return;
    const avg = perf.time / perf.frames;
    perf.frames = 0;
    perf.time = 0;
    if (avg > 0.024 && eng.quality < QUALITY.length - 1) {
      perf.slow++;
      if (perf.slow >= 2) {
        eng.quality++;
        perf.slow = 0;
        perf.hold = 2;
        eng.resize();
        if (eng.onQuality) eng.onQuality(eng.quality);
      }
    } else {
      perf.slow = 0;
    }
  };

  // ---- text sprites ("+1" pops), rendered once per text/color/size ----
  eng.textSprite = function textSprite(text, color, size) {
    const key = `${text}|${color}|${size | 0}`;
    let cv = textCache.get(key);
    if (cv) return cv;
    if (textCache.size > 80) textCache.clear();
    const font = `700 ${size}px ${FONT}`;
    ctx.font = font;
    const m = ctx.measureText(text).width;
    const lw = Math.max(4, size * 0.17);
    const wpx = m + lw * 2 + 4;
    const hpx = size * 1.3 + lw * 2;
    const s = eng.DPR;
    cv = document.createElement('canvas');
    cv.width = Math.ceil(wpx * s);
    cv.height = Math.ceil(hpx * s);
    const c = cv.getContext('2d');
    c.scale(s, s);
    c.font = font;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = lw;
    c.strokeStyle = INK;
    c.strokeText(text, wpx / 2, hpx / 2);
    c.fillStyle = color;
    c.fillText(text, wpx / 2, hpx / 2);
    cv.cssW = wpx;
    cv.cssH = hpx;
    textCache.set(key, cv);
    return cv;
  };

  // ---- particles ----
  const maxParticles = () => QUALITY[eng.quality].particles;
  eng.light = () => eng.quality > 0;
  function add(p) {
    if (eng.particles.length >= maxParticles()) return;
    eng.particles.push(p);
  }
  eng.add = add;

  eng.sparkle = function sparkle(x, y, size, vy) {
    const u = eng.unit;
    add({
      type: 'spark', x, y, vx: rand(-50, 50) * u, vy: vy != null ? vy : rand(-110, -20) * u,
      size: (size || rand(14, 26)) * u, rot: rand(0, 3), vrot: rand(-4, 4), life: rand(0.5, 0.9), max: 0.9,
    });
  };
  eng.ring = function ring(x, y, color, r = 10, speed = 200, width = 5) {
    add({ type: 'ring', x, y, r: r * eng.unit, vr: speed * eng.unit, life: 0.45, max: 0.45, color, width });
  };
  eng.burst = function burst(x, y, color, n = 10, speed = 1, opts2 = {}) {
    const u = eng.unit;
    if (eng.light()) n = Math.ceil(n * 0.6);
    if (opts2.ring !== false) eng.ring(x, y, opts2.ringColor || '#fff', 8, 170 * speed);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.25, 0.25);
      const sp = rand(110, 260) * u * speed;
      add({
        type: 'drop', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts2.up || 40) * u,
        size: rand(4, 8) * u, life: rand(0.4, 0.75), max: 0.75,
        img: dotSprite(Array.isArray(color) ? color[i % color.length] : color), grav: opts2.grav != null ? opts2.grav : 500,
      });
    }
    const sp = opts2.sparks != null ? opts2.sparks : 3;
    for (let i = 0; i < sp; i++) eng.sparkle(x + rand(-18, 18) * u, y + rand(-18, 18) * u);
  };
  eng.trail = function trail(x, y, color, size = 14, life = 0.5) {
    add({ type: 'trail', x, y, vx: 0, vy: 0, size: size * eng.unit, life, max: life, img: dotSprite(color) });
  };
  eng.drip = function drip(x, y, vx, vy, color = '#7fd0ff', size = 5) {
    add({ type: 'drop', x, y, vx, vy, size: size * eng.unit, life: rand(0.5, 0.9), max: 0.9, img: dotSprite(color), grav: 700 });
  };
  /** Floating outlined words ("+1", "Wow!"). Important feedback: makes room when full. */
  eng.text = function text(x, y, str, color = '#fff', size = 30, life = 0.9, vy = -70) {
    if (eng.particles.length >= maxParticles()) eng.particles.shift();
    eng.particles.push({ type: 'text', x, y, vy: vy * eng.unit, img: eng.textSprite(str, color, size * eng.unit), life, max: life });
  };
  eng.clearParticles = () => { eng.particles.length = 0; };

  eng.updateParticles = function updateParticles(dt) {
    const ps = eng.particles;
    const u = eng.unit;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) { ps[i] = ps[ps.length - 1]; ps.pop(); continue; }
      switch (p.type) {
        case 'ring': p.r += p.vr * dt; p.vr *= 0.92; break;
        case 'drop':
          p.x += p.vx * dt; p.y += p.vy * dt;
          p.vx *= 0.93; p.vy = p.vy * 0.95 + p.grav * u * dt;
          break;
        case 'spark': p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vrot * dt; break;
        case 'text': p.y += p.vy * dt; p.vy *= 0.97; break;
        case 'trail': p.y += 10 * dt; break;
        case 'bubble': p.y += p.vy * dt; p.x += Math.sin(p.life * 8) * 12 * dt; break;
      }
    }
  };

  eng.drawParticles = function drawParticles() {
    const D = eng.DPR;
    for (const p of eng.particles) {
      const k = p.life / p.max;
      switch (p.type) {
        case 'ring':
          ctx.globalAlpha = k * 0.9;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.width * eng.unit * k + 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, TAU);
          ctx.stroke();
          break;
        case 'drop': {
          ctx.globalAlpha = Math.min(1, k * 1.5);
          const s = p.size * (0.4 + k * 0.6) * 2;
          ctx.drawImage(p.img, p.x - s / 2, p.y - s / 2, s, s);
          break;
        }
        case 'spark': {
          ctx.globalAlpha = Math.min(1, k * 1.6);
          const s = p.size * (0.5 + k * 0.5);
          const c = Math.cos(p.rot);
          const n = Math.sin(p.rot);
          ctx.setTransform(D * c, D * n, -D * n, D * c, D * p.x, D * p.y);
          ctx.drawImage(sparkleImg, -s / 2, -s / 2, s, s);
          ctx.setTransform(D, 0, 0, D, 0, 0);
          break;
        }
        case 'trail': {
          ctx.globalAlpha = k * 0.85;
          const s = p.size * (0.3 + k * 0.7);
          ctx.drawImage(p.img, p.x - s * 0.35, p.y - s * 0.35, s * 0.7, s * 0.7);
          ctx.drawImage(sparkleImg, p.x - s / 2, p.y - s / 2, s, s);
          break;
        }
        case 'bubble': {
          ctx.globalAlpha = Math.min(1, p.life * 4) * 0.85;
          ctx.drawImage(p.img, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          break;
        }
        case 'text': {
          const appear = Math.min(1, (p.max - p.life) / 0.12);
          ctx.globalAlpha = Math.min(1, k * 2.5);
          const sc = 0.6 + appear * 0.4;
          const w = p.img.cssW * sc;
          const h = p.img.cssH * sc;
          ctx.drawImage(p.img, p.x - w / 2, p.y - h / 2, w, h);
          break;
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  return eng;
}

// In a browser tab, go fullscreen when play starts (Android, iPad), like Bubble Pop Party.
export function goFullscreen() {
  const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
  if (navigator.standalone || mq('(display-mode: fullscreen)') || mq('(display-mode: standalone)')) return;
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el, { navigationUI: 'hide' });
    if (p && p.catch) p.catch(() => { /* not allowed here: keep playing normally */ });
  } catch (err) { /* ignore */ }
}
