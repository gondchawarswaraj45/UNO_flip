/**
 * Core Game State Machine.
 *
 * Responsible for:
 *  - Initializing game state from config
 *  - Processing player moves (playCard, drawCard, pressUno)
 *  - Managing the turn order and direction
 *  - Handling the FLIP mechanic (Two-Side mode)
 *  - Running the Caught window timer (server-authoritative)
 *  - Applying Caught penalties
 *  - Declaring the winner
 *
 * The game state object held here is the SINGLE SOURCE OF TRUTH.
 * Clients only receive sanitized views of this state.
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const { buildDeck, getActiveFace }        = require('./cards');
const { shuffleDeck }                     = require('./shuffle');
const { validatePlay, resolveCardEffects, isUnoState, isWinner, getDrawCardPenalty } = require('./rules');
const {
  GAME_MODE,
  ACTIVE_SIDE,
  CARD_TYPE,
  DEFAULT_CONFIG,
} = require('./config');

// ─── Game Factory ─────────────────────────────────────────────────────────────

/**
 * Create a brand-new game state.
 *
 * @param {object} config  Merged with DEFAULT_CONFIG.
 * @param {Array<{id:string, name:string, isBot:boolean, difficulty?:string}>} players
 * @returns {object}  Full internal game state.
 */
function createGame(config, players) {
  const cfg = Object.assign({}, DEFAULT_CONFIG, config);

  // Build and shuffle the deck
  const deck = shuffleDeck(buildDeck(cfg.mode, cfg.colorMode));

  // Deal starting hands
  const hands = {};
  for (const player of players) {
    hands[player.id] = [];
    for (let i = 0; i < cfg.startingHandSize; i++) {
      hands[player.id].push(deck.pop());
    }
  }

  // Flip the first card to the discard pile
  // Re-draw if the first card is a Wild or Flip (house rule: keep it clean)
  let firstCard;
  do {
    firstCard = deck.pop();
    const face = getActiveFace(firstCard, ACTIVE_SIDE.LIGHT);
    if (face.type === CARD_TYPE.WILD || face.type === CARD_TYPE.WILD_DRAW_FOUR ||
        face.type === CARD_TYPE.WILD_DRAW_TWO || face.type === CARD_TYPE.WILD_DRAW_COLOR || face.type === CARD_TYPE.FLIP) {
      deck.unshift(firstCard); // push back to bottom
      firstCard = null;
    }
  } while (!firstCard);

  const initialFace = getActiveFace(firstCard, ACTIVE_SIDE.LIGHT);

  const state = {
    gameId: uuidv4(),
    config: cfg,
    status: 'PLAYING',           // 'WAITING' | 'PLAYING' | 'OVER'
    players,                      // ordered array
    hands,                        // { [playerId]: Card[] }
    deck,                         // remaining draw pile
    discardPile: [firstCard],
    activeSide: ACTIVE_SIDE.LIGHT,
    currentColor: initialFace.color,
    direction: 1,                 // 1 = clockwise, -1 = counter-clockwise
    currentPlayerIndex: 0,
    currentPlayerId: players[0].id,

    // UNO tracking: set of playerIds who have pressed UNO correctly
    unoPressedBy: {},

    // Move tracking for Caught system
    lastMove: null,
    caughtWindow: {
      active: false,
      moveId: null,
      targetPlayerId: null,
      expiresAt: null,
      resolved: false,
    },

    winner: null,
    finishers: [],               // Ordered list of finishers: [{ playerId, playerName, rank, isBot, cardCount, finishedAt }]
    hasDrawnThisTurn: false,     // Official rule: Player must draw before passing
    drawnCardId: null,           // Tracks card taken from bundle

    // Progressive Draw Stacking Engine (+1, +2, +4, +5 progressive counter & accumulation)
    pendingDrawStack: {
      active: false,
      totalCards: 0,
      currentLevel: 0,
      initiatorId: null,
      history: [],
    },

    turnCount: 0,
    totalFlips: 0,
    startedAt: Date.now(),
    playerActions: Object.fromEntries(
      players.map(p => [p.id, {
        cardsPlayed: 0,
        unoCalls: 0,
        caughtSuccess: 0,
        caughtPenalized: 0,
      }])
    ),
  };

  return state;
}

// ─── Turn Navigation ──────────────────────────────────────────────────────────

/**
 * Find the next active player's index, strictly skipping any players
 * who have already cleared all their cards (0 cards remaining).
 */
