/**
 * Room Manager.
 *
 * Manages game rooms — creation, joining, game start, and cleanup.
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
 * @returns {Room}
 */
function createRoom(hostSocketId, hostName, config = {}, providedUserId = null) {
  let roomId;
  // Avoid collisions
  do { roomId = generateRoomCode(); } while (rooms.has(roomId));

  const hostPlayer = {
    id:       providedUserId || uuidv4(),
    socketId: hostSocketId,
    name:     hostName,
    isBot:    false,
  };

  const room = {
    id:        roomId,
    hostId:    hostPlayer.id,
    config:    Object.assign({}, DEFAULT_CONFIG, config),
    players:   [hostPlayer],
    gameState: null,
    status:    'LOBBY',
  };

  rooms.set(roomId, room);

  // Asynchronously log to PostgreSQL / Supabase
  repository.upsertUser(hostPlayer.id, hostName);
  repository.createRoomRecord(roomId, hostPlayer.id, room.config);
  repository.recordPlayerJoin(roomId, hostPlayer, 'HOST');

  return { room, playerId: hostPlayer.id };
}

/**
 * Join an existing room.
 *
 * @param {string} roomId
 * @param {string} socketId
 * @param {string} playerName
 * @param {string} [providedUserId]
 * @returns {{ room: Room, playerId: string }|{ error: string }}
 */
function joinRoom(roomId, socketId, playerName, providedUserId = null) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.status !== 'LOBBY') return { error: 'GAME_ALREADY_STARTED' };
  if (room.players.length >= room.config.maxPlayers) return { error: 'ROOM_FULL' };

  // Check for duplicate name
  if (room.players.find(p => p.name === playerName && !p.isBot)) {
    return { error: 'NAME_TAKEN' };
  }

  const player = {
    id:       providedUserId || uuidv4(),
    socketId: socketId,
    name:     playerName,
    isBot:    false,
  };

  room.players.push(player);

  // Asynchronously log to PostgreSQL / Supabase
  repository.upsertUser(player.id, playerName);
  repository.recordPlayerJoin(room.id, player, 'PLAYER');

  return { room, playerId: player.id };
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
 * Marks them as disconnected but keeps them in the room.
 * TODO: implement reconnection grace period for production.
 */
function playerDisconnected(socketId) {
  for (const [roomId, room] of rooms) {
    const player = room.players.find(p => p.socketId === socketId);
    if (player) {
      player.connected = false;
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
 * Delete a room after game over.
 */
function deleteRoom(roomId) {
  rooms.delete(roomId);
}

/**
 * Get public lobby state (safe to broadcast).
 */
function getLobbyState(room) {
  return {
    roomId:  room.id,
    hostId:  room.hostId,
    config:  room.config,
    status:  room.status,
    players: room.players.map(p => ({
      id:         p.id,
      name:       p.name,
      isBot:      p.isBot,
      difficulty: p.difficulty,
      connected:  p.connected !== false,
    })),
  };
}

const SOLO_BOT_NAMES = ['Maya (Bot)', 'Alex (Bot)', 'Sam (Bot)', 'Leo (Bot)', 'Zoe (Bot)'];

/**
 * Instantly launch a Solo Game against Computer Bots without intermediate lobby.
 */
function createSoloGame(hostSocketId, hostName, config = {}, botCount = 3, difficulty = 'MEDIUM', providedUserId = null) {
  const { room, playerId } = createRoom(hostSocketId, hostName, config, providedUserId);
  const count = Math.min(Math.max(1, botCount), 5);
  for (let i = 0; i < count; i++) {
    const name = SOLO_BOT_NAMES[i % SOLO_BOT_NAMES.length];
    addBot(room.id, name, difficulty);
  }
  const started = startGame(room.id, playerId);
  if (started.error) return { error: started.error };
  return { room: started.room, playerId };
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
  const { room, playerId } = createRoom(hostSocketId, hostName, config, providedUserId);
  room.isQuickMatch = true;
  return { room, playerId };
}

/**
 * Instantly launch an Offline Pass & Play Game on the same device.
 */
function createOfflineGame(hostSocketId, playerNames = ['Player 1', 'Player 2'], config = {}, providedUserId = null) {
  const hostName = (playerNames && playerNames[0]) ? playerNames[0].trim() : 'Player 1';
  const { room, playerId } = createRoom(hostSocketId, hostName, config, providedUserId);
  room.isOffline = true;
  room.hostSocketId = hostSocketId;

  // Add the remaining local players as offline human seats
  const names = Array.isArray(playerNames) && playerNames.length >= 2 ? playerNames : ['Player 1', 'Player 2'];
  for (let i = 1; i < names.length; i++) {
    const pName = (names[i] && names[i].trim()) || `Player ${i + 1}`;
    const pId = uuidv4();
    room.players.push({
      id: pId,
      socketId: hostSocketId, // shared device connection
      name: pName,
      isBot: false,
      isOfflineSeat: true,
      difficulty: null,
      score: 0,
      connected: true,
    });
  }

  const started = startGame(room.id, playerId);
  if (started.error) return { error: started.error };
  return { room: started.room, playerId };
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
  getRoom,
  getRoomBySocketId,
  getPlayerBySocketId,
  deleteRoom,
  getLobbyState,
};
