// The screenshot scenes behind ?shot=title|play|win|loss. Every scene is a
// real duel played forward through the engine — the win and loss frames come
// from duels that actually ended that way, with their real final life,
// cards played and damage dealt. Nothing is staged: the loss scene searches
// a few fixed seeds for one where a passive player genuinely loses, and the
// win scene searches the same way for one where a sharp player genuinely
// wins. The search list is fixed, so the same seed always gives the same
// frame.
import { createGame, startDuel, playCard, burnCard, useSurge, endPlayerTurn } from './engine.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';

const WIN_SEEDS = [7, 3, 5, 11, 13, 17, 19, 23, 29, 31];
const LOSS_SEEDS = [11, 7, 3, 5, 13, 17, 19, 23, 29, 31];
const MAX_ROUNDS = 40;

function weakestLaneWithRoom(game, side) {
  let best = 1;
  let bestScore = Infinity;
  for (let lane = 0; lane < 3; lane += 1) {
    if (side.lanes[lane].length >= 3) continue;
    const score = side.lanes[lane].reduce((sum, c) => sum + c.atk + c.hp, 0);
    if (score < bestScore) { bestScore = score; best = lane; }
  }
  return best;
}

function laneWithEnemy(game) {
  for (let lane = 0; lane < 3; lane += 1) if (game.ai.lanes[lane].length > 0) return lane;
  return 1;
}

// The sharp player: play the biggest affordable card, burn a card when
// nothing is affordable, use Surge the moment it is ready.
export function playSharp(game) {
  for (let guard = 0; guard < 10; guard += 1) {
    if (game.player.surge >= 6 && !game.player.surgeUsed) useSurge(game, game.player, laneWithEnemy(game));
    const hand = game.player.hand;
    let best = -1;
    let bestCost = -1;
    for (let i = 0; i < hand.length; i += 1) {
      const card = hand[i];
      if (card.cost > game.player.kindle) continue;
      if (card.id === 'frost-mend' && game.player.life >= 22) continue;
      if (card.id === 'thorn-snare' && game.player.lanes.flat().length === 0) continue;
      if (card.kind === 'creature' && game.player.lanes.every((row) => row.length >= 3)) continue;
      if (card.cost > bestCost) { bestCost = card.cost; best = i; }
    }
    if (best < 0) {
      if (!game.player.burned && hand.length > 0 && game.player.kindle < 8) {
        let cheapest = 0;
        for (let i = 1; i < hand.length; i += 1) if (hand[i].cost < hand[cheapest].cost) cheapest = i;
        burnCard(game, game.player, cheapest);
        continue;
      }
      break;
    }
    const card = hand[best];
    const lane = card.kind === 'creature' ? weakestLaneWithRoom(game, game.player) : laneWithEnemy(game);
    if (!playCard(game, game.player, best, lane)) break;
  }
}

export function playWeak(game) {
  // The reckless player: one cheap card a round, always into the lane
  // where Malachar is strongest, no burning, no Surge. It plays real
  // cards and deals real damage — and still loses, which is the point:
  // a loss frame with "Damage dealt: 0" would look staged, as v1's did.
  const hand = game.player.hand;
  let best = -1;
  let bestCost = 99;
  for (let i = 0; i < hand.length; i += 1) {
    const card = hand[i];
    if (card.cost > game.player.kindle || card.cost >= bestCost) continue;
    if (card.kind === 'creature' && game.player.lanes.every((row) => row.length >= 3)) continue;
    bestCost = card.cost;
    best = i;
  }
  if (best < 0) return;
  const card = hand[best];
  let lane = 1;
  let most = -1;
  for (let l = 0; l < 3; l += 1) {
    const power = game.ai.lanes[l].reduce((sum, c) => sum + c.atk + c.hp, 0);
    if (power > most) { most = power; lane = l; }
  }
  playCard(game, game.player, best, card.kind === 'creature' ? lane : 1);
}

function runDuel(seed, style) {
  const game = createGame(seed);
  startDuel(game);
  for (let round = 0; round < MAX_ROUNDS && game.phase === 'play'; round += 1) {
    if (style === 'sharp') playSharp(game);
    else if (style === 'weak') playWeak(game);
    endPlayerTurn(game);
  }
  return game;
}

function runMidDuel(seed, rounds) {
  const game = createGame(seed);
  startDuel(game);
  for (let round = 0; round < rounds && game.phase === 'play'; round += 1) {
    playSharp(game);
    endPlayerTurn(game);
  }
  return game;
}

export function stageShot(name, seed) {
  if (name === 'win') {
    for (const candidate of WIN_SEEDS) {
      const game = runDuel(candidate, 'sharp');
      if (game.phase === 'over' && game.winner === 'player') { game.fx = []; return { screen: SCREEN_OVER, game }; }
    }
    const game = runDuel(WIN_SEEDS[0], 'sharp');
    game.fx = [];
    return { screen: game.phase === 'over' ? SCREEN_OVER : SCREEN_PLAY, game };
  }
  if (name === 'loss') {
    for (const candidate of LOSS_SEEDS) {
      const game = runDuel(candidate, 'weak');
      if (game.phase === 'over' && game.winner === 'ai') { game.fx = []; return { screen: SCREEN_OVER, game }; }
    }
    const game = runDuel(LOSS_SEEDS[0], 'weak');
    game.fx = [];
    return { screen: game.phase === 'over' ? SCREEN_OVER : SCREEN_PLAY, game };
  }
  if (name === 'play') {
    // A mid-duel cover needs a FULL board: at least 4 creatures, both
    // sides present, still in play. The sharp player empties its hand
    // and combat thins the board, so try the requested seed at 6, 5 and
    // 4 rounds, then a fixed fallback list — first match wins, so the
    // frame is deterministic. Floating damage text is cleared: fx are a
    // live animation that the shot renderer draws once, so every "-N"
    // from earlier rounds would freeze onto the static frame.
    const base = seed || 118;
    const tries = [[base, 6], [base, 5], [base, 4]];
    for (const s of [118, 81, 23, 54, 50]) for (const r of [6, 5, 4]) tries.push([s, r]);
    for (const [s, rounds] of tries) {
      const game = runMidDuel(s, rounds);
      const ai = game.ai.lanes.flat().length;
      const pl = game.player.lanes.flat().length;
      if (game.phase === 'play' && ai >= 1 && pl >= 1 && ai + pl >= 4) {
        game.fx = [];
        return { screen: SCREEN_PLAY, game };
      }
    }
    const game = runMidDuel(base, 4);
    game.fx = [];
    return { screen: SCREEN_PLAY, game };
  }
  const game = createGame(seed || 3);
  return { screen: SCREEN_TITLE, game };
}
