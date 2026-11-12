// Jigsaw Puzzles: the coloring pictures cut into 4 to 16 big pieces that snap
// into place. Kids can also make puzzles from their own art: colored pictures,
// spin paintings, butterflies, monsters and drawings (shared/js/gallery.js).
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import {
  boot, $, $$, fx, showScreen, celebrate, onPointer, createStore, replayClass, coloringSave,
  pickOne, shuffle, rand, clamp, ease, wait, currentScreen, W, H, DPR,
} from '../../shared/js/kit.js';
import { PICTURES, CATEGORIES, PALETTE, INK } from '../../shared/js/pictures.js';
import { pictureMarkup, svgOpen, svgToCanvas, installDefs } from '../../shared/js/art.js';
import { listArt } from '../../shared/js/gallery.js';
import { earnSticker } from '../../shared/js/rewards.js';
import { makeCut, pieceOps, tracePath, svgPath, seamsPath, seeded } from './cut.js';

const store = createStore('jigsaw', { done: {}, size: 4, tab: 'all' });
if (!store.data.done || typeof store.data.done !== 'object') store.data.done = {};

// grids: the ways to cut each size (cols, rows); the one that gives the
// biggest pieces on this screen (and for this picture's shape) wins.
const SIZES = [
  { n: 4, grids: [[2, 2]], tile: 'green', word: 'Four' },
  { n: 6, grids: [[3, 2], [2, 3]], tile: 'orange', word: 'Six' },
  { n: 9, grids: [[3, 3]], tile: 'purple', word: 'Nine' },
  { n: 12, grids: [[4, 3], [3, 4]], tile: 'blue', word: 'Twelve' },
  { n: 16, grids: [[4, 4]], tile: 'pink', word: 'Sixteen' },
];
const sizeInfo = (n) => SIZES.find((s) => s.n === n) || SIZES[0];

const TABS = [{ key: 'mine', name: 'My Pictures', icon: '🎨' }].concat(CATEGORIES);

const PRAISE = ['Great job!', 'You did it!', 'Hooray!', 'Wonderful!', 'Super puzzling!', 'Amazing!', 'Well done!', 'Yay!'];
const BANNERS = ['Hooray!', 'You did it!', 'Wonderful!', 'Super!', 'Amazing!'];

// ---------------------------------------------------------------------------
// Pictures: real colors, or the kid's own coloring from Color Splash Party
// ---------------------------------------------------------------------------
function myArt() {
  const save = coloringSave();
  return save && save.art && typeof save.art === 'object' ? save.art : {};
}

function hasArt(a) {
  if (!a || typeof a !== 'object') return false;
  const f = a.f || {};
  return Object.keys(f).some((k) => !!f[k]) || (Array.isArray(a.s) && a.s.length > 0);
}

// Where a kid's artwork came from (the My Pictures tab groups them like this).
const SOURCES = [
  { key: 'spinart', icon: '🌀', name: 'Spin Art' },
  { key: 'monster', icon: '👾', name: 'Monsters' },
  { key: 'coloring', icon: '🎨', name: 'Coloring' },
  { key: 'drawing', icon: '✏️', name: 'Drawings' },
  { key: 'other', icon: '🖼️', name: 'More Art' },
];
const sourceInfo = (k) => SOURCES.find((s) => s.key === k) || SOURCES[SOURCES.length - 1];

function sourceOf(item) {
  const g = String(item.game || '').toLowerCase();
  const t = String(item.title || '').toLowerCase();
  if (/draw|doodle|sketch|trac/.test(g) || (/color|colour/.test(g) && /draw|doodle/.test(t))) return 'drawing';
  if (/spin|butterfl/.test(g)) return 'spinart';
  if (/monster/.test(g)) return 'monster';
  if (/color|colour/.test(g)) return 'coloring';
  return 'other';
}

function realEntry(pic) { return { kind: 'pic', pic, name: pic.name, mine: false, key: pic.id, asp: 1 }; }

// A saved artwork from the gallery. Its id never changes, so progress is saved per id.
function artEntry(item) {
  const asp = item.w > 0 && item.h > 0 ? item.w / item.h : 1;
  return {
    kind: 'art', item, name: item.title || 'My picture', mine: true, key: `art-${item.id}`,
    src: sourceOf(item), artAsp: asp, asp: clamp(asp, 0.7, 1.43),
  };
}

function galleryArt() {
  let items = [];
  try { items = listArt(); } catch (err) { items = []; }
  return items.filter((it) => it && it.id && typeof it.img === 'string' && it.img.indexOf('data:image') === 0).map(artEntry);
}

function entriesFor(tab) {
  if (tab === 'mine') {
    const art = myArt();
    const colored = PICTURES.filter((p) => hasArt(art[p.id])).map((pic) =>
      ({ kind: 'pic', pic, name: pic.name, mine: true, key: `my-${pic.id}`, art: art[pic.id], src: 'coloring', asp: 1 }));
    const all = galleryArt().concat(colored);
    // grouped by where they were made (newest first inside each group)
    const out = [];
    SOURCES.forEach((s) => all.forEach((e) => { if (e.src === s.key) out.push(e); }));
    return out;
  }
  return PICTURES.filter((p) => tab === 'all' || p.cat === tab).map(realEntry);
}

// The picture as a little HTML thumbnail (inside a square box).
function thumbHTML(entry, prefix) {
  if (entry.kind === 'art') return `<img class="art-img" src="${entry.item.img}" alt="" draggable="false">`;
  return `${svgOpen()}${markup(entry, prefix)}</svg>`;
}

