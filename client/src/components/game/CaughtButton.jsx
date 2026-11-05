/**
 * CaughtButton + CaughtWindow indicator.
 *
 * Shows a subtle countdown when the Caught window is active.
 * The button is disabled for the current active player (no self-catching).
 * Does NOT reveal who made a wrong move — just shows the window is open.
 */

import React, { useEffect, useRef, useState } from 'react';
import useGameStore from '../../store/gameStore';
import useWindowSize from '../../hooks/useWindowSize';

export default function CaughtButton({ onCaught }) {
  const { gameState, myPlayerId, caughtWindowUi } = useGameStore();
  const { isSmall, isMobile } = useWindowSize();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  const isMyTurn     = gameState?.currentPlayerId === myPlayerId;
  const windowActive = caughtWindowUi?.active;
  const targetId     = caughtWindowUi?.targetPlayerId;
  const moveId       = caughtWindowUi?.moveId;
  const expiresAt    = gameState?.caughtWindow?.expiresAt;

  // Countdown tick
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (windowActive && expiresAt) {
      const tick = () => {
        const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
        setSecondsLeft(left);
      };
      tick();
      timerRef.current = setInterval(tick, 250);
    } else {
      setSecondsLeft(0);
    }

    return () => clearInterval(timerRef.current);
  }, [windowActive, expiresAt]);

  // The button is disabled if:
  // 1. No active window
  // 2. We are the player being caught (targetId === myPlayerId) — no self-catching
  // 3. Game is not in PLAYING state
  const isSelfTarget = targetId === myPlayerId;
  const disabled     = !windowActive || isSelfTarget || gameState?.status !== 'PLAYING';

  function handleCaught() {
    if (disabled) return;
    onCaught({ targetPlayerId: targetId, moveId });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
      {/* Caught window status badge */}
      {windowActive && !isSelfTarget && (
        <div
          className="caught-window-badge anim-fade-in"
          style={{
            position: 'absolute',
            bottom: '100%',
            marginBottom: 6,
            whiteSpace: 'nowrap',
            fontSize: isSmall ? '0.62rem' : '0.68rem',
            padding: '2px 8px',
          }}
        >
          <div className="caught-window-dot" />
          CAUGHT — {secondsLeft}s
        </div>
      )}

      <button
        className={`caught-btn ${windowActive && !isSelfTarget ? 'active' : ''}`}
        onClick={handleCaught}
        disabled={disabled}
        id="caught-btn"
        style={{
          padding: isSmall ? '7px 11px' : isMobile ? '8px 14px' : '10px 18px',
          fontSize: isSmall ? '0.78rem' : isMobile ? '0.85rem' : '0.95rem',
          flexShrink: 0,
        }}
        title={
          !windowActive
            ? 'No active violation to catch'
            : isSelfTarget
            ? 'You cannot catch yourself'
            : 'Press to report a violation!'
        }
      >
        🚨 CAUGHT
      </button>
    </div>
  );
}
