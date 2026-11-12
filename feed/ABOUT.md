# Feed the Animal 🍌

A silly feeding game for little kids, built for phones and tablets. Pick a hungry friend and drag
food from the tray into its mouth. Friends love their favorite foods and make funny faces at the
yucky ones (everybody thinks broccoli is yucky!).

## The friends

| Friend | Loves | Yuck! |
| --- | --- | --- |
| 🐰 Bunny | carrot, apple, strawberry, watermelon, cookie | broccoli, fish |
| 🐶 Puppy | bone, cheese, pizza, cookie, apple | broccoli, lemon |
| 🐲 Dragon | pizza, cupcake, fish, watermelon, banana | broccoli, ice cream |
| 🐼 Panda | bamboo, apple, banana, cookie, watermelon | broccoli, cheese |
| 🦛 Hippo | watermelon, cupcake, banana, ice cream, strawberry | broccoli, bone |
| 🐱 Kitty | fish, cheese, ice cream, cupcake, strawberry | broccoli, banana |

Tap **Play** to choose a friend, or **Surprise!** for a random one.

## How to play

- Pick up a food and its name is said ("Carrot!"). The friend's eyes follow it, and its mouth opens
  wider and wider as the food gets close.
- Drop it in the mouth: munch, munch! Crumbs fly and you hear chomps.
  - A favorite food: hearts, happy eyes, a wiggle and a "Yum!" or "Mmm!". The tummy meter at the top
    fills and the friend's belly gets a little rounder. A new food pops onto the tray.
  - A yucky food: squinty eyes, tongue out, green cheeks, a shudder and a "Bleh!", then the food is
    spat back onto the tray (ptoo!).
- Five favorite foods fill the tummy: a happy dance, confetti, a big BURP ("Oops! Excuse me!"),
  then a yawn and a nap with floating Zzz. Then pick a **New friend** or feed the same one **Again**.
- Drop food anywhere else and it floats back to the tray.
- Tap the friend to tickle it.
- If nothing happens for a while, the friend's tummy rumbles, it says it's hungry, and one of its
  favorite foods wiggles on the tray as a hint. Friends also blink and look around on their own.

Every friend you fill up gets a ⭐ on the picker, and the title screen counts all the full tummies.

## Tech

- Plain HTML, CSS and ES modules on the shared kit (`../shared`). No images: the friends are SVG drawn
  in `js/characters.js` and share one face rig (moving pupils, blinking, a mouth whose opening is
  redrawn as food gets close, and happy / yuck / sleepy faces). Food art is in `shared/js/food.js`,
  also used by the Shape & Color Sorter.
- Food moves with CSS transforms on one layer; only the spat-out arc is animated frame by frame.
- Each friend has its own voice pitch for the spoken reactions.
- `window.__feed.state()` shows the friend, tummy and tray for automated tests.
