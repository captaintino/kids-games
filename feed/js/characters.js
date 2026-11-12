// The hungry friends. Each one is drawn on a 400 x 430 sheet and shares one
// face rig (eyes that follow things, blinking, a mouth that opens, happy / yuck /
// sleepy faces), so every friend can make every expression.
import { circle, ellipse, rect, poly, cloud, INK } from '../../shared/js/pictures.js';

const P = (d, f, w) => `<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w == null ? 6 : w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const F = (d, f, o) => `<path d="${d}" fill="${f}"${o != null ? ` opacity="${o}"` : ''}/>`;
const L = (d, c, w) => `<path d="${d}" fill="none" stroke="${c || INK}" stroke-width="${w || 5}" stroke-linecap="round" stroke-linejoin="round"/>`;
const mirror = (s) => `<g transform="translate(400 0) scale(-1 1)">${s}</g>`;

const TONGUE = '#ff7aa0';
const CHEEK = '#ff7fb0';

export const FRIENDS = [
  {
    id: 'bunny', name: 'Bunny', pitch: 1.55, rate: 1.05, tile: 'pink',
    likes: ['carrot', 'apple', 'strawberry', 'watermelon', 'cookie'], yucks: ['broccoli', 'fish'],
    main: '#ffd3ea', limb: '#ffd3ea', belly: '#fff8fc', pad: '#ff9bd0',
    eyes: [[155, 195], [245, 195]], er: 26, mouth: [200, 258, 46], cheeks: [[136, 240], [264, 240]],
    back: P(ellipse(146, 96, 31, 80, -14), '#ffd3ea') + F(ellipse(147, 104, 15, 58, -14), '#ff9bd0') +
      P(ellipse(254, 96, 31, 80, 14), '#ffd3ea') + F(ellipse(253, 104, 15, 58, 14), '#ff9bd0') +
      P(cloud(312, 382, 26, 22, 7), '#fff'),
    head: P(circle(200, 205, 122), '#ffd3ea') + L('M186 88Q194 70 202 86Q210 72 216 90', INK, 5),
    muzzle: F(ellipse(200, 250, 48, 32), '#fff8fc') +
      P('M189 234Q200 228 211 234Q207 245 200 247Q193 245 189 234Z', '#ff5fa8', 4),
    smile: P(rect(191, 259, 18, 14, 3), '#fff', 4) + L('M200 260V272', INK, 3) +
      L('M178 254Q189 268 200 257Q211 268 222 254', INK, 5),
    front: L('M152 248H116M152 258L118 268', INK, 4) + L('M248 248H284M248 258L282 268', INK, 4),
    teeth: true,
  },
  {
    id: 'puppy', name: 'Puppy', pitch: 1.3, rate: 1.05, tile: 'orange',
    likes: ['bone', 'cheese', 'pizza', 'cookie', 'apple'], yucks: ['broccoli', 'lemon'],
    main: '#f6c27b', limb: '#f6c27b', belly: '#fff1dc', pad: '#a7663c',
    eyes: [[152, 190], [250, 190]], er: 25, mouth: [200, 252, 52], cheeks: [[128, 236], [272, 236]],
    back: P('M298 366Q356 340 346 292Q334 292 326 326Q314 344 292 348Z', '#f6c27b'),
    head: P(circle(200, 202, 124), '#f6c27b') + F(ellipse(250, 188, 40, 36, 10), '#dc9850') +
      F(ellipse(176, 110, 20, 12, -20), '#dc9850') +
      P('M98 128Q54 148 62 240Q72 280 104 254Q116 200 126 144Z', '#a7663c') +
      P('M302 128Q346 148 338 240Q328 280 296 254Q284 200 274 144Z', '#a7663c'),
    muzzle: P(ellipse(200, 250, 58, 40), '#fff1dc', 5) + P(ellipse(200, 228, 21, 14), INK, 4) +
      F(ellipse(193, 224, 6, 3.5), '#fff'),
    smile: L('M200 242V252M176 250Q188 266 200 253Q212 266 224 250', INK, 5),
  },
  {
    id: 'dragon', name: 'Dragon', pitch: 0.8, rate: 0.95, tile: 'green',
    likes: ['pizza', 'cupcake', 'fish', 'watermelon', 'banana'], yucks: ['broccoli', 'icecream'],
    main: '#6fd66f', limb: '#6fd66f', belly: '#ffe27a', pad: '#3fae3f',
    eyes: [[150, 184], [250, 184]], er: 28, mouth: [200, 262, 62], cheeks: [[118, 236], [282, 236]],
    back: P('M112 318Q38 286 26 214Q58 238 82 232Q70 258 116 288Z', '#b48cff') +
      P('M288 318Q362 286 374 214Q342 238 318 232Q330 258 284 288Z', '#b48cff') +
      P('M286 384Q360 396 378 340Q386 326 372 322Q364 362 296 360Z', '#6fd66f') +
      P(poly(350, 362, 362, 340, 368, 362), '#ffb03b', 4) +
      P(poly(170, 90, 182, 60, 196, 86), '#ffb03b', 5) + P(poly(192, 84, 205, 50, 218, 84), '#ffb03b', 5) +
      P(poly(214, 86, 228, 60, 236, 92), '#ffb03b', 5) +
      P('M132 116Q112 74 124 50Q138 84 160 100Z', '#fff4c2', 5) + P('M268 116Q288 74 276 50Q262 84 240 100Z', '#fff4c2', 5),
    head: P(ellipse(200, 200, 134, 120), '#6fd66f') +
      F(circle(120, 140, 7), '#a6f08a') + F(circle(136, 122, 5), '#a6f08a') + F(circle(282, 136, 7), '#a6f08a') +
      F(circle(266, 120, 5), '#a6f08a'),
    muzzle: P(ellipse(200, 254, 76, 42), '#a6f08a', 5) +
      F(ellipse(180, 238, 6, 4, -20), INK) + F(ellipse(220, 238, 6, 4, 20), INK),
    smile: L('M166 258Q200 288 234 258', INK, 6) + P('M214 268L218 280L224 265Z', '#fff', 3),
    bellyExtra: L('M150 344Q200 354 250 344M146 366Q200 376 254 366M154 388Q200 396 246 388', '#e6b422', 4),
  },
  {
    id: 'panda', name: 'Panda', pitch: 1.05, rate: 1, tile: 'purple',
    likes: ['bamboo', 'apple', 'banana', 'cookie', 'watermelon'], yucks: ['broccoli', 'cheese'],
    main: '#ffffff', limb: '#3a3550', belly: '#f2efff', pad: '#5a5470', eyeInk: '#ffffff',
    eyes: [[154, 194], [246, 194]], er: 21, mouth: [200, 256, 46], cheeks: [[124, 240], [276, 240]],
    back: P(circle(118, 100, 40), '#3a3550') + F(circle(118, 100, 20), '#5a5470') +
      P(circle(282, 100, 40), '#3a3550') + F(circle(282, 100, 20), '#5a5470'),
    head: P(circle(200, 205, 128), '#ffffff') +
      P(ellipse(150, 198, 34, 46, -32), '#3a3550', 4) + P(ellipse(250, 198, 34, 46, 32), '#3a3550', 4),
    muzzle: F(ellipse(200, 250, 48, 32), '#f2efff') + P(ellipse(200, 236, 17, 11), INK, 4) +
      F(ellipse(195, 233, 5, 3), '#fff'),
    smile: L('M200 247V254M180 252Q190 265 200 254Q210 265 220 252', INK, 5),
  },
  {
    id: 'hippo', name: 'Hippo', pitch: 0.7, rate: 0.92, tile: 'blue',
    likes: ['watermelon', 'cupcake', 'banana', 'icecream', 'strawberry'], yucks: ['broccoli', 'bone'],
    main: '#b9a3ff', limb: '#b9a3ff', belly: '#e4dbff', pad: '#8f75e6',
    eyes: [[152, 150], [248, 150]], er: 25, mouth: [200, 274, 92], cheeks: [[104, 262], [296, 262]],
    back: P(ellipse(116, 92, 26, 21, -30), '#b9a3ff') + F(ellipse(118, 94, 12, 9, -30), '#ff9bd0') +
      P(ellipse(284, 92, 26, 21, 30), '#b9a3ff') + F(ellipse(282, 94, 12, 9, 30), '#ff9bd0'),
    head: P(ellipse(200, 178, 126, 110), '#b9a3ff') + F(ellipse(200, 104, 30, 10), '#cbb9ff'),
    muzzle: P(ellipse(200, 262, 138, 80), '#d8ccff', 6) +
      F(ellipse(160, 224, 11, 8, -15), '#6a52b8') + F(ellipse(240, 224, 11, 8, 15), '#6a52b8'),
    smile: L('M142 268Q200 314 258 268', INK, 6) + P(rect(176, 284, 14, 13, 3), '#fff', 4) + P(rect(210, 284, 14, 13, 3), '#fff', 4),
    teeth: true,
  },
  {
    id: 'kitty', name: 'Kitty', pitch: 1.65, rate: 1.05, tile: 'yellow',
    likes: ['fish', 'cheese', 'icecream', 'cupcake', 'strawberry'], yucks: ['broccoli', 'banana'],
    main: '#ffb04a', limb: '#ffb04a', belly: '#fff1dc', pad: '#ff9bd0',
    eyes: [[150, 196], [250, 196]], er: 27, mouth: [200, 258, 42], cheeks: [[126, 240], [274, 240]],
    back: P(poly(94, 168, 102, 50, 184, 98), '#ffb04a') + F(poly(112, 142, 116, 80, 160, 106), '#ff9bd0') +
      P(poly(306, 168, 298, 50, 216, 98), '#ffb04a') + F(poly(288, 142, 284, 80, 240, 106), '#ff9bd0') +
      P('M296 384Q374 384 360 300Q356 280 340 290Q352 362 292 358Z', '#ffb04a') +
      L('M352 318L366 314M356 340L370 340', '#e8862a', 6),
    head: P(ellipse(200, 206, 132, 118), '#ffb04a') +
      F('M188 90Q200 118 212 90Z', '#e8862a') + F('M156 100Q170 122 176 96Z', '#e8862a') +
      F('M244 100Q230 122 224 96Z', '#e8862a') + L('M74 196L92 200M72 216L90 214', '#e8862a', 6) +
      L('M326 196L308 200M328 216L310 214', '#e8862a', 6),
    muzzle: P(ellipse(182, 252, 25, 19), '#fff6e8', 4) + P(ellipse(218, 252, 25, 19), '#fff6e8', 4) +
      P('M190 234Q200 228 210 234L200 246Z', '#ff7aa8', 4),
    smile: L('M200 246V254M184 256Q192 266 200 256Q208 266 216 256', INK, 4),
    front: L('M156 250L108 240M156 260L110 268', INK, 4) + L('M244 250L292 240M244 260L290 268', INK, 4),
  },
];
export const FRIEND = {};
FRIENDS.forEach((f) => { FRIEND[f.id] = f; });

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------
function body(f) {
  return P(ellipse(146, 410, 38, 18), f.limb, 5) + P(ellipse(254, 410, 38, 18), f.limb, 5) +
    F(ellipse(146, 414, 18, 8), f.pad, 0.7) + F(ellipse(254, 414, 18, 8), f.pad, 0.7) +
    `<g class="tummy">` +
    P(ellipse(200, 350, 112, 70), f.main) +
    P(ellipse(100, 336, 22, 36, 32), f.limb, 5) + P(ellipse(300, 336, 22, 36, -32), f.limb, 5) +
    P(ellipse(200, 362, 66, 44), f.belly, 5) + (f.bellyExtra || '') +
    `</g>`;
}

function eyes(f) {
  const r = f.er;
  const ink = f.eyeInk || INK;
  let open = '';
  let happy = '';
  let squint = '';
  let sleep = '';
  f.eyes.forEach((e, i) => {
    const x = e[0];
    const y = e[1];
    open += `<g class="eo">` + P(circle(x, y, r), '#fff', 5) +
      `<g class="pu">` + F(circle(x, y + 2, r * 0.58), INK) + F(circle(x - r * 0.2, y - r * 0.18, r * 0.22), '#fff') +
      F(circle(x + r * 0.18, y + r * 0.24, r * 0.1), '#fff') + `</g></g>`;
    happy += L(`M${x - r} ${y + r * 0.3}Q${x} ${y - r * 0.95} ${x + r} ${y + r * 0.3}`, ink, 7);
    const s = i === 0 ? 1 : -1;
    squint += L(`M${x - s * r * 0.75} ${y - r * 0.6}L${x + s * r * 0.55} ${y}L${x - s * r * 0.75} ${y + r * 0.6}`, ink, 7);
    sleep += L(`M${x - r} ${y}Q${x} ${y + r * 0.8} ${x + r} ${y}`, ink, 7) +
      L(`M${x - r * 0.75} ${y + r * 0.42}l-7 7M${x} ${y + r * 0.62}v9M${x + r * 0.75} ${y + r * 0.42}l7 7`, ink, 4);
  });
  return `<g class="e-open">${open}</g><g class="e-happy" style="display:none">${happy}</g>` +
    `<g class="e-squint" style="display:none">${squint}</g><g class="e-sleep" style="display:none">${sleep}</g>`;
}

function mouths(f) {
  const mx = f.mouth[0];
  const my = f.mouth[1];
  const mw = f.mouth[2];
  const tx = mx + mw * 0.12;
  const yuck = P(`M${tx - 13} ${my + 2}L${tx - 13} ${my + 24}Q${tx} ${my + 44} ${tx + 13} ${my + 24}L${tx + 13} ${my + 2}Z`, TONGUE, 5) +
    L(`M${tx} ${my + 8}V${my + 26}`, '#e0507a', 3) +
    L(`M${mx - mw / 2} ${my + 2}Q${mx - mw / 4} ${my - 10} ${mx} ${my + 2}T${mx + mw / 2} ${my + 2}`, INK, 6);
  return `<g class="m-smile">${f.smile}</g>` +
    `<g class="m-open" style="display:none"><path class="cav" d="" fill="#7a1f45" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
    `<path class="tng" d="" fill="${TONGUE}"/>` +
    (f.teeth ? `<path class="tth" d="" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` : '') + `</g>` +
    `<g class="m-yuck" style="display:none">${yuck}</g>` +
    `<g class="m-sleep" style="display:none">${P(ellipse(mx, my + 6, 9, 7), '#7a1f45', 5)}</g>`;
}

