/**
 * Google Authentication Service.
 *
 * Provides:
 *  - Real Google Identity Services (GIS) OAuth 2.0 popup and button integration.
 *  - Strict verification for real Google Mail addresses (@gmail.com / @googlemail.com).
 *  - Guest play mode integration.
 */

'use strict';

/**
 * Strict verification for real Google Mail addresses.
 * Google mailbox constraints: 5 to 30 characters (letters, numbers, single dots),
 * ending strictly in @gmail.com or @googlemail.com.
 */
export function validateRealGmailAddress(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { isValid: false, error: 'Email address is required' };
  }

  const email = rawEmail.trim().toLowerCase();

  // Check if domain is gmail.com or googlemail.com
  const parts = email.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Please enter a complete email address (e.g. name@gmail.com)' };
  }

  const [username, domain] = parts;

  if (domain !== 'gmail.com' && domain !== 'googlemail.com') {
    return {
      isValid: false,
      error: `Only real Google Mail accounts (@gmail.com or @googlemail.com) are accepted. "${domain}" is not a Google Mail domain.`,
    };
  }

  // Google username rules: 5-30 chars, alphanumeric + dots, no consecutive dots
  if (username.length < 5 || username.length > 30) {
    return {
      isValid: false,
      error: 'Google Mail username must be between 5 and 30 characters long.',
    };
  }

  if (username.includes('..') || username.startsWith('.') || username.endsWith('.')) {
    return {
      isValid: false,
      error: 'Google Mail username cannot start/end with a period or have consecutive periods.',
    };
  }

  const validUsernameRegex = /^[a-zA-Z0-9](\.?[a-zA-Z0-9_-]){3,29}$/;
  if (!validUsernameRegex.test(username)) {
    return {
      isValid: false,
      error: 'Google Mail username contains invalid characters.',
    };
  }

  return { isValid: true, email };
}

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
 * Get active Google Client ID from environment variables or custom storage.
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
 * Save custom Google Client ID (for dev or custom OAuth client testing).
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
          width: 320,
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

/**
 * Trigger official Google OAuth 2.0 popup via TokenClient.
 */
export function triggerGoogleOAuthPopup({ onUser, onError }) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    if (onError) onError('MISSING_CLIENT_ID');
    return false;
  }

  if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
    if (onError) onError('GSI_NOT_LOADED');
    return false;
  }

  try {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          if (onError) onError(tokenResponse.error);
          return;
        }

        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          const userinfo = await res.json();
          if (userinfo && userinfo.email) {
            onUser({
              userId: 'goog_' + userinfo.sub,
              email: userinfo.email,
              name: userinfo.name || userinfo.given_name || userinfo.email.split('@')[0],
              avatar: userinfo.picture || '👑',
              token: tokenResponse.access_token,
            });
          } else {
            if (onError) onError('Failed to retrieve Google user information');
          }
        } catch (err) {
          if (onError) onError(err.message);
        }
      },
    });

    client.requestAccessToken({ prompt: 'select_account' });
    return true;
  } catch (err) {
    if (onError) onError(err.message);
    return false;
  }
}
