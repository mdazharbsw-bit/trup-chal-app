import { sortHand } from "./cards";
import { legalCards, teamOf } from "./engine";
import type { Card, GameState, Seat, Suit } from "./types";

export interface SeatView {
  seat: Seat;
  cardCount: number;
  tricks: number;
  isTurn: boolean;
}

export interface ClientView {
  phase: GameState["phase"];
  mySeat: Seat;
  myHand: Card[];
  legalIds: string[];
  trump: Suit | null;
  trumpCaller: Seat;
  dealer: Seat;
  currentPlayer: Seat;
  trickLeader: Seat;
  currentTrick: GameState["currentTrick"];
  seats: SeatView[];
  teamTricks: [number, number];
  scores: [number, number];
  lastResult: GameState["lastResult"];
  canRedeal: boolean;
  target: number;
  handsPlayed: number;
  myTeam: 0 | 1;
}

export function toClientView(state: GameState, mySeat: Seat): ClientView {
  const hand = sortHand(state.hands[mySeat]!, state.trump);
  const legal = legalCards(state, mySeat);
  const canRedeal =
    state.phase === "choosingTrump" &&
    mySeat === state.trumpCaller &&
    state.redeals < 2 &&
    !hand.some((c) => c.rank === "A" || c.rank === "K" || c.rank === "Q" || c.rank === "J");

  return {
    phase: state.phase,
    mySeat,
    myHand: hand,
    legalIds: legal.map((c) => c.id),
    trump: state.trump,
    trumpCaller: state.trumpCaller,
    dealer: state.dealer,
    currentPlayer: state.currentPlayer,
    trickLeader: state.trickLeader,
    currentTrick: state.currentTrick,
    seats: [0, 1, 2, 3].map((s) => ({
      seat: s as Seat,
      cardCount: state.hands[s as Seat].length,
      tricks: state.seatTricks[s as Seat],
      isTurn: state.currentPlayer === s && (state.phase === "playing" || state.phase === "choosingTrump"),
    })),
    teamTricks: state.teamTricks,
    scores: state.scores,
    lastResult: state.lastResult,
    canRedeal,
    target: state.target,
    handsPlayed: state.handsPlayed,
    myTeam: teamOf(mySeat),
  };
}
