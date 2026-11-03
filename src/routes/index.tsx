import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "@/components/home/HomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recko Media — Web Design, AI Automation & Digital Marketing" },
      {
        name: "description",
        content:
          "Growth systems that move revenue. Web design, AI automation and digital marketing built together for your business.",
      },
      {
        property: "og:title",
        content: "Recko Media — Web Design, AI Automation & Digital Marketing",
      },
      {
        property: "og:description",
        content:
          "Growth systems that move revenue. Web design, AI automation and digital marketing built together.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});
