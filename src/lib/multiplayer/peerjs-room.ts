import Peer, { DataConnection } from "peerjs";
import type { PeerInfo } from "./p2p";

export interface PeerJSRoomOptions {
  room: string;
  isHost: boolean;
  selfId?: string;
  name: string;
  onPeersChanged?: (peers: PeerInfo[]) => void;
  onMessage?: (from: string, data: unknown) => void;
  onConnected?: () => void;
}

export class PeerJSRoom {
  private peer: Peer | null = null;
  private connections = new Map<string, DataConnection>();
  private opts: PeerJSRoomOptions;
  private hostConn: DataConnection | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  public readonly selfId: string;
  public readonly hostPeerId: string;

  constructor(opts: PeerJSRoomOptions) {
    this.opts = opts;
    const cleanRoom = opts.room.trim().toUpperCase();
    this.hostPeerId = `trupchal-v2-${cleanRoom}-host`;
    this.selfId =
      opts.selfId ??
      (opts.isHost
        ? this.hostPeerId
        : `trupchal-v2-${cleanRoom}-${Math.random().toString(36).slice(2, 8)}`);
  }

  public join() {
    try {
      this.peer = new Peer(this.selfId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun.cloudflare.com:3478" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      });

      this.peer.on("open", () => {
        this.opts.onConnected?.();
        if (this.opts.isHost) {
          this.listenForGuests();
        } else {
          this.connectToHost();
        }
      });

      this.peer.on("error", (err: any) => {
        console.warn("[PeerJS] error:", err?.type || err);
        if (!this.opts.isHost) {
          this.hostConn = null;
        }
      });

      // Keepalive & Auto-Reconnect loop
      this.pingTimer = setInterval(() => {
        if (!this.opts.isHost && (!this.hostConn || !this.hostConn.open)) {
          this.connectToHost();
        }
        this.emitPeers();
      }, 2000);
    } catch (err) {
      console.error("[PeerJS] init failed:", err);
    }
  }

  private listenForGuests() {
    if (!this.peer) return;
    this.peer.on("connection", (conn) => {
      this.setupConnection(conn);
    });
  }

  private connectToHost() {
    if (!this.peer || this.hostConn?.open) return;
    const conn = this.peer.connect(this.hostPeerId, {
      reliable: true,
      metadata: { name: this.opts.name },
    });
    this.hostConn = conn;
    this.setupConnection(conn);
  }

  private setupConnection(conn: DataConnection) {
    conn.on("open", () => {
      this.connections.set(conn.peer, conn);
      this.emitPeers();

      if (!this.opts.isHost) {
        // Send join handshake to host
        conn.send({ t: "join_req", name: this.opts.name, peerId: this.selfId });
      }
    });

    conn.on("data", (data: any) => {
      if (data && typeof data === "object" && "t" in data) {
        if (data.t === "join_req" && this.opts.isHost) {
          conn.metadata = { ...(conn.metadata as any), name: data.name || "Player" };
          this.emitPeers();
        }
        this.opts.onMessage?.(conn.peer, data);
      }
    });

    conn.on("close", () => {
      this.connections.delete(conn.peer);
      this.emitPeers();
      if (!this.opts.isHost) {
        // Retry connection if lost
        setTimeout(() => this.connectToHost(), 2000);
      }
    });

    conn.on("error", () => {
      this.connections.delete(conn.peer);
      this.emitPeers();
    });
  }

  public send(data: unknown, peerId?: string) {
    if (peerId) {
      const conn = this.connections.get(peerId);
      if (conn?.open) {
        conn.send(data);
      }
    } else {
      this.broadcast(data);
    }
  }

  public broadcast(data: unknown) {
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(data);
      }
    }
  }

  private emitPeers() {
    const list: PeerInfo[] = Array.from(this.connections.values()).map((conn) => ({
      id: conn.peer,
      name: (conn.metadata as any)?.name || "Player",
      connectionState: conn.open ? "connected" : "connecting",
      candidateType: "srflx",
      rttMs: 30,
    }));
    this.opts.onPeersChanged?.(list);
  }

  public close() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    for (const conn of this.connections.values()) {
      conn.close();
    }
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}
