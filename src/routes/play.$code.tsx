import { createFileRoute } from "@tanstack/react-router";
import { OnlineTable } from "@/components/online-table";
import { normalizeCode } from "@/lib/names";

export const Route = createFileRoute("/play/$code")({
  validateSearch: (search: Record<string, unknown>): { host: boolean } => ({
    host: search.host === true || search.host === "true" || search.host === 1 || search.host === "1",
  }),
  component: Play,
});

function Play() {
  const { code } = Route.useParams();
  const { host } = Route.useSearch();
  const id = normalizeCode(code);
  return <OnlineTable key={id} code={id} isCreator={host} />;
}
