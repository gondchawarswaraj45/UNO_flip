/*
 * memoryStore.js
 * In-memory store for active UNO Flip game state.
 * Provides simple collections used by the repository layer when
 * Supabase is not configured. This mirrors the structures expected
 * by repository.js: rooms (Map), roomMembers (Array), gameMatches (Array)
 * and matchPlayers (Array).
 */

'use strict';

class MemoryStore {
  constructor() {
    // Map of roomCode -> room record (used for quick lookup)
    this.rooms = new Map();
    // Array of participant records for all rooms (historical log)
    this.roomMembers = [];
    // Array of match records (most recent first)
    this.gameMatches = [];
    // Array of match player breakdowns
    this.matchPlayers = [];
  }
}

// Export a singleton instance.
module.exports = new MemoryStore();
