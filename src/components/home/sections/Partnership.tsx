import { ArrowUpRight, Plus } from "lucide-react";
import { partnershipItems } from "@/data/home";
import { SplitReveal } from "@/components/motion/SplitReveal";

export function Partnership() {
  return (
    <section
      id="partnership"
      className="recko-story-partnership"
      aria-labelledby="recko-partnership-title"
    >
      <div className="recko-story-partnership-heading">
        <p className="recko-story-label">
          <i aria-hidden="true" /> GROWTH PARTNERSHIPS / AN ONGOING ENGAGEMENT
        </p>
        <h2 id="recko-partnership-title" className="font-display">
          <span>
            <SplitReveal text="One team." />
          </span>
          <span>
            <SplitReveal text="Built around" />
          </span>
          <span>
            <SplitReveal text="your business." />
          </span>
        </h2>
      </div>
      <div className="recko-story-partnership-content">
        <span className="recko-story-marker recko-story-marker-small" aria-hidden="true" />
        <p className="recko-story-partnership-copy text-base leading-relaxed md:text-lg">
          An ongoing partnership bringing strategy, creative, marketing, and technology
          together—from setting priorities to building, launching, and improving.
        </p>
        <ul className="recko-story-activities">
          {partnershipItems.map((item) => (
            <li key={item} className="text-sm">
              <Plus aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <a className="recko-story-cta text-sm font-semibold" href="#contact">
          <span>Let’s talk about your business</span>
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
