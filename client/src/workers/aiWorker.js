/**
 * AI Bot Decision Worker — Dedicated Background Web Worker Thread.
 *
 * Runs off the main UI thread to guarantee 60fps silky smooth rendering
 * during complex card evaluations, heuristic scoring, and bluff analysis.
 */

self.onmessage = function (e) {
  const { type, payload } = e.data;

  if (type === 'EVALUATE_MOVE') {
    const { hand, topCard, activeSide, currentColor, pendingDrawStack, difficulty } = payload;
    const result = evaluateBestMove(hand, topCard, activeSide, currentColor, pendingDrawStack, difficulty);
    self.postMessage({ type: 'MOVE_EVALUATED', result });
  } else if (type === 'SIMULATE_WIN_ODDS') {
    const { hands, deckCount, activeSide } = payload;
    const odds = simulateWinProbabilities(hands, deckCount, activeSide);
    self.postMessage({ type: 'WIN_ODDS_CALCULATED', odds });
  }
};

/**
 * Heuristic card scoring executed in background thread
 */
function evaluateBestMove(hand, topCard, activeSide, currentColor, pendingDrawStack, difficulty) {
  if (!hand || hand.length === 0) return { cardId: null, chosenColor: null };

  const targetColor = currentColor || topCard?.color;
  const isAttackActive = pendingDrawStack && pendingDrawStack.active;

  // Find candidate cards
  const validCandidates = hand.map(card => {
    const face = activeSide === 'DARK' ? card.darkSide : card.lightSide;
    let score = 0;

    // Check penalty capability
    const penalty = getPenaltyValue(face?.type);

    if (isAttackActive) {
      if (penalty === 0) return null; // Can't counter
      if (penalty < pendingDrawStack.currentLevel) return null; // Can't downgrade
      // Higher counter = stronger score
      score += 100 + penalty * 20;
    } else {
      // Normal game play
      const colorMatch = face.color === targetColor;
      const typeMatch = topCard && face.type === topCard.type && face.type !== 'NUMBER';
      const valueMatch = topCard && face.type === 'NUMBER' && topCard.type === 'NUMBER' && face.value === topCard.value;
      const isWild = face.color === 'WILD' || face.type.startsWith('WILD');

      if (!colorMatch && !typeMatch && !valueMatch && !isWild) return null;

      if (face.type === 'FLIP') score += 50;
      if (penalty > 0) score += 40 + penalty * 10;
      if (face.type === 'SKIP' || face.type === 'SKIP_EVERYONE') score += 35;
      if (face.type === 'REVERSE') score += 30;
      if (face.type === 'NUMBER') score += 10 + (face.value || 0);
      if (isWild) score += 25;
    }

    // Add noise based on difficulty
    if (difficulty === 'EASY') score += (Math.random() - 0.5) * 60;
    else if (difficulty === 'MEDIUM') score += (Math.random() - 0.5) * 20;
    else score += (Math.random() - 0.5) * 5; // Hard: precise

    return { card, face, score };
  }).filter(Boolean);

  if (validCandidates.length === 0) {
    return { cardId: null, chosenColor: null };
  }

  // Sort descending by score
  validCandidates.sort((a, b) => b.score - a.score);
  const best = validCandidates[0];

  // Best color choice for Wild cards
  let chosenColor = null;
  if (best.face.color === 'WILD' || best.face.type.startsWith('WILD')) {
    chosenColor = pickBestColor(hand, activeSide);
  }

  return {
    cardId: best.card.id,
    chosenColor,
    score: best.score,
  };
}

function getPenaltyValue(type) {
  if (type === 'DRAW_ONE') return 1;
  if (type === 'DRAW_TWO' || type === 'WILD_DRAW_TWO') return 2;
  if (type === 'WILD_DRAW_FOUR') return 4;
  if (type === 'DRAW_FIVE') return 5;
  return 0;
}

function pickBestColor(hand, activeSide) {
  const counts = {};
  hand.forEach(c => {
    const face = activeSide === 'DARK' ? c.darkSide : c.lightSide;
    if (face && face.color && face.color !== 'WILD') {
      counts[face.color] = (counts[face.color] || 0) + 1;
    }
  });
  let maxColor = 'BLUE';
  let maxCount = -1;
  for (const [col, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxColor = col;
    }
  }
  return maxColor;
}

function simulateWinProbabilities(hands, deckCount, activeSide) {
  const players = Object.keys(hands || {});
  const odds = {};
  let totalWeight = 0;

  players.forEach((pid) => {
    const val = hands[pid];
    const count = typeof val === 'number' ? val : (Array.isArray(val) ? val.length : 7);
    // Lower cards remaining = higher probability of victory
    const weight = 1 / Math.pow(Math.max(1, count), 1.5);
    odds[pid] = weight;
    totalWeight += weight;
  });

  if (totalWeight > 0) {
    players.forEach((pid) => {
      odds[pid] = Math.max(1, Math.round((odds[pid] / totalWeight) * 100));
    });
  }
  return odds;
}