function markup(entry, prefix) {
  const pic = entry.pic;
  if (entry.mine) {
    const a = entry.art || {};
    const f = a.f || {};
    return pictureMarkup(pic, { prefix, fill: (i) => f[i] || null, strokes: a.s || [] });
  }
  return pictureMarkup(pic, { prefix, fill: (i) => pic.shapes[i].c });
}

const doneFor = (entry) => store.data.done[entry.key] || {};

// ---------------------------------------------------------------------------
// Title screen art
// ---------------------------------------------------------------------------
function heroMarkup() {
  const cut = makeCut(2, 2, seeded(7));
  const cell = 100;
  const colors = ['#ff7ac6', '#ffd93b', '#5cd65c', '#3d7bff'];
  let out = '<svg viewBox="-30 -40 270 270" xmlns="http://www.w3.org/2000/svg">';
  let n = 0;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const ops = pieceOps(cut, c, r, cell, cell);
      const gap = 5;
      const ox = c * cell + (c ? gap : 0);
      const oy = r * cell + (r ? gap : 0);
      const d = svgPath(ops, 0, 0);
      const cls = n === 1 ? 'hero-piece float' : 'hero-piece';
      out += `<g class="${cls}" style="animation-delay:${-n * 0.4}s"><g transform="translate(${ox} ${oy})">` +
        `<path d="${d}" fill="${colors[n]}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
        `<path d="M18 22Q28 12 42 14" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="7" stroke-linecap="round"/>`;
      // cute faces on two of the pieces
      if (n === 0 || n === 3) {
        out += `<circle cx="38" cy="50" r="7" fill="${INK}"/><circle cx="62" cy="50" r="7" fill="${INK}"/>` +
          '<circle cx="36" cy="47" r="2.4" fill="#fff"/><circle cx="60" cy="47" r="2.4" fill="#fff"/>' +
          `<path d="M40 64Q50 74 60 64" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
          '<ellipse cx="28" cy="64" rx="7" ry="4.5" fill="#ff4d5e" opacity=".45"/><ellipse cx="72" cy="64" rx="7" ry="4.5" fill="#ff4d5e" opacity=".45"/>';
      }
      out += '</g></g>';
      n++;
    }
  }
  return out + '</svg>';
}

function paletteArt() {
  const dots = ['red', 'yellow', 'green', 'blue', 'purple'].map((k) => PALETTE.find((p) => p.key === k).hex);
  const pos = [[62, 58], [96, 42], [132, 50], [150, 84], [58, 96]];
  return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">' +
    `<path d="M100 18C150 18 186 50 182 90C178 122 146 118 136 128C124 140 140 150 112 150C58 150 18 122 18 84C18 46 54 18 100 18Z" fill="#ffd2a6" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
    `<ellipse cx="104" cy="112" rx="15" ry="12" fill="#fff" stroke="${INK}" stroke-width="5"/>` +
    pos.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="13" fill="${dots[i]}" stroke="${INK}" stroke-width="4"/>`).join('') +
    `<g transform="rotate(35 160 40)"><rect x="152" y="-6" width="16" height="70" rx="7" fill="#a7663c" stroke="${INK}" stroke-width="5"/>` +
    `<path d="M150 62H170L166 88Q160 100 154 88Z" fill="#ff7ac6" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/></g>` +
    '</svg>';
}

