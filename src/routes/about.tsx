import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/AboutPage";
import type { SiteContent } from "@/lib/content/content";
import { pageHead } from "@/lib/content/seo";

export const Route = createFileRoute("/about")({
  // Title, description and FAQ rich results come from Admin > Pages & content > About page.
  head: ({ matches }) => pageHead(matches[0]?.loaderData as SiteContent | undefined, { seo: "about_seo", faq: "about_faq" }),
  component: AboutPage,
});
