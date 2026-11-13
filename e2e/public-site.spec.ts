import { expect, test } from "@playwright/test";
import { injectFailure, resetStub, stubState, trackPageErrors } from "./helpers";

test.beforeEach(async () => resetStub());

const pages = [
  { path: "/", title: /ReckoMEDIA|Recko Media/i },
  { path: "/about", title: /About/i },
  { path: "/services", title: /Services/i },
  { path: "/portfolio", title: /Portfolio/i },
  { path: "/contact", title: /Contact/i },
];

test.describe("public navigation", () => {
  for (const { path, title } of pages) {
    test(`${path} renders without errors @mobile`, async ({ page }) => {
      const errors = trackPageErrors(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(title);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(errors).toEqual([]);
    });

    test(`${path} has no horizontal overflow @mobile`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(1);
    });
  }

  test("unknown route shows a not-found page, not a crash", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/not found|404/i).first()).toBeVisible();
  });

  test("header links navigate between pages", async ({ page }) => {
    await page.goto("/");
    for (const [name, url] of [["About", /\/about/], ["Contact", /\/contact/]] as const) {
      await page.getByRole("link", { name: new RegExp(`^${name}`, "i") }).first().click();
      await expect(page).toHaveURL(url);
    }
  });
});

test.describe("contact form", () => {
  const fill = async (page: import("@playwright/test").Page, over: Record<string, string> = {}) => {
    await expect(page.getByRole("button", { name: /send inquiry/i })).toBeEnabled(); // form is hydrated
    const v = { name: "Test Visitor", email: "visitor@example.com", message: "I would like a quote for a new website.", ...over };
    await page.getByLabel(/your name/i).fill(v.name);
    await page.getByLabel(/email address/i).fill(v.email);
    await page.getByLabel(/a little about your project/i).fill(v.message);
  };

  const openForm = async (page: import("@playwright/test").Page) => {
    await page.goto("/contact");
    await expect(page.getByRole("button", { name: /send inquiry/i })).toBeEnabled(); // hydrated
    await page.waitForTimeout(2600); // the form's timer starts at hydration
  };

  test("empty submit shows field errors and focuses the first invalid field @mobile", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("button", { name: /send inquiry/i })).toBeEnabled();
    await page.getByRole("button", { name: /send inquiry/i }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page.getByLabel(/your name/i)).toBeFocused();
    expect((await stubState()).db["inquiries"].length).toBe(4); // nothing was sent
  });

  test("invalid email and short message are rejected before sending", async ({ page }) => {
    await page.goto("/contact");
    await fill(page, { email: "not-an-email", message: "short" });
    await page.getByRole("button", { name: /send inquiry/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
    await expect(page.getByText(/at least 10 characters/i)).toBeVisible();
  });

  test("valid submission is stored once and confirms to the visitor @mobile", async ({ page }) => {
    await openForm(page);
    await fill(page);
    await page.getByRole("button", { name: /send inquiry/i }).click();
    await expect(page.getByRole("status")).toContainText(/message received/i);
    const { db } = await stubState();
    const mine = db["inquiries"].filter((i) => i.email === "visitor@example.com");
    expect(mine).toHaveLength(1);
    expect(mine[0].spam).toBe(false);
  });

  test("double-clicking send creates a single inquiry", async ({ page }) => {
    await openForm(page);
    await fill(page);
    await page.getByRole("button", { name: /send inquiry/i }).dblclick();
    await expect(page.getByRole("status")).toContainText(/message received/i);
    const { db, log } = await stubState();
    expect(db["inquiries"].filter((i) => i.email === "visitor@example.com")).toHaveLength(1);
    expect(log.filter((l) => l.includes("submit_inquiry"))).toHaveLength(1);
  });

  test("server failure shows an error, keeps the typed data, and a retry succeeds", async ({ page }) => {
    await openForm(page);
    await fill(page);
    await injectFailure("rpc:submit_inquiry", { status: 500 });
    await page.getByRole("button", { name: /send inquiry/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /could not|try again/i })).toBeVisible();
    await expect(page.getByLabel(/your name/i)).toHaveValue("Test Visitor");
    await page.getByRole("button", { name: /send inquiry/i }).click();
    await expect(page.getByRole("status")).toContainText(/message received/i);
  });

  test("network drop shows a connection message", async ({ page }) => {
    await openForm(page);
    await fill(page);
    await injectFailure("rpc:submit_inquiry", { status: 0, times: 10 });
    await page.getByRole("button", { name: /send inquiry/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /reach the server|try again|could not/i })).toBeVisible();
    const { db } = await stubState();
    expect(db["inquiries"].filter((i) => i.email === "visitor@example.com")).toHaveLength(0);
  });

  test("a single dropped connection is retried transparently and stored exactly once", async ({ page }) => {
    await openForm(page);
    await fill(page);
    await injectFailure("rpc:submit_inquiry", { status: 0, times: 1 });
    await page.getByRole("button", { name: /send inquiry/i }).click();
    await expect(page.getByRole("status")).toContainText(/message received/i);
    const { db, log } = await stubState();
    expect(db["inquiries"].filter((i) => i.email === "visitor@example.com")).toHaveLength(1);
    console.log("submit_inquiry calls for one click:", log.filter((l) => l.includes("submit_inquiry")).length);
  });

  test("rate limit is explained in plain language", async ({ page }) => {
    await openForm(page);
    await fill(page);
    await injectFailure("rpc:submit_inquiry", { status: 429 });
    await page.getByRole("button", { name: /send inquiry/i }).click();
    await expect(page.getByText(/several messages recently|could not send/i)).toBeVisible();
  });

  test("honeypot field is hidden from people and assistive tech", async ({ page }) => {
    await page.goto("/contact");
    const trap = page.locator('input[name="fax_number_2"]');
    await expect(trap).toHaveCount(1);
    await expect(trap).not.toBeInViewport();
    expect(await trap.evaluate((el) => el.closest('[aria-hidden="true"]') !== null)).toBe(true);
  });
});
