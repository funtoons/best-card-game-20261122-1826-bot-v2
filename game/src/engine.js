// The duel rules. One job: turn state in, turn state out, nothing drawn
// here. Everything is seeded, so the same seed always plays the same duel.
import { LIFE_START, HAND_START, MAX_HAND, MAX_KINDLE, SURGE_MAX, SURGE_DAMAGE } from './config.js';
import { cardById, deckIds } from './cards.js';
import { mulberry32, shuffle } from './random.js';

let uidCounter = 1;

export function makeCreature(card) {
  return {
    uid: uidCounter,
    cardId: card.id,
    name: card.name,
    element: card.element,
    kind: 'creature',
    cost: card.cost,
    atk: card.atk,
    hp: card.hp,
    maxHp: card.hp,
    ward: Boolean(card.ward),
    art: card.art,
    text: card.text,
  };
}

function newSide(rand) {
  return {
    life: LIFE_START,
    kindle: 1,
    deck: shuffle(deckIds(), rand),
    hand: [],
    lanes: [[], [], []],
    surge: 0,
    surgeUsed: false,
    burned: false,
  };
}

export function createGame(seed) {
  uidCounter = 1;
  const rand = mulberry32(seed);
  const game = {
    seed,
    rand,
    turn: 1,
    phase: 'title',
    winner: null,
    paused: false,
    muted: false,
    player: newSide(rand),
    ai: newSide(rand),
    log: ['Aria, Ember Warden, meets Malachar, Frost Baron.'],
    fx: [],
    intent: '',
    selected: -1,
    selectedLane: 1,
    hover: -1,
    stats: { cardsPlayed: 0, damageDealt: 0, rounds: 0, surgeUsed: false },
  };
  for (let i = 0; i < HAND_START; i += 1) {
    drawCard(game.player);
    drawCard(game.ai);
  }
  game.intent = computeIntent(game);
  return game;
}

export function drawCard(side) {
  if (side.deck.length === 0 || side.hand.length >= MAX_HAND) return null;
  const id = side.deck.shift();
  side.hand.push(cardById(id));
  return id;
}

export function kindleForTurn(turn) {
  return Math.min(turn, 6);
}

// Resonance: creatures sharing an element in one lane strengthen each
// other. The bonus is computed, never stored, so it cannot drift.
export function resonanceBonus(side, lane, creature) {
  const mates = side.lanes[lane].filter((c) => c.element === creature.element);
  return mates.length >= 2 ? 1 : 0;
}

export function effectiveAtk(game, side, lane, creature) {
  return creature.atk + resonanceBonus(side, lane, creature);
}

function gainSurge(side, amount) {
  side.surge = Math.min(SURGE_MAX, side.surge + amount);
}

function damageCreature(game, side, creature, amount) {
  creature.hp -= amount;
  if (creature.hp <= 0) {
    const lane = side.lanes.findIndex((row) => row.includes(creature));
    if (lane >= 0) side.lanes[lane] = side.lanes[lane].filter((c) => c !== creature);
    return true;
  }
  return false;
}

function damageLife(game, side, amount, byPlayer, fxX, fxY) {
  side.life = Math.max(0, side.life - amount);
  if (byPlayer) game.stats.damageDealt += amount;
  if (side === game.player) gainSurge(game.player, 1);
  game.fx.push({ text: `-${amount}`, life: 1.2, side: side === game.player ? 'player' : 'ai', x: fxX ?? 640, y: fxY ?? 96 });
}

export function playCard(game, side, handIndex, lane) {
  const card = side.hand[handIndex];
  if (!card || side.kindle < card.cost) return false;
  if (card.kind === 'creature' && side.lanes[lane].length >= 3) return false;
  side.hand.splice(handIndex, 1);
  side.kindle -= card.cost;
  gainSurge(side, 1);
  if (side === game.player) game.stats.cardsPlayed += 1;
  const foe = side === game.player ? game.ai : game.player;
  if (card.kind === 'creature') {
    const creature = makeCreature(card);
    if (card.id === 'ember-drake') creature.atk += 1;
    if (card.id === 'thorn-ancient' && side === game.player) side.life = Math.min(LIFE_START, side.life + 2);
    side.lanes[lane].push(creature);
    game.log.push(`${card.name} enters ${['Left', 'Centre', 'Right'][lane]} Lane.`);
    if (card.id === 'frost-sprite') drawCard(side);
    if (card.id === 'storm-wisp') gainSurge(side, 1);
  } else if (card.id === 'ember-bolt') {
    const target = firstTarget(foe, lane);
    if (target) {
      if (damageCreature(game, foe, target, 3)) game.log.push(`Ember Bolt burns ${target.name}.`);
    } else {
      damageLife(game, foe, 3, side === game.player, [220, 636, 1052][lane], foe === game.ai ? 128 : 432);
    }
  } else if (card.id === 'frost-mend') {
    side.life = Math.min(LIFE_START, side.life + 5);
    game.log.push('Frost Mend restores 5 life.');
  } else if (card.id === 'thorn-snare') {
    const own = side.lanes.flat()[0];
    if (own) { own.ward = true; game.log.push(`${own.name} gains Ward.`); }
  } else if (card.id === 'storm-call') {
    drawCard(side);
    drawCard(side);
    gainSurge(side, 2);
    game.log.push('Storm Call draws 2 cards.');
  }
  return true;
}

