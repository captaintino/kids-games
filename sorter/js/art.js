// Drawings for the sorter: toy shape blocks, the holes they drop into, and
// colored baskets. Everything sits on a 100 x 100 sheet (baskets 120 x 110).
import { circle, ellipse, rect, poly, star, INK } from '../../shared/js/pictures.js';

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------
function crescent() {
  // a big circle with a smaller one bitten out of its top-right
  const ax = 50; const ay = 50; const R = 44;
  const bx = 70; const by = 36; const r = 35;
  const dx = bx - ax; const dy = by - ay;
  const d = Math.sqrt(dx * dx + dy * dy);
  const a = (R * R - r * r + d * d) / (2 * d);
  const h = Math.sqrt(R * R - a * a);
  const mx = ax + (a * dx) / d; const my = ay + (a * dy) / d;
  const p1 = [mx + (h * dy) / d, my - (h * dx) / d];
  const p2 = [mx - (h * dy) / d, my + (h * dx) / d];
  const f = (v) => v.toFixed(1);
  return `M${f(p1[0])} ${f(p1[1])}A${R} ${R} 0 1 0 ${f(p2[0])} ${f(p2[1])}A${r} ${r} 0 0 1 ${f(p1[0])} ${f(p1[1])}Z`;
}

const hex = [];
for (let i = 0; i < 6; i++) {
  const a = (i * Math.PI) / 3;
  hex.push(Math.round(50 + Math.cos(a) * 47), Math.round(50 + Math.sin(a) * 47));
}

// face: [x, y, size]; hl: highlight ellipse [cx, cy, rx, ry, rotation]
export const SHAPES = [
  { key: 'circle', name: 'Circle', d: circle(50, 50, 44), face: [50, 54, 1], hl: [30, 30, 10, 6, -40] },
  { key: 'square', name: 'Square', d: rect(9, 9, 82, 82, 10), face: [50, 54, 1], hl: [28, 22, 11, 4, 0] },
  { key: 'triangle', name: 'Triangle', d: poly(50, 7, 94, 88, 6, 88), face: [50, 66, 0.9], hl: [38, 42, 4, 10, 30] },
  { key: 'star', name: 'Star', d: star(50, 54, 49, 22), face: [50, 58, 0.75], hl: [44, 26, 3, 7, 20] },
  { key: 'heart', name: 'Heart', d: 'M50 90C20 70 4 52 8 32C12 12 40 8 50 30C60 8 88 12 92 32C96 52 80 70 50 90Z', face: [50, 50, 1], hl: [24, 28, 8, 5, -40] },
  { key: 'diamond', name: 'Diamond', d: poly(50, 3, 93, 50, 50, 97, 7, 50), face: [50, 54, 0.95], hl: [36, 30, 4, 10, 45] },
  { key: 'oval', name: 'Oval', d: ellipse(50, 50, 47, 30), face: [50, 53, 1], hl: [26, 36, 10, 5, -20] },
  { key: 'rectangle', name: 'Rectangle', d: rect(3, 25, 94, 50, 9), face: [50, 53, 1], hl: [22, 35, 10, 4, 0] },
  { key: 'hexagon', name: 'Hexagon', d: poly.apply(null, hex), face: [50, 54, 1], hl: [34, 20, 10, 4, 0] },
  { key: 'moon', name: 'Moon', d: crescent(), face: [30, 60, 0.72], hl: [20, 40, 4, 9, 25] },
];
export const SHAPE = {};
SHAPES.forEach((s) => { SHAPE[s.key] = s; });

// Bright block colors (from the coloring palette)
export const BLOCK_COLORS = ['#ff4d5e', '#ff9a2e', '#ffd93b', '#5cd65c', '#3d7bff', '#9d5cff', '#ff7ac6', '#14c4b0'];

function face(fx, fy, s) {
  const e = 10 * s;
  return `<circle cx="${fx - e}" cy="${fy - 3 * s}" r="${4.8 * s}" fill="${INK}"/>` +
    `<circle cx="${fx + e}" cy="${fy - 3 * s}" r="${4.8 * s}" fill="${INK}"/>` +
    `<circle cx="${fx - e - 1.4 * s}" cy="${fy - 4.6 * s}" r="${1.7 * s}" fill="#fff"/>` +
    `<circle cx="${fx + e - 1.4 * s}" cy="${fy - 4.6 * s}" r="${1.7 * s}" fill="#fff"/>` +
    (s >= 0.85 ? `<ellipse cx="${fx - 17 * s}" cy="${fy + 4 * s}" rx="${4.5 * s}" ry="${3 * s}" fill="#ff6fa8" opacity=".45"/>` +
      `<ellipse cx="${fx + 17 * s}" cy="${fy + 4 * s}" rx="${4.5 * s}" ry="${3 * s}" fill="#ff6fa8" opacity=".45"/>` : '') +
    `<path d="M${fx - 7 * s} ${fy + 3 * s}Q${fx} ${fy + 11 * s} ${fx + 7 * s} ${fy + 3 * s}" fill="none" stroke="${INK}" stroke-width="${3.4 * s}" stroke-linecap="round"/>`;
}

const VB = 'viewBox="-8 -8 116 116"';

