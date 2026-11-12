// Spoken words, using the browser's built-in text-to-speech (no audio files).
//
//   say('Circle!')                 speak now, cutting off anything still being said
//   say('Two', { queue: true })    wait for the current words to finish first
//   say('Moo!', { pitch: 0.6, rate: 0.8 })
//   canSpeak()                     false on browsers without speech
//   setSpeechMuted(true)           games call this from their sound button
//
// Every game must call unlockSpeech() from its first tap: iOS only allows speech
// that started inside a touch, and once one utterance has played the rest are free.
// The kit (kit.js) does this for you.

const synth = typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;
let voice = null;
let muted = false;
let unlocked = false;

// Friendly, clear voices first. Names differ per platform; the first match wins.
const PREFERRED = [
  'Samantha', 'Karen', 'Moira', 'Tessa', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny',
  'Microsoft Zira', 'Google UK English Female',
];

function pickVoice() {
  if (!synth) return;
  let list = [];
  try { list = synth.getVoices() || []; } catch (err) { return; }
  if (!list.length) return;
  const en = list.filter((v) => /^en([-_]|$)/i.test(v.lang));
  for (const name of PREFERRED) {
    const v = en.find((x) => x.name.indexOf(name) === 0);
    if (v) { voice = v; return; }
  }
  voice = en.find((v) => /en[-_]US/i.test(v.lang) && v.localService) ||
    en.find((v) => /en[-_]US/i.test(v.lang)) || en[0] || null;
}
if (synth) {
  pickVoice();
  try {
    if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);
    else synth.onvoiceschanged = pickVoice;
  } catch (err) { /* ignore */ }
}

export function canSpeak() { return !!synth; }
export function setSpeechMuted(m) {
  muted = !!m;
  if (muted) stopSpeech();
}

export function stopSpeech() {
  if (!synth) return;
  try { synth.cancel(); } catch (err) { /* ignore */ }
}

/** Call from inside a tap. Plays a silent utterance so iOS allows speech later. */
export function unlockSpeech() {
  if (!synth || unlocked) return;
  unlocked = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    synth.speak(u);
  } catch (err) { /* ignore */ }
}

/**
 * Speak some words. Returns a promise that resolves when they have been said
 * (or straight away if speech is muted or missing), so games can wait for it.
 */
export function say(text, opts = {}) {
  if (!synth || muted || !text) return Promise.resolve();
  if (!voice) pickVoice();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    try {
      if (!opts.queue) synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
      u.rate = opts.rate || 0.95;
      u.pitch = opts.pitch || 1.15;
      u.volume = opts.volume == null ? 1 : opts.volume;
      u.onend = finish;
      u.onerror = finish;
      // Chrome sometimes never fires onend; don't let a game wait forever
      setTimeout(finish, 600 + text.length * 120);
      // Chrome drops an utterance spoken in the same tick as cancel()
      setTimeout(() => { try { synth.speak(u); } catch (err) { finish(); } }, opts.queue ? 0 : 30);
      // Chrome on Android pauses itself after ~15s of silence
      if (synth.paused) synth.resume();
    } catch (err) { finish(); }
  });
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
/** Number words for counting out loud (speech engines read "1" fine, but words are surer). */
export function numberWord(n) { return ONES[n] || String(n); }
