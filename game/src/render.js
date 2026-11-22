// Everything the eye sees. One job: draw the game state on a 1280x720
// canvas. Stats are white and gold, never element colours; card text sits
// in its own box, clear of the ATK/HP strip; floating damage text is drawn
// only during play, never under a win/loss overlay.
import { FIELD, PALETTE, STAT, FONT, FONT_UI, LANES, SURGE_MAX } from './config.js';
import { ELEMENTS } from './cards.js';
import { mulberry32 } from './random.js';
import { effectiveAtk, resonanceBonus } from './engine.js';

const LANE_X = [24, 440, 856];
const LANE_W = 392;
const BOARD_CARD = { w: 118, h: 128 };
const HAND_CARD = { w: 138, h: 196 };

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function diamond(ctx, cx, cy, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// One distinct picture per card, drawn from its art key. No two cards share
// a picture: v1 gave Frost Wolf and Frost Sprite the same icon.
export function drawArt(ctx, art, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.08);
  ctx.lineJoin = 'round';
  const u = s / 2;
  switch (art) {
    case 'flame':
      ctx.beginPath(); ctx.moveTo(0, -u); ctx.quadraticCurveTo(u * 0.8, -u * 0.1, u * 0.4, u * 0.5); ctx.quadraticCurveTo(u * 0.2, u * 0.9, 0, u * 0.9); ctx.quadraticCurveTo(-u * 0.7, u * 0.9, -u * 0.5, u * 0.2); ctx.quadraticCurveTo(-u * 0.6, -u * 0.4, 0, -u); ctx.fill();
      break;
    case 'snow':
      for (let i = 0; i < 3; i += 1) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath(); ctx.moveTo(-Math.cos(a) * u, -Math.sin(a) * u); ctx.lineTo(Math.cos(a) * u, Math.sin(a) * u); ctx.stroke();
      }
      break;
    case 'leaf':
      ctx.beginPath(); ctx.moveTo(0, -u); ctx.quadraticCurveTo(u * 0.9, -u * 0.2, 0, u); ctx.quadraticCurveTo(-u * 0.9, -u * 0.2, 0, -u); ctx.fill();
      break;
    case 'imp':
      ctx.beginPath(); ctx.arc(0, u * 0.2, u * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-u * 0.5, -u * 0.3); ctx.lineTo(-u * 0.7, -u); ctx.lineTo(-u * 0.1, -u * 0.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(u * 0.5, -u * 0.3); ctx.lineTo(u * 0.7, -u); ctx.lineTo(u * 0.1, -u * 0.5); ctx.closePath(); ctx.fill();
      break;
    case 'fox':
    case 'wolf':
    case 'lynx':
      ctx.beginPath(); ctx.moveTo(-u * 0.7, -u * 0.2); ctx.lineTo(-u * 0.4, -u); ctx.lineTo(-u * 0.1, -u * 0.3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(u * 0.7, -u * 0.2); ctx.lineTo(u * 0.4, -u); ctx.lineTo(u * 0.1, -u * 0.3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, u * 0.1, u * 0.6, 0, Math.PI * 2); ctx.fill();
      break;
    case 'bolt':
    case 'call':
      ctx.beginPath(); ctx.moveTo(u * 0.2, -u); ctx.lineTo(-u * 0.5, u * 0.2); ctx.lineTo(-u * 0.05, u * 0.2); ctx.lineTo(-u * 0.3, u); ctx.lineTo(u * 0.6, -u * 0.2); ctx.lineTo(u * 0.1, -u * 0.2); ctx.closePath(); ctx.fill();
      break;
    case 'drake':
    case 'dragon':
    case 'hawk':
      ctx.beginPath(); ctx.moveTo(0, u * 0.5); ctx.quadraticCurveTo(-u, -u * 0.6, -u * 0.9, -u); ctx.quadraticCurveTo(-u * 0.3, -u * 0.2, 0, -u * 0.3); ctx.quadraticCurveTo(u * 0.3, -u * 0.2, u * 0.9, -u); ctx.quadraticCurveTo(u, -u * 0.6, 0, u * 0.5); ctx.fill();
      break;
    case 'warden':
    case 'aegis':
      ctx.beginPath(); ctx.moveTo(0, -u); ctx.lineTo(u * 0.8, -u * 0.5); ctx.lineTo(u * 0.8, u * 0.2); ctx.quadraticCurveTo(u * 0.8, u * 0.8, 0, u); ctx.quadraticCurveTo(-u * 0.8, u * 0.8, -u * 0.8, u * 0.2); ctx.lineTo(-u * 0.8, -u * 0.5); ctx.closePath(); ctx.stroke();
      diamond(ctx, 0, 0, u * 0.3, color, null);
      break;
    case 'sprite':
    case 'wisp':
      ctx.beginPath();
      for (let i = 0; i < 8; i += 1) {
        const a = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? u : u * 0.4;
        ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
      break;
    case 'mend':
      ctx.fillRect(-u * 0.25, -u * 0.8, u * 0.5, u * 1.6);
      ctx.fillRect(-u * 0.8, -u * 0.25, u * 1.6, u * 0.5);
      break;
    case 'bear':
      ctx.beginPath(); ctx.arc(-u * 0.55, -u * 0.55, u * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(u * 0.55, -u * 0.55, u * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, u * 0.7, 0, Math.PI * 2); ctx.fill();
      break;
    case 'wall':
      for (let r = 0; r < 3; r += 1) for (let c = 0; c < 3; c += 1) ctx.strokeRect(-u + c * (2 * u / 3), -u + r * (2 * u / 3), 2 * u / 3, 2 * u / 3);
      break;
    case 'sprout':
    case 'ancient':
      ctx.beginPath(); ctx.moveTo(0, u); ctx.lineTo(0, -u * 0.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -u * 0.5, u * 0.5, 0, Math.PI * 2); ctx.fill();
      break;
    case 'viper':
      ctx.beginPath(); ctx.moveTo(-u * 0.6, -u * 0.7); ctx.quadraticCurveTo(u * 0.8, -u * 0.3, -u * 0.2, u * 0.1); ctx.quadraticCurveTo(-u * 0.8, u * 0.4, u * 0.6, u * 0.7); ctx.stroke();
      break;
    case 'snare':
      ctx.beginPath(); ctx.arc(0, 0, u * 0.8, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-u * 0.8, 0); ctx.lineTo(u * 0.8, 0); ctx.moveTo(0, -u * 0.8); ctx.lineTo(0, u * 0.8); ctx.stroke();
      break;
    case 'stag':
      ctx.beginPath(); ctx.moveTo(-u * 0.4, -u * 0.2); ctx.lineTo(-u * 0.9, -u); ctx.moveTo(-u * 0.4, -u * 0.2); ctx.lineTo(-u * 0.2, -u); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(u * 0.4, -u * 0.2); ctx.lineTo(u * 0.9, -u); ctx.moveTo(u * 0.4, -u * 0.2); ctx.lineTo(u * 0.2, -u); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, u * 0.2, u * 0.55, 0, Math.PI * 2); ctx.fill();
      break;
    case 'bramble':
      ctx.beginPath(); ctx.moveTo(-u, u * 0.6); ctx.lineTo(u, -u * 0.6); ctx.moveTo(-u, -u * 0.6); ctx.lineTo(u, u * 0.6); ctx.stroke();
      break;
    case 'djinn':
      ctx.beginPath(); ctx.arc(0, 0, u * 0.7, 0.5, Math.PI * 1.8); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, u * 0.35, Math.PI, Math.PI * 2.3); ctx.stroke();
      break;
    case 'titan':
      ctx.beginPath(); ctx.moveTo(-u, u * 0.7); ctx.lineTo(-u * 0.2, -u * 0.8); ctx.lineTo(u * 0.3, u * 0.1); ctx.lineTo(u * 0.7, -u * 0.5); ctx.lineTo(u, u * 0.7); ctx.closePath(); ctx.fill();
      break;
    default:
      ctx.beginPath(); ctx.arc(0, 0, u * 0.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  // A face-down card must read as a CARD at a glance: portrait, a gold
  // outer edge, a second inner frame, and a small centred diamond.
  // v2 shipped 52x48 near-square backs whose big diamond looked like
  // three gold buttons in the top bar, not a hand of cards.
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = PALETTE.panel;
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(217,164,65,0.55)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 5);
  ctx.stroke();
  diamond(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.17, PALETTE.gold, null);
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath(); ctx.arc(x + 10, y + 10, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w - 10, y + h - 10, 2, 0, Math.PI * 2); ctx.fill();
}

export function drawCard(ctx, card, x, y, w, h, opts = {}) {
  if (opts.faceDown) { drawCardBack(ctx, x, y, w, h); return; }
  const el = ELEMENTS[card.element];
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = PALETTE.cardWhite;
  ctx.fill();
  ctx.strokeStyle = opts.selected ? PALETTE.goldBright : PALETTE.gold;
  ctx.lineWidth = opts.selected ? 4 : 2.5;
  ctx.stroke();
  if (opts.dim) { ctx.fillStyle = 'rgba(20,26,51,0.45)'; ctx.fill(); }
  // Element strip: colour only here, never on the stats.
  ctx.fillStyle = el.color;
  ctx.fillRect(x + 3, y + 3, w - 6, 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 10px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.name.toUpperCase(), x + w / 2, y + 11);
  // Unique art in a light tint of the element.
  const artY = y + 22;
  const artH = Math.max(28, Math.round(h * 0.3));
  ctx.fillStyle = el.light;
  ctx.fillRect(x + 8, artY, w - 16, artH);
  drawArt(ctx, card.art, x + w / 2, artY + artH / 2, Math.min(artH * 0.62, 52), el.color);
  // Cost gem, drawn AFTER the art: a white diamond with a gold edge,
  // top-left, number in dark ink. The gem IS the card's cost in Kindle
  // and must read on every card, spells included. v2 drew it BEFORE the
  // art rect, so the art painted over it and only a gold sliver stuck
  // out at the card edge — the meaningless orange glyph in the corner.
  const gemR = h >= 170 ? 15 : 12;
  diamond(ctx, x + 20, y + 34, gemR, STAT.costFill, STAT.costEdge);
  ctx.fillStyle = STAT.costInk;
  ctx.font = `bold ${h >= 170 ? 16 : 13}px ${FONT_UI}`;
  ctx.fillText(String(card.cost), x + 20, y + 35);
  // Name below the art. On small board cards that is all the text there is
  // room for: the rules text only fits on the large hand cards, where it
  // gets its own padded box clear of the stat strip. v1 squeezed rules
  // text onto every card and it spilled over the ATK/HP strip.
  const nameY = artY + artH + 14;
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `bold ${w > 130 ? 14 : 12}px ${FONT}`;
  ctx.fillText(card.name, x + w / 2, nameY);
  const stripY = y + h - 26;
  if (h >= 170) {
    ctx.font = `10.5px ${FONT_UI}`;
    ctx.fillStyle = '#4a4436';
    const lines = wrapText(ctx, card.text, w - 18).slice(0, 2);
    lines.forEach((line, i) => ctx.fillText(line, x + w / 2, nameY + 13 + i * 12));
  }
  // Stat strip: sword for ATK on gold, shield for HP on white. Distinct
  // shapes, distinct fills, never the element colour.
  if (card.kind === 'creature') {
    ctx.fillStyle = STAT.atkFill;
    roundRect(ctx, x + 8, stripY, 44, 22, 5);
    ctx.fill();
    ctx.fillStyle = STAT.atkInk;
    ctx.font = `bold 14px ${FONT_UI}`;
    ctx.textAlign = 'left';
    // Sword: a drawn blade, not a font glyph (headless fonts vary).
    ctx.beginPath();
    ctx.moveTo(x + 16, stripY + 4); ctx.lineTo(x + 24, stripY + 11); ctx.lineTo(x + 16, stripY + 18); ctx.lineTo(x + 12, stripY + 11);
    ctx.closePath(); ctx.fill();
    ctx.fillText(String(card.atk), x + 30, stripY + 11);
    ctx.textAlign = 'center';
    ctx.fillStyle = STAT.hpFill;
    roundRect(ctx, x + w - 52, stripY, 44, 22, 5);
    ctx.fill();
    ctx.strokeStyle = STAT.hpEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = STAT.hpInk;
    ctx.textAlign = 'left';
    // Shield: a drawn outline, not a font glyph.
    ctx.beginPath();
    ctx.moveTo(x + w - 44, stripY + 4); ctx.lineTo(x + w - 34, stripY + 4); ctx.lineTo(x + w - 34, stripY + 12);
    ctx.quadraticCurveTo(x + w - 34, stripY + 18, x + w - 39, stripY + 19);
    ctx.quadraticCurveTo(x + w - 44, stripY + 18, x + w - 44, stripY + 12);
    ctx.closePath(); ctx.fill();
    ctx.fillText(String(card.hp), x + w - 30, stripY + 11);
    ctx.textAlign = 'center';
  } else {
    ctx.fillStyle = PALETTE.gold;
    roundRect(ctx, x + 8, stripY, w - 16, 22, 5);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `bold 12px ${FONT_UI}`;
    ctx.fillText('SPELL', x + w / 2, stripY + 11);
  }
  if (card.ward) {
    if (h >= 170) {
      ctx.fillStyle = PALETTE.gold;
      roundRect(ctx, x + w - 52, y + 22, 46, 16, 7);
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `bold 9px ${FONT_UI}`;
      ctx.fillText('WARD', x + w - 29, y + 30);
    } else {
      // Small board card: a white shield with a W, set into the strip.
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x + w - 20, y + 4); ctx.lineTo(x + w - 8, y + 4); ctx.lineTo(x + w - 8, y + 12);
      ctx.quadraticCurveTo(x + w - 8, y + 17, x + w - 14, y + 18);
      ctx.quadraticCurveTo(x + w - 20, y + 17, x + w - 20, y + 12);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `bold 9px ${FONT_UI}`;
      ctx.fillText('W', x + w - 14, y + 12);
    }
  }
  ctx.textBaseline = 'alphabetic';
}

function lifeBar(ctx, x, y, w, life) {
  ctx.fillStyle = '#0d1122';
  roundRect(ctx, x, y, w, 14, 7);
  ctx.fill();
  ctx.fillStyle = PALETTE.life;
  const fillW = Math.max(0, (w * life) / 24);
  if (fillW > 2) { roundRect(ctx, x, y, fillW, 14, 7); ctx.fill(); }
  // Drawn heart, not a font glyph: headless fonts render ♥ inconsistently.
  ctx.fillStyle = '#ffffff';
  const hx = x + w + 14;
  const hy = y + 7;
  ctx.beginPath();
  ctx.arc(hx - 3.5, hy - 2, 3.5, 0, Math.PI * 2);
  ctx.arc(hx + 3.5, hy - 2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx - 7, hy - 1); ctx.lineTo(hx + 7, hy - 1); ctx.lineTo(hx, hy + 7);
  ctx.closePath(); ctx.fill();
  ctx.font = `bold 11px ${FONT_UI}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${life} / 24`, hx + 10, hy);
  ctx.textAlign = 'center';
}

