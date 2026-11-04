import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ReckoMEDIA" },
      { name: "description", content: "Meet ReckoMEDIA: a connected creative, growth and technology team built around your business." },
      { property: "og:title", content: "About ReckoMEDIA" },
      { property: "og:description", content: "Meet ReckoMEDIA: a connected creative, growth and technology team built around your business." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AboutPage,
});
