import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ConnectedStory } from "./ConnectedStory";
import { partnershipItems } from "@/data/home";

const motion = vi.hoisted(() => ({
  enabled: true,
  fromTo: vi.fn(),
  from: vi.fn(),
  mediaRevert: vi.fn(),
  contextRevert: vi.fn(),
}));
vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    matchMedia: () => ({
      add: (_query: string, callback: () => void) => {
        if (motion.enabled) callback();
      },
      revert: motion.mediaRevert,
    }),
    context: (callback: () => void) => {
      callback();
      return { revert: motion.contextRevert };
    },
    fromTo: motion.fromTo,
    from: motion.from,
  },
}));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {} }));
vi.mock("@/components/motion/SplitReveal", () => ({
  SplitReveal: ({ text }: { text: string }) => <span>{text}</span>,
}));
beforeEach(() => {
  vi.clearAllMocks();
  motion.enabled = true;
});
afterEach(cleanup);

describe("Connected About and Growth Partnerships", () => {
  it("preserves navigation targets, Recko identity and every existing partnership item", () => {
    render(<ConnectedStory />);
    expect(screen.getByRole("region", { name: /Your trusted partner/ })).toHaveAttribute(
      "id",
      "about",
    );
    const partnership = screen.getByRole("region", { name: /One team/ });
    expect(partnership).toHaveAttribute("id", "partnership");
    expect(screen.getByLabelText("ReckoMEDIA")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Meet ReckoMEDIA" })).toHaveAttribute(
      "href",
      "#partnership",
    );
    expect(screen.getByRole("link", { name: /talk about your business/ })).toHaveAttribute(
      "href",
      "#contact",
    );
    const items = within(partnership).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(partnershipItems);
    expect(screen.queryByText(/Raytech/)).not.toBeInTheDocument();
  });
  it("ties rail progress to reversible scrolling and cleans up motion on unmount", () => {
    const { unmount } = render(<ConnectedStory />);
    const railAnimation = motion.fromTo.mock.calls.find(([target]) =>
      target.classList.contains("recko-story-rail-fill"),
    );
    expect(railAnimation).toBeDefined();
    expect(railAnimation![1]).toEqual({ scaleY: 0 });
    expect(railAnimation![2]).toMatchObject({
      scaleY: 1,
      ease: "none",
      scrollTrigger: { scrub: true },
    });
    unmount();
    expect(motion.mediaRevert).toHaveBeenCalledOnce();
    expect(motion.contextRevert).toHaveBeenCalledOnce();
  });
  it("keeps content and contact navigation available without motion", () => {
    motion.enabled = false;
    render(<ConnectedStory />);
    expect(motion.fromTo).not.toHaveBeenCalled();
    expect(motion.from).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: /Your trusted partner/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /talk about your business/ })).toBeInTheDocument();
  });
});
