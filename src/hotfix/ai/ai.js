import { AI_PLAYER, FIGURE_BLOCK, SUITS } from "../game/constants.js";
import { allValidAttacks, attackDamage, blockValue, canCardBlock, sortCards } from "../game/cards.js";

const FIGURE_RANKS = new Set(["J", "Q", "K", "A"]);

function isFigure(card) {
  return FIGURE_RANKS.has(card.rank);
}

function attackSpendsFigure(cards) {
  return cards.some(isFigure);
}

function attackSpendsAce(cards) {
  return cards.some((card) => card.rank === "A");
}

function attackIsCombo(cards) {
  return cards.length >= 2;
}

function attackIsJab(cards) {
  return cards.length === 1;
}

function handWithoutCard(hand, removedCard) {
  return hand.filter((card) => card.id !== removedCard.id);
}

function opponentIndex() {
  return AI_PLAYER === 0 ? 1 : 0;
}

function opponentRecentlySpentFigure(game) {
  const enemy = game.players[opponentIndex()];
  const recentLogs = game.log.slice(0, 4).join(" | ");
  if (!recentLogs.includes(`${enemy.name} útočí:`)) return false;
  return /útočí:.*(?:A|J|Q|K)[♠♣♥♦]/.test(recentLogs);
}

function bestAttack(attacks) {
  return [...attacks].sort((a, b) => {
    const damageDiff = attackDamage(b) - attackDamage(a);
    if (damageDiff !== 0) return damageDiff;

    const figureDiff = Number(attackSpendsFigure(a)) - Number(attackSpendsFigure(b));
    if (figureDiff !== 0) return figureDiff;

    return b.length - a.length;
  })[0] ?? null;
}

function cheapestBlock(blocks) {
  return [...blocks].sort((a, b) => blockValue(a.rank) - blockValue(b.rank))[0] ?? null;
}

function bestBlockForCounterattack(game, blocks) {
  const ai = game.players[AI_PLAYER];

  const blocksThatOpenCombo = blocks.filter((block) => {
    const futureHand = handWithoutCard(ai.hand, block);
    const futureAttacks = allValidAttacks(futureHand, block.color);
    return futureAttacks.some(attackIsCombo);
  });

  if (blocksThatOpenCombo.length) {
    return cheapestBlock(blocksThatOpenCombo);
  }

  return cheapestBlock(blocks);
}

export function aiPickInitiativeCard(hand) {
  return sortCards(hand)[0];
}

export function chooseAIMulligan(game) {
  const ai = game.players[AI_PLAYER];
  const protectedIds = new Set((game.revealedInitiative ?? []).map((card) => card.id));
  const attacks = allValidAttacks(ai.hand, null);
  const comboCardIds = new Set(attacks.filter(attackIsCombo).flatMap((cards) => cards.map((card) => card.id)));

  return ai.hand.filter((card) => {
    if (protectedIds.has(card.id)) return false;
    if (isFigure(card)) return false;
    if (comboCardIds.has(card.id)) return false;
    return true;
  });
}

export function bestBlockForAttack(hand, attackSize) {
  const blocks = hand.filter((card) => canCardBlock(card, attackSize));
  if (!blocks.length) return null;
  return cheapestBlock(blocks);
}

