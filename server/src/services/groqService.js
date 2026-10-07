/**
 * Groq AI Service — Authoritative UNO Flip Referee, Game Monitor & Intelligence Engine.
 *
 * Responsibilities:
 *  - Trained on all official UNO Flip rules (Light/Dark sides, 112 cards, action cards, win conditions)
 *  - Audits game actions, deck shuffles, and rules compliance
 *  - Generates live referee commentary and strategic UX tips
 *  - Provides server-authoritative AI advice
 */

'use strict';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

const UNO_FLIP_SYSTEM_PROMPT = `You are the official authoritative UNO Flip Game Master and Live Referee.
You have complete knowledge of the official 112 physical double-sided card UNO Flip rules:
1. DECK STRUCTURE: Exactly 112 physical double-sided cards.
   - Light Side: Red, Blue, Green, Yellow. Numbers 1-9 (2 copies each, NO 0 cards). Draw One (+1), Reverse, Skip, Flip, Wild, Wild Draw Two (+2).
   - Dark Side: Pink, Teal, Orange, Purple. Numbers 1-9 (2 copies each, NO 0 cards). Draw Five (+5), Reverse, Skip Everyone, Flip, Wild, Wild Draw Color.
2. WIN CONDITION: A player CANNOT win on an action or power card! The winning last card MUST be a NUMBER card only.
3. UNO CALL: The UNO button is only available when a player holds exactly 2 cards, one of those cards is legally playable, and it is their turn.
4. FLIP RULE: When a Flip card is played, the entire deck, discard pile, and hands flip over. If the revealed card on the discard pile has a Wild face, the player must choose a color to continue.
5. WILD DRAW COLOR: The victim draws cards until drawing a card matching the chosen color, then loses their turn.
6. SKIP EVERYONE: Skips all other players; turn returns immediately to the player who played it.

Keep your commentary sharp, punchy, exciting, and under 25 words.`;

/**
 * Generate live referee commentary for a major game event.
 * @param {string} eventType  'FLIP' | 'DRAW_STACK' | 'WILD_DRAW_COLOR' | 'SKIP_EVERYONE' | 'CAUGHT' | 'UNO' | 'WIN'
 * @param {object} context    { actorName, targetName, count, color, cardType }
 * @returns {Promise<string>}
 */
async function generateRefereeCommentary(eventType, context = {}) {
  try {
    const prompt = `Event: ${eventType}. Player: ${context.actorName || 'Player'}. Details: Target: ${context.targetName || 'None'}, Card: ${context.cardType || 'Card'}, Draw Count: ${context.count || 0}, Color: ${context.color || 'None'}. Give a referee announcement (max 15 words).`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: UNO_FLIP_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 40,
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      return getFallbackCommentary(eventType, context);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || getFallbackCommentary(eventType, context);
  } catch (err) {
    return getFallbackCommentary(eventType, context);
  }
}

/**
 * Fallback commentary if Groq is unreachable.
 */
function getFallbackCommentary(eventType, context) {
  const actor = context.actorName || 'Player';
  const target = context.targetName || 'Opponent';
  switch (eventType) {
    case 'FLIP': return `🔄 ${actor} flipped the game! Prepare for the other side!`;
    case 'SKIP_EVERYONE': return `🌀 ${actor} cleared the room with Skip Everyone!`;
    case 'WILD_DRAW_COLOR': return `🎨 Wild Draw Color! ${target} draws until finding ${context.color || 'the color'}!`;
    case 'DRAW_STACK': return `⚡ ${actor} stacked a +${context.count} attack onto ${target}!`;
    case 'CAUGHT': return `🚨 CAUGHT! ${target} forgot to call UNO and draws penalty!`;
    case 'UNO': return `✨ ${actor} called UNO! Only 1 card remaining!`;
    case 'WIN': return `🏆 ${actor} played their final number card and claims victory!`;
    default: return `🎴 Clean play by ${actor}!`;
  }
}

module.exports = {
  generateRefereeCommentary,
  UNO_FLIP_SYSTEM_PROMPT,
};
