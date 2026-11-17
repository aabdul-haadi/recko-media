import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin, resetStub } from "./helpers";

test.beforeEach(async () => resetStub());

/** Makes the stand-in backend answer the matching requests late, so the loading state can be observed. */
async function slow(match: string, delayMs = 2500, times = 4) {
  await fetch("http://127.0.0.1:54329/__slow", { method: "POST", body: JSON.stringify({ match, delayMs, times }) });
}
const loadingNote = (page: Page, text: string) => page.getByRole("status").filter({ hasText: text });

test.describe("About page FAQs are complete", () => {
  test("all five questions open to a real answer", async ({ page }) => {
    await page.goto("/about");
    const section = page.locator("section", { hasText: "Frequently Asked Questions" });
    const items = section.locator("li");
    await expect(items).toHaveCount(5);
    await expect(section.locator("details")).toHaveCount(5); // none is left as a bare question
    for (let i = 0; i < 5; i++) {
      const item = section.locator("details").nth(i);
      await item.locator("summary").click();
      const answer = item.locator("p");
      await expect(answer).toBeVisible();
      expect((await answer.innerText()).trim().length, `answer ${i + 1} is empty or too short`).toBeGreaterThan(100);
    }
    await expect(section.getByRole("link", { name: "Contact Us" })).toHaveAttribute("href", "/contact");
  });

  test("the answers match the wording of the home page FAQ for the same questions", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const home = page.locator("#faq");
    await home.getByRole("button", { name: /What is digital marketing\?/ }).click();
    const homeAnswer = (await home.getByText(/Digital marketing is the use of digital channels/).innerText()).trim();
    await page.goto("/about");
    const item = page.locator("details", { hasText: "What is digital marketing?" });
    await item.locator("summary").click();
    expect((await item.locator("p").innerText()).trim()).toBe(homeAnswer);
  });
});

