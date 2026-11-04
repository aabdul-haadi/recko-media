import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/components/pages/ServicesPage";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services at ReckoMEDIA" },
      { name: "description", content: "Creative, growth and technology services from ReckoMEDIA, designed to work together." },
      { property: "og:title", content: "Services at ReckoMEDIA" },
      { property: "og:description", content: "Creative, growth and technology services from ReckoMEDIA, designed to work together." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ServicesPage,
});
