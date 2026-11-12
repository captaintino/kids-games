// The coloring pages. Every picture is drawn on a 400 x 400 sheet as a list of
// shapes, painted in order (later shapes sit on top of earlier ones).
//
//   S(d, color)  a part kids can color. `color` is its "real" color, used by
//                Color by Number and Magic Reveal.
//   I(d, fill)   a fixed ink detail (eyes, nostrils). Not colorable.
//   D(d)         a fixed line detail (smiles, whiskers). Not colorable.
//
// Only shapes are colorable, so every area that looks separate is its own shape.

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
export const PALETTE = [
  { key: 'red', name: 'Red', hex: '#ff4d5e' },
  { key: 'orange', name: 'Orange', hex: '#ff9a2e' },
  { key: 'yellow', name: 'Yellow', hex: '#ffd93b' },
  { key: 'green', name: 'Green', hex: '#5cd65c' },
  { key: 'dkgreen', name: 'Dark Green', hex: '#25a55f' },
  { key: 'sky', name: 'Sky Blue', hex: '#8fdcff' },
  { key: 'blue', name: 'Blue', hex: '#3d7bff' },
  { key: 'purple', name: 'Purple', hex: '#9d5cff' },
  { key: 'pink', name: 'Pink', hex: '#ff7ac6' },
  { key: 'tan', name: 'Peach', hex: '#ffd2a6' },
  { key: 'brown', name: 'Brown', hex: '#a7663c' },
  { key: 'gray', name: 'Gray', hex: '#b3b9c6' },
  { key: 'black', name: 'Black', hex: '#3a3550' },
  { key: 'white', name: 'White', hex: '#ffffff' },
];

// Magic paints (SVG patterns / gradients, defined in art.js)
export const MAGIC = [
  { key: 'rainbow', name: 'Rainbow' },
  { key: 'glitter', name: 'Glitter' },
  { key: 'dots', name: 'Polka Dots' },
  { key: 'candy', name: 'Candy Stripes' },
  { key: 'stars', name: 'Stars' },
];

export const INK = '#2d2442';

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------
const n = (v) => Math.round(v * 10) / 10;

export function circle(cx, cy, r) {
  return `M${n(cx - r)} ${n(cy)}A${r} ${r} 0 1 0 ${n(cx + r)} ${n(cy)}A${r} ${r} 0 1 0 ${n(cx - r)} ${n(cy)}Z`;
}

export function ellipse(cx, cy, rx, ry, rot = 0) {
  const a = (rot * Math.PI) / 180;
  const dx = rx * Math.cos(a);
  const dy = rx * Math.sin(a);
  return `M${n(cx - dx)} ${n(cy - dy)}A${rx} ${ry} ${rot} 1 0 ${n(cx + dx)} ${n(cy + dy)}` +
    `A${rx} ${ry} ${rot} 1 0 ${n(cx - dx)} ${n(cy - dy)}Z`;
}

