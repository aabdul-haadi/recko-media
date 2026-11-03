import { useRef } from "react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { Reveal, SplitReveal } from "@/components/motion/SplitReveal";

const reviews = [
  {
    quote: "The new site finally makes it easy for the right customers to understand what we do.",
    name: "Marketing Director",
    role: "B2B technology",
  },
  {
    quote: "We have a clearer brand, a better customer journey and a team that keeps improving it.",
    name: "Founder",
    role: "Consumer brand",
  },
  {
    quote:
      "The automation gave our team hours back each week, and it fits the way we already work.",
    name: "Operations Lead",
    role: "Professional services",
  },
  {
    quote: "Everything feels connected now: our campaigns, our website and the way we follow up.",
    name: "Managing Partner",
    role: "Growth stage business",
  },
];

export function Reviews() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollReviews(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-review-card]");
    track.scrollBy({ left: direction * ((card?.offsetWidth ?? 320) + 20), behavior: "smooth" });
  }

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
                The work, in their words
              </p>
            </Reveal>
            <h2 id="reviews-title" className="font-display">
              <SplitReveal text="Good work travels." />
            </h2>
          </div>
          <div className="flex items-center gap-3">
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
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label="Client reviews"
        >
          {reviews.map((review, index) => (
            <article
              key={review.name}
              data-review-card
              role="listitem"
              className={`flex min-h-[19rem] w-[min(84vw,25rem)] shrink-0 snap-start flex-col justify-between border border-border p-6 sm:p-8 md:min-h-[21rem] ${index === 1 ? "bg-primary text-primary-foreground" : "bg-surface/60"}`}
            >
              <div>
                <Quote
                  aria-hidden="true"
                  className={`mb-6 size-7 ${index === 1 ? "text-primary-foreground/70" : "text-primary"}`}
                />
                <blockquote className="font-display text-xl font-medium leading-snug sm:text-2xl">
                  “{review.quote}”
                </blockquote>
              </div>
              <div className="mt-8 border-t border-current/15 pt-5">
                <p className="font-semibold">{review.name}</p>
                <p
                  className={`mt-1 text-sm ${index === 1 ? "opacity-75" : "text-muted-foreground"}`}
                >
                  {review.role}
                </p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground sm:hidden">Swipe to read more</p>
      </div>
    </section>
  );
}
