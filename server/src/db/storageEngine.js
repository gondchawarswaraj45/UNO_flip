/**
 * Storage Engine — Professional Persistent Database & Storage Management.
 *
 * Implements a high-performance, ACID-resilient, atomic file-backed database
 * with in-memory caching and background disk syncing.
 * Persists to `server/data/uno_db.json`.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'uno_db.json');
const TMP_FILE = path.join(DATA_DIR, 'uno_db.tmp');

class StorageEngine {
  constructor() {
    this.users = new Map();         // id -> user record
    this.playerStats = new Map();   // userId -> stats record
    this.matches = [];              // match history list
    this.saveTimeout = null;
    this.isSaving = false;

    this.ensureDataDir();
    this.load();
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('[StorageEngine] Error creating data directory:', err);
      }
    }
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const data = JSON.parse(raw);

        if (Array.isArray(data.users)) {
          data.users.forEach((u) => {
            if (u && u.id) this.users.set(u.id, u);
          });
        }

        if (Array.isArray(data.playerStats)) {
          data.playerStats.forEach((s) => {
            if (s && s.user_id) this.playerStats.set(s.user_id, s);
          });
        }

        if (Array.isArray(data.matches)) {
          this.matches = data.matches;
        }

        console.log(`[StorageEngine] Loaded database from disk: ${this.users.size} users, ${this.matches.length} matches.`);
      } else {
        console.log('[StorageEngine] Initialized fresh persistent database.');
        this.persistImmediate();
      }
    } catch (err) {
      console.error('[StorageEngine] Failed to load database file, starting clean:', err.message);
    }
  }

  /**
   * Schedule debounced atomic save to disk
   */
  scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.persistImmediate();
    }, 400);
  }

  /**
   * Immediate atomic write to disk (write to temp file, then atomic rename)
   */
  persistImmediate() {
    this.ensureDataDir();
    try {
      const dump = {
        version: 1,
        savedAt: new Date().toISOString(),
        users: Array.from(this.users.values()),
        playerStats: Array.from(this.playerStats.values()),
        matches: this.matches.slice(-500), // Keep last 500 matches
      };

      const jsonStr = JSON.stringify(dump, null, 2);
      fs.writeFileSync(TMP_FILE, jsonStr, 'utf8');
      fs.renameSync(TMP_FILE, DB_FILE);
    } catch (err) {
      console.error('[StorageEngine] Failed to persist database:', err.message);
    }
  }

  // ── User Management ────────────────────────────────────────────────────────

  getUserById(id) {
    if (!id) return null;
    return this.users.get(id) || null;
  }

  getUserByUsername(username) {
    if (!username) return null;
    const lower = username.toLowerCase();
    for (const user of this.users.values()) {
      if (user.username && user.username.toLowerCase() === lower) {
        return user;
      }
    }
    return null;
  }

  saveUser(user) {
    if (!user || !user.id) return null;
    this.users.set(user.id, user);

    // Ensure playerStats row exists
    if (!this.playerStats.has(user.id)) {
      this.playerStats.set(user.id, {
        user_id: user.id,
        username: user.username,
        matches_played: 0,
        matches_won: 0,
        cards_played: 0,
        uno_calls: 0,
        caught_success: 0,
        caught_penalized: 0,
        total_score: 0,
        total_flips: 0,
        win_streak: 0,
        highest_streak: 0,
        updated_at: new Date().toISOString(),
      });
    } else {
      const st = this.playerStats.get(user.id);
      st.username = user.username;
    }

    this.scheduleSave();
    return user;
  }

  updateUser(id, updates) {
    const existing = this.getUserById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      lastSeenAt: new Date().toISOString(),
    };
    this.users.set(id, updated);

    if (updates.username && this.playerStats.has(id)) {
      this.playerStats.get(id).username = updates.username;
    }

    this.scheduleSave();
    return updated;
  }

  // ── Player Stats ───────────────────────────────────────────────────────────

  getPlayerStats(userId) {
    return this.playerStats.get(userId) || null;
  }

  updatePlayerStats(userId, statsUpdates) {
    let stats = this.playerStats.get(userId);
    if (!stats) {
      const user = this.getUserById(userId);
      stats = {
        user_id: userId,
        username: user ? user.username : 'Player',
        matches_played: 0,
        matches_won: 0,
        cards_played: 0,
        uno_calls: 0,
        caught_success: 0,
        caught_penalized: 0,
        total_score: 0,
        total_flips: 0,
        win_streak: 0,
        highest_streak: 0,
      };
      this.playerStats.set(userId, stats);
    }

    Object.assign(stats, statsUpdates, { updated_at: new Date().toISOString() });
    this.scheduleSave();
    return stats;
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────

  getLeaderboard(limit = 10) {
    const all = Array.from(this.playerStats.values());
    all.sort((a, b) => {
      // Sort by matches_won desc, then total_score desc
      if ((b.matches_won || 0) !== (a.matches_won || 0)) {
        return (b.matches_won || 0) - (a.matches_won || 0);
      }
      return (b.total_score || 0) - (a.total_score || 0);
    });
    return all.slice(0, limit);
  }

  // ── Match Records ──────────────────────────────────────────────────────────

  recordMatch(match) {
    if (!match) return;
    this.matches.push(match);
    this.scheduleSave();
  }

  getRecentMatches(limit = 10) {
    return this.matches.slice(-limit).reverse();
  }
}

// Singleton storage engine instance
const storage = new StorageEngine();

module.exports = storage;
