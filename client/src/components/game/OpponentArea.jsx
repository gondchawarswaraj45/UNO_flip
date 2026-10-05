/**
 * OpponentArea — Renders opponent players around the virtual felt table.
 * Strictly presents only public information:
 *  - Player name and avatar
 *  - Face-down card count
 *  - UNO call indicator
 * Never exposes private hand cards.
 */

import React from 'react';
import useGameStore from '../../store/gameStore';

export default function OpponentArea({ player, position }) {
  const { gameState, myPlayerId } = useGameStore();
  if (!player || player.id === myPlayerId) return null;

  const isActive   = gameState?.currentPlayerId === player.id;
  const cardCount  = player.cardCount || 0;
  const hasUno     = player.unoPressedCorrectly;
  const activeSide = gameState?.activeSide || 'LIGHT';
  const isDark     = activeSide === 'DARK';

  const maxVisible = Math.min(cardCount, 7);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      opacity: isActive ? 1 : 0.78,
      transition: 'all 0.25s ease',
    }}>
      {/* Name Badge */}
      <div className={`player-badge ${isActive ? 'active' : ''}`}>
        {isActive && <span style={{ color: 'var(--gold-primary)', fontSize: '0.7rem' }}>▶</span>}
        <span>{player.isBot ? '🤖' : '👤'}</span>
        <span>{player.name}</span>
        {hasUno && (
          <span style={{
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            color: '#fff',
            borderRadius: 99,
            padding: '1px 8px',
            fontSize: '0.62rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            boxShadow: '0 0 8px rgba(220, 38, 38, 0.6)',
          }}>
            UNO
          </span>
        )}
      </div>

      {/* Face-Down Cards Preview */}
      <div style={{
        display: 'flex',
        gap: position === 'top' ? '-10px' : '2px',
        position: 'relative',
        justifyContent: 'center',
      }}>
        {Array.from({ length: maxVisible }).map((_, idx) => (
          <div
            key={idx}
            style={{
              width: 34,
              height: 50,
              borderRadius: 8,
              background: isDark
                ? 'linear-gradient(135deg, #181024 0%, #2e124d 100%)'
                : 'linear-gradient(135deg, #0e1726 0%, #1e293b 100%)',
              border: `1.5px solid ${isDark ? 'rgba(168,85,247,0.3)' : 'rgba(229,185,76,0.3)'}`,
              marginLeft: idx > 0 ? -16 : 0,
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.55rem',
              color: isDark ? 'rgba(216,180,254,0.35)' : 'rgba(229,185,76,0.35)',
              zIndex: idx,
            }}
          >
            {isDark ? '◈' : '✦'}
          </div>
        ))}

        {cardCount > maxVisible && (
          <div style={{
            width: 34,
            height: 50,
            borderRadius: 8,
            background: 'rgba(229, 185, 76, 0.12)',
            border: '1.5px solid rgba(229, 185, 76, 0.35)',
            marginLeft: -16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: 'var(--text-gold)',
            zIndex: maxVisible,
          }}>
            +{cardCount - maxVisible}
          </div>
        )}
      </div>

      {/* Card Count Label */}
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        {cardCount} card{cardCount !== 1 ? 's' : ''}
      </span>

      {/* Active Turn Gold Aura Underline */}
      {isActive && (
        <div style={{
          width: 32,
          height: 3,
          borderRadius: 99,
          background: 'var(--gold-gradient)',
          boxShadow: '0 0 10px rgba(229, 185, 76, 0.8)',
        }} />
      )}
    </div>
  );
}
