// Sticker Scene: drag stickers onto a world, dress up friends, save a picture.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import {
  boot, $, $$, fx, showScreen, onPointer, createStore, centerOf, replayClass, saveImage,
  overrideScene, animateBackground, pickOne, rand, clamp, wait,
} from '../../shared/js/kit.js';
import { SCENES, paintScene, createAnimator } from '../../shared/js/scenes.js';
import { STICKERS, CATS, BY_ID } from './art.js';

const PARTY = ['#ffb03b', '#ff6fb5', '#9b6bff'];
const RAD = Math.PI / 180;
const MAX_STICKERS = 80;
const store = createStore('stickers', { tab: 'friends', scenes: {} });
if (!BY_ID.kitty || !CATS.some((c) => c.key === store.data.tab)) store.data.tab = 'friends';

// ---------------------------------------------------------------------------
// Sticker images: SVG stickers as data-URL images, emoji drawn once to a canvas
// ---------------------------------------------------------------------------
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Android Emoji",sans-serif';
const art = {}; // id -> { src, img (drawable for canvas) }
function makeArt() {
  const loads = [];
  for (const s of STICKERS) {
    if (s.svg) {
      const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.svg);
      const img = new Image();
      loads.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
      img.src = src;
      art[s.id] = { src, img };
    } else {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 256;
      const c = cv.getContext('2d');
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `200px ${EMOJI_FONT}`;
      c.fillText(s.emoji, 128, 140);
      art[s.id] = { src: cv.toDataURL('image/png'), img: cv };
    }
  }
  return Promise.all(loads);
}
const artReady = makeArt();

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let worldId = null;
let items = []; // stickers in this world, in stacking order (children follow their parent)
let byUid = {};
let nextUid = 1;
let selected = null;
let stage = { w: 300, h: 300 };
let BASE = 100;
let landscape = false;
let playing = false;

const layer = $('#layer');
const stageCv = $('#stage-cv');
const sctx = stageCv.getContext('2d');
let cache = document.createElement('canvas');
let animator = null;
let stageDpr = 1;

