import { useEffect, useState } from "react";
import { menuLinks } from "@/data/home";
import { scrollToId, lockScroll } from "@/lib/scroll";
import { cn } from "@/lib/utils";

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path d="M6 4h16l-9 10h11L8 28l5-12H4L6 4Z" fill="currentColor" />
    </svg>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    lockScroll(open);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [open]);

  const go = (target: string) => {
    setOpen(false);
    // Wait for the overlay to start closing before scrolling.
    window.setTimeout(() => scrollToId(target), 60);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled && !open
            ? "border-b border-border bg-background/80 backdrop-blur-md"
            : "border-b border-transparent",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 md:h-20 md:px-10">
          <button
            type="button"
            onClick={() => go("#top")}
            className="group flex items-start gap-1.5 text-left"
            aria-label="Back to top"
          >
            <LogoMark className="mt-0.5 size-7 text-acid transition-transform duration-500 group-hover:rotate-[-8deg]" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-bold lowercase tracking-tight">
                raytech
              </span>
              <span className="text-[0.55rem] font-medium uppercase tracking-[0.35em] text-muted-foreground">
                agency
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="group flex items-center gap-3 text-sm font-medium"
            aria-expanded={open}
          >
            <span className="transition-colors group-hover:text-acid">
              {open ? "Close" : "Menu"}
            </span>
            <span className="grid grid-cols-2 gap-1" aria-hidden>
              <span
                className={cn(
                  "size-2 rounded-[2px] transition-all duration-300",
                  open ? "bg-acid" : "bg-foreground/25 group-hover:bg-acid",
                )}
              />
              <span
                className={cn(
                  "size-2 rounded-[2px] transition-all duration-300",
                  open ? "bg-acid" : "bg-acid",
                )}
              />
              <span
                className={cn(
                  "size-2 rounded-[2px] transition-all duration-300",
                  open ? "bg-acid" : "bg-foreground/25 group-hover:bg-acid",
                )}
              />
              <span
                className={cn(
                  "size-2 rounded-[2px] transition-all duration-300",
                  open ? "bg-acid" : "bg-foreground/25 group-hover:bg-acid",
                )}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Full-screen menu overlay */}
      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-40 flex flex-col justify-center bg-background/95 px-6 backdrop-blur-xl transition-[opacity,visibility] duration-500 md:px-16",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <p className="mb-8 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Navigation — 01–05
        </p>
        <nav className="flex flex-col">
          {menuLinks.map((link, i) => (
            <button
              key={link.index}
              type="button"
              onClick={() => go(link.target)}
              tabIndex={open ? 0 : -1}
              className="group flex items-baseline gap-4 border-t border-border py-4 text-left transition-all duration-500 md:gap-8 md:py-5"
              style={{
                transitionDelay: `${i * 60}ms`,
                opacity: open ? 1 : 0,
                transform: open ? "translateY(0)" : "translateY(24px)",
              }}
            >
              <span className="font-mono text-xs text-acid">{link.index}</span>
              <span className="font-display text-4xl font-bold tracking-tight transition-all duration-300 group-hover:translate-x-3 group-hover:text-acid md:text-6xl">
                {link.name}
              </span>
              <span className="ml-auto hidden max-w-48 text-right text-xs text-muted-foreground md:block">
                {link.detail}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
