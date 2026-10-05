/**
 * ColorPicker modal — shown when a player plays a Wild card.
 * Luxury card-style color selectors with authentic physical presence.
 */

import React from 'react';
import useGameStore from '../../store/gameStore';
import {
  COLOR_HEX,
  COLOR_LABEL,
  ACTIVE_SIDE,
  LIGHT_COLORS_BY_MODE,
  DARK_COLORS_BY_MODE,
} from '../../utils/constants';
import sound from '../../utils/audio';

export default function ColorPicker({ onSelect, onCancel }) {
  const { gameState } = useGameStore();
  const activeSide = gameState?.activeSide || ACTIVE_SIDE.LIGHT;
  const colorMode = gameState?.config?.colorMode || 'FOUR';

  const colors =
    activeSide === ACTIVE_SIDE.DARK
      ? DARK_COLORS_BY_MODE[colorMode]
      : LIGHT_COLORS_BY_MODE[colorMode];

  function handlePick(color) {
    sound.buttonClick();
    onSelect(color);
  }

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 120 }}>
      <div
        className="modal-box anim-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 520,
          background: 'linear-gradient(145deg, #151c2e 0%, #0c121e 100%)',
          border: '1px solid rgba(229, 185, 76, 0.45)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85), 0 0 30px rgba(229,185,76,0.2)',
          padding: '28px 24px',
          borderRadius: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: 6 }}>🎨</div>
        <h2
          className="font-display"
          style={{
            fontSize: '1.6rem',
            marginBottom: 6,
            background: 'var(--gold-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Choose Active Color
        </h2>
        <p style={{ marginBottom: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {activeSide === ACTIVE_SIDE.DARK
            ? 'Select a Dark Side color for the next player to follow'
            : 'Select the color for the table to follow'}
        </p>

        {/* Big tactile color cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${colors.length <= 4 ? 4 : 5}, 1fr)`,
            gap: 12,
            marginBottom: 24,
          }}
        >
          {colors.map((color) => {
            const hex = COLOR_HEX[color] || '#333';
            const label = COLOR_LABEL[color] || color;

            return (
              <button
                key={color}
                className="color-card-pick"
                onClick={() => handlePick(color)}
                style={{
                  background: `linear-gradient(145deg, ${hex} 0%, ${darken(hex, 0.3)} 100%)`,
                  border: '3px solid #ffffff',
                  boxShadow: `0 8px 24px ${hex}88, 0 2px 6px rgba(0,0,0,0.6)`,
                  borderRadius: 16,
                  height: 112,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 8,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {/* Gloss reflection */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Tilted white oval */}
                <div
                  style={{
                    width: 44,
                    height: 32,
                    background: '#ffffff',
                    borderRadius: '50%',
                    transform: 'rotate(-25deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  }}
                >
                  <span
                    style={{
                      transform: 'rotate(25deg)',
                      fontSize: '1rem',
                      fontWeight: 900,
                      color: hex,
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    ★
                  </span>
                </div>

                {/* Color Label */}
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    fontFamily: "'Outfit', sans-serif",
                    lineHeight: 1.1,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          className="btn btn-ghost"
          style={{ width: '100%', padding: '10px 0', borderRadius: 12, fontSize: '0.9rem' }}
          onClick={() => {
            sound.buttonClick();
            onCancel();
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function darken(hex, amount) {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(amount * 255));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(amount * 255));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(amount * 255));
  return `rgb(${r},${g},${b})`;
}