export function rect(x, y, w, h, r = 0) {
  if (!r) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  r = Math.min(r, w / 2, h / 2);
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}` +
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}` +
    `A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

export function poly(...pts) {
  let d = '';
  for (let i = 0; i < pts.length; i += 2) d += `${i ? 'L' : 'M'}${pts[i]} ${pts[i + 1]}`;
  return d + 'Z';
}

export function star(cx, cy, R, r, points = 5, rot = -90) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 ? r : R;
    const a = ((rot + (i * 180) / points) * Math.PI) / 180;
    pts.push(n(cx + Math.cos(a) * rad), n(cy + Math.sin(a) * rad));
  }
  return poly(...pts);
}

// Puffy cloud / bush outline: bumps around an ellipse.
export function cloud(cx, cy, rx, ry, bumps = 8, rot = 0) {
  const pts = [];
  for (let i = 0; i < bumps; i++) {
    const a = ((rot + (i * 360) / bumps) * Math.PI) / 180;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
  for (let i = 0; i < bumps; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % bumps];
    const r = n(Math.hypot(x1 - x0, y1 - y0) * 0.62);
    d += `A${r} ${r} 0 0 1 ${n(x1)} ${n(y1)}`;
  }
  return d + 'Z';
}

// Rainbow band (half ring) centred at cx, cy.
function band(cx, cy, ro, ri) {
  return `M${cx - ro} ${cy}A${ro} ${ro} 0 0 1 ${cx + ro} ${cy}L${cx + ri} ${cy}A${ri} ${ri} 0 0 0 ${cx - ri} ${cy}Z`;
}

// ---------------------------------------------------------------------------
// Shape constructors
// ---------------------------------------------------------------------------
export const S = (d, c) => ({ d, c });
export const BG = (c) => ({ d: rect(0, 0, 400, 400), c, bg: true });
export const I = (d, fill = INK) => ({ d, ink: fill });
export const D = (d, w = 5) => ({ d, line: w });
export const eye = (x, y, r = 8) => [I(circle(x, y, r)), I(circle(x - r * 0.35, y - r * 0.35, r * 0.32), '#fff')];

const GRASS = S('M0 330Q100 305 200 325T400 318V400H0Z', 'green');
const sun = (cx, cy, r) => [S(star(cx, cy, r * 1.6, r * 1.15, 10), 'orange'), S(circle(cx, cy, r), 'yellow')];

// A bendy tube (tentacles, tails) along a smooth line through `pts` ([[x, y], ...]).
// `w` is the half-width at each point (one number, or one per point), with round ends.
function tube(pts, w) {
  const ws = Array.isArray(w) ? w : pts.map(() => w);
  const at = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  const line = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let k = 0; k < 6; k++) {
      const t = k / 6;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a0, a1, a2, a3) => 0.5 * (2 * a1 + (a2 - a0) * t + (2 * a0 - 5 * a1 + 4 * a2 - a3) * t2 + (3 * a1 - a0 - 3 * a2 + a3) * t3);
      line.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1]), ws[i] + (ws[i + 1] - ws[i]) * t]);
    }
  }
  const last = pts[pts.length - 1];
  line.push([last[0], last[1], ws[ws.length - 1]]);
  const left = [];
  const right = [];
  line.forEach((p, i) => {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    left.push(`${n(p[0] + nx * p[2])} ${n(p[1] + ny * p[2])}`);
    right.push(`${n(p[0] - nx * p[2])} ${n(p[1] - ny * p[2])}`);
  });
  const r0 = n(ws[0]);
  const r1 = n(ws[ws.length - 1]);
  return `M${left[0]}L${left.slice(1).join('L')}A${r1} ${r1} 0 0 0 ${right[right.length - 1]}` +
    `L${right.slice(0, -1).reverse().join('L')}A${r0} ${r0} 0 0 0 ${left[0]}Z`;
}

// A pointed leaf / plate / petal: base `w` wide each side, `h` tall, standing on (x, y), turned by `rot` degrees.
function leaf(x, y, w, h, rot = 0) {
  const a = (rot * Math.PI) / 180;
  const p = (px, py) => `${n(x + px * Math.cos(a) - py * Math.sin(a))} ${n(y + px * Math.sin(a) + py * Math.cos(a))}`;
  return `M${p(-w, 0)}Q${p(-w * 0.95, -h * 0.65)} ${p(0, -h)}Q${p(w * 0.95, -h * 0.65)} ${p(w, 0)}Z`;
}

// ---------------------------------------------------------------------------
// Pictures
// ---------------------------------------------------------------------------
export const CATEGORIES = [
  { key: 'all', name: 'All', icon: '🌟' },
  { key: 'animals', name: 'Animals', icon: '🐾' },
  { key: 'nature', name: 'Nature', icon: '🌈' },
  { key: 'yummy', name: 'Yummy', icon: '🧁' },
  { key: 'things', name: 'Fun Stuff', icon: '🚀' },
  { key: 'vehicles', name: 'Vehicles', icon: '🚒' },
  { key: 'dinos', name: 'Dinosaurs', icon: '🦕' },
  { key: 'ocean', name: 'Ocean', icon: '🐙' },
  { key: 'holidays', name: 'Party', icon: '🎉' },
];

export const PICTURES = [
  // ======================= Animals =======================
  {
    id: 'kitty', name: 'Kitty', cat: 'animals',
    shapes: [
      BG('sky'),
      S(rect(0, 330, 400, 70), 'green'),
      S('M270 305C345 305 360 220 325 185C312 172 296 186 304 198C326 232 316 280 262 283Z', 'orange'),
      S(ellipse(200, 290, 85, 68), 'orange'),
      S(ellipse(200, 305, 45, 42), 'white'),
      S(ellipse(165, 352, 26, 15), 'orange'),
      S(ellipse(235, 352, 26, 15), 'orange'),
      S(poly(116, 150, 128, 66, 182, 112), 'orange'),
      S(poly(284, 150, 272, 66, 218, 112), 'orange'),
      S(poly(132, 132, 137, 92, 163, 116), 'pink'),
      S(poly(268, 132, 263, 92, 237, 116), 'pink'),
      S(circle(200, 168, 85), 'orange'),
      S(ellipse(165, 152, 15, 19), 'green'),
      S(ellipse(235, 152, 15, 19), 'green'),
      I(ellipse(165, 155, 6, 11)), I(circle(161, 147, 3.5), '#fff'),
      I(ellipse(235, 155, 6, 11)), I(circle(231, 147, 3.5), '#fff'),
      S(poly(189, 186, 211, 186, 200, 198), 'pink'),
      D('M200 198Q200 211 185 213M200 198Q200 211 215 213'),
      D('M148 196L98 186M148 207L98 212M252 196L302 186M252 207L302 212', 4),
    ],
  },
  {
    id: 'puppy', name: 'Puppy', cat: 'animals',
    shapes: [
      BG('sky'),
      GRASS,
      S('M272 292Q332 252 318 214Q338 224 334 258Q324 304 282 314Z', 'tan'),
      S(ellipse(200, 300, 82, 66), 'tan'),
      S(ellipse(200, 315, 42, 38), 'white'),
      S(ellipse(158, 358, 28, 16), 'tan'),
      S(ellipse(242, 358, 28, 16), 'tan'),
      S(rect(145, 232, 110, 24, 12), 'red'),
      S(circle(200, 168, 76), 'tan'),
      S(ellipse(236, 138, 24, 20, 20), 'brown'),
      S(ellipse(128, 182, 26, 58, 18), 'brown'),
      S(ellipse(272, 182, 26, 58, -18), 'brown'),
      S(ellipse(200, 204, 42, 31), 'white'),
      S('M189 220Q200 252 211 220Z', 'pink'),
      I(ellipse(200, 190, 14, 10)),
      D('M200 199V214M200 214Q188 224 178 214M200 214Q212 224 222 214'),
      ...eye(172, 160, 9),
      ...eye(228, 160, 9),
      S(circle(200, 262, 12), 'yellow'),
    ],
  },
  {
    id: 'fish', name: 'Fishy', cat: 'animals',
    shapes: [
      BG('sky'),
      S('M60 400Q38 340 70 296Q94 340 78 400Z', 'green'),
      S('M340 400Q318 330 350 276Q378 330 362 400Z', 'green'),
      S('M0 362Q100 338 200 360T400 354V400H0Z', 'tan'),
      S('M122 200L55 142Q76 200 55 258Z', 'orange'),
      S('M168 134Q200 78 252 136Z', 'orange'),
      S('M188 266Q206 304 236 264Z', 'orange'),
      S(ellipse(210, 200, 105, 72), 'orange'),
      S('M178 136Q164 200 178 264L200 270Q186 200 200 130Z', 'white'),
      S('M240 140Q227 200 240 260L262 254Q249 200 262 147Z', 'white'),
      S(circle(276, 184, 15), 'white'),
      I(circle(279, 186, 7)), I(circle(276, 183, 2.5), '#fff'),
      D('M308 214Q298 223 287 216'),
      S(circle(332, 118, 12), 'white'),
      S(circle(352, 82, 8), 'white'),
      S(circle(338, 52, 6), 'white'),
    ],
  },
  {
    id: 'chick', name: 'Chick', cat: 'animals',
    shapes: [
      BG('sky'),
      ...sun(62, 62, 30),
      GRASS,
      S(rect(174, 320, 9, 55, 4), 'orange'),
      S(rect(219, 320, 9, 55, 4), 'orange'),
      S(ellipse(176, 378, 20, 8), 'orange'),
      S(ellipse(226, 378, 20, 8), 'orange'),
      S(ellipse(200, 265, 95, 85), 'yellow'),
      S(ellipse(152, 275, 30, 44, 25), 'yellow'),
      S('M198 112Q186 78 204 90Q210 66 220 94Q236 82 224 114Z', 'yellow'),
      S(circle(205, 168, 60), 'yellow'),
      S(poly(256, 158, 292, 172, 256, 186), 'orange'),
      ...eye(226, 150, 8),
      S(circle(232, 184, 9), 'pink'),
    ],
  },
  {
    id: 'butterfly', name: 'Butterfly', cat: 'animals',
    shapes: [
      BG('sky'),
      GRASS,
      S('M195 190C120 60 30 90 60 170C80 222 150 222 195 202Z', 'purple'),
      S('M205 190C280 60 370 90 340 170C320 222 250 222 205 202Z', 'purple'),
      S('M195 206C130 220 70 290 120 322C160 342 190 282 195 226Z', 'pink'),
      S('M205 206C270 220 330 290 280 322C240 342 210 282 205 226Z', 'pink'),
      S(circle(108, 146, 22), 'yellow'),
      S(circle(292, 146, 22), 'yellow'),
      S(circle(150, 178, 10), 'yellow'),
      S(circle(250, 178, 10), 'yellow'),
      S(circle(138, 282, 15), 'orange'),
      S(circle(262, 282, 15), 'orange'),
      D('M193 120Q180 80 160 74M207 120Q220 80 240 74'),
      I(circle(160, 74, 7)), I(circle(240, 74, 7)),
      S(ellipse(200, 222, 14, 76), 'brown'),
      S(circle(200, 136, 21), 'brown'),
    ],
  },
  {
    id: 'turtle', name: 'Turtle', cat: 'animals',
    shapes: [
      BG('sky'),
      ...sun(330, 70, 30),
      GRASS,
      S(poly(84, 268, 52, 286, 88, 290), 'green'),
      S(ellipse(130, 302, 24, 28), 'green'),
      S(ellipse(270, 302, 24, 28), 'green'),
      S(circle(342, 246, 32), 'green'),
      S('M80 282Q90 150 200 150Q310 150 320 282Z', 'dkgreen'),
      S(poly(176, 190, 224, 190, 246, 226, 224, 262, 176, 262, 154, 226), 'green'),
      S('M108 262Q112 206 146 182L152 226L136 266Z', 'green'),
      S('M292 262Q288 206 254 182L248 226L264 266Z', 'green'),
      S(rect(70, 270, 260, 24, 12), 'yellow'),
      ...eye(354, 236, 6),
      D('M336 258Q348 268 362 258'),
    ],
  },
  {
    id: 'owl', name: 'Owl', cat: 'animals',
    shapes: [
      BG('blue'),
      S(circle(335, 68, 36), 'yellow'),
      S(star(60, 70, 16, 7), 'yellow'),
      S(star(110, 30, 10, 4.5), 'yellow'),
      S(star(360, 170, 11, 5), 'yellow'),
      S(poly(112, 152, 122, 84, 162, 122), 'brown'),
      S(poly(288, 152, 278, 84, 238, 122), 'brown'),
      S(ellipse(200, 228, 95, 112), 'brown'),
      S(ellipse(200, 275, 60, 62), 'tan'),
      S(ellipse(110, 250, 25, 64, 12), 'brown'),
      S(ellipse(290, 250, 25, 64, -12), 'brown'),
      D('M178 260q11 11 22 0q11 11 22 0M189 288q11 11 22 0', 4),
      S(circle(160, 178, 38), 'white'),
      S(circle(240, 178, 38), 'white'),
      S(circle(160, 180, 21), 'yellow'),
      S(circle(240, 180, 21), 'yellow'),
      ...eye(160, 180, 10),
      ...eye(240, 180, 10),
      S(poly(187, 204, 213, 204, 200, 230), 'orange'),
      S(rect(30, 330, 340, 26, 13), 'brown'),
      S(ellipse(176, 334, 15, 10), 'orange'),
      S(ellipse(224, 334, 15, 10), 'orange'),
    ],
  },
  {
    id: 'piggy', name: 'Piggy', cat: 'animals',
    shapes: [
      BG('sky'),
      GRASS,
      S(ellipse(200, 372, 150, 22), 'brown'),
      D('M296 284q24 -8 18 -26q-12 -6 -12 6', 5),
      S(rect(130, 318, 32, 56, 12), 'pink'),
      S(rect(238, 318, 32, 56, 12), 'pink'),
      S(ellipse(200, 292, 100, 68), 'pink'),
      S(poly(130, 122, 122, 70, 172, 104), 'pink'),
      S(poly(270, 122, 278, 70, 228, 104), 'pink'),
      S(circle(200, 180, 80), 'pink'),
      S(ellipse(200, 208, 36, 25), 'pink'),
      I(ellipse(188, 208, 5, 8)), I(ellipse(212, 208, 5, 8)),
      ...eye(168, 165, 8),
      ...eye(232, 165, 8),
      S(circle(146, 202, 11), 'red'),
      S(circle(254, 202, 11), 'red'),
      D('M182 240Q200 252 218 240'),
    ],
  },
  {
    id: 'ladybug', name: 'Ladybug', cat: 'animals',
    shapes: [
      BG('sky'),
      S('M30 370Q50 120 340 50Q330 310 30 370Z', 'green'),
      D('M44 356Q180 220 326 66', 4),
      D('M120 190L90 165M118 240L80 238M124 286L94 312M290 190L320 165M292 240L330 238M286 286L316 312', 6),
      D('M190 92Q180 60 160 52M220 92Q230 60 250 52'),
      I(circle(160, 52, 7)), I(circle(250, 52, 7)),
      S(circle(205, 122, 45), 'black'),
      S(circle(188, 108, 9), 'white'),
      S(circle(222, 108, 9), 'white'),
      S(circle(205, 218, 96), 'red'),
      D('M205 124V312'),
      S(circle(160, 186, 19), 'black'),
      S(circle(250, 186, 19), 'black'),
      S(circle(164, 258, 17), 'black'),
      S(circle(246, 258, 17), 'black'),
      S(circle(130, 226, 10), 'black'),
      S(circle(280, 226, 10), 'black'),
    ],
  },
  {
    id: 'snail', name: 'Snail', cat: 'animals',
    shapes: [
      BG('sky'),
      ...sun(62, 62, 28),
      S(rect(0, 330, 400, 70), 'green'),
      D('M335 215L318 168M356 212L372 166'),
      I(circle(318, 168, 8)), I(circle(372, 166, 8)),
      S(rect(56, 296, 286, 40, 20), 'tan'),
      S('M298 316Q296 232 334 210Q372 196 374 240Q374 300 342 324Z', 'tan'),
      ...eye(346, 244, 6),
      D('M334 266Q347 276 362 264'),
      S(circle(180, 222, 96), 'orange'),
      D('M180 222a6 6 0 0 1 12 0a12 12 0 0 1 -24 0a18 18 0 0 1 36 0a24 24 0 0 1 -48 0a30 30 0 0 1 60 0a36 36 0 0 1 -72 0a42 42 0 0 1 84 0', 6),
    ],
  },
  {
    id: 'whale', name: 'Whale', cat: 'animals',
    shapes: [
      BG('sky'),
      S(cloud(330, 70, 42, 20, 7), 'white'),
      S('M0 250Q100 232 200 250T400 250V400H0Z', 'blue'),
      S('M310 242Q350 222 360 180Q382 196 376 216Q396 208 400 234Q372 262 320 272Z', 'purple'),
      S('M70 252Q70 150 190 150Q300 150 322 232L330 272Q300 330 190 330Q70 330 70 252Z', 'purple'),
      S('M92 286Q190 320 302 288Q262 330 190 330Q122 330 92 286Z', 'white'),
      S('M186 152Q182 112 150 96Q176 104 191 124Q201 104 232 94Q202 110 196 152Z', 'sky'),
      ...eye(132, 228, 8),
      D('M86 262Q120 284 160 270'),
      S('M0 334Q50 312 100 334T200 334T300 334T400 334V400H0Z', 'blue'),
    ],
  },
  {
    id: 'bunny', name: 'Bunny', cat: 'animals',
    shapes: [
      BG('sky'),
      GRASS,
      S(ellipse(165, 98, 23, 66, -10), 'white'),
      S(ellipse(235, 98, 23, 66, 10), 'white'),
      S(ellipse(165, 104, 10, 46, -10), 'pink'),
      S(ellipse(235, 104, 10, 46, 10), 'pink'),
      S(ellipse(190, 300, 75, 70), 'white'),
      S(ellipse(190, 316, 40, 40), 'pink'),
      S(ellipse(150, 366, 28, 14), 'white'),
      S(ellipse(230, 366, 28, 14), 'white'),
      S(circle(200, 192, 66), 'white'),
      ...eye(176, 182, 8),
      ...eye(224, 182, 8),
      S(poly(191, 202, 209, 202, 200, 212), 'pink'),
      D('M200 212V222M200 222Q192 230 184 224M200 222Q208 230 216 224'),
      S(circle(160, 214, 10), 'pink'),
      S(circle(240, 214, 10), 'pink'),
      S('M335 252Q325 226 338 232Q340 212 350 232Q364 222 357 252Z', 'green'),
      S(poly(322, 250, 370, 250, 346, 372), 'orange'),
      D('M332 280H348M338 310H352M342 340H350', 4),
    ],
  },
  {
    id: 'froggy', name: 'Froggy', cat: 'animals',
    shapes: [
      BG('sky'),
      S(ellipse(200, 345, 200, 55), 'blue'),
      S(ellipse(200, 345, 145, 36), 'dkgreen'),
      S(ellipse(200, 280, 100, 68), 'green'),
      S(ellipse(200, 300, 55, 40), 'yellow'),
      S(ellipse(148, 340, 32, 14), 'green'),
      S(ellipse(252, 340, 32, 14), 'green'),
      S(circle(148, 172, 35), 'green'),
      S(circle(252, 172, 35), 'green'),
      S(ellipse(200, 215, 96, 60), 'green'),
      S(circle(148, 168, 22), 'white'),
      S(circle(252, 168, 22), 'white'),
      ...eye(150, 170, 10),
      ...eye(250, 170, 10),
      D('M140 236Q200 276 260 236'),
      S(circle(130, 240, 12), 'pink'),
      S(circle(270, 240, 12), 'pink'),
    ],
  },
  {
    id: 'bee', name: 'Busy Bee', cat: 'animals',
    shapes: [
      BG('sky'),
      S(cloud(320, 70, 45, 22, 7), 'white'),
      GRASS,
      S(ellipse(170, 148, 40, 56, -25), 'white'),
      S(ellipse(248, 148, 40, 56, 25), 'white'),
      S(poly(312, 222, 346, 234, 312, 246), 'black'),
      S(ellipse(205, 232, 110, 75), 'yellow'),
      S('M170 162Q155 232 170 302L200 307Q185 232 200 157Z', 'black'),
      S('M236 160Q221 232 236 304L260 296Q246 232 260 168Z', 'black'),
      D('M90 180Q80 142 60 132M110 178Q115 142 135 130'),
      I(circle(60, 132, 7)), I(circle(135, 130, 7)),
      S(circle(100, 222, 48), 'yellow'),
      ...eye(86, 210, 8),
      D('M76 240Q90 252 106 240'),
    ],
  },
  {
    id: 'dino', name: 'Dino', cat: 'animals',
    shapes: [
      BG('sky'),
      S(cloud(80, 70, 45, 22, 7), 'white'),
      GRASS,
      S(poly(122, 220, 140, 182, 160, 214), 'orange'),
      S(poly(160, 207, 182, 168, 204, 204), 'orange'),
      S(poly(204, 204, 228, 168, 248, 210), 'orange'),
      S('M100 262Q34 272 18 330Q60 304 112 304Z', 'green'),
      S(rect(118, 300, 38, 72, 14), 'green'),
      S(rect(232, 300, 38, 72, 14), 'green'),
      S(ellipse(192, 270, 110, 70), 'green'),
      S('M240 236Q258 146 290 106Q302 84 332 88Q370 94 366 118Q362 134 322 132Q302 166 302 252Z', 'green'),
      S(ellipse(190, 296, 64, 34), 'yellow'),
      S(circle(150, 248, 12), 'dkgreen'),
      S(circle(230, 240, 10), 'dkgreen'),
      ...eye(334, 104, 6),
      D('M346 122Q356 124 362 118'),
    ],
  },

  // ======================= Nature =======================
  {
    id: 'flower', name: 'Flower', cat: 'nature',
    shapes: [
      BG('sky'),
      GRASS,
      S(rect(194, 200, 12, 140, 6), 'green'),
      S(ellipse(160, 284, 40, 16, -30), 'green'),
      S(ellipse(240, 264, 40, 16, 30), 'green'),
      ...[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i * Math.PI) / 3 - Math.PI / 2;
        return S(circle(200 + Math.cos(a) * 56, 150 + Math.sin(a) * 56, 38), 'pink');
      }),
      S(circle(200, 150, 40), 'yellow'),
      ...eye(186, 142, 6),
      ...eye(214, 142, 6),
      D('M186 162Q200 174 214 162'),
      S('M150 330L250 330L236 396L164 396Z', 'orange'),
      S(rect(138, 318, 124, 24, 8), 'orange'),
    ],
  },
  {
    id: 'tree', name: 'Apple Tree', cat: 'nature',
    shapes: [
      BG('sky'),
      ...sun(345, 55, 26),
      GRASS,
      S('M172 400L184 240L216 240L228 400Z', 'brown'),
      S(cloud(200, 168, 128, 105, 10), 'green'),
      S(circle(140, 140, 14), 'red'),
      S(circle(240, 116, 14), 'red'),
      S(circle(270, 200, 14), 'red'),
      S(circle(170, 220, 14), 'red'),
      S(circle(205, 170, 14), 'red'),
      S(circle(300, 360, 14), 'red'),
      S(cloud(70, 340, 40, 20, 6), 'dkgreen'),
    ],
  },
  {
    id: 'rainbow', name: 'Rainbow', cat: 'nature',
    shapes: [
      BG('sky'),
      S('M0 350Q100 330 200 345T400 340V400H0Z', 'green'),
      S(band(200, 330, 170, 150), 'red'),
      S(band(200, 330, 150, 130), 'orange'),
      S(band(200, 330, 130, 110), 'yellow'),
      S(band(200, 330, 110, 90), 'green'),
      S(band(200, 330, 90, 70), 'blue'),
      S(band(200, 330, 70, 50), 'purple'),
      S(cloud(55, 325, 55, 30, 8), 'white'),
      S(cloud(345, 325, 55, 30, 8), 'white'),
      S(star(330, 60, 18, 8), 'yellow'),
      S(star(70, 80, 13, 6), 'yellow'),
    ],
  },
  {
    id: 'mushroom', name: 'Mushroom', cat: 'nature',
    shapes: [
      BG('sky'),
      GRASS,
      S('M165 248Q155 340 148 362L252 362Q245 340 235 248Z', 'tan'),
      S('M58 250Q58 100 200 94Q342 100 342 250Q200 280 58 250Z', 'red'),
      S(circle(130, 180, 24), 'white'),
      S(circle(200, 135, 20), 'white'),
      S(circle(270, 180, 24), 'white'),
      S(circle(200, 220, 18), 'white'),
      S(circle(100, 236, 12), 'white'),
      S(circle(300, 236, 12), 'white'),
      ...eye(184, 300, 6),
      ...eye(216, 300, 6),
      D('M186 320Q200 332 214 320'),
      S(cloud(330, 60, 40, 20, 7), 'white'),
    ],
  },
  {
    id: 'sunny', name: 'Sunny Day', cat: 'nature',
    shapes: [
      BG('sky'),
      S(star(200, 180, 150, 105, 12), 'orange'),
      S(circle(200, 180, 100), 'yellow'),
      ...eye(165, 160, 11),
      ...eye(235, 160, 11),
      D('M150 205Q200 250 250 205', 6),
      S(circle(140, 200, 14), 'pink'),
      S(circle(260, 200, 14), 'pink'),
      S(cloud(90, 340, 75, 32, 9), 'white'),
      S(cloud(310, 330, 70, 30, 9), 'white'),
    ],
  },
  {
    id: 'starry', name: 'Happy Star', cat: 'nature',
    shapes: [
      BG('blue'),
      S(circle(70, 330, 32), 'gray'),
      S(circle(60, 318, 8), 'white'),
      S(star(200, 210, 150, 66), 'yellow'),
      ...eye(178, 200, 9),
      ...eye(222, 200, 9),
      D('M180 228Q200 246 220 228'),
      S(circle(160, 226, 10), 'pink'),
      S(circle(240, 226, 10), 'pink'),
      S(star(60, 60, 18, 8), 'yellow'),
      S(star(345, 60, 22, 10), 'yellow'),
      S(star(345, 340, 16, 7), 'yellow'),
      S(circle(110, 120, 5), 'white'),
      S(circle(300, 140, 5), 'white'),
      S(circle(250, 360, 5), 'white'),
    ],
  },
  {
    id: 'snowman', name: 'Snowman', cat: 'nature',
    shapes: [
      BG('sky'),
      S('M0 330Q100 310 200 326T400 320V400H0Z', 'white'),
      D('M140 200L80 160L66 136M80 160L62 168M260 200L320 160L334 136M320 160L340 168', 6),
      S(circle(200, 302, 80), 'white'),
      S(circle(200, 192, 60), 'white'),
      S(circle(200, 105, 48), 'white'),
      S(rect(168, 12, 64, 50, 8), 'black'),
      S(rect(168, 46, 64, 12), 'red'),
      S(rect(148, 58, 104, 14, 7), 'black'),
      S('M200 108L246 122L200 124Z', 'orange'),
      ...eye(184, 96, 6),
      ...eye(216, 96, 6),
      D('M182 134Q200 144 218 134'),
      S(rect(146, 146, 108, 20, 10), 'red'),
      S(rect(222, 160, 22, 50, 8), 'red'),
      I(circle(200, 190, 7)), I(circle(200, 220, 7)), I(circle(200, 270, 8)), I(circle(200, 305, 8)),
      ...[[60, 60], [330, 90], [90, 200], [350, 230], [40, 280]].map(([x, y]) => S(circle(x, y, 7), 'white')),
    ],
  },
  {
    id: 'umbrella', name: 'Umbrella', cat: 'nature',
    shapes: [
      BG('gray'),
      S(ellipse(200, 372, 150, 22), 'blue'),
      D('M200 200V330Q200 356 176 356Q156 356 156 334', 8),
      S('M60 200Q80 104 200 84Q140 120 130 200Q95 180 60 200Z', 'red'),
      S('M130 200Q140 120 200 84Q186 140 200 200Q165 180 130 200Z', 'yellow'),
      S('M200 200Q186 140 200 84Q214 140 270 200Q235 180 200 200Z', 'red'),
      S('M270 200Q260 120 200 84Q320 104 340 200Q305 180 270 200Z', 'yellow'),
      S(circle(200, 80, 8), 'black'),
      ...[[50, 60], [120, 30], [300, 40], [360, 110], [40, 260], [350, 270], [90, 330], [300, 330]]
        .map(([x, y]) => S(`M${x} ${y - 14}Q${x + 10} ${y} ${x} ${y + 6}Q${x - 10} ${y} ${x} ${y - 14}Z`, 'sky')),
    ],
  },

  // ======================= Yummy =======================
  {
    id: 'icecream', name: 'Ice Cream', cat: 'yummy',
    shapes: [
      BG('pink'),
      S(poly(140, 220, 260, 220, 200, 382), 'tan'),
      D('M156 260H244M170 300H230M185 340H215M150 240L214 336M250 240L186 336', 4),
      S(circle(200, 188, 64), 'white'),
      S('M138 206Q142 246 158 230Q170 256 186 232Q200 258 216 232Q230 256 244 230Q258 246 262 206Z', 'white'),
      S(circle(200, 112, 52), 'brown'),
      D('M200 50Q204 36 216 30'),
      S(circle(200, 62, 16), 'red'),
      S(star(70, 80, 20, 9), 'yellow'),
      S(star(330, 300, 18, 8), 'yellow'),
    ],
  },
  {
    id: 'cupcake', name: 'Cupcake', cat: 'yummy',
    shapes: [
      BG('yellow'),
      S('M118 232L282 232L256 362L144 362Z', 'sky'),
      D('M150 240L164 356M182 240L188 356M218 240L212 356M250 240L236 356', 4),
      S(cloud(200, 200, 100, 48, 9), 'pink'),
      S(cloud(200, 148, 64, 34, 7), 'pink'),
      D('M200 104Q206 86 222 80'),
      S(circle(200, 112, 18), 'red'),
      S(rect(150, 160, 8, 18, 4), 'yellow'),
      S(rect(236, 196, 8, 18, 4), 'blue'),
      S(rect(168, 210, 8, 18, 4), 'green'),
      S(rect(220, 150, 8, 18, 4), 'purple'),
      S(rect(118, 190, 8, 18, 4), 'orange'),
      S(rect(270, 204, 8, 18, 4), 'yellow'),
    ],
  },
  {
    id: 'apple', name: 'Apple', cat: 'yummy',
    shapes: [
      BG('sky'),
      S(rect(0, 330, 400, 70), 'brown'),
      S(rect(194, 66, 12, 60, 5), 'brown'),
      S('M200 120C150 85 70 100 75 200C80 300 150 352 200 332C250 352 320 300 325 200C330 100 250 85 200 120Z', 'red'),
      S('M206 98Q240 50 284 70Q252 112 206 98Z', 'green'),
      S(ellipse(128, 180, 12, 28, 20), 'white'),
      ...eye(170, 210, 9),
      ...eye(230, 210, 9),
      D('M180 246Q200 262 220 246'),
    ],
  },
  {
    id: 'pizza', name: 'Pizza', cat: 'yummy',
    shapes: [
      BG('green'),
      S('M70 90Q200 40 330 90L200 380Z', 'yellow'),
      S('M62 72Q200 18 338 72L330 96Q200 46 70 96Z', 'orange'),
      S(circle(170, 140, 22), 'red'),
      S(circle(240, 130, 22), 'red'),
      S(circle(205, 210, 22), 'red'),
      S(circle(200, 300, 16), 'red'),
      S(ellipse(150, 200, 10, 14), 'green'),
      S(ellipse(250, 200, 10, 14), 'green'),
      S(ellipse(215, 260, 10, 14), 'green'),
    ],
  },
  {
    id: 'watermelon', name: 'Watermelon', cat: 'yummy',
    shapes: [
      BG('sky'),
      S('M40 160A160 160 0 0 0 360 160Z', 'dkgreen'),
      S('M58 160A142 142 0 0 0 342 160Z', 'white'),
      S('M74 160A126 126 0 0 0 326 160Z', 'red'),
      ...[[130, 190], [170, 210], [210, 214], [250, 204], [150, 248], [200, 256], [250, 244], [200, 296]]
        .map(([x, y]) => S(ellipse(x, y, 6, 10), 'black')),
      ...eye(170, 176, 7),
      ...eye(230, 176, 7),
      D('M186 190Q200 198 214 190'),
      ...sun(60, 60, 26),
    ],
  },

  // ======================= Fun Stuff =======================
  {
    id: 'house', name: 'House', cat: 'things',
    shapes: [
      BG('sky'),
      ...sun(60, 58, 26),
      S(cloud(310, 60, 42, 20, 7), 'white'),
      GRASS,
      S(rect(255, 100, 32, 70), 'brown'),
      S(rect(90, 190, 220, 170), 'yellow'),
      S(poly(68, 202, 200, 90, 332, 202), 'red'),
      S(circle(200, 160, 18), 'white'),
      S(rect(108, 222, 54, 48, 4), 'sky'),
      S(rect(238, 222, 54, 48, 4), 'sky'),
      D('M135 222V270M108 246H162M265 222V270M238 246H292', 4),
      S(rect(178, 268, 46, 92, 6), 'blue'),
      I(circle(214, 316, 5)),
      S('M178 360L224 360L262 400L140 400Z', 'gray'),
    ],
  },
  {
    id: 'car', name: 'Car', cat: 'things',
    shapes: [
      BG('sky'),
      S(cloud(90, 70, 50, 22, 7), 'white'),
      ...sun(330, 64, 28),
      S(rect(0, 322, 400, 78), 'gray'),
      S(rect(20, 356, 60, 10, 5), 'yellow'),
      S(rect(170, 356, 60, 10, 5), 'yellow'),
      S(rect(320, 356, 60, 10, 5), 'yellow'),
      S('M36 300L36 256Q36 232 60 230L110 226L150 172Q160 160 176 160L270 160Q286 160 296 174L332 226L356 230Q372 236 372 258L372 300Z', 'red'),
      S('M124 226L160 182L210 182L210 226Z', 'sky'),
      S('M226 226L226 182L278 182L312 226Z', 'sky'),
      D('M218 232V296'),
      S(rect(234, 244, 22, 8, 4), 'gray'),
      S(circle(362, 252, 10), 'yellow'),
      S(circle(110, 306, 36), 'black'),
      S(circle(300, 306, 36), 'black'),
      S(circle(110, 306, 15), 'gray'),
      S(circle(300, 306, 15), 'gray'),
    ],
  },
  {
    id: 'rocket', name: 'Rocket', cat: 'things',
    shapes: [
      BG('blue'),
      S(star(60, 60, 16, 7), 'yellow'),
      S(star(340, 110, 12, 5), 'yellow'),
      S(star(70, 250, 11, 5), 'yellow'),
      S(circle(330, 320, 40), 'orange'),
      D('M276 330Q330 300 386 310'),
      S('M160 282Q172 342 200 374Q228 342 240 282Z', 'orange'),
      S('M180 282Q186 322 200 342Q214 322 220 282Z', 'yellow'),
      S('M146 208L96 292L148 272Z', 'red'),
      S('M254 208L304 292L252 272Z', 'red'),
      S('M200 40Q262 100 256 284L144 284Q138 100 200 40Z', 'white'),
      S('M200 40Q236 74 248 122L152 122Q164 74 200 40Z', 'red'),
      S(circle(200, 178, 36), 'gray'),
      S(circle(200, 178, 24), 'sky'),
      S(rect(190, 220, 20, 64, 4), 'red'),
    ],
  },
  {
    id: 'boat', name: 'Sailboat', cat: 'things',
    shapes: [
      BG('sky'),
      ...sun(330, 64, 28),
      D('M60 80q10 -10 20 0q10 -10 20 0M110 120q8 -8 16 0q8 -8 16 0', 4),
      S('M0 280Q100 266 200 280T400 280V400H0Z', 'blue'),
      S(rect(196, 64, 8, 200), 'brown'),
      S(poly(204, 46, 242, 58, 204, 70), 'red'),
      S(poly(212, 80, 212, 246, 322, 246), 'white'),
      S(poly(188, 100, 188, 246, 96, 246), 'yellow'),
      S('M66 258L334 258L292 324L108 324Z', 'red'),
      S(circle(150, 290, 11), 'white'),
      S(circle(200, 290, 11), 'white'),
      S(circle(250, 290, 11), 'white'),
      S('M0 332Q50 312 100 332T200 332T300 332T400 332V400H0Z', 'sky'),
    ],
  },
  {
    id: 'balloons', name: 'Balloons', cat: 'things',
    shapes: [
      BG('sky'),
      S(cloud(330, 340, 60, 26, 8), 'white'),
      D('M130 220Q150 300 196 360M200 190Q190 280 200 360M270 220Q250 300 204 360', 4),
      S(poly(124, 216, 138, 216, 131, 228), 'red'),
      S(poly(194, 186, 208, 186, 201, 198), 'blue'),
      S(poly(264, 216, 278, 216, 271, 228), 'yellow'),
      S(ellipse(130, 150, 56, 68), 'red'),
      S(ellipse(270, 150, 56, 68), 'yellow'),
      S(ellipse(200, 118, 56, 68), 'blue'),
      S(ellipse(112, 126, 9, 18, 20), 'white'),
      S(ellipse(182, 94, 9, 18, 20), 'white'),
      S(ellipse(252, 126, 9, 18, 20), 'white'),
      S('M184 352L216 352L210 372L190 372Z', 'pink'),
    ],
  },
  {
    id: 'castle', name: 'Castle', cat: 'things',
    shapes: [
      BG('sky'),
      S(cloud(200, 50, 45, 20, 7), 'white'),
      GRASS,
      D('M95 90V52M305 90V52', 4),
      S(poly(97, 52, 130, 62, 97, 72), 'red'),
      S(poly(307, 52, 340, 62, 307, 72), 'red'),
      S('M120 360V200H145V180H175V200H225V180H255V200H280V360Z', 'gray'),
      S(rect(60, 140, 70, 220), 'gray'),
      S(rect(270, 140, 70, 220), 'gray'),
      S(poly(50, 146, 95, 86, 140, 146), 'purple'),
      S(poly(260, 146, 305, 86, 350, 146), 'purple'),
      S('M172 360V290Q172 262 200 262Q228 262 228 290V360Z', 'brown'),
      S('M85 230V206Q85 192 95 192Q105 192 105 206V230Z', 'yellow'),
      S('M295 230V206Q295 192 305 192Q315 192 315 206V230Z', 'yellow'),
      S('M190 240V222Q190 210 200 210Q210 210 210 222V240Z', 'yellow'),
      S('M172 400L228 400L228 360L172 360Z', 'tan'),
    ],
  },
  {
    id: 'robot', name: 'Robot', cat: 'things',
    shapes: [
      BG('yellow'),
      D('M200 70V40'),
      S(circle(200, 34, 12), 'red'),
      S(rect(70, 200, 40, 100, 16), 'gray'),
      S(rect(290, 200, 40, 100, 16), 'gray'),
      S(circle(90, 310, 22), 'gray'),
      S(circle(310, 310, 22), 'gray'),
      S(rect(140, 316, 40, 56, 8), 'gray'),
      S(rect(220, 316, 40, 56, 8), 'gray'),
      S(rect(124, 362, 70, 24, 12), 'blue'),
      S(rect(206, 362, 70, 24, 12), 'blue'),
      S(rect(185, 166, 30, 30), 'gray'),
      S(rect(110, 190, 180, 134, 20), 'blue'),
      S(rect(148, 214, 104, 64, 12), 'white'),
      S(circle(172, 246, 12), 'red'),
      S(circle(200, 246, 12), 'yellow'),
      S(circle(228, 246, 12), 'green'),
      S(rect(130, 70, 140, 100, 18), 'gray'),
      S(circle(170, 112, 19), 'yellow'),
      S(circle(230, 112, 19), 'yellow'),
      ...eye(170, 112, 8),
      ...eye(230, 112, 8),
      S(rect(165, 140, 70, 16, 5), 'white'),
      D('M182 140V156M200 140V156M218 140V156', 4),
      S(circle(122, 112, 10), 'red'),
      S(circle(278, 112, 10), 'red'),
    ],
  },
  {
    id: 'train', name: 'Train', cat: 'things',
    shapes: [
      BG('sky'),
      S(cloud(90, 60, 38, 18, 7), 'white'),
      S(cloud(140, 100, 26, 14, 6), 'white'),
      GRASS,
      S(rect(0, 352, 400, 12), 'brown'),
      S(rect(120, 104, 36, 76, 4), 'black'),
      S(rect(110, 94, 56, 18, 6), 'black'),
      S(rect(70, 180, 190, 110, 10), 'red'),
      S(rect(230, 120, 110, 170, 10), 'blue'),
      S(rect(220, 104, 130, 22, 8), 'red'),
      S(rect(254, 146, 62, 54, 6), 'sky'),
      S(poly(60, 290, 30, 330, 80, 330), 'gray'),
      S(rect(60, 280, 290, 26, 6), 'yellow'),
      S(circle(120, 320, 32), 'black'),
      S(circle(210, 320, 32), 'black'),
      S(circle(296, 320, 32), 'black'),
      S(circle(120, 320, 12), 'gray'),
      S(circle(210, 320, 12), 'gray'),
      S(circle(296, 320, 12), 'gray'),
      S(circle(88, 214, 12), 'yellow'),
    ],
  },

  // ======================= Vehicles =======================
  {
    id: 'firetruck', name: 'Fire Truck', cat: 'vehicles',
    shapes: [
      BG('sky'),
      S(cloud(80, 64, 46, 20, 7), 'white'),
      ...sun(340, 60, 26),
      S(rect(0, 330, 400, 70), 'gray'),
      S(rect(14, 362, 60, 10, 5), 'yellow'),
      S(rect(170, 362, 60, 10, 5), 'yellow'),
      S(rect(326, 362, 60, 10, 5), 'yellow'),
      S(rect(30, 180, 236, 132, 12), 'red'),
      S('M246 312V150Q246 134 262 134H318Q334 134 342 150L370 214Q374 224 374 236V312Z', 'red'),
      S('M266 152H314Q322 152 326 160L348 212H266Z', 'sky'),
      S('M282 134V122Q282 108 296 108Q310 108 310 122V134Z', 'blue'),
      S(rect(38, 130, 210, 18, 9), 'gray'),
      S(rect(38, 162, 210, 18, 9), 'gray'),
      D('M66 148V162M96 148V162M126 148V162M156 148V162M186 148V162M216 148V162', 5),
      S(rect(30, 252, 344, 26), 'white'),
      S(circle(92, 216, 30), 'yellow'),
      S(circle(92, 216, 10), 'gray'),
      S(rect(140, 194, 96, 48, 8), 'gray'),
      D('M188 194V242', 4),
      S(circle(362, 246, 9), 'yellow'),
      S(rect(356, 290, 32, 18, 6), 'gray'),
      S(circle(100, 312, 34), 'black'),
      S(circle(300, 312, 34), 'black'),
      S(circle(100, 312, 14), 'gray'),
      S(circle(300, 312, 14), 'gray'),
    ],
  },
  {
    id: 'bus', name: 'Bus', cat: 'vehicles',
    shapes: [
      BG('sky'),
      ...sun(62, 58, 26),
      S(cloud(300, 62, 48, 20, 7), 'white'),
      S(rect(0, 330, 400, 70), 'gray'),
      S(rect(14, 362, 60, 10, 5), 'white'),
      S(rect(170, 362, 60, 10, 5), 'white'),
      S(rect(326, 362, 60, 10, 5), 'white'),
      S('M30 306V156Q30 130 56 130H316Q344 130 352 158L370 230Q374 244 374 258V306Z', 'yellow'),
      S(rect(50, 150, 52, 50, 8), 'sky'),
      S(rect(114, 150, 52, 50, 8), 'sky'),
      S(rect(178, 150, 52, 50, 8), 'sky'),
      S(rect(244, 150, 52, 140, 8), 'sky'),
      D('M270 150V290', 4),
      S('M310 150H330Q340 150 343 160L358 222H310Z', 'sky'),
      S(rect(30, 222, 214, 14), 'black'),
      S(circle(360, 262, 9), 'white'),
      S(rect(24, 292, 40, 18, 8), 'gray'),
      S(rect(334, 292, 48, 18, 8), 'gray'),
      S(circle(110, 310, 32), 'black'),
      S(circle(306, 310, 32), 'black'),
      S(circle(110, 310, 13), 'gray'),
      S(circle(306, 310, 13), 'gray'),
    ],
  },
  {
    id: 'plane', name: 'Airplane', cat: 'vehicles',
    shapes: [
      BG('sky'),
      S(cloud(86, 330, 66, 28, 8), 'white'),
      S(cloud(316, 66, 50, 22, 7), 'white'),
      S(cloud(340, 330, 40, 18, 7), 'white'),
      S('M68 196L44 112Q42 100 56 100H74Q86 100 92 110L138 184Z', 'red'),
      S('M180 172L222 102Q228 94 238 94H252Q262 96 258 106L238 172Z', 'blue'),
      S('M58 200Q58 166 104 164H296Q346 166 372 200Q346 236 296 236H104Q58 234 58 200Z', 'white'),
      S('M60 210H368Q346 236 296 236H104Q64 234 60 210Z', 'blue'),
      S('M318 176Q342 180 356 198H318Z', 'sky'),
      S(circle(150, 194, 10), 'sky'),
      S(circle(184, 194, 10), 'sky'),
      S(circle(218, 194, 10), 'sky'),
      S(circle(252, 194, 10), 'sky'),
      S(circle(286, 194, 10), 'sky'),
      S('M164 214H240L188 306Q182 314 172 314H156Q146 312 150 302Z', 'red'),
      S('M66 214H112L92 250Q88 256 80 256H70Q62 254 64 246Z', 'red'),
    ],
  },
  {
    id: 'tractor', name: 'Tractor', cat: 'vehicles',
    shapes: [
      BG('sky'),
      ...sun(340, 60, 28),
      S(cloud(90, 64, 44, 20, 7), 'white'),
      S('M0 336Q100 322 200 334T400 330V400H0Z', 'brown'),
      D('M20 372Q120 360 200 372T380 368', 4),
      S(rect(292, 132, 14, 76, 5), 'gray'),
      S('M96 286V136H200L224 214V286Z', 'green'),
      S('M114 152H188L204 206H114Z', 'sky'),
      D('M168 206L180 186', 5),
      S(rect(84, 118, 132, 22, 10), 'red'),
      S(rect(196, 204, 150, 82, 14), 'green'),
      S(rect(334, 218, 22, 58, 6), 'gray'),
      S(circle(346, 206, 10), 'yellow'),
      S(rect(220, 222, 92, 14, 7), 'yellow'),
      S(circle(140, 298, 64), 'black'),
      S(circle(140, 298, 30), 'yellow'),
      S(circle(310, 320, 40), 'black'),
      S(circle(310, 320, 17), 'yellow'),
    ],
  },
  {
    id: 'helicopter', name: 'Helicopter', cat: 'vehicles',
    shapes: [
      BG('sky'),
      S(cloud(70, 300, 54, 24, 8), 'white'),
      S(cloud(330, 340, 50, 22, 7), 'white'),
      S(cloud(330, 50, 40, 18, 7), 'white'),
      S('M262 166L346 176Q358 178 358 190Q358 202 346 204L264 216Z', 'orange'),
      S(ellipse(352, 160, 9, 36), 'gray'),
      S(circle(352, 160, 8), 'red'),
      D('M168 256V290M236 256V290', 7),
      S(rect(110, 286, 196, 14, 7), 'gray'),
      S('M96 200Q96 120 190 116Q290 114 290 196Q290 260 222 262H164Q96 260 96 200Z', 'orange'),
      S('M114 194Q114 138 176 132V194Z', 'sky'),
      S(rect(196, 136, 62, 52, 12), 'sky'),
      S(rect(100, 210, 188, 24, 6), 'yellow'),
      S(rect(186, 88, 28, 30, 6), 'gray'),
      S(rect(52, 72, 296, 16, 8), 'gray'),
      S(circle(200, 80, 12), 'red'),
    ],
  },
  {
    id: 'digger', name: 'Digger', cat: 'vehicles',
    shapes: [
      BG('sky'),
      ...sun(62, 60, 26),
      S(rect(0, 340, 400, 60), 'tan'),
      S('M300 400Q316 334 360 330Q396 330 400 350V400Z', 'brown'),
      S(rect(46, 290, 220, 56, 28), 'black'),
      S(circle(78, 318, 16), 'gray'),
      S(circle(124, 318, 16), 'gray'),
      S(circle(170, 318, 16), 'gray'),
      S(circle(216, 318, 16), 'gray'),
      S('M206 232L284 106Q292 94 306 98L314 102Q324 110 318 122L236 252Z', 'yellow'),
      S('M290 112L348 214L330 226L276 128Z', 'yellow'),
      S('M318 214L380 194Q396 232 374 264Q336 270 318 214Z', 'gray'),
      S(rect(56, 218, 176, 74, 12), 'yellow'),
      S('M140 218V138Q140 124 154 124H206Q220 124 220 138V218Z', 'yellow'),
      S(rect(154, 138, 52, 56, 8), 'sky'),
      S(rect(56, 246, 176, 14), 'black'),
      S(rect(70, 192, 14, 28, 4), 'gray'),
    ],
  },

  // ======================= Dinosaurs =======================
  {
    id: 'trex', name: 'T-Rex', cat: 'dinos',
    shapes: [
      BG('sky'),
      ...sun(62, 60, 28),
      S(cloud(330, 300, 44, 20, 7), 'white'),
      GRASS,
      S('M150 246Q84 250 22 322Q104 316 168 296Z', 'green'),
      S('M206 280Q214 330 206 362H246Q254 326 246 280Z', 'green'),
      S('M124 268Q116 330 124 362H166Q168 322 180 292Z', 'green'),
      S(ellipse(144, 362, 32, 13), 'green'),
      S(ellipse(228, 362, 32, 13), 'green'),
      S(ellipse(184, 240, 80, 74, -25), 'green'),
      S(ellipse(204, 258, 38, 54, -25), 'yellow'),
      S(circle(130, 214, 13), 'dkgreen'),
      S(circle(150, 178, 9), 'dkgreen'),
      S(circle(118, 260, 9), 'dkgreen'),
      S(ellipse(254, 220, 24, 10, 40), 'green'),
      S('M196 168Q184 96 250 90H318Q364 92 364 130Q364 170 322 174H262Q226 190 196 168Z', 'green'),
      S(poly(282, 158, 298, 159, 290, 172), 'white'),
      S(poly(312, 157, 328, 155, 321, 169), 'white'),
      D('M262 152Q306 166 350 148'),
      ...eye(272, 118, 10),
      I(ellipse(342, 110, 4, 3)),
      S(circle(246, 146, 10), 'pink'),
    ],
  },
  {
    id: 'stego', name: 'Stegosaurus', cat: 'dinos',
    shapes: [
      BG('sky'),
      S(cloud(318, 132, 34, 18, 7), 'gray'),
      S('M238 330L296 186H344L400 300V330Z', 'brown'),
      S('M296 186Q306 204 316 192Q326 206 334 192L344 186Z', 'orange'),
      GRASS,
      S(leaf(112, 222, 22, 46, -58), 'yellow'),
      S(leaf(148, 190, 24, 54, -30), 'yellow'),
      S(leaf(198, 176, 26, 60, 0), 'yellow'),
      S(leaf(248, 186, 24, 54, 28), 'yellow'),
      S(leaf(286, 214, 22, 46, 55), 'yellow'),
      S('M290 240Q352 248 384 200Q392 262 300 294Z', 'purple'),
      S(poly(340, 248, 352, 212, 364, 242), 'white'),
      S(poly(362, 236, 382, 206, 382, 232), 'white'),
      S(rect(146, 270, 32, 70, 12), 'purple'),
      S(rect(232, 270, 32, 70, 12), 'purple'),
      S('M76 272Q80 172 200 168Q318 172 320 272Q200 300 76 272Z', 'purple'),
      S(circle(156, 222, 15), 'pink'),
      S(circle(208, 198, 11), 'pink'),
      S(circle(254, 234, 17), 'pink'),
      S(rect(104, 276, 38, 80, 14), 'purple'),
      S(rect(266, 276, 38, 80, 14), 'purple'),
      S('M108 226Q56 208 28 238Q8 264 34 284Q72 298 116 276Z', 'purple'),
      ...eye(52, 250, 8),
      D('M24 270Q38 282 56 276'),
      S(circle(78, 272, 9), 'pink'),
    ],
  },
  {
    id: 'tricera', name: 'Triceratops', cat: 'dinos',
    shapes: [
      BG('sky'),
      ...sun(336, 62, 28),
      S(cloud(200, 56, 44, 20, 7), 'white'),
      GRASS,
      S(cloud(360, 300, 44, 30, 7), 'dkgreen'),
      S('M310 236Q366 236 390 290Q346 294 300 282Z', 'orange'),
      S(rect(218, 280, 32, 62, 12), 'orange'),
      S(rect(322, 274, 32, 62, 12), 'orange'),
      S(ellipse(250, 250, 100, 62), 'orange'),
      S(circle(214, 230, 14), 'red'),
      S(circle(270, 214, 10), 'red'),
      S(circle(300, 252, 13), 'red'),
      S(rect(170, 280, 38, 74, 14), 'orange'),
      S(rect(276, 280, 38, 74, 14), 'orange'),
      S(cloud(160, 182, 72, 72, 10), 'yellow'),
      S('M120 146L96 74Q128 102 146 144Z', 'white'),
      S('M164 144L168 70Q188 104 186 150Z', 'white'),
      S('M176 196Q178 148 128 146Q72 146 56 196Q46 244 92 258Q150 266 168 236Z', 'orange'),
      S('M62 190L36 160Q46 186 48 206Z', 'white'),
      S('M58 200Q28 210 32 238Q48 246 66 234Z', 'tan'),
      ...eye(110, 196, 9),
      D('M66 234Q90 248 114 238'),
      S(circle(136, 226, 10), 'pink'),
    ],
  },
  {
    id: 'longneck', name: 'Long Neck', cat: 'dinos',
    shapes: [
      BG('sky'),
      S(cloud(90, 62, 46, 20, 7), 'white'),
      GRASS,
      S(rect(334, 140, 28, 200, 8), 'brown'),
      S(cloud(352, 100, 54, 56, 9), 'dkgreen'),
      S('M106 266Q50 270 16 324Q84 318 120 300Z', 'blue'),
      S(rect(134, 280, 30, 64, 12), 'blue'),
      S(rect(178, 280, 30, 64, 12), 'blue'),
      S('M196 262Q206 176 236 120Q246 100 262 104L276 116Q264 132 258 144Q238 198 250 270Z', 'blue'),
      S(ellipse(166, 272, 90, 54), 'blue'),
      S(circle(130, 254, 14), 'sky'),
      S(circle(176, 238, 11), 'sky'),
      S(circle(210, 268, 15), 'sky'),
      S(rect(84, 284, 36, 74, 14), 'blue'),
      S(rect(214, 284, 36, 74, 14), 'blue'),
      S(ellipse(270, 106, 36, 24, -8), 'blue'),
      S(leaf(300, 112, 9, 30, 70), 'green'),
      ...eye(268, 98, 7),
      D('M282 118Q292 120 300 112'),
      I(ellipse(296, 96, 3, 2.5)),
      S(circle(254, 116, 7), 'pink'),
    ],
  },
  {
    id: 'ptero', name: 'Pterodactyl', cat: 'dinos',
    shapes: [
      BG('sky'),
      ...sun(62, 60, 28),
      S(cloud(330, 60, 46, 20, 7), 'white'),
      S(cloud(90, 330, 60, 26, 8), 'white'),
      S(cloud(320, 340, 54, 24, 8), 'white'),
      S('M186 200Q130 128 22 140Q56 176 60 226Q90 206 120 216Q140 200 186 236Z', 'purple'),
      S('M214 200Q270 128 378 140Q344 176 340 226Q310 206 280 216Q260 200 214 236Z', 'purple'),
      D('M60 226Q100 180 150 186M340 226Q300 180 250 186', 4),
      S(ellipse(184, 288, 12, 8), 'orange'),
      S(ellipse(216, 288, 12, 8), 'orange'),
      S(ellipse(200, 226, 32, 58), 'pink'),
      S(ellipse(200, 240, 18, 36), 'tan'),
      S('M200 128Q206 82 246 64Q238 106 224 136Z', 'orange'),
      S('M222 150L292 160L222 174Z', 'yellow'),
      S(circle(200, 154, 34), 'pink'),
      ...eye(204, 148, 8),
      D('M218 170Q226 174 232 168'),
      S(circle(184, 168, 7), 'pink'),
    ],
  },
  {
    id: 'babydino', name: 'Baby Dino', cat: 'dinos',
    shapes: [
      BG('sky'),
      ...sun(336, 62, 28),
      S(cloud(70, 70, 44, 20, 7), 'white'),
      GRASS,
      S(ellipse(200, 352, 160, 34), 'brown'),
      D('M64 346Q120 362 170 352M230 356Q290 364 338 346', 4),
      S(ellipse(200, 250, 70, 60), 'green'),
      S(circle(200, 170, 64), 'green'),
      S('M146 136L162 116L180 132L200 108L220 132L238 116L254 136Q246 92 200 90Q154 92 146 136Z', 'white'),
      ...eye(178, 172, 9),
      ...eye(222, 172, 9),
      D('M186 198Q200 210 214 198'),
      S(circle(158, 196, 10), 'pink'),
      S(circle(242, 196, 10), 'pink'),
      S('M108 262Q106 360 200 362Q294 360 292 262L270 244L248 268L224 242L200 268L176 242L152 268L130 244Z', 'white'),
      S(circle(160, 318, 13), 'sky'),
      S(circle(236, 330, 11), 'sky'),
      S(circle(262, 292, 9), 'sky'),
      S(ellipse(140, 254, 20, 13, -20), 'green'),
      S(ellipse(260, 254, 20, 13, 20), 'green'),
    ],
  },
  // ======================= Ocean =======================
  {
    id: 'octopus', name: 'Octopus', cat: 'ocean',
    shapes: [
      BG('sky'),
      S('M40 400Q16 340 48 296Q68 342 60 400Z', 'green'),
      S('M356 400Q336 330 368 286Q390 336 376 400Z', 'green'),
      S('M0 356Q100 336 200 352T400 346V400H0Z', 'tan'),
      S(tube([[136, 220], [100, 262], [84, 306], [100, 334], [122, 326]], [24, 18, 14, 11, 9]), 'purple'),
      S(tube([[264, 220], [300, 262], [316, 306], [300, 334], [278, 326]], [24, 18, 14, 11, 9]), 'purple'),
      S(tube([[170, 236], [150, 286], [154, 326], [176, 344], [192, 332]], [22, 17, 13, 10, 8]), 'purple'),
      S(tube([[230, 236], [250, 286], [246, 326], [224, 344], [208, 332]], [22, 17, 13, 10, 8]), 'purple'),
      S('M108 200Q102 84 200 80Q298 84 292 200Q290 250 200 252Q110 250 108 200Z', 'purple'),
      S(circle(150, 128, 14), 'pink'),
      S(circle(246, 112, 10), 'pink'),
      S(circle(262, 150, 13), 'pink'),
      ...eye(170, 182, 12),
      ...eye(230, 182, 12),
      D('M176 216Q200 234 224 216'),
      S(circle(144, 212, 12), 'pink'),
      S(circle(256, 212, 12), 'pink'),
      S(circle(330, 140, 14), 'white'),
      S(circle(352, 98, 10), 'white'),
      S(circle(338, 62, 7), 'white'),
      S(circle(60, 110, 10), 'white'),
      S(circle(76, 74, 7), 'white'),
    ],
  },
  {
    id: 'crab', name: 'Crab', cat: 'ocean',
    shapes: [
      BG('sky'),
      S(circle(64, 70, 12), 'white'),
      S(circle(84, 40, 8), 'white'),
      S(circle(338, 64, 10), 'white'),
      S('M0 300Q100 280 200 296T400 290V400H0Z', 'tan'),
      S(tube([[136, 262], [86, 272], [64, 304]], 9), 'red'),
      S(tube([[140, 282], [96, 300], [84, 334]], 9), 'red'),
      S(tube([[264, 262], [314, 272], [336, 304]], 9), 'red'),
      S(tube([[260, 282], [304, 300], [316, 334]], 9), 'red'),
      S(tube([[146, 236], [112, 206], [104, 172]], 11), 'red'),
      S(tube([[254, 236], [288, 206], [296, 172]], 11), 'red'),
      S('M104 178Q58 170 56 124Q56 90 86 84L104 116L122 98Q140 140 104 178Z', 'red'),
      S('M296 178Q342 170 344 124Q344 90 314 84L296 116L278 98Q260 140 296 178Z', 'red'),
      D('M182 214V174M218 214V174', 7),
      S(ellipse(200, 262, 96, 62), 'red'),
      S(circle(182, 160, 20), 'white'),
      S(circle(218, 160, 20), 'white'),
      ...eye(184, 164, 9),
      ...eye(216, 164, 9),
      D('M176 266Q200 288 224 266'),
      S(circle(150, 262, 12), 'pink'),
      S(circle(250, 262, 12), 'pink'),
      S(star(70, 362, 22, 10), 'orange'),
      S('M318 376Q318 336 346 334Q374 336 374 376Z', 'pink'),
      D('M346 338V374M330 344L338 374M362 344L354 374', 3),
    ],
  },
  {
    id: 'seahorse', name: 'Seahorse', cat: 'ocean',
    shapes: [
      BG('sky'),
      S('M70 400Q42 330 76 270Q102 330 92 400Z', 'green'),
      S('M330 400Q306 340 336 290Q360 340 352 400Z', 'dkgreen'),
      S('M0 362Q100 340 200 358T400 352V400H0Z', 'tan'),
      S(leaf(256, 196, 22, 56, 75), 'orange'),
      S(tube([[202, 118], [222, 168], [208, 228], [222, 278], [246, 312], [236, 346], [208, 354], [190, 336], [198, 318], [214, 322]],
        [34, 28, 44, 32, 24, 18, 14, 11, 9, 8]), 'yellow'),
      S(leaf(214, 72, 10, 26, -20), 'orange'),
      S(leaf(234, 82, 9, 22, 20), 'orange'),
      S(tube([[176, 116], [118, 118]], 13), 'yellow'),
      S(circle(204, 108, 40), 'yellow'),
      ...eye(206, 100, 9),
      D('M126 118Q132 124 140 120'),
      S(circle(186, 128, 9), 'pink'),
      D('M182 188Q198 194 214 188M176 212Q194 218 212 212M180 236Q198 242 216 236M186 260Q202 266 218 260', 4),
      S(circle(110, 220, 13), 'white'),
      S(circle(90, 180, 9), 'white'),
      S(circle(102, 148, 6), 'white'),
      S(circle(320, 120, 12), 'white'),
      S(circle(344, 86, 8), 'white'),
    ],
  },
  {
    id: 'jelly', name: 'Jellyfish', cat: 'ocean',
    shapes: [
      BG('sky'),
      S('M0 366Q100 346 200 362T400 356V400H0Z', 'tan'),
      S(tube([[130, 200], [116, 240], [138, 280], [122, 320]], 10), 'purple'),
      S(tube([[176, 206], [166, 250], [186, 290], [172, 336]], 10), 'purple'),
      S(tube([[224, 206], [234, 250], [214, 290], [228, 336]], 10), 'purple'),
      S(tube([[270, 200], [284, 240], [262, 280], [278, 320]], 10), 'purple'),
      S('M86 196Q86 72 200 70Q314 72 314 196Q296 214 276 198Q258 214 238 198Q220 214 200 198Q180 214 162 198Q142 214 124 198Q104 214 86 196Z', 'pink'),
      S(ellipse(136, 120, 16, 22, 30), 'white'),
      S(circle(262, 108, 10), 'white'),
      ...eye(172, 150, 11),
      ...eye(228, 150, 11),
      D('M182 180Q200 194 218 180'),
      S(circle(144, 174, 11), 'pink'),
      S(circle(256, 174, 11), 'pink'),
      S('M300 300Q330 270 360 290L384 272V318L360 302Q330 324 300 300Z', 'yellow'),
      I(circle(320, 294, 4)),
      S(circle(60, 90, 12), 'white'),
      S(circle(46, 50, 8), 'white'),
      S(circle(350, 60, 10), 'white'),
    ],
  },
  {
    id: 'shark', name: 'Shark', cat: 'ocean',
    shapes: [
      BG('sky'),
      S('M0 362Q100 340 200 358T400 352V400H0Z', 'tan'),
      S('M60 400Q36 340 66 300Q88 340 80 400Z', 'green'),
      S('M76 196L18 132Q34 186 30 200Q34 214 18 266Z', 'gray'),
      S('M160 152Q178 98 228 74Q222 120 236 146Z', 'gray'),
      S('M44 200Q64 150 152 140Q262 130 340 178Q372 196 370 212Q342 252 240 256Q120 260 44 200Z', 'gray'),
      S('M108 226Q220 262 356 216Q332 250 240 256Q164 258 108 226Z', 'white'),
      S('M190 236Q186 284 150 306Q210 300 240 244Z', 'gray'),
      D('M262 188Q256 202 262 216M276 186Q270 200 276 214', 4),
      ...eye(306, 178, 9),
      D('M306 214Q328 222 350 206'),
      S(circle(296, 204, 9), 'pink'),
      S(circle(360, 120, 12), 'white'),
      S(circle(340, 86, 8), 'white'),
      S(cloud(300, 340, 34, 14, 6), 'dkgreen'),
    ],
  },
  {
    id: 'starfish', name: 'Starfish', cat: 'ocean',
    shapes: [
      BG('sky'),
      S('M0 286Q100 266 200 282T400 276V400H0Z', 'tan'),
      S('M30 290Q10 230 40 190Q60 236 50 290Z', 'green'),
      S(star(200, 216, 150, 74, 5, -90), 'orange'),
      S(circle(200, 112, 12), 'yellow'),
      S(circle(108, 186, 11), 'yellow'),
      S(circle(292, 186, 11), 'yellow'),
      S(circle(142, 300, 11), 'yellow'),
      S(circle(258, 300, 11), 'yellow'),
      ...eye(178, 208, 10),
      ...eye(222, 208, 10),
      D('M182 238Q200 254 218 238'),
      S(circle(156, 236, 10), 'pink'),
      S(circle(244, 236, 10), 'pink'),
      S('M318 372Q318 330 348 328Q378 330 378 372Z', 'pink'),
      D('M348 332V370M332 340L340 370M364 340L356 370', 3),
      S(circle(340, 80, 12), 'white'),
      S(circle(360, 46, 8), 'white'),
      S(circle(70, 70, 10), 'white'),
    ],
  },
//@@NEW@@
];
