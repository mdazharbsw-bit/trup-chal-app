import { createFileRoute } from "@tanstack/react-router";
import { handleRoomApi } from "@/lib/multiplayer/room.api.server";

const handle = ({ request }: { request: Request }) => handleRoomApi(request);

export const Route = createFileRoute("/api/room")({
  server: { handlers: { GET: handle, POST: handle } },
});
