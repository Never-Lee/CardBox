import { AI_PLAYER, MAX_ROUNDS, RECOVERY_LIMIT } from "./constants.js";
import { attackColor, attackDamage, cardLabel, drawToEight, initiativeValue, makeDeck, shuffle, sortCards } from "./cards.js";
import { aiPickInitiativeCard } from "../ai/ai.js";

export function initialGame(aiEnabled = true, aiLevel = "basic") {
  let p1 = { name: "Italský hřebec", deck: makeDeck("P1"), hand: [], table: [] };
  let p2 = {
    name: aiEnabled ? (aiLevel === "hybrid" ? "Muhammad AI" : "Sparring partner") : "Zuřící býk",
    deck: makeDeck("P2"),
    hand: [],
    table: [],
  };

  p1 = drawToEight(p1);
  p2 = drawToEight(p2);

  return {
    players: [p1, p2],
    attacker: 0,
    defender: 1,
    phase: "initiative",
    round: 1,
    maxRounds: MAX_ROUNDS,
    pausesThisRound: 0,
    recoveryLimit: RECOVERY_LIMIT,
    viewingPlayer: 0,
    pendingHandoff: false,
    selectedAttack: [],
    selectedBlock: null,
    selectedRecoverySuit: null,
    selectedInitiative: null,
    selectedInitiatives: [null, null],
    initiativePlayer: 0,
    currentAttack: null,
    lastAttackColor: null,
    revealedInitiative: null,
    recoveryStarter: null,
    recoveryPlayer: null,
    winner: null,
    aiEnabled,
    aiLevel,
    damageFlash: null,
    eventFlash: null,
    log: ["Nová hra. Vyber kartu pro iniciativu v 1. kole."],
  };
}

export function withLog(game, message) {
  return { ...game, log: [message, ...game.log].slice(0, 16) };
}

export function activeHumanPlayer(game) {
  if (game.phase === "initiative") return game.initiativePlayer ?? 0;
  if (game.phase === "attack") return game.attacker;
  if (game.phase === "block") return game.defender;
  if (game.phase === "recovery") return game.recoveryPlayer;
  return 0;
}

export function finalizeTransition(previous, next) {
  const active = activeHumanPlayer(next);
  if (!next.winner && !next.aiEnabled && activeHumanPlayer(previous) !== active) {
    return { ...next, viewingPlayer: active, pendingHandoff: true };
  }
  return { ...next, viewingPlayer: active, pendingHandoff: false };
}

export function applyInitiativeSelection(game, pickedCard) {
  const picker = game.initiativePlayer ?? 0;
  const selectedInitiatives = [...(game.selectedInitiatives ?? [null, null])];
  selectedInitiatives[picker] = pickedCard.id;

  if (!game.aiEnabled && picker === 0) {
    return withLog(
      {
        ...game,
        selectedInitiatives,
        selectedInitiative: null,
        initiativePlayer: 1,
        viewingPlayer: 1,
        pendingHandoff: true,
      },
      `${game.players[0].name} vybral kartu pro iniciativu. Předej zařízení ${game.players[1].name}.`
    );
  }

  const firstCard = game.players[0].hand.find((card) => card.id === selectedInitiatives[0]);
  const secondCard = game.aiEnabled
    ? aiPickInitiativeCard(game.players[AI_PLAYER].hand)
    : game.players[1].hand.find((card) => card.id === selectedInitiatives[1]);

  if (!firstCard || !secondCard) return game;

  let starter = 0;

if (initiativeValue(secondCard) > initiativeValue(firstCard)) {
  starter = 1;
} else if (initiativeValue(firstCard) === initiativeValue(secondCard)) {
  return withLog(
    {
      ...game,
      selectedInitiative: null,
      selectedInitiatives: [null, null],
      initiativePlayer: 0,
      revealedInitiative: [firstCard, secondCard],
      phase: "initiative",
    },
    `Remíza v iniciativě (${cardLabel(firstCard)} vs ${cardLabel(secondCard)}). Oba hráči vyberou novou kartu.`
  );
}
  return finalizeTransition(
    game,
    withLog(
      {
        ...game,
        phase: "attack",
        attacker: starter,
        defender: starter === 0 ? 1 : 0,
        viewingPlayer: starter,
        revealedInitiative: [firstCard, secondCard],
        selectedInitiative: null,
        selectedInitiatives: [null, null],
        initiativePlayer: 0,
        selectedAttack: [],
        selectedBlock: null,
        currentAttack: null,
        lastAttackColor: null,
      },
      `Iniciativa: ${cardLabel(firstCard)} vs ${cardLabel(secondCard)}. Začíná ${game.players[starter].name}.`
    )
  );
}

export function applyAttack(game, cards) {
  const attacker = game.attacker;
  const ids = new Set(cards.map((card) => card.id));
  const players = [...game.players];

  players[attacker] = {
    ...players[attacker],
    hand: sortCards(players[attacker].hand.filter((card) => !ids.has(card.id))),
    table: [...players[attacker].table, ...cards],
  };

  return withLog(
    {
      ...game,
      players,
      phase: "block",
      currentAttack: cards,
      selectedAttack: [],
      selectedBlock: null,
    },
    `${players[attacker].name} útočí: ${cards.map(cardLabel).join(" ")} — hrozí ${attackDamage(cards)} damage.`
  );
}

