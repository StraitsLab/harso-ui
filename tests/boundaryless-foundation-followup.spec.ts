import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const appearance of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) for (const width of [390, 1440]) {
  test(`native rich select ${appearance}/${palette}/${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
    await page.goto("/#boardui:select");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    const select = page.getByRole("combobox", { name: "Rich audience", exact: true });
    await select.click();
    await expect(select.locator("option[value=team] .hk-select-item-detail")).toBeVisible();
    await expect(select.locator("option[value=external]")).toBeDisabled();
    await page.screenshot({ path: test.info().outputPath("rich-select-open.png") });
    await page.keyboard.press("e");
    await page.keyboard.press("Enter");
    await expect(select).toHaveValue("everyone");
    await expect(page.getByTestId("controls-example").getByRole("combobox", { name: "Audience", exact: true })).toHaveValue("everyone");
    await expect(select.locator("selectedcontent")).toHaveText(/Everyone/);
    await expect(select.locator("selectedcontent .hk-select-item-detail")).toBeHidden();
    await select.click();
    await page.keyboard.press("Escape");
    await expect(select).toBeFocused();
    expect((await new AxeBuilder({ page }).include('[data-testid="controls-example"]').analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

test("grouped OTP and slider bubble follow actual input and reset", async ({ page }) => {
  await page.goto("/#boardui:input-otp");
  const example = page.getByTestId("controls-example");
  const input = example.getByRole("textbox", { name: "One-time code" });
  await input.pressSequentially("123456");
  await expect(input).toHaveValue("123456");
  expect(await input.evaluate(element => (element as HTMLInputElement).selectionStart)).toBe(6);
  await expect(example.locator("[data-otp-slot]")).toHaveCount(6);
  expect(await example.locator("[data-otp-slot]").allTextContents()).toEqual(["1", "2", "3", "4", "5", "6"]);
  await example.getByRole("button", { name: "Clear code" }).click();
  await expect(input).toHaveValue("");
  await page.goto("/#boardui:slider");
  const slider = example.getByRole("slider", { name: "Volume · 45%" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(example.locator(".hk-slider-value")).toHaveText("46%");
  await page.getByRole("button", { name: "Reset range" }).click();
  await expect(example.locator(".hk-slider-value")).toHaveText("45%");
});

test("canvas controls affect one viewport and honor host refusal", async ({ page }) => {
  await page.goto("/#vercel:canvas");
  const canvas = page.getByRole("region", { name: "Work canvas" });
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.getByLabel("Canvas viewport", { exact: true })).toContainText("120%");
  await page.getByRole("checkbox", { name: "Keep supplied canvas state" }).check();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.getByLabel("Canvas viewport", { exact: true })).toContainText("120%");
  await page.getByRole("checkbox", { name: "Keep supplied canvas state" }).uncheck();
  await canvas.focus();
  await page.keyboard.press("ControlOrMeta+a");
  await expect(page.getByLabel("Canvas selection", { exact: true })).toHaveText("research, result");
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Canvas selection", { exact: true })).toHaveText("Nothing selected");
  await page.getByRole("button", { name: "Toggle interactivity" }).click();
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeDisabled();
  await page.getByRole("button", { name: "Toggle interactivity" }).click();
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
});
