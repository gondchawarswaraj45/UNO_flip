/**
 * Client Authentication Service.
 *
 * Connects to the server backend API for:
 *  - Player account registration with Unique ID + Password
 *  - Player login with Unique ID + Password
 *  - Generating suggestions for unique player IDs
 */

'use strict';

const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173') {
    return 'http://localhost:3001';
  }
  return '';
};

/**
 * Register a new player account
 */
export async function signupPlayer({ username, password, customId, avatar, frame }) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, customId, avatar, frame }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to create account');
  }

  return data;
}

/**
 * Login player with Unique ID (or display name) and password
 */
export async function loginPlayer({ id, password }) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Authentication failed');
  }

  return data;
}

/**
 * Request an auto-generated unique ID suggestion
 */
export async function fetchSuggestedId() {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/auth/generate-id`);
    const data = await res.json();
    return data.id || `UNO-${Math.floor(1000 + Math.random() * 9000)}`;
  } catch (_) {
    return `UNO-${Math.floor(1000 + Math.random() * 9000)}`;
  }
}
