/**
 * GameInfo bar — shows active side, direction, turn count, and AI Worker Win Odds.
 * Responsive to dynamic window resizing with memoized render efficiency.
 */

import React, { useState, useEffect, memo } from 'react';
import useGameStore from '../../store/gameStore';
import { COLOR_HEX, COLOR_LABEL } from '../../utils/constants';
import useAiWorker from '../../hooks/useAiWorker';
import useWindowSize from '../../hooks/useWindowSize';

function GameInfo() {
  const { gameState } = useGameStore();
  const { calculateOdds } = useAiWorker();
  const { isSmall, isMobile } = useWindowSize();
  const [currentTurnOdds, setCurrentTurnOdds] = useState(null);

  useEffect(() => {
    if (!gameState || !gameState.players) return;
    const handsMap = {};
    gameState.players.forEach((p) => {
      handsMap[p.id] = p.cardCount || 7;
    });

    let active = true;
    calculateOdds({
      hands: handsMap,
      deckCount: gameState.deckCount || 0,
      activeSide: gameState.activeSide,
    }).then((res) => {
      if (active && res && gameState.currentPlayerId) {
        setCurrentTurnOdds(res[gameState.currentPlayerId] || null);
      }
    });

    return () => {
      active = false;
    };
  }, [gameState?.currentPlayerId, gameState?.discardPile?.length, gameState?.activeSide]);

  if (!gameState) return null;

  const { activeSide, direction, turnCount, config } = gameState;
  const isDark   = activeSide === 'DARK';
  const dirLabel = direction === 1 ? '↻ Clockwise' : '↺ Counter';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isSmall ? 5 : isMobile ? 6 : 8,
        flexWrap: 'nowrap',
        justifyContent: 'center',
        userSelect: 'none',
        background: 'rgba(10, 16, 28, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(8px)',
        padding: isSmall ? '2px 8px' : '3px 12px',
        borderRadius: 99,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
        zIndex: 15,
        maxWidth: '96%',
      }}
    >
      {/* Active Side Badge */}
      {config?.mode === 'TWO_SIDE' && (
        <div
          className={`side-badge ${isDark ? 'dark' : 'light'}`}
          style={{
            padding: isSmall ? '3px 8px' : '4px 10px',
            fontSize: isSmall ? '0.7rem' : '0.75rem',
            whiteSpace: 'nowrap',
          }}
        >
          {isDark ? '🌑 Dark Side' : '☀️ Light Side'}
        </div>
      )}

      {/* Direction Pill */}
      <div
        style={{
          padding: isSmall ? '3px 8px' : '4px 10px',
          borderRadius: 99,
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid var(--border-subtle)',
          fontSize: isSmall ? '0.7rem' : '0.75rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        <span>{dirLabel}</span>
      </div>

      {/* Turn Counter */}
      <div
        style={{
          padding: isSmall ? '3px 6px' : '4px 8px',
          borderRadius: 99,
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid var(--border-subtle)',
          fontSize: isSmall ? '0.68rem' : '0.74rem',
          color: 'var(--text-muted)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        Turn {turnCount}
      </div>

      {/* Multithreaded AI Worker Analysis */}
      {currentTurnOdds !== null && (
        <div
          style={{
            padding: isSmall ? '2px 6px' : '3px 8px',
            borderRadius: 99,
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            fontSize: isSmall ? '0.65rem' : '0.72rem',
            fontWeight: 800,
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
          }}
          title="Live win probability analyzed on a background Web Worker thread without main UI blocking"
        >
          <span>⚡ Odds: {currentTurnOdds}%</span>
          <span
            style={{
              fontSize: '0.55rem',
              background: 'rgba(56, 189, 248, 0.24)',
              padding: '1px 3px',
              borderRadius: 3,
              letterSpacing: '0.04em',
            }}
          >
            AI
          </span>
        </div>
      )}
    </div>
  );
}

export default memo(GameInfo);
