import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("actual CSS motion reports pause, resume, stop and live reduced-motion transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#vercel:persona");
  const persona = page.getByRole("img", { name: "Persona idle", exact: true });
  const log = page.getByLabel("Persona lifecycle", { exact: true });
  await expect(log).toContainText("ready");
  await expect(log).toContainText("play");
  await page.getByLabel("Pause animation", { exact: true }).check();
  await expect(persona.locator(".hk-persona-motion")).toHaveCSS("animation-play-state", "paused");
  await expect(log).toContainText("play · pause");
  await page.getByLabel("Pause animation", { exact: true }).uncheck();
  await expect(log).toContainText("pause · play");
  await page.getByLabel("Persona state", { exact: true }).selectOption("asleep");
  await expect(page.getByRole("img", { name: "Persona asleep", exact: true }).locator(".hk-persona-motion")).toHaveCSS("animation-name", "none");
  await expect(log).toContainText("play · stop");
  await page.getByLabel("Persona state", { exact: true }).selectOption("listening");
  await expect(log).toContainText("stop · play");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("img", { name: "Persona listening", exact: true })).toHaveAttribute("data-playback", "paused");
  await expect(log).toContainText("play · pause");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(log).toHaveText(/pause · play$/);
});

test("six distinct treatments cover five host states without network assets", async ({ page }) => {
  const assets: string[] = [];
  page.on("request", request => { if (["image", "media"].includes(request.resourceType())) assets.push(request.url()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#vercel:persona");
  for (const state of ["idle", "listening", "thinking", "speaking", "asleep"]) {
    await page.getByLabel("Persona state", { exact: true }).selectOption(state);
    await expect(page.locator(".hk-persona-gallery [role=img]")).toHaveCount(6);
    for (const variant of ["obsidian", "mana", "opal", "halo", "glint", "command"]) {
      await expect(page.getByRole("img", { name: `${variant} ${state}`, exact: true })).toBeVisible();
    }
  }
  const appearances = await page.locator(".hk-persona-gallery .hk-persona-layer:first-child").evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    return [style.backgroundImage, style.backgroundColor, style.border, style.inset, style.borderRadius].join("|");
  }));
  expect(new Set(appearances).size).toBe(6);
  expect(assets).toEqual([]);
});

for (const width of [320, 1280]) for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`Persona ${width} ${mode} ${palette}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#vercel:persona");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    await page.getByLabel("Persona variant", { exact: true }).focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    expect((await new AxeBuilder({ page }).include(".hkl-live-example").analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator(".hk-persona-gallery").screenshot({ path: test.info().outputPath("persona.png") });
  });
}
