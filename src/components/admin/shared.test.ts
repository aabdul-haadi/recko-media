import { describe, expect, it } from "vitest";
import { URL_PATTERN } from "./FieldEditor";
import { csvCell, fromLocalInput, safeHttpUrl, toLocalInput } from "./shared";

describe("admin helpers", () => {
  it("quotes CSV cells and escapes embedded quotes", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell(null)).toBe('""');
  });
  it("neutralises spreadsheet formula injection", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("+1 555")).toBe('"\'+1 555"');
  });
  it("only allows plain http(s) URLs in links (blocks javascript:, data:, vbscript:)", () => {
    expect(safeHttpUrl("https://reckomedia.com/contact")).toBe("https://reckomedia.com/contact");
    expect(safeHttpUrl("javascript:alert(document.cookie)")).toBeNull();
    expect(safeHttpUrl("  JaVaScRiPt:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeHttpUrl("vbscript:msgbox(1)")).toBeNull();
    expect(safeHttpUrl("//evil.example")).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
    expect(safeHttpUrl(42)).toBeNull();
  });
  it("round-trips datetime-local values", () => {
    const iso = new Date(2026, 10, 4, 9, 30).toISOString();
    expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
    expect(fromLocalInput("")).toBeNull();
  });
  it("editor link check accepts real targets and rejects //host, backslash-host and script URLs", () => {
    for (const ok of ["/contact", "#faq", "https://a.co", "mailto:a@b.co", "tel:+1555"]) expect(URL_PATTERN.test(ok)).toBe(true);
    for (const bad of ["//evil.example", "/\\evil.example", "javascript:alert(1)", "ftp://x", "evil.example"]) expect(URL_PATTERN.test(bad)).toBe(false);
  });
});
