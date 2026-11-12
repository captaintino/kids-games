// Made-up animal voices, synthesized live with Web Audio (no sound files).
//
// Each animal is a few "voices": oscillators with pitch envelopes, vibrato,
// tremolo and formant filters, plus filtered noise for breath and snorts.
//   play(id)            play an animal's sound now (returns its length in seconds)
//   SOUNDS[id].syl      when the mouth is open: [[start, length], ...] in seconds
//   render(id, ctx, out) the same, into any AudioContext (used for testing)
import * as sfx from '../../shared/js/audio.js';

const noiseBufs = new WeakMap();
function noiseBuffer(ctx) {
  let b = noiseBufs.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.5), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseBufs.set(ctx, b);
  }
  return b;
}

// Points are [time, value]; times are relative to t0.
function automate(param, t0, pts, exp) {
  if (typeof pts === 'number') { param.setValueAtTime(pts, t0); return; }
  param.setValueAtTime(pts[0][1], t0 + pts[0][0]);
  for (let i = 1; i < pts.length; i++) {
    const t = t0 + pts[i][0];
    const v = pts[i][1];
    if (exp) param.exponentialRampToValueAtTime(Math.max(0.0001, v), t);
    else param.linearRampToValueAtTime(v, t);
  }
}

function filterChain(ctx, t0, defs, last) {
  let head = last;
  for (let i = (defs || []).length - 1; i >= 0; i--) {
    const fd = defs[i];
    const f = ctx.createBiquadFilter();
    f.type = fd.type;
    f.Q.value = fd.Q || 1;
    automate(f.frequency, t0, fd.f, true);
    f.connect(head);
    head = f;
  }
  return head;
}

function lfo(ctx, t0, end, rate, depth, target, type) {
  const o = ctx.createOscillator();
  o.type = type || 'sine';
  o.frequency.value = rate;
  const g = ctx.createGain();
  g.gain.value = depth;
  o.connect(g);
  g.connect(target);
  o.start(t0);
  o.stop(end);
}

/**
 * One pitched voice.
 * o.t delay, o.type wave, o.f pitch points, o.g volume points, o.p pitch multiplier,
 * o.vib [rate, depthHz], o.trem [rate, depth 0..1, wave], o.filters [{type, f, Q}], o.detune cents
 */
function voice(ctx, out, base, o) {
  const t0 = base + (o.t || 0);
  const end = t0 + o.g[o.g.length - 1][0] + 0.05;
  const p = o.p || 1;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, ctx.currentTime);
  automate(amp.gain, t0, o.g, false);
  amp.connect(out);
  let into = amp;
  if (o.trem) {
    const tr = ctx.createGain();
    tr.gain.value = 1 - o.trem[1] / 2;
    lfo(ctx, t0, end, o.trem[0], o.trem[1] / 2, tr.gain, o.trem[2]);
    tr.connect(amp);
    into = tr;
  }
  const head = filterChain(ctx, t0, o.filters, into);
  const detunes = o.detune ? [-o.detune, o.detune] : [0];
  const fpts = o.f.map((q) => [q[0], q[1] * p]);
  detunes.forEach((dc) => {
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    automate(osc.frequency, t0, fpts, true);
    if (dc) osc.detune.value = dc;
    if (o.vib) lfo(ctx, t0, end, o.vib[0], o.vib[1] * p, osc.frequency);
    const g = ctx.createGain();
    g.gain.value = 1 / detunes.length;
    osc.connect(g);
    g.connect(head);
    osc.start(t0);
    osc.stop(end);
  });
}

/** Filtered noise: o.t delay, o.g volume points, o.filters, o.rate playback speed */
function hiss(ctx, out, base, o) {
  const t0 = base + (o.t || 0);
  const end = t0 + o.g[o.g.length - 1][0] + 0.05;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuffer(ctx);
  s.loop = true;
  if (o.rate) s.playbackRate.value = o.rate;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, ctx.currentTime);
  automate(amp.gain, t0, o.g, false);
  amp.connect(out);
  s.connect(filterChain(ctx, t0, o.filters, amp));
  s.start(t0, Math.random());
  s.stop(end);
}

