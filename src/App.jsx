import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import "./styles.css";

const SUITS = [
  { id: "S", name: "Piky", symbol: "♠", color: "black", order: 0 },
  { id: "C", name: "Kříže", symbol: "♣", color: "black", order: 1 },
  { id: "H", name: "Srdce", symbol: "♥", color: "red", order: 2 },
  { id: "D", name: "Káry", symbol: "♦", color: "red", order: 3 },
];

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const RANK_ORDER = { A: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13 };
const SUIT_ORDER = Object.fromEntries(SUITS.map((s) => [s.id, s.order]));
const FIGURE_BLOCK = { J: 1, Q: 2, K: 3, A: Infinity };
const AI_PLAYER = 1;

function Button({ children, onClick, disabled = false, variant = "primary", className = "" }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`btn btn-${variant} ${className}`}>
      {children}
    </button>
  );
}

function Panel({ children, className = "" }) {
  return <div className={`panel ${className}`}>{children}</div>;
}

function shuffle(xs) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sortCards(cards) {
  return [...cards].sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || RANK_ORDER[a.rank] - RANK_ORDER[b.rank]);
}

function makeDeck(prefix) {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ id: `${prefix}-${suit.id}-${rank}`, suit: suit.id, suitName: suit.name, symbol: suit.symbol, color: suit.color, rank });
  }
  return shuffle(deck);
}

function drawToEight(player) {
  const need = Math.max(0, 8 - player.hand.length);
  const drawn = player.deck.slice(0, Math.min(need, player.deck.length));
  return { ...player, hand: sortCards([...player.hand, ...drawn]), deck: player.deck.slice(drawn.length) };
}

function cardLabel(c) { return `${c.rank}${c.symbol}`; }
function rankValues(rank) { return rank === "A" ? [1, 14] : rank === "J" ? [11] : rank === "Q" ? [12] : rank === "K" ? [13] : [Number(rank)]; }
function initiativeValue(card) { return card.rank === "A" ? 14 : RANK_ORDER[card.rank]; }
function cartesian(arrays) { return arrays.reduce((acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])), [[]]); }
function attackColor(cards) { return cards[0]?.color ?? null; }
function attackDamage(cards) { return cards.length === 1 ? 2 : cards.length * 3; }

function isValidStraight(cards) {
  if (cards.length === 0) return false;
  if (cards.length === 1) return true;
  if (!cards.every((c) => c.suit === cards[0].suit)) return false;
  return cartesian(cards.map((c) => rankValues(c.rank))).some((values) => {
    const s = [...values].sort((a, b) => a - b);
    if (new Set(s).size !== s.length) return false;
    return s.every((v, i) => i === 0 || v === s[i - 1] + 1);
  });
}

function allValidAttacks(hand, lastColor) {
  const sorted = sortCards(hand);
  const attacks = [];
  for (let mask = 1; mask < 1 << sorted.length; mask++) {
    const cards = sorted.filter((_, i) => mask & (1 << i));
    if (cards.length > 5) continue;
    if (!isValidStraight(cards)) continue;
    if (lastColor && attackColor(cards) === lastColor) continue;
    attacks.push(cards);
  }
  return attacks.sort((a, b) => attackDamage(b) - attackDamage(a) || b.length - a.length);
}

function blockValue(rank) {
  if (rank === "J") return 1;
  if (rank === "Q") return 2;
  if (rank === "K") return 3;
  if (rank === "A") return 99;
  return 0;
}

function bestBlockForAttack(hand, attackSize) {
  const blocks = hand.filter((c) => c.rank in FIGURE_BLOCK && FIGURE_BLOCK[c.rank] >= attackSize);
  if (!blocks.length) return null;
  return [...blocks].sort((a, b) => blockValue(a.rank) - blockValue(b.rank))[0];
}

