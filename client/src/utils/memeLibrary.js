/**
 * Meme & GIF Library for UNO Flip.
 *
 * Rich collection of viral gaming memes, comedic sound triggers,
 * and animated visual overlays for +4, +5, big penalty stacks, flips, and counters.
 */

export const MEME_LIBRARY = {
  // ─── +4 Attacks ────────────────────────────────────────────────────────────
  PLUS_FOUR: [
    {
      id: 'ambulance_not_for_me',
      title: 'CALL AN AMBULANCE...',
      subtitle: '...BUT NOT FOR ME! 🚑🔫',
      badge: '+4 NUCLEAR ATTACK',
      sound: 'memeVineBoom',
      gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #991b1b 100%)',
      borderColor: '#f87171',
      shadowColor: 'rgba(239, 68, 68, 0.85)',
      emojis: ['🚑', '🔫', '💥', '💀'],
      gifStyle: 'ambulance',
    },
    {
      id: 'emotional_damage',
      title: 'EMOTIONAL DAMAGE!',
      subtitle: 'Critical hit to their entire hand! 💔💥',
      badge: 'PSYCHOLOGICAL WARFARE',
      sound: 'memeEmotionalDamage',
      gradient: 'linear-gradient(135deg, #450a0a 0%, #b91c1c 50%, #7f1d1d 100%)',
      borderColor: '#ef4444',
      shadowColor: 'rgba(220, 38, 38, 0.9)',
      emojis: ['💔', '😭', '💥', '🥀'],
      gifStyle: 'damage',
    },
    {
      id: 'trap_card',
      title: 'YOU ACTIVATED MY TRAP CARD!',
      subtitle: 'Did you really think you were safe? 🃏⚡',
      badge: 'UNAVOIDABLE STRIKE',
      sound: 'memeDunDunDun',
      gradient: 'linear-gradient(135deg, #311042 0%, #6b21a8 50%, #4c1d95 100%)',
      borderColor: '#c084fc',
      shadowColor: 'rgba(192, 132, 252, 0.85)',
      emojis: ['🃏', '⚡', '👁️', '✨'],
      gifStyle: 'trap',
    },
  ],

  // ─── +5 Dark Attacks ───────────────────────────────────────────────────────
  PLUS_FIVE: [
    {
      id: 'destruction_100',
      title: 'DESTRUCTION: 100 💣',
      subtitle: 'Total devastation! Take 5 cards straight into the void!',
      badge: 'DARK DIMENSION +5',
      sound: 'memeVineBoom',
      gradient: 'linear-gradient(135deg, #18052e 0%, #581c87 50%, #3b0764 100%)',
      borderColor: '#a855f7',
      shadowColor: 'rgba(168, 85, 247, 0.9)',
      emojis: ['💣', '🌌', '💀', '🔥'],
      gifStyle: 'nuke',
    },
    {
      id: 'boss_music',
      title: 'WHY DO I HEAR BOSS MUSIC?! 💀',
      subtitle: 'Health bar appears in the sky! +5 Draw Five incoming!',
      badge: 'DARK OVERLORD',
      sound: 'memeDunDunDun',
      gradient: 'linear-gradient(135deg, #3b0764 0%, #7e22ce 50%, #4c1d95 100%)',
      borderColor: '#c084fc',
      shadowColor: 'rgba(192, 132, 252, 0.9)',
      emojis: ['👹', '🎻', '⚔️', '🔥'],
      gifStyle: 'boss',
    },
    {
      id: 'gigachad_plus5',
      title: 'GIGACHAD DROP 🗿',
      subtitle: 'Refuses to elaborate further. Drops +5 and passes turn.',
      badge: 'ABSOLUTE CHAD',
      sound: 'memeGigaChad',
      gradient: 'linear-gradient(135deg, #1c1917 0%, #44403c 50%, #292524 100%)',
      borderColor: '#eab308',
      shadowColor: 'rgba(234, 179, 8, 0.8)',
      emojis: ['🗿', '👑', '💪', '✨'],
      gifStyle: 'gigachad',
    },
  ],

  // ─── Massive Penalty Taken (Accumulated Draw Stacks) ───────────────────────
  PENALTY_BIG: [
    {
      id: 'coffin_dance',
      title: 'PRESS F TO PAY RESPECTS ⚰️',
      subtitle: 'A moment of silence for this player\'s deck size...',
      badge: 'CATASTROPHIC PENALTY',
      sound: 'memeSadTrombone',
      gradient: 'linear-gradient(135deg, #1c1917 0%, #451a03 50%, #292524 100%)',
      borderColor: '#f59e0b',
      shadowColor: 'rgba(245, 158, 11, 0.85)',
      emojis: ['⚰️', '🥀', '💀', '🕊️'],
      gifStyle: 'coffin',
    },
    {
      id: 'this_is_fine',
      title: 'THIS IS FINE 🔥🐕',
      subtitle: 'Everything is totally under control... probably.',
      badge: 'BURNING HAND',
      sound: 'memeRobloxOof',
      gradient: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #c2410c 100%)',
      borderColor: '#fb923c',
      shadowColor: 'rgba(249, 115, 22, 0.85)',
      emojis: ['🔥', '☕', '🐕', '🥵'],
      gifStyle: 'thisisfine',
    },
    {
      id: 'bruh_moment',
      title: 'CERTIFIED BRUH MOMENT 🗿',
      subtitle: 'How did the stack even get this big?!',
      badge: 'ACCUMULATION OVERLOAD',
      sound: 'memeBruh',
      gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      borderColor: '#818cf8',
      shadowColor: 'rgba(129, 140, 248, 0.8)',
      emojis: ['🗿', '🤦‍♂️', '📉', '🪦'],
      gifStyle: 'bruh',
    },
  ],

  // ─── Stack Counter Attack (+1 countered with +2, etc.) ─────────────────────
  COUNTER_STACK: [
    {
      id: 'no_u',
      title: 'NO U! 🔁',
      subtitle: 'Counter-attack stacked! Passed right back with interest!',
      badge: 'STACK MULTIPLIER',
      sound: 'memeAirhorn',
      gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #047857 100%)',
      borderColor: '#34d399',
      shadowColor: 'rgba(52, 211, 153, 0.85)',
      emojis: ['🔁', '🛡️', '⚡', '💥'],
      gifStyle: 'reverse',
    },
    {
      id: 'parry_casual',
      title: 'PARRY THIS YOU CASUAL! ⚔️',
      subtitle: 'Countered with higher draw card! Good luck to the next victim!',
      badge: 'DEFLECT & AMPLIFY',
      sound: 'memeVineBoom',
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%)',
      borderColor: '#60a5fa',
      shadowColor: 'rgba(96, 165, 250, 0.85)',
      emojis: ['⚔️', '🛡️', '👑', '💥'],
      gifStyle: 'parry',
    },
  ],

  // ─── Skip Everyone ─────────────────────────────────────────────────────────
  SKIP_ALL: [
    {
      id: 'thanos_fine',
      title: 'FINE, I\'LL DO IT MYSELF 🥊',
      subtitle: 'Everyone else gets skipped! It\'s my game now!',
      badge: 'SOLO DOMINATION',
      sound: 'memeVineBoom',
      gradient: 'linear-gradient(135deg, #2e1065 0%, #6b21a8 50%, #581c87 100%)',
      borderColor: '#d8b4fe',
      shadowColor: 'rgba(216, 180, 254, 0.85)',
      emojis: ['🥊', '🧤', '🪐', '💥'],
      gifStyle: 'thanos',
    },
  ],
};

/**
 * Helper to pick a random meme for a given trigger category
 */
export function getMemeForEvent(category) {
  const list = MEME_LIBRARY[category];
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}
