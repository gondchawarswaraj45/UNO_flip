/**
 * Socket.IO event handlers — the bridge between clients and the game engine.
 *
 * ALL game logic is delegated to the engine modules.
 * This file only handles: routing events, validating identity, emitting responses.
 *
 * Security principles:
 *  - Each client only receives their own private hand.
 *  - Public game state (no hands) is broadcast to all in the room.
 *  - Caught validation is server-authoritative.
 *  - Bot actions are triggered server-side, not by client messages.
 */

'use strict';

const {
  createRoom, joinRoom, addBot, removeBot,
  updateConfig, startGame, playerDisconnected,
  getRoom, getPlayerBySocketId, getLobbyState, deleteRoom,
} = require('../rooms/roomManager');

const {
  processPlayCard, processDrawCard, processPressUno,
  processCaught, getPublicState, getPlayerHand, drawCards,
} = require('../engine/game');

const { botDecide, botShouldPressUno, botThinkDelay } = require('../engine/ai');
const repository = require('../db/repository');

/**
 * Register all Socket.IO event handlers on the given io instance.
 *
 * @param {import('socket.io').Server} io
 */
function registerGameSocket(io) {

  // ─── Match End & Persistence Handler ──────────────────────────────────────

  async function handleGameOver(io, room) {
    if (!room || !room.gameState || room.gameState.status !== 'OVER' || room.isGameOverHandled) return;
    room.isGameOverHandled = true;

    const state = room.gameState;
    const winnerId = state.winner;
    const winnerPlayer = room.players.find(p => p.id === winnerId);
    const winnerName = winnerPlayer?.name || 'Player';

    const standings = [...room.players]
      .map(p => ({
        id: p.id,
        name: p.name,
        isBot: p.isBot,
        cardCount: (state.hands[p.id] || []).length,
      }))
      .sort((a, b) => a.cardCount - b.cardCount);

    const durationSeconds = Math.round((Date.now() - (state.startedAt || Date.now())) / 1000);

    // Asynchronously save persistent match record to Supabase / PostgreSQL
    const saved = await repository.saveGameRecord({
      roomCode: room.id,
      gameMode: room.config.mode,
      colorMode: room.config.colorMode,
      winnerId,
      winnerName,
      totalTurns: state.turnCount,
      durationSeconds,
      totalFlips: state.totalFlips || 0,
      standings,
      playerActions: state.playerActions || {},
    });

    await repository.updateRoomStatus(room.id, 'FINISHED');

    io.to(room.id).emit('gameOver', {
      winner: winnerId,
      winnerName,
      standings,
      totalTurns: state.turnCount,
      durationSeconds,
      totalFlips: state.totalFlips || 0,
      matchId: saved?.id || null,
    });
  }

  // ─── Utility: broadcast public state + private hands ──────────────────────

  function broadcastGameState(io, room) {
    const pub = getPublicState(room.gameState);
    io.to(room.id).emit('gameState', pub);

    // Send private hand to each human player
    for (const player of room.players) {
      if (!player.isBot && player.socketId) {
        const hand = getPlayerHand(player.id, room.gameState);
        io.to(player.socketId).emit('handUpdate', { cards: hand });
      }
    }
  }

  // ─── Bot turn executor ────────────────────────────────────────────────────

  /**
   * If the current player is a bot, schedule their turn.
   */
  function scheduleBotTurn(io, room) {
    const state = room.gameState;
    if (!state || state.status !== 'PLAYING') return;

    const currentPlayer = room.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer || !currentPlayer.isBot) return;

    const delay = botThinkDelay(currentPlayer.difficulty);

    setTimeout(() => {
      // Re-fetch state (it may have changed)
      const r = getRoom(room.id);
      if (!r || !r.gameState || r.gameState.status !== 'PLAYING') return;
      if (r.gameState.currentPlayerId !== currentPlayer.id) return;

      const decision = botDecide(currentPlayer.id, currentPlayer.difficulty, r.gameState);

      let result;
      if (decision.action === 'PLAY') {
        result = processPlayCard(
          currentPlayer.id,
          decision.cardId,
          decision.chosenColor,
          r.gameState,
          (event, data) => {
            if (event === 'gameOver') {
              io.to(r.id).emit('gameOver', data);
            }
          }
        );

        // Bot UNO press
        if (botShouldPressUno(currentPlayer.id, currentPlayer.difficulty, r.gameState)) {
          processPressUno(currentPlayer.id, r.gameState);
        }
      } else {
        result = processDrawCard(currentPlayer.id, r.gameState, () => {});
      }

      broadcastGameState(io, r);

      if (r.gameState.status === 'OVER') {
        handleGameOver(io, r);
        return;
      }

      // Recurse for next bot
      scheduleBotTurn(io, r);
    }, delay);
  }

  // ─── Connection ───────────────────────────────────────────────────────────

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ─── Lobby events ────────────────────────────────────────────────────

    socket.on('createRoom', ({ playerName, config, userId }, cb) => {
      try {
        const { room, playerId } = createRoom(socket.id, playerName, config || {}, userId);
        socket.join(room.id);
        socket.data.playerId = playerId;
        socket.data.roomId   = room.id;
        cb({ ok: true, roomId: room.id, playerId, lobby: getLobbyState(room) });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on('joinRoom', ({ roomId, playerName, userId }, cb) => {
      try {
        const result = joinRoom(roomId.toUpperCase(), socket.id, playerName, userId);
        if (result.error) return cb({ ok: false, error: result.error });

        socket.join(result.room.id);
        socket.data.playerId = result.playerId;
        socket.data.roomId   = result.room.id;

        // Notify others
        io.to(result.room.id).emit('lobbyUpdate', getLobbyState(result.room));
        cb({ ok: true, roomId: result.room.id, playerId: result.playerId, lobby: getLobbyState(result.room) });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on('addBot', ({ botName, difficulty }, cb) => {
      try {
        const roomId = socket.data.roomId;
        const room   = getRoom(roomId);
        if (!room) return cb({ ok: false, error: 'ROOM_NOT_FOUND' });

        const result = addBot(roomId, botName, difficulty);
        if (result.error) return cb({ ok: false, error: result.error });

        io.to(roomId).emit('lobbyUpdate', getLobbyState(result.room));
        cb({ ok: true, botId: result.botId });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on('removeBot', ({ botId }, cb) => {
      try {
        const roomId = socket.data.roomId;
        const result = removeBot(roomId, botId);
        if (result.error) return cb({ ok: false, error: result.error });

        io.to(roomId).emit('lobbyUpdate', getLobbyState(result.room));
        cb({ ok: true });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on('updateConfig', ({ config }, cb) => {
      try {
        const roomId = socket.data.roomId;
        const result = updateConfig(roomId, socket.data.playerId, config);
        if (result.error) return cb({ ok: false, error: result.error });

        io.to(roomId).emit('lobbyUpdate', getLobbyState(result.room));
        cb({ ok: true });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on('startGame', (_, cb) => {
      try {
        const roomId = socket.data.roomId;
        const result = startGame(roomId, socket.data.playerId);
        if (result.error) return (cb || (() => {}))({ ok: false, error: result.error });

        const room = result.room;
        io.to(roomId).emit('gameStarted', getLobbyState(room));
        broadcastGameState(io, room);

        // Trigger first bot turn if needed
        scheduleBotTurn(io, room);

        if (cb) cb({ ok: true });
      } catch (e) {
        if (cb) cb({ ok: false, error: e.message });
      }
    });

    // ─── In-game events ──────────────────────────────────────────────────

    socket.on('playCard', ({ cardId, chosenColor }, cb) => {
      try {
        const roomId   = socket.data.roomId;
        const playerId = socket.data.playerId;
        const room     = getRoom(roomId);
        if (!room || !room.gameState) return cb({ ok: false, error: 'GAME_NOT_STARTED' });

        const result = processPlayCard(
          playerId, cardId, chosenColor, room.gameState,
          (event, data) => {
            if (event === 'gameOver') io.to(roomId).emit('gameOver', data);
            if (event === 'caughtResolved') io.to(roomId).emit('caughtResolved', data);
          }
        );

        if (!result.success) return cb({ ok: false, error: result.error });

        broadcastGameState(io, room);

        if (room.gameState.status === 'OVER') {
          handleGameOver(io, room);
        } else {
          scheduleBotTurn(io, room);
        }

        cb({ ok: true, moveId: result.moveId });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on('drawCard', (_, cb) => {
      try {
        const roomId   = socket.data.roomId;
        const playerId = socket.data.playerId;
        const room     = getRoom(roomId);
        if (!room || !room.gameState) return cb({ ok: false, error: 'GAME_NOT_STARTED' });

        const result = processDrawCard(playerId, room.gameState, (event, data) => {
          if (event === 'caughtResolved') io.to(roomId).emit('caughtResolved', data);
        });

        if (!result.success) return cb({ ok: false, error: result.error });

        broadcastGameState(io, room);
        scheduleBotTurn(io, room);
        cb({ ok: true, moveId: result.moveId });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on('pressUno', (_, cb) => {
      try {
        const roomId   = socket.data.roomId;
        const playerId = socket.data.playerId;
        const room     = getRoom(roomId);
        if (!room || !room.gameState) return cb({ ok: false, error: 'GAME_NOT_STARTED' });

        const result = processPressUno(playerId, room.gameState);
        if (!result.success) return cb({ ok: false, error: result.error });

        // Broadcast that UNO was pressed (no hand info)
        io.to(roomId).emit('unoPressedBy', { playerId });
        cb({ ok: true });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on('pressCaught', ({ targetPlayerId, moveId }, cb) => {
      try {
        const roomId   = socket.data.roomId;
        const catcherId = socket.data.playerId;
        const room     = getRoom(roomId);
        if (!room || !room.gameState) return cb({ ok: false, error: 'GAME_NOT_STARTED' });

        const result = processCaught(
          catcherId, targetPlayerId, moveId, room.gameState,
          (event, data) => {
            if (event === 'caughtResolved') io.to(roomId).emit('caughtResolved', data);
            if (event === 'stateBroadcast') broadcastGameState(io, room);
          }
        );

        if (!result.success) return cb({ ok: false, error: result.error });

        cb({ ok: true });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    // ─── Real-Time Quick Chat & Emoji Reactions ──────────────────────────
    socket.on('sendReaction', ({ emoji, text }, cb) => {
      try {
        const roomId   = socket.data.roomId;
        const playerId = socket.data.playerId;
        const room     = getRoom(roomId);
        if (!room) return cb && cb({ ok: false, error: 'ROOM_NOT_FOUND' });

        const player = room.players.find(p => p.id === playerId);
        const reaction = {
          id: 'rx_' + Math.random().toString(36).substring(2, 8),
          playerId,
          playerName: player?.name || 'Player',
          emoji: emoji || null,
          text: text || null,
          timestamp: Date.now(),
        };

        io.to(roomId).emit('playerReaction', reaction);
        if (cb) cb({ ok: true, reaction });
      } catch (e) {
        if (cb) cb({ ok: false, error: e.message });
      }
    });

    // ─── Disconnection ───────────────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const info = playerDisconnected(socket.id);
      if (info) {
        io.to(info.room.id).emit('playerDisconnected', {
          playerId: info.player.id,
          name:     info.player.name,
        });
      }
    });
  });
}

module.exports = { registerGameSocket };
