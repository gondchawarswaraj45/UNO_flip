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

// Allow the Vite dev server (port 5173) and any same-origin production request
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
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

// Upsert user profile
app.post('/api/users/profile', async (req, res) => {
  try {
    const { userId, username, avatar } = req.body;
    if (!userId || !username) return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
    const user = await repository.upsertUser(userId, username, avatar);
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
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Register all Socket.IO event handlers
registerGameSocket(io);

server.listen(PORT, () => {
  console.log(`[Server] UNO game server running on http://localhost:${PORT}`);
});
