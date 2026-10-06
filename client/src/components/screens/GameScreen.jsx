/**
 * GameScreen — Core Authoritative In-Game Tabletop View.
 *
 * Enforces strict authoritativeness:
 *  - No strategic hints, no playable-card glow/highlights.
 *  - Player chooses which card to attempt; server strictly validates.
 *  - Caught window countdown is server-driven.
 *  - Full Arcade UI/UX: Rich player stations, animated turn timer glow, quick reactions,
 *    and responsive mobile touch layout.
 */

import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../../store/gameStore';
import CardComponent from '../game/CardComponent';
import PlayerHand from '../game/PlayerHand';
import OpponentArea from '../game/OpponentArea';
import UnoButton from '../game/UnoButton';
import CaughtButton from '../game/CaughtButton';
import PassButton from '../game/PassButton';
import ColorPicker from '../game/ColorPicker';
import GameInfo from '../game/GameInfo';
import ArcadeHeader from '../ui/ArcadeHeader';
import QuickReactionTray from '../game/QuickReactionTray';
import ProfileModal, { FRAME_STYLES } from '../ui/ProfileModal';
import LeaderboardModal from '../ui/LeaderboardModal';
import RulesModal from '../ui/RulesModal';
import ShuffleDealAnimation from '../game/ShuffleDealAnimation';
import TableEventOverlays from '../game/TableEventOverlays';
import { CARD_TYPE, COLOR_HEX } from '../../utils/constants';
import sound from '../../utils/audio';

/**
 * Dynamically scale table felt dimensions according to player count.
 * 2 players: compact, 3 players: small, 4 players: medium, 6 players: big grand casino table.
 */
function getTableDimensions(playerCount) {
  if (playerCount <= 2) {
    return { width: 'min(640px, 88vw)', height: 'clamp(300px, 46vh, 360px)' };
  }
  if (playerCount === 3) {
    return { width: 'min(760px, 90vw)', height: 'clamp(330px, 50vh, 400px)' };
  }
  if (playerCount === 4) {
    return { width: 'min(880px, 92vw)', height: 'clamp(360px, 54vh, 440px)' };
  }
  if (playerCount === 5) {
    return { width: 'min(1000px, 94vw)', height: 'clamp(390px, 58vh, 480px)' };
  }
  // 6 or more players: grand casino stadium table
  return { width: 'min(1160px, 96vw)', height: 'clamp(410px, 62vh, 520px)' };
}

/**
 * Seat opponents symmetrically along the outer rim of the felt table based on count.
 */
function getOpponentSeatStyle(idx, count) {
  if (count === 1) {
    // 2 players: 1 opponent directly top center
    return {
      position: 'absolute',
      top: -46,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 25,
    };
  }
  if (count === 2) {
    // 3 players: small table, 2 opponents at top-left and top-right
    const positions = [
      { top: -42, left: '26%', transform: 'translateX(-50%)' },
      { top: -42, left: '74%', transform: 'translateX(-50%)' },
    ];
    return { position: 'absolute', ...positions[idx], zIndex: 25 };
  }
  if (count === 3) {
    // 4 players: Left rim, Top Center, Right rim
    const positions = [
      { top: '48%', left: -52, transform: 'translateY(-50%)' },
      { top: -46, left: '50%', transform: 'translateX(-50%)' },
      { top: '48%', right: -52, transform: 'translateY(-50%)' },
    ];
    return { position: 'absolute', ...positions[idx], zIndex: 25 };
  }
  if (count === 4) {
    // 5 players: Mid-Left, Top-Left, Top-Right, Mid-Right
    const positions = [
      { top: '56%', left: -48, transform: 'translateY(-50%)' },
      { top: -44, left: '24%', transform: 'translateX(-50%)' },
      { top: -44, left: '76%', transform: 'translateX(-50%)' },
      { top: '56%', right: -48, transform: 'translateY(-50%)' },
    ];
    return { position: 'absolute', ...positions[idx], zIndex: 25 };
  }
  // 5 or more opponents (6+ players): Far-Left, Top-Left, Top-Center, Top-Right, Far-Right
  const positions = [
    { top: '60%', left: -52, transform: 'translateY(-50%)' },
    { top: -38, left: '18%', transform: 'translateX(-50%)' },
    { top: -46, left: '50%', transform: 'translateX(-50%)' },
    { top: -38, left: '82%', transform: 'translateX(-50%)' },
    { top: '60%', right: -52, transform: 'translateY(-50%)' },
  ];
  return { position: 'absolute', ...(positions[idx] || positions[0]), zIndex: 25 };
}

