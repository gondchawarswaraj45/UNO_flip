'use strict';

const assert = require('assert');
const { createOfficialUnoFlipDeck, validateDeck } = require('../src/engine/deckDefinition');
const { buildDeck, getActiveFace } = require('../src/engine/cards');
const { shuffleDeck } = require('../src/engine/shuffle');
const { createGame, processPlayCard, processDrawCard } = require('../src/engine/game');
const { CARD_TYPE, ACTIVE_SIDE, GAME_MODE, LIGHT_COLORS, DARK_COLORS } = require('../src/engine/config');

console.log('Running UNO Flip Official 112-Card Deck Validation Suite...\n');

// ─── Test 1: Physical Deck Structure & Exact Card Composition ────────────────
const deck = createOfficialUnoFlipDeck();

console.log('✓ Test 1.1: Exactly 112 physical cards exist');
assert.strictEqual(deck.length, 112, `Expected 112 physical cards, but got ${deck.length}`);

console.log('✓ Test 1.2: Every card has a valid unique ID');
const ids = new Set(deck.map(c => c.id));
assert.strictEqual(ids.size, 112, 'Each card must have a unique ID');

console.log('✓ Test 1.3: Every card has both a Light Side and Dark Side');
for (let i = 0; i < deck.length; i++) {
  const c = deck[i];
  assert.ok(c.lightSide, `Card ${i} missing lightSide`);
  assert.ok(c.darkSide, `Card ${i} missing darkSide`);
  assert.ok(c.lightSide.color, `Card ${i} lightSide missing color`);
  assert.ok(c.lightSide.type, `Card ${i} lightSide missing type`);
  assert.ok(c.darkSide.color, `Card ${i} darkSide missing color`);
  assert.ok(c.darkSide.type, `Card ${i} darkSide missing type`);
}

// ─── Test 2: Light Side Verification ──────────────────────────────────────────
const lightStats = {
  colors: {},
  types: {},
  numbers: {},
};

for (const c of deck) {
  const l = c.lightSide;
  lightStats.colors[l.color] = (lightStats.colors[l.color] || 0) + 1;
  lightStats.types[l.type] = (lightStats.types[l.type] || 0) + 1;
  if (l.type === CARD_TYPE.NUMBER) {
    const key = `${l.color}_${l.value}`;
    lightStats.numbers[key] = (lightStats.numbers[key] || 0) + 1;
  }
}

console.log('✓ Test 2.1: Light Side colors (Red: 26, Blue: 26, Green: 26, Yellow: 26, Wild: 8)');
assert.strictEqual(lightStats.colors[LIGHT_COLORS.RED], 26);
assert.strictEqual(lightStats.colors[LIGHT_COLORS.BLUE], 26);
assert.strictEqual(lightStats.colors[LIGHT_COLORS.GREEN], 26);
assert.strictEqual(lightStats.colors[LIGHT_COLORS.YELLOW], 26);
assert.strictEqual(lightStats.colors.WILD, 8);

console.log('✓ Test 2.2: Light Side numbers 1-9 (2 copies each per color, NO 0 cards)');
for (const color of [LIGHT_COLORS.RED, LIGHT_COLORS.BLUE, LIGHT_COLORS.GREEN, LIGHT_COLORS.YELLOW]) {
  assert.strictEqual(lightStats.numbers[`${color}_0`], undefined, `Light side ${color} must not contain 0`);
  for (let n = 1; n <= 9; n++) {
    assert.strictEqual(lightStats.numbers[`${color}_${n}`], 2, `Light ${color} ${n} must have 2 copies`);
  }
}
assert.strictEqual(lightStats.types[CARD_TYPE.NUMBER], 72);

console.log('✓ Test 2.3: Light Side action cards (8 Draw One, 8 Reverse, 8 Skip, 8 Flip)');
assert.strictEqual(lightStats.types[CARD_TYPE.DRAW_ONE], 8);
assert.strictEqual(lightStats.types[CARD_TYPE.REVERSE], 8);
assert.strictEqual(lightStats.types[CARD_TYPE.SKIP], 8);
assert.strictEqual(lightStats.types[CARD_TYPE.FLIP], 8);

console.log('✓ Test 2.4: Light Side wild cards (4 Wild, 4 Wild Draw Two)');
assert.strictEqual(lightStats.types[CARD_TYPE.WILD], 4);
assert.strictEqual(lightStats.types[CARD_TYPE.WILD_DRAW_TWO], 4);

