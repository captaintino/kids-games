// The grown-up corner: settings a parent sets once, kept on the device.
//
//   startGrownups()          call once per page: applies the volumes and starts the
//                            daily play-time limit (the kit's boot() does this for you)
//   grownups.data            { name, volume, voice, limit, hidden, stickers }
//   saveGrownups()           after changing grownups.data (re-applies the volumes)
//   kidName()                the kid's name, or '' if none was set
//   isHidden(gameId)         a game the grown-up hid from the home screen
//   playedToday()            minutes played today
//   holdGate(el, onOpen)     a button that only works when held for 3 seconds
//
// No side effects until startGrownups(), so any page can import it.
import './tap.js'; // buttons that work however long they're pressed
import * as sfx from './audio.js';
import { setSpeechVolume, say, stopSpeech } from './speech.js';
import { createStore } from './store.js';

export const grownups = createStore('grownups', {
  name: '',        // the kid's name (used by Letter Tracing and in some cheers)
  volume: 1,       // sounds, 0 to 1
  voice: 1,        // spoken words, 0 (off) to 1
  limit: 0,        // minutes of play per day, 0 = no limit
  hidden: [],      // game ids hidden from the home screen
  stickers: true,  // earn stickers for the sticker book
  lowPerf: false,  // low-performance mode: no decorative animations (loops and entrances)
});
if (!Array.isArray(grownups.data.hidden)) grownups.data.hidden = [];

// Low-performance mode: stops the decorative CSS animations: looping ones (button shine,
// wobbling and bobbing buttons, tiles, mascots and titles) and entrances (menu items and
// cards popping or sliding in, stars flying in, banners). Every stylesheet rule with an
// animation is copied under html.low-perf with the animation turned off, except:
// - cues that tell a kid what to do (a pulsing hint, the next note, edit-mode jiggle)
// - quick reactions to the kid's own taps (a button's bounce, a monster's chomp), so they
//   can still see that something happened.
// Screens also switch instantly instead of cross-fading.
const CUES = /\.(hint|nudge|ready|cur|now|playing|hot|editing|new|start-ring|slot-glow|share-pointer|hint-flick)\b/;
const REACTIONS = /\.(bounce|bump|wiggle|wiggle-s|shake|wrong|burp|chomp|giggle|happy|poof|pop-bar|pop-l|snap-pop|squash|talk|dance|dancing|sing|shudder|rumble|clunk|beam|turn)\b/;
let lowPerfCss = null;
function collectAnimated(rules, out) {
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (r.cssRules && !r.selectorText) { collectAnimated(r.cssRules, out); continue; }
    if (!r.selectorText || !r.style) continue;
    const name = r.style.animationName || r.style.webkitAnimationName || '';
    if (!name || name === 'none' || name === 'initial') continue;
    r.selectorText.split(',').forEach((sel) => {
      sel = sel.trim();
      if (sel && !CUES.test(sel) && !REACTIONS.test(sel)) out.push(`html.low-perf ${sel}`);
    });
  }
}
function buildLowPerfCss() {
  const sels = [];
  for (let i = 0; i < document.styleSheets.length; i++) {
    let rules = null;
    try { rules = document.styleSheets[i].cssRules; } catch (e) { rules = null; } // not loaded yet
    if (rules) collectAnimated(rules, sels);
  }
  if (!lowPerfCss) {
    lowPerfCss = document.createElement('style');
    lowPerfCss.id = 'low-perf-css';
    document.head.appendChild(lowPerfCss);
  }
  // screens switch instantly instead of cross-fading
  const screens = 'html.low-perf .screen, html.low-perf .screen.active { -webkit-transition: none !important; transition: none !important; }';
  lowPerfCss.textContent = (sels.length
    ? `${sels.join(',\n')} { -webkit-animation: none !important; animation: none !important; }\n`
    : '') + screens;
}
function applyLowPerf() {
  const on = !!grownups.data.lowPerf;
  const root = document.documentElement;
  if (on) {
    buildLowPerfCss();
    root.classList.add('low-perf');
  } else {
    root.classList.remove('low-perf');
  }
}
applyLowPerf();
// stylesheets may still be loading when this runs: look again once everything has loaded
window.addEventListener('load', () => { if (grownups.data.lowPerf) buildLowPerfCss(); });

