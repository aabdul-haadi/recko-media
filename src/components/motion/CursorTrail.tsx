import { useEffect, useRef } from "react";

type CursorTrailProps = {
  images: string[];
  /** Distance the pointer must travel before the next image spawns. */
  spacing?: number;
};

/**
 * Spawns a fading image at the pointer as it moves across the parent
 * section — the signature "image trail" hover effect.
 */
export function CursorTrail({ images, spacing = 110 }: CursorTrailProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const section = host?.parentElement;
    if (!host || !section) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const COUNT = 10;
    const pool: HTMLDivElement[] = [];
    for (let i = 0; i < COUNT; i++) {
      const d = document.createElement("div");
      d.className = "cursor-trail-item";
      host.appendChild(d);
      pool.push(d);
    }

    let last = { x: -9999, y: -9999 };
    let index = 0;

    const onMove = (e: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      if (Math.hypot(x - last.x, y - last.y) < spacing) return;
      last = { x, y };

      const item = pool[(index % COUNT) as number];
      if (!item) return;
      item.style.backgroundImage = `url(${images[index % images.length]})`;
      index += 1;

      item.animate(
        [
          {
            opacity: 0,
            transform: `translate(${x - 115}px, ${y - 80}px) scale(0.4) rotate(-6deg)`,
          },
          {
            opacity: 1,
            transform: `translate(${x - 115}px, ${y - 80}px) scale(1) rotate(2deg)`,
            offset: 0.25,
          },
          {
            opacity: 0,
            transform: `translate(${x - 115}px, ${y + 20}px) scale(0.92) rotate(5deg)`,
          },
        ],
        { duration: 1000, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    };

    section.addEventListener("pointermove", onMove);
    return () => {
      section.removeEventListener("pointermove", onMove);
      pool.forEach((d) => d.remove());
    };
  }, [images, spacing]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    />
  );
}
