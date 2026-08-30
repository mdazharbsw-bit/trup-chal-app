import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyAction, createMatch, legalCards, teamOf, trickWinner } from "./engine.ts";
import { choosePlay, chooseTrump } from "./ai.ts";
import type { Card, Seat, Suit } from "./types.ts";

function card(id: string): Card {
  const rank = id.startsWith("10") ? "10" : id.slice(0, 1);
  const suit = id.slice(rank.length) as Suit;
  return { id, rank: rank as Card["rank"], suit };
}

describe("deal", () => {
  it("deals five cards then thirteen after trump", () => {
    const g = createMatch(42, 0);
    assert.equal(g.phase, "choosingTrump");
    assert.equal(g.trumpCaller, 1);
    for (let s = 0; s < 4; s++) assert.equal(g.hands[s as Seat].length, 5);
    const next = applyAction(g, { type: "chooseTrump", suit: "H" }, 1);
    assert.equal(next.trump, "H");
    assert.equal(next.phase, "playing");
    for (let s = 0; s < 4; s++) assert.equal(next.hands[s as Seat].length, 13);
    assert.equal(next.currentPlayer, 1);
  });

  it("refuses redeal when the caller holds a court card", () => {
    const g = createMatch(1, 0);
    const hasCourt = g.hands[g.trumpCaller].some((c) =>
      ["A", "K", "Q", "J"].includes(c.rank),
    );
    if (hasCourt) {
      assert.throws(() => applyAction(g, { type: "redeal" }, g.trumpCaller));
    }
  });
});

describe("follow suit", () => {
  it("forces the led suit when the player holds it", () => {
    let g = createMatch(99, 0);
    g = applyAction(g, { type: "chooseTrump", suit: "S" }, g.trumpCaller);
    const leader = g.currentPlayer;
    const lead = g.hands[leader][0]!;
    g = applyAction(g, { type: "playCard", cardId: lead.id }, leader);
    const next = g.currentPlayer;
    const legal = legalCards(g, next);
    const held = g.hands[next].filter((c) => c.suit === lead.suit);
    if (held.length) {
      assert.ok(legal.every((c) => c.suit === lead.suit));
      assert.equal(legal.length, held.length);
    } else {
      assert.equal(legal.length, g.hands[next].length);
    }
  });
});

describe("tricks", () => {
  it("awards the trick to the highest trump", () => {
    const winner = trickWinner(
      [
        { seat: 0, card: card("AH") },
        { seat: 1, card: card("KH") },
        { seat: 2, card: card("2S") },
        { seat: 3, card: card("QH") },
      ],
      "S",
    );
    assert.equal(winner, 2);
  });

  it("awards a no-trump trick to the highest of the led suit", () => {
    const winner = trickWinner(
      [
        { seat: 0, card: card("9H") },
        { seat: 1, card: card("AH") },
        { seat: 2, card: card("KD") },
        { seat: 3, card: card("2H") },
      ],
      "S",
    );
    assert.equal(winner, 1);
  });
});

describe("hand scoring", () => {
  it("ends the hand at seven tricks and scores a court at 7-0", () => {
    let g = createMatch(7, 0);
    g = applyAction(g, { type: "chooseTrump", suit: chooseTrump(g.hands[g.trumpCaller]!) }, g.trumpCaller);
    let guard = 0;
    while (g.phase === "playing" || g.phase === "trickEnd") {
      if (guard++ > 80) throw new Error("runaway");
      if (g.phase === "trickEnd") {
        g = applyAction(g, { type: "collectTrick" }, g.currentPlayer);
        continue;
      }
      const seat = g.currentPlayer;
      const play = choosePlay(g, seat);
      g = applyAction(g, { type: "playCard", cardId: play.id }, seat);
    }
    assert.ok(g.phase === "handEnd" || g.phase === "matchEnd");
    assert.ok(g.lastResult);
    assert.ok(g.lastResult.nsTricks === 7 || g.lastResult.ewTricks === 7);
    if (g.lastResult.kot) {
      assert.equal(g.lastResult.points, 2);
      assert.equal(g.lastResult.nsTricks + g.lastResult.ewTricks, 7);
    } else {
      assert.equal(g.lastResult.points, 1);
    }
    assert.equal(teamOf(0), 0);
    assert.equal(teamOf(1), 1);
  });
});
