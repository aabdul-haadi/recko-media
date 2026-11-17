import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { loginAsAdmin, resetStub, stubState } from "./helpers";

test.beforeEach(async () => resetStub());

async function openEditor(page: Page, pageLabel: string, sectionLabel: string) {
  await page.goto("/admin/content");
  await page.getByRole("button", { name: new RegExp(`^${pageLabel}`) }).click();
  await page.getByRole("navigation", { name: `${pageLabel} sections` }).getByRole("button", { name: new RegExp(`^${sectionLabel}`) }).click();
  await expect(page.getByRole("heading", { level: 2, name: sectionLabel })).toBeVisible();
}
async function confirmDialog(page: Page) {
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button").last().click();
  await expect(dialog).toBeHidden();
}
async function publish(page: Page) {
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await confirmDialog(page);
  await expect(page.getByText(/Published\. The live website/i)).toBeVisible();
}
/** Selects `words` inside a text box, like dragging the mouse over them. */
async function select(box: Locator, words: string) {
  await box.evaluate((el, w) => {
    const area = el as HTMLTextAreaElement;
    const i = area.value.indexOf(w);
    area.focus();
    area.setSelectionRange(i, i + w.length);
  }, words);
}
/** The first FAQ answer box with new text, ready for linking. */
async function writeAnswer(page: Page, text: string) {
  const answer = page.getByLabel("Answer").first();
  await answer.fill(text);
  return answer;
}
/** The editor block (label, text box, link tool) that a text box belongs to. */
const block = (answer: Locator) => answer.locator("xpath=..");

async function linkWords(page: Page, answer: Locator, words: string, choice: { page: string } | { address: string }) {
  await select(answer, words);
  await block(answer).getByRole("button", { name: /link selected words/i }).click();
  const panel = block(answer).getByRole("group", { name: "Add a link" });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText(words);
  if ("page" in choice) {
    await panel.getByLabel("Page or address").selectOption({ label: choice.page });
  } else {
    await panel.getByLabel("Page or address").selectOption({ label: "Another page or website…" });
    await panel.getByLabel("Address", { exact: true }).fill(choice.address);
  }
  await panel.getByRole("button", { name: "Add link" }).click();
}