function updateTitle() {
  const n = Object.keys(store.data.done).filter((k) => Object.keys(store.data.done[k]).length).length;
  $('#title-best').textContent = n ? `⭐ ${n} puzzle${n === 1 ? '' : 's'} done!` : 'Pick a picture and put it together!';
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------
let galleryList = [];

function openGallery(tab) {
  if (tab) store.data.tab = tab;
  if (!TABS.some((t) => t.key === store.data.tab)) store.data.tab = 'all';
  store.persist();
  $('#tabs').innerHTML = TABS.map((t) =>
    `<button class="tab${t.key === 'mine' ? ' tab-mine' : ''}${store.data.tab === t.key ? ' on' : ''}" data-tab="${t.key}">${t.icon} ${t.name}</button>`).join('');
  hidePlay();
  showScreen('screen-gallery');
  buildGrid(!tab);
  // make sure the chosen tab is in view
  const on = $('.tab.on');
  const tabs = $('#tabs');
  if (on && tab) {
    if (on.offsetLeft + on.offsetWidth > tabs.scrollLeft + tabs.clientWidth || on.offsetLeft < tabs.scrollLeft) {
      tabs.scrollLeft = Math.max(0, on.offsetLeft - 20);
    } else tabs.scrollLeft = 0;
  }
}

function starsRow(entry) {
  const d = doneFor(entry);
  return '<span class="pic-stars">' + SIZES.map((s) => `<i class="${d[s.n] ? 'on' : ''}">★</i>`).join('') + '</span>';
}

const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

function cardHTML(entry, n) {
  const art = entry.kind === 'art';
  const src = entry.src ? sourceInfo(entry.src) : null;
  return `<button class="pic-card${entry.mine ? ' mine' : ''}${art ? ' art' : ''}" data-i="${n}" style="animation-delay:${Math.min(n, 16) * 25}ms" aria-label="${esc(entry.name)}">` +
    `<span class="thumb${art ? ' art-thumb' : ''}">${thumbHTML(entry, `t${n}-`)}</span>` +
    (src ? `<span class="src-badge" aria-hidden="true">${src.icon}</span>` : '') +
    `<span class="pic-name">${esc(entry.name)}</span>${starsRow(entry)}</button>`;
}

function buildGrid(keepPlace) {
  const scroller = $('#gallery-scroll');
  const top = scroller.scrollTop;
  const tab = store.data.tab;
  galleryList = entriesFor(tab);
  const empty = tab === 'mine' && !galleryList.length;
  $('#mine-empty').classList.toggle('hidden', !empty);
  $('#pic-grid').classList.toggle('hidden', empty);
  if (empty) {
    $('#mine-art').innerHTML = paletteArt();
    $('#pic-grid').innerHTML = '';
    return;
  }
  let html = '';
  let group = null;
  galleryList.forEach((entry, n) => {
    if (tab === 'mine' && entry.src !== group) {
      group = entry.src;
      const s = sourceInfo(group);
      html += `<div class="group-head"><span class="group-icon">${s.icon}</span> ${s.name}</div>`;
    }
    html += cardHTML(entry, n);
  });
  $('#pic-grid').innerHTML = html;
  if (keepPlace) {
    scroller.scrollTop = top;
    const card = state.entry && $(`.pic-card[data-i="${galleryList.findIndex((e) => e.key === state.entry.key)}"]`);
    if (card && scroller.clientHeight &&
      (card.offsetTop < scroller.scrollTop || card.offsetTop + card.offsetHeight > scroller.scrollTop + scroller.clientHeight)) {
      scroller.scrollTop = Math.max(0, card.offsetTop - 16);
    }
  } else scroller.scrollTop = 0;
}

$('#tabs').addEventListener('click', (e) => {
  const t = e.target.closest('[data-tab]');
  if (!t) return;
  sfx.unlock();
  sfx.pick(TABS.findIndex((x) => x.key === t.dataset.tab) * 2);
  store.data.tab = t.dataset.tab;
  store.persist();
  $$('.tab').forEach((b) => b.classList.toggle('on', b === t));
  buildGrid(false);
  if (t.dataset.tab === 'mine') say(galleryList.length ? 'My pictures!' : 'Make a picture first, then make a puzzle!');
});

$('#pic-grid').addEventListener('click', (e) => {
  const card = e.target.closest('[data-i]');
  if (!card) return;
  sfx.unlock();
  sfx.click();
  replayClass(card, 'bounce');
  openSize(galleryList[+card.dataset.i]);
});

// ---------------------------------------------------------------------------
// How many pieces?
// ---------------------------------------------------------------------------
let pending = null;
const iconCuts = {};
function iconSeams(n, cols, rows, bw, bh) {
  const id = `${cols}x${rows}:${bw}x${bh}`;
  if (!iconCuts[id]) iconCuts[id] = seamsPath(makeCut(cols, rows, seeded(n * 31 + 5)), bw, bh);
  return iconCuts[id];
}

// The play area while the puzzle is not showing yet (mirrors .area in the CSS).
function areaGuess() {
  const cs = window.getComputedStyle(document.documentElement);
  const v = (k) => parseFloat(cs.getPropertyValue(k)) || 0;
  const short = H <= 560;
  const top = (short ? 68 : 78) + v('--safe-top');
  const bottom = (short ? 8 : 12) + v('--safe-bottom');
  const left = 12 + v('--safe-left');
  const right = 12 + v('--safe-right');
  return { x: left, y: top, w: W - left - right, h: H - top - bottom };
}

// Which way to cut this size for this picture on this screen (cols x rows).
function gridFor(entry, size, A) {
  let best = null;
  size.grids.forEach((g) => {
    const L = fitBoard(A, entry.asp, g[0], g[1], size.n);
    const better = !best || L.m > best.m + 1 ||
      (Math.abs(L.m - best.m) <= 1 && (A.w >= A.h ? g[0] > best.cols : g[1] > best.rows));
    if (better) best = { cols: g[0], rows: g[1], m: L.m };
  });
  return best;
}

// The picture with the seams of a cut drawn over it (the "how many pieces" buttons).
function sizePreview(entry, size, i) {
  const g = gridFor(entry, size, areaGuess());
  const bw = entry.asp >= 1 ? 400 : Math.round(400 * entry.asp);
  const bh = entry.asp >= 1 ? Math.round(400 / entry.asp) : 400;
  const seams = iconSeams(size.n, g.cols, g.rows, bw, bh);
  const lines = `<path d="${seams}" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>` +
    `<path d="${seams}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`;
  if (entry.kind === 'art') {
    return `<span class="size-pic art-thumb"><svg viewBox="0 0 ${bw} ${bh}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">` +
      `<rect width="${bw}" height="${bh}" fill="#fff" fill-opacity=".35"/>` +
      `<image xlink:href="${entry.item.img}" width="${bw}" height="${bh}" preserveAspectRatio="xMidYMid meet"/>${lines}</svg></span>`;
  }
  return `<span class="size-pic">${svgOpen()}${markup(entry, `sz${i}-`)}${lines}</svg></span>`;
}

function openSize(entry) {
  pending = entry;
  const d = doneFor(entry);
  $('#size-tiles').innerHTML = SIZES.map((s, i) =>
    `<button class="tile size-tile ${s.tile}${store.data.size === s.n ? ' last' : ''}" data-size="${s.n}" style="animation-delay:${i * 70}ms" aria-label="${s.n} pieces">` +
      `${sizePreview(entry, s, i)}<span class="tile-name">${s.n}</span>${d[s.n] ? '<span class="size-star">⭐</span>' : ''}</button>`).join('');
  showScreen('screen-size');
  say('How many pieces?');
}

$('#size-tiles').addEventListener('click', (e) => {
  const t = e.target.closest('[data-size]');
  if (!t || !pending) return;
  sfx.unlock();
  sfx.click();
  startPuzzle(pending, +t.dataset.size);
});

// ---------------------------------------------------------------------------
// Puzzle
// ---------------------------------------------------------------------------
const play = $('#play');
const layer = $('#layer');
const board = $('#board');
const hitCtx = document.createElement('canvas').getContext('2d');
let state = { entry: null };
let token = 0; // bumps whenever a puzzle starts or ends, so stale async work stops
const bitmaps = {};

async function bitmapFor(entry) {
  const id = entry.kind === 'art' ? entry.key : entry.mine ? `${entry.key}:${JSON.stringify(entry.art)}` : entry.key;
  if (bitmaps[id]) return bitmaps[id];
  const px = clamp(Math.ceil(Math.min(W, H) * DPR), 600, 1400);
  let cv;
  if (entry.kind === 'art') cv = await artBitmap(entry, px);
  else {
    const holder = document.createElement('div');
    holder.innerHTML = `${svgOpen()}${markup(entry, 'bm')}</svg>`;
    cv = await svgToCanvas(holder.firstChild, px);
  }
  bitmaps[id] = cv;
  return cv;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// A happy backdrop for art that is much wider or taller than the board:
// soft candy colors with polka dots, so the extra space looks on purpose.
function paintBackdrop(c, w, h) {
  const g = c.createLinearGradient(0, 0, w * 0.4, h);
  g.addColorStop(0, '#fff4c9');
  g.addColorStop(0.5, '#ffe2f2');
  g.addColorStop(1, '#dff1ff');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  const colors = ['#ff7ac6', '#ffd93b', '#5cd65c', '#6fc8ff', '#c27bff', '#ff9a3d'];
  const step = Math.max(w, h) / 9;
  const r = seeded(11);
  let k = 0;
  for (let y = step / 2; y < h + step; y += step * 0.86) {
    const row = Math.round(y / (step * 0.86));
    for (let x = (row % 2 ? step / 2 : 0); x < w + step; x += step) {
      c.globalAlpha = 0.28;
      c.fillStyle = colors[k++ % colors.length];
      c.beginPath();
      c.arc(x + (r() - 0.5) * step * 0.2, y + (r() - 0.5) * step * 0.2, step * (0.12 + r() * 0.06), 0, Math.PI * 2);
      c.fill();
    }
  }
  c.globalAlpha = 1;
}

// A gallery picture on a board of the entry's shape. Art that is close to that
// shape fills it exactly; very wide or tall art sits in a little white frame.
async function artBitmap(entry, px) {
  const img = await loadImage(entry.item.img);
  const asp = entry.asp;
  const bw = Math.round(asp >= 1 ? px : px * asp);
  const bh = Math.round(asp >= 1 ? px / asp : px);
  const cv = document.createElement('canvas');
  cv.width = bw;
  cv.height = bh;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in c) c.imageSmoothingQuality = 'high';
  const ia = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
  if (Math.abs(ia - asp) / asp < 0.02) {
    c.drawImage(img, 0, 0, bw, bh);
    return cv;
  }
  paintBackdrop(c, bw, bh);
  // contain, with a little room for the frame
  const room = 0.92;
  let w = bw * room;
  let h = w / ia;
  if (h > bh * room) { h = bh * room; w = h * ia; }
  const x = (bw - w) / 2;
  const y = (bh - h) / 2;
  const f = Math.max(4, Math.round(px * 0.012));
  c.save();
  c.shadowColor = 'rgba(40, 10, 90, .3)';
  c.shadowBlur = f * 2;
  c.shadowOffsetY = f;
  c.fillStyle = '#fff';
  c.fillRect(x - f, y - f, w + 2 * f, h + 2 * f);
  c.restore();
  c.drawImage(img, x, y, w, h);
  return cv;
}

function hidePlay() {
  token++;
  play.classList.add('hidden');
  state.drags = new Map();
  fx.clear();
}

async function startPuzzle(entry, n) {
  const my = ++token;
  const size = sizeInfo(n);
  store.data.size = size.n;
  store.persist();
  // drop the old pieces
  $$('.piece', layer).forEach((el) => el.parentNode.removeChild(el));
  state = {
    entry, n: size.n, cols: size.grids[0][0], rows: size.grids[0][1], pieces: [], placed: 0, done: false,
    drags: new Map(), ready: false, idle: 0, hintPiece: null, hintAt: 0, nearPiece: null, z: 10,
  };
  $('#pic-name').textContent = entry.name;
  board.classList.remove('happy', 'finished');
  $('#full').classList.remove('show');
  $('#slot-glow').classList.add('hidden');
  showScreen(null);
  play.classList.remove('hidden');
  board.classList.add('loading');

  // 6 and 12 pieces: more across or more down, whichever gives bigger pieces here
  if (size.grids.length > 1) {
    const g = gridFor(entry, size, measureArea());
    state.cols = g.cols;
    state.rows = g.rows;
  }
  let bm;
  try { bm = await bitmapFor(entry); } catch (err) { bm = null; }
  if (my !== token) return;
  if (!bm) { sfx.boing(); openGallery(); return; }
  state.bitmap = bm;
  state.cut = makeCut(state.cols, state.rows);
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const el = document.createElement('div');
      el.className = 'piece';
      const cv = document.createElement('canvas');
      el.appendChild(cv);
      layer.appendChild(el);
      state.pieces.push({ c, r, el, cv, x: 0, y: 0, hx: 0, hy: 0, placed: false, tw: null, z: 0 });
    }
  }
  layout(false);
  board.classList.remove('loading');
  // start as the whole picture, then the pieces jump out
  state.pieces.forEach((p) => { p.x = p.hx; p.y = p.hy; place(p); });
  say(`${entry.name}!`);
  await wait(900);
  if (my !== token) return;
  sfx.whoosh();
  shuffle(state.pieces).forEach((p, i) => {
    setTimeout(() => {
      if (my !== token || p.placed || isDragged(p)) return;
      tweenPiece(p, p.sx, p.sy, 0.55, ease.back);
    }, i * 70);
  });
  state.ready = true;
}