// ---------------------------------------------------------------------------
// Geometry: where a sticker is on the stage (children ride on their friend)
// ---------------------------------------------------------------------------
function world(st) {
  if (!st.p || !byUid[st.p]) return { x: st.x * stage.w, y: st.y * stage.h, size: BASE * st.s, rot: st.r, f: st.f };
  const P = world(byUid[st.p]);
  const lx = st.lx * P.size * P.f;
  const ly = st.ly * P.size;
  const a = P.rot * RAD;
  return {
    x: P.x + lx * Math.cos(a) - ly * Math.sin(a),
    y: P.y + lx * Math.sin(a) + ly * Math.cos(a),
    size: P.size * st.s,
    rot: P.rot + st.r * P.f,
    f: P.f * st.f,
  };
}
// a point given in a sticker's own units (0,0 = center, 1 = its width) -> stage
function localToStage(w, lx, ly) {
  const x = lx * w.size * w.f;
  const y = ly * w.size;
  const a = w.rot * RAD;
  return { x: w.x + x * Math.cos(a) - y * Math.sin(a), y: w.y + x * Math.sin(a) + y * Math.cos(a) };
}
function makeRoot(st) {
  const w = world(st);
  st.p = null;
  st.x = w.x / stage.w;
  st.y = w.y / stage.h;
  st.s = w.size / BASE;
  st.r = w.rot;
  st.f = w.f;
}
function childrenOf(st) { return items.filter((c) => c.p === st.uid); }
function ordered() {
  const out = [];
  for (const st of items) {
    if (st.p && byUid[st.p]) continue;
    out.push(st);
    for (const ch of items) if (ch.p === st.uid) out.push(ch);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Sticker elements
// ---------------------------------------------------------------------------
function makeEl(st) {
  const def = BY_ID[st.t];
  const el = document.createElement('div');
  el.className = 'stk' + (def.kind === 'friend' ? ' friend' : '');
  el.innerHTML = `<div class="stk-b"><img class="stk-i" alt="" draggable="false" src="${art[st.t].src}"></div>`;
  layer.appendChild(el);
  st.el = el;
  st.size = 0;
  return el;
}
function place(st) {
  if (!st.el) return;
  const w = world(st);
  const sz = Math.round(w.size);
  if (sz !== st.size) {
    st.size = sz;
    st.el.style.width = sz + 'px';
    st.el.style.height = sz + 'px';
  }
  st.el.style.transform = `translate3d(${(w.x - sz / 2).toFixed(1)}px,${(w.y - sz / 2).toFixed(1)}px,0) rotate(${w.rot.toFixed(1)}deg) scale(${w.f},1)`;
}
function placeTree(st) {
  place(st);
  for (const ch of childrenOf(st)) place(ch);
}
function restack() {
  ordered().forEach((st, i) => { if (st.el) st.el.style.zIndex = String(i + 1); });
}
function renderAll() {
  for (const st of items) place(st);
  restack();
  updateSel();
}
function tweenEls(list, ms = 380) {
  list.forEach((st) => { if (st.el) st.el.classList.add('tween'); });
  setTimeout(() => list.forEach((st) => { if (st.el) st.el.classList.remove('tween'); }), ms);
}
function popEl(st) { if (st.el) replayClass(st.el.firstChild, 'pop'); }

function addSticker(type, props) {
  const def = BY_ID[type];
  const st = Object.assign({ uid: nextUid++, t: type, x: 0.5, y: 0.5, s: def.s || 0.8, r: 0, f: 1, p: null, lx: 0, ly: 0 }, props);
  items.push(st);
  byUid[st.uid] = st;
  makeEl(st);
  return st;
}
function removeSticker(st, animate = true) {
  const all = [st].concat(childrenOf(st));
  for (const s of all) {
    items = items.filter((x) => x !== s);
    delete byUid[s.uid];
    const el = s.el;
    s.el = null;
    if (!el) continue;
    if (animate) {
      el.classList.remove('drag');
      replayClass(el.firstChild, 'poof');
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 420);
    } else if (el.parentNode) el.parentNode.removeChild(el);
  }
  if (selected && all.indexOf(selected) >= 0) select(null);
}

// ---------------------------------------------------------------------------
// Saving the scene for this world
// ---------------------------------------------------------------------------
const r3 = (v) => Math.round(v * 1000) / 1000;
function saveScene() {
  if (!worldId) return;
  store.data.scenes[worldId] = items.map((s) => ({
    u: s.uid, t: s.t, x: r3(s.x), y: r3(s.y), s: r3(s.s), r: Math.round(s.r), f: s.f, p: s.p || 0, lx: r3(s.lx), ly: r3(s.ly),
  }));
  store.persist();
}
function loadScene(id) {
  items.forEach((s) => { if (s.el && s.el.parentNode) s.el.parentNode.removeChild(s.el); });
  items = [];
  byUid = {};
  nextUid = 1;
  const list = store.data.scenes[id] || [];
  for (const d of list) {
    if (!BY_ID[d.t]) continue;
    const st = { uid: d.u, t: d.t, x: d.x, y: d.y, s: d.s, r: d.r || 0, f: d.f === -1 ? -1 : 1, p: d.p || null, lx: d.lx || 0, ly: d.ly || 0 };
    items.push(st);
    byUid[st.uid] = st;
    nextUid = Math.max(nextUid, st.uid + 1);
  }
  items.forEach((st) => { if (st.p && !byUid[st.p]) st.p = null; });
  items.forEach(makeEl);
}

// ---------------------------------------------------------------------------
// Stage: the world painted behind the stickers (above the tray)
// ---------------------------------------------------------------------------
function layoutStage() {
  if (!playing) return;
  const tr = $('#tray').getBoundingClientRect();
  landscape = window.innerWidth >= window.innerHeight * 1.25;
  const w = landscape ? Math.round(tr.left + 22) : window.innerWidth;
  const h = landscape ? window.innerHeight : Math.round(tr.top + 22);
  stage = { w: Math.max(100, w), h: Math.max(100, h) };
  BASE = Math.min(stage.w, stage.h) * 0.3;
  [stageCv, layer].forEach((el) => { el.style.width = stage.w + 'px'; el.style.height = stage.h + 'px'; });
  stageDpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2000000 / (stage.w * stage.h))));
  stageCv.width = Math.round(stage.w * stageDpr);
  stageCv.height = Math.round(stage.h * stageDpr);
  cache.width = stageCv.width;
  cache.height = stageCv.height;
  const c = cache.getContext('2d');
  c.setTransform(stageDpr, 0, 0, stageDpr, 0, 0);
  paintScene(c, stage.w, stage.h, worldId, PARTY);
  animator = createAnimator(worldId);
  renderAll();
}
function drawStage(t, dt) {
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.drawImage(cache, 0, 0);
  sctx.setTransform(stageDpr, 0, 0, stageDpr, 0, 0);
  if (animator) animator.draw(sctx, stage.w, stage.h, t, dt);
  sctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Selection: a dashed ring and a little toolbar
// ---------------------------------------------------------------------------
const selbar = $('#selbar');
const selring = $('#selring');
function select(st) {
  selected = st;
  updateSel();
}
function updateSel() {
  const st = selected;
  if (!st || !st.el || dragging) {
    selbar.classList.add('hidden');
    selring.classList.add('hidden');
    return;
  }
  const w = world(st);
  const d = w.size * 0.92;
  selring.classList.remove('hidden');
  selring.style.width = selring.style.height = d + 'px';
  selring.style.transform = `translate3d(${w.x - d / 2}px,${w.y - d / 2}px,0)`;
  const wasHidden = selbar.classList.contains('hidden');
  selbar.classList.remove('hidden');
  const bw = selbar.offsetWidth;
  const bh = selbar.offsetHeight;
  const hud = $('#hud').getBoundingClientRect();
  const top = hud.bottom + 8;
  let y = w.y - w.size * 0.5 - bh - 6;
  if (y < top) y = w.y + w.size * 0.5 + 6;
  if (y + bh > stage.h - 26) y = Math.max(top, Math.min(stage.h - bh - 26, w.y - bh / 2));
  const x = clamp(w.x - bw / 2, 8, Math.max(8, stage.w - bw - 8));
  selbar.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
  if (wasHidden) replayClass(selbar, 'pop-bar');
}

// ---------------------------------------------------------------------------
// Dress-up magnets
// ---------------------------------------------------------------------------
function anchorTarget(st, w) {
  const def = BY_ID[st.t];
  if (def.kind !== 'wear') return null;
  const me = w || world(st);
  const pt = localToStage(me, def.at[0], def.at[1]);
  let best = null;
  let bestD = Infinity;
  for (const fr of items) {
    if (fr === st || BY_ID[fr.t].kind !== 'friend' || fr.p) continue;
    const fw = world(fr);
    const a = BY_ID[fr.t].anchors[def.fit];
    if (!a) continue;
    const ap = localToStage(fw, a.x, a.y);
    const d = Math.hypot(ap.x - pt.x, ap.y - pt.y);
    const reach = Math.max(46, fw.size * 0.3);
    if (d < reach && d < bestD) { bestD = d; best = { fr, fw, a, ap }; }
  }
  return best;
}
const glow = $('#glow');
function showGlow(t) {
  if (!t) { glow.classList.add('hidden'); return; }
  const d = Math.max(56, t.fw.size * t.a.w * 1.5);
  glow.classList.remove('hidden');
  glow.style.width = glow.style.height = d + 'px';
  glow.style.transform = `translate3d(${t.ap.x - d / 2}px,${t.ap.y - d / 2}px,0)`;
}
// Snap a wearable onto a friend. Anything already worn there hops off.
function attach(st, fr, animate = true) {
  const def = BY_ID[st.t];
  const a = BY_ID[fr.t].anchors[def.fit];
  const cs = a.w / def.span;
  const bumped = [];
  for (const other of childrenOf(fr)) {
    if (other !== st && BY_ID[other.t].fit === def.fit) {
      makeRoot(other);
      other.x = clamp(other.x + rand(0.12, 0.2) * (Math.random() < 0.5 ? -1 : 1), 0.08, 0.92);
      other.y = clamp(other.y + 0.08, 0.1, 0.9);
      other.r = rand(-25, 25);
      bumped.push(other);
    }
  }
  st.p = fr.uid;
  st.s = cs;
  st.lx = a.x - def.at[0] * cs;
  st.ly = a.y - def.at[1] * cs;
  st.r = 0;
  st.f = 1;
  // worn things sit just above their friend, newest on top
  items = items.filter((x) => x !== st);
  items.push(st);
  if (animate) tweenEls([st].concat(bumped), 420);
  restack();
  place(st);
  bumped.forEach(place);
  if (bumped.length) sfx.boing();
}

// ---------------------------------------------------------------------------
// Sounds for friends
// ---------------------------------------------------------------------------
function voice(kind) {
  if (!sfx.ready()) return;
  const T = sfx.tone;
  switch (kind) {
    case 'meow':
      T({ type: 'triangle', f0: 620, f1: 980, dur: 0.16, vol: 0.2 });
      T({ type: 'triangle', f0: 980, f1: 560, dur: 0.3, vol: 0.2, delay: 0.14 });
      break;
    case 'woof':
      [0, 0.22].forEach((d) => {
        T({ type: 'triangle', f0: 340, f1: 170, dur: 0.12, vol: 0.3, delay: d });
        sfx.noise({ dur: 0.07, vol: 0.12, freq: 700, delay: d });
      });
      break;
    case 'squeak':
      [0, 0.11, 0.22].forEach((d, i) => T({ f0: 1300 + i * 200, f1: 2000 + i * 200, dur: 0.07, vol: 0.14, delay: d }));
      break;
    case 'growl':
      T({ type: 'triangle', f0: 200, f1: 150, dur: 0.35, vol: 0.22 });
      T({ type: 'sine', f0: 520, f1: 780, dur: 0.2, vol: 0.12, delay: 0.3 });
      break;
    case 'hello':
      sfx.chime([0, 4, 7, 12], 523, 0.1);
      break;
    case 'beep':
      [880, 660, 1175].forEach((f, i) => T({ type: 'square', f0: f, dur: 0.08, vol: 0.06, delay: i * 0.1 }));
      break;
    case 'blub':
      [0, 0.09, 0.2].forEach((d, i) => T({ f0: 260 + i * 90, f1: 900 + i * 200, dur: 0.07, vol: 0.2, delay: d }));
      break;
    default:
      sfx.pop();
  }
}

const CHEERS = ['So stylish!', 'Looking good!', 'Fancy!', 'Ooh la la!', 'Super cool!', 'Wow!', 'Very fancy!', 'Nice look!'];
let lastCheer = 0;
function cheer() {
  const now = Date.now();
  if (now - lastCheer < 2500) return;
  lastCheer = now;
  say(pickOne(CHEERS));
}

// ---------------------------------------------------------------------------
// Dragging stickers on the stage (and from the tray)
// ---------------------------------------------------------------------------
let dragging = null; // { st, id, ox, oy, moved, fromTray, sx, sy }
let pinch = null;
const fingers = {};
const trash = $('#trash');

function stagePoint(p) {
  const r = layer.getBoundingClientRect();
  return { x: p.x - r.left, y: p.y - r.top };
}
function hitTest(x, y) {
  const list = ordered();
  for (let i = list.length - 1; i >= 0; i--) {
    const st = list[i];
    const w = world(st);
    const dx = x - w.x;
    const dy = y - w.y;
    const a = -w.rot * RAD;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    const half = w.size * 0.42;
    if (Math.abs(lx) < half && Math.abs(ly) < half) return st;
  }
  return null;
}

function startDrag(st, id, pt, fromTray) {
  const w = world(st);
  dragging = { st, id, ox: w.x - pt.x, oy: w.y - pt.y, moved: !!fromTray, fromTray, sx: pt.x, sy: pt.y };
  st.el.classList.remove('tween');
  childrenOf(st).forEach((c) => c.el && c.el.classList.remove('tween'));
  st.el.classList.add('drag');
  select(st);
  trash.classList.add('show');
  $('#tray').classList.add('drop-zone');
}
function overTrash(p) {
  const r = trash.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  if (Math.hypot(p.x - cx, p.y - cy) < r.width * 0.75) return true;
  const tr = $('#tray').getBoundingClientRect();
  return p.x >= tr.left && p.x <= tr.right && p.y >= tr.top && p.y <= tr.bottom;
}
function dragMove(p) {
  const d = dragging;
  const pt = stagePoint(p);
  if (!d.moved) {
    if (Math.hypot(pt.x - d.sx, pt.y - d.sy) < 10) return;
    d.moved = true;
    // lifting a worn thing off its friend
    if (d.st.p) {
      makeRoot(d.st);
      items = items.filter((x) => x !== d.st);
      items.push(d.st);
      restack();
    }
    sfx.pick(3);
  }
  const st = d.st;
  if (st.p) makeRoot(st);
  st.x = clamp(pt.x + d.ox, 0, stage.w) / stage.w;
  st.y = clamp(pt.y + d.oy, 0, stage.h) / stage.h;
  placeTree(st);
  const hot = overTrash(p);
  trash.classList.toggle('hot', hot);
  $('#tray').classList.toggle('hot', hot);
  st.el.classList.toggle('doomed', hot);
  showGlow(hot ? null : anchorTarget(st));
}
function endDrag(p) {
  const d = dragging;
  dragging = null;
  pinch = null;
  trash.classList.remove('show', 'hot');
  $('#tray').classList.remove('drop-zone', 'hot');
  showGlow(null);
  const st = d.st;
  if (!st.el) return;
  st.el.classList.remove('drag', 'doomed');
  if (!d.moved) {
    // a tap: friends say hello, everything wiggles
    replayClass(st.el.firstChild, 'wiggle-s');
    const def = BY_ID[st.t];
    if (def.kind === 'friend') voice(def.voice); else sfx.pop(1.2);
    updateSel();
    return;
  }
  if (overTrash(p)) {
    const w = world(st);
    const r = layer.getBoundingClientRect();
    sfx.whoosh();
    fx.burst(w.x + r.left, w.y + r.top, '#fff');
    removeSticker(st);
    saveScene();
    return;
  }
  const t = anchorTarget(st);
  if (t) {
    attach(st, t.fr);
    const r = layer.getBoundingClientRect();
    sfx.chime([0, 4, 7, 12], 880, 0.05);
    fx.sparkles(t.ap.x + r.left, t.ap.y + r.top, 8, 36);
    setTimeout(() => { if (st.el) replayClass(t.fr.el.firstChild, 'wiggle-s'); }, 250);
    cheer();
  } else {
    sfx.pop(0.9);
    if (d.fromTray) popEl(st);
  }
  select(st);
  saveScene();
}

onPointer(layer, {
  down(p) {
    const pt = stagePoint(p);
    fingers[p.id] = pt;
    if (dragging && dragging.id !== p.id) {
      // a second finger: pinch to resize and twist the sticker being held
      const a = fingers[dragging.id];
      if (!a || pinch) return false;
      const st = dragging.st;
      pinch = { id: p.id, d0: Math.max(20, Math.hypot(pt.x - a.x, pt.y - a.y)), a0: Math.atan2(pt.y - a.y, pt.x - a.x), s0: st.s, r0: st.r };
      return true;
    }
    if (dragging) return false;
    const st = hitTest(pt.x, pt.y);
    if (!st) {
      if (selected) { select(null); sfx.click(); }
      return true;
    }
    startDrag(st, p.id, pt, false);
    return true;
  },
  move(p) {
    const pt = stagePoint(p);
    fingers[p.id] = pt;
    if (!dragging) return;
    if (pinch && (p.id === pinch.id || p.id === dragging.id)) {
      const a = fingers[dragging.id];
      const b = fingers[pinch.id];
      if (a && b) {
        const st = dragging.st;
        if (st.p) makeRoot(st);
        dragging.moved = true;
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        st.s = clamp(pinch.s0 * (dist / pinch.d0), 0.3, 3.5);
        st.r = pinch.r0 + (ang - pinch.a0) / RAD;
      }
    }
    if (p.id === dragging.id) dragMove(p);
    else if (pinch) placeTree(dragging.st);
  },
  up(p) {
    delete fingers[p.id];
    if (pinch && p.id === pinch.id) { pinch = null; return; }
    if (dragging && p.id === dragging.id) endDrag(p);
  },
});

// ---------------------------------------------------------------------------
// The tray: category tabs and a strip of stickers (scroll it, or pull one out)
// ---------------------------------------------------------------------------
const itemsEl = $('#items');
function buildTabs() {
  $('#tabs').innerHTML = CATS.map((c) =>
    `<button class="tab" data-action="tab" data-cat="${c.key}" data-quiet aria-label="${c.name}">${c.icon}</button>`).join('');
}
function showTab(key, speak) {
  store.data.tab = key;
  store.persist();
  $$('.tab').forEach((b) => b.classList.toggle('on', b.dataset.cat === key));
  const list = STICKERS.filter((s) => s.cat === key);
  itemsEl.innerHTML = list.map((s) =>
    `<div class="item" data-id="${s.id}" role="button" aria-label="${s.name}"><img src="${art[s.id].src}" alt="" draggable="false"></div>`).join('');
  itemsEl.scrollLeft = 0;
  itemsEl.scrollTop = 0;
  if (speak) say(CATS.filter((c) => c.key === key)[0].name);
}

let trayTouch = null;
let fling = null;
function scrollBy(v) {
  if (landscape) itemsEl.scrollTop += v; else itemsEl.scrollLeft += v;
}
onPointer(itemsEl, {
  down(p, e) {
    if (trayTouch || dragging) return false;
    fling = null;
    const itemEl = e.target && e.target.closest ? e.target.closest('.item') : null;
    trayTouch = { id: p.id, x: p.x, y: p.y, lx: p.x, ly: p.y, item: itemEl, mode: null, v: 0, t: performance.now() };
    if (itemEl) itemEl.classList.add('press');
    return true;
  },
  move(p) {
    const t = trayTouch;
    if (!t || t.id !== p.id) return;
    if (t.mode === 'drag') { dragMove(p); return; }
    const dx = p.x - t.x;
    const dy = p.y - t.y;
    const along = landscape ? dy : dx;
    const out = landscape ? -dx : -dy;
    if (!t.mode) {
      if (t.item && out > 12 && out > Math.abs(along) * 0.8) {
        t.mode = 'drag';
        t.item.classList.remove('press');
        pullOut(t.item.dataset.id, p);
        return;
      }
      if (Math.abs(along) > 8) {
        t.mode = 'scroll';
        if (t.item) t.item.classList.remove('press');
      }
    }
    if (t.mode === 'scroll') {
      const step = landscape ? p.y - t.ly : p.x - t.lx;
      const now = performance.now();
      t.v = -step / Math.max(8, now - t.t) * 16;
      t.t = now;
      scrollBy(-step);
    }
    t.lx = p.x;
    t.ly = p.y;
  },
  up(p) {
    const t = trayTouch;
    if (!t || t.id !== p.id) return;
    trayTouch = null;
    if (t.item) t.item.classList.remove('press');
    if (t.mode === 'drag') { if (dragging) endDrag(p); return; }
    if (t.mode === 'scroll') { if (Math.abs(t.v) > 2) fling = { v: t.v }; return; }
    if (t.item) tapItem(t.item.dataset.id, t.item);
  },
});

function canAdd() {
  if (items.length < MAX_STICKERS) return true;
  sfx.boing();
  replayClass($('#tray'), 'wiggle-s');
  say('Wow, that is a lot of stickers!');
  return false;
}

// Pull a sticker out of the tray and keep dragging it.
function pullOut(type, p) {
  if (!canAdd()) return;
  const pt = stagePoint(p);
  const def = BY_ID[type];
  const st = addSticker(type, { x: clamp(pt.x / stage.w, 0, 1), y: clamp(pt.y / stage.h, 0, 1) });
  place(st);
  restack();
  popEl(st);
  sfx.pop(1.1);
  say(def.name);
  startDrag(st, p.id, pt, true);
  dragging.ox = 0;
  dragging.oy = 0;
}

// A tap on a tray sticker: it hops into the scene (wearables hop onto a friend).
function tapItem(type, itemEl) {
  if (!canAdd()) return;
  const def = BY_ID[type];
  const r = layer.getBoundingClientRect();
  const from = centerOf(itemEl);
  const st = addSticker(type, { x: (from.x - r.left) / stage.w, y: (from.y - r.top) / stage.h, s: def.s * 0.6 });
  place(st);
  restack();
  say(def.name);
  let fr = null;
  if (def.kind === 'wear') {
    const sel = selected && (selected.p ? byUid[selected.p] : selected);
    if (sel && BY_ID[sel.t].kind === 'friend') fr = sel;
    else {
      const friends = items.filter((x) => BY_ID[x.t].kind === 'friend' && !x.p);
      fr = friends.filter((f) => !childrenOf(f).some((c) => BY_ID[c.t].fit === def.fit)).pop() || friends.pop() || null;
    }
  }
  // next frame: fly to the spot
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!st.el) return;
    if (fr && fr.el) {
      attach(st, fr, true);
      setTimeout(() => {
        if (!st.el) return;
        const w = world(st);
        sfx.chime([0, 4, 7, 12], 880, 0.05);
        fx.sparkles(w.x + r.left, w.y + r.top, 8, 36);
        if (fr.el) replayClass(fr.el.firstChild, 'wiggle-s');
        cheer();
      }, 380);
    } else {
      st.x = rand(0.25, 0.75);
      st.y = rand(0.3, 0.72);
      st.s = def.s;
      st.r = def.kind === 'friend' || def.kind === 'wear' ? 0 : rand(-12, 12);
      tweenEls([st], 450);
      place(st);
      setTimeout(() => {
        if (!st.el) return;
        sfx.pop(1);
        const w = world(st);
        fx.sparkles(w.x + r.left, w.y + r.top, 6, 30);
      }, 380);
    }
    select(st);
    saveScene();
  }));
}

