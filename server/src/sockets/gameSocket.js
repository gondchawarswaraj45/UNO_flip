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
  updateConfig, startGame, createSoloGame, createOfflineGame, findOrCreateQuickMatch,
  playerDisconnected, getRoom, getPlayerBySocketId, getLobbyState, deleteRoom,
} = require('../rooms/roomManager');

const {
  processPlayCard, processDrawCard, processPassTurn, processPressUno,
  processCaught, getPublicState, getPlayerHand, drawCards,
} = require('../engine/game');

const { botDecide, botShouldPressUno, botThinkDelay } = require('../engine/ai');
const repository = require('../db/repository');
const { generateRefereeCommentary } = require('../services/groqService');

/**
 * Register all Socket.IO event handlers on the given io instance.
 *
 * @param {import('socket.io').Server} io
 */
function registerGameSocket(io) {

  function emitReferee(roomId, eventType, context = {}) {
    generateRefereeCommentary(eventType, context)
      .then((commentary) => {
        if (commentary) {
          io.to(roomId).emit('refereeCommentary', {
            text: commentary,
            eventType,
            timestamp: Date.now(),
          });
        }
      })
      .catch((err) => {
        console.error('[Groq Referee Error]:', err?.message);
      });
  }

  // ─── Match End & Persistence Handler ──────────────────────────────────────

  async function handleGameOver(io, room) {
    if (!room || !room.gameState || room.gameState.status !== 'OVER' || room.isGameOverHandled) return;
    room.isGameOverHandled = true;

    const state = room.gameState;
    const winnerId = state.winner;
    const winnerPlayer = room.players.find(p => p.id === winnerId);
    const winnerName = winnerPlayer?.name || 'Player';

    // Determine standings based on true multi-player finish order
    let standings = [];
    if (state.finishers && state.finishers.length > 0) {
      standings = state.finishers.map(f => {
        const playerObj = room.players.find(p => p.id === f.playerId);
        return {
          id: f.playerId,
          name: f.playerName || playerObj?.name || 'Player',
          isBot: !!(f.isBot ?? playerObj?.isBot),
          cardCount: f.cardCount || 0,
          rank: f.rank,
        };
      });
      // Append any players that did not finish (in case of disconnect or error)
      for (const p of room.players) {
        if (!standings.some(s => s.id === p.id)) {
          standings.push({
            id: p.id,
            name: p.name,
            isBot: p.isBot,
            cardCount: (state.hands[p.id] || []).length,
            rank: standings.length + 1,
          });
        }
      }
    } else {
      standings = [...room.players]
        .map((p, idx) => ({
          id: p.id,
          name: p.name,
          isBot: p.isBot,
          cardCount: (state.hands[p.id] || []).length,
          rank: idx + 1,
        }))
        .sort((a, b) => a.cardCount - b.cardCount);
    }

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

    emitReferee(room.id, 'WIN', { actorName: winnerName });
  }

  // ─── Utility: broadcast public state + private hands ──────────────────────

  function broadcastGameState(io, room) {
    const pub = getPublicState(room.gameState);
    pub.isOffline = !!room.isOffline;
    io.to(room.id).emit('gameState', pub);

    if (room.isOffline) {
      // In offline pass & play, emit the active turn player's hand to the host socket
      const activeHand = getPlayerHand(room.gameState.currentPlayerId, room.gameState);
      io.to(room.hostSocketId).emit('handUpdate', {
        cards: activeHand,
        activePlayerId: room.gameState.currentPlayerId,
        isOffline: true,
      });
    } else {
      // Send private hand to each human player
      for (const player of room.players) {
        if (!player.isBot && player.socketId) {
          const hand = getPlayerHand(player.id, room.gameState);
          io.to(player.socketId).emit('handUpdate', { cards: hand });
        }
      }
    }

    // Safety net: whenever game state is broadcast, if current player is a bot, ensure bot turn is scheduled!
    if (room.gameState && room.gameState.status === 'PLAYING') {
      const cur = room.players.find((p) => p.id === room.gameState.currentPlayerId);
      if (cur && cur.isBot) {
        scheduleBotTurn(io, room);
      }
    }
  }

  // ─── Bot Turn & Simulation System ──────────────────────────────────────────

  /**
   * If the current player is a bot, schedule their turn.
   */
  function scheduleBotTurn(io, room) {
    const state = room.gameState;
    if (!state || state.status !== 'PLAYING') return;

    const currentPlayer = room.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer || !currentPlayer.isBot) {
      if (room._botTimer) {
        clearTimeout(room._botTimer);
        room._botTimer = null;
        room._botTimerPlayerId = null;
      }
      return;
    }

    // Avoid double-scheduling if already active for this exact player's turn
    if (room._botTimer && room._botTimerPlayerId === currentPlayer.id) {
      return;
    }

    if (room._botTimer) {
      clearTimeout(room._botTimer);
      room._botTimer = null;
    }

    let delay = botThinkDelay(currentPlayer.difficulty);
    // Add extra suspense after penalty cards or deck flip so players can digest the move
    if (state.lastActionNotification && (state.lastActionNotification.drawCount > 0 || state.lastActionNotification.type === 'FLIP' || state.lastActionNotification.type === 'SKIP_EVERYONE' || state.lastActionNotification.type === 'WILD_DRAW_COLOR')) {
      delay += 850;
    }

    // Broadcast thinking indicator so opponents show animated "Thinking..." bubble
    io.to(room.id).emit('botThinking', { botId: currentPlayer.id, thinking: true });

    room._botTimerPlayerId = currentPlayer.id;
    room._botTimer = setTimeout(() => {
      room._botTimer = null;
      room._botTimerPlayerId = null;
      try {
        io.to(room.id).emit('botThinking', { botId: currentPlayer.id, thinking: false });

        // Re-fetch state (it may have changed)
        const r = getRoom(room.id);
        if (!r || !r.gameState || r.gameState.status !== 'PLAYING') return;
        if (r.gameState.currentPlayerId !== currentPlayer.id) return;

        const decision = botDecide(currentPlayer.id, currentPlayer.difficulty, r.gameState);

        let result;
        if (decision.action === 'PLAY' && decision.cardId) {
          result = processPlayCard(
            currentPlayer.id,
            decision.cardId,
            decision.chosenColor,
            r.gameState,
            (event, data) => {
              if (event === 'gameOver') {
                io.to(r.id).emit('gameOver', data);
              } else if (event === 'playerDrewPenalty') {
                io.to(r.id).emit('actionAlert', data);
              } else if (event === 'playerFinished') {
                io.to(r.id).emit('playerFinished', data);
              }
            }
          );

          // If playing failed (e.g. card invalid or stale state), fallback to draw so bot never hangs!
          if (!result || !result.success) {
            result = processDrawCard(currentPlayer.id, r.gameState, () => {});
          } else {
            // Bot UNO press with broadcast event and reaction bubble
            if (botShouldPressUno(currentPlayer.id, currentPlayer.difficulty, r.gameState)) {
              processPressUno(currentPlayer.id, r.gameState);
              io.to(r.id).emit('unoPressedBy', {
                playerId: currentPlayer.id,
                playerName: currentPlayer.name,
                timestamp: Date.now(),
              });
              io.to(r.id).emit('playerReaction', {
                id: 'rx_' + Math.random().toString(36).substring(2, 8),
                playerId: currentPlayer.id,
                playerName: currentPlayer.name,
                emoji: '🚨',
                text: 'UNO!',
                timestamp: Date.now(),
              });
            }

            // Contextual bot reactions & AI Referee commentary on special card plays
            const top = r.gameState.discardPile[r.gameState.discardPile.length - 1];
            const face = r.gameState.activeSide === 'DARK' ? top?.darkSide : top?.lightSide;
            if (face?.type === 'FLIP') {
              triggerBotReactions(io, r, 'FLIP', currentPlayer.id);
              emitReferee(r.id, 'FLIP', { actorName: currentPlayer.name });
            } else if (face?.type === 'SKIP_EVERYONE') {
              emitReferee(r.id, 'SKIP_EVERYONE', { actorName: currentPlayer.name });
            } else if (face?.type === 'WILD_DRAW_COLOR') {
              emitReferee(r.id, 'WILD_DRAW_COLOR', { actorName: currentPlayer.name, color: decision.chosenColor });
            } else if (face?.type === 'DRAW_FIVE' || face?.type === 'WILD_DRAW_FOUR' || face?.type === 'WILD_DRAW_TWO') {
              triggerBotReactions(io, r, 'DRAW_HEAVY', currentPlayer.id);
            }
          }
        } else {
          // Bot takes cards (either penalty stack or normal 1-card draw)
          const wasUnderStack = !!(r.gameState.pendingDrawStack && r.gameState.pendingDrawStack.active);
          result = processDrawCard(currentPlayer.id, r.gameState, (event, data) => {
            if (event === 'playerDrewPenalty') io.to(r.id).emit('actionAlert', data);
          });
          broadcastGameState(io, r);

          if (wasUnderStack) {
            // Penalty stack drawn: turn advanced automatically to next player
            if (r.gameState.status === 'OVER') {
              handleGameOver(io, r);
              return;
            }
            scheduleBotTurn(io, r);
            return;
          }

          // Give a short human-like pause before bot drops card or passes
          setTimeout(() => {
            try {
              const r2 = getRoom(room.id);
              if (!r2 || !r2.gameState || r2.gameState.status !== 'PLAYING') return;
              if (r2.gameState.currentPlayerId !== currentPlayer.id) return;

              // Check if bot can legally play (e.g. the drawn card matches)
              const postDraw = botDecide(currentPlayer.id, currentPlayer.difficulty, r2.gameState);
              if (postDraw.action === 'PLAY' && postDraw.cardId) {
                const playRes = processPlayCard(
                  currentPlayer.id,
                  postDraw.cardId,
                  postDraw.chosenColor,
                  r2.gameState,
                  (event, data) => {
                    if (event === 'gameOver') io.to(r2.id).emit('gameOver', data);
                    else if (event === 'playerDrewPenalty') io.to(r2.id).emit('actionAlert', data);
                    else if (event === 'playerFinished') io.to(r2.id).emit('playerFinished', data);
                  }
                );
                if (playRes && playRes.success) {
                  if (botShouldPressUno(currentPlayer.id, currentPlayer.difficulty, r2.gameState)) {
                    processPressUno(currentPlayer.id, r2.gameState);
                    io.to(r2.id).emit('unoPressedBy', {
                      playerId: currentPlayer.id,
                      playerName: currentPlayer.name,
                      timestamp: Date.now(),
                    });
                  }
                } else {
                  // Fallback: pass turn
                  processPassTurn(currentPlayer.id, r2.gameState, () => {});
                }
              } else {
                // Cannot play: pass turn
                processPassTurn(currentPlayer.id, r2.gameState, () => {});
              }

              broadcastGameState(io, r2);

              if (r2.gameState.status === 'OVER') {
                handleGameOver(io, r2);
                return;
              }

              scheduleBotTurn(io, r2);
            } catch (botPostErr) {
              console.error('[Bot Post-Draw Error]:', botPostErr);
              try {
                const rFallback = getRoom(room.id);
                if (rFallback && rFallback.gameState && rFallback.gameState.hasDrawnThisTurn) {
                  processPassTurn(currentPlayer.id, rFallback.gameState, () => {});
                  broadcastGameState(io, rFallback);
                  scheduleBotTurn(io, rFallback);
                }
              } catch (_) {}
            }
          }, 650);
          return;
        }

        broadcastGameState(io, r);

        if (r.gameState.status === 'OVER') {
          handleGameOver(io, r);
          return;
        }

        // Check if caught window opened for human or opponent
        if (r.gameState.caughtWindow && r.gameState.caughtWindow.active) {
          scheduleBotCaughtChallenge(io, r);
        }

        // Recurse for next bot
        scheduleBotTurn(io, r);
      } catch (err) {
        console.error('[Bot Turn Error]:', err);
        // Resilient recovery: force a draw to ensure the game advances
        try {
          const r = getRoom(room.id);
          if (r && r.gameState && r.gameState.status === 'PLAYING') {
            processDrawCard(currentPlayer.id, r.gameState, () => {});
            broadcastGameState(io, r);
            scheduleBotTurn(io, r);
          }
        } catch (_) {}
      }
    }, delay);
  }

  /**
   * Challenge Caught window on behalf of an AI bot if a player failed to call UNO.
   */
  function scheduleBotCaughtChallenge(io, room) {
    const state = room.gameState;
    if (!state || !state.caughtWindow || !state.caughtWindow.active) return;
    const { moveId, targetPlayerId } = state.caughtWindow;

    // Check if target player has 1 card and forgot UNO
    const targetHand = state.hands[targetPlayerId] || [];
    const targetCalledUno = state.unoPressedBy[targetPlayerId];
    if (targetHand.length !== 1 || targetCalledUno) return;

    // Find AI bots that can challenge (not the target)
    const bots = room.players.filter(p => p.isBot && p.id !== targetPlayerId);
    if (bots.length === 0) return;

    // Pick a bot
    const bot = bots[Math.floor(Math.random() * bots.length)];
    let chance = 0.45;
    let delay = 1400;
    if (bot.difficulty === 'HARD') {
      chance = 0.75;
      delay = 1000 + Math.random() * 450;
    } else if (bot.difficulty === 'MEDIUM') {
      chance = 0.45;
      delay = 1300 + Math.random() * 500;
    } else {
      return; // Easy bots do not challenge
    }

    if (Math.random() > chance) return;

    setTimeout(() => {
      try {
        const r = getRoom(room.id);
        if (!r || !r.gameState || !r.gameState.caughtWindow?.active) return;
        if (r.gameState.caughtWindow.moveId !== moveId || r.gameState.caughtWindow.resolved) return;

        const res = processCaught(bot.id, targetPlayerId, moveId, r.gameState, (event, data) => {
          if (event === 'caughtResolved') {
            const catcher = r.players.find(p => p.id === bot.id);
            const target = r.players.find(p => p.id === targetPlayerId);
            io.to(r.id).emit('caughtResolved', {
              ...data,
              catcherName: catcher ? catcher.name : bot.name,
              targetName: target ? target.name : 'Target',
              timestamp: Date.now(),
            });
          }
          if (event === 'stateBroadcast') broadcastGameState(io, r);
        });

        if (res.success) {
          io.to(r.id).emit('playerReaction', {
            id: 'rx_' + Math.random().toString(36).substring(2, 8),
            playerId: bot.id,
            playerName: bot.name,
            emoji: '🚨',
            text: 'CAUGHT! Draw +2!',
            timestamp: Date.now(),
          });
          broadcastGameState(io, r);
          scheduleBotTurn(io, r);
        }
      } catch (err) {
        console.error('[Bot Caught Error]:', err);
      }
    }, delay);
  }

  /**
   * Contextual animated emoji reactions from bots to bring matches alive.
   */
  function triggerBotReactions(io, room, eventType, sourcePlayerId) {
    if (!room || !room.players) return;
    const bots = room.players.filter(p => p.isBot && p.id !== sourcePlayerId);
    if (bots.length === 0) return;

    // 35% chance to react
    if (Math.random() > 0.45) return;
    const bot = bots[Math.floor(Math.random() * bots.length)];

    let emoji = '😎';
    let text = null;

    if (eventType === 'FLIP') {
      const flipPhrases = ['Whoa, flipped!', 'Hold your cards!', 'Dark side time!', 'Table turned!'];
      emoji = '🌪️';
      text = flipPhrases[Math.floor(Math.random() * flipPhrases.length)];
    } else if (eventType === 'DRAW_HEAVY') {
      const ouchPhrases = ['Ouch!', 'Oof, that hurts!', 'Brutal move!', 'Good luck with that!'];
      emoji = '😱';
      text = ouchPhrases[Math.floor(Math.random() * ouchPhrases.length)];
    } else if (eventType === 'UNO_CALLED') {
      const unoPhrases = ['Already?!', 'Watch out!', 'Stop them!', 'Not so fast!'];
      emoji = '👀';
      text = unoPhrases[Math.floor(Math.random() * unoPhrases.length)];
    }

    setTimeout(() => {
      try {
        io.to(room.id).emit('playerReaction', {
          id: 'rx_' + Math.random().toString(36).substring(2, 8),
          playerId: bot.id,
          playerName: bot.name,
          emoji,
          text,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[Bot Reaction Error]:', err);
      }
    }, 400 + Math.random() * 600);
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

    // ─── Play with Computer (Instant Solo Mode) ──────────────────────────
    socket.on('startSoloGame', ({ playerName, config, botCount = 3, difficulty = 'MEDIUM', userId }, cb) => {
      try {
        const result = createSoloGame(socket.id, playerName, config || {}, botCount, difficulty, userId);
        if (result.error) return cb({ ok: false, error: result.error });

        const room = result.room;
        socket.join(room.id);
        socket.data.playerId = result.playerId;
        socket.data.roomId   = room.id;

        io.to(room.id).emit('gameStarted', getLobbyState(room));
        broadcastGameState(io, room);
        scheduleBotTurn(io, room);

        cb({ ok: true, roomId: room.id, playerId: result.playerId, lobby: getLobbyState(room) });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    // ─── Play with Friends Offline (Pass & Play) ─────────────────────────
    socket.on('startOfflineGame', ({ playerNames, config, userId }, cb) => {
      try {
        const result = createOfflineGame(socket.id, playerNames, config || {}, userId);
        if (result.error) return cb({ ok: false, error: result.error });

        const room = result.room;
        socket.join(room.id);
        socket.data.playerId = result.playerId;
        socket.data.roomId   = room.id;

        io.to(room.id).emit('gameStarted', getLobbyState(room));
        broadcastGameState(io, room);

        cb({ ok: true, roomId: room.id, playerId: result.playerId, lobby: getLobbyState(room) });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    // ─── Play Online / Quick Match with Random Players ──────────────────
    socket.on('quickMatch', ({ playerName, config, userId }, cb) => {
      try {
        const result = findOrCreateQuickMatch(socket.id, playerName, config || {}, userId);
        if (result.error) return cb({ ok: false, error: result.error });

        const room = result.room;
        socket.join(room.id);
        socket.data.playerId = result.playerId;
        socket.data.roomId   = room.id;

        io.to(room.id).emit('lobbyUpdate', getLobbyState(room));

        // Auto-launch if room reaches 4 players
        let isStarted = false;
        if (room.players.length >= 4) {
          startGame(room.id, room.hostId);
          io.to(room.id).emit('gameStarted', getLobbyState(room));
          broadcastGameState(io, room);
          scheduleBotTurn(io, room);
          isStarted = true;
        }

        cb({
          ok: true,
          roomId: room.id,
          playerId: result.playerId,
          lobby: getLobbyState(room),
          started: isStarted,
        });
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

    socket.on('playCard', ({ cardId, chosenColor, asPlayerId }, cb) => {
      try {
        const roomId   = socket.data.roomId;
        const room     = getRoom(roomId);
        if (!room || !room.gameState) return cb({ ok: false, error: 'GAME_NOT_STARTED' });
        const playerId = room.isOffline ? (asPlayerId || room.gameState.currentPlayerId) : socket.data.playerId;

        const result = processPlayCard(
          playerId, cardId, chosenColor, room.gameState,
          (event, data) => {
            if (event === 'gameOver') io.to(roomId).emit('gameOver', data);
            if (event === 'caughtResolved') io.to(roomId).emit('caughtResolved', data);
            if (event === 'playerDrewPenalty') io.to(roomId).emit('actionAlert', data);
            if (event === 'playerFinished') io.to(roomId).emit('playerFinished', data);
          }
        );

        if (!result.success) return cb({ ok: false, error: result.error });

        broadcastGameState(io, room);

        // Check if top card triggers contextual bot reactions & referee announcement
        const top = room.gameState.discardPile[room.gameState.discardPile.length - 1];
        const face = room.gameState.activeSide === 'DARK' ? top?.darkSide : top?.lightSide;
        const actingPlayer = room.players.find(p => p.id === playerId);
        const actingName = actingPlayer ? actingPlayer.name : 'Player';

        if (face?.type === 'FLIP') {
          triggerBotReactions(io, room, 'FLIP', playerId);
          emitReferee(roomId, 'FLIP', { actorName: actingName });
        } else if (face?.type === 'SKIP_EVERYONE') {
          emitReferee(roomId, 'SKIP_EVERYONE', { actorName: actingName });
        } else if (face?.type === 'WILD_DRAW_COLOR') {
          emitReferee(roomId, 'WILD_DRAW_COLOR', { actorName: actingName, color: chosenColor });
        } else if (face?.type === 'DRAW_FIVE' || face?.type === 'WILD_DRAW_FOUR' || face?.type === 'WILD_DRAW_TWO') {
          triggerBotReactions(io, room, 'DRAW_HEAVY', playerId);
        }

        if (room.gameState.status === 'OVER') {
          handleGameOver(io, room);
        } else {
          // Check if Caught window opened and schedule bot challenge
          if (room.gameState.caughtWindow && room.gameState.caughtWindow.active) {
            scheduleBotCaughtChallenge(io, room);
          }
          scheduleBotTurn(io, room);
        }

        cb({ ok: true, moveId: result.moveId });
      } catch (e) {
        cb({ ok: false, error: e.message });
      }
    });

    socket.on('drawCard', (data, cb) => {
      try {
        const roomId   = socket.data.roomId;
        const room     = getRoom(roomId);
        if (!room || !room.gameState) return (cb || (() => {}))({ ok: false, error: 'GAME_NOT_STARTED' });
        const playerId = room.isOffline ? (data?.asPlayerId || room.gameState.currentPlayerId) : socket.data.playerId;

        const wasUnderStack = !!(room.gameState.pendingDrawStack && room.gameState.pendingDrawStack.active);

        const result = processDrawCard(playerId, room.gameState, (event, evtData) => {
          if (event === 'caughtResolved') io.to(roomId).emit('caughtResolved', evtData);
          if (event === 'playerDrewPenalty') io.to(roomId).emit('actionAlert', evtData);
          if (event === 'gameOver') io.to(roomId).emit('gameOver', evtData);
          if (event === 'playerFinished') io.to(roomId).emit('playerFinished', evtData);
        });

        if (!result.success) return (cb || (() => {}))({ ok: false, error: result.error });

        broadcastGameState(io, room);

        if (room.gameState.caughtWindow && room.gameState.caughtWindow.active) {
          scheduleBotCaughtChallenge(io, room);
        }

        if (room.gameState.status === 'OVER') {
          handleGameOver(io, room);
        } else if (wasUnderStack || result.penaltyTaken) {
          // Penalty stack drawn: turn advanced automatically to next player!
          scheduleBotTurn(io, room);
        }

        // Turn does NOT advance to next player on regular draw — current player now has option to play or pass!
        if (cb) cb({ ok: true, moveId: result.moveId });
      } catch (e) {
        if (cb) cb({ ok: false, error: e.message });
      }
    });

    socket.on('passTurn', (data, cb) => {
      try {
        const roomId   = socket.data.roomId;
        const room     = getRoom(roomId);
        if (!room || !room.gameState) return (cb || (() => {}))({ ok: false, error: 'GAME_NOT_STARTED' });
        const playerId = room.isOffline ? (data?.asPlayerId || room.gameState.currentPlayerId) : socket.data.playerId;

        const result = processPassTurn(playerId, room.gameState, (event, evtData) => {
          if (event === 'gameOver') io.to(roomId).emit('gameOver', evtData);
        });

        if (!result.success) return (cb || (() => {}))({ ok: false, error: result.error });

        broadcastGameState(io, room);

        if (room.gameState.status === 'OVER') {
          handleGameOver(io, room);
        } else {
          scheduleBotTurn(io, room);
        }

        if (cb) cb({ ok: true });
      } catch (e) {
        if (cb) cb({ ok: false, error: e.message });
      }
    });

    socket.on('pressUno', (data, cb) => {
      try {
        const roomId   = socket.data.roomId;
        const room     = getRoom(roomId);
        if (!room || !room.gameState) return (cb || (() => {}))({ ok: false, error: 'GAME_NOT_STARTED' });
        const playerId = room.isOffline ? (data?.asPlayerId || room.gameState.currentPlayerId) : socket.data.playerId;

        const result = processPressUno(playerId, room.gameState);
        if (!result.success) return (cb || (() => {}))({ ok: false, error: result.error });

        // Broadcast that UNO was pressed with player name and timestamp so all players hear and see it
        const caller = room.players.find(p => p.id === playerId);
        io.to(roomId).emit('unoPressedBy', {
          playerId,
          playerName: caller ? caller.name : 'Player',
          timestamp: Date.now(),
        });
        triggerBotReactions(io, room, 'UNO_CALLED', playerId);
        emitReferee(roomId, 'UNO', { actorName: caller ? caller.name : 'Player' });
        broadcastGameState(io, room);
        if (cb) cb({ ok: true });
      } catch (e) {
        if (cb) cb({ ok: false, error: e.message });
      }
    });

    socket.on('pressCaught', ({ targetPlayerId, moveId, asCatcherId }, cb) => {
      try {
        const roomId   = socket.data.roomId;
        const room     = getRoom(roomId);
        if (!room || !room.gameState) return (cb || (() => {}))({ ok: false, error: 'GAME_NOT_STARTED' });
        const catcherId = room.isOffline ? (asCatcherId || socket.data.playerId) : socket.data.playerId;

        const result = processCaught(
          catcherId, targetPlayerId, moveId, room.gameState,
          (event, data) => {
            if (event === 'caughtResolved') {
              const catcher = room.players.find(p => p.id === data.catcherId);
              const target = room.players.find(p => p.id === data.targetPlayerId);
              io.to(roomId).emit('caughtResolved', {
                ...data,
                catcherName: catcher ? catcher.name : 'Player',
                targetName: target ? target.name : 'Target',
                timestamp: Date.now(),
              });
              emitReferee(roomId, 'CAUGHT', {
                actorName: catcher ? catcher.name : 'Player',
                targetName: target ? target.name : 'Target',
                count: data.penaltyCards || 2,
              });
            }
            if (event === 'stateBroadcast') broadcastGameState(io, room);
          }
        );

        if (!result.success) return (cb || (() => {}))({ ok: false, error: result.error });

        if (cb) cb({ ok: true });
      } catch (e) {
        if (cb) cb({ ok: false, error: e.message });
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
