import { createFileRoute } from "@tanstack/react-router";
import { Studio } from "@/components/studio";

type Search = { overlay: boolean };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    overlay: search.overlay === "1" || search.overlay === 1 || search.overlay === true || search.overlay === "true",
  }),
  component: Home,
});

function Home() {
  const { overlay } = Route.useSearch();
  return <Studio overlay={overlay} />;
}
