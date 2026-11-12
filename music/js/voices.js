// Music Time's instrument voices, built from the shared synth's AudioContext and
// master output (shared/js/audio.js). Every note starts the instant it is
// called (no scheduling delay), so a finger landing on a key sounds right away.
import { context, output, isMuted } from '../../shared/js/audio.js';

let noiseBuf = null;
const live = [];          // { gain, end } for the voice limiter
const MAX_VOICES = 18;

function ac() {
  const c = context();
  if (!c || isMuted() || !output()) return null;
  return c;
}

function noiseBuffer(c) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 1.2), c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

export const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

/** A voice's own gain node, tracked so a glissando never piles up too many notes. */
function voiceGain(c, vol, end) {
  const now = c.currentTime;
  for (let i = live.length - 1; i >= 0; i--) if (live[i].end < now) live.splice(i, 1);
  while (live.length >= MAX_VOICES) {
    const old = live.shift();
    try {
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setTargetAtTime(0, now, 0.015);
    } catch (err) { /* ignore */ }
  }
  const g = c.createGain();
  g.gain.value = vol;
  g.connect(output());
  live.push({ gain: g, end });
  return g;
}

/** One decaying partial: a sine (or other wave) with a fast attack and an exponential decay. */
function partial(c, dest, type, freq, amp, attack, decay, t, detune) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  if (detune) o.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(amp, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  o.connect(g);
  g.connect(dest);
  o.start(t);
  o.stop(t + attack + decay + 0.05);
  return o;
}

function noiseHit(c, dest, { type = 'highpass', freq = 6000, q = 0.7, vol = 0.3, dur = 0.1, t, attack = 0.001 }) {
  const s = c.createBufferSource();
  s.buffer = noiseBuffer(c);
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
  s.connect(f);
  f.connect(g);
  g.connect(dest);
  // start somewhere random in the buffer so repeated hits do not sound identical
  const off = Math.random() * 0.6;
  s.start(t, off);
  s.stop(t + attack + dur + 0.05);
}

// ---------------------------------------------------------------------------
// Mallet sounds for the xylophone (and the toy piano)
// ---------------------------------------------------------------------------
// Struck bars ring with inharmonic partials that die away faster the higher they are.
const MALLETS = {
  // glockenspiel-like bell: bright, long ring
  bell: { oct: 12, parts: [[1, 1, 1.5], [2.76, 0.42, 0.55], [5.4, 0.2, 0.25], [8.93, 0.08, 0.12]], vol: 0.28, click: 0.05 },
  // wooden marimba: warm, rounder, shorter
  marimba: { oct: 0, parts: [[1, 1, 0.75], [3.93, 0.28, 0.22], [9.2, 0.08, 0.06]], vol: 0.42, click: 0.12 },
  // toy piano: tine-like, a little plinky
  toy: { oct: 12, parts: [[1, 1, 0.9], [2.01, 0.3, 0.45], [3.9, 0.22, 0.18], [5.8, 0.1, 0.08]], vol: 0.3, click: 0.08, type: 'triangle' },
};

export function mallet(midi, kind = 'bell', vel = 1) {
  const c = ac();
  if (!c) return;
  const m = MALLETS[kind] || MALLETS.bell;
  const f = midiHz(midi + m.oct);
  const t = c.currentTime;
  // higher notes ring a bit shorter, like real bars
  const len = Math.pow(2, -(midi - 60) / 24);
  const g = voiceGain(c, m.vol * vel, t + 2);
  m.parts.forEach((p, i) => {
    const fr = f * p[0];
    if (fr > 16000) return;
    partial(c, g, i === 0 && m.type ? m.type : 'sine', fr, p[1], 0.002, p[2] * len, t);
  });
  // the mallet's soft "tock"
  noiseHit(c, g, { type: 'bandpass', freq: Math.min(9000, f * 3), q: 1.2, vol: m.click, dur: 0.025, t });
}

// ---------------------------------------------------------------------------
// Piano: two detuned oscillators through a closing low-pass filter
// ---------------------------------------------------------------------------
export function piano(midi, vel = 1) {
  const c = ac();
  if (!c) return;
  const f = midiHz(midi);
  const t = c.currentTime;
  const len = 1.6 * Math.pow(2, -(midi - 60) / 30);
  const g = voiceGain(c, 0.34 * vel, t + len + 0.3);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.5;
  lp.frequency.setValueAtTime(Math.min(12000, f * 9), t);
  lp.frequency.exponentialRampToValueAtTime(Math.min(8000, f * 2.2), t + 0.45);
  lp.connect(g);
  // body: hammer hits hard, then the string settles into a long decay
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(1, t + 0.004);
  env.gain.exponentialRampToValueAtTime(0.42, t + 0.12);
  env.gain.exponentialRampToValueAtTime(0.0001, t + len);
  env.connect(lp);
  const oscs = [['triangle', 1, 4, 0.75], ['sawtooth', 1, -5, 0.22], ['sine', 2, 3, 0.18]];
  oscs.forEach((o) => {
    const osc = c.createOscillator();
    const og = c.createGain();
    osc.type = o[0];
    osc.frequency.value = f * o[1];
    osc.detune.value = o[2];
    og.gain.value = o[3];
    osc.connect(og);
    og.connect(env);
    osc.start(t);
    osc.stop(t + len + 0.05);
  });
  noiseHit(c, g, { type: 'lowpass', freq: 2500, q: 0.5, vol: 0.05, dur: 0.03, t });
}

