/**
 * Room Manager.
 *
 * Manages game rooms — creation, joining, game start, session retention, and cleanup.
 * Each room has a unique 6-character ID and holds the full game state.
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const { createGame, getPublicState, getPlayerHand } = require('../engine/game');
const { DEFAULT_CONFIG } = require('../engine/config');
const repository = require('../db/repository');

// In-memory room store for ultra-low-latency real-time active state.
const rooms = new Map(); // roomId -> Room

// ─── Room Structure ───────────────────────────────────────────────────────────

/**
 * @typedef {object} Room
 * @property {string}   id
 * @property {string}   hostId       Socket ID of the room creator
 * @property {object}   config       Merged GameConfig
 * @property {Player[]} players      Connected players (ordered)
 * @property {object|null} gameState  Full internal game state (null until started)
 * @property {'LOBBY'|'PLAYING'|'OVER'} status
 */

/**
 * @typedef {object} Player
 * @property {string}  id           Unique player ID (stable user ID)
 * @property {string}  socketId     Current socket connection ID
 * @property {string}  name
 * @property {boolean} isBot
 * @property {string}  [sessionToken] Secret authentication token for session resumption
 * @property {boolean} [connected]  Whether socket is actively connected
 * @property {number}  [disconnectedAt] Timestamp of last disconnect
 * @property {string}  [difficulty] 'EASY'|'MEDIUM'|'HARD' — bots only
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Room CRUD ────────────────────────────────────────────────────────────────

/**
 * Create a new room.
 *
 * @param {string} hostSocketId
 * @param {string} hostName
 * @param {object} config  Partial GameConfig
 * @param {string} [providedUserId]
 * @returns {{ room: Room, playerId: string, sessionToken: string }}
 */
function createRoom(hostSocketId, hostName, config = {}, providedUserId = null) {
  let roomId;
  // Avoid collisions
  do { roomId = generateRoomCode(); } while (rooms.has(roomId));

  const sessionToken = uuidv4();
  const hostPlayer = {
    id:             providedUserId || uuidv4(),
    socketId:       hostSocketId,
    name:           hostName,
    isBot:          false,
    sessionToken:   sessionToken,
    connected:      true,
    disconnectedAt: null,
  };

  const room = {
    id:        roomId,
    hostId:    hostPlayer.id,
    config:    Object.assign({}, DEFAULT_CONFIG, config),
    players:   [hostPlayer],
    gameState: null,
    status:    'LOBBY',
    isPaused:  false,
    isSolo:    false,
    isOffline: false,
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);

  // Asynchronously log to PostgreSQL / Supabase
  repository.upsertUser(hostPlayer.id, hostName);
  repository.createRoomRecord(roomId, hostPlayer.id, room.config);
  repository.recordPlayerJoin(roomId, hostPlayer, 'HOST');

  return { room, playerId: hostPlayer.id, sessionToken };
}

/**
 * Join an existing room or reconnect an existing player to their seat.
 *
 * @param {string} roomId
 * @param {string} socketId
 * @param {string} playerName
 * @param {string} [providedUserId]
 * @param {string} [sessionToken]
 * @returns {{ room: Room, playerId: string, sessionToken: string }|{ error: string }}
 */
function joinRoom(roomId, socketId, playerName, providedUserId = null, sessionToken = null) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };

  // Check if player is an existing participant reconnecting / refreshing
  const existingPlayer = room.players.find(p =>
    (providedUserId && p.id === providedUserId) ||
    (sessionToken && p.sessionToken && p.sessionToken === sessionToken) ||
    (!p.isBot && p.name.toLowerCase() === playerName.toLowerCase() && p.connected === false)
  );

  if (existingPlayer) {
    const reconnected = reconnectPlayer(roomId, existingPlayer.id, sessionToken || existingPlayer.sessionToken, socketId);
    if (!reconnected.error) {
      return { room: reconnected.room, playerId: existingPlayer.id, sessionToken: existingPlayer.sessionToken };
    }
  }

  if (room.status !== 'LOBBY') return { error: 'GAME_ALREADY_STARTED' };
  if (room.players.length >= room.config.maxPlayers) return { error: 'ROOM_FULL' };

  // Check for duplicate name among actively connected players
  if (room.players.find(p => p.name.toLowerCase() === playerName.toLowerCase() && !p.isBot && p.connected !== false)) {
    return { error: 'NAME_TAKEN' };
  }

  const newSessionToken = uuidv4();
  const player = {
    id:             providedUserId || uuidv4(),
    socketId:       socketId,
    name:           playerName,
    isBot:          false,
    sessionToken:   newSessionToken,
    connected:      true,
    disconnectedAt: null,
  };

  room.players.push(player);

  // Asynchronously log to PostgreSQL / Supabase
  repository.upsertUser(player.id, playerName);
  repository.recordPlayerJoin(room.id, player, 'PLAYER');

  return { room, playerId: player.id, sessionToken: newSessionToken };
}