function nextActiveIndex(state, steps = 1) {
  const n = state.players.length;
  const activeCount = state.players.filter(p => (state.hands[p.id]?.length || 0) > 0).length;
  if (activeCount <= 1) return state.currentPlayerIndex;

  let curr = state.currentPlayerIndex;
  let remainingSteps = steps;
  let safetyLoop = 0;

  while (remainingSteps > 0 && safetyLoop < n * 4) {
    safetyLoop++;
    curr = ((curr + state.direction) % n + n) % n;
    const pId = state.players[curr].id;
    if (state.hands[pId] && state.hands[pId].length > 0) {
      remainingSteps--;
    }
  }
  return curr;
}

/**
 * Advance the turn to the next active player with cards remaining.
 * Mutates state.currentPlayerIndex and state.currentPlayerId.
 */
function advanceTurn(state, steps = 1) {
  state.currentPlayerIndex = nextActiveIndex(state, steps);
  state.currentPlayerId    = state.players[state.currentPlayerIndex].id;
  state.hasDrawnThisTurn   = false;
  state.drawnCardId        = null;
  state.turnCount += 1;
}

// ─── Draw Helpers ─────────────────────────────────────────────────────────────

/**
 * Draw `count` cards from the deck into a player's hand.
 * If the deck runs out, reshuffles the discard pile (except the top card).
 *
 * @param {string} playerId
 * @param {number} count
 * @param {object} state
 * @returns {Card[]}  The cards that were drawn.
 */
function drawCards(playerId, count, state) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      reshuffleDiscard(state);
      if (state.deck.length === 0) break; // truly no cards left
    }
    const card = state.deck.pop();
    state.hands[playerId].push(card);
    drawn.push(card);
  }
  return drawn;
}

/**
 * Reshuffle the discard pile back into the deck, keeping the top card.
 */
function reshuffleDiscard(state) {
  const topCard = state.discardPile.pop();
  state.deck    = shuffleDeck(state.discardPile);
  state.discardPile = [topCard];
}

// ─── Move Processing ──────────────────────────────────────────────────────────

/**
 * Process a "play card" action.
 *
 * @param {string}      playerId
 * @param {string}      cardId
 * @param {string|null} chosenColor  — Required for Wild cards.
 * @param {object}      state
 * @param {Function}    emitEvent    — (eventName, data) callback to notify sockets.
 * @returns {{ success: boolean, error?: string, moveId?: string }}
 */
