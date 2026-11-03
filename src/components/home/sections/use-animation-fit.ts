import { useEffect, type RefObject } from "react";

/** Measure the animation's own viewport, never the document or transformed cards. */
export function useAnimationFit(
  viewport: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
  fit: (width: number, height: number) => number,
) {
  useEffect(() => {
    const element = viewport.current;
    const target = content.current;
    if (!element || !target) return;
    const update = (width: number, height: number) => {
      if (width > 0 && height > 0)
        target.style.setProperty("--animation-fit", String(fit(width, height)));
    };
    update(element.clientWidth, element.clientHeight);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) update(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [viewport, content, fit]);
}
