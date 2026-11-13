import { expect, test } from "@playwright/test";
import { ADMIN, injectFailure, resetStub, stubState } from "./helpers";

test.beforeEach(async () => resetStub());

test.describe("intermittent-failure reproductions", () => {
  test("login lands on the dashboard and never bounces back to /admin/login when the admin check is slow", async ({ page }) => {
    const visited: string[] = [];
    page.on("framenavigated", (f) => f === page.mainFrame() && visited.push(new URL(f.url()).pathname));
    await page.goto("/admin/login");
    await page.getByLabel("Username or email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    // The role check (is_admin) answers slowly, as it does on a busy or distant database.
    await fetch("http://127.0.0.1:54329/__slow", { method: "POST", body: JSON.stringify({ match: "rpc:is_admin", delayMs: 1500, times: 4 }) });
    visited.length = 0; // record only what happens after the click
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForTimeout(5000);
    await expect(page).toHaveURL(/\/admin\/?$/);
    expect(visited.filter((p) => p === "/admin/login"), `navigation trail after sign-in: ${visited.join(" > ")}`).toEqual([]);
  });

  test("a reload with a slow admin check keeps the signed-in admin on the page", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Username or email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await fetch("http://127.0.0.1:54329/__slow", { method: "POST", body: JSON.stringify({ match: "rpc:is_admin", delayMs: 1500, times: 4 }) });
    await page.reload();
    await page.waitForTimeout(4000);
    await expect(page).toHaveURL(/\/admin\/?$/);
  });

  test("rapid typing in search shows the results for the last text typed, not an earlier slower request", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Username or email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await page.goto("/admin/inquiries");
    await expect(page.getByRole("button", { name: "Alice Example" })).toBeVisible();
    // The first search request is slow, the second is fast: the slow (older) one must not overwrite the newer result.
    await fetch("http://127.0.0.1:54329/__slow", { method: "POST", body: JSON.stringify({ match: "GET inquiries", delayMs: 1500, times: 1 }) });
    const search = page.getByPlaceholder("Search name, email, message…");
    await search.fill("alice");
    await page.waitForTimeout(300);
    await search.fill("mallory");
    await page.waitForTimeout(3000);
    await expect(page.getByRole("button", { name: "Mallory" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Alice Example" })).toHaveCount(0);
    expect((await stubState()).db["inquiries"].length).toBeGreaterThan(0);
  });
});
