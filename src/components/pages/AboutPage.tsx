import { websiteCopy } from "@/data/website-copy";
import "./inner-visuals.css";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "@phosphor-icons/react";
import { PageFrame, PageHero, SectionIntro } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";

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
        title="Empowering small businesses through social media mastery."
        description={websiteCopy.mission[0]!}
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
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <p className="recko-page-label">Welcome to Recko Media</p>
          <h2 className="mt-5 max-w-3xl">
            Achieve your digital goals with our social media marketing agency.
          </h2>
          <p className="mt-6 max-w-4xl text-muted-foreground">{websiteCopy.intro}</p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { title: "Why Choose Us", body: websiteCopy.why },
              { title: "Affordable Price For You", body: websiteCopy.price },
              { title: "Best Strategy", body: websiteCopy.strategy },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-border bg-surface p-6">
                <h3>{item.title}</h3>
                <p className="mt-4 text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="border-b border-border py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-2 md:px-10">
          <div>
            <p className="recko-page-label">Our Mission</p>
            <h2 className="mt-5">Empowering small businesses through social media mastery.</h2>
          </div>
          <div className="space-y-5 text-muted-foreground">
            {websiteCopy.mission.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
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
      <section className="border-t border-border py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <p className="recko-page-label">FAQs</p>
          <h2 className="mt-4 mb-8">Frequently Asked Questions</h2>
          <ul className="divide-y divide-border">
            {websiteCopy.questions.map((question, index) => (
              <li key={question} className="py-5">
                {index === 3 ? (
                  <details>
                    <summary className="cursor-pointer font-medium">{question}</summary>
                    <p className="mt-4 max-w-4xl text-muted-foreground">{websiteCopy.faqAnswer}</p>
                  </details>
                ) : (
                  <p>{question}</p>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-muted-foreground">
            Have another question?{" "}
            <Link to="/contact" className="text-acid">
              Contact Us
            </Link>
          </p>
        </div>
      </section>
    </PageFrame>
  );
}
