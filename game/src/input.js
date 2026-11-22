// Keyboard and mouse input. Click a hand card, then click a lane to play
// it; hover a hand card for its full rules text. Buttons are real hit areas.
import { FIELD } from './config.js';
import { handCardRect } from './render.js';
import { playCard, burnCard, useSurge, endPlayerTurn, startDuel, createGame } from './engine.js';
import { playCardSound, playHitSound } from './audio.js';

const LANE_X = [24, 440, 856];
const LANE_W = 392;

function scalePoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
    y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
  };
}

function laneAt(point) {
  if (point.y < 112 || point.y > 428) return -1;
  for (let lane = 0; lane < 3; lane += 1) {
    if (point.x >= LANE_X[lane] && point.x <= LANE_X[lane] + LANE_W) return lane;
  }
  return -1;
}

export function attachInput(canvas, game, onRestart) {
  canvas.addEventListener('click', (event) => {
    const point = scalePoint(canvas, event);
    if (game.phase === 'title') {
      if (point.x >= 490 && point.x <= 790 && point.y >= 408 && point.y <= 470) {
        startDuel(game);
        playCardSound(game);
      } else if (point.x >= 490 && point.x <= 790 && point.y >= 486 && point.y <= 536) {
        game.showHelp = !game.showHelp;
      }
      return;
    }
    if (game.phase === 'over') {
      if (point.x >= 490 && point.x <= 790 && point.y >= 478 && point.y <= 530) onRestart();
      return;
    }
    if (game.paused) return;
    if (point.x >= 1080 && point.x <= 1248 && point.y >= 666 && point.y <= 710) {
      endPlayerTurn(game);
      playHitSound(game);
      return;
    }
    if (point.x >= 360 && point.x <= 490 && point.y >= 666 && point.y <= 710 && game.player.surge >= 6) {
      useSurge(game, game.player, game.selectedLane);
      return;
    }
    const lane = laneAt(point);
    if (game.selected >= 0 && lane >= 0) {
      game.selectedLane = lane;
      if (playCard(game, game.player, game.selected, lane)) playCardSound(game);
      game.selected = -1;
      return;
    }
    for (let i = 0; i < game.player.hand.length; i += 1) {
      const r = handCardRect(i, game.player.hand.length);
      if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) {
        game.selected = game.selected === i ? -1 : i;
        return;
      }
    }
  });

  canvas.addEventListener('mousemove', (event) => {
    const point = scalePoint(canvas, event);
    game.hover = -1;
    for (let i = 0; i < game.player.hand.length; i += 1) {
      const r = handCardRect(i, game.player.hand.length);
      if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) game.hover = i;
    }
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'p') { game.paused = !game.paused; return; }
    if (key === 'm') { game.muted = !game.muted; return; }
    if (key === 'escape') { game.showHelp = false; return; }
    if (game.phase === 'title' && (key === ' ' || key === 'enter')) { startDuel(game); return; }
    if (game.phase === 'over' && key === 'r') { onRestart(); return; }
    if (game.phase !== 'play' || game.paused) return;
    if (key >= '1' && key <= '5') {
      const index = Number(key) - 1;
      if (index < game.player.hand.length) game.selected = game.selected === index ? -1 : index;
    } else if (key === 'e') {
      endPlayerTurn(game);
      playHitSound(game);
    } else if (key === 'b' && game.selected >= 0) {
      burnCard(game, game.player, game.selected);
      game.selected = -1;
    } else if (key === 's') {
      useSurge(game, game.player, game.selectedLane);
    } else if (key === 'arrowleft') {
      game.selectedLane = Math.max(0, game.selectedLane - 1);
    } else if (key === 'arrowright') {
      game.selectedLane = Math.min(2, game.selectedLane + 1);
    }
  });
}

export function freshGame(seed) {
  return createGame(seed);
}
