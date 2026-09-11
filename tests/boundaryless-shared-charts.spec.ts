import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: "reduce" }); });

const barFamilies = ["steps-card", "earnings-chart-card"];
for (const family of barFamilies) {
  test(`${family} uses zero-correct pixel geometry and visible values`, async ({ page }) => {
    await page.goto(`/#boardui:${family}`);
    const example = page.locator(".hk-shared-chart-example");
    const bars = example.locator(".hk-chart-bar");
    await expect(bars).toHaveCount(3);
    const heights = await bars.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
    expect(heights).toEqual([0, 60, 120]);
    await expect(example.getByText("0.25", { exact: true })).toBeVisible();
    await example.getByLabel("Chart scenario").selectOption("invalid");
    await expect(bars).toHaveCount(1);
    await expect(example.getByText("Unavailable", { exact: true })).toHaveCount(2);
    expect((await bars.first().boundingBox())?.height).toBe(120);
    await example.getByLabel("Chart scenario").selectOption("zero");
    await expect.poll(() => bars.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height))).toEqual([0, 0, 0]);
    await example.getByLabel("Chart scenario").selectOption("empty");
    await expect(example.getByText("No data", { exact: true })).toBeVisible();
  });
}

test("signed bars keep gains and losses on opposite sides of zero", async ({ page }) => {
  await page.goto("/#boardui:earnings-chart-card");
  const example = page.locator(".hk-shared-chart-example");
  await example.getByLabel("Chart scenario").selectOption("extreme");
  const measure = () => example.locator(".hk-chart-bar-column").evaluateAll(columns => columns.map(column => {
    const bar = column.querySelector(".hk-chart-bar")!.getBoundingClientRect();
    const baseline = column.querySelector(".hk-chart-zero")!.getBoundingClientRect();
    return { height: bar.height, top: bar.top, bottom: bar.bottom, zero: baseline.bottom };
  }));
  await expect.poll(async () => (await measure()).map(item => item.height)).toEqual([60, 0, 60]);
  const measurements = await measure();
  expect(measurements[0].top).toBe(measurements[0].zero);
  expect(measurements[2].bottom).toBe(measurements[2].zero);
});

for (const family of ["bar-list-card", "stage-bars-card"]) test(`${family} uses horizontal geometry without losing zero and missing values`, async ({ page }) => {
  await page.goto(`/#boardui:${family}`);
  const example = page.locator(".hk-shared-chart-example");
  const bars = example.locator(".hk-chart-funnel-bar");
  const widths = await bars.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
  expect(widths).toHaveLength(3);
  expect(widths[0]).toBe(0);
  expect(widths[1] / widths[2]).toBeCloseTo(.5, 2);
  await example.getByLabel("Chart scenario").selectOption("invalid");
  await expect(bars).toHaveCount(1);
  await expect(example.getByText("Unavailable", { exact: true })).toHaveCount(2);
});

test("orders compares current and previous on the same scale", async ({ page }) => {
  await page.goto("/#boardui:orders-chart-card");
  const example = page.locator(".hk-shared-chart-example");
  expect(await example.locator(".hk-chart-bar").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height))).toEqual([0, 0, 60, 30, 120, 60]);
  await example.getByLabel("Chart scenario").selectOption("invalid");
  await expect(example.locator(".hk-chart-bar")).toHaveCount(2);
  await expect(example.getByText("Unavailable", { exact: true })).toHaveCount(2);
});

test("revenue renders independent series and honors refused period changes", async ({ page }) => {
  await page.goto("/#boardui:revenue-chart-card");
  const example = page.locator(".hk-shared-chart-example");
  await expect(example.locator(".hk-chart-bar")).toHaveCount(0);
  await expect(example.locator(".hk-interactive-chart svg")).toBeVisible();
  await example.getByRole("checkbox", { name: "Keep supplied chart selection" }).check();
  await example.getByRole("button", { name: "Month", exact: true }).click();
  await expect(example.getByRole("button", { name: "Week", exact: true })).toHaveAttribute("aria-pressed", "true");
  await example.getByLabel("Chart scenario").selectOption("invalid");
  await expect(example.getByRole("button", { name: /Inspect Stage 1/ })).toHaveAccessibleName(/Unavailable/);
});

test("activity calendar uses dated records rather than generic bars", async ({ page }) => {
  await page.goto("/#boardui:most-active-days-card");
  const example = page.locator(".hk-shared-chart-example");
  await expect(example.getByRole("grid")).toHaveCount(2);
  await example.getByRole("button", { name: /September 2, 2026/ }).click();
  await expect(example.getByRole("heading", { name: "2026-09-02 activity" })).toBeVisible();
  await example.getByRole("checkbox", { name: "Keep supplied chart selection" }).check();
  await example.getByRole("button", { name: /September 3, 2026/ }).click();
  await expect(example.getByRole("heading", { name: "2026-09-02 activity" })).toBeVisible();
  await example.getByLabel("Chart scenario").selectOption("empty");
  await expect(example.getByText("No dated activity supplied.")).toBeVisible();
});

test("sleep displays independent score segments and explicit targets", async ({ page }) => {
  await page.goto("/#boardui:sleep-score-card");
  const example = page.locator(".hk-shared-chart-example");
  await expect(example.locator(".hk-sleep-segment")).toHaveCount(3);
  await expect(example.getByRole("button", { name: /Stage 2: 0.25 \/ 1/ })).toBeVisible();
  await example.getByLabel("Chart scenario").selectOption("invalid");
  await expect(example.locator(".hk-sleep-segment")).toHaveCount(1);
});

test("funnel keeps zero area, proportional top edges and every stage label", async ({ page }) => {
  await page.goto("/#boardui:funnel-chart-card");
  const example = page.locator(".hk-shared-chart-example");
  const shapes = example.locator(".hk-chart-funnel-shape path");
  await expect(shapes).toHaveCount(3);
  const widths = await shapes.evaluateAll(elements => elements.map(element => {
    const path = element as SVGPathElement;
    const edge = path.getAttribute("d")!.match(/^M([\d.-]+) 0 H([\d.-]+)/)!;
    return (Number(edge[2]) - Number(edge[1])) * path.getScreenCTM()!.a;
  }));
  expect(widths[0]).toBe(0);
  expect(widths[1] / widths[2]).toBeCloseTo(.5, 2);
  await example.getByLabel("Chart scenario").selectOption("many");
  await expect(example.locator(".hk-chart-funnel-row")).toHaveCount(8);
  await expect(example.getByText("Stage 8", { exact: true })).toBeVisible();
  expect(await shapes.last().evaluate(element => (element as SVGPathElement).getBBox().width)).toBe(0);
  await example.getByLabel("Chart scenario").selectOption("signed");
  await expect(example.getByText("Unavailable")).toBeVisible();
  await expect(shapes).toHaveCount(2);
});

for (const family of ["steps-card", "funnel-chart-card"]) for (const width of [1512, 390]) for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`${family} ${width} ${mode} ${palette}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto(`/#boardui:${family}`);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const example = page.locator(".hk-shared-chart-example");
    await example.getByLabel("Chart scenario").selectOption("many");
    expect((await new AxeBuilder({ page }).include(".hk-shared-chart-example").analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (family === "steps-card" && width === 390) {
      const plot = example.locator(".hk-chart-bars");
      await plot.focus();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => plot.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      await plot.evaluate(element => { element.scrollLeft = 0; });
    }
    await example.screenshot({ path: test.info().outputPath("chart.png") });
    await example.getByLabel("Chart scenario").focus();
    await expect(example.getByLabel("Chart scenario")).toBeFocused();
  });
}
