import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin, resetStub, stubState } from "./helpers";

test.beforeEach(async () => resetStub());

/** Opens the Pages & content editor on one page and one section. */
async function openEditor(page: Page, pageLabel: string, sectionLabel: string) {
  await page.goto("/admin/content");
  await page.getByRole("button", { name: new RegExp(`^${pageLabel}`) }).click();
  await page.getByRole("navigation", { name: `${pageLabel} sections` }).getByRole("button", { name: new RegExp(`^${sectionLabel}`) }).click();
  await expect(page.getByRole("heading", { level: 2, name: sectionLabel })).toBeVisible();
}
async function confirmDialog(page: Page, role: "alertdialog" = "alertdialog") {
  const dialog = page.getByRole(role);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button").last().click();
  await expect(dialog).toBeHidden();
}
async function saveDraft(page: Page) {
  await page.getByRole("button", { name: "Save draft" }).click();
  await confirmDialog(page);
  await expect(page.getByText(/Draft saved/i).first()).toBeVisible();
}
async function publish(page: Page) {
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await confirmDialog(page);
  await expect(page.getByText(/Published\. The live website/i)).toBeVisible();
}

test.describe("the built-in wording is unchanged until something is published", () => {
  test("About page shows the original text, FAQ and linked words", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Your trusted partner in the digital marketing jungle.");
    await expect(page.getByRole("heading", { name: "Frequently Asked Questions" })).toBeVisible();
    await expect(page.getByText("What is digital marketing?")).toBeVisible();
    const link = page.getByRole("link", { name: "Contact Us", exact: true }).last();
    await expect(link).toHaveAttribute("href", "/contact");
    await expect(page.getByRole("link", { name: "Start a conversation" })).toHaveAttribute("href", "/contact");
  });

  test("Contact page shows the original details, phone links and form wording", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Get In Touch");
    await expect(page.getByRole("link", { name: "team@socialadservices.com" }).first()).toHaveAttribute("href", "mailto:team@socialadservices.com");
    await expect(page.getByRole("link", { name: "(+92) 327 2514632" }).first()).toHaveAttribute("href", "tel:+923272514632");
    await expect(page.getByRole("link", { name: "(+1) 984 2741027" }).first()).toHaveAttribute("href", "tel:+19842741027");
    await expect(page.getByRole("link", { name: "Chat on WhatsApp" })).toHaveAttribute("href", "https://wa.me/923272514632");
    await expect(page.getByText("What would you like to make happen?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send inquiry" })).toBeVisible();
  });
});

