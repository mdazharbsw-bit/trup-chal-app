/**
 * React binding for P2P / PeerJS Room.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { PeerJSRoom } from "./peerjs-room";
import { P2PRoom, type PeerInfo } from "./p2p";

export interface UseP2PRoomOptions {
  room?: string;
  name?: string;
  isHost?: boolean;
}

export interface P2PRoomHandle {
  selfId: string;
  room: string;
  peers: PeerInfo[];
  joined: boolean;
  broadcast: (data: unknown) => void;
  send: (data: unknown, peerId?: string) => void;
  onMessage: (
    fn: (from: string, data: unknown, channel: "state" | "reliable") => void,
  ) => () => void;
}

function defaultRoom(): string {
  if (typeof window === "undefined") return "room-ssr";
  return `room-${window.location.hostname.split(".")[0]}`.slice(0, 64);
}

export function useP2PRoom(options: UseP2PRoomOptions = {}): P2PRoomHandle {
  const [selfId] = useState(() => `p-${Math.random().toString(36).slice(2, 10)}`);
  const [room] = useState(() => options.room ?? defaultRoom());
  const [name] = useState(() => options.name ?? selfId);
  const isHost = Boolean(options.isHost);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [joined, setJoined] = useState(false);

  const peerjsRef = useRef<PeerJSRoom | null>(null);
  const p2pRef = useRef<P2PRoom | null>(null);

  const listeners = useRef(
    new Set<(from: string, data: unknown, channel: "state" | "reliable") => void>(),
  );

  useEffect(() => {
    // Primary: PeerJS global WebRTC signaling server
    const peerjs = new PeerJSRoom({
      room,
      isHost,
      name,
      onPeersChanged: (list) => {
        setPeers(list);
      },
      onMessage: (from, data) => {
        for (const fn of listeners.current) fn(from, data, "reliable");
      },
      onConnected: () => setJoined(true),
    });
    peerjsRef.current = peerjs;
    peerjs.join();

    // Fallback: local /api/rtc signaling relay
    const p2p = new P2PRoom({
      room,
      selfId,
      name,
      onPeersChanged: (list) => {
        setPeers((prev) => (prev.length ? prev : list));
      },
      onMessage: (from, data, channel) => {
        for (const fn of listeners.current) fn(from, data, channel);
      },
      onConnected: () => setJoined(true),
    });
    p2pRef.current = p2p;
    void p2p.join();

    return () => {
      peerjsRef.current = null;
      peerjs.close();
      p2pRef.current = null;
      p2p.close();
    };
  }, [room, selfId, name, isHost]);

  const broadcast = useCallback((data: unknown) => {
    peerjsRef.current?.broadcast(data);
    p2pRef.current?.broadcast(data);
  }, []);

  const send = useCallback((data: unknown, peerId?: string) => {
    peerjsRef.current?.send(data, peerId);
    p2pRef.current?.send(data, peerId);
  }, []);

  const onMessage = useCallback(
    (fn: (from: string, data: unknown, channel: "state" | "reliable") => void) => {
      listeners.current.add(fn);
      return () => {
        listeners.current.delete(fn);
      };
    },
    [],
  );

  return { selfId, room, peers, joined, broadcast, send, onMessage };
}
