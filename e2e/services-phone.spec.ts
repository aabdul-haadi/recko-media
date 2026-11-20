import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
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

/** The four carousels on a phone and how many cards each holds: the area cards, then each section's services. */
const CAROUSELS = [
  { name: "area cards", selector: ".recko-services-intro .recko-carousel", slides: 3 },
  { name: "Paid Social & Creative services", selector: "#creative .recko-carousel", slides: 4 },
  { name: "Search & Growth services", selector: "#growth .recko-carousel", slides: 3 },
  { name: "Web Experiences services", selector: "#technology .recko-carousel", slides: 2 },
];

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

/** Opens the page and waits until the carousels are ready (their dots only exist once the page is interactive). */
async function open(page: Page) {
  await page.goto("/services");
  await expect(page.locator(".recko-carousel-dot")).toHaveCount(CAROUSELS.reduce((sum, c) => sum + c.slides, 0));
  await page.waitForLoadState("networkidle").catch(() => {});
}
const track = (page: Page, selector: string) => page.locator(`${selector} .recko-carousel-track`);
const dots = (page: Page, selector: string) => page.locator(`${selector} .recko-carousel-dot`);
/** Scrolls a carousel to card `index` the way a finger swipe would leave it. */
const swipeTo = (box: Locator, index: number) =>
  box.evaluate((el, i) => {
    const slide = el.children[i] as HTMLElement;
    el.scrollTo({ left: slide.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft), behavior: "instant" as ScrollBehavior });
  }, index);

test.beforeEach(async () => {
  await resetStub();
  await seedCatalogue();
});

const PHONES = [320, 360, 390, 430];

for (const width of PHONES) {
  test.describe(`Services page on a ${width}px phone`, () => {
    test.use({ viewport: { width, height: 800 } });

    test(`${width}px: the area cards and each section's service cards are swipeable carousels, and the page itself never scrolls sideways @mobile`, async ({ page }) => {
      await open(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "the page scrolls sideways").toBeLessThanOrEqual(1);
      for (const c of CAROUSELS) {
        const box = track(page, c.selector);
        await expect(box.locator("> *"), c.name).toHaveCount(c.slides);
        const style = await box.evaluate((el) => {
          const s = getComputedStyle(el);
          return { snap: s.scrollSnapType, overflowX: s.overflowX, scrollable: el.scrollWidth > el.clientWidth + 1 };
        });
        expect(style.snap, `${c.name} snaps card by card`).toContain("x");
        expect(style.overflowX, c.name).toBe("auto");
        expect(style.scrollable, `${c.name} can be swiped`).toBe(true);
      }
    });

    test(`${width}px: the next card peeks in from the edge, so it is obvious there is more`, async ({ page }) => {
      await open(page);
      for (const c of CAROUSELS) {
        const [first, second] = await track(page, c.selector).evaluate((el) =>
          [0, 1].map((i) => {
            const r = (el.children[i] as HTMLElement).getBoundingClientRect();
            return { left: Math.round(r.left), right: Math.round(r.right) };
          }),
        );
        expect(first!.left, `${c.name}: first card starts at the page margin`).toBeGreaterThanOrEqual(0);
        expect(first!.right, `${c.name}: first card is fully on screen`).toBeLessThanOrEqual(width);
        expect(second!.left, `${c.name}: second card begins on screen`).toBeLessThan(width - 8);
        expect(second!.right, `${c.name}: second card is cut off by the edge`).toBeGreaterThan(width);
      }
    });

    test(`${width}px: swiping moves from card to card and the dots follow`, async ({ page }) => {
      await open(page);
      for (const c of CAROUSELS) {
        const box = track(page, c.selector);
        const d = dots(page, c.selector);
        await expect(d.nth(0), `${c.name}: starts on the first card`).toHaveAttribute("aria-current", "true");
        await swipeTo(box, 1);
        await expect(d.nth(1), `${c.name}: second dot after a swipe`).toHaveAttribute("aria-current", "true");
        await expect(d.nth(0)).toHaveAttribute("aria-current", "false");
        await swipeTo(box, c.slides - 1);
        await expect(d.nth(c.slides - 1), `${c.name}: last dot at the end`).toHaveAttribute("aria-current", "true");
      }
    });

    test(`${width}px: tapping a dot brings that card into view`, async ({ page }) => {
      await open(page);
      const c = CAROUSELS[1]!;
      const d = dots(page, c.selector);
      await d.nth(2).click();
      await expect(d.nth(2)).toHaveAttribute("aria-current", "true");
      await expect
        .poll(() => track(page, c.selector).evaluate((el) => Math.round((el.children[2] as HTMLElement).getBoundingClientRect().left)), { timeout: 5000 })
        .toBeLessThan(40);
      await expect(page.locator("#creative .recko-service-card").nth(2)).toContainText("Creative & Content Production");
    });

    test(`${width}px: arrow keys move between cards when the carousel has focus`, async ({ page }) => {
      await open(page);
      const c = CAROUSELS[2]!;
      const box = track(page, c.selector);
      await box.focus();
      await page.keyboard.press("ArrowRight");
      await expect(dots(page, c.selector).nth(1)).toHaveAttribute("aria-current", "true");
      await page.keyboard.press("End");
      await expect(dots(page, c.selector).nth(c.slides - 1)).toHaveAttribute("aria-current", "true");
      await page.keyboard.press("ArrowLeft");
      await expect(dots(page, c.selector).nth(c.slides - 2)).toHaveAttribute("aria-current", "true");
      await page.keyboard.press("Home");
      await expect(dots(page, c.selector).nth(0)).toHaveAttribute("aria-current", "true");
    });

    test(`${width}px: every card is reachable and its picture loads`, async ({ page }) => {
      await open(page);
      for (const c of CAROUSELS.slice(1)) {
        const box = track(page, c.selector);
        await box.scrollIntoViewIfNeeded();
        for (let i = 0; i < c.slides; i++) {
          await swipeTo(box, i);
          const image = box.locator("> *").nth(i).locator(".recko-service-card-image img");
          await expect(image, `${c.name} card ${i + 1}`).toBeVisible();
          await expect.poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth), { timeout: 10_000 }).toBeGreaterThan(0);
        }
      }
      for (const board of await page.locator(".recko-service-artboard").all()) await expect(board).toBeVisible(); // the panels are still shown
    });

    test(`${width}px: Web Experiences holds Website Design & Landing Pages and then CRM & Automation`, async ({ page }) => {
      await open(page);
      const titles = await page.locator("#technology .recko-service-card h3").allTextContents();
      expect(titles.map((t) => t.trim())).toEqual(["Website Design & Landing Pages", "CRM & Automation"]);
      const box = track(page, "#technology .recko-carousel");
      await box.scrollIntoViewIfNeeded();
      await swipeTo(box, 1);
      await expect(page.locator("#technology .recko-service-card", { hasText: "CRM & Automation" })).toBeInViewport({ ratio: 0.6 });
    });

    test(`${width}px: the carousels are announced to screen readers, and every control is at least 44px with no clipped headings`, async ({ page }) => {
      await open(page);
      for (const c of CAROUSELS) {
        const box = track(page, c.selector);
        await expect(box, c.name).toHaveAttribute("role", "region");
        await expect(box).toHaveAttribute("aria-roledescription", "carousel");
        await expect(box).toHaveAttribute("tabindex", "0");
        expect(await box.getAttribute("aria-label")).toContain(c.name === "area cards" ? "three service areas" : "services");
        await expect(dots(page, c.selector).first()).toHaveAttribute("aria-label", /Show item 1 of/);
      }
      const small = await page.evaluate(() => {
        const wanted = [
          ...document.querySelectorAll(
            "main .recko-page-hero a, main .recko-services-teaser, main .recko-carousel-dot, main .recko-service-artwork-copy a, main details > summary, main section:last-of-type a",
          ),
        ];
        return wanted
          .map((el) => ({ what: `${el.tagName} ${(el.textContent ?? "").trim().slice(0, 28)}`, h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width) }))
          .filter((m) => m.h > 0 && (m.h < 44 || m.w < 44));
      });
      expect(small, "controls smaller than 44px").toEqual([]);
      const clipped = await page.evaluate(() =>
        [...document.querySelectorAll("main h1, main h2, main h3")].filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => (el.textContent ?? "").trim().slice(0, 40)),
      );
      expect(clipped, "headings wider than their box").toEqual([]);
    });
  });
}

