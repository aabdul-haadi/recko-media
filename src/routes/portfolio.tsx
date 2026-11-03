import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage } from "@/components/pages/PortfolioPage";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio | Recko Media" },
      { name: "description", content: "Explore selected creative, digital, growth and technology capabilities from Recko Media." },
      { property: "og:title", content: "Portfolio | Recko Media" },
      { property: "og:description", content: "Explore selected creative, digital, growth and technology capabilities from Recko Media." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PortfolioPage,
});
