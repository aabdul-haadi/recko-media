import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "@/components/home/HomePage";
import type { SiteContent } from "@/lib/content/content";

export const Route = createFileRoute("/")({
  head: ({ matches }) => {
    const root = matches[0]?.loaderData as SiteContent | undefined;
    const seo = (root?.sections["seo"]?.data ?? {}) as Record<string, string>;
    const meta: Record<string, string>[] = [
      { title: seo["title"] ?? "ReckoMEDIA" },
      { name: "description", content: seo["description"] ?? "" },
      { property: "og:title", content: seo["og_title"] || seo["title"] || "ReckoMEDIA" },
      { property: "og:description", content: seo["og_description"] || seo["description"] || "" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (seo["og_image"]) {
      meta.push({ property: "og:image", content: seo["og_image"] });
      meta.push({ name: "twitter:image", content: seo["og_image"] });
    }
    const faq = root?.sections["faq"];
    const faqItems = ((faq?.data["items"] ?? []) as { question?: string; answer?: string }[]).filter(
      (item) => item.question?.trim() && item.answer?.trim(),
    );
    const scripts =
      faq?.enabled && faqItems.length > 0
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqItems.map((item) => ({
                  "@type": "Question",
                  name: item.question,
                  acceptedAnswer: { "@type": "Answer", text: item.answer },
                })),
              }),
            },
          ]
        : [];
    return {
      meta,
      scripts,
      links: seo["canonical"] ? [{ rel: "canonical", href: seo["canonical"] }] : [],
    };
  },
  component: HomePage,
});