/**
 * Reconnect an existing player to their active room session.
 *
 * @param {string} roomId
 * @param {string} playerId
 * @param {string} [sessionToken]
 * @param {string} newSocketId
 * @returns {{ room: Room, player: Player }|{ error: string }}
 */
function reconnectPlayer(roomId, playerId, sessionToken, newSocketId) {
  if (!roomId) return { error: 'ROOM_CODE_REQUIRED' };
  const room = rooms.get(roomId.toUpperCase());
  if (!room) return { error: 'ROOM_NOT_FOUND' };

  const player = room.players.find(p => p.id === playerId || (sessionToken && p.sessionToken && p.sessionToken === sessionToken));
  if (!player) return { error: 'PLAYER_NOT_FOUND_IN_ROOM' };

  // Security validation: verify sessionToken if both exist
  if (player.sessionToken && sessionToken && player.sessionToken !== sessionToken) {
    return { error: 'INVALID_SESSION_TOKEN' };
  }

  // Clear disconnect timeout if one was running
  if (player._disconnectTimer) {
    clearTimeout(player._disconnectTimer);
    player._disconnectTimer = null;
  }

  // Update socket binding & connection status
  player.socketId = newSocketId;
  player.connected = true;
  player.disconnectedAt = null;

  if (room.isOffline) {
    room.hostSocketId = newSocketId;
  }

  if (room.hostId === player.id) {
    room.hostSocketId = newSocketId;
  }

  return { room, player };
}

/**
 * Handle a player leaving the game room voluntarily.
 * In multiplayer matches with real players, leaving constitutes a forfeit.
 *
 * @param {string} roomId
 * @param {string} playerId
 * @param {boolean} [isForfeit=false]
 * @returns {{ success: boolean, room?: Room, wasDeleted?: boolean, convertedToBot?: boolean, forfeited?: boolean, error?: string }}
 */
function leaveRoom(roomId, playerId, isForfeit = false) {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: 'ROOM_NOT_FOUND' };

  const player = room.players.find(p => p.id === playerId);
  if (player && player._disconnectTimer) {
    clearTimeout(player._disconnectTimer);
    player._disconnectTimer = null;
  }

  if (room.status === 'LOBBY') {
    const idx = room.players.findIndex(p => p.id === playerId);
    if (idx !== -1) {
      room.players.splice(idx, 1);
    }
    const remainingHumans = room.players.filter(p => !p.isBot);
    if (remainingHumans.length === 0) {
      rooms.delete(roomId);
      return { success: true, wasDeleted: true };
    }
    if (room.hostId === playerId) {
      room.hostId = remainingHumans[0].id;
    }
    return { success: true, room };
  }

  if (room.status === 'PLAYING') {
    const isMultiplayer = !room.isSolo && !room.isOffline;
    if (player) {
      if (isMultiplayer || isForfeit) {
        player.forfeited = true;
        try {
          repository.recordPlayerAction(room.id, playerId, 'FORFEIT').catch(() => {});
        } catch (_) {}
      }

      const remainingHumans = room.players.filter(p => !p.isBot && p.id !== playerId && p.connected !== false && !p.forfeited);
      if (remainingHumans.length === 0) {
        if (room._botTimer) {
          clearTimeout(room._botTimer);
          room._botTimer = null;
          room._botTimerPlayerId = null;
        }
        rooms.delete(roomId);
        return { success: true, wasDeleted: true, forfeited: isMultiplayer || isForfeit };
      } else {
        // Substitute leaving/forfeiting player with AI bot so remaining players continue smoothly
        player.isBot = true;
        player.name = player.name.includes('(Bot)') ? player.name : `${player.name} (Bot)`;
        player.difficulty = 'MEDIUM';
        player.connected = false;
        return { success: true, room, convertedToBot: true, forfeited: isMultiplayer || isForfeit };
      }
    }
  }

  return { success: true, room };
}

