import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { botAction } from "@/lib/game/ai";
import { applyAction, createMatch } from "@/lib/game/engine";
import type { GameAction, GameState, Seat } from "@/lib/game/types";
import { toClientView } from "@/lib/game/view";
import { useP2PRoom, type PeerInfo } from "@/lib/multiplayer";
import { bindAudioUnlock, sfx, unlockAudio } from "@/lib/audio";
import { botName, loadName } from "@/lib/names";
import { GameTable, type SeatInfo } from "./game-table";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { shareGame, triggerHaptic } from "@/lib/mobile-native";

type Wire =
  | { t: "lobby"; seats: LobbySeat[]; hostId: string }
  | { t: "start"; state: GameState; seats: LobbySeat[] }
  | { t: "act"; action: GameAction; actor: Seat }
  | { t: "snap"; state: GameState; seq: number };

interface LobbySeat {
  seat: Seat;
  name: string;
  peerId: string | null;
  isBot: boolean;
}

function emptyLobby(hostId: string, hostName: string): LobbySeat[] {
  return [
    { seat: 0, name: hostName, peerId: hostId, isBot: false },
    { seat: 1, name: "", peerId: null, isBot: false },
    { seat: 2, name: "", peerId: null, isBot: false },
    { seat: 3, name: "", peerId: null, isBot: false },
  ];
}

function isUp(p: PeerInfo) {
  return p.connectionState === "connected";
}

