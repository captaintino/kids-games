// This game's own sounds, built from the kit's synth blocks.
import { tone, noise, ready, chime } from '../../shared/js/audio.js';

/** The hook landing in the water. */
export function plop() {
  if (!ready()) return;
  tone({ type: 'sine', f0: 560, f1: 140, dur: 0.16, vol: 0.32 });
  noise({ dur: 0.1, vol: 0.14, freq: 700 });
  tone({ type: 'sine', f0: 320, f1: 760, dur: 0.08, vol: 0.09, delay: 0.1 });
}

/** The line whizzing out when casting. */
export function cast() {
  if (!ready()) return;
  noise({ dur: 0.25, vol: 0.07, freq: 4000 });
  tone({ type: 'sine', f0: 1400, f1: 700, dur: 0.22, vol: 0.05 });
}

/** A fish nibbling: a little bloop. */
export function nibble(i = 0) {
  if (!ready()) return;
  const f = 620 + i * 90;
  tone({ type: 'sine', f0: f, f1: f * 0.7, dur: 0.07, vol: 0.14 });
  noise({ dur: 0.04, vol: 0.05, freq: 1200 });
}

let lastTick = 0;
/** The reel clicking while the fish comes up. */
export function reelTick() {
  if (!ready()) return;
  const now = performance.now();
  if (now - lastTick < 60) return;
  lastTick = now;
  noise({ dur: 0.02, vol: 0.07, freq: 3200 });
  tone({ type: 'triangle', f0: 1800, dur: 0.02, vol: 0.025 });
}

/** A fish jumping out of the water. */
export function bigSplash() {
  if (!ready()) return;
  noise({ dur: 0.4, vol: 0.26, freq: 900 });
  noise({ dur: 0.25, vol: 0.12, freq: 2600, delay: 0.03 });
  tone({ type: 'sine', f0: 200, f1: 700, dur: 0.18, vol: 0.12 });
}

/** The fish going back into the pond. */
export function release() {
  if (!ready()) return;
  noise({ dur: 0.3, vol: 0.2, freq: 800 });
  tone({ type: 'sine', f0: 700, f1: 180, dur: 0.25, vol: 0.18 });
  chime([12, 7, 4, 0], 660, 0.06);
}

/** Quack! */
export function quack() {
  if (!ready()) return;
  [0, 0.17].forEach((d) => {
    tone({ type: 'sawtooth', f0: 560, f1: 380, dur: 0.12, vol: 0.07, delay: d });
    tone({ type: 'square', f0: 280, f1: 200, dur: 0.12, vol: 0.035, delay: d });
    noise({ dur: 0.08, vol: 0.04, freq: 1500, delay: d });
  });
}

/** A fish has noticed the hook. */
export function notice() {
  if (!ready()) return;
  tone({ type: 'sine', f0: 900, f1: 1300, dur: 0.08, vol: 0.08 });
  tone({ type: 'sine', f0: 1300, f1: 1700, dur: 0.08, vol: 0.06, delay: 0.08 });
}

/** Tapping a bubble or a fish. */
export function blip(p = 1) {
  if (!ready()) return;
  tone({ type: 'sine', f0: 500 * p, f1: 1100 * p, dur: 0.08, vol: 0.12 });
}

/** The extra-special golden fanfare. */
export function golden() {
  chime([0, 4, 7, 12, 16, 19, 24, 28], 660, 0.06);
  chime([12, 16, 19, 24], 1046, 0.09);
}

// ---------------------------------------------------------------------------
// Friends in the other places, and the aquarium
// ---------------------------------------------------------------------------
/** A far-away whale song. */
export function whale() {
  if (!ready()) return;
  tone({ type: 'sine', f0: 220, f1: 330, dur: 0.9, vol: 0.06, attack: 0.25 });
  tone({ type: 'sine', f0: 330, f1: 196, dur: 1.1, vol: 0.05, attack: 0.3, delay: 0.8 });
}

/** The seal: arf arf! */
export function seal() {
  if (!ready()) return;
  [0, 0.2].forEach((d) => {
    tone({ type: 'triangle', f0: 520, f1: 340, dur: 0.12, vol: 0.12, delay: d });
    tone({ type: 'square', f0: 260, f1: 180, dur: 0.1, vol: 0.03, delay: d });
  });
}

/** The penguin: a happy squeak. */
export function squeak() {
  if (!ready()) return;
  tone({ type: 'sine', f0: 900, f1: 1500, dur: 0.1, vol: 0.12 });
  tone({ type: 'sine', f0: 1500, f1: 1100, dur: 0.1, vol: 0.1, delay: 0.12 });
}

/** The frog: ribbit! */
export function ribbit() {
  if (!ready()) return;
  [0, 0.16].forEach((d) => {
    tone({ type: 'square', f0: 180, f1: 240, dur: 0.09, vol: 0.05, delay: d });
    tone({ type: 'triangle', f0: 360, f1: 300, dur: 0.09, vol: 0.08, delay: d });
  });
}

/** Fish food sprinkling into the tank. */
export function sprinkle() {
  if (!ready()) return;
  for (let k = 0; k < 6; k++) noise({ dur: 0.03, vol: 0.06, freq: 4000 + k * 300, delay: k * 0.05 });
  chime([12, 16, 19], 880, 0.05);
}

let lastMunch = 0;
/** A fish eating a flake: a tiny gulp. */
export function munch() {
  if (!ready()) return;
  const now = performance.now();
  if (now - lastMunch < 80) return;
  lastMunch = now;
  const f = 500 + Math.random() * 300;
  tone({ type: 'sine', f0: f, f1: f * 1.8, dur: 0.06, vol: 0.12 });
}
