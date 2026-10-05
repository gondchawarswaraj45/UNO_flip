/**
 * Zustand global store.
 *
 * Authoritative game state is maintained on the server and synchronized via Socket.IO.
 * Private information (own hand) is isolated and NEVER broadcast.
 * Player identity and sound preferences persist locally across sessions.
 */

import { create } from 'zustand';
import sound from '../utils/audio';

// Retrieve or generate a stable persistent player UUID for PostgreSQL / Supabase
const getStoredUserId = () => {
  try {
    let id = localStorage.getItem('uno_persistent_user_id');
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('uno_persistent_user_id', id);
    }
    return id;
  } catch (_) {
    return 'usr_' + Math.random().toString(36).substring(2, 9);
  }
};

const getStoredUserName = () => {
  try {
    return localStorage.getItem('uno_persistent_user_name') || '';
  } catch (_) {
    return '';
  }
};

const useGameStore = create((set, get) => ({
  // ─── Connection ─────────────────────────────────────────────────────────────
  socket: null,
  connected: false,
  setSocket: (socket) => set({ socket }),
  setConnected: (v) => set({ connected: v }),

  // ─── Identity ────────────────────────────────────────────────────────────────
  myUserId: getStoredUserId(),
  myPlayerId: null,
  myName: getStoredUserName(),
  setMyUserId: (id) => {
    try { localStorage.setItem('uno_persistent_user_id', id); } catch (_) {}
    set({ myUserId: id });
  },
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setMyName: (name) => {
    try { localStorage.setItem('uno_persistent_user_name', name); } catch (_) {}
    set({ myName: name });
  },

  // ─── Screen navigation ───────────────────────────────────────────────────────
  /** 'LANDING' | 'LOBBY' | 'GAME' | 'RESULT' */
  screen: 'LANDING',
  setScreen: (s) => set({ screen: s }),

  // ─── Sound System ────────────────────────────────────────────────────────────
  soundEnabled: sound.isEnabled(),
  toggleSound: () => {
    const next = sound.toggleSound();
    set({ soundEnabled: next });
    return next;
  },

  // ─── Modals ──────────────────────────────────────────────────────────────────
  showLeaderboard: false,
  setShowLeaderboard: (v) => set({ showLeaderboard: v }),

  // ─── Lobby state ─────────────────────────────────────────────────────────────
  lobbyState: null,
  roomId: null,
  setLobbyState: (lobby) => set({ lobbyState: lobby, roomId: lobby?.roomId }),
  setRoomId: (id) => set({ roomId: id }),

  // ─── Public game state (broadcast to all) ────────────────────────────────────
  gameState: null,
  setGameState: (state) => set({ gameState: state }),

  // ─── Private hand (only visible to this player) ──────────────────────────────
  myHand: [],
  setMyHand: (cards) => set({ myHand: cards }),

  // ─── UI Interaction state ─────────────────────────────────────────────────────
  selectedCardId: null,
  setSelectedCardId: (id) => set({ selectedCardId: id }),

  /** Whether the color picker modal is open (for Wild cards) */
  showColorPicker: false,
  pendingWildCardId: null,
  openColorPicker: (cardId) => set({ showColorPicker: true, pendingWildCardId: cardId }),
  closeColorPicker: () => set({ showColorPicker: false, pendingWildCardId: null }),

  // ─── Caught window UI state ───────────────────────────────────────────────────
  caughtWindowUi: {
    active: false,
    secondsLeft: 0,
    moveId: null,
    targetPlayerId: null,
  },
  setCaughtWindowUi: (v) => set({ caughtWindowUi: v }),

  // ─── Last caught/UNO events (for toasts) ─────────────────────────────────────
  lastCaughtEvent: null,
  setLastCaughtEvent: (ev) => set({ lastCaughtEvent: ev }),

  lastUnoEvent: null,
  setLastUnoEvent: (ev) => set({ lastUnoEvent: ev }),

  // ─── Game result ─────────────────────────────────────────────────────────────
  gameResult: null,
  setGameResult: (r) => set({ gameResult: r }),

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  isMyTurn: () => {
    const { myPlayerId, gameState } = get();
    return gameState && gameState.currentPlayerId === myPlayerId;
  },

  getMe: () => {
    const { myPlayerId, gameState } = get();
    if (!gameState) return null;
    return gameState.players.find(p => p.id === myPlayerId) || null;
  },

  reset: () => set({
    gameState: null,
    myHand: [],
    selectedCardId: null,
    showColorPicker: false,
    pendingWildCardId: null,
    caughtWindowUi: { active: false, secondsLeft: 0, moveId: null, targetPlayerId: null },
    lastCaughtEvent: null,
    lastUnoEvent: null,
    gameResult: null,
    lobbyState: null,
    roomId: null,
    screen: 'LANDING',
  }),
}));

export default useGameStore;
