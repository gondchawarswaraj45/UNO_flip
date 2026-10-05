/**
 * QuickReactionTray — In-game floating quick chat and animated emoji bar.
 * Allows instant tactical communication without typing.
 */

import React from 'react';
import useGameStore from '../../store/gameStore';
import sound from '../../utils/audio';

export const QUICK_EMOJIS = ['😂', '🔥', '👑', '😱', '👏', '⚡', '🃏', '😈'];

export const QUICK_MESSAGES = [
  'Good Game! 🤝',
  'Nice Move! ✨',
  'Watch Out! ⚠️',
  'UNO Time! 🃏',
  'Oops! 🙈',
  'Hurry Up! ⏰',
];

export default function QuickReactionTray({ onClose }) {
  const { socket, showQuickChat, setShowQuickChat } = useGameStore();

  if (!showQuickChat) return null;

  function handleSend(emoji, text) {
    sound.chatPop();
    sound.vibrate(20);
    if (socket) {
      socket.emit('sendReaction', { emoji, text });
    }
    setShowQuickChat(false);
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 64,
        right: 18,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-gold)',
        borderRadius: 'var(--radius-xl)',
        padding: '16px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75), 0 0 24px rgba(229, 185, 76, 0.25)',
        width: 'min(320px, 92vw)',
        animation: 'modalScale 0.2s var(--ease-spring)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-gold)', letterSpacing: '0.04em' }}>
          💬 QUICK REACTIONS
        </span>
        <button
          onClick={() => setShowQuickChat(false)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
        >
          ✕
        </button>
      </div>

      {/* Emoji Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {QUICK_EMOJIS.map((em, i) => (
          <button
            key={i}
            onClick={() => handleSend(em, null)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '1.5rem',
              padding: '8px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.background = 'rgba(229, 185, 76, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
          >
            {em}
          </button>
        ))}
      </div>

      {/* Canned Phrases List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {QUICK_MESSAGES.map((msg, i) => (
          <button
            key={i}
            onClick={() => handleSend(null, msg)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '7px 12px',
              textAlign: 'left',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(229, 185, 76, 0.12)'; e.currentTarget.style.borderColor = 'var(--gold-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            {msg}
          </button>
        ))}
      </div>
    </div>
  );
}
