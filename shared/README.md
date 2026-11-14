# Shared kit

Everything the games have in common lives here, so each game folder only holds its own game.
Bubble Pop Party (`bubbles/`) and Color Splash Party (`coloring/`) came from their own repos and
still carry most of their own code; every newer game is built on this kit.

| File | What it does |
| --- | --- |
| `css/kit.css` | The shared look: Fredoka font, screens, candy buttons (`.btn .btn-pink`...), round buttons, glassy `.card`, the bouncing `.logo`, banner, result stars, `.hud` top bar, `.pill`, `.tile-grid`/`.tile` pickers, `.wiggle`/`.bounce` helpers. |
| `js/kit.js` | `boot()` plus helpers: the animated background world, effects (`fx.burst`, `fx.sparkles`, `fx.confetti`, `fx.text`...), `banner()`, `celebrate()`, `showScreen()`, the Android back button, the sound button, `onPointer()` for touch/mouse, `createStore()` for saving, `saveImage()` for "save my picture". |
| `js/audio.js` | Web Audio synth. Ready-made sounds (`pop`, `boing`, `chime`, `sparkle`, `whoosh`, `win`, `click`, `splash`, `pick`, `shimmer`, `scribble`...) and the building blocks `tone()`, `noise()`, `ready()`, `context()`, `output()` for making new ones. |
| `js/speech.js` | Spoken words with the browser's text-to-speech: `say('Circle!')`, `numberWord(3)`. |
| `js/scenes.js` | The nine background worlds (Paint Party, Under the Sea, Wild West, Knights & Castles, Outer Space, Farm, City, Winter, Birthday Party): `SCENES`, `paintScene(ctx, w, h, id, palette)`, `createAnimator(id)`. |
| `js/pictures.js` | The 36 coloring pictures (`PICTURES`), the `PALETTE`, and the path helpers (`circle`, `ellipse`, `rect`, `poly`, `star`, `cloud`, `S`, `I`, `D`, `BG`, `eye`). |
| `js/art.js` | Turns a picture into SVG (`pictureMarkup`, `svgOpen`) and into a canvas (`svgToCanvas`). |
| `js/food.js` | 32 drawn fruit, veg and snacks (`FOODS`, `foodSvg`), used by Shapes & Colors and Feed the Animal. |
| `js/store.js` | `createStore(name, defaults)`: saving on the device. No side effects, so any page can use it (the kit re-exports it). |
| `js/rewards.js` | The sticker book: `earnSticker('mygame')` when a kid finishes something shows a "New sticker!" pop-up and adds a sticker to the album on the home screen (at most one per game every 45 seconds). The stickers are the Sticker Scene art. |
| `js/gallery.js` | Saved artwork: `addArt(canvas, { game, title })`, `listArt()`. Jigsaw turns these into puzzles. |
| `js/grownups.js` | The grown-up corner settings (kid's name, volumes, daily play limit, hidden games, stickers on/off), `holdGate()` for hold-3-seconds buttons, and the "Time for a break!" screen. `boot()` starts it; pages without the kit call `startGrownups()`. |
| `fonts/` | Fredoka (SIL Open Font License). |

## Making a new game

1. Copy `_template/` to a new folder, for example `puzzles/`.
2. Add a tile for it to the `SECTIONS` list in `js/hub.js` at the root.
3. Add its files to `sw.js` by running `python3 tools/update-sw.py` (this also bumps the version).

A game page is a normal HTML page that links `../shared/css/kit.css`, its own `css/style.css`, and a
module `js/main.js` that calls `boot()`:

```js
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import { boot, $, fx, showScreen, celebrate, onPointer, createStore } from '../../shared/js/kit.js';

boot({
  party: ['#ff6fb5', '#c27bff', '#6fc8ff'], // this game's Paint Party colors (top, middle, bottom)
  onAction(action, el) { /* a tap on any element with data-action="..." */ },
  onBack(screenId) { /* Android back: step back and return true, or false for the default */ },
  onFrame(dt, t) { /* every frame, if the game animates on a canvas */ },
  onResize(W, H) { /* after rotating */ },
});
```

### Screens

- Screens are `<section class="screen">`. The game's own title screen has `data-start`; going back
  from it returns to the game list. `showScreen('screen-x')` shows one; `showScreen(null)` hides them all
  (for a play area that is not a `.screen`). Add `dim` to a screen to darken what is behind it (pop-up cards).
- Built-in actions: `data-action="hub"` (back to the game list), `data-action="sound"` (sound on/off for
  every game, including speech). Every other `data-action` goes to your `onAction`, after a click sound.
  Add `data-quiet` to skip the click sound.
- `boot()` adds `#bg` (the world), `#fx` (effects, drawn above everything), the banner, and the
  "save on older iPads" card, so the page does not need them.
- A game that paints its own backdrop can call `showBackground(false)` (no world is drawn at all) or
  `animateBackground(false)` (the world stays, its moving details stop). `overrideScene(id)` shows one
  particular world for now, without changing the kid's choice.

### Input

`onPointer(el, { down(p, e), move(p, e), up(p, e) })` follows each finger separately (`p.id`) in screen
pixels (`p.x`, `p.y`). It works on old iPads without Pointer Events. Return `false` from `down` to ignore
a touch. For simple buttons, use `data-action` (a normal click).

### Saving

`createStore('mygame', { best: 0 })` gives `store.data` (saved in `localStorage` as `kids-games.mygame`).
Change it and call `store.persist()`. The shared `settings` store holds the sound setting and the world.

### Sound and speech

Sounds only start after the first tap (a browser rule); the kit unlocks audio and speech on that tap.
Speech is muted along with the sound button. Not every browser has a voice, so never make a game
*depend* on hearing speech: always show the word on screen too.

## Rules that keep the games working everywhere

- **Old iPads (iOS 12 / Safari 12) must work.** No `??`, `?.`, class fields, `ctx.roundRect`,
  `replaceAll`, `.at()`, `ResizeObserver` (unless feature-checked), `Object.fromEntries`, regex lookbehind.
  In CSS: no `inset`, `aspect-ratio`, `clamp()`, flex `gap` (grid `gap` is fine with a `grid-gap` twin),
  `:is()`, `dvh`.
- **Phones and tablets, both orientations.** Test at 390×844, 844×390 and 820×1180.
- **Big touch targets** (at least 60px for things kids tap or drag), and no reading needed to play:
  icons, pictures, sounds and speech carry the meaning.
- **Fast on old tablets.** Draw static things once into a cached canvas, keep particle counts modest,
  and avoid per-frame DOM layout.
- **No build step, no dependencies, no network.** Plain ES modules; everything must work offline.
- **Kind, never scary.** No losing screens, no timers that punish, no harsh sounds. Wrong answers get a
  gentle `boing` and a wiggle, then help.

## Background motion on old devices (`js/motion.js`)

The moving bits of the background worlds are drawn 30 times a second on most devices, 15 times a
second at 3/4 resolution on older ones (iOS 12, Android 7 and older, 2 GB of memory or less, two
cores), and 8 times a second at half resolution on the oldest. While the background is showing, the
kit also watches real frame rates: a device that keeps running under about 30 fps steps down a
level and remembers it, and steps back up after 20 smooth seconds. The kit, Coloring and Sticker
Scene use it, and Bubble Pop, Fishing Pond and Catch the Stars apply it to their own backgrounds
(weeds, waves, light rays, twinkling stars, snow, leaves, bokeh: never the game itself). The
grown-up corner's About card shows the current level.

Grown-ups can override it in the grown-up corner (`setMotionChoice`): Auto, Full, Light, Minimal, or
Still (the moving bits are drawn once and never move). A chosen level turns off the automatic stepping.
