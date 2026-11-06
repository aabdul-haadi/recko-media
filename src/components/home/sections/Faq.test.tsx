import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Faq } from "./Faq";
import { contentDefaults } from "@/lib/content/schema";

vi.mock("@/components/motion/SplitReveal", () => ({
  SplitReveal: ({ text }: { text: string }) => <span>{text}</span>,
  Reveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
afterEach(cleanup);

describe("Homepage FAQ", () => {
  it("renders every default question as an accessible accordion trigger", () => {
    render(<Faq />);
    const questions = (contentDefaults["faq"]!["items"] as { question: string }[]).map((i) => i.question);
    expect(questions.length).toBeGreaterThanOrEqual(5);
    for (const question of questions) expect(screen.getByRole("button", { name: new RegExp(question.slice(0, 20)) })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Frequently asked questions/ })).toHaveAttribute("id", "faq");
  });
  it("opens an answer on click and keeps only one open at a time", () => {
    render(<Faq />);
    const [first, second] = screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-expanded"));
    fireEvent.click(first!);
    expect(first).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(second!);
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
  });
});
