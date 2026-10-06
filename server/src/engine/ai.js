/**
 * AI Bot logic.
 *
 * Bots run ENTIRELY on the server.
 * No AI decision data is ever sent to clients.
 *
 * Difficulty levels (selected on game setup screen):
 *
 *  EASY   — Plays the first legal card found. Draws randomly. Never presses UNO.
 *  MEDIUM — Prefers action cards, matches colors, presses UNO correctly.
 *  HARD   — Heuristic strategy: saves WD4/WD2 for critical moments, tracks
 *            opponent card counts, uses FLIP strategically, always presses UNO.
 *
 * Bots never exploit hidden information they shouldn't have access to.
 * In particular: bots cannot "see" other players' actual hands.
 * They only use the public game state (card counts, top card, current color).
 */

'use strict';

const { CARD_TYPE, ACTIVE_SIDE, AI_DIFFICULTY } = require('./config');
const { getActiveFace } = require('./cards');
const { validatePlay, getLegalColors } = require('./rules');

// ─── Card Scoring (HARD difficulty) ──────────────────────────────────────────

/**
 * Score a card face for strategic value (HARD bot).
 * Higher score = prefer to play this card later (save it).
 * Lower score = prefer to play now.
 */
function scoreCard(face) {
  switch (face.type) {
    case CARD_TYPE.WILD_DRAW_FOUR:
    case CARD_TYPE.WILD_DRAW_TWO: return 10; // save for critical moments
    case CARD_TYPE.WILD:          return 8;
    case CARD_TYPE.DRAW_FIVE:     return 7;
    case CARD_TYPE.DRAW_TWO:      return 6;
    case CARD_TYPE.DRAW_ONE:      return 5;
    case CARD_TYPE.SKIP_EVERYONE: return 7;
    case CARD_TYPE.SKIP:          return 5;
    case CARD_TYPE.REVERSE:       return 4;
    case CARD_TYPE.FLIP:          return 3;
    case CARD_TYPE.NUMBER:        return face.value === 0 ? 1 : 2;
    default:                       return 0;
  }
}

// ─── Legal Move Finder ────────────────────────────────────────────────────────

/**
 * Find all cards in the bot's hand that can be legally played.
 *
 * @param {string}   botId
 * @param {object}   state
 * @returns {Array<{card, face}>}
 */
function findLegalPlays(botId, state) {
  const hand = state.hands[botId] || [];
  const legal = [];

  for (const card of hand) {
    const face = getActiveFace(card, state.activeSide);
    // Wild cards always need a color choice — pick the bot's most common color
    const chosenColor = face.color === 'WILD'
      ? pickBestColor(botId, state)
      : null;
    const result = validatePlay(botId, card.id, state, chosenColor);
    if (result.valid) {
      legal.push({ card, face, chosenColor });
    }
  }

  return legal;
}

/**
 * Choose the best color for a Wild card based on the bot's hand composition.
 * Picks the color the bot holds the most cards of.
 */
function pickBestColor(botId, state) {
  const hand = state.hands[botId] || [];
  const colors = getLegalColors(state);
  const counts = {};
  for (const c of colors) counts[c] = 0;

  for (const card of hand) {
    const face = getActiveFace(card, state.activeSide);
    if (face.color !== 'WILD' && counts[face.color] !== undefined) {
      counts[face.color]++;
    }
  }

  let best = colors[0];
  let max  = -1;
  for (const c of colors) {
    if (counts[c] > max) { max = counts[c]; best = c; }
  }
  return best;
}

// ─── Difficulty Strategies ────────────────────────────────────────────────────

/** EASY: play first legal card, or draw */
function easyStrategy(botId, state) {
  const legal = findLegalPlays(botId, state);
  if (legal.length === 0) return { action: 'DRAW' };
  const pick = legal[0];
  return { action: 'PLAY', cardId: pick.card.id, chosenColor: pick.chosenColor };
}

/** MEDIUM: prefer action cards; play matching color first */
function mediumStrategy(botId, state) {
  const legal = findLegalPlays(botId, state);
  if (legal.length === 0) return { action: 'DRAW' };

  // Prefer cards matching current color
  const currentColor = state.currentColor;
  const matching = legal.filter(p => p.face.color === currentColor);
  const pool = matching.length > 0 ? matching : legal;

  // Prefer action cards over numbers
  const actionCards = pool.filter(p => p.face.type !== CARD_TYPE.NUMBER);
  const pick = actionCards.length > 0
    ? actionCards[Math.floor(Math.random() * actionCards.length)]
    : pool[Math.floor(Math.random() * pool.length)];

  return { action: 'PLAY', cardId: pick.card.id, chosenColor: pick.chosenColor };
}

/** HARD: heuristic strategy with card saving and threat detection */
function hardStrategy(botId, state) {
  const legal = findLegalPlays(botId, state);
  if (legal.length === 0) return { action: 'DRAW' };

  const hand = state.hands[botId] || [];

  // Detect if any opponent has 1–2 cards (threat)
  const opponentThreat = state.players.some(p =>
    p.id !== botId && (state.hands[p.id] || []).length <= 2
  );

  // Sort by score: low score = play now, high score = save
  const sorted = [...legal].sort((a, b) => scoreCard(a.face) - scoreCard(b.face));

  // If an opponent is threatening, use WD4 or WD2 if available
  if (opponentThreat) {
    const powerful = legal.find(p =>
      p.face.type === CARD_TYPE.WILD_DRAW_FOUR ||
      p.face.type === CARD_TYPE.WILD_DRAW_TWO  ||
      p.face.type === CARD_TYPE.DRAW_FIVE
    );
    if (powerful) {
      return { action: 'PLAY', cardId: powerful.card.id, chosenColor: powerful.chosenColor };
    }
  }

  // Otherwise, play the lowest-score (most expendable) card
  const pick = sorted[0];
  return { action: 'PLAY', cardId: pick.card.id, chosenColor: pick.chosenColor };
}

// ─── Bot Decision Entry Point ─────────────────────────────────────────────────

/**
 * Compute the bot's next action.
 * Returns a decision object — the caller (game socket) executes the action.
 *
 * @param {string}  botId
 * @param {string}  difficulty  'EASY' | 'MEDIUM' | 'HARD'
 * @param {object}  state
 * @returns {{ action: 'PLAY'|'DRAW', cardId?: string, chosenColor?: string }}
 */
function botDecide(botId, difficulty, state) {
  switch (difficulty) {
    case AI_DIFFICULTY.HARD:   return hardStrategy(botId, state);
    case AI_DIFFICULTY.MEDIUM: return mediumStrategy(botId, state);
    case AI_DIFFICULTY.EASY:
    default:                   return easyStrategy(botId, state);
  }
}

/**
 * Determine whether the bot should press UNO.
 * EASY: never presses (always forgettable).
 * MEDIUM/HARD: always presses when in UNO state.
 */
function botShouldPressUno(botId, difficulty, state) {
  if (difficulty === AI_DIFFICULTY.EASY) return false;
  return (state.hands[botId] || []).length === 1;
}

// Realistic human-paced delay to build excitement and let players track every action (ms)
function botThinkDelay(difficulty) {
  switch (difficulty) {
    case AI_DIFFICULTY.HARD:   return 1600 + Math.random() * 700; // 1.6s - 2.3s
    case AI_DIFFICULTY.MEDIUM: return 2000 + Math.random() * 800; // 2.0s - 2.8s
    case AI_DIFFICULTY.EASY:
    default:                   return 1800 + Math.random() * 800; // 1.8s - 2.6s
  }
}

module.exports = { botDecide, botShouldPressUno, botThinkDelay };