// ---------------------------------------------------------------------------
// Toolbar actions
// ---------------------------------------------------------------------------
function resize(st, k) {
  const def = BY_ID[st.t];
  const lim = st.p ? [0.15, 2.5] : [0.3, 3.5];
  const ns = clamp(st.s * k, lim[0], lim[1]);
  if (ns === st.s) { sfx.boing(); replayClass(st.el.firstChild, 'wiggle-s'); return; }
  if (st.p && def.at) {
    // keep a worn thing fixed at its anchor while it grows
    const ax = st.lx + def.at[0] * st.s;
    const ay = st.ly + def.at[1] * st.s;
    st.lx = ax - def.at[0] * ns;
    st.ly = ay - def.at[1] * ns;
  }
  st.s = ns;
  tweenEls([st].concat(childrenOf(st)));
  placeTree(st);
  if (sfx.ready()) sfx.tone(k > 1 ? { f0: 400, f1: 900, dur: 0.15, vol: 0.15 } : { f0: 900, f1: 400, dur: 0.15, vol: 0.15 });
}
function toolbar(action) {
  const st = selected;
  if (!st || !st.el) return;
  switch (action) {
    case 'bigger': resize(st, 1.22); break;
    case 'smaller': resize(st, 1 / 1.22); break;
    case 'flip':
      st.f = -st.f;
      tweenEls([st].concat(childrenOf(st)));
      placeTree(st);
      sfx.whoosh();
      break;
    case 'spin':
      st.r += 30;
      tweenEls([st].concat(childrenOf(st)));
      placeTree(st);
      sfx.pick(5);
      break;
    case 'front':
      items = items.filter((x) => x !== st);
      items.push(st);
      restack();
      replayClass(st.el.firstChild, 'pop');
      sfx.chime([0, 7], 990, 0.06);
      break;
    case 'remove': {
      const w = world(st);
      const r = layer.getBoundingClientRect();
      sfx.whoosh();
      fx.burst(w.x + r.left, w.y + r.top, '#fff');
      removeSticker(st);
      break;
    }
  }
  updateSelSoon();
  saveScene();
}
let selTimer = 0;
function updateSelSoon() {
  updateSel();
  clearTimeout(selTimer);
  selTimer = setTimeout(updateSel, 400);
}

