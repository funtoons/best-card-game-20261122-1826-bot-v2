// Every tuning number and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule
// below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

export const LIFE_START = 24;
export const HAND_START = 4;
export const MAX_HAND = 8;
export const MAX_KINDLE = 8;
export const SURGE_MAX = 6;
export const SURGE_DAMAGE = 3;
export const LANES = ['Left Lane', 'Centre Lane', 'Right Lane'];

// The table is deep navy with gold trim, deliberately NOT green: the Thorn
// element is green, and v1's green felt swallowed its cards whole.
export const PALETTE = {
  table: '#1c2547',
  tableEdge: '#141a33',
  lane: '#26315c',
  laneAlt: '#2b3766',
  gold: '#d9a441',
  goldBright: '#f2c94c',
  ivory: '#f7f1de',
  cardWhite: '#fbf7ea',
  ink: '#221d12',
  muted: '#9aa3c2',
  panel: '#10152a',
  panelEdge: '#3a4470',
  life: '#e5534b',
  kindle: '#7ec8e3',
  surge: '#f2c94c',
  white: '#ffffff',
  black: '#111111',
};

// Stats are always white and gold, never element colours: v1 coloured cost
// blue (Frost), HP green (Thorn) and ATK red (Ember), so a Thorn card's HP
// vanished into the felt and a Frost card's cost read as its element.
export const STAT = {
  costFill: '#ffffff',
  costEdge: '#d9a441',
  costInk: '#221d12',
  atkFill: '#d9a441',
  atkInk: '#221d12',
  hpFill: '#ffffff',
  hpEdge: '#8b93a3',
  hpInk: '#221d12',
};

export const FONT = 'Georgia, "Times New Roman", serif';
export const FONT_UI = 'system-ui, -apple-system, "Segoe UI", sans-serif';
