import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DeferredMotionHighlights } from "./DeferredMotionHighlights";

vi.mock("./sections/MotionHighlights", () => ({
  MotionHighlights: () => <div>Animated preview ready</div>,
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("loads the animated preview only when it approaches the viewport", async () => {
  let notify: (entries: { isIntersecting: boolean }[]) => void = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof notify) {
        notify = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  const { unmount } = render(<DeferredMotionHighlights />);
  expect(screen.queryByText("Animated preview ready")).not.toBeInTheDocument();
  await act(async () => notify([{ isIntersecting: true }]));
  expect(await screen.findByText("Animated preview ready")).toBeInTheDocument();
  expect(disconnect).toHaveBeenCalled();
  unmount();
});