function measureArea() {
  const r = $('#area').getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

// Free space around a bw x bh board: below/left/right (stack) or left/right (side).
function trays(A, bw, bh, mode, g) {
  if (mode === 'stack') {
    const bx = A.x + (A.w - bw) / 2;
    const by = A.y;
    return {
      bx, by,
      rects: [
        { x: A.x, y: by + bh + g, w: A.w, h: A.y + A.h - (by + bh + g) },
        { x: A.x, y: A.y, w: bx - g - A.x, h: bh },
        { x: bx + bw + g, y: A.y, w: A.x + A.w - (bx + bw + g), h: bh },
      ],
    };
  }
  const bx = A.x + (A.w - bw) / 2;
  const by = A.y + (A.h - bh) / 2;
  return {
    bx, by,
    rects: [
      { x: A.x, y: A.y, w: bx - g - A.x, h: A.h },
      { x: bx + bw + g, y: A.y, w: A.x + A.w - (bx + bw + g), h: A.h },
    ],
  };
}

const fitCount = (R, fw, fh) => Math.max(0, Math.floor(R.w / fw)) * Math.max(0, Math.floor(R.h / fh));

// The biggest board (of shape asp = width / height) that still leaves room to
// lay every piece out beside it. Big puzzles let the loose pieces overlap a
// little, so the board (and every piece) can be bigger.
function fitBoard(A, asp, cols, rows, n) {
  const g = 10;
  const ov = n >= 12 ? 0.8 : 1;
  const maxW = Math.floor(Math.min(A.w, A.h * asp, asp >= 1 ? 700 : 700 * asp));
  const minW = 90 * Math.min(1, asp);
  const make = (bw, t) => {
    const bh = bw / asp;
    const cw = bw / cols;
    const ch = bh / rows;
    const m = Math.min(cw, ch);
    return { bw, bh, bx: t.bx, by: t.by, rects: t.rects, fw: (cw + m * 0.2) * ov, fh: (ch + m * 0.2) * ov, cw, ch, m };
  };
  for (let bw = maxW; bw >= minW; bw -= 2) {
    const bh = bw / asp;
    const cw = bw / cols;
    const ch = bh / rows;
    const m = Math.min(cw, ch);
    const fw = (cw + m * 0.2) * ov;
    const fh = (ch + m * 0.2) * ov;
    for (const mode of ['stack', 'side']) {
      const t = trays(A, bw, bh, mode, g);
      let cap = 0;
      t.rects.forEach((R) => { cap += fitCount(R, fw, fh); });
      if (cap >= n) return make(bw, t);
    }
  }
  return make(minW, trays(A, minW, minW / asp, 'stack', g));
}

// Spots for the loose pieces, spread over the free space.
function scatterSpots(A, L, n) {
  const spots = [];
  L.rects.forEach((R) => {
    const nx = Math.floor(R.w / L.fw);
    const ny = Math.floor(R.h / L.fh);
    if (nx < 1 || ny < 1) return;
    const sx = R.w / nx;
    const sy = R.h / ny;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const jx = Math.max(0, (sx - L.fw) / 2) * 0.8 + L.m * 0.05;
        const jy = Math.max(0, (sy - L.fh) / 2) * 0.8 + L.m * 0.05;
        // keep the whole piece (tabs too) inside the play area
        const x = clamp(R.x + sx * (i + 0.5) + rand(-jx, jx), A.x + L.cw / 2 + L.m * 0.26, A.x + A.w - L.cw / 2 - L.m * 0.26);
        const y = clamp(R.y + sy * (j + 0.5) + rand(-jy, jy), A.y + L.ch / 2 + L.m * 0.2, A.y + A.h - L.ch / 2 - L.m * 0.26);
        spots.push({ x, y });
      }
    }
  });
  if (spots.length < n) {
    // not enough room (a very odd screen): pile them up wherever there is space
    while (spots.length < n) spots.push({ x: rand(L.m / 2, W - L.m / 2), y: rand(H * 0.5, H - L.m / 2) });
    return shuffle(spots).slice(0, n);
  }
  const pickN = [];
  for (let i = 0; i < n; i++) pickN.push(spots[Math.floor((i + 0.5) * spots.length / n)]);
  // never lay them out already in picture order
  let out = shuffle(pickN);
  for (let k = 0; k < 6 && n > 1 && out.every((sp, i) => sp === pickN[i]); k++) out = shuffle(pickN);
  return out;
}

