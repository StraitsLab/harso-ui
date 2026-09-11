import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ hasTouch: true });

for (const family of ["area", "line", "combo"]) {
  test(`${family}: inspect with keyboard, pointer and touch; host owns period changes`, async ({ page }) => {
    await page.goto(`/#boardui:${family}-chart-card`);
    const example = page.locator(".hk-chart-modes-example");
    const chart = example.locator(".hk-interactive-chart");
    const january = chart.getByRole("button", { name: /Inspect January/ });
    await january.focus();
    await expect(chart.getByRole("status")).toContainText("January");
    await page.keyboard.press("End");
    await expect(chart.getByRole("button", { name: /Inspect April/ })).toBeFocused();
    await expect(chart.getByRole("status")).toContainText("April");
    await page.keyboard.press("ArrowLeft");
    await expect(chart.getByRole("status")).toContainText("March");
    await page.keyboard.press("Escape");
    await expect(chart.locator(".hk-interactive-dot")).toHaveCount(0);
    await chart.locator('[data-inspect="1"]').hover();
    await expect(chart.getByRole("status")).toContainText("February");
    await chart.locator('[data-inspect="0"]').tap();
    await expect(chart.getByRole("status")).toContainText("January");
    await expect(chart.locator(".hk-interactive-dot").first()).toBeVisible();
    await example.getByLabel("Hold host state").check();
    if (family === "line") await chart.getByRole("button", { name: "Weekly", exact: true }).click();
    else await chart.getByRole("combobox").selectOption("weekly");
    await expect(example.getByTestId("chart-period-request")).toContainText("host refused");
    await expect(january).toBeVisible();
    if (family === "line") await expect(chart.getByRole("button", { name: "Monthly", exact: true })).toHaveAttribute("aria-pressed", "true");
    else await expect(chart.getByRole("combobox")).toHaveValue("monthly");
    await example.getByLabel("Hold host state").uncheck();
    if (family === "line") await chart.getByRole("button", { name: "Weekly", exact: true }).click();
    else await chart.getByRole("combobox").selectOption("weekly");
    await expect(chart.getByRole("button", { name: /Inspect Monday/ })).toBeVisible();
    await expect(january).toHaveCount(0);
    await expect(chart.getByRole("status")).not.toContainText("January");
    await example.getByLabel("Curve shape").selectOption("sharp");
    expect(await chart.locator(".hk-interactive-line").first().getAttribute("d")).not.toContain("C");
    await example.getByLabel("Curve shape").selectOption("curved");
    expect(await chart.locator(".hk-interactive-line").first().getAttribute("d")).toContain("C");
  });

  test(`${family}: truthful edge values and explicit empty/loading/error/disabled states`, async ({ page }) => {
    await page.goto(`/#boardui:${family}-chart-card`);
    const example = page.locator(".hk-chart-modes-example");
    const chart = example.locator(".hk-interactive-chart");
    const scenario = example.getByLabel("Chart scenario");
    await scenario.selectOption("fractional");
    await chart.getByRole("button", { name: /Inspect Half/ }).click();
    await expect(chart.getByRole("status")).toContainText("0.25");
    await scenario.selectOption("signed");
    await chart.getByRole("button", { name: /Inspect Loss/ }).click();
    await expect(chart.getByRole("status")).toContainText("-40");
    await scenario.selectOption("missing");
    await chart.getByRole("button", { name: /Inspect Missing/ }).click();
    await expect(chart.getByRole("status")).toContainText("Unavailable");
    if (family === "combo") await expect(chart.getByRole("status")).toContainText("Conversion: 4%");
    await scenario.selectOption("extreme");
    expect(await chart.locator("svg").innerHTML()).not.toMatch(/NaN|Infinity/);
    await scenario.selectOption("zero");
    await chart.getByRole("button", { name: /Inspect Zero/ }).click();
    await expect(chart.getByRole("status")).toContainText(": 0");
    if (family === "combo") await expect(chart.locator(".hk-interactive-bar")).toHaveAttribute("height", "0");
    await scenario.selectOption("disabled");
    await expect(chart.getByRole("button", { name: /Inspect January/ })).toBeDisabled();
    await chart.locator('[data-inspect="0"]').dispatchEvent("pointerdown", { pointerType: "touch" });
    await expect(chart.getByRole("status")).not.toContainText("January");
    await scenario.selectOption("empty");
    await expect(chart.getByText("No data", { exact: true })).toBeVisible();
    await scenario.selectOption("loading");
    await expect(chart.getByRole("status")).toContainText("Loading");
    await expect(chart).toHaveAttribute("aria-busy", "true");
    await scenario.selectOption("error");
    await expect(chart.getByRole("alert")).toContainText("Host data unavailable");
    await expect(chart.locator("svg")).toHaveCount(0);
    await scenario.selectOption("ready");
    await expect(chart.locator("svg")).toBeVisible();
  });

  for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [1512, 320]) {
    test(`${family}: ${mode} ${palette} ${width} responsive and Axe`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1040 });
      await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
      await page.goto(`/#boardui:${family}-chart-card`);
      await page.getByLabel("Palette", { exact: true }).selectOption(palette);
      const example = page.locator(".hk-chart-modes-example");
      await expect(example).toBeVisible();
      await expect(example.locator(".hk-interactive-chart")).toHaveCSS("border-top-width", "0px");
      await expect(example.locator(".hk-interactive-chart")).toHaveCSS("padding-top", "0px");
      await expect(example.locator(".hk-interactive-chart")).toHaveCSS("box-shadow", "none");
      await expect(example.getByRole("button", { name: /Inspect January/ })).toHaveCSS("white-space", "nowrap");
      for (const button of await example.locator(".hk-interactive-points button").all()) {
        const bounds = await button.boundingBox();
        expect(bounds!.width).toBeGreaterThanOrEqual(44);
        expect(bounds!.height).toBeGreaterThanOrEqual(44);
      }
      await example.getByRole("button", { name: /Inspect January/ }).focus();
      expect((await new AxeBuilder({ page }).include(".hk-chart-modes-example").analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await example.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      await example.screenshot({ path: test.info().outputPath("chart.png") });
    });
  }
}

