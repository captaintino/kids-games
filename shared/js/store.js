// Saving small things on the device (localStorage), shared by every game.
//
//   const store = createStore('memory', { best: 0 });
//   store.data.best = 3; store.persist();
//
// Saved under "kids-games.<name>". If storage is blocked or full, games keep
// working; they just don't remember. This file has no side effects, so any page
// (including Bubble Pop and Coloring, which don't use the kit) can import it.
export function createStore(name, defaults) {
  const key = `kids-games.${name}`;
  let data = JSON.parse(JSON.stringify(defaults));
  try {
    const s = JSON.parse(localStorage.getItem(key));
    if (s && typeof s === 'object') data = Object.assign(data, s);
  } catch (err) { /* storage blocked: play without saving */ }
  let timer = 0;
  const store = {
    data,
    /** Save now. Returns false if the browser refused (e.g. storage full). */
    persistNow() {
      clearTimeout(timer);
      try { localStorage.setItem(key, JSON.stringify(store.data)); return true; } catch (err) { return false; }
    },
    persist() {
      clearTimeout(timer);
      timer = setTimeout(store.persistNow, 250);
    },
    /** Read again from storage (another game may have changed it). */
    reload() {
      try {
        const s = JSON.parse(localStorage.getItem(key));
        if (s && typeof s === 'object') Object.assign(store.data, s);
      } catch (err) { /* ignore */ }
    },
  };
  window.addEventListener('pagehide', () => { if (timer) store.persistNow(); });
  return store;
}
