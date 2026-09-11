import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("thinking variants animate truthfully, freeze and honor live reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#boardui:agent-thinking");
  const thinking = page.locator(".hk-thinking");
  const timer = thinking.getByRole("timer", { name: "Elapsed presentation time" });
  const shapes: Record<string, string> = { wave: ".hk-thinking-dot", spin: ".hk-thinking-dot", stars: ".hk-thinking-star", infinity: ".hk-thinking-comet" };
  for (const [variant, shape] of Object.entries(shapes)) {
    await page.getByLabel("Thinking variant").selectOption(variant);
    if (variant === "infinity") await expect(thinking.locator("svg")).toHaveCSS("width", "32px");
    await expect(thinking.locator(shape).first()).not.toHaveCSS("animation-name", "none");
    await expect(thinking.locator(".hk-thinking-label")).not.toHaveCSS("background-image", "none");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(thinking.locator(shape).first()).toHaveCSS("animation-name", "none");
    await expect(thinking.locator(".hk-thinking-label")).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  await expect(timer).not.toHaveText("0.0 s");
  await page.getByLabel("Pause thinking", { exact: true }).check();
  await expect(thinking).toHaveAttribute("data-active", "false");
  await expect(thinking.locator(".hk-thinking-comet")).toHaveCSS("animation-name", "none");
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const frozen = await timer.innerText();
  await page.waitForTimeout(350);
  await expect(timer).toHaveText(frozen);
  await page.getByLabel("Pause thinking", { exact: true }).uncheck();
  await expect(timer).not.toHaveText(frozen);
  await page.getByLabel("Thinking state").selectOption("output-available");
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const completed = await timer.innerText();
  await page.waitForTimeout(350);
  await expect(timer).toHaveText(completed);
  await expect(thinking).toHaveAttribute("data-active", "false");
  await expect(thinking.getByRole("status")).toContainText("Completed");
  await expect(timer).toHaveAttribute("aria-live", "off");
  await page.getByRole("button", { name: "Restart timer" }).click();
  await expect(timer).toHaveText("0.0 s");
});

test("host progress never advances itself and minimizes without losing state", async ({ page }) => {
  await page.goto("/#boardui:agent-progress");
  const example = page.locator(".hkl-live-example");
  const toggle = example.locator("button[aria-expanded]");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.getByLabel("Refuse expansion changes", { exact: true }).check();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.getByLabel("Refuse expansion changes", { exact: true }).uncheck();
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.waitForTimeout(1800);
  await toggle.click();
  await expect(example.locator('li[data-state="active"]')).toContainText("Build the component");
  await expect(page.getByLabel("Demo completion callbacks")).toHaveText("0");
});

test("timed demo preserves minimized progress and emits one completion", async ({ page }) => {
  await page.goto("/#boardui:agent-progress");
  await page.getByLabel("Progress source").selectOption("timed");
  const toggle = page.locator('.hkl-live-example button[aria-expanded]');
  await toggle.click();
  await expect(page.getByLabel("Demo completion callbacks")).toHaveText("1", { timeout: 6000 });
  await toggle.click();
  await expect(page.locator('.hkl-live-example li[data-state="complete"]')).toHaveCount(3);
  await page.waitForTimeout(600);
  await expect(page.getByLabel("Demo completion callbacks")).toHaveText("1");
});

for (const component of ["agent-progress", "agent-thinking"]) for (const width of [320, 1280]) for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`${component} ${width} ${mode} ${palette}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto(`/#boardui:${component}`);
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const options = component === "agent-progress" ? ["active", "complete", "unknown", "empty", "loading", "error", "disabled", "long"] : ["wave", "spin", "stars", "infinity"];
    for (const value of options) {
      await page.getByLabel(component === "agent-progress" ? "Progress scenario" : "Thinking variant", { exact: true }).selectOption(value);
      expect((await new AxeBuilder({ page }).include(".hkl-live-example").analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    if (component === "agent-progress") {
      const labels = page.locator(".hk-agent-progress li > :last-child");
      expect(await labels.first().evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(150);
      await expect(page.locator(".hk-agent-progress-toggle")).toHaveCSS("min-height", "44px");
    } else {
      await expect(page.locator(".hk-thinking svg")).toHaveCSS("width", "32px");
    }
    await page.locator(".hkl-live-example").screenshot({ path: test.info().outputPath(`${component}.png`) });
  });
}
