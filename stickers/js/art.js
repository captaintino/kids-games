// Sticker Scene: every sticker. Most are drawn here as little SVGs on a 200 x 200
// sheet (bold shapes, thick ink outlines); a few dozen small extras are emoji.
//
// Friends carry "anchors" (where a hat, glasses or a nose go) so dress-up stickers
// can snap onto them. Anchors and attach points are in sticker units: the sticker
// is 1 wide, (0, 0) is its center.
import { star, cloud } from '../../shared/js/pictures.js';

const INK = '#2d2442';
const O = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
const O4 = `stroke="${INK}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"`;
const NOFILL = 'fill="none"';

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${inner}</svg>`;
const eye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>` +
  `<circle cx="${x - r * 0.35}" cy="${y - r * 0.38}" r="${r * 0.38}" fill="#fff"/>`;
const blush = (x, y, rx = 8) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.6}" fill="#ff7aa8" opacity=".55"/>`;
const smile = (x, y, w) => `<path d="M${x - w} ${y}Q${x} ${y + w * 0.9} ${x + w} ${y}" ${NOFILL} stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`;
const p = (d, fill, o = O) => `<path d="${d}" fill="${fill}" ${o}/>`;
const c = (x, y, r, fill, o = O) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${o}/>`;
const el = (x, y, rx, ry, fill, o = O, rot = 0) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${o}${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}/>`;
const shine = (x, y, rx, ry, rot = -30) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".7" transform="rotate(${rot} ${x} ${y})"/>`;
const line = (d, w = 4.5) => `<path d="${d}" ${NOFILL} stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
// a thick colored stroke with an ink edge (tails, stems, strings)
const rope = (d, color, w = 11) => `<path d="${d}" ${NOFILL} stroke="${INK}" stroke-width="${w + 11}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" ${NOFILL} stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const heartD = (x, y, s) => `M${x} ${y + s * 0.9}C${x - s * 1.5} ${y - s * 0.1} ${x - s * 0.9} ${y - s * 1.25} ${x} ${y - s * 0.45}` +
  `C${x + s * 0.9} ${y - s * 1.25} ${x + s * 1.5} ${y - s * 0.1} ${x} ${y + s * 0.9}Z`;

// Anchors for a friend whose head is a circle at (hx, hy) radius hr (in 200px units).
function anchors(hx, hy, hr, o = {}) {
  const u = (v) => v / 200;
  const ex = o.eyeX != null ? o.eyeX : hx;
  const ey = o.eyeY != null ? o.eyeY : hy - hr * 0.05;
  return {
    head: { x: u(hx) - 0.5, y: u(o.top != null ? o.top : hy - hr * 0.8) - 0.5, w: u(hr * 1.8) },
    brow: { x: u(hx) - 0.5, y: u(hy - hr * 0.28) - 0.5, w: u(hr * 2.05) },
    face: { x: u(hx) - 0.5, y: u(hy) - 0.5, w: u(hr * 2) },
    eyes: { x: u(ex) - 0.5, y: u(ey) - 0.5, w: u(o.eyeSpan || hr * 0.75) },
    nose: { x: u(o.noseX != null ? o.noseX : hx) - 0.5, y: u(o.noseY != null ? o.noseY : hy + hr * 0.3) - 0.5, w: u(hr * 0.9) },
  };
}

// ---------------------------------------------------------------------------
// Friends (characters to dress up)
// ---------------------------------------------------------------------------
const kitty = svg(
  rope('M136 170Q186 166 172 116', '#ff9a2e', 13) +
  el(100, 158, 42, 34, '#ff9a2e') + el(100, 166, 22, 18, '#ffe2bf', 'stroke="none"') +
  el(80, 188, 15, 9, '#ff9a2e') + el(120, 188, 15, 9, '#ff9a2e') +
  p('M60 74L58 28L96 50Z', '#ff9a2e') + p('M140 74L142 28L104 50Z', '#ff9a2e') +
  p('M66 62L65 40L84 52Z', '#ff9fc7', 'stroke="none"') + p('M134 62L135 40L116 52Z', '#ff9fc7', 'stroke="none"') +
  c(100, 88, 46, '#ff9a2e') +
  line('M92 50L94 60M100 48V60M108 50L106 60', 4) +
  eye(82, 84, 7.5) + eye(118, 84, 7.5) + blush(70, 102) + blush(130, 102) +
  p('M94 96H106L100 103Z', '#ff6f9d', O4) +
  line('M92 108Q96 113 100 108Q104 113 108 108', 4) +
  line('M50 96L68 99M50 108L68 106M150 96L132 99M150 108L132 106', 3.5));

const puppy = svg(
  el(100, 160, 42, 32, '#e9b07c') + el(100, 167, 22, 17, '#fff1e0', 'stroke="none"') +
  el(80, 188, 15, 9, '#e9b07c') + el(120, 188, 15, 9, '#e9b07c') +
  rope('M138 168Q164 160 162 138', '#e9b07c', 10) +
  c(100, 86, 46, '#e9b07c') +
  el(56, 92, 16, 32, '#a7663c', O, 18) + el(144, 92, 16, 32, '#a7663c', O, -18) +
  el(116, 66, 14, 11, '#a7663c', 'stroke="none"') +
  eye(82, 80, 7.5) + eye(118, 80, 7.5) +
  el(100, 104, 24, 18, '#fff1e0', O4) +
  el(100, 96, 9, 6.5, INK, 'stroke="none"') +
  line('M100 102V108M90 108Q100 116 110 108', 4) +
  p('M95 111Q95 124 101 124Q107 124 106 111Z', '#ff6f9d', O4) +
  blush(68, 100) + blush(132, 100));

const bunny = svg(
  el(100, 162, 40, 32, '#ffffff') + el(100, 168, 20, 16, '#ffe0ee', 'stroke="none"') +
  c(140, 172, 12, '#ffffff') +
  el(80, 189, 15, 9, '#ffffff') + el(120, 189, 15, 9, '#ffffff') +
  el(80, 44, 14, 36, '#ffffff', O, -8) + el(120, 44, 14, 36, '#ffffff', O, 8) +
  el(80, 46, 6, 24, '#ffb3d1', 'stroke="none"', -8) + el(120, 46, 6, 24, '#ffb3d1', 'stroke="none"', 8) +
  c(100, 100, 44, '#ffffff') +
  eye(83, 96, 7.5) + eye(117, 96, 7.5) + blush(70, 112) + blush(130, 112) +
  el(100, 108, 6, 4.5, '#ff6f9d', O4) +
  line('M100 112V117M92 118Q96 122 100 117Q104 122 108 117', 4) +
  `<rect x="94" y="119" width="12" height="9" rx="2" fill="#fff" ${O4}/>`);

const bear = svg(
  el(100, 160, 44, 34, '#b97a4a') + el(100, 166, 24, 18, '#f0c99a', 'stroke="none"') +
  el(78, 188, 16, 9, '#b97a4a') + el(122, 188, 16, 9, '#b97a4a') +
  c(62, 50, 17, '#b97a4a') + c(138, 50, 17, '#b97a4a') + c(62, 50, 8, '#f0c99a', 'stroke="none"') + c(138, 50, 8, '#f0c99a', 'stroke="none"') +
  c(100, 88, 47, '#b97a4a') +
  eye(82, 82, 7.5) + eye(118, 82, 7.5) +
  el(100, 106, 22, 17, '#f0c99a', O4) +
  el(100, 99, 8.5, 6, INK, 'stroke="none"') +
  line('M100 104V110M91 110Q100 118 109 110', 4) +
  blush(66, 102) + blush(134, 102));

const knight = svg(
  // armor body and arms
  el(56, 152, 13, 22, '#c9d1df', O, 20) + el(144, 152, 13, 22, '#c9d1df', O, -20) +
  p('M58 196V150Q58 124 100 124Q142 124 142 150V196Z', '#c9d1df') +
  p('M78 196V136H122V196Z', '#3d7bff', O4) +
  p(star(100, 162, 15, 7), '#ffd93b', O4) +
  line('M58 150H78M122 150H142', 4) +
  // head and hair
  c(100, 82, 42, '#ffd2a6') +
  p('M58 82Q56 40 100 40Q144 40 142 82Q130 70 120 58Q112 70 98 64Q88 72 74 62Q66 74 58 82Z', '#a7663c') +
  eye(84, 86, 7) + eye(116, 86, 7) + blush(72, 102) + blush(128, 102) +
  smile(100, 104, 10));

const alien = svg(
  rope('M78 46Q70 26 60 18', '#7be35a', 4) + rope('M122 46Q130 26 140 18', '#7be35a', 4) +
  c(58, 16, 10, '#ffd93b') + c(142, 16, 10, '#ffd93b') +
  p('M70 196V156Q70 128 100 128Q130 128 130 156V196Z', '#7be35a') +
  `<rect x="70" y="170" width="60" height="12" fill="#9d5cff" ${O4}/>` +
  c(100, 176, 6, '#ffd93b', O4) +
  el(62, 166, 10, 20, '#7be35a', O, 25) + el(138, 166, 10, 20, '#7be35a', O, -25) +
  el(100, 84, 56, 46, '#7be35a') +
  el(78, 82, 15, 19, INK, 'stroke="none"', -10) + el(122, 82, 15, 19, INK, 'stroke="none"', 10) +
  c(73, 75, 6, '#fff', 'stroke="none"') + c(117, 75, 6, '#fff', 'stroke="none"') +
  c(82, 90, 2.5, '#fff', 'stroke="none"') + c(126, 90, 2.5, '#fff', 'stroke="none"') +
  blush(62, 106) + blush(138, 106) + smile(100, 110, 10));

const fishFriend = svg(
  p('M50 104L12 70Q20 104 12 138Z', '#ff7ac6') +
  p('M84 60Q100 26 132 52Z', '#ff7ac6') + p('M90 148Q100 176 124 150Z', '#ff7ac6') +
  el(104, 104, 70, 52, '#3db8ff') +
  line('M70 62Q58 104 70 146', 4.5) + line('M88 56Q76 104 88 152', 4) +
  el(116, 128, 16, 6, '#8fe3ff', 'stroke="none"') +
  c(140, 92, 17, '#fff', O4) + c(144, 94, 9, INK, 'stroke="none"') + c(141, 90, 3.5, '#fff', 'stroke="none"') +
  blush(150, 118, 7) + line('M160 120Q166 126 172 120', 4));

// ---------------------------------------------------------------------------
// Hats (attach = brim bottom center; span = fraction of the sticker matching the anchor width)
// ---------------------------------------------------------------------------
const crown = svg(
  p('M46 152L40 76L72 108L100 60L128 108L160 76L154 152Z', '#ffd93b') +
  `<rect x="44" y="128" width="112" height="24" rx="7" fill="#ffb020" ${O}/>` +
  c(40, 74, 9, '#ff7ac6') + c(100, 58, 10, '#ff7ac6') + c(160, 74, 9, '#ff7ac6') +
  c(72, 140, 6, '#3d9bff', O4) + c(100, 140, 7, '#ff4d5e', O4) + c(128, 140, 6, '#5cd65c', O4) +
  shine(72, 100, 8, 4, -55));

const cowboy = svg(
  p('M60 134Q54 72 80 64Q100 78 120 64Q146 72 140 134Z', '#b5713f') +
  `<path d="M60 118H140V134H60Z" fill="#6b3518" ${O4}/>` +
  p('M8 124Q28 152 100 152Q172 152 192 124Q180 112 162 124Q100 142 38 124Q20 112 8 124Z', '#c98a52') +
  line('M90 72Q100 80 110 72', 3.5) + c(124, 126, 5, '#ffd93b', O4));

const partyHat = svg(
  p('M60 152L100 34L140 152Z', '#ff7ac6') +
  c(90, 80, 6, '#ffd93b', 'stroke="none"') + c(110, 108, 7, '#3d9bff', 'stroke="none"') +
  c(84, 126, 7, '#5cd65c', 'stroke="none"') + c(118, 138, 6, '#ffd93b', 'stroke="none"') + c(104, 64, 5, '#3d9bff', 'stroke="none"') +
  el(100, 152, 46, 10, '#ffd93b') +
  p(cloud(100, 30, 15, 13, 7), '#9d5cff'));

const topHat = svg(
  `<rect x="62" y="40" width="76" height="98" rx="8" fill="#3a3550" ${O}/>` +
  `<rect x="62" y="110" width="76" height="20" fill="#ff4d5e" ${O4}/>` +
  el(100, 142, 66, 13, '#3a3550') +
  `<rect x="72" y="50" width="9" height="52" rx="4" fill="#fff" opacity=".25"/>` +
  p('M128 112l8 -12l6 10l-6 10z', '#ffd93b', O4));

const wizard = svg(
  p('M56 148Q84 100 90 60Q96 24 142 16Q116 40 120 74Q126 114 146 148Z', '#7d4dff') +
  p('M28 148Q100 126 172 148Q100 172 28 148Z', '#7d4dff') +
  p(star(96, 100, 12, 5.5), '#ffd93b', 'stroke="none"') + p(star(120, 128, 9, 4), '#ffd93b', 'stroke="none"') +
  p(star(108, 62, 8, 3.5), '#ffd93b', 'stroke="none"') + p(star(76, 134, 7, 3), '#ffd93b', 'stroke="none"') +
  c(142, 16, 9, '#ffd93b', O4));

const helmet = svg(
  p('M120 46Q150 10 176 30Q150 30 140 58Z', '#ff4d5e') +
  p('M42 154V108Q42 46 100 46Q158 46 158 108V154Z', '#c9d1df') +
  `<path d="M42 154V138H158V154Z" fill="#9aa4b8" ${O4}/>` +
  `<rect x="93" y="48" width="14" height="92" fill="#e9eef6" ${O4}/>` +
  c(56, 146, 3.5, INK, 'stroke="none"') + c(144, 146, 3.5, INK, 'stroke="none"') + c(76, 146, 3.5, INK, 'stroke="none"') + c(124, 146, 3.5, INK, 'stroke="none"') +
  shine(66, 82, 10, 5, -60));

const pirate = svg(
  p('M14 126Q34 54 100 66Q166 54 186 126Q144 108 100 140Q56 108 14 126Z', '#3a3550') +
  line('M28 118Q60 104 100 128Q140 104 172 118', 4) +
  `<path d="M28 118Q60 104 100 128Q140 104 172 118" fill="none" stroke="#ffd93b" stroke-width="3"/>` +
  line('M84 110L116 84M84 84L116 110', 6) + `<path d="M84 110L116 84M84 84L116 110" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` +
  c(100, 92, 13, '#ffffff', O4) + c(95, 90, 3, INK, 'stroke="none"') + c(105, 90, 3, INK, 'stroke="none"'));

const bow = svg(
  p('M100 124Q66 74 36 92Q22 120 40 148Q66 152 100 124Z', '#ff7ac6') +
  p('M100 124Q134 74 164 92Q178 120 160 148Q134 152 100 124Z', '#ff7ac6') +
  line('M50 102Q60 118 72 122M150 102Q140 118 128 122', 4) +
  el(100, 124, 16, 18, '#ff3d9a') + shine(48, 106, 7, 4));

const spaceHelmet = svg(
  `<rect x="44" y="164" width="112" height="26" rx="12" fill="#c9d1df" ${O}/>` +
  c(100, 98, 80, 'rgba(190,234,255,.32)', O) +
  `<path d="M52 82Q60 44 98 32" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".85"/>` +
  `<path d="M150 128Q144 148 128 158" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>` +
  c(64, 177, 4, '#ff4d5e', 'stroke="none"') + c(136, 177, 4, '#5cd65c', 'stroke="none"'));

// ---------------------------------------------------------------------------
// Glasses and faces (attach = center)
// ---------------------------------------------------------------------------
const sunglasses = svg(
  line('M30 92L16 84M170 92L184 84', 6) +
  p('M28 86Q28 78 40 78H86Q96 78 94 90L90 112Q86 128 62 128Q34 128 30 110Z', '#3a3550') +
  p('M172 86Q172 78 160 78H114Q104 78 106 90L110 112Q114 128 138 128Q166 128 170 110Z', '#3a3550') +
  line('M94 88Q100 82 106 88', 6) +
  `<path d="M42 90L56 90M128 90L142 90" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>` +
  `<path d="M46 104L76 86M120 104L150 86" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>`);

const starGlasses = svg(
  line('M94 98Q100 92 106 98', 6) +
  p(star(62, 100, 38, 21), '#ff7ac6') + p(star(138, 100, 38, 21), '#ff7ac6') +
  c(62, 102, 14, '#bfeaff', O4) + c(138, 102, 14, '#bfeaff', O4) +
  c(57, 97, 4, '#fff', 'stroke="none"') + c(133, 97, 4, '#fff', 'stroke="none"'));

const heartGlasses = svg(
  line('M92 94Q100 88 108 94', 6) +
  p(heartD(62, 100, 30), '#ff4d5e') + p(heartD(138, 100, 30), '#ff4d5e') +
  p(heartD(62, 100, 17), '#ffb3c9', O4) + p(heartD(138, 100, 17), '#ffb3c9', O4) +
  shine(52, 88, 6, 3) + shine(128, 88, 6, 3));

const roundGlasses = svg(
  line('M36 96L16 88M164 96L184 88', 6) + line('M90 96Q100 88 110 96', 6) +
  c(62, 100, 28, 'rgba(210,240,255,.55)') + c(138, 100, 28, 'rgba(210,240,255,.55)') +
  `<circle cx="62" cy="100" r="28" fill="none" stroke="#3d7bff" stroke-width="5"/>` +
  `<circle cx="138" cy="100" r="28" fill="none" stroke="#3d7bff" stroke-width="5"/>` +
  `<path d="M48 92Q52 82 62 80M124 92Q128 82 138 80" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`);

const monocle = svg(
  line('M138 128Q130 168 92 176Q66 180 58 160', 4) +
  c(138, 100, 28, 'rgba(210,240,255,.5)') +
  `<circle cx="138" cy="100" r="28" fill="none" stroke="#ffc21f" stroke-width="6"/>` +
  `<path d="M124 92Q128 82 138 80" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
  c(58, 158, 6, '#ffc21f', O4));

