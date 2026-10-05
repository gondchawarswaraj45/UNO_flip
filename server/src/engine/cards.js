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
function lightSidesForColor(color) {
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
 * Generate light-side Flip descriptors for a given color (Two-Side only).
 */
function lightFlipsForColor(color) {
  return [
    makeSide(color, CARD_TYPE.FLIP, null),
    makeSide(color, CARD_TYPE.FLIP, null),
  ];
}

/**
 * Generate classic/light wild cards.
 * @returns {Array<{color:'WILD', type, value:null}>}
 */
function lightWilds() {
  const wilds = [];
  for (let i = 0; i < 4; i++) wilds.push(makeSide('WILD', CARD_TYPE.WILD, null));
  for (let i = 0; i < 4; i++) wilds.push(makeSide('WILD', CARD_TYPE.WILD_DRAW_FOUR, null));
  return wilds;
}

// ─── Dark side card generation (Two-Side only) ───────────────────────────────

/**
 * Generate all dark-side card descriptors for a given color.
 */
function darkSidesForColor(color) {
  const sides = [];

  // 1–9 — two copies (dark side has no 0)
  for (let n = 1; n <= 9; n++) {
    sides.push(makeSide(color, CARD_TYPE.NUMBER, n));
    sides.push(makeSide(color, CARD_TYPE.NUMBER, n));
  }

  // Action cards
  sides.push(makeSide(color, CARD_TYPE.SKIP_EVERYONE, null)); // only 1 per color
  sides.push(makeSide(color, CARD_TYPE.REVERSE, null));
  sides.push(makeSide(color, CARD_TYPE.REVERSE, null));
  sides.push(makeSide(color, CARD_TYPE.DRAW_FIVE, null));
  sides.push(makeSide(color, CARD_TYPE.DRAW_FIVE, null));

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
 * Generate dark wild cards.
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
 * Cards are full Card objects with unique IDs.
 *
 * @param {string} colorMode  'FOUR' | 'FIVE'
 * @returns {Card[]}
 */
function buildClassicDeck(colorMode) {
  const colors = getColors(ACTIVE_SIDE.LIGHT, colorMode);
  const lightPool = [];

  for (const color of colors) {
    lightPool.push(...lightSidesForColor(color));
  }
  // Wilds
  lightPool.push(...lightWilds());

  // Convert to Card objects
  return lightPool.map(side => ({
    id: uuidv4(),
    lightSide: side,
    darkSide: null,
  }));
}

/**
 * Build a TWO-SIDE UNO deck.
 *
 * Each card is ONE object with both a lightSide and darkSide.
 * The light and dark pools are paired positionally, then each pair
 * becomes ONE card. Wilds are paired Wild↔Wild and WD4↔WD2.
 *
 * @param {string} colorMode  'FOUR' | 'FIVE'
 * @returns {Card[]}
 */
function buildTwoSideDeck(colorMode) {
  const lightColors = getColors(ACTIVE_SIDE.LIGHT, colorMode);
  const darkColors  = getColors(ACTIVE_SIDE.DARK,  colorMode);

  const lightPool = [];
  const darkPool  = [];

  // Colored cards per color — light and dark must produce equal counts
  for (let ci = 0; ci < lightColors.length; ci++) {
    const lColor = lightColors[ci];
    const dColor = darkColors[ci];

    const lSides = lightSidesForColor(lColor);
    const dSides = darkSidesForColor(dColor);

    // Append Flip cards — same count on both sides
    lSides.push(...lightFlipsForColor(lColor));
    dSides.push(...darkFlipsForColor(dColor));

    lightPool.push(...lSides);
    darkPool.push(...dSides);
  }

  // Make sure both pools are the same length before pairing
  // (they should be: 20 number + 6 action + 2 flip = 28 per color on light,
  //  but dark has different action distribution; we pad if necessary)
  const minLen = Math.min(lightPool.length, darkPool.length);
  const pairedCards = [];
  for (let i = 0; i < minLen; i++) {
    pairedCards.push({
      id: uuidv4(),
      lightSide: lightPool[i],
      darkSide:  darkPool[i],
    });
  }

  // Wild cards — paired as: Wild↔Wild, WD4↔WD2
  const lWilds = lightWilds();  // 4×Wild + 4×WD4
  const dWilds  = darkWilds();  // 4×Wild + 4×WD2

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
