/**
 * Central game configuration and constants.
 * All game-wide settings live here so they can be changed without
 * touching any game-logic files.
 */

'use strict';

// ─── Game Modes ──────────────────────────────────────────────────────────────

const GAME_MODE = Object.freeze({
  CLASSIC: 'CLASSIC',
  TWO_SIDE: 'TWO_SIDE',
});

const COLOR_MODE = Object.freeze({
  FOUR: 'FOUR',
  FIVE: 'FIVE',
});

const ACTIVE_SIDE = Object.freeze({
  LIGHT: 'LIGHT',
  DARK: 'DARK',
});

// ─── Colors ───────────────────────────────────────────────────────────────────

/** Light side colors (also used as Classic UNO colors) */
const LIGHT_COLORS = Object.freeze({
  RED: 'RED',
  BLUE: 'BLUE',
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  LIGHT_PURPLE: 'LIGHT_PURPLE',   // 5-color only
});

/** Dark side colors (Two-Side mode only) */
const DARK_COLORS = Object.freeze({
  CRIMSON: 'CRIMSON',
  DEEP_BLUE: 'DEEP_BLUE',
  BROWN: 'BROWN',
  ORANGE: 'ORANGE',
  DEEP_PURPLE: 'DEEP_PURPLE',    // 5-color only
});

const COLOR_HEX = Object.freeze({
  // Light / Classic (Rich, tactile gaming card tones)
  RED: '#D92525',
  BLUE: '#1657C7',
  GREEN: '#15803D',
  YELLOW: '#EAB308',
  LIGHT_PURPLE: '#8B5CF6',
  // Dark (Moody, high-contrast dark side tones)
  CRIMSON: '#831843',
  DEEP_BLUE: '#0F3B7A',
  BROWN: '#78350F',
  ORANGE: '#C2410C',
  DEEP_PURPLE: '#581C87',
  // Wild — obsidian onyx card face
  WILD: '#181C26',
});

// ─── Card Types ───────────────────────────────────────────────────────────────

const CARD_TYPE = Object.freeze({
  NUMBER: 'NUMBER',
  SKIP: 'SKIP',
  REVERSE: 'REVERSE',
  DRAW_TWO: 'DRAW_TWO',         // Light side action
  DRAW_FIVE: 'DRAW_FIVE',       // Dark side action (Two-Side only)
  WILD: 'WILD',
  WILD_DRAW_FOUR: 'WILD_DRAW_FOUR',   // Light side wild
  WILD_DRAW_TWO: 'WILD_DRAW_TWO',    // Dark side wild (Two-Side only)
  FLIP: 'FLIP',                 // Two-Side only
  SKIP_EVERYONE: 'SKIP_EVERYONE',    // Dark side only (Two-Side only)
});

// ─── AI Difficulty ───────────────────────────────────────────────────────────

const AI_DIFFICULTY = Object.freeze({
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
});

// ─── Default Game Config ──────────────────────────────────────────────────────

const DEFAULT_CONFIG = Object.freeze({
  mode: GAME_MODE.CLASSIC,
  colorMode: COLOR_MODE.FOUR,
  numberOfPlayers: 4,
  startingHandSize: 7,
  caughtPenalty: 2,             // Standard official UNO penalty is +2 cards
  caughtWindowDuration: 3000,   // milliseconds
  turnTimerEnabled: false,       // NO turn timer per spec
  maxPlayers: 10,
  minPlayers: 2,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the array of colors active for a given side + colorMode.
 * @param {'LIGHT'|'DARK'} side
 * @param {'FOUR'|'FIVE'} colorMode
 * @returns {string[]}
 */
function getColors(side, colorMode) {
  if (side === ACTIVE_SIDE.LIGHT) {
    const base = [LIGHT_COLORS.RED, LIGHT_COLORS.BLUE, LIGHT_COLORS.GREEN, LIGHT_COLORS.YELLOW];
    if (colorMode === COLOR_MODE.FIVE) base.push(LIGHT_COLORS.LIGHT_PURPLE);
    return base;
  }
  if (side === ACTIVE_SIDE.DARK) {
    const base = [DARK_COLORS.CRIMSON, DARK_COLORS.DEEP_BLUE, DARK_COLORS.BROWN, DARK_COLORS.ORANGE];
    if (colorMode === COLOR_MODE.FIVE) base.push(DARK_COLORS.DEEP_PURPLE);
    return base;
  }
  return [];
}

module.exports = {
  GAME_MODE,
  COLOR_MODE,
  ACTIVE_SIDE,
  LIGHT_COLORS,
  DARK_COLORS,
  COLOR_HEX,
  CARD_TYPE,
  AI_DIFFICULTY,
  DEFAULT_CONFIG,
  getColors,
};
