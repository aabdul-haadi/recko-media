import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
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
      <div className="portfolio-grid">
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
