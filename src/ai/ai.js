import { AI_PLAYER } from "../game/constants.js";
import { allValidAttacks, attackDamage, blockValue, canCardBlock, sortCards } from "../game/cards.js";
import { FIGURE_BLOCK, SUITS } from "../game/constants.js";

export function aiPickInitiativeCard(hand) {
  return sortCards(hand)[0];
}

export function bestBlockForAttack(hand, attackSize) {
  const blocks = hand.filter((card) => canCardBlock(card, attackSize));
  if (!blocks.length) return null;
  return [...blocks].sort((a, b) => blockValue(a.rank) - blockValue(b.rank))[0];
}

export function pickRecoveryCards(player, limit) {
  const groups = SUITS.map((suit) => ({
    suit,
    cards: sortCards(player.table.filter((card) => card.suit === suit.id)),
  }));

  const scored = groups
    .map((group) => {
      const figures = group.cards.filter((card) => card.rank in FIGURE_BLOCK);
      const nonFigures = group.cards.filter((card) => !(card.rank in FIGURE_BLOCK));
      const preferred = sortCards([...figures, ...nonFigures]).slice(0, limit);

      return {
        ...group,
        preferred,
        score:
          figures.length * 6 +
          group.cards.length +
          (figures.some((card) => card.rank === "A") ? 4 : 0),
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.preferred ?? [];
}

export function chooseAIAttack(game) {
  const hybrid = game.aiLevel === "hybrid";
  const ai = game.players[AI_PLAYER];
  const enemy = game.players[game.defender];
  const attacks = allValidAttacks(ai.hand, game.lastAttackColor);

  if (!hybrid) {
    const meaningful = attacks.filter((cards) => attackDamage(cards) >= 6 || enemy.deck.length <= 10);
    if (meaningful.length) return meaningful[0];
    if (attacks.length && ai.hand.length >= 7) return attacks[0];
    return null;
  }

  const lethal = attacks.find((cards) => attackDamage(cards) >= enemy.deck.length);
  if (lethal) return lethal;

  const pressure = attacks.filter((cards) => {
    const damage = attackDamage(cards);
    const spendsAce = cards.some((card) => card.rank === "A");

    if (cards.length === 1 && spendsAce) return false;          // Never waste Ace as a jab.
    if (spendsAce && damage < 12 && enemy.deck.length > 12) return false; // Save Ace unless payoff is real.
    if (damage >= 9) return true;
    if (damage >= 6 && enemy.deck.length <= 18) return true;

    return false;
  });

  if (pressure.length) return pressure[0];

  const nonAceJabs = attacks.filter((cards) => cards.length === 1 && cards[0].rank !== "A");
  if (nonAceJabs.length && enemy.deck.length > 10) return nonAceJabs[0];

  const safeAttacks = attacks.filter((cards) => !cards.some((card) => card.rank === "A"));
  if (safeAttacks.length && ai.hand.length >= 7) return safeAttacks[0];

  return null;
}

export function chooseAIBlock(game) {
  const hybrid = game.aiLevel === "hybrid";
  const attackSize = game.currentAttack.length;
  const damage = attackDamage(game.currentAttack);
  const block = bestBlockForAttack(game.players[AI_PLAYER].hand, attackSize);
  if (!block) return null;

  if (!hybrid) {
    if (damage >= 6 || block.rank !== "A" || attackSize >= 3 || game.players[AI_PLAYER].deck.length <= 12) {
      return block;
    }
    return null;
  }

  // Muhammad AI is conservative with Aces.
  if (block.rank === "A") {
    if (damage >= 12) return block;
    if (game.players[AI_PLAYER].deck.length <= 12 && damage >= 6) return block;
    return null;
  }

  if (damage >= 6) return block;
  if (attackSize >= 3) return block;
  if (game.players[AI_PLAYER].deck.length <= 12 && damage >= 3) return block;

  return null;
}

export function chooseAIRecovery(game) {
  let recovery = pickRecoveryCards(game.players[AI_PLAYER], game.recoveryLimit);

  if (game.aiLevel === "hybrid") {
    const aiDeck = game.players[AI_PLAYER].deck.length;
    const enemyIndex = AI_PLAYER === 0 ? 1 : 0;
    const enemyDeck = game.players[enemyIndex].deck.length;

    const lateGame = game.round >= 5;
    const lethalHunt = enemyDeck <= 14;

    // Do not thin early. Only recover less when deliberately hunting lethal late.
    if ((lateGame || lethalHunt) && aiDeck <= 14 && recovery.length > 2) {
      recovery = recovery.slice(0, 2);
    }
  }

  return recovery;
}
