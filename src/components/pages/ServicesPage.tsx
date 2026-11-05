import "./services-page.css";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { processSteps } from "@/data/home";
import { safeUrl, useSection, useServices } from "@/lib/content/content";
import { SERVICE_CATEGORIES } from "@/lib/content/schema";
import { PageFrame, PageHero, SectionIntro } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";

const serviceVisuals = [
  {
    src: "/thumbs/work-fashion.jpg",
    second: "/thumbs/work-snack.jpg",
    caption: "Identity / Content / Campaigns",
    alt: "Fashion campaign creative direction preview",
    tags: ["Art direction", "Brand systems", "Content"],
  },
  {
    src: "/thumbs/work-dashboard.jpg",
    second: "/thumbs/work-fashion.jpg",
    caption: "Discover / Connect / Convert",
    alt: "Analytics dashboard and digital campaign concept",
    tags: ["Paid media", "Search", "Optimisation"],
  },
  {
    src: "/thumbs/work-robot.jpg",
    second: "/thumbs/work-dashboard.jpg",
    caption: "Websites / Commerce / Automation",
    alt: "AI product concept and connected digital tools",
    tags: ["Digital experiences", "E-commerce", "Automation"],
  },
];

const outcomes = [
  "A sharper customer experience",
  "A connected growth engine",
  "Less friction in daily operations",
];

const categoryLabel = { creative: "Creative", growth: "Growth", technology: "Technology" } as const;

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
        eyebrow="Services / Strategy, design, technology"
        title="Everything connected. Everything moving."
        description="Bring your brand, digital experience and operations into one practical growth system. Start with a focused need or build a joined-up plan across the whole business."
      />

      <section className="recko-services-intro" aria-label="Explore our capabilities visually">
        <div className="recko-services-intro-grid">
          {serviceVisuals.map((visual, index) => (
            <a
              className="recko-services-teaser"
              href={`#${serviceTabs[index]!.id}`}
              key={visual.src}
            >
              <img src={visual.src} alt={visual.alt} width="640" height="480" />
              <span>
                <span>{serviceTabs[index]!.label}</span>
                <ArrowUpRight size={20} aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="border-b border-border py-14 md:py-20" aria-label="Service areas">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-5 md:px-10">
          {serviceTabs.map((service) => (
            <a
              key={service.id}
              href={`#${service.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm transition-colors hover:border-primary hover:text-primary"
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
          className={`scroll-mt-20 border-b border-border py-20 md:py-28 ${index === 1 ? "bg-surface/35" : ""}`}
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
            <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
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

      <section className="border-b border-border py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-2 md:px-10">
          <SectionIntro
            eyebrow="The outcome"
            title="Built around what changes for you."
            text="The right mix of services depends on where the friction is and where the next opportunity lives."
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

      <section className="bg-surface/35 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <SectionIntro
            eyebrow="How we work"
            title="A clear path from first question to next move."
            text="Small, visible steps keep the work focused and make it easier to learn as we go."
          />
          <div className="grid gap-0 border-t border-border sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="border-t border-border py-20 md:py-28">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 md:flex-row md:items-end md:justify-between md:px-10">
          <div>
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Have a challenge in mind?
            </p>
            <h2 className="max-w-3xl font-display text-4xl font-bold tracking-tight md:text-6xl">
              Let’s find the useful first step.
            </h2>
          </div>
          <Link
            to="/contact"
            className="inline-flex w-fit items-center gap-3 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:translate-x-1"
          >
            Start a conversation
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </PageFrame>
  );
}
