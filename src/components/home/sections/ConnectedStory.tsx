import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { About } from "./About";
import { Partnership } from "./Partnership";
import "./connected-story.css";

gsap.registerPlugin(ScrollTrigger);

/** One scroll-linked rail shared by two independently editable sections. */
export function ConnectedStory() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const rail = element.querySelector<HTMLElement>(".recko-story-rail-fill");
        if (rail) {
          gsap.fromTo(
            rail,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: "top 55%",
                end: "bottom 55%",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }
        element.querySelectorAll<HTMLElement>(".recko-story-marker").forEach((marker) => {
          gsap.fromTo(
            marker,
            { scale: 0.45, opacity: 0.25 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.35,
              ease: "power2.out",
              scrollTrigger: {
                trigger: marker,
                start: "top 65%",
                toggleActions: "play none none reverse",
              },
            },
          );
        });
        element
          .querySelectorAll<HTMLElement>(
            ".recko-story-brand, .recko-story-description, .recko-story-partnership-copy, .recko-story-activities, .recko-story-cta",
          )
          .forEach((content, index) => {
            gsap.from(content, {
              y: 14,
              duration: 0.55,
              delay: (index % 3) * 0.05,
              ease: "power2.out",
              scrollTrigger: { trigger: content, start: "top 93%", once: true },
            });
          });
      });
    }, element);
    return () => {
      media.revert();
      context.revert();
    };
  }, []);
  return (
    <div ref={root} className="recko-connected-story">
      <div className="recko-story-rail" aria-hidden="true">
        <div className="recko-story-rail-fill" />
      </div>
      <About />
      <Partnership />
    </div>
  );
}
