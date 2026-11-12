// Shape Pop and Letter Pop: what each round asks for.
// Like Count & Pop these are gentle: no hearts, big slow bubbles, and the
// next round starts by itself.

const rnd = (n) => Math.floor(Math.random() * n);
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// ---------------------------------------------------------------------------
// Shapes (drawn in sprites.js: drawShape)
// ---------------------------------------------------------------------------
export const SHAPES = {
  circle: { name: 'Circle', plural: 'circles' },
  square: { name: 'Square', plural: 'squares' },
  triangle: { name: 'Triangle', plural: 'triangles' },
  star: { name: 'Star', plural: 'stars' },
  heart: { name: 'Heart', plural: 'hearts' },
  diamond: { name: 'Diamond', plural: 'diamonds' },
  moon: { name: 'Moon', plural: 'moons' },
  hexagon: { name: 'Hexagon', plural: 'hexagons' },
};
const EASY_SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];
const ALL_SHAPES = Object.keys(SHAPES);

/**
 * Round n (from 0). The first five rounds walk through the easy shapes with
 * one or two others mixed in; later rounds pick any shape and mix 3 to 5.
 */
export function shapeRound(n, prev) {
  let target;
  if (n < EASY_SHAPES.length) target = EASY_SHAPES[n];
  else {
    do { target = ALL_SHAPES[rnd(ALL_SHAPES.length)]; } while (target === prev);
  }
  const kinds = n < 2 ? 2 : n < 5 ? 3 : n < 8 ? 3 + rnd(2) : 3 + rnd(3);
  const pool = shuffle((n < 4 ? EASY_SHAPES : ALL_SHAPES).filter((k) => k !== target));
  const goal = n < 2 ? 5 : 5 + rnd(Math.min(4, n));
  return { target, others: pool.slice(0, kinds - 1), goal, theme: (n + 1) % 6 };
}

// ---------------------------------------------------------------------------
// Letters (uppercase only)
// ---------------------------------------------------------------------------
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
// a few easy letters that look nothing alike come first
const EASY_LETTERS = ['B', 'O', 'X', 'A', 'S', 'M', 'T', 'L'];
// letters that are easy to mix up are never asked against each other
const LOOKALIKE = ['OQCGD', 'EF', 'PRB', 'MWN', 'UVY', 'ILTJ', 'KX', 'HN', 'SZ'];
function lookalike(a, b) {
  return LOOKALIKE.some((g) => g.indexOf(a) >= 0 && g.indexOf(b) >= 0);
}
// "B is for ball!" Emoji only where iOS 12 has one.
export const LETTER_WORDS = {
  A: ['apple', '🍎'], B: ['ball', '⚽'], C: ['cat', '🐱'], D: ['dog', '🐶'], E: ['elephant', '🐘'],
  F: ['fish', '🐟'], G: ['grapes', '🍇'], H: ['hat', '🎩'], I: ['ice cream', '🍦'], J: ['jet', '✈️'],
  K: ['koala', '🐨'], L: ['lion', '🦁'], M: ['moon', '🌙'], N: ['nose', '👃'], O: ['octopus', '🐙'],
  P: ['pig', '🐷'], Q: ['queen', '👑'], R: ['rainbow', '🌈'], S: ['sun', '☀️'], T: ['turtle', '🐢'],
  U: ['umbrella', '☔'], V: ['violin', '🎻'], W: ['whale', '🐳'], X: ['xylophone', ''], Y: ['yo-yo', ''],
  Z: ['zebra', '🦓'],
};

/**
 * Round n (from 0): the easy letters first with one or two others mixed in,
 * then on through the alphabet from A to Z (and round again).
 */
export function letterRound(n) {
  const target = n < EASY_LETTERS.length ? EASY_LETTERS[n] : ALPHABET[(n - EASY_LETTERS.length) % 26];
  const kinds = n < 3 ? 2 : n < 8 ? 3 : 3 + rnd(2);
  const pool = shuffle((n < 6 ? EASY_LETTERS : ALPHABET).filter((l) => l !== target && !lookalike(l, target)));
  const goal = n < 3 ? 5 : 5 + rnd(2);
  return { target, others: pool.slice(0, kinds - 1), goal, theme: (n + 3) % 6 };
}

// Single letters are read oddly by a few voices after "the" ("the A" -> "thuh uh").
export function letterPrompt(l) {
  return l === 'A' ? 'Pop the letter A!' : `Pop the ${l}!`;
}
