import { expect, test, type Page } from "@playwright/test";
import { ADMIN, VIEWER, injectFailure, loginAsAdmin, resetStub, stubState, trackPageErrors } from "./helpers";

test.beforeEach(async () => resetStub());

/** Clicks the action button of the admin confirmation dialog (every admin change goes through one). */
async function confirmDialog(page: Page) {
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button").last().click();
  await expect(dialog).toBeHidden();
}

test.describe("admin authentication", () => {
  test("signed-out visitors are redirected to the login page", async ({ page }) => {
    for (const path of ["/admin", "/admin/inquiries", "/admin/services", "/admin/contacts"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login/);
    }
  });

  test("wrong password shows a clear error and stays on the login page", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Username or email").fill(ADMIN.email);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toHaveText("Incorrect email or password.");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("a signed-in non-admin account is refused", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Username or email").fill(VIEWER.email);
    await page.getByLabel("Password").fill(VIEWER.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toContainText("does not have admin access");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("admin signs in, survives a reload, and signs out", async ({ page }) => {
    const errors = trackPageErrors(page);
    await loginAsAdmin(page);
    await expect(page.getByRole("heading", { name: /new inquir|inquiries/i }).first()).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await page.getByRole("button", { name: "Sign out" }).locator("visible=true").first().click();
    await confirmDialog(page);
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin/inquiries");
    await expect(page).toHaveURL(/\/admin\/login/);
    expect(errors).toEqual([]);
  });

  test("the short username form signs in", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Username or email").fill("admin");
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);
  });

  test("double-clicking Sign in only signs in once", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Username or email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).dblclick();
    await expect(page).toHaveURL(/\/admin\/?$/);
    const { log } = await stubState();
    expect(log.filter((l) => l.includes("/auth/v1/token")).length).toBe(1);
  });

  test("password reset always gives the same neutral confirmation", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByRole("link", { name: /forgot your password/i }).click();
    await page.getByLabel("Email").fill("anyone@example.com");
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(page.getByRole("status")).toContainText("If an admin account exists");
  });
});

test.describe("admin inquiries", () => {
  test.beforeEach(async ({ page }) => loginAsAdmin(page));

  test("lists real inquiries and hides spam by default @mobile", async ({ page }) => {
    await page.goto("/admin/inquiries");
    await expect(page.getByRole("button", { name: "Alice Example" })).toBeVisible();
    await expect(page.getByText("Spammer")).toHaveCount(0);
  });

  test("search narrows the list and special characters never break it", async ({ page }) => {
    await page.goto("/admin/inquiries");
    const search = page.getByPlaceholder("Search name, email, message…");
    await search.fill("alice");
    await expect(page.getByRole("button", { name: "Alice Example" })).toBeVisible();
    await expect(page.getByText("Mallory")).toHaveCount(0);
    for (const nasty of ['O"Brien', "a,b)(", "100%", "back\\slash", "x') or (1=1", "<script>alert(1)</script>"]) {
      await search.fill(nasty);
      await page.waitForTimeout(500);
      await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
    }
    await search.fill("Brien");
    await expect(page.getByRole("button", { name: /Brien/ })).toBeVisible();
    await search.fill("zzz-no-such-person");
    await expect(page.getByText(/no inquiries|nothing|no results/i).first()).toBeVisible();
  });

  test("a javascript: page address is shown as text, never as a clickable link", async ({ page }) => {
    await page.goto("/admin/inquiries");
    await page.getByRole("button", { name: "Mallory" }).click();
    await expect(page.getByText("javascript:alert(document.cookie)").locator("visible=true").first()).toBeVisible();
    const hrefs = await page.locator("a[href]").evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    expect(hrefs.filter((h) => /^\s*javascript:/i.test(h))).toEqual([]);
  });

  test("a failed update is reported, not silently lost", async ({ page }) => {
    await page.goto("/admin/inquiries");
    await page.getByRole("button", { name: "Alice Example" }).click();
    await injectFailure("PATCH inquiries", { status: 500 });
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    await confirmDialog(page);
    await expect(page.getByText(/could not|failed|error/i).first()).toBeVisible();
    const { db } = await stubState();
    expect(db["inquiries"].find((i) => i.name === "Alice Example").archived).toBe(false);
  });
});

