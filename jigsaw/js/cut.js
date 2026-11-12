// Jigsaw geometry: cuts a rectangle into cols x rows pieces with round tabs
// and blanks. A piece outline is a list of path commands in the piece's own
// coordinates (origin = top-left corner of its cell), so the same outline can
// be traced on a canvas (clip / hit test / stroke) or written out as SVG.
//
// The tab shape is the classic one from Draradech's jigsaw generator: three
// cubic curves per edge, with a little random jitter so pieces look hand cut.
// Both pieces that share an edge use the same numbers, so they always fit.

const TAB = 0.1; // tab size (0.1 = the knob sticks out about a quarter of a cell)

/** A random cut: which way each inside edge bulges, plus a little jitter. */
export function makeCut(cols, rows, rnd) {
  const r = rnd || Math.random;
  const j = () => r() * 2 - 1;
  const edge = () => ({
    s: r() < 0.5 ? 1 : -1,
    a: j() * 0.04, b: j() * 0.04, c: j() * 0.03, d: j() * 0.03, e: j() * 0.04,
    t: TAB * (1 + j() * 0.08),
  });
  const H = []; // H[r][c]: edge on top of row r (r >= 1)
  const V = []; // V[r][c]: edge left of column c (c >= 1)
  for (let y = 0; y < rows; y++) {
    H.push([]);
    V.push([]);
    for (let x = 0; x < cols; x++) {
      H[y].push(y > 0 ? edge() : null);
      V[y].push(x > 0 ? edge() : null);
    }
  }
  return { cols, rows, H, V };
}

// Ten points along one edge, from A to B. (dx, dy) is the unit direction the
// knob points to. m is the smaller cell side, so knobs stay round on long edges.
function edgePts(ax, ay, bx, by, dx, dy, e, m) {
  const L = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
  const ux = (bx - ax) / L;
  const uy = (by - ay) / L;
  const t = e.t;
  const N = [
    [0, 0], [0.2, e.a], [0.5 + e.b + e.d, -t + e.c], [0.5 - t + e.b, t + e.c],
    [0.5 - 2 * t + e.b - e.d, 3 * t + e.c], [0.5 + 2 * t + e.b - e.d, 3 * t + e.c],
    [0.5 + t + e.b, t + e.c], [0.5 + e.b + e.d, -t + e.c], [0.8, e.e], [1, 0],
  ];
  return N.map((p, i) => {
    const along = i === 0 ? 0 : i === 9 ? L : 0.5 * L + (p[0] - 0.5) * m;
    const side = p[1] * m;
    return [ax + ux * along + dx * side, ay + uy * along + dy * side];
  });
}

function addEdge(ops, P, reverse) {
  const q = reverse ? P.slice().reverse() : P;
  for (let i = 1; i < 10; i += 3) {
    ops.push(['C', q[i][0], q[i][1], q[i + 1][0], q[i + 1][1], q[i + 2][0], q[i + 2][1]]);
  }
}

/** Outline of piece (c, r) for cells of size cw x ch. */
export function pieceOps(cut, c, r, cw, ch) {
  const m = Math.min(cw, ch);
  const ops = [['M', 0, 0]];
  // top (canonical left -> right)
  if (r === 0) ops.push(['L', cw, 0]);
  else { const e = cut.H[r][c]; addEdge(ops, edgePts(0, 0, cw, 0, 0, e.s, e, m), false); }
  // right (canonical top -> bottom)
  if (c === cut.cols - 1) ops.push(['L', cw, ch]);
  else { const e = cut.V[r][c + 1]; addEdge(ops, edgePts(cw, 0, cw, ch, e.s, 0, e, m), false); }
  // bottom (canonical left -> right, walked backwards)
  if (r === cut.rows - 1) ops.push(['L', 0, ch]);
  else { const e = cut.H[r + 1][c]; addEdge(ops, edgePts(0, ch, cw, ch, 0, e.s, e, m), true); }
  // left (canonical top -> bottom, walked backwards)
  if (c === 0) ops.push(['L', 0, 0]);
  else { const e = cut.V[r][c]; addEdge(ops, edgePts(0, 0, 0, ch, e.s, 0, e, m), true); }
  ops.push(['Z']);
  return ops;
}

/** Trace an outline on a canvas, offset by (ox, oy) and scaled by k. */
export function tracePath(ctx, ops, ox, oy, k) {
  const s = k || 1;
  ctx.beginPath();
  for (const o of ops) {
    if (o[0] === 'M') ctx.moveTo(ox + o[1] * s, oy + o[2] * s);
    else if (o[0] === 'L') ctx.lineTo(ox + o[1] * s, oy + o[2] * s);
    else if (o[0] === 'C') {
      ctx.bezierCurveTo(ox + o[1] * s, oy + o[2] * s, ox + o[3] * s, oy + o[4] * s, ox + o[5] * s, oy + o[6] * s);
    } else ctx.closePath();
  }
}

const r1 = (v) => Math.round(v * 10) / 10;

/** SVG path data for an outline, offset by (ox, oy) and scaled by k. */
export function svgPath(ops, ox, oy, k) {
  const s = k || 1;
  let d = '';
  for (const o of ops) {
    if (o[0] === 'Z') { d += 'Z'; continue; }
    d += o[0];
    for (let i = 1; i < o.length; i += 2) {
      d += `${i > 1 ? ' ' : ''}${r1(ox + o[i] * s)} ${r1(oy + o[i + 1] * s)}`;
    }
  }
  return d;
}

/**
 * SVG path data for every inside seam of a cut over a size x size square
 * (used for the "how many pieces" icons).
 */
export function seamsPath(cut, size) {
  const cw = size / cut.cols;
  const ch = size / cut.rows;
  const m = Math.min(cw, ch);
  let d = '';
  const curve = (P) => {
    d += `M${r1(P[0][0])} ${r1(P[0][1])}`;
    for (let i = 1; i < 10; i += 3) {
      d += `C${r1(P[i][0])} ${r1(P[i][1])} ${r1(P[i + 1][0])} ${r1(P[i + 1][1])} ${r1(P[i + 2][0])} ${r1(P[i + 2][1])}`;
    }
  };
  for (let r = 1; r < cut.rows; r++) {
    for (let c = 0; c < cut.cols; c++) {
      const e = cut.H[r][c];
      curve(edgePts(c * cw, r * ch, (c + 1) * cw, r * ch, 0, e.s, e, m));
    }
  }
  for (let r = 0; r < cut.rows; r++) {
    for (let c = 1; c < cut.cols; c++) {
      const e = cut.V[r][c];
      curve(edgePts(c * cw, r * ch, c * cw, (r + 1) * ch, e.s, 0, e, m));
    }
  }
  return d;
}

/** A tiny seeded random generator, so icons look the same every time. */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
