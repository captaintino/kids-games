# Play Party 🎈

A box of happy games for little kids (about 2 to 7), built for phones and tablets. One home screen
with a big tile for every game; no reading needed to play, and nobody ever loses.

It's an installable **Progressive Web App**: once it has loaded, every game works fully offline.

## The games

**Pop & Color**
- 🎈 **Bubble Pop Party** (`bubbles/`): pop the floating bubbles. 12 levels, Endless, Endless Immortal,
  and the 🎓 **Learn** modes: **Count & Pop** ("Pop 5 bubbles!", counted out loud), **Shape Pop**
  ("Pop the stars!") and **Letter Pop** ("Pop the B!").
- 🎨 **Color Splash Party** (`coloring/`): 60 pictures (animals, nature, yummy food, fun stuff,
  vehicles, dinosaurs, ocean and party) to color with Tap & Fill, Paint, Color by Number and Magic
  Reveal, plus ✏️ **Draw**: blank pages with brushes, magic paints, an eraser and stamps.

**Pictures & Puzzles**
- 🧩 **Jigsaw Puzzles** (`jigsaw/`): the coloring pictures cut into 4, 6, 9, 12 or 16 pieces that snap
  into place. **My Pictures** turns the kid's own art into puzzles: colored pictures, drawings, spin
  paintings, butterflies, monsters and sticker scenes.
- 🃏 **Memory Match** (`memory/`): flip cards to find pairs of pictures, from 3 pairs up to 8, with
  sparkles and the picture's name on every match.
- 🎩 **Sticker Scene** (`stickers/`): drag over 100 stickers onto any of nine worlds. Hats and glasses
  snap onto the friends to dress them up. Save it as a picture.
- ✏️ **Dot-to-Dot** (`dots/`): connect 10, 15 or 25 numbered dots (or A to Z) to reveal a coloring
  picture, with every number said out loud.

**Learn & Play**
- 🔺 **Shapes & Colors** (`sorter/`): drop shapes into a shape-sorter board, or fruit into the right
  color basket. Every shape and color is said out loud.
- 🔢 **Count & Pop**, 🔷 **Shape Pop** and 🅰️ **Letter Pop**: the learning modes of Bubble Pop (their
  tiles open them directly).
- 🔤 **Letter Tracing** (`tracing/`): trace A–Z, a–z and 0–9 along dotted paths with a brush that stays
  inside the letter ("B! B is for ball!"), trace your own name, and trace simple words like cat and sun.
- 🐮 **Animal Sounds** (`animals/`): tap 15 animals to hear their real sounds (free recordings), then
  play "Who says moo?".

**Music & Making**
- 🎹 **Music Time** (`music/`): a rainbow xylophone, drums and a big-key piano. **Follow the Lights**
  teaches 8 simple songs a few notes at a time.
- 🌀 **Spin Art** (`spinart/`): fling paint on a spinning disc, fold butterfly paintings that mirror
  both sides, make bubble prints and splatter paintings, and hang the best ones on the **Gallery** wall.
- 👾 **Build a Monster** (`monster/`): mix and match heads, eyes, mouths, bodies and legs, paint them,
  and watch the monster dance. **Feed** your monster, and send all your monsters on a **Parade**.

**Just for Fun**
- ⭐ **Catch the Stars** (`stars/`): slide a basket to catch falling stars, or snowflakes, leaves,
  blossoms and summer fruit in the four seasons. Caught stars fill in constellations for **My Sky**.
- 🎣 **Fishing Pond** (`fishing/`): tap the water to drop a line and catch 38 kinds of fish at the pond,
  the ocean, an ice-fishing hole and a jungle river, including rare golden ones. Kept fish swim in the
  **Aquarium**.
- 🍌 **Feed the Animal** (`feed/`): feed six hungry friends. They love their favorites and make a silly
  face at broccoli.
- 🚗 **Car Wash** (`carwash/`): soap, rinse, dry, shine and decorate muddy cars, trucks and pets.

Each game folder has an `ABOUT.md` with more detail.

**📒 Sticker book:** finishing things in any game (a level, a puzzle, a picture, a song) earns a
sticker. The **My Stickers** button on the home screen shows the album.

**🔒 Grown-up corner:** hold the Grown-ups button at the bottom of the home screen for 3 seconds to set
the kid's name (used by Letter Tracing), the sound and voice volume, a daily play-time limit (a gentle
"Time for a break!" screen; hold its lock to add time), how much the background worlds move (Auto,
Full, Light, Minimal or Still), a low-performance mode that stops the looping decorations on buttons,
tiles and mascots (hints that show where to tap keep working), which games show on the home screen, and whether stickers are earned. Its **About this app** card shows the version that is running and which
offline copy is stored, for debugging, and has a **Check for updates** button that downloads a new
version right away and restarts into it.

**Worlds:** the 🌍 button on the home screen picks the background for every game: Party, Under the
Sea, Wild West, Knights & Castles, Outer Space, Farm, City, Winter or Birthday Party. (Bubble Pop keeps
its own five.) The sound button in any game turns sound and speech off everywhere.

## How it's built

- No build step and no dependencies: plain HTML, CSS and ES modules. Every picture is drawn in SVG or
  on a canvas, and almost every sound is made live with the Web Audio API. The only audio files are the
  short animal recordings in `animals/sounds/` (credited in `animals/sounds/CREDITS.md`).
- Spoken words use the browser's built-in speech. Everything spoken is also shown, so games still work
  on devices without a voice.
- `shared/` holds what the games have in common: the look, sounds, speech, the background worlds, the
  coloring pictures, and a small game kit. See [`shared/README.md`](shared/README.md).
- Works back to iOS 12 / Safari 12 (e.g. the original iPad Air): touch-event fallback when Pointer Events
  are missing, and no newer JS/CSS syntax.
- Progress is saved on the device (`localStorage`).

```
index.html, js/hub.js, css/hub.css   the home screen with the game tiles
sw.js, manifest.webmanifest, icons/  offline support and installing
shared/                              the shared kit (see shared/README.md)
<game>/                              one folder per game
_template/                           a starting point for a new game
tools/update-sw.py                   refreshes the offline file list
```

## Hosting on GitHub Pages

1. Go to **Settings → Pages** in this repository.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*, then pick the branch and the `/ (root)` folder.
3. The games will be published at `https://<user>.github.io/kids-games/`.

Every path is relative, so it works from a subfolder like this. Pages serves it over HTTPS, which
service workers need.

**Installing it:** open the home screen on the phone or tablet.
- Android/Chrome: tap the **Install** button at the bottom of the home screen, or use *Add to Home screen* in the menu.
- iPhone/iPad: tap **Install** for step-by-step instructions (Share, then **Add to Home Screen**).

The whole collection installs as one app called Play Party.

### Updating

After changing, adding or removing any file, run:

```bash
python3 tools/update-sw.py
```

It refreshes the list of files in `sw.js` and bumps its `VERSION`, so installed copies download the
new files. It also writes `js/version.js`, the version shown in the grown-up corner.

### Adding a game

Copy `_template/`, add a tile to `SECTIONS` in `js/hub.js`, and run `tools/update-sw.py`.
`shared/README.md` explains the kit and the rules that keep games working on old iPads.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Service workers work on `localhost` without HTTPS.

## Credits

The [Fredoka](https://github.com/hafontia/Fredoka-One) font is included in `shared/fonts/` under the
SIL Open Font License.
