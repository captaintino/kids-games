// Drawn fruit, veg and snacks, each on a 100 x 100 sheet with thick ink outlines.
// The same file lives in sorter/js/ and feed/js/ (keep the two copies in step).
//
//   FOODS.apple  -> { name: 'apple', color: '#ff4d5e', art: '<path ...>' }
//   foodSvg('apple', 'cls')  -> a complete <svg> string
import { circle, ellipse, rect, star, cloud, INK } from '../../shared/js/pictures.js';

const P = (d, f, w) => `<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w == null ? 4 : w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const F = (d, f, o) => `<path d="${d}" fill="${f}"${o ? ` opacity="${o}"` : ''}/>`;
const L = (d, c, w) => `<path d="${d}" fill="none" stroke="${c || INK}" stroke-width="${w || 4}" stroke-linecap="round" stroke-linejoin="round"/>`;
const C = (cx, cy, r, f, w) => P(circle(cx, cy, r), f, w);
const HL = (cx, cy, rx, ry, rot) => F(ellipse(cx, cy, rx, ry, rot || 0), '#fff', 0.6);
const dots = (pts, r, f) => pts.map((p) => F(circle(p[0], p[1], r), f)).join('');
// several shapes merged into one outlined blob: outlines first, then the fills on top
const union = (ds, f, w) => ds.map((d) => P(d, f, w || 9)).join('') + ds.map((d) => F(d, f)).join('');

const STEM = '#7a4a26';
const LEAF = '#5cd65c';

export const FOODS = {
  apple: {
    name: 'apple', color: '#ff4d5e',
    art: L('M50 31Q49 18 55 9', STEM, 5) +
      P('M50 30C36 18 12 24 13 50C14 76 34 92 50 85C66 92 86 76 87 50C88 24 64 18 50 30Z', '#ff4d5e') +
      P('M54 22Q64 6 82 12Q74 28 54 22Z', LEAF, 3.5) + HL(30, 46, 6, 12, 20),
  },
  strawberry: {
    name: 'strawberry', color: '#ff4d5e',
    art: P('M50 90C24 76 12 50 20 36C28 24 72 24 80 36C88 50 76 76 50 90Z', '#ff4d5e') +
      [[34, 44], [50, 41], [66, 44], [42, 56], [58, 56], [50, 71], [30, 58], [70, 58]]
        .map((p) => F(ellipse(p[0], p[1], 2.2, 3.2), '#ffe27a')).join('') +
      P('M28 32L36 18L44 26L50 12L56 26L64 18L72 32Q50 42 28 32Z', LEAF, 3.5) + HL(30, 48, 4, 8, 20),
  },
  cherries: {
    name: 'cherries', color: '#e8334a', plural: true,
    art: L('M33 58Q38 32 60 12', '#3c8a3c', 4) + L('M68 60Q66 34 60 12', '#3c8a3c', 4) +
      P('M60 14Q74 2 88 10Q78 24 60 14Z', LEAF, 3) +
      C(32, 70, 17, '#e8334a') + C(68, 72, 17, '#e8334a') + HL(25, 64, 4, 7, 20) + HL(61, 66, 4, 7, 20),
  },
  tomato: {
    name: 'tomato', color: '#ff4d5e',
    art: P(ellipse(50, 58, 39, 32), '#ff4d5e') + P(star(50, 30, 17, 6, 5), LEAF, 3) +
      L('M50 26V16', '#3c8a3c', 4) + HL(28, 52, 5, 10, 20),
  },
  orange: {
    name: 'orange', color: '#ff9a2e', article: 'an',
    art: L('M49 23L47 14', STEM, 4) + C(50, 56, 35, '#ff9a2e') +
      dots([[36, 66], [60, 70], [68, 52], [48, 78], [30, 54], [56, 44]], 1.6, '#e57a12') +
      P('M50 22Q60 6 78 11Q70 26 50 22Z', LEAF, 3) + HL(34, 44, 6, 10, 30),
  },
  carrot: {
    name: 'carrot', color: '#ff9a2e',
    art: P('M48 32Q34 16 28 4Q46 8 52 28Z', LEAF, 3.5) + P('M50 30Q54 10 64 2Q66 18 54 31Z', '#3fbf5f', 3.5) +
      P('M24 33Q50 23 76 33Q64 64 53 92Q50 97 47 92Q36 64 24 33Z', '#ff9a2e') +
      L('M33 46H45', '#c75a00', 3) + L('M55 56H65', '#c75a00', 3) + L('M41 70H50', '#c75a00', 3) +
      HL(39, 42, 3, 8, -10),
  },
  pumpkin: {
    name: 'pumpkin', color: '#ff9a2e',
    art: P('M45 30Q46 16 55 12L60 17Q53 21 55 31Z', STEM, 3) +
      P(ellipse(32, 60, 22, 28), '#ff9a2e') + P(ellipse(68, 60, 22, 28), '#ff9a2e') +
      P(ellipse(50, 60, 17, 30), '#ffad4a') + L('M57 16Q70 6 76 18', '#3c8a3c', 3) + HL(26, 52, 4, 9, 15),
  },
  banana: {
    name: 'banana', color: '#ffd93b',
    art: P('M17 28Q18 76 64 84Q82 86 91 74Q86 68 76 70Q40 68 31 26Q25 18 17 28Z', '#ffd93b') +
      L('M31 34Q38 62 70 74', '#e6b422', 3) + F(circle(91, 74, 3), STEM) + F(ellipse(23, 22, 5, 3, -30), STEM) +
      HL(24, 44, 3, 10, -15),
  },
  lemon: {
    name: 'lemon', color: '#ffd93b',
    art: P('M13 58Q8 49 18 45Q30 22 58 24Q80 24 87 41Q94 47 88 54Q80 78 50 78Q23 78 13 58Z', '#ffd93b') +
      P('M58 25Q66 10 83 12Q77 27 60 26Z', LEAF, 3) + HL(34, 44, 5, 10, 50),
  },
  corn: {
    name: 'corn', color: '#ffd93b',
    art: P(ellipse(50, 44, 20, 36), '#ffd93b') +
      L('M50 12V76', '#e6b422', 2.5) + L('M37 22H63', '#e6b422', 2.5) + L('M35 34H65', '#e6b422', 2.5) +
      L('M34 46H66', '#e6b422', 2.5) + L('M36 58H64', '#e6b422', 2.5) +
      P('M50 94Q16 86 18 40Q32 64 50 70Z', LEAF) + P('M50 94Q84 86 82 40Q68 64 50 70Z', '#3fbf5f'),
  },
  lime: {
    name: 'lime', color: '#5cd65c',
    art: C(50, 55, 33, '#7ed957') + dots([[36, 64], [60, 70], [66, 50], [46, 78], [32, 50]], 1.6, '#3fae3f') +
      P('M50 22Q58 8 74 10Q68 24 50 22Z', '#3fbf5f', 3) + HL(35, 44, 6, 10, 30),
  },
  pear: {
    name: 'pear', color: '#9be15d',
    art: L('M50 21Q50 12 54 5', STEM, 4) +
      P('M50 20C38 20 40 38 34 46C20 60 22 90 50 90C78 90 80 60 66 46C60 38 62 20 50 20Z', '#9be15d') +
      P('M53 14Q64 4 78 8Q70 20 53 14Z', '#3fbf5f', 3) + HL(36, 64, 5, 11, 15),
  },
  peas: {
    name: 'peas', color: '#5cd65c', plural: true,
    art: P('M8 62Q30 24 92 31Q72 72 8 62Z', '#5cd65c') +
      C(30, 53, 9, '#a6ff7a', 3) + C(49, 48, 9.5, '#a6ff7a', 3) + C(68, 43, 9, '#a6ff7a', 3) +
      P('M8 62Q44 70 92 31Q76 74 8 62Z', '#3fae3f', 3.5) + L('M92 31Q96 24 94 18', '#3c8a3c', 3.5),
  },
  broccoli: {
    name: 'broccoli', color: '#3fbf5f',
    art: P('M41 54L36 90Q50 96 64 90L59 54Z', '#a6e05a') + L('M50 60V84', '#7fbf3f', 3) +
      P(cloud(50, 38, 36, 25, 9), '#3fbf5f') +
      dots([[38, 34], [56, 28], [62, 44], [44, 48], [30, 46], [70, 32]], 5, '#5cd65c'),
  },
  blueberries: {
    name: 'blueberries', color: '#3d7bff', plural: true,
    art: [[34, 38], [64, 36], [50, 60], [24, 66], [76, 64]].map((p) =>
      C(p[0], p[1], 16, '#3d7bff') + F(star(p[0], p[1] - 6, 6, 2.4, 5), '#1c3f9c') + HL(p[0] - 7, p[1] + 2, 3, 5, 20)).join(''),
  },
  grapes: {
    name: 'grapes', color: '#9d5cff', plural: true,
    art: L('M50 22Q52 12 60 7', STEM, 4) + P('M54 17Q68 3 84 11Q74 25 54 17Z', LEAF, 3) +
      [[30, 34], [50, 32], [70, 34], [40, 52], [60, 52], [30, 66]].slice(0, 5)
        .concat([[50, 70]]).map((p) => C(p[0], p[1], 12.5, '#9d5cff', 3.5) + HL(p[0] - 4, p[1] - 4, 2.5, 4, 30)).join(''),
  },
  plum: {
    name: 'plum', color: '#8a3fd1',
    art: L('M50 25Q50 15 56 9', STEM, 4) + P(ellipse(50, 57, 35, 33), '#8a3fd1') +
      L('M50 26Q38 56 50 89', '#6a2bb0', 3) + P('M54 16Q66 4 80 10Q72 22 54 16Z', LEAF, 3) + HL(30, 50, 5, 10, 20),
  },
  eggplant: {
    name: 'eggplant', color: '#7b3fd1', article: 'an',
    art: P('M62 22Q88 42 80 70Q72 93 44 91Q15 87 17 64Q19 43 44 40Q56 37 62 22Z', '#7b3fd1') +
      P('M53 24Q66 14 78 25Q74 37 63 32Q56 34 53 24Z', LEAF, 3.5) + L('M66 18Q68 10 74 6', '#3c8a3c', 4) +
      HL(30, 62, 4, 10, 40),
  },
  dragonfruit: {
    name: 'dragon fruit', color: '#ff5fa8',
    art: P('M30 34Q16 26 18 14Q32 22 38 30Z', LEAF, 3) + P('M70 34Q84 26 82 14Q68 22 62 30Z', LEAF, 3) +
      P('M42 26Q42 10 50 4Q58 10 58 26Z', LEAF, 3) +
      P(ellipse(50, 58, 31, 36), '#ff5fa8') +
      P('M24 58Q10 56 6 46Q18 44 26 50Z', '#ff9bd8', 3) + P('M76 58Q90 56 94 46Q82 44 74 50Z', '#ff9bd8', 3) +
      P('M38 72Q30 84 34 92Q42 84 44 76Z', '#ff9bd8', 3) + P('M62 72Q70 84 66 92Q58 84 56 76Z', '#ff9bd8', 3) +
      P('M50 46Q44 56 50 62Q56 56 50 46Z', '#ff9bd8', 3) + HL(36, 48, 4, 9, 20),
  },
  grapefruit: {
    name: 'grapefruit', color: '#ff7aa8',
    art: C(50, 52, 38, '#ff6f98') + F(circle(50, 52, 31), '#ffe3ec') + F(circle(50, 52, 28), '#ff9cc4') +
      [0, 45, 90, 135].map((a) => {
        const r = (a * Math.PI) / 180;
        const x = Math.cos(r) * 28;
        const y = Math.sin(r) * 28;
        return L(`M${(50 - x).toFixed(1)} ${(52 - y).toFixed(1)}L${(50 + x).toFixed(1)} ${(52 + y).toFixed(1)}`, '#ffe3ec', 3);
      }).join('') + F(circle(50, 52, 4), '#ffe3ec') + HL(36, 38, 4, 6, 40),
  },
  coconut: {
    name: 'coconut', color: '#8b5a2b',
    art: C(50, 54, 35, '#8b5a2b') +
      L('M26 40l6 4M70 32l-4 6M76 60l-6 2M30 72l6-4M54 84l-2-6M20 56l7 1M62 70l4 5', '#5e3a17', 3) +
      dots([[42, 34], [56, 34], [49, 45]], 4.5, '#3a2410') + HL(30, 46, 4, 8, 25),
  },
  potato: {
    name: 'potato', color: '#c99055',
    art: P('M18 50Q16 26 44 25Q72 21 83 43Q91 70 62 79Q24 85 18 50Z', '#c99055') +
      dots([[36, 42], [62, 38], [70, 60], [44, 64], [54, 52]], 2.4, '#8a5a2b') + HL(32, 34, 8, 4, -15),
  },
  mushroom: {
    name: 'mushroom', color: '#a7663c',
    art: P('M40 54Q38 80 35 88Q50 95 65 88Q62 80 60 54Z', '#fff2dc') +
      P('M8 58Q10 16 50 14Q90 16 92 58Q50 68 8 58Z', '#a7663c') +
      dots([[30, 36], [56, 28], [70, 46], [44, 48]], 6, '#d39a66') + HL(24, 34, 4, 8, 30),
  },
  watermelon: {
    name: 'watermelon', color: '#ff4d5e',
    art: `<g transform="rotate(-12 50 50)">` + P('M6 32A44 44 0 0 0 94 32Z', '#3fbf5f') +
      F('M13 32A37 37 0 0 0 87 32Z', '#eaffd8') + F('M17 32A33 33 0 0 0 83 32Z', '#ff4d5e') + L('M6 32H94') +
      [[32, 42, -20], [50, 52, 0], [68, 42, 20], [40, 58, -10], [60, 58, 10]]
        .map((p) => F(ellipse(p[0], p[1], 2.4, 4, p[2]), INK)).join('') + `</g>`,
  },
  cookie: {
    name: 'cookie', color: '#e8a95c',
    art: C(50, 50, 38, '#e8a95c') +
      [[36, 34], [60, 30], [44, 56], [66, 56], [28, 58], [54, 74], [76, 40]]
        .map((p) => F(ellipse(p[0], p[1], 5, 4, p[0] * 7), '#6b3d1c')).join('') +
      dots([[48, 40], [38, 72], [70, 70], [24, 44]], 1.8, '#c47f35') + HL(32, 26, 8, 4, -30),
  },
  cheese: {
    name: 'cheese', color: '#ffcf3b',
    art: P('M10 46L70 20L92 40Z', '#ffe27a') + P('M10 46L92 40L92 76L10 82Z', '#ffcf3b') +
      F(ellipse(30, 62, 6, 5), '#e6a91f') + F(ellipse(56, 54, 4, 4), '#e6a91f') + F(ellipse(70, 68, 7, 5), '#e6a91f') +
      F(ellipse(46, 32, 6, 3), '#f2c53a') + F(ellipse(78, 52, 3, 3), '#e6a91f'),
  },
  fish: {
    name: 'fish', color: '#6fc8ff',
    art: P('M32 34Q44 14 60 32Z', '#3d7bff', 3.5) + P('M66 50L92 30Q87 50 92 70Z', '#ff9a2e') +
      P('M8 50Q34 18 72 50Q34 82 8 50Z', '#6fc8ff') + L('M44 36Q39 50 44 64', '#3d7bff', 3) +
      L('M56 40Q52 50 56 60', '#3d7bff', 3) + C(25, 46, 5.5, '#fff', 3) + F(circle(26, 46, 2.6), INK) +
      L('M13 56Q19 59 24 55', INK, 3),
  },
  bone: {
    name: 'bone', color: '#fff3dc',
    art: union([circle(22, 38, 12), circle(22, 62, 12), circle(78, 38, 12), circle(78, 62, 12), rect(22, 40, 56, 20)], '#fff6e4') +
      L('M30 44H70', '#ecd9b8', 3),
  },
  bamboo: {
    name: 'bamboo', color: '#7ed957',
    art: P(rect(30, 6, 17, 88, 7), '#7ed957') + P(rect(54, 18, 17, 76, 7), '#5cd65c') +
      L('M30 36H47', '#3c8a3c', 3.5) + L('M30 66H47', '#3c8a3c', 3.5) + L('M54 46H71', '#3c8a3c', 3.5) +
      L('M54 74H71', '#3c8a3c', 3.5) + L('M35 12V30M35 42V60', '#fff', 3) +
      P('M47 34Q64 22 84 24Q70 38 47 36Z', '#3fbf5f', 3) + P('M30 64Q14 52 4 56Q14 70 30 66Z', '#3fbf5f', 3),
  },
  cupcake: {
    name: 'cupcake', color: '#ff7ac6',
    art: P('M23 54L77 54L69 91L31 91Z', '#ff7ac6') + L('M38 56L41 89M50 56V89M62 56L59 89', '#ff3d9a', 3) +
      P('M17 56Q12 42 28 39Q28 22 50 22Q72 22 72 39Q88 42 83 56Z', '#fff0f8') +
      L('M44 16Q46 8 54 6', '#3c8a3c', 3) + C(50, 18, 7, '#ff4d5e', 3) +
      F(rect(30, 44, 7, 3, 1.5), '#3d7bff') + F(rect(58, 34, 7, 3, 1.5), '#ffd93b') + F(rect(64, 46, 7, 3, 1.5), '#5cd65c') +
      F(rect(40, 30, 7, 3, 1.5), '#ff9a2e') + HL(30, 44, 3, 3),
  },
  pizza: {
    name: 'pizza', color: '#ffd93b',
    art: P('M12 26Q50 10 88 26L52 93Q50 97 48 93Z', '#ffd93b') +
      P('M9 23Q50 4 91 23L87 33Q50 17 13 33Z', '#e8a95c') +
      C(39, 42, 8, '#e8334a', 3) + C(60, 46, 7, '#e8334a', 3) + C(50, 66, 6, '#e8334a', 3) +
      F(ellipse(46, 54, 3, 2, 30), '#3fbf5f') + F(ellipse(58, 34, 3, 2, -30), '#3fbf5f') + F(ellipse(32, 32, 2.5, 2), '#3fbf5f'),
  },
  icecream: {
    name: 'ice cream', color: '#ff9bd8', article: 'an',
    art: P('M29 50L71 50L50 95Z', '#e8a95c') + L('M37 58L58 80M50 54L64 68M47 76L60 60M38 60L54 84', '#c47f35', 2.5) +
      C(38, 46, 17, '#8ff7e4') + C(62, 46, 17, '#ff9bd8') + C(50, 28, 18, '#fff4c2') +
      L('M48 8Q50 2 56 0', '#3c8a3c', 3) + C(50, 10, 6, '#ff4d5e', 3) + HL(42, 22, 3, 5, 30),
  },
};

export function foodSvg(key, cls) {
  const f = FOODS[key];
  return `<svg class="${cls || 'food'}" viewBox="-4 -4 108 108" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${f ? f.art : ''}</svg>`;
}