/** A chunky toy block with a happy face. */
export function blockSvg(key, color) {
  const s = SHAPE[key];
  const h = s.hl;
  return `<svg ${VB} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<path d="${s.d}" transform="translate(2 7)" fill="rgba(45,20,80,.28)"/>` +
    `<path d="${s.d}" fill="${color}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
    (key === 'moon' ? '' : `<path d="${s.d}" transform="translate(50 50) scale(.84) translate(-50 -46)" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="4" stroke-linejoin="round"/>`) +
    `<path d="${ellipse(h[0], h[1], h[2], h[3], h[4])}" fill="#fff" opacity=".7"/>` +
    face(s.face[0], s.face[1], s.face[2]) +
    `</svg>`;
}

let holeId = 0;
/** A hole cut into the wooden board. */
export function holeSvg(key) {
  const s = SHAPE[key];
  const id = `hc${++holeId}`;
  return `<svg ${VB} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<defs><clipPath id="${id}"><path d="${s.d}"/></clipPath></defs>` +
    `<path d="${s.d}" transform="translate(0 4)" fill="none" stroke="rgba(255,240,200,.75)" stroke-width="6" stroke-linejoin="round"/>` +
    `<path d="${s.d}" fill="#3a1f0c"/>` +
    `<g clip-path="url(#${id})"><path d="${s.d}" transform="translate(0 11)" fill="#6e4220"/>` +
    `<path d="${s.d}" transform="translate(0 22)" fill="#7d4c26"/></g>` +
    `<path d="${s.d}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
    `</svg>`;
}

/** Just the outline, for the little progress icons. */
export function miniShapeSvg(key, color) {
  return `<svg ${VB} xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${SHAPE[key].d}" fill="${color}" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/></svg>`;
}

// ---------------------------------------------------------------------------
// Colors and baskets
// ---------------------------------------------------------------------------
export const COLORS = [
  { key: 'red', name: 'Red', hex: '#ff4d5e', items: ['apple', 'strawberry', 'cherries', 'tomato'] },
  { key: 'orange', name: 'Orange', hex: '#ff9a2e', items: ['orange', 'carrot', 'pumpkin'] },
  { key: 'yellow', name: 'Yellow', hex: '#ffd93b', items: ['banana', 'lemon', 'corn'] },
  { key: 'green', name: 'Green', hex: '#5cd65c', items: ['lime', 'pear', 'peas', 'broccoli'] },
  { key: 'blue', name: 'Blue', hex: '#3d7bff', items: ['blueberries'] },
  { key: 'purple', name: 'Purple', hex: '#9d5cff', items: ['grapes', 'plum', 'eggplant'] },
  { key: 'pink', name: 'Pink', hex: '#ff7ac6', items: ['dragonfruit', 'grapefruit'] },
  { key: 'brown', name: 'Brown', hex: '#a7663c', items: ['coconut', 'potato', 'mushroom'] },
];
export const COLOR = {};
COLORS.forEach((c) => { COLOR[c.key] = c; });

function mix(hex, to, t) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const ch = (v, s) => (v >> s) & 255;
  const m = (s) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}

const BVB = 'viewBox="-6 -6 132 122"';
/** Back of a basket: the handle and the dark inside. Fruit sits between back and front. */
export function basketBackSvg(c) {
  const dark = mix(c.hex, '#2d2442', 0.45);
  return `<svg ${BVB} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<path d="M20 52Q18 2 60 2Q102 2 100 52" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>` +
    `<path d="M20 52Q18 2 60 2Q102 2 100 52" fill="none" stroke="${mix(c.hex, '#ffffff', 0.15)}" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="${ellipse(60, 52, 54, 13)}" fill="${dark}" stroke="${INK}" stroke-width="5"/>` +
    `</svg>`;
}

/** Front of a basket, woven, with a ribbon bow and a name tag. */
export function basketFrontSvg(c) {
  const light = mix(c.hex, '#ffffff', 0.4);
  const dark = mix(c.hex, '#2d2442', 0.3);
  const body = 'M8 54Q60 70 112 54L102 100Q60 114 18 100Z';
  let weave = '';
  for (let i = 0; i < 6; i++) {
    const x = 22 + i * 15.2;
    weave += `M${x} ${60 + Math.abs(i - 2.5) * -1.2 + 3}L${x + (x - 60) * -0.08} ${104 - Math.abs(i - 2.5) * 1.5}`;
  }
  return `<svg ${BVB} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<path d="${body}" fill="${c.hex}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="M14 74Q60 88 106 74M17 88Q60 102 103 88" fill="none" stroke="${dark}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="${weave}" fill="none" stroke="${light}" stroke-width="3" stroke-linecap="round" opacity=".75"/>` +
    `<path d="M4 50Q60 68 116 50L114 60Q60 78 6 60Z" fill="${light}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
    // bow
    `<path d="M60 70Q40 56 36 70Q40 84 60 74Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M60 70Q80 56 84 70Q80 84 60 74Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M57 74L50 92M63 74L70 92" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M57 74L50 92M63 74L70 92" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
    `<circle cx="60" cy="72" r="6.5" fill="${c.hex}" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M44 66Q46 64 50 66" fill="none" stroke="${c.hex}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M70 66Q74 64 76 66" fill="none" stroke="${c.hex}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M14 62Q22 66 30 67" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>` +
    `</svg>`;
}

/** A paint blob in a color (title icons, progress dots). */
export function blobSvg(hex) {
  return `<svg viewBox="-6 -6 112 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<path d="${circle(50, 50, 42)}" fill="${hex}" stroke="${INK}" stroke-width="9"/>` +
    `<path d="${ellipse(34, 34, 10, 6, -40)}" fill="#fff" opacity=".6"/></svg>`;
}
