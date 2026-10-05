/**
 * CardComponent — Authentic, luxury physical UNO card renderer.
 *
 * Implements the iconic UNO design:
 *  - Classic white tilted ellipse (-26deg) centerpiece.
 *  - Bold, thick italic numbers and action symbols inside the ellipse.
 *  - 4-quadrant pinwheel emblem for Wild and Wild Draw 4 cards.
 *  - Dual corner pips (top-left and inverted bottom-right).
 *  - Authentic physical aspect ratio, glossy specular reflection, and tactile hover physics.
 *  - Dark Side: Deep obsidian cards with neon glowing rims and high-contrast accents.
 */

import React from 'react';
import { CARD_TYPE, ACTIVE_SIDE } from '../../utils/constants';
import sound from '../../utils/audio';

// Authentic Official UNO Color Palettes
const UNO_COLORS = {
  // Light Side
  RED:          '#E51D24',
  BLUE:         '#0063B2',
  GREEN:        '#28A745',
  YELLOW:       '#FFC700',
  LIGHT_PURPLE: '#8B5CF6',
  // Dark Side
  CRIMSON:      '#B80058',
  DEEP_BLUE:    '#0B4F6C',
  BROWN:        '#78350F',
  ORANGE:       '#D85A00',
  DEEP_PURPLE:  '#6A0DAD',
  // Wild
  WILD:         '#181C26',
};

const TYPE_TO_SYMBOL = {
  [CARD_TYPE.SKIP]:          '⊘',
  [CARD_TYPE.REVERSE]:       '⇄',
  [CARD_TYPE.DRAW_TWO]:      '+2',
  [CARD_TYPE.DRAW_FIVE]:     '+5',
  [CARD_TYPE.WILD]:          '★',
  [CARD_TYPE.WILD_DRAW_FOUR]:'+4',
  [CARD_TYPE.WILD_DRAW_TWO]: '+2',
  [CARD_TYPE.FLIP]:          '↕',
  [CARD_TYPE.SKIP_EVERYONE]: '⊘⊘',
};

