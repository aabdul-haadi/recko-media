import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STUB, resetStub, loginAsAdmin, stubState, injectFailure } from "./helpers";
const item = (n: number, status = "published") => ({
  id: `40000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  title: `Project ${n}`,
  alt: `Website project ${n}`,
  description: "A considered digital experience.",
  category: n % 2 ? "Web" : "Commerce",
  tags: ["Design"],
  status,
  sort_order: n,
  image_path: `project-${n}/full.webp`,
  thumb_path: `project-${n}/thumb.webp`,
  small_path: `project-${n}/small.webp`,
  original_path: `project-${n}/original.png`,
  width: 1920,
  height: 5124,
  bytes: 332842,
  updated_at: "2026-11-16T12:00:00Z",
});
async function seed(count = 3) {
  await fetch(`${STUB}/__seed`, {
    method: "POST",
    body: JSON.stringify({
      portfolio_items: [
        ...Array.from({ length: count }, (_, i) => item(i + 1)),
        item(count + 1, "draft"),
      ],
    }),
  });
}
const yes = async (page: Page) =>
  page.getByRole("alertdialog").getByRole("button", { name: /Yes/ }).click();
async function openViewer(page: Page) {
  await page.goto("/portfolio");
  await page.getByRole("button", { name: "View Project 1", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").locator(".portfolio-stage img")).toHaveCSS("opacity", "1");
}
test.beforeEach(async () => {
  await resetStub();
  await seed();
});

test("public gallery uses published database items, categories, and no full images before opening @mobile", async ({
  page,
}) => {
  const images: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "image") images.push(r.url());
  });
  await page.goto("/portfolio");
  await expect(page.locator(".portfolio-card")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "View Project 4", exact: true })).toHaveCount(0);
  expect(images.some((url) => url.includes("/full.webp"))).toBe(false);
  await page.getByRole("button", { name: "Commerce", exact: true }).click();
  await expect(page.locator(".portfolio-card")).toHaveCount(1);
  await page.getByRole("button", { name: "All work", exact: true }).click();
  await page.getByLabel("Search portfolio").fill("Project 3");
  await expect(page.locator(".portfolio-card")).toHaveCount(1);
});
test("viewer arrows, keyboard, zoom, pan, reset, Escape and focus restoration @mobile", async ({
  page,
}) => {
  await openViewer(page);
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Next image", exact: true }).click();
  await expect(dialog.getByRole("heading")).toHaveText("Project 2");
  await page.keyboard.press("ArrowLeft");
  await expect(dialog.getByRole("heading")).toHaveText("Project 1");
  await page.keyboard.press("Equal");
  await expect(dialog.locator(".portfolio-stage")).toHaveAttribute("data-zoom", "1.30");
  await dialog.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(dialog.locator(".portfolio-stage")).toHaveAttribute("data-zoom", "1.69");
  await page.keyboard.press("Minus");
  await expect(dialog.locator(".portfolio-stage")).toHaveAttribute("data-zoom", "1.30");
  await page.keyboard.press("0");
  await expect(dialog.locator(".portfolio-stage")).toHaveAttribute("data-zoom", "1.00");
  const rect = await dialog.locator(".portfolio-stage").boundingBox();
  expect(rect).not.toBeNull();
  await page.mouse.move(rect!.x + rect!.width / 2, rect!.y + rect!.height / 2);
  await page.mouse.wheel(0, -900);
  await expect
    .poll(() => dialog.locator(".portfolio-stage").getAttribute("data-zoom"))
    .not.toBe("1.00");
  const before = await dialog.locator(".portfolio-stage img").getAttribute("style");
  await page.mouse.down();
  await page.mouse.move(rect!.x + rect!.width / 2 + 40, rect!.y + rect!.height / 2 + 50, {
    steps: 5,
  });
  await page.mouse.up();
  expect(await dialog.locator(".portfolio-stage img").getAttribute("style")).not.toBe(before);
  await dialog.getByRole("button", { name: "Reset zoom", exact: true }).click();
  await expect(dialog.locator(".portfolio-stage")).toHaveAttribute("data-zoom", "1.00");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "View Project 1", exact: true })).toBeFocused();
});
test("touch swipe navigates, pinch zooms and does not change the slide @mobile", async ({
  page,
}) => {
  await openViewer(page);
  const rect = (await page.locator(".portfolio-stage").boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const x = rect.x + rect.width * 0.75,
    y = rect.y + rect.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 6; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - i * 20, y }],
    });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText("Project 2");
  await expect(page.locator(".portfolio-stage img")).toHaveCSS("opacity", "1");
  const cx = rect.x + rect.width / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: cx - 25, y, id: 1 },
      { x: cx + 25, y, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: cx - 65, y, id: 1 },
      { x: cx + 65, y, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect
    .poll(() => page.locator(".portfolio-stage").getAttribute("data-zoom"))
    .not.toBe("1.00");
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText("Project 2");
  await cdp.detach();
});
test("gallery incrementally loads a large collection and handles missing images", async ({
  page,
}) => {
  await seed(70);
  await page.goto("/portfolio");
  await expect(page.locator(".portfolio-card")).toHaveCount(24);
  expect(await page.locator(".portfolio-card img[loading=lazy]").count()).toBe(22);
  await page.getByRole("button", { name: "Discover more work" }).click();
  await expect(page.locator(".portfolio-card")).toHaveCount(48);
  await page.route("**/object/sign/portfolio/**/small.webp?*", (r) => r.abort());
  await page.route("**/object/sign/portfolio/**/thumb.webp?*", (r) => r.abort());
  await page.reload();
  await expect(page.locator(".portfolio-image-error").first()).toBeVisible();
});
for (const width of [320, 375, 430, 768, 1024, 1440, 1920])
  test(`responsive gallery and viewer at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openViewer(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    for (const label of [
      "Close image viewer",
      "Previous image",
      "Next image",
      "Zoom in",
      "Zoom out",
      "Reset zoom",
    ]) {
      const box = await page.getByRole("button", { name: label, exact: true }).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(901);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
test("viewer accessibility, focus trap, and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openViewer(page);
  const scan = await new AxeBuilder({ page })
    .include("[role=dialog]")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
  expect(await page.getByRole("dialog").evaluate((el) => el.contains(document.activeElement))).toBe(
    true,
  );
});
test("admin uploads multiple images as drafts, edits, replaces, previews, reorders, publishes and deletes", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin/portfolio");
  await expect(page.locator(".portfolio-admin-card")).toHaveCount(4);
  await page
    .getByLabel("Upload portfolio images", { exact: true })
    .setInputFiles(["public/logo.png", "public/logo-light.png"]);
  await yes(page);
  await expect(page.getByText("2 images saved as drafts.", { exact: true })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.locator(".portfolio-admin-card")).toHaveCount(6);
  const card = page
    .locator(".portfolio-admin-card")
    .filter({ has: page.getByRole("heading", { name: "logo", exact: true }) });
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("New website");
  await page
    .getByLabel("Project description", { exact: true })
    .fill("A new storefront for a growing brand.");
  await page.getByLabel("Tags, separated by commas").fill("Web, Design");
  await page
    .getByLabel("Replace image", { exact: true })
    .setInputFiles("public/apple-touch-icon.png");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await yes(page);
  await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 30000 });
  const edited = page
    .locator(".portfolio-admin-card")
    .filter({ has: page.getByRole("heading", { name: "New website", exact: true }) });
  await edited.getByRole("button", { name: "Preview New website" }).click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText("New website");
  await page.keyboard.press("Escape");
  await edited.getByRole("button", { name: "Move New website up", exact: true }).click();
  await yes(page);
  await expect(page.getByText("Order saved.", { exact: true })).toBeVisible();
  await edited.getByRole("button", { name: "Publish", exact: true }).click();
  await yes(page);
  await expect(edited.getByText("published", { exact: true })).toBeVisible();
  await edited.getByRole("button", { name: "Unpublish", exact: true }).click();
  await yes(page);
  await expect(edited.getByText("draft", { exact: true })).toBeVisible();
  const state = await stubState();
  expect(state.db.portfolio_items.find((p) => p.title === "New website")?.tags).toEqual([
    "Web",
    "Design",
  ]);
  await edited.getByRole("button", { name: "Delete New website", exact: true }).click();
  await yes(page);
  await expect(edited).toHaveCount(0);
});
test("invalid, corrupted, oversized and failed uploads never report success", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/portfolio");
  for (const file of [
    { name: "bad.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") },
    { name: "broken.png", mimeType: "image/png", buffer: Buffer.from("broken") },
    { name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(21 * 1024 * 1024) },
  ]) {
    await page.getByLabel("Upload portfolio images", { exact: true }).setInputFiles(file);
    await yes(page);
    await expect(page.locator(".portfolio-upload-row [role=alert]")).toBeVisible();
  }
  await injectFailure("POST /storage/v1/object/portfolio/", { times: 4 });
  await page
    .getByLabel("Upload portfolio images", { exact: true })
    .setInputFiles("public/logo.png");
  await yes(page);
  await expect(page.locator(".portfolio-upload-row [role=alert]")).toContainText("Upload failed");
  expect((await stubState()).db.portfolio_items).toHaveLength(4);
});
test("failed database save retains old image and metadata", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/portfolio");
  const card = page.locator(".portfolio-admin-card").first();
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Do not save");
  await injectFailure("PATCH portfolio_items");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await yes(page);
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  expect((await stubState()).db.portfolio_items[0].title).toBe("Project 1");
});
test("unauthorized visitor cannot open portfolio admin or write API records", async ({
  page,
  request,
}) => {
  await page.goto("/admin/portfolio");
  await expect(page).toHaveURL(/admin\/login/);
  const response = await request.post(`${STUB}/rest/v1/portfolio_items`, {
    data: { title: "hacked" },
  });
  expect(response.ok()).toBe(false);
});
test("empty collection and failed full-image load have recoverable states @mobile", async ({
  page,
}) => {
  await fetch(`${STUB}/__seed`, { method: "POST", body: JSON.stringify({ portfolio_items: [] }) });
  await page.goto("/portfolio");
  await expect(page.getByText("Good work is on its way.")).toBeVisible();
  await seed();
  await page.reload();
  await page.route("**/object/sign/portfolio/**/full.webp?*", (r) => r.abort());
  await page.getByRole("button", { name: "View Project 1", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Image unavailable");
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
});

test("portfolio performance: measured thumbnail bytes, deferred viewer, stable layout", async ({
  page,
}, testInfo) => {
  await seed(70);
  await page.addInitScript(() => {
    (window as unknown as { portfolioCLS: number }).portfolioCLS = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput)
          (window as unknown as { portfolioCLS: number }).portfolioCLS += shift.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  const requests: string[] = [];
  const imageSizes: Promise<{ url: string; bytes: number }>[] = [];
  page.on("request", (r) => requests.push(r.url()));
  page.on("response", (r) => {
    if (r.request().resourceType() === "image" && r.url().includes("/portfolio/"))
      imageSizes.push(
        r
          .body()
          .then((body) => ({ url: r.url(), bytes: body.length }))
          .catch(() => ({ url: r.url(), bytes: 0 })),
      );
  });
  await page.goto("/portfolio");
  await expect(page.locator(".portfolio-card")).toHaveCount(24);
  await expect(page.locator(".portfolio-card img").first()).toHaveJSProperty("complete", true);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath("gallery.png"), fullPage: false });
  const sizes = await Promise.all(imageSizes);
  const stats = {
    renderedItems: await page.locator(".portfolio-card").count(),
    lazyImages: await page.locator("img[loading=lazy]").count(),
    imageRequests: sizes.length,
    thumbnailBytes: sizes.reduce((n, s) => n + s.bytes, 0),
    fullImageRequests: requests.filter((u) => u.includes("/full.webp")).length,
    viewerRequests: requests.filter((u) => u.includes("PortfolioLightbox")).length,
    cls: await page.evaluate(() => (window as unknown as { portfolioCLS: number }).portfolioCLS),
  };
  expect(stats.fullImageRequests).toBe(0);
  expect(stats.viewerRequests).toBe(0);
  expect(stats.cls).toBeLessThan(0.1);
  console.log("PORTFOLIO_PERFORMANCE", JSON.stringify(stats));
  await testInfo.attach("portfolio-performance.json", {
    body: JSON.stringify(stats, null, 2),
    contentType: "application/json",
  });
  await page.getByRole("button", { name: "View Project 1", exact: true }).click();
  await expect(page.locator(".portfolio-stage img")).toHaveCSS("opacity", "1");
  const displayed = await page.locator(".portfolio-stage img").boundingBox();
  expect(displayed!.width).toBeGreaterThan(50);
  expect(displayed!.height).toBeGreaterThan(100);
  await page.screenshot({ path: testInfo.outputPath("viewer.png") });
});

test("admin portfolio fits phones and tablets and has accessible controls", async ({
  page,
}, testInfo) => {
  await loginAsAdmin(page);
  await page.goto("/admin/portfolio");
  await expect(page.locator(".portfolio-admin-card")).toHaveCount(4);
  for (const width of [320, 375, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: testInfo.outputPath("admin-portfolio.png"), fullPage: true });
  const scan = await new AxeBuilder({ page })
    .include("main")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
});
test("cleanup failure is recoverable and deletion never leaves a broken published card", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin/portfolio");
  await expect(page.locator(".portfolio-admin-card")).toHaveCount(4);
  await injectFailure("DELETE /storage/v1/object/portfolio", { times: 1 });
  await page.getByRole("button", { name: "Delete Project 1", exact: true }).click();
  await yes(page);
  await expect(page.getByRole("heading", { name: "Project 1", exact: true })).toHaveCount(0);
  await expect.poll(async () => (await stubState()).db.portfolio_cleanup.length).toBeGreaterThan(0);
  await expect(
    page.getByText("Some unused files could not be removed. Use Retry storage cleanup.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry storage cleanup", exact: true }).click();
  await yes(page);
  await expect.poll(async () => (await stubState()).db.portfolio_cleanup.length).toBe(0);
});
test("duplicate save clicks commit one metadata update", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/portfolio");
  await page
    .locator(".portfolio-admin-card")
    .first()
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  await page.getByLabel("Title", { exact: true }).fill("Saved once");
  await page.getByRole("button", { name: "Save changes", exact: true }).dblclick();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Yes, save", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await stubState()).log.filter((l) => l === "PATCH portfolio_items")).toHaveLength(1);
});
test("interrupted storage upload retains the existing collection and exposes a retryable error", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin/portfolio");
  // Abort every upload attempt: Chrome may transparently recover a finite number
  // of dropped sockets, which is a successful upload rather than a failure case.
  await page.route("**/storage/v1/object/portfolio/**", (route) =>
    route.request().method() === "POST" ? route.abort("connectionfailed") : route.continue(),
  );
  await page
    .getByLabel("Upload portfolio images", { exact: true })
    .setInputFiles("public/logo.png");
  await yes(page);
  await expect(page.locator(".portfolio-upload-row [role=alert]")).toContainText("Upload failed", {
    timeout: 30000,
  });
  expect((await stubState()).db.portfolio_items).toHaveLength(4);
});

