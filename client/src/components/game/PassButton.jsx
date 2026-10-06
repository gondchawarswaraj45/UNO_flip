/**
 * PassButton — Allows player to pass their turn ONLY after drawing a card.
 *
 * Official Mattel UNO Flip Rule (basicRules.pdf):
 * "If you don't have a card that matches... you must take a card from the DRAW pile.
 *  If the card you picked up can be played, you are free to put it down in the same turn.
 *  Otherwise, play moves on to the next person in turn."
 *
 * Strict Constraint: Player CANNOT pass unless they have drawn a card on their turn.
 */

import React from 'react';
import useGameStore from '../../store/gameStore';

export default function PassButton({ onPass, onCannotPass, loading }) {
  const { gameState, myPlayerId } = useGameStore();

  const isOffline = !!gameState?.isOffline || !!useGameStore.getState().isOfflineMode;
  const isMyTurn = isOffline ? true : gameState?.currentPlayerId === myPlayerId;
  const isPlaying = gameState?.status === 'PLAYING';
  const hasDrawn = !!gameState?.hasDrawnThisTurn;

  const canPass = isMyTurn && isPlaying && hasDrawn && !loading;

  function handleClick() {
    if (!canPass) {
      if (isMyTurn && isPlaying && !hasDrawn) {
        onCannotPass?.('Official Rule: You must draw a card from the bundle before passing!');
      }
      return;
    }
    onPass();
  }

  return (
    <div
      style={{ display: 'inline-block' }}
      onClick={!canPass && isMyTurn && !hasDrawn ? handleClick : undefined}
    >
      <button
        className={`pass-btn ${canPass ? 'active' : ''}`}
        id="pass-btn"
        onClick={handleClick}
        disabled={!canPass}
        style={{
          pointerEvents: !canPass && isMyTurn && !hasDrawn ? 'none' : 'auto',
        }}
        title={
          !isMyTurn
            ? 'Wait for your turn'
            : !hasDrawn
            ? 'You must draw a card from the deck before you can pass!'
            : 'Pass your turn to the next player'
        }
      >
        {loading ? 'Passing…' : '⏭ Pass'}
      </button>
    </div>
  );
}
