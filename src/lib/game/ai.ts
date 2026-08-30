import { rankValue } from "./cards";
import { hasCourtInHand, legalCards, teamOf, trickWinner } from "./engine";
import type { Card, GameAction, GameState, Seat, Suit } from "./types";

function lowest(cards: Card[]): Card {
  return cards.reduce((a, b) => (rankValue(a.rank) <= rankValue(b.rank) ? a : b));
}

function highest(cards: Card[]): Card {
  return cards.reduce((a, b) => (rankValue(a.rank) >= rankValue(b.rank) ? a : b));
}

function suitStrength(hand: Card[], suit: Suit): number {
  const of = hand.filter((c) => c.suit === suit);
  let score = of.length * 3;
  for (const c of of) {
    if (c.rank === "A") score += 6;
    else if (c.rank === "K") score += 4;
    else if (c.rank === "Q") score += 3;
    else if (c.rank === "J") score += 2;
    else if (c.rank === "10") score += 1;
  }
  if (of.some((c) => c.rank === "A") && of.some((c) => c.rank === "K")) score += 3;
  return score;
}

export function chooseTrump(hand: Card[]): Suit {
  const suits: Suit[] = ["S", "H", "D", "C"];
  let best: Suit = "S";
  let bestScore = -1;
  for (const s of suits) {
    const n = suitStrength(hand, s);
    if (n > bestScore) {
      best = s;
      bestScore = n;
    }
  }
  return best;
}

function beats(card: Card, current: Card, trump: Suit, led: Suit): boolean {
  const cT = card.suit === trump;
  const oT = current.suit === trump;
  if (cT && !oT) return true;
  if (!cT && oT) return false;
  if (card.suit === current.suit) return rankValue(card.rank) > rankValue(current.rank);
  if (card.suit === led && current.suit !== led && !oT) return true;
  return false;
}

export function choosePlay(state: GameState, seat: Seat): Card {
  const legal = legalCards(state, seat);
  if (legal.length === 0) throw new Error("No legal cards");
  if (legal.length === 1) return legal[0]!;
  const trump = state.trump!;
  const trick = state.currentTrick;

  if (trick.length === 0) {
    const nonTrump = legal.filter((c) => c.suit !== trump);
    const pool = nonTrump.length ? nonTrump : legal;
    const ace = pool.find((c) => c.rank === "A");
    if (ace) return ace;
    return highest(pool);
  }

  const led = trick[0]!.card.suit;
  const currentWinSeat = trickWinner(trick, trump);
  const partnerWinning = teamOf(currentWinSeat) === teamOf(seat) && currentWinSeat !== seat;
  const winningCard = trick.find((p) => p.seat === currentWinSeat)!.card;

  const following = legal.every((c) => c.suit === led);

  if (following) {
    if (partnerWinning) return lowest(legal);
    const winners = legal.filter((c) => beats(c, winningCard, trump, led));
    if (winners.length) return lowest(winners);
    return lowest(legal);
  }

  // Void in the led suit.
  if (partnerWinning) {
    const junk = legal.filter((c) => c.suit !== trump);
    return lowest(junk.length ? junk : legal);
  }

  const trumps = legal.filter((c) => c.suit === trump);
  const winningTrumps = trumps.filter((c) => beats(c, winningCard, trump, led));
  if (winningTrumps.length) return lowest(winningTrumps);

  const junk = legal.filter((c) => c.suit !== trump);
  return lowest(junk.length ? junk : legal);
}

export function botAction(state: GameState, seat: Seat): GameAction {
  if (state.phase === "choosingTrump") {
    const hand = state.hands[seat]!;
    if (!hasCourtInHand(hand) && state.redeals < 2) return { type: "redeal" };
    return { type: "chooseTrump", suit: chooseTrump(hand) };
  }
  if (state.phase === "playing") {
    return { type: "playCard", cardId: choosePlay(state, seat).id };
  }
  if (state.phase === "trickEnd") return { type: "collectTrick" };
  if (state.phase === "handEnd") return { type: "nextHand" };
  throw new Error("No bot action");
}
