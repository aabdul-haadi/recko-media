import { Reveal } from "@/components/motion/SplitReveal";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { safeUrl, useSection } from "@/lib/content/content";

export function Contact() {
  const { data: c } = useSection("contact");
  return (
    <section
      id="contact"
      className="recko-contact-section relative overflow-hidden border-t border-border py-14 md:py-20"
    >
      <div className="recko-contact-orbit" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl px-5 text-center md:px-10">
        <Reveal>
          <p className="recko-brand-label mb-8 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {c["eyebrow"]}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mb-8">{c["heading"]}</h2>
        </Reveal>
        <Reveal delay={100}>
          <a href={safeUrl(c["cta_url"], "mailto:team@reckomedia.com")} className="recko-contact-cta group">
            <span className="inline-block text-acid transition-transform duration-500 group-hover:-translate-x-3">
              [
            </span>
            <span className="contact-typewriter mx-2 inline-block whitespace-nowrap transition-colors duration-500 group-hover:text-acid md:mx-4">
              {c["cta_label"]}
            </span>
            <span className="contact-bracket contact-bracket-right inline-block text-acid transition-transform duration-500">
              ]
            </span>
          </a>
        </Reveal>

        <Reveal delay={220}>
          <p className="mx-auto mt-8 max-w-md text-base text-muted-foreground md:text-lg">
            {c["text"]}
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mx-auto mt-14 max-w-3xl text-left">
            <InquiryForm source="home-page" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
