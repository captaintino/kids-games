# Build a Monster 👾

Mix and match heads, eyes, mouths, bodies, arms, legs and extras to build a silly monster, color it in,
then tap **Done!** and watch it dance to its own little song.

## How to play

- Tap 🛠️ **Build!** The tabs under the monster pick what to change: 👹 heads (horns, antennae, kitty
  ears, teddy ears, spikes, a unicorn horn, shaggy hair, frog eyes), 👀 eyes (two, one big eye, three,
  googly, sleepy, stars, hearts, eyes on stalks), 👄 mouths (big grin, fangs, tongue out, sharp teeth,
  buck teeth...), 👕 bodies, 💪 arms (noodle arms, claws, tentacles, tiny arms, strong arms, four arms),
  👟 legs (stubby, long with sneakers, four feet, tentacles, bird legs, a wheel, springs) and
  🦇 extras (bat wings, fairy wings, a dino tail, a curly tail, back spikes, a cape, a bow tie).
- Tap a picture in the row to choose it, or use the big ◀ ▶ arrows. Each change boings and the monster
  reacts: it bounces, giggles or blinks. Tapping a part of the monster jumps to that part's tab.
- 🎨 **Colors:** tap a color and the monster's tummy changes; then tap any part of the monster (head,
  arms, legs, wings) to paint it. 🪣 paints the whole monster. The pattern buttons add spots, stripes,
  stars or hearts.
- 🎲 **Surprise!** makes a random monster.
- ✅ **Done!** gives the monster a silly name (spoken out loud, like "Wobbly Bloop") and it dances:
  bouncing, waving its arms, rolling its eyes and twirling, with confetti. 🔁 dances again, ✏️ goes back
  to change it, 🆕 starts a new one. Tap the name to get a new silly name.
- 📷 saves a picture of the monster with its name.
- 👾 **My Monsters** keeps your last 12 finished monsters. Tap one to see it dance again (and change it
  with ✏️). The 🗑️ button there lets you remove monsters. Each monster has a 🍽️ button to feed it, and
  🎉 starts the parade.
- Every finished monster also goes to the shared art gallery (a square picture on a light, dotty
  background, titled with its name), so Jigsaw can turn it into a puzzle. Changing or renaming it
  replaces its old picture instead of adding another.

## 🍽️ Feed me!

After **Done!** (or from 🍽️ on the shelf) the monster gets hungry. Drag food from the tray (the drawn
foods in `shared/js/food.js`) to its mouth. Its eyes follow the food and its own mouth opens wider as the
food comes near (with its fangs, sharp teeth or buck teeth if it has them); it chomps with crumbs flying,
gulps, hops, says "Yum!" and its tummy grows. The tummy meter at the top fills with what it ate.
It hates broccoli: bring broccoli near and it leans away with its mouth shut; drop it there and it pulls
a silly face (squished eyes, tongue out, head shaking no) and the broccoli bounces back to the tray.
After five foods: a big BURP ("Excuse me! Hee hee!"), then a happy dance, and a sticker. 🔁 feeds it
again, 👍 goes back.

## 🎉 Parade

**Parade** (on the title and the shelf) marches every saved monster across a street under bunting and
balloons, in a line that loops forever, all dancing to a marching-band beat (oom-pah tuba, drums,
a brass tune and bells, made with the synth), with confetti every few bars. Each monster's name is
said as it passes the middle, and its name tag bounces. Tap a monster to make it jump, twirl and giggle.
With no saved monsters, the one being built marches alone.

## Notes

- Every part is SVG in `js/parts.js`; `monsterSVG()` stacks them (legs from the hips, body on the legs,
  head on the neck) so any combination fits together. Patterns are clipped to the body and head.
- The dance music is made live with the shared synth (`tone()` and `noise()`): a kick, clap, hi-hats,
  a bass line and a little melody, scheduled a moment ahead on the audio clock. The dance moves follow
  the same clock, so they stay on the beat.
- `js/beat.js` is the little step sequencer behind both songs (the dance and the parade). If the sound
  is muted or the page was hidden, it skips ahead instead of playing a pile of late notes.
- `js/feed.js` (Feed me!) and `js/parade.js` move the monsters' own SVG parts with `js/moves.js`
  (`partsOf`, `setPose`, `dancePose`, `marchPose`). `monsterSVG(m, { feed: true })` adds the
  wide-open mouth and the tongue, hidden until needed; the body and belly have ids so the tummy can grow.
- The parade only animates the monsters that are on screen.
- Stickers: `earnSticker('monster')` when a monster is done and when it has been fed until full (the
  sticker book gives at most one per game every 45 seconds).
- The monster only redraws while something is moving (a reaction, a blink, the dance), to stay light on
  older tablets.
