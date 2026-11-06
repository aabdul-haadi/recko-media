import { lazy, Suspense, useEffect, useRef, useState } from "react";

const MotionHighlights = lazy(() =>
  import("./sections/MotionHighlights").then((module) => ({ default: module.MotionHighlights })),
);

/** Keep the below-fold animated scene out of the initial render and download. */
export function DeferredMotionHighlights() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="recko-deferred-highlights">
      <Suspense fallback={null}>{ready ? <MotionHighlights /> : null}</Suspense>
    </div>
  );
}
