// The animals: portraits in the house style (bold shapes, thick ink outlines),
// drawn on a 400 x 400 sheet with the same helpers as the coloring pictures.
// Seven reuse the coloring game's animals (cropped, no scenery); the rest are
// drawn here.
//
// Shapes marked with shut(...) show while the animal is quiet (a closed smile,
// a lowered trunk); shapes marked with open(...) show while it makes its sound
// (an open mouth, a raised trunk).
import {
  PICTURES, S, I, D, eye, circle, ellipse, rect, poly, cloud,
} from '../../shared/js/pictures.js';
import { pictureMarkup } from '../../shared/js/art.js';

const MOUTH = '#6b2448';
const TONGUE = '#ff7ac6';

const tag = (g) => (...shapes) => shapes.map((s) => Object.assign({}, s, { grp: g }));
const shut = tag('shut');
const open = tag('open');
const mouth = (x, y, rx, ry) => open(
  I(ellipse(x, y, rx, ry), MOUTH),
  I(ellipse(x, y + ry * 0.42, rx * 0.62, ry * 0.42), TONGUE),
);

// Reuse a coloring picture: drop its scenery, mark its closed mouth.
function fromPicture(id, { drop = [], quiet = [], extra = [] }) {
  const pic = PICTURES.filter((p) => p.id === id)[0];
  const shapes = [];
  pic.shapes.forEach((s, i) => {
    if (drop.indexOf(i) >= 0) return;
    shapes.push(quiet.indexOf(i) >= 0 ? shut(s)[0] : s);
  });
  return shapes.concat(extra);
}

// ---------------------------------------------------------------------------
// New drawings
// ---------------------------------------------------------------------------
const COW = [
  S(ellipse(200, 400, 150, 88), 'white'),
  S(ellipse(128, 372, 38, 26, -15), 'black'),
  S(ellipse(292, 385, 30, 22, 20), 'black'),
  S(rect(128, 296, 144, 22, 11), 'red'),
  S(circle(200, 336, 17), 'yellow'),
  I(circle(200, 342, 4.5)),
  S('M148 122Q110 94 120 56Q140 88 176 104Z', 'tan'),
  S('M252 122Q290 94 280 56Q260 88 224 104Z', 'tan'),
  S(ellipse(98, 152, 46, 22, -25), 'white'),
  S(ellipse(302, 152, 46, 22, 25), 'white'),
  S(ellipse(102, 153, 28, 11, -25), 'pink'),
  S(ellipse(298, 153, 28, 11, 25), 'pink'),
  S(ellipse(200, 180, 92, 102), 'white'),
  S(ellipse(244, 138, 27, 31, 15), 'black'),
  S('M176 88Q184 60 200 76Q212 56 226 88Q200 98 176 88Z', 'brown'),
  S(circle(167, 160, 17), 'white'),
  S(circle(233, 160, 17), 'white'),
  ...eye(168, 162, 10),
  ...eye(232, 162, 10),
  S(ellipse(200, 252, 74, 50), 'pink'),
  I(ellipse(172, 244, 9, 13)),
  I(ellipse(228, 244, 9, 13)),
  ...shut(D('M176 282Q200 294 224 282')),
  ...mouth(200, 283, 24, 14),
];

const DUCK = [
  S(ellipse(200, 345, 122, 82), 'yellow'),
  S('M96 302Q58 334 84 378Q126 384 142 346Z', 'yellow'),
  S('M304 302Q342 334 316 378Q274 384 258 346Z', 'yellow'),
  S('M186 96Q176 60 198 72Q204 46 222 74Q238 64 230 100Z', 'yellow'),
  S(circle(200, 178, 88), 'yellow'),
  ...eye(164, 150, 12),
  ...eye(236, 150, 12),
  S(circle(136, 196, 13), 'pink'),
  S(circle(264, 196, 13), 'pink'),
  ...open(
    I(ellipse(200, 242, 34, 22), MOUTH),
    I(ellipse(200, 252, 20, 8), TONGUE),
    S(ellipse(200, 266, 42, 15), 'orange'),
  ),
  ...shut(S(ellipse(200, 232, 44, 15), 'orange')),
  S(ellipse(200, 214, 56, 22), 'orange'),
  I(ellipse(188, 206, 4, 2.5)),
  I(ellipse(212, 206, 4, 2.5)),
];

