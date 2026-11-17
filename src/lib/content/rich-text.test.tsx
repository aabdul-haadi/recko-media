import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { RichText } from "@/components/ui/RichText";
import { FieldEditor, findInvalidUrl } from "@/components/admin/FieldEditor";
import { addLink, isLinkableAddress, parseLinks, stripLinks, unsafeLinkAddresses } from "./rich-text";
import { pageHead } from "./seo";
import { buildContent } from "./content";
import type { Field } from "./schema";

afterEach(cleanup);

describe("links inside text", () => {
  it("splits text into words and links", () => {
    expect(parseLinks("Read our [services page](/services) or [email us](mailto:a@b.co) today.")).toEqual([
      { type: "text", value: "Read our " },
      { type: "link", label: "services page", url: "/services" },
      { type: "text", value: " or " },
      { type: "link", label: "email us", url: "mailto:a@b.co" },
      { type: "text", value: " today." },
    ]);
    expect(parseLinks("No links here.")).toEqual([{ type: "text", value: "No links here." }]);
    expect(parseLinks(undefined)).toEqual([]);
  });

  it("keeps the words but never links an unsafe address", () => {
    for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "//evil.example", "/\\evil.example", "ftp://x.co", "evil.example"]) {
      expect(parseLinks(`See [the words](${bad}) now`), bad).toEqual([
        { type: "text", value: "See " },
        { type: "text", value: "the words" },
        { type: "text", value: " now" },
      ]);
      expect(isLinkableAddress(bad), bad).toBe(false);
    }
    expect(unsafeLinkAddresses("[a](/ok) [b](javascript:alert(1)) [c](//evil.example)")).toEqual(["javascript:alert(1)", "//evil.example"]);
  });

  it("strips link markup down to the words for search engines", () => {
    expect(stripLinks("Visit [our portfolio](/portfolio) or [call](tel:+923001234567).")).toBe("Visit our portfolio or call.");
  });

  it("adds a link around the selected words only", () => {
    const text = "We build websites and run ads.";
    const start = text.indexOf("websites");
    const result = addLink(text, start, start + "websites".length, "/services")!;
    expect(result.text).toBe("We build [websites](/services) and run ads.");
    expect(stripLinks(result.text)).toBe(text);
    expect(addLink(text, 3, 3, "/services")).toBeNull(); // nothing selected
    expect(addLink(text, 0, 2, "javascript:alert(1)")).toBeNull(); // unsafe
    expect(addLink(text, 0, 2, "//evil.example")).toBeNull();
    expect(addLink(text, 0, 2, "/has space")).toBeNull();
    expect(addLink("a [b] c", 0, 7, "/x")!.text).toBe("[a b c](/x)"); // brackets in the words cannot break the markup
  });
});

describe("RichText", () => {
  it("renders safe links as links and everything else as plain text", () => {
    render(
      <p>
        <RichText text={'Go to [services](/services), [Google](https://google.com), [bad](javascript:alert(1)) and <b>not bold</b>.'} />
      </p>,
    );
    expect(screen.getByRole("link", { name: "services" })).toHaveAttribute("href", "/services");
    const external = screen.getByRole("link", { name: "Google" });
    expect(external).toHaveAttribute("href", "https://google.com");
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByRole("link", { name: "bad" })).toBeNull();
    expect(screen.getByText(/bad and <b>not bold<\/b>\./)).toBeInTheDocument(); // markup is shown as text, never executed
    expect(document.querySelector("b")).toBeNull();
  });
});

describe("editor integration", () => {
  const field: Field = { name: "answer", label: "Answer", type: "textarea", max: 1000, links: true };

  it("shows the link tool only for text boxes that allow links", () => {
    render(<FieldEditor idPrefix="t" field={field} value="Plain answer" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /link selected words/i })).toBeInTheDocument();
    cleanup();
    render(<FieldEditor idPrefix="t" field={{ name: "x", label: "X", type: "textarea", max: 10 }} value="" onChange={() => {}} />);
    expect(screen.queryByRole("button", { name: /link selected words/i })).toBeNull();
  });

  it("blocks saving a section whose link addresses are unsafe", () => {
    const fields: Field[] = [{ name: "items", label: "Questions", type: "list", itemLabel: "Question", fields: [field] }];
    expect(findInvalidUrl(fields, { items: [{ answer: "See [us](/about)" }] })).toBeNull();
    expect(findInvalidUrl(fields, { items: [{ answer: "See [us](javascript:alert(1))" }] })).toBe("Answer");
  });
});

describe("search engine data", () => {
  it("FAQ rich results contain the words, not the link markup", () => {
    const content = buildContent(
      [{ key: "about_faq", enabled: true, data: { items: [{ question: "Where?", answer: "On our [contact page](/contact)." }] } }],
      null,
    );
    const head = pageHead(content, { seo: "about_seo", faq: "about_faq" });
    const parsed = JSON.parse(head.scripts[0]!.children) as { mainEntity: { acceptedAnswer: { text: string } }[] };
    expect(parsed.mainEntity[0]!.acceptedAnswer.text).toBe("On our contact page.");
  });
});