function processPlayCard(playerId, cardId, chosenColor, state, emitEvent) {
  if (chosenColor && typeof chosenColor === 'string') {
    const uc = chosenColor.toUpperCase();
    if (uc === 'CRIMSON') chosenColor = 'PINK';
    else if (uc === 'DEEP_BLUE') chosenColor = 'TEAL';
    else if (uc === 'DEEP_PURPLE') chosenColor = 'PURPLE';
    else chosenColor = uc;
  }

  const validation = validatePlay(playerId, cardId, state, chosenColor);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  // Remove card from hand
  const hand  = state.hands[playerId];
  const cardIndex = hand.findIndex(c => c.id === cardId);
  const [card] = hand.splice(cardIndex, 1);

  // Place on discard pile
  state.discardPile.push(card);

  const face    = getActiveFace(card, state.activeSide);
  const effects = resolveCardEffects(face, chosenColor, state);

  // Update game color
  state.currentColor = effects.newColor;

  // Handle FLIP
  if (effects.flip && state.config.mode === GAME_MODE.TWO_SIDE) {
    state.totalFlips = (state.totalFlips || 0) + 1;
    state.activeSide = state.activeSide === ACTIVE_SIDE.LIGHT
      ? ACTIVE_SIDE.DARK
      : ACTIVE_SIDE.LIGHT;
    const newFace = getActiveFace(card, state.activeSide);
    if (newFace.color === 'WILD' || newFace.type === CARD_TYPE.WILD_DRAW_COLOR) {
      state.currentColor = chosenColor || (state.activeSide === ACTIVE_SIDE.DARK ? 'PINK' : 'RED');
    } else {
      state.currentColor = chosenColor || newFace.color;
    }
  }

  // Track cards played metric
  if (state.playerActions && state.playerActions[playerId]) {
    state.playerActions[playerId].cardsPlayed += 1;
  }

  // Reset turn draw tracking
  state.hasDrawnThisTurn = false;
  state.drawnCardId = null;

  // Handle direction reversal
  if (effects.reverse) {
    state.direction *= -1;
    // When only 2 active players remain with cards, Reverse acts like Skip
    const activeCount = state.players.filter(p => (state.hands[p.id]?.length || 0) > 0).length;
    if (activeCount === 2) {
      effects.skipNext = true;
    }
  }

  const playedBy = state.players.find(p => p.id === playerId);
  let skippedId = null;
  let skippedPlayer = null;

  const drawPenalty = getDrawCardPenalty(face);

  if (drawPenalty > 0) {
    // Progressive Draw Stacking (+1, +2, +4, +5):
    // Accumulate totalCards, set minimum level, and pass attack to next player!
    if (state.pendingDrawStack && state.pendingDrawStack.active) {
      state.pendingDrawStack.totalCards += drawPenalty;
      state.pendingDrawStack.currentLevel = Math.max(state.pendingDrawStack.currentLevel, drawPenalty);
      state.pendingDrawStack.history.push({ playerId, type: face.type, count: drawPenalty });
    } else {
      state.pendingDrawStack = {
        active: true,
        totalCards: drawPenalty,
        currentLevel: drawPenalty,
        initiatorId: playerId,
        history: [{ playerId, type: face.type, count: drawPenalty }],
      };
    }

    // Turn advances to next player who must now counter with equal/higher or take penalty
    advanceTurn(state, 1);

    const targetPlayer = state.players[state.currentPlayerIndex];
    state.lastActionNotification = {
      id: uuidv4(),
      type: 'DRAW_STACK',
      playedById: playerId,
      playedByName: playedBy ? playedBy.name : 'Player',
      targetId: targetPlayer ? targetPlayer.id : null,
      targetName: targetPlayer ? targetPlayer.name : null,
      cardType: face.type,
      cardValue: face.value,
      cardColor: face.color,
      drawCount: state.pendingDrawStack.totalCards,
      currentLevel: state.pendingDrawStack.currentLevel,
      timestamp: Date.now(),
    };
    emitEvent('playerDrewPenalty', state.lastActionNotification);
  } else if (effects.wildDrawColor) {
    const targetIndex = nextActiveIndex(state, 1);
    const targetPlayer = state.players[targetIndex];
    const targetId = targetPlayer ? targetPlayer.id : null;
    let drawnCount = 0;
    let matchingCardFound = false;
    let safetyCounter = 120;

    while (!matchingCardFound && safetyCounter > 0) {
      safetyCounter--;
      if (state.deck.length === 0) {
        reshuffleDiscard(state);
        if (state.deck.length === 0) break;
      }
      const drawnCard = state.deck.pop();
      state.hands[targetId].push(drawnCard);
      drawnCount++;
      const drawnFace = getActiveFace(drawnCard, state.activeSide);
      if (drawnFace && (drawnFace.color === chosenColor || drawnFace.color === 'WILD')) {
        matchingCardFound = true;
      }
    }

    // Target player loses their turn
    advanceTurn(state, 2);

    state.lastActionNotification = {
      id: uuidv4(),
      type: 'WILD_DRAW_COLOR',
      playedById: playerId,
      playedByName: playedBy ? playedBy.name : 'Player',
      targetId,
      targetName: targetPlayer ? targetPlayer.name : 'Player',
      cardType: face.type,
      cardValue: face.value,
      cardColor: chosenColor,
      drawCount: drawnCount,
      timestamp: Date.now(),
    };
    emitEvent('playerDrewPenalty', state.lastActionNotification);
  } else if (effects.skipEveryone) {
    // If player still has cards, they play again. If they emptied their hand, advance to next active.
    if (hand.length > 0) {
      // Current player continues
    } else {
      advanceTurn(state, 1);
    }
  } else if (effects.skipNext) {
    // Standard skip card (skip next player)
    const skippedIndex = nextActiveIndex(state, 1);
    skippedId    = state.players[skippedIndex].id;
    skippedPlayer = state.players[skippedIndex];
    advanceTurn(state, 2); // skip the target active player
  } else {
    advanceTurn(state, 1);
  }

  // Record action notification for non-stacking plays
  if (drawPenalty === 0 && !effects.wildDrawColor) {
    state.lastActionNotification = {
      id: uuidv4(),
      type: effects.skipEveryone ? 'SKIP_EVERYONE' : (effects.skipNext ? 'SKIP' : (effects.flip ? 'FLIP' : 'PLAY')),
      playedById: playerId,
      playedByName: playedBy ? playedBy.name : 'Player',
      targetId: skippedId,
      targetName: skippedPlayer ? skippedPlayer.name : null,
      cardType: face.type,
      cardValue: face.value,
      cardColor: face.color,
      drawCount: 0,
      timestamp: Date.now(),
    };
  }

  // Check UNO state: if player already called UNO and now has 1 card, preserve their call
  const hasCalledUno = !!state.unoPressedBy[playerId];
  const isNowOneCard = hand.length === 1;

  if (isNowOneCard && hasCalledUno) {
    // Kept safe — UNO call is honored
  } else if (!isNowOneCard) {
    // Reset UNO flag when holding 0 or >1 cards
    delete state.unoPressedBy[playerId];
  }

  // Create a move record
  const moveId = uuidv4();
  state.lastMove = {
    moveId,
    playerId,
    cardId,
    timestamp: Date.now(),
    result: 'PLAYED',
    unoPressed: isNowOneCard && hasCalledUno,
    caught: false,
    caughtBy: null,
  };

  // Open Caught window ONLY if the player holds 1 card and forgot to call UNO
  if (isNowOneCard && !hasCalledUno) {
    openCaughtWindow(state, moveId, playerId);
  } else {
    state.caughtWindow = {
      active: false,
      moveId: null,
      targetPlayerId: null,
      expiresAt: null,
      resolved: false,
    };
  }

  // Check if player cleared all cards (finished)
  if (hand.length === 0) {
    const rank = state.finishers.length + 1;
    const finisherRecord = {
      playerId,
      playerName: playedBy ? playedBy.name : 'Player',
      rank,
      isBot: !!playedBy?.isBot,
      cardCount: 0,
      finishedAt: Date.now(),
    };
    state.finishers.push(finisherRecord);

    const remainingActive = state.players.filter(p => (state.hands[p.id]?.length || 0) > 0);

    // Rule: Match only concludes when at most 1 player remains!
    if (remainingActive.length <= 1) {
      if (remainingActive.length === 1) {
        const lastPlayer = remainingActive[0];
        state.finishers.push({
          playerId: lastPlayer.id,
          playerName: lastPlayer.name,
          rank: state.finishers.length + 1,
          isBot: !!lastPlayer.isBot,
          cardCount: (state.hands[lastPlayer.id] || []).length,
          finishedAt: Date.now(),
        });
      }

      state.status = 'OVER';
      state.winner = state.finishers[0].playerId;
      if (state.caughtWindowTimer) clearTimeout(state.caughtWindowTimer);
      emitEvent('gameOver', {
        winner: state.winner,
        finishers: state.finishers,
      });
      return { success: true, moveId };
    } else {
      // Match continues for the remaining players!
      emitEvent('playerFinished', {
        playerId,
        playerName: playedBy ? playedBy.name : 'Player',
        rank,
        remainingCount: remainingActive.length,
      });
      emitEvent('stateBroadcast', null);
      return { success: true, moveId };
    }
  }

  emitEvent('stateBroadcast', null);
  return { success: true, moveId };
}

