/**
 * UNO Button — player manually presses when they have 1 card left.
 * No automatic pressing. No hint displayed ("Press UNO now").
 */

import React from 'react';
import useGameStore from '../../store/gameStore';

export default function UnoButton({ onPress }) {
  const { myHand, gameState, myPlayerId } = useGameStore();

  // The button is interactive when the player has 1 card left.
  // We don't show any recommendation text — just make the button available.
  const hasOneCard = myHand.length === 1;
  const alreadyPressed = gameState?.players?.find(p => p.id === myPlayerId)?.unoPressedCorrectly;
  const isPlaying = gameState?.status === 'PLAYING';

  return (
    <button
      className="uno-btn"
      id="uno-btn"
      onClick={onPress}
      disabled={!isPlaying || !hasOneCard || alreadyPressed}
      style={{
        opacity: (hasOneCard && isPlaying && !alreadyPressed) ? 1 : 0.25,
        transform: (hasOneCard && isPlaying && !alreadyPressed) ? 'scale(1)' : 'scale(0.9)',
        transition: 'all 0.2s ease',
      }}
      title={hasOneCard ? 'Press UNO!' : 'Disabled — press when you have 1 card'}
    >
      UNO!
    </button>
  );
}
