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
  PINK: 'PINK',
  TEAL: 'TEAL',
  ORANGE: 'ORANGE',
  PURPLE: 'PURPLE',
  BROWN: 'BROWN',                 // 5-color mode only
  // Aliases for compatibility
  CRIMSON: 'PINK',
  DEEP_BLUE: 'TEAL',
  DEEP_PURPLE: 'PURPLE',
});

const COLOR_HEX = Object.freeze({
  // Light / Classic (Rich, tactile gaming card tones)
  RED: '#E51D24',
  BLUE: '#0063B2',
  GREEN: '#1E9A34',
  YELLOW: '#FFC700',
  LIGHT_PURPLE: '#8B5CF6',
  // Dark (Official High-Voltage Neon Palette)
  PINK: '#E11D48',
  CRIMSON: '#E11D48',
  TEAL: '#00A3C4',
  DEEP_BLUE: '#00A3C4',
  ORANGE: '#F97316',
  PURPLE: '#9333EA',
  DEEP_PURPLE: '#9333EA',
  BROWN: '#78350F',
  // Wild — obsidian onyx card face
  WILD: '#181C26',
});

// ─── Card Types ───────────────────────────────────────────────────────────────

const CARD_TYPE = Object.freeze({
  NUMBER: 'NUMBER',
  SKIP: 'SKIP',
  REVERSE: 'REVERSE',
  DRAW_ONE: 'DRAW_ONE',         // Light side action in UNO Flip
  DRAW_TWO: 'DRAW_TWO',         // Classic UNO action / Wild Draw Two
  DRAW_FIVE: 'DRAW_FIVE',       // Dark side action (Two-Side only)
  WILD: 'WILD',
  WILD_DRAW_FOUR: 'WILD_DRAW_FOUR',   // Light side wild
  WILD_DRAW_TWO: 'WILD_DRAW_TWO',    // Dark side wild (Two-Side only)
  WILD_DRAW_COLOR: 'WILD_DRAW_COLOR', // Dark side wild (Two-Side only)
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
    const base = [DARK_COLORS.PINK, DARK_COLORS.TEAL, DARK_COLORS.ORANGE, DARK_COLORS.PURPLE];
    if (colorMode === COLOR_MODE.FIVE) base.push(DARK_COLORS.BROWN);
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
