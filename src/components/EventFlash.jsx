import { useEffect } from "react";
import { motion } from "framer-motion";

export function EventFlash({ event, clear }) {
  useEffect(() => {
    const timeout = setTimeout(clear, event?.type === "ko" ? 1400 : 950);
    return () => clearTimeout(timeout);
  }, [event, clear]);

  if (!event) return null;

  const isKO = event.type === "ko";
  const isBlock = event.type === "block";

  return (
    <div className={isKO ? "damage-flash event-flash-ko" : "damage-flash"}>
      <motion.div
        initial={{ scale: 0.35, opacity: 0, rotate: isBlock ? -8 : 0 }}
        animate={{ scale: 1.15, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className={`damage-box ${isKO ? "event-box-ko" : ""}`}
      >
        <div className="damage-label">{isKO ? "💥" : "🥊🥊"}</div>
        <div className={`event-title ${isKO ? "event-title-ko" : ""}`}>
          {isKO ? "KO!" : "BLOK!"}
        </div>
        {event.text && <div className="event-text">{event.text}</div>}
      </motion.div>
    </div>
  );
}
