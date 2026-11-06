import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ReckoMEDIA" },
      { name: "description", content: "About ReckoMEDIA: your trusted partner in digital marketing. Personalized strategies, data-driven campaigns and reliable execution." },
      { property: "og:title", content: "About ReckoMEDIA" },
      { property: "og:description", content: "About ReckoMEDIA: your trusted partner in digital marketing. Personalized strategies, data-driven campaigns and reliable execution." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AboutPage,
});
