// A monster drawn as a stack of small layers that move with CSS transforms.
//
// monsterSVG(m, { id }) is one SVG whose parts (the whole body, torso, head, eyes, pupils,
// arms, legs, shadow) are posed with transform attributes. Changing any of them repaints
// the whole drawing, every frame of a dance or the parade. Here the same drawing is cut
// into pieces, in painting order: every still run of shapes becomes its own small <svg>,
// and every moving part becomes a <div> (nested like the groups) that is moved with a CSS
// transform, which the compositor does without repainting anything.
//
//   const R = rigMonster(box, monsterSVG(m, { id: P }), P);
//   setPose(R, pose)   (moves.js), R.fit() after the box changes size
//
// The box keeps an empty <svg> with the drawing's viewBox (for taps on empty space and for
// code that maps sheet points to the screen), with the pieces on top of it.

const MOVING = ['shadow', 'all', 'torso', 'head', 'eyes', 'pupils', 'armL', 'armR', 'leg0', 'leg1', 'leg2', 'leg3', 'leg4', 'leg5'];
const PAD = 16; // room for strokes around each piece's box (sheet units)

// 2D affine matrices as [a, b, c, d, e, f], like SVG and CSS matrix()
const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
const inv = (m) => {
  const det = m[0] * m[3] - m[1] * m[2];
  return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det,
    (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
};
const ID = [1, 0, 0, 1, 0, 0];
const RAD = Math.PI / 180;
const rot = (deg) => { const c = Math.cos(deg * RAD); const s = Math.sin(deg * RAD); return [c, s, -s, c, 0, 0]; };
const tr = (x, y) => [1, 0, 0, 1, x, y];
const sc = (x, y) => [x, 0, 0, y, 0, 0];

function ownMatrix(el) {
  const list = el.transform && el.transform.baseVal;
  const t = list && list.numberOfItems ? list.consolidate() : null;
  if (!t) return ID;
  const m = t.matrix;
  return [m.a, m.b, m.c, m.d, m.e, m.f];
}
// from el's own coordinates to the drawing's (root user space), including el's transform
function toRoot(el, root) {
  let m = ID;
  for (let e = el; e && e !== root; e = e.parentNode) m = mul(ownMatrix(e), m);
  return m;
}

// an offscreen place to measure drawings (getBBox needs them laid out)
let host = null;
function measureHost() {
  if (!host) {
    host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:-3000px;top:0;width:400px;height:480px;overflow:hidden;visibility:hidden;pointer-events:none';
    document.body.appendChild(host);
  }
  return host;
}

function parse(markup) {
  const d = document.createElement('div');
  d.innerHTML = markup;
  return d.firstChild;
}
// the element at the same place in another copy of the drawing
function pathOf(el, root) {
  const p = [];
  for (let e = el; e !== root; e = e.parentNode) p.unshift(Array.prototype.indexOf.call(e.parentNode.children, e));
  return p;
}
function atPath(root, p) {
  let e = root;
  for (let i = 0; i < p.length; i++) e = e.children[p[i]];
  return e;
}

export function rigMonster(box, markup, P) {
  const nameOf = (el) => {
    const id = el.getAttribute('id');
    if (!id || id.indexOf(P + '-') !== 0) return null;
    const n = id.slice(P.length + 1);
    return MOVING.indexOf(n) >= 0 ? n : null;
  };

  // 1. measure a copy, with everything shown and the feeding shapes at their biggest
  const h = measureHost();
  h.innerHTML = markup;
  const ms = h.firstChild;
  const q = (n) => ms.querySelector(`#${P}-${n}`);
  Array.prototype.forEach.call(ms.querySelectorAll('[style]'), (e) => { e.style.display = ''; });
  if (q('mopen')) {
    q('mopen').setAttribute('transform', 'translate(0 -6) scale(1.16 1.13) translate(0 6)');
    if (q('body')) q('body').setAttribute('transform', 'scale(1.18 1.08)');
    const bl = q('belly');
    if (bl) {
      const cx = +bl.getAttribute('cx');
      const cy = +bl.getAttribute('cy');
      bl.setAttribute('transform', `translate(${cx} ${cy}) scale(1.45) translate(${-cx} ${-cy})`);
    }
  }

  // 2. split it, in painting order: moving parts become nodes, still shapes become pieces
  const hasMoving = (el) => !!nameOf(el) || MOVING.some((n) => !!el.querySelector(`#${P}-${n}`));
  const top = { el: ms, name: null, kids: [] };
  const walk = (el, node) => {
    Array.prototype.forEach.call(el.children, (ch) => {
      const tag = ch.tagName.toLowerCase();
      if (tag === 'defs') return;
      const name = nameOf(ch);
      if (name) {
        const kid = { el: ch, name, kids: [] };
        node.kids.push({ node: kid });
        // a moving group holds its shapes; a moving shape (the shadow) is its own piece
        if (tag === 'g') walk(ch, kid);
        else kid.kids.push({ items: [ch] });
      } else if (hasMoving(ch)) {
        walk(ch, node);
      } else {
        const last = node.kids[node.kids.length - 1];
        if (last && last.items) last.items.push(ch);
        else node.kids.push({ items: [ch] });
      }
    });
  };
  walk(ms, top);

  const vb = ms.viewBox.baseVal;
  const vx = vb.x;
  const vy = vb.y;

  // 3. build the layers
  box.innerHTML = markup;
  const frame = box.firstChild;
  while (frame.firstChild) frame.removeChild(frame.firstChild);
  const tpl = parse(markup);
  const rig = document.createElement('div');
  rig.className = 'rig';
  const R = { rig: null, legs: [], svg: frame, nodes: {} };
  const em = (v) => `${(v / 100).toFixed(4)}em`;
  let pieceNo = 0;

  const piece = (items) => {
    // the box of these shapes on the sheet
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    items.forEach((it) => {
      let b;
      try { b = it.getBBox(); } catch (err) { return; }
      if (!b || (!b.width && !b.height)) return;
      const m = toRoot(it, ms);
      [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].forEach((c) => {
        const x = m[0] * c[0] + m[2] * c[1] + m[4];
        const y = m[1] * c[0] + m[3] * c[1] + m[5];
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      });
    });
    if (x0 === Infinity) { x0 = vx; y0 = vy; x1 = vx + 1; y1 = vy + 1; }
    x0 = Math.floor(x0 - PAD); y0 = Math.floor(y0 - PAD);
    x1 = Math.ceil(x1 + PAD); y1 = Math.ceil(y1 + PAD);

    // a copy of the drawing with only these shapes (and the groups around them)
    const svg = tpl.cloneNode(true);
    const keep = items.map((it) => atPath(svg, pathOf(it, ms)));
    const prune = (el) => {
      Array.prototype.slice.call(el.children).forEach((ch) => {
        if (ch.tagName.toLowerCase() === 'defs') return;
        if (keep.indexOf(ch) >= 0) return;
        if (keep.some((k) => ch.contains(k))) {
          // a group around the kept shapes: its moving id now belongs to a layer
          if (nameOf(ch)) ch.removeAttribute('id');
          prune(ch);
        } else el.removeChild(ch);
      });
    };
    prune(svg);
    // only the clip paths it uses, renamed so each copy has its own
    const n = ++pieceNo;
    const defs = svg.querySelector('defs');
    if (defs) {
      Array.prototype.slice.call(defs.children).forEach((d) => {
        const id = d.getAttribute('id');
        const users = svg.querySelectorAll(`[clip-path="url(#${id})"]`);
        if (!users.length) { defs.removeChild(d); return; }
        d.setAttribute('id', `${id}-${n}`);
        Array.prototype.forEach.call(users, (u) => u.setAttribute('clip-path', `url(#${id}-${n})`));
      });
    }
    svg.setAttribute('viewBox', `${x0} ${y0} ${x1 - x0} ${y1 - y0}`);
    svg.setAttribute('aria-hidden', 'true');
    svg.removeAttribute('class');
    svg.style.cssText = `left:${em(x0 - vx)};top:${em(y0 - vy)};width:${em(x1 - x0)};height:${em(y1 - y0)}`;
    return svg;
  };

  const build = (node, parentEl) => {
    node.kids.forEach((k) => {
      if (k.items) { parentEl.appendChild(piece(k.items)); return; }
      const n = k.node;
      const div = document.createElement('div');
      div.className = 'rig-part';
      const Pm = toRoot(n.el.parentNode, ms);
      const part = { el: div, P: Pm, Pi: inv(Pm), css: '' };
      R.nodes[n.name] = part;
      if (n.name.indexOf('leg') === 0) R.legs.push(part);
      parentEl.appendChild(div);
      build(n, div);
    });
  };
  build(top, rig);
  h.innerHTML = '';
  box.appendChild(rig);
  R.rig = rig;

  // the shapes that Feed me! changes directly
  const g = (n) => box.querySelector(`#${P}-${n}`);
  ['body', 'belly', 'mshut', 'mopen', 'bleh', 'mouth'].forEach((n) => { R[n] = g(n); });

  // 4. fit to the box like the SVG would (centered, "meet"): 1em = 100 sheet units
  let fw = -1;
  let fh = -1;
  R.fit = (w, hh) => {
    const W = w == null ? box.clientWidth : w;
    const H = hh == null ? box.clientHeight : hh;
    if (W === fw && H === fh) return;
    if (!W || !H) return;
    fw = W;
    fh = H;
    const k = Math.min(W / vb.width, H / vb.height);
    rig.style.fontSize = `${(k * 100).toFixed(3)}px`;
    rig.style.left = `${((W - vb.width * k) / 2).toFixed(2)}px`;
    rig.style.top = `${((H - vb.height * k) / 2).toFixed(2)}px`;
  };
  R.fit();

  // move one part: `local` is its own transform, as the SVG group would have it
  const set = (name, local) => {
    const part = R.nodes[name];
    if (!part) return;
    const m = mul(mul(part.P, local), part.Pi);
    const e = m[4] + m[0] * vx + m[2] * vy - vx;
    const f = m[5] + m[1] * vx + m[3] * vy - vy;
    const css = `translate(${em(e)},${em(f)}) matrix(${m[0].toFixed(4)},${m[1].toFixed(4)},${m[2].toFixed(4)},${m[3].toFixed(4)},0,0)`;
    if (css === part.css) return;
    part.css = css;
    part.el.style.transform = css;
  };

  /** Apply a pose (see restPose() in moves.js). */
  R.pose = (p) => {
    set('all', mul(mul(tr(0, p.y), rot(p.r)), sc(p.sx, p.sy)));
    set('torso', rot(p.torso));
    set('head', rot(p.head));
    set('eyes', sc(1, p.eye));
    set('pupils', tr(p.px, p.py));
    set('armR', rot(p.armR));
    set('armL', rot(p.armL));
    for (let i = 0; i < R.legs.length; i++) set('leg' + i, rot(p.legs[i] || 0));
    const sh = 1 + p.y / 120;
    set('shadow', mul(mul(tr(200, 452), sc(sh, sh)), tr(-200, -452)));
  };
  return R;
}
