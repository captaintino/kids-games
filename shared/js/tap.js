// Buttons that work however long a kid presses them.
//
// Little kids often hold a button down for a second or two, or wiggle their finger while
// pressing. Browsers then drop the click: iOS waits to see if it's a long press, Android
// turns it into a "context menu" press, and a finger that slides a few pixels counts as a
// scroll attempt. So for touches on buttons (and other tappable things) that were held or
// wiggled, we press the button ourselves when the finger lifts, as long as it lifts on
// the same button and nothing scrolled. Quick, clean taps are left to the browser.
//
// It also stops pinch-zooming (and Safari's two-finger zoom gestures) everywhere: the
// viewport tag asks for no zoom, but iPads ignore that.
//
// Importing this module installs it once; every page loads it (through grownups.js).

const TAPPABLE = 'button, a[href], label, [data-action], [role="button"], input[type="checkbox"], input[type="radio"]';
const SKIP = 'input[type="range"], input[type="text"], textarea, select, [data-no-tap-fix]';
const LONG_MS = 250; // shorter presses are left to the browser
const WIGGLE_PX = 6; // as are presses that didn't move

let press = null;

function tappableAt(target) {
  if (!target || !target.closest) return null;
  if (target.closest(SKIP)) return null;
  const el = target.closest(TAPPABLE);
  if (!el || el.disabled) return null;
  return el;
}

function onStart(e) {
  if (e.touches.length > 1) { press = null; return; }
  const t = e.changedTouches[0];
  const el = tappableAt(e.target);
  press = el ? { el, id: t.identifier, x: t.clientX, y: t.clientY, t0: Date.now(), moved: false, scrolled: false } : null;
}

function onMove(e) {
  if (!press) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (t.identifier !== press.id) continue;
    if (Math.abs(t.clientX - press.x) > WIGGLE_PX || Math.abs(t.clientY - press.y) > WIGGLE_PX) press.moved = true;
  }
}

function onEnd(e) {
  const p = press;
  press = null;
  if (!p || p.scrolled) return;
  let t = null;
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === p.id) t = e.changedTouches[i];
  }
  if (!t) return;
  const held = Date.now() - p.t0 >= LONG_MS;
  if (!held && !p.moved) return; // a clean quick tap: the browser's own click is reliable
  // the finger has to lift on the same button (sliding off is how kids "cancel")
  const r = p.el.getBoundingClientRect();
  const pad = 10;
  if (t.clientX < r.left - pad || t.clientX > r.right + pad || t.clientY < r.top - pad || t.clientY > r.bottom + pad) return;
  if (!document.documentElement.contains(p.el) || p.el.disabled) return;
  // stop the browser's own click (if it was going to send one) and send exactly one ourselves
  if (e.cancelable) e.preventDefault();
  p.el.click();
}

function onScroll() {
  if (press) press.scrolled = true;
}

if (!window.__tapFix && 'ontouchstart' in window) {
  window.__tapFix = true;
  document.addEventListener('touchstart', onStart, { capture: true, passive: true });
  document.addEventListener('touchmove', onMove, { capture: true, passive: true });
  document.addEventListener('touchend', onEnd, { capture: true, passive: false });
  document.addEventListener('touchcancel', () => { press = null; }, true);
  document.addEventListener('scroll', onScroll, true);
  // a long press must not open the browser's menu (that would also cancel the press)
  document.addEventListener('contextmenu', (e) => {
    if (tappableAt(e.target)) e.preventDefault();
  }, true);
}

// No zooming. iOS Safari ignores user-scalable=no, so cancel its pinch gestures and any
// two-finger move; touch handlers still get their events, only the zoom is stopped.
if (!window.__noZoom) {
  window.__noZoom = true;
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) => {
    document.addEventListener(t, (e) => e.preventDefault(), { passive: false });
  });
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1 || (typeof e.scale === 'number' && e.scale !== 1)) {
      if (e.cancelable) e.preventDefault();
    }
  }, { capture: true, passive: false });
  // trackpad pinch (and ctrl + mouse wheel) in desktop browsers
  document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
}
