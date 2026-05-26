import { useEffect, useMemo, useState } from "react";
import { AI_PLAYER, FIGURE_BLOCK } from "./game/constants.js";
import {
  attackColor,
  canCardBlock,
  isValidStraight,
  sortCards,
} from "./game/cards.js";
import {
  applyAttack,
  applyBlock,
  applyInitiativeSelection,
  applyMulligan,
  applyPause,
  applyRecovery,
  applyUnblocked,
  finalizeTransition,
  initialGame,
  withLog,
} from "./game/engine.js";
import {
  chooseAIAttack,
  chooseAIBlock,
  chooseAIMulligan,
  chooseAIRecovery,
} from "./ai/ai.js";
import { InitiativeReveal } from "./components/InitiativeReveal.jsx";
import blockSound from "./assets/sounds/block.mp3";
import clickSound from "./assets/sounds/click.mp3";
import comboSound from "./assets/sounds/combo.mp3";
import finishSound from "./assets/sounds/finish.mp3";
import jabSound from "./assets/sounds/jab.mp3";
import koSound from "./assets/sounds/ko.mp3";
import startSound from "./assets/sounds/start.mp3";
import { Actions } from "./components/Actions.jsx";
import { Button } from "./components/Button.jsx";
import { DamageFlash } from "./components/DamageFlash.jsx";
import { EventFlash } from "./components/EventFlash.jsx";
import { GameCard } from "./components/GameCard.jsx";
import { LogDrawer } from "./components/LogDrawer.jsx";
import { MainMenu } from "./components/MainMenu.jsx";
import { Panel } from "./components/Panel.jsx";
import { PlayerPanel } from "./components/PlayerPanel.jsx";
import { RulesScreen } from "./components/RulesScreen.jsx";
import { Status } from "./components/Status.jsx";

const DEFAULT_SETTINGS = {
  sound: true,
  screenShake: true,
  ambient: false,
};

