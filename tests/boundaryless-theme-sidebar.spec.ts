import { expect, test } from "@playwright/test";

for (const width of [390, 1512]) for (const mode of ["light", "dark"] as const) {
  test(`theme sidebar expanded and collapsed retain ${mode} appearance at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:theme-toggle");
    const example = page.getByTestId("live-example");
    const provider = example.locator(".hkl-theme-example");
    const placement = example.getByLabel("Theme placement", { exact: true });
    await placement.selectOption("expanded");
    const sidebar = example.getByRole("complementary", { name: "Appearance workspace", exact: true });
    await expect(sidebar).toBeVisible();
    await expect(sidebar).not.toHaveAttribute("data-collapsed");
    await expect(sidebar.getByRole("button", { name: "Overview", exact: true })).toBeVisible();
    await sidebar.getByRole("radio", { name: mode === "light" ? "Light" : "Dark", exact: true }).check();
    await expect(provider).toHaveAttribute("data-appearance", mode);
    await expect(provider).toHaveAttribute("data-mode", mode);
    await expect(sidebar.getByRole("radio", { name: mode === "light" ? "Light" : "Dark", exact: true })).toBeChecked();
    const expandedWidth = (await sidebar.boundingBox())!.width;
    await sidebar.getByRole("button", { name: "Collapse navigation", exact: true }).click();
    await expect(placement).toHaveValue("collapsed");
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");
    const compact = sidebar.getByRole("button", { name: `Change appearance, currently ${mode}`, exact: true });
    await expect(compact).toBeVisible();
    await expect(sidebar.getByRole("radio")).toHaveCount(0);
    await expect(provider).toHaveAttribute("data-mode", mode);
    expect((await sidebar.boundingBox())!.width).toBeLessThan(expandedWidth);
    const sidebarBounds = (await sidebar.boundingBox())!;
    const compactBounds = (await compact.boundingBox())!;
    expect(compactBounds.x).toBeGreaterThanOrEqual(sidebarBounds.x);
    expect(compactBounds.x + compactBounds.width).toBeLessThanOrEqual(sidebarBounds.x + sidebarBounds.width);
    await sidebar.screenshot({ path: test.info().outputPath(`collapsed-${mode}-${width}.png`) });
    await compact.focus();
    await page.keyboard.press("Space");
    const next = mode === "light" ? "dark" : "system";
    await expect(provider).toHaveAttribute("data-appearance", next);
    await expect(sidebar.getByRole("button", { name: `Change appearance, currently ${next}`, exact: true })).toBeFocused();
    await sidebar.getByRole("button", { name: "Expand navigation", exact: true }).click();
    await expect(placement).toHaveValue("expanded");
    await expect(sidebar.getByRole("radio", { name: next === "dark" ? "Dark" : "System", exact: true })).toBeChecked();
    await sidebar.getByRole("radio", { name: mode === "light" ? "Light" : "Dark", exact: true }).check();
    await sidebar.screenshot({ path: test.info().outputPath(`expanded-${mode}-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await placement.selectOption("standalone");
    await expect(sidebar).toHaveCount(0);
    await expect(provider.getByRole("radio", { name: mode === "light" ? "Light" : "Dark", exact: true })).toBeChecked();
    await expect(provider.getByRole("button", { name: `Change appearance, currently ${mode}`, exact: true })).toBeVisible();
  });
}

test("disabled sidebar placements cannot change the selected appearance", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#boardui:theme-toggle");
  const example = page.getByTestId("live-example");
  const placement = example.getByLabel("Theme placement", { exact: true });
  const provider = example.locator(".hkl-theme-example");
  await placement.selectOption("collapsed");
  await page.getByLabel("Example state", { exact: true }).selectOption("disabled");
  await expect(example.getByRole("button", { name: "Change appearance, currently system", exact: true })).toBeDisabled();
  await expect(provider).toHaveAttribute("data-appearance", "system");
  await placement.selectOption("expanded");
  for (const name of ["System", "Light", "Dark"]) await expect(example.getByRole("radio", { name, exact: true })).toBeDisabled();
  await expect(provider).toHaveAttribute("data-appearance", "system");
});
