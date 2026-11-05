import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { Reveal, SplitReveal } from "@/components/motion/SplitReveal";
import { useSection } from "@/lib/content/content";

export function Reviews() {
  const { data: c } = useSection("reviews");
  const reviews = (c["items"] ?? []) as { quote: string; name: string; role: string }[];
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollReviews(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-review-card]"));
    const step = cards[1] ? cards[1].offsetLeft - cards[0]!.offsetLeft : track.clientWidth;
    const left = (Math.round(track.scrollLeft / step) + direction) * step;
    track.scrollTo({
      left,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let last = -Infinity;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
      const end = track.scrollWidth - track.clientWidth;
      if (
        end <= 1 ||
        (event.deltaY < 0 && track.scrollLeft <= 1) ||
        (event.deltaY > 0 && track.scrollLeft >= end - 1)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      if (performance.now() - last < 450) return;
      last = performance.now();
      scrollReviews(event.deltaY > 0 ? 1 : -1);
    };
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => track.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-title"
      className="overflow-hidden border-t border-border py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="mb-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between md:mb-14">
          <div>
            <Reveal>
              <p className="recko-brand-label mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                {c["eyebrow"]}
              </p>
            </Reveal>
            <h2 id="reviews-title" className="font-display">
              <SplitReveal key={c["heading"]} text={c["heading"]} />
            </h2>
          </div>
          <div className={reviews.length > 1 ? "flex items-center gap-3" : "hidden"}>
            <button
              type="button"
              onClick={() => scrollReviews(-1)}
              aria-label="Previous reviews"
              className="grid size-11 place-items-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollReviews(1)}
              aria-label="Next reviews"
              className="grid size-11 place-items-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="recko-reviews-track flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label="Client reviews"
        >
          {reviews.map((review, i) => (
            <article
              key={`${review.name}-${i}`}
              data-review-card
              role="listitem"
              className={`flex min-h-[19rem] w-full sm:w-[calc((100%_-_20px)/2)] lg:w-[calc((100%_-_40px)/3)] shrink-0 snap-start flex-col justify-between border border-border p-6 sm:p-8 md:min-h-[21rem] bg-surface/60`}
            >
              <div>
                <Quote aria-hidden="true" className={`mb-6 size-7 text-acid`} />
                <blockquote className="font-display text-xl font-medium leading-snug sm:text-2xl">
                  “{review.quote}”
                </blockquote>
              </div>
              <div className="mt-8 border-t border-current/15 pt-5">
                <p className="font-semibold">{review.name}</p>
                {review.role && <p className="mt-1 text-sm text-muted-foreground">{review.role}</p>}
              </div>
            </article>
          ))}
        </div>
        {reviews.length > 1 && <p className="mt-3 text-xs text-muted-foreground sm:hidden">Swipe to read more</p>}
      </div>
    </section>
  );
}
