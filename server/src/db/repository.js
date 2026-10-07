/**
 * Repository layer for PostgreSQL / Supabase persistence.
 *
 * Persists:
 *   - Users / Player profiles
 *   - Rooms & membership audit
 *   - Game records / match history
 *   - Statistics & Leaderboards
 *
 * Real-time gameplay state is strictly kept in authoritative Node.js memory
 * and synchronized via Socket.IO.
 *
 * This layer is structured so Redis caching can easily sit in front of it
 * for horizontal scaling in the future.
 */

'use strict';

const { supabase, isConfigured } = require('./supabaseClient');
const storage = require('./storageEngine');

class GameRepository {
  /**
   * Upsert a user / player profile
   */
  async upsertUser(userId, username, avatar = null, email = null) {
    if (!userId) return null;
    const now = new Date().toISOString();

    if (isConfigured && supabase) {
      try {
        const payload = {
          id: userId,
          username: username || 'Player',
          avatar: avatar || null,
          avatar_url: avatar || null,
          last_seen_at: now,
        };
        if (email) payload.email = email;

        const { data, error } = await supabase
          .from('users')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .single();

        if (error) {
          console.warn('[Repository] upsertUser error:', error.message);
        } else {
          // Ensure player_stats row exists
          await supabase
            .from('player_stats')
            .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
          return data;
        }
      } catch (err) {
        console.warn('[Repository] upsertUser exception:', err.message);
      }
    }

    // Persistent storage engine
    const existing = storage.getUserById(userId);
    const user = {
      id: userId,
      username: username || existing?.username || 'Player',
      avatar: avatar || existing?.avatar || null,
      email: email || existing?.email || null,
      created_at: existing?.created_at || now,
      last_seen_at: now,
    };
    storage.saveUser(user);
    return user;
  }

  async getUserById(userId) {
    if (!userId) return null;
    return storage.getUserById(userId);
  }

  async getUserByUsername(username) {
    if (!username) return null;
    return storage.getUserByUsername(username);
  }

  /**
   * Record room creation in PostgreSQL
   */
  async createRoomRecord(roomCode, hostId, config = {}) {
    const now = new Date().toISOString();
    const record = {
      room_code: roomCode,
      host_id: hostId,
      game_mode: config.mode || 'CLASSIC',
      color_mode: config.colorMode || 'FOUR',
      status: 'WAITING',
      created_at: now,
      updated_at: now,
    };

    if (isConfigured && supabase) {
      try {
        const { error } = await supabase.from('rooms').insert([record]);
        if (error) console.warn('[Repository] createRoom error:', error.message);
      } catch (err) {
        console.warn('[Repository] createRoom exception:', err.message);
      }
    }

    memoryStore.rooms.set(roomCode, record);
    return record;
  }

  /**
   * Update room status ('WAITING', 'PLAYING', 'FINISHED', 'ABANDONED')
   */
  async updateRoomStatus(roomCode, status) {
    const now = new Date().toISOString();

    if (isConfigured && supabase) {
      try {
        await supabase
          .from('rooms')
          .update({ status, updated_at: now })
          .eq('room_code', roomCode);
      } catch (err) {
        console.warn('[Repository] updateRoomStatus exception:', err.message);
      }
    }

    const room = memoryStore.rooms.get(roomCode);
    if (room) {
      room.status = status;
      room.updated_at = now;
    }
  }

  /**
   * Log player membership in room
   */
  async recordPlayerJoin(roomCode, player, role = 'PLAYER') {
    const record = {
      room_code: roomCode,
      user_id: player.id,
      username: player.name || 'Player',
      is_bot: Boolean(player.isBot),
      role,
      joined_at: new Date().toISOString(),
    };

    if (isConfigured && supabase) {
      try {
        const { error } = await supabase.from('room_participants').insert([record]);
        if (error) {
          // Fallback to room_members if view/table differs
          await supabase.from('room_members').insert([record]);
        }
      } catch (err) {
        console.warn('[Repository] recordPlayerJoin exception:', err.message);
      }
    }

    memoryStore.roomMembers.push(record);
  }

