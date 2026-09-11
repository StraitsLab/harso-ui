import { test, expect } from "@playwright/test";

for (const appearance of ["light", "dark"] as const) {
  for (const palette of ["clean", "cozy"] as const) {
    for (const width of [390, 1440]) {
      for (const family of ["hr-management", "medical-profile", "finance-dashboard"]) {
        test(`${family} ${appearance}-${palette}-${width}`, async ({ page }, testInfo) => {
          await page.setViewportSize({ width, height: 1000 });
          await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
          await page.goto(`/#boardui:${family}`);
          await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
          await page.getByLabel("Palette", { exact: true }).selectOption(palette);
          await page.evaluate(() => document.fonts.ready);
          const example = page.getByTestId("live-example");
          if (family === "finance-dashboard") {
            const chart = example.locator(".hk-scatter");
            await chart.screenshot({ path: testInfo.outputPath("portfolio.png") });
            await expect(chart.locator(".hk-scatter-series")).toContainText("Mean Return: 30.67");
            await expect(chart).not.toContainText("30.666666666666664");
            return;
          }
          const selects = example.locator(".hk-table select");
          await expect(selects.first()).toBeAttached();
          const measurements = await selects.evaluateAll(elements => elements.map(element => {
            const select = element as HTMLSelectElement;
            const style = getComputedStyle(select);
            const context = document.createElement("canvas").getContext("2d")!;
            context.font = style.font;
            const texts = Array.from(select.options, option => option.text);
            return { label: select.getAttribute("aria-label"), value: select.value,
              width: select.getBoundingClientRect().width,
              available: select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
              required: Math.max(...texts.map(text => context.measureText(text).width)), texts };
          }));
          await testInfo.attach("select-measurements", { body: JSON.stringify(measurements, null, 2), contentType: "application/json" });
          await selects.first().scrollIntoViewIfNeeded();
          const scroller = selects.first().locator("xpath=ancestor::*[contains(@class,'hk-table-scroll')]");
          await scroller.screenshot({ path: testInfo.outputPath("table.png") });
          for (const measurement of measurements) expect.soft(measurement.available, JSON.stringify(measurement)).toBeGreaterThanOrEqual(measurement.required);
          const first = selects.first();
          const longest = measurements[0].texts.reduce((previous, next) => next.length > previous.length ? next : previous);
          await first.selectOption({ label: longest });
          await expect(first).toHaveValue(longest);
          await first.scrollIntoViewIfNeeded();
          const bounds = await first.evaluate(element => {
            const control = element.getBoundingClientRect();
            const region = element.closest(".hk-table-scroll")!.getBoundingClientRect();
            return { reachable: control.left >= region.left - 1 && control.right <= region.right + 1,
              pageFits: document.documentElement.scrollWidth <= innerWidth + 1 };
          });
          expect(bounds.reachable).toBe(true);
          expect(bounds.pageFits).toBe(true);
          await scroller.evaluate(element => { element.scrollLeft = element.scrollWidth; });
          expect(await scroller.evaluate(element => element.scrollLeft + element.clientWidth >= element.scrollWidth - 1)).toBe(true);
        });
      }
    }
  }
}