// ---------------------------------------------------------------------------
// Worlds
// ---------------------------------------------------------------------------
function drawStickers(c, list, w, h, base) {
  const saveStage = stage;
  const saveBase = BASE;
  stage = { w, h };
  BASE = base;
  for (const st of list) {
    const ww = world(st);
    const a = art[st.t];
    if (!a || !a.img) continue;
    c.save();
    c.translate(ww.x, ww.y);
    c.rotate(ww.rot * RAD);
    c.scale(ww.f, 1);
    c.shadowColor = 'rgba(45, 36, 66, .25)';
    c.shadowOffsetY = Math.max(1, ww.size * 0.02);
    try { c.drawImage(a.img, -ww.size / 2, -ww.size / 2, ww.size, ww.size); } catch (err) { /* not loaded */ }
    c.restore();
  }
  stage = saveStage;
  BASE = saveBase;
}
// stickers of a saved world, in stacking order, ready for drawStickers()
function savedList(id) {
  const raw = store.data.scenes[id] || [];
  const map = {};
  const list = raw.filter((d) => BY_ID[d.t]).map((d) => {
    const st = { uid: d.u, t: d.t, x: d.x, y: d.y, s: d.s, r: d.r || 0, f: d.f === -1 ? -1 : 1, p: d.p || null, lx: d.lx || 0, ly: d.ly || 0 };
    map[st.uid] = st;
    return st;
  });
  const out = [];
  list.forEach((st) => {
    if (st.p && map[st.p]) return;
    st.p = null;
    out.push(st);
    list.forEach((ch) => { if (ch.p === st.uid) out.push(ch); });
  });
  return { out, map };
}

