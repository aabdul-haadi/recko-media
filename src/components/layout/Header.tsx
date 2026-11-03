import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { menuLinks } from "@/data/home";
import { lockScroll } from "@/lib/scroll";
import { cn } from "@/lib/utils";

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
          <Link to="/" onClick={() => setOpen(false)} className="group flex items-start gap-1.5 text-left" aria-label="Recko Media home">
            <img
              src="/logo-light.png"
              alt="Recko Media"
              className="w-36 transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </Link>

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
            <Link
              key={link.index}
              to={link.target as "/" | "/services" | "/portfolio" | "/about" | "/contact"}
              onClick={() => setOpen(false)}
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
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
