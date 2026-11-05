const assert = require('assert');
const { createGame, drawCards, processPlayCard, processPassTurn, getPublicState } = require('../src/engine/game');
const { getActiveFace } = require('../src/engine/cards');
const { botDecide } = require('../src/engine/ai');
const { ACTIVE_SIDE, CARD_TYPE, DEFAULT_CONFIG } = require('../src/engine/config');

console.log('Testing Mid-Game Crash Prevention & Resiliency...');

// Test 1: getActiveFace with null/undefined
assert.strictEqual(getActiveFace(null, ACTIVE_SIDE.DARK), null);
assert.strictEqual(getActiveFace(undefined, ACTIVE_SIDE.LIGHT), null);
console.log('✓ Test 1: getActiveFace null safety passed');

// Test 2: Deck exhaustion & reshuffle
const players = [
  { id: 'p1', name: 'Player 1', isBot: false },
  { id: 'p2', name: 'Bot 1', isBot: true, difficulty: 'MEDIUM' },
];
const state = createGame(DEFAULT_CONFIG, players);
state.deck = []; // force empty deck
state.discardPile = [state.discardPile[0]]; // only 1 card

const drawn = drawCards('p1', 5, state);
// Should not throw, should handle safely and return available cards (0)
assert(Array.isArray(drawn));
assert(state.hands['p1'].every(c => c && c.id));
console.log('✓ Test 2: Deck exhaustion safety passed');

// Test 3: Pass turn when deck is exhausted
state.hasDrawnThisTurn = false;
const passRes = processPassTurn('p1', state, () => {});
assert.strictEqual(passRes.success, true);
console.log('✓ Test 3: Depleted deck pass turn passed');

// Test 4: getPublicState safety
const pub = getPublicState(state);
assert(Array.isArray(pub.players));
assert(pub.players.every(p => Array.isArray(p.cardsBack) && p.cardsBack.every(c => c && c.id)));
console.log('✓ Test 4: getPublicState cardsBack safety passed');

// Test 5: Bot decision when hand has cards
const botDecision = botDecide('p2', 'MEDIUM', state);
assert(botDecision && (botDecision.action === 'PLAY' || botDecision.action === 'DRAW'));
console.log('✓ Test 5: Bot decision safety passed');

// Test 6: UNO reset on draw & required every time
const { processPressUno } = require('../src/engine/game');
const unoState = createGame(DEFAULT_CONFIG, players);
unoState.hands['p1'] = [{ id: 'c1', lightSide: { color: 'RED', type: CARD_TYPE.NUMBER, value: 5 } }];
processPressUno('p1', unoState);
assert.strictEqual(unoState.unoPressedBy['p1'], true);

// Drawing card increases hand to 2 -> must revoke prior UNO call
drawCards('p1', 1, unoState);
assert.strictEqual(unoState.hands['p1'].length, 2);
assert.strictEqual(unoState.unoPressedBy['p1'], undefined);
const pubUno = getPublicState(unoState);
assert.strictEqual(pubUno.players.find(p => p.id === 'p1').unoPressedCorrectly, false);
console.log('✓ Test 6: UNO call correctly revoked on drawing cards (required every time)');

console.log('\n🎉 ALL RESILIENCY & CRASH PREVENTION TESTS PASSED!');