test("homepage showcases use the same published portfolio without static project collections @mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("#work .portfolio-card")).toHaveCount(3);
  expect(await page.locator("#work img[loading=lazy]").count()).toBe(3);
  await page.locator(".recko-deferred-highlights").scrollIntoViewIfNeeded();
  await expect(page.locator(".recko-motion-stack-card")).toHaveCount(7);
  const urls = await page
    .locator(".recko-motion-highlights img")
    .evaluateAll((images) => images.map((img) => (img as HTMLImageElement).src));
  expect(urls.length).toBeGreaterThan(0);
  expect(urls.every((url) => url.includes("/storage/v1/object/sign/portfolio/"))).toBe(true);
  expect(urls.some((url) => url.includes("project-4"))).toBe(false);
  expect(errors).toEqual([]);
});
test("cancelling a batch leaves no half-saved project", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/portfolio");
  await fetch(`${STUB}/__slow`, {
    method: "POST",
    body: JSON.stringify({ match: "POST /storage/v1/object/portfolio/", delayMs: 3000, times: 1 }),
  });
  await page
    .getByLabel("Upload portfolio images", { exact: true })
    .setInputFiles("public/logo.png");
  await yes(page);
  await page.getByRole("button", { name: "Cancel remaining uploads", exact: true }).click();
  await expect(page.locator(".portfolio-upload-row [role=alert]")).toContainText("cancelled");
  expect((await stubState()).db.portfolio_items).toHaveLength(4);
});