test.describe("linking words inside FAQ answers", () => {
  test.beforeEach(async ({ page }) => loginAsAdmin(page));

  test("select words, choose a page, publish: visitors see a working link on the home page", async ({ page, context }) => {
    await openEditor(page, "Home page", "FAQ");
    await page.getByLabel("Question", { exact: true }).first().fill("What do you do?");
    const answer = await writeAnswer(page, "We build websites and run social media ads for small businesses.");
    await linkWords(page, answer, "websites", { page: "Our services" });

    await expect(answer).toHaveValue("We build [websites](/services) and run social media ads for small businesses.");
    await expect(page.getByText("How it will look")).toBeVisible();
    await expect(page.getByRole("link", { name: "websites" })).toBeVisible(); // preview inside the editor
    await publish(page);

    const live = await context.newPage();
    await live.goto("/");
    await live.waitForLoadState("networkidle");
    const faq = live.locator("#faq");
    await faq.getByRole("button", { name: /What do you do\?/ }).click();
    const link = faq.getByRole("link", { name: "websites" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/services");
    await expect(faq).not.toContainText("](/services)"); // visitors never see the markup
    await expect(faq).toContainText("We build websites and run social media ads for small businesses.");
    await link.click();
    await expect(live).toHaveURL(/\/services/);
  });

  test("any other website, section or contact address can be linked, in the same answer", async ({ page, context }) => {
    await openEditor(page, "Home page", "FAQ");
    await page.getByLabel("Question", { exact: true }).first().fill("Where can I learn more?");
    const answer = await writeAnswer(page, "Read our guide, see our work, or email us.");
    await linkWords(page, answer, "guide", { address: "https://example.com/guide" });
    await linkWords(page, answer, "our work", { page: "Our work" });
    await linkWords(page, answer, "email us", { address: "mailto:team@socialadservices.com" });
    await expect(answer).toHaveValue("Read our [guide](https://example.com/guide), see [our work](/#work), or [email us](mailto:team@socialadservices.com).");
    await publish(page);

    const live = await context.newPage();
    await live.goto("/");
    await live.waitForLoadState("networkidle");
    const faq = live.locator("#faq");
    await faq.getByRole("button", { name: /Where can I learn more\?/ }).click();
    const guide = faq.getByRole("link", { name: "guide" });
    await expect(guide).toHaveAttribute("href", "https://example.com/guide");
    await expect(guide).toHaveAttribute("target", "_blank");
    await expect(guide).toHaveAttribute("rel", "noopener noreferrer");
    await expect(faq.getByRole("link", { name: "our work" })).toHaveAttribute("href", "/#work");
    await expect(faq.getByRole("link", { name: "email us" })).toHaveAttribute("href", "mailto:team@socialadservices.com");
  });

  test("the FAQ intro text can carry links too, and search engines get the words only", async ({ page, context }) => {
    await openEditor(page, "Home page", "FAQ");
    await page.getByLabel("Question", { exact: true }).first().fill("Do you offer SEO?");
    const answer = await writeAnswer(page, "Yes, see the services page for details.");
    await linkWords(page, answer, "services page", { page: "Our services" });
    await publish(page);

    const live = await context.newPage();
    await live.goto("/");
    const jsonLd = await live.locator('script[type="application/ld+json"]').allTextContents();
    const faq = jsonLd.find((t) => t.includes("FAQPage"))!;
    expect(faq).toContain("Yes, see the services page for details.");
    expect(faq).not.toContain("](");
    expect(faq).not.toContain("/services)");
  });

  test("the About page FAQ answers work the same way", async ({ page, context }) => {
    await openEditor(page, "About page", "FAQs");
    const answer = await writeAnswer(page, "Start by contacting our team today.");
    await page.getByLabel("Question", { exact: true }).first().fill("How do we begin?");
    await linkWords(page, answer, "contacting our team", { page: "Contact us" });
    await publish(page);

    const live = await context.newPage();
    await live.goto("/about");
    await live.waitForLoadState("networkidle");
    const item = live.locator("details", { hasText: "How do we begin?" });
    await item.locator("summary").click();
    await expect(item.getByRole("link", { name: "contacting our team" })).toHaveAttribute("href", "/contact");
  });

  test("pressing the button with nothing selected explains what to do", async ({ page }) => {
    await openEditor(page, "Home page", "FAQ");
    const answer = await writeAnswer(page, "Some words here.");
    await answer.evaluate((el) => (el as HTMLTextAreaElement).setSelectionRange(3, 3));
    await block(answer).getByRole("button", { name: /link selected words/i }).click();
    await expect(block(answer).getByRole("alert").filter({ hasText: /select the words/i })).toBeVisible();
    await expect(page.getByRole("group", { name: "Add a link" })).toHaveCount(0);
  });

  test("an unsafe address is refused in the tool, and typed-in unsafe links block publishing", async ({ page }) => {
    await openEditor(page, "Home page", "FAQ");
    await page.getByLabel("Question", { exact: true }).first().fill("Question?");
    const answer = await writeAnswer(page, "Click here to continue.");
    await linkWords(page, answer, "here", { address: "javascript:alert(1)" });
    await expect(block(answer).getByRole("alert").filter({ hasText: /full address|Choose a page/i })).toBeVisible();
    await expect(answer).toHaveValue("Click here to continue."); // unchanged

    await block(answer).getByRole("group", { name: "Add a link" }).getByLabel("Address", { exact: true }).fill("//evil.example/phish");
    await block(answer).getByRole("group", { name: "Add a link" }).getByRole("button", { name: "Add link" }).click();
    await expect(answer).toHaveValue("Click here to continue.");

    // writing the markup by hand is caught as well
    await answer.fill("Click [here](javascript:alert(1)) to continue.");
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await confirmDialog(page);
    await expect(page.getByText(/is not a valid link/i)).toHaveCount(1);
    const { db } = await stubState();
    expect(db["content_published"].some((r) => r.key === "faq")).toBe(false);
  });

  test("an answer that is already a link can be cleaned with one click", async ({ page }) => {
    await openEditor(page, "Home page", "FAQ");
    const answer = await writeAnswer(page, "Go to [our services](/services) now.");
    await block(answer).getByRole("button", { name: "Remove all links" }).click();
    await expect(answer).toHaveValue("Go to our services now.");
  });

  test("stored text that tries to inject HTML or script links is shown as plain text", async ({ context }) => {
    // The editor refuses to publish unsafe addresses; this seeds such data straight into the live table to prove the
    // public page defends itself as well.
    await fetch("http://127.0.0.1:54329/__seed", {
      method: "POST",
      body: JSON.stringify({
        content_published: [
          {
            key: "faq",
            enabled: true,
            published_at: new Date().toISOString(),
            data: {
              eyebrow: "FAQ",
              heading: "Safe?",
              intro: "",
              items: [{ question: "Safe?", answer: "Text <img src=x onerror=alert(1)> and <b>bold</b> and [ok](/about) [bad](javascript:alert(1)) [worse](//evil.example)." }],
            },
          },
        ],
      }),
    });
    const live = await context.newPage();
    let dialogs = 0;
    live.on("dialog", () => dialogs++);
    await live.goto("/");
    await live.waitForLoadState("networkidle");
    const faq = live.locator("#faq");
    await faq.getByRole("button", { name: /Safe\?/ }).click();
    await expect(faq.getByRole("link", { name: "ok" })).toHaveAttribute("href", "/about");
    await expect(faq.locator("img")).toHaveCount(0);
    await expect(faq.locator("b")).toHaveCount(0);
    await expect(faq.getByRole("link", { name: "bad" })).toHaveCount(0);
    await expect(faq.getByRole("link", { name: "worse" })).toHaveCount(0);
    await expect(faq).toContainText("<b>bold</b>"); // shown as text
    expect(dialogs).toBe(0);
  });
});

test.describe("link panel layout and accessibility", () => {
  test("the open link panel passes the accessibility scan and fits a phone screen @mobile", async ({ page }) => {
    await loginAsAdmin(page);
    await openEditor(page, "Home page", "FAQ");
    const answer = await writeAnswer(page, "Words to link in this answer.");
    await select(answer, "link");
    await block(answer).getByRole("button", { name: /link selected words/i }).click();
    await expect(block(answer).getByRole("group", { name: "Add a link" })).toBeVisible();
    // measure settled colours, not a colour caught part-way through a transition
    await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; animation: none !important; }" });
    await page.waitForTimeout(200);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const serious = results.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}: ${v.nodes[0]?.target?.join(" ")}`);
    expect(serious).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(1);
  });
});
