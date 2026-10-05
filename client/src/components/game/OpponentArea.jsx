/**
 * OpponentArea — Studio-grade player pod with animated turn aura,
 * customizable avatar frame, level badge, card fan badge, and real-time speech bubbles.
 */

import React from 'react';
import useGameStore from '../../store/gameStore';
import { FRAME_STYLES } from '../ui/ProfileModal';

export default function OpponentArea({ player, position }) {
  const { gameState, myPlayerId, activeReactions } = useGameStore();
  if (!player || player.id === myPlayerId) return null;

  const isActive   = gameState?.currentPlayerId === player.id;
  const cardCount  = player.cardCount || 0;
  const hasUno     = player.unoPressedCorrectly;
  const activeSide = gameState?.activeSide || 'LIGHT';
  const isDark     = activeSide === 'DARK';

  const maxVisible = Math.min(cardCount, 5);

  // Active floating reaction bubble
  const reaction = activeReactions[player.id];

  // Derive frame style (bots have cyber neon, default to gold royal)
  const frameObj = player.isBot ? FRAME_STYLES[1] : FRAME_STYLES[0];
  const avatarEmoji = player.avatar || (player.isBot ? '🤖' : '👤');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        position: 'relative',
        transition: 'transform 0.25s ease',
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* ── Floating Reaction / Speech Bubble ── */}
      {reaction && (
        <div
          style={{
            position: 'absolute',
            top: -38,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ffffff',
            color: '#0f172a',
            padding: '5px 12px',
            borderRadius: 16,
            fontSize: reaction.emoji ? '1.3rem' : '0.78rem',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            zIndex: 60,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            animation: 'bubbleBounce 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
          }}
        >
          {reaction.emoji && <span>{reaction.emoji}</span>}
          {reaction.text && <span>{reaction.text}</span>}
          <div
            style={{
              position: 'absolute',
              bottom: -5,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #ffffff',
            }}
          />
        </div>
      )}

      {/* ── Circular Player Pod with Turn Aura ── */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          padding: 3,
          background: isActive
            ? 'var(--gold-gradient)'
            : frameObj.border,
          boxShadow: isActive
            ? '0 0 24px rgba(229, 185, 76, 0.85), inset 0 0 8px rgba(255,255,255,0.4)'
            : `0 4px 12px rgba(0,0,0,0.6)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          animation: isActive ? 'pulseGoldRing 1.4s ease-in-out infinite' : 'none',
        }}
      >
        {/* Inner Avatar Face */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: '#0a0e17',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.45rem',
            userSelect: 'none',
          }}
        >
          {avatarEmoji}
        </div>

        {/* Level Tag Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: -3,
            right: -3,
            background: player.isBot ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'var(--gold-gradient)',
            color: '#0f172a',
            fontWeight: 900,
            fontSize: '0.52rem',
            padding: '1px 5px',
            borderRadius: 99,
            letterSpacing: '0.04em',
            boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
          }}
        >
          {player.isBot ? 'BOT' : 'LV.2'}
        </div>
      </div>

      {/* ── Name Plate & UNO Alert ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: isActive ? 'rgba(229, 185, 76, 0.18)' : 'rgba(16, 24, 38, 0.85)',
          border: `1px solid ${isActive ? 'rgba(229, 185, 76, 0.5)' : 'var(--border-subtle)'}`,
          borderRadius: 99,
          padding: '3px 10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: isActive ? 'var(--text-gold)' : 'var(--text-primary)',
            maxWidth: 80,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {player.name}
        </span>

        {/* Pulsing Red UNO Badge */}
        {hasUno && (
          <span
            style={{
              background: 'linear-gradient(135deg, #e11d48, #9f1239)',
              color: '#ffffff',
              borderRadius: 99,
              padding: '1px 7px',
              fontSize: '0.62rem',
              fontWeight: 900,
              letterSpacing: '0.05em',
              boxShadow: '0 0 12px rgba(225, 29, 72, 0.8)',
              animation: 'pulseRed 1s infinite alternate',
            }}
          >
            UNO!
          </span>
        )}
      </div>

      {/* ── Face-Down Fanned Mini Cards ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -2,
        }}
      >
        {Array.from({ length: maxVisible }).map((_, idx) => (
          <div
            key={idx}
            style={{
              width: 26,
              height: 38,
              borderRadius: 6,
              background: isDark
                ? 'linear-gradient(135deg, #181024 0%, #2e124d 100%)'
                : 'linear-gradient(135deg, #0e1726 0%, #1e293b 100%)',
              border: `1px solid ${isDark ? 'rgba(168,85,247,0.4)' : 'rgba(229,185,76,0.4)'}`,
              marginLeft: idx > 0 ? -16 : 0,
              boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.5rem',
              color: isDark ? '#c084fc' : '#facc15',
              zIndex: idx,
            }}
          >
            {isDark ? '◈' : '✦'}
          </div>
        ))}

        {/* Overflow Card Count Chip */}
        <div
          style={{
            background: 'rgba(229, 185, 76, 0.15)',
            border: '1px solid rgba(229, 185, 76, 0.4)',
            color: 'var(--text-gold)',
            fontSize: '0.65rem',
            fontWeight: 800,
            borderRadius: 99,
            padding: '1px 6px',
            marginLeft: 4,
          }}
        >
          {cardCount}
        </div>
      </div>
    </div>
  );
}
