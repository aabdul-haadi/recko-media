import { processSteps } from "@/data/home";
import { Reveal, SplitReveal } from "@/components/motion/SplitReveal";
import { ArrowUpRight } from "lucide-react";

const surfaces = [
  { counter: "01", title: "Surface", caption: "What people experience." },
  { counter: "02", title: "System", caption: "What makes it work." },
  { counter: "03", title: "Idea", caption: "Where it goes next." },
];

export function Process() {
  return (
    <section id="approach" className="recko-process relative border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="recko-brand-label mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            How we work
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mb-16 max-w-3xl font-display md:mb-24">
            <SplitReveal text="A shared way of working." />
          </h2>
        </Reveal>

        {/* Process rows */}
        <div className="border-t border-border">
          {processSteps.map((step, i) => (
            <Reveal key={step.number} delay={i * 80}>
              <div className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border py-7 transition-colors duration-300 hover:bg-foreground/[0.04] md:grid-cols-[auto_auto_1fr_auto] md:gap-10 md:px-4 md:py-9">
                <span className="font-sans text-xs text-primary">{step.number}</span>
                <span className="recko-subheading font-display transition-transform duration-300 group-hover:translate-x-2">
                  {step.title}
                </span>
                <span className="recko-process-description hidden max-w-md justify-self-end text-sm leading-relaxed text-muted-foreground md:block">
                  {step.description}
                </span>
                <ArrowUpRight className="size-5 -translate-x-1 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:size-6" />
              </div>
            </Reveal>
          ))}
        </div>

        {/* Surface / System / Idea diagram */}
        <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {surfaces.map((s, i) => (
            <Reveal
              key={s.title}
              delay={i * 100}
              className="group bg-background p-8 transition-colors duration-300 hover:bg-surface md:p-10"
            >
              <div className="mb-16 flex items-center justify-between">
                <span className="size-2.5 rounded-full bg-acid transition-transform duration-500 group-hover:scale-150" />
                <span className="font-sans text-xs text-muted-foreground">{s.counter}</span>
              </div>
              <p className="recko-subheading font-display">{s.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.caption}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
