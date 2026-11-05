import { Marquee } from "@/components/motion/Marquee";
import { Reveal, SplitReveal } from "@/components/motion/SplitReveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { safeUrl, useSection } from "@/lib/content/content";

const rowA = [
  { src: "/thumbs/work-dashboard.jpg", alt: "Analytics dashboard project preview" },
  { src: "/thumbs/work-snack.jpg", alt: "Snack brand campaign preview" },
  { src: "/thumbs/work-fashion.jpg", alt: "Fashion campaign preview" },
  { src: "/thumbs/work-robot.jpg", alt: "Consumer robot product preview" },
];
const rowB = [...rowA].reverse();

export function Work() {
  const { data: c } = useSection("work");
  const categories = (c["categories"] ?? []) as string[];
  return (
    <section
      id="work"
      className="relative overflow-hidden border-t border-border bg-background py-24 md:py-32"
    >
      <div className="mx-auto mb-14 max-w-7xl px-5 md:mb-20 md:px-10">
        <Reveal>
          <p className="recko-brand-label mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {c["eyebrow"]}
          </p>
        </Reveal>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display">
            <SplitReveal key={c["heading"]} text={c["heading"]} />
          </h2>
          <div className="flex flex-col items-start gap-5 md:items-end">
            <Reveal delay={120}>
              <div className="max-w-md space-y-4 text-sm text-muted-foreground md:text-right">
                <p>{c["description"]}</p>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 md:justify-end">
                  {categories.map((name, i) => (
                    <li key={`${name}-${i}`}>{name}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <ArrowLink variant="ghost" href={safeUrl(c["cta_url"], "/portfolio")}>
                {c["cta_label"]}
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
