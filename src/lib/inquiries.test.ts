import { describe, expect, it } from "vitest";
import { cooldownRemaining, validateInquiry } from "./inquiries";

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
