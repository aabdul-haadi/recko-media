import { describe, expect, it } from "vitest";
import { galleryModes, galleryPosition } from "./gallery-layout";

describe("3D gallery arrangements", () => {
  it("keeps every card at a finite, distinct position in every arrangement", () => {
    for (const mode of galleryModes) {
      const positions = Array.from({ length: 12 }, (_, index) => galleryPosition(mode, index, 12));
      expect(positions.every((position) => Object.values(position).every(Number.isFinite))).toBe(
        true,
      );
      expect(new Set(positions.map(({ x, y, z }) => `${x},${y},${z}`)).size).toBe(12);
    }
  });
  it("keeps a barrel cylindrical, a ring planar and a sphere on its surface", () => {
    for (let index = 0; index < 12; index++) {
      const barrel = galleryPosition("Barrel", index, 12);
      expect(barrel.y).toBe(0);
      expect(Math.hypot(barrel.x, barrel.z)).toBeCloseTo(230);
      expect(galleryPosition("Ring", index, 12).z).toBe(0);
      const sphere = galleryPosition("Sphere", index, 12);
      expect(Math.hypot(sphere.x, sphere.y, sphere.z)).toBeCloseTo(230);
    }
  });
  it("moves helix cards upward in consistent increments", () => {
    const points = Array.from({ length: 12 }, (_, index) => galleryPosition("Helix", index, 12));
    for (let i = 1; i < points.length; i++) expect(points[i]!.y - points[i - 1]!.y).toBe(26);
  });
});
