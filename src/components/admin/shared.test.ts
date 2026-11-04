import { describe, expect, it } from "vitest";
import { csvCell, fromLocalInput, toLocalInput } from "./shared";

describe("admin helpers", () => {
  it("quotes CSV cells and escapes embedded quotes", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell(null)).toBe('""');
  });
  it("neutralises spreadsheet formula injection", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("+1 555")).toBe('"\'+1 555"');
  });
  it("round-trips datetime-local values", () => {
    const iso = new Date(2026, 10, 4, 9, 30).toISOString();
    expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
    expect(fromLocalInput("")).toBeNull();
  });
});
