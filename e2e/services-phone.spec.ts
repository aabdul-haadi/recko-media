import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { resetStub } from "./helpers";

/** The Services page catalogue as it is after migrations 0009 and 0010: 4 + 3 + 2 cards. */
const CATALOGUE = [
  ["meta-ads", "creative", "Meta Ads (Facebook & Instagram)", 1],
  ["lead-generation-campaigns", "creative", "Lead Generation Campaigns", 2],
  ["creative-content-production", "creative", "Creative & Content Production", 3],
  ["social-media-management", "creative", "Social Media Management", 4],
  ["google-ads", "growth", "Google Ads", 1],
  ["ecommerce-growth", "growth", "E-commerce Growth", 2],
  ["tracking-analytics-reporting", "growth", "Tracking, Analytics & Reporting", 3],
  ["website-design-landing-pages", "technology", "Website Design & Landing Pages", 1],
  ["crm-automation", "technology", "CRM & Automation", 2],
] as const;

async function seedCatalogue() {
  const now = new Date().toISOString();
  const services = CATALOGUE.map(([slug, category, title, sort_order], i) => ({
    id: `10000000-0000-4000-8000-0000000001${String(i).padStart(2, "0")}`,
    slug, category, title, sort_order,
    summary: `${title}: a short plain-language summary of what this service does for the business.`,
    details: null, features: ["First thing included", "Second thing included", "Third thing included"],
    price: null, icon: null, image_url: null, image_alt: null, cta_label: null, cta_url: null,
    featured: false, status: "published", seo_title: null, seo_description: null, created_at: now, updated_at: now,
  }));
  await fetch("http://127.0.0.1:54329/__seed", { method: "POST", body: JSON.stringify({ services }) });
}

/** Scrolls through the page so lazy images load, then returns to the top. */
async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

const PHONES = [320, 360, 390, 430];

test.beforeEach(async () => {
  await resetStub();
  await seedCatalogue();
});

