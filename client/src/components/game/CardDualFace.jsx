import React, { useState } from 'react';
import UnoFlipCard from './UnoFlipCard';
import { ACTIVE_SIDE } from '../../utils/constants';

/**
 * CardDualFace – Renders a UNO Flip card that reveals the opposite side on hover (desktop)
 * or tap (mobile). This gives the player insight into both the light‑side and dark‑side
 * values of the card while keeping the original UnoFlipCard rendering logic.
 *
 * Props are passed through to the underlying UnoFlipCard component.
 */
export default function CardDualFace({
  card,
  activeSide = ACTIVE_SIDE.LIGHT,
  selected = false,
  faceDown = false,
  size = 'md',
  isDiscard = false,
  onClick,
  className = '',
  style = {},
}) {
  if (!card) return null;

  return (
    <div style={{ display: 'inline-block', position: 'relative', ...style }}>
      <UnoFlipCard
        card={card}
        activeSide={activeSide}
        selected={selected}
        faceDown={faceDown}
        size={size}
        isDiscard={isDiscard}
        onClick={onClick}
        className={className}
      />
    </div>
  );
}