test("image optimization reuses cached signatures across reloads and metadata refreshes", async ({
  page,
}) => {
  await page.goto("/portfolio");
  await expect(page.locator(".portfolio-card")).toHaveCount(3);
  await expect(page.locator(".portfolio-card img").first()).toHaveJSProperty("complete", true);
  const before = await stubState();
  const signatures = before.log.filter(
    (line) => line === "POST /storage/v1/object/sign/portfolio",
  ).length;
  expect(signatures).toBe(1);
  const urls = await page
    .locator(".portfolio-card img")
    .evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src));
  await page.reload();
  await expect(page.locator(".portfolio-card")).toHaveCount(3);
  const after = await stubState();
  expect(after.log.filter((line) => line === "POST /storage/v1/object/sign/portfolio").length).toBe(
    signatures,
  );
  expect(
    await page
      .locator(".portfolio-card img")
      .evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src)),
  ).toEqual(urls);
  await expect(page.locator(".portfolio-card .portfolio-image").first()).toHaveClass(/is-loaded/);
  await page.getByRole("button", { name: "Commerce", exact: true }).click();
  await expect(page.locator(".portfolio-card")).toHaveCount(1);
  expect(
    (await stubState()).log.filter((line) => line === "POST /storage/v1/object/sign/portfolio")
      .length,
  ).toBe(signatures);
  console.log(
    "IMAGE_CACHE_OPTIMIZATION",
    JSON.stringify({
      initialSigningRequests: signatures,
      reloadSigningRequests: 0,
      filterSigningRequests: 0,
      stableImageURLs: true,
    }),
  );
});
test("admin draft image signatures are never persisted in the public image cache", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin/portfolio");
  await expect(page.locator(".portfolio-admin-card")).toHaveCount(4);
  const cached = await page.evaluate(() =>
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith("recko:portfolio-urls:"))
      .flatMap((key) => JSON.parse(sessionStorage.getItem(key) ?? "[]") as [string, unknown][])
      .map((entry) => entry[0]),
  );
  expect(cached.some((path) => path.startsWith("project-4/"))).toBe(false);
  expect(cached.some((path) => path.startsWith("project-1/"))).toBe(true);
});

test("mobile project carousel advances, pauses, and supports manual navigation @mobile", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/portfolio");
  const controls = page.getByRole("group", { name: "Project slider controls" });
  const viewport = page.locator(".portfolio-slider-viewport");
  await expect(controls).toContainText("1 / 3");
  await viewport.scrollIntoViewIfNeeded();
  await expect(controls).toContainText("2 / 3", { timeout: 8000 });
  await controls.getByRole("button", { name: "Pause automatic slides" }).tap();
  await expect(controls.getByRole("button", { name: "Resume automatic slides" })).toBeVisible();
  await controls.getByRole("button", { name: "Next project" }).tap();
  await expect(controls).toContainText("3 / 3");
  await controls.getByRole("button", { name: "Next project" }).tap();
  await expect(controls).toContainText("1 / 3");
  await expect(viewport.locator(".portfolio-card-overlay").first()).toHaveCSS(
    "backdrop-filter",
    "blur(16px)",
  );
});
