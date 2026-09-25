import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import catalogue from "../src/catalog.json" with { type: "json" };

// Each test owns its page and output files, so parallel mode lets CI spread this slow file across workers and shards.
test.describe.configure({ mode: "parallel" });

for (const appearance of ["light", "dark"] as const) {
  for (const palette of ["clean", "cozy"] as const) {
    for (const width of [390, 1440]) {
      test(`complete gallery renders: ${appearance}/${palette}/${width}`, async ({ page }) => {
        test.setTimeout(600_000);
        await page.setViewportSize({ width, height: 1000 });
        await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
        const errors: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.goto("/#boardui:button");
        await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
        await page.getByLabel("Palette", { exact: true }).selectOption(palette);
        for (const family of catalogue.components) {
          await test.step(family.id, async () => {
            await page.evaluate(id => { window.location.hash = id; }, family.id);
            await expect(page.locator(".hkl-title-row h1")).toHaveText(family.name);
            const example = page.getByTestId("live-example");
            await expect.soft(example, family.id).toBeAttached();
            await expect.soft(page.locator(".hkl-root")).toHaveAttribute("data-mode", appearance);
            await expect.soft(page.locator(".hkl-root")).toHaveAttribute("data-palette", palette);
            expect.soft(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${family.id}: page reflow`).toBe(true);
            if (appearance === "light" && palette === "clean" && width === 390) {
              const selector = page.getByLabel("Example state", { exact: true });
              const states = await selector.locator("option").evaluateAll(options => options.map(option => (option as HTMLOptionElement).value));
              for (const state of states.filter(value => value !== "default")) {
                await selector.selectOption(state);
                await expect.soft(example, `${family.id}/${state}`).toBeAttached();
                expect.soft(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${family.id}/${state}: page reflow`).toBe(true);
              }
              await selector.selectOption("default");
            }
            if (width === 1440) {
              const audit = await new AxeBuilder({ page }).include('[data-testid="live-example"]').analyze();
              expect.soft(audit.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) })), `${family.id}: accessibility`).toEqual([]);
              await example.screenshot({ path: test.info().outputPath(`${family.id.replace(":", "-")}.png`), animations: "disabled" });
            } else {
              await example.screenshot({ path: test.info().outputPath(`${family.id.replace(":", "-")}.png`), animations: "disabled" });
            }
          });
        }
        expect(errors).toEqual([]);
      });
    }
  }
}
