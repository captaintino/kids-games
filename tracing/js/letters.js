// Stroke data for Letter Tracing.
//
// Every character is drawn on a 400 x 400 sheet as a list of center-line
// strokes (SVG path data), in a kid-friendly stroke order: top to bottom,
// left to right, "big line first, then the curves". The game draws a fat band
// around each stroke (the lines the brush stays inside), a dotted guide along
// it, and scores the kid by how closely the brush follows each stroke in order.
//
// A dot (the dot on i and j) is a stroke 1 unit long: the band makes it round.
//
// Writing lines (y on the sheet):
//   ABC and 123:  top 50, middle 200, baseline 350
//   abc:          top 30, middle (x-height) 140, baseline 280, descender 368

export const SETS = [
  {
    id: 'upper', label: 'ABC', icon: '🔠', color: 'pink', name: 'Big letters',
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    lines: [50, 200, 350], band: 54, brush: 50, tol: 32,
    bandColor: '#ffe6f3', bandEdge: '#ffb6dc',
  },
  {
    id: 'lower', label: 'abc', icon: '🔡', color: 'blue', name: 'Little letters',
    chars: 'abcdefghijklmnopqrstuvwxyz'.split(''),
    lines: [30, 140, 280, 368], band: 46, brush: 43, tol: 28,
    bandColor: '#e3f3ff', bandEdge: '#a6d6ff',
  },
  {
    id: 'digits', label: '123', icon: '🔢', color: 'green', name: 'Numbers',
    chars: '0123456789'.split(''),
    lines: [50, 200, 350], band: 54, brush: 50, tol: 32,
    bandColor: '#e8fbe2', bandEdge: '#aee89c',
  },
];

// Small dot stroke at x, y
const dot = (x, y) => `M${x} ${y}L${x} ${y + 1}`;

// Shared shapes
const C_UP = 'M281 94A115 150 0 1 0 281 306';
const O_UP = 'M200 50A110 150 0 0 0 200 350A110 150 0 0 0 200 50';
const C_LO = 'M247 165A62 70 0 1 0 247 255';
const BOWL_LO = 'M140 185C155 155 178 140 202 140C240 140 264 172 264 210C264 250 240 280 202 280C175 280 152 265 140 245';