const goggles = svg(
  p('M10 98Q10 88 26 88H38V110H26Q10 110 10 98Z', '#ff9a2e') + p('M190 98Q190 88 174 88H162V110H174Q190 110 190 98Z', '#ff9a2e') +
  p('M34 80Q34 66 52 66H148Q166 66 166 80V118Q166 134 148 134H118Q108 134 100 120Q92 134 82 134H52Q34 134 34 118Z', '#ffd93b') +
  p('M46 84Q46 78 56 78H144Q154 78 154 84V114Q154 122 144 122H120Q110 122 100 108Q90 122 80 122H56Q46 122 46 114Z', '#8fe3ff', O4) +
  `<path d="M58 88L80 88M120 88L134 88" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
  rope('M166 78Q186 60 180 16', '#5cd65c', 8));

const mustache = svg(
  p('M100 92Q86 78 66 86Q44 96 32 82Q26 110 56 116Q84 120 100 104Q116 120 144 116Q174 110 168 82Q156 96 134 86Q114 78 100 92Z', '#6b3518') +
  `<path d="M60 96Q76 92 92 100M140 96Q124 92 108 100" fill="none" stroke="#a7663c" stroke-width="4" stroke-linecap="round"/>`);

const clownNose = svg(c(100, 100, 30, '#ff4d5e') + shine(90, 88, 10, 6));

// ---------------------------------------------------------------------------
// Flowers, sea, space and fun things
// ---------------------------------------------------------------------------
const petals = (cx, cy, n, r, pr, fill) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360;
    const x = cx + Math.cos((a * Math.PI) / 180) * r;
    const y = cy + Math.sin((a * Math.PI) / 180) * r;
    s += el(Math.round(x), Math.round(y), pr, pr * 0.55, fill, O4, a);
  }
  return s;
};
const daisy = svg(
  rope('M100 110Q96 150 100 192', '#5cd65c', 9) + el(124, 160, 18, 9, '#5cd65c', O4, -30) +
  petals(100, 76, 10, 38, 22, '#ffffff') + c(100, 76, 22, '#ffd93b') +
  eye(92, 74, 4) + eye(108, 74, 4) + line('M94 84Q100 89 106 84', 3.5));

const tulip = svg(
  rope('M100 118Q102 156 98 192', '#5cd65c', 9) +
  p('M98 190Q60 170 58 128Q84 138 98 170Z', '#25a55f', O4) +
  p('M60 62Q58 124 100 128Q142 124 140 62Q124 80 118 76Q110 50 100 46Q90 50 82 76Q76 80 60 62Z', '#ff4d5e') +
  line('M100 52V122', 4) + shine(78, 86, 6, 12, 0));

const sunflower = svg(
  rope('M100 120Q104 160 100 194', '#5cd65c', 9) + el(76, 162, 18, 9, '#5cd65c', O4, 30) +
  p(star(100, 76, 70, 42, 14), '#ffd93b') + c(100, 76, 34, '#a7663c') +
  eye(89, 72, 5) + eye(111, 72, 5) + smile(100, 84, 9) + blush(82, 86, 5) + blush(118, 86, 5));

const mushroom = svg(
  p('M76 110Q70 180 100 182Q130 180 124 110Z', '#fff1d6') +
  p('M24 116Q24 36 100 32Q176 36 176 116Q100 132 24 116Z', '#ff4d5e') +
  c(66, 76, 11, '#fff', 'stroke="none"') + c(108, 56, 13, '#fff', 'stroke="none"') + c(146, 88, 10, '#fff', 'stroke="none"') + c(96, 100, 8, '#fff', 'stroke="none"') +
  eye(90, 148, 5) + eye(110, 148, 5) + smile(100, 158, 7));

const starfish = svg(
  p(star(100, 106, 88, 40), '#ff9a2e') +
  c(100, 64, 5, '#ffd36b', 'stroke="none"') + c(56, 98, 5, '#ffd36b', 'stroke="none"') + c(144, 98, 5, '#ffd36b', 'stroke="none"') +
  c(72, 150, 5, '#ffd36b', 'stroke="none"') + c(128, 150, 5, '#ffd36b', 'stroke="none"') +
  eye(88, 104, 6) + eye(112, 104, 6) + smile(100, 116, 9) + blush(80, 120, 6) + blush(120, 120, 6));

const shell = svg(
  p('M100 172L78 156Q22 140 24 92Q30 34 100 30Q170 34 176 92Q178 140 122 156Z', '#ffb3d1') +
  line('M100 160L100 40M100 160L64 46M100 160L136 46M100 160L38 74M100 160L162 74M100 160L28 112M100 160L172 112', 4) +
  p('M78 156Q100 186 122 156Z', '#ff8fc0', O4));

const bubbles = svg(
  c(80, 120, 46, 'rgba(190,234,255,.45)') + c(142, 66, 28, 'rgba(190,234,255,.45)') + c(146, 148, 18, 'rgba(190,234,255,.45)') +
  `<path d="M54 108Q58 88 76 82" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>` +
  `<path d="M128 58Q132 48 142 46" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
  c(140, 142, 4, '#fff', 'stroke="none"'));

