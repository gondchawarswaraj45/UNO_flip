/**
 * ArcadeHeader — studio-grade top navigation and player HUD.
 *
 * Displays:
 *  - Player Profile Chip (Avatar, Frame, Username, Level, Coins) -> clicks to open ProfileModal.
 *  - Room Code Pill with 1-click copy.
 *  - Mode Pill (Classic vs Two-Side FLIP).
 *  - Leaderboard modal trigger 🏆.
 *  - Quick Chat & Reaction trigger 💬 (in match).
 *  - Audio mute/unmute toggle 🔊.
 */

import React from 'react';
import useGameStore from '../../store/gameStore';
import sound from '../../utils/audio';
import { toast } from 'react-hot-toast';
import { FRAME_STYLES } from './ProfileModal';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export default function ArcadeHeader({ showRoomCode = false, showChat = false }) {
  const {
    profile,
    roomId,
    gameState,
    lobbyState,
    soundEnabled,
    toggleSound,
    memesEnabled,
    toggleMemes,
    authUser,
    logout,
    setShowLeaderboard,
    setShowProfileModal,
    setShowRulesModal,
    showQuickChat,
    setShowQuickChat,
  } = useGameStore();

  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();

  const currentFrameObj = FRAME_STYLES.find(f => f.id === profile.frame) || FRAME_STYLES[0];
  const level = Math.max(1, Math.floor((profile.xp || 0) / 150) + 1);

  const activeRoomCode = roomId || lobbyState?.roomId || gameState?.roomId;
  const gameMode = gameState?.config?.mode || gameState?.gameMode || lobbyState?.config?.mode || 'CLASSIC';
  const colorMode = gameState?.config?.colorMode || gameState?.colorMode || lobbyState?.config?.colorMode || 'FOUR';

  function handleCopyRoom() {
    if (!activeRoomCode) return;
    sound.buttonClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activeRoomCode);
      toast.success(`Room Code ${activeRoomCode} copied!`);
    }
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        position: 'relative',
        zIndex: 50,
      }}
    >
      {/* ── Left: Player Profile Pill ── */}
      <div
        onClick={() => {
          sound.buttonClick();
          setShowProfileModal(true);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(16, 24, 38, 0.85)',
          border: '1px solid var(--border-mid)',
          borderRadius: 99,
          padding: '4px 12px 4px 5px',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
          transition: 'all 0.2s ease',
        }}
        title="View & Edit Profile"
      >
        {/* Avatar Ring */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: currentFrameObj.border,
            boxShadow: `0 0 10px ${currentFrameObj.glow}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
            position: 'relative',
            flexShrink: 0,
          }}
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
              bottom: -3,
              right: -3,
              background: 'var(--gold-gradient)',
              color: '#1a1200',
              fontWeight: 900,
              fontSize: '0.55rem',
              padding: '1px 5px',
              borderRadius: 99,
              letterSpacing: '0.04em',
            }}
          >
            {level}
          </div>
        </div>

        {/* Username & Coins */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              maxWidth: 110,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {profile.username || 'Player'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-gold)', fontWeight: 700 }}>
            <span>🪙 {profile.coins || 500}</span>
          </div>
        </div>
      </div>

      {/* ── Center: Room Info (if inside lobby/game) ── */}
      {showRoomCode && activeRoomCode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            onClick={handleCopyRoom}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(229, 185, 76, 0.12)',
              border: '1px solid rgba(229, 185, 76, 0.35)',
              borderRadius: 99,
              padding: '5px 14px',
              cursor: 'pointer',
              color: 'var(--text-gold)',
              fontSize: '0.82rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              boxShadow: '0 0 12px rgba(229, 185, 76, 0.2)',
            }}
            title="Click to copy room code"
          >
            <span>ROOM:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{activeRoomCode}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>📋</span>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 99,
              padding: '5px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              display: 'none', // hide on very small mobile screens
            }}
            className="md-inline-flex"
          >
            {(gameMode === 'TWO_SIDE' || gameMode === 'FLIP') ? 'Two-Side FLIP' : 'Classic'} • {colorMode === 'FIVE' ? '5 Colors' : '4 Colors'}
          </div>
        </div>
      )}

      {/* ── Right: Utilities (Install, Memes, Leaderboard, Chat, Sound) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* PWA Install Button (renders when browser emits beforeinstallprompt) */}
        {isInstallable && (
          <button
            className="btn btn-gold btn-sm"
            onClick={() => {
              sound.buttonClick();
              promptInstall();
            }}
            title="Install UNO Flip App on your device for instant offline play!"
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 0 16px rgba(229, 185, 76, 0.45)',
            }}
          >
            <span>📲</span>
            <span style={{ fontSize: '0.8rem' }} className="sm-inline">Install App</span>
          </button>
        )}

        {/* Memes & Funny Sounds Toggle */}
        <button
          className={`btn ${memesEnabled ? 'btn-ghost' : 'btn-ghost'} btn-sm`}
          onClick={() => {
            sound.buttonClick();
            toggleMemes();
            const willBe = !memesEnabled;
            toast(willBe ? '🎭 Memes & Funny Sounds ON!' : '🔇 Memes & Funny Sounds OFF', {
              icon: willBe ? '🎭' : '🔇',
              duration: 2500,
            });
          }}
          title={memesEnabled ? 'Memes & Funny Sounds: ON (Tap to mute)' : 'Memes & Funny Sounds: OFF (Tap to activate)'}
          style={{
            padding: '6px 10px',
            borderRadius: 'var(--radius-lg)',
            border: memesEnabled ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
            background: memesEnabled ? 'rgba(244, 63, 94, 0.12)' : 'transparent',
          }}
        >
          <span style={{ fontSize: '1rem' }}>{memesEnabled ? '🎭' : '😶'}</span>
        </button>

        {showChat && (
          <button
            className={`btn ${showQuickChat ? 'btn-gold' : 'btn-ghost'} btn-sm`}
            onClick={() => {
              sound.buttonClick();
              setShowQuickChat(!showQuickChat);
            }}
            title="Quick Chat & Emojis"
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-lg)' }}
          >
            <span>💬</span>
            <span style={{ fontSize: '0.8rem', display: 'none' }} className="sm-inline">Chat</span>
          </button>
        )}

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            sound.buttonClick();
            setShowRulesModal(true);
          }}
          title="Game Rules & Action Card Guide"
          style={{ padding: '6px 12px', borderRadius: 'var(--radius-lg)' }}
        >
          <span>📖</span>
          <span style={{ fontSize: '0.8rem', display: 'none' }} className="sm-inline">Rules</span>
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            sound.buttonClick();
            setShowLeaderboard(true);
          }}
          title="Global Leaderboard & Match History"
          style={{ padding: '6px 12px', borderRadius: 'var(--radius-lg)' }}
        >
          <span>🏆</span>
          <span style={{ fontSize: '0.8rem', display: 'none' }} className="sm-inline">Rankings</span>
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => toggleSound()}
          title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          style={{ padding: '6px 10px', borderRadius: 'var(--radius-lg)' }}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        {authUser && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              sound.buttonClick();
              logout();
              toast('Signed out from Google account', { icon: '👋' });
            }}
            title={`Sign Out (${authUser.email || ''})`}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-lg)',
              color: '#f87171',
              border: '1px solid rgba(248, 113, 113, 0.25)',
              background: 'rgba(248, 113, 113, 0.08)',
            }}
          >
            <span>🚪</span>
            <span style={{ fontSize: '0.78rem', display: 'none' }} className="sm-inline">Logout</span>
          </button>
        )}
      </div>
    </div>
  );
}
