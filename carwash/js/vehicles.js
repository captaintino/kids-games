// The vehicles (and pets) that come to the car wash. Every one is drawn on a
// 400 x 260 sheet, facing right, standing on y = 244. Parts with class "paint"
// take the body color (the kid can change it in the decorate step).
//
// Faces: eyes are <g class="eye"> with a sclera, a pupil group (moved to follow
// the sponge) and a hidden happy arc; the mouth is a smile plus a hidden open
// giggle. Hidden parts use inline style="display:none" so a saved picture
// (the SVG drawn into a canvas) looks exactly like the screen.
import { INK } from '../../shared/js/pictures.js';

export const VW = 400;
export const VH = 260;

const O = `stroke="${INK}" stroke-width="5" stroke-linejoin="round"`;
const O3 = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"`;
const GLASS = '#bfe9ff';
const n = (v) => Math.round(v * 10) / 10;

function wheel(cx, cy, r, opts = {}) {
  const hub = opts.hub || '#e8ecf4';
  let s = `<g class="wheel" data-cx="${cx}" data-cy="${cy}">`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#3a3550" ${O}/>`;
  if (opts.tread) {
    for (let i = 0; i < opts.tread; i++) {
      const a = (i / opts.tread) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * r * 0.78;
      const y1 = cy + Math.sin(a) * r * 0.78;
      const x2 = cx + Math.cos(a + 0.12) * r * 0.98;
      const y2 = cy + Math.sin(a + 0.12) * r * 0.98;
      s += `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}" stroke="#5b5575" stroke-width="${n(r * 0.12)}" stroke-linecap="round"/>`;
    }
  }
  s += `<circle class="hub" cx="${cx}" cy="${cy}" r="${n(r * 0.5)}" fill="${hub}" ${O3}/>`;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    s += `<circle cx="${n(cx + Math.cos(a) * r * 0.3)}" cy="${n(cy + Math.sin(a) * r * 0.3)}" r="${n(r * 0.065)}" fill="${INK}"/>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${n(r * 0.13)}" fill="${INK}"/>`;
  s += `<path d="M${n(cx - r * 0.62)} ${n(cy - r * 0.35)}A${n(r * 0.72)} ${n(r * 0.72)} 0 0 1 ${n(cx - r * 0.1)} ${n(cy - r * 0.72)}" fill="none" stroke="#fff" stroke-width="${n(r * 0.09)}" stroke-linecap="round" opacity=".35"/>`;
  return s + '</g>';
}

function eye(x, y, r) {
  return `<g class="eye" data-x="${x}" data-y="${y}" data-r="${r}">` +
    `<circle class="sclera" cx="${x}" cy="${y}" r="${r}" fill="#fff" ${O}/>` +
    `<g class="pupil"><circle cx="${x}" cy="${y}" r="${n(r * 0.56)}" fill="${INK}"/>` +
    `<circle cx="${n(x - r * 0.2)}" cy="${n(y - r * 0.24)}" r="${n(r * 0.2)}" fill="#fff"/></g>` +
    `<path class="happy" style="display:none" d="M${n(x - r * 0.75)} ${n(y + r * 0.25)}Q${x} ${n(y - r * 0.85)} ${n(x + r * 0.75)} ${n(y + r * 0.25)}" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>` +
    '</g>';
}

