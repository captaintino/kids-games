// The gallery wall: the kid's hung-up paintings (and their coloring pictures),
// framed in different frames on a cozy wall with a picture rail.
import { listArt } from '../../shared/js/gallery.js';

// frame looks: wood, candy stripes, a round pink one, gold, an oval and a mint one
export const FRAMES = ['wood', 'candy', 'round', 'gold', 'oval', 'mint'];

function hash(s) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
/** Each picture always gets the same frame and the same little tilt. */
export function frameOf(item) {
  const h = hash(item.id);
  return { style: FRAMES[h % FRAMES.length], tilt: ((h >> 4) % 7) - 3 };
}

/** Everything that hangs on the wall, newest first. */
export function wallItems() {
  return listArt('spinart').concat(listArt('coloring')).sort((a, b) => b.t - a.t);
}

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/** Size of a frame's picture area for an item that is `w` wide. */
export function frameBox(item, style, w) {
  if (style === 'round') return { w, h: w };
  if (style === 'oval') return { w, h: w * 1.22 };
  const a = item.h && item.w ? item.h / item.w : 1;
  return { w, h: w * Math.max(0.72, Math.min(1.3, a)) };
}

/** The framed picture (used on the wall and, bigger, in the viewer). */
export function frameHTML(item, style, w, extra) {
  const b = frameBox(item, style, w);
  const fit = style === 'round' || style === 'oval' ? 'cover' : 'contain';
  return `<span class="frame f-${style}"${extra || ''}><span class="mat" style="width:${b.w.toFixed(0)}px;height:${b.h.toFixed(0)}px">` +
    `<img src="${item.img}" alt="" draggable="false" style="object-fit:${fit}"></span></span>`;
}

/** Build the wall for the given width. Returns the number of pictures. */
export function buildWall(el, width) {
  const items = wallItems();
  if (!items.length) {
    el.innerHTML = `<div class="gal-row gal-empty"><div class="rail"></div>` +
      `<div class="gal-cells"><div class="gal-cell">${cord()}` +
      `<span class="frame f-wood empty-frame"><span class="mat"><span class="empty-ico">🎨</span></span></span>` +
      `<div class="plate">Your painting here!</div>` +
      `<button class="btn btn-pink btn-small gal-paint" data-action="gal-paint"><span class="btn-icon">🖌️</span> Let's paint!</button>` +
      `</div></div></div>`;
    return 0;
  }
  const cols = width < 520 ? 2 : width < 760 ? 3 : 4;
  const cell = Math.floor((width - 8) / cols);
  const fw = Math.round(Math.min(cell * 0.7, 260));
  let html = '';
  for (let r = 0; r * cols < items.length; r++) {
    html += '<div class="gal-row"><div class="rail"></div><div class="gal-cells">';
    items.slice(r * cols, r * cols + cols).forEach((it, i) => {
      const fr = frameOf(it);
      const icon = it.game === 'coloring' ? '🖍️ ' : '';
      html += `<div class="gal-cell" style="width:${cell}px">${cord()}` +
        `<button class="gal-pic" data-action="gal-open" data-id="${esc(it.id)}" aria-label="${esc(it.title)}" ` +
        `style="-webkit-transform:rotate(${fr.tilt}deg);transform:rotate(${fr.tilt}deg);animation-delay:${((r * cols + i) * 0.05).toFixed(2)}s">` +
        `${frameHTML(it, fr.style, fw)}</button>` +
        `<div class="plate">${icon}${esc(it.title)}</div></div>`;
    });
    html += '</div></div>';
  }
  el.innerHTML = html;
  return items.length;
}

function cord() {
  return '<svg class="cord" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">' +
    '<path d="M22 40L50 5L78 40" fill="none" stroke="#7a5230" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<circle cx="50" cy="5" r="4.5" fill="#ffd36b" stroke="#7a5230" stroke-width="2"/></svg>';
}
