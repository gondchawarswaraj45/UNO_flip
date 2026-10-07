/**
 * UnoFlipCard — Official Authentic Physical UNO Flip Card Component.
 *
 * Recreates the exact authentic visual design and proportions of Mattel's physical UNO Flip:
 *  - Light Side: Crisp solid white outer border, rich primary color face (Red, Blue, Green, Yellow, Light Purple),
 *    tilted center oval (-26deg) with matching colored numerals (with heavy black outline),
 *    and authentic vector artwork for Draw One (+1), Reverse, Skip, Flip, Wild (full-oval pinwheel), and Wild Draw Two.
 *
 *  - Dark Side: Solid obsidian black outer border, high-voltage neon face (Pink, Teal, Orange, Purple, Brown),
 *    dark neon-bordered center oval (-26deg) with neon numerals, and authentic dark action artwork:
 *    Draw Five (+5), Reverse, Skip Everyone (360° circular barrier), Flip, Wild (neon full-oval pinwheel), and Wild Draw Color.
 *
 *  - Card Back: Official "UNO FLIP!" branded centerpiece featuring the iconic tilted red oval with "UNO"
 *    and the energetic "FLIP!" ribbon banner.
 */

import React from 'react';
import { CARD_TYPE, ACTIVE_SIDE } from '../../utils/constants';
import sound from '../../utils/audio';

// ─── Authentic Color Palettes ─────────────────────────────────────────────────
export const UNO_FLIP_COLORS = {
  // Light Side Colors
  RED:          '#E51D24',
  BLUE:         '#0063B2',
  GREEN:        '#1E9A34',
  YELLOW:       '#FFC700',
  LIGHT_PURPLE: '#8B5CF6',

  // Dark Side Colors (Official High-Voltage Neon)
  PINK:         '#E11D48',
  CRIMSON:      '#E11D48',
  TEAL:         '#00A3C4',
  DEEP_BLUE:    '#00A3C4',
  ORANGE:       '#F97316',
  PURPLE:       '#9333EA',
  DEEP_PURPLE:  '#9333EA',
  BROWN:        '#78350F',

  // Wild Cards Onyx Base
  WILD_LIGHT:   '#11141C',
  WILD_DARK:    '#0A0C14',
};

// ─── Crisp Vector SVG Action Card Icons ──────────────────────────────────────

export function SkipIcon({ size = 32, isDark = false, color = '#FFFFFF' }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} style={{ display: 'block' }}>
      <circle
        cx="20"
        cy="20"
        r="15"
        fill="none"
        stroke="#000000"
        strokeWidth="5"
      />
      <circle
        cx="20"
        cy="20"
        r="15"
        fill="none"
        stroke={color}
        strokeWidth="3.2"
      />
      <line
        x1="9"
        y1="9"
        x2="31"
        y2="31"
        stroke="#000000"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="9"
        x2="31"
        y2="31"
        stroke={color}
        strokeWidth="3.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ReverseIcon({ size = 34, isDark = false, color = '#FFFFFF' }) {
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} style={{ display: 'block' }}>
      {/* Top curved cycle arrow sweeping left */}
      <path d="M 33 15 C 27 7, 17 7, 12 13" fill="none" stroke="#000000" strokeWidth="6" strokeLinecap="round" />
      <path d="M 33 15 C 27 7, 17 7, 12 13" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <polygon points="6,13 17,8 14,19" fill={color} stroke="#000000" strokeWidth="1.8" />

      {/* Bottom curved cycle arrow sweeping right */}
      <path d="M 11 29 C 17 37, 27 37, 32 31" fill="none" stroke="#000000" strokeWidth="6" strokeLinecap="round" />
      <path d="M 11 29 C 17 37, 27 37, 32 31" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <polygon points="38,31 27,36 30,25" fill={color} stroke="#000000" strokeWidth="1.8" />
    </svg>
  );
}

