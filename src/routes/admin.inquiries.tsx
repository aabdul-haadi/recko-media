import { createFileRoute } from "@tanstack/react-router";
import { InquiriesPage } from "@/components/admin/InquiriesPage";

export const Route = createFileRoute("/admin/inquiries")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    open: typeof search["open"] === "string" ? search["open"] : "",
  }),
  component: InquiriesPage,
});
