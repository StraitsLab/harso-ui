import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const families = [
  { slug: "model-selector", search: "focus", choice: "Focus", title: "Choose how you work" },
  { slug: "voice-selector", search: "american", choice: "Eli", title: "A voice that feels natural" },
  { slug: "mic-selector", search: "built", choice: "Built-in microphone", title: "Choose a microphone" }
];

for (const family of families) {
  for (const appearance of ["light", "dark"]) {
    for (const palette of ["clean", "cozy"]) {
      for (const width of [1512, 390]) {
        test(`${family.slug}: ${appearance}/${palette} ${width}px`, async ({ page }, testInfo) => {
          await page.setViewportSize({ width, height: 1040 });
          await page.goto(`/#vercel:${family.slug}`);
          await page.getByLabel("Appearance", { exact: true }).selectOption(appearance);
          await page.getByLabel("Palette", { exact: true }).selectOption(palette);
          const trigger = page.locator(".hk-selector > button");
          await trigger.click();
          const dialog = page.getByRole("dialog", { name: family.title });
          const input = dialog.getByRole("textbox");
          await expect(input).toBeFocused();
          await dialog.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
          await expect(dialog).toHaveCSS("color", await page.locator(".hkl-root").evaluate(element => getComputedStyle(element).color));
          await input.fill(family.search);
          await input.press("ArrowDown");
          const choice = dialog.locator("[data-hk-selector-item]:visible").first();
          await expect(choice).toBeFocused();
          await expect(choice).toContainText(family.choice);
          await expect(choice).toHaveCSS("outline-style", "solid");
          expect((await new AxeBuilder({ page }).include(".hk-selector-surface").analyze()).violations).toEqual([]);
          const bounds = await dialog.boundingBox();
          expect(bounds!.x).toBeGreaterThanOrEqual(0);
          expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
          await dialog.screenshot({ path: testInfo.outputPath("selector.png") });
          await choice.press("Enter");
          await expect(dialog).not.toBeVisible();
          await expect(trigger).toBeFocused();
          await expect(trigger).toContainText(family.choice);
          await trigger.click();
          await expect(input).toHaveValue("");
          await input.fill("nothingmatchesxyz");
          await expect(dialog.getByRole("status")).toContainText("No ");
          await input.press("Escape");
          await expect(dialog).not.toBeVisible();
        });
      }
    }
  }

  test(`${family.slug}: empty, read-only, long, disabled and outside dismissal`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 850 });
    await page.goto(`/#vercel:${family.slug}`);
    const scenario = page.getByLabel("Selector scenario");
    const trigger = page.locator(".hk-selector > button");
    await scenario.selectOption("empty");
    await trigger.click();
    await expect(page.getByRole("dialog").getByRole("status")).toBeVisible();
    await page.keyboard.press("Escape");
    await scenario.selectOption("read-only");
    await trigger.click();
    await page.locator("[data-hk-selector-item]").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await scenario.selectOption("long-content");
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("textbox")).toBeFocused();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    const outside = family.slug === "mic-selector" ? page.locator(".hkl-header") : page.locator(".hk-selector-overlay");
    await outside.click({ position: { x: 3, y: 3 } });
    await expect(dialog).not.toBeVisible();
    await scenario.selectOption("disabled");
    await expect(trigger).toBeDisabled();
  });
}

test("microphone host permission, errors and width alignment", async ({ page }) => {
  await page.goto("/#vercel:mic-selector");
  await page.getByLabel("Selector scenario").selectOption("denied");
  const trigger = page.locator(".hk-selector > button");
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("access is denied");
  expect(Math.abs((await trigger.boundingBox())!.width - (await dialog.boundingBox())!.width)).toBeLessThan(2);
  await dialog.getByRole("button", { name: "Request microphone access" }).click();
  await expect(page.locator("output").first()).toContainText("demo only");
  await page.keyboard.press("Escape");
  await page.getByLabel("Selector scenario").selectOption("error");
  await trigger.click();
  await expect(dialog.getByRole("alert")).toContainText("permissions have not changed");
});

test("voice preview is a sibling action, alternatives and forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/#vercel:voice-selector");
  await page.getByLabel("Alternative dialog part").check();
  await page.locator(".hk-selector > button").click();
  const dialog = page.getByRole("dialog");
  const preview = dialog.getByRole("button", { name: "Preview Eli" });
  await preview.click();
  await expect(preview).toContainText("Pause preview");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("[data-hk-selector-item][aria-pressed=true]")).toContainText("Maya");
  await expect(dialog.locator("[data-hk-selector-item][aria-pressed=true]")).toHaveCSS("border-inline-start-width", "2px");
  expect(await preview.evaluate(element => element.parentElement?.closest("button"))).toBeNull();
});

for (const width of [320, 390, 1440]) {
  test(`voice-selector: long names keep shortcuts readable and keyboard selection at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/#vercel:voice-selector");
    await page.getByLabel("Appearance", { exact: true }).selectOption(width === 1440 ? "dark" : "light");
    await page.getByLabel("Palette", { exact: true }).selectOption(width === 1440 ? "cozy" : "clean");
    await page.getByLabel("Selector scenario").selectOption("long-content");
    const trigger = page.locator(".hk-selector > button");
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "A voice that feels natural" });
    const input = dialog.getByRole("textbox");
    await expect(input).toBeFocused();
    await dialog.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
    await page.evaluate(() => document.fonts.ready);
    const geometry = await dialog.locator(".hk-voice-shortcut").evaluateAll(elements => elements.map(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const rectangle = element.getBoundingClientRect();
      const item = element.closest("[data-hk-selector-item]")!;
      const bounds = item.getBoundingClientRect();
      const name = item.querySelector(".hk-voice-name")!.getBoundingClientRect();
      return { text: element.textContent, lines: range.getClientRects().length, width: rectangle.width, height: rectangle.height, insideItem: rectangle.left >= bounds.left && rectangle.right <= bounds.right, separateFromName: name.right <= rectangle.left + 1 };
    }));
    await testInfo.attach("voice-shortcut-geometry", { body: JSON.stringify(geometry, null, 2), contentType: "application/json" });
    await dialog.screenshot({ path: testInfo.outputPath("voice-long-names.png") });
    expect(geometry.map(shortcut => shortcut.text)).toEqual(["Adult", "Adult", "Adult"]);
    expect(geometry.map(shortcut => shortcut.lines)).toEqual([1, 1, 1]);
    expect(geometry.every(shortcut => shortcut.insideItem && shortcut.separateFromName)).toBe(true);
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const choices = dialog.locator("[data-hk-selector-item]:visible");
    await input.press("ArrowDown");
    await expect(choices.first()).toBeFocused();
    await choices.first().press("End");
    await expect(choices.last()).toBeFocused();
    await dialog.screenshot({ path: testInfo.outputPath("voice-last-focused.png") });
    await choices.last().press("Home");
    await expect(choices.first()).toBeFocused();
    await choices.first().press("ArrowDown");
    await expect(choices.nth(1)).toBeFocused();
    await choices.nth(1).press("Enter");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText("Eli");
    await trigger.click();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");
    await input.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}
