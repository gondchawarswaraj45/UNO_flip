/**
 * CardComponent — Authentic Physical Playing Card Renderer.
 *
 * Implements the authentic card aesthetics matching official reference specifications:
 *  - Light Side: Crisp, solid white outer border, vibrant face colors (Red, Blue, Green, Yellow).
 *  - Dark Side: Sleek obsidian black outer border, high-voltage neon face colors (Pink, Teal, Orange, Purple).
 *  - Centerpiece: Iconic tilted white ellipse (-26deg) with subtle physical depth.
 *  - Numerals: Bold, italic white numerals with heavy black outline and shadow (-webkit-text-stroke + paint-order).
 *  - Underline bars on 6 and 9 for strict disambiguation.
 *  - Action Cards: Custom vector SVG artwork for Skip (⊘), Reverse (curved cycle arrows), Flip (two flipping cards),
 *    Skip Everyone (circular 360° cycle arrow), Draw One (+1), Draw Two (+2), Draw Five (+5), and Wild Draw Color.
 *  - Wild Cards: Iconic 4-quadrant pinwheel oval divided into the 4 active colors.
 *  - Corner Pips: Top-left pip and inverted (180deg) bottom-right pip.
 *  - Card Back: Luxury dual-gradient oval featuring "FLIP" (zero mention of "UNO" anywhere on the card).
 */

import React from 'react';
import { CARD_TYPE, ACTIVE_SIDE } from '../../utils/constants';
import sound from '../../utils/audio';

// Authentic Official Color Palettes (Accurate Hex Values from Real Cards)
const CARD_COLORS = {
  // Light Side
  RED:          '#E51D24',
  BLUE:         '#0063B2',
  GREEN:        '#1E9A34',
  YELLOW:       '#FFC700',
  LIGHT_PURPLE: '#8B5CF6',

  // Dark Side (Official High-Voltage Dark Palette)
  CRIMSON:      '#E11D48',
  PINK:         '#E11D48',
  DEEP_BLUE:    '#00A3C4',
  TEAL:         '#00A3C4',
  BROWN:        '#F97316',
  ORANGE:       '#F97316',
  DEEP_PURPLE:  '#8B24D9',
  PURPLE:       '#8B24D9',

  // Wild Cards Face
  WILD:         '#11141C',
};

// ─── Crisp Vector SVG Action Card Icons ──────────────────────────────────────

function SkipIcon({ size = 32 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} style={{ display: 'block' }}>
      <circle cx="20" cy="20" r="15" fill="#ffffff" stroke="#000000" strokeWidth="4.5" />
      <line x1="9" y1="9" x2="31" y2="31" stroke="#000000" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="9" y1="9" x2="31" y2="31" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ReverseIcon({ size = 34 }) {
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} style={{ display: 'block' }}>
      {/* Top curved arrow sweeping left */}
      <path d="M 33 15 C 27 7, 17 7, 12 13" fill="none" stroke="#000000" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M 33 15 C 27 7, 17 7, 12 13" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <polygon points="6,13 16,8 14,18" fill="#ffffff" stroke="#000000" strokeWidth="1.6" />

      {/* Bottom curved arrow sweeping right */}
      <path d="M 11 29 C 17 37, 27 37, 32 31" fill="none" stroke="#000000" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M 11 29 C 17 37, 27 37, 32 31" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <polygon points="38,31 28,36 30,26" fill="#ffffff" stroke="#000000" strokeWidth="1.6" />
    </svg>
  );
}

function FlipIcon({ size = 34 }) {
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} style={{ display: 'block' }}>
      {/* Left card tilted */}
      <rect x="7" y="10" width="16" height="24" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="2.5" transform="rotate(-15 15 22)" />
      {/* Right card tilted */}
      <rect x="21" y="10" width="16" height="24" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="2.5" transform="rotate(15 29 22)" />
      {/* Flip top curved arrow */}
      <path d="M 12 6 C 18 1.5, 26 1.5, 32 6" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
      <polygon points="35,8 29,3 33,0" fill="#000000" />
      {/* Flip bottom curved arrow */}
      <path d="M 32 38 C 26 42.5, 18 42.5, 12 38" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
      <polygon points="9,36 15,41 11,44" fill="#000000" />
    </svg>
  );
}

