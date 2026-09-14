import { expect, test, type Locator, type Page } from "@playwright/test";

async function mountCategories(page: Page, appearance: string, palette: string, labels: string[]) {
  await page.goto(`/?radarCategories=${labels.length}#boardui:radar-chart-card`);
  const entry = await (await page.request.get("/preview/main.tsx")).text();
  const example = await (await page.request.get("/preview/radial-radar-example.tsx")).text();
  const reactUrl = entry.match(/from "([^"]*\/deps\/react\.js[^"]*)"/)?.[1];
  const domUrl = entry.match(/from "([^"]*\/deps\/react-dom_client\.js[^"]*)"/)?.[1];
  const producerUrl = example.match(/from "([^"]*\/src\/index\.ts[^"]*)"/)?.[1];
  if (!reactUrl || !domUrl || !producerUrl) throw new Error("Coordinated Vite consumer imports were not found");
  await page.evaluate(async ({ reactUrl, domUrl, producerUrl, appearance, palette, labels }) => {
    const React = (await import(reactUrl)).default;
    const { createRoot } = (await import(domUrl)).default;
    const { KitProvider, RadarChartCard } = await import(producerUrl);
    const gallery = document.getElementById("root");
    if (gallery) gallery.hidden = true;
    const fixture = document.createElement("main");
    fixture.dataset.testid = "radar-label-fixture";
    fixture.style.cssText = "box-sizing:border-box;width:100%;max-width:720px;padding:24px;margin:auto";
    document.body.append(fixture);
    createRoot(fixture).render(React.createElement(KitProvider, { appearance, palette }, React.createElement(RadarChartCard, {
      title: "Supplied category mapping", data: labels.map((label, index) => ({ label, value: index * 25 })), showTiles: false,
    })));
  }, { reactUrl, domUrl, producerUrl, appearance, palette, labels });
  const chart = page.getByTestId("radar-label-fixture").locator("article");
  await expect(chart).toBeVisible();
  return chart;
}

async function assertMapping(chart: Locator, labels: string[]) {
  const markers = chart.locator(".hk-radar-axis-label");
  // Wave 1: axis labels carry the category name itself (ellipsised at 76px) instead of a number that needs a key.
  await expect(markers).toHaveCount(labels.length);
  for (const [index, label] of labels.entries()) await expect(markers.nth(index)).toHaveText(label);
  await expect(chart.locator(".hk-radar-category-number")).toHaveCount(0);
  const plot = await chart.locator(".hk-radar-plot, svg").first().boundingBox();
  expect(plot).not.toBeNull();
  for (const marker of await markers.all()) {
    await expect(marker).toBeVisible();
    const box = (await marker.boundingBox())!;
    expect(box.width).toBeGreaterThan(0);
    expect(box.x).toBeGreaterThanOrEqual(plot!.x);
    expect(box.y).toBeGreaterThanOrEqual(plot!.y);
    expect(box.x + box.width).toBeLessThanOrEqual(plot!.x + plot!.width);
    expect(box.y + box.height).toBeLessThanOrEqual(plot!.y + plot!.height);
    await expect(marker).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
  }
  const items = chart.locator(".hk-chart-metrics button");
  for (const [index, label] of labels.entries()) {
    await expect(items.nth(index)).toContainText(label);
    expect(await items.nth(index).evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    const text = items.nth(index).locator(":scope > span");
    expect(await text.evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
  }
  expect(await chart.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
}

for (const appearance of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [390, 1440]) {
  test(`RADAR long and empty category labels ${appearance}/${palette}/${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
    const labels = ["Quality — independently supplied observation across the example workspace", "ContinuousCategory".repeat(12), "", "   "];
    const chart = await mountCategories(page, appearance, palette, labels);
    await assertMapping(chart, [labels[0], labels[1], "Unlabeled category", "Unlabeled category"]);
    await expect(chart.getByRole("button", { name: "Unlabeled category: 50", exact: true })).toBeVisible();
    await expect(chart.getByRole("button", { name: "Unlabeled category: 75", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await chart.screenshot({ path: test.info().outputPath("radar-long-labels.png") });
    const empty = await mountCategories(page, appearance, palette, []);
    await expect(empty.getByText("No data", { exact: true })).toBeVisible();
    await expect(empty.locator("svg,.hk-radar-category-number")).toHaveCount(0);
    expect(await empty.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  });
}

for (const appearance of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [390, 1440]) {
  test(`RADAR persistent mapping ${appearance}/${palette}/${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
    await page.goto("/#boardui:radar-chart-card");
    await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const example = page.getByTestId("live-example").getByTestId("radial-radar-example");
    const chart = example.locator("article");
    await example.getByLabel("Show stat tiles").uncheck();
    for (const variant of ["filled", "dots", "lines", "score"]) {
      await chart.getByLabel("Radar observations variant").selectOption(variant);
      await assertMapping(chart, ["Speed", "Quality", "Care", "Reach"]);
      await expect(chart.getByRole("status")).toHaveText("Focus or touch a value to inspect");
    }
    await example.getByLabel("Show stat tiles").check();
    await assertMapping(chart, ["Speed", "Quality", "Care", "Reach"]);
    await page.mouse.move(0, 0);
    await chart.getByRole("button", { name: "Quality: 0.25", exact: true }).focus();
    await expect(chart.locator(".hk-radar-axis-label").nth(1)).toHaveAttribute("data-active", "true");
    await page.keyboard.press("Escape");
    await assertMapping(chart, ["Speed", "Quality", "Care", "Reach"]);
    await chart.screenshot({ path: test.info().outputPath("radar-mapping.png") });
    await example.getByLabel("Chart scenario").selectOption("empty");
    await expect(chart.getByText("No data", { exact: true })).toBeVisible();
    await expect(chart.locator(".hk-radar-axis-label,.hk-radar-category-number")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
