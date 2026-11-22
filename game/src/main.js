// Boot: a fixed 1280x720 canvas scaled to the window. With ?shot= in the
// URL the page renders one screenshot scene once and stops, so a headless
// browser captures exactly the frame the engine produced.
import { FIELD } from './config.js';
import { createGame } from './engine.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';
import { attachInput } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '3') || 3;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}

if (shot) {
  const staged = stageShot(shot, seed);
  fitCanvas();
  drawGame(ctx, staged.game);
  document.title = `Ember Court — ${shot}`;
} else {
  const game = createGame(seed);
  attachInput(canvas, game, () => {
    const fresh = createGame(seed);
    Object.assign(game, fresh);
  });
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    for (const fx of game.fx) fx.life -= dt;
    game.fx = game.fx.filter((fx) => fx.life > 0);
    drawGame(ctx, game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
