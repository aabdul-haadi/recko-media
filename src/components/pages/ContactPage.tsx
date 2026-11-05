import "./inner-visuals.css";
import { useState, type FormEvent } from "react";
import { ArrowRight, Clock3, Mail, MapPin } from "lucide-react";
import { PageFrame, PageHero } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";
import { isSupabaseConfigured } from "@/lib/supabase";
import { submitInquiry } from "@/lib/inquiries";

const inputClass =
  "mt-2 w-full rounded-lg border border-border bg-background px-4 py-3.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20";

export function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function sendInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const field = (key: string) => String(form.get(key) ?? "").trim();
    setStatus("sending");
    setErrorMessage("");

    if (!isSupabaseConfigured()) {
      // Local/preview builds without Supabase keep the original email-app behaviour.
      const body = [
        `Name: ${field("name")}`,
        `Email: ${field("email")}`,
        `Company: ${field("company") || "Not provided"}`,
        `Interested in: ${field("service")}`,
        "",
        "Project details:",
        field("message"),
      ].join("\n");
      window.location.href = `mailto:team@reckomedia.com?subject=${encodeURIComponent(`Project inquiry from ${field("name")}`)}&body=${encodeURIComponent(body)}`;
      setStatus("sent");
      return;
    }

    try {
      await submitInquiry({
        name: field("name"),
        email: field("email"),
        company: field("company"),
        service: field("service"),
        message: field("message"),
        subject: `Project inquiry from ${field("name")}`,
        source: "contact-page",
        website: field("website"),
      });
      formElement.reset();
      setStatus("sent");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
      setStatus("error");
    }
  }

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
            <form
              onSubmit={sendInquiry}
              className="recko-contact-form border border-border bg-surface/45 p-5 sm:p-8 md:p-10"
            >
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                  Project inquiry
                </p>
                <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
                  What would you like to make happen?
                </h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                  <label>
                    Leave this field empty
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
                <label className="text-sm font-medium">
                  Your name
                  <input
                    className={inputClass}
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Name"
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Email address
                  <input
                    className={inputClass}
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    required
                  />
                </label>
                <label className="text-sm font-medium">
                  Company <span className="text-muted-foreground">(optional)</span>
                  <input
                    className={inputClass}
                    type="text"
                    name="company"
                    autoComplete="organization"
                    placeholder="Your company"
                  />
                </label>
                <label className="text-sm font-medium">
                  Area of interest
                  <select className={inputClass} name="service" defaultValue="Not sure yet">
                    <option>Not sure yet</option>
                    <option>Creative and branding</option>
                    <option>Growth and marketing</option>
                    <option>Web and technology</option>
                    <option>Ongoing partnership</option>
                  </select>
                </label>
                <label className="text-sm font-medium sm:col-span-2">
                  A little about your project
                  <textarea
                    className={`${inputClass} min-h-36 resize-y`}
                    name="message"
                    placeholder="What are you hoping to improve or create?"
                    required
                  />
                </label>
              </div>
              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex disabled:opacity-60 w-fit items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:translate-x-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  {status === "sending" ? "Sending…" : "Send inquiry"}
                  <ArrowRight className="size-4" />
                </button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  We reply to every inquiry personally.
                </p>
              </div>
              {status === "sent" && (
                <p className="mt-5 text-sm text-primary" role="status">
                  Thank you. Your inquiry has been received and we will be in touch soon.
                </p>
              )}
              {status === "error" && (
                <p className="mt-5 text-sm text-red-500" role="alert">
                  {errorMessage}
                </p>
              )}
            </form>
          </Reveal>
        </div>
      </section>
    </PageFrame>
  );
}
