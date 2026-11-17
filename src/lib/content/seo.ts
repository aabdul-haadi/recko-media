import { stripLinks } from "./rich-text";
import { contentDefaults } from "./schema";
import type { SiteContent } from "./content";

type Meta = Record<string, string>;

const LINE_SEPARATORS = new RegExp(`[${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`, "g");

/** JSON for a <script type="application/ld+json">: "<" is escaped so edited text can never close the script tag. */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(LINE_SEPARATORS, (ch) => "\\u" + ch.charCodeAt(0).toString(16));
}

/**
 * Page <head> content from an editable "<page>_seo" section, plus optional FAQ rich-result data from an
 * editable FAQ section. `root` is the site content loaded by the root route.
 */
export function pageHead(root: SiteContent | undefined, opts: { seo: string; faq?: string }) {
  const seo = (root?.sections[opts.seo]?.data ?? contentDefaults[opts.seo] ?? {}) as Record<string, string>;
  const title = seo["title"] || "ReckoMEDIA";
  const description = seo["description"] || "";
  const meta: Meta[] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
  ];
  if (seo["og_image"]) {
    meta.push({ property: "og:image", content: seo["og_image"] }, { name: "twitter:image", content: seo["og_image"] });
  }
  const faq = opts.faq ? root?.sections[opts.faq] : undefined;
  const faqItems = ((faq?.data["items"] ?? []) as { question?: string; answer?: string }[]).filter(
    (item) => item.question?.trim() && item.answer?.trim(),
  );
  const scripts =
    faq?.enabled && faqItems.length > 0
      ? [
          {
            type: "application/ld+json",
            children: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: stripLinks(item.answer) },
              })),
            }),
          },
        ]
      : [];
  return { meta, scripts };
}