test.describe("Pages & content editor", () => {
  test.beforeEach(async ({ page }) => loginAsAdmin(page));

  test("lists every editable page and its sections; the old address still works", async ({ page }) => {
    await page.goto("/admin/homepage");
    await expect(page).toHaveURL(/\/admin\/content/);
    await expect(page.getByRole("heading", { level: 1, name: "Pages & content" })).toBeVisible();
    for (const label of ["Home page", "About page", "Contact page", "Menu & footer"]) {
      await expect(page.getByRole("button", { name: new RegExp(`^${label}`) })).toBeVisible();
    }
    await page.getByRole("button", { name: /^About page/ }).click();
    const sections = page.getByRole("navigation", { name: "About page sections" });
    for (const label of ["Search & sharing", "Top banner", "Our story", "FAQs", "Call to action banner"]) {
      await expect(sections.getByRole("button", { name: new RegExp(`^${label}`) })).toBeVisible();
    }
    await page.getByRole("button", { name: /^Home page/ }).click();
    await expect(page.getByRole("navigation", { name: "Home page sections" }).getByRole("button", { name: /^FAQ/ })).toBeVisible();
  });

  test("edit, save as draft, preview, then publish an About page heading", async ({ page, context }) => {
    await openEditor(page, "About page", "Top banner");
    await page.getByLabel("Heading", { exact: true }).fill("We grow small businesses online.");
    await saveDraft(page);

    // visitors still see the old heading
    const visitor = await context.newPage();
    await visitor.goto("/about");
    await expect(visitor.getByRole("heading", { level: 1 })).toContainText("Your trusted partner");
    await visitor.close();

    // the draft opens in preview mode
    const [preview] = await Promise.all([context.waitForEvent("page"), (async () => {
      await page.getByRole("button", { name: "Preview" }).click();
    })()]);
    await preview.waitForLoadState();
    expect(preview.url()).toContain("/about?preview=draft");
    await expect(preview.getByRole("heading", { level: 1 })).toContainText("We grow small businesses online.");
    await expect(preview.getByText(/Preview mode/i)).toBeVisible();
    await preview.close();

    await publish(page);
    const live = await context.newPage();
    await live.goto("/about");
    await expect(live.getByRole("heading", { level: 1 })).toContainText("We grow small businesses online.");
    await expect(live).toHaveTitle("About ReckoMEDIA"); // search title is its own section and was not touched
  });

  test("About page search title and description are editable and reach the page head", async ({ page, context }) => {
    await openEditor(page, "About page", "Search & sharing");
    await page.getByLabel(/Page title/).fill("About our team | ReckoMEDIA");
    await page.getByLabel("Search description").fill("Meet the people behind ReckoMEDIA.");
    await publish(page);
    const live = await context.newPage();
    await live.goto("/about");
    await expect(live).toHaveTitle("About our team | ReckoMEDIA");
    await expect(live.locator('meta[name="description"]')).toHaveAttribute("content", "Meet the people behind ReckoMEDIA.");
  });

  test("About FAQ: add a question with an answer, and change the linked words and where they go", async ({ page, context }) => {
    await openEditor(page, "About page", "FAQs");
    await page.getByRole("button", { name: /add question/i }).click();
    await page.getByLabel("Question", { exact: true }).last().fill("Do you work with startups?");
    await page.getByLabel("Answer").last().fill("Yes. Many of our clients are startups and small shops.");
    await page.getByLabel("Sentence before the link").fill("Still unsure?");
    await page.getByLabel("Link text").fill("Talk to us");
    await page.getByLabel("Link to").fill("/services");
    await publish(page);

    const live = await context.newPage();
    await live.goto("/about");
    const item = live.locator("details", { hasText: "Do you work with startups?" });
    await expect(item).toHaveCount(1);
    await item.locator("summary").click();
    await expect(item.getByText("Yes. Many of our clients are startups and small shops.")).toBeVisible();
    await expect(live.getByText("Still unsure?")).toBeVisible();
    await expect(live.getByRole("link", { name: "Talk to us" })).toHaveAttribute("href", "/services");
    await expect(live.getByRole("link", { name: "Contact Us", exact: true }).last()).not.toHaveAttribute("href", "/services");
  });

  test("an unsafe link is refused and nothing is saved", async ({ page }) => {
    await openEditor(page, "About page", "Call to action banner");
    await page.getByLabel("Button link").fill("javascript:alert(1)");
    await expect(page.getByRole("alert").filter({ hasText: /full address|path starting/i })).toBeVisible();
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await confirmDialog(page);
    await expect(page.getByText(/is not a valid link/i)).toHaveCount(1); // reported once, not twice
    await page.getByLabel("Button link").fill("//evil.example/phish");
    await expect(page.getByRole("alert").filter({ hasText: /full address|path starting/i })).toBeVisible();
    const { db } = await stubState();
    expect(db["content_published"].some((r) => r.key === "about_cta")).toBe(false);
    expect(db["content_drafts"].some((r) => r.key === "about_cta")).toBe(false);
  });

  test("a section can be hidden from the website", async ({ page, context }) => {
    await openEditor(page, "About page", "Our mission");
    await page.getByRole("switch", { name: "Show this section on the website" }).click();
    await publish(page);
    const live = await context.newPage();
    await live.goto("/about");
    await expect(live.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(live.getByText("Empowering small businesses through social media mastery.")).toHaveCount(0);
    await expect(live.getByRole("heading", { name: "Frequently Asked Questions" })).toBeVisible(); // other sections stay
  });

  test("Home page FAQ is editable: questions, answers and heading", async ({ page, context }) => {
    await openEditor(page, "Home page", "FAQ");
    await page.getByLabel("Heading", { exact: true }).fill("Questions we hear most.");
    await page.getByLabel("Question", { exact: true }).first().fill("How quickly can we start?");
    await page.getByLabel("Answer").first().fill("Usually within one week of our first call.");
    await publish(page);

    const live = await context.newPage();
    await live.goto("/");
    await live.waitForLoadState("networkidle"); // the accordion only responds once the page has finished loading
    const faq = live.locator("#faq");
    await expect(faq.getByRole("heading", { name: "Questions we hear most." })).toBeVisible();
    await faq.getByRole("button", { name: /How quickly can we start\?/ }).click();
    await expect(faq.getByText("Usually within one week of our first call.")).toBeVisible();
  });

  test("Menu & header button: rename links, change where they go, and the footer follows", async ({ page, context }) => {
    await openEditor(page, "Menu & footer", "Menu & header button");
    await page.getByLabel("Link text").nth(1).fill("What we do");
    await page.getByLabel("Header button text").fill("Book a call");
    await page.getByLabel("Header button link").fill("/about");
    await publish(page);

    const live = await context.newPage();
    await live.goto("/portfolio");
    const header = live.getByRole("navigation", { name: "Main navigation" }).first();
    await expect(header.getByRole("link", { name: "What we do" })).toHaveAttribute("href", "/services");
    await expect(header.getByRole("link", { name: "Our Services" })).toHaveCount(0);
    await expect(live.getByRole("link", { name: /Book a call/ })).toHaveAttribute("href", "/about");
    await expect(live.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "What we do" })).toBeVisible();
    // clicking a renamed menu link still navigates in the app
    await header.getByRole("link", { name: "What we do" }).click();
    await expect(live).toHaveURL(/\/services/);
  });

  test("Contact page: banner wording, contact details and inquiry form wording", async ({ page, context }) => {
    await openEditor(page, "Contact page", "Top banner");
    await page.getByLabel("Heading", { exact: true }).fill("Say hello");
    await publish(page);

    await openEditor(page, "Contact page", "Inquiry form wording");
    await page.getByLabel("Send button text").fill("Send it");
    await page.getByLabel("Area of interest choices").fill("Pick one\nBranding\nWebsite");
    await publish(page);

    await openEditor(page, "Menu & footer", "Footer & contact details");
    await page.getByLabel("Phone", { exact: true }).fill("(+92) 300 1112223");
    await page.getByLabel("International phone").fill("");
    await publish(page);

    const live = await context.newPage();
    await live.goto("/contact");
    await expect(live.getByRole("heading", { level: 1 })).toContainText("Say hello");
    await expect(live.getByRole("link", { name: "(+92) 300 1112223" }).first()).toHaveAttribute("href", "tel:+923001112223");
    await expect(live.getByText("(+1) 984 2741027")).toHaveCount(0);
    await expect(live.getByRole("button", { name: "Send it" })).toBeEnabled();
    await expect(live.getByLabel(/area of interest/i).locator("option")).toHaveText(["Pick one", "Branding", "Website"]);

    // the edited form still delivers an inquiry
    await live.waitForTimeout(2600);
    await live.getByLabel(/your name/i).fill("Edited Form Visitor");
    await live.getByLabel(/email address/i).fill("edited@example.com");
    await live.getByLabel(/a little about your project/i).fill("Checking the edited form still works.");
    await live.getByRole("button", { name: "Send it" }).click();
    await expect(live.getByRole("status")).toContainText(/message received/i);
    const { db } = await stubState();
    expect(db["inquiries"].filter((i) => i.email === "edited@example.com")).toHaveLength(1);
  });

  test("switching page with unsaved edits asks first, and Cancel keeps the edits", async ({ page }) => {
    await openEditor(page, "About page", "Top banner");
    await page.getByLabel("Heading", { exact: true }).fill("Half-written heading");
    await page.getByRole("button", { name: /^Contact page/ }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(/Discard unsaved changes/i);
    await dialog.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByLabel("Heading", { exact: true })).toHaveValue("Half-written heading");
  });

  test("a failed publish is reported and the live page does not change", async ({ page, context }) => {
    await openEditor(page, "About page", "Top banner");
    await page.getByLabel("Heading", { exact: true }).fill("Should not go live");
    await fetch("http://127.0.0.1:54329/__fail", { method: "POST", body: JSON.stringify({ match: "rpc:publish_content", status: 500, times: 1 }) });
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await confirmDialog(page);
    await expect(page.getByText(/Could not publish|injected failure/i).first()).toBeVisible();
    const live = await context.newPage();
    await live.goto("/about");
    await expect(live.getByRole("heading", { level: 1 })).toContainText("Your trusted partner");
  });
});
