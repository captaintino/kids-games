# Jigsaw Puzzles 🧩

Big, friendly jigsaw puzzles for little hands. Every coloring picture from Color Splash Party can be
cut into 4, 6, 9, 12 or 16 chunky pieces with real jigsaw tabs and blanks. Kids can even turn their own
art into puzzles: pictures they colored, spin paintings and butterflies from Spin Art, monsters from
Build a Monster, and drawings.

## How to play

1. Tap **🧩 Puzzles** (or **🎨 My Pictures**, or **🎲 Surprise!** for a random one).
2. Pick a picture. The tabs at the top sort them: My Pictures, All, Animals, Nature, Yummy, Fun Stuff.
3. Pick how many pieces. Each button shows the picture already cut up, so no reading is needed:
   **4** (2 × 2), **6** (3 × 2 or 2 × 3), **9** (3 × 3), **12** (4 × 3 or 3 × 4) or **16** (4 × 4). For 6 and 12
   the game picks the way round that gives the biggest pieces on this screen and for this picture's shape.
4. The whole picture appears, then the pieces jump out and scatter around the board. A faint ghost of the
   picture and the outline of every spot stay on the board to help.
5. Drag a piece close to its spot: the spot lights up, and when you let go the piece snaps in with a click,
   a sparkle and a little bounce. Pieces dropped anywhere else stay right where you put them.
6. When the last piece clicks in, the seams melt away, the picture does a happy wiggle, confetti falls and
   the picture's name is spoken. Then choose **➡️ Next** (the next picture, same size) or **🖼️ Pictures**.

## Modes and extras

- **🎨 My Pictures**: the kid's own art, grouped by where it was made and badged with that game's icon:
  🌀 Spin Art (spin paintings and butterflies), 👾 Build a Monster, 🎨 Coloring and ✏️ drawings (and 🖼️ for
  anything else). It lists the saved artwork from the shared gallery (`listArt()` in `shared/js/gallery.js`,
  newest first) plus every picture colored in Color Splash Party (anything with at least one filled part or
  brush stroke, with your own colors, magic paints and brush strokes). If there is nothing yet, it says where
  to make art and has big **🌀 Spin**, **👾 Monster** and **🖍️ Color** buttons that open those games.
- **Art of any shape**: gallery art is cut to its own shape (a wide butterfly makes a wide board, a tall
  monster a tall one), between about 7:10 and 10:7. Art that is even wider or taller sits in a little white
  frame on a candy-colored polka-dot backdrop, so the extra space looks on purpose.
- **💡 Help**: lights up the spot for one piece and wiggles that piece. Tap 💡 again quickly and the piece
  hops into place by itself. If nothing happens for a while, the game gives the same gentle hint by itself.
- **⭐ per size**: every picture in the gallery shows five little stars, one for each size (4, 6, 9, 12, 16),
  that turn gold when that puzzle is done. Real-color and My Pictures puzzles are counted separately, and
  gallery art is saved by its id, so its stars stay with it.
- **Sticker book**: finishing a puzzle earns a sticker (`earnSticker('jigsaw')`, at most one every 45 seconds);
  a 16-piece puzzle always earns one.
- **Big puzzles on small screens**: the board is as big as the screen allows. For 12 and 16 pieces the loose
  pieces may overlap a little so the board (and every piece) can be bigger; on a phone in portrait a
  16-piece square puzzle has pieces about 85 px across. Small pieces grow a bit more while a finger holds them.
- Dragged pieces always come to the front. There is no rotation and no timer, and nothing can go wrong.

## Tips

- Several fingers can move several pieces at the same time; a second finger never breaks a drag.
- Rotating the device keeps the finished pieces in place and lays the loose ones out again for the new shape.
- The back button (Android) or back swipe steps out of a puzzle to the pictures, then to the title.

## Tech

- `js/cut.js` cuts the picture: each inside edge is three cubic curves (the classic tab shape), with a
  little random jitter so pieces look hand cut. Neighbors share the same edge numbers, so they always fit.
- The picture is drawn once to a bitmap (`svgToCanvas` from `shared/js/art.js`); each piece is a small
  canvas clipped to its outline, with a baked-in shadow while loose. Pieces move with `translate3d`, so
  dragging never re-lays out the page.
- Hit testing uses the real piece outline (`isPointInPath`) with a forgiving fallback for small fingers.
- The board size is chosen so all the loose pieces fit beside it (below it in portrait, on both sides in
  landscape), as big as possible. The board can be any shape (`entry.asp`, width / height); the pieces are
  laid out on a grid in the free space, with a few random gaps when there is room to spare.
- Gallery art is loaded from its JPEG data URL and drawn once onto a board-shaped canvas (`artBitmap`).
- Progress is saved with `createStore('jigsaw')`: finished sizes per picture (keys: the picture id, `my-<id>`
  for colored pictures, `art-<gallery id>` for gallery art), the last size and tab.
- `window.__jigsaw` exposes the state for automated tests.
