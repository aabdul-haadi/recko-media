import { useSection, safeUrl } from "@/lib/content/content";
import { Reveal, SplitReveal } from "@/components/motion/SplitReveal";
import { ArrowUpRight } from "lucide-react";

export function Process() {
  const { data: c } = useSection("process");
  const steps = (c["steps"] ?? []) as { title: string; description: string }[];
  return (
    <section id="approach" className="recko-process relative border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="recko-brand-label mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {c["eyebrow"]}
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mb-16 max-w-3xl font-display md:mb-24">
            <SplitReveal key={c["heading"]} text={c["heading"]} />
          </h2>
        </Reveal>

        {/* Process rows */}
        <div className="border-t border-border">
          {steps.map((step, i) => (
            <Reveal key={`${step.title}-${i}`} delay={i * 80}>
              <div className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border py-7 transition-colors duration-300 hover:bg-foreground/[0.04] md:grid-cols-[auto_auto_1fr_auto] md:gap-10 md:px-4 md:py-9">
                <span className="font-sans text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
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
      </div>
    </section>
  );
}
