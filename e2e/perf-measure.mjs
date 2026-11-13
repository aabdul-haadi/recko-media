// Lab measurements of the PRODUCTION build (run `node e2e/serve-build.mjs` + the stub first). Not Lighthouse.
// Mobile profile: Pixel 7 viewport, 4x CPU slowdown, ~1.6 Mbps / 150 ms RTT network. 3 runs per page, median reported.
import { chromium, devices } from "@playwright/test";

const base = process.env.BASE ?? "http://127.0.0.1:4199";
const pages = ["/", "/about", "/services", "/portfolio", "/contact", "/admin/login"];
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const browser = await chromium.launch({ channel: "chrome" });
const rows = [];
for (const path of pages) {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const ctx = await browser.newContext({ ...devices["Pixel 7"] });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    let bytes = 0, jsBytes = 0, requests = 0; const types = new Map();
    cdp.on("Network.responseReceived", (e) => types.set(e.requestId, e.type));
    cdp.on("Network.loadingFinished", (e) => { bytes += e.encodedDataLength; requests++; if (types.get(e.requestId) === "Script") jsBytes += e.encodedDataLength; });
    await page.addInitScript(() => {
      window.__m = { lcp: 0, cls: 0, tbt: 0 };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.tbt += Math.max(0, e.duration - 50); }).observe({ type: "longtask", buffered: true });
    });
    await page.goto(base + path, { waitUntil: "load" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);
    const m = await page.evaluate(() => {
      const n = performance.getEntriesByType("navigation")[0];
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
      return { ...window.__m, ttfb: n.responseStart, fcp, load: n.loadEventEnd };
    });
    runs.push({ ...m, kb: bytes / 1024, jsKb: jsBytes / 1024, requests });
    await ctx.close();
  }
  const pick = (k) => median(runs.map((r) => r[k]));
  rows.push({ page: path, ttfb: pick("ttfb"), fcp: pick("fcp"), lcp: pick("lcp"), cls: pick("cls"), tbt: pick("tbt"), load: pick("load"), kb: pick("kb"), jsKb: pick("jsKb"), requests: pick("requests") });
}
await browser.close();
const f = (n, d = 0) => n.toFixed(d);
console.log("page".padEnd(14), "TTFB".padStart(6), "FCP".padStart(7), "LCP".padStart(7), "CLS".padStart(6), "TBT".padStart(6), "load".padStart(7), "KB".padStart(7), "JS KB".padStart(7), "reqs".padStart(5));
for (const r of rows) console.log(r.page.padEnd(14), f(r.ttfb).padStart(6), f(r.fcp).padStart(7), f(r.lcp).padStart(7), f(r.cls, 3).padStart(6), f(r.tbt).padStart(6), f(r.load).padStart(7), f(r.kb).padStart(7), f(r.jsKb).padStart(7), String(r.requests).padStart(5));
