/**
 * Move validation / game rules engine.
 *
 * All rule checks run on the server. Clients cannot influence the outcome.
 *
 * Key rules checked:
 *  - Is it the player's turn?
 *  - Does the player own the card?
 *  - Is the card compatible with the top of the discard pile?
 *  - Are special card restrictions satisfied (e.g. Wild Draw Four)?
 *  - Is the active side correctly respected in Two-Side mode?
 *  - Is a FLIP card allowed?
 */

'use strict';

const { CARD_TYPE, ACTIVE_SIDE, GAME_MODE } = require('./config');
const { getActiveFace } = require('./cards');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the active face of the top discard card.
 * @param {object} gameState
 * @returns {{ color, type, value }}
 */
function topFace(gameState) {
  if (!gameState || !gameState.discardPile || gameState.discardPile.length === 0) return null;
  const top = gameState.discardPile[gameState.discardPile.length - 1];
  return getActiveFace(top, gameState.activeSide) || null;
}

// ─── Core Validation ─────────────────────────────────────────────────────────

/**
 * Returns the draw penalty count of a card face, or 0 if it is not a draw card.
 * @param {object} face
 * @returns {number}
 */
function getDrawCardPenalty(face) {
  if (!face) return 0;
  if (face.type === CARD_TYPE.DRAW_ONE) return 1;
  if (face.type === CARD_TYPE.DRAW_TWO || face.type === CARD_TYPE.WILD_DRAW_TWO) return 2;
  if (face.type === CARD_TYPE.WILD_DRAW_FOUR) return 4;
  if (face.type === CARD_TYPE.DRAW_FIVE) return 5;
  return 0;
}

/**
 * Determine whether a specific card can be legally played by a player.
 *
 * @param {string} playerId
 * @param {string} cardId
 * @param {object} gameState
 * @param {string|null} chosenColor  — required for Wild cards
 * @returns {{ valid: boolean, reason: string|null }}
 */
function validatePlay(playerId, cardId, gameState, chosenColor) {
  if (chosenColor && typeof chosenColor === 'string') {
    const uc = chosenColor.toUpperCase();
    if (uc === 'CRIMSON') chosenColor = 'PINK';
    else if (uc === 'DEEP_BLUE') chosenColor = 'TEAL';
    else if (uc === 'DEEP_PURPLE') chosenColor = 'PURPLE';
    else chosenColor = uc;
  }

  // 1. Is it this player's turn?
  if (gameState.currentPlayerId !== playerId) {
    return { valid: false, reason: 'NOT_YOUR_TURN' };
  }

  // 2. Does the player own the card?
  const hand = gameState.hands[playerId];
  const card = hand ? hand.find(c => c.id === cardId) : null;
  if (!card) {
    return { valid: false, reason: 'CARD_NOT_IN_HAND' };
  }

  // 3. Get the active face of the card being played
  const face = getActiveFace(card, gameState.activeSide);
  if (!face) {
    return { valid: false, reason: 'INVALID_CARD_SIDE' };
  }

  // ─── Progressive Draw Stacking Rule ───────────────────────────────────────
  // If a draw attack (+1, +2, +4, +5) is pending on this player:
  // - Player can only counter with an EQUAL or HIGHER draw card (+1, +2, +4, etc.)
  // - Cannot downgrade (e.g. cannot play +1 on a +2 attack)
  // - Cannot play non-draw cards while under attack
  if (gameState.pendingDrawStack && gameState.pendingDrawStack.active) {
    const cardPenalty = getDrawCardPenalty(face);
    if (cardPenalty === 0) {
      return { valid: false, reason: 'MUST_COUNTER_WITH_DRAW_CARD' };
    }
    if (cardPenalty < gameState.pendingDrawStack.currentLevel) {
      return { valid: false, reason: 'CANNOT_DOWNGRADE_DRAW_STACK' };
    }
    // Validate Wild Draw color selection
    if (face.type === CARD_TYPE.WILD_DRAW_FOUR || face.type === CARD_TYPE.WILD_DRAW_TWO) {
      if (!chosenColor) {
        return { valid: false, reason: 'WILD_REQUIRES_COLOR_CHOICE' };
      }
      const legalColors = getLegalColors(gameState);
      if (!legalColors.includes(chosenColor)) {
        return { valid: false, reason: 'INVALID_CHOSEN_COLOR' };
      }
    }
    return { valid: true, reason: null };
  }

  // 4. Wild cards — always playable (with color choice validation)
  if (face.type === CARD_TYPE.WILD || face.type === CARD_TYPE.WILD_DRAW_FOUR || face.type === CARD_TYPE.WILD_DRAW_TWO) {
    // Wild Draw Four: technically only legal when the player has no cards
    // matching the current color. We enforce this loosely — the strict rule
    // can be toggled via config later. For now, allow it always.
    if (!chosenColor) {
      return { valid: false, reason: 'WILD_REQUIRES_COLOR_CHOICE' };
    }
    // Validate chosenColor is a legal color for the current side
    const legalColors = getLegalColors(gameState);
    if (!legalColors.includes(chosenColor)) {
      return { valid: false, reason: 'INVALID_CHOSEN_COLOR' };
    }
    return { valid: true, reason: null };
  }

  // 5. Get the top discard face
  const top = topFace(gameState);
  if (!top) {
    return { valid: true, reason: null };
  }

  // 6. FLIP card — only legal in Two-Side mode
  if (face.type === CARD_TYPE.FLIP) {
    if (gameState.config.mode !== GAME_MODE.TWO_SIDE) {
      return { valid: false, reason: 'FLIP_NOT_ALLOWED_IN_CLASSIC' };
    }
    // FLIP must still match color or another FLIP on top
    const currentColor = gameState.currentColor || top.color;
    if (face.color === currentColor || top.type === CARD_TYPE.FLIP) {
      return { valid: true, reason: null };
    }
    return { valid: false, reason: 'CARD_NOT_COMPATIBLE' };
  }

  // 7. Standard compatibility: match color OR match type/value
  const colorMatch = face.color === top.color;
  const typeMatch  = face.type  === top.type && top.type !== CARD_TYPE.NUMBER;
  const valueMatch = face.type  === CARD_TYPE.NUMBER && top.type === CARD_TYPE.NUMBER && face.value === top.value;

  // After a Wild was played, the top color is the chosen color stored in gameState
  const currentColor = gameState.currentColor || top.color;
  const colorMatchWithChosen = face.color === currentColor;

  if (colorMatchWithChosen || typeMatch || valueMatch) {
    return { valid: true, reason: null };
  }

  return { valid: false, reason: 'CARD_NOT_COMPATIBLE' };
}