// ---------------------------------------------------------------------------
// Drums
// ---------------------------------------------------------------------------
function drop(c, dest, { f0, f1, dur, vol, type = 'sine', t }) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(dest);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Metal: a few square waves at odd ratios through a band-pass (cowbell, cymbal shimmer). */
function metal(c, dest, { base, ratios, vol, dur, t, bp = 3000, q = 1 }) {
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = bp;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  f.connect(g);
  g.connect(dest);
  ratios.forEach((r) => {
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.value = base * r;
    o.connect(f);
    o.start(t);
    o.stop(t + dur + 0.05);
  });
}

export const DRUM_SOUNDS = {
  kick(c, g, t) {
    drop(c, g, { f0: 160, f1: 42, dur: 0.5, vol: 1, t });
    drop(c, g, { f0: 90, f1: 40, dur: 0.35, vol: 0.4, type: 'triangle', t });
    noiseHit(c, g, { type: 'lowpass', freq: 1800, vol: 0.25, dur: 0.02, t });
  },
  snare(c, g, t) {
    drop(c, g, { f0: 240, f1: 170, dur: 0.14, vol: 0.5, type: 'triangle', t });
    noiseHit(c, g, { type: 'highpass', freq: 1500, vol: 0.55, dur: 0.2, t });
    noiseHit(c, g, { type: 'bandpass', freq: 4500, q: 0.6, vol: 0.25, dur: 0.12, t });
  },
  tom1(c, g, t) {
    drop(c, g, { f0: 330, f1: 190, dur: 0.38, vol: 0.75, t });
    noiseHit(c, g, { type: 'bandpass', freq: 1200, vol: 0.12, dur: 0.04, t });
  },
  tom2(c, g, t) {
    drop(c, g, { f0: 240, f1: 140, dur: 0.45, vol: 0.8, t });
    noiseHit(c, g, { type: 'bandpass', freq: 900, vol: 0.12, dur: 0.04, t });
  },
  floortom(c, g, t) {
    drop(c, g, { f0: 170, f1: 90, dur: 0.6, vol: 0.85, t });
    noiseHit(c, g, { type: 'bandpass', freq: 700, vol: 0.12, dur: 0.05, t });
  },
  hihat(c, g, t) {
    noiseHit(c, g, { type: 'highpass', freq: 7500, vol: 0.4, dur: 0.07, t });
    metal(c, g, { base: 320, ratios: [2, 3, 4.16, 5.43, 6.79, 8.21], vol: 0.06, dur: 0.06, t, bp: 10000, q: 0.8 });
  },
  crash(c, g, t) {
    noiseHit(c, g, { type: 'highpass', freq: 4500, vol: 0.38, dur: 1.5, t, attack: 0.004 });
    noiseHit(c, g, { type: 'bandpass', freq: 7000, q: 0.5, vol: 0.18, dur: 0.9, t });
    metal(c, g, { base: 300, ratios: [2, 3, 4.16, 5.43, 6.79, 8.21], vol: 0.07, dur: 1.1, t, bp: 8000, q: 0.6 });
  },
  cowbell(c, g, t) {
    metal(c, g, { base: 1, ratios: [587, 845], vol: 0.5, dur: 0.35, t, bp: 800, q: 1.4 });
    metal(c, g, { base: 1, ratios: [587, 845], vol: 0.25, dur: 0.08, t, bp: 2600, q: 1 });
  },
  tambourine(c, g, t) {
    // a little shake: several jingles close together
    for (let i = 0; i < 4; i++) {
      const tt = t + i * 0.035 + Math.random() * 0.01;
      noiseHit(c, g, { type: 'highpass', freq: 6500, vol: 0.32 - i * 0.06, dur: 0.12, t: tt });
      metal(c, g, { base: 1, ratios: [5200 + Math.random() * 600, 7100], vol: 0.04, dur: 0.1, t: tt, bp: 7000, q: 2 });
    }
  },
};

export function drum(name, vel = 1) {
  const c = ac();
  if (!c || !DRUM_SOUNDS[name]) return;
  const t = c.currentTime;
  const g = voiceGain(c, 0.85 * vel, t + (name === 'crash' ? 1.6 : 0.7));
  DRUM_SOUNDS[name](c, g, t);
}

/** Play a note on the chosen melodic sound. */
export function note(midi, sound, vel) {
  if (sound === 'piano') piano(midi, vel);
  else mallet(midi, sound, vel);
}
