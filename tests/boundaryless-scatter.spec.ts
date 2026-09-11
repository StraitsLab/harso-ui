import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ hasTouch: true });

test("scatter inspection uses keyboard, pointer and touch without changing host range", async ({ page }) => {
  await page.goto("/#boardui:scatter-chart-card");
  const chart = page.locator(".hk-scatter");
  const point = chart.getByRole("img", { name: /Research · Atlas/ });
  await point.focus();
  await expect(chart.getByRole("status")).toContainText("Atlas");
  await page.keyboard.press("Escape");
  await expect(chart.getByRole("status")).toContainText("6 observations");
  await chart.getByRole("img", { name: /Delivery · Delta/ }).hover();
  await expect(chart.getByRole("status")).toContainText("Delta");
  await point.tap();
  await expect(chart.getByRole("status")).toContainText("Atlas");
  await page.getByLabel("Bubble sizing").uncheck();
  for (const circle of await chart.locator("circle").all()) await expect(circle).toHaveAttribute("r", "5");
  await page.getByLabel("Hold host state").check();
  await chart.getByRole("combobox").selectOption("week");
  await expect(chart.getByRole("combobox")).toHaveValue("month");
  await expect(page.getByLabel("Scatter request")).toContainText("host retained");
  await page.getByLabel("Hold host state").uncheck();
  await chart.getByRole("combobox").selectOption("week");
  await expect(chart.locator("circle")).toHaveCount(2);
  await page.getByLabel("Scatter state").selectOption("disabled");
  await expect(chart.getByRole("combobox")).toBeDisabled();
  await expect(chart.locator("circle").first()).toHaveAttribute("tabindex", "-1");
  await page.getByLabel("Scatter state").selectOption("invalid");
  await expect(chart.getByText("No valid observations.")).toBeVisible();
  await expect(chart.locator("circle")).toHaveCount(0);
});

for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [1512, 390]) {
  test(`scatter ${mode} ${palette} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:scatter-chart-card");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator(".hk-scatter").screenshot({ path: test.info().outputPath("scatter.png") });
  });
}