export function applyUnblocked(game) {
  const defender = game.defender;
  const damage = attackDamage(game.currentAttack);
  const players = [...game.players];
  const milled = players[defender].deck.slice(0, damage);

  players[defender] = {
    ...players[defender],
    deck: players[defender].deck.slice(milled.length),
    table: [...players[defender].table, ...milled],
  };

  const next = {
    ...game,
    players,
    phase: "attack",
    lastAttackColor: attackColor(game.currentAttack),
    currentAttack: null,
    selectedBlock: null,
    damageFlash: damage,
  };

  if (milled.length < damage) {
    return withLog(
      {
        ...next,
        winner: game.players[game.attacker].name,
        eventFlash: {
          type: "ko",
          text: `${players[defender].name} jde k zemi.`,
        },
      },
      `${players[defender].name} nemá dost karet na absorbování útoku. KO!`
    );
  }

  return withLog(next, `${players[defender].name} dostává zásah za ${damage} damage.`);
}

export function applyBlock(game, block) {
  const defender = game.defender;
  const players = [...game.players];

  players[defender] = {
    ...players[defender],
    hand: sortCards(players[defender].hand.filter((card) => card.id !== block.id)),
    table: [...players[defender].table, block],
  };

  const required = block.color === "red" ? "černý" : "červený";

  return withLog(
    {
      ...game,
      players,
      attacker: game.defender,
      defender: game.attacker,
      phase: "attack",
      lastAttackColor: block.color,
      currentAttack: null,
      selectedBlock: null,
      selectedAttack: [],
      eventFlash: {
        type: "block",
        text: `${players[defender].name} blokuje ${cardLabel(block)}.`,
      },
    },
    `${players[defender].name} blokuje ${cardLabel(block)} a přebírá iniciativu. Další útok musí být ${required}.`
  );
}

export function applyPause(game) {
  const attacker = game.attacker;
  const before = game.players[attacker].hand.length;
  const players = [...game.players];
  players[attacker] = drawToEight(players[attacker]);

  const drawn = players[attacker].hand.length - before;

  const base = {
    ...game,
    players,
    attacker: game.defender,
    defender: game.attacker,
    selectedAttack: [],
    lastAttackColor: null,
    pausesThisRound: game.pausesThisRound + 1,
  };

  if (base.pausesThisRound >= 3) {
    return withLog(
      {
        ...base,
        phase: "recovery",
        recoveryStarter: attacker,
        recoveryPlayer: attacker,
        selectedRecoverySuit: null,
      },
      `${players[attacker].name} pauzíruje, líže ${drawn} a ukončuje kolo ${game.round}. Recovery začíná ${players[attacker].name}.`
    );
  }

  return withLog(base, `${players[attacker].name} pauzíruje a líže ${drawn}.`);
}

export function applyRecovery(game, suitId) {
  const idx = game.recoveryPlayer;
  const player = game.players[idx];
  const chosen = suitId ? player.table.filter((card) => card.suit === suitId) : [];
  const chosenIds = new Set(chosen.map((card) => card.id));
  const players = [...game.players];

  let nextPlayer = {
    ...player,
    deck: shuffle([...player.deck, ...chosen]),
    table: player.table.filter((card) => !chosenIds.has(card.id)),
  };

  const before = nextPlayer.hand.length;
  nextPlayer = drawToEight(nextPlayer);
  const drawn = nextPlayer.hand.length - before;
  players[idx] = nextPlayer;

  if (idx === game.recoveryStarter) {
    const other = idx === 0 ? 1 : 0;
    return withLog(
      { ...game, players, recoveryPlayer: other, selectedRecoverySuit: null },
      `${player.name} vrací ${chosen.length} karet jednoho suitu a líže ${drawn}. Nyní recoveruje ${players[other].name}.`
    );
  }

  const nextRound = game.round + 1;

  if (nextRound > game.maxRounds) {
    const score0 = players[0].table.length;
    const score1 = players[1].table.length;
    const winner = score0 === score1 ? "Remíza" : score0 < score1 ? players[0].name : players[1].name;

    return withLog(
      { ...game, players, winner, recoveryPlayer: null, selectedRecoverySuit: null },
      `Konec zápasu. Skóre: ${score0}:${score1}.`
    );
  }

  return withLog(
    {
      ...game,
      players,
      round: nextRound,
      pausesThisRound: 0,
      phase: "initiative",
      attacker: 0,
      defender: 1,
      selectedAttack: [],
      selectedBlock: null,
      selectedRecoverySuit: null,
      selectedInitiative: null,
      selectedInitiatives: [null, null],
      initiativePlayer: 0,
      currentAttack: null,
      lastAttackColor: null,
      revealedInitiative: null,
      recoveryStarter: null,
      recoveryPlayer: null,
      viewingPlayer: 0,
      pendingHandoff: false,
    },
    `${player.name} vrací ${chosen.length} karet jednoho suitu a líže ${drawn}. Kolo ${nextRound}: vyber kartu pro iniciativu.`
  );
}
