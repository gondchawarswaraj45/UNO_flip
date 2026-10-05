/**
 * Landing Screen — Studio-grade game entry with luxury felt atmosphere.
 * Features:
 *  - 🤖 Play with Computer (Instant Solo Bot Match with custom mode, bot count & difficulty)
 *  - ⚡ Play Online / Quick Match (Instant matchmaking with random online players)
 *  - ➕ Create Private Room (with custom 6-digit code for friends)
 *  - 🔗 Join Room (enter existing room code)
 *  - 📜 Comprehensive Rules & How-to-Play Guide
 *  - 🎨 Profile Customizer and Permanent Supabase Database Stats
 */

import React, { useState, useEffect } from 'react';
import useGameStore from '../../store/gameStore';
import sound from '../../utils/audio';
import ArcadeHeader from '../ui/ArcadeHeader';
import LeaderboardModal from '../ui/LeaderboardModal';
import ProfileModal from '../ui/ProfileModal';
import RulesModal from '../ui/RulesModal';

export default function LandingScreen() {
  const {
    socket,
    connected,
    myUserId,
    myName,
    profile,
    showLeaderboard,
    setShowLeaderboard,
    showProfileModal,
    setShowProfileModal,
    showRulesModal,
    setShowRulesModal,
    setScreen,
    setMyName,
    setMyPlayerId,
    setLobbyState,
  } = useGameStore();

  const [name, setName]         = useState(myName || profile.username || 'Player');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab]           = useState('solo'); // 'solo' | 'quick' | 'create' | 'join'
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Solo Match Configurations
  const [soloMode, setSoloMode]         = useState('TWO_SIDE'); // 'CLASSIC' | 'TWO_SIDE'
  const [soloColorMode, setSoloColor]   = useState('FOUR');     // 'FOUR' | 'FIVE'
  const [soloBots, setSoloBots]         = useState(3);          // 1 (1v1) | 2 (3-player) | 3 (4-player)
  const [soloDiff, setSoloDiff]         = useState('MEDIUM');   // 'EASY' | 'MEDIUM' | 'HARD'

  // Quick Match Configuration
  const [quickMode, setQuickMode]       = useState('TWO_SIDE');
  const [quickColor, setQuickColor]     = useState('FOUR');

  useEffect(() => {
    if (profile.username && profile.username !== name) {
      setName(profile.username);
    }
  }, [profile.username]);

  // ─── 1. Play with Computer (Instant Solo Mode) ──────────────────────────────
  async function handleStartSolo() {
    if (!name.trim()) return setError('Please enter your player name');
    setError('');
    setLoading(true);
    setMyName(name.trim());
    sound.buttonClick();

    socket.emit(
      'startSoloGame',
      {
        playerName: name.trim(),
        config: { mode: soloMode, colorMode: soloColorMode },
        botCount: soloBots,
        difficulty: soloDiff,
        userId: myUserId,
      },
      (res) => {
        setLoading(false);
        if (!res.ok) return setError(res.error || 'Failed to start solo match');
        setMyPlayerId(res.playerId);
        setLobbyState(res.lobby);
        setScreen('GAME');
      }
    );
  }

  // ─── 2. Play Online / Quick Match (Randoms) ─────────────────────────────────
  async function handleQuickMatch() {
    if (!name.trim()) return setError('Please enter your player name');
    setError('');
    setLoading(true);
    setMyName(name.trim());
    sound.buttonClick();

    socket.emit(
      'quickMatch',
      {
        playerName: name.trim(),
        config: { mode: quickMode, colorMode: quickColor },
        userId: myUserId,
      },
      (res) => {
        setLoading(false);
        if (!res.ok) return setError(res.error || 'Failed to join quick match');
        setMyPlayerId(res.playerId);
        setLobbyState(res.lobby);
        if (res.started) {
          setScreen('GAME');
        } else {
          setScreen('LOBBY');
        }
      }
    );
  }

  // ─── 3. Create Private Room ─────────────────────────────────────────────────
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

  // ─── 4. Join Room by Code ───────────────────────────────────────────────────
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
    <div
      className="game-table"
      style={{
        height: '100dvh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflowY: 'auto',
      }}
    >
      {/* Top Arcade HUD */}
      <ArcadeHeader showRoomCode={false} />

      {/* Atmospheric Table Ambience */}
      <div className="landing-bg">
        <div className="landing-orb" style={{ width: 650, height: 650, top: '-25%', left: '-15%', background: '#1657C7', opacity: 0.12 }} />
        <div className="landing-orb" style={{ width: 500, height: 500, bottom: '-20%', right: '-10%', background: '#D92525', opacity: 0.10 }} />
        <div className="landing-orb" style={{ width: 450, height: 450, top: '45%', right: '15%', background: '#EAB308', opacity: 0.08 }} />
      </div>

      {/* Center Main Panel Container */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '12px 16px' }}>
        {/* Hero Header */}
        <div className="anim-fade-in-up" style={{ textAlign: 'center', position: 'relative', zIndex: 2, marginBottom: 16 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 14px',
            borderRadius: 99,
            background: 'rgba(229, 185, 76, 0.1)',
            border: '1px solid rgba(229, 185, 76, 0.3)',
            color: 'var(--text-gold)',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            <span>🎴</span> Authoritative Digital Card Studio
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 4.4rem)',
            background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 40%, #e5b94c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.05,
            marginBottom: 4,
          }}>
            UNO FLIP
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: 440, margin: '0 auto' }}>
            Dual-sided gameplay. Fast-action counter-calls, solo practice with AI, and online multiplayer.
          </p>

          {!connected && (
            <div style={{
              marginTop: 10,
              padding: '5px 14px',
              borderRadius: 99,
              background: 'rgba(220, 38, 38, 0.12)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#f87171',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-block',
            }}>
              ⚡ Connecting to game server…
            </div>
          )}
        </div>

        {/* Main Glass Staging Card */}
        <div
          className="glass-strong anim-fade-in-up"
          style={{
            borderRadius: 'var(--radius-2xl)',
            padding: '20px 22px',
            width: 'min(460px, 95vw)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* 4 Mode Selection Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
            {[
              { id: 'solo',   label: '🤖 Solo Bot', desc: 'vs AI' },
              { id: 'quick',  label: '⚡ Online',   desc: 'Match' },
              { id: 'create', label: '➕ Host',     desc: 'Private' },
              { id: 'join',   label: '🔗 Join',     desc: 'Code' },
            ].map(t => (
              <button
                key={t.id}
                className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  padding: '7px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  borderRadius: 'var(--radius-md)',
                  border: tab === t.id ? '1.5px solid rgba(229,185,76,0.6)' : '1px solid var(--border-subtle)',
                }}
                onClick={() => { sound.buttonClick(); setTab(t.id); setError(''); }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{t.label}</span>
                <span style={{ fontSize: '0.65rem', color: tab === t.id ? '#fde047' : 'var(--text-muted)' }}>{t.desc}</span>
              </button>
            ))}
          </div>

          {/* Player Name Input Field */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Player Identity
              </label>
              <button
                onClick={() => setShowProfileModal(true)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-gold)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Customize Avatar 🎨
              </button>
            </div>
            <input
              className="input"
              placeholder="Enter player name…"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={18}
              style={{ padding: '10px 14px', fontSize: '0.92rem' }}
            />
          </div>

          {/* ── TAB 1: SOLO PLAY WITH COMPUTER ── */}
          {tab === 'solo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {/* Game Mode Toggle */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  GAME MODE
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'TWO_SIDE', label: '🔄 Two-Side FLIP' },
                    { id: 'CLASSIC',  label: '🃏 Classic UNO' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => { sound.buttonClick(); setSoloMode(m.id); }}
                      style={{
                        flex: 1,
                        padding: '7px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: soloMode === m.id ? 'rgba(229,185,76,0.18)' : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${soloMode === m.id ? 'var(--gold-primary)' : 'var(--border-subtle)'}`,
                        color: soloMode === m.id ? 'var(--text-gold)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Mode & Bot Count Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {/* Colors */}
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                    COLOR PALETTE
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { id: 'FOUR', label: '4 Colors' },
                      { id: 'FIVE', label: '5 Colors' },
                    ].map(c => (
                      <button
                        key={c.id}
                        onClick={() => { sound.buttonClick(); setSoloColor(c.id); }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: soloColorMode === c.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${soloColorMode === c.id ? '#60a5fa' : 'var(--border-subtle)'}`,
                          color: soloColorMode === c.id ? '#93c5fd' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of Computer Opponents */}
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                    AI OPPONENTS
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { count: 1, label: '1v1' },
                      { count: 2, label: '3-P' },
                      { count: 3, label: '4-P' },
                    ].map(b => (
                      <button
                        key={b.count}
                        onClick={() => { sound.buttonClick(); setSoloBots(b.count); }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: soloBots === b.count ? 'rgba(229,185,76,0.18)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${soloBots === b.count ? 'var(--gold-primary)' : 'var(--border-subtle)'}`,
                          color: soloBots === b.count ? 'var(--text-gold)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: PLAY ONLINE / QUICK MATCH ── */}
          {tab === 'quick' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <span style={{ fontSize: '0.82rem', color: '#93c5fd', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                  ⚡ Instant Online Matchmaking
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Jump into an active match with other players worldwide. If none are open, a public match is created immediately.
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  DESIRED GAME MODE
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'TWO_SIDE', label: '🔄 Two-Side FLIP' },
                    { id: 'CLASSIC',  label: '🃏 Classic UNO' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => { sound.buttonClick(); setQuickMode(m.id); }}
                      style={{
                        flex: 1,
                        padding: '7px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: quickMode === m.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${quickMode === m.id ? '#60a5fa' : 'var(--border-subtle)'}`,
                        color: quickMode === m.id ? '#93c5fd' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: CREATE PRIVATE ROOM ── */}
          {tab === 'create' && (
            <div style={{ marginBottom: 16, background: 'rgba(229,185,76,0.08)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(229,185,76,0.25)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-gold)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                🔒 Host Private Room
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Generates a unique 6-digit code. Configure custom house rules, add AI bots, and invite friends.
              </span>
            </div>
          )}

          {/* ── TAB 4: JOIN ROOM BY CODE ── */}
          {tab === 'join' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                6-Digit Invitation Code
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
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(220, 38, 38, 0.15)',
              border: '1px solid rgba(220, 38, 38, 0.35)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              marginBottom: 12,
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Primary Action Button */}
          <button
            className="btn btn-gold btn-lg w-full"
            onClick={
              tab === 'solo'   ? handleStartSolo :
              tab === 'quick'  ? handleQuickMatch :
              tab === 'create' ? handleCreate :
              handleJoin
            }
            disabled={!connected || loading}
          >
            {loading ? 'Connecting…' :
             tab === 'solo'   ? `Play with Computer (${soloBots} Bots) 🤖` :
             tab === 'quick'  ? 'Find Online Match ⚡' :
             tab === 'create' ? 'Host Private Room 🔒' :
             'Enter Match Room 🔗'}
          </button>
        </div>

        {/* Quick Rules & How to Play Button */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { sound.buttonClick(); setShowRulesModal(true); }}
          style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, zIndex: 2 }}
        >
          <span>📜</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-gold)' }}>
            How to Play & Official Rules Guide
          </span>
        </button>
      </div>

      {/* Footer Info */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: '8px 16px',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <span>Classic & Two-Side FLIP</span>
        <span>•</span>
        <span>4 & 5 Color Palettes</span>
        <span>•</span>
        <span>Authoritative Verification</span>
      </div>

      {/* Modals: Leaderboard, Profile, Rules */}
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
    </div>
  );
}
