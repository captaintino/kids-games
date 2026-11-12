// Build a Monster: every part, drawn as SVG in the house style (bold shapes,
// thick ink outlines), and monsterSVG() that puts a whole monster together.
//
// The monster stands on the ground at y = 450 of a 400-wide sheet. Legs hang from
// the hips, the body sits on the legs, the head sits on the body's neck point.
import { circle, ellipse, rect, star, cloud } from '../../shared/js/pictures.js';

export const INK = '#2d2442';
const SW = 7;
const S = (w = SW) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const path = (d, fill, w = SW) => `<path d="${d}" fill="${fill}" ${S(w)}/>`;
const dot = (x, y, r, fill, w = SW) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${w ? ' ' + S(w) : ''}/>`;
const line = (d, w = 6, color = INK) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const rope = (d, color, w) => line(d, w + 13) + line(d, w, color);
const heartD = (x, y, s) => `M${x} ${y + s * 0.9}C${x - s * 1.5} ${y - s * 0.1} ${x - s * 0.9} ${y - s * 1.25} ${x} ${y - s * 0.45}` +
  `C${x + s * 0.9} ${y - s * 1.25} ${x + s * 1.5} ${y - s * 0.1} ${x} ${y + s * 0.9}Z`;
const glint = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`;
const mirror = (s) => `<g transform="scale(-1,1)">${s}</g>`;
const HORN = '#fff1c9';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
export const COLORS = [
  '#ff4d5e', '#ff9a2e', '#ffd93b', '#9be15d', '#3ccf6e', '#2fc6b0', '#8fdcff', '#3d7bff',
  '#9d5cff', '#ff7ac6', '#ffb3d1', '#a7663c', '#b3b9c6', '#4a4560',
];
function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(hex, to, k) {
  const a = rgb(hex);
  const b = rgb(to);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * k));
  return '#' + c.map((v) => (v < 16 ? '0' : '') + v.toString(16)).join('');
}
function lum(hex) {
  const c = rgb(hex);
  return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
}
// a second shade of a color for patterns and bellies
export const shade = (hex) => (lum(hex) > 0.62 ? mix(hex, '#2d2442', 0.2) : mix(hex, '#ffffff', 0.4));
const belly = (hex) => mix(hex, '#ffffff', lum(hex) > 0.75 ? 0.6 : 0.42);

// ---------------------------------------------------------------------------
// Patterns (clipped to the body and head)
// ---------------------------------------------------------------------------
export const PATTERNS = [
  { key: 'none', name: 'Plain' },
  { key: 'spots', name: 'Spots' },
  { key: 'stripes', name: 'Stripes' },
  { key: 'stars', name: 'Stars' },
  { key: 'hearts', name: 'Hearts' },
];
const SPOTS = [[-52, -44, 17], [30, -64, 12], [62, 8, 19], [-18, 26, 14], [-72, 40, 11], [22, 74, 16], [74, 72, 10],
  [-40, -88, 10], [2, -18, 9], [84, -40, 12], [-86, -8, 13], [-34, 80, 12], [50, -30, 8]];