export function chooseAIAttack(game) {
  const hybrid = game.aiLevel === "hybrid";
  const ai = game.players[AI_PLAYER];
  const enemy = game.players[game.defender];
  const attacks = allValidAttacks(ai.hand, game.lastAttackColor);

  if (!attacks.length) return null;

  const lethal = attacks.find((cards) => attackDamage(cards) >= enemy.deck.length);
  if (lethal) return lethal;

  if (!hybrid) {
    const pressure = attacks.filter((cards) => {
      const damage = attackDamage(cards);
      if (attackIsJab(cards) && attackSpendsAce(cards)) return false;
      if (attackSpendsAce(cards) && damage < 12 && enemy.deck.length > 12) return false;
      if (damage >= 9) return true;
      if (damage >= 6 && enemy.deck.length <= 18) return true;
      return false;
    });

    if (pressure.length) return bestAttack(pressure);

    const nonAceJabs = attacks.filter((cards) => attackIsJab(cards) && cards[0].rank !== "A");
    if (nonAceJabs.length && enemy.deck.length > 10) return nonAceJabs[0];

    const safeAttacks = attacks.filter((cards) => !attackSpendsAce(cards));
    if (safeAttacks.length && ai.hand.length >= 7) return bestAttack(safeAttacks);

    return null;
  }

  const combos = attacks.filter(attackIsCombo);
  const nonFigureJabs = attacks.filter((cards) => attackIsJab(cards) && !attackSpendsFigure(cards));
  const safeCombos = combos.filter((cards) => {
    const damage = attackDamage(cards);
    if (attackSpendsAce(cards) && damage < 12 && enemy.deck.length > 12) return false;
    return true;
  });

  const enemyLowDeck = enemy.deck.length <= 16;
  const enemyVeryLowDeck = enemy.deck.length <= 10;
  const enemySpentFigure = opponentRecentlySpentFigure(game);

  if ((enemyLowDeck || enemySpentFigure) && safeCombos.length) {
    return bestAttack(safeCombos);
  }

  if (enemyVeryLowDeck && combos.length) {
    return bestAttack(combos);
  }

  if (nonFigureJabs.length && enemy.deck.length > 8) {
    return nonFigureJabs[0];
  }

  const nonFigureAttacks = attacks.filter((cards) => !attackSpendsFigure(cards));
  if (nonFigureAttacks.length && ai.hand.length >= 7) {
    return bestAttack(nonFigureAttacks);
  }

  return null;
}

export function chooseAIBlock(game) {
  const hybrid = game.aiLevel === "hybrid";
  const ai = game.players[AI_PLAYER];
  const attackSize = game.currentAttack.length;
  const damage = attackDamage(game.currentAttack);
  const possibleBlocks = ai.hand.filter((card) => canCardBlock(card, attackSize));

  if (!possibleBlocks.length) return null;

  if (!hybrid) {
    const block = cheapestBlock(possibleBlocks);
    if (block.rank === "A") {
      if (damage >= 12) return block;
      if (ai.deck.length <= 12 && damage >= 6) return block;
      return null;
    }

    if (damage >= 6) return block;
    if (attackSize >= 3) return block;
    if (ai.deck.length <= 12 && damage >= 3) return block;

    return null;
  }

  const counterBlock = bestBlockForCounterattack(game, possibleBlocks);
  const futureHand = counterBlock ? handWithoutCard(ai.hand, counterBlock) : ai.hand;
  const futureAttacks = counterBlock ? allValidAttacks(futureHand, counterBlock.color) : [];
  const hasCounterCombo = futureAttacks.some(attackIsCombo);

  const opponentUsedFigureNow = attackSpendsFigure(game.currentAttack);
  const danger = damage >= 6 || attackSize >= 3 || ai.deck.length <= 14;

  if (hasCounterCombo && counterBlock) {
    if (counterBlock.rank === "A") {
      if (damage >= 12 || ai.deck.length <= 10 || opponentUsedFigureNow) return counterBlock;
      return null;
    }

    if (damage >= 2) return counterBlock;
  }

  const block = cheapestBlock(possibleBlocks);

  if (block.rank === "A") {
    if (damage >= 12) return block;
    if (ai.deck.length <= 10 && damage >= 6) return block;
    if (opponentUsedFigureNow && damage >= 6) return block;
    return null;
  }

  if (danger) return block;
  if (opponentUsedFigureNow && damage >= 3) return block;

  return null;
}

export function chooseAIRecovery(game) {
  const ai = game.players[AI_PLAYER];
  const enemy = game.players[opponentIndex()];

  const suitScores = SUITS.map((suit) => {
    const cards = ai.table.filter((card) => card.suit === suit.id);
    const figures = cards.filter(isFigure);
    const aces = cards.filter((card) => card.rank === "A");
    const numbers = cards.filter((card) => !isFigure(card));

    let score = cards.length * 2 + figures.length * 5 + aces.length * 4 + numbers.length;

    if (game.round >= 5 || ai.deck.length <= 14) {
      score += cards.length * 2;
    }

    if (enemy.deck.length <= 14) {
      score += figures.length * 3;
    }

    return { suitId: suit.id, score, count: cards.length };
  }).sort((a, b) => b.score - a.score || b.count - a.count);

  return suitScores[0]?.count > 0 ? suitScores[0].suitId : null;
}
