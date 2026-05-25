import { AI_PLAYER, FIGURE_BLOCK, SUITS } from "../game/constants.js";
import {
  allValidAttacks,
  attackDamage,
  blockValue,
  canCardBlock,
  sortCards,
} from "../game/cards.js";
export const aiPickInitiativeCard = (hand) => sortCards(hand)[0];
export function bestBlockForAttack(hand, size) {
  const b = hand.filter((c) => canCardBlock(c, size));
  return b.length
    ? [...b].sort((a, b) => blockValue(a.rank) - blockValue(b.rank))[0]
    : null;
}
export function scoreRecoverySuit(cards) {
  const figures = cards.filter((c) => c.rank in FIGURE_BLOCK);
  const ranks = new Set(cards.map((c) => c.rank));
  return figures.length * 6 + cards.length + (ranks.has("A") ? 4 : 0);
}
export function pickRecoverySuit(player) {
  const scored = SUITS.map((s) => {
    const cards = sortCards(player.table.filter((c) => c.suit === s.id));
    return { suit: s.id, cards, score: scoreRecoverySuit(cards) };
  })
    .filter((x) => x.cards.length > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.suit ?? null;
}
export function chooseAIAttack(g) {
  const hybrid = g.aiLevel === "hybrid",
    ai = g.players[AI_PLAYER],
    enemy = g.players[g.defender],
    attacks = allValidAttacks(ai.hand, g.lastAttackColor);
  if (!hybrid) {
    const m = attacks.filter(
      (c) => attackDamage(c) >= 6 || enemy.deck.length <= 10,
    );
    if (m.length) return m[0];
    if (attacks.length && ai.hand.length >= 7) return attacks[0];
    return null;
  }
  const lethal = attacks.find((c) => attackDamage(c) >= enemy.deck.length);
  if (lethal) return lethal;
  const pressure = attacks.filter((c) => {
    const dmg = attackDamage(c),
      spendsAce = c.some((x) => x.rank === "A");
    if (c.length === 1 && spendsAce) return false;
    if (spendsAce && dmg < 12 && enemy.deck.length > 12) return false;
    if (dmg >= 9) return true;
    if (dmg >= 6 && enemy.deck.length <= 18) return true;
    return false;
  });
  if (pressure.length) return pressure[0];
  const nonAceJabs = attacks.filter((a) => a.length === 1 && a[0].rank !== "A");
  if (nonAceJabs.length && enemy.deck.length > 10) return nonAceJabs[0];
  const safe = attacks.filter((a) => !a.some((c) => c.rank === "A"));
  if (safe.length && ai.hand.length >= 7) return safe[0];
  return null;
}
export function chooseAIBlock(g) {
  const hybrid = g.aiLevel === "hybrid",
    size = g.currentAttack.length,
    damage = attackDamage(g.currentAttack),
    block = bestBlockForAttack(g.players[AI_PLAYER].hand, size);
  if (!block) return null;
  if (!hybrid)
    return damage >= 6 ||
      block.rank !== "A" ||
      size >= 3 ||
      g.players[AI_PLAYER].deck.length <= 12
      ? block
      : null;
  if (block.rank === "A") {
    if (damage >= 12) return block;
    if (g.players[AI_PLAYER].deck.length <= 12 && damage >= 6) return block;
    return null;
  }
  if (damage >= 6) return block;
  if (size >= 3) return block;
  if (g.players[AI_PLAYER].deck.length <= 12 && damage >= 3) return block;
  return null;
}
export function chooseAIRecovery(game) {
  return pickRecoverySuit(game.players[AI_PLAYER]);
}
