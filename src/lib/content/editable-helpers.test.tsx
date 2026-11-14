import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { ContentProvider, buildContent } from "./content";
import { mailtoHref, telHref } from "./links";
import { useNavigation } from "./nav";
import { pageHead, safeJsonLd } from "./seo";

type Row = { key: string; data: Record<string, unknown>; enabled: boolean };
const withRows = (rows: Row[]) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <ContentProvider value={buildContent(rows, null)}>{children}</ContentProvider>;
  };

describe("phone and email links", () => {
  it("turns phone numbers as people write them into tel: links", () => {
    expect(telHref("(+92) 327 2514632")).toBe("tel:+923272514632");
    expect(telHref("0327 2514632")).toBe("tel:03272514632");
    expect(telHref("call us")).toBeNull();
    expect(telHref(null)).toBeNull();
  });
  it("only links real email addresses", () => {
    expect(mailtoHref("team@socialadservices.com")).toBe("mailto:team@socialadservices.com");
    expect(mailtoHref("javascript:alert(1)")).toBeNull();
    expect(mailtoHref('a@b.co"><script>')).toBeNull();
    expect(mailtoHref("")).toBeNull();
  });
});

describe("editable menu", () => {
  it("shows the built-in menu until something is published", () => {
    const { result } = renderHook(() => useNavigation(), { wrapper: withRows([]) });
    expect(result.current.items.map((i) => i.name)).toEqual(["Home", "Our Services", "Portfolio", "About Us", "Contact Us"]);
    expect(result.current.items[0]!.index).toBe("01");
    expect(result.current.ctaLabel).toBe("Let's talk");
  });

  it("uses edited wording and links, skips blank entries and never lets an unsafe link through", () => {
    const rows: Row[] = [
      {
        key: "site_nav",
        enabled: true,
        data: {
          items: [
            { name: "Start", detail: "", url: "/" },
            { name: "  ", detail: "blank is skipped", url: "/x" },
            { name: "Evil", detail: "", url: "javascript:alert(1)" },
            { name: "Elsewhere", detail: "", url: "//evil.example" },
            { name: "Mail us", detail: "", url: "mailto:a@b.co" },
          ],
          cta_label: "Book a call",
          cta_url: "https://cal.example/me",
        },
      },
    ];
    const { result } = renderHook(() => useNavigation(), { wrapper: withRows(rows) });
    expect(result.current.items.map((i) => [i.index, i.name, i.target])).toEqual([
      ["01", "Start", "/"],
      ["02", "Evil", "/"],
      ["03", "Elsewhere", "/"],
      ["04", "Mail us", "mailto:a@b.co"],
    ]);
    expect(result.current.ctaLabel).toBe("Book a call");
    expect(result.current.ctaUrl).toBe("https://cal.example/me");
  });
});

describe("page metadata from the editor", () => {
  it("builds title, description and sharing tags, falling back to the built-in text", () => {
    const head = pageHead(undefined, { seo: "about_seo" });
    expect(head.meta[0]).toEqual({ title: "About ReckoMEDIA" });
    expect(head.meta.find((m) => m["property"] === "og:title")?.["content"]).toBe("About ReckoMEDIA");
    const edited = pageHead(
      buildContent([{ key: "about_seo", enabled: true, data: { title: "New title", description: "New text", og_image: "https://x.co/i.png" } }], null),
      { seo: "about_seo" },
    );
    expect(edited.meta[0]).toEqual({ title: "New title" });
    expect(edited.meta.some((m) => m["property"] === "og:image")).toBe(true);
  });

  it("publishes FAQ rich-result data only for answered questions, and respects the hide switch", () => {
    const faq = (enabled: boolean) =>
      buildContent([{ key: "about_faq", enabled, data: { items: [{ question: "Q1?", answer: "A1" }, { question: "Q2?", answer: "" }] } }], null);
    const on = pageHead(faq(true), { seo: "about_seo", faq: "about_faq" });
    expect(on.scripts).toHaveLength(1);
    const parsed = JSON.parse(on.scripts[0]!.children) as { mainEntity: { name: string }[] };
    expect(parsed.mainEntity.map((q) => q.name)).toEqual(["Q1?"]);
    expect(pageHead(faq(false), { seo: "about_seo", faq: "about_faq" }).scripts).toHaveLength(0);
  });

  it("edited text can never close the script tag", () => {
    const json = safeJsonLd({ text: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("</script>");
    expect(json).not.toContain("<");
    expect(JSON.parse(json).text).toBe("</script><script>alert(1)</script>");
  });
});