function firstTarget(foe, lane) {
  const ward = foe.lanes[lane].find((c) => c.ward);
  if (ward) return ward;
  return foe.lanes[lane][0] || foe.lanes.flat().find((c) => c) || null;
}

export function burnCard(game, side, handIndex) {
  if (side.burned || side.kindle >= MAX_KINDLE) return false;
  const card = side.hand[handIndex];
  if (!card) return false;
  side.hand.splice(handIndex, 1);
  side.burned = true;
  side.kindle += 1;
  game.log.push(`${card.name} is kindled for +1 Kindle.`);
  return true;
}

export function useSurge(game, side, lane) {
  if (side.surge < SURGE_MAX || side.surgeUsed) return false;
  side.surge = 0;
  side.surgeUsed = true;
  if (side === game.player) game.stats.surgeUsed = true;
  const foe = side === game.player ? game.ai : game.player;
  const victims = foe.lanes[lane].slice();
  for (const creature of victims) damageCreature(game, foe, creature, SURGE_DAMAGE);
  game.log.push(`SURGE! ${SURGE_DAMAGE} damage sweeps a lane.`);
  return true;
}

function attackPhase(game, attacker, defender, byPlayer) {
  for (let lane = 0; lane < 3; lane += 1) {
    const attackers = attacker.lanes[lane].slice();
    for (const creature of attackers) {
      if (creature.hp <= 0) continue;
      const ward = defender.lanes[lane].find((c) => c.ward);
      const target = ward || defender.lanes[lane][0];
      const atk = effectiveAtk(game, attacker, lane, creature);
      if (target) {
        const died = damageCreature(game, defender, target, atk);
        damageCreature(game, attacker, creature, target.atk);
        if (died) game.log.push(`${target.name} falls in ${['Left', 'Centre', 'Right'][lane]} Lane.`);
      } else {
        // Life damage pins its floating text to the lane that dealt it.
        damageLife(game, defender, atk, byPlayer, [220, 636, 1052][lane], defender === game.ai ? 128 : 432);
        game.log.push(`${creature.name} strikes for ${atk}.`);
      }
      if (checkOver(game)) return;
    }
  }
}

export function endPlayerTurn(game) {
  if (game.phase !== 'play') return;
  attackPhase(game, game.player, game.ai, true);
  if (checkOver(game)) return;
  aiTurn(game);
  if (checkOver(game)) return;
  game.turn += 1;
  game.stats.rounds = game.turn;
  game.player.kindle = kindleForTurn(game.turn);
  game.player.burned = false;
  game.selected = -1;
  drawCard(game.player);
  game.intent = computeIntent(game);
  game.log.push(`Round ${game.turn}. Kindle ${game.player.kindle}.`);
}

function aiTurn(game) {
  const ai = game.ai;
  ai.kindle = kindleForTurn(game.turn);
  ai.burned = false;
  drawCard(ai);
  let played = 0;
  for (let guard = 0; guard < 6 && played < 3; guard += 1) {
    const affordable = ai.hand.findIndex((c) => c.cost <= ai.kindle && (c.kind === 'spell' || ai.lanes.some((row) => row.length < 3)));
    if (affordable < 0) break;
    const lane = ai.hand[affordable].kind === 'creature' ? weakestLane(ai) : 1;
    if (!playCard(game, ai, affordable, lane)) break;
    played += 1;
  }
  if (ai.surge >= SURGE_MAX && !ai.surgeUsed) useSurge(game, ai, 1);
  attackPhase(game, ai, game.player, false);
}

function weakestLane(side) {
  let best = 0;
  let bestScore = Infinity;
  for (let lane = 0; lane < 3; lane += 1) {
    const score = side.lanes[lane].reduce((sum, c) => sum + c.atk + c.hp, 0);
    if (score < bestScore) { bestScore = score; best = lane; }
  }
  return best;
}

export function computeIntent(game) {
  const ai = game.ai;
  const nextKindle = kindleForTurn(game.turn + 1);
  if (ai.surge >= SURGE_MAX && !ai.surgeUsed) return 'Unleash Surge on a lane';
  const big = ai.hand.find((c) => c.kind === 'creature' && c.cost >= 3 && c.cost <= nextKindle);
  if (big) return `Play ${big.name} (${big.cost} Kindle)`;
  const laneNames = ['left', 'centre', 'right'];
  for (let lane = 0; lane < 3; lane += 1) {
    if (ai.lanes[lane].length > 0) return `Attack the ${laneNames[lane]} lane`;
  }
  return 'Draw and wait';
}

export function checkOver(game) {
  if (game.phase === 'over') return true;
  if (game.player.life <= 0 || game.ai.life <= 0) {
    game.phase = 'over';
    game.winner = game.player.life > 0 ? 'player' : 'ai';
    game.fx = [];
    game.log.push(game.winner === 'player' ? 'Malachar falls. Aria wins the court.' : 'Aria falls. Malachar keeps the court.');
    return true;
  }
  return false;
}

export function startDuel(game) {
  game.phase = 'play';
  game.turn = 1;
  game.player.kindle = 1;
  game.ai.kindle = 1;
  game.intent = computeIntent(game);
}
