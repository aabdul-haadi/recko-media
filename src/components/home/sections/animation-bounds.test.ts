import { describe, expect, it } from "vitest";
import { fitGallery, fitPreviewStack, galleryEnvelope, stackOffset } from "./animation-bounds";

const sizes = [
  [280, 340],
  [320, 400],
  [350, 400],
  [688, 422],
  [944, 563],
  [1200, 620],
];
describe("Animation containment", () => {
  it.each(sizes)(
    "fits every rotating gallery card inside a %ipx by %ipx viewport",
    (width, height) => {
      const scale = fitGallery(width, height);
      const radius = galleryEnvelope();
      const projectedRadius = (scale * radius) / (1 - (scale * radius) / 1100);
      expect(projectedRadius + 24).toBeLessThanOrEqual(Math.min(width, height) / 2 + 0.001);
      expect(scale).toBeGreaterThan(0);
      expect(scale).toBeLessThanOrEqual(1);
    },
  );
  it.each([
    [280, 220],
    [320, 220],
    [600, 250],
  ])("fits preview cards inside %ipx by %ipx without covering controls", (width, height) => {
    const scale = fitPreviewStack(width, height);
    const projection = 1 / (1 - (31 * scale) / 900);
    expect(204 * scale * projection + 16).toBeLessThanOrEqual(width / 2 + 0.001);
    expect(105 * scale * projection + 12).toBeLessThanOrEqual(height / 2 + 0.001);
  });
  it("keeps all seven preview cards centered even at the first and last selection", () => {
    for (let active = 0; active < 7; active++) {
      const offsets = Array.from({ length: 7 }, (_, index) => stackOffset(index, active, 7));
      expect([...offsets].sort((a, b) => a - b)).toEqual([-3, -2, -1, 0, 1, 2, 3]);
      expect(offsets[active]).toBe(0);
    }
  });
});
