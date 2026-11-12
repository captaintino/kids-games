# Letter Tracing ✏️

Trace big letters and numbers with a chunky paint brush. The letter is drawn as a fat, soft band with a
dotted path in the middle, and the brush only paints **inside** the band, so every letter comes out neat.
The dots light up as the brush follows them, and each finished letter earns one to three stars.

## Modes

- 🔠 **ABC**: the big letters A to Z.
- 🔡 **abc**: the little letters a to z, on writing lines (top line, dashed middle line, baseline), with
  the tails of g, j, p, q and y hanging below.
- 🔢 **123**: the numbers 0 to 9.

Each mode opens a grid of big tiles. Finished ones show their best stars (⭐ to ⭐⭐⭐).

## How to play

- When a letter opens, it is said out loud with a word and a picture: "B! B is for ball!" ⚽.
  Numbers count out loud, and that many little stars pop up one by one. Tap the word strip to hear it again.
- The **green dot** with a number shows where the next stroke starts, and little **arrows** show which way to go.
  A glowing ball glides along the stroke to show the way (again whenever the kid pauses for a while).
- Paint along the dots. They turn gold as the brush reaches them, with a little rising note for each one.
  Finishing a stroke plays a chime and the green dot jumps to the next stroke.
- Strokes follow a kid-friendly order: top to bottom, left to right, straight lines first, then curves
  ("big line down, jump back to the top, little curve...").
- Painting outside the band simply does nothing. Scribbling far away from the next dot gets a gentle
  "Start at the green dot!" and the guide ball shows the way again.
- At the end: confetti, a cheer ("Wow! B! B is for ball!") and a card with the painted letter and 1 to 3
  stars. It is always positive; there is no "wrong".
- ↩️ tries the letter again, ➡️ goes to the next one, 🔤 goes back to the grid.
- Pick a brush color, or ✨ magic rainbow, from the palette.

## Scoring

Each stroke is sampled into dots about 16 units apart (on a 400 × 400 sheet). The dots must be reached in
order, within a tolerance a little wider than the band. The brush may cut a corner (skip up to three dots),
but skipped dots don't count. Stars come from how many dots were reached (65%) and how much of the
brushing stayed on the band (35%): 3 stars from 85%, 2 stars from 62%, otherwise 1 star.
Stars are saved per character (the best one counts).

## Tech

- Stroke data lives in `js/letters.js`: each character is a list of SVG path strings (center lines) on a
  400 × 400 sheet, plus the spoken name, the word and its emoji (or a small drawing for X and Y).
  To change a letter, edit its paths; the game measures them with `getTotalLength()`/`getPointAtLength()`.
- Layers on the paper: an SVG with the writing lines and the band's soft edge, a `<canvas>` with the band
  and the paint, and an SVG on top with the dots, arrows, start dot and guide ball.
- The "stay inside the lines" brush: the canvas first paints the band, then every brush stroke is drawn
  with `globalCompositeOperation = 'source-atop'`, so paint only sticks where the band already is.
  Strokes are kept as point lists and replayed after a rotation or resize.
- Saved with `createStore('tracing')`: stars per character and the last brush.
- Works on iOS 12 (touch-event fallback via the kit's `onPointer`, SMIL for the pulsing start dot, no newer
  JS/CSS). Layout: palette under the paper in portrait, beside it in landscape.
- `window.__tracing` exposes the state for automated tests.