export function OnlineTable({ code, isCreator }: { code: string; isCreator: boolean }) {
  const navigate = useNavigate();
  const [myName] = useState(() => loadName() || "You");
  const p2p = useP2PRoom({ room: code, name: myName });
  const [lobby, setLobby] = useState<LobbySeat[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [copied, setCopied] = useState(false);
  const seq = useRef(0);
  const stateRef = useRef<GameState | null>(null);
  const lobbyRef = useRef<LobbySeat[]>([]);
  const acting = useRef(false);
  const seeded = useRef(false);

  const iAmHost = hostId === p2p.selfId || (isCreator && hostId === null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    lobbyRef.current = lobby;
  }, [lobby]);
  useEffect(() => bindAudioUnlock(), []);

  useEffect(() => {
    if (!p2p.joined || seeded.current) return;
    if (!isCreator) return;
    seeded.current = true;
    setHostId(p2p.selfId);
    setLobby(emptyLobby(p2p.selfId, myName));
  }, [p2p.joined, p2p.selfId, isCreator, myName]);

  useEffect(() => {
    if (!iAmHost || !seeded.current || stateRef.current) return;
    setLobby((prev) => {
      if (prev.length === 0) return prev;
      let next = prev.map((s) => ({ ...s }));
      const known = new Set(next.map((s) => s.peerId).filter(Boolean) as string[]);
      for (const peer of p2p.peers) {
        if (known.has(peer.id)) {
          next = next.map((s) =>
            s.peerId === peer.id && peer.name ? { ...s, name: peer.name } : s,
          );
          continue;
        }
        const free = next.find((s) => !s.peerId && !s.isBot);
        if (!free) continue;
        next = next.map((s) =>
          s.seat === free.seat
            ? { ...s, name: peer.name || "Player", peerId: peer.id, isBot: false }
            : s,
        );
        known.add(peer.id);
      }
      const live = new Set(p2p.peers.map((p) => p.id));
      live.add(p2p.selfId);
      next = next.map((s) =>
        s.peerId && !live.has(s.peerId) ? { ...s, peerId: null, name: "", isBot: false } : s,
      );
      const changed = JSON.stringify(next) !== JSON.stringify(prev);
      if (changed) {
        p2p.send({ t: "lobby", seats: next, hostId: p2p.selfId } satisfies Wire);
      }
      return changed ? next : prev;
    });
  }, [p2p.peers, p2p, iAmHost]);

  useEffect(() => {
    return p2p.onMessage((from, data) => {
      const msg = data as Wire;
      if (!msg || typeof msg !== "object" || !("t" in msg)) return;
      void from;

      if (msg.t === "lobby") {
        setHostId(msg.hostId);
        setLobby(msg.seats);
        return;
      }
      if (msg.t === "start") {
        setLobby(msg.seats);
        setState(msg.state);
        sfx.deal();
        return;
      }
      if (msg.t === "snap") {
        if (msg.seq <= seq.current) return;
        seq.current = msg.seq;
        setState((prev) => {
          if (msg.state.phase === "trickEnd" && prev?.phase === "playing") sfx.play();
          if (msg.state.phase === "playing" && prev?.phase === "trickEnd") sfx.trick();
          if (msg.state.phase === "playing" && prev?.phase === "choosingTrump") sfx.deal();
          if (
            (msg.state.phase === "handEnd" || msg.state.phase === "matchEnd") &&
            prev?.phase !== msg.state.phase
          ) {
            if (msg.state.lastResult?.kot) sfx.kot();
            else sfx.win();
          }
          return msg.state;
        });
        return;
      }
      if (msg.t === "act") {
        const host = hostId ?? (isCreator ? p2p.selfId : null);
        if (host !== p2p.selfId) return;
        applyHost(msg.action, msg.actor);
      }
    });
  }, [p2p, hostId, isCreator]);

  useEffect(() => {
    if (!iAmHost) return;
    for (const peer of p2p.peers) {
      if (!isUp(peer)) continue;
      if (stateRef.current) {
        p2p.send({ t: "start", state: stateRef.current, seats: lobbyRef.current } satisfies Wire, peer.id);
      } else if (lobbyRef.current.length) {
        p2p.send({ t: "lobby", seats: lobbyRef.current, hostId: p2p.selfId } satisfies Wire, peer.id);
      }
    }
  }, [p2p.peers, p2p, iAmHost]);

  function applyHost(action: GameAction, actor: Seat) {
    const cur = stateRef.current;
    if (!cur) return;
    try {
      const next = applyAction(cur, action, actor);
      seq.current += 1;
      setState(next);
      p2p.send({ t: "snap", state: next, seq: seq.current } satisfies Wire);
      if (action.type === "playCard") sfx.play();
      if (action.type === "chooseTrump") sfx.deal();
      if (action.type === "collectTrick") sfx.trick();
      if (next.phase === "handEnd" || next.phase === "matchEnd") {
        if (next.lastResult?.kot) sfx.kot();
        else sfx.win();
      }
    } catch {
      sfx.illegal();
    }
  }

  function fillBot() {
    setLobby((prev) => {
      const free = prev.find((s) => !s.peerId && !s.isBot);
      if (!free) return prev;
      const next = prev.map((s) =>
        s.seat === free.seat ? { ...s, isBot: true, name: botName(free.seat, 4), peerId: null } : s,
      );
      p2p.send({ t: "lobby", seats: next, hostId: p2p.selfId } satisfies Wire);
      return next;
    });
  }

  function startGame() {
    const filled = lobby.map((s, i) =>
      s.peerId || s.isBot ? s : { ...s, isBot: true, name: botName(i, 9) },
    );
    const seed = (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0;
    const next = createMatch(seed, 3);
    seq.current = 1;
    setLobby(filled);
    setState(next);
    p2p.send({ t: "start", state: next, seats: filled } satisfies Wire);
    sfx.deal();
  }

  useEffect(() => {
    if (!iAmHost || !state) return;
    if (state.phase === "matchEnd") return;
    if (state.phase === "trickEnd") {
      const t = window.setTimeout(() => applyHost({ type: "collectTrick" }, state.currentPlayer), 1100);
      return () => window.clearTimeout(t);
    }
    if (state.phase === "handEnd") {
      const t = window.setTimeout(() => applyHost({ type: "nextHand" }, 0), 1800);
      return () => window.clearTimeout(t);
    }
    const actor = state.currentPlayer;
    const seat = lobby.find((s) => s.seat === actor);
    if (!seat?.isBot) return;
    if (acting.current) return;
    acting.current = true;
    const t = window.setTimeout(() => {
      try {
        applyHost(botAction(state, actor), actor);
      } finally {
        acting.current = false;
      }
    }, 500 + Math.random() * 700);
    return () => {
      window.clearTimeout(t);
      acting.current = false;
    };
  }, [state, iAmHost, lobby]);

  const mySeat = (lobby.find((s) => s.peerId === p2p.selfId)?.seat ?? (isCreator ? 0 : null)) as
    | Seat
    | null;

  const filledCount = lobby.filter((s) => s.peerId || s.isBot).length;
  const humans = lobby.filter((s) => s.peerId).length;
  const peersReady =
    p2p.peers.filter((p) => lobby.some((s) => s.peerId === p.id)).every(isUp) || p2p.peers.length === 0;

  const seatInfos: SeatInfo[] = (lobby.length ? lobby : emptyLobby(p2p.selfId, myName)).map((s) => ({
    seat: s.seat,
    name:
      s.name ||
      (s.seat === 0 ? "South" : s.seat === 1 ? "East" : s.seat === 2 ? "North" : "West"),
    isBot: s.isBot,
    connected:
      !s.peerId ||
      s.peerId === p2p.selfId ||
      p2p.peers.find((p) => p.id === s.peerId)?.connectionState === "connected",
  }));

  async function copyCode() {
    triggerHaptic("tap");
    const shared = await shareGame(code, myName);
    if (shared) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!state || mySeat === null) {
    const rows = lobby.length ? lobby : emptyLobby(p2p.selfId, isCreator ? myName : "");
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
            {rows.map((s) => {
              const peer = s.peerId ? p2p.peers.find((p) => p.id === s.peerId) : null;
              const mine = s.peerId === p2p.selfId;
              const label =
                s.seat === 0 ? "South" : s.seat === 1 ? "East" : s.seat === 2 ? "North" : "West";
              const team = s.seat % 2 === 0 ? "NS" : "EW";
              return (
                <li
                  key={s.seat}
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
                      {s.name || (s.isBot ? "Bot" : "Empty")}
                      {mine ? " (you)" : ""}
                    </div>
                  </div>
                  <div className="text-xs text-sage">
                    {s.peerId
                      ? mine
                        ? "Seated"
                        : peer
                          ? isUp(peer)
                            ? "Connected"
                            : peer.connectionState === "failed"
                              ? "Can't reach"
                              : "Linking…"
                          : "Linking…"
                      : s.isBot
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
              <Button variant="secondary" disabled={filledCount >= 4} onClick={fillBot}>
                Fill a seat with a bot
              </Button>
              <Button
                disabled={filledCount < 4 || !p2p.joined}
                onClick={() => {
                  unlockAudio();
                  startGame();
                }}
              >
                Deal
              </Button>
              {!peersReady && humans > 1 && (
                <p className="text-center text-xs text-sage">Waiting for every phone to link…</p>
              )}
            </div>
          )}
          {!iAmHost && (
            <p className="mt-6 text-center text-sm text-sage">
              {p2p.joined ? "Waiting for the host to deal." : "Joining the table…"}
            </p>
          )}
        </div>
      </div>
    );
  }

  const seated: Seat = mySeat ?? 0;
  const view = toClientView(state, seated);
  const myTurn = state.currentPlayer === seated;
  const myHuman = Boolean(lobby.find((s) => s.seat === seated && s.peerId === p2p.selfId));

  function onAction(action: GameAction) {
    unlockAudio();
    if (iAmHost) applyHost(action, seated);
    else p2p.send({ t: "act", action, actor: seated } satisfies Wire);
  }

  return (
    <GameTable
      view={view}
      seats={seatInfos}
      canAct={myHuman && myTurn && (state.phase === "playing" || state.phase === "choosingTrump")}
      onAction={onAction}
      onLeave={() => void navigate({ to: "/" })}
      status={
        p2p.peers.some((p) => p.connectionState === "failed")
          ? "A friend could not connect. Try the same wifi, or fill the seat with a bot."
          : undefined
      }
    />
  );
}
