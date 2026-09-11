import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("retained radio clicks advance and transitions keep one live question", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#boardui:questionnaire");
  const example = page.locator(".hk-questionnaire-example");
  await example.getByLabel("Selection mode").selectOption("single");
  await example.getByLabel("Research", { exact: true }).check();
  await expect(example.getByRole("heading")).toHaveText("How would you like the result?");
  await expect(example.locator("fieldset")).toHaveCount(1);
  await expect(example.getByRole("heading").locator("..")).toHaveCSS("opacity", "1");
  await example.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(example.getByLabel("Research", { exact: true })).toBeChecked();
  await example.getByText("Research", { exact: true }).click();
  await expect(example.getByRole("heading")).toHaveText("How would you like the result?");
  await expect(example.getByRole("heading")).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await example.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(example.getByRole("heading")).toHaveText("What should Harso help with?");
  await expect(example.getByRole("heading").locator("..")).toHaveCSS("transform", "none");
});

test("retains answers, follows single-choice progress and submits", async ({ page }) => {
  await page.goto("/#boardui:questionnaire");
  const example = page.locator(".hk-questionnaire-example");
  await example.getByLabel("Research", { exact: true }).check();
  await example.getByRole("button", { name: "Next", exact: true }).click();
  await expect(example.getByRole("heading", { name: "How would you like the result?" })).toBeFocused();
  await example.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(example.getByLabel("Research", { exact: true })).toBeChecked();
  await example.getByRole("button", { name: "Delivery", exact: true }).click();
  await example.getByLabel("A concise summary", { exact: true }).check();
  await expect(example.getByLabel("Submitted answers")).toContainText('"values":["summary"]');
  await expect(example.getByLabel("Submitted answers")).toContainText('"values":["research"]');
});

test("Other waits for Enter, digits remain local, dismissal can reopen", async ({ page }) => {
  await page.goto("/#boardui:questionnaire");
  const example = page.locator(".hk-questionnaire-example");
  await example.getByLabel("Selection mode").selectOption("single");
  await example.getByLabel("Other response").fill("Investigate 2 issues");
  await page.waitForTimeout(250);
  await expect(example.getByRole("heading", { name: "What should Harso help with?" })).toBeVisible();
  await example.getByLabel("Other response").press("Enter");
  await expect(example.getByRole("heading", { name: "How would you like the result?" })).toBeFocused();
  await page.keyboard.press("2");
  await expect(example.getByLabel("Submitted answers")).toContainText('"values":["detailed"]');
  await example.getByRole("button", { name: "Dismiss questionnaire" }).click();
  await expect(example.locator(".hk-questionnaire")).toHaveCount(0);
  await example.getByRole("button", { name: "Reopen questionnaire" }).click();
  await expect(example.getByRole("heading", { name: "What should Harso help with?" })).toBeVisible();
});

for (const width of [1512, 390]) for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`questionnaire ${width} ${mode} ${palette}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:questionnaire");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const example = page.locator(".hk-questionnaire-example");
    await expect(example.getByRole("heading", { name: "What should Harso help with?" })).toBeVisible();
    expect((await new AxeBuilder({ page }).include(".hk-questionnaire-example").analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await example.screenshot({ path: test.info().outputPath("questionnaire.png") });
    await example.getByLabel("Research", { exact: true }).focus();
    await page.keyboard.press("Space");
    await expect(example.getByLabel("Research", { exact: true })).toBeChecked();
  });
}
