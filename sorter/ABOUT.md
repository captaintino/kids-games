# Shape & Color Sorter 🔺

A toy shape sorter and a fruit-sorting game for little kids, built for phones and tablets.
Every shape and color is said out loud with the browser's built-in speech, and the word is
shown on screen too, so nobody needs to read.

## Modes

- 🔺 **Shapes**: a chunky wooden board with holes. Drag each smiley toy block into the hole with the
  same shape. There are ten shapes: circle, square, triangle, star, heart, diamond, oval, rectangle,
  hexagon and moon.
  - Pick a block up and its name is said ("Star!").
  - Drop it in the right hole and it clunks in with sparkles ("Star! Great job!").
  - Drop it in a wrong hole and it boings back out to the tray while the hole shakes.
  - Drop it anywhere else and it floats back to the tray.
- 🍎 **Colors**: colored baskets, each with a bow and a name tag. Drag the fruit and veg into the basket
  of the same color: red, orange, yellow, green, blue, purple, pink and brown (apples, strawberries,
  cherries, tomatoes, oranges, carrots, pumpkins, bananas, lemons, corn, limes, pears, peas, broccoli,
  blueberries, grapes, plums, eggplants, dragon fruit, grapefruit, coconuts, potatoes and mushrooms).
  The color is said when you pick something up, and again when it lands ("Red! A red apple!").
  Sorted food stays in its basket so you can see your work pile up.

## How it grows

- Rounds start with 2 holes or baskets, then 3, and grow gently up to 6.
  Colors rounds have one more piece of food than baskets, so some baskets get two.
- Holes, baskets and the tray are shuffled every round, so the answer is never "just below".
- When everything is sorted there is confetti and a cheer, and the next round starts by itself.
- The round you reached is saved for each mode, plus a count of everything you've sorted.

## Gentle help

- Nobody loses: a wrong drop is just a boing and a wiggle.
- Miss the same piece twice, or hold a piece for a while without dropping it, and the right hole
  or basket glows.
- If nothing happens for a few seconds, a piece wiggles, its hole or basket glows, and a voice
  asks for it ("Find the star hole!").

## Tech

- Plain HTML, CSS and ES modules on the shared kit (`../shared`). No images: blocks, holes, baskets
  and food are drawn as SVG in `js/art.js` and `shared/js/food.js`.
- Pieces move with CSS transforms on one layer (no layout work while dragging), and the board and
  tray are laid out from the screen size, so phone portrait, phone landscape and tablets all fit.
- `shared/js/food.js` holds the food drawings, also used by Feed the Animal.
- `window.__sorter.state()` shows the current round for automated tests.
