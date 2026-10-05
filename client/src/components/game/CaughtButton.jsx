/**
 * CaughtButton + CaughtWindow indicator.
 *
 * Shows a subtle countdown when the Caught window is active.
 * The button is disabled for the current active player (no self-catching).
 * Does NOT reveal who made a wrong move — just shows the window is open.
 */

import React, { useEffect, useRef, useState } from 'react';
import useGameStore from '../../store/gameStore';

export default function CaughtButton({ onCaught }) {
  const { gameState, myPlayerId, caughtWindowUi } = useGameStore();
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Caught window status badge */}
      {windowActive && !isSelfTarget && (
        <div className="caught-window-badge anim-fade-in">
          <div className="caught-window-dot" />
          CAUGHT AVAILABLE — {secondsLeft}s
        </div>
      )}

      <button
        className={`caught-btn ${windowActive && !isSelfTarget ? 'active' : ''}`}
        onClick={handleCaught}
        disabled={disabled}
        id="caught-btn"
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
