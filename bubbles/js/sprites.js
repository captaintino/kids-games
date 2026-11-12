// Pre-renders glossy bubble sprites to offscreen canvases once, so each frame
// is just a cheap drawImage per bubble (important on phones).
export const SPRITE_SIZE = 256;
export const SPRITE_R = 100; // bubble radius inside the sprite (the rest is glow)

const C = SPRITE_SIZE / 2;
const hasConic = typeof CanvasRenderingContext2D !== 'undefined' &&
  'createConicGradient' in CanvasRenderingContext2D.prototype;

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE_SIZE;
  return c;
}

function rainbowFill(ctx, alpha) {
  if (hasConic) {
    const g = ctx.createConicGradient(-Math.PI / 2, C, C);
    for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsla(${i * 60}, 100%, 62%, ${alpha})`);
    return g;
  }
  const g = ctx.createLinearGradient(C - SPRITE_R, C - SPRITE_R, C + SPRITE_R, C + SPRITE_R);
  for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsla(${i * 60}, 100%, 62%, ${alpha})`);
  return g;
}

function drawBody(ctx, hue, rainbow) {
  const R = SPRITE_R;

  // outer glow
  const glow = ctx.createRadialGradient(C, C, R * 0.85, C, C, C);
  glow.addColorStop(0, rainbow ? 'hsla(300, 100%, 85%, 0.55)' : `hsla(${hue}, 100%, 75%, 0.5)`);
  glow.addColorStop(1, `hsla(${hue}, 100%, 75%, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(C, C, C, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(C, C, R, 0, Math.PI * 2);
  ctx.clip();

  if (rainbow) {
    ctx.fillStyle = rainbowFill(ctx, 0.85);
    ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    const w = ctx.createRadialGradient(C - R * 0.15, C - R * 0.2, 0, C, C, R);
    w.addColorStop(0, 'rgba(255,255,255,0.75)');
    w.addColorStop(0.55, 'rgba(255,255,255,0.15)');
    w.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = w;
    ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  } else {
    // candy-glass body: lighter in the middle, rich color toward the rim
    const body = ctx.createRadialGradient(C - R * 0.18, C - R * 0.22, 0, C, C, R * 1.08);
    body.addColorStop(0, `hsla(${hue}, 100%, 94%, 0.6)`);
    body.addColorStop(0.45, `hsla(${hue}, 95%, 70%, 0.62)`);
    body.addColorStop(0.8, `hsla(${hue}, 95%, 56%, 0.88)`);
    body.addColorStop(1, `hsla(${hue}, 100%, 40%, 0.98)`);
    ctx.fillStyle = body;
    ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  }

  // bounce light at the bottom for a 3D look
  const bounce = ctx.createRadialGradient(C, C + R * 0.95, 0, C, C + R * 0.95, R * 0.75);
  bounce.addColorStop(0, rainbow ? 'rgba(255,255,255,0.6)' : `hsla(${hue}, 100%, 88%, 0.75)`);
  bounce.addColorStop(1, `hsla(${hue}, 100%, 88%, 0)`);
  ctx.fillStyle = bounce;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

  // iridescent soap-film ring
  ctx.globalAlpha = rainbow ? 0.25 : 0.4;
  ctx.lineWidth = R * 0.16;
  ctx.strokeStyle = rainbowFill(ctx, 0.9);
  ctx.beginPath();
  ctx.arc(C, C, R * 0.93, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // crisp rim
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(C, C, R - 1.75, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHighlights(ctx, soft = false) {
  const R = SPRITE_R;
  // big soft window highlight (softer over a shape or letter, so it stays clear)
  ctx.save();
  if (soft) ctx.globalAlpha = 0.5;
  ctx.translate(C - R * 0.36, C - R * 0.42);
  ctx.rotate(-0.65);
  ctx.scale(1, 0.58);
  const hl = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.42);
  hl.addColorStop(0, 'rgba(255,255,255,0.98)');
  hl.addColorStop(0.45, 'rgba(255,255,255,0.75)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.lineCap = 'round';
  if (soft) ctx.globalAlpha = 0.75;
  // curved shine along top-left edge
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = R * 0.075;
  ctx.beginPath();
  ctx.arc(C, C, R * 0.8, Math.PI * 1.08, Math.PI * 1.32);
  ctx.stroke();
  // little shine bottom-right
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = R * 0.055;
  ctx.beginPath();
  ctx.arc(C, C, R * 0.8, Math.PI * 0.12, Math.PI * 0.32);
  ctx.stroke();
  // sparkle dot
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(C - R * 0.62, C - R * 0.05, R * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function starPath(ctx, x, y, outer, inner, points = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.85);
  ctx.bezierCurveTo(x - s * 1.25, y + s * 0.05, x - s * 0.95, y - s * 0.95, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.95, y - s * 0.95, x + s * 1.25, y + s * 0.05, x, y + s * 0.85);
  ctx.closePath();
}

function drawIcon(ctx, kind) {
  const R = SPRITE_R;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (kind === 'star') {
    starPath(ctx, C, C + R * 0.05, R * 0.58, R * 0.26);
    const g = ctx.createLinearGradient(C, C - R * 0.6, C, C + R * 0.6);
    g.addColorStop(0, '#fffbd0');
    g.addColorStop(0.45, '#ffe14a');
    g.addColorStop(1, '#ff9d1a');
    ctx.fillStyle = g;
    ctx.shadowColor = 'rgba(160, 80, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.stroke();
  } else if (kind === 'heart') {
    heartPath(ctx, C, C, R * 0.5);
    const g = ctx.createLinearGradient(C, C - R * 0.5, C, C + R * 0.5);
    g.addColorStop(0, '#ffc2dc');
    g.addColorStop(0.4, '#ff4f8f');
    g.addColorStop(1, '#e0004f');
    ctx.fillStyle = g;
    ctx.shadowColor = 'rgba(120, 0, 40, 0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.stroke();
  } else if (kind === 'snow') {
    ctx.translate(C, C);
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 80, 160, 0.55)';
    ctx.shadowBlur = 6;
    ctx.lineWidth = R * 0.085;
    const L = R * 0.55;
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -L);
      ctx.moveTo(0, -L * 0.55);
      ctx.lineTo(-L * 0.25, -L * 0.8);
      ctx.moveTo(0, -L * 0.55);
      ctx.lineTo(L * 0.25, -L * 0.8);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Returns { bubbles: [canvas per color], star, heart, snow, rainbow } */
export function buildSprites(colors) {
  const bubbles = colors.map((c) => {
    const cv = makeCanvas();
    const ctx = cv.getContext('2d');
    drawBody(ctx, c.hue, false);
    drawHighlights(ctx);
    return cv;
  });
  const special = (kind, hue, rainbow = false) => {
    const cv = makeCanvas();
    const ctx = cv.getContext('2d');
    drawBody(ctx, hue, rainbow);
    if (kind) drawIcon(ctx, kind);
    drawHighlights(ctx);
    return cv;
  };
  return {
    bubbles,
    star: special('star', 46),
    heart: special('heart', 330),
    snow: special('snow', 196),
    rainbow: special(null, 0, true),
  };
}

/** Small sparkle sprite for particles. */
export function buildSparkle() {
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#fff';
  starPath(ctx, s / 2, s / 2, s * 0.48, s * 0.07, 4, 0);
  ctx.fill();
  return cv;
}

// ---------------------------------------------------------------------------
// Shape Pop and Letter Pop bubbles
// ---------------------------------------------------------------------------
export const INK = '#2d2442';

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function polyPath(ctx, pts) {
  for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
}

// The moon: a big circle with a smaller one bitten out of its top right.
const MOON = (() => {
  const R = 0.95; const bx = 0.45; const by = -0.33; const r = 0.78;
  const d = Math.sqrt(bx * bx + by * by);
  const a = (R * R - r * r + d * d) / (2 * d);
  const h = Math.sqrt(R * R - a * a);
  const mx = (a * bx) / d; const my = (a * by) / d;
  const p1 = [mx + (h * by) / d, my - (h * bx) / d];
  const p2 = [mx - (h * by) / d, my + (h * bx) / d];
  return {
    R, bx, by, r,
    a1: Math.atan2(p1[1], p1[0]), a2: Math.atan2(p2[1], p2[0]),
    b1: Math.atan2(p1[1] - by, p1[0] - bx), b2: Math.atan2(p2[1] - by, p2[0] - bx),
  };
})();

// Per shape (in units of the shape's half size): where the cute face goes
// [x, y, size] and the little shine [x, y, rx, ry, angle].
const SHAPE_ART = {
  circle: { face: [0, 0.1, 1], hl: [-0.42, -0.42, 0.2, 0.11, -0.8] },
  square: { face: [0, 0.1, 1], hl: [-0.42, -0.6, 0.22, 0.08, 0] },
  triangle: { face: [0, 0.28, 0.85], hl: [-0.2, -0.38, 0.07, 0.2, 0.5] },
  star: { face: [0, 0.14, 0.72], hl: [-0.1, -0.52, 0.06, 0.14, 0.35] },
  heart: { face: [0, -0.02, 0.95], hl: [-0.5, -0.38, 0.17, 0.09, -0.7] },
  diamond: { face: [0, 0.08, 0.85], hl: [-0.24, -0.4, 0.07, 0.2, 0.8] },
  moon: { face: [-0.45, 0.22, 0.72], hl: [-0.62, -0.18, 0.08, 0.18, 0.4] },
  hexagon: { face: [0, 0.1, 1], hl: [-0.3, -0.62, 0.2, 0.07, 0] },
};

/** Traces a shape around (0, 0) with half size 1 (call inside a scaled context). */
export function shapePath(ctx, key) {
  ctx.beginPath();
  switch (key) {
    case 'circle': ctx.arc(0, 0, 0.92, 0, Math.PI * 2); break;
    case 'square': roundRectPath(ctx, -0.8, -0.8, 1.6, 1.6, 0.2); break;
    case 'triangle': polyPath(ctx, [0, -1.02, 0.98, 0.74, -0.98, 0.74]); break;
    case 'star': starPath(ctx, 0, 0.08, 1.04, 0.48); break;
    case 'heart': heartPath(ctx, 0, 0.06, 1.02); break;
    case 'diamond': polyPath(ctx, [0, -1.02, 0.74, 0, 0, 1.02, -0.74, 0]); break;
    case 'moon':
      ctx.arc(0, 0, MOON.R, MOON.a1, MOON.a2, true);
      ctx.arc(MOON.bx, MOON.by, MOON.r, MOON.b2, MOON.b1, false);
      ctx.closePath();
      break;
    case 'hexagon': {
      const pts = [];
      for (let i = 0; i < 6; i++) pts.push(Math.cos((i * Math.PI) / 3) * 0.96, Math.sin((i * Math.PI) / 3) * 0.96);
      polyPath(ctx, pts);
      break;
    }
  }
}

function drawFace(ctx, fx, fy, k) {
  const e = 0.2 * k;
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(fx - e, fy - 0.06 * k, 0.1 * k, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(fx + e, fy - 0.06 * k, 0.1 * k, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(fx - e - 0.03 * k, fy - 0.1 * k, 0.035 * k, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(fx + e - 0.03 * k, fy - 0.1 * k, 0.035 * k, 0, Math.PI * 2); ctx.fill();
  if (k >= 0.8) {
    ctx.fillStyle = 'rgba(255, 111, 168, 0.5)';
    ctx.save(); ctx.translate(fx - 0.35 * k, fy + 0.08 * k); ctx.scale(1, 0.66);
    ctx.beginPath(); ctx.arc(0, 0, 0.09 * k, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(fx + 0.35 * k, fy + 0.08 * k); ctx.scale(1, 0.66);
    ctx.beginPath(); ctx.arc(0, 0, 0.09 * k, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.07 * k;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fx - 0.14 * k, fy + 0.06 * k);
  ctx.quadraticCurveTo(fx, fy + 0.24 * k, fx + 0.14 * k, fy + 0.06 * k);
  ctx.stroke();
}

/**
 * Draws a chunky shape with a thick ink outline, a shine and a happy face,
 * centered on (cx, cy) with half size s. Used for the bubbles and the HUD icon.
 */
export function drawShape(ctx, key, cx, cy, s, light, base) {
  const art = SHAPE_ART[key] || SHAPE_ART.circle;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  shapePath(ctx, key);
  const g = ctx.createLinearGradient(0, -1, 0, 1);
  g.addColorStop(0, light);
  g.addColorStop(1, base);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 0.13;
  ctx.strokeStyle = INK;
  ctx.stroke();
  // shine
  const h = art.hl;
  ctx.save();
  ctx.translate(h[0], h[1]);
  ctx.rotate(h[4]);
  ctx.scale(h[2], h[3]);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  drawFace(ctx, art.face[0], art.face[1], art.face[2]);
  ctx.restore();
}

const LETTER_FONT = 'Fredoka, ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif';

/** A big letter with a thick ink outline, centered on (cx, cy), at most `max` wide. */
export function drawLetter(ctx, letter, cx, cy, size, max, light, base) {
  ctx.save();
  let fs = size;
  ctx.font = `700 ${fs}px ${LETTER_FONT}`;
  const w = ctx.measureText(letter).width;
  if (w > max) { fs = (fs * max) / w; ctx.font = `700 ${fs}px ${LETTER_FONT}`; }
  const m = ctx.measureText(letter);
  // center the capital itself, not the whole line box
  const asc = typeof m.actualBoundingBoxAscent === 'number' && m.actualBoundingBoxAscent > 0 ? m.actualBoundingBoxAscent : fs * 0.7;
  const desc = typeof m.actualBoundingBoxDescent === 'number' ? Math.max(0, m.actualBoundingBoxDescent) : 0;
  const y = cy + (asc - desc) / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = fs * 0.16;
  ctx.strokeStyle = INK;
  ctx.shadowColor = 'rgba(45, 36, 66, 0.35)';
  ctx.shadowOffsetY = fs * 0.04;
  ctx.shadowBlur = fs * 0.04;
  ctx.strokeText(letter, cx, y);
  ctx.shadowColor = 'transparent';
  const g = ctx.createLinearGradient(0, cy - fs * 0.4, 0, cy + fs * 0.4);
  g.addColorStop(0, light);
  g.addColorStop(1, base);
  ctx.fillStyle = g;
  ctx.fillText(letter, cx, y);
  ctx.restore();
}

/**
 * A bubble with a shape ('shape') or a big letter ('letter') inside, drawn
 * once and then reused every frame like the other bubble sprites.
 */
export function buildLearnSprite(kind, sym, hue) {
  const cv = makeCanvas();
  const ctx = cv.getContext('2d');
  drawBody(ctx, hue, false);
  if (kind === 'shape') {
    drawShape(ctx, sym, C, C, SPRITE_R * 0.64, '#ffffff', `hsl(${hue}, 100%, 86%)`);
  } else {
    drawLetter(ctx, sym, C, C, SPRITE_R * 1.32, SPRITE_R * 1.45, '#ffffff', `hsl(${hue}, 100%, 90%)`);
  }
  drawHighlights(ctx, true);
  return cv;
}
