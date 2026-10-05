/**
 * ResultScreen — Celebratory match conclusion screen with luxury arcade styling.
 * Displays winner celebration, XP & Coin gains, level progression, final standings,
 * and direct access to persistent Supabase leaderboard & statistics.
 */

import React, { useEffect } from 'react';
import useGameStore from '../../store/gameStore';
import sound from '../../utils/audio';
import LeaderboardModal from '../ui/LeaderboardModal';
import ProfileModal, { FRAME_STYLES } from '../ui/ProfileModal';

export default function ResultScreen() {
  const {
    gameState,
    gameResult,
    myPlayerId,
    profile,
    reset,
    showLeaderboard,
    setShowLeaderboard,
    showProfileModal,
    setShowProfileModal,
  } = useGameStore();

  const winner = gameResult?.winner;
  const winnerPlayer = gameState?.players?.find(p => p.id === winner);
  const isIWon = winner === myPlayerId;

  const currentFrameObj = FRAME_STYLES.find(f => f.id === profile.frame) || FRAME_STYLES[0];
  const level = Math.max(1, Math.floor((profile.xp || 0) / 150) + 1);
  const currentLevelMinXp = (level - 1) * 150;
  const nextLevelXp = level * 150;
  const xpInCurrentLevel = (profile.xp || 0) - currentLevelMinXp;
  const xpProgressPct = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / 150) * 100)));

  useEffect(() => {
    if (isIWon) {
      sound.victoryFanfare();
      sound.vibrate([100, 50, 100, 50, 200]);
    }
  }, [isIWon]);

  return (
    <div
      className="game-table"
      style={{
        height: '100dvh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
      }}
    >
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
            opacity: 0.14,
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
            opacity: 0.12,
          }}
        />
      </div>

      <div
        style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          width: 'min(500px, 94vw)',
          margin: 'auto 0',
        }}
      >
        {/* Emblem / Trophy */}
        <div
          style={{
            fontSize: '5rem',
            animation: 'bounceIn 0.7s cubic-bezier(0.34,1.56,0.64,1)',
            filter: `drop-shadow(0 0 28px ${isIWon ? 'rgba(229,185,76,0.6)' : 'rgba(22,87,199,0.5)'})`,
          }}
        >
          {isIWon ? '👑' : '🎴'}
        </div>

        {/* Victory Title */}
        <div>
          <h1
            className="font-display anim-fade-in"
            style={{
              fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
              background: isIWon
                ? 'linear-gradient(135deg, #ffffff 0%, #fef08a 40%, #eab308 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 40%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {isIWon ? 'Grand Victory!' : `${winnerPlayer?.name ?? 'Match'} Concluded`}
          </h1>
          <p style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {isIWon
              ? 'Tactical perfection! You cleared your entire hand first.'
              : `${winnerPlayer?.name ?? 'A player'} claimed 1st place in this round.`}
          </p>
        </div>

        {/* XP & Rewards Banner */}
        <div
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(22, 32, 50, 0.9) 0%, rgba(14, 20, 32, 0.95) 100%)',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-xl)',
            padding: '14px 18px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: currentFrameObj.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}
              >
                {profile.avatar || '👑'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {profile.username || 'Player'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-gold)', display: 'block' }}>
                  Level {level} • {profile.title}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <span
                style={{
                  background: 'rgba(229, 185, 76, 0.15)',
                  border: '1px solid rgba(229, 185, 76, 0.4)',
                  color: 'var(--text-gold)',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: 99,
                }}
              >
                {isIWon ? '+180 XP' : '+60 XP'}
              </span>
              <span
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#93c5fd',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: 99,
                }}
              >
                🪙 {isIWon ? '+150' : '+40'}
              </span>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div style={{ width: '100%', height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${xpProgressPct}%`,
                background: 'var(--gold-gradient)',
                borderRadius: 99,
                transition: 'width 0.8s ease',
              }}
            />
          </div>
        </div>

        {/* Final Standings Table */}
        {gameState && (
          <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '16px 20px', width: '100%' }}>
            <h3
              style={{
                marginBottom: 12,
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 800,
              }}
            >
              Final Standings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...gameState.players]
                .sort((a, b) => (a.cardCount || 0) - (b.cardCount || 0))
                .map((p, i) => {
                  const isPlayerWinner = p.id === winner;
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: isPlayerWinner ? 'rgba(229,185,76,0.12)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isPlayerWinner ? 'rgba(229,185,76,0.35)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, width: 22 }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isPlayerWinner ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                          {p.name} {p.isBot ? '🤖' : ''} {p.id === myPlayerId ? '(You)' : ''}
                        </span>
                      </div>
                      <span style={{ color: isPlayerWinner ? 'var(--text-gold)' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>
                        {p.cardCount === 0 ? '✓ Cleared Hand' : `${p.cardCount} cards`}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={() => {
              sound.buttonClick();
              setShowLeaderboard(true);
            }}
          >
            🏆 Rankings
          </button>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={() => {
              sound.buttonClick();
              setShowProfileModal(true);
            }}
          >
            🎖️ Profile
          </button>
          <button
            className="btn btn-gold"
            style={{ flex: 1.5 }}
            onClick={() => {
              sound.buttonClick();
              reset();
            }}
          >
            🏠 Return Home
          </button>
        </div>
      </div>

      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
}
