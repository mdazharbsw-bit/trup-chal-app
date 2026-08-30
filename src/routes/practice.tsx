import { createFileRoute } from "@tanstack/react-router";
import { LocalGame } from "@/components/local-game";

export const Route = createFileRoute("/practice")({ component: Practice });

function Practice() {
  return <LocalGame mode="practice" />;
}
