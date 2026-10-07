/**
 * LoginScreen — Professional Account Authentication & Guest Portal.
 *
 * Requirements:
 *  - Each user has Unique Player ID, Display Name, and Password.
 *  - Login via Unique ID and Password.
 *  - Create Account with custom or auto-generated Unique ID, Display Name, and Password.
 *  - Persistent storage & session state management.
 *  - Prominent "← Back to Game" navigation.
 *  - First-class "Play as Guest" mode.
 */

import React, { useState, useEffect } from 'react';
import useGameStore from '../../store/gameStore';
import sound from '../../utils/audio';
import { toast } from 'react-hot-toast';
import { fetchSuggestedId } from '../../services/authService';

export default function LoginScreen() {
  const {
    loginWithAccount,
    signupWithAccount,
    loginAsGuest,
    closeLoginScreen,
  } = useGameStore();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form state
  const [signupId, setSignupId] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('👑');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-generate suggested ID on signup mount
  useEffect(() => {
    if (mode === 'signup' && !signupId) {
      handleGenerateId();
    }
  }, [mode]);

  async function handleGenerateId() {
    try {
      const id = await fetchSuggestedId();
      setSignupId(id);
    } catch (_) {
      setSignupId(`UNO-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }

  // Handle Login submission
  async function handleLoginSubmit(e) {
    if (e) e.preventDefault();
    sound.buttonClick();
    setErrorMsg('');

    const id = loginId.trim();
    const password = loginPassword;

    if (!id) {
      setErrorMsg('Please enter your Unique Player ID or Username');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithAccount(id, password);
      sound.gameStart();
      toast.success(`Welcome back, ${user.username}! (ID: ${user.id}) 🌟`);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Check your ID and password.');
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  // Handle Signup submission
  async function handleSignupSubmit(e) {
    if (e) e.preventDefault();
    sound.buttonClick();
    setErrorMsg('');

    const customId = signupId.trim().toUpperCase();
    const username = signupName.trim();
    const password = signupPassword;

    if (!username) {
      setErrorMsg('Please enter your display name');
      return;
    }
    if (username.length < 2) {
      setErrorMsg('Display name must be at least 2 characters long');
      return;
    }
    if (!password) {
      setErrorMsg('Please create a password');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Password must be at least 4 characters long');
      return;
    }

    setLoading(true);
    try {
      const user = await signupWithAccount({
        customId: customId || undefined,
        username,
        password,
        avatar: selectedAvatar,
      });
      sound.gameStart();
      toast.success(`Account created! Your Unique ID is ${user.id} 🎉`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create account');
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  // Handle 1-click Guest Play
  function handlePlayAsGuest() {
    sound.buttonClick();
    toast('Entering arena as Guest... Have fun! 🎮', { icon: '👤' });
    loginAsGuest();
  }

  // Handle Back Button
  function handleBack() {
    sound.buttonClick();
    closeLoginScreen();
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
      {/* Decorative Table Felt Ambient Orbs */}
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
          maxWidth: '450px',
          background: 'rgba(15, 23, 42, 0.94)',
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
        {/* ── Top Bar: Back Button & Mode Pill ── */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
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
            margin: '0 0 18px 0',
            lineHeight: 1.45,
          }}
        >
          {mode === 'login'
            ? 'Sign in with your Unique Player ID and Password.'
            : 'Create your permanent player account and claim your Unique ID.'}
        </p>

        {/* ── Mode Toggle Tabs (Log In vs Create Account) ── */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            gap: 6,
            background: 'rgba(0, 0, 0, 0.35)',
            padding: 4,
            borderRadius: 14,
            marginBottom: 18,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => { sound.buttonClick(); setMode('login'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 10,
              border: 'none',
              background: mode === 'login' ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
              color: mode === 'login' ? '#fbbf24' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            🔑 Log In
          </button>
          <button
            type="button"
            onClick={() => { sound.buttonClick(); setMode('signup'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 10,
              border: 'none',
              background: mode === 'signup' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: mode === 'signup' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            ✨ Create Account
          </button>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div
            style={{
              width: '100%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 12,
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: '0.82rem',
              textAlign: 'left',
              marginBottom: 14,
              lineHeight: 1.35,
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ── Form 1: Log In ── */}
        {mode === 'login' && (
          <form
            onSubmit={handleLoginSubmit}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              textAlign: 'left',
            }}
          >
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
                Unique Player ID or Username
              </label>
              <input
                type="text"
                placeholder="e.g. UNO-7821 or Swaraj"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
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
                Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  padding: '0 14px',
                }}
              >
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    padding: '12px 0',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '1.05rem',
                    padding: '4px',
                  }}
                  title={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#1a1200',
                border: 'none',
                borderRadius: '14px',
                padding: '13px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 18px rgba(245, 158, 11, 0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              <span>{loading ? 'Verifying...' : 'Sign In to Arena'}</span>
              <span>→</span>
            </button>
          </form>
        )}

        {/* ── Form 2: Create Account ── */}
        {mode === 'signup' && (
          <form
            onSubmit={handleSignupSubmit}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              textAlign: 'left',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#cbd5e1',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  Unique Player ID
                </label>
                <button
                  type="button"
                  onClick={handleGenerateId}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  🎲 Auto-Generate
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. UNO-7821 or SWARAJ45"
                value={signupId}
                onChange={(e) => setSignupId(e.target.value.toUpperCase())}
                required
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  padding: '11px 14px',
                  color: '#38bdf8',
                  fontSize: '0.95rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  marginBottom: 5,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Swaraj"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  padding: '11px 14px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  marginBottom: 5,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                Create Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  padding: '0 14px',
                }}
              >
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  placeholder="Min 4 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    padding: '11px 0',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '1.05rem',
                    padding: '4px',
                  }}
                  title={showSignupPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignupPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  marginBottom: 5,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                Choose Profile Icon
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                {['👑', '🃏', '⚡', '🦊', '🐲', '💎'].map((av) => (
                  <button
                    type="button"
                    key={av}
                    onClick={() => setSelectedAvatar(av)}
                    style={{
                      flex: 1,
                      background:
                        selectedAvatar === av ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                      border:
                        selectedAvatar === av
                          ? '2px solid #38bdf8'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '7px 0',
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

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '13px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 18px rgba(37, 99, 235, 0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              <span>{loading ? 'Creating...' : 'Create Account & Play'}</span>
              <span>→</span>
            </button>
          </form>
        )}

        {/* Divider */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '20px 0 14px 0',
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
            OR PLAY WITHOUT ACCOUNT
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* Play as Guest Button */}
        <button
          type="button"
          onClick={handlePlayAsGuest}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '12px 18px',
            color: '#e2e8f0',
            fontSize: '0.94rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🎮</span>
          <span>Play as Guest (Instant Access)</span>
          <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>→</span>
        </button>

        {/* Footer Features & Storage Badges */}
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            justifyContent: 'center',
            gap: 14,
            fontSize: '0.72rem',
            color: '#64748b',
          }}
        >
          <span>🔒 Salted PBKDF2</span>
          <span>•</span>
          <span>💾 Persistent Database</span>
          <span>•</span>
          <span>⚡ Worker Threads</span>
        </div>
      </div>
    </div>
  );
}
