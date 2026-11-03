import { useEffect, useRef, useState, type PointerEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Pause, Play, X, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { galleryModes, galleryPosition, type GalleryMode } from "./gallery-layout";
import { showcaseProjects } from "./motion-showcase-data";
import { fitGallery } from "./animation-bounds";
import { useAnimationFit } from "./use-animation-fit";
import "./motion-showcase.css";

const cards = Array.from({ length: 12 }, (_, index) => ({
  ...showcaseProjects[index % showcaseProjects.length]!,
  key: `gallery-card-${index}`,
}));

export function MotionGallery() {
  const [mode, setMode] = useState<GalleryMode>("Helix");
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const rotor = useRef<HTMLDivElement>(null);
  const sceneScale = useRef<HTMLDivElement>(null);
  useAnimationFit(stage, sceneScale, fitGallery);
  const angle = useRef(0);
  const modeRef = useRef(mode);
  const pauseRef = useRef(false);
  const hovered = useRef(false);
  const visible = useRef(false);
  const drag = useRef<{ id: number; x: number; angle: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const selectedTrigger = useRef<HTMLButtonElement | null>(null);
  pauseRef.current = paused || selected !== null;
  modeRef.current = mode;

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!stage.current) return;
    angle.current = 0;
    const animations = [
      ...stage.current.querySelectorAll<HTMLElement>(".recko-motion-gallery-card"),
    ].map((card, index) =>
      gsap.to(card, {
        ...galleryPosition(mode, index, cards.length),
        duration: reduced ? 0 : 1.1,
        ease: "power3.inOut",
        overwrite: true,
      }),
    );
    return () => animations.forEach((animation) => animation.kill());
  }, [mode, reduced]);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry?.isIntersecting ?? false;
      },
      { rootMargin: "80px" },
    );
    observer.observe(element);
    const tick = (_time: number, delta: number) => {
      if (!visible.current || !rotor.current || document.hidden) return;
      if (!reduced && !pauseRef.current && !hovered.current && !drag.current)
        angle.current += Math.min(delta, 48) * 0.009;
      const ring = modeRef.current === "Ring";
      rotor.current.style.transform = `rotateX(${ring ? 0 : -8}deg) rotateY(${ring ? 0 : angle.current}deg) rotateZ(${ring ? angle.current : 0}deg)`;
    };
    gsap.ticker.add(tick);
    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [reduced]);

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, angle: angle.current, moved: false };
    suppressClick.current = false;
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const distance = event.clientX - current.x;
    if (Math.abs(distance) > 6) {
      current.moved = true;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (current.moved) angle.current = current.angle + distance * 0.35;
  }
  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
  }
  function changeMode(next: GalleryMode) {
    setMode(next);
  }
  const project = selected === null ? null : cards[selected];
  return (
    <section
      id="motion-gallery"
      className="recko-motion-gallery"
      aria-labelledby="recko-motion-gallery-title"
    >
      <div className="recko-motion-gallery-heading">
        <div>
          <p className="recko-motion-eyebrow">SHOWCASE / RECKO MEDIA</p>
          <h2 id="recko-motion-gallery-title" className="font-display">
            A different way to explore.
          </h2>
        </div>
        <button
          type="button"
          className="recko-motion-play"
          aria-label={paused ? "Play gallery rotation" : "Pause gallery rotation"}
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
          disabled={reduced}
        >
          {paused || reduced ? <Play size={15} /> : <Pause size={15} />}
        </button>
      </div>
      <div
        role="tabpanel"
        id="recko-gallery-panel"
        aria-labelledby={`recko-gallery-tab-${mode}`}
        className="recko-motion-stage"
        ref={stage}
        data-mode={mode}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
        onPointerEnter={() => {
          hovered.current = true;
        }}
        onPointerLeave={() => {
          hovered.current = false;
        }}
      >
        <div className="recko-motion-gallery-scale" ref={sceneScale}>
          <div className="recko-motion-gallery-rotor" ref={rotor}>
            {cards.map((card, index) => (
              <button
                type="button"
                key={card.key}
                className="recko-motion-gallery-card"
                aria-label={`Inspect ${card.title}, card ${index + 1}`}
                style={{
                  transform: `translate3d(${galleryPosition("Helix", index, cards.length).x}px, ${galleryPosition("Helix", index, cards.length).y}px, ${galleryPosition("Helix", index, cards.length).z}px) rotateY(${galleryPosition("Helix", index, cards.length).rotationY}deg)`,
                }}
                onFocus={() => {
                  hovered.current = true;
                }}
                onBlur={() => {
                  hovered.current = false;
                }}
                onClick={(event) => {
                  if (suppressClick.current && event.detail !== 0) {
                    suppressClick.current = false;
                    return;
                  }
                  selectedTrigger.current = event.currentTarget;
                  setSelected(index);
                }}
              >
                <img
                  src={card.src}
                  alt=""
                  width="150"
                  height="210"
                  loading="lazy"
                  draggable={false}
                />
                <span>{card.category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="recko-motion-gallery-bottom">
        <span className="recko-motion-tag">INTERACTIVE GALLERY</span>
        <div role="tablist" aria-label="Gallery arrangement" className="recko-motion-gallery-tabs">
          {galleryModes.map((name, index) => (
            <button
              type="button"
              role="tab"
              key={name}
              id={`recko-gallery-tab-${name}`}
              aria-selected={mode === name}
              aria-controls="recko-gallery-panel"
              tabIndex={mode === name ? 0 : -1}
              onClick={() => changeMode(name)}
              onKeyDown={(event) => {
                const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
                if (!keys.includes(event.key)) return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 3
                      : (index + (event.key === "ArrowRight" ? 1 : 3)) % 4;
                const name = galleryModes[next]!;
                changeMode(name);
                document.getElementById(`recko-gallery-tab-${name}`)?.focus();
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <p>{reduced ? "Select a card to explore" : "Drag to rotate · Select to explore"}</p>
      </div>
      <Dialog.Root
        open={project != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="recko-motion-detail-overlay" />
          <Dialog.Content
            className="recko-motion-detail"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              selectedTrigger.current?.focus();
            }}
          >
            <Dialog.Title className="font-display text-2xl font-semibold">
              {project?.title}
            </Dialog.Title>
            <Dialog.Description className="text-sm">{project?.description}</Dialog.Description>
            {project && <img src={project.src} alt={project.title} width="1024" height="768" />}
            <p className="text-xs">Creative preview using existing website assets.</p>
            <a href="#contact" onClick={() => setSelected(null)}>
              Discuss a similar project <ArrowUpRight size={15} />
            </a>
            <Dialog.Close aria-label="Close project preview" className="recko-motion-detail-close">
              <X size={20} />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
