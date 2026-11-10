/**
 * OpponentArea — Studio-grade player pod with outward-fanning card view,
 * animated turn aura, customizable avatar frame, level badge, and real-time speech bubbles.
 *
 * Symmetrically adapts card fan placement (left vs right) based on seat layout ('top-left',
 * 'top-right', 'top', 'left', 'right') so the cards never obstruct the table felt info,
 * game side badges, direction indicators, or win odds.
 */

import React from 'react';
import useGameStore from '../../store/gameStore';
import { FRAME_STYLES } from '../ui/ProfileModal';
import { ACTIVE_SIDE } from '../../utils/constants';
import UnoFlipCard from './UnoFlipCard';
import useWindowSize from '../../hooks/useWindowSize';

export default function OpponentArea({ player, position, seatLayout }) {
  const { gameState, myPlayerId, activeReactions, botThinking, actionAlert } = useGameStore();
  if (!player || player.id === myPlayerId) return null;

  const layout = seatLayout || position || 'top';
  const isActive   = gameState?.currentPlayerId === player.id;
  const cardCount  = player.cardCount || 0;
  const hasUno     = player.unoPressedCorrectly;
  const activeSide = gameState?.activeSide || 'LIGHT';
  const isDark     = activeSide === 'DARK';
  const isTwoSide  = gameState?.config?.mode === 'TWO_SIDE';
  const isThinking = !!botThinking?.[player.id];
  const hasPenalty = actionAlert?.targetId === player.id && actionAlert?.type === 'PENALTY_DRAW' && actionAlert?.drawCount > 0;

  const { isSmall, isMobile } = useWindowSize();
  const maxVisible = Math.min(cardCount, isSmall || isMobile ? 3 : 4);

  // Active floating reaction bubble
  const reaction = activeReactions[player.id];

  // Derive frame style (bots have cyber neon, default to gold royal)
  const frameObj = player.isBot ? FRAME_STYLES[1] : FRAME_STYLES[0];
  const avatarEmoji = player.avatar || (player.isBot ? '🤖' : '👤');

  // Floating notifications anchored directly above the player's avatar
  const renderFloatingAlerts = () => (
    <>
      {/* Bot Thinking Suspense Indicator */}
      {isThinking && !reaction && (
        <div
          style={{
            position: 'absolute',
            top: -34,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(148, 163, 184, 0.4)',
            color: '#38bdf8',
            padding: '3px 10px',
            borderRadius: 14,
            fontSize: '0.72rem',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            zIndex: 60,
            boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span>💭 Thinking</span>
          <span className="dot-pulse">...</span>
        </div>
      )}

      {/* Penalty Draw Floating Badge (+1, +4, +5) */}
      {hasPenalty && (
        <div
          style={{
            position: 'absolute',
            top: -42,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            border: '1.5px solid #fecaca',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: 14,
            fontSize: '0.75rem',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            zIndex: 65,
            boxShadow: '0 0 18px rgba(220, 38, 38, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            animation: 'bubbleBounce 0.4s ease',
          }}
        >
          <span>⚡ +{actionAlert.drawCount} Cards</span>
        </div>
      )}

      {/* Floating Reaction / Speech Bubble */}
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
    </>
  );

  // Avatar Pod with Level Badge & Turn Ring
  const renderAvatarPod = () => (
    <div
      style={{
        width: isSmall ? 34 : 40,
        height: isSmall ? 34 : 40,
        borderRadius: '50%',
        padding: 2.5,
        background: isActive
          ? 'var(--gold-gradient)'
          : frameObj.border,
        boxShadow: isActive
          ? '0 0 24px rgba(229, 185, 76, 0.85), inset 0 0 8px rgba(255,255,255,0.4)'
          : '0 4px 12px rgba(0,0,0,0.6)',
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
          fontSize: isSmall ? '1.05rem' : '1.2rem',
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
          fontSize: '0.5rem',
          padding: '1px 4px',
          borderRadius: 99,
          letterSpacing: '0.04em',
          boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
        }}
      >
        {player.isBot ? 'BOT' : 'LV.2'}
      </div>
    </div>
  );

  // Player Name Plate & UNO Tag
  const renderNamePlate = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        background: isActive ? 'rgba(229, 185, 76, 0.22)' : 'rgba(12, 18, 30, 0.88)',
        border: `1px solid ${isActive ? 'rgba(229, 185, 76, 0.55)' : 'var(--border-subtle)'}`,
        borderRadius: 99,
        padding: '2px 7px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
        maxWidth: 90,
      }}
    >
      <span
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: isActive ? 'var(--text-gold)' : 'var(--text-primary)',
          maxWidth: 72,
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
            padding: '1px 5px',
            fontSize: '0.58rem',
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
  );

  // Finished Rank Badge OR Fanned Mini Card Backs
  const renderCardsFan = () => {
    if (player.isFinished || player.rank) {
      return (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(229,185,76,0.25), rgba(202,138,4,0.35))',
            border: '1.5px solid #facc15',
            color: '#fef08a',
            borderRadius: 99,
            padding: '2px 8px',
            fontSize: '0.64rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 0 14px rgba(234, 179, 8, 0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{player.rank === 1 ? '🥇 1st' : player.rank === 2 ? '🥈 2nd' : player.rank === 3 ? '🥉 3rd' : `#${player.rank}`}</span>
          <span style={{ fontSize: '0.58rem', color: '#ffffff', opacity: 0.85 }}>(Cleared)</span>
        </div>
      );
    }

    const cardsToShow = player.cardsBack && player.cardsBack.length > 0
      ? player.cardsBack.slice(0, 4)
      : Array.from({ length: maxVisible });

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Real Outward-Facing Card Backs in Authentic Mini Fan Layout */}
        {cardsToShow.map((c, idx) => (
          <div
            key={c?.id || idx}
            style={{
              marginLeft: idx === 0 ? 0 : (isSmall ? -18 : -16),
              boxShadow: '0 3px 8px rgba(0,0,0,0.6)',
              borderRadius: 6,
              transition: 'transform 0.2s ease',
              zIndex: idx + 1,
            }}
            title={
              c && (isDark ? c.lightSide : c.darkSide)
                ? `Opponent Backside: ${(isDark ? c.lightSide : c.darkSide).color} ${(isDark ? c.lightSide : c.darkSide).type}`
                : 'Opponent Card'
            }
          >
            <UnoFlipCard
              card={c && c.lightSide ? c : {
                lightSide: { color: 'RED', type: 'NUMBER', value: 0 },
                darkSide: { color: 'PINK', type: 'DRAW_FIVE', value: null }
              }}
              activeSide={isDark ? ACTIVE_SIDE.LIGHT : ACTIVE_SIDE.DARK}
              faceDown={!isTwoSide}
              size="xs"
            />
          </div>
        ))}

        {/* Overflow Card Count Chip */}
        <div
          style={{
            background: 'rgba(229, 185, 76, 0.18)',
            border: '1px solid rgba(229, 185, 76, 0.5)',
            color: 'var(--text-gold)',
            fontSize: '0.64rem',
            fontWeight: 900,
            borderRadius: 99,
            padding: '1px 6px',
            marginLeft: 5,
            zIndex: 10,
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          }}
        >
          {cardCount}
        </div>
      </div>
    );
  };

  // Determine if cards fan should sit to the left of the avatar (outward for left seats)
  const isCardsOnLeft = layout === 'top-left' || layout === 'left';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: isSmall ? 5 : 8,
        position: 'relative',
        transition: 'transform 0.25s ease',
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
        pointerEvents: 'auto',
      }}
    >
      {/* If seated on the left/top-left, fan cards outward to the left */}
      {isCardsOnLeft && renderCardsFan()}

      {/* Avatar Pod & Nameplate Column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          position: 'relative',
        }}
      >
        {renderFloatingAlerts()}
        {renderAvatarPod()}
        {renderNamePlate()}
      </div>

      {/* If seated on top, top-right, or right, fan cards outward to the right */}
      {!isCardsOnLeft && renderCardsFan()}
    </div>
  );
}
