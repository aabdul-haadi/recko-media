import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Recko Media" },
      { name: "description", content: "Meet Recko Media: a connected creative, growth and technology team built around your business." },
      { property: "og:title", content: "About Recko Media" },
      { property: "og:description", content: "Meet Recko Media: a connected creative, growth and technology team built around your business." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AboutPage,
});
