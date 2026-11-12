// Music Time: a rainbow xylophone, a drum kit and a big-key piano.
// "Follow the lights" plays a bit of a tune by lighting keys; the kid taps it back.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import {
  boot, $, $$, fx, showScreen, celebrate, onPointer, createStore, replayClass, setPartyColors,
  pickOne, W, H, DPR,
} from '../../shared/js/kit.js';
import { earnSticker } from '../../shared/js/rewards.js';
import { Xylophone, Piano, Drums, RAINBOW } from './instruments.js';
import { note, drum } from './voices.js';
import { SONGS, songById } from './songs.js';

const store = createStore('music', { xyloSound: 'bell', pianoSound: 'piano', done: {} });

const INSTS = {
  xylo: { name: 'Xylophone', icon: '🌈', party: ['#9d5cff', '#ff7ac6', '#ffc94d'], obj: new Xylophone(), base: 60 },
  drums: { name: 'Drums', icon: '🥁', party: ['#ff8a3d', '#ff4f8b', '#7b5cff'], obj: new Drums() },
  piano: { name: 'Piano', icon: '🎹', party: ['#4fa8ff', '#9d7bff', '#ff8fd0'], obj: new Piano(), base: 60 },
};
const SOUNDS = {
  xylo: [['bell', '🔔', 'Bells'], ['marimba', '🌴', 'Marimba'], ['toy', '🧸', 'Toy piano']],
  piano: [['piano', '🎹', 'Piano'], ['toy', '🧸', 'Toy piano'], ['bell', '🔔', 'Bells']],
};

let instId = null;
let inst = null;
let T = 0;            // the kit's clock (seconds), updated every frame
let dirty = true;
const stage = $('#stage');
const sc = stage.getContext('2d');
let area = { x: 0, y: 0, w: 100, h: 100 };

// ---------------------------------------------------------------------------
// Layout and drawing
// ---------------------------------------------------------------------------
function sizeStage() {
  stage.width = Math.round(W * DPR);
  stage.height = Math.round(H * DPR);
  const r = $('#area').getBoundingClientRect();
  area = { x: r.left, y: r.top, w: Math.max(50, r.width), h: Math.max(50, r.height) };
  if (inst) inst.layout(area, DPR);
  dirty = true;
}

function draw() {
  sc.setTransform(1, 0, 0, 1, 0, 0);
  sc.clearRect(0, 0, stage.width, stage.height);
  if (inst) inst.draw(sc, DPR, T);
}

// ---------------------------------------------------------------------------
// Playing notes
// ---------------------------------------------------------------------------
function soundOf(id) {
  if (id === 'xylo') return store.data.xyloSound;
  if (id === 'piano') return store.data.pianoSound;
  return null;
}

const lastWord = {};
/** Sound + animation + sparkles for key/bar/drum i. */
function strike(i, opts) {
  const o = opts || {};
  if (instId === 'drums') {
    const p = inst.pieces[i];
    drum(p.id);
    inst.hit(i, T);
    const c = inst.keyCenter(i);
    fx.ring(c.x, c.y, p.color === '#c7ced9' ? '#fff' : p.color);
    fx.sparkle(c.x + (Math.random() - 0.5) * p.r, c.y - p.r * 0.3);
    if (!lastWord[p.id] || T - lastWord[p.id] > 0.5) {
      lastWord[p.id] = T;
      fx.text(c.x, c.y - p.r * 0.9, p.word, '#fff', p.id === 'kick' ? 34 : 26, 0.8);
    }
  } else {
    const k = inst.keys[i];
    note(INSTS[instId].base + k.semi, soundOf(instId), o.vel || 1);
    inst.hit(i, T);
    const c = inst.keyCenter(i);
    const col = instId === 'xylo' ? k.color : k.glowColor;
    if (!o.quiet) {
      fx.text(c.x + (Math.random() - 0.5) * 20, c.y - 10, pickOne(['♪', '♫', '♬', '♩']), col, 30, 0.9);
      fx.sparkle(c.x, c.y);
    }
  }
  dirty = true;
}

// ---------------------------------------------------------------------------
// Fingers: every finger plays, sliding across keys plays each one (glissando)
// ---------------------------------------------------------------------------
const fingers = {};
function pressKey(i) {
  if (i < 0) return;
  if (inst.keys) inst.keys[i].down++;
  strike(i);
  follow.played(i);
}
function releaseKey(i) {
  if (i < 0 || !inst || !inst.keys) return;
  const k = inst.keys[i];
  if (k) k.down = Math.max(0, k.down - 1);
  dirty = true;
}
onPointer(stage, {
  down(p) {
    if (!inst) return false;
    const i = inst.pick(p.x, p.y);
    fingers[p.id] = i;
    pressKey(i);
    return true;
  },
  move(p) {
    if (!inst) return;
    const i = inst.pick(p.x, p.y);
    const old = fingers[p.id];
    if (i === old) return;
    releaseKey(old);
    fingers[p.id] = i;
    pressKey(i);
  },
  up(p) {
    releaseKey(fingers[p.id]);
    delete fingers[p.id];
  },
});

