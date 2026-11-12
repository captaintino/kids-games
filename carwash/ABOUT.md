# Car Wash 🚗

A very muddy vehicle drives into the car wash, splattered with mud and stuck with leaves. Soap it, rinse it,
dry it and make it shine, then decorate it, and it beams, honks and drives off with confetti.
Every vehicle has a cute face whose eyes follow the sponge, and it giggles while it is being scrubbed.

## Picking

The title screen has 🧽 **Wash!** (pick from big tiles) and 🎲 **Surprise** (a random one).
The tiles: a car, a fire truck, a bus, a monster truck, a tractor and a race car, plus a 🐾 pet wash bonus
with a puppy and a piggy (they trot in on their legs instead of rolling). Each tile shows how many times it
has been washed, and the title shows the total (🚿).

## How to play

The tool buttons at the bottom (beside the bay in landscape) go in order; the next one bounces:

- 🧽 **Soap**: rub to cover the mud in foam bubbles (squeaky sounds, bubbles float up). "Scrub scrub!"
- 🚿 **Rinse**: a water spray washes the foam and the mud away where you rub, with droplets running down
  and splashing. Water beads stay on the paint.
- 🌬️ **Dry**: the blower sends the water beads flying off.
- ✨ **Shine**: rub to leave sparkles. When it is done a glossy shine sweeps across.
- 🎨 **Decorate** (optional): six paint colors for the body (or fur) and six stickers (⭐ ❤️ 🌈 🌸 ⚡ 🎀).
  Pick a sticker, then tap the vehicle to stick it on.
- 🏁 **Go!**: the vehicle beams (happy eyes), honks (a siren for the fire truck, a yip for pets), says
  "Beep beep! Thank you!" and drives off with confetti. A sticker for the sticker book, then a card with
  🔁 again, 🚗 more and 📷 save.

Each button shows its progress as a little green bar. A step counts as done at 85% of the vehicle, and the
rest then finishes by itself, so nobody gets stuck on the last speck: a chime, a cheer ("So bubbly!",
"All clean!", "All dry!", "So shiny!"), a check mark, and the next tool starts bouncing. Tapping a tool that
is not ready yet gives a soft boing and "Tap the sponge!"; after a quiet while the game reminds the kid too.

📷 saves a picture (the vehicle in the bay, as it is right now, mud and all) to the device and to the
art gallery (Jigsaw can turn it into a puzzle).

## Tech

- `js/vehicles.js`: the eight drawings as SVG (400 × 260 sheet, facing right, standing on y = 244), in the
  house style. Parts with class `paint` / `paint-s` take the body color. Faces are built by `face()`: eyes
  with a pupil group (moved to follow the finger), a hidden happy arc, a smile and a hidden giggle. Hidden
  parts use inline `display:none`, so the saved picture (the live SVG drawn into a canvas) matches the screen.
- `js/wash.js`: the dirt as canvas layers: mud (a muddy film, splats with drips, specks and leaves), foam,
  water beads and sparkles, stacked into one canvas over the drawing and clipped to the vehicle's silhouette
  (the clean drawing rendered once as an image, with holes cut for the eyes so they always show).
  The layers are sized once per wash (520 to 960 px wide, depending on the screen) and only scaled by CSS
  after that, so rotating needs no redraw. Rubbing stamps along the finger's path and recomposes only the
  small rectangle under it; nothing is redrawn per frame except during the 1-second shine sweep.
  (Note: `destination-in` would wipe everything outside the drawn image, so the recompose clips to its rect.)
- Progress is counted on a 40 × 26 grid of cells over the vehicle (cells inside the silhouette only).
- Soap bubbles and water drops are particles on a separate canvas over the bay, capped at 160, cleared once
  when the last one is gone. Sparkles use the kit's effects.
- Driving in and out, the wheels roll by the distance travelled (pets hop instead), driven by the kit's frame
  loop. All sounds are made with the shared synth (squeaks, spray and blower noise, engine, horn chord).
- Saved with `createStore('carwash')`: how many times each vehicle was washed.
- Calls `earnSticker('carwash')` each time a vehicle drives off clean.
- Works on iOS 12 (touch-event fallback via the kit's `onPointer`, no newer JS/CSS).
- `window.__carwash` exposes the state (`C`, `W`, `start(id)`, `at(x, y)`, `inside()`) for automated tests.
