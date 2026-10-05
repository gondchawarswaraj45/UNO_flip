/**
 * GameScreen — Core Authoritative In-Game Tabletop View.
 *
 * Enforces strict authoritativeness:
 *  - No strategic hints, no playable-card glow/highlights.
 *  - Player chooses which card to attempt; server strictly validates.
 *  - Caught window countdown is server-driven.
 *  - Dynamic audio feedback (tactile card moves, turn chime, 3D flip woosh).
 */

import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../../store/gameStore';
import CardComponent from '../game/CardComponent';
import PlayerHand    from '../game/PlayerHand';
import OpponentArea  from '../game/OpponentArea';
import UnoButton     from '../game/UnoButton';
import CaughtButton  from '../game/CaughtButton';
import ColorPicker   from '../game/ColorPicker';
import GameInfo      from '../game/GameInfo';
import LeaderboardModal from '../ui/LeaderboardModal';
import { CARD_TYPE, COLOR_HEX } from '../../utils/constants';
import sound from '../../utils/audio';

export default function GameScreen() {
  const {
    socket, gameState, myPlayerId, myHand,
    selectedCardId, setSelectedCardId,
    showColorPicker, pendingWildCardId,
    openColorPicker, closeColorPicker,
    soundEnabled, toggleSound,
    showLeaderboard, setShowLeaderboard,
  } = useGameStore();

  const [actionError, setActionError] = useState('');
  const [drawLoading, setDrawLoading] = useState(false);
  const prevActiveSide = useRef(gameState?.activeSide);
  const prevIsMyTurn = useRef(false);

  // Audio cues for turn changes and board flips
  useEffect(() => {
    if (!gameState) return;

    // Detect FLIP between Light and Dark
    if (prevActiveSide.current && prevActiveSide.current !== gameState.activeSide) {
      sound.flipWoosh();
    }
    prevActiveSide.current = gameState.activeSide;

    // Detect when it becomes my turn
    const isNowMyTurn = gameState.currentPlayerId === myPlayerId;
    if (isNowMyTurn && !prevIsMyTurn.current) {
      sound.turnNotice();
    }
    prevIsMyTurn.current = isNowMyTurn;
  }, [gameState?.activeSide, gameState?.currentPlayerId, myPlayerId]);

  if (!gameState) return null;

  const { players, activeSide, currentColor, discardPile, deckCount, status } = gameState;
  const topCard   = discardPile?.[0] || null;
  const myInfo    = players.find(p => p.id === myPlayerId);
  const opponents = players.filter(p => p.id !== myPlayerId);
  const isMyTurn  = gameState.currentPlayerId === myPlayerId;
  const isPlaying = status === 'PLAYING';

  // Position opponents around the table
  const topOpps   = opponents.slice(0, Math.ceil(opponents.length / 2));
  const sideOpps  = opponents.slice(Math.ceil(opponents.length / 2));
  const leftOpp   = sideOpps[0] || null;
  const rightOpp  = sideOpps[1] || null;

  // ─── Card Selection & Play ────────────────────────────────────────────────

  function handleCardClick(card) {
    if (!isMyTurn || !isPlaying) return;
    const face = activeSide === 'DARK' ? card.darkSide : card.lightSide;

    if (selectedCardId === card.id) {
      attemptPlay(card);
    } else {
      setSelectedCardId(card.id);
      setActionError('');
    }
  }

  function attemptPlay(card) {
    const face = activeSide === 'DARK' ? card.darkSide : card.lightSide;
    const isWild = face?.color === 'WILD' || face?.type === CARD_TYPE.WILD ||
      face?.type === CARD_TYPE.WILD_DRAW_FOUR || face?.type === CARD_TYPE.WILD_DRAW_TWO;

    if (isWild) {
      openColorPicker(card.id);
      return;
    }

    sendPlay(card.id, null);
  }

  function handleColorChosen(color) {
    closeColorPicker();
    if (pendingWildCardId) {
      sendPlay(pendingWildCardId, color);
    }
  }

  function sendPlay(cardId, chosenColor) {
    setActionError('');
    socket.emit('playCard', { cardId, chosenColor }, (res) => {
      if (!res.ok) {
        setActionError(res.error || 'Invalid move according to authoritative rules');
        setSelectedCardId(null);
      } else {
        setSelectedCardId(null);
      }
    });
  }

  // ─── Draw Card ────────────────────────────────────────────────────────────

  function handleDraw() {
    if (!isMyTurn || !isPlaying || drawLoading) return;
    setDrawLoading(true);
    setSelectedCardId(null);
    sound.drawCard();

    socket.emit('drawCard', null, (res) => {
      setDrawLoading(false);
      if (!res.ok) setActionError(res.error || 'Draw not permitted');
    });
  }

  // ─── UNO Call ─────────────────────────────────────────────────────────────

  function handleUnoPress() {
    sound.unoShout();
    socket.emit('pressUno', null, (res) => {
      if (!res.ok) setActionError(res.error || 'Cannot call UNO now');
    });
  }

  // ─── Caught Action ────────────────────────────────────────────────────────

  function handleCaught({ targetPlayerId, moveId }) {
    sound.caughtAlarm();
    socket.emit('pressCaught', { targetPlayerId, moveId }, (res) => {
      if (!res.ok) setActionError(res.error || 'Caught challenge rejected');
    });
  }

  return (
    <div className="game-table" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', padding: '12px', position: 'relative' }}>
      {/* Table Ambient Felt */}
      <div className="table-felt" />

      {/* Top Header Utilities */}
      <div style={{
        position: 'absolute',
        top: 14,
        right: 18,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { sound.buttonClick(); setShowLeaderboard(true); }}
          style={{ padding: '6px 12px', borderRadius: 'var(--radius-lg)', fontSize: '0.8rem' }}
        >
          🏆 Stats
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => toggleSound()}
          title={soundEnabled ? 'Mute' : 'Unmute'}
          style={{ padding: '6px 10px', borderRadius: 'var(--radius-lg)' }}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      {/* ── Top Opponents Row ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        gap: 20, padding: '4px 16px', flexWrap: 'wrap',
        zIndex: 5, position: 'relative',
      }}>
        {topOpps.map(p => (
          <OpponentArea key={p.id} player={p} position="top" />
        ))}
      </div>

      {/* ── Middle Row: Table Center ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 24, position: 'relative', zIndex: 5,
      }}>
        {/* Left Opponent */}
        {leftOpp && <OpponentArea player={leftOpp} position="left" />}

        {/* Center: Draw Pile | Discard Pile | Game Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {/* Side & Direction Info */}
          <GameInfo />

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Draw Pile */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                cursor: isMyTurn && isPlaying ? 'pointer' : 'default',
              }}
              onClick={handleDraw}
            >
              <div style={{
                width: 86,
                height: 128,
                borderRadius: 16,
                background: activeSide === 'DARK'
                  ? 'linear-gradient(135deg, #181024 0%, #2e124d 100%)'
                  : 'linear-gradient(135deg, #0e1726 0%, #1e293b 100%)',
                border: `2px solid ${activeSide === 'DARK' ? 'rgba(168,85,247,0.4)' : 'rgba(229,185,76,0.4)'}`,
                boxShadow: isMyTurn && isPlaying
                  ? (activeSide === 'DARK' ? '0 0 24px rgba(168,85,247,0.5)' : '0 0 24px rgba(229,185,76,0.4)')
                  : '0 6px 20px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 6,
                transition: 'all 0.2s ease',
                transform: isMyTurn && isPlaying ? 'scale(1.05)' : 'scale(1)',
              }}>
                <span style={{ fontSize: '1.8rem', color: activeSide === 'DARK' ? '#c084fc' : '#facc15', opacity: 0.8 }}>
                  {activeSide === 'DARK' ? '◈' : '✦'}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  {deckCount} cards
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                DRAW PILE
              </span>
            </div>

            {/* Discard Pile */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {topCard ? (
                <CardComponent
                  card={topCard}
                  activeSide={activeSide}
                  isDiscard={true}
                  size="lg"
                />
              ) : (
                <div style={{
                  width: 86,
                  height: 128,
                  borderRadius: 16,
                  background: 'var(--bg-glass)',
                  border: '2px dashed var(--border-mid)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                }}>
                  Empty
                </div>
              )}

              {/* Active Color Pip Indicator */}
              {currentColor && (
                <div style={{
                  width: 32,
                  height: 10,
                  borderRadius: 99,
                  background: COLOR_HEX[currentColor] || '#888',
                  boxShadow: `0 0 12px ${COLOR_HEX[currentColor] || '#888'}aa`,
                  border: '1px solid rgba(255,255,255,0.3)',
                }} />
              )}
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                DISCARD
              </span>
            </div>
          </div>

          {/* Turn Indicator */}
          {isPlaying && (
            <div className="turn-indicator">
              <div className="turn-dot" />
              {isMyTurn ? (
                <span style={{ color: 'var(--text-gold)', fontWeight: 800, fontSize: '0.92rem' }}>
                  Your Turn — Play or Draw
                </span>
              ) : (
                <span>
                  {players.find(p => p.id === gameState.currentPlayerId)?.name ?? '…'}'s Turn
                </span>
              )}
            </div>
          )}

          {/* Action Error Notification */}
          {actionError && (
            <div style={{
              padding: '6px 16px',
              borderRadius: 99,
              background: 'rgba(220,38,38,0.2)',
              border: '1px solid rgba(220,38,38,0.4)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              fontWeight: 600,
              animation: 'fadeIn 0.2s ease',
            }}>
              {actionError}
            </div>
          )}
        </div>

        {/* Right Opponent */}
        {rightOpp && <OpponentArea player={rightOpp} position="right" />}
      </div>

      {/* ── My Hand Fanning Area ── */}
      <div style={{ position: 'relative', zIndex: 10, paddingBottom: 4 }}>
        <PlayerHand onCardClick={handleCardClick} />
      </div>

      {/* ── Bottom Controls: UNO, Caught, Draw ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '6px 16px 10px',
        zIndex: 10,
        position: 'relative',
        flexWrap: 'wrap',
      }}>
        {/* Player Identity Badge */}
        <div className="player-badge" style={{ marginRight: 'auto' }}>
          <span>👤</span>
          <span>{myInfo?.name}</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ color: 'var(--text-gold)' }}>{myHand.length} cards</span>
        </div>

        {/* UNO Button */}
        <UnoButton onPress={handleUnoPress} />

        {/* Caught Challenge Button */}
        <CaughtButton onCaught={handleCaught} />

        {/* Explicit Draw Card Button */}
        {isMyTurn && isPlaying && (
          <button className="btn btn-ghost" onClick={handleDraw} disabled={drawLoading}>
            {drawLoading ? 'Drawing…' : '📤 Draw Card'}
          </button>
        )}
      </div>

      {/* Color Selection Modal (For Wild cards) */}
      {showColorPicker && (
        <ColorPicker onSelect={handleColorChosen} onCancel={() => { closeColorPicker(); setSelectedCardId(null); }} />
      )}

      {/* Stats Modal */}
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  );
}
