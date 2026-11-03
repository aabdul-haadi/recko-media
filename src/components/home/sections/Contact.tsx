import { Reveal } from "@/components/motion/SplitReveal";

export function Contact() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-border py-28 md:py-40"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-5 text-center md:px-10">
        <Reveal>
          <p className="recko-brand-label mb-8 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Start the conversation
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mb-8">Let's build what's next.</h2>
        </Reveal>
        <Reveal delay={100}>
          <a href="mailto:hello@raytech.agency" className="recko-contact-cta group">
            <span className="inline-block text-acid transition-transform duration-500 group-hover:-translate-x-3">
              [
            </span>
            <span className="contact-typewriter mx-2 inline-block whitespace-nowrap transition-colors duration-500 group-hover:text-acid md:mx-4">
              Build your brief
            </span>
            <span className="contact-bracket contact-bracket-right inline-block text-acid transition-transform duration-500">
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
