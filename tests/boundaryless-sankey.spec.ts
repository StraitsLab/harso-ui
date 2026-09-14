import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ hasTouch: true });

test("Sankey weighted flows support node/link focus, touch and host range refusal", async ({ page }) => {
  await page.goto("/#boardui:sankey-chart-card");
  const chart = page.locator(".hk-sankey");
  await expect(chart.getByRole("status")).toContainText("Source total: $3,000");
  await chart.getByRole("button", { name: /Budget → Savings/ }).focus();
  await expect(chart.getByRole("status")).toContainText("Budget → Savings: $1,000");
  await page.keyboard.press("Escape");
  await expect(chart.getByRole("status")).toContainText("Source total");
  await chart.getByRole("button", { name: /Savings · In/ }).tap();
  await expect(chart.getByRole("status")).toContainText("Savings · In: $1,000");
  await expect(chart.locator('.hk-sankey-link[opacity="0.1"]')).toHaveCount(4);
  await chart.locator(".hk-sankey-link").first().hover();
  await expect(chart.getByRole("status")).toContainText("Salary → Budget");
  await page.getByLabel("Hold host state").check();
  await chart.getByRole("combobox").selectOption("week");
  await expect(chart.getByRole("combobox")).toHaveValue("month");
  await expect(page.getByLabel("Flow request")).toContainText("host retained");
  await page.getByLabel("Hold host state").uncheck();
  await chart.getByRole("combobox").selectOption("week");
  await expect(chart.getByRole("status")).toContainText("Source total: $750");
  await page.getByLabel("Sankey state").selectOption("cycle");
  await expect(chart.getByRole("alert")).toContainText("acyclic");
  await expect(chart.locator("svg")).toHaveCount(0);
  await page.getByLabel("Sankey state").selectOption("zero");
  await expect(chart.getByText("No positive flows supplied.")).toBeVisible();
  await page.getByLabel("Sankey state").selectOption("disabled");
  await expect(chart.getByRole("combobox")).toBeDisabled();
  await expect(chart.getByRole("button").first()).toBeDisabled();
});

for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [1512, 390]) {
  test(`Sankey ${mode} ${palette} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:sankey-chart-card");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const diagram = page.getByRole("region", { name: "Where the money goes diagram" });
    if (width === 390) {
      await expect(diagram.locator("svg > g")).toHaveAttribute("transform", /rotate\(90\)/);
      expect(await diagram.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      await expect(diagram.locator(".hk-sankey-labels span")).toHaveCount(6);
    }
    await page.locator(".hk-sankey").screenshot({ path: test.info().outputPath("sankey.png") });
  });
}
