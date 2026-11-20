import "./services-page.css";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Check } from "lucide-react";
import { processSteps } from "@/data/home";
import { safeUrl, useSection, useServices } from "@/lib/content/content";
import { SERVICE_CATEGORIES } from "@/lib/content/schema";
import { PageFrame, PageHero, SectionIntro } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";

const serviceVisuals = [
  {
    src: "/thumbs/work-fashion.jpg",
    second: "/thumbs/work-snack.jpg",
    caption: "Meta / Lead Generation / Social",
    alt: "Fashion campaign creative direction preview",
    tags: ["Meta Ads", "Lead Generation", "Creative"],
  },
  {
    src: "/thumbs/work-dashboard.jpg",
    second: "/thumbs/work-fashion.jpg",
    caption: "Search / E-commerce / Analytics",
    alt: "Analytics dashboard and digital campaign concept",
    tags: ["Google Ads", "E-commerce", "Reporting"],
  },
  {
    src: "/thumbs/work-robot.jpg",
    second: "/thumbs/work-dashboard.jpg",
    caption: "Websites / Landing Pages / Shopify",
    alt: "AI product concept and connected digital tools",
    tags: ["Web design", "Landing pages", "Shopify"],
  },
];

const outcomes = [
  "Performance first: sales, leads and profit over vanity metrics",
  "Transparent reporting: always know where your money is going",
  "Hands-on expertise: specialists run your account",
  "Creative and data together, under one roof",
  "Monthly retainers or project work, with no long lock-ins",
];

const categoryLabel = { creative: "Paid Social & Creative", growth: "Search & Growth", technology: "Web Experiences" } as const;

const faqs = [
  ["What budget do I need to start?", "It depends on your goals and industry. On a free strategy call, we'll recommend a starting ad budget that is realistic for your business."],
  ["How soon will I see results?", "Most campaigns show early data within the first 1–2 weeks. Stable, scalable results usually take 4–8 weeks of testing and optimization."],
  ["Do you work with businesses outside Pakistan?", "Yes. We work with brands locally and internationally."],
  ["Who owns the ad accounts?", "You do. We work inside your business accounts, so your data and assets always stay yours."],
  ["Do you offer one-time services?", "Yes. Account audits, tracking setup, landing pages and creative packages are all available as one-off projects."],
] as const;

