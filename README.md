[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/funtoons/best-card-game-20261122-1826-bot-v2/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/funtoons/best-card-game-20261122-1826-bot-v2/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

# Ember Court v2 — A Duel of Cards

Aria, Ember Warden, duels Malachar, Frost Baron, across three lanes. A complete,
original card game that runs offline in a desktop browser from static files,
played with keyboard and mouse.

## How to play

- Each round you gain Kindle (1, then 2, up to 6). Playing a card costs Kindle.
- Click a card in your hand, then click a lane to play it.
- Creatures sharing an element in one lane gain +1 ATK (Resonance).
  Ward creatures must be struck first in their lane.
- Burn a card (B) once a round for +1 Kindle.
- Fill the Surge gauge to sweep a lane for 3 damage (S).
- Watch Malachar's intent at the top of the table — it tells you his next move.
- Reduce Malachar from 24 life to 0 before he does the same to you.
- End Turn (E) sends your creatures in. P pauses, M mutes, R plays again.

## The deck

24 original cards in four elements — Ember, Frost, Thorn, Storm — six per
element, costs 1–4 Kindle, creatures and spells. Every card has its own
picture, its cost as a white diamond, ATK as a gold sword and HP as a white
shield, so the values stay readable at thumbnail size.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots are taken from the game itself:

```sh
# ?shot=title|play|win|loss, each a real duel played by the engine
```

Hand it in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `main.ts` — hand-in program: copies `game/` and `screenshots/`, writes `dossier.json`
- `game/index.html` — the page
- `game/src/config.js` — tuning numbers, palette, layout
- `game/src/random.js` — seeded random (mulberry32)
- `game/src/cards.js` — the 24-card deck
- `game/src/engine.js` — duel rules: lanes, Resonance, Surge, Ward, AI intent
- `game/src/render.js` — canvas drawing: table, cards, title, win/loss screens
- `game/src/shots.js` — screenshot scenes, each a real duel played forward
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesised WebAudio tones, no audio files
- `game/src/main.js` — boot and frame loop
