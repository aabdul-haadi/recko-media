import { Children, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const PHONE = "(max-width: 767px)";

/** True on phones and small tablets. False on the server and until the page has loaded. */
function usePhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return phone;
}

/**
 * A row of cards that you swipe sideways on a phone, with the next card peeking in from the edge and dots underneath.
 * From 768px up it is not a carousel at all: the children keep the grid layout given in `className`.
 *
 * The swiping itself is plain CSS scroll-snapping (see services-page.css), so it works before the page has loaded and
 * needs no script. The script only adds what CSS cannot: the dots, and the labels that tell screen-reader users this
 * is a sideways-scrolling region (those are only added while it really is one).
 */
export function PhoneCarousel({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const phone = usePhone();
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [scrollable, setScrollable] = useState(false);
  const count = Children.count(children);

  /** Where the track has to be scrolled to for slide `index` to sit at the left edge. */
  const target = useCallback((index: number) => {
    const el = track.current;
    const slide = el?.children[index] as HTMLElement | undefined;
    if (!el || !slide) return 0;
    return slide.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft || "0");
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el || !phone) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrollable(el.scrollWidth > el.clientWidth + 1);
        const slides = el.children.length;
        if (slides === 0) return;
        const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
        let best = slides - 1;
        if (!atEnd) {
          let distance = Infinity;
          for (let i = 0; i < slides; i++) {
            const d = Math.abs(target(i) - el.scrollLeft);
            if (d < distance) {
              distance = d;
              best = i;
            }
          }
        }
        setActive(best);
      });
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [phone, count, target]);

  const goTo = (index: number) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.current?.scrollTo({ left: target(index), behavior: reduced ? "auto" : "smooth" });
  };

  /** Arrow keys, Home and End move from card to card (the browser's own arrow scrolling fights scroll-snapping). */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return; // leave keys alone while a link inside has focus
    const last = count - 1;
    const next = { ArrowRight: Math.min(active + 1, last), ArrowLeft: Math.max(active - 1, 0), Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    goTo(next);
  };

  const carousel = phone && scrollable;
  return (
    <div className="recko-carousel">
      <div
        ref={track}
        className={cn("recko-carousel-track", className)}
        {...(carousel ? { role: "region", "aria-roledescription": "carousel", "aria-label": `${label}. Swipe sideways to see more.`, tabIndex: 0, onKeyDown } : {})}
      >
        {children}
      </div>
      {carousel && count > 1 && (
        <div className="recko-carousel-dots">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              className="recko-carousel-dot"
              aria-label={`Show item ${i + 1} of ${count}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
