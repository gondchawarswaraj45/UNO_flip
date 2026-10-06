/**
 * Landing Screen — Studio-grade game hub with luxury felt atmosphere.
 *
 * 4 Dedicated Game Modes:
 *  1. 🌐 Play Online — Quick matchmaking with players worldwide
 *  2. 👥 Play with Friends Online — Host private lobby or join with 6-digit room code
 *  3. 🛋️ Play with Friends Offline — Pass & Play local multiplayer on this device (2 to 6 players)
 *  4. 🤖 Play with Computers — Solo match with intelligent AI bots (2 to 6 players, custom difficulty)
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
    setIsOfflineMode,
  } = useGameStore();

  const [name, setName]         = useState(myName || profile.username || 'Player');
  const [selectedMode, setSelectedMode] = useState(null); // null = Page 1 (select mode); 'online' | 'friends_online' | 'friends_offline' | 'computer' = Page 2 (configure)
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Mode 1: Play Online ───────────────────────────────────────────────────
  const [onlineVariant, setOnlineVariant] = useState('TWO_SIDE'); // 'TWO_SIDE' | 'CLASSIC'
  const [onlineColor, setOnlineColor]     = useState('FOUR');     // 'FOUR' | 'FIVE'

  // ── Mode 2: Play with Friends Online ──────────────────────────────────────
  const [friendsOnlineTab, setFriendsOnlineTab] = useState('host'); // 'host' | 'join'
  const [friendVariant, setFriendVariant]       = useState('TWO_SIDE');
  const [friendColor, setFriendColor]           = useState('FOUR');
  const [friendMaxPlayers, setFriendMaxPlayers] = useState(4);
  const [joinCode, setJoinCode]                 = useState('');

  // ── Mode 3: Play with Friends Offline (Pass & Play) ───────────────────────
  const [offlineCount, setOfflineCount]     = useState(3); // 2 to 6
  const [offlineNames, setOfflineNames]     = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6']);
  const [offlineVariant, setOfflineVariant] = useState('TWO_SIDE');
  const [offlineColor, setOfflineColor]     = useState('FOUR');

  // ── Mode 4: Play with Computers ───────────────────────────────────────────
  const [computerTotal, setComputerTotal]   = useState(4); // 2 to 6 total players (1 to 5 bots)
  const [computerDiff, setComputerDiff]     = useState('MEDIUM'); // 'EASY' | 'MEDIUM' | 'HARD'
  const [computerVariant, setComputerVariant] = useState('TWO_SIDE');
  const [computerColor, setComputerColor]   = useState('FOUR');

  useEffect(() => {
    if (profile.username && profile.username !== name) {
      setName(profile.username);
    }
  }, [profile.username]);

  // Keep first offline player name in sync with main name
  useEffect(() => {
    setOfflineNames(prev => {
      const copy = [...prev];
      copy[0] = name || 'Player 1';
      return copy;
    });
  }, [name]);

  function handleOfflineNameChange(index, newName) {
    setOfflineNames(prev => {
      const copy = [...prev];
      copy[index] = newName;
      return copy;
    });
  }

  // ── Action 1: Play Online (Quick Match) ───────────────────────────────────
  async function handlePlayOnline() {
    if (!name.trim()) return setError('Please enter your player name');
    setError('');
    setLoading(true);
    setMyName(name.trim());
    setIsOfflineMode(false);
    sound.buttonClick();

    socket.emit(
      'quickMatch',
      {
        playerName: name.trim(),
        config: { mode: onlineVariant, colorMode: onlineColor },
        userId: myUserId,
      },
      (res) => {
        setLoading(false);
        if (!res.ok) return setError(res.error || 'Failed to join online match');
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

  // ── Action 2A: Host Private Online Room ───────────────────────────────────
  async function handleHostRoom() {
    if (!name.trim()) return setError('Please enter your player name');
    setError('');
    setLoading(true);
    setMyName(name.trim());
    setIsOfflineMode(false);
    sound.buttonClick();

    socket.emit(
      'createRoom',
      {
        playerName: name.trim(),
        config: { mode: friendVariant, colorMode: friendColor, maxPlayers: friendMaxPlayers },
        userId: myUserId,
      },
      (res) => {
        setLoading(false);
        if (!res.ok) return setError(res.error || 'Failed to create room');
        setMyPlayerId(res.playerId);
        setLobbyState(res.lobby);
        setScreen('LOBBY');
      }
    );
  }

  // ── Action 2B: Join Private Online Room ───────────────────────────────────
  async function handleJoinRoom() {
    if (!name.trim())     return setError('Please enter your player name');
    if (!joinCode.trim()) return setError('Please enter the 6-letter room code');
    setError('');
    setLoading(true);
    setMyName(name.trim());
    setIsOfflineMode(false);
    sound.buttonClick();

    socket.emit(
      'joinRoom',
      { roomId: joinCode.trim().toUpperCase(), playerName: name.trim(), userId: myUserId },
      (res) => {
        setLoading(false);
        if (!res.ok) return setError(res.error || 'Failed to join room');
        setMyPlayerId(res.playerId);
        setLobbyState(res.lobby);
        setScreen('LOBBY');
      }
    );
  }

  // ── Action 3: Play with Friends Offline (Pass & Play) ─────────────────────
  async function handlePlayOffline() {
    if (!name.trim()) return setError('Please enter your player name');
    setError('');
    setLoading(true);
    setMyName(name.trim());
    sound.buttonClick();

    const activeNames = offlineNames.slice(0, offlineCount).map((n, i) => n.trim() || `Player ${i + 1}`);

    socket.emit(
      'startOfflineGame',
      {
        playerNames: activeNames,
        config: { mode: offlineVariant, colorMode: offlineColor },
        userId: myUserId,
      },
      (res) => {
        setLoading(false);
        if (!res.ok) return setError(res.error || 'Failed to start offline match');
        setIsOfflineMode(true);
        setMyPlayerId(res.playerId);
        setLobbyState(res.lobby);
        setScreen('GAME');
      }
    );
  }

  // ── Action 4: Play with Computers (AI Bots) ───────────────────────────────
  async function handlePlayComputer() {
    if (!name.trim()) return setError('Please enter your player name');
    setError('');
    setLoading(true);
    setMyName(name.trim());
    setIsOfflineMode(false);
    sound.buttonClick();

    const botCount = Math.max(1, computerTotal - 1);

    socket.emit(
      'startSoloGame',
      {
        playerName: name.trim(),
        config: { mode: computerVariant, colorMode: computerColor },
        botCount,
        difficulty: computerDiff,
        userId: myUserId,
      },
      (res) => {
        setLoading(false);
        if (!res.ok) return setError(res.error || 'Failed to start computer match');
        setMyPlayerId(res.playerId);
        setLobbyState(res.lobby);
        setScreen('GAME');
      }
    );
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

      {/* Center Main Container */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '16px 18px', zIndex: 2 }}>
        
        {/* Title Header */}
        <div className="anim-fade-in-up" style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 14px',
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
            <span>🎴</span> Digital Card Arena
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 40%, #e5b94c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.05,
            marginBottom: 4,
          }}>
            UNO FLIP
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: 480, margin: '0 auto' }}>
            Dual-sided deck. Authentic rules, real-time counters, online multiplayer, and local pass & play.
          </p>

          {!connected && (
            <div style={{
              marginTop: 10,
              padding: '4px 14px',
              borderRadius: 99,
              background: 'rgba(220, 38, 38, 0.15)',
              border: '1px solid rgba(220, 38, 38, 0.35)',
              color: '#f87171',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-block',
            }}>
              ⚡ Connecting to game server…
            </div>
          )}
        </div>

        {/* Main Hub Box */}
        <div
          className="glass-strong anim-fade-in-up"
          style={{
            borderRadius: 'var(--radius-2xl)',
            padding: '20px 22px',
            width: 'min(580px, 96vw)',
            position: 'relative',
          }}
        >
          {!selectedMode ? (
            /* ═══════════════════════════════════════════════════════════════════
               STEP 1: CHOOSE GAME MODE ONLY
               ═══════════════════════════════════════════════════════════════════ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 2 }}>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-gold)',
                  background: 'rgba(229, 185, 76, 0.1)',
                  padding: '3px 12px',
                  borderRadius: 99,
                  border: '1px solid rgba(229, 185, 76, 0.25)',
                  display: 'inline-block',
                  marginBottom: 6,
                }}>
                  Step 1 of 2: Mode Selection
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Select Game Mode
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Choose how you want to play to proceed to setup:
                </p>
              </div>

              {/* 4 Dedicated Game Modes Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
              }}>
                {/* Mode 1: Play Online */}
                <div
                  className="mode-card"
                  onClick={() => { sound.buttonClick(); setSelectedMode('online'); setError(''); }}
                  style={{
                    padding: '16px 14px',
                    background: 'linear-gradient(145deg, rgba(14, 116, 144, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%)',
                    borderColor: 'rgba(56, 189, 248, 0.35)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.6rem' }}>🌐</span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: '#0284c7',
                      color: '#ffffff',
                    }}>
                      ONLINE
                    </span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>
                    Play Online
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    Quick random match with players worldwide
                  </span>
                  <div style={{
                    marginTop: 4,
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    Select Mode →
                  </div>
                </div>

                {/* Mode 2: Play with Friends Online */}
                <div
                  className="mode-card"
                  onClick={() => { sound.buttonClick(); setSelectedMode('friends_online'); setError(''); }}
                  style={{
                    padding: '16px 14px',
                    background: 'linear-gradient(145deg, rgba(21, 128, 61, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%)',
                    borderColor: 'rgba(74, 222, 128, 0.35)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.6rem' }}>👥</span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: '#16a34a',
                      color: '#ffffff',
                    }}>
                      FRIENDS
                    </span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#4ade80' }}>
                    Friends Online
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    Create private room or join with 6-letter code
                  </span>
                  <div style={{
                    marginTop: 4,
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#4ade80',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    Select Mode →
                  </div>
                </div>

                {/* Mode 3: Play with Friends Offline */}
                <div
                  className="mode-card"
                  onClick={() => { sound.buttonClick(); setSelectedMode('friends_offline'); setError(''); }}
                  style={{
                    padding: '16px 14px',
                    background: 'linear-gradient(145deg, rgba(217, 119, 6, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%)',
                    borderColor: 'rgba(251, 191, 36, 0.35)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.6rem' }}>🛋️</span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: '#d97706',
                      color: '#ffffff',
                    }}>
                      PASS & PLAY
                    </span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fbbf24' }}>
                    Friends Offline
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    Local pass & play on this single screen (2–6 players)
                  </span>
                  <div style={{
                    marginTop: 4,
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    Select Mode →
                  </div>
                </div>

                {/* Mode 4: Play with Computers */}
                <div
                  className="mode-card"
                  onClick={() => { sound.buttonClick(); setSelectedMode('computer'); setError(''); }}
                  style={{
                    padding: '16px 14px',
                    background: 'linear-gradient(145deg, rgba(124, 58, 237, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%)',
                    borderColor: 'rgba(192, 132, 252, 0.35)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.6rem' }}>🤖</span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: '#7c3aed',
                      color: '#ffffff',
                    }}>
                      VS BOTS
                    </span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#c084fc' }}>
                    Play with Computers
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    Solo match vs smart AI bots (2–6 players)
                  </span>
                  <div style={{
                    marginTop: 4,
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#c084fc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    Select Mode →
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════════
               STEP 2: CONFIGURE SELECTED MODE & LAUNCH
               ═══════════════════════════════════════════════════════════════════ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Back to Game Modes Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 10,
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <button
                  onClick={() => { sound.buttonClick(); setSelectedMode(null); setError(''); }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: 99,
                    color: '#ffffff',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                >
                  <span>←</span>
                  <span>Back to Game Modes</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>
                    {selectedMode === 'online' ? '🌐' :
                     selectedMode === 'friends_online' ? '👥' :
                     selectedMode === 'friends_offline' ? '🛋️' : '🤖'}
                  </span>
                  <span style={{
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    color:
                      selectedMode === 'online' ? '#38bdf8' :
                      selectedMode === 'friends_online' ? '#4ade80' :
                      selectedMode === 'friends_offline' ? '#fbbf24' : '#c084fc',
                  }}>
                    {selectedMode === 'online' ? 'Play Online Setup' :
                     selectedMode === 'friends_online' ? 'Friends Online Setup' :
                     selectedMode === 'friends_offline' ? 'Pass & Play Setup' : 'Computer Match Setup'}
                  </span>
                </div>
              </div>

              {/* Player Identity Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <span style={{ fontSize: '1.4rem' }}>{profile.avatar || '👑'}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>PLAYER NAME</span>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      maxLength={18}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        outline: 'none',
                        width: '100%',
                      }}
                      placeholder="Enter name…"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(true)}
                  style={{
                    background: 'rgba(229, 185, 76, 0.12)',
                    border: '1px solid rgba(229, 185, 76, 0.35)',
                    color: 'var(--text-gold)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 99,
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Avatar 🎨
                </button>
              </div>

          {/* ── Respective Options & Configurations ── */}

          {/* 1. PLAY ONLINE OPTIONS */}
          {selectedMode === 'online' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  GAME VARIANT
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'TWO_SIDE', label: '🔄 Two-Side FLIP (Official 112 Cards)' },
                    { id: 'CLASSIC',  label: '🃏 Classic UNO (108 Cards)' },
                  ].map(v => (
                    <button
                      key={v.id}
                      onClick={() => { sound.buttonClick(); setOnlineVariant(v.id); }}
                      style={{
                        flex: 1,
                        padding: '9px 10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: onlineVariant === v.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${onlineVariant === v.id ? '#38bdf8' : 'var(--border-subtle)'}`,
                        color: onlineVariant === v.id ? '#38bdf8' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  COLOR CONFIGURATION
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'FOUR', label: '🎨 4 Colors (Standard)' },
                    { id: 'FIVE', label: '🌈 5 Colors (with Purple)' },
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => { sound.buttonClick(); setOnlineColor(c.id); }}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: onlineColor === c.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${onlineColor === c.id ? '#38bdf8' : 'var(--border-subtle)'}`,
                        color: onlineColor === c.id ? '#38bdf8' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. PLAY WITH FRIENDS ONLINE OPTIONS */}
          {selectedMode === 'friends_online' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {/* Host vs Join Tabs */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'host', label: '➕ Host Private Room' },
                  { id: 'join', label: '🔗 Join with Code' },
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => { sound.buttonClick(); setFriendsOnlineTab(sub.id); setError(''); }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      background: friendsOnlineTab === sub.id ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${friendsOnlineTab === sub.id ? '#4ade80' : 'var(--border-subtle)'}`,
                      color: friendsOnlineTab === sub.id ? '#4ade80' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {friendsOnlineTab === 'host' ? (
                <>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                      GAME VARIANT
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { id: 'TWO_SIDE', label: '🔄 Two-Side FLIP' },
                        { id: 'CLASSIC',  label: '🃏 Classic UNO' },
                      ].map(v => (
                        <button
                          key={v.id}
                          onClick={() => { sound.buttonClick(); setFriendVariant(v.id); }}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: friendVariant === v.id ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.04)',
                            border: `1.5px solid ${friendVariant === v.id ? '#4ade80' : 'var(--border-subtle)'}`,
                            color: friendVariant === v.id ? '#4ade80' : 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                        COLORS
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['FOUR', 'FIVE'].map(c => (
                          <button
                            key={c}
                            onClick={() => { sound.buttonClick(); setFriendColor(c); }}
                            style={{
                              flex: 1,
                              padding: '7px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: friendColor === c ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${friendColor === c ? '#4ade80' : 'var(--border-subtle)'}`,
                              color: friendColor === c ? '#4ade80' : 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            {c === 'FOUR' ? '4 Colors' : '5 Colors'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                        MAX PLAYERS
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[2, 3, 4, 6].map(num => (
                          <button
                            key={num}
                            onClick={() => { sound.buttonClick(); setFriendMaxPlayers(num); }}
                            style={{
                              flex: 1,
                              padding: '7px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: friendMaxPlayers === num ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${friendMaxPlayers === num ? '#4ade80' : 'var(--border-subtle)'}`,
                              color: friendMaxPlayers === num ? '#4ade80' : 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            {num}P
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                    6-LETTER ROOM CODE
                  </span>
                  <input
                    className="input"
                    placeholder="e.g. ABRNDH"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.25em',
                      fontWeight: 900,
                      fontSize: '1.25rem',
                      textAlign: 'center',
                      padding: '10px',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* 3. PLAY WITH FRIENDS OFFLINE (PASS & PLAY) OPTIONS */}
          {selectedMode === 'friends_offline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {/* Player Count Selector */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  NUMBER OF LOCAL PLAYERS (TABLE SIZES ACCORDINGLY)
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[2, 3, 4, 5, 6].map(count => (
                    <button
                      key={count}
                      onClick={() => { sound.buttonClick(); setOfflineCount(count); }}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        background: offlineCount === count ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${offlineCount === count ? '#fbbf24' : 'var(--border-subtle)'}`,
                        color: offlineCount === count ? '#fbbf24' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {count} Players
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Name Inputs for Each Seat */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  PLAYER NAMES
                </span>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: offlineCount > 4 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                  gap: 6,
                }}>
                  {Array.from({ length: offlineCount }).map((_, i) => (
                    <input
                      key={i}
                      value={offlineNames[i] || `Player ${i + 1}`}
                      onChange={e => handleOfflineNameChange(i, e.target.value)}
                      maxLength={14}
                      placeholder={`Player ${i + 1}`}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#ffffff',
                        padding: '6px 10px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Variant and Color for Offline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                    VARIANT
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { id: 'TWO_SIDE', label: 'FLIP' },
                      { id: 'CLASSIC', label: 'Classic' },
                    ].map(v => (
                      <button
                        key={v.id}
                        onClick={() => { sound.buttonClick(); setOfflineVariant(v.id); }}
                        style={{
                          flex: 1,
                          padding: '7px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: offlineVariant === v.id ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${offlineVariant === v.id ? '#fbbf24' : 'var(--border-subtle)'}`,
                          color: offlineVariant === v.id ? '#fbbf24' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                    COLORS
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['FOUR', 'FIVE'].map(c => (
                      <button
                        key={c}
                        onClick={() => { sound.buttonClick(); setOfflineColor(c); }}
                        style={{
                          flex: 1,
                          padding: '7px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: offlineColor === c ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${offlineColor === c ? '#fbbf24' : 'var(--border-subtle)'}`,
                          color: offlineColor === c ? '#fbbf24' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {c === 'FOUR' ? '4 Colors' : '5 Colors'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. PLAY WITH COMPUTERS (AI BOTS) OPTIONS */}
          {selectedMode === 'computer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {/* Total Players (Table Sizing) */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  TABLE SEATS ({computerTotal} PLAYERS = YOU + {computerTotal - 1} AI BOTS)
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { total: 2, label: '2 Players (1v1)' },
                    { total: 3, label: '3 Players' },
                    { total: 4, label: '4 Players' },
                    { total: 5, label: '5 Players' },
                    { total: 6, label: '6 Players (Big Table)' },
                  ].map(p => (
                    <button
                      key={p.total}
                      onClick={() => { sound.buttonClick(); setComputerTotal(p.total); }}
                      style={{
                        flex: 1,
                        padding: '7px 3px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        background: computerTotal === p.total ? 'rgba(192, 132, 252, 0.25)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${computerTotal === p.total ? '#c084fc' : 'var(--border-subtle)'}`,
                        color: computerTotal === p.total ? '#c084fc' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bot Difficulty */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  AI DIFFICULTY (BALANCED THINKING SPEED)
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'EASY',   label: '😊 Relaxed' },
                    { id: 'MEDIUM', label: '⚖️ Balanced' },
                    { id: 'HARD',   label: '🔥 Master' },
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => { sound.buttonClick(); setComputerDiff(d.id); }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: computerDiff === d.id ? 'rgba(192, 132, 252, 0.25)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${computerDiff === d.id ? '#c084fc' : 'var(--border-subtle)'}`,
                        color: computerDiff === d.id ? '#c084fc' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variant and Colors for Computer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                    VARIANT
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { id: 'TWO_SIDE', label: '🔄 FLIP' },
                      { id: 'CLASSIC', label: '🃏 Classic' },
                    ].map(v => (
                      <button
                        key={v.id}
                        onClick={() => { sound.buttonClick(); setComputerVariant(v.id); }}
                        style={{
                          flex: 1,
                          padding: '7px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: computerVariant === v.id ? 'rgba(192, 132, 252, 0.25)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${computerVariant === v.id ? '#c084fc' : 'var(--border-subtle)'}`,
                          color: computerVariant === v.id ? '#c084fc' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                    COLORS
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['FOUR', 'FIVE'].map(c => (
                      <button
                        key={c}
                        onClick={() => { sound.buttonClick(); setComputerColor(c); }}
                        style={{
                          flex: 1,
                          padding: '7px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: computerColor === c ? 'rgba(192, 132, 252, 0.25)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${computerColor === c ? '#c084fc' : 'var(--border-subtle)'}`,
                          color: computerColor === c ? '#c084fc' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {c === 'FOUR' ? '4 Colors' : '5 Colors'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(220, 38, 38, 0.15)',
              border: '1px solid rgba(220, 38, 38, 0.35)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              marginBottom: 12,
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {/* Primary Action Button */}
          <button
            className={`btn btn-lg w-full ${
              selectedMode === 'online' ? 'btn-primary' :
              selectedMode === 'friends_online' ? 'btn-emerald' :
              selectedMode === 'friends_offline' ? 'btn-gold' :
              'btn-purple'
            }`}
            style={{
              padding: '14px',
              fontSize: '1.05rem',
              fontWeight: 900,
              letterSpacing: '0.02em',
              background:
                selectedMode === 'online' ? 'linear-gradient(135deg, #0284c7, #0369a1)' :
                selectedMode === 'friends_online' ? 'linear-gradient(135deg, #16a34a, #15803d)' :
                selectedMode === 'friends_offline' ? 'linear-gradient(135deg, #d97706, #b45309)' :
                'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: '#ffffff',
              boxShadow:
                selectedMode === 'online' ? '0 0 24px rgba(2, 132, 199, 0.4)' :
                selectedMode === 'friends_online' ? '0 0 24px rgba(22, 163, 74, 0.4)' :
                selectedMode === 'friends_offline' ? '0 0 24px rgba(217, 119, 6, 0.4)' :
                '0 0 24px rgba(124, 58, 237, 0.4)',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
            }}
            onClick={
              selectedMode === 'online' ? handlePlayOnline :
              selectedMode === 'friends_online' ? (friendsOnlineTab === 'host' ? handleHostRoom : handleJoinRoom) :
              selectedMode === 'friends_offline' ? handlePlayOffline :
              handlePlayComputer
            }
            disabled={!connected || loading}
          >
            {loading ? 'Connecting…' :
             selectedMode === 'online' ? '⚡ Find Online Match Now' :
             selectedMode === 'friends_online' ? (friendsOnlineTab === 'host' ? '➕ Create Room & Get Code' : '🔗 Join Room via Code') :
             selectedMode === 'friends_offline' ? `🎮 Start Offline Pass & Play (${offlineCount} Players)` :
             `🤖 Launch Computer Match (${computerTotal} Players)`}
          </button>
            </div>
          )}
        </div>

        {/* Quick Rules Guide Button */}
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
        <span>4 Game Modes</span>
        <span>•</span>
        <span>Online & Offline Pass & Play</span>
        <span>•</span>
        <span>Authoritative Server Verification</span>
      </div>

      {/* Modals: Leaderboard, Profile, Rules */}
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
    </div>
  );
}
