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
        gap: isSmall ? 6 : isMobile ? 8 : 12,
        flexWrap: 'wrap',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      {/* Active Side Badge */}
      {config?.mode === 'TWO_SIDE' && (
        <div
          className={`side-badge ${isDark ? 'dark' : 'light'}`}
          style={{
            padding: isSmall ? '4px 10px' : '5px 14px',
            fontSize: isSmall ? '0.72rem' : '0.78rem',
          }}
        >
          {isDark ? '🌑 Dark Side' : '☀️ Light Side'}
        </div>
      )}

      {/* Direction Pill */}
      <div
        style={{
          padding: isSmall ? '4px 10px' : '5px 12px',
          borderRadius: 99,
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid var(--border-subtle)',
          fontSize: isSmall ? '0.72rem' : '0.78rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{dirLabel}</span>
      </div>

      {/* Turn Counter */}
      <div
        style={{
          padding: isSmall ? '4px 8px' : '5px 12px',
          borderRadius: 99,
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid var(--border-subtle)',
          fontSize: isSmall ? '0.7rem' : '0.76rem',
          color: 'var(--text-muted)',
          fontWeight: 600,
        }}
      >
        Turn {turnCount}
      </div>

      {/* Multithreaded AI Worker Analysis */}
      {currentTurnOdds !== null && (
        <div
          style={{
            padding: isSmall ? '3px 8px' : '4px 12px',
            borderRadius: 99,
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            fontSize: isSmall ? '0.68rem' : '0.75rem',
            fontWeight: 800,
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          title="Live win probability analyzed on a background Web Worker thread without main UI blocking"
        >
          <span>⚡ Odds: {currentTurnOdds}%</span>
          <span
            style={{
              fontSize: '0.58rem',
              background: 'rgba(56, 189, 248, 0.24)',
              padding: '1px 4px',
              borderRadius: 4,
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