test.describe("Services page phone details", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("the repeat row of jump links is left out on a phone, because the area cards are the links", async ({ page }) => {
    await open(page);
    await expect(page.getByRole("region", { name: "Service areas", exact: true })).toBeHidden();
    await expect(page.locator(".recko-services-teaser").first()).toHaveAttribute("href", "#creative");
    await swipeTo(track(page, ".recko-services-intro .recko-carousel"), 2);
    await page.locator(".recko-services-teaser").nth(2).click();
    await expect(page).toHaveURL(/#technology$/);
  });

  test("the services page passes the accessibility scan on a phone, carousels included", async ({ page }) => {
    await open(page);
    await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; animation: none !important; }" });
    await page.waitForTimeout(200);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes[0]?.target?.join(" ")}`);
    expect(serious).toEqual([]);
  });
});

test.describe("larger screens are unchanged", () => {
  test("a 1280px desktop has no carousel: three-column area cards, side-by-side panels, the inset picture, three growth cards in a row", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/services");
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page.locator(".recko-services-teaser").first()).toBeVisible();
    await expect(page.locator(".recko-carousel-dot")).toHaveCount(0);
    await expect(page.locator("[aria-roledescription='carousel']")).toHaveCount(0);
    const snap = await page.locator(".recko-carousel-track").evaluateAll((els) => els.filter((el) => getComputedStyle(el).scrollSnapType !== "none").length);
    expect(snap, "scroll-snap on desktop").toBe(0);
    expect(await page.locator(".recko-services-intro-grid").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(3);
    expect(await page.locator(".recko-service-artboard").first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(2);
    await expect(page.locator(".recko-service-inset-image").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Service areas", exact: true })).toBeVisible();
    const growthLeft = await page.locator("#growth .recko-service-card").evaluateAll((els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().left))).size);
    expect(growthLeft, "three growth cards in one row").toBe(3);
  });

  for (const width of [768, 1024]) {
    test(`${width}px: not a carousel, and no sideways scrolling`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/services");
      await page.waitForLoadState("networkidle").catch(() => {});
      await expect(page.locator(".recko-service-card")).toHaveCount(CATALOGUE.length);
      await expect(page.locator(".recko-carousel-dot")).toHaveCount(0);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("a 700px small tablet still gets the carousels (the phone layout runs up to 767px)", async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 900 });
    await open(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
