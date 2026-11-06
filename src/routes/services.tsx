import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/components/pages/ServicesPage";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services at ReckoMEDIA" },
      { name: "description", content: "Social media advertising, SEO, search engine marketing and web design from ReckoMEDIA, built to grow your business." },
      { property: "og:title", content: "Services at ReckoMEDIA" },
      { property: "og:description", content: "Social media advertising, SEO, search engine marketing and web design from ReckoMEDIA, built to grow your business." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ServicesPage,
});
