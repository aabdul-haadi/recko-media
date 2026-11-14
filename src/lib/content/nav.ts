import { safeUrl, useSection } from "./content";

export type NavItem = { index: string; name: string; detail: string; target: string };

/** The editable menu (Admin > Pages & content > Menu & footer). Blank entries are skipped; links are always sanitised. */
export function useNavigation(): { items: NavItem[]; ctaLabel: string; ctaUrl: string } {
  const { data } = useSection("site_nav");
  const raw = Array.isArray(data["items"]) ? (data["items"] as Record<string, unknown>[]) : [];
  const items = raw
    .filter((item) => typeof item?.["name"] === "string" && String(item["name"]).trim() !== "")
    .map((item, i) => ({
      index: String(i + 1).padStart(2, "0"),
      name: String(item["name"]).trim(),
      detail: typeof item["detail"] === "string" ? item["detail"] : "",
      target: safeUrl(item["url"], "/"),
    }));
  const ctaLabel = typeof data["cta_label"] === "string" ? data["cta_label"].trim() : "";
  return { items, ctaLabel, ctaUrl: safeUrl(data["cta_url"], "/contact") };
}
