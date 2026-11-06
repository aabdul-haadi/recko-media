import "./inner-visuals.css";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MoveUpRight } from "lucide-react";
import { PageFrame, PageHero, SectionIntro } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";

const projects = [
  {
    title: "A clearer view of the numbers",
    category: "Digital product · Analytics",
    image: "/thumbs/work-dashboard.jpg",
    alt: "Analytics dashboard interface",
    description: "Make complex information easier to read, understand and act on.",
  },
  {
    title: "A brand that earns attention",
    category: "Creative · Campaign",
    image: "/thumbs/work-snack.jpg",
    alt: "Colorful consumer brand campaign",
    description: "Build a recognizable visual world across campaign and customer touchpoints.",
  },
  {
    title: "A smoother path to purchase",
    category: "Commerce · Experience",
    image: "/thumbs/work-fashion.jpg",
    alt: "Fashion commerce and campaign preview",
    description: "Bring product storytelling and useful shopping interactions together.",
  },
  {
    title: "A product made approachable",
    category: "Technology · Launch",
    image: "/thumbs/work-robot.jpg",
    alt: "Consumer technology product preview",
    description: "Translate a new idea into a digital experience people can explore.",
  },
];

const capabilities = [
  "Strategy",
  "Identity",
  "Digital experiences",
  "Growth systems",
  "Automation",
];

export function PortfolioPage() {
  return (
    <PageFrame>
      <PageHero
        eyebrow="Portfolio / Our projects"
        title="Our projects."
        description="Check out our past projects to see the work we've done. We're proud of our diverse and successful accomplishments, showing our commitment to doing great work."
      />

      <section className="recko-portfolio-feature" aria-label="Featured creative concept">
        <div className="recko-inner-container">
          <a href="#selected-projects" className="recko-featured-work">
            <img
              className="recko-featured-main"
              src="/thumbs/work-snack.jpg"
              alt="Consumer brand campaign concept"
              width="1200"
              height="800"
            />
            <div className="recko-featured-copy">
              <p className="recko-page-label">Creative exploration / 01</p>
              <h2>
                A little different.
                <br />
                Hard to ignore.
              </h2>
              <p>
                A visual direction bringing product, personality and campaign design into one frame.
              </p>
              <span className="recko-inner-text-link">
                Explore the collection <ArrowUpRight size={20} aria-hidden="true" />
              </span>
            </div>
          </a>
          <p className="recko-concept-caption">
            Concept previews illustrating our creative and technical capabilities.
          </p>
        </div>
      </section>

      <section className="border-b border-border py-10 md:py-14">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-3 px-5 md:px-10">
          <span className="mr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Across
          </span>
          {capabilities.map((capability) => (
            <span
              key={capability}
              className="rounded-full border border-border px-4 py-2 text-sm text-foreground/80"
            >
              {capability}
            </span>
          ))}
        </div>
      </section>

      <section id="selected-projects" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <SectionIntro
            eyebrow="Selected work"
            title="Good experiences make the next step obvious."
            text="Explore a few creative directions across the kinds of work we bring together. Every piece is designed to feel clear, considered and useful."
          />
          <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 md:gap-y-16">
            {projects.map((project, index) => (
              <article
                key={project.title}
                className={`recko-portfolio-card ${index % 2 ? "md:mt-20" : ""}`}
              >
                <Reveal>
                  <Link
                    to="/contact"
                    aria-label={`Discuss a project like ${project.title}`}
                    className="recko-portfolio-image group relative overflow-hidden bg-surface"
                  >
                    <img
                      src={project.image}
                      alt={project.alt}
                      loading="lazy"
                      className="aspect-[1.35] w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                    />
                    <span className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-background/90 text-foreground backdrop-blur transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <MoveUpRight className="size-4" />
                    </span>
                  </Link>
                </Reveal>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      {project.category}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                      {project.title}
                    </h3>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {project.description}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface/35 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[1fr_auto] md:items-end md:px-10">
          <div>
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Your next project
            </p>
            <h2 className="max-w-3xl font-display text-4xl font-bold tracking-tight md:text-6xl">
              Need advice for your social media marketing?
            </h2>
          </div>
          <Link
            to="/contact"
            className="inline-flex w-fit items-center gap-3 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:translate-x-1"
          >
            Talk with our team
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    </PageFrame>
  );
}
