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
  with ✏️). The 🗑️ button there lets you remove monsters.

## Notes

- Every part is SVG in `js/parts.js`; `monsterSVG()` stacks them (legs from the hips, body on the legs,
  head on the neck) so any combination fits together. Patterns are clipped to the body and head.
- The dance music is made live with the shared synth (`tone()` and `noise()`): a kick, clap, hi-hats,
  a bass line and a little melody, scheduled a moment ahead on the audio clock. The dance moves follow
  the same clock, so they stay on the beat.
- The monster only redraws while something is moving (a reaction, a blink, the dance), to stay light on
  older tablets.
