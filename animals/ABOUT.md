# Animal Sounds 🐮

Fifteen friendly animals that moo, oink, quack and roar. Tap one to hear its sound and watch it bounce,
or play "Who says...?" and find the animal that made the sound.

## Modes

- 🐮 **Tap & Hear**: all the animals in a big grid (a barnyard of picture cards). Tap one: it makes its
  sound, jumps and squashes, opens its mouth (the elephant lifts its trunk), and a speech bubble shows the
  sound word ("MOO!"). Then the name is said out loud: "The cow says moo!" (or just "Cow!" on the next tap).
  When nobody is tapping, an animal hops now and then to invite a tap.
- ❓ **Who Says...?**: "Who says moo?" is spoken and shown, then the sound plays (🔊 plays it again).
  Pick the right animal from 2 choices, then 3 after a few right answers, then 4.
  - Right: the animal sings, sparkles and confetti, a cheer, and a ⭐ for the star counter.
    Every 5 stars: "Animal expert!"
  - Not that one: that animal plays its own sound and wiggles ("That's the dog! Woof!"), then the question
    is asked again. After two misses the right animal glows to help. Nobody loses, there is no timer.

The animals: cow, pig, duck, dog, cat, sheep, horse, chicken, frog, lion, owl, bee, elephant, mouse and monkey.
Tap the little animals on the title screen too.

## Tech

- `js/animals.js`: the portraits, drawn as SVG shapes on a 400 × 400 sheet with the shared helpers
  (`S`, `I`, `D`, `eye`, `circle`, `ellipse`, `cloud`...) and rendered with `pictureMarkup()` from
  `shared/js/art.js`, so they have the same thick ink outlines as the coloring pages. The cat, dog, pig,
  frog, owl and bee reuse the coloring pictures (scenery dropped, cropped with a `viewBox`); the others are
  drawn here. Shapes wrapped in `shut(...)` show while the animal is quiet and `open(...)` while it sings.
- `js/sounds.js`: every sound is synthesized with Web Audio: oscillators with pitch envelopes, vibrato and
  tremolo LFOs, formant filters, and filtered noise (a moo is a low sawtooth through a sweeping resonant
  low-pass, a quack is a nasal square chirp through a narrow band-pass, the bee is a detuned buzzy saw with
  vibrato...). Each animal lists its syllables, which drive the mouth flaps. Levels were balanced by
  rendering each sound offline. `render(id, ctx, out)` can play into any `AudioContext`.
- The grid picks the number of columns that gives the biggest tiles for the screen (3 × 5 on a phone,
  8 × 2 in landscape, 4 × 4 on a tablet).
- Saved with `createStore('animals')`: the star count.
- `window.__animals` exposes the quiz state for automated tests.
