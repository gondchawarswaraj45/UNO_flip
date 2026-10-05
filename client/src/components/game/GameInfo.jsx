/**
 * GameInfo bar — shows active side, current color, direction, turn count.
 * No strategic hints, no recommendations.
 */

import React from 'react';
import useGameStore from '../../store/gameStore';
import { COLOR_HEX, COLOR_LABEL } from '../../utils/constants';

export default function GameInfo() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const { activeSide, currentColor, direction, turnCount, config } = gameState;
  const isDark      = activeSide === 'DARK';
  const colorHex    = currentColor ? (COLOR_HEX[currentColor] || '#888') : '#888';
  const colorLabel  = currentColor ? (COLOR_LABEL[currentColor] || currentColor) : '—';
  const dirLabel    = direction === 1 ? '↻ Clockwise' : '↺ Counter';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
      justifyContent: 'center',
    }}>
      {/* Active side badge */}
      {config?.mode === 'TWO_SIDE' && (
        <div className={`side-badge ${isDark ? 'dark' : 'light'}`}>
          {isDark ? '🌑 Dark Side' : '☀️ Light Side'}
        </div>
      )}

      {/* Current color */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '5px 12px',
        borderRadius: '99px',
        background: 'var(--bg-glass)',
        border: `1px solid ${colorHex}44`,
      }}>
        <div style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: colorHex,
          boxShadow: `0 0 8px ${colorHex}88`,
          flexShrink: 0,
        }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {colorLabel}
        </span>
      </div>

      {/* Direction */}
      <div style={{
        padding: '5px 12px',
        borderRadius: '99px',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
      }}>
        {dirLabel}
      </div>

      {/* Turn counter */}
      <div style={{
        padding: '5px 12px',
        borderRadius: '99px',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
      }}>
        Turn {turnCount}
      </div>
    </div>
  );
}
