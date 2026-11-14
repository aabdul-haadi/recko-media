/** Builds a tel: link from a phone number as people write it, e.g. "(+92) 327 2514632" -> "tel:+923272514632". */
export function telHref(phone: unknown): string | null {
  if (typeof phone !== "string") return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.replace(/\D/g, "").length >= 5 ? `tel:${cleaned}` : null;
}

/** Builds a mailto: link, or null when the text is not a plain email address (nothing unsafe is ever linked). */
export function mailtoHref(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const value = email.trim();
  return /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[^\s@<>"'`]+$/.test(value) ? `mailto:${value}` : null;
}
