// This game's own sounds, built from the kit's synth blocks.
import { tone, noise, ready, chime } from '../../shared/js/audio.js';

const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
let lastTwinkle = 0;

/** A bell-like "ting" for each caught star; i climbs the scale for catches in a row. */
export function twinkle(i = 0) {
  if (!ready()) return;
  const now = performance.now();
  if (now - lastTwinkle < 30) return;
  lastTwinkle = now;
  const f = 784 * Math.pow(2, SCALE[Math.min(i, SCALE.length - 1)] / 12);
  tone({ type: 'sine', f0: f, dur: 0.32, vol: 0.16 });
  tone({ type: 'triangle', f0: f * 2, dur: 0.12, vol: 0.05 });
  tone({ type: 'sine', f0: f * 1.5, dur: 0.22, vol: 0.06, delay: 0.05 });
}

/** The soggy basket: a splash, a bloop and a little drip. Funny, not sad. */
export function splish() {
  if (!ready()) return;
  noise({ dur: 0.2, vol: 0.28, freq: 900 });
  noise({ dur: 0.12, vol: 0.14, freq: 2600, delay: 0.04 });
  tone({ type: 'triangle', f0: 620, f1: 170, dur: 0.3, vol: 0.16 });
  tone({ type: 'sine', f0: 260, f1: 620, dur: 0.12, vol: 0.14, delay: 0.24 });
  tone({ type: 'sine', f0: 1100, f1: 1700, dur: 0.06, vol: 0.07, delay: 0.42 });
}

let lastPlip = 0;
/** A raindrop landing on the grass (very soft). */
export function plip() {
  if (!ready()) return;
  const now = performance.now();
  if (now - lastPlip < 120) return;
  lastPlip = now;
  tone({ type: 'sine', f0: 1300 + Math.random() * 300, f1: 1900, dur: 0.05, vol: 0.035 });
}

/** A star bouncing off the soggy basket. */
export function bonk() {
  if (!ready()) return;
  tone({ type: 'triangle', f0: 300, f1: 520, dur: 0.1, vol: 0.12 });
}

/** Shooting star: a bright swoosh and sparkle. */
export function zing() {
  if (!ready()) return;
  noise({ dur: 0.35, vol: 0.1, freq: 3000 });
  tone({ f0: 600, f1: 2400, dur: 0.3, vol: 0.1 });
  chime([0, 4, 7, 12, 16, 19, 24], 880, 0.04);
}

/** The moon: a slow, sleepy lullaby. */
export function lullaby() {
  chime([12, 7, 4, 0, 4, 7], 523, 0.16);
}

/** A rain cloud puffing out a drop. */
export function puff() {
  if (!ready()) return;
  noise({ dur: 0.12, vol: 0.05, freq: 500 });
}

// ---------------------------------------------------------------------------
// The seasons
// ---------------------------------------------------------------------------
/** The catch sound for each season; i climbs the scale for catches in a row. */
export function catchSound(type, i = 0) {
  if (type === 'twinkle' || !type) { twinkle(i); return; }
  if (!ready()) return;
  const now = performance.now();
  if (now - lastTwinkle < 30) return;
  lastTwinkle = now;
  const step = SCALE[Math.min(i, SCALE.length - 1)];
  switch (type) {
    case 'ice': { // a glassy little "tink"
      const f = 1046 * Math.pow(2, step / 12);
      tone({ type: 'sine', f0: f, dur: 0.22, vol: 0.13 });
      tone({ type: 'sine', f0: f * 2.76, dur: 0.1, vol: 0.04 });
      tone({ type: 'triangle', f0: f * 1.5, dur: 0.14, vol: 0.04, delay: 0.04 });
      noise({ dur: 0.04, vol: 0.03, freq: 7000 });
      break;
    }
    case 'wood': { // a soft woody marimba "tok" and a leafy rustle
      const f = 523 * Math.pow(2, step / 12);
      tone({ type: 'triangle', f0: f, f1: f * 0.98, dur: 0.2, vol: 0.2 });
      tone({ type: 'sine', f0: f * 4, dur: 0.05, vol: 0.04 });
      noise({ dur: 0.09, vol: 0.05, freq: 2400 });
      break;
    }
    case 'flute': { // a breathy flute note
      const f = 784 * Math.pow(2, step / 12);
      tone({ type: 'sine', f0: f * 0.99, f1: f, dur: 0.32, vol: 0.14, attack: 0.03 });
      tone({ type: 'sine', f0: f * 2, dur: 0.18, vol: 0.03, attack: 0.03 });
      noise({ dur: 0.06, vol: 0.025, freq: 3000 });
      break;
    }
    case 'marimba': { // a round, bubbly "bloop"
      const f = 659 * Math.pow(2, step / 12);
      tone({ type: 'sine', f0: f * 0.8, f1: f, dur: 0.16, vol: 0.18 });
      tone({ type: 'sine', f0: f * 3, dur: 0.06, vol: 0.04 });
      break;
    }
  }
}

