import { Reveal, SplitReveal } from "@/components/motion/SplitReveal";
import { ArrowLink } from "@/components/ui/ArrowLink";

export function Attention() {
  return (
    <section className="recko-attention relative overflow-hidden border-t border-border py-24 md:py-36">
      <div className="recko-attention-grid" aria-hidden="true" />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[1.2fr_1fr] md:px-10">
        <h2 className="font-display">
          <SplitReveal text="Your ambition." />
          <span className="block">
            <SplitReveal text="Our attention." charClassName="text-grain" />
          </span>
        </h2>

        <div className="flex flex-col justify-end items-start gap-8">
          <Reveal delay={120}>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              Good partnerships need more than a handoff. They need clear roles, honest
              conversations and people who care about the result.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <ArrowLink variant="ghost" href="#contact">
              Meet ReckoMEDIA
            </ArrowLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