  /**
   * Persist final match result and calculate player statistic updates
   */
  async saveGameRecord({
    roomCode,
    gameMode,
    colorMode,
    winnerId,
    winnerName,
    totalTurns = 0,
    durationSeconds = 0,
    totalFlips = 0,
    standings = [],
    playerActions = {}, // stats accrued during match (cardsPlayed, unoCalls, etc.)
  }) {
    const now = new Date().toISOString();
    const matchRecord = {
      room_code: roomCode,
      game_mode: gameMode,
      color_mode: colorMode,
      winner_id: winnerId,
      winner_name: winnerName,
      total_turns: totalTurns,
      duration_seconds: durationSeconds,
      total_flips: totalFlips,
      final_standings: standings,
      created_at: now,
    };

    let savedMatchId = null;

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('game_matches')
          .insert([matchRecord])
          .select('id')
          .single();

        if (error) {
          console.warn('[Repository] saveGameRecord error:', error.message);
        } else if (data) {
          savedMatchId = data.id;

          // Insert match_players breakdown
          const matchPlayersData = standings.map((st, idx) => ({
            match_id: savedMatchId,
            user_id: st.id,
            username: st.name,
            is_bot: Boolean(st.isBot),
            placement: idx + 1,
            cards_remaining: st.cardCount || 0,
            score_awarded: idx === 0 ? 100 : Math.max(0, 50 - (st.cardCount || 0) * 5),
          }));

          await supabase.from('match_players').insert(matchPlayersData);

          // Update statistics for non-bot players
          for (const st of standings) {
            if (st.isBot) continue;

            const isWinner = (st.id === winnerId);
            const scoreAwarded = isWinner ? 100 : Math.max(0, 50 - (st.cardCount || 0) * 5);
            const actions = playerActions[st.id] || {};

            // Fetch current stats or upsert
            const { data: currStats } = await supabase
              .from('player_stats')
              .select('*')
              .eq('user_id', st.id)
              .maybeSingle();

            const updated = {
              user_id: st.id,
              matches_played: (currStats?.matches_played || 0) + 1,
              matches_won: (currStats?.matches_won || 0) + (isWinner ? 1 : 0),
              cards_played: (currStats?.cards_played || 0) + (actions.cardsPlayed || 0),
              uno_calls: (currStats?.uno_calls || 0) + (actions.unoCalls || 0),
              caught_success: (currStats?.caught_success || 0) + (actions.caughtSuccess || 0),
              caught_penalized: (currStats?.caught_penalized || 0) + (actions.caughtPenalized || 0),
              total_score: (currStats?.total_score || 0) + scoreAwarded,
              updated_at: now,
            };

            await supabase
              .from('player_stats')
              .upsert(updated, { onConflict: 'user_id' });
          }
        }
      } catch (err) {
        console.warn('[Repository] saveGameRecord exception:', err.message);
      }
    }

    // In-memory fallback storage
    savedMatchId = savedMatchId || `match_${Date.now()}`;
    const storedMatch = { ...matchRecord, id: savedMatchId };
    memoryStore.gameMatches.unshift(storedMatch);

    standings.forEach((st, idx) => {
      memoryStore.matchPlayers.push({
        id: `mp_${Date.now()}_${idx}`,
        match_id: savedMatchId,
        user_id: st.id,
        username: st.name,
        is_bot: Boolean(st.isBot),
        rank: idx + 1,
        cards_remaining: st.cardCount || 0,
        score_awarded: idx === 0 ? 100 : Math.max(0, 50 - (st.cardCount || 0) * 5),
        created_at: now,
      });

      if (!st.isBot) {
        const stats = storage.getPlayerStats(st.id) || {
          user_id: st.id,
          username: st.name,
          matches_played: 0,
          matches_won: 0,
          cards_played: 0,
          uno_calls: 0,
          caught_success: 0,
          caught_penalized: 0,
          total_score: 0,
          updated_at: now,
        };

        const isWinner = (st.id === winnerId);
        const actions = playerActions[st.id] || {};
        stats.matches_played += 1;
        if (isWinner) stats.matches_won += 1;
        stats.cards_played += (actions.cardsPlayed || 0);
        stats.uno_calls += (actions.unoCalls || 0);
        stats.caught_success += (actions.caughtSuccess || 0);
        stats.caught_penalized += (actions.caughtPenalized || 0);
        stats.total_score += (isWinner ? 100 : Math.max(0, 50 - (st.cardCount || 0) * 5));
        stats.updated_at = now;
        storage.updatePlayerStats(st.id, stats);
      }
    });

    storage.recordMatch(storedMatch);
    console.log(`[Repository] Persisted match record: ${savedMatchId} for Room ${roomCode}. Winner: ${winnerName}`);
    return storedMatch;
  }

  /**
   * Retrieve player statistics
   */
  async getPlayerStats(userId) {
    if (!userId) return null;

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('player_stats')
          .select('*, users(username, avatar, avatar_url)')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return {
            userId: data.user_id,
            username: data.users?.username || 'Player',
            avatar: data.users?.avatar_url || data.users?.avatar || null,
            matchesPlayed: data.matches_played,
            matchesWon: data.matches_won,
            winRatePct: data.matches_played > 0 ? ((data.matches_won / data.matches_played) * 100).toFixed(1) : '0.0',
            cardsPlayed: data.cards_played,
            unoCalls: data.uno_calls,
            caughtSuccess: data.caught_success,
            totalScore: data.total_score,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('[Repository] getPlayerStats exception:', err.message);
      }
    }

    const stats = storage.getPlayerStats(userId);
    const user = storage.getUserById(userId);
    if (!stats) return null;

    return {
      userId: stats.user_id,
      username: user?.username || stats.username || 'Player',
      avatar: user?.avatar || null,
      matchesPlayed: stats.matches_played,
      matchesWon: stats.matches_won,
      winRatePct: stats.matches_played > 0 ? ((stats.matches_won / stats.matches_played) * 100).toFixed(1) : '0.0',
      cardsPlayed: stats.cards_played,
      unoCalls: stats.uno_calls,
      caughtSuccess: stats.caught_success,
      totalScore: stats.total_score,
      updatedAt: stats.updated_at,
    };
  }

  /**
   * Retrieve global leaderboard
   */
  async getLeaderboard(limit = 10) {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('leaderboard_view')
          .select('*')
          .limit(limit);

        if (!error && data && data.length > 0) {
          return data.map(row => ({
            userId: row.user_id,
            username: row.username,
            avatar: row.avatar,
            matchesPlayed: row.matches_played,
            matchesWon: row.matches_won,
            winRatePct: row.win_rate_pct,
            cardsPlayed: row.cards_played,
            unoCalls: row.uno_calls,
            caughtSuccess: row.caught_success,
            totalScore: row.total_score,
          }));
        }
      } catch (err) {
        console.warn('[Repository] getLeaderboard exception:', err.message);
      }
    }

    const list = storage.getLeaderboard(limit);
    return list.map(st => {
      const user = storage.getUserById(st.user_id);
      return {
        userId: st.user_id,
        username: user?.username || st.username || 'Player',
        avatar: user?.avatar || null,
        matchesPlayed: st.matches_played,
        matchesWon: st.matches_won,
        winRatePct: st.matches_played > 0 ? ((st.matches_won / st.matches_played) * 100).toFixed(1) : '0.0',
        cardsPlayed: st.cards_played,
        unoCalls: st.uno_calls,
        caughtSuccess: st.caught_success,
        totalScore: st.total_score,
      };
    });

    return list;
  }

  /**
   * Retrieve recent matches
   */
  async getRecentMatches(limit = 10) {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('game_matches')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('[Repository] getRecentMatches exception:', err.message);
      }
    }

    return memoryStore.gameMatches.slice(0, limit);
  }
}

module.exports = new GameRepository();
