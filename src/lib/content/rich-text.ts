/**
 * Plain text with links: the admin writes `[these words](/services)` and the site shows "these words" as a link.
 * Nothing here is HTML. Text is always rendered as text, and an address is only linked when it is a site path,
 * #section, https/http, mailto or tel address (see isLinkableAddress).
 */
export type Segment = { type: "text"; value: string } | { type: "link"; label: string; url: string };

// [label](address): no line break or brackets in the label. The address has no spaces and may contain one level of
// balanced parentheses (for example /wiki/Page_(topic)), so a hostile address such as javascript:alert(1) is
// swallowed whole instead of leaving a stray ")" behind.
const LINK = /\[([^\][\n]{1,200})\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g;
const WHOLE_ADDRESS = /^(?:[^()\s]|\([^()\s]*\))+$/;

/** Same rule as the editor's link check: a leading "/" must not be followed by "/" or a backslash. */
export function isLinkableAddress(url: string): boolean {
  return /^(\/(?![/\\])|#|https?:\/\/|mailto:|tel:)/i.test(url.trim());
}

export function parseLinks(input: unknown): Segment[] {
  const text = typeof input === "string" ? input : "";
  const out: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, url] = match as unknown as [string, string, string];
    const start = match.index ?? 0;
    if (start > last) out.push({ type: "text", value: text.slice(last, start) });
    // An unsafe address is never linked; the words are kept as plain text.
    out.push(isLinkableAddress(url) ? { type: "link", label, url } : { type: "text", value: label });
    last = start + whole.length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}

/** The words without any link markup, for search engines, previews and summaries. */
export function stripLinks(input: unknown): string {
  return parseLinks(input)
    .map((segment) => (segment.type === "link" ? segment.label : segment.value))
    .join("");
}

/** Addresses of all links in the text that are not allowed (used to block saving them). */
export function unsafeLinkAddresses(input: unknown): string[] {
  const text = typeof input === "string" ? input : "";
  return [...text.matchAll(LINK)].map((m) => m[2]!).filter((url) => !isLinkableAddress(url));
}

/** Wraps the selected words of a text in link markup. Returns null if nothing is selected or the address is not allowed. */
export function addLink(text: string, start: number, end: number, url: string): { text: string; selectionEnd: number } | null {
  const address = url.trim();
  const words = text.slice(start, end).replace(/[\][\n]/g, " ").replace(/\s+/g, " ").trim();
  if (!words || !isLinkableAddress(address) || !WHOLE_ADDRESS.test(address)) return null;
  const markup = `[${words}](${address})`;
  return { text: text.slice(0, start) + markup + text.slice(end), selectionEnd: start + markup.length };
}