function buildWorldGrid() {
  const grid = $('#world-grid');
  grid.querySelectorAll('canvas').forEach((cv) => { cv.width = 0; cv.height = 0; });
  grid.innerHTML = '';
  for (const sc of SCENES) {
    const btn = document.createElement('button');
    btn.className = 'world-card';
    btn.setAttribute('aria-label', sc.name);
    btn.appendChild(document.createElement('canvas'));
    const n = (store.data.scenes[sc.id] || []).length;
    btn.insertAdjacentHTML('beforeend',
      `${n ? `<span class="world-count">⭐ ${n}</span>` : ''}<span class="world-name">${sc.icon} ${sc.name}</span>`);
    btn.addEventListener('click', () => { sfx.unlock(); enterWorld(sc.id); });
    grid.appendChild(btn);
  }
  artReady.then(() => requestAnimationFrame(() => {
    grid.querySelectorAll('canvas').forEach((cv, i) => {
      const r = cv.getBoundingClientRect();
      const w = Math.max(60, r.width);
      const h = Math.max(60, r.height);
      const k = Math.min(2, window.devicePixelRatio || 1);
      const vw = 360;
      const vh = (360 * h) / w;
      cv.width = Math.round(w * k);
      cv.height = Math.round(h * k);
      const c = cv.getContext('2d');
      c.scale((w * k) / vw, (h * k) / vh);
      const id = SCENES[i].id;
      paintScene(c, vw, vh, id, PARTY);
      const anim = createAnimator(id);
      for (let j = 0; j < 3; j++) anim.draw(c, vw, vh, 2 + j, j === 0 ? 0 : 1.2);
      c.globalAlpha = 1;
      const saved = savedList(id);
      const map = saved.map;
      const prevBy = byUid;
      byUid = map;
      drawStickers(c, saved.out, vw, vh, Math.min(vw, vh) * 0.3);
      byUid = prevBy;
    });
  }));
}