// ─── Test 3: Dark Side Verification ───────────────────────────────────────────
const darkStats = {
  colors: {},
  types: {},
  numbers: {},
};

for (const c of deck) {
  const d = c.darkSide;
  darkStats.colors[d.color] = (darkStats.colors[d.color] || 0) + 1;
  darkStats.types[d.type] = (darkStats.types[d.type] || 0) + 1;
  if (d.type === CARD_TYPE.NUMBER) {
    const key = `${d.color}_${d.value}`;
    darkStats.numbers[key] = (darkStats.numbers[key] || 0) + 1;
  }
}

console.log('✓ Test 3.1: Dark Side colors (Pink: 26, Teal: 26, Orange: 26, Purple: 26, Wild: 8)');
assert.strictEqual(darkStats.colors[DARK_COLORS.PINK], 26);
assert.strictEqual(darkStats.colors[DARK_COLORS.TEAL], 26);
assert.strictEqual(darkStats.colors[DARK_COLORS.ORANGE], 26);
assert.strictEqual(darkStats.colors[DARK_COLORS.PURPLE], 26);
assert.strictEqual(darkStats.colors.WILD, 8);

console.log('✓ Test 3.2: Dark Side numbers 1-9 (2 copies each per color, NO 0 cards)');
for (const color of [DARK_COLORS.PINK, DARK_COLORS.TEAL, DARK_COLORS.ORANGE, DARK_COLORS.PURPLE]) {
  assert.strictEqual(darkStats.numbers[`${color}_0`], undefined, `Dark side ${color} must not contain 0`);
  for (let n = 1; n <= 9; n++) {
    assert.strictEqual(darkStats.numbers[`${color}_${n}`], 2, `Dark ${color} ${n} must have 2 copies`);
  }
}
assert.strictEqual(darkStats.types[CARD_TYPE.NUMBER], 72);

console.log('✓ Test 3.3: Dark Side action cards (8 Draw Five, 8 Reverse, 8 Skip Everyone, 8 Flip)');
assert.strictEqual(darkStats.types[CARD_TYPE.DRAW_FIVE], 8);
assert.strictEqual(darkStats.types[CARD_TYPE.REVERSE], 8);
assert.strictEqual(darkStats.types[CARD_TYPE.SKIP_EVERYONE], 8);
assert.strictEqual(darkStats.types[CARD_TYPE.FLIP], 8);

console.log('✓ Test 3.4: Dark Side wild cards (4 Wild, 4 Wild Draw Color)');
assert.strictEqual(darkStats.types[CARD_TYPE.WILD], 4);
assert.strictEqual(darkStats.types[CARD_TYPE.WILD_DRAW_COLOR], 4);

// ─── Test 4: Built-in validateDeck function ───────────────────────────────────
console.log('✓ Test 4.1: validateDeck() passes without throwing');
assert.strictEqual(validateDeck(deck), true);

// ─── Test 5: Fisher-Yates Shuffle & Card Identity Preservation ─────────────────
console.log('✓ Test 5.1: Fisher-Yates shuffle preserves all 112 physical cards and pairs');
const shuffledDeck = shuffleDeck([...deck]);
assert.strictEqual(shuffledDeck.length, 112);
validateDeck(shuffledDeck);

// Verify that the pairing on each card remained identical after shuffle
for (const c of shuffledDeck) {
  const original = deck.find(orig => orig.id === c.id);
  assert.deepStrictEqual(c.lightSide, original.lightSide);
  assert.deepStrictEqual(c.darkSide, original.darkSide);
}

// ─── Test 6: Flip Mechanic and Active Face Resolution ─────────────────────────
console.log('✓ Test 6.1: getActiveFace switches faces based on activeSide without mutating card');
const sampleCard = deck[0];
assert.deepStrictEqual(getActiveFace(sampleCard, ACTIVE_SIDE.LIGHT), sampleCard.lightSide);
assert.deepStrictEqual(getActiveFace(sampleCard, ACTIVE_SIDE.DARK), sampleCard.darkSide);

console.log('\n===============================================================');
console.log('🎉 ALL 112-CARD DECK & SYSTEM VALIDATION CHECKS PASSED FLAWLESSLY!');
console.log('===============================================================\n');
