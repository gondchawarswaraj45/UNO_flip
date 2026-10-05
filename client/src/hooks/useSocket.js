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

    socket.on('handUpdate', ({ cards }) => {
      setMyHand(cards);
    });

    // ─── Caught / UNO events ───────────────────────────────────────────────────

    socket.on('caughtResolved', (data) => {
      setLastCaughtEvent(data);
      const myId = useGameStore.getState().myPlayerId;
      if (data.targetPlayerId === myId) {
        toast.error(`You were CAUGHT! +${data.penaltyCards} cards 😬`);
      } else if (data.catcherId === myId) {
        toast.success(`You caught them! They draw +${data.penaltyCards} 🎯`);
      } else {
        const gs = useGameStore.getState().gameState;
        const target = gs?.players.find(p => p.id === data.targetPlayerId);
        const catcher = gs?.players.find(p => p.id === data.catcherId);
        toast(`${catcher?.name ?? 'Someone'} caught ${target?.name ?? 'a player'}! +${data.penaltyCards} cards`, { icon: '🚨' });
      }
      setCaughtWindowUi({ active: false, secondsLeft: 0, moveId: null, targetPlayerId: null });
    });

    socket.on('unoPressedBy', ({ playerId }) => {
      setLastUnoEvent(playerId);
      const gs = useGameStore.getState().gameState;
      const player = gs?.players.find(p => p.id === playerId);
      toast(`${player?.name ?? 'Someone'} said UNO! 🃏`, { icon: '🔔' });
    });

    // ─── Real-Time Reactions & Quick Chat ──────────────────────────────────────
    socket.on('playerReaction', (reaction) => {
      useGameStore.getState().setPlayerReaction(reaction);
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