function cheeks(f) {
  const ck = (c) => f.cheeks.map((p) => F(ellipse(p[0], p[1], 17, 10), c, 0.55)).join('');
  return `<g class="c-pink">${ck(CHEEK)}</g><g class="c-green" style="display:none">${ck('#7ed957')}` +
    f.cheeks.map((p) => L(`M${p[0] - 12} ${p[1] - 24}q6 -6 12 0t12 0`, '#5cb85c', 4)).join('') + `</g>`;
}

/** The whole friend as an <svg> string. */
export function friendSvg(f, cls) {
  return `<svg class="${cls || 'friend'}" viewBox="0 0 400 430" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    f.back + body(f) + f.head + eyes(f) + f.muzzle + mouths(f) + cheeks(f) + (f.front || '') + `</svg>`;
}

// ---------------------------------------------------------------------------
// The face rig: put a friend in an element and get controls for it
// ---------------------------------------------------------------------------
export function mountFriend(el, f) {
  el.innerHTML = friendSvg(f);
  const svg = el.firstChild;
  const q = (s) => svg.querySelector(s);
  const qa = (s) => Array.prototype.slice.call(svg.querySelectorAll(s));
  const groups = {
    eyes: { open: q('.e-open'), happy: q('.e-happy'), squint: q('.e-squint'), sleep: q('.e-sleep') },
    mouth: { smile: q('.m-smile'), open: q('.m-open'), yuck: q('.m-yuck'), sleep: q('.m-sleep') },
  };
  const eyeEls = qa('.eo');
  const pupils = qa('.pu');
  const cav = q('.cav');
  const tng = q('.tng');
  const tth = q('.tth');
  const tummy = q('.tummy');
  const pink = q('.c-pink');
  const green = q('.c-green');
  const mx = f.mouth[0];
  const my = f.mouth[1];
  const mw = f.mouth[2];
  let eyeState = 'open';
  let mouthState = 'smile';
  let lastOpen = -1;
  let lastBlink = -1;
  let lastLook = '';

  const show = (set, which) => {
    Object.keys(set).forEach((k) => { set[k].style.display = k === which ? '' : 'none'; });
  };

  const rig = {
    f,
    svg,
    get eyes() { return eyeState; },
    get mouth() { return mouthState; },
    setEyes(s) {
      if (s === eyeState) return;
      eyeState = s;
      show(groups.eyes, s);
    },
    setMouth(s) {
      if (s === mouthState) return;
      mouthState = s;
      show(groups.mouth, s);
    },
    /** How wide the mouth is open, 0..1 (switches to the open mouth if needed). */
    setOpen(o) {
      o = Math.max(0, Math.min(1.2, o));
      if (Math.abs(o - lastOpen) < 0.01) return;
      lastOpen = o;
      const hh = Math.max(6, mw * 1.05 * o);
      const rx = (mw / 2) * (0.8 + 0.3 * Math.min(1, o));
      cav.setAttribute('d', ellipse(mx, my + hh / 2 - 2, rx, hh / 2));
      tng.setAttribute('d', ellipse(mx, my + hh * 0.76, rx * 0.56, Math.max(2, hh * 0.2)));
      if (tth) {
        tth.setAttribute('d', o > 0.25 ? `M${mx - 11} ${my - 1}h22v${Math.min(14, hh * 0.3)}h-22z` : '');
      }
    },
    /** 1 = eyes open, 0 = shut (for blinking). */
    setBlink(s) {
      if (Math.abs(s - lastBlink) < 0.01) return;
      lastBlink = s;
      eyeEls.forEach((g, i) => {
        const ey = f.eyes[i][1];
        g.setAttribute('transform', s >= 0.99 ? '' : `translate(0 ${(ey * (1 - s)).toFixed(1)}) scale(1 ${s.toFixed(3)})`);
      });
    },
    /** Look toward a point in sheet coordinates (or null to look ahead). */
    look(x, y, amount) {
      const a = amount == null ? 1 : amount;
      const parts = f.eyes.map((e) => {
        if (x == null) return [0, 0];
        const dx = x - e[0];
        const dy = y - e[1];
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const m = Math.min(f.er * 0.36, len * 0.08) * a;
        return [(dx / len) * m, (dy / len) * m];
      });
      const key = parts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      if (key === lastLook) return;
      lastLook = key;
      pupils.forEach((g, i) => g.setAttribute('transform', `translate(${parts[i][0].toFixed(1)} ${parts[i][1].toFixed(1)})`));
    },
    /** A rounder belly as the tummy fills, k = 0..1. */
    setTummy(k) {
      const sx = 1 + 0.12 * k;
      const sy = 1 + 0.07 * k;
      tummy.setAttribute('transform', `translate(200 418) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-200 -418)`);
    },
    setGreen(on) {
      pink.style.display = on ? 'none' : '';
      green.style.display = on ? '' : 'none';
    },
  };
  rig.setOpen(0.5);
  return rig;
}
