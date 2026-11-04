import { useState, type FormEvent } from "react";
import { ArrowRight, Clock3, Mail, MapPin } from "lucide-react";
import { PageFrame, PageHero } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";

const inputClass = "mt-2 w-full rounded-lg border border-border bg-background px-4 py-3.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20";

export function ContactPage() {
  const [sent, setSent] = useState(false);

  function sendInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = `Project inquiry from ${form.get("name")}`;
    const body = [
      `Name: ${form.get("name")}`,
      `Email: ${form.get("email")}`,
      `Company: ${form.get("company") || "Not provided"}`,
      `Interested in: ${form.get("service")}`,
      "",
      "Project details:",
      String(form.get("message")),
    ].join("\n");
    window.location.href = `mailto:team@reckomedia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
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
          <aside>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Reach the team</p>
              <a href="mailto:team@reckomedia.com" className="mt-4 inline-flex items-center gap-3 text-lg font-medium transition-colors hover:text-primary sm:text-xl"><Mail className="size-5 text-primary" />team@reckomedia.com</a>
            </Reveal>
            <div className="mt-10 space-y-6 border-t border-border pt-7">
              <Reveal delay={80}>
                <div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-primary"><Clock3 className="size-4" /></span><div><h2 className="font-semibold">A good first step</h2><p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">Tell us a little about your goals and we’ll help focus the conversation.</p></div></div>
              </Reveal>
              <Reveal delay={160}>
                <div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-primary"><MapPin className="size-4" /></span><div><h2 className="font-semibold">Working together</h2><p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">Remote-friendly collaboration, built around your team and time zone.</p></div></div>
              </Reveal>
            </div>
          </aside>

          <Reveal>
            <form onSubmit={sendInquiry} className="border border-border bg-surface/45 p-5 sm:p-8 md:p-10">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Project inquiry</p>
                <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">What would you like to make happen?</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-medium">Your name<input className={inputClass} type="text" name="name" autoComplete="name" placeholder="Name" required /></label>
                <label className="text-sm font-medium">Email address<input className={inputClass} type="email" name="email" autoComplete="email" placeholder="you@company.com" required /></label>
                <label className="text-sm font-medium">Company <span className="text-muted-foreground">(optional)</span><input className={inputClass} type="text" name="company" autoComplete="organization" placeholder="Your company" /></label>
                <label className="text-sm font-medium">Area of interest<select className={inputClass} name="service" defaultValue="Not sure yet"><option>Not sure yet</option><option>Creative and branding</option><option>Growth and marketing</option><option>Web and technology</option><option>Ongoing partnership</option></select></label>
                <label className="text-sm font-medium sm:col-span-2">A little about your project<textarea className={`${inputClass} min-h-36 resize-y`} name="message" placeholder="What are you hoping to improve or create?" required /></label>
              </div>
              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="submit" className="inline-flex w-fit items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:translate-x-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Send inquiry<ArrowRight className="size-4" /></button>
                <p className="text-xs leading-relaxed text-muted-foreground">Your email app will open with your message ready to send.</p>
              </div>
              {sent && <p className="mt-5 text-sm text-primary" role="status">Your email app should be ready with your project details.</p>}
            </form>
          </Reveal>
        </div>
      </section>
    </PageFrame>
  );
}
