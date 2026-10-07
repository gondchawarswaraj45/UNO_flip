/**
 * ProfileModal — Permanent Player Profile & Identity Customizer.
 *
 * Allows player to:
 *  - Customize username and select from 12 luxury animated avatars.
 *  - Choose avatar frames (Gold Royal, Neon Cyber, Ruby Flame, Emerald Myth, Mahogany).
 *  - View Level, Rank Title, and dynamic XP progress bar.
 *  - Inspect lifetime career stats (Matches, Wins, Win Rate, Flips, Streaks).
 *  - Copy unique Player ID / Friend Code.
 * All changes persist permanently in localStorage and synchronize with Supabase PostgreSQL.
 */

import React, { useState } from 'react';
import useGameStore from '../../store/gameStore';
import sound from '../../utils/audio';
import { toast } from 'react-hot-toast';
import { GoogleIcon } from '../screens/LoginScreen';

export const AVATAR_OPTIONS = [
  { id: '👑', label: 'Monarch' },
  { id: '🧙', label: 'Wizard' },
  { id: '🃏', label: 'Trickster' },
  { id: '🦊', label: 'Fox' },
  { id: '🐯', label: 'Tiger' },
  { id: '🐲', label: 'Dragon' },
  { id: '🤖', label: 'Cyber Bot' },
  { id: '⚡', label: 'Thunder' },
  { id: '💎', label: 'Diamond' },
  { id: '🎩', label: 'Aristocrat' },
  { id: '🦁', label: 'Lion King' },
  { id: '🎯', label: 'Sniper' },
];

export const FRAME_STYLES = [
  { id: 'gold_royal',   name: 'Gold Royal',   border: 'linear-gradient(135deg, #f7df8b, #d4a026, #996e10)', glow: 'rgba(229, 185, 76, 0.5)' },
  { id: 'neon_cyber',   name: 'Cyber Neon',   border: 'linear-gradient(135deg, #06b6d4, #3b82f6, #a855f7)', glow: 'rgba(59, 130, 246, 0.5)' },
  { id: 'ruby_flame',   name: 'Ruby Flame',   border: 'linear-gradient(135deg, #f87171, #dc2626, #991b1b)', glow: 'rgba(220, 38, 38, 0.5)' },
  { id: 'emerald_myth', name: 'Emerald Myth', border: 'linear-gradient(135deg, #4ade80, #16a34a, #14532d)', glow: 'rgba(22, 163, 74, 0.5)' },
  { id: 'classic_wood', name: 'Mahogany',     border: 'linear-gradient(135deg, #d97706, #78350f, #451a03)', glow: 'rgba(120, 53, 15, 0.4)' },
];

