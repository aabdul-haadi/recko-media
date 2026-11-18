import { lazy, Suspense, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, Search } from "lucide-react";
import { usePortfolio, usePortfolioCategories } from "@/lib/portfolio/portfolio";
import { PortfolioImage } from "./PortfolioImage";
import "./portfolio.css";
const Lightbox = lazy(() => import("./PortfolioLightbox"));
export function PortfolioGallery({ compact = false }: { compact?: boolean }) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const list = usePortfolio(false, query, category);
  const categories = usePortfolioCategories();
  const allItems = list.data?.pages.flat() ?? [];
  const items = compact ? allItems.slice(0, 6) : allItems;
  const [selected, setSelected] = useState<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const index = items.findIndex((i) => i.id === selected);
  const [viewportRef, carousel] = useEmblaCarousel({
    active: false,
    align: "start",
    loop: true,
    breakpoints: { "(max-width: 639px)": { active: true } },
  });
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!carousel) return;
    const updateSlide = () => setSlide(carousel.selectedScrollSnap());
    updateSlide();
    carousel.on("select", updateSlide).on("reInit", updateSlide);
    return () => {
      carousel.off("select", updateSlide).off("reInit", updateSlide);
    };
  }, [carousel]);

  useEffect(() => {
    carousel?.scrollTo(0, true);
  }, [carousel, category, query]);

  useEffect(() => {
    if (!carousel || paused || selected || items.length < 2) return;
    const mobile = window.matchMedia("(max-width: 639px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewport = carousel.rootNode();
    let visible = false;
    let dragging = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.intersectionRatio >= 0.25;
      },
      { threshold: 0.25 },
    );
    observer.observe(viewport);
    const startDrag = () => {
      dragging = true;
    };
    const stopDrag = () => {
      dragging = false;
    };
    carousel.on("pointerDown", startDrag).on("pointerUp", stopDrag).on("reInit", stopDrag);

    const timer = window.setInterval(() => {
      if (!mobile.matches || reducedMotion.matches || !visible || document.hidden || dragging)
        return;
      if (viewport.parentElement?.querySelector(":focus-visible")) return;
      if (carousel.canScrollNext()) carousel.scrollNext();
      else carousel.scrollTo(0);
    }, 4500);

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
      carousel.off("pointerDown", startDrag).off("pointerUp", stopDrag).off("reInit", stopDrag);
    };
  }, [carousel, items.length, paused, selected]);
  return (
    <div className="portfolio-collection">
      {!compact && (
        <div className="portfolio-toolbar">
          <div className="portfolio-filters" aria-label="Filter portfolio by category">
            {["", ...(categories.data ?? [])].map((c) => (
              <button key={c} aria-pressed={c === category} onClick={() => setCategory(c)}>
                {c || "All work"}
              </button>
            ))}
          </div>
          <label className="portfolio-search">
            <Search size={18} />
            <span className="sr-only">Search portfolio</span>
            <input
              type="search"
              value={search}
              maxLength={100}
              placeholder="Find a project"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      )}
      {list.isLoading && (
        <div className="portfolio-grid" aria-label="Loading portfolio" role="status">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="portfolio-skeleton" />
          ))}
        </div>
      )}
      {list.isError && (
        <div className="portfolio-empty" role="alert">
          <p>We could not load the collection.</p>
          <button onClick={() => list.refetch()}>Try again</button>
        </div>
      )}
      {!list.isLoading && !list.isError && !items.length && (
        <div className="portfolio-empty">
          <span>THE NEXT CHAPTER</span>
          <h3>{search || category ? "No matching projects." : "Good work is on its way."}</h3>
          <p>
            {search || category
              ? "Try another search or category."
              : "Our collection is being curated. Come back soon."}
          </p>
        </div>
      )}
      <div className="portfolio-slider">
        <div className="portfolio-slider-viewport" ref={viewportRef}>
          <div className="portfolio-grid portfolio-slider-track">
            {items.map((item, i) => (
              <article className="portfolio-card" key={item.id}>
                <button
                  className="portfolio-card-open"
                  aria-label={`View ${item.title}`}
                  onClick={(e) => {
                    returnFocus.current = e.currentTarget;
                    setSelected(item.id);
                  }}
                >
                  <PortfolioImage item={item} priority={!compact && i < 2} />
                  <span className="portfolio-card-overlay">
                    <span>Explore project</span>
                    <ArrowUpRight />
                  </span>
                </button>
                <div className="portfolio-card-caption">
                  <div>
                    <p>{item.category}</p>
                    <h3>{item.title}</h3>
                  </div>
                  <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <p className="portfolio-card-description">{item.description}</p>
                {item.tags.length > 0 && (
                  <ul className="portfolio-tags" aria-label="Project tags">
                    {item.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
        {items.length > 1 && (
          <div
            className="portfolio-slider-controls"
            aria-label="Project slider controls"
            role="group"
          >
            <button
              className="portfolio-control"
              type="button"
              aria-label="Previous project"
              onClick={() => {
                if (carousel?.canScrollPrev())
                  carousel.scrollPrev(
                    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                  );
                else
                  carousel?.scrollTo(
                    items.length - 1,
                    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                  );
              }}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <span>
              {Math.min(slide + 1, items.length)} / {items.length}
            </span>
            <button
              className="portfolio-control"
              type="button"
              aria-label="Next project"
              onClick={() => {
                if (carousel?.canScrollNext())
                  carousel.scrollNext(
                    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                  );
                else
                  carousel?.scrollTo(
                    0,
                    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                  );
              }}
            >
              <ArrowRight aria-hidden="true" />
            </button>
            <button
              className="portfolio-control portfolio-slider-autoplay"
              type="button"
              aria-label={paused ? "Resume automatic slides" : "Pause automatic slides"}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </button>
          </div>
        )}
      </div>
      {!compact && list.hasNextPage && (
        <div className="portfolio-more">
          <button disabled={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
            {list.isFetchingNextPage ? "Loading projects..." : "Discover more work"}
          </button>
        </div>
      )}
      {index >= 0 && (
        <Suspense
          fallback={
            <div role="status" className="portfolio-opening">
              Opening viewer...
            </div>
          }
        >
          <Lightbox
            items={items}
            initialIndex={index}
            returnFocus={returnFocus.current}
            onClose={() => setSelected(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
