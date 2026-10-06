/**
 * useSocket — initializes and manages the Socket.IO connection.
 * All server events are handled here and pushed into the Zustand store.
 */

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import useGameStore from '../store/gameStore';
import { SERVER_URL } from '../utils/constants';

export function useSocket() {
  const socketRef  = useRef(null);
  const {
    setSocket, setConnected,
    setGameState, setMyHand,
    setLobbyState, setScreen,
    setCaughtWindowUi, setLastCaughtEvent,
    setLastUnoEvent, setGameResult,
    myPlayerId,
  } = useGameStore();

  useEffect(() => {
    if (socketRef.current) return; // already initialized

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;
    setSocket(socket);

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      toast.error('Connection lost. Reconnecting…');
    });

    // ─── Lobby events ──────────────────────────────────────────────────────────

    socket.on('lobbyUpdate', (lobby) => {
      setLobbyState(lobby);
    });

    socket.on('gameStarted', (lobby) => {
      setLobbyState(lobby);
      setScreen('GAME');
    });

    // ─── Game state (public broadcast — no hands) ──────────────────────────────

    socket.on('gameState', (state) => {
      setGameState(state);

      // Update caught window UI from authoritative server state
      const cw = state.caughtWindow;
      if (cw && cw.active) {
        const secondsLeft = Math.max(0, Math.ceil((cw.expiresAt - Date.now()) / 1000));
        setCaughtWindowUi({
          active: true,
          secondsLeft,
          moveId: cw.moveId,
          targetPlayerId: cw.targetPlayerId,
        });
      } else {
        setCaughtWindowUi({ active: false, secondsLeft: 0, moveId: null, targetPlayerId: null });
      }
    });

    // ─── Private hand (only for this player) ──────────────────────────────────

    socket.on('handUpdate', ({ cards, activePlayerId, isOffline }) => {
      setMyHand(cards);
      if (isOffline) {
        useGameStore.getState().setOfflineActivePlayerId(activePlayerId);
        useGameStore.getState().setIsOfflineMode(true);
      }
    });

    // ─── Tabletop Action Alerts (Penalty Draws, Flips, Skips) ──────────────────
    socket.on('actionAlert', (action) => {
      if (!action) return;
      useGameStore.getState().setActionAlert(action);

      const myId = useGameStore.getState().myPlayerId;
      if (action.type === 'PENALTY_DRAW' && action.drawCount > 0) {
        sound.dealCard();
        if (action.targetId === myId) {
          toast.error(`⚡ Hit with +${action.drawCount}! You took ${action.drawCount} card${action.drawCount > 1 ? 's' : ''} and lost your turn!`, { duration: 3500 });
        } else {
          toast(`⚡ ${action.playedByName} played +${action.drawCount}! ${action.targetName} takes ${action.drawCount} card${action.drawCount > 1 ? 's' : ''} & is skipped!`, { icon: '🎴', duration: 3500 });
        }
      } else if (action.type === 'FLIP') {
        sound.cardFlip();
        toast('🔄 FLIP! All cards switched to the opposite side!', { icon: '✨' });
      } else if (action.type === 'SKIP_EVERYONE') {
        toast(`🌀 ${action.playedByName} played Skip Everyone!`, { icon: '⚡' });
      }
    });

    // ─── Bot Thinking Indicator ───────────────────────────────────────────────
    socket.on('botThinking', ({ botId, thinking }) => {
      useGameStore.getState().setBotThinking(botId, thinking);
    });

    // ─── Caught / UNO events (Audio & Screen Animations for All Players) ──────

    socket.on('caughtResolved', (data) => {
      setLastCaughtEvent(data);
      sound.caughtAlarm(); // Play emergency siren audio on ALL players' devices!
      sound.vibrate([90, 50, 90]);

      const gs = useGameStore.getState().gameState;
      const catcher = gs?.players.find(p => p.id === data.catcherId);
      const target = gs?.players.find(p => p.id === data.targetPlayerId);
      const catcherName = data.catcherName || catcher?.name || 'Someone';
      const targetName = data.targetName || target?.name || 'Player';

      useGameStore.getState().triggerCaughtSplash({
        ...data,
        catcherName,
        targetName,
      });

      const myId = useGameStore.getState().myPlayerId;
      if (data.targetPlayerId === myId) {
        toast.error(`🚨 YOU WERE CAUGHT! Failed to call UNO — drew +${data.penaltyCards} cards!`, { duration: 4000 });
      } else if (data.catcherId === myId) {
        toast.success(`🎯 YOU CAUGHT ${targetName}! They drew +${data.penaltyCards} cards!`, { duration: 4000 });
      } else {
        toast(`🚨 ${catcherName} caught ${targetName}! Penalty: +${data.penaltyCards} cards`, { icon: '⚠️', duration: 4000 });
      }
      setCaughtWindowUi({ active: false, secondsLeft: 0, moveId: null, targetPlayerId: null });
    });

    socket.on('unoPressedBy', (data) => {
      setLastUnoEvent(data.playerId);
      sound.unoShout(); // Play triumphant fanfare audio on ALL players' devices!
      sound.vibrate([70, 40, 70]);

      const gs = useGameStore.getState().gameState;
      const player = gs?.players.find(p => p.id === data.playerId);
      const playerName = data.playerName || player?.name || 'Player';

      useGameStore.getState().triggerUnoSplash({
        playerId: data.playerId,
        playerName,
        timestamp: data.timestamp || Date.now(),
      });

      const myId = useGameStore.getState().myPlayerId;
      if (data.playerId === myId) {
        toast.success(`🃏 YOU SHOUTED UNO! 1 card remaining!`, { duration: 3500 });
      } else {
        toast(`🔔 ${playerName} shouted UNO! Only 1 card left!`, { icon: '🃏', duration: 3500 });
      }
    });

    // ─── Real-Time Reactions & Quick Chat ──────────────────────────────────────
    socket.on('playerReaction', (reaction) => {
      useGameStore.getState().setPlayerReaction(reaction);
    });

    // ─── Player Cleared Cards / Placement Update ─────────────────────────────
    socket.on('playerFinished', ({ playerId, playerName, rank, remainingCount }) => {
      const myId = useGameStore.getState().myPlayerId;
      const ordinal = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;
      if (playerId === myId) {
        sound.victoryFanfare();
        toast.success(`🎉 You cleared all cards and claimed ${ordinal} place! Spectating until final player remains...`, {
          duration: 5000,
          icon: '🏆',
        });
      } else {
        toast(`🏁 ${playerName} cleared cards and secured ${ordinal} place! Match continues for remaining players...`, {
          duration: 4000,
          icon: '🎖️',
        });
      }
    });

    // ─── Game over ─────────────────────────────────────────────────────────────

    socket.on('gameOver', (result) => {
      setGameResult(result);
      useGameStore.getState().recordMatchCompleted(result);
      setScreen('RESULT');
    });

    // ─── Disconnect notification ───────────────────────────────────────────────

    socket.on('playerDisconnected', ({ name }) => {
      toast(`${name} disconnected`, { icon: '⚠️' });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // run once on mount

  return socketRef.current;
}