function enterWorld(id) {
  worldId = id;
  const sc = SCENES.filter((s) => s.id === id)[0];
  $('#world-name').innerHTML = `${sc.icon}<span class="wn-text"> ${sc.name}</span>`;
  sfx.chime([0, 4, 7, 12], 660, 0.06);
  showScreen(null);
  $('#play').classList.remove('hidden');
  playing = true;
  overrideScene(id);
  animateBackground(false);
  selected = null;
  loadScene(id);
  layoutStage();
  items.forEach((st, i) => setTimeout(() => popEl(st), Math.min(600, i * 30)));
  say(items.length ? sc.name : `${sc.name}! Drag a sticker in!`);
  if (!items.length) setTimeout(() => replayClass($('#items'), 'nudge'), 700);
}
function leaveWorld() {
  if (dragging) { dragging = null; pinch = null; }
  saveScene();
  store.persistNow();
  playing = false;
  select(null);
  $('#play').classList.add('hidden');
  overrideScene(null);
  animateBackground(true);
  fx.clear();
  buildWorldGrid();
  showScreen('screen-worlds');
}

// ---------------------------------------------------------------------------
// Save a picture, clear the scene
// ---------------------------------------------------------------------------
async function savePicture() {
  select(null);
  await artReady;
  const w = stage.w;
  const h = stage.h;
  const k = Math.min(2.5, 2400 / Math.max(w, h));
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * k);
  cv.height = Math.round(h * k);
  const c = cv.getContext('2d');
  c.scale(k, k);
  paintScene(c, w, h, worldId, PARTY);
  const anim = createAnimator(worldId);
  for (let j = 0; j < 3; j++) anim.draw(c, w, h, 2 + j, j === 0 ? 0 : 1.2);
  c.globalAlpha = 1;
  drawStickers(c, ordered(), w, h, BASE);
  sfx.sparkle();
  const r = $('[data-action="save"]').getBoundingClientRect();
  fx.sparkles(r.left + r.width / 2, r.top + r.height / 2, 10, 40);
  say('Click! What a picture!');
  saveImage(cv, 'my-sticker-scene', 'My sticker scene');
}
async function clearAll() {
  const roots = ordered().filter((s) => !s.p).reverse();
  const groups = roots.map((st) => ({ w: world(st), els: [st].concat(childrenOf(st)).map((x) => x.el) }));
  items.forEach((st) => { st.el = null; });
  items = [];
  byUid = {};
  select(null);
  saveScene();
  sfx.whoosh();
  const r = layer.getBoundingClientRect();
  groups.forEach((g, i) => setTimeout(() => {
    fx.burst(g.w.x + r.left, g.w.y + r.top);
    if (i % 3 === 0) sfx.pop(1 + i * 0.03);
    g.els.forEach((el) => {
      if (!el) return;
      replayClass(el.firstChild, 'poof');
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 420);
    });
  }, Math.min(900, i * 50)));
  await wait(Math.min(900, groups.length * 50) + 200);
  say('All clean! Make a new one!');
}

