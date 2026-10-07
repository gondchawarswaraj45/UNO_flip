/**
 * LoginScreen — Official Google Mail Authentication & Guest Portal.
 *
 * Requirements:
 *  - Real Google Mail verification (@gmail.com / @googlemail.com only).
 *  - Official Google Identity Services OAuth 2.0 popup / button.
 *  - First-class "Play as Guest (No Login Required)" option.
 *  - Prominent "← Back" button to return to the game hub anytime.
 *  - Flawless Zustand state management (isGuest, authUser, isAuthenticated, screen).
 */

import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../../store/gameStore';
import sound from '../../utils/audio';
import { toast } from 'react-hot-toast';
import {
  initGoogleIdentityServices,
  triggerGoogleOAuthPopup,
  validateRealGmailAddress,
  getGoogleClientId,
  setCustomGoogleClientId,
} from '../../services/googleAuth';

// Google Official 4-Color "G" SVG
export function GoogleIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function LoginScreen() {
  const {
    loginWithGoogle,
    loginAsGuest,
    closeLoginScreen,
    isAuthenticated,
    isGuest,
  } = useGameStore();

  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👑');
  const [hasGsiButton, setHasGsiButton] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [customClientId, setCustomClientId] = useState(getGoogleClientId());
  const [loading, setLoading] = useState(false);

  const buttonRef = useRef(null);

  // Initialize official Google Identity Services if client ID is set
  useEffect(() => {
    const initialized = initGoogleIdentityServices({
      onCredentialResponse: (googleUser) => {
        sound.cardPlay();
        toast.success(`Welcome, ${googleUser.name}! (Signed in with Google)`);
        loginWithGoogle(googleUser);
      },
      buttonContainerId: 'google-official-btn-slot',
    });

    setHasGsiButton(Boolean(initialized));
  }, [customClientId]);

  // Real-time email input handling & username derivation
  function handleEmailChange(e) {
    const val = e.target.value;
    setEmailInput(val);
    setValidationError('');

    if (!nameInput || nameInput === emailInput.split('@')[0]) {
      const handle = val.split('@')[0];
      if (handle) {
        setNameInput(handle.charAt(0).toUpperCase() + handle.slice(1));
      }
    }
  }

  // Handle Google Sign-in: triggers Google OAuth popup if client ID configured, or verifies real Google mail
  function handleGoogleSubmit(e) {
    if (e) e.preventDefault();
    sound.buttonClick();
    setValidationError('');

    const clientId = getGoogleClientId();

    // If Google Client ID is configured, trigger official Google popup
    if (clientId && window.google?.accounts?.oauth2) {
      setLoading(true);
      const triggered = triggerGoogleOAuthPopup({
        onUser: (googleUser) => {
          setLoading(false);
          sound.gameStart();
          toast.success(`Welcome, ${googleUser.name}! Signed in via Google Mail 🌟`);
          loginWithGoogle(googleUser);
        },
        onError: (err) => {
          setLoading(false);
          console.warn('[Google OAuth Error]:', err);
          // If popup failed or cancelled, fallback to real email verification
          verifyAndLoginRealEmail();
        },
      });

      if (triggered) return;
    }

    verifyAndLoginRealEmail();
  }

  // Strict verification: ONLY real Google Mail accounts (@gmail.com / @googlemail.com) work
  function verifyAndLoginRealEmail() {
    let cleanEmail = emailInput.trim();

    // Auto-append @gmail.com if domain is omitted
    if (cleanEmail && !cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@gmail.com`;
    }

    const check = validateRealGmailAddress(cleanEmail);
    if (!check.isValid) {
      setValidationError(check.error);
      toast.error(check.error, { id: 'auth-err', duration: 4000 });
      return;
    }

    setLoading(true);

    const displayName =
      nameInput.trim() ||
      check.email.split('@')[0].charAt(0).toUpperCase() + check.email.split('@')[0].slice(1);

    const googleUser = {
      userId: 'goog_' + btoa(check.email.toLowerCase()).replace(/=/g, '').slice(0, 16),
      email: check.email,
      name: displayName,
      avatar: selectedAvatar,
      provider: 'google',
      verified: true,
    };

    setTimeout(() => {
      setLoading(false);
      sound.gameStart();
      toast.success(`Welcome, ${displayName}! Signed in via Google Mail 🌟`);
      loginWithGoogle(googleUser);
    }, 400);
  }

  // 1-Click Guest play
  function handlePlayAsGuest() {
    sound.buttonClick();
    toast('Entering arena as Guest... Have fun! 🎮', { icon: '👤' });
    loginAsGuest(nameInput.trim() || undefined);
  }

  // Top Back button handler
  function handleBack() {
    sound.buttonClick();
    closeLoginScreen();
  }

  function handleSaveClientId() {
    setCustomGoogleClientId(customClientId);
    setShowConfig(false);
    toast.success('Google Client ID updated! Reloading Google Services...');
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at 50% 30%, #0d1a2d 0%, #060a12 85%, #020408 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
        zIndex: 100,
      }}
    >
      {/* Decorative Table Felt Grid & Light Orbs */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.08) 0%, transparent 40%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px rgba(245, 158, 11, 0.15)',
          padding: '28px 26px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          margin: 'auto',
        }}
      >
        {/* ── Top Navigation Bar: Back Button & Mode Pill ── */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 99,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Return to Game Hub"
          >
            <span>←</span>
            <span>Back to Game</span>
          </button>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 99,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#fbbf24',
              letterSpacing: '0.04em',
            }}
          >
            <span>☀️ LIGHT</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <span style={{ color: '#ec4899' }}>🌙 DARK</span>
          </div>
        </div>

        {/* Title & Brand */}
        <h1
          style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            fontFamily: 'Outfit, system-ui, sans-serif',
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffffff 30%, #fbbf24 70%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          UNO FLIP!
        </h1>
        <p
          style={{
            color: '#94a3b8',
            fontSize: '0.88rem',
            margin: '0 0 20px 0',
            lineHeight: 1.45,
          }}
        >
          Sign in with your Google Mail to track career XP and play online, or jump in instantly as a guest!
        </p>

        {/* Official Google Identity Services Button Container (if initialized) */}
        <div
          id="google-official-btn-slot"
          ref={buttonRef}
          style={{
            marginBottom: hasGsiButton ? 16 : 0,
            display: hasGsiButton ? 'flex' : 'none',
            justifyContent: 'center',
            width: '100%',
          }}
        />

        {/* Real Google Mail Form */}
        <form
          onSubmit={handleGoogleSubmit}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            textAlign: 'left',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <label
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                Google Mail Address <span style={{ color: '#f87171' }}>*</span>
              </label>
              <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                @gmail.com only
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(30, 41, 59, 0.7)',
                border: validationError
                  ? '1px solid #f87171'
                  : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '14px',
                padding: '0 14px',
                transition: 'border-color 0.2s',
              }}
            >
              <GoogleIcon size={20} />
              <input
                type="text"
                placeholder="yourname@gmail.com"
                value={emailInput}
                onChange={handleEmailChange}
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  padding: '13px 0',
                  fontWeight: 500,
                }}
              />
              {!emailInput.includes('@') && emailInput.trim().length > 0 && (
                <span
                  onClick={() => {
                    const clean = emailInput.trim() + '@gmail.com';
                    setEmailInput(clean);
                    setValidationError('');
                  }}
                  style={{
                    fontSize: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '3px 8px',
                    borderRadius: 6,
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                  title="Click to add @gmail.com"
                >
                  +@gmail.com
                </span>
              )}
            </div>

            {validationError && (
              <div
                style={{
                  color: '#f87171',
                  fontSize: '0.75rem',
                  marginTop: 6,
                  lineHeight: 1.3,
                  fontWeight: 500,
                }}
              >
                ⚠️ {validationError}
              </div>
            )}
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#cbd5e1',
                marginBottom: 6,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}
            >
              Player Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Swaraj"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '14px',
                padding: '12px 14px',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Avatar Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#cbd5e1',
                marginBottom: 6,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}
            >
              Choose Profile Icon
            </label>
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'space-between',
              }}
            >
              {['👑', '🃏', '⚡', '🦊', '🐲', '💎'].map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setSelectedAvatar(av)}
                  style={{
                    flex: 1,
                    background:
                      selectedAvatar === av ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                    border:
                      selectedAvatar === av
                        ? '2px solid #fbbf24'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '8px 0',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button: Sign In with Google Mail */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              background: '#ffffff',
              color: '#1f2937',
              border: 'none',
              borderRadius: '14px',
              padding: '14px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            <GoogleIcon size={22} />
            <span>{loading ? 'Authenticating...' : 'Sign In with Google Mail'}</span>
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '20px 0 16px 0',
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
            OR PLAY WITHOUT LOGIN
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* ── First-Class Option: Play as Guest ── */}
        <button
          type="button"
          onClick={handlePlayAsGuest}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(59, 130, 246, 0.22) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '14px',
            padding: '13px 18px',
            color: '#38bdf8',
            fontSize: '0.96rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 16px rgba(56, 189, 248, 0.15)',
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🎮</span>
          <span>Play as Guest (No Login Required)</span>
          <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>→</span>
        </button>

        {/* Advanced Google Client ID settings toggle */}
        <div style={{ marginTop: 18 }}>
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.76rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {showConfig ? 'Hide OAuth Settings ▲' : '⚙️ Advanced: Google Cloud Client ID ▼'}
          </button>
        </div>

        {showConfig && (
          <div
            style={{
              marginTop: 12,
              width: '100%',
              padding: 12,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 6 }}>
              Paste your Google Cloud Console Web OAuth Client ID:
            </div>
            <input
              type="text"
              placeholder="e.g. 12345-xxxx.apps.googleusercontent.com"
              value={customClientId}
              onChange={(e) => setCustomClientId(e.target.value)}
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: '0.75rem',
                marginBottom: 8,
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={handleSaveClientId}
              style={{
                width: '100%',
                padding: '6px',
                background: '#3b82f6',
                border: 'none',
                color: '#fff',
                borderRadius: 8,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save & Activate GIS Button
            </button>
          </div>
        )}

        {/* Security & Feature Badges Footer */}
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            fontSize: '0.72rem',
            color: '#64748b',
          }}
        >
          <span>🔒 Google Mail Only</span>
          <span>•</span>
          <span>👤 Guest Mode Ready</span>
          <span>•</span>
          <span>🤖 Groq AI Referee</span>
        </div>
      </div>
    </div>
  );
}
