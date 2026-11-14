import { createFileRoute, redirect } from "@tanstack/react-router";

// The editor now covers more than the home page. Old bookmarks and links keep working.
export const Route = createFileRoute("/admin/homepage")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/content" });
  },
});
