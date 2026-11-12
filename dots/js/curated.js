// The pictures used for dot-to-dot, easiest first, and which parts of each one
// make its outline (see outline.js). Without config, every colorable part that
// does not touch the sheet edge is used (so grass, sea and sky drop out), and
// `skip` leaves out loose bits like the sun or a cloud.
export const CURATED = [
  { id: 'starry', parts: [3] },
  { id: 'apple' },
  { id: 'house' },
  { id: 'icecream' },
  { id: 'kitty', skip: [2] },
  { id: 'fish' },
  { id: 'piggy', skip: [2] },
  { id: 'butterfly' },
  { id: 'rocket', skip: [1, 2, 3, 4] },
  { id: 'mushroom' },
  { id: 'bunny' },
  { id: 'cupcake' },
  { id: 'boat', skip: [1, 2] },
  { id: 'dino', skip: [1] },
  { id: 'tree' },
  { id: 'owl', skip: [1, 2, 3, 4, 21, 22, 23] },
  { id: 'snowman', parts: [3, 4, 5, 6, 7, 8, 9, 15, 16] },
  { id: 'car', parts: [8, 9, 10, 12, 13, 14, 15] },
  { id: 'turtle', skip: [1, 2] },
  { id: 'castle', skip: [1] },
  { id: 'whale', parts: [3, 4, 5, 6] },
  { id: 'chick', skip: [1, 2, 4, 5, 6, 7] },
  { id: 'umbrella' },
  { id: 'froggy', parts: [3, 5, 6, 7, 8, 9] },
  { id: 'bee', skip: [1] },
];
