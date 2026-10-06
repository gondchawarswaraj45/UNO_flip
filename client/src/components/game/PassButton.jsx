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

  function handleClick(e) {
    e?.stopPropagation?.();
    if (!canPass) {
      if (!isMyTurn) {
        onCannotPass?.('Wait for your turn to pass');
      } else if (!hasDrawn) {
        onCannotPass?.('Official Rule: You must draw a card from the bundle before passing!');
      }
      return;
    }
    onPass();
  }

  return (
    <button
      type="button"
      className={`pass-btn ${canPass ? 'active' : ''}`}
      id="pass-btn"
      onClick={handleClick}
      style={{
        cursor: canPass ? 'pointer' : isMyTurn ? 'pointer' : 'not-allowed',
      }}
      title={
        !isMyTurn
          ? 'Wait for your turn'
          : !hasDrawn
          ? 'You must draw a card from the bundle before you can pass!'
          : 'Pass your turn to the next player'
      }
    >
      {loading ? 'Passing…' : '⏭ Pass'}
    </button>
  );
}
