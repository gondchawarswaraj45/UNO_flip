/**
 * Official Real Physical 112-Card UNO Flip Deck Definition.
 *
 * Each card represents a real physical double-sided playing card:
 *  - lightSide: { color, type, value }
 *  - darkSide:  { color, type, value }
 *
 * Light Side: Red, Blue, Green, Yellow (1-9 x 2 each, Draw One x 2 each, Reverse x 2 each, Skip x 2 each, Flip x 2 each, 4 Wild, 4 Wild Draw Two)
 * Dark Side:  Pink, Teal, Orange, Purple (1-9 x 2 each, Draw Five x 2 each, Reverse x 2 each, Skip Everyone x 2 each, Flip x 2 each, 4 Wild, 4 Wild Draw Color)
 *
 * Exactly 112 physical cards.
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const { CARD_TYPE, LIGHT_COLORS, DARK_COLORS } = require('./config');

/**
 * Raw pairings from the physical UNO Flip deck specification.
 * Each entry is [lightSideDef, darkSideDef].
 */
const PHYSICAL_DECK_SPEC = [
  // Wild Draw Two / Number
  [{ color: 'WILD', type: CARD_TYPE.WILD_DRAW_TWO, value: null }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 4 }],
  [{ color: 'WILD', type: CARD_TYPE.WILD_DRAW_TWO, value: null }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 7 }],
  [{ color: 'WILD', type: CARD_TYPE.WILD_DRAW_TWO, value: null }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 2 }],
  [{ color: 'WILD', type: CARD_TYPE.WILD_DRAW_TWO, value: null }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 9 }],

  // Wild / Number & Actions
  [{ color: 'WILD', type: CARD_TYPE.WILD, value: null }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 5 }],
  [{ color: 'WILD', type: CARD_TYPE.WILD, value: null }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.FLIP,   value: null }],
  [{ color: 'WILD', type: CARD_TYPE.WILD, value: null }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 7 }],
  [{ color: 'WILD', type: CARD_TYPE.WILD, value: null }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 3 }],

  // Blue Cards
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 1 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.SKIP_EVERYONE, value: null }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 1 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.SKIP_EVERYONE, value: null }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 2 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 8 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 2 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 6 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 3 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 8 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 3 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 2 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 4 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 1 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 4 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.DRAW_FIVE, value: null }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 5 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.REVERSE, value: null }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 5 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 9 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 6 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.REVERSE, value: null }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 6 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.SKIP_EVERYONE, value: null }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 7 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 3 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 7 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.SKIP_EVERYONE, value: null }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 8 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 4 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 8 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.REVERSE, value: null }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 9 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 5 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.NUMBER, value: 9 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.FLIP, value: null }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.DRAW_ONE, value: null }, { color: DARK_COLORS.PINK, type: CARD_TYPE.NUMBER, value: 6 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.DRAW_ONE, value: null }, { color: DARK_COLORS.TEAL, type: CARD_TYPE.NUMBER, value: 6 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.FLIP, value: null }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 6 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.FLIP, value: null }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 7 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.REVERSE, value: null }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 4 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.REVERSE, value: null }, { color: 'WILD', type: CARD_TYPE.WILD, value: null }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.SKIP, value: null }, { color: DARK_COLORS.PINK, type: CARD_TYPE.NUMBER, value: 9 }],
  [{ color: LIGHT_COLORS.BLUE, type: CARD_TYPE.SKIP, value: null }, { color: DARK_COLORS.TEAL, type: CARD_TYPE.NUMBER, value: 1 }],

  // Green Cards
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 1 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 5 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 1 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.FLIP, value: null }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 2 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.DRAW_FIVE, value: null }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 2 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.SKIP_EVERYONE, value: null }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 3 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.FLIP, value: null }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 3 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 2 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 4 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 8 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 4 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 9 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 5 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 7 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 5 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 4 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 6 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 5 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 6 }, { color: 'WILD', type: CARD_TYPE.WILD_DRAW_COLOR, value: null }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 7 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 6 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 7 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 2 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 8 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.REVERSE, value: null }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 8 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 9 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 9 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.DRAW_FIVE, value: null }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.NUMBER, value: 9 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.REVERSE, value: null }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.DRAW_ONE, value: null }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 6 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.DRAW_ONE, value: null }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 6 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.FLIP, value: null }, { color: DARK_COLORS.TEAL, type: CARD_TYPE.NUMBER, value: 3 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.FLIP, value: null }, { color: 'WILD', type: CARD_TYPE.WILD_DRAW_COLOR, value: null }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.REVERSE, value: null }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 1 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.REVERSE, value: null }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 7 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.SKIP, value: null }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 9 }],
  [{ color: LIGHT_COLORS.GREEN, type: CARD_TYPE.SKIP, value: null }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 4 }],

  // Red Cards
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 1 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 3 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 1 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 2 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 2 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.REVERSE, value: null }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 2 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.DRAW_FIVE, value: null }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 3 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 7 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 3 }, { color: 'WILD', type: CARD_TYPE.WILD_DRAW_COLOR, value: null }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 4 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.FLIP, value: null }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 4 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.DRAW_FIVE, value: null }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 5 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 2 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 5 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 5 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 6 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 9 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 6 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.SKIP_EVERYONE, value: null }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 7 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 1 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 7 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 5 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 8 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.REVERSE, value: null }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 8 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 7 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 9 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 5 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.NUMBER, value: 9 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.REVERSE, value: null }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.DRAW_ONE, value: null }, { color: DARK_COLORS.PINK, type: CARD_TYPE.NUMBER, value: 3 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.DRAW_ONE, value: null }, { color: DARK_COLORS.PINK, type: CARD_TYPE.NUMBER, value: 4 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.FLIP, value: null }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 8 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.FLIP, value: null }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 3 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.REVERSE, value: null }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 3 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.REVERSE, value: null }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 7 }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.SKIP, value: null }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.DRAW_FIVE, value: null }],
  [{ color: LIGHT_COLORS.RED, type: CARD_TYPE.SKIP, value: null }, { color: 'WILD', type: CARD_TYPE.WILD, value: null }],

  // Yellow Cards
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 1 }, { color: DARK_COLORS.PINK, type: CARD_TYPE.SKIP_EVERYONE, value: null }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 1 }, { color: 'WILD', type: CARD_TYPE.WILD, value: null }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 2 }, { color: DARK_COLORS.TEAL, type: CARD_TYPE.NUMBER, value: 1 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 2 }, { color: DARK_COLORS.TEAL, type: CARD_TYPE.NUMBER, value: 8 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 3 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.DRAW_FIVE, value: null }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 3 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 1 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 4 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.DRAW_FIVE, value: null }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 4 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.FLIP, value: null }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 5 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 9 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 5 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 8 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 6 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.SKIP_EVERYONE, value: null }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 6 }, { color: 'WILD', type: CARD_TYPE.WILD_DRAW_COLOR, value: null }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 7 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 2 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 7 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 6 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 8 }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 2 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 8 }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 1 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 9 }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 4 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.NUMBER, value: 9 }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.NUMBER, value: 5 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.DRAW_ONE, value: null }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 1 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.DRAW_ONE, value: null }, { color: DARK_COLORS.PURPLE, type: CARD_TYPE.NUMBER, value: 8 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.FLIP, value: null }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 8 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.FLIP, value: null }, { color: DARK_COLORS.PINK,   type: CARD_TYPE.NUMBER, value: 4 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.REVERSE, value: null }, { color: DARK_COLORS.TEAL, type: CARD_TYPE.FLIP, value: null }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.REVERSE, value: null }, { color: 'WILD', type: CARD_TYPE.WILD, value: null }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.SKIP, value: null }, { color: DARK_COLORS.ORANGE, type: CARD_TYPE.NUMBER, value: 3 }],
  [{ color: LIGHT_COLORS.YELLOW, type: CARD_TYPE.SKIP, value: null }, { color: DARK_COLORS.TEAL,   type: CARD_TYPE.FLIP, value: null }],
];

