import { BrandLogo } from "@/components/layout/BrandLogo";
import { ArrowUpRight } from "lucide-react";
import { SplitReveal } from "@/components/motion/SplitReveal";

const pillars = [
  { number: "01", title: "Creative", line: "Brands, content and social presence people remember." },
  { number: "02", title: "Marketing", line: "Campaigns and search that turn attention into customers." },
  { number: "03", title: "Technology", line: "Websites, stores and automation that keep it all running." },
];

export function About() {
  return (
    <section id="about" className="recko-story-about" aria-labelledby="recko-about-title">
      <div className="recko-story-heading">
        <div>
          <p className="recko-story-label">
            <span>04</span> ABOUT RECKOMEDIA
          </p>
          <h2 id="recko-about-title" className="font-display">
            <SplitReveal text="One connected path." /> <SplitReveal text="From idea to impact." />
          </h2>
        </div>
        <p className="recko-story-intro text-base leading-relaxed">
          ReckoMEDIA connects creative, marketing and technology around your business.
        </p>
      </div>

      <div className="recko-story-connection">
        <span className="recko-story-caption recko-story-idea">IDEA</span>
        <div className="recko-story-brand">
          <BrandLogo large />
        </div>
        <span className="recko-story-marker" aria-hidden="true" />
        <p className="recko-story-description text-base leading-relaxed md:text-lg">
          From building a recognizable brand to producing engaging content, launching campaigns
          and developing digital platforms, we bring the pieces together to create meaningful
          growth.
          <br />
          We believe good marketing should be more than visibility. It should create stronger
          customer relationships, better experiences and real opportunities.{" "}
          <a href="#partnership">
            Meet ReckoMEDIA <ArrowUpRight aria-hidden="true" />
          </a>
        </p>
        <span className="recko-story-caption recko-story-system">WORKING SYSTEM</span>
      </div>

      <ul className="recko-story-pillars">
        {pillars.map((pillar) => (
          <li key={pillar.number}>
            <span className="recko-story-pillar-number">{pillar.number}</span>
            <span className="recko-story-pillar-title font-display">{pillar.title}</span>
            <span className="recko-story-pillar-line">{pillar.line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
