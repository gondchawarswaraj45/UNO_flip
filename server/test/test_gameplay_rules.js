/**
 * Comprehensive Gameplay & Rules Validation Test
 */

'use strict';

const assert = require('assert');
const { createRoom, startGame, addBot } = require('../src/rooms/roomManager');
const { processPlayCard, processDrawCard, processPressUno } = require('../src/engine/game');
const { CARD_TYPE, ACTIVE_SIDE, GAME_MODE, COLOR_MODE } = require('../src/engine/config');
const { validatePlay, isUnoState } = require('../src/engine/rules');
const { generateRefereeCommentary } = require('../src/services/groqService');

async function runTests() {
  console.log('--- Testing UNO Flip Rules & Groq AI Referee ---');

  // 1. Test Groq Commentary
  console.log('1. Testing Groq AI Referee live commentary API...');
  const commentary = await generateRefereeCommentary('FLIP', { actorName: 'MasterCardm' });
  console.log('   Groq Referee Output:', commentary);
  assert(typeof commentary === 'string' && commentary.length > 0, 'Commentary must not be empty');
  console.log('✓ Groq AI Referee generated commentary successfully!');

  // 2. Test Rule: Cannot win on power card
  console.log('2. Testing Rule: Last card must be a number card...');
  const mockState = {
    currentPlayerId: 'p1',
    activeSide: ACTIVE_SIDE.LIGHT,
    currentColor: 'RED',
    discardPile: [{ lightSide: { color: 'RED', type: CARD_TYPE.NUMBER, value: 5 } }],
    pendingDrawStack: null,
    config: { mode: GAME_MODE.TWO_SIDE, colorMode: COLOR_MODE.FOUR },
    hands: {},
  };

  const actionCard = {
    id: 'test_skip',
    lightSide: { color: 'RED', type: CARD_TYPE.SKIP, value: null },
    darkSide: { color: 'PINK', type: CARD_TYPE.SKIP_EVERYONE, value: null },
  };

  const numberCard = {
    id: 'test_num',
    lightSide: { color: 'RED', type: CARD_TYPE.NUMBER, value: 7 },
    darkSide: { color: 'PINK', type: CARD_TYPE.NUMBER, value: 7 },
  };

  // If hand has 1 card and it is an action card:
  mockState.hands.p1 = [actionCard];
  const validationAction = validatePlay('p1', actionCard.id, mockState, null);
  assert.strictEqual(validationAction.valid, false);
  assert.strictEqual(validationAction.reason, 'LAST_CARD_MUST_BE_NUMBER');
  console.log('✓ Power card rejected when attempting to win!');

  // If hand has 1 card and it is a number card:
  mockState.hands.p1 = [numberCard];
  const validationNumber = validatePlay('p1', numberCard.id, mockState, null);
  assert.strictEqual(validationNumber.valid, true);
  console.log('✓ Number card accepted for final winning play!');

  // 3. Test Flip card with Wild on back requiring color choice
  console.log('3. Testing Flip card with Wild on opposite face...');
  const flipWithWildBack = {
    id: 'test_flip_wild',
    lightSide: { color: 'RED', type: CARD_TYPE.FLIP, value: null },
    darkSide: { color: 'WILD', type: CARD_TYPE.WILD_DRAW_COLOR, value: null },
  };

  mockState.hands.p1 = [flipWithWildBack, numberCard];
  // Without color choice:
  const noColorValidation = validatePlay('p1', flipWithWildBack.id, mockState, null);
  assert.strictEqual(noColorValidation.valid, false);
  assert.strictEqual(noColorValidation.reason, 'WILD_REQUIRES_COLOR_CHOICE');
  console.log('✓ Flip card with Wild back correctly requires chosenColor!');

  // With legal Dark Side color choice (e.g. 'PINK'):
  const withColorValidation = validatePlay('p1', flipWithWildBack.id, mockState, 'PINK');
  assert.strictEqual(withColorValidation.valid, true);
  console.log('✓ Flip card with Wild back accepted with valid chosenColor!');

  // 4. Test UNO state validation
  console.log('4. Testing UNO state validation...');
  const testGameState = { hands: { p1: [numberCard], p2: [numberCard, actionCard], p3: [numberCard, actionCard, flipWithWildBack] } };
  assert.strictEqual(isUnoState('p1', testGameState), true);
  assert.strictEqual(isUnoState('p2', testGameState), true);
  assert.strictEqual(isUnoState('p3', testGameState), false);
  console.log('✓ UNO state verified: active when player is at 1 or 2 cards!');

  console.log('\n🎉 ALL GAMEPLAY RULES & GROQ REFEREE TESTS PASSED PERFECTLY!\n');
}

runTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