function patternShapes(kind, color) {
  let s = '';
  if (kind === 'spots') SPOTS.forEach(([x, y, r]) => { s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`; });
  if (kind === 'stripes') {
    for (let y = -130; y <= 130; y += 42) s += `<path d="M-150 ${y}Q-75 ${y - 14} 0 ${y}T150 ${y}V${y + 17}Q75 ${y + 31} 0 ${y + 17}T-150 ${y + 17}Z" fill="${color}"/>`;
  }
  if (kind === 'stars' || kind === 'hearts') {
    let row = 0;
    for (let y = -120; y <= 130; y += 48, row++) {
      for (let x = -140 + (row % 2) * 28; x <= 140; x += 56) {
        s += kind === 'stars'
          ? `<path d="${star(x, y, 13, 6)}" fill="${color}"/>`
          : `<path d="${heartD(x, y, 10)}" fill="${color}"/>`;
      }
    }
  }
  return s;
}

// ---------------------------------------------------------------------------
// Bodies: centered on (0, 0)
//   hipY: where the legs start; hipW: half the hip width; neckY: head center;
//   sh: right shoulder; belly: [cx, cy, rx, ry]
// ---------------------------------------------------------------------------
export const BODIES = [
  { name: 'Round', d: circle(0, 0, 95), hipY: 74, hipW: 52, neckY: -100, sh: [84, -18], belly: [0, 26, 56, 50] },
  { name: 'Egg', d: ellipse(0, 0, 80, 108), hipY: 94, hipW: 44, neckY: -118, sh: [72, -30], belly: [0, 30, 46, 58] },
  { name: 'Pear', d: 'M0 -88C52 -88 66 -36 86 22C106 84 64 98 0 98C-64 98 -106 84 -86 22C-66 -36 -52 -88 0 -88Z', hipY: 86, hipW: 58, neckY: -94, sh: [62, -30], belly: [0, 38, 54, 46] },
  { name: 'Boxy', d: rect(-92, -84, 184, 168, 44), hipY: 76, hipW: 60, neckY: -98, sh: [88, -30], belly: [0, 20, 58, 46] },
  { name: 'Fluffy', d: cloud(0, 0, 84, 78, 11), hipY: 82, hipW: 52, neckY: -102, sh: [92, -14], belly: [0, 24, 48, 42] },
  { name: 'Bean', d: 'M-70 -82Q0 -108 70 -82Q112 -44 88 26Q102 94 0 96Q-102 94 -88 26Q-112 -44 -70 -82Z', hipY: 86, hipW: 56, neckY: -102, sh: [88, -30], belly: [0, 26, 52, 50] },
  { name: 'Gumdrop', d: 'M0 -96Q34 -96 60 0Q84 88 64 94Q0 104 -64 94Q-84 88 -60 0Q-34 -96 0 -96Z', hipY: 88, hipW: 52, neckY: -98, sh: [52, -20], belly: [0, 40, 42, 44] },
];

// ---------------------------------------------------------------------------
// Heads: centered on (0, 0). back = drawn behind the head shape, front = on top.
// ---------------------------------------------------------------------------
export const HEADS = [
  {
    name: 'Horns', d: ellipse(0, 0, 92, 76), eyeY: -14, mouthY: 34, top: -128,
    back: () => {
      const horn = path('M-52 -48Q-72 -100 -94 -128Q-46 -118 -22 -62Z', HORN) + line('M-64 -84L-40 -96M-56 -64L-34 -76', 5);
      return horn + mirror(horn);
    },
  },
  {
    name: 'Antennae', d: rect(-88, -74, 176, 148, 62), eyeY: -10, mouthY: 36, top: -158,
    back: (c) => {
      const a = rope('M-30 -66Q-36 -110 -54 -134', c.head, 6) + dot(-56, -140, 16, c.extra) + glint(-61, -145, 5);
      return a + mirror(a);
    },
  },
  {
    name: 'Kitty', d: circle(0, 0, 84), eyeY: -8, mouthY: 36, top: -128,
    back: (c) => {
      const e = path('M-78 -30L-72 -124L-12 -80Z', c.head) + `<path d="M-64 -52L-62 -102L-30 -78Z" fill="${c.extra}"/>`;
      return e + mirror(e);
    },
  },
  {
    name: 'Teddy', d: circle(0, 0, 84), eyeY: -10, mouthY: 34, top: -100,
    back: (c) => {
      const e = dot(-62, -62, 32, c.head) + dot(-62, -62, 15, c.extra, 0);
      return e + mirror(e);
    },
  },
  {
    name: 'Spiky', d: circle(0, 0, 86), eyeY: -8, mouthY: 36, top: -134,
    back: (c) => path('M-76 -40L-84 -98L-42 -76L-28 -130L4 -86L30 -132L44 -78L86 -100L78 -40Z', c.extra),
  },
  {
    name: 'Unicorn', d: ellipse(0, 4, 82, 84), eyeY: -6, mouthY: 40, top: -164,
    back: () => path('M-20 -70L0 -162L20 -70Z', '#ffd93b') + line('M-14 -94L12 -102M-10 -118L8 -124M-6 -140L5 -144', 5),
  },
  {
    name: 'Shaggy', d: cloud(0, 0, 82, 74, 12), eyeY: -8, mouthY: 36, top: -124,
    front: (c) => path('M-34 -78Q-40 -112 -6 -112Q-22 -96 -4 -86Q4 -124 34 -112Q14 -102 22 -86Q50 -104 54 -78Q20 -66 -34 -78Z', c.extra, 6),
  },
  {
    name: 'Froggy', d: ellipse(0, 12, 98, 70), eyeY: -46, mouthY: 40, top: -96,
    back: (c) => dot(-48, -46, 38, c.head) + dot(48, -46, 38, c.head),
  },
];

// ---------------------------------------------------------------------------
// Eyes: centered on (0, 0). Pupils are their own group so they can roll.
// ---------------------------------------------------------------------------
const white = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${S(6)}/>`;
const pupil = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>` + glint(x - r * 0.35, y - r * 0.4, r * 0.38);
export const EYES = [
  { name: 'Two eyes', top: -28, draw: () => ({ whites: white(-32, 0, 25) + white(32, 0, 25), pupils: pupil(-29, 3, 12) + pupil(35, 3, 12) }) },
  {
    name: 'One big eye', top: -44,
    draw: (c) => ({ whites: white(0, -2, 41), pupils: `<circle cx="2" cy="2" r="21" fill="${c.extra}" ${S(4)}/>` + pupil(2, 2, 11) + glint(-9, -8, 5) }),
  },
  { name: 'Three eyes', top: -38, draw: () => ({ whites: white(-50, 6, 18) + white(0, -12, 22) + white(50, 6, 18), pupils: pupil(-48, 9, 8.5) + pupil(2, -9, 10.5) + pupil(52, 9, 8.5) }) },
  { name: 'Googly eyes', top: -36, draw: () => ({ whites: white(-30, 0, 29) + white(38, -6, 21), pupils: pupil(-21, 11, 13) + pupil(45, 4, 10) }) },
  {
    name: 'Sleepy eyes', top: -28,
    draw: (c) => {
      const lid = (x) => `<path d="M${x - 25} 1A25 25 0 0 1 ${x + 25} 1Z" fill="${c.head}" ${S(6)}/>` +
        line(`M${x - 18} 12L${x - 23} 19M${x} 15V22M${x + 18} 12L${x + 23} 19`, 4);
      return { whites: white(-32, 0, 25) + white(32, 0, 25), pupils: pupil(-31, 9, 11) + pupil(33, 9, 11), lids: lid(-32) + lid(32) };
    },
  },
  {
    name: 'Star eyes', top: -28,
    draw: () => ({
      whites: white(-32, 0, 26) + white(32, 0, 26),
      pupils: `<path d="${star(-32, 2, 17, 8)}" fill="#ffc21f" ${S(4)}/><path d="${star(32, 2, 17, 8)}" fill="#ffc21f" ${S(4)}/>`,
    }),
  },
  {
    name: 'Heart eyes', top: -28,
    draw: () => ({
      whites: white(-32, 0, 26) + white(32, 0, 26),
      pupils: `<path d="${heartD(-32, 2, 12)}" fill="#ff4d8d" ${S(4)}/><path d="${heartD(32, 2, 12)}" fill="#ff4d8d" ${S(4)}/>`,
    }),
  },
  {
    name: 'Stalk eyes', top: -118,
    draw: (c) => ({
      whites: rope('M-14 4Q-26 -50 -42 -88', c.head, 9) + rope('M14 4Q26 -50 42 -88', c.head, 9) + white(-44, -94, 23) + white(44, -94, 23),
      pupils: pupil(-42, -92, 10.5) + pupil(46, -92, 10.5),
    }),
  },
];

// ---------------------------------------------------------------------------
// Mouths: centered on (0, 0)
// ---------------------------------------------------------------------------
const DARK = '#5a1d3e';
const TONGUE = '#ff6f9d';
export const MOUTHS = [
  {
    name: 'Big grin',
    svg: path('M-46 -6Q0 6 46 -6Q42 48 0 50Q-42 48 -46 -6Z', DARK, 6) +
      `<path d="M-38 -2Q0 8 38 -2L34 10Q0 18 -34 10Z" fill="#fff"/>` + `<path d="M-20 40Q0 22 20 40Q0 52 -20 40Z" fill="${TONGUE}"/>` +
      path('M-46 -6Q0 6 46 -6Q42 48 0 50Q-42 48 -46 -6Z', 'none', 6),
  },
  { name: 'Fangs', svg: path('M-22 6L-15 30L-8 9Z', '#fff', 4) + path('M22 6L15 30L8 9Z', '#fff', 4) + line('M-42 -4Q0 30 42 -4', 6) },
  { name: 'Tongue out', svg: path('M2 8Q4 46 22 44Q38 40 30 4Z', TONGUE, 5) + line('M16 14L18 34', 3.5) + line('M-40 -4Q0 30 40 -4', 6) },
  { name: 'Oooh', svg: path(ellipse(0, 8, 19, 24), DARK, 6) + `<ellipse cx="0" cy="20" rx="11" ry="7" fill="${TONGUE}"/>` },
  {
    name: 'Sharp teeth',
    svg: path('M-50 -8Q0 12 50 -8Q46 42 0 44Q-46 42 -50 -8Z', DARK, 6) +
      `<path d="M-44 -2L-36 14L-26 2L-16 16L-6 4L4 16L14 4L24 16L34 2L44 -2Q0 14 -44 -2Z" fill="#fff"/>` +
      `<path d="M-22 40L-14 28L-6 41L4 28L12 41L20 30L26 39Q0 46 -22 40Z" fill="#fff"/>` +
      path('M-50 -8Q0 12 50 -8Q46 42 0 44Q-46 42 -50 -8Z', 'none', 6),
  },
  { name: 'Buck teeth', svg: path(rect(-15, 8, 14, 18, 3), '#fff', 4) + path(rect(1, 8, 14, 18, 3), '#fff', 4) + line('M-38 -2Q0 28 38 -2', 6) },
  { name: 'Kitty mouth', svg: line('M-32 0Q-16 20 0 3Q16 20 32 0', 6) + line('M-6 -10H6L0 -3Z', 5) },
  { name: 'Wiggly', svg: line('M-46 4Q-35 -9 -23 4T0 4T23 4T46 4', 6) + `<circle cx="-50" cy="10" r="7" fill="#ff7aa8" opacity=".6"/><circle cx="50" cy="10" r="7" fill="#ff7aa8" opacity=".6"/>` },
];

// ---------------------------------------------------------------------------
// Legs: each leg hangs from (0, 0). xs = where they go, as a share of hipW.
// ---------------------------------------------------------------------------
export const LEGS = [
  {
    name: 'Stubby legs', L: 54, xs: [-0.62, 0.62],
    draw: (c, i) => path(rect(-21, -16, 42, 58, 17), c.legs) + path(ellipse(i ? 6 : -6, 44, 30, 15), c.legs) +
      line(`M${i ? 18 : -18} 36V48M${i ? 6 : -6} 38V50`, 4),
  },
  {
    name: 'Long legs', L: 102, xs: [-0.5, 0.5],
    draw: (c, i) => {
      const shoe = path('M-22 80Q-26 104 4 104H38Q48 104 42 90Q34 78 10 78Z', c.extra) + line('M-20 96H44', 4);
      return rope('M0 -14L0 84', c.legs, 16) + (i ? shoe : mirror(shoe));
    },
  },
  {
    name: 'Four feet', L: 48, xs: [-0.95, -0.33, 0.33, 0.95],
    draw: (c) => path(rect(-15, -14, 30, 50, 12), c.legs) + path(ellipse(0, 40, 21, 12), c.legs),
  },
  {
    name: 'Tentacles', L: 72, xs: [-0.85, -0.42, 0, 0.42, 0.85],
    draw: (c, i) => {
      const t = path('M-14 -14Q-18 30 -6 50Q6 72 26 62Q10 60 7 46Q8 20 14 -14Z', c.legs, 6) +
        `<circle cx="-4" cy="20" r="4" fill="${shade(c.legs)}"/><circle cx="1" cy="40" r="3.5" fill="${shade(c.legs)}"/>`;
      return i ? t : mirror(t);
    },
  },
  {
    name: 'Bird legs', L: 86, xs: [-0.45, 0.45],
    draw: () => rope('M0 -10L0 72', '#ffb03b', 8) + rope('M0 72L-24 88M0 72L0 92M0 72L24 88', '#ffb03b', 6),
  },
  {
    name: 'Wheel', L: 92, xs: [0],
    draw: (c) => path(rect(-14, -16, 28, 52, 10), c.legs) +
      dot(0, 52, 40, '#4a4560') + `<circle cx="0" cy="52" r="26" fill="none" stroke="#8a84a6" stroke-width="5"/>` +
      line('M0 30V74M-22 52H22M-16 36L16 68M16 36L-16 68', 4, '#b3b9c6') + dot(0, 52, 11, c.extra, 5),
  },
  {
    name: 'Springs', L: 92, xs: [-0.45, 0.45],
    draw: (c) => path(rect(-14, -16, 28, 26, 10), c.legs) +
      line('M0 8L-16 18L16 30L-16 42L16 54L-16 66L0 74', 13) + line('M0 8L-16 18L16 30L-16 42L16 54L-16 66L0 74', 6, '#d6dbe6') +
      path(ellipse(0, 80, 28, 11), c.extra),
  },
];

// ---------------------------------------------------------------------------
// Arms: the right arm from the shoulder at (0, 0); the left one is a mirror.
// ---------------------------------------------------------------------------
const stubArm = (c) => rope('M-4 0Q30 10 50 34', c.arms, 22) + dot(54, 40, 17, c.arms);
export const ARMS = [
  { name: 'No arms', draw: () => '' },
  { name: 'Stubby arms', draw: stubArm },
  {
    name: 'Noodle arms',
    draw: (c) => rope('M-4 0Q52 -12 60 28Q66 62 94 58', c.arms, 13) + path(ellipse(102, 56, 17, 14), c.arms) + path(ellipse(96, 42, 6, 9, -20), c.arms, 5),
  },
  {
    name: 'Claws',
    draw: (c) => rope('M-4 0Q36 18 50 40', c.arms, 18) +
      path('M44 34Q58 -4 94 16Q72 22 64 40Z', c.arms) + path('M50 48Q78 70 100 42Q76 46 64 40Z', c.arms),
  },
  {
    name: 'Tentacle arms',
    draw: (c) => path('M-6 -14Q66 -22 80 22Q88 56 62 58Q46 56 54 42Q68 36 58 16Q42 6 -6 16Z', c.arms, 6) +
      `<circle cx="42" cy="2" r="4" fill="${shade(c.arms)}"/><circle cx="64" cy="18" r="4" fill="${shade(c.arms)}"/>`,
  },
  {
    name: 'Tiny arms',
    draw: (c) => rope('M-4 0Q14 12 30 10', c.arms, 13) + line('M32 6L42 2M34 12L44 14', 5),
  },
  {
    name: 'Strong arms',
    draw: (c) => rope('M-4 4L46 20', c.arms, 24) + rope('M46 20L60 -16', c.arms, 20) +
      path(ellipse(24, 2, 18, 13, 15), c.arms, 6) + dot(62, -26, 16, c.arms),
  },
  {
    name: 'Four arms',
    draw: (c) => `<g transform="translate(-8 44) scale(.8)">${stubArm(c)}</g>` + stubArm(c),
  },
];

// ---------------------------------------------------------------------------
// Extras: wings, tails and more. Centered on the body. front: drawn over the body.
// ---------------------------------------------------------------------------
export const EXTRAS = [
  { name: 'Nothing', draw: () => '' },
  {
    name: 'Bat wings',
    draw: (c) => {
      const w = path('M-56 -44Q-132 -128 -192 -66Q-162 -64 -160 -32Q-128 -42 -124 -6Q-100 -24 -76 2Z', c.extra) +
        line('M-70 -40Q-120 -70 -160 -32M-74 -26Q-104 -36 -124 -6', 4);
      return w + mirror(w);
    },
  },
  {
    name: 'Fairy wings',
    draw: () => {
      const w = path(ellipse(-96, -64, 62, 38, -32), 'rgba(190,234,255,.75)', 6) + path(ellipse(-88, 4, 42, 26, 24), 'rgba(255,190,240,.75)', 6) +
        `<path d="${star(-104, -70, 9, 3.5)}" fill="#fff"/>`;
      return w + mirror(w);
    },
  },
  {
    name: 'Dino tail',
    draw: (c) => path('M86 64L106 30L114 56L140 22L142 50L170 18L164 56Z', c.extra, 6) +
      path('M50 40Q130 76 184 6Q172 88 60 92Z', c.body),
  },
  {
    name: 'Curly tail',
    draw: (c) => rope('M40 70Q120 96 134 40Q142 -4 112 4Q96 12 112 26', c.body, 11) + path('M100 14L130 -6L128 24Z', c.extra, 6),
  },
  {
    name: 'Back spikes',
    draw: (c) => {
      let s = '';
      for (let a = -160; a <= -20; a += 28) {
        const r = (a * Math.PI) / 180;
        const x = Math.cos(r) * 82;
        const y = Math.sin(r) * 82;
        const ox = Math.cos(r) * 132;
        const oy = Math.sin(r) * 132;
        const px = -Math.sin(r) * 22;
        const py = Math.cos(r) * 22;
        s += path(`M${(x + px).toFixed(1)} ${(y + py).toFixed(1)}L${ox.toFixed(1)} ${oy.toFixed(1)}L${(x - px).toFixed(1)} ${(y - py).toFixed(1)}Z`, c.extra, 6);
      }
      return s;
    },
  },
  {
    name: 'Cape',
    draw: (c) => path('M-62 -64Q-120 50 -104 112Q0 132 104 112Q120 50 62 -64Z', c.extra) + line('M-40 104Q-48 40 -36 -30M40 104Q48 40 36 -30', 4),
  },
  {
    name: 'Bow tie', front: true,
    draw: (c) => path('M0 -8L-40 -30Q-48 -8 -40 14Z', c.extra, 6) + path('M0 -8L40 -30Q48 -8 40 14Z', c.extra, 6) + path(rect(-12, -20, 24, 24, 8), c.extra, 6),
  },
];

// ---------------------------------------------------------------------------
// The whole monster
// ---------------------------------------------------------------------------
let uid = 0;
const GROUND = 450;

/** Where everything goes (handy for zooming a thumbnail on the face). */
export function layout(m) {
  const B = BODIES[m.body];
  const L = LEGS[m.legs].L;
  const hipY = GROUND - L;
  const bodyCY = hipY - B.hipY;
  const headCY = bodyCY + B.neckY;
  const top = headCY + Math.min(HEADS[m.head].top, HEADS[m.head].eyeY + EYES[m.eyes].top) - 14;
  return { hipY, bodyCY, headCY, top };
}

/**
 * The monster as an SVG string.
 * o.id: prefix for element ids (the live monster uses them to animate);
 * o.focus: 'head' zooms on the face (for eye and mouth thumbnails);
 * o.parts: add data-part="..." so taps can find the part.
 */
export function monsterSVG(m, o = {}) {
  const P = o.id || `mz${++uid}`;
  const c = m.colors;
  const B = BODIES[m.body];
  const Hd = HEADS[m.head];
  const Lg = LEGS[m.legs];
  const Ex = EXTRAS[m.extra];
  const lay = layout(m);
  const tag = (name) => (o.parts ? ` data-part="${name}"` : '');
  const id = (name) => (o.id ? ` id="${P}-${name}"` : '');

  let vb;
  if (o.focus === 'head') {
    const t = Math.min(lay.top + 4, lay.headCY - 100);
    const size = Math.max(230, lay.headCY + 110 - t);
    vb = `${200 - size / 2} ${t} ${size} ${size}`;
  } else {
    const vh = Math.max(480, GROUND + 16 - lay.top);
    const vw = (vh * 400) / 480;
    vb = `${(200 - vw / 2).toFixed(1)} ${(GROUND + 16 - vh).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`;
  }

  const pat = m.pattern && m.pattern !== 'none';
  const defs = pat ? `<defs><clipPath id="${P}-bc"><path d="${B.d}"/></clipPath><clipPath id="${P}-hc"><path d="${Hd.d}"/></clipPath></defs>` : '';

  // legs
  let legs = '';
  Lg.xs.forEach((fx, i) => {
    legs += `<g transform="translate(${(fx * B.hipW).toFixed(1)} 0)"><g${id('leg' + i)}>${Lg.draw(c, fx > 0 ? 1 : 0)}</g></g>`;
  });
  // arms
  const arm = ARMS[m.arms].draw(c);
  const arms = arm
    ? `<g${tag('arms')}><g transform="translate(${-B.sh[0]} ${B.sh[1]}) scale(-1,1)"><g${id('armL')}>${arm}</g></g>` +
      `<g transform="translate(${B.sh[0]} ${B.sh[1]})"><g${id('armR')}>${arm}</g></g></g>`
    : '';
  // body
  const [bx, by, brx, bry] = B.belly;
  const body = `<g${tag('body')}>${path(B.d, c.body)}` +
    (pat ? `<g clip-path="url(#${P}-bc)">${patternShapes(m.pattern, shade(c.body))}</g>` : '') +
    `<ellipse cx="${bx}" cy="${by}" rx="${brx}" ry="${bry}" fill="${belly(c.body)}"/>` +
    `<path d="${B.d}" fill="none" ${S()}/></g>`;
  // head
  const eyes = EYES[m.eyes].draw(c);
  const head = `<g transform="translate(0 ${B.neckY})"><g${id('head')}>` +
    `<g${tag('head')}>${Hd.back ? Hd.back(c) : ''}${path(Hd.d, c.head)}` +
    (pat ? `<g clip-path="url(#${P}-hc)">${patternShapes(m.pattern, shade(c.head))}</g><path d="${Hd.d}" fill="none" ${S()}/>` : '') +
    `${Hd.front ? Hd.front(c) : ''}</g>` +
    `<g transform="translate(0 ${Hd.eyeY})"${tag('eyes')}><g${id('eyes')}>${eyes.whites}<g${id('pupils')}>${eyes.pupils}</g>${eyes.lids || ''}</g></g>` +
    `<g transform="translate(0 ${Hd.mouthY})"${tag('mouth')}><g${id('mouth')}>${MOUTHS[m.mouth].svg}</g></g>` +
    `</g></g>`;
  const extra = Ex.draw(c) ? `<g${tag('extra')}>${Ex.draw(c)}</g>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${o.cls ? ` class="${o.cls}"` : ''}>${defs}` +
    `<ellipse cx="200" cy="${GROUND + 2}" rx="${Math.max(90, B.hipW * 2 + 40)}" ry="14" fill="rgba(45,36,66,.18)"${id('shadow')}/>` +
    `<g transform="translate(200 ${GROUND})"><g${id('all')}><g transform="translate(-200 ${-GROUND})">` +
    `<g transform="translate(200 ${lay.hipY})"${tag('legs')}>${legs}</g>` +
    `<g transform="translate(200 ${lay.bodyCY})"><g${id('torso')}>` +
    `${Ex.front ? '' : extra}${arms}${body}${head}${Ex.front ? extra : ''}` +
    `</g></g></g></g></g></svg>`;
}

// ---------------------------------------------------------------------------
// Making monsters
// ---------------------------------------------------------------------------
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const ri = (n) => Math.floor(Math.random() * n);

export function randomColors() {
  const main = pick(COLORS.slice(0, 13));
  let extra = pick(COLORS);
  while (extra === main) extra = pick(COLORS);
  const r = Math.random();
  const head = r < 0.25 ? pick(COLORS.slice(0, 13)) : main;
  const limbs = r > 0.8 ? extra : main;
  return { head, body: main, arms: limbs, legs: limbs, extra };
}

export function randomMonster() {
  return {
    id: Date.now().toString(36) + ri(1000).toString(36),
    name: '',
    head: ri(HEADS.length),
    eyes: ri(EYES.length),
    mouth: ri(MOUTHS.length),
    body: ri(BODIES.length),
    legs: ri(LEGS.length),
    arms: 1 + ri(ARMS.length - 1),
    extra: Math.random() < 0.3 ? 0 : ri(EXTRAS.length),
    pattern: Math.random() < 0.35 ? 'none' : pick(PATTERNS).key,
    colors: randomColors(),
  };
}

/** Make sure a saved monster still fits the parts lists. */
export function cleanMonster(m) {
  if (!m || typeof m !== 'object' || !m.colors) return null;
  const fit = (v, n) => (typeof v === 'number' && v >= 0 && v < n ? v : 0);
  return {
    id: String(m.id || Date.now().toString(36)),
    name: String(m.name || ''),
    head: fit(m.head, HEADS.length),
    eyes: fit(m.eyes, EYES.length),
    mouth: fit(m.mouth, MOUTHS.length),
    body: fit(m.body, BODIES.length),
    legs: fit(m.legs, LEGS.length),
    arms: fit(m.arms, ARMS.length),
    extra: fit(m.extra, EXTRAS.length),
    pattern: PATTERNS.some((p) => p.key === m.pattern) ? m.pattern : 'none',
    colors: {
      head: m.colors.head || '#9be15d', body: m.colors.body || '#9be15d', arms: m.colors.arms || '#9be15d',
      legs: m.colors.legs || '#9be15d', extra: m.colors.extra || '#ff7ac6',
    },
  };
}

const FIRST = ['Wobbly', 'Fuzzy', 'Giggly', 'Squishy', 'Bouncy', 'Snorty', 'Wiggly', 'Sparkly', 'Jelly', 'Silly',
  'Bubbly', 'Grumbly', 'Snuggly', 'Noodly', 'Zippy', 'Puffy', 'Tickly', 'Dizzy', 'Jumpy', 'Squeaky', 'Gloopy', 'Boingy'];
const LAST = ['Bloop', 'Zork', 'Fizzlewump', 'Gloop', 'Snorkel', 'Bonk', 'Puddle', 'Muffin', 'Wobbler', 'Zibble', 'Gobbo',
  'Flump', 'Snoot', 'Bingle', 'Doodle', 'Splodge', 'Tumbles', 'Wumpus', 'Blib', 'Pickle', 'Noodle', 'Bumble', 'Squidge'];
export function monsterName() { return `${pick(FIRST)} ${pick(LAST)}`; }