/**
 * Process a "draw card" action (player chooses to draw instead of playing).
 *
 * @param {string}   playerId
 * @param {object}   state
 * @param {Function} emitEvent
 * @returns {{ success: boolean, error?: string }}
 */
function processDrawCard(playerId, state, emitEvent) {
  if (state.currentPlayerId !== playerId) {
    return { success: false, error: 'NOT_YOUR_TURN' };
  }

  // Under Progressive Draw Stack: Player takes the ENTIRE accumulated penalty!
  if (state.pendingDrawStack && state.pendingDrawStack.active) {
    const penaltyTotal = state.pendingDrawStack.totalCards;
    const initiatorId = state.pendingDrawStack.initiatorId;
    const drawn = drawCards(playerId, penaltyTotal, state);

    // Reset draw stack
    state.pendingDrawStack = {
      active: false,
      totalCards: 0,
      currentLevel: 0,
      initiatorId: null,
      history: [],
    };

    state.hasDrawnThisTurn = false;
    state.drawnCardId = null;

    const moveId = uuidv4();
    state.lastMove = {
      moveId,
      playerId,
      cardId: null,
      timestamp: Date.now(),
      result: 'DREW_PENALTY',
      unoPressed: false,
      caught: false,
      caughtBy: null,
    };

    const drawingPlayer = state.players.find(p => p.id === playerId);
    const initiatorPlayer = state.players.find(p => p.id === initiatorId);
    state.lastActionNotification = {
      id: uuidv4(),
      type: 'PENALTY_DRAW',
      playedById: initiatorId || playerId,
      playedByName: initiatorPlayer ? initiatorPlayer.name : (drawingPlayer ? drawingPlayer.name : 'Player'),
      targetId: playerId,
      targetName: drawingPlayer ? drawingPlayer.name : 'Player',
      cardType: 'DRAW',
      cardValue: null,
      cardColor: null,
      drawCount: penaltyTotal,
      timestamp: Date.now(),
    };

    state.caughtWindow = {
      active: false,
      moveId: null,
      targetPlayerId: null,
      expiresAt: null,
      resolved: false,
    };

    // User rule: "last player have to take total cards ( +1 & +1 & +2 = 4) ... and then next player will continue the game"
    advanceTurn(state, 1);

    emitEvent('playerDrewPenalty', state.lastActionNotification);
    emitEvent('stateBroadcast', null);

    return { success: true, moveId, penaltyTaken: penaltyTotal, drawnCount: drawn.length };
  }

  if (state.hasDrawnThisTurn) {
    return { success: false, error: 'ALREADY_DRAWN_THIS_TURN' };
  }

  const drawn = drawCards(playerId, 1, state);
  if (drawn.length === 0) {
    return { success: false, error: 'DECK_EMPTY' };
  }

  // Mark that player has drawn a card this turn
  state.hasDrawnThisTurn = true;
  state.drawnCardId = drawn[0]?.id || null;

  // Create move record (drawing is a move — Caught window opens)
  const moveId = uuidv4();
  state.lastMove = {
    moveId,
    playerId,
    cardId: null,
    timestamp: Date.now(),
    result: 'DREW',
    unoPressed: false,
    caught: false,
    caughtBy: null,
  };

  // Official rule: Turn does NOT advance automatically! Player may now drop a card or pass!

  const drawingPlayer = state.players.find(p => p.id === playerId);
  state.lastActionNotification = {
    id: uuidv4(),
    type: 'DRAW',
    playedById: playerId,
    playedByName: drawingPlayer ? drawingPlayer.name : 'Player',
    targetId: playerId,
    targetName: drawingPlayer ? drawingPlayer.name : 'Player',
    cardType: 'DRAW',
    cardValue: null,
    cardColor: null,
    drawCount: 1,
    timestamp: Date.now(),
  };

  const hand = state.hands[playerId];
  if (hand && hand.length === 1 && !state.unoPressedBy[playerId]) {
    openCaughtWindow(state, moveId, playerId);
  } else {
    state.caughtWindow = {
      active: false,
      moveId: null,
      targetPlayerId: null,
      expiresAt: null,
      resolved: false,
    };
  }
  emitEvent('stateBroadcast', null);
  return { success: true, moveId, drawnCard: drawn[0] };
}

