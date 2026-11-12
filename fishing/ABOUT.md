# Fishing Pond 🎣

A cozy fishing game. A cat in a little red boat floats on a sunny pond full of colorful, smiling sea
creatures. Tap the water and the cat casts the line; a fish always comes along. There is no way to fail.

## How to play

1. **Tap the water** anywhere. The boat glides over, the line flies out with a *plop* and ripples, and the
   hook sinks to where you tapped.
2. Fish nearby **notice** the hook (a "!" pops up) and swim over; a couple of others come to look too.
3. The bobber **dips, dips... and goes under!** The line reels the fish up while it wiggles, and it jumps
   out of the water with a splash.
4. The catch pops up on a **card** with its name (spoken out loud) and a **New!** ribbon the first time.
   Choose 💦 **Let go** (it dives back in with a splash and swims off happily) or 📖 **Keep** (the card
   flies into your Fish Book). Either way it is counted in the book.

If nobody bites within a few seconds, a fish swims in from the side, so every cast catches something.
Tap somewhere else while waiting to cast again. Tap near the bottom to fish for the crab.

## The fish

Eleven everyday creatures: Sunny Fish, Clown Fish, Blue Tang, Puffer Fish (it puffs up when caught!),
Angel Fish, Polka Dot Fish, Stripy Fish, Wiggly Eel, Jellyfish, Octopus and a Crab that walks along the
bottom.

**Rare ones** sparkle and glow: the **Golden Fish** (with a crown), the **Golden Puffer** and the
**Golden Angel** show up about once in 25 fish, and the **Rainbow Fish** is super rare. A rare catch
gets spinning light rays on its card, a golden tag, a fanfare and lots of confetti. Golden fish that
are not in the book yet are a bit more likely to come, and rare fish are the first to notice the hook.

## Fish Book 📖

Every species has a card: the ones you caught are in color with how many times you caught them, the rest
are dark silhouettes with a "?". Golden and rainbow fish have special shiny frames. Tap a card to hear its
name. Find all 15 for a big celebration. Saved on the device (`kids-games.fishing`).

## Little extras

- A duck paddles by now and then. Tap it: *quack!*
- Tap a fish on the title screen and it zooms off with bubbles.
- Bubbles rise from the swaying seaweed, light rays shimmer, clouds drift, the sun smiles.

## Tech

- The whole pond is the game's own picture, painted once into a cached canvas (`js/scene.js`); the shared
  world background is hidden on this page.
- Fish are drawn in `js/fish.js`: tailed fish are a body sprite plus a tail sprite that wags around its
  joint; the crab has walking frames; the eel, jellyfish and octopus are drawn live from a few strokes.
  The same code makes the card pictures and the book silhouettes.
- Pixel budget and automatic quality steps on slow devices (`js/engine.js`, shared in copy with Catch the
  Falling Stars). Synthesized sounds (`js/sounds.js`). Works back to iOS 12.
