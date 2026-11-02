import { partnershipItems } from "@/data/home";
import { CursorTrail } from "@/components/motion/CursorTrail";
import { Reveal, SplitReveal } from "@/components/motion/SplitReveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Plus } from "lucide-react";

const trailImages = [
  "/thumbs/work-dashboard.jpg",
  "/thumbs/work-snack.jpg",
  "/thumbs/work-fashion.jpg",
  "/thumbs/work-robot.jpg",
];

export function Partnership() {
  return (
    <section id="about" className="relative overflow-hidden border-t border-border">
      <CursorTrail images={trailImages} />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
        <div className="grid gap-14 md:grid-cols-2 md:gap-10">
          <div>
            <Reveal>
              <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Working system — Growth partnerships
              </p>
              <p className="mb-10 text-xs uppercase tracking-[0.2em] text-muted-foreground/70">
                An ongoing engagement
              </p>
            </Reveal>
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              <SplitReveal text="One team." /> <SplitReveal text="Built around" />{" "}
              <SplitReveal text="your business." />
            </h2>
          </div>

          <div className="flex flex-col justify-end gap-8">
            <Reveal delay={120}>
              <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
                An ongoing partnership bringing strategy, creative, marketing, and technology
                together — from setting priorities to building, launching, and improving.
              </p>
            </Reveal>

            <Reveal delay={220}>
              <ul className="grid max-w-md grid-cols-2 gap-x-6 gap-y-3">
                {partnershipItems.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground/90">
                    <Plus className="size-3.5 text-acid" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={300}>
              <ArrowLink href="#contact">Let's talk about your business</ArrowLink>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
