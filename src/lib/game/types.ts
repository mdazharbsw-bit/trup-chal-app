export type Suit = "S" | "H" | "D" | "C";
export type Rank = "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";
export type Seat = 0 | 1 | 2 | 3;
export type Team = 0 | 1;

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type Phase =
  | "choosingTrump"
  | "playing"
  | "trickEnd"
  | "handEnd"
  | "matchEnd";

export interface TrickPlay {
  seat: Seat;
  card: Card;
}

export interface HandResult {
  winner: Team;
  nsTricks: number;
  ewTricks: number;
  kot: boolean;
  sevenStraight: boolean;
  points: number;
}

export interface GameState {
  seed: number;
  deck: Card[];
  hands: [Card[], Card[], Card[], Card[]];
  dealer: Seat;
  trumpCaller: Seat;
  trump: Suit | null;
  phase: Phase;
  currentPlayer: Seat;
  trickLeader: Seat;
  currentTrick: TrickPlay[];
  /** Tricks won this hand by each seat. */
  seatTricks: [number, number, number, number];
  teamTricks: [number, number];
  /** Match points (courts / wins). */
  scores: [number, number];
  /** Consecutive hand wins without a court, per team. */
  winStreak: [number, number];
  redeals: number;
  target: number;
  lastResult: HandResult | null;
  handsPlayed: number;
}

export type GameAction =
  | { type: "chooseTrump"; suit: Suit }
  | { type: "redeal" }
  | { type: "playCard"; cardId: string }
  | { type: "collectTrick" }
  | { type: "nextHand" };

export const SEAT_LABELS: Record<Seat, string> = {
  0: "South",
  1: "East",
  2: "North",
  3: "West",
};

export const SUIT_NAMES: Record<Suit, string> = {
  S: "Spades",
  H: "Hearts",
  D: "Diamonds",
  C: "Clubs",
};

export const TEAM_NAMES: Record<Team, string> = {
  0: "North–South",
  1: "East–West",
};
