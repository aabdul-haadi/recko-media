import { BrandLogo } from "@/components/layout/BrandLogo";
import { ArrowUpRight } from "lucide-react";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { useSection } from "@/lib/content/content";

export function About() {
  const { data: c } = useSection("about");
  const pillars = (c["pillars"] ?? []) as { title: string; line: string }[];
  return (
    <section id="about" className="recko-story-about" aria-labelledby="recko-about-title">
      <div className="recko-story-heading">
        <div>
          <p className="recko-story-label">
            <span>04</span> {c["label"]}
          </p>
          <h2 id="recko-about-title" className="font-display">
            <SplitReveal key={c["heading_1"]} text={c["heading_1"]} />{" "}
            <SplitReveal key={c["heading_2"]} text={c["heading_2"]} />
          </h2>
        </div>
        <p className="recko-story-intro text-base leading-relaxed">{c["intro"]}</p>
      </div>

      <div className="recko-story-connection">
        <span className="recko-story-caption recko-story-idea">IDEA</span>
        <div className="recko-story-brand">
          <BrandLogo large />
        </div>
        <span className="recko-story-marker" aria-hidden="true" />
        <p className="recko-story-description text-base leading-relaxed md:text-lg">
          {c["description_1"]}
          <br />
          {c["description_2"]}{" "}
          <a href="#partnership">
            {c["link_label"]} <ArrowUpRight aria-hidden="true" />
          </a>
        </p>
        <span className="recko-story-caption recko-story-system">WORKING SYSTEM</span>
      </div>

      <ul className="recko-story-pillars">
        {pillars.map((pillar, i) => (
          <li key={`${pillar.title}-${i}`}>
            <span className="recko-story-pillar-number">{String(i + 1).padStart(2, "0")}</span>
            <span className="recko-story-pillar-title font-display">{pillar.title}</span>
            <span className="recko-story-pillar-line">{pillar.line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