function layout(keepLoose) {
  const A = measureArea();
  const L = fitBoard(A, state.entry.asp, state.cols, state.rows, state.n);
  L.pad = Math.ceil(L.m * 0.3) + 10;
  state.L = L;
  board.style.left = `${L.bx}px`;
  board.style.top = `${L.by}px`;
  board.style.width = `${L.bw}px`;
  board.style.height = `${L.bh}px`;
  // small pieces grow a little more while a finger holds them
  play.classList.toggle('small-pieces', L.m < 110);
  drawBoard();
  const loose = state.pieces.filter((p) => !p.placed);
  const spots = scatterSpots(A, L, loose.length);
  state.pieces.forEach((p) => {
    p.ops = pieceOps(state.cut, p.c, p.r, L.cw, L.ch);
    p.hx = L.bx + p.c * L.cw;
    p.hy = L.by + p.r * L.ch;
    const w = L.cw + 2 * L.pad;
    const h = L.ch + 2 * L.pad;
    p.el.style.width = `${w}px`;
    p.el.style.height = `${h}px`;
    drawPiece(p, !p.placed);
  });
  loose.forEach((p, i) => {
    p.sx = spots[i].x - L.cw / 2;
    p.sy = spots[i].y - L.ch / 2;
    if (keepLoose) { p.tw = null; p.x = p.sx; p.y = p.sy; }
  });
  state.pieces.forEach((p) => {
    if (p.placed) { p.tw = null; p.x = p.hx; p.y = p.hy; }
    place(p);
  });
}