function kindleGem(ctx, x, y, kindle) {
  diamond(ctx, x, y, 12, '#ffffff', PALETTE.gold);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `bold 12px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(kindle), x, y + 1);
  ctx.fillStyle = PALETTE.ivory;
  ctx.font = `11px ${FONT_UI}`;
  ctx.textAlign = 'left';
  ctx.fillText('Kindle', x + 16, y);
}

export function drawTitle(ctx, game) {
  ctx.fillStyle = PALETTE.tableEdge;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.strokeStyle = 'rgba(217,164,65,0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.arc(640, 300, 90 + i * 55, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = `bold 84px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EMBER COURT', 640, 168);
  ctx.fillStyle = PALETTE.ivory;
  ctx.font = `italic 24px ${FONT}`;
  ctx.fillText('A Duel of Cards — Kindle · Ward · Surge', 640, 226);
  const names = Object.values(ELEMENTS);
  names.forEach((el, i) => {
    const cx = 640 + (i - 1.5) * 130;
    ctx.fillStyle = el.color;
    ctx.beginPath();
    ctx.arc(cx, 300, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawArt(ctx, el.glyph, cx, 300, 34, '#ffffff');
    ctx.fillStyle = PALETTE.ivory;
    ctx.font = `bold 14px ${FONT_UI}`;
    ctx.fillText(el.name, cx, 352);
  });
  // Real buttons, not a "click or press space" line over the table.
  ctx.fillStyle = PALETTE.gold;
  roundRect(ctx, 490, 408, 300, 62, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `bold 26px ${FONT_UI}`;
  ctx.beginPath();
  ctx.moveTo(596, 428); ctx.lineTo(596, 452); ctx.lineTo(616, 440);
  ctx.closePath(); ctx.fill();
  ctx.fillText('PLAY', 648, 440);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  roundRect(ctx, 490, 486, 300, 50, 10);
  ctx.stroke();
  ctx.fillStyle = PALETTE.ivory;
  ctx.font = `bold 18px ${FONT_UI}`;
  ctx.fillText('HOW TO PLAY', 640, 512);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `14px ${FONT_UI}`;
  ctx.fillText('24 cards  ·  3 lanes  ·  Life 24  ·  Offline, keyboard + mouse', 640, 590);
  ctx.fillText('Aria, Ember Warden, duels Malachar, Frost Baron.', 640, 616);
  if (game.showHelp) drawHelp(ctx);
}

function drawHelp(ctx) {
  ctx.fillStyle = 'rgba(10,14,30,0.88)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.cardWhite;
  roundRect(ctx, 340, 110, 600, 500, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `bold 26px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('HOW TO PLAY', 640, 152);
  ctx.font = `15px ${FONT_UI}`;
  ctx.textAlign = 'left';
  const lines = [
    '1. Each round you gain Kindle (1, then 2, up to 6).',
    '2. Click a card in your hand, then click a lane to play it.',
    '3. Creatures in the same lane and element gain +1 ATK',
    '    (Resonance). Ward creatures must be struck first.',
    '4. Burn a card (B) once a round for +1 Kindle.',
    '5. Fill the Surge gauge to sweep a lane for 3 damage.',
    '6. Watch Malachar’s intent — it tells you his next move.',
    '7. Reduce Malachar from 24 life to 0 before he does the',
    '    same to you. End Turn (E) sends your creatures in.',
    '',
    'Keys: 1–5 select a card · E end turn · B burn · S surge',
    'P pause · M mute · R play again · Esc close this panel.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 380, 196 + i * 26));
  ctx.textAlign = 'center';
}

function drawLane(ctx, game, lane) {
  const x = LANE_X[lane];
  // Lanes start at y=112, below the taller (104px) top bar that now
  // holds Malachar's face-down hand as real portrait cards.
  ctx.fillStyle = lane % 2 === 0 ? PALETTE.lane : PALETTE.laneAlt;
  roundRect(ctx, x, 112, LANE_W, 316, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.ivory;
  ctx.font = `bold 13px ${FONT_UI}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(LANES[lane].toUpperCase(), x + 12, 124);
  const res = game.player.lanes[lane].some((c) => resonanceBonus(game.player, lane, c) > 0)
    || game.ai.lanes[lane].some((c) => resonanceBonus(game.ai, lane, c) > 0);
  if (res) {
    ctx.fillStyle = PALETTE.gold;
    roundRect(ctx, x + LANE_W - 128, 114, 116, 20, 9);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `bold 11px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.fillText('RESONANCE +1', x + LANE_W - 70, 124);
  }
  ctx.textAlign = 'center';
  // Opponent creatures on top, player creatures below: the table reads
  // the same way every frame, with room to spare.
  game.ai.lanes[lane].forEach((creature, i) => {
    const cx = x + 14 + i * (BOARD_CARD.w + 10);
    const shown = { ...creature, atk: effectiveAtk(game, game.ai, lane, creature) };
    drawCard(ctx, shown, cx, 142, BOARD_CARD.w, BOARD_CARD.h);
  });
  game.player.lanes[lane].forEach((creature, i) => {
    const cx = x + 14 + i * (BOARD_CARD.w + 10);
    const shown = { ...creature, atk: effectiveAtk(game, game.player, lane, creature) };
    const selected = game.selected >= 0 && game.selectedLane === lane;
    drawCard(ctx, shown, cx, 292, BOARD_CARD.w, BOARD_CARD.h, { selected });
  });
  // Ownership divider: the gap between the AI row (bottom y=270) and the
  // player row (top y=292) carries a dashed line and two labels, so which
  // half belongs to whom never has to be guessed from position alone.
  ctx.strokeStyle = 'rgba(217,164,65,0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(x + 10, 282); ctx.lineTo(x + LANE_W - 10, 282); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `bold 10px ${FONT_UI}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.goldBright;
  ctx.textAlign = 'left';
  ctx.fillText('LAWAN', x + 12, 276);
  ctx.textAlign = 'right';
  ctx.fillText('KAMU', x + LANE_W - 12, 276);
  ctx.textAlign = 'center';
  if (game.selected >= 0 && game.selectedLane === lane) {
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    roundRect(ctx, x - 4, 280, LANE_W + 8, 148, 10);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function handCardRect(index, count) {
  const total = count * HAND_CARD.w + (count - 1) * 14;
  const x0 = (FIELD.width - total) / 2;
  return { x: x0 + index * (HAND_CARD.w + 14), y: 444, w: HAND_CARD.w, h: HAND_CARD.h };
}

export function drawTable(ctx, game) {
  ctx.fillStyle = PALETTE.table;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Top bar: Malachar, his intent, his face-down hand. The bar is
  // 104px tall so the opponent hand fits as real portrait cards
  // (64x80) with a label underneath — not the 52x48 near-squares
  // v2 shipped, whose big diamond read as three gold buttons.
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(0, 0, FIELD.width, 104);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.beginPath(); ctx.moveTo(0, 104); ctx.lineTo(FIELD.width, 104); ctx.stroke();
  ctx.fillStyle = ELEMENTS.frost.color;
  ctx.beginPath(); ctx.arc(40, 52, 22, 0, Math.PI * 2); ctx.fill();
  // Frost emblem (snowflake), the same glyph the title screen uses for
  // Frost — not the 3x3 grid, which read as a placeholder.
  drawArt(ctx, 'snow', 40, 52, 26, '#ffffff');
  ctx.fillStyle = PALETTE.ivory;
  ctx.font = `bold 17px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MALACHAR — Frost Baron', 72, 42);
  lifeBar(ctx, 72, 58, 150, game.ai.life);
  kindleGem(ctx, 300, 52, game.ai.kindle);
  // Intent: what Malachar will do next, visible before his turn.
  ctx.fillStyle = '#2b3766';
  roundRect(ctx, 380, 32, 420, 40, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = `bold 13px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.fillText(`MALACHAR PLANS: ${game.intent.toUpperCase()}`, 590, 52);
  // Opponent hand: one face-down portrait card per card in his hand,
  // in a row above the lanes, centred on x=1000, clear of the intent
  // bar (ends x=800) and the ROUND readout (right edge).
  {
    const n = game.ai.hand.length;
    const bw = n <= 4 ? 64 : 48;
    const bh = Math.round(bw * 1.25);
    const gap = 10;
    const total = n * bw + (n - 1) * gap;
    const x0 = 1000 - total / 2;
    const y0 = 8 + (80 - bh) / 2;
    for (let i = 0; i < n; i += 1) {
      drawCardBack(ctx, x0 + i * (bw + gap), y0, bw, bh);
    }
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `bold 10px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.fillText("MALACHAR'S HAND", 1000, 98);
  }
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `bold 12px ${FONT_UI}`;
  ctx.textAlign = 'right';
  ctx.fillText(`ROUND ${game.turn}`, 1256, 52);
  ctx.textAlign = 'center';
  // Lanes.
  for (let lane = 0; lane < 3; lane += 1) drawLane(ctx, game, lane);
  // Player hand: fanned, large, clear of every panel and frame edge.
  game.player.hand.forEach((card, i) => {
    const r = handCardRect(i, game.player.hand.length);
    const mid = (game.player.hand.length - 1) / 2;
    const rot = (i - mid) * 0.045;
    ctx.save();
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
    ctx.rotate(rot);
    const playable = card.cost <= game.player.kindle;
    drawCard(ctx, card, -r.w / 2, -r.h / 2, r.w, r.h, { selected: game.selected === i, dim: !playable });
    ctx.restore();
  });
  // Bottom bar: Aria, Kindle, Surge gauge, End Turn, log.
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(0, 656, FIELD.width, 64);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.beginPath(); ctx.moveTo(0, 656); ctx.lineTo(FIELD.width, 656); ctx.stroke();
  ctx.fillStyle = ELEMENTS.ember.color;
  ctx.beginPath(); ctx.arc(40, 688, 22, 0, Math.PI * 2); ctx.fill();
  drawArt(ctx, 'flame', 40, 688, 26, '#ffffff');
  ctx.fillStyle = PALETTE.ivory;
  ctx.font = `bold 17px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('ARIA — Ember Warden', 72, 678);
  lifeBar(ctx, 72, 694, 150, game.player.life);
  kindleGem(ctx, 300, 688, game.player.kindle);
  // Surge gauge.
  ctx.fillStyle = PALETTE.ivory;
  ctx.font = `bold 12px ${FONT_UI}`;
  ctx.fillText('SURGE', 360, 678);
  ctx.fillStyle = '#0d1122';
  roundRect(ctx, 360, 688, 130, 14, 7);
  ctx.fill();
  ctx.fillStyle = PALETTE.surge;
  const surgeW = (130 * game.player.surge) / SURGE_MAX;
  if (surgeW > 2) { roundRect(ctx, 360, 688, surgeW, 14, 7); ctx.fill(); }
  ctx.fillStyle = game.player.surge >= SURGE_MAX ? PALETTE.goldBright : PALETTE.muted;
  ctx.font = `bold 12px ${FONT_UI}`;
  ctx.textAlign = 'left';
  ctx.fillText(game.player.surge >= SURGE_MAX ? 'READY (S)' : `${game.player.surge}/${SURGE_MAX}`, 498, 695);
  // Log line, one line only, kept clear of the Surge readout on its left
  // and the End Turn button on its right.
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT_UI}`;
  ctx.textAlign = 'center';
  const last = game.log[game.log.length - 1] || '';
  ctx.fillText(last.slice(0, 44), 790, 688);
  // End Turn button.
  ctx.fillStyle = PALETTE.gold;
  roundRect(ctx, 1080, 666, 168, 44, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `bold 18px ${FONT_UI}`;
  ctx.fillText('END TURN  (E)', 1164, 688);
  // Floating damage text, play only, pinned to the lane where the hit
  // landed; the engine clears fx on game over, so no "-3 DMG" ever
  // freezes onto a win/loss panel.
  ctx.font = `bold 20px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  game.fx.forEach((fx) => {
    ctx.fillStyle = fx.side === 'player' ? '#ff8a7a' : '#ffd166';
    ctx.fillText(fx.text, fx.x ?? 640, fx.y ?? 96);
  });
  ctx.textBaseline = 'alphabetic';
  // Hover tooltip: the full rules text, above the hand.
  if (game.hover >= 0 && game.player.hand[game.hover]) {
    const card = game.player.hand[game.hover];
    const r = handCardRect(game.hover, game.player.hand.length);
    ctx.fillStyle = 'rgba(16,21,42,0.97)';
    roundRect(ctx, r.x - 10, r.y - 64, HAND_CARD.w + 20, 56, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.stroke();
    ctx.fillStyle = PALETTE.ivory;
    ctx.font = `bold 13px ${FONT_UI}`;
    ctx.fillText(card.name, r.x + HAND_CARD.w / 2, r.y - 44);
    ctx.font = `12px ${FONT_UI}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(card.text, r.x + HAND_CARD.w / 2, r.y - 24);
  }
  ctx.textBaseline = 'alphabetic';
}

export function drawOver(ctx, game) {
  drawTable(ctx, game);
  ctx.fillStyle = 'rgba(10,14,30,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const won = game.winner === 'player';
  if (won) {
    // Victory celebration: static ember confetti around the modal, placed
    // by a seeded shuffle of the duel seed so the frame is deterministic.
    // Static on purpose — a frozen mid-animation burst would read as a
    // glitch, and the shot renderer draws one frame only. Confetti stays
    // in the margins, clear of the modal (340..940 x 150..570).
    const rand = mulberry32((game.seed * 101 + 7) >>> 0);
    const bands = [
      { x0: 16, x1: 1264, y0: 16, y1: 138 },
      { x0: 16, x1: 1264, y0: 582, y1: 704 },
      { x0: 16, x1: 324, y0: 150, y1: 570 },
      { x0: 956, x1: 1264, y0: 150, y1: 570 },
    ];
    for (let i = 0; i < 48; i += 1) {
      const band = bands[i % bands.length];
      const px = band.x0 + rand() * (band.x1 - band.x0);
      const py = band.y0 + rand() * (band.y1 - band.y0);
      const r = 3 + rand() * 4;
      const kind = i % 3;
      if (kind === 0) {
        diamond(ctx, px, py, r, PALETTE.goldBright, null);
      } else if (kind === 1) {
        ctx.fillStyle = '#d9501e';
        ctx.beginPath(); ctx.arc(px, py, r * 0.8, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = PALETTE.ivory;
        ctx.beginPath(); ctx.arc(px, py, r * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.fillStyle = PALETTE.cardWhite;
  roundRect(ctx, 340, 150, 600, 420, 14);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = won ? '#8a6d1d' : '#5a4a6e';
  ctx.font = `bold 56px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', 640, 210);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `20px ${FONT}`;
  // Real final numbers from the duel that was actually played.
  ctx.fillText(
    won ? `Malachar falls. Aria keeps ${game.player.life} life.` : `Aria falls. Malachar keeps ${game.ai.life} life.`,
    640, 258,
  );
  ctx.font = `16px ${FONT_UI}`;
  ctx.fillStyle = '#4a4436';
  const rows = [
    [`Rounds played`, String(game.stats.rounds)],
    [`Cards played`, String(game.stats.cardsPlayed)],
    [`Damage dealt`, String(game.stats.damageDealt)],
    [`Surge used`, game.stats.surgeUsed ? 'Yes' : 'No'],
  ];
  rows.forEach((row, i) => {
    const y = 310 + i * 36;
    ctx.textAlign = 'left';
    ctx.fillText(row[0], 420, y);
    ctx.textAlign = 'right';
    ctx.fillText(row[1], 860, y);
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  roundRect(ctx, 490, 478, 300, 52, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `bold 18px ${FONT_UI}`;
  ctx.fillText('PLAY AGAIN  (R)', 640, 504);
  ctx.textBaseline = 'alphabetic';
}

export function drawGame(ctx, game) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (game.phase === 'title') {
    drawTitle(ctx, game);
    return;
  }
  if (game.phase === 'over') {
    drawOver(ctx, game);
    return;
  }
  drawTable(ctx, game);
  if (game.paused) {
    ctx.fillStyle = 'rgba(10,14,30,0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.ivory;
    ctx.font = `bold 48px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', 640, 340);
    ctx.font = `18px ${FONT_UI}`;
    ctx.fillText('Press P to resume', 640, 390);
    ctx.textBaseline = 'alphabetic';
  }
}
