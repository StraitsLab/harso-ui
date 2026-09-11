import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { ExampleState } from "../preview/examples";

async function openGallery(page: Page, component: string, appearance = "light", palette = "clean") {
  const family = component === "RadarChartCard" ? "radar" : "radial";
  await page.goto(`/?radialRadar=${component}-${appearance}-${palette}#boardui:${family}-chart-card`);
  await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
  await page.getByLabel("Palette", { exact: true }).selectOption(palette);
  const example = page.getByTestId("live-example").getByTestId("radial-radar-example");
  await expect(example).toBeVisible();
  return example;
}

async function mountExample(page: Page, component: string, state: ExampleState) {
  const appearance = "light", palette = "clean";
  await page.goto(`/?radialRadar=${component}-${appearance}-${palette}`);
  const entry = await (await page.request.get("/src/boundaryless/main.tsx")).text();
  const reactUrl = entry.match(/from "([^"]*\/deps\/react\.js[^"]*)"/)?.[1];
  const domUrl = entry.match(/from "([^"]*\/deps\/react-dom_client\.js[^"]*)"/)?.[1];
  if (!reactUrl || !domUrl) throw new Error("This isolated consumer test requires the coordinated Vite dev server.");
  await page.evaluate(async ({ component, state, appearance, palette, reactUrl, domUrl }) => {
    const React = (await import(reactUrl)).default;
    const { createRoot } = (await import(domUrl)).default;
    const moduleUrl = "/src/boundaryless/radial-radar-example.tsx";
    const { RadialRadarExample } = await import(moduleUrl);
    const gallery = document.getElementById("root");
    if (gallery) gallery.hidden = true;
    const fixture = document.createElement("main");
    fixture.className = "harso-kit";
    fixture.dataset.mode = appearance;
    fixture.dataset.palette = palette;
    fixture.dataset.testid = "radial-radar-fixture";
    fixture.style.cssText = "box-sizing:border-box;width:100%;max-width:720px;padding:24px;margin:auto";
    document.body.append(fixture);
    createRoot(fixture).render(React.createElement(RadialRadarExample, { component, state }));
  }, { component, state, appearance, palette, reactUrl, domUrl });
  const example = page.getByTestId("radial-radar-fixture").getByTestId("radial-radar-example");
  await expect(example).toBeVisible();
  return example;
}