export default function GameScreen() {
  const {
    socket,
    gameState,
    myPlayerId,
    myHand,
    profile,
    selectedCardId,
    setSelectedCardId,
    showColorPicker,
    pendingWildCardId,
    openColorPicker,
    closeColorPicker,
    showLeaderboard,
    setShowLeaderboard,
    showProfileModal,
    setShowProfileModal,
    showRulesModal,
    setShowRulesModal,
    activeReactions,
  } = useGameStore();

  const [actionError, setActionError] = useState('');
  const [drawLoading, setDrawLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [hasShuffled, setHasShuffled] = useState(false);
  const prevGameId = useRef(gameState?.gameId);
  const prevActiveSide = useRef(gameState?.activeSide);
  const prevIsMyTurn = useRef(false);

  // Reset shuffle animation when a new match begins
  useEffect(() => {
    if (gameState?.gameId && gameState.gameId !== prevGameId.current) {
      prevGameId.current = gameState.gameId;
      setHasShuffled(false);
    }
  }, [gameState?.gameId]);

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
      sound.vibrate(30);
    }
    prevIsMyTurn.current = isNowMyTurn;
  }, [gameState?.activeSide, gameState?.currentPlayerId, myPlayerId]);

  if (!gameState) return null;

  const { players, activeSide, currentColor, discardPile, deckCount, status } = gameState;
  const topCard   = discardPile?.[0] || null;
  const myInfo    = players.find((p) => p.id === myPlayerId);
  const opponents = players.filter((p) => p.id !== myPlayerId);
  const isOffline = !!gameState.isOffline || !!useGameStore.getState().isOfflineMode;
  const isMyTurn  = isOffline ? true : gameState.currentPlayerId === myPlayerId;
  const isPlaying = status === 'PLAYING';

  // Compute dynamic table dimensions based on total player count
  const tableDim = getTableDimensions(players.length);

  // My own reaction bubble if any
  const myReaction = activeReactions[myPlayerId];
  const myFrameObj = FRAME_STYLES.find((f) => f.id === profile.frame) || FRAME_STYLES[0];
  const level = Math.max(1, Math.floor((profile.xp || 0) / 150) + 1);

  // ─── Card Selection & Play ────────────────────────────────────────────────

  function handleCardClick(card) {
    if (!isMyTurn || !isPlaying) return;

    if (selectedCardId === card.id) {
      attemptPlay(card);
    } else {
      setSelectedCardId(card.id);
      setActionError('');
    }
  }

  function attemptPlay(card) {
    const face = activeSide === 'DARK' ? card.darkSide : card.lightSide;
    const isWild =
      face?.color === 'WILD' ||
      face?.type === CARD_TYPE.WILD ||
      face?.type === CARD_TYPE.WILD_DRAW_FOUR ||
      face?.type === CARD_TYPE.WILD_DRAW_TWO;

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
    const asPlayerId = isOffline ? gameState.currentPlayerId : myPlayerId;
    socket.emit('playCard', { cardId, chosenColor, asPlayerId }, (res) => {
      if (!res.ok) {
        if (res.error === 'MUST_COUNTER_WITH_DRAW_CARD') {
          const lvl = gameState.pendingDrawStack?.currentLevel || 1;
          const total = gameState.pendingDrawStack?.totalCards || 1;
          setActionError(`⚡ Active Attack (+${total})! You must counter with a +${lvl} or higher Draw card, or take the penalty.`);
        } else if (res.error === 'CANNOT_DOWNGRADE_DRAW_STACK') {
          const lvl = gameState.pendingDrawStack?.currentLevel || 2;
          setActionError(`🚫 Cannot downgrade! You cannot play a lower draw card on a +${lvl} attack. Play +${lvl} or higher, or take the penalty.`);
        } else {
          setActionError(res.error || 'Invalid move according to authoritative rules');
        }
        setSelectedCardId(null);
      } else {
        setSelectedCardId(null);
      }
    });
  }

  // ─── Draw Card ────────────────────────────────────────────────────────────

  function handleDraw() {
    if (!isMyTurn || !isPlaying || drawLoading) return;
    if (gameState.hasDrawnThisTurn && !gameState.pendingDrawStack?.active) {
      setActionError('You already drew a card this turn! Drop a matching card or press Pass Turn.');
      return;
    }
    setDrawLoading(true);
    setSelectedCardId(null);
    sound.drawCard();
    sound.vibrate(20);

    const asPlayerId = isOffline ? gameState.currentPlayerId : myPlayerId;
    socket.emit('drawCard', { asPlayerId }, (res) => {
      setDrawLoading(false);
      if (!res.ok) {
        if (res.error === 'ALREADY_DRAWN_THIS_TURN') {
          setActionError('You already drew a card this turn! Drop a matching card or press Pass Turn.');
        } else {
          setActionError(res.error || 'Draw not permitted');
        }
      }
    });
  }

  // ─── Pass Turn ────────────────────────────────────────────────────────────

  function handlePass() {
    if (!isMyTurn || !isPlaying || passLoading) return;
    if (gameState.pendingDrawStack?.active) {
      setActionError('⚡ Cannot pass during a Draw Attack! Play a counter card or take the penalty.');
      return;
    }
    if (!gameState.hasDrawnThisTurn) {
      setActionError('Official Rule: You must draw a card from the bundle before passing!');
      return;
    }
    setPassLoading(true);
    setSelectedCardId(null);
    sound.flipWoosh();
    sound.vibrate(20);

    const asPlayerId = isOffline ? gameState.currentPlayerId : myPlayerId;
    socket.emit('passTurn', { asPlayerId }, (res) => {
      setPassLoading(false);
      if (!res.ok) {
        if (res.error === 'CANNOT_PASS_DURING_DRAW_ATTACK') {
          setActionError('⚡ Cannot pass during a Draw Attack! Play a counter card or take the penalty.');
        } else {
          setActionError(res.error || 'Cannot pass turn');
        }
      }
    });
  }

  // ─── UNO Call ─────────────────────────────────────────────────────────────

  function handleUnoPress() {
    sound.unoShout();
    sound.vibrate([40, 30, 40]);
    const asPlayerId = isOffline ? gameState.currentPlayerId : myPlayerId;
    socket.emit('pressUno', { asPlayerId }, (res) => {
      if (!res.ok) setActionError(res.error || 'Cannot call UNO now');
    });
  }

  // ─── Caught Action ────────────────────────────────────────────────────────

  function handleCaught({ targetPlayerId, moveId }) {
    sound.caughtAlarm();
    sound.vibrate([50, 40, 50]);
    const asCatcherId = isOffline ? gameState.currentPlayerId : myPlayerId;
    socket.emit('pressCaught', { targetPlayerId, moveId, asCatcherId }, (res) => {
      if (!res.ok) setActionError(res.error || 'Caught challenge rejected');
    });
  }

  return (
    <div
      className="game-table"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* Start-of-Match Cinematic Card Shuffle & Deal Animation */}
      {!hasShuffled && isPlaying && (
        <ShuffleDealAnimation
          activeSide={activeSide}
          onComplete={() => setHasShuffled(true)}
        />
      )}

      {/* Top Arcade HUD (Profile Pill, Room Code, Chat Trigger, Sound) */}
      <ArcadeHeader showRoomCode={true} showChat={true} />

      {/* Floating Quick Reaction Tray */}
      <QuickReactionTray />

      {/* ── Dynamic Casino Stadium Table Felt (Scales with Player Count) ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: 0,
          padding: '16px 24px',
          zIndex: 5,
        }}
      >
        <div
          className={`casino-felt ${activeSide === 'DARK' ? 'casino-felt-dark' : ''}`}
          style={{
            width: tableDim.width,
            height: tableDim.height,
            position: 'relative',
            borderRadius: 'min(200px, 48vw)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Opponents seated dynamically along the felt perimeter */}
          {opponents.map((player, idx) => (
            <div key={player.id} style={getOpponentSeatStyle(idx, opponents.length)}>
              <OpponentArea player={player} />
            </div>
          ))}

          {/* Center Table Play Surface */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 10 }}>
            {/* Side & Direction Indicator */}
            <GameInfo />

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Draw Pile */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  cursor: isMyTurn && isPlaying ? 'pointer' : 'default',
                  opacity: gameState.hasDrawnThisTurn && !gameState.pendingDrawStack?.active ? 0.75 : 1,
                }}
                onClick={handleDraw}
                title={
                  gameState.pendingDrawStack?.active
                    ? `Active Draw Stack! Take ${gameState.pendingDrawStack.totalCards} penalty cards and pass turn.`
                    : gameState.hasDrawnThisTurn
                    ? 'Card already drawn this turn! Play a matching card or press Pass.'
                    : 'Draw 1 card from the deck'
                }
              >
                <div
                  style={{
                    width: 'clamp(68px, 16vw, 86px)',
                    height: 'clamp(100px, 24vw, 126px)',
                    borderRadius: 16,
                    background:
                      activeSide === 'DARK'
                        ? 'linear-gradient(135deg, #181024 0%, #2e124d 100%)'
                        : 'linear-gradient(135deg, #0e1726 0%, #1e293b 100%)',
                    border: gameState.pendingDrawStack?.active
                      ? '2.5px solid #ef4444'
                      : `2px solid ${
                          activeSide === 'DARK' ? 'rgba(168,85,247,0.45)' : 'rgba(229,185,76,0.45)'
                        }`,
                    boxShadow: gameState.pendingDrawStack?.active
                      ? '0 0 32px rgba(239,68,68,0.85)'
                      : isMyTurn && isPlaying && !gameState.hasDrawnThisTurn
                      ? activeSide === 'DARK'
                        ? '0 0 28px rgba(168,85,247,0.6)'
                        : '0 0 28px rgba(229,185,76,0.5)'
                      : '0 8px 24px rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 4,
                    transition: 'all 0.2s ease',
                    transform: isMyTurn && isPlaying && (!gameState.hasDrawnThisTurn || gameState.pendingDrawStack?.active) ? 'scale(1.06)' : 'scale(1)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '1.6rem',
                      color: gameState.pendingDrawStack?.active ? '#ef4444' : activeSide === 'DARK' ? '#c084fc' : '#facc15',
                      opacity: 0.9,
                    }}
                  >
                    {gameState.pendingDrawStack?.active ? '⚡' : activeSide === 'DARK' ? '◈' : '✦'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: gameState.pendingDrawStack?.active ? '#fca5a5' : 'var(--text-secondary)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {deckCount} cards
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: gameState.pendingDrawStack?.active
                      ? '#ef4444'
                      : gameState.hasDrawnThisTurn
                      ? '#22c55e'
                      : 'var(--text-muted)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  {gameState.pendingDrawStack?.active
                    ? `TAKE +${gameState.pendingDrawStack.totalCards}`
                    : gameState.hasDrawnThisTurn
                    ? 'DRAWN ✓'
                    : 'DRAW'}
                </span>
              </div>

              {/* Discard Pile */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                {topCard ? (
                  <CardComponent
                    card={topCard}
                    activeSide={activeSide}
                    isDiscard={true}
                    size="lg"
                  />
                ) : (
                  <div
                    style={{
                      width: 80,
                      height: 118,
                      borderRadius: 16,
                      background: 'var(--bg-glass)',
                      border: '2px dashed var(--border-mid)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                    }}
                  >
                    Empty
                  </div>
                )}

                {/* Active Color Pip Indicator */}
                {currentColor && (
                  <div
                    style={{
                      width: 34,
                      height: 9,
                      borderRadius: 99,
                      background: COLOR_HEX[currentColor] || '#888',
                      boxShadow: `0 0 14px ${COLOR_HEX[currentColor] || '#888'}`,
                      border: '1px solid rgba(255,255,255,0.4)',
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  DISCARD
                </span>
              </div>
            </div>

            {/* Real-time Progressive Draw Attack Stack Banner */}
            {gameState.pendingDrawStack?.active && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 20px',
                  borderRadius: 99,
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.45), rgba(153,27,27,0.6))',
                  border: '2px solid rgba(248,113,113,0.9)',
                  boxShadow: '0 0 30px rgba(239,68,68,0.75)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  letterSpacing: '0.03em',
                  animation: 'pulseGoldRing 1.2s infinite',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>⚡</span>
                <span>
                  {isMyTurn
                    ? `DRAW ATTACK: +${gameState.pendingDrawStack.totalCards} CARDS PENDING! Counter with +${gameState.pendingDrawStack.currentLevel} or higher, or take penalty!`
                    : `DRAW STACK: +${gameState.pendingDrawStack.totalCards} PENDING (Min +${gameState.pendingDrawStack.currentLevel}) → ${players.find((p) => p.id === gameState.currentPlayerId)?.name ?? 'Player'}'s turn`}
                </span>
              </div>
            )}

            {/* Real-time Draw Stack Notification */}
            {gameState.lastActionNotification?.type === 'DRAW_STACK' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 16px',
                  borderRadius: 99,
                  background: 'linear-gradient(135deg, rgba(234,179,8,0.35), rgba(180,83,9,0.5))',
                  border: '1.5px solid rgba(250,204,21,0.8)',
                  boxShadow: '0 0 20px rgba(234,179,8,0.5)',
                  color: '#fef08a',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  animation: 'fadeIn 0.25s ease',
                }}
              >
                <span>🔥</span>
                <span>
                  {gameState.lastActionNotification.playedByName} stacked a Draw card! Total penalty now: +{gameState.lastActionNotification.drawCount}!
                </span>
              </div>
            )}

            {/* Real-time Penalty Draw Alert Banner (+1, +4, +5) */}
            {gameState.lastActionNotification?.type === 'PENALTY_DRAW' && gameState.lastActionNotification.drawCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 16px',
                  borderRadius: 99,
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.3), rgba(153,27,27,0.4))',
                  border: '1.5px solid rgba(248,113,113,0.7)',
                  boxShadow: '0 0 20px rgba(220,38,38,0.5)',
                  color: '#fee2e2',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  animation: 'fadeIn 0.25s ease',
                }}
              >
                <span>⚡</span>
                <span>
                  {gameState.lastActionNotification.playedByName} played +{gameState.lastActionNotification.drawCount}! {gameState.lastActionNotification.targetName} takes {gameState.lastActionNotification.drawCount} cards & is skipped!
                </span>
              </div>
            )}

            {/* Turn Announcement Banner */}
            {isPlaying && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: isMyTurn
                    ? gameState.hasDrawnThisTurn
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(234, 179, 8, 0.22))'
                      : 'rgba(229, 185, 76, 0.2)'
                    : 'rgba(16, 24, 38, 0.8)',
                  border: `1.5px solid ${
                    isMyTurn
                      ? gameState.hasDrawnThisTurn
                        ? 'rgba(16, 185, 129, 0.7)'
                        : 'rgba(229, 185, 76, 0.6)'
                      : 'var(--border-subtle)'
                  }`,
                  boxShadow: isMyTurn
                    ? gameState.hasDrawnThisTurn
                      ? '0 0 22px rgba(16, 185, 129, 0.45)'
                      : '0 0 20px rgba(229, 185, 76, 0.35)'
                    : 'none',
                  borderRadius: 99,
                  padding: '6px 18px',
                  animation: isMyTurn ? 'pulseGoldRing 1.5s infinite' : 'none',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isMyTurn
                      ? gameState.hasDrawnThisTurn
                        ? '#10b981'
                        : 'var(--gold-primary)'
                      : 'var(--text-muted)',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: isMyTurn ? 'var(--text-gold)' : 'var(--text-secondary)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {isOffline
                    ? `${players.find((p) => p.id === gameState.currentPlayerId)?.name ?? 'Player'}'S TURN ${
                        gameState.hasDrawnThisTurn ? '— DROP CARD OR PASS' : '(PASS & PLAY)'
                      }`
                    : isMyTurn
                    ? gameState.hasDrawnThisTurn
                      ? '💡 CARD DRAWN! DROP A CARD OR PRESS PASS'
                      : 'YOUR TURN — TAP A CARD OR DRAW'
                    : `${players.find((p) => p.id === gameState.currentPlayerId)?.name ?? '…'}'s Turn`}
                </span>
              </div>
            )}

            {/* Prominent Center Felt Pass Button (Instantly visible after drawing) */}
            {isMyTurn && isPlaying && gameState.hasDrawnThisTurn && (
              <button
                id="center-pass-btn"
                className="pass-btn active"
                onClick={handlePass}
                disabled={passLoading}
                style={{
                  padding: '9px 24px',
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 0 24px rgba(16, 185, 129, 0.75)',
                  animation: 'pulsePass 1.2s ease-in-out infinite',
                }}
                title="Pass your turn to the next player"
              >
                {passLoading ? 'Passing…' : '⏭ Pass Turn to Next Player'}
              </button>
            )}

            {/* Action Error Notification */}
            {actionError && (
              <div
                style={{
                  padding: '5px 14px',
                  borderRadius: 99,
                  background: 'rgba(220,38,38,0.25)',
                  border: '1px solid rgba(220,38,38,0.5)',
                  color: '#fca5a5',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                {actionError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── My Hand Area (Responsive Carousel on Mobile, Fan on Desktop) ── */}
      <div style={{ position: 'relative', zIndex: 15, width: '100%' }}>
        <PlayerHand onCardClick={handleCardClick} />
      </div>

      {/* ── Bottom Controls & Player Station ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '8px 16px 12px',
          zIndex: 20,
          position: 'relative',
          background: 'linear-gradient(180deg, transparent 0%, rgba(8, 11, 18, 0.85) 100%)',
        }}
      >
        {/* Left: My Player Station Pod */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          {/* Floating Reaction Bubble over myself */}
          {myReaction && (
            <div
              style={{
                position: 'absolute',
                top: -38,
                left: 20,
                background: '#ffffff',
                color: '#0f172a',
                padding: '5px 12px',
                borderRadius: 16,
                fontSize: myReaction.emoji ? '1.3rem' : '0.78rem',
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
              {myReaction.emoji && <span>{myReaction.emoji}</span>}
              {myReaction.text && <span>{myReaction.text}</span>}
            </div>
          )}

          {/* Avatar Ring */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              padding: 2.5,
              background: isMyTurn ? 'var(--gold-gradient)' : myFrameObj.border,
              boxShadow: isMyTurn ? '0 0 18px rgba(229, 185, 76, 0.8)' : `0 2px 8px rgba(0,0,0,0.5)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
            }}
            onClick={() => setShowProfileModal(true)}
            title="Click to view profile"
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#0a0e17',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}
            >
              {profile.avatar || '👑'}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                background: 'var(--gold-gradient)',
                color: '#1a1200',
                fontWeight: 900,
                fontSize: '0.52rem',
                padding: '1px 5px',
                borderRadius: 99,
              }}
            >
              {level}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {myInfo?.name || profile.username} (You)
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-gold)', fontWeight: 700 }}>
              {myInfo?.isFinished || myHand.length === 0
                ? `🎉 Cleared Hand! (${myInfo?.rank === 1 ? '🥇 1st' : myInfo?.rank === 2 ? '🥈 2nd' : myInfo?.rank === 3 ? '🥉 3rd' : `#${myInfo?.rank || 1}`} Place) • Spectating`
                : `${myHand.length} cards remaining`}
            </span>
          </div>
        </div>

        {/* Center / Right: Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {myInfo?.isFinished || myHand.length === 0 ? (
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 900,
                color: '#fef08a',
                background: 'linear-gradient(135deg, rgba(229,185,76,0.25), rgba(202,138,4,0.35))',
                border: '1.5px solid #facc15',
                borderRadius: 99,
                padding: '6px 16px',
                boxShadow: '0 0 16px rgba(234, 179, 8, 0.35)',
              }}
            >
              🏁 Finished! Watching remaining battle…
            </div>
          ) : (
            <>
              {/* UNO Button */}
              <UnoButton onPress={handleUnoPress} />

              {/* Caught Challenge Button */}
              <CaughtButton onCaught={handleCaught} />

              {/* Quick Draw Card Button */}
              <button
                className={`draw-action-btn ${gameState.hasDrawnThisTurn ? 'drawn' : ''}`}
                id="draw-btn"
                onClick={handleDraw}
                disabled={drawLoading || !isMyTurn || !isPlaying}
                style={{
                  padding: '10px 18px',
                  fontSize: '0.9rem',
                  opacity: !isMyTurn || !isPlaying ? 0.4 : gameState.hasDrawnThisTurn && !gameState.pendingDrawStack?.active ? 0.65 : 1,
                  cursor: !isMyTurn || !isPlaying ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  ...(gameState.pendingDrawStack?.active && isMyTurn ? {
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    border: '1.5px solid #f87171',
                    boxShadow: '0 0 24px rgba(239, 68, 68, 0.8)',
                    animation: 'pulseAttack 1.2s infinite alternate',
                  } : {}),
                }}
                title={
                  !isMyTurn
                    ? 'Wait for your turn'
                    : gameState.pendingDrawStack?.active
                    ? `Active Draw Stack! Take ${gameState.pendingDrawStack.totalCards} penalty cards and pass turn.`
                    : gameState.hasDrawnThisTurn
                    ? 'You have already drawn a card this turn! Drop a card or pass.'
                    : 'Draw 1 card from the bundle'
                }
              >
                {drawLoading
                  ? 'Drawing…'
                  : gameState.pendingDrawStack?.active && isMyTurn
                  ? `📥 Take Penalty (+${gameState.pendingDrawStack.totalCards} Cards)`
                  : gameState.hasDrawnThisTurn
                  ? '✓ Drawn'
                  : '📤 Draw'}
              </button>

              {/* Pass Turn Button (Always visible in action bar) */}
              <PassButton
                onPass={handlePass}
                onCannotPass={(err) => setActionError(err)}
                loading={passLoading}
              />
            </>
          )}
        </div>
      </div>

      {/* Color Selection Modal (For Wild cards) */}
      {showColorPicker && (
        <ColorPicker
          onSelect={handleColorChosen}
          onCancel={() => {
            closeColorPicker();
            setSelectedCardId(null);
          }}
        />
      )}

      {/* Modals: Profile, Leaderboard, Rules */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />

      {/* Screen-wide Cinematic Sound & Animation Overlays for UNO & Caught */}
      <TableEventOverlays />
    </div>
  );
}
