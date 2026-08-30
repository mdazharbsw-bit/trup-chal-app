import { getSql, type Sql } from "@/lib/db";
import { createMatch, applyAction } from "@/lib/game/engine";
import type { GameState, GameAction, Seat } from "@/lib/game/types";

export interface RoomSeat {
  seat: Seat;
  peerId: string | null;
  name: string;
  isBot: boolean;
}

export interface RoomData {
  code: string;
  hostId: string;
  seats: RoomSeat[];
  state: GameState | null;
  seq: number;
  updatedAt: number;
}

const globalRef = globalThis as typeof globalThis & {
  __memoryRooms__?: Map<string, RoomData>;
  __roomSchemaPromise__?: Promise<void>;
};

function getMemoryStore(): Map<string, RoomData> {
  return (globalRef.__memoryRooms__ ??= new Map<string, RoomData>());
}

async function ensureSchema(sql: Sql): Promise<void> {
  globalRef.__roomSchemaPromise__ ??= (async () => {
    await sql.query(
      `CREATE TABLE IF NOT EXISTS game_rooms (
         code TEXT PRIMARY KEY,
         host_id TEXT NOT NULL,
         seats JSONB NOT NULL,
         state JSONB,
         seq INT NOT NULL DEFAULT 0,
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
    );
  })().catch((err) => {
    globalRef.__roomSchemaPromise__ = undefined;
    throw err;
  });
  return globalRef.__roomSchemaPromise__;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().slice(0, 32);
}

function botName(seat: number): string {
  const names = ["Aarav", "Meera", "Imran", "Priya", "Kabir", "Ananya", "Rohan"];
  return names[seat % names.length];
}

function emptyLobby(hostId: string, hostName: string): RoomSeat[] {
  return [
    { seat: 0, peerId: hostId, name: hostName || "Host", isBot: false },
    { seat: 1, peerId: null, name: "", isBot: false },
    { seat: 2, peerId: null, name: "", isBot: false },
    { seat: 3, peerId: null, name: "", isBot: false },
  ];
}

export async function getRoom(rawCode: string): Promise<RoomData | null> {
  const code = normalizeCode(rawCode);
  try {
    const sql = await getSql();
    await ensureSchema(sql);
    const rows = await sql.query<{
      code: string;
      host_id: string;
      seats: RoomSeat[];
      state: GameState | null;
      seq: number;
      updated_at: string;
    }>(`SELECT code, host_id, seats, state, seq, updated_at FROM game_rooms WHERE code = $1`, [code]);

    if (rows.length > 0) {
      const r = rows[0];
      const data: RoomData = {
        code: r.code,
        hostId: r.host_id,
        seats: r.seats,
        state: r.state,
        seq: r.seq,
        updatedAt: new Date(r.updated_at).getTime(),
      };
      getMemoryStore().set(code, data);
      return data;
    }
  } catch (err) {
    console.warn("[room.server] db get error, using memory fallback:", err);
  }

  return getMemoryStore().get(code) ?? null;
}

export async function saveRoom(data: RoomData): Promise<RoomData> {
  data.updatedAt = Date.now();
  getMemoryStore().set(data.code, data);

  try {
    const sql = await getSql();
    await ensureSchema(sql);
    await sql.query(
      `INSERT INTO game_rooms (code, host_id, seats, state, seq, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (code)
       DO UPDATE SET host_id = EXCLUDED.host_id, seats = EXCLUDED.seats, state = EXCLUDED.state, seq = EXCLUDED.seq, updated_at = now()`,
      [data.code, data.hostId, JSON.stringify(data.seats), JSON.stringify(data.state), data.seq],
    );
  } catch (err) {
    console.warn("[room.server] db save error, using memory fallback:", err);
  }

  return data;
}

export async function createOrGetRoom(rawCode: string, hostId: string, name: string): Promise<RoomData> {
  const code = normalizeCode(rawCode);
  let existing = await getRoom(code);
  if (existing) {
    // If host is reconnecting, update host name if changed
    if (existing.hostId === hostId) {
      existing.seats[0].name = name || existing.seats[0].name;
      return await saveRoom(existing);
    }
    // If another player tries to create an existing room, join them instead
    return await joinRoom(code, hostId, name);
  }

  const newRoom: RoomData = {
    code,
    hostId,
    seats: emptyLobby(hostId, name),
    state: null,
    seq: 0,
    updatedAt: Date.now(),
  };

  return await saveRoom(newRoom);
}

export async function joinRoom(rawCode: string, peerId: string, name: string): Promise<RoomData> {
  const code = normalizeCode(rawCode);
  let room = await getRoom(code);
  if (!room) {
    return await createOrGetRoom(code, peerId, name);
  }

  // Check if player is already seated (reconnection)
  const existingSeat = room.seats.find((s) => s.peerId === peerId);
  if (existingSeat) {
    if (name && existingSeat.name !== name) {
      existingSeat.name = name;
      return await saveRoom(room);
    }
    return room;
  }

  // Find next open seat for new player
  const openSeat = room.seats.find((s) => !s.peerId && !s.isBot);
  if (openSeat) {
    openSeat.peerId = peerId;
    openSeat.name = name || "Player";
    openSeat.isBot = false;
    return await saveRoom(room);
  }

  return room;
}

export async function fillBot(rawCode: string, hostId: string): Promise<RoomData | null> {
  const code = normalizeCode(rawCode);
  const room = await getRoom(code);
  if (!room || room.hostId !== hostId) return room;

  const openSeat = room.seats.find((s) => !s.peerId && !s.isBot);
  if (openSeat) {
    openSeat.isBot = true;
    openSeat.name = botName(openSeat.seat);
    return await saveRoom(room);
  }
  return room;
}

export async function startMatch(rawCode: string, hostId: string): Promise<RoomData | null> {
  const code = normalizeCode(rawCode);
  const room = await getRoom(code);
  if (!room || room.hostId !== hostId) return room;

  // Fill remaining empty seats with bots before starting
  room.seats = room.seats.map((s, i) =>
    s.peerId || s.isBot ? s : { ...s, isBot: true, name: botName(i) },
  );

  const seed = (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0;
  room.state = createMatch(seed, 3);
  room.seq += 1;

  return await saveRoom(room);
}

export async function handleAction(
  rawCode: string,
  peerId: string,
  action: GameAction,
): Promise<{ room: RoomData | null; error?: string }> {
  const code = normalizeCode(rawCode);
  const room = await getRoom(code);
  if (!room || !room.state) return { room, error: "room or game state not found" };

  // Identify acting player seat
  const seatObj = room.seats.find((s) => s.peerId === peerId);
  const actorSeat: Seat = seatObj ? seatObj.seat : room.state.currentPlayer;

  // SERVER-SIDE VALIDATION: Check whose turn it is
  if (action.type === "playCard" || action.type === "chooseTrump") {
    if (room.state.currentPlayer !== actorSeat && !seatObj?.isBot) {
      return { room, error: "Out of turn move rejected by server" };
    }
  }

  try {
    const nextState = applyAction(room.state, action, actorSeat);
    room.state = nextState;
    room.seq += 1;
    const saved = await saveRoom(room);
    return { room: saved };
  } catch (err: any) {
    console.warn("[room.server] Illegal move rejected:", err?.message || err);
    return { room, error: err?.message || "Illegal move" };
  }
}
