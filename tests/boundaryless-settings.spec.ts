import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("settings portals, traps focus, closes through each route and resets page", async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  const trigger = page.getByRole("button", { name: "Open settings", exact: true });
  await page.getByLabel("Initial settings page").selectOption("profile");
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await expect(dialog.getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
  expect(await dialog.evaluate(element => !element.closest(".hkl-root"))).toBe(true);
  for (let count = 0; count < 9; count++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await dialog.getByRole("button", { name: "Tools", exact: true }).click();
  await expect(dialog.getByText("No connected tools in this preview.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog.getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
  await page.locator(".hk-settings-overlay").click({ position: { x: 2, y: 2 } });
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("button", { name: "Close settings" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Close requests", exact: true })).toHaveText("3");
});

test("host refusal keeps dialog active and local values stay host-owned", async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Hold close requests").check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Profile", exact: true }).click();
  await dialog.getByLabel("Workspace name").fill("Research studio");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Workspace name")).toHaveValue("Research studio");
  await expect(page.locator('[aria-label="Close requests"]')).toHaveText("1");
});

test("portal follows system theme changes while open and image failures fall back", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Custom plan artwork").check();
  await page.getByLabel("Broken plan artwork").check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await expect(page.locator(".hk-settings-portal")).toHaveAttribute("data-mode", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator(".hk-settings-portal")).toHaveAttribute("data-mode", "dark");
  await expect(page.getByRole("img", { name: "Plan artwork", exact: true })).toHaveAttribute("data-artwork", "native");
  await expect(page.locator('.hk-settings-plan-art span').first()).toHaveCSS("animation-name", "none");
});

test("native dialog-form submission remains a host-controlled close request", async ({ page }) => {
  await page.goto("/#boardui:settings-modal");
  await page.getByLabel("Hold close requests").check();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings", exact: true });
  await dialog.evaluate(element => {
    const form = document.createElement("form");
    form.method = "dialog";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Native done";
    form.append(submit);
    element.append(form);
  });
  await dialog.getByRole("button", { name: "Native done" }).click();
  await expect(dialog).toBeVisible();
  await expect(page.locator('output[aria-label="Close requests"]')).toHaveText("1");
  await expect(dialog.getByRole("button", { name: "Native done" })).toBeFocused();
});

for (const width of [1512, 390]) for (const mode of ["light", "dark"] as const) for (const palette of ["clean", "cozy"]) {
  test(`settings ${width} ${mode} ${palette}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1040 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/#boardui:settings-modal");
    await page.getByLabel("Palette", { exact: true }).selectOption(palette);
    await page.getByRole("button", { name: "Open settings", exact: true }).click();
    const dialog = page.getByRole("dialog");
    for (const name of ["General", "Profile", "Tools", "Storage"]) {
      await dialog.getByRole("button", { name, exact: true }).click();
      await expect(dialog.getByRole("heading", { name, exact: true })).toBeVisible();
      expect((await new AxeBuilder({ page }).include(".hk-settings-portal").analyze()).violations).toEqual([]);
    }
    await dialog.getByRole("button", { name: "General", exact: true }).click();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await dialog.screenshot({ path: test.info().outputPath("settings.png") });
  });
}
