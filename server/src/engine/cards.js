/**
 * Card model and deck generator.
 *
 * CLASSIC mode: cards have only one playable face (lightSide).
 * TWO_SIDE mode: each card object has BOTH a lightSide AND a darkSide.
 *   The two sides are ALWAYS kept together — they are never separated,
 *   never shuffled independently.
 *
 * Card counts follow the standard UNO distribution scaled for the color count:
 *
 *   Light / Classic side per color:
 *     0 × 1
 *     1-9 × 2 each
 *     Skip × 2
 *     Reverse × 2
 *     Draw Two × 2
 *     (Flip × 2 — Two-Side only)
 *   Wild cards (shared / colorless):
 *     Wild × 4
 *     Wild Draw Four × 4
 *
 *   Dark side per color (Two-Side only):
 *     1-9 × 2 each
 *     Skip Everyone × 1
 *     Reverse × 2
 *     Draw Five × 2
 *     (Flip × 2)
 *   Dark Wild:
 *     Wild × 4
 *     Wild Draw Two × 4   (dark equivalent of WD4 on light side)
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const {
  GAME_MODE,
  COLOR_MODE,
  ACTIVE_SIDE,
  LIGHT_COLORS,
  DARK_COLORS,
  CARD_TYPE,
  getColors,
} = require('./config');

// ─── Side builders ────────────────────────────────────────────────────────────

/**
 * Build a single side descriptor.
 * @param {string} color
 * @param {string} type
 * @param {string|number|null} value  Numeric for NUMBER cards; null for actions.
 * @returns {{ color, type, value }}
 */
function makeSide(color, type, value = null) {
  return { color, type, value };
}

// ─── Light / Classic side card generation ─────────────────────────────────────

/**
 * Generate all light-side card descriptors for a given color.
 * Returns an array of { color, type, value } objects (not full Card objects).
 */
/**
 * Generate all light-side card descriptors for a given color in CLASSIC mode.
 * Classic UNO includes 0 and Draw Two.
 */
function lightSidesForClassic(color) {
  const sides = [];

  // 0 — one copy
  sides.push(makeSide(color, CARD_TYPE.NUMBER, 0));

  // 1–9 — two copies each
  for (let n = 1; n <= 9; n++) {
    sides.push(makeSide(color, CARD_TYPE.NUMBER, n));
    sides.push(makeSide(color, CARD_TYPE.NUMBER, n));
  }

  // Action cards — two copies each
  sides.push(makeSide(color, CARD_TYPE.SKIP, null));
  sides.push(makeSide(color, CARD_TYPE.SKIP, null));
  sides.push(makeSide(color, CARD_TYPE.REVERSE, null));
  sides.push(makeSide(color, CARD_TYPE.REVERSE, null));
  sides.push(makeSide(color, CARD_TYPE.DRAW_TWO, null));
  sides.push(makeSide(color, CARD_TYPE.DRAW_TWO, null));

  return sides;
}

/**
 * Generate light-side card descriptors for a given color in TWO-SIDE (UNO FLIP) mode.
 * UNO Flip Light Side has numbers 1-9 (no 0), Draw One (+1), Skip, Reverse.
 * Exactly 24 cards + 2 Flip = 26 cards per color.
 */
function lightSidesForTwoSide(color) {
  const sides = [];

  // 1–9 — two copies each (UNO Flip has NO 0)
  for (let n = 1; n <= 9; n++) {
    sides.push(makeSide(color, CARD_TYPE.NUMBER, n));
    sides.push(makeSide(color, CARD_TYPE.NUMBER, n));
  }

  // Action cards — two copies each
  sides.push(makeSide(color, CARD_TYPE.DRAW_ONE, null));
  sides.push(makeSide(color, CARD_TYPE.DRAW_ONE, null));
  sides.push(makeSide(color, CARD_TYPE.REVERSE, null));
  sides.push(makeSide(color, CARD_TYPE.REVERSE, null));
  sides.push(makeSide(color, CARD_TYPE.SKIP, null));
  sides.push(makeSide(color, CARD_TYPE.SKIP, null));

  return sides;
}

/**
 * Generate light-side Flip descriptors for a given color (Two-Side only).
 */
function lightFlipsForColor(color) {
  return [
    makeSide(color, CARD_TYPE.FLIP, null),
    makeSide(color, CARD_TYPE.FLIP, null),
  ];
}

/**
 * Generate classic wild cards (4 Wild + 4 Wild Draw Four).
 */
function classicWilds() {
  const wilds = [];
  for (let i = 0; i < 4; i++) wilds.push(makeSide('WILD', CARD_TYPE.WILD, null));
  for (let i = 0; i < 4; i++) wilds.push(makeSide('WILD', CARD_TYPE.WILD_DRAW_FOUR, null));
  return wilds;
}

/**
 * Generate light-side wild cards for Two-Side mode (4 Wild + 4 Wild Draw Two).
 */
function lightTwoSideWilds() {
  const wilds = [];
  for (let i = 0; i < 4; i++) wilds.push(makeSide('WILD', CARD_TYPE.WILD, null));
  for (let i = 0; i < 4; i++) wilds.push(makeSide('WILD', CARD_TYPE.WILD_DRAW_TWO, null));
  return wilds;
}

// ─── Dark side card generation (Two-Side only) ───────────────────────────────