function pickRecoveryCards(player, limit) {
  const groups = SUITS.map((s) => ({ suit: s, cards: sortCards(player.table.filter((c) => c.suit === s.id)) }));
  const scored = groups.map((g) => {
    const figures = g.cards.filter((c) => c.rank in FIGURE_BLOCK);
    const nonFigures = g.cards.filter((c) => !(c.rank in FIGURE_BLOCK));
    const preferred = sortCards([...figures, ...nonFigures]).slice(0, limit);
    return { ...g, preferred, score: figures.length * 3 + g.cards.length };
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.preferred ?? [];
}

function aiPickInitiativeCard(hand) {
  return sortCards(hand)[0];
}

function initialGame(aiEnabled = true, aiLevel = "basic") {
  let p1 = { name: "Hráč 1", deck: makeDeck("P1"), hand: [], table: [] };
  let p2 = { name: aiEnabled ? "AI Boxer" : "Hráč 2", deck: makeDeck("P2"), hand: [], table: [] };
  p1 = drawToEight(p1); p2 = drawToEight(p2);
  return {
    players: [p1, p2], attacker: 0, defender: 1,
    phase: "initiative", round: 1, maxRounds: 6, pausesThisRound: 0, recoveryLimit: 5,
    viewingPlayer: 0, pendingHandoff: false,
    selectedAttack: [], selectedBlock: null, selectedRecovery: [], selectedInitiative: null,
    currentAttack: null, lastAttackColor: null, revealedInitiative: null,
    recoveryStarter: null, recoveryPlayer: null, winner: null, aiEnabled, aiLevel,
    log: ["Nová hra. Vyber kartu pro iniciativu v 1. kole."],
  };
}

export default function App() {
  const [screen, setScreen] = useState("menu");
  const [gameMode, setGameMode] = useState("basic-ai");
  const [game, setGame] = useState(() => initialGame(true, "basic"));

  const attacker = game.players[game.attacker];
  const defender = game.players[game.defender];
  const isAITurn = game.aiEnabled && !game.winner && ((game.phase === "attack" && game.attacker === AI_PLAYER) || (game.phase === "block" && game.defender === AI_PLAYER) || (game.phase === "recovery" && game.recoveryPlayer === AI_PLAYER));

  const selectedAttackCards = useMemo(() => sortCards(attacker.hand.filter((c) => game.selectedAttack.includes(c.id))), [attacker.hand, game.selectedAttack]);
  const attackValid = selectedAttackCards.length > 0 && isValidStraight(selectedAttackCards);
  const respectsAlternation = !game.lastAttackColor || attackColor(selectedAttackCards) !== game.lastAttackColor;
  const canAttack = game.phase === "attack" && attackValid && respectsAlternation && !isAITurn;

  function withLog(g, msg) { return { ...g, log: [msg, ...g.log].slice(0, 16) }; }

  function activeHumanPlayer(g) {
    if (g.phase === "initiative") return 0;
    if (g.phase === "attack") return g.attacker;
    if (g.phase === "block") return g.defender;
    if (g.phase === "recovery") return g.recoveryPlayer;
    return 0;
  }

  function needsHandoff(prev, next) {
    if (next.winner) return false;
    if (next.aiEnabled) return false;
    const prevActive = activeHumanPlayer(prev);
    const nextActive = activeHumanPlayer(next);
    return prevActive !== nextActive;
  }

  function finalizeTransition(prev, next) {
    const active = activeHumanPlayer(next);
    if (needsHandoff(prev, next)) return { ...next, viewingPlayer: active, pendingHandoff: true };
    return { ...next, viewingPlayer: active, pendingHandoff: false };
  }

  function continueAfterHandoff() {
    setGame((g) => ({ ...g, pendingHandoff: false }));
  }

  function resetGame() {
    const aiEnabled = gameMode !== "hotseat";
    const aiLevel = gameMode === "hybrid-ai" ? "hybrid" : "basic";
    setGame(initialGame(aiEnabled, aiLevel));
    setScreen("game");
  }

  function startGame(mode) {
    setGameMode(mode);
    const aiEnabled = mode !== "hotseat";
    const aiLevel = mode === "hybrid-ai" ? "hybrid" : "basic";
    setGame(initialGame(aiEnabled, aiLevel));
    setScreen("game");
  }

  function toggleInitiative(card) {
    if (game.phase !== "initiative" || game.winner) return;
    setGame((g) => ({ ...g, selectedInitiative: g.selectedInitiative === card.id ? null : card.id }));
  }

  function confirmInitiative() {
    if (game.phase !== "initiative" || !game.selectedInitiative || game.winner) return;
    setGame((g) => {
      const humanCard = g.players[0].hand.find((c) => c.id === g.selectedInitiative);
      const secondCard = g.aiEnabled ? aiPickInitiativeCard(g.players[1].hand) : g.players[1].hand[Math.floor(Math.random() * g.players[1].hand.length)];
      if (!humanCard || !secondCard) return g;
      const hv = initiativeValue(humanCard);
      const sv = initiativeValue(secondCard);
      let starter = 0;
      if (sv > hv) starter = 1;
      if (sv === hv) starter = Math.random() < 0.5 ? 0 : 1;
      const next = withLog(
        {
          ...g,
          phase: "attack",
          attacker: starter,
          defender: starter === 0 ? 1 : 0,
          revealedInitiative: [humanCard, secondCard],
          selectedInitiative: null,
          selectedAttack: [],
          selectedBlock: null,
          currentAttack: null,
          lastAttackColor: null,
        },
        `Iniciativa: ${cardLabel(humanCard)} vs ${cardLabel(secondCard)}. Začíná ${starter === 0 ? g.players[0].name : g.players[1].name}.`
      );
      return finalizeTransition(g, next);
    });
  }

  function toggleAttack(card) {
    if (game.phase !== "attack" || game.winner || isAITurn || game.pendingHandoff) return;
    setGame((g) => ({ ...g, selectedAttack: g.selectedAttack.includes(card.id) ? g.selectedAttack.filter((id) => id !== card.id) : [...g.selectedAttack, card.id] }));
  }

  function toggleBlock(card) {
    if (game.phase !== "block" || game.winner || isAITurn || game.pendingHandoff || !(card.rank in FIGURE_BLOCK)) return;
    setGame((g) => ({ ...g, selectedBlock: g.selectedBlock === card.id ? null : card.id }));
  }

  function toggleRecovery(card) {
    if (!canPickRecovery(card) || isAITurn || game.pendingHandoff) return;
    setGame((g) => ({ ...g, selectedRecovery: g.selectedRecovery.includes(card.id) ? g.selectedRecovery.filter((id) => id !== card.id) : [...g.selectedRecovery, card.id] }));
  }

  function applyAttack(g, cards) {
    const a = g.attacker;
    const ids = new Set(cards.map((c) => c.id));
    const players = [...g.players];
    players[a] = { ...players[a], hand: sortCards(players[a].hand.filter((c) => !ids.has(c.id))), table: [...players[a].table, ...cards] };
    return withLog({ ...g, players, phase: "block", currentAttack: cards, selectedAttack: [], selectedBlock: null }, `${players[a].name} útočí: ${cards.map(cardLabel).join(" ")} — hrozí ${attackDamage(cards)} damage.`);
  }

  function commitAttack() {
    if (!canAttack) return;
    setGame((g) => finalizeTransition(g, applyAttack(g, sortCards(g.players[g.attacker].hand.filter((c) => g.selectedAttack.includes(c.id))))));
  }

  function applyUnblocked(g) {
    const d = g.defender;
    const damage = attackDamage(g.currentAttack);
    const players = [...g.players];
    const milled = players[d].deck.slice(0, damage);
    players[d] = { ...players[d], deck: players[d].deck.slice(milled.length), table: [...players[d].table, ...milled] };
    const ng = { ...g, players, phase: "attack", lastAttackColor: attackColor(g.currentAttack), currentAttack: null, selectedBlock: null };
    if (milled.length < damage) return withLog({ ...ng, winner: g.players[g.attacker].name }, `${players[d].name} nemá dost karet na absorbování útoku. KO!`);
    return withLog(ng, `${players[d].name} dostává zásah za ${damage} damage.`);
  }

  function passBlock() {
    if (game.phase !== "block" || isAITurn || game.pendingHandoff) return;
    setGame((g) => finalizeTransition(g, applyUnblocked(g)));
  }

  function applyBlock(g, block) {
    const d = g.defender;
    if (!block || FIGURE_BLOCK[block.rank] < g.currentAttack.length) return g;
    const players = [...g.players];
    players[d] = { ...players[d], hand: sortCards(players[d].hand.filter((c) => c.id !== block.id)), table: [...players[d].table, block] };
    const required = block.color === "red" ? "černý" : "červený";
    return withLog({ ...g, players, attacker: g.defender, defender: g.attacker, phase: "attack", lastAttackColor: block.color, currentAttack: null, selectedBlock: null, selectedAttack: [] }, `${players[d].name} blokuje ${cardLabel(block)} a přebírá iniciativu. Další útok musí být ${required}.`);
  }

  function commitBlock() {
    if (game.phase !== "block" || !game.selectedBlock || isAITurn || game.pendingHandoff) return;
    setGame((g) => {
      const block = g.players[g.defender].hand.find((c) => c.id === g.selectedBlock);
      if (!block || FIGURE_BLOCK[block.rank] < g.currentAttack.length) return withLog(g, `${block ? cardLabel(block) : "Vybraný blok"} nestačí na blok.`);
      return finalizeTransition(g, applyBlock(g, block));
    });
  }

  function applyPause(g) {
    const a = g.attacker;
    const before = g.players[a].hand.length;
    const players = [...g.players];
    players[a] = drawToEight(players[a]);
    const drawn = players[a].hand.length - before;
    const base = { ...g, players, attacker: g.defender, defender: g.attacker, selectedAttack: [], lastAttackColor: null, pausesThisRound: g.pausesThisRound + 1 };
    if (base.pausesThisRound >= 3) return withLog({ ...base, phase: "recovery", recoveryStarter: a, recoveryPlayer: a, selectedRecovery: [] }, `${players[a].name} pauzíruje, líže ${drawn} a ukončuje kolo ${g.round}. Recovery začíná ${players[a].name}.`);
    return withLog(base, `${players[a].name} pauzíruje a líže ${drawn}.`);
  }

  function pauseTurn() {
    if (game.phase !== "attack" || game.winner || isAITurn || game.pendingHandoff) return;
    setGame((g) => finalizeTransition(g, applyPause(g)));
  }

  function selectedRecoveryCards(g = game) {
    if (g.recoveryPlayer === null) return [];
    return g.players[g.recoveryPlayer].table.filter((c) => g.selectedRecovery.includes(c.id));
  }

  function canPickRecovery(card) {
    if (game.phase !== "recovery" || game.recoveryPlayer === null || game.winner) return false;
    const selected = selectedRecoveryCards();
    if (game.selectedRecovery.includes(card.id)) return true;
    if (selected.length >= game.recoveryLimit) return false;
    return selected.length === 0 || selected[0].suit === card.suit;
  }

  function applyRecovery(g, chosen) {
    const idx = g.recoveryPlayer;
    const p = g.players[idx];
    const chosenIds = new Set(chosen.map((c) => c.id));
    const players = [...g.players];
    let np = { ...p, deck: shuffle([...p.deck, ...chosen]), table: p.table.filter((c) => !chosenIds.has(c.id)) };
    const before = np.hand.length;
    np = drawToEight(np);
    const drawn = np.hand.length - before;
    players[idx] = np;
    if (idx === g.recoveryStarter) {
      const other = idx === 0 ? 1 : 0;
      return withLog({ ...g, players, recoveryPlayer: other, selectedRecovery: [] }, `${p.name} vrací ${chosen.length} karet a líže ${drawn}. Nyní recoveruje ${players[other].name}.`);
    }
    const nextRound = g.round + 1;
    if (nextRound > g.maxRounds) {
      const s0 = players[0].table.length, s1 = players[1].table.length;
      const winner = s0 === s1 ? "Remíza" : s0 < s1 ? players[0].name : players[1].name;
      return withLog({ ...g, players, winner, recoveryPlayer: null, selectedRecovery: [] }, `Konec zápasu. Skóre: ${s0}:${s1}.`);
    }
    return withLog({ ...g, players, round: nextRound, pausesThisRound: 0, phase: "initiative", attacker: 0, defender: 1, selectedAttack: [], selectedBlock: null, selectedRecovery: [], selectedInitiative: null, currentAttack: null, lastAttackColor: null, revealedInitiative: null, recoveryStarter: null, recoveryPlayer: null }, `${p.name} vrací ${chosen.length} karet a líže ${drawn}. Kolo ${nextRound}: vyber kartu pro iniciativu.`);
  }

  function confirmRecovery() {
    if (game.phase !== "recovery" || game.recoveryPlayer === null || game.winner || isAITurn || game.pendingHandoff) return;
    setGame((g) => finalizeTransition(g, applyRecovery(g, g.players[g.recoveryPlayer].table.filter((c) => g.selectedRecovery.includes(c.id)))));
  }

  function runAIOnce(g) {
    const hybrid = g.aiLevel === "hybrid";
    if (!g.aiEnabled || g.winner || g.pendingHandoff) return g;
    if (g.phase === "block" && g.defender === AI_PLAYER) {
      const attackSize = g.currentAttack.length;
      const damage = attackDamage(g.currentAttack);
      const block = bestBlockForAttack(g.players[AI_PLAYER].hand, attackSize);
      if (hybrid) {
        if (block && (damage >= 6 || g.players[AI_PLAYER].deck.length <= 12 || attackSize >= 3 || (block.rank !== "A" && damage >= 3))) return applyBlock(g, block);
      } else {
        if (block && (damage >= 6 || block.rank !== "A" || attackSize >= 3 || g.players[AI_PLAYER].deck.length <= 12)) return applyBlock(g, block);
      }
      return applyUnblocked(g);
    }
    if (g.phase === "attack" && g.attacker === AI_PLAYER) {
      const ai = g.players[AI_PLAYER];
      const enemy = g.players[g.defender];
      const attacks = allValidAttacks(ai.hand, g.lastAttackColor);
      if (hybrid) {
        const lethal = attacks.find((cards) => attackDamage(cards) >= enemy.deck.length);
        if (lethal) return applyAttack(g, lethal);
        const pressure = attacks.filter((cards) => {
          const dmg = attackDamage(cards);
          if (cards.some((c) => c.rank === "A") && dmg < 9) return false;
          if (dmg >= 9) return true;
          if (dmg >= 6 && enemy.deck.length <= 18) return true;
          return false;
        });
        if (pressure.length) return applyAttack(g, pressure[0]);
        const jabs = attacks.filter((a) => a.length === 1);
        if (jabs.length && enemy.deck.length > 10) return applyAttack(g, jabs[0]);
        if (attacks.length && ai.hand.length >= 7) return applyAttack(g, attacks[0]);
        return applyPause(g);
      }
      const meaningful = attacks.filter((cards) => attackDamage(cards) >= 6 || enemy.deck.length <= 10);
      if (meaningful.length) return applyAttack(g, meaningful[0]);
      if (attacks.length && ai.hand.length >= 7) return applyAttack(g, attacks[0]);
      return applyPause(g);
    }
    if (g.phase === "recovery" && g.recoveryPlayer === AI_PLAYER) {
      let recovery = pickRecoveryCards(g.players[AI_PLAYER], g.recoveryLimit);
      if (hybrid) {
        const deckSize = g.players[AI_PLAYER].deck.length;
        if (deckSize <= 14 && recovery.length > 2) recovery = recovery.slice(0, 2);
      }
      return applyRecovery(g, recovery);
    }
    return g;
  }

  useEffect(() => {
    if (!isAITurn) return;
    const t = setTimeout(() => setGame((g) => finalizeTransition(g, runAIOnce(g))), 650);
    return () => clearTimeout(t);
  }, [isAITurn, game.phase, game.attacker, game.defender, game.recoveryPlayer, game.currentAttack?.length]);

  const currentBlock = game.phase === "block" && game.selectedBlock ? defender.hand.find((c) => c.id === game.selectedBlock) : null;
  const currentAttackSize = game.currentAttack?.length ?? 0;
  const currentBlockStrength = currentBlock ? FIGURE_BLOCK[currentBlock.rank] : 0;
  const blockCanStop = Boolean(currentBlock && currentBlockStrength >= currentAttackSize);

  if (screen === "menu") return <MainMenu startGame={startGame} showRules={() => setScreen("rules")} />;
  if (screen === "rules") return <RulesScreen back={() => setScreen("menu")} />;

  return <div className="app"><div className="container">
    {game.pendingHandoff && <Panel className="handoff"><h2>Předání tahu</h2><p>Předej zařízení hráči: <strong>{game.players[game.viewingPlayer].name}</strong>.</p><Button onClick={continueAfterHandoff}>Převzít tah</Button></Panel>}
    <div className="topbar"><div><h1>Karetní Box</h1><p>{game.aiEnabled ? (game.aiLevel === "hybrid" ? "Proti AI — Zkušený soupeř" : "Proti AI — Sparring partner") : "Hot-seat"} · volba iniciativy · recovery 0–5 · 6 kol</p></div><div className="row"><Button onClick={() => setScreen("menu")} variant="ghost">Menu</Button><Button onClick={resetGame} variant="secondary">Nová hra</Button></div></div>
    {isAITurn && <Panel>AI přemýšlí…</Panel>}
    {game.winner && <Panel className="result">Výsledek: {game.winner}</Panel>}
    <div className="grid3"><Status game={game} /><Actions game={game} selectedAttackCards={selectedAttackCards} attackValid={attackValid} respectsAlternation={respectsAlternation} canAttack={canAttack} commitAttack={commitAttack} passBlock={passBlock} commitBlock={commitBlock} pauseTurn={pauseTurn} confirmRecovery={confirmRecovery} blockCanStop={blockCanStop} currentBlock={currentBlock} currentBlockStrength={currentBlockStrength} isAITurn={isAITurn} confirmInitiative={confirmInitiative} /><Log log={game.log} /></div>
    <div className="grid2">{[0,1].map((idx) => <PlayerPanel key={idx} idx={idx} game={game} renderCard={(card) => {
      const canInitiativeSelect = game.phase === "initiative" && idx === 0;
      const canAttackSelect = !isAITurn && game.phase === "attack" && idx === game.attacker;
      const canBlockSelect = !isAITurn && game.phase === "block" && idx === game.defender && card.rank in FIGURE_BLOCK;
      const selected = (idx === game.attacker && game.selectedAttack.includes(card.id)) || (idx === game.defender && game.selectedBlock === card.id) || (canInitiativeSelect && game.selectedInitiative === card.id);
      return <GameCard key={card.id} card={card} hidden={game.pendingHandoff || idx !== game.viewingPlayer} selected={selected} disabled={game.pendingHandoff || !(canInitiativeSelect || canAttackSelect || canBlockSelect)} onClick={() => canInitiativeSelect ? toggleInitiative(card) : canAttackSelect ? toggleAttack(card) : canBlockSelect ? toggleBlock(card) : null} />;
    }} toggleRecovery={toggleRecovery} canPickRecovery={canPickRecovery} isAITurn={isAITurn} />)}</div>
  </div></div>;
}

function MainMenu({ startGame, showRules }) {
  return <div className="app menu"><div className="menu-box"><h1>Karetní Box</h1><p>Duelová karetní hra o tempu, blocích, kombinacích a KO.</p><Panel><Button onClick={() => startGame("hotseat")} className="wide">Hot-seat</Button><Button onClick={() => startGame("basic-ai")} variant="secondary" className="wide">Proti AI — Sparring partner</Button><Button onClick={() => startGame("hybrid-ai")} variant="secondary" className="wide">Proti AI — Zkušený soupeř</Button><Button onClick={showRules} variant="ghost" className="wide">Pravidla</Button></Panel></div></div>;
}

function RulesScreen({ back }) {
  return <div className="app"><div className="container narrow"><div className="topbar"><div><h1>Pravidla Karetního Boxu</h1><p>Kompletní aktuální pravidla prototypu.</p></div><Button onClick={back} variant="secondary">Zpět do menu</Button></div>
    <Panel className="rules">
      <h2>1. Cíl hry</h2><p>Karetní Box je duelová karetní hra pro dva hráče. Hraje se na 6 kol. Vyhrává hráč, který má po šestém kole před sebou méně vyložených karet. Hráč může vyhrát také okamžitě knockoutem.</p>
      <h2>2. Komponenty</h2><ul><li>Každý hráč používá vlastní standardní balíček 52 karet.</li><li>Žolíky se nepoužívají.</li><li>Každý hráč má vlastní ruku, vlastní balíček a vlastní vyložené karty.</li></ul>
      <h2>3. Hodnoty karet</h2><p>Pořadí hodnot je: A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A. Eso může být nízké v A-2-3 nebo vysoké v Q-K-A. K-A-2 není platná postupka.</p>
      <h2>4. Začátek kola</h2><ul><li>Na začátku hry si každý hráč lízne do 8 karet.</li><li>Na začátku každého kola oba hráči odhalí jednu kartu z ruky.</li><li>Vyšší karta začíná. Eso je při iniciativě vysoké.</li><li>Při shodě rozhodne náhodný výběr.</li><li>Odhalené karty zůstávají v ruce.</li></ul>
      <h2>5. Útok</h2><p>Útočník může zahrát jednu kartu nebo postupku stejného suitu. Všechny útočné karty se vyloží před útočníka.</p>
      <h2>6. Damage</h2><ul><li>Jab, tedy jedna karta, způsobí 2 damage.</li><li>Útok dvěma a více kartami způsobí 3 damage za každou kartu.</li></ul>
      <h2>7. Blok</h2><ul><li>J blokuje 1 kartu, Q blokuje 2, K blokuje 3, A blokuje libovolně dlouhý útok.</li><li>Blokující figura se vyloží před obránce.</li><li>Úspěšný blok vždy převádí iniciativu na obránce.</li><li>První útok po bloku musí být opačné barvy než blokující figura.</li></ul>
      <h2>8. Nezablokovaný útok</h2><p>Obránce odloží ze svého balíčku počet karet odpovídající damage útoku a vyloží je před sebe. Útočník může pokračovat.</p>
      <h2>9. Střídání barev</h2><p>Po zásahu musí další útok střídat barvu. Červené suity jsou srdce a káry; černé suity jsou piky a kříže.</p>
      <h2>10. Pauza</h2><ul><li>Útočník může pauzírovat a lízne do 8 karet, kolik může.</li><li>Hráč nemůže být knockoutován vlastním lízáním.</li><li>Po pauze útočí soupeř.</li><li>Třetí pauza celkem ukončí kolo.</li></ul>
      <h2>11. Recovery</h2><ul><li>První recoveruje hráč, který ukončil kolo třetí pauzou.</li><li>Každý hráč může vrátit 0–5 vyložených karet stejného suitu.</li><li>Vrácené karty se zamíchají do balíčku a hráč lízne do 8.</li></ul>
      <h2>12. KO</h2><p>Hráč je knockoutován pouze tehdy, když má odhodit damage z útoku, ale nemá v balíčku dostatek karet.</p>
      <h2>13. Konec hry</h2><p>Hra končí KO nebo po šestém kole. Po šestém kole vyhrává hráč s menším počtem vyložených karet. Při shodě nastává remíza.</p>
    </Panel></div></div>;
}

function GameCard({ card, selected, disabled, onClick, hidden = false }) {
  return <motion.button whileTap={{ scale: 0.95 }} onClick={onClick} disabled={disabled || hidden} className={`game-card ${selected ? "selected" : ""} ${hidden ? "hidden-card" : card.color === "red" ? "red" : "black"} ${disabled || hidden ? "disabled" : ""}`}>{hidden ? "🂠" : cardLabel(card)}</motion.button>;
}

function PlayerPanel({ idx, game, renderCard, toggleRecovery, canPickRecovery, isAITurn }) {
  const p = game.players[idx];
  const isRecovery = game.phase === "recovery" && game.recoveryPlayer === idx;
  return <Panel className={`${idx === game.attacker && game.phase !== "initiative" ? "attacker" : idx === game.defender && game.phase !== "initiative" ? "defender" : ""}`}><div className="player-head"><h2>{p.name}{isRecovery ? " — recovery" : ""}</h2><span>Balíček: {p.deck.length} | Ruka: {p.hand.length} | Vyloženo: {p.table.length}</span></div><h3>Ruka</h3><GroupedHand hand={p.hand} hidden={game.pendingHandoff || idx !== game.viewingPlayer} renderCard={renderCard} /><h3>Vyložené karty</h3><SuitTable cards={p.table} recoveryMode={isRecovery && !isAITurn} selectedRecovery={game.selectedRecovery} toggleRecovery={toggleRecovery} canPickRecovery={canPickRecovery} /></Panel>;
}

function GroupedHand({ hand, renderCard, hidden = false }) {
  return <div className="groups">{hidden ? <div className="suit-group"><strong>Skrytá ruka</strong><div className="card-row">{hand.map((c) => <GameCard key={c.id} card={c} hidden disabled />)}</div></div> : SUITS.map((s) => { const cards = sortCards(hand.filter((c) => c.suit === s.id)); if (!cards.length) return null; return <div key={s.id} className="suit-group"><strong className={s.color}>{s.symbol} {s.name}</strong><div className="card-row">{cards.map(renderCard)}</div></div>; })}</div>;
}

function SuitTable({ cards, recoveryMode, selectedRecovery, toggleRecovery, canPickRecovery }) {
  if (!cards.length) return <p className="muted">Žádné vyložené karty.</p>;
  return <div className="groups">{SUITS.map((s) => { const cs = sortCards(cards.filter((c) => c.suit === s.id)); if (!cs.length) return null; return <div key={s.id} className="suit-group"><strong className={s.color}>{s.symbol} {s.name}</strong><div className="card-row">{cs.map((c) => { const selected = selectedRecovery.includes(c.id); const can = recoveryMode && canPickRecovery(c); return <button key={c.id} disabled={recoveryMode && !can} onClick={() => can && toggleRecovery(c)} className={`mini-card ${c.color} ${selected ? "selected" : ""} ${recoveryMode && !can ? "disabled" : ""}`}>{cardLabel(c)}</button>; })}</div></div>; })}</div>;
}

function Status({ game }) {
  return <Panel><h2>Stav</h2><p>Kolo: <strong>{game.round}/{game.maxRounds}</strong></p><p>Fáze: <strong>{phaseLabel(game.phase)}</strong></p>{game.phase !== "initiative" && <><p>Útočník: <strong>{game.players[game.attacker].name}</strong></p><p>Obránce: <strong>{game.players[game.defender].name}</strong></p></>}<p>Pauzy v kole: <strong>{game.pausesThisRound}/3</strong></p><p>Poslední barva: <strong>{game.lastAttackColor ? colorLabel(game.lastAttackColor) : "—"}</strong></p>{game.revealedInitiative && <p>Iniciativa: <strong>{cardLabel(game.revealedInitiative[0])} vs {cardLabel(game.revealedInitiative[1])}</strong></p>}{game.phase === "recovery" && <p>Recoveruje: <strong>{game.players[game.recoveryPlayer].name}</strong></p>}</Panel>;
}

function Actions({ game, selectedAttackCards, attackValid, respectsAlternation, canAttack, commitAttack, passBlock, commitBlock, pauseTurn, confirmRecovery, blockCanStop, currentBlock, currentBlockStrength, isAITurn, confirmInitiative }) {
  return <Panel><h2>Akce</h2>{game.phase === "initiative" && <><p className="muted">Vyber jednu kartu z ruky pro iniciativu. Vyšší karta začíná.</p><Button onClick={confirmInitiative} disabled={!game.selectedInitiative}>Odhalit karty a určit začínajícího</Button></>}{game.phase === "attack" && <><div className="info"><p>Vybraný útok: <strong>{selectedAttackCards.length ? selectedAttackCards.map(cardLabel).join(" ") : "—"}</strong></p><p>Postupka: <strong>{attackValid ? "ano" : "ne"}</strong></p><p>Střídání barev: <strong>{respectsAlternation ? "ano" : "ne"}</strong></p><p>Damage: <strong>{attackDamage(selectedAttackCards)}</strong></p></div><Button onClick={commitAttack} disabled={!canAttack || isAITurn}>Zahrát útok</Button><Button onClick={pauseTurn} disabled={isAITurn} variant="secondary">Pauza — líznout do 8</Button></>}{game.phase === "block" && <><div className="info"><p>Útok: <strong>{game.currentAttack.map(cardLabel).join(" ")}</strong></p><p>Damage při zásahu: <strong>{attackDamage(game.currentAttack)}</strong></p><p>Vybraný blok: <strong>{currentBlock ? cardLabel(currentBlock) : "—"}</strong></p><p>Síla bloku: <strong>{currentBlock ? (currentBlockStrength === Infinity ? "bez omezení" : currentBlockStrength) : "—"}</strong></p><p>Vybraný blok stačí: <strong>{blockCanStop ? "ano" : "ne"}</strong></p></div><Button onClick={commitBlock} disabled={!blockCanStop || isAITurn}>Blokovat — převzít iniciativu</Button><Button onClick={passBlock} disabled={isAITurn} variant="danger">Neblokovat — přijmout zásah</Button></>}{game.phase === "recovery" && <><p className="muted">Vyber 0–5 vyložených karet stejného suitu.</p><Button onClick={confirmRecovery} disabled={isAITurn}>Potvrdit recovery</Button></>}</Panel>;
}

function Log({ log }) {
  return <Panel><h2>Historie</h2><div className="log">{log.map((x, i) => <div key={i}>{x}</div>)}</div></Panel>;
}

function phaseLabel(p) { return p === "initiative" ? "iniciativa" : p === "attack" ? "útok" : p === "block" ? "blok" : p === "recovery" ? "recovery" : p; }
function colorLabel(c) { return c === "red" ? "červená" : c === "black" ? "černá" : "—"; }

const root = createRoot(document.getElementById("root"));
root.render(<App />);
