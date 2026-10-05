/**
 * Zustand global store.
 *
 * Authoritative game state is maintained on the server and synchronized via Socket.IO.
 * Private information (own hand) is isolated and NEVER broadcast.
 * Player profile, stats, level progression, and identity persist locally and in Supabase PostgreSQL.
 */

import { create } from 'zustand';
import sound from '../utils/audio';

// ─── Identity & Profile Persistence Helpers ─────────────────────────────────

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

const defaultProfile = {
  username: '',
  avatar: '👑',
  frame: 'gold_royal',
  title: 'Card Novice',
  xp: 120,
  coins: 500,
  matchesPlayed: 0,
  matchesWon: 0,
  cardsPlayed: 0,
  unoCalls: 0,
  caughtSuccess: 0,
  totalScore: 0,
  winStreak: 0,
  highestStreak: 0,
};

const getStoredProfile = (userId) => {
  try {
    const raw = localStorage.getItem('uno_player_profile');
    const legacyName = localStorage.getItem('uno_persistent_user_name') || '';
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.username && legacyName) parsed.username = legacyName;
      return { ...defaultProfile, ...parsed, userId };
    }
    return { ...defaultProfile, userId, username: legacyName || 'Player' };
  } catch (_) {
    return { ...defaultProfile, userId, username: 'Player' };
  }
};

// ─── Store Definition ────────────────────────────────────────────────────────

const initialUserId = getStoredUserId();
const initialProfile = getStoredProfile(initialUserId);

const useGameStore = create((set, get) => ({
  // ─── Connection ─────────────────────────────────────────────────────────────
  socket: null,
  connected: false,
  setSocket: (socket) => set({ socket }),
  setConnected: (v) => set({ connected: v }),

  // ─── Identity & Permanent Profile ───────────────────────────────────────────
  myUserId: initialUserId,
  myPlayerId: null,
  myName: initialProfile.username || 'Player',
  profile: initialProfile,

  setMyUserId: (id) => {
    try { localStorage.setItem('uno_persistent_user_id', id); } catch (_) {}
    set((state) => ({ myUserId: id, profile: { ...state.profile, userId: id } }));
  },

  setMyPlayerId: (id) => set({ myPlayerId: id }),

  setMyName: (name) => {
    get().updateProfile({ username: name });
  },

  /**
   * Update player profile, persist to localStorage and sync to Supabase backend
   */
  updateProfile: async (fields) => {
    const current = get().profile;
    const updated = { ...current, ...fields };
    set({
      profile: updated,
      myName: updated.username || current.username || 'Player',
    });

    try {
      localStorage.setItem('uno_player_profile', JSON.stringify(updated));
      if (updated.username) {
        localStorage.setItem('uno_persistent_user_name', updated.username);
      }

      // Sync to backend PostgreSQL / Supabase
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
      fetch(`${backendUrl}/api/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: updated.userId || get().myUserId,
          username: updated.username,
          avatar: updated.avatar,
        }),
      }).catch(() => {});
    } catch (_) {}
  },

  /**
   * Record match completion to career statistics and XP
   */
  recordMatchCompleted: (matchResult) => {
    if (!matchResult) return;
    const { myPlayerId, profile } = get();
    const isWinner = matchResult.winner === myPlayerId;
    const xpGained = isWinner ? 180 : 60;
    const coinsGained = isWinner ? 150 : 40;
    const nextStreak = isWinner ? (profile.winStreak || 0) + 1 : 0;
    const highestStreak = Math.max(profile.highestStreak || 0, nextStreak);

    // Calculate rank title based on total XP
    const totalXp = (profile.xp || 0) + xpGained;
    let title = 'Card Novice';
    if (totalXp >= 1500) title = 'Grandmaster';
    else if (totalXp >= 800) title = 'Flip Tactician';
    else if (totalXp >= 400) title = 'Card Veteran';
    else if (totalXp >= 200) title = 'Table Duelist';

    get().updateProfile({
      xp: totalXp,
      coins: (profile.coins || 500) + coinsGained,
      matchesPlayed: (profile.matchesPlayed || 0) + 1,
      matchesWon: (profile.matchesWon || 0) + (isWinner ? 1 : 0),
      winStreak: nextStreak,
      highestStreak,
      title,
      totalScore: (profile.totalScore || 0) + (isWinner ? 100 : 35),
    });

    sound.levelUp();
  },

  // ─── Real-Time Quick Chat & Emoji Reactions ─────────────────────────────────
  showQuickChat: false,
  setShowQuickChat: (v) => set({ showQuickChat: v }),
  activeReactions: {}, // { [playerId]: { id, emoji, text, timestamp } }

  setPlayerReaction: (reaction) => {
    if (!reaction || !reaction.playerId) return;
    const { playerId } = reaction;

    set((state) => ({
      activeReactions: {
        ...state.activeReactions,
        [playerId]: reaction,
      },
    }));

    // Auto-dismiss after 3.2 seconds
    setTimeout(() => {
      set((state) => {
        const cur = { ...state.activeReactions };
        if (cur[playerId]?.id === reaction.id) {
          delete cur[playerId];
          return { activeReactions: cur };
        }
        return state;
      });
    }, 3200);
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
  showProfileModal: false,
  setShowProfileModal: (v) => set({ showProfileModal: v }),
  showRulesModal: false,
  setShowRulesModal: (v) => set({ showRulesModal: v }),

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
    return gameState.players.find((p) => p.id === myPlayerId) || null;
  },

  reset: () =>
    set({
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
