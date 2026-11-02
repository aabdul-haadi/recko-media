import { SplitReveal, Reveal } from "@/components/motion/SplitReveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { ArrowDown } from "lucide-react";

export function Hero() {
  return (
    <section id="top" className="starfield relative flex min-h-svh flex-col overflow-hidden">
      {/* soft acid glow behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/3 size-[36rem] rounded-full opacity-25 blur-[120px]"
        style={{
          background: "radial-gradient(circle, oklch(0.9 0.24 122 / 0.35), transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-16 pt-36 md:px-10 md:pt-40">
        <Reveal>
          <p className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground md:mb-8 md:text-xs">
            Recko Media — Web design, AI automation &amp; digital marketing
          </p>
        </Reveal>

        <div className="relative w-fit max-w-full">
          <h1 className="relative z-10 font-display text-[clamp(3.2rem,10.5vw,10rem)] font-bold leading-[0.98] tracking-[-0.03em]">
            <SplitReveal text="Growth systems" immediate delay={0.15} className="block" />
            <span className="block">
              <SplitReveal text="that move" immediate delay={0.5} className="inline-block" />{" "}
              <SplitReveal
                text="revenue."
                immediate
                delay={0.75}
                charClassName="text-grain"
                className="inline-block pr-2 font-display italic"
              />
            </span>
          </h1>
        </div>

        <div className="mt-10 flex flex-col gap-8 md:mt-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md space-y-6">
            <Reveal delay={900}>
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                Web design, AI automation and digital marketing — built together to grow your
                business.
              </p>
            </Reveal>
            <Reveal delay={1050}>
              <ArrowLink onClick={() => document.querySelector("#contact")?.scrollIntoView()}>
                Build your brief
              </ArrowLink>
            </Reveal>
          </div>

          <Reveal delay={1200} className="flex items-center gap-3 self-start md:self-auto">
            <span className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              Scroll
              <ArrowDown className="scroll-nudge size-3.5" />
            </span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