function releaseAll() {
  Object.keys(fingers).forEach((id) => delete fingers[id]);
  if (inst && inst.keys) inst.keys.forEach((k) => { k.down = 0; k.lit = false; k.hint = false; });
}

// ---------------------------------------------------------------------------
// Note sequences with lights (used by Follow the Lights and "play a song")
// ---------------------------------------------------------------------------
let seqToken = 0;
const timers = [];
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function stopTimers() {
  seqToken++;
  while (timers.length) clearTimeout(timers.pop());
  if (inst && inst.keys) inst.keys.forEach((k) => { k.lit = false; k.hint = false; });
  dirty = true;
}

/** Key index for a song note (semitones above middle C) on this instrument. */
function keyFor(semi) {
  for (const k of inst.keys) if (k.semi === semi) return k.i;
  return -1;
}

function playSeq(notes, beat, done) {
  const my = ++seqToken;
  let i = 0;
  const step = () => {
    if (my !== seqToken || !inst || !inst.keys) return;
    if (i >= notes.length) { if (done) done(); return; }
    const n = notes[i++];
    const ki = keyFor(n.semi);
    const dur = Math.max(0.3, n.beats * beat);
    if (ki >= 0) {
      const k = inst.keys[ki];
      k.lit = true;
      strike(ki, { vel: 0.9 });
      later(() => { if (my === seqToken) { k.lit = false; dirty = true; } }, dur * 1000 * 0.72);
    }
    later(step, dur * 1000);
  };
  step();
}

// ---------------------------------------------------------------------------
// Follow the Lights: a gentle "Simon" with real tunes
// ---------------------------------------------------------------------------
const PRAISE = ['Yes!', 'Great job!', 'You got it!', 'Wonderful!', 'Super!', 'Yay!', 'Beautiful!', 'Perfect!'];
const BIG_PRAISE = ['You did it!', 'Amazing!', 'What a star!', 'Hooray!', 'Fantastic!'];

