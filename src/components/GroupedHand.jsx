import { SUITS } from "../game/constants.js";
import { sortCards } from "../game/cards.js";
import { GameCard } from "./GameCard.jsx";
export function GroupedHand({ hand, renderCard, hidden = false }) {
  if (hidden)
    return (
      <div className="groups">
        <div className="suit-group">
          <b className="muted">Skrytá ruka</b>
          <div className="card-row">
            {hand.map((c) => (
              <GameCard key={c.id} card={c} hidden disabled />
            ))}
          </div>
        </div>
      </div>
    );
  return (
    <div className="groups">
      {SUITS.map((s) => {
        const cards = sortCards(hand.filter((c) => c.suit === s.id));
        return cards.length ? (
          <div key={s.id} className="suit-group">
            <b className={s.color}>
              {s.symbol} {s.name}
            </b>
            <div className="card-row">{cards.map(renderCard)}</div>
          </div>
        ) : null;
      })}
    </div>
  );
}