const SHEEP = [
  S(cloud(200, 370, 150, 82, 12), 'white'),
  S(ellipse(110, 196, 46, 20, -20), 'tan'),
  S(ellipse(290, 196, 46, 20, 20), 'tan'),
  S(ellipse(112, 198, 28, 9, -20), 'pink'),
  S(ellipse(288, 198, 28, 9, 20), 'pink'),
  S(ellipse(200, 210, 68, 84), 'tan'),
  S(cloud(200, 130, 82, 44, 9), 'white'),
  ...eye(175, 198, 10),
  ...eye(225, 198, 10),
  S(circle(156, 232, 10), 'pink'),
  S(circle(244, 232, 10), 'pink'),
  I('M188 240Q200 234 212 240Q207 252 200 252Q193 252 188 240Z'),
  ...shut(D('M186 266Q200 276 214 266')),
  ...mouth(200, 270, 16, 13),
];

const HORSE = [
  S('M118 400Q126 292 170 256H232Q276 292 284 400Z', 'brown'),
  S('M198 70C140 72 116 142 122 212C126 262 136 304 150 334L176 252Z', 'black'),
  S(poly(150, 118, 138, 44, 190, 92), 'brown'),
  S(poly(250, 118, 262, 44, 210, 92), 'brown'),
  S(poly(153, 106, 147, 66, 176, 92), 'pink'),
  S(poly(247, 106, 253, 66, 224, 92), 'pink'),
  S(ellipse(200, 165, 72, 95), 'brown'),
  S('M200 94Q214 150 207 212H193Q186 150 200 94Z', 'white'),
  S('M166 98Q174 62 198 74Q218 58 236 98Q216 114 200 104Q184 116 166 98Z', 'black'),
  ...eye(160, 160, 11),
  ...eye(240, 160, 11),
  S(ellipse(200, 262, 64, 52), 'tan'),
  I(ellipse(180, 258, 7, 11)),
  I(ellipse(220, 258, 7, 11)),
  ...shut(D('M178 294Q200 304 222 294')),
  ...mouth(200, 296, 24, 14),
];

const HEN = [
  S('M280 300Q342 244 332 190Q358 206 358 240Q382 232 376 270Q362 314 300 332Z', 'brown'),
  S(ellipse(200, 325, 112, 86), 'orange'),
  S(ellipse(118, 322, 30, 54, 15), 'brown'),
  S(ellipse(282, 322, 30, 54, -15), 'brown'),
  S('M160 114Q148 74 176 84Q182 52 204 76Q222 54 232 92Q250 86 240 116Z', 'red'),
  S(circle(200, 172, 74), 'orange'),
  ...eye(172, 158, 11),
  ...eye(228, 158, 11),
  S(circle(149, 192, 11), 'pink'),
  S(circle(251, 192, 11), 'pink'),
  S('M191 200Q184 240 200 246Q216 240 209 200Z', 'red'),
  ...open(
    I(poly(182, 192, 218, 192, 200, 226), MOUTH),
    S(poly(185, 202, 215, 202, 200, 232), 'yellow'),
  ),
  ...shut(S(poly(186, 194, 214, 194, 200, 214), 'yellow')),
  S(poly(178, 182, 222, 182, 200, 204), 'yellow'),
];

const LION = [
  S(ellipse(200, 400, 120, 72), 'yellow'),
  S(cloud(200, 196, 148, 142, 14), 'orange'),
  S(circle(136, 126, 28), 'yellow'),
  S(circle(264, 126, 28), 'yellow'),
  S(circle(136, 126, 15), 'pink'),
  S(circle(264, 126, 15), 'pink'),
  S(ellipse(200, 202, 94, 88), 'yellow'),
  ...eye(164, 182, 11),
  ...eye(236, 182, 11),
  S(circle(138, 228, 12), 'pink'),
  S(circle(262, 228, 12), 'pink'),
  S(ellipse(200, 244, 50, 36), 'white'),
  ...open(
    I(ellipse(200, 260, 22, 18), MOUTH),
    I(ellipse(200, 268, 13, 7), TONGUE),
  ),
  ...shut(D('M200 236V250M200 250Q188 262 176 252M200 250Q212 262 224 252')),
  S('M182 218Q200 208 218 218Q212 236 200 238Q188 236 182 218Z', 'brown'),
  I(circle(172, 246, 2.6)), I(circle(162, 238, 2.6)), I(circle(228, 246, 2.6)), I(circle(238, 238, 2.6)),
];

