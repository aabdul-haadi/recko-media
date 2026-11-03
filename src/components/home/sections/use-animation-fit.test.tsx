import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { useAnimationFit } from "./use-animation-fit";
import { fitGallery } from "./animation-bounds";

function Scene() {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useAnimationFit(viewport, content, fitGallery);
  return (
    <div ref={viewport}>
      <div data-testid="scene" ref={content} />
    </div>
  );
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("Responsive animation fitting", () => {
  it("refits on container resize and disconnects its observer", () => {
    let notify!: (entries: { contentRect: { width: number; height: number } }[]) => void;
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: typeof notify) {
          notify = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const { getByTestId, unmount } = render(<Scene />);
    act(() => notify([{ contentRect: { width: 1200, height: 620 } }]));
    const desktop = Number(getByTestId("scene").style.getPropertyValue("--animation-fit"));
    expect(desktop).toBe(fitGallery(1200, 620));
    act(() => notify([{ contentRect: { width: 280, height: 340 } }]));
    const mobile = Number(getByTestId("scene").style.getPropertyValue("--animation-fit"));
    expect(mobile).toBe(fitGallery(280, 340));
    expect(mobile).toBeLessThan(desktop);
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
