import type { Card, Rank, Suit } from "./types";

export const SUITS: Suit[] = ["S", "H", "D", "C"];
export const RANKS: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

const RANK_VALUE: Record<Rank, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  "10": 10,
  "9": 9,
  "8": 8,
  "7": 7,
  "6": 6,
  "5": 5,
  "4": 4,
  "3": 3,
  "2": 2,
};

export function rankValue(rank: Rank): number {
  return RANK_VALUE[rank];
}

export function cardId(suit: Suit, rank: Rank): string {
  return `${rank}${suit}`;
}

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: cardId(suit, rank), suit, rank });
    }
  }
  return deck;
}

/** Mulberry32 — deterministic, unbiased enough for a 52-card shuffle. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fisherYates(deck: Card[], rand: () => number): Card[] {
  const cards = deck.slice();
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = cards[i]!;
    cards[i] = cards[j]!;
    cards[j] = tmp;
  }
  return cards;
}

export function isRed(suit: Suit): boolean {
  return suit === "H" || suit === "D";
}

export function isCourt(card: Card): boolean {
  return card.rank === "A" || card.rank === "K" || card.rank === "Q" || card.rank === "J";
}

export function compareCards(a: Card, b: Card, trump: Suit, led: Suit): number {
  const aTrump = a.suit === trump;
  const bTrump = b.suit === trump;
  if (aTrump !== bTrump) return aTrump ? 1 : -1;
  if (a.suit === led && b.suit !== led && !bTrump) return 1;
  if (b.suit === led && a.suit !== led && !aTrump) return -1;
  if (a.suit === b.suit) return rankValue(a.rank) - rankValue(b.rank);
  return 0;
}

export function sortHand(cards: Card[], trump: Suit | null): Card[] {
  const suitOrder: Suit[] = trump
    ? [trump, ...SUITS.filter((s) => s !== trump)]
    : ["S", "H", "C", "D"];
  return cards.slice().sort((a, b) => {
    const si = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    if (si !== 0) return si;
    return rankValue(b.rank) - rankValue(a.rank);
  });
}