test("area modes change actual paths and percentages; invalid shares are not drawn", async ({ page }) => {
  await page.goto("/#boardui:area-chart-card");
  const example = page.locator(".hk-chart-modes-example");
  const second = example.locator('[data-series="referral"] .hk-interactive-area');
  const stacked = await second.getAttribute("d");
  await example.getByLabel("Area mode").selectOption("overlap");
  expect(await second.getAttribute("d")).not.toBe(stacked);
  await example.getByLabel("Area mode").selectOption("percent");
  await example.getByRole("button", { name: /Inspect January/ }).focus();
  await expect(example.getByRole("status")).toContainText("Organic: 2,400 (66.67%)");
  await expect(example.getByRole("status")).toContainText("Referral: 800 (22.22%)");
  await expect(example.getByRole("status")).toContainText("Paid: 400 (11.11%)");
  await example.getByLabel("Chart scenario").selectOption("zero");
  await example.getByRole("button", { name: /Inspect Zero/ }).click();
  await expect(example.getByRole("status")).toContainText("Share unavailable");
  await expect(example.locator(".hk-interactive-area")).toHaveCount(0);
});

test("active dots respond to live reduced-motion changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#boardui:line-chart-card");
  const example = page.locator(".hk-chart-modes-example");
  await example.getByRole("button", { name: /Inspect January/ }).focus();
  const dot = example.locator(".hk-interactive-dot");
  await expect.poll(() => dot.evaluate(element => getComputedStyle(element).animationName)).toBe("hk-chart-dot");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => dot.evaluate(element => getComputedStyle(element).animationName)).toBe("none");
});
