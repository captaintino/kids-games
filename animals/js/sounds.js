// Real animal recordings (see sounds/CREDITS.md for where each one comes from).
//
//   play(id)            play an animal's sound now
//   SOUNDS[id].syl      when the mouth is open: [[start, length], ...] in seconds,
//                       measured from the recording's loudness (sound-data.js)
//   soundLength(id)     how long the sound lasts, in seconds
//   preload()           fetch and decode every sound (done on the first tap)
//
// Files are short mono MP3s, which every browser back to Safari 12 can decode.
import * as sfx from '../../shared/js/audio.js';
import { CLIPS } from './sound-data.js';

export const SOUNDS = CLIPS;

const buffers = {};
const pending = {};

function decode(ctx, data) {
  return new Promise((resolve, reject) => {
    // the callback form: Safari before 14.1 has no promise version
    const p = ctx.decodeAudioData(data, resolve, reject);
    if (p && p.catch) p.catch(reject);
  });
}

function load(id) {
  if (buffers[id]) return Promise.resolve(buffers[id]);
  if (pending[id]) return pending[id];
  const ctx = sfx.context();
  if (!ctx || !CLIPS[id]) return Promise.resolve(null);
  pending[id] = fetch(`sounds/${id}.mp3`)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
    .then((data) => decode(ctx, data))
    .then((buf) => { buffers[id] = buf; return buf; })
    .catch(() => { pending[id] = null; return null; });
  return pending[id];
}

/** Fetch and decode every animal's sound, one after another so the first tap stays snappy. */
export function preload() {
  const ids = Object.keys(CLIPS);
  let chain = Promise.resolve();
  ids.forEach((id) => { chain = chain.then(() => load(id)); });
  return chain;
}

/** Length of a sound in seconds. */
export function soundLength(id) {
  return CLIPS[id] ? CLIPS[id].len : 1;
}

function start(id, buf) {
  const ctx = sfx.context();
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.value = CLIPS[id].vol || 1;
  src.connect(gain);
  gain.connect(sfx.output());
  src.start(0);
}

/** Play an animal's sound now. */
export function play(id) {
  if (!sfx.ready() || !CLIPS[id]) return;
  const buf = buffers[id];
  if (buf) {
    try { start(id, buf); } catch (err) { /* very old audio engines: stay silent */ }
    return;
  }
  // not loaded yet (the very first tap): play it as soon as it arrives, if that's quick
  const asked = Date.now();
  load(id).then((b) => {
    if (b && Date.now() - asked < 900 && sfx.ready()) {
      try { start(id, b); } catch (err) { /* ignore */ }
    }
  });
}

// Start loading on the first touch, right after the kit has unlocked audio.
function firstTouch() {
  ['pointerdown', 'touchend', 'mousedown', 'keydown'].forEach((t) => window.removeEventListener(t, firstTouch, true));
  setTimeout(() => { if (sfx.context()) preload(); }, 0);
}
['pointerdown', 'touchend', 'mousedown', 'keydown'].forEach((t) => window.addEventListener(t, firstTouch, true));
