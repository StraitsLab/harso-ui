import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ hasTouch: true });

test("matrix inspection, ceiling, layout and host refusal preserve supplied values", async ({ page }) => {
  await page.goto("/#boardui:heatmap-chart-card");
  const chart = page.locator(".hk-heatmap");
  await chart.getByRole("button", { name: "Monday · 08:00: 1", exact: true }).focus();
  await expect(chart.getByRole("status")).toHaveText("Monday · 08:00: 1");
  await expect(chart.getByRole("columnheader", { name: "08:00" })).toHaveAttribute("data-active", "true");
  await chart.getByRole("button", { name: "Monday · 10:00: 2", exact: true }).hover();
  await expect(chart.getByRole("status")).toHaveText("Monday · 10:00: 2");
  await page.getByLabel("Hold host state").hover();
  await expect(chart.getByRole("status")).toHaveText("Monday · 08:00: 1");
  await page.keyboard.press("Escape");
  await expect(chart.getByRole("status")).toHaveText("Total: 315");
  await chart.getByRole("button", { name: "Friday · 18:00: 30", exact: true }).tap();
  await expect(chart.getByRole("status")).toHaveText("Friday · 18:00: 30");
  await page.getByLabel("Intensity ceiling", { exact: true }).selectOption("10");
  await expect(chart.getByRole("button", { name: "Friday · 18:00: 30", exact: true })).toHaveAttribute("data-intensity", "1");
  await page.getByLabel("Hold host state").check();
  await chart.getByRole("combobox").selectOption("previous");
  await expect(chart.getByRole("combobox")).toHaveValue("week");
  await expect(page.getByLabel("Matrix request")).toContainText("host retained");
  await page.getByLabel("Hold host state").uncheck();
  await chart.getByRole("combobox").selectOption("previous");
  await expect(chart.getByRole("button", { name: "Friday · 18:00: 60", exact: true })).toBeVisible();
  await page.getByLabel("Matrix layout", { exact: true }).selectOption("regions");
  await expect(chart.getByRole("rowheader", { name: "Singapore" })).toBeVisible();
  await expect(chart.getByRole("columnheader", { name: "January" })).toBeVisible();
  await page.getByLabel("Heatmap state", { exact: true }).selectOption("missing");
  await expect(chart.getByRole("button", { name: "Singapore · February: No data", exact: true })).toHaveText("—");
  await page.getByLabel("Heatmap state", { exact: true }).selectOption("zero");
  await expect(chart.getByRole("status")).toHaveText("Total: 0");
  await page.getByLabel("Heatmap state", { exact: true }).selectOption("invalid");
  await expect(chart.getByRole("alert")).toContainText("finite nonnegative");
  await page.getByLabel("Heatmap state", { exact: true }).selectOption("disabled");
  await expect(chart.getByRole("combobox")).toBeDisabled();
  await expect(chart.getByRole("button").first()).toBeDisabled();
});

test("Finance disables matrix inspection with the host state", async ({ page }) => {
  await page.goto("/#boardui:finance-dashboard");
  await page.getByLabel("Transaction data", { exact: true }).selectOption("disabled");
  await expect(page.locator(".hk-heatmap").getByRole("button").first()).toBeDisabled();
  await expect(page.locator(".hk-heatmap").getByRole("status")).toHaveText("Total: $1375");
});

for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [1512, 390]) {
  test(`heatmap ${mode} ${palette} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:heatmap-chart-card");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const chart = page.locator(".hk-heatmap");
    expect(await chart.locator("tbody tr").first().evaluate(element => element.getBoundingClientRect().height)).toBeLessThan(80);
    if (width === 390) {
      // Wave 1: narrow heatmaps page through time windows instead of scrolling horizontally.
      const next = chart.getByRole("button", { name: "Next time window", exact: true });
      const firstHeader = chart.locator("thead th").nth(1);
      const before = await firstHeader.textContent();
      await next.click();
      await expect(firstHeader).not.toHaveText(before!);
      await expect(chart.getByRole("button", { name: "Previous time window", exact: true })).toBeEnabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await chart.screenshot({ path: test.info().outputPath("heatmap.png") });
  });
}
