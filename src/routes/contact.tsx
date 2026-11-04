import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/pages/ContactPage";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact ReckoMEDIA" },
      { name: "description", content: "Start a conversation with ReckoMEDIA about your next business, brand or digital project." },
      { property: "og:title", content: "Contact ReckoMEDIA" },
      { property: "og:description", content: "Start a conversation with ReckoMEDIA about your next business, brand or digital project." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ContactPage,
});