const time = createStore('playtime', { day: '', secs: 0, bonus: 0 });

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function rollDay() {
  if (time.data.day !== today()) {
    time.data.day = today();
    time.data.secs = 0;
    time.data.bonus = 0;
  }
}

export function kidName() { return String(grownups.data.name || '').trim(); }
export function isHidden(id) { return grownups.data.hidden.indexOf(id) >= 0; }
export function playedToday() {
  time.reload();
  rollDay();
  return Math.floor(time.data.secs / 60);
}

function apply() {
  sfx.setVolume(grownups.data.volume == null ? 1 : +grownups.data.volume);
  setSpeechVolume(grownups.data.voice == null ? 1 : +grownups.data.voice);
}

export function saveGrownups() {
  grownups.persistNow();
  apply();
  applyLowPerf();
  checkLimit();
}

// ---------------------------------------------------------------------------
// Styles (injected, so pages without kit.css get them too)
// ---------------------------------------------------------------------------
const CSS = `
.kg-hold { position: relative; }
.kg-hold .kg-ring { position: absolute; top: -6px; left: -6px; width: calc(100% + 12px); height: calc(100% + 12px);
  pointer-events: none; transform: rotate(-90deg); }
.kg-hold .kg-ring circle { fill: none; stroke: #ffe34d; stroke-width: 6; stroke-linecap: round;
  stroke-dasharray: 302; stroke-dashoffset: 302; }
.kg-hold.kg-holding .kg-ring circle { transition: stroke-dashoffset 3s linear; stroke-dashoffset: 0; }
.kg-break { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 900; display: flex; align-items: center;
  justify-content: center; flex-direction: column; text-align: center; padding: 24px;
  background: radial-gradient(circle at 50% 30%, #3b2f8f, #120b3a 75%); color: #fff;
  font-family: Fredoka, ui-rounded, system-ui, sans-serif; -webkit-user-select: none; user-select: none; }
.kg-break .kg-moon { font-size: 110px; line-height: 1; animation: kg-rock 3s ease-in-out infinite; }
.kg-break h2 { margin: 18px 0 6px; font-size: 44px; text-shadow: 0 4px 0 #6b3dff; }
.kg-break p { margin: 0 0 26px; font-size: 22px; opacity: .9; }
.kg-break .kg-stars span { position: absolute; color: #fff7b0; animation: kg-twinkle 2.4s ease-in-out infinite; }
.kg-gate-btn { font-family: inherit; font-size: 18px; font-weight: 600; color: #fff; padding: 12px 20px; border-radius: 999px;
  border: 3px solid rgba(255,255,255,.7); background: rgba(255,255,255,.12); }
.kg-break .kg-more { display: none; margin-top: 18px; }
.kg-break.kg-open .kg-more { display: block; }
.kg-break .kg-more button { font-family: inherit; font-size: 20px; font-weight: 700; color: #fff; margin: 6px; padding: 12px 22px;
  border-radius: 999px; border: 3px solid #fff; background: linear-gradient(180deg, #a6ff7a, #23c95a); }
@keyframes kg-rock { 50% { transform: rotate(-8deg) translateY(-6px); } }
@keyframes kg-twinkle { 50% { opacity: .2; } }
`;
let styled = false;
export function injectGrownupStyles() {
  if (styled) return;
  styled = true;
  const st = document.createElement('style');
  st.id = 'kg-grownups-style';
  st.textContent = CSS;
  document.head.appendChild(st);
}