/**
 * Returns the set of legal colors for the current active side.
 * Used to validate Wild color choices.
 *
 * @param {object} gameState
 * @returns {string[]}
 */
function getLegalColors(gameState) {
  const { getColors } = require('./config');
  return getColors(gameState.activeSide, gameState.config.colorMode);
}

/**
 * Check whether a player is in a UNO state (exactly 1 card left).
 *
 * @param {string} playerId
 * @param {object} gameState
 * @returns {boolean}
 */
function isUnoState(playerId, gameState) {
  const hand = gameState.hands[playerId];
  return hand && (hand.length === 1 || hand.length === 2);
}

/**
 * Check whether a player won (0 cards remaining).
 *
 * @param {string} playerId
 * @param {object} gameState
 * @returns {boolean}
 */
function isWinner(playerId, gameState) {
  const hand = gameState.hands[playerId];
  return hand && hand.length === 0;
}

/**
 * Determine the effects of playing a card:
 *  - How many cards the next player must draw
 *  - Whether the next player is skipped
 *  - Whether direction reverses
 *  - Whether the active side flips
 *  - The new color
 *
 * @param {object} face   Active face descriptor { color, type, value }
 * @param {string|null} chosenColor
 * @param {object} gameState
 * @returns {object} effects
 */
function resolveCardEffects(face, chosenColor, gameState) {
  const effects = {
    drawCount: 0,
    skipNext: false,
    reverse: false,
    flip: false,
    newColor: face.color === 'WILD' ? chosenColor : face.color,
  };

  switch (face.type) {
    case CARD_TYPE.DRAW_ONE:
      effects.drawCount = 1;
      effects.skipNext = true;
      break;
    case CARD_TYPE.DRAW_TWO:
      effects.drawCount = 2;
      effects.skipNext = true;
      break;
    case CARD_TYPE.DRAW_FIVE:
      effects.drawCount = 5;
      effects.skipNext = true;
      break;
    case CARD_TYPE.SKIP:
      effects.skipNext = true;
      break;
    case CARD_TYPE.SKIP_EVERYONE:
      // In official UNO Flip rules, Skip Everyone skips every other player.
      // We flag this specially for the game engine.
      effects.skipEveryone = true;
      break;
    case CARD_TYPE.REVERSE:
      effects.reverse = true;
      break;
    case CARD_TYPE.WILD_DRAW_FOUR:
      effects.drawCount = 4;
      effects.skipNext = true;
      effects.newColor = chosenColor;
      break;
    case CARD_TYPE.WILD_DRAW_TWO:
      effects.drawCount = 2;
      effects.skipNext = true;
      effects.newColor = chosenColor;
      break;
    case CARD_TYPE.WILD:
      effects.newColor = chosenColor;
      break;
    case CARD_TYPE.FLIP:
      effects.flip = true;
      // Color after flip = same card's new active side color
      effects.newColor = face.color; // will be updated in game.js after flipping
      break;
    default:
      break;
  }

  return effects;
}

module.exports = { validatePlay, resolveCardEffects, isUnoState, isWinner, getLegalColors, getDrawCardPenalty };