function face({ eyes, r, mouth, cheeks }) {
  const [mx, my, mw] = mouth;
  let s = '';
  if (cheeks) cheeks.forEach((c) => { s += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="${n(r * 0.62)}" ry="${n(r * 0.42)}" fill="#ff7ac6" opacity=".55"/>`; });
  eyes.forEach((e) => { s += eye(e[0], e[1], r); });
  s += `<path class="smile" d="M${n(mx - mw / 2)} ${my}Q${mx} ${n(my + mw * 0.55)} ${n(mx + mw / 2)} ${my}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  s += `<g class="giggle" style="display:none"><path d="M${n(mx - mw / 2)} ${my}Q${mx} ${n(my + mw * 1.05)} ${n(mx + mw / 2)} ${my}Z" fill="#9b2350" ${O3}/>` +
    `<path d="M${n(mx - mw * 0.24)} ${n(my + mw * 0.36)}Q${mx} ${n(my + mw * 0.16)} ${n(mx + mw * 0.24)} ${n(my + mw * 0.36)}Q${mx} ${n(my + mw * 0.6)} ${n(mx - mw * 0.24)} ${n(my + mw * 0.36)}Z" fill="#ff7a9a"/></g>`;
  return s;
}

const shineLine = (d, w = 7) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity=".55"/>`;
const light = (x, y, rx = 9, ry = 12) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff59a" ${O3}/>`;

// ---------------------------------------------------------------------------
export const VEHICLES = [
  {
    id: 'car', name: 'Car', kind: 'car', paint: '#ff4d5e', thanks: 'Beep beep! Thank you!',
    draw: (p) => `
      <path class="paint" d="M44 202Q28 202 28 186V160Q28 134 56 131L100 128L130 76Q138 62 156 62H254Q272 62 284 77L320 128L352 132Q374 136 376 162V186Q376 202 360 202Z" fill="${p}" ${O}/>
      <path d="M116 126L140 84Q144 77 153 77H196V126Z" fill="${GLASS}" ${O3}/>
      <path d="M208 126V77H251Q262 77 270 87L302 126Z" fill="${GLASS}" ${O3}/>
      ${shineLine('M128 112L142 88', 5)}
      <path d="M202 134V196" stroke="${INK}" stroke-width="3.5" opacity=".45"/>
      <rect x="172" y="144" width="20" height="7" rx="3.5" fill="${INK}" opacity=".45"/>
      ${shineLine('M58 146H112')}
      ${light(364, 152, 8, 11)}
      <rect x="22" y="160" width="14" height="22" rx="6" fill="#ff9a2e" ${O3}/>
      ${face({ eyes: [[232, 103], [268, 103]], r: 15, mouth: [318, 143, 28], cheeks: [[286, 146], [352, 146]] })}
      ${wheel(106, 202, 40)}${wheel(300, 202, 40)}`,
  },
  {
    id: 'firetruck', name: 'Fire Truck', kind: 'car', paint: '#ff4d5e', thanks: 'Nee-naw! Thank you!',
    draw: (p) => `
      <rect x="18" y="98" width="258" height="108" rx="14" fill="${p}" ${O}/>
      <rect x="32" y="114" width="68" height="54" rx="8" fill="#000" opacity=".12"/>
      <rect x="112" y="114" width="68" height="54" rx="8" fill="#000" opacity=".12"/>
      <rect x="192" y="114" width="70" height="54" rx="8" fill="#000" opacity=".12"/>
      <circle cx="146" cy="141" r="18" fill="#ffd93b" ${O3}/><circle cx="146" cy="141" r="7" fill="${INK}"/>
      <path class="paint" d="M270 206V86Q270 66 290 66H330Q346 66 355 82L378 128Q384 140 384 154V192Q384 206 370 206Z" fill="${p}" ${O}/>
      <path d="M288 128V84Q288 80 292 80H330Q338 80 342 88L362 128Z" fill="${GLASS}" ${O3}/>
      <rect x="18" y="178" width="366" height="12" fill="#ffd93b" ${O3}/>
      <rect x="296" y="52" width="22" height="16" rx="6" fill="#3d7bff" ${O3}/><rect x="318" y="52" width="22" height="16" rx="6" fill="#ff4d5e" ${O3}/>
      <g ${O3}><rect x="26" y="74" width="240" height="8" rx="4" fill="#e8ecf4"/><rect x="26" y="88" width="240" height="8" rx="4" fill="#e8ecf4"/>
      ${[48, 78, 108, 138, 168, 198, 228].map((x) => `<rect x="${x}" y="78" width="6" height="14" fill="#e8ecf4"/>`).join('')}</g>
      <rect x="250" y="88" width="10" height="12" fill="#b3b9c6" ${O3}/>
      ${light(376, 160, 7, 10)}
      ${face({ eyes: [[306, 105], [338, 105]], r: 14, mouth: [326, 145, 28], cheeks: [[298, 146], [358, 146]] })}
      ${wheel(78, 206, 36)}${wheel(170, 206, 36)}${wheel(326, 206, 36)}`,
  },
  {
    id: 'bus', name: 'Bus', kind: 'car', paint: '#ffc21f', thanks: 'Beep beep! Thank you!',
    draw: (p) => `
      <path class="paint" d="M40 206Q18 206 18 184V82Q18 56 44 56H330Q366 56 374 92L382 140V184Q382 206 360 206Z" fill="${p}" ${O}/>
      ${[34, 88, 142].map((x) => `<rect x="${x}" y="72" width="44" height="46" rx="7" fill="${GLASS}" ${O3}/>`).join('')}
      <rect x="198" y="72" width="50" height="124" rx="7" fill="${GLASS}" ${O3}/>
      <path d="M223 72V196" stroke="${INK}" stroke-width="3.5"/>
      <path d="M264 72H334Q350 72 355 90L362 132H264Z" fill="${GLASS}" ${O3}/>
      <path d="M18 146H190M18 162H190" stroke="${INK}" stroke-width="4"/>
      ${shineLine('M38 66H120', 5)}
      <rect x="364" y="166" width="14" height="18" rx="5" fill="#fff59a" ${O3}/>
      <rect x="10" y="150" width="12" height="28" rx="5" fill="#ff4d5e" ${O3}/>
      ${face({ eyes: [[290, 102], [328, 102]], r: 15, mouth: [318, 146, 30], cheeks: [[286, 148], [352, 148]] })}
      ${wheel(94, 206, 38)}${wheel(306, 206, 38)}`,
  },
  {
    id: 'monster', name: 'Monster Truck', kind: 'car', paint: '#3d7bff', thanks: 'Vroom vroom! Thank you!',
    draw: (p) => `
      <path d="M100 184L130 150M300 184L270 150" stroke="#b3b9c6" stroke-width="14" stroke-linecap="round"/>
      <path d="M100 184L130 150M300 184L270 150" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".5"/>
      <path class="paint" d="M40 150V112Q40 100 52 100H178L200 50Q205 38 220 38H282Q296 38 303 50L326 100H354Q374 100 374 120V150Q374 162 362 162H52Q40 162 40 150Z" fill="${p}" ${O}/>
      <path d="M198 98L216 56Q218 52 224 52H280Q287 52 290 58L310 98Z" fill="${GLASS}" ${O3}/>
      <path d="M160 156Q174 118 192 140Q202 110 218 138Q230 118 242 156Z" fill="#ff9a2e" ${O3}/>
      <path d="M174 156Q184 134 196 150Q206 130 218 150Q226 138 232 156Z" fill="#ffd93b"/>
      ${light(366, 124, 7, 10)}
      ${shineLine('M60 112H150', 5)}
      ${face({ eyes: [[236, 78], [272, 78]], r: 15, mouth: [342, 114, 24], cheeks: [[322, 116], [362, 114]] })}
      ${wheel(100, 186, 58, { tread: 12 })}${wheel(300, 186, 58, { tread: 12 })}`,
  },
  {
    id: 'tractor', name: 'Tractor', kind: 'car', paint: '#5cd65c', thanks: 'Putt putt! Thank you!',
    draw: (p) => `
      <rect x="302" y="70" width="12" height="52" rx="4" fill="#b3b9c6" ${O3}/>
      <path class="paint" d="M70 156V60Q70 46 84 46H192Q206 46 206 60V156Z" fill="${p}" ${O}/>
      <rect x="58" y="34" width="160" height="18" rx="9" fill="#ffd93b" ${O3}/>
      <rect x="88" y="62" width="100" height="74" rx="10" fill="${GLASS}" ${O3}/>
      <circle cx="160" cy="112" r="14" fill="none" stroke="${INK}" stroke-width="4"/>
      <path class="paint" d="M184 206V130Q184 118 196 118H350Q372 118 374 140V196Q374 206 364 206Z" fill="${p}" ${O}/>
      <path d="M362 132V194" stroke="${INK}" stroke-width="3.5"/><path d="M368 132V194" stroke="${INK}" stroke-width="3.5" opacity=".5"/>
      ${shineLine('M200 130H260', 5)}
      <path d="M34 168Q34 106 110 106Q186 106 186 168" fill="#ffd93b" ${O}/>
      ${face({ eyes: [[292, 144], [334, 144]], r: 16, mouth: [313, 164, 26], cheeks: [[264, 168], [358, 166]] })}
      ${wheel(110, 182, 62, { tread: 14, hub: '#ffd93b' })}${wheel(326, 212, 32, { hub: '#ffd93b' })}`,
  },
  {
    id: 'racecar', name: 'Race Car', kind: 'car', paint: '#9d5cff', thanks: 'Zoom zoom! Thank you!',
    draw: (p) => `
      <rect x="34" y="112" width="10" height="30" fill="#b3b9c6" ${O3}/>
      <rect x="12" y="100" width="58" height="16" rx="6" fill="${p}" ${O}/>
      <path class="paint" d="M28 202Q14 202 16 186L22 152Q24 138 40 138H160L184 116Q192 108 204 108H232Q246 108 254 118L270 138Q342 142 374 170Q386 180 382 192Q380 202 366 202Z" fill="${p}" ${O}/>
      <path d="M184 138L200 122Q204 118 210 118H230Q238 118 242 124L254 138Z" fill="${GLASS}" ${O3}/>
      <circle cx="226" cy="122" r="12" fill="#ffd93b" ${O3}/>
      <path d="M24 176H340" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
      <circle cx="140" cy="166" r="22" fill="#fff" ${O3}/>
      <path d="M134 156L143 151V181" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      ${light(370, 182, 6, 8)}
      ${face({ eyes: [[300, 138], [334, 148]], r: 15, mouth: [352, 176, 24], cheeks: [[318, 172]] })}
      ${wheel(92, 206, 36)}${wheel(310, 206, 36)}`,
  },
  {
    id: 'puppy', name: 'Puppy', kind: 'pet', paint: '#ffd2a6', thanks: 'Woof woof! Thank you!',
    draw: (p) => `
      <path d="M88 140Q50 122 58 82" fill="none" stroke="${INK}" stroke-width="25" stroke-linecap="round"/>
      <path class="paint-s" d="M88 140Q50 122 58 82" fill="none" stroke="${p}" stroke-width="15" stroke-linecap="round"/>
      <rect class="paint" x="92" y="176" width="34" height="68" rx="14" fill="${p}" ${O}/>
      <rect class="paint" x="226" y="176" width="34" height="68" rx="14" fill="${p}" ${O}/>
      <ellipse class="paint" cx="180" cy="160" rx="108" ry="56" fill="${p}" ${O}/>
      <rect class="paint" x="130" y="186" width="34" height="58" rx="14" fill="${p}" ${O}/>
      <rect class="paint" x="190" y="186" width="34" height="58" rx="14" fill="${p}" ${O}/>
      <path d="M118 128Q140 112 160 132Q150 156 126 150Z" fill="#a7663c" opacity=".85"/>
      <path d="M248 160Q262 128 290 140" fill="none" stroke="#ff4d5e" stroke-width="12" stroke-linecap="round"/>
      <circle cx="270" cy="160" r="8" fill="#ffd93b" ${O3}/>
      <circle class="paint" cx="300" cy="104" r="64" fill="${p}" ${O}/>
      <ellipse cx="238" cy="116" rx="21" ry="44" transform="rotate(22 238 116)" fill="#a7663c" ${O}/>
      <ellipse cx="362" cy="116" rx="21" ry="44" transform="rotate(-22 362 116)" fill="#a7663c" ${O}/>
      <ellipse cx="300" cy="138" rx="36" ry="26" fill="#fff3e6" ${O3}/>
      <ellipse cx="300" cy="126" rx="13" ry="9" fill="${INK}"/>
      <path d="M300 135V146" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      ${face({ eyes: [[276, 92], [324, 92]], r: 13, mouth: [300, 148, 26], cheeks: [[262, 126], [338, 126]] })}`,
  },
  {
    id: 'piggy', name: 'Piggy', kind: 'pet', paint: '#ff9ec7', thanks: 'Oink oink! Thank you!',
    draw: (p) => `
      <path d="M72 150Q44 150 50 128Q56 110 70 122Q80 134 64 138" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
      <path class="paint-s" d="M72 150Q44 150 50 128Q56 110 70 122Q80 134 64 138" fill="none" stroke="${p}" stroke-width="6" stroke-linecap="round"/>
      <rect class="paint" x="94" y="186" width="34" height="58" rx="12" fill="${p}" ${O}/>
      <rect class="paint" x="226" y="186" width="34" height="58" rx="12" fill="${p}" ${O}/>
      <ellipse class="paint" cx="176" cy="160" rx="112" ry="64" fill="${p}" ${O}/>
      <rect class="paint" x="132" y="192" width="34" height="52" rx="12" fill="${p}" ${O}/>
      <rect class="paint" x="190" y="192" width="34" height="52" rx="12" fill="${p}" ${O}/>
      <path class="paint" d="M254 64L262 20L296 52Z" fill="${p}" ${O}/>
      <path class="paint" d="M346 64L338 20L304 52Z" fill="${p}" ${O}/>
      <circle class="paint" cx="300" cy="112" r="62" fill="${p}" ${O}/>
      <path d="M262 50L266 32L284 48Z" fill="#ff7ac6"/><path d="M338 50L334 32L316 48Z" fill="#ff7ac6"/>
      <ellipse cx="300" cy="136" rx="30" ry="21" fill="#ffc2dc" ${O}/>
      <ellipse cx="290" cy="136" rx="5" ry="8" fill="${INK}"/><ellipse cx="310" cy="136" rx="5" ry="8" fill="${INK}"/>
      ${face({ eyes: [[274, 98], [326, 98]], r: 13, mouth: [300, 164, 24], cheeks: [[256, 134], [344, 134]] })}`,
  },
];

/** The whole vehicle as SVG content (no <svg> wrapper). */
export function vehicleMarkup(v, paint) {
  return v.draw(paint || v.paint);
}
