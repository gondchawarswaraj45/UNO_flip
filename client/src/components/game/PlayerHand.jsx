/**
 * PlayerHand — renders the current player's private hand.
 *
 * Cards fan out in a curved arc. Selected card lifts up.
 * NO highlighting of "playable" cards — player decides independently.
 */

import React from 'react';
import CardComponent from './CardComponent';
import useGameStore from '../../store/gameStore';

export default function PlayerHand({ onCardClick }) {
  const { myHand, selectedCardId, gameState } = useGameStore();
  const activeSide = gameState?.activeSide || 'LIGHT';

  if (!myHand || myHand.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '120px',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
      }}>
        No cards in hand
      </div>
    );
  }

  const count  = myHand.length;
  const maxFan = Math.min(count, 12);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        height: '140px',
        width: '100%',
        paddingBottom: '8px',
      }}
    >
      {myHand.map((card, i) => {
        const isSelected = card.id === selectedCardId;

        // Fan layout: cards spread in a slight arc
        const fanSpread = Math.min(count * 22, 480);
        const step      = count > 1 ? fanSpread / (count - 1) : 0;
        const offsetX   = count > 1 ? -fanSpread / 2 + i * step : 0;

        // Rotation: cards near center are straight, edges are tilted
        const midIdx = (count - 1) / 2;
        const rot    = (i - midIdx) * (count > 6 ? 2.5 : 1.8);

        // Vertical arc: cards at edges rise slightly
        const distFromMid = Math.abs(i - midIdx) / (midIdx || 1);
        const arcY        = distFromMid * 14;

        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              left: `calc(50% + ${offsetX}px)`,
              bottom: `${arcY}px`,
              transform: `rotate(${rot}deg) ${isSelected ? 'translateY(-22px) scale(1.08)' : ''}`,
              transformOrigin: 'bottom center',
              zIndex: isSelected ? 50 : i + 1,
              transition: 'transform 0.18s ease, z-index 0s',
              cursor: 'pointer',
            }}
            onClick={() => onCardClick(card)}
          >
            <CardComponent
              card={card}
              activeSide={activeSide}
              selected={isSelected}
              size="md"
            />
          </div>
        );
      })}
    </div>
  );
}
