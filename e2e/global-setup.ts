import { chromium } from "@playwright/test";

/**
 * A freshly installed dev server compiles pages and re-optimises dependencies on first use, which can reload a page
 * in the middle of a test. Visit every page once in a real browser first so the tests start on a warm server.
 */
export default async function warmUp() {
  const base = "http://127.0.0.1:5199";
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();
  for (const path of ["/", "/about", "/services", "/portfolio", "/contact", "/admin/login", "/admin/forgot-password", "/admin/reset-password"]) {
    try {
      await page.goto(base + path, { waitUntil: "load", timeout: 120_000 });
      await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
    } catch {
      /* a page that fails here will fail loudly in its own test */
    }
  }
  await browser.close();
}
