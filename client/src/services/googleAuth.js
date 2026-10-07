/**
 * Google Authentication Service.
 *
 * Integrates official Google Identity Services (GSI) with seamless token parsing,
 * client ID discovery, and zero-friction fallback flows.
 */

'use strict';

/**
 * Safely parse a Google ID Token (JWT) on the client side.
 */
export function parseGoogleJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('[GoogleAuth] Failed to parse JWT:', err);
    return null;
  }
}

/**
 * Get the active Google Client ID from environment variables or custom storage.
 */
export function getGoogleClientId() {
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
    localStorage.getItem('uno_custom_google_client_id') ||
    (typeof window !== 'undefined' && window.GOOGLE_CLIENT_ID) ||
    ''
  );
}

/**
 * Set or clear custom Google Client ID (useful for instant dev testing without rebuild).
 */
export function setCustomGoogleClientId(clientId) {
  try {
    if (clientId && clientId.trim()) {
      localStorage.setItem('uno_custom_google_client_id', clientId.trim());
    } else {
      localStorage.removeItem('uno_custom_google_client_id');
    }
  } catch (_) {}
}

/**
 * Initialize Google Identity Services (GIS) button and One Tap.
 */
export function initGoogleIdentityServices({ onCredentialResponse, buttonContainerId }) {
  const clientId = getGoogleClientId();
  if (!clientId || typeof window === 'undefined' || !window.google?.accounts?.id) {
    return false;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response && response.credential) {
          const payload = parseGoogleJwt(response.credential);
          if (payload && payload.email) {
            onCredentialResponse({
              userId: 'goog_' + payload.sub,
              email: payload.email,
              name: payload.name || payload.given_name || payload.email.split('@')[0],
              avatar: payload.picture || '👑',
              token: response.credential,
            });
          }
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    if (buttonContainerId) {
      const container = document.getElementById(buttonContainerId);
      if (container) {
        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 300,
        });
      }
    }

    try {
      window.google.accounts.id.prompt();
    } catch (_) {}

    return true;
  } catch (err) {
    console.warn('[GoogleAuth] GIS initialization failed:', err);
    return false;
  }
}
