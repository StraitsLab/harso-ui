import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("plan disclosure retains drafts, refuses requests and never hides the decision", async ({ page }) => {
  await page.goto("/#vercel:plan");
  const trigger = page.getByRole("button", { name: "Plan details", exact: true });
  await page.getByLabel("Plan notes").fill("Keep this draft");
  await trigger.focus();
  await trigger.press("Enter");
  await expect(trigger).toBeFocused();
  await expect(page.getByLabel("Plan notes")).toBeHidden();
  await page.getByRole("button", { name: "Our team", exact: true }).click();
  await expect(page.getByText("Audience: Our team", { exact: true })).toBeVisible();
  await page.getByLabel("Keep host disclosure").check();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByLabel("Disclosure requests")).toHaveText("2 requests");
  await page.getByLabel("Keep host disclosure").uncheck();
  await trigger.click();
  await expect(page.getByLabel("Plan notes")).toHaveValue("Keep this draft");
  await page.getByLabel("Plan notes").focus();
  await page.getByLabel("Show plan details").evaluate((element: HTMLInputElement) => element.click());
  await expect(trigger).toBeFocused();
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(trigger).toBeDisabled();
  await expect(page.getByRole("button", { name: "Our team", exact: true })).toBeDisabled();
});

test("task is one compact unit with independent nested disclosure and supplied status", async ({ page }) => {
  await page.goto("/#vercel:task");
  const root = page.getByRole("button", { name: /^Shape the launch brief/ });
  const nested = page.getByRole("button", { name: "Six sources reviewed", exact: true });
  await expect(nested).toHaveAttribute("aria-expanded", "false");
  await nested.focus();
  await nested.press("Space");
  await expect(page.getByText("Original interview notes", { exact: true })).toBeVisible();
  const relations = await page.locator(".hk-work-trigger").evaluateAll(elements => elements.map(element => element.getAttribute("aria-controls")));
  expect(new Set(relations).size).toBe(relations.length);
  await root.click();
  await expect(nested).toBeHidden();
  await page.getByRole("button", { name: "Complete sample progress", exact: true }).click();
  await expect(root).toHaveAttribute("aria-expanded", "false");
  await expect(root).toContainText("Complete");
  await root.click();
  await expect(nested).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "launch-brief.md", exact: true }).click();
  await expect(page.getByLabel("Work action")).toContainText("No file was opened.");
  await page.getByLabel("Example state").selectOption("error");
  await expect(root).toContainText("Needs attention");
  await root.click();
  await expect(page.getByRole("button", { name: "Review decision", exact: true })).toBeVisible();
});

test("summary updates preserve disclosure and use only finite host durations", async ({ page }) => {
  await page.goto("/#vercel:reasoning");
  const trigger = page.locator(".hk-reasoning .hk-work-trigger");
  await trigger.click();
  await page.getByRole("button", { name: "Append sample update", exact: true }).click();
  await page.getByLabel("Streaming sample").uncheck();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toHaveText("Progress summary · 12s⌄");
  await page.getByLabel("Host elapsed seconds").fill("Infinity");
  await expect(trigger).toHaveText("Progress summary⌄");
  await page.getByLabel("Host elapsed seconds").fill("0");
  await expect(trigger).toContainText("0s");
  await trigger.click();
  await expect(page.getByText("Received 1 additional sample update.", { exact: true })).toBeVisible();
  await page.getByLabel("Streaming sample").check();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".hk-reasoning .hk-message-response")).toHaveAttribute("aria-busy", "true");
});

test("untrusted summaries have no executable markup, unsafe links or remote requests", async ({ page, baseURL }) => {
  if (!baseURL) throw new Error("This test requires a configured baseURL");
  const configuredURL = new URL(baseURL);
  const external: string[] = [];
  const dialogs: string[] = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.origin !== configuredURL.origin || url.protocol !== configuredURL.protocol) external.push(request.url());
  });
  page.on("dialog", async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await page.goto("/#vercel:reasoning");
  await page.getByLabel("Untrusted summary sample").check();
  const response = page.locator(".hk-reasoning .hk-message-response");
  await expect(response.locator("img, script, iframe")).toHaveCount(0);
  await expect(response.getByRole("link")).toHaveCount(1);
  await expect(response.getByRole("link")).toHaveAttribute("href", "https://example.com/research");
  await expect(response.getByRole("link")).toHaveAttribute("rel", "noreferrer noopener");
  expect(external).toEqual([]);
  expect(dialogs).toEqual([]);
});

test("checkpoint actions are explicit and disabled states cannot request restoration", async ({ page }) => {
  await page.goto("/#vercel:checkpoint");
  await expect(page.getByLabel("Checkpoint action")).toHaveText("No checkpoint requested");
  const checkpoint = page.getByRole("button", { name: "Before launch research", exact: true });
  await checkpoint.focus();
  await checkpoint.press("Enter");
  await expect(page.getByLabel("Checkpoint action")).toContainText("Nothing was restored.");
  await page.getByRole("button", { name: "Explore another direction", exact: true }).click();
  await expect(page.getByLabel("Checkpoint action")).toContainText("No conversation was changed.");
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(checkpoint).toBeDisabled();
  await expect(page.getByLabel("Checkpoint action")).toHaveText("No checkpoint requested");
});

test("work examples retain their canvas across themes, narrow widths and accessible states", async ({ page }) => {
  await page.goto("/#vercel:plan");
  for (const appearance of ["light", "dark"]) {
    await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
    await expect(page).toHaveScreenshot(`work-plan-${appearance}.png`, { fullPage: true, animations: "disabled" });
  }
  for (const family of ["plan", "task", "reasoning", "checkpoint"]) {
    await page.goto(`/#vercel:${family}`);
    expect((await new AxeBuilder({ page }).include('[data-testid="live-example"]').analyze()).violations).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#vercel:task");
  await page.getByLabel("Appearance", { exact: true }).selectOption("light");
  await page.getByLabel("Palette", { exact: true }).selectOption("cozy");
  await page.getByLabel("Example state").selectOption("long-content");
  await expect(page).toHaveScreenshot("work-task-cozy-narrow.png", { fullPage: true, animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).include('[data-testid="live-example"]').analyze()).violations).toEqual([]);
  await page.goto("/#vercel:reasoning");
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await page.getByLabel("Palette", { exact: true }).selectOption("cozy");
  await expect(page).toHaveScreenshot("work-summary-cozy-narrow.png", { fullPage: true, animations: "disabled" });
});

test("reduced motion, forced colors and coarse-pointer controls stay usable", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce", forcedColors: "active", baseURL });
  const page = await context.newPage();
  await page.goto("/#vercel:reasoning");
  const trigger = page.locator(".hk-reasoning .hk-work-trigger");
  await expect.poll(() => trigger.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  expect(await page.locator(".hk-reasoning .hk-shimmer").evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  await trigger.tap();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.focus();
  await trigger.press("Space");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(await trigger.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
  expect((await new AxeBuilder({ page }).include('[data-testid="live-example"]').analyze()).violations).toEqual([]);
  await context.close();
});
