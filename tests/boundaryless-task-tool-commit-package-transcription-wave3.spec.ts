import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const [mode, width, appearance] of [["desktop-light", 1440, "light"], ["desktop-dark", 1440, "dark"], ["phone-dark", 390, "dark"]] as const) {
  test(`wave3 AI alignment and transcript targets ${mode}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const family of ["task", "tool", "commit", "package-info", "transcription"]) {
      await page.goto(`/#vercel:${family}`);
      await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
      await expect(page.locator(".hkl-preview-frame")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (family === "task" || family === "tool") {
        const trigger = family === "task" ? page.getByRole("button", { name: "Six sources reviewed", exact: true }) : page.locator(".hk-tool .hk-work-trigger").first();
        const facts = await trigger.evaluate(el => {
          const b = el.getBoundingClientRect();
          const label = el.querySelector(".hk-work-trigger-label")!.getBoundingClientRect();
          const icon = el.closest(".hk-task-item")?.querySelector(".hk-task-icon")?.getBoundingClientRect();
          return { padding: getComputedStyle(el).paddingInlineStart, height: b.height, centerDelta: icon ? Math.abs(icon.y + icon.height / 2 - label.y - label.height / 2) : 0 };
        });
        expect(facts.padding).toBe("0px");
        expect(facts.height).toBeGreaterThanOrEqual(width === 390 ? 44 : 36);
        expect(facts.centerDelta).toBeLessThanOrEqual(1);
      }
      if (family === "commit" && width === 390) {
        await expect(page.locator(".hk-commit-author")).toHaveCSS("align-items", "flex-start");
        await expect(page.locator(".hk-commit-metadata")).toHaveCSS("flex-direction", "column");
        for (const separator of await page.locator(".hk-commit-separator").all()) await expect(separator).toBeHidden();
      }
      if (family === "package-info") await expect(page.locator(".hk-package-header")).toHaveCSS(width === 390 ? "flex-direction" : "align-items", width === 390 ? "column" : "baseline");
      if (family === "transcription") {
        await expect(page.locator(".hk-transcription")).toHaveCSS("gap", "0px");
        const segments = page.locator(".hk-transcription-segment");
        for (const segment of await segments.all()) {
          await expect(segment).toHaveCSS("padding-left", "2px");
          expect((await segment.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        }
        await segments.first().click();
        await expect(segments.first()).toHaveAttribute("aria-current", "true");
        expect((await new AxeBuilder({ page }).include(".hk-transcription-example").analyze()).violations).toEqual([]);
      }
    }
  });
}
