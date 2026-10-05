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
  // Wild
  WILD: '#181C26',
};

export const COLOR_LABEL = {
  RED: 'Red',
  BLUE: 'Blue',
  GREEN: 'Green',
  YELLOW: 'Yellow',
  LIGHT_PURPLE: 'Light Purple',
  CRIMSON: 'Crimson',
  DEEP_BLUE: 'Deep Blue',
  BROWN: 'Brown',
  ORANGE: 'Orange',
  DEEP_PURPLE: 'Deep Purple',
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
  FLIP: '↕',
  SKIP_EVERYONE: '⊘⊘',
};

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

/** Light colors available per colorMode */
export const LIGHT_COLORS_BY_MODE = {
  FOUR: ['RED', 'BLUE', 'GREEN', 'YELLOW'],
  FIVE: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'LIGHT_PURPLE'],
};

/** Dark colors available per colorMode */
export const DARK_COLORS_BY_MODE = {
  FOUR: ['CRIMSON', 'DEEP_BLUE', 'BROWN', 'ORANGE'],
  FIVE: ['CRIMSON', 'DEEP_BLUE', 'BROWN', 'ORANGE', 'DEEP_PURPLE'],
};
