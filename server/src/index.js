/**
 * Express + Socket.IO server entry point.
 */

'use strict';

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const path       = require('path');

const { registerGameSocket } = require('./sockets/gameSocket');

const PORT = process.env.PORT || 3001;

// Global process error resilience
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});

const app    = express();
const server = http.createServer(app);

// Dynamic CORS supporting local dev, PWA standalone, Render, Vercel, and custom domains
const clientOrigin = process.env.CLIENT_ORIGIN;
const corsOrigin = clientOrigin
  ? (clientOrigin.includes(',') ? clientOrigin.split(',').map((s) => s.trim()) : clientOrigin)
  : true;

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const repository = require('./db/repository');
const { isConfigured } = require('./db/supabaseClient');

// Health check & status
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  supabaseConfigured: isConfigured,
  uptime: Math.round(process.uptime()),
}));

// Leaderboard endpoint
app.get('/api/stats/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const leaderboard = await repository.getLeaderboard(limit);
    res.json({ ok: true, leaderboard });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Player stats endpoint
app.get('/api/stats/player/:userId', async (req, res) => {
  try {
    const stats = await repository.getPlayerStats(req.params.userId);
    if (!stats) return res.status(404).json({ ok: false, error: 'PLAYER_NOT_FOUND' });
    res.json({ ok: true, stats });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Recent matches endpoint
app.get('/api/matches/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const matches = await repository.getRecentMatches(limit);
    res.json({ ok: true, matches });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const authCrypto = require('./services/authCrypto');
const storage = require('./db/storageEngine');

// ─── Authentication API (Unique ID + Password) ──────────────────────────────

// Register / Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    let { username, password, customId, avatar, frame } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return res.status(400).json({ ok: false, error: 'Display name must be at least 2 characters long' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 4 characters long' });
    }

    username = username.trim();

    // Determine Unique Player ID
    let userId = '';
    if (customId && typeof customId === 'string' && customId.trim()) {
      userId = customId.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,20}$/.test(userId)) {
        return res.status(400).json({ ok: false, error: 'Unique ID must be 3-20 alphanumeric characters' });
      }
      if (storage.getUserById(userId)) {
        return res.status(409).json({ ok: false, error: 'This Unique ID is already taken. Please choose another or generate one!' });
      }
    } else {
      let attempts = 0;
      do {
        userId = authCrypto.generateUniquePlayerId();
        attempts++;
      } while (storage.getUserById(userId) && attempts < 10);
    }

    // Cryptographic hash with PBKDF2 (asynchronous, non-blocking)
    const { hash, salt } = await authCrypto.hashPassword(password);
    const now = new Date().toISOString();

    const newUser = {
      id: userId,
      username,
      passwordHash: hash,
      salt,
      avatar: avatar || '👑',
      frame: frame || 'gold_royal',
      title: 'Card Novice',
      xp: 120,
      coins: 500,
      createdAt: now,
      lastLoginAt: now,
    };

    storage.saveUser(newUser);

    const token = authCrypto.generateSessionToken();

    const publicProfile = {
      id: newUser.id,
      username: newUser.username,
      avatar: newUser.avatar,
      frame: newUser.frame,
      title: newUser.title,
      xp: newUser.xp,
      coins: newUser.coins,
      createdAt: newUser.createdAt,
    };

    console.log(`[Auth] Registered player: ${username} (${userId})`);
    res.status(201).json({ ok: true, user: publicProfile, token });
  } catch (err) {
    console.error('[Auth] Signup error:', err);
    res.status(500).json({ ok: false, error: 'Failed to create account' });
  }
});

// Login with Unique ID and Password
app.post('/api/auth/login', async (req, res) => {
  try {
    const { id, password } = req.body;
    if (!id || !password) {
      return res.status(400).json({ ok: false, error: 'Unique ID and password are required' });
    }

    const cleanId = id.trim().toUpperCase();
    let user = storage.getUserById(cleanId);

    // Also check case-insensitive match by username if not found by ID
    if (!user) {
      user = storage.getUserByUsername(id.trim());
    }

    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found. Check your Unique ID or create a new account.' });
    }

    if (!user.passwordHash || !user.salt) {
      return res.status(400).json({ ok: false, error: 'Account has no password set. Please sign up.' });
    }

    // Verify cryptographic hash
    const isValid = await authCrypto.verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ ok: false, error: 'Incorrect password. Please try again.' });
    }

    user.lastLoginAt = new Date().toISOString();
    storage.saveUser(user);

    const token = authCrypto.generateSessionToken();

    const publicProfile = {
      id: user.id,
      username: user.username,
      avatar: user.avatar || '👑',
      frame: user.frame || 'gold_royal',
      title: user.title || 'Card Novice',
      xp: user.xp || 120,
      coins: user.coins || 500,
      createdAt: user.createdAt,
    };

    console.log(`[Auth] Player logged in: ${user.username} (${user.id})`);
    res.json({ ok: true, user: publicProfile, token });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ ok: false, error: 'Authentication failed' });
  }
});

// Generate random available Unique ID
app.get('/api/auth/generate-id', (_req, res) => {
  let id = '';
  let attempts = 0;
  do {
    id = authCrypto.generateUniquePlayerId();
    attempts++;
  } while (storage.getUserById(id) && attempts < 10);
  res.json({ ok: true, id });
});

// Upsert user profile
app.post('/api/users/profile', async (req, res) => {
  try {
    const { userId, username, avatar, frame } = req.body;
    if (!userId || !username) return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
    const user = await repository.upsertUser(userId, username, avatar);
    if (frame) storage.updateUser(userId, { frame });
    res.json({ ok: true, user });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Serve the built Vite client in production (or whenever client/dist exists)
const fs = require('fs');
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  console.log(`[Server] Serving static client build from ${clientDist}`);
  app.use(express.static(clientDist));
  // Express 5 compatible catch-all route for SPA client navigation
  app.get('{*splat}', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Register all Socket.IO event handlers
registerGameSocket(io);

server.listen(PORT, () => {
  console.log(`[Server] UNO game server running on http://localhost:${PORT}`);
});
