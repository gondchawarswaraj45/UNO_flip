import React, { useState, useEffect } from 'react';
import useGameStore from '../../store/gameStore';
import { SERVER_URL } from '../../utils/constants';
import sound from '../../utils/audio';

export default function LeaderboardModal({ isOpen, onClose }) {
  const { myUserId, myName } = useGameStore();
  const [tab, setTab] = useState('leaderboard'); // 'leaderboard' | 'matches' | 'mystats'
  const [leaderboard, setLeaderboard] = useState([]);
  const [matches, setMatches] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    if (tab === 'leaderboard') {
      fetch(`${SERVER_URL}/api/stats/leaderboard?limit=15`)
        .then(r => r.json())
        .then(data => {
          if (data.ok) setLeaderboard(data.leaderboard || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else if (tab === 'matches') {
      fetch(`${SERVER_URL}/api/matches/recent?limit=15`)
        .then(r => r.json())
        .then(data => {
          if (data.ok) setMatches(data.matches || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else if (tab === 'mystats') {
      if (myUserId) {
        fetch(`${SERVER_URL}/api/stats/player/${myUserId}`)
          .then(r => r.json())
          .then(data => {
            if (data.ok) setMyStats(data.stats);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [isOpen, tab, myUserId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.6rem' }}>🏆</span>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Game Statistics & History</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Persistent PostgreSQL / Supabase records
              </p>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { sound.buttonClick(); onClose(); }}
            style={{ padding: '6px 12px', borderRadius: '50%' }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          background: 'rgba(0,0,0,0.3)',
          padding: 4,
          borderRadius: 'var(--radius-md)',
          marginBottom: 20
        }}>
          {[
            { id: 'leaderboard', label: '🏆 Leaderboard' },
            { id: 'matches', label: '📜 Match History' },
            { id: 'mystats', label: '👤 My Stats' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { sound.buttonClick(); setTab(t.id); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: tab === t.id ? 'var(--gold-gradient)' : 'transparent',
                color: tab === t.id ? '#1a1200' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ minHeight: 280, maxHeight: 380, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              ⚡ Loading records...
            </div>
          ) : tab === 'leaderboard' ? (
            leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                No completed matches recorded yet. Play a game to claim 1st place!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {leaderboard.map((item, index) => {
                  const isTop3 = index < 3;
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                  return (
                    <div
                      key={item.userId || index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: isTop3 ? 'rgba(229,185,76,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isTop3 ? 'rgba(229,185,76,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: isTop3 ? '1.2rem' : '0.85rem', fontWeight: 800, width: 28 }}>
                          {medal}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, color: isTop3 ? '#fce79f' : 'var(--text-primary)' }}>
                            {item.username} {item.userId === myUserId && '(You)'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.matchesPlayed} matches • {item.cardsPlayed || 0} cards played
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: 'var(--gold-primary)', fontSize: '0.95rem' }}>
                          {item.matchesWon} {item.matchesWon === 1 ? 'Win' : 'Wins'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.winRatePct}% Win Rate
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : tab === 'matches' ? (
            matches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                No match history available yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matches.map(m => (
                  <div
                    key={m.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: m.game_mode === 'TWO_SIDE' ? 'rgba(131,24,67,0.3)' : 'rgba(22,87,199,0.3)',
                          color: m.game_mode === 'TWO_SIDE' ? '#fda4af' : '#93c5fd',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                          {m.game_mode} ({m.color_mode}C)
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Room: <strong>{m.room_code}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '0.88rem' }}>
                        Winner: <strong style={{ color: 'var(--gold-primary)' }}>{m.winner_name || 'Player'}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <div>{m.total_turns} turns • {m.duration_seconds}s</div>
                      {m.total_flips > 0 && <div>🔄 {m.total_flips} flips</div>}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* My Stats */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(229,185,76,0.08)',
                border: '1px solid rgba(229,185,76,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#fce79f' }}>{myName || 'Guest Player'}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {myUserId}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                    {myStats?.matchesWon || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Victories</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {[
                  { label: 'Matches Played', val: myStats?.matchesPlayed || 0 },
                  { label: 'Win Rate', val: `${myStats?.winRatePct || '0.0'}%` },
                  { label: 'Cards Played', val: myStats?.cardsPlayed || 0 },
                  { label: 'UNO Calls', val: myStats?.unoCalls || 0 },
                  { label: 'Successful Catches', val: myStats?.caughtSuccess || 0 },
                  { label: 'Total Game Score', val: myStats?.totalScore || 0 },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button className="btn btn-gold btn-sm" onClick={() => { sound.buttonClick(); onClose(); }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