for (const width of PHONES) {
  test.describe(`Services page on a ${width}px phone`, () => {
    test.use({ viewport: { width, height: 800 } });

    test(`${width}px: nothing scrolls sideways and there is no carousel @mobile`, async ({ page }) => {
      await page.goto("/services");
      await settle(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "the page scrolls sideways").toBeLessThanOrEqual(1);
      const sideways = await page.evaluate(() =>
        [...document.querySelectorAll("main *")]
          .filter((el) => {
            const s = getComputedStyle(el);
            return (s.overflowX === "auto" || s.overflowX === "scroll") && el.scrollWidth > el.clientWidth + 1;
          })
          .map((el) => `${el.tagName}.${(el as HTMLElement).className}`.slice(0, 80)),
      );
      expect(sideways, "elements that scroll sideways").toEqual([]);
      const snap = await page.evaluate(() =>
        [...document.querySelectorAll("main *")].filter((el) => getComputedStyle(el).scrollSnapType !== "none").length,
      );
      expect(snap, "scroll-snap carousels").toBe(0);
      await expect(page.locator("[class*='embla'], [data-carousel], [aria-roledescription='carousel']")).toHaveCount(0);
    });

    test(`${width}px: the complete design is shown, nothing is hidden`, async ({ page }) => {
      await page.goto("/services");
      await settle(page);
      await expect(page.locator(".recko-services-teaser")).toHaveCount(3);
      for (const teaser of await page.locator(".recko-services-teaser").all()) await expect(teaser).toBeVisible();
      await expect(page.locator(".recko-service-artboard")).toHaveCount(3);
      for (const board of await page.locator(".recko-service-artboard").all()) await expect(board).toBeVisible();
      const cards = page.locator(".recko-service-card");
      await expect(cards).toHaveCount(CATALOGUE.length);
      for (const card of await cards.all()) {
        const image = card.locator(".recko-service-card-image img");
        await image.scrollIntoViewIfNeeded();
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth), { timeout: 10_000 }).toBeGreaterThan(0);
      }
    });

    test(`${width}px: everything sits in one straight column`, async ({ page }) => {
      await page.goto("/services");
      await settle(page);
      for (const selector of [".recko-services-teaser", ".recko-service-artboard", ".recko-service-card"]) {
        const boxes = await page.locator(selector).evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return { x: Math.round(r.left), w: Math.round(r.width), top: r.top + window.scrollY, bottom: r.bottom + window.scrollY };
          }),
        );
        expect(boxes.length, selector).toBeGreaterThan(0);
        for (const b of boxes) {
          expect(Math.abs(b.x - boxes[0]!.x), `${selector} starts at a different left edge`).toBeLessThanOrEqual(1);
          expect(Math.abs(b.w - boxes[0]!.w), `${selector} has a different width`).toBeLessThanOrEqual(1);
        }
        for (let i = 1; i < boxes.length; i++) expect(boxes[i]!.top, `${selector} ${i + 1} overlaps the one above`).toBeGreaterThanOrEqual(boxes[i - 1]!.bottom - 1);
        expect(boxes[0]!.w, `${selector} is narrower than the screen allows`).toBeGreaterThan(width - 80);
      }
    });

    test(`${width}px: the Technology section shows both Website Design & Landing Pages and CRM & Automation`, async ({ page }) => {
      await page.goto("/services");
      await settle(page);
      const titles = await page.locator("#technology .recko-service-card h3").allTextContents();
      expect(titles.map((t) => t.trim())).toEqual(["Website Design & Landing Pages", "CRM & Automation"]);
      await page.locator("#technology .recko-service-card", { hasText: "CRM & Automation" }).scrollIntoViewIfNeeded();
      await expect(page.locator("#technology .recko-service-card", { hasText: "CRM & Automation" })).toBeVisible();
    });

    test(`${width}px: every tappable control is at least 44px tall and no heading is clipped`, async ({ page }) => {
      await page.goto("/services");
      await settle(page);
      const small = await page.evaluate(() => {
        const wanted = [
          ...document.querySelectorAll("main .recko-page-hero a, main .recko-services-teaser, main .recko-service-artwork-copy a, main details > summary, main section:last-of-type a"),
        ];
        return wanted
          .map((el) => ({ what: `${el.tagName} ${(el.textContent ?? "").trim().slice(0, 28)}`, h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width) }))
          .filter((m) => m.h > 0 && (m.h < 44 || m.w < 44));
      });
      expect(small, "controls smaller than 44px").toEqual([]);
      const clipped = await page.evaluate(() =>
        [...document.querySelectorAll("main h1, main h2, main h3")]
          .filter((el) => el.scrollWidth > el.clientWidth + 1)
          .map((el) => (el.textContent ?? "").trim().slice(0, 40)),
      );
      expect(clipped, "headings wider than their box").toEqual([]);
    });
  });
}

test.describe("Services page phone details", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("the repeat row of jump links is left out on a phone, because the area cards above it are the links", async ({ page }) => {
    await page.goto("/services");
    await expect(page.getByRole("region", { name: "Service areas" })).toBeHidden();
    await expect(page.locator(".recko-services-teaser").first()).toHaveAttribute("href", "#creative");
    await page.locator(".recko-services-teaser").nth(2).click();
    await expect(page).toHaveURL(/#technology$/);
  });

  test("the services page passes the accessibility scan on a phone", async ({ page }) => {
    await page.goto("/services");
    await settle(page);
    await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; animation: none !important; }" });
    await page.waitForTimeout(200);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes[0]?.target?.join(" ")}`);
    expect(serious).toEqual([]);
  });
});

test.describe("larger screens are unchanged", () => {
  test("a 1280px desktop keeps the three-column area cards, side-by-side panels and the overlapping inset picture", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/services");
    await settle(page);
    const columns = await page.locator(".recko-services-intro-grid").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(3);
    const board = await page.locator(".recko-service-artboard").first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(board).toBe(2);
    await expect(page.locator(".recko-service-inset-image").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Service areas" })).toBeVisible();
    const growthLeft = await page.locator("#growth .recko-service-card").evaluateAll((els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().left))).size);
    expect(growthLeft, "three growth cards in one row").toBe(3);
  });

  for (const width of [640, 768, 1024]) {
    test(`${width}px: no sideways scrolling`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/services");
      await settle(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.locator(".recko-service-card")).toHaveCount(CATALOGUE.length);
    });
  }
});
