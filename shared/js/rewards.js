// The sticker book: finishing things in any game earns a sticker for the album
// on the home screen. The stickers are the same art as the Sticker Scene game.
//
//   earnSticker('memory')          call when a kid finishes something (a level, a
//                                  picture, a puzzle). Shows a "New sticker!" pop-up and
//                                  returns the sticker, or null if none was given (the
//                                  game earned one less than a minute ago, or stickers
//                                  are turned off in the grown-up corner).
//   earnSticker('memory', { cooldown: 0 })   always give one (for big wins)
//   stickerHTML(sticker, cls)       the sticker's picture as HTML (an <img> or an emoji)
//   album()                         { have: { id: count }, order: [ids] }
//   STICKERS, CATS                  every sticker that can be earned, and the album pages
//
// No side effects on import, and it does not need the kit, so every page can use it.
import * as sfx from './audio.js';
import { say } from './speech.js';
import { createStore } from './store.js';
import { grownups } from './grownups.js';
import { STICKERS, CATS } from '../../stickers/js/art.js';

export { STICKERS, CATS };

const book = createStore('stickerbook', { have: {}, order: [], last: {} });

export function album() {
  book.reload();
  return book.data;
}

const uri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

/** The sticker's picture as HTML. */
export function stickerHTML(s, cls = '') {
  if (s.svg) return `<img class="${cls}" src="${uri(s.svg)}" alt="${s.name}" draggable="false">`;
  return `<span class="${cls} kg-emoji" role="img" aria-label="${s.name}">${s.emoji}</span>`;
}

const CSS = `
.kg-toast { position: fixed; left: 50%; top: calc(14px + env(safe-area-inset-top, 0px)); z-index: 800;
  display: flex; align-items: center; padding: 10px 22px 10px 12px; border-radius: 999px;
  background: linear-gradient(180deg, #fffbe6, #ffe9a8); border: 4px solid #fff; color: #6b3200;
  box-shadow: 0 10px 0 rgba(201, 138, 0, .45), 0 16px 30px rgba(40, 10, 90, .35);
  font-family: Fredoka, ui-rounded, system-ui, sans-serif; pointer-events: none;
  -webkit-transform: translate(-50%, -160%); transform: translate(-50%, -160%);
  -webkit-animation: kg-toast 3.2s cubic-bezier(.2, 1.4, .4, 1) both; animation: kg-toast 3.2s cubic-bezier(.2, 1.4, .4, 1) both; }
.kg-toast .kg-art { width: 64px; height: 64px; margin-right: 12px; display: block;
  -webkit-animation: kg-spin-in .7s cubic-bezier(.2, 1.8, .4, 1) .25s both; animation: kg-spin-in .7s cubic-bezier(.2, 1.8, .4, 1) .25s both;
  -webkit-filter: drop-shadow(0 3px 2px rgba(0,0,0,.2)); filter: drop-shadow(0 3px 2px rgba(0,0,0,.2)); }
.kg-toast .kg-emoji.kg-art { font-size: 50px; line-height: 64px; text-align: center; }
.kg-toast b { display: block; font-size: 22px; line-height: 1.1; color: #ff6a00; }
.kg-toast span.kg-name { font-size: 18px; font-weight: 600; }
@-webkit-keyframes kg-toast { 0% { -webkit-transform: translate(-50%, -160%); } 12%, 82% { -webkit-transform: translate(-50%, 0); } 100% { -webkit-transform: translate(-50%, -160%); } }
@keyframes kg-toast { 0% { transform: translate(-50%, -160%); } 12%, 82% { transform: translate(-50%, 0); } 100% { transform: translate(-50%, -160%); } }
@-webkit-keyframes kg-spin-in { from { -webkit-transform: scale(0) rotate(-200deg); } }
@keyframes kg-spin-in { from { transform: scale(0) rotate(-200deg); } }
`;
let styled = false;
function style() {
  if (styled) return;
  styled = true;
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
}

let toastEl = null;
function showToast(s, fresh) {
  style();
  if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
  toastEl = document.createElement('div');
  toastEl.className = 'kg-toast';
  toastEl.setAttribute('role', 'status');
  toastEl.innerHTML = `${stickerHTML(s, 'kg-art')}<div><b>${fresh ? 'New sticker!' : 'Another sticker!'}</b><span class="kg-name">${s.name}</span></div>`;
  document.body.appendChild(toastEl);
  const el = toastEl;
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 3400);
}

/**
 * Give the kid a sticker for finishing something in `game`.
 * New stickers come first; once the album is full, stickers repeat (counted in the album).
 */
export function earnSticker(game, opts = {}) {
  if (grownups.data.stickers === false) return null;
  book.reload();
  const now = Date.now();
  const cooldown = opts.cooldown == null ? 45 : opts.cooldown;
  const last = book.data.last[game] || 0;
  if (now - last < cooldown * 1000) return null;
  const missing = STICKERS.filter((s) => !book.data.have[s.id]);
  const pool = missing.length ? missing : STICKERS;
  const s = pool[Math.floor(Math.random() * pool.length)];
  const fresh = !book.data.have[s.id];
  book.data.have[s.id] = (book.data.have[s.id] || 0) + 1;
  book.data.order.push(s.id);
  if (book.data.order.length > 400) book.data.order = book.data.order.slice(-400);
  book.data.last[game] = now;
  book.persistNow();
  // after the game's own cheer has had a moment
  setTimeout(() => {
    showToast(s, fresh);
    sfx.chime([0, 7, 12, 16, 19], 784, 0.06);
    say(fresh ? `A new sticker! ${s.name}!` : `Another ${s.name}!`, { queue: true });
  }, opts.delay == null ? 900 : opts.delay);
  return s;
}

/** Empty the album (from the grown-up corner). */
export function resetAlbum() {
  book.data.have = {};
  book.data.order = [];
  book.data.last = {};
  book.persistNow();
}
