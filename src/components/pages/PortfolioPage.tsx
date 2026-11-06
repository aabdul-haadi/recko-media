import "./portfolio-page.css";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, ArrowRight } from "lucide-react";
import { PageFrame, PageHero } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";

const projects = [
  {
    id: "brand",
    number: "01",
    category: "Brand / Campaign",
    title: "Made to stand out.",
    subtitle: "A visual world with a personality of its own.",
    image: "/thumbs/work-snack.jpg",
    alt: "Consumer brand campaign visual concept",
    type: "campaign",
    tags: ["Art direction", "Visual identity", "Campaign design"],
    challenge: "Bring a product into a busy category with a recognizable point of view.",
    approach:
      "Connect colour, product imagery and a flexible visual language across customer touchpoints.",
    deliverables: "Brand direction, campaign concepts and a coordinated set of content layouts.",
  },
  {
    id: "digital",
    number: "02",
    category: "Digital / Product",
    title: "Clarity, by design.",
    subtitle: "Complex information. A simpler experience.",
    image: "/thumbs/work-dashboard.jpg",
    alt: "Digital analytics dashboard interface concept",
    type: "digital",
    tags: ["UX direction", "Interface design", "Digital systems"],
    challenge: "Help people find the information they need without getting lost in the detail.",
    approach:
      "Build a clear hierarchy, consistent interface patterns and focused paths through the product.",
    deliverables: "Interface concepts, dashboard layouts and a reusable design direction.",
  },
  {
    id: "commerce",
    number: "03",
    category: "Commerce / Editorial",
    title: "More than a storefront.",
    subtitle: "A shopping experience with an editorial eye.",
    image: "/thumbs/work-fashion.jpg",
    alt: "Fashion editorial and commerce creative concept",
    type: "editorial",
    tags: ["Commerce design", "Content direction", "Customer journey"],
    challenge: "Give a collection room to tell its story while keeping the next step easy to find.",
    approach:
      "Pair expressive campaign imagery with a deliberate, straightforward shopping journey.",
    deliverables: "Editorial layouts, commerce direction and responsive experience concepts.",
  },
  {
    id: "technology",
    number: "04",
    category: "Technology / Launch",
    title: "The future, made familiar.",
    subtitle: "Turn a new idea into something people connect with.",
    image: "/thumbs/work-robot.jpg",
    alt: "Friendly consumer technology product concept",
    type: "technology",
    tags: ["Product storytelling", "Launch direction", "Digital experience"],
    challenge: "Make an unfamiliar product feel understandable, useful and approachable.",
    approach:
      "Lead with a distinct product personality and explain its role through clear visual storytelling.",
    deliverables: "Product presentation, launch concepts and digital experience direction.",
  },
];

