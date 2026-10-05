/**
 * ResultScreen — Celebratory match conclusion screen with luxury styling.
 * Displays winner celebration, final player rankings, match metrics,
 * and direct access to persistent Supabase leaderboard & statistics.
 */

import React, { useEffect } from 'react';
import useGameStore from '../../store/gameStore';
import sound from '../../utils/audio';
import LeaderboardModal from '../ui/LeaderboardModal';

export default function ResultScreen() {
  const {
    gameState,
    gameResult,
    myPlayerId,
    reset,
    showLeaderboard,
    setShowLeaderboard,
  } = useGameStore();

  const winner = gameResult?.winner;
  const winnerPlayer = gameState?.players?.find(p => p.id === winner);
  const isIWon = winner === myPlayerId;

  useEffect(() => {
    if (isIWon) {
      sound.victoryFanfare();
    }
  }, [isIWon]);

  return (
    <div className="game-table flex-col items-center justify-center" style={{ height: '100vh', position: 'relative' }}>
      {/* Ambient Lighting */}
      <div className="landing-bg">
        <div
          className="landing-orb"
          style={{
            width: 600,
            height: 600,
            top: '-25%',
            left: '-20%',
            background: isIWon ? '#15803D' : '#1657C7',
            opacity: 0.12,
          }}
        />
        <div
          className="landing-orb"
          style={{
            width: 450,
            height: 450,
            bottom: '-15%',
            right: '-10%',
            background: isIWon ? '#EAB308' : '#D92525',
            opacity: 0.10,
          }}
        />
      </div>

      <div style={{
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 22,
        width: 'min(500px, 92vw)',
      }}>
        {/* Emblem / Trophy */}
        <div style={{
          fontSize: '5.5rem',
          animation: 'bounceIn 0.7s cubic-bezier(0.34,1.56,0.64,1)',
          filter: `drop-shadow(0 0 28px ${isIWon ? 'rgba(229,185,76,0.5)' : 'rgba(22,87,199,0.4)'})`,
        }}>
          {isIWon ? '🏆' : '🎴'}
        </div>

        {/* Victory Title */}
        <div>
          <h1 className="font-display anim-fade-in" style={{
            fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
            background: isIWon
              ? 'linear-gradient(135deg, #ffffff 0%, #fef08a 40%, #eab308 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 40%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            {isIWon ? 'Victory!' : `${winnerPlayer?.name ?? 'Match'} Concluded`}
          </h1>
          <p style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {isIWon
              ? 'Outstanding play! You cleared your entire hand first.'
              : `${winnerPlayer?.name ?? 'A player'} claimed 1st place.`}
          </p>
        </div>

        {/* Match Statistics Badges */}
        {gameResult && (
          <div style={{
            display: 'flex',
            gap: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            padding: '8px 16px',
            borderRadius: '99px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}>
            <span>Turns: <strong style={{ color: 'var(--text-primary)' }}>{gameResult.totalTurns || gameState?.turnCount || 0}</strong></span>
            <span>•</span>
            <span>Duration: <strong style={{ color: 'var(--text-primary)' }}>{gameResult.durationSeconds || 0}s</strong></span>
            {gameResult.totalFlips > 0 && (
              <>
                <span>•</span>
                <span>Flips: <strong style={{ color: 'var(--text-gold)' }}>{gameResult.totalFlips}</strong></span>
              </>
            )}
          </div>
        )}

        {/* Final Standings Table */}
        {gameState && (
          <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '20px 24px', width: '100%' }}>
            <h3 style={{
              marginBottom: 14,
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 800,
            }}>
              Final Standings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...gameState.players]
                .sort((a, b) => (a.cardCount || 0) - (b.cardCount || 0))
                .map((p, i) => {
                  const isPlayerWinner = (p.id === winner);
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: isPlayerWinner ? 'rgba(229,185,76,0.12)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isPlayerWinner ? 'rgba(229,185,76,0.35)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, width: 24 }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                        <span style={{ fontWeight: 700, color: isPlayerWinner ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                          {p.name} {p.isBot ? '🤖' : ''} {p.id === myPlayerId ? '(You)' : ''}
                        </span>
                      </div>
                      <span style={{ color: isPlayerWinner ? 'var(--text-gold)' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
                        {p.cardCount === 0 ? '✓ Cleared Hand' : `${p.cardCount} cards remaining`}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={() => { sound.buttonClick(); setShowLeaderboard(true); }}
          >
            🏆 Leaderboard
          </button>
          <button
            className="btn btn-gold"
            style={{ flex: 1.5 }}
            onClick={() => { sound.buttonClick(); reset(); }}
          >
            🏠 Return to Lobby
          </button>
        </div>
      </div>

      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  );
}
