/**
 * Lobby Screen — Pre-game configuration and staging area.
 * Host selects game rules (Classic vs Two-Side, 4 vs 5 colors),
 * manages human and AI bot participants, and triggers match launch.
 */

import React, { useState } from 'react';
import useGameStore from '../../store/gameStore';
import { GAME_MODE, COLOR_MODE, AI_DIFFICULTY } from '../../utils/constants';
import sound from '../../utils/audio';
import LeaderboardModal from '../ui/LeaderboardModal';

const MODE_OPTIONS = [
  { value: 'CLASSIC', label: 'Classic UNO', icon: '🃏', desc: 'Single-face play. Choice of 4 or 5 colors.' },
  { value: 'TWO_SIDE', label: 'Two-Side UNO', icon: '🔄', desc: 'Dual-faced cards with dynamic FLIP transitions.' },
];

const COLOR_OPTIONS = [
  { value: 'FOUR', label: '4 Colors', desc: 'Red, Blue, Green, Yellow' },
  { value: 'FIVE', label: '5 Colors', desc: '+ Regal Purple' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'EASY',   label: 'Casual',   desc: 'Standard legal plays' },
  { value: 'MEDIUM', label: 'Tactical', desc: 'Balances action cards' },
  { value: 'HARD',   label: 'Expert',   desc: 'Heuristic color & catch tracking' },
];

