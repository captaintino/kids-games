# Sticker Scene 🎩

A sticker book for little kids: pick a world, then drag stickers onto it. Dress up friends with hats,
glasses and silly noses, fill the sea with fish or the sky with rockets, and save it as a picture.
There's no wrong answer: anything can go anywhere.

## How to play

1. Tap ▶️ **Play** and pick a world: 🎨 Paint Party, 🐠 Under the Sea, 🤠 Wild West, 🏰 Knights & Castles,
   🚀 Outer Space, 🐮 Farm, 🚌 City, ⛄ Winter or 🎂 Birthday Party (the same worlds as the other games, with
   their little moving fish, flags, rockets, tractors, cars, snow and balloons). The nine world cards fit on
   one screen: three by three on a phone, five in a row when it is sideways.
2. The sticker tray is at the bottom (on the right side when the screen is sideways). The tabs choose a
   kind of sticker: 🐱 friends, 🎩 hats, 🕶️ glasses and silly faces, 🌸 flowers and bugs, 🐠 sea things,
   🚀 space things, 🐮 farm (cow, piggy and sheep to dress up, hen, tractor, hay bale, straw hat...),
   🚗 town (car, bus, traffic light, hard hat, fire truck...), ⛄ winter (snowman and penguin to dress up,
   snowflake, bobble hat, sled...) and 🌈 fun stuff (rainbows, balloons, cake, cupcakes, confetti, a unicorn,
   a dragon...). On a phone the tab strip scrolls sideways. Opening the sea, space, farm, city, winter or
   birthday world opens the tray on its matching stickers.
3. **Pull a sticker up out of the tray** and drop it anywhere. Swipe the tray sideways to see more.
   Or just **tap** a sticker in the tray and it hops into the picture by itself.
4. **Dress up:** drop a hat near a friend's head (or glasses near their eyes) and it snaps on, with a
   glow showing where it will go. Tapping a hat or glasses in the tray puts it straight on the friend you
   last touched. A new hat swaps out the old one, which hops off. When you move a friend, everything it
   wears comes along.
5. **Tap a sticker** to pick it. A toolbar appears: ➖ smaller, ➕ bigger, ↔️ flip, 🔄 spin,
   ⏫ bring to the front, ✖️ remove. With two fingers you can pinch a sticker you're holding to resize
   and twist it.
6. **Remove a sticker** by dragging it to the 🗑️ trash can (it appears while you drag) or back onto
   the tray. Whoosh!
7. 📷 saves the picture (the world plus all your stickers) and also keeps it in the shared art gallery (so
   Jigsaw can make a puzzle of it). 🗑️ clears the whole scene (it asks first).

**Stickers for the sticker book:** saving a picture earns one, and so does filling a world with 8 or more
stickers (once per world each visit). The shared `earnSticker('stickers')` keeps it to one every 45 seconds.

Tap a friend to hear it say hello (meow, woof, moo, oink, baa, beep...). Every world keeps its own scene, saved on the
device, and the world cards show your scene and a ⭐ count of stickers.

## Notes

- Friends, hats, glasses, flowers, sea, space and fun stickers are drawn as SVG in `js/art.js`; a few
  dozen small extras (trees, sea animals, sweets) are emoji drawn into a canvas once.
- Friends have anchor points (head, brow, face, eyes, nose); wearable stickers know which anchor they fit
  and how wide they should be, so they snap on at a good size for any friend.
- The world is painted into its own canvas above the tray, so the ground is never hidden and the saved
  picture matches what is on screen.
- Sticker positions are stored relative to the play area, so scenes survive rotating the device.
- Up to 80 stickers per world.
- The worlds come from `shared/js/scenes.js`. World previews and the saved picture draw a few frames with big
  time steps on one still picture; the newer worlds draw their big movers (tractor, cars, penguin, balloons)
  only once in that case so they don't appear twice.
