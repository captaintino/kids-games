# Letter Tracing ✏️

Trace big letters and numbers with a chunky paint brush. The letter is drawn as a fat, soft band with a
dotted path in the middle, and the brush only paints **inside** the band, so every letter comes out neat.
The dots light up as the brush follows them, and each finished letter earns one to three stars.

## Modes

- 🔠 **ABC**: the big letters A to Z.
- 🔡 **abc**: the little letters a to z, on writing lines (top line, dashed middle line, baseline), with
  the tails of g, j, p, q and y hanging below.
- 🔢 **123**: the numbers 0 to 9.
- ⭐ **My Name**: trace the kid's own name, letter by letter. The name comes from the grown-up corner
  (`kidName()`). If none is set, a card says (and shows) "Ask a grown-up to type your name!": a grown-up holds
  the ✋ button for 3 seconds (`holdGate()`), types the name and taps ✏️ *Let's write it!*. The name is saved in
  the grown-up settings (`grownups.data.name` + `saveGrownups()`). Upper- and lowercase are traced as typed
  (Maya = big M, then little a, y, a); accents are dropped (Zoë → Zoe) and anything else that can't be traced
  (spaces, dashes) is skipped.
- 📖 **Words**: 28 simple three- and four-letter words in little letters (cat, dog, pig, cow, hen, fox, owl, bee,
  ant, sun, bus, car, hat, cup, bed, egg, fish, frog, duck, bear, bird, ball, cake, star, tree, moon, boat,
  milk), each with a picture: the colored drawings from the coloring book where there is one, else an emoji.

Each mode opens a grid of big tiles. Finished ones show their best stars (⭐ to ⭐⭐⭐).

### Names and words

- The word strip above the paper shows the picture (or a smiling star for a name) and the letters in a row:
  dashed boxes still to do, the current one glowing, done ones filled in orange with a pop.
- Each letter is traced with the normal tracing (same band, dots, arrows and start dot); when it is done the
  next one opens by itself after a little cheer. ↩️ redoes the current letter; ➡️ skips to the next word
  (hidden for a name); ⬅️ goes back to the words (or the title for a name).
- At the start the name or word is spoken ("Maya! Let's write your name! M!"), each letter is named as it
  comes up, and at the end there is a big celebration: "Maya! You wrote your name!" with extra confetti, or
  "C, A, T. Cat! You wrote cat!". The finish card shows the whole painted word (every letter side by side), the
  picture and the stars (the average of the letters). Stars are saved per word and per name, and each letter
  also counts towards its own tile in ABC or abc.
- Tap the word strip to hear the word (spelled) or name again.

### Stickers

Finishing a letter, a number, a word or a name earns a sticker for the sticker book
(`earnSticker('tracing')`, at most one every 45 seconds; writing your name always gives one).

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
  and the paint, an SVG with the dots and arrows, and on top the start dot and the guide ball as small layers
  that pulse and glide with CSS transforms only (so the dots SVG is not repainted every frame).
- The "stay inside the lines" brush: the canvas first paints the band, then every brush stroke is drawn
  with `globalCompositeOperation = 'source-atop'`, so paint only sticks where the band already is.
  Strokes are kept as point lists and replayed after a rotation or resize.
- Saved with `createStore('tracing')`: stars per character and the last brush.
- Works on iOS 12 (touch-event fallback via the kit's `onPointer`, a CSS animation for the pulsing start dot, no newer
  JS/CSS). Layout: palette under the paper in portrait, beside it in landscape.
- Words live in `js/words.js` (`WORD_LIST`: the word plus a picture id from `shared/js/pictures.js` or an emoji).
- `window.__tracing` exposes the state for automated tests (`open`, `openWord`, `openName`, `traceable`).
