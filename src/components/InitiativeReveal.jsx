import { motion } from "framer-motion";
import { cardLabel } from "../game/cards.js";

export function InitiativeReveal({ cards, starterName }) {
  if (!cards?.length) return null;

  return (
    <div className="initiative-reveal">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="initiative-box"
      >
        <div className="initiative-title">INICIATIVA</div>
        <div className="initiative-cards">
          <span>{cardLabel(cards[0])}</span>
          <b>VS</b>
          <span>{cardLabel(cards[1])}</span>
        </div>
        <div className="initiative-winner">Začíná {starterName}</div>
      </motion.div>
    </div>
  );
}