/**
 * Creates 112 fresh Card objects with identical fixed pairings and new unique UUIDs.
 * @returns {Array<{id: string, lightSide: {color, type, value}, darkSide: {color, type, value}}>}
 */
function createOfficialUnoFlipDeck() {
  return PHYSICAL_DECK_SPEC.map(([light, dark]) => ({
    id: uuidv4(),
    lightSide: { ...light },
    darkSide: { ...dark },
  }));
}

/**
 * Validates that an array of cards adheres to the exact official 112-card UNO Flip specification.
 * Throws an assertion error if any requirement is violated.
 * @param {Array<object>} deck
 * @returns {boolean} true if valid
 */
function validateDeck(deck) {
  if (!Array.isArray(deck)) {
    throw new Error('Deck must be an array');
  }

  // 1. Exactly 112 physical cards
  if (deck.length !== 112) {
    throw new Error(`Deck must have exactly 112 cards, but found ${deck.length}`);
  }

  const lightStats = {
    colors: {},
    types: {},
    numbers: {},
  };
  const darkStats = {
    colors: {},
    types: {},
    numbers: {},
  };

  for (let i = 0; i < deck.length; i++) {
    const card = deck[i];
    if (!card || typeof card !== 'object') {
      throw new Error(`Card at index ${i} is invalid`);
    }
    if (!card.id) {
      throw new Error(`Card at index ${i} has no id`);
    }

    // 2 & 3. Every card has lightSide and darkSide
    const l = card.lightSide;
    const d = card.darkSide;
    if (!l || !d) {
      throw new Error(`Card at index ${i} missing lightSide or darkSide`);
    }

    // Light statistics
    lightStats.colors[l.color] = (lightStats.colors[l.color] || 0) + 1;
    lightStats.types[l.type] = (lightStats.types[l.type] || 0) + 1;
    if (l.type === CARD_TYPE.NUMBER) {
      if (l.value === 0) throw new Error('Light side must NOT contain 0 cards');
      const key = `${l.color}_${l.value}`;
      lightStats.numbers[key] = (lightStats.numbers[key] || 0) + 1;
    }

    // Dark statistics
    darkStats.colors[d.color] = (darkStats.colors[d.color] || 0) + 1;
    darkStats.types[d.type] = (darkStats.types[d.type] || 0) + 1;
    if (d.type === CARD_TYPE.NUMBER) {
      if (d.value === 0) throw new Error('Dark side must NOT contain 0 cards');
      const key = `${d.color}_${d.value}`;
      darkStats.numbers[key] = (darkStats.numbers[key] || 0) + 1;
    }
  }

  // Check Light colors: RED: 26, BLUE: 26, GREEN: 26, YELLOW: 26, WILD: 8
  const expectedLightColors = [LIGHT_COLORS.RED, LIGHT_COLORS.BLUE, LIGHT_COLORS.GREEN, LIGHT_COLORS.YELLOW];
  for (const c of expectedLightColors) {
    if (lightStats.colors[c] !== 26) {
      throw new Error(`Light color ${c} expected 26 cards, got ${lightStats.colors[c]}`);
    }
  }
  if (lightStats.colors.WILD !== 8) {
    throw new Error(`Light WILD expected 8 cards, got ${lightStats.colors.WILD}`);
  }

  // Check Light types
  if (lightStats.types[CARD_TYPE.NUMBER] !== 72) throw new Error(`Light numbers expected 72, got ${lightStats.types[CARD_TYPE.NUMBER]}`);
  if (lightStats.types[CARD_TYPE.DRAW_ONE] !== 8) throw new Error(`Light Draw One expected 8, got ${lightStats.types[CARD_TYPE.DRAW_ONE]}`);
  if (lightStats.types[CARD_TYPE.REVERSE] !== 8) throw new Error(`Light Reverse expected 8, got ${lightStats.types[CARD_TYPE.REVERSE]}`);
  if (lightStats.types[CARD_TYPE.SKIP] !== 8) throw new Error(`Light Skip expected 8, got ${lightStats.types[CARD_TYPE.SKIP]}`);
  if (lightStats.types[CARD_TYPE.FLIP] !== 8) throw new Error(`Light Flip expected 8, got ${lightStats.types[CARD_TYPE.FLIP]}`);
  if (lightStats.types[CARD_TYPE.WILD] !== 4) throw new Error(`Light Wild expected 4, got ${lightStats.types[CARD_TYPE.WILD]}`);
  if (lightStats.types[CARD_TYPE.WILD_DRAW_TWO] !== 4) throw new Error(`Light Wild Draw Two expected 4, got ${lightStats.types[CARD_TYPE.WILD_DRAW_TWO]}`);

  // Check Light numbers 1-9 (2 copies each per color)
  for (const c of expectedLightColors) {
    for (let n = 1; n <= 9; n++) {
      const key = `${c}_${n}`;
      if (lightStats.numbers[key] !== 2) {
        throw new Error(`Light ${key} expected 2 copies, got ${lightStats.numbers[key]}`);
      }
    }
  }

  // Check Dark colors: PINK: 26, TEAL: 26, ORANGE: 26, PURPLE: 26, WILD: 8
  const expectedDarkColors = [DARK_COLORS.PINK, DARK_COLORS.TEAL, DARK_COLORS.ORANGE, DARK_COLORS.PURPLE];
  for (const c of expectedDarkColors) {
    if (darkStats.colors[c] !== 26) {
      throw new Error(`Dark color ${c} expected 26 cards, got ${darkStats.colors[c]}`);
    }
  }
  if (darkStats.colors.WILD !== 8) {
    throw new Error(`Dark WILD expected 8 cards, got ${darkStats.colors.WILD}`);
  }

  // Check Dark types
  if (darkStats.types[CARD_TYPE.NUMBER] !== 72) throw new Error(`Dark numbers expected 72, got ${darkStats.types[CARD_TYPE.NUMBER]}`);
  if (darkStats.types[CARD_TYPE.DRAW_FIVE] !== 8) throw new Error(`Dark Draw Five expected 8, got ${darkStats.types[CARD_TYPE.DRAW_FIVE]}`);
  if (darkStats.types[CARD_TYPE.REVERSE] !== 8) throw new Error(`Dark Reverse expected 8, got ${darkStats.types[CARD_TYPE.REVERSE]}`);
  if (darkStats.types[CARD_TYPE.SKIP_EVERYONE] !== 8) throw new Error(`Dark Skip Everyone expected 8, got ${darkStats.types[CARD_TYPE.SKIP_EVERYONE]}`);
  if (darkStats.types[CARD_TYPE.FLIP] !== 8) throw new Error(`Dark Flip expected 8, got ${darkStats.types[CARD_TYPE.FLIP]}`);
  if (darkStats.types[CARD_TYPE.WILD] !== 4) throw new Error(`Dark Wild expected 4, got ${darkStats.types[CARD_TYPE.WILD]}`);
  if (darkStats.types[CARD_TYPE.WILD_DRAW_COLOR] !== 4) throw new Error(`Dark Wild Draw Color expected 4, got ${darkStats.types[CARD_TYPE.WILD_DRAW_COLOR]}`);

  // Check Dark numbers 1-9 (2 copies each per color)
  for (const c of expectedDarkColors) {
    for (let n = 1; n <= 9; n++) {
      const key = `${c}_${n}`;
      if (darkStats.numbers[key] !== 2) {
        throw new Error(`Dark ${key} expected 2 copies, got ${darkStats.numbers[key]}`);
      }
    }
  }

  return true;
}

module.exports = {
  PHYSICAL_DECK_SPEC,
  createOfficialUnoFlipDeck,
  validateDeck,
};