// ---------------------------------------------------------------------------
// Hold-to-open button: little fingers tap, grown-ups hold for 3 seconds.
// ---------------------------------------------------------------------------
export function holdGate(el, onOpen, ms = 3000) {
  injectGrownupStyles();
  el.classList.add('kg-hold');
  if (!el.querySelector('.kg-ring')) {
    el.insertAdjacentHTML('beforeend',
      '<svg class="kg-ring" viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="48"/></svg>');
  }
  let timer = 0;
  const start = (e) => {
    if (e && e.cancelable) e.preventDefault();
    clearTimeout(timer);
    el.classList.add('kg-holding');
    timer = setTimeout(() => {
      el.classList.remove('kg-holding');
      sfx.chime([0, 4, 7, 12], 660, 0.06);
      onOpen();
    }, ms);
  };
  const stop = () => { clearTimeout(timer); el.classList.remove('kg-holding'); };
  if (window.PointerEvent) {
    el.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => el.addEventListener(t, stop));
  } else {
    el.addEventListener('touchstart', start, { passive: false });
    ['touchend', 'touchcancel'].forEach((t) => el.addEventListener(t, stop));
    el.addEventListener('mousedown', start);
    ['mouseup', 'mouseleave'].forEach((t) => el.addEventListener(t, stop));
  }
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  // a quick tap does nothing (but tell the kid why)
  el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
}

// ---------------------------------------------------------------------------
// Daily play limit
// ---------------------------------------------------------------------------
let lastInput = Date.now();
let breakEl = null;
let started = false;

function overLimit() {
  const lim = +grownups.data.limit || 0;
  if (!lim) return false;
  rollDay();
  return time.data.secs >= (lim + (+time.data.bonus || 0)) * 60;
}

function showBreak() {
  if (breakEl) return;
  injectGrownupStyles();
  breakEl = document.createElement('div');
  breakEl.className = 'kg-break';
  let stars = '';
  for (let i = 0; i < 14; i++) {
    stars += `<span style="left:${Math.round(Math.random() * 96)}%;top:${Math.round(Math.random() * 90)}%;` +
      `font-size:${12 + Math.round(Math.random() * 16)}px;animation-delay:${(Math.random() * 2.4).toFixed(2)}s">★</span>`;
  }
  breakEl.innerHTML = `<div class="kg-stars">${stars}</div>
    <div class="kg-moon">🌙</div>
    <h2>Time for a break!</h2>
    <p>Great playing today. See you later!</p>
    <button class="kg-gate-btn" type="button">🔒 Grown-ups: hold 3 seconds</button>
    <div class="kg-more">
      <button type="button" data-more="15">+15 minutes</button>
      <button type="button" data-more="30">+30 minutes</button>
    </div>`;
  document.body.appendChild(breakEl);
  holdGate(breakEl.querySelector('.kg-gate-btn'), () => breakEl.classList.add('kg-open'));
  breakEl.querySelector('.kg-more').addEventListener('click', (e) => {
    const b = e.target.closest('[data-more]');
    if (!b) return;
    time.reload();
    rollDay();
    time.data.bonus = (+time.data.bonus || 0) + (+b.dataset.more);
    time.persistNow();
    hideBreak();
  });
  sfx.suspend();
  stopSpeech();
  setTimeout(() => { sfx.resume(); sfx.chime([12, 7, 4, 0], 523, 0.25); say('Time for a break! See you later!'); }, 300);
}

function hideBreak() {
  if (!breakEl) return;
  breakEl.parentNode.removeChild(breakEl);
  breakEl = null;
  sfx.resume();
}

function checkLimit() {
  if (overLimit()) showBreak();
  else hideBreak();
}

function tick() {
  if (document.hidden) return;
  time.reload();
  rollDay();
  // only count time someone is actually playing (touched in the last 90 seconds)
  if (Date.now() - lastInput < 90000 && !breakEl) {
    time.data.secs += 5;
    time.persistNow();
  }
  checkLimit();
}

/** Apply the grown-up settings on this page and start the play-time limit. */
export function startGrownups() {
  if (started) return;
  started = true;
  apply();
  ['pointerdown', 'touchstart', 'mousedown', 'keydown'].forEach((t) => {
    window.addEventListener(t, () => { lastInput = Date.now(); }, { capture: true, passive: true });
  });
  // another tab or page changed the settings
  window.addEventListener('storage', (e) => {
    if (e.key === 'kids-games.grownups') { grownups.reload(); apply(); checkLimit(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { grownups.reload(); apply(); checkLimit(); }
  });
  setInterval(tick, 5000);
  checkLimit();
}
