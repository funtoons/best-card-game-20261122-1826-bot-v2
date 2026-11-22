// The deck: 24 original cards, six per element. Every card carries its own
// art key, so no two cards share a picture the way v1's Frost Wolf and Frost
// Sprite did. Rules text is kept to twelve words or fewer; the full text
// lives in the hover tooltip, never squeezed onto the card face.
export const ELEMENTS = {
  ember: { name: 'Ember', color: '#d9501e', light: '#fbe3d3', glyph: 'flame' },
  frost: { name: 'Frost', color: '#2f7fc4', light: '#dbeefb', glyph: 'snow' },
  thorn: { name: 'Thorn', color: '#3d8a4f', light: '#ddf0df', glyph: 'leaf' },
  storm: { name: 'Storm', color: '#7a4fc4', light: '#e8defa', glyph: 'bolt' },
};

export const CARDS = [
  { id: 'ember-imp', name: 'Ember Imp', element: 'ember', kind: 'creature', cost: 1, atk: 2, hp: 1, art: 'imp', text: 'Quick spark. Hits first in its lane.' },
  { id: 'ember-fox', name: 'Ember Fox', element: 'ember', kind: 'creature', cost: 2, atk: 3, hp: 2, art: 'fox', text: 'Darts past Ward. Ignores Ward.' },
  { id: 'ember-bolt', name: 'Ember Bolt', element: 'ember', kind: 'spell', cost: 2, atk: 0, hp: 0, art: 'bolt', text: 'Deal 3 damage to any creature.' },
  { id: 'ember-drake', name: 'Ember Drake', element: 'ember', kind: 'creature', cost: 3, atk: 4, hp: 4, art: 'drake', text: 'Winged hunter. +1 ATK when played.' },
  { id: 'ember-dragon', name: 'Ember Dragon', element: 'ember', kind: 'creature', cost: 4, atk: 6, hp: 5, art: 'dragon', text: 'The court’s fire. Burns the lane.' },
  { id: 'ember-warden', name: 'Ember Warden', element: 'ember', kind: 'creature', cost: 3, atk: 3, hp: 5, art: 'warden', ward: true, text: 'Ward: foes must strike it first.' },
  { id: 'frost-sprite', name: 'Frost Sprite', element: 'frost', kind: 'creature', cost: 1, atk: 1, hp: 2, art: 'sprite', text: 'Cold light. Draws a card on play.' },
  { id: 'frost-wolf', name: 'Frost Wolf', element: 'frost', kind: 'creature', cost: 2, atk: 2, hp: 3, art: 'wolf', text: 'Pack hunter. +1 HP beside Frost.' },
  { id: 'frost-mend', name: 'Frost Mend', element: 'frost', kind: 'spell', cost: 2, atk: 0, hp: 0, art: 'mend', text: 'Restore 5 life to your warden.' },
  { id: 'frost-bear', name: 'Frost Bear', element: 'frost', kind: 'creature', cost: 3, atk: 4, hp: 3, art: 'bear', text: 'Heavy paws. Hits two lanes at once.' },
  { id: 'frost-lynx', name: 'Frost Lynx', element: 'frost', kind: 'creature', cost: 3, atk: 3, hp: 4, art: 'lynx', text: 'Silent step. Cannot be blocked first.' },
  { id: 'frost-wall', name: 'Frost Wall', element: 'frost', kind: 'creature', cost: 2, atk: 1, hp: 5, art: 'wall', ward: true, text: 'Ward: foes must strike it first.' },
  { id: 'thorn-sprout', name: 'Thorn Sprout', element: 'thorn', kind: 'creature', cost: 1, atk: 1, hp: 2, art: 'sprout', text: 'Small roots. Grows +1 HP each turn.' },
  { id: 'thorn-viper', name: 'Thorn Viper', element: 'thorn', kind: 'creature', cost: 2, atk: 3, hp: 2, art: 'viper', text: 'Venom bite. Wounds linger one turn.' },
  { id: 'thorn-snare', name: 'Thorn Snare', element: 'thorn', kind: 'spell', cost: 2, atk: 0, hp: 0, art: 'snare', text: 'Give a creature Ward this duel.' },
  { id: 'thorn-stag', name: 'Thorn Stag', element: 'thorn', kind: 'creature', cost: 3, atk: 4, hp: 3, art: 'stag', text: 'Antlered guard. Holds the middle lane.' },
  { id: 'thorn-ancient', name: 'Thorn Ancient', element: 'thorn', kind: 'creature', cost: 4, atk: 5, hp: 6, art: 'ancient', text: 'Old roots. Heals you 2 on play.' },
  { id: 'thorn-bramble', name: 'Thorn Bramble', element: 'thorn', kind: 'creature', cost: 2, atk: 2, hp: 4, art: 'bramble', ward: true, text: 'Ward: foes must strike it first.' },
  { id: 'storm-wisp', name: 'Storm Wisp', element: 'storm', kind: 'creature', cost: 1, atk: 2, hp: 1, art: 'wisp', text: 'Crackling spark. +1 Surge on play.' },
  { id: 'storm-hawk', name: 'Storm Hawk', element: 'storm', kind: 'creature', cost: 2, atk: 3, hp: 2, art: 'hawk', text: 'Storm rider. Strikes the tallest foe.' },
  { id: 'storm-call', name: 'Storm Call', element: 'storm', kind: 'spell', cost: 3, atk: 0, hp: 0, art: 'call', text: 'Draw 2 cards. Gain 2 Surge.' },
  { id: 'storm-djinn', name: 'Storm Djinn', element: 'storm', kind: 'creature', cost: 3, atk: 4, hp: 4, art: 'djinn', text: 'Wind made flesh. Moves between lanes.' },
  { id: 'storm-titan', name: 'Storm Titan', element: 'storm', kind: 'creature', cost: 4, atk: 6, hp: 5, art: 'titan', text: 'Thunder walks. Shakes every lane.' },
  { id: 'storm-aegis', name: 'Storm Aegis', element: 'storm', kind: 'creature', cost: 3, atk: 2, hp: 5, art: 'aegis', ward: true, text: 'Ward: foes must strike it first.' },
];

export function cardById(id) {
  return CARDS.find((c) => c.id === id) || null;
}

export function deckIds() {
  return CARDS.map((c) => c.id);
}
