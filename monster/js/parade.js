// Monster Parade: every saved monster marches across the screen in a line to a
// synthesized marching-band beat, with confetti, and each name is said as it passes
// the middle. Tap a monster to make it jump and giggle. The line loops forever.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import { $, fx, onPointer, pickOne } from '../../shared/js/kit.js';
import { monsterSVG } from './parts.js';
import { createBeat } from './beat.js';
import { setPose, marchPose } from './moves.js';
import { rigMonster } from './rig.js';

// ---------------------------------------------------------------------------
// The parade song: oom-pah tuba, a marching drum, a bright brass tune and bells
// ---------------------------------------------------------------------------
const BPM = 112;
const C = 261.63;
const note = (n) => C * Math.pow(2, n / 12);
const TUBA = [[0, 7], [5, 9], [7, 11], [0, 7]];          // root and fifth per bar (C, F, G, C)
const TUNE = [
  [[0, 7], [2, 12], [4, 12], [6, 11], [8, 12], [10, 14], [12, 16]],
  [[0, 17], [4, 16], [6, 14], [8, 12], [12, 9]],
  [[0, 11], [2, 14], [4, 14], [6, 12], [8, 11], [10, 9], [12, 7]],
  [[0, 12], [4, 16], [8, 19], [12, 24]],
  [[0, 7], [2, 12], [4, 12], [6, 11], [8, 12], [10, 14], [12, 16]],
  [[0, 17], [2, 16], [4, 17], [6, 19], [8, 21], [12, 17]],
  [[0, 19], [2, 17], [4, 16], [6, 14], [8, 12], [10, 11], [12, 14]],
  [[0, 12], [8, 12], [12, 12]],
];
function paradeStep(i, d) {
  const T = sfx.tone;
  const s = i % 16;
  const bar = Math.floor(i / 16) % 8;
  // big drum on 1 and 3, snare on 2 and 4, a little roll at the end of every other bar
  if (s === 0 || s === 8) T({ type: 'sine', f0: 120, f1: 42, dur: 0.24, vol: 0.55, delay: d });
  if (s === 4 || s === 12) sfx.noise({ dur: 0.11, vol: 0.3, freq: 2000, delay: d });
  if (bar % 2 === 1 && s >= 13) sfx.noise({ dur: 0.05, vol: 0.12 + (s - 13) * 0.05, freq: 2400, delay: d });
  if (s % 4 === 2) sfx.noise({ dur: 0.03, vol: 0.05, freq: 8000, delay: d });
  // crash at the top of the tune
  if (i % 128 === 0) sfx.noise({ dur: 0.6, vol: 0.16, freq: 6000, delay: d });
  // oom-pah
  const tb = TUBA[bar % 4];
  if (s === 0 || s === 8) T({ type: 'triangle', f0: note(tb[0] - 24), dur: 0.22, vol: 0.34, delay: d });
  if (s === 4 || s === 12) T({ type: 'triangle', f0: note(tb[1] - 24), dur: 0.16, vol: 0.24, delay: d });
  // brass tune
  for (const [ms, n] of TUNE[bar]) {
    if (ms !== s) continue;
    const f = note(n);
    T({ type: 'square', f0: f, dur: 0.2, vol: 0.05, delay: d });
    T({ type: 'sawtooth', f0: f / 2, dur: 0.16, vol: 0.025, delay: d });
    T({ type: 'triangle', f0: f, dur: 0.24, vol: 0.11, delay: d });
  }
  // glockenspiel sparkle on the downbeat
  if (s === 0 && bar % 2 === 0) T({ type: 'sine', f0: note(tb[0] + 24), dur: 0.5, vol: 0.06, delay: d });
}

