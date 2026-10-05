/**
 * Landing Screen — Studio-grade game entry with luxury felt atmosphere.
 * Handles room creation, joining, persistent player identity, sound controls,
 * and Supabase / PostgreSQL leaderboard access.
 */

import React, { useState } from 'react';
import useGameStore from '../../store/gameStore';
import sound from '../../utils/audio';
import LeaderboardModal from '../ui/LeaderboardModal';

export default function LandingScreen() {
  const {
    socket,
    connected,
    myUserId,
    myName,
    soundEnabled,
    toggleSound,
    showLeaderboard,
    setShowLeaderboard,
    setScreen,
    setMyName,
    setMyPlayerId,
    setLobbyState,
  } = useGameStore();

  const [name, setName]         = useState(myName || '');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab]           = useState('create'); // 'create' | 'join'
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleCreate() {
    if (!name.trim()) return setError('Please enter your player name');
    setError('');
    setLoading(true);
    setMyName(name.trim());
    sound.buttonClick();

    socket.emit('createRoom', { playerName: name.trim(), config: {}, userId: myUserId }, (res) => {
      setLoading(false);
      if (!res.ok) return setError(res.error || 'Failed to create room');
      setMyPlayerId(res.playerId);
      setLobbyState(res.lobby);
      setScreen('LOBBY');
    });
  }

  async function handleJoin() {
    if (!name.trim())     return setError('Please enter your player name');
    if (!joinCode.trim()) return setError('Please enter the 6-letter room code');
    setError('');
    setLoading(true);
    setMyName(name.trim());
    sound.buttonClick();

    socket.emit('joinRoom', { roomId: joinCode.trim().toUpperCase(), playerName: name.trim(), userId: myUserId }, (res) => {
      setLoading(false);
      if (!res.ok) return setError(res.error || 'Failed to join room');
      setMyPlayerId(res.playerId);
      setLobbyState(res.lobby);
      setScreen('LOBBY');
    });
  }

  return (
    <div className="game-table flex-col items-center justify-center" style={{ height: '100vh', position: 'relative' }}>
      {/* Top Navigation Bar: Sound & Leaderboard */}
      <div style={{
        position: 'absolute',
        top: 24,
        right: 24,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { sound.buttonClick(); setShowLeaderboard(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 'var(--radius-lg)' }}
        >
          <span>🏆</span>
          <span>Leaderboard & Stats</span>
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => toggleSound()}
          title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-lg)' }}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      {/* Atmospheric Table Ambience */}
      <div className="landing-bg">
        <div className="landing-orb" style={{ width: 650, height: 650, top: '-25%', left: '-15%', background: '#1657C7', opacity: 0.12 }} />
        <div className="landing-orb" style={{ width: 500, height: 500, bottom: '-20%', right: '-10%', background: '#D92525', opacity: 0.10 }} />
        <div className="landing-orb" style={{ width: 450, height: 450, top: '45%', right: '15%', background: '#EAB308', opacity: 0.08 }} />
      </div>

      {/* Hero Header */}
      <div className="anim-fade-in-up" style={{ textAlign: 'center', position: 'relative', zIndex: 2, marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderRadius: 99,
          background: 'rgba(229, 185, 76, 0.1)',
          border: '1px solid rgba(229, 185, 76, 0.3)',
          color: 'var(--text-gold)',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          <span>🎴</span> Authoritative Digital Card Studio
        </div>

        <h1 style={{
          fontSize: 'clamp(3.2rem, 8vw, 5.5rem)',
          background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 40%, #e5b94c 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.05,
          marginBottom: 8,
        }}>
          UNO FLIP
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 460, margin: '0 auto' }}>
          Real-time dual-sided card play. Authoritative mechanics, tactical counter-calls, and persistent statistics.
        </p>

        {!connected && (
          <div style={{
            marginTop: 16,
            padding: '7px 18px',
            borderRadius: 99,
            background: 'rgba(220, 38, 38, 0.12)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: '#f87171',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'inline-block',
          }}>
            ⚡ Connecting to authoritative server…
          </div>
        )}
      </div>

      {/* Main Glass Panel */}
      <div
        className="glass-strong anim-fade-in-up"
        style={{
          borderRadius: 'var(--radius-2xl)',
          padding: '30px',
          width: 'min(440px, 92vw)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { id: 'create', label: '➕ Create Room' },
            { id: 'join',   label: '🔗 Join Room' },
          ].map(t => (
            <button
              key={t.id}
              className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, padding: '10px 14px' }}
              onClick={() => { sound.buttonClick(); setTab(t.id); setError(''); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Player Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Player Identity
          </label>
          <input
            className="input"
            placeholder="Enter player name…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
            maxLength={20}
          />
        </div>

        {/* Join Code (Conditional) */}
        {tab === 'join' && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              6-Digit Room Code
            </label>
            <input
              className="input"
              placeholder="e.g. 7X3K9M"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={6}
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                fontWeight: 800,
                fontSize: '1.15rem',
                textAlign: 'center',
              }}
            />
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(220, 38, 38, 0.15)',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: 16,
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          className="btn btn-gold btn-lg w-full"
          onClick={tab === 'create' ? handleCreate : handleJoin}
          disabled={!connected || loading}
        >
          {loading ? 'Processing…' : tab === 'create' ? 'Host New Match' : 'Enter Match Room'}
        </button>
      </div>

      {/* Footer Details */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        marginTop: 28,
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <span>Classic & Two-Side FLIP</span>
        <span>•</span>
        <span>4 & 5 Color Palettes</span>
        <span>•</span>
        <span>Authoritative Verification</span>
      </div>

      {/* Persistent Leaderboard Modal */}
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  );
}
