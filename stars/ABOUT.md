# Catch the Falling Stars ⭐

A gentle catching game for little kids. Slide the smiling basket along the bottom of the night sky
(or a winter, autumn, spring or summer sky) to catch what falls. Nobody loses: there are no hearts, no timer and no game over.

## How to play

- **Drag anywhere** on the screen and the basket walks to your finger. With a mouse, the basket simply
  follows the pointer. The **← →** arrow keys work too.
- Every star you catch pops with a "+1" in its own color, chimes a little higher each time, and piles up
  in the basket.
- Every **10 stars** there is confetti and the number is spoken out loud ("Twenty stars!"). Every 50 gets a
  big banner.
- The pace picks up gently for about two minutes, then stays the same.
- **⏸** pauses. **⏹️** stops and shows a happy card with the stars you caught and your best.

## Special things in the sky

- 🌠 **Shooting star**: zooms in from the side with a glowing tail. Worth 5 stars!
- 🌈 **Rainbow star**: every star on the screen zooms into your basket (and raindrops turn to sparkles).
- 🌙 **Sleepy moon**: everything falls slowly for a while. A dreamy glow and a 🌙 chip show it is on.
- ☁️ **Rain clouds** drift across the top and drop raindrops. Catching one does not hurt: the basket just
  gets soggy, droops and drips with a funny "splish", and stars bounce off it for about two seconds
  (they can still be caught when they come back down!).

Each special shows up early at least once, so kids discover them all.

## Five skies (big picture tiles on the title screen)

Tap a tile to play. Each sky has its own falling things, backdrop, sounds, specials and gentle "oops".

| Tile | Catch | Specials | The gentle "oops" |
| --- | --- | --- | --- |
| 🌙 **Night Sky** | colorful stars | 🌠 shooting star, 🌈 rainbow star, 🌙 sleepy moon | ☁️ rain cloud: soggy basket |
| ❄️ **Winter** (snowy village, snowman, falling snow, sleigh bells) | snowflakes in five colors | golden snowflake, rainbow snowflake, ☕ cozy cocoa (slow) | snow cloud drops a snow clump: the basket gets a snow cap and shivers "Brrr!" |
| 🍂 **Autumn** (orange trees, barn, pumpkins) | maple leaves, round leaves, acorns | golden leaf, rainbow leaf, 🎃 sleepy pumpkin (slow) | drizzle cloud drops mud: "Splat!", muddy splotches. Plus **wind gusts**: everything swirls sideways for a moment, with wind curls and a whoosh |
| 🌸 **Spring** (meadow, tulips, blossom trees, birds) | blossoms, daisies, fluttering butterflies | golden butterfly, rainbow butterfly, 🐌 slow snail | a light **rain shower** cloud: "Puddle splash!"; after a shower, a rainbow |
| ☀️ **Summer** evening (sunset, fireflies, crickets) | strawberries, oranges, watermelon, cherries, glowing fireflies | golden star fruit, rainbow beach ball, 🌅 sleepy sun (slow) | a pink cloud drops water balloons: "Sploosh!" |

The fast special is worth 5, the rainbow one pulls everything on the screen into the basket, and the
slow one makes everything fall slowly for a while. Every sky keeps its own best score.

- 🐢 **Calm** (a switch on the title screen): no clouds and a slower pace, in every sky. Calm keeps its own
  best scores.
- 🌍 **World**: pick the background for the night sky. *Night Sky* (the game's own sky) is shown for the
  Paint Party world; the other shared worlds work too.

## 🌌 My Sky: constellations

Every catch sends a sparkle up to the little picture under the score, and one more dot of a
constellation lights up and joins the last one with a line. A picture takes 15 to 22 catches (a fast
special lights 5 dots at once). When the last dot lights up, the play pauses for a short show: the
constellation flies to the middle of the screen, a cute glowing creature is drawn around the dots, its
name is shown and spoken, and there is confetti and a sticker. Tap to skip the show.

There are 14 pictures (heart, fish, bunny, rocket, teddy bear, kite, kitty, whale, butterfly, turtle,
duck, owl, snail, dinosaur), found in order, then at random. All skies (night and seasons) fill the same
sky. **🌌 My Sky** (title screen and result card) shows every picture: found ones glow with their
creature, the one being filled shows its lit dots, the rest are faint dots with a "?". Tap one to hear
its name.

## Tips

- The basket gives a gentle helping hand: stars falling just beside it drift in.
- On the title screen you can tap the falling stars just for fun.
- Best scores, the chosen sky, the calm switch and the constellations are saved on the device
  (`kids-games.stars`: `bests`, `bestsCalm`, `sky`, `con`, `lit`; the old `best`/`bestCalm` still hold the
  night sky's).

## Stickers

`earnSticker('stars')` at every 10-catch milestone (the shared cooldown spaces them out) and
`earnSticker('stars', { cooldown: 0 })` for every finished constellation.

## Tech

- Canvas game in the style of Bubble Pop Party: every star, the moon, the clouds and the basket faces are
  pre-rendered once into sprites (`js/art.js`), so a frame is mostly `drawImage` calls.
- `js/seasons.js`: each season's sprites (built the first time the season is used) and its backdrop
  painter (painted once into a cached canvas). The ambient snow, leaves, butterflies and fireflies are a
  few sprites each.
- `js/sky.js`: the constellations (dots in a 100 x 100 box, lines, and the creature drawn with smooth
  curves through the same dots). A finished picture is cached as a sprite for the show.
- The canvas has a pixel budget, and the quality steps down by itself (fewer pixels and particles) if
  frames get slow (`js/engine.js`, shared in copy with Fishing Pond).
- All sounds are synthesized (`js/sounds.js` builds on the kit's synth). Works back to iOS 12.
