import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal, SplitReveal } from "@/components/motion/SplitReveal";

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="recko-page-frame">
      <SmoothScroll />
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="starfield relative overflow-hidden border-b border-border pt-32 sm:pt-40">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-48 top-12 size-[32rem] rounded-full bg-primary/10 blur-[120px]"
      />
      <div className="relative mx-auto max-w-7xl px-5 pb-20 md:px-10 md:pb-28">
        <Reveal>
          <p className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground md:text-xs">
            {eyebrow}
          </p>
        </Reveal>
        <h1 className="max-w-5xl font-display text-[clamp(3rem,9vw,8rem)] font-bold leading-[0.96] tracking-[-0.045em]">
          <SplitReveal text={title} immediate delay={0.12} />
        </h1>
        <Reveal delay={180}>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:mt-10 md:text-xl">
            {description}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mb-10 max-w-3xl md:mb-14">
      <Reveal>
        <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {eyebrow}
        </p>
      </Reveal>
      <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-6xl">
        <SplitReveal text={title} />
      </h2>
      <Reveal delay={120}>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {text}
        </p>
      </Reveal>
    </div>
  );
}
