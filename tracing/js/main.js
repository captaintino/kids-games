// Letter Tracing: paint big letters and numbers along dotted paths. The brush
// only paints inside the letter band, and the dots along the current stroke
// light up as the brush reaches them in order.
import * as sfx from '../../shared/js/audio.js';
import { say, numberWord } from '../../shared/js/speech.js';
import {
  boot, $, $$, fx, showScreen, celebrate, onPointer, createStore, replayClass, pickOne, wait, clamp,
} from '../../shared/js/kit.js';
import { star as starPath, INK } from '../../shared/js/pictures.js';
import { SETS, GLYPHS, SPOKEN, WORDS } from './letters.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const DOT_GAP = 16; // sheet units between scoring dots
const LOOK = 3; // how many dots the brush may skip ahead (cut a corner)

const store = createStore('tracing', { stars: {}, brush: 'rainbow' });

const BRUSHES = [
  { key: 'rainbow', name: 'Rainbow' },
  { key: 'red', hex: '#ff4d5e', name: 'Red' },
  { key: 'orange', hex: '#ff9a2e', name: 'Orange' },
  { key: 'green', hex: '#3fc95a', name: 'Green' },
  { key: 'blue', hex: '#3d7bff', name: 'Blue' },
  { key: 'purple', hex: '#9d5cff', name: 'Purple' },
];
const TILE_COLORS = ['pink', 'blue', 'green', 'orange', 'purple', 'teal', 'red', 'yellow'];
const CHEERS = ['Wow!', 'Amazing!', 'Super!', 'Awesome!', 'Great job!', 'Fantastic!', 'Hooray!', 'Beautiful!'];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const T = {
  set: SETS[0],
  i: 0,
  ch: 'A',
  strokes: [],
  cur: 0,
  done: false,
  on: false, // tracing screen visible
  paint: [], // brush strokes: { c, h, p: [x0, y0, x1, y1, ...] }
  ptr: null,
  travel: 0,
  outside: 0,
  demo: null,
  idle: 0,
  lastNote: 0,
  lastHint: -1e9,
  lastScribble: 0,
  token: 0,
  rect: null,
};

const paper = $('#paper');
const cv = $('#paint');
const cx = cv.getContext('2d');
const under = $('#under');
const over = $('#over');

const keyOf = (set, ch) => `${set.id}:${ch}`;
const starsOf = (set, ch) => store.data.stars[keyOf(set, ch)] || 0;
const isDigit = (ch) => /[0-9]/.test(ch);
const spoken = (ch) => (isDigit(ch) ? numberWord(+ch) : SPOKEN[ch.toLowerCase()]);