export function FlipIcon({ size = 34, isDark = false }) {
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} style={{ display: 'block' }}>
      {/* Left card tilted */}
      <rect
        x="7"
        y="10"
        width="16"
        height="24"
        rx="3"
        fill={isDark ? '#1C152B' : '#FFFFFF'}
        stroke={isDark ? '#C084FC' : '#000000'}
        strokeWidth="2.5"
        transform="rotate(-15 15 22)"
      />
      {/* Right card tilted */}
      <rect
        x="21"
        y="10"
        width="16"
        height="24"
        rx="3"
        fill={isDark ? '#2E1065' : '#FFFFFF'}
        stroke={isDark ? '#F472B6' : '#000000'}
        strokeWidth="2.5"
        transform="rotate(15 29 22)"
      />
      {/* Flip top curved arrow */}
      <path d="M 12 6 C 18 1.5, 26 1.5, 32 6" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
      <path d="M 12 6 C 18 1.5, 26 1.5, 32 6" fill="none" stroke={isDark ? '#F59E0B' : '#FFFFFF'} strokeWidth="1.6" strokeLinecap="round" />
      <polygon points="35,8 29,3 33,0" fill={isDark ? '#F59E0B' : '#000000'} />

      {/* Flip bottom curved arrow */}
      <path d="M 32 38 C 26 42.5, 18 42.5, 12 38" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
      <path d="M 32 38 C 26 42.5, 18 42.5, 12 38" fill="none" stroke={isDark ? '#F59E0B' : '#FFFFFF'} strokeWidth="1.6" strokeLinecap="round" />
      <polygon points="9,36 15,41 11,44" fill={isDark ? '#F59E0B' : '#000000'} />
    </svg>
  );
}

export function SkipEveryoneIcon({ size = 34 }) {
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} style={{ display: 'block' }}>
      {/* 360-degree arrow loop representing skipping ALL players */}
      <circle cx="22" cy="22" r="14" fill="none" stroke="#000000" strokeWidth="6" />
      <circle cx="22" cy="22" r="14" fill="none" stroke="#F43F5E" strokeWidth="3.4" />
      <path d="M 22 8 A 14 14 0 1 1 14 34" fill="none" stroke="#000000" strokeWidth="6" strokeLinecap="round" />
      <path d="M 22 8 A 14 14 0 1 1 14 34" fill="none" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" />
      <polygon points="26,4 19,9 26,14" fill="#FFFFFF" stroke="#000000" strokeWidth="1.6" />
      {/* Center prohibition slash */}
      <line x1="14" y1="14" x2="30" y2="30" stroke="#000000" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="14" y1="14" x2="30" y2="30" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function WildDrawColorIcon({ size = 32 }) {
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} style={{ display: 'block' }}>
      {/* Triple stacked card deck fanning upwards in Dark Side colors */}
      <rect x="10" y="24" width="24" height="12" rx="2" fill="#E11D48" stroke="#000000" strokeWidth="2.2" />
      <rect x="12" y="17" width="20" height="11" rx="2" fill="#00A3C4" stroke="#000000" strokeWidth="2.2" />
      <rect x="14" y="10" width="16" height="10" rx="2" fill="#F97316" stroke="#000000" strokeWidth="2.2" />
      {/* Upward draw arrows in neon glow */}
      <path d="M 22 8 L 22 1" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
      <path d="M 22 8 L 22 1" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
      <polygon points="22,0 17,5 27,5" fill="#FFFFFF" stroke="#000000" strokeWidth="1.4" />
    </svg>
  );
}

/**
 * Authentic 4-quadrant pinwheel that fills the entire center oval of Wild cards.
 */
export function FullOvalPinwheel({ isDark = false }) {
  const colors = isDark
    ? ['#E11D48', '#00A3C4', '#F97316', '#9333EA'] // Pink, Teal, Orange, Purple
    : ['#E51D24', '#0063B2', '#FFC700', '#1E9A34']; // Red, Blue, Yellow, Green

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    >
      {/* Top right quadrant */}
      <path d="M 50 50 L 50 0 A 50 50 0 0 1 100 50 Z" fill={colors[0]} stroke="#000000" strokeWidth="1.2" />
      {/* Bottom right quadrant */}
      <path d="M 50 50 L 100 50 A 50 50 0 0 1 50 100 Z" fill={colors[1]} stroke="#000000" strokeWidth="1.2" />
      {/* Bottom left quadrant */}
      <path d="M 50 50 L 50 100 A 50 50 0 0 1 0 50 Z" fill={colors[2]} stroke="#000000" strokeWidth="1.2" />
      {/* Top left quadrant */}
      <path d="M 50 50 L 0 50 A 50 50 0 0 1 50 0 Z" fill={colors[3]} stroke="#000000" strokeWidth="1.2" />
      {/* Center divider circle */}
      <circle cx="50" cy="50" r="4.5" fill="#000000" />
    </svg>
  );
}

// ─── Main UnoFlipCard Component ───────────────────────────────────────────────