const follow = {
  mode: null,       // null, 'follow' or 'listen'
  phase: 'idle',    // 'demo', 'turn', 'wait', 'finale'
  song: null,
  pi: 0,            // which phrase we are learning
  len: 0,           // how many notes of it right now
  pos: 0,           // how far the kid got
  wrongs: 0,
  rounds: 0,
  hintTimer: 0,

  start(song) {
    stopTimers();
    this.mode = 'follow';
    this.song = song;
    this.pi = 0;
    this.len = startLen(song.learn[0].length);
    this.rounds = 0;
    this.setButtons();
    this.phase = 'wait';
    this.pill('👀');
    say(`Follow the lights! ${song.name}.`);
    later(() => this.demo(), 1500);
  },
  segment() { return this.song.learn[this.pi].slice(0, this.len); },
  demo() {
    clearTimeout(this.hintTimer);
    this.phase = 'demo';
    this.pos = 0;
    this.pill('👀');
    playSeq(this.segment(), 0.5, () => {
      this.phase = 'turn';
      this.pill('👆', true);
      if (this.rounds < 2) say('Your turn!');
      this.rounds++;
      this.armHint(this.wrongs >= 2 ? 300 : 4000);
    });
  },
  armHint(ms) {
    clearTimeout(this.hintTimer);
    const my = seqToken;
    this.hintTimer = setTimeout(() => {
      if (my !== seqToken || this.phase !== 'turn') return;
      const want = this.segment()[this.pos];
      const ki = keyFor(want.semi);
      if (ki >= 0) { inst.keys[ki].hint = true; dirty = true; }
    }, ms);
  },
  clearHint() {
    clearTimeout(this.hintTimer);
    if (inst && inst.keys) inst.keys.forEach((k) => { k.hint = false; });
  },
  played(i) {
    if (this.mode !== 'follow' || this.phase !== 'turn' || !inst.keys) return;
    const seg = this.segment();
    const want = seg[this.pos];
    this.clearHint();
    if (inst.keys[i].semi === want.semi) {
      this.pos++;
      if (this.pos >= seg.length) this.segmentDone();
      else this.armHint(this.wrongs >= 2 ? 300 : 4000);
    } else {
      // a different note: no problem, the lights just show it again
      this.phase = 'wait';
      this.wrongs++;
      const c = inst.keyCenter(i);
      fx.text(c.x, c.y - 30, '?', '#fff', 30, 0.7);
      replayClass($('#pill'), 'wiggle');
      later(() => sfx.boing(), 250);
      if (this.wrongs === 1 || this.wrongs % 3 === 0) later(() => say(pickOne(['Watch again!', "Let's look again!", 'Try again!'])), 500);
      later(() => this.demo(), 1500);
    }
  },
  segmentDone() {
    this.phase = 'wait';
    this.wrongs = 0;
    const full = this.song.learn[this.pi].length;
    const keyI = keyFor(this.segment()[this.len - 1].semi);
    const c = keyI >= 0 ? inst.keyCenter(keyI) : { x: W / 2, y: H / 2 };
    if (this.len < full) {
      fx.sparkles(c.x, c.y, 10, 50);
      later(() => sfx.chime([0, 4, 7], 784, 0.08), 300);
      later(() => say(pickOne(PRAISE)), 350);
      this.len = growLen(this.len, full);
      later(() => this.demo(), 1900);
      return;
    }
    // a whole phrase!
    this.pi++;
    this.updateDots();
    fx.burst(c.x, c.y, '#ffe34d', true);
    fx.confetti(30);
    later(() => sfx.sparkle(), 250);
    if (this.pi < this.song.learn.length) {
      later(() => say(pickOne(BIG_PRAISE)), 350);
      this.len = startLen(this.song.learn[this.pi].length);
      later(() => this.demo(), 2300);
    } else {
      later(() => this.finale(), 900);
    }
  },
  finale() {
    this.phase = 'finale';
    const s = this.song;
    store.data.done[s.id] = (store.data.done[s.id] || 0) + 1;
    store.persist();
    celebrate('Bravo!', s.name);
    say(`You played ${s.name}!`);
    earnSticker('music', { delay: 1800 });
    this.pill('🎶');
    later(() => {
      say('Listen!');
      playSeq(s.notes, 0.42, () => later(() => showDone(s), 600));
    }, 2600);
  },
  listen(song) {
    stopTimers();
    this.mode = 'listen';
    this.song = song;
    this.phase = 'demo';
    this.setButtons();
    this.pill('🎵');
    say(song.name);
    later(() => playSeq(song.notes, 0.42, () => {
      fx.confetti(40);
      sfx.sparkle();
      later(() => this.stop(), 700);
    }), 1000);
  },
  stop() {
    stopTimers();
    this.clearHint();
    this.mode = null;
    this.phase = 'idle';
    this.setButtons();
    setFreePill();
  },
  replay() {
    if (this.mode !== 'follow' || this.phase !== 'turn') return;
    stopTimers();
    this.demo();
  },
  pill(icon, turn) {
    const p = $('#pill');
    p.className = 'pill status';
    const dots = this.mode === 'follow'
      ? `<span class="dots">${this.song.learn.map((x, i) => `<i class="${i < this.pi ? 'on' : i === this.pi ? 'now' : ''}"></i>`).join('')}</span>`
      : '';
    p.innerHTML = `<span class="pill-icon">${icon}</span><span class="pill-icon" style="margin-left:6px">${this.song.icon}</span>${dots}`;
    if (turn) replayClass(p, 'turn');
  },
  updateDots() {
    $$('#pill .dots i').forEach((d, i) => {
      d.className = i < this.pi ? 'on' : i === this.pi ? 'now' : '';
    });
  },
  setButtons() {
    const keyed = instId !== 'drums';
    const busy = !!this.mode;
    $('#btn-voice').classList.toggle('hidden', !keyed || busy);
    $('#btn-listen').classList.toggle('hidden', !keyed || busy);
    $('#btn-follow').classList.toggle('hidden', !keyed || busy);
    $('#btn-replay').classList.toggle('hidden', this.mode !== 'follow');
    $('#btn-stop').classList.toggle('hidden', !busy);
  },
};
const startLen = (n) => Math.min(n, 3);
function growLen(len, n) {
  const next = len + 2;
  return n - next <= 1 ? n : next;
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------
function setFreePill() {
  const I = INSTS[instId];
  const p = $('#pill');
  p.className = 'pill free';
  p.innerHTML = `<span class="pill-icon">${I.icon}</span><span class="pill-text">${I.name}</span>`;
}
function updateVoiceBtn() {
  const list = SOUNDS[instId];
  if (!list) return;
  const cur = soundOf(instId);
  const s = list.filter((x) => x[0] === cur)[0] || list[0];
  $('#btn-voice').textContent = s[1];
  $('#btn-voice').setAttribute('aria-label', `Sound: ${s[2]}`);
}

function openInstrument(id) {
  instId = id;
  inst = INSTS[id].obj;
  releaseAll();
  setPartyColors(INSTS[id].party);
  showScreen(null);
  $('#play').classList.remove('hidden');
  follow.mode = null;
  follow.setButtons();
  setFreePill();
  updateVoiceBtn();
  sizeStage();
  say(INSTS[id].name);
}

function leavePlay() {
  follow.stop();
  releaseAll();
  $('#play').classList.add('hidden');
  inst = null;
  instId = null;
  fx.clear();
  setPartyColors(['#9d5cff', '#ff6fb5', '#6fc8ff']);
  showScreen('screen-title');
  updateTitle();
}

let pickerMode = 'follow';
function openSongs(mode) {
  pickerMode = mode;
  follow.stop();
  $('#songs-icon').textContent = mode === 'follow' ? '💡' : '🎵';
  $('#songs-title').textContent = mode === 'follow' ? 'Follow the Lights' : 'Play a Song';
  $('#song-grid').innerHTML = SONGS.map((s, i) =>
    `<button class="tile ${s.color}" data-action="song" data-song="${s.id}" style="animation-delay:${i * 0.04}s">` +
    `<span class="tile-icon">${s.icon}</span><span class="tile-name">${s.name}</span>` +
    `${store.data.done[s.id] ? '<span class="star-badge">⭐</span>' : ''}</button>`).join('');
  showScreen('screen-songs');
  say(mode === 'follow' ? 'Pick a song to learn!' : 'Pick a song!');
}

let lastSong = null;
function chooseSong(id) {
  const s = songById(id);
  lastSong = s;
  showScreen(null);
  if (pickerMode === 'follow') follow.start(s);
  else follow.listen(s);
}

function showDone(s) {
  follow.stop();
  $('#done-icon').textContent = s.icon;
  $('#done-name').textContent = s.name;
  showScreen('screen-done');
}

function cycleVoice() {
  const list = SOUNDS[instId];
  if (!list) return;
  const cur = soundOf(instId);
  let i = 0;
  list.forEach((x, j) => { if (x[0] === cur) i = j; });
  const next = list[(i + 1) % list.length];
  if (instId === 'xylo') store.data.xyloSound = next[0];
  else store.data.pianoSound = next[0];
  store.persist();
  updateVoiceBtn();
  replayClass($('#btn-voice'), 'wiggle');
  // a little run up the keys in the new sound
  [0, 4, 7].forEach((semi, j) => setTimeout(() => {
    const ki = inst && inst.keys ? keyFor(semi) : -1;
    if (ki >= 0) strike(ki, { quiet: j > 0 });
  }, j * 120));
  say(next[2]);
}

function updateTitle() {
  const n = Object.keys(store.data.done).length;
  $('#title-best').textContent = n ? `⭐ ${n} song${n > 1 ? 's' : ''} learned` : '';
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
boot({
  party: ['#9d5cff', '#ff6fb5', '#6fc8ff'],
  onAction(action, el) {
    switch (action) {
      case 'inst': openInstrument(el.dataset.inst); break;
      case 'back': leavePlay(); break;
      case 'voice': cycleVoice(); break;
      case 'listen': openSongs('listen'); break;
      case 'follow': openSongs('follow'); break;
      case 'song': chooseSong(el.dataset.song); break;
      case 'close': showScreen(null); break;
      case 'stop': follow.stop(); break;
      case 'replay': follow.replay(); break;
      case 'again': showScreen(null); if (lastSong) follow.start(lastSong); break;
      case 'more': openSongs('follow'); break;
      case 'free': showScreen(null); follow.stop(); break;
    }
  },
  onBack(screen) {
    if (screen === 'screen-songs' || screen === 'screen-done') { showScreen(null); follow.stop(); return true; }
    if (screen === null) {
      if (follow.mode) { follow.stop(); return true; }
      leavePlay();
      return true;
    }
    return false;
  },
  onFrame(dt, t) {
    T = t;
    if (!inst) return;
    if (dirty || inst.busy(T)) {
      // draw one more frame after things settle so they end at rest
      dirty = inst.busy(T);
      draw();
    }
  },
  onResize() {
    if (inst) sizeStage();
  },
});

updateTitle();

// a tiny hook for automated tests
window.__music = {
  open: openInstrument,
  get inst() { return inst; },
  get follow() { return follow; },
  keyFor: (semi) => keyFor(semi),
  center: (i) => inst.keyCenter(i),
  songs: SONGS,
  RAINBOW,
};
