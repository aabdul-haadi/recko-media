import { Reveal } from "@/components/motion/SplitReveal";

export function Contact() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-border py-28 md:py-40"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 size-[40rem] -translate-x-1/2 rounded-full opacity-15 blur-[130px]"
        style={{
          background: "radial-gradient(circle, oklch(0.9 0.24 122 / 0.4), transparent 70%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-5 text-center md:px-10">
        <Reveal>
          <p className="mb-8 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Start the conversation
          </p>
        </Reveal>

        <Reveal delay={100}>
          <a
            href="mailto:hello@raytech.agency"
            className="group inline-block font-display text-[clamp(2.6rem,8.5vw,8.5rem)] font-bold tracking-[-0.02em]"
          >
            <span className="inline-block text-acid transition-transform duration-500 group-hover:-translate-x-3">
              [
            </span>
            <span className="mx-2 inline-block transition-colors duration-500 group-hover:text-acid md:mx-4">
              Build your brief
            </span>
            <span className="inline-block text-acid transition-transform duration-500 group-hover:translate-x-3">
              ]
            </span>
          </a>
        </Reveal>

        <Reveal delay={220}>
          <p className="mx-auto mt-8 max-w-md text-base text-muted-foreground md:text-lg">
            Tell us where you want to go. We'll work out what comes next.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
