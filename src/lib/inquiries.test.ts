import { beforeEach, describe, expect, it, vi } from "vitest";
import { cooldownRemaining, submitInquiry, validateInquiry } from "./inquiries";

const rpc = vi.fn();
vi.mock("@/lib/supabase", () => ({ getSupabase: () => ({ rpc }), isSupabaseConfigured: () => true }));

const valid = { name: "Ada Lovelace", email: "ada@example.com", phone: "", company: "", service: "Not sure yet", message: "We need a new website and growth plan." };

describe("inquiry validation", () => {
  it("accepts a complete, valid inquiry", () => {
    expect(validateInquiry(valid)).toEqual({});
  });
  it("reports friendly errors per field", () => {
    const errors = validateInquiry({ ...valid, name: "", email: "not-an-email", message: "hi" });
    expect(Object.keys(errors).sort()).toEqual(["email", "message", "name"]);
    expect(errors["email"]).toMatch(/valid email/i);
  });
  it("allows an empty phone but rejects letters", () => {
    expect(validateInquiry({ ...valid, phone: "+92 300 1234567" })).toEqual({});
    expect(validateInquiry({ ...valid, phone: "call me" })["phone"]).toBeDefined();
  });
  it("caps message length", () => {
    expect(validateInquiry({ ...valid, message: "x".repeat(5001) })["message"]).toBeDefined();
  });
});

describe("client cooldown", () => {
  it("is zero when nothing was sent recently", () => {
    window.localStorage.removeItem("reckomedia:last-inquiry");
    expect(cooldownRemaining()).toBe(0);
  });
  it("counts down after a send", () => {
    window.localStorage.setItem("reckomedia:last-inquiry", String(Date.now() - 10_000));
    const left = cooldownRemaining();
    expect(left).toBeGreaterThan(15_000);
    expect(left).toBeLessThanOrEqual(20_000);
  });
});

describe("submitInquiry error reporting", () => {
  const captured = vi.fn();
  const input = { name: "Private Person", email: "private.person@example.com", message: "Confidential project details.", source: "contact-page" };
  beforeEach(() => {
    rpc.mockReset();
    captured.mockReset();
    (window as unknown as { __runtimeErrorEvents: unknown }).__runtimeErrorEvents = { captureException: captured };
  });

  it("reports unexpected server failures with the error code but without any visitor details", async () => {
    rpc.mockResolvedValue({ error: { message: 'function submit_inquiry does not exist', code: "42883" } });
    await expect(submitInquiry(input)).rejects.toThrow(/could not send your message/i);
    expect(captured).toHaveBeenCalledTimes(1);
    const seen = JSON.stringify(captured.mock.calls[0]);
    expect(seen).toContain("42883");
    for (const secret of ["Private Person", "private.person", "Confidential"]) expect(seen).not.toContain(secret);
  });

  it("reports a dropped connection", async () => {
    rpc.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(submitInquiry(input)).rejects.toThrow(/could not reach the server/i);
    expect(captured).toHaveBeenCalledTimes(1);
  });

  it("does not report problems the visitor caused or can retry (bad email, rate limit)", async () => {
    rpc.mockResolvedValue({ error: { message: "invalid_email" } });
    await expect(submitInquiry(input)).rejects.toThrow(/valid email/i);
    rpc.mockResolvedValue({ error: { message: "rate_limited" } });
    await expect(submitInquiry(input)).rejects.toThrow(/several messages/i);
    expect(captured).not.toHaveBeenCalled();
  });

  it("stays silent and succeeds on a good response", async () => {
    rpc.mockResolvedValue({ error: null });
    await expect(submitInquiry(input)).resolves.toBeUndefined();
    expect(captured).not.toHaveBeenCalled();
  });
});
