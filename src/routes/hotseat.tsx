import { createFileRoute } from "@tanstack/react-router";
import { LocalGame } from "@/components/local-game";

export const Route = createFileRoute("/hotseat")({ component: Hotseat });

function Hotseat() {
  return <LocalGame mode="hotseat" />;
}
