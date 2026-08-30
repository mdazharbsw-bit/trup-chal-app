import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { botAction } from "@/lib/game/ai";
import type { GameAction, GameState, Seat } from "@/lib/game/types";
import { toClientView } from "@/lib/game/view";
import { useServerRoom } from "@/lib/multiplayer/use-server-room";
import { bindAudioUnlock, sfx } from "@/lib/audio";
import { loadName } from "@/lib/names";
import { GameTable, type SeatInfo } from "./game-table";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { shareGame, triggerHaptic } from "@/lib/mobile-native";

export function OnlineTable({ code, isCreator }: { code: string; isCreator: boolean }) {
  const navigate = useNavigate();
  const [myName] = useState(() => loadName() || "You");
  const server = useServerRoom({ room: code, name: myName, isHost: isCreator });
  const [copied, setCopied] = useState(false);
  const acting = useRef(false);
  const prevStateRef = useRef<GameState | null>(null);

  const iAmHost = server.hostId === server.selfId || (isCreator && server.hostId === null);
  const seats = server.seats;
  const state = server.state;

  useEffect(() => bindAudioUnlock(), []);

  // Sound effects on state phase transitions
  useEffect(() => {
    if (!state) return;
    const prev = prevStateRef.current;
    if (state.phase === "trickEnd" && prev?.phase === "playing") sfx.play();
    if (state.phase === "playing" && prev?.phase === "trickEnd") sfx.trick();
    if (state.phase === "playing" && prev?.phase === "choosingTrump") sfx.deal();
    if (
      (state.phase === "handEnd" || state.phase === "matchEnd") &&
      prev?.phase !== state.phase
    ) {
      if (state.lastResult?.kot) sfx.kot();
      else sfx.win();
    }
    prevStateRef.current = state;
  }, [state]);

  // Host bot automation loop
  useEffect(() => {
    if (!iAmHost || !state) return;
    if (state.phase === "matchEnd") return;

    if (state.phase === "trickEnd") {
      const t = window.setTimeout(
        () => void server.sendAction({ type: "collectTrick" }),
        1100,
      );
      return () => window.clearTimeout(t);
    }
    if (state.phase === "handEnd") {
      const t = window.setTimeout(
        () => void server.sendAction({ type: "nextHand" }),
        1800,
      );
      return () => window.clearTimeout(t);
    }

    const actor = state.currentPlayer;
    const seatObj = seats.find((s) => s.seat === actor);
    if (!seatObj?.isBot) return;
    if (acting.current) return;

    acting.current = true;
    const t = window.setTimeout(() => {
      try {
        const action = botAction(state, actor);
        void server.sendAction(action);
      } finally {
        acting.current = false;
      }
    }, 500 + Math.random() * 600);

    return () => {
      window.clearTimeout(t);
      acting.current = false;
    };
  }, [state, iAmHost, seats, server]);

  const mySeat = (seats.find((s) => s.peerId === server.selfId)?.seat ??
    (isCreator ? 0 : null)) as Seat | null;

  const filledCount = seats.filter((s) => s.peerId || s.isBot).length;

  const seatInfos: SeatInfo[] = [0, 1, 2, 3].map((st) => {
    const s = seats.find((item) => item.seat === st);
    return {
      seat: st as Seat,
      name:
        s?.name ||
        (st === 0 ? "South" : st === 1 ? "East" : st === 2 ? "North" : "West"),
      isBot: Boolean(s?.isBot),
      connected: Boolean(s?.peerId || s?.isBot),
    };
  });

  async function copyCode() {
    triggerHaptic("tap");
    const shared = await shareGame(code, myName);
    if (shared) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  // Pre-game lobby view
  if (!state || mySeat === null) {
    return (
      <div className="felt-bg min-h-dvh px-5 py-8">
        <div className="mx-auto w-full max-w-md">
          <button
            type="button"
            onClick={() => void navigate({ to: "/" })}
            className="text-xs tracking-wide text-sage hover:text-cream"
          >
            Leave
          </button>
          <p className="mt-8 text-[11px] uppercase tracking-[0.28em] text-sage">Private table</p>
          <h1 className="mt-2 font-display text-5xl font-semibold">Sit down</h1>
          <p className="mt-3 text-sm text-cream-dim">
            Share this code. Partners sit opposite — South with North, East with West.
          </p>

          <button
            type="button"
            onClick={() => void copyCode()}
            className="mt-6 flex w-full items-center justify-between rounded-lg border border-line bg-ink/40 px-4 py-4"
          >
            <span className="font-mono text-3xl tracking-[0.28em] text-cream">{code}</span>
            <span className="text-xs text-sage">{copied ? "Copied" : "Copy"}</span>
          </button>

          <ol className="mt-8 space-y-3">
            {[0, 1, 2, 3].map((st) => {
              const s = seats.find((item) => item.seat === st);
              const mine = s?.peerId === server.selfId;
              const label =
                st === 0 ? "South" : st === 1 ? "East" : st === 2 ? "North" : "West";
              const team = st % 2 === 0 ? "NS" : "EW";
              return (
                <li
                  key={st}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-4 py-3",
                    mine ? "border-cream/40 bg-cream/10" : "border-line bg-ink/30",
                  )}
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-sage">
                      {label} · {team}
                    </div>
                    <div className="text-sm font-medium">
                      {s?.name || (s?.isBot ? "Bot" : "Empty")}
                      {mine ? " (you)" : ""}
                    </div>
                  </div>
                  <div className="text-xs text-sage">
                    {s?.peerId
                      ? mine
                        ? "Seated"
                        : "Connected"
                      : s?.isBot
                        ? "Bot"
                        : iAmHost
                          ? "Open"
                          : "Waiting"}
                  </div>
                </li>
              );
            })}
          </ol>

          {iAmHost && (
            <div className="mt-6 flex flex-col gap-3">
              <Button
                variant="secondary"
                disabled={filledCount >= 4}
                onClick={() => void server.fillBot()}
              >
                Fill a seat with a bot
              </Button>
              <Button
                disabled={filledCount < 4 || !server.joined}
                onClick={() => {
                  sfx.deal();
                  void server.startGame();
                }}
              >
                Deal
              </Button>
            </div>
          )}

          {!iAmHost && (
            <p className="mt-8 text-center text-xs text-sage">Waiting for the host to deal.</p>
          )}
        </div>
      </div>
    );
  }

  // Active game view
  const clientView = toClientView(state, mySeat);

  return (
    <GameTable
      view={clientView}
      seats={seatInfos}
      onAction={(action) => void server.sendAction(action)}
      onLeave={() => void navigate({ to: "/" })}
    />
  );
}
