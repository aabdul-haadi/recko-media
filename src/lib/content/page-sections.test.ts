import { describe, expect, it } from "vitest";
import { menuLinks } from "@/data/home";
import { URL_PATTERN } from "@/components/admin/FieldEditor";
import { EDITOR_PAGES, EXTRA_DEFAULTS, EXTRA_SECTIONS } from "./page-sections";
import { contentDefaults, sectionDefs, type Field } from "./schema";

const KEY = /^[a-z0-9_]{1,50}$/; // the database accepts exactly this for content keys

function walk(fields: Field[], visit: (field: Field) => void) {
  for (const field of fields) {
    visit(field);
    if (field.type === "list") walk(field.fields, visit);
  }
}

describe("editable sections", () => {
  it("every section key is unique and accepted by the database", () => {
    const keys = sectionDefs.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key, key).toMatch(KEY);
  });

  it("every section belongs to a registered page, and every page has sections", () => {
    const pages = new Set(EDITOR_PAGES.map((p) => p.id));
    for (const def of sectionDefs) expect(pages.has(def.page ?? "home"), def.key).toBe(true);
    for (const page of EDITOR_PAGES) {
      expect(
        sectionDefs.some((s) => (s.page ?? "home") === page.id),
        page.id,
      ).toBe(true);
      expect(page.path.startsWith("/")).toBe(true);
    }
  });

  it("every new section has built-in wording that matches exactly the fields the editor offers", () => {
    for (const def of EXTRA_SECTIONS) {
      const defaults = contentDefaults[def.key];
      expect(defaults, `${def.key} has no defaults`).toBeDefined();
      const names = def.fields.map((f) => f.name);
      expect(new Set(names).size, `${def.key} repeats a field name`).toBe(names.length);
      expect(Object.keys(defaults!).sort(), def.key).toEqual([...names].sort());
    }
    for (const def of sectionDefs) expect(contentDefaults[def.key], `${def.key} has no defaults`).toBeDefined();
  });

  it("text fields have a length limit, and the built-in wording fits within it", () => {
    for (const def of EXTRA_SECTIONS) {
      const check = (fields: Field[], data: Record<string, unknown>, where: string) => {
        for (const field of fields) {
          const value = data[field.name];
          if (field.type === "text" || field.type === "textarea") {
            expect(field.max, `${where}.${field.name} has no max`).toBeGreaterThan(0);
            expect(String(value ?? "").length, `${where}.${field.name} is longer than its limit`).toBeLessThanOrEqual(field.max!);
          }
          if (field.type === "list") {
            expect(Array.isArray(value), `${where}.${field.name} should be a list`).toBe(true);
            expect((value as unknown[]).length).toBeLessThanOrEqual(field.max ?? 50);
            (value as Record<string, unknown>[]).forEach((item, i) => check(field.fields, item, `${where}.${field.name}[${i}]`));
          }
        }
      };
      check(def.fields, EXTRA_DEFAULTS[def.key]!, def.key);
    }
  });

  it("built-in link addresses are valid and safe, and links are editable in many places", () => {
    let urlFields = 0;
    for (const def of EXTRA_SECTIONS) {
      walk(def.fields, (f) => {
        if (f.type === "url") urlFields++;
      });
      const scan = (fields: Field[], data: Record<string, unknown>) => {
        for (const field of fields) {
          if (field.type === "url") {
            const v = String(data[field.name] ?? "");
            if (v) expect(URL_PATTERN.test(v), `${def.key}.${field.name}: ${v}`).toBe(true);
          }
          if (field.type === "list") for (const item of data[field.name] as Record<string, unknown>[]) scan(field.fields, item);
        }
      };
      scan(def.fields, EXTRA_DEFAULTS[def.key]!);
    }
    expect(urlFields).toBe(8); // menu link, header button, story link, banner button, FAQ link, WhatsApp, two share images
  });

  it("the About FAQ keeps its five questions and the single answer the old page had", () => {
    const items = EXTRA_DEFAULTS["about_faq"]!["items"] as { question: string; answer: string }[];
    expect(items).toHaveLength(5);
    expect(items.filter((i) => i.answer.trim())).toHaveLength(1);
    expect(items[3]!.answer.length).toBeGreaterThan(100);
  });

  it("the menu defaults match the menu the site had before it became editable", () => {
    const items = EXTRA_DEFAULTS["site_nav"]!["items"] as { name: string; detail: string; url: string }[];
    expect(items.map((i) => [i.name, i.url])).toEqual(menuLinks.map((m) => [m.name, m.target]));
  });

  it("the home page FAQ is an editable section with questions, answers and a link", () => {
    const faq = sectionDefs.find((s) => s.key === "faq")!;
    expect(faq.page).toBe("home");
    expect(faq.fields.map((f) => f.name)).toEqual(expect.arrayContaining(["eyebrow", "heading", "intro", "items", "cta_label", "cta_url"]));
  });
});
