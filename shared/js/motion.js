// How much the background worlds move, scaled back on old or struggling devices.
//
//   0 Full     moving bits redrawn 30 times a second at normal resolution
//   1 Light    15 times a second, at 3/4 resolution
//   2 Minimal  8 times a second, at half resolution (the drifting clouds, fish and
//              sparkles still move, just gently stepping)
//
// The starting level comes from what the device says about itself (an iPad on iOS 12,
// an old Android phone, very little memory or only two processor cores). After that,
// noteFrame() watches how fast frames really are: if the device keeps falling well
// behind, the level steps down, and the device remembers it for next time. If a device
// that stepped down later runs smoothly for a while, it steps back up again (never above
// what its age suggests).

const KEY = 'play-party-motion';
const NAMES = ['Full', 'Light', 'Minimal'];
const FPS = [30, 15, 8];
const SCALE = [1, 0.75, 0.5];

function guessLevel() {
  const ua = navigator.userAgent || '';
  let level = 0;
  const ios = /(iPhone|iPad|iPod).* OS (\d+)_/.exec(ua);
  if (ios) {
    const v = +ios[2];
    if (v <= 10) level = 2;
    else if (v <= 12) level = 1;
  }
  const android = /Android (\d+)/.exec(ua);
  if (android) {
    const v = +android[1];
    if (v <= 5) level = 2;
    else if (v <= 7) level = Math.max(level, 1);
  }
  const mem = navigator.deviceMemory;
  if (mem && mem <= 1) level = 2;
  else if (mem && mem <= 2) level = Math.max(level, 1);
  const cores = navigator.hardwareConcurrency;
  if (cores && cores <= 2) level = Math.max(level, 1);
  return level;
}

function remembered() {
  try {
    const v = +localStorage.getItem(KEY);
    return v >= 0 && v <= 2 ? v : 0;
  } catch (e) { return 0; }
}

const guessed = guessLevel();
let level = Math.max(guessed, remembered());
const listeners = [];

export const motion = {
  get level() { return level; },
  get name() { return NAMES[level]; },
  get fps() { return FPS[level]; },
  get scale() { return SCALE[level]; },
  // for the grown-up corner: why this level was picked
  get reason() {
    if (!level) return 'automatic';
    return level > guessed ? 'automatic, this device was running slowly' : 'automatic, older device';
  },
};

export function onMotionChange(fn) { listeners.push(fn); }

function setLevel(v) {
  if (v === level) return;
  level = v;
  try { localStorage.setItem(KEY, String(v)); } catch (e) { /* private mode: just this visit */ }
  listeners.forEach((fn) => fn(level));
}

// Called once per animation frame with the real frame time in seconds.
let warm = 0; // the first seconds after loading are always bumpy: ignore them
let windowT = 0;
let windowFrames = 0;
let slowWindows = 0;
let fastWindows = 0;
export function noteFrame(dt) {
  if (dt > 0.25 || dt <= 0) return; // the tab was hidden, or the clock jumped
  if (warm < 3) { warm += dt; return; }
  windowT += dt;
  windowFrames++;
  if (windowT < 4) return;
  const fps = windowFrames / windowT;
  windowT = 0;
  windowFrames = 0;
  // under about 30 frames a second for two windows in a row (8 s): step down a level
  slowWindows = fps < 30 ? slowWindows + 1 : 0;
  // smooth (about 55 or more) for five windows in a row (20 s): step back up
  fastWindows = fps >= 55 ? fastWindows + 1 : 0;
  if (slowWindows >= 2 && level < 2) {
    slowWindows = 0;
    fastWindows = 0;
    warm = 0;
    setLevel(level + 1);
  } else if (fastWindows >= 5 && level > guessed) {
    slowWindows = 0;
    fastWindows = 0;
    setLevel(level - 1);
  }
}
