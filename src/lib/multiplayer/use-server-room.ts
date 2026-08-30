import { useCallback, useEffect, useRef, useState } from "react";
import type { RoomData, RoomSeat } from "./room.server";
import type { GameAction, GameState } from "@/lib/game/types";
import type { PeerInfo } from "./p2p";

export interface UseServerRoomOptions {
  room: string;
  name: string;
  isHost?: boolean;
}

export interface ServerRoomHandle {
  selfId: string;
  room: string;
  hostId: string | null;
  seats: RoomSeat[];
  state: GameState | null;
  peers: PeerInfo[];
  joined: boolean;
  fillBot: () => Promise<void>;
  startGame: () => Promise<void>;
  sendAction: (action: GameAction) => Promise<void>;
}

function getSessionPeerId(roomCode: string, isHost: boolean): string {
  if (typeof window === "undefined") return "ssr";
  const clean = roomCode.trim().toUpperCase();
  const key = `trup_peer_${clean}`;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = isHost
      ? `host-${clean}-${Math.random().toString(36).slice(2, 8)}`
      : `guest-${clean}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function useServerRoom(options: UseServerRoomOptions): ServerRoomHandle {
  const isHost = Boolean(options.isHost);
  const cleanRoom = options.room.trim().toUpperCase();

  const [selfId] = useState(() => getSessionPeerId(cleanRoom, isHost));
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [joined, setJoined] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRoom = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        code: cleanRoom,
        peerId: selfId,
        name: options.name || "Player",
        host: isHost ? "1" : "0",
      });
      const res = await fetch(`/api/room?${params}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { room: RoomData | null };
      if (data.room) {
        setRoomData(data.room);
        setJoined(true);
      }
    } catch {
      // Ignore poll error
    }
  }, [cleanRoom, selfId, options.name, isHost]);

  useEffect(() => {
    void fetchRoom();
    pollingRef.current = setInterval(() => {
      void fetchRoom();
    }, 500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchRoom]);

  const postOp = useCallback(
    async (op: string, extra: Record<string, unknown> = {}) => {
      try {
        const res = await fetch("/api/room", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            op,
            code: cleanRoom,
            peerId: selfId,
            name: options.name,
            ...extra,
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { room: RoomData | null };
        if (data.room) setRoomData(data.room);
      } catch {
        // Ignore post error
      }
    },
    [cleanRoom, selfId, options.name],
  );

  const fillBot = useCallback(async () => {
    await postOp("fill_bot");
  }, [postOp]);

  const startGame = useCallback(async () => {
    await postOp("start");
  }, [postOp]);

  const sendAction = useCallback(
    async (action: GameAction) => {
      await postOp("act", { action });
    },
    [postOp],
  );

  const seats = roomData?.seats ?? [];
  const state = roomData?.state ?? null;
  const hostId = roomData?.hostId ?? null;

  const peers: PeerInfo[] = seats
    .filter((s) => s.peerId && s.peerId !== selfId)
    .map((s) => ({
      id: s.peerId!,
      name: s.name || "Player",
      connectionState: "connected",
      candidateType: "srflx",
      rttMs: 25,
    }));

  return {
    selfId,
    room: cleanRoom,
    hostId,
    seats,
    state,
    peers,
    joined,
    fillBot,
    startGame,
    sendAction,
  };
}