export const GLYPHS = {
  // ---------------- Big letters ----------------
  A: ['M200 50L110 350', 'M200 50L290 350', 'M145 245H255'],
  B: ['M130 50V350', 'M130 50H195A75 75 0 0 1 195 200H130', 'M130 200H205A75 75 0 0 1 205 350H130'],
  C: [C_UP],
  D: ['M130 50V350', 'M130 50H170A130 150 0 0 1 170 350H130'],
  E: ['M130 50V350', 'M130 50H280', 'M130 200H260', 'M130 350H280'],
  F: ['M135 50V350', 'M135 50H280', 'M135 200H255'],
  G: ['M281 94A115 150 0 1 0 300 275V205H220'],
  H: ['M120 50V350', 'M280 50V350', 'M120 200H280'],
  I: ['M200 50V350', 'M140 50H260', 'M140 350H260'],
  J: ['M240 50V270A75 75 0 0 1 90 270', 'M170 50H310'],
  K: ['M130 50V350', 'M275 50L135 205', 'M180 155L280 350'],
  L: ['M135 50V350H280'],
  M: ['M105 350V50', 'M105 50L200 245L295 50V350'],
  N: ['M120 350V50', 'M120 50L280 350V50'],
  O: [O_UP],
  P: ['M130 50V350', 'M130 50H195A78 78 0 0 1 195 206H130'],
  Q: [O_UP, 'M215 270L300 360'],
  R: ['M130 50V350', 'M130 50H195A78 78 0 0 1 195 206H130', 'M200 206L285 350'],
  S: ['M275 92C255 55 220 50 200 50C150 50 125 80 125 118C125 160 165 180 200 195C240 212 278 232 278 278C278 322 245 350 200 350C160 350 135 330 120 305'],
  T: ['M200 50V350', 'M100 50H300'],
  U: ['M120 50V270A80 80 0 0 0 280 270V50'],
  V: ['M110 50L200 350L290 50'],
  W: ['M85 50L145 350L200 150L255 350L315 50'],
  X: ['M115 50L285 350', 'M285 50L115 350'],
  Y: ['M115 50L200 195', 'M285 50L200 195V350'],
  Z: ['M115 50H285L115 350H285'],

  // ---------------- Little letters ----------------
  a: [C_LO, 'M262 140V280'],
  b: ['M140 30V280', BOWL_LO],
  c: [C_LO],
  d: [C_LO, 'M262 30V280'],
  e: ['M140 212H260C260 172 235 140 200 140C163 140 138 172 138 210C138 250 163 280 200 280C228 280 248 265 258 245'],
  f: ['M262 55C252 38 238 30 220 30C190 30 178 52 178 85V280', 'M130 145H235'],
  g: [C_LO, 'M262 140V310C262 348 235 368 200 368C172 368 152 357 140 340'],
  h: ['M140 30V280', 'M140 195C150 162 175 140 205 140C240 140 262 162 262 200V280'],
  i: ['M200 140V280', dot(200, 82)],
  j: ['M225 140V310C225 348 200 368 168 368C145 368 128 359 118 343', dot(225, 82)],
  k: ['M145 30V280', 'M255 140L145 225', 'M182 196L262 280'],
  l: ['M200 30V280'],
  m: ['M110 140V280', 'M110 185C118 158 135 140 160 140C185 140 200 158 200 190V280', 'M200 185C208 158 225 140 250 140C275 140 290 158 290 190V280'],
  n: ['M140 140V280', 'M140 190C150 160 172 140 202 140C238 140 260 162 260 200V280'],
  o: ['M200 140A62 70 0 0 0 200 280A62 70 0 0 0 200 140'],
  p: ['M140 140V368', BOWL_LO],
  q: [C_LO, 'M262 140V368'],
  r: ['M150 140V280', 'M150 195C162 160 185 140 215 140C235 140 250 147 262 160'],
  s: ['M252 160C240 147 222 140 200 140C172 140 150 155 150 177C150 200 172 207 200 212C230 217 255 225 255 250C255 270 232 280 200 280C175 280 155 272 145 258'],
  t: ['M195 50V250C195 270 207 280 225 280C240 280 252 273 260 263', 'M145 140H250'],
  u: ['M140 140V220C140 256 165 280 200 280C235 280 260 256 260 220V140', 'M260 140V280'],
  v: ['M140 140L200 280L260 140'],
  w: ['M110 140L150 280L200 160L250 280L290 140'],
  x: ['M145 140L255 280', 'M255 140L145 280'],
  y: ['M145 140L208 280', 'M260 140L176 368'],
  z: ['M145 140H255L145 280H258'],

  // ---------------- Numbers ----------------
  0: ['M200 50A90 150 0 0 0 200 350A90 150 0 0 0 200 50'],
  1: ['M150 100L205 50V350'],
  2: ['M122 112C130 70 165 50 200 50C245 50 278 80 278 122C278 175 220 230 120 350H285'],
  3: ['M125 90C145 62 172 50 200 50C245 50 272 80 272 120C272 165 238 197 192 197C242 197 280 225 280 272C280 320 245 350 200 350C163 350 135 335 120 310'],
  4: ['M130 50V230H290', 'M240 50V350'],
  5: ['M140 50V180C160 168 180 163 200 163C250 163 282 198 282 255C282 312 245 350 197 350C163 350 138 335 120 312', 'M140 50H275'],
  6: ['M262 68C240 55 222 50 200 50C150 50 120 110 120 230C120 300 155 350 202 350C248 350 280 315 280 275C280 232 248 200 204 200C160 200 128 225 122 255'],
  7: ['M115 50H285L170 350'],
  8: ['M265 95C255 65 230 50 200 50C162 50 135 75 135 113C135 150 165 170 200 192C240 215 272 238 272 280C272 322 240 350 200 350C160 350 128 322 128 280C128 238 160 215 200 192C235 170 265 150 265 113L265 95'],
  9: ['M280 125C280 80 245 50 202 50C158 50 125 82 125 125C125 168 158 200 202 200C245 200 280 170 280 125V350'],
};

