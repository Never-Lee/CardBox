import { SUITS } from "../game/constants.js";
import { cardLabel, sortCards } from "../game/cards.js";

export function SuitTable({
  cards,
  recoveryMode,
  selectedRecoverySuit,
  toggleRecoverySuit,
}) {
  if (!cards.length) {
    return <p className="muted">Žádné vyložené karty.</p>;
  }

  return (
    <div className="groups">
      {SUITS.map((suit) => {
        const suitCards = sortCards(
          cards.filter((card) => card.suit === suit.id)
        );

        if (!suitCards.length) return null;

        const selected = recoveryMode && selectedRecoverySuit === suit.id;

        return (
          <div key={suit.id} className="suit-group">
            <div className="suit-table-head">
              <b className={suit.color}>
                {suit.symbol} {suit.name}
              </b>

              {recoveryMode && (
                <button
                  className={`mini-card ${suit.color} ${
                    selected ? "selected" : ""
                  }`}
                  onClick={() => toggleRecoverySuit(suit.id)}
                >
                  Recover celý suit
                </button>
              )}
            </div>

            <div className="card-row">
              {suitCards.map((card) => (
                <span
                  key={card.id}
                  className={`mini-card ${card.color} ${
                    selected ? "selected" : ""
                  }`}
                >
                  {cardLabel(card)}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}