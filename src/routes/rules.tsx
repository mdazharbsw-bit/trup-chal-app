import { createFileRoute } from "@tanstack/react-router";
import { RulesContent } from "@/components/rules-content";

export const Route = createFileRoute("/rules")({ component: Rules });

function Rules() {
  return <RulesContent />;
}
