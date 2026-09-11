import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("language selection is keyboard controlled and host refusal preserves source", async ({ page }) => {
  await page.goto("/#vercel:code-block");
  const block = page.locator(".hk-code-example");
  const trigger = block.getByRole("button", { name: "Code language" });
  await expect(block.locator(".hk-code-token").first()).toBeVisible();
  await block.getByLabel("Hold language requests").check();
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(block.getByRole("option", { name: "TypeScript" })).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(trigger).toBeFocused();
  await expect(block.locator("code")).toContainText("result: string");
  await block.getByLabel("Hold language requests").uncheck();
  await trigger.click();
  await page.keyboard.press("j");
  await expect(block.getByRole("option", { name: "JavaScript" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(block.locator("code")).not.toContainText("result: string");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press("Tab");
  await expect(block.getByRole("listbox")).toHaveCount(0);
  await expect(block.getByRole("button", { name: "Copy code" })).toBeFocused();
  await block.getByLabel("Disable code controls").check();
  await expect(trigger).toBeDisabled();
  await expect(block.getByRole("button", { name: "Copy code" })).toBeDisabled();
});

test("copy preserves CRLF and reports denied clipboard access", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { document.documentElement.dataset.copied = text; } } }));
  await page.goto("/#vercel:code-block");
  const block = page.locator(".hk-code-example");
  await block.getByRole("button", { name: "Copy code" }).click();
  expect(await page.evaluate(() => document.documentElement.dataset.copied)).toBe('const result: string = "Work complete";\r\n\r\nconsole.log(result);\r\n');
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Denied"); } } }));
  await block.getByRole("button", { name: "Copy code" }).click();
  await expect(block.getByRole("status")).toHaveText("Copy failed");
});

for (const width of [1512, 390]) for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`code block ${width} ${mode} ${palette}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#vercel:code-block");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const block = page.locator(".hk-code-example");
    const token = block.locator(".hk-code-token").first();
    await expect(token).toBeVisible();
    await expect(token).toHaveCSS("color", mode === "dark" ? "rgb(249, 117, 131)" : "rgb(215, 58, 73)");
    await block.getByRole("button", { name: "Code language" }).click();
    await expect(block.getByRole("option", { name: "JavaScript" })).toBeVisible();
    expect((await new AxeBuilder({ page }).include(".hk-code-example").analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await block.screenshot({ path: test.info().outputPath("code-block.png") });
  });
}