/**
 * Generate all dark-side card descriptors for a given color.
 * Numbers 1-9 (2 each), Draw Five (2), Reverse (2), Skip Everyone (2).
 * Exactly 24 cards + 2 Flip = 26 cards per color (perfect match to Light Side!).
 */
function darkSidesForColor(color) {
  const sides = [];

  // 1–9 — two copies (dark side has no 0)
  for (let n = 1; n <= 9; n++) {
    sides.push(makeSide(color, CARD_TYPE.NUMBER, n));
    sides.push(makeSide(color, CARD_TYPE.NUMBER, n));
  }

  // Action cards — two copies each
  sides.push(makeSide(color, CARD_TYPE.DRAW_FIVE, null));
  sides.push(makeSide(color, CARD_TYPE.DRAW_FIVE, null));
  sides.push(makeSide(color, CARD_TYPE.REVERSE, null));
  sides.push(makeSide(color, CARD_TYPE.REVERSE, null));
  sides.push(makeSide(color, CARD_TYPE.SKIP_EVERYONE, null));
  sides.push(makeSide(color, CARD_TYPE.SKIP_EVERYONE, null));

  return sides;
}

/**
 * Generate dark-side Flip descriptors for a given color.
 */
function darkFlipsForColor(color) {
  return [
    makeSide(color, CARD_TYPE.FLIP, null),
    makeSide(color, CARD_TYPE.FLIP, null),
  ];
}

/**
 * Generate dark wild cards (4 Wild + 4 Wild Draw Two).
 */
function darkWilds() {
  const wilds = [];
  for (let i = 0; i < 4; i++) wilds.push(makeSide('WILD', CARD_TYPE.WILD, null));
  for (let i = 0; i < 4; i++) wilds.push(makeSide('WILD', CARD_TYPE.WILD_DRAW_TWO, null));
  return wilds;
}

// ─── Deck Builders ────────────────────────────────────────────────────────────

/**
 * Build a CLASSIC UNO deck.
 *
 * Each card only has a lightSide. The darkSide is null.
 * Total 108 cards (4-color) or 133 cards (5-color).
 *
 * @param {string} colorMode  'FOUR' | 'FIVE'
 * @returns {Card[]}
 */
function buildClassicDeck(colorMode) {
  const colors = getColors(ACTIVE_SIDE.LIGHT, colorMode);
  const lightPool = [];

  for (const color of colors) {
    lightPool.push(...lightSidesForClassic(color));
  }
  // Wilds
  lightPool.push(...classicWilds());

  // Convert to Card objects
  return lightPool.map(side => ({
    id: uuidv4(),
    lightSide: side,
    darkSide: null,
  }));
}

/**
 * Build a TWO-SIDE UNO (UNO FLIP) deck.
 *
 * Total 112 cards (4-color) or 138 cards (5-color).
 * Perfectly paired: each card has both a lightSide and a darkSide.
 *
 * @param {string} colorMode  'FOUR' | 'FIVE'
 * @returns {Card[]}
 */
function buildTwoSideDeck(colorMode) {
  const lightColors = getColors(ACTIVE_SIDE.LIGHT, colorMode);
  const darkColors  = getColors(ACTIVE_SIDE.DARK,  colorMode);

  const lightPool = [];
  const darkPool  = [];

  // Colored cards per color — both produce exactly 26 cards per color!
  for (let ci = 0; ci < lightColors.length; ci++) {
    const lColor = lightColors[ci];
    const dColor = darkColors[ci];

    const lSides = lightSidesForTwoSide(lColor);
    const dSides = darkSidesForColor(dColor);

    // Append Flip cards — exactly 2 per color
    lSides.push(...lightFlipsForColor(lColor));
    dSides.push(...darkFlipsForColor(dColor));

    lightPool.push(...lSides);
    darkPool.push(...dSides);
  }

  // Exactly paired 1-to-1
  const pairedCards = [];
  for (let i = 0; i < lightPool.length; i++) {
    pairedCards.push({
      id: uuidv4(),
      lightSide: lightPool[i],
      darkSide:  darkPool[i],
    });
  }

  // Wild cards — 4 Wild + 4 Wild Draw Two
  const lWilds = lightTwoSideWilds();
  const dWilds = darkWilds();

  for (let i = 0; i < lWilds.length; i++) {
    pairedCards.push({
      id: uuidv4(),
      lightSide: lWilds[i],
      darkSide:  dWilds[i],
    });
  }

  return pairedCards;
}

/**
 * Public entry point.
 * Build a full deck configured by gameMode and colorMode.
 *
 * @param {string} gameMode   'CLASSIC' | 'TWO_SIDE'
 * @param {string} colorMode  'FOUR' | 'FIVE'
 * @returns {Card[]}
 */
function buildDeck(gameMode, colorMode) {
  if (gameMode === GAME_MODE.TWO_SIDE) {
    return buildTwoSideDeck(colorMode);
  }
  return buildClassicDeck(colorMode);
}

/**
 * Get the active face of a card based on the current activeSide.
 * Returns the card's lightSide or darkSide descriptor.
 *
 * @param {Card} card
 * @param {string} activeSide  'LIGHT' | 'DARK'
 * @returns {{ color, type, value }}
 */
function getActiveFace(card, activeSide) {
  return activeSide === ACTIVE_SIDE.DARK ? card.darkSide : card.lightSide;
}

module.exports = { buildDeck, getActiveFace };
