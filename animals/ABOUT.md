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
- `sounds/`: real recordings of each animal, trimmed to a short call, cleaned up (rumble filtered out,
  soft fades), evened out in loudness and saved as small mono MP3s (6 to 17 KB each; MP3 so that Safari 12
  can play them). They are free to use: most are CC0 from BigSoundBank, the rest are public domain or
  Creative Commons from Wikimedia Commons and OpenGameArt. `sounds/CREDITS.md` lists the source, author
  and license of every one.
- `js/sounds.js` loads and plays them with Web Audio (all are fetched on the first tap, and the service
  worker keeps them for offline play). `js/sound-data.js` holds each sound's length and when the animal's
  mouth should be open, measured from the loudness of the recording, so the mouth flaps in time.
- The grid picks the number of columns that gives the biggest tiles for the screen (3 × 5 on a phone,
  8 × 2 in landscape, 4 × 4 on a tablet).
- Saved with `createStore('animals')`: the star count.
- `window.__animals` exposes the quiz state for automated tests.