test.describe("admin services", () => {
  test.beforeEach(async ({ page }) => loginAsAdmin(page));

  test("lists services grouped by category with publish state @mobile", async ({ page }) => {
    await page.goto("/admin/services");
    await expect(page.getByRole("button", { name: /^Facebook Ads/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Website Design/ })).toBeVisible();
    await expect(page.getByLabel("Publish Website Design")).not.toBeChecked();
    await expect(page.getByLabel("Publish Facebook Ads")).toBeChecked();
  });

  test("creates a service and rejects a duplicate slug with a clear message", async ({ page }) => {
    await page.goto("/admin/services");
    await page.getByRole("button", { name: /new service/i }).click();
    await page.getByLabel("Name", { exact: true }).fill("Brand Strategy");
    await page.getByLabel("Short description").fill("Positioning that people remember.");
    await page.getByRole("button", { name: /create service/i }).click();
    await confirmDialog(page);
    await expect(page.getByRole("button", { name: /^Brand Strategy/ })).toBeVisible();

    await page.getByRole("button", { name: /new service/i }).click();
    await page.getByLabel("Name", { exact: true }).fill("Brand Strategy");
    await page.getByLabel("Short description").fill("Duplicate.");
    await page.getByRole("button", { name: /create service/i }).click();
    await confirmDialog(page);
    await expect(page.getByRole("alert").filter({ hasText: /already uses that URL slug/i })).toBeVisible();
    const { db } = await stubState();
    expect(db["services"].filter((s) => s.slug === "brand-strategy")).toHaveLength(1);
  });

  test("validates the slug and button link before saving", async ({ page }) => {
    await page.goto("/admin/services");
    await page.getByRole("button", { name: /new service/i }).click();
    await page.getByLabel("Name", { exact: true }).fill("Bad Link");
    await page.getByLabel("Short description").fill("x");
    await page.getByLabel("Button link").fill("javascript:alert(1)");
    await page.getByRole("button", { name: /create service/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /button link/i })).toBeVisible();
    await page.getByLabel("Button link").fill("//evil.example/phish");
    await page.getByRole("button", { name: /create service/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /button link/i })).toBeVisible();
    expect((await stubState()).log.filter((l) => l.startsWith("POST services"))).toHaveLength(0);
  });

  test("publish toggle asks for confirmation and updates the service", async ({ page }) => {
    await page.goto("/admin/services");
    await page.getByLabel("Publish Website Design").click();
    await confirmDialog(page);
    await expect.poll(async () => (await stubState()).db["services"].find((s) => s.title === "Website Design").status).toBe("published");
  });

  test("moving a service up swaps the order, and cancelling the dialog changes nothing", async ({ page }) => {
    await page.goto("/admin/services");
    await page.getByRole("button", { name: "Move Instagram Ads up" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /cancel/i }).click();
    expect((await stubState()).db["services"].find((s) => s.title === "Instagram Ads").sort_order).toBe(2);

    await page.getByRole("button", { name: "Move Instagram Ads up" }).click();
    await confirmDialog(page);
    await expect.poll(async () => (await stubState()).db["services"].find((s) => s.title === "Instagram Ads").sort_order).toBe(1);
    const { db } = await stubState();
    expect(db["services"].find((s) => s.title === "Facebook Ads").sort_order).toBe(2);
  });

  test("a failure halfway through reordering is rolled back so positions never collide", async ({ page }) => {
    await page.goto("/admin/services");
    await page.getByRole("button", { name: "Move Instagram Ads up" }).click();
    // The first write (Instagram -> 1) succeeds, the second (Facebook -> 2) fails.
    await fetch("http://127.0.0.1:54329/__fail", { method: "POST", body: JSON.stringify({ match: "PATCH services", status: 500, times: 1, skip: 1 }) });
    await confirmDialog(page);
    await expect(page.getByText(/could not reorder/i)).toBeVisible();
    await page.waitForTimeout(500);
    const { db } = await stubState();
    const orders = db["services"].filter((s) => s.category === "creative").map((s) => s.sort_order).sort();
    expect(new Set(orders).size, `creative positions ${orders}`).toBe(orders.length);
  });

  test("deleting asks first, then removes the service", async ({ page }) => {
    await page.goto("/admin/services");
    await page.getByRole("button", { name: "Delete Website Design" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /cancel/i }).click();
    expect((await stubState()).db["services"].some((s) => s.title === "Website Design")).toBe(true);
    await page.getByRole("button", { name: "Delete Website Design" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /delete permanently/i }).click();
    await expect.poll(async () => (await stubState()).db["services"].some((s) => s.title === "Website Design")).toBe(false);
  });

  test("a load failure shows an error state, not a blank page", async ({ page }) => {
    await injectFailure("GET services", { status: 500, times: 6 });
    await page.goto("/admin/services");
    await expect(page.getByRole("alert").first()).toBeVisible();
  });
});

test.describe("admin contacts", () => {
  test.beforeEach(async ({ page }) => loginAsAdmin(page));

  test("lists and searches contacts, special characters are safe @mobile", async ({ page }) => {
    await page.goto("/admin/contacts");
    await expect(page.getByText("Alice Example").locator("visible=true").first()).toBeVisible();
    await expect(page.getByText("Carol Client").locator("visible=true").first()).toBeVisible();
    const search = page.getByLabel("Search contacts");
    await search.fill("carol");
    await expect(page.getByText("Alice Example").locator("visible=true")).toHaveCount(0);
    for (const nasty of ['"', "a,b", "(x)", "\\", "%"]) {
      await search.fill(nasty);
      await page.waitForTimeout(400);
      await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
    }
  });
});
