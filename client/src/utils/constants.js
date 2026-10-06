/**
 * Client-side constants — mirrors the server's config values.
 * Kept in sync with server/src/engine/config.js.
 */

export const GAME_MODE = {
  CLASSIC: 'CLASSIC',
  TWO_SIDE: 'TWO_SIDE',
};

export const COLOR_MODE = {
  FOUR: 'FOUR',
  FIVE: 'FIVE',
};

export const ACTIVE_SIDE = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
};

export const CARD_TYPE = {
  NUMBER: 'NUMBER',
  SKIP: 'SKIP',
  REVERSE: 'REVERSE',
  DRAW_ONE: 'DRAW_ONE',
  DRAW_TWO: 'DRAW_TWO',
  DRAW_FIVE: 'DRAW_FIVE',
  WILD: 'WILD',
  WILD_DRAW_FOUR: 'WILD_DRAW_FOUR',
  WILD_DRAW_TWO: 'WILD_DRAW_TWO',
  WILD_DRAW_COLOR: 'WILD_DRAW_COLOR',
  FLIP: 'FLIP',
  SKIP_EVERYONE: 'SKIP_EVERYONE',
};

export const AI_DIFFICULTY = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
};

export const COLOR_HEX = {
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
  // Wild
  WILD: '#181C26',
};

export const COLOR_LABEL = {
  RED: 'Red',
  BLUE: 'Blue',
  GREEN: 'Green',
  YELLOW: 'Yellow',
  LIGHT_PURPLE: 'Light Purple',
  PINK: 'Pink',
  CRIMSON: 'Pink',
  TEAL: 'Teal',
  DEEP_BLUE: 'Teal',
  ORANGE: 'Orange',
  PURPLE: 'Purple',
  DEEP_PURPLE: 'Purple',
  BROWN: 'Brown',
  WILD: 'Wild',
};

export const CARD_SYMBOL = {
  SKIP: '⊘',
  REVERSE: '⇄',
  DRAW_ONE: '+1',
  DRAW_TWO: '+2',
  DRAW_FIVE: '+5',
  WILD: '★',
  WILD_DRAW_FOUR: '+4',
  WILD_DRAW_TWO: '+2',
  WILD_DRAW_COLOR: '🎨+',
  FLIP: '↕',
  SKIP_EVERYONE: '⊘⊘',
};

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

/** Light colors available per colorMode */
export const LIGHT_COLORS_BY_MODE = {
  FOUR: ['RED', 'BLUE', 'GREEN', 'YELLOW'],
  FIVE: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'LIGHT_PURPLE'],
};

/** Dark colors available per colorMode (Official: Pink, Teal, Orange, Purple) */
export const DARK_COLORS_BY_MODE = {
  FOUR: ['PINK', 'TEAL', 'ORANGE', 'PURPLE'],
  FIVE: ['PINK', 'TEAL', 'ORANGE', 'PURPLE', 'BROWN'],
};