function el(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

// ---------------------------------------------------------------------------
// Little drawings
// ---------------------------------------------------------------------------
const STAR_SVG = `<svg viewBox="0 0 40 40" class="mini-star" aria-hidden="true"><path d="${starPath(20, 21, 18, 8)}" fill="#ffd93b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="15" cy="16" r="2.6" fill="#fff"/></svg>`;

const PICS = {
  xylophone: `<svg viewBox="0 0 100 100" class="word-svg" aria-hidden="true">
    <g stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M14 34L86 26M14 74L86 82" fill="none" stroke="#a7663c" stroke-width="7"/>
    <rect x="12" y="22" width="13" height="64" rx="5" fill="#ff4d5e"/>
    <rect x="27" y="25" width="13" height="58" rx="5" fill="#ff9a2e"/>
    <rect x="42" y="28" width="13" height="52" rx="5" fill="#ffd93b"/>
    <rect x="57" y="31" width="13" height="46" rx="5" fill="#5cd65c"/>
    <rect x="72" y="34" width="13" height="40" rx="5" fill="#3d7bff"/>
    <path d="M60 16L84 6" fill="none"/><circle cx="58" cy="17" r="5" fill="#ff7ac6"/></g></svg>`,
  yoyo: `<svg viewBox="0 0 100 100" class="word-svg" aria-hidden="true">
    <g stroke="${INK}" stroke-width="4" stroke-linejoin="round">
    <path d="M50 6V40" fill="none" stroke-linecap="round"/>
    <circle cx="50" cy="62" r="32" fill="#ff4d5e"/>
    <circle cx="50" cy="62" r="19" fill="#ffd93b"/>
    <circle cx="50" cy="62" r="6" fill="#fff"/></g>
    <circle cx="38" cy="48" r="5" fill="#fff" opacity=".8"/></svg>`,
};

function wordPic(w) {
  if (w.pic) return PICS[w.pic];
  return `<span class="emoji">${w.emoji}</span>`;
}

// A happy pencil for the title screen
$('#mascot').innerHTML = `<svg viewBox="0 0 260 140" aria-hidden="true">
  <path d="M18 112C60 128 92 70 128 92S190 120 236 84" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 16" opacity=".9"/>
  <g transform="rotate(-18 130 60)" stroke="${INK}" stroke-width="5" stroke-linejoin="round">
    <rect x="22" y="38" width="34" height="44" rx="12" fill="#ff7ac6"/>
    <rect x="48" y="36" width="20" height="48" fill="#b3b9c6"/>
    <rect x="66" y="34" width="118" height="52" fill="#ffd93b"/>
    <path d="M66 52H184M66 68H184" stroke-width="3" opacity=".35"/>
    <path d="M184 34L232 60L184 86Z" fill="#ffd2a6"/>
    <path d="M216 51L232 60L216 69Z" fill="#9d5cff"/>
    <circle cx="112" cy="54" r="6" fill="${INK}" stroke="none"/><circle cx="142" cy="54" r="6" fill="${INK}" stroke="none"/>
    <circle cx="110" cy="52" r="2" fill="#fff" stroke="none"/><circle cx="140" cy="52" r="2" fill="#fff" stroke="none"/>
    <path d="M116 68Q127 78 138 68" fill="none" stroke-width="4" stroke-linecap="round"/>
    <circle cx="100" cy="68" r="6" fill="#ff7ac6" stroke="none" opacity=".7"/><circle cx="154" cy="68" r="6" fill="#ff7ac6" stroke="none" opacity=".7"/>
  </g></svg>`;

// ---------------------------------------------------------------------------
// Title and picker
// ---------------------------------------------------------------------------
function totalStars() {
  let n = 0;
  for (const k in store.data.stars) n += store.data.stars[k];
  return n;
}
function updateTitle() {
  const n = totalStars();
  $('#title-stars').textContent = n ? `⭐ ${n}` : '';
}

function openSet(id) {
  T.set = SETS.filter((s) => s.id === id)[0] || SETS[0];
  buildPicker();
  showScreen('screen-picker');
  $('#picker-scroll').scrollTop = 0;
  say(T.set.name + '!');
}

function starRow(n) {
  let s = '';
  for (let i = 0; i < 3; i++) s += `<i class="${i < n ? 'on' : ''}">★</i>`;
  return s;
}

function buildPicker() {
  const set = T.set;
  $('#picker-title').textContent = set.label;
  $('#char-grid').className = `char-grid set-${set.id}`;
  $('#char-grid').innerHTML = set.chars.map((ch, i) => {
    const n = starsOf(set, ch);
    return `<button class="tile ctile ${TILE_COLORS[i % TILE_COLORS.length]}${n ? ' done' : ''}" data-action="open" data-i="${i}" aria-label="${ch}" style="animation-delay:${Math.min(i, 20) * 0.025}s">
      <span class="cglyph">${ch}</span><span class="cstars">${starRow(n)}</span></button>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// Building a letter
// ---------------------------------------------------------------------------
const measure = (() => {
  const s = el('svg', { width: 0, height: 0, 'aria-hidden': 'true' });
  s.style.position = 'absolute';
  s.style.visibility = 'hidden';
  document.body.appendChild(s);
  return el('path', {}, s);
})();

function buildStroke(d) {
  measure.setAttribute('d', d);
  const L = measure.getTotalLength();
  const n = Math.max(2, Math.round(L / DOT_GAP) + 1);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const p = measure.getPointAtLength((L * i) / (n - 1));
    pts.push({ x: p.x, y: p.y });
  }
  // little arrows showing which way to go
  const arrows = [];
  if (L > 30) {
    const count = clamp(Math.round(L / 120), 1, 4);
    for (let k = 0; k < count; k++) {
      const at = (L * (k + 0.55)) / count;
      const a = measure.getPointAtLength(Math.max(0, at - 2));
      const b = measure.getPointAtLength(Math.min(L, at + 2));
      const p = measure.getPointAtLength(at);
      arrows.push({ x: p.x, y: p.y, ang: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI, i: Math.round(at / L * (n - 1)) });
    }
  }
  return { d, L, pts, hit: pts.map(() => 0), next: 0, arrows, dots: [], arrowEls: [] };
}

function buildLetter() {
  T.strokes = GLYPHS[T.ch].map(buildStroke);
  T.cur = 0;
  T.done = false;
  T.paint = [];
  T.travel = 0;
  T.outside = 0;
  T.ptr = null;
  T.demo = null;
  T.idle = 0;
  renderUnder();
  renderOver();
  redrawPaint();
}

// Writing lines + the soft edge of the letter band
function renderUnder() {
  const set = T.set;
  let h = '';
  set.lines.forEach((y, i) => {
    const mid = i === 1 || i === 3;
    h += `<line x1="0" x2="400" y1="${y}" y2="${y}" stroke="${mid ? '#d7e6ff' : '#c4dafc'}" stroke-width="${mid ? 3 : 4}"${mid ? ' stroke-dasharray="14 12"' : ''}/>`;
  });
  h += `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`;
  for (const s of T.strokes) h += `<path d="${s.d}" stroke="${set.bandEdge}" stroke-width="${set.band + 12}"/>`;
  h += '</g>';
  under.innerHTML = h;
}

// Dots, arrows, the start dot and the demo ball
function renderOver() {
  over.innerHTML = '';
  const g = el('g', {}, over);
  T.strokes.forEach((s) => {
    const sg = el('g', {}, g);
    s.dots = s.pts.map((p) => el('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 4, class: 'dot fut' }, sg));
  });
  T.strokes.forEach((s) => {
    const ag = el('g', { class: 'arrows' }, g);
    s.arrowEls = s.arrows.map((a) => el('path', {
      d: 'M-8 -10L5 0L-8 10', class: 'arrow',
      transform: `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${a.ang.toFixed(1)})`,
    }, ag));
  });
  T.goal = el('path', { d: starPath(0, 0, 15, 7), class: 'goal' }, over);
  const st = el('g', { class: 'start' }, over);
  const ring = el('circle', { r: 21, class: 'start-ring' }, st);
  el('animate', { attributeName: 'r', values: '19;27;19', dur: '1.4s', repeatCount: 'indefinite' }, ring);
  el('animate', { attributeName: 'opacity', values: '.8;0;.8', dur: '1.4s', repeatCount: 'indefinite' }, ring);
  el('circle', { r: 18, class: 'start-dot' }, st);
  T.startNum = el('text', { class: 'start-num', y: 1 }, st);
  T.start = st;
  T.ball = el('circle', { r: 13, class: 'ball', cx: -50, cy: -50 }, over);
  updateGuides();
}

function setDot(s, i, kind) {
  const r = kind === 'on' ? 7 : kind === 'cur' ? 5.5 : kind === 'dn' ? 4 : kind === 'miss' ? 4.5 : 3.5;
  s.dots[i].setAttribute('class', `dot ${kind}`);
  s.dots[i].setAttribute('r', r);
}

function updateGuides() {
  T.strokes.forEach((s, k) => {
    s.dots.forEach((d, i) => {
      if (k < T.cur || T.done) setDot(s, i, s.hit[i] === 1 ? 'dn' : 'gone');
      else if (k === T.cur) setDot(s, i, s.hit[i] === 1 ? 'on' : s.hit[i] < 0 ? 'miss' : 'cur');
      else setDot(s, i, 'fut');
    });
    s.arrowEls.forEach((a, j) => {
      a.style.display = k === T.cur && !T.done && s.arrows[j].i >= s.next ? '' : 'none';
    });
  });
  const s = T.strokes[T.cur];
  if (!s || T.done) {
    T.start.style.display = 'none';
    T.goal.style.display = 'none';
    return;
  }
  const p = s.pts[0];
  T.start.style.display = '';
  T.start.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
  T.startNum.textContent = String(T.cur + 1);
  const e = s.pts[s.pts.length - 1];
  const far = Math.hypot(e.x - p.x, e.y - p.y) > 50;
  T.goal.style.display = far ? '' : 'none';
  T.goal.setAttribute('transform', `translate(${e.x.toFixed(1)} ${e.y.toFixed(1)})`);
}

// ---------------------------------------------------------------------------
// Paint layer (canvas): the letter band, with brush strokes painted "atop" it,
// so paint only sticks inside the lines.
// ---------------------------------------------------------------------------
function brushStyle(st, dist) {
  if (st.c !== 'rainbow') return st.c;
  return `hsl(${Math.round(st.h + dist * 0.9) % 360}, 95%, 58%)`;
}

function prepCtx() {
  const k = cv.width / 400;
  cx.setTransform(k, 0, 0, k, 0, 0);
  cx.lineCap = 'round';
  cx.lineJoin = 'round';
}

function redrawPaint() {
  if (!cv.width) return;
  prepCtx();
  cx.globalCompositeOperation = 'source-over';
  cx.clearRect(0, 0, 400, 400);
  cx.strokeStyle = T.set.bandColor;
  cx.lineWidth = T.set.band;
  for (const s of T.strokes) cx.stroke(new Path2D(s.d));
  cx.globalCompositeOperation = 'source-atop';
  cx.lineWidth = T.set.brush;
  for (const st of T.paint) {
    const p = st.p;
    let dist = 0;
    paintDot(st, p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) {
      const len = Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]);
      dist += len;
      cx.strokeStyle = brushStyle(st, dist);
      cx.beginPath();
      cx.moveTo(p[i - 2], p[i - 1]);
      cx.lineTo(p[i], p[i + 1]);
      cx.stroke();
    }
  }
}

function paintDot(st, x, y) {
  cx.fillStyle = brushStyle(st, 0);
  cx.beginPath();
  cx.arc(x, y, T.set.brush / 2, 0, Math.PI * 2);
  cx.fill();
}

const r1 = (v) => Math.round(v * 10) / 10;

function startPaint(q) {
  const b = BRUSHES.filter((x) => x.key === store.data.brush)[0] || BRUSHES[0];
  const st = { c: b.hex || 'rainbow', h: Math.floor(Math.random() * 360), p: [r1(q.x), r1(q.y)], dist: 0 };
  T.paint.push(st);
  prepCtx();
  cx.globalCompositeOperation = 'source-atop';
  cx.lineWidth = T.set.brush;
  paintDot(st, q.x, q.y);
  return st;
}

function paintTo(st, x0, y0, x1, y1) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  st.dist += len;
  st.p.push(r1(x1), r1(y1));
  cx.strokeStyle = brushStyle(st, st.dist);
  cx.beginPath();
  cx.moveTo(x0, y0);
  cx.lineTo(x1, y1);
  cx.stroke();
}

// ---------------------------------------------------------------------------
// Following the guide
// ---------------------------------------------------------------------------
const d2 = (a, b) => (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);

function offBand(q) {
  const lim = T.set.band / 2 + 8;
  const lim2 = lim * lim;
  for (const s of T.strokes) {
    for (const p of s.pts) if (d2(q, p) < lim2) return false;
  }
  return true;
}

function reach(s, i, v) {
  s.hit[i] = v;
  setDot(s, i, v === 1 ? 'on' : 'miss');
  const a = s.arrows;
  for (let j = 0; j < a.length; j++) if (a[j].i <= i) s.arrowEls[j].style.display = 'none';
}

function progress(q) {
  const s = T.strokes[T.cur];
  if (!s || T.done) return;
  const tol = T.set.tol;
  const near = tol * tol;
  const ahead = tol * tol * 0.64;
  let moved = false;
  while (s.next < s.pts.length) {
    if (d2(q, s.pts[s.next]) < near) {
      reach(s, s.next, 1);
      s.next++;
      moved = true;
      continue;
    }
    let j = -1;
    const last = Math.min(s.pts.length - 1, s.next + LOOK);
    for (let k = s.next + 1; k <= last; k++) {
      if (d2(q, s.pts[k]) < ahead) { j = k; break; }
    }
    if (j < 0) break;
    for (let k = s.next; k < j; k++) reach(s, k, -1);
    reach(s, j, 1);
    s.next = j + 1;
    moved = true;
  }
  if (moved) {
    if (T.ptr) T.ptr.gain++;
    const now = performance.now();
    if (now - T.lastNote > 85) {
      T.lastNote = now;
      sfx.pick(Math.round((s.next / s.pts.length) * 9));
    }
  }
  if (s.next >= s.pts.length) strokeDone();
}

function sheetToScreen(p) {
  const r = T.rect || cv.getBoundingClientRect();
  return { x: r.left + (p.x / 400) * r.width, y: r.top + (p.y / 400) * r.height };
}

function strokeDone() {
  const s = T.strokes[T.cur];
  const e = sheetToScreen(s.pts[s.pts.length - 1]);
  fx.sparkles(e.x, e.y, 10, 34);
  sfx.chime([0, 4, 7, 12], 523 * Math.pow(2, (T.cur * 3) / 12));
  T.cur++;
  T.demo = null;
  T.ball.setAttribute('cx', -50);
  if (T.cur >= T.strokes.length) {
    finish();
    return;
  }
  updateGuides();
  T.idle = 0;
  const p = sheetToScreen(T.strokes[T.cur].pts[0]);
  fx.ring(p.x, p.y, '#5dff8f');
  T.demoAt = 0.5; // show the next stroke soon
}

function hint() {
  const s = T.strokes[T.cur];
  if (!s) return;
  T.lastHint = performance.now();
  const p = sheetToScreen(s.pts[s.next < s.pts.length ? s.next : 0]);
  fx.ring(p.x, p.y, '#5dff8f');
  fx.sparkles(p.x, p.y, 8, 30);
  sfx.boing();
  say(s.next ? 'Follow the dots!' : 'Start at the green dot!');
  startDemo();
}

// ---------------------------------------------------------------------------
// Demo ball: glides along the current stroke to show the way
// ---------------------------------------------------------------------------
function startDemo() {
  const s = T.strokes[T.cur];
  if (!s || T.done) return;
  T.demo = { s, from: s.next ? s.next : 0, t: 0, spark: 0 };
  T.demoAt = 0;
}

function frame(dt) {
  if (!T.on || T.done) return;
  if (!T.ptr) T.idle += dt;
  if (T.demoAt > 0) {
    T.demoAt -= dt;
    if (T.demoAt <= 0) startDemo();
  }
  if (!T.demo && !T.ptr && T.idle > 7) { T.idle = 0; startDemo(); }
  const d = T.demo;
  if (!d) return;
  const pts = d.s.pts;
  const n = pts.length - 1;
  d.t += dt * 240 / DOT_GAP; // dots per second
  const f = d.from + d.t;
  if (f >= n + 3) {
    T.demo = null;
    T.ball.setAttribute('cx', -50);
    return;
  }
  const i = Math.min(n, Math.floor(f));
  const j = Math.min(n, i + 1);
  const k = Math.min(1, f - i);
  const x = pts[i].x + (pts[j].x - pts[i].x) * k;
  const y = pts[i].y + (pts[j].y - pts[i].y) * k;
  T.ball.setAttribute('cx', x.toFixed(1));
  T.ball.setAttribute('cy', y.toFixed(1));
  d.spark += dt;
  if (d.spark > 0.08) {
    d.spark = 0;
    const p = sheetToScreen({ x, y });
    fx.trail(p.x, p.y, '#ffe34d');
  }
}

// ---------------------------------------------------------------------------
// Touch
// ---------------------------------------------------------------------------
function toSheet(p) {
  const r = T.rect;
  return { x: ((p.x - r.left) / r.width) * 400, y: ((p.y - r.top) / r.height) * 400 };
}

onPointer(paper, {
  down(p) {
    if (!T.on || T.done || T.ptr) return false;
    T.rect = cv.getBoundingClientRect();
    const q = toSheet(p);
    T.ptr = { id: p.id, x: q.x, y: q.y, travel: 0, gain: 0, st: startPaint(q) };
    T.idle = 0;
    T.demo = null;
    T.ball.setAttribute('cx', -50);
    sfx.scribble();
    fx.trail(p.x, p.y, trailColor());
    progress(q);
    return true;
  },
  move(p) {
    const P = T.ptr;
    if (!P || p.id !== P.id) return;
    const q = toSheet(p);
    const dist = Math.hypot(q.x - P.x, q.y - P.y);
    if (dist < 1.5) return;
    const steps = Math.max(1, Math.ceil(dist / 5));
    const seg = dist / steps;
    for (let k = 1; k <= steps; k++) {
      const s = { x: P.x + ((q.x - P.x) * k) / steps, y: P.y + ((q.y - P.y) * k) / steps };
      T.travel += seg;
      if (offBand(s)) T.outside += seg;
      progress(s);
    }
    paintTo(P.st, P.x, P.y, q.x, q.y);
    P.x = q.x;
    P.y = q.y;
    P.travel += dist;
    T.idle = 0;
    const now = performance.now();
    if (now - T.lastScribble > 90) {
      T.lastScribble = now;
      sfx.scribble();
      fx.trail(p.x, p.y, trailColor());
    }
    if (!T.done && P.travel > 150 && P.gain === 0 && now - T.lastHint > 9000) hint();
  },
  up() {
    const P = T.ptr;
    T.ptr = null;
    if (!P || T.done) return;
    // nearly at the end of the stroke? Count it.
    const s = T.strokes[T.cur];
    if (s && s.next > 0 && s.next >= s.pts.length - 2) {
      const e = s.pts[s.pts.length - 1];
      if (Math.hypot(P.x - e.x, P.y - e.y) < T.set.tol * 1.6) {
        for (let k = s.next; k < s.pts.length; k++) reach(s, k, 1);
        s.next = s.pts.length;
        strokeDone();
      }
    }
  },
});

function trailColor() {
  const b = BRUSHES.filter((x) => x.key === store.data.brush)[0];
  return b && b.hex ? b.hex : null;
}

// ---------------------------------------------------------------------------
// Finishing
// ---------------------------------------------------------------------------
function scoreStars() {
  let total = 0;
  let got = 0;
  for (const s of T.strokes) {
    total += s.pts.length;
    for (const h of s.hit) if (h === 1) got++;
  }
  const coverage = total ? got / total : 1;
  const accuracy = T.travel > 0 ? 1 - T.outside / T.travel : 1;
  const score = coverage * 0.65 + accuracy * 0.35;
  return score >= 0.85 ? 3 : score >= 0.62 ? 2 : 1;
}

function phrase() {
  const ch = T.ch;
  if (isDigit(ch)) return `${numberWord(+ch)}!`;
  const w = WORDS[ch];
  const sp = spoken(ch);
  return `${sp}! ${w.line || `${sp} is for ${w.word}!`}`;
}

function finish() {
  T.done = true;
  T.demo = null;
  T.ball.setAttribute('cx', -50);
  updateGuides();
  const stars = scoreStars();
  const key = keyOf(T.set, T.ch);
  store.data.stars[key] = Math.max(store.data.stars[key] || 0, stars);
  store.persist();
  updatePill();
  const cheer = pickOne(CHEERS);
  T.cheer = cheer;
  T.stars = stars;
  setTimeout(() => {
    celebrate(cheer, '');
    say(`${cheer} ${phrase()}`);
  }, 250);
  const token = ++T.token;
  setTimeout(() => { if (token === T.token && T.on) showDone(); }, 2100);
}

function showDone() {
  let url = '';
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 360;
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, 360, 360);
    x.drawImage(cv, 0, 0, 360, 360);
    url = c.toDataURL('image/png');
  } catch (err) { /* ignore */ }
  $('#done-img').src = url;
  const msg = T.stars === 3 ? T.cheer : T.stars === 2 ? 'Great tracing!' : 'Wow! Nice painting!';
  $('#done-title').textContent = msg;
  $('#done-pic').innerHTML = isDigit(T.ch)
    ? `<span class="done-num">${T.ch}</span>`
    : wordPic(WORDS[T.ch]);
  const stars = $$('#done-stars .rstar');
  stars.forEach((s) => s.classList.remove('on'));
  showScreen('screen-done');
  stars.forEach((s, i) => {
    if (i < T.stars) {
      setTimeout(() => {
        s.classList.add('on');
        sfx.pick(4 + i * 3);
      }, 450 + i * 280);
    }
  });
}

// ---------------------------------------------------------------------------
// Opening a letter
// ---------------------------------------------------------------------------
function updatePill() {
  const n = starsOf(T.set, T.ch);
  $('#char-pill').innerHTML = `<span class="pill-ch">${T.ch}</span><span class="pill-stars">${starRow(n)}</span>`;
}

function renderWord() {
  const strip = $('#word-strip');
  if (isDigit(T.ch)) {
    const n = +T.ch;
    let stars = '';
    for (let i = 0; i < n; i++) stars += `<span class="cstar">${STAR_SVG}</span>`;
    strip.innerHTML = `<span class="w-num">${T.ch}</span><span class="w-stars${n > 5 ? ' many' : ''}">${n ? stars : '<span class="w-zero">none!</span>'}</span>`;
  } else {
    const w = WORDS[T.ch];
    const text = w.line ? w.line.replace(/Shhh!/, '').trim() : `${T.ch} is for ${w.word}`;
    strip.innerHTML = `<span class="w-pic">${wordPic(w)}</span><span class="w-text">${text}</span>`;
  }
  strip.className = `word-strip set-${T.set.id}`;
}

async function countOut(fresh) {
  const token = ++T.token;
  const n = +T.ch;
  const stars = $$('#word-strip .cstar');
  if (fresh) stars.forEach((s) => s.classList.remove('show'));
  await say(`${numberWord(n)}!`);
  if (token !== T.token) return;
  if (!n) {
    await say('Zero means none at all!', { queue: true });
    return;
  }
  stars.forEach((s) => s.classList.remove('show'));
  for (let i = 0; i < n; i++) {
    if (token !== T.token || !T.on) return;
    const s = stars[i];
    s.classList.add('show');
    sfx.pick(i + 2);
    await Promise.all([say(numberWord(i + 1), { rate: 1.05 }), wait(420)]);
  }
}

function sayIntro() {
  if (isDigit(T.ch)) countOut(true);
  else {
    T.token++;
    say(phrase());
  }
}

function openChar(i, intro = true) {
  T.token++;
  T.i = (i + T.set.chars.length) % T.set.chars.length;
  T.ch = T.set.chars[T.i];
  T.on = true;
  showScreen(null);
  $('#trace').classList.add('active');
  $('#trace').className = `trace active set-${T.set.id}`;
  updatePill();
  renderWord();
  layout(true);
  buildLetter();
  if (intro) sayIntro();
  else say(`${spoken(T.ch)}!`);
  T.demoAt = 1.2;
  replayClass(paper, 'pop');
}

function leaveTrace() {
  T.on = false;
  T.token++;
  T.demo = null;
  T.ptr = null;
  $('#trace').classList.remove('active');
}

function toPicker() {
  leaveTrace();
  buildPicker();
  showScreen('screen-picker');
  const tile = $(`#char-grid [data-i="${T.i}"]`);
  if (tile && tile.scrollIntoView) {
    try { tile.scrollIntoView({ block: 'center' }); } catch (err) { tile.scrollIntoView(); }
  }
}

function toTitle() {
  leaveTrace();
  updateTitle();
  showScreen('screen-title');
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
function layout(force) {
  if (!T.on) return;
  const st = $('#stage');
  const w = st.clientWidth;
  const h = st.clientHeight;
  const size = Math.floor(Math.max(150, Math.min(w, h, 760)));
  paper.style.width = `${size}px`;
  paper.style.height = `${size}px`;
  const inner = Math.max(100, size - 10);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const px = Math.round(inner * dpr);
  if (force || cv.width !== px) {
    cv.width = px;
    cv.height = px;
    redrawPaint();
  }
  T.rect = cv.getBoundingClientRect();
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
function buildPalette() {
  $('#palette').innerHTML = BRUSHES.map((b, i) =>
    `<button class="swatch${b.hex ? '' : ' m-rainbow magic'}" data-action="brush" data-quiet data-k="${b.key}" data-i="${i}" aria-label="${b.name}" style="${b.hex ? `--c:${b.hex}` : ''}"></button>`).join('');
  markBrush();
}
function markBrush() {
  $$('#palette .swatch').forEach((s) => s.classList.toggle('on', s.dataset.k === store.data.brush));
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
buildPalette();
updateTitle();

boot({
  party: ['#ff8fcf', '#b58cff', '#7fd0ff'],
  onAction(action, elx) {
    switch (action) {
      case 'set': openSet(elx.dataset.set); break;
      case 'title': toTitle(); break;
      case 'open': openChar(+elx.dataset.i); break;
      case 'picker': toPicker(); break;
      case 'again':
        if (!T.on) { openChar(T.i, false); break; }
        showScreen(null);
        sfx.whoosh();
        openChar(T.i, false);
        break;
      case 'next':
        sfx.whoosh();
        openChar(T.i + 1);
        break;
      case 'brush':
        store.data.brush = elx.dataset.k;
        store.persist();
        markBrush();
        sfx.pick(+elx.dataset.i * 2);
        replayClass(elx, 'bounce');
        break;
      case 'word':
        replayClass($('#word-strip'), 'bounce');
        sfx.pick(7);
        if (isDigit(T.ch)) countOut(false);
        else say(phrase());
        break;
    }
  },
  onBack(screen) {
    if (screen === 'screen-done' || (screen === null && T.on)) { toPicker(); return true; }
    if (screen === 'screen-picker') { toTitle(); return true; }
    return false;
  },
  onFrame(dt) { frame(dt); },
  onResize() {
    if (T.on) requestAnimationFrame(() => layout(false));
  },
});

// For automated tests
window.__tracing = {
  T,
  store,
  open(setId, ch) {
    T.set = SETS.filter((s) => s.id === setId)[0];
    openChar(T.set.chars.indexOf(ch));
  },
  sheetToScreen,
};
