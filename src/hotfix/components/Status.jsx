import { cardLabel } from "../game/cards.js";
import { Panel } from "./Panel.jsx";

function phaseLabel(phase) {
  if (phase === "initiative") return "iniciativa";
  if (phase === "mulligan") return "mulligan";
  if (phase === "attack") return "útok";
  if (phase === "block") return "blok";
  if (phase === "recovery") return "recovery";
  return phase;
}

function colorLabel(color) {
  if (color === "red") return "červená";
  if (color === "black") return "černá";
  return "—";
}

export function Status({ game }) {
  return (
    <Panel>
      <h2>Stav</h2>
      <p>Kolo: <b>{game.round}/{game.maxRounds}</b></p>
      <p>Fáze: <b>{phaseLabel(game.phase)}</b></p>

      {game.phase === "mulligan" && game.mulliganPlayer !== null && (
        <p>Mulligan: <b>{game.players[game.mulliganPlayer].name}</b></p>
      )}

      {game.phase !== "initiative" && game.phase !== "mulligan" && (
        <>
          <p>Útočník: <b>{game.players[game.attacker].name}</b></p>
          <p>Obránce: <b>{game.players[game.defender].name}</b></p>
        </>
      )}

      <p>Pauzy v kole: <b>{game.pausesThisRound}/3</b></p>
      <p>Poslední barva: <b>{game.lastAttackColor ? colorLabel(game.lastAttackColor) : "—"}</b></p>

      {game.revealedInitiative && (
        <p>Iniciativa: <b>{cardLabel(game.revealedInitiative[0])} vs {cardLabel(game.revealedInitiative[1])}</b></p>
      )}

      {game.phase === "recovery" && <p>Recoveruje: <b>{game.players[game.recoveryPlayer].name}</b></p>}
    </Panel>
  );
}
