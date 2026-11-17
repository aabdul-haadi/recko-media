import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageFrame, PageHero } from "@/components/pages/PageFrame";
import { PortfolioGallery } from "@/components/portfolio/PortfolioGallery";
export function PortfolioPage() {
  return (
    <PageFrame>
      <div className="portfolio-page">
        <PageHero
          eyebrow="Selected work / ReckoMEDIA"
          title="Different challenges. Distinctive work."
          description="Thoughtful websites. Memorable brands. Explore the details behind our work, one project at a time."
        />
        <section className="portfolio-section" aria-label="Portfolio gallery">
          <div className="portfolio-section-intro">
            <p className="recko-page-label">THE COLLECTION</p>
            <p>Built with purpose. Made to be explored.</p>
          </div>
          <PortfolioGallery />
        </section>
        <section className="portfolio-outro">
          <p className="recko-page-label">YOUR NEXT CHAPTER</p>
          <h2>
            Let's make something
            <br />
            <span>worth exploring.</span>
          </h2>
          <Link to="/contact">
            Start a conversation <ArrowUpRight />
          </Link>
        </section>
      </div>
    </PageFrame>
  );
}
