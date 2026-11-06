import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/pages/ContactPage";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact ReckoMEDIA" },
      { name: "description", content: "Reach out to ReckoMEDIA to grow your online presence. Social media advertising, SEO and web design from Karachi." },
      { property: "og:title", content: "Contact ReckoMEDIA" },
      { property: "og:description", content: "Reach out to ReckoMEDIA to grow your online presence. Social media advertising, SEO and web design from Karachi." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ContactPage,
});
