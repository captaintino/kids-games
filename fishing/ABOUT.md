# Fishing Pond 🎣

A cozy fishing game. A cat in a little boat floats on a sunny pond (or the ocean, the ice, a jungle river) full of colorful, smiling sea
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

## Four places to fish

**🎣 Fish!** opens a picker with four big picture tiles (each shows how many of its fish you found):

- 🏞️ **Pond**: the sunny pond with the dock, the cattails and the duck.
- 🌊 **Ocean**: a pier with a life ring, a lighthouse island, seagulls, bigger waves, deep blue water,
  corals, and a big friendly **whale** that glides past far in the background now and then. The cat's
  boat is blue here.
- 🧊 **Ice fishing**: the cat sits on a sled on the ice (wearing a bobble hat), next to an igloo and a
  **penguin** friend (tap it: it flaps). The line goes down one of the two **holes in the ice**, and the
  hook then swims over to wherever you tapped. A **seal** pops up from a hole now and then (tap it: "arf
  arf").
- 🌴 **Jungle river**: a canoe (and an explorer's hat), vines, big leaves, palms, a parrot, a sunken log,
  and a **frog on a lily pad** (tap it: ribbit and a hop).

## The fish

**Pond** (15): eleven everyday creatures: Sunny Fish, Clown Fish, Blue Tang, Puffer Fish (it puffs up when caught!),
Angel Fish, Polka Dot Fish, Stripy Fish, Wiggly Eel, Jellyfish, Octopus and a Crab that walks along the
bottom.

**Rare ones** sparkle and glow: the **Golden Fish** (with a crown), the **Golden Puffer** and the
**Golden Angel** show up about once in 25 fish, and the **Rainbow Fish** is super rare. A rare catch
gets spinning light rays on its card, a golden tag, a fanfare and lots of confetti. Golden fish that
are not in the book yet are a bit more likely to come, and rare fish are the first to notice the hook.

**Ocean** (9): Parrot Fish, Little Shark (a friendly toothy smile), Swordfish, Stingray (flapping
wings), Sea Turtle (paddling flippers), Seahorse (upright, fluttering fin), Lobster (walks on the bottom),
and the rare **Golden Seahorse** and **Golden Turtle**.

**Ice** (7): Arctic Char, Ice Fish, Polar Cod, Baby Narwhal, Snow Crab, Moon Jelly, and the rare
**Golden Char**.

**Jungle river** (7): Piranha (cute, with two little teeth), Neon Tetra, Discus Fish, Catfish (whiskers),
Fancy Guppy, River Turtle (red ears), and the rare **Golden Piranha**.

## Fish Book 📖

Every species has a card: the ones you caught are in color with how many times you caught them, the rest
are dark silhouettes with a "?". Golden and rainbow fish have special shiny frames. Tap a card to hear its
name. The book has a **tab for each place** (with its count); it opens on the place you are fishing in.
Finding every fish of a place gives a big celebration. Saved on the device (`kids-games.fishing`).

## 🐠 Aquarium

Every fish you **📖 Keep** also moves into your aquarium (title screen button): a glass tank in a cozy
room, with sand, colorful pebbles, swaying plants, an air stone and a treasure chest that pops open with
bubbles (tap it too). Up to 20 of your most recently kept fish swim around at once, using their own
drawings and swim animations (crabs and the lobster walk on the sand).

- **Tap a fish**: it does a happy flip (a hop for the walkers), says its name and blows a bubble.
- **🍤 Feed**: food flakes sprinkle in and sink; the fish swim over and gobble them up.

Kept fish are saved as a list (`tank`, the last 60). Older saves get their kept pond fish moved in.

## Stickers

`earnSticker('fishing', { cooldown: 0 })` for golden and rainbow fish and for finishing a place;
`earnSticker('fishing')` for every other catch (new species included), so the shared cooldown hands one
out every few catches.

## Little extras

- A duck paddles by now and then. Tap it: *quack!*
- Tap a fish on the title screen and it zooms off with bubbles.
- Bubbles rise from the swaying seaweed, light rays shimmer, clouds drift, the sun smiles.

## Tech

- Each place is the game's own picture, painted once into a cached canvas (`js/scene.js`: `paintPond`,
  `paintOcean`, `paintIce`, `paintJungle`, and `paintTank` for the aquarium); the shared world background
  is hidden on this page. The friends (whale, seal, penguin, frog, chest) are small pre-rendered sprites.
- Fish sprites are now made the first time a species is needed (there are 38).
- Fish are drawn in `js/fish.js`: tailed fish are a body sprite plus a tail sprite that wags around its
  joint; the crab and the lobster have walking frames; the stingray has three wing frames; turtles are a
  shell sprite with flippers that paddle; seahorses have two fin frames; the eel, jellyfish and octopus are drawn live from a few strokes.
  The same code makes the card pictures and the book silhouettes.
- Pixel budget and automatic quality steps on slow devices (`js/engine.js`, shared in copy with Catch the
  Falling Stars). Synthesized sounds (`js/sounds.js`). Works back to iOS 12.
