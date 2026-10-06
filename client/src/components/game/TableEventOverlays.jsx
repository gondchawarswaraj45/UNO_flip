/**
 * TableEventOverlays — Screen-wide cinematic animation banners for UNO and CAUGHT.
 *
 * Ensures ALL players (host, opponents, local pass & play, bots) visually and audibly
 * experience whenever anyone calls UNO or successfully executes a CAUGHT challenge.
 */

import React from 'react';
import useGameStore from '../../store/gameStore';

export default function TableEventOverlays() {
  const { unoSplash, caughtSplash } = useGameStore();

  if (!unoSplash && !caughtSplash) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* ── 1. CAUGHT SCREEN-WIDE SIREN & STAMP OVERLAY ── */}
      {caughtSplash && (
        <>
          {/* Emergency Siren Perimeter Flash */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              animation: 'sirenPerimeter 0.5s infinite',
              background: 'rgba(220, 38, 38, 0.18)',
            }}
          />

          {/* Heavy Rubber Stamp Alert Badge */}
          <div
            style={{
              position: 'relative',
              animation: 'caughtStampSlam 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
              background: 'linear-gradient(135deg, #1c0a0a 0%, #2e0909 50%, #450a0a 100%)',
              border: '4px solid #ef4444',
              borderRadius: 24,
              padding: '24px 36px',
              textAlign: 'center',
              boxShadow: '0 0 50px rgba(239, 68, 68, 0.8), 0 20px 60px rgba(0,0,0,0.9)',
              maxWidth: 'min(90vw, 440px)',
              transform: 'rotate(-4deg)',
            }}
          >
            {/* Caution Bar Top */}
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 900,
                color: '#fca5a5',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>🚨</span>
              <span>VIOLATION DETECTED</span>
              <span>🚨</span>
            </div>

            {/* Giant Stamp Heading */}
            <div
              style={{
                fontSize: 'clamp(2.8rem, 8vw, 4.2rem)',
                fontWeight: 900,
                fontFamily: 'Outfit, sans-serif',
                fontStyle: 'italic',
                lineHeight: 1,
                letterSpacing: '0.04em',
                color: '#ffffff',
                textShadow: '0 4px 18px rgba(239, 68, 68, 0.9), 0 0 35px rgba(239, 68, 68, 0.6)',
                marginBottom: 10,
              }}
            >
              CAUGHT!
            </div>

            {/* Subtitle Details */}
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#fee2e2',
                marginBottom: 6,
              }}
            >
              <span style={{ color: '#facc15' }}>{caughtSplash.catcherName}</span> caught{' '}
              <span style={{ color: '#f87171' }}>{caughtSplash.targetName}</span>!
            </div>

            <div
              style={{
                fontSize: '0.82rem',
                color: '#cbd5e1',
                marginBottom: 12,
              }}
            >
              Forgot to call UNO with 1 card left!
            </div>

            {/* Penalty Pill */}
            <div
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.9rem',
                padding: '6px 18px',
                borderRadius: 99,
                letterSpacing: '0.06em',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.6)',
              }}
            >
              +{caughtSplash.penaltyCards} CARDS PENALTY DRAWN
            </div>
          </div>
        </>
      )}

      {/* ── 2. UNO CELEBRATORY SCREEN-WIDE SPLASH OVERLAY ── */}
      {unoSplash && !caughtSplash && (
        <>
          {/* Radial Gold/Crimson Vignette */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at center, rgba(229, 185, 76, 0.25) 0%, rgba(220, 38, 38, 0.2) 60%, transparent 100%)',
              animation: 'fadeIn 0.2s ease',
            }}
          />

          {/* Expanding Shockwave Ring */}
          <div
            style={{
              position: 'absolute',
              width: 300,
              height: 300,
              borderRadius: '50%',
              border: '3px solid rgba(229, 185, 76, 0.8)',
              animation: 'shockwaveRing 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite',
            }}
          />

          {/* 3D Glossy UNO Badge */}
          <div
            style={{
              position: 'relative',
              animation: 'unoBadgePop 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
              background: 'linear-gradient(135deg, #831843 0%, #b91c1c 45%, #e11d48 100%)',
              border: '4px solid #facc15',
              borderRadius: 32,
              padding: '24px 44px',
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(229, 185, 76, 0.9), 0 20px 60px rgba(0,0,0,0.85)',
              maxWidth: 'min(90vw, 420px)',
            }}
          >
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 900,
                color: '#fef08a',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>✨</span>
              <span>1 CARD REMAINING</span>
              <span>✨</span>
            </div>

            {/* Huge Glowing UNO Numeral/Text */}
            <div
              style={{
                fontSize: 'clamp(3.4rem, 10vw, 5.2rem)',
                fontWeight: 900,
                fontFamily: 'Outfit, sans-serif',
                fontStyle: 'italic',
                lineHeight: 0.95,
                letterSpacing: '0.02em',
                color: '#ffffff',
                textShadow: '0 6px 24px rgba(0, 0, 0, 0.7), 0 0 35px rgba(250, 204, 21, 0.8)',
                marginBottom: 8,
              }}
            >
              UNO!
            </div>

            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                color: '#ffffff',
                marginBottom: 4,
              }}
            >
              {unoSplash.playerName}
            </div>

            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#fde047',
                letterSpacing: '0.04em',
              }}
            >
              Called UNO in time! Watch out!
            </div>
          </div>
        </>
      )}
    </div>
  );
}
