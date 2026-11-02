import { menuLinks } from "@/data/home";
import { scrollToId } from "@/lib/scroll";
import { ArrowUp } from "lucide-react";

const socials = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "X / Twitter", href: "#" },
  { label: "Dribbble", href: "#" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr_auto] md:px-10">
        <div>
          <img src="/logo-light.png" alt="Recko Media" className="w-56" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Web design, AI automation and digital marketing â€” built together to grow your business.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Menu
          </p>
          <ul className="space-y-2">
            {menuLinks.map((link) => (
              <li key={link.index}>
                <button
                  type="button"
                  onClick={() => scrollToId(link.target)}
                  className="text-sm text-foreground/80 transition-colors hover:text-acid"
                >
                  {link.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Social
          </p>
          <ul className="space-y-2">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  className="text-sm text-foreground/80 transition-colors hover:text-acid"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:text-right">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Contact
          </p>
          <a
            href="mailto:hello@raytech.agency"
            className="text-sm text-foreground/80 transition-colors hover:text-acid"
          >
            hello@raytech.agency
          </a>
          <button
            type="button"
            onClick={() => scrollToId("#top")}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition-colors hover:border-acid hover:text-acid"
          >
            Back to top
            <ArrowUp className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
          <p>Â© {year} Recko Media. All rights reserved.</p>
          <p>Privacy notice â€” Cookies â€” Terms</p>
        </div>
      </div>
    </footer>
  );
}