/**
 * Process a "pass turn" action.
 * Official UNO Flip rule: Player CANNOT pass unless they have drawn a card from the bundle on their turn.
 *
 * @param {string}   playerId
 * @param {object}   state
 * @param {Function} emitEvent
 * @returns {{ success: boolean, error?: string }}
 */
function processPassTurn(playerId, state, emitEvent) {
  if (state.currentPlayerId !== playerId) {
    return { success: false, error: 'NOT_YOUR_TURN' };
  }
  if (state.pendingDrawStack && state.pendingDrawStack.active) {
    return { success: false, error: 'CANNOT_PASS_DURING_DRAW_ATTACK' };
  }
  if (!state.hasDrawnThisTurn) {
    return { success: false, error: 'CANNOT_PASS_WITHOUT_DRAWING' };
  }

  state.hasDrawnThisTurn = false;
  state.drawnCardId = null;

  const passingPlayer = state.players.find(p => p.id === playerId);
  state.lastActionNotification = {
    id: uuidv4(),
    type: 'PASS',
    playedById: playerId,
    playedByName: passingPlayer ? passingPlayer.name : 'Player',
    targetId: playerId,
    targetName: passingPlayer ? passingPlayer.name : 'Player',
    cardType: 'PASS',
    cardValue: null,
    cardColor: null,
    drawCount: 0,
    timestamp: Date.now(),
  };

  state.caughtWindow = {
    active: false,
    moveId: null,
    targetPlayerId: null,
    expiresAt: null,
    resolved: false,
  };

  // Turn advances to next active player
  advanceTurn(state, 1);

  emitEvent('stateBroadcast', null);
  return { success: true };
}

