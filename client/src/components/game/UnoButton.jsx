/**
 * UNO Button — player manually presses before playing their 2nd-to-last card (2 cards left)
 * or when they have 1 card left.
 * Strictly server-validated. Displays confirmed state once successfully called.
 */

import React from 'react';
import useGameStore from '../../store/gameStore';

export default function UnoButton({ onPress }) {
  const { myHand, gameState, myPlayerId } = useGameStore();

  const isPlaying = gameState?.status === 'PLAYING';
  const cardCount = myHand?.length || 0;
  // Official & House Rule: can call UNO before dropping 2nd card (holding 2 cards) or with 1 card remaining
  const canCallUno = cardCount === 1 || cardCount === 2;
  const alreadyPressed = !!gameState?.players?.find((p) => p.id === myPlayerId)?.unoPressedCorrectly;
  const isEnabled = isPlaying && canCallUno && !alreadyPressed;

  return (
    <button
      className={`uno-btn ${isEnabled ? 'pulse-ready' : ''} ${alreadyPressed ? 'called' : ''}`}
      id="uno-btn"
      onClick={onPress}
      disabled={!isEnabled}
      style={{
        opacity: isEnabled ? 1 : alreadyPressed ? 0.9 : 0.25,
        transform: isEnabled ? 'scale(1.05)' : 'scale(0.95)',
        cursor: isEnabled ? 'pointer' : alreadyPressed ? 'default' : 'not-allowed',
        transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        ...(alreadyPressed
          ? {
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              borderColor: '#6ee7b7',
              color: '#ffffff',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.6)',
            }
          : isEnabled
          ? {
              boxShadow: '0 0 24px rgba(220, 38, 38, 0.85), 0 0 12px rgba(234, 179, 8, 0.8)',
            }
          : {}),
      }}
      title={
        alreadyPressed
          ? 'UNO already declared! You are safe from Caught penalties.'
          : cardCount === 2
          ? 'Press UNO before playing your 2nd card down to 1!'
          : cardCount === 1
          ? 'Press UNO now!'
          : 'Disabled — press when you have 1 or 2 cards left'
      }
    >
      {alreadyPressed ? '✓ UNO!' : 'UNO!'}
    </button>
  );
}
