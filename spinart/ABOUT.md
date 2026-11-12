# Spin Art 🌀

Messy art, without the mess! Four ways to paint: fling paint on a spinning disc, fold paper into
butterfly paintings, print with painty soap bubbles, and splat paint all over the paper. The best ones
get hung up in the gallery.

## Modes

- 🌀 **Spin Paint**: a round paper spins on a rainbow turntable. Touch the paper and paint drips onto
  it, then flies outward into spiral streaks and splatters. Keep a finger still and the paper turns
  under it, painting a ring. Speeds: ⏸️ stop, 🐢 slow, 🐇 medium, 🚀 fast. Faster spins make longer,
  curlier streaks. Tip: stop the disc, drip lots of colors, then press 🚀!
- 🦋 **Butterfly Fold**: a paper with a dashed butterfly and a dotted fold line. Paint on one side (or
  both), then press **🦋 Fold**: the paper folds over, gets squished, and opens with the paint blotted
  onto the other side. Then it's cut out into a butterfly with a body, a happy face and antennae, and
  it flaps its wings. Tap it (or press ✨ Fly!) to make it flutter. 🎨 Paint more goes back to the paper.
  Tools: 💧 paint blobs (hold still and the blob grows), 🖌️ brush, and the bubble brush.
  The **magic mirror** button paints both sides at once as you go.
- **Bubble Print**: hold a finger on the paper to blow painty bubbles. They float and wobble; tap them
  to pop them (or wait), and each one leaves a bubble print on the paper. Pick small, medium or big
  bubbles, or press 💨 Blow for a big puff.

- 💥 **Splatter**: fling paint at the paper. A tap makes a round splat with little drops all around it;
  a fast flick throws a long streak that stretches out in the direction you flicked, with droplets
  flying on ahead (you see the paint fly before it lands); holding a finger still makes a dribble: a
  puddle with drips running down the paper (move slowly to drizzle a line). The 💥 **Splat!** button
  throws one for you. The little pictures in the dock (👆 tap, 👉 flick, ✋ hold) show the three moves.

The **bubble brush** (the little bubble button) also works in Spin Paint and Butterfly Fold: it stamps
clusters of bubble-print rings.

**Colors:** ten bright paints plus ✨ rainbow (changes color as you paint) and ✨ glitter (shiny golds
and pastels with sparkles).

Other buttons:
- 🆕 a fresh paper.
- 📌 **Hang it!** frames the painting, flies it into the gallery with a sparkle trail and gives a
  sticker. Pressing it again without painting more just says it is already on the wall (no
  duplicates); an empty paper gets a gentle "Paint something first!". Titles: Spin painting, Butterfly
  painting (or Butterfly once it is cut out), Bubble print, Splatter.
- 📷 save the painting as a picture (on phones this opens the share sheet; on older iPads you press
  and hold the picture and tap *Save Image*). A finished butterfly is saved on a sky background.
- Each mode keeps its painting on the device, so it's still there next time.

## 🖼️ Gallery

The Gallery button on the title opens a cozy wall: striped wallpaper, a wooden picture rail with
cords and brass hooks, a wooden floor, and every hung painting in a frame (wood, candy stripes, round,
gold, oval or mint; each picture always gets the same frame and a little tilt) with a brass name plate
under it. The kid's coloring pictures (`listArt('coloring')`) hang there too, marked with a 🖍️. Tap a
picture to see it big: 📷 saves it, 🗑️ asks "Take it down?" (✔️ / ✖️) before removing it. An empty
wall shows an empty frame and a "Let's paint!" button. Pictures live in the shared gallery
(`shared/js/gallery.js`, newest 24 across all games), so Jigsaw can make puzzles of them.

## Tech

- `js/spin.js`: the paint lives in an offscreen canvas in the disc's own coordinates, so it sticks to
  the paper; each frame is one rotated `drawImage`. Drops move under centrifugal force, the Coriolis
  effect and paper drag, soaking in as they go, and splash at the edge.
- `js/butterfly.js`: the fold is a canvas squash animation of the right half; the blot mirrors the
  paint with a mottled, softened copy (several offset draws, since old Safari has no canvas blur).
- `js/bubbles.js`: bubble sprites are drawn once per color.
- `js/paint.js`: colors, blobs, bubble prints, the blot, and the splatter shapes (`splat`, `streak`).
- `js/splatter.js`: Splatter. A finger is a tap, a flick or a hold depending on how far and how fast
  it moves; flicks launch flying globs that land as streaks; drips run down the paper.
- `js/wall.js`: builds the gallery wall (rows of frames, sized for the screen).
- Paint canvases are capped at 1024 px and only redraw while something changes.
- Newer emoji (bubbles, mirror) don't exist on older iPads, so those icons are drawn with CSS.
- Settings are saved with `createStore('spinart', ...)`; each mode's picture has its own small store
  (`spinart-spin`, `spinart-butterfly`, `spinart-bubbles`, `spinart-splatter`).
- The gallery hides the kit's background world while it is open (the wall covers it anyway).
- Stickers: `earnSticker('spinart')` when a painting is hung.