const smallFish = svg(
  p('M44 100L10 72Q18 100 10 128Z', '#ff9a2e') +
  el(100, 100, 62, 44, '#ffd93b') +
  `<path d="M74 60Q64 100 74 140" fill="none" stroke="#ff9a2e" stroke-width="12"/>` +
  `<path d="M104 56Q94 100 104 144" fill="none" stroke="#ff9a2e" stroke-width="12"/>` +
  el(100, 100, 62, 44, 'none') +
  c(134, 90, 13, '#fff', O4) + c(137, 92, 7, INK, 'stroke="none"') + c(134, 88, 2.5, '#fff', 'stroke="none"') +
  line('M148 112Q154 118 160 112', 4));

const seaweed = svg(
  rope('M70 196Q50 160 74 128Q96 96 70 60Q56 40 66 18', '#25a55f', 14) +
  rope('M120 196Q146 168 124 136Q102 104 132 74Q148 56 140 34', '#5cd65c', 14) +
  c(84, 100, 6, '#bfeaff', O4) + c(140, 120, 5, '#bfeaff', O4));

const rocket = svg(
  p('M76 150Q60 176 72 196Q86 178 100 172Q114 178 128 196Q140 176 124 150Z', '#ffd93b') +
  p('M86 150Q90 172 100 182Q110 172 114 150Z', '#ff9a2e', O4) +
  p('M64 120L40 160L72 150Z', '#ff4d5e') + p('M136 120L160 160L128 150Z', '#ff4d5e') +
  p('M100 14Q146 50 138 152H62Q54 50 100 14Z', '#ffffff') +
  p('M100 14Q122 30 132 56H68Q78 30 100 14Z', '#ff4d5e') +
  c(100, 92, 20, '#8fe3ff') + shine(94, 86, 6, 4) +
  `<rect x="78" y="128" width="44" height="10" rx="5" fill="#3d7bff" ${O4}/>`);