function SkipEveryoneIcon({ size = 34 }) {
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} style={{ display: 'block' }}>
      <circle cx="22" cy="22" r="14" fill="none" stroke="#000000" strokeWidth="6" />
      <circle cx="22" cy="22" r="14" fill="none" stroke="#ffffff" strokeWidth="3.2" />
      <path d="M 22 8 A 14 14 0 1 1 14 34" fill="none" stroke="#000000" strokeWidth="6" strokeLinecap="round" />
      <path d="M 22 8 A 14 14 0 1 1 14 34" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
      <polygon points="26,4 19,9 26,14" fill="#ffffff" stroke="#000000" strokeWidth="1.6" />
    </svg>
  );
}

function WildDrawColorIcon({ size = 32 }) {
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} style={{ display: 'block' }}>
      <rect x="10" y="24" width="24" height="12" rx="2" fill="#ffffff" stroke="#000000" strokeWidth="2.2" />
      <rect x="12" y="17" width="20" height="11" rx="2" fill="#ffffff" stroke="#000000" strokeWidth="2.2" />
      <rect x="14" y="10" width="16" height="10" rx="2" fill="#ffffff" stroke="#000000" strokeWidth="2.2" />
      {/* Upward draw arrows */}
      <path d="M 22 8 L 22 1" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 22 8 L 22 1" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <polygon points="22,0 17,5 27,5" fill="#ffffff" stroke="#000000" strokeWidth="1.2" />
    </svg>
  );
}

function WildPinwheel({ isDark = false, isDiscard = false }) {
  const colors = isDark
    ? ['#E11D48', '#00A3C4', '#F97316', '#8B24D9'] // Pink, Teal, Orange, Purple
    : ['#E51D24', '#0063B2', '#FFC700', '#1E9A34']; // Red, Blue, Yellow, Green

  return (
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
        transform: 'rotate(26deg)',
      }}
    >
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        <path d="M50 50 L50 0 A50 50 0 0 1 100 50 Z" fill={colors[0]} stroke="#000" strokeWidth="1.5" />
        <path d="M50 50 L100 50 A50 50 0 0 1 50 100 Z" fill={colors[1]} stroke="#000" strokeWidth="1.5" />
        <path d="M50 50 L50 100 A50 50 0 0 1 0 50 Z" fill={colors[2]} stroke="#000" strokeWidth="1.5" />
        <path d="M50 50 L0 50 A50 50 0 0 1 50 0 Z" fill={colors[3]} stroke="#000" strokeWidth="1.5" />
        {/* Subtle center divider dot */}
        <circle cx="50" cy="50" r="3.5" fill="#000000" />
      </svg>
    </div>
  );
}