/** The gentle "oops" for each season. */
export function hazard(type) {
  if (type === 'splish' || !type) { splish(); return; }
  if (!ready()) return;
  switch (type) {
    case 'snow': // poof, and a shivery "brrr"
      noise({ dur: 0.3, vol: 0.22, freq: 500 });
      noise({ dur: 0.15, vol: 0.1, freq: 2200, delay: 0.02 });
      for (let k = 0; k < 6; k++) tone({ type: 'triangle', f0: 330 - k * 8, f1: 300 - k * 8, dur: 0.05, vol: 0.08, delay: 0.25 + k * 0.055 });
      break;
    case 'mud': // a squishy splat
      noise({ dur: 0.22, vol: 0.28, freq: 380 });
      tone({ type: 'triangle', f0: 240, f1: 90, dur: 0.22, vol: 0.18 });
      tone({ type: 'sine', f0: 180, f1: 420, dur: 0.1, vol: 0.12, delay: 0.22 });
      break;
    case 'balloon': // a pop and a big sploosh
      noise({ dur: 0.05, vol: 0.25, freq: 4000 });
      noise({ dur: 0.35, vol: 0.24, freq: 900, delay: 0.03 });
      tone({ type: 'triangle', f0: 700, f1: 160, dur: 0.3, vol: 0.14, delay: 0.03 });
      tone({ type: 'sine', f0: 260, f1: 620, dur: 0.12, vol: 0.12, delay: 0.3 });
      break;
  }
}

/** A soft landing for snow / mud / balloons on the ground. */
export function softLand(type) {
  if (!ready()) return;
  const now = performance.now();
  if (now - lastPlip < 120) return;
  lastPlip = now;
  if (type === 'snow') noise({ dur: 0.08, vol: 0.05, freq: 900 });
  else if (type === 'mud') tone({ type: 'sine', f0: 300, f1: 160, dur: 0.07, vol: 0.05 });
  else tone({ type: 'sine', f0: 1300 + Math.random() * 300, f1: 1900, dur: 0.05, vol: 0.035 });
}

/** An autumn wind gust. */
export function gust() {
  if (!ready()) return;
  noise({ dur: 1.4, vol: 0.09, freq: 600 });
  noise({ dur: 1.1, vol: 0.06, freq: 1400, delay: 0.25 });
  tone({ type: 'sine', f0: 380, f1: 620, dur: 1.0, vol: 0.03, delay: 0.1 });
}

/** A little spring bird. */
export function chirp() {
  if (!ready()) return;
  const f = 2300 + Math.random() * 500;
  tone({ type: 'sine', f0: f, f1: f * 1.35, dur: 0.07, vol: 0.035 });
  tone({ type: 'sine', f0: f * 1.1, f1: f * 1.45, dur: 0.07, vol: 0.03, delay: 0.11 });
}

/** A summer-evening cricket. */
export function cricket() {
  if (!ready()) return;
  for (let k = 0; k < 3; k++) tone({ type: 'triangle', f0: 4300, dur: 0.035, vol: 0.012, delay: k * 0.07 });
}

/** Wind chimes / sleigh bells for the winter village. */
export function bells() {
  if (!ready()) return;
  [0, 0.09, 0.18].forEach((d, k) => {
    const f = 2093 * Math.pow(2, [0, 4, 7][k] / 12);
    tone({ type: 'sine', f0: f, dur: 0.18, vol: 0.025, delay: d });
  });
}

/** A dot of the constellation lighting up. */
export function ping(i = 0) {
  if (!ready()) return;
  const f = 1568 * Math.pow(2, SCALE[i % 6] / 12);
  tone({ type: 'sine', f0: f, dur: 0.16, vol: 0.035, delay: 0.02 });
}

/** A whole constellation: a magical rising sparkle. */
export function constellation() {
  chime([0, 4, 7, 11, 12, 16, 19, 23, 24], 523, 0.08);
  chime([24, 28, 31, 36], 523, 0.12);
}
