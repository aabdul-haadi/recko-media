import { describe, it, expect } from "vitest";
import { boundView, containImage, initialView, zoomAt } from "./geometry";
import { cleanSearch, titleFromFile, validateMetadata, prepareImage } from "./portfolio";
describe("portfolio geometry and validation", () => {
  const bounds = { width: 800, height: 600, imageWidth: 800, imageHeight: 600 };
  it("fits long screenshots without distorting dimensions", () => {
    expect(containImage(1920, 9000, 800, 600)).toEqual({ width: 128, height: 600 });
  });
  it("zooms around the pointer and clamps zoom limits", () => {
    expect(zoomAt(initialView, 2, 100, 50, bounds)).toEqual({ scale: 2, x: -100, y: -50 });
    expect(zoomAt(initialView, 100, 0, 0, bounds).scale).toBe(12);
  });
  it("bounds panning and resets below minimum zoom", () => {
    expect(boundView({ scale: 2, x: 9000, y: -9000 }, bounds)).toEqual({
      scale: 2,
      x: 400,
      y: -300,
    });
    expect(boundView({ scale: 0.5, x: 20, y: 20 }, bounds)).toEqual(initialView);
  });
  it("cleans search filters and upload titles", () => {
    expect(cleanSearch('A"\\,(B)%')).toBe("AB");
    expect(titleFromFile("my-store_home.webp")).toBe("my store home");
  });
  it("rejects invalid formats and oversized uploads before decoding", async () => {
    await expect(prepareImage(new File(["x"], "x.svg", { type: "image/svg+xml" }))).rejects.toThrow(
      "PNG",
    );
    await expect(
      prepareImage(new File([new Uint8Array(21 * 1024 * 1024)], "x.png", { type: "image/png" })),
    ).rejects.toThrow("20 MB");
  });
  it("requires usable metadata and bounded tags", () => {
    expect(() =>
      validateMetadata({
        title: "",
        alt: "",
        description: "",
        category: "",
        tags: [],
        status: "draft",
      }),
    ).toThrow();
  });
});