// How the letter names are spoken (single letters are read oddly by some voices).
export const SPOKEN = {
  a: 'A', b: 'B', c: 'C', d: 'D', e: 'E', f: 'F', g: 'G', h: 'H', i: 'I', j: 'J', k: 'K', l: 'L', m: 'M',
  n: 'N', o: 'O', p: 'P', q: 'Q', r: 'R', s: 'S', t: 'T', u: 'U', v: 'V', w: 'W', x: 'X', y: 'Y', z: 'Z',
};

// "B is for ball!" Pictures are emoji that exist on iOS 12, or a small drawing
// (pic: 'xylophone' / 'yoyo') where no safe emoji exists.
export const WORDS = {
  A: { word: 'apple', emoji: '🍎' },
  B: { word: 'ball', emoji: '⚽' },
  C: { word: 'cat', emoji: '🐱' },
  D: { word: 'dog', emoji: '🐶' },
  E: { word: 'elephant', emoji: '🐘' },
  F: { word: 'fish', emoji: '🐟' },
  G: { word: 'grapes', emoji: '🍇' },
  H: { word: 'hat', emoji: '🎩' },
  I: { word: 'ice cream', emoji: '🍦' },
  J: { word: 'jet', emoji: '✈️' },
  K: { word: 'koala', emoji: '🐨' },
  L: { word: 'lion', emoji: '🦁' },
  M: { word: 'moon', emoji: '🌙' },
  N: { word: 'nose', emoji: '👃' },
  O: { word: 'octopus', emoji: '🐙' },
  P: { word: 'pig', emoji: '🐷' },
  Q: { word: 'queen', emoji: '👑' },
  R: { word: 'rainbow', emoji: '🌈' },
  S: { word: 'sun', emoji: '☀️' },
  T: { word: 'turtle', emoji: '🐢' },
  U: { word: 'umbrella', emoji: '☔' },
  V: { word: 'violin', emoji: '🎻' },
  W: { word: 'whale', emoji: '🐳' },
  X: { word: 'xylophone', pic: 'xylophone' },
  Y: { word: 'yo-yo', pic: 'yoyo' },
  Z: { word: 'zebra', emoji: '🦓' },

  a: { word: 'ant', emoji: '🐜' },
  b: { word: 'bee', emoji: '🐝' },
  c: { word: 'cake', emoji: '🍰' },
  d: { word: 'duck', emoji: '🦆' },
  e: { word: 'egg', emoji: '🥚' },
  f: { word: 'frog', emoji: '🐸' },
  g: { word: 'gift', emoji: '🎁' },
  h: { word: 'house', emoji: '🏠' },
  i: { word: 'iguana', emoji: '🦎' },
  j: { word: 'jeans', emoji: '👖' },
  k: { word: 'key', emoji: '🔑' },
  l: { word: 'leaf', emoji: '🍁' },
  m: { word: 'monkey', emoji: '🐵' },
  n: { word: 'nut', emoji: '🥜' },
  o: { word: 'owl', emoji: '🦉' },
  p: { word: 'pizza', emoji: '🍕' },
  q: { word: 'quiet', emoji: '🤫', line: 'Q is for quiet. Shhh!' },
  r: { word: 'rabbit', emoji: '🐰' },
  s: { word: 'star', emoji: '⭐' },
  t: { word: 'train', emoji: '🚂' },
  u: { word: 'unicorn', emoji: '🦄' },
  v: { word: 'volcano', emoji: '🌋' },
  w: { word: 'watermelon', emoji: '🍉' },
  x: { word: 'fox', emoji: '🦊', line: 'Fox ends with X!' },
  y: { word: 'yummy', emoji: '😋' },
  z: { word: 'zoo', emoji: '🦒' },
};
