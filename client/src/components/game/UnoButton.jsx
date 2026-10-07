/**
 * UNO Button — Authoritative Rule:
 * "UNO button is only available when I have 2 cards, one of those cards is playable, and it is my turn."
 */

import React, { useMemo } from 'react';
import useGameStore from '../../store/gameStore';

export default function UnoButton({ onPress }) {
  const { myHand, gameState, myPlayerId } = useGameStore();

  const isPlaying = gameState?.status === 'PLAYING';
  const isMyTurn = gameState?.currentPlayerId === myPlayerId;
  const cardCount = myHand?.length || 0;
  const alreadyPressed = !!gameState?.players?.find((p) => p.id === myPlayerId)?.unoPressedCorrectly;

  // Determine if at least one card in hand is playable right now
  const hasPlayableCard = useMemo(() => {
    if (!myHand || myHand.length !== 2 || !gameState) return false;
    const topCard = gameState.discardPile?.[gameState.discardPile.length - 1];
    if (!topCard) return true;

    const activeSide = gameState.activeSide || 'LIGHT';
    const topFace = activeSide === 'DARK' ? topCard.darkSide : topCard.lightSide;
    const currentColor = gameState.currentColor || topFace?.color;
    const isAttackActive = !!gameState.pendingDrawStack?.active;

    return myHand.some((card) => {
      const face = activeSide === 'DARK' ? card.darkSide : card.lightSide;
      if (!face) return false;

      // When facing a pending draw stack, only counter with equal or higher draw card
      if (isAttackActive) {
        let penalty = 0;
        if (face.type === 'DRAW_ONE') penalty = 1;
        else if (face.type === 'DRAW_TWO' || face.type === 'WILD_DRAW_TWO') penalty = 2;
        else if (face.type === 'WILD_DRAW_FOUR') penalty = 4;
        else if (face.type === 'DRAW_FIVE') penalty = 5;
        return penalty >= (gameState.pendingDrawStack.currentLevel || 1);
      }

      // Wild cards are playable
      if (
        face.color === 'WILD' ||
        face.type === 'WILD' ||
        face.type === 'WILD_DRAW_FOUR' ||
        face.type === 'WILD_DRAW_TWO' ||
        face.type === 'WILD_DRAW_COLOR'
      ) {
        return true;
      }

      // Flip card
      if (face.type === 'FLIP') {
        return face.color === currentColor || topFace?.type === 'FLIP';
      }

      // Standard match
      const colorMatch = face.color === currentColor;
      const typeMatch = face.type === topFace?.type && face.type !== 'NUMBER';
      const valueMatch = face.type === 'NUMBER' && topFace?.type === 'NUMBER' && face.value === topFace?.value;

      return colorMatch || typeMatch || valueMatch;
    });
  }, [myHand, gameState]);

  // Strict Condition: 2 cards held, one is playable, and it is player's turn
  const canCallUno = isMyTurn && cardCount === 2 && hasPlayableCard;
  const isEnabled = isPlaying && canCallUno && !alreadyPressed;

  return (
    <button
      className={`uno-btn ${isEnabled ? 'pulse-ready' : ''} ${alreadyPressed ? 'called' : ''}`}
      id="uno-btn"
      onClick={onPress}
      disabled={!isEnabled}
      style={{
        opacity: isEnabled ? 1 : alreadyPressed ? 0.95 : 0.28,
        transform: isEnabled ? 'scale(1.06)' : 'scale(0.96)',
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
              boxShadow: '0 0 26px rgba(220, 38, 38, 0.9), 0 0 14px rgba(234, 179, 8, 0.8)',
            }
          : {}),
      }}
      title={
        alreadyPressed
          ? 'UNO called! You are safe from Caught penalties when you play down to 1.'
          : isEnabled
          ? 'Call UNO now before playing your 2nd card down to 1!'
          : !isMyTurn
          ? 'UNO is only available on your turn when you have 2 cards and a playable move.'
          : cardCount !== 2
          ? 'UNO is only available when you hold exactly 2 cards.'
          : !hasPlayableCard
          ? 'UNO is only available when you have a playable card to drop.'
          : 'Disabled'
      }
    >
      {alreadyPressed ? '✓ UNO!' : 'UNO!'}
    </button>
  );
}