export default function UnoFlipCard({
  card,
  activeSide = ACTIVE_SIDE.LIGHT,
  selected = false,
  faceDown = false,
  size = 'md',
  isDiscard = false,
  onClick,
  className = '',
  style = {},
}) {
  if (!card && !faceDown) return null;

  const isDark = activeSide === ACTIVE_SIDE.DARK;
  // Authoritative physical card face: exactly card.lightSide on Light, card.darkSide on Dark
  const face = card ? (isDark ? card.darkSide : card.lightSide) : null;

  const sizeMap = { sm: 'card-sm', md: '', lg: 'card-lg' };
  const sizeClass = sizeMap[size] || '';

  // ─── 1. Face-Down Card Back with Authentic "UNO FLIP!" Logo ─────────────────
  if (faceDown) {
    return (
      <div
        className={`card-base ${sizeClass} ${className}`}
        style={{
          background: isDark
            ? 'linear-gradient(145deg, #090B10 0%, #171126 100%)'
            : 'linear-gradient(145deg, #0E131F 0%, #1A2132 100%)',
          // Light side back: solid crisp white border; Dark side back: solid black border with neon purple ambient outline
          border: isDark ? '3.5px solid #000000' : '3.5px solid #FFFFFF',
          borderRadius: 14,
          boxShadow: isDark
            ? '0 8px 24px rgba(0,0,0,0.9), 0 0 12px rgba(147,51,234,0.35)'
            : '0 8px 24px rgba(0,0,0,0.65)',
          cursor: 'default',
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }}
        onClick={onClick}
      >
        {/* Tilted Centerpiece Oval with Official "UNO FLIP!" Branding */}
        <div
          style={{
            position: 'absolute',
            width: '84%',
            height: '58%',
            background: isDark
              ? 'radial-gradient(ellipse at center, #7E22CE 0%, #4C0519 100%)'
              : 'radial-gradient(ellipse at center, #E51D24 0%, #991B1B 100%)',
            borderRadius: '50%',
            transform: 'rotate(-26deg)',
            border: `2.5px solid ${isDark ? '#E9D5FF' : '#FACC15'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.7), inset 0 0 10px rgba(0,0,0,0.5)',
          }}
        >
          {/* Authentic "UNO" Typography */}
          <div
            style={{
              fontFamily: "'Outfit', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '1.25rem',
              color: '#FACC15',
              letterSpacing: '0.02em',
              lineHeight: 0.9,
              WebkitTextStroke: '2.5px #000000',
              paintOrder: 'stroke fill',
              textShadow: '0 2px 6px rgba(0,0,0,0.9)',
              transform: 'scale(1.15, 0.95)',
            }}
          >
            UNO
          </div>

          {/* "FLIP!" Ribbon Banner */}
          <div
            style={{
              marginTop: 2,
              background: isDark ? '#F59E0B' : '#0063B2',
              color: '#FFFFFF',
              fontFamily: "'Outfit', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '0.62rem',
              letterSpacing: '0.12em',
              padding: '1px 8px',
              borderRadius: 4,
              border: '1px solid #FFFFFF',
              boxShadow: '0 2px 6px rgba(0,0,0,0.8)',
              textShadow: '0 1px 2px #000000',
            }}
          >
            FLIP!
          </div>
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

  const cardColor = isWild
    ? (isDark ? UNO_FLIP_COLORS.WILD_DARK : UNO_FLIP_COLORS.WILD_LIGHT)
    : (UNO_FLIP_COLORS[face.color] || (isDark ? '#E11D48' : '#E51D24'));

  const isNumber = face.type === CARD_TYPE.NUMBER;

  function handleClick(e) {
    if (onClick) {
      sound.playCard();
      onClick(e);
    }
  }

  // ─── 2. Centerpiece Render Engine ───────────────────────────────────────────
  function renderCenterpiece() {
    if (face.type === CARD_TYPE.WILD) {
      return <FullOvalPinwheel isDark={isDark} />;
    }

    if (face.type === CARD_TYPE.WILD_DRAW_FOUR || face.type === CARD_TYPE.WILD_DRAW_TWO) {
      const penaltyLabel = face.type === CARD_TYPE.WILD_DRAW_FOUR ? '+4' : '+2';
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FullOvalPinwheel isDark={isDark} />
          <span
            style={{
              position: 'absolute',
              fontFamily: "'Outfit', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: isDiscard ? '2.1rem' : '1.5rem',
              color: '#FFFFFF',
              WebkitTextStroke: isDiscard ? '4px #000000' : '3px #000000',
              paintOrder: 'stroke fill',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))',
              lineHeight: 1,
            }}
          >
            {penaltyLabel}
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
      // On real UNO Flip:
      // Light Side: Large numeral inside the white oval matches the card's color (with black outline)
      // Dark Side: Large numeral inside the dark oval is high-voltage neon (with black outline & neon aura)
      const numeralColor = isDark ? cardColor : cardColor;

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
              color: isDark ? '#FFFFFF' : numeralColor,
              WebkitTextStroke: isDiscard
                ? (isDark ? `4.5px ${cardColor}` : '4.5px #000000')
                : (isDark ? `3.5px ${cardColor}` : '3.5px #000000'),
              paintOrder: 'stroke fill',
              letterSpacing: '-0.04em',
              filter: isDark
                ? `drop-shadow(0 0 10px ${cardColor})`
                : 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
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
                background: isDark ? '#FFFFFF' : '#000000',
                borderRadius: 2,
                marginTop: 2,
              }}
            />
          )}
        </div>
      );
    }

    // Light Actions
    if (face.type === CARD_TYPE.DRAW_ONE) {
      return (
        <span
          style={{
            transform: 'rotate(26deg)',
            fontFamily: "'Outfit', 'Arial Black', sans-serif",
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: isDiscard ? '2.8rem' : '2.1rem',
            color: cardColor,
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
            fontFamily: "'Outfit', 'Arial Black', sans-serif",
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: isDiscard ? '2.8rem' : '2.1rem',
            color: cardColor,
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

    // Dark Actions
    if (face.type === CARD_TYPE.DRAW_FIVE) {
      return (
        <span
          style={{
            transform: 'rotate(26deg)',
            fontFamily: "'Outfit', 'Arial Black', sans-serif",
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: isDiscard ? '2.8rem' : '2.1rem',
            color: '#FFFFFF',
            WebkitTextStroke: isDiscard ? '4.5px #000000' : '3.5px #000000',
            paintOrder: 'stroke fill',
            filter: `drop-shadow(0 0 12px ${cardColor})`,
            lineHeight: 1,
          }}
        >
          +5
        </span>
      );
    }

    if (face.type === CARD_TYPE.SKIP) {
      return <SkipIcon size={isDiscard ? 44 : 32} isDark={isDark} color={isDark ? cardColor : cardColor} />;
    }

    if (face.type === CARD_TYPE.REVERSE) {
      return <ReverseIcon size={isDiscard ? 46 : 34} isDark={isDark} color={isDark ? cardColor : cardColor} />;
    }

    if (face.type === CARD_TYPE.FLIP) {
      return <FlipIcon size={isDiscard ? 46 : 34} isDark={isDark} />;
    }

    if (face.type === CARD_TYPE.SKIP_EVERYONE) {
      return <SkipEveryoneIcon size={isDiscard ? 46 : 34} />;
    }

    return null;
  }

  // ─── 3. Corner Pip Indicators ───────────────────────────────────────────────
  function renderCornerPip() {
    if (isNumber) return String(face.value);
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
      className={`card-base ${sizeClass} ${selected ? 'selected' : ''} ${isDiscard ? 'card-lg card-discard-pop' : ''} ${className}`}
      style={{
        background: cardColor,
        // Light Side: Pure white border; Dark Side: Solid deep black border with neon ambient glow
        border: isDark ? '3.5px solid #000000' : '3.5px solid #FFFFFF',
        borderRadius: 14,
        boxShadow: selected
          ? (isDark
              ? `0 0 0 3px #FFFFFF, 0 0 28px ${cardColor}`
              : `0 0 0 3px #FFFFFF, 0 16px 36px ${cardColor}aa`)
          : (isDark
              ? `0 8px 24px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 12px ${cardColor}66`
              : `0 8px 22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.4)`),
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        ...style,
      }}
      onClick={handleClick}
    >
      {/* ── Top Gloss Specular Highlight ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '36%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: '11px 11px 50% 50% / 11px 11px 15% 15%',
          pointerEvents: 'none',
        }}
      />

      {/* ── Central Tilted Oval (Egg) ── */}
      <div
        style={{
          position: 'absolute',
          width: isDiscard ? '80%' : '76%',
          height: isDiscard ? '58%' : '54%',
          background: isDark
            ? (isWild ? '#0A0C14' : 'radial-gradient(ellipse at center, #1C192E 0%, #0C0A14 100%)')
            : '#FFFFFF',
          borderRadius: '50%',
          transform: 'rotate(-26deg)',
          border: isDark
            ? `1.5px solid ${isWild ? 'rgba(255,255,255,0.2)' : cardColor}`
            : '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDark
            ? `0 4px 14px rgba(0,0,0,0.8), inset 0 0 12px rgba(0,0,0,0.7), 0 0 10px ${cardColor}44`
            : '0 4px 12px rgba(0,0,0,0.32), inset 0 1px 3px rgba(0,0,0,0.12)',
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
          color: '#FFFFFF',
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
          color: '#FFFFFF',
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