const planet = svg(
  `<path d="M24 120Q8 140 46 140Q100 140 170 96Q200 72 176 72" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>` +
  `<path d="M24 120Q8 140 46 140Q100 140 170 96Q200 72 176 72" fill="none" stroke="#ffd93b" stroke-width="9" stroke-linecap="round"/>` +
  c(100, 100, 56, '#9d5cff') +
  `<path d="M52 72Q100 84 150 74M46 106Q100 120 154 104" fill="none" stroke="#c9a3ff" stroke-width="8" stroke-linecap="round"/>` +
  `<path d="M34 118Q100 148 166 82" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>` +
  `<path d="M34 118Q100 148 166 82" fill="none" stroke="#ffd93b" stroke-width="9" stroke-linecap="round"/>` +
  shine(78, 70, 12, 6));

const moon = svg(
  p('M132 18Q48 26 44 100Q44 174 132 182Q92 156 92 100Q92 44 132 18Z', '#ffe86b') +
  line('M58 92Q65 98 72 92', 4) + blush(62, 110, 6) + line('M60 122Q68 130 76 124', 4) +
  c(150, 60, 5, '#fff', 'stroke="none"') + c(164, 120, 4, '#fff', 'stroke="none"') + c(128, 96, 3, '#fff', 'stroke="none"'));

const ufo = svg(
  p('M70 106Q70 52 100 52Q130 52 130 106Z', 'rgba(190,234,255,.7)') +
  c(100, 86, 14, '#7be35a', O4) + eye(95, 84, 3) + eye(105, 84, 3) +
  el(100, 114, 82, 26, '#b3b9c6') +
  el(100, 106, 50, 10, '#e2e6ee', O4) +
  c(46, 116, 6, '#ffd93b', O4) + c(74, 124, 6, '#ff4d5e', O4) + c(126, 124, 6, '#5cd65c', O4) + c(154, 116, 6, '#3d9bff', O4) +
  `<path d="M74 142L56 192H144L126 142Z" fill="#fff59a" opacity=".55"/>`);

const happyStar = svg(
  p(star(100, 104, 90, 42), '#ffd93b') +
  eye(86, 100, 6.5) + eye(114, 100, 6.5) + smile(100, 114, 10) + blush(76, 118, 6) + blush(124, 118, 6) +
  shine(78, 64, 8, 4, -50));

const rainbow = svg(
  p('M10 150A90 90 0 0 1 190 150H166A66 66 0 0 0 34 150Z', '#ff4d5e') +
  p('M34 150A66 66 0 0 1 166 150H146A46 46 0 0 0 54 150Z', '#ffd93b') +
  p('M54 150A46 46 0 0 1 146 150H128A28 28 0 0 0 72 150Z', '#3d9bff') +
  p(cloud(30, 152, 26, 18, 7), '#ffffff') + p(cloud(170, 152, 26, 18, 7), '#ffffff'));

const heart = svg(p(heartD(100, 100, 58), '#ff4d5e') + shine(70, 70, 14, 8, -40));

const balloon = svg(
  `<path d="M100 150Q86 170 104 182Q118 192 100 200" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
  p('M100 150Q40 130 44 72Q50 20 100 20Q150 20 156 72Q160 130 100 150Z', '#3d9bff') +
  p('M92 148L108 148L104 160L96 160Z', '#3d9bff', O4) + shine(74, 58, 12, 18, 20));

const sunny = svg(
  p(star(100, 100, 92, 66, 12), '#ff9a2e') + c(100, 100, 56, '#ffd93b') +
  eye(84, 94, 7) + eye(116, 94, 7) + smile(100, 110, 14) + blush(72, 114, 8) + blush(128, 114, 8));

const fluffy = svg(
  p(cloud(100, 106, 78, 50, 9), '#ffffff') +
  eye(84, 104, 6.5) + eye(116, 104, 6.5) + smile(100, 116, 9) + blush(74, 120, 7) + blush(126, 120, 7));

// ---------------------------------------------------------------------------
// Farm, town and winter things (for the Farm, City and Winter worlds)
// ---------------------------------------------------------------------------
const cow = svg(
  rope('M138 166Q178 158 168 118', '#ffffff', 8) + p(cloud(168, 112, 9, 9, 6), '#3a3550', O4) +
  el(100, 160, 44, 32, '#ffffff') +
  el(84, 152, 13, 9, '#3a3550', 'stroke="none"', -15) + el(122, 170, 10, 7, '#3a3550', 'stroke="none"', 10) +
  el(78, 188, 15, 9, '#ffffff') + el(122, 188, 15, 9, '#ffffff') +
  `<path d="M68 192H88M112 192H132" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
  p('M68 56Q50 36 60 18Q70 34 82 46Z', '#ffe9b0') + p('M132 56Q150 36 140 18Q130 34 118 46Z', '#ffe9b0') +
  el(50, 78, 19, 10, '#ffffff', O, -22) + el(150, 78, 19, 10, '#ffffff', O, 22) +
  el(52, 79, 10, 4.5, '#ffb3c9', 'stroke="none"', -22) + el(148, 79, 10, 4.5, '#ffb3c9', 'stroke="none"', 22) +
  c(100, 86, 45, '#ffffff') +
  el(124, 62, 13, 9, '#3a3550', 'stroke="none"', 25) + el(74, 70, 8, 6, '#3a3550', 'stroke="none"', -20) +
  eye(84, 80, 7) + eye(116, 80, 7) +
  el(100, 110, 30, 19, '#ffb3c9', O4) +
  el(90, 106, 3.5, 5, INK, 'stroke="none"') + el(110, 106, 3.5, 5, INK, 'stroke="none"') +
  line('M92 118Q100 124 108 118', 4) + blush(66, 98) + blush(134, 98));

