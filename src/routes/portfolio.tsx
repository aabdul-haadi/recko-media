import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage } from "@/components/pages/PortfolioPage";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio | ReckoMEDIA" },
      { name: "description", content: "Explore selected creative, digital, growth and technology capabilities from ReckoMEDIA." },
      { property: "og:title", content: "Portfolio | ReckoMEDIA" },
      { property: "og:description", content: "Explore selected creative, digital, growth and technology capabilities from ReckoMEDIA." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PortfolioPage,
});
