/**
 * Statistically-unbiased Fisher-Yates / Knuth shuffle.
 *
 * Uses crypto.getRandomValues() for uniform random integers so that
 * every permutation has equal probability (assuming the underlying CSPRNG
 * is uniform).
 *
 * The algorithm:
 *   for i from n-1 down to 1:
 *     j = random integer in [0, i]   (inclusive on both ends)
 *     swap arr[i] and arr[j]
 *
 * Properties guaranteed:
 *  - Each of the n! permutations is equally likely.
 *  - No card appears in any position with higher probability than another.
 *  - The deck is shuffled IN-PLACE and also returned for convenience.
 *  - Card objects (both sides) are moved together — sides are never split.
 *  - Repeated calls are statistically independent.
 *
 * DO NOT replace with:
 *  - arr.sort(() => Math.random() - 0.5)          ← biased
 *  - repeated random swaps                         ← biased
 *  - any "looks random" heuristic
 *
 * @param {any[]} deck  Array of card objects to shuffle.
 * @returns {any[]}     The same array, shuffled in place.
 */
'use strict';

const { webcrypto } = require('crypto');

/**
 * Generates a cryptographically secure random integer in [0, max] inclusive.
 * Uses rejection sampling to eliminate modulo bias.
 *
 * @param {number} max  Upper bound (inclusive). Must be < 2^32.
 * @returns {number}
 */
function secureRandomInt(max) {
  if (max === 0) return 0;

  // We need a value in [0, max].  Range size = max + 1.
  const range = max + 1;

  // To avoid modulo bias we use the largest multiple of `range` that fits
  // in a uint32 and reject any sample >= that multiple.
  const limit = Math.floor(0x100000000 / range) * range; // 2^32 - (2^32 % range)

  const buf = new Uint32Array(1);
  let sample;
  do {
    webcrypto.getRandomValues(buf);
    sample = buf[0];
  } while (sample >= limit);

  return sample % range;
}

/**
 * Fisher-Yates shuffle — shuffles the deck array in place.
 *
 * @param {any[]} deck
 * @returns {any[]}
 */
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = secureRandomInt(i); // j in [0, i]
    // Swap
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
}

module.exports = { shuffleDeck, secureRandomInt };