export default function App() {
  function playSound(soundFile, volume = 0.7) {
  if (!settings.sound) return;
  const audio = new Audio(soundFile);
  audio.volume = volume;
  audio.play();
}
  const [showSettings, setShowSettings] = useState(false);
  const [screen, setScreen] = useState("menu");
  const [gameMode, setGameMode] = useState("basic-ai");
  const [showLog, setShowLog] = useState(false);
  const [game, setGame] = useState(() => initialGame(true, "basic"));
  const [showInitiativeReveal, setShowInitiativeReveal] = useState(false);
  const [lastInitiativeRevealKey, setLastInitiativeRevealKey] = useState(null);
  const [initiativeRevealKey, setInitiativeRevealKey] = useState(null);
  const [screenShake, setScreenShake] = useState("");
  const [settings, setSettings] = useState(() => {
  const saved = localStorage.getItem("cardbox-settings");
  return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
});

  const attacker = game.players[game.attacker];
  const defender = game.players[game.defender];

  const isAITurn =
    game.aiEnabled &&
    !game.winner &&
    ((game.phase === "attack" && game.attacker === AI_PLAYER) ||
      (game.phase === "block" && game.defender === AI_PLAYER) ||
      (game.phase === "recovery" && game.recoveryPlayer === AI_PLAYER) ||
      (game.phase === "mulligan" && game.mulliganPlayer === AI_PLAYER));

  const selectedAttackCards = useMemo(
    () =>
      sortCards(
        attacker.hand.filter((card) => game.selectedAttack.includes(card.id)),
      ),
    [attacker.hand, game.selectedAttack],
  );

  const mulliganPlayer =
    game.phase === "mulligan" && game.mulliganPlayer !== null
      ? game.players[game.mulliganPlayer]
      : null;

  const selectedMulliganCards = useMemo(
    () =>
      mulliganPlayer
        ? sortCards(
            mulliganPlayer.hand.filter((card) =>
              game.selectedMulligan.includes(card.id),
            ),
          )
        : [],
    [mulliganPlayer, game.selectedMulligan],
  );

  function isColorLockedForAttack(card) {
    return (
      game.phase === "attack" &&
      game.lastAttackColor &&
      card.color === game.lastAttackColor
    );
  }

  function wouldBeValidAttackSelection(card) {
    if (game.phase !== "attack") return false;
    if (isColorLockedForAttack(card)) return false;
    const alreadySelected = game.selectedAttack.includes(card.id);
    const nextCards = alreadySelected
      ? selectedAttackCards.filter((c) => c.id !== card.id)
      : sortCards([...selectedAttackCards, card]);
    if (nextCards.length === 0) return true;
    return isValidStraight(nextCards);
  }

  function attackCardState(card) {
    if (game.phase !== "attack") return "inactive";
    if (isColorLockedForAttack(card)) return "locked";
    if (game.selectedAttack.length === 0) return "active";
    if (game.selectedAttack.includes(card.id)) return "selected";
    return wouldBeValidAttackSelection(card) ? "active" : "soft";
  }

  function blockCardState(card) {
    if (game.phase !== "block") return "inactive";
    return canCardBlock(card, game.currentAttack?.length ?? 0)
      ? "active"
      : "locked";
  }

  function mulliganCardState(card) {
    if (game.phase !== "mulligan") return "inactive";
    const protectedIds = new Set(
      (game.revealedInitiative ?? []).map((c) => c.id),
    );
    if (protectedIds.has(card.id)) return "locked";
    return game.selectedMulligan.includes(card.id) ? "selected" : "active";
  }

  const attackValid =
    selectedAttackCards.length > 0 && isValidStraight(selectedAttackCards);
  const respectsAlternation =
    !game.lastAttackColor ||
    attackColor(selectedAttackCards) !== game.lastAttackColor;
  const canAttack =
    game.phase === "attack" &&
    attackValid &&
    respectsAlternation &&
    !isAITurn &&
    !game.pendingHandoff;

  function startGame(mode) {
    setGameMode(mode);
    const aiEnabled = mode !== "hotseat";
    const aiLevel = mode === "hybrid-ai" ? "hybrid" : "basic";
    playSound(startSound);
    setGame(initialGame(aiEnabled, aiLevel));
    setScreen("game");
    setShowLog(false);
  }

  function resetGame() {
    startGame(gameMode);
  }

  function toggleInitiative(card) {
    if (game.phase !== "initiative" || game.winner || game.pendingHandoff)
      return;

    const usedInitiativeIds = new Set(
  (game.revealedInitiative ?? []).map((card) => card.id),
);

if (usedInitiativeIds.has(card.id)) return;

    const picker = game.initiativePlayer ?? 0;
    if (game.viewingPlayer !== picker) return;
    setGame((g) => ({
      ...g,
      selectedInitiative: g.selectedInitiative === card.id ? null : card.id,
    }));
  }

  function confirmInitiative() {
    if (
      game.phase !== "initiative" ||
      !game.selectedInitiative ||
      game.winner ||
      game.pendingHandoff
    )
      return;
    setGame((g) => {
      const picker = g.initiativePlayer ?? 0;
      const picked = g.players[picker].hand.find(
        (card) => card.id === g.selectedInitiative,
      );
      if (!picked) return g;
      setInitiativeRevealKey(Date.now());
      return applyInitiativeSelection(g, picked);
    });
  }

  function toggleMulligan(card) {
    if (
      game.phase !== "mulligan" ||
      game.winner ||
      isAITurn ||
      game.pendingHandoff
    )
      return;
    const protectedIds = new Set(
      (game.revealedInitiative ?? []).map((c) => c.id),
    );
    if (protectedIds.has(card.id)) return;

    setGame((g) => ({
      ...g,
      selectedMulligan: g.selectedMulligan.includes(card.id)
        ? g.selectedMulligan.filter((id) => id !== card.id)
        : [...g.selectedMulligan, card.id],
    }));
  }

  function confirmMulligan() {
    if (
      game.phase !== "mulligan" ||
      game.mulliganPlayer === null ||
      game.winner ||
      isAITurn ||
      game.pendingHandoff
    )
      return;

    setGame((g) => {
      const player = g.players[g.mulliganPlayer];
      const chosen = player.hand.filter((card) =>
        g.selectedMulligan.includes(card.id),
      );
      return applyMulligan(g, chosen);
    });
  }

  function toggleAttack(card) {
    if (
      game.phase !== "attack" ||
      game.winner ||
      isAITurn ||
      game.pendingHandoff ||
      isColorLockedForAttack(card)
    )
      return;

    setGame((g) => {
      const current = sortCards(
        g.players[g.attacker].hand.filter((c) =>
          g.selectedAttack.includes(c.id),
        ),
      );
      const alreadySelected = g.selectedAttack.includes(card.id);

      if (alreadySelected) {
        return {
          ...g,
          selectedAttack: g.selectedAttack.filter((id) => id !== card.id),
        };
      }

      const nextCards = sortCards([...current, card]);
      return isValidStraight(nextCards)
        ? { ...g, selectedAttack: [...g.selectedAttack, card.id] }
        : { ...g, selectedAttack: [card.id] };
    });
  }

  function toggleBlock(card) {
    if (
      game.phase !== "block" ||
      game.winner ||
      isAITurn ||
      game.pendingHandoff
    )
      return;
    if (!canCardBlock(card, game.currentAttack?.length ?? 0)) return;
    setGame((g) => ({
      ...g,
      selectedBlock: g.selectedBlock === card.id ? null : card.id,
    }));
  }

  function toggleRecoverySuit(suitId) {
    if (
      game.phase !== "recovery" ||
      game.recoveryPlayer === null ||
      game.winner ||
      isAITurn ||
      game.pendingHandoff
    )
      return;
    setGame((g) => ({
      ...g,
      selectedRecoverySuit: g.selectedRecoverySuit === suitId ? null : suitId,
    }));
  }

  function commitAttack() {
  if (!canAttack) return;

  setGame((g) =>
    finalizeTransition(
      g,
      applyAttack(
        g,
        sortCards(
          g.players[g.attacker].hand.filter((card) =>
            g.selectedAttack.includes(card.id),
          ),
        ),
      ),
    ),
  );
}

  function passBlock() {
    if (game.phase !== "block" || isAITurn || game.pendingHandoff) return;
    setGame((g) => finalizeTransition(g, applyUnblocked(g)));
  }

  function commitBlock() {
    if (
      game.phase !== "block" ||
      !game.selectedBlock ||
      isAITurn ||
      game.pendingHandoff
    )
      return;
      playSound(blockSound);
    setGame((g) => {
      const block = g.players[g.defender].hand.find(
        (card) => card.id === g.selectedBlock,
      );
      return block && canCardBlock(block, g.currentAttack?.length ?? 0)
        ? finalizeTransition(g, applyBlock(g, block))
        : withLog(g, "Vybraný blok nestačí na blok.");
    });
  }

  function pauseTurn() {
    if (
      game.phase !== "attack" ||
      game.winner ||
      isAITurn ||
      game.pendingHandoff
    )
      return;
    setGame((g) => finalizeTransition(g, applyPause(g)));
  }

  function confirmRecovery() {
    if (
      game.phase !== "recovery" ||
      game.recoveryPlayer === null ||
      game.winner ||
      isAITurn ||
      game.pendingHandoff
    )
      return;
    setGame((g) =>
      finalizeTransition(g, applyRecovery(g, g.selectedRecoverySuit)),
    );
  }

  function runAIOnce(g) {
    if (!g.aiEnabled || g.winner || g.pendingHandoff) return g;

    if (g.phase === "mulligan" && g.mulliganPlayer === AI_PLAYER) {
      return applyMulligan(g, chooseAIMulligan(g));
    }

    if (g.phase === "block" && g.defender === AI_PLAYER) {
      const block = chooseAIBlock(g);
      return block ? applyBlock(g, block) : applyUnblocked(g);
    }

    if (g.phase === "attack" && g.attacker === AI_PLAYER) {
      const attack = chooseAIAttack(g);
      return attack ? applyAttack(g, attack) : applyPause(g);
    }

    if (g.phase === "recovery" && g.recoveryPlayer === AI_PLAYER) {
      return applyRecovery(g, chooseAIRecovery(g));
    }

    return g;
  }

  function toggleSetting(key) {
  setSettings((current) => ({
    ...current,
    [key]: !current[key],
  }));
}

  useEffect(() => {
    if (!isAITurn) return;
    const delay = game.phase === "block" ? 1250 : 650;

const timeout = setTimeout(
  () => setGame((g) => finalizeTransition(g, runAIOnce(g))),
  delay,
);
    return () => clearTimeout(timeout);
  }, [
    isAITurn,
    game.phase,
    game.attacker,
    game.defender,
    game.recoveryPlayer,
    game.mulliganPlayer,
    game.currentAttack?.length,
  ]);
  

  useEffect(() => {
  if (!game.eventFlash) return;

  if (game.eventFlash.type === "ko") {
    playSound(koSound, 0.9);
  }

  if (game.eventFlash.type === "block") {
    playSound(blockSound, 0.7);
  }
}, [game.eventFlash]);

useEffect(() => {
  if (game.winner) {
    playSound(finishSound, 0.8);
  }
}, [game.winner]);

useEffect(() => {
  if (!game.damageFlash) return;

  if (game.damageFlash >= 6) {
    playSound(comboSound, 0.7);
  } else {
    playSound(jabSound, 0.7);
  }
}, [game.damageFlash]);

useEffect(() => {
  if (!settings.screenShake) return;

  if (game.eventFlash?.type === "ko") {
    setScreenShake("shake-ko");
  } else if (game.damageFlash) {
    setScreenShake(game.damageFlash >= 6 ? "shake-combo" : "shake-jab");
  } else {
    return;
  }

  const timeout = setTimeout(() => {
    setScreenShake("");
  }, 450);

  return () => clearTimeout(timeout);
}, [game.damageFlash, game.eventFlash]);

useEffect(() => {
  localStorage.setItem("cardbox-settings", JSON.stringify(settings));
}, [settings]);

useEffect(() => {
  if (!initiativeRevealKey) return;

  setShowInitiativeReveal(true);

  const timeout = setTimeout(() => {
    setShowInitiativeReveal(false);
  }, 1200);

  return () => clearTimeout(timeout);
}, [initiativeRevealKey]);

  const currentBlock =
    game.phase === "block" && game.selectedBlock
      ? defender.hand.find((card) => card.id === game.selectedBlock)
      : null;

  const currentAttackSize = game.currentAttack?.length ?? 0;
  const currentBlockStrength = currentBlock
    ? FIGURE_BLOCK[currentBlock.rank]
    : 0;
  const blockCanStop = Boolean(
    currentBlock && currentBlockStrength >= currentAttackSize,
  );

  if (screen === "menu") {
    return (
      <MainMenu startGame={startGame} showRules={() => setScreen("rules")} />
    );
  }

  if (screen === "rules") {
    return <RulesScreen back={() => setScreen("menu")} />;
  }

  return (
    <div className={`app ${screenShake}`}>
      <div className="container">
        {game.damageFlash && (
          <DamageFlash
            damage={game.damageFlash}
            clear={() => setGame((g) => ({ ...g, damageFlash: null }))}
          />
        )}

        {game.eventFlash && (
          <EventFlash
            event={game.eventFlash}
            clear={() => setGame((g) => ({ ...g, eventFlash: null }))}
          />
        )}

       {showInitiativeReveal &&
  game.revealedInitiative &&
  (game.phase === "attack" || game.phase === "mulligan") && (
  <InitiativeReveal
    cards={game.revealedInitiative}
    starterName={game.players[game.attacker].name}
  />
)}

        {game.pendingHandoff && (
          <Panel className="handoff">
            <h2>Předání tahu</h2>
            <p>
              Předej zařízení hráči:{" "}
              <b>{game.players[game.viewingPlayer].name}</b>.
            </p>
            <Button
              onClick={() => setGame((g) => ({ ...g, pendingHandoff: false }))}
            >
              Převzít tah
            </Button>
          </Panel>
        )}

        <div className="topbar">
          <div>
            <h1>Karetní Box</h1>
            <p>
              {game.aiEnabled
                ? game.aiLevel === "hybrid"
                  ? "Proti AI — Zkušený soupeř"
                  : "Proti AI — Sparring partner"
                : "Hot-seat"}{" "}
              · recovery celého suitu · 6 kol
            </p>
          </div>
          <div className="row">
            <Button onClick={() => setShowLog(true)} variant="ghost">
              Historie
            </Button>
            <Button onClick={() => setScreen("menu")} variant="ghost">
              Menu
            </Button>
            <Button onClick={resetGame} variant="secondary">
              Nová hra
            </Button>
            <Button onClick={() => setShowSettings(true)} variant="ghost">
  Settings
</Button>
          </div>
        </div>

        {isAITurn && <Panel>AI přemýšlí…</Panel>}
        {game.winner && (
          <Panel className="result">Výsledek: {game.winner}</Panel>
        )}
        {showLog && (
          <LogDrawer log={game.log} close={() => setShowLog(false)} />
        )}
        
        {showSettings && (
  <Panel className="settings-panel">
    <h2>Settings</h2>

    <label className="setting-row">
      <span>Zvuky</span>
      <input
        type="checkbox"
        checked={settings.sound}
        onChange={() => toggleSetting("sound")}
      />
    </label>

    <label className="setting-row">
      <span>Screen shake</span>
      <input
        type="checkbox"
        checked={settings.screenShake}
        onChange={() => toggleSetting("screenShake")}
      />
    </label>

    <label className="setting-row">
      <span>Ambient audio</span>
      <input
        type="checkbox"
        checked={settings.ambient}
        onChange={() => toggleSetting("ambient")}
      />
    </label>

    <Button onClick={() => setShowSettings(false)} variant="secondary">
      Zavřít
    </Button>
  </Panel>
)}

        <div className="grid3">
          <Status game={game} />
          <Actions
            game={game}
            selectedAttackCards={selectedAttackCards}
            selectedMulliganCards={selectedMulliganCards}
            attackValid={attackValid}
            respectsAlternation={respectsAlternation}
            canAttack={canAttack}
            commitAttack={commitAttack}
            passBlock={passBlock}
            commitBlock={commitBlock}
            pauseTurn={pauseTurn}
            confirmRecovery={confirmRecovery}
            confirmMulligan={confirmMulligan}
            blockCanStop={blockCanStop}
            currentBlock={currentBlock}
            currentBlockStrength={currentBlockStrength}
            isAITurn={isAITurn}
            confirmInitiative={confirmInitiative}
          />
        </div>

        <div className="grid2">
          {[0, 1].map((idx) => (
            <PlayerPanel
              key={idx}
              idx={idx}
              game={game}
              renderCard={(card) => {
                const canInitiativeSelect =
                  game.phase === "initiative" &&
                  idx === (game.initiativePlayer ?? 0) &&
                  !game.pendingHandoff;
                const canMulliganSelect =
                  game.phase === "mulligan" &&
                  idx === (game.mulliganPlayer ?? 0) &&
                  !game.pendingHandoff;
                const canAttackSelect =
                  !isAITurn && game.phase === "attack" && idx === game.attacker;
                const canBlockSelect =
                  !isAITurn && game.phase === "block" && idx === game.defender;

                const selected =
                  (idx === game.attacker &&
                    game.selectedAttack.includes(card.id)) ||
                  (idx === game.defender && game.selectedBlock === card.id) ||
                  (canInitiativeSelect &&
                    game.selectedInitiative === card.id) ||
                  (canMulliganSelect &&
                    game.selectedMulligan.includes(card.id));

                const visualState = canMulliganSelect
                  ? mulliganCardState(card)
                  : canAttackSelect
                    ? attackCardState(card)
                    : canBlockSelect
                      ? blockCardState(card)
                      : "inactive";

                const hardDisabled =
                  game.pendingHandoff ||
                  (!canInitiativeSelect &&
                    !canMulliganSelect &&
                    !canAttackSelect &&
                    !canBlockSelect) ||
                  visualState === "locked" ||
                  (canBlockSelect && visualState !== "active");

                return (
                  <GameCard
                    key={card.id}
                    card={card}
                    hidden={game.pendingHandoff || idx !== game.viewingPlayer}
                    selected={selected}
                    state={visualState}
                    disabled={hardDisabled}
                    onClick={() =>
                      canInitiativeSelect
                        ? toggleInitiative(card)
                        : canMulliganSelect
                          ? toggleMulligan(card)
                          : canAttackSelect
                            ? toggleAttack(card)
                            : canBlockSelect
                              ? toggleBlock(card)
                              : null
                    }
                  />
                );
              }}
              toggleRecoverySuit={toggleRecoverySuit}
              isAITurn={isAITurn}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
