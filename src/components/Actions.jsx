import { attackDamage, cardLabel } from "../game/cards.js";
import { Button } from "./Button.jsx";
import { Panel } from "./Panel.jsx";

export function Actions({
  game,
  selectedAttackCards,
  selectedMulliganCards,
  attackValid,
  respectsAlternation,
  canAttack,
  commitAttack,
  passBlock,
  commitBlock,
  pauseTurn,
  confirmRecovery,
  confirmMulligan,
  blockCanStop,
  currentBlock,
  currentBlockStrength,
  isAITurn,
  confirmInitiative,
}) {
  return (
    <Panel>
      <h2>Akce</h2>

      {game.phase === "initiative" && (
        <>
          <p className="muted">
            {game.aiEnabled
              ? "Vyber jednu kartu z ruky pro iniciativu. AI odhalí svou kartu současně. Vyšší karta začíná."
              : `${game.players[game.initiativePlayer ?? 0].name}: vyber jednu kartu pro iniciativu. Po potvrzení předej zařízení soupeři.`}
          </p>
          <Button onClick={confirmInitiative} disabled={!game.selectedInitiative || game.pendingHandoff}>
            {game.aiEnabled || (game.initiativePlayer ?? 0) === 1
              ? "Odhalit karty a určit začínajícího"
              : "Potvrdit kartu a předat zařízení"}
          </Button>
        </>
      )}

      {game.phase === "mulligan" && (
        <>
          <p className="muted">
            Mulligan prvního kola: vyber libovolný počet karet z ruky kromě karet použitých pro iniciativu.
            Vybrané karty se zamíchají do balíčku a dolízneš do 8.
          </p>
          <div className="info">
            <p>Vybráno k odhození: <b>{selectedMulliganCards.length ? selectedMulliganCards.map(cardLabel).join(" ") : "—"}</b></p>
          </div>
          <Button onClick={confirmMulligan} disabled={isAITurn || game.pendingHandoff}>
            Potvrdit mulligan
          </Button>
        </>
      )}

      {game.phase === "attack" && (
        <>
          <div className="info">
            <p>Vybraný útok: <b>{selectedAttackCards.length ? selectedAttackCards.map(cardLabel).join(" ") : "—"}</b></p>
            <p>Postupka: <b>{attackValid ? "ano" : "ne"}</b></p>
            <p>Střídání barev: <b>{respectsAlternation ? "ano" : "ne"}</b></p>
            <p>Damage: <b>{attackDamage(selectedAttackCards)}</b></p>
          </div>
          <Button onClick={commitAttack} disabled={!canAttack || isAITurn}>Zahrát útok</Button>
          <Button onClick={pauseTurn} disabled={isAITurn} variant="secondary">Pauza — líznout do 8</Button>
        </>
      )}

      {game.phase === "block" && (
        <>
          <div className="info">
            <p>Útok: <b>{game.currentAttack.map(cardLabel).join(" ")}</b></p>
            <p>Damage při zásahu: <b>{attackDamage(game.currentAttack)}</b></p>
            <p>Vybraný blok: <b>{currentBlock ? cardLabel(currentBlock) : "—"}</b></p>
            <p>Síla bloku: <b>{currentBlock ? (currentBlockStrength === Infinity ? "bez omezení" : currentBlockStrength) : "—"}</b></p>
            <p>Vybraný blok stačí: <b>{blockCanStop ? "ano" : "ne"}</b></p>
          </div>
          <Button onClick={commitBlock} disabled={!blockCanStop || isAITurn}>Blokovat — převzít iniciativu</Button>
          <Button onClick={passBlock} disabled={isAITurn} variant="danger">Neblokovat — přijmout zásah</Button>
        </>
      )}

      {game.phase === "recovery" && (
        <>
          <p className="muted">Vyber jeden suit. Všechny tvoje vyložené karty tohoto suitu se vrátí do balíčku.</p>
          <Button onClick={confirmRecovery} disabled={isAITurn}>Potvrdit recovery</Button>
        </>
      )}
    </Panel>
  );
}
