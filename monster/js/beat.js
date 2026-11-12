// A tiny step sequencer for the monster songs (the dance and the parade). Notes are
// scheduled a little ahead on the audio clock, so the beat stays steady even when
// a frame is slow. Without sound, the beat still runs on the page clock so the
// monsters keep dancing in time.
//
//   const beat = createBeat({ bpm: 124, loopSteps: 64, play(i, delay) { ... } });
//   beat.start(onEnd, loops)    loops = Infinity plays until stop()
//   beat.beat()                 beats (quarter notes) since the start, for animation
import * as sfx from '../../shared/js/audio.js';

export function createBeat({ bpm, loopSteps = 64, play }) {
  const STEP = 60 / bpm / 4; // one sixteenth note
  let start = null;
  let audioClock = false;
  let next = 0;
  let idx = 0;
  let total = 0;
  let timer = 0;
  let endTimer = 0;
  const useAudio = () => sfx.ready() && sfx.context();
  const clock = () => (audioClock && sfx.context() ? sfx.context().currentTime : performance.now() / 1000);

  function scheduler() {
    if (!audioClock || !useAudio()) return;
    const now = sfx.context().currentTime;
    // after a pause (muted, or the page was hidden), skip ahead instead of playing a pile of notes
    while (next < now - 0.03 && idx < total) { next += STEP; idx++; }
    while (next < now + 0.12 && idx < total) {
      play(idx, Math.max(0, next - now));
      next += STEP;
      idx++;
    }
  }

  const B = {
    STEP,
    get on() { return start != null; },
    start(onEnd, loops) {
      B.stop();
      total = (loops == null ? 2 : loops) * loopSteps;
      audioClock = !!useAudio();
      start = clock() + (audioClock ? 0.08 : 0);
      next = start;
      idx = 0;
      if (audioClock) {
        scheduler();
        timer = setInterval(scheduler, 40);
      }
      if (isFinite(total)) endTimer = setTimeout(() => { B.stop(); if (onEnd) onEnd(); }, total * STEP * 1000 + 150);
    },
    stop() {
      clearInterval(timer);
      clearTimeout(endTimer);
      timer = 0;
      start = null;
      idx = total;
    },
    /** Quarter-note beats since the start. */
    beat() {
      if (start == null) return 0;
      return Math.max(0, (clock() - start) / (STEP * 4));
    },
  };
  return B;
}
