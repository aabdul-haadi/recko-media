import { z } from "zod";
import { getSupabase } from "@/lib/supabase";

export type InquiryInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  service?: string;
  source: string;
  /** Honeypot: must stay empty for real visitors. */
  website?: string;
  /** Milliseconds the visitor spent on the form. Bots submit instantly. */
  elapsedMs?: number;
  extra?: Record<string, unknown>;
};

/** Same rules the database enforces, so visitors get instant, friendly feedback. */
export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(200, "That name is too long."),
  email: z.email("Please enter a valid email address.").max(320, "That email address is too long."),
  phone: z
    .string()
    .trim()
    .max(50, "That phone number is too long.")
    .refine((v) => v === "" || /^[0-9+()./ -]{5,50}$/.test(v), "Use digits, spaces and + ( ) - only."),
  company: z.string().trim().max(200, "That company name is too long."),
  service: z.string().trim().max(200),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a little more (at least 10 characters).")
    .max(5000, "Please keep your message under 5,000 characters."),
});

export function validateInquiry(values: Record<string, string>): Record<string, string> {
  const result = inquirySchema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

const messages: Record<string, string> = {
  invalid_name: "Please enter your name.",
  invalid_email: "Please enter a valid email address.",
  invalid_message: "Please tell us a little more about your project.",
  invalid_phone: "Please check your phone number.",
  rate_limited: "You have sent several messages recently. Please try again in a little while.",
};

// Client-side politeness limiter. The database is the real enforcement; this prevents accidental
// repeat submissions (double clicks, impatient retries) before they ever leave the browser.
const COOLDOWN_MS = 30_000;
const COOLDOWN_KEY = "reckomedia:last-inquiry";

export function cooldownRemaining(now = Date.now()): number {
  try {
    const last = Number(window.localStorage.getItem(COOLDOWN_KEY) ?? 0);
    return Math.max(0, COOLDOWN_MS - (now - last));
  } catch {
    return 0;
  }
}

function markSubmitted() {
  try {
    window.localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {
    /* storage unavailable (private mode): the server limits still apply */
  }
}

/** Sends a website form to Supabase through the secure `submit_inquiry` function. */
export async function submitInquiry(input: InquiryInput): Promise<void> {
  const { elapsedMs, ...rest } = input;
  let result: { error: { message: string } | null };
  try {
    result = await getSupabase().rpc("submit_inquiry", {
      payload: { ...rest, elapsed_ms: elapsedMs, page_url: window.location.href },
    });
  } catch {
    throw new Error("We could not reach the server. Please check your connection and try again.");
  }
  if (result.error) {
    const key = Object.keys(messages).find((code) => result.error!.message.includes(code));
    throw new Error(key ? messages[key]! : "We could not send your message. Please try again in a moment.");
  }
  markSubmitted();
}
