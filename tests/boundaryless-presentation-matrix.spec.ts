import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import catalogue from "../src/catalog.json" with { type: "json" };

const paints = {
  "light/clean": { backgroundColor: "rgb(250, 251, 253)", color: "rgb(32, 36, 42)" },
  "light/cozy": { backgroundColor: "rgb(251, 248, 242)", color: "rgb(48, 43, 37)" },
  "dark/clean": { backgroundColor: "rgb(23, 26, 32)", color: "rgb(238, 240, 245)" },
  "dark/cozy": { backgroundColor: "rgb(32, 30, 27)", color: "rgb(244, 238, 228)" },
};

const filename = (value: string) => value.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 100);

for (const family of catalogue.components) {
  test(`${family.id} actual palette and responsive state matrix`, async ({ page }) => {
    const errors: string[] = [];
    const exercised: object[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/#${family.id}`);
    await expect(page.locator(".hkl-title-row h1")).toHaveText(family.name);
    const example = page.getByTestId("live-example");
    const selector = page.getByLabel("Example state", { exact: true });
    const states = await selector.locator("option").evaluateAll(options => options.map(option => (option as HTMLOptionElement).value));
    const inspectLayout = async () => {
      await expect(example).toBeVisible();
      expect.soft(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "document reflows without horizontal scroll").toBe(true);
      const bounds = (await example.boundingBox())!;
      expect.soft(bounds.width).toBeGreaterThan(0);
      expect.soft(bounds.x).toBeGreaterThanOrEqual(-1);
      expect.soft(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
      const outside = await example.evaluate(root => Array.from(root.querySelectorAll<HTMLElement>("button, input, select, textarea, a[href]")).filter(element => {
        const rectangle = element.getBoundingClientRect();
        if (!rectangle.width || !rectangle.height || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
        if (rectangle.width <= 2 || rectangle.height <= 2) return false;
        if (rectangle.left >= -1 && rectangle.right <= innerWidth + 1) return false;
        for (let ancestor = element.parentElement; ancestor && ancestor !== root; ancestor = ancestor.parentElement) {
          if (["auto", "scroll"].includes(getComputedStyle(ancestor).overflowX)) return false;
        }
        return true;
      }).map(element => ({ tag: element.tagName, label: element.getAttribute("aria-label") || element.textContent?.slice(0, 80) })));
      expect.soft(outside, "visible controls fit or belong to a native scroll region").toEqual([]);
    };
    try {
      for (const appearance of ["light", "dark"] as const) for (const palette of ["clean", "cozy"] as const) {
        await page.emulateMedia({ colorScheme: appearance });
        await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
        await page.getByLabel("Palette", { exact: true }).selectOption(palette);
        for (const width of [390, 1440]) {
          await page.setViewportSize({ width, height: 1000 });
          const capture = async (scope: string) => example.screenshot({ path: test.info().outputPath(`${filename(family.id)}-${appearance}-${palette}-${width}-${scope}.png`), animations: "disabled" });
          const representative = appearance === "light" && palette === "clean" && width === 390;
          for (const state of states) await test.step(`${appearance}/${palette}/${width}/${state}`, async () => {
            await selector.selectOption(state);
            await inspectLayout();
            exercised.push({ appearance, palette, width, globalState: state });
            if (state === "default") {
              const paint = await page.locator(".hkl-root").evaluate(element => {
                const style = getComputedStyle(element);
                return { backgroundColor: style.backgroundColor, color: style.color };
              });
              expect.soft(paint).toEqual(paints[`${appearance}/${palette}`]);
              if (width === 1440) {
                const audit = await new AxeBuilder({ page }).include('[data-testid="live-example"]').analyze();
                expect.soft(audit.violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) }))).toEqual([]);
              }
            }
            if (state === "default" || representative) await capture(`global-${filename(state)}`);
          });
          await selector.selectOption("default");
          const selects = example.locator("select");
          const defaults = await selects.evaluateAll(elements => elements.map((node, index) => {
            const element = node as HTMLSelectElement;
            const rectangle = element.getBoundingClientRect();
            const visible = rectangle.width > 2 && rectangle.height > 2 && getComputedStyle(element).visibility !== "hidden" && !element.closest('[hidden], [inert], [aria-hidden="true"]');
            return {
              index,
              label: element.getAttribute("aria-label") || element.labels?.[0]?.textContent?.trim() || element.name || `select-${index}`,
              value: element.value,
              reason: !visible ? "hidden or clipped" : element.matches(":disabled") ? "disabled at default" : element.multiple ? "multiple selection" : element.selectedOptions[0]?.disabled ? "default option is disabled" : null,
              options: Array.from(element.options).map(option => ({ value: option.value, disabled: option.disabled || option.parentElement instanceof HTMLOptGroupElement && option.parentElement.disabled })),
            };
          }));
          for (const control of defaults) {
            if (control.reason) {
              exercised.push({ appearance, palette, width, selector: control.index, label: control.label, skipped: control.reason });
              continue;
            }
            for (const [optionIndex, option] of control.options.entries()) {
              if (option.disabled || option.value === control.value) {
                exercised.push({ appearance, palette, width, selector: control.index, label: control.label, value: option.value, skipped: option.disabled ? "disabled option" : "covered by default" });
                continue;
              }
              await test.step(`${appearance}/${palette}/${width}/select-${control.index}/${control.label}/${option.value}`, async () => {
                const input = selects.nth(control.index);
                await expect(input).toHaveValue(control.value);
                await input.selectOption(option.value);
                await expect(input).toHaveValue(option.value);
                await inspectLayout();
                exercised.push({ appearance, palette, width, selector: control.index, label: control.label, value: option.value });
                if (representative) await capture(`select-${control.index}-${optionIndex}-${filename(option.value)}`);
                await input.selectOption(control.value);
                const values = await selects.evaluateAll(elements => elements.map(element => (element as HTMLSelectElement).value));
                for (const original of defaults.filter(item => !item.reason)) {
                  if (values[original.index] !== original.value) await selects.nth(original.index).selectOption(original.value);
                }
                expect(await selects.evaluateAll(elements => elements.map(element => (element as HTMLSelectElement).value)), "every selector returns to its independent default").toEqual(defaults.map(original => original.value));
              });
            }
          }
        }
      }
      expect(errors).toEqual([]);
    } finally {
      await test.info().attach(`${filename(family.id)}-scenario-coverage`, { body: JSON.stringify({ familyId: family.id, exercised, pageErrors: errors }, null, 2), contentType: "application/json" });
    }
  });
}
