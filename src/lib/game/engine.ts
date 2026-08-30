import { fisherYates, isCourt, makeDeck, mulberry32, rankValue } from "./cards";
import type { Card, GameAction, GameState, HandResult, Seat, Suit, Team, TrickPlay } from "./types";

export const MATCH_TARGET = 7;
const MAX_REDEALS = 2;

export function teamOf(seat: Seat): Team {
  return (seat % 2) as Team;
}

export function partnerOf(seat: Seat): Seat {
  return ((seat + 2) % 4) as Seat;
}

export function nextSeat(seat: Seat): Seat {
  return ((seat + 1) % 4) as Seat;
}

function emptyHands(): [Card[], Card[], Card[], Card[]] {
  return [[], [], [], []];
}

function dealBatch(
  deck: Card[],
  start: Seat,
  count: number,
  hands: [Card[], Card[], Card[], Card[]],
): Card[] {
  const rest = deck.slice();
  for (let n = 0; n < count; n++) {
    for (let i = 0; i < 4; i++) {
      const seat = ((start + i) % 4) as Seat;
      const card = rest.shift();
      if (!card) throw new Error("Deck exhausted while dealing");
      hands[seat] = [...hands[seat], card];
    }
  }
  return rest;
}

function dealFive(seed: number, dealer: Seat): Pick<GameState, "deck" | "hands" | "trumpCaller"> {
  const rand = mulberry32(seed);
  const shuffled = fisherYates(makeDeck(), rand);
  const trumpCaller = nextSeat(dealer);
  const hands = emptyHands();
  const deck = dealBatch(shuffled, trumpCaller, 5, hands);
  return { deck, hands, trumpCaller };
}

export function createMatch(seed: number, dealer: Seat = 0): GameState {
  const dealt = dealFive(seed, dealer);
  return {
    seed,
    deck: dealt.deck,
    hands: dealt.hands,
    dealer,
    trumpCaller: dealt.trumpCaller,
    trump: null,
    phase: "choosingTrump",
    currentPlayer: dealt.trumpCaller,
    trickLeader: dealt.trumpCaller,
    currentTrick: [],
    seatTricks: [0, 0, 0, 0],
    teamTricks: [0, 0],
    scores: [0, 0],
    winStreak: [0, 0],
    redeals: 0,
    target: MATCH_TARGET,
    lastResult: null,
    handsPlayed: 0,
  };
}

export function hasCourtInHand(hand: Card[]): boolean {
  return hand.some(isCourt);
}

export function legalCards(state: GameState, seat: Seat): Card[] {
  const hand = state.hands[seat];
  if (state.phase !== "playing") return [];
  if (state.currentPlayer !== seat) return [];
  if (state.currentTrick.length === 0) return hand.slice();
  const led = state.currentTrick[0]!.card.suit;
  const ofSuit = hand.filter((c) => c.suit === led);
  return ofSuit.length > 0 ? ofSuit : hand.slice();
}

export function trickWinner(trick: TrickPlay[], trump: Suit): Seat {
  const led = trick[0]!.card.suit;
  let best = trick[0]!;
  for (let i = 1; i < trick.length; i++) {
    const play = trick[i]!;
    const playTrump = play.card.suit === trump;
    const bestTrump = best.card.suit === trump;
    if (playTrump && !bestTrump) {
      best = play;
      continue;
    }
    if (!playTrump && bestTrump) continue;
    if (play.card.suit === best.card.suit && rankValue(play.card.rank) > rankValue(best.card.rank)) {
      best = play;
    } else if (!playTrump && !bestTrump && play.card.suit === led && best.card.suit !== led) {
      best = play;
    }
  }
  return best.seat;
}

function takeCard(hand: Card[], cardId: string): { next: Card[]; card: Card } | null {
  const idx = hand.findIndex((c) => c.id === cardId);
  if (idx < 0) return null;
  const card = hand[idx]!;
  return { card, next: [...hand.slice(0, idx), ...hand.slice(idx + 1)] };
}

function scoreHand(teamTricks: [number, number], winStreak: [number, number], winner: Team): HandResult {
  const nsTricks = teamTricks[0];
  const ewTricks = teamTricks[1];
  const kot = (winner === 0 ? ewTricks : nsTricks) === 0;
  const nextStreak: [number, number] = [0, 0];
  nextStreak[winner] = kot ? 0 : winStreak[winner] + 1;
  const sevenStraight = !kot && nextStreak[winner] >= 7;
  let points = kot ? 2 : 1;
  if (sevenStraight) points += 2;
  return { winner, nsTricks, ewTricks, kot, sevenStraight, points };
}

