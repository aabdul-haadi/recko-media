import "./inner-visuals.css";
import { ArrowRight, Clock3, Mail, MapPin } from "lucide-react";
import { PageFrame, PageHero } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";
import { InquiryForm } from "@/components/forms/InquiryForm";

export function ContactPage() {
  return (
    <PageFrame>
      <PageHero
        eyebrow="Contact / Start the conversation"
        title="Tell us what you’re working toward."
        description="Share the opportunity, the problem or the idea you want to explore. We’ll start with a useful conversation about what could come next."
      />

      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[0.75fr_1.25fr] md:gap-20 md:px-10">
          <aside className="recko-contact-aside">
            <div className="recko-contact-art" aria-label="A starting point for your next project">
              <div className="recko-contact-art-top">
                <span className="recko-page-label">Your next chapter</span>
                <ArrowRight size={22} aria-hidden="true" />
              </div>
              <h2>
                Big idea?
                <br />
                Small question?
                <br />
                <span>Start here.</span>
              </h2>
              <div className="recko-contact-art-images" aria-hidden="true">
                <img src="/thumbs/work-snack.jpg" alt="" width="320" height="240" />
                <img src="/thumbs/work-fashion.jpg" alt="" width="320" height="240" />
                <img src="/thumbs/work-dashboard.jpg" alt="" width="320" height="240" />
              </div>
            </div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Reach the team
              </p>
              <a
                href="mailto:team@reckomedia.com"
                className="recko-contact-email mt-4 inline-flex items-center gap-3 text-lg font-medium transition-colors hover:text-primary sm:text-xl"
              >
                <Mail className="size-5 text-primary" />
                team@reckomedia.com
              </a>
            </Reveal>
            <div className="mt-10 space-y-6 border-t border-border pt-7">
              <Reveal delay={80}>
                <div className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-primary">
                    <Clock3 className="size-4" />
                  </span>
                  <div>
                    <h2 className="font-semibold">A good first step</h2>
                    <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      Tell us a little about your goals and we’ll help focus the conversation.
                    </p>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={160}>
                <div className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-primary">
                    <MapPin className="size-4" />
                  </span>
                  <div>
                    <h2 className="font-semibold">Working together</h2>
                    <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      Remote-friendly collaboration, built around your team and time zone.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </aside>

          <Reveal>
            <InquiryForm source="contact-page" />
          </Reveal>
        </div>
      </section>
    </PageFrame>
  );
}
