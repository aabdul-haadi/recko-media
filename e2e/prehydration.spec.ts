import { expect, test } from "@playwright/test";
import { resetStub } from "./helpers";

test.beforeEach(async () => resetStub());

// Before React hydrates (slow phone, slow network) the server-rendered form is already visible and clickable.
// A native submit then reloads the page and, for a GET form, writes the visitor's details into the URL.
test.describe("contact form before JavaScript is ready", () => {
  test.use({ javaScriptEnabled: false });

  test("a native submit never puts personal details in the URL", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel(/your name/i).fill("Private Person");
    await page.getByLabel(/email address/i).fill("private.person@example.com");
    await page.getByLabel(/a little about your project/i).fill("My confidential project details here.");
    await expect(page.getByRole("button", { name: /send inquiry/i })).toBeDisabled();
    await page.getByRole("button", { name: /send inquiry/i }).click({ force: true });
    await page.getByLabel(/your name/i).press("Enter"); // implicit submission must not fall through either
    await page.waitForLoadState("load");
    expect(page.url()).not.toContain("private.person");
    expect(page.url()).not.toContain("confidential");
  });
});

// The admin sign-in pages are rendered only in the browser (the server sends an empty shell). That is what keeps a
// password out of the URL before React is ready: there is nothing to submit yet. This pins that property down.
test.describe("admin sign-in pages without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const path of ["/admin/login", "/admin/forgot-password", "/admin/reset-password"]) {
    test(`${path} serves no submittable form from the server`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("form")).toHaveCount(0);
      await expect(page.locator('input[type="password"]')).toHaveCount(0);
    });
  }
});