/**
 * Pause game (available for Play with Computer / solo matches).
 */
function pauseGame(roomId, playerId) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (!room.isSolo && !room.isOffline) {
    return { error: 'CANNOT_PAUSE_MULTIPLAYER' };
  }
  room.isPaused = true;
  if (room.gameState) room.gameState.isPaused = true;
  if (room._botTimer) {
    clearTimeout(room._botTimer);
    room._botTimer = null;
    room._botTimerPlayerId = null;
  }
  return { ok: true, room };
}

/**
 * Resume game from pause state.
 */
function resumeGame(roomId, playerId) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  room.isPaused = false;
  if (room.gameState) room.gameState.isPaused = false;
  return { ok: true, room };
}

/**
 * Add a bot to a room.
 *
 * @param {string} roomId
 * @param {string} botName
 * @param {string} difficulty
 * @returns {{ room: Room, botId: string }|{ error: string }}
 */
function addBot(roomId, botName, difficulty) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.status !== 'LOBBY') return { error: 'GAME_ALREADY_STARTED' };
  if (room.players.length >= room.config.maxPlayers) return { error: 'ROOM_FULL' };

  const bot = {
    id:         uuidv4(),
    socketId:   null,
    name:       botName || `Bot ${room.players.length}`,
    isBot:      true,
    difficulty: difficulty || 'MEDIUM',
  };

  room.players.push(bot);
  repository.recordPlayerJoin(room.id, bot, 'BOT');
  return { room, botId: bot.id };
}

/**
 * Remove a bot from a room.
 */
function removeBot(roomId, botId) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.status !== 'LOBBY') return { error: 'GAME_ALREADY_STARTED' };

  const idx = room.players.findIndex(p => p.id === botId && p.isBot);
  if (idx === -1) return { error: 'BOT_NOT_FOUND' };

  room.players.splice(idx, 1);
  return { room };
}

/**
 * Update room config (host only, before game starts).
 */
function updateConfig(roomId, requesterId, newConfig) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  const host = room.players.find(p => p.id === requesterId);
  if (!host || room.hostId !== requesterId) return { error: 'NOT_HOST' };
  if (room.status !== 'LOBBY') return { error: 'GAME_ALREADY_STARTED' };

  room.config = Object.assign({}, room.config, newConfig);
  return { room };
}

/**
 * Start the game.
 *
 * @param {string} roomId
 * @param {string} requesterId
 * @returns {{ room: Room }|{ error: string }}
 */
function startGame(roomId, requesterId) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.hostId !== requesterId) return { error: 'NOT_HOST' };
  if (room.status !== 'LOBBY') return { error: 'GAME_ALREADY_STARTED' };
  if (room.players.length < room.config.minPlayers) return { error: 'NOT_ENOUGH_PLAYERS' };

  room.gameState = createGame(room.config, room.players);
  room.status    = 'PLAYING';
  repository.updateRoomStatus(room.id, 'PLAYING');
  return { room };
}

/**
 * Handle a player disconnecting.
 * Marks them as disconnected and records timestamp.
 */
function playerDisconnected(socketId) {
  for (const [roomId, room] of rooms) {
    const player = room.players.find(p => p.socketId === socketId);
    if (player) {
      player.connected = false;
      player.disconnectedAt = Date.now();
      // If playing with computer / offline, immediately pause game and freeze bot timers
      if (room.isSolo || room.isOffline) {
        room.isPaused = true;
        if (room.gameState) room.gameState.isPaused = true;
        if (room._botTimer) {
          clearTimeout(room._botTimer);
          room._botTimer = null;
          room._botTimerPlayerId = null;
        }
      }
      return { room, player };
    }
  }
  return null;
}

/**
 * Find a room by ID.
 */
function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

/**
 * Find a room by socket ID.
 */
function getRoomBySocketId(socketId) {
  for (const room of rooms.values()) {
    if (room.players.find(p => p.socketId === socketId)) return room;
  }
  return null;
}

/**
 * Find a player across all rooms by their socket ID.
 */