test.describe("admin loading states are skeletons, not blank space or misleading messages", () => {
  test.beforeEach(async ({ page }) => loginAsAdmin(page));

  test("inquiries: shapes while loading, no false 'No results', then the real rows", async ({ page }) => {
    await slow("GET inquiries");
    await page.goto("/admin/inquiries");
    await expect(loadingNote(page, "Loading inquiries")).toBeVisible();
    await expect(page.getByText("No results")).toHaveCount(0);
    await expect(page.getByText("No inquiries found")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Alice Example" })).toBeVisible({ timeout: 15_000 });
    await expect(loadingNote(page, "Loading inquiries")).toHaveCount(0);
  });

  test("services: no 'No creative services' flash while loading", async ({ page }) => {
    await slow("GET services");
    await page.goto("/admin/services");
    await expect(loadingNote(page, "Loading services")).toBeVisible();
    await expect(page.getByText(/No (creative|growth|technology) services/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Facebook Ads/ })).toBeVisible({ timeout: 15_000 });
    await expect(loadingNote(page, "Loading services")).toHaveCount(0);
  });

  test("page editor: form skeleton until the saved content has loaded, then the real fields", async ({ page }) => {
    await slow("GET content_drafts");
    await page.goto("/admin/content");
    await expect(loadingNote(page, "Loading content")).toBeVisible();
    await expect(page.getByLabel("SEO title")).toHaveCount(0); // no empty form that could be typed into and overwritten
    await expect(page.getByLabel("SEO title")).toBeVisible({ timeout: 15_000 });
    await expect(loadingNote(page, "Loading content")).toHaveCount(0);
  });

  test("dashboard: chart and lists show shapes while loading", async ({ page }) => {
    await slow("GET inquiries");
    await page.goto("/admin");
    await expect(loadingNote(page, "Loading chart")).toBeVisible();
    await expect(loadingNote(page, "Loading chart")).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Inquiries over time" })).toBeVisible();
  });

  test("while the sign-in is being checked the whole admin is a skeleton", async ({ page }) => {
    await page.goto("/admin");
    await slow("POST rpc:is_admin", 2500, 2);
    await page.reload();
    await expect(loadingNote(page, "Loading the admin")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(loadingNote(page, "Loading the admin")).toHaveCount(0);
  });

  test("the pulse animation stops for people who prefer reduced motion", async ({ page }) => {
    await slow("GET inquiries", 4000, 4);
    await page.goto("/admin/inquiries");
    const shape = page.locator('[role="status"] .animate-pulse').first();
    await expect(shape).toBeVisible();
    expect(await shape.evaluate((el) => getComputedStyle(el).animationName)).toBe("pulse");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await shape.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  });

  test("a loading skeleton is announced once and its shapes are hidden from screen readers @mobile", async ({ page }) => {
    await slow("GET inquiries", 4000, 4);
    await page.goto("/admin/inquiries");
    const note = loadingNote(page, "Loading inquiries");
    await expect(note).toBeVisible();
    await expect(note).toHaveAttribute("aria-busy", "true");
    expect(await note.locator("[aria-hidden='true']").count()).toBeGreaterThan(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "skeleton makes the page scroll sideways").toBeLessThanOrEqual(1);
  });
});

test.describe("sign-in pages are clean: no box, no field borders, no clutter", () => {
  const styles = (page: Page, selector: string) =>
    page.locator(selector).first().evaluate((el) => {
      const s = getComputedStyle(el);
      return { border: s.borderTopWidth, shadow: s.boxShadow, image: s.backgroundImage, bg: s.backgroundColor, radius: s.borderTopLeftRadius };
    });

  for (const path of ["/admin/login", "/admin/forgot-password"]) {
    test(`${path}: fields and form have no borders and there is no boxed card @mobile`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForLoadState("networkidle");
      const input = await styles(page, ".auth-card input");
      expect(input.border).toBe("0px");
      expect(input.bg).not.toBe("rgba(0, 0, 0, 0)"); // a soft filled shape instead of an outline
      expect(input.radius).not.toBe("0px");
      const card = await styles(page, ".auth-card");
      expect(card.border).toBe("0px");
      expect(card.shadow).toBe("none");
      expect(card.image).toBe("none");
      expect(card.bg).toBe("rgba(0, 0, 0, 0)");
      const button = await styles(page, ".auth-card button[type=submit]");
      expect(button.border).toBe("0px");
      for (const clutter of [".auth-glow", ".auth-ring", ".auth-grid", ".auth-orbits"]) {
        await expect(page.locator(clutter), `${clutter} should be gone`).toHaveCount(0);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(1);
    });
  }

  test("the sign-in page explains itself with a title and a short line", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    await expect(page.getByText("Welcome back. Sign in to manage your website.")).toBeVisible();
    await page.goto("/admin/forgot-password");
    await expect(page.getByRole("heading", { level: 1, name: "Reset password" })).toBeVisible();
    await expect(page.getByText(/send you a link to choose a new password/i)).toBeVisible();
  });

  test("keyboard focus is still clearly visible even though the fields have no border", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("networkidle");
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => document.activeElement?.id === "email")) break;
    }
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("email");
    const outline = await page.getByLabel("Username or email").evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThanOrEqual(2);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("type"))).toBe("submit");
    const button = await page.getByRole("button", { name: "Sign in" }).evaluate((el) => ({ style: getComputedStyle(el).outlineStyle, width: parseFloat(getComputedStyle(el).outlineWidth) }));
    expect(button.style).not.toBe("none");
    expect(button.width).toBeGreaterThanOrEqual(2);
  });

  test("a wrong password is still explained clearly, in the same clean style", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Username or email").fill("admin@reckomedia.com");
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    const alert = page.getByRole("alert");
    await expect(alert).toHaveText("Incorrect email or password.");
    const border = await alert.evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(border).toBe("0px");
  });

  for (const path of ["/admin/login", "/admin/forgot-password"]) {
    test(`${path} passes the accessibility scan`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; animation: none !important; }" });
      await page.waitForTimeout(200);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes[0]?.target?.join(" ")}`);
      expect(serious).toEqual([]);
    });
  }
});