export default function ProfileModal({ isOpen, onClose }) {
  const { profile, updateProfile, myUserId, authUser, logout, isGuest, openLoginScreen } = useGameStore();

  const [name, setName] = useState(profile.username || 'Player');
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar || '👑');
  const [selectedFrame, setSelectedFrame] = useState(profile.frame || 'gold_royal');
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'stats' | 'custom'

  if (!isOpen) return null;

  // Level & XP math
  const xp = profile.xp || 0;
  const level = Math.max(1, Math.floor(xp / 150) + 1);
  const currentLevelMinXp = (level - 1) * 150;
  const nextLevelXp = level * 150;
  const xpInCurrentLevel = xp - currentLevelMinXp;
  const xpProgressPct = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / 150) * 100)));

  const winRate = profile.matchesPlayed > 0
    ? (((profile.matchesWon || 0) / profile.matchesPlayed) * 100).toFixed(1)
    : '0.0';

  const currentFrameObj = FRAME_STYLES.find(f => f.id === selectedFrame) || FRAME_STYLES[0];

  function handleSave() {
    sound.buttonClick();
    const trimmed = name.trim() || 'Player';
    updateProfile({
      username: trimmed,
      avatar: selectedAvatar,
      frame: selectedFrame,
    });
    toast.success('Profile saved permanently! ✨');
    onClose();
  }

  function handleCopyId() {
    sound.buttonClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(myUserId);
      toast.success('Player ID copied to clipboard!');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 520,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
        }}
      >
        {/* Header with Title and Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.6rem' }}>🎖️</span>
            <div>
              <h2 style={{ fontSize: '1.35rem', lineHeight: 1.1 }}>Player Dossier</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Persistent Career Profile & Customs
              </span>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', width: 36, height: 36, padding: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Hero Profile Showcase Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(22, 32, 50, 0.8) 0%, rgba(14, 20, 32, 0.95) 100%)',
            border: '1px solid var(--border-mid)',
            borderRadius: 'var(--radius-xl)',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginBottom: 18,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Avatar with Custom Frame */}
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              padding: 4,
              background: currentFrameObj.border,
              boxShadow: `0 0 20px ${currentFrameObj.glow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative',
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
                fontSize: '2.4rem',
              }}
            >
              {selectedAvatar}
            </div>

            {/* Level Tag Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                background: 'var(--gold-gradient)',
                color: '#1a1200',
                fontWeight: 900,
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: 99,
                boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
                letterSpacing: '0.04em',
              }}
            >
              LV.{level}
            </div>
          </div>

          {/* User Details & Level Progress */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name || 'Player'}
              </span>
              <span style={{
                background: 'rgba(229, 185, 76, 0.15)',
                border: '1px solid rgba(229, 185, 76, 0.3)',
                color: 'var(--text-gold)',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 99,
              }}>
                {profile.title || 'Card Novice'}
              </span>
            </div>

            {/* XP Progress Bar */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>XP {xp}</span>
                <span>Next Lv: {nextLevelXp} XP</span>
              </div>
              <div style={{ width: '100%', height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${xpProgressPct}%`,
                    background: 'var(--gold-gradient)',
                    borderRadius: 99,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Customization vs Career Stats */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[
            { id: 'profile', label: '🎨 Customize Avatar' },
            { id: 'stats',   label: '📊 Career Stats' },
          ].map(t => (
            <button
              key={t.id}
              className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
              onClick={() => { sound.buttonClick(); setActiveTab(t.id); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Customize Profile */}
        {activeTab === 'profile' && (
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
            {/* Connected Google Account Pill */}
            {authUser?.email && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <GoogleIcon size={18} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Connected Google Account
                    </span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f1f5f9' }}>
                      {authUser.email}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    sound.buttonClick();
                    onClose();
                    logout();
                    toast('Signed out from Google account', { icon: '👋' });
                  }}
                  style={{
                    color: '#f87171',
                    fontSize: '0.72rem',
                    padding: '4px 8px',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    background: 'rgba(248, 113, 113, 0.08)',
                  }}
                  title="Switch or sign out of Google account"
                >
                  Sign Out
                </button>
              </div>
            )}

            {/* Guest Mode Notice & Upgrade Pill */}
            {isGuest && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.25rem' }}>👤</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700 }}>
                      Playing in Guest Mode
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Connect Google Mail to save career progress permanently
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    sound.buttonClick();
                    onClose();
                    openLoginScreen();
                  }}
                  style={{
                    background: '#38bdf8',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    padding: '5px 10px',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Connect Google
                </button>
              </div>
            )}

            {/* Username Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Display Name
              </label>
              <input
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={18}
                placeholder="Enter your name…"
              />
            </div>

            {/* Choose Avatar */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Select Avatar Character
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 8,
              }}>
                {AVATAR_OPTIONS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => { sound.buttonClick(); setSelectedAvatar(a.id); }}
                    style={{
                      height: 52,
                      borderRadius: 'var(--radius-md)',
                      background: selectedAvatar === a.id ? 'rgba(229, 185, 76, 0.2)' : 'var(--bg-card)',
                      border: selectedAvatar === a.id ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.6rem',
                      cursor: 'pointer',
                      transform: selectedAvatar === a.id ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                    }}
                    title={a.label}
                  >
                    {a.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Choose Frame */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Select Avatar Frame Style
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                {FRAME_STYLES.map(f => (
                  <div
                    key={f.id}
                    onClick={() => { sound.buttonClick(); setSelectedFrame(f.id); }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: selectedFrame === f.id ? 'rgba(229, 185, 76, 0.12)' : 'var(--bg-card)',
                      border: selectedFrame === f.id ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: f.border,
                      boxShadow: `0 0 8px ${f.glow}`,
                    }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {f.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Unique Player Code / ID */}
            <div style={{
              background: 'rgba(0,0,0,0.25)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Friend / Player UUID</span>
                <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {myUserId}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleCopyId} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                📋 Copy
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Career Stats */}
        {activeTab === 'stats' && (
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              marginBottom: 16,
            }}>
              {[
                { label: 'Matches Played', val: profile.matchesPlayed || 0, icon: '🎮' },
                { label: 'Matches Won',    val: profile.matchesWon || 0, icon: '🏆' },
                { label: 'Win Rate',       val: `${winRate}%`, icon: '📈' },
                { label: 'Current Streak', val: `${profile.winStreak || 0} Wins`, icon: '🔥' },
                { label: 'Highest Streak', val: `${profile.highestStreak || 0} Wins`, icon: '⚡' },
                { label: 'Total Score',    val: profile.totalScore || 0, icon: '🌟' },
                { label: 'Total Flips',    val: profile.totalFlips || 0, icon: '🔄' },
                { label: 'Player Coins',   val: profile.coins || 500, icon: '🪙' },
              ].map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-gold)', fontFamily: 'Outfit' }}>
                    {s.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
            Close
          </button>
          <button className="btn btn-gold" onClick={handleSave} style={{ flex: 2 }}>
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
