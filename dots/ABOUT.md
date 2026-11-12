# Dot to Dot 🔢

Connect the numbered dots in order and a picture appears! The dots sit on the outline of one of the
coloring pictures (a kitty, a rocket, a castle...). When the last dot is joined, the line closes, the
full colored picture fades in with sparkles, and its name is said out loud.

## Modes

The title screen has four big buttons:

- ● **1–10** (easy): 10 dots.
- ●● **1–15** (medium): 15 dots.
- ●●● **1–25** (hard): 25 dots.
- 🔤 **A–Z**: 26 dots with the letters A to Z instead of numbers.

Each one opens a grid of 25 pictures. A picture's three stars show which of easy, medium and hard it
has been finished in, a small **A** shows it was done with letters, and a green ✓ marks the ones finished
in the mode that is open. The total number of stars is shown on the title screen.

## How to play

- "Start at one!" The next dot is pink with a gently pulsing ring, and the big gold badge at the top
  shows its number (or letter). Tap the badge to hear it and make the dot glow.
- **Tap** the dots one after another, or **drag** from dot to dot: a dotted rubber band follows the finger
  and each dot it reaches joins on. Every dot pops, draws its line and is said out loud
  ("one, two, three…" or "A, B, C…"). The dots are small, but a finger anywhere near the next dot counts.
- Tapping a different dot gives a soft boing: that dot wiggles, the right one glows and its number is said.
  After a quiet while the right dot glows again ("Find seven!").
- 👁️ shows or hides the faint picture behind the dots (saved).
- The progress bar at the bottom fills up as the dots are joined.
- At the end: the line closes, the picture fades in, its name is said, confetti and a cheer, a sticker
  for the sticker book, and a card with ➡️ next picture, ↩️ again, 🖼️ all pictures.

## Tech

- `js/curated.js` lists the 25 pictures (easiest first) and which parts of each make the outline:
  without config, every colorable part that does not touch the edge of the sheet (so not the sky, grass or
  sea); `skip` leaves out loose bits like a sun or a cloud, `parts` lists them exactly.
- `js/outline.js` finds the outline at run time: the parts are filled together on a 200 × 200 canvas,
  the biggest blob is kept (holes filled), and its edge is followed pixel by pixel (Moore tracing).
  The dots are chosen in two steps: Visvalingam–Whyatt simplification finds the most important points,
  the sharp corners among them (ears, star tips, roof) are kept, and the remaining dots are spread evenly
  along the outline between them. Dot 1 is the top one, and the order goes clockwise. Each number is placed
  just outside the shape, turned a little when it would bump into another dot, line or number.
  The whole thing takes a few milliseconds per picture.
- The sheet is one SVG (viewBox −16 … 416, so numbers near the edge fit): the faint line drawing, the
  colored picture (hidden until the end), the lines (polylines, the newest segment grows over 0.16 s),
  the rubber band, the pulse/glow rings and the dots. Animations run in the kit's frame loop and only touch
  a few attributes, and only while the play screen is up.
- Saved with `createStore('dots')`: which modes each picture was finished in, the 👁️ setting, the last mode.
- Calls `earnSticker('dots')` on every finished picture.
- Works on iOS 12 (touch-event fallback via the kit's `onPointer`, `Path2D` and `getBBox` for the outline,
  no newer JS/CSS). Layout: buttons above the paper in portrait, beside it in landscape.
- `window.__dots` exposes the state (`G`, `open(mode, id)`, `dotScreen(i)`) for automated tests.
