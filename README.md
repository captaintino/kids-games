# Play Party 🎈

A box of happy games for little kids (about 2 to 7), built for phones and tablets. One home screen
with a big tile for every game; no reading needed to play, and nobody ever loses.

It's an installable **Progressive Web App**: once it has loaded, every game works fully offline.

## The games

**Pop & Color**
- 🎈 **Bubble Pop Party** (`bubbles/`): pop the floating bubbles. 12 levels, Endless, Endless Immortal,
  and **Count & Pop**, where "Pop 5 bubbles!" is counted out loud as each one pops.
- 🎨 **Color Splash Party** (`coloring/`): 36 pictures to color with Tap & Fill, Paint, Color by Number
  and Magic Reveal.

**Pictures & Puzzles**
- 🧩 **Jigsaw Puzzles** (`jigsaw/`): the coloring pictures cut into 4, 6 or 9 big pieces that snap into
  place. **My Pictures** turns the kid's own colored pictures into puzzles.
- 🃏 **Memory Match** (`memory/`): flip cards to find pairs of pictures, from 3 pairs up to 8, with
  sparkles and the picture's name on every match.
- 🎩 **Sticker Scene** (`stickers/`): drag 78 stickers onto any of the five worlds. Hats and glasses
  snap onto the friends to dress them up. Save it as a picture.

**Learn & Play**
- 🔺 **Shapes & Colors** (`sorter/`): drop shapes into a shape-sorter board, or fruit into the right
  color basket. Every shape and color is said out loud.
- 🔢 **Count & Pop**: the counting mode of Bubble Pop (the tile opens it directly).
- ✏️ **Letter Tracing** (`tracing/`): trace A–Z, a–z and 0–9 along dotted paths with a brush that stays
  inside the letter. "B! B is for ball!"
- 🐮 **Animal Sounds** (`animals/`): tap 15 animals to hear their real sounds (free recordings), then
  play "Who says moo?".

**Music & Making**
- 🎹 **Music Time** (`music/`): a rainbow xylophone, drums and a big-key piano. **Follow the Lights**
  teaches 8 simple songs a few notes at a time.
- 🌀 **Spin Art** (`spinart/`): fling paint on a spinning disc, fold butterfly paintings that mirror
  both sides, and make bubble prints.
- 👾 **Build a Monster** (`monster/`): mix and match heads, eyes, mouths, bodies and legs, paint them,
  and watch the monster dance.

**Just for Fun**
- ⭐ **Catch the Stars** (`stars/`): slide a basket to catch falling stars. Rain clouds just make it
  soggy for a moment.
- 🎣 **Fishing Pond** (`fishing/`): tap the water to drop a line and catch 15 kinds of fish, including
  rare golden ones and a rainbow fish, and collect them in the Fish Book.
- 🍌 **Feed the Animal** (`feed/`): feed six hungry friends. They love their favorites and make a silly
  face at broccoli.

Each game folder has an `ABOUT.md` with more detail.

**Worlds:** the 🌍 button on the home screen picks the background for every game: Party, Under the
Sea, Wild West, Knights & Castles, or Outer Space. The sound button in any game turns sound and
speech off everywhere.

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
new files.

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
