/**
 * UNO Button — Authoritative Rule & UX:
 * 1. Preemptive Call: Available on player's turn when holding 2 cards with a legal play.
 * 2. Emergency Call: Available when holding 1 card and UNO has not yet been called.
 * 3. Every-Time Rule: Player must say UNO every time they reach UNO condition, not just the first time!
 */

import React, { useMemo } from 'react';
import useGameStore from '../../store/gameStore';
import useWindowSize from '../../hooks/useWindowSize';

export default function UnoButton({ onPress }) {
  const { myHand, gameState, myPlayerId } = useGameStore();
  const { isSmall, isMobile } = useWindowSize();

  const isPlaying = gameState?.status === 'PLAYING';
  const isMyTurn = gameState?.currentPlayerId === myPlayerId;
  const cardCount = myHand?.length || 0;
  
  // A player's UNO call is only valid for their current 1-card / 2-card instance
  const playerInfo = gameState?.players?.find((p) => p.id === myPlayerId);
  const alreadyPressed = !!playerInfo?.unoPressedCorrectly && (cardCount === 1 || (cardCount === 2 && isMyTurn));

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

  // Condition 1: Preemptive call holding 2 cards on your turn with a playable move
  const canPreCallUno = isMyTurn && cardCount === 2 && hasPlayableCard;
  // Condition 2: Active 1-card call before being caught
  const canPostCallUno = cardCount === 1;

  const isEligible = (canPreCallUno || canPostCallUno) && !alreadyPressed;
  const isEnabled = isPlaying && isEligible;

  return (
    <button
      className={`uno-btn ${isEnabled ? 'pulse-ready' : ''} ${alreadyPressed ? 'called' : ''}`}
      id="uno-btn"
      onClick={onPress}
      disabled={!isEnabled}
      style={{
        padding: isSmall ? '8px 14px' : isMobile ? '9px 18px' : '11px 26px',
        fontSize: isSmall ? '0.95rem' : isMobile ? '1.1rem' : '1.35rem',
        opacity: isEnabled ? 1 : alreadyPressed ? 0.95 : 0.28,
        transform: isEnabled ? 'scale(1.06)' : 'scale(0.96)',
        cursor: isEnabled ? 'pointer' : alreadyPressed ? 'default' : 'not-allowed',
        transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        flexShrink: 0,
        ...(alreadyPressed
          ? {
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              borderColor: '#6ee7b7',
              color: '#ffffff',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.6)',
            }
          : isEnabled
          ? {
              boxShadow: '0 0 28px rgba(220, 38, 38, 0.95), 0 0 16px rgba(234, 179, 8, 0.85)',
            }
          : {}),
      }}
      title={
        alreadyPressed
          ? 'UNO called! You are safe from Caught penalties when you play down to 1.'
          : isEnabled
          ? (cardCount === 1 ? 'Say UNO now before another player catches you!' : 'Call UNO now before playing down to 1!')
          : !isMyTurn && cardCount !== 1
          ? 'UNO is available on your turn when you have 2 cards, or anytime you hold 1 card.'
          : cardCount > 2
          ? 'UNO is only available when holding 1 or 2 cards.'
          : !hasPlayableCard && cardCount === 2
          ? 'UNO is only available when you have a playable card to drop.'
          : 'Disabled'
      }
    >
      {alreadyPressed ? '✓ UNO!' : 'UNO!'}
    </button>
  );
}
