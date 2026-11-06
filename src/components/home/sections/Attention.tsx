import { Reveal, SplitReveal } from "@/components/motion/SplitReveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { safeUrl, useSection } from "@/lib/content/content";

export function Attention() {
  const { data: c } = useSection("attention");
  return (
    <section className="recko-attention relative overflow-hidden border-t border-border py-14 md:py-20">
      <div className="recko-attention-grid" aria-hidden="true" />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[1.2fr_1fr] md:px-10">
        <h2 className="font-display">
          <SplitReveal key={c["heading_1"]} text={c["heading_1"]} />
          <span className="block">
            <SplitReveal key={c["heading_2"]} text={c["heading_2"]} charClassName="text-grain" />
          </span>
        </h2>

        <div className="flex flex-col justify-end items-start gap-8">
          <Reveal delay={120}>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              {c["text"]}
            </p>
          </Reveal>
          <Reveal delay={220}>
            <ArrowLink variant="ghost" href={safeUrl(c["cta_url"], "/about")}>
              {c["cta_label"]}
            </ArrowLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