const pig = svg(
  rope('M140 160Q156 152 152 142Q148 132 140 138', '#ffb3c9', 6) +
  el(100, 160, 42, 32, '#ffb3c9') + el(100, 166, 22, 17, '#ffd3e2', 'stroke="none"') +
  el(80, 188, 15, 9, '#ffb3c9') + el(120, 188, 15, 9, '#ffb3c9') +
  p('M62 64L54 28L92 46Z', '#ff9cbf') + p('M138 64L146 28L108 46Z', '#ff9cbf') +
  c(100, 88, 46, '#ffb3c9') +
  eye(82, 80, 7.5) + eye(118, 80, 7.5) +
  el(100, 104, 21, 15, '#ff8fb5', O4) +
  el(93, 104, 3.5, 5.5, INK, 'stroke="none"') + el(107, 104, 3.5, 5.5, INK, 'stroke="none"') +
  smile(100, 121, 9) + blush(66, 100) + blush(134, 100));

const sheep = svg(
  `<path d="M80 168V194M120 168V194" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>` +
  `<path d="M80 168V192M120 168V192" stroke="#4a4060" stroke-width="7" stroke-linecap="round"/>` +
  p(cloud(100, 152, 56, 34, 11), '#ffffff') +
  el(58, 92, 17, 8, '#4a4060', O, -25) + el(142, 92, 17, 8, '#4a4060', O, 25) +
  el(100, 96, 30, 36, '#4a4060') +
  p(cloud(100, 62, 34, 16, 7), '#ffffff') +
  c(88, 94, 8, '#ffffff', O4) + c(112, 94, 8, '#ffffff', O4) +
  c(89, 95, 4.5, INK, 'stroke="none"') + c(113, 95, 4.5, INK, 'stroke="none"') +
  c(87.5, 93.5, 1.6, '#fff', 'stroke="none"') + c(111.5, 93.5, 1.6, '#fff', 'stroke="none"') +
  el(80, 110, 6, 3.6, '#ff7aa8', 'stroke="none"') + el(120, 110, 6, 3.6, '#ff7aa8', 'stroke="none"') +
  `<path d="M92 116Q100 123 108 116" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`);

