import "./hero-background.css";
import { SplitReveal, Reveal } from "@/components/motion/SplitReveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { ArrowDown } from "lucide-react";
import { useSection, safeUrl } from "@/lib/content/content";

export function Hero() {
  const { data: c } = useSection("hero");
  return (
    <section id="top" className="recko-hero relative flex min-h-[34rem] flex-col overflow-hidden">
      <div className="recko-hero-atmosphere" aria-hidden="true">
        <div className="recko-hero-halo" />
        <div className="recko-hero-dust recko-hero-dust-far" />
        <div className="recko-hero-dust recko-hero-dust-near" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-16 pt-36 md:px-10 md:pt-40">
        <Reveal>
          <p className="recko-brand-label mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground md:mb-8 md:text-xs">
            {c["label"]}
          </p>
        </Reveal>

        <div className="relative w-fit max-w-full">
          <h1 className="relative z-10 font-display">
            <SplitReveal
              key={c["headline_1"]}
              text={c["headline_1"]}
              immediate
              delay={0}
              stagger={0.006}
              className="block"
            />
            <span className="block">
              <SplitReveal
                key={c["headline_2"]}
                text={c["headline_2"]}
                immediate
                delay={0.06}
                stagger={0.006}
                className="inline-block"
              />{" "}
              <SplitReveal
                key={c["headline_highlight"]}
                text={c["headline_highlight"]}
                immediate
                delay={0.12}
                stagger={0.006}
                charClassName="text-grain"
                className="inline-block pr-2 font-display"
              />
            </span>
          </h1>
        </div>

        <div className="mt-10 flex flex-col gap-8 md:mt-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md space-y-6">
            <Reveal delay={100}>
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                {c["subtitle"]}
              </p>
            </Reveal>
            <Reveal delay={150}>
              <ArrowLink href={safeUrl(c["cta_url"], "#contact")}>{c["cta_label"]}</ArrowLink>
            </Reveal>
          </div>

          <Reveal delay={200} className="flex items-center gap-3 self-start md:self-auto">
            <span className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              {c["scroll_label"]}
              <ArrowDown className="scroll-nudge size-3.5" />
            </span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