// A short envelope helper: up in `a` seconds to `v`, hold, down by `d`.
const env = (v, a, hold, d) => [[0, 0], [a, v], [a + hold, v * 0.8], [a + hold + d, 0]];

export const SOUNDS = {
  cow: {
    vol: 0.8,
    syl: [[0.02, 1.1]],
    make(V, p) {
      V({ type: 'sawtooth', detune: 9, p, f: [[0, 104], [0.28, 122], [0.85, 112], [1.15, 90]], vib: [5, 2.5],
        g: [[0, 0], [0.14, 0.55], [0.85, 0.5], [1.15, 0]],
        filters: [{ type: 'lowpass', f: [[0, 260], [0.32, 980], [0.8, 700], [1.15, 300]], Q: 7 }] });
      V({ type: 'sine', p, f: [[0, 52], [0.28, 61], [1.15, 45]], g: [[0, 0], [0.15, 0.25], [0.9, 0.22], [1.15, 0]] });
    },
  },
  pig: {
    vol: 4.5,
    syl: [[0, 0.24], [0.32, 0.24]],
    make(V, p, N) {
      [0, 0.32].forEach((t, i) => {
        const q = p * (i ? 1.1 : 1);
        V({ t, type: 'sawtooth', p: q, f: [[0, 190], [0.07, 225], [0.24, 150]], trem: [42, 0.75, 'square'],
          g: env(0.6, 0.02, 0.14, 0.08),
          filters: [{ type: 'bandpass', f: [[0, 650], [0.1, 1350], [0.24, 700]], Q: 4 }] });
        N({ t, g: env(0.12, 0.01, 0.1, 0.08), filters: [{ type: 'bandpass', f: 900 * q, Q: 2 }] });
      });
    },
  },
  duck: {
    vol: 1.75,
    syl: [[0, 0.2], [0.3, 0.2]],
    make(V, p, N) {
      [0, 0.3].forEach((t, i) => {
        const q = p * (i ? 0.95 : 1);
        V({ t, type: 'square', p: q, f: [[0, 560], [0.04, 640], [0.2, 420]],
          g: env(0.9, 0.012, 0.12, 0.07),
          filters: [{ type: 'bandpass', f: [[0, 1500], [0.06, 1700], [0.2, 900]], Q: 6 }] });
        N({ t, g: env(0.1, 0.005, 0.03, 0.04), filters: [{ type: 'bandpass', f: 2400, Q: 2 }] });
      });
    },
  },
  dog: {
    vol: 0.75,
    syl: [[0, 0.18], [0.28, 0.2]],
    make(V, p, N) {
      [0, 0.28].forEach((t, i) => {
        const q = p * (i ? 0.92 : 1);
        V({ t, type: 'sawtooth', p: q, f: [[0, 320], [0.035, 390], [0.17, 175]],
          g: env(0.75, 0.01, 0.07, 0.1),
          filters: [{ type: 'lowpass', f: [[0, 2400], [0.17, 480]], Q: 4 }] });
        N({ t, g: env(0.35, 0.004, 0.03, 0.07), filters: [{ type: 'bandpass', f: 1300, Q: 1 }] });
      });
    },
  },
  cat: {
    vol: 3.4,
    syl: [[0.02, 0.85]],
    make(V, p) {
      V({ type: 'sawtooth', detune: 6, p, f: [[0, 470], [0.22, 760], [0.55, 700], [0.86, 420]], vib: [6, 9],
        g: [[0, 0], [0.08, 0.5], [0.6, 0.45], [0.86, 0]],
        filters: [{ type: 'bandpass', f: [[0, 700], [0.25, 2300], [0.6, 1500], [0.86, 650]], Q: 3 }] });
    },
  },
  sheep: {
    vol: 4.0,
    syl: [[0.02, 0.9]],
    make(V, p) {
      V({ type: 'sawtooth', detune: 12, p, f: [[0, 320], [0.1, 360], [0.8, 335], [0.92, 300]], vib: [7, 9],
        trem: [7.5, 0.75],
        g: [[0, 0], [0.06, 0.6], [0.75, 0.5], [0.92, 0]],
        filters: [{ type: 'bandpass', f: [[0, 500], [0.12, 1150], [0.92, 850]], Q: 2.5 }] });
    },
  },
  horse: {
    vol: 3.4,
    syl: [[0, 1.0]],
    make(V, p, N) {
      V({ type: 'sawtooth', p, f: [[0, 700], [0.12, 1150], [0.5, 860], [1.0, 440]], vib: [13, 75], trem: [13, 0.6],
        g: [[0, 0], [0.05, 0.45], [0.8, 0.35], [1.0, 0]],
        filters: [{ type: 'bandpass', f: [[0, 1700], [1.0, 1000]], Q: 2.5 }] });
      N({ t: 1.05, g: [[0, 0], [0.04, 0.35], [0.12, 0.25], [0.3, 0]], filters: [{ type: 'lowpass', f: 650, Q: 1 }] });
    },
  },
  chicken: {
    vol: 2.5,
    syl: [[0, 0.09], [0.16, 0.09], [0.32, 0.09], [0.52, 0.42]],
    make(V, p) {
      [0, 0.16, 0.32].forEach((t) => {
        V({ t, type: 'square', p, f: [[0, 420], [0.02, 580], [0.09, 380]],
          g: env(0.7, 0.008, 0.04, 0.045),
          filters: [{ type: 'bandpass', f: 1250, Q: 4 }] });
      });
      V({ t: 0.52, type: 'sawtooth', p, f: [[0, 520], [0.08, 840], [0.42, 600]], vib: [8, 16],
        g: [[0, 0], [0.03, 0.5], [0.3, 0.42], [0.42, 0]],
        filters: [{ type: 'bandpass', f: [[0, 1000], [0.1, 1900], [0.42, 1200]], Q: 3 }] });
    },
  },
  frog: {
    vol: 2.6,
    syl: [[0, 0.15], [0.2, 0.16]],
    make(V, p) {
      V({ t: 0, type: 'square', p, f: [[0, 175], [0.14, 195]], trem: [32, 1, 'square'],
        g: env(0.75, 0.01, 0.1, 0.04), filters: [{ type: 'bandpass', f: 850, Q: 3 }] });
      V({ t: 0.2, type: 'square', p, f: [[0, 215], [0.15, 255]], trem: [36, 1, 'square'],
        g: env(0.75, 0.01, 0.11, 0.04), filters: [{ type: 'bandpass', f: 1100, Q: 3 }] });
    },
  },
  lion: {
    vol: 1.1,
    syl: [[0.02, 1.25]],
    make(V, p, N) {
      V({ type: 'sawtooth', detune: 18, p, f: [[0, 100], [0.3, 135], [1.3, 75]], trem: [24, 0.45],
        g: [[0, 0], [0.22, 0.6], [0.9, 0.5], [1.3, 0]],
        filters: [{ type: 'lowpass', f: [[0, 320], [0.35, 1500], [1.3, 380]], Q: 6 }] });
      N({ g: [[0, 0], [0.25, 0.14], [1.2, 0]], filters: [{ type: 'bandpass', f: [[0, 500], [0.4, 1100], [1.2, 420]], Q: 1.4 }] });
    },
  },
  owl: {
    vol: 0.6,
    syl: [[0, 0.38], [0.45, 0.4]],
    make(V, p, N) {
      [0, 0.45].forEach((t, i) => {
        const q = p * (i ? 0.94 : 1);
        V({ t, type: 'sine', p: q, f: [[0, 400], [0.07, 450], [0.38, 390]], vib: [5, 4],
          g: [[0, 0], [0.06, 0.6], [0.26, 0.5], [0.4, 0]] });
        V({ t, type: 'triangle', p: q * 2, f: [[0, 400], [0.07, 450], [0.38, 390]],
          g: [[0, 0], [0.06, 0.06], [0.3, 0.04], [0.4, 0]] });
        N({ t, g: [[0, 0], [0.05, 0.05], [0.3, 0]], filters: [{ type: 'lowpass', f: 900, Q: 1 }] });
      });
    },
  },
  bee: {
    vol: 1.5,
    syl: [[0, 1.2]],
    make(V, p) {
      V({ type: 'sawtooth', detune: 22, p, f: [[0, 205], [0.6, 245], [1.2, 200]], vib: [9, 16], trem: [17, 0.35],
        g: [[0, 0], [0.1, 0.4], [1.0, 0.38], [1.2, 0]],
        filters: [{ type: 'lowpass', f: 1900, Q: 3 }] });
    },
  },
  elephant: {
    vol: 2.6,
    syl: [[0, 1.0]],
    make(V, p, N) {
      V({ type: 'sawtooth', detune: 12, p, f: [[0, 380], [0.15, 640], [0.7, 570], [1.0, 400]], vib: [7, 20],
        g: [[0, 0], [0.06, 0.55], [0.75, 0.45], [1.0, 0]],
        filters: [{ type: 'bandpass', f: [[0, 900], [0.2, 1700], [1.0, 1000]], Q: 2 }] });
      N({ g: [[0, 0], [0.1, 0.06], [0.9, 0]], filters: [{ type: 'bandpass', f: 1500, Q: 1.5 }] });
    },
  },
  mouse: {
    vol: 0.7,
    syl: [[0, 0.15], [0.22, 0.16]],
    make(V, p) {
      [0, 0.22].forEach((t, i) => {
        V({ t, type: 'sine', p: p * (i ? 1.08 : 1), f: [[0, 2000], [0.04, 2900], [0.15, 2400]], vib: [25, 60],
          g: env(0.4, 0.01, 0.1, 0.04) });
      });
    },
  },
  monkey: {
    vol: 0.85,
    syl: [[0, 0.18], [0.22, 0.18], [0.5, 0.26], [0.78, 0.26]],
    make(V, p) {
      [0, 0.22].forEach((t) => {
        V({ t, type: 'triangle', p, f: [[0, 330], [0.15, 540]],
          g: env(0.7, 0.03, 0.1, 0.05), filters: [{ type: 'lowpass', f: 1000, Q: 2 }] });
      });
      [0.5, 0.78].forEach((t, i) => {
        V({ t, type: 'sawtooth', p: p * (i ? 1.06 : 1), f: [[0, 560], [0.08, 830], [0.26, 640]], vib: [9, 22],
          g: env(0.55, 0.03, 0.17, 0.06),
          filters: [{ type: 'bandpass', f: [[0, 1000], [0.1, 1650], [0.26, 1100]], Q: 2 }] });
      });
    },
  },
};

/** Length of a sound in seconds (end of the last mouth movement). */
export function soundLength(id) {
  const s = SOUNDS[id].syl;
  const last = s[s.length - 1];
  return last[0] + last[1];
}

/** Play into any context (used by play() and by tests with an OfflineAudioContext). */
export function render(id, ctx, out, pitch = 1) {
  const base = ctx.currentTime + 0.02;
  const level = ctx.createGain();
  level.gain.value = SOUNDS[id].vol || 1;
  level.connect(out);
  const V = (o) => voice(ctx, level, base, o);
  const N = (o) => hiss(ctx, level, base, o);
  SOUNDS[id].make(V, pitch, N);
}

/** Play an animal's sound now, slightly varied each time. */
export function play(id) {
  if (!sfx.ready()) return;
  const ctx = sfx.context();
  try {
    render(id, ctx, sfx.output(), 0.96 + Math.random() * 0.08);
  } catch (err) { /* very old audio engines: stay silent */ }
}
