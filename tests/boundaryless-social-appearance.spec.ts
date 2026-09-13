import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("social appearance is painted and fixed width stays stable across labels and themes", async ({ page }) => {
  await page.goto("/#boardui:social-button");
  const example = page.getByTestId("live-example");
  const button = example.locator(".hk-social-button");
  for (const appearance of ["light", "dark"]) for (const palette of ["clean", "cozy"]) {
    await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const backgrounds = [];
    for (const treatment of ["colorful", "black", "white"]) {
      await example.getByLabel("Social appearance", { exact: true }).selectOption(treatment);
      backgrounds.push(await button.evaluate(element => getComputedStyle(element).backgroundColor));
      expect((await new AxeBuilder({ page }).include(".hkl-live-example").analyze()).violations).toEqual([]);
      await button.hover();
      expect((await new AxeBuilder({ page }).include(".hkl-live-example").analyze()).violations).toEqual([]);
      await page.mouse.move(0, 0);
    }
    expect(new Set(backgrounds).size).toBe(3);
    await example.getByLabel("Social appearance", { exact: true }).selectOption("colorful");
    expect(await button.evaluate(element => getComputedStyle(element).minHeight)).toBe("36px");
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(36);
    expect(await button.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const provider of ["X", "Microsoft"]) {
        await example.getByLabel("Social provider", { exact: true }).selectOption(provider);
        expect((await button.boundingBox())!.width).toBe(240);
      }
      await example.getByLabel("Full-width social button").check();
      expect(await button.evaluate(element => Math.abs(element.getBoundingClientRect().width - element.parentElement!.getBoundingClientRect().width))).toBeLessThanOrEqual(1);
      await example.getByLabel("Full-width social button").uncheck();
    }
  }
});
