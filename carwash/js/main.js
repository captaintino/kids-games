// Template game: copy this folder to start a new game.
import * as sfx from '../../shared/js/audio.js';
import { say } from '../../shared/js/speech.js';
import {
  boot, $, fx, showScreen, celebrate, onPointer, createStore, centerOf, replayClass,
} from '../../shared/js/kit.js';

const store = createStore('template', { best: 0 });
let taps = 0;

function play() {
  taps = 0;
  $('#score').textContent = 'Taps: 0';
  showScreen(null);
  $('#play').classList.remove('hidden');
}
function leave() {
  $('#play').classList.add('hidden');
  showScreen('screen-title');
}

onPointer($('#target'), {
  down() {
    taps++;
    $('#score').textContent = `Taps: ${taps}`;
    const c = centerOf($('#target'));
    fx.burst(c.x, c.y);
    sfx.pop();
    replayClass($('#target'), 'bounce');
    say(String(taps));
    if (taps === 5) {
      store.data.best = Math.max(store.data.best, taps);
      store.persist();
      celebrate('Hooray!', 'Five taps!');
    }
  },
});

boot({
  party: ['#7b5cff', '#c27bff', '#6fc8ff'],
  onAction(action) {
    if (action === 'play') play();
    if (action === 'back') leave();
  },
  onBack(screen) {
    if (screen === null) { leave(); return true; }
    return false;
  },
});