export default function CardComponent({
  card,
  activeSide = ACTIVE_SIDE.LIGHT,
  selected = false,
  faceDown = false,
  size = 'md',
  isDiscard = false,
  onClick,
}) {
  if (!card) return null;

  const isDark = activeSide === ACTIVE_SIDE.DARK;
  const face = isDark ? card.darkSide : card.lightSide;

  const sizeMap = { sm: 'card-sm', md: '', lg: 'card-lg' };
  const sizeClass = sizeMap[size] || '';

  // ─── 1. Face-Down Card Back (Draw Deck & Opponents) ──────────────────────
  if (faceDown) {
    return (
      <div
        className={`card-base ${sizeClass}`}
        style={{
          background: isDark
            ? 'linear-gradient(145deg, #100b1a 0%, #1f1233 100%)'
            : 'linear-gradient(145deg, #11141c 0%, #1c2233 100%)',
          border: `3px solid ${isDark ? '#a855f7' : '#ffffff'}`,
          borderRadius: 14,
          boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
          cursor: 'default',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Classic Tilted Oval on Card Back */}
        <div
          style={{
            position: 'absolute',
            width: '84%',
            height: '56%',
            background: isDark
              ? 'linear-gradient(135deg, #4c1d95 0%, #831843 100%)'
              : 'linear-gradient(135deg, #d92525 0%, #991b1b 100%)',
            borderRadius: '50%',
            transform: 'rotate(-26deg)',
            border: `2px solid ${isDark ? '#e9d5ff' : '#facc15'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <span
            style={{
              transform: 'rotate(26deg)',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '1.25rem',
              color: '#ffffff',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 4px #000',
            }}
          >
            {isDark ? 'FLIP' : 'UNO'}
          </span>
        </div>
      </div>
    );
  }

  if (!face) return null;

  const isWild =
    face.color === 'WILD' ||
    face.type === CARD_TYPE.WILD ||
    face.type === CARD_TYPE.WILD_DRAW_FOUR ||
    face.type === CARD_TYPE.WILD_DRAW_TWO;

  const cardColor = UNO_COLORS[face.color] || (isDark ? '#2e124d' : '#E51D24');
  const isNumber = face.type === CARD_TYPE.NUMBER;
  const symbol = isNumber ? String(face.value) : TYPE_TO_SYMBOL[face.type] || '?';

  function handleClick(e) {
    if (onClick) {
      sound.playCard();
      onClick(e);
    }
  }

  return (
    <div
      className={`card-base ${sizeClass} ${selected ? 'selected' : ''} ${isDiscard ? 'card-lg card-discard-pop' : ''}`}
      style={{
        background: isWild
          ? 'linear-gradient(145deg, #181c26 0%, #0d1017 100%)'
          : `linear-gradient(145deg, ${cardColor} 0%, ${darken(cardColor, 0.22)} 100%)`,
        border: isDark
          ? `3px solid ${isWild ? '#c084fc' : lighten(cardColor, 0.25)}`
          : '3.5px solid #ffffff',
        borderRadius: 14,
        boxShadow: selected
          ? `0 0 0 3px #ffffff, 0 16px 36px ${cardColor}aa`
          : `0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.35)`,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={handleClick}
    >
      {/* ── Top Gloss Highlight ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '38%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: '11px 11px 50% 50% / 11px 11px 15% 15%',
          pointerEvents: 'none',
        }}
      />

      {/* ── Iconic Center White Tilted Ellipse ── */}
      <div
        style={{
          position: 'absolute',
          width: isDiscard ? '76%' : '72%',
          height: isDiscard ? '56%' : '52%',
          background: isDark
            ? isWild
              ? '#141824'
              : 'rgba(15, 20, 32, 0.95)'
            : '#ffffff',
          borderRadius: '50%',
          transform: 'rotate(-26deg)',
          border: isDark ? `2px solid ${isWild ? '#e9d5ff' : cardColor}` : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDark
            ? '0 4px 12px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.1)'
            : '0 4px 12px rgba(0,0,0,0.32), inset 0 1px 3px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* ── If Wild: Iconic 4-Quadrant Color Pinwheel ── */}
        {isWild ? (
          <div
            style={{
              position: 'relative',
              width: '88%',
              height: '88%',
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(26deg)', // Counter-rotate so quadrant is upright
            }}
          >
            {/* 4 Quadrants */}
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <path d="M50 50 L50 0 A50 50 0 0 1 100 50 Z" fill={isDark ? '#B80058' : '#0063B2'} />
              <path d="M50 50 L100 50 A50 50 0 0 1 50 100 Z" fill={isDark ? '#D85A00' : '#FFC700'} />
              <path d="M50 50 L50 100 A50 50 0 0 1 0 50 Z" fill={isDark ? '#0B4F6C' : '#28A745'} />
              <path d="M50 50 L0 50 A50 50 0 0 1 50 0 Z" fill={isDark ? '#6A0DAD' : '#E51D24'} />
            </svg>

            {/* If Draw 4 or Draw 2: Symbol in Center */}
            {(face.type === CARD_TYPE.WILD_DRAW_FOUR || face.type === CARD_TYPE.WILD_DRAW_TWO) && (
              <span
                style={{
                  position: 'absolute',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900,
                  fontStyle: 'italic',
                  fontSize: isDiscard ? '1.8rem' : '1.3rem',
                  color: '#ffffff',
                  textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 4px #000',
                  lineHeight: 1,
                }}
              >
                {face.type === CARD_TYPE.WILD_DRAW_FOUR ? '+4' : '+2'}
              </span>
            )}
          </div>
        ) : (
          /* ── Normal Number or Action Symbol ── */
          <span
            style={{
              transform: 'rotate(26deg)', // Counter-rotate to stay upright
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: isDiscard
                ? isNumber
                  ? '3.4rem'
                  : '2.1rem'
                : isNumber
                  ? '2.5rem'
                  : '1.6rem',
              color: isDark ? '#ffffff' : cardColor,
              letterSpacing: isNumber ? '-0.04em' : '0.02em',
              textShadow: isDark
                ? `0 2px 8px rgba(0,0,0,0.9), 0 0 12px ${cardColor}`
                : `1px 2px 0px rgba(0,0,0,0.18)`,
              userSelect: 'none',
              lineHeight: 1,
            }}
          >
            {symbol}
          </span>
        )}
      </div>

      {/* ── Top-Left Corner Pip ── */}
      <div
        style={{
          position: 'absolute',
          top: isDiscard ? '5px' : '4px',
          left: isDiscard ? '8px' : '6px',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: isDiscard ? '0.85rem' : '0.68rem',
          color: '#ffffff',
          textShadow: '0 1px 3px rgba(0,0,0,0.85), 0 0 2px #000',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {symbol}
      </div>

      {/* ── Bottom-Right Corner Pip (Inverted 180deg) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: isDiscard ? '5px' : '4px',
          right: isDiscard ? '8px' : '6px',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: isDiscard ? '0.85rem' : '0.68rem',
          color: '#ffffff',
          textShadow: '0 1px 3px rgba(0,0,0,0.85), 0 0 2px #000',
          lineHeight: 1,
          transform: 'rotate(180deg)',
          userSelect: 'none',
        }}
      >
        {symbol}
      </div>
    </div>
  );
}

// ─── Color Helpers ──────────────────────────────────────────

function lighten(hex, amount) {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(amount * 255));
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(amount * 255));
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(amount * 255));
  return `rgb(${r},${g},${b})`;
}

function darken(hex, amount) {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(amount * 255));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(amount * 255));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(amount * 255));
  return `rgb(${r},${g},${b})`;
}
