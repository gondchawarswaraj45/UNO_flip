import React, { useState, useEffect } from 'react';
import sound from '../../utils/audio';

/**
 * ShuffleDealAnimation — Cinematic deck shuffle & distribution animation
 * triggered at match start.
 */
export default function ShuffleDealAnimation({ activeSide = 'LIGHT', onComplete }) {
  const [phase, setPhase] = useState('SHUFFLE'); // 'SHUFFLE' | 'DEAL'

  useEffect(() => {
    // Phase 1: Play shuffle riffle sound
    sound.shuffleDeck();

    // Transition to Dealing phase after 1.1s
    const dealTimer = setTimeout(() => {
      setPhase('DEAL');
      sound.dealCard();
      setTimeout(() => sound.dealCard(), 180);
      setTimeout(() => sound.dealCard(), 360);
      setTimeout(() => sound.dealCard(), 540);
    }, 1100);

    // Complete dealing after 2.3s
    const finishTimer = setTimeout(() => {
      onComplete?.();
    }, 2350);

    return () => {
      clearTimeout(dealTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  const isDark = activeSide === 'DARK';

  return (
    <div className="deal-phase-overlay">
      {/* Golden Stage Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(229,185,76,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Animation Area */}
      <div
        style={{
          position: 'relative',
          width: 220,
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {phase === 'SHUFFLE' && (
          <div
            style={{
              position: 'relative',
              width: 140,
              height: 110,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Left Deck Half */}
            <div
              className="anim-shuffle-left"
              style={{
                position: 'absolute',
                width: 70,
                height: 104,
                borderRadius: 12,
                background: isDark
                  ? 'linear-gradient(135deg, #2d1045 0%, #150921 100%)'
                  : 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
                border: '2.5px solid #ffffff',
                boxShadow: '-6px 8px 24px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transformOrigin: 'bottom center',
              }}
            >
              <div
                style={{
                  width: '84%',
                  height: '55%',
                  borderRadius: '50%',
                  background: isDark ? 'rgba(168,85,247,0.3)' : 'rgba(234,179,8,0.25)',
                  transform: 'rotate(-26deg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 900,
                    fontStyle: 'italic',
                    fontSize: '1rem',
                    color: '#ffffff',
                    textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  }}
                >
                  FLIP
                </span>
              </div>
            </div>

            {/* Right Deck Half */}
            <div
              className="anim-shuffle-right"
              style={{
                position: 'absolute',
                width: 70,
                height: 104,
                borderRadius: 12,
                background: isDark
                  ? 'linear-gradient(135deg, #1e1136 0%, #431407 100%)'
                  : 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
                border: '2.5px solid #ffffff',
                boxShadow: '6px 8px 24px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transformOrigin: 'bottom center',
              }}
            >
              <div
                style={{
                  width: '84%',
                  height: '55%',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'rotate(-26deg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 900,
                    fontStyle: 'italic',
                    fontSize: '1rem',
                    color: '#ffffff',
                    textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  }}
                >
                  FLIP
                </span>
              </div>
            </div>
          </div>
        )}

        {phase === 'DEAL' && (
          <div style={{ position: 'relative', width: 70, height: 104 }}>
            {/* Center Base Deck */}
            <div
              style={{
                width: 70,
                height: 104,
                borderRadius: 12,
                background: isDark
                  ? 'linear-gradient(135deg, #2d1045 0%, #150921 100%)'
                  : 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
                border: '2.5px solid #ffffff',
                boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '1.4rem', color: '#facc15' }}>✦</span>
            </div>

            {/* Flying cards outwards to players */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 64,
                height: 96,
                borderRadius: 10,
                background: '#dc2626',
                border: '2px solid #fff',
                animation: 'dealFlyUp 0.65s cubic-bezier(0.2, 0.8, 0.25, 1) forwards',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 64,
                height: 96,
                borderRadius: 10,
                background: '#2563eb',
                border: '2px solid #fff',
                animation: 'dealFlyLeft 0.7s cubic-bezier(0.2, 0.8, 0.25, 1) 0.15s forwards',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 64,
                height: 96,
                borderRadius: 10,
                background: '#16a34a',
                border: '2px solid #fff',
                animation: 'dealFlyRight 0.7s cubic-bezier(0.2, 0.8, 0.25, 1) 0.25s forwards',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 64,
                height: 96,
                borderRadius: 10,
                background: '#ca8a04',
                border: '2px solid #fff',
                animation: 'dealFlyBottom 0.75s cubic-bezier(0.2, 0.8, 0.25, 1) 0.35s forwards',
              }}
            />
          </div>
        )}
      </div>

      {/* Status Title Banner */}
      <div
        style={{
          marginTop: 22,
          padding: '8px 22px',
          borderRadius: 99,
          background: 'rgba(15, 23, 42, 0.85)',
          border: isDark ? '1.5px solid rgba(168,85,247,0.5)' : '1.5px solid rgba(229,185,76,0.5)',
          boxShadow: isDark ? '0 0 24px rgba(168,85,247,0.4)' : '0 0 24px rgba(229,185,76,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>{phase === 'SHUFFLE' ? '🎴' : '✨'}</span>
        <span
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '0.95rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: isDark ? '#e9d5ff' : '#fef08a',
            textTransform: 'uppercase',
          }}
        >
          {phase === 'SHUFFLE' ? 'Shuffling Deck…' : 'Distributing Hands…'}
        </span>
      </div>

      {/* Skip Button */}
      <button
        onClick={onComplete}
        style={{
          marginTop: 18,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 99,
          padding: '6px 16px',
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.04em',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
        }}
      >
        Skip ⏩
      </button>
    </div>
  );
}
