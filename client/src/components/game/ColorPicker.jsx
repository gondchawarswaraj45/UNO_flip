/**
 * ColorPicker modal — shown when a player plays a Wild card.
 * Allows selecting the new active color.
 */

import React from 'react';
import useGameStore from '../../store/gameStore';
import { COLOR_HEX, COLOR_LABEL, ACTIVE_SIDE, LIGHT_COLORS_BY_MODE, DARK_COLORS_BY_MODE } from '../../utils/constants';

export default function ColorPicker({ onSelect, onCancel }) {
  const { gameState } = useGameStore();
  const activeSide  = gameState?.activeSide || ACTIVE_SIDE.LIGHT;
  const colorMode   = gameState?.config?.colorMode || 'FOUR';

  const colors = activeSide === ACTIVE_SIDE.DARK
    ? DARK_COLORS_BY_MODE[colorMode]
    : LIGHT_COLORS_BY_MODE[colorMode];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 className="font-display" style={{ marginBottom: 8, textAlign: 'center' }}>
          Choose a Color
        </h3>
        <p style={{ textAlign: 'center', marginBottom: 24, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {activeSide === ACTIVE_SIDE.DARK ? 'Dark side colors' : 'Select the active color'}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colors.length <= 4 ? 4 : 5}, 1fr)`,
          gap: 14,
          justifyItems: 'center',
        }}>
          {colors.map(color => (
            <button
              key={color}
              className="color-swatch"
              style={{
                background: COLOR_HEX[color],
                boxShadow: `0 4px 20px ${COLOR_HEX[color]}66`,
              }}
              onClick={() => onSelect(color)}
              title={COLOR_LABEL[color]}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {colors.map(color => (
            <span key={color} style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.62rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}>
              {COLOR_LABEL[color]}
            </span>
          ))}
        </div>

        <button className="btn btn-ghost w-full" style={{ marginTop: 20 }} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
