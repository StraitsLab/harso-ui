import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("host expansion and independent groups preserve real supplied usage", async ({ page }) => {
  await page.goto("/#boardui:agent-limits-card");
  const example = page.locator(".hkl-live-example");
  const toggle = example.getByRole("button", { name: /Context window/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Host refuses expansion changes").check();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Host refuses expansion changes").uncheck();
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(example).toContainText("4,200");
  await expect(example).toContainText("3,800");
  await expect(example).toContainText("Resets Tuesday");
  const groups = example.locator("details");
  await groups.nth(0).locator("summary").click();
  await expect(groups.nth(0)).toHaveAttribute("open", "");
  await expect(groups.nth(1)).not.toHaveAttribute("open");
  await groups.nth(1).locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(groups.nth(0)).toHaveAttribute("open", "");
  await expect(groups.nth(1)).toHaveAttribute("open", "");
  await page.getByLabel("Limits example state").selectOption("disabled");
  await expect(toggle).toBeDisabled();
  await groups.nth(0).locator("summary").click();
  await expect(groups.nth(0)).toHaveAttribute("open", "");
});

for (const width of [320, 1280]) for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`Limits ${width} ${mode} ${palette}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:agent-limits-card");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const example = page.locator(".hkl-live-example");
    await example.getByRole("button", { name: /Context window/ }).click();
    for (const state of ["ready", "empty", "loading", "error", "disabled", "over-limit"]) {
      await page.getByLabel("Limits example state").selectOption(state);
      if (state === "over-limit") await expect(example.getByText("Over limit", { exact: true })).toBeVisible();
      expect((await new AxeBuilder({ page }).include(".hkl-live-example").analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.getByLabel("Limits example state").selectOption("ready");
    await expect(example.locator(".hk-agent-limits-card")).toHaveCSS("border-top-width", "1px"); // wave 1: tonal card carries a hairline
    await expect(example.locator(".hk-agent-limits-group summary").first()).toHaveCSS("min-height", "44px");
    await example.screenshot({ path: test.info().outputPath("limits.png") });
  });
}
