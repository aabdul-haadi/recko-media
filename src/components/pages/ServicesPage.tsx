import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { processSteps, serviceTabs } from "@/data/home";
import { PageFrame, PageHero, SectionIntro } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";

const outcomes = [
  "A sharper customer experience",
  "A connected growth engine",
  "Less friction in daily operations",
];

export function ServicesPage() {
  return (
    <PageFrame>
      <PageHero
        eyebrow="Services / Strategy, design, technology"
        title="Everything connected. Everything moving."
        description="Bring your brand, digital experience and operations into one practical growth system. Start with a focused need or build a joined-up plan across the whole business."
      />

      <section className="border-b border-border py-14 md:py-20" aria-label="Service areas">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-5 md:px-10">
          {serviceTabs.map((service) => (
            <a key={service.id} href={`#${service.id}`} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm transition-colors hover:border-primary hover:text-primary">
              {service.label}<ArrowDown className="size-3.5" />
            </a>
          ))}
        </div>
      </section>

      {serviceTabs.map((service, index) => (
        <section key={service.id} id={service.id} className={`scroll-mt-20 border-b border-border py-20 md:py-28 ${index === 1 ? "bg-surface/35" : ""}`}>
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <div className="mb-10 grid gap-6 md:mb-14 md:grid-cols-[0.7fr_1.3fr] md:items-end">
              <Reveal>
                <p className="font-mono text-sm text-primary">{service.index} / 03</p>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-6xl">{service.label}</h2>
              </Reveal>
              <Reveal delay={100}>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:justify-self-end md:text-lg">{service.intro} We connect the right people, tools and creative work to make it useful in the real world.</p>
              </Reveal>
            </div>
            <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
              {service.items.map((item, itemIndex) => (
                <article key={item.number} className="group flex min-h-64 flex-col bg-background p-6 transition-colors hover:bg-surface sm:p-8 md:min-h-72">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{service.index}.{itemIndex + 1}</span>
                    <ArrowUpRight className="size-4 text-primary transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </div>
                  <h3 className="mt-12 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{item.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{item.blurb}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="border-b border-border py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-2 md:px-10">
          <SectionIntro eyebrow="The outcome" title="Built around what changes for you." text="The right mix of services depends on where the friction is and where the next opportunity lives." />
          <ul className="space-y-0 self-center border-t border-border">
            {outcomes.map((outcome) => (
              <li key={outcome} className="flex items-center gap-4 border-b border-border py-5 text-base sm:text-lg">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" /></span>
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-surface/35 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <SectionIntro eyebrow="How we work" title="A clear path from first question to next move." text="Small, visible steps keep the work focused and make it easier to learn as we go." />
          <div className="grid gap-0 border-t border-border sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step) => (
              <article key={step.number} className="border-b border-border py-6 sm:px-5 sm:first:pl-0 sm:nth-[2n+1]:border-r lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0">
                <span className="font-mono text-xs text-primary">{step.number}</span>
                <h3 className="mt-5 font-display text-2xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 md:py-28">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 md:flex-row md:items-end md:justify-between md:px-10">
          <div>
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Have a challenge in mind?</p>
            <h2 className="max-w-3xl font-display text-4xl font-bold tracking-tight md:text-6xl">Let’s find the useful first step.</h2>
          </div>
          <Link to="/contact" className="inline-flex w-fit items-center gap-3 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:translate-x-1">Start a conversation<ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </PageFrame>
  );
}
