/**
 * MemeOverlay — Animated Popups with Memes, GIFs & Funny Sounds.
 *
 * Triggers on major game moments:
 *  - +4 Wild Draw Four (Call an ambulance, Emotional damage, Trap card)
 *  - +5 Draw Five (Destruction 100, Boss music, GigaChad)
 *  - Big Accumulated Draw Penalty (Press F to Pay Respects, This is Fine, Bruh)
 *  - Stack Counters (No U, Parry this you casual)
 *  - Skip Everyone (Thanos: Fine I'll do it myself)
 */

import React, { useEffect } from 'react';
import useGameStore from '../../store/gameStore';
import sound from '../../utils/audio';
import useParticleWorker from '../../hooks/useParticleWorker';

export default function MemeOverlay() {
  const { activeMeme } = useGameStore();
  const { activeParticles, spawnBurst } = useParticleWorker();

  useEffect(() => {
    if (activeMeme && activeMeme.meme) {
      // Play sound effect from SoundEngine
      const soundFn = sound[activeMeme.meme.sound];
      if (typeof soundFn === 'function') {
        soundFn.call(sound);
      } else {
        sound.memeVineBoom();
      }

      sound.vibrate([60, 40, 60]);

      // Spawn multithreaded physics burst of emojis
      spawnBurst(40, 0.5, 0.45, activeMeme.meme.emojis || ['🔥', '💥', '🃏']);
    }
  }, [activeMeme?.timestamp]);

  if (!activeMeme || !activeMeme.meme) return null;

  const { meme, actorName, targetName, count } = activeMeme;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        pointerEvents: 'auto',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 8, 16, 0.65)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={() => useGameStore.setState({ activeMeme: null })}
      title="Tap to dismiss meme"
    >
      {/* Multithreaded Particle Stream rendered on top of overlay */}
      {activeParticles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
            opacity: p.alpha,
            fontSize: `${p.size}px`,
            pointerEvents: 'none',
            zIndex: 1005,
          }}
        >
          {p.emoji || (
            <div
              style={{
                width: p.size * 0.6,
                height: p.size * 0.6,
                borderRadius: '50%',
                background: p.color,
                boxShadow: `0 0 10px ${p.color}`,
              }}
            />
          )}
        </div>
      ))}

      {/* Radial Aura Shockwave behind card */}
      <div
        style={{
          position: 'absolute',
          width: 'clamp(320px, 80vw, 560px)',
          height: 'clamp(320px, 80vw, 560px)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${meme.shadowColor} 0%, transparent 70%)`,
          animation: 'pulseAttack 1.2s infinite alternate',
          pointerEvents: 'none',
        }}
      />

      {/* Main Comic/Meme Popup Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1010,
          background: meme.gradient,
          border: `3.5px solid ${meme.borderColor}`,
          boxShadow: `0 0 60px ${meme.shadowColor}, 0 25px 80px rgba(0,0,0,0.95)`,
          borderRadius: 28,
          padding: '24px 28px',
          maxWidth: 'min(92vw, 460px)',
          width: '100%',
          textAlign: 'center',
          animation: 'caughtStampSlam 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
          transform: 'rotate(-2deg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Top Badge Banner */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 16px',
            borderRadius: 99,
            background: 'rgba(0, 0, 0, 0.45)',
            border: `1.5px solid ${meme.borderColor}`,
            color: '#ffffff',
            fontSize: '0.78rem',
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span>{meme.emojis?.[0] || '⚡'}</span>
          <span>{meme.badge}</span>
          <span>{meme.emojis?.[1] || '⚡'}</span>
        </div>

        {/* Dynamic Animated Meme Illustration / Canvas */}
        <div
          style={{
            width: '100%',
            height: 120,
            borderRadius: 18,
            background: 'rgba(0, 0, 0, 0.55)',
            border: '2px dashed rgba(255, 255, 255, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated Background Rays */}
          <div
            style={{
              position: 'absolute',
              inset: -40,
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.08) 30deg, transparent 60deg, rgba(255,255,255,0.08) 90deg, transparent 120deg, rgba(255,255,255,0.08) 150deg, transparent 180deg, rgba(255,255,255,0.08) 210deg, transparent 240deg, rgba(255,255,255,0.08) 270deg, transparent 300deg, rgba(255,255,255,0.08) 330deg, transparent 360deg)',
              animation: 'spinSlow 12s linear infinite',
            }}
          />

          {/* Central Animated Emojis & Graphic */}
          <div style={{ fontSize: '3.6rem', position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.8))' }}>
            {meme.emojis?.join(' ') || '💥 🃏 💥'}
          </div>

          {count && count > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                background: '#dc2626',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.85rem',
                padding: '2px 12px',
                borderRadius: 99,
                zIndex: 3,
                boxShadow: '0 0 12px rgba(220, 38, 38, 0.8)',
              }}
            >
              +{count} CARDS
            </div>
          )}
        </div>

        {/* Big Meme Title */}
        <h2
          style={{
            fontSize: 'clamp(1.6rem, 5.5vw, 2.3rem)',
            fontWeight: 900,
            fontFamily: 'Outfit, Impact, sans-serif',
            color: '#ffffff',
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '0.02em',
            textShadow: '0 4px 18px rgba(0,0,0,0.9), 0 0 24px rgba(255,255,255,0.3)',
          }}
        >
          {meme.title}
        </h2>

        {/* Meme Subtitle */}
        <p
          style={{
            fontSize: '0.95rem',
            fontWeight: 800,
            color: '#fef08a',
            margin: 0,
            lineHeight: 1.3,
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {meme.subtitle}
        </p>

        {/* Player Attribution Pill */}
        {(actorName || targetName) && (
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#ffffff',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '6px 16px',
              borderRadius: 99,
              border: '1px solid rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {actorName && <span style={{ color: '#facc15' }}>{actorName}</span>}
            {actorName && targetName && <span>➔</span>}
            {targetName && <span style={{ color: '#f87171' }}>{targetName}</span>}
          </div>
        )}

        <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 }}>
          (Tap anywhere to dismiss)
        </div>
      </div>
    </div>
  );
}
