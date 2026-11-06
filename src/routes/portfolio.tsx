import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage } from "@/components/pages/PortfolioPage";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio | ReckoMEDIA" },
      { name: "description", content: "See our past projects: web and e-commerce, social media campaigns and media buying case studies from ReckoMEDIA." },
      { property: "og:title", content: "Portfolio | ReckoMEDIA" },
      { property: "og:description", content: "See our past projects: web and e-commerce, social media campaigns and media buying case studies from ReckoMEDIA." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PortfolioPage,
});
