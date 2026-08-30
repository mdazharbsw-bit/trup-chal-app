import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { botAction } from "@/lib/game/ai";
import { applyAction, createMatch, teamOf } from "@/lib/game/engine";
import type { GameAction, GameState, Seat } from "@/lib/game/types";
import { toClientView } from "@/lib/game/view";
import { bindAudioUnlock, sfx, unlockAudio } from "@/lib/audio";
import { botName, loadName } from "@/lib/names";
import { GameTable, type SeatInfo } from "./game-table";
import { Button } from "./ui/button";

function randomSeed() {
  return (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0;
}

function isHuman(mode: "practice" | "hotseat", seat: Seat, mySeat: Seat) {
  if (mode === "practice") return seat === mySeat;
  return true;
}

export function LocalGame({ mode }: { mode: "practice" | "hotseat" }) {
  const navigate = useNavigate();
  const mySeat: Seat = 0;
  const [state, setState] = useState<GameState>(() => createMatch(randomSeed(), 3));
  const [passGate, setPassGate] = useState(mode === "hotseat");
  const [hotSeat, setHotSeat] = useState<Seat>(0);
  const [names] = useState(() => {
    const you = loadName() || "You";
    if (mode === "practice") {
      return [you, botName(1), botName(2), botName(3)] as [string, string, string, string];
    }
    return [you, "East", "North", "West"] as [string, string, string, string];
  });
  const acting = useRef(false);

  useEffect(() => bindAudioUnlock(), []);

  const seats: SeatInfo[] = useMemo(
    () =>
      ([0, 1, 2, 3] as Seat[]).map((seat) => ({
        seat,
        name: names[seat]!,
        isBot: mode === "practice" && seat !== mySeat,
      })),
    [mode, names, mySeat],
  );

  const viewSeat: Seat = mode === "hotseat" ? hotSeat : mySeat;
  const view = toClientView(state, viewSeat);

  const dispatch = useCallback((action: GameAction, actor: Seat) => {
    setState((prev) => {
      try {
        const next = applyAction(prev, action, actor);
        if (action.type === "playCard") sfx.play();
        if (action.type === "chooseTrump") sfx.deal();
        if (action.type === "collectTrick") sfx.trick();
        if (next.phase === "handEnd" || next.phase === "matchEnd") {
          if (next.lastResult?.kot) sfx.kot();
          else sfx.win();
        }
        return next;
      } catch {
        sfx.illegal();
        return prev;
      }
    });
  }, []);

  useEffect(() => {
    if (state.phase === "matchEnd") return;
    if (state.phase === "trickEnd") {
      const t = window.setTimeout(
        () => dispatch({ type: "collectTrick" }, state.currentPlayer),
        1100,
      );
      return () => window.clearTimeout(t);
    }
    if (state.phase === "handEnd") {
      const t = window.setTimeout(() => dispatch({ type: "nextHand" }, 0), 2000);
      return () => window.clearTimeout(t);
    }
    const actor = state.currentPlayer;
    const human = isHuman(mode, actor, mySeat);
    if (human) {
      if (mode === "hotseat" && hotSeat !== actor) {
        setPassGate(true);
        setHotSeat(actor);
      }
      return;
    }
    if (acting.current) return;
    acting.current = true;
    const delay = 520 + Math.random() * 640;
    const t = window.setTimeout(() => {
      try {
        const action = botAction(state, actor);
        dispatch(action, actor);
      } finally {
        acting.current = false;
      }
    }, delay);
    return () => {
      window.clearTimeout(t);
      acting.current = false;
    };
  }, [state, mode, mySeat, hotSeat, dispatch]);

  function onAction(action: GameAction) {
    unlockAudio();
    const actor = mode === "hotseat" ? hotSeat : mySeat;
    dispatch(action, actor);
  }

  if (mode === "hotseat" && passGate) {
    const partner = teamOf(hotSeat) === 0 ? "North–South" : "East–West";
    return (
      <div className="felt-bg flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.24em] text-sage">{partner}</p>
        <h1 className="mt-3 font-display text-5xl font-semibold">{names[hotSeat]}</h1>
        <p className="mt-3 max-w-xs text-sm text-cream-dim">
          Pass the phone. Everyone else look away — then open your hand.
        </p>
        <Button
          className="mt-8 min-w-48"
          onClick={() => {
            unlockAudio();
            setPassGate(false);
          }}
        >
          Show my cards
        </Button>
      </div>
    );
  }

  return (
    <GameTable
      view={view}
      seats={seats}
      canAct={
        mode === "practice"
          ? state.currentPlayer === mySeat
          : state.currentPlayer === hotSeat && !passGate
      }
      hidden={mode === "hotseat" && passGate}
      onAction={onAction}
      onLeave={() => void navigate({ to: "/" })}
    />
  );
}
