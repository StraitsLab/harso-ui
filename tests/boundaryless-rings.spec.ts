import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ hasTouch: true });

test("rings inspect each metric and follow host-approved selected days", async ({ page }) => {
  await page.goto("/#boardui:activity-rings-card");
  const chart = page.locator(".hk-activity-rings");
  const move = chart.getByRole("button", { name: /Move/ });
  await move.focus();
  await expect(chart.getByRole("status")).toContainText("480 / 600 kcal");
  await page.keyboard.press("Escape");
  await expect(chart.getByRole("status")).not.toContainText("480 / 600");
  await chart.getByRole("button", { name: /Running/ }).tap();
  await expect(chart.getByRole("status")).toContainText("Running");
  await page.getByLabel("Hold host state").check();
  await chart.locator('button[data-date="2026-09-05"]').click();
  await expect(chart.locator("time")).toHaveText("2026-09-07");
  await expect(page.getByLabel("Activity day request")).toContainText("host retained");
  await page.getByLabel("Hold host state").uncheck();
  await chart.locator('button[data-date="2026-09-05"]').click();
  await expect(chart.locator("time")).toHaveText("2026-09-05");
  await expect(move).toContainText("720 / 600 kcal");
  await expect(move).toContainText("120%");
  await chart.locator('button[data-date="2026-09-06"]').click();
  for (const arc of await chart.locator(".hk-activity-ring-value").all()) await expect(arc).toHaveAttribute("stroke-dasharray", "0 100");
  await page.getByLabel("Rings state").selectOption("disabled");
  await expect(move).toBeDisabled();
  await expect(chart.locator('button[data-date="2026-09-05"]')).toBeDisabled();
  await page.getByLabel("Rings state").selectOption("invalid");
  await expect(chart.locator(".hk-activity-ring-value")).toHaveCount(1);
  await expect(chart.getByText("2 unavailable metrics omitted.")).toBeVisible();
  await page.getByLabel("Rings state").selectOption("empty");
  await expect(chart.getByText("No valid activity metrics.")).toBeVisible();
});

for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [1512, 390]) {
  test(`rings ${mode} ${palette} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:activity-rings-card");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator(".hk-activity-rings").screenshot({ path: test.info().outputPath("rings.png") });
  });
}
