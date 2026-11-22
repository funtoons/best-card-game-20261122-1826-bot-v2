// Synthesised sound only: short WebAudio tones, no audio files, no network.
// The game plays fine with sound off; M toggles it.
let context = null;

function ensure() {
  if (context) return context;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
  } catch {
    context = null;
  }
  return context;
}

export function playTone(game, frequency, duration, type = 'sine', volume = 0.08) {
  if (game.muted) return;
  const audio = ensure();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

export function playCardSound(game) { playTone(game, 520, 0.12, 'triangle'); }
export function playHitSound(game) { playTone(game, 180, 0.18, 'sawtooth', 0.06); }
export function playWinSound(game) {
  playTone(game, 523, 0.2, 'triangle');
  setTimeout(() => playTone(game, 659, 0.2, 'triangle'), 140);
  setTimeout(() => playTone(game, 784, 0.35, 'triangle'), 280);
}