const ELEPHANT = [
  S(ellipse(98, 192, 84, 100, -10), 'gray'),
  S(ellipse(302, 192, 84, 100, 10), 'gray'),
  S(ellipse(106, 196, 54, 70, -10), 'pink'),
  S(ellipse(294, 196, 54, 70, 10), 'pink'),
  S(ellipse(200, 176, 90, 98), 'gray'),
  ...eye(166, 160, 10),
  ...eye(234, 160, 10),
  S(circle(146, 204, 12), 'pink'),
  S(circle(254, 204, 12), 'pink'),
  ...shut(
    S('M172 212C168 268 172 318 196 348C212 368 244 362 250 338L230 330C224 344 212 344 206 334C194 314 226 270 228 212Z', 'gray'),
    D('M184 262Q200 268 214 262M188 294Q202 300 214 294', 4),
  ),
  ...mouth(196, 272, 22, 16),
  ...open(
    S('M172 210C168 252 190 278 230 272C270 266 292 230 302 192L322 186L304 154L280 170C272 202 256 228 234 234C226 228 228 220 228 210Z', 'gray'),
    D('M186 246Q196 256 210 254M238 226Q250 232 256 246', 4),
  ),
];

const MOUSE = [
  D('M286 362Q360 356 352 304Q344 262 374 250', 6),
  S(ellipse(200, 352, 100, 72), 'gray'),
  S(ellipse(200, 368, 54, 46), 'white'),
  S(circle(110, 120, 62), 'gray'),
  S(circle(290, 120, 62), 'gray'),
  S(circle(114, 124, 40), 'pink'),
  S(circle(286, 124, 40), 'pink'),
  S(ellipse(200, 204, 88, 82), 'gray'),
  ...eye(170, 188, 11),
  ...eye(230, 188, 11),
  S(circle(146, 224, 11), 'pink'),
  S(circle(254, 224, 11), 'pink'),
  D('M166 234L116 224M166 246L118 256M234 234L284 224M234 246L282 256', 3.5),
  ...shut(D('M186 254Q200 264 214 254')),
  ...mouth(200, 262, 16, 14),
  S(rect(193, 254, 14, 11, 3), 'white'),
  S(circle(200, 230, 13), 'pink'),
];

const MONKEY = [
  S(ellipse(200, 400, 108, 66), 'brown'),
  S(circle(102, 192, 40), 'brown'),
  S(circle(298, 192, 40), 'brown'),
  S(circle(105, 194, 24), 'tan'),
  S(circle(295, 194, 24), 'tan'),
  S('M184 98Q184 64 204 82Q214 58 228 98Z', 'brown'),
  S(circle(200, 186, 96), 'brown'),
  S('M200 142C180 115 128 120 126 175C125 200 135 215 145 225C125 255 150 295 200 295C250 295 275 255 255 225C265 215 275 200 274 175C272 120 220 115 200 142Z', 'tan'),
  ...eye(170, 180, 11),
  ...eye(230, 180, 11),
  I(ellipse(192, 230, 4, 6)),
  I(ellipse(208, 230, 4, 6)),
  S(circle(152, 240, 9), 'pink'),
  S(circle(248, 240, 9), 'pink'),
  ...shut(D('M170 256Q200 280 230 256')),
  ...mouth(200, 266, 22, 18),
];

// ---------------------------------------------------------------------------
// Reused pictures from the coloring game
// ---------------------------------------------------------------------------
const CAT = fromPicture('kitty', { drop: [0, 1], quiet: [19], extra: mouth(200, 214, 13, 11) });
const DOG = fromPicture('puppy', {
  drop: [0, 1], quiet: [13, 15],
  extra: open(I(ellipse(200, 223, 15, 13), MOUTH), I(ellipse(200, 230, 9, 6), TONGUE)),
});
const PIG = fromPicture('piggy', { drop: [0, 1, 2], quiet: [19], extra: mouth(200, 244, 16, 12) });
const FROG = fromPicture('froggy', { drop: [0, 1], quiet: [16], extra: mouth(200, 248, 38, 16) });
const OWL = fromPicture('owl', {
  drop: [0, 1, 2, 3, 4],
  extra: open(
    I(ellipse(200, 226, 14, 13), MOUTH),
    S(poly(190, 230, 210, 230, 200, 248), 'orange'),
    S(poly(187, 204, 213, 204, 200, 226), 'orange'),
  ),
});
const BEE = fromPicture('bee', { drop: [0, 1, 2], quiet: [15], extra: mouth(91, 246, 12, 10) });