export function ServicesPage() {
  const { data: intro } = useSection("services_intro");
  const services = useServices();
  // Always three categories so the visual artwork stays aligned; items come from the database.
  const serviceTabs = SERVICE_CATEGORIES.map((id, i) => ({
    id,
    index: String(i + 1).padStart(2, "0"),
    label: categoryLabel[id],
    intro: String(intro[`${id}_intro`] ?? ""),
    items: services.filter((x) => x.category === id),
  }));
  return (
    <PageFrame>
      <PageHero
        eyebrow="Performance marketing / Social / Creative"
        title="Ads that sell. Growth you can measure."
        description="Recko Media helps brands grow with performance marketing, social media and data-driven creative. We plan it, run it, track it and keep improving it, so every rupee of ad spend has a job to do."
        className="pb-12 md:pb-16"
        actions={
          <>
            <Link to="/contact" className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground sm:w-auto">
              Book a Free Strategy Call
            </Link>
            <a href="#how-we-work" className="inline-flex w-full items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-semibold hover:border-primary hover:text-primary sm:w-auto">
              See How We Work
            </a>
          </>
        }
      />

      <section className="recko-services-intro" aria-label="Explore our capabilities visually">
        <div className="recko-services-intro-grid">
          {serviceVisuals.map((visual, index) => (
            <a
              className="recko-services-teaser"
              href={`#${serviceTabs[index]!.id}`}
              key={visual.src}
            >
              <img src={visual.src} alt={visual.alt} width="640" height="480" loading={index === 0 ? "eager" : "lazy"} decoding="async" />
              <span>
                <span>{serviceTabs[index]!.label}</span>
                <ArrowUpRight size={20} aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="hidden border-b border-border py-8 sm:block md:py-20" aria-label="Service areas">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-5 md:px-10">
          {serviceTabs.map((service) => (
            <a
              key={service.id}
              href={`#${service.id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              {service.label}
              <ArrowDown className="size-3.5" />
            </a>
          ))}
        </div>
      </section>

      {serviceTabs.map((service, index) => (
        <section
          key={service.id}
          id={service.id}
          className={`scroll-mt-20 border-b border-border py-12 sm:py-16 md:py-28 ${index === 1 ? "bg-surface/35" : ""}`}
        >
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <div className="mb-10 grid gap-6 md:mb-14 md:grid-cols-[0.7fr_1.3fr] md:items-end">
              <Reveal>
                <p className="font-mono text-sm text-primary">{service.index} / 03</p>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-6xl">
                  {service.label}
                </h2>
              </Reveal>
              <Reveal delay={100}>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:justify-self-end md:text-lg">
                  {service.intro} We connect the right people, tools and creative work to make it
                  useful in the real world.
                </p>
              </Reveal>
            </div>
            <div className={`recko-service-artboard recko-service-artboard-${service.id}`}>
              <div className="recko-service-artwork">
                <img
                  className="recko-service-main-image"
                  src={serviceVisuals[index]!.src}
                  alt={serviceVisuals[index]!.alt}
                  width="960"
                  height="720"
                  loading="lazy"
                  decoding="async"
                />
                <img
                  className="recko-service-inset-image"
                  src={serviceVisuals[index]!.second}
                  alt=""
                  width="480"
                  height="360"
                  loading="lazy"
                />
                <span className="recko-service-artwork-label">
                  {serviceVisuals[index]!.caption}
                </span>
              </div>
              <div className="recko-service-artwork-copy">
                <p className="recko-page-label">{service.label} / In practice</p>
                <h3>
                  {
                    [
                      "A brand people feel. A presence they remember.",
                      "From the first impression to the next opportunity.",
                      "Good experiences. Connected behind the scenes.",
                    ][index]
                  }
                </h3>
                <p>{service.intro}</p>
                <ul>
                  {serviceVisuals[index]!.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <Link to="/contact">
                  Discuss your {service.label.toLowerCase()}{" "}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
                <p className="recko-service-concept-note">
                  Visual concepts illustrating our capabilities.
                </p>
              </div>
            </div>
            <div
              className={`grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 ${
                service.id === "growth" ? "lg:grid-cols-3" : ""
              }`}
            >
              {service.items.map((item, itemIndex) => (
                <article
                  key={item.id}
                  className="recko-service-card group flex min-h-64 flex-col bg-background transition-colors hover:bg-surface md:min-h-72"
                >
                  <div className="recko-service-card-image">
                    <img
                      src={
                        itemIndex === 1 ? serviceVisuals[index]!.second : serviceVisuals[index]!.src
                      }
                      alt={`${item.title} visual concept`}
                      width="640"
                      height="480"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="recko-service-card-copy">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">
                        {service.index}.{itemIndex + 1}
                      </span>
                      <ArrowUpRight className="size-4 text-primary transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                    </div>
                    <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {item.summary}
                    </p>
                    {item.features.length > 0 && (
                      <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                        {item.features.map((feature) => (
                          <li key={feature} className="flex gap-2">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.price && <p className="mt-4 text-sm font-semibold">{item.price}</p>}
                    {item.cta_label && (
                      <a
                        href={safeUrl(item.cta_url, "/contact")}
                        className="mt-auto pt-6 text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {item.cta_label}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="border-b border-border py-14 sm:py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-2 md:px-10">
          <SectionIntro
            eyebrow="The outcome"
            title="Why Recko Media"
            text="We combine strategy, creative and analytics to build growth that is measurable, transparent and sustainable."
          />
          <ul className="space-y-0 self-center border-t border-border">
            {outcomes.map((outcome) => (
              <li
                key={outcome}
                className="flex items-center gap-4 border-b border-border py-5 text-base sm:text-lg"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-4" />
                </span>
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-we-work" className="scroll-mt-20 bg-surface/35 py-14 sm:py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <SectionIntro
            eyebrow="How we work"
            title="A clear path from first question to next move"
            text="We keep the work focused, visible and built around improving real business results."
          />
          <div className="grid gap-0 border-t border-border sm:grid-cols-2 lg:grid-cols-5">
            {processSteps.map((step) => (
              <article
                key={step.number}
                className="border-b border-border py-6 sm:px-5 sm:first:pl-0 sm:nth-[2n+1]:border-r lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0"
              >
                <span className="font-mono text-xs text-primary">{step.number}</span>
                <h3 className="mt-5 font-display text-2xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border py-14 sm:py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5 md:px-10">
          <SectionIntro
            eyebrow="FAQs"
            title="Common questions"
            text="Straight answers before we get started."
          />
          <div className="border-t border-border">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group border-b border-border py-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-semibold sm:text-xl">
                  {question}
                  <ArrowUpRight className="size-5 shrink-0 text-primary transition-transform group-open:rotate-[135deg]" />
                </summary>
                <p className="max-w-3xl pt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="rounded-[2rem] border border-border bg-primary px-6 py-12 text-primary-foreground sm:px-10 md:px-14 md:py-16">
            <p className="recko-page-label mb-5 text-xs font-semibold uppercase tracking-[0.3em]">
              Start the conversation
            </p>
            <h2 className="max-w-4xl font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
              Ready to grow with Recko Media?
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed md:text-lg">
              Tell us about your business, and we'll show you where your next customers are coming from.
            </p>
            <Link
              to="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary-foreground px-6 py-3 text-sm font-semibold text-background"
            >
              Book Your Free Strategy Call
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
