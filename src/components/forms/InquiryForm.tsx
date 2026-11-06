import "@/components/pages/inner-visuals.css";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cooldownRemaining, submitInquiry, validateInquiry } from "@/lib/inquiries";

const inputClass =
  "mt-2 w-full rounded-lg border border-border bg-background px-4 py-3.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20";

export function InquiryForm({ source = "contact-page" }: { source?: string }) {
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
      window.location.href = `mailto:team@reckomedia.com?subject=${encodeURIComponent(`Project inquiry from ${values.name}`)}&body=${encodeURIComponent(body)}`;
      busy.current = false;
      setStatus("sent");
      return;
    }

    try {
      await submitInquiry({
        ...values,
        subject: `Project inquiry from ${values.name}`,
        source,
        website: field("fax_number_2"),
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
    <>
      {status === "sent" ? (
        <div
          role="status"
          aria-live="polite"
          className="recko-contact-form recko-contact-success border border-border bg-surface/45 p-8 text-center sm:p-12"
        >
          <span className="recko-success-check" aria-hidden="true">
            <Check className="size-8" strokeWidth={3} />
          </span>
          <h2 className="mt-6 font-display text-2xl font-bold sm:text-3xl">Message received.</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Thank you. We have your inquiry and will reply personally, usually within one working
            day.
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
            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
              <label>
                Leave this field empty
                <input type="text" name="fax_number_2" tabIndex={-1} autoComplete="off" data-lpignore="true" data-1p-ignore="true" />
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
                <span id="err-name" role="alert" className="mt-1.5 block text-xs text-red-400">
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
                <span id="err-email" role="alert" className="mt-1.5 block text-xs text-red-400">
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
                <span id="err-phone" role="alert" className="mt-1.5 block text-xs text-red-400">
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
    </>
  );
}
