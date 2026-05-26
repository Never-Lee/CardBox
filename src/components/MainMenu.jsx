import { Button } from "./Button.jsx";
import { Panel } from "./Panel.jsx";
export function MainMenu({ startGame, showRules }) {
  return (
    <div className="app menu">
      <div className="menu-box">
        <img
  src="/ui/logo.png"
  alt="Karetní Box"
  className="menu-logo"
/>
        <Panel>
          <Button onClick={() => startGame("hotseat")} className="wide">
            Hot-seat
          </Button>
          <Button
            onClick={() => startGame("basic-ai")}
            variant="secondary"
            className="wide"
          >
            Proti AI — Sparring partner
          </Button>
          <Button
            onClick={() => startGame("hybrid-ai")}
            variant="secondary"
            className="wide"
          >
            Proti AI — Zkušený soupeř
          </Button>
          <Button onClick={showRules} variant="ghost" className="wide">
            Pravidla
          </Button>
        </Panel>
      </div>
    </div>
  );
}