function getPlayerBySocketId(socketId) {
  for (const room of rooms.values()) {
    const player = room.players.find(p => p.socketId === socketId);
    if (player) return { room, player };
  }
  return null;
}

/**
 * Delete a room after game over or abandonment.
 */
function deleteRoom(roomId) {
  rooms.delete(roomId);
}

/**
 * Get public lobby state (safe to broadcast).
 */
function getLobbyState(room) {
  return {
    roomId:    room.id,
    hostId:    room.hostId,
    config:    room.config,
    status:    room.status,
    isSolo:    !!room.isSolo,
    isOffline: !!room.isOffline,
    isPaused:  !!room.isPaused,
    players:   room.players.map(p => ({
      id:         p.id,
      name:       p.name,
      isBot:      p.isBot,
      difficulty: p.difficulty,
      forfeited:  !!p.forfeited,
      connected:  p.connected !== false,
    })),
  };
}

const SOLO_BOT_NAMES = ['Maya (Bot)', 'Alex (Bot)', 'Sam (Bot)', 'Leo (Bot)', 'Zoe (Bot)'];

/**
 * Instantly launch a Solo Game against Computer Bots without intermediate lobby.
 */
function createSoloGame(hostSocketId, hostName, config = {}, botCount = 3, difficulty = 'MEDIUM', providedUserId = null) {
  const { room, playerId, sessionToken } = createRoom(hostSocketId, hostName, config, providedUserId);
  room.isSolo = true;
  const count = Math.min(Math.max(1, botCount), 5);
  for (let i = 0; i < count; i++) {
    const name = SOLO_BOT_NAMES[i % SOLO_BOT_NAMES.length];
    addBot(room.id, name, difficulty);
  }
  const started = startGame(room.id, playerId);
  if (started.error) return { error: started.error };
  return { room: started.room, playerId, sessionToken };
}

/**
 * Matchmaking: Find an open public match or create a new public room.
 */
function findOrCreateQuickMatch(hostSocketId, hostName, config = {}, providedUserId = null) {
  // Find any waiting quick-match room
  for (const room of rooms.values()) {
    if (room.status === 'LOBBY' && room.isQuickMatch && room.players.length < (room.config.maxPlayers || 4)) {
      const joinResult = joinRoom(room.id, hostSocketId, hostName, providedUserId);
      if (!joinResult.error) {
        return joinResult;
      }
    }
  }

  // Create new quick-match room
  const { room, playerId, sessionToken } = createRoom(hostSocketId, hostName, config, providedUserId);
  room.isQuickMatch = true;
  return { room, playerId, sessionToken };
}

/**
 * Instantly launch an Offline Pass & Play Game on the same device.
 */
function createOfflineGame(hostSocketId, playerNames = ['Player 1', 'Player 2'], config = {}, providedUserId = null) {
  const hostName = (playerNames && playerNames[0]) ? playerNames[0].trim() : 'Player 1';
  const { room, playerId, sessionToken } = createRoom(hostSocketId, hostName, config, providedUserId);
  room.isOffline = true;
  room.hostSocketId = hostSocketId;

  // Add the remaining local players as offline human seats
  const names = Array.isArray(playerNames) && playerNames.length >= 2 ? playerNames : ['Player 1', 'Player 2'];
  for (let i = 1; i < names.length; i++) {
    const pName = (names[i] && names[i].trim()) || `Player ${i + 1}`;
    const pId = uuidv4();
    room.players.push({
      id:            pId,
      socketId:      hostSocketId, // shared device connection
      name:          pName,
      isBot:         false,
      isOfflineSeat: true,
      difficulty:    null,
      score:         0,
      connected:     true,
    });
  }

  const started = startGame(room.id, playerId);
  if (started.error) return { error: started.error };
  return { room: started.room, playerId, sessionToken };
}

module.exports = {
  createRoom,
  joinRoom,
  addBot,
  removeBot,
  updateConfig,
  startGame,
  createSoloGame,
  createOfflineGame,
  findOrCreateQuickMatch,
  playerDisconnected,
  reconnectPlayer,
  leaveRoom,
  pauseGame,
  resumeGame,
  getRoom,
  getRoomBySocketId,
  getPlayerBySocketId,
  deleteRoom,
  getLobbyState,
};