/**
 * Process a player pressing the UNO button.
 *
 * @param {string}   playerId
 * @param {object}   state
 * @returns {{ success: boolean, error?: string }}
 */
function processPressUno(playerId, state) {
  const hand = state.hands[playerId];
  if (!hand) return { success: false, error: 'PLAYER_NOT_FOUND' };

  if (hand.length !== 1 && hand.length !== 2) {
    return { success: false, error: 'NOT_IN_UNO_STATE' };
  }

  state.unoPressedBy[playerId] = true;
  if (state.playerActions && state.playerActions[playerId]) {
    state.playerActions[playerId].unoCalls += 1;
  }
  if (state.lastMove && state.lastMove.playerId === playerId) {
    state.lastMove.unoPressed = true;
  }

  // If a Caught window was targeting this player, resolve it immediately
  if (state.caughtWindow && state.caughtWindow.targetPlayerId === playerId) {
    state.caughtWindow.active = false;
    state.caughtWindow.resolved = true;
    if (state.caughtWindowTimer) {
      clearTimeout(state.caughtWindowTimer);
      state.caughtWindowTimer = null;
    }
  }

  return { success: true };
}

// ─── Caught System ────────────────────────────────────────────────────────────

/**
 * Open the Caught window after a move is completed.
 * Sets a server-side timer to close it after caughtWindowDuration ms.
 */
function openCaughtWindow(state, moveId, targetPlayerId) {
  // Clear any previous timer
  if (state.caughtWindowTimer) {
    clearTimeout(state.caughtWindowTimer);
    state.caughtWindowTimer = null;
  }

  const duration = state.config.caughtWindowDuration;
  const expiresAt = Date.now() + duration;

  state.caughtWindow = {
    active: true,
    moveId,
    targetPlayerId,
    expiresAt,
    resolved: false,
  };

  // Auto-close after duration
  state.caughtWindowTimer = setTimeout(() => {
    if (state.caughtWindow.moveId === moveId) {
      state.caughtWindow.active = false;
    }
  }, duration);
}

/**
 * Process a Caught action.
 *
 * Validates:
 *  1. catcherId !== targetPlayerId (no self-catching)
 *  2. The Caught window is still open
 *  3. The moveId matches the current move
 *  4. The window has not already been resolved
 *  5. The move was actually illegal OR the player failed to press UNO
 *
 * Uses atomic resolution — only ONE caught action wins.
 *
 * @param {string}   catcherId      Player pressing Caught.
 * @param {string}   targetPlayerId Player being caught.
 * @param {string}   moveId
 * @param {object}   state
 * @param {Function} emitEvent
 * @returns {{ success: boolean, error?: string }}
 */
