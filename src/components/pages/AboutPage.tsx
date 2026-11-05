import "./inner-visuals.css";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChartLineUp, Eye, Intersect, Target } from "@phosphor-icons/react";
import { PageFrame, PageHero, SectionIntro } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";

const principles = [
  {
    icon: Target,
    title: "Start with the real problem",
    body: "We get clear on the people, constraints and outcomes before choosing a direction.",
  },
  {
    icon: Intersect,
    title: "Connect the disciplines",
    body: "Brand, experience, growth and technology work better when they share one plan.",
  },
  {
    icon: Eye,
    title: "Keep the work visible",
    body: "Frequent check-ins and clear decisions make progress easier to understand.",
  },
  {
    icon: ChartLineUp,
    title: "Improve what matters",
    body: "We use feedback and real use to shape the next useful iteration.",
  },
];

const steps = [
  {
    number: "01",
    title: "Listen",
    body: "We learn what is working, what is getting in the way and what success should look like.",
  },
  {
    number: "02",
    title: "Focus",
    body: "Together, we choose the right problem and make a plan that fits your team.",
  },
  {
    number: "03",
    title: "Make",
    body: "We design and build the experiences, campaigns and systems that move the plan forward.",
  },
  {
    number: "04",
    title: "Learn",
    body: "We review what happened, keep what works and improve the next step.",
  },
];

export function AboutPage() {
  return (
    <PageFrame>
      <PageHero
        eyebrow="About / ReckoMEDIA"
        title="One team, built around your business."
        description="We bring creative thinking, growth experience and practical technology together so the work feels connected from the first conversation to the day-to-day details."
      />

      <section className="recko-about-studio" aria-label="Our connected disciplines">
        <div className="recko-inner-container recko-studio-grid">
          <div className="recko-studio-art">
            <img
              src="/thumbs/work-fashion.jpg"
              alt="Creative campaign direction concept"
              width="960"
              height="720"
            />
            <img
              className="recko-studio-inset"
              src="/thumbs/work-dashboard.jpg"
              alt="Digital experience and analytics concept"
              width="640"
              height="480"
            />
            <span className="recko-studio-caption">Different disciplines. One direction.</span>
          </div>
          <div className="recko-studio-copy">
            <p className="recko-page-label">The Recko approach</p>
            <h2>
              Creative minds.
              <br />
              Connected thinking.
            </h2>
            <p>
              From the way your brand looks to the way your business works, every piece should move
              together.
            </p>
            <div className="recko-discipline-list">
              {["Creative direction", "Growth strategy", "Digital experiences"].map(
                (name, index) => (
                  <div key={name}>
                    <span>0{index + 1}</span>
                    <span>{name}</span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </div>
                ),
              )}
            </div>
            <Link to="/services" className="recko-inner-text-link">
              Explore our services <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[0.8fr_1.2fr] md:px-10">
          <div>
            <Reveal>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Why we’re here
              </p>
            </Reveal>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Good work should make business feel simpler.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            <Reveal>
              <p>
                Growing a business can create a lot of moving parts. A new website, another
                campaign, a new tool: each can help, but only when it connects to the way people
                find you, choose you and work with you.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <p>
                ReckoMEDIA brings those parts into one conversation. We listen first, make the next
                move clear and build with the people who will use the result.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-surface/35 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <SectionIntro
            eyebrow="What guides us"
            title="Clear thinking. Useful work. Shared momentum."
            text="The way we work matters as much as what we make. These principles keep the relationship practical, open and focused."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ icon: Icon, title, body }, index) => (
              <article
                key={title}
                className="recko-principle-card min-h-64 border border-border bg-background p-6 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary"><Icon size={24} weight="duotone" aria-hidden="true" /></span>
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-12 font-display text-xl font-semibold leading-snug">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <SectionIntro
            eyebrow="The partnership"
            title="Work in the open, move with intent."
            text="A straightforward rhythm helps everyone understand the work, make good decisions and see what comes next."
          />
          <div className="grid gap-0 border-t border-border md:grid-cols-4">
            {steps.map((step) => (
              <article
                key={step.number}
                className="border-b border-border py-6 md:border-b-0 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0"
              >
                <span className="font-mono text-xs text-primary">{step.number}</span>
                <h3 className="mt-4 font-display text-2xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-primary py-16 text-primary-foreground md:py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:flex-row sm:items-end sm:justify-between md:px-10">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] opacity-75">
              Let’s make progress
            </p>
            <h2 className="max-w-3xl font-display text-4xl font-bold tracking-tight md:text-6xl">
              Tell us where you want to go.
            </h2>
          </div>
          <Link
            to="/contact"
            className="inline-flex w-fit items-center gap-3 rounded-full bg-background px-6 py-3 font-semibold text-foreground transition-transform hover:translate-x-1"
          >
            Start a conversation
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </PageFrame>
  );
}
