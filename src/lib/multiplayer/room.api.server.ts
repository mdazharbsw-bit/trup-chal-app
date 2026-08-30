import {
  createOrGetRoom,
  fillBot,
  getRoom,
  handleAction,
  joinRoom,
  startMatch,
} from "./room.server";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export async function handleRoomApi(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const code = url.searchParams.get("code");
      const peerId = url.searchParams.get("peerId");
      const name = url.searchParams.get("name") ?? "";
      const isCreator = url.searchParams.get("host") === "1";

      if (!code || !peerId) return json({ error: "missing code or peerId" }, 400);

      let room = isCreator
        ? await createOrGetRoom(code, peerId, name)
        : await joinRoom(code, peerId, name);

      return json({ room });
    }

    if (request.method === "POST") {
      let body: any;
      try {
        body = await request.json();
      } catch {
        return json({ error: "invalid JSON" }, 400);
      }

      const { op, code, peerId, name, action } = body || {};
      if (!code || !peerId) return json({ error: "missing code or peerId" }, 400);

      let room = null;
      let error = undefined;

      if (op === "create") {
        room = await createOrGetRoom(code, peerId, name);
      } else if (op === "join") {
        room = await joinRoom(code, peerId, name);
      } else if (op === "fill_bot") {
        room = await fillBot(code, peerId);
      } else if (op === "start") {
        room = await startMatch(code, peerId);
      } else if (op === "act" && action) {
        const res = await handleAction(code, peerId, action);
        room = res.room;
        error = res.error;
      } else {
        room = await getRoom(code);
      }

      if (error) {
        return json({ error, room }, 400);
      }

      return json({ room });
    }

    return json({ error: "method not allowed" }, 405);
  } catch (err) {
    console.error("[room api] error:", err);
    return json({ error: "server error" }, 500);
  }
}
