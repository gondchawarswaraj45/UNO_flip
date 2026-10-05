/**
 * CardComponent — Renders an authoritative, physical-feel UNO card.
 *
 * Respects activeSide to display either Light or Dark face.
 * Does NOT highlight "playable" cards or provide strategic hints (strictly player-driven).
 * Includes tactile hover physics and spatial sound feedback.
 */

import React from 'react';
import { CARD_TYPE, COLOR_HEX, ACTIVE_SIDE } from '../../utils/constants';
import sound from '../../utils/audio';

const TYPE_TO_SYMBOL = {
  [CARD_TYPE.SKIP]:          '⊘',
  [CARD_TYPE.REVERSE]:       '⇄',
  [CARD_TYPE.DRAW_TWO]:      '+2',
  [CARD_TYPE.DRAW_FIVE]:     '+5',
  [CARD_TYPE.WILD]:          '★',
  [CARD_TYPE.WILD_DRAW_FOUR]:'W+4',
  [CARD_TYPE.WILD_DRAW_TWO]: 'W+2',
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

  const face = activeSide === ACTIVE_SIDE.DARK ? card.darkSide : card.lightSide;

  const isWild = face && (
    face.color === 'WILD' ||
    face.type === CARD_TYPE.WILD ||
    face.type === CARD_TYPE.WILD_DRAW_FOUR ||
    face.type === CARD_TYPE.WILD_DRAW_TWO
  );

  const bgColor = face ? (COLOR_HEX[face.color] || '#181C26') : '#181C26';
  const isDark  = activeSide === ACTIVE_SIDE.DARK;

  const sizeMap = { sm: 'card-sm', md: '', lg: 'card-lg' };
  const sizeClass = sizeMap[size] || '';

  // Face-down card back (opponents or draw pile)
  if (faceDown) {
    return (
      <div
        className={`card-base ${sizeClass}`}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #181024 0%, #2e124d 100%)'
            : 'linear-gradient(135deg, #0e1726 0%, #1e293b 100%)',
          border: `2px solid ${isDark ? 'rgba(168,85,247,0.35)' : 'rgba(229,185,76,0.35)'}`,
          boxShadow: '0 6px 18px rgba(0,0,0,0.6)',
          cursor: 'default',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: '5px',
          borderRadius: '10px',
          border: `1px solid ${isDark ? 'rgba(168,85,247,0.2)' : 'rgba(229,185,76,0.2)'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}>
          <span style={{
            fontSize: '1.2rem',
            color: isDark ? 'rgba(216,180,254,0.5)' : 'rgba(229,185,76,0.5)',
            userSelect: 'none',
          }}>
            {isDark ? '◈' : '✦'}
          </span>
          <span style={{
            fontSize: '0.55rem',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            letterSpacing: '0.15em',
            color: isDark ? 'rgba(216,180,254,0.4)' : 'rgba(229,185,76,0.4)',
          }}>
            {isDark ? 'DARK' : 'UNO'}
          </span>
        </div>
      </div>
    );
  }

  if (!face) return null;

  const isNumber = face.type === CARD_TYPE.NUMBER;
  const symbol   = isNumber ? String(face.value) : TYPE_TO_SYMBOL[face.type] || '?';
  const textColor = needsDarkText(bgColor) ? '#111827' : '#ffffff';

  function handleClick(e) {
    if (onClick) {
      sound.playCard();
      onClick(e);
    }
  }

  return (
    <div
      className={`card-base ${sizeClass} ${selected ? 'selected' : ''} ${isDiscard ? 'card-lg' : ''}`}
      style={{
        background: isWild
          ? 'linear-gradient(135deg, #141824 0%, #1a2236 50%, #0f1422 100%)'
          : `linear-gradient(160deg, ${bgColor} 0%, ${darken(bgColor, 0.25)} 100%)`,
        border: `2px solid ${isWild ? 'rgba(229,185,76,0.4)' : lighten(bgColor, 0.25)}`,
        boxShadow: selected
          ? `0 0 0 3px #ffffff, 0 12px 32px ${bgColor}99`
          : `0 6px 20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)`,
      }}
      onClick={handleClick}
    >
      {/* Gloss Specular Arc */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '42%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
        borderRadius: '14px 14px 50% 50% / 14px 14px 15% 15%',
        pointerEvents: 'none',
      }} />

      {/* Inner Oval / Pill Badge */}
      <div style={{
        position: 'absolute',
        inset: isDiscard ? '10px 8px' : '7px 5px',
        borderRadius: '50%',
        border: `2px solid ${isWild ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.3)'}`,
        background: isWild
          ? 'radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.4) 100%)'
          : `radial-gradient(ellipse at 40% 35%, ${lighten(bgColor, 0.15)} 0%, ${bgColor} 60%, ${darken(bgColor, 0.3)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.35)',
      }}>
        {/* Wild 4-Quadrant Emblem */}
        {isWild && (
          <svg viewBox="0 0 40 40" style={{ width: '75%', height: '75%', opacity: 0.85 }}>
            <circle cx="20" cy="10" r="8" fill="#D92525" opacity="0.95"/>
            <circle cx="30" cy="28" r="8" fill="#1657C7" opacity="0.95"/>
            <circle cx="10" cy="28" r="8" fill="#15803D" opacity="0.95"/>
            <circle cx="20" cy="18" r="8" fill="#EAB308" opacity="0.95"/>
          </svg>
        )}

        {/* Center Symbol */}
        <span style={{
          fontSize: isDiscard
            ? (isNumber ? '2.5rem' : '1.5rem')
            : (isNumber ? '1.85rem' : '1.1rem'),
          fontWeight: 900,
          color: isWild ? '#ffffff' : textColor,
          fontFamily: "'Outfit', sans-serif",
          letterSpacing: isNumber ? '-0.02em' : '0.02em',
          textShadow: isWild
            ? '0 2px 8px rgba(0,0,0,0.9)'
            : textColor === '#ffffff'
              ? '0 2px 4px rgba(0,0,0,0.4)'
              : '0 1px 2px rgba(255,255,255,0.4)',
          position: 'relative',
          zIndex: 1,
          lineHeight: 1,
          userSelect: 'none',
        }}>
          {symbol}
        </span>
      </div>

      {/* Top-Left Corner Pip */}
      <div style={{
        position: 'absolute',
        top: isDiscard ? '6px' : '4px',
        left: isDiscard ? '8px' : '5px',
        fontSize: isDiscard ? '0.8rem' : '0.62rem',
        fontWeight: 800,
        color: isWild ? '#ffffff' : textColor,
        lineHeight: 1,
        userSelect: 'none',
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        fontFamily: "'Outfit', sans-serif",
      }}>
        {symbol}
      </div>

      {/* Bottom-Right Corner Pip (Inverted) */}
      <div style={{
        position: 'absolute',
        bottom: isDiscard ? '6px' : '4px',
        right: isDiscard ? '8px' : '5px',
        fontSize: isDiscard ? '0.8rem' : '0.62rem',
        fontWeight: 800,
        color: isWild ? '#ffffff' : textColor,
        lineHeight: 1,
        transform: 'rotate(180deg)',
        userSelect: 'none',
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        fontFamily: "'Outfit', sans-serif",
      }}>
        {symbol}
      </div>

      {/* Dark Side Gold/Crimson Pip Indicator */}
      {isDark && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          borderRadius: '0 0 14px 14px',
          background: 'linear-gradient(90deg, #c2410c, #831843)',
        }} />
      )}
    </div>
  );
}

// ─── Color Helpers ──────────────────────────────────────────

function needsDarkText(hex) {
  if (!hex || !hex.startsWith('#')) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62;
}

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
