import { useEffect } from "react";
import { SUIT_NAMES, type GameAction, type Seat, type Suit } from "@/lib/game/types";
import type { ClientView } from "@/lib/game/view";
import { cn } from "@/lib/utils";
import { PlayingCard } from "./playing-card";
import { SuitIcon } from "./suit-icon";
import { Button } from "./ui/button";
import { triggerHaptic, requestWakeLock, releaseWakeLock } from "@/lib/mobile-native";

export interface SeatInfo {
  seat: Seat;
  name: string;
  isBot: boolean;
  connected?: boolean;
}

const RELATIVE: Record<0 | 1 | 2 | 3, "bottom" | "right" | "top" | "left"> = {
  0: "bottom",
  1: "right",
  2: "top",
  3: "left",
};

function relativeOf(mySeat: Seat, seat: Seat) {
  const d = ((seat - mySeat + 4) % 4) as 0 | 1 | 2 | 3;
  return RELATIVE[d];
}

function Opponent({
  name,
  tricks,
  isTurn,
  isBot,
  side,
}: {
  name: string;
  tricks: number;
  cards: number;
  isTurn: boolean;
  isBot: boolean;
  side: "top" | "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        side === "top" && "flex-col",
        side === "left" && "flex-col items-start",
        side === "right" && "flex-col items-end",
      )}
    >
      <div
        className={cn(
          "rounded-md border px-2.5 py-1 text-center",
          isTurn ? "border-cream bg-cream text-ink" : "border-line bg-ink/40 text-cream",
        )}
      >
        <div className="max-w-28 truncate text-xs font-medium tracking-wide">{name}</div>
        <div className="font-mono text-[10px] tabular-nums text-sage">
          {tricks} trick{tricks === 1 ? "" : "s"}
          {isBot ? " · bot" : ""}
        </div>
      </div>
    </div>
  );
}

