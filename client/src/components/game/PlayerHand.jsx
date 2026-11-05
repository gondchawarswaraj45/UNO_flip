/**
 * PlayerHand — Responsive player hand rendering with support for mobile and desktop.
 *
 *  - Reactive to window size changes: dynamically adjusts fan arc, card spread, and heights.
 *  - Mobile (<768px): Smooth touch-scrolling carousel with snappy touch selection.
 *  - Desktop (>=768px): Tactile curved card fan with adaptive arc that never overflows browser width.
 *  - Authoritative: NEVER highlights "playable" cards — player chooses freely.
 */

import React, { useState } from 'react';
import UnoFlipCard from './UnoFlipCard';
import useGameStore from '../../store/gameStore';
import useWindowSize from '../../hooks/useWindowSize';
import sound from '../../utils/audio';

export default function PlayerHand({ onCardClick }) {
  const { myHand, selectedCardId, gameState } = useGameStore();
  const { width, isMobile, isSmall, isShort } = useWindowSize();
  const activeSide = gameState?.activeSide || 'DARK';
  const oppositeSide = activeSide === 'DARK' ? 'LIGHT' : 'DARK';

  const [peekOpposite, setPeekOpposite] = useState(false);

  if (!myHand || myHand.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: isShort ? '80px' : '110px',
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
  const displaySide = peekOpposite ? oppositeSide : activeSide;

  function handleCardTap(card) {
    sound.playCard();
    sound.vibrate(18);
    onCardClick(card);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', flexShrink: 0 }}>
      {/* ── High-Visibility Floating Button to View Opposite Side ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: isSmall ? '2px 6px 3px' : isMobile ? '3px 8px 4px' : '4px 12px 5px',
          zIndex: 80,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          id="flip-peek-hand-btn"
          onClick={() => {
            sound.flipWoosh();
            sound.vibrate(25);
            setPeekOpposite((prev) => !prev);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isSmall ? 5 : isMobile ? 6 : 9,
            padding: isSmall ? '5px 12px' : isMobile ? '6px 14px' : '7px 20px',
            borderRadius: 99,
            background: peekOpposite
              ? (activeSide === 'DARK'
                  ? 'linear-gradient(135deg, #eab308, #ca8a04)'
                  : 'linear-gradient(135deg, #9333ea, #7e22ce)')
              : (activeSide === 'DARK'
                  ? 'linear-gradient(135deg, #24143a 0%, #121826 100%)'
                  : 'linear-gradient(135deg, #2c2006 0%, #121826 100%)'),
            border: `2px solid ${
              peekOpposite
                ? (activeSide === 'DARK' ? '#facc15' : '#c084fc')
                : (activeSide === 'DARK' ? 'rgba(192, 132, 252, 0.75)' : 'rgba(250, 204, 21, 0.75)')
            }`,
            color: peekOpposite ? '#ffffff' : (activeSide === 'DARK' ? '#f5d0fe' : '#fef08a'),
            fontSize: isSmall ? '0.7rem' : isMobile ? '0.75rem' : '0.82rem',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: peekOpposite
              ? (activeSide === 'DARK'
                  ? '0 0 22px rgba(234, 179, 8, 0.85)'
                  : '0 0 22px rgba(168, 85, 247, 0.85)')
              : '0 4px 14px rgba(0,0,0,0.65)',
            transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            letterSpacing: '0.02em',
          }}
          title={`Click to view your cards on the ${oppositeSide} side`}
        >
          <span style={{ fontSize: isSmall ? '0.85rem' : isMobile ? '1rem' : '1.15rem' }}>{peekOpposite ? '👁️' : '🔄'}</span>
          <span>
            {peekOpposite
              ? `PEEKING ${oppositeSide} SIDE — TAP TO FLIP BACK`
              : `FLIP HAND TO VIEW ${oppositeSide} SIDE`}
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              padding: '2px 7px',
              borderRadius: 99,
              background: peekOpposite
                ? 'rgba(0,0,0,0.5)'
                : (activeSide === 'DARK' ? 'rgba(147, 51, 234, 0.45)' : 'rgba(234, 179, 8, 0.35)'),
              fontWeight: 900,
              letterSpacing: '0.05em',
            }}
          >
            {peekOpposite ? 'ACTIVE' : 'PEEK'}
          </span>
        </button>

        {peekOpposite && (
          <div
            style={{
              fontSize: '0.65rem',
              color: '#fef08a',
              fontWeight: 700,
              marginTop: 2,
              background: 'rgba(0,0,0,0.6)',
              padding: '1px 8px',
              borderRadius: 99,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            ⚠️ Viewing opposite faces. Tap button above to return to playable face.
          </div>
        )}
      </div>

      {/* ─── Mobile View: Horizontal Touch-Scrolling Tray ─── */}
      {isMobile ? (
        <div
          style={{
            width: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: isSmall ? '4px 8px 4px' : '6px 12px 6px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: isSmall ? 4 : 6,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            justifyContent: count <= 4 ? 'center' : 'flex-start',
            height: isShort ? '86px' : '108px',
          }}
        >
          {myHand.map((card, idx) => {
            const isSelected = card.id === selectedCardId;
            const isDrawnThisTurn = gameState?.hasDrawnThisTurn && card.id === gameState?.drawnCardId;
            return (
              <div
                key={card.id}
                onClick={() => handleCardTap(card)}
                className="anim-deal-card"
                style={{
                  flexShrink: 0,
                  transform: isSelected ? 'translateY(-14px) scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.18s ease',
                  zIndex: isSelected ? 40 : idx + 1,
                  cursor: 'pointer',
                  position: 'relative',
                  animationDelay: `${Math.min(idx, 8) * 0.06}s`,
                }}
              >
                {isDrawnThisTurn && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#ffffff',
                      fontSize: '0.55rem',
                      fontWeight: 900,
                      letterSpacing: '0.04em',
                      padding: '1px 5px',
                      borderRadius: 99,
                      boxShadow: '0 0 10px rgba(245, 158, 11, 0.8)',
                      whiteSpace: 'nowrap',
                      zIndex: 50,
                      pointerEvents: 'none',
                    }}
                  >
                    ✦ DRAWN
                  </div>
                )}
                <UnoFlipCard
                  card={card}
                  activeSide={displaySide}
                  selected={isSelected}
                  size={isShort ? 'sm' : 'md'}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── Desktop View: Elegant Curved Fan Layout ─── */
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            height: isShort ? '112px' : '136px',
            width: '100%',
            paddingBottom: '6px',
          }}
        >
          {myHand.map((card, i) => {
            const isSelected = card.id === selectedCardId;
            const isDrawnThisTurn = gameState?.hasDrawnThisTurn && card.id === gameState?.drawnCardId;

            // Responsive fan layout: cards spread smoothly and adaptively with window width
            const maxSpread = Math.min(width * 0.72, 580);
            const fanSpread = Math.min(count * (width < 900 ? 22 : 28), maxSpread);
            const step      = count > 1 ? fanSpread / (count - 1) : 0;
            const offsetX   = count > 1 ? -fanSpread / 2 + i * step : 0;

            // Rotation: cards near center are straight, edges are tilted
            const midIdx = (count - 1) / 2;
            const rot    = (i - midIdx) * (count > 8 ? 1.8 : 2.4);

            // Vertical arc
            const distFromMid = Math.abs(i - midIdx) / (midIdx || 1);
            const arcY        = distFromMid * (isShort ? 8 : 12);

            return (
              <div
                key={card.id}
                className="anim-deal-card"
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${offsetX}px)`,
                  bottom: `${arcY}px`,
                  transform: `rotate(${rot}deg) ${isSelected ? 'translateY(-22px) scale(1.1)' : ''}`,
                  transformOrigin: 'bottom center',
                  zIndex: isSelected ? 50 : i + 1,
                  transition: 'transform 0.18s ease',
                  cursor: 'pointer',
                  animationDelay: `${Math.min(i, 8) * 0.06}s`,
                }}
                onClick={() => handleCardTap(card)}
              >
                {isDrawnThisTurn && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      letterSpacing: '0.04em',
                      padding: '2px 8px',
                      borderRadius: 99,
                      boxShadow: '0 0 12px rgba(245, 158, 11, 0.8)',
                      whiteSpace: 'nowrap',
                      zIndex: 60,
                      pointerEvents: 'none',
                      animation: 'fadeIn 0.2s ease',
                    }}
                  >
                    ✦ DRAWN
                  </div>
                )}
                <UnoFlipCard
                  card={card}
                  activeSide={displaySide}
                  selected={isSelected}
                  size={isShort ? 'sm' : 'md'}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
