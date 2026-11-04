import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import gsap from "gsap";
import { showcaseProjects } from "./motion-showcase-data";
import { fitPreviewStack, stackOffset } from "./animation-bounds";
import { useAnimationFit } from "./use-animation-fit";
import "./motion-showcase.css";

const stackProjects = Array.from(
  { length: 7 },
  (_, index) => showcaseProjects[index % showcaseProjects.length]!,
);

export function MotionHighlights() {
  const stage = useRef<HTMLDivElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const stackViewport = useRef<HTMLDivElement>(null);
  useAnimationFit(stackViewport, stack, fitPreviewStack);
  const [active, setActive] = useState(3);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const hovered = useRef(false);
  const visible = useRef(false);
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    let last = -Infinity;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      event.stopPropagation();
      if (performance.now() - last < 450) return;
      last = performance.now();
      setActive(
        (value) => (value + (delta > 0 ? 1 : -1) + stackProjects.length) % stackProjects.length,
      );
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry?.isIntersecting ?? false;
    });
    if (stack.current) observer.observe(stack.current);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", sync);
    };
  }, []);
  useEffect(() => {
    if (!playing || reduced) return;
    const timer = setInterval(() => {
      if (visible.current && !hovered.current && !document.hidden)
        setActive((value) => (value + 1) % stackProjects.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [playing, reduced]);
  useEffect(() => {
    if (!stack.current) return;
    const animations = [
      ...stack.current.querySelectorAll<HTMLElement>(".recko-motion-stack-card"),
    ].map((card, index) => {
      const offset = stackOffset(index, active, stackProjects.length);
      return gsap.to(card, {
        x: offset * 43,
        z: -Math.abs(offset) * 42,
        rotationY: offset === 0 ? 0 : offset > 0 ? -24 : 24,
        scale: offset === 0 ? 1 : 0.92,
        opacity: Math.max(0.25, 1 - Math.abs(offset) * 0.18),
        duration: reduced ? 0 : 0.7,
        ease: "power3.out",
        overwrite: true,
      });
    });
    return () => animations.forEach((animation) => animation.kill());
  }, [active, reduced]);
  const choose = (direction: number) =>
    setActive((value) => (value + direction + stackProjects.length) % stackProjects.length);
  return (
    <section className="recko-motion-highlights" aria-label="Creative previews">
      <article className="recko-motion-feature">
        <div
          ref={stage}
          className="recko-motion-stack-stage"
          aria-label="Interactive project card stack"
          onPointerEnter={() => {
            hovered.current = true;
          }}
          onPointerLeave={() => {
            hovered.current = false;
          }}
          onFocus={() => {
            hovered.current = true;
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) hovered.current = false;
          }}
        >
          <div className="recko-motion-stack-viewport" ref={stackViewport}>
            <div className="recko-motion-stack" ref={stack}>
              {stackProjects.map((project, index) => (
                <button
                  key={`${project.id}-${index}`}
                  type="button"
                  className="recko-motion-stack-card"
                  aria-label={`Show ${project.title}, preview ${index + 1}`}
                  aria-pressed={active === index}
                  onClick={() => setActive(index)}
                  style={{
                    zIndex: 10 - Math.abs(stackOffset(index, active, stackProjects.length)),
                  }}
                >
                  <img
                    src={project.src}
                    alt={project.title}
                    width="240"
                    height="320"
                    loading="lazy"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="recko-motion-stack-controls">
            <button type="button" aria-label="Previous preview" onClick={() => choose(-1)}>
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              aria-label={playing ? "Pause preview rotation" : "Play preview rotation"}
              aria-pressed={!playing}
              disabled={reduced}
              onClick={() => setPlaying((value) => !value)}
            >
              {playing && !reduced ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <span>
              0{active + 1} / 0{stackProjects.length}
            </span>
            <button type="button" aria-label="Next preview" onClick={() => choose(1)}>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="recko-motion-feature-copy">
          <span className="recko-motion-tag">CREATIVE</span>
          <h2 className="font-display">A new perspective on your brand.</h2>
          <p className="text-sm leading-relaxed">
            Considered design, expressive campaigns and digital experiences. Explore our work
            from every angle.
          </p>
          <a href="#work">
            EXPLORE OUR WORK <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </div>
      </article>
      <article className="recko-motion-feature">
        <div className="recko-motion-vault" aria-label="Animated selection of project concepts">
          {[0, 1, 2].map((column) => (
            <div className="recko-motion-vault-window" key={column}>
              <div
                className={`recko-motion-vault-track recko-motion-vault-track-${column}`}
                aria-hidden="true"
              >
                {Array.from({ length: 8 }, (_, index) => {
                  const project = showcaseProjects[(index + column) % showcaseProjects.length]!;
                  return (
                    <img
                      src={project.src}
                      alt=""
                      key={index}
                      width="240"
                      height="180"
                      loading="lazy"
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="recko-motion-feature-copy">
          <span className="recko-motion-tag">POSSIBILITIES</span>
          <h2 className="font-display">Ideas with room to move.</h2>
          <p className="text-sm leading-relaxed">
            From a sharper website to a more connected workflow, find the right direction for your
            next project.
          </p>
          <a href="#contact">
            LET’S BUILD SOMETHING <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </div>
      </article>
    </section>
  );
}