function processCaught(catcherId, targetPlayerId, moveId, state, emitEvent) {
  // 1. Self-catch not allowed
  if (catcherId === targetPlayerId) {
    return { success: false, error: 'SELF_CATCH_NOT_ALLOWED' };
  }

  // 2. Check window is open
  const win = state.caughtWindow;
  if (!win.active) {
    return { success: false, error: 'CAUGHT_WINDOW_CLOSED' };
  }

  // 3. Check moveId matches
  if (win.moveId !== moveId) {
    return { success: false, error: 'STALE_MOVE_ID' };
  }

  // 4. Already resolved?
  if (win.resolved) {
    return { success: false, error: 'ALREADY_CAUGHT' };
  }

  // 5. Check expiry (server-side double-check)
  if (Date.now() > win.expiresAt) {
    win.active = false;
    return { success: false, error: 'CAUGHT_WINDOW_EXPIRED' };
  }

  // 6. Validate the violation
  const lastMove = state.lastMove;
  if (!lastMove || lastMove.moveId !== moveId) {
    return { success: false, error: 'MOVE_NOT_FOUND' };
  }

  // Check: Did the target player fail to press UNO when they should have?
  const targetHand = state.hands[targetPlayerId];
  const unoPressedCorrectly = state.unoPressedBy[targetPlayerId];
  const shouldHavePressedUno = targetHand && targetHand.length === 1 && !unoPressedCorrectly;

  // Check: Was the last move a wrong move (result = 'ILLEGAL' stored by validation)?
  // In our system, illegal moves are rejected before they alter state, so they won't
  // appear in lastMove with result='PLAYED'. We check UNO failure here.
  const isValidCatch = shouldHavePressedUno;

  if (!isValidCatch) {
    return { success: false, error: 'NO_VIOLATION_DETECTED' };
  }

  // ATOMICALLY resolve — mark window as resolved immediately
  win.resolved = true;
  win.active   = false;
  if (state.caughtWindowTimer) {
    clearTimeout(state.caughtWindowTimer);
    state.caughtWindowTimer = null;
  }

  // Apply penalty: +7 cards to targetPlayerId
  const penalty = state.config.caughtPenalty;
  drawCards(targetPlayerId, penalty, state);
  delete state.unoPressedBy[targetPlayerId];

  // Track caught statistics
  if (state.playerActions) {
    if (state.playerActions[catcherId]) {
      state.playerActions[catcherId].caughtSuccess += 1;
    }
    if (state.playerActions[targetPlayerId]) {
      state.playerActions[targetPlayerId].caughtPenalized += 1;
    }
  }

  // Record
  lastMove.caught   = true;
  lastMove.caughtBy = catcherId;

  emitEvent('caughtResolved', {
    catcherId,
    targetPlayerId,
    penaltyCards: penalty,
    moveId,
  });
  emitEvent('stateBroadcast', null);

  return { success: true };
}

// ─── Public State View ────────────────────────────────────────────────────────

/**
 * Build the public game state — safe to broadcast to ALL clients.
 * Does NOT include any player's hand.
 *
 * @param {object} state
 * @returns {object}
 */
function getPublicState(state) {
  return {
    gameId: state.gameId,
    status: state.status,
    config: state.config,
    players: state.players.map(p => {
      const finisher = (state.finishers || []).find(f => f.playerId === p.id);
      return {
        id:        p.id,
        name:      p.name,
        isBot:     p.isBot,
        cardCount: (state.hands[p.id] || []).length,
        unoPressedCorrectly: !!state.unoPressedBy[p.id],
        isFinished: !!finisher,
        rank: finisher ? finisher.rank : null,
      };
    }),
    finishers: (state.finishers || []).map(f => ({
      playerId: f.playerId,
      playerName: f.playerName,
      rank: f.rank,
      cardCount: f.cardCount || 0,
      isBot: !!f.isBot,
    })),
    discardPile: [state.discardPile[state.discardPile.length - 1]], // only top card
    deckCount:   state.deck.length,
    activeSide:  state.activeSide,
    currentColor: state.currentColor,
    direction:   state.direction,
    currentPlayerId: state.currentPlayerId,
    caughtWindow: {
      active:        state.caughtWindow.active,
      moveId:        state.caughtWindow.moveId,
      targetPlayerId: state.caughtWindow.targetPlayerId,
      expiresAt:     state.caughtWindow.expiresAt,
      resolved:      state.caughtWindow.resolved,
    },
    winner:    state.winner,
    hasDrawnThisTurn: !!state.hasDrawnThisTurn,
    drawnCardId: state.hasDrawnThisTurn ? state.drawnCardId : null,
    pendingDrawStack: state.pendingDrawStack ? {
      active: !!state.pendingDrawStack.active,
      totalCards: state.pendingDrawStack.totalCards || 0,
      currentLevel: state.pendingDrawStack.currentLevel || 0,
      initiatorId: state.pendingDrawStack.initiatorId || null,
      history: state.pendingDrawStack.history || [],
    } : { active: false, totalCards: 0, currentLevel: 0, initiatorId: null, history: [] },
    turnCount: state.turnCount,
    totalFlips: state.totalFlips || 0,
    startedAt: state.startedAt || Date.now(),
    lastActionNotification: state.lastActionNotification || null,
  };
}

/**
 * Get the private hand for a specific player.
 * ONLY send this to the requesting player's socket — never broadcast.
 *
 * @param {string} playerId
 * @param {object} state
 * @returns {Card[]}
 */
function getPlayerHand(playerId, state) {
  return state.hands[playerId] || [];
}

module.exports = {
  createGame,
  processPlayCard,
  processDrawCard,
  processPassTurn,
  processPressUno,
  processCaught,
  drawCards,
  getPublicState,
  getPlayerHand,
  openCaughtWindow,
};