const hen = svg(
  `<path d="M88 166V188L78 192M88 188L96 192M112 166V188L104 192M112 188L120 192" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="M88 166V188L78 192M88 188L96 192M112 166V188L104 192M112 188L120 192" fill="none" stroke="#ff9a2e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
  p('M58 116Q24 76 44 56Q56 84 76 96Z', '#ffffff') +
  el(100, 130, 50, 40, '#ffffff') +
  p('M128 40Q130 26 140 30Q146 18 156 26Q168 24 164 40Z', '#ff4d5e') +
  c(142, 66, 28, '#ffffff') +
  p('M120 92Q144 120 134 140Q112 128 108 110Z', '#ffffff', 'stroke="none"') +
  p('M166 62L186 70L166 78Z', '#ffc21f', O4) +
  el(160, 88, 6, 10, '#ff4d5e', O4) +
  el(92, 130, 26, 18, '#f1ece4', O4, -15) + line('M76 134Q92 144 110 130', 4) +
  eye(148, 60, 6) + blush(140, 78, 6));

const tractor = svg(
  `<rect x="128" y="34" width="10" height="44" fill="#5b5670" ${O4}/>` +
  p('M96 84H176Q184 84 184 92V122Q184 130 176 130H96Z', '#43b649') +
  `<path d="M150 96V124M160 96V124M170 96V124" stroke="#2f8f3a" stroke-width="4"/>` +
  c(178, 98, 6, '#fff59a', O4) +
  p('M34 132L38 40H102L108 132Z', '#43b649') +
  p('M48 92L50 54H92L94 92Z', '#bfeaff', O4) +
  c(72, 80, 11, '#ffd2a6', O4) + p('M60 76Q60 62 72 62Q84 62 84 76Z', '#ff4d5e', O4) + c(76, 80, 2, INK, 'stroke="none"') +
  `<rect x="26" y="30" width="88" height="14" rx="6" fill="#ffd93b" ${O}/>` +
  c(66, 146, 40, '#3a3550') + c(66, 146, 22, '#ffd93b', O4) + c(66, 146, 7, '#fff6c8', O4) +
  c(156, 160, 26, '#3a3550') + c(156, 160, 13, '#ffd93b', O4) + c(156, 160, 4, '#fff6c8', O4) +
  p('M22 128Q26 88 66 88Q106 88 110 128Z', '#ffd93b'));

const haybale = svg(
  p('M70 56H150Q182 56 182 102Q182 150 150 150H70Z', '#e9b543') +
  line('M96 80H160M96 102H170M96 124H160', 4) +
  c(70, 103, 50, '#ffd766') +
  `<path d="M70 103m-6 0a6 6 0 1 1 12 0a12 12 0 1 1 -24 0a18 18 0 1 1 36 0a24 24 0 1 1 -48 0a30 30 0 1 1 60 0a36 36 0 1 1 -72 0" fill="none" stroke="#d9a23a" stroke-width="5" stroke-linecap="round"/>` +
  line('M40 176L54 150M152 174L144 152', 4));

const strawHat = svg(
  p('M8 132Q30 156 100 156Q170 156 192 132Q168 118 100 126Q32 118 8 132Z', '#f5c95a') +
  p('M54 128Q50 70 100 66Q150 70 146 128Q100 136 54 128Z', '#f5c95a') +
  p('M54 112Q100 122 146 112L147 126Q100 136 53 126Z', '#ff4d5e', O4) +
  line('M70 84Q100 76 130 84M62 100Q100 92 138 100', 3) +
  p(cloud(132, 112, 10, 9, 5), '#ffd93b', O4));

const car = svg(
  p('M50 92L66 54Q70 46 80 46H128Q138 46 144 56L160 92Z', '#ff5d6d') +
  p('M70 88L80 60H102V88Z', '#c9eeff', O4) + p('M112 88V60H130Q136 60 138 66L146 88Z', '#c9eeff', O4) +
  p('M16 102Q16 88 34 88H170Q186 88 186 104V128Q186 138 176 138H24Q16 138 16 128Z', '#ff5d6d') +
  `<path d="M28 104H120" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>` +
  el(178, 106, 6, 8, '#fff59a', O4) + `<rect x="14" y="104" width="8" height="12" fill="#ffd93b" ${O4}/>` +
  c(56, 138, 22, '#3a3550') + c(56, 138, 9, '#c9d1df', O4) +
  c(148, 138, 22, '#3a3550') + c(148, 138, 9, '#c9d1df', O4));

const bus = svg(
  `<rect x="8" y="44" width="184" height="104" rx="18" fill="#ffc21f" ${O}/>` +
  `<rect x="8" y="114" width="184" height="10" fill="#2d2442"/>` +
  `<rect x="20" y="58" width="30" height="34" rx="6" fill="#c9eeff" ${O4}/>` +
  `<rect x="58" y="58" width="30" height="34" rx="6" fill="#c9eeff" ${O4}/>` +
  `<rect x="96" y="58" width="30" height="34" rx="6" fill="#c9eeff" ${O4}/>` +
  `<rect x="140" y="58" width="24" height="58" rx="4" fill="#c9eeff" ${O4}/>` +
  c(35, 82, 8, '#ffd2a6', 'stroke="none"') + c(111, 82, 8, '#a5673f', 'stroke="none"') + c(73, 80, 8, '#ffd2a6', 'stroke="none"') +
  `<path d="M140 87H164" stroke="${INK}" stroke-width="4"/>` +
  el(186, 104, 5, 8, '#fff59a', O4) + `<rect x="168" y="62" width="18" height="16" rx="4" fill="#ff4d5e" ${O4}/>` +
  c(50, 150, 20, '#3a3550') + c(50, 150, 8, '#c9d1df', O4) +
  c(156, 150, 20, '#3a3550') + c(156, 150, 8, '#c9d1df', O4));

const trafficLight = svg(
  `<rect x="92" y="150" width="16" height="46" fill="#5b5670" ${O4}/>` +
  `<rect x="60" y="8" width="80" height="150" rx="20" fill="#3a3550" ${O}/>` +
  c(100, 40, 20, '#ff4d5e', O4) + c(100, 83, 20, '#ffd93b', O4) + c(100, 126, 20, '#3ee07a', O4) +
  shine(93, 33, 6, 4) + shine(93, 76, 6, 4) + shine(93, 119, 6, 4) +
  eye(93, 124, 3) + eye(107, 124, 3) + line('M94 133Q100 137 106 133', 3));

const hardHat = svg(
  p('M34 132Q34 58 100 56Q166 58 166 132Z', '#ffc21f') +
  `<rect x="90" y="54" width="20" height="78" rx="6" fill="#ffd95a" ${O4}/>` +
  p('M14 132Q14 122 28 122H172Q188 122 188 132Q188 144 172 144H28Q14 144 14 132Z', '#ffb000') +
  shine(62, 88, 9, 5, -55));

const snowman = svg(
  line('M60 140L26 116M30 122L18 118M140 140L176 112M170 118L182 110', 5) +
  c(100, 158, 40, '#ffffff') + c(100, 150, 4, INK, 'stroke="none"') + c(100, 166, 4, INK, 'stroke="none"') +
  c(100, 74, 40, '#ffffff') +
  p('M66 104Q100 120 134 104L136 116Q100 132 64 116Z', '#ff4d5e') + p('M112 112L132 112L134 146L114 142Z', '#ff4d5e') +
  eye(86, 66, 6) + eye(114, 66, 6) + blush(76, 84, 6) + blush(124, 84, 6) +
  p('M98 76L132 84L98 90Z', '#ff9a2e', O4) +
  `<path d="M90 96Q100 101 110 96" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-dasharray="0.1 6"/>`);

const penguin = svg(
  el(80, 188, 16, 8, '#ff9a2e') + el(120, 188, 16, 8, '#ff9a2e') +
  el(48, 128, 12, 30, '#3a3550', O, 25) + el(152, 128, 12, 30, '#3a3550', O, -25) +
  el(100, 118, 54, 70, '#3a3550') +
  el(100, 132, 38, 52, '#ffffff', 'stroke="none"') +
  el(86, 82, 18, 20, '#ffffff', 'stroke="none"') + el(114, 82, 18, 20, '#ffffff', 'stroke="none"') +
  eye(88, 80, 6.5) + eye(112, 80, 6.5) +
  p('M90 94H110L100 108Z', '#ff9a2e', O4) +
  blush(74, 98, 6) + blush(126, 98, 6));

const snowflake = svg(
  [0, 60, 120].map((a) => `<g transform="rotate(${a} 100 100)">` +
    rope('M100 16V184M100 46L82 30M100 46L118 30M100 154L82 170M100 154L118 170', '#bfe9ff', 8) + '</g>').join('') +
  c(100, 100, 16, '#ffffff', O4) +
  eye(94, 98, 3.5) + eye(106, 98, 3.5) + line('M95 106Q100 109 105 106', 2.5));

const beanie = svg(
  p('M40 134Q36 64 100 60Q164 64 160 134Z', '#3d9bff') +
  line('M64 76V128M84 66V128M104 64V128M124 66V128M144 76V128', 3) +
  `<rect x="30" y="118" width="140" height="30" rx="14" fill="#ff4d5e" ${O}/>` +
  line('M48 124V142M66 124V142M84 124V142M102 124V142M120 124V142M138 124V142M156 124V142', 3) +
  p(cloud(100, 52, 18, 16, 8), '#ffffff'));

// ---------------------------------------------------------------------------
// The sticker list
// ---------------------------------------------------------------------------
export const CATS = [
  { key: 'friends', name: 'Friends', icon: '🐱' },
  { key: 'hats', name: 'Hats', icon: '🎩' },
  { key: 'glasses', name: 'Glasses', icon: '🕶️' },
  { key: 'flowers', name: 'Flowers', icon: '🌸' },
  { key: 'sea', name: 'Sea', icon: '🐠' },
  { key: 'space', name: 'Space', icon: '🚀' },
  { key: 'farm', name: 'Farm', icon: '🐮' },
  { key: 'town', name: 'Town', icon: '🚗' },
  { key: 'winter', name: 'Winter', icon: '⛄' },
  { key: 'fun', name: 'Fun', icon: '🌈' },
];

// kind: 'friend' (can wear things) / 'wear' (snaps onto a friend) / plain
// fit: which anchor a wearable snaps to, at: its own attach point, span: its width that matches the anchor
export const STICKERS = [
  { id: 'kitty', cat: 'friends', name: 'Kitty', svg: kitty, kind: 'friend', s: 1.3, voice: 'meow', anchors: anchors(100, 88, 46, { top: 52, eyeY: 84, eyeSpan: 36, noseY: 100 }) },
  { id: 'puppy', cat: 'friends', name: 'Puppy', svg: puppy, kind: 'friend', s: 1.3, voice: 'woof', anchors: anchors(100, 86, 46, { top: 48, eyeY: 80, eyeSpan: 36, noseY: 101 }) },
  { id: 'bunny', cat: 'friends', name: 'Bunny', svg: bunny, kind: 'friend', s: 1.3, voice: 'squeak', anchors: anchors(100, 100, 44, { top: 66, eyeY: 96, eyeSpan: 34, noseY: 112 }) },
  { id: 'bear', cat: 'friends', name: 'Teddy', svg: bear, kind: 'friend', s: 1.3, voice: 'growl', anchors: anchors(100, 88, 47, { top: 50, eyeY: 82, eyeSpan: 36, noseY: 104 }) },
  { id: 'knight', cat: 'friends', name: 'Knight', svg: knight, kind: 'friend', s: 1.3, voice: 'hello', anchors: anchors(100, 82, 42, { top: 46, eyeY: 86, eyeSpan: 32, noseY: 98 }) },
  { id: 'alien', cat: 'friends', name: 'Alien', svg: alien, kind: 'friend', s: 1.3, voice: 'beep', anchors: anchors(100, 84, 52, { top: 46, eyeY: 82, eyeSpan: 44, noseY: 102 }) },
  { id: 'fish', cat: 'friends', name: 'Fishy', svg: fishFriend, kind: 'friend', s: 1.3, voice: 'blub', anchors: anchors(128, 98, 40, { top: 62, eyeX: 140, eyeY: 92, eyeSpan: 28, noseX: 160, noseY: 112 }) },

  { id: 'crown', cat: 'hats', name: 'Crown', svg: crown, kind: 'wear', fit: 'head', at: [0, 0.25], span: 0.6, s: 0.8 },
  { id: 'cowboy', cat: 'hats', name: 'Cowboy Hat', svg: cowboy, kind: 'wear', fit: 'head', at: [0, 0.24], span: 0.58, s: 0.9 },
  { id: 'party', cat: 'hats', name: 'Party Hat', svg: partyHat, kind: 'wear', fit: 'head', at: [0, 0.26], span: 0.5, s: 0.8 },
  { id: 'tophat', cat: 'hats', name: 'Top Hat', svg: topHat, kind: 'wear', fit: 'head', at: [0, 0.22], span: 0.56, s: 0.8 },
  { id: 'wizard', cat: 'hats', name: 'Wizard Hat', svg: wizard, kind: 'wear', fit: 'head', at: [0, 0.24], span: 0.58, s: 0.9 },
  { id: 'helmet', cat: 'hats', name: 'Helmet', svg: helmet, kind: 'wear', fit: 'brow', at: [0, 0.27], span: 0.6, s: 0.8 },
  { id: 'pirate', cat: 'hats', name: 'Pirate Hat', svg: pirate, kind: 'wear', fit: 'head', at: [0, 0.18], span: 0.56, s: 0.9 },
  { id: 'bow', cat: 'hats', name: 'Bow', svg: bow, kind: 'wear', fit: 'head', at: [0, 0.14], span: 0.9, s: 0.7 },
  { id: 'spacehelmet', cat: 'hats', name: 'Space Helmet', svg: spaceHelmet, kind: 'wear', fit: 'face', at: [0, -0.01], span: 0.62, s: 1 },

  { id: 'sunglasses', cat: 'glasses', name: 'Sunglasses', svg: sunglasses, kind: 'wear', fit: 'eyes', at: [0, 0.01], span: 0.38, s: 0.75 },
  { id: 'starglasses', cat: 'glasses', name: 'Star Glasses', svg: starGlasses, kind: 'wear', fit: 'eyes', at: [0, 0], span: 0.38, s: 0.75 },
  { id: 'heartglasses', cat: 'glasses', name: 'Heart Glasses', svg: heartGlasses, kind: 'wear', fit: 'eyes', at: [0, 0], span: 0.38, s: 0.75 },
  { id: 'roundglasses', cat: 'glasses', name: 'Glasses', svg: roundGlasses, kind: 'wear', fit: 'eyes', at: [0, 0], span: 0.38, s: 0.75 },
  { id: 'monocle', cat: 'glasses', name: 'Monocle', svg: monocle, kind: 'wear', fit: 'eyes', at: [0, 0], span: 0.38, s: 0.75 },
  { id: 'goggles', cat: 'glasses', name: 'Goggles', svg: goggles, kind: 'wear', fit: 'eyes', at: [0, 0], span: 0.42, s: 0.8 },
  { id: 'mustache', cat: 'glasses', name: 'Mustache', svg: mustache, kind: 'wear', fit: 'nose', at: [0, -0.04], span: 0.75, s: 0.6 },
  { id: 'clownnose', cat: 'glasses', name: 'Clown Nose', svg: clownNose, kind: 'wear', fit: 'nose', at: [0, 0], span: 0.55, s: 0.4 },

  { id: 'daisy', cat: 'flowers', name: 'Daisy', svg: daisy, s: 0.75 },
  { id: 'tulip', cat: 'flowers', name: 'Tulip', svg: tulip, s: 0.75 },
  { id: 'sunflower', cat: 'flowers', name: 'Sunflower', svg: sunflower, s: 0.85 },
  { id: 'mushroom', cat: 'flowers', name: 'Mushroom', svg: mushroom, s: 0.7 },
  { id: 'rose', cat: 'flowers', name: 'Rose', emoji: '🌹', s: 0.6 },
  { id: 'hibiscus', cat: 'flowers', name: 'Flower', emoji: '🌺', s: 0.6 },
  { id: 'cactus', cat: 'flowers', name: 'Cactus', emoji: '🌵', s: 0.8 },
  { id: 'tree', cat: 'flowers', name: 'Tree', emoji: '🌳', s: 1.1 },
  { id: 'palm', cat: 'flowers', name: 'Palm Tree', emoji: '🌴', s: 1.1 },
  { id: 'clover', cat: 'flowers', name: 'Clover', emoji: '🍀', s: 0.5 },
  { id: 'butterfly', cat: 'flowers', name: 'Butterfly', emoji: '🦋', s: 0.55 },
  { id: 'bee', cat: 'flowers', name: 'Bee', emoji: '🐝', s: 0.5 },
  { id: 'ladybug', cat: 'flowers', name: 'Ladybug', emoji: '🐞', s: 0.45 },

  { id: 'starfish', cat: 'sea', name: 'Starfish', svg: starfish, s: 0.7 },
  { id: 'shell', cat: 'sea', name: 'Shell', svg: shell, s: 0.6 },
  { id: 'bubbles', cat: 'sea', name: 'Bubbles', svg: bubbles, s: 0.7 },
  { id: 'smallfish', cat: 'sea', name: 'Fish', svg: smallFish, s: 0.65 },
  { id: 'seaweed', cat: 'sea', name: 'Seaweed', svg: seaweed, s: 0.9 },
  { id: 'octopus', cat: 'sea', name: 'Octopus', emoji: '🐙', s: 0.75 },
  { id: 'crab', cat: 'sea', name: 'Crab', emoji: '🦀', s: 0.65 },
  { id: 'puffer', cat: 'sea', name: 'Puffer Fish', emoji: '🐡', s: 0.6 },
  { id: 'tropical', cat: 'sea', name: 'Fish', emoji: '🐠', s: 0.6 },
  { id: 'dolphin', cat: 'sea', name: 'Dolphin', emoji: '🐬', s: 0.85 },
  { id: 'whale', cat: 'sea', name: 'Whale', emoji: '🐳', s: 0.9 },
  { id: 'turtle', cat: 'sea', name: 'Turtle', emoji: '🐢', s: 0.7 },
  { id: 'squid', cat: 'sea', name: 'Squid', emoji: '🦑', s: 0.7 },

  { id: 'rocket', cat: 'space', name: 'Rocket', svg: rocket, s: 0.9 },
  { id: 'planet', cat: 'space', name: 'Planet', svg: planet, s: 0.85 },
  { id: 'moon', cat: 'space', name: 'Moon', svg: moon, s: 0.75 },
  { id: 'ufo', cat: 'space', name: 'Flying Saucer', svg: ufo, s: 0.85 },
  { id: 'happystar', cat: 'space', name: 'Star', svg: happyStar, s: 0.65 },
  { id: 'earth', cat: 'space', name: 'Earth', emoji: '🌍', s: 0.75 },
  { id: 'comet', cat: 'space', name: 'Comet', emoji: '☄️', s: 0.7 },
  { id: 'satellite', cat: 'space', name: 'Satellite', emoji: '🛰️', s: 0.7 },
  { id: 'alienface', cat: 'space', name: 'Alien', emoji: '👽', s: 0.6 },
  { id: 'glowstar', cat: 'space', name: 'Twinkle', emoji: '🌟', s: 0.5 },

  { id: 'cow', cat: 'farm', name: 'Cow', svg: cow, kind: 'friend', s: 1.3, voice: 'moo', anchors: anchors(100, 86, 45, { top: 50, eyeY: 80, eyeSpan: 32, noseY: 110 }) },
  { id: 'pig', cat: 'farm', name: 'Piggy', svg: pig, kind: 'friend', s: 1.3, voice: 'oink', anchors: anchors(100, 88, 46, { top: 50, eyeY: 80, eyeSpan: 36, noseY: 104 }) },
  { id: 'sheep', cat: 'farm', name: 'Sheep', svg: sheep, kind: 'friend', s: 1.3, voice: 'baa', anchors: anchors(100, 94, 32, { top: 54, eyeY: 94, eyeSpan: 24, noseY: 112 }) },
  { id: 'hen', cat: 'farm', name: 'Hen', svg: hen, s: 0.7 },
  { id: 'tractor', cat: 'farm', name: 'Tractor', svg: tractor, s: 1 },
  { id: 'haybale', cat: 'farm', name: 'Hay Bale', svg: haybale, s: 0.75 },
  { id: 'strawhat', cat: 'farm', name: 'Straw Hat', svg: strawHat, kind: 'wear', fit: 'head', at: [0, 0.24], span: 0.58, s: 0.9 },
  { id: 'chick', cat: 'farm', name: 'Chick', emoji: '🐤', s: 0.45 },
  { id: 'duck', cat: 'farm', name: 'Duck', emoji: '🦆', s: 0.6 },
  { id: 'goat', cat: 'farm', name: 'Goat', emoji: '🐐', s: 0.75 },
  { id: 'rooster', cat: 'farm', name: 'Rooster', emoji: '🐓', s: 0.7 },
  { id: 'corn', cat: 'farm', name: 'Corn', emoji: '🌽', s: 0.5 },
  { id: 'carrot', cat: 'farm', name: 'Carrot', emoji: '🥕', s: 0.5 },

  { id: 'car', cat: 'town', name: 'Car', svg: car, s: 0.95 },
  { id: 'bus', cat: 'town', name: 'Bus', svg: bus, s: 1.15 },
  { id: 'trafficlight', cat: 'town', name: 'Traffic Light', svg: trafficLight, s: 0.8 },
  { id: 'hardhat', cat: 'town', name: 'Hard Hat', svg: hardHat, kind: 'wear', fit: 'head', at: [0, 0.22], span: 0.62, s: 0.8 },
  { id: 'firetruck', cat: 'town', name: 'Fire Truck', emoji: '🚒', s: 0.95 },
  { id: 'police', cat: 'town', name: 'Police Car', emoji: '🚓', s: 0.8 },
  { id: 'taxi', cat: 'town', name: 'Taxi', emoji: '🚕', s: 0.8 },
  { id: 'ambulance', cat: 'town', name: 'Ambulance', emoji: '🚑', s: 0.9 },
  { id: 'bike', cat: 'town', name: 'Bike', emoji: '🚲', s: 0.75 },
  { id: 'house', cat: 'town', name: 'House', emoji: '🏠', s: 1.1 },

  { id: 'snowman', cat: 'winter', name: 'Snowman', svg: snowman, kind: 'friend', s: 1.3, voice: 'hello', anchors: anchors(100, 74, 40, { top: 38, eyeY: 66, eyeSpan: 28, noseY: 84 }) },
  { id: 'penguin', cat: 'winter', name: 'Penguin', svg: penguin, kind: 'friend', s: 1.2, voice: 'squawk', anchors: anchors(100, 86, 42, { top: 52, eyeY: 80, eyeSpan: 24, noseY: 100 }) },
  { id: 'snowflake', cat: 'winter', name: 'Snowflake', svg: snowflake, s: 0.6 },
  { id: 'beanie', cat: 'winter', name: 'Winter Hat', svg: beanie, kind: 'wear', fit: 'head', at: [0, 0.2], span: 0.62, s: 0.8 },
  { id: 'gloves', cat: 'winter', name: 'Gloves', emoji: '🧤', s: 0.5 },
  { id: 'sled', cat: 'winter', name: 'Sled', emoji: '🛷', s: 0.8 },
  { id: 'pine', cat: 'winter', name: 'Pine Tree', emoji: '🌲', s: 1.1 },
  { id: 'skate', cat: 'winter', name: 'Ice Skate', emoji: '⛸️', s: 0.55 },
  { id: 'deer', cat: 'winter', name: 'Deer', emoji: '🦌', s: 0.8 },
  { id: 'cocoa', cat: 'winter', name: 'Hot Cocoa', emoji: '☕', s: 0.5 },

  { id: 'rainbow', cat: 'fun', name: 'Rainbow', svg: rainbow, s: 1 },
  { id: 'heart', cat: 'fun', name: 'Heart', svg: heart, s: 0.55 },
  { id: 'balloon', cat: 'fun', name: 'Balloon', svg: balloon, s: 0.75 },
  { id: 'sun', cat: 'fun', name: 'Sunshine', svg: sunny, s: 0.85 },
  { id: 'cloud', cat: 'fun', name: 'Cloud', svg: fluffy, s: 0.9 },
  { id: 'unicorn', cat: 'fun', name: 'Unicorn', emoji: '🦄', s: 0.8 },
  { id: 'dragon', cat: 'fun', name: 'Dragon', emoji: '🐉', s: 0.95 },
  { id: 'dino', cat: 'fun', name: 'Dinosaur', emoji: '🦖', s: 0.9 },
  { id: 'horse', cat: 'fun', name: 'Horse', emoji: '🐴', s: 0.75 },
  { id: 'lolly', cat: 'fun', name: 'Lollipop', emoji: '🍭', s: 0.6 },
  { id: 'icecream', cat: 'fun', name: 'Ice Cream', emoji: '🍦', s: 0.6 },
  { id: 'donut', cat: 'fun', name: 'Donut', emoji: '🍩', s: 0.55 },
  { id: 'cake', cat: 'fun', name: 'Cake', emoji: '🎂', s: 0.7 },
  { id: 'gift', cat: 'fun', name: 'Present', emoji: '🎁', s: 0.6 },
  { id: 'tada', cat: 'fun', name: 'Party', emoji: '🎉', s: 0.6 },
  { id: 'cupcake', cat: 'fun', name: 'Cupcake', emoji: '🧁', s: 0.55 },
  { id: 'confetti', cat: 'fun', name: 'Confetti', emoji: '🎊', s: 0.6 },
  { id: 'candy', cat: 'fun', name: 'Candy', emoji: '🍬', s: 0.45 },
  { id: 'pizza', cat: 'fun', name: 'Pizza', emoji: '🍕', s: 0.55 },
  { id: 'ribbon', cat: 'fun', name: 'Ribbon', emoji: '🎀', s: 0.5 },
];

export const BY_ID = {};
STICKERS.forEach((s) => { BY_ID[s.id] = s; });
