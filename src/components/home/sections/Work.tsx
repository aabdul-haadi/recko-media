import { Marquee } from "@/components/motion/Marquee";
import { Reveal, SplitReveal } from "@/components/motion/SplitReveal";
import { ArrowLink } from "@/components/ui/ArrowLink";

const rowA = [
  { src: "/thumbs/work-dashboard.jpg", alt: "Analytics dashboard project preview" },
  { src: "/thumbs/work-snack.jpg", alt: "Snack brand campaign preview" },
  { src: "/thumbs/work-fashion.jpg", alt: "Fashion campaign preview" },
  { src: "/thumbs/work-robot.jpg", alt: "Consumer robot product preview" },
];
const categories = [
  "Web & E-commerce",
  "Social Media Campaigns",
  "Media Buying Case Studies",
  "Content Production",
];
const rowB = [...rowA].reverse();

export function Work() {
  return (
    <section
      id="work"
      className="relative overflow-hidden border-t border-border bg-background py-24 md:py-32"
    >
      <div className="mx-auto mb-14 max-w-7xl px-5 md:mb-20 md:px-10">
        <Reveal>
          <p className="recko-brand-label mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Our work
          </p>
        </Reveal>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display">
            <SplitReveal text="See what we’ve been building." />
          </h2>
          <div className="flex flex-col items-start gap-5 md:items-end">
            <Reveal delay={120}>
              <div className="max-w-md space-y-4 text-sm text-muted-foreground md:text-right">
                <p>
                  From memorable brand campaigns to digital experiences and performance driven
                  marketing, explore the work we’ve created for businesses across different
                  industries.
                </p>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 md:justify-end">
                  {categories.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <ArrowLink variant="ghost" href="#contact">
                Explore our portfolio
              </ArrowLink>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        <Marquee images={rowA} duration="52s" />
        <Marquee images={rowB} duration="64s" reverse />
      </div>
    </section>
  );
}