// ---------------------------------------------------------------------------
// The list. says = the sound word, bg = tile colors.
// ---------------------------------------------------------------------------
export const ANIMALS = [
  { id: 'cow', name: 'Cow', says: 'moo', word: 'MOO!', shapes: COW, view: '18 30 364 364', bg: ['#d8f6ff', '#8fdcff'], ink: '#ff3d9a' },
  { id: 'pig', name: 'Pig', says: 'oink oink', word: 'OINK!', shapes: PIG, view: '38 53 338 338', bg: ['#ffe4f2', '#ffaad6'], ink: '#ff3d9a' },
  { id: 'duck', name: 'Duck', says: 'quack quack', word: 'QUACK!', shapes: DUCK, view: '20 40 360 360', bg: ['#dff4ff', '#7fc8ff'], ink: '#ff8a1f' },
  { id: 'dog', name: 'Dog', says: 'woof woof', word: 'WOOF!', shapes: DOG, view: '61 77 314 314', bg: ['#fff5d6', '#ffd36b'], ink: '#a7663c' },
  { id: 'cat', name: 'Cat', says: 'meow', word: 'MEOW!', shapes: CAT, view: '70 49 335 335', bg: ['#e9e1ff', '#b9a0ff'], ink: '#ff8a1f' },
  { id: 'sheep', name: 'Sheep', says: 'baa', word: 'BAA!', shapes: SHEEP, view: '18 40 364 364', bg: ['#e7ffe0', '#9fe68a'], ink: '#8048ff' },
  { id: 'horse', name: 'Horse', says: 'neigh', word: 'NEIGH!', shapes: HORSE, view: '20 30 364 364', bg: ['#fff0dc', '#ffc78a'], ink: '#a7663c' },
  { id: 'chicken', name: 'Chicken', says: 'cluck cluck', word: 'CLUCK!', shapes: HEN, view: '18 36 364 364', bg: ['#e2fbff', '#86e2f0'], ink: '#ff4d5e' },
  { id: 'frog', name: 'Frog', says: 'ribbit', word: 'RIBBIT!', shapes: FROG, view: '40 98 320 320', bg: ['#e0f1ff', '#8ec5ff'], ink: '#25a55f' },
  { id: 'lion', name: 'Lion', says: 'roar', word: 'ROAR!', shapes: LION, view: '18 26 364 364', bg: ['#fff7cc', '#ffe066'], ink: '#ff8a1f' },
  { id: 'owl', name: 'Owl', says: 'hoo hoo', word: 'HOO HOO!', shapes: OWL, view: '20 39 360 360', bg: ['#dcd6ff', '#8f86ff'], ink: '#5420c4' },
  { id: 'bee', name: 'Bee', says: 'buzz', word: 'BUZZ!', shapes: BEE, view: '38 40 320 320', bg: ['#e6fff0', '#a2f2c0'], ink: '#c98a00' },
  { id: 'elephant', name: 'Elephant', says: 'toot toot', word: 'TOOT!', shapes: ELEPHANT, view: '6 40 388 388', bg: ['#ffe6ec', '#ffb0c2'], ink: '#8048ff' },
  { id: 'mouse', name: 'Mouse', says: 'squeak', word: 'SQUEAK!', shapes: MOUSE, view: '28 46 360 360', bg: ['#fff1e0', '#ffcf9e'], ink: '#ff3d9a' },
  { id: 'monkey', name: 'Monkey', says: 'ooh ooh, aah aah', word: 'OOH AAH!', shapes: MONKEY, view: '30 50 340 340', bg: ['#f0ffd6', '#c6ef7a'], ink: '#a7663c' },
];

/** SVG markup for an animal portrait. */
export function animalSVG(a) {
  let body = '';
  let grp = null;
  for (const s of a.shapes) {
    if (s.grp !== grp) {
      if (grp) body += '</g>';
      if (s.grp) body += `<g class="${s.grp}">`;
      grp = s.grp || null;
    }
    body += pictureMarkup({ shapes: [s] }, { fill: () => s.c });
  }
  if (grp) body += '</g>';
  return `<svg class="a-svg" viewBox="${a.view}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
}