function sizeCanvas(cv, w, h, dpr) {
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  cv.style.width = `${w}px`;
  cv.style.height = `${h}px`;
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  return c;
}

function drawBoard() {
  const L = state.L;
  const dpr = Math.min(DPR, 2);
  const bm = state.bitmap;
  let c = sizeCanvas($('#ghost'), L.bw, L.bh, dpr);
  c.drawImage(bm, 0, 0, L.bw, L.bh);
  c = sizeCanvas($('#full'), L.bw, L.bh, dpr);
  c.drawImage(bm, 0, 0, L.bw, L.bh);
  // the outline of every slot
  c = sizeCanvas($('#slots'), L.bw, L.bh, dpr);
  c.lineJoin = 'round';
  state.pieces.forEach((p) => {
    const ops = pieceOps(state.cut, p.c, p.r, L.cw, L.ch);
    tracePath(c, ops, p.c * L.cw, p.r * L.ch);
    c.strokeStyle = 'rgba(255,255,255,.9)';
    c.lineWidth = 5;
    c.stroke();
    c.strokeStyle = 'rgba(123, 70, 210, .55)';
    c.lineWidth = 2;
    c.stroke();
  });
}

function drawPiece(p, lifted) {
  const L = state.L;
  const dpr = Math.min(DPR, 2);
  const w = L.cw + 2 * L.pad;
  const h = L.ch + 2 * L.pad;
  const c = sizeCanvas(p.cv, w, h, dpr);
  c.clearRect(0, 0, w, h);
  c.lineJoin = 'round';
  if (lifted) {
    c.save();
    c.shadowColor = 'rgba(40, 10, 90, .4)';
    c.shadowBlur = 10 * dpr;
    c.shadowOffsetY = 5 * dpr;
    tracePath(c, p.ops, L.pad, L.pad);
    c.fillStyle = '#fff';
    c.fill();
    c.restore();
  }
  c.save();
  tracePath(c, p.ops, L.pad, L.pad);
  c.clip();
  c.drawImage(state.bitmap, L.pad - p.c * L.cw, L.pad - p.r * L.ch, L.bw, L.bh);
  c.restore();
  tracePath(c, p.ops, L.pad, L.pad);
  c.strokeStyle = 'rgba(255,255,255,.9)';
  c.lineWidth = lifted ? 4 : 2.5;
  c.stroke();
  c.strokeStyle = lifted ? 'rgba(45, 36, 66, .65)' : 'rgba(45, 36, 66, .35)';
  c.lineWidth = lifted ? 1.6 : 1.2;
  c.stroke();
}

function place(p) {
  const pad = state.L.pad;
  p.el.style.transform = `translate3d(${Math.round((p.x - pad) * 10) / 10}px, ${Math.round((p.y - pad) * 10) / 10}px, 0)`;
}

function tweenPiece(p, tx, ty, dur, fn, done) {
  p.tw = { fx: p.x, fy: p.y, tx, ty, t: 0, dur, fn: fn || ease.out, done };
}

function isDragged(p) {
  let yes = false;
  state.drags.forEach((d) => { if (d.p === p) yes = true; });
  return yes;
}

function toFront(p) {
  state.z++;
  p.z = state.z;
  p.el.style.zIndex = String(p.z);
}

