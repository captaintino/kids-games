// Feed me! Drag food from the tray to the monster. Its own mouth opens wide as the
// food comes near, it chomps (crumbs fly), its tummy grows and it says "Yum!".
// Broccoli gets a silly face and bounces back. After five foods: a big burp and a
// happy dance.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import { $, fx, onPointer, replayClass, pickOne, rand, shuffle, unit, celebrate } from '../../shared/js/kit.js';
import { earnSticker } from '../../shared/js/rewards.js';
import { FOODS, foodSvg } from '../../shared/js/food.js';
import { BODIES, monsterSVG, mouthSpot, eyeSpot } from './parts.js';
import { setPose, restPose, dancePose } from './moves.js';
import { rigMonster } from './rig.js';

const GOAL = 5;          // foods until the monster is full
const SLOTS = 6;
const YUCK = 'broccoli';
const TASTY = Object.keys(FOODS).filter((k) => k !== YUCK);
const YUM = ['Yum!', 'Yummy!', 'Mmm!', 'Delicious!', 'Nom nom nom!', 'Tasty!'];
const BLEH = ['Bleh! No broccoli!', 'Yucky broccoli!', 'Eww! Broccoli!', 'No thank you!'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function createFeed(env) {
  const root = $('#feed');
  const monBox = $('#feed-mon');
  let m = null;
  let R = null;            // the monster's parts
  let svg = null;
  let open = false;
  let state = 'idle';      // idle, eating, yuck, full, done
  let pieces = [];
  let slots = [];
  let pieceSize = 80;
  let drag = null;
  let tummy = 0;
  let tummyK = 0;          // shown fullness, eases toward tummy / GOAL
  let mouth = 0;           // how wide the mouth is open, 0..1
  let timers = [];
  let zTop = 10;
  let eaten = [];
  let lastBar = -1;
  const T = { now: 0, chomp: -9, happy: -9, yuck: -9, burp: -9, blink: -9, nextBlink: 2, tickle: -9, cheer: -9 };

  function setDisplay(el, on) {
    if (!el) return;
    const v = on ? '' : 'none';
    if (el.style.display !== v) el.style.display = v;
  }
  function setAttr(el, k, v) { if (el.getAttribute(k) !== v) el.setAttribute(k, v); }

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  // -------------------------------------------------------------------------
  // Where things are on screen
  // -------------------------------------------------------------------------
  /** A point on the monster's sheet -> screen pixels (plus the scale). */
  function sheet(x, y) {
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const k = Math.min(r.width / vb.width, r.height / vb.height);
    return {
      x: r.left + (r.width - vb.width * k) / 2 + (x - vb.x) * k,
      y: r.top + (r.height - vb.height * k) / 2 + (y - vb.y) * k,
      k,
    };
  }
  const mouthPt = () => { const s = mouthSpot(m); return sheet(s.x, s.y); };

  // -------------------------------------------------------------------------
  // The food tray
  // -------------------------------------------------------------------------
  function layout() {
    if (!open) return;
    const tr = $('#feed-tray').getBoundingClientRect();
    const pad = 12;
    const w = tr.width - pad * 2;
    const h = tr.height - pad * 2;
    let best = null;
    for (let c = 1; c <= SLOTS; c++) {
      const rows = Math.ceil(SLOTS / c);
      const s = Math.min(w / c, h / rows);
      if (!best || s > best.s + 0.5) best = { c, rows, s, cw: w / c, ch: h / rows };
    }
    pieceSize = Math.max(56, Math.min(best.s * 0.84, 120));
    slots = [];
    for (let i = 0; i < SLOTS; i++) {
      const row = Math.floor(i / best.c);
      const col = i % best.c;
      slots.push({
        x: tr.left + pad + (w - best.c * best.cw) / 2 + (col + 0.5) * best.cw,
        y: tr.top + pad + (h - best.rows * best.ch) / 2 + (row + 0.5) * best.ch,
      });
    }
    pieces.forEach((pc) => {
      if (!pc) return;
      pc.el.style.width = pc.el.style.height = `${pieceSize}px`;
      pc.size = pieceSize;
      if (!(drag && drag.pc === pc)) { pc.x = slots[pc.slot].x; pc.y = slots[pc.slot].y; place(pc, 0); }
    });
  }

  function place(pc, ms, easing) {
    pc.el.style.transition = ms ? `transform ${ms}ms ${easing || 'cubic-bezier(.3,1.4,.5,1)'}` : 'none';
    pc.el.style.transform = `translate3d(${(pc.x - pc.size / 2).toFixed(1)}px,${(pc.y - pc.size / 2).toFixed(1)}px,0) ` +
      `rotate(${pc.rot.toFixed(1)}deg) scale(${pc.scale.toFixed(3)})`;
  }
  function home(pc, ms) {
    pc.x = slots[pc.slot].x;
    pc.y = slots[pc.slot].y;
    pc.scale = 1;
    pc.rot = pc.homeRot;
    place(pc, ms);
  }

  function makePiece(slot, key, delay) {
    const el = document.createElement('div');
    el.className = 'piece';
    el.innerHTML = `<div class="pin" style="animation-delay:${(delay || 0).toFixed(2)}s">${foodSvg(key)}</div>`;
    $('#feed-pieces').appendChild(el);
    const pc = { key, slot, el, pin: el.firstChild, size: pieceSize, scale: 1, rot: rand(-10, 10) };
    pc.homeRot = pc.rot;
    el.style.width = el.style.height = `${pieceSize}px`;
    el.style.zIndex = String(++zTop);
    pieces[slot] = pc;
    home(pc, 0);
    return pc;
  }

  function nextFood() {
    const onTray = pieces.filter(Boolean).map((p) => p.key);
    const fresh = TASTY.filter((k) => onTray.indexOf(k) < 0 && eaten.indexOf(k) < 0);
    return pickOne(fresh.length ? fresh : TASTY);
  }

  function fillTray() {
    $('#feed-pieces').innerHTML = '';
    pieces = [];
    const keys = shuffle([YUCK].concat(shuffle(TASTY).slice(0, SLOTS - 1)));
    keys.forEach((k, i) => makePiece(i, k, 0.2 + i * 0.07));
  }

  function pieceAt(x, y) {
    let best = null;
    let bestD = Infinity;
    pieces.forEach((pc) => {
      if (!pc || pc.busy) return;
      const dx = x - pc.x;
      const dy = y - pc.y;
      const d = dx * dx + dy * dy;
      const r = pc.size * 0.62;
      if (d < r * r && d < bestD) { bestD = d; best = pc; }
    });
    return best;
  }

  function buildMeter() {
    let h = '';
    for (let i = 0; i < GOAL; i++) {
      h += `<span class="tm-slot${i < eaten.length ? ' on' : ''}">${i < eaten.length ? foodSvg(eaten[i], 'tm-food') : ''}</span>`;
    }
    $('#tummy').innerHTML = `<span class="tm-ico" aria-hidden="true">😋</span>${h}`;
  }

  // -------------------------------------------------------------------------
  // Dragging
  // -------------------------------------------------------------------------
  onPointer(root, {
    down(p) {
      if (!open || drag || (state !== 'idle' && state !== 'eating' && state !== 'yuck')) return false;
      const pc = pieceAt(p.x, p.y);
      if (!pc) return false;
      const lift = 16 * unit;
      drag = { pc, id: p.id, dx: pc.x - p.x, dy: pc.y - p.y - lift };
      pc.el.classList.add('lifted');
      pc.el.style.zIndex = String(++zTop);
      pc.x = p.x + drag.dx;
      pc.y = p.y + drag.dy;
      pc.scale = 1.15;
      pc.rot = 0;
      place(pc, 120, 'ease-out');
      sfx.pick(pc.slot + 2);
      say(cap(FOODS[pc.key].name) + '!');
      return true;
    },
    move(p) {
      if (!drag || drag.id !== p.id) return;
      const pc = drag.pc;
      pc.x = p.x + drag.dx;
      pc.y = p.y + drag.dy;
      place(pc, 0);
    },
    up(p) {
      if (!drag || drag.id !== p.id) return;
      const pc = drag.pc;
      drag = null;
      pc.el.classList.remove('lifted');
      const mp = mouthPt();
      const d = Math.sqrt(Math.pow(pc.x - mp.x, 2) + Math.pow(pc.y - mp.y, 2));
      if (state === 'idle' && d < mp.k * 135) {
        if (pc.key === YUCK) yuck(pc); else eat(pc);
        return;
      }
      home(pc, 500);
    },
  });

  // -------------------------------------------------------------------------
  // Eating
  // -------------------------------------------------------------------------
  function crunch(i) {
    if (!sfx.ready()) return;
    sfx.noise({ dur: 0.06, vol: 0.3, freq: 1100 + i * 260 + Math.random() * 500 });
    sfx.noise({ dur: 0.04, vol: 0.18, freq: 2600, delay: 0.04 });
    sfx.tone({ type: 'triangle', f0: 180 + i * 20, f1: 110, dur: 0.07, vol: 0.14 });
  }
  function gulp() {
    if (!sfx.ready()) return;
    sfx.tone({ type: 'sine', f0: 300, f1: 120, dur: 0.18, vol: 0.3 });
    sfx.tone({ type: 'sine', f0: 520, f1: 900, dur: 0.1, vol: 0.08, delay: 0.16 });
  }
  function blehSound() {
    if (!sfx.ready()) return;
    // a raspberry: a buzzy wobble going down
    for (let i = 0; i < 6; i++) sfx.tone({ type: 'sawtooth', f0: 170 - i * 8, f1: 120 - i * 8, dur: 0.07, vol: 0.09, delay: i * 0.06 });
    sfx.noise({ dur: 0.4, vol: 0.08, freq: 500 });
  }
  function burpSound() {
    if (!sfx.ready()) return;
    sfx.tone({ type: 'sawtooth', f0: 96, f1: 64, dur: 0.55, vol: 0.24, attack: 0.03 });
    sfx.tone({ type: 'square', f0: 150, f1: 92, dur: 0.42, vol: 0.06, attack: 0.03 });
    for (let i = 0; i < 7; i++) sfx.tone({ type: 'sine', f0: 120 + (i % 2) * 30, f1: 80, dur: 0.06, vol: 0.12, delay: 0.04 + i * 0.065 });
    sfx.noise({ dur: 0.45, vol: 0.1, freq: 380 });
  }

  function eat(pc) {
    state = 'eating';
    const food = FOODS[pc.key];
    const mp = mouthPt();
    pc.busy = true;
    pc.x = mp.x;
    pc.y = mp.y;
    pc.scale = 0.45;
    place(pc, 160, 'ease-in');
    T.chomp = T.now + 0.15;
    later(() => { pc.el.classList.add('gone'); }, 170);
    for (let i = 0; i < 4; i++) {
      later(() => {
        crunch(i);
        const q = mouthPt();
        fx.burst(q.x + rand(-12, 12), q.y + rand(-4, 10), food.color);
      }, 230 + i * 170);
    }
    later(() => {
      gulp();
      tummy++;
      eaten.push(pc.key);
      buildMeter();
      replayClass($('#tummy'), 'bounce');
      T.happy = T.now;
      const q = mouthPt();
      fx.text(q.x, q.y - q.k * 150, pickOne(['Yum!', 'Yummy!', 'Mmm!']), '#fff', 42, 1.1);
      fx.sparkles(q.x, q.y - q.k * 60, 8, 60);
      sfx.chime([0, 4, 7, 12], 660, 0.06);
      say(Math.random() < 0.4 ? `Mmm, ${food.name}!` : pickOne(YUM), { pitch: 1.35 });
      // a new food pops onto the tray
      const slot = pc.slot;
      if (pc.el.parentNode) pc.el.parentNode.removeChild(pc.el);
      pieces[slot] = null;
      if (tummy < GOAL) later(() => { if (open && !pieces[slot]) makePiece(slot, nextFood(), 0); }, 350);
    }, 950);
    later(() => {
      if (tummy >= GOAL) full();
      else state = 'idle';
    }, 1500);
  }

  function yuck(pc) {
    state = 'yuck';
    T.yuck = T.now;
    pc.busy = true;
    blehSound();
    const mp = mouthPt();
    fx.text(mp.x, mp.y - mp.k * 150, 'Bleh!', '#c8ff9e', 44, 1.1);
    say(pickOne(BLEH), { pitch: 1.3 });
    // the broccoli bounces off the monster's face and back to the tray
    pc.rot = pc.homeRot + 360;
    pc.x = mp.x + (slots[pc.slot].x > mp.x ? 1 : -1) * mp.k * 120;
    pc.y = mp.y - mp.k * 90;
    pc.scale = 1;
    place(pc, 280, 'ease-out');
    later(() => {
      pc.rot = pc.homeRot;
      home(pc, 520);
      sfx.boing();
    }, 300);
    later(() => { replayClass(pc.pin, 'wiggle'); pc.busy = false; }, 850);
    later(() => { if (state === 'yuck') state = 'idle'; }, 1500);
  }

  function full() {
    state = 'full';
    $('#feed-tray').classList.add('dim');
    pieces.forEach((pc) => { if (pc) pc.el.classList.add('leave'); });
    later(() => {
      T.burp = T.now;
      burpSound();
      const mp = mouthPt();
      fx.text(mp.x, mp.y - mp.k * 120, 'BURP!', '#d6ffb8', 58, 1.4);
      fx.ring(mp.x, mp.y, '#d6ffb8');
      earnSticker('monster-fed', { delay: 2200 });
    }, 450);
    later(() => {
      T.tickle = T.now;
      env.giggle();
      say('Excuse me! Hee hee!', { pitch: 1.4 });
    }, 1500);
    later(() => {
      celebrate("I'm full!", '');
      say("I'm so full! Let's dance!", { pitch: 1.35, queue: true });
      lastBar = -1;
      env.beat.start(danceDone, 1);
    }, 3000);
  }

  function danceDone() {
    if (!open) return;
    state = 'done';
    T.cheer = T.now;
    root.classList.add('fed');
    sfx.chime([0, 4, 7, 12, 16], 784, 0.08);
    say(pickOne(['Thank you!', 'That was yummy!', 'What a feast!']), { pitch: 1.35 });
  }

  function again() {
    clearTimers();
    env.beat.stop();
    root.classList.remove('fed');
    $('#feed-tray').classList.remove('dim');
    tummy = 0;
    eaten = [];
    state = 'idle';
    buildMeter();
    fillTray();
    sfx.whoosh();
    say(pickOne(["I'm hungry again!", 'More food please!']), { pitch: 1.35 });
  }

  /** Tap the monster: a giggle and a wiggle. */
  function tickle() {
    if (!open || state === 'full') return;
    T.tickle = T.now;
    env.giggle();
    if (state === 'idle') say(pickOne(["I'm hungry!", 'Feed me!', 'Hee hee!']), { pitch: 1.35 });
  }

  // -------------------------------------------------------------------------
  // Every frame: the monster's own face and tummy do the acting
  // -------------------------------------------------------------------------
  function frame(dt, t) {
    if (!open || !R) return;
    T.now = t;
    R.fit(); // follows the stage size (cheap when it has not changed)
    let p;
    const dancing = env.beat.on && state === 'full';
    if (dancing) {
      const b = env.beat.beat();
      p = dancePose(b, R.legs.length);
      const bar = Math.floor(b / 4);
      if (bar !== lastBar) {
        lastBar = bar;
        if (bar > 0) {
          const c = mouthPt();
          fx.sparkles(c.x, c.y - c.k * 80, 8, 100);
          if (bar % 2 === 0) fx.confetti(30);
        }
      }
    } else {
      p = restPose();
      p.sy = 1 + Math.sin(t * 2.4) * 0.012;
      p.sx = 2 - p.sy;
    }
    // blinking
    if (t > T.nextBlink) { T.blink = t; T.nextBlink = t + rand(2.2, 4.5); }
    const kb = t - T.blink;
    if (kb < 0.18) p.eye = 1 - Math.sin((kb / 0.18) * Math.PI) * 0.92;

    let target = 0;
    // food coming near: the eyes follow it and the mouth opens (but not for broccoli!)
    if (drag && state === 'idle') {
      const pc = drag.pc;
      const e = eyeSpot(m);
      const es = sheet(e.x, e.y);
      const dx = pc.x - es.x;
      const dy = pc.y - es.y;
      const dd = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      p.px = (dx / dd) * 8;
      p.py = (dy / dd) * 7;
      const mp = mouthPt();
      const d = Math.sqrt(Math.pow(pc.x - mp.x, 2) + Math.pow(pc.y - mp.y, 2)) / mp.k;
      const near = Math.max(0, Math.min(1, (330 - d) / 230));
      if (pc.key === YUCK) {
        // lean away, look suspicious, keep that mouth shut
        p.torso = -near * 8;
        p.head = -near * 14;
        p.eye = Math.min(p.eye, 1 - near * 0.55);
        p.px = -p.px * 0.5;
      } else {
        target = near;
        p.eye = Math.max(p.eye, 1 + near * 0.12);
        p.armR = -near * 50;
        p.armL = -near * 50;
      }
    }
    // chomp, chomp
    const kc = t - T.chomp;
    if (kc >= 0 && kc < 0.8) {
      target = 0.12 + 0.6 * Math.abs(Math.cos(kc * Math.PI * 5));
      p.head += Math.sin(kc * 31) * 5;
      p.y += -Math.abs(Math.sin(kc * 15)) * 6;
    } else if (kc < 0) {
      target = 1;
    }
    // happy after a bite: a little hop, arms up, squinty smile
    const kh = t - T.happy;
    if (kh < 0.9) {
      const e = 1 - kh / 0.9;
      p.y += -Math.abs(Math.sin(kh * 10)) * 18 * e;
      p.armR = -60 * e;
      p.armL = -60 * e;
      p.eye = Math.min(p.eye, 1 - 0.55 * e);
    }
    // broccoli: a silly face, tongue out, shaking the head no-no
    const ky = t - T.yuck;
    const yuckFace = ky < 1.3;
    if (yuckFace) {
      const e = Math.min(1, (1.3 - ky) * 3);
      p.head = Math.sin(ky * 26) * 14 * e;
      p.torso = Math.sin(ky * 26 + 1) * 4 * e;
      p.eye = Math.min(p.eye, 0.28);
      p.sx *= 1 + Math.sin(ky * 40) * 0.03 * e;
      target = 0;
    }
    // tickle: a wiggle
    const kt = t - T.tickle;
    if (kt < 0.8) {
      const e = 1 - kt / 0.8;
      p.torso += Math.sin(kt * 28) * 8 * e;
      p.armR += Math.sin(kt * 22) * 25 * e;
      p.armL -= Math.sin(kt * 22) * 25 * e;
      p.eye = Math.min(p.eye, 0.5);
    }
    // the big burp: mouth wide, eyes shut, leaning back
    const kb2 = t - T.burp;
    if (kb2 >= 0 && kb2 < 0.9) {
      const e = Math.sin(Math.min(1, kb2 / 0.9) * Math.PI);
      target = Math.max(target, e);
      p.eye = Math.min(p.eye, 1 - e * 0.9);
      p.head -= e * 10;
      p.sy *= 1 + e * 0.06;
    }
    // cheering after the dance
    const kq = t - T.cheer;
    if (kq < 2) {
      p.armR = -40 - Math.sin(kq * 10) * 30;
      p.armL = -40 - Math.sin(kq * 10 + 1) * 30;
    }
    setPose(R, p);

    // the mouth: the drawn one when closed, the big open one when eating
    mouth += (target - mouth) * Math.min(1, dt * 18);
    const showOpen = mouth > 0.08;
    // (only touch the drawing when something changed: each change repaints that layer)
    setDisplay(R.mshut, !showOpen);
    if (R.mopen) {
      setDisplay(R.mopen, showOpen);
      if (showOpen) setAttr(R.mopen, 'transform', `translate(0 -6) scale(${(0.7 + 0.45 * mouth).toFixed(2)} ${(mouth * 1.12).toFixed(2)}) translate(0 6)`);
    }
    setDisplay(R.bleh, yuckFace);

    // the tummy grows with every bite
    tummyK += (tummy / GOAL - tummyK) * Math.min(1, dt * 5);
    const wob = Math.max(0, 0.9 - kh) * Math.sin(kh * 18) * 0.05;
    const k = tummyK + wob;
    if (R.body) setAttr(R.body, 'transform', `scale(${(1 + 0.16 * k).toFixed(3)} ${(1 + 0.06 * k).toFixed(3)})`);
    if (R.belly) {
      const bl = BODIES[m.body].belly;
      setAttr(R.belly, 'transform', `translate(${bl[0]} ${bl[1]}) scale(${(1 + 0.4 * k).toFixed(3)}) translate(${-bl[0]} ${-bl[1]})`);
    }
  }

  // -------------------------------------------------------------------------
  // Open and close
  // -------------------------------------------------------------------------
  function start(monster) {
    m = monster;
    open = true;
    state = 'idle';
    tummy = 0;
    tummyK = 0;
    mouth = 0;
    eaten = [];
    drag = null;
    root.classList.remove('hidden', 'fed');
    $('#feed-tray').classList.remove('dim');
    $('#feed-name').textContent = `👾 ${m.name || 'Hungry monster'}`;
    // cut into layers moved with CSS transforms (rig.js); svg stays as the empty sheet
    R = rigMonster(monBox, monsterSVG(m, { id: 'fd', feed: true }), 'fd');
    svg = R.svg;
    buildMeter();
    layout();
    fillTray();
    T.tickle = T.now;
    say(pickOne(["I'm hungry! Feed me!", 'Feed me, please!', 'My tummy is rumbling!']), { pitch: 1.35 });
  }

  function stop() {
    open = false;
    clearTimers();
    env.beat.stop();
    drag = null;
    root.classList.add('hidden');
    $('#feed-pieces').innerHTML = '';
    pieces = [];
    monBox.innerHTML = '';
    R = null;
  }

  return {
    start, stop, frame, layout, again, tickle,
    get open() { return open; },
    get state() { return state; },
    get tummy() { return tummy; },
    /** for tests: drop a food from the tray straight into the mouth */
    feedOne(key) {
      const pc = pieces.filter((x) => x && !x.busy && (key ? x.key === key : x.key !== YUCK))[0];
      if (!pc || state !== 'idle') return false;
      if (pc.key === YUCK) yuck(pc); else eat(pc);
      return true;
    },
    mouthPt,
    pieces: () => pieces.filter(Boolean).map((p) => ({ key: p.key, x: p.x, y: p.y })),
  };
}
