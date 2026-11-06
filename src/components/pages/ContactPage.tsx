import { websiteCopy } from "@/data/website-copy";
import "./inner-visuals.css";
import { ArrowRight, Clock3, Mail, MapPin } from "lucide-react";
import { PageFrame, PageHero } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";
import { InquiryForm } from "@/components/forms/InquiryForm";

export function ContactPage() {
<<<<<<< HEAD
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [length, setLength] = useState(0);
  const openedAt = useRef(0);
  const busy = useRef(false);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  async function sendInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return; // ignore double clicks / double Enter
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const field = (key: string) => String(form.get(key) ?? "").trim();
    const values = {
      name: field("name"),
      email: field("email"),
      phone: field("phone"),
      company: field("company"),
      service: field("service"),
      message: field("message"),
    };

    const found = validateInquiry(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus("idle");
      setErrorMessage("");
      formElement.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }
    const wait = cooldownRemaining();
    if (wait > 0) {
      setStatus("error");
      setErrorMessage(
        `Your message was just sent. You can send another in ${Math.ceil(wait / 1000)} seconds.`,
      );
      return;
    }

    busy.current = true;
    setStatus("sending");
    setErrorMessage("");

    if (!isSupabaseConfigured()) {
      // Local/preview builds without Supabase keep the original email-app behaviour.
      const body = [
        `Name: ${values.name}`,
        `Email: ${values.email}`,
        `Company: ${values.company || "Not provided"}`,
        `Interested in: ${values.service}`,
        "",
        "Project details:",
        values.message,
      ].join("\n");
      window.location.href = `mailto:team@socialadservices.com?subject=${encodeURIComponent(`Project inquiry from ${values.name}`)}&body=${encodeURIComponent(body)}`;
      busy.current = false;
      setStatus("sent");
      return;
    }

    try {
      await submitInquiry({
        ...values,
        subject: `Project inquiry from ${values.name}`,
        source: "contact-page",
        website: field("website"),
        elapsedMs: Date.now() - openedAt.current,
      });
      formElement.reset();
      setLength(0);
      setStatus("sent");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
      setStatus("error");
    } finally {
      busy.current = false;
    }
  }

  function sendAnother() {
    openedAt.current = Date.now();
    setErrors({});
    setStatus("idle");
  }

  return (
    <PageFrame>
      <PageHero
        eyebrow="Contact / Start the conversation"
        title="Get In Touch"
        description="Ready to take the next step? Let’s chat about how Recko Media can craft a winning digital marketing strategy that ignites your online presence."
=======
  return (
    <PageFrame>
      <PageHero
        eyebrow="Contact / Reach out to us"
        title="Reach out to us."
        description="Don't miss out on the opportunity to grow your online presence and take your business to new heights. Reach out to us today and let's discuss how we can help you achieve your digital marketing goals."
>>>>>>> 570819fa94f67af3b6f72a72806689d4dea7b2b0
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
                href="mailto:team@socialadservices.com"
                className="recko-contact-email mt-4 inline-flex items-center gap-3 text-lg font-medium transition-colors hover:text-primary sm:text-xl"
              >
                <Mail className="size-5 text-primary" />
                team@socialadservices.com
              </a>
            </Reveal>
            <div className="mt-5 flex flex-col items-start gap-3 text-muted-foreground">
              <a href="tel:+923272514632" className="hover:text-acid">
                {websiteCopy.phone}
              </a>
              <a href="tel:+19842741027" className="hover:text-acid">
                {websiteCopy.phoneInternational}
              </a>
              <p>{websiteCopy.address}</p>
              <a href="https://wa.me/923272514632" className="hover:text-acid">
                Chat on WhatsApp
              </a>
            </div>
            <div className="mt-10 space-y-6 border-t border-border pt-7">
              <Reveal delay={80}>
                <div className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-primary">
                    <Clock3 className="size-4" />
                  </span>
                  <div>
                    <h2 className="font-semibold">Need advice to grow your business?</h2>
                    <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      Digital marketing helps businesses reach and connect with their audience online, paving the way for success in a competitive market.
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
<<<<<<< HEAD
                      Find us in Gulshan-e-Iqbal, Karachi, Pakistan.
=======
                      Gulshan-e-Iqbal, Karachi, Pakistan. Call or WhatsApp 0327 2514632.
>>>>>>> 570819fa94f67af3b6f72a72806689d4dea7b2b0
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </aside>

          <Reveal>
<<<<<<< HEAD
            {status === "sent" ? (
              <div
                role="status"
                aria-live="polite"
                className="recko-contact-form recko-contact-success border border-border bg-surface/45 p-8 text-center sm:p-12"
              >
                <span className="recko-success-check" aria-hidden="true">
                  <Check className="size-8" strokeWidth={3} />
                </span>
                <h2 className="mt-6 font-display text-2xl font-bold sm:text-3xl">
                  Message received.
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Thank you. We have your inquiry and will reply personally, usually within one
                  working day.
                </p>
                <button
                  type="button"
                  onClick={sendAnother}
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={sendInquiry}
                noValidate
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
                  <div
                    className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
                    aria-hidden="true"
                  >
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
                      maxLength={200}
                      aria-invalid={Boolean(errors["name"])}
                      aria-describedby={errors["name"] ? "err-name" : undefined}
                    />
                    {errors["name"] && (
                      <span
                        id="err-name"
                        role="alert"
                        className="mt-1.5 block text-xs text-red-400"
                      >
                        {errors["name"]}
                      </span>
                    )}
                  </label>
                  <label className="text-sm font-medium">
                    Email address
                    <input
                      className={inputClass}
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      maxLength={320}
                      aria-invalid={Boolean(errors["email"])}
                      aria-describedby={errors["email"] ? "err-email" : undefined}
                    />
                    {errors["email"] && (
                      <span
                        id="err-email"
                        role="alert"
                        className="mt-1.5 block text-xs text-red-400"
                      >
                        {errors["email"]}
                      </span>
                    )}
                  </label>
                  <label className="text-sm font-medium">
                    Phone <span className="text-muted-foreground">(optional)</span>
                    <input
                      className={inputClass}
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      placeholder="+92 300 0000000"
                      maxLength={50}
                      aria-invalid={Boolean(errors["phone"])}
                      aria-describedby={errors["phone"] ? "err-phone" : undefined}
                    />
                    {errors["phone"] && (
                      <span
                        id="err-phone"
                        role="alert"
                        className="mt-1.5 block text-xs text-red-400"
                      >
                        {errors["phone"]}
                      </span>
                    )}
                  </label>
                  <label className="text-sm font-medium">
                    Company <span className="text-muted-foreground">(optional)</span>
                    <input
                      className={inputClass}
                      type="text"
                      name="company"
                      autoComplete="organization"
                      placeholder="Your company"
                      maxLength={200}
                    />
                  </label>
                  <label className="text-sm font-medium sm:col-span-2">
                    Area of interest
                    <select className={inputClass} name="service" defaultValue="Not sure yet">
                      <option>Not sure yet</option>
                      <option>Creative and branding</option>
                      <option>Growth and marketing</option>
                      <option>Web and technology</option>
                      <option>Ongoing partnership</option>
                      {websiteCopy.services.map((service) => (
                        <option key={service.title}>{service.title}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium sm:col-span-2">
                    A little about your project
                    <textarea
                      className={`${inputClass} min-h-36 resize-y`}
                      name="message"
                      placeholder="What are you hoping to improve or create?"
                      maxLength={5000}
                      onChange={(e) => setLength(e.target.value.length)}
                      aria-invalid={Boolean(errors["message"])}
                      aria-describedby={errors["message"] ? "err-message" : undefined}
                    />
                    <span className="mt-1.5 flex items-start justify-between gap-3 text-xs">
                      <span
                        id="err-message"
                        role={errors["message"] ? "alert" : undefined}
                        className="text-red-400"
                      >
                        {errors["message"]}
                      </span>
                      <span className="ml-auto shrink-0 text-muted-foreground">{length}/5000</span>
                    </span>
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
                {status === "error" && (
                  <p
                    className="mt-5 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300"
                    role="alert"
                  >
                    {errorMessage}
                  </p>
                )}
              </form>
            )}
=======
            <InquiryForm source="contact-page" />
>>>>>>> 570819fa94f67af3b6f72a72806689d4dea7b2b0
          </Reveal>
        </div>
      </section>
    </PageFrame>
  );
}
