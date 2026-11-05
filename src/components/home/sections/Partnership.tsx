import { ArrowUpRight, Plus } from "lucide-react";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { safeUrl, useSection } from "@/lib/content/content";

export function Partnership() {
  const { data: c } = useSection("partnership");
  const items = (c["items"] ?? []) as string[];
  return (
    <section
      id="partnership"
      className="recko-story-partnership"
      aria-labelledby="recko-partnership-title"
    >
      <div className="recko-story-partnership-heading">
        <p className="recko-story-label">
          <i aria-hidden="true" /> {c["label"]}
        </p>
        <h2 id="recko-partnership-title" className="font-display">
          {(["heading_1", "heading_2", "heading_3"] as const).map((key) => (
            <span key={key}>
              <SplitReveal key={c[key]} text={c[key]} />
            </span>
          ))}
        </h2>
      </div>
      <div className="recko-story-partnership-content">
        <span className="recko-story-marker recko-story-marker-small" aria-hidden="true" />
        <p className="recko-story-partnership-copy text-base leading-relaxed md:text-lg">
          {c["copy"]}
        </p>
        <ul className="recko-story-activities">
          {items.map((item, i) => (
            <li key={`${item}-${i}`} className="text-sm">
              <Plus aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <a className="recko-story-cta text-sm font-semibold" href={safeUrl(c["cta_url"], "#contact")}>
          <span>{c["cta_label"]}</span>
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
