import { BrandLogo } from "./BrandLogo";
import { menuLinks } from "@/data/home";
import { Link } from "@tanstack/react-router";
import { getLenis } from "@/lib/scroll";
import { ArrowUp, ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";

const socials = [
  { label: "Instagram", href: "#" },
  { label: "Facebook", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "WhatsApp", href: "#" },
];

const footerServices = [
  "Branding & Identity",
  "Content Production",
  "Social Media Marketing",
  "Paid Advertising",
  "SEO",
  "Website Design & Development",
  "AI Automation",
];

const legal = ["Privacy Policy", "Cookies", "Terms"];

const heading =
  "mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground";
const linkClass =
  "group inline-flex items-center gap-1.5 text-sm text-foreground/80 transition-all duration-300 hover:translate-x-1 hover:text-acid";

function scrollToTop() {
  const lenis = getLenis();
  if (lenis) {
    // Ease-in-out cubic with a duration that grows a little on long pages.
    lenis.scrollTo(0, {
      duration: Math.min(2.4, 1.2 + window.scrollY / 6000),
      easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    });
    return;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="recko-footer border-t border-border">
      {/* Call to action band */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-10">
          <p className="font-display text-2xl leading-tight md:text-4xl">
            Ready to grow? <span className="text-acid">Let&rsquo;s talk.</span>
          </p>
          <a
            href="mailto:team@reckomedia.com"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors duration-300 hover:border-acid hover:text-acid"
          >
            Build your brief
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:grid-cols-2 md:px-10 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_minmax(0,1.3fr)]">
        <div>
          <BrandLogo variant="ink" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Web design, AI automation and digital marketing, built together to grow your business.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className={heading}>
            <span className="size-1.5 rounded-full bg-acid" aria-hidden="true" />
            Menu
          </p>
          <ul className="space-y-3">
            {menuLinks.map((link) => (
              <li key={link.index}>
                <Link
                  to={link.target as "/" | "/services" | "/portfolio" | "/about" | "/contact"}
                  className={linkClass}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className={heading}>
            <span className="size-1.5 rounded-full bg-acid" aria-hidden="true" />
            Services
          </p>
          <ul className="space-y-3">
            {footerServices.map((name) => (
              <li key={name}>
                <Link to="/services" className={linkClass}>
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={heading}>
            <span className="size-1.5 rounded-full bg-acid" aria-hidden="true" />
            Social
          </p>
          <ul className="space-y-3">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} className={linkClass}>
                  {s.label}
                  <ArrowUpRight
                    className="size-3.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <p className={heading}>
            <span className="size-1.5 rounded-full bg-acid" aria-hidden="true" />
            Contact
          </p>
          <ul className="space-y-4 text-sm text-foreground/80">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-acid" aria-hidden="true" />
              <a
                href="mailto:team@reckomedia.com"
                className="wrap-anywhere transition-colors hover:text-acid"
              >
                team@reckomedia.com
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-acid" aria-hidden="true" />
              <a href="tel:03272514632" className="transition-colors hover:text-acid">
                0327 2514632
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-acid" aria-hidden="true" />
              <span>Karachi, Pakistan</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
          <p>© {year} ReckoMEDIA. All rights reserved.</p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {legal.map((item) => (
              <li key={item}>
                <a href="#" className="transition-colors hover:text-acid">
                  {item}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-medium text-foreground transition-colors hover:border-acid hover:text-acid"
              >
                Back to top
                <ArrowUp className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