export default function LobbyScreen() {
  const {
    socket,
    roomId,
    lobbyState,
    myPlayerId,
    soundEnabled,
    toggleSound,
    showLeaderboard,
    setShowLeaderboard,
  } = useGameStore();

  const [botName, setBotName]         = useState('');
  const [botDifficulty, setBotDiff]   = useState('MEDIUM');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [copied, setCopied]           = useState(false);

  if (!lobbyState) return null;

  const isHost     = lobbyState.hostId === myPlayerId;
  const config     = lobbyState.config || {};
  const players    = lobbyState.players || [];

  function updateConfig(newConfig) {
    sound.buttonClick();
    socket.emit('updateConfig', { config: newConfig }, (res) => {
      if (!res.ok) setError(res.error);
    });
  }

  function handleAddBot() {
    setError('');
    sound.buttonClick();
    socket.emit('addBot', { botName: botName.trim() || null, difficulty: botDifficulty }, (res) => {
      if (!res.ok) return setError(res.error);
      setBotName('');
    });
  }

  function handleRemoveBot(botId) {
    sound.buttonClick();
    socket.emit('removeBot', { botId }, (res) => {
      if (!res.ok) setError(res.error);
    });
  }

  function handleStart() {
    setError('');
    setLoading(true);
    sound.buttonClick();
    socket.emit('startGame', null, (res) => {
      setLoading(false);
      if (res && !res.ok) setError(res.error);
    });
  }

  function copyCode() {
    sound.buttonClick();
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="game-table flex-col items-center justify-center" style={{ height:'100vh', overflow:'auto', padding:'24px 16px', position:'relative' }}>
      {/* Top Bar Navigation */}
      <div style={{
        position: 'absolute',
        top: 20,
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
          <span>Stats</span>
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

      {/* Atmospheric Table Glow */}
      <div className="landing-bg" style={{ pointerEvents:'none' }}>
        <div className="landing-orb" style={{ width:500, height:500, top:'-20%', right:'-15%', background:'#1657C7', opacity:0.12 }} />
        <div className="landing-orb" style={{ width:400, height:400, bottom:'-15%', left:'-10%', background:'#EAB308', opacity:0.08 }} />
      </div>

      <div style={{ position:'relative', zIndex:2, width:'min(840px,96vw)', display:'flex', flexDirection:'column', gap:22 }}>
        {/* Header with Room Code */}
        <div style={{ textAlign:'center' }}>
          <h1 className="font-display anim-fade-in" style={{ fontSize:'clamp(1.9rem,4vw,2.7rem)', marginBottom:8 }}>
            Match Staging Lobby
          </h1>
          <div
            style={{
              display:'inline-flex',
              alignItems:'center',
              gap:14,
              padding:'10px 22px',
              borderRadius:'var(--radius-lg)',
              background:'rgba(16, 24, 38, 0.85)',
              border:'1px solid var(--border-gold)',
              cursor:'pointer',
              boxShadow:'0 4px 16px rgba(0,0,0,0.5)',
              transition:'all 0.2s ease',
            }}
            onClick={copyCode}
            title="Click to copy room code"
          >
            <span style={{ color:'var(--text-muted)', fontSize:'0.78rem', fontWeight:700, letterSpacing:'0.05em' }}>
              INVITATION CODE
            </span>
            <span style={{
              fontFamily:"'Outfit', sans-serif",
              fontWeight:900,
              fontSize:'1.6rem',
              letterSpacing:'0.18em',
              color:'var(--gold-primary)',
            }}>
              {roomId}
            </span>
            <span style={{ fontSize:'0.82rem', color: copied ? '#4ade80' : 'var(--text-secondary)', fontWeight: 600 }}>
              {copied ? '✓ Copied' : '📋 Copy'}
            </span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(360px, 1fr))', gap:20 }}>
          {/* ─ Left: Game Rules Config ─────────────────────────────── */}
          <div className="glass-strong" style={{ borderRadius:'var(--radius-xl)', padding:24 }}>
            <h3 style={{ marginBottom:18, color:'var(--text-secondary)', fontWeight:700, fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Match Rules {!isHost && '(Host controlled)'}
            </h3>

            {/* Game Mode */}
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-muted)', marginBottom:10 }}>Format</p>
              <div style={{ display:'flex', gap:10 }}>
                {MODE_OPTIONS.map(opt => {
                  const isSel = config.mode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      disabled={!isHost}
                      className="mode-card flex-col"
                      style={{
                        flex:1,
                        background: isSel ? 'rgba(229,185,76,0.12)' : 'rgba(255,255,255,0.02)',
                        borderColor: isSel ? 'var(--gold-primary)' : 'var(--border-subtle)',
                        boxShadow: isSel ? '0 0 20px rgba(229,185,76,0.25)' : 'none',
                        padding:'16px 14px',
                        textAlign:'left',
                        cursor: isHost ? 'pointer' : 'default',
                        borderRadius:'var(--radius-lg)',
                      }}
                      onClick={() => isHost && updateConfig({ mode: opt.value })}
                    >
                      <div style={{ fontSize:'1.6rem', marginBottom:6 }}>{opt.icon}</div>
                      <div style={{ fontWeight:800, fontSize:'0.92rem', color: isSel ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4, lineHeight:1.4 }}>
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Mode */}
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-muted)', marginBottom:10 }}>Color Palette</p>
              <div style={{ display:'flex', gap:10 }}>
                {COLOR_OPTIONS.map(opt => {
                  const isSel = config.colorMode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      disabled={!isHost}
                      style={{
                        flex:1,
                        padding:'12px 14px',
                        borderRadius:'var(--radius-md)',
                        background: isSel ? 'rgba(229,185,76,0.12)' : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${isSel ? 'var(--gold-primary)' : 'var(--border-subtle)'}`,
                        color: isSel ? 'var(--text-gold)' : 'var(--text-secondary)',
                        fontWeight:700,
                        fontSize:'0.88rem',
                        cursor: isHost ? 'pointer' : 'default',
                        textAlign:'left',
                        transition:'all 0.15s ease',
                      }}
                      onClick={() => isHost && updateConfig({ colorMode: opt.value })}
                    >
                      <div style={{ fontWeight: 800 }}>{opt.label}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:3 }}>{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color palette sample swatches */}
            <div>
              <p style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', marginBottom:8 }}>Palette Preview</p>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                {(config.colorMode === 'FIVE'
                  ? ['#D92525','#1657C7','#15803D','#EAB308','#8B5CF6']
                  : ['#D92525','#1657C7','#15803D','#EAB308']
                ).map((c,i) => (
                  <div key={i} style={{ width:22, height:22, borderRadius:'50%', background:c, boxShadow:`0 0 10px ${c}66`, border:'1.5px solid rgba(255,255,255,0.2)' }} />
                ))}
                {config.mode === 'TWO_SIDE' && (
                  <>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.8rem', margin:'0 4px' }}>⇄</span>
                    {(config.colorMode === 'FIVE'
                      ? ['#831843','#0F3B7A','#78350F','#C2410C','#581C87']
                      : ['#831843','#0F3B7A','#78350F','#C2410C']
                    ).map((c,i) => (
                      <div key={i} style={{ width:22, height:22, borderRadius:'50%', background:c, boxShadow:`0 0 10px ${c}66`, border:'1.5px solid rgba(255,255,255,0.2)' }} />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ─ Right: Participant Roster & AI Management ────────── */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Player list */}
            <div className="glass-strong" style={{ borderRadius:'var(--radius-xl)', padding:22, flex:1 }}>
              <h3 style={{ marginBottom:14, color:'var(--text-secondary)', fontWeight:700, fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Roster ({players.length}/{config.maxPlayers || 10})
              </h3>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {players.map((p) => (
                  <div key={p.id} className="lobby-player-row">
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:'1.2rem' }}>{p.isBot ? '🤖' : '👤'}</span>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'0.92rem', display:'flex', alignItems:'center', gap:8 }}>
                          {p.name}
                          {p.id === myPlayerId && (
                            <span style={{ fontSize:'0.65rem', color:'#93c5fd', fontWeight:800, background:'rgba(22,87,199,0.25)', border:'1px solid rgba(147,197,253,0.3)', padding:'2px 8px', borderRadius:99 }}>
                              YOU
                            </span>
                          )}
                          {p.id === lobbyState.hostId && (
                            <span style={{ fontSize:'0.65rem', color:'var(--text-gold)', fontWeight:800, background:'rgba(229,185,76,0.2)', border:'1px solid rgba(229,185,76,0.35)', padding:'2px 8px', borderRadius:99 }}>
                              HOST
                            </span>
                          )}
                        </div>
                        {p.isBot && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{p.difficulty} AI</div>}
                      </div>
                    </div>
                    {isHost && p.isBot && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color:'#f87171', borderColor:'rgba(239,68,68,0.2)', padding:'4px 10px' }}
                        onClick={() => handleRemoveBot(p.id)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add Bot Panel (Host Only) */}
            {isHost && (
              <div className="glass-strong" style={{ borderRadius:'var(--radius-xl)', padding:20 }}>
                <h3 style={{ marginBottom:12, color:'var(--text-secondary)', fontWeight:700, fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  Add Computer Opponent
                </h3>
                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <input
                    className="input"
                    placeholder="Bot name (optional)"
                    value={botName}
                    onChange={e => setBotName(e.target.value)}
                    style={{ flex:1 }}
                  />
                </div>
                <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                  {DIFFICULTY_OPTIONS.map(d => {
                    const isSel = botDifficulty === d.value;
                    return (
                      <button
                        key={d.value}
                        style={{
                          flex:1,
                          padding:'8px 6px',
                          borderRadius:'var(--radius-sm)',
                          fontSize:'0.76rem',
                          fontWeight:800,
                          background: isSel ? 'rgba(229,185,76,0.18)' : 'rgba(255,255,255,0.03)',
                          border:`1.5px solid ${isSel ? 'var(--gold-primary)' : 'var(--border-subtle)'}`,
                          color: isSel ? 'var(--text-gold)' : 'var(--text-secondary)',
                          cursor:'pointer',
                          transition:'all 0.15s ease',
                        }}
                        onClick={() => { sound.buttonClick(); setBotDiff(d.value); }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  className="btn btn-ghost w-full"
                  onClick={handleAddBot}
                  disabled={players.length >= (config.maxPlayers || 10)}
                >
                  + Add AI Player
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{ padding:'10px 16px', borderRadius:'var(--radius-md)', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#fca5a5', fontSize:'0.88rem', textAlign:'center' }}>
            {error}
          </div>
        )}

        {/* Match Launch Button */}
        {isHost ? (
          <button
            className="btn btn-gold btn-xl w-full"
            onClick={handleStart}
            disabled={loading || players.length < 2}
          >
            {loading ? 'Initializing Match…' : `Start Match (${players.length} Players)`}
          </button>
        ) : (
          <div style={{ textAlign:'center', padding:'16px', color:'var(--text-muted)', fontSize:'0.92rem' }}>
            ⏳ Waiting for host to launch the match…
          </div>
        )}
      </div>

      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  );
}
