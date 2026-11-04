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
  extra?: Record<string, unknown>;
};

const messages: Record<string, string> = {
  invalid_name: "Please enter your name.",
  invalid_email: "Please enter a valid email address.",
  invalid_message: "Please tell us a little about your project.",
  invalid_phone: "That phone number looks too long.",
  rate_limited: "You have sent several messages recently. Please try again later.",
};

/** Sends a website form to Supabase through the secure `submit_inquiry` function. */
export async function submitInquiry(input: InquiryInput): Promise<void> {
  const { error } = await getSupabase().rpc("submit_inquiry", {
    payload: { ...input, page_url: window.location.href },
  });
  if (error) {
    const key = Object.keys(messages).find((code) => error.message.includes(code));
    throw new Error(key ? messages[key]! : "We could not send your message. Please try again.");
  }
}
