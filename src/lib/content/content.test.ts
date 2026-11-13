import { describe, expect, it } from "vitest";
import { buildContent, fallbackContent, safeUrl } from "./content";
import { contentDefaults, defaultServices } from "./schema";

describe("site content", () => {
  it("falls back to built-in copy and services when nothing is published", () => {
    expect(fallbackContent.sections["hero"]!.data).toEqual(contentDefaults["hero"]);
    expect(fallbackContent.services).toEqual(defaultServices);
    expect(fallbackContent.services).toHaveLength(9);
  });
  it("overlays published values on defaults and keeps missing fields", () => {
    const content = buildContent(
      [{ key: "hero", data: { headline_1: "New headline" }, enabled: true }],
      [],
    );
    expect(content.sections["hero"]!.data["headline_1"]).toBe("New headline");
    expect(content.sections["hero"]!.data["headline_2"]).toBe(
      contentDefaults["hero"]!["headline_2"],
    );
  });
  it("respects disabled sections and an intentionally empty services list", () => {
    const content = buildContent([{ key: "work", data: {}, enabled: false }], []);
    expect(content.sections["work"]!.enabled).toBe(false);
    expect(content.services).toEqual([]);
  });
  it("only allows safe link targets", () => {
    expect(safeUrl("javascript:alert(1)", "#x")).toBe("#x");
    expect(safeUrl("data:text/html,hi", "#x")).toBe("#x");
    expect(safeUrl("/contact")).toBe("/contact");
    expect(safeUrl("https://example.com")).toBe("https://example.com");
    expect(safeUrl("mailto:a@b.co")).toBe("mailto:a@b.co");
  });
});

describe("safeUrl", () => {
  it("keeps same-site paths, anchors, web, mail and phone links", () => {
    for (const ok of ["/contact", "#top", "https://example.com/a", "http://example.com", "mailto:a@b.co", "tel:+923001234567"]) {
      expect(safeUrl(ok, "X")).toBe(ok);
    }
  });
  it("rejects script URLs and protocol-relative links that would leave the site", () => {
    for (const bad of ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "data:text/html,x", "//evil.example/x", "/\\evil.example", "\\\\evil.example", "", null, 5]) {
      expect(safeUrl(bad, "X")).toBe("X");
    }
  });
});
