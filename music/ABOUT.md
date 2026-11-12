# Music Time 🎹

Three big, bright instruments for little musicians, plus a gentle "Simon"-style game that teaches
real tunes. Every sound is made live with the Web Audio synth, so there are no audio files.

## Instruments

- 🌈 **Xylophone**: eight rainbow bars (C D E F G A B C, low to high) that get shorter as the notes
  get higher. Bars wiggle, glow and send up music notes when you hit them. On a tall phone the
  xylophone lies sideways (low notes at the bottom) so the bars stay big.
- 🥁 **Drums**: a drawn drum kit with a crash cymbal, hi-hat, two toms, a floor tom, a snare, a big
  smiley bass drum, a cowbell and a tambourine. Each one bounces, wobbles or swings and says its
  sound ("BOOM!", "Tss!", "Jingle!").
- 🎹 **Piano**: an octave and a half of big pastel-rainbow keys (C to G) with black keys, a warm piano
  tone, and a little light above each white key. The C keys have a star so kids can find "home".

Play with several fingers at once, and slide a finger across the bars or keys for a glissando.
Notes start the moment a finger lands.

## Buttons (xylophone and piano)

- 🔔 / 🌴 / 🧸 / 🎹 **Sound**: change the sound. Xylophone: bells, marimba or toy piano.
  Piano: piano, toy piano or bells.
- 🎵 **Play a song for me**: pick a song and watch the keys light up as it plays. Play along!
- 💡 **Follow the Lights**: pick a song to learn (see below).

## Follow the Lights

The game lights up the first 2 or 3 notes of a tune (👀 in the top bar), then it's your turn (👆):
tap the same keys. Each time you get it right, the bit gets longer, until you can play a whole
phrase. Each phrase earns a dot in the top bar. Finish every phrase and you get a celebration, then
the whole song plays for you with the lights.

Nobody loses: a different note just gets a gentle "boing", and the lights show the tune again. If a
kid waits a few seconds, the next key starts to glow as a hint; after a couple of tries the hint comes
straight away. 💡 in the top bar shows the lights again; ⏹️ stops.

Songs (all public domain, all inside one octave): Hot Cross Buns, Mary Had a Little Lamb, Twinkle
Twinkle, Old MacDonald, Row Your Boat, Ode to Joy, London Bridge and Are You Sleeping. Learned songs
get a ⭐ in the song list. Repeated phrases are only learned once.

## Tech

- `js/voices.js`: the instrument voices, built on `context()` and `output()` from the shared synth.
  Mallets are a sine plus inharmonic partials with a fast decay; the piano is detuned triangle and
  sawtooth oscillators through a closing low-pass filter; drums are pitch-dropping sines, filtered
  noise and square-wave "metal". A voice limiter keeps fast glissandos from piling up notes.
- `js/instruments.js`: drawing, layout and hit testing for the three instruments on one canvas. The
  canvas only redraws while something moves. Drum pieces are pre-drawn into sprites.
- `js/songs.js`: the tunes, written as note names with lengths, split into phrases.
- `js/main.js`: screens, fingers, and the Follow the Lights game.
- Settings (chosen sounds, learned songs) are saved with `createStore('music', ...)`.
