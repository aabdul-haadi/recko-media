import { createFileRoute } from "@tanstack/react-router";
import { ContactsPage } from "@/components/admin/ContactsPage";

export const Route = createFileRoute("/admin/contacts")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  component: ContactsPage,
});
