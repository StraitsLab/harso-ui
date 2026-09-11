import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const appearance of ["light", "dark"]) {
  for (const palette of ["clean", "cozy"]) {
    for (const width of [1512, 390]) {
      test(`authentication carousel: ${appearance}/${palette} at ${width}px`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 1040 });
        await page.goto("/#boardui:auth-card");
        await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
        await page.getByLabel("Palette", { exact: true }).selectOption(palette);
        const carousel = page.getByRole("region", { name: "Authentication media" });
        const workspace = carousel.getByRole("textbox", { name: "Workspace name" });
        await workspace.fill("Example workspace");
        await workspace.press("Home");
        await workspace.press("ArrowRight");
        await expect(workspace).toBeVisible();
        await expect(workspace).toBeFocused();
        await expect(workspace).toHaveValue("Example workspace");
        await carousel.focus();
        await carousel.press("End");
        await expect(carousel.getByText("Your data stays scoped to your workspace.")).toBeVisible();
        await carousel.press("Home");
        await expect(workspace).toBeVisible();
        for (const indicator of await carousel.getByRole("button", { name: /Show media/ }).all()) {
          const bounds = await indicator.boundingBox();
          expect(bounds?.width).toBeGreaterThanOrEqual(24);
          expect(bounds?.height).toBeGreaterThanOrEqual(24);
        }
        const third = carousel.getByRole("button", { name: "Show media 3" });
        await third.focus();
        await third.press("Enter");
        await expect(third).toHaveAttribute("aria-current", "true");
        await expect(third).toHaveCSS("outline-style", "solid");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        expect((await new AxeBuilder({ page }).include(".hk-auth-card").analyze()).violations).toEqual([]);
        await page.getByTestId("live-example").screenshot({ path: testInfo.outputPath("auth-carousel.png") });
      });
    }
  }
}

test("authentication carousel retains visible controls in forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/#boardui:auth-card");
  const indicator = page.getByRole("button", { name: "Show media 2" });
  await indicator.focus();
  await indicator.press("Enter");
  await expect(indicator).toHaveAttribute("aria-current", "true");
  await expect(indicator).toHaveCSS("outline-style", "solid");
  await expect(page.getByText("A quiet surface for live progress and results.")).toBeVisible();
});
