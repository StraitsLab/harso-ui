import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const appearance of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`Question selected paint survives base button cascade ${appearance}/${palette}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/#vercel:question");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const option = page.locator("form").getByRole("button", { name: "Continue", exact: true });
    await option.press("Space");
    await page.mouse.move(0, 0);
    await expect(option).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => option.evaluate(element => {
      const style = getComputedStyle(element);
      return { border: style.borderTopColor === style.color, fill: style.backgroundColor !== "rgba(0, 0, 0, 0)" };
    })).toEqual({ border: true, fill: true });
    await option.screenshot({ path: testInfo.outputPath("selected.png") });
  });
}

test("standalone code content renders exact highlighted source and returns to composition", async ({ page }) => {
  await page.goto("/#vercel:code-block");
  const example = page.locator(".hk-code-example");
  const source = await example.locator("code").textContent();
  await example.getByLabel("Standalone code content").check();
  await expect(example.locator(".hk-code-block")).toHaveCount(0);
  await expect(example.locator("code")).toHaveCount(1);
  expect(await example.locator("code").textContent()).toBe(source);
  await expect(example.locator(".hk-code-token").first()).toBeVisible();
  await expect(example.locator(".hk-code-container")).toHaveCSS("content-visibility", "auto");
  await expect(example.locator(".hk-code-line-number")).toHaveCount(4);
  await example.locator("pre").focus();
  await expect(example.locator("pre")).toBeFocused();
  expect((await new AxeBuilder({ page }).include(".hk-code-example").analyze()).violations).toEqual([]);
  await example.getByLabel("Standalone code content").uncheck();
  await expect(example.locator("code")).toHaveCount(1);
  await example.getByRole("button", { name: "Code language" }).click();
  await example.getByRole("option", { name: "JavaScript", exact: true }).click();
  await expect(example.locator("code")).not.toContainText(": string");
});

test("Question rejects prevented clicks and retains keyboard option admission", async ({ page }) => {
  await page.goto("/#vercel:question");
  const option = page.locator("form").getByRole("button", { name: "Continue", exact: true });
  await expect(option).toHaveAttribute("aria-pressed", "false");
  await option.evaluate(element => element.addEventListener("click", event => event.preventDefault(), { once: true }));
  await option.click();
  await expect(option).toHaveAttribute("aria-pressed", "false");
  await option.focus();
  await page.keyboard.press("Space");
  await expect(option).toHaveAttribute("aria-pressed", "true");
});
