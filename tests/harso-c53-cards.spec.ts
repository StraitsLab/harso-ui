import { expect, test } from "@playwright/test";

for (const dark of [false, true]) test(`c53 interactive answer card ${dark ? "dark" : "light"}`, async ({ page }) => {
  await page.goto(`/preview/c53-cards.html${dark ? "?dark=1" : ""}`);
  await page.getByRole("button", { name: "Plan trip" }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByLabel("warning note")).toBeVisible();
  await expect(page.locator(".hkc-chart-area")).toBeVisible();
  await expect(page.getByLabel("Destination")).toHaveValue("Kyoto");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const selector of [".hkc-output-callout", ".hkc-output-chart", ".hkc-output-form", ".hkc-output-suggestions"]) {
    const box = await page.locator(selector).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await page.screenshot({ path: `test-results/c53-card-${dark ? "dark" : "light"}.png`, fullPage: true });
  await page.getByRole("button", { name: "Plan trip" }).click();
  await expect(page.getByRole("status")).toHaveText("Sent: Plan trip: Destination: Kyoto; Travel: Train; Departure: 2026-10-20; People: 2");
  await expect(page.getByRole("button", { name: "Plan trip" })).toBeDisabled();
  await page.getByRole("button", { name: "What about next week?" }).click();
  await expect(page.getByRole("status")).toHaveText("Sent: What about next week?");
});
