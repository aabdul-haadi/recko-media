import { describe, it, expect, vi } from "vitest";
import { createImageUrlCache, IMAGE_URL_TTL, canPrefetchImage } from "./image-cache";
function setup() {
  let clock = 1000;
  const values = new Map<string, string>();
  const store = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const sign = vi.fn(async (paths: string[]) =>
    paths.map((path) => ({ path, signedUrl: `https://images.test/${path}?v=${clock}` })),
  );
  const create = () =>
    createImageUrlCache({ key: "test", storage: () => store, now: () => clock, sign });
  return {
    create,
    sign,
    values,
    store,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}
describe("published portfolio image cache", () => {
  it("reuses stable URLs without re-signing on refetch", async () => {
    const f = setup(),
      cache = f.create();
    const first = await cache.resolve(["small", "thumb"]);
    expect(await cache.resolve(["small", "thumb"])).toEqual(first);
    expect(f.sign).toHaveBeenCalledTimes(1);
  });
  it("survives page reloads with the original expiry", async () => {
    const f = setup(),
      cache = f.create();
    const first = await cache.resolve(["small"]);
    f.advance(60_000);
    expect(await f.create().resolve(["small"])).toEqual(first);
    expect(f.sign).toHaveBeenCalledTimes(1);
    f.advance(IMAGE_URL_TTL);
    await f.create().resolve(["small"]);
    expect(f.sign).toHaveBeenCalledTimes(2);
  });
  it("signs only missing variants and coalesces concurrent reads", async () => {
    const f = setup(),
      cache = f.create();
    await Promise.all([cache.resolve(["a", "b"]), cache.resolve(["b", "c"])]);
    expect(f.sign.mock.calls.flatMap((call) => call[0])).toEqual(["a", "b", "c"]);
    await cache.resolve(["a", "d"]);
    expect(f.sign.mock.calls.at(-1)?.[0]).toEqual(["d"]);
  });
  it("refreshes an invalid URL only when explicitly retried", async () => {
    const f = setup(),
      cache = f.create();
    await cache.resolve(["a", "b"]);
    cache.invalidate("a");
    await cache.resolve(["a", "b"]);
    expect(f.sign.mock.calls.at(-1)?.[0]).toEqual(["a"]);
  });
  it("does not retain failed signatures and permits a retry", async () => {
    const f = setup(),
      cache = f.create();
    f.sign.mockRejectedValueOnce(new Error("offline"));
    await expect(cache.resolve(["a"])).rejects.toThrow("offline");
    expect((await cache.resolve(["a"])).get("a")).toContain("https://");
    expect(f.sign).toHaveBeenCalledTimes(2);
  });
  it("handles corrupted/blocked session storage without breaking image loading", async () => {
    const f = setup();
    f.values.set("test", "not JSON");
    expect((await f.create().resolve(["a"])).get("a")).toBeTruthy();
    const cache = createImageUrlCache({
      key: "test",
      sign: f.sign,
      storage: () => {
        throw new Error("disabled");
      },
    });
    expect((await cache.resolve(["b"])).get("b")).toBeTruthy();
  });
  it("bounds persisted URLs and ignores unsafe/stale cache values", async () => {
    const f = setup();
    f.values.set(
      "test",
      JSON.stringify([
        ["bad", { url: "javascript:bad", expires: 2000 }],
        ["expired", { url: "https://images.test/old", expires: 0 }],
      ]),
    );
    const cache = f.create();
    expect(cache.get("bad")).toBeUndefined();
    expect(cache.get("expired")).toBeUndefined();
    for (let i = 0; i < 6; i++)
      await cache.resolve(Array.from({ length: 48 }, (_, j) => `${i}-${j}`));
    expect(JSON.parse(f.values.get("test")!).length).toBe(256);
  });
});
describe("full-image preload budget", () => {
  it("avoids speculative large downloads on constrained connections", () => {
    expect(canPrefetchImage({ saveData: true })).toBe(false);
    expect(canPrefetchImage({ effectiveType: "3g" })).toBe(false);
    expect(canPrefetchImage({ effectiveType: "4g", downlink: 1.6 })).toBe(false);
    expect(canPrefetchImage({ effectiveType: "4g", downlink: 10 })).toBe(true);
  });
});
