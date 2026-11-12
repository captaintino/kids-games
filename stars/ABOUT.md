# Catch the Falling Stars ⭐

A gentle catching game for little kids. Slide the smiling basket along the bottom of the night sky
to catch the falling stars. Nobody loses: there are no hearts, no timer and no game over.

## How to play

- **Drag anywhere** on the screen and the basket walks to your finger. With a mouse, the basket simply
  follows the pointer. The **← →** arrow keys work too.
- Every star you catch pops with a "+1" in its own color, chimes a little higher each time, and piles up
  in the basket.
- Every **10 stars** there is confetti and the number is spoken out loud ("Twenty stars!"). Every 50 gets a
  big banner.
- The pace picks up gently for about two minutes, then stays the same.
- **⏸** pauses. **⏹️** stops and shows a happy card with the stars you caught and your best.

## Special things in the sky

- 🌠 **Shooting star**: zooms in from the side with a glowing tail. Worth 5 stars!
- 🌈 **Rainbow star**: every star on the screen zooms into your basket (and raindrops turn to sparkles).
- 🌙 **Sleepy moon**: everything falls slowly for a while. A dreamy glow and a 🌙 chip show it is on.
- ☁️ **Rain clouds** drift across the top and drop raindrops. Catching one does not hurt: the basket just
  gets soggy, droops and drips with a funny "splish", and stars bounce off it for about two seconds
  (they can still be caught when they come back down!).

Each special shows up early at least once, so kids discover them all.

## Modes

- ⭐ **Play**: stars, specials and rain clouds.
- 🌙 **Calm**: no rain clouds, a slower pace. It keeps its own best score.
- 🌍 **World**: pick the background. *Night Sky* (the game's own sky, with twinkling stars, fireflies and
  sleepy houses) is shown for the Paint Party world; the other shared worlds work too.

## Tips

- The basket gives a gentle helping hand: stars falling just beside it drift in.
- On the title screen you can tap the falling stars just for fun.
- Best scores are saved on the device (`kids-games.stars`).

## Tech

- Canvas game in the style of Bubble Pop Party: every star, the moon, the clouds and the basket faces are
  pre-rendered once into sprites (`js/art.js`), so a frame is mostly `drawImage` calls.
- The canvas has a pixel budget, and the quality steps down by itself (fewer pixels and particles) if
  frames get slow (`js/engine.js`, shared in copy with Fishing Pond).
- All sounds are synthesized (`js/sounds.js` builds on the kit's synth). Works back to iOS 12.
