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
