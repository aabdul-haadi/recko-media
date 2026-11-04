import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MotionGallery } from "./MotionGallery";
import { MotionHighlights } from "./MotionHighlights";

const motion = vi.hoisted(() => ({
  to: vi.fn(() => ({ kill: vi.fn() })),
  add: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("gsap", () => ({
  default: { to: motion.to, ticker: { add: motion.add, remove: motion.remove } },
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: (entries: unknown[]) => void) {}
      observe() {
        this.callback([{ isIntersecting: true }]);
      }
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Motion-inspired homepage sections", () => {
  it("switches each gallery arrangement by mouse and keyboard", () => {
    render(<MotionGallery />);
    for (const name of ["Barrel", "Ring", "Sphere", "Helix"]) {
      const tab = screen.getByRole("tab", { name });
      fireEvent.click(tab);
      expect(tab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel")).toHaveAttribute("data-mode", name);
    }
    fireEvent.keyDown(screen.getByRole("tab", { name: "Helix" }), { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Sphere" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveAttribute("data-mode", "Sphere");
    expect(motion.to).toHaveBeenCalled();
  });
  it("opens a project preview and returns focus after dismissal", async () => {
    render(<MotionGallery />);
    const card = screen.getByRole("button", { name: /Inspect Digital experiences, card 1$/ });
    fireEvent.click(card);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Digital experiences" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /Discuss a similar project/ })).toHaveAttribute(
      "href",
      "#contact",
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Close project preview" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(card).toHaveFocus());
  });
  it("supports pause/play and cleans up the shared animation ticker", () => {
    const { unmount } = render(<MotionGallery />);
    fireEvent.click(screen.getByRole("button", { name: "Pause gallery rotation" }));
    expect(screen.getByRole("button", { name: "Play gallery rotation" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const tick = motion.add.mock.calls[0]![0];
    unmount();
    expect(motion.remove).toHaveBeenCalledWith(tick);
  });
  it("changes preview cards with the mouse wheel and preserves pinch zoom", () => {
    render(<MotionHighlights />);
    const stage = screen.getByLabelText("Interactive project card stack");
    const active = () => stage.querySelector('[aria-pressed="true"].recko-motion-stack-card');
    const before = active();
    fireEvent.wheel(stage, { deltaY: 100 });
    expect(active()).not.toBe(before);
    const after = active();
    fireEvent.wheel(stage, { deltaY: -100, ctrlKey: true });
    expect(active()).toBe(after);
  });
  it("rotates the preview stack and lets visitors pause it", () => {
    vi.useFakeTimers();
    render(<MotionHighlights />);
    const region = screen.getByRole("region", { name: "Creative previews" });
    const current = () =>
      within(region)
        .getAllByRole("button")
        .find(
          (button) =>
            button.getAttribute("aria-pressed") === "true" &&
            button.classList.contains("recko-motion-stack-card"),
        );
    const initial = current();
    act(() => vi.advanceTimersByTime(3500));
    expect(current()).not.toBe(initial);
    fireEvent.click(screen.getByRole("button", { name: "Pause preview rotation" }));
    const paused = current();
    act(() => vi.advanceTimersByTime(7000));
    expect(current()).toBe(paused);
    fireEvent.click(screen.getByRole("button", { name: "Next preview" }));
    expect(current()).not.toBe(paused);
  });
});