// Which loose piece is under a finger? Exact shape first, then a forgiving nearby check.
function pieceAt(x, y) {
  const loose = state.pieces.filter((p) => !p.placed && !isDragged(p)).sort((a, b) => b.z - a.z);
  const L = state.L;
  for (const p of loose) {
    tracePath(hitCtx, p.ops, 0, 0);
    if (hitCtx.isPointInPath(x - p.x, y - p.y)) return p;
  }
  let best = null;
  let bestD = L.m * 0.62;
  for (const p of loose) {
    const d = Math.sqrt(Math.pow(x - (p.x + L.cw / 2), 2) + Math.pow(y - (p.y + L.ch / 2), 2)) -
      Math.max(0, Math.min(L.cw, L.ch) * 0.3);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

const snapDist = () => Math.max(34, state.L.m * 0.42);
const homeDist = (p) => Math.sqrt((p.x - p.hx) * (p.x - p.hx) + (p.y - p.hy) * (p.y - p.hy));

function showGlow(p, hint) {
  const L = state.L;
  const g = $('#slot-glow');
  g.style.left = `${p.c * L.cw}px`;
  g.style.top = `${p.r * L.ch}px`;
  g.style.width = `${L.cw}px`;
  g.style.height = `${L.ch}px`;
  g.classList.remove('hidden');
  g.classList.toggle('hint', !!hint);
  state.glowFor = p;
}
function hideGlow() {
  $('#slot-glow').classList.add('hidden');
  state.glowFor = null;
}

// little synthesized sounds
function pickupSound() {
  if (!sfx.ready()) return;
  sfx.tone({ type: 'sine', f0: 420, f1: 760, dur: 0.08, vol: 0.13 });
  sfx.noise({ dur: 0.03, vol: 0.06, freq: 2600 });
}
function dropSound() {
  if (!sfx.ready()) return;
  sfx.tone({ type: 'triangle', f0: 320, f1: 220, dur: 0.09, vol: 0.12 });
  sfx.noise({ dur: 0.04, vol: 0.08, freq: 900 });
}
function snapSound(i) {
  if (!sfx.ready()) return;
  // a woody "click", then a happy note that climbs with every piece
  sfx.noise({ dur: 0.025, vol: 0.4, freq: 3200 });
  sfx.tone({ type: 'triangle', f0: 1400, f1: 700, dur: 0.05, vol: 0.18 });
  sfx.noise({ dur: 0.03, vol: 0.25, freq: 1800, delay: 0.035 });
  sfx.pick(i + 2);
}

onPointer(layer, {
  down(pt) {
    if (!state.ready || state.done || currentScreen() !== null) return false;
    const p = pieceAt(pt.x, pt.y);
    if (!p) return false;
    p.tw = null;
    state.drags.set(pt.id, { p, ox: pt.x - p.x, oy: pt.y - p.y });
    toFront(p);
    p.el.classList.add('lifted');
    pickupSound();
    state.idle = 0;
    if (state.glowFor && state.glowFor !== p) hideGlow();
    return true;
  },
  move(pt) {
    const d = state.drags.get(pt.id);
    if (!d) return;
    const p = d.p;
    const L = state.L;
    p.x = clamp(pt.x - d.ox, -L.cw * 0.4, W - L.cw * 0.6);
    p.y = clamp(pt.y - d.oy, -L.ch * 0.2, H - L.ch * 0.6);
    place(p);
    state.idle = 0;
    // light up the right spot when the piece gets close
    if (homeDist(p) < snapDist() * 1.7) { if (state.glowFor !== p) showGlow(p, false); } else if (state.glowFor === p && !$('#slot-glow').classList.contains('hint')) hideGlow();
  },
  up(pt) {
    const d = state.drags.get(pt.id);
    if (!d) return;
    state.drags.delete(pt.id);
    const p = d.p;
    p.el.classList.remove('lifted');
    if (state.done || p.placed) return;
    if (homeDist(p) < snapDist()) snap(p);
    else {
      dropSound();
      if (state.glowFor === p) hideGlow();
      // keep it on screen
      const L = state.L;
      const tx = clamp(p.x, 4 - L.cw * 0.15, W - L.cw * 0.85 - 4);
      const ty = clamp(p.y, measureArea().y - L.ch * 0.1, H - L.ch * 0.85 - 4);
      if (tx !== p.x || ty !== p.y) tweenPiece(p, tx, ty, 0.25, ease.out);
    }
  },
});

function snap(p) {
  p.placed = true;
  state.placed++;
  state.idle = 0;
  if (state.glowFor === p) hideGlow();
  const my = token;
  tweenPiece(p, p.hx, p.hy, 0.12, ease.out, () => {
    if (my !== token) return;
    drawPiece(p, false);
    p.el.style.zIndex = '2';
    p.el.classList.add('placed');
    replayClass(p.cv, 'snap-pop');
    snapSound(state.placed);
    const L = state.L;
    const cx = p.hx + L.cw / 2;
    const cy = p.hy + L.ch / 2;
    fx.sparkles(cx, cy, 8, L.m * 0.35);
    fx.ring(cx, cy, '#fff3a6');
    if (state.placed === state.n) finish();
  });
}

async function finish() {
  if (state.done) return;
  state.done = true;
  const my = token;
  const entry = state.entry;
  hideGlow();
  const d = store.data.done[entry.key] || (store.data.done[entry.key] = {});
  d[state.n] = 1;
  store.persist();
  await wait(380);
  if (my !== token) return;
  // the seams melt away...
  $('#full').classList.add('show');
  board.classList.add('finished');
  sfx.sparkle();
  await wait(520);
  if (my !== token) return;
  state.pieces.forEach((p) => { p.el.style.visibility = 'hidden'; });
  // ...and the picture does a happy wiggle
  replayClass(board, 'happy');
  celebrate(pickOne(BANNERS), entry.name);
  say(`${pickOne(PRAISE)} ${entry.name}!`);
  const r = board.getBoundingClientRect();
  fx.sparkles(r.left + r.width / 2, r.top + r.height / 2, 14, Math.min(r.width, 300) * 0.5);
  // a sticker for the sticker book (always one for a big 16-piece puzzle)
  earnSticker('jigsaw', state.n >= 16 ? { cooldown: 0 } : {});
  await wait(2600);
  if (my !== token) return;
  showDone();
}

function showDone() {
  const entry = state.entry;
  $('#done-thumb').innerHTML = thumbHTML(entry, 'dn');
  $('#done-thumb').classList.toggle('art-thumb', entry.kind === 'art');
  const d = doneFor(entry);
  $('#done-name').innerHTML = `<span class="done-title">${esc(entry.name)}</span>` +
    `<span class="done-stars">${SIZES.map((s) => `<i class="${d[s.n] ? 'on' : ''}">★</i>`).join('')}</span>`;
  $('#done-title').textContent = pickOne(['You did it!', 'Hooray!', 'Puzzle done!', 'Great job!']);
  showScreen('screen-done');
}

function nextPuzzle() {
  const list = galleryList.length ? galleryList : entriesFor('all');
  const i = list.findIndex((e) => e.key === state.entry.key);
  startPuzzle(list[(i + 1) % list.length], state.n);
}

function surprise() {
  store.data.tab = 'all';
  galleryList = entriesFor('all');
  startPuzzle(pickOne(galleryList), store.data.size || 4);
}

function hint(auto) {
  if (!state.ready || state.done) return;
  const loose = state.pieces.filter((p) => !p.placed && !isDragged(p));
  if (!loose.length) return;
  const now = Date.now();
  // asking again for the same piece: it hops into place by itself
  if (!auto && state.hintPiece && loose.indexOf(state.hintPiece) >= 0 && now - state.hintAt < 4000) {
    const p = state.hintPiece;
    state.hintPiece = null;
    toFront(p);
    sfx.whoosh();
    p.placed = true; // can't be grabbed while it flies
    const my = token;
    tweenPiece(p, p.hx, p.hy, 0.6, ease.inOut, () => {
      if (my !== token) return;
      p.placed = false;
      snap(p);
    });
    return;
  }
  const p = loose.sort((a, b) => b.z - a.z)[0];
  state.hintPiece = p;
  state.hintAt = now;
  toFront(p);
  replayClass(p.cv, 'wiggle');
  showGlow(p, true);
  if (!auto) sfx.sparkle();
  const L = state.L;
  fx.sparkles(p.hx + L.cw / 2, p.hy + L.ch / 2, 6, L.m * 0.3);
  const my = token;
  setTimeout(() => {
    if (my === token && state.glowFor === p && !isDragged(p)) hideGlow();
  }, 2200);
}

function onFrame(dt) {
  if (!state.pieces || play.classList.contains('hidden')) return;
  for (const p of state.pieces) {
    const tw = p.tw;
    if (!tw) continue;
    tw.t = Math.min(1, tw.t + dt / tw.dur);
    const k = tw.fn(tw.t);
    p.x = tw.fx + (tw.tx - tw.fx) * k;
    p.y = tw.fy + (tw.ty - tw.fy) * k;
    place(p);
    if (tw.t >= 1) {
      p.tw = null;
      if (tw.done) tw.done();
    }
  }
  // a gentle nudge if nothing has happened for a while
  if (state.ready && !state.done && !state.drags.size && currentScreen() === null) {
    state.idle += dt;
    if (state.idle > 18) { state.idle = 0; hint(true); }
  }
}

function leavePuzzle() {
  hidePlay();
  openGallery();
}

boot({
  party: ['#ffb03b', '#ff6fb5', '#8f6bff'],
  onAction(action, el) {
    switch (action) {
      case 'gallery': openGallery(el.dataset.tab); if (el.dataset.tab === 'mine') say('My pictures!'); break;
      case 'home': hidePlay(); updateTitle(); showScreen('screen-title'); break;
      case 'size-close': showScreen('screen-gallery'); break;
      case 'surprise': surprise(); break;
      case 'back': leavePuzzle(); break;
      case 'hint': hint(false); break;
      case 'next': nextPuzzle(); break;
      case 'pictures': leavePuzzle(); break;
      case 'go-color': window.location.href = '../coloring/'; break;
      case 'go-spin': window.location.href = '../spinart/'; break;
      case 'go-monster': window.location.href = '../monster/'; break;
    }
  },
  onBack(screen) {
    if (screen === null) { leavePuzzle(); return true; }
    if (screen === 'screen-size') { showScreen('screen-gallery'); return true; }
    if (screen === 'screen-done') { leavePuzzle(); return true; }
    if (screen === 'screen-gallery') { updateTitle(); showScreen('screen-title'); return true; }
    return false;
  },
  onFrame,
  onResize() {
    if (!play.classList.contains('hidden') && state.L && state.bitmap) {
      state.drags.forEach((d) => d.p.el.classList.remove('lifted'));
      state.drags = new Map();
      hideGlow();
      layout(true);
    }
  },
});

installDefs();
$('#hero').innerHTML = heroMarkup();
updateTitle();

// for automated tests
window.__jigsaw = {
  get state() { return state; },
  store,
  startPuzzle: (id, n, mine) => {
    const list = entriesFor(mine ? 'mine' : 'all');
    const e = list.find((x) => (x.kind === 'art' ? x.item.id === id : x.pic.id === id)) || list[0];
    galleryList = list;
    return startPuzzle(e, n);
  },
  solveAllBut(k) {
    state.pieces.filter((p) => !p.placed).slice(k || 0).forEach((p) => { p.x = p.hx; p.y = p.hy; place(p); snap(p); });
  },
};
