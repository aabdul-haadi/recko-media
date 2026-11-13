import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loginAsAdmin, resetStub } from "./helpers";

test.beforeEach(async () => resetStub());

/** Serious and critical axe findings fail the test; the rule ids are listed so each can be fixed. */
async function seriousViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0]?.target?.join(" ")}`);
}

test.describe("accessibility (WCAG 2.1 A/AA, serious+critical)", () => {
  for (const path of ["/", "/about", "/services", "/portfolio", "/contact"]) {
    test(`public ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await seriousViolations(page)).toEqual([]);
    });
  }
  test("admin login", async ({ page }) => {
    await page.goto("/admin/login");
    expect(await seriousViolations(page)).toEqual([]);
  });
  for (const path of ["/admin", "/admin/inquiries", "/admin/services", "/admin/contacts"]) {
    test(`admin ${path}`, async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await seriousViolations(page)).toEqual([]);
    });
  }
});

test.describe("keyboard use", () => {
  test("contact form can be completed and submitted with the keyboard only", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("button", { name: /send inquiry/i })).toBeEnabled();
    await page.waitForTimeout(2600);
    await page.getByLabel(/your name/i).focus();
    await page.keyboard.type("Keyboard User");
    await page.keyboard.press("Tab");
    await page.keyboard.type("keys@example.com");
    await page.getByLabel(/a little about your project/i).focus();
    await page.keyboard.type("Typed entirely without a mouse.");
    await page.getByLabel(/a little about your project/i).press("Tab");
    // focus is now on the send button (the next focusable control after the message box)
    await expect(page.getByRole("button", { name: /send inquiry/i })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toContainText(/message received/i);
  });

  test("admin confirmation dialog traps focus and closes with Escape", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/services");
    await page.getByRole("button", { name: "Move Instagram Ads up" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

test.describe("mobile layout @mobile", () => {
  test("mobile menu opens, navigates and closes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "the menu button only exists on phones");
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /menu|open navigation/i }).first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    await page.getByRole("link", { name: /contact/i }).locator("visible=true").first().click();
    await expect(page).toHaveURL(/\/contact/);
  });

  test("admin pages do not scroll sideways on a phone", async ({ page }) => {
    await loginAsAdmin(page);
    for (const path of ["/admin", "/admin/inquiries", "/admin/services", "/admin/contacts", "/admin/tasks", "/admin/homepage"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });

  test("tap targets in the contact form are comfortably sized", async ({ page }) => {
    await page.goto("/contact");
    const boxes = await page.locator("form input:visible, form select:visible, form textarea:visible, form button:visible").evaluateAll((els) =>
      els.map((e) => ({ id: (e as HTMLElement).getAttribute("name") ?? e.tagName, h: e.getBoundingClientRect().height })),
    );
    const tooSmall = boxes.filter((b) => b.h < 40);
    expect(tooSmall).toEqual([]);
  });
});