export function createParade(env) {
  const root = $('#parade');
  const lane = $('#parade-lane');
  const beat = createBeat({ bpm: BPM, loopSteps: 128, play: paradeStep });
  let open = false;
  let mons = [];
  let W = 0;
  let mw = 100;      // one monster's box
  let mh = 120;
  let gap = 120;     // distance from one monster to the next
  let loop = 400;    // the whole line, wrapping around
  let groundY = 300;
  let dist = 0;
  let speed = 60;
  let lastBar = -1;
  let lastT = 0;

  function layout() {
    if (!open) return;
    W = window.innerWidth;
    const r = lane.getBoundingClientRect();
    const NAME = 40;   // room for the name tag under the feet
    mh = Math.max(100, Math.min(r.height - NAME, Math.max(360, window.innerHeight * 0.4), W * 0.62));
    mw = mh * 400 / 480;
    gap = mw * 1.12;
    loop = Math.max(W + gap, mons.length * gap);
    groundY = r.top + r.height - mh - NAME;
    speed = gap / 1.8;
    mons.forEach((pm) => {
      pm.el.style.width = `${mw.toFixed(0)}px`;
      pm.el.style.height = `${(mh + 40).toFixed(0)}px`;
      pm.R.fit(+mw.toFixed(0), +mh.toFixed(0));
    });
  }

  function start(list) {
    open = true;
    root.classList.remove('hidden');
    lane.innerHTML = '';
    mons = list.map((m, i) => {
      const el = document.createElement('div');
      el.className = 'p-mon';
      el.setAttribute('data-i', String(i));
      el.innerHTML = `<div class="p-svg"></div><div class="p-name">${m.name || 'Monster'}</div>`;
      lane.appendChild(el);
      // cut into layers that march with CSS transforms (rig.js): nothing is repainted per frame
      const R = rigMonster(el.firstChild, monsterSVG(m, { id: `pm${i}` }), `pm${i}`);
      return { m, el, name: el.lastChild, R, style: i % 3, jumpT: -9, x: -9999, shown: true, spoke: false };
    });
    layout();
    // the first monster starts just off the left edge
    dist = gap * 0.2;
    lastBar = -1;
    beat.start(null, Infinity);
    fx.confetti(60);
    say(pickOne(['Parade time!', "Here comes the monster parade!", "Let's march!"]), { pitch: 1.3 });
  }

  function stop() {
    open = false;
    beat.stop();
    root.classList.add('hidden');
    lane.innerHTML = '';
    mons = [];
  }

  function frame(dt, t) {
    if (!open) return;
    lastT = t;
    dist += speed * dt;
    const b = beat.beat();
    const bar = Math.floor(b / 4);
    if (bar !== lastBar) {
      lastBar = bar;
      if (bar > 0 && bar % 4 === 0) fx.confetti(45);
    }
    const mid = W / 2;
    for (let i = 0; i < mons.length; i++) {
      const pm = mons[i];
      // where this monster is in the looping line (left edge of its box)
      let x = (((dist - i * gap) % loop) + loop) % loop - gap;
      const visible = x > -mw - 20 && x < W + 20;
      if (!visible) {
        if (pm.shown) { pm.el.style.visibility = 'hidden'; pm.shown = false; }
        pm.spoke = false;
        pm.x = x;
        continue;
      }
      if (!pm.shown) { pm.el.style.visibility = ''; pm.shown = true; }
      // say the name as it passes the middle
      const cx = x + mw / 2;
      if (!pm.spoke && pm.x + mw / 2 < mid && cx >= mid) {
        pm.spoke = true;
        say(pm.m.name || 'Monster!', { pitch: 1.3 });
        fx.sparkles(cx, groundY + mh * 0.2, 8, 60);
        pm.name.classList.remove('cheer');
        void pm.name.offsetWidth;
        pm.name.classList.add('cheer');
      }
      pm.x = x;
      // tapped: a big jump with a twirl
      let jy = 0;
      const p = marchPose(b + i * 0.5 * (pm.style === 0 ? 0 : 1), pm.style, pm.R.legs.length);
      const kj = t - pm.jumpT;
      if (kj < 0.75) {
        const k = kj / 0.75;
        jy = -Math.sin(k * Math.PI) * mh * 0.45;
        p.sx *= Math.cos(k * Math.PI * 2);
        p.armR = -110;
        p.armL = -110;
        p.eye = 0.5;
      }
      pm.el.style.transform = `translate3d(${x.toFixed(1)}px,${(groundY + jy).toFixed(1)}px,0)`;
      setPose(pm.R, p);
    }
  }

  onPointer(root, {
    down(p, e) {
      if (!open) return false;
      const el = e && e.target && e.target.closest ? e.target.closest('.p-mon') : null;
      if (!el) return false;
      const pm = mons[+el.getAttribute('data-i')];
      if (!pm || lastT - pm.jumpT < 0.6) return true;
      pm.jumpT = lastT;
      env.giggle();
      if (sfx.ready()) sfx.tone({ type: 'sine', f0: 300, f1: 900, dur: 0.18, vol: 0.18 });
      fx.sparkles(p.x, p.y, 10, 50);
      return true;
    },
  });

  return {
    start, stop, frame, layout,
    get open() { return open; },
    get count() { return mons.length; },
    beat,
    jump(i) { if (mons[i]) mons[i].jumpT = lastT; },
    positions: () => mons.map((pm) => Math.round(pm.x)),
  };
}