function TrumpBadge({ trump }: { trump: Suit | null }) {
  if (!trump) {
    return (
      <div className="rounded-full border border-line bg-ink/40 px-2.5 py-1 font-mono text-xs text-sage">
        Turup: —
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-cream/30 bg-ink/60 px-3 py-1 font-mono text-xs font-medium text-cream">
      <span className="text-sage">Turup:</span>
      <SuitIcon suit={trump} className="h-3.5 w-3.5" />
      <span>{SUIT_NAMES[trump]}</span>
    </div>
  );
}

export function GameTable({
  view,
  seats,
  onAction,
  onLeave,
  status,
  canAct = true,
  hidden = false,
}: {
  view: ClientView;
  seats: SeatInfo[];
  onAction: (action: GameAction) => void;
  onLeave: () => void;
  status?: string;
  canAct?: boolean;
  hidden?: boolean;
}) {
  useEffect(() => {
    void requestWakeLock();
    return () => {
      void releaseWakeLock();
    };
  }, []);

  useEffect(() => {
    if (view.phase === "matchEnd" || view.phase === "handEnd") {
      triggerHaptic("win");
    }
  }, [view.phase]);

  const nameOf = (seat: Seat) => seats.find((s) => s.seat === seat)?.name ?? `Seat ${seat}`;
  const botOf = (seat: Seat) => Boolean(seats.find((s) => s.seat === seat)?.isBot);

  const byRel = {
    top: ((view.mySeat + 2) % 4) as Seat,
    left: ((view.mySeat + 3) % 4) as Seat,
    right: ((view.mySeat + 1) % 4) as Seat,
  };

  const trickPos = {
    bottom: "bottom-1 left-1/2 -translate-x-1/2",
    top: "top-1 left-1/2 -translate-x-1/2",
    left: "left-1 top-1/2 -translate-y-1/2",
    right: "right-1 top-1/2 -translate-y-1/2",
  };

  const choosing = view.phase === "choosingTrump" && view.currentPlayer === view.mySeat && canAct;
  const playing = view.phase === "playing" && view.currentPlayer === view.mySeat && canAct;

  return (
    <div className="felt-bg relative flex min-h-dvh flex-col overflow-x-hidden select-none">
      <header className="z-20 flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic("tap");
            onLeave();
          }}
          className="rounded-sm px-2 py-2 text-xs tracking-wide text-sage hover:text-cream"
        >
          Leave
        </button>
        <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
          <span className={view.myTeam === 0 ? "text-cream" : "text-sage"}>NS {view.scores[0]}</span>
          <span className="text-line">·</span>
          <span className={view.myTeam === 1 ? "text-cream" : "text-sage"}>EW {view.scores[1]}</span>
          <span className="text-sage">/ {view.target}</span>
        </div>
        <TrumpBadge trump={view.trump} />
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex justify-center pt-1">
          <Opponent
            name={nameOf(byRel.top)}
            tricks={view.seats[byRel.top]!.tricks}
            cards={view.seats[byRel.top]!.cardCount}
            isTurn={view.seats[byRel.top]!.isTurn}
            isBot={botOf(byRel.top)}
            side="top"
          />
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-between px-2">
          <Opponent
            name={nameOf(byRel.left)}
            tricks={view.seats[byRel.left]!.tricks}
            cards={view.seats[byRel.left]!.cardCount}
            isTurn={view.seats[byRel.left]!.isTurn}
            isBot={botOf(byRel.left)}
            side="left"
          />

          <div className="relative h-36 w-36 shrink-0 sm:h-44 sm:w-44">
            <div className="absolute inset-0 rounded-full border border-cream/10" />
            <div className="absolute inset-4 rounded-full border border-cream/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="font-mono text-lg tabular-nums text-cream">
                  {view.teamTricks[0]}–{view.teamTricks[1]}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-sage">this hand</div>
              </div>
            </div>
            {view.currentTrick.map((play) => {
              const rel = relativeOf(view.mySeat, play.seat);
              return (
                <div key={play.card.id} className={cn("absolute", trickPos[rel as keyof typeof trickPos])}>
                  <PlayingCard card={play.card} size="sm" />
                </div>
              );
            })}
          </div>

          <Opponent
            name={nameOf(byRel.right)}
            tricks={view.seats[byRel.right]!.tricks}
            cards={view.seats[byRel.right]!.cardCount}
            isTurn={view.seats[byRel.right]!.isTurn}
            isBot={botOf(byRel.right)}
            side="right"
          />
        </div>
      </div>

      <div className="z-10 px-3 pb-1 text-center">
        <div
          className={cn(
            "inline-flex rounded-md px-3 py-1 text-xs tracking-wide",
            view.seats[view.mySeat]!.isTurn && canAct ? "bg-cream text-ink font-medium" : "text-sage",
          )}
        >
          {status ??
            (view.phase === "choosingTrump"
              ? view.currentPlayer === view.mySeat
                ? "Choose turup from your five cards"
                : `${nameOf(view.currentPlayer)} is choosing turup`
              : view.phase === "playing"
                ? view.currentPlayer === view.mySeat
                  ? "Your chal — play a card"
                  : `${nameOf(view.currentPlayer)} to play`
                : view.phase === "trickEnd"
                  ? "Trick complete"
                  : "")}
        </div>
      </div>

      {choosing && (
        <div className="z-20 mx-auto mb-2 flex flex-wrap items-center justify-center gap-2 px-3">
          {(["S", "H", "D", "C"] as Suit[]).map((s) => (
            <Button
              key={s}
              variant="secondary"
              className="min-w-20 gap-2"
              onClick={() => {
                triggerHaptic("trump");
                onAction({ type: "chooseTrump", suit: s });
              }}
            >
              <SuitIcon suit={s} className="h-4 w-4" />
              {SUIT_NAMES[s]}
            </Button>
          ))}
          {view.canRedeal && (
            <Button
              variant="ghost"
              onClick={() => {
                triggerHaptic("tap");
                onAction({ type: "redeal" });
              }}
            >
              Redeal
            </Button>
          )}
        </div>
      )}

      <div className="relative z-10 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="hand-fan flex h-36 items-end justify-center px-1 sm:h-40">
          {(hidden ? [] : view.myHand).map((card, i, arr) => {
            const n = arr.length;
            const t = n <= 1 ? 0 : (i / (n - 1) - 0.5) * 2;
            const rot = t * Math.min(16, n * 1.15);
            const y = Math.abs(t) * 8;
            const legal = view.legalIds.includes(card.id);
            const dim = playing && !legal;
            const overlap = n > 10 ? -36 : n > 7 ? -30 : n > 4 ? -22 : -12;
            return (
              <div
                key={card.id}
                className="origin-bottom shrink-0 transition-transform duration-150"
                style={{
                  marginLeft: i === 0 ? 0 : overlap,
                  transform: `rotate(${rot}deg) translateY(${y}px)`,
                  zIndex: i,
                }}
              >
                <PlayingCard
                  card={card}
                  size="lg"
                  dimmed={dim}
                  onClick={
                    playing && legal
                      ? () => {
                          triggerHaptic("card");
                          onAction({ type: "playCard", cardId: card.id });
                        }
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
        <div className="mt-1 text-center text-[10px] uppercase tracking-[0.2em] text-sage">
          {nameOf(view.mySeat)}
          {seats.find((s) => s.seat === view.mySeat)?.isBot ? " · bot" : ""}
          {" · "}
          {view.seats[view.mySeat]!.tricks} tricks
        </div>
      </div>

      {(view.phase === "handEnd" || view.phase === "matchEnd") && view.lastResult && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/70 px-6">
          <div className="w-full max-w-sm rounded-xl border border-line bg-felt p-6 text-center shadow-xl">
            <p className="text-[10px] uppercase tracking-[0.22em] text-sage">
              {view.phase === "matchEnd" ? "Match over" : "Hand over"}
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold">
              {view.lastResult.kot ? "Court" : "Won"}
            </h2>
            <p className="mt-2 text-sm text-cream-dim">
              {view.lastResult.winner === 0 ? "North–South" : "East–West"} take it{" "}
              {view.lastResult.nsTricks}–{view.lastResult.ewTricks}
              {view.lastResult.kot ? " without reply — a kot." : "."}
              {view.lastResult.sevenStraight ? " Seven straight hands: extra court." : ""}
            </p>
            <p className="mt-3 font-mono text-sm tabular-nums text-sage">
              NS {view.scores[0]} · EW {view.scores[1]} · first to {view.target}
            </p>
            {view.phase === "matchEnd" && (
              <Button className="mt-5 w-full" onClick={onLeave}>
                Back to lobby
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
