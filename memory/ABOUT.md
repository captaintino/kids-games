# Memory Match 🃏

Flip the cards and find the pairs! The card faces are the coloring pictures in their real colors,
and the backs are pink candy-stripe cards with a smiling star. It starts with 3 pairs and grows to 8.

## How to play

1. Tap **▶️ Play** to go on from where you were, or **🃏 Levels** to pick a level.
2. Tap a card to flip it over, then tap another one.
   - **A match!** Both cards do a happy bounce, sparkle, chime, glow a little and stay face up, and the
     picture's name is spoken ("Kitty!") and shown.
   - **Not a match:** after about a second the two cards gently flip back. Try again!
   - While two cards are showing, other taps wait, so nothing gets muddled.
3. Find every pair to win: confetti, cheers and stars. Then **➡️ Next** (bigger level) or **🔁 Again**
   (same size, new pictures). If nobody taps, the game moves on to the next level by itself after a few
   seconds (the Next button slowly fills up to show it).

## Levels

| Level | Cards |
| --- | --- |
| 3 pairs | 6 |
| 4 pairs | 8 |
| 5 pairs | 10 |
| 6 pairs | 12 |
| 7 pairs | 14 |
| 8 pairs | 16 |

The level picker shows each level as a little picture of its cards, plus your best stars. Every level is
always open. The cards are laid out in whatever grid makes them as big as possible, in portrait and landscape.

## Stars

Stars are generous: **3 stars** unless it took many extra tries. Extra tries are flips beyond the perfect
number of pairs; up to about one and a half extra tries per pair still gives 3 stars, up to three per pair
gives 2 stars, and finishing always gives at least 1. The best stars for each level are saved.

## Sticker book

Winning a level earns a sticker for the sticker book on the home screen (`earnSticker('memory')` from
`shared/js/rewards.js`, at most one every 45 seconds).

## Tech

- Card faces are the shared pictures (`shared/js/pictures.js`) turned into SVG images once and cached,
  so flipping is cheap on older tablets.
- The 3D flip uses `perspective`, `transform-style: preserve-3d` and `backface-visibility` with the
  `-webkit-` versions for Safari 12.
- The flip sound is built from the shared synth's `noise` and `tone` (a soft swish, then a tap).
- Progress is saved with `createStore('memory')`: best stars per level and the next level to play.
- `window.__memory` exposes the game state for automated tests.
