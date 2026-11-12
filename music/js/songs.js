// Simple public-domain tunes, all inside one octave from middle C up to the next C,
// so they fit the 8 xylophone bars and the piano's white keys.
//
// Notes: C D E F G A B, and C' for the high C. ":beats" sets the length (default 1).
// "|" splits a song into phrases. Follow the Lights teaches each different phrase
// once (repeats are skipped), then plays the whole song.

const STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export const SONGS = [
  {
    id: 'buns', name: 'Hot Cross Buns', icon: '🍞', color: 'orange',
    tune: "E D C:2 | E D C:2 | C:.5 C:.5 C:.5 C:.5 D:.5 D:.5 D:.5 D:.5 | E D C:2",
  },
  {
    id: 'mary', name: 'Mary Had a Little Lamb', icon: '🐑', color: 'pink',
    tune: 'E:1.5 D:.5 C D E E E:2 | D D D:2 E G G:2 | E:1.5 D:.5 C D E E E E | D D E D C:4',
  },
  {
    id: 'twinkle', name: 'Twinkle Twinkle', icon: '⭐', color: 'blue',
    tune: 'C C G G A A G:2 | F F E E D D C:2 | G G F F E E D:2 | G G F F E E D:2 | C C G G A A G:2 | F F E E D D C:2',
  },
  {
    id: 'macdonald', name: 'Old MacDonald', icon: '🐮', color: 'green',
    tune: 'C C C G A A G:2 | E E D D C:3 | C C C G A A G:2 | E E D D C:3',
  },
  {
    id: 'row', name: 'Row Your Boat', icon: '⛵', color: 'teal',
    tune: "C:1.5 C:1.5 C:1 D:.5 E:1.5 | E:1 D:.5 E:1 F:.5 G:3 | C':.5 C':.5 C':.5 G:.5 G:.5 G:.5 | E:.5 E:.5 E:.5 C:.5 C:.5 C:.5 | G:1 F:.5 E:1 D:.5 C:3",
  },
  {
    id: 'ode', name: 'Ode to Joy', icon: '🎉', color: 'purple',
    tune: 'E E F G G F E D | C C D E E:1.5 D:.5 D:2 | E E F G G F E D | C C D E D:1.5 C:.5 C:2',
  },
  {
    id: 'london', name: 'London Bridge', icon: '🌉', color: 'red',
    tune: 'G:1.5 A:.5 G F E F G:2 | D E F:2 E F G:2 | G:1.5 A:.5 G F E F G:2 | D:2 G:2 E C:3',
  },
  {
    id: 'jacques', name: 'Are You Sleeping', icon: '🔔', color: 'yellow',
    tune: 'C D E C | C D E C | E F G:2 | E F G:2 | G:.5 A:.5 G:.5 F:.5 E C | G:.5 A:.5 G:.5 F:.5 E C',
  },
];

function parseNote(tok) {
  const parts = tok.split(':');
  const name = parts[0];
  const up = name.indexOf("'") > 0 ? 12 : 0;
  const semi = STEP[name[0]] + up;
  return { semi, beats: parts[1] ? parseFloat(parts[1]) : 1 };
}

SONGS.forEach((s) => {
  s.phrases = s.tune.split('|').map((ph) => ph.trim().split(/\s+/).map(parseNote));
  s.notes = [].concat.apply([], s.phrases);
  const seen = {};
  s.learn = s.phrases.filter((ph) => {
    const key = ph.map((n) => n.semi).join(',');
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
});

export function songById(id) {
  for (const s of SONGS) if (s.id === id) return s;
  return SONGS[0];
}