function startNextHand(state: GameState, winner: Team): GameState {
  const dealer = winner === teamOf(state.trumpCaller) ? state.dealer : nextSeat(state.dealer);
  const seed = (state.seed + 1 + state.handsPlayed * 9973) >>> 0;
  const dealt = dealFive(seed, dealer);
  return {
    ...state,
    seed,
    deck: dealt.deck,
    hands: dealt.hands,
    dealer,
    trumpCaller: dealt.trumpCaller,
    trump: null,
    phase: "choosingTrump",
    currentPlayer: dealt.trumpCaller,
    trickLeader: dealt.trumpCaller,
    currentTrick: [],
    seatTricks: [0, 0, 0, 0],
    teamTricks: [0, 0],
    redeals: 0,
    lastResult: state.lastResult,
  };
}

export function applyAction(state: GameState, action: GameAction, actor: Seat): GameState {
  switch (action.type) {
    case "chooseTrump": {
      if (state.phase !== "choosingTrump") throw new Error("Trump already chosen");
      if (actor !== state.trumpCaller) throw new Error("Only the trump caller may choose");
      const hands = emptyHands();
      for (let s = 0; s < 4; s++) hands[s] = state.hands[s]!.slice();
      const rest = dealBatch(state.deck, state.trumpCaller, 8, hands);
      return {
        ...state,
        deck: rest,
        hands,
        trump: action.suit,
        phase: "playing",
        currentPlayer: state.trumpCaller,
        trickLeader: state.trumpCaller,
      };
    }
    case "redeal": {
      if (state.phase !== "choosingTrump") throw new Error("Cannot redeal now");
      if (actor !== state.trumpCaller) throw new Error("Only the trump caller may redeal");
      if (hasCourtInHand(state.hands[actor]!)) {
        throw new Error("Redeal only if you hold no court cards");
      }
      if (state.redeals >= MAX_REDEALS) throw new Error("Redeal limit reached");
      const seed = (state.seed + 17 + state.redeals * 31) >>> 0;
      const dealt = dealFive(seed, state.dealer);
      return {
        ...state,
        seed,
        deck: dealt.deck,
        hands: dealt.hands,
        trumpCaller: dealt.trumpCaller,
        redeals: state.redeals + 1,
        currentPlayer: dealt.trumpCaller,
        trickLeader: dealt.trumpCaller,
      };
    }
    case "playCard": {
      if (state.phase !== "playing") throw new Error("Not in play");
      if (actor !== state.currentPlayer) throw new Error("Not your turn");
      const legal = legalCards(state, actor);
      if (!legal.some((c) => c.id === action.cardId)) throw new Error("Illegal card");
      const taken = takeCard(state.hands[actor]!, action.cardId);
      if (!taken) throw new Error("Card not in hand");
      const hands = emptyHands();
      for (let s = 0; s < 4; s++) hands[s] = s === actor ? taken.next : state.hands[s]!.slice();
      const currentTrick = [...state.currentTrick, { seat: actor, card: taken.card }];
      if (currentTrick.length < 4) {
        return {
          ...state,
          hands,
          currentTrick,
          currentPlayer: nextSeat(actor),
        };
      }
      return {
        ...state,
        hands,
        currentTrick,
        phase: "trickEnd",
        currentPlayer: actor,
      };
    }
    case "collectTrick": {
      if (state.phase !== "trickEnd") throw new Error("No trick to collect");
      if (!state.trump) throw new Error("No trump");
      const winner = trickWinner(state.currentTrick, state.trump);
      const winnerTeam = teamOf(winner);
      const seatTricks = state.seatTricks.slice() as [number, number, number, number];
      seatTricks[winner] += 1;
      const teamTricks = state.teamTricks.slice() as [number, number];
      teamTricks[winnerTeam] += 1;
      const handOver = teamTricks[0] >= 7 || teamTricks[1] >= 7;
      if (!handOver) {
        return {
          ...state,
          seatTricks,
          teamTricks,
          currentTrick: [],
          phase: "playing",
          trickLeader: winner,
          currentPlayer: winner,
        };
      }
      const result = scoreHand(teamTricks, state.winStreak, winnerTeam);
      const scores = state.scores.slice() as [number, number];
      scores[winnerTeam] += result.points;
      const winStreak: [number, number] = [0, 0];
      winStreak[winnerTeam] = result.kot ? 0 : state.winStreak[winnerTeam] + 1;
      winStreak[winnerTeam === 0 ? 1 : 0] = 0;
      const matchOver = scores[0] >= state.target || scores[1] >= state.target;
      return {
        ...state,
        seatTricks,
        teamTricks,
        scores,
        winStreak,
        lastResult: result,
        handsPlayed: state.handsPlayed + 1,
        currentTrick: [],
        phase: matchOver ? "matchEnd" : "handEnd",
        currentPlayer: winner,
        trickLeader: winner,
      };
    }
    case "nextHand": {
      if (state.phase !== "handEnd" || !state.lastResult) throw new Error("Hand is not over");
      return startNextHand(state, state.lastResult.winner);
    }
    default:
      throw new Error("Unknown action");
  }
}

export function tryAction(state: GameState, action: GameAction, actor: Seat): GameState | null {
  try {
    return applyAction(state, action, actor);
  } catch {
    return null;
  }
}