// ---------------------------------------------------------------------------
// Title: a little dressed-up kitty
// ---------------------------------------------------------------------------
function buildTitleFriend() {
  const box = $('#title-friend');
  const size = 150;
  const fr = { uid: 1, t: 'kitty', x: 0.5, y: 0.5, s: 1, r: 0, f: 1, p: null };
  const kids = [{ t: 'party' }, { t: 'starglasses' }].map((k, i) => {
    const def = BY_ID[k.t];
    const a = BY_ID.kitty.anchors[def.fit];
    const cs = a.w / def.span;
    return { uid: 2 + i, t: k.t, s: cs, lx: a.x - def.at[0] * cs, ly: a.y - def.at[1] * cs, r: 0, f: 1, p: 1 };
  });
  const prev = [byUid, stage, BASE];
  byUid = { 1: fr };
  stage = { w: size, h: size };
  BASE = size;
  box.innerHTML = [fr].concat(kids).map((st) => {
    const w = world(st);
    return `<img src="${art[st.t].src}" alt="" draggable="false" style="width:${w.size}px;height:${w.size}px;left:${w.x - w.size / 2}px;top:${w.y - w.size / 2}px">`;
  }).join('');
  [byUid, stage, BASE] = prev;
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
buildTabs();
showTab(store.data.tab, false);
buildTitleFriend();

boot({
  party: PARTY,
  onAction(action, el) {
    switch (action) {
      case 'worlds': buildWorldGrid(); showScreen('screen-worlds'); say('Pick a world!'); break;
      case 'home': showScreen('screen-title'); break;
      case 'back': leaveWorld(); break;
      case 'tab':
        sfx.pick(CATS.findIndex((c) => c.key === el.dataset.cat));
        showTab(el.dataset.cat, true);
        replayClass(el, 'bounce');
        break;
      case 'clear':
        if (!items.length) { sfx.boing(); say('Nothing to clear yet!'); break; }
        select(null);
        showScreen('screen-clear');
        say('Clear it all?');
        break;
      case 'clear-yes': showScreen(null); clearAll(); break;
      case 'clear-no': showScreen(null); break;
      case 'save': savePicture(); break;
      default: toolbar(action);
    }
  },
  onBack(screen) {
    if (screen === 'screen-clear') { showScreen(null); return true; }
    if (screen === null && playing) { leaveWorld(); return true; }
    if (screen === 'screen-worlds') { showScreen('screen-title'); return true; }
    return false;
  },
  onFrame(dt, t) {
    if (!playing) return;
    drawStage(t, dt);
    if (fling) {
      scrollBy(fling.v);
      fling.v *= 0.92;
      if (Math.abs(fling.v) < 0.5) fling = null;
    }
  },
  onResize() {
    if (playing) requestAnimationFrame(layoutStage);
  },
});

// a little hook for automated tests
window.__stickers = {
  get items() { return items; },
  get selected() { return selected; },
  get stage() { return stage; },
  world, enterWorld, tapItem: (id) => tapItem(id, itemsEl.firstChild || itemsEl), showTab, savePicture, store,
  anchorStage(st, fit) { const a = BY_ID[st.t].anchors[fit]; return localToStage(world(st), a.x, a.y); },
};
