import { useEffect, useRef, useState, type ElementType } from "react";

type SplitRevealProps = {
  text: string;
  as?: ElementType;
  className?: string;
  /** Extra classes applied to every character span (e.g. per-char textures). */
  charClassName?: string;
  /** Animate on mount (hero) instead of when scrolled into view. */
  immediate?: boolean;
  /** Base delay in seconds before the first character moves. */
  delay?: number;
  /** Delay between characters in seconds. */
  stagger?: number;
};

/**
 * Splits text into words and characters, each character masked by its
 * overflowing word wrapper, then slides them up with a staggered ease.
 * Driven by CSS transitions so it never depends on the JS ticker.
 */
export function SplitReveal({
  text,
  as: Tag = "span",
  className,
  charClassName,
  immediate = false,
  delay = 0,
  stagger = 0.018,
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    if (immediate) {
      const t = window.setTimeout(() => setRevealed(true), 80);
      return () => window.clearTimeout(t);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate, text]);

  const words = text.split(" ");
  let charIndex = 0;

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((word, wi) => {
        const wordStart = charIndex;
        charIndex += Array.from(word).length + 1;
        return (
          <span
            key={wi}
            aria-hidden
            className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em]"
          >
            <span className="inline-block whitespace-nowrap">
              {Array.from(word).map((ch, ci) => (
                <span
                  key={ci}
                  className={
                    "inline-block will-change-transform transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] " +
                    (charClassName ?? "")
                  }
                  style={{
                    transform: revealed ? "translateY(0)" : "translateY(120%)",
                    transitionDelay: `${Math.round((delay + (wordStart + ci) * stagger) * 1000)}ms`,
                  }}
                >
                  {ch}
                </span>
              ))}
              {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}

/** Eyebrow / label / paragraph fade-up used across sections. */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-revealed");
            io.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={
        "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] will-change-transform opacity-0 translate-y-8 " +
        "[&.is-revealed]:opacity-100 [&.is-revealed]:translate-y-0 " +
        (className ?? "")
      }
    >
      {children}
    </Tag>
  );
}
