import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { menuLinks } from "@/data/home";
import { lockScroll, scrollToId } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";
import "./header-menu.css";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    lockScroll(open);
    return () => lockScroll(false);
  }, [open]);

  useEffect(() => () => clearTimeout(navigationTimer.current), []);

  const go = (target: string) => {
    setOpen(false);
    clearTimeout(navigationTimer.current);
    // Let the dialog release the scroll lock before navigating.
    navigationTimer.current = setTimeout(() => {
      if (target.startsWith("/")) {
        window.location.assign(target);
      } else if (document.querySelector(target)) {
        scrollToId(target);
      } else {
        window.location.assign(`/${target}`);
      }
    }, 60);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <header
        className={cn(
          "recko-site-header fixed inset-x-0 top-0 z-50 bg-background text-foreground transition-colors duration-300",
          scrolled && !open ? "border-b border-border" : "border-b border-transparent",
        )}
      >
        <div className="flex h-20 items-center justify-between px-5 md:px-10">
          <button
            type="button"
            onClick={() => go("#top")}
            className="group flex items-start gap-1.5 text-left"
            aria-label="Back to top"
          >
            <BrandLogo />
          </button>
          <div className="flex items-center gap-4 md:gap-6">
            <Dialog.Trigger asChild>
              <button type="button" className="group flex items-center gap-3 text-sm font-medium">
                <span className="transition-colors group-hover:text-acid">Menu</span>
                <span className="grid grid-cols-2 gap-1" aria-hidden>
                  {[0, 1, 2, 3].map((index) => (
                    <span
                      key={index}
                      className={cn(
                        "size-2 rounded-[2px] transition-colors duration-300",
                        index === 1 ? "bg-acid" : "bg-foreground/25 group-hover:bg-acid",
                      )}
                    />
                  ))}
                </span>
              </button>
            </Dialog.Trigger>
          </div>
        </div>
      </header>
      <Dialog.Portal>
        <Dialog.Overlay className="recko-menu-backdrop" />
        <Dialog.Content className="recko-menu-drawer" data-lenis-prevent>
          <div className="recko-menu-top">
            <Dialog.Title className="recko-menu-label">
              <span aria-hidden="true" /> MENU / 01–05
            </Dialog.Title>
            <Dialog.Close className="recko-menu-close text-sm">
              Close <X size={18} strokeWidth={1} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Navigate to a section of the website.
          </Dialog.Description>
          <nav className="recko-menu-links" aria-label="Main navigation">
            {menuLinks.map((link) => (
              <button
                key={link.index}
                type="button"
                onClick={() => go(link.target)}
                className="recko-menu-link"
                aria-label={link.name}
                title={link.detail}
              >
                <span className="recko-menu-index" aria-hidden="true">
                  {link.index}
                </span>
                <span className="recko-menu-item-title font-display">{link.name}</span>
                {link.index === "01" && (
                  <span className="recko-menu-note" aria-hidden="true">
                    [DIRECTION]
                  </span>
                )}
                {link.index === "05" && (
                  <span className="recko-menu-note" aria-hidden="true">
                    [ACTION]
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="recko-menu-bottom">
            <button type="button" onClick={() => go("#work")}>
              SELECTED PROJECTS ↗
            </button>
            <span aria-hidden="true">/</span>
            <span>RECKOMEDIA</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
