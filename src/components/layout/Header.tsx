import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Menu, ArrowUpRight } from "lucide-react";
import { menuLinks } from "@/data/home";
import { lockScroll, scrollToId } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";
import "./header-menu.css";

export function Header() {
  const router = useRouter({ warn: false });
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

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const go = (target: string) => {
    setOpen(false);
    clearTimeout(navigationTimer.current);
    // Let the dialog release the scroll lock before navigating.
    navigationTimer.current = setTimeout(() => {
      if (target.startsWith("/")) {
        if (router) void router.navigate({ href: target });
        else window.location.assign(target);
      } else if (document.querySelector(target)) {
        scrollToId(target);
      } else {
        window.location.assign(`/${target}`);
      }
    }, 60);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <header className={cn("recko-site-header", scrolled && "recko-header-scrolled")}>
        <div className="recko-header-bar">
          <a
            href="/"
            className="recko-header-brand"
            onClick={(event) => {
              if (
                router &&
                event.button === 0 &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                void router.navigate({ href: "/" });
              }
            }}
            aria-label="Recko Media home"
          >
            <BrandLogo />
          </a>
          <nav className="recko-desktop-nav" aria-label="Main navigation">
            {menuLinks.map((link) => (
              <a
                key={link.index}
                href={link.target}
                title={link.detail}
                onClick={(event) => {
                  if (
                    router &&
                    event.button === 0 &&
                    !event.ctrlKey &&
                    !event.metaKey &&
                    !event.shiftKey &&
                    !event.altKey
                  ) {
                    event.preventDefault();
                    void router.navigate({ href: link.target });
                  }
                }}
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="recko-header-actions">
            <a
              href="/contact"
              className="recko-header-contact"
              onClick={(event) => {
                if (
                  router &&
                  event.button === 0 &&
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.shiftKey &&
                  !event.altKey
                ) {
                  event.preventDefault();
                  void router.navigate({ href: "/contact" });
                }
              }}
            >
              Let's talk <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <Dialog.Trigger asChild>
              <button type="button" className="recko-header-menu-trigger">
                <span>Menu</span>
                <Menu size={20} aria-hidden="true" />
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
              <span aria-hidden="true" /> Navigation
            </Dialog.Title>
            <Dialog.Close className="recko-menu-close text-sm">
              Close <X size={18} strokeWidth={1} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Explore Recko Media pages and selected projects.
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
