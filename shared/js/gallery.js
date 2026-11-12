// The art gallery: pictures kids make (spin paintings, butterflies, monsters...)
// saved on the device, so other games can use them (Jigsaw turns them into puzzles).
//
//   addArt(canvas, { game: 'spinart', title: 'Spin painting' })   save a picture; returns its item
//   listArt()                 every saved picture, newest first: [{ id, game, title, img, w, h, t }]
//   listArt('monster')        only one game's pictures
//   removeArt(id)
//
// Pictures are stored as small JPEGs (at most 480 px). Only the newest 24 are kept,
// and older ones are dropped if the device runs out of room.
import { createStore } from './store.js';

const MAX_ITEMS = 24;
const MAX_SIDE = 480;
const store = createStore('gallery', { items: [] });

export function listArt(game) {
  store.reload();
  const items = (store.data.items || []).slice().sort((a, b) => b.t - a.t);
  return game ? items.filter((it) => it.game === game) : items;
}

export function removeArt(id) {
  store.reload();
  store.data.items = store.data.items.filter((it) => it.id !== id);
  store.persistNow();
}

/** Save a canvas (or an <img>) as a picture in the gallery. */
export function addArt(source, { game = 'art', title = 'My picture' } = {}) {
  const sw = source.naturalWidth || source.width;
  const sh = source.naturalHeight || source.height;
  if (!sw || !sh) return null;
  const k = Math.min(1, MAX_SIDE / Math.max(sw, sh));
  const cv = document.createElement('canvas');
  cv.width = Math.round(sw * k);
  cv.height = Math.round(sh * k);
  const c = cv.getContext('2d');
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, cv.width, cv.height);
  c.drawImage(source, 0, 0, cv.width, cv.height);
  let img;
  try { img = cv.toDataURL('image/jpeg', 0.82); } catch (err) { return null; }
  const item = { id: `${game}-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`, game, title, img, w: cv.width, h: cv.height, t: Date.now() };
  store.reload();
  store.data.items.push(item);
  store.data.items.sort((a, b) => a.t - b.t);
  while (store.data.items.length > MAX_ITEMS) store.data.items.shift();
  // out of room: drop the oldest pictures until it fits
  while (!store.persistNow() && store.data.items.length > 1) store.data.items.shift();
  return item;
}
