/**
 * TableDeckArea — Studio-Grade 3D Physical Tabletop Deck & Discard Experience.
 *
 * Features:
 *  - 3D Stack Depth for Draw Pile (layered card-edge underlays simulating a thick 112-card bundle).
 *  - Official "UNO FLIP!" face-down top card with glossy finish and turn aura.
 *  - High-Voltage Draw Stack Danger Warning (+2, +4, +5 penalty counter with pulsing lightning).
 *  - 3D Discard Stack with natural card misalignment (-3.5deg and +2deg underlay cards).
 *  - Active Color Gemstone Orb with radiant colored aura.
 *  - Tactile interactive feedback on hover, click, and draw.
 */

import React, { memo } from 'react';
import UnoFlipCard from './UnoFlipCard';
import { ACTIVE_SIDE, COLOR_HEX, COLOR_LABEL } from '../../utils/constants';

function TableDeckArea({
  deckCount = 0,
  topCard,
  discardPile = [],
  activeSide = ACTIVE_SIDE.LIGHT,
  currentColor,
  isMyTurn = false,
  isPlaying = false,
  hasDrawnThisTurn = false,
  pendingDrawStack = null,
  onDraw,
  isMobile = false,
  isSmall = false,
  isShort = false,
}) {
  const isDark = activeSide === ACTIVE_SIDE.DARK;
  const isAttackActive = !!pendingDrawStack?.active;
  const penaltyTotal = pendingDrawStack?.totalCards || 0;

  const colorHex = currentColor ? (COLOR_HEX[currentColor] || '#888888') : '#888888';
  const colorLabel = currentColor ? (COLOR_LABEL[currentColor] || currentColor) : '—';

  // Sizing based on device dimensions
  const cardSize = isSmall || isShort ? 'sm' : isMobile ? 'md' : 'lg';
  const drawCardWidth = isSmall ? 52 : isMobile ? 64 : 76;
  const drawCardHeight = isSmall ? 78 : isMobile ? 96 : 114;

  const canDraw = isMyTurn && isPlaying && (!hasDrawnThisTurn || isAttackActive);

  // Second-to-top card for realistic discard stack misalignment
  const underlayCard = discardPile.length > 1 ? discardPile[discardPile.length - 2] : null;
  const underlayCardThird = discardPile.length > 2 ? discardPile[discardPile.length - 3] : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isSmall ? 14 : isMobile ? 22 : 34,
        position: 'relative',
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          1. 3D PHYSICAL DRAW PILE (DECK)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          position: 'relative',
          cursor: canDraw ? 'pointer' : 'default',
        }}
        onClick={canDraw ? onDraw : undefined}
        title={
          isAttackActive
            ? `⚡ Active Draw Attack! Take +${penaltyTotal} penalty cards.`
            : hasDrawnThisTurn
            ? 'Card already drawn this turn. Play a matching card or Pass.'
            : isMyTurn
            ? 'Your Turn: Tap to draw 1 card from the deck'
            : `Draw Pile (${deckCount} cards remaining)`
        }
      >
        {/* The 3D Layered Card Stack */}
        <div
          style={{
            position: 'relative',
            width: drawCardWidth,
            height: drawCardHeight,
            transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
            transform: canDraw ? 'scale(1.04)' : 'scale(1)',
          }}
        >
          {/* Layer 3 (Deepest bottom edge of physical card bundle) */}
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: 5,
              width: '100%',
              height: '100%',
              borderRadius: isSmall ? 8 : 12,
              background: isDark ? '#05060a' : '#0b111a',
              border: isDark ? '1.5px solid #000000' : '1.5px solid rgba(255,255,255,0.2)',
              boxShadow: '0 12px 28px rgba(0,0,0,0.85)',
              transform: 'rotate(-1deg)',
            }}
          />

          {/* Layer 2 (Mid-thickness card edge) */}
          <div
            style={{
              position: 'absolute',
              top: 3,
              left: 2.5,
              width: '100%',
              height: '100%',
              borderRadius: isSmall ? 8 : 12,
              background: isDark ? '#120d20' : '#141d2c',
              border: isDark ? '1.5px solid #000000' : '1.5px solid rgba(255,255,255,0.4)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.65)',
              transform: 'rotate(0.5deg)',
            }}
          />

          {/* Top Face-Down Card with Official UNO Flip Logo */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              zIndex: 5,
              borderRadius: isSmall ? 8 : 12,
              transition: 'all 0.2s ease',
              boxShadow: isAttackActive
                ? '0 0 32px rgba(239, 68, 68, 0.95), 0 0 16px rgba(239, 68, 68, 0.6)'
                : canDraw && !hasDrawnThisTurn
                ? isDark
                  ? '0 0 24px rgba(168, 85, 247, 0.8), 0 8px 24px rgba(0,0,0,0.7)'
                  : '0 0 24px rgba(234, 179, 8, 0.8), 0 8px 24px rgba(0,0,0,0.7)'
                : '0 8px 22px rgba(0,0,0,0.7)',
            }}
          >
            <UnoFlipCard
              faceDown={true}
              activeSide={activeSide}
              size={cardSize}
              style={{
                width: '100%',
                height: '100%',
                cursor: canDraw ? 'pointer' : 'default',
              }}
            />

            {/* Attack Lightning Aura Overlay */}
            {isAttackActive && (
              <div
                style={{
                  position: 'absolute',
                  inset: -3,
                  borderRadius: isSmall ? 10 : 14,
                  border: '2.5px solid #ef4444',
                  animation: 'pulseAttack 1s infinite alternate',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Turn Glow Beacon */}
            {canDraw && !hasDrawnThisTurn && !isAttackActive && (
              <div
                style={{
                  position: 'absolute',
                  inset: -2,
                  borderRadius: isSmall ? 9 : 13,
                  border: `2px solid ${isDark ? '#c084fc' : '#facc15'}`,
                  animation: 'pulseGoldRing 1.4s infinite alternate',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>

          {/* Floating Attack Badge: +X Penalty */}
          {isAttackActive && (
            <div
              style={{
                position: 'absolute',
                top: -14,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #ef4444, #991b1b)',
                border: '1.5px solid #fecaca',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: isSmall ? '0.62rem' : '0.72rem',
                letterSpacing: '0.04em',
                padding: '2px 8px',
                borderRadius: 99,
                whiteSpace: 'nowrap',
                zIndex: 20,
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.9)',
                animation: 'bubbleBounce 0.4s ease',
              }}
            >
              ⚡ +{penaltyTotal} PENALTY
            </div>
          )}
        </div>

        {/* Deck Card Count Chip */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 99,
            background: isAttackActive
              ? 'rgba(239, 68, 68, 0.2)'
              : 'rgba(15, 23, 42, 0.75)',
            border: `1px solid ${
              isAttackActive ? '#ef4444' : 'rgba(229, 185, 76, 0.35)'
            }`,
            color: isAttackActive ? '#fca5a5' : 'var(--text-gold)',
            fontSize: isSmall ? '0.62rem' : '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          <span>{isAttackActive ? '⚡' : '🃏'}</span>
          <span>{deckCount}</span>
        </div>

        {/* Action Callout Subtext */}
        <span
          style={{
            fontSize: isSmall ? '0.62rem' : '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: isAttackActive
              ? '#ef4444'
              : hasDrawnThisTurn
              ? '#22c55e'
              : canDraw
              ? (isDark ? '#c084fc' : '#facc15')
              : 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          {isAttackActive
            ? `TAKE +${penaltyTotal}`
            : hasDrawnThisTurn
            ? 'DRAWN ✓'
            : canDraw
            ? 'TAP TO DRAW'
            : 'DRAW DECK'}
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. 3D PHYSICAL DISCARD PILE
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: drawCardWidth,
            height: drawCardHeight,
          }}
        >
          {/* Faux Card Underlay 1 (offset -3.5deg for tactile table realism) */}
          {underlayCardThird && (
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: -2,
                width: '100%',
                height: '100%',
                transform: 'rotate(-4deg)',
                opacity: 0.55,
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              <UnoFlipCard
                card={underlayCardThird}
                activeSide={activeSide}
                size={cardSize}
                style={{ width: '100%', height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}
              />
            </div>
          )}

          {/* Faux Card Underlay 2 (offset +2.5deg) */}
          {underlayCard && (
            <div
              style={{
                position: 'absolute',
                top: 1,
                left: 2,
                width: '100%',
                height: '100%',
                transform: 'rotate(2.5deg)',
                opacity: 0.75,
                zIndex: 2,
                pointerEvents: 'none',
              }}
            >
              <UnoFlipCard
                card={underlayCard}
                activeSide={activeSide}
                size={cardSize}
                style={{ width: '100%', height: '100%', boxShadow: '0 6px 16px rgba(0,0,0,0.65)' }}
              />
            </div>
          )}

          {/* Top Discard Card */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              zIndex: 5,
            }}
          >
            {topCard ? (
              <UnoFlipCard
                card={topCard}
                activeSide={activeSide}
                isDiscard={true}
                size={cardSize}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: isSmall ? 8 : 12,
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '2px dashed var(--border-mid)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                EMPTY
              </div>
            )}
          </div>
        </div>

        {/* Radiant Active Color Gemstone Orb */}
        {currentColor && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '2px 8px',
              borderRadius: 99,
              background: 'rgba(15, 23, 42, 0.85)',
              border: `1.5px solid ${colorHex}`,
              boxShadow: `0 0 14px ${colorHex}66, inset 0 0 6px ${colorHex}44`,
              transition: 'all 0.3s ease',
            }}
            title={`Active Table Color: ${colorLabel}`}
          >
            {/* Pulsing Glowing Color Bead */}
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: colorHex,
                boxShadow: `0 0 8px ${colorHex}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: isSmall ? '0.62rem' : '0.7rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.04em',
              }}
            >
              {colorLabel}
            </span>
          </div>
        )}

        {/* Discard Pile Subtext Label */}
        <span
          style={{
            fontSize: isSmall ? '0.62rem' : '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          DISCARD
        </span>
      </div>
    </div>
  );
}

export default memo(TableDeckArea);