for (const component of ["RadarChartCard", "RadialChartCard"]) {
  test(`${component}: exact modes, tiles, supplied periods and controlled refusal`, async ({ page }) => {
    const example = await openGallery(page, component);
    const radar = component === "RadarChartCard";
    const chart = example.locator("article");
    const mode = chart.getByLabel(radar ? "Radar observations variant" : "Radial observations layout");
    const modes = radar ? ["filled", "dots", "lines", "score"] : ["rings", "labels", "grid", "gauge", "solid", "stacked"];
    await expect(mode.locator("option")).toHaveText(modes);
    for (const value of modes) {
      await mode.selectOption(value);
      await expect(chart.locator(radar ? ".hk-radar-plot" : ".hk-radial-plot")).toHaveAttribute(radar ? "data-variant" : "data-layout", value);
    }
    await example.getByLabel("Show stat tiles").uncheck();
    await expect(chart.locator(".hk-chart-stat-tiles")).toHaveCount(0);
    await example.getByLabel("Show stat tiles").check();
    await chart.getByRole("button", { name: "Quality: 0.25", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(chart.getByRole("status")).toHaveText("Quality: 0.25");
    await page.keyboard.press("Escape");
    await expect(chart.getByRole("status")).not.toContainText("Quality: 0.25");
    await example.getByLabel("Hold host state").check();
    await mode.selectOption(modes[0]);
    await expect(mode).toHaveValue(modes.at(-1)!);
    await expect(example.getByLabel("Chart host request")).toContainText("host refused");
    await chart.getByLabel(/observations range/).selectOption("month");
    await expect(chart.getByLabel(/observations range/)).toHaveValue("week");
    await example.getByLabel("Hold host state").uncheck();
    await chart.getByLabel(/observations range/).selectOption("month");
    await expect(chart.getByRole("button", { name: "Quality: 45", exact: true })).toBeVisible();
    await expect(example.getByLabel("Chart host request")).toContainText("host accepted");
  });

  test(`${component}: explicit zero, invalid, empty and blocked scenarios`, async ({ page }) => {
    const example = await openGallery(page, component);
    const chart = example.locator("article");
    const scenario = example.getByLabel("Chart scenario");
    await scenario.selectOption("zero");
    await expect(chart.getByRole("button", { name: "Quality: 0", exact: true })).toBeVisible();
    await scenario.selectOption("invalid");
    await expect(chart.getByRole("button", { name: "Missing: Unavailable", exact: true })).toBeVisible();
    expect(await chart.locator("svg").first().innerHTML()).not.toMatch(/NaN|Infinity/);
    await scenario.selectOption("empty");
    await expect(chart.getByText("No data", { exact: true })).toBeVisible();
    await scenario.selectOption("loading");
    await expect(chart.getByRole("status")).toContainText("Loading data");
    for (const select of await chart.getByRole("combobox").all()) await expect(select).toBeDisabled();
    await scenario.selectOption("error");
    await expect(chart.getByRole("alert")).toContainText("Illustrative host error");
    await scenario.selectOption("disabled");
    await expect(chart.getByRole("button", { name: "Quality: 0.25", exact: true })).toBeDisabled();
  });
}

test("Radar score is supplied, accepts zero, and honors host refusal", async ({ page }) => {
  const example = await openGallery(page, "RadarChartCard");
  await example.getByLabel("Radar observations variant").selectOption("score");
  await example.getByLabel("Score sample").selectOption("0");
  await expect(example.locator(".hk-radar-score strong")).toHaveText("0");
  await example.getByLabel("Hold host state").check();
  await example.getByLabel("Score sample").selectOption("82");
  await expect(example.locator(".hk-radar-score strong")).toHaveText("0");
  await example.getByLabel("Hold host state").uncheck();
  await example.getByLabel("Score sample").selectOption("missing");
  await expect(example.locator(".hk-radar-score strong")).toHaveText("Unavailable");
});

for (const appearance of ["light", "dark"]) for (const palette of ["clean", "cozy"]) for (const width of [390, 1440]) {
  test(`consumer reflow and axe: ${appearance}/${palette}/${width}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: appearance as "light" | "dark", reducedMotion: "reduce" });
    for (const component of ["RadarChartCard", "RadialChartCard"]) {
      const example = await openGallery(page, component, appearance, palette);
      const radar = component === "RadarChartCard";
      for (const mode of radar ? ["filled", "dots", "lines", "score"] : ["rings", "labels", "grid", "gauge", "solid", "stacked"]) {
        await example.getByLabel(radar ? "Radar observations variant" : "Radial observations layout").selectOption(mode);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        expect(await example.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
        const paints = await example.evaluate(root => {
          const probe = document.createElement("span");
          root.append(probe);
          const samples: { selector: string; property: string; actual: string; expected: string }[] = [];
          const checks = [
            [".hk-chart-card", "color", "--hk-ink"],
            [".hk-chart-card", "background-color", "--hk-surface"],
            [".hk-chart-card header p", "color", "--hk-secondary"],
            ['.hk-radar-axis:not([data-active="true"])', "stroke", "--hk-line"],
            ['.hk-radar-axis-label:not([data-active="true"])', "fill", "--hk-secondary"],
            [".hk-radar-edge", "stroke", "--hk-accent"],
            ['.hk-radial-plot:not([data-layout="solid"]) .hk-radial-track', "stroke", "--hk-line"],
            ['.hk-radial-plot[data-layout="solid"] .hk-radial-track', "fill", "--hk-line"],
          ];
          for (const [selector, property, token] of checks) {
            probe.style.color = `var(${token})`;
            const expected = getComputedStyle(probe).color;
            for (const element of root.querySelectorAll(selector)) samples.push({ selector, property, actual: getComputedStyle(element).getPropertyValue(property), expected });
          }
          probe.remove();
          return samples;
        });
        expect(paints.length).toBeGreaterThanOrEqual(3);
        for (const paint of paints) expect(paint.actual, `${mode} ${paint.selector} ${paint.property}`).toBe(paint.expected);
        await test.info().attach(`${component}-${mode}-paints`, { body: JSON.stringify(paints), contentType: "application/json" });
        await example.screenshot({ path: test.info().outputPath(`${component}-${mode}-${appearance}-${palette}-${width}.png`), animations: "disabled" });
      }
      expect((await new AxeBuilder({ page }).include('[data-testid="radial-radar-example"]').analyze()).violations).toEqual([]);
    }
  });
}

for (const component of ["RadarChartCard", "RadialChartCard"]) for (const state of ["disabled", "error", "long-content"] as const) {
  test(`${component}: supplied global ${state} prop`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 });
    const example = await mountExample(page, component, state);
    if (state === "disabled") {
      for (const control of await example.locator("button, input, select").all()) await expect(control).toBeDisabled();
    } else if (state === "error") {
      await expect(example.getByRole("alert")).toContainText("Illustrative host error");
      await example.getByLabel("Chart scenario").selectOption("zero");
      await expect(example.getByRole("alert")).toContainText("Illustrative host error");
      await expect(example.locator("article svg")).toHaveCount(0);
    } else {
      await expect(example.getByRole("heading")).toContainText("Long-form");
      await expect(example.getByRole("button", { name: /Quality.*independently supplied/ })).toBeVisible();
      expect(await example.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });
}
