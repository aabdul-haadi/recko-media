import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/pages/ContactPage";
import type { SiteContent } from "@/lib/content/content";
import { pageHead } from "@/lib/content/seo";

export const Route = createFileRoute("/contact")({
  // Title and description come from Admin > Pages & content > Contact page.
  head: ({ matches }) => pageHead(matches[0]?.loaderData as SiteContent | undefined, { seo: "contact_seo" }),
  component: ContactPage,
});
