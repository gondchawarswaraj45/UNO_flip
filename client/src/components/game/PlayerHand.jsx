/**
 * PlayerHand — Responsive player hand rendering with support for both mobile and desktop.
 *
 *  - Mobile (<768px): Smooth touch-scrolling carousel with snappy touch selection.
 *  - Desktop (>=768px): Tactile curved card fan with vertical elevation on select.
 *  - Authoritative: NEVER highlights "playable" cards — player chooses freely.
 */

import React, { useState, useEffect } from 'react';
import CardComponent from './CardComponent';
import useGameStore from '../../store/gameStore';
import sound from '../../utils/audio';

export default function PlayerHand({ onCardClick }) {
  const { myHand, selectedCardId, gameState } = useGameStore();
  const activeSide = gameState?.activeSide || 'LIGHT';

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!myHand || myHand.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '110px',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        Waiting for cards…
      </div>
    );
  }

  const count = myHand.length;

  function handleCardTap(card) {
    sound.playCard();
    sound.vibrate(18);
    onCardClick(card);
  }

  // ─── Mobile View: Horizontal Touch-Scrolling Tray ───
  if (isMobile) {
    return (
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '16px 16px 8px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 6,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          justifyContent: count <= 4 ? 'center' : 'flex-start',
        }}
      >
        {myHand.map((card, idx) => {
          const isSelected = card.id === selectedCardId;
          return (
            <div
              key={card.id}
              onClick={() => handleCardTap(card)}
              style={{
                flexShrink: 0,
                transform: isSelected ? 'translateY(-16px) scale(1.08)' : 'scale(1)',
                transition: 'transform 0.18s ease',
                zIndex: isSelected ? 40 : idx + 1,
                cursor: 'pointer',
              }}
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

  // ─── Desktop View: Elegant Curved Fan Layout ───
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

        // Fan layout: cards spread in an adaptive arc
        const fanSpread = Math.min(count * 28, 560);
        const step      = count > 1 ? fanSpread / (count - 1) : 0;
        const offsetX   = count > 1 ? -fanSpread / 2 + i * step : 0;

        // Rotation: cards near center are straight, edges are tilted
        const midIdx = (count - 1) / 2;
        const rot    = (i - midIdx) * (count > 8 ? 2.0 : 2.5);

        // Vertical arc
        const distFromMid = Math.abs(i - midIdx) / (midIdx || 1);
        const arcY        = distFromMid * 12;

        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              left: `calc(50% + ${offsetX}px)`,
              bottom: `${arcY}px`,
              transform: `rotate(${rot}deg) ${isSelected ? 'translateY(-24px) scale(1.1)' : ''}`,
              transformOrigin: 'bottom center',
              zIndex: isSelected ? 50 : i + 1,
              transition: 'transform 0.18s ease',
              cursor: 'pointer',
            }}
            onClick={() => handleCardTap(card)}
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