export function PortfolioPage() {
  return (
    <PageFrame>
      <div className="recko-portfolio-v2">
        <PageHero
          eyebrow="Our Portfolio"
          title="Different challenges. Distinctive work."
          description="Explore web and e-commerce, social media and media buying directions. Our portfolio brings these disciplines together; the visual studies below illustrate our capabilities."
        />
        <div className="pf-container mb-8 flex flex-wrap gap-3" aria-label="Portfolio disciplines">
          {["WEB & ECOM PORTFOLIO", "SOCIAL MEDIA PORTFOLIO", "MEDIA BUYING CASE STUDIES"].map(
            (label) => (
              <span key={label} className="rounded-full border border-border px-4 py-2 text-xs">
                {label}
              </span>
            ),
          )}
        </div>
        <section className="pf-index" aria-label="Explore portfolio categories">
          <div className="pf-container pf-index-inner">
            <p className="recko-page-label">
              Explore the collection <ArrowDown size={16} aria-hidden="true" />
            </p>
            <nav aria-label="Project categories">
              {projects.map((project) => (
                <a key={project.id} href={`#project-${project.id}`}>
                  <span>{project.number}</span>
                  {project.category.split(" / ")[0]}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              ))}
            </nav>
          </div>
        </section>
        <section className="pf-opening" aria-label="A look inside the collection">
          <div className="pf-container">
            <div className="pf-cover">
              <div className="pf-cover-top">
                <span className="recko-page-label">RECKO / Creative directions</span>
                <span className="recko-page-label">Collection 01</span>
              </div>
              <div className="pf-cover-images">
                {projects.slice(0, 3).map((project) => (
                  <a
                    href={`#project-${project.id}`}
                    key={project.id}
                    aria-label={`Explore ${project.category}`}
                  >
                    <img src={project.image} alt={project.alt} width="640" height="480" />
                  </a>
                ))}
              </div>
              <div className="pf-cover-bottom">
                <h2>
                  One perspective.
                  <br />
                  <span>Never one formula.</span>
                </h2>
                <p>
                  Creative thinking meets practical design.
                  <br />
                  Find the direction that speaks to you.
                </p>
              </div>
            </div>
            <p className="pf-disclosure">
              Concept studies illustrating our capabilities. These previews do not represent
              verified client case studies or measured results.
            </p>
          </div>
        </section>
        <div className="pf-projects pf-container">
          {projects.map((project) => (
            <section
              id={`project-${project.id}`}
              className={`pf-project pf-project-${project.type}`}
              key={project.id}
              aria-labelledby={`title-${project.id}`}
            >
              <Reveal>
                <div className="pf-project-heading">
                  <div>
                    <p className="recko-page-label">
                      {project.number} / {project.category}
                    </p>
                    <h2 id={`title-${project.id}`}>{project.title}</h2>
                  </div>
                  <p>{project.subtitle}</p>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <a
                  href={`#brief-${project.id}`}
                  className={`pf-artboard ${project.type !== "campaign" ? "pf-artboard-custom" : ""}`}
                  aria-label={`Read the concept brief for ${project.title}`}
                >
                  <span className="pf-artboard-label">RECKO / {project.category}</span>
                  {project.type === "digital" ? (
                    <div className="pf-dashboard-scene">
                      <div className="pf-dashboard-sidebar">
                        <span className="recko-page-label">Workspace</span>
                        <div className="pf-sidebar-item pf-sidebar-active">Overview</div>
                        <div className="pf-sidebar-item">Audience</div>
                        <div className="pf-sidebar-item">Campaigns</div>
                        <div className="pf-sidebar-item">Insights</div>
                        <span className="pf-sidebar-foot">Everything in focus.</span>
                      </div>
                      <div className="pf-dashboard-content">
                        <div className="pf-dashboard-toolbar">
                          <span>Business overview</span>
                          <span className="pf-scene-pill">Interface concept</span>
                        </div>
                        <img
                          src={project.image}
                          alt={project.alt}
                          width="1200"
                          height="900"
                          loading="lazy"
                        />
                        <div className="pf-dashboard-footer">
                          <span>Clear hierarchy</span>
                          <span>Connected information</span>
                          <span>Useful decisions</span>
                        </div>
                      </div>
                    </div>
                  ) : project.type === "editorial" ? (
                    <div className="pf-editorial-scene">
                      <div className="pf-editorial-photo">
                        <img
                          src={project.image}
                          alt={project.alt}
                          width="900"
                          height="1200"
                          loading="lazy"
                        />
                        <span>Editorial / Vol. 03</span>
                      </div>
                      <div className="pf-editorial-page">
                        <span className="recko-page-label">The considered collection</span>
                        <h3>
                          Wear the story.
                          <br />
                          <em>Own the moment.</em>
                        </h3>
                        <div className="pf-editorial-detail" aria-hidden="true">
                          <img src={project.image} alt="" width="480" height="360" loading="lazy" />
                        </div>
                        <p>Product, personality and a different point of view.</p>
                        <span className="pf-editorial-page-number">RECKO STUDIO / 003</span>
                      </div>
                    </div>
                  ) : project.type === "technology" ? (
                    <div className="pf-product-scene">
                      <div className="pf-product-story">
                        <span className="pf-scene-pill">Meet the idea</span>
                        <h3>
                          A little intelligence.
                          <br />A lot of personality.
                        </h3>
                        <p>A friendlier first encounter with technology.</p>
                        <div className="pf-product-principles">
                          <span>01 / Discover</span>
                          <span>02 / Connect</span>
                          <span>03 / Explore</span>
                        </div>
                        <span className="pf-product-signal">
                          <i /> Designed for the everyday
                        </span>
                      </div>
                      <div className="pf-product-visual">
                        <div className="pf-product-orbit" aria-hidden="true" />
                        <img
                          src={project.image}
                          alt={project.alt}
                          width="900"
                          height="1200"
                          loading="lazy"
                        />
                        <span className="pf-product-stamp">
                          Human-first
                          <br />
                          by design.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="pf-main-frame">
                        <div className="pf-window-bar" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                          <span>{project.category}</span>
                        </div>
                        <img
                          src={project.image}
                          alt={project.alt}
                          width="1200"
                          height="900"
                          loading="lazy"
                        />
                      </div>
                      <div className="pf-secondary-frame" aria-hidden="true">
                        <img src={project.image} alt="" width="480" height="640" loading="lazy" />
                      </div>
                    </>
                  )}
                  <span className="pf-artboard-link">
                    Explore the direction <ArrowDown size={18} aria-hidden="true" />
                  </span>
                </a>
              </Reveal>
              <div className="pf-project-meta">
                <ul aria-label="Capabilities">
                  {project.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <Link to="/contact">
                  Discuss a similar project <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </div>
              <details className="pf-brief" id={`brief-${project.id}`}>
                <summary>
                  Inside the concept <span aria-hidden="true">+</span>
                </summary>
                <div className="pf-brief-grid">
                  <div>
                    <p className="recko-page-label">The challenge</p>
                    <p>{project.challenge}</p>
                  </div>
                  <div>
                    <p className="recko-page-label">The direction</p>
                    <p>{project.approach}</p>
                  </div>
                  <div>
                    <p className="recko-page-label">What we would make</p>
                    <p>{project.deliverables}</p>
                  </div>
                </div>
              </details>
            </section>
          ))}
        </div>
        <section className="pf-outro">
          <div className="pf-container">
            <div className="pf-outro-panel">
              <p className="recko-page-label">Your project could be next</p>
              <h2>
                A different challenge?
                <br />
                <span>We like those.</span>
              </h2>
              <p>
                Tell us what you have in mind. We will help connect the right ideas, people and next
                steps.
              </p>
              <Link to="/contact">
                Start a conversation <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageFrame>
  );
}
