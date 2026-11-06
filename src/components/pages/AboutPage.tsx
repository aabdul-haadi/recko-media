import { websiteCopy } from "@/data/website-copy";
import "./inner-visuals.css";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "@phosphor-icons/react";
import { PageFrame, PageHero, SectionIntro } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";

<<<<<<< HEAD
=======
const principles = [
  {
    icon: Target,
    title: "Proven track record",
    body: "A portfolio of success stories, helping businesses of all sizes achieve their online goals, from brand awareness to skyrocketing sales.",
  },
  {
    icon: ChartLineUp,
    title: "Data-driven approach",
    body: "We don't gamble; we analyze trends and user behavior to craft targeted campaigns that deliver measurable results.",
  },
  {
    icon: Eye,
    title: "Transparency & collaboration",
    body: "We keep you informed every step of the way, working closely with you to refine your strategy.",
  },
  {
    icon: Intersect,
    title: "Creative powerhouse",
    body: "Our wordsmiths and design wizards craft captivating content that grabs attention and drives engagement.",
  },
];

>>>>>>> 570819fa94f67af3b6f72a72806689d4dea7b2b0
const steps = [
  {
    number: "01",
    title: "Our vision",
    body: "We redefine digital marketing, delivering exceptional results globally with a focus on excellence.",
  },
  {
    number: "02",
    title: "Our mission",
    body: "Empower digital success through proven methods and continuous learning.",
  },
  {
    number: "03",
    title: "Our support",
    body: "Contact us on WhatsApp and Instagram. We are here to help you and grow your business.",
  },
  {
    number: "04",
    title: "Our awards",
    body: "We are certified with Meta Advertising and also with Google Advertising.",
  },
];

export function AboutPage() {
  return (
    <PageFrame>
      <PageHero
        eyebrow="About / ReckoMEDIA"
<<<<<<< HEAD
        title="Empowering small businesses through social media mastery."
        description={websiteCopy.mission[0]!}
=======
        title="Your trusted partner in the digital marketing jungle."
        description="Your brand deserves a megaphone, not a whisper. We are your experienced guide and strategic partner, leading you through the digital wilderness and helping you conquer the peaks of online success."
>>>>>>> 570819fa94f67af3b6f72a72806689d4dea7b2b0
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
            <p className="recko-page-label">Our story</p>
            <h2>
              A passion for
              <br />
              social media.
            </h2>
            <p>
              We saw businesses struggling to navigate the ever-changing landscape and knew there was a
              better way to unlock the transformative power of social media for businesses of all
              sizes.
            </p>
            <div className="recko-discipline-list">
              {["Social media advertising", "Search and SEO", "Web design"].map(
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
<<<<<<< HEAD
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
=======
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[0.8fr_1.2fr] md:px-10">
          <div>
            <Reveal>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Our story
              </p>
            </Reveal>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Built to help businesses win online.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            <Reveal>
              <p>
                It all started with a passion for the power of social media. We saw businesses
                drowning in a sea of irrelevant followers and frustrated by disappearing organic
                reach, and we knew there was a better way.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <p>
                ReckoMEDIA is driven by experienced digital strategists, creative storytellers and
                data wizards, dedicated to helping businesses achieve their online goals, from
                growing brand awareness to generating leads and boosting sales.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-surface/35 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <SectionIntro
            eyebrow="Why choose us"
            title="Why choose ReckoMEDIA?"
            text="Choose us because we have the experience and solutions that work. We focus on making you successful with personalized strategies and reliable execution."
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
>>>>>>> 570819fa94f67af3b6f72a72806689d4dea7b2b0
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <SectionIntro
            eyebrow="Vision, mission and support"
            title="Excellence, learning and support."
            text="We never settle; we continuously monitor and adjust your campaigns to maximize your ROI and stay ahead of the curve."
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
              Contact us
            </p>
            <h2 className="max-w-3xl font-display text-4xl font-bold tracking-tight md:text-6xl">
              Craft your unique digital story.
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
