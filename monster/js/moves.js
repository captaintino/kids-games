// Moving a monster drawn with monsterSVG(m, { id }): find its parts and pose them.
// Used by Feed me! and the Parade (the builder screen has its own animation).

/** The animatable parts of a monster drawn with id `P`, looked up inside `root`. */
export function partsOf(root, P) {
  const g = (n) => root.querySelector(`#${P}-${n}`);
  const r = {
    all: g('all'), torso: g('torso'), head: g('head'), eyes: g('eyes'), pupils: g('pupils'),
    armL: g('armL'), armR: g('armR'), shadow: g('shadow'), body: g('body'), belly: g('belly'),
    mshut: g('mshut'), mopen: g('mopen'), bleh: g('bleh'), legs: [],
  };
  for (let i = 0; i < 6; i++) { const l = g('leg' + i); if (l) r.legs.push(l); }
  return r;
}

const f2 = (v) => v.toFixed(2);
function setT(el, v) { if (el) el.setAttribute('transform', v); }

/** A neutral pose; fill in only what moves. */
export function restPose() {
  return { y: 0, r: 0, sx: 1, sy: 1, torso: 0, head: 0, armL: 0, armR: 0, legs: [], px: 0, py: 0, eye: 1 };
}

/** Apply a pose. Only parts that exist are touched. */
export function setPose(R, p) {
  if (R.pose) { R.pose(p); return; } // a monster cut into layers (rig.js)
  setT(R.all, `translate(0 ${f2(p.y)}) rotate(${f2(p.r)}) scale(${f2(p.sx)} ${f2(p.sy)})`);
  setT(R.torso, `rotate(${f2(p.torso)})`);
  setT(R.head, `rotate(${f2(p.head)})`);
  setT(R.eyes, `scale(1 ${f2(p.eye)})`);
  setT(R.pupils, `translate(${f2(p.px)} ${f2(p.py)})`);
  setT(R.armR, `rotate(${f2(p.armR)})`);
  setT(R.armL, `rotate(${f2(p.armL)})`);
  R.legs.forEach((l, i) => setT(l, `rotate(${f2(p.legs[i] || 0)})`));
  const sh = 1 + p.y / 120;
  setT(R.shadow, `translate(200 452) scale(${f2(sh)} ${f2(sh)}) translate(-200 -452)`);
}

/** The happy dance (same moves as the builder's dance), b = beats since the start. */
export function dancePose(b, nLegs) {
  const p = restPose();
  const hop = Math.abs(Math.sin(Math.PI * b));
  p.y = -hop * 24;
  p.sy = 1 - (1 - hop) * 0.07;
  p.sx = 1 + (1 - hop) * 0.05;
  p.r = Math.sin((Math.PI * b) / 2) * 7;
  p.head = Math.sin(Math.PI * b) * 12;
  p.armR = -15 - 55 * (0.5 + 0.5 * Math.sin(Math.PI * b));
  p.armL = -15 - 55 * (0.5 + 0.5 * Math.sin(Math.PI * b + Math.PI));
  for (let i = 0; i < nLegs; i++) p.legs.push(Math.sin(Math.PI * b + i * Math.PI) * 16);
  p.px = Math.cos((Math.PI * b) / 2) * 7;
  p.py = Math.sin((Math.PI * b) / 2) * 6;
  const loopBeat = b % 16;
  if (loopBeat >= 12 && loopBeat < 14) p.sx *= Math.cos(((loopBeat - 12) / 2) * Math.PI * 2);
  return p;
}

/** Marching in the parade: knees up on every beat, arms swinging, eyes to the front. */
export function marchPose(b, style, nLegs) {
  const p = restPose();
  const step = Math.sin(Math.PI * b);
  const hop = Math.abs(step);
  p.y = -hop * (style === 1 ? 22 : 12);
  p.sy = 1 - (1 - hop) * 0.05;
  p.sx = 1 + (1 - hop) * 0.04;
  p.r = style === 2 ? Math.sin((Math.PI * b) / 2) * 9 : step * 4;
  p.head = Math.sin((Math.PI * b) / 2) * 10;
  p.armR = -10 - 40 * (0.5 + 0.5 * step);
  p.armL = -10 - 40 * (0.5 - 0.5 * step);
  if (style === 1) { p.armR = -70 - 20 * step; p.armL = -70 + 20 * step; }
  for (let i = 0; i < nLegs; i++) p.legs.push(step * (i % 2 ? -18 : 18));
  p.px = 6;
  p.py = 1;
  // a twirl every few bars
  const loopBeat = b % 16;
  if (style === 2 && loopBeat >= 14) p.sx *= Math.cos(((loopBeat - 14) / 2) * Math.PI * 2);
  return p;
}
