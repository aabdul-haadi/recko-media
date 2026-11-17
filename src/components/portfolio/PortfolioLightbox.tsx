import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import type { PortfolioItem } from "@/lib/portfolio/portfolio";
import { signImage } from "@/lib/portfolio/portfolio";
import { canPrefetchImage } from "@/lib/portfolio/image-cache";
import {
  boundView,
  containImage,
  initialView,
  zoomAt,
  type Bounds,
  type View,
} from "@/lib/portfolio/geometry";
import { lockScroll } from "@/lib/scroll";
import "./portfolio.css";

type Props = {
  items: PortfolioItem[];
  initialIndex: number;
  onClose: () => void;
  returnFocus?: HTMLElement | null;
};
export default function PortfolioLightbox({ items, initialIndex, onClose, returnFocus }: Props) {
  useEffect(() => {
    lockScroll(true);
    return () => lockScroll(false);
  }, []);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(
      onClose,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180,
    );
    return () => window.clearTimeout(timer);
  }, [open, onClose]);
  const [index, setIndex] = useState(Math.min(initialIndex, items.length - 1));
  const item = items[Math.min(index, items.length - 1)]!;
  useEffect(() => {
    setIndex((i) => Math.min(i, items.length - 1));
  }, [items.length]);
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  const [view, setView] = useState<View>(initialView);
  const current = useRef(view);
  current.current = view;
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [bounds, setBounds] = useState<Bounds>({
    width: 1,
    height: 1,
    imageWidth: 1,
    imageHeight: 1,
  });
  const geometry = useRef(bounds);
  geometry.current = bounds;
  const cache = useRef(new Map<string, { url: string; expires: number }>());
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    distance: 0,
    pinched: false,
    startedAt: 0,
  });
  const [dragging, setDragging] = useState(false);
  const navigate = (delta: number) => {
    pointers.current.clear();
    setDragging(false);
    setIndex((i) => (i + delta + items.length) % items.length);
  };

  useEffect(() => {
    let active = true;
    setUrl("");
    setError(false);
    setLoaded(false);
    setView(initialView);
    async function getImage(path: string) {
      if (item.status === "published") return signImage(path, true, retry > 0);
      const cached = cache.current.get(path);
      if (cached && cached.expires > Date.now()) return cached.url;
      const signed = await signImage(path);
      // Bound memory / retained signed URL count; only current and immediate neighbor need warming.
      if (cache.current.size > 6) cache.current.clear();
      cache.current.set(path, { url: signed, expires: Date.now() + 3000000 });
      return signed;
    }
    getImage(item.image_path)
      .then((signed) => {
        if (active) setUrl(signed);
      })
      .catch(() => active && setError(true));
    // Warm only the next image, after the current image has loaded (see separate effect).
    return () => {
      active = false;
    };
  }, [item.image_path, item.status, retry]);

  useEffect(() => {
    const connection =
      "connection" in navigator
        ? (navigator.connection as {
            saveData?: boolean;
            effectiveType?: string;
            downlink?: number;
          })
        : undefined;
    if (!loaded || items.length < 2 || !canPrefetchImage(connection)) return;
    const next = items[(index + 1) % items.length]!;
    let active = true;
    const timer = setTimeout(() => {
      signImage(next.image_path, next.status === "published")
        .then((signed) => {
          if (!active) return;
          if (next.status !== "published") {
            if (cache.current.size > 6) cache.current.clear();
            cache.current.set(next.image_path, { url: signed, expires: Date.now() + 3000000 });
          }
          const image = new Image();
          image.fetchPriority = "low";
          image.decoding = "async";
          image.src = signed;
        })
        .catch(() => {});
    }, 800);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [loaded, index, items]);

  useEffect(() => {
    const el = stage;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const fit = containImage(item.width, item.height, rect.width, rect.height);
      const next = {
        width: rect.width,
        height: rect.height,
        imageWidth: fit.width,
        imageHeight: fit.height,
      };
      setBounds(next);
      setView((v) => boundView(v, next));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [stage, item.width, item.height]);

  useEffect(() => {
    const el = stage;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = el.getBoundingClientRect();
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
      setView((v) =>
        zoomAt(
          v,
          Math.exp(-event.deltaY * units * 0.002),
          event.clientX - rect.left - rect.width / 2,
          event.clientY - rect.top - rect.height / 2,
          geometry.current,
        ),
      );
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [stage]);

  const zoom = (factor: number) => setView((v) => zoomAt(v, factor, 0, 0, bounds));
  function pointDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (pointers.current.size === 1) {
      Object.assign(g, {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        pinched: false,
        startedAt: Date.now(),
      });
      setDragging(true);
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      g.distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      g.pinched = true;
    }
  }
  function pointMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    const g = gesture.current;
    const old = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const factor = distance / Math.max(g.distance, 1);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (a!.x + b!.x) / 2 - rect.left - rect.width / 2,
        y = (a!.y + b!.y) / 2 - rect.top - rect.height / 2;
      setView((v) =>
        zoomAt(
          { ...v, x: v.x + (e.clientX - old.x) / 2, y: v.y + (e.clientY - old.y) / 2 },
          factor,
          x,
          y,
          geometry.current,
        ),
      );
      g.distance = distance;
    } else if (current.current.scale > 1) {
      setView((v) =>
        boundView(
          { ...v, x: v.x + e.clientX - old.x, y: v.y + e.clientY - old.y },
          geometry.current,
        ),
      );
    }
    g.lastX = e.clientX;
    g.lastY = e.clientY;
  }
  function pointUp(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    if (!pointers.current.size) {
      setDragging(false);
      if (
        e.type !== "pointercancel" &&
        e.pointerType !== "mouse" &&
        !g.pinched &&
        current.current.scale === 1 &&
        Date.now() - g.startedAt < 1200 &&
        Math.abs(e.clientX - g.startX) > 60 &&
        Math.abs(e.clientX - g.startX) > Math.abs(e.clientY - g.startY) * 1.5
      )
        navigate(e.clientX < g.startX ? 1 : -1);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="portfolio-overlay" />
        <Dialog.Content
          className="portfolio-lightbox"
          data-lenis-prevent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocus?.focus();
          }}
          onKeyDown={(e) => {
            if (
              (e.target as HTMLElement).matches("input,textarea,select") ||
              e.ctrlKey ||
              e.metaKey ||
              e.altKey
            )
              return;
            if (["ArrowLeft", "ArrowRight", "+", "=", "-", "0"].includes(e.key)) e.preventDefault();
            if (e.key === "ArrowLeft") navigate(-1);
            if (e.key === "ArrowRight") navigate(1);
            if (e.key === "+" || e.key === "=") zoom(1.3);
            if (e.key === "-") zoom(1 / 1.3);
            if (e.key === "0") setView(initialView);
          }}
        >
          <header className="portfolio-viewer-header">
            <div>
              <Dialog.Title>{item.title}</Dialog.Title>
              <Dialog.Description>
                {item.category} / {index + 1} / {items.length}
              </Dialog.Description>
            </div>
            <Dialog.Close className="portfolio-control" aria-label="Close image viewer">
              <X />
            </Dialog.Close>
          </header>
          <div
            className="portfolio-stage"
            ref={setStage}
            data-zoom={view.scale.toFixed(2)}
            onPointerDown={pointDown}
            onPointerMove={pointMove}
            onPointerUp={pointUp}
            onPointerCancel={pointUp}
            style={{ cursor: view.scale > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
          >
            {!loaded && !error && (
              <p className="portfolio-viewer-status" role="status">
                Loading full image...
              </p>
            )}
            {error ? (
              <div className="portfolio-viewer-status" role="alert">
                Image unavailable.
                <button
                  onClick={() => {
                    cache.current.delete(item.image_path);
                    setRetry((n) => n + 1);
                  }}
                >
                  Try again
                </button>
              </div>
            ) : (
              url && (
                <img
                  key={url}
                  src={url}
                  fetchPriority="high"
                  decoding="async"
                  alt={item.alt}
                  draggable={false}
                  onLoad={() => setLoaded(true)}
                  onError={() => setError(true)}
                  style={{
                    width: bounds.imageWidth,
                    height: bounds.imageHeight,
                    opacity: loaded ? 1 : 0,
                    transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px)) scale(${view.scale})`,
                  }}
                />
              )
            )}
          </div>
          {items.length > 1 && (
            <>
              <button
                className="portfolio-control portfolio-prev"
                aria-label="Previous image"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft />
              </button>
              <button
                className="portfolio-control portfolio-next"
                aria-label="Next image"
                onClick={() => navigate(1)}
              >
                <ChevronRight />
              </button>
            </>
          )}
          <footer className="portfolio-viewer-footer">
            <p>{item.description}</p>
            <div className="portfolio-zoom-controls">
              <button
                className="portfolio-control"
                aria-label="Zoom out"
                disabled={view.scale <= 1}
                onClick={() => zoom(1 / 1.3)}
              >
                <Minus />
              </button>
              <output aria-label="Zoom level">{Math.round(view.scale * 100)}%</output>
              <button
                className="portfolio-control"
                aria-label="Zoom in"
                disabled={view.scale >= 12}
                onClick={() => zoom(1.3)}
              >
                <Plus />
              </button>
              <button
                className="portfolio-control"
                aria-label="Reset zoom"
                onClick={() => setView(initialView)}
              >
                <RotateCcw />
              </button>
            </div>
            <span className="portfolio-hint">Scroll to zoom / Drag to explore</span>
          </footer>
          <span className="sr-only" role="status" aria-live="polite">
            Image {index + 1} of {items.length}: {item.title}
          </span>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