// ─── Main Card Component ──────────────────────────────────────────────────────

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

  // ─── 1. Face-Down Card Back (Draw Pile & Opponent Hands) ────────────────────
  if (faceDown) {
    return (
      <div
        className={`card-base ${sizeClass}`}
        style={{
          background: isDark
            ? 'linear-gradient(145deg, #0b0914 0%, #170f26 100%)'
            : 'linear-gradient(145deg, #10131c 0%, #1b2130 100%)',
          border: isDark ? '3.5px solid #a855f7' : '3.5px solid #ffffff',
          borderRadius: 14,
          boxShadow: isDark
            ? '0 8px 24px rgba(0,0,0,0.85), 0 0 12px rgba(168,85,247,0.3)'
            : '0 8px 24px rgba(0,0,0,0.65)',
          cursor: 'default',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Tilted Oval Center on Card Back with "FLIP" */}
        <div
          style={{
            position: 'absolute',
            width: '84%',
            height: '56%',
            background: isDark
              ? 'linear-gradient(135deg, #6b21a8 0%, #9d174d 100%)'
              : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            borderRadius: '50%',
            transform: 'rotate(-26deg)',
            border: `2px solid ${isDark ? '#e9d5ff' : '#facc15'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
          }}
        >
          <span
            style={{
              transform: 'rotate(26deg)',
              fontFamily: "'Outfit', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '1.25rem',
              color: '#ffffff',
              letterSpacing: '0.04em',
              textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 4px #000',
            }}
          >
            FLIP
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
    face.type === CARD_TYPE.WILD_DRAW_TWO ||
    face.type === CARD_TYPE.WILD_DRAW_COLOR;

  const cardColor = CARD_COLORS[face.color] || (isDark ? '#E11D48' : '#E51D24');
  const isNumber = face.type === CARD_TYPE.NUMBER;

  function handleClick(e) {
    if (onClick) {
      sound.playCard();
      onClick(e);
    }
  }

  // ── Render Centerpiece Content ──
  function renderCenterpiece() {
    if (face.type === CARD_TYPE.WILD) {
      return <WildPinwheel isDark={isDark} isDiscard={isDiscard} />;
    }

    if (face.type === CARD_TYPE.WILD_DRAW_FOUR || face.type === CARD_TYPE.WILD_DRAW_TWO) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WildPinwheel isDark={isDark} isDiscard={isDiscard} />
          <span
            style={{
              position: 'absolute',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: isDiscard ? '2rem' : '1.45rem',
              color: '#ffffff',
              WebkitTextStroke: isDiscard ? '4px #000000' : '3px #000000',
              paintOrder: 'stroke fill',
              filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.8))',
              lineHeight: 1,
            }}
          >
            {face.type === CARD_TYPE.WILD_DRAW_FOUR ? '+4' : '+2'}
          </span>
        </div>
      );
    }

    if (face.type === CARD_TYPE.WILD_DRAW_COLOR) {
      return <WildDrawColorIcon size={isDiscard ? 44 : 32} />;
    }

    if (isNumber) {
      const val = String(face.value);
      const isSixOrNine = val === '6' || val === '9';
      return (
        <div
          style={{
            transform: 'rotate(26deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Outfit', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: isDiscard ? '3.8rem' : '2.85rem',
              color: '#ffffff',
              WebkitTextStroke: isDiscard ? '4.5px #000000' : '3.4px #000000',
              paintOrder: 'stroke fill',
              letterSpacing: '-0.04em',
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
              userSelect: 'none',
              lineHeight: 0.9,
            }}
          >
            {val}
          </span>
          {isSixOrNine && (
            <div
              style={{
                width: isDiscard ? 26 : 18,
                height: isDiscard ? 4 : 3,
                background: '#000000',
                borderRadius: 2,
                marginTop: 2,
              }}
            />
          )}
        </div>
      );
    }

    // Action cards
    if (face.type === CARD_TYPE.DRAW_ONE) {
      return (
        <span
          style={{
            transform: 'rotate(26deg)',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: isDiscard ? '2.8rem' : '2.1rem',
            color: '#ffffff',
            WebkitTextStroke: isDiscard ? '4px #000000' : '3px #000000',
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))',
            lineHeight: 1,
          }}
        >
          +1
        </span>
      );
    }

    if (face.type === CARD_TYPE.DRAW_TWO) {
      return (
        <span
          style={{
            transform: 'rotate(26deg)',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: isDiscard ? '2.8rem' : '2.1rem',
            color: '#ffffff',
            WebkitTextStroke: isDiscard ? '4px #000000' : '3px #000000',
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))',
            lineHeight: 1,
          }}
        >
          +2
        </span>
      );
    }

    if (face.type === CARD_TYPE.DRAW_FIVE) {
      return (
        <span
          style={{
            transform: 'rotate(26deg)',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: isDiscard ? '2.8rem' : '2.1rem',
            color: '#ffffff',
            WebkitTextStroke: isDiscard ? '4px #000000' : '3px #000000',
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))',
            lineHeight: 1,
          }}
        >
          +5
        </span>
      );
    }

    if (face.type === CARD_TYPE.SKIP) {
      return <SkipIcon size={isDiscard ? 44 : 32} />;
    }

    if (face.type === CARD_TYPE.REVERSE) {
      return <ReverseIcon size={isDiscard ? 46 : 34} />;
    }

    if (face.type === CARD_TYPE.FLIP) {
      return <FlipIcon size={isDiscard ? 46 : 34} />;
    }

    if (face.type === CARD_TYPE.SKIP_EVERYONE) {
      return <SkipEveryoneIcon size={isDiscard ? 46 : 34} />;
    }

    return null;
  }

  // ── Render Corner Pip Symbol ──
  function renderCornerPip() {
    if (isNumber) {
      return String(face.value);
    }
    if (face.type === CARD_TYPE.DRAW_ONE) return '+1';
    if (face.type === CARD_TYPE.DRAW_TWO) return '+2';
    if (face.type === CARD_TYPE.DRAW_FIVE) return '+5';
    if (face.type === CARD_TYPE.WILD_DRAW_FOUR) return '+4';
    if (face.type === CARD_TYPE.WILD_DRAW_TWO) return '+2';
    if (face.type === CARD_TYPE.WILD_DRAW_COLOR) return '⤉';
    if (face.type === CARD_TYPE.WILD) return '★';
    if (face.type === CARD_TYPE.SKIP) return '⊘';
    if (face.type === CARD_TYPE.REVERSE) return '⇄';
    if (face.type === CARD_TYPE.FLIP) return '↕';
    if (face.type === CARD_TYPE.SKIP_EVERYONE) return '↺';
    return '';
  }

  const pipText = renderCornerPip();

  return (
    <div
      className={`card-base ${sizeClass} ${selected ? 'selected' : ''} ${isDiscard ? 'card-lg card-discard-pop' : ''}`}
      style={{
        background: isWild
          ? (isDark ? '#0c0f17' : '#11141c')
          : cardColor,
        // Light Side: Pure white outer border; Dark Side: Black obsidian outer border with subtle edge glow
        border: isDark
          ? `3.5px solid #000000`
          : '3.5px solid #ffffff',
        borderRadius: 14,
        boxShadow: selected
          ? (isDark
              ? `0 0 0 3px #ffffff, 0 0 26px ${cardColor}`
              : `0 0 0 3px #ffffff, 0 16px 36px ${cardColor}aa`)
          : (isDark
              ? `0 8px 24px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 10px ${cardColor}44`
              : `0 8px 22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.4)`),
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={handleClick}
    >
      {/* ── Top Specular Gloss Highlight ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '36%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: '11px 11px 50% 50% / 11px 11px 15% 15%',
          pointerEvents: 'none',
        }}
      />

      {/* ── Centerpiece Tilted Oval (Egg) ── */}
      <div
        style={{
          position: 'absolute',
          width: isDiscard ? '80%' : '76%',
          height: isDiscard ? '58%' : '54%',
          background: '#ffffff',
          borderRadius: '50%',
          transform: 'rotate(-26deg)',
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.32), inset 0 1px 3px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
      >
        {renderCenterpiece()}
      </div>

      {/* ── Top-Left Corner Pip ── */}
      <div
        style={{
          position: 'absolute',
          top: isDiscard ? '5px' : '4px',
          left: isDiscard ? '7px' : '5px',
          fontFamily: "'Outfit', 'Arial Black', sans-serif",
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: isDiscard ? '0.92rem' : '0.74rem',
          color: '#ffffff',
          WebkitTextStroke: '1.8px #000000',
          paintOrder: 'stroke fill',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {pipText}
      </div>

      {/* ── Bottom-Right Corner Pip (Inverted 180deg) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: isDiscard ? '5px' : '4px',
          right: isDiscard ? '7px' : '5px',
          fontFamily: "'Outfit', 'Arial Black', sans-serif",
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: isDiscard ? '0.92rem' : '0.74rem',
          color: '#ffffff',
          WebkitTextStroke: '1.8px #000000',
          paintOrder: 'stroke fill',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
          lineHeight: 1,
          transform: 'rotate(180deg)',
          userSelect: 'none',
        }}
      >
        {pipText}
      </div>
    </div>
  );
}
