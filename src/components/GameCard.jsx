import { motion } from "framer-motion";
import { cardLabel } from "../game/cards.js";
export function GameCard({
  card,
  selected,
  disabled,
  onClick,
  hidden = false,
  state = "inactive",
}) {
  const stateClass = hidden
    ? "hidden-card"
    : state === "locked"
      ? "locked-card"
      : state === "soft"
        ? "soft-card"
        : card.color === "red"
          ? "red-card"
          : "black-card";
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled || hidden}
      className={`game-card ${selected ? "selected" : ""} ${stateClass}`}
    >
      {hidden ? "🂠" : cardLabel(card)}
    </motion.button>
  );
}
