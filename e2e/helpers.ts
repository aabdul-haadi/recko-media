import { expect, type Page } from "@playwright/test";

export const STUB = "http://127.0.0.1:54329";
export const ADMIN = { email: "admin@reckomedia.com", password: "Admin-Test-1" };
export const VIEWER = { email: "viewer@example.com", password: "Viewer-Test-1" };

export async function resetStub() {
  await fetch(`${STUB}/__reset`, { method: "POST" });
}
export async function injectFailure(match: string, opts: { status?: number; times?: number; delayMs?: number } = {}) {
  await fetch(`${STUB}/__fail`, { method: "POST", body: JSON.stringify({ match, ...opts }) });
}
// Rows of the in-memory stand-in are free-form synthetic objects, so tests read their fields directly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function stubState(): Promise<{ db: Record<string, any[]>; log: string[] }> {
  return (await fetch(`${STUB}/__state`)).json();
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Username or email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

/** Collects uncaught page errors so a test can assert the page never threw. */
export function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}
