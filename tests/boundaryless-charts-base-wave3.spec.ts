import { expect, test } from "@playwright/test";

for (const [mode, width] of [["light", 1440], ["dark", 1440], ["dark", 390]] as const) {
  test(`wave3 chart/base alignment and hierarchy ${mode} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    const open = async (family: string) => {
      await page.goto(`/#boardui:${family}`);
      await page.getByLabel("Appearance", { exact: true }).selectOption(mode);
      await expect(page.getByTestId("live-example")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    };
    await open("table");
    const basic = page.locator(".hk-table").first();
    await expect(basic.getByRole("columnheader", { name: "Disposition" })).toHaveCSS("text-align", "start");
    await expect(basic.getByRole("cell", { name: "Keep", exact: true })).toHaveCSS("text-align", "start");
    await open("auth-card");
    const content = page.locator(".hk-auth-specimen .hk-auth-content");
    await expect(content).toHaveCSS("padding-left", "0px");
    await expect(content).toHaveCSS("border-left-width", "0px");
    await expect(content).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await open("scatter-chart-card");
    const distances = await page.locator(".hk-scatter").evaluate(root => {
      const plot = root.querySelector("svg")!.getBoundingClientRect();
      const tick = root.querySelector(".hk-scatter-x-tick")!.getBoundingClientRect();
      const title = root.querySelector(".hk-scatter-x-title")!.getBoundingClientRect();
      return { tick: tick.top - (plot.top + plot.height * 196 / 236), title: title.top - tick.bottom };
    });
    expect(distances.tick).toBeCloseTo(8, 0);
    expect(distances.title).toBeCloseTo(8, 0);
    await open("contributions-card");
    const meters = await page.locator(".hk-contribution meter").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().left));
    expect(new Set(meters).size).toBe(1);
    for (const button of await page.locator(".hk-contribution > button").all()) {
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await expect(button).toHaveCSS("padding-left", "0px");
    }
    await open("line-chart-card");
    await expect(page.locator(".hk-interactive-legend")).toHaveCount(0);
    await expect(page.locator(".hk-interactive-headline")).toContainText("12,500");
    await open("area-chart-card");
    await expect(page.locator(".hk-interactive-headline")).toHaveText("Total: 18,350");
    await expect(page.locator(".hk-interactive-legend li")).toHaveCount(3);
    await expect(page.locator(".hk-interactive-legend")).toContainText("Organic");
  });
}